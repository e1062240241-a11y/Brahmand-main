import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
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
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import { followUser, getUserProfile, unfollowUser, getUsersBatch, getAllUsers } from '../src/services/api';
import { useTranslation } from '../src/utils/i18n';

type ConnectionTab = 'followers' | 'following';

interface ConnectionUser {
  id: string;
  name?: string;
  sl_id?: string;
  photo?: string;
}

const loadUsersByIds = async (ids: string[]): Promise<ConnectionUser[]> => {
  const validIds = (ids || []).filter((id) => typeof id === 'string' && id.trim().length > 0);
  if (!validIds.length) {
    return [];
  }

  try {
    const BATCH_SIZE = 100;
    const allUsers: ConnectionUser[] = [];

    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
      const chunk = validIds.slice(i, i + BATCH_SIZE);
      const res = await getUsersBatch(chunk);
      if (Array.isArray(res.data)) {
        allUsers.push(...res.data);
      } else {
        console.warn('[Connections] getUsersBatch returned non-array:', typeof res.data);
      }
    }

    console.log(`[Connections] loadUsersByIds: requested=${validIds.length}, loaded=${allUsers.length}`);
    return allUsers;
  } catch (error) {
    console.warn('[Connections] Failed to batch load users:', error);
    return [];
  }
};

export default function FollowConnectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; userId?: string }>();
  const initialTab: ConnectionTab = params.tab === 'following' ? 'following' : 'followers';
  const targetUserId = typeof params.userId === 'string' && params.userId.trim().length ? params.userId : undefined;
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ConnectionTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [usersById, setUsersById] = useState<Record<string, ConnectionUser>>({});
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [profileFollowingIds, setProfileFollowingIds] = useState<string[]>([]);
  const [viewerFollowingIds, setViewerFollowingIds] = useState<string[]>([]);
  const [followersSearch, setFollowersSearch] = useState('');
  const [followingSearch, setFollowingSearch] = useState('');
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<ConnectionUser[]>([]);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(18)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const listTranslateY = useRef(new Animated.Value(0)).current;

  const currentUserId = user?.id;
  const activeUserIdRef = useRef<string | undefined>(currentUserId);
  const activeTargetUserIdRef = useRef<string | undefined>(targetUserId);

  useEffect(() => {
    activeUserIdRef.current = currentUserId;
    activeTargetUserIdRef.current = targetUserId;
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  useEffect(() => {
    let isMounted = true;

    // Purge previous state on ID change to prevent flashing stale data
    setUsersById({});
    setFollowerIds([]);
    setProfileFollowingIds([]);
    setViewerFollowingIds([]);
    setSuggestedUsers([]);
    setLoading(true);

    const loadConnections = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      const requestedUserId = currentUserId;
      const requestedTargetUserId = targetUserId;

      try {
        const [profileResponse, viewerResponse, usersResponse] = await Promise.all([
          getUserProfile(targetUserId, true),
          getUserProfile(undefined, true),
          getAllUsers('', 20),
        ]);

        if (requestedUserId !== activeUserIdRef.current || requestedTargetUserId !== activeTargetUserIdRef.current) {
          return;
        }

        const profile = profileResponse.data || {};
        const viewerProfile = viewerResponse.data || {};
        const followerIds = Array.isArray(profile.followers) ? profile.followers.filter((id: any) => typeof id === 'string' && id.length > 0) : [];
        const followingIds = Array.isArray(profile.following) ? profile.following.filter((id: any) => typeof id === 'string' && id.length > 0) : [];
        const viewerFollowing = Array.isArray(viewerProfile.following) ? viewerProfile.following.filter((id: any) => typeof id === 'string' && id.length > 0) : [];

        console.log(`[Connections] Profile followers: ${followerIds.length}, following: ${followingIds.length}, viewer following: ${viewerFollowing.length}`);

        const [followerUsers, followingUsers] = await Promise.all([
          loadUsersByIds(followerIds),
          loadUsersByIds(followingIds),
        ]);

        if (requestedUserId !== activeUserIdRef.current || requestedTargetUserId !== activeTargetUserIdRef.current) {
          return;
        }

        const allFetchedUsers = Array.isArray(usersResponse?.data?.users) ? usersResponse.data.users : Array.isArray(usersResponse?.data) ? usersResponse.data : [];
        const suggestions = allFetchedUsers.filter((u: any) =>
          u.id !== user?.id && !viewerFollowing.includes(u.id) && !followerIds.includes(u.id)
        ).slice(0, 10);

        if (!isMounted) {
          return;
        }

        const nextUsersById = [...followerUsers, ...followingUsers].reduce<Record<string, ConnectionUser>>(
          (acc, item) => {
            acc[item.id] = item;
            return acc;
          },
          {}
        );

        setUsersById(nextUsersById);
        setFollowerIds(followerIds);
        setProfileFollowingIds(followingIds);
        setViewerFollowingIds(viewerFollowing);
        setSuggestedUsers(suggestions);
      } catch (error) {
        console.warn('Failed to load follower/following users:', error);
        if (isMounted && requestedUserId === activeUserIdRef.current && requestedTargetUserId === activeTargetUserIdRef.current) {
          setUsersById({});
          setFollowerIds([]);
          setProfileFollowingIds([]);
          setViewerFollowingIds([]);
          setSuggestedUsers([]);
        }
      } finally {
        if (isMounted && requestedUserId === activeUserIdRef.current && requestedTargetUserId === activeTargetUserIdRef.current) {
          setLoading(false);
        }
      }
    };

    loadConnections();

    return () => {
      isMounted = false;
    };
  }, [targetUserId, currentUserId]);

  const followers = followerIds
    .map((id) => usersById[id])
    .filter((item): item is ConnectionUser => Boolean(item?.id));
  const following = profileFollowingIds
    .map((id) => usersById[id])
    .filter((item): item is ConnectionUser => Boolean(item?.id));
  const mutualIdsSet = new Set(profileFollowingIds.filter((id) => followerIds.includes(id)));
  const activeSearch = activeTab === 'followers' ? followersSearch : followingSearch;
  const activeUsers = activeTab === 'followers' ? followers : following;
  const filteredUsers = activeUsers.filter((item) => {
    const query = activeSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [item.name, item.sl_id]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  const renderTabButton = (tab: ConnectionTab, label: string, count: number) => {
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.85}
      >
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
        <View style={[styles.badgeWrap, isActive && styles.activeBadgeWrap]}>
          <Text style={[styles.tabCount, isActive && styles.activeTabCount]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const isViewingOwnProfile = !targetUserId;

  const handleToggleFollow = async (followTargetId: string) => {
    const isFollowing = viewerFollowingIds.includes(followTargetId);
    const targetUser = usersById[followTargetId];
    const nextFollowingIds = isFollowing
      ? viewerFollowingIds.filter((id) => id !== followTargetId)
      : [...viewerFollowingIds, followTargetId];

    const prevFollowerIds = [...followerIds];
    const prevFollowingIds = [...viewerFollowingIds];
    const prevProfileFollowingIds = [...profileFollowingIds];

    setPendingUserIds((current) => [...current, followTargetId]);
    setViewerFollowingIds(nextFollowingIds);
    if (targetUser) {
      setUsersById((current) => ({ ...current, [followTargetId]: targetUser }));
    }
    updateUser({ following: nextFollowingIds } as any);

    // If viewing own profile, also update the profile's following list optimistically
    if (isViewingOwnProfile) {
      setProfileFollowingIds(nextFollowingIds);
    }

    try {
      if (isFollowing) {
        await unfollowUser(followTargetId);
      } else {
        await followUser(followTargetId);
      }
    } catch (error) {
      console.warn('Failed to update follow state:', error);
      setViewerFollowingIds(prevFollowingIds);
      setFollowerIds(prevFollowerIds);
      if (isViewingOwnProfile) {
        setProfileFollowingIds(prevProfileFollowingIds);
      }
      updateUser({ following: prevFollowingIds } as any);
    } finally {
      setPendingUserIds((current) => current.filter((id) => id !== followTargetId));
    }
  };

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
  }, [activeTab, followersSearch, followingSearch, followerIds.length, profileFollowingIds.length, listOpacity, listTranslateY]);

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

  const totalConnections = new Set([...followerIds, ...profileFollowingIds]).size;

  const renderUserCard = (item: ConnectionUser, isLast: boolean) => (
    <View key={item.id} style={[styles.userCard, isLast && styles.lastUserCard]}>
      <TouchableOpacity
        style={styles.userInfoButton}
        activeOpacity={0.85}
        onPress={() => router.push(`/profile/${item.id}` as any)}
      >
        <Avatar name={item.name || 'User'} photo={item.photo} size={54} />
        <View style={styles.userText}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          </View>
          <Text style={styles.userMeta}>@{item.sl_id || 'sanatan_user'}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtonsRow}>
        {(!viewerFollowingIds.includes(item.id) || item.id === user?.id) ? (
          <TouchableOpacity
            style={[
              styles.followButton,
              pendingUserIds.includes(item.id) && styles.disabledButton,
            ]}
            activeOpacity={0.85}
            disabled={pendingUserIds.includes(item.id) || item.id === user?.id}
            onPress={() => handleToggleFollow(item.id)}
          >
            {pendingUserIds.includes(item.id) ? (
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
              const userName = encodeURIComponent(item.name || '');
              const userSL = encodeURIComponent(item.sl_id || '');
              const userPhoto = encodeURIComponent(item.photo || '');
              router.push(`/dm/new?userId=${item.id}&userName=${userName}&userSL=${userSL}&userPhoto=${userPhoto}` as any);
            }}
          >
            <Text style={styles.messageButtonText}>{t('message')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FF8D57', '#EA9B76', '#F8EDE7']} locations={[0, 0.05, 0.25]} style={StyleSheet.absoluteFillObject} />
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
          <TouchableOpacity style={styles.addMoreButtonIcon} activeOpacity={0.85} onPress={() => router.push('/home' as any)}>
            <Ionicons name="person-add" size={20} color="#F25C05" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {renderTabButton('followers', t('followers'), followers.length)}
            {renderTabButton('following', t('following'), following.length)}
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchByName')}
            placeholderTextColor="#94A3B8"
            value={activeTab === 'followers' ? followersSearch : followingSearch}
            onChangeText={activeTab === 'followers' ? setFollowersSearch : setFollowingSearch}
            autoCapitalize="none"
          />
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
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredUsers.length ? (
                filteredUsers.map((item, index) => renderUserCard(item, index === filteredUsers.length - 1))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="people" size={40} color="#FDBA74" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {activeSearch.trim()
                      ? t('noFound')
                      : activeTab === 'followers' ? t('noFollowersYet') : t('noFollowingYet')}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {activeSearch.trim()
                      ? t('noFound')
                      : activeTab === 'followers'
                        ? t('whenPeopleFollow')
                        : t('discoverPeople')}
                  </Text>
                </View>
              )}

              {activeTab === 'followers' && suggestedUsers.length > 0 && !activeSearch.trim() && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>{t('suggested')}</Text>
                  {suggestedUsers.map((item, index) => renderUserCard(item, index === suggestedUsers.length - 1))}
                </View>
              )}
            </ScrollView>
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
    backgroundColor: '#FFF4EE', // Beige background
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
  suggestionsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFD7C2',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F25C05',
    marginBottom: 16,
    marginLeft: 4,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 0,
  },
  lastUserCard: {
    marginBottom: 0,
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
  followingButton: {
    backgroundColor: '#FFF4EE',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#F25C05',
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
  emptyAction: {
    marginTop: 24,
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F25C05',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F25C05',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
