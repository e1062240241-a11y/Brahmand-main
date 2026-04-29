import { getYajurvedaChapter } from '../../src/services/api';

const normalizeYajurvedaVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadYajurvedaChapter = async (chapterNumber: number) => {
  try {
    const response = await Promise.race([
      getYajurvedaChapter(chapterNumber),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Chapter ${chapterNumber} loading timed out`)), 12000);
      }),
    ]);

    const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
    return verses.map(normalizeYajurvedaVerse);
  } catch (error) {
    console.error('Failed to load Yajurveda chapter:', error);
    throw error;
  }
};