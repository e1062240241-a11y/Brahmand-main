import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile, followUser, unfollowUser, getUserPosts, viewPost } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const UserProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const profileUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [activeTab, setActiveTab] = useState('grid');

  const openPostModal = (post: any) => {
    if (!post?.id) return;
    setSelectedPost(post);
    setPostModalVisible(true);
    try {
      viewPost(post.id);
    } catch (e) {}
  };

  const loadProfile = useCallback(async (showLoading = true) => {
    if (!profileUserId) return;
    if (showLoading) setLoading(true);
    try {
      const response = await getUserProfile(profileUserId);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load user profile', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [profileUserId]);

  const loadPosts = useCallback(async (reset = false) => {
    if (!profileUserId || (postsLoading && !reset)) return;

    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setPostsLoading(true);
      setHasMore(true);
    }

    try {
      const response = await getUserPosts(profileUserId, LIMIT, currentOffset);
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : (payload?.items || []);
      
      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      const totalCount = payload?.total_count || items.length;
      setTotalPosts(totalCount);
      setOffset(currentOffset + items.length);
      setHasMore(payload?.has_more ?? (items.length === LIMIT));
    } catch (error) {
      console.warn('Failed to load user posts:', error);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  }, [profileUserId, offset, postsLoading]);

  useEffect(() => {
    loadProfile(true);
    loadPosts(true);
  }, [profileUserId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile(false);
    loadPosts(true);
  }, [loadProfile, loadPosts]);

  const isFollowing = Boolean(profile?.followers?.includes(currentUserId));

  const toggleFollow = async () => {
    if (!profile?.id || !currentUserId) return;

    // Optimistic Update
    const currentFollowers = Array.isArray(profile.followers) ? profile.followers : [];
    const isNowFollowing = !isFollowing;
    
    const nextFollowers = isNowFollowing
      ? [...currentFollowers, currentUserId]
      : currentFollowers.filter((id: string) => id !== currentUserId);

    setProfile(prev => ({
      ...prev,
      followers: nextFollowers,
      followers_count: (prev.followers_count || 0) + (isNowFollowing ? 1 : -1)
    }));

    try {
      if (isNowFollowing) {
        await followUser(profile.id);
      } else {
        await unfollowUser(profile.id);
      }
    } catch (error) {
      console.warn('Failed to follow/unfollow user:', error);
      // Revert on error
      loadProfile(false);
    }
  };

  const openPrivateChat = () => {
    if (!profile?.id || profile?.id === currentUserId) return;
    const userName = encodeURIComponent(profile.name || '');
    const userSL = encodeURIComponent(profile.sl_id || '');
    router.push(`/dm/new?userId=${profile.id}&userName=${userName}&userSL=${userSL}`);
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
          onPress={() => profile?.photo && setAvatarModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.avatar} />
            ) : (
              <Avatar name={profile?.name || 'User'} size={86} />
            )}
            {profile?.id !== currentUserId && isFollowing && (
              <View style={styles.followingIndicator}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers', userId: profile?.id } })}
          >
            <Text style={styles.statValue}>{profile?.followers_count ?? (profile?.followers?.length || 0)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following', userId: profile?.id } })}
          >
            <Text style={styles.statValue}>{profile?.following_count ?? (profile?.following?.length || 0)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profile?.name || 'User'}</Text>
          {profile?.is_verified && (
            <Ionicons name="checkmark-circle" size={16} color="#0095f6" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={styles.slId}>@{profile?.sl_id || ''}</Text>
        {profile?.bio ? (
          <Text style={styles.bioText}>{profile.bio}</Text>
        ) : null}
        
        {profile?.home_location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {profile.home_location.city}, {profile.home_location.state}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        {profile?.id === currentUserId ? (
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={openPrivateChat}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Simple Grid Divider */}
      <View style={styles.gridDivider} />
    </View>
  );

  if (!profileUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Invalid profile selected.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{profile?.sl_id || 'Profile'}</Text>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
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

      {/* Avatar Modal */}
      <Modal visible={avatarModalVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setAvatarModalVisible(false)}
        >
          <Image source={{ uri: profile?.photo }} style={styles.fullImage} resizeMode="contain" />
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
              />
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  navIcon: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
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
  followingIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.success,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  followButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#0095f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#efefef',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: COLORS.text,
  },
  messageButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#efefef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
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
  gridDivider: {
    height: 1,
    backgroundColor: '#DBDBDB',
    marginTop: 8,
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.2, // Slightly taller for more visual impact
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    color: COLORS.error,
    fontSize: 16,
  },
  backButton: {
    padding: 4,
  }
});

export default UserProfileScreen;
