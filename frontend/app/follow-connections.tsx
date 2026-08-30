import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import { followUser, getUserConnections, getUserProfile, unfollowUser } from '../src/services/api';
import { useTranslation } from '../src/utils/i18n';
import { ConnectionUser } from '../src/types';

type ConnectionTab = 'followers' | 'following';

export default function FollowConnectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; userId?: string }>();
  const initialTab: ConnectionTab = params.tab === 'following' ? 'following' : 'followers';
  const targetUserId = typeof params.userId === 'string' && params.userId.trim().length ? params.userId : undefined;
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ConnectionTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState<ConnectionUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Counts from target user profile
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  // Search states
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Optimistic follow state map: targetUserId -> isFollowing (boolean)
  const [optimisticFollows, setOptimisticFollows] = useState<Record<string, boolean>>({});
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(18)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const listTranslateY = useRef(new Animated.Value(0)).current;

  const currentUserId = user?.id;
  const activeSubjectId = targetUserId || currentUserId;

  // Sync initial tab param
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslateY]);

  // 300ms Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch target user total counts once
  useEffect(() => {
    if (!activeSubjectId) return;
    getUserProfile(activeSubjectId, false)
      .then((res) => {
        const profile = res.data || {};
        if (typeof profile.followers_count === 'number') setFollowersCount(profile.followers_count);
        if (typeof profile.following_count === 'number') setFollowingCount(profile.following_count);
      })
      .catch((err) => console.warn('[Connections] Error fetching profile counts:', err));
  }, [activeSubjectId]);

  // Primary Data Fetching Effect (Triggers on tab, subject ID, or search change)
  useEffect(() => {
    let isMounted = true;

    if (!activeSubjectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setItems([]);
    setNextCursor(null);

    getUserConnections(activeSubjectId, activeTab, 20, undefined, debouncedSearch)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data || {};
        const loadedItems: ConnectionUser[] = Array.isArray(data.items) ? data.items : [];
        setItems(loadedItems);
        setNextCursor(data.next_cursor || null);
        if (typeof data.total_count === 'number') {
          if (activeTab === 'followers') setFollowersCount(data.total_count);
          else setFollowingCount(data.total_count);
        }
      })
      .catch((err) => {
        console.warn('[Connections] Error fetching connections:', err);
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSubjectId, activeTab, debouncedSearch]);

  // Cursor Pagination Handler
  const handleLoadMore = useCallback(() => {
    if (!nextCursor || loading || loadingMore || !activeSubjectId) return;

    setLoadingMore(true);
    getUserConnections(activeSubjectId, activeTab, 20, nextCursor, debouncedSearch)
      .then((res) => {
        const data = res.data || {};
        const newItems: ConnectionUser[] = Array.isArray(data.items) ? data.items : [];
        setItems((prev) => {
          const existingIds = new Set();
          for (const i of prev) existingIds.add(i.id || i.user_id);
          const uniqueNew = newItems.filter((i) => !existingIds.has(i.id || i.user_id));
          return [...prev, ...uniqueNew];
        });
        setNextCursor(data.next_cursor || null);
      })
      .catch((err) => console.warn('[Connections] Error loading more connections:', err))
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loading, loadingMore, activeSubjectId, activeTab, debouncedSearch]);

  // Tab switch animation
  useEffect(() => {
    listOpacity.setValue(0.82);
    listTranslateY.setValue(10);

    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(listTranslateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, listOpacity, listTranslateY]);

  // Zero-Latency Optimistic Follow / Unfollow Toggle
  const handleToggleFollow = async (targetUser: ConnectionUser) => {
    const targetId = targetUser.id || targetUser.user_id;
    if (!targetId || targetId === user?.id) return;

    const currentFollowingStatus =
      optimisticFollows[targetId] ?? targetUser.is_following_by_viewer ?? targetUser.is_following ?? false;

    const nextFollowingStatus = !currentFollowingStatus;

    // 1. Zero-latency optimistic UI update
    setOptimisticFollows((prev) => ({ ...prev, [targetId]: nextFollowingStatus }));
    setPendingUserIds((prev) => [...prev, targetId]);

    try {
      if (nextFollowingStatus) {
        await followUser(targetId);
      } else {
        await unfollowUser(targetId);
      }
    } catch (error) {
      console.warn('[Connections] Follow toggle failed, rolling back:', error);
      // Rollback on network failure
      setOptimisticFollows((prev) => ({ ...prev, [targetId]: currentFollowingStatus }));
    } finally {
      setPendingUserIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  const handleBackPress = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile' as any);
      }
    } catch {
      router.replace('/(tabs)/profile' as any);
    }
  };

  const renderTabButton = (tab: ConnectionTab, label: string, count: number) => {
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => {
          if (activeTab !== tab) {
            setSearchText('');
            setDebouncedSearch('');
            setActiveTab(tab);
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
        <View style={[styles.badgeWrap, isActive && styles.activeBadgeWrap]}>
          <Text style={[styles.tabCount, isActive && styles.activeTabCount]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserCard = ({ item }: { item: ConnectionUser }) => {
    const targetId = item.id || item.user_id;
    const isSelf = targetId === user?.id;
    const isFollowing =
      optimisticFollows[targetId] ?? item.is_following_by_viewer ?? item.is_following ?? false;
    const isPending = pendingUserIds.includes(targetId);

    const name = item.name || 'User';
    const username = item.sl_id || item.username || 'sanatan_user';
    const photo = item.photo || item.photo_url;

    return (
      <View style={styles.userCard}>
        <TouchableOpacity
          style={styles.userInfoButton}
          activeOpacity={0.85}
          onPress={() => router.push(`/profile/${targetId}` as any)}
        >
          <Avatar name={name} photo={photo} size={54} />
          <View style={styles.userText}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{name}</Text>
              {item.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color="#F25C05" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.userMeta}>@{username}</Text>
          </View>
        </TouchableOpacity>

        {!isSelf && (
          <View style={styles.actionButtonsRow}>
            {!isFollowing ? (
              <TouchableOpacity
                style={[styles.followButton, isPending && styles.disabledButton]}
                activeOpacity={0.85}
                disabled={isPending}
                onPress={() => handleToggleFollow(item)}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.followButtonText}>{t('follow')}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.messageButton}
                activeOpacity={0.85}
                onPress={() => {
                  const encodedName = encodeURIComponent(name);
                  const encodedSL = encodeURIComponent(username);
                  const encodedPhoto = encodeURIComponent(photo || '');
                  router.push(
                    `/dm/new?userId=${targetId}&userName=${encodedName}&userSL=${encodedSL}&userPhoto=${encodedPhoto}` as any
                  );
                }}
              >
                <Text style={styles.messageButtonText}>{t('message')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#F8EDE7']}
        locations={[0, 0.05, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          styles.screenContent,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerUsername}>{user?.sl_id || user?.name || 'Network'}</Text>
          <TouchableOpacity
            style={styles.addMoreButtonIcon}
            activeOpacity={0.85}
            onPress={() => router.push('/home' as any)}
          >
            <Ionicons name="person-add" size={20} color="#F25C05" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {renderTabButton('followers', t('followers'), followersCount)}
            {renderTabButton('following', t('following'), followingCount)}
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchByName')}
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View
          style={[
            styles.contentWrap,
            {
              opacity: listOpacity,
              transform: [{ translateY: listTranslateY }],
            },
          ]}
        >
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#F25C05" />
            </View>
          ) : (
            <FlashList<ConnectionUser>
              data={items}
              renderItem={renderUserCard}
              keyExtractor={(item) => item.id || item.user_id}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#F25C05" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="people" size={40} color="#FDBA74" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchText.trim()
                      ? t('noFound')
                      : activeTab === 'followers'
                      ? t('noFollowersYet')
                      : t('noFollowingYet')}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchText.trim()
                      ? t('noFound')
                      : activeTab === 'followers'
                      ? t('whenPeopleFollow')
                      : t('discoverPeople')}
                  </Text>
                </View>
              }
            />
          )}
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screenContent: {
    flex: 1,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4EE',
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  addMoreButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4EE',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF4EE',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFD7C2',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#F25C05',
    shadowColor: '#F25C05',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F25C05',
    opacity: 0.7,
  },
  activeTabLabel: {
    color: '#FFFFFF',
    opacity: 1,
  },
  badgeWrap: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FFD7C2',
  },
  activeBadgeWrap: {
    backgroundColor: '#FFFFFF',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F25C05',
  },
  activeTabCount: {
    color: '#F25C05',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  userInfoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  userText: {
    flex: 1,
    marginLeft: 14,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    flexShrink: 1,
  },
  userMeta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    minWidth: 80,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F25C05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  messageButton: {
    minWidth: 80,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F25C05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});
