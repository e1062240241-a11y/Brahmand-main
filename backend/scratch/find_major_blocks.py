import numpy as np

def segment_audio_robust():
    profile = []
    with open('C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt') as f:
        lines = f.readlines()[1:]
    for line in lines:
        t, e = line.strip().split(',')
        profile.append((float(t), float(e)))
        
    times = np.array([t for t, e in profile])
    energies = np.array([e for t, e in profile])
    
    # 2.0-second rolling average (20 chunks)
    window_size = 20
    rolling_mean = []
    for i in range(len(energies) - window_size + 1):
        rolling_mean.append(np.mean(energies[i : i + window_size]))
    rolling_mean = np.array(rolling_mean)
    
    # Threshold for vocal parts (rolling average >= 2450)
    threshold = 2450
    is_vocal = rolling_mean >= threshold
    
    # First pass: identify initial raw segments
    raw_segments = []
    in_vocal = False
    start_time = 0.0
    
    for i in range(len(is_vocal)):
        t = times[i]
        if is_vocal[i] and not in_vocal:
            in_vocal = True
            start_time = t
        elif not is_vocal[i] and in_vocal:
            in_vocal = False
            end_time = t + 2.0 # adjust for window offset
            raw_segments.append(('vocal', start_time, end_time))
            
    if in_vocal:
        raw_segments.append(('vocal', start_time, times[-1]))
        
    # Interleave with music blocks
    full_timeline = []
    current_time = 0.0
    for seg_type, start, end in raw_segments:
        if start > current_time:
            full_timeline.append(('music', current_time, start))
        full_timeline.append((seg_type, start, end))
        current_time = end
    if current_time < times[-1]:
        full_timeline.append(('music', current_time, times[-1]))
        
    # Merge step:
    # 1. Merge any 'music' block that is shorter than 4.5 seconds into 'vocal'
    # because short silences are just speech breaks or vocal pauses.
    merged = []
    for seg_type, start, end in full_timeline:
        if not merged:
            merged.append((seg_type, start, end))
            continue
            
        last_type, last_start, last_end = merged[-1]
        
        if seg_type == 'music' and (end - start) < 4.5:
            # Short music block -> merge with preceding vocal
            merged[-1] = (last_type, last_start, end)
        elif seg_type == 'vocal' and last_type == 'vocal':
            # Contiguous vocal blocks -> merge
            merged[-1] = ('vocal', last_start, end)
        else:
            merged.append((seg_type, start, end))
            
    # Second pass of merging: merge any 'vocal' block shorter than 4.5 seconds into 'music'
    final_timeline = []
    for seg_type, start, end in merged:
        if not final_timeline:
            final_timeline.append((seg_type, start, end))
            continue
            
        last_type, last_start, last_end = final_timeline[-1]
        
        if seg_type == 'vocal' and (end - start) < 4.5:
            # Short vocal block -> merge with preceding music
            final_timeline[-1] = (last_type, last_start, end)
        elif seg_type == 'music' and last_type == 'music':
            # Contiguous music blocks -> merge
            final_timeline[-1] = ('music', last_start, end)
        else:
            final_timeline.append((seg_type, start, end))
            
    print("Cleaned Major Timeline Segments:")
    for idx, (seg_type, start, end) in enumerate(final_timeline):
        print(f"{idx:2d}: {seg_type:5s} | {start:5.1f}s to {end:5.1f}s | Duration: {end - start:5.1f}s")

if __name__ == "__main__":
    segment_audio_robust()
