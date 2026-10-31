# File: backend/services/audio_cache.py
"""
Audio Cache Manager for Cosmic Storyteller Mode.
Manages disk persistence of synthesized scene audio and timing manifests,
and provides robust HTTP Range chunk streaming for media players.
"""

import json
import os
from pathlib import Path
import re
from typing import Any, AsyncGenerator, Dict, Optional, Tuple
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from schemas.gita_story_schema import StoryScene, ChintanBindu
from services.tts_adapter import TTSAdapter, get_silence


CHUNK_SIZE = 64 * 1024  # 64 KB streaming chunks


class AudioCacheManager:
    """
    Manages persistent disk cache for scene MP3s and companion timing manifest JSONs.
    Handles partial content streaming (HTTP 206) for responsive audio seeking.
    """

    def __init__(self, cache_dir: Optional[Path] = None):
        if cache_dir is None:
            self.cache_dir = Path(__file__).resolve().parent.parent / "data" / "gita_story_cache"
        else:
            self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_cache_path(self, chapter: int, scene_id: str) -> str:
        """Get the absolute file path for a cached scene MP3."""
        clean_scene = re.sub(r"[^a-zA-Z0-9_\-]", "_", scene_id)
        filename = f"story_ch{chapter}_{clean_scene}.mp3"
        return str(self.cache_dir / filename)

    def get_manifest_path(self, chapter: int, scene_id: str) -> str:
        """Get the absolute file path for a scene's timing manifest JSON."""
        clean_scene = re.sub(r"[^a-zA-Z0-9_\-]", "_", scene_id)
        filename = f"story_ch{chapter}_{clean_scene}.manifest.json"
        return str(self.cache_dir / filename)

    async def ensure_cache_exists(
        self,
        chapter: int,
        scene_id: str,
        tts_adapter: TTSAdapter,
        scene_data: StoryScene,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Ensure the audio file and its companion timing manifest exist on disk.
        If missing or empty, synthesizes via tts_adapter and writes manifest.
        """
        audio_path_str = self.get_cache_path(chapter, scene_id)
        manifest_path_str = self.get_manifest_path(chapter, scene_id)

        audio_file = Path(audio_path_str)
        manifest_file = Path(manifest_path_str)

        # 1. Check if both valid audio and manifest already exist
        if audio_file.exists() and audio_file.stat().st_size > 1000 and manifest_file.exists():
            try:
                with open(manifest_file, "r", encoding="utf-8") as f:
                    manifest_data = json.load(f)
                return audio_path_str, manifest_data
            except Exception as e:
                print(f"[AudioCacheManager] Corrupted manifest for {scene_id}, regenerating: {e}")

        # 2. Synthesize audio and generate timing manifest
        manifest_data = await tts_adapter.generate_scene_audio(scene_data, audio_path_str)

        # 3. Write manifest JSON
        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, ensure_ascii=False, indent=2)

        return audio_path_str, manifest_data

    async def ensure_full_chapter_cache_exists(
        self,
        chapter: int,
        tts_adapter: TTSAdapter,
        chapter_data: Any,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Synthesize or assemble all scenes and opening prologue into ONE seamless,
        uninterrupted, cinematic audio stream without any buffering gaps or breaks.
        Returns the unified full MP3 path and unified timing manifest.
        """
        full_audio_path_str = self.get_cache_path(chapter, "full")
        full_manifest_path_str = self.get_manifest_path(chapter, "full")

        full_audio_file = Path(full_audio_path_str)
        full_manifest_file = Path(full_manifest_path_str)

        if full_audio_file.exists() and full_audio_file.stat().st_size > 50000 and full_manifest_file.exists():
            try:
                with open(full_manifest_file, "r", encoding="utf-8") as f:
                    manifest_data = json.load(f)
                return full_audio_path_str, manifest_data
            except Exception as e:
                print(f"[AudioCacheManager] Corrupted full manifest for ch{chapter}, regenerating: {e}")

        # 1. Build opening prologue scene
        opening_scene = StoryScene(
            scene_id="opening",
            seq=1,
            title_hi=f"अध्याय {chapter_data.chapter}: {chapter_data.title_hindi} (प्रस्तावना)",
            title_en=f"Chapter {chapter_data.chapter}: {chapter_data.title_english} (Prologue)",
            start_verse=1,
            end_verse=1,
            display_range=f"अध्याय {chapter_data.chapter}",
            narrative_hindi=(
                f"श्रीमद्भगवद्गीता। अध्याय {chapter_data.chapter}—{chapter_data.title_hindi}। "
                f"{chapter_data.time_opening_monologue}"
            ),
            dialogues=[],
            chintan_bindu=ChintanBindu(
                sutra_title="काल-चेतना और मानवीय द्वंद्व",
                vedantic_concept="सनातन काल-प्रवाह (Cosmic Perspective)",
                inner_reflection="समय की अनंत धारा में हर द्वंद्व, हर संघर्ष और हर मोह अपनी नश्वरता को पहचानता है।",
            ),
            deeper_study_ref=f"/library/bhagavad-gita-3d?chapter={chapter}",
            transcript=f"मैं समय हूँ। अध्याय {chapter_data.chapter}: {chapter_data.title_hindi}। {chapter_data.time_opening_monologue}",
            duration_seconds_est=55,
        )

        all_segments_to_merge = [opening_scene] + list(chapter_data.scenes)

        combined_audio_bytes = []
        combined_cues = []
        current_offset_ms = 0
        scene_transition_silence = get_silence(950)  # 950ms deep cinematic breath between scenes

        for seg_idx, scene_item in enumerate(all_segments_to_merge):
            scene_audio_path, scene_manifest = await self.ensure_cache_exists(
                chapter=chapter,
                scene_id=scene_item.scene_id,
                tts_adapter=tts_adapter,
                scene_data=scene_item,
            )

            with open(scene_audio_path, "rb") as sf:
                scene_bytes = sf.read()

            combined_audio_bytes.append(scene_bytes)

            # Map cues with updated time offsets and scene_id
            for cue in scene_manifest.get("cues", []):
                combined_cues.append({
                    "scene_id": scene_item.scene_id,
                    "mark": cue.get("mark"),
                    "text": cue.get("text"),
                    "start_ms": cue.get("start_ms", 0) + current_offset_ms,
                    "end_ms": cue.get("end_ms", 0) + current_offset_ms,
                })

            # Calculate scene duration from bytes (6 bytes per ms for 48kbps mono MP3)
            scene_duration_ms = int(len(scene_bytes) / 6.0)
            current_offset_ms += scene_duration_ms

            # Append cinematic silence between scenes (except after the final scene)
            if seg_idx < len(all_segments_to_merge) - 1:
                combined_audio_bytes.append(scene_transition_silence)
                current_offset_ms += 950

        # Write unified full MP3
        with open(full_audio_file, "wb") as f:
            f.write(b"".join(combined_audio_bytes))

        # Write unified full timing manifest
        full_manifest = {
            "scene_id": "full",
            "chapter": chapter,
            "total_duration_ms": current_offset_ms,
            "cues": combined_cues,
        }
        with open(full_manifest_file, "w", encoding="utf-8") as f:
            json.dump(full_manifest, f, ensure_ascii=False, indent=2)

        return full_audio_path_str, full_manifest

    def stream_file(
        self,
        file_path: str,
        range_header: Optional[str] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> StreamingResponse:
        """
        Stream an audio file with full HTTP Range request support (206 Partial Content).
        Allows mobile and web audio players to seek seamlessly.
        """
        path = Path(file_path)
        if not path.is_file():
            raise HTTPException(status_code=404, detail="Audio file not found")

        file_size = path.stat().st_size
        headers: Dict[str, str] = {
            "Content-Type": "audio/mpeg",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=2592000",
        }

        if extra_headers:
            headers.update(extra_headers)

        # Parse HTTP Range header if present e.g. 'bytes=0-1024' or 'bytes=1024-'
        if range_header:
            range_match = re.match(r"^bytes=(\d*)-(\d*)$", range_header.strip())
            if not range_match:
                raise HTTPException(status_code=416, detail="Invalid Range header format")

            start_str, end_str = range_match.groups()
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1

            if start >= file_size or end >= file_size or start > end:
                raise HTTPException(
                    status_code=416,
                    detail="Requested Range Not Satisfiable",
                    headers={"Content-Range": f"bytes */{file_size}"},
                )

            content_length = end - start + 1
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            headers["Content-Length"] = str(content_length)

            async def iter_range() -> AsyncGenerator[bytes, None]:
                with open(path, "rb") as f:
                    f.seek(start)
                    bytes_remaining = content_length
                    while bytes_remaining > 0:
                        chunk_to_read = min(CHUNK_SIZE, bytes_remaining)
                        data = f.read(chunk_to_read)
                        if not data:
                            break
                        bytes_remaining -= len(data)
                        yield data

            return StreamingResponse(iter_range(), status_code=206, headers=headers)

        # No range header: return complete 200 OK stream
        headers["Content-Length"] = str(file_size)

        async def iter_full() -> AsyncGenerator[bytes, None]:
            with open(path, "rb") as f:
                while True:
                    data = f.read(CHUNK_SIZE)
                    if not data:
                        break
                    yield data

        return StreamingResponse(iter_full(), status_code=200, headers=headers)
