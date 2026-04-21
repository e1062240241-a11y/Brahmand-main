import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type * as ImageManipulatorType from 'expo-image-manipulator';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, Dimensions, TextInput, Animated, Easing, ActivityIndicator, Modal, Share, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { Avatar } from '../../src/components/Avatar';
import UploadPostModal from '../../src/components/UploadPostModal';
import PostFeedCard from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';
import { getAllUsers, getUserNotifications, getUnreadNotificationCount, followUser, unfollowUser, getUserProfile, updateProfile, getPostsFeed, togglePostLike, addPostComment, getPostComments, repostPost, deletePost, reportPost, viewPost, addPostHashtags, searchByHashtag, getUserPosts } from '../../src/services/api';

let feedImageManipulator: typeof ImageManipulatorType | null = null;
const getFeedImageManipulator = async () => {
  if (!feedImageManipulator) {
    feedImageManipulator = await import('expo-image-manipulator');
  }
  return feedImageManipulator;
};

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_HORIZONTAL_PADDING = SPACING.md * 2;
const MAX_SEARCH_WIDTH = SCREEN_WIDTH - CONTAINER_HORIZONTAL_PADDING;
const MIN_WIDTH = 60;
const FEED_PAGE_SIZE = 7;

const formatTimeAgo = (dateString: string | null | undefined) => {
  if (!dateString) return 'now';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'now';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
};

interface StatItemProps {
  value: string | number;
  label: string;
  onPress?: () => void;
}

const StatItem = ({ value, label, onPress }: StatItemProps) => (
  <TouchableOpacity onPress={onPress} style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function FeedScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { badgeDismissed, dismissBadge, resetBadgeDismissal } = useNotificationStore();
  const [searchActive, setSearchActive] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageDimensions, setSelectedImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null);
  const [cropOrigin, setCropOrigin] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(0);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [showUploadPostModal, setShowUploadPostModal] = useState(false);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [myRealPosts, setMyRealPosts] = useState<any[]>([]);
  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [showMyPostsModal, setShowMyPostsModal] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || 'Sanatan Lok Community');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);

  useEffect(() => {
    if (user && user.bio) {
      setBioText(user.bio);
    }
  }, [user]);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [activeVideoPostId, setActiveVideoPostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 40,
    minimumViewTime: 200,
  }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const visibleItem = viewableItems[0]?.item;
      if (!visibleItem) return;
      const visibleKey = String(visibleItem.id || visibleItem.media_url || '');
      setActiveVideoPostId((prev) => {
        if (prev !== visibleKey) {
          return visibleKey;
        }
        return prev;
      });
    }
  }, []);

  const cropOriginRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!cropModalVisible || !imageLayout) {
      return;
    }
    const size = Math.min(imageLayout.width, imageLayout.height) * 0.75;
    const origin = {
      x: (imageLayout.width - size) / 2,
      y: (imageLayout.height - size) / 2,
    };
    setCropSize(size);
    setCropOrigin(origin);
    cropOriginRef.current = origin;
  }, [cropModalVisible, imageLayout]);

  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const cropContainerRef = useRef<any>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef<string | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const initialCrop = useRef({ x: 0, y: 0, size: 0 });
  const isWeb = Platform.OS === 'web';

  const getPointerCoords = (event: any) => {
    if (event == null) return null;
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      return { x: event.clientX, y: event.clientY };
    }
    if (event.nativeEvent) {
      const native = event.nativeEvent;
      if (typeof native.locationX === 'number' && typeof native.locationY === 'number') {
        return { x: native.locationX, y: native.locationY };
      }
      if (typeof native.pageX === 'number' && typeof native.pageY === 'number') {
        return { x: native.pageX, y: native.pageY };
      }
    }
    return null;
  };

  const handlePointerDown = useCallback((event: any, handle?: string) => {
    if (!imageLayout) return;
    event?.stopPropagation?.();
    isDragging.current = true;
    isResizing.current = !!handle;
    resizeHandle.current = handle || null;

    const coords = getPointerCoords(event);
    if (!coords) return;

    if (isWeb) {
      const containerRect = cropContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const clickX = coords.x - containerRect.left;
      const clickY = coords.y - containerRect.top;
      lastPos.current = { x: clickX, y: clickY };
    } else {
      lastPos.current = { x: coords.x, y: coords.y };
    }

    initialCrop.current = {
      x: cropOriginRef.current.x,
      y: cropOriginRef.current.y,
      size: cropSize,
    };
  }, [imageLayout, cropSize, isWeb]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isDragging.current || !imageLayout) {
      return;
    }
    event?.stopPropagation?.();
    const coords = getPointerCoords(event);
    if (!coords) return;

    let mouseX = coords.x;
    let mouseY = coords.y;
    if (isWeb) {
      const containerRect = cropContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      mouseX -= containerRect.left;
      mouseY -= containerRect.top;
    }

    const dx = mouseX - lastPos.current.x;
    const dy = mouseY - lastPos.current.y;
    lastPos.current = { x: mouseX, y: mouseY };
    
    if (isResizing.current && resizeHandle.current) {
      const handle = resizeHandle.current;
      const minSize = 50;
      const maxSize = Math.min(imageLayout.width, imageLayout.height);
      let newSize = cropSize;
      let newOriginX = cropOriginRef.current.x;
      let newOriginY = cropOriginRef.current.y;
      
      if (handle === 'e' || handle === 'ne' || handle === 'se') {
        newSize = Math.max(minSize, Math.min(maxSize, cropSize + dx));
      }
      if (handle === 'w' || handle === 'nw' || handle === 'sw') {
        const potentialSize = Math.max(minSize, Math.min(maxSize, cropSize - dx));
        newOriginX = cropOriginRef.current.x + (cropSize - potentialSize);
        newSize = potentialSize;
      }
      if (handle === 's' || handle === 'sw' || handle === 'se') {
        newSize = Math.max(minSize, Math.min(maxSize, newSize + dy));
      }
      if (handle === 'n' || handle === 'nw' || handle === 'ne') {
        const potentialSize = Math.max(minSize, Math.min(maxSize, cropSize - dy));
        newOriginY = cropOriginRef.current.y + (cropSize - potentialSize);
        newSize = potentialSize;
      }
      
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      newOriginX = Math.max(0, Math.min(imageLayout.width - newSize, newOriginX));
      newOriginY = Math.max(0, Math.min(imageLayout.height - newSize, newOriginY));
      
      setCropSize(newSize);
      setCropOrigin({ x: newOriginX, y: newOriginY });
      cropOriginRef.current = { x: newOriginX, y: newOriginY };
    } else {
      const maxX = imageLayout.width - cropSize;
      const maxY = imageLayout.height - cropSize;
      let nextX = cropOriginRef.current.x + dx;
      let nextY = cropOriginRef.current.y + dy;
      nextX = Math.max(0, Math.min(maxX, nextX));
      nextY = Math.max(0, Math.min(maxY, nextY));
      
      setCropOrigin({ x: nextX, y: nextY });
      cropOriginRef.current = { x: nextX, y: nextY };
    }
  }, [cropSize, imageLayout]);

  const handlePointerUp = useCallback((event: any) => {
    event?.stopPropagation?.();
    isDragging.current = false;
    isResizing.current = false;
    resizeHandle.current = null;
  }, []);

  const searchAnim = useRef(new Animated.Value(0)).current;
  
  const toggleSearch = () => {
    const newValue = searchActive ? 0 : 1;
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchTerm('');
    }
    Animated.timing(searchAnim, {
      toValue: newValue,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const profilePhoto = user?.photo;
  const userName = user?.name || 'User';
  const currentUserId = (user as any)?.id;
  const myPosts = myRealPosts;
  const postsCount = myPosts.length;
  const followersCount = (user as any)?.followers?.length || 0;
  const followingCount = followingIds.length;

  useEffect(() => {
    setProfileImageError(false);
  }, [profilePhoto]);

  const syncCurrentUser = useCallback(async () => {
    try {
      const response = await getUserProfile();
      const profile = response.data || {};
      setFollowingIds(Array.isArray(profile.following) ? profile.following : []);
      updateUser(profile);
    } catch (error) {
      console.warn('Failed to sync current user profile:', error);
    }
  }, [updateUser]);

  const loadFeedPosts = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (append) {
      setLoadingMoreFeed(true);
    } else {
      setLoadingFeed(true);
    }

    try {
      const response = await getPostsFeed(FEED_PAGE_SIZE, offset);
      const payload = response.data;
      const incomingItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);
      const nextHasMore = typeof payload?.has_more === 'boolean'
        ? payload.has_more
        : incomingItems.length === FEED_PAGE_SIZE;

      if (append) {
        setFeedPosts((prev) => {
          const existingIds = new Set(prev.map((item) => item?.id));
          const dedupedIncoming = incomingItems.filter((item: any) => !existingIds.has(item?.id));
          return [...prev, ...dedupedIncoming];
        });
        setFeedOffset(offset + incomingItems.length);
      } else {
        setFeedPosts(incomingItems);
        setFeedOffset(incomingItems.length);
      }
      setHasMoreFeed(nextHasMore);
    } catch (error) {
      console.warn('Failed to load posts feed:', error);
    } finally {
      if (append) {
        setLoadingMoreFeed(false);
      } else {
        setLoadingFeed(false);
      }
    }
  }, []);

  const handleFollowUser = async (userId: string) => {
    const isFollowing = followingIds.includes(userId);
    const nextIds = isFollowing
      ? followingIds.filter((id) => id !== userId)
      : [...followingIds, userId];

    setFollowingIds(nextIds);

    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (error) {
      setFollowingIds(followingIds);
      console.warn('Follow request failed:', error);
    } finally {
      await syncCurrentUser();
    }
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Media library permission required to select a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length || !result.assets[0].uri) {
      return;
    }

    const asset = result.assets[0];
    setSelectedImageUri(asset.uri);
    setSelectedImageDimensions(asset.width && asset.height ? { width: asset.width, height: asset.height } : null);
    setImageLayout(null);
    setCropModalVisible(true);
  };

  const confirmCropImage = async () => {
    if (!selectedImageUri || !imageLayout) {
      return;
    }
    setUploadingPhoto(true);
    try {
      const realWidth = selectedImageDimensions?.width || imageLayout.width;
      const realHeight = selectedImageDimensions?.height || imageLayout.height;
      const widthScale = realWidth / imageLayout.width;
      const heightScale = realHeight / imageLayout.height;
      const cropRect = {
        originX: Math.max(0, Math.round(cropOrigin.x * widthScale)),
        originY: Math.max(0, Math.round(cropOrigin.y * heightScale)),
        width: Math.max(1, Math.round(cropSize * widthScale)),
        height: Math.max(1, Math.round(cropSize * heightScale)),
      };

      const ImageManipulator = await getFeedImageManipulator();
      const result = await ImageManipulator.manipulateAsync(
        selectedImageUri,
        [{ crop: cropRect }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!result.base64) {
        throw new Error('Failed to crop image');
      }

      const photo = `data:image/jpeg;base64,${result.base64}`;
      const response = await updateProfile({ photo });
      updateUser(response.data || {});
      setProfileImageError(false);
      setCropModalVisible(false);
      setSelectedImageUri(null);
      setSelectedImageDimensions(null);
      setImageLayout(null);
    } catch (error) {
      console.warn('Failed to crop or upload profile photo:', error);
      alert('Could not save cropped profile picture. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fetchNotifications = async () => {
    setNotificationLoading(true);
    try {
      const [countRes, notificationsRes] = await Promise.all([
        getUnreadNotificationCount(),
        getUserNotifications(),
      ]);

      const countValue = typeof countRes.data === 'number'
        ? countRes.data
        : Number(countRes.data?.unread_count ?? 0);
      if (!badgeDismissed) {
        setNotificationCount(countValue || 0);
      } else {
        setNotificationCount(0);
      }

      if ((countValue || 0) <= 0 && badgeDismissed) {
        resetBadgeDismissal();
      }

      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const loadMyRealPosts = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await getUserPosts(currentUserId, 50, 0);
      const payload = res.data;
      const items = Array.isArray(payload) ? payload : (payload?.items || []);
      setMyRealPosts(items);
    } catch (err) {
      console.warn('Failed to load my real posts:', err);
    }
  }, [currentUserId]);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    syncCurrentUser();
    fetchNotifications();
    loadMyRealPosts();
    if (!initialLoadDone.current && feedPosts.length === 0) {
      loadFeedPosts(0, false);
      initialLoadDone.current = true;
    }
  }, [syncCurrentUser, loadFeedPosts, loadMyRealPosts]);

  useEffect(() => {
    const timerId = setInterval(() => {
      syncCurrentUser();
    }, 4000);

    return () => clearInterval(timerId);
  }, [syncCurrentUser]);

  useEffect(() => {
    if (feedPosts.length > 0 && !activeVideoPostId) {
      const firstPost = feedPosts[0];
      const firstPostKey = firstPost.id || firstPost.media_url;
      const mediaType = String(firstPost?.media_type || '').toLowerCase();
      const isFirstVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(firstPost?.media_url || ''));
      if (isFirstVideo) {
        setActiveVideoPostId(firstPostKey);
      }
    }
  }, [feedPosts.length, activeVideoPostId]);

  useEffect(() => {
    const query = searchTerm.trim();
    if (!searchActive || !query) {
      setSearchResults([]);
      setHashtagResults([]);
      setLoadingUsers(false);
      return;
    }

    const debounce = setTimeout(async () => {
      if (query.startsWith('#')) {
        await searchHashtags(query);
        return;
      }

      setLoadingUsers(true);
      try {
        const res = await getAllUsers(query);
        setSearchResults(res.data || []);
      } catch (error) {
        console.warn('Failed to load users for search:', error);
        setSearchResults([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [searchTerm, searchActive]);

  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MIN_WIDTH, MAX_SEARCH_WIDTH],
  });

const searchIconOpacity = searchAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
  });

  const searchOpacity = searchAnim.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0, 1],
  });

  const filteredUsers = searchResults;

  const handleNotificationPress = () => {
    dismissBadge();
    setNotificationCount(0);
    router.push('/notifications');
  };

  const handleProfilePhotoPress = () => {
    setShowProfileActions(true);
  };

  const handleOpenChangeProfilePicture = () => {
    setShowProfileActions(false);
    pickProfileImage();
  };

  const handleOpenUploadPost = () => {
    setShowProfileActions(false);
    setShowUploadPostModal(true);
  };

  const handleUploadPostSuccess = (post: any) => {
    setFeedPosts((prev) => [post, ...prev]);
  };

  const handleLikePost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    const liked = !!post?.liked_by_me;
    const currentLikes = Number(post?.likes_count || 0);
    const optimisticPost = {
      ...post,
      liked_by_me: !liked,
      likes_count: liked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
    };

    setFeedPosts((prev) => prev.map((item) => (item.id === postId ? optimisticPost : item)));

    try {
      const response = await togglePostLike(postId);
      const updatedPost = response.data?.post;
      if (updatedPost) {
        setFeedPosts((prev) => prev.map((item) => (item.id === postId ? { ...item, ...updatedPost } : item)));
      }
    } catch (error) {
      console.warn('Failed to like/unlike post:', error);
      setFeedPosts((prev) => prev.map((item) => (item.id === postId ? post : item)));
      alert('Could not update like. Please try again.');
    }
  }, []);

  const handleOpenComment = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    setSelectedCommentPostId(postId);
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
    if (!selectedCommentPostId || !commentText.trim() || commentSubmitting) {
      return;
    }

    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPostId, commentText.trim());
      const updatedPost = response.data?.post;
      if (updatedPost) {
        setFeedPosts((prev) =>
          prev.map((item) => (item.id === selectedCommentPostId ? { ...item, ...updatedPost } : item))
        );
        setSelectedCommentPost((prev: any) => (prev?.id === selectedCommentPostId ? { ...prev, ...updatedPost } : prev));
      }

      const commentsResponse = await getPostComments(selectedCommentPostId, 300);
      setPostComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
      setCommentText('');
    } catch (error) {
      console.warn('Failed to add comment:', error);
      alert('Could not post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleShareExternal = async (post: any) => {
    const appLink = 'https://brahmand.app';
    const appText = 'brahmand.app';
    const mediaUrl = post?.media_url || '';
    const caption = post?.caption ? `\nCaption: ${post.caption}` : '';
    const message = `Check this post on Brahmand!${caption}\nApp: ${appText}\n${appLink}`;

    const isShareCancelledError = (error: any) => {
      const msg = String(error?.message || error || '').toLowerCase();
      return (
        msg.includes('cancel') ||
        msg.includes('dismiss') ||
        msg.includes('aborted') ||
        msg.includes('user did not share')
      );
    };

    const sharePayload = async (payload: { message: string; url?: string; title?: string }) => {
      const result = await Share.share(payload);
      if ((result as any)?.action === Share.dismissedAction) {
        return 'dismissed';
      }
      return 'shared';
    };

    try {
      if (FileSystemModule?.cacheDirectory && FileSystemModule?.downloadAsync && mediaUrl) {
        const inferredExt = post?.media_type === 'video' ? 'mp4' : 'jpg';
        const localPath = `${FileSystemModule.cacheDirectory}share-${Date.now()}.${inferredExt}`;
        const downloadRes = await FileSystemModule.downloadAsync(mediaUrl, localPath);
        const localMediaUri = downloadRes?.uri;

        if (localMediaUri) {
          await sharePayload({
            message,
            url: localMediaUri,
            title: 'Share via Brahmand',
          });
          return;
        }
      }

      await sharePayload({
        message: `${message}\n${mediaUrl}`,
        url: mediaUrl || appLink,
        title: 'Share via Brahmand',
      });
    } catch (error) {
      if (isShareCancelledError(error)) {
        return;
      }
      console.warn('Failed to open share sheet:', error);
      alert('Could not open share sheet. Please try again.');
    }
  };

  const handleSharePost = useCallback((post: any) => {
    setSelectedSharePost(post);
    setShareModalVisible(true);
  }, []);

  const handleRepost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    try {
      const response = await repostPost(postId);
      const repostedPost = response.data?.post;
      if (repostedPost) {
        setFeedPosts((prev) => [repostedPost, ...prev]);
      } else {
        await loadFeedPosts();
      }
      alert('Reposted to your feed.');
    } catch (error) {
      console.warn('Failed to repost:', error);
      alert('Could not repost. Please try again.');
    }
  }, [loadFeedPosts]);

  const searchHashtags = async (query: string) => {
    const normalizedQuery = query.trim().replace(/^#+/, '');
    if (!normalizedQuery) {
      setHashtagResults([]);
      return;
    }
    setLoadingHashtags(true);
    try {
      const response = await searchByHashtag(normalizedQuery, 20, 0);
      setHashtagResults(Array.isArray(response.data) ? response.data : response.data?.items || []);
    } catch (error) {
      console.warn('Failed to search hashtags:', error);
      setHashtagResults([]);
    } finally {
      setLoadingHashtags(false);
    }
  };

  useEffect(() => {
    if (!searchActive) {
      return;
    }

    const query = searchTerm.trim();
    // For hashtags, require at least #X (2 chars). For regular search, require at least 1 char.
    const minLength = query.startsWith('#') ? 2 : 1;
    if (!query || query.length < minLength) {
      setSearchResults([]);
      setHashtagResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      if (query.startsWith('#')) {
        await searchHashtags(query.replace(/^#+/, '#'));
      } else {
        setLoadingUsers(true);
        try {
          const res = await getAllUsers(query);
          setSearchResults(res.data || []);
        } catch (error) {
          console.warn('Failed to load users for search:', error);
          setSearchResults([]);
        } finally {
          setLoadingUsers(false);
        }
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [searchTerm, searchActive]);

  const handleDeletePost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    const deletedPost = post;
    setFeedPosts((prev) => prev.filter((item) => item.id !== postId));
    setMyRealPosts((prev) => prev.filter((item) => item.id !== postId));

    if (selectedCommentPostId === postId) {
      setCommentModalVisible(false);
      setSelectedCommentPostId(null);
      setSelectedCommentPost(null);
      setPostComments([]);
    }

    try {
      await deletePost(postId);
    } catch (error) {
      console.warn('Failed to delete post:', error);
      setFeedPosts((prev) => (prev.some((item) => item.id === postId) ? prev : [deletedPost, ...prev]));
      setMyRealPosts((prev) => (prev.some((item) => item.id === postId) ? prev : [deletedPost, ...prev]));
      alert('Could not delete post. Please try again.');
    }
  }, [selectedCommentPostId]);

  const handleReportPost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    try {
      await reportPost(postId, 'other', 'Reported from post menu');
      alert('Report submitted. Admin will review this post.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (detail) {
        alert(String(detail));
        return;
      }
      console.warn('Failed to report post:', error);
      alert('Could not submit report. Please try again.');
    }
  }, []);

  const handlePostMenuPress = useCallback((post: any) => {
    if (!post?.id) {
      return;
    }

    const isOwnPost = post?.user_id === currentUserId;

    if (isOwnPost) {
      handleDeletePost(post);
      return;
    }

    handleReportPost(post);
  }, [currentUserId, handleReportPost, handleDeletePost]);

  const handleOpenPostUserProfile = useCallback((post: any) => {
    if (!post?.user_id) {
      return;
    }
    router.push(`/profile/${post.user_id}`);
  }, [router]);

  const renderFeedItem = useCallback(({ item }: { item: any }) => {
    const postKey = String(item.id || item.media_url || '');
    return (
      <PostFeedCard
        key={postKey}
        post={item}
        onLike={handleLikePost}
        onComment={handleOpenComment}
        onShare={handleSharePost}
        onRepost={handleRepost}
        onUserPress={handleOpenPostUserProfile}
        onPostMenuPress={handlePostMenuPress}
        postMenuType={item?.user_id === currentUserId ? 'delete' : 'report'}
        isActive={activeVideoPostId === postKey}
      />
    );
  }, [
    handleLikePost,
    handleOpenComment,
    handleSharePost,
    handleRepost,
    handleOpenPostUserProfile,
    handlePostMenuPress,
    currentUserId,
    activeVideoPostId
  ]);

  const renderFeedHeader = () => (
    <>
      <View style={styles.topRow}>
        <Animated.View style={[styles.rightContainer, { width: searchWidth }]}> 
          <View style={styles.innerContent}>
            <Animated.View style={[styles.iconBtn, { opacity: searchIconOpacity }]}> 
              <TouchableOpacity style={styles.iconBtn} onPress={toggleSearch}>
                <Ionicons name="search" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={styles.iconBtn} onPress={handleNotificationPress}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/messages')}>
              <Ionicons name="paper-plane" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Animated.View style={[styles.searchBarWrapper, { opacity: searchOpacity }]}> 
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users or #hashtags..."
                  placeholderTextColor={COLORS.textLight}
                  autoFocus={searchActive}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                <TouchableOpacity style={styles.closeBtn} onPress={toggleSearch}>
                  <Ionicons name="close" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {searchTerm.trim().length > 0 ? (
        <View style={styles.searchResultsSection}>
          {searchTerm.trim().startsWith('#') ? (
            loadingHashtags ? (
              <Text style={styles.searchStatusText}>Loading hashtags...</Text>
            ) : hashtagResults.length > 0 ? (
              <View key="hashtag-result" style={styles.userResultItem}>
                <TouchableOpacity
                  style={styles.userResultContent}
                  activeOpacity={0.8}
                  onPress={() => {
                    const hashtag = searchTerm.trim().replace(/^#+/, '');
                    router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
                  }}
                >
                  <View style={[styles.hashtagIcon, { width: 44, height: 44, borderRadius: 22 }]}> 
                    <Ionicons name="pricetag" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.userResultText}>
                    <Text style={styles.userResultName}>#{searchTerm.trim().replace('#', '')}</Text>
                    <Text style={styles.userResultMeta}>{hashtagResults.length} posts</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.searchStatusText}>No posts found for this hashtag.</Text>
            )
          ) : loadingUsers ? (
            <Text style={styles.searchStatusText}>Loading users...</Text>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((item) => {
              const isFollowing = followingIds.includes(item.id);
              return (
                <View key={item.id} style={styles.userResultItem}>
                  <TouchableOpacity
                    style={styles.userResultContent}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/profile/${item.id}`)}
                  >
                    <Avatar name={item.name || 'User'} photo={item.photo} size={44} />
                    <View style={styles.userResultText}>
                      <Text style={styles.userResultName}>{item.name || 'Unknown'}</Text>
                      <Text style={styles.userResultMeta}>{item.sl_id || item.phone || ''}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    activeOpacity={0.8}
                    onPress={() => handleFollowUser(item.id)}
                  >
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.searchStatusText}>No users found.</Text>
          )}
        </View>
      ) : null}

      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <TouchableOpacity
            style={styles.profileImageTouchable}
            onPress={handleProfilePhotoPress}
            activeOpacity={0.8}
          >
            {profilePhoto && !profileImageError ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.profileImage}
                onError={() => setProfileImageError(true)}
              />
            ) : (
              <Avatar name={userName} photo={profilePhoto && !profileImageError ? profilePhoto : undefined} size={80} />
            )}
            {uploadingPhoto && (
              <View style={styles.photoUploadOverlay}>
                <ActivityIndicator size="small" color={COLORS.background} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <StatItem value={postsCount} label="posts" onPress={() => setShowMyPostsModal(true)} />
            <StatItem value={followersCount} label="followers" onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })} />
            <StatItem value={followingCount} label="following" onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following' } })} />
          </View>
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.displayName}>{userName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={styles.bioText}>{bioText}</Text>
            <TouchableOpacity onPress={() => setIsEditingBio(true)} style={{ marginLeft: 6 }}>
              <Ionicons name="pencil" size={12} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={isEditingBio} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Edit Bio</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 }}
              value={bioText}
              onChangeText={setBioText}
              maxLength={150}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setIsEditingBio(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setIsEditingBio(false);
                  try {
                    await updateProfile({ bio: bioText });
                    if (updateUser) {
                       updateUser({ ...user, bio: bioText });
                    }
                  } catch (error) {
                    console.warn('Failed to update bio:', error);
                    setBioText(user?.bio || 'Sanatan Lok Community');
                  }
                }}
                style={{ padding: 10, backgroundColor: COLORS.primary, borderRadius: 5 }}
              >
                <Text style={{ color: '#fff' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.divider} />
    </>
  );

  const renderEmptyComponent = () => (
    loadingFeed ? (
      <View style={styles.skeletonFeedContainer}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={`skeleton-${index}`} style={styles.skeletonCard}>
            <View style={styles.skeletonHeader}>
              <Animated.View style={[styles.skeletonAvatar, { opacity: pulseAnim }]} />
              <View style={styles.skeletonTitleGroup}>
                <Animated.View style={[styles.skeletonLineShort, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonLineLong, { opacity: pulseAnim }]} />
              </View>
            </View>
            <Animated.View style={[styles.skeletonMedia, { opacity: pulseAnim }]} />
            <View style={styles.skeletonFooter}>
              <Animated.View style={[styles.skeletonLineMedium, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonLineSmall, { opacity: pulseAnim }]} />
            </View>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.emptyText}>No posts yet</Text>
    )
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        ref={flatListRef}
        data={feedPosts}
        keyExtractor={(item) => String(item.id || item.media_url || '')}
        renderItem={renderFeedItem}
        ListHeaderComponent={renderFeedHeader()}
        ListFooterComponent={loadingMoreFeed ? <Text style={styles.feedMoreText}>Loading more posts...</Text> : null}
        ListEmptyComponent={renderEmptyComponent()}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMoreFeed && !loadingMoreFeed && !loadingFeed) {
            loadFeedPosts(feedOffset, true);
          }
        }}
        onEndReachedThreshold={0.5}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={2}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
      />
        <Modal visible={cropModalVisible} transparent animationType="fade">
          <View style={styles.cropModalOverlay}>
            <View style={styles.cropModalContent}>
              <Text style={styles.cropModalTitle}>Crop your profile picture</Text>
              {selectedImageUri ? (
                <View
                  style={[
                    styles.cropImageWrapper,
                    selectedImageDimensions
                      ? { aspectRatio: selectedImageDimensions.width / selectedImageDimensions.height }
                      : { aspectRatio: 1 },
                  ]}
                >
                  <View
                    ref={cropContainerRef}
                    style={styles.cropImageContainer}
                    onLayout={(event) => {
                      const { width, height } = event.nativeEvent.layout;
                      setImageLayout({ width, height });
                    }}
                    onPointerDown={isWeb ? (e) => handlePointerDown(e) : undefined}
                    onPointerMove={isWeb ? handlePointerMove : undefined}
                    onPointerUp={isWeb ? handlePointerUp : undefined}
                    onPointerLeave={isWeb ? handlePointerUp : undefined}
                    onStartShouldSetResponder={!isWeb ? () => true : undefined}
                    onResponderGrant={!isWeb ? (e: any) => handlePointerDown(e.nativeEvent) : undefined}
                    onResponderMove={!isWeb ? (e: any) => handlePointerMove(e.nativeEvent) : undefined}
                    onResponderRelease={!isWeb ? (e: any) => handlePointerUp(e.nativeEvent) : undefined}
                    onResponderTerminate={!isWeb ? (e: any) => handlePointerUp(e.nativeEvent) : undefined}
                  >
                    <Image
                      source={{ uri: selectedImageUri }}
                      style={styles.cropImagePreview}
                      resizeMode="contain"
                    />
                    {imageLayout ? (
                      <View
                        style={[
                          styles.cropOverlay,
                          {
                            left: cropOrigin.x,
                            top: cropOrigin.y,
                            width: cropSize,
                            height: cropSize,
                          },
                        ]}
                      >
                        {isWeb ? (
                          <>
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleNW]} 
                              onPointerDown={(e) => handlePointerDown(e, 'nw')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleN]} 
                              onPointerDown={(e) => handlePointerDown(e, 'n')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleNE]} 
                              onPointerDown={(e) => handlePointerDown(e, 'ne')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleE]} 
                              onPointerDown={(e) => handlePointerDown(e, 'e')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleSE]} 
                              onPointerDown={(e) => handlePointerDown(e, 'se')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleS]} 
                              onPointerDown={(e) => handlePointerDown(e, 's')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleSW]} 
                              onPointerDown={(e) => handlePointerDown(e, 'sw')}
                            />
                            <View 
                              style={[styles.resizeHandle, styles.resizeHandleW]} 
                              onPointerDown={(e) => handlePointerDown(e, 'w')}
                            />
                            <View 
                              style={styles.centerHandle} 
                              onPointerDown={(e) => handlePointerDown(e)}
                            />
                          </>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
              <Text style={styles.cropHint}>Drag or scroll to move and resize the crop area.</Text>
              <View style={styles.cropButtonRow}>
                <TouchableOpacity style={[styles.cropButton, styles.cropCancelButton]} onPress={() => setCropModalVisible(false)}>
                  <Text style={styles.cropButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cropButton, styles.cropConfirmButton]} onPress={confirmCropImage}>
                  <Text style={[styles.cropButtonText, styles.cropConfirmButtonText]}>Crop & Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={showProfileActions} transparent animationType="slide" onRequestClose={() => setShowProfileActions(false)}>
          <TouchableOpacity style={styles.unifiedModalOverlay} activeOpacity={1} onPress={() => setShowProfileActions(false)}>
            <View style={styles.unifiedBottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <View style={styles.bottomSheetContent}>
                <Text style={styles.bottomSheetTitle}>Create</Text>
                
                <TouchableOpacity style={styles.unifiedActionItem} onPress={handleOpenUploadPost}>
                  <View style={[styles.unifiedIconWrap, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="add-circle" size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.unifiedActionTextWrap}>
                    <Text style={styles.unifiedActionTitle}>New Post</Text>
                    <Text style={styles.unifiedActionDesc}>Share a photo or video</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.unifiedActionItem} onPress={handleOpenChangeProfilePicture}>
                  <View style={[styles.unifiedIconWrap, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="camera" size={24} color="#2196F3" />
                  </View>
                  <View style={styles.unifiedActionTextWrap}>
                    <Text style={styles.unifiedActionTitle}>Change Profile Photo</Text>
                    <Text style={styles.unifiedActionDesc}>Update your profile picture</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.unifiedCancelBtn} onPress={() => setShowProfileActions(false)}>
                  <Text style={styles.unifiedCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <UploadPostModal
          visible={showUploadPostModal}
          onClose={() => setShowUploadPostModal(false)}
          onUploadSuccess={handleUploadPostSuccess}
        />

        <SharePostModal
          visible={shareModalVisible}
          post={selectedSharePost}
          onClose={() => setShareModalVisible(false)}
          onShareExternal={() => {
            setShareModalVisible(false);
            if (selectedSharePost) handleShareExternal(selectedSharePost);
          }}
          onCopyLink={async () => {
            if (selectedSharePost?.id) {
              const Clipboard = await import('expo-clipboard');
              await Clipboard.setStringAsync(`https://brahmand.app/post/${selectedSharePost.id}`);
              alert('Link copied to clipboard');
              setShareModalVisible(false);
            }
          }}
          onDownload={async () => {
            if (selectedSharePost?.media_url && FileSystemModule?.downloadAsync) {
              try {
                const ext = selectedSharePost.media_type === 'video' ? 'mp4' : 'jpg';
                const localPath = `${FileSystemModule.documentDirectory}brahmand_post_${Date.now()}.${ext}`;
                await FileSystemModule.downloadAsync(selectedSharePost.media_url, localPath);
                alert('Saved to app documents');
              } catch (e) {
                alert('Download failed');
              }
            } else {
              alert('Download naturally unsupported');
            }
            setShareModalVisible(false);
          }}
        />

        <Modal
          visible={commentModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setCommentModalVisible(false);
            setSelectedCommentPostId(null);
            setSelectedCommentPost(null);
            setPostComments([]);
          }}
        >
          <KeyboardAvoidingView
            style={styles.unifiedModalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          >
            <View style={styles.unifiedBottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <View style={styles.commentSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Comments</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCommentModalVisible(false);
                    setSelectedCommentPostId(null);
                    setSelectedCommentPost(null);
                    setPostComments([]);
                  }}
                  style={styles.commentCloseBtn}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {selectedCommentPost?.caption ? (
                <View style={styles.commentPostPreview}>
                  <Avatar name={selectedCommentPost?.username || 'User'} photo={selectedCommentPost?.user_photo} size={32} />
                  <View style={styles.commentPreviewTextWrap}>
                    <Text style={styles.commentPreviewUser}>{selectedCommentPost?.username}</Text>
                    <Text style={styles.commentPreviewCaption} numberOfLines={2}>{selectedCommentPost.caption}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.commentListWrap}>
                {commentsLoading ? (
                  <Text style={styles.commentEmptyText}>Loading comments...</Text>
                ) : postComments.length > 0 ? (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {postComments.map((comment) => (
                      <View key={comment.id || `${comment.user_id}-${comment.created_at}-${comment.text}`} style={styles.commentItem}>
                        <Avatar name={comment?.username || 'User'} photo={comment?.user_photo} size={32} />
                        <View style={styles.commentBubble}>
                          <Text style={styles.commentItemUser}>{comment?.username || 'User'}</Text>
                          <Text style={styles.commentItemText}>{comment?.text || ''}</Text>
                          <Text style={styles.commentTime}>{formatTimeAgo(comment?.created_at)}</Text>
                        </View>
                        <TouchableOpacity style={styles.commentLikeBtn}>
                          <Ionicons name="heart-outline" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.commentEmptyState}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.border} />
                    <Text style={styles.commentEmptyText}>No comments yet.</Text>
                    <Text style={styles.commentEmptySubtext}>Be the first to comment!</Text>
                  </View>
                )}
              </View>

              <View style={styles.commentInputWrap}>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.commentSubmitBtn, !commentText.trim() && styles.commentSubmitDisabled]} 
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || commentSubmitting}
                >
                  {commentSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <Ionicons name="send" size={18} color={commentText.trim() ? COLORS.primary : COLORS.textLight} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={showMyPostsModal} transparent animationType="slide" onRequestClose={() => setShowMyPostsModal(false)}>
          <View style={styles.myPostsOverlay}>
            <View style={styles.myPostsSheet}>
              <View style={styles.myPostsHeader}>
                <Text style={styles.myPostsTitle}>My Posts ({postsCount})</Text>
                <TouchableOpacity onPress={() => setShowMyPostsModal(false)} style={styles.myPostsCloseBtn}>
                  <Ionicons name="close" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {myPosts.length > 0 ? (
                  myPosts.map((post) => (
                    <PostFeedCard
                      key={`my-${post.id || post.media_url}`}
                      post={post}
                      onLike={handleLikePost}
                      onComment={handleOpenComment}
                      onShare={handleSharePost}
                      onRepost={handleRepost}
                      onUserPress={handleOpenPostUserProfile}
                      onPostMenuPress={handlePostMenuPress}
                      postMenuType={post?.user_id === currentUserId ? 'delete' : 'report'}
                    />
                  ))
                ) : (
                  <Text style={styles.myPostsEmptyText}>You have not uploaded posts yet.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: 4,
    paddingBottom: 4,
  },
  rightContainer: {
    overflow: 'hidden',
  },
  innerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchBar: {
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  closeBtn: {
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    paddingHorizontal: 4,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '700',
  },
  notificationPanel: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.sm,
  },
  notificationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationCloseBtn: {
    marginLeft: SPACING.sm,
    padding: 6,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  markAllText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  notificationList: {
    maxHeight: 260,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(255,165,0,0.04)',
  },
  notificationItemLeft: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  notificationItemBody: {
    flex: 1,
  },
  notificationMeta: {
    marginLeft: SPACING.sm,
    alignItems: 'flex-end',
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 8,
  },
  notificationEmpty: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  notificationPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  notificationStatusText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  notificationTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'transparent',
  },
  profileSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: 4,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    paddingBottom: SPACING.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageTouchable: {
    marginRight: SPACING.xl,
    width: 80,
    height: 80,
  },
myPostsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  myPostsSheet: {
    height: '85%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 16,
    fontWeight: '700',
  },
  myPostsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
  },
  myPostsEmptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontSize: 14,
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  commentPostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentPreviewTextWrap: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  commentPreviewUser: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  commentPreviewCaption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  commentListWrap: {
    flex: 1,
    minHeight: 200,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  commentBubble: {
    flex: 1,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  commentItemUser: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 13,
  },
  commentItemText: {
    color: COLORS.text,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  commentLikeBtn: {
    padding: SPACING.xs,
  },
  commentEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  commentEmptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: SPACING.md,
  },
  commentEmptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  commentCloseBtn: {
    padding: SPACING.xs,
  },
  commentInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 21,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  commentSubmitBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  commentSubmitDisabled: {
    backgroundColor: COLORS.border,
  },
  commentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentCancelButton: {
    backgroundColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  commentSubmitButton: {
    backgroundColor: COLORS.primary,
  },
  commentCancelText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  commentSubmitText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  cropModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cropModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  cropImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.border,
  },
  cropImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.border,
  },
  cropOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  resizeHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  resizeHandleNW: { top: -10, left: -10 },
  resizeHandleN: { top: -10, left: '50%', marginLeft: -10 },
  resizeHandleNE: { top: -10, right: -10 },
  resizeHandleE: { top: '50%', right: -10, marginTop: -10 },
  resizeHandleSE: { bottom: -10, right: -10 },
  resizeHandleS: { bottom: -10, left: '50%', marginLeft: -10 },
  resizeHandleSW: { bottom: -10, left: -10 },
  resizeHandleW: { top: '50%', left: -10, marginTop: -10 },
  centerHandle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cropImageContainer: {
    flex: 1,
  },
  cropHint: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  cropButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cropButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropCancelButton: {
    backgroundColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  cropConfirmButton: {
    backgroundColor: COLORS.primary,
  },
  cropButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  cropConfirmButtonText: {
    color: COLORS.background,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '700',
  },
  nameSection: {
    marginTop: SPACING.md,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchResultsSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  userResultText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  hashtagIcon: {
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userResultName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  userResultMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  followButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonText: {
    color: COLORS.primary,
  },
  searchStatusText: {
    color: COLORS.textSecondary,
    paddingVertical: SPACING.sm,
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
    minHeight: SCREEN_WIDTH,
    paddingTop: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  feedMoreText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.md,
    fontSize: 13,
  },
  skeletonFeedContainer: {
    paddingVertical: SPACING.sm,
  },
  skeletonCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0E0E0',
    marginRight: SPACING.sm,
  },
  skeletonTitleGroup: {
    flex: 1,
    justifyContent: 'space-between',
  },
  skeletonLineShort: {
    width: '40%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginBottom: SPACING.xs,
  },
  skeletonLineLong: {
    width: '70%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  skeletonMedia: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: SPACING.md,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonLineMedium: {
    width: '55%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  skeletonLineSmall: {
    width: '25%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  unifiedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  unifiedBottomSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '90%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  bottomSheetContent: {
    paddingTop: SPACING.sm,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  unifiedActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  unifiedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unifiedActionTextWrap: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  unifiedActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  unifiedActionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unifiedCancelBtn: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  unifiedCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  editPostOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  editPostContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
  },
  editPostTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  editPostInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editPostButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  editPostButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  editPostCancel: {
    backgroundColor: COLORS.border,
  },
  editPostSave: {
    backgroundColor: COLORS.primary,
  },
  editPostCancelText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  editPostSaveText: {
    color: COLORS.background,
    fontWeight: '600',
  },
});
