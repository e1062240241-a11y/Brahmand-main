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
