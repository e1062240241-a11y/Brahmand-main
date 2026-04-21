import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchByHashtag, getPostComments, addPostComment } from '../../src/services/api';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING } from '../../src/constants/theme';

// Helper
const formatTimeAgo = (dateString: string | null | undefined) => {
  if (!dateString) return 'now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
};


const HashtagPage = () => {
  const { tag } = useLocalSearchParams<{ tag: string | string[] }>();
  const router = useRouter();
  const rawTag = Array.isArray(tag) ? tag[0] : tag;
  const normalizedTag = rawTag ? decodeURIComponent(rawTag) : rawTag;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Comment Modal States
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);


  const loadHashtagPosts = useCallback(async (pageOffset: number = 0) => {
    if (!normalizedTag) {
      setLoading(false);
      setHasMore(false);
      return;
    }
    if (pageOffset === 0) setLoading(true);
    try {
      const response = await searchByHashtag(normalizedTag, 20, pageOffset);
      const newPosts = response.data?.items || [];
      
      if (pageOffset === 0) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      
      setHasMore(response.data?.has_more || false);
      setOffset(pageOffset + newPosts.length);
    } catch (error) {
      console.warn('Failed to load hashtag posts:', error);
    } finally {
      setLoading(false);
    }
  }, [normalizedTag]);

  useEffect(() => {
    loadHashtagPosts(0);
  }, [loadHashtagPosts]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadHashtagPosts(offset);
    }
  };

  const handleLikePost = async (post: any) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
            : p
        )
      );
    } catch (error) {
      console.warn('Failed to like post:', error);
    }
  };

  const handleOpenComment = async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    setSelectedCommentPostId(postId);
    setSelectedCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);

    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 300);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedCommentPostId || !commentText.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPostId, commentText.trim());
      const updatedPost = response.data?.post;

      if (updatedPost) {
        setPosts((prev) =>
          prev.map((item) => (item.id === selectedCommentPostId ? { ...item, ...updatedPost } : item))
        );
        setSelectedCommentPost((prev: any) => (prev?.id === selectedCommentPostId ? { ...prev, ...updatedPost } : prev));
      }

      const commentsResponse = await getPostComments(selectedCommentPostId, 300);
      setPostComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
      setCommentText('');
    } catch (error) {
      console.warn('Failed to add comment:', error);
      alert('Could not post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleOpenPostUserProfile = (post: any) => {
    const userId = post?.user_id || post?.user?.id;
    if (!userId) return;
    router.push({ pathname: '/profile/[id]', params: { id: String(userId) } } as any);
  };

  const handleSharePost = async (post: any) => {
    try {
      alert('Share functionality would open share sheet');
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  const handleRepost = async (post: any) => {
    try {
      alert('Repost functionality activated for post');
    } catch (error) {
      console.warn('Failed to repost:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.replace('/feed')}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginLeft: 12 }}>
            #{normalizedTag || ''}
          </Text>
        </View>
      </View>

      {loading && posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => `${item.id || index}`}
          renderItem={({ item }) => (
            <PostFeedCard
              post={item}
              onLike={handleLikePost}
              onComment={handleOpenComment}
              onShare={handleSharePost}
              onRepost={handleRepost}
              onUserPress={handleOpenPostUserProfile}
              onPostMenuPress={() => {}}
              postMenuType="report"
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && posts.length > 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Ionicons name="search" size={48} color={COLORS.textLight} />
          <Text style={{ fontSize: 16, color: COLORS.textLight, marginTop: 12, textAlign: 'center' }}>
            No posts found for #{normalizedTag || ''}
          </Text>
        </View>
      )}

      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setSelectedCommentPostId(null);
          setSelectedCommentPost(null);
          setPostComments([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.commentSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setSelectedCommentPostId(null);
                  setSelectedCommentPost(null);
                  setPostComments([]);
                }}
                style={styles.commentCloseBtn}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedCommentPost?.caption ? (
              <View style={styles.commentPostPreview}>
                <Avatar name={selectedCommentPost?.username || 'User'} photo={selectedCommentPost?.user_photo} size={32} />
                <View style={styles.commentPreviewTextWrap}>
                  <Text style={styles.commentPreviewUser}>{selectedCommentPost?.username}</Text>
                  <Text style={styles.commentPreviewCaption} numberOfLines={2}>{selectedCommentPost.caption}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.commentListWrap}>
              {commentsLoading ? (
                <Text style={styles.commentEmptyText}>Loading comments...</Text>
              ) : postComments.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {postComments.map((comment) => (
                    <View key={comment.id || `${comment.user_id}-${comment.created_at}-${comment.text}`} style={styles.commentItem}>
                      <Avatar name={comment?.username || 'User'} photo={comment?.user_photo} size={32} />
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentItemUser}>{comment?.username || 'User'}</Text>
                        <Text style={styles.commentItemText}>{comment?.text || ''}</Text>
                        <Text style={styles.commentTime}>{formatTimeAgo(comment?.created_at)}</Text>
                      </View>
                      <TouchableOpacity style={styles.commentLikeBtn}>
                        <Ionicons name="heart-outline" size={16} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.commentEmptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.border} />
                  <Text style={styles.commentEmptyText}>No comments yet.</Text>
                  <Text style={styles.commentEmptySubtext}>Be the first to comment!</Text>
                </View>
              )}
            </View>

            <View style={styles.commentInputWrap}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSubmitBtn, !commentText.trim() && styles.commentSubmitDisabled]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    height: '85%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  commentSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  commentCloseBtn: {
    padding: SPACING.xs,
  },
  commentPostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentPreviewTextWrap: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  commentPreviewUser: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  commentPreviewCaption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  commentListWrap: {
    flex: 1,
    minHeight: 200,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  commentBubble: {
    flex: 1,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  commentItemUser: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 13,
  },
  commentItemText: {
    color: COLORS.text,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  commentLikeBtn: {
    padding: SPACING.xs,
  },
  commentEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  commentEmptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: SPACING.md,
  },
  commentEmptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  commentInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    fontSize: 15,
    color: COLORS.text,
    paddingTop: 8,
  },
  commentSubmitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  commentSubmitDisabled: {
    backgroundColor: COLORS.border,
  },
});
export default HashtagPage;
