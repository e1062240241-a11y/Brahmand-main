from pathlib import Path
from typing import Any, Dict, List


from services.library_loader import ChapterFileBook

BHAGAVAD_GITA_CHAPTER_DATA_DIR = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "bhavykhatri DharmicData bhavykhatri-AddTransForGita SrimadBhagvadGita"
)


def _normalize_bhagavad_gita_chapter(rows: List[Any], chapter_number: int) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                "chapter": row.get("chapter"),
                "verse": row.get("verse"),
                "text": row.get("text") or "",
                "translations": row.get("translations") if isinstance(row.get("translations"), dict) else {},
            }
        )
    return normalized


_loader = ChapterFileBook(
    book="bhagavad-gita",
    book_title="Bhagavad Gita",
    chapter_label="Chapter",
    data_dir=BHAGAVAD_GITA_CHAPTER_DATA_DIR,
    chapter_count=18,
    chapter_file=lambda n: BHAGAVAD_GITA_CHAPTER_DATA_DIR / f"bhagavad_gita_chapter_{n}.json",
    rows_from=lambda payload: payload.get("BhagavadGitaChapter"),
    normalize=_normalize_bhagavad_gita_chapter,
)

router = _loader.build_router(prefix="/library/bhagavad-gita", tags=["Bhagavad Gita"])

import hashlib
import re
from fastapi import HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse

TTS_CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "tts_cache"
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

GITA_AUDIO_CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "gita_audio_cache"
GITA_AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Standard silent frame for 24000 Hz, 48 kbps MPEG-2 Layer 3 (144 bytes = 24ms of silence)
SILENT_FRAME = bytes([255, 243, 100, 196, 124, 0, 0, 3, 72, 0, 0, 0, 0, 170, 170, 170] + [170] * 128)


def get_silence(seconds: float) -> bytes:
    """Generate exact silence bytes for MPEG-2 Layer 3 audio."""
    frame_count = max(1, int(round(seconds * 24000 / 576)))
    return SILENT_FRAME * frame_count


def prepare_sanskrit_for_tts(text: str) -> str:
    """
    Refine Sanskrit Devanagari text for authentic pronunciation in Indian Neural TTS:
    1. Clean Vedic cantillations, brackets, and verse numbering (e.g. ।।1.1।।).
    2. Smooth Avagraha ('ऽ') so Sandhi elisions flow naturally in speech.
    3. Restore Visarga ('ः') phonetics (which Hindi neural voices ignore/drop):
       - After 'aa' (ाः) -> 'ाह' (e.g. मामकाः -> मामकाह)
       - After 'i' (िः) -> 'िहि' (e.g. हरिः -> हरिहि)
       - After 'ee' (ीः) -> 'ीहि'
       - After 'u' (ुः) -> 'ुहु' (e.g. विष्णुः -> विष्णुहु)
       - After 'oo' (ूः) -> 'ूहु'
       - After 'e' (ेः) -> 'ेहे'
       - After 'ai' (ैः) -> 'ैहे'
       - After 'o' (ोः) -> 'ोहो'
       - After short 'a' (consonant with inherent 'a') -> 'ह' (e.g. युयुत्सवः -> युयुत्सवह)
    4. Convert word/pada-final Anusvara ('ं') before space/danda to 'म्' (पदान्ते मकारः).
    """
    t = (text or "").strip()
    if not t:
        return ""

    # Clean Vedic accents & trailing numbering like ।।1.1।।
    t = re.sub(r'[\u1CD0-\u1CFF\u0951-\u0952\uA8E0-\uA8F1]', '', t)
    t = re.sub(r'(?:।।|॥|\/\/|\|\|)\s*\d+(?:\.\d+)?\s*(?:।।|॥|\/\/|\|\|)', '', t)
    t = re.sub(r'^\s*\d+(?:\.\d+)?\.?\s*', '', t)
    t = re.sub(r'\s*\d+(?:\.\d+)?\.?\s*$', '', t)
    t = re.sub(r'\([^)]*\)', '', t)
    t = re.sub(r'\[[^\]]*\]', '', t)

    # Smooth Avagraha (ऽ) so Sandhi flows seamlessly
    t = t.replace('ऽ', '')

    # Visarga phonetics
    t = re.sub(r'ाः', 'ाह', t)
    t = re.sub(r'िः', 'िहि', t)
    t = re.sub(r'ीः', 'ीहि', t)
    t = re.sub(r'ुः', 'ुहु', t)
    t = re.sub(r'ूः', 'ूहु', t)
    t = re.sub(r'ेः', 'ेहे', t)
    t = re.sub(r'ैः', 'ैहे', t)
    t = re.sub(r'ोः', 'ोहो', t)
    t = re.sub(r'([क-ह]़?)ः', r'\1ह', t)
    t = re.sub(r'ः', 'ह', t)

    # Pada-ending Anusvara before punctuation/space/line-break -> 'म्'
    t = re.sub(r'([क-ह]़?[ा-ौ]?)ं(?=[\s।॥,.\n]|$)', r'\1म्', t)

    return t


def clean_hindi_for_tts(text: str) -> str:
    """
    Clean Hindi translation text for natural, accurate speech recitation:
    1. Strip verse numbers like ।।1.1।।, 1.1, ।।3.1 -- 3.2।।
    2. Strip footnote annotations like (टिप्पणी प0 1.2), [टिप्पणी...]
    3. Remove Sanskrit glosses in parentheses like (युयुत्सव:) so colons/brackets are not read aloud
    4. Clean corrupt duplicate matras (e.g. मेरेे -> मेरे)
    5. Replace double hyphens with natural commas
    """
    if not text:
        return ""
    t = text.strip()
    # Strip leading and inline verse markers
    t = re.sub(r'^(?:।।|॥|\/\/|\|\|)?\s*\d+(?:\.\d+)?(?:\s*--\s*\d+(?:\.\d+)?)?\s*(?:।।|॥|\/\/|\|\|)?\.?\s*', '', t)
    t = re.sub(r'(?:।।|॥|\/\/|\|\|)\s*\d+(?:\.\d+)?\s*(?:।।|॥|\/\/|\|\|)', '', t)

    # Strip footnote annotations
    t = re.sub(r'\s*\([^)]*टिप्पणी[^)]*\)\s*', ' ', t)
    t = re.sub(r'\s*\[[^\]]*टिप्पणी[^\]]*\]\s*', ' ', t)
    t = re.sub(r'\s*\([^)]*प0[^)]*\)\s*', ' ', t)

    # Clean parenthetical words with colons or glosses so brackets/colons are not read aloud
    t = re.sub(r'\s*\(\s*([^)]*?):?\s*\)\s*', r' ', t)
    t = re.sub(r'\s*\[\s*([^\]]*?):?\s*\]\s*', r' ', t)

    # Fix corrupt duplicate matras
    t = re.sub(r'([\u093E-\u094C])[\u093E-\u094C]+', r'\1', t)

    # Clean double dashes and stray symbols
    t = re.sub(r'\s*--\s*', ', ', t)
    t = re.sub(r'\s*-\s*', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def build_meditative_segments(text: str, is_sanskrit: bool = True) -> List[tuple[str, float]]:
    """
    Split text into rhythmic chanting segments with natural breath pauses:
    - Sanskrit: speaker headings (0.3s), padas (0.25s), shloka end (0.35s)
    - Hindi: clean prose sentences with natural pauses (0.25s - 0.35s)
    """
    raw_t = (text or "").strip()
    if not raw_t:
        return []

    if is_sanskrit:
        t = prepare_sanskrit_for_tts(raw_t)
        segments: List[tuple[str, float]] = []

        # Check for speaker heading (e.g. धृतराष्ट्र उवाच, सञ्जय उवाच, श्रीभगवानुवाच, अर्जुन उवाच)
        speaker_match = re.match(r'^([^\n]+उवाच[^\n]*)(?:\n+|।+|\s+)', t)
        if speaker_match:
            heading = speaker_match.group(1).strip()
            segments.append((heading, 0.3))
            t = t[speaker_match.end():].strip()

        raw_lines = [l.strip() for l in re.split(r'[\n]+', t) if l.strip()]
        for line in raw_lines:
            sub_lines = [s.strip() for s in re.split(r'[।॥]', line) if s.strip()]
            if not sub_lines:
                continue
            for idx, sub in enumerate(sub_lines):
                is_last = (idx == len(sub_lines) - 1)
                pause = 0.35 if is_last else 0.25
                segments.append((sub, pause))
        return segments
    else:
        # Clean Hindi translation prose
        clean_hindi = clean_hindi_for_tts(raw_t)
        sentences = [s.strip() for s in re.split(r'(?<=[.?!।;])\s+', clean_hindi) if s.strip()]
        if not sentences:
            sentences = [clean_hindi] if clean_hindi else []
        segments: List[tuple[str, float]] = []
        for idx, s in enumerate(sentences):
            is_last = (idx == len(sentences) - 1)
            segments.append((s, 0.35 if is_last else 0.25))
        return segments


async def synthesize_with_pauses(
    segments: List[tuple[str, float]],
    voice: str = "hi-IN-SwaraNeural",
    rate: str = "-8%",
) -> bytes:
    """Synthesize segments with Microsoft Edge Neural TTS and insert natural breath frames between them."""
    import edge_tts

    audio_parts: List[bytes] = []
    for phrase, pause_sec in segments:
        clean_phrase = phrase.strip()
        if not clean_phrase:
            continue
        comm = edge_tts.Communicate(clean_phrase, voice, rate=rate)
        chunks: List[bytes] = []
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        audio_parts.append(b"".join(chunks))
        if pause_sec > 0:
            audio_parts.append(get_silence(pause_sec))

    return b"".join(audio_parts)


@router.api_route("/audio/{chapter}/{verse}", methods=["GET", "HEAD"], summary="Get paused divine recitation audio for Gita verse")
async def get_gita_verse_audio(
    chapter: int,
    verse: int,
    mode: str = Query("sanskrit", description="Recitation mode: 'sanskrit', 'hindi', 'both'"),
    voice: str = Query("swara", description="Voice: 'swara' (female, default) or 'madhur' (male)"),
):
    if not (1 <= chapter <= 18) or verse < 1:
        raise HTTPException(status_code=400, detail="Invalid chapter or verse number")

    chosen_voice = "hi-IN-MadhurNeural" if "madhur" in (voice or "").lower() else "hi-IN-SwaraNeural"
    cache_key = f"verse_v3_{chapter}_{verse}_{mode}_{chosen_voice}"
    cached_file = GITA_AUDIO_CACHE_DIR / f"{cache_key}.mp3"

    if cached_file.exists() and cached_file.stat().st_size > 1000:
        return FileResponse(
            cached_file,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=2592000"},
        )

    # Load verse data from database / chapter JSON
    try:
        rows = _loader.load_chapter(chapter)
        verse_data = next((r for r in rows if r.get("verse") == verse), None)
        if not verse_data:
            raise HTTPException(status_code=404, detail=f"Verse {chapter}.{verse} not found")

        sanskrit_text = verse_data.get("text", "")
        translations = verse_data.get("translations", {})

        # Priority matches what VerseCard.tsx and 3D reader display on screen
        hindi_text = ""
        if isinstance(translations, dict):
            for k in ["swami tejomayananda", "hindi", "swami ramsukhdas", "sri harikrishnadas goenka"]:
                val = translations.get(k)
                if isinstance(val, str) and val.strip() and "did not comment" not in val.lower():
                    hindi_text = val.strip()
                    break

        segments: List[tuple[str, float]] = []
        if mode in ("sanskrit", "both"):
            segments.extend(build_meditative_segments(sanskrit_text, is_sanskrit=True))

        if mode == "both" and segments:
            # Respectful natural pause between Sanskrit and Hindi
            segments[-1] = (segments[-1][0], 0.5)

        if mode in ("hindi", "both") and hindi_text:
            segments.extend(build_meditative_segments(hindi_text, is_sanskrit=False))

        if not segments:
            segments.extend(build_meditative_segments(sanskrit_text, is_sanskrit=True))

        audio_bytes = await synthesize_with_pauses(segments, voice=chosen_voice, rate="-8%")
        if len(audio_bytes) < 500:
            raise RuntimeError("Generated audio was too short or empty")

        with open(cached_file, "wb") as f:
            f.write(audio_bytes)

        return FileResponse(
            cached_file,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=2592000"},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GitaAudio] Error generating paused verse audio: {e}")
        # Fallback to direct TTS endpoint or CDN
        cdn_url = f"https://cdn.jsdelivr.net/gh/nikhilsi/gitavani@main/ios/GitaVani/GitaVani/Resources/audio/BG{chapter}.{verse}.mp3"
        return RedirectResponse(url=cdn_url, status_code=307)


@router.api_route("/tts", methods=["GET", "HEAD"], summary="Generate pleasant devotional neural speech with meditative pauses")
async def get_gita_tts(
    text: str = Query(..., min_length=1, max_length=2500, description="Text to speak"),
    lang: str = Query("hi", description="Language: 'hi' or 'en'"),
    voice: str = Query(None, description="Optional neural voice identifier (e.g. 'swara', 'madhur', 'neerja')"),
    speed: float = Query(1.0, description="Playback speed factor"),
):
    clean_text = text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice_lower = (voice or "").lower().strip()
    if "madhur" in voice_lower:
        chosen_voice = "hi-IN-MadhurNeural"
    elif "neerja" in voice_lower or lang.lower().startswith("en"):
        chosen_voice = "en-IN-NeerjaNeural"
    else:
        # Default: Swara - serene, sweet, devotional female voice for both Hindi and Sanskrit
        chosen_voice = "hi-IN-SwaraNeural"

    # Calm, natural pace (-8% by default for clear Sanskrit pronunciation)
    rate_percent = int(-8 + (speed - 1.0) * 35)
    rate_str = f"{rate_percent:+d}%"

    # Cache key based on voice, rate, and clean text
    cache_key = hashlib.md5(f"v2:{chosen_voice}:{rate_str}:{clean_text}".encode("utf-8")).hexdigest()
    cache_file = TTS_CACHE_DIR / f"{cache_key}.mp3"

    if cache_file.exists() and cache_file.stat().st_size > 500:
        return FileResponse(
            cache_file,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=604800"},
        )

    try:
        is_sanskrit = not lang.lower().startswith("en")
        segments = build_meditative_segments(clean_text, is_sanskrit=is_sanskrit)
        if not segments:
            segments = [(clean_text, 0.0)]

        audio_bytes = await synthesize_with_pauses(segments, voice=chosen_voice, rate=rate_str)
        if not audio_bytes or len(audio_bytes) <= 500:
            raise RuntimeError("TTS output was empty or corrupted")

        with open(cache_file, "wb") as f:
            f.write(audio_bytes)

        return FileResponse(
            cache_file,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=604800"},
        )
    except Exception as e:
        print(f"[GitaTTS] Error synthesizing speech: {e}")
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")


def _load_bhagavad_gita_chapter(chapter_number: int) -> List[Dict[str, Any]]:
    return _loader.load_chapter(chapter_number)
