import { useCallback, useMemo } from 'react';
import { Alert, ActionSheetIOS, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCommunityStore } from '../store/useCommunityStore';
import { useAuthStore } from '../../../../src/store/authStore';
import {
  deleteCommunityMessage,
  sendCommunityMessage,
  resolveCommunityRequest,
  deleteCommunityRequest,
  reportContent,
  toggleRequestInterest
} from '../../../../src/services/api';
import { originalAlert } from '../../../../src/utils/nativeAlert';
import { useTranslation } from '../../../../src/utils/i18n';

// A simple UI store to hold modal states to avoid re-rendering the whole list
import { create } from 'zustand';

interface CommunityUIState {
  activeActionSheetPostId: string | null;
  reportPostId: string | null;
  deleteConfirmPostId: string | null;
  replyingToPostId: string | null;

  openActionSheet: (postId: string) => void;
  closeActionSheet: () => void;

  openReportModal: (postId: string) => void;
  closeReportModal: () => void;

  openDeleteConfirm: (postId: string) => void;
  closeDeleteConfirm: () => void;

  setReplyingTo: (postId: string | null) => void;
}

export const useCommunityUIStore = create<CommunityUIState>((set) => ({
  activeActionSheetPostId: null,
  reportPostId: null,
  deleteConfirmPostId: null,
  replyingToPostId: null,

  openActionSheet: (postId) => set({ activeActionSheetPostId: postId }),
  closeActionSheet: () => set({ activeActionSheetPostId: null }),

  openReportModal: (postId) => set({ reportPostId: postId }),
  closeReportModal: () => set({ reportPostId: null }),

  openDeleteConfirm: (postId) => set({ deleteConfirmPostId: postId }),
  closeDeleteConfirm: () => set({ deleteConfirmPostId: null }),

  setReplyingTo: (postId) => set({ replyingToPostId: postId })
}));

export const useCommunityActions = (communityId: string | null) => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLikePost = useCallback(async (postId: string) => {
    const state = useCommunityStore.getState();
    const post = state.posts[postId];
    const user = useAuthStore.getState().user;

    if (!post || !user || !communityId) return;

    const myId = user.id || user._id;
    const currentReaction = post.user_reaction;
    const isLiking = currentReaction !== 'like';

    // Optimistic Update
    const updatedReactions = { ...(post.reactions || {}) };
    if (isLiking) {
      updatedReactions['like'] = (updatedReactions['like'] || 0) + 1;
    } else {
      updatedReactions['like'] = Math.max(0, (updatedReactions['like'] || 0) - 1);
    }

    state.updatePost(postId, {
      user_reaction: isLiking ? 'like' : null,
      reactions: updatedReactions
    });

    try {
       // Fire and forget socket/API call.
       // Depending on existing logic in [id].tsx, it used sendCommunityMessage with 'reaction_update'
       const messageData = {
          message_type: 'reaction_update',
          messageId: postId,
          reaction: isLiking ? 'like' : null
       };
       await sendCommunityMessage(communityId, messageData);
    } catch (error) {
       // Rollback on fail
       state.updatePost(postId, {
         user_reaction: currentReaction,
         reactions: post.reactions // restore original
       });
       console.error("Failed to like post", error);
    }
  }, [communityId]);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!communityId) return;
    try {
      await deleteCommunityMessage(communityId, postId);
      useCommunityStore.getState().removePost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      originalAlert('Error', 'Failed to delete post.');
    }
  }, [communityId]);

  const handleReportPost = useCallback(async (postId: string, reason: string) => {
    const post = useCommunityStore.getState().posts[postId];
    if (!post) return;
    try {
      await reportContent({
        content_type: 'community_post',
        content_id: postId,
        community_id: communityId,
        reason: reason,
        reported_user_id: post.sender_id
      });
      // original logic was just to alert success
      originalAlert('Success', 'Content reported successfully. Our team will review it shortly.');
    } catch (error) {
      console.error('Error reporting content:', error);
      originalAlert('Error', 'Failed to report content. Please try again.');
    }
  }, [communityId]);

  const handleSharePost = useCallback(async (postId: string) => {
    const post = useCommunityStore.getState().posts[postId];
    if (!post) return;

    try {
      let contentToShare = post.content || '';
      if (post.caption) {
        contentToShare += `\n${post.caption}`;
      }
      const shareUrl = `https://katha.nettyfish.com/community/${communityId}?post=${postId}`;

      const result = await Share.share({
        message: `${contentToShare}\n\nJoin the conversation on Brahmand: ${shareUrl}`,
        url: shareUrl,
        title: 'Share Post'
      });
    } catch (error: any) {
       console.log('Error sharing:', error);
    }
  }, [communityId]);

  const handleCopyText = useCallback((text: string) => {
     if (!text) return;
     Clipboard.setStringAsync(text).then(() => {
        // Assume toast is handled globally or just silently copy
     });
  }, []);

  const openThread = useCallback((postId: string) => {
    const post = useCommunityStore.getState().posts[postId];
    if (!post || !communityId) return;
    router.push({
      pathname: '/community/community-tweets',
      params: {
        id: communityId,
        messageId: postId,
        messageType: post.message_type
      }
    });
  }, [communityId, router]);

  const toggleInterest = useCallback(async (postId: string) => {
    const post = useCommunityStore.getState().posts[postId];
    if (!post || !communityId) return;

    try {
       await toggleRequestInterest(communityId, postId);
       // Assuming socket handles the actual list of attendees/interests update
    } catch (e) {
       console.error("Error toggling interest", e);
    }
  }, [communityId]);

  const resolveRequest = useCallback(async (postId: string) => {
     if (!communityId) return;
     try {
       await resolveCommunityRequest(communityId, postId);
       // Socket updates status
     } catch (e) {
       console.error("Error resolving request", e);
     }
  }, [communityId]);

  const triggerActionSheet = useCallback((postId: string) => {
     const user = useAuthStore.getState().user;
     const post = useCommunityStore.getState().posts[postId];
     if (!user || !post) return;

     const myId = user.id || user._id;
     const isMe = post.sender_id === myId;

     if (Platform.OS === 'ios') {
        const options = isMe
          ? ['Cancel', 'Share', 'Delete']
          : ['Cancel', 'Share', 'Report'];
        const destructiveButtonIndex = isMe ? 2 : 2;

        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: 0, destructiveButtonIndex },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              handleSharePost(postId);
            } else if (buttonIndex === 2) {
              if (isMe) {
                 useCommunityUIStore.getState().openDeleteConfirm(postId);
              } else {
                 useCommunityUIStore.getState().openReportModal(postId);
              }
            }
          }
        );
     } else {
        // Android fallback - Open custom bottom sheet via UI store
        useCommunityUIStore.getState().openActionSheet(postId);
     }
  }, [handleSharePost]);

  return useMemo(() => ({
    handleLikePost,
    handleDeletePost,
    handleReportPost,
    handleSharePost,
    handleCopyText,
    openThread,
    toggleInterest,
    resolveRequest,
    triggerActionSheet
  }), [
    handleLikePost,
    handleDeletePost,
    handleReportPost,
    handleSharePost,
    handleCopyText,
    openThread,
    toggleInterest,
    resolveRequest,
    triggerActionSheet
  ]);
};
