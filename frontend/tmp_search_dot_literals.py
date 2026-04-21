import re
from pathlib import Path
paths = [Path('app/vendor/[id].tsx'), Path('app/(tabs)/vendor.tsx'), Path('src/components/VoiceOrder.tsx')]
pattern = re.compile(r"\{\s*'\\.'\s*\}|\{\s*\"\\.\"\s*\}")
for p in paths:
    text = p.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        print(p, m.group(0), 'line', text.count('\n', 0, m.start()) + 1)
