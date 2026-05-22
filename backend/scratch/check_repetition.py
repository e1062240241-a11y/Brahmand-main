import miniaudio
import numpy as np

def check_repetition():
    print("Decoding audio...")
    info = miniaudio.decode_file("C:/Users/prarh/Desktop/Brahmand-main/frontend/assets/audio/Hanuman chalisa Audio/Hanuman chalisa.mp3")
    samples = np.array(info.samples, dtype=np.float32)
    sample_rate = info.sample_rate
    channels = info.nchannels
    
    # Let's extract:
    # 1. Target block: 808s to 939s
    t_start = int(808 * sample_rate * channels)
    t_end = int(939 * sample_rate * channels)
    target = samples[t_start:t_end]
    
    # 2. Reference blocks to compare against:
    # We will compute average RMS energy over 1-second chunks for comparison profiles.
    chunk_size = int(sample_rate * channels) # 1 second
    
    def get_profile(start_s, end_s):
        s_idx = int(start_s * sample_rate * channels)
        e_idx = int(end_s * sample_rate * channels)
        sub = samples[s_idx:e_idx]
        num_chunks = len(sub) // chunk_size
        return np.array([np.sqrt(np.mean(sub[i*chunk_size : (i+1)*chunk_size]**2)) for i in range(num_chunks)])
        
    target_profile = get_profile(808, 939)
    print(f"Target profile length: {len(target_profile)} seconds")
    
    # Let's slide a window of len(target_profile) over the first 800 seconds of the track
    # and find the best match (minimum distance or maximum correlation)
    full_profile = get_profile(0, 800)
    
    best_dist = float('inf')
    best_sec = 0
    
    w_len = len(target_profile)
    for i in range(len(full_timeline_profile := full_profile) - w_len + 1):
        window = full_profile[i : i + w_len]
        # Normalize both profiles to compare shape
        w_norm = (window - np.mean(window)) / (np.std(window) + 1e-6)
        t_norm = (target_profile - np.mean(target_profile)) / (np.std(target_profile) + 1e-6)
        dist = np.mean((w_norm - t_norm)**2)
        if dist < best_dist:
            best_dist = dist
            best_sec = i
            
    print(f"Best matching starting second in the first 800s: {best_sec}s with distance {best_dist:.4f}")
    
if __name__ == "__main__":
    check_repetition()
