import { getBhagavadGitaChapter, getBhagavadGitaAll } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const normalizeVerse = (verse: any) => {
  const rawTranslations = verse?.translations;
  const translation = getTejomayanandaTranslation(rawTranslations);
  return {
    ...verse,
    translations: translation ? { 'swami tejomayananda': translation } : {},
  };
};

const TOTAL_CHAPTERS = 18;
const PREFETCH_AHEAD = 3;
const CACHE_PREFIX = 'book-json-cache:v1:bhagavad-gita:chapter:';

// ponytail: cache a single chapter to AsyncStorage
const cacheChapter = async (num: number, verses: any[]) => {
  if (verses.length > 0) {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${num}`, JSON.stringify({ cachedAt: Date.now(), verses }));
  }
};

// ponytail: read a single chapter from AsyncStorage (returns null if miss)
const getCachedChapter = async (num: number): Promise<any[] | null> => {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${num}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.verses) ? parsed.verses : null;
  } catch { return null; }
};

// ponytail: fetch + cache one chapter from network
const fetchAndCacheChapter = async (num: number): Promise<any[] | null> => {
  try {
    const res = await getBhagavadGitaChapter(num);
    const verses = Array.isArray(res.data?.verses) ? res.data.verses.map(normalizeVerse) : [];
    await cacheChapter(num, verses);
    return verses.length > 0 ? verses : null;
  } catch { return null; }
};

// ponytail: prefetch next N chapters in background (fire-and-forget)
export const prefetchBhagavadGitaChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    getCachedChapter(i).then(cached => {
      if (!cached) fetchAndCacheChapter(i);
    });
  }
};

// ponytail: load one chapter — cache hit = instant, miss = single API call
export const loadBhagavadGitaChapter = async (chapterNumber: number) => {
  return loadCachedBookContent({
    cacheKey: `bhagavad-gita:chapter:${chapterNumber}`,
    fetcher: async () => {
      const cached = await getCachedChapter(chapterNumber);
      if (cached) return { data: { verses: cached } };
      const verses = await fetchAndCacheChapter(chapterNumber);
      return { data: { verses: verses || [] } };
    },
    extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
    normalizeVerse,
    timeoutMessage: `Chapter ${chapterNumber} loading timed out`,
  });
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
