import numpy as np

def find_subblocks(start_t, end_t):
    profile = []
    with open('C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt') as f:
        lines = f.readlines()[1:]
    for line in lines:
        t, e = line.strip().split(',')
        profile.append((float(t), float(e)))
        
    times = np.array([t for t, e in profile])
    energies = np.array([e for t, e in profile])
    
    # Filter within our range
    mask = (times >= start_t) & (times <= end_t)
    sub_times = times[mask]
    sub_energies = energies[mask]
    
    # We will compute a 1.2-second rolling average (12 chunks)
    window_size = 12
    rolling_mean = []
    for i in range(len(sub_energies) - window_size + 1):
        rolling_mean.append(np.mean(sub_energies[i : i + window_size]))
    rolling_mean = np.array(rolling_mean)
    
    # Threshold for valleys
    threshold = 2800
    is_valley = rolling_mean < threshold
    
    valleys = []
    in_valley = False
    v_start = 0.0
    
    for i in range(len(rolling_mean)):
        t = sub_times[i]
        if is_valley[i] and not in_valley:
            in_valley = True
            v_start = t
        elif not is_valley[i] and in_valley:
            in_valley = False
            v_end = t + 1.2
            if v_end - v_start >= 3.0: # Valley must be at least 3 seconds
                valleys.append((v_start, v_end))
                
    if in_valley:
        valleys.append((v_start, sub_times[-1]))
        
    print(f"Sub-valleys in range {start_t}s to {end_t}s:")
    for vs, ve in valleys:
        print(f"Valley: {vs:.1f}s to {ve:.1f}s | Duration: {ve - vs:.1f}s")

if __name__ == "__main__":
    import sys
    start_t = float(sys.argv[1]) if len(sys.argv) > 1 else 177.6
    end_t = float(sys.argv[2]) if len(sys.argv) > 2 else 303.9
    find_subblocks(start_t, end_t)
