with open('frontend/app/(tabs)/home.tsx', 'r') as f:
    content = f.read()

# Add activePostIndex state
state_old = "  const [activePostId, setActivePostId] = useState<string | null>(null);"
state_new = "  const [activePostId, setActivePostId] = useState<string | null>(null);\n  const [activePostIndex, setActivePostIndex] = useState(0);"
if state_old in content:
    content = content.replace(state_old, state_new)
else:
    print("Could not find activePostId state declaration")

# Update onViewableItemsChangedRef
viewable_old = """  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const valid = viewableItems.filter((v: any) => v.isViewable && v.item?.id && v.item.type !== 'empty');
      if (valid.length > 0) {
        setActivePostId(String(valid[0].item.id));
      } else {
        setActivePostId(null);
      }
    } else {
      setActivePostId(null);
    }
  });"""

viewable_new = """  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const valid = viewableItems.filter((v: any) => v.isViewable && v.item?.id && v.item.type !== 'empty');
      if (valid.length > 0) {
        setActivePostId(String(valid[0].item.id));
      } else {
        setActivePostId(null);
      }

      const index = viewableItems[0]?.index;
      if (typeof index === 'number') setActivePostIndex(index);
    } else {
      setActivePostId(null);
    }
  });"""
if viewable_old in content:
    content = content.replace(viewable_old, viewable_new)
else:
    print("Could not find onViewableItemsChangedRef")

# Add to dependencies if not there
deps_old = "}, [activePostId, user, handleLikePost, handleOpenComment, handleOpenPostUserProfile, handlePostMenuPress, handleRepost, handleSharePost, isFocused]);"
deps_new = "}, [activePostId, activePostIndex, user, handleLikePost, handleOpenComment, handleOpenPostUserProfile, handlePostMenuPress, handleRepost, handleSharePost, isFocused]);"
content = content.replace(deps_old, deps_new)

with open('frontend/app/(tabs)/home.tsx', 'w') as f:
    f.write(content)
