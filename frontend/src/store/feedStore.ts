import { create } from 'zustand';

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
}

const initialTabData = (): TabFeedData => ({
  posts: [],
  offset: 0,
  hasMore: true,
  lastFetched: 0,
});

export const useFeedStore = create<FeedState>((set) => ({
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
}));
