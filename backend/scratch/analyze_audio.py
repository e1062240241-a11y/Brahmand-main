import miniaudio
import numpy as np

def analyze_audio(file_path):
    print(f"Decoding file with miniaudio: {file_path}")
    try:
        # Decode the file
        info = miniaudio.decode_file(file_path)
        print(f"Sample Rate: {info.sample_rate} Hz, Channels: {info.nchannels}, Duration: {info.duration:.2f} seconds")
        
        # Audio samples as numpy array
        samples = np.array(info.samples, dtype=np.float32)
        
        # Calculate RMS energy for every 100ms
        sample_rate = info.sample_rate
        channels = info.nchannels
        chunk_duration = 0.1 # 100ms
        chunk_samples = int(sample_rate * chunk_duration * channels)
        
        num_chunks = len(samples) // chunk_samples
        print(f"Total samples: {len(samples)}, chunk samples: {chunk_samples}, num chunks: {num_chunks}")
        
        energies = []
        for i in range(num_chunks):
            chunk = samples[i * chunk_samples : (i + 1) * chunk_samples]
            rms = np.sqrt(np.mean(chunk**2))
            energies.append(rms)
            
        energies = np.array(energies)
        
        # Write the profile to a file so we can view it
        with open("C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt", "w") as out:
            out.write("Time(s), Energy\n")
            for i, e in enumerate(energies):
                time_sec = i * chunk_duration
                out.write(f"{time_sec:.1f}, {e:.5f}\n")
                
        print("Successfully wrote energy profile to C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt")
        
        # Print the first 60 seconds of profile (per 0.5s or 1s) to console
        print("\n--- FIRST 60 SECONDS ENERGY PROFILE (per 1 second) ---")
        for i in range(60):
            start_idx = int(i * 10)
            end_idx = int((i + 1) * 10)
            if end_idx <= len(energies):
                sec_energy = np.mean(energies[start_idx:end_idx])
                print(f"Second {i:3d}: {sec_energy:.5f}")
                
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    file_path = "C:/Users/prarh/Desktop/Brahmand-main/frontend/assets/audio/Hanuman chalisa Audio/Hanuman chalisa.mp3"
    analyze_audio(file_path)
