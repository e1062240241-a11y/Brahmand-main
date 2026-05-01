import { getAtharvavedChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeAtharvavedVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadAtharvavedChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `atharvaved:kaanda:${chapterNumber}`,
      fetcher: () => getAtharvavedChapter(chapterNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeAtharvavedVerse,
      timeoutMessage: `Kaanda ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Atharvaved kaanda:', error);
    throw error;
  }
};
