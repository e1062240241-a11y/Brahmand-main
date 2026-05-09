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
  ScrollView,
  TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getUserPosts, getUserProfile, viewPost } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { 
  getCulturalCommunities, 
  getUserCulturalCommunity, 
  updateUserCulturalCommunity 
} from '../../src/services/api';

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const userId = user?.id;

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
        { id: 'culture', icon: 'people-outline', label: 'My Culture Group', value: user?.cultural_community || 'Not set' },
        { id: 'logout', icon: 'log-out-outline', label: 'Logout', action: 'logout' },
      ],
    },
  ];

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
  
  // Cultural Group states
  const [showCGModal, setShowCGModal] = useState(false);
  const [cgSearch, setCGSearch] = useState('');
  const [cgList, setCGList] = useState<string[]>([]);
  const [cgLoading, setCGLoading] = useState(false);
  const [userCG, setUserCG] = useState<{ cultural_community: string | null; change_count: number; is_locked: boolean } | null>(null);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  }, []);

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
      setProfile(user || null);
      showToast('Failed to load profile. Check backend at localhost:8081.');
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
    if (item.id === 'culture') {
      handleOpenCGModal();
      return;
    }
    
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

  const fetchUserCG = async () => {
    try {
      const res = await getUserCulturalCommunity();
      setUserCG(res.data);
    } catch (error) {
      console.warn('Failed to fetch user CG:', error);
    }
  };

  const fetchCGList = async (search = '') => {
    setCGLoading(true);
    try {
      const res = await getCulturalCommunities(search);
      // Filter out any duplicates to avoid key collisions
      const uniqueList = Array.from(new Set(res.data || []));
      setCGList(uniqueList as string[]);
    } catch (error) {
      console.warn('Failed to fetch culture groups:', error);
    } finally {
      setCGLoading(false);
    }
  };

  const handleOpenCGModal = () => {
    fetchCGList();
    fetchUserCG();
    setShowCGModal(true);
  };

  const handleSelectCG = async (community: string) => {
    if (userCG?.is_locked) {
      Alert.alert('Locked', 'You can only change your culture group once. It is now locked.');
      return;
    }

    if (userCG?.cultural_community === community) {
      showToast('You are already in this culture group.');
      setShowCGModal(false);
      return;
    }

    try {
      await updateUserCulturalCommunity(community);
      await fetchUserCG();
      // Update local auth store so the UI updates immediately
      if (user) {
        updateUser({ ...user, cultural_community: community });
      }
      setShowCGModal(false);
      showToast('Culture group updated!');
    } catch (error: any) {
      console.error('Error updating culture group:', error);
      if (error.response?.data) {
        console.log('Error data:', error.response.data);
      }
      const msg = error.response?.data?.detail || error.message || 'Failed to update';
      showToast(msg);
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
      {/* Background Cover */}
      <Image 
        source={{ uri: profile?.photo || user?.photo || 'https://images.unsplash.com/photo-1544365558-35aa4afcf11f?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.coverImage} 
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', '#000']}
        locations={[0, 0.5, 1]}
        style={styles.coverGradient}
      />

      <View style={[styles.profileTopSpacing, { paddingTop: (insets.top || 40) + 40 }]} />

      {/* Avatar Centered */}
      <View style={styles.centeredProfile}>
        <TouchableOpacity 
          onPress={() => (profile?.photo || user?.photo) && setAvatarModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainerCenter}>
            {(profile?.photo || user?.photo) ? (
              <Image source={{ uri: profile?.photo || user?.photo }} style={styles.avatarLarge} />
            ) : (
              <Avatar name={profile?.name || user?.name || 'User'} size={100} />
            )}
            <View style={styles.onlineDot} />
          </View>
        </TouchableOpacity>

        <View style={styles.nameRowCenter}>
          <Text style={styles.displayNameCenter}>{profile?.name || user?.name || 'Virral Patel'}</Text>
          <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginLeft: 6 }} />
        </View>

        <View style={styles.bioRow}>
          <Text style={styles.bioTextCenter}>{profile?.bio || user?.bio || 'Har Har Mahadev'}</Text>
          <Text style={styles.omIcon}> 🕉️</Text>
        </View>

        <View style={styles.locationContainerCenter}>
          <Ionicons name="location-outline" size={14} color="#FFF" />
          <Text style={styles.locationTextCenter}>
            {(profile?.home_location || user?.home_location)?.city || 'Mumbai'}, {(profile?.home_location || user?.home_location)?.state || 'Maharashtra'}
          </Text>
        </View>
      </View>

      {/* Stats Container */}
      <View style={styles.statsDarkCard}>
        <TouchableOpacity style={styles.statDarkItem} onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })}>
          <Ionicons name="trending-up" size={22} color="#FFF" />
          <Text style={styles.statDarkValue}>{profile?.followers_count ?? 808}</Text>
          <Text style={styles.statDarkLabel}>Followers</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />

        <TouchableOpacity style={styles.statDarkItem} onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following' } })}>
          <Ionicons name="people-outline" size={22} color="#FFF" />
          <Text style={styles.statDarkValue}>{profile?.following_count ?? 376}</Text>
          <Text style={styles.statDarkLabel}>Following</Text>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        <View style={styles.statDarkItem}>
          <Ionicons name="open-outline" size={22} color="#FFF" />
          <Text style={styles.statDarkValue}>{postsCount || 696}</Text>
          <Text style={styles.statDarkLabel}>Posts</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statDarkItem}>
          <Ionicons name="bookmark-outline" size={22} color="#FFF" />
          <Text style={styles.statDarkValue}>143</Text>
          <Text style={styles.statDarkLabel}>Saved</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsDarkRow}>
        <TouchableOpacity 
          style={styles.addPostButton}
          onPress={() => router.push('/post/create')}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addPostText}>Add Post</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shareIconButton}
          onPress={() => Alert.alert('Coming Soon', 'Share profile functionality is coming soon!')}
        >
          <Ionicons name="arrow-redo-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom Header Bar - Absolute Positioned */}
      <View style={[styles.navBarAbsolute, { paddingTop: insets.top || 10 }]}>
        <TouchableOpacity style={styles.navLeftAbsolute} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
          <Text style={styles.navTitleAbsolute}>{profile?.sl_id || user?.sl_id || 'virrallpatel'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navRightAbsolute} onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
        </TouchableOpacity>
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
                <Ionicons name="camera-outline" size={40} color="#FFF" />
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

      {/* Culture Group Modal */}
      <Modal visible={showCGModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cgModalContent}>
            <View style={styles.cgModalHeader}>
              <Text style={styles.cgModalTitle}>Select Culture Group</Text>
              <TouchableOpacity onPress={() => setShowCGModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cgSearchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.cgSearchInput}
                placeholder="Search culture groups..."
                placeholderTextColor={COLORS.textLight}
                value={cgSearch}
                onChangeText={(text) => {
                  setCGSearch(text);
                  fetchCGList(text);
                }}
              />
            </View>

            {cgLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={cgList}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.cgItem,
                      userCG?.cultural_community === item && styles.cgItemSelected,
                    ]}
                    onPress={() => handleSelectCG(item)}
                  >
                    <Text style={[
                      styles.cgItemText,
                      userCG?.cultural_community === item && styles.cgItemTextSelected,
                    ]}>
                      {item}
                    </Text>
                    {userCG?.cultural_community === item && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.cgList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No communities found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Toast Notice */}
      {toastVisible && (
        <View style={styles.toastContainer}>
          <View style={styles.toastContent}>
            <Ionicons name="information-circle" size={20} color="#FFF" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070707',
  },
  headerContent: {
    paddingBottom: 20,
    position: 'relative',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    resizeMode: 'cover',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  profileTopSpacing: {
    width: '100%',
  },
  centeredProfile: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainerCenter: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#000',
  },
  nameRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayNameCenter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  bioTextCenter: {
    fontSize: 15,
    color: '#E5E5E5',
    fontWeight: '500',
  },
  omIcon: {
    fontSize: 14,
  },
  locationContainerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationTextCenter: {
    fontSize: 13,
    color: '#D4D4D4',
    marginLeft: 4,
  },
  statsDarkCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20,20,20,0.6)',
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statDarkItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDarkValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  statDarkLabel: {
    fontSize: 11,
    color: '#A3A3A3',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonsDarkRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  addPostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    gap: 6,
  },
  addPostText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  shareIconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  navLeftAbsolute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navTitleAbsolute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  navRightAbsolute: {
    padding: 4,
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
    backgroundColor: '#1A1A1A',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
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
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
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
  },
  // CG Modal Styles
  cgModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: SPACING.lg,
  },
  cgModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cgModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  cgSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  cgSearchInput: {
    flex: 1,
    height: 44,
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
  },
  cgList: {
    flex: 1,
  },
  cgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cgItemSelected: {
    backgroundColor: `${COLORS.primary}05`,
  },
  cgItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cgItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SPACING.xl,
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

