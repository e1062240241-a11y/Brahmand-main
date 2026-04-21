import re
from pathlib import Path
pattern = re.compile(r'>\s*\.\s*<')
for p in Path('.').rglob('*.tsx'):
    text = p.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        line = text.count('\n', 0, m.start()) + 1
        print(p, line, repr(text[m.start():m.end()]))
