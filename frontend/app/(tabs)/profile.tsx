import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Modal, 
  Dimensions, 
  FlatList,
  RefreshControl,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getUserPosts, getUserProfile, viewPost } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

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

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const LIMIT = 30;

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');

  const fetchProfile = useCallback(async (showLoading = true) => {
    if (!userId) return;
    if (showLoading) setLoading(true);
    try {
      const res = await getUserProfile();
      const nextProfile = res.data || {};
      setProfile(nextProfile);
      updateUser(nextProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error?.response?.status === 401 || error?.response?.status === 502) {
        await logout();
        router.replace('/');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, router, updateUser, userId]);

  const loadPosts = useCallback(async (reset = false) => {
    if (!userId || (postsLoading && !reset)) return;

    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setPostsLoading(true);
      setHasMore(true);
    }

    try {
      const response = await getUserPosts(userId, LIMIT, currentOffset);
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : (payload?.items || []);
      
      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      const totalCount = payload?.total_count || items.length;
      setPostsCount(totalCount);
      setOffset(currentOffset + items.length);
      setHasMore(payload?.has_more ?? (items.length === LIMIT));
    } catch (error) {
      console.warn('Failed to load user posts:', error);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  }, [userId, offset, postsLoading]);

  useEffect(() => {
    fetchProfile(true);
    loadPosts(true);
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(false);
    loadPosts(true);
  }, [fetchProfile, loadPosts]);

  const handleMenuPress = (item: SettingItem) => {
    setShowSettingsModal(false);
    if (item.disabled) return;
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
        { text: 'Logout', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  const openPostModal = (post: any) => {
    if (!post?.id) return;
    setSelectedPost(post);
    setPostModalVisible(true);
    try {
      viewPost(post.id);
    } catch (e) {}
  };

  const renderPost = ({ item }: { item: any }) => {
    const isVideo = (item.media_url || '').match(/\.(mp4|mov|avi)$/i) || (item.media_type === 'video');
    const displayUrl = item.thumbnail_url || item.image_url || (!isVideo ? item.media_url : null);
    const views = item.views_count || 0;

    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.9}
        onPress={() => openPostModal(item)}
      >
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name={isVideo ? "videocam" : "image-outline"} size={24} color={COLORS.textLight} />
          </View>
        )}

        {/* View Count Overlay */}
        <View style={styles.gridOverlay}>
          <View style={styles.viewCountBadge}>
            <Ionicons name="play" size={10} color="#FFF" />
            <Text style={styles.viewCountText}>{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</Text>
          </View>
        </View>

        {isVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={14} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContent}>
      {/* Profile Header: Avatar and Stats */}
      <View style={styles.profileHeaderRow}>
        <TouchableOpacity 
          onPress={() => (profile?.photo || user?.photo) && setAvatarModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {(profile?.photo || user?.photo) ? (
              <Image source={{ uri: profile?.photo || user?.photo }} style={styles.avatar} />
            ) : (
              <Avatar name={profile?.name || user?.name || 'User'} size={86} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })}
          >
            <Text style={styles.statValue}>{profile?.followers_count ?? (Array.isArray(profile?.followers) ? profile.followers.length : 0)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following' } })}
          >
            <Text style={styles.statValue}>{profile?.following_count ?? (Array.isArray(profile?.following) ? profile.following.length : 0)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profile?.name || user?.name || 'User'}</Text>
          {(profile?.is_verified || user?.is_verified) && (
            <Ionicons name="checkmark-circle" size={16} color="#0095f6" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={styles.slId}>@{profile?.sl_id || user?.sl_id || ''}</Text>
        {(profile?.bio || user?.bio) ? (
          <Text style={styles.bioText}>{profile?.bio || user?.bio}</Text>
        ) : null}
        
        {(profile?.home_location || user?.home_location) && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {(profile?.home_location || user?.home_location).city}, {(profile?.home_location || user?.home_location).state}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.shareProfileButton}
          onPress={() => Alert.alert('Coming Soon', 'Share profile functionality is coming soon!')}
        >
          <Text style={styles.shareProfileText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Simple Grid Divider */}
      <View style={styles.gridDivider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header Bar */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.text} />
          <Text style={styles.navTitle}>{profile?.sl_id || user?.sl_id || 'Profile'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.text} />
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIcon}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIcon} onPress={() => setShowSettingsModal(true)}>
            <Ionicons name="menu-outline" size={30} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item.id ? `post-${item.id}` : `post-idx-${index}`}
        numColumns={3}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          postsLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.textLight} />
            </View>
          ) : !hasMore && posts.length > 0 ? (
            <View style={styles.endOfFeed}>
              <Text style={styles.endOfFeedText}>You've reached the end</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !postsLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="camera-outline" size={40} color={COLORS.text} />
              </View>
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasMore && !postsLoading) {
            loadPosts();
          }
        }}
        onEndReachedThreshold={0.8}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textLight} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Settings Menu Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsSheet}>
            <View style={styles.settingsHeader}>
              <View style={styles.settingsHeaderBar} />
              <Text style={styles.settingsTitle}>Settings and privacy</Text>
              <TouchableOpacity style={styles.settingsClose} onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SETTINGS_SECTIONS.map((section) => (
                <View key={section.id} style={styles.settingsSection}>
                  <Text style={styles.sectionLabel}>{section.title}</Text>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.settingsRow, item.disabled && styles.settingsRowDisabled]}
                      onPress={() => handleMenuPress(item)}
                    >
                      <Ionicons name={item.icon as any} size={22} color={item.action === 'logout' ? COLORS.error : COLORS.text} />
                      <View style={styles.settingsLabelWrap}>
                        <Text style={[styles.settingsLabel, item.action === 'logout' && { color: COLORS.error }]}>{item.label}</Text>
                        {item.subLabel ? <Text style={styles.settingsSubLabel}>{item.subLabel}</Text> : null}
                      </View>
                      <View style={styles.settingsRowRight}>
                        {item.value ? <Text style={styles.settingsValue}>{item.value}</Text> : null}
                        {!item.disabled && <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Avatar Modal */}
      <Modal visible={avatarModalVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setAvatarModalVisible(false)}
        >
          <Image source={{ uri: profile?.photo || user?.photo }} style={styles.fullImage} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>

      {/* Post Detail Modal */}
      <Modal visible={postModalVisible} animationType="slide">
        <View style={styles.postDetailContainer}>
          <View style={styles.postDetailHeader}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.postDetailTitle}>Posts</Text>
          </View>
          <FlatList
            data={[selectedPost]}
            renderItem={({ item }) => (
              <PostFeedCard
                post={item}
                isActive={postModalVisible}
                onUserPress={() => setPostModalVisible(false)}
                postMenuType="delete"
              />
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  navBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIcon: {
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerContent: {
    paddingBottom: 4,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  bioSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  slId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#00376b',
    marginLeft: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  editProfileButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#efefef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  shareProfileButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#efefef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareProfileText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  gridDivider: {
    height: 1,
    backgroundColor: '#DBDBDB',
    marginTop: 8,
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.2,
    padding: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-end',
    padding: 6,
  },
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  viewCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#efefef',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#efefef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footerLoader: {
    paddingVertical: 20,
  },
  endOfFeed: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  endOfFeedText: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 12,
  },
  settingsHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  settingsHeaderBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DBDBDB',
    borderRadius: 2,
    marginBottom: 12,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  settingsClose: {
    position: 'absolute',
    right: 16,
    top: 0,
  },
  settingsSection: {
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingsRowDisabled: {
    opacity: 0.5,
  },
  settingsLabelWrap: {
    flex: 1,
    marginLeft: 12,
  },
  settingsLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingsSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bottomSpacer: {
    height: 40,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  postDetailContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  postDetailHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  postDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  backButton: {
    padding: 4,
  }
});

