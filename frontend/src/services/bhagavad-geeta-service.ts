import { getBhagavadGitaChapter } from '../../src/services/api';

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
  const response = await Promise.race([
    getBhagavadGitaChapter(chapterNumber),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Chapter ${chapterNumber} loading timed out`)), 12000);
    }),
  ]);
  const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
  return verses.map(normalizeVerse);
};

export const getPreferredTranslation = (translations: Record<string, string>) => {
  if (!translations || typeof translations !== 'object') return '';
  const preferred = translations['swami tejomayananda'] || translations['Swami Tejomayananda'];
  return typeof preferred === 'string' ? preferred : '';
};
