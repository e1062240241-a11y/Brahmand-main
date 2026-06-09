import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScriptureBookmark {
  chapter: number;
  scrollY: number;
  timestamp: number;
  title?: string;
}

export interface BookProgress {
  lastReadChapter: number;
  lastReadScrollY: number;
  progressPercent: number;
  bookmarks: ScriptureBookmark[];
}

interface ScriptureState {
  books: Record<string, BookProgress>;
  
  getBookProgress: (bookId: string) => BookProgress;
  setLastRead: (bookId: string, chapter: number, scrollY: number, progressPercent: number) => void;
  toggleBookmark: (bookId: string, chapter: number, scrollY: number, title?: string) => void;
  removeBookmark: (bookId: string, chapter: number) => void;
  clearAllBookmarks: (bookId: string) => void;
}

const DEFAULT_BOOK_PROGRESS: BookProgress = {
  lastReadChapter: 1,
  lastReadScrollY: 0,
  progressPercent: 0,
  bookmarks: [],
};

export const useScriptureStore = create<ScriptureState>()(
  persist(
    (set, get) => ({
      books: {},

      getBookProgress: (bookId) => {
        return get().books[bookId] || { ...DEFAULT_BOOK_PROGRESS };
      },

      setLastRead: (bookId, chapter, scrollY, progressPercent) => set((state) => {
        const currentProgress = state.books[bookId] || { ...DEFAULT_BOOK_PROGRESS };
        return {
          books: {
            ...state.books,
            [bookId]: {
              ...currentProgress,
              lastReadChapter: chapter,
              lastReadScrollY: scrollY,
              progressPercent,
            },
          },
        };
      }),

      toggleBookmark: (bookId, chapter, scrollY, title) => set((state) => {
        const currentProgress = state.books[bookId] || { ...DEFAULT_BOOK_PROGRESS };
        const exists = currentProgress.bookmarks.find((b) => b.chapter === chapter);
        
        let newBookmarks: ScriptureBookmark[];
        if (exists) {
          newBookmarks = currentProgress.bookmarks.filter((b) => b.chapter !== chapter);
        } else {
          newBookmarks = [
            ...currentProgress.bookmarks,
            { chapter, scrollY, timestamp: Date.now(), title },
          ];
        }

        return {
          books: {
            ...state.books,
            [bookId]: {
              ...currentProgress,
              bookmarks: newBookmarks,
            },
          },
        };
      }),

      removeBookmark: (bookId, chapter) => set((state) => {
        const currentProgress = state.books[bookId] || { ...DEFAULT_BOOK_PROGRESS };
        return {
          books: {
            ...state.books,
            [bookId]: {
              ...currentProgress,
              bookmarks: currentProgress.bookmarks.filter((b) => b.chapter !== chapter),
            },
          },
        };
      }),

      clearAllBookmarks: (bookId) => set((state) => {
        const currentProgress = state.books[bookId] || { ...DEFAULT_BOOK_PROGRESS };
        return {
          books: {
            ...state.books,
            [bookId]: {
              ...currentProgress,
              bookmarks: [],
            },
          },
        };
      }),
    }),
    {
      name: 'scripture-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
