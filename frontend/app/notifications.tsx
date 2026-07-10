import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../src/utils/i18n';

import { COLORS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { socketService } from '../src/services/socket';
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

const normalizeNotificationsResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  
  // Ensure UTC interpretation if missing timezone suffix
  let ds = String(dateString);
  if (!ds.includes('Z') && !ds.includes('+')) {
    ds = ds.includes('T') ? `${ds}Z` : `${ds.replace(' ', 'T')}Z`;
  }

  const date = new Date(ds);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return formatDateIST(date);
};

const getActionBadge = (item: any) => {
  const itemData = typeof item.data === 'string'
    ? (() => { try { return JSON.parse(item.data); } catch { return null; } })()
    : item.data;
  const action = (itemData?.action || item.type || '').toLowerCase();
  
  if (action.includes('like')) {
    return { name: 'heart', color: '#FFF', bg: '#FF3B30' };
  }
  if (action.includes('comment')) {
    return { name: 'chatbubble', color: '#FFF', bg: '#0095F6' };
  }
  if (action.includes('follow')) {
    return { name: 'person-add', color: '#FFF', bg: '#4CAF50' };
  }
  if (action.includes('sos')) {
    return { name: 'alert-circle', color: '#FFF', bg: '#E53935' };
  }
  if (action.includes('help') || action.includes('respond')) {
    return { name: 'hand-left', color: '#FFF', bg: '#FF6600' };
  }
  if (action.includes('invite') || action.includes('community')) {
    return { name: 'people', color: '#FFF', bg: '#9933FF' };
  }
  if (action.includes('jaap') || action.includes('chant')) {
    return { name: 'leaf', color: '#FFF', bg: '#4CAF50' };
  }
  if (action.includes('kyc')) {
    return { name: 'shield-checkmark', color: '#FFF', bg: '#3F51B5' };
  }
  if (action.includes('vendor') || action.includes('business')) {
    return { name: 'briefcase', color: '#FFF', bg: '#E91E63' };
  }
  if (action.includes('astrology') || action.includes('horoscope') || action.includes('kundli')) {
    return { name: 'star', color: '#FFF', bg: '#9C27B0' };
  }
  if (action.includes('chat') || action.includes('dm') || action.includes('message')) {
    return { name: 'mail', color: '#FFF', bg: '#00BCD4' };
  }
  if (action.includes('festival')) {
    return { name: 'calendar', color: '#FFF', bg: '#FF5722' };
  }
  if (action.includes('library') || action.includes('book')) {
    return { name: 'book', color: '#FFF', bg: '#795548' };
  }

  return { name: 'notifications', color: '#FFF', bg: '#8E8E93' };
};

export default function NotificationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter = params.filter;
  const { user, updateUser } = useAuthStore();
  const { dismissBadge, recentNotifications } = useNotificationStore();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [actorsMap, setActorsMap] = useState<Record<string, { name?: string; photo?: string; isVerified?: boolean }>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  const loadNotifications = async (isInitial = false) => {
    if (isInitial) {
      setLoading((prev) => {
        if (notifications.length > 0) return false;
        return true;
      });
    }
    try {
      const [countRes, notificationsRes] = await Promise.all([
        getUnreadNotificationCount().catch(() => ({ data: 0 })),
        getUserNotifications().catch(() => ({ data: [] })),
      ]);

      const countValue = typeof countRes.data === 'number'
        ? countRes.data
        : Number(countRes.data?.unread_count ?? 0);
      setUnreadCount(countValue || 0);
      
      const serverNotifications = normalizeNotificationsResponse(notificationsRes.data);
      const pendingNotifications = recentNotifications.filter((recent) =>
        serverNotifications.every((serverNotif: any) => (serverNotif.id || serverNotif._id) !== (recent.id || recent._id)),
      );
      let notificationsList = [...pendingNotifications, ...serverNotifications];
      
      if (filter === 'vendor') {
        notificationsList = notificationsList.filter((notif) => {
          const itemData = typeof notif.data === 'string'
            ? (() => { try { return JSON.parse(notif.data); } catch { return null; } })()
            : notif.data;
          const action = (itemData?.action || notif.type || '').toLowerCase();
          return action.includes('vendor') || action.includes('business');
        });
      }
      
      // Sort notifications by time or created_at descending (latest first)
      notificationsList.sort((a: any, b: any) => {
        const timeA = new Date(a.time || a.created_at || 0).getTime();
        const timeB = new Date(b.time || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      // Show all notifications for all functionalities without deduplication filter
      setNotifications(notificationsList);
      AsyncStorage.setItem('notifications_cache_data', JSON.stringify(notificationsList)).catch(e => console.warn(e));

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
                  photo: actorUser.photo,
                  isVerified: actorUser.is_verified || false
                };
              }
            });
            setActorsMap(prev => {
              const merged = { ...prev, ...newActorsMap };
              AsyncStorage.setItem('notifications_actors_map_data', JSON.stringify(merged)).catch(e => console.warn(e));
              return merged;
            });
          }
        } catch (err) {
          console.warn('Failed to fetch batch actor users:', err);
        }
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const notifRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const loadNotifsRef = useRef(loadNotifications);
  loadNotifsRef.current = loadNotifications;

  const refreshNotifications = useCallback(() => {
    loadNotifsRef.current(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifsRef.current(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      dismissBadge();
      loadNotifsRef.current(true);
      notifRefreshRef.current = setInterval(refreshNotifications, 30000);

      socketService.onEvent('new_notification', refreshNotifications);

      return () => {
        if (notifRefreshRef.current) clearInterval(notifRefreshRef.current);
        socketService.offEvent('new_notification', refreshNotifications);
      };
    }, [user?.id, refreshNotifications, recentNotifications])
  );

  useEffect(() => {
    const resetUserNotifs = async () => {
      setNotifications([]);
      setActorsMap({});
      setFollowingMap({});
      try {
        await Promise.all([
          AsyncStorage.removeItem('notifications_cache_data'),
          AsyncStorage.removeItem('notifications_actors_map_data'),
          AsyncStorage.removeItem('notifications_following_map_data'),
        ]);
      } catch (e) {
        console.warn('Failed to clear notification cache:', e);
      }
    };
    if (user?.id) {
      const loadCachedData = async () => {
        try {
          const [cachedNotifs, cachedActors, cachedFollowing] = await Promise.all([
            AsyncStorage.getItem('notifications_cache_data'),
            AsyncStorage.getItem('notifications_actors_map_data'),
            AsyncStorage.getItem('notifications_following_map_data'),
          ]);

          let hasData = false;
          if (cachedNotifs) {
            const parsed = JSON.parse(cachedNotifs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNotifications(parsed);
              hasData = true;
            }
          }
          if (cachedActors) {
            const parsed = JSON.parse(cachedActors);
            setActorsMap(parsed);
          }
          if (cachedFollowing) {
            const parsed = JSON.parse(cachedFollowing);
            setFollowingMap(parsed);
          }

          setLoading(!hasData);
        } catch (err) {
          console.warn('Failed to load cached notifications:', err);
          setLoading(true);
        }
      };
      loadCachedData();

      if (user.following && Array.isArray(user.following)) {
        const initialMap: Record<string, boolean> = {};
        user.following.forEach((id: string) => {
          initialMap[id] = true;
        });
        setFollowingMap(initialMap);
        AsyncStorage.setItem('notifications_following_map_data', JSON.stringify(initialMap)).catch(e => console.warn(e));
      }
    } else {
      resetUserNotifs();
    }
  }, [user?.id, user?.following]);

  const getNotificationLink = (item: any) => {
    if (!item) return undefined;
    if (item.link) return item.link;

    const itemData = typeof item.data === 'string'
      ? (() => { try { return JSON.parse(item.data); } catch { return null; } })()
      : item.data;

    const typeKey = (item?.type || item?.notification_type || '').toLowerCase();
    const actionKey = (itemData?.action || '').toLowerCase();

    if (typeKey.includes('sos') || actionKey.includes('sos') || itemData?.sos_id) {
      return '/sos';
    }
    if (typeKey.includes('jaap') || typeKey.includes('chant') || actionKey.includes('jaap') || actionKey.includes('chant')) {
      return '/live-jaap-welcome';
    }
    if (typeKey.includes('kyc') || actionKey.includes('kyc')) {
      return '/kyc';
    }
    if (typeKey.includes('astrology') || typeKey.includes('horoscope') || typeKey.includes('kundli') || actionKey.includes('astrology') || actionKey.includes('horoscope') || actionKey.includes('kundli')) {
      return '/astrology';
    }
    if (typeKey.includes('festival') || actionKey.includes('festival')) {
      return '/festivals';
    }
    if (typeKey.includes('chat') || typeKey.includes('dm') || typeKey.includes('message') || actionKey.includes('chat') || actionKey.includes('dm') || actionKey.includes('message')) {
      const convId = itemData?.conversation_id || itemData?.chat_id;
      const actorId = itemData?.actor_user_id || itemData?.sender_id || itemData?.user_id;
      const actorName = itemData?.actor_name || itemData?.username || itemData?.name || '';
      const actorSL = itemData?.actor_sl_id || itemData?.sl_id || '';
      const actorUser = actorId ? actorsMap[actorId] : null;
      const actorPhoto = actorUser?.photo || '';
      if (convId && convId !== 'undefined' && convId !== 'new') {
        return `/dm/${convId}?userId=${actorId}&userName=${encodeURIComponent(actorName)}&userSL=${encodeURIComponent(actorSL)}&userPhoto=${encodeURIComponent(actorPhoto)}`;
      }
      if (actorId) {
        return `/dm/new?userId=${actorId}&userName=${encodeURIComponent(actorName)}&userSL=${encodeURIComponent(actorSL)}&userPhoto=${encodeURIComponent(actorPhoto)}`;
      }
      return '/dm/new';
    }

    if (itemData?.post_id) {
      return `/post/${itemData.post_id}`;
    }

    if (itemData?.actor_user_id) {
      return `/profile/${itemData.actor_user_id}`;
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
        if (user && user.following) {
          updateUser({ following: user.following.filter((id: string) => id !== actorId) });
        }
      } else {
        await followUser(actorId);
        setFollowingMap(prev => ({ ...prev, [actorId]: true }));
        if (user) {
          const currentFollowing = user.following || [];
          if (!currentFollowing.includes(actorId)) {
            updateUser({ following: [...currentFollowing, actorId] });
          }
        }
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
      // Remove this notification from state immediately
      if (notificationId) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId && n._id !== notificationId));
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
    router.replace('/(tabs)/home');
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

  const getDayGroup = (dateStr?: string): string => {
    if (!dateStr) return 'Earlier';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Earlier';
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfGiven = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffMs = startOfToday.getTime() - startOfGiven.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'This Week';
    if (diffDays <= 30) return 'This Month';
    return 'Earlier';
  };

  const getGroupedNotifications = () => {
    const groups: Record<string, any[]> = {};
    notifications.forEach(n => {
      const group = getDayGroup(n.time || n.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });
    const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Earlier'];
    return order.filter(g => groups[g]?.length > 0).map(g => ({ title: g, data: groups[g] }));
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
    const actorUser = actorId ? actorsMap[actorId] : null;
    const actorName = actorUser?.name || itemData?.actor_name || item.title?.replace('New like on ', '')?.replace('New comment on ', '') || 'Someone';
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
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            </View>
          )}
          
          {/* Action Badge overlay */}
          {actionBadge && (
            <View style={[styles.badgeOverlay, { backgroundColor: actionBadge.bg }]}>
              <Ionicons name={actionBadge.name as any} size={9} color="#FFF" />
            </View>
          )}
        </View>
 
        {/* Middle Side: Content */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={{ fontWeight: '700' }}>{actorName}</Text>
            {actorUser?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
            {' '}{item.body ? item.body.replace(itemData?.actor_name || actorName || '', '').trim() : 'sent a notification.'}
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

        {/* Right Side: Follow button or Time */}
        <View style={styles.rightContent}>
          {!isFollow && !isInvite && (
            <Text style={styles.timeText}>{getTimeAgo(item.time || item.created_at)}</Text>
          )}
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
                  {followingMap[actorId] ? t('following2') : t('follow')}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {(!item.is_read || item.unread) && !isInvite && !isFollow && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </CardWrapper>
    );
  };

  const groupedData = getGroupedNotifications();

  return (
    <LinearGradient colors={['#F9BA9C', '#FFF4ED', '#FFFFFF']} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>{filter === 'vendor' ? t('notifications') : t('notificationsTitle')}</Text>
          </View>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <ScrollView 
          contentContainerStyle={styles.listWrapper} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#FF6600" 
              colors={['#FF6600']} 
            />
          }
        >
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <View key={key} style={styles.notificationItem}>
              <View style={[styles.avatarImage, { backgroundColor: 'rgba(0,0,0,0.06)' }]} />
              <View style={styles.notificationContent}>
                <View style={{ width: '80%', height: 14, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '40%', height: 12, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 4 }} />
              </View>
              <View style={{ width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8 }} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listWrapper} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#FF6600" 
              colors={['#FF6600']} 
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={50} color="#8E8E93" />
              </View>
              <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
              <Text style={styles.emptyText}>{t('whenPeopleFollow')}</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: 'transparent' }}>
              {groupedData.map((section) => (
                <View key={section.title}>
                  {renderSectionHeader(section.title)}
                  {section.data.map((item) => renderNotificationItem(item))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
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
    color: '#000',
    fontSize: 18,
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
    backgroundColor: 'transparent',
  },
  loadingText: {
    color: '#000',
    fontSize: 13,
    marginTop: 12,
  },
  listWrapper: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 0,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
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
    paddingRight: 8,
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#222',
  },
  boldText: {
    fontWeight: '700',
    color: '#000',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    color: '#000',
    fontSize: 13,
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
