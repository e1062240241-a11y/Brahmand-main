// accessibility: placeholder
// Trigger watch rebuild

import { Avatar } from '../../src/components/Avatar';
import { BlockConfirmationModal } from '../../src/components/BlockConfirmationModal';
import { CommentOptionsModal } from '../../src/components/CommentOptionsModal';
import { LocationData, LocationPickerModal } from '../../src/components/LocationPickerModal';
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
import { ReportModal } from '../../src/components/ReportModal';
import { RequestFormModal } from '../../src/components/RequestFormModal';
import SharePostModal from '../../src/components/SharePostModal';
import FeedSection from '../../src/components/home/FeedSection';
import { getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../../src/features/live-mantra/schedule';
import { addPostComment, api, createCommunityRequest, deletePost, deletePostComment, discoverCommunities, followUser, getAllUsers, getCommunities, getHomeFeed, getHomeInit, getHomeShell, getPostComments, getUnreadNotificationCount, markAllNotificationsRead, reportComment, reportPost, repostPost, searchByHashtag, togglePostLike, unfollowUser, updateProfile } from '../../src/services/api';
import { blockUser, unblockUser } from '../../src/services/firebase/moderationService';
import { socketService } from '../../src/services/socket';
import { useAuthStore } from '../../src/store/authStore';
import { useBlockStore } from '../../src/store/blockStore';
import { useFeedStore } from '../../src/store/feedStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { useVendorStore } from '../../src/store/vendorStore';
import { formatTimeAgo } from '../../src/utils/dateUtils';
import { useTranslation } from '../../src/utils/i18n';
import { useScrollToHideTabBar } from '../../src/utils/scroll';
import { database } from '../../src/database';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter, useIsFocused, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, AppState, FlatList, InteractionManager, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { styles } from '../../src/components/home/home.styles';
import { FEATURE_CARD_HEIGHT, FEATURE_CARD_WIDTH, FEATURE_SNAP_INTERVAL, SCREEN_WIDTH, baseQuickAccess, getDynamicQuickAccess } from '../../src/components/home/homeConstants';
import { HomeHeaderComponent } from '../../src/components/home/HomeHeaderComponent';

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Platform.OS === 'android' ? windowWidth : SCREEN_WIDTH;
  const featureCardWidth = Platform.OS === 'android'
    ? 175
    : FEATURE_CARD_WIDTH;
  const featureCardHeight = Platform.OS === 'android' ? 82 : FEATURE_CARD_HEIGHT;
  const featureSnapInterval = Platform.OS === 'android' ? featureCardWidth + 10 : FEATURE_SNAP_INTERVAL;
  const bellPlayer = useAudioPlayer(require('../../assets/notifysound/bell.mp3'));
  const { t } = useTranslation();
  const onHomeScrollTabBar = useScrollToHideTabBar();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user, updateUser, token, isAuthenticated } = useAuthStore();

  const bannerScrollRef = useRef<ScrollView>(null);
  const isNavigatingRef = useRef(false);

  const handleLiveJaapNavigation = useCallback((mantraType: string, title: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push({ pathname: '/live-jaap-welcome', params: { fromHome: 'true', mantraType, title } });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  }, [router]);

  const [, setIsHomeInitialized] = useState(false);



  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Yash';
  const avatarUri = user?.photo;
  const currentUserId = (user as any)?.id;

  // Global block store — shared across all screens
  const blockedUserSet = useBlockStore(state => state.blockedUserSet);
  const blockedByMeUserSet = useBlockStore(state => state.blockedByMeUserSet);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockConfirmData, setBlockConfirmData] = useState<{
    targetUserId: string;
    username: string;
    isBlocked: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const activeTab = useFeedStore(state => state.activeTab);
  const setActiveTab = useFeedStore(state => state.setActiveTab);
  const setTabFeed = useFeedStore(state => state.setTabFeed);
  const loadHistory = useFeedStore(state => state.loadHistory);
  // ── Smart Feed Quality Store ─────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const COMMENTS_PAGE_SIZE = 20;
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [, setActiveCommentMenuId] = useState<string | null>(null);
  // Apple Guideline 1.2 - report modal state
  const [reportPostModalVisible, setReportPostModalVisible] = useState(false);
  const [pendingReportPost, setPendingReportPost] = useState<any | null>(null);
  // Apple Guideline 1.2 - report comment state
  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
  const [pendingReportComment, setPendingReportComment] = useState<any | null>(null);
  const [commentModalToRestore, setCommentModalToRestore] = useState(false);
  const [commentOptionsModalVisible, setCommentOptionsModalVisible] = useState(false);
  const [commentOptions, setCommentOptions] = useState<any[]>([]);

  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const [hanumanChantCount, setHanumanChantCount] = useState(() => Math.floor(Math.random() * 17) + 2);
  const [shivaChantCount, setShivaChantCount] = useState(() => Math.floor(Math.random() * 17) + 2);

  const [isAartiModalVisible, setIsAartiModalVisible] = useState(false);
  const [selectedAartiUrl] = useState('');
  const [selectedAartiTitle] = useState('');

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getAartiEmbedUrl = (url: string) => {
    if (url.includes('embed/live_stream')) {
      return url + '&autoplay=1';
    }
    const videoId = getYoutubeVideoId(url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    return url;
  };

  const getAartiMobileUrl = (url: string) => {
    if (url.includes('embed/live_stream')) {
      return url + '&autoplay=1';
    }
    if (url.includes('embed?listType=playlist&list=')) {
      const listId = url.split('&list=')[1].split('&')[0];
      return `https://m.youtube.com/playlist?list=${listId}`;
    }
    const videoId = getYoutubeVideoId(url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    return url;
  };

  const topFeaturesIntervalRef = useRef<any>(null);
  const bannerIntervalRef = useRef<any>(null);
  const clockIntervalRef = useRef<any>(null);
  const isHoldingTopFeaturesRef = useRef(false);
  const isHoldingBannerRef = useRef(false);

  useEffect(() => {
    if (!isFocused) return;

    let active = true;
    const fetchActiveCounts = async () => {
      try {
        const response = await api.get('/jaap/active-count', {
          params: { rooms: 'jaap_hanuman,jaap_shiva' }
        });
        if (active && response && response.data) {
          const hanuman = response.data.jaap_hanuman || 0;
          const shiva = response.data.jaap_shiva || 0;
          // If count is > 10, show count * 18, else show randomized count (2 to 18) directly
          setHanumanChantCount(hanuman > 10 ? hanuman * 18 : Math.floor(Math.random() * 17) + 2);
          setShivaChantCount(shiva > 10 ? shiva * 18 : Math.floor(Math.random() * 17) + 2);
        }
      } catch (error) {
        console.warn('Error fetching active jaap counts:', error);
      }
    };

    fetchActiveCounts();

    // Listen for new SOS alerts/active counts via socket to update UI instantly without polling
    socketService.connect().then(() => {
      socketService.joinRoom('jaap_hanuman');
      socketService.joinRoom('jaap_shiva');
    }).catch(err => console.warn('Socket connect failed on Home:', err));

    const handleNewSOS = () => {
      fetchActiveCounts();
    };

    const handleActiveCount = (data: { room: string; count: number }) => {
      if (data) {
        const realCount = data.count || 0;
        const mappedCount = realCount > 10 ? realCount * 18 : Math.floor(Math.random() * 17) + 2;
        if (data.room === 'jaap_hanuman') {
          setHanumanChantCount(mappedCount);
        } else if (data.room === 'jaap_shiva') {
          setShivaChantCount(mappedCount);
        }
      }
    };

    socketService.onEvent('new_sos_alert', handleNewSOS);
    socketService.onEvent('sos_alert', handleNewSOS);
    socketService.onEvent('room_active_count', handleActiveCount);

    return () => {
      active = false;
      socketService.offEvent('new_sos_alert', handleNewSOS);
      socketService.offEvent('sos_alert', handleNewSOS);
      socketService.offEvent('room_active_count', handleActiveCount);
      socketService.leaveRoom('jaap_hanuman');
      socketService.leaveRoom('jaap_shiva');
    };
  }, [isFocused]);

  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  const handleConfirmHomeLocation = (locData: LocationData) => {
    if (locData.latitude && locData.longitude) {
      setLiveCoords({ latitude: locData.latitude, longitude: locData.longitude });
    }
    setLocationPickerVisible(false);
  };
  const scrollViewRef = useRef<any>(null);
  const currentScrollY = useRef(0);
  const topFeaturesScrollRef = useRef<ScrollView>(null);
  const likeDebounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const originalPostRefs = useRef<{ [postId: string]: any }>({});

  useEffect(() => {
    return () => {
      if (likeDebounceRefs.current) {
        Object.values(likeDebounceRefs.current).forEach((timeout) => clearTimeout(timeout));
      }
    };
  }, []);

  // Dynamic rotational & randomized ordering for quick access feature cards
  const [quickAccessRotation, setQuickAccessRotation] = useState(() => Math.floor(Math.random() * 1000) + 1);
  useEffect(() => {
    if (isFocused) {
      setQuickAccessRotation(Math.floor(Math.random() * 1000) + 1);
    }
  }, [isFocused]);

  const quickAccessItems = useMemo(() => getDynamicQuickAccess(quickAccessRotation), [quickAccessRotation]);

  // Gentle, ultra-low speed auto-scroll for quick access feature cards (pauses on user touch/drag)
  const topFeaturesAutoScrollIndex = useRef(0);
  const bannerAutoScrollIndex = useRef(0);

  useEffect(() => {
    if (!isFocused) return;
    const CARD_WIDTH = featureSnapInterval || 185;
    const TOTAL_CARDS = quickAccessItems.length;

    const startTopFeatures = () => {
      if (topFeaturesIntervalRef.current) clearInterval(topFeaturesIntervalRef.current);
      topFeaturesIntervalRef.current = setInterval(() => {
        if (isHoldingTopFeaturesRef.current) return;
        topFeaturesAutoScrollIndex.current = (topFeaturesAutoScrollIndex.current + 1) % TOTAL_CARDS;
        topFeaturesScrollRef.current?.scrollTo({
          x: topFeaturesAutoScrollIndex.current * CARD_WIDTH,
          animated: true,
        });
      }, 14000);
    };

    const stopTopFeatures = () => {
      if (topFeaturesIntervalRef.current) {
        clearInterval(topFeaturesIntervalRef.current);
        topFeaturesIntervalRef.current = null;
      }
    };

    if (AppState.currentState === 'active') {
      startTopFeatures();
    }

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        startTopFeatures();
      } else {
        stopTopFeatures();
      }
    });

    return () => {
      stopTopFeatures();
      appStateSub.remove();
    };
  }, [isFocused, quickAccessItems.length, featureSnapInterval]);

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

  useEffect(() => {
    const fetchLiveLocation = async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        let loc: Location.LocationObject | null = null;
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch {
          loc = await Location.getLastKnownPositionAsync().catch(() => null);
        }

        if (!loc) {
          return;
        }

        setLiveCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (e) {
        console.warn('Initial location fetch failed:', e);
      }
    };
    fetchLiveLocation();
  }, []);

  const fetchLocalCommunities = useCallback(async () => {
    try {
      const [discoverRes, myCommsRes] = await Promise.allSettled([
        discoverCommunities(),
        getCommunities()
      ]);

      if (discoverRes.status === 'fulfilled' && discoverRes.value?.data) {
        const allComms = discoverRes.value.data || [];
        const userGroupsList = allComms.filter(
          (item: any) => item.type === 'user_group' || item.type === 'local'
        );
        setLocalCommunities(userGroupsList);
      }

      if (myCommsRes.status === 'fulfilled' && myCommsRes.value?.data) {
        const myComms = myCommsRes.value.data || [];
        if (Array.isArray(myComms) && myComms.length > 0) {
          setCommunities(myComms);
          AsyncStorage.setItem('home_communities', JSON.stringify(myComms)).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Failed to fetch local communities for home:', err);
    }
  }, []);

  const lastInitTimeRef = useRef<number>(0);

  const initializeHome = useCallback(async (force = false) => {
    const nowTime = Date.now();
    if (!force && lastInitTimeRef.current && (nowTime - lastInitTimeRef.current < 600000)) {
      return;
    }

    if (Platform.OS === 'android') {
      if (!token || !isAuthenticated) {
        console.log('[Home] Skipping Android initialization: User is not authenticated');
        setIsHomeInitialized(true);
        return;
      }
    }

    try {
      lastInitTimeRef.current = nowTime;
      fetchLocalCommunities();

      // Parallel execution of Tier 1 (Shell) and Tier 2 (Feed)
      const [shellResult, feedResult] = await Promise.allSettled([
        getHomeShell(),
        getHomeFeed(15, '', useFeedStore.getState().activeTab || 'for_you')
      ]);

      if (shellResult.status === 'fulfilled' && shellResult.value?.data) {
        const data = shellResult.value.data;
        if (data.unread_count !== undefined) setUnreadCount(data.unread_count);
        if (data.next_festival) setNextFestival(data.next_festival);
        if (data.community_requests) {
          setCommunityRequests(data.community_requests);
          AsyncStorage.setItem('home_community_requests', JSON.stringify(data.community_requests)).catch(e => console.log(e));
        }

        AsyncStorage.setItem('home_shell_cache', JSON.stringify(data)).catch(e => console.log(e));
      }

      if (feedResult.status === 'fulfilled' && feedResult.value?.data) {
        const feedData = feedResult.value.data;
        const tabToLoad = useFeedStore.getState().activeTab || 'for_you';
        if (feedData.items && Array.isArray(feedData.items)) {
          setTabFeed(tabToLoad, {
            posts: feedData.items,
            offset: feedData.items.length,
            hasMore: feedData.has_more ?? false,
            lastFetched: Date.now(),
          });
        }
      }
    } catch (err) {
      console.warn('Failed to init home data:', err);
    } finally {
      setIsHomeInitialized(true);
    }
  }, [setUnreadCount, setTabFeed, fetchLocalCommunities, token, isAuthenticated]);

  const loadHomeCache = useCallback(async () => {
    try {
      const [cachedCommunities, cachedRequests, cachedShell] = await Promise.all([
        AsyncStorage.getItem('home_communities'),
        AsyncStorage.getItem('home_community_requests'),
        AsyncStorage.getItem('home_shell_cache'),
      ]);

      if (cachedShell) {
        const shell = JSON.parse(cachedShell);
        if (shell.unread_count !== undefined) setUnreadCount(shell.unread_count);
        if (shell.next_festival) setNextFestival(shell.next_festival);
        if (shell.community_requests) setCommunityRequests(shell.community_requests);
      }

      if (cachedCommunities) {
        const parsed = JSON.parse(cachedCommunities);
        const comms = Array.isArray(parsed) ? parsed : parsed?.data;
        if (Array.isArray(comms) && comms.length > 0) {
          setCommunities(comms);
        }
      }

      if (cachedRequests) {
        const parsedReqs = JSON.parse(cachedRequests);
        const reqs = Array.isArray(parsedReqs) ? parsedReqs : parsedReqs?.data;
        if (Array.isArray(reqs)) {
          setCommunityRequests(reqs);
        }
      }
    } catch (err) {
      console.warn('Failed to load cached home data:', err);
    }
  }, [setUnreadCount]);

  const isCommunityFallbackId = (id?: string) => {
    if (!id) return true;
    const normalized = String(id).toLowerCase();
    return normalized === 'city_default' || normalized === 'food_pune' || normalized.includes('fallback');
  };

  // ── Load view history once user is known ──────────────────────────────────
  useEffect(() => {
    const uid = String((user as any)?.id || '');
    if (uid) loadHistory(uid);
  }, [(user as any)?.id]);

  useEffect(() => {
    loadHomeCache();
  }, [loadHomeCache]);

  useEffect(() => {
    if (!isFocused) return;
    let isMounted = true;

    initializeHome();

    const fetchUnreadCount = async () => {
      if (AppState.currentState !== 'active') return;
      if (!token || !isAuthenticated) return;
      try {
        const res = await getUnreadNotificationCount();
        if (res && res.data && isMounted) {
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (err) {
        console.log('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    return () => {
      isMounted = false;
    };
  }, [isFocused, token, isAuthenticated]);

  const lastNotificationTapRef = useRef<number>(0);

  const handleNotificationPress = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationTapRef.current < 1000) {
      return;
    }
    lastNotificationTapRef.current = now;

    try {
      bellPlayer.play();
    } catch (err) {
      console.warn('Failed to play bell sound:', err);
    }
    setUnreadCount(0);
    router.push('/notifications');
    markAllNotificationsRead().catch((err) => {
      console.log('Failed to mark notifications as read:', err);
    });
  }, [bellPlayer, router]);

  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>(
    Array.isArray((user as any)?.following) ? (user as any).following : []
  );
  // OPT: Maintain a parallel Set for O(1) following membership lookups in child components
  const followingSetRef = useRef<Set<string>>(
    new Set(Array.isArray((user as any)?.following) ? (user as any).following : [])
  );
  const [communityRequests, setCommunityRequests] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [localCommunities, setLocalCommunities] = useState<any[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType] = useState<'Help' | 'Blood' | 'Medical' | 'Financial' | 'Petition'>('Help');
  const [nextFestival, setNextFestival] = useState<any | null>(null);
  const [now] = useState(new Date());
  const hanumanStatus = getCurrentHanumanStatus(now);
  const shivaStatus = getCurrentOtherJaapStatus(now, 'shiva');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [kathaStatus, setKathaStatus] = useState<any | null>(null);

  const fetchKathaStatus = useCallback(async () => {
    try {
      const res = await api.get('/katha/status');
      if (res && res.data && res.data.status === 'success') {
        setKathaStatus(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch katha status on home:', err);
    }
  }, []);

  const lastRemindersTimeRef = useRef<number>(0);
  const fetchReminders = async (force = false) => {
    const nowTime = Date.now();
    if (!force && lastRemindersTimeRef.current && (nowTime - lastRemindersTimeRef.current < 600000)) {
      return;
    }
    try {
      lastRemindersTimeRef.current = nowTime;
      const response = await api.get('/jaap/reminders');
      if (response.data && response.data.reminders) {
        const loadedReminders: Record<string, boolean> = {};
        response.data.reminders.forEach((r: any) => {
          loadedReminders[r.mantra_type] = true;
        });
        setReminders(loadedReminders);
      }
    } catch (err) {
      console.warn('Failed to fetch reminders on home:', err);
    }
  };

  const isSettingReminderRef = useRef<Record<string, boolean>>({});

  const handleSetReminder = useCallback(async (mantraType: string, sessionName: string) => {
    if (isSettingReminderRef.current[mantraType]) {
      return;
    }
    isSettingReminderRef.current[mantraType] = true;

    try {
      const response = await api.post('/jaap/reminder', {
        mantra_type: mantraType,
        session_name: sessionName,
      });
      const active = response.data.active;

      setReminders(prev => ({ ...prev, [mantraType]: active }));

      let readableMantra = '';
      if (t('language') === 'hi') {
        if (mantraType === 'shiva') readableMantra = 'ॐ नमः शिवाय';
        else if (mantraType === 'hanuman') readableMantra = 'हनुमान चालीसा';
        else if (mantraType === 'shravan_katha') readableMantra = 'श्रावण शिव कथा';
        else readableMantra = sessionName || 'कथा सत्र';
      } else {
        if (mantraType === 'shiva') readableMantra = 'Om Namah Shivaya';
        else if (mantraType === 'hanuman') readableMantra = 'Hanuman Chalisa';
        else if (mantraType === 'shravan_katha') readableMantra = 'Shravan Shiv Katha';
        else readableMantra = sessionName || 'Katha Session';
      }

      if (active) {
        const titleText = t('language') === 'hi' ? '🔔 रिमाइंडर सक्रिय' : '🔔 Reminder Set!';
        const msgText = t('language') === 'hi'
          ? `${readableMantra} के लिए आपका रिमाइंडर सफलतापूर्वक सक्रिय हो गया है।`
          : `Your reminder for ${readableMantra} has been successfully scheduled.`;
        Alert.alert(titleText, msgText);
      } else {
        const titleText = t('language') === 'hi' ? '🔔 रिमाइंडर हटाया गया' : '🔔 Reminders Removed';
        const msgText = t('language') === 'hi'
          ? `आपने ${readableMantra} की सूचनाओं को बंद कर दिया है।`
          : `You have unsubscribed from notifications for ${readableMantra}.`;
        Alert.alert(titleText, msgText);
      }
    } catch (err: any) {
      console.error('Failed to toggle reminder on home:', err);
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error',
        t('language') === 'hi' ? 'रिमाइंडर चालू/बंद नहीं किया जा सका। कृपया पुनः लॉगिन करें।' : 'Could not toggle reminder. Please login again.'
      );
    } finally {
      setTimeout(() => {
        isSettingReminderRef.current[mantraType] = false;
      }, 800);
    }
  }, [t]);

  const findCityCommunity = useCallback(() => {
    return (
      communities.find((c) => c.type === 'city') ||
      localCommunities.find((c) => c.type === 'city') ||
      null
    );
  }, [communities, localCommunities]);

  const findLocalCommunity = useCallback(() => {
    return (
      localCommunities.find((c) => c.type === 'user_group' || c.type === 'local') ||
      communities.find((c) => c.type === 'user_group' || c.type === 'local') ||
      communities.find((c) => c.is_default) ||
      null
    );
  }, [communities, localCommunities]);

  const findStateCommunity = useCallback(() => {
    return (
      communities.find((c) => c.type === 'state') ||
      null
    );
  }, [communities]);

  const findNationalCommunity = useCallback(() => {
    return (
      communities.find((c) => c.type === 'country') ||
      null
    );
  }, [communities]);

  const resolveHomeCommunityItem = useCallback(
    (item: any) => {
      if (!item) return null;
      const id = String(item.id || '');

      if (!isCommunityFallbackId(id)) {
        return item;
      }

      const resolved =
        item.type === 'city'
          ? findCityCommunity()
          : item.type === 'state'
            ? findStateCommunity()
            : item.type === 'country'
              ? findNationalCommunity()
              : item.type === 'user_group' || item.type === 'local'
                ? findLocalCommunity()
                : null;

      if (!resolved) return null;
      const resolvedId = String(resolved.id || '');
      if (isCommunityFallbackId(resolvedId)) return null;
      return resolved;
    },
    [findCityCommunity, findLocalCommunity, findNationalCommunity, findStateCommunity]
  );

  useFocusEffect(
    useCallback(() => {
      // Always reset scroll to absolute top whenever user enters or comes back to Home screen
      if (scrollViewRef.current) {
        if (typeof (scrollViewRef.current as any).scrollToOffset === 'function') {
          (scrollViewRef.current as any).scrollToOffset({ offset: 0, animated: false });
        } else if (typeof scrollViewRef.current.scrollTo === 'function') {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }

      // ⚡ Instant Tab Switch: Render screen immediately, defer network/store syncs until animation finishes
      const task = InteractionManager.runAfterInteractions(() => {
        const store = useVendorStore.getState();
        if (!store.hasCheckedMyVendor) {
          store.fetchMyVendor().catch(() => { });
        }
        fetchReminders(true);
        fetchKathaStatus();
      });
      return () => {
        task.cancel();
        // Clear all background rotation/clock intervals on tab unfocus
        if (topFeaturesIntervalRef.current) clearInterval(topFeaturesIntervalRef.current);
        if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
        if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      };
    }, [])
  );

  useEffect(() => {
    setBioText(user?.bio || '');
  }, [user?.bio]);

  useEffect(() => {
    const arr = Array.isArray((user as any)?.following) ? (user as any).following : [];
    setFollowingIds(arr);
    followingSetRef.current = new Set(arr);
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

  const handleHomeScroll = useCallback((event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y || 0;
    currentScrollY.current = yOffset;
    onHomeScrollTabBar(event);
  }, [onHomeScrollTabBar]);
  const loadHomeRequests = useCallback(async () => {
    // Legacy function, replaced by initializeHome
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setQuickAccessRotation(prev => prev + 1);
    try {
      await initializeHome(true);
      await fetchReminders(true);
      await fetchKathaStatus();
    } catch (err) {
      console.warn('Refresh failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [initializeHome, fetchReminders, fetchKathaStatus]);

  // Feed quality management is now handled by FeedSection component

  useEffect(() => {
    // Handled by main initializeHome now
  }, []);

  useEffect(() => {
    if (!navigation || typeof (navigation as any).addListener !== 'function') return;
    const unsubscribe = (navigation as any).addListener('tabPress', () => {
      const focused = typeof (navigation as any).isFocused === 'function' ? (navigation as any).isFocused() : true;
      if (focused) {
        const isAtTop = currentScrollY.current <= 15;
        if (isAtTop) {
          onRefresh();
        } else {
          if (scrollViewRef.current) {
            if (typeof (scrollViewRef.current as any).scrollToOffset === 'function') {
              (scrollViewRef.current as any).scrollToOffset({ offset: 0, animated: true });
            } else if (typeof scrollViewRef.current.scrollTo === 'function') {
              scrollViewRef.current.scrollTo({ y: 0, animated: true });
            } else if (typeof (scrollViewRef.current as any).scrollToIndex === 'function') {
              (scrollViewRef.current as any).scrollToIndex({ index: 0, animated: true });
            }
          }
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, onRefresh]);

  const safeCommunityRequests = Array.isArray(communityRequests) ? communityRequests : [];



  const handleSaveBio = async () => {
    setIsEditingBio(false);
    try {
      await updateProfile({ bio: bioText });
      updateUser({ bio: bioText } as any);
    } catch (error) {
      console.warn('Failed to update bio:', error);
      setBioText(user?.bio || '');
    }
  };

  const handleFollowUser = useCallback(async (userId: string) => {
    const isFollowing = followingSetRef.current.has(userId);

    if (isFollowing) {
      followingSetRef.current.delete(userId);
    } else {
      followingSetRef.current.add(userId);
    }

    setFollowingIds((prev) => {
      const nextIds = isFollowing
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      updateUser({ following: nextIds } as any);
      return nextIds;
    });

    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (error) {
      if (isFollowing) {
        followingSetRef.current.add(userId);
      } else {
        followingSetRef.current.delete(userId);
      }
      setFollowingIds((prev) => {
        const rollbackIds = isFollowing
          ? [...prev, userId]
          : prev.filter((id) => id !== userId);
        updateUser({ following: rollbackIds } as any);
        return rollbackIds;
      });
      console.warn('Follow request from home search failed:', error);
    }
  }, [updateUser]);

  const handleLikePost = useCallback((post: any) => {
    const postId = post?.id;
    if (!postId) return;

    // 1. Calculate the new toggled state
    const liked = !!post?.liked_by_me;
    const newLikedState = !liked;
    const currentLikes = Number(post?.likes_count || 0);

    // 2. Track exact original post snapshot before any mutation if not already tracking
    if (originalPostRefs.current[postId] === undefined) {
      originalPostRefs.current[postId] = { ...post };
    }

    // 3. Perform optimistic UI update instantly
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
    if (Platform.OS !== 'web' && database) {
      (async () => {
        try {
          let feedRecord: any = null;
          try {
            feedRecord = await database.get('feeds').find(postId);
          } catch {
            // Record not found in local WatermelonDB SQLite cache
            feedRecord = null;
          }
          if (feedRecord) {
            await database.write(async () => {
              await feedRecord.update((record: any) => {
                record.likedByMe = optimisticPost.liked_by_me;
                record.likesCount = optimisticPost.likes_count;
              });
            });
          }
        } catch (dbErr) {
          console.warn('[Like DB Update] failed:', dbErr);
        }
      })();
    }

    // 4. Clear any existing timeout for this post
    if (likeDebounceRefs.current[postId]) {
      clearTimeout(likeDebounceRefs.current[postId]);
    }

    // 5. Set a new debounce timeout of 500ms
    likeDebounceRefs.current[postId] = setTimeout(async () => {
      const originalPostSnapshot = originalPostRefs.current[postId];
      const originalState = !!originalPostSnapshot?.liked_by_me;

      // Cleanup tracking for this post
      delete likeDebounceRefs.current[postId];

      // If final state equals original state, clean up snapshot and skip server update!
      if (newLikedState === originalState) {
        delete originalPostRefs.current[postId];
        return;
      }

      // Otherwise, send the API call to toggle on the server
      try {
        const response = await togglePostLike(postId);
        const updatedPost = response.data?.post;
        delete originalPostRefs.current[postId];
        if (updatedPost) {
          const finalPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
          setTabFeed(activeTab, {
            posts: finalPosts.map((item) => (item.id === postId ? { ...item, ...updatedPost } : item))
          });
        }
      } catch (error) {
        console.warn('Failed to like/unlike post:', error);
        // Foolproof rollback: put the exact backup copy of the original post back into the feed
        if (originalPostSnapshot) {
          const rollbackPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
          setTabFeed(activeTab, {
            posts: rollbackPosts.map((item) => (item.id === postId ? originalPostSnapshot : item))
          });
        }
        delete originalPostRefs.current[postId];
        Alert.alert('Error', 'Could not update like. Please check your network.');
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
    setCommentsHasMore(true);

    try {
      const response = await getPostComments(postId, COMMENTS_PAGE_SIZE, 0);
      const batch = Array.isArray(response.data) ? response.data : [];
      setPostComments(batch);
      setCommentsHasMore(batch.length === COMMENTS_PAGE_SIZE);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
      setCommentsHasMore(false);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

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

      // Background refresh to ensure persistence on next modal open (top page only)
      try {
        const freshResponse = await getPostComments(selectedCommentPostId, COMMENTS_PAGE_SIZE, 0);
        if (Array.isArray(freshResponse.data)) {
          setPostComments(prev => {
            const fresh = freshResponse.data;
            const freshIds = new Set();
            for (const c of fresh) freshIds.add(c.id);
            const optimistic = prev.filter(c => c.is_optimistic && !freshIds.has(c.id));
            const keptOlder = prev.filter(c => !c.is_optimistic && !freshIds.has(c.id));
            return [...optimistic, ...fresh, ...keptOlder];
          });
        }
      } catch {
        // keep current state if refresh fails
      }
    } catch (error: any) {
      // Rollback on error
      setPostComments(prev => prev.filter(c => c.id !== tempId));
      const detail = error.response?.data?.detail || error.message;
      Alert.alert('Error', detail || 'Could not post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleLoadMoreComments = useCallback(async () => {
    if (commentsLoadingMore || !commentsHasMore || !selectedCommentPostId) return;
    setCommentsLoadingMore(true);
    try {
      const offset = postComments.filter(c => !c.is_optimistic).length;
      const response = await getPostComments(selectedCommentPostId, COMMENTS_PAGE_SIZE, offset);
      const batch = Array.isArray(response.data) ? response.data : [];
      if (batch.length === 0) {
        setCommentsHasMore(false);
      } else {
        const existingIds = new Set();
        for (const c of postComments) existingIds.add(c.id);
        const newOnes = batch.filter((c: any) => !existingIds.has(c.id));
        setPostComments(prev => [...prev, ...newOnes]);
        setCommentsHasMore(batch.length === COMMENTS_PAGE_SIZE);
      }
    } catch (error) {
      console.warn('Failed to load more comments:', error);
    } finally {
      setCommentsLoadingMore(false);
    }
  }, [commentsLoadingMore, commentsHasMore, selectedCommentPostId, postComments]);

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
      Alert.alert('Error', 'Could not open share sheet. Please try again.');
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
        // FeedSection handles feed refresh
      }
      Alert.alert('Success', 'Reposted to your feed.');
    } catch (error) {
      console.warn('Failed to repost:', error);
      Alert.alert('Error', 'Could not repost. Please try again.');
    }
  }, [activeTab, setTabFeed]);

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
      Alert.alert('Error', 'Could not delete post. Please try again.');
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

  const handleReportPost = useCallback((post: any) => {
    const postId = post?.id;
    if (!postId) return;
    // Open the reason-selection modal (Apple Guideline 1.2)
    setPendingReportPost(post);
    setReportPostModalVisible(true);
  }, []);

  const handlePostMenuPress = useCallback((post: any) => {
    if (post?.user_id === currentUserId) {
      handleDeletePost(post);
      return;
    }

    const targetUserId = post?.user_id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserSet.has(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

    const handleToggleBlock = async () => {
      try {
        if (isUserCurrentlyBlocked) {
          await unblockUser(currentUserId, targetUserId);
          removeBlock(String(targetUserId));
          Alert.alert('Success', `${post.username || 'User'} has been unblocked.`);
        } else {
          Alert.alert(
            'Block User',
            `Are you sure you want to block ${post.username || 'this user'}? You will no longer see their posts, comments, or messages.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: async () => {
                  await blockUser(currentUserId, targetUserId);
                  addBlock(String(targetUserId));
                  Alert.alert('Success', `${post.username || 'User'} has been blocked.`);
                }
              }
            ]
          );
        }
      } catch (err) {
        console.error('Error toggling block in post menu:', err);
        Alert.alert('Error', 'Could not update block status. Please try again.');
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Post', blockLabel],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Post Options'
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            handleReportPost(post);
          } else if (buttonIndex === 2) {
            await handleToggleBlock();
          }
        }
      );
    } else {
      Alert.alert(
        'Post Options',
        'Choose an action:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report Post', onPress: () => handleReportPost(post) },
          { text: blockLabel, style: 'destructive', onPress: handleToggleBlock }
        ],
        { cancelable: true }
      );
    }
  }, [currentUserId, blockedByMeUserSet, handleDeletePost, handleReportPost]);

  const handleCommentMenuPress = useCallback((comment: any) => {
    const targetUserId = comment.user_id || comment.userId || comment.sender_id || comment.user?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserSet.has(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

    const handleToggleBlock = async () => {
      const performBlockToggle = async () => {
        try {
          if (isUserCurrentlyBlocked) {
            await unblockUser(currentUserId, targetUserId);
            removeBlock(String(targetUserId));
            Alert.alert('Success', `${comment.username || 'User'} has been unblocked.`);
          } else {
            await blockUser(currentUserId, targetUserId);
            addBlock(String(targetUserId));

            // Dismiss comments modal first
            setCommentModalVisible(false);

            Alert.alert('Success', `${comment.username || 'User'} has been blocked.`);
          }
        } catch (err) {
          console.error('Error toggling block in comment menu:', err);
          Alert.alert('Error', 'Could not update block status. Please try again.');
        }
      };

      if (Platform.OS === 'android') {
        setBlockConfirmData({
          targetUserId: String(targetUserId),
          username: comment.username || 'User',
          isBlocked: isUserCurrentlyBlocked,
          onConfirm: performBlockToggle,
        });
        setBlockConfirmVisible(true);
      } else {
        Alert.alert(
          isUserCurrentlyBlocked ? 'Unblock User' : 'Block User',
          isUserCurrentlyBlocked
            ? `Are you sure you want to unblock ${comment.username || 'this user'}?`
            : `Are you sure you want to block ${comment.username || 'this user'}? You will no longer see their posts, comments, or messages.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: isUserCurrentlyBlocked ? 'Unblock' : 'Block',
              style: isUserCurrentlyBlocked ? 'default' : 'destructive',
              onPress: performBlockToggle,
            }
          ]
        );
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Comment', blockLabel],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Comment Options'
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            setPendingReportComment(comment);
            setCommentModalToRestore(commentModalVisible);
            setCommentModalVisible(false);
            setTimeout(() => {
              setReportCommentModalVisible(true);
            }, 300);
          } else if (buttonIndex === 2) {
            await handleToggleBlock();
          }
        }
      );
    } else {
      setCommentOptions([
        {
          label: 'Report Comment',
          icon: 'flag-outline',
          onPress: () => {
            setPendingReportComment(comment);
            setReportCommentModalVisible(true);
          }
        },
        {
          label: blockLabel,
          isDestructive: true,
          icon: 'ban-outline',
          onPress: handleToggleBlock
        }
      ]);
      setCommentOptionsModalVisible(true);
    }
  }, [currentUserId, blockedByMeUserSet, commentModalVisible]);

  const handleOpenPostUserProfile = useCallback((post: any) => {
    if (post?.user_id) {
      router.push(`/profile/${post.user_id}`);
    }
  }, [router]);

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


  const resolvedCityComm = resolveHomeCommunityItem(findCityCommunity()) || {
    id: 'city-community-default',
    name: t('cityCommunity') || (t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community'),
    type: 'city',
    member_count: 1,
  };
  const cityName = resolvedCityComm.name || (t('cityCommunity') || (t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community'));
  const cityId = resolvedCityComm.id;
  const rawCityCount = resolvedCityComm.member_count ?? resolvedCityComm.members_count ?? (resolvedCityComm as any).memberCount ?? (Array.isArray(resolvedCityComm.members) ? resolvedCityComm.members.length : 1);
  const cityMembers = (rawCityCount || 1) * 11;

  const resolvedLocalComm = resolveHomeCommunityItem(findLocalCommunity()) || {
    id: 'local-community-default',
    name: t('yourCommunity') || (t('language') === 'hi' ? 'स्थानीय समूह' : 'Local Community'),
    type: 'user_group',
    member_count: 1,
  };
  const localId = resolvedLocalComm.id;
  const realGroupName = resolvedLocalComm.name || (t('yourCommunity') || (t('language') === 'hi' ? 'स्थानीय समूह' : 'Local Community'));
  const rawLocalCount = resolvedLocalComm.member_count ?? resolvedLocalComm.members_count ?? (resolvedLocalComm as any).memberCount ?? (Array.isArray(resolvedLocalComm.members) ? resolvedLocalComm.members.length : 1);
  const localMembers = (rawLocalCount || 1) * 11;
  const localSubgroup = resolvedLocalComm.type || 'city';

  const memoizedHeader = useMemo(() => (
    <HomeHeaderComponent
      user={user}
      firstName={firstName}
      avatarUri={avatarUri}
      unreadCount={unreadCount}
      nextFestival={nextFestival}
      t={t}
      searchActive={searchActive}
      setSearchActive={setSearchActive}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      hashtagResults={hashtagResults}
      loadingHashtags={loadingHashtags}
      searchResults={searchResults}
      loadingUsers={loadingUsers}
      followingSet={followingSetRef.current}
      handleFollowUser={handleFollowUser}
      saveRecentSearch={saveRecentSearch}
      recentSearches={recentSearches}
      setRecentSearches={setRecentSearches}
      reminders={reminders}
      handleSetReminder={handleSetReminder}
      handleLiveJaapNavigation={handleLiveJaapNavigation}
      handleNotificationPress={handleNotificationPress}
      hanumanStatus={hanumanStatus}
      shivaStatus={shivaStatus}
      hanumanChantCount={hanumanChantCount}
      shivaChantCount={shivaChantCount}
      safeCommunityRequests={safeCommunityRequests}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeFeatureIndex={activeFeatureIndex}
      setActiveFeatureIndex={setActiveFeatureIndex}
      activeBannerIndex={activeBannerIndex}
      setActiveBannerIndex={setActiveBannerIndex}
      screenWidth={screenWidth}
      featureSnapInterval={featureSnapInterval}
      featureCardWidth={featureCardWidth}
      featureCardHeight={featureCardHeight}
      cityId={cityId}
      cityName={cityName}
      cityMembers={cityMembers}
      localId={localId}
      localSubgroup={localSubgroup}
      realGroupName={realGroupName}
      localMembers={localMembers}
      topFeaturesScrollRef={topFeaturesScrollRef}
      topFeaturesAutoScrollIndex={topFeaturesAutoScrollIndex}
      bannerScrollRef={bannerScrollRef}
      bannerAutoScrollIndex={bannerAutoScrollIndex}
      isHoldingTopFeaturesRef={isHoldingTopFeaturesRef}
      isHoldingBannerRef={isHoldingBannerRef}
      isFocused={isFocused}
      kathaStatus={kathaStatus}
      quickAccessItems={quickAccessItems}
    />
  ), [
    isFocused,
    kathaStatus,
    quickAccessItems,
    insets.top,
    user,
    firstName,
    avatarUri,
    activeFeatureIndex,
    activeBannerIndex,
    hanumanChantCount,
    shivaChantCount,
    hanumanStatus,
    shivaStatus,
    reminders,
    unreadCount,
    activeTab,
    t,
    searchActive,
    searchTerm,
    hashtagResults,
    loadingHashtags,
    searchResults,
    loadingUsers,
    handleFollowUser,
    recentSearches,
    handleNotificationPress,
    handleSetReminder,
    handleLiveJaapNavigation,
    safeCommunityRequests,
    resolveHomeCommunityItem,
    findCityCommunity,
    findLocalCommunity
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FF8D57' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#FF8D57', '#EA9B76', '#FFEEE5']} locations={[0, 0.0913, 0.25]} style={styles.screen}>
          <View style={{ flex: 1 }}>
            <FeedSection
              user={user}
              onLikePost={handleLikePost}
              onOpenComment={handleOpenComment}
              onOpenProfile={handleOpenPostUserProfile}
              onPostMenu={handlePostMenuPress}
              onRepost={handleRepost}
              onShare={handleSharePost}
              scrollRef={scrollViewRef}
              onScroll={handleHomeScroll}
              homeHeader={memoizedHeader}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              blockedUserSet={blockedUserSet}
              blockedByMeUserSet={blockedByMeUserSet}
            />
          </View>




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
                  accessibilityLabel="Bio description"
                  accessibilityHint="Enter your personal bio"
                />
                <View style={styles.bioModalActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setBioText(user?.bio || '');
                      setIsEditingBio(false);
                    }}
                    style={styles.bioModalBtnCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel bio edit"
                  >
                    <Text style={styles.bioModalBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveBio}
                    style={styles.bioModalBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Save bio"
                  >
                    <Text style={styles.bioModalBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
                Alert.alert('Success', 'Link copied to clipboard');
                setShareModalVisible(false);
              }
            }}
            onDownload={async () => {
              if (Platform.OS !== 'web' && selectedSharePost?.media_url && FileSystemModule?.downloadAsync) {
                try {
                  const ext = selectedSharePost.media_type === 'video' ? 'mp4' : 'jpg';
                  const localPath = `${FileSystemModule.documentDirectory}brahmand_post_${Date.now()}.${ext}`;
                  await FileSystemModule.downloadAsync(selectedSharePost.media_url, localPath);
                  Alert.alert('Success', 'Saved to app documents');
                } catch {
                  Alert.alert('Error', 'Download failed');
                }
              } else {
                Alert.alert('Notice', 'Download not supported on this platform');
              }
              setShareModalVisible(false);
            }}
          />

          {/* Apple Guideline 1.2 - Report Post Modal */}
          <ReportModal
            visible={reportPostModalVisible}
            onClose={() => {
              setReportPostModalVisible(false);
              setPendingReportPost(null);
            }}
            reporterUid={currentUserId || ''}
            reportedUserUid={pendingReportPost?.user_id || ''}
            contentId={pendingReportPost?.id || ''}
            contentType="post"
            apiFallback={async (reason) => {
              if (pendingReportPost?.id) {
                await reportPost(pendingReportPost.id, reason, `Reported from feed: ${reason}`);
              }
            }}
            onSuccess={() => {
              if (pendingReportPost?.id) {
                const currentPosts = useFeedStore.getState().tabFeeds[activeTab]?.posts || [];
                setTabFeed(activeTab, {
                  ...useFeedStore.getState().tabFeeds[activeTab],
                  posts: currentPosts.filter((item) => item.id !== pendingReportPost.id)
                });
                if (selectedCommentPostId === pendingReportPost.id) {
                  setCommentModalVisible(false);
                  setSelectedCommentPostId(null);
                  setSelectedCommentPost(null);
                  setPostComments([]);
                }
              }
            }}
          />

          {/* Apple Guideline 1.2 - Report Comment Modal */}
          {Platform.OS !== 'android' && (
            <ReportModal
              visible={reportCommentModalVisible}
              onClose={() => {
                setReportCommentModalVisible(false);
                setPendingReportComment(null);
                if (commentModalToRestore) {
                  setTimeout(() => {
                    setCommentModalVisible(true);
                    setCommentModalToRestore(false);
                  }, 300);
                }
              }}
              reporterUid={currentUserId || ''}
              reportedUserUid={pendingReportComment?.user_id || pendingReportComment?.userId || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
              contentId={pendingReportComment?.id || ''}
              contentType="comment"
              postId={pendingReportComment?.post_id || selectedCommentPostId || ''}
              apiFallback={async (reason, description) => {
                if (pendingReportComment?.id) {
                  await reportComment(String(pendingReportComment.id), reason, description || '');
                }
              }}
              onSuccess={() => {
                // Keep reported comment visible
              }}
            />
          )}

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
                accessibilityRole="button"
                accessibilityLabel="Close comments modal"
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
                    accessibilityRole="button"
                    accessibilityLabel="Close comments"
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
                    const filteredComments = postComments.filter((c: any) => {
                      const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
                      return !uid || !blockedUserSet.has(String(uid));
                    });
                    const parentComments = filteredComments.filter(c => !c.parent_id);
                    const repliesMap = filteredComments.reduce((acc, c) => {
                      if (c.parent_id) {
                        if (!acc[c.parent_id]) acc[c.parent_id] = [];
                        acc[c.parent_id].push(c);
                      }
                      return acc;
                    }, {} as Record<string, any[]>);

                    return (
                      <FlatList
                        data={parentComments}
                        keyExtractor={(item, index) => item && item.id ? String(item.id) : `comment-idx-${index}`}
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS === 'android'}

                        renderItem={({ item }) => {
                          const canDelete = item.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                          const replies = repliesMap[item.id] || [];
                          return (
                            <View style={{ marginBottom: 12, position: 'relative' }}>
                              {replies.length > 0 && (
                                <View style={styles.commentThreadLine} />
                              )}
                              <View style={styles.commentItem}>
                                <Avatar name={item?.username || 'User'} photo={item?.user_photo} size={32} />
                                <View style={styles.commentBubble}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                                    {canDelete ? (
                                      <TouchableOpacity
                                        style={styles.commentActionButton}
                                        onPress={() => handleDeleteComment(item)}
                                        accessibilityRole="button"
                                        accessibilityLabel="Delete comment"
                                      >
                                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                      </TouchableOpacity>
                                    ) : (
                                      <TouchableOpacity
                                        style={styles.commentActionButton}
                                        onPress={() => handleCommentMenuPress(item)}
                                        accessibilityRole="button"
                                        accessibilityLabel="Comment options"
                                      >
                                        <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
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
                                      accessibilityRole="button"
                                      accessibilityLabel={`Reply to ${item?.username || 'user'}`}
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
                                  <View key={reply.id || `${reply.user_id}-${reply.created_at}`} style={[styles.commentItem, styles.replyItemContainer]}>
                                    {/* Thread vertical line segment */}
                                    <View style={isLastReply ? styles.replyThreadVerticalLineLast : styles.replyThreadVerticalLine} />
                                    {/* Thread horizontal branch line */}
                                    <View style={styles.replyThreadHorizontalLine} />

                                    <Avatar name={reply?.username || 'User'} photo={reply?.user_photo} size={24} />
                                    <View style={[styles.commentBubble, styles.replyCommentBubble]}>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={styles.commentItemUser}>{reply?.username || 'User'}</Text>
                                        {canDeleteReply ? (
                                          <TouchableOpacity
                                            style={styles.commentActionButton}
                                            onPress={() => handleDeleteComment(reply)}
                                            accessibilityRole="button"
                                            accessibilityLabel="Delete reply"
                                          >
                                            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                          </TouchableOpacity>
                                        ) : (
                                          <TouchableOpacity
                                            style={styles.commentActionButton}
                                            onPress={() => handleCommentMenuPress(reply)}
                                            accessibilityRole="button"
                                            accessibilityLabel="Reply options"
                                          >
                                            <Ionicons name="ellipsis-horizontal" size={14} color="#536471" />
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
                                          accessibilityRole="button"
                                          accessibilityLabel={`Reply to ${reply?.username || 'user'}`}
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
                        onEndReached={handleLoadMoreComments}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={
                          commentsLoadingMore ? (
                            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                              <ActivityIndicator size="small" color="#FF6B00" />
                            </View>
                          ) : null
                        }
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
                    <TouchableOpacity
                      onPress={() => setReplyingToComment(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel replying"
                    >
                      <Ionicons name="close-circle" size={18} color="#8A7B89" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={[styles.commentInputWrap, { paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12)) : Math.max(insets.bottom, 12) }]}>
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
                    accessibilityRole="button"
                    accessibilityLabel="Post comment"
                    accessibilityState={{ disabled: !commentText.trim() || commentSubmitting }}
                  >
                    {commentSubmitting ? (
                      <ActivityIndicator size="small" color="#3B214E" />
                    ) : (
                      <Ionicons name="send" size={18} color={commentText.trim() ? '#8C36DB' : '#A99AAA'} />
                    )}
                  </TouchableOpacity>
                </View>
                {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
                {Platform.OS === 'android' && (
                  <ReportModal
                    visible={reportCommentModalVisible}
                    onClose={() => {
                      setReportCommentModalVisible(false);
                      setPendingReportComment(null);
                    }}
                    reporterUid={currentUserId || ''}
                    reportedUserUid={pendingReportComment?.user_id || pendingReportComment?.userId || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
                    contentId={pendingReportComment?.id || ''}
                    contentType="comment"
                    postId={pendingReportComment?.post_id || selectedCommentPostId || ''}
                    apiFallback={async (reason, description) => {
                      if (pendingReportComment?.id) {
                        await reportComment(String(pendingReportComment.id), reason, description || '');
                      }
                    }}
                    onSuccess={() => {
                      // Keep reported comment visible
                    }}
                  />
                )}
                {Platform.OS === 'android' && (
                  <CommentOptionsModal
                    visible={commentOptionsModalVisible}
                    onClose={() => setCommentOptionsModalVisible(false)}
                    options={commentOptions}
                  />
                )}
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </LinearGradient>
      </SafeAreaView >

      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onConfirm={handleConfirmHomeLocation}
        title="Choose Your Location"
        initialCoords={liveCoords}
      />

      <Modal
        visible={isAartiModalVisible}
        transparent={false}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsAartiModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 10, paddingVertical: 15, backgroundColor: '#111' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' }}>{selectedAartiTitle}</Text>
            <TouchableOpacity
              onPress={() => setIsAartiModalVisible(false)}
              style={{ padding: 5 }}
              accessibilityRole="button"
              accessibilityLabel="Close live aarti video"
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {Platform.OS === 'web' ? (
              <iframe
                title="Live Aarti"
                src={selectedAartiUrl ? getAartiEmbedUrl(selectedAartiUrl) : ''}
                style={{ width: '100%', height: '100%', border: 0 }}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <WebView
                source={{
                  uri: selectedAartiUrl ? getAartiMobileUrl(selectedAartiUrl) : 'about:blank',
                  headers: {
                    Referer: 'https://www.youtube.com',
                  },
                }}
                userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
                style={{ width: '100%', height: '100%' }}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            )}
          </View>
        </View>
      </Modal>



      {blockConfirmData && (
        <BlockConfirmationModal
          visible={blockConfirmVisible}
          onClose={() => setBlockConfirmVisible(false)}
          onConfirm={blockConfirmData.onConfirm}
          username={blockConfirmData.username}
          isBlocked={blockConfirmData.isBlocked}
        />
      )}
    </View >
  );
}
