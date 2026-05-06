import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';
import UploadPostModal from '../../src/components/UploadPostModal';
import { RequestFormModal } from '../../src/components/RequestFormModal';
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
} from '../../src/services/api';
import { getCurrentGayatriEnd, isWithinGayatriMantraWindow, formatTime } from '../../src/features/live-mantra/schedule';

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

type HomeRequestCard = {
  id: string;
  tone: 'urgent' | 'warm' | 'cool';
  icon?: string;
  emoji?: string;
  title: string;
  location: string;
  subtitle: string;
  footer: string;
  button: string;
  request?: any;
};

const quickAccess = [
  { label: 'Jaap', icon: 'ellipse-outline', route: '/mantra-jaap' },
  { label: 'Temple', icon: 'business-outline', route: '/temple' },
  { label: 'Community', icon: 'people-outline', route: '/messages' },
  { label: 'Services', icon: 'bag-handle-outline', route: '/vendor' },
];

const getHelpCardStyle = (tone: string) => {
  if (tone === 'urgent') return styles.urgentHelpCard;
  if (tone === 'warm') return styles.warmHelpCard;
  return styles.coolHelpCard;
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
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
  const feedTabsYRef = useRef(0);
  const [feedTabsY, setFeedTabsY] = useState(0);
  const [postOffsets, setPostOffsets] = useState<Record<string, number>>({});
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
      console.warn('Background upload failed:', error);
      Alert.alert('Upload Failed', error?.message || 'Could not upload post.');
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
        AsyncStorage.setItem(cacheKey, JSON.stringify(incomingItems)).catch(() => {});
      }
      setHasMoreFeed(nextHasMore);
    } catch (error) {
      console.warn('Failed to load posts feed on home:', error);
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
  const postSnapOffsets = useMemo(() => {
    if (!postSnapEnabled) return undefined;
    const offsets = feedPostKeys
      .map((key) => postOffsets[key])
      .filter((offset): offset is number => typeof offset === 'number')
      .map((offset) => Math.max(feedTabsY, offset - HOME_FEED_TABS_HEIGHT));

    return Array.from(new Set([feedTabsY, ...offsets])).sort((a, b) => a - b);
  }, [feedPostKeys, feedTabsY, postOffsets, postSnapEnabled]);

  const handleHomeScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const shouldSnapPosts = y >= Math.max(0, feedTabsYRef.current - 4);
    setPostSnapEnabled((prev) => (prev === shouldSnapPosts ? prev : shouldSnapPosts));

    // Visibility tracking for video autoplay - focus on screen center
    let closestKey = null;
    let minDiff = 9999; 
    const viewportCenter = y + (SCREEN_HEIGHT / 2);

    for (const key of feedPostKeys) {
      const offset = postOffsets[key];
      if (typeof offset === 'number') {
        // Assume post center is offset + 300 (approximate average height)
        const postCenter = offset + 250; 
        const diff = Math.abs(postCenter - viewportCenter); 
        if (diff < minDiff) {
          minDiff = diff;
          closestKey = key;
        }
      }
    }
    // Only set active if the closest post is reasonably centered
    if (minDiff < 400) {
      setActivePostKey(closestKey);
    } else {
      setActivePostKey(null);
    }

    // Infinite Scroll Logic
    if (hasMoreFeed && !loadingMoreFeed && !loadingFeed) {
      const scrollHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;
      if (y + layoutHeight > scrollHeight - 800) {
        loadFeedPosts(feedOffset, true);
      }
    }
  }, [feedPostKeys, postOffsets]);

  const loadHomeRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const [requestsRes, communitiesRes] = await Promise.all([
        getCommunityRequests({ status: 'active', limit: 30 }),
        getCommunities(),
      ]);
      setCommunityRequests(requestsRes.data || []);
      setCommunities(communitiesRes.data || []);
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

  const makeRequestCard = (
    id: string,
    request: any | undefined,
    fallback: Omit<HomeRequestCard, 'request'>
  ): HomeRequestCard => {
    if (!request) {
      return fallback;
    }
    const responseCount = Number(request?.response_count || request?.responses_count || request?.responded_count || 0);
    return {
      ...fallback,
      id,
      title: request.title || fallback.title,
      location: formatRequestLocation(request),
      subtitle: request.blood_group
        ? `${request.blood_group} blood required`
        : (request.description || request.support_needed || fallback.subtitle),
      footer: responseCount > 0 ? `${responseCount} responded` : 'Active request',
      button: fallback.button,
      request,
    };
  };

  const bloodRequest = communityRequests.find((item) => item?.request_type === 'blood');
  const cowRequest = communityRequests.find((item) => {
    const text = normalizeRequestText(item);
    return item?.request_type === 'help' && (text.includes('cow') || text.includes('gau') || text.includes('गौ'));
  });
  const dogRequest = communityRequests.find((item) => {
    const text = normalizeRequestText(item);
    return item?.request_type === 'help' && (text.includes('dog') || text.includes('animal') || text.includes('pet'));
  });

  const requestCards: HomeRequestCard[] = [
    makeRequestCard('blood', bloodRequest, {
      id: 'blood',
      tone: 'urgent',
      icon: 'flame',
      title: requestsLoading ? 'Checking Blood Requests' : 'No Blood Request',
      location: 'Your community',
      subtitle: requestsLoading ? 'Loading active requests' : 'All clear right now',
      footer: requestsLoading ? 'Please wait' : 'No active request',
      button: 'View',
    }),
    makeRequestCard('cow', cowRequest, {
      id: 'cow',
      tone: 'warm',
      emoji: '🐄',
      title: requestsLoading ? 'Checking Cow Seva' : 'No Cow Seva Request',
      location: 'Your community',
      subtitle: requestsLoading ? 'Loading active requests' : 'No active request',
      footer: requestsLoading ? 'Please wait' : 'All clear',
      button: 'View',
    }),
    makeRequestCard('dog', dogRequest, {
      id: 'dog',
      tone: 'cool',
      emoji: '🐕',
      title: requestsLoading ? 'Checking Dog Seva' : 'No Dog Seva Request',
      location: 'Your community',
      subtitle: requestsLoading ? 'Loading active requests' : 'No active request',
      footer: requestsLoading ? 'Please wait' : 'All clear',
      button: 'View',
    }),
  ];

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
      alert('Could not save profile picture. Please try again.');
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
      alert('Could not update like. Please try again.');
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
    if (!selectedCommentPostId || !commentText.trim() || commentSubmitting) return;

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

  return (
    <LinearGradient colors={['#170B35', '#27103D', '#4A2534']} style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[1]}
        onScroll={handleHomeScroll}
        scrollEventThrottle={16}
        snapToOffsets={postSnapOffsets}
        snapToEnd={false}
        decelerationRate="fast"
      >
        <View style={styles.upperContentWrapper}>
          <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.profileButton}
            onPress={() => setShowProfileActions(true)}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#FFE3A7', '#FF7A30']} style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            {uploadingPhoto && (
              <View style={styles.photoUploadOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Namaste, {firstName} 🙏</Text>
            <View style={styles.bioRow}>
              <Text style={styles.subGreeting} numberOfLines={2}>{bioText}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.bioEditButton}
                onPress={() => setIsEditingBio(true)}
              >
                <Ionicons name="pencil" size={13} color="#F5D8AE" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bellButton, searchActive && styles.searchButtonActive]}
            onPress={() => {
              setSearchActive((prev) => !prev);
              if (searchActive) {
                setSearchTerm('');
              }
            }}
          >
            <Ionicons name={searchActive ? 'close' : 'search'} size={24} color="#FFF7DD" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.bellButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={25} color="#FFF7DD" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {searchActive ? (
          <View style={styles.searchPanel}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6F5C70" />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search users or #hashtags..."
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
                          onPress={() => router.push(`/profile/${item.id}`)}
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
            ) : null}
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <TouchableOpacity activeOpacity={0.9} style={styles.panchangCard} onPress={() => goTo('/panchang')}>
            <View style={styles.calendarIcon}>
              <Ionicons name="calendar-outline" size={21} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.infoTitle}>Panchang</Text>
              <Text style={styles.infoMain}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              <Text style={styles.infoSub}>Vedic View</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={styles.gitaCard} onPress={() => goTo('/library/bhagvad-geeta')}>
            <View style={styles.gitaText}>
              <Text style={styles.infoTitle}>Bhagavad Gita</Text>
              <Text style={styles.shlok} numberOfLines={1}>कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।</Text>
            </View>
            <Text style={styles.bookEmoji}>📖</Text>
          </TouchableOpacity>
        </View>

        {liveActive ? (
          <TouchableOpacity activeOpacity={0.92} onPress={() => goTo('/live-mantra')}>
            <ImageBackground source={shivaImage} imageStyle={styles.liveImage} style={styles.liveCard}>
              <LinearGradient colors={['rgba(9,8,26,0.98)', 'rgba(14,13,38,0.7)', 'rgba(14,13,38,0.25)']} style={styles.liveOverlay}>
                <View style={styles.liveNowRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveNowText}>LIVE NOW</Text>
                </View>
                <Text style={styles.liveTitle}>Gayatri Mantra Jaap</Text>
                <Text style={styles.liveSub}>{liveEnd ? `Live until ${formatTime(liveEnd)}` : 'Collective Energy'}</Text>
                <View style={styles.joinButton}>
                  <View style={styles.playCircle}>
                    <Ionicons name="play" size={18} color="#7E35D8" />
                  </View>
                  <Text style={styles.joinText}>Join Live Jaap</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              </LinearGradient>
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.88} style={styles.liveOptionCard} onPress={() => goTo('/live-mantra')}>
            <View style={styles.liveOptionIcon}>
              <Ionicons name="radio-outline" size={22} color="#FFD26C" />
            </View>
            <View style={styles.liveOptionText}>
              <Text style={styles.liveOptionTitle}>Live Mantras</Text>
              <Text style={styles.liveOptionSub}>See timings and join when jaap starts</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFF0D4" />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Help Your Community</Text>
          <TouchableOpacity style={styles.viewAllButton} onPress={() => goTo('/messages')}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF0D4" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.helpList}
        >
          {requestCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.88}
              style={[styles.helpCard, getHelpCardStyle(card.tone)]}
              onPress={() => goTo('/messages')}
            >
              <View style={styles.helpTop}>
                {card.icon ? (
                  <Ionicons name={card.icon as any} size={22} color="#FFD26C" />
                ) : (
                  <Text style={styles.helpEmoji}>{card.emoji}</Text>
                )}
                {card.id === 'blood' && <Text style={styles.urgentLabel}>URGENT</Text>}
              </View>
              <Text style={styles.helpTitle}>{card.title}</Text>
              <Text style={styles.helpLocation}>{card.location}</Text>
              <Text style={styles.helpSubtitle}>{card.subtitle}</Text>
              <View style={styles.respondedRow}>
                <Ionicons name="people" size={15} color={card.id === 'blood' ? '#FFD1AF' : '#7A3F18'} />
                <Text style={styles.respondedText}>{card.footer}</Text>
              </View>
              <View style={[styles.helpButton, card.id === 'blood' && styles.urgentButton]}>
                <Text style={[styles.helpButtonText, card.id === 'blood' && styles.urgentButtonText]}>{card.button}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.createCard}
            onPress={() => {
              setRequestType('Help');
              setShowRequestModal(true);
            }}
          >
            <View style={styles.createIcon}>
              <Ionicons name="add" size={34} color="#3B214E" />
            </View>
            <Text style={styles.createTitle}>Create{'\n'}Request</Text>
            <Text style={styles.createSub}>Help your community</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.dots}>
          <View style={styles.activeDot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickRow}>
            {quickAccess.map((item) => (
              <TouchableOpacity key={item.label} activeOpacity={0.86} style={styles.quickItem} onPress={() => goTo(item.route)}>
                <LinearGradient colors={['rgba(255,211,106,0.18)', 'rgba(255,255,255,0.02)']} style={styles.quickCircle}>
                  <Ionicons name={item.icon as any} size={30} color="#FFD577" />
                </LinearGradient>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
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
                      const y = event.nativeEvent.layout.y + feedTabsYRef.current + HOME_FEED_TABS_HEIGHT;
                      setPostOffsets((prev) => (prev[postKey] === y ? prev : { ...prev, [postKey]: y }));
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
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
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.commentEmptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={42} color="#D5C8D6" />
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
                placeholderTextColor="#8A7B89"
                multiline
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
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 106,
  },
  upperContentWrapper: {
    paddingHorizontal: PAGE_PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#FFEBC1',
    overflow: 'hidden',
    backgroundColor: '#FFB35E',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  photoUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#3B1735',
    fontSize: 28,
    fontWeight: '800',
  },
  greetingBlock: {
    flex: 1,
    marginLeft: 13,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  subGreeting: {
    marginTop: 3,
    color: '#F5D8AE',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  bioEditButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 6,
  },
  bellButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 8,
  },
  searchButtonActive: {
    backgroundColor: 'rgba(255,210,108,0.18)',
    borderColor: 'rgba(255,210,108,0.32)',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B2F',
    borderWidth: 2,
    borderColor: '#37163D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchPanel: {
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    padding: 12,
    marginBottom: 14,
  },
  searchBar: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D6C8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    color: '#2F1725',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultsSection: {
    marginTop: 8,
  },
  userResultItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE2DA',
    paddingVertical: 8,
  },
  userResultContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userResultText: {
    flex: 1,
    marginLeft: 10,
  },
  userResultName: {
    color: '#2F1725',
    fontSize: 15,
    fontWeight: '900',
  },
  userResultMeta: {
    color: '#6F5C70',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  hashtagIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(140,54,219,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    minWidth: 82,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8C36DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8C36DB',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  followingButtonText: {
    color: '#8C36DB',
  },
  searchStatusText: {
    color: '#6F5C70',
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  panchangCard: {
    width: SCREEN_WIDTH * 0.36,
    minHeight: 88,
    borderRadius: CARD_RADIUS,
    padding: 14,
    backgroundColor: '#FFF2DF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIcon: {
    width: 37,
    height: 37,
    borderRadius: 8,
    backgroundColor: '#8D3CE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gitaCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: CARD_RADIUS,
    padding: 14,
    backgroundColor: '#FFF2DF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gitaText: {
    flex: 1,
  },
  infoTitle: {
    color: '#2F1A22',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },
  infoMain: {
    color: '#251428',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  infoSub: {
    color: '#4E3842',
    fontSize: 12,
    fontWeight: '600',
  },
  shlok: {
    color: '#4A2B20',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  bookEmoji: {
    fontSize: 42,
    marginLeft: 8,
  },
  liveCard: {
    height: 256,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#10101D',
  },
  liveImage: {
    borderRadius: 22,
  },
  liveOverlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  liveNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF2C2A',
    marginRight: 8,
  },
  liveNowText: {
    color: '#FF413A',
    fontSize: 16,
    fontWeight: '900',
  },
  liveTitle: {
    maxWidth: '70%',
    color: '#FFE08A',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  liveSub: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  miniAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#171029',
    backgroundColor: '#FFD1A2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: '#32142E',
    fontSize: 10,
    fontWeight: '900',
  },
  peopleCount: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginLeft: 8,
  },
  peopleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  joinButton: {
    marginTop: 18,
    width: 178,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#8C36DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  playCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  livePill: {
    position: 'absolute',
    right: 15,
    top: 14,
    backgroundColor: '#FF351F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  liveOptionCard: {
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,213,119,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  liveOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,210,108,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveOptionText: {
    flex: 1,
  },
  liveOptionTitle: {
    color: '#FFF2DD',
    fontSize: 17,
    fontWeight: '900',
  },
  liveOptionSub: {
    color: '#F3D5C6',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: {
    color: '#FFF2DD',
    fontSize: 20,
    fontWeight: '900',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: '#FFF0D4',
    fontSize: 14,
    fontWeight: '800',
  },
  helpList: {
    gap: 12,
    paddingRight: 16,
  },
  helpCard: {
    width: 128,
    minHeight: 218,
    borderRadius: 17,
    padding: 13,
    justifyContent: 'space-between',
  },
  urgentHelpCard: {
    backgroundColor: '#9F1629',
    borderWidth: 1,
    borderColor: '#FF563E',
  },
  warmHelpCard: {
    backgroundColor: '#FFE1AE',
  },
  coolHelpCard: {
    backgroundColor: '#DFF3EE',
  },
  helpTop: {
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  helpEmoji: {
    fontSize: 31,
  },
  urgentLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  helpTitle: {
    color: '#2F1725',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  helpLocation: {
    color: '#2F1725',
    fontSize: 11,
    fontWeight: '700',
  },
  helpSubtitle: {
    color: '#2F1725',
    fontSize: 12,
    fontWeight: '800',
  },
  respondedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  respondedText: {
    color: '#7E3E26',
    fontSize: 10,
    fontWeight: '800',
  },
  helpButton: {
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(95,51,20,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    color: '#6A321C',
    fontSize: 13,
    fontWeight: '900',
  },
  urgentButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF8E6A',
  },
  urgentButtonText: {
    color: '#FFE6C9',
  },
  createCard: {
    width: 108,
    minHeight: 218,
    borderRadius: 17,
    padding: 13,
    backgroundColor: '#F1DFF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  createTitle: {
    color: '#2D1737',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  createSub: {
    marginTop: 16,
    color: '#4D3154',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 14,
    marginBottom: 8,
  },
  activeDot: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E6A03C',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  quickItem: {
    width: `${100 / 4}%`,
    alignItems: 'center',
  },
  quickCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,213,119,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: '#FFE2A0',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 7,
  },
  stickyFeedTabsShell: {
    backgroundColor: '#241039',
    zIndex: 30,
    elevation: 12,
  },
  stickyFeedTabs: {
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    backgroundColor: '#241039',
    overflow: 'hidden',
    zIndex: 20,
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
