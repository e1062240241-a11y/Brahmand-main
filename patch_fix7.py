with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

# Let's clean up the malformed file
# We are getting `Line 968, column 1: ',' expected.` because of our previous patch_fix6.py which did:
# const PostFeedCardComponent = ({ ... }) -> we replaced `export const PostFeedCard = memo(({`
# But the file probably didn't end nicely. Let's inspect the end.
import re

# Find where it ends
match = re.search(r"(\s*)\}\);\s*\nconst styles = StyleSheet.create", content)
if match:
    indent = match.group(1)
    content = content[:match.start()] + f"{indent}}};" + content[match.end()-28:]
    print("Fixed closing bracket!")

with open('frontend/src/components/PostFeedCard.tsx', 'w') as f:
    f.write(content)
