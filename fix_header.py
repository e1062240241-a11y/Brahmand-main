import re

with open('frontend/src/components/BookLayout.tsx', 'r') as f:
    content = f.read()

# We need to extract the entire topHeaderRow block
# And move it to just before bottomFooterRow

header_pattern = r'(      <View style={\[styles\.topHeaderRow, \{ paddingTop: layout\.safeTop \+ 10 \}\]} pointerEvents="box-none">.*?      </View>\n)'
match = re.search(header_pattern, content, re.DOTALL)

if match:
    header_block = match.group(1)
    
    # Remove it from its current location
    content = content.replace(header_block, '')
    
    # Insert it right before bottomFooterRow
    footer_pattern = r'      <View style=\{styles\.bottomFooterRow\}>'
    content = content.replace(footer_pattern, header_block + '\n' + footer_pattern)
    
    with open('frontend/src/components/BookLayout.tsx', 'w') as f:
        f.write(content)
    print("Header row moved below deskArea")
else:
    print("Header row not found")
