import { getUpanishadsChapter } from '../../src/services/api';
import { LIBRARY_CDN_BASE } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';
import upanishadsData from '../../assets/data/upanishads_data.json';

const BOOK_NAME = 'upanishads';
const TOTAL_CHAPTERS = 20;
const PREFETCH_AHEAD = 1;

const normalizeUpanishadVerse = (verse: any): any => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const fetchUpanishadsChapter = async (num: number) => {
  try {
    const res = await fetch(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`);
    if (res.ok) return res.json();
  } catch {}
  const localVerses = (upanishadsData as any[]).filter((v) => v?.chapter === num);
  if (localVerses.length) {
    return { book: BOOK_NAME, chapter: num, total_verses: localVerses.length, verses: localVerses };
  }
  const apiRes = await getUpanishadsChapter(num);
  return apiRes.data;
};

export const loadUpanishadChapter = (chapterNumber: number) =>
  loadCachedBookContent({
    cacheKey: chapterCacheKey(chapterNumber),
    fetcher: () => fetchUpanishadsChapter(chapterNumber),
    extractVerses: (data: any) => data?.verses ?? [],
    normalizeVerse: normalizeUpanishadVerse,
    timeoutMessage: `Timed out loading ${BOOK_NAME} chapter ${chapterNumber}`,
  });

export const prefetchUpanishadsChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    loadUpanishadChapter(i).catch(() => {});
  }
};

export const cleanupUpanishadsChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    removeCachedBookContent(chapterCacheKey(i));
  }
};
