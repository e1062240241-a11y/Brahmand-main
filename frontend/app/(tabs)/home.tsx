// Trigger watch rebuild
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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { useFeedStore } from '../../src/store/feedStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

function KundliSirenIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Orange-Red Circular Base */}
      <Circle cx="12" cy="12" r="11" fill="#FF5100" />
      {/* Light pinkish outer ring inside circle */}
      <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1" />
      {/* Siren bell/dome */}
      <Path
        d="M12 8C10.3 8 9 9.3 9 11V13.5H15V11C15 9.3 13.7 8 12 8Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Siren base */}
      <Path
        d="M8 14H16"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Beams */}
      <Path d="M12 5V6.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M8.5 6L9.5 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M15.5 6L14.5 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function CosmicMoonIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Orange circular base */}
      <Circle cx="12" cy="12" r="11" fill="#FF5100" />
      {/* Light pinkish outer border */}
      <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1.5" />
      {/* Crescent Moon Outline (matching image exactly, pointing right/up) */}
      <Path
        d="M8.5 13.5C8.5 9.5 11.5 6.5 15 6.5C13.8 7.5 13 9.0 13 10.8C13 13.5 15 15.5 17.5 15.5C16.5 16.5 15 17 13.5 17C10.5 17 8.5 15 8.5 13.5Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Large Star Sparkle Cross (top right) */}
      <Path
        d="M15.5 5.5H18.5M17 4V7"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Small Star Sparkle Cross (next to it) */}
      <Path
        d="M13 3.5H15M14 2.5V4.5"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PassportIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Deep Blue Circular Base */}
      <Circle cx="12" cy="12" r="11" fill="#0A1D37" />
      {/* Gold outer ring */}
      <Circle cx="12" cy="12" r="11" stroke="#FFC000" strokeWidth="1" />

      {/* Gold circle in center */}
      <Circle cx="12" cy="9.8" r="3.2" stroke="#FFC000" strokeWidth="0.8" />

      {/* Beautiful OM path */}
      <Path
        d="M11.2 8.8C11.6 8.5 12.2 8.5 12.5 8.9C12.8 9.3 12.7 9.8 12.3 10.1C12.7 10.4 12.9 10.9 12.7 11.4C12.5 11.9 11.9 12.1 11.4 11.8M12.8 10.1C13.3 10.4 13.6 11.0 13.2 11.6C12.8 12.2 12.0 12.4 11.4 12.0M12.0 8.0C12.3 8.1 12.5 8.3 12.4 8.6M12.8 7.5C13.2 7.7 13.5 8.0 13.6 8.4"
        stroke="#FFC000"
        strokeWidth="0.6"
        strokeLinecap="round"
      />

      {/* Temple outline at bottom */}
      <Path
        d="M8.5 17H15.5M9.5 17V15L12 13L14.5 15V17M12 13V17M11 17V15.5H13V17"
        stroke="#FFC000"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SacredDaysIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Orange circular base */}
      <Circle cx="12" cy="12" r="11" fill="#FF5100" />
      {/* Light pinkish outer border */}
      <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1.5" />
      {/* Calendar Outline */}
      <Rect
        x="6.5"
        y="7.5"
        width="11"
        height="10"
        rx="1.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      {/* Calendar Binders */}
      <Path
        d="M9.5 5.5V7.5M14.5 5.5V7.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Star in the center of calendar */}
      <Path
        d="M12 9.5L12.8 11.2L14.7 11.5L13.3 12.8L13.6 14.7L12 13.8L10.4 14.7L10.7 12.8L9.3 11.5L11.2 11.2Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function HoroscopeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Purple circular base */}
      <Circle cx="12" cy="12" r="11" fill="#7C4DFF" />
      {/* Light border */}
      <Circle cx="12" cy="12" r="11" stroke="#F0E6FF" strokeWidth="1.5" />
      {/* Star outline */}
      <Path
        d="M12 6L13.8 9.7L17.8 10.3L14.9 13.1L15.6 17.1L12 15.2L8.4 17.1L9.1 13.1L6.2 10.3L10.2 9.7L12 6Z"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function LibraryBookIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* Orange circular base */}
      <Circle cx="12" cy="12" r="11" fill="#FF5100" />
      {/* Light pinkish outer border */}
      <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1.5" />

      {/* Standing Book 1 */}
      <Rect
        x="7.5"
        y="6.5"
        width="4"
        height="11"
        rx="1"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      {/* Horizontal lines on Standing Book spine */}
      <Path d="M7.5 9.5H11.5M7.5 14.5H11.5" stroke="#FFFFFF" strokeWidth="1.2" />

      {/* Leaning Book 2 */}
      <G transform="rotate(12 12 12)">
        <Rect
          x="11.5"
          y="6.5"
          width="4"
          height="11"
          rx="1"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        {/* Horizontal lines on Leaning Book spine */}
        <Path d="M11.5 9.5H15.5M11.5 14.5H15.5" stroke="#FFFFFF" strokeWidth="1.2" />
      </G>
    </Svg>
  );
}

function BloodDropIcon() {
  return (
    <Svg width={34} height={42} viewBox="0 0 20 25">
      <Path d="M18.7486 15.1794C18.7486 17.5474 17.8078 19.8185 16.1335 21.493C14.459 23.1673 12.1879 24.1081 9.8199 24.1081C7.4519 24.1081 5.18084 23.1673 3.50638 21.493C1.83192 19.8185 0.891235 17.5474 0.891235 15.1794C0.891235 7.14361 9.8199 0.893555 9.8199 0.893555C9.8199 0.893555 18.7486 7.14361 18.7486 15.1794Z" fill="#FF0000" />
      <Path d="M14.9556 4.43617C13.577 2.84402 12.0254 1.41031 10.3295 0.161581C10.1794 0.0564114 10.0005 0 9.81719 0C9.63392 0 9.45502 0.0564114 9.30491 0.161581C7.61214 1.41083 6.06349 2.84452 4.68767 4.43617C1.61956 7.95965 0.00012207 11.674 0.00012207 15.1785C0.00012207 17.7833 1.03489 20.2814 2.87678 22.1233C4.71867 23.9653 7.21683 25 9.82165 25C12.4265 25 14.9246 23.9653 16.7665 22.1233C18.6085 20.2814 19.6432 17.7833 19.6432 15.1785C19.6432 11.674 18.0237 7.95965 14.9556 4.43617ZM9.82165 23.2143C7.69116 23.2119 5.64858 22.3645 4.14209 20.858C2.63561 19.3515 1.78822 17.309 1.78586 15.1785C1.78586 8.79114 7.97676 3.4596 9.82165 2.0087C11.6665 3.4596 17.8574 8.7889 17.8574 15.1785C17.8551 17.309 17.0077 19.3515 15.5012 20.858C13.9947 22.3645 11.9521 23.2119 9.82165 23.2143ZM16.0594 16.2209C15.828 17.5141 15.2057 18.7053 14.2766 19.6342C13.3476 20.5631 12.1562 21.185 10.863 21.4163C10.8138 21.4241 10.7642 21.4282 10.7145 21.4285C10.4905 21.4284 10.2748 21.3443 10.11 21.1926C9.9452 21.0409 9.84352 20.8328 9.825 20.6096C9.80637 20.3863 9.87243 20.1644 10.0099 19.9876C10.1474 19.8108 10.3463 19.6921 10.5672 19.6551C12.4165 19.3437 13.9858 17.7745 14.2994 15.9218C14.339 15.6882 14.4698 15.48 14.663 15.3429C14.8562 15.2058 15.0959 15.1511 15.3295 15.1907C15.5631 15.2304 15.7713 15.3613 15.9084 15.5544C16.0455 15.7476 16.0991 15.9873 16.0594 16.2209Z" fill="#890000" />
    </Svg>
  );
}

function LotusIcon() {
  return (
    <Svg width={46} height={40} viewBox="0 0 24 24" fill="none">
      {/* Flawless Kamal / Indian Lotus - symmetric geometric vector artwork */}
      <Path
        d="M12 3C12.8 6 15 7.5 18 7.5C16.5 10 14.5 11 12 14C9.5 11 7.5 10 6 7.5C9 7.5 11.2 6 12 3Z"
        stroke="#00C781"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#E6FFF0"
      />
      <Path
        d="M12 8.5C13.8 9.3 15.6 8.9 17.4 8.1C16.1 10.8 14.3 11.7 12 13C9.7 11.7 7.9 10.8 6.6 8.1C8.4 8.9 10.2 9.3 12 8.5Z"
        stroke="#00C781"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#CCFFE6"
      />
      <Path
        d="M12 12.5C14 13.5 16 13.2 18 12.1C16.5 15.1 14 15.9 12 17.1C10 15.9 7.5 15.1 6 12.1C8 13.2 10 13.5 12 12.5Z"
        stroke="#00C781"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#99FFCC"
      />
      <Path
        d="M3 18C6 21 18 21 21 18"
        stroke="#00C781"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TempleIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      {/* Premium Hindu Temple dome, stairs, flag outline */}
      <Path
        d="M12 2V6M12 2H16L14.5 4L16 6H12"
        stroke="#8C36DB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6C8 9.5 7.5 14.5 12 14.5C16.5 14.5 16 9.5 12 6Z"
        stroke="#8C36DB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#8C36DB"
        fillOpacity={0.15}
      />
      <Path
        d="M4 22H20M5 18H19M6 14H18"
        stroke="#8C36DB"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M6 14V22M18 14V22"
        stroke="#8C36DB"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M10 22V18C10 16.9 10.9 16 12 16C13.1 16 14 16.9 14 18V22"
        stroke="#8C36DB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShopIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      {/* Storefront/Shop building outline */}
      <Path
        d="M3 9L4.5 13H19.5L21 9M3 9H21M3 9L5.5 5H18.5L21 9"
        stroke="#FF9500"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#FF9500"
        fillOpacity={0.08}
      />
      <Path
        d="M4.5 13C5.5 13 6.25 13.5 7 13C7.75 13.5 8.5 13 9.5 13C10.5 13 11.25 13.5 12 13C12.75 13.5 13.5 13 14.5 13C15.5 13 16.25 13.5 17 13C17.75 13.5 18.5 13 19.5 13"
        stroke="#FF9500"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M5.5 13V20C5.5 20.6 6 21 6.5 21H17.5C18 21 18.5 20.6 18.5 20V13"
        stroke="#FF9500"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V17H15V21"
        stroke="#FF9500"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
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
  markPostAsSeen,
} from '../../src/services/api';
import * as Location from 'expo-location';
import { getCurrentGayatriEnd, isWithinGayatriMantraWindow, formatTime } from '../../src/features/live-mantra/schedule';
import { formatTimeAgo } from '../../src/utils/dateUtils';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_PADDING = 16;
const CARD_RADIUS = 18;

const shivaImage = require('../../assets/images/image temple/SomnathTemple.jpg');
const FEED_PAGE_SIZE = 7;

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

const quickAccess = [
  { label: 'My Krishna', subtitle: 'AI Dharma Guidance', color: '#FFF' },
  { label: 'SOS', subtitle: 'Sanatan People Around You.', color: '#FFF', urgent: true },
  { label: 'Panchang', subtitle: 'Vedic View', color: '#FFF' },
  { label: 'Kundli', subtitle: 'Your Daily Vedic Energy', color: '#FFF' },
  { label: 'Cosmic Guidance', subtitle: 'Your Cosmic Blueprint', color: '#FFF' },
  { label: 'Brahmand Passport', subtitle: 'Your Temple Journey Record', color: '#FFF' },
  { label: 'Sacred Days', subtitle: 'Next Festival & Rituals', color: '#FFF' },
  { label: 'Brahmand Library', subtitle: 'Explore Wisdom', color: '#FFF' },
  { label: 'Horoscope', subtitle: 'Daily Predictions', color: '#FFF' },
];

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user, updateUser } = useAuthStore();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Yash';
  const avatarUri = user?.photo;
  const currentUserId = (user as any)?.id;
  const [bioText, setBioText] = useState(user?.bio || 'Sanatan Lok Community');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const { activeTab, setActiveTab, tabFeeds, setTabFeed } = useFeedStore();
  const currentFeed = tabFeeds[activeTab] || { posts: [], offset: 0, hasMore: true, lastFetched: 0 };
  const feedPosts = currentFeed.posts;
  const feedOffset = currentFeed.offset;
  const hasMoreFeed = currentFeed.hasMore;
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [liveLocation, setLiveLocation] = useState<string>('Detecting...');
  const actionCardsScrollRef = useRef<ScrollView>(null);
  const topFeaturesScrollRef = useRef<ScrollView>(null);
  const likeDebounceRefs = useRef<{ [postId: string]: NodeJS.Timeout }>({});
  const originalLikeStateRefs = useRef<{ [postId: string]: boolean }>({});

  useEffect(() => {
    return () => {
      if (likeDebounceRefs.current) {
        Object.values(likeDebounceRefs.current).forEach((timeout) => clearTimeout(timeout));
      }
    };
  }, []);

  // Horizontal auto-scroll interval for the top quickAccess cards (Panchang, My Krishna, SOS)
  useEffect(() => {
    if (!isFocused) return;
    let currentIndex = 0;
    const totalCards = quickAccess.length;
    const interval = setInterval(() => {
      if (topFeaturesScrollRef.current) {
        currentIndex = (currentIndex + 1) % totalCards;
        const targetOffset = currentIndex * 131; // cardSize: 121 + gap: 10
        topFeaturesScrollRef.current.scrollTo({ x: targetOffset, animated: true });
      }
    }, 4500); // Staggered to 4.5s interval

    return () => clearInterval(interval);
  }, [isFocused]);

  // Horizontal auto-scroll interval for the top action cards
  useEffect(() => {
    if (!isFocused) return;
    let currentIndex = 0;
    const totalCards = 4;
    let interval: NodeJS.Timeout;

    // Start with a 2.2s delay to fully stagger from top cards
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        if (actionCardsScrollRef.current) {
          currentIndex = (currentIndex + 1) % totalCards;
          const cardSize = Platform.OS === 'ios' ? 104 : 84;
          const gap = 10; // Exactly 10px spacing from card marginHorizontal: 5
          const targetOffset = currentIndex * (cardSize + gap);
          actionCardsScrollRef.current.scrollTo({ x: targetOffset, animated: true });
        }
      }, 6000); // Staggered 6.0s interval
    }, 2200);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [isFocused]);

  useEffect(() => {
    if (user?.id) {
      loadRecentSearches();
    }
  }, [user?.id]);

  const loadRecentSearches = async () => {
    if (!user?.id) return;
    try {
      const saved = await AsyncStorage.getItem(`recent_searches_${user.id}`);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load recent searches:', e);
    }
  };

  const saveRecentSearch = async (searchItem: any) => {
    if (!user?.id) return;
    try {
      // Functional update to ensure we use the latest state, though slice(0,4) is already there
      setRecentSearches(prev => {
        const updated = [searchItem, ...prev.filter(item => item.id !== searchItem.id)].slice(0, 4);
        AsyncStorage.setItem(`recent_searches_${user.id}`, JSON.stringify(updated)).catch(e =>
          console.warn('Failed to save to storage:', e)
        );
        return updated;
      });
    } catch (e) {
      console.warn('Failed to save recent search:', e);
    }
  };

  const loadFeedPosts = useCallback(async (offset: number = 0, append: boolean = false, tabOverride?: string) => {
    const tabToLoad = tabOverride || activeTab;
    const cached = useFeedStore.getState().tabFeeds[tabToLoad];
    const hasCache = cached && cached.posts && cached.posts.length > 0;

    if (append) {
      setLoadingMoreFeed(true);
    } else {
      if (!hasCache || isRefreshing) {
        setLoadingFeed(true);
      }
    }

    try {
      console.log(`[Antigravity] Fetching home feed: limit=${FEED_PAGE_SIZE}, offset=${offset}, tab=${tabToLoad}`);
      const response = await getPostsFeed(FEED_PAGE_SIZE, offset, tabToLoad);
      const payload = response.data;
      const incomingItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);

      const nextHasMore = typeof payload?.has_more === 'boolean'
        ? payload.has_more
        : incomingItems.length === FEED_PAGE_SIZE;

      if (append) {
        const currentPosts = useFeedStore.getState().tabFeeds[tabToLoad]?.posts || [];
        const existingIds = new Set(currentPosts.map((item) => item?.id));
        const newItems = incomingItems.filter((item: any) => !existingIds.has(item?.id));
        setTabFeed(tabToLoad, {
          posts: [...currentPosts, ...newItems],
          offset: offset + incomingItems.length,
          hasMore: nextHasMore && incomingItems.length > 0,
          lastFetched: Date.now(),
        });
      } else {
        setTabFeed(tabToLoad, {
          posts: incomingItems,
          offset: incomingItems.length,
          hasMore: nextHasMore && incomingItems.length > 0,
          lastFetched: Date.now(),
        });
      }
    } catch (error: any) {
      console.warn('Failed to load posts feed on home:', error);
      if (!append) {
        setTabFeed(tabToLoad, {
          posts: [],
          offset: 0,
          hasMore: false,
        });
      }
    } finally {
      setLoadingFeed(false);
      setLoadingMoreFeed(false);
    }
  }, [activeTab, setTabFeed, isRefreshing]);

  useEffect(() => {
    const fetchLiveLocation = async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setLiveLocation('Location Disabled');
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLiveLocation('Bharat');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Use native reverse geocoding for exact details
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse.length > 0) {
          const place: any = reverse[0];
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
          } else {
            setLiveLocation('Bharat');
          }
        }
      } catch (e) {
        console.warn('Initial location fetch failed:', e);
        setLiveLocation('Bharat');
      }
    };
    fetchLiveLocation();
  }, []);

  useEffect(() => {
    if (!isFocused) return;
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
  }, [setUnreadCount, isFocused]);

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
      const cached = useFeedStore.getState().tabFeeds[activeTab];
      const nowTime = Date.now();
      const isStale = !cached || (nowTime - cached.lastFetched > 120000); // 2 minutes
      if (!cached || cached.posts.length === 0 || isStale) {
        loadFeedPosts(0, false);
      }
    }, [loadFeedPosts, activeTab])
  );
  const feedTabsYRef = useRef(0);
  const [feedTabsY, setFeedTabsY] = useState(0);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const postHeightsRef = useRef<Record<string, number>>({});
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
        const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
        setTabFeed(activeTab, {
          posts: [response.data, ...currentPosts]
        });
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



  useEffect(() => {
    const cached = tabFeeds[activeTab];
    const nowTime = Date.now();
    const isStale = !cached || (nowTime - cached.lastFetched > 120000); // 2 minutes stale
    if (!cached || cached.posts.length === 0 || isStale) {
      loadFeedPosts(0, false, activeTab);
    }
  }, [loadFeedPosts, activeTab]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      // If we are already on home tab, scroll to top
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        // Refresh feed on tab press when already focused
        loadFeedPosts(0, false, activeTab);
      }
    });
    return unsubscribe;
  }, [navigation, activeTab, loadFeedPosts]);

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, [isFocused]);

  const liveActive = isWithinGayatriMantraWindow(now);
  const liveEnd = getCurrentGayatriEnd(now);
  const feedPostKeys = useMemo(
    () => feedPosts.map((post, index) => String(post.id || post.media_url || index)),
    [feedPosts],
  );

  useEffect(() => {
    if (activePostKey && activePostKey.length > 10) {
      markPostAsSeen(activePostKey);
    }
  }, [activePostKey]);

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
      const offset = postOffsetsRef.current[key];
      const height = postHeightsRef.current[key];
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

    // Infinite Scroll Logic: Fetch next 7 posts when reaching the 6th post of current set
    if (hasMoreFeed && !loadingMoreFeed && !loadingFeed && feedPosts.length > 0) {
      const scrollHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;

      // Determine which post is currently visible near the bottom of the viewport
      // We trigger when the 6th-to-last post (index = length - 2) is reached
      const targetIndex = Math.max(0, feedPosts.length - 2);
      const targetPost = feedPosts[targetIndex];
      const targetKey = String(targetPost?.id || targetPost?.media_url || targetIndex);
      const targetOffset = postOffsetsRef.current[targetKey];

      if (typeof targetOffset === 'number') {
        // If the target post's top is visible in the bottom portion of the screen
        if (y + layoutHeight > targetOffset + feedTabsYRef.current + HOME_FEED_TABS_HEIGHT) {
          loadFeedPosts(feedOffset, true);
        }
      } else {
        // Fallback to pixel-based trigger if layout not yet captured
        if (y + layoutHeight > scrollHeight - 1000) {
          loadFeedPosts(feedOffset, true);
        }
      }
    }
  }, [feedPostKeys, hasMoreFeed, loadingMoreFeed, loadingFeed, feedPosts, feedOffset, loadFeedPosts]);

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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadFeedPosts(0, false, activeTab),
      loadHomeRequests()
    ]);
    setIsRefreshing(false);
  }, [loadFeedPosts, activeTab, loadHomeRequests]);

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

  const handleLikePost = useCallback((post: any) => {
    const postId = post?.id;
    if (!postId) return;

    // 1. Calculate the new toggled state
    const liked = !!post?.liked_by_me;
    const newLikedState = !liked;
    const currentLikes = Number(post?.likes_count || 0);

    // 2. Perform optimistic UI update instantly
    const optimisticPost = {
      ...post,
      liked_by_me: newLikedState,
      likes_count: newLikedState ? currentLikes + 1 : Math.max(0, currentLikes - 1),
    };
    const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
    setTabFeed(activeTab, {
      posts: currentPosts.map((item) => (item.id === postId ? optimisticPost : item))
    });

    // 3. Track original server state if not already tracking
    if (originalLikeStateRefs.current[postId] === undefined) {
      originalLikeStateRefs.current[postId] = liked;
    }

    // 4. Clear any existing timeout for this post
    if (likeDebounceRefs.current[postId]) {
      clearTimeout(likeDebounceRefs.current[postId]);
    }

    // 5. Set a new debounce timeout of 500ms
    likeDebounceRefs.current[postId] = setTimeout(async () => {
      const originalState = originalLikeStateRefs.current[postId];
      // Cleanup tracking for this post
      delete likeDebounceRefs.current[postId];
      delete originalLikeStateRefs.current[postId];

      // If final state equals original state, skip server update!
      if (newLikedState === originalState) {
        return;
      }

      // Otherwise, send the API call to toggle on the server
      try {
        const response = await togglePostLike(postId);
        const updatedPost = response.data?.post;
        if (updatedPost) {
          const finalPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
          setTabFeed(activeTab, {
            posts: finalPosts.map((item) => (item.id === postId ? { ...item, ...updatedPost } : item))
          });
        }
      } catch (error) {
        console.warn('Failed to like/unlike post:', error);
        // Rollback to original state on failure
        const rollbackPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
        setTabFeed(activeTab, {
          posts: rollbackPosts.map((item) =>
            item.id === postId
              ? {
                ...item,
                liked_by_me: originalState,
                likes_count: originalState
                  ? (item.liked_by_me ? item.likes_count : item.likes_count + 1)
                  : (item.liked_by_me ? Math.max(0, item.likes_count - 1) : item.likes_count),
              }
              : item
          )
        });
        alert('Could not update like. Please check your network.');
      }
    }, 500);
  }, [activeTab, setTabFeed]);

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
        const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
        setTabFeed(activeTab, {
          posts: currentPosts.map((item) => {
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
        });
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
        const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
        setTabFeed(activeTab, {
          posts: [repostedPost, ...currentPosts]
        });
      } else {
        await loadFeedPosts();
      }
      alert('Reposted to your feed.');
    } catch (error) {
      console.warn('Failed to repost:', error);
      alert('Could not repost. Please try again.');
    }
  }, [loadFeedPosts, activeTab, setTabFeed]);

  const handleDeletePost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    const deletedPost = post;
    const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
    setTabFeed(activeTab, {
      posts: currentPosts.filter((item) => item.id !== postId)
    });
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
      const rollbackPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
      setTabFeed(activeTab, {
        posts: rollbackPosts.some((item) => item.id === postId) ? rollbackPosts : [deletedPost, ...rollbackPosts]
      });
      alert('Could not delete post. Please try again.');
    }
  }, [selectedCommentPostId, activeTab, setTabFeed]);

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
    const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
    const currentOffset = useFeedStore.getState().tabFeeds[activeTab]?.offset || 0;
    setTabFeed(activeTab, {
      posts: [post, ...currentPosts],
      offset: currentOffset + 1
    });
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
    <View style={{ flex: 1, backgroundColor: '#FF8D57' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#FF8D57', '#EA9B76', '#F8EDE7']} locations={[0, 0.22, 0.42]} style={styles.screen}>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: 10,
                paddingBottom: 90
              }
            ]}
            stickyHeaderIndices={[1]}
            onScroll={handleHomeScroll}
            onMomentumScrollEnd={handleHomeScroll}
            onScrollEndDrag={handleHomeScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={['#FFD26C']}
                tintColor="#FFD26C"
              />
            }
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
                          if (user?.id) {
                            setRecentSearches([]);
                            await AsyncStorage.removeItem(`recent_searches_${user.id}`);
                          }
                        }}>
                          <Text style={styles.clearHistoryText}>Clear History</Text>
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
                  <ScrollView
                    ref={topFeaturesScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={131}
                    decelerationRate="fast"
                    contentContainerStyle={{ gap: 10, paddingHorizontal: PAGE_PADDING }}
                  >
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
                          style={[styles.featureCard, { backgroundColor: '#FFF' }]}
                          activeOpacity={0.9}
                          onPress={() => {
                            if (item.label === 'Panchang') router.push('/panchang');
                            else if (item.label === 'My Krishna') router.push('/my-krishna');
                            else if (item.label === 'SOS') router.push('/sos');
                            else if (item.label === 'Kundli' || item.label === 'Cosmic Guidance') router.push('/kundli');
                            else if (item.label === 'Brahmand Passport') router.push('/passport');
                            else if (item.label === 'Sacred Days') router.push('/panchang');
                            else if (item.label === 'Brahmand Library') router.push('/library');
                            else if (item.label === 'Horoscope') router.push('/horoscope');
                          }}
                        >
                          {item.label === 'SOS' ? (
                            <View style={styles.featureIconWrap}>
                              <View style={[styles.sosRing, { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>SOS</Text>
                              </View>
                            </View>
                          ) : item.label === 'My Krishna' ? (
                            <View style={styles.featureIconWrap}>
                              <Image source={require('../../assets/images/peacock_feather_icon.png')} style={{ width: 24, height: 24, borderRadius: 12 }} />
                            </View>
                          ) : item.label === 'Panchang' ? (
                            <View style={styles.featureIconWrap}>
                              <Image source={require('../../assets/images/panchang_calendar_icon.png')} style={{ width: 24, height: 24, borderRadius: 12 }} />
                            </View>
                          ) : item.label === 'Kundli' ? (
                            <View style={styles.featureIconWrap}>
                              <KundliSirenIcon />
                            </View>
                          ) : item.label === 'Cosmic Guidance' ? (
                            <View style={styles.featureIconWrap}>
                              <CosmicMoonIcon />
                            </View>
                          ) : item.label === 'Brahmand Passport' ? (
                            <View style={styles.featureIconWrap}>
                              <PassportIcon />
                            </View>
                          ) : item.label === 'Sacred Days' ? (
                            <View style={styles.featureIconWrap}>
                              <SacredDaysIcon />
                            </View>
                          ) : item.label === 'Brahmand Library' ? (
                            <View style={styles.featureIconWrap}>
                              <LibraryBookIcon />
                            </View>
                          ) : item.label === 'Horoscope' ? (
                            <View style={styles.featureIconWrap}>
                              <HoroscopeIcon />
                            </View>
                          ) : (
                            <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
                              <Ionicons name="calendar" size={14} color="#FFF" />
                            </View>
                          )}
                          <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, item.label === 'Sacred Days' && { fontSize: 11.5, fontWeight: '800' }]} numberOfLines={1} adjustsFontSizeToFit>{item.label}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={12} color="#999" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity activeOpacity={0.95} style={styles.featuredLiveCard} onPress={() => router.push({ pathname: '/live-jaap-welcome', params: { fromHome: 'true' } })}>
                <ImageBackground source={shivaImage} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }}>
                  {/* Cinematic Left-to-Right Horizontal Black Shade Layer */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0.8, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']} locations={[0, 0.4, 1]} style={styles.featuredLiveOverlay}>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
                        <Ionicons name="time-outline" size={14} color="#FFF" />
                        <Text style={[styles.featuredTime, { marginTop: 0, marginLeft: 6 }]}>Live until 5:00 PM</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.joinJaapButton, { backgroundColor: '#FF5100' }]} onPress={() => router.push({ pathname: '/live-jaap-welcome', params: { fromHome: 'true' } })}>
                          <Ionicons name="volume-medium" size={16} color="#FFF" />
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
                ref={actionCardsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                snapToInterval={Platform.OS === 'ios' ? 130 : 120}
                decelerationRate="fast"
                contentContainerStyle={[styles.actionCardsScroll, { paddingTop: 14 }]}
                style={[styles.actionCardsScrollView, { marginBottom: 20 }]}
              >
                {/* Urgent Blood Request */}
                <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 5 }}>
                  <ImageBackground
                    source={require('../../assets/images/blood_request_bg.png')}
                    style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderWidth: 1, borderColor: '#FFC8CE' }]}
                    imageStyle={{ borderRadius: 15 }}
                  >
                    <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 10 }]}>
                      <View style={[styles.cardIconRow, { marginBottom: 8 }]}>
                        <BloodDropIcon />
                      </View>
                      <Text style={[styles.cardTitleLargeDark, { textAlign: 'center', fontWeight: '900', fontSize: Platform.OS === 'ios' ? 13.5 : 12, lineHeight: 16 }]} numberOfLines={2} adjustsFontSizeToFit>{bloodRequest ? `${bloodRequest.blood_group || 'Blood'} Required` : 'Blood Request'}</Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: '85%',
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#FF0022',
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        shadowColor: '#FF0022',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                        elevation: 4,
                        marginBottom: 6,
                      }}
                      onPress={() => {
                        router.push('/community-request/list');
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>View</Text>
                    </TouchableOpacity>
                  </ImageBackground>
                  {/* Badge rendered as sibling outside to prevent any iOS clipping */}
                  <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                    <View style={{ width: 70, height: 13, borderRadius: 9, borderWidth: 1, borderColor: '#FF0000', backgroundColor: 'rgba(255, 255, 255, 0.50)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                      <Text style={{ color: '#FF0000', fontSize: 8, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>Your Community</Text>
                    </View>
                  </View>
                </View>

                {/* Register Business */}
                <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 5 }}>
                  <ImageBackground
                    source={require('../../assets/images/register_business_bg.png')}
                    style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderWidth: 1, borderColor: '#FFEAA7' }]}
                    imageStyle={{ borderRadius: 15 }}
                  >
                    <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 10 }]}>
                      <View style={[styles.cardIconRow, { marginBottom: 8 }]}>
                        <ShopIcon />
                      </View>
                      <Text style={[styles.cardTitleLargeDark, { textAlign: 'center', fontWeight: '900', fontSize: Platform.OS === 'ios' ? 13.5 : 12, lineHeight: 16 }]} numberOfLines={2} adjustsFontSizeToFit>Register Your Business</Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: '85%',
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#FF9500',
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        shadowColor: '#FF9500',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                        elevation: 4,
                        marginBottom: 6,
                      }}
                      onPress={() => router.push('/vendor/business-details')}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>Register</Text>
                    </TouchableOpacity>
                  </ImageBackground>
                  {/* Badge rendered as sibling outside LinearGradient to prevent any iOS clipping */}
                  <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                    <View style={{ width: 42, height: 13, borderRadius: 9, borderWidth: 1, borderColor: '#FFF600', backgroundColor: 'rgba(255, 255, 255, 0.50)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                      <Text style={{ color: '#FF9500', fontSize: 9, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>Free</Text>
                    </View>
                  </View>
                </View>

                {/* Verified Vendor */}
                <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 5 }}>
                  <ImageBackground
                    source={require('../../assets/images/verified_vendor_bg.png')}
                    style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderWidth: 1, borderColor: '#C7F9CC' }]}
                    imageStyle={{ borderRadius: 15 }}
                  >
                    <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 10 }]}>
                      <View style={[styles.cardIconRow, { marginBottom: 8 }]}>
                        <LotusIcon />
                      </View>
                      <Text style={[styles.cardTitleLargeDark, { textAlign: 'center', fontWeight: '900', fontSize: Platform.OS === 'ios' ? 13.5 : 12, lineHeight: 16 }]} numberOfLines={2} adjustsFontSizeToFit>Sai Flower Decorator</Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: '85%',
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#00C781',
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        shadowColor: '#00C781',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                        elevation: 4,
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>View</Text>
                    </TouchableOpacity>
                  </ImageBackground>
                  {/* Badge rendered as sibling outside LinearGradient to prevent any iOS clipping */}
                  <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                    <View style={[styles.cardHeaderBadgeTeal, { borderColor: '#00C781', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'center', borderRadius: 10 }]}>
                      <Text style={[styles.cardBadgeTextDark, { color: '#00C781', fontSize: 9.5, fontWeight: '700' }]} numberOfLines={1}>Verified vendor</Text>
                    </View>
                  </View>
                </View>

                {/* Live Aarti */}
                <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 5 }}>
                  <ImageBackground
                    source={require('../../assets/images/live_aarti_bg.png')}
                    style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderWidth: 1, borderColor: '#E8AEFF' }]}
                    imageStyle={{ borderRadius: 15 }}
                  >
                    <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 10, paddingHorizontal: 4 }]}>
                      <View style={[styles.cardIconRow, { marginBottom: 8 }]}>
                        <TempleIcon />
                      </View>
                      <Text style={[styles.cardTitleLargeDark, { textAlign: 'center', fontWeight: '900', fontSize: Platform.OS === 'ios' ? 13.5 : 12, lineHeight: 16 }]} numberOfLines={2} adjustsFontSizeToFit>Live Kedarnath Aarti</Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: '85%',
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#8C36DB',
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        shadowColor: '#8C36DB',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                        elevation: 4,
                        marginBottom: 6,
                      }}
                      onPress={() => router.push({
                        pathname: '/live-jaap-welcome',
                        params: {
                          mantraType: 'kedarnath',
                          title: 'Kedarnath Aarti'
                        }
                      })}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>Watch</Text>
                    </TouchableOpacity>
                  </ImageBackground>
                  {/* Badge rendered as sibling outside LinearGradient to prevent any iOS clipping */}
                  <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                    <View style={[styles.cardHeaderBadgePurple, { borderColor: '#8C36DB', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'center', borderRadius: 10 }]}>
                      <Text style={[styles.cardBadgeTextDark, { color: '#8C36DB', fontSize: 9.5, fontWeight: '700' }]} numberOfLines={1}>Temple</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.twoButtonsRow}>
                {/* Mumbai Community Card */}
                {(() => {
                  const mumbaiComm = communities.find(c => c.type === 'city' && c.name?.toLowerCase().includes('mumbai')) ||
                    communities.find(c => c.name?.toLowerCase().includes('mumbai'));
                  return (
                    <TouchableOpacity
                      style={styles.communityCardMini}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (mumbaiComm) {
                          router.push({
                            pathname: '/community/[id]',
                            params: { id: mumbaiComm.id, subgroup: 'city', name: mumbaiComm.name }
                          });
                        } else {
                          router.push('/messages?tab=Community');
                        }
                      }}
                    >
                      <Image source={require('../../assets/images/mumbai_pin.png')} style={{ width: 36, height: 36, borderRadius: 8, marginRight: 8 }} />
                      <View style={styles.miniCardContent}>
                        <Text
                          style={[
                            styles.miniCardType,
                            {
                              color: '#9F45FF',
                              fontSize: 8.5,
                              fontWeight: '510' as any,
                              fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
                              letterSpacing: 0,
                            }
                          ]}
                        >
                          CITY COMMUNITY
                        </Text>
                        <Text
                          style={[
                            styles.miniCardTitle,
                            {
                              color: '#000',
                              fontSize: 11,
                              fontWeight: '590' as any,
                              fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
                            }
                          ]}
                          numberOfLines={1}
                        >
                          {mumbaiComm?.name || 'Mumbai Community'}
                        </Text>
                        <Text
                          style={[
                            styles.miniCardMembers,
                            {
                              color: '#000',
                              fontSize: 8.5,
                              fontWeight: '400',
                              fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
                            }
                          ]}
                        >
                          13 members
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                    </TouchableOpacity>
                  );
                })()}

                {/* Local Community Card */}
                {(() => {
                  const localComm = communities.find(c => c.is_default || c.type === 'home_area' || c.type === 'area');
                  return (
                    <TouchableOpacity
                      style={styles.communityCardMini}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (localComm) {
                          router.push({
                            pathname: '/community/[id]',
                            params: { id: localComm.id, subgroup: 'city', name: localComm.name }
                          });
                        } else {
                          router.push('/messages?tab=Community');
                        }
                      }}
                    >
                      <View style={styles.miniCardImageBox}>
                        <Image source={require('../../assets/images/food_sharing.png')} style={styles.miniCardCircleImg} />
                      </View>
                      <View style={styles.miniCardContent}>
                        <Text
                          style={[
                            styles.miniCardTitle,
                            {
                              color: '#000',
                              fontSize: 11,
                              fontWeight: '590' as any,
                              fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
                            }
                          ]}
                          numberOfLines={1}
                        >
                          Pune Food Sharing Group
                        </Text>
                        <View style={styles.miniCardBottomRow}>
                          <Text
                            style={[
                              styles.miniCardMembers,
                              {
                                color: '#000',
                                fontSize: 8.5,
                                fontWeight: '400',
                                fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
                              }
                            ]}
                          >
                            236 members
                          </Text>
                          <View style={styles.sevaBadgeMini}>
                            <Text style={styles.sevaBadgeTextMini}>Seva</Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                    </TouchableOpacity>
                  );
                })()}
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
              {loadingFeed && feedPosts.length === 0 ? (
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
                          postOffsetsRef.current[postKey] = y;
                          postHeightsRef.current[postKey] = h;
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
                  style={styles.bioModalInput}
                  value={bioText}
                  onChangeText={setBioText}
                  multiline
                  autoFocus
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#8A7B89"
                />
                <View style={styles.bioModalActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setBioText(user?.bio || 'Sanatan Lok Community');
                      setIsEditingBio(false);
                    }}
                    style={styles.bioModalBtnCancel}
                  >
                    <Text style={styles.bioModalBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveBio} style={styles.bioModalBtn}>
                    <Text style={styles.bioModalBtnText}>Save</Text>
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
              keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
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

                <View style={[styles.commentInputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
      </SafeAreaView>
    </View>
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
  content: {},
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
    marginBottom: 10,
    gap: 8,
    marginHorizontal: -PAGE_PADDING,
  },
  featureCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: 121,
    height: 70,
  },
  featureIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#000',
  },
  featureSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 8,
    fontWeight: '600',
    color: '#666',
    marginTop: 1,
    lineHeight: 10,
  },
  featuredLiveCard: {
    width: Math.min(375, SCREEN_WIDTH - 2 * PAGE_PADDING),
    height: 235,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignSelf: 'center',
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
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredDevotees: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 10,
    marginBottom: 2,
  },
  featuredTime: {
    fontFamily: 'Outfit_500Medium',
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
  actionCardsScrollView: {
    marginHorizontal: -PAGE_PADDING,
  },
  actionCardsScroll: {
    paddingHorizontal: PAGE_PADDING,
    paddingTop: 25,
    paddingBottom: 5,
    gap: Platform.OS === 'ios' ? 10 : 15,
  },
  actionCard: {
    width: Platform.OS === 'ios' ? 120 : 110,
    height: Platform.OS === 'ios' ? 180 : 172,
    borderRadius: 15,
    padding: Platform.OS === 'ios' ? 10 : 12,
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
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 12,
    paddingVertical: Platform.OS === 'ios' ? 4 : 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD6A5',
    zIndex: 100,
    elevation: 5,
  },
  cardHeaderBadgeTeal: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 12,
    paddingVertical: Platform.OS === 'ios' ? 4 : 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    zIndex: 100,
    elevation: 5,
  },
  cardHeaderBadgePurple: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 12,
    paddingVertical: Platform.OS === 'ios' ? 4 : 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#CE93D8',
    zIndex: 100,
    elevation: 5,
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
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  cardTitleLargeDark: {
    color: '#111111',
    fontSize: Platform.OS === 'ios' ? 12 : 10,
    fontWeight: '800',
    maxWidth: '100%',
    marginBottom: 4,
    lineHeight: Platform.OS === 'ios' ? 14 : 12,
  },
  cardSubtitleSmallDark: {
    color: '#5A5A5A',
    fontSize: Platform.OS === 'ios' ? 9.8 : 8.8,
    fontWeight: '600',
    maxWidth: '100%',
    lineHeight: Platform.OS === 'ios' ? 12 : 10.5,
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
    width: Platform.OS === 'ios' ? 76 : 60,
    height: 19,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  cardButtonOutlineTeal: {
    width: Platform.OS === 'ios' ? 76 : 60,
    height: 19,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  cardButtonOutlinePurple: {
    width: Platform.OS === 'ios' ? 76 : 60,
    height: 19,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  cardButtonTextDark: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
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
  twoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
    marginHorizontal: -PAGE_PADDING,
    paddingHorizontal: PAGE_PADDING,
  },
  bigServiceButton: {
    width: 174,
    height: 70,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bigButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 12,
  },
  bigButtonIcon: {
    width: 32,
    height: 32,
  },
  bigButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    flex: 1,
  },
  communityCardMini: {
    flex: 1,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  miniCardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  miniCardImageBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    overflow: 'hidden',
  },
  miniCardCircleImg: {
    width: '100%',
    height: '100%',
  },
  miniCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  miniCardType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
    fontWeight: '900',
    color: '#8C36DB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  miniCardTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    fontWeight: '800',
    color: '#111',
    lineHeight: 12,
  },
  miniCardMembers: {
    fontFamily: 'Inter_500Medium',
    fontSize: 8,
    color: '#888',
    marginTop: 1,
  },
  miniCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sevaBadgeMini: {
    width: 30,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: '#365F35',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sevaBadgeTextMini: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 8.5,
    fontWeight: '590' as any,
    color: '#397339',
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
    maxHeight: '75%',
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
  clearHistoryText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#888', // Subtle color for history clear
    textDecorationLine: 'underline',
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
  // Bio Modal Styles
  bioModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bioModalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  bioModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1B1F',
    marginBottom: 16,
  },
  bioModalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  bioModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  bioModalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
  },
  bioModalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  bioModalBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bioModalBtnCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackgroundDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
});
