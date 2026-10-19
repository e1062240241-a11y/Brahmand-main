import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the loop update in get_pending_kyc (from legacy sync)
# Hmm, that is a bit complex as it's a loop. Let's look for other redundant fetches.

# Search for update followed by get
search_re = re.compile(r"await db\.update_document\('([^']+)',\s*([^,]+),\s*([^)]+)\)\s*.*?(?:\n\s*.*?)?await db\.get_document\('\1',\s*\2\)", re.DOTALL)
matches = search_re.findall(content)
for match in matches:
    print(f"Found update followed by get for {match[0]}, {match[1]}")
