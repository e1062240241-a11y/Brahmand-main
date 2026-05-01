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
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { followUser, getUserProfile, unfollowUser } from '../src/services/api';

type ConnectionTab = 'followers' | 'following';

interface ConnectionUser {
  id: string;
  name?: string;
  sl_id?: string;
  photo?: string;
}

const loadUsersByIds = async (ids: string[]): Promise<ConnectionUser[]> => {
  if (!ids.length) {
    return [];
  }

  const responses = await Promise.allSettled(ids.map((id) => getUserProfile(id)));

  return responses
    .map((result) => (result.status === 'fulfilled' ? result.value.data : null))
    .filter((item): item is ConnectionUser => Boolean(item?.id));
};

export default function FollowConnectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; userId?: string }>();
  const initialTab: ConnectionTab = params.tab === 'following' ? 'following' : 'followers';
  const targetUserId = typeof params.userId === 'string' && params.userId.trim().length ? params.userId : undefined;
  const { user, updateUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ConnectionTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [usersById, setUsersById] = useState<Record<string, ConnectionUser>>({});
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [profileFollowingIds, setProfileFollowingIds] = useState<string[]>([]);
  const [viewerFollowingIds, setViewerFollowingIds] = useState<string[]>([]);
  const [followersSearch, setFollowersSearch] = useState('');
  const [followingSearch, setFollowingSearch] = useState('');
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(18)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const listTranslateY = useRef(new Animated.Value(0)).current;

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

    const loadConnections = async () => {
      setLoading(true);

      try {
        const [profileResponse, viewerResponse] = await Promise.all([
          getUserProfile(targetUserId),
          getUserProfile(),
        ]);

        const profile = profileResponse.data || {};
        const viewerProfile = viewerResponse.data || {};
        const followerIds = Array.isArray(profile.followers) ? profile.followers : [];
        const followingIds = Array.isArray(profile.following) ? profile.following : [];
        const viewerFollowing = Array.isArray(viewerProfile.following) ? viewerProfile.following : [];

        const [followerUsers, followingUsers] = await Promise.all([
          loadUsersByIds(followerIds),
          loadUsersByIds(followingIds),
        ]);

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
      } catch (error) {
        console.warn('Failed to load follower/following users:', error);
        if (isMounted) {
          setUsersById({});
          setFollowerIds([]);
          setProfileFollowingIds([]);
          setViewerFollowingIds([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadConnections();

    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

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
        <Text style={[styles.tabCount, isActive && styles.activeTabCount]}>{count}</Text>
      </TouchableOpacity>
    );
  };

  const handleToggleFollow = async (targetUserId: string) => {
    const isFollowing = viewerFollowingIds.includes(targetUserId);
    const targetUser = usersById[targetUserId];
    const nextFollowingIds = isFollowing
      ? viewerFollowingIds.filter((id) => id !== targetUserId)
      : [...viewerFollowingIds, targetUserId];

    setPendingUserIds((current) => [...current, targetUserId]);
    setViewerFollowingIds(nextFollowingIds);
    if (targetUser) {
      setUsersById((current) => ({ ...current, [targetUserId]: targetUser }));
    }
    updateUser({ following: nextFollowingIds } as any);

    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    } catch (error) {
      console.warn('Failed to update follow state:', error);
      setViewerFollowingIds(viewerFollowingIds);
      updateUser({ following: viewerFollowingIds } as any);
    } finally {
      setPendingUserIds((current) => current.filter((id) => id !== targetUserId));
    }
  };

  useEffect(() => {
    listOpacity.setValue(0.82);
    listTranslateY.setValue(10);

    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(listTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, followersSearch, followingSearch, followerIds.length, profileFollowingIds.length, listOpacity, listTranslateY]);

  const handleBackPress = () => {
    router.replace('/profile' as any);
  };

  const totalConnections = new Set([...followerIds, ...profileFollowingIds]).size;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View
        style={[
          styles.screenContent,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={25} color="#111544" />
          </TouchableOpacity>
          <View style={styles.headerAvatarWrap}>
            <Avatar name={user?.name || 'User'} photo={user?.photo} size={48} />
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{Math.min(totalConnections, 9)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>{targetUserId ? 'User friends' : 'Your friends'}</Text>
          <Text style={styles.headerSubtitle}>{totalConnections} available</Text>
        </View>

        <View style={styles.tabBar}>
          {renderTabButton('followers', 'Followers', followerIds.length)}
          {renderTabButton('following', 'Following', profileFollowingIds.length)}
          <TouchableOpacity style={styles.addMoreButton} activeOpacity={0.85} onPress={() => router.push('/home' as any)}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addMoreText}>ADD MORE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={22} color="#AAA8BA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by names and numbers"
            placeholderTextColor="#B8B6C8"
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
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={filteredUsers.length ? styles.listContent : styles.emptyContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredUsers.length ? (
                filteredUsers.map((item) => (
                  <View key={item.id} style={styles.userCard}>
                    <TouchableOpacity
                      style={styles.userInfoButton}
                      activeOpacity={0.85}
                      onPress={() => router.push(`/profile/${item.id}`)}
                    >
                      <Avatar name={item.name || 'User'} photo={item.photo} size={52} />
                      <View style={styles.userText}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
                          {mutualIdsSet.has(item.id) && (
                            <View style={styles.mutualBadge}>
                              <Text style={styles.mutualBadgeText}>Mutual</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userMeta}>{item.sl_id || 'Sanatan Lok user'}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        viewerFollowingIds.includes(item.id) && styles.followingButton,
                        pendingUserIds.includes(item.id) && styles.disabledButton,
                      ]}
                      activeOpacity={0.85}
                      disabled={pendingUserIds.includes(item.id) || item.id === user?.id}
                      onPress={() => handleToggleFollow(item.id)}
                    >
                      {pendingUserIds.includes(item.id) ? (
                        <ActivityIndicator
                          size="small"
                          color={viewerFollowingIds.includes(item.id) ? COLORS.primary : COLORS.textWhite}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.followButtonText,
                            viewerFollowingIds.includes(item.id) && styles.followingButtonText,
                          ]}
                        >
                          {viewerFollowingIds.includes(item.id) ? 'Following' : 'Follow'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={34} color={COLORS.textLight} />
                  <Text style={styles.emptyTitle}>
                    {activeSearch.trim()
                      ? `No ${activeTab} found`
                      : `No ${activeTab} yet`}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {activeSearch.trim()
                      ? 'Try another name or SL ID.'
                      : activeTab === 'followers'
                        ? 'Users who follow you will appear here.'
                        : 'Users you follow will appear here.'}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>
        {!loading && filteredUsers.length > 0 ? (
          <View style={styles.alphaRail} pointerEvents="none">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
              <Text key={letter} style={styles.alphaLetter}>{letter}</Text>
            ))}
          </View>
        ) : null}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContent: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerBadge: {
    position: 'absolute',
    right: -2,
    top: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3355',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  titleBlock: {
    paddingHorizontal: 22,
    paddingBottom: 26,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: '#101445',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: '#B0ADBF',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F0F6',
  },
  tabButton: {
    flex: 1,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 4,
    borderBottomColor: '#536BFF',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#A9A6B8',
  },
  activeTabLabel: {
    color: '#101445',
  },
  tabCount: {
    display: 'none',
  },
  activeTabCount: {
    color: '#536BFF',
  },
  addMoreButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#536BFF',
    shadowColor: '#536BFF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  addMoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FBFAFD',
    borderWidth: 1,
    borderColor: '#EFEDF4',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#101445',
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
    marginTop: 22,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 10,
    paddingRight: 34,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F6',
    backgroundColor: '#FFFFFF',
  },
  userInfoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  userText: {
    flex: 1,
    marginLeft: 16,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#171B55',
  },
  mutualBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#EEF1FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  mutualBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#536BFF',
  },
  userMeta: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: '#A9A6B8',
  },
  followButton: {
    minWidth: 94,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#536BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#536BFF',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#536BFF',
  },
  disabledButton: {
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: '700',
    color: '#101445',
  },
  emptySubtitle: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  alphaRail: {
    position: 'absolute',
    right: 10,
    top: 285,
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alphaLetter: {
    color: '#C5C2D0',
    fontSize: 13,
    fontWeight: '900',
  },
});
