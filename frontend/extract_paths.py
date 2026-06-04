import re

log_path = "/Users/developer/.gemini/antigravity/brain/ebab3de7-d2d8-47a0-b3cf-3b14212b1826/.system_generated/logs/overview.txt"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Let's search for SVG_PATHS definitions in the text
matches = [m.start() for m in re.finditer("SVG_PATHS", content)]

for i, idx in enumerate(matches):
    print(f"--- MATCH {i} ---")
    start = max(0, idx - 100)
    end = min(len(content), idx + 1500)
    print(content[start:end])
    print("\n" + "="*50 + "\n")
