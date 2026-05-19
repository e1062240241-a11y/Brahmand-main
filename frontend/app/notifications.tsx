import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markAllNotificationsRead, 
  markNotificationRead, 
  respondToCommunityRequest,
  getUsersBatch,
  followUser,
  unfollowUser
} from '../src/services/api';

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Just now';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getActionBadge = (item: any) => {
  const itemData = typeof item.data === 'string'
    ? (() => { try { return JSON.parse(item.data); } catch { return null; } })()
    : item.data;
  const action = itemData?.action || item.type || '';
  
  switch (action) {
    case 'like':
      return { name: 'heart', color: '#FFF', bg: '#FF3B30' };
    case 'comment':
      return { name: 'chatbubble', color: '#FFF', bg: '#0095F6' };
    case 'follow':
      return { name: 'person-add', color: '#FFF', bg: '#4CAF50' };
    case 'sos':
      return { name: 'alert-circle', color: '#FFF', bg: '#E53935' };
    case 'help':
      return { name: 'hand-left', color: '#FFF', bg: '#FF6600' };
    case 'community_creation_invite':
      return { name: 'people', color: '#FFF', bg: '#9933FF' };
    default:
      return { name: 'notifications', color: '#FFF', bg: '#8E8E93' };
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dismissBadge } = useNotificationStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [actorsMap, setActorsMap] = useState<Record<string, { name?: string; photo?: string }>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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
      
      const notificationsList = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];
      setNotifications(notificationsList);

      // Batch fetch actor details
      const actorIds = new Set<string>();
      notificationsList.forEach((notif) => {
        const itemData = typeof notif.data === 'string'
          ? (() => { try { return JSON.parse(notif.data); } catch { return null; } })()
          : notif.data;
        const actorId = itemData?.actor_user_id;
        if (actorId) {
          actorIds.add(actorId);
        }
      });
      
      if (actorIds.size > 0) {
        try {
          const batchRes = await getUsersBatch(Array.from(actorIds));
          if (Array.isArray(batchRes.data)) {
            const newActorsMap: Record<string, any> = {};
            batchRes.data.forEach((actorUser) => {
              if (actorUser && actorUser.id) {
                newActorsMap[actorUser.id] = {
                  name: actorUser.name,
                  photo: actorUser.photo
                };
              }
            });
            setActorsMap(newActorsMap);
          }
        } catch (err) {
          console.warn('Failed to fetch batch actor users:', err);
        }
      }
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

  useEffect(() => {
    if (user?.following && Array.isArray(user.following)) {
      const initialMap: Record<string, boolean> = {};
      user.following.forEach((id: string) => {
        initialMap[id] = true;
      });
      setFollowingMap(initialMap);
    }
  }, [user?.following]);

  const getNotificationLink = (item: any) => {
    if (!item) return undefined;
    if (item.link) return item.link;

    const itemData = typeof item.data === 'string'
      ? (() => { try { return JSON.parse(item.data); } catch { return null; } })()
      : item.data;

    if (itemData?.actor_user_id) {
      return `/profile/${itemData.actor_user_id}`;
    }

    if (itemData?.post_id) {
      return `/post/${itemData.post_id}`;
    }

    return undefined;
  };

  const handleNotificationPress = async (item: any) => {
    const notificationId = item?.id || item?._id;
    if (notificationId) {
      setNotifications((prev) => prev.map((notif) => (
        notif.id === notificationId || notif._id === notificationId
          ? { ...notif, is_read: true, unread: false }
          : notif
      )));
      setUnreadCount(Math.max(0, unreadCount - 1));
      try {
        await markNotificationRead(notificationId);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    }

    const link = getNotificationLink(item);
    if (link) {
      router.push(link);
    }
  };

  const handleFollowToggle = async (actorId: string) => {
    setFollowLoadingMap(prev => ({ ...prev, [actorId]: true }));
    const currentlyFollowing = followingMap[actorId];
    try {
      if (currentlyFollowing) {
        await unfollowUser(actorId);
        setFollowingMap(prev => ({ ...prev, [actorId]: false }));
      } else {
        await followUser(actorId);
        setFollowingMap(prev => ({ ...prev, [actorId]: true }));
      }
    } catch (err) {
      console.warn('Failed to follow/unfollow:', err);
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [actorId]: false }));
    }
  };

  const handleRespondToInvite = async (requestId: string, status: 'accepted' | 'declined', notificationId: string) => {
    setActionLoadingId(notificationId);
    try {
      const response = await respondToCommunityRequest(requestId, status);
      Alert.alert(
        status === 'accepted' ? 'Accepted' : 'Declined',
        response.data?.message || `You have ${status} the community group invitation successfully.`
      );
      // Mark notification as read
      if (notificationId) {
        await markNotificationRead(notificationId);
      }
      // Reload notifications list
      await loadNotifications();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to respond to invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
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

  const getGroupedNotifications = () => {
    const unread = notifications.filter(n => !n.is_read && n.unread !== false);
    const read = notifications.filter(n => n.is_read || n.unread === false);
    return { unread, read };
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderNotificationItem = (item: any) => {
    const isInvite = item.type === 'community_creation_invite';
    
    // Safely extract request_id from nested data payload
    const itemData = typeof item.data === 'string' 
      ? (() => { try { return JSON.parse(item.data); } catch { return null; } })() 
      : item.data;
    
    const actorId = itemData?.actor_user_id;
    const actorName = itemData?.actor_name || item.title?.replace('New like on ', '')?.replace('New comment on ', '') || '';
    const actorUser = actorId ? actorsMap[actorId] : null;
    const actorPhoto = actorUser?.photo;
    
    const actionBadge = getActionBadge(item);
    const isFollow = itemData?.action === 'follow' || item.type === 'follow';
    
    const CardWrapper = isInvite ? View : TouchableOpacity;
    const wrapperProps = isInvite ? {} : { activeOpacity: 0.7, onPress: () => handleNotificationPress(item) };
    
    return (
      <CardWrapper
        key={item.id || item._id || Math.random().toString()}
        style={[
          styles.notificationItem,
          (!item.is_read || item.unread) && styles.notificationItemUnread,
        ]}
        {...wrapperProps}
      >
        {/* Left Side: Avatar */}
        <View style={styles.avatarContainer}>
          {actorPhoto ? (
            <Image source={{ uri: actorPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {actorName ? actorName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          
          {/* Action Badge overlay */}
          {actionBadge && (
            <View style={[styles.badgeOverlay, { backgroundColor: actionBadge.bg }]}>
              <Ionicons name={actionBadge.name} size={9} color="#FFF" />
            </View>
          )}
        </View>

        {/* Middle Side: Content */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.boldText}>{actorName || 'Someone'}</Text>{' '}
            {item.body ? item.body.replace(actorName, '').trim() : 'sent a notification.'}{' '}
            <Text style={styles.timeText}>{getTimeAgo(item.time || item.created_at)}</Text>
          </Text>
          
          {isInvite && (
            <View style={styles.inviteButtonsRow}>
              <TouchableOpacity
                style={[styles.miniActionBtn, styles.miniAcceptBtn, actionLoadingId === item.id && styles.disabledBtn]}
                onPress={() => handleRespondToInvite(itemData?.request_id, 'accepted', item.id || item._id)}
                disabled={actionLoadingId === item.id || !itemData?.request_id}
              >
                <Text style={styles.miniBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniActionBtn, styles.miniDeclineBtn, actionLoadingId === item.id && styles.disabledBtn]}
                onPress={() => handleRespondToInvite(itemData?.request_id, 'declined', item.id || item._id)}
                disabled={actionLoadingId === item.id || !itemData?.request_id}
              >
                <Text style={[styles.miniBtnText, { color: '#000' }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Right Side: Follow button or unread indicator */}
        {isFollow && actorId && (
          <TouchableOpacity
            style={[
              styles.followButton,
              followingMap[actorId] && styles.followingButton,
              followLoadingMap[actorId] && styles.disabledBtn,
            ]}
            onPress={() => handleFollowToggle(actorId)}
            disabled={followLoadingMap[actorId]}
          >
            {followLoadingMap[actorId] ? (
              <ActivityIndicator size="small" color={followingMap[actorId] ? '#000' : '#FFF'} />
            ) : (
              <Text
                style={[
                  styles.followButtonText,
                  followingMap[actorId] && styles.followingButtonText,
                ]}
              >
                {followingMap[actorId] ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {(!item.is_read || item.unread) && !isInvite && !isFollow && (
          <View style={styles.unreadDot} />
        )}
      </CardWrapper>
    );
  };

  const { unread, read } = getGroupedNotifications();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#262626" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Notifications</Text>
          </View>
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={24} color="#FF6600" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listWrapper} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={50} color="#8E8E93" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptyText}>When people interact with you, you'll see it here.</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#FFF' }}>
              {unread.length > 0 && (
                <>
                  {renderSectionHeader('New')}
                  {unread.map((item) => renderNotificationItem(item))}
                </>
              )}
              {read.length > 0 && (
                <>
                  {renderSectionHeader('Earlier')}
                  {read.map((item) => renderNotificationItem(item))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#262626',
    fontSize: 16,
    fontWeight: '700',
  },
  markAllButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 12,
  },
  listWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262626',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  notificationItemUnread: {
    backgroundColor: '#FAFAFA',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: '#EAEAEA',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#EAEAEA',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 13.5,
    lineHeight: 18,
    color: '#262626',
  },
  boldText: {
    fontWeight: '700',
    color: '#262626',
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 12.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095F6',
    marginLeft: 8,
  },
  followButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: '#EFEFEF',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#262626',
  },
  inviteButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  miniActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  miniAcceptBtn: {
    backgroundColor: '#0095F6',
  },
  miniDeclineBtn: {
    backgroundColor: '#EFEFEF',
  },
  miniBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13.5,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});
