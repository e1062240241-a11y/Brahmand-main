import numpy as np

def analyze_window(start_t, end_t, step=0.5):
    profile = []
    with open('C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt') as f:
        lines = f.readlines()[1:]
    for line in lines:
        t, e = line.strip().split(',')
        profile.append((float(t), float(e)))
        
    times = np.array([t for t, e in profile])
    energies = np.array([e for t, e in profile])
    
    print(f"\n=== Analyzing Range {start_t}s to {end_t}s (step={step}s) ===")
    
    current = start_t
    while current < end_t:
        next_t = current + step
        mask = (times >= current) & (times < next_t)
        if np.any(mask):
            avg_energy = np.mean(energies[mask])
            # Print visually with a bar indicator
            bar_len = int(avg_energy / 200)
            bar = "#" * bar_len
            print(f"{current:5.1f}s - {next_t:5.1f}s | Energy: {avg_energy:7.1f} | {bar}")
        current = next_t

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        start_t = float(sys.argv[1])
        end_t = float(sys.argv[2])
        step = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
        analyze_window(start_t, end_t, step)
    else:
        # Default run to inspect the 100s-140s range
        analyze_window(100.0, 140.0, 1.0)
