import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
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
import * as ImagePicker from 'expo-image-picker';
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
  updateUserCulturalCommunity,
  uploadUserPost,
  updateProfile,
  uploadChatMedia
} from '../../src/services/api';
import SharePostModal from '../../src/components/SharePostModal';
import UploadPostModal from '../../src/components/UploadPostModal';
import { KeyboardAvoidingView, Share } from 'react-native';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { formatTimeAgo } from '../../src/utils/dateUtils';

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
        { id: 'edit', icon: 'person-circle', label: 'Manage Profile', route: '/profile/edit', color: '#F97316' },
        { id: 'kyc', icon: 'shield-checkmark', label: 'KYC Verification', route: '/kyc', color: '#FB923C' },
        { id: 'notifications', icon: 'notifications', label: 'Notifications', route: '/settings/notifications', color: '#F59E0B' },
        { id: 'privacy', icon: 'lock-closed', label: 'Privacy', route: '/settings/privacy', disabled: true, subLabel: 'Coming soon', color: '#D97706' },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        { id: 'about', icon: 'information-circle', label: 'About Us', route: '/settings/guidelines', color: '#C2410C' },
        { id: 'location', icon: 'location', label: 'Location', route: '/settings/location', disabled: true, subLabel: 'Coming soon', color: '#EA580C' },
        { id: 'language', icon: 'language', label: 'Language', value: 'English', disabled: true, color: '#B45309' },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        { id: 'guidelines', icon: 'document-text', label: 'Community Guidelines', route: '/settings/guidelines', color: '#92400E' },
        { id: 'culture', icon: 'people', label: 'My Culture Group', value: user?.cultural_community || 'Not set', color: '#854D0E' },
        { id: 'logout', icon: 'log-out', label: 'Logout', action: 'logout', color: '#B91C1C' },
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [backgroundUpload, setBackgroundUpload] = useState<{
    uploading: boolean;
    progress: number;
    isCompressing: boolean;
    mediaUri?: string;
  }>({ uploading: false, progress: 0, isCompressing: false });

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
      setProfile(user || null);
      showToast('Failed to load profile. Check backend at localhost:8000.');
      if (error?.response?.status === 401 || error?.response?.status === 502) {
        await logout();
        router.replace('/');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, router, updateUser, userId]);

  const handleUploadCoverPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        showToast('Uploading cover photo...');
        const file = {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'cover.jpg',
          type: result.assets[0].mimeType || 'image/jpeg'
        };
        const uploadRes = await uploadChatMedia(file);
        const url = uploadRes.data.url || uploadRes.data.mediaUrl;
        if (url) {
          await updateProfile({ cover_photo: url } as any);
          await fetchProfile(false);
          showToast('Cover photo updated!');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to upload cover photo');
    }
  };

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

  const handleUploadStart = async (media: any, caption: string, filterName?: string) => {
    setBackgroundUpload({
      uploading: true,
      progress: 0,
      isCompressing: false,
      mediaUri: media.uri
    });

    try {
      const response = await uploadUserPost(
        {
          uri: media.uri,
          type: media.mimeType,
          name: media.name,
        },
        caption,
        filterName,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setBackgroundUpload(prev => ({ ...prev, progress: percent }));
            if (percent >= 100 && media.mediaType === 'video') {
              setBackgroundUpload(prev => ({ ...prev, isCompressing: true }));
            }
          }
        }
      );

      showToast('Post uploaded successfully!');
      loadPosts(true); // Refresh profile grid
    } catch (error: any) {
      console.warn('Upload failed:', error);
      const detail = error.response?.data?.detail;
      Alert.alert('Upload Failed', typeof detail === 'string' ? detail : 'Could not upload your post. Please try again.');
    } finally {
      setBackgroundUpload({ uploading: false, progress: 0, isCompressing: false });
    }
  };

  const handleUploadPostSuccess = () => {
    setShowUploadModal(false);
  };

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
    try {
      await logout();
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/');
    }
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
    setEditingPostId(post?.id);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditedCaption('');
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
      setEditingPostId(null);
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
      <TouchableOpacity activeOpacity={0.9} onPress={handleUploadCoverPhoto}>
        <ImageBackground
          source={{ uri: profile?.cover_photo || user?.cover_photo || 'https://images.unsplash.com/photo-1604537466158-719b1972fb17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          style={styles.coverPhoto}
        >
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)', '#000000']}
            style={styles.coverGradient}
          />
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.profileBottomSection}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            onPress={() => (profile?.photo || user?.photo) && setAvatarModalVisible(true)}
            activeOpacity={0.8}
            style={styles.avatarContainerImage}
          >
            <Avatar
              name={profile?.name || user?.name || 'User'}
              photo={profile?.photo || user?.photo}
              size={100}
            />
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.bioCenterSection}>
          <View style={styles.nameRowCenter}>
            <Text style={styles.displayNameCenter}>{profile?.name || user?.name || 'User'}</Text>
            {(profile?.is_verified || user?.is_verified) && (
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            )}
          </View>

          {(profile?.bio || user?.bio) ? (
            <Text style={styles.bioTextCenter}>{profile?.bio || user?.bio}</Text>
          ) : null}

          {(profile?.home_location || user?.home_location) && (
            <View style={styles.locationContainerCenter}>
              <Ionicons name="location-outline" size={14} color="#FFF" />
              <Text style={styles.locationTextCenter}>
                {(profile?.home_location || user?.home_location).city}, {(profile?.home_location || user?.home_location).state}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats Box */}
      <View style={styles.statsCardWrapper}>
        <View style={styles.statsCard}>
          <TouchableOpacity
            style={styles.statBoxItem}
            onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })}
          >
            <Ionicons name="trending-up-outline" size={20} color="#FFF" style={styles.statIcon} />
            <Text style={styles.statBoxValue}>{profile?.followers_count ?? (Array.isArray(profile?.followers) ? profile.followers.length : 0)}</Text>
            <Text style={styles.statBoxLabel}>Followers</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBoxItem}
            onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following' } })}
          >
            <Ionicons name="people-outline" size={20} color="#FFF" style={styles.statIcon} />
            <Text style={styles.statBoxValue}>{profile?.following_count ?? (Array.isArray(profile?.following) ? profile.following.length : 0)}</Text>
            <Text style={styles.statBoxLabel}>Following</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <View style={styles.statBoxItem}>
            <Ionicons name="share-outline" size={20} color="#FFF" style={styles.statIcon} />
            <Text style={styles.statBoxValue}>{postsCount}</Text>
            <Text style={styles.statBoxLabel}>Posts</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBoxItem}>
            <Ionicons name="bookmark-outline" size={20} color="#FFF" style={styles.statIcon} />
            <Text style={styles.statBoxValue}>143</Text>
            <Text style={styles.statBoxLabel}>Saved</Text>
          </View>
        </View>
      </View>

      {/* Add Post & Share Buttons */}
      <View style={styles.actionButtonsBox}>
        <TouchableOpacity
          style={styles.addPostButton}
          onPress={() => setShowUploadModal(true)}
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
      {/* Background Upload Status */}
      {backgroundUpload.uploading && (
        <View style={styles.uploadingStatusBar}>
          <View style={styles.uploadingStatusContent}>
            {backgroundUpload.mediaUri && (
              <Image source={{ uri: backgroundUpload.mediaUri }} style={styles.uploadingThumbnail} />
            )}
            <View style={styles.uploadingTextContainer}>
              <Text style={styles.uploadingTitle}>
                {backgroundUpload.isCompressing ? 'Finalizing post...' : `Uploading... ${backgroundUpload.progress}%`}
              </Text>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#FF6B00', '#FF9E00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${backgroundUpload.progress}%` }]}
                />
              </View>
            </View>
          </View>
        </View>
      )}
      {/* Custom Header Bar */}
      <View style={[styles.navBarAbsolute, { paddingTop: insets.top || 10 }]}>
        <TouchableOpacity style={styles.navLeft} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
          <Text style={styles.navTitleWhite}>{profile?.sl_id || user?.sl_id || 'Profile'}</Text>
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIcon} onPress={() => setShowSettingsModal(true)}>
            <Ionicons name="menu-outline" size={30} color="#FFF" />
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
              <Text style={styles.endOfFeedText}>You&apos;ve reached the end</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !postsLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="camera-outline" size={40} color="#FFFFFF" />
              </View>
              <Text style={[styles.emptyTitle, { color: '#FFFFFF' }]}>No Posts Yet</Text>
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
              colors={['#121212', '#1C1C1E', '#1C1C1E']}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
            />
            <View style={styles.settingsHeader}>
              <View style={styles.settingsHeaderBar} />
              <Text style={styles.settingsTitle}>Settings and privacy</Text>
              <TouchableOpacity style={styles.settingsClose} onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
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
                          {!item.disabled && <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.3)" />}
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
          <View style={[styles.postDetailHeader, { marginTop: insets.top }]}>
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
              ListFooterComponent={
                editingPostId === selectedPost?.id ? (
                  <View style={styles.editPostInline}>
                    <TextInput
                      value={editedCaption}
                      onChangeText={setEditedCaption}
                      style={styles.editCaptionInput}
                      multiline
                      placeholder="Edit caption..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                    <View style={styles.editPostActions}>
                      <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEdit}>
                        <Text style={styles.cancelEditText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveEditBtn} onPress={savePostEdit}>
                        <Text style={styles.saveEditBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null
              }
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
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
            <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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

      <SharePostModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        post={selectedSharePost}
        onShareExternal={handleShareExternal}
      />

      <UploadPostModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadStart={handleUploadStart}
        onUploadSuccess={handleUploadPostSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navBarAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  navTitleWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerContent: {
    paddingBottom: 16,
  },
  coverPhoto: {
    width: '100%',
    height: 300,
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  profileBottomSection: {
    backgroundColor: '#000000',
    alignItems: 'center',
    paddingBottom: 24,
  },
  avatarWrapper: {
    marginTop: -50,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainerImage: {
    position: 'relative',
    padding: 3,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: '#000000',
  },
  bioCenterSection: {
    alignItems: 'center',
  },
  nameRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayNameCenter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bioTextCenter: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  locationContainerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextCenter: {
    fontSize: 13,
    color: '#BBBBBB',
    marginLeft: 4,
  },
  statsCardWrapper: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0C0C0C',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  statBoxItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#222222',
    height: '80%',
    alignSelf: 'center',
  },
  actionButtonsBox: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  addPostButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#0C0C0C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    gap: 6,
  },
  addPostText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  shareIconButton: {
    width: 44,
    height: 44,
    backgroundColor: '#0C0C0C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
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
    borderColor: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.6)',
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
    backgroundColor: '#2C2C2E', // Slightly lighter gray for cards on dark background
    borderRadius: 24,
    paddingVertical: 4,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
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
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingsSubLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
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
  editPostInline: {
    padding: SPACING.md,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  editCaptionInput: {
    minHeight: 100,
    maxHeight: 180,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    fontSize: 14,
  },
  editPostActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: SPACING.md,
  },
  cancelEditBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelEditText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  saveEditBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveEditBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
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
  uploadingStatusBar: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    padding: 12,
  },
  uploadingStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#333',
  },
  uploadingTextContainer: {
    flex: 1,
  },
  uploadingTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
});