// accessibility: placeholder
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
  Animated,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { useFeedStore } from '../../src/store/feedStore';
import { useVendorStore } from '../../src/store/vendorStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import HomeJyotishSection from '../../src/components/HomeJyotishSection';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useTranslation } from '../../src/utils/i18n';
import { useScrollToHideTabBar } from '../../src/utils/scroll';

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
    <Image
      source={require('../../assets/images/sai_flower_lotus_icon.png')}
      style={styles.saiLotusIcon}
      resizeMode="contain"
      accessibilityLabel="Lotus flower"
    />
  );
}

function TempleIcon() {
  return (
    <Image
      source={require('../../assets/images/home_temple_icon.png')}
      style={styles.actionCardIcon}
      resizeMode="contain"
      accessibilityLabel="Temple"
    />
  );
}

function ShopIcon() {
  return (
    <Image
      source={require('../../assets/images/home_shop_icon.png')}
      style={styles.actionCardIcon}
      resizeMode="contain"
      accessibilityLabel="Shop"
    />
  );
}

import SharePostModal from '../../src/components/SharePostModal';
import UploadPostModal from '../../src/components/UploadPostModal';
import { BlurView } from 'expo-blur';
import { RequestFormModal } from '../../src/components/RequestFormModal';
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
import { SirenIcon } from '../../src/components/SirenIcon';
import { SacredIcon } from '../../src/components/SacredIcon';
import HomeFeedTabs, { HOME_FEED_TABS_HEIGHT } from '../../src/components/HomeFeedTabs';
import {
  addPostComment,
  createCommunityRequest,
  deletePost,
  deletePostComment,
  discoverCommunities,
  followUser,
  getAllUsers,
  getCommunities,
  getCommunityRequests,
  getHomeInit,
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
  getNextFestival,
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

const HOME_CARD_TEXTURES = {
  rose: require('../../assets/images/home_card_bg_rose.png'),
  peach: require('../../assets/images/home_card_bg_peach.png'),
  mint: require('../../assets/images/home_card_bg_mint.jpg'),
  cyan: require('../../assets/images/home_card_bg_mint.jpg'),
  lavender: require('../../assets/images/home_card_bg_lavender.jpg'),
} as const;

type HomeCardTextureKey = keyof typeof HOME_CARD_TEXTURES;

const CARD_TEXTURE_OVERLAY: Record<HomeCardTextureKey, readonly [string, string]> = {
  rose: ['rgba(255, 245, 245, 0.72)', 'rgba(255, 220, 220, 0.45)'],
  peach: ['rgba(255, 250, 242, 0.74)', 'rgba(255, 232, 205, 0.48)'],
  mint: ['rgba(242, 255, 248, 0.74)', 'rgba(210, 245, 225, 0.48)'],
  cyan: ['rgba(224, 247, 250, 0.75)', 'rgba(178, 235, 242, 0.48)'],
  lavender: ['rgba(245, 235, 255, 0.74)', 'rgba(220, 205, 250, 0.48)'],
};

function HomeCardTextureBg({
  texture,
  borderRadius = 15,
  children,
}: {
  texture: HomeCardTextureKey;
  borderRadius?: number;
  children: React.ReactNode;
}) {
  return (
    <ImageBackground
      source={HOME_CARD_TEXTURES[texture]}
      style={[StyleSheet.absoluteFillObject, { borderRadius, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.65)' }]}
      imageStyle={{ borderRadius, resizeMode: 'cover' }}
      resizeMode="cover"
    >
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.cardTextureContent}>{children}</View>
    </ImageBackground>
  );
}

const shivaImage = require('../../assets/images/image temple/SomnathTemple.jpg');
const FEED_PAGE_SIZE = 7;

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

const baseQuickAccess = [
  { label: 'My Krishna', subtitle: 'AI Dharma Guidance', color: '#FFF' },
  { label: 'SOS', subtitle: 'Quick help\nfrom Sanatan', color: '#FFF', urgent: true },
  { label: 'Panchang', subtitle: 'Plan with\nVedic wisdom', color: '#FFF' },
  { label: 'Kundli', subtitle: 'Your birth chart insights', color: '#FFF' },
  { label: 'Jyotish', subtitle: 'Your birth chart insights', color: '#FFF' },
  { label: 'Brahmand Passport', subtitle: 'Track your spiritual journey', color: '#FFF' },
  { label: 'Festival', subtitle: 'Next Festival & Rituals', color: '#FFF' },
  { label: 'Brahmand Library', subtitle: 'Explore Wisdom', color: '#FFF' },
];

const AnimatedSkeleton = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
};

const formatFestivalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr;
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const onHomeScrollTabBar = useScrollToHideTabBar();
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
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
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
  const scrollViewRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);
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

  // Auto-scroll for quick access feature cards
  const topFeaturesAutoScrollIndex = useRef(0);
  useEffect(() => {
    if (!isFocused) return;
    const CARD_WIDTH = 185; // 175 card + 10 gap
    const TOTAL_CARDS = baseQuickAccess.length;
    const interval = setInterval(() => {
      topFeaturesAutoScrollIndex.current = (topFeaturesAutoScrollIndex.current + 1) % TOTAL_CARDS;
      topFeaturesScrollRef.current?.scrollTo({
        x: topFeaturesAutoScrollIndex.current * CARD_WIDTH,
        animated: true,
      });
    }, 7000);
    return () => clearInterval(interval);
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
    const tabToLoad = tabOverride || useFeedStore.getState().activeTab;

    if (tabToLoad === 'jyotish') {
      // Handled entirely by its own component, no need to touch posts feed
      return;
    }

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
      if (!append && !hasCache && tabToLoad === 'for_you') {
        try {
          const { Q } = require('@nozbe/watermelondb');
          const { database } = require('../../src/database');
          if (database) {
            const localFeeds = await database.get('feeds')
              .query(Q.sortBy('created_at', Q.desc), Q.take(FEED_PAGE_SIZE))
              .fetch();

            if (localFeeds && localFeeds.length > 0) {
              console.log(`[HomeFeed] Loaded ${localFeeds.length} local posts from WatermelonDB`);
              const mappedFeeds = localFeeds.map((post: any) => ({
                id: post.id,
                user_id: post.userId,
                username: post.username,
                user_photo: post.userPhoto,
                media_url: post.mediaUrl,
                media_type: post.mediaType,
                caption: post.caption,
                likes_count: post.likesCount,
                comments_count: post.commentsCount,
                liked_by_me: post.likedByMe,
                created_at: post.createdAt,
                updated_at: post.updatedAt,
              }));

              setTabFeed(tabToLoad, {
                posts: mappedFeeds,
                offset: mappedFeeds.length,
                hasMore: true,
                lastFetched: Date.now(),
              });
              setLoadingFeed(false);
            }
          }
        } catch (localErr) {
          console.warn('[HomeFeed] Failed to load local feeds:', localErr);
        }
      }

      console.log(`[HomeFeed] Fetching from API: /posts/feed?tab=${tabToLoad}&offset=${offset}`);
      const response = await getPostsFeed(FEED_PAGE_SIZE, offset, tabToLoad);
      console.log(`[HomeFeed] API response received for ${tabToLoad}`);
      const payload = response.data;
      const incomingItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);

      console.log(`[HomeFeed] Loaded ${incomingItems.length} items for ${tabToLoad}`);

      // Save fetched items to local WatermelonDB (native only)
      if (Platform.OS !== 'web' && incomingItems.length > 0) {
        try {
          const { database } = require('../../src/database');
          if (database) {
            await database.write(async () => {
              const feedsCollection = database.get('feeds');
              for (const item of incomingItems) {
                const recordId = String(item.id || item.media_url);
                if (!recordId) continue;

                let existingRecord;
                try {
                  existingRecord = await feedsCollection.find(recordId);
                } catch {
                  existingRecord = null;
                }

                if (existingRecord) {
                  await existingRecord.update((record: any) => {
                    record.username = item.username || '';
                    record.userPhoto = item.user_photo || null;
                    record.mediaUrl = item.media_url || null;
                    record.mediaType = item.media_type || 'image';
                    record.caption = item.caption || null;
                    record.likesCount = item.likes_count || 0;
                    record.commentsCount = item.comments_count || 0;
                    record.likedByMe = !!item.liked_by_me;
                    record.updatedAt = item.updated_at ? new Date(item.updated_at).getTime() : Date.now();
                  });
                } else {
                  await feedsCollection.create((record: any) => {
                    record._raw.id = recordId;
                    record.userId = item.user_id || '';
                    record.username = item.username || '';
                    record.userPhoto = item.user_photo || null;
                    record.mediaUrl = item.media_url || null;
                    record.mediaType = item.media_type || 'image';
                    record.caption = item.caption || null;
                    record.likesCount = item.likes_count || 0;
                    record.commentsCount = item.comments_count || 0;
                    record.likedByMe = !!item.liked_by_me;
                    record.createdAt = item.created_at ? new Date(item.created_at).getTime() : Date.now();
                    record.updatedAt = item.updated_at ? new Date(item.updated_at).getTime() : Date.now();
                  });
                }
              }
            });
            console.log(`[HomeFeed] Cached ${incomingItems.length} posts in local SQLite database`);
          }
        } catch (localWriteErr) {
          console.warn('[HomeFeed] Failed to cache posts to database:', localWriteErr);
        }
      }

      const nextHasMore = typeof payload?.has_more === 'boolean'
        ? payload.has_more
        : incomingItems.length === FEED_PAGE_SIZE;

      if (append) {
        const currentPosts = useFeedStore.getState().tabFeeds[tabToLoad]?.posts || [];
        const existingIds = new Set(currentPosts.map((item) => item?.id));
        const newItems = incomingItems.filter((item: any) => !existingIds.has(item?.id));

        if (newItems.length > 0) {
          // New unseen posts available – append normally
          setTabFeed(tabToLoad, {
            posts: [...currentPosts, ...newItems],
            offset: offset + incomingItems.length,
            hasMore: true, // always keep open so scroll never stops
            lastFetched: Date.now(),
          });
        } else {
          // Unseen posts exhausted – shuffle and recycle existing posts
          console.log(`[HomeFeed] No new unique posts for ${tabToLoad} – recycling ${currentPosts.length} posts`);
          const recycled = [...currentPosts].sort(() => Math.random() - 0.5);
          setTabFeed(tabToLoad, {
            posts: [...currentPosts, ...recycled],
            offset: 0, // reset offset so next fetch starts from beginning
            hasMore: true, // never stop scrolling
            lastFetched: Date.now(),
          });
        }
      } else {
        setTabFeed(tabToLoad, {
          posts: incomingItems,
          offset: incomingItems.length,
          hasMore: true, // always keep scrolling possible
          lastFetched: Date.now(),
        });
      }
    } catch (error: any) {
      console.warn('Failed to load posts feed on home:', error);
      // Fallback: if we fail to fetch from API (e.g. offline), try to load from local WatermelonDB
      if (!append && tabToLoad === 'for_you' && Platform.OS !== 'web') {
        try {
          const { Q } = require('@nozbe/watermelondb');
          const { database } = require('../../src/database');
          if (database) {
            const localFeeds = await database.get('feeds')
              .query(Q.sortBy('created_at', Q.desc), Q.take(FEED_PAGE_SIZE))
              .fetch();
            if (localFeeds && localFeeds.length > 0) {
              console.log(`[HomeFeed Fallback] Loaded ${localFeeds.length} local posts from WatermelonDB after API failure`);
              const mappedFeeds = localFeeds.map((post: any) => ({
                id: post.id,
                user_id: post.userId,
                username: post.username,
                user_photo: post.userPhoto,
                media_url: post.mediaUrl,
                media_type: post.mediaType,
                caption: post.caption,
                likes_count: post.likesCount,
                comments_count: post.commentsCount,
                liked_by_me: post.likedByMe,
                created_at: post.createdAt,
                updated_at: post.updatedAt,
              }));
              setTabFeed(tabToLoad, {
                posts: mappedFeeds,
                offset: mappedFeeds.length,
                hasMore: true,
                lastFetched: Date.now(),
              });
              return; // Successfully loaded fallback
            }
          }
        } catch (localErr) {
          console.warn('[HomeFeed Fallback] Local database query failed:', localErr);
        }
      }
      if (!append) {
        setTabFeed(tabToLoad, {
          posts: [],
          offset: 0,
          hasMore: false,
        });
      }
    } finally {
      console.log(`[HomeFeed] loadFeedPosts finished for ${tabToLoad}`);
      setLoadingFeed(false);
      setLoadingMoreFeed(false);
    }
  }, [setTabFeed, isRefreshing]);


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

  const fetchLocalCommunities = useCallback(async () => {
    try {
      const response = await discoverCommunities();
      const allComms = response.data || [];
      const userGroupsList = allComms.filter(
        (item: any) => item.type === 'user_group' || item.type === 'local'
      );
      setLocalCommunities(userGroupsList);
    } catch (err) {
      console.warn('Failed to fetch local communities for home:', err);
    }
  }, []);

  const initializeHome = useCallback(async () => {
    try {
      fetchLocalCommunities();
      const res = await getHomeInit();

      // 1. Unread count & Festival
      if (res.data.unread_count !== undefined) setUnreadCount(res.data.unread_count);
      if (res.data.next_festival) setNextFestival(res.data.next_festival);

      // 2. Community Requests & Communities
      if (res.data.community_requests) {
        const reqs = res.data.community_requests;
        setCommunityRequests(reqs);
        AsyncStorage.setItem('home_community_requests', JSON.stringify(reqs)).catch(e => console.log(e));
      }
      if (res.data.communities) {
        const comms = res.data.communities;
        setCommunities(comms);
        AsyncStorage.setItem('home_communities', JSON.stringify(comms)).catch(e => console.log(e));
      }

      // 3. Feed Posts
      if (res.data.feed?.items && res.data.feed.items.length > 0) {
        const tabToLoad = useFeedStore.getState().activeTab || 'for_you';
        setTabFeed(tabToLoad, {
          posts: res.data.feed.items,
          offset: res.data.feed.items.length,
          hasMore: res.data.feed.has_more,
          lastFetched: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Failed to init home data:', err);
    }
  }, [setUnreadCount, setTabFeed, fetchLocalCommunities]);

  useEffect(() => {
    if (!isFocused) return;
    let isMounted = true;

    initializeHome();

    const fetchUnreadCount = async () => {
      try {
        const res = await getUnreadNotificationCount();
        if (isMounted) setUnreadCount(res.data.unread_count || 0);
      } catch (err) {
        console.log('Failed to fetch unread count:', err);
      }
    };

    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isFocused, initializeHome, setUnreadCount]);

  const handleNotificationPress = () => {
    setUnreadCount(0);
    router.push('/notifications');
    markAllNotificationsRead().catch((err) => {
      console.log('Failed to mark notifications as read:', err);
    });
  };

  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>(
    Array.isArray((user as any)?.following) ? (user as any).following : []
  );
  const [communityRequests, setCommunityRequests] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [localCommunities, setLocalCommunities] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'Help' | 'Blood' | 'Medical' | 'Financial' | 'Petition'>('Help');
  const [nextFestival, setNextFestival] = useState<any | null>(null);
  const [now, setNow] = useState(new Date());

  const { myVendor, vendors } = useVendorStore();

  useFocusEffect(
    useCallback(() => {
      const currentActiveTab = useFeedStore.getState().activeTab;
      const cached = useFeedStore.getState().tabFeeds[currentActiveTab];
      const nowTime = Date.now();
      const isStale = !cached || (nowTime - (cached.lastFetched || 0) > 120000); // 2 minutes
      if (!cached || cached.posts.length === 0 || isStale) {
        loadFeedPosts(0, false, currentActiveTab);
      }

      // Load vendor data dynamically for home tab cards
      const store = useVendorStore.getState();
      store.fetchMyVendor().catch((e) => console.warn('Home focus myVendor load error:', e));
      store.fetchVendors().catch((e) => console.warn('Home focus vendors load error:', e));
    }, [loadFeedPosts])
  );
  const feedTabsYRef = useRef(0);
  const [feedTabsY, setFeedTabsY] = useState(0);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const postHeightsRef = useRef<Record<string, number>>({});

  const [activePostKey, setActivePostKey] = useState<string | null>(null);
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
        // Optimistically add to current active tab if it matches the category
        // or if we are in 'for_you'
        if (activeTab === 'for_you' || activeTab === category) {
          const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
          setTabFeed(activeTab, {
            posts: [response.data, ...currentPosts]
          });
        }

        // Also clear cache for 'festivals' if we uploaded a festival post so it refreshes next time
        if (category === 'festivals' && activeTab !== 'festivals') {
          setTabFeed('festivals', { lastFetched: 0 }); // Mark as stale
        }
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
    if (!isFocused) return;
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, [isFocused]);

  const liveActive = isWithinGayatriMantraWindow(now);
  const liveEnd = getCurrentGayatriEnd(now);
  const feedPostKeys = useMemo(
    () => feedPosts.map((post, index) => `feed-${index}-${post.id || post.media_url || index}`),
    [feedPosts],
  );

  const snapOffsets = useMemo(() => {
    const offsets = [0, feedTabsY];
    feedPostKeys.forEach((key) => {
      const offset = postOffsetsRef.current[key];
      if (typeof offset === 'number') {
        // Snap so the post starts exactly below the sticky header tabs
        offsets.push(Math.round(feedTabsY + offset));
      }
    });
    return Array.from(new Set(offsets)).sort((a, b) => a - b);
  }, [feedTabsY, feedPostKeys]);

  useEffect(() => {
    if (activePostKey && activePostKey.length > 10) {
      markPostAsSeen(activePostKey);
    }
  }, [activePostKey]);

  const lastScrollTimeRef = useRef(0);

  const handleHomeScroll = useCallback((event: any) => {
    onHomeScrollTabBar(event);
    const y = event.nativeEvent.contentOffset.y;
    currentScrollY.current = y;


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
        // Stricter condition: Post must be at least 60% visible OR take up at least 50% of the screen
        const visibilityThreshold = Math.min(height * 0.6, SCREEN_HEIGHT * 0.5);
        if (visibleAmount > maxVisible && visibleAmount > visibilityThreshold) {
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
    // Legacy function, replaced by initializeHome
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await initializeHome();
    } catch (err) {
      console.warn('Refresh failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [initializeHome]);

  useEffect(() => {
    // Handled by main initializeHome now
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      if (navigation.isFocused()) {
        const isAtTop = currentScrollY.current <= 10;
        if (isAtTop) {
          onRefresh();
        } else {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
      }
    });
    return unsubscribe;
  }, [navigation, onRefresh]);

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

    // Update local database record optimistically
    if (Platform.OS !== 'web') {
      try {
        const { database } = require('../../src/database');
        if (database) {
          database.write(async () => {
            const feedRecord = await database.get('feeds').find(postId);
            if (feedRecord) {
              await feedRecord.update((record: any) => {
                record.likedByMe = optimisticPost.liked_by_me;
                record.likesCount = optimisticPost.likes_count;
              });
            }
          });
        }
      } catch (dbErr) {
        console.warn('[Like DB Update] failed:', dbErr);
      }
    }

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

  // Poll comments in real-time when the comment modal is visible
  useEffect(() => {
    if (!commentModalVisible || !selectedCommentPostId) return;

    const interval = setInterval(async () => {
      try {
        const response = await getPostComments(selectedCommentPostId, 50);
        if (Array.isArray(response.data)) {
          setPostComments(prev => {
            const serverComments = response.data;
            const optimistic = prev.filter(c => c.is_optimistic);
            const serverIds = new Set(serverComments.map((c: any) => c.id));
            const filteredOptimistic = optimistic.filter(c => !serverIds.has(c.id));
            return [...filteredOptimistic, ...serverComments];
          });
        }
      } catch (error) {
        console.warn('[Comments Polling] Failed:', error);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [commentModalVisible, selectedCommentPostId]);

  const handleSubmitComment = async () => {
    if (!selectedCommentPostId || !commentText.trim() || commentSubmitting) return;

    const textToPost = commentText.trim();
    const tempId = `temp-${Date.now()}`;
    const parentId = replyingToComment?.id || null;

    // Create optimistic comment
    const optimisticComment = {
      id: tempId,
      text: textToPost,
      username: firstName || 'User',
      user_photo: avatarUri || '',
      created_at: new Date().toISOString(),
      is_optimistic: true,
      parent_id: parentId,
    };

    // Add immediately to UI
    setPostComments(prev => [optimisticComment, ...prev]);
    setCommentText('');
    setReplyingToComment(null);

    setCommentSubmitting(true);
    try {
      const response = await addPostComment(selectedCommentPostId, textToPost, parentId || undefined);
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

      // Background refresh to ensure persistence on next modal open
      try {
        const freshResponse = await getPostComments(selectedCommentPostId, 50);
        if (Array.isArray(freshResponse.data)) {
          setPostComments(freshResponse.data);
        }
      } catch {
        // keep current state if refresh fails
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
    const appLink = post?.id ? `https://brahmand.app/post/${post.id}` : 'https://brahmand.app/';
    const mediaUrl = post?.media_url || '';
    const caption = post?.caption ? `\nCaption: ${post.caption}` : '';
    const message = `Check this post on Brahmand!${caption}\n\n${appLink}`;

    try {
      // Media download is native-only — skip on web
      if (Platform.OS !== 'web' && FileSystemModule?.cacheDirectory && FileSystemModule?.downloadAsync && mediaUrl) {
        const inferredExt = post?.media_type === 'video' ? 'mp4' : 'jpg';
        const localPath = `${FileSystemModule.cacheDirectory}share-${Date.now()}.${inferredExt}`;
        try {
          const downloadRes = await FileSystemModule.downloadAsync(mediaUrl, localPath);
          if (downloadRes?.uri) {
            await Share.share({ message, url: downloadRes.uri, title: 'Share via Brahmand' });
            return;
          }
        } catch (downloadErr) {
          console.warn('[handleShareExternal] Media download failed, sharing text only:', downloadErr);
        }
      }
      await Share.share({ message: `${message}${mediaUrl ? '\n' + mediaUrl : ''}`, url: appLink, title: 'Share via Brahmand' });
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

  const handleDeleteComment = useCallback(async (comment: any) => {
    const commentId = comment?.id;
    if (!commentId || !selectedCommentPostId) return;

    const originalComments = [...postComments];
    const originalPost = { ...selectedCommentPost };

    setPostComments(prev => prev.filter(c => c.id !== commentId));

    const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
    const postToUpdate = currentPosts.find(p => p.id === selectedCommentPostId);

    let originalPostInFeed: any = null;
    if (postToUpdate) {
      originalPostInFeed = { ...postToUpdate };
      const currentTop = Array.isArray(postToUpdate.top_comments) ? postToUpdate.top_comments : [];
      const updatedTop = currentTop.filter((c: any) => c.id !== commentId);
      setTabFeed(activeTab, {
        posts: currentPosts.map((item) => {
          if (item.id === selectedCommentPostId) {
            return {
              ...item,
              comments_count: Math.max(0, (Number(item.comments_count) || 0) - 1),
              top_comments: updatedTop,
            };
          }
          return item;
        })
      });
    }

    if (selectedCommentPost) {
      setSelectedCommentPost((prev: any) => {
        if (prev?.id === selectedCommentPostId) {
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

    try {
      const response = await deletePostComment(selectedCommentPostId, commentId);
      const updatedPostFromServer = response.data?.post;

      if (updatedPostFromServer) {
        const refreshedPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
        setTabFeed(activeTab, {
          posts: refreshedPosts.map((item) => {
            if (item.id === selectedCommentPostId) {
              const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
              return {
                ...item,
                ...updatedPostFromServer,
                top_comments: currentTop.slice(0, 2),
              };
            }
            return item;
          })
        });

        setSelectedCommentPost((prev: any) => {
          if (prev?.id === selectedCommentPostId) {
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
      if (originalPostInFeed) {
        const refreshedPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
        setTabFeed(activeTab, {
          posts: refreshedPosts.map(p => p.id === selectedCommentPostId ? originalPostInFeed : p)
        });
      }
      if (originalPost) {
        setSelectedCommentPost(originalPost);
      }
      const detail = error.response?.data?.detail || error.message;
      Alert.alert('Error', detail || 'Could not delete comment. Please try again.');
    }
  }, [postComments, selectedCommentPostId, selectedCommentPost, activeTab, setTabFeed]);

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
    const postKey = `feed-${index}-${String(item.id || item.media_url || index)}`;
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
          theme="dark"
          isBlackBackground={true}
          isFirstReel={index === 0}
        />
      </View>
    );
  }, [activePostKey, currentUserId, handleLikePost, handleOpenComment, handleOpenPostUserProfile, handlePostMenuPress, handleRepost, handleSharePost]);

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FF8D57' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#FF8D57', '#EA9B76', '#FFEEE5']} locations={[0, 0.0913, 0.25]} style={styles.screen}>
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
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#FF6B00"
                colors={['#FF6B00']}
              />
            }
            stickyHeaderIndices={loadingFeed && feedPosts.length === 0 ? [] : [1]}
            onScroll={handleHomeScroll}
            scrollEventThrottle={16}
          >
            <View>
              {loadingFeed && feedPosts.length === 0 && (
                <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 50 }}>
                  {/* Avatar + Lines */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.6)' }} />
                    <View style={{ marginLeft: 12 }}>
                      <View style={{ width: 150, height: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 6, marginBottom: 8 }} />
                      <View style={{ width: 100, height: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 5 }} />
                    </View>
                  </View>

                  {/* 3 Horizontal Boxes */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ width: '31%', height: 70, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                    <View style={{ width: '31%', height: 70, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                    <View style={{ width: '31%', height: 70, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                  </View>

                  {/* 1 Large Box */}
                  <View style={{ width: '100%', height: 220, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, marginBottom: 20, padding: 15, justifyContent: 'space-between' }}>
                    <View style={{ alignSelf: 'flex-end', width: 40, height: 20, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 10 }} />
                    <View style={{ width: '40%', height: 35, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 20 }} />
                  </View>

                  {/* 4 Vertical Boxes */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ width: '23%', height: 140, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                    <View style={{ width: '23%', height: 140, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                    <View style={{ width: '23%', height: 140, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                    <View style={{ width: '23%', height: 140, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                  </View>

                  {/* 2 Horizontal Boxes */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                    <View style={{ width: '48%', height: 70, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                    <View style={{ width: '48%', height: 70, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 }} />
                  </View>

                  {/* 3 Thin Lines */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, paddingHorizontal: 20 }}>
                    <View style={{ width: '25%', height: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                    <View style={{ width: '25%', height: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                    <View style={{ width: '25%', height: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                  </View>

                  {/* Bottom Avatar + Lines */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.6)' }} />
                    <View style={{ marginLeft: 12 }}>
                      <View style={{ width: 150, height: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 6, marginBottom: 8 }} />
                      <View style={{ width: 100, height: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 5 }} />
                    </View>
                  </View>
                </View>
              )}
              {!(loadingFeed && feedPosts.length === 0) && (
                <View
                  onLayout={(event) => {
                    const h = event.nativeEvent.layout.height;
                    feedTabsYRef.current = h;
                    setFeedTabsY(h);
                  }}
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
                            <Text style={styles.greeting}>{t('namaste')} {firstName} 🙏</Text>
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
                            {(unreadCount > 0 || (!!nextFestival && (nextFestival.days_until === 0 || nextFestival.days_until === 1))) && <View style={styles.notificationDot} />}
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {nextFestival && (nextFestival.days_until === 0 || nextFestival.days_until === 1) && (
                      <TouchableOpacity
                        style={styles.festivalAlertCard}
                        activeOpacity={0.9}
                        onPress={() => router.push('/festivals')}
                      >
                        <View style={styles.festivalAlertIcon}>
                          <Ionicons name="notifications-outline" size={18} color="#FFF" />
                        </View>
                        <View style={styles.festivalAlertTextWrapper}>
                          <Text style={styles.festivalAlertTitle}>{t('festivalReminder')}</Text>
                          <Text style={styles.festivalAlertSubtitle} numberOfLines={2}>
                            {nextFestival.days_until === 0
                              ? `${nextFestival.name} ${t('isTodayClick')}`
                              : `${nextFestival.name} ${t('isTomorrowClick')} (${formatFestivalDate(nextFestival.date)})`}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FFF" />
                      </TouchableOpacity>
                    )}

                    {searchActive ? (
                      <View style={styles.searchPanel}>
                        <View style={styles.searchBar}>
                          <Ionicons name="search" size={18} color="#6F5C70" />
                          <TextInput
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholder={t('recentSearchPlaceholder')}
                            placeholderTextColor="#8E7D90"
                            autoFocus
                          />
                        </View>
                        {searchTerm.trim().length > 0 ? (
                          <View style={styles.searchResultsSection}>
                            {searchTerm.trim().startsWith('#') ? (
                              loadingHashtags ? (
                                <Text style={styles.searchStatusText}>{t('loadingHashtags')}</Text>
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
                                <Text style={styles.searchStatusText}>{t('noPostsHashtag')}</Text>
                              )
                            ) : loadingUsers ? (
                              <Text style={styles.searchStatusText}>{t('loadingUsers')}</Text>
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
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <Text style={styles.userResultName}>{item.name || 'Unknown'}</Text>
                                          {item.is_verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
                                        </View>
                                        <Text style={styles.userResultMeta}>{item.sl_id || item.phone || ''}</Text>
                                      </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.followButton, isFollowing && styles.followingButton]}
                                      activeOpacity={0.8}
                                      onPress={() => handleFollowUser(item.id)}
                                    >
                                      <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                        {isFollowing ? t('following') : t('follow')}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                );
                              })
                            ) : (
                              <Text style={styles.searchStatusText}>{t('noUsersFound')}</Text>
                            )}
                          </View>
                        ) : recentSearches.length > 0 ? (
                          <View style={styles.recentSearchSection}>
                            <View style={styles.recentSearchHeader}>
                              <Text style={styles.recentSearchesTitle}>{t('recentSearchTitle')}</Text>
                              <TouchableOpacity onPress={async () => {
                                if (user?.id) {
                                  setRecentSearches([]);
                                  await AsyncStorage.removeItem(`recent_searches_${user.id}`);
                                }
                              }}>
                                <Text style={styles.clearHistoryText}>{t('clearHistory')}</Text>
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
                          snapToInterval={185}
                          decelerationRate="fast"
                          contentContainerStyle={{ gap: 10, paddingHorizontal: PAGE_PADDING }}
                        >
                          {baseQuickAccess.map((item, idx) => {
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

                            let displayLabel = item.label;
                            let displaySubtitle = item.subtitle;



                            if (t('language') === 'hi') {
                              if (item.label === 'My Krishna') {
                                displayLabel = 'मेरे कृष्ण';
                                displaySubtitle = 'एआई धर्म मार्गदर्शन';
                              } else if (item.label === 'SOS') {
                                displayLabel = 'एसओएस (SOS)';
                                displaySubtitle = 'आपके आसपास के सनातनी लोग';
                              } else if (item.label === 'Panchang') {
                                displayLabel = 'पंचांग';
                                displaySubtitle = 'Plan with\nVedic wisdom';
                              } else if (item.label === 'Kundli') {
                                displayLabel = 'कुंडली';
                                displaySubtitle = 'Your birth chart insights';
                              } else if (item.label === 'Jyotish') {
                                displayLabel = 'ज्योतिष';
                                displaySubtitle = 'Your birth chart insights';
                              } else if (item.label === 'Brahmand Passport') {
                                displayLabel = 'ब्रह्मांड पासपोर्ट';
                                displaySubtitle = 'आपकी मंदिर यात्रा का रिकॉर्ड';
                              } else if (item.label === 'Festival') {
                                displayLabel = 'त्योहार के दिन';
                                displaySubtitle = 'अगला त्योहार और अनुष्ठान';
                              } else if (item.label === 'Brahmand Library') {
                                displayLabel = 'ब्रह्मांड पुस्तकालय';
                                displaySubtitle = 'ज्ञान की खोज करें';
                              }
                            }

                            return (
                              <TouchableOpacity
                                key={idx}
                                style={styles.featureCard}
                                activeOpacity={0.9}
                                onPress={() => {
                                  if (item.label === 'Panchang') router.push('/panchang');
                                  else if (item.label === 'My Krishna') router.push('/my-krishna');
                                  else if (item.label === 'SOS') router.push('/sos');
                                  else if (item.label === 'Kundli') router.push('/astrology' as any);
                                  else if (item.label === 'Jyotish') router.push('/horoscope');
                                  else if (item.label === 'Brahmand Passport') router.push('/passport');
                                  else if (item.label === 'Festival') router.push('/festivals');
                                  else if (item.label === 'Brahmand Library') router.push('/library');
                                }}
                              >
                                {item.label === 'SOS' ? (
                                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 0, 0, 0.10)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{ width: 42.2, height: 42.2, borderRadius: 21.1, backgroundColor: 'rgba(255, 0, 0, 0.50)', justifyContent: 'center', alignItems: 'center' }}>
                                      <View style={{ width: 34.5, height: 34.5, borderRadius: 17.25, backgroundColor: 'rgba(255, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ color: '#FFF', textAlign: 'center', fontFamily: 'System', fontSize: 11, fontWeight: '600' }}>SOS</Text>
                                      </View>
                                    </View>
                                  </View>
                                ) : item.label === 'My Krishna' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'hidden' }]}>
                                    <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                      <ExpoImage source={require('../../assets/images/tab bar/my_krishna.png')} style={{ width: 42, height: 42 }} contentFit="contain" />
                                    </ImageBackground>
                                  </View>
                                ) : item.label === 'Panchang' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'hidden' }]}>
                                    <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                      <Image source={require('../../assets/images/panchang_icon_3.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                                    </ImageBackground>
                                  </View>
                                ) : item.label === 'Kundli' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'hidden' }]}>
                                    <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                      <Image source={require('../../assets/images/custom_kundli_icon.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                                    </ImageBackground>
                                  </View>
                                ) : item.label === 'Jyotish' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'hidden' }]}>
                                    <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                      <Image source={require('../../assets/images/tab bar/siren_phosphor2.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </ImageBackground>
                                  </View>
                                ) : item.label === 'Brahmand Passport' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'visible', width: 52, height: 67 }]}>
                                    <Image source={require('../../assets/images/custom_passport_icon.png')} style={{ width: 53, height: 67, flexShrink: 0, aspectRatio: 41 / 52 }} resizeMode="contain" />
                                  </View>
                                ) : item.label === 'Festival' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'hidden' }]}>
                                    <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                      <Image source={require('../../assets/images/custom_festival_icon_2.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
                                    </ImageBackground>
                                  </View>
                                ) : item.label === 'Brahmand Library' ? (
                                  <View style={[styles.featureIconWrap, { overflow: 'hidden' }]}>
                                    <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                      <Image source={require('../../assets/images/library_icon_3.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                                    </ImageBackground>
                                  </View>
                                ) : (
                                  <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
                                    <Ionicons name="calendar" size={24} color="#FFF" />
                                  </View>
                                )}
                                <View style={styles.featureTextContainer}>
                                  <Text style={styles.featureTitle} numberOfLines={undefined}>{displayLabel}</Text>
                                  {displaySubtitle ? (
                                    <Text style={styles.featureSubtitle} numberOfLines={undefined}>{displaySubtitle}</Text>
                                  ) : null}
                                </View>
                                <Ionicons name="chevron-forward" size={12} color="#999" style={{ marginLeft: 'auto' }} />
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    <View style={{ position: 'relative' }}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToInterval={SCREEN_WIDTH - 40 + 12}
                        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                        onScroll={(e) => {
                          const x = e.nativeEvent.contentOffset.x;
                          const idx = Math.round(x / (SCREEN_WIDTH - 40));
                          setActiveBannerIndex(idx);
                        }}
                        scrollEventThrottle={16}
                      >
                        <View style={[styles.featuredLiveCard, { width: SCREEN_WIDTH - 40 }]}>
                          <ImageBackground source={require('../../assets/images/hanuman_banner_new.jpg')} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }} resizeMode="cover">
                            <LinearGradient
                              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                              style={styles.featuredLiveOverlay}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                {/* Top Left Content */}
                                <View style={{ paddingTop: 0, paddingLeft: 0 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                    <Text style={[
                                      styles.featuredLiveTitle,
                                      {
                                        color: '#FFF',
                                        fontFamily: 'System',
                                        fontSize: 15,
                                        fontStyle: 'normal',
                                        fontWeight: '700',
                                        letterSpacing: 1,
                                        textShadowColor: 'rgba(0,0,0,0.9)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 6,
                                      }
                                    ]}>Hanuman Chalisa</Text>
                                  </View>

                                  <Text style={[styles.featuredDevotees, {
                                    color: '#FFF',
                                    fontWeight: '600',
                                    opacity: 0.9,
                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 4,
                                    marginLeft: 14,
                                    marginTop: 0,
                                    marginBottom: 2,
                                    fontSize: 13
                                  }]}>1,248 devotees are chanting</Text>

                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                    <Ionicons name="time-outline" size={13} color="#FFF" />
                                    <Text style={[styles.featuredTime, {
                                      marginTop: 0,
                                      marginLeft: 4,
                                      color: '#FFF',
                                      fontWeight: '600',
                                      fontSize: 12
                                    }]}>Live until 5:00 PM</Text>
                                  </View>
                                </View>

                                {/* Top Right LIVE Badge */}
                                <View style={[styles.liveBadge, { alignSelf: 'flex-start' }]}>
                                  <View style={styles.liveDot} />
                                  <Text style={styles.liveBadgeText}>LIVE</Text>
                                </View>
                              </View>

                              {/* Bottom Button */}
                              <View style={{ alignItems: 'center', paddingBottom: 0 }}>
                                <TouchableOpacity
                                  style={[
                                    styles.joinJaapButton,
                                    {
                                      backgroundColor: '#FF5100',
                                      display: 'flex',
                                      width: 138,
                                      height: 36,
                                      paddingHorizontal: 12,
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      gap: 10,
                                    }
                                  ]}
                                  onPress={() => router.push({ pathname: '/live-jaap-welcome', params: { fromHome: 'true', mantraType: 'hanuman', title: 'Hanuman Chalisa' } })}
                                >
                                  <Text style={styles.joinJaapText}>{t('joinLiveJaap')}</Text>
                                </TouchableOpacity>
                              </View>
                            </LinearGradient>
                          </ImageBackground>
                        </View>

                        <View style={[styles.featuredLiveCard, { width: SCREEN_WIDTH - 40 }]}>
                          <ImageBackground source={shivaImage} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }}>
                            <LinearGradient
                              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                              style={styles.featuredLiveOverlay}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                {/* Top Left Content */}
                                <View style={{ paddingTop: 0, paddingLeft: 0 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                    <Text style={[
                                      styles.featuredLiveTitle,
                                      {
                                        color: '#FFF',
                                        fontFamily: 'System',
                                        fontSize: 15,
                                        fontStyle: 'normal',
                                        fontWeight: '700',
                                        letterSpacing: 1,
                                        textShadowColor: 'rgba(0,0,0,0.9)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 6,
                                      }
                                    ]}>Mahamrityunjaya Mantra</Text>
                                  </View>

                                  <Text style={[styles.featuredDevotees, {
                                    color: '#FFF',
                                    fontWeight: '600',
                                    opacity: 0.9,
                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 4,
                                    marginLeft: 14,
                                    marginTop: 0,
                                    marginBottom: 2,
                                    fontSize: 13
                                  }]}>1,248 {t('devoteesChanting')}</Text>

                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                    <Ionicons name="time-outline" size={13} color="#FFF" />
                                    <Text style={[styles.featuredTime, {
                                      marginTop: 0,
                                      marginLeft: 4,
                                      color: '#FFF',
                                      fontWeight: '600',
                                      fontSize: 12
                                    }]}>{t('liveUntil')} 5:00 PM</Text>
                                  </View>
                                </View>

                                {/* Top Right LIVE Badge */}
                                <View style={[styles.liveBadge, { alignSelf: 'flex-start' }]}>
                                  <View style={styles.liveDot} />
                                  <Text style={styles.liveBadgeText}>LIVE</Text>
                                </View>
                              </View>

                              {/* Bottom Button */}
                              <View style={{ alignItems: 'center', paddingBottom: 0 }}>
                                <TouchableOpacity
                                  style={[
                                    styles.joinJaapButton,
                                    {
                                      backgroundColor: '#FF5100',
                                      display: 'flex',
                                      width: 138,
                                      height: 36,
                                      paddingHorizontal: 12,
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      gap: 10,
                                    }
                                  ]}
                                  onPress={() => router.push({ pathname: '/live-jaap-welcome', params: { fromHome: 'true', mantraType: 'shiva', title: 'Mahamrityunjaya Mantra' } })}
                                >
                                  <Text style={styles.joinJaapText}>{t('joinLiveJaap')}</Text>
                                </TouchableOpacity>
                              </View>
                            </LinearGradient>
                          </ImageBackground>
                        </View>
                      </ScrollView>

                      <View style={{ position: 'absolute', bottom: 15, left: 0, right: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, zIndex: 10 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeBannerIndex === 0 ? '#FFF' : 'rgba(255,255,255,0.5)' }} />
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeBannerIndex === 1 ? '#FFF' : 'rgba(255,255,255,0.5)' }} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.postBannerSection}>
                    <ScrollView
                      ref={actionCardsScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      snapToInterval={Platform.OS === 'ios' ? 130 : 120}
                      decelerationRate="fast"
                      contentContainerStyle={styles.actionCardsScroll}
                      style={[styles.actionCardsScrollView, { marginBottom: 8 }]}
                    >
                      {/* Urgent Blood Request */}
                      <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 2 }}>
                        <View style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderRadius: 15, overflow: 'hidden' }]}>
                          <HomeCardTextureBg texture="rose">
                            <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 4 }]}>
                              <View style={[styles.cardIconRow, { marginBottom: 6, marginTop: -12 }]}>
                                <BloodDropIcon />
                              </View>
                              <Text style={{ textAlign: 'center', fontSize: 13, color: '#000', width: 100, lineHeight: 16, fontFamily: 'Inter_700Bold' }} numberOfLines={2} adjustsFontSizeToFit>{bloodRequest ? `${bloodRequest.blood_group || 'Blood'} ${t('bloodRequired')}` : t('needBlood')}</Text>
                              <Text style={{ textAlign: 'center', fontSize: 11, color: '#222', width: 105, marginTop: 4, lineHeight: 14, fontFamily: 'Inter_600SemiBold' }} numberOfLines={4}>{bloodRequest ? `${bloodRequest.hospital_name || t('emergency')}\n${bloodRequest.location || t('nearby')}` : t('createUrgentRequest')}</Text>
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
                                if (bloodRequest) {
                                  router.push({
                                    pathname: '/community-request/list',
                                    params: {
                                      requestId: bloodRequest.id,
                                      community_id: bloodRequest.community_id
                                    }
                                  });
                                } else {
                                  router.push('/community-request/list');
                                }
                              }}
                            >
                              <Text style={{ color: '#FFF', fontSize: 12, textAlign: 'center', fontFamily: 'Inter_700Bold' }} numberOfLines={1}>{t('view')}</Text>
                            </TouchableOpacity>
                          </HomeCardTextureBg>
                        </View>
                        {/* Badge rendered as sibling outside to prevent any iOS clipping */}
                        <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                          <View style={{ width: 95, height: 18, borderRadius: 9, borderWidth: 1.2, borderColor: '#FF0000', backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                            <Text style={{ color: '#FF0000', fontSize: 10, textAlign: 'center', fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{t('yourCommunity')}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Register Business */}
                      <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 2 }}>
                        <View style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderRadius: 15, overflow: 'hidden' }]}>
                          <HomeCardTextureBg texture="peach">
                            <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 4 }]}>
                              <View style={[styles.cardIconRow, { marginBottom: 6, marginTop: -12 }]}>
                                <ShopIcon />
                              </View>
                              <Text style={{ textAlign: 'center', fontSize: 13, color: '#000', width: 85, lineHeight: 16, fontFamily: 'Inter_700Bold' }} numberOfLines={2}>{myVendor ? t('manageYour') : t('becomeVerified')}</Text>
                              <Text style={{ textAlign: 'center', fontSize: 10, color: '#000', width: 95, marginTop: 4, lineHeight: 13, fontFamily: 'Inter_500Medium' }} numberOfLines={2}>{myVendor ? t('businessProfile') : t('sanatanVendor')}</Text>
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
                              onPress={() => {
                                if (myVendor) {
                                  router.push('/vendor/dashboard');
                                } else {
                                  router.push('/(tabs)/vendor');
                                }
                              }}
                            >
                              <Text style={{ color: '#FFF', fontSize: 12, textAlign: 'center', fontFamily: 'Inter_700Bold' }} numberOfLines={1}>{myVendor ? t('manage') : t('register')}</Text>
                            </TouchableOpacity>
                          </HomeCardTextureBg>
                        </View>
                        {/* Badge rendered as sibling outside LinearGradient to prevent any iOS clipping */}
                        <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                          <View style={{ width: 65, height: 18, borderRadius: 9, borderWidth: 1.2, borderColor: '#FF9500', backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                            <Text style={{ color: '#FF9500', fontSize: 10, textAlign: 'center', fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{myVendor ? (myVendor.kyc_status === 'verified' ? t('approved') : t('pending')) : t('free')}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Verified Vendor */}
                      {(() => {
                        const displayVendor = vendors.find(v => v.kyc_status === 'verified') || vendors[0];
                        const businessName = displayVendor ? displayVendor.business_name : 'Sai Flower Decorator';
                        const categoryAndLoc = displayVendor
                          ? `${displayVendor.categories?.[0] || 'Decor'}\n${displayVendor.full_address || 'Nearby'}`
                          : 'Flower Decor\nAndheri West';

                        return (
                          <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 2 }}>
                            <View style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderRadius: 15, overflow: 'hidden' }]}>
                              <HomeCardTextureBg texture="mint">
                                <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 4 }]}>
                                  <View style={[styles.cardIconRow, { marginBottom: 6, marginTop: -12 }]}>
                                    <LotusIcon />
                                  </View>
                                  <Text style={{ textAlign: 'center', fontSize: 13, color: '#000', width: 95, lineHeight: 16, fontFamily: 'Inter_700Bold' }} numberOfLines={2}>{businessName}</Text>
                                  <Text style={{ textAlign: 'center', fontSize: 11, color: '#222', width: 95, marginTop: 4, lineHeight: 14, fontFamily: 'Inter_600SemiBold' }} numberOfLines={2}>{categoryAndLoc}</Text>
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
                                  onPress={() => {
                                    if (displayVendor) {
                                      router.push(`/vendor/${displayVendor.id}`);
                                    } else {
                                      router.push('/(tabs)/vendor');
                                    }
                                  }}
                                >
                                  <Text style={{ color: '#FFF', fontSize: 12, textAlign: 'center', fontFamily: 'Inter_700Bold' }} numberOfLines={1}>{t('view')}</Text>
                                </TouchableOpacity>
                              </HomeCardTextureBg>
                            </View>
                            {/* Badge rendered as sibling outside LinearGradient to prevent any iOS clipping */}
                            <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                              <View style={[styles.cardHeaderBadgeTeal, { borderColor: '#00C781', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingHorizontal: 11, paddingVertical: 3, alignSelf: 'center', borderRadius: 10, borderWidth: 1.2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}>
                                <Text style={[styles.cardBadgeTextDark, { color: '#00C781', fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>{t('verifiedVendor')}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })()}

                      {/* Live Aarti */}
                      <View style={{ width: Platform.OS === 'ios' ? 120 : 110, height: Platform.OS === 'ios' ? 180 : 172, position: 'relative', overflow: 'visible', marginHorizontal: 2 }}>
                        <View style={[styles.actionCard, { width: '100%', height: '100%', marginHorizontal: 0, borderRadius: 15, overflow: 'hidden' }]}>
                          <HomeCardTextureBg texture="lavender">
                            <View style={[styles.cardMainContent, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 4, paddingHorizontal: 4 }]}>
                              <View style={[styles.cardIconRow, { marginBottom: 6, marginTop: -12 }]}>
                                <TempleIcon />
                              </View>
                              <Text style={{ textAlign: 'center', fontSize: 13, color: '#000', width: 100, lineHeight: 16, fontFamily: 'Inter_700Bold' }} numberOfLines={3}>{t('liveKedarnathAarti')}</Text>
                              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 4, width: 95 }}>
                                <Text style={{ textAlign: 'center', fontSize: 10, color: '#000', lineHeight: 13, fontFamily: 'Inter_500Medium' }}>{t('notify')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={{ textAlign: 'center', fontSize: 10, color: '#000', lineHeight: 13, fontFamily: 'Inter_500Medium' }}>{t('me')}</Text>
                                  <TouchableOpacity
                                    onPress={() => Alert.alert('Notification Set', "We'll notify you when Kedarnath Aarti starts.")}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ marginLeft: 3 }}
                                  >
                                    <Ionicons name="notifications-outline" size={18} color="#000" />
                                  </TouchableOpacity>
                                </View>
                              </View>
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
                              <Text style={{ color: '#FFF', fontSize: 12, textAlign: 'center', fontFamily: 'Inter_700Bold' }} numberOfLines={1}>{t('watch')}</Text>
                            </TouchableOpacity>
                          </HomeCardTextureBg>
                        </View>
                        {/* Badge rendered as sibling outside LinearGradient to prevent any iOS clipping */}
                        <View style={{ position: 'absolute', top: -12, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
                          <View style={[{ borderColor: '#8C36DB', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingHorizontal: 11, paddingVertical: 3, alignSelf: 'center', borderRadius: 10, borderWidth: 1.2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}>
                            <Text style={[styles.cardBadgeTextDark, { color: '#8C36DB', fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>{t('templeLabel')}</Text>
                          </View>
                        </View>
                      </View>
                    </ScrollView>
                  </View>

                  <View style={styles.twoButtonsRow}>
                      {/* Mumbai Community Card */}
                      {(() => {
                        const cityComm = communities.find(c => c.type === 'city');
                        let cityName = cityComm?.name || 'City Community';
                        if (t('language') === 'hi') {
                          if (cityName === 'City Community') {
                            cityName = 'शहर समुदाय';
                          } else if (cityName.toLowerCase().includes('mumbai')) {
                            cityName = 'मुंबई समुदाय';
                          }
                        }
                        const cityId = cityComm?.id || 'city_default';
                        return (
                          <TouchableOpacity
                            style={styles.communityCardMini}
                            activeOpacity={0.9}
                            onPress={() => {
                              router.push({
                                pathname: '/community/[id]',
                                params: { id: cityId, subgroup: 'city', name: cityName }
                              });
                            }}
                          >
                            <Image source={require('../../assets/images/mumbai_pin.png')} style={styles.communityCardIcon} />
                            <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                              <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('cityCommunity').toUpperCase()}</Text>
                              <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                                {cityName}
                              </Text>
                              <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>13 {t('members')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                          </TouchableOpacity>
                        );
                      })()}

                      {/* Local Community Card */}
                      {(() => {
                        const localComm =
                          communities.find(c => c.is_default || c.type === 'user_group' || c.type === 'local') ||
                          localCommunities.find(c => c.type === 'user_group' || c.type === 'local');
                        const localId = localComm?.id || 'food_pune';
                        let realGroupName = localComm?.name || 'Pune Food Sharing Group';
                        if (t('language') === 'hi') {
                          if (realGroupName === 'Pune Food Sharing Group') {
                            realGroupName = 'पुणे भोजन साझाकरण समूह';
                          }
                        }
                        const localMembers = localComm ? (localComm.member_count || localComm.members_count || 12) : 236;
                        const localSubgroup = localComm?.type || 'city';
                        return (
                          <TouchableOpacity
                            style={styles.communityCardMini}
                            activeOpacity={0.9}
                            onPress={() => {
                              router.push({
                                pathname: '/community/[id]',
                                params: { id: localId, subgroup: localSubgroup, name: realGroupName }
                              });
                            }}
                          >
                            <View style={styles.communityCardIconBox}>
                              <Image source={require('../../assets/images/food_sharing.png')} style={styles.communityCardIconRound} />
                            </View>
                            <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                              <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('foodSharing').toUpperCase()}</Text>
                              <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                                {realGroupName}
                              </Text>
                              <View style={styles.miniCardBottomRow}>
                                <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>{localMembers} {t('members')}</Text>
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
        )}
      </View>

            {!(loadingFeed && feedPosts.length === 0) && (
              <View style={styles.stickyFeedTabsShell}>
                <View style={styles.stickyFeedTabs}>
                  <HomeFeedTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      requestAnimationFrame(() => {
                        setActiveTab(tab);
                      });
                    }}
                    onCreatePost={() => setShowUploadPostModal(true)}
                  />
                </View>
              </View>
            )}

            {!(loadingFeed && feedPosts.length === 0) && (
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
                  <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                    {[1, 2, 3].map((key) => (
                      <AnimatedSkeleton key={key} style={{ backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16, shadowColor: '#FF8A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 138, 0, 0.1)' }} />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <View style={{ width: '50%', height: 12, backgroundColor: 'rgba(255, 138, 0, 0.1)', borderRadius: 6, marginBottom: 8 }} />
                            <View style={{ width: '30%', height: 10, backgroundColor: 'rgba(255, 138, 0, 0.05)', borderRadius: 5 }} />
                          </View>
                        </View>
                        <View style={{ width: '100%', height: 300, backgroundColor: 'rgba(255, 138, 0, 0.06)', borderRadius: 16, marginBottom: 12 }} />
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 138, 0, 0.05)' }} />
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 138, 0, 0.05)' }} />
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 138, 0, 0.05)' }} />
                        </View>
                      </AnimatedSkeleton>
                    ))}
                  </View>
                ) : activeTab === 'jyotish' ? (
                  <HomeJyotishSection />
                ) : feedPosts.length > 0 ? (
                  <>
                    {feedPosts.map((post, index) => {
                      const postKey = `feed-${index}-${String(post.id || post.media_url || index)}`;
                      const yOffset = postOffsetsRef.current[postKey];
                      const cardHeight = postHeightsRef.current[postKey];

                      const isFarOffScreen =
                        typeof yOffset === 'number' &&
                        typeof cardHeight === 'number' &&
                        (yOffset + cardHeight < currentScrollY.current - SCREEN_HEIGHT * 1.5 ||
                          yOffset > currentScrollY.current + SCREEN_HEIGHT * 2.0);

                      return (
                        <View
                          key={postKey}
                          onLayout={(event) => {
                            const y = event.nativeEvent.layout.y;
                            const h = event.nativeEvent.layout.height;
                            postOffsetsRef.current[postKey] = y;
                            postHeightsRef.current[postKey] = h;
                          }}
                          style={isFarOffScreen ? { height: cardHeight } : undefined}
                        >
                          {isFarOffScreen ? (
                            <View style={{ height: cardHeight, backgroundColor: '#F9F9F9', borderRadius: 16, marginVertical: 8, opacity: 0.5 }} />
                          ) : (
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
                              theme="dark"
                              isBlackBackground={true}
                              isFirstReel={index === 0}
                            />
                          )}
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
            )}
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
              if (Platform.OS !== 'web' && selectedSharePost?.media_url && FileSystemModule?.downloadAsync) {
                try {
                  const ext = selectedSharePost.media_type === 'video' ? 'mp4' : 'jpg';
                  const localPath = `${FileSystemModule.documentDirectory}brahmand_post_${Date.now()}.${ext}`;
                  await FileSystemModule.downloadAsync(selectedSharePost.media_url, localPath);
                  alert('Saved to app documents');
                } catch {
                  alert('Download failed');
                }
              } else {
                alert('Download not supported on this platform');
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
              setActiveCommentMenuId(null);
              setReplyingToComment(null);
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
                  setActiveCommentMenuId(null);
                  setReplyingToComment(null);
                }}
              />
              <View style={styles.commentSheet}>
                <View style={styles.bottomSheetHandle} />
                <View style={styles.commentSheetHeader}>
                  <Text style={styles.commentTitle}>Comments ({selectedCommentPost?.comments_count ?? postComments.length ?? 0})</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCommentModalVisible(false);
                      setSelectedCommentPostId(null);
                      setSelectedCommentPost(null);
                      setPostComments([]);
                      setReplyingToComment(null);
                    }}
                    style={styles.commentCloseBtn}
                  >
                    <Ionicons name="close" size={24} color="#22142E" />
                  </TouchableOpacity>
                </View>



                <View style={styles.commentListWrap}>
                  {commentsLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#FF6B00" />
                      <Text style={[styles.commentEmptyText, { marginTop: 10 }]}>Loading comments...</Text>
                    </View>
                  ) : postComments.length > 0 ? (() => {
                    const parentComments = postComments.filter(c => !c.parent_id);
                    const repliesMap = postComments.reduce((acc, c) => {
                      if (c.parent_id) {
                        if (!acc[c.parent_id]) acc[c.parent_id] = [];
                        acc[c.parent_id].push(c);
                      }
                      return acc;
                    }, {} as Record<string, any[]>);

                    return (
                      <FlatList
                        data={parentComments}
                        keyExtractor={(item) => item.id || `${item.user_id}-${item.created_at}`}
                        renderItem={({ item }) => {
                          const canDelete = item.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                          const replies = repliesMap[item.id] || [];
                          return (
                            <View style={{ marginBottom: 12, position: 'relative' }}>
                              {replies.length > 0 && (
                                <View style={{
                                  position: 'absolute',
                                  left: 15,
                                  top: 32,
                                  bottom: 0,
                                  width: 1.5,
                                  backgroundColor: '#E6E1E8',
                                  zIndex: 1,
                                }} />
                              )}
                              <View style={styles.commentItem}>
                                <Avatar name={item?.username || 'User'} photo={item?.user_photo} size={32} />
                                <View style={styles.commentBubble}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                                    {canDelete && (
                                      <TouchableOpacity
                                        style={{ padding: 4, marginRight: -4, marginTop: -4 }}
                                        onPress={() => handleDeleteComment(item)}
                                      >
                                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <MentionText style={styles.commentItemText} text={item?.text || ''} />
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={styles.commentTime}>{formatTimeAgo(item?.created_at)}</Text>
                                    <TouchableOpacity
                                      style={{ marginLeft: 16 }}
                                      onPress={() => {
                                        setReplyingToComment(item);
                                      }}
                                    >
                                      <Text style={{ fontSize: 12, color: '#8C36DB', fontWeight: '600' }}>Reply</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>

                              {/* Render nested replies */}
                              {replies.map((reply: any, index: number) => {
                                const canDeleteReply = reply.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                                const isLastReply = index === replies.length - 1;
                                return (
                                  <View key={reply.id || `${reply.user_id}-${reply.created_at}`} style={[styles.commentItem, { marginLeft: 42, marginTop: 8, position: 'relative' }]}>
                                    {/* Thread vertical line segment */}
                                    <View style={{
                                      position: 'absolute',
                                      left: -26,
                                      top: 0,
                                      bottom: isLastReply ? undefined : 0,
                                      height: isLastReply ? 12 : undefined,
                                      width: 1.5,
                                      backgroundColor: '#E6E1E8',
                                      zIndex: 1,
                                    }} />
                                    {/* Thread horizontal branch line */}
                                    <View style={{
                                      position: 'absolute',
                                      left: -26,
                                      top: 12,
                                      width: 26,
                                      height: 1.5,
                                      backgroundColor: '#E6E1E8',
                                      zIndex: 1,
                                    }} />

                                    <Avatar name={reply?.username || 'User'} photo={reply?.user_photo} size={24} />
                                    <View style={[styles.commentBubble, { backgroundColor: '#F8F5F9' }]}>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={styles.commentItemUser}>{reply?.username || 'User'}</Text>
                                        {canDeleteReply && (
                                          <TouchableOpacity
                                            style={{ padding: 4, marginRight: -4, marginTop: -4 }}
                                            onPress={() => handleDeleteComment(reply)}
                                          >
                                            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                      <MentionText style={styles.commentItemText} text={reply?.text || ''} />
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={styles.commentTime}>{formatTimeAgo(reply?.created_at)}</Text>
                                        <TouchableOpacity
                                          style={{ marginLeft: 16 }}
                                          onPress={() => {
                                            setReplyingToComment(item); // Reply to top-level comment
                                            setCommentText(`@${reply.username} `); // Mention specific user
                                          }}
                                        >
                                          <Text style={{ fontSize: 11, color: '#8C36DB', fontWeight: '600' }}>Reply</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          );
                        }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                      />
                    );
                  })() : (
                    <View style={styles.commentEmptyState}>
                      <Ionicons name="chatbubble-ellipses-outline" size={42} color="#D5C8D6" />
                      <Text style={styles.commentEmptyText}>No comments yet.</Text>
                      <Text style={styles.commentEmptySubtext}>Be the first to comment!</Text>
                    </View>
                  )}
                </View>

                {replyingToComment && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#F5EFF6',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#EBE2EE'
                  }}>
                    <Text style={{ fontSize: 13, color: '#3B214E' }}>
                      Replying to <Text style={{ fontWeight: 'bold', color: '#8C36DB' }}>@{replyingToComment.username}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => setReplyingToComment(null)}>
                      <Ionicons name="close-circle" size={18} color="#8A7B89" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={[styles.commentInputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <MentionInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Add a comment..."}
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
  festivalAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFECD9',
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD6B0',
  },
  festivalAlertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  festivalAlertTextWrapper: {
    flex: 1,
  },
  festivalAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B1D07',
    marginBottom: 4,
  },
  festivalAlertSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5A432B',
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
  postBannerSection: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: PAGE_PADDING,
  },
  cardTextureContent: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 5,
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
    marginTop: 12,
    marginBottom: 20,
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
    width: 175,
    height: 75,
  },
  featureIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#000',
    lineHeight: 16,
  },
  featureSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#000',
    marginTop: 2,
    lineHeight: 13,
  },
  featuredLiveCard: {
    width: Math.min(375, SCREEN_WIDTH - 2 * PAGE_PADDING),
    height: 160,
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
    marginBottom: 25,
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
    paddingVertical: 8,
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
    paddingTop: 30,
    paddingBottom: 15,
    gap: Platform.OS === 'ios' ? 8 : 10,
  },
  actionCard: {
    width: Platform.OS === 'ios' ? 120 : 110,
    height: Platform.OS === 'ios' ? 180 : 172,
    borderRadius: 15,
    padding: Platform.OS === 'ios' ? 10 : 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
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
  cardHeaderBadgeEmerald: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 12,
    paddingVertical: Platform.OS === 'ios' ? 4 : 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#B2DFDB',
    zIndex: 100,
    elevation: 5,
  },
  cardHeaderBadgeCyan: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: Platform.OS === 'ios' ? 8 : 12,
    paddingVertical: Platform.OS === 'ios' ? 4 : 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#0EA5E9',
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
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
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
  actionCardIcon: {
    width: 40,
    height: 40,
    alignSelf: 'center',
  },
  saiLotusIcon: {
    width: 40,
    height: 40,
    alignSelf: 'center',
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
  cardButtonOutlineCyan: {
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
    gap: 6,
    paddingHorizontal: 10,
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
    minHeight: 75,
    paddingVertical: 10,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 8,
    overflow: 'hidden',
  },
  miniCardCircleImg: {
    width: '100%',
    height: '100%',
  },
  communityCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 8,
  },
  communityCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
  },
  communityCardIconRound: {
    width: '100%',
    height: '100%',
  },
  miniCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  communityCardTextBlock: {
    marginTop: 6,
  },
  miniCardType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 7,
    color: '#8C36DB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  communityCardLabel: {
    color: '#9F45FF',
    fontSize: 10,
    letterSpacing: 0,
    marginBottom: 2,
  },
  miniCardTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    color: '#111',
    lineHeight: 12,
  },
  communityCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: '#000',
    lineHeight: 15,
  },
  miniCardMembers: {
    fontFamily: 'Inter_500Medium',
    fontSize: 8,
    color: '#888',
    marginTop: 1,
  },
  communityCardMembers: {
    fontSize: 10,
    color: '#000',
    marginTop: 2,
  },
  miniCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8.5,
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
    backgroundColor: '#000000',
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
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    padding: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
