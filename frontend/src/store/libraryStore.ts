import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';

export type LibraryBookProgress = {
  id: string;
  chapterName: string;
  chapterNum: number;
  lastReadPage: number;
  totalPages: number;
  progressPercent: number;
  lastOpenedTime: number;
};

const LEGACY_GITA_STORAGE_KEY = 'gita-storage';
const GITA_BOOK_ID = 'bhagvad-geeta';

async function migrateLegacyGitaProgress() {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_GITA_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const gita = parsed && parsed.state ? parsed.state : {};
    const lastReadChapter = Number(gita.lastReadChapter) || 1;
    const progressPercent = Number(gita.progressPercent) || 0;

    if (progressPercent <= 0 && lastReadChapter <= 1) return;

    const current = useLibraryStore.getState().progresses || {};
    if (current[GITA_BOOK_ID]) {
      // Library already has (fresher) Gita progress — never overwrite it.
      await AsyncStorage.removeItem(LEGACY_GITA_STORAGE_KEY);
      return;
    }

    useLibraryStore.setState((state) => ({
      progresses: {
        ...state.progresses,
        [GITA_BOOK_ID]: {
          id: GITA_BOOK_ID,
          chapterName: `Chapter ${lastReadChapter}`,
          chapterNum: lastReadChapter,
          lastReadPage: 1,
          totalPages: 100,
          progressPercent,
          lastOpenedTime: Date.now() - 10000,
        },
      },
    }));

    await AsyncStorage.removeItem(LEGACY_GITA_STORAGE_KEY);
  } catch (err) {
    console.warn('[LibraryStore] Legacy Gita migration failed:', err);
  }
}

interface LibraryState {
  progresses: Record<string, LibraryBookProgress>;
  updateProgress: (progress: LibraryBookProgress) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      progresses: {},
      updateProgress: async (progress) => {
        set((state) => ({
          progresses: { ...state.progresses, [progress.id]: progress }
        }));

        if (progress.progressPercent >= 0.95) {
          try {
            const { usePassportStore } = require('./passportStore');
            usePassportStore.getState().completeBook(progress.chapterName || progress.id, 1, new Date().toISOString().slice(0, 10));
          } catch (_e) {}
        }

        // Sync with WatermelonDB
        try {
          await database.write(async () => {
            const collection = database.get('library_progress');
            const records = await collection.query(Q.where('id', progress.id)).fetch();
            const existing = records && records.length > 0 ? records[0] : null;
            if (existing) {
              await existing.update((record: any) => {
                record.chapterName = progress.chapterName;
                record.chapterNum = progress.chapterNum;
                record.lastReadPage = progress.lastReadPage;
                record.totalPages = progress.totalPages;
                record.progressPercent = progress.progressPercent;
                record.lastOpenedTime = progress.lastOpenedTime;
              });
            } else {
              await collection.create((record: any) => {
                record._raw.id = progress.id;
                record.bookId = progress.id;
                record.chapterName = progress.chapterName;
                record.chapterNum = progress.chapterNum;
                record.lastReadPage = progress.lastReadPage;
                record.totalPages = progress.totalPages;
                record.progressPercent = progress.progressPercent;
                record.lastOpenedTime = progress.lastOpenedTime;
              });
            }
          });
        } catch (err) {
          console.warn('[LibraryStore] Failed to persist progress to DB:', err);
        }
      },
    }),
    {
      name: 'brahmand-library-progress',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          migrateLegacyGitaProgress();
        }
      },
    }
  )
);
