with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

# Make sure useMemo is imported
if "useMemo" not in content[:500]:
    content = content.replace("useState", "useState, useMemo")

old_caption_block = """  const captionText = String(post?.caption || '').trim();
  const captionWords = captionText.split(/\s+/).filter(Boolean);
  const collapsedCaption = captionWords.slice(0, 4).join(' ') + (captionWords.length > 4 ? '...' : '');
  const isLongCaption = captionWords.length > 4;
  const captionSegments = captionText ? parseCaption(captionText) : [];"""

new_caption_block = """  const captionText = String(post?.caption || '').trim();

  const { captionWords, collapsedCaption, isLongCaption } = useMemo(() => {
    const words = captionText.split(/\s+/).filter(Boolean);
    const collapsed = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
    return {
      captionWords: words,
      collapsedCaption: collapsed,
      isLongCaption: words.length > 4
    };
  }, [captionText]);

  const captionSegments = useMemo(() => {
    if (!captionText) return [];
    return parseCaption(captionText);
  }, [captionText]);"""

if old_caption_block in content:
    content = content.replace(old_caption_block, new_caption_block)
    print("Replaced caption block")
else:
    print("Could not find caption block")

with open('frontend/src/components/PostFeedCard.tsx', 'w') as f:
    f.write(content)
