with open('app/passport/index.tsx', 'r') as f:
    text = f.read()

import re
# Match {"\n"} where \n is literally a newline character
# that was produced by the python script replacing {"\\n"} with a literal newline.
text = re.sub(r'\{"\n"\}', r'{"\\n"}', text)

with open('app/passport/index.tsx', 'w') as f:
    f.write(text)
