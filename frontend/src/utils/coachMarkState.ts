import { create } from 'zustand';

interface CoachMarkState {
  showCoachMarks: boolean;
  coachMarkStep: number;
  setShowCoachMarks: (show: boolean) => void;
  setCoachMarkStep: (step: number) => void;
}

export const useCoachMarkStore = create<CoachMarkState>((set) => ({
  showCoachMarks: false,
  coachMarkStep: 1,
  setShowCoachMarks: (show) => set({ showCoachMarks: show }),
  setCoachMarkStep: (step) => set({ coachMarkStep: step }),
}));
