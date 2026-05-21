import numpy as np

def detect_interludes():
    profile = []
    with open('C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt') as f:
        lines = f.readlines()[1:]
    for line in lines:
        t, e = line.strip().split(',')
        profile.append((float(t), float(e)))
        
    times = np.array([t for t, e in profile])
    energies = np.array([e for t, e in profile])
    
    # Rolling average over 3 seconds (30 chunks)
    window_size = 30
    rolling_mean = []
    for i in range(len(energies) - window_size + 1):
        rolling_mean.append(np.mean(energies[i : i + window_size]))
    rolling_mean = np.array(rolling_mean)
    
    # Threshold for silence/interlude rolling average
    threshold = 2300
    is_silence = rolling_mean < threshold
    
    # Group contiguous silence regions
    silences = []
    in_silence = False
    start_time = 0.0
    
    for i in range(len(is_silence)):
        t = times[i]
        if is_silence[i] and not in_silence:
            in_silence = True
            start_time = t
        elif not is_silence[i] and in_silence:
            in_silence = False
            end_time = t + 3.0
            if end_time - start_time >= 4.0: # Interludes are typically at least 4s
                silences.append((start_time, end_time))
                
    if in_silence:
        silences.append((start_time, times[-1]))
        
    print("Detected Music Interludes (rolling average < 2300):")
    for start, end in silences:
        print(f"Interlude: {start:.1f}s to {end:.1f}s (Duration: {end - start:.1f}s)")

if __name__ == "__main__":
    detect_interludes()
