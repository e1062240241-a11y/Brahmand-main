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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import {
  getUserPosts,
  getUserProfile,
  viewPost,
  deletePost,
  updatePost,
  togglePostLike,
  getPostComments,
  addPostComment,
  repostPost,
  reportPost,
  getCulturalCommunities,
  getUserCulturalCommunity,
  updateUserCulturalCommunity
} from '../../src/services/api';
import SharePostModal from '../../src/components/SharePostModal';
import { KeyboardAvoidingView, Share } from 'react-native';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

type SettingItem = {
  id: string;
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
  subLabel?: string;
  value?: string;
  action?: 'logout';
  color?: string;
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
        { id: 'edit', icon: 'person-circle', label: 'Manage Profile', route: '/profile/edit', color: '#4F46E5' },
        { id: 'kyc', icon: 'shield-checkmark', label: 'KYC Verification', route: '/kyc', color: '#F59E0B' },
        { id: 'notifications', icon: 'notifications', label: 'Notifications', route: '/settings/notifications', color: '#10B981' },
        { id: 'privacy', icon: 'lock-closed', label: 'Privacy', route: '/settings/privacy', disabled: true, subLabel: 'Coming soon', color: '#6366F1' },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        { id: 'about', icon: 'information-circle', label: 'About Us', route: '/settings/guidelines', color: '#8B5CF6' },
        { id: 'location', icon: 'location', label: 'Location', route: '/settings/location', disabled: true, subLabel: 'Coming soon', color: '#EC4899' },
        { id: 'language', icon: 'language', label: 'Language', value: 'English', disabled: true, color: '#06B6D4' },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        { id: 'guidelines', icon: 'document-text', label: 'Community Guidelines', route: '/settings/guidelines', color: '#F97316' },
        { id: 'culture', icon: 'people', label: 'My Culture Group', value: user?.cultural_community || 'Not set', color: '#D946EF' },
        { id: 'logout', icon: 'log-out', label: 'Logout', action: 'logout', color: '#EF4444' },
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [activeTab, setActiveTab] = useState('grid');

  // Cultural Group states
  const [showCGModal, setShowCGModal] = useState(false);
  const [cgSearch, setCGSearch] = useState('');
  const [cgList, setCGList] = useState<string[]>([]);
  const [cgLoading, setCGLoading] = useState(false);
  const [userCG, setUserCG] = useState<{ cultural_community: string | null; change_count: number; is_locked: boolean } | null>(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);

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
    if (!userId) {
      setLoading(false);
      return;
    }
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

  const handleDeletePost = async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    const removedPost = post;
    setPosts((prev) => prev.filter((item) => item.id !== postId));
    setPostsCount((prev) => Math.max(0, prev - 1));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
      setPostModalVisible(false);
    }

    try {
      await deletePost(postId);
      showToast('Post deleted successfully');
    } catch (error) {
      console.warn('Failed to delete post:', error);
      setPosts((prev) => (prev.some((item) => item.id === postId) ? prev : [removedPost, ...prev]));
      setPostsCount((prev) => prev + 1);
      Alert.alert('Unable to delete post', 'Please try again later.');
    }
  };

  const confirmDeletePost = (post: any) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this post?')) {
        handleDeletePost(post);
      }
      return;
    }

    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeletePost(post) },
      ]
    );
  };

  const openPostModal = (post: any) => {
    if (!post?.id) return;
    setSelectedPost(post);
    setPostModalVisible(true);
    setEditedCaption(post?.caption || '');
    try {
      viewPost(post.id);
    } catch (e) { }
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setEditedCaption(post?.caption || '');
    setEditModalVisible(true);
  };

  const savePostEdit = async () => {
    if (!selectedPost?.id) return;
    const postId = selectedPost.id;

    try {
      const response = await updatePost(postId, { caption: editedCaption });
      const updatedPost = response.data?.post ? response.data.post : { ...selectedPost, caption: editedCaption };
      setSelectedPost(updatedPost);
      setPosts((prev) => prev.map((item) => item.id === postId ? updatedPost : item));
      showToast('Post updated successfully');
      setEditModalVisible(false);
    } catch (error) {
      console.warn('Failed to update post:', error);
      Alert.alert('Unable to save changes', 'Please try again later.');
    }
  };

  const handleLikePost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;
    const liked = !!post?.liked_by_me;
    const currentLikes = Number(post?.likes_count || 0);
    const optimisticPost = {
      ...post,
      liked_by_me: !liked,
      likes_count: liked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
    };

    if (selectedPost?.id === postId) setSelectedPost(optimisticPost);
    setPosts((prev) => prev.map((item) => (item.id === postId ? optimisticPost : item)));

    try {
      const response = await togglePostLike(postId);
      const updatedPost = response.data?.post;
      if (updatedPost) {
        if (selectedPost?.id === postId) setSelectedPost((prev: any) => ({ ...prev, ...updatedPost }));
        setPosts((prev) => prev.map((item) => (item.id === postId ? { ...item, ...updatedPost } : item)));
      }
    } catch (error) {
      console.warn('Failed to like post:', error);
      if (selectedPost?.id === postId) setSelectedPost(post);
      setPosts((prev) => prev.map((item) => (item.id === postId ? post : item)));
    }
  }, [selectedPost]);

  const handleOpenComment = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    setSelectedCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);
    setCommentsLoading(true);

    try {
      const response = await getPostComments(postId, 300);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleSubmitComment = async () => {
    if (!selectedCommentPost?.id || !commentText.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPost.id, commentText.trim());
      const updatedPost = response.data?.post;
      if (updatedPost) {
        if (selectedPost?.id === selectedCommentPost.id) setSelectedPost((prev: any) => ({ ...prev, ...updatedPost }));
        setPosts((prev) =>
          prev.map((item) => (item.id === selectedCommentPost.id ? { ...item, ...updatedPost } : item))
        );
        setSelectedCommentPost((prev: any) => (prev?.id === selectedCommentPost.id ? { ...prev, ...updatedPost } : prev));
      }

      const commentsResponse = await getPostComments(selectedCommentPost.id, 300);
      setPostComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
      setCommentText('');
    } catch (error) {
      console.warn('Failed to add comment:', error);
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSharePost = useCallback((post: any) => {
    setSelectedSharePost(post);
    setShareModalVisible(true);
  }, []);

  const handleRepost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    try {
      const response = await repostPost(postId);
      showToast('Reposted to your feed');
      loadPosts(true); // Refresh grid
    } catch (error) {
      console.warn('Failed to repost:', error);
      Alert.alert('Error', 'Could not repost.');
    }
  }, [loadPosts, showToast]);

  const handleShareExternal = async (post: any) => {
    const appLink = 'https://brahmand.app';
    const mediaUrl = post?.media_url || '';
    const caption = post?.caption ? `\nCaption: ${post.caption}` : '';
    const message = `Check this post on Brahmand!${caption}\nApp: brahmand.app\n${appLink}`;

    try {
      if (FileSystemModule?.cacheDirectory && FileSystemModule?.downloadAsync && mediaUrl) {
        const inferredExt = post?.media_type === 'video' ? 'mp4' : 'jpg';
        const localPath = `${FileSystemModule.cacheDirectory}share-${Date.now()}.${inferredExt}`;
        const downloadRes = await FileSystemModule.downloadAsync(mediaUrl, localPath);
        if (downloadRes?.uri) {
          await Share.share({ message, url: downloadRes.uri, title: 'Share via Brahmand' });
          return;
        }
      }
      await Share.share({ message: `${message}\n${mediaUrl}`, url: mediaUrl || appLink, title: 'Share via Brahmand' });
    } catch (error: any) {
      const msg = String(error?.message || error || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss') || msg.includes('aborted')) return;
      console.warn('Failed to open share sheet:', error);
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    const isVideo = (item.media_url || '').match(/\.(mp4|mov|avi)$/i) || (item.media_type === 'video');
    const displayUrl = item.thumbnail_url || item.image_url || (!isVideo ? item.media_url : null);
    const views = item.views_count || 0;

    return (
      <TouchableOpacity
        style={[styles.gridItem, { position: 'relative' }]}
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
            <Text style={styles.viewCountText}>{views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</Text>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom Header Bar */}
      <View style={[styles.navBar, { paddingTop: insets.top || 10 }]}>
        <View style={styles.navLeft}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.text} />
          <Text style={styles.navTitle}>{profile?.sl_id || user?.sl_id || 'Profile'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.text} />
        </View>
        <View style={styles.navRight}>
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
            <LinearGradient
              colors={['#E0F2F1', '#E3F2FD', '#FFFFFF']}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
            />
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
                  <View style={styles.settingsGroupCard}>
                    {section.items.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.settingsRow,
                          item.disabled && styles.settingsRowDisabled,
                          index === section.items.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        onPress={() => handleMenuPress(item)}
                      >
                        <View style={[styles.settingsIconCircle, { backgroundColor: item.color || COLORS.primary }]}>
                          <Ionicons name={item.icon as any} size={20} color="#FFF" />
                        </View>
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
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.postDetailTitle}>Posts</Text>
          </View>
          {selectedPost ? (
            <FlatList
              data={[selectedPost]}
              renderItem={({ item }) => (
                <PostFeedCard
                  post={item}
                  onLike={handleLikePost}
                  onComment={handleOpenComment}
                  onShare={handleSharePost}
                  onRepost={handleRepost}
                  isActive={postModalVisible}
                  onUserPress={() => setPostModalVisible(false)}
                  postMenuType="delete"
                  onEdit={handleEditPost}
                  onPostMenuPress={confirmDeletePost}
                />
              )}
              keyExtractor={(item) => item.id}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editPostModal}>
            <View style={styles.editPostHeader}>
              <Text style={styles.editPostTitle}>Edit post caption</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={editedCaption}
              onChangeText={setEditedCaption}
              style={styles.editCaptionInput}
              multiline
              placeholder="Write a new caption"
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity style={styles.saveEditButton} onPress={savePostEdit}>
              <Text style={styles.saveEditButtonText}>Save changes</Text>
            </TouchableOpacity>
          </View>
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

            {(userCG?.change_count ?? 0) >= 2 && (
              <View style={styles.limitReachedContainer}>
                <Ionicons name="alert-circle" size={20} color="#991B1B" />
                <Text style={styles.limitReachedText}>Change limit reached. You cannot change your culture group again.</Text>
              </View>
            )}

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
                      ((userCG?.change_count ?? 0) >= 2 && userCG?.cultural_community !== item) && { opacity: 0.5 }
                    ]}
                    onPress={() => {
                      if ((userCG?.change_count ?? 0) >= 2 && userCG?.cultural_community !== item) {
                        Alert.alert("Limit Reached", "You have already reached the limit for changing your culture group.");
                        return;
                      }
                      handleSelectCG(item);
                    }}
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

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide">
        <SafeAreaView style={styles.commentModalContainer}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.commentTitle}>Comments</Text>
            <View style={{ width: 28 }} />
          </View>

          {commentsLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
          ) : (
            <FlatList
              data={postComments}
              keyExtractor={(item, index) => item.id || String(index)}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Avatar name={item.username || 'User'} photo={item.user_photo} size={36} />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>{item.username || 'User'}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputContainer}>
              <Avatar name={user?.name || 'User'} photo={user?.photo} size={32} />
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || commentSubmitting}
              >
                <Text style={[
                  styles.commentPostButton,
                  (!commentText.trim() || commentSubmitting) && { opacity: 0.5 }
                ]}>Post</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Share Modal */}
      <SharePostModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        post={selectedSharePost}
        onShareExternal={handleShareExternal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  navBar: {
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
    paddingTop: 10,
    paddingBottom: 10,
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
    backgroundColor: 'transparent',
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
    opacity: 0.6,
  },
  settingsGroupCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsLabelWrap: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingsSubLabel: {
    fontSize: 12,
    color: COLORS.textLight,
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
    maxWidth: 100,
    textAlign: 'right',
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
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  editPostModal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '50%',
    padding: SPACING.lg,
  },
  editPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  editPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editCaptionInput: {
    flex: 1,
    minHeight: 120,
    maxHeight: 260,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.md,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  saveEditButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveEditButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
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
    fontSize: 14,
  },
  limitReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  limitReachedText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
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
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  commentModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  commentInput: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    maxHeight: 100,
    color: COLORS.text,
  },
  commentPostButton: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  emptyComments: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
