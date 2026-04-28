import re

with open("app/library/bhagvad-geeta.tsx", "r") as f:
    text = f.read()

# 1. Update imports
text = text.replace("import {\n  ActivityIndicator,", "import {\n  ActivityIndicator,\n  useWindowDimensions,\n", 1)

# 2. Remove static global dimensions
text = re.sub(r"const \{ width: windowWidth, height: windowHeight \} = Dimensions\.get\('window'\);\n\n.*?\nconst PAGE_BODY_MAX_HEIGHT =\n.*?;\n", "", text, flags=re.DOTALL)

# 3. Create our hook that will calculate layout dynamically
hook = """
export function useBookLayout() {
  const { width, height } = useWindowDimensions();
  
  const availableWidth = width;
  const availableHeight = height - 100; // leaves room for header and footer safe area margins
  
  const targetRatio = 1.45;
  
  let bookWidth = availableWidth;
  let bookHeight = bookWidth / targetRatio;
  
  if (bookHeight > availableHeight) {
    bookHeight = availableHeight;
    bookWidth = bookHeight * targetRatio;
  }
  
  const pageWidth = bookWidth / 2;
  const pageHeaderHeight = Math.max(50, bookHeight * 0.12);
  const pageFooterHeight = Math.max(30, bookHeight * 0.08);
  const pageInnerVerticalPadding = 12;
  const pageBodyGap = 10;
  
  const pageBodyMaxHeight = bookHeight - pageHeaderHeight - pageFooterHeight - pageInnerVerticalPadding * 2;
  
  const scale = Math.min(pageWidth / 190, bookHeight / 260); // base scales
  
  const sanskritTextSize = Math.max(10, Math.min(22, 13 * scale));
  const sanskritLineHeight = sanskritTextSize * 1.5;
  const transliterationSize = Math.max(9, Math.min(18, 11 * scale));
  const transliterationLineHeight = transliterationSize * 1.4;
  const translationSize = Math.max(9, Math.min(18, 11 * scale));
  const translationLineHeight = translationSize * 1.4;
  const verseBase = 46 * scale;
  
  return {
    bookWidth,
    bookHeight,
    pageWidth,
    pageHeaderHeight,
    pageFooterHeight,
    pageInnerVerticalPadding,
    pageBodyGap,
    pageBodyMaxHeight,
    sanskritTextSize,
    sanskritLineHeight,
    transliterationSize,
    transliterationLineHeight,
    translationSize,
    translationLineHeight,
    verseBase,
    lineHeight: sanskritLineHeight
  };
}
"""
text = text.replace("const clamp = ", hook + "\nconst clamp = ")

# 4. Modify estimateVerseHeight and buildPages to take layout parameter
text = text.replace("const estimateVerseHeight = (verse: VerseItem) => {", "const estimateVerseHeight = (verse: VerseItem, layout: ReturnType<typeof useBookLayout>) => {")
text = text.replace("return 84 + lineCount * 19;", "return layout.verseBase + lineCount * layout.lineHeight;")
text = text.replace("const buildPages = (verses: VerseItem[], heights: Record<string, number>) => {", "const buildPages = (verses: VerseItem[], heights: Record<string, number>, layout: ReturnType<typeof useBookLayout>) => {")
text = text.replace("const verseHeight = heights[id] ?? estimateVerseHeight(verse);", "const verseHeight = heights[id] ?? estimateVerseHeight(verse, layout);")
text = text.replace("currentHeight + PAGE_BODY_GAP + verseHeight", "currentHeight + layout.pageBodyGap + verseHeight")
text = text.replace("nextHeight > PAGE_BODY_MAX_HEIGHT", "nextHeight > layout.pageBodyMaxHeight")

# 5. Modify VerseBlock, MeasureVerseBlock, BookPage to take layout
text = text.replace("function VerseBlock({ verse, nightMode }: { verse: VerseItem; nightMode: boolean }) {", "function VerseBlock({ verse, nightMode, layout }: { verse: VerseItem; nightMode: boolean, layout: ReturnType<typeof useBookLayout> }) {")
text = text.replace("function MeasureVerseBlock({", "function MeasureVerseBlock({\n  layout,")
text = text.replace("id: string;", "id: string;\n  layout: ReturnType<typeof useBookLayout>;")
text = text.replace("function BookPage({", "function BookPage({\n  layout,")
text = text.replace("nightMode: boolean;", "nightMode: boolean;\n  layout: ReturnType<typeof useBookLayout>;")

# Replace styles that depend on static sizes
text = text.replace("isLeft ? styles.pageLeftEdges : styles.pageRightEdges,", "isLeft ? styles.pageLeftEdges : styles.pageRightEdges,\n        { width: layout.pageWidth - 6 },")
text = text.replace("style={styles.pageBody}", "style={[styles.pageBody, { height: layout.pageBodyMaxHeight, gap: layout.pageBodyGap }]}")

text = text.replace("style={styles.pageHeader}", "style={[styles.pageHeader, { height: layout.pageHeaderHeight }]}")
text = text.replace("style={styles.pageFooter}", "style={[styles.pageFooter, { height: layout.pageFooterHeight }]}")
text = text.replace("style={[styles.pageInnerFrame,", "style={[styles.pageInnerFrame, { paddingVertical: layout.pageInnerVerticalPadding },")

text = text.replace("<VerseBlock key={`${verse.chapter}-${verse.verse}`} verse={verse}\n nightMode={nightMode} />", "<VerseBlock key={`${verse.chapter}-${verse.verse}`} verse={verse}\n nightMode={nightMode} layout={layout} />")

# Modify text styles inside blocks
v1 = """
      <Text style={[styles.sanskritText, { color: nightMode ? '#F3DEC0' : '#2A1A0B', fontSize: layout.sanskritTextSize, lineHeight: layout.sanskritLineHeight }]}>{verse.text}</Text>

      {transliteration ? (
        <Text style={[styles.transliterationText, { color: nightMode ? '#D8C7A8' : '#5B4729', fontSize: layout.transliterationSize, lineHeight: layout.transliterationLineHeight }]}>
          {transliteration}
        </Text>
      ) : null}

      {!!translation && (
        <Text style={[styles.translationText, { color: nightMode ? '#E6D4B7' : '#3C2A15', fontSize: layout.translationSize, lineHeight: layout.translationLineHeight }]}>
          {translation}
        </Text>
      )}
"""
text = re.sub(r"<Text style=\{\[styles\.sanskritText.*?<\/Text>\s*\)\s*\}", v1.strip(), text, flags=re.DOTALL)

m1 = """
      <Text style={[styles.sanskritText, { fontSize: layout.sanskritTextSize, lineHeight: layout.sanskritLineHeight }]}>{verse.text}</Text>
      {transliteration ? <Text style={[styles.transliterationText, { fontSize: layout.transliterationSize, lineHeight: layout.transliterationLineHeight }]}>{transliteration}</Text> : null}
      {!!translation && <Text style={[styles.translationText, { fontSize: layout.translationSize, lineHeight: layout.translationLineHeight }]}>{translation}</Text>}
"""
text = re.sub(r"<Text style=\{styles\.sanskritText\}>.*?<\/Text>\}", m1.strip(), text, flags=re.DOTALL)

text = text.replace("style={styles.measureVerseBlock}", "style={[styles.measureVerseBlock, { marginBottom: layout.pageBodyGap }]}")

# 6. Inject layout inside main screen component
text = text.replace("export default function BhagvadGeetaReaderScreen() {", "export default function BhagvadGeetaReaderScreen() {\n  const layout = useBookLayout();")

# Book render styles updates in BhagvadGeetaReaderScreen
text = text.replace("buildPages(verses, heights)", "buildPages(verses, heights, layout)")

# Search and Replace these properties in render
text = text.replace("width: BOOK_WIDTH,\n    height: BOOK_HEIGHT,", "width: layout.bookWidth,\n    height: layout.bookHeight,")
text = text.replace("width: BOOK_WIDTH,\n    height: BOOK_HEIGHT,\n    left: -PAGE_WIDTH,", "width: layout.bookWidth,\n    height: layout.bookHeight,\n    left: -layout.pageWidth,")
text = text.replace("width: BOOK_WIDTH,\n    height: BOOK_HEIGHT,\n    flexDirection", "width: layout.bookWidth,\n    height: layout.bookHeight,\n    flexDirection")
text = text.replace("left: PAGE_WIDTH - 16,", "left: layout.pageWidth - 16,")
text = text.replace("width: PAGE_WIDTH - 6,", "width: layout.pageWidth - 6,")

text = text.replace("width: PAGE_WIDTH * 2,\n    height: BOOK_HEIGHT,\n    left: -PAGE_WIDTH,", "width: layout.pageWidth * 2,\n    height: layout.bookHeight,\n    left: -layout.pageWidth,")
text = text.replace("width: PAGE_WIDTH,\n    height: BOOK_HEIGHT,", "width: layout.pageWidth,\n    height: layout.bookHeight,")

text = text.replace("width: PAGE_WIDTH - 6 - 16 * 2 - 8 * 2,", "width: layout.pageWidth - 6 - 16 * 2 - 8 * 2,")

text = text.replace("<BookPage\n                    page={item.left}", "<BookPage\n                    layout={layout}\n                    page={item.left}")
text = text.replace("<BookPage\n                    page={item.right}", "<BookPage\n                    layout={layout}\n                    page={item.right}")
text = text.replace("onMeasure={(k, h) => setHeights((prev) => (\nprev[k] === h ? prev : { ...prev, [k]: h }))} />", "layout={layout} onMeasure={(k, h) => setHeights((prev) => (\nprev[k] === h ? prev : { ...prev, [k]: h }))} />")
text = text.replace("onMeasure={(k, h) => setHeights((prev) => (prev[k] === h ? prev : { ...prev, [k]: h }))} />", "layout={layout} onMeasure={(k, h) => setHeights((prev) => (prev[k] === h ? prev : { ...prev, [k]: h }))} />")

text = text.replace("offset: BOOK_WIDTH * index", "offset: layout.bookWidth * index")
text = text.replace("length: BOOK_WIDTH", "length: layout.bookWidth")
text = text.replace("offsetX / BOOK_WIDTH", "offsetX / layout.bookWidth")
text = text.replace("PAGE_WIDTH / 2", "layout.pageWidth / 2")

with open("app/library/bhagvad-geeta.tsx", "w") as f:
    f.write(text)
print("Done writing patch")
