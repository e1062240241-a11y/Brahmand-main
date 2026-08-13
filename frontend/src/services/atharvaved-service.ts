import { getAtharvavedChapter } from '../../src/services/api';
import { LIBRARY_CDN_BASE } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';

const BOOK_NAME = 'atharvaved';
const TOTAL_CHAPTERS = 20;
const PREFETCH_AHEAD = 1;

const normalizeAtharvavedVerse = (verse: any): any => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const fetchAtharvavedChapter = async (num: number) => {
  try {
    const res = await fetch(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`);
    if (res.ok) return res.json();
  } catch {}
  const apiRes = await getAtharvavedChapter(num);
  return apiRes.data;
};

export const loadAtharvavedChapter = (chapterNumber: number) =>
  loadCachedBookContent({
    cacheKey: chapterCacheKey(chapterNumber),
    fetcher: () => fetchAtharvavedChapter(chapterNumber),
    extractVerses: (data: any) => data?.verses ?? [],
    normalizeVerse: normalizeAtharvavedVerse,
    timeoutMessage: `Timed out loading ${BOOK_NAME} chapter ${chapterNumber}`,
  });

export const prefetchAtharvavedChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    loadAtharvavedChapter(i).catch(() => {});
  }
};

export const cleanupAtharvavedChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    removeCachedBookContent(chapterCacheKey(i));
  }
};
