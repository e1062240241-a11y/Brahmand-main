import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';
import UploadPostModal from '../../src/components/UploadPostModal';
import { RequestFormModal } from '../../src/components/RequestFormModal';
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
import HomeFeedTabs, { HOME_FEED_TABS_HEIGHT } from '../../src/components/HomeFeedTabs';
import {
  addPostComment,
  createCommunityRequest,
  deletePost,
  followUser,
  getAllUsers,
  getCommunities,
  getCommunityRequests,
  getPostComments,
  getPostsFeed,
  repostPost,
  reportPost,
  searchByHashtag,
  togglePostLike,
  unfollowUser,
  updateProfile,
  uploadUserPost,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  reverseGeocode,
} from '../../src/services/api';
import * as Location from 'expo-location';
import { getCurrentGayatriEnd, isWithinGayatriMantraWindow, formatTime } from '../../src/features/live-mantra/schedule';
import { formatTimeAgo } from '../../src/utils/dateUtils';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_PADDING = 16;
const CARD_RADIUS = 18;

const shivaImage = require('../../assets/images/image temple/MahakalTemple.webp');
const FEED_PAGE_SIZE = 7;

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

const quickAccess = [
  { label: 'My Krishna', subtitle: 'AI Dharma Guidance', color: '#FFF' },
  { label: 'SOS', subtitle: 'Sanatan People Around You', color: '#FFF', urgent: true },
  { label: 'Panchang', subtitle: 'Vedic View', color: '#FFF', calendarIcon: true },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Yash';
  const avatarUri = user?.photo;
  const currentUserId = (user as any)?.id;
  const [bioText, setBioText] = useState(user?.bio || 'Sanatan Lok Community');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [activeTab, setActiveTab] = useState('for_you');
  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [showUploadPostModal, setShowUploadPostModal] = useState(false);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [liveLocation, setLiveLocation] = useState<string>('Detecting...');

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem('recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load recent searches:', e);
    }
  };

  const saveRecentSearch = async (searchItem: any) => {
    try {
      const updated = [searchItem, ...recentSearches.filter(item => item.id !== searchItem.id)].slice(0, 4);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent search:', e);
    }
  };

  useEffect(() => {
    const fetchLiveLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        
        // Use native reverse geocoding for exact details
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse.length > 0) {
          const place = reverse[0];
          // Construct most exact location possible: Name/Street + SubLocality/District + City
          const parts = [
            place.name || place.street,
            place.subLocality || place.district,
            place.city
          ].filter(Boolean);
          
          // Only take top 2 most specific parts to keep it clean but exact
          const exactLocation = parts.slice(0, 2).join(', ') || 'Bharat';
          
          setLiveLocation(exactLocation);
        } else {
          // Fallback to API if native fails
          const response = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
          if (response.data) {
            setLiveLocation(response.data.area || response.data.city || 'Bharat');
          }
        }
      } catch (e) {
        console.warn('Initial location fetch failed:', e);
      }
    };
    fetchLiveLocation();
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await getUnreadNotificationCount();
        setUnreadCount(res.data.unread_count || 0);
      } catch (err) {
        console.log('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  const handleNotificationPress = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
    } catch (err) {
      console.log('Failed to mark notifications as read:', err);
    }
    router.push('/notifications');
  };

  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>(
    Array.isArray((user as any)?.following) ? (user as any).following : []
  );
  const [communityRequests, setCommunityRequests] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'Help' | 'Blood' | 'Medical' | 'Financial' | 'Petition'>('Help');
  const [now, setNow] = useState(new Date());
  const scrollViewRef = useRef<ScrollView | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadFeedPosts(0, false);
    }, [loadFeedPosts])
  );
  const feedTabsYRef = useRef(0);
  const [feedTabsY, setFeedTabsY] = useState(0);
  const [postOffsets, setPostOffsets] = useState<Record<string, number>>({});
  const [postHeights, setPostHeights] = useState<Record<string, number>>({});
  const [postSnapEnabled, setPostSnapEnabled] = useState(false);
  const [activePostKey, setActivePostKey] = useState<string | null>(null);
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
        setFeedPosts(prev => [response.data, ...prev]);
      }
    } catch (error: any) {
      console.warn('[Home] Background upload failed:', error.message || error);
      Alert.alert('Upload Failed', error?.message || 'Could not upload post. Ensure your connection is stable.');
    } finally {
      setBackgroundUpload({ uploading: false, progress: 0, isCompressing: false });
    }
  };

  useEffect(() => {
    setBioText(user?.bio || 'Sanatan Lok Community');
  }, [user?.bio]);

  const goTo = (route: string) => {
    router.push(route as any);
  };

  useEffect(() => {
    setFollowingIds(Array.isArray((user as any)?.following) ? (user as any).following : []);
  }, [user]);

  useEffect(() => {
    const query = searchTerm.trim();
    if (!searchActive || !query) {
      setSearchResults([]);
      setHashtagResults([]);
      setLoadingUsers(false);
      setLoadingHashtags(false);
      return;
    }

    const debounce = setTimeout(async () => {
      if (query.startsWith('#')) {
        const normalizedQuery = query.replace(/^#+/, '');
        if (!normalizedQuery) {
          setHashtagResults([]);
          return;
        }
        setLoadingHashtags(true);
        try {
          const response = await searchByHashtag(normalizedQuery, 20, 0);
          setHashtagResults(Array.isArray(response.data) ? response.data : response.data?.items || []);
        } catch (error) {
          console.warn('Failed to search hashtags from home:', error);
          setHashtagResults([]);
        } finally {
          setLoadingHashtags(false);
        }
        return;
      }

      setLoadingUsers(true);
      try {
        const res = await getAllUsers(query);
        setSearchResults(res.data || []);
      } catch (error) {
        console.warn('Failed to load users for home search:', error);
        setSearchResults([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [searchTerm, searchActive]);

  const loadFeedPosts = useCallback(async (offset: number = 0, append: boolean = false, tabOverride?: string) => {
    const tabToLoad = tabOverride || activeTab;
    let hasCachedData = false;

    if (!append && offset === 0) {
      try {
        const cacheKey = `home_feed_cache_${tabToLoad}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFeedPosts(parsed);
            setFeedOffset(parsed.length);
            hasCachedData = true;
          }
        }
      } catch (e) {
        console.warn('Failed to parse home feed cache', e);
      }
    }

    if (append) {
      setLoadingMoreFeed(true);
    } else if (!hasCachedData) {
      setLoadingFeed(true);
    }

    try {
      const response = await getPostsFeed(FEED_PAGE_SIZE, offset, tabToLoad);
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
          return [...prev, ...incomingItems.filter((item: any) => !existingIds.has(item?.id))];
        });
        setFeedOffset(offset + incomingItems.length);
      } else {
        setFeedPosts(incomingItems);
        setFeedOffset(incomingItems.length);
        const cacheKey = `home_feed_cache_${tabToLoad}`;
        AsyncStorage.setItem(cacheKey, JSON.stringify(incomingItems)).catch(() => { });
      }
      setHasMoreFeed(nextHasMore);
    } catch (error: any) {
      console.warn('Failed to load posts feed on home:', error);
      if (!append && !hasCachedData) {
        setFeedPosts([]);
      }
    } finally {
      setLoadingFeed(false);
      setLoadingMoreFeed(false);
    }
  }, []);

  useEffect(() => {
    loadFeedPosts(0, false, activeTab);
  }, [loadFeedPosts, activeTab]);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      // If we are already on home tab, scroll to top
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const liveActive = isWithinGayatriMantraWindow(now);
  const liveEnd = getCurrentGayatriEnd(now);
  const feedPostKeys = useMemo(
    () => feedPosts.map((post, index) => String(post.id || post.media_url || index)),
    [feedPosts],
  );


  const lastScrollTimeRef = useRef(0);

  const handleHomeScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const shouldSnapPosts = y >= Math.max(0, feedTabsYRef.current - 4);
    setPostSnapEnabled((prev) => (prev === shouldSnapPosts ? prev : shouldSnapPosts));

    // Visibility tracking for video autoplay - find post with most area in viewport
    let closestKey = null;
    let maxVisible = 0;
    const viewportTop = y;
    const viewportBottom = y + SCREEN_HEIGHT;

    for (const key of feedPostKeys) {
      const offset = postOffsets[key];
      const height = postHeights[key];
      if (typeof offset === 'number' && typeof height === 'number') {
        const postAbsoluteTop = offset + feedTabsYRef.current + HOME_FEED_TABS_HEIGHT;
        const postBottom = postAbsoluteTop + height;
        const visibleTop = Math.max(viewportTop, postAbsoluteTop);
        const visibleBottom = Math.min(viewportBottom, postBottom);
        const visibleAmount = Math.max(0, visibleBottom - visibleTop);
        // Only consider it a candidate if it occupies a significant portion of the screen (e.g. 40%)
        if (visibleAmount > maxVisible && visibleAmount > SCREEN_HEIGHT * 0.4) {
          maxVisible = visibleAmount;
          closestKey = key;
        }
      }
    }
    setActivePostKey(closestKey); // No fallback to prev, if none visible enough, stop all.

    // Infinite Scroll Logic
    if (hasMoreFeed && !loadingMoreFeed && !loadingFeed) {
      const scrollHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;
      if (y + layoutHeight > scrollHeight - 800) {
        loadFeedPosts(feedOffset, true);
      }
    }
  }, [feedPostKeys, postOffsets, postHeights]);

  const loadHomeRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const [requestsRes, communitiesRes] = await Promise.all([
        getCommunityRequests({ status: 'active', limit: 30 }),
        getCommunities(),
      ]);
      const requestsData = Array.isArray(requestsRes.data)
        ? requestsRes.data
        : (requestsRes.data?.items || requestsRes.data || []);
      const communitiesData = Array.isArray(communitiesRes.data)
        ? communitiesRes.data
        : (communitiesRes.data?.items || communitiesRes.data || []);
      setCommunityRequests(requestsData);
      setCommunities(communitiesData);
    } catch (error) {
      console.warn('Failed to load active home requests:', error);
      setCommunityRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeRequests();
  }, [loadHomeRequests]);

  const normalizeRequestText = (request: any) =>
    `${request?.title || ''} ${request?.description || ''} ${request?.support_needed || ''}`.toLowerCase();

  const formatRequestLocation = (request: any) => (
    request?.location ||
    request?.hospital_name ||
    request?.community_name ||
    user?.home_location?.area ||
    user?.location?.area ||
    'Nearby community'
  );



  const safeCommunityRequests = Array.isArray(communityRequests) ? communityRequests : [];
  const bloodRequest = safeCommunityRequests.find((item) => item?.request_type === 'blood');
  const cowRequest = safeCommunityRequests.find((item) => {
    const text = normalizeRequestText(item);
    return item?.request_type === 'help' && (text.includes('cow') || text.includes('gau') || text.includes('गौ'));
  });
  const dogRequest = safeCommunityRequests.find((item) => {
    const text = normalizeRequestText(item);
    return item?.request_type === 'help' && (text.includes('dog') || text.includes('animal') || text.includes('pet'));
  });



  const handleSaveBio = async () => {
    setIsEditingBio(false);
    try {
      await updateProfile({ bio: bioText });
      updateUser({ bio: bioText } as any);
    } catch (error) {
      console.warn('Failed to update bio:', error);
      setBioText(user?.bio || 'Sanatan Lok Community');
    }
  };

  const handleOpenChangeProfilePicture = async () => {
    setShowProfileActions(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Media library permission required to select a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      alert('Could not read selected image. Please try again.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const mime = asset.mimeType || 'image/jpeg';
      const photo = `data:${mime};base64,${asset.base64}`;
      const response = await updateProfile({ photo });
      updateUser((response.data || { photo }) as any);
    } catch (error) {
      console.warn('Failed to update profile photo from home:', error);
      alert('Could not save profile picture. Check connection and try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    const isFollowing = followingIds.includes(userId);
    const nextIds = isFollowing
      ? followingIds.filter((id) => id !== userId)
      : [...followingIds, userId];

    setFollowingIds(nextIds);
    updateUser({ following: nextIds } as any);

    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (error) {
      setFollowingIds(followingIds);
      updateUser({ following: followingIds } as any);
      console.warn('Follow request from home search failed:', error);
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
      alert('Could not update like. Please check your network.');
    }
  }, []);

  const handleOpenComment = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    setSelectedCommentPostId(postId);
    setSelectedCommentPost(post);
    setCommentText('');
    setCommentModalVisible(true);
    setCommentsLoading(true);

    try {
      const response = await getPostComments(postId, 50);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const handleSubmitComment = async () => {
    if (!selectedCommentPostId || !commentText.trim() || commentSubmitting) return;

    const textToPost = commentText.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic comment
    const optimisticComment = {
      id: tempId,
      text: textToPost,
      username: firstName || 'User',
      user_photo: avatarUri || '',
      created_at: new Date().toISOString(),
      is_optimistic: true,
    };

    // Add immediately to UI
    setPostComments(prev => [optimisticComment, ...prev]);
    setCommentText('');
    
    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPostId, textToPost);
      const updatedPost = response.data?.post;
      const serverComment = response.data?.comment;

      if (updatedPost) {
        setFeedPosts((prev) =>
          prev.map((item) => {
            if (item.id === selectedCommentPostId) {
              const currentTop = Array.isArray(item.top_comments) ? item.top_comments : [];
              return { 
                ...item, 
                ...updatedPost,
                // Ensure the new comment is shown in the 'outer' preview
                top_comments: [serverComment || optimisticComment, ...currentTop].slice(0, 2)
              };
            }
            return item;
          })
        );
        setSelectedCommentPost((prev: any) => (prev?.id === selectedCommentPostId ? { 
          ...prev, 
          ...updatedPost,
          top_comments: [serverComment || optimisticComment, ...(Array.isArray(prev.top_comments) ? prev.top_comments : [])].slice(0, 2)
        } : prev));
      }

      // Replace optimistic comment with official server comment to avoid duplication and lag
      if (serverComment) {
        setPostComments(prev => 
          prev.map(c => c.id === tempId ? { ...serverComment, is_optimistic: false } : c)
        );
      }
    } catch (error: any) {
      // Rollback on error
      setPostComments(prev => prev.filter(c => c.id !== tempId));
      const detail = error.response?.data?.detail || error.message;
      alert(detail || 'Could not post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

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
      alert('Could not open share sheet. Please try again.');
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

  const handleDeletePost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    const deletedPost = post;
    setFeedPosts((prev) => prev.filter((item) => item.id !== postId));
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
      alert('Could not delete post. Please try again.');
    }
  }, [selectedCommentPostId]);

  const handleReportPost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    try {
      await reportPost(postId, 'other', 'Reported from home feed menu');
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
    if (post?.user_id === currentUserId) {
      handleDeletePost(post);
      return;
    }
    handleReportPost(post);
  }, [currentUserId, handleDeletePost, handleReportPost]);

  const handleOpenPostUserProfile = useCallback((post: any) => {
    if (post?.user_id) {
      router.push(`/profile/${post.user_id}`);
    }
  }, [router]);

  const handleUploadPostSuccess = (post: any) => {
    setFeedPosts((prev) => [post, ...prev]);
    setFeedOffset((prev) => prev + 1);
  };

  const handleSubmitRequest = async (data: any) => {
    try {
      await createCommunityRequest({
        community_id: data.community_id,
        request_type: data.request_type,
        visibility_level: data.visibility_level || 'area',
        title: data.title || `${data.request_type} Request`,
        description: data.description || 'Request created from home tab',
        contact_number: data.contact_number,
        urgency_level: data.urgency_level || 'low',
        blood_group: data.blood_group,
        hospital_name: data.hospital_name,
        location: data.location,
        amount: data.amount,
        support_needed: data.support_needed,
        contact_person_name: data.contact_person_name,
      });
      Alert.alert('Success', 'Your request has been posted!');
      loadHomeRequests();
    } catch (error: any) {
      console.warn('Failed to create request from home:', error);
      const detail = error?.response?.data?.detail;
      throw new Error(typeof detail === 'string' ? detail : 'Failed to submit request');
    }
  };

  const renderFeedPost = useCallback(({ item, index }: { item: any; index: number }) => {
    const postKey = String(item.id || item.media_url || index);
    return (
      <View
        onLayout={(event) => {
          const y = event.nativeEvent.layout.y;
          const h = event.nativeEvent.layout.height;
          setPostOffsets((prev) => (prev[postKey] === y ? prev : { ...prev, [postKey]: y }));
          setPostHeights((prev) => (prev[postKey] === h ? prev : { ...prev, [postKey]: h }));
        }}
      >
        <PostFeedCard
          post={item}
          onLike={handleLikePost}
          onComment={handleOpenComment}
          onShare={handleSharePost}
          onRepost={handleRepost}
          onUserPress={handleOpenPostUserProfile}
          onPostMenuPress={handlePostMenuPress}
          postMenuType={item?.user_id === currentUserId ? 'delete' : 'report'}
          isActive={activePostKey === postKey}
          theme="light"
          isBlackBackground={false}
        />
      </View>
    );
  }, [activePostKey, currentUserId, handleLikePost, handleOpenComment, handleOpenPostUserProfile, handlePostMenuPress, handleRepost, handleSharePost]);

  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#FF8D57', '#EA9B76', '#F8EDE7', '#FFFFFF']} locations={[0, 0.18, 0.45, 0.75]} style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10 }
        ]}
        stickyHeaderIndices={[1]}
        onScroll={handleHomeScroll}
        onMomentumScrollEnd={handleHomeScroll}
        onScrollEndDrag={handleHomeScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        <View style={styles.upperContentWrapper}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile')}
                onLongPress={() => setShowProfileActions(true)}
              >
                <Avatar name={firstName} photo={avatarUri} size={55} />
              </TouchableOpacity>

              <View style={styles.greetingBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.greeting}>Namaste {firstName} 🙏</Text>
                  <View style={styles.liveLocationBadge}>
                    <Ionicons name="location" size={10} color="#FF6B00" />
                    <Text style={styles.liveLocationText}>{liveLocation}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.bioRow}
                  onPress={() => setIsEditingBio(true)}
                >
                  <Text style={styles.subGreeting} numberOfLines={1}>{bioText}</Text>
                  <Ionicons name="pencil" size={12} color="#000" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerIconButton}
                onPress={() => setSearchActive(!searchActive)}
              >
                <Ionicons name={searchActive ? "close-outline" : "search-outline"} size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerIconButton}
                onPress={handleNotificationPress}
              >
                <View>
                  <Ionicons name="notifications-outline" size={24} color="#000" />
                  {unreadCount > 0 && <View style={styles.notificationDot} />}
                </View>
              </TouchableOpacity>
            </View>
          </View>

        {searchActive ? (
          <View style={styles.searchPanel}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6F5C70" />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Recent Search..."
                placeholderTextColor="#8E7D90"
                autoFocus
              />
            </View>
            {searchTerm.trim().length > 0 ? (
              <View style={styles.searchResultsSection}>
                {searchTerm.trim().startsWith('#') ? (
                  loadingHashtags ? (
                    <Text style={styles.searchStatusText}>Loading hashtags...</Text>
                  ) : hashtagResults.length > 0 ? (
                    <TouchableOpacity
                      style={styles.userResultItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        const hashtag = searchTerm.trim().replace(/^#+/, '');
                        router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
                      }}
                    >
                      <View style={styles.hashtagIcon}>
                        <Ionicons name="pricetag" size={22} color="#8C36DB" />
                      </View>
                      <View style={styles.userResultText}>
                        <Text style={styles.userResultName}>#{searchTerm.trim().replace('#', '')}</Text>
                        <Text style={styles.userResultMeta}>{hashtagResults.length} posts</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.searchStatusText}>No posts found for this hashtag.</Text>
                  )
                ) : loadingUsers ? (
                  <Text style={styles.searchStatusText}>Loading users...</Text>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => {
                    const isFollowing = followingIds.includes(item.id);
                    return (
                      <View key={item.id} style={styles.userResultItem}>
                        <TouchableOpacity
                          style={styles.userResultContent}
                          activeOpacity={0.8}
                          onPress={() => {
                            saveRecentSearch(item);
                            router.push(`/profile/${item.id}`);
                          }}
                        >
                          <Avatar name={item.name || 'User'} photo={item.photo} size={42} />
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
            ) : recentSearches.length > 0 ? (
              <View style={styles.recentSearchSection}>
                <View style={styles.recentSearchHeader}>
                  <Text style={styles.recentSearchesTitle}>Recent Search</Text>
                  <TouchableOpacity onPress={async () => {
                    setRecentSearches([]);
                    await AsyncStorage.removeItem('recent_searches');
                  }}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentSearchList}
                >
                  {recentSearches.map((item) => (
                    <TouchableOpacity
                      key={`recent-${item.id}`}
                      style={styles.recentSearchItem}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/profile/${item.id}`)}
                    >
                      <Avatar name={item.name || 'User'} photo={item.photo} size={60} />
                      <Text style={styles.recentSearchName} numberOfLines={1}>
                        {item.name?.split(' ')[0] || 'User'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.topFeatureRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
              {quickAccess.map((item, idx) => {
                let cardBg = '#FFFFFF';
                let iconBg = '#FF8A3D';
                if (item.label === 'Panchang') {
                  cardBg = '#FFF9F0';
                  iconBg = '#FF9800';
                } else if (item.label === 'My Krishna') {
                  cardBg = '#FFF8EB';
                  iconBg = '#FF6B00';
                } else if (item.label === 'SOS') {
                  cardBg = '#FFF5F5';
                  iconBg = '#FF3B30';
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.featureCard, { backgroundColor: cardBg }]}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (item.label === 'Panchang') router.push('/panchang');
                      else if (item.label === 'My Krishna') router.push('/my-krishna');
                      else if (item.label === 'SOS') router.push('/sos');
                    }}
                  >
                    {item.label === 'SOS' ? (
                      <View style={styles.sosConcentricWrap}>
                        <View style={[styles.sosRing, { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,80,60,0.15)' }]}>
                          <View style={[styles.sosRing, { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,80,60,0.25)' }]}>
                            <View style={[styles.sosRing, { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,80,60,0.4)' }]}>
                              <View style={[styles.sosRing, { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF3B30' }]}>
                                <Text style={{ color: '#FFF', fontSize: 6, fontWeight: '900' }}>SOS</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
                        {item.label === 'My Krishna' ? (
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>ॐ</Text>
                        ) : (
                          <Ionicons name="calendar" size={18} color="#FFF" />
                        )}
                      </View>
                    )}
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>{item.label}</Text>
                      <Text style={styles.featureSubtitle} numberOfLines={2}>
                        {item.subtitle.replace('\n', ' ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#999" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>}

          <TouchableOpacity activeOpacity={0.95} style={styles.featuredLiveCard} onPress={() => goTo('/live-mantra')}>
            <ImageBackground source={shivaImage} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }}>
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.4, 1]} style={styles.featuredLiveOverlay}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                    <Text style={[styles.featuredLiveTitle, { color: '#FFF' }]}>Mahamrityunjaya Mantra</Text>
                  </View>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>

                <View style={styles.featuredLiveContent}>
                  <Text style={styles.featuredDevotees}>1,248 devotees are chanting</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Ionicons name="time-outline" size={14} color="#FFF" />
                    <Text style={[styles.featuredTime, { marginTop: 0, marginLeft: 6 }]}>Live until 5:00 PM</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.joinJaapButton} onPress={() => goTo('/live-mantra')}>
                      <Ionicons name="stats-chart" size={16} color="#FFF" style={{ transform: [{ rotate: '90deg' }] }} />
                      <Text style={styles.joinJaapText}>Join Live Jaap</Text>
                      <Ionicons name="chevron-forward" size={18} color="#FFF" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={[styles.liveDot, { backgroundColor: '#FF6A00' }]} />
                      <View style={styles.liveDot} />
                      <View style={styles.liveDot} />
                      <View style={styles.liveDot} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionCardsScroll}
            style={{ marginBottom: 20 }}
          >
            {/* Urgent Blood Request */}
            <LinearGradient colors={['#FFF5F5', '#FFE8E8']} style={styles.actionCard}>
              <View style={[styles.cardHeaderBadgeYellow, { borderColor: '#FFBABA', backgroundColor: '#FFF', position: 'absolute', top: -12, alignSelf: 'center' }]}>
                <Text style={[styles.cardBadgeTextDark, { color: '#E53935' }]}>{bloodRequest ? 'Urgent Request' : 'Your Community'}</Text>
              </View>
              <View style={[styles.cardMainContent, { alignItems: 'center', marginTop: 10 }]}>
                <View style={styles.cardIconRow}>
                  <Image source={require('../../assets/images/icon.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <Text style={[styles.cardTitleLargeDark, { textAlign: 'center' }]}>{bloodRequest ? `${bloodRequest.blood_group} Required` : 'Blood Request'}</Text>
                <Text style={[styles.cardSubtitleSmallDark, { textAlign: 'center' }]}>{bloodRequest ? formatRequestLocation(bloodRequest) : 'No active request'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.cardButtonOutline, { backgroundColor: '#FFEBEE', borderColor: '#E53935' }]}
                onPress={() => {
                  if (bloodRequest) {
                    router.push(`/community/${bloodRequest.community_id}?request_id=${bloodRequest.id}` as any);
                  } else {
                    setRequestType('Blood');
                    setShowRequestModal(true);
                  }
                }}
              >
                <Text style={[styles.cardButtonTextDark, { color: '#E53935' }]}>{bloodRequest ? 'View' : 'View'}</Text>
                <Ionicons name="chevron-forward" size={12} color="#E53935" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Register Business */}
            <LinearGradient colors={['#FFF8E6', '#FFF0CC']} style={styles.actionCard}>
              <View style={[styles.cardHeaderBadgeYellow, { borderColor: '#FFCC00', backgroundColor: '#FFF', position: 'absolute', top: -12, alignSelf: 'center' }]}>
                <Text style={[styles.cardBadgeTextDark, { color: '#FF9500' }]}>Free</Text>
              </View>
              <View style={[styles.cardMainContent, { alignItems: 'center', marginTop: 10 }]}>
                <View style={styles.cardIconRow}>
                  <Image source={require('../../assets/images/icon.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <Text style={[styles.cardTitleLargeDark, { textAlign: 'center' }]}>Register Your Business</Text>
                <Text style={[styles.cardSubtitleSmallDark, { textAlign: 'center' }]}>Become a verified sanatan vendor</Text>
              </View>
              <TouchableOpacity
                style={[styles.cardButtonOutline, { backgroundColor: '#FFEBB7', borderColor: '#FF9500' }]}
                onPress={() => router.push('/vendor/business-details')}
              >
                <Text style={[styles.cardButtonTextDark, { color: '#FF9500' }]}>Register Now</Text>
                <Ionicons name="chevron-forward" size={12} color="#FF9500" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Verified Vendor */}
            <LinearGradient colors={['#E6FFF0', '#CCFFE6']} style={styles.actionCard}>
              <View style={[styles.cardHeaderBadgeTeal, { borderColor: '#00C781', backgroundColor: '#FFF', position: 'absolute', top: -12, alignSelf: 'center' }]}>
                <Text style={[styles.cardBadgeTextDark, { color: '#00C781' }]}>Verified vendor</Text>
              </View>
              <View style={[styles.cardMainContent, { alignItems: 'center', marginTop: 10 }]}>
                <View style={styles.cardIconRow}>
                  <Image source={require('../../assets/images/icon.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <Text style={[styles.cardTitleLargeDark, { textAlign: 'center' }]}>Sai Flower Decorator</Text>
                <Text style={[styles.cardSubtitleSmallDark, { textAlign: 'center' }]}>Specialised in festival flower decor Andheri, Mumbai</Text>
              </View>
              <TouchableOpacity style={[styles.cardButtonOutlineTeal, { backgroundColor: '#B7E4C7', borderColor: '#00C781', borderWidth: 1 }]}>
                <Text style={[styles.cardButtonTextDark, { color: '#00C781' }]}>View</Text>
                <Ionicons name="chevron-forward" size={12} color="#00C781" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Live Aarti */}
            <LinearGradient colors={['#F8E6FF', '#F0CCFF']} style={styles.actionCard}>
              <View style={[styles.cardHeaderBadgePurple, { borderColor: '#8C36DB', backgroundColor: '#FFF', position: 'absolute', top: -12, alignSelf: 'center' }]}>
                <Text style={[styles.cardBadgeTextDark, { color: '#8C36DB' }]}>Temple</Text>
              </View>
              <View style={[styles.cardMainContent, { alignItems: 'center', marginTop: 10 }]}>
                <View style={styles.cardIconRow}>
                  <Image source={require('../../assets/images/icon.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <Text style={[styles.cardTitleLargeDark, { textAlign: 'center' }]}>Live Kedarnath Aarti</Text>
                <View style={[styles.cardNotifyRow, { justifyContent: 'center' }]}>
                  <Ionicons name="notifications-outline" size={14} color="#333" />
                  <Text style={[styles.cardNotifyText, { textAlign: 'center' }]}>Notify me for the upcoming events</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.cardButtonOutlinePurple, { backgroundColor: '#E0C3FC', borderColor: '#8C36DB', borderWidth: 1 }]}
                onPress={() => router.push('/live-mantra')}
              >
                <Text style={[styles.cardButtonTextDark, { color: '#8C36DB' }]}>Watch now</Text>
                <Ionicons name="chevron-forward" size={12} color="#8C36DB" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.activeDot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View
          style={styles.stickyFeedTabsShell}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            feedTabsYRef.current = y;
            setFeedTabsY(y);
          }}
        >
          <View style={styles.stickyFeedTabs}>
            <HomeFeedTabs
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setFeedPosts([]);
                loadFeedPosts(0, false, tab);
              }}
              onCreatePost={() => setShowUploadPostModal(true)}
            />
          </View>
        </View>

        <View style={styles.feedPanel}>
          {backgroundUpload.uploading && (
            <View style={styles.uploadingStatusBar}>
              <View style={styles.uploadingStatusContent}>
                {backgroundUpload.mediaUri ? (
                  <Image source={{ uri: backgroundUpload.mediaUri }} style={styles.uploadingThumbnail} />
                ) : (
                  <View style={[styles.uploadingThumbnail, { backgroundColor: '#F0F0F0' }]} />
                )}
                <View style={styles.uploadingTextContainer}>
                  <Text style={styles.uploadingTitle}>
                    {backgroundUpload.isCompressing ? 'Processing Video...' : 'Posting new Video...'}
                  </Text>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={['#FFD26C', '#FF7F50', '#FF4500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${backgroundUpload.progress}%` }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
          {loadingFeed ? (
            <View style={styles.feedLoading}>
              <ActivityIndicator color="#FFD26C" />
              <Text style={styles.feedLoadingText}>Loading feed...</Text>
            </View>
          ) : feedPosts.length > 0 ? (
            <>
              {feedPosts.map((post, index) => {
                const postKey = String(post.id || post.media_url || index);
                return (
                  <View
                    key={postKey}
                    onLayout={(event) => {
                      const y = event.nativeEvent.layout.y;
                      const h = event.nativeEvent.layout.height;
                      setPostOffsets((prev) => (prev[postKey] === y ? prev : { ...prev, [postKey]: y }));
                      setPostHeights((prev) => (prev[postKey] === h ? prev : { ...prev, [postKey]: h }));
                    }}
                  >
                    <PostFeedCard
                      post={post}
                      onLike={handleLikePost}
                      onComment={handleOpenComment}
                      onShare={handleSharePost}
                      onRepost={handleRepost}
                      onUserPress={handleOpenPostUserProfile}
                      onPostMenuPress={handlePostMenuPress}
                      postMenuType={post?.user_id === currentUserId ? 'delete' : 'report'}
                      isActive={activePostKey === postKey}
                      theme="light"
                      isBlackBackground={false}
                    />
                  </View>
                );
              })}
              {hasMoreFeed && (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator color="#FFD26C" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedText}>No posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={isEditingBio} transparent animationType="fade">
        <View style={styles.bioModalOverlay}>
          <View style={styles.bioModalCard}>
            <Text style={styles.bioModalTitle}>Edit Bio</Text>
            <TextInput
              style={styles.bioInput}
              value={bioText}
              onChangeText={setBioText}
              maxLength={150}
              multiline
              placeholder="Write your bio"
              placeholderTextColor="#8A7B89"
            />
            <View style={styles.bioModalActions}>
              <TouchableOpacity
                onPress={() => {
                  setBioText(user?.bio || 'Sanatan Lok Community');
                  setIsEditingBio(false);
                }}
                style={styles.bioCancelButton}
              >
                <Text style={styles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBio} style={styles.bioSaveButton}>
                <Text style={styles.bioSaveText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showProfileActions} transparent animationType="slide" onRequestClose={() => setShowProfileActions(false)}>
        <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={() => setShowProfileActions(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.actionSheetTitle}>Create</Text>

            <TouchableOpacity
              style={styles.profileActionItem}
              activeOpacity={0.85}
              onPress={() => {
                setShowProfileActions(false);
                setShowUploadPostModal(true);
              }}
            >
              <View style={[styles.profileActionIconWrap, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="add-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.profileActionTextWrap}>
                <Text style={styles.profileActionTitle}>New Post</Text>
                <Text style={styles.profileActionDesc}>Share a photo or video</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A7B89" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileActionItem} activeOpacity={0.85} onPress={handleOpenChangeProfilePicture}>
              <View style={[styles.profileActionIconWrap, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="camera" size={24} color="#2196F3" />
              </View>
              <View style={styles.profileActionTextWrap}>
                <Text style={styles.profileActionTitle}>Change Profile Photo</Text>
                <Text style={styles.profileActionDesc}>Update your profile picture</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A7B89" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCancelButton} onPress={() => setShowProfileActions(false)}>
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <UploadPostModal
        visible={showUploadPostModal}
        onClose={() => setShowUploadPostModal(false)}
        onUploadSuccess={handleUploadPostSuccess}
        onUploadStart={handleUploadStart}
      />

      <RequestFormModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        requestType={requestType}
        communities={communities}
        user={user ?? undefined}
        onSubmit={handleSubmitRequest}
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
            } catch {
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
          style={styles.commentOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity 
            style={styles.modalBackgroundDismiss} 
            activeOpacity={1} 
            onPress={() => {
              setCommentModalVisible(false);
              setSelectedCommentPostId(null);
              setSelectedCommentPost(null);
              setPostComments([]);
            }} 
          />
          <View style={styles.commentSheet}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.commentSheetHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentModalVisible(false);
                  setSelectedCommentPostId(null);
                  setSelectedCommentPost(null);
                  setPostComments([]);
                }}
                style={styles.commentCloseBtn}
              >
                <Ionicons name="close" size={24} color="#22142E" />
              </TouchableOpacity>
            </View>

            {selectedCommentPost?.caption ? (
              <View style={styles.commentPostPreview}>
                <Avatar name={selectedCommentPost?.username || 'User'} photo={selectedCommentPost?.user_photo} size={32} />
                <View style={styles.commentPreviewTextWrap}>
                  <Text style={styles.commentPreviewUser}>{selectedCommentPost?.username}</Text>
                  <MentionText style={styles.commentPreviewCaption} numberOfLines={2} text={selectedCommentPost?.caption || ''} />
                </View>
              </View>
            ) : null}

            <View style={styles.commentListWrap}>
              {commentsLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={[styles.commentEmptyText, { marginTop: 10 }]}>Loading comments...</Text>
                </View>
              ) : postComments.length > 0 ? (
                <FlatList
                  data={postComments}
                  keyExtractor={(item) => item.id || `${item.user_id}-${item.created_at}`}
                  renderItem={({ item }) => (
                    <View style={styles.commentItem}>
                      <Avatar name={item?.username || 'User'} photo={item?.user_photo} size={32} />
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                        <MentionText style={styles.commentItemText} text={item?.text || ''} />
                        <Text style={styles.commentTime}>{formatTimeAgo(item?.created_at)}</Text>
                      </View>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              ) : (
                <View style={styles.commentEmptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={42} color="#D5C8D6" />
                  <Text style={styles.commentEmptyText}>No comments yet.</Text>
                  <Text style={styles.commentEmptySubtext}>Be the first to comment!</Text>
                </View>
              )}
            </View>

            <View style={styles.commentInputWrap}>
              <MentionInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#8A7B89"
                multiline
                inputStyle={styles.commentInput}
              />
              <TouchableOpacity
                style={[styles.commentSubmitBtn, !commentText.trim() && styles.commentSubmitDisabled]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting ? (
                  <ActivityIndicator size="small" color="#3B214E" />
                ) : (
                  <Ionicons name="send" size={18} color={commentText.trim() ? '#8C36DB' : '#A99AAA'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6A00',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FFD7C2',
  },
  liveLocationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 106,
  },
  upperContentWrapper: {
    paddingHorizontal: PAGE_PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 55,
    height: 55,
    borderRadius: 28,
    position: 'relative',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sosConcentricWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sosRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    marginLeft: 12,
  },
  greeting: {
    color: '#000',
    fontSize: 19,
    fontWeight: '600',
  },
  subGreeting: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.85,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  topFeatureRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minHeight: 80,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  urgentCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4D4D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentExclamation: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  calendarIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarIconText: {
    position: 'absolute',
    top: 8,
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  featureTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
    lineHeight: 12,
    textAlign: 'center',
  },
  featuredLiveCard: {
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  featuredLiveImage: {
    width: '100%',
    height: '100%',
  },
  featuredLiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 15,
    justifyContent: 'space-between',
    borderRadius: 15,
  },
  liveBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  featuredLiveContent: {
    marginBottom: 10,
  },
  featuredLiveTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredDevotees: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 5,
  },
  featuredTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  joinJaapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6A00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 8,
  },
  playIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinJaapText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionCardsScroll: {
    paddingRight: 20,
    paddingTop: 25,
    gap: 15,
  },
  actionCard: {
    width: 140,
    height: 240,
    borderRadius: 15,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  cardHeaderBadgeYellow: {
    backgroundColor: '#FFF5E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD6A5',
  },
  cardHeaderBadgeTeal: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  cardHeaderBadgePurple: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#CE93D8',
  },
  cardBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBadgeTextDark: {
    color: '#333',
    fontSize: 10,
    fontWeight: '900',
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 10,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  cardBadgeIcon: {
    marginRight: 4,
  },
  cardTypeLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  cardTitleLarge: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  cardTitleLargeDark: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardSubtitleSmallDark: {
    color: '#5A5A5A',
    fontSize: 12,
    fontWeight: '600',
  },
  cardLocationText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  cardNotifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  cardNotifyText: {
    color: '#5A5A5A',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  cardButtonWhite: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonWhiteText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  cardButtonOutline: {
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardButtonOutlineTeal: {
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardButtonOutlinePurple: {
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardButtonTextDark: {
    fontSize: 13,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCC',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
  },
  stickyFeedTabsShell: {
    backgroundColor: '#FFF',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 100,
  },
  stickyFeedTabs: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 10,
  },
  feedPanel: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  feedLoading: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  feedLoadingText: {
    color: '#F3D5C6',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyFeed: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedText: {
    color: '#F3D5C6',
    fontSize: 14,
    fontWeight: '800',
  },
  loadMoreButton: {
    height: 42,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#FFD26C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    color: '#321B3E',
    fontSize: 14,
    fontWeight: '900',
  },
  bioModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  bioModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    padding: 18,
  },
  bioModalTitle: {
    color: '#2F1725',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  bioInput: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: '#E5CDBB',
    borderRadius: 10,
    padding: 12,
    color: '#2F1725',
    fontSize: 14,
    fontWeight: '600',
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  bioModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  bioCancelButton: {
    paddingHorizontal: 14,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioCancelText: {
    color: '#6C5964',
    fontSize: 14,
    fontWeight: '800',
  },
  bioSaveButton: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#8C36DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  actionSheetTitle: {
    color: '#22142E',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  profileActionItem: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  profileActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileActionTextWrap: {
    flex: 1,
  },
  profileActionTitle: {
    color: '#22142E',
    fontSize: 15,
    fontWeight: '900',
  },
  profileActionDesc: {
    color: '#6F5C70',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionCancelButton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFE2EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCancelText: {
    color: '#22142E',
    fontSize: 14,
    fontWeight: '900',
  },
  commentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  commentSheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFF7ED',
    paddingBottom: 12,
  },
  bottomSheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8C8D6',
    marginTop: 10,
    marginBottom: 8,
  },
  commentSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  commentTitle: {
    color: '#22142E',
    fontSize: 18,
    fontWeight: '900',
  },
  commentCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E5EA',
  },
  commentPostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  commentPreviewTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  commentPreviewUser: {
    color: '#22142E',
    fontSize: 13,
    fontWeight: '900',
  },
  commentPreviewCaption: {
    color: '#5B4A55',
    fontSize: 12,
    marginTop: 2,
  },
  commentListWrap: {
    minHeight: 200,
    maxHeight: 360,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  commentItemUser: {
    color: '#22142E',
    fontSize: 13,
    fontWeight: '900',
  },
  commentItemText: {
    color: '#3A2C36',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  commentTime: {
    color: '#8A7B89',
    fontSize: 11,
    marginTop: 5,
  },
  commentEmptyState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentEmptyText: {
    color: '#5B4A55',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  commentEmptySubtext: {
    color: '#8A7B89',
    fontSize: 12,
    marginTop: 4,
  },
  commentInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5CDBB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#22142E',
    fontSize: 14,
  },
  commentSubmitBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E5EA',
  },
  commentSubmitDisabled: {
    opacity: 0.7,
  },
  postCard: {
    padding: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFB36D',
    borderWidth: 2,
    borderColor: '#FFE4B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    color: '#3A182E',
    fontSize: 20,
    fontWeight: '900',
  },
  postAuthor: {
    flex: 1,
    marginLeft: 10,
  },
  postName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  postMeta: {
    color: '#F1D6C8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  postTime: {
    color: '#EFD8C9',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
  },
  postText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 12,
  },
  postImage: {
    height: 158,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImageRadius: {
    borderRadius: 12,
  },
  bigPlay: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTime: {
    position: 'absolute',
    right: 9,
    bottom: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  actionRow: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bookmark: {
    marginLeft: 'auto',
  },
  uploadingStatusBar: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    padding: 16,
    zIndex: 5,
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
    color: '#1C1B1F',
    fontSize: 14,
    fontWeight: '700',
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
  // Search Styles
  searchPanel: {
    backgroundColor: '#FFF',
    marginHorizontal: PAGE_PADDING,
    marginTop: -10,
    marginBottom: 20,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  searchResultsSection: {
    marginTop: 15,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userResultText: {
    marginLeft: 12,
    flex: 1,
  },
  userResultName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  userResultMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#F0F0F0',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  followingButtonText: {
    color: '#666',
  },
  searchStatusText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 10,
  },
  hashtagIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#6F5C70',
    marginBottom: 0,
  },
  recentSearchSection: {
    marginTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  recentSearchList: {
    paddingRight: 20,
    gap: 20,
  },
  recentSearchItem: {
    alignItems: 'center',
    width: 70,
  },
  recentSearchName: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
  },
});
