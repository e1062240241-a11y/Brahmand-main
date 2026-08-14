import { getRamcharitmanasKand } from '../../src/services/api';
import { LIBRARY_CDN_BASE } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';

const BOOK_NAME = 'ramcharitmanas';
const TOTAL_CHAPTERS = 7;
const PREFETCH_AHEAD = 1;

const normalizeChaupai = (verse: any): any => ({ ...verse });

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const fetchRamcharitmanasKand = async (num: number) => {
  try {
    const res = await fetch(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`);
    if (res.ok) return res.json();
  } catch {}
  const apiRes = await getRamcharitmanasKand(num);
  return apiRes.data;
};

export const loadRamcharitmanasKand = (kandNumber: number) =>
  loadCachedBookContent({
    cacheKey: chapterCacheKey(kandNumber),
    fetcher: () => fetchRamcharitmanasKand(kandNumber),
    extractVerses: (data: any) => data?.verses ?? [],
    normalizeVerse: normalizeChaupai,
    timeoutMessage: `Timed out loading ${BOOK_NAME} chapter ${kandNumber}`,
  });

export const prefetchRamcharitmanasChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    loadRamcharitmanasKand(i).catch(() => {});
  }
};

export const cleanupRamcharitmanasChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    removeCachedBookContent(chapterCacheKey(i));
  }
};
