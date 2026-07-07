import { getRigvedaChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL_CHAPTERS = 10;
const PREFETCH_AHEAD = 3;
const CACHE_PREFIX = 'book-json-cache:v1:rigveda:mandala:';

const normalizeRigvedaVerse = (verse: any) => ({
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
    const res = await getRigvedaChapter(num);
    const verses = Array.isArray(res.data?.verses) ? res.data.verses.map(normalizeRigvedaVerse) : [];
    await cacheChapter(num, verses);
    return verses.length > 0 ? verses : null;
  } catch { return null; }
};

export const prefetchRigvedaChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    getCachedChapter(i).then(cached => { if (!cached) fetchAndCacheChapter(i); });
  }
};

export const loadRigvedaChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `rigveda:mandala:${chapterNumber}`,
      fetcher: async () => {
        const cached = await getCachedChapter(chapterNumber);
        if (cached) return { data: { verses: cached } };
        const verses = await fetchAndCacheChapter(chapterNumber);
        return { data: { verses: verses || [] } };
      },
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeRigvedaVerse,
      timeoutMessage: `Mandala ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Rigveda mandala:', error);
    throw error;
  }
};
