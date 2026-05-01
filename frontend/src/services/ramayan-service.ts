import { getRamayanChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeRamayanVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadRamayanChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `ramayan:kaanda:${chapterNumber}`,
      fetcher: () => getRamayanChapter(chapterNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeRamayanVerse,
      timeoutMessage: `Kaanda ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Ramayan kaanda:', error);
    throw error;
  }
};
