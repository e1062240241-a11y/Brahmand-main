import { getBhagavadGitaChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const TEJOMAYANANDA_KEYS = ['swami tejomayananda', 'Swami Tejomayananda'] as const;

type TranslationRecord = Record<string, unknown> | undefined | null;

const getTejomayanandaTranslation = (translations: TranslationRecord): string => {
  if (!translations || typeof translations !== 'object') return '';
  for (const key of TEJOMAYANANDA_KEYS) {
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
  const preferred = translations['swami tejomayananda'] || translations['Swami Tejomayananda'];
  return typeof preferred === 'string' ? preferred : '';
};
