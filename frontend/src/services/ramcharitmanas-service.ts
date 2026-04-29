import { getRamcharitmanasKand } from '../../src/services/api';

const normalizeChaupai = (verse: any) => {
  return {
    ...verse,
  };
};

export const loadRamcharitmanasKand = async (kandNumber: number) => {
  try {
    const response = await Promise.race([
      getRamcharitmanasKand(kandNumber),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Kand ${kandNumber} loading timed out`)), 12000);
      }),
    ]);
    const verses = Array.isArray(response.data?.verses) ? response.data.verses : [];
    return verses.map(normalizeChaupai);
  } catch (error) {
    console.error("Failed to load Ramcharitmanas kand:", error);
    throw error;
  }
};
