import { getMahabharataBook } from '../../src/services/api';
import { LIBRARY_CDN_BASE } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';

const BOOK_NAME = 'mahabharata';
const TOTAL_CHAPTERS = 18;
const PREFETCH_AHEAD = 1;

const normalizeMahabharataVerse = (verse: any): any => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const fetchMahabharataBook = async (num: number) => {
  try {
    const res = await fetch(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`);
    if (res.ok) return res.json();
  } catch {}
  const apiRes = await getMahabharataBook(num);
  return apiRes.data;
};

export const loadMahabharataBook = (bookNumber: number) =>
  loadCachedBookContent({
    cacheKey: chapterCacheKey(bookNumber),
    fetcher: () => fetchMahabharataBook(bookNumber),
    extractVerses: (data: any) => data?.verses ?? [],
    normalizeVerse: normalizeMahabharataVerse,
    timeoutMessage: `Timed out loading ${BOOK_NAME} chapter ${bookNumber}`,
  });

export const prefetchMahabharataChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    loadMahabharataBook(i).catch(() => {});
  }
};

export const cleanupMahabharataChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    removeCachedBookContent(chapterCacheKey(i));
  }
};
