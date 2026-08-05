with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

# Make it const PostFeedCardComponent = ({
start_str = "export const PostFeedCard = memo(({"
idx = content.find(start_str)

if idx != -1:
    content = content[:idx] + "const PostFeedCardComponent = ({" + content[idx + len(start_str):]

    end_idx = content.rfind("});")
    if end_idx != -1:
        new_end = """};

export const PostFeedCard = memo(
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
        content = content[:end_idx] + new_end + content[end_idx+3:]

with open('frontend/src/components/PostFeedCard.tsx', 'w') as f:
    f.write(content)
