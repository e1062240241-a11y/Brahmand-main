import os
import sys
import miniaudio
import numpy as np
import wave
import dotenv
from groq import Groq

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

dotenv.load_dotenv("C:/Users/prarh/Desktop/Brahmand-main/backend/.env")
groq_api_key = os.environ.get("GROQ_API_KEY")

audio_path = "C:/Users/prarh/Desktop/Brahmand-main/frontend/assets/audio/audio ekant/Hanuman chalisa.mp3"
client = Groq(api_key=groq_api_key)

start_sec = 545.0
end_sec = 575.0
print(f"Decoding section {start_sec}s to {end_sec}s...")
info = miniaudio.decode_file(audio_path)
samples = np.array(info.samples, dtype=np.int16)
orig_sr = info.sample_rate
channels = info.nchannels

start_idx = int(start_sec * orig_sr * channels)
end_idx = int(end_sec * orig_sr * channels)
section_samples = samples[start_idx:end_idx]

if channels == 2:
    section_samples = section_samples.reshape(-1, 2)
    section_samples = np.mean(section_samples, axis=1).astype(np.int16)
num_samples = int(len(section_samples) * 16000 / orig_sr)
indices = np.linspace(0, len(section_samples) - 1, num_samples)
ds_samples = np.interp(indices, np.arange(len(section_samples)), section_samples).astype(np.int16)

temp_wav = "C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/temp_doha2.wav"
with wave.open(temp_wav, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(16000)
    w.writeframes(ds_samples.tobytes())

print("Sending to Groq...")
with open(temp_wav, "rb") as file:
    transcription = client.audio.transcriptions.create(
        file=(temp_wav, file.read()),
        model="whisper-large-v3",
        response_format="verbose_json",
        language="hi",
        temperature=0.0
    )

data = transcription.model_dump() if hasattr(transcription, "model_dump") else dict(transcription)
for seg in data.get("segments", []):
    print(f"[{seg.get('start') + start_sec:.2f}s - {seg.get('end') + start_sec:.2f}s]: {seg.get('text')}")

if os.path.exists(temp_wav):
    os.remove(temp_wav)
