import os

# Read the generated TS segments
with open("c:/Users/prarh/Desktop/Brahmand-main/backend/scratch/ts_segments.txt", "r", encoding="utf-8") as f:
    ts_segments = f.read().strip()

# Update LiveJaapRoomView.tsx (Web)
web_path = "c:/Users/prarh/Desktop/Brahmand-main/frontend/src/components/LiveJaapRoom/LiveJaapRoomView.tsx"
with open(web_path, "r", encoding="utf-8") as f:
    web_content = f.read()

# We find the index of "const HANUMAN_CHALISA_SEGMENTS = ["
start_idx_web = web_content.find("const HANUMAN_CHALISA_SEGMENTS = [")
# We find the index of "export default function LiveJaapRoomView() {"
end_idx_web = web_content.find("export default function LiveJaapRoomView() {")

if start_idx_web != -1 and end_idx_web != -1:
    mantra_audio_str = """
const MANTRA_AUDIO: Record<string, any> = {
  hanuman: require('../../../assets/audio/audio ekant/Hanuman chalisa.mp3'),
  gayatri: require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3'),
  krishna: require('../../../assets/audio/audio ekant/leberch-yoga-509709.mp3'),
  shiva: require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3'),
};

const MANTRA_BG_AUDIO_URLS: Record<string, string> = {
  hanuman: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
  gayatri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
  krishna: 'https://cdn.pixabay.com/audio/2022/01/18/audio_0a4c9a6b2f.mp3',
  shiva: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1532c.mp3',
};
"""
    new_block_web = ts_segments + "\n" + mantra_audio_str + "\n"
    new_web_content = web_content[:start_idx_web] + new_block_web + web_content[end_idx_web:]
    
    with open(web_path, "w", encoding="utf-8") as f:
        f.write(new_web_content)
    print("Successfully updated web view LiveJaapRoomView.tsx")
else:
    print("Error: Could not locate markers in LiveJaapRoomView.tsx")


# Update LiveJaapRoomView.native.tsx (Native)
native_path = "c:/Users/prarh/Desktop/Brahmand-main/frontend/src/components/LiveJaapRoom/LiveJaapRoomView.native.tsx"
with open(native_path, "r", encoding="utf-8") as f:
    native_content = f.read()

start_idx_native = native_content.find("const HANUMAN_CHALISA_SEGMENTS = [")
end_idx_native = native_content.find("export default function LiveJaapRoomView() {")

if start_idx_native != -1 and end_idx_native != -1:
    new_block_native = ts_segments + "\n\n"
    new_native_content = native_content[:start_idx_native] + new_block_native + native_content[end_idx_native:]
    
    with open(native_path, "w", encoding="utf-8") as f:
        f.write(new_native_content)
    print("Successfully updated native view LiveJaapRoomView.native.tsx")
else:
    print("Error: Could not locate markers in LiveJaapRoomView.native.tsx")
