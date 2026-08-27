/**
 * Global Block Store
 *
 * Single source of truth for the current user's blocked user list.
 * All screens subscribe to this store so block/unblock actions take
 * effect globally without requiring a navigation reload.
 */
import { create } from 'zustand';
import { getBlockedUsers, getUsersWhoBlockedMe } from '../services/firebase/moderationService';
import { getBlockedUsersApi } from '../services/api';

interface BlockState {
  blockedUserIds: string[];
  blockedByMeUserIds: string[];
  // ⚡ Bolt: O(1) lookup sets maintained in sync with array counterparts
  blockedUserSet: Set<string>;
  blockedByMeUserSet: Set<string>;
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
  blockedUserSet: new Set(),
  blockedByMeUserSet: new Set(),
  isLoading: false,

  loadBlocked: async (currentUserId: string) => {
    if (!currentUserId) return;
    set({ isLoading: true });
    try {
      let blockedByMe: string[] = [];
      let blockedMe: string[] = [];

      try {
        [blockedByMe, blockedMe] = await Promise.all([
          getBlockedUsers(currentUserId).catch(() => [] as string[]),
          getUsersWhoBlockedMe(currentUserId).catch(() => [] as string[]),
        ]);
      } catch (firestoreError) {
        console.warn('[blockStore] Firestore client read failed, attempting backend API fallback:', firestoreError);
      }

      // If Firestore returned empty or failed due to permission rules, fetch from backend API
      if (blockedByMe.length === 0) {
        try {
          const response = await getBlockedUsersApi();
          if (response && response.data && Array.isArray(response.data)) {
            blockedByMe = response.data.map((u: any) => String(u.id));
          }
        } catch (apiError) {
          // Backend fallback silent fail if no blocks exist
        }
      }

      const combined = Array.from(new Set([...blockedByMe, ...blockedMe]));
      set({ 
        blockedUserIds: combined, 
        blockedByMeUserIds: blockedByMe,
        blockedUserSet: new Set(combined),
        blockedByMeUserSet: new Set(blockedByMe)
      });
    } catch (e) {
      console.warn('[blockStore] Failed to load blocked users:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addBlock: (uid: string) => {
    const uidStr = String(uid);
    set((state) => {
      const nextUserSet = new Set(state.blockedUserSet);
      nextUserSet.add(uidStr);
      const nextByMeSet = new Set(state.blockedByMeUserSet);
      nextByMeSet.add(uidStr);

      return {
        blockedUserIds: Array.from(nextUserSet),
        blockedByMeUserIds: Array.from(nextByMeSet),
        blockedUserSet: nextUserSet,
        blockedByMeUserSet: nextByMeSet,
      };
    });
  },

  removeBlock: (uid: string) => {
    const uidStr = String(uid);
    set((state) => {
      const nextUserSet = new Set(state.blockedUserSet);
      nextUserSet.delete(uidStr);
      const nextByMeSet = new Set(state.blockedByMeUserSet);
      nextByMeSet.delete(uidStr);

      return {
        blockedUserIds: Array.from(nextUserSet),
        blockedByMeUserIds: Array.from(nextByMeSet),
        blockedUserSet: nextUserSet,
        blockedByMeUserSet: nextByMeSet,
      };
    });
  },

  isBlocked: (uid: string) => {
    return get().blockedUserSet.has(String(uid));
  },

  isBlockedByMe: (uid: string) => {
    return get().blockedByMeUserSet.has(String(uid));
  },

  reset: () => {
    set({ blockedUserIds: [], blockedByMeUserIds: [], blockedUserSet: new Set(), blockedByMeUserSet: new Set(), isLoading: false });
  },
}));
