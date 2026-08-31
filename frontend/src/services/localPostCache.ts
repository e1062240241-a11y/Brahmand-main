import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Persists across navigation (module-level cache) — survives tab switches but NOT full reloads
export const localPostCategories = new Map<string, string>();
// module-level cache for iOS to track posts created in this session
export const iosUserCreatedPostIds = new Set<string>();

// Persists across full reloads via localStorage (web) / AsyncStorage (native)
export const POST_CACHE_KEY = 'brahmand_local_posts';
let isCategoriesLoaded = false;
let categoryLoadingPromise: Promise<void> | null = null;

export function ensureCategoriesLoaded(): Promise<void> {
  if (isCategoriesLoaded) return Promise.resolve();
  if (categoryLoadingPromise) return categoryLoadingPromise;

  if (Platform.OS === 'web') {
    isCategoriesLoaded = true;
    return Promise.resolve();
  }

  categoryLoadingPromise = new Promise((resolve) => {
    try {
      AsyncStorage.getItem(POST_CACHE_KEY)
        .then((raw: string | null) => {
          if (raw) {
            const map: Record<string, string> = JSON.parse(raw);
            Object.entries(map).forEach(([content, category]) => {
              localPostCategories.set(content.trim(), category);
            });
          }
          isCategoriesLoaded = true;
          resolve();
        })
        .catch((err: any) => {
          console.warn('[CommunityScreen] Failed to load local categories:', err);
          isCategoriesLoaded = true;
          resolve();
        });
    } catch (e) {
      console.warn('[CommunityScreen] AsyncStorage error:', e);
      isCategoriesLoaded = true;
      resolve();
    }
  });

  return categoryLoadingPromise;
}

export function saveLocalPost(content: string, category: string): void {
  const key = content.trim();
  localPostCategories.set(key, category);
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(POST_CACHE_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[key] = category;
      localStorage.setItem(POST_CACHE_KEY, JSON.stringify(map));
    } else {
      AsyncStorage.getItem(POST_CACHE_KEY)
        .then((raw: string | null) => {
          const map: Record<string, string> = raw ? JSON.parse(raw) : {};
          map[key] = category;
          AsyncStorage.setItem(POST_CACHE_KEY, JSON.stringify(map));
        })
        .catch((e: any) => console.warn('[saveLocalPost] AsyncStorage error:', e));
    }
  } catch {}
}

export function getLocalCategory(content: string): string | undefined {
  if (!content) return undefined;
  const key = content.trim();
  const fromMap = localPostCategories.get(key);
  if (fromMap) return fromMap;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(POST_CACHE_KEY);
      if (raw) {
        const map: Record<string, string> = JSON.parse(raw);
        return map[key];
      }
    }
  } catch {}
  return undefined;
}
