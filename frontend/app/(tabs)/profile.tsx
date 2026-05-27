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
  Animated,
  Keyboard,
  Pressable,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../src/utils/i18n';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import api, {
  getUserPosts,
  getUserProfile,
  viewPost,
  deletePost,
  updatePost,
  togglePostLike,
  getPostComments,
  deletePostComment,
  addPostComment,
  repostPost,
  reportPost,
  getCulturalCommunities,
  getUserCulturalCommunity,
  updateUserCulturalCommunity,
  uploadUserPost,
  updateProfile,
  uploadChatMedia,
  setupDualLocation,
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
const GRID_GAP = 2;
const COLUMN_WIDTH = (width - GRID_GAP * 4) / 3;
const AVATAR_SIZE = 100;
const NAV_BAR_HEIGHT = 48;
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1604537466158-719b1972fb17?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

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
  const { t, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const userId = user?.id;
  const scrollY = useRef(new Animated.Value(0)).current;

  const navTitleOpacity = scrollY.interpolate({
    inputRange: [100, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (section === 'personality_verification') {
      router.push('/profile/personality-verification');
    }
  }, [section]);

  const SETTINGS_SECTIONS: { id: string; title: string; items: SettingItem[] }[] = [
    {
      id: 'account',
      title: t('account'),
      items: [
        { id: 'edit', icon: 'person-circle', label: t('manageProfile'), route: '/profile/edit', color: '#F97316' },
        { id: 'kyc', icon: 'shield-checkmark', label: t('kycVerification'), route: '/kyc', color: '#FB923C' },
        { id: 'personality_verification', icon: 'ribbon', label: t('personalityVerification'), route: '/profile/personality-verification', color: '#D4AF37' },
        { id: 'notifications', icon: 'notifications', label: t('notifications'), route: '/settings/notifications', color: '#F59E0B' },
        { id: 'privacy', icon: 'lock-closed', label: t('privacy'), route: '/settings/privacy', disabled: true, subLabel: 'Coming soon', color: '#D97706' },
      ],
    },
    {
      id: 'preferences',
      title: t('preferences'),
      items: [
        { id: 'about', icon: 'information-circle', label: t('aboutUs'), route: '/settings/guidelines', color: '#C2410C' },
        { id: 'location', icon: 'location', label: t('location'), route: '/settings/location', disabled: true, subLabel: 'Coming soon', color: '#EA580C' },
        { id: 'language', icon: 'language', label: t('language'), value: language === 'en' ? t('english') : t('hindi'), disabled: false, color: '#B45309' },
      ],
    },
    {
      id: 'support',
      title: t('support'),
      items: [
        { id: 'guidelines', icon: 'document-text', label: t('communityGuidelines'), route: '/settings/guidelines', color: '#92400E' },
        { id: 'culture', icon: 'people', label: t('myCultureGroup'), value: user?.cultural_community || 'Not set', color: '#854D0E' },
        { id: 'logout', icon: 'log-out', label: t('logout'), action: 'logout', color: '#B91C1C' },
      ],
    },
  ];

  const [profile, setProfile] = useState<any>(user || null);
  const [loading, setLoading] = useState(!user);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
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
  const [showLanguageModal, setShowLanguageModal] = useState(false);
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
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [savingProfileField, setSavingProfileField] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [backgroundUpload, setBackgroundUpload] = useState<{
    uploading: boolean;
    progress: number;
    isCompressing: boolean;
    mediaUri?: string;
  }>({ uploading: false, progress: 0, isCompressing: false });

  const handleUploadStart = async (
    media: any,
    caption: string,
    filterName?: string,
    communityLevel: string = 'city',
    category: string = 'feed',
    mediaWidth?: number,
    mediaHeight?: number,
    cropOffsetX?: number,
    cropOffsetY?: number,
    originalWidth?: number,
    originalHeight?: number
  ) => {
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
        },
        communityLevel,
        category,
        mediaWidth,
        mediaHeight,
        cropOffsetX,
        cropOffsetY,
        originalWidth,
        originalHeight
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
    console.log('[Profile] fetchProfile called, userId:', userId);
    if (!userId) {
      console.log('[Profile] no userId in fetchProfile');
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      console.log('[Profile] calling getUserProfile API');
      const res = await getUserProfile();
      console.log('[Profile] getUserProfile success:', JSON.stringify(res.data).substring(0, 200));
      const nextProfile = res.data || {};
      setProfile(nextProfile);
      updateUser(nextProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error && error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      console.error('Error message:', error?.message);
      setProfile(user || null);
      showToast('Profile error. Check backend port 8000.');
      if (error?.response?.status === 401 || error?.response?.status === 502) {
        console.log('[Profile] auth error, logging out');
        await logout();
        router.replace('/');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, router, updateUser, userId]);

  useEffect(() => {
    const loadSavedCount = async () => {
      try {
        const raw = await AsyncStorage.getItem(`saved_posts_${userId}`);
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setSavedCount(0);
      }
    };
    if (userId) loadSavedCount();
  }, [userId]);

  const uploadProfileImage = async (
    asset: ImagePicker.ImagePickerAsset,
    field: 'photo' | 'cover_photo'
  ) => {
    showToast(field === 'photo' ? 'Uploading profile photo...' : 'Uploading cover photo...');
    const file = {
      uri: asset.uri,
      name: asset.fileName || (field === 'photo' ? 'avatar.jpg' : 'cover.jpg'),
      type: asset.mimeType || 'image/jpeg',
    };
    const uploadRes = await uploadChatMedia(file);
    const url = uploadRes.data.url || uploadRes.data.mediaUrl;
    if (!url) throw new Error('Upload failed');
    await updateProfile({ [field]: url } as any);
    await fetchProfile(false);
    showToast(field === 'photo' ? 'Profile photo updated!' : 'Cover photo updated!');
  };

  const pickProfileImage = async (field: 'photo' | 'cover_photo', source: 'library' | 'camera') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Allow camera access to take a photo.');
          return;
        }
      }
      const launcher =
        source === 'camera'
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;
      const result = await launcher({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: field === 'photo' ? [1, 1] : [16, 9],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.length) {
        await uploadProfileImage(result.assets[0], field);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to upload image');
    }
  };

  const showImageSourcePicker = (field: 'photo' | 'cover_photo') => {
    const title = field === 'photo' ? 'Profile photo' : 'Cover photo';
    if (Platform.OS === 'web') {
      pickProfileImage(field, 'library');
      return;
    }
    Alert.alert(title, 'Choose a source', [
      { text: 'Gallery', onPress: () => pickProfileImage(field, 'library') },
      { text: 'Camera', onPress: () => pickProfileImage(field, 'camera') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveProfilePhoto = async () => {
    try {
      await updateProfile({ photo: '' } as any);
      await fetchProfile(false);
      showToast('Profile photo removed');
    } catch {
      showToast('Could not remove profile photo');
    }
  };

  const showAvatarOptions = () => {
    const hasPhoto = !!(profile?.photo || user?.photo);
    if (Platform.OS === 'web') {
      showImageSourcePicker('photo');
      return;
    }
    Alert.alert('Profile photo', undefined, [
      ...(hasPhoto
        ? [{ text: 'View photo', onPress: () => setAvatarModalVisible(true) }]
        : []),
      { text: 'Choose from gallery', onPress: () => pickProfileImage('photo', 'library') },
      { text: 'Take photo', onPress: () => pickProfileImage('photo', 'camera') },
      ...(hasPhoto
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: handleRemoveProfilePhoto }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleShareProfile = async () => {
    const username = profile?.sl_id || user?.sl_id || 'profile';
    const displayName = profile?.name || user?.name || 'User';
    const message = `Check out ${displayName} (@${username}) on Brahmand!`;
    try {
      await Share.share({
        message,
        url: `https://brahmand.app/profile/${userId}`,
        title: `${displayName} on Brahmand`,
      });
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase();
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        showToast('Could not share profile');
      }
    }
  };

  const openBioEditor = () => {
    setBioDraft(profile?.bio || user?.bio || '');
    setShowBioModal(true);
  };

  const openLocationEditor = () => {
    const loc = profile?.home_location || user?.home_location;
    setLocationDraft(loc ? `${loc.city || ''}, ${loc.state || ''}`.replace(/^,\s*|,\s*$/g, '') : '');
    setShowLocationModal(true);
  };

  const saveBio = async () => {
    setSavingProfileField(true);
    try {
      await updateProfile({ bio: bioDraft.trim() });
      await fetchProfile(false);
      setShowBioModal(false);
      showToast('Bio updated');
    } catch {
      showToast('Failed to update bio');
    } finally {
      setSavingProfileField(false);
    }
  };

  const saveLocation = async () => {
    const parts = locationDraft.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) {
      Alert.alert('Location', 'Enter location as City, State');
      return;
    }
    setSavingProfileField(true);
    try {
      await setupDualLocation({
        home_location: {
          country: 'India',
          city: parts[0],
          state: parts[1],
          area: parts[0],
        },
      });
      await fetchProfile(false);
      setShowLocationModal(false);
      showToast('Location updated');
    } catch {
      showToast('Failed to update location');
    } finally {
      setSavingProfileField(false);
    }
  };

  const loadPosts = useCallback(async (reset = false) => {
    console.log('[Profile] loading posts for userId:', userId, 'reset:', reset);
    if (!userId || (postsLoading && !reset)) {
      console.log('[Profile] skip loadPosts:', { userId, postsLoading, reset });
      return;
    }

    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setPostsLoading(true);
      setHasMore(true);
    }

    try {
      console.log('[Profile] calling getUserPosts with:', { userId, LIMIT, currentOffset });
      const response = await getUserPosts(userId, LIMIT, currentOffset);
      const payload = response.data;
      console.log('[Profile] getUserPosts response payload:', JSON.stringify(payload).substring(0, 200));
      const items = Array.isArray(payload) ? payload : (payload?.items || []);
      console.log('[Profile] items count:', items.length);

      if (reset) {
        setPosts(items);
        AsyncStorage.setItem(`profile_posts_${userId}`, JSON.stringify(items)).catch(() => {});
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
    if (!userId) return;
    // Attempt to load cached posts immediately
    AsyncStorage.getItem(`profile_posts_${userId}`).then(cached => {
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) {
          setPosts(parsed);
          setPostsLoading(false);
        }
      }
      fetchProfile(!user); // Silently fetch if we already have user data
      loadPosts(true); // Will update in background if we had cache
    }).catch(() => {
      fetchProfile(true);
      loadPosts(true);
    });
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

    if (item.id === 'language') {
      setShowLanguageModal(true);
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

  const loadComments = async (postId: string) => {
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
  };

  const handleOpenComment = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    setSelectedCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);
    loadComments(postId);
  }, []);

  const handleSubmitComment = async () => {
    if (!selectedCommentPost?.id || !commentText.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPost.id, commentText.trim());
      const updatedPost = response.data?.post || response.data;
      const serverComment = response.data?.comment;
      
      if (updatedPost) {
        if (selectedPost?.id === selectedCommentPost.id) setSelectedPost((prev: any) => ({ ...prev, ...updatedPost }));
        setPosts((prev) =>
          prev.map((item) => (item.id === selectedCommentPost.id ? { ...item, ...updatedPost } : item))
        );
        setSelectedCommentPost((prev: any) => (prev?.id === selectedCommentPost.id ? { ...prev, ...updatedPost } : prev));
      }

      await loadComments(selectedCommentPost.id);
      setCommentText('');
      Keyboard.dismiss();
    } catch (error) {
      console.warn('Failed to add comment:', error);
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: any) => {
    const commentId = comment?.id;
    if (!commentId || !selectedCommentPost?.id) return;

    const originalComments = [...postComments];
    const originalPost = { ...selectedCommentPost };

    setPostComments(prev => prev.filter(c => c.id !== commentId));

    const targetPostId = selectedCommentPost.id;
    setPosts(prev => prev.map(p => {
      if (p.id === targetPostId) {
        const currentTop = Array.isArray(p.top_comments) ? p.top_comments : [];
        return {
          ...p,
          comments_count: Math.max(0, (Number(p.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return p;
    }));

    if (selectedPost?.id === targetPostId) {
      setSelectedPost((prev: any) => {
        if (prev) {
          const currentTop = Array.isArray(prev.top_comments) ? prev.top_comments : [];
          return {
            ...prev,
            comments_count: Math.max(0, (Number(prev.comments_count) || 0) - 1),
            top_comments: currentTop.filter((c: any) => c.id !== commentId),
          };
        }
        return prev;
      });
    }

    setSelectedCommentPost((prev: any) => {
      if (prev?.id === targetPostId) {
        const currentTop = Array.isArray(prev.top_comments) ? prev.top_comments : [];
        return {
          ...prev,
          comments_count: Math.max(0, (Number(prev.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return prev;
    });

    try {
      const response = await deletePostComment(String(targetPostId), commentId);
      const updatedPostFromServer = response.data?.post;

      if (updatedPostFromServer) {
        setPosts(prev => prev.map(p => {
          if (p.id === targetPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...p,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return p;
        }));

        if (selectedPost?.id === targetPostId) {
          setSelectedPost((prev: any) => prev ? { ...prev, ...updatedPostFromServer, top_comments: (Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : []).slice(0, 2) } : prev);
        }

        setSelectedCommentPost((prev: any) => {
          if (prev?.id === targetPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...prev,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.warn('Failed to delete comment:', error);
      setPostComments(originalComments);
      setSelectedCommentPost(originalPost);
      setPosts(prev => prev.map(p => p.id === targetPostId ? originalPost : p));
      if (selectedPost?.id === targetPostId) setSelectedPost(originalPost);
      const detail = error.response?.data?.detail || error.message;
      Alert.alert('Error', detail || 'Could not delete comment. Please try again.');
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
    const appLink = post?.id ? `sanatanlok://post/${post.id}` : 'sanatanlok://';
    const mediaUrl = post?.media_url || '';
    const caption = post?.caption ? `\nCaption: ${post.caption}` : '';
    const message = `Check this post on Brahmand!${caption}\n\n${appLink}`;

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
    const isVideo =
      !!rawUrl.match(/\.(mp4|mov|m4v|webm|m3u8|avi|mkv|flv|wmv)(\?|$)/i) ||
      item.media_type === 'video' ||
      item.is_video ||
      item.isVideo;
    const displayUrl = item.thumbnail_url || item.thumbnailUrl || item.image_url || item.image || rawUrl;
    const isGallery = !isVideo && (item.media_count > 1 || item.is_carousel || item.carousel);

    return (
      <Pressable
        style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
        onPress={() => openPostModal(item)}
      >
        {displayUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={styles.gridImage}
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name={isVideo ? 'videocam' : 'image-outline'} size={24} color={COLORS.textLight} />
          </View>
        )}

        <View style={styles.mediaTypeBadge}>
          <Ionicons
            name={isVideo ? 'videocam' : isGallery ? 'images' : 'image'}
            size={14}
            color="#FFF"
          />
        </View>

        {/* View and Comment Count Overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.1)',
          justifyContent: 'flex-end',
          padding: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: 'flex-start',
              gap: 4,
            }}>
              <Ionicons name="play" size={10} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                {item.views_count || 0}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: 'flex-start',
              gap: 4,
            }}>
              <Ionicons name="chatbubble" size={10} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                {item.comments_count || 0}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const formatStat = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(value);
  };

  const followersCount =
    profile?.followers_count ?? (Array.isArray(profile?.followers) ? profile.followers.length : 0);
  const followingCount =
    profile?.following_count ?? (Array.isArray(profile?.following) ? profile.following.length : 0);
  const locationLabel = (() => {
    const loc = profile?.home_location || user?.home_location;
    if (!loc) return null;
    const city = loc.city || '';
    const state = loc.state || '';
    return [city, state].filter(Boolean).join(', ');
  })();

  const renderStatCell = (
    icon: string,
    value: number,
    label: string,
    onPress?: () => void
  ) => {
    const content = (
      <>
        <Ionicons name={icon as any} size={16} color="rgba(255,255,255,0.85)" />
        <Text style={styles.glassStatValue}>{formatStat(value)}</Text>
        <Text style={styles.glassStatLabel}>{label}</Text>
      </>
    );
    if (onPress) {
      return (
        <TouchableOpacity style={styles.glassStatCell} activeOpacity={0.8} onPress={onPress}>
          {content}
        </TouchableOpacity>
      );
    }
    return <View style={styles.glassStatCell}>{content}</View>;
  };

  const renderHeader = () => {
    const coverUri = profile?.cover_photo || user?.cover_photo || DEFAULT_COVER;
    const navSpacerHeight = insets.top + NAV_BAR_HEIGHT;

    return (
      <View style={styles.headerContent}>
        <ImageBackground
          source={{ uri: coverUri }}
          style={styles.heroBackdrop}
          imageStyle={styles.heroBackdropImage}
        >
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.28)',
              'rgba(0,0,0,0.18)',
              'rgba(0,0,0,0.42)',
              'rgba(0,0,0,0.72)',
            ]}
            locations={[0, 0.22, 0.62, 1]}
            style={styles.heroBackdropGradient}
          />

          <Pressable
            style={styles.heroBackdropTap}
            onPress={() => showImageSourcePicker('cover_photo')}
          />

          <TouchableOpacity
            style={[styles.coverEditBadge, { bottom: 20 }]}
            onPress={() => showImageSourcePicker('cover_photo')}
          >
            <Ionicons name="camera" size={14} color="#FFF" />
          </TouchableOpacity>

          {/* Image continues behind status bar + nav; content starts below nav */}
          <View style={{ height: navSpacerHeight }} />

          <View style={styles.heroProfileBlock}>
            <Pressable style={styles.avatarWrap} onPress={showAvatarOptions}>
              <View style={styles.avatarRing}>
                <Avatar
                  name={profile?.name || user?.name || 'User'}
                  photo={profile?.photo || user?.photo}
                  size={AVATAR_SIZE}
                />
              </View>
              <View style={styles.onlineDot} />
            </Pressable>

            <View style={styles.heroNameRow}>
              <Text style={styles.heroDisplayName}>{profile?.name || user?.name || 'User'}</Text>
              {(profile?.is_verified ||
                user?.is_verified ||
                user?.personality_verification_status === 'approved') && (
                <MaterialCommunityIcons name="check-decagram" size={18} color="#FF6B00" style={{ marginLeft: 6 }} />
              )}
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={openBioEditor}>
              <Text style={styles.heroBioText}>
                {profile?.bio || user?.bio || t('tapToAddBio')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.heroLocationRow} activeOpacity={0.85} onPress={openLocationEditor}>
              <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroLocationText}>
                {locationLabel || t('tapToAddLocation')}
              </Text>
            </TouchableOpacity>

            <View style={styles.glassStatsCard}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
              ) : null}
              <View style={styles.glassStatsOverlay}>
                {renderStatCell('trending-up', followersCount, t('followers'), () =>
                  router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })
                )}
                <View style={styles.glassStatDivider} />
                {renderStatCell('people', followingCount, t('following'), () =>
                  router.push({ pathname: '/follow-connections', params: { tab: 'following' } })
                )}
                <View style={styles.glassStatDivider} />
                {renderStatCell('grid-outline', postsCount, t('postCount'))}
              </View>
            </View>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', '#000000']}
            locations={[0, 0.7, 1]}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />
        </ImageBackground>

        <View style={styles.heroActionsBelow}>
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.addPostButton, pressed && styles.actionPressed]}
              onPress={() => setShowUploadModal(true)}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addPostButtonText}>{t('addPost')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.shareProfileButton, pressed && styles.actionPressed]}
              onPress={handleShareProfile}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyNav, { paddingTop: insets.top, height: insets.top + NAV_BAR_HEIGHT }]}
      >
        <TouchableOpacity style={styles.navLeft} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Animated.View style={[styles.navCenter, { opacity: navTitleOpacity }]}>
          <Text style={styles.navTitle} numberOfLines={1}>
            {profile?.sl_id || user?.sl_id || 'Profile'}
          </Text>
        </Animated.View>
        <TouchableOpacity style={styles.navRight} onPress={() => setShowSettingsModal(true)}>
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {renderHeader()}
      <Animated.FlatList
        style={{ flex: 1 }}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item.id ? `post-${item.id}` : `post-idx-${index}`}
        numColumns={3}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
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
              <Text style={styles.settingsTitle}>{t('settingsTitle')}</Text>
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

          {/* Comment Modal nested inside Post Detail Modal */}
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
                  <Text style={styles.sheetTitle}>Comments ({selectedCommentPost?.comments_count ?? postComments.length ?? 0})</Text>
                  <TouchableOpacity onPress={() => { setCommentModalVisible(false); }}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

              {commentsLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
              ) : (
                <FlatList
                  data={postComments}
                  keyExtractor={(item, index) => item.id || String(index)}
                  renderItem={({ item }) => {
                    const canDelete = item.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                    return (
                      <View style={styles.commentItem}>
                        <Avatar name={item.username || 'User'} photo={item.user_photo} size={36} />
                        <View style={styles.commentContent}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.commentUser}>{item.username || 'User'}</Text>
                            {canDelete && (
                              <TouchableOpacity
                                style={{ padding: 4, marginRight: -4 }}
                                onPress={() => handleDeleteComment(item)}
                              >
                                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                              </TouchableOpacity>
                            )}
                          </View>
                          <MentionText style={styles.commentText} text={item.text || ''} />
                        </View>
                      </View>
                    );
                  }}
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

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cgModalContent}>
            <View style={styles.cgModalHeader}>
              <Text style={styles.cgModalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cgItem}
              onPress={async () => {
                await setLanguage('en');
                setShowLanguageModal(false);
              }}
            >
              <Text style={[styles.cgItemText, language === 'en' && styles.cgItemTextSelected]}>
                {t('english')}
              </Text>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cgItem}
              onPress={async () => {
                await setLanguage('hi');
                setShowLanguageModal(false);
              }}
            >
              <Text style={[styles.cgItemText, language === 'hi' && styles.cgItemTextSelected]}>
                {t('hindi')}
              </Text>
              {language === 'hi' && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
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

      <Modal visible={showBioModal} transparent animationType="fade">
        <View style={styles.editFieldOverlay}>
          <View style={styles.editFieldCard}>
            <Text style={styles.editFieldTitle}>Edit bio</Text>
            <TextInput
              value={bioDraft}
              onChangeText={setBioDraft}
              style={styles.editFieldInput}
              placeholder="Write something about you..."
              placeholderTextColor="#888"
              multiline
              maxLength={500}
            />
            <View style={styles.editFieldActions}>
              <TouchableOpacity onPress={() => setShowBioModal(false)}>
                <Text style={styles.editFieldCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveBio} disabled={savingProfileField}>
                <Text style={styles.editFieldSave}>{savingProfileField ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLocationModal} transparent animationType="fade">
        <View style={styles.editFieldOverlay}>
          <View style={styles.editFieldCard}>
            <Text style={styles.editFieldTitle}>Edit location</Text>
            <TextInput
              value={locationDraft}
              onChangeText={setLocationDraft}
              style={styles.editFieldInputSingle}
              placeholder="Mumbai, Maharashtra"
              placeholderTextColor="#888"
            />
            <View style={styles.editFieldActions}>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Text style={styles.editFieldCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveLocation} disabled={savingProfileField}>
                <Text style={styles.editFieldSave}>{savingProfileField ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  navLeft: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    overflow: 'hidden',
  },
  heroBackdrop: {
    width: '100%',
    overflow: 'hidden',
  },
  heroBackdropImage: {
    resizeMode: 'cover',
  },
  heroBackdropGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBackdropTap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  heroActionsBelow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#000000',
  },
  coverEditBadge: {
    position: 'absolute',
    right: 14,
    zIndex: 3,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroProfileBlock: {
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: AVATAR_SIZE / 2 + 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroDisplayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroBioText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  heroLocationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  glassStatsCard: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },
  glassStatsOverlay: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  glassStatCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  glassStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  glassStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  glassStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  addPostButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  addPostButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  shareProfileButton: {
    width: 48,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    margin: GRID_GAP / 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#141414',
  },
  gridItemPressed: {
    opacity: 0.88,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
  },
  gridImageLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    zIndex: 1,
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    padding: 4,
  },
  editFieldOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  editFieldCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editFieldTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  editFieldInput: {
    minHeight: 100,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
  },
  editFieldInputSingle: {
    height: 46,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  editFieldActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 16,
  },
  editFieldCancel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '600',
  },
  editFieldSave: {
    color: '#FF9E00',
    fontSize: 15,
    fontWeight: '700',
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
  inlineDeletePopover: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
    zIndex: 999,
  },
  inlineDeleteText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
