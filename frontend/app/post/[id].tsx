import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Share, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../src/constants/theme';
import { getPostsFeed, getPostById, getPostComments, addPostComment, repostPost, deletePostComment } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const FEED_PAGE_SIZE = 7;

const PostScreen = () => {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routePostId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuthStore();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialPostLoaded, setInitialPostLoaded] = useState(false);

  const [activePostKey, setActivePostKey] = useState<string | null>(null);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const postHeightsRef = useRef<Record<string, number>>({});

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentPost, setCommentPost] = useState<any>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);
  const hasScrolled = useRef(false);

  const feedPostKeys = useMemo(
    () => feedPosts.map((post, index) => String(post.id || post.media_url || index)),
    [feedPosts],
  );

  useEffect(() => {
    if (feedPostKeys.length > 0 && !activePostKey && !hasScrolled.current) {
      setActivePostKey(feedPostKeys[0]);
    }
  }, [feedPostKeys, activePostKey]);

  const loadFeed = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!append) setLoadingFeed(true);
    else setLoadingMore(true);
    try {
      let targetPost: any = null;
      if (!append && routePostId) {
        try {
          const targetRes = await getPostById(routePostId as string);
          if (targetRes.data) {
            targetPost = targetRes.data.post || targetRes.data;
          }
        } catch (e) {
          console.warn('Failed to fetch specific post', e);
        }
      }

      const response = await getPostsFeed(FEED_PAGE_SIZE, offset, 'for_you');
      const payload = response.data;
      let feedItems = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);

      let items: any[] = [];
      if (targetPost) {
        feedItems = feedItems.filter((p: any) => String(p.id) !== String(targetPost.id));
        items = [targetPost, ...feedItems];
      } else {
        items = feedItems;
      }

      const nextHasMore = typeof payload?.has_more === 'boolean' ? payload.has_more : feedItems.length === FEED_PAGE_SIZE;

      if (append) {
        setFeedPosts(prev => {
          const seen = new Set(prev.map(p => String(p.id)));
          const newItems = items.filter(p => !seen.has(String(p.id)));
          return [...prev, ...newItems];
        });
      } else {
        setFeedPosts(items);
      }
      setFeedOffset(offset + feedItems.length);
      setHasMore(nextHasMore);
    } catch (err) {
      console.warn('[Post] Failed to load feed', err);
    } finally {
      setLoadingFeed(false);
      setLoadingMore(false);
    }
  }, [routePostId]);

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  useEffect(() => {
    if (feedPosts.length > 0 && routePostId && !hasScrolled.current) {
      const idx = feedPosts.findIndex(
        p => String(p.id) === String(routePostId) || String(p.post_id) === String(routePostId)
      );
      if (idx >= 0) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
          hasScrolled.current = true;
          setActivePostKey(feedPostKeys[idx]);
        }, 300);
      }
      setInitialPostLoaded(true);
    }
  }, [feedPosts, routePostId, feedPostKeys]);

  const loadComments = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 200);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleOpenComment = useCallback((post: any) => {
    if (!post?.id) return;
    setCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);
    loadComments(post.id);
  }, [loadComments]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentPost?.id || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const response = await addPostComment(String(commentPost.id), commentText.trim());
      const updatedPost = response.data?.post || response.data;
      if (updatedPost) {
        setFeedPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, ...updatedPost } : p));
        setCommentPost((prev: any) => prev?.id === commentPost.id ? { ...prev, ...updatedPost } : prev);
      }
      setCommentText('');
      await loadComments(String(commentPost.id));
    } catch {
      alert('Unable to submit comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentText, loadComments, commentPost]);

  const handleDeleteComment = useCallback(async (comment: any) => {
    const commentId = comment?.id;
    if (!commentId || !commentPost?.id) return;

    const originalComments = [...postComments];
    const originalPost = { ...commentPost };

    setPostComments(prev => prev.filter(c => c.id !== commentId));

    const targetPostId = commentPost.id;
    setFeedPosts(prev => prev.map(p => {
      if (p.id === targetPostId) {
        const currentTop = Array.isArray(p.top_comments) ? p.top_comments : [];
        return {
          ...p,
          comments_count: Math.max(0, (Number(p.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return p;
    }));

    setCommentPost((prev: any) => {
      if (prev?.id === targetPostId) {
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
      const response = await deletePostComment(String(targetPostId), commentId);
      const updatedPostFromServer = response.data?.post;

      if (updatedPostFromServer) {
        setFeedPosts(prev => prev.map(p => {
          if (p.id === targetPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...p,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return p;
        }));

        setCommentPost((prev: any) => {
          if (prev?.id === targetPostId) {
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
      setCommentPost(originalPost);
      setFeedPosts(prev => prev.map(p => p.id === targetPostId ? originalPost : p));
      const detail = error.response?.data?.detail || error.message;
      alert(detail || 'Could not delete comment. Please try again.');
    }
  }, [postComments, commentPost]);

  const handleShareExternal = useCallback(async (post: any) => {
    if (!post) return;
    const mediaUrl = post.media_url || post.mediaUrl || post.image_url || post.imageUrl || '';
    const caption = post.caption || post.description || '';
    const link = `https://brahmand.app/post/${post.id}`;
    const message = `Check this post on Brahmand!${caption ? `\nCaption: ${caption}` : ''}\n\n${link}`;
    try {
      await Share.share({ message, url: link || undefined, title: 'Share via Brahmand' });
    } catch {
      alert('Could not open share sheet. Please try again.');
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!selectedSharePost?.id) return;
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(`https://brahmand.app/post/${selectedSharePost.id}`);
      alert('Link copied to clipboard');
      setShareModalVisible(false);
    } catch {
      alert('Could not copy link.');
    }
  }, [selectedSharePost]);

  const handleDownload = useCallback(async () => {
    if (!selectedSharePost?.media_url) {
      alert('No media available to download.');
      setShareModalVisible(false);
      return;
    }
    try {
      const module = await import('expo-file-system');
      const FileSystemModule = (module as any).default ?? module;
      const documentDirectory = FileSystemModule?.documentDirectory as string | undefined;
      const downloadAsync = FileSystemModule?.downloadAsync as ((uri: string, fileUri: string) => Promise<any>) | undefined;
      if (!downloadAsync || !documentDirectory) throw new Error('Download unsupported');
      const ext = selectedSharePost.media_type === 'video' ? 'mp4' : 'jpg';
      const localPath = `${documentDirectory}brahmand_post_${Date.now()}.${ext}`;
      await downloadAsync(selectedSharePost.media_url, localPath);
      alert('Saved to app documents');
    } catch {
      alert('Download failed');
    } finally {
      setShareModalVisible(false);
    }
  }, [selectedSharePost]);

  const handleSharePost = useCallback((post: any) => {
    setSelectedSharePost(post);
    setShareModalVisible(true);
  }, []);

  const handleRepost = useCallback(async (post: any) => {
    if (!post?.id) return;
    try {
      await repostPost(post.id);
      alert('Reposted to your feed.');
    } catch {
      alert('Could not repost. Please try again.');
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) loadFeed(feedOffset, true);
  }, [loadingMore, hasMore, feedOffset, loadFeed]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const postKey = String(item.id || item.media_url || index);
    return (
      <View
        onLayout={(event) => {
          const y = event.nativeEvent.layout.y;
          const h = event.nativeEvent.layout.height;
          postOffsetsRef.current[postKey] = y;
          postHeightsRef.current[postKey] = h;
        }}
      >
        <PostFeedCard
          post={item}
          isActive={activePostKey === postKey}
          onLike={() => { }}
          onComment={handleOpenComment}
          openCommentsOnCaptionPress
          onShare={handleSharePost}
          onRepost={handleRepost}
          onEdit={() => { }}
          onUserPress={(u: any) => {
            const userId = u?.user_id || u?.user?.id || u?.id;
            if (userId) {
              router.push({ pathname: '/profile/[id]', params: { id: String(userId) } } as any);
            }
          }}
          theme="light"
        />
      </View>
    );
  }, [activePostKey, handleOpenComment, handleSharePost, handleRepost, router]);

  const keyExtractor = useCallback((item: any, index: number) => String(item.id || item.media_url || index), []);

  const onScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    let closestKey: string | null = null;
    let maxVisible = 0;
    for (const key of feedPostKeys) {
      const offset = postOffsetsRef.current[key];
      const height = postHeightsRef.current[key];
      if (typeof offset === 'number' && typeof height === 'number') {
        const visibleTop = Math.max(0, offset - y);
        const visibleBottom = Math.min(SCREEN_HEIGHT, offset + height - y);
        const visibleAmount = Math.max(0, visibleBottom - visibleTop);
        if (visibleAmount > maxVisible) {
          maxVisible = visibleAmount;
          closestKey = key;
        }
      }
    }
    setActivePostKey(prev => closestKey ?? prev);
  }, [feedPostKeys]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Posts</Text>
      </View>

      {loadingFeed && feedPosts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={feedPosts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={commentModalVisible} transparent animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.commentModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.commentModalSheet, { paddingBottom: keyboardVisible ? 8 : (Platform.OS === 'ios' ? SPACING.lg : SPACING.md) }]}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments ({commentPost?.comments_count ?? postComments.length ?? 0})</Text>
              <TouchableOpacity onPress={() => { setCommentModalVisible(false); }} style={styles.commentCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.commentList}>
              {commentsLoading ? (
                <View style={styles.commentLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : postComments.length === 0 ? (
                <Text style={styles.commentEmptyText}>No comments yet. Be the first to comment.</Text>
              ) : (
                <FlatList
                  data={postComments}
                  keyExtractor={(item, idx) => String(item.id || idx)}
                  renderItem={({ item }) => {
                    const canDelete = item.user_id === user?.id || commentPost?.user_id === user?.id;
                    return (
                      <View style={styles.commentItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                          {canDelete && (
                            <TouchableOpacity
                              style={{ padding: 4, marginRight: -4 }}
                              onPress={() => handleDeleteComment(item)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <MentionText style={styles.commentItemText} text={item?.text || ''} />
                      </View>
                    );
                  }}
                />
              )}
            </View>

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor={COLORS.textSecondary}
                style={styles.commentTextInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSubmitBtn, !commentText.trim() && styles.commentSubmitDisabled]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Ionicons name="send" size={18} color={commentText.trim() ? COLORS.primary : COLORS.textLight} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>



      <SharePostModal
        visible={shareModalVisible}
        post={selectedSharePost}
        onClose={() => setShareModalVisible(false)}
        onShareExternal={() => {
          if (selectedSharePost) handleShareExternal(selectedSharePost);
          setShareModalVisible(false);
        }}
        onCopyLink={handleCopyLink}
        onDownload={handleDownload}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  listContent: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  commentModalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    maxHeight: '90%',
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  commentCloseBtn: {
    padding: SPACING.sm,
  },
  commentList: {
    minHeight: 120,
    maxHeight: 280,
    marginBottom: SPACING.sm,
  },
  commentLoadingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  commentEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  commentItem: {
    marginBottom: SPACING.sm,
  },
  commentItemUser: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  commentItemText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  commentSubmitBtn: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  commentSubmitDisabled: {
    backgroundColor: COLORS.divider,
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

export default PostScreen;
