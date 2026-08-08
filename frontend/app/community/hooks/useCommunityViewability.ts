import { create } from 'zustand';

interface ViewabilityState {
  visibleItemIds: Set<string>;
  setVisibleItemIds: (ids: string[]) => void;
}

export const useCommunityViewabilityStore = create<ViewabilityState>((set) => ({
  visibleItemIds: new Set<string>(),
  setVisibleItemIds: (ids) => set({ visibleItemIds: new Set(ids) }),
}));
