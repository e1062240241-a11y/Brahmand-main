import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      updateProgress: (progress) => set((state) => ({
        progresses: { ...state.progresses, [progress.id]: progress }
      })),
      getRecentBooks: () => {
        const books = Object.values(get().progresses);
        return books.sort((a, b) => b.lastOpenedTime - a.lastOpenedTime);
      }
    }),
    {
      name: 'brahmand-library-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
