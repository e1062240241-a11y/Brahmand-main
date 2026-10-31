import { getBhagavadGitaChapter } from '../../src/services/api';
import { LIBRARY_CDN_BASE, fetchCdnJson } from './library-cdn';
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
  'swami sivananda', 'Swami Sivananda',
  'shri purohit swami', 'Shri Purohit Swami',
  'dr. s. sankaranarayan', 'Dr. S. Sankaranarayan',
  'english', 'English',
  'swami adidevananda', 'Swami Adidevananda',
  'swami gambirananda', 'Swami Gambirananda',
] as const;

type TranslationRecord = Record<string, unknown> | undefined | null;

const cleanTranslationText = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();
  // Strip leading verse references like "।।1.1।।", "1.1.", "1.1", "1.1 - 1.19"
  text = text.replace(/^(?:।।\s*\d+(?:\.\d+)?\s*।।|\d+\.\d+(?:\s*-\s*\d+\.\d+)?\.?)\s*/, '');
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
};

const getHindiTranslation = (translations: TranslationRecord): string => {
  if (!translations || typeof translations !== 'object') return '';
  for (const key of HINDI_KEYS) {
    const value = (translations as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      const cleaned = cleanTranslationText(value);
      if (cleaned && !cleaned.toLowerCase().includes('did not comment')) return cleaned;
    }
  }
  return '';
};

const getEnglishTranslation = (translations: TranslationRecord): string => {
  if (!translations || typeof translations !== 'object') return '';
  for (const key of ENGLISH_KEYS) {
    const value = (translations as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      const cleaned = cleanTranslationText(value);
      if (cleaned && !cleaned.toLowerCase().includes('did not comment')) return cleaned;
    }
  }
  return '';
};

const normalizeVerse = (verse: any): any => {
  const rawTranslations = verse?.translations;
  const hindi = getHindiTranslation(rawTranslations);
  const english = getEnglishTranslation(rawTranslations);

  return {
    ...verse,
    translations: {
      ...(typeof rawTranslations === 'object' && rawTranslations ? rawTranslations : {}),
      hindi: hindi || (typeof rawTranslations?.hindi === 'string' ? rawTranslations.hindi : ''),
      english: english || (typeof rawTranslations?.english === 'string' ? rawTranslations.english : ''),
      'swami tejomayananda': hindi,
      'swami sivananda': english,
    },
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
  const cdnData = await fetchCdnJson(`${LIBRARY_CDN_BASE}/${BOOK_NAME}/chapter-${num}.json`, 3500);
  if (cdnData) return cdnData;
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
    fallback: () => getLocalGitaChapter(chapterNumber),
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

const LOCAL_STORY_CHAPTERS: Record<number, any> = {
  1: require('../../assets/data/gita_stories/chapter_1.json'),
  2: require('../../assets/data/gita_stories/chapter_2.json'),
  3: require('../../assets/data/gita_stories/chapter_3.json'),
  4: require('../../assets/data/gita_stories/chapter_4.json'),
  5: require('../../assets/data/gita_stories/chapter_5.json'),
  6: require('../../assets/data/gita_stories/chapter_6.json'),
  7: require('../../assets/data/gita_stories/chapter_7.json'),
  8: require('../../assets/data/gita_stories/chapter_8.json'),
  9: require('../../assets/data/gita_stories/chapter_9.json'),
  10: require('../../assets/data/gita_stories/chapter_10.json'),
  11: require('../../assets/data/gita_stories/chapter_11.json'),
  12: require('../../assets/data/gita_stories/chapter_12.json'),
  13: require('../../assets/data/gita_stories/chapter_13.json'),
  14: require('../../assets/data/gita_stories/chapter_14.json'),
  15: require('../../assets/data/gita_stories/chapter_15.json'),
  16: require('../../assets/data/gita_stories/chapter_16.json'),
  17: require('../../assets/data/gita_stories/chapter_17.json'),
  18: require('../../assets/data/gita_stories/chapter_18.json'),
};

export const loadBhagavadGitaStoryChapter = async (
  chapterNumber: number
): Promise<any | null> => {
  try {
    const { api } = require('./api');
    const res = await api.get(`/library/bhagavad-gita/story/${chapterNumber}`);
    if (res?.data && res.data.scenes) {
      return res.data;
    }
  } catch (err) {
    // Graceful fallback to bundled JSON
  }

  return LOCAL_STORY_CHAPTERS[chapterNumber] || null;
};

