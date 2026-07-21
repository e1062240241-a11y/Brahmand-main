import React, { useCallback, useEffect, useState } from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, Keyboard} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchByHashtag, getPostComments, addPostComment, deletePostComment } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING } from '../../src/constants/theme';
import { formatTimeAgo } from '../../src/utils/dateUtils';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';



const HashtagPage = () => {
  const insets = useSafeAreaInsets();
  const { tag } = useLocalSearchParams<{ tag: string | string[] }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const rawTag = Array.isArray(tag) ? tag[0] : tag;
  const normalizedTag = rawTag ? decodeURIComponent(rawTag) : rawTag;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Comment Modal States
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);


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
    setReplyingToComment(null);
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
      const parentId = replyingToComment?.id || undefined;
      const response = await addPostComment(selectedCommentPostId, commentText.trim(), parentId);
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
      setReplyingToComment(null);
    } catch (error) {
      console.warn('Failed to add comment:', error);
      alert('Could not post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: any) => {
    const commentId = comment?.id;
    if (!commentId || !selectedCommentPostId) return;

    const originalComments = [...postComments];
    const originalPost = { ...selectedCommentPost };

    setPostComments(prev => prev.filter(c => c.id !== commentId));

    setPosts(prev => prev.map(p => {
      if (p.id === selectedCommentPostId) {
        const currentTop = Array.isArray(p.top_comments) ? p.top_comments : [];
        return {
          ...p,
          comments_count: Math.max(0, (Number(p.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return p;
    }));

    setSelectedCommentPost((prev: any) => {
      if (prev?.id === selectedCommentPostId) {
        const currentTop = Array.isArray(prev.top_comments) ? prev.top_comments : [];
        return {
          ...prev,
          comments_count: Math.max(0, (Number(prev.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return prev;
    });

    try {
      const response = await deletePostComment(selectedCommentPostId, commentId);
      const updatedPostFromServer = response.data?.post;

      if (updatedPostFromServer) {
        setPosts(prev => prev.map(p => {
          if (p.id === selectedCommentPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...p,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return p;
        }));

        setSelectedCommentPost((prev: any) => {
          if (prev?.id === selectedCommentPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...prev,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.warn('Failed to delete comment:', error);
      setPostComments(originalComments);
      setSelectedCommentPost(originalPost);
      setPosts(prev => prev.map(p => p.id === selectedCommentPostId ? originalPost : p));
      const detail = error.response?.data?.detail || error.message;
      Alert.alert('Error', detail || 'Could not delete comment. Please try again.');
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
          <TouchableOpacity onPress={() => router.replace('/home')}>
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
          setReplyingToComment(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.bottomSheet, { paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12)) : SPACING.xl }]}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.commentSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Comments ({selectedCommentPost?.comments_count ?? postComments.length ?? 0})</Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setSelectedCommentPostId(null);
                  setSelectedCommentPost(null);
                  setPostComments([]);
                  setReplyingToComment(null);
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
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                  {(() => {
                    const parentComments = postComments.filter(c => !c.parent_id);
                    const repliesMap = postComments.reduce((acc, c) => {
                      if (c.parent_id) {
                        if (!acc[c.parent_id]) acc[c.parent_id] = [];
                        acc[c.parent_id].push(c);
                      }
                      return acc;
                    }, {} as Record<string, any[]>);

                    return parentComments.map((comment) => {
                      const canDelete = comment.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                      const replies = repliesMap[comment.id] || [];
                      return (
                        <View key={comment.id || `${comment.user_id}-${comment.created_at}-${comment.text}`} style={{ marginBottom: 12 }}>
                          <View style={styles.commentItem}>
                            <Avatar name={comment?.username || 'User'} photo={comment?.user_photo} size={32} />
                            <View style={styles.commentBubble}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={styles.commentItemUser}>{comment?.username || 'User'}</Text>
                                {canDelete && (
                                  <TouchableOpacity
                                    style={{ padding: 4, marginRight: -4, marginTop: -4 }}
                                    onPress={() => handleDeleteComment(comment)}
                                  >
                                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                  </TouchableOpacity>
                                )}
                              </View>
                              <Text style={styles.commentItemText}>{comment?.text || ''}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Text style={styles.commentTime}>{formatTimeAgo(comment?.created_at)}</Text>
                                <TouchableOpacity
                                  style={{ marginLeft: 16 }}
                                  onPress={() => {
                                    setReplyingToComment(comment);
                                    setCommentText(`@${comment.username || 'User'} `);
                                  }}
                                >
                                  <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Reply</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>

                          {/* Render replies */}
                          {replies.length > 0 && (
                            <View style={{
                              marginLeft: 40,
                              paddingLeft: 16,
                              borderLeftWidth: 1.5,
                              borderLeftColor: '#E6E1E8',
                              marginTop: 8,
                            }}>
                              {replies.map((reply: any) => {
                                const canDeleteReply = reply.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                                return (
                                  <View key={reply.id} style={[styles.commentItem, { position: 'relative', paddingLeft: 4, marginBottom: 10 }]}>
                                    {/* Horizontal connection branch */}
                                    <View style={{
                                      position: 'absolute',
                                      left: -16,
                                      top: 16,
                                      width: 12,
                                      height: 1.5,
                                      backgroundColor: '#E6E1E8',
                                    }} />

                                    <Avatar name={reply?.username || 'User'} photo={reply?.user_photo} size={28} />
                                    <View style={[styles.commentBubble, { backgroundColor: '#F8F5F9' }]}>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={[styles.commentItemUser, { fontSize: 13 }]}>{reply?.username || 'User'}</Text>
                                        {canDeleteReply && (
                                          <TouchableOpacity
                                            style={{ padding: 4, marginRight: -4, marginTop: -4 }}
                                            onPress={() => handleDeleteComment(reply)}
                                          >
                                            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                      <Text style={[styles.commentItemText, { fontSize: 13 }]}>{reply?.text || ''}</Text>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={styles.commentTime}>{formatTimeAgo(reply?.created_at)}</Text>
                                        <TouchableOpacity
                                          style={{ marginLeft: 16 }}
                                          onPress={() => {
                                            setReplyingToComment(comment);
                                            setCommentText(`@${reply.username} `);
                                          }}
                                        >
                                          <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>Reply</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    });
                  })()}
                </KeyboardAwareScrollView>
              ) : (
                <View style={styles.commentEmptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.border} />
                  <Text style={styles.commentEmptyText}>No comments yet.</Text>
                  <Text style={styles.commentEmptySubtext}>Be the first to comment!</Text>
                </View>
              )}
            </View>

            {replyingToComment && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: COLORS.background,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderTopWidth: 0.5,
                borderTopColor: COLORS.divider,
                marginBottom: 8,
                width: '100%',
              }}>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  Replying to <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>@{replyingToComment.username}</Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyingToComment(null)}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.commentInputWrap}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Add a comment..."}
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
            {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
          </View>
        </KeyboardAvoidingView>
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
  inlineDeletePopover: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
    zIndex: 999,
  },
  inlineDeleteText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
export default HashtagPage;
