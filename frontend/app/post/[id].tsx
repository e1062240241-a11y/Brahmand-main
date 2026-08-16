import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Share, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Keyboard, FlatList } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../src/constants/theme';
import { getPostsFeed, getPostById, getPostComments, addPostComment, repostPost, deletePostComment } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { useBlockStore } from '../../src/store/blockStore';
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';
import { ReportModal } from '../../src/components/ReportModal';
import { originalAlert } from '../../src/utils/nativeAlert';
import { CommentOptionsModal } from '../../src/components/CommentOptionsModal';
import { blockUser, unblockUser } from '../../src/services/firebase/moderationService';
import { BlockConfirmationModal } from '../../src/components/BlockConfirmationModal';
import { useTranslation } from '../../src/utils/i18n';
import { socketService } from '../../src/services/socket';
const SafeFlashList = FlashList as any;

const FEED_PAGE_SIZE = 7;

const PostScreen = () => {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const routePostId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuthStore();
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

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialPostLoaded, setInitialPostLoaded] = useState(false);
  // Global pool of all posts loaded this session — used for recycling when all posts are seen
  const allSessionPostsRef = useRef<any[]>([]);
  const seenPostIdsRef = useRef<Set<string>>(new Set());

  const [activePostKey, setActivePostKey] = useState<string | null>(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentPost, setCommentPost] = useState<any>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  const [commentModalToRestore, setCommentModalToRestore] = useState(false);

  // Global block store — shared across all screens
  const blockedUserIds = useBlockStore(state => state.blockedUserIds);
  const blockedByMeUserIds = useBlockStore(state => state.blockedByMeUserIds);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);

  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
  const [pendingReportComment, setPendingReportComment] = useState<any | null>(null);
  const [keptComments, setKeptComments] = useState<any[]>([]);
  const [commentOptionsModalVisible, setCommentOptionsModalVisible] = useState(false);
  const [commentOptions, setCommentOptions] = useState<any[]>([]);

  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockConfirmData, setBlockConfirmData] = useState<{
    targetUserId: string;
    username: string;
    isBlocked: boolean;
    onConfirm: () => void;
  } | null>(null);

  const listRef = useRef<any>(null);
  const hasScrolled = useRef(false);

  const blockedUidsRef = useRef<string[]>([]);
  useEffect(() => {
    blockedUidsRef.current = [...blockedUserIds, ...blockedByMeUserIds];
  }, [blockedUserIds, blockedByMeUserIds]);

  const visibleFeedPosts = useMemo(() => {
    const blocked = blockedUidsRef.current;
    if (blocked.length === 0) return feedPosts;
    return feedPosts.filter((post: any) => {
      const uid = post?.user_id || post?.creator_id || post?.creator?.id || post?.sender_id;
      if (!uid) return true;
      return !blocked.includes(String(uid));
    });
  }, [feedPosts, blockedUserIds, blockedByMeUserIds]);

  const feedPostKeys = useMemo(
    () => visibleFeedPosts.map((post, index) => String(post.id || post.media_url || index)),
    [visibleFeedPosts],
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

      // Pass seen IDs so backend prioritises unseen content
      const seenParam = Array.from(seenPostIdsRef.current).slice(-250).join(',');
      const response = await getPostsFeed(FEED_PAGE_SIZE, 0, 'for_you', seenParam);
      const payload = response.data;
      let feedItems = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);

      let rawItems: any[] = [];
      if (targetPost) {
        feedItems = feedItems.filter((p: any) => String(p.id) !== String(targetPost.id));
        rawItems = [targetPost, ...feedItems];
      } else {
        rawItems = feedItems;
      }

      // Filter invalid posts (missing/null id) and deduplicate rawItems chunk
      const cleanItems: any[] = [];
      const seenIds = new Set<string>();
      for (const item of rawItems) {
        if (!item || item.id === undefined || item.id === null || String(item.id).trim() === '') {
          continue;
        }
        const idStr = String(item.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          cleanItems.push(item);
        }
      }

      // Add clean items to the global session pool
      for (const p of cleanItems) {
        const idStr = String(p.id);
        if (!allSessionPostsRef.current.find((x: any) => String(x.id) === idStr)) {
          allSessionPostsRef.current.push(p);
        }
      }

      if (append) {
        setFeedPosts(prev => {
          const existing = new Set(prev.map(p => String(p.id)));
          const newItems = cleanItems.filter(p => !existing.has(String(p.id)));

          if (newItems.length === 0) {
            // All returned posts already visible — recycle from session pool (shuffled)
            const pool = allSessionPostsRef.current;
            if (pool.length > 1) {
              const shuffled = [...pool].sort(() => Math.random() - 0.5);
              const recycledFiltered = shuffled.filter(p => p && p.id && !existing.has(String(p.id)));
              return [...prev, ...recycledFiltered.slice(0, FEED_PAGE_SIZE * 2)];
            }
            return prev;
          }
          return [...prev, ...newItems];
        });
      } else {
        setFeedPosts(cleanItems);
      }
      setFeedOffset(offset + feedItems.length);
      // Always keep hasMore true so the feed is truly infinite via recycling
      setHasMore(true);
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
    if (visibleFeedPosts.length > 0 && routePostId && !hasScrolled.current) {
      const idx = visibleFeedPosts.findIndex(
        p => String(p?.id) === String(routePostId) || String(p?.post_id) === String(routePostId)
      );
      if (idx !== -1 && listRef.current) {
        hasScrolled.current = true;
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
          setActivePostKey(feedPostKeys[idx]);
        }, 100);
      }
      setInitialPostLoaded(true);
    }
  }, [visibleFeedPosts, routePostId, feedPostKeys]);

  const loadComments = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 200);
      const comments = Array.isArray(response.data) ? response.data : [];
      const merged = [...comments];
      keptComments.forEach(kc => {
        if (kc && kc.id && !merged.some(c => c.id === kc.id)) {
          merged.push(kc);
        }
      });
      merged.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setPostComments(merged);
    } catch {
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [keptComments]);

  const handleOpenComment = useCallback((post: any) => {
    if (!post?.id) return;
    setCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);
    loadComments(post.id);
  }, [loadComments]);

  // Listen for new comments via socket — no polling
  useEffect(() => {
    if (!commentModalVisible || !commentPost?.id) return;
    const postId = String(commentPost.id);
    const room = `post_${postId}`;

    socketService.joinRoom(room).catch(() => {});

    const handleNewComment = (data: any) => {
      if (String(data.post_id) !== postId) return;
      const comment = data.comment;
      if (!comment) return;
      setPostComments(prev => {
        if (prev.some(c => c.id === comment.id)) return prev;
        const merged = [...prev, comment];
        merged.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        return merged;
      });
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: data.comments_count || p.comments_count } : p));
    };
    const handleCommentDeleted = (data: any) => {
      if (String(data.post_id) !== postId) return;
      setPostComments(prev => prev.filter(c => c.id !== data.comment_id));
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: data.comments_count || p.comments_count } : p));
    };

    socketService.onEvent('new_comment', handleNewComment);
    socketService.onEvent('comment_deleted', handleCommentDeleted);

    return () => {
      socketService.offEvent('new_comment', handleNewComment);
      socketService.offEvent('comment_deleted', handleCommentDeleted);
      socketService.leaveRoom(room);
    };
  }, [commentModalVisible, commentPost?.id]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentPost?.id || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const parentId = replyingToComment?.id || undefined;
      const response = await addPostComment(String(commentPost.id), commentText.trim(), parentId);
      const updatedPost = response.data?.post || response.data;
      if (updatedPost) {
        setFeedPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, ...updatedPost } : p));
        setCommentPost((prev: any) => prev?.id === commentPost.id ? { ...prev, ...updatedPost } : prev);
      }
      setCommentText('');
      setReplyingToComment(null);
      await loadComments(String(commentPost.id));
    } catch {
      alert('Unable to submit comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentText, loadComments, commentPost, replyingToComment]);

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

  const handleCommentMenuPress = useCallback((comment: any) => {
    if (!comment || !user?.id) return;
    const targetUserId = comment.user_id || comment.userId || comment.sender_id || comment.user?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserIds.includes(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

    const handleToggleBlock = async () => {
      const performBlockToggle = async () => {
        try {
          if (isUserCurrentlyBlocked) {
            await unblockUser(user.id, targetUserId);
            removeBlock(String(targetUserId));
            Alert.alert('Success', `${comment.username || 'User'} has been unblocked.`);
          } else {
            await blockUser(user.id, targetUserId);
            addBlock(String(targetUserId));
            
            // Dismiss comments modal first
            setCommentModalVisible(false);

            Alert.alert('Success', `${comment.username || 'User'} has been blocked.`);

            // If this post belongs to the blocked user, go back
            const postOwnerId = commentPost?.user_id || commentPost?.userId || commentPost?.user?.id;
            if (String(postOwnerId) === String(targetUserId)) {
              router.back();
            }
          }
        } catch (err) {
          console.error('Error toggling block in comment menu:', err);
          Alert.alert('Error', 'Could not update block status. Please try again.');
        }
      };

      if (Platform.OS === 'android') {
        setBlockConfirmData({
          targetUserId: String(targetUserId),
          username: comment.username || 'User',
          isBlocked: isUserCurrentlyBlocked,
          onConfirm: performBlockToggle,
        });
        setBlockConfirmVisible(true);
      } else {
        Alert.alert(
          isUserCurrentlyBlocked ? 'Unblock User' : 'Block User',
          isUserCurrentlyBlocked
            ? `Are you sure you want to unblock ${comment.username || 'this user'}?`
            : `Are you sure you want to block ${comment.username || 'this user'}? You will no longer see their posts, comments, or messages.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: isUserCurrentlyBlocked ? 'Unblock' : 'Block',
              style: isUserCurrentlyBlocked ? 'default' : 'destructive',
              onPress: performBlockToggle,
            }
          ]
        );
      }
    };

    if (Platform.OS === 'ios') {
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Comment', blockLabel],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Comment Options'
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 1) {
            setPendingReportComment(comment);
            setCommentModalToRestore(commentModalVisible);
            setCommentModalVisible(false);
            setTimeout(() => {
              setReportCommentModalVisible(true);
            }, 300);
          } else if (buttonIndex === 2) {
            await handleToggleBlock();
          }
        }
      );
    } else {
      setCommentOptions([
        {
          label: 'Report Comment',
          icon: 'flag-outline',
          onPress: () => {
            setPendingReportComment(comment);
            setReportCommentModalVisible(true);
          }
        },
        {
          label: blockLabel,
          isDestructive: true,
          icon: 'ban-outline',
          onPress: handleToggleBlock
        }
      ]);
      setCommentOptionsModalVisible(true);
    }
  }, [user?.id, blockedByMeUserIds, commentModalVisible]);

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
    if (!loadingMore) loadFeed(feedOffset, true);
  }, [loadingMore, feedOffset, loadFeed]);

  const handleUserPress = useCallback((u: any) => {
    const userId = u?.user_id || u?.user?.id || u?.id;
    if (userId) {
      router.push({ pathname: '/profile/[id]', params: { id: String(userId) } } as any);
    }
  }, [router]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;
  const activePostKeyRef = useRef<string | null>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (!viewableItems || viewableItems.length === 0) return;

    const validItems = viewableItems.filter((v: any) => v && v.isViewable && v.item?.id);
    if (validItems.length === 0) return;

    let mostVisible = validItems[0];
    for (const v of validItems) {
      const pCurrent = v.percentVisible !== undefined ? v.percentVisible : 100;
      const pMost = mostVisible.percentVisible !== undefined ? mostVisible.percentVisible : 0;
      if (pCurrent > pMost) {
        mostVisible = v;
      }
    }

    if (mostVisible?.item?.id) {
      const key = String(mostVisible.item.id);
      if (key !== activePostKeyRef.current) {
        activePostKeyRef.current = key;
        setActivePostKey(key);
        seenPostIdsRef.current.add(key);
      }
    }
  }).current;

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const postKey = String(item.id);
    return (
      <PostFeedCard
        post={item}
        isActive={activePostKey === postKey}
        onComment={handleOpenComment}
        openCommentsOnCaptionPress
        onShare={handleSharePost}
        onRepost={handleRepost}
        onUserPress={handleUserPress}
        theme="light"
      />
    );
  }, [activePostKey, handleOpenComment, handleSharePost, handleRepost, handleUserPress]);

  const keyExtractor = useCallback((item: any, index: number) => {
    if (!item || item.id === undefined || item.id === null) {
      return `post-idx-${index}`;
    }
    return String(item.id);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('posts')}</Text>
      </View>

      {loadingFeed && visibleFeedPosts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loadingPosts')}</Text>
        </View>
      ) : (
        <SafeFlashList
          ref={listRef}
          data={visibleFeedPosts}
          renderItem={renderItem}
          // OPT: Bolt ⚡ - Add estimatedItemSize to prevent continuous measuring during initial render
          estimatedItemSize={480}
          keyExtractor={keyExtractor}
          extraData={activePostKey}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={true}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
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

      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setReplyingToComment(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.commentModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            activeOpacity={1}
            onPress={() => {
              setCommentModalVisible(false);
              setReplyingToComment(null);
            }}
          />
          <View style={[styles.commentModalSheet, { paddingBottom: keyboardVisible ? 8 : (Platform.OS === 'ios' ? SPACING.lg : Math.max(insets.bottom, 12)) }]}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>{t('comments')} ({commentPost?.comments_count ?? postComments.length ?? 0})</Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setReplyingToComment(null);
                }}
                style={styles.commentCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.commentList}>
              {commentsLoading ? (
                <View style={styles.commentLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : postComments.length === 0 ? (
                <Text style={styles.commentEmptyText}>{t('noCommentsYet2')}</Text>
              ) : (() => {
                const parentComments = postComments.filter(c => {
                  const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
                  const isBlockedUser = uid && blockedUserIds.includes(String(uid));
                  return !c.parent_id && !isBlockedUser;
                });
                const repliesMap = postComments.reduce((acc, c) => {
                  const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
                  const isBlockedUser = uid && blockedUserIds.includes(String(uid));
                  if (c.parent_id && !isBlockedUser) {
                    if (!acc[c.parent_id]) acc[c.parent_id] = [];
                    acc[c.parent_id].push(c);
                  }
                  return acc;
                }, {} as Record<string, any[]>);

                return (
                  <FlatList
                    data={parentComments}
                    keyExtractor={(item: any, idx: number) => String(item.id || idx)}
                    renderItem={({ item }: { item: any }) => {
                      const canDelete = item.user_id === user?.id || commentPost?.user_id === user?.id;
                      const replies = repliesMap[item.id] || [];
                      return (
                        <View style={{ marginBottom: 12 }}>
                          <View style={styles.commentItem}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                              {canDelete ? (
                                <TouchableOpacity
                                  style={{ padding: 4, marginRight: -4 }}
                                  onPress={() => handleDeleteComment(item)}
                                >
                                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={{ padding: 4, marginRight: -4 }}
                                  onPress={() => handleCommentMenuPress(item)}
                                >
                                  <Ionicons name="ellipsis-horizontal" size={16} color={COLORS.textLight} />
                                </TouchableOpacity>
                              )}
                            </View>
                            <MentionText style={styles.commentItemText} text={item?.text || ''} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  setReplyingToComment(item);
                                  setCommentText(`@${item.username || 'User'} `);
                                }}
                              >
                                <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>{t('reply')}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Render replies */}
                          {replies.length > 0 && (
                            <View style={{
                              marginLeft: 12,
                              paddingLeft: 16,
                              borderLeftWidth: 1.5,
                              borderLeftColor: '#E6E1E8',
                              marginTop: 8,
                            }}>
                              {replies.map((reply: any) => {
                                const canDeleteReply = reply.user_id === user?.id || commentPost?.user_id === user?.id;
                                return (
                                  <View key={reply.id} style={[styles.commentItem, { position: 'relative', paddingLeft: 4, marginBottom: 10 }]}>
                                    {/* Horizontal connection branch */}
                                    <View style={{
                                      position: 'absolute',
                                      left: -16,
                                      top: 10,
                                      width: 12,
                                      height: 1.5,
                                      backgroundColor: '#E6E1E8',
                                    }} />

                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.commentItemUser, { fontSize: 13 }]}>{reply?.username || 'User'}</Text>
                                        {canDeleteReply ? (
                                          <TouchableOpacity
                                            style={{ padding: 4, marginRight: -4 }}
                                            onPress={() => handleDeleteComment(reply)}
                                          >
                                            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                          </TouchableOpacity>
                                        ) : (
                                          <TouchableOpacity
                                            style={{ padding: 4, marginRight: -4 }}
                                            onPress={() => handleCommentMenuPress(reply)}
                                          >
                                            <Ionicons name="ellipsis-horizontal" size={14} color={COLORS.textLight} />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                      <MentionText style={[styles.commentItemText, { fontSize: 13 }]} text={reply?.text || ''} />
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <TouchableOpacity
                                          onPress={() => {
                                            setReplyingToComment(item);
                                            setCommentText(`@${reply.username} `);
                                          }}
                                        >
                                          <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>{t('reply')}</Text>
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
                    }}
                  />
                );
              })()}
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
              }}>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  {t('replyingTo')} <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>@{replyingToComment.username}</Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyingToComment(null)}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={replyingToComment ? `${t('reply')} @${replyingToComment.username}...` : t('addComment')}
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
            {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
            {Platform.OS === 'android' && (
              <ReportModal
                visible={reportCommentModalVisible}
                onClose={() => {
                  setReportCommentModalVisible(false);
                  setPendingReportComment(null);
                }}
                reporterUid={user?.id || ''}
                reportedUserUid={pendingReportComment?.userId || pendingReportComment?.user_id || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
                contentId={String(pendingReportComment?.id || '')}
                contentType="comment"
                postId={pendingReportComment?.post_id || commentPost?.id || ''}
                apiFallback={async (reason, description) => {
                  if (pendingReportComment?.id) {
                    const { reportComment } = require('../../src/services/api');
                    await reportComment(String(pendingReportComment.id), reason, description || '');
                  }
                }}
                onSuccess={() => {
                  // Keep reported comment visible
                  if (pendingReportComment) {
                    setKeptComments(prev => {
                      if (prev.some(c => c.id === pendingReportComment.id)) return prev;
                      return [...prev, pendingReportComment];
                    });
                  }
                }}
              />
            )}
            {Platform.OS === 'android' && (
              <CommentOptionsModal
                visible={commentOptionsModalVisible}
                onClose={() => setCommentOptionsModalVisible(false)}
                options={commentOptions}
              />
            )}
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

      {/* Apple Guideline 1.2 - Report Comment Modal */}
      {Platform.OS !== 'android' && (
        <ReportModal
          visible={reportCommentModalVisible}
          onClose={() => {
            setReportCommentModalVisible(false);
            setPendingReportComment(null);
            if (commentModalToRestore) {
              setTimeout(() => {
                setCommentModalVisible(true);
                setCommentModalToRestore(false);
              }, 300);
            }
          }}
          reporterUid={user?.id || ''}
          reportedUserUid={pendingReportComment?.userId || pendingReportComment?.user_id || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
          contentId={String(pendingReportComment?.id || '')}
          contentType="comment"
          postId={pendingReportComment?.post_id || commentPost?.id || ''}
          apiFallback={async (reason, description) => {
            if (pendingReportComment?.id) {
              const { reportComment } = require('../../src/services/api');
              await reportComment(String(pendingReportComment.id), reason, description || '');
            }
          }}
          onSuccess={() => {
            // Keep reported comment visible
          }}
        />
      )}
      
      {blockConfirmData && (
        <BlockConfirmationModal
          visible={blockConfirmVisible}
          onClose={() => setBlockConfirmVisible(false)}
          onConfirm={blockConfirmData.onConfirm}
          username={blockConfirmData.username}
          isBlocked={blockConfirmData.isBlocked}
        />
      )}
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
