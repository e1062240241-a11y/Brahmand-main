with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

# Make sure we add it to the memo component export
old_memo = """export const PostFeedCard = memo(
  PostFeedCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.post?.id === nextProps.post?.id &&
      prevProps.post?.likes_count === nextProps.post?.likes_count &&
      prevProps.post?.liked_by_me === nextProps.post?.liked_by_me &&
      prevProps.post?.comments_count === nextProps.post?.comments_count &&
      prevProps.post?.caption === nextProps.post?.caption &&
      prevProps.post?.media_url === nextProps.post?.media_url &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.isFocused === nextProps.isFocused
    );
  }
);"""

new_memo = """export const PostFeedCard = memo(
  PostFeedCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.post?.id === nextProps.post?.id &&
      prevProps.post?.likes_count === nextProps.post?.likes_count &&
      prevProps.post?.liked_by_me === nextProps.post?.liked_by_me &&
      prevProps.post?.comments_count === nextProps.post?.comments_count &&
      prevProps.post?.caption === nextProps.post?.caption &&
      prevProps.post?.media_url === nextProps.post?.media_url &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.isFocused === nextProps.isFocused &&
      prevProps.distanceFromActive === nextProps.distanceFromActive
    );
  }
);"""

if old_memo in content:
    content = content.replace(old_memo, new_memo)
else:
    # Try just adding it to whatever memo definition is there
    if "prevProps.isFocused === nextProps.isFocused" in content and "prevProps.distanceFromActive" not in content:
        content = content.replace("prevProps.isFocused === nextProps.isFocused\n", "prevProps.isFocused === nextProps.isFocused &&\n      prevProps.distanceFromActive === nextProps.distanceFromActive\n")

with open('frontend/src/components/PostFeedCard.tsx', 'w') as f:
    f.write(content)
