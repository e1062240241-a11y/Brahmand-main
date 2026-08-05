with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

import re

# Find and fix the comma separation issue on memo.
match = re.search(r"export const PostFeedCard = memo\(\s*PostFeedCardComponent,\s*\(prevProps, nextProps\) => \{", content)
if match:
    print("Memo function signature is fine.")
else:
    print("Memo function signature has issue!")
