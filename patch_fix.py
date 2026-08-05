with open('frontend/app/(tabs)/home.tsx', 'r') as f:
    content = f.read()

# Add distanceFromActive calculation
render_old = "const renderFeedPost = useCallback(({ item, index }: { item: any; index: number }) => {"
render_new = """const renderFeedPost = useCallback(({ item, index }: { item: any; index: number }) => {
    const distanceFromActive = Math.abs(index - activePostIndex);"""
content = content.replace(render_old, render_new)

postcard_old = """        <PostFeedCard
          post={item}"""
postcard_new = """        <PostFeedCard
          distanceFromActive={distanceFromActive}
          post={item}"""
content = content.replace(postcard_old, postcard_new)

with open('frontend/app/(tabs)/home.tsx', 'w') as f:
    f.write(content)
