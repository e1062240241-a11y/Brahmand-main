import { getMahabharataBook } from '../../src/services/api';

const normalizeMahabharataVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadMahabharataBook = async (bookNumber: number) => {
  try {
    const response = await Promise.race([
      getMahabharataBook(bookNumber),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Book ${bookNumber} loading timed out`)), 12000);
      }),
    ]);

    const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
    return verses.map(normalizeMahabharataVerse);
  } catch (error) {
    console.error('Failed to load Mahabharata book:', error);
    throw error;
  }
};
