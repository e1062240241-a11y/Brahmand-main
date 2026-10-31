# File: backend/services/tts_adapter.py
"""
TTS Adapter Interface and EdgeTTS Implementation for Cosmic Storyteller Mode.
Implements dramatic sentence-level breath pauses, baritone pitch resonance,
emotional speaker attributions, and SSML <mark> timing manifest generation.
"""

from abc import ABC, abstractmethod
import asyncio
from pathlib import Path
import re
from typing import Any, Dict, List
import edge_tts
from schemas.gita_story_schema import StoryScene


# Standard silent frame for 24000 Hz, 48 kbps MPEG-2 Layer 3 (144 bytes = 24ms of silence)
SILENT_FRAME = bytes([255, 243, 100, 196, 124, 0, 0, 3, 72, 0, 0, 0, 0, 170, 170, 170] + [170] * 128)


def get_silence(milliseconds: int) -> bytes:
    """Generate exact silence frames for MPEG-2 Layer 3 audio."""
    frame_count = max(1, int(round((milliseconds / 1000.0) * 24000 / 576)))
    return SILENT_FRAME * frame_count


def split_into_sentences(text: str) -> List[str]:
    """
    Split Hindi text into distinct dramatic sentences using punctuation boundaries
    (Devanagari danda '।', exclamation '!', or question mark '?').
    Prevents sentences from running together in a breathless rush.
    """
    parts = re.split(r'([।!?])', text)
    sentences: List[str] = []
    for i in range(0, len(parts) - 1, 2):
        s = (parts[i] + parts[i + 1]).strip()
        if s:
            sentences.append(s)
    if len(parts) % 2 == 1 and parts[-1].strip():
        sentences.append(parts[-1].strip())
    return sentences if sentences else [text.strip()]


DRAMATIC_SPEAKER_INTROS: Dict[str, str] = {
    "धृतराष्ट्र": "हस्तिनापुर से धृतराष्ट्र ने पूछा— ",
    "सञ्जय": "सञ्जय ने कहा— ",
    "दुर्योधन": "भीतर से कांपते हुए, दुर्योधन बोला— ",
    "अर्जुन": "शोक से विह्वल होकर अर्जुन बोले— ",
    "श्रीभगवान्": "तब जगद्गुरु श्रीभगवान् ने कहा— ",
    "काल_समय": "काल साक्षी है— ",
}


class TTSAdapter(ABC):
    """Abstract base class for Text-To-Speech adapters."""

    @abstractmethod
    async def generate_scene_audio(self, scene: StoryScene, output_path: str) -> Dict[str, Any]:
        """
        Synthesize audio for a StoryScene and return a timing manifest.

        Args:
            scene: The StoryScene containing narrative and dialogues.
            output_path: Path where the output MP3 should be written.

        Returns:
            Dict matching timing_manifest schema:
            {"scene_id": str, "cues": [{"text": str, "start_ms": int, "end_ms": int}]}
        """
        pass


class EdgeTTSAdapter(TTSAdapter):
    """
    Microsoft Edge Neural TTS implementation for Cosmic Storyteller Mode.
    Uses 'hi-IN-MadhurNeural' with deep baritone pitch (-6Hz) and deliberate,
    solemn cadence (-14% rate) for the iconic "मैं समय हूँ" experience.
    Inserts 450ms breath pauses between sentences and 850ms pauses between acts.
    """

    def __init__(
        self,
        voice: str = "hi-IN-MadhurNeural",
        rate: str = "-14%",
        pitch: str = "-6Hz",
        sentence_pause_ms: int = 450,
        block_pause_ms: int = 850,
    ):
        self.voice = voice
        self.rate = rate
        self.pitch = pitch
        self.sentence_pause_ms = sentence_pause_ms
        self.block_pause_ms = block_pause_ms

    def build_ssml_with_marks(self, scene: StoryScene) -> str:
        """
        Construct the canonical SSML document incorporating <mark> tags
        at the start of the narrative and each character dialogue block.
        """
        ssml_parts = [
            f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='hi-IN'>",
            f"<voice name='{self.voice}'>",
            f"<prosody rate='{self.rate}' pitch='{self.pitch}'>",
            f"<mark name='mark_narrative'/>",
            f"{scene.narrative_hindi}",
        ]

        for idx, d in enumerate(scene.dialogues):
            mark_name = f"mark_dialogue_{idx}_{d.speaker.value}"
            intro = DRAMATIC_SPEAKER_INTROS.get(d.speaker.value, f"{d.speaker_display} बोले— ")
            ssml_parts.append(f"<mark name='{mark_name}'/>")
            ssml_parts.append(f"{intro}{d.dialogue_hindi}")

        ssml_parts.extend(["</prosody>", "</voice>", "</speak>"])
        return "\n".join(ssml_parts)

    async def generate_scene_audio(self, scene: StoryScene, output_path: str) -> Dict[str, Any]:
        """
        Synthesize audio for narrative and dialogue blocks with sentence-level breathing pauses
        and millisecond-accurate cue timing.
        """
        target_path = Path(output_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # 1. Prepare structured blocks corresponding to each SSML <mark>
        blocks: List[Dict[str, Any]] = [
            {
                "mark": "mark_narrative",
                "text": scene.narrative_hindi.strip(),
                "sentences": split_into_sentences(scene.narrative_hindi.strip()),
            }
        ]

        for idx, d in enumerate(scene.dialogues):
            mark_name = f"mark_dialogue_{idx}_{d.speaker.value}"
            intro = DRAMATIC_SPEAKER_INTROS.get(d.speaker.value, f"{d.speaker_display} बोले— ")
            raw_dialogue = d.dialogue_hindi.strip()
            # Dramatic sentence splitting
            dialogue_sentences = split_into_sentences(raw_dialogue)
            if dialogue_sentences:
                # Attach the dramatic speaker attribution to the first spoken sentence
                dialogue_sentences[0] = f"{intro}{dialogue_sentences[0]}"

            blocks.append({
                "mark": mark_name,
                "text": f"{d.speaker_display}: {raw_dialogue}",
                "sentences": dialogue_sentences,
            })

        cues: List[Dict[str, Any]] = []
        audio_segments: List[bytes] = []
        current_ms = 0
        sentence_silence = get_silence(self.sentence_pause_ms)
        block_silence = get_silence(self.block_pause_ms)

        for block in blocks:
            sentences = block.get("sentences", [])
            if not sentences:
                continue

            block_start_ms = current_ms

            for s_idx, sentence_text in enumerate(sentences):
                sentence_text = sentence_text.strip()
                if not sentence_text:
                    continue

                try:
                    comm = edge_tts.Communicate(
                        sentence_text,
                        self.voice,
                        rate=self.rate,
                        pitch=self.pitch,
                    )
                    chunks: List[bytes] = []
                    async for chunk in comm.stream():
                        if chunk["type"] == "audio":
                            chunks.append(chunk["data"])

                    sentence_audio = b"".join(chunks)
                    if not sentence_audio:
                        continue

                    # 48 kbps mono MP3 = 6000 bytes per second = 6 bytes per ms
                    sentence_duration_ms = int(len(sentence_audio) / 6.0)

                    audio_segments.append(sentence_audio)
                    current_ms += sentence_duration_ms

                    # Insert breath pause between sentences (except after the final sentence in a block)
                    if s_idx < len(sentences) - 1:
                        audio_segments.append(sentence_silence)
                        current_ms += self.sentence_pause_ms

                except Exception as e:
                    print(f"[EdgeTTSAdapter] Error synthesizing sentence '{sentence_text[:30]}': {e}")

            # Register the block's active cue range
            cues.append({
                "mark": block["mark"],
                "text": block["text"],
                "start_ms": block_start_ms,
                "end_ms": current_ms,
            })

            # Dramatic scene pause between narrator and dialogue blocks
            audio_segments.append(block_silence)
            current_ms += self.block_pause_ms

        # 2. Write concatenated audio file
        full_audio_bytes = b"".join(audio_segments)
        with open(target_path, "wb") as f:
            f.write(full_audio_bytes)

        # 3. Return timing manifest
        timing_manifest = {
            "scene_id": scene.scene_id,
            "total_duration_ms": current_ms,
            "cues": cues,
        }

        return timing_manifest
