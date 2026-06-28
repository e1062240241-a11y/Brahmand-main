import os
import re

missing_props = []

with open('flatlist_files.txt') as f:
    files = f.read().splitlines()

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()

        # Find all FlatList tags
        flatlists = re.findall(r'<FlatList[\s\S]*?(?:/>|>)', content)
        for i, fl in enumerate(flatlists):
            if 'windowSize' not in fl or 'initialNumToRender' not in fl or 'maxToRenderPerBatch' not in fl:
                missing_props.append(f"{filepath}: FlatList {i+1} missing props. Found in {fl[:50]}...")

for m in missing_props:
    print(m)
