import { create } from 'zustand';

export interface ChatCache {
  messages: any[];
  circleInfo: any;
  communityInfo: any;
  lastFetched: number;
}

export interface CommunityScreenCache {
  community: any;
  requests: any[];
  events: any[];
  communityPosts: any[];
  allFestivals: any[];
  lastFetched: number;
}

interface ChatState {
  caches: Record<string, ChatCache>;
  communityScreenCaches: Record<string, CommunityScreenCache>;
  setChatCache: (key: string, data: Partial<ChatCache>) => void;
  setCommunityScreenCache: (key: string, data: Partial<CommunityScreenCache>) => void;
  clearCache: () => void;
}

const initialChatCache = (): ChatCache => ({
  messages: [],
  circleInfo: null,
  communityInfo: null,
  lastFetched: 0,
});

const initialCommunityScreenCache = (): CommunityScreenCache => ({
  community: null,
  requests: [],
  events: [],
  communityPosts: [],
  allFestivals: [],
  lastFetched: 0,
});

export const useChatStore = create<ChatState>((set) => ({
  caches: {},
  communityScreenCaches: {},
  setChatCache: (key, data) =>
    set((state) => {
      const current = state.caches[key] || initialChatCache();
      return {
        caches: {
          ...state.caches,
          [key]: {
            ...current,
            ...data,
          },
        },
      };
    }),
  setCommunityScreenCache: (key, data) =>
    set((state) => {
      const current = state.communityScreenCaches[key] || initialCommunityScreenCache();
      return {
        communityScreenCaches: {
          ...state.communityScreenCaches,
          [key]: {
            ...current,
            ...data,
          },
        },
      };
    }),
  clearCache: () => set({ caches: {}, communityScreenCaches: {} }),
}));
