   import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GitaBookmark {
  chapter: number;
  scrollY: number;
  timestamp: number;
  title?: string;
}

interface GitaState {
  lastReadChapter: number;
  lastReadScrollY: number;
  progressPercent: number;
  bookmarks: GitaBookmark[];
  
  setLastRead: (chapter: number, scrollY: number, progressPercent: number) => void;
  toggleBookmark: (chapter: number, scrollY: number, title?: string) => void;
  removeBookmark: (chapter: number) => void;
  clearAllBookmarks: () => void;
}

export const useGitaStore = create<GitaState>()(
  persist(
    (set, get) => ({
      lastReadChapter: 1,
      lastReadScrollY: 0,
      progressPercent: 0,
      bookmarks: [],

      setLastRead: (chapter, scrollY, progressPercent) => set({
        lastReadChapter: chapter,
        lastReadScrollY: scrollY,
        progressPercent,
      }),

      toggleBookmark: (chapter, scrollY, title) => {
        const state = get();
        const exists = state.bookmarks.find(b => b.chapter === chapter);
        if (exists) {
          set({
            bookmarks: state.bookmarks.filter(b => b.chapter !== chapter)
          });
        } else {
          set({
            bookmarks: [...state.bookmarks, { chapter, scrollY, timestamp: Date.now(), title }]
          });
        }
      },

      removeBookmark: (chapter) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.chapter !== chapter)
      })),

      clearAllBookmarks: () => set({ bookmarks: [] }),
    }),
    {
      name: 'gita-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
