import { getBhagavadGitaChapter } from '../../src/services/api';
import { LIBRARY_CDN_BASE } from './library-cdn';
import { loadCachedBookContent, removeCachedBookContent } from './book-cache';
import gitaData from '../../assets/data/gita_data.json';

const BOOK_NAME = 'bhagavad-gita';
const TOTAL_CHAPTERS = 18;
const PREFETCH_AHEAD = 1;

const HINDI_KEYS = [
  'swami tejomayananda', 'Swami Tejomayananda',
  'swami ramsukhdas', 'Swami Ramsukhdas',
  'sri harikrishnadas goenka', 'Sri Harikrishnadas Goenka',
  'hindi', 'Hindi'
] as const;

const ENGLISH_KEYS = [
  'swami adidevananda', 'Swami Adidevananda',
  'swami gambirananda', 'Swami Gambirananda',
  'swami sivananda', 'Swami Sivananda',
  'dr. s. sankaranarayan', 'Dr. S. Sankaranarayan',
  'shri purohit swami', 'Shri Purohit Swami',
  'english', 'English'
] as const;

type TranslationRecord = Record<string, unknown> | undefined | null;

const getTejomayanandaTranslation = (translations: TranslationRecord): string => {
  if (!translations || typeof translations !== 'object') return '';
  for (const key of HINDI_KEYS) {
    const value = (translations as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  for (const key of ENGLISH_KEYS) {
    const value = (translations as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return '';
};

const normalizeVerse = (verse: any): any => {
  const rawTranslations = verse?.translations;
  const translation = getTejomayanandaTranslation(rawTranslations);
  return {
    ...verse,
    translations: translation ? { 'swami tejomayananda': translation } : {},
  };
};

const chapterCacheKey = (num: number) => `${BOOK_NAME}:chapter:${num}`;

const getLocalGitaChapter = (num: number) => {
  const chapter = (gitaData as Record<string, any>)?.[String(num)];
  const verses = Array.isArray(chapter?.verses) ? chapter.verses : [];
  if (!verses.length) return null;
  return {
    book: BOOK_NAME,
    chapter: num,
    total_verses: verses.length,
    verses: verses.map((v: any) => ({
      chapter: num,
      verse: v?.id,
      text: v?.sanskrit || '',
      translations: v?.hindi ? { hindi: v.hindi } : {},
    })),
  };
};

const fetchBhagavadGitaChapter = async (num: number) => {
  try {
    const res = await fetch(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`);
    if (res.ok) return res.json();
  } catch {}
  const local = getLocalGitaChapter(num);
  if (local) return local;
  const apiRes = await getBhagavadGitaChapter(num);
  return apiRes.data;
};

export const loadBhagavadGitaChapter = (chapterNumber: number) =>
  loadCachedBookContent({
    cacheKey: chapterCacheKey(chapterNumber),
    fetcher: () => fetchBhagavadGitaChapter(chapterNumber),
    extractVerses: (data: any) => data?.verses ?? [],
    normalizeVerse,
    timeoutMessage: `Timed out loading ${BOOK_NAME} chapter ${chapterNumber}`,
  });

export const prefetchBhagavadGitaChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    loadBhagavadGitaChapter(i).catch(() => {});
  }
};

export const cleanupBhagavadGitaChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    removeCachedBookContent(chapterCacheKey(i));
  }
};

export const getPreferredTranslation = (translations: Record<string, string>) => {
  if (!translations || typeof translations !== 'object') return '';
  for (const key of HINDI_KEYS) {
    const value = translations[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  for (const key of ENGLISH_KEYS) {
    const value = translations[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return '';
};
