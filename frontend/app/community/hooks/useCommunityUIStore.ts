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
