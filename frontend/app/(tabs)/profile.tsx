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
  TextInput,
  Animated
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
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
  const { section } = useLocalSearchParams<{ section?: string }>();
  const userId = user?.id;
  const scrollY = useRef(new Animated.Value(0)).current;



  useEffect(() => {
    if (section === 'personality_verification') {
      router.push('/profile/personality-verification');
    }
  }, [section]);

  const SETTINGS_SECTIONS: { id: string; title: string; items: SettingItem[] }[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        { id: 'edit', icon: 'person-circle', label: 'Manage Profile', route: '/profile/edit', color: '#F97316' },
        { id: 'kyc', icon: 'shield-checkmark', label: 'KYC Verification', route: '/kyc', color: '#FB923C' },
        { id: 'personality_verification', icon: 'ribbon', label: 'Personality Verification', route: '/profile/personality-verification', color: '#D4AF37' },
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
  const [activePostKey, setActivePostKey] = useState<string | null>(null);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const postHeightsRef = useRef<Record<string, number>>({});
  const postListRef = useRef<FlatList>(null);
  const hasScrolledToPost = useRef(false);
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
      
      if (response.data) {
        setOffset(0);
        loadPosts(true);
        showToast('Post uploaded successfully!');
      }
    } catch (error: any) {
      console.warn('[Profile] Background upload failed:', error.message || error);
      Alert.alert('Upload Failed', error?.message || 'Could not upload post. Ensure your connection is stable.');
    } finally {
      setBackgroundUpload({ uploading: false, progress: 0, isCompressing: false });
    }
  };

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
      showToast('Failed to load profile. Check backend at localhost:8002 or set EXPO_PUBLIC_BACKEND_URL_WEB.');
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
    if (item.id === 'personality_verification') {
      setShowSettingsModal(false);
      const status = user?.personality_verification_status;
      if (status === 'pending' || status === 'approved') {
        router.push('/profile/personality-verification-success');
      } else {
        router.push('/profile/personality-verification');
      }
      return;
    }
    if (item.route) {
      setShowSettingsModal(false);
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
        // Hard reset for web to clear any cached state
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect
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
    hasScrolledToPost.current = false;
    setActivePostKey(null);
    postOffsetsRef.current = {};
    postHeightsRef.current = {};
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
    const rawUrl = item.media_url || item.mediaUrl || item.image_url || item.image || '';
    const isVideo = (rawUrl.match(/\.(mp4|mov|m4v|webm|m3u8|avi|mkv|flv|wmv)(\?|$)/i) || false) ||
      item.media_type === 'video' ||
      item.is_video ||
      item.isVideo ||
      (rawUrl.includes('firebasestorage.googleapis.com') && (
        rawUrl.toLowerCase().includes('%2fvideo') ||
        rawUrl.toLowerCase().includes('/video') ||
        rawUrl.toLowerCase().includes('.mp4') ||
        rawUrl.toLowerCase().includes('.m3u8') ||
        rawUrl.toLowerCase().includes('%2fposts%2f')
      ));
    const displayUrl = item.thumbnail_url || item.thumbnailUrl || item.image_url || item.image || rawUrl;
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
      {/* Cover Photo */}
      <TouchableOpacity activeOpacity={0.9} onPress={handleUploadCoverPhoto}>
        <ImageBackground
          source={{ uri: profile?.cover_photo || user?.cover_photo || 'https://images.unsplash.com/photo-1604537466158-719b1972fb17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          style={styles.coverPhoto}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.coverGradient}
          />
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.profileInfoSection}>
        {/* Avatar and Stats Row (Insta Style) */}
        <View style={styles.mainInfoRow}>
          <TouchableOpacity
            onPress={() => (profile?.photo || user?.photo) && setAvatarModalVisible(true)}
            activeOpacity={0.8}
            style={styles.avatarContainer}
          >
            <Avatar
              name={profile?.name || user?.name || 'User'}
              photo={profile?.photo || user?.photo}
              size={80}
            />
            <View style={styles.onlineDot} />
          </TouchableOpacity>

          <View style={styles.statsRow}>
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

        {/* Name and Bio Section */}
        <View style={styles.bioSection}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile?.name || user?.name || 'User'}</Text>
            {(profile?.is_verified || user?.is_verified) && (
              <Ionicons name="checkmark-circle" size={16} color="#3897f0" style={{ marginLeft: 4 }} />
            )}
          </View>
          
          {(profile?.bio || user?.bio) ? (
            <Text style={styles.bioText}>{profile?.bio || user?.bio}</Text>
          ) : null}

          {(profile?.home_location || user?.home_location) && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color="#8E8E93" />
              <Text style={styles.locationText}>
                {(profile?.home_location || user?.home_location).city}, {(profile?.home_location || user?.home_location).state}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowUploadModal(true)}
          >
            <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.actionButtonText}>Add Post</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconActionButton}
            onPress={() => handleShareExternal(null)}
          >
            <Ionicons name="share-social-outline" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={styles.container}>
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
      {/* Custom Header Bar (Instagram Style) */}
      <View style={[styles.navBar, { paddingTop: insets.top, height: 54 + insets.top }]}>
        <TouchableOpacity style={styles.navLeft} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>
            {profile?.sl_id || user?.sl_id || 'Profile'}
          </Text>
        </View>

        <TouchableOpacity style={styles.navRight} onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
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
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowSettingsModal(false)} 
          />
          <View style={[styles.settingsSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.settingsHeader}>
              <View style={styles.settingsHeaderBar} />
              <Text style={styles.settingsTitle}>Settings and Privacy</Text>
              <TouchableOpacity 
                style={styles.settingsClose} 
                onPress={() => setShowSettingsModal(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SETTINGS_SECTIONS.map((section) => (
                <View key={section.id} style={styles.settingsSection}>
                  <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
                  {section.items.map((item, index) => (
                    <View key={item.id}>
                      <TouchableOpacity
                        style={[
                          styles.settingsRow,
                          item.disabled && styles.settingsRowDisabled,
                        ]}
                        onPress={() => handleMenuPress(item)}
                      >
                        <Ionicons name={item.icon as any} size={20} color="#000" style={{ marginRight: 16 }} />
                        <View style={styles.settingsLabelWrap}>
                          <Text style={[styles.settingsLabel, item.action === 'logout' && { color: COLORS.error }]}>{item.label}</Text>
                          {item.subLabel ? <Text style={styles.settingsSubLabel}>{item.subLabel}</Text> : null}
                        </View>
                        <View style={styles.settingsRowRight}>
                          {item.value ? <Text style={styles.settingsValue}>{item.value}</Text> : null}
                          {!item.disabled && <Ionicons name="chevron-forward" size={18} color="#000" />}
                        </View>
                      </TouchableOpacity>
                      {index < section.items.length - 1 && <View style={styles.settingsSeparator} />}
                    </View>
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
          <View style={[styles.postDetailHeader, { paddingTop: insets.top, height: 50 + insets.top }]}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.postDetailTitle}>Posts</Text>
          </View>
          {posts.length > 0 ? (
            <FlatList
              ref={postListRef}
              data={posts}
              renderItem={({ item }) => {
                const postKey = String(item.id || item.media_url || 0);
                return (
                  <View
                    onLayout={(event) => {
                      const y = event.nativeEvent.layout.y;
                      const h = event.nativeEvent.layout.height;
                      postOffsetsRef.current[postKey] = y;
                      postHeightsRef.current[postKey] = h;
                    }}
                  >
                    <PostFeedCard
                      post={item}
                      onLike={handleLikePost}
                      onComment={handleOpenComment}
                      onShare={handleSharePost}
                      onRepost={handleRepost}
                      isActive={activePostKey === postKey}
                      onUserPress={() => setPostModalVisible(false)}
                      postMenuType="delete"
                      onEdit={handleEditPost}
                      onPostMenuPress={confirmDeletePost}
                      theme="dark"
                      isBlackBackground={true}
                    />
                    {editingPostId === item.id ? (
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
                    ) : null}
                  </View>
                );
              }}
              keyExtractor={(item, idx) => String(item.id || idx)}
              onScroll={(event) => {
                const y = event.nativeEvent.contentOffset.y;
                let closestKey: string | null = null;
                let maxVisible = 0;
                const screenH = Dimensions.get('window').height;
                for (const key of Object.keys(postOffsetsRef.current)) {
                  const offset = postOffsetsRef.current[key];
                  const height = postHeightsRef.current[key];
                  if (typeof offset === 'number' && typeof height === 'number') {
                    const visibleTop = Math.max(0, offset - y);
                    const visibleBottom = Math.min(screenH, offset + height - y);
                    const visibleAmount = Math.max(0, visibleBottom - visibleTop);
                    if (visibleAmount > maxVisible) {
                      maxVisible = visibleAmount;
                      closestKey = key;
                    }
                  }
                }
                setActivePostKey(prev => closestKey ?? prev);
              }}
              scrollEventThrottle={16}
              onLayout={() => {
                if (selectedPost && posts.length > 0 && !hasScrolledToPost.current) {
                  const idx = posts.findIndex(p => p.id === selectedPost.id);
                  if (idx >= 0) {
                    setTimeout(() => {
                      postListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
                      hasScrolledToPost.current = true;
                      setActivePostKey(String(selectedPost.id || selectedPost.media_url || 0));
                    }, 200);
                  }
                }
              }}
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
      <Modal visible={commentModalVisible} transparent animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.sheetOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <TouchableOpacity style={styles.sheetDismiss} activeOpacity={1} onPress={() => setCommentModalVisible(false)} />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
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
                    <MentionText style={styles.commentText} text={item.text || ''} />
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
            />
          )}

            <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Avatar name={user?.name || 'User'} photo={user?.photo} size={32} />
              <MentionInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                multiline
                inputStyle={styles.commentInput}
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
          </View>
        </KeyboardAvoidingView>
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
        onUploadSuccess={() => {
          setOffset(0);
          loadPosts(true);
        }}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContent: {
    height: '70%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  navBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  navLeft: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navCenter: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerContent: {
    paddingBottom: 16,
  },
  coverPhoto: {
    width: '100%',
    height: 120, // Reduced height for more focus on profile
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  profileInfoSection: {
    paddingHorizontal: 16,
    marginTop: -30, // Slight overlap with cover photo
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    position: 'relative',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 50,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#000000',
  },
  statsRow: {
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  bioSection: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bioText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 34,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  iconActionButton: {
    width: 34,
    height: 34,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '65%',
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 34,
    elevation: 20,
  },
  settingsHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 4,
  },
  settingsHeaderBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4E4E4',
    borderRadius: 10,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  settingsClose: {
    position: 'absolute',
    right: 20,
    top: 24,
  },
  settingsSection: {
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  settingsRowDisabled: {
    opacity: 0.5,
  },
  settingsSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingsGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    marginHorizontal: 0,
    marginBottom: 0,
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
    color: '#000000',
    fontWeight: '500',
  },
  settingsSubLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValue: {
    fontSize: 14,
    color: '#999999',
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
