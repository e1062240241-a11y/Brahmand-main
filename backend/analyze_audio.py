import wave
import struct
import math

def main():
    wav_path = "krishna_jaap.wav"
    with wave.open(wav_path, "rb") as w:
        params = w.getparams()
        nchannels, sampwidth, framerate, nframes = params[:4]
        print(f"Channels: {nchannels}, Sample Width: {sampwidth}, Frame Rate: {framerate}, Frames: {nframes}")
        
        # Read all frames
        frames = w.readframes(nframes)
        # Convert to 16-bit integers
        samples = struct.unpack(f"<{nframes}h", frames)
        
        # We want to analyze in 100ms windows
        window_size = int(framerate * 0.1) # 100ms
        num_windows = len(samples) // window_size
        
        print("\nRMS Energy Profile (every 100ms):")
        print("Time(s) | Energy | Bar")
        print("-" * 40)
        
        for i in range(num_windows):
            start = i * window_size
            end = start + window_size
            chunk = samples[start:end]
            
            # Compute RMS
            sum_squares = sum(s ** 2 for s in chunk)
            rms = math.sqrt(sum_squares / len(chunk))
            
            # Normalize to 0-50 for visualization
            bar_len = int((rms / 32768.0) * 150)
            bar = "#" * bar_len
            
            time_sec = i * 0.1
            if rms > 1000: # threshold for voice presence
                print(f"{time_sec:7.1f} | {rms:6.0f} | {bar}")
            else:
                print(f"{time_sec:7.1f} | {rms:6.0f} | (silence)")

if __name__ == "__main__":
    main()
