import { getRamcharitmanasKand } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL_CHAPTERS = 7;
const PREFETCH_AHEAD = 3;
const CACHE_PREFIX = 'book-json-cache:v1:ramcharitmanas:kand:';

const normalizeChaupai = (verse: any) => ({ ...verse });

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
    const res = await getRamcharitmanasKand(num);
    const verses = Array.isArray(res.data?.verses) ? res.data.verses.map(normalizeChaupai) : [];
    await cacheChapter(num, verses);
    return verses.length > 0 ? verses : null;
  } catch { return null; }
};

export const prefetchRamcharitmanasChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    getCachedChapter(i).then(cached => { if (!cached) fetchAndCacheChapter(i); });
  }
};

export const loadRamcharitmanasKand = async (kandNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `ramcharitmanas:kand:${kandNumber}`,
      fetcher: async () => {
        const cached = await getCachedChapter(kandNumber);
        if (cached) return { data: { verses: cached } };
        const verses = await fetchAndCacheChapter(kandNumber);
        return { data: { verses: verses || [] } };
      },
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeChaupai,
      timeoutMessage: `Kand ${kandNumber} loading timed out`,
    });
  } catch (error) {
    console.error("Failed to load Ramcharitmanas kand:", error);
    throw error;
  }
};
