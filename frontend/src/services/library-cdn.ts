import AsyncStorage from '@react-native-async-storage/async-storage';

export const LIBRARY_CDN_BASE = 'https://brahmandfeed23.b-cdn.net/library';

const LIBRARY_BOOK_NAMES = [
  'bhagavad-gita',
  'atharvaved',
  'ramayan',
  'ramcharitmanas',
  'rigveda',
  'yajurveda',
  'upanishads',
  'mahabharata',
];

let libraryCacheCleanupPromise: Promise<void> | null = null;

export const clearLegacyLibraryCache = (): Promise<void> => {
  if (!libraryCacheCleanupPromise) {
    libraryCacheCleanupPromise = (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const toRemove = keys.filter((key) => {
          if (key.startsWith('book-json-cache:v1')) return true;
          return LIBRARY_BOOK_NAMES.some(
            (name) => key.startsWith(`raw:${name}:`) || key.startsWith(`parsed:${name}:`),
          );
        });
        if (toRemove.length > 0) {
          await AsyncStorage.multiRemove(toRemove);
        }
      } catch (error) {
        console.warn('[LibraryCache] Legacy cache cleanup failed:', error);
      }
    })();
  }
  return libraryCacheCleanupPromise;
};
