import { getRamayanChapter } from '../../src/services/api';

const normalizeRamayanVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadRamayanChapter = async (chapterNumber: number) => {
  try {
    const response = await Promise.race([
      getRamayanChapter(chapterNumber),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Kaanda ${chapterNumber} loading timed out`)), 12000);
      }),
    ]);

    const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
    return verses.map(normalizeRamayanVerse);
  } catch (error) {
    console.error('Failed to load Ramayan kaanda:', error);
    throw error;
  }
};
