import { create } from 'zustand';
import { ViewHistory, loadViewHistory, saveViewHistory, recordView } from '../utils/feedRanker';

interface TabFeedData {
  posts: any[];
  offset: number;
  hasMore: boolean;
  lastFetched: number;
}

interface FeedState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabFeeds: Record<string, TabFeedData>;
  setTabFeed: (tab: string, data: Partial<TabFeedData>) => void;
  clearCache: () => void;
  removePost: (postId: string) => void;

  // ─── Smart Rotation ───────────────────────────────────────────────────────
  /** Per-user view history (loaded from AsyncStorage on init) */
  viewHistory: ViewHistory;
  /** IDs shown in current session — used for Rule 5 (15-post gap) */
  sessionShownIds: string[];
  /** Load history for a given userId */
  loadHistory: (userId: string) => Promise<void>;
  /** Record a post as viewed (increments count + persists) */
  markViewed: (postId: string, userId: string) => void;
  /** Track recently shown IDs in current session */
  addSessionShown: (postId: string) => void;
  /** Clear rotation state on logout */
  clearRotation: () => void;
}

const initialTabData = (): TabFeedData => ({
  posts: [],
  offset: 0,
  hasMore: true,
  lastFetched: 0,
});

export const useFeedStore = create<FeedState>((set, get) => ({
  activeTab: 'for_you',
  setActiveTab: (tab) => set({ activeTab: tab }),
  tabFeeds: {
    for_you: initialTabData(),
    following: initialTabData(),
    trending: initialTabData(),
    festivals: initialTabData(),
  },
  setTabFeed: (tab, data) =>
    set((state) => {
      const currentTabFeed = state.tabFeeds[tab] || initialTabData();
      return {
        tabFeeds: {
          ...state.tabFeeds,
          [tab]: {
            ...currentTabFeed,
            ...data,
          },
        },
      };
    }),
  clearCache: () =>
    set({
      tabFeeds: {
        for_you: initialTabData(),
        following: initialTabData(),
        trending: initialTabData(),
        festivals: initialTabData(),
      },
    }),
  removePost: (postId) =>
    set((state) => {
      const updatedTabFeeds = { ...state.tabFeeds };
      Object.keys(updatedTabFeeds).forEach((tab) => {
        const feed = updatedTabFeeds[tab];
        if (feed && feed.posts) {
          const originalLength = feed.posts.length;
          const filtered = feed.posts.filter((p) => p.id !== postId);
          const removedCount = originalLength - filtered.length;
          updatedTabFeeds[tab] = {
            ...feed,
            posts: filtered,
            offset: Math.max(0, feed.offset - removedCount),
          };
        }
      });
      return { tabFeeds: updatedTabFeeds };
    }),

  // ─── Smart Rotation State ─────────────────────────────────────────────────
  viewHistory: new Map(),
  sessionShownIds: [],

  loadHistory: async (userId: string) => {
    const history = await loadViewHistory(userId);
    set({ viewHistory: history });
  },

  markViewed: (postId: string, userId: string) => {
    const updatedHistory = recordView(get().viewHistory, postId);
    set({ viewHistory: new Map(updatedHistory) });
    // Persist asynchronously — fire-and-forget
    saveViewHistory(userId, updatedHistory).catch(() => {});
  },

  addSessionShown: (postId: string) => {
    set((state) => {
      const updated = [...state.sessionShownIds, postId];
      // Keep last 30 to cover Rule 5's 15-post window
      return { sessionShownIds: updated.slice(-30) };
    });
  },

  clearRotation: () => {
    set({ viewHistory: new Map(), sessionShownIds: [] });
  },
}));
