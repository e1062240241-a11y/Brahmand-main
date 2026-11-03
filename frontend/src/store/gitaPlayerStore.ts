import { create } from 'zustand';

export type GitaReciteMode = 'sanskrit' | 'hindi' | 'english' | 'both';

export interface GitaPlayerState {
  chapter: number;
  chapterNameHi: string;
  chapterNameEn: string;
  verseIndex: number;
  verseNum: number;
  totalVerses: number;
  currentVerseText: string;
  currentVerseTranslation: string;
  currentSpokenText: string;
  currentSegmentIndex: number;
  totalSegments: number;
  isPlaying: boolean;
  reciteMode: GitaReciteMode;
  reciteSpeed: number;
  continuousPlay: boolean;
  activeType: 'shloka' | 'story' | null;
  storySceneTitle: string | null;
  requestAction: 'play' | 'pause' | 'next' | 'prev' | 'stop' | null;

  // Actions
  setPlaying: (isPlaying: boolean) => void;
  setCurrentSpokenText: (text: string, index?: number, total?: number) => void;
  setVerseData: (data: {
    chapter: number;
    chapterNameHi?: string;
    chapterNameEn?: string;
    verseIndex: number;
    verseNum: number;
    totalVerses: number;
    text?: string;
    translation?: string;
    isPlaying?: boolean;
    initialSpokenText?: string;
  }) => void;
  setStoryData: (data: {
    chapter: number;
    chapterNameHi?: string;
    sceneTitle: string;
    isPlaying?: boolean;
  }) => void;
  setReciteMode: (mode: GitaReciteMode) => void;
  setReciteSpeed: (speed: number) => void;
  setContinuousPlay: (continuous: boolean) => void;
  togglePlayPause: () => void;
  nextVerse: () => void;
  prevVerse: () => void;
  stop: () => void;
  clearRequestAction: () => void;
}

export const useGitaPlayerStore = create<GitaPlayerState>((set, get) => ({
  chapter: 1,
  chapterNameHi: 'अर्जुनविषादयोग',
  chapterNameEn: 'Arjuna Vishada Yoga',
  verseIndex: 0,
  verseNum: 1,
  totalVerses: 47,
  currentVerseText: '',
  currentVerseTranslation: '',
  currentSpokenText: '',
  currentSegmentIndex: 0,
  totalSegments: 1,
  isPlaying: false,
  reciteMode: 'both',
  reciteSpeed: 1.0,
  continuousPlay: true,
  activeType: null,
  storySceneTitle: null,
  requestAction: null,

  setPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setCurrentSpokenText: (text, index = 0, total = 1) => {
    set({
      currentSpokenText: text,
      currentSegmentIndex: index,
      totalSegments: total,
    });
  },

  setVerseData: (data) => {
    const fallbackFirstLine = (data.text || '')
      .split(/[।॥\n]/)[0]
      ?.trim() || 'श्रीभगवानुवाच';

    set({
      chapter: data.chapter,
      chapterNameHi: data.chapterNameHi || get().chapterNameHi,
      chapterNameEn: data.chapterNameEn || get().chapterNameEn,
      verseIndex: data.verseIndex,
      verseNum: data.verseNum,
      totalVerses: data.totalVerses || get().totalVerses,
      currentVerseText: data.text || get().currentVerseText,
      currentVerseTranslation: data.translation || get().currentVerseTranslation,
      currentSpokenText: data.initialSpokenText || fallbackFirstLine,
      currentSegmentIndex: 0,
      totalSegments: 1,
      isPlaying: data.isPlaying !== undefined ? data.isPlaying : get().isPlaying,
      activeType: 'shloka',
      storySceneTitle: null,
    });
  },

  setStoryData: (data) => {
    set({
      chapter: data.chapter,
      chapterNameHi: data.chapterNameHi || get().chapterNameHi,
      storySceneTitle: data.sceneTitle,
      currentSpokenText: data.sceneTitle,
      isPlaying: data.isPlaying !== undefined ? data.isPlaying : get().isPlaying,
      activeType: 'story',
    });
  },

  setReciteMode: (mode) => {
    set({ reciteMode: mode });
  },

  setReciteSpeed: (speed) => {
    set({ reciteSpeed: speed });
  },

  setContinuousPlay: (continuous) => {
    set({ continuousPlay: continuous });
  },

  togglePlayPause: () => {
    const nextPlaying = !get().isPlaying;
    set({
      isPlaying: nextPlaying,
      requestAction: nextPlaying ? 'play' : 'pause',
    });
  },

  nextVerse: () => {
    set({ requestAction: 'next' });
  },

  prevVerse: () => {
    set({ requestAction: 'prev' });
  },

  stop: () => {
    set({
      isPlaying: false,
      activeType: null,
      currentSpokenText: '',
      requestAction: 'stop',
    });
  },

  clearRequestAction: () => {
    set({ requestAction: null });
  },
}));
