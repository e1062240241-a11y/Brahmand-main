import { getYajurvedaChapter } from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CDN_BASE = 'https://brahmandfeed23.b-cdn.net/library';
const TOTAL_CHAPTERS = 40;
const PREFETCH_AHEAD = 3;
const RAW_PREFIX = 'raw:yajurveda:';
const PARSED_PREFIX = 'parsed:yajurveda:';

const normalizeYajurvedaVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

const storeRawChapter = async (num: number, rawJson: string) => {
  await AsyncStorage.setItem(`${RAW_PREFIX}${num}`, rawJson);
};

const getRawChapter = async (num: number): Promise<string | null> => {
  return AsyncStorage.getItem(`${RAW_PREFIX}${num}`);
};

const parseChapter = async (num: number): Promise<any[] | null> => {
  const parsed = await AsyncStorage.getItem(`${PARSED_PREFIX}${num}`);
  if (parsed) { try { return JSON.parse(parsed).verses; } catch { return null; } }
  const raw = await getRawChapter(num);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const verses = Array.isArray(data?.verses) ? data.verses.map(normalizeYajurvedaVerse) : [];
    await AsyncStorage.setItem(`${PARSED_PREFIX}${num}`, JSON.stringify({ verses }));
    return verses;
  } catch { return null; }
};

const clearParsedChapter = async (num: number) => {
  await AsyncStorage.removeItem(`${PARSED_PREFIX}${num}`);
};

const fetchAndStoreRaw = async (num: number): Promise<boolean> => {
  try {
    try {
      const res = await fetch(`${CDN_BASE}/yajurveda/chapter-${num}.json`);
      if (res.ok) { await storeRawChapter(num, await res.text()); return true; }
    } catch {}
    const res = await getYajurvedaChapter(num);
    await storeRawChapter(num, JSON.stringify(res.data));
    return true;
  } catch { return false; }
};

export const prefetchYajurvedaChapters = (from: number, count: number = PREFETCH_AHEAD) => {
  for (let i = from; i <= Math.min(from + count - 1, TOTAL_CHAPTERS); i++) {
    getRawChapter(i).then(raw => { if (!raw) fetchAndStoreRaw(i); });
  }
};

export const loadYajurvedaChapter = async (chapterNumber: number) => {
  const cached = await parseChapter(chapterNumber);
  if (cached?.length) return cached;
  await fetchAndStoreRaw(chapterNumber);
  return parseChapter(chapterNumber) || [];
};

export const cleanupYajurvedaChapters = (currentChapter: number) => {
  for (let i = Math.max(1, currentChapter - 2); i < currentChapter; i++) {
    clearParsedChapter(i);
  }
};
