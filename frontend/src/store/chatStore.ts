import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMMUNITY_SCREEN_STORAGE_KEY = 'brahmand_community_screen_caches_v1';
const MAX_CACHED_COMMUNITIES = 8;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;

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
  deletedPostIds?: string[];
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
  deletedPostIds: [],
});

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(caches: Record<string, CommunityScreenCache>) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const now = Date.now();
      const entries = Object.entries(caches)
        .filter(([, c]) => c && c.lastFetched && now - c.lastFetched <= MAX_CACHE_AGE_MS)
        .sort((a, b) => (b[1].lastFetched || 0) - (a[1].lastFetched || 0))
        .slice(0, MAX_CACHED_COMMUNITIES);

      if (entries.length === 0) {
        AsyncStorage.removeItem(COMMUNITY_SCREEN_STORAGE_KEY).catch(() => {});
        return;
      }

      const trimmed: Record<string, CommunityScreenCache> = {};
      entries.forEach(([k, v]) => {
        trimmed[k] = v;
      });
      const payload = JSON.stringify(trimmed);
      if (payload.length > MAX_PAYLOAD_BYTES) return;
      AsyncStorage.setItem(COMMUNITY_SCREEN_STORAGE_KEY, payload).catch(() => {});
    } catch (e) {
      console.warn('[chatStore] Failed to persist community screen caches:', e);
    }
  }, 800);
}

export async function hydrateCommunityScreenCaches(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_SCREEN_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    const now = Date.now();
    const valid: Record<string, CommunityScreenCache> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const cache = value as CommunityScreenCache;
      if (!cache || typeof cache !== 'object') continue;
      if (!cache.lastFetched || now - cache.lastFetched > MAX_CACHE_AGE_MS) continue;
      valid[key] = {
        ...initialCommunityScreenCache(),
        ...cache,
        community: cache.community ?? null,
        requests: Array.isArray(cache.requests) ? cache.requests : [],
        events: Array.isArray(cache.events) ? cache.events : [],
        communityPosts: Array.isArray(cache.communityPosts) ? cache.communityPosts : [],
        allFestivals: Array.isArray(cache.allFestivals) ? cache.allFestivals : [],
        deletedPostIds: Array.isArray(cache.deletedPostIds) ? cache.deletedPostIds : [],
      };
    }

    if (Object.keys(valid).length === 0) return;

    useChatStore.setState((state) => {
      const merged = { ...valid };
      for (const k of Object.keys(state.communityScreenCaches)) {
        if (merged[k] && (state.communityScreenCaches[k].lastFetched || 0) > (merged[k].lastFetched || 0)) {
          delete merged[k];
        }
      }
      return { communityScreenCaches: { ...state.communityScreenCaches, ...merged } };
    });
  } catch (e) {
    console.warn('[chatStore] Failed to hydrate community screen caches:', e);
  }
}

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
  setCommunityScreenCache: (key, data) => {
    let nextCaches: Record<string, CommunityScreenCache> | null = null;
    set((state) => {
      const current = state.communityScreenCaches[key] || initialCommunityScreenCache();
      nextCaches = {
        ...state.communityScreenCaches,
        [key]: {
          ...current,
          ...data,
        },
      };
      return { communityScreenCaches: nextCaches };
    });
    if (nextCaches) {
      schedulePersist(nextCaches);
    }
  },
  clearCache: () => {
    set({ caches: {}, communityScreenCaches: {} });
    AsyncStorage.removeItem(COMMUNITY_SCREEN_STORAGE_KEY).catch(() => {});
  },
}));
