with open('app/passport/index.tsx', 'r') as f:
    text = f.read()
import re
text = re.sub(r"SANATAN\{\'\n'\}LOK", r"SANATAN{'\\n'}LOK", text)
with open('app/passport/index.tsx', 'w') as f:
    f.write(text)
