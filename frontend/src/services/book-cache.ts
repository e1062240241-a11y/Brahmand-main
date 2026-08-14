import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOK_CACHE_PREFIX = 'book-json-cache:v2';
const BOOK_LOAD_TIMEOUT_MS = 10000;

type LoadCachedBookContentOptions<T> = {
  cacheKey: string;
  fetcher: () => Promise<any>;
  extractVerses: (response: any) => unknown[];
  normalizeVerse: (verse: any) => T;
  timeoutMessage: string;
};

const withTimeout = async <T>(promise: Promise<T>, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), BOOK_LOAD_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const readCachedVerses = async <T>(key: string): Promise<T[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.verses) ? parsed.verses : null;
  } catch (error) {
    console.warn('Failed to read cached book content:', error);
    return null;
  }
};

const writeCachedVerses = async <T>(key: string, verses: T[]) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({
      cachedAt: Date.now(),
      verses,
    }));
  } catch (error) {
    console.warn('Failed to cache book content:', error);
  }
};

export const removeCachedBookContent = async (cacheKey: string) => {
  try {
    await AsyncStorage.removeItem(`${BOOK_CACHE_PREFIX}:${cacheKey}`);
  } catch (error) {
    console.warn('Failed to clear cached book content:', error);
  }
};

export const loadCachedBookContent = async <T>({
  cacheKey,
  fetcher,
  extractVerses,
  normalizeVerse,
  timeoutMessage,
}: LoadCachedBookContentOptions<T>): Promise<T[]> => {
  const storageKey = `${BOOK_CACHE_PREFIX}:${cacheKey}`;
  const cachedVerses = await readCachedVerses<T>(storageKey);

  if (cachedVerses?.length) {
    return cachedVerses;
  }

  try {
    const response = await withTimeout(fetcher(), timeoutMessage);
    const verses = extractVerses(response).map(normalizeVerse);
    if (verses.length > 0) {
      await writeCachedVerses(storageKey, verses);
    }
    return verses;
  } catch (error) {
    const fallbackVerses = await readCachedVerses<T>(storageKey);
    if (fallbackVerses?.length) {
      return fallbackVerses;
    }
    throw error;
  }
};
