# File: backend/routes/story_routes.py
"""
FastAPI Routes for Brahmand Library - Cosmic Storyteller Mode ("मैं समय हूँ").
Provides chapter story JSON loading with validation, and scene audio streaming
with HTTP Range support and embedded X-Timing-Manifest cue headers.
"""

import json
from pathlib import Path
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from schemas.gita_story_schema import GitaStoryChapter, StoryScene, ChintanBindu
from services.audio_cache import AudioCacheManager
from services.tts_adapter import EdgeTTSAdapter


story_router = APIRouter(prefix="/api/library/bhagavad-gita", tags=["Story Mode"])

STORY_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "gita_stories"
_tts_adapter = EdgeTTSAdapter(
    voice="hi-IN-MadhurNeural",
    rate="-14%",
    pitch="-6Hz",
    sentence_pause_ms=450,
    block_pause_ms=850,
)
_cache_manager = AudioCacheManager()


@story_router.get("/story/{chapter}", summary="Get dramatic story chapter script with acts and dialogues")
async def get_gita_story_chapter(chapter: int):
    """
    Load and return the validated dramatic story narrative for a Gita chapter.
    Caches for 24 hours on client/CDN.
    """
    if not (1 <= chapter <= 18):
        raise HTTPException(status_code=400, detail="Invalid chapter number. Must be between 1 and 18.")

    chapter_file = STORY_DATA_DIR / f"chapter_{chapter}.json"
    if not chapter_file.exists():
        raise HTTPException(status_code=404, detail=f"Story for chapter {chapter} not found.")

    try:
        with open(chapter_file, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        # Validate strictly against Pydantic schema
        validated_chapter = GitaStoryChapter.model_validate(raw_data)

        return JSONResponse(
            content=validated_chapter.model_dump(),
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[StoryRoutes] Error loading story chapter {chapter}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load story chapter: {str(e)}")


@story_router.get("/story-audio/{chapter}/{scene_id}", summary="Stream scene audio with timing manifest cues")
async def get_gita_story_scene_audio(request: Request, chapter: int, scene_id: str):
    """
    Stream synthesized scene narration audio using the deep Voice of Time.
    Supports HTTP Range requests (206 Partial Content) for instant seeking.
    Injects timing manifest cues directly into the 'X-Timing-Manifest' response header.
    """
    if not (1 <= chapter <= 18):
        raise HTTPException(status_code=400, detail="Invalid chapter number. Must be between 1 and 18.")

    chapter_file = STORY_DATA_DIR / f"chapter_{chapter}.json"
    if not chapter_file.exists():
        raise HTTPException(status_code=404, detail=f"Story for chapter {chapter} not found.")

    # 1. Load chapter and find targeted scene
    try:
        with open(chapter_file, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        validated_chapter = GitaStoryChapter.model_validate(raw_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Story data validation failed: {str(e)}")

    if scene_id in ("full", "all", "continuous"):
        try:
            audio_file_path, timing_manifest = await _cache_manager.ensure_full_chapter_cache_exists(
                chapter=chapter,
                tts_adapter=_tts_adapter,
                chapter_data=validated_chapter,
            )
        except Exception as e:
            print(f"[StoryRoutes] Synthesis error for full chapter {chapter}: {e}")
            raise HTTPException(status_code=500, detail=f"Full chapter audio synthesis failed: {str(e)}")
    else:
        if scene_id in ("opening", "scene_intro", "intro"):
            target_scene = StoryScene(
                scene_id="opening",
                seq=1,
                title_hi=f"अध्याय {validated_chapter.chapter}: {validated_chapter.title_hindi} (प्रस्तावना)",
                title_en=f"Chapter {validated_chapter.chapter}: {validated_chapter.title_english} (Prologue)",
                start_verse=1,
                end_verse=1,
                display_range=f"अध्याय {validated_chapter.chapter}",
                narrative_hindi=(
                    f"श्रीमद्भगवद्गीता। अध्याय {validated_chapter.chapter}—{validated_chapter.title_hindi}। "
                    f"{validated_chapter.time_opening_monologue}"
                ),
                dialogues=[],
                chintan_bindu=ChintanBindu(
                    sutra_title="काल-चेतना और मानवीय द्वंद्व",
                    vedantic_concept="सनातन काल-प्रवाह (Cosmic Perspective)",
                    inner_reflection="समय की अनंत धारा में हर द्वंद्व, हर संघर्ष और हर मोह अपनी नश्वरता को पहचानता है।",
                ),
                deeper_study_ref=f"/library/bhagavad-gita-3d?chapter={chapter}",
                transcript=f"मैं समय हूँ। अध्याय {validated_chapter.chapter}: {validated_chapter.title_hindi}। {validated_chapter.time_opening_monologue}",
                duration_seconds_est=55,
            )
        else:
            target_scene = next((s for s in validated_chapter.scenes if s.scene_id == scene_id), None)

        if not target_scene:
            raise HTTPException(
                status_code=404,
                detail=f"Scene '{scene_id}' not found in chapter {chapter}.",
            )

        # 2. Ensure audio and timing manifest are cached on disk
        try:
            audio_file_path, timing_manifest = await _cache_manager.ensure_cache_exists(
                chapter=chapter,
                scene_id=scene_id,
                tts_adapter=_tts_adapter,
                scene_data=target_scene,
            )
        except Exception as e:
            print(f"[StoryRoutes] Synthesis error for scene {scene_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Audio synthesis failed: {str(e)}")

    # 3. Serialize timing manifest into URL-encoded header
    encoded_manifest = quote(json.dumps(timing_manifest, ensure_ascii=False))

    extra_headers = {
        "X-Timing-Manifest": encoded_manifest,
        "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, X-Timing-Manifest",
    }

    # 4. Stream file supporting HTTP Range requests
    range_header = request.headers.get("range") or request.headers.get("Range")
    return _cache_manager.stream_file(
        file_path=audio_file_path,
        range_header=range_header,
        extra_headers=extra_headers,
    )
