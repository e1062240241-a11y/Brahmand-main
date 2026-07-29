import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTENT_NOTIFS_KEY = '@persistent_recent_notifications';

interface NotificationState {
  badgeDismissed: boolean;
  unreadCount: number;
  recentNotifications: any[];
  loadStoredNotifications: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  addRecentNotification: (notification: any) => void;
  removeRecentNotification: (id: string) => void;
  clearRecentNotifications: () => void;
  dismissBadge: () => void;
  resetBadgeDismissal: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  badgeDismissed: false,
  unreadCount: 0,
  recentNotifications: [],

  loadStoredNotifications: async () => {
    try {
      const stored = await AsyncStorage.getItem(PERSISTENT_NOTIFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ recentNotifications: parsed });
        }
      }
    } catch (e) {
      console.warn('[NotificationStore] Failed to load stored notifications:', e);
    }
  },

  setUnreadCount: (count: number) => set({ unreadCount: count }),

  addRecentNotification: (notification: any) => set((state) => {
    if (!notification) return state;

    const content = notification?.request?.content || notification?.content;
    const data = content?.data || notification?.data || {};
    const title = content?.title || notification?.title || '';
    const body = content?.body || notification?.body || '';

    const notificationId =
      notification?.id ||
      notification?._id ||
      notification?.request?.identifier ||
      `${title}:${body}:${notification?.created_at || notification?.time || Date.now()}`;

    const normalized = {
      ...notification,
      id: notificationId,
      title: title || notification?.title || '',
      body: body || notification?.body || '',
      data: data,
      type: data?.type || notification?.type || 'general',
      created_at: notification?.created_at || notification?.time || new Date().toISOString(),
      time: notification?.time || notification?.created_at || new Date().toISOString(),
      is_read: notification?.is_read ?? false,
    };

    const withoutDuplicate = state.recentNotifications.filter(
      (item) => (item.id || item._id) !== notificationId
    );
    const updated = [normalized, ...withoutDuplicate].slice(0, 50);

    AsyncStorage.setItem(PERSISTENT_NOTIFS_KEY, JSON.stringify(updated)).catch((err) =>
      console.warn('[NotificationStore] Failed to persist notifications:', err)
    );

    return { recentNotifications: updated };
  }),

  removeRecentNotification: (id: string) => set((state) => {
    const updated = state.recentNotifications.filter((n) => (n.id || n._id) !== id);
    AsyncStorage.setItem(PERSISTENT_NOTIFS_KEY, JSON.stringify(updated)).catch(() => {});
    return { recentNotifications: updated };
  }),

  clearRecentNotifications: () => {
    AsyncStorage.removeItem(PERSISTENT_NOTIFS_KEY).catch(() => {});
    set({ recentNotifications: [] });
  },

  dismissBadge: () => set({ badgeDismissed: true }),
  resetBadgeDismissal: () => set({ badgeDismissed: false }),
}));
