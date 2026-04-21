import re
from pathlib import Path
paths = [Path('app/vendor/[id].tsx'), Path('app/(tabs)/vendor.tsx'), Path('src/components/VoiceOrder.tsx')]
pattern = re.compile(r'>\s*\.\s*<')
for p in paths:
    text = p.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        line = text.count('\n', 0, m.start()) + 1
        print(p, 'line', line, repr(text[m.start():m.end()]))
