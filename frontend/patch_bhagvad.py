import re

with open("app/library/bhagvad-geeta.tsx", "r") as f:
    text = f.read()

# 1. Update imports
text = text.replace("import {\n  ActivityIndicator,", "import {\n  ActivityIndicator,\n  useWindowDimensions,\n", 1)

# 2. Remove static global dimensions
text = re.sub(r"const { width: windowWidth, height: windowHeight }.*?const PAGE_BODY_MAX_HEIGHT =.*?;", "", text, flags=re.DOTALL)

# 3. Modify estimateVerseHeight and buildPages to take layout parameter
text = text.replace("const estimateVerseHeight = (verse: VerseItem) => {", "const estimateVerseHeight = (verse: VerseItem, layout: any) => {")
text = text.replace("return 84 + lineCount * 19;", "return layout.verseBase + lineCount * layout.lineHeight;")
text = text.replace("const buildPages = (verses: VerseItem[], heights: Record<string, number>) => {", "const buildPages = (verses: VerseItem[], heights: Record<string, number>, layout: any) => {")
text = text.replace("const verseHeight = heights[id] ?? estimateVerseHeightimport re

with open("app/libra h
with opd]     text = f.read()

# 1. Update imports
text = text.r
# 1. Update imporghttext = text.replac v
# 2. Remove static global dimensions
text = re.sub(r"const { width: windowWidth, height: windowHeight }.*?const PAIGHtext = re.sub(r"const { width: windxH
# 3. Modify estimateVerseHeight and buildPages to take layout parameter
text = text.replace("const estimateVerseHeight = (verse:htMode }: { verse: VerseItem; nightMode: boolean }) {", "function VerseBloctext = text.replace("return 84 + lineCount * 19;", "return layout.verseBase + lineCount * layout.lineHeight;")
text = text.replace("const bui",text = text.replace("const buildPages = (verses: VerseItem[], heights: Record<string, number>) => {", "const 

text = text.replace("const verseHeight = heights[id] ?? estimateVerseHeightimport re

with open("app/libra h
with opd]     text = f.read()

# 1. Update imports
text = text.r
# 1. Update imporghtt.p
with open("app/libra h
with opd]     text = f.read()

# 1. Update imports
text = teRiwith opd]     text = wi
# 1. Update imports
text = ")
text = text.r
# 1.e("style={styles# 2. Remove static global dimensions
te{ text = re.sub(r"const { width: wind}"# 3. Modify estimateVerseHeight and buildPages to take layout parameter
text = text.replace("const estimateVerseHeigsetext = text.replace("const estimateVerseHeight = (verse:htMode }: { veertext = text.replace("const bui",text = text.replace("const buildPages = (verses: VerseItem[], heights: Record<string, number>) => {", "const 

text = text.replace("const verseHeight = heights[id] ?? estimateVerseHeightimport re

with open("tS
text = text.replace("const verseHeight = heights[id] ?? estimateVerseHeightimport re

with open("app/libra h
with opd]     text = f.read()
Mode \? '#F3DEC0' : '#2A1A0B' \}\]\}>\{verse\.text\}<\/Text>", verse_styles.strip(), textwith opd]     text = ur
# 1. Update imports
text = [sttext = text.r
# 1. {# 1. Update aywith open("app/libra hliwith opd]     text = kr
# 1. Update }]}>{verse.text}</Text>
"""
text = re.sub(r"<Text style=\{styles\.sanskritext = ")
text = textext = txt# 1.e("stylestte{ text = re.sub(r"const { width: wind}"# 3. Modify esy/text = text.replace("const estimateVerseHeigsetext = text.replreplacements applied")
