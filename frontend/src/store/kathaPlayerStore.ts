import { create } from 'zustand';

export interface KathaEpisode {
  id: string;
  title: string;
  episode_number: number;
  date: string;
  duration: string;
  guru_name: string;
  video_url: string;
  thumbnail_url?: string;
  description?: string;
  is_new?: boolean;
}

export interface KathaPlayerState {
  activeEpisode: KathaEpisode | null;
  isPlaying: boolean;
  isListenMode: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  requestSeek: number | null;

  // Actions
  playEpisode: (episode: KathaEpisode, isListenMode?: boolean, initialTime?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (delta: number) => void;
  clearRequestSeek: () => void;
  setTime: (currentTime: number, duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  setListenMode: (isListen: boolean) => void;
  toggleListenMode: () => void;
}

export const useKathaPlayerStore = create<KathaPlayerState>((set, get) => ({
  activeEpisode: null,
  isPlaying: false,
  isListenMode: true, // Default to true for sacred visualizer listening
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  requestSeek: null,

  playEpisode: (episode, isListenMode = true, initialTime = 0) => {
    set({
      activeEpisode: episode,
      isPlaying: true,
      isListenMode,
      currentTime: initialTime,
      requestSeek: initialTime > 0 ? initialTime : null,
    });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  resume: () => {
    set({ isPlaying: true });
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  stop: () => {
    set({
      activeEpisode: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      requestSeek: null,
    });
  },

  seekTo: (seconds: number) => {
    const safeSecs = Math.max(0, seconds);
    set({
      currentTime: safeSecs,
      requestSeek: safeSecs,
    });
  },

  seekBy: (delta: number) => {
    const { currentTime, duration } = get();
    const target = Math.max(0, Math.min(duration || Infinity, currentTime + delta));
    set({
      currentTime: target,
      requestSeek: target,
    });
  },

  clearRequestSeek: () => {
    set({ requestSeek: null });
  },

  setTime: (currentTime: number, duration: number) => {
    set((state) => ({
      currentTime,
      duration: duration > 0 ? duration : state.duration,
    }));
  },

  setPlaybackRate: (rate: number) => {
    set({ playbackRate: rate });
  },

  setListenMode: (isListen: boolean) => {
    set({ isListenMode: isListen });
  },

  toggleListenMode: () => {
    set((state) => ({ isListenMode: !state.isListenMode }));
  },
}));
