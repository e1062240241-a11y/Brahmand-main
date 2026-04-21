import re

path = 'app/vendor/[id].tsx'
text = open(path, 'r', encoding='utf-8').read()
stack = []
inside_tag = False
brace_depth = 0
i = 0
text_start = None
while i < len(text):
    c = text[i]
    if inside_tag:
        if c == '>':
            tag = text[tag_start + 1:i].strip()
            if tag.startswith('!--'):
                inside_tag = False
                i += 1
                continue
            if tag.endswith('/'):
                inside_tag = False
                i += 1
                continue
            if tag.startswith('/'):
                if stack:
                    stack.pop()
            else:
                m = re.match(r'([A-Za-z0-9_\.]+)', tag)
                if m:
                    stack.append(m.group(1))
            inside_tag = False
        i += 1
    else:
        if c == '<' and brace_depth == 0:
            if text_start is not None:
                val = text[text_start:i]
                parent = stack[-1] if stack else None
                if parent != 'Text':
                    print('RAW_TEXT', repr(val), 'parent=', parent, 'line=', text.count('\n', 0, text_start) + 1)
                text_start = None
            inside_tag = True
            tag_start = i
            i += 1
        else:
            if c == '{':
                brace_depth += 1
            elif c == '}' and brace_depth > 0:
                brace_depth -= 1
            if text_start is None:
                text_start = i
            i += 1
if text_start is not None:
    val = text[text_start:]
    parent = stack[-1] if stack else None
    if parent != 'Text':
        print('RAW_TEXT', repr(val), 'parent=', parent, 'line=', text.count('\n', 0, text_start) + 1)
