import { getUpanishadsChapter } from '../../src/services/api';
import { LIBRARY_CDN_BASE, fetchCdnJson } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';
import upanishadsData from '../../assets/data/upanishads_data.json';

const BOOK_NAME = 'upanishads';
const TOTAL_CHAPTERS = 20;
const PREFETCH_AHEAD = 1;

const localUpanishadMap = new Map<string, any>();
(upanishadsData as any[]).forEach((v) => {
  if (v?.chapter && v?.verse) {
    localUpanishadMap.set(`${v.chapter}:${v.verse}`, v);
  }
});

const normalizeUpanishadVerse = (verse: any): any => {
  const localMatch = localUpanishadMap.get(`${verse?.chapter}:${verse?.verse}`);
  const baseTranslations = typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {};
  return {
    ...verse,
    translations: {
      ...baseTranslations,
      ...(localMatch?.translations || {}),
      hindi: baseTranslations?.hindi || localMatch?.translations?.hindi || '',
      english: baseTranslations?.english || localMatch?.translations?.english || '',
    },
  };
};

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const getLocalUpanishadChapter = (num: number) => {
  const localVerses = (upanishadsData as any[]).filter((v) => v?.chapter === num);
  if (localVerses.length) {
    return { book: BOOK_NAME, chapter: num, total_verses: localVerses.length, verses: localVerses };
  }
  return null;
};

const fetchUpanishadsChapter = async (num: number) => {
  const cdnData = await fetchCdnJson(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`, 3500);
  if (cdnData) return cdnData;
  const local = getLocalUpanishadChapter(num);
  if (local) return local;
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
    fallback: () => getLocalUpanishadChapter(chapterNumber),
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
