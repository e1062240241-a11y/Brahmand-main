import { getRamcharitmanasKand } from '../../src/services/api';
import { loadCachedBookContent } from './book-cache';

const normalizeChaupai = (verse: any) => {
  return {
    ...verse,
  };
};

export const loadRamcharitmanasKand = async (kandNumber: number) => {
  try {
    return await loadCachedBookContent({
      cacheKey: `ramcharitmanas:kand:${kandNumber}`,
      fetcher: () => getRamcharitmanasKand(kandNumber),
      extractVerses: (response) => Array.isArray(response.data?.verses) ? response.data.verses : [],
      normalizeVerse: normalizeChaupai,
      timeoutMessage: `Kand ${kandNumber} loading timed out`,
    });
  } catch (error) {
    console.error("Failed to load Ramcharitmanas kand:", error);
    throw error;
  }
};
