import { getRamayanChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL_CHAPTERS = 7;
const PREFETCH_AHEAD = 3;
const CACHE_PREFIX = 'book-json-cache:v1:ramayan:kaanda:';

const normalizeRamayanVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

const cacheChapter = async (num: number, verses: any[]) => {
  if (verses.length > 0) {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${num}`, JSON.stringify({ cachedAt: Date.now(), verses }));
  }
};

const getCachedChapter = async (num: number): Promise<any[] | null> => {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${num}`);
  if (!raw) return null;
  try { const p = JSON.parse(raw); return Array.isArray(p?.verses) ? p.verses : null; } catch { return null; }
};

const fetchAndCacheChapter = async (num: number): Promise<any[] | null> => {
  try {
    const res = await getRamayanChapter(num);
    const verses = Array.isArray(res.data?.verses) ? res.data.verses.map(normalizeRamayanVerse) : [];
    await cacheChapter(num, verses);
    return verses.length > 0 ? verses : null;
  } catch { return null; }
};

export const prefetchRamayanChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    getCachedChapter(i).then(cached => { if (!cached) fetchAndCacheChapter(i); });
  }
};

export const loadRamayanChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `ramayan:kaanda:${chapterNumber}`,
      fetcher: async () => {
        const cached = await getCachedChapter(chapterNumber);
        if (cached) return { data: { verses: cached } };
        const verses = await fetchAndCacheChapter(chapterNumber);
        return { data: { verses: verses || [] } };
      },
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeRamayanVerse,
      timeoutMessage: `Kaanda ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Ramayan kaanda:', error);
    throw error;
  }
};
