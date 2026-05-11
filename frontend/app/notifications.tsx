import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { getUserNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NOTIFICATION_ICONS: Record<string, any> = {
  sos: { icon: 'alert-circle', color: '#E53935', bg: '#FFEBEE' },
  help: { icon: 'hand-left', color: '#FF6600', bg: '#FFF3E0' },
  comment: { icon: 'chatbubble', color: '#2196F3', bg: '#E3F2FD' },
  like: { icon: 'heart', color: '#E91E63', bg: '#FCE4EC' },
  follow: { icon: 'person-add', color: '#4CAF50', bg: '#E8F5E9' },
  default: { icon: 'notifications', color: '#795548', bg: '#EFEBE9' }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dismissBadge } = useNotificationStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [countRes, notificationsRes] = await Promise.all([
        getUnreadNotificationCount().catch(() => ({ data: 0 })),
        getUserNotifications().catch(() => ({ data: [] })),
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
    if (user?.id) loadNotifications();
  }, [user?.id]);

  const handleNotificationPress = async (item: any) => {
    const notificationId = item?.id || item?._id;
    if (notificationId) {
      setNotifications((prev) => prev.map((notif) => (
        notif.id === notificationId || notif._id === notificationId
          ? { ...notif, is_read: true, unread: false }
          : notif
      )));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationRead(notificationId);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    }

    if (item?.link) {
      router.push(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, unread: false })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const getNotificationStyle = (type: string) => {
    const key = type?.toLowerCase() || 'default';
    return NOTIFICATION_ICONS[key] || NOTIFICATION_ICONS.default;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6600', '#FF9933']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
              <Ionicons name="chevron-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && <Text style={styles.subtitle}>{unreadCount} unread messages</Text>}
            </View>
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
              <Ionicons name="checkmark-done-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Gathering your updates...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listWrapper} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={60} color="#D8C8D6" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>You don't have any notifications right now. Enjoy your peaceful day.</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const style = getNotificationStyle(item.type);
              return (
                <TouchableOpacity
                  key={item.id || item._id || Math.random().toString()}
                  style={[styles.notificationItem, (!item.is_read || item.unread) && styles.notificationItemUnread]}
                  activeOpacity={0.7}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: style.bg }]}>
                    <Ionicons name={style.icon} size={22} color={style.color} />
                  </View>
                  <View style={styles.notificationBody}>
                    <Text style={styles.notificationTitle}>{item.title || 'Notification'}</Text>
                    <Text style={styles.notificationText} numberOfLines={2}>
                      {item.body || 'You have a new notification.'}
                    </Text>
                    <Text style={styles.notificationTime}>{item.time || item.created_at || 'Recently'}</Text>
                  </View>
                  {(!item.is_read || item.unread) && <View style={styles.unreadPulse} />}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerGradient: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, marginLeft: 16 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  markAllButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#666', fontSize: 14, fontWeight: '600' },
  listWrapper: { padding: 16, paddingTop: 24 },
  notificationItem: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  notificationItemUnread: { borderColor: 'rgba(255,102,0,0.2)', backgroundColor: '#FFFBF7' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  notificationBody: { flex: 1 },
  notificationTitle: { color: '#222', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  notificationText: { color: '#666', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notificationTime: { color: '#999', fontSize: 11, fontWeight: '600' },
  unreadPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6600', marginLeft: 10 },
  emptyState: { marginTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});
