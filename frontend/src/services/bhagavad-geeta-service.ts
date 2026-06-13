import { getBhagavadGitaChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

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
  
  // Try Hindi keys first
  for (const key of HINDI_KEYS) {
    const value = (translations as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  // Fallback to English keys
  for (const key of ENGLISH_KEYS) {
    const value = (translations as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
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

export const loadBhagavadGitaChapter = async (chapterNumber: number) => {
  return loadCachedBookContent({
    cacheKey: `bhagavad-gita:chapter:${chapterNumber}`,
    fetcher: () => getBhagavadGitaChapter(chapterNumber),
    extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
    normalizeVerse,
    timeoutMessage: `Chapter ${chapterNumber} loading timed out`,
  });
};

export const getPreferredTranslation = (translations: Record<string, string>) => {
  if (!translations || typeof translations !== 'object') return '';
  
  // Try Hindi keys first
  for (const key of HINDI_KEYS) {
    const value = translations[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  // Fallback to English keys
  for (const key of ENGLISH_KEYS) {
    const value = translations[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return '';
};
