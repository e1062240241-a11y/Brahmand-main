import { getMahabharataBook } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeMahabharataVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadMahabharataBook = async (bookNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `mahabharata:book:${bookNumber}`,
      fetcher: () => getMahabharataBook(bookNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeMahabharataVerse,
      timeoutMessage: `Book ${bookNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Mahabharata book:', error);
    throw error;
  }
};
