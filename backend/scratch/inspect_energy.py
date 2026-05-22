import numpy as np

def inspect_range(start_t, end_t):
    profile = []
    with open('C:/Users/prarh/Desktop/Brahmand-main/backend/scratch/audio_profile.txt') as f:
        lines = f.readlines()[1:]
    for line in lines:
        t, e = line.strip().split(',')
        profile.append((float(t), float(e)))
        
    times = np.array([t for t, e in profile])
    energies = np.array([e for t, e in profile])
    
    mask = (times >= start_t) & (times <= end_t)
    sub_times = times[mask]
    sub_energies = energies[mask]
    
    print(f"Energy profile from {start_t}s to {end_t}s:")
    for t, e in zip(sub_times, sub_energies):
        # Print with a simple visual indicator of energy level
        bar = "#" * int(e / 300)
        print(f"{t:6.1f}s | {e:6.1f} | {bar}")

if __name__ == "__main__":
    import sys
    start_t = float(sys.argv[1]) if len(sys.argv) > 1 else 105.0
    end_t = float(sys.argv[2]) if len(sys.argv) > 2 else 125.0
    inspect_range(start_t, end_t)
