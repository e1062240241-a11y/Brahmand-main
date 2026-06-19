import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getFeatureForStep = (step: number): string | null => {
  if (step === 1 || step === 3 || step === 4 || step === 5) return 'homeCoachSeen';
  if (step === 2) return 'kundliCoachSeen';
  if (step === 6) return 'feedCoachSeen';
  if (step === 7 || step === 8) return 'vendorCoachSeen';
  return null;
};

export const getNextStep = (currentStep: number, seenFlags: Record<string, boolean>): number => {
  let step = currentStep + 1;
  while (step <= 8) {
    const feature = getFeatureForStep(step);
    if (!feature || !seenFlags[feature]) {
      return step;
    }
    step++;
  }
  return step;
};

interface CoachMarkState {
  showCoachMarks: boolean;
  coachMarkStep: number;
  seenFlags: Record<string, boolean>;
  setShowCoachMarks: (show: boolean) => void;
  setCoachMarkStep: (step: number) => void;
  loadFlags: (userId: string | null | undefined) => Promise<void>;
  setFlagSeen: (userId: string | null | undefined, feature: string) => Promise<void>;
}

export const useCoachMarkStore = create<CoachMarkState>((set) => ({
  showCoachMarks: false,
  coachMarkStep: 1,
  seenFlags: {
    homeCoachSeen: false,
    kundliCoachSeen: false,
    feedCoachSeen: false,
    vendorCoachSeen: false,
  },
  setShowCoachMarks: (show) => set({ showCoachMarks: show }),
  setCoachMarkStep: (step) => set({ coachMarkStep: step }),
  loadFlags: async (userId) => {
    try {
      const keys = ['homeCoachSeen', 'kundliCoachSeen', 'feedCoachSeen', 'vendorCoachSeen'];
      const loaded: Record<string, boolean> = {};
      for (const k of keys) {
        const storageKey = userId ? `coachmark_seen_${userId}_${k}` : `coachmark_seen_guest_${k}`;
        const val = await AsyncStorage.getItem(storageKey);
        loaded[k] = val === 'true';
      }
      set({ seenFlags: loaded });
    } catch (e) {
      console.warn('Failed to load coach mark flags:', e);
    }
  },
  setFlagSeen: async (userId, feature) => {
    try {
      const storageKey = userId ? `coachmark_seen_${userId}_${feature}` : `coachmark_seen_guest_${feature}`;
      await AsyncStorage.setItem(storageKey, 'true');
      set((state) => ({
        seenFlags: {
          ...state.seenFlags,
          [feature]: true,
        },
      }));
    } catch (e) {
      console.warn(`Failed to set coach mark flag ${feature}:`, e);
    }
  },
}));
