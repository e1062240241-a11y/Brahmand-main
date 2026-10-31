/**
 * File: frontend/src/store/useStoryStore.ts
 *
 * Zustand Store for Brahmand Library - Cosmic Storyteller Mode ("मैं समय हूँ").
 * Manages view mode ('classical' | 'story'), Tanpura drone settings, and
 * active scene audio playback synchronization with persistent storage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORY_AUDIO_DEFAULTS } from '../constants/gitaStoryFraming';

export type StoryViewMode = 'classical' | 'story';

export interface StoryState {
  // State
  viewMode: StoryViewMode;
  isTanpuraEnabled: boolean;
  tanpuraVolume: number;
  currentPlayingSceneId: string | null;
  isPlaying: boolean;

  // Actions
  setViewMode: (mode: StoryViewMode) => void;
  toggleViewMode: () => void;
  setIsTanpuraEnabled: (enabled: boolean) => void;
  toggleTanpura: () => void;
  setTanpuraVolume: (volume: number) => void;
  setCurrentPlayingSceneId: (sceneId: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackState: (sceneId: string | null, isPlaying: boolean) => void;
  stopPlayback: () => void;
}

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(name);
      } catch {
        // Fallback to AsyncStorage if localStorage throws (e.g. private mode)
      }
    }
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch {
        // Fallback to AsyncStorage
      }
    }
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Ignored
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(name);
        return;
      } catch {
        // Fallback
      }
    }
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Ignored
    }
  },
};

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      // Defaults
      viewMode: 'classical',
      isTanpuraEnabled: false,
      tanpuraVolume: STORY_AUDIO_DEFAULTS.ambientDroneVolume,
      currentPlayingSceneId: null,
      isPlaying: false,

      // Actions
      setViewMode: (mode: StoryViewMode) => set({ viewMode: mode }),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'classical' ? 'story' : 'classical',
        })),

      setIsTanpuraEnabled: (enabled: boolean) => set({ isTanpuraEnabled: enabled }),

      toggleTanpura: () =>
        set((state) => ({
          isTanpuraEnabled: !state.isTanpuraEnabled,
        })),

      setTanpuraVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({ tanpuraVolume: clamped });
      },

      setCurrentPlayingSceneId: (sceneId: string | null) =>
        set({ currentPlayingSceneId: sceneId }),

      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

      setPlaybackState: (sceneId: string | null, isPlaying: boolean) =>
        set({
          currentPlayingSceneId: sceneId,
          isPlaying,
        }),

      stopPlayback: () =>
        set({
          currentPlayingSceneId: null,
          isPlaying: false,
        }),
    }),
    {
      name: 'brahmand-gita-story-store',
      storage: createJSONStorage(() => customStorage),
      // Partialize: Persist preferences, but reset transient runtime playback on cold start
      partialize: (state) => ({
        viewMode: state.viewMode,
        isTanpuraEnabled: state.isTanpuraEnabled,
        tanpuraVolume: state.tanpuraVolume,
        // Reset playback on reload to prevent unintended autoplay
        currentPlayingSceneId: null,
        isPlaying: false,
      }),
    }
  )
);
