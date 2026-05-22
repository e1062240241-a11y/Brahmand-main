import os
import miniaudio
import numpy as np
import wave
import sys
import dotenv
from groq import Groq

# Ensure UTF-8 printing on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def transcribe_words(start_sec, end_sec):
    dotenv.load_dotenv("C:/Users/prarh/Desktop/Brahmand-main/backend/.env")
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        print("Error: GROQ_API_KEY not found in environment.")
        return

    audio_path = "C:/Users/prarh/Desktop/Brahmand-main/frontend/assets/audio/audio ekant/Hanuman chalisa.mp3"
    client = Groq(api_key=groq_api_key)

    print(f"Decoding section {start_sec}s to {end_sec}s...")
    info = miniaudio.decode_file(audio_path)
    samples = np.array(info.samples, dtype=np.int16)
    orig_sr = info.sample_rate
    channels = info.nchannels

    start_idx = int(start_sec * orig_sr * channels)
    end_idx = int(end_sec * orig_sr * channels)
    section_samples = samples[start_idx:end_idx]

    # Downsample to 16kHz mono
    if channels == 2:
        section_samples = section_samples.reshape(-1, 2)
        section_samples = np.mean(section_samples, axis=1).astype(np.int16)
    else:
        section_samples = section_samples.copy()

    num_samples = int(len(section_samples) * 16000 / orig_sr)
    indices = np.linspace(0, len(section_samples) - 1, num_samples)
    ds_samples = np.interp(indices, np.arange(len(section_samples)), section_samples).astype(np.int16)

    temp_wav = f"C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/temp_words_{start_sec}_{end_sec}.wav"
    with wave.open(temp_wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(ds_samples.tobytes())

    print("Sending to Groq for word-level transcription...")
    try:
        with open(temp_wav, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(temp_wav, file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
                timestamp_granularities=["word"],
                language="hi",
                temperature=0.0
            )

        data = transcription.model_dump() if hasattr(transcription, "model_dump") else dict(transcription)
        
        print("Data keys:", list(data.keys()))
        
        words = []
        if data.get("words") is not None:
            words = data["words"]
            print(f"Found {len(words)} words in data['words']")
            if words:
                print("First word example:", words[0])
        
        segments = data.get("segments")
        if not words and segments is not None:
            for seg in segments:
                if seg is not None:
                    seg_words = seg.get("words")
                    if seg_words is not None:
                        words.extend(seg_words)
            
        print("\n--- Word level timestamps ---")
        if words:
            for w in words:
                w_start = w.get("start") + start_sec
                w_end = w.get("end") + start_sec
                print(f"[{w_start:.2f}s - {w_end:.2f}s]: {w.get('word')}")
        else:
            print("No word-level timestamps found.")
            if segments is not None:
                print("Listing segments:")
                for seg in segments:
                    if seg is not None:
                        s_start = seg.get("start") + start_sec
                        s_end = seg.get("end") + start_sec
                        print(f"[{s_start:.2f}s - {s_end:.2f}s]: {seg.get('text')}")
    except Exception as e:
        print(f"Error during transcription: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)

if __name__ == "__main__":
    start_sec = float(sys.argv[1]) if len(sys.argv) > 1 else 110.0
    end_sec = float(sys.argv[2]) if len(sys.argv) > 2 else 140.0
    transcribe_words(start_sec, end_sec)
