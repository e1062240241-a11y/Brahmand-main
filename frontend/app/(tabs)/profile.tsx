import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  RefreshControl,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getUserPosts, getUserProfile } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

type SettingItem = {
  id: string;
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
  subLabel?: string;
  value?: string;
  action?: 'logout';
};

const SETTINGS_SECTIONS: { id: string; title: string; items: SettingItem[] }[] = [
  {
    id: 'account',
    title: 'Account',
    items: [
      { id: 'edit', icon: 'person-circle-outline', label: 'Manage Profile', route: '/profile/edit' },
      { id: 'kyc', icon: 'id-card-outline', label: 'KYC Verification', route: '/kyc' },
      { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', route: '/settings/notifications' },
      { id: 'privacy', icon: 'lock-closed-outline', label: 'Privacy', route: '/settings/privacy', disabled: true, subLabel: 'Coming soon' },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    items: [
      { id: 'about', icon: 'information-circle-outline', label: 'About Us', route: '/settings/guidelines' },
      { id: 'location', icon: 'location-outline', label: 'Location', route: '/settings/location', disabled: true, subLabel: 'Coming soon' },
      { id: 'language', icon: 'language-outline', label: 'Language', value: 'English', disabled: true },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    items: [
      { id: 'guidelines', icon: 'document-text-outline', label: 'Community Guidelines', route: '/settings/guidelines' },
      { id: 'logout', icon: 'log-out-outline', label: 'Logout', action: 'logout' },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const userId = user?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [showMyPostsModal, setShowMyPostsModal] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(Array.isArray((user as any)?.followers) ? (user as any).followers.length : 0);
  const [followingCount, setFollowingCount] = useState(Array.isArray((user as any)?.following) ? (user as any).following.length : 0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getUserProfile();
      const nextProfile = res.data || {};
      setProfile(nextProfile);
      setFollowersCount(Array.isArray(nextProfile.followers) ? nextProfile.followers.length : 0);
      setFollowingCount(Array.isArray(nextProfile.following) ? nextProfile.following.length : 0);
      updateUser(nextProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error?.response?.status === 401 || error?.response?.status === 502) {
        await logout();
        router.replace('/');
      }
    } finally {
      setRefreshing(false);
    }
  }, [logout, router, updateUser]);

  useEffect(() => {
    if (!userId) {
      router.replace('/');
      return;
    }
    fetchProfile();
  }, [fetchProfile, router, userId]);

  useEffect(() => {
    const loadPostsCount = async () => {
      if (!userId) return;
      try {
        const res = await getUserPosts(userId, 50, 0);
        const payload = res.data;
        const items = Array.isArray(payload) ? payload : (payload?.items || []);
        setMyPosts(items);
        setPostsCount(items.length);
      } catch (error) {
        console.warn('Failed to load settings posts count:', error);
      }
    };

    loadPostsCount();
  }, [userId]);

  const handleMenuPress = (item: SettingItem) => {
    if (item.disabled) {
      return;
    }
    if (item.action === 'logout') {
      handleLogout();
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const performLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      performLogout();
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
          performLogout();
        } },
      ]
    );
  };

const displayUser = profile || user;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onScroll={onScroll}
      scrollEventThrottle={1}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} />
      }
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      <Animated.View style={[
          styles.profileCard,
          {
            transform: [
              { scale: scrollY.interpolate({
                inputRange: [-100, 0, 34],
                outputRange: [1.04, 1, 0.92],
                extrapolate: 'clamp',
              })},
            ],
          },
        ]}>
        <Animated.View style={[
          styles.profileAvatarWrap,
          {
            marginRight: scrollY.interpolate({
              inputRange: [0, 34],
              outputRange: [0, SPACING.sm],
              extrapolate: 'clamp',
            }),
            marginBottom: scrollY.interpolate({
              inputRange: [0, 34],
              outputRange: [SPACING.md, 0],
              extrapolate: 'clamp',
            }),
          },
        ]}>
          {displayUser?.photo ? (
            <Animated.Image
              source={{ uri: displayUser.photo }}
              style={[
                styles.profileAvatar,
                {
                  width: scrollY.interpolate({
                    inputRange: [0, 34],
                    outputRange: [96, 56],
                    extrapolate: 'clamp',
                  }),
                  height: scrollY.interpolate({
                    inputRange: [0, 34],
                    outputRange: [96, 56],
                    extrapolate: 'clamp',
                  }),
                  borderRadius: scrollY.interpolate({
                    inputRange: [0, 34],
                    outputRange: [48, 28],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ) : (
            <Avatar 
              name={displayUser?.name || 'User'} 
              size={56} 
            />
          )}
        </Animated.View>
        <View style={styles.profileTextWrap}>
          <View style={styles.profileNameRow}>
            <Animated.Text style={[
              styles.profileName,
              {
                fontSize: scrollY.interpolate({
                  inputRange: [0, 34],
                  outputRange: [24, 18],
                  extrapolate: 'clamp',
                }),
              },
            ]}>
              {displayUser?.name || 'User'}
            </Animated.Text>
            {displayUser?.is_verified && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
          </View>
          <Animated.Text style={[
            styles.profileSubText,
            {
              fontSize: scrollY.interpolate({
                inputRange: [0, 34],
                outputRange: [15, 13],
                extrapolate: 'clamp',
              }),
},
            ]}>
            <Text style={styles.slIdText}>
              {displayUser?.sl_id || ''}
            </Text>
          </Animated.Text>
        </View>
      </Animated.View>

      <View style={styles.statsStrip}>
        <TouchableOpacity style={styles.statItemCompact} activeOpacity={0.8} onPress={() => setShowMyPostsModal(true)}>
          <Text style={styles.statValueCompact}>{postsCount}</Text>
          <Text style={styles.statLabelCompact}>Posts</Text>
        </TouchableOpacity>
        <View style={styles.statsStripDivider} />
        <TouchableOpacity
          style={styles.statItemCompact}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })}
        >
          <Text style={styles.statValueCompact}>{followersCount}</Text>
          <Text style={styles.statLabelCompact}>Followers</Text>
        </TouchableOpacity>
        <View style={styles.statsStripDivider} />
        <TouchableOpacity
          style={styles.statItemCompact}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following' } })}
        >
          <Text style={styles.statValueCompact}>{followingCount}</Text>
          <Text style={styles.statLabelCompact}>Following</Text>
        </TouchableOpacity>
      </View>

      {SETTINGS_SECTIONS.map((section) => (
        <View key={section.id} style={styles.settingsSection}>
          <Text style={styles.sectionLabel}>{section.title}</Text>
          <View style={styles.settingsCard}>
            {section.items.map((item, index) => {
              const isLast = index === section.items.length - 1;
              const isLogout = item.action === 'logout';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingsRow,
                    !isLast && styles.settingsRowDivider,
                    item.disabled && styles.settingsRowDisabled,
                  ]}
                  activeOpacity={item.disabled ? 1 : 0.7}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.settingsRowLeft}>
                    <View style={styles.settingsIconWrap}>
                      <Ionicons
                        name={item.icon as any}
                        size={19}
                        color={isLogout ? COLORS.error : COLORS.textSecondary}
                      />
                    </View>
                    <View style={styles.settingsLabelWrap}>
                      <Text style={[styles.settingsLabel, isLogout && styles.settingsLabelLogout]}>{item.label}</Text>
                      {item.subLabel ? <Text style={styles.settingsSubLabel}>{item.subLabel}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.settingsRowRight}>
                    {item.value ? <Text style={styles.settingsValue}>{item.value}</Text> : null}
                    {!item.disabled && <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <Modal visible={showMyPostsModal} transparent animationType="slide" onRequestClose={() => setShowMyPostsModal(false)}>
        <View style={styles.myPostsOverlay}>
          <View style={styles.myPostsSheet}>
            <View style={styles.myPostsHeader}>
              <Text style={styles.myPostsTitle}>My Posts ({postsCount})</Text>
              <TouchableOpacity onPress={() => setShowMyPostsModal(false)} style={styles.myPostsCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.myPostsContent}>
              {myPosts.length > 0 ? (
                myPosts.map((post) => (
                  <PostFeedCard
                    key={`settings-post-${post.id || post.media_url}`}
                    post={post}
                    onUserPress={() => {}}
                    postMenuType="delete"
                  />
                ))
              ) : (
                <Text style={styles.myPostsEmptyText}>You have not uploaded posts yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: `${COLORS.primary}08`,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  profileCardCollapsed: {
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    borderRadius: 16,
  },
  statsStrip: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  statItemCompact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  statValueCompact: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabelCompact: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statsStripDivider: {
    width: 1,
    height: 28,
    backgroundColor: `${COLORS.primary}25`,
  },
  profileAvatarWrap: {
    marginRight: 0,
    marginBottom: SPACING.md,
  },
  profileAvatarWrapCollapsed: {
    marginRight: SPACING.sm,
    marginBottom: 0,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileAvatarExpanded: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileTextWrap: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  profileTextWrapCollapsed: {
    flex: 1,
    alignItems: 'flex-start',
    width: 'auto',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameRowCollapsed: {
    justifyContent: 'flex-start',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  profileNameCollapsed: {
    fontSize: 18,
    textAlign: 'left',
  },
  profileSubText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  profileSubTextCollapsed: {
    fontSize: 13,
    textAlign: 'left',
    marginTop: 2,
  },
  slIdText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  settingsSection: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  settingsRow: {
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  settingsRowDisabled: {
    opacity: 0.75,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconWrap: {
    width: 28,
    alignItems: 'center',
    marginRight: SPACING.sm,
    backgroundColor: `${COLORS.primary}12`,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
  },
  settingsLabelWrap: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingsLabelLogout: {
    color: COLORS.error,
  },
  settingsSubLabel: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  settingsValue: {
    fontSize: 13,
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  myPostsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  myPostsSheet: {
    height: '85%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: SPACING.md,
  },
  myPostsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  myPostsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  myPostsCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
  },
  myPostsContent: {
    paddingBottom: SPACING.xl,
  },
  myPostsEmptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 8,
  },
  astrologyCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  astrologyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  astrologyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  astrologyCardContent: {
    flex: 1,
  },
  astrologyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  astrologySubtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  astrologyBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  astrologyBadgeReady: {
    backgroundColor: `${COLORS.success}15`,
  },
  astrologyBadgePending: {
    backgroundColor: `${COLORS.warning}18`,
  },
  astrologyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  astrologyBadgeTextReady: {
    color: COLORS.success,
  },
  astrologyBadgeTextPending: {
    color: COLORS.warning,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  menuLabelContainer: {
    flex: 1,
  },
  menuSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuItemDisabled: {
    backgroundColor: `${COLORS.divider}15`,
  },
  guidelinesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  guidelinesText: {
    fontSize: 14,
    color: COLORS.info,
    marginLeft: SPACING.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  // Lok Sangam Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  lockedText: {
    fontSize: 13,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xl,
  },
});
