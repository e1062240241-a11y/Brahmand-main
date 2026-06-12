import { create } from 'zustand';

interface NotificationState {
  badgeDismissed: boolean;
  unreadCount: number;
  recentNotifications: any[];
  setUnreadCount: (count: number) => void;
  addRecentNotification: (notification: any) => void;
  clearRecentNotifications: () => void;
  dismissBadge: () => void;
  resetBadgeDismissal: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  badgeDismissed: false,
  unreadCount: 0,
  recentNotifications: [],
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  addRecentNotification: (notification: any) => set((state) => {
    const notificationId = notification?.id || notification?._id || notification?.request?.identifier || `${notification?.title || ''}:${notification?.created_at || notification?.time || Date.now()}`;
    const normalized = notification?.request?.content
      ? {
          id: notificationId,
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
          created_at: new Date().toISOString(),
          is_read: false,
        }
      : {
          ...notification,
          id: notificationId,
          created_at: notification?.created_at || notification?.time || new Date().toISOString(),
          is_read: notification?.is_read ?? false,
        };
    const withoutDuplicate = state.recentNotifications.filter((item) => (item.id || item._id) !== notificationId);
    return { recentNotifications: [normalized, ...withoutDuplicate].slice(0, 20) };
  }),
  clearRecentNotifications: () => set({ recentNotifications: [] }),
  dismissBadge: () => set({ badgeDismissed: true }),
  resetBadgeDismissal: () => set({ badgeDismissed: false }),
}));
