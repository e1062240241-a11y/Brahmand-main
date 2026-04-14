import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { getUserNotifications, getUnreadNotificationCount } from '../src/services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dismissBadge } = useNotificationStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [countRes, notificationsRes] = await Promise.all([
        getUnreadNotificationCount(),
        getUserNotifications(),
      ]);

      const countValue = typeof countRes.data === 'number'
        ? countRes.data
        : Number(countRes.data?.unread_count ?? 0);
      setUnreadCount(countValue || 0);
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dismissBadge();
    if (!user?.id) {
      return;
    }
    loadNotifications();
  }, [user?.id, dismissBadge]);

  const handleNotificationPress = (item: any) => {
    try {
      if (item?.link) {
        router.push(item.link);
      }
    } catch (error) {
      console.warn('Failed to navigate from notification:', error);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    setUnreadCount(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            dismissBadge();
            router.replace('/feed');
          }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listWrapper}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          ) : (
            notifications.map((item) => (
              <TouchableOpacity
                key={item.id || item._id || item.title}
                style={[styles.notificationItem, item.unread && styles.notificationItemUnread]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.notificationBody}>
                  <Text style={styles.notificationTitle}>{item.title || 'Notification'}</Text>
                  <Text style={styles.notificationText} numberOfLines={2}>
                    {item.body || 'You have a new notification.'}
                  </Text>
                </View>
                <View style={styles.notificationMeta}> 
                  <Text style={styles.notificationTime}>{item.time || item.created_at || ''}</Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  markAllButton: {
    padding: SPACING.sm,
  },
  markAllText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWrapper: {
    padding: SPACING.md,
  },
  emptyState: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  notificationItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationItemUnread: {
    borderColor: COLORS.primary,
    backgroundColor: '#F7F9FF',
  },
  notificationBody: {
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  notificationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  notificationTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
