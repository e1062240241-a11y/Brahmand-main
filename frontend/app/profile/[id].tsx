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
  Platform,
  Alert,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile, followUser, unfollowUser, getUserPosts, viewPost, deletePost, getPostComments, addPostComment } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { PostFeedCard } from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const UserProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const profileUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const detailFlatListRef = useRef<FlatList>(null);

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [50, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

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
  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [activeTab, setActiveTab] = useState('grid');
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  const openPostModal = (post: any) => {
    if (!post?.id) return;
    setSelectedPost(post);
    setPostModalVisible(true);
    try {
      viewPost(post.id);
    } catch (e) {}
  };

  const loadComments = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 200);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComment = async (post: any) => {
    const postId = post?.id;
    if (!postId) return;
    setSelectedCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);
    await loadComments(postId);
  };

  const handleSubmitComment = async () => {
    if (!selectedCommentPost?.id || !commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPost.id, commentText.trim());
      const serverComment = response.data?.comment || response.data;
      
      setCommentText('');
      Keyboard.dismiss();
      
      // Update top_comments in local state for outer preview
      setPosts(prev => prev.map(p => {
        if (p.id === selectedCommentPost.id) {
          const currentTop = Array.isArray(p.top_comments) ? p.top_comments : [];
          return {
            ...p,
            comments_count: (Number(p.comments_count) || 0) + 1,
            top_comments: [serverComment, ...currentTop].slice(0, 2)
          };
        }
        return p;
      }));

      await loadComments(selectedCommentPost.id);
    } catch (error: any) {
      console.warn('Failed to submit comment:', error);
      const detail = error.response?.data?.detail || error.message;
      alert(detail || 'Unable to submit comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
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

  useEffect(() => {
    if (profile && profile.id && profile.id !== currentUserId) {
      saveToRecentSearches(profile);
    }
  }, [profile, currentUserId]);

  const saveToRecentSearches = async (userObj: any) => {
    try {
      const saved = await AsyncStorage.getItem('recent_searches');
      let recent = saved ? JSON.parse(saved) : [];
      // Profile structure might vary between search and profile, normalize
      const profileToSave = {
        id: userObj.id,
        name: userObj.name || userObj.username,
        photo: userObj.photo || userObj.user_photo,
        sl_id: userObj.sl_id,
        phone: userObj.phone
      };
      
      recent = [profileToSave, ...recent.filter((item: any) => item.id !== profileToSave.id)].slice(0, 4);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(recent));
    } catch (e) {
      console.warn('Failed to save visited profile to recent searches:', e);
    }
  };

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

  const handleDeletePost = (post: any) => {
    if (!post?.id) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              setPosts(prev => prev.filter(p => p.id !== post.id));
              setTotalPosts(prev => Math.max(0, prev - 1));
              setPostModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openPrivateChat = () => {
    if (!profile?.id || profile?.id === currentUserId) return;
    const userName = encodeURIComponent(profile.name || '');
    const userSL = encodeURIComponent(profile.sl_id || '');
    router.push(`/dm/new?userId=${profile.id}&userName=${userName}&userSL=${userSL}`);
  };

  const handleShareProfile = () => {
    setUserMenuVisible(false);
    // Open DM selection with pre-filled profile link
    router.push({
      pathname: '/dm/new',
      params: { 
        shareText: `Check out ${profile?.name || 'this user'} on Brahmand: @${profile?.sl_id}`
      }
    });
  };

  const handleReportUser = () => {
    setUserMenuVisible(false);
    Alert.alert('Report User', 'Thank you for reporting. Our moderation team will review this profile shortly.');
  };

  const handleBlockUser = () => {
    setUserMenuVisible(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${profile?.sl_id}? They will no longer be able to see your posts or message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => Alert.alert('Blocked', 'User has been blocked.') }
      ]
    );
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom Header Bar */}
      <View style={[styles.navBar, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFF', paddingTop: insets.top, height: 50 + insets.top }]}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home');
            }
          }} 
          style={styles.navIcon}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Animated.Text style={[styles.navTitle, { opacity: headerTitleOpacity }]}>
          {profile?.sl_id || 'Profile'}
        </Animated.Text>
        <TouchableOpacity style={styles.navIcon} onPress={() => setUserMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item.id ? `post-${item.id}` : `post-idx-${index}`}
        numColumns={3}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + 60 }}
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
          <View style={[styles.postDetailHeader, { paddingTop: insets.top, height: 50 + insets.top }]}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.postDetailTitle}>Posts</Text>
          </View>
          <FlatList
            ref={detailFlatListRef}
            data={posts}
            initialScrollIndex={posts.findIndex(p => p.id === selectedPost?.id) !== -1 ? posts.findIndex(p => p.id === selectedPost?.id) : 0}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH + 150, // Approx height of PostFeedCard with header/footer
              offset: (SCREEN_WIDTH + 150) * index,
              index,
            })}
            renderItem={({ item }) => (
              <PostFeedCard
                post={item}
                isActive={postModalVisible}
                onComment={handleOpenComment}
                openCommentsOnCaptionPress
                onUserPress={() => setPostModalVisible(false)}
                postMenuType={profile?.id === currentUserId ? 'delete' : undefined}
                onPostMenuPress={handleDeletePost}
                theme="dark"
                isBlackBackground
              />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      <Modal 
        visible={commentModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.commentModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity 
            style={styles.modalBackgroundDismiss} 
            activeOpacity={1} 
            onPress={() => setCommentModalVisible(false)} 
          />
          <View style={styles.commentModalSheet}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.commentCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.commentList}>
              {commentsLoading ? (
                <View style={styles.commentLoadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : postComments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color="#DDD" />
                  <Text style={styles.commentEmptyText}>No comments yet. Be the first to comment!</Text>
                </View>
              ) : (
                <FlatList
                  data={postComments}
                  keyExtractor={(item, index) => item.id ? `comment-${item.id}` : `comment-${index}`}
                  renderItem={({ item }) => (
                    <View style={styles.commentItem}>
                      <View style={styles.commentItemHeader}>
                        <Avatar photo={item.user_photo} name={item.username || 'User'} size={24} />
                        <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                      </View>
                      <MentionText style={styles.commentItemText} text={item?.text || ''} />
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
            <View style={styles.commentInputRow}>
              <MentionInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor={COLORS.textSecondary}
                inputStyle={styles.commentTextInput}
                multiline
              />
              <TouchableOpacity 
                onPress={handleSubmitComment} 
                style={[styles.commentSubmitBtn, (!commentText.trim() || commentSubmitting) && { opacity: 0.5 }]} 
                disabled={!commentText.trim() || commentSubmitting}
              >
                <Text style={styles.commentSubmitText}>{commentSubmitting ? '...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* User Options Modal */}
      <Modal
        visible={userMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserMenuVisible(false)}
      >
        <View style={styles.userMenuOverlay}>
          <TouchableOpacity 
            style={styles.userMenuBackground} 
            activeOpacity={1} 
            onPress={() => setUserMenuVisible(false)} 
          />
          <View style={styles.userMenuSheet}>
            <View style={styles.userMenuHandle} />
            
            <TouchableOpacity style={styles.userMenuItem} onPress={handleShareProfile}>
              <Ionicons name="share-social-outline" size={22} color={COLORS.text} />
              <Text style={styles.userMenuText}>Share this profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.userMenuItem} onPress={handleReportUser}>
              <Ionicons name="flag-outline" size={22} color={COLORS.error} />
              <Text style={[styles.userMenuText, { color: COLORS.error }]}>Report User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.userMenuItem} onPress={handleBlockUser}>
              <Ionicons name="ban-outline" size={22} color={COLORS.error} />
              <Text style={[styles.userMenuText, { color: COLORS.error }]}>Block User</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.userMenuItem, { borderBottomWidth: 0, marginTop: 10 }]} 
              onPress={() => setUserMenuVisible(false)}
            >
              <Text style={[styles.userMenuText, { textAlign: 'center', width: '100%', color: '#666' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
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
    marginBottom: 12,
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
    backgroundColor: '#000',
  },
  postDetailHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  postDetailTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentModalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  commentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  modalBackgroundDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  emptyCommentsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  commentCloseBtn: {
    padding: 8,
  },
  commentList: {
    flex: 1,
    marginBottom: 12,
  },
  commentLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  commentEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentItemUser: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  commentItemText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 100,
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: '#F9F9F9',
  },
  commentSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    padding: 4,
  },
  userMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  userMenuBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  userMenuSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  userMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  userMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 15,
  },
});

export default UserProfileScreen;
