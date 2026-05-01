import { getRigvedaChapter } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeRigvedaVerse = (verse: any) => ({
  ...verse,
  translations: typeof verse?.translations === 'object' && verse?.translations !== null ? verse.translations : {},
});

export const loadRigvedaChapter = async (chapterNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `rigveda:mandala:${chapterNumber}`,
      fetcher: () => getRigvedaChapter(chapterNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeRigvedaVerse,
      timeoutMessage: `Mandala ${chapterNumber} loading timed out`,
    });
  } catch (error) {
    console.error('Failed to load Rigveda mandala:', error);
    throw error;
  }
};
