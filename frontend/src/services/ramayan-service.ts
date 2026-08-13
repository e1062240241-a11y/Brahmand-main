import { getRamayanChapter } from '../../src/services/api';
import { LIBRARY_CDN_BASE } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';

const BOOK_NAME = 'ramayan';
const TOTAL_CHAPTERS = 7;
const PREFETCH_AHEAD = 1;

const normalizeRamayanVerse = (verse: any): any => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const fetchRamayanChapter = async (num: number) => {
  try {
    const res = await fetch(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`);
    if (res.ok) return res.json();
  } catch {}
  const apiRes = await getRamayanChapter(num);
  return apiRes.data;
};

export const loadRamayanChapter = (chapterNumber: number) =>
  loadCachedBookContent({
    cacheKey: chapterCacheKey(chapterNumber),
    fetcher: () => fetchRamayanChapter(chapterNumber),
    extractVerses: (data: any) => data?.verses ?? [],
    normalizeVerse: normalizeRamayanVerse,
    timeoutMessage: `Timed out loading ${BOOK_NAME} chapter ${chapterNumber}`,
  });

export const prefetchRamayanChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    loadRamayanChapter(i).catch(() => {});
  }
};

export const cleanupRamayanChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    removeCachedBookContent(chapterCacheKey(i));
  }
};
