import { formatDateIST, formatTimeIST, formatDateTimeIST, parseUTCDate, getUnixTimestamp, getTimeAgo } from '../../src/utils/dateUtils';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Share,
  Modal,
  Image,
  ImageBackground,
  Dimensions,
  Keyboard,
  LayoutAnimation,
  UIManager,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useIsFocused } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { decryptGroupMessage, getKeys, decryptSymmetricKey, generateSymmetricKey, encryptSymmetricKeyForUser } from '../../src/utils/cryptoUtil';
import {
  getCommunity,
  getCommunityKey,
  addCommunityKey,
  sendCommunityMessage,
  deleteCommunityMessage,
  resolveCommunityRequest,
  deleteCommunityRequest,
  sendDirectMessage,
  getUserProfile,
  parseApiError,
  getKYCStatus,
  toggleRequestInterest,
  getUsersBatch,
  reportContent,
  reportComment,
  getCommunities,
  attendEvent,
  deletePost,
  togglePostLike,
  toggleCommunityMessageLike,
  uploadChatMedia,
  reverseGeocode,
  getPostComments,
  getCommunityMessageComments,
  addPostComment,
  addCommunityMessageComment,
  deleteComment as deleteCommentApi,
  api as axiosInstance,
} from '../../src/services/api';
import { ensureForegroundPermission, getCurrentPosition } from '../../src/services/location';
import { scheduleEventReminderNotification } from '../../src/services/pushNotifications';
import { originalAlert } from '../../src/utils/nativeAlert';
import { useTranslation } from '../../src/utils/i18n';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore, hydrateCommunityScreenCaches } from '../../src/store/chatStore';
import { socketService } from '../../src/services/socket';
import { useVendorStore } from '../../src/store/vendorStore';
import { COLORS, FONTS } from '../../src/constants/theme';
import { useCreatePostState } from '../../src/hooks/useCreatePostState';

import { Avatar } from '../../src/components/Avatar';
import { MentionInput } from '../../src/components/MentionInput';
import { ToastContainer } from '../../src/components/ToastContainer';
import { ReportModal } from '../../src/components/ReportModal';
import { CommentModal } from '../../src/components/community/CommentModal';
import { CreatePostModal } from '../../src/components/community/CreatePostModal';
import { AnimatedFullScreenMediaViewer } from '../../src/components/community/AnimatedFullScreenMediaViewer';
import { AttendeesModal } from '../../src/components/community/AttendeesModal';
import { CategorySelectorModal } from '../../src/components/community/CategorySelectorModal';
import { GroupInfoModal } from '../../src/components/community/GroupInfoModal';
import { blockUser, unblockUser } from '../../src/services/firebase/moderationService';
import { useBlockStore } from '../../src/store/blockStore';
import { BlockConfirmationModal } from '../../src/components/BlockConfirmationModal';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G, Path } from 'react-native-svg';

import { getFestivalImage } from '../../src/constants/festivalImages';
import { CustomLoader } from '../../src/components/CustomLoader';

import { useGlobalMute } from '../../src/contexts/MuteContext';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import { SafeVideoView, isPlayerValid, useSafeVideoPlayer } from '../../src/components/SafeVideoView';

import {
  ensureCategoriesLoaded,
  saveLocalPost,
  iosUserCreatedPostIds,
} from '../../src/services/localPostCache';
import { COMMUNITY_TABS, POST_CATEGORIES } from '../../src/constants/community';
import { getCommunityMemberCount, isSevaRequest, isSevaPost, isLostFoundRequest, isTempleUpdateRequest } from '../../src/utils/communityUtils';
import { splitTextIntoTweets } from '../../src/utils/textUtils';
import { useCommunityData } from '../../src/hooks/useCommunityData';
import { useCommunitySocket } from '../../src/hooks/useCommunitySocket';
import { useCommunityTabData } from '../../src/hooks/useCommunityTabData';
import { CommunityListItem } from '../../src/components/community/CommunityListItem';
import { CommunityMediaItem } from '../../src/components/community/CommunityMediaItem';
import { CommunityPost, CommunityRequest, FestivalEvent, DiscussionPost } from '../../src/types/community';







const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CosmicCharacterRing = ({ textLength, text }: { textLength?: number; text?: string }) => {
  const size = 64;
  const padding = 4;
  const strokeWidth = 3.5;
  const radius = (size - padding * 2 - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const limit = 250;

  // Exclude spaces from character count
  const effectiveLength = typeof text === 'string'
    ? text.replace(/\s/g, '').length
    : (textLength || 0);

  const currentTextLength = effectiveLength > 0 && effectiveLength % limit === 0 ? limit : effectiveLength % limit;
  const threadCount = Math.floor(effectiveLength / limit) + (effectiveLength % limit > 0 ? 1 : 0);
  const remaining = limit - currentTextLength;

  const percentage = Math.min((currentTextLength / limit) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Light Blue Ring Gradient Colors (#38BDF8 Sky Light Blue)
  let stopColor1 = '#38BDF8';
  let stopColor2 = '#0284C7';

  if (percentage >= 80 || remaining <= 20) {
    stopColor1 = '#FF3D00';
    stopColor2 = '#D50000';
  } else if (percentage >= 50) {
    stopColor1 = '#38BDF8';
    stopColor2 = '#00B0FF';
  }

  // Sacred geometry outer mandala circles in soft white with increased opacity
  const sgRadius = radius * 0.45;
  const sgCircles = useMemo(() => {
    const circles = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 * Math.PI) / 180;
      circles.push({
        x: cx + sgRadius * Math.cos(a),
        y: cy + sgRadius * Math.sin(a),
      });
    }
    return circles;
  }, [cx, cy, sgRadius]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {threadCount > 1 && (
        <View style={{
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 14,
        }}>
          <Text style={{ fontSize: 11, color: '#38BDF8', fontFamily: FONTS.bold }}>
            {threadCount} posts
          </Text>
        </View>
      )}

      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="cosmicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={stopColor1} />
              <Stop offset="100%" stopColor={stopColor2} />
            </SvgLinearGradient>
          </Defs>

          {/* Sacred Geometry Mandala Background Pattern in Soft White (Opacity increased to 0.45) */}
          <G opacity={0.45}>
            {sgCircles.map((circle, idx) => (
              <Circle
                key={idx}
                cx={circle.x}
                cy={circle.y}
                r={sgRadius}
                stroke="#FFFFFF"
                strokeWidth={0.8}
                fill="none"
              />
            ))}
          </G>

          {/* Background Orbit Ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Foreground Progress Orbit Ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="url(#cosmicGradient)"
            strokeWidth={remaining <= 0 ? strokeWidth + 0.6 : strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </Svg>

        {/* Center Display: Character Count Remaining */}
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={{
              fontSize: remaining <= 0 ? 12 : remaining < 100 ? 15 : 13,
              fontWeight: '700',
              fontFamily: FONTS.bold,
              color: remaining <= 0 ? '#FF2D55' : remaining <= 20 ? '#FF9500' : '#FFFFFF',
              lineHeight: 16,
            }}
          >
            {remaining}
          </Text>
        </View>
      </View>
    </View>
  );
};






export default function CommunityDetailScreen() {
  const { id, postId } = useLocalSearchParams<{ id: string, postId?: string }>();
  const router = useRouter();
  
  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/messages');
    }
  }, [router]);

  const { user, updateUser } = useAuthStore();
  const { myVendor, fetchMyVendor } = useVendorStore();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const stateCommunityIdRef = useRef<string | null>(null);
  const countryCommunityIdRef = useRef<string | null>(null);


  const { t } = useTranslation();

  const getTranslatedCommunityName = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('mumbai')) {
      return t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community';
    }
    if (t('language') !== 'hi') return name;
    if (nameLower.includes('maharashtra')) {
      return 'महाराष्ट्र समुदाय';
    }
    if (nameLower.includes('bharat') || nameLower.includes('india') || nameLower.includes('national')) {
      return 'भारत समुदाय';
    }
    if (nameLower.includes('pune food')) {
      return 'पुणे भोजन साझाकरण समूह';
    }
    return name;
  };

  const getTranslatedTab = (tab: string) => {
    if (t('language') !== 'hi') return tab;
    switch (tab) {
      case 'My Posts': return 'मेरे पोस्ट';
      case 'Feed': return 'फ़ीड';
      case 'Requests': return 'अनुरोध';
      case 'Events': return 'आयोजन';
      case 'Lost & Found': return 'खोया और पाया';
      case 'Festivals': return 'त्योहार';
      case 'Seva': return 'सेवा';
      case 'Temple Updates': return 'मंदिर अपडेट';
      case 'Others': return 'अन्य';
      case 'Select Category': return 'श्रेणी का चयन करें';
      default: return tab;
    }
  };

  const cacheKey = `community_screen_${id}`;
  const [activeTab, setActiveTab] = useState('Feed');

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeTab]);

  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);

  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  const activeVideoKeyRef = useRef<string | null>(null);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const isVideoItem = (item: any) => {
      if (!item) return false;
      const url = item.image || item.image_url || item.media_url || '';
      const mediaUrl = typeof url === 'string' ? url : (url?.uri || '');
      return ((typeof url === 'object' && url !== null && (String(url.type || url.media_type || url.mediaType || '').toLowerCase().startsWith('video'))) || (typeof mediaUrl === 'string' && (/\.(mp4|mov|m4v|webm|mkv|3gp|avi)(\?|$)/i.test(mediaUrl) ||
      mediaUrl.toLowerCase().startsWith('video') || 
      mediaUrl.toLowerCase().includes('/video/') || 
      mediaUrl.toLowerCase().includes('_video_') || ((mediaUrl.toLowerCase().includes('expopicker') || mediaUrl.toLowerCase().includes('imagepicker')) && !/\.(jpg|jpeg|png|gif|heic|webp|bmp|tiff|avif)(\?|$)/i.test(mediaUrl)))));
    };

    const firstVideoItem = viewableItems.find((vi: any) => isVideoItem(vi.item));
    const nextKey = firstVideoItem ? String(firstVideoItem.key) : null;
    if (activeVideoKeyRef.current !== nextKey) {
      activeVideoKeyRef.current = nextKey;
      setActiveVideoKey(nextKey);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // interest state: requestId -> { count, userInterested }
  const [interestMap, setInterestMap] = useState<Record<string, { count: number; userInterested: boolean }>>({});

  const handleToggleInterest = useCallback(async (item: CommunityRequest) => {
    const id = item.id;
    if (!id || String(id).startsWith('dummy')) return;
    const prev = interestMap[id] ?? { count: (item as any).interested_count || 0, userInterested: ((item as any).interested_by || []).includes(user?.id) };
    const next = { count: prev.userInterested ? prev.count - 1 : prev.count + 1, userInterested: !prev.userInterested };
    setInterestMap(m => ({ ...m, [id]: next }));
    try {
      await toggleRequestInterest(id);
    } catch {
      setInterestMap(m => ({ ...m, [id]: prev }));
    }
  }, [user?.id, interestMap]);

  const [tick, setTick] = useState(0);
  const [rsvpStates, setRsvpStates] = useState<Record<string, 'yes' | 'no'>>({});

  const handleOnNewSocketMessage = useCallback((formattedPost: any) => {
    setCommunityPosts((prev) => {
      if (prev.some((p) => String(p.id) === String(formattedPost.id))) return prev;
      const next = [formattedPost, ...prev];
      const cur = useChatStore.getState().communityScreenCaches[cacheKey];
      if (cur) {
        useChatStore.getState().setCommunityScreenCache(cacheKey, {
          ...cur,
          communityPosts: next,
          lastFetched: Date.now(),
        });
      }
      return next;
    });
  }, [cacheKey]);

  const { ensureSocketRooms } = useCommunitySocket(
    id as string,
    cacheKey,
    stateCommunityIdRef,
    countryCommunityIdRef,
    handleOnNewSocketMessage
  );

  const {
    community, setCommunity,
    requests, setRequests,
    events, setEvents,
    communityPosts, setCommunityPosts,
    allFestivals, setAllFestivals,
    loading, setLoading,
    refreshing, setRefreshing,
    hasMorePosts, setHasMorePosts,
    loadingMore, setLoadingMore,
    isLocked, setIsLocked,
    lockReason, setLockReason,
    fetchCommunity, handleLoadMore, onRefresh
  } = useCommunityData(
    id as string,
    cacheKey,
    user,
    stateCommunityIdRef,
    countryCommunityIdRef,
    ensureSocketRooms
  );
  // ⚡ Performance & Thermal optimization: Auto-polling disabled to prevent CPU spinning & re-renders.
  // Updates occur via WebSockets or on pull-to-refresh.

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ensureCategoriesLoaded();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    hydrateCommunityScreenCaches()
      .then(() => {
        if (cancelled) return;
        const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
        if (cachedData) {
          setCommunity(cachedData.community || null);
          setRequests(cachedData.requests || []);
          setEvents(cachedData.events || []);
          setAllFestivals(cachedData.allFestivals || []);
          setCommunityPosts(cachedData.communityPosts || []);
          setLoading(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);


  const {
    createPostState,
    setCreatePostState,
    resetCreatePostState,
    showCreateModal,
    setShowCreateModal,
    newMessage,
    setNewMessage,
    selectedImage,
    setSelectedImage,
    selectedMediaType,
    setSelectedMediaType,
    postCategory,
    setPostCategory,
    contactNumber,
    setContactNumber,
    sevaDetails,
    setSevaDetails,
    eventLocation,
    setEventLocation,
    eventDate,
    setEventDate,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    showInlineCategories,
    setShowInlineCategories,
  } = useCreatePostState();

  const [showTopCategoryDropdown, setShowTopCategoryDropdown] = useState(false);
  const [showBodyCategoryDropdown, setShowBodyCategoryDropdown] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null);
  const [festivalSort, setFestivalSort] = useState<'latest' | 'oldest'>('latest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const isKycVerified =
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified';

  const [showCommentModal, setShowCommentModal] = useState<DiscussionPost | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeComments, setActiveComments] = useState<any[]>([]);

  const [cachedSymmetricKey, setCachedSymmetricKey] = useState<string | undefined>(undefined);

  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState<any | null>(null);
  const [attendeesList, setAttendeesList] = useState<any[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  // Apple Guideline 1.2 - community post report state
  const [reportCommunityPostModalVisible, setReportCommunityPostModalVisible] = useState(false);
  const [pendingReportCommunityPost, setPendingReportCommunityPost] = useState<any | null>(null);
  // Apple Guideline 1.2 - community comment report state
  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
  const [pendingReportComment, setPendingReportComment] = useState<any | null>(null);
  const [keptComments, setKeptComments] = useState<any[]>([]);

  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockConfirmData, setBlockConfirmData] = useState<{
    targetUserId: string;
    username: string;
    isBlocked: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Global block store — shared across all screens
  const blockedUserSet = useBlockStore(state => state.blockedUserSet);
  const blockedByMeUserSet = useBlockStore(state => state.blockedByMeUserSet);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);

  const handleToggleBlockUser = useCallback(async (targetUid: string, targetName: string) => {
    if (!user?.id) return;
    const isCurrentlyBlocked = blockedByMeUserSet.has(String(targetUid));

    const performBlockToggle = async () => {
      try {
        if (isCurrentlyBlocked) {
          await unblockUser(user.id, targetUid);
          removeBlock(String(targetUid));
          Alert.alert('Success', `${targetName} has been unblocked.`);
        } else {
          await blockUser(user.id, targetUid);
          addBlock(String(targetUid));
          
          // Dismiss comments modal first
          setShowCommentModal(null);

          Alert.alert('Success', `${targetName} has been blocked.`);
        }
      } catch (error) {
        console.error('Error toggling block status:', error);
        Alert.alert('Error', 'Could not update block status. Please try again.');
      }
    };

    if (Platform.OS === 'android') {
      setBlockConfirmData({
        targetUserId: String(targetUid),
        username: targetName || 'User',
        isBlocked: isCurrentlyBlocked,
        onConfirm: performBlockToggle,
      });
      setBlockConfirmVisible(true);
    } else {
      Alert.alert(
        isCurrentlyBlocked ? 'Unblock User' : 'Block User',
        isCurrentlyBlocked
          ? `Are you sure you want to unblock ${targetName}?`
          : `Are you sure you want to block ${targetName}? You will no longer see their posts, comments, or messages.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isCurrentlyBlocked ? 'Unblock' : 'Block',
            style: isCurrentlyBlocked ? 'default' : 'destructive',
            onPress: performBlockToggle,
          }
        ]
      );
    }
  }, [user?.id, blockedByMeUserSet, addBlock, removeBlock]);

  const handleCommentMenuPress = useCallback((comment: any) => {
    const targetUserId = comment.userId || comment.user_id || comment.sender_id || comment.user?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserSet.has(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

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
            setReportCommentModalVisible(true);
          } else if (buttonIndex === 2) {
            await handleToggleBlockUser(targetUserId, comment.userName || 'User');
          }
        }
      );
    } else {
      originalAlert(
        'Comment Options',
        'Choose an action:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report Comment', onPress: () => {
            setPendingReportComment(comment);
            setReportCommentModalVisible(true);
          }},
          {
            text: blockLabel,
            style: 'destructive',
            onPress: () => handleToggleBlockUser(targetUserId, comment.userName || 'User')
          }
        ],
        { cancelable: true }
      );
    }
  }, [blockedUserSet, handleToggleBlockUser, showCommentModal]);

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your media library to attach photos or videos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setSelectedMediaType(asset.type === 'video' ? 'video' : 'image');
      }
    } catch (error) {
      console.warn('Image picker error:', error);
    }
  }, []);


  const openEventDatePicker = useCallback(() => {
    if (Platform.OS === 'android') {
      Keyboard.dismiss();
      DateTimePickerAndroid.open({
        value: eventDate || new Date(),
        mode: 'date',
        display: 'calendar',
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            const currentDate = eventDate || new Date();
            const nextDate = new Date(selectedDate);
            nextDate.setHours(currentDate.getHours(), currentDate.getMinutes());
            setEventDate(nextDate);
          }
        },
      });
      return;
    }
    setShowDatePicker(true);
  }, [eventDate]);

  const openEventTimePicker = useCallback(() => {
    if (Platform.OS === 'android') {
      Keyboard.dismiss();
      DateTimePickerAndroid.open({
        value: eventDate || new Date(),
        mode: 'time',
        display: 'clock',
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            const newDate = new Date(eventDate || new Date());
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setEventDate(newDate);
          }
        },
      });
      return;
    }
    setShowTimePicker(true);
  }, [eventDate]);

  const isLocalUserCommunity = useMemo(() => {
    return !['city', 'state', 'country'].includes(community?.type);
  }, [community?.type]);

  useEffect(() => {
    const onShow = (e: any) => {
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
      setKeyboardVisible(true);
    };

    const onHide = () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    };

    const showSub1 = Keyboard.addListener('keyboardWillShow', onShow);
    const showSub2 = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub1 = Keyboard.addListener('keyboardWillHide', onHide);
    const hideSub2 = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub1.remove();
      showSub2.remove();
      hideSub1.remove();
      hideSub2.remove();
    };
  }, []);

  const dynamicTabs = useMemo(() => {
    if (community?.type === 'city' || community?.type === 'state' || community?.type === 'country') {
      return COMMUNITY_TABS;
    }
    return ['Feed'];
  }, [community?.type]);



  const filteredRequests = useMemo(() => {
    return requests.filter((item: any) => !isSevaRequest(item));
  }, [requests]);

  const filteredSevaRequests = useMemo(() => {
    return requests.filter((item: any) => isSevaRequest(item));
  }, [requests]);

  const mostRecentRequest = useMemo(() => {
    const activeList = activeTab === 'Seva' ? filteredSevaRequests : activeTab === 'Requests' ? filteredRequests : requests;
    if (!activeList || activeList.length === 0) {
      return null;
    }
    return [...activeList].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [requests, activeTab, filteredRequests, filteredSevaRequests]);





  const combinedData = useCommunityTabData(
    activeTab,
    requests,
    events,
    discussionPosts,
    communityPosts,
    user?.id,
    blockedUserSet,
    festivalSort,
    selectedFestival,
    allFestivals
  );

  // ⚡ Android: Build an O(1) index map so renderDiscussionItem does not need findIndex (O(n)) per render
  const combinedDataIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    combinedData.forEach((item, i) => {
      map.set(String(item.id), i);
    });
    return map;
  }, [combinedData]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        // ⚡ Android: Defer heavy data fetch until after screen transition animation completes
        const task = InteractionManager.runAfterInteractions(() => {
          fetchCommunity();
        });
        return () => task.cancel();
      } else {
        fetchCommunity();
      }
    }, [id])
  );

  useEffect(() => {
    if (!loading && postId && communityPosts.length > 0) {
      const index = communityPosts.findIndex(p => p.id === postId);
      if (index !== -1) {
        // Find the index in combinedData
        const combinedIndex = combinedData.findIndex(item => item.id === postId);
        if (combinedIndex !== -1) {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: combinedIndex, animated: true, viewPosition: 0.5 });
          }, 500);
        }
      }
    }
  }, [loading, postId, communityPosts, combinedData]);



  const renderHeader = () => (
    <LinearGradient
      colors={['#FF8C3A', '#FFAD7D', '#FFD4AA', '#FFF1E8', '#FFFFFF']}
      locations={[0, 0.25, 0.55, 0.8, 1]}
      style={[styles.headerGradientContainer, { paddingTop: insets.top }]}
    >
      {/* Top Row: Back Button, Title, and Create Button */}
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.headerBackButton}
        >
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitleText} numberOfLines={1}>
          {getTranslatedCommunityName(community?.name || 'Mumbai Group')}
        </Text>

        <TouchableOpacity
          style={styles.headerCreateBtn}
          onPress={() => {
            setPostCategory('');
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.headerCreateBtnText}>{t('language') === 'hi' ? 'बनाएं' : 'Create'}</Text>
        </TouchableOpacity>
        
        {(!['city', 'state', 'country'].includes(community?.type)) && (
          <TouchableOpacity 
            style={{ position: 'absolute', right: 100, zIndex: 10, padding: 8 }}
            onPress={() => setShowGroupInfoModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Centered Member Count */}
      <Text style={styles.headerMembersText}>
        {getCommunityMemberCount(community)} {t('language') === 'hi' ? 'सदस्य' : 'Members'}
      </Text>

      {/* Centered Description/Tagline */}
      <Text style={styles.headerTaglineText}>
        {t('language') === 'hi'
          ? (community?.description === 'A community group for sharing food in Pune.'
              ? 'पुणे में भोजन साझा करने के लिए एक सामुदायिक समूह।'
              : (community?.description || 'अपने स्थानीय समुदाय से जुड़ें।'))
          : (community?.description || 'Connect with your local community.')}
      </Text>

      {/* Tabs list scroll */}
      <KeyboardAwareScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('My Posts')}
          style={[styles.pillTab, activeTab === 'My Posts' && styles.pillTabActive]}
        >
          <View style={[styles.pillIconWrap, activeTab === 'My Posts' && styles.pillIconWrapActive]}>
            <Ionicons
              name="person"
              size={10}
              color={activeTab === 'My Posts' ? '#FF6B00' : '#888'}
            />
          </View>
          <Text style={[styles.pillTabText, activeTab === 'My Posts' && styles.pillTabTextActive]}>
            {getTranslatedTab('My Posts')}
          </Text>
        </TouchableOpacity>

        <View style={{ width: 1.5, height: 18, backgroundColor: 'rgba(0,0,0,0.15)', marginHorizontal: 2 }} />

        {dynamicTabs.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.pillTab, activeTab === tab && styles.pillTabActive]}
          >
            <Text style={[styles.pillTabText, activeTab === tab && styles.pillTabTextActive]}>
              {getTranslatedTab(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
  const formatRelativeTime = (ts: string) => {
    if (!ts) return 'Just now';
    if (ts.toLowerCase().includes('ago') || ts.toLowerCase().includes('now')) {
      return ts;
    }
    return getTimeAgo(ts);
  };

  const handleCallPress = useCallback((phone: any) => {
    const phoneStr = typeof phone === 'string' ? phone : '';
    if (!phoneStr) {
      Alert.alert('Not Available', 'No contact phone number is available.');
      return;
    }
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Call ${phoneStr}?`);
      if (confirmed) {
        Linking.openURL(`tel:${phoneStr}`);
      }
      return;
    }
    Alert.alert(
      'Confirm Call',
      `Are you sure you want to call ${phoneStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneStr}`);
          }
        }
      ]
    );
  }, []);

  const handleOpenMap = useCallback((location: string) => {
    if (!location || location === 'Online' || location === 'Local') return;
    const query = encodeURIComponent(location.trim());
    const nativeUrl = Platform.OS === 'ios' 
      ? `maps://0,0?q=${query}` 
      : `geo:0,0?q=${query}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(nativeUrl)
      .catch((err: any) => {
        console.warn('Could not open native map, trying browser fallback:', err);
        return Linking.openURL(webUrl);
      })
      .catch((webErr: any) => {
        console.error('Failed to open web maps fallback:', webErr);
        Alert.alert('Error', 'Unable to open maps application.');
      });
  }, []);

  const handleWhatsAppPress = useCallback((phone: any, title: string) => {
    const phoneStr = typeof phone === 'string' ? phone : '';
    if (!phoneStr) {
      Alert.alert('Not Available', 'No contact phone number is available.');
      return;
    }
    let cleanPhone = phoneStr.replace(/\D/g, '').replace(/^0+/, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    if (!cleanPhone) {
      Alert.alert('Invalid Number', 'The contact phone number is invalid.');
      return;
    }

    const message = `Hare Krishna! I saw your post "${title || 'Help Needed'}" on Brahmand. Let me know how I can help.`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(webUrl).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp. Please verify the contact number is correct.');
    });
  }, []);

  const handleAttendPress = useCallback(async (eventId: string, wantsToAttend: boolean, eventItem?: any) => {
    setRsvpStates(prev => ({
      ...prev,
      [eventId]: wantsToAttend ? 'yes' : 'no'
    }));

    if (wantsToAttend && eventItem?.start_time) {
      const title = eventItem.title || eventItem.content || 'Community Event';
      scheduleEventReminderNotification(title, eventItem.start_time, id as string)
        .catch(e => console.warn('[Community] Failed to schedule event reminder:', e));
    }

    try {
      if (typeof eventId === 'string' && !eventId.startsWith('post-') && !eventId.startsWith('dummy-')) {
        if (wantsToAttend) {
          await attendEvent(eventId);
        } else {
          await axiosInstance.post(`/events/${eventId}/cancel-attendance`);
        }
      }
    } catch (err) {
      console.warn('Failed to update event attendance on backend:', err);
    }
  }, [id]);

  const handleViewAttendees = useCallback(async (item: any) => {
    setShowAttendeesModal(item);
    setAttendeesLoading(true);
    setAttendeesList([]);
    try {
      const attendeeIds = item.attendees || [];
      if (attendeeIds.length > 0) {
        const res = await getUsersBatch(attendeeIds);
        setAttendeesList(res.data?.users || res.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch attendees:', err);
    } finally {
      setAttendeesLoading(false);
    }
  }, []);



  const renderFestivalItem = ({ item, index }: { item: any; index: number }) => {
    const festImg = getFestivalImage(item);
    
    let formattedDate = '';
    const rawDate = item.date || item.start_date || item.festival_date;
    if (rawDate) {
      try {
        const d = parseUTCDate(rawDate);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          formattedDate = `${day}/${month}/${d.getFullYear()}`;
        } else {
          formattedDate = String(rawDate);
        }
      } catch (err) {
        console.warn('Failed to parse date in card', err);
        formattedDate = String(rawDate);
      }
    }

    const isSelected = (selectedFestival || '').toLowerCase().trim() === (item.name || '').toLowerCase().trim();

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/festival-detail?index=${index}`)}
        style={[
          styles.festivalTypeCard, 
          { backgroundColor: item.color || '#FFF5F0' },
          isSelected && { borderWidth: 2, borderColor: '#FF6B00' }
        ]}
      >
        <View style={styles.festivalIconCircle}>
          {festImg ? (
            <ExpoImage
              source={festImg}
              style={{ width: '100%', height: '100%', borderRadius: 28 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={100}
            />
          ) : (
            <Ionicons name="calendar-outline" size={24} color="#FF6B00" />
          )}
        </View>
        <Text style={styles.festivalTypeName}>{item.name}</Text>
        {formattedDate ? (
          <View style={styles.festivalEventCount}>
            <Text style={styles.festivalEventCountText} numberOfLines={1}>{formattedDate}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };
  const handleFestivalInterest = async (item: any) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in settings to get festival reminders.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('festival-reminders', {
          name: 'Festival Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'bell.mp3', // Make sure to use the sound defined in app.json
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🪔 Festival Reminder: ${item.title}`,
          body: `We will keep you updated about the ${item.title} celebration!`,
          sound: 'bell.mp3', // Custom sound for iOS
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          repeats: false,
          channelId: Platform.OS === 'android' ? 'festival-reminders' : undefined,
        },
      });
      Alert.alert('Notification Set', `You are marked as interested! We will notify you about ${item.title}.`);
    } catch (err) {
      console.warn('Failed to set interest reminder', err);
      Alert.alert('Interested', `You are marked as interested in ${item.title}!`);
    }
  };

  const renderFestivalEvent = ({ item }: { item: FestivalEvent }) => (
    <FestivalEventCardItem 
      item={item} 
      handleOpenMap={handleOpenMap} 
      handleFestivalInterest={handleFestivalInterest} 
      activeVideoKey={activeVideoKey} 
    />
  );

  const getRequestIconDetails = (item: any) => {
    const type = item.request_type;
    const support = item.support_needed || '';

    if (type === 'blood' || support.toLowerCase().includes('blood')) {
      return { name: 'water', color: '#FF3B30', bg: '#FFEBEB' };
    }
    if (support.toLowerCase().includes('emergency') || support.toLowerCase().includes('critical')) {
      return { name: 'medkit', color: '#FB8C00', bg: '#FFF3E0' };
    }
    if (support.toLowerCase().includes('food') || support.toLowerCase().includes('grocery')) {
      return { name: 'restaurant', color: '#F25C05', bg: '#FFF4EE' };
    }
    if (support.toLowerCase().includes('senior') || support.toLowerCase().includes('citizen')) {
      return { name: 'people', color: '#5C6BC0', bg: '#E8EAF6' };
    }
    if (support.toLowerCase().includes('gau') || support.toLowerCase().includes('animal') || support.toLowerCase().includes('cow')) {
      return { name: 'paw', color: '#43A047', bg: '#E8F5E9' };
    }
    if (support.toLowerCase().includes('temple') || support.toLowerCase().includes('volunteer')) {
      return { name: 'home', color: '#FF9800', bg: '#FFF3E0' };
    }
    if (type === 'lost_found' || type === 'lost' || type === 'found' || support.toLowerCase().includes('lost') || support.toLowerCase().includes('found')) {
      return { name: 'search', color: '#8E24AA', bg: '#F3E5F5' };
    }
    return { name: 'help-circle', color: '#00796B', bg: '#E0F2F1' };
  };






  const handleResolveRequest = useCallback((item: any) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to mark this request as fulfilled?');
      if (confirmed) {
        executeResolve(item);
      }
      return;
    }

    originalAlert(
      'Fulfill Request',
      'Are you sure you want to mark this request as fulfilled?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fulfill',
          style: 'default',
          onPress: () => executeResolve(item)
        }
      ]
    );
  }, []);

  const executeResolve = async (item: any) => {
    try {
      if (item.request_type) {
        await resolveCommunityRequest(item.id);
      } else {
        await deletePost(item.id);
      }
      Alert.alert('Success', 'Request marked as fulfilled successfully!');
      fetchCommunity(true); // Reload requests list!
    } catch (error: any) {
      Alert.alert('Error', parseApiError(error));
    }
  };

  const handleShareRequest = useCallback(async (item: any) => {
    try {
      const deepLink = `https://brahmand.app/community-request/list?requestId=${item.id}`;
      const typeLabel = (item.request_type || 'Help').toUpperCase();

      await Share.share({
        title: item.title,
        message: `📢 *Brahmand Community Request*\n\n[${typeLabel}]\n*${item.title}*\n📍 Location: ${item.location || 'Not specified'}\n⚠️ Urgency: ${(item.urgency_level || 'Normal').toUpperCase()}\n\n💬 Description:\n"${item.description || 'See details in app'}"\n\n📞 Contact number: ${item.contact_number || 'Available in app'}\n\nTap the link below to open in Brahmand App and offer help:\n${deepLink}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, []);


  const handleOfferHelp = async (item: any) => {
    let targetSlId = item.user_sl_id;
    let targetPhone = item.contact_number || item.user_phone;

    if (!targetSlId && item.user_id) {
      try {
        const res = await getUserProfile(item.user_id);
        const profile = res.data?.user || res.data;
        targetSlId = profile?.sl_id;
        if (!targetPhone) {
          targetPhone = profile?.phone;
        }
      } catch (err) {
        console.warn('Failed to fetch legacy user profile', err);
      }
    }

    if (!targetSlId) {
      if (Platform.OS === 'web') {
        window.alert('This request does not have a valid chat ID.');
      } else {
        Alert.alert('Error', 'This request does not have a valid chat ID.');
      }
      return;
    }

    if (Platform.OS === 'web') {
      const groupName = getTranslatedCommunityName(community?.name || 'Mumbai Group');
      const messageText = t('language') === 'hi'
        ? `हरे कृष्णा! मैंने ${groupName} में आपका अनुरोध '${item.title}' देखा और मैं अपनी सहायता/मदद देना चाहूंगा।`
        : `Hare Krishna! I saw your request '${item.title}' in the ${groupName} and would like to offer my support/help.`;
      const confirmedMsg = t('language') === 'hi'
        ? `क्या आप चैट शुरू करके ${item.user_name || 'भक्त'} की मदद करना चाहते हैं?\n\nसंदेश: "${messageText}"`
        : `Would you like to offer help to ${item.user_name || 'devotee'} by starting a chat?\n\nMessage: "${messageText}"`;
      const confirmed = window.confirm(confirmedMsg);
      if (confirmed) {
        try {
          const response = await sendDirectMessage(targetSlId, messageText);
          const conversationId = response.data?.chat_id || response.data?.conversation_id;
          if (conversationId) {
            const photoUrl = item.user?.photo || item.user_photo || '';
            router.push(`/dm/${conversationId}?userId=${item.user_id || ''}&userName=${encodeURIComponent(item.user_name || '')}&userSL=${encodeURIComponent(targetSlId || '')}&userPhoto=${encodeURIComponent(photoUrl)}`);
          } else {
            router.push('/(tabs)/messages');
          }
        } catch (error: any) {
          window.alert(error?.response?.data?.detail || 'Failed to start chat. You might already have a pending message request.');
        }
      }
      return;
    }

    const options: any[] = [
      {
        text: t('language') === 'hi' ? 'चैट संदेश भेजें' : 'Send Message (Chat)',
        onPress: () => {
          Alert.alert(
            t('language') === 'hi' ? 'मदद की पेशकश' : 'Offer Help',
            t('language') === 'hi' ? `क्या ${item.user_name || 'भक्त'} को संदेश भेजें?` : `Send a message to ${item.user_name || 'devotee'}?`,
            [
              { text: t('language') === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
              {
                text: t('language') === 'hi' ? 'भेजें' : 'Send',
                onPress: async () => {
                  try {
                    const groupName = getTranslatedCommunityName(community?.name || 'Mumbai Group');
                    const messageText = t('language') === 'hi'
                      ? `हरे कृष्णा! मैंने ${groupName} में आपका अनुरोध '${item.title}' देखा और मैं अपनी सहायता/मदद देना चाहूंगा।`
                      : `Hare Krishna! I saw your request '${item.title}' in the ${groupName} and would like to offer my support/help.`;
                    const response = await sendDirectMessage(targetSlId, messageText);
                    const conversationId = response.data?.chat_id || response.data?.conversation_id;
                    if (conversationId) {
                      const photoUrl = item.user?.photo || item.user_photo || '';
                      router.push(`/dm/${conversationId}?userId=${item.user_id || ''}&userName=${encodeURIComponent(item.user_name || '')}&userSL=${encodeURIComponent(targetSlId || '')}&userPhoto=${encodeURIComponent(photoUrl)}`);
                    } else {
                      router.push('/(tabs)/messages');
                    }
                  } catch (error: any) {
                    Alert.alert('Error', error?.response?.data?.detail || 'Failed to start chat. You might already have a pending message request.');
                  }
                }
              }
            ]
          );
        }
      }
    ];

    const contactNum = item.contact_number;
    const hasPhone = contactNum && /^\+?[0-9\s-]{10,15}$/.test(contactNum);

    if (hasPhone) {
      options.push({
        text: `Call: ${contactNum}`,
        onPress: () => {
          Linking.openURL(`tel:${contactNum}`);
        }
      });
    } else if (targetPhone) {
      options.push({
        text: `Call: ${targetPhone}`,
        onPress: () => {
          Linking.openURL(`tel:${targetPhone}`);
        }
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Offer Help',
      `How would you like to contact ${item.user_name || 'devotee'}?`,
      options
    );
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  const handleShareCommunity = async () => {
    try {
      const appLink = `https://brahmand.app/community/${id}`;
      await Share.share({
        message: t('language') === 'hi'
          ? `ब्रह्मांड पर ${getTranslatedCommunityName(community?.name || 'Mumbai Group')} में शामिल हों!\n\n${appLink}`
          : `Join the ${getTranslatedCommunityName(community?.name || 'Mumbai Community')} on Brahmand!\n\n${appLink}`,
      });
    } catch (error) {
      console.error('Error sharing community:', error);
    }
  };

  const handleLike = useCallback((postOrId: any) => {
    const rawId = typeof postOrId === 'object' && postOrId !== null ? (postOrId.id ?? postOrId.post_id) : postOrId;
    if (!rawId) return;
    const postId = String(rawId);

    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setDiscussionPosts(prev => prev.map(post => {
      if (String(post.id) === postId) {
        const isLiked = post.liked;
        return {
          ...post,
          liked: !isLiked,
          likes: isLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1
        };
      }
      return post;
    }));

    const matchedPost = communityPosts.find(p => String(p.id) === postId);
    const isCommunityMsg = matchedPost ? !!matchedPost.isCommunityMsg : false;
    const targetSubgroup = matchedPost?.subgroupType || 'city';
    const targetCommunityId = matchedPost?.communityId || (id as string);

    setCommunityPosts(prev => {
      const updated = prev.map(post => {
        if (String(post.id) === postId) {
          const isLiked = post.liked;
          return {
            ...post,
            liked: !isLiked,
            likes: isLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1
          };
        }
        return post;
      });
      useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
      return updated;
    });

    if (!postId.startsWith('post-') && !postId.startsWith('dummy-')) {
      (async () => {
        try {
          if (isCommunityMsg) {
            await toggleCommunityMessageLike(targetCommunityId, targetSubgroup, postId);
          } else {
            await togglePostLike(postId);
          }
        } catch (error) {
          console.error('Failed to toggle like on backend:', error);
        }
      })();
    }
  }, [communityPosts, discussionPosts, id, cacheKey]);

  const handleRepost = useCallback((postOrId: any) => {
    const rawId = typeof postOrId === 'object' && postOrId !== null ? (postOrId.id ?? postOrId.post_id) : postOrId;
    if (!rawId) return;
    const targetId = String(rawId);
    const postToRepost = communityPosts.find(p => String(p.id) === targetId) || discussionPosts.find(p => String(p.id) === targetId);
    if (!postToRepost) return;

    const realOriginalId = String(postToRepost.originalPostId || postToRepost.id);

    const existingRepostIndex = communityPosts.findIndex(
      p => p.isRepost && (String(p.originalPostId) === realOriginalId || String(p.id) === targetId) && p.repostedBy === (user?.name || 'You')
    );

    if (existingRepostIndex !== -1) {
      setCommunityPosts(prev =>
        prev
          .filter((_, idx) => idx !== existingRepostIndex)
          .map(post => {
            if (String(post.id) === realOriginalId) {
              return {
                ...post,
                isRepost: false,
                reposts: Math.max(0, (post.reposts || 0) - 1),
              };
            }
            return post;
          })
      );
      Alert.alert('Repost Removed', 'Repost has been removed from feed.');
    } else {
      const newRepostCard = {
        ...postToRepost,
        id: `repost-${Date.now()}`,
        originalPostId: realOriginalId,
        isRepost: true,
        repostedBy: user?.name || 'You',
        timestamp: 'Just now',
        reposts: (postToRepost.reposts || 0) + 1,
      };

      setCommunityPosts(prev => [
        newRepostCard,
        ...prev.map(post => {
          if (String(post.id) === realOriginalId) {
            return {
              ...post,
              isRepost: true,
              reposts: (post.reposts || 0) + 1,
            };
          }
          return post;
        }),
      ]);

      Alert.alert('Success', 'Post reposted successfully!');
    }
  }, [communityPosts, discussionPosts, user?.name]);

  const handleDeletePost = useCallback((postOrId: any) => {
    const rawId = typeof postOrId === 'object' && postOrId !== null ? (postOrId.id ?? postOrId.post_id) : postOrId;
    if (!rawId) return;
    const postId = String(rawId);
    const postToDelete = discussionPosts.find(p => String(p.id) === postId) || communityPosts.find(p => String(p.id) === postId);
    if (postToDelete) {
      const isOwn = postToDelete.sender_id === user?.id || postToDelete.user?.name === user?.name;
      if (!isOwn) {
        if (Platform.OS === 'web') {
          alert('You can only delete your own messages.');
        } else {
          Alert.alert('Error', 'You can only delete your own messages.');
        }
        return;
      }
    }

    const isCommunityMsg = postToDelete?.isCommunityMsg;
    const communityId = postToDelete?.communityId || id;
    const subgroupType = postToDelete?.subgroupType || (community?.type === 'state' ? 'state' : (community?.type === 'country' || community?.type === 'national' ? 'national' : 'city'));

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('Are you sure you want to delete this post from the community?');
      if (confirmDelete) {
        setDiscussionPosts(prev => prev.filter(post => post.id !== postId));
        setCommunityPosts(prev => {
          const updated = prev.filter(post => post.id !== postId);
          const currentDeleted = useChatStore.getState().communityScreenCaches[cacheKey]?.deletedPostIds || [];
          const newDeletedIds = [...new Set([...currentDeleted, postId])];
          useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated, deletedPostIds: newDeletedIds });
          return updated;
        });

        try {
          if (isCommunityMsg) {
            deleteCommunityMessage(communityId, subgroupType, postId).catch((e: any) => console.log('API delete community msg err:', e));
          } else {
            deletePost(postId).catch((e: any) => console.log('API delete err:', e));
          }
        } catch (error) {
          console.log('[Community] Post delete API error:', error);
        }

        alert('Post has been deleted successfully!');
      }
      return;
    }

    originalAlert(
      'Delete Post',
      'Are you sure you want to delete this post from the community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS === 'ios') {
              iosUserCreatedPostIds.delete(String(postId));
            }
            setDiscussionPosts(prev => prev.filter(post => post.id !== postId));
            setCommunityPosts(prev => {
              const updated = prev.filter(post => post.id !== postId);
              const currentDeleted = useChatStore.getState().communityScreenCaches[cacheKey]?.deletedPostIds || [];
              const newDeletedIds = [...new Set([...currentDeleted, postId])];
              useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated, deletedPostIds: newDeletedIds });
              return updated;
            });

            try {
              if (isCommunityMsg) {
                await deleteCommunityMessage(communityId, subgroupType, postId);
              } else {
                await deletePost(postId);
              }
            } catch (error) {
              console.log('[Community] Post delete API error (safe to ignore for local/mock posts):', error);
            }

            Alert.alert('Success', 'Post has been deleted successfully!');
          }
        }
      ]
    );
  }, [discussionPosts, communityPosts, user?.id, user?.name, community?.type, id, cacheKey]);

  const handleInlineCategorySelect = (category: string) => {
    setShowInlineCategories(false);
    if (category === 'Requests') {
      setShowCreateModal(false);
      setPostCategory('');
      router.push({ pathname: '/community-request', params: { community_id: id } });
      return;
    }

    setPostCategory(category);
    const text = newMessage;
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const updatedText = text.slice(0, lastAtIndex) + text.slice(lastAtIndex + 1);
      setNewMessage(updatedText);
    } else {
      setNewMessage(text);
    }
  };

  const handlePostButtonPress = () => {
    if (!newMessage.trim() && !selectedImage) return;

    if (postCategory) {
      handleCategorySelectedAndPost(postCategory);
    } else {
      setShowCategorySelector(true);
    }
  };

  const handleCategorySelectedAndPost = async (selectedCategory: string) => {
    setShowCategorySelector(false);
    setPostCategory(selectedCategory);

    // If user selected Requests, check KYC
    if (selectedCategory === 'Requests' && !isKycVerified) {
      setShowCategorySelector(false);
      router.push('/kyc');
      return;
    }

    // Proceed to create the post
    await executeCreatePost(selectedCategory);
  };



  const validatePostRequirements = (categoryOverride?: string): boolean => {
    if (!newMessage.trim() && !selectedImage) return false;

    const isRestrictedGroup = community?.type && ['state', 'country', 'national'].includes(community.type);
    if (isRestrictedGroup && !isKycVerified) {
      Alert.alert(
        'Verification Required',
        'Only verified members can post in State and National community groups. Please verify your profile to post.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Now', onPress: () => router.push('/kyc') }
        ]
      );
      return false;
    }
    return true;
  };

  const uploadMediaIfNeeded = async (localImage?: string | null, mediaType?: string): Promise<string | undefined | null> => {
    if (!localImage) return undefined;
    try {
      const isVideoFile = mediaType === 'video' || (typeof localImage === 'string' && (
        localImage.toLowerCase().endsWith('.mp4') ||
        localImage.toLowerCase().endsWith('.mov') ||
        localImage.toLowerCase().endsWith('.m4v') ||
        localImage.toLowerCase().endsWith('.webm') ||
        localImage.toLowerCase().includes('/video/') ||
        localImage.toLowerCase().includes('video=true')
      ));
      const fileExtension = isVideoFile ? (localImage.toLowerCase().endsWith('.mov') ? 'mov' : 'mp4') : 'jpg';
      const fileMime = isVideoFile ? (localImage.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4') : 'image/jpeg';

      const uploadRes = await uploadChatMedia({
        uri: localImage,
        name: `community_post_${Date.now()}.${fileExtension}`,
        type: fileMime
      });
      const uploadedUrl = (uploadRes?.data as any)?.media_url || (uploadRes?.data as any)?.mediaUrl || (uploadRes?.data as any)?.url || (uploadRes as any)?.url || (uploadRes as any)?.mediaUrl;

      if (!uploadedUrl) {
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
        return null;
      }
      console.log('[Community] Media uploaded successfully:', uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error('[Community] Media upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
      return null;
    }
  };

  const sendPostChunks = async (
    textChunks: string[],
    finalCategory: string,
    uploadedUrl: string | undefined,
    postLocation: string | undefined,
    newPosts: any[]
  ) => {
    const currentSubgroup = community?.type === 'state'
      ? 'state'
      : (community?.type === 'country' || community?.type === 'national' ? 'national' : 'city');

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      if (chunk.trim() || (i === 0 && uploadedUrl)) {
        try {
          const res = await sendCommunityMessage(
            id as string,
            currentSubgroup,
            chunk,
            'text',
            finalCategory,
            i === 0 ? uploadedUrl : undefined,
            i === 0 ? (contactNumber || undefined) : undefined,
            i === 0 ? (sevaDetails || undefined) : undefined,
            i === 0 ? (postLocation || undefined) : undefined,
            i === 0 && finalCategory === 'Events' ? (eventDate?.toISOString() || undefined) : undefined,
            cachedSymmetricKey
          );
          console.log(`[Community] Real thread chunk ${i + 1} sent`);

          const realId = res?.data?.id || (res as any)?.id;
          if (realId) {
            if (Platform.OS === 'ios') {
              iosUserCreatedPostIds.add(String(realId));
            }
            setCommunityPosts(prev => {
              const updated = prev.map(p => p.id === newPosts[i].id ? { 
                ...p, 
                id: realId,
                image: i === 0 && uploadedUrl ? uploadedUrl : p.image
              } : p);
              useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
              return updated;
            });
          }
        } catch (error) {
          console.error('Failed to send real message chunk:', error);
          const errMsg = parseApiError(error);
          if (errMsg.includes('Only verified members can post') || errMsg.includes('verified members')) {
            Alert.alert(
              'Verification Required',
              'Only verified members can post in State and National community groups. Please verify your profile to post.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Verify Now', onPress: () => router.push('/kyc') }
              ]
            );
          } else {
            Alert.alert('Post Failed', errMsg);
          }
          if (Platform.OS === 'ios') {
            iosUserCreatedPostIds.delete(String(newPosts[i].id));
          }
          setCommunityPosts(prev => {
            const updated = prev.filter(p => p.id !== newPosts[i].id);
            if (Platform.OS === 'ios') {
              useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
            }
            return updated;
          });
          break;
        }
      }
    }
  };

  const handlePostSuccess = (finalCategory: string, textChunks: string[]) => {
    resetCreatePostState();

    if (finalCategory === 'Events' && eventDate) {
      scheduleEventReminderNotification(
        newMessage.trim() || 'Community Event',
        eventDate.toISOString(),
        id as string
      ).catch(e => console.warn('[Community] Failed to schedule event reminder on create:', e));
    }

    Alert.alert('Success', textChunks.length > 1 ? 'Your thread has been shared with the community!' : 'Your post has been shared with the community!');
  };

  const executeCreatePost = async (categoryOverride?: string) => {
    if (!validatePostRequirements(categoryOverride)) return;

    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    const finalCategory = (categoryOverride === 'Others' || !categoryOverride) ? 'Feed' : categoryOverride;

    let postLocation: string | undefined = undefined;
    if (finalCategory === 'Lost & Found') {
      try {
        const hasPermission = await ensureForegroundPermission();
        if (hasPermission) {
          const pos = await getCurrentPosition({ accuracy: 3 });
          if (pos && pos.coords) {
            const geocodeRes = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            const addressData = geocodeRes?.data;
            if (addressData) {
              postLocation = addressData.display_name || addressData.formatted_address || addressData.name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            } else {
              postLocation = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            }
          }
        }
      } catch (err) {
        console.warn('[Community] Failed to get post location:', err);
      }
    } else if (finalCategory === 'Events') {
      postLocation = eventLocation || undefined;
    }

    const uploadedUrlResult = await uploadMediaIfNeeded(selectedImage, selectedMediaType || undefined);
    if (selectedImage && uploadedUrlResult === null) {
      // Abort post creation on media upload failure
      return;
    }
    const uploadedUrl = uploadedUrlResult || undefined;

    const textChunks = newMessage.trim() ? splitTextIntoTweets(newMessage.trim(), 250) : [];
    if (textChunks.length === 0 && selectedImage) {
      textChunks.push(' ');
    }

    const parentPostId = `post-${Date.now()}`;
    const newPosts = textChunks.map((chunk, index) => ({
      id: index === 0 ? parentPostId : `${parentPostId}-thread-${index}`,
      threadParentId: index === 0 ? undefined : parentPostId,
      category: finalCategory,
      user: {
        name: user?.name || 'User',
        photo: user?.photo,
        isVerified: user?.personality_verification_status === 'approved',
        verificationLabel: (user as any)?.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
      },
      content: chunk,
      image: index === 0 ? (uploadedUrl || selectedImage || undefined) : undefined,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      reposts: 0,
      liked: false,
      hideBadge: false,
      contact: index === 0 ? (contactNumber || undefined) : undefined,
      sevaDetails: index === 0 ? (sevaDetails || undefined) : undefined,
      start_time: index === 0 && finalCategory === 'Events' ? (eventDate?.toISOString() || undefined) : undefined,
      location: index === 0 ? (postLocation || undefined) : undefined,
      isUniversal: true,
      sender_id: user?.id,
      isCommunityMsg: true,
      subgroupType: community?.type === 'state' ? 'state' : (community?.type === 'country' || community?.type === 'national' ? 'national' : 'city'),
      communityId: id as string,
    }));

    if (Platform.OS === 'ios') {
      newPosts.forEach(p => {
        iosUserCreatedPostIds.add(String(p.id));
      });
    }
    setCommunityPosts(prev => {
      const updated = [...newPosts, ...prev];
      useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
      return updated;
    });

    textChunks.forEach(chunk => {
      if (chunk.trim()) {
        saveLocalPost(chunk.trim(), finalCategory);
      }
    });

    await sendPostChunks(textChunks, finalCategory, uploadedUrl, postLocation, newPosts);
    handlePostSuccess(finalCategory, textChunks);
  };

  const handleShare = useCallback(async (postOrId: any) => {
    try {
      const postId = typeof postOrId === 'object' && postOrId !== null ? String(postOrId.id || '') : String(postOrId || '');
      const appLink = `https://brahmand.app/community/${id}?postId=${postId}`;

      await Share.share({
        message: `Check out this community post on Brahmand!\n\n${appLink}`,
      });

      setCommunityPosts(prev => prev.map(post => {
        if (String(post.id) === postId) {
          return { ...post, shares: (post.shares || 0) + 1 };
        }
        return post;
      }));

      setDiscussionPosts(prev => prev.map(post => {
        if (String(post.id) === postId) {
          return { ...post, shares: (post.shares || 0) + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [id]);

  const handleOpenCommentModal = useCallback(async (post: any) => {
    setActiveComments([]);
    setShowCommentModal(post);
    setCommentText('');
    try {
      let response;
      let commentsData;
      if (post.isCommunityMsg) {
        response = await getCommunityMessageComments(post.communityId || id, post.subgroupType || 'city', post.id);
        commentsData = response.data?.data || [];
      } else {
        response = await getPostComments(post.id);
        commentsData = response.data || [];
      }
      const mappedComments = commentsData.map((c: any) => ({
        id: c.id || String(Math.random()),
        userName: c.username || c.sender_name || 'Anonymous',
        text: c.text || c.content || '',
        avatar: c.user_photo || c.sender_photo || null,
        userId: c.user_id,
        isVerified: c.is_verified || false,
        created_at: c.created_at || c.createdAt || 0,
      }));
      const merged = [...mappedComments];
      keptComments.forEach(kc => {
        if (kc && kc.id && !merged.some(c => c.id === kc.id)) {
          merged.push(kc);
        }
      });
      merged.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      setActiveComments(merged);
      // Sync the comment count on the post with actual loaded count to prevent stale badge mismatch
      setShowCommentModal(prev => prev ? { ...prev, comments: merged.length } : null);
    } catch (error) {
      console.warn('Failed to load comments:', error);
    }
  }, [id, keptComments]);

  const handleReport = useCallback((item: any) => {
    setPendingReportCommunityPost(item);
    setReportCommunityPostModalVisible(true);
  }, []);

  const handleFullScreenMedia = useCallback((uri: string) => {
    setFullScreenMedia(uri);
  }, []);


  const handleAddComment = async () => {
    if (!commentText.trim() || !showCommentModal) return;

    const textToSend = commentText.trim();
    const targetPostId = showCommentModal.id;

    const tempId = `comment-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      userName: user?.name || 'You',
      text: textToSend,
      avatar: user?.photo,
    };

    setActiveComments(prev => [optimisticComment, ...prev]);
    setCommentText('');

    // Update comment count on communityPosts, discussionPosts, and showCommentModal
    setCommunityPosts(prev => {
      const updated = prev.map(post => {
        if (post.id === targetPostId) {
          return { ...post, comments: (post.comments || 0) + 1 };
        }
        return post;
      });
      useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
      return updated;
    });
    setDiscussionPosts(prev => prev.map(post => {
      if (post.id === targetPostId) {
        return { ...post, comments: (post.comments || 0) + 1 };
      }
      return post;
    }));
    setShowCommentModal(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);

    try {
      let response;
      if (showCommentModal.isCommunityMsg) {
        response = await addCommunityMessageComment(showCommentModal.communityId || id, showCommentModal.subgroupType || 'city', targetPostId, textToSend);
      } else {
        response = await addPostComment(targetPostId, textToSend);
      }

      const serverComment = showCommentModal.isCommunityMsg
        ? response.data?.data?.[0]
        : response.data?.comment;

      if (serverComment) {
        setActiveComments(prev => prev.map(c =>
          c.id === tempId ? {
            id: serverComment.id || tempId,
            userName: serverComment.username || serverComment.sender_name || user?.name || 'You',
            text: serverComment.text || serverComment.content || textToSend,
            avatar: serverComment.user_photo || serverComment.sender_photo || user?.photo,
            userId: serverComment.user_id,
          } : c
        ));
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      // Rollback comment and comment count on error
      setActiveComments(prev => prev.filter(c => c.id !== tempId));
      setCommunityPosts(prev => {
        const updated = prev.map(post => {
          if (post.id === targetPostId) {
            return { ...post, comments: Math.max(0, (post.comments || 0) - 1) };
          }
          return post;
        });
        useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
        return updated;
      });
      setDiscussionPosts(prev => prev.map(post => {
        if (post.id === targetPostId) {
          return { ...post, comments: Math.max(0, (post.comments || 0) - 1) };
        }
        return post;
      }));
      setShowCommentModal(prev => prev ? { ...prev, comments: Math.max(0, (prev.comments || 0) - 1) } : null);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const commentToDelete = activeComments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    const targetPostId = showCommentModal?.id;

    // Optimistically remove comment and decrement comment count
    setActiveComments(prev => prev.filter(c => c.id !== commentId));
    if (targetPostId) {
      setCommunityPosts(prev => {
        const updated = prev.map(post => {
          if (post.id === targetPostId) {
            return { ...post, comments: Math.max(0, (post.comments || 0) - 1) };
          }
          return post;
        });
        useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
        return updated;
      });
      setDiscussionPosts(prev => prev.map(post => {
        if (post.id === targetPostId) {
          return { ...post, comments: Math.max(0, (post.comments || 0) - 1) };
        }
        return post;
      }));
      setShowCommentModal(prev => prev ? { ...prev, comments: Math.max(0, (prev.comments || 0) - 1) } : null);
    }

    try {
      await deleteCommentApi(commentId);
    } catch (error) {
      console.log('[Community] Comment delete API error:', error);
      // Rollback comment and comment count on error
      setActiveComments(prev => [commentToDelete, ...prev]);
      if (targetPostId) {
        setCommunityPosts(prev => {
          const updated = prev.map(post => {
            if (post.id === targetPostId) {
              return { ...post, comments: (post.comments || 0) + 1 };
            }
            return post;
          });
          useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
          return updated;
        });
        setDiscussionPosts(prev => prev.map(post => {
          if (post.id === targetPostId) {
            return { ...post, comments: (post.comments || 0) + 1 };
          }
          return post;
        }));
        setShowCommentModal(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
      }
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    }
  };


  const listHandlers = useMemo(
    () => ({
      onLike: handleLike,
      onRepost: handleRepost,
      onShare: handleShare,
      onComment: handleOpenCommentModal,
      onDelete: handleDeletePost,
      onReport: handleReport,
      onFullScreenMedia: handleFullScreenMedia,
      onOpenMap: handleOpenMap,
      onCall: handleCallPress,
      onWhatsApp: handleWhatsAppPress,
      onResolve: handleResolveRequest,
      onToggleInterest: handleToggleInterest,
      onAttend: handleAttendPress,
      onViewAttendees: handleViewAttendees,
      onNavigateKyc: () => router.push('/kyc'),
      setShowFilterDropdown,
      setShowSortDropdown,
      setSelectedFestival,
      setFestivalSort,
      setPostCategory,
      setShowCreateModal,
      renderFestivalItem,
      renderFestivalEvent,
    }),
    [
      handleLike,
      handleRepost,
      handleShare,
      handleOpenCommentModal,
      handleDeletePost,
      handleReport,
      handleFullScreenMedia,
      handleOpenMap,
      handleCallPress,
      handleWhatsAppPress,
      handleResolveRequest,
      handleToggleInterest,
      handleAttendPress,
      handleViewAttendees,
      router,
      setShowFilterDropdown,
      setShowSortDropdown,
      setSelectedFestival,
      setFestivalSort,
      setPostCategory,
      setShowCreateModal,
      renderFestivalItem,
      renderFestivalEvent,
    ]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF8C3A', '#FFAD7D', '#FFD4AA', '#FFF1E8', '#FFFFFF']}
          locations={[0, 0.25, 0.55, 0.8, 1]}
          style={[styles.headerGradientContainer, { paddingTop: insets.top }]}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
              <Ionicons name="chevron-back" size={26} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {community?.name || 'Community'}
            </Text>
            <View style={[styles.headerCreateBtn, { opacity: 0.4 }]}>
              <Ionicons name="add" size={16} color="#FFF" />
            </View>
          </View>
          <Text style={styles.headerMembersText}> </Text>
          <Text style={styles.headerTaglineText}> </Text>
        </LinearGradient>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
          <CustomLoader size={70} message="Loading Community Group..." />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {renderHeader()}
      <FlatList
        ref={listRef}
        data={combinedData}
        extraData={{ festivalSort, selectedFestival, showSortDropdown, showFilterDropdown }}
        keyExtractor={(item, index) => {
          if (item.id) return String(item.id);
          return `${item.type || 'item'}-${item.timestamp || Date.now()}-${index}`;
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={Platform.OS !== 'web'}
        updateCellsBatchingPeriod={100}
        scrollEventThrottle={32}
        renderItem={({ item }) => (
          <CommunityListItem
            item={item}
            activeTab={activeTab}
            isLocked={isLocked}
            lockReason={lockReason}
            user={user}
            activeVideoKey={activeVideoKey}
            interestMap={interestMap}
            rsvpStates={rsvpStates}
            styles={styles}
            handlers={listHandlers}
            combinedDataIndexMap={combinedDataIndexMap}
            combinedData={combinedData}
            allFestivals={allFestivals}
            selectedFestival={selectedFestival}
            showFilterDropdown={showFilterDropdown}
            showSortDropdown={showSortDropdown}
            festivalSort={festivalSort}
          />
        )}
        onEndReached={activeTab === 'Feed' ? handleLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (activeTab === 'Feed' && loadingMore) ? <CustomLoader size={40} fullScreen={false} /> : null}
        ListHeaderComponent={() => (
          <View>
            {(activeTab === 'Requests') && mostRecentRequest && (
              <View style={styles.recentRequestCard}>
                <LinearGradient
                  colors={['#FFF5EE', '#FFFDFB']}
                  style={styles.recentRequestGradient}
                >
                  <View style={styles.recentRequestHeader}>
                    <View style={styles.recentRequestTitleRow}>
                      <MaterialCommunityIcons name="bullhorn" size={20} color="#F25C05" />
                      <Text style={styles.recentRequestSectionTitle}>
                        {t('language') === 'hi' ? 'नवीनतम सामुदायिक अनुरोध' : 'LATEST COMMUNITY REQUEST'}
                      </Text>
                    </View>
                    <View style={[
                      styles.recentRequestUrgencyBadge,
                      { backgroundColor: (mostRecentRequest?.urgency_level || 'normal') === 'critical' ? '#FEE2E2' : '#FEF3C7' }
                    ]}>
                      <Text style={[
                        styles.recentRequestUrgencyText,
                        { color: (mostRecentRequest?.urgency_level || 'normal') === 'critical' ? '#EF4444' : '#D97706' }
                      ]}>
                        {(mostRecentRequest?.urgency_level || 'normal').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.recentRequestTitle} numberOfLines={1}>
                    {mostRecentRequest?.title}
                  </Text>
                  <Text style={styles.recentRequestDesc} numberOfLines={2}>
                    {mostRecentRequest?.description}
                  </Text>

                  <View style={styles.recentRequestFooter}>
                    <View style={styles.recentRequestLocRow}>
                      <Ionicons name="location" size={14} color="#64748B" />
                      <Text style={styles.recentRequestLocText} numberOfLines={1}>
                        {mostRecentRequest?.location || 'Mumbai'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.recentRequestViewBtn}
                      onPress={() => router.push({ pathname: '/community-request/list', params: { community_id: id } })}
                    >
                      <Text style={styles.recentRequestViewBtnText}>{t('language') === 'hi' ? 'विवरण देखें' : 'View Details'}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}

            {(activeTab === 'Feed' || activeTab === 'My Posts') && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>
                      {activeTab === 'My Posts' 
                        ? (t('language') === 'hi' ? 'मेरे साझा किए गए पोस्ट' : 'My Shared Posts') 
                        : (t('language') === 'hi' ? 'सामुदायिक चर्चा' : 'Community Discussion')}
                    </Text>
                  </View>
                  {activeTab !== 'My Posts' && (
                    <View style={styles.verifiedMessagesBadge}>
                      <MaterialCommunityIcons name="check-decagram" size={14} color="#FF3B30" />
                      <Text style={styles.verifiedMessagesText}>
                        {t('language') === 'hi' ? 'विशेष सत्यापित संदेश' : 'Featured Verified Messages'}
                      </Text>
                      <TouchableOpacity>
                        <Text style={styles.viewAllInline}>
                          {t('language') === 'hi' ? 'सभी देखें' : 'View All'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.mainContent}
      />

      {/* Bottom footer input bar is removed to keep layout clean and centered on top-header Create button */}

      {/* Full Screen Create Post Modal */}
      <CreatePostModal
        visible={showCreateModal}
        newMessage={newMessage}
        selectedImage={selectedImage}
        selectedMediaType={selectedMediaType}
        postCategory={postCategory}
        showInlineCategories={showInlineCategories}
        contactNumber={contactNumber}
        sevaDetails={sevaDetails}
        eventLocation={eventLocation}
        eventDate={eventDate}
        showDatePicker={showDatePicker}
        showTimePicker={showTimePicker}
        isKycVerified={isKycVerified}
        user={user}
        keyboardVisible={keyboardVisible}
        keyboardHeight={keyboardHeight}
        onClose={() => {
          resetCreatePostState();
        }}
        onMessageChange={setNewMessage}
        onPickImage={() => {
          if (!postCategory) {
            Alert.alert('', t('language') === 'hi' ? 'लिखना शुरू करने के लिए ऊपर एक श्रेणी चुनें...' : 'Select a category above to start writing...');
            return;
          }
          handlePickImage();
        }}
        onRemoveImage={() => {
          setSelectedImage(null);
          setSelectedMediaType(null);
        }}
        onPost={handlePostButtonPress}
        onInlineCategorySelect={(cat) => {
          handleInlineCategorySelect(cat);
          setShowInlineCategories(false);
        }}
        onShowInlineCategoriesToggle={() => setShowInlineCategories(!showInlineCategories)}
        onContactNumberChange={setContactNumber}
        onSevaDetailsChange={setSevaDetails}
        onEventLocationChange={setEventLocation}
        onEventDateChange={setEventDate}
        onOpenDatePicker={openEventDatePicker}
        onOpenTimePicker={openEventTimePicker}
        onShowDatePickerChange={setShowDatePicker}
        onShowTimePickerChange={setShowTimePicker}
        t={t}
        insets={insets}
        getTranslatedTab={getTranslatedTab}
        onClearCategory={() => setPostCategory('')}
        CommunityMediaItem={CommunityMediaItem}
      />

      <CategorySelectorModal
        visible={showCategorySelector}
        isKycVerified={isKycVerified}
        insets={insets}
        onClose={() => setShowCategorySelector(false)}
        onSelectCategory={(cat) => handleCategorySelectedAndPost(cat)}
      />

      <AnimatedFullScreenMediaViewer
        mediaUrl={fullScreenMedia}
        onClose={() => setFullScreenMedia(null)}
        CommunityMediaItem={CommunityMediaItem}
      />

      {/* Attendees Modal */}
      <AttendeesModal
        visible={!!showAttendeesModal}
        attendeesList={attendeesList}
        attendeesLoading={attendeesLoading}
        onClose={() => setShowAttendeesModal(null)}
      />

      {/* Group Info Modal */}
      <GroupInfoModal
        visible={showGroupInfoModal}
        community={community}
        user={user}
        memberCount={getCommunityMemberCount(community)}
        onClose={() => setShowGroupInfoModal(false)}
      />



      {/* Apple Guideline 1.2 - Report Community Post Modal */}
      <ReportModal
        visible={reportCommunityPostModalVisible}
        onClose={() => {
          setReportCommunityPostModalVisible(false);
          setPendingReportCommunityPost(null);
        }}
        reporterUid={user?.id || ''}
        reportedUserUid={pendingReportCommunityPost?.sender_id || pendingReportCommunityPost?.user_id || ''}
        contentId={String(pendingReportCommunityPost?.id || '')}
        contentType="community"
        apiFallback={async (reason) => {
          if (pendingReportCommunityPost?.id) {
            await reportContent({
              content_type: 'community',
              content_id: String(pendingReportCommunityPost.id),
              category: reason as any,
              description: `Reported community post for: ${reason}`
            });
          }
        }}
        onSuccess={() => {
          if (pendingReportCommunityPost?.id) {
            const targetId = pendingReportCommunityPost.id;
            setCommunityPosts(prev => prev.filter(post => post.id !== targetId));
            setDiscussionPosts(prev => prev.filter(post => post.id !== targetId));
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
          }}
          reporterUid={user?.id || ''}
          reportedUserUid={pendingReportComment?.userId || pendingReportComment?.user_id || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
          contentId={String(pendingReportComment?.id || '')}
          contentType="comment"
          postId={pendingReportComment?.post_id || showCommentModal?.id || ''}
          apiFallback={async (reason, description) => {
            if (pendingReportComment?.id) {
              await reportComment(String(pendingReportComment.id), reason, description || '');
            }
          }}
          onSuccess={() => {
            if (pendingReportComment?.id) {
              const targetId = pendingReportComment.id;
              setActiveComments(prev => prev.filter(comment => comment.id !== targetId));
            }
          }}
        />
      )}
      {blockConfirmData && (
        <BlockConfirmationModal
          visible={blockConfirmVisible}
          onClose={() => setBlockConfirmVisible(false)}
          onConfirm={blockConfirmData.onConfirm}
          username={blockConfirmData.username}
          isBlocked={blockConfirmData.isBlocked}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const FestivalEventCardItem = ({ item, handleOpenMap, handleFestivalInterest, activeVideoKey }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  const onReminderPress = () => {
    if (reminderSet) {
      setReminderSet(false);
    } else {
      handleFestivalInterest(item);
      setReminderSet(true);
    }
  };

  const displayTitle = item.title === item.description ? null : item.title;
  const displayDescription = item.description;
  const isLongDescription = displayDescription && displayDescription.length > 120;

  return (
    <View style={styles.festEventCard}>
      <View style={styles.festEventMain}>
        {item.image ? (
          <CommunityMediaItem
            media={item.image}
            style={styles.festEventImage}
            isActive={activeVideoKey === (item.id ? String(item.id) : '')}
          />
        ) : null}
        <View style={[styles.festEventInfo, !item.image && { marginLeft: 0 }]}>
          {!!displayTitle && (
            <Text style={[styles.festEventTitle, { fontWeight: 'normal', color: '#222' }]} numberOfLines={2}>
              {displayTitle}
            </Text>
          )}
          {!!displayDescription && (
            <View>
              <Text style={styles.festEventDesc} numberOfLines={isExpanded ? undefined : 4}>
                {displayDescription}
              </Text>
              {isLongDescription && (
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginTop: 4, marginBottom: 8, paddingVertical: 2 }}>
                  <Text style={{ color: '#FF6B00', fontSize: 12, fontWeight: '700' }}>
                    {isExpanded ? 'View Less' : 'View More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.festEventMeta}>
            {item.location ? (
              <TouchableOpacity 
                style={styles.festMetaRow}
                onPress={() => handleOpenMap(item.location)}
                disabled={item.location === 'Online' || item.location === 'Local'}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={14} color={item.location !== 'Online' && item.location !== 'Local' ? "#FF6B00" : "#FF3B30"} />
                <Text style={[styles.festMetaText, item.location !== 'Online' && item.location !== 'Local' && { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>{item.location}</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.festMetaRow}>
              <Ionicons name="time-outline" size={14} color="#FF3B30" />
              <Text style={styles.festMetaText} numberOfLines={1}>{item.time}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.festEventFooter}>
        <View style={styles.festOrgDetailsRow}>
          <Avatar name={item.organizer.name} size={32} photo={item.organizer.photo} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <View style={styles.festOrgNameRow}>
              <Text style={styles.festOrgName} numberOfLines={1}>{item.organizer.name}</Text>
              {item.organizer.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
            </View>
            <Text style={styles.festOrgLabel}>Organizer • {item.timeAgo}</Text>
          </View>
        </View>
        <View style={styles.festActionRow}>
          <TouchableOpacity 
            style={[styles.attendBtn, reminderSet && { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' }]} 
            onPress={onReminderPress}
          >
            <Text style={[styles.attendBtnText, reminderSet && { color: '#888' }]}>
              {reminderSet ? 'Reminder Set' : 'Set a reminder'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerGradientContainer: {
    width: '100%',
    paddingBottom: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    marginTop: 8,
    position: 'relative',
  },
  headerBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    maxWidth: '60%',
  },
  headerCreateBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerCreateBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  headerMembersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
  },
  headerTaglineText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  featuredBadgeContainer: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  featuredBadgeText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: 'bold',
  },
  twitterPostBtn: {
    backgroundColor: '#1D9BF0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twitterPostBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  recentRequestCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    elevation: 3,
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  recentRequestGradient: {
    padding: 16,
  },
  recentRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentRequestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentRequestSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6600',
    letterSpacing: 0.5,
  },
  recentRequestUrgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentRequestUrgencyText: {
    fontSize: 9,
    fontWeight: '800',
  },
  recentRequestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  recentRequestDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  recentRequestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentRequestLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  recentRequestLocText: {
    fontSize: 12,
    color: '#64748B',
  },
  recentRequestViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F25C05',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  recentRequestViewBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { backgroundColor: '#FFF' },
  headerBg: { width: '100%', height: 260 },
  headerOverlay: { flex: 1, paddingHorizontal: 20 },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBtn: { padding: 8 },
  notifBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  notifBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  communityInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  communityIconWrapper: { padding: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 18 },
  communityIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  infoTextWrapper: { marginLeft: 15 },
  communityTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111', fontWeight: '900' },
  communityStats: { fontSize: 13, color: '#444', marginTop: 4, fontWeight: '600' },

  tagline: { fontSize: 15, color: '#333', marginTop: 15, fontWeight: '600', lineHeight: 22 },

  floatingActions: { position: 'absolute', right: 20, bottom: 40, gap: 12 },
  fabBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  fabBtnMore: { backgroundColor: 'rgba(61,40,29,0.9)' },

  tabsContainer: { marginTop: 20 },
  tabsContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10, alignItems: 'center' },
  pillTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pillTabActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'Inter_600SemiBold',
  },
  pillTabTextActive: {
    color: '#FFFFFF',
  },
  pillIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillIconWrapActive: {
    backgroundColor: '#FFFFFF',
  },
  goingText: { marginLeft: 6, fontSize: 13, color: '#888', fontFamily: FONTS.regular },
  timeAgoText: { fontSize: 11, color: '#AAA', fontFamily: FONTS.regular },
  tabText: { fontSize: 15, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#FF6B00', fontWeight: '700' },

  mainContent: { paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#111', fontWeight: '700' },
  viewAll: { fontSize: 13, color: '#FF3B30', fontWeight: '700' },

  eventsList: { paddingLeft: 20, paddingRight: 10 },
  eventCard: { width: SCREEN_WIDTH * 0.8, backgroundColor: 'transparent', borderRadius: 0, padding: 16, marginRight: 15, borderWidth: 0, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  eventInfoRow: { flexDirection: 'row', alignItems: 'center' },
  eventDateCol: { alignItems: 'center', marginRight: 15 },
  eventDate: { fontSize: 24, fontWeight: '900', color: '#FF3B30' },
  eventMonth: { fontSize: 12, fontWeight: '700', color: '#444' },
  eventTextCol: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#111', lineHeight: 20 },
  eventMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  goingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },

  goingText2: { fontSize: 12, color: '#888' },
  eventImage: { width: 60, height: 100, borderRadius: 12 },

  eventActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  actionIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  interestedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interestedText: { fontSize: 13, color: '#FF3B30', fontWeight: '700' },

  verifiedMessagesBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedMessagesText: { fontSize: 12, color: '#444', fontWeight: '600' },
  viewAllInline: { fontSize: 12, color: '#FF3B30', fontWeight: '700', marginLeft: 8 },

  discussionCard: { backgroundColor: 'transparent', marginHorizontal: 20, borderRadius: 0, padding: 16, marginBottom: 15, borderWidth: 0, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  postHeader: { flexDirection: 'row', alignItems: 'center' },
  postUserMeta: { flex: 1, marginLeft: 12 },
  postNameRow: { flexDirection: 'row', alignItems: 'center' },
  discussionUserName: { fontSize: 16, fontWeight: '700', color: '#111' },
  postSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  discussionTimestamp: { fontSize: 12, color: '#888' },
  postLabel: { fontSize: 12, color: '#444', fontWeight: '600' },

  postBody: { marginTop: 15, paddingHorizontal: 8 },
  quoteIcon: { marginBottom: -10, opacity: 0.8 },
  postContent: { fontSize: 15, color: '#333', lineHeight: 24, fontWeight: '500' },

  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  postActionText: { fontSize: 13, color: '#666', fontWeight: '600' },

  footer: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 28, paddingHorizontal: 12, paddingVertical: 8 },
  input: { flex: 1, marginHorizontal: 12, fontSize: 14, color: '#111' },
  footerIcon: { padding: 6 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  stickyTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButtonContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  headerCommunityInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 4, gap: 8, flex: 1 },
  headerCommunityName: { fontSize: 16, fontWeight: '700', color: '#000', flex: 1 },
  headerCommunityIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },

  requestInterestedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  urgencyLabel: { fontSize: 11, fontWeight: '700', color: '#888', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  urgencyLabelText: { fontSize: 11, fontWeight: '700', color: '#888' },
  requestIconCol: { marginRight: 15 },
  requestIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  helpBtn: { backgroundColor: '#F25C05', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  helpBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  sevaInfoCard: { backgroundColor: 'rgba(255, 247, 237, 0.5)', borderRadius: 12, padding: 10, marginTop: 8, borderWidth: 1, borderColor: 'rgba(253, 227, 206, 0.6)' },
  sevaInfoLabel: { fontSize: 12, fontWeight: '800', color: '#C55D00', marginBottom: 6, textTransform: 'uppercase' },
  sevaInfoText: { fontSize: 14, lineHeight: 20, color: '#4D2F00' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  commentModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '70%', padding: 20 },
  commentModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  commentModalTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  commentsList: { flex: 1 },
  commentItem: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  commentTextBubble: { flex: 1, backgroundColor: '#F8F9FA', padding: 12, borderRadius: 16 },
  commentUserName: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#444', lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  commentInput: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, minHeight: 38, maxHeight: 100 },
  postCommentBtn: { color: '#FF3B30', fontWeight: '800', fontSize: 14 },

  postContainer: { backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#EFF3F4', paddingHorizontal: 12, paddingVertical: 10 },
  repostHeaderLabel: { flexDirection: 'row', alignItems: 'center', marginLeft: 34, marginBottom: 4, gap: 4 },
  repostHeaderText: { fontSize: 12, color: '#536471', fontWeight: '700' },
  postMainRow: { flexDirection: 'row' },
  postLeftCol: { marginRight: 10 },
  postRightCol: { flex: 1, overflow: 'hidden' },
  postHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postNameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  feedPostUserName: { fontSize: 15, fontWeight: '700', color: '#0F1419', maxWidth: '65%' },
  postHandle: { fontSize: 14, color: '#536471', marginLeft: 4, flexShrink: 1 },
  postDot: { fontSize: 14, color: '#536471', marginHorizontal: 2 },
  postContentText: { fontSize: 15, color: '#0F1419', lineHeight: 20, marginTop: 2, letterSpacing: -0.1 },
  postMediaImage: { width: '100%', maxWidth: '100%', height: 230, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: '#EFF3F4', overflow: 'hidden' },
  postImageContainer: { marginTop: 10, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EFF3F4' },
  postImage: { width: '100%', maxWidth: '100%', height: 220, borderRadius: 16 },
  postActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingRight: 32, maxWidth: '90%' },
  postActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingRight: 32, maxWidth: '90%' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 4, minHeight: 28 },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 4, minHeight: 28 },
  actionCountText: { fontSize: 12, color: '#536471', fontWeight: '500' },
  postActionCount: { fontSize: 12, color: '#536471', fontWeight: '500' },

  imagePreviewContainer: { marginBottom: 12, position: 'relative', alignSelf: 'flex-start' },
  imagePreview: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 12 },

  filterDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', gap: 6 },
  filterText: { fontSize: 13, color: '#444', fontWeight: '600' },

  festivalTypeCard: { 
    width: 124, 
    paddingHorizontal: 8,
    paddingVertical: 14, 
    borderRadius: 24, 
    marginRight: 14, 
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)'
  },
  festivalIconCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  festivalTypeName: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#1A1A1A', 
    marginBottom: 8, 
    textAlign: 'center',
    letterSpacing: 0.2
  },
  festivalEventCount: { 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '100%'
  },
  festivalEventCountNum: { fontSize: 18, fontWeight: '900', color: '#111' },
  festivalEventCountText: { fontSize: 11, fontWeight: '700', color: '#FF6B00', textAlign: 'center' },

  requestOwnerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  requestOwnerMeta: { flex: 1, marginLeft: 12 },
  requestOwnerName: { fontSize: 15, fontWeight: '700', color: '#111' },
  requestOwnerSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  requestOwnerTime: { fontSize: 12, color: '#64748B' },
  festEventCard: { 
    marginHorizontal: 16, 
    backgroundColor: 'transparent', 
    borderRadius: 0, 
    padding: 12, 
    marginBottom: 12, 
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  festEventMain: { flexDirection: 'row', marginBottom: 8 },
  festEventImage: { width: 72, height: 72, borderRadius: 12 },
  festEventInfo: { flex: 1, marginLeft: 12 },
  festEventTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4, lineHeight: 20 },
  festEventDesc: { fontSize: 12, color: '#555', lineHeight: 16, marginBottom: 6 },
  festEventMeta: { gap: 4 },
  festMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  festMetaText: { fontSize: 11, color: '#444', fontWeight: '600', flexShrink: 1 },
  
  festEventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  festOrgDetailsRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  festOrgNameRow: { flexDirection: 'row', alignItems: 'center' },
  festOrgName: { fontSize: 14, fontWeight: '700', color: '#111' },
  festOrgLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  festActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attendBtn: { backgroundColor: '#FFF5F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FFEBE0' },
  attendBtnText: { color: '#FF6B00', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  festMiniBtn: { padding: 4 },

  festBanner: { 
    marginHorizontal: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginTop: 15, 
    marginBottom: 30, 
    borderWidth: 1, 
    borderColor: '#FFEBE0',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8 
  },
  festBannerLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  festBannerTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  festBannerSub: { fontSize: 12, color: '#666', marginTop: 2 },
  createFestBtn: { backgroundColor: '#FF6B00', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  createFestBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  createModalRoot: { flex: 1, backgroundColor: '#FFF' },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  createModalTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  postBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '800' },
  createModalContent: { flex: 1, padding: 20 },
  createPostUserInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  createPostUserMeta: { marginLeft: 12 },
  createPostUserName: { fontSize: 16, fontWeight: '800', color: '#111' },
  createPostUserLoc: { fontSize: 13, color: '#888', marginTop: 2 },
  createPostInput: { fontSize: 20, color: '#111', minHeight: 120, textAlignVertical: 'top' },
  charCount: { alignSelf: 'flex-end', color: '#888', fontSize: 12, marginTop: 10 },
  createDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 25 },
  createSection: { marginBottom: 25 },
  createSectionTitle: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 12 },
  categoryPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FFEBE0', borderRadius: 16, padding: 12, backgroundColor: '#FFF' },
  catIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  catText: { fontSize: 16, fontWeight: '700', color: '#111' },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0F7FF', padding: 15, borderRadius: 12, marginBottom: 25, gap: 10 },
  infoBoxText: { flex: 1, fontSize: 13, color: '#007AFF', lineHeight: 20 },
  phoneInputContainer: { flexDirection: 'row', height: 56, borderWidth: 1, borderColor: '#EEE', borderRadius: 16 },
  phonePrefix: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: '#EEE', gap: 6 },
  flagIcon: { width: 24, height: 16, borderRadius: 2 },
  prefixText: { fontSize: 15, fontWeight: '600', color: '#111' },
  phoneInput: { flex: 1, paddingHorizontal: 15, fontSize: 15, color: '#111' },
  phoneSub: { fontSize: 12, color: '#888', marginTop: 10, lineHeight: 18 },
  mediaActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 20 },
  mediaActionBtn: { alignItems: 'center', gap: 6 },
  mediaActionLabel: { fontSize: 11, color: '#444', fontWeight: '600' },
  trustBox: { flexDirection: 'row', backgroundColor: '#FFF5F0', padding: 20, borderRadius: 20, marginBottom: 50, alignItems: 'center' },
  trustIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  trustTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  trustSub: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 18 },

  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8F9FA', marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  categoryChipActive: { backgroundColor: '#FFF5F0', borderColor: '#FF3B30' },
  categoryChipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  categoryChipTextActive: { color: '#FF3B30', fontWeight: '700' },

  createPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, gap: 4, shadowColor: '#FF6B00', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  createPillText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  sevaPremiumCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, marginBottom: 15, elevation: 4, shadowColor: '#FF6B00', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, borderWidth: 1, borderColor: '#FFF0E6', overflow: 'hidden' },
  sevaPremiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FA', backgroundColor: '#FFFAF7' },
  sevaPremiumUserRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sevaPremiumUserInfo: { marginLeft: 12, flex: 1 },
  sevaPremiumNameRow: { flexDirection: 'row', alignItems: 'center' },
  sevaPremiumUserName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  sevaPremiumTime: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  sevaPremiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B00', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  sevaPremiumBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  sevaPremiumContent: { padding: 16 },
  sevaPremiumText: { fontSize: 15, color: '#334155', lineHeight: 24, marginBottom: 12 },
  sevaPremiumImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12 },
  sevaPremiumDetailsBox: { flexDirection: 'row', backgroundColor: '#FFF7ED', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5', marginBottom: 10, alignItems: 'center' },
  sevaDetailIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' },
  sevaDetailLabel: { fontSize: 12, fontWeight: '700', color: '#C2410C', textTransform: 'uppercase', letterSpacing: 0.5 },
  sevaDetailText: { fontSize: 14, color: '#9A3412', marginTop: 2, fontWeight: '500' },
  sevaPremiumContactBox: { flexDirection: 'row', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D1FAE5', marginBottom: 10, alignItems: 'center' },
  sevaContactIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  sevaContactLabel: { fontSize: 12, fontWeight: '700', color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5 },
  sevaContactText: { fontSize: 14, color: '#065F46', marginTop: 2, fontWeight: '600' },
  sevaPremiumFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 0 },
  sevaPrimaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  sevaPrimaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  sevaActionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sevaActionBtn: { padding: 8, backgroundColor: '#F8F9FA', borderRadius: 12 },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBE0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFC8B0',
    gap: 4,
  },
  selectedCategoryText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '700',
  },
  inlineCategoriesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inlineCategoriesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8899A6',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inlineCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
  },
  inlineCategoryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15181C',
  },
  inlineCategoryDesc: {
    fontSize: 11,
    color: '#8899A6',
    marginTop: 1,
  },
  attendPromptContainer: {
    backgroundColor: '#F8FAF5',
    padding: 12,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendPromptText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: FONTS.medium,
    flex: 1,
    marginRight: 8,
  },
  attendPromptButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  attendYesBtn: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  attendYesBtnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  attendNoBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  attendNoBtnActive: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  attendPromptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  attendPromptBtnTextActive: {
    color: '#FFF',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dropdownSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  dropdownSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  dropdownSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  dropdownCloseBtn: {
    padding: 4,
  },
  dropdownSheetList: {
    paddingBottom: 16,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#0D9488',
    fontWeight: '700',
  },
  twitterDropdownMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFF3F4',
    width: 150,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    paddingVertical: 4,
    zIndex: 9999,
  },
  twitterDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F9F9',
  },
  twitterDropdownText: {
    fontSize: 14,
    color: '#0F1419',
    fontWeight: '600',
  },
  inlineDropdownMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 170,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 9999,
    overflow: 'hidden',
  },
  inlineDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  inlineDropdownItemActive: {
    backgroundColor: '#FFF5EE',
  },
  inlineDropdownText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  inlineDropdownTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
});
