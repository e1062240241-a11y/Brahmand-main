import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Share, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../src/constants/theme';
import { getPostById, getPostComments, addPostComment, repostPost } from '../../src/services/api';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';

const PostScreen = () => {
  const params = useLocalSearchParams<{ id: string | string[]; mediaUrl?: string | string[]; caption?: string | string[]; uploaderName?: string | string[]; uploaderPhoto?: string | string[] }>();
  const router = useRouter();
  const routePostId = Array.isArray(params.id) ? params.id[0] : params.id;
  const routeMediaUrl = Array.isArray(params.mediaUrl) ? params.mediaUrl[0] : params.mediaUrl;
  const routeCaption = Array.isArray(params.caption) ? params.caption[0] : params.caption;
  const routeUploaderName = Array.isArray(params.uploaderName) ? params.uploaderName[0] : params.uploaderName;
  const routeUploaderPhoto = Array.isArray(params.uploaderPhoto) ? params.uploaderPhoto[0] : params.uploaderPhoto;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);

  const loadComments = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 200);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.warn('[Post] Failed to load comments', err);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleOpenComment = useCallback(async (post: any) => {
    if (!post?.id) return;
    setCommentText('');
    setCommentModalVisible(true);
    await loadComments(post.id);
  }, [loadComments]);

  const handleSubmitComment = useCallback(async () => {
    const currentPostId = post?.id || routePostId;
    if (!currentPostId || !commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      await addPostComment(String(currentPostId), commentText.trim());
      setCommentText('');
      await loadComments(String(currentPostId));
    } catch (err: any) {
      console.warn('[Post] Failed to submit comment', err);
      alert('Unable to submit comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentText, loadComments, routePostId, post]);

  const handleShareExternal = useCallback(async (post: any) => {
    if (!post) return;

    const mediaUrl = post.media_url || post.mediaUrl || post.image_url || post.imageUrl || '';
    const caption = post.caption || post.description || '';
    const message = `Check this post on Brahmand!${caption ? `\nCaption: ${caption}` : ''}`;

    try {
      await Share.share({ message, url: mediaUrl || undefined, title: 'Share via Brahmand' });
    } catch (error: any) {
      console.warn('Failed to open share sheet:', error);
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
    } catch (error) {
      console.warn('Failed to copy link:', error);
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
      if (!downloadAsync || !documentDirectory) {
        throw new Error('Download unsupported');
      }
      const ext = selectedSharePost.media_type === 'video' ? 'mp4' : 'jpg';
      const localPath = `${documentDirectory}brahmand_post_${Date.now()}.${ext}`;
      await downloadAsync(selectedSharePost.media_url, localPath);
      alert('Saved to app documents');
    } catch (error) {
      console.warn('Download failed:', error);
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
    const postId = post?.id;
    if (!postId) return;

    try {
      const response = await repostPost(postId);
      const repostedPost = response.data?.post;
      if (repostedPost) {
        setPost(repostedPost);
      }
      alert('Reposted to your feed.');
    } catch (error) {
      console.warn('Failed to repost:', error);
      alert('Could not repost. Please try again.');
    }
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!routePostId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getPostById(String(routePostId));
        setPost(response.data);
      } catch (err: any) {
        setError('Unable to load post.');
        console.warn('[Post] Failed to fetch post by id', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [routePostId]);

  const pId = routePostId ? String(routePostId) : '';
  const pMedia = routeMediaUrl && routeMediaUrl !== 'undefined' ? String(routeMediaUrl) : '';
  const pCap = routeCaption && routeCaption !== 'undefined' ? String(routeCaption) : '';
  const pName = routeUploaderName && routeUploaderName !== 'undefined' ? String(routeUploaderName) : '';
  const pPhoto = routeUploaderPhoto && routeUploaderPhoto !== 'undefined' ? String(routeUploaderPhoto) : '';

  const displayPost = post || {
    id: pId,
    post_id: pId,
    media_url: pMedia,
    image_url: pMedia,
    caption: pCap,
    description: pCap,
    username: pName,
    author: pName,
    user_photo: pPhoto,
    author_photo: pPhoto
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
      </View>
      
      {loading && !post ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      ) : error && !post ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <PostFeedCard
            post={displayPost}
            isActive={true}
            onLike={() => {}}
            onComment={handleOpenComment}
            onShare={handleSharePost}
            onRepost={handleRepost}
            onEdit={() => {}}
            onUserPress={(u: any) => {
              const userId = u?.user_id || u?.user?.id || u?.id;
              if (userId) {
                router.push({ pathname: '/profile/[id]', params: { id: String(userId) } } as any);
              }
            }}
          />
        </ScrollView>
      )}

      <Modal visible={commentModalVisible} transparent animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.commentModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.commentModalSheet}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.commentCloseBtn}>
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
                <ScrollView showsVerticalScrollIndicator={false}>
                  {postComments.map((comment, index) => (
                    <View key={comment.id ?? `comment-${index}`} style={styles.commentItem}>
                      <Text style={styles.commentItemUser}>{comment?.username || 'User'}</Text>
                      <Text style={styles.commentItemText}>{comment?.text || ''}</Text>
                    </View>
                  ))}
                </ScrollView>
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
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md, 
    backgroundColor: COLORS.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  content: { flex: 1 },
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
});
export default PostScreen;
