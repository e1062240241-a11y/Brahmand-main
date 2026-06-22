import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface LibraryState {
  progresses: Record<string, LibraryBookProgress>;
  updateProgress: (progress: LibraryBookProgress) => void;
  getRecentBooks: () => LibraryBookProgress[];
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      progresses: {},
      updateProgress: async (progress) => {
        set((state) => ({
          progresses: { ...state.progresses, [progress.id]: progress }
        }));

        // Sync with WatermelonDB
        try {
          await database.write(async () => {
            const collection = database.get('library_progress');
            try {
              const existing = await collection.find(progress.id);
              await existing.update((record: any) => {
                record.chapterName = progress.chapterName;
                record.chapterNum = progress.chapterNum;
                record.lastReadPage = progress.lastReadPage;
                record.totalPages = progress.totalPages;
                record.progressPercent = progress.progressPercent;
                record.lastOpenedTime = progress.lastOpenedTime;
              });
            } catch {
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
      getRecentBooks: () => {
        const progresses = get().progresses || {};
        const books = Object.values(progresses);
        return books.sort((a, b) => b.lastOpenedTime - a.lastOpenedTime);
      }
    }),
    {
      name: 'brahmand-library-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
