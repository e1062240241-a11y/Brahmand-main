import { getBhagavadGitaChapter } from '../../src/services/api';
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

const CDN_BASE = 'https://brahmandfeed23.b-cdn.net/library';
const TOTAL_CHAPTERS = 18;
const PREFETCH_AHEAD = 3;
const RAW_PREFIX = 'raw:bhagavad-gita:';
const PARSED_PREFIX = 'parsed:bhagavad-gita:';

// ponytail: store raw string only, no JSON.parse
const storeRawChapter = async (num: number, rawJson: string) => {
  await AsyncStorage.setItem(`${RAW_PREFIX}${num}`, rawJson);
};

// ponytail: get raw string from disk (no parse)
const getRawChapter = async (num: number): Promise<string | null> => {
  return AsyncStorage.getItem(`${RAW_PREFIX}${num}`);
};

// ponytail: parse + normalize only when user actually needs it
const parseChapter = async (num: number): Promise<any[] | null> => {
  // Check if already parsed in memory
  const parsed = await AsyncStorage.getItem(`${PARSED_PREFIX}${num}`);
  if (parsed) {
    try { return JSON.parse(parsed).verses; } catch { return null; }
  }
  // Parse from raw
  const raw = await getRawChapter(num);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const verses = Array.isArray(data?.verses) ? data.verses.map(normalizeVerse) : [];
    // Store parsed version for instant access
    await AsyncStorage.setItem(`${PARSED_PREFIX}${num}`, JSON.stringify({ verses }));
    return verses;
  } catch { return null; }
};

// ponytail: clear parsed data from memory (keep raw for re-parse)
const clearParsedChapter = async (num: number) => {
  await AsyncStorage.removeItem(`${PARSED_PREFIX}${num}`);
};

// ponytail: fetch from CDN/backend, store as raw string
const fetchAndStoreRaw = async (num: number): Promise<boolean> => {
  try {
    // Try CDN first
    try {
      const res = await fetch(`${CDN_BASE}/bhagavad-gita/chapter-${num}.json`);
      if (res.ok) {
        const raw = await res.text();
        await storeRawChapter(num, raw);
        return true;
      }
    } catch {}
    // Fallback to backend
    const res = await getBhagavadGitaChapter(num);
    await storeRawChapter(num, JSON.stringify(res.data));
    return true;
  } catch { return false; }
};

// ponytail: prefetch next N chapters as raw strings (no parse, no RAM hit)
export const prefetchBhagavadGitaChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    getRawChapter(i).then(raw => {
      if (!raw) fetchAndStoreRaw(i);
    });
  }
};

// ponytail: load one chapter — parse only when user swipes to it
export const loadBhagavadGitaChapter = async (chapterNumber: number) => {
  // Check parsed cache first
  const cached = await parseChapter(chapterNumber);
  if (cached?.length) return cached;
  // Fetch raw, then parse
  await fetchAndStoreRaw(chapterNumber);
  return parseChapter(chapterNumber) || [];
};

// ponytail: cleanup previous chapters from parsed cache
export const cleanupBhagavadGitaChapters = (currentChapter: number) => {
  // Clear chapters 2 behind current
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    clearParsedChapter(i);
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
