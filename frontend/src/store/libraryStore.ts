import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';

export interface ScriptureBookmark {
  chapter: number;
  scrollY: number;
  timestamp: number;
  title?: string;
}

export type LibraryBookProgress = {
  id: string;
  chapterName: string;
  chapterNum: number;
  lastReadPage: number;
  totalPages: number;
  progressPercent: number;
  lastOpenedTime: number;
  lastReadScrollY?: number;
  bookmarks?: ScriptureBookmark[];
};

const LEGACY_GITA_STORAGE_KEY = 'gita-storage';
const GITA_BOOK_ID = 'bhagvad-geeta';
const LEGACY_SCRIPTURE_STORAGE_KEY = 'scripture-storage';

async function migrateLegacyProgress() {
  try {
    const rawGita = await AsyncStorage.getItem(LEGACY_GITA_STORAGE_KEY);
    if (rawGita) {
      const parsed = JSON.parse(rawGita);
      const gita = parsed && parsed.state ? parsed.state : {};
      const lastReadChapter = Number(gita.lastReadChapter) || 1;
      const progressPercent = Number(gita.progressPercent) || 0;

      if (progressPercent > 0 || lastReadChapter > 1) {
        const current = useLibraryStore.getState().progresses || {};
        if (!current[GITA_BOOK_ID]) {
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
        }
      }
      await AsyncStorage.removeItem(LEGACY_GITA_STORAGE_KEY);
    }

    const rawScripture = await AsyncStorage.getItem(LEGACY_SCRIPTURE_STORAGE_KEY);
    if (rawScripture) {
      const parsed = JSON.parse(rawScripture);
      const books = parsed && parsed.state && parsed.state.books ? parsed.state.books : {};

      const currentProgresses = useLibraryStore.getState().progresses || {};
      const updatedProgresses = { ...currentProgresses };
      let migrated = false;

      for (const [bookId, bookData] of Object.entries<any>(books)) {
        if (!updatedProgresses[bookId]) {
          updatedProgresses[bookId] = {
            id: bookId,
            chapterName: `Chapter ${bookData.lastReadChapter || 1}`,
            chapterNum: bookData.lastReadChapter || 1,
            lastReadPage: 1,
            totalPages: 100,
            progressPercent: bookData.progressPercent || 0,
            lastOpenedTime: Date.now() - 10000,
            lastReadScrollY: bookData.lastReadScrollY || 0,
            bookmarks: bookData.bookmarks || [],
          };
          migrated = true;
        } else {
          // Merge bookmarks and scrollY
          updatedProgresses[bookId] = {
            ...updatedProgresses[bookId],
            lastReadScrollY: updatedProgresses[bookId].lastReadScrollY ?? bookData.lastReadScrollY,
            bookmarks: updatedProgresses[bookId].bookmarks ?? bookData.bookmarks,
          };
          migrated = true;
        }
      }

      if (migrated) {
        useLibraryStore.setState({ progresses: updatedProgresses });
      }

      await AsyncStorage.removeItem(LEGACY_SCRIPTURE_STORAGE_KEY);
    }

  } catch (err) {
    console.warn('[LibraryStore] Legacy migration failed:', err);
  }
}

interface LibraryState {
  progresses: Record<string, LibraryBookProgress>;

  getBookProgress: (bookId: string) => LibraryBookProgress;
  setLastRead: (bookId: string, chapter: number, scrollY: number, progressPercent: number) => void;
  updateProgress: (progress: LibraryBookProgress) => void;

  toggleBookmark: (bookId: string, chapter: number, scrollY: number, title?: string) => void;
  removeBookmark: (bookId: string, chapter: number) => void;
  clearAllBookmarks: (bookId: string) => void;
}

const DEFAULT_BOOK_PROGRESS: LibraryBookProgress = {
  id: '',
  chapterName: '',
  chapterNum: 1,
  lastReadPage: 1,
  totalPages: 100,
  progressPercent: 0,
  lastOpenedTime: 0,
  lastReadScrollY: 0,
  bookmarks: [],
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      progresses: {},

      getBookProgress: (bookId) => {
        const p = get().progresses[bookId];
        return p || { ...DEFAULT_BOOK_PROGRESS, id: bookId };
      },

      setLastRead: (bookId, chapter, scrollY, progressPercent) => set((state) => {
        const currentProgress = state.progresses[bookId] || { ...DEFAULT_BOOK_PROGRESS, id: bookId };
        return {
          progresses: {
            ...state.progresses,
            [bookId]: {
              ...currentProgress,
              chapterNum: chapter,
              lastReadScrollY: scrollY,
              progressPercent,
              lastOpenedTime: Date.now()
            },
          },
        };
      }),

      updateProgress: async (progress) => {
        set((state) => {
          const existing = state.progresses[progress.id];
          return {
            progresses: {
              ...state.progresses,
              [progress.id]: {
                ...(existing || {}),
                ...progress
              }
            }
          };
        });

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

      toggleBookmark: (bookId, chapter, scrollY, title) => set((state) => {
        const currentProgress = state.progresses[bookId] || { ...DEFAULT_BOOK_PROGRESS, id: bookId };
        const bookmarks = currentProgress.bookmarks || [];
        const exists = bookmarks.find((b) => b.chapter === chapter);

        let newBookmarks: ScriptureBookmark[];
        if (exists) {
          newBookmarks = bookmarks.filter((b) => b.chapter !== chapter);
        } else {
          newBookmarks = [
            ...bookmarks,
            { chapter, scrollY, timestamp: Date.now(), title },
          ];
        }

        return {
          progresses: {
            ...state.progresses,
            [bookId]: {
              ...currentProgress,
              bookmarks: newBookmarks,
            },
          },
        };
      }),

      removeBookmark: (bookId, chapter) => set((state) => {
        const currentProgress = state.progresses[bookId] || { ...DEFAULT_BOOK_PROGRESS, id: bookId };
        return {
          progresses: {
            ...state.progresses,
            [bookId]: {
              ...currentProgress,
              bookmarks: (currentProgress.bookmarks || []).filter((b) => b.chapter !== chapter),
            },
          },
        };
      }),

      clearAllBookmarks: (bookId) => set((state) => {
        const currentProgress = state.progresses[bookId] || { ...DEFAULT_BOOK_PROGRESS, id: bookId };
        return {
          progresses: {
            ...state.progresses,
            [bookId]: {
              ...currentProgress,
              bookmarks: [],
            },
          },
        };
      }),
    }),
    {
      name: 'brahmand-library-progress',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          migrateLegacyProgress();
        }
      },
    }
  )
);
