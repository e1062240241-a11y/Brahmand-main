import { getYajurvedaChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeYajurvedaVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadYajurvedaChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `yajurveda:chapter:${chapterNumber}`,
      fetcher: () => getYajurvedaChapter(chapterNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeYajurvedaVerse,
      timeoutMessage: `Chapter ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Yajurveda chapter:', error);
    throw error;
  }
};
