import { getAtharvavedChapter } from '../../src/services/api';

const normalizeAtharvavedVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadAtharvavedChapter = async (chapterNumber: number) => {
  try {
    const response = await Promise.race([
      getAtharvavedChapter(chapterNumber),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Kaanda ${chapterNumber} loading timed out`)), 12000);
      }),
    ]);

    const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
    return verses.map(normalizeAtharvavedVerse);
  } catch (error) {
    console.error('Failed to load Atharvaved kaanda:', error);
    throw error;
  }
};
