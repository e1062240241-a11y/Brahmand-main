import re

with open("app/library/bhagvad-geeta.tsx", "r") as f:
    text = f.read()

# I will replace the Dimensions logic
text = re.sub(r"const { width: windowWidth, height: windowHeight } = Dimensions.get\('window'\);\n\n.*?\nconst PAGE_BODY_MAX_HEIGHT =\n.*?;\n\n", "", text, flags=re.DOTALL)

# Add useWindowDimensions to import
text = text.replace("import {", "import { useWindowDimensions,", 1)

# I'll save the modifications manually in my next step
print("Done")
