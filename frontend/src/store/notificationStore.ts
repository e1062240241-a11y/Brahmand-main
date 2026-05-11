import { create } from 'zustand';

interface NotificationState {
  badgeDismissed: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  dismissBadge: () => void;
  resetBadgeDismissal: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  badgeDismissed: false,
  unreadCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  dismissBadge: () => set({ badgeDismissed: true }),
  resetBadgeDismissal: () => set({ badgeDismissed: false }),
}));
