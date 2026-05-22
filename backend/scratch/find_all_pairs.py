import numpy as np

def segment_audio():
    profile = []
    with open('C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt') as f:
        lines = f.readlines()[1:]
    for line in lines:
        t, e = line.strip().split(',')
        profile.append((float(t), float(e)))
        
    times = np.array([t for t, e in profile])
    energies = np.array([e for t, e in profile])
    
    # We will compute a 1-second rolling average (10 chunks)
    window_size = 10
    rolling_mean = []
    for i in range(len(energies) - window_size + 1):
        rolling_mean.append(np.mean(energies[i : i + window_size]))
    rolling_mean = np.array(rolling_mean)
    
    # Let's define vocal/music states based on rolling mean.
    # We can use a threshold. Since the track volume might change slightly, 
    # let's analyze local windows or use a adaptive threshold.
    # Looking at the profile:
    # Quiet music parts have energy around 1000 - 2000.
    # Loud vocal parts have energy around 2800 - 6000.
    # Let's use a threshold of 2400.
    threshold = 2400
    is_vocal = rolling_mean >= threshold
    
    segments = []
    in_vocal = False
    start_time = 0.0
    
    for i in range(len(is_vocal)):
        t = times[i]
        if is_vocal[i] and not in_vocal:
            in_vocal = True
            start_time = t
        elif not is_vocal[i] and in_vocal:
            in_vocal = False
            end_time = t + 1.0 # adjust for window offset
            segments.append(('vocal', start_time, end_time))
            
    if in_vocal:
        segments.append(('vocal', start_time, times[-1]))
        
    # Now, the gaps between vocal segments are music segments!
    full_timeline = []
    current_time = 0.0
    
    for seg_type, start, end in segments:
        if start > current_time:
            # There is a music gap!
            full_timeline.append(('music', current_time, start))
        full_timeline.append((seg_type, start, end))
        current_time = end
        
    if current_time < times[-1]:
        full_timeline.append(('music', current_time, times[-1]))
        
    print("Detected Segments:")
    for idx, (seg_type, start, end) in enumerate(full_timeline):
        print(f"{idx:2d}: {seg_type:5s} | {start:5.1f}s to {end:5.1f}s | Duration: {end - start:4.1f}s")
        
if __name__ == "__main__":
    segment_audio()
