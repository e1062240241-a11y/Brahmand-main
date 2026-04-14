import { create } from 'zustand';

interface NotificationState {
  badgeDismissed: boolean;
  dismissBadge: () => void;
  resetBadgeDismissal: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  badgeDismissed: false,
  dismissBadge: () => set({ badgeDismissed: true }),
  resetBadgeDismissal: () => set({ badgeDismissed: false }),
}));
