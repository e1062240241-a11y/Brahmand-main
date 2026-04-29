import { getRigvedaChapter } from '../../src/services/api';

const normalizeRigvedaVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadRigvedaChapter = async (chapterNumber: number) => {
  try {
    const response = await Promise.race([
      getRigvedaChapter(chapterNumber),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Mandala ${chapterNumber} loading timed out`)), 12000);
      }),
    ]);

    const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
    return verses.map(normalizeRigvedaVerse);
  } catch (error) {
    console.error('Failed to load Rigveda mandala:', error);
    throw error;
  }
};
