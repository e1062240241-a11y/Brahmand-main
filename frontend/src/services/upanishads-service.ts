import { getUpanishadsChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeUpanishadVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadUpanishadChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `upanishads:chapter:${chapterNumber}`,
      fetcher: () => getUpanishadsChapter(chapterNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeUpanishadVerse,
      timeoutMessage: `Upanishad ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Upanishads chapter:', error);
    throw error;
  }
};
