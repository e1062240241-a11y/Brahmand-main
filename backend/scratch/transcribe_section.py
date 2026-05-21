import os
import miniaudio
import numpy as np
from google.cloud import speech_v2

# Set credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/prarh/Desktop/Brahmand-main/backend/firebase.json"

def transcribe_section(start_sec, end_sec):
    print(f"Decoding section {start_sec}s to {end_sec}s...")
    info = miniaudio.decode_file("C:/Users/prarh/Desktop/Brahmand-main/frontend/assets/audio/audio ekant/Hanuman chalisa.mp3")
    
    # Extract audio bytes in WAV format
    samples = np.array(info.samples, dtype=np.int16)
    sample_rate = info.sample_rate
    channels = info.nchannels
    
    start_idx = int(start_sec * sample_rate * channels)
    end_idx = int(end_sec * sample_rate * channels)
    section_samples = samples[start_idx:end_idx]
    
    # Save as temporary wav file
    import wave
    wav_path = "C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/temp_section.wav"
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2) # 16-bit
        w.setframerate(sample_rate)
        w.writeframes(section_samples.tobytes())
        
    print(f"Saved temp wav file, calling speech client...")
    client = speech_v2.SpeechClient()
    
    with open(wav_path, "rb") as f:
        audio_content = f.read()
        
    config = speech_v2.RecognitionConfig(
        auto_decoding_config=speech_v2.AutoDetectDecodingConfig(),
        language_codes=["hi-IN"],
        model="chirp_2",
    )
    
    PROJECT_ID = "sanatan-lok"
    recognizer_name = f"projects/{PROJECT_ID}/locations/global/recognizers/_"
    
    request = speech_v2.RecognizeRequest(
        recognizer=recognizer_name,
        config=config,
        content=audio_content,
    )
    
    response = client.recognize(request=request)
    print("Transcriptions:")
    for result in response.results:
        for alt in result.alternatives:
            print(alt.transcript)

if __name__ == "__main__":
    transcribe_section(812.0, 830.0)
