/**
 * Global Block Store
 *
 * Single source of truth for the current user's blocked user list.
 * All screens subscribe to this store so block/unblock actions take
 * effect globally without requiring a navigation reload.
 */
import { create } from 'zustand';
import { Platform } from 'react-native';
import { getBlockedUsers, getUsersWhoBlockedMe } from '../services/firebase/moderationService';
import { getBlockedUsersApi } from '../services/api';

interface BlockState {
  blockedUserIds: string[];
  blockedByMeUserIds: string[];
  isLoading: boolean;
  /** Load all blocked UIDs (both directions) for the given user */
  loadBlocked: (currentUserId: string) => Promise<void>;
  /** Optimistically add a UID to the blocked list */
  addBlock: (uid: string) => void;
  /** Optimistically remove a UID from the blocked list */
  removeBlock: (uid: string) => void;
  /** Returns true if the given UID is in the block list */
  isBlocked: (uid: string) => boolean;
  /** Returns true if the current user blocked the target UID */
  isBlockedByMe: (uid: string) => boolean;
  /** Reset state on logout */
  reset: () => void;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedUserIds: [],
  blockedByMeUserIds: [],
  isLoading: false,

  loadBlocked: async (currentUserId: string) => {
    if (!currentUserId) return;
    set({ isLoading: true });
    try {
      let blockedByMe: string[] = [];
      let blockedMe: string[] = [];

      try {
        [blockedByMe, blockedMe] = await Promise.all([
          getBlockedUsers(currentUserId),
          getUsersWhoBlockedMe(currentUserId).catch(() => [] as string[]),
        ]);
      } catch (_firebaseError) {
        // Direct Firestore read restricted by rules, seamlessly fallback to backend API
        try {
          const response = await getBlockedUsersApi();
          if (response && response.data) {
            blockedByMe = response.data.map((u: any) => String(u.id));
          }
        } catch (apiError) {
          console.warn('[blockStore] Backend API fallback failed:', apiError);
        }
      }

      const combined = Array.from(new Set([...blockedByMe, ...blockedMe]));
      set({ 
        blockedUserIds: combined, 
        blockedByMeUserIds: blockedByMe 
      });
    } catch (e) {
      console.warn('[blockStore] Failed to load blocked users:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addBlock: (uid: string) => {
    const uidStr = String(uid);
    set((state) => ({
      blockedUserIds: Array.from(new Set([...state.blockedUserIds, uidStr])),
      blockedByMeUserIds: Array.from(new Set([...state.blockedByMeUserIds, uidStr])),
    }));
  },

  removeBlock: (uid: string) => {
    const uidStr = String(uid);
    set((state) => ({
      blockedUserIds: state.blockedUserIds.filter((id) => id !== uidStr),
      blockedByMeUserIds: state.blockedByMeUserIds.filter((id) => id !== uidStr),
    }));
  },

  isBlocked: (uid: string) => {
    return get().blockedUserIds.includes(String(uid));
  },

  isBlockedByMe: (uid: string) => {
    return get().blockedByMeUserIds.includes(String(uid));
  },

  reset: () => {
    set({ blockedUserIds: [], blockedByMeUserIds: [], isLoading: false });
  },
}));
