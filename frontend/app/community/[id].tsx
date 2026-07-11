import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../../src/utils/dateUtils';
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
  UIManager} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { getCommunity, getCommunityMessages, sendCommunityMessage, deleteCommunityMessage, resolveCommunityRequest, deleteCommunityRequest, sendDirectMessage, getUserProfile, parseApiError, getKYCStatus, toggleRequestInterest, getUsersBatch, reportContent, reportComment } from '../../src/services/api';
import { scheduleEventReminderNotification } from '../../src/services/pushNotifications';
import { originalAlert } from '../../src/utils/nativeAlert';
import { useTranslation } from '../../src/utils/i18n';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useVendorStore } from '../../src/store/vendorStore';
import { COLORS, FONTS } from '../../src/constants/theme';

import { Avatar } from '../../src/components/Avatar';
import { MentionInput } from '../../src/components/MentionInput';
import { ToastContainer } from '../../src/components/ToastContainer';
import { ReportModal } from '../../src/components/ReportModal';
import { blockUser, unblockUser } from '../../src/services/firebase/moderationService';
import { useBlockStore } from '../../src/store/blockStore';
import { BlockConfirmationModal } from '../../src/components/BlockConfirmationModal';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  sl_id: string;
  photo?: string;
}

// Persists across navigation (module-level cache) — survives tab switches but NOT full reloads
const localPostCategories = new Map<string, string>();
// module-level cache for iOS to track posts created in this session
const iosUserCreatedPostIds = new Set<string>();


// Persists across full reloads via localStorage (web) / AsyncStorage (native)
const POST_CACHE_KEY = 'brahmand_local_posts';
let isCategoriesLoaded = false;
let categoryLoadingPromise: Promise<void> | null = null;

function ensureCategoriesLoaded(): Promise<void> {
  if (isCategoriesLoaded) return Promise.resolve();
  if (categoryLoadingPromise) return categoryLoadingPromise;

  if (Platform.OS === 'web') {
    isCategoriesLoaded = true;
    return Promise.resolve();
  }

  categoryLoadingPromise = new Promise((resolve) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem(POST_CACHE_KEY).then((raw: string | null) => {
        if (raw) {
          const map: Record<string, string> = JSON.parse(raw);
          Object.entries(map).forEach(([content, category]) => {
            localPostCategories.set(content.trim(), category);
          });
        }
        isCategoriesLoaded = true;
        resolve();
      }).catch((err: any) => {
        console.warn('[CommunityScreen] Failed to load local categories:', err);
        isCategoriesLoaded = true;
        resolve();
      });
    } catch (e) {
      console.warn('[CommunityScreen] AsyncStorage error:', e);
      isCategoriesLoaded = true;
      resolve();
    }
  });

  return categoryLoadingPromise;
}

function saveLocalPost(content: string, category: string) {
  const key = content.trim();
  localPostCategories.set(key, category);
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(POST_CACHE_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[key] = category;
      localStorage.setItem(POST_CACHE_KEY, JSON.stringify(map));
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem(POST_CACHE_KEY).then((raw: string | null) => {
        const map: Record<string, string> = raw ? JSON.parse(raw) : {};
        map[key] = category;
        AsyncStorage.setItem(POST_CACHE_KEY, JSON.stringify(map));
      }).catch((e: any) => console.warn('[saveLocalPost] AsyncStorage error:', e));
    }
  } catch { }
}

function getLocalCategory(content: string): string | undefined {
  if (!content) return undefined;
  const key = content.trim();
  const fromMap = localPostCategories.get(key);
  if (fromMap) return fromMap;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(POST_CACHE_KEY);
      if (raw) {
        const map: Record<string, string> = JSON.parse(raw);
        return map[key];
      }
    }
  } catch { }
  return undefined;
}

import Svg, { Circle } from 'react-native-svg';

const CharacterProgressCircle = ({ textLength }: { textLength: number }) => {
  const size = 30;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const limit = 250;

  const currentTextLength = textLength > 0 && textLength % limit === 0 ? limit : textLength % limit;
  const threadCount = Math.floor(textLength / limit) + (textLength % limit > 0 ? 1 : 0);

  const percentage = Math.min((currentTextLength / limit) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const remaining = limit - currentTextLength;
  let strokeColor = '#1D9BF0'; // Twitter blue
  if (remaining <= 0) {
    strokeColor = '#F4212E'; // Red
  } else if (remaining <= 20) {
    strokeColor = '#F5B800'; // Yellow
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {threadCount > 1 && (
        <View style={{ backgroundColor: '#EFF3F4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, color: '#536471', fontWeight: 'bold' }}>{threadCount} posts</Text>
        </View>
      )}
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EFF3F4"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={remaining < 0 ? strokeWidth + 0.5 : strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {remaining <= 20 && (
          <Text style={{
            position: 'absolute',
            fontSize: remaining <= 0 ? 10 : 11,
            fontWeight: 'bold',
            color: remaining <= 0 ? '#F4212E' : '#536471'
          }}>
            {remaining}
          </Text>
        )}
      </View>
    </View>
  );
};

function splitTextIntoTweets(text: string, limit = 250): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length <= limit) {
      currentChunk = (currentChunk + ' ' + word).trim();
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

const COMMUNITY_TABS = ['Feed', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];
const POST_CATEGORIES = ['Others', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

// Festival image map — mirrors the one in festivals.tsx
const FESTIVAL_IMAGE_MAP: Record<string, any> = {
  'Akshaya Tritiya': require('../../assets/images/festival_image/Akshaya Tritiya.jpg'),
  'Anant Chaturdashi': require('../../assets/images/festival_image/Anant Chaturdashi.jpg'),
  'Ashadhi Ekadashi': require('../../assets/images/festival_image/Ashadhi Ekadashi_.jpg'),
  'Bhai Dooj': require('../../assets/images/festival_image/Bhai Dooj.jpg'),
  'Bohag Bihu': require('../../assets/images/festival_image/Bohag Bihu .jpg'),
  'Chaitra Sukhladi': require('../../assets/images/festival_image/Chaitra Sukhladi .jpg'),
  'Chhath Puja': require('../../assets/images/festival_image/Chhath Puja.jpg'),
  'Dhanteras': require('../../assets/images/festival_image/Dhanteras.jpg'),
  'Dhanu Sankranti': require('../../assets/images/festival_image/Dhanu Sankranti.jpeg'),
  'Diwali': require('../../assets/images/festival_image/Diwali .jpeg'),
  'Durga Ashtami': require('../../assets/images/festival_image/Durga Ashtami.jpeg'),
  'Dussehra': require('../../assets/images/festival_image/Dussehra.jpg'),
  'Ganesh Chaturthi': require('../../assets/images/festival_image/Ganesh Chaturthi.jpeg'),
  'Geeta Jayanti': require('../../assets/images/festival_image/Geeta Jayanti.jpg'),
  'Govardhan Puja': require('../../assets/images/festival_image/Govardhan Puja.jpg'),
  'Guru Purnima': require('../../assets/images/festival_image/Guru Purnima.jpg'),
  'Hanuman janmotsav': require('../../assets/images/festival_image/Hanuman janmotsav.jpg'),
  'Holi': require('../../assets/images/festival_image/Happy Holi.jpg'),
  'Hariyali Teej': require('../../assets/images/festival_image/Hariyali Teej.jpeg'),
  'Hindi New Year': require('../../assets/images/festival_image/Hindi New Year.jpg'),
  'Holika Dahan': require('../../assets/images/festival_image/Holika Dahan.jpg'),
  'Jagannath Rath Yatra': require('../../assets/images/festival_image/Jagannath Rath Yatra.jpg'),
  'Janmashtami': require('../../assets/images/festival_image/Janmashtami.jpg'),
  'Kajari Teej': require('../../assets/images/festival_image/Kajari Teej.jpeg'),
  'Kartik Purnima': require('../../assets/images/festival_image/Kartik Purnima.jpeg'),
  'Karva Chauth': require('../../assets/images/festival_image/Karva Chauth.jpg'),
  'Magh Bihu': require('../../assets/images/festival_image/Magh Bihu.jpg'),
  'Maha Navami': require('../../assets/images/festival_image/Maha Navami.jpeg'),
  'Maha Saptami': require('../../assets/images/festival_image/Maha Saptami.jpg'),
  'Maha Shivaratri': require('../../assets/images/festival_image/Maha Shivaratri.jpeg'),
  'Mahalaya Amavasya': require('../../assets/images/festival_image/Mahalaya Amavasya.jpg'),
  'Maharishi Valmiki Jayanti': require('../../assets/images/festival_image/Maharishi Valmiki Jayanti.jpg'),
  'Makar Sankranti': require('../../assets/images/festival_image/Makar Sankranti .jpg.webp.jpeg'),
  'Nag Panchami': require('../../assets/images/festival_image/Nag Panchami.jpg'),
  'Navratri': require('../../assets/images/festival_image/Sharad Navratri.jpg'),
  'Onam': require('../../assets/images/festival_image/Onam.jpg'),
  'Raksha Bandhan': require('../../assets/images/festival_image/Raksha Bandhan.jpg'),
  'Ram Navami': require('../../assets/images/festival_image/Ram Navami.jpg'),
  'Savitri Pooja': require('../../assets/images/festival_image/Savitri Pooja_.jpg'),
  'Sharad Navratri': require('../../assets/images/festival_image/Sharad Navratri.jpg'),
  'Sharad Purnima': require('../../assets/images/festival_image/Sharad Purnima.jpg'),
  'Thaipusam': require('../../assets/images/festival_image/Thaipusam.jpg'),
  'Vaisakhi': require('../../assets/images/festival_image/Vaisakhi.jpg'),
  'Vasant Panchami': require('../../assets/images/festival_image/Vasant Panchami.jpg'),
  'Vishwakarma Puja': require('../../assets/images/festival_image/Vishwakarma Puja.jpeg'),
};

const getCommunityFestivalImage = (name: string) => {
  if (!name) return null;
  if (FESTIVAL_IMAGE_MAP[name]) return FESTIVAL_IMAGE_MAP[name];
  const key = Object.keys(FESTIVAL_IMAGE_MAP).find(k => name.includes(k) || k.includes(name));
  return key ? FESTIVAL_IMAGE_MAP[key] : null;
};

const getCommunityMemberCount = (community?: any) => {
  if (!community) return 0;
  if (Array.isArray(community.members)) return community.members.length;
  if (Array.isArray(community.members_details)) return community.members_details.length;
  if (typeof community.members_count === 'number') return community.members_count;
  if (typeof community.member_count === 'number') return community.member_count;
  return 0;
};

const MOCK_FESTIVALS = [
  { id: '1', name: 'Diwali', events: 12, color: '#FFF5F0', date: '2026-11-01' },
  { id: '2', name: 'Navratri', events: 18, color: '#FFF9EB', date: '2026-10-12' },
  { id: '3', name: 'Janmashtami', events: 10, color: '#F0F9FF', date: '2026-09-04' },
  { id: '4', name: 'Ganesh Chaturthi', events: 8, color: '#FFF0F5', date: '2026-09-15' },
  { id: '5', name: 'Makar Sankranti', events: 6, color: '#F0FFF4', date: '2026-01-14' },
  { id: '6', name: 'Holi', events: 15, color: '#FFF0FA', date: '2026-03-23' },
  { id: '7', name: 'Dussehra', events: 9, color: '#FFFBEB', date: '2026-10-22' },
  { id: '8', name: 'Maha Shivaratri', events: 11, color: '#F5F0FF', date: '2026-02-15' },
  { id: '9', name: 'Ram Navami', events: 7, color: '#FFF0F0', date: '2026-04-16' },
  { id: '10', name: 'Raksha Bandhan', events: 5, color: '#F0FFF5', date: '2026-08-28' },
];

const MOCK_FESTIVAL_EVENTS = [
  {
    id: 'fe1',
    title: 'Diwali Celebration 2024',
    description: 'Join us for a grand Diwali celebration with prayers, lights & community dinner.',
    location: 'Ramakrishna Math, Andheri West',
    time: '31 Oct 2024, 6:00 PM',
    image: require('../../assets/images/festival_image/Diwali .jpeg'),
    organizer: { name: 'Rahul Joshi', photo: null, isVerified: true },
    timeAgo: '2h ago'
  },
  {
    id: 'fe2',
    title: 'Ganesh Chaturthi Aarti',
    description: 'Community aarti and prasad distribution for all devotees.',
    location: 'Lokhandwala, Andheri West',
    time: '7 Sep 2024, 7:00 PM',
    image: require('../../assets/images/festival_image/Ganesh Chaturthi.jpeg'),
    organizer: { name: 'Neha Sharma', photo: null, isVerified: true },
    timeAgo: '5h ago'
  },
  {
    id: 'fe3',
    title: 'Navratri Garba Night',
    description: 'Nine nights of celebration, dance and divine energy.',
    location: 'NSCI Dome, Worli',
    time: '3 Oct 2024, 8:00 PM',
    image: require('../../assets/images/festival_image/Sharad Navratri.jpg'),
    organizer: { name: 'Amit Patel', photo: null, isVerified: true },
    timeAgo: '1d ago'
  }
];

interface DiscussionPost {
  id: string;
  threadParentId?: string;
  user: {
    name: string;
    photo?: any;
    isVerified: boolean;
    verificationLabel: string;
    handle?: string;
    isFeatured?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  liked?: boolean;
  isRepost?: boolean;
  repostedBy?: string;
  image?: string;
  hideBadge?: boolean;
  sender_id?: string;
  sevaDetails?: string;
  isStateAnnouncement?: boolean;
  isNationalAnnouncement?: boolean;
  isCommunityMsg?: boolean;
  communityId?: string;
  subgroupType?: string;
}

const MOCK_DISCUSSION: DiscussionPost[] = [
  {
    id: 'd1',
    user: {
      name: 'Sadhvi Ritambhara',
      photo: require('../../assets/images/avatar_sadhvi.jpg'),
      isVerified: true,
      verificationLabel: 'Maharashtra Verified',
      handle: '@sadhviritambharaji',
      isFeatured: true,
    },
    content: "This Sunday, join the statewide Hanuman Chalisa Path across Maharashtra. Let's come together for Dharma, Devotion & Desh.",
    timestamp: '2h ago',
    likes: 128,
    comments: 24,
    reposts: 16,
    shares: 0,
    liked: false,
    image: require('../../assets/images/hanuman_gathering.jpg'),
  },
  {
    id: 'd2',
    user: {
      name: 'Swami Avimukta',
      photo: require('../../assets/images/avatar_swami.jpg'),
      isVerified: true,
      verificationLabel: 'Bharat Verified',
      handle: '@swamiavimukt',
    },
    content: "Dharma is not just prayer, it's action. Join our community service initiative this weekend to help those in need.",
    timestamp: '4h ago',
    likes: 89,
    comments: 18,
    reposts: 12,
    shares: 0,
    liked: false,
  },
  {
    id: 'd3',
    user: {
      name: 'Dr. Chinmay Pandya',
      photo: require('../../assets/images/avatar_drchinmay.jpg'),
      isVerified: true,
      verificationLabel: 'Maharashtra Verified',
      handle: '@drchinmaypandya',
    },
    content: "Youth are the strength of our Bharat. Join the movement. Build values, build the future.",
    timestamp: '6h ago',
    likes: 89,
    comments: 18,
    reposts: 12,
    shares: 0,
    liked: false,
  }
];

import { useGlobalMute } from '../../src/contexts/MuteContext';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {}

const CommunityNativeVideoPlayer = React.memo(({
  mediaUrl,
  isMuted,
  style,
  onPress,
  shouldPlay,
  toggleMute,
}: {
  mediaUrl: string;
  isMuted: boolean;
  style: any;
  onPress?: () => void;
  shouldPlay: boolean;
  toggleMute: () => void;
}) => {
  const player = ExpoVideoModule?.useVideoPlayer ? ExpoVideoModule.useVideoPlayer(mediaUrl, (p: any) => {
    if (p) {
      p.loop = true;
      p.muted = isMuted;
    }
  }) : null;

  useEffect(() => {
    if (player) {
      try {
        player.muted = isMuted;
      } catch (e) {}
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (player) {
      try {
        if (shouldPlay) {
          player.play();
        } else {
          player.pause();
        }
      } catch (e) {}
    }
  }, [shouldPlay, player]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  if (!ExpoVideoModule?.VideoView || !player) {
    return <View style={[style, { backgroundColor: '#000' }]} />;
  }

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};

  return (
    <Wrapper {...wrapperProps} style={[StyleSheet.flatten(style), { position: 'relative', overflow: 'hidden', backgroundColor: '#000' }]}>
      <ExpoVideoModule.VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls={false}
      />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onPress={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-medium'}
          size={18}
          color="#FFF"
        />
      </TouchableOpacity>
    </Wrapper>
  );
});
CommunityNativeVideoPlayer.displayName = 'CommunityNativeVideoPlayer';

const CommunityMediaItem = ({ media, style, onPress, isActive = true }: { media: string | any, style: any, onPress?: () => void, isActive?: boolean }) => {
  const mediaUrl = typeof media === 'string' ? media : (media?.uri || '');
  const isVideo = (
    (typeof media === 'object' && media !== null && (
      String(media.type || media.media_type || media.mediaType || '').toLowerCase().startsWith('video')
    )) || (
      typeof mediaUrl === 'string' && (
        /\.(mp4|mov|m4v|webm|mkv|3gp|avi)(\?|$)/i.test(mediaUrl) ||
        mediaUrl.toLowerCase().startsWith('video') || 
        mediaUrl.toLowerCase().includes('/video/') || 
        mediaUrl.toLowerCase().includes('_video_') ||
        ((mediaUrl.toLowerCase().includes('expopicker') || mediaUrl.toLowerCase().includes('imagepicker')) && 
         !/\.(jpg|jpeg|png|gif|heic|webp|bmp|tiff|avif)(\?|$)/i.test(mediaUrl))
      )
    )
  );
  const { isGloballyMuted: isMuted, toggleMute } = useGlobalMute();
  const isFocused = useIsFocused();
  const shouldPlay = isFocused && isActive;

  if (isVideo) {
    if (shouldPlay) {
      return (
        <CommunityNativeVideoPlayer
          mediaUrl={mediaUrl}
          isMuted={isMuted}
          style={style}
          onPress={onPress}
          shouldPlay={shouldPlay}
          toggleMute={toggleMute}
        />
      );
    } else {
      const Wrapper = onPress ? TouchableOpacity : View;
      const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};
      return (
        <Wrapper {...wrapperProps} style={[StyleSheet.flatten(style), { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.6)" />
        </Wrapper>
      );
    }
  }

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Image
        source={typeof media === 'string' ? { uri: media } : media}
        style={style}
        resizeMode="cover"
      />
    </Wrapper>
  );
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CommunityDetailScreen() {
  const { id, postId } = useLocalSearchParams<{ id: string, postId?: string }>();
  const router = useRouter();
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

  const [community, setCommunity] = useState<any>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.community || null;
  });
  const [activeTab, setActiveTab] = useState('Feed');
  const [requests, setRequests] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.requests || [];
  });
  const [events, setEvents] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.events || [];
  });
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>([]);

  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const isVideoItem = (item: any) => {
      if (!item) return false;
      const url = item.image || item.image_url || item.media_url || '';
      const mediaUrl = typeof url === 'string' ? url : (url?.uri || '');
      return (
        (typeof url === 'object' && url !== null && (
          String(url.type || url.media_type || url.mediaType || '').toLowerCase().startsWith('video')
        )) || (
          typeof mediaUrl === 'string' && (
            /\.(mp4|mov|m4v|webm|mkv|3gp|avi)(\?|$)/i.test(mediaUrl) ||
            mediaUrl.toLowerCase().startsWith('video') || 
            mediaUrl.toLowerCase().includes('/video/') || 
            mediaUrl.toLowerCase().includes('_video_') ||
            ((mediaUrl.toLowerCase().includes('expopicker') || mediaUrl.toLowerCase().includes('imagepicker')) && 
             !/\.(jpg|jpeg|png|gif|heic|webp|bmp|tiff|avif)(\?|$)/i.test(mediaUrl))
          )
        )
      );
    };

    const firstVideoItem = viewableItems.find((vi: any) => isVideoItem(vi.item));
    if (firstVideoItem) {
      setActiveVideoKey(String(firstVideoItem.key));
    } else {
      setActiveVideoKey(null);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // interest state: requestId -> { count, userInterested }
  const [interestMap, setInterestMap] = useState<Record<string, { count: number; userInterested: boolean }>>({});

  const handleToggleInterest = async (item: any) => {
    const id = item.id;
    if (!id || String(id).startsWith('dummy')) return;
    const prev = interestMap[id] ?? { count: item.interested_count || 0, userInterested: (item.interested_by || []).includes(user?.id) };
    const next = { count: prev.userInterested ? prev.count - 1 : prev.count + 1, userInterested: !prev.userInterested };
    setInterestMap(m => ({ ...m, [id]: next }));
    try {
      await toggleRequestInterest(id);
    } catch {
      setInterestMap(m => ({ ...m, [id]: prev }));
    }
  };

  const [communityPosts, setCommunityPosts] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.communityPosts || [];
  });
  const [allFestivals, setAllFestivals] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.allFestivals || [];
  });
  const [loading, setLoading] = useState(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return !cachedData;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [rsvpStates, setRsvpStates] = useState<Record<string, 'yes' | 'no'>>({});
  useEffect(() => {
    // ⚡ Android: Increase polling interval to 60s to reduce unnecessary re-renders on Android
    const pollInterval = Platform.OS === 'android' ? 60000 : 15000;
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, pollInterval);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ensureCategoriesLoaded();
    }
  }, []);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopCategoryDropdown, setShowTopCategoryDropdown] = useState(false);
  const [showBodyCategoryDropdown, setShowBodyCategoryDropdown] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [postCategory, setPostCategory] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [sevaDetails, setSevaDetails] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null);
  const [festivalSort, setFestivalSort] = useState<'latest' | 'oldest'>('latest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [showInlineCategories, setShowInlineCategories] = useState(false);

  const isKycVerified =
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified';

  const [showCommentModal, setShowCommentModal] = useState<DiscussionPost | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeComments, setActiveComments] = useState<any[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState<any | null>(null);
  const [attendeesList, setAttendeesList] = useState<User[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  // Apple Guideline 1.2 - community post report state
  const [reportCommunityPostModalVisible, setReportCommunityPostModalVisible] = useState(false);
  const [pendingReportCommunityPost, setPendingReportCommunityPost] = useState<any | null>(null);
  // Apple Guideline 1.2 - community comment report state
  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
  const [pendingReportComment, setPendingReportComment] = useState<any | null>(null);
  const [keptComments, setKeptComments] = useState<any[]>([]);
  const [commentModalToRestore, setCommentModalToRestore] = useState<any | null>(null);

  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockConfirmData, setBlockConfirmData] = useState<{
    targetUserId: string;
    username: string;
    isBlocked: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Global block store — shared across all screens
  const blockedUserIds = useBlockStore(state => state.blockedUserIds);
  const blockedByMeUserIds = useBlockStore(state => state.blockedByMeUserIds);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);

  const handleToggleBlockUser = useCallback(async (targetUid: string, targetName: string) => {
    if (!user?.id) return;
    const isCurrentlyBlocked = blockedByMeUserIds.includes(String(targetUid));

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
  }, [user?.id, blockedByMeUserIds, addBlock, removeBlock]);

  const handleCommentMenuPress = useCallback((comment: any) => {
    const targetUserId = comment.userId || comment.user_id || comment.sender_id || comment.user?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserIds.includes(String(targetUserId));
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
            setCommentModalToRestore(showCommentModal);
            setShowCommentModal(null);
            setTimeout(() => {
              setReportCommentModalVisible(true);
            }, 300);
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
            if (Platform.OS === 'android') {
              setReportCommentModalVisible(true);
            } else {
              setCommentModalToRestore(showCommentModal);
              setShowCommentModal(null);
              setTimeout(() => {
                setReportCommentModalVisible(true);
              }, 300);
            }
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
  }, [blockedUserIds, handleToggleBlockUser, showCommentModal]);

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

  const dynamicTabs = useMemo(() => {
    if (community?.type === 'city' || community?.type === 'state' || community?.type === 'country') {
      return COMMUNITY_TABS;
    }
    return ['Feed'];
  }, [community?.type]);

  const isSevaRequest = (item: any) => {
    if (!item) return false;
    const type = (item.request_type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const support = (item.support_needed || '').toLowerCase();

    if (type === 'temple' || type === 'gau' || type === 'animal') {
      return true;
    }
    if (type === 'help' && (title.includes('temple') || description.includes('temple') || title.includes('seva') || description.includes('seva') || title.includes('donate') || description.includes('donate') || title.includes('donation') || description.includes('donation') || title.includes('bhandara') || description.includes('bhandara') || support.includes('temple') || support.includes('seva') || support.includes('donate') || support.includes('donation'))) {
      return true;
    }
    if (title.includes('seva') || description.includes('seva') || title.includes('temple') || description.includes('temple') || title.includes('donate') || description.includes('donate') || title.includes('donation') || description.includes('donation')) {
      return true;
    }
    return false;
  };

  const isSevaPost = (item: any) => {
    return ((item.category || '').toLowerCase() === 'seva') || isSevaRequest(item);
  };

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

  const parseUTCDate = (dateString?: string) => {
    if (!dateString) return new Date(NaN);
    let ds = String(dateString);
    if (!ds.includes('Z') && !ds.includes('+') && !ds.match(/-\d\d:\d\d$/)) {
      ds = ds.includes('T') ? `${ds}Z` : `${ds.replace(' ', 'T')}Z`;
    }
    return new Date(ds);
  };

  const getUnixTimestamp = (item: any) => {
    if (item.created_at) {
      const d = parseUTCDate(item.created_at);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    if (item.timestamp) {
      const tsStr = String(item.timestamp).toLowerCase();
      const now = Date.now();
      if (tsStr.includes('just now') || tsStr.includes('now')) {
        return now;
      }
      const match = tsStr.match(/^(\d+)\s*(m|h|d)\s*ago/);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === 'm') return now - val * 60 * 1000;
        if (unit === 'h') return now - val * 60 * 60 * 1000;
        if (unit === 'd') return now - val * 24 * 60 * 60 * 1000;
      }

      const d = parseUTCDate(item.timestamp);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    if (item.start_time) {
      const d = parseUTCDate(item.start_time);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  };

  const isLostFoundRequest = (item: any) => {
    if (!item) return false;
    const type = (item.request_type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const description = (item.description || item.content || '').toLowerCase();
    const support = (item.support_needed || '').toLowerCase().trim();
    const cat = (item.category || '').toLowerCase().trim();

    // Check category field first (most reliable - covers community posts created with 'Lost & Found' category)
    if (cat === 'lost & found' || cat === 'lost_found' || cat === 'lost' || cat === 'found') return true;
    // Check request_type field (for API community requests)
    if (type === 'lost_found' || type === 'lost' || type === 'found') return true;
    // Keyword fallback for legacy items
    return title.includes('lost') || description.includes('lost') || support.includes('lost') ||
      title.includes('found') || description.includes('found') || support.includes('found');
  };

  const isTempleUpdateRequest = (item: any) => {
    if (!item) return false;
    const type = (item.request_type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const description = (item.description || item.content || '').toLowerCase();
    const support = (item.support_needed || '').toLowerCase().trim();
    const cat = (item.category || '').toLowerCase().trim();

    // Check category field first (most reliable - covers community posts created with 'Temple Updates' category)
    if (cat === 'temple updates' || cat === 'temple_update' || cat === 'temple update') return true;
    // Check request_type field (for API community requests)
    if (type === 'temple_update') return true;
    // Keyword fallback for legacy items
    return (title.includes('temple') || description.includes('temple') || support.includes('temple')) &&
      (title.includes('update') || description.includes('update') || title.includes('renovation') || description.includes('renovation'));
  };

  const createDummyItem = (tabName: string) => {
    const now = new Date().toISOString();
    if (tabName === 'Requests') {
      return {
        id: 'dummy-request-item',
        isRequestItem: true,
        title: 'Mock Help Request: Blood Donation Needed',
        description: 'B+ blood needed urgently at City General Hospital for an elderly patient. Please contact Rahul if you can donate.',
        request_type: 'blood',
        support_needed: 'Blood Donation',
        urgency_level: 'critical',
        user_name: 'Rahul Sharma (Mock)',
        contact_number: '+919876543210',
        created_at: now,
        status: 'pending',
        interested_count: 3
      };
    }
    if (tabName === 'Events') {
      return {
        id: 'dummy-event-item',
        title: 'Mock Event: Community Meetup & Bhajan Sandhya',
        location: 'Community Hall, Sector 4',
        start_time: now,
        attendee_count: 24,
        contact_number: '+919876543210',
        created_at: now,
        status: 'pending',
        image_url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=500'
      };
    }
    if (tabName === 'Lost & Found') {
      return {
        id: 'dummy-lost-found-item',
        isRequestItem: true,
        title: 'Mock Lost & Found: Gold Ring Found near Temple Entrance',
        description: 'Found a gold ring with initials "S.J." near the main temple steps yesterday evening. Owner can claim by providing verification.',
        request_type: 'lost_found',
        support_needed: 'Lost & Found Alert',
        urgency_level: 'normal',
        user_name: 'Aarti Jain (Mock)',
        contact_number: '+919876543210',
        created_at: now,
        status: 'pending',
        interested_count: 1
      };
    }
    if (tabName === 'Seva') {
      return {
        id: 'dummy-seva-item',
        isRequestItem: true,
        isSevaPost: true,
        user_name: 'Gau Seva Samiti (Mock)',
        user: { name: 'Gau Seva Samiti (Mock)', isVerified: true },
        content: 'Mock Seva: Volunteers Needed for Sunday Goshala Cleaning & Feeding Drive',
        description: 'Join us this Sunday morning from 8 AM to 11 AM at the local Goshala. Breakfast and refreshments will be provided.',
        contact: '+919876543210',
        created_at: now,
        status: 'pending',
        sevaDetails: 'Bring comfortable clothes. Tools will be provided.',
        liked: false
      };
    }
    if (tabName === 'Temple Updates') {
      return {
        id: 'dummy-temple-update-item',
        isRequestItem: true,
        title: 'Mock Temple Update: Reconstruction of Inner Sanctum',
        description: 'The reconstruction of the main Shikhar and Garbhagriha is underway. Daily darshan timings are adjusted to 6 AM - 10 AM and 4 PM - 8 PM.',
        request_type: 'temple_update',
        support_needed: 'temple',
        urgency_level: 'normal',
        user_name: 'Temple Trustee Board (Mock)',
        contact_number: '+919876543210',
        created_at: now,
        status: 'pending',
        interested_count: 5
      };
    }
    if (tabName === 'My Posts') {
      return {
        id: 'dummy-my-posts-item',
        isCommunityMsg: true,
        user: {
          name: 'Brahmand Bot',
          photo: null,
          isVerified: true,
          verificationLabel: 'System',
        },
        content: "You haven't shared any posts in this community yet. Create a post using the floating action button to see it here!",
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        shares: 0,
        reposts: 0,
        hideBadge: true,
      };
    }
    return null;
  };

  const combinedData = useMemo(() => {
    const isUserBlocked = (item: any) => {
      const uid = item?.user_id || item?.creator_id || item?.creator?.id || item?.sender_id || item?.user?.id;
      return uid && blockedUserIds.includes(String(uid));
    };

    const filteredRequestsList = requests.filter(item => !isUserBlocked(item));
    const filteredEventsList = events.filter(item => !isUserBlocked(item));
    const filteredDiscussionPostsList = discussionPosts.filter(item => !isUserBlocked(item));
    const filteredCommunityPostsList = communityPosts.filter(item => !isUserBlocked(item));
    const filteredApiRequests = filteredRequests.filter(item => !isUserBlocked(item));
    const filteredApiSevaRequests = filteredSevaRequests.filter(item => !isUserBlocked(item));
    const filteredAllFestivalsList = allFestivals.filter(item => !isUserBlocked(item));

    if (activeTab === 'My Posts') {
      const itemMap = new Map();

      // All chat messages (community posts)
      filteredCommunityPostsList.forEach(p => {
        const cleanPost = { ...p };
        if (cleanPost.id && !String(cleanPost.id).startsWith('post-')) {
          delete cleanPost.threadParentId;
        }
        itemMap.set(p.id, cleanPost);
      });

      // Discussion posts
      filteredDiscussionPostsList.forEach(p => {
        if (!itemMap.has(p.id)) {
          itemMap.set(p.id, p);
        }
      });

      // Include Community Requests
      filteredRequestsList.forEach(req => {
        if (!itemMap.has(req.id)) {
          itemMap.set(req.id, {
            ...req,
            type: 'request_item',
            isRequestInFeed: true,
          });
        }
      });

      const allItems = Array.from(itemMap.values());

      // Filter only user's own posts/requests
      const userOwnItems = allItems.filter(item => {
        return (
          (item.sender_id && user?.id && String(item.sender_id) === String(user?.id)) ||
          (item.user_id && user?.id && String(item.user_id) === String(user?.id)) ||
          String(item.id).startsWith('post-') ||
          String(item.id).startsWith('repost-')
        );
      });

      // Sort posts descending (newest first)
      userOwnItems.sort((a, b) => {
        const timeA = getUnixTimestamp(a);
        const timeB = getUnixTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id));
      });

      return userOwnItems;
    }

    if (activeTab === 'Requests') {
      const apiList = filteredApiRequests.filter((item: any) => !isLostFoundRequest(item) && !isTempleUpdateRequest(item));
      const localList = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'requests')
        .map((p: any) => ({ 
          ...p, 
          type: 'request_item', 
          isRequestItem: true, 
          isRequestInFeed: false,
          title: p.title || 'Community Request',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          urgency_level: p.urgency_level || 'normal',
          request_type: p.request_type || 'help',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url
        }));

      const reqMap = new Map();
      apiList.forEach(r => reqMap.set(r.id, r));
      localList.forEach(r => reqMap.set(r.id, r));

      const list = Array.from(reqMap.values()).sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));
      return list;
    }
    if (activeTab === 'Events') {
      const apiList = filteredEventsList;
      const localList = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'events')
        .map((p: any) => ({ 
          ...p, 
          isEventItem: true,
          title: p.title || 'Community Event',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          start_time: p.start_time || p.timestamp || new Date().toISOString(),
          location: p.location || p.sevaDetails || 'Community Group',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url
        }));

      const evtMap = new Map();
      apiList.forEach(e => evtMap.set(e.id, e));
      localList.forEach(e => evtMap.set(e.id, e));

      const list = Array.from(evtMap.values()).sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));
      return list;
    }
    if (activeTab === 'Festivals') {
      const userFestivals = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'festivals')
        .map((p: any) => {
          let eventImage = p.image || p.image_url || p.media_url;
          let resolvedImage = typeof eventImage === 'string' ? { uri: eventImage } : eventImage;
          if (!resolvedImage) {
            resolvedImage = require('../../assets/images/image temple/Siddhivinayak-Temple.webp');
          }
          const diffInSeconds = p.timestamp ? Math.floor((new Date().getTime() - parseUTCDate(p.timestamp).getTime()) / 1000) : 0;
          let timeAgoStr = 'Just now';
          if (diffInSeconds >= 86400) timeAgoStr = `${Math.floor(diffInSeconds / 86400)}d ago`;
          else if (diffInSeconds >= 3600) timeAgoStr = `${Math.floor(diffInSeconds / 3600)}h ago`;
          else if (diffInSeconds >= 60) timeAgoStr = `${Math.floor(diffInSeconds / 60)}m ago`;

          return {
            id: p.id,
            title: p.title || p.content || 'Festival Celebration',
            description: p.description || p.content || 'Join our community celebration!',
            location: p.location || p.sevaDetails || 'Nearby Community',
            time: p.time || (p.timestamp ? (() => {
              const d = parseUTCDate(p.timestamp);
              if (isNaN(d.getTime())) return 'Today';
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              return `${day}/${month}/${d.getFullYear()}`;
            })() : 'Today'),
            image: resolvedImage,
            organizer: {
              name: p.user?.name || 'Devotee',
              photo: p.user?.photo || null,
              isVerified: p.user?.isVerified || p.user?.is_verified || p.is_verified || false
            },
            timeAgo: timeAgoStr,
            type: 'festival_event',
            isReal: true
          };
        });

      let eventList = [
        ...userFestivals
      ];

      if (selectedFestival) {
        const targetFestival = allFestivals.find(f => f.name === selectedFestival);
        let targetDateStr = '';
        if (targetFestival && targetFestival.date) {
          try {
            const d = parseUTCDate(targetFestival.date);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              targetDateStr = `${day}/${month}/${d.getFullYear()}`;
            }
          } catch (err) {
            console.warn('Failed to parse target festival date', err);
          }
        }

        eventList = eventList.filter(e => {
          if (targetDateStr && e.time && e.time.includes(targetDateStr)) {
            return true;
          }
          const title = (e.title || '').toLowerCase();
          const desc = (e.description || '').toLowerCase();
          const name = selectedFestival.toLowerCase();
          return title.includes(name) || desc.includes(name);
        });
      }

      eventList.sort((a, b) => {
        const timeA = getUnixTimestamp(a);
        const timeB = getUnixTimestamp(b);
        return festivalSort === 'latest' ? timeB - timeA : timeA - timeB;
      });

      return [
        { id: 'fest-header-main', type: 'festivals_header' },
        { id: 'fest-list-horizontal', type: 'festivals_list' },
        { id: 'fest-events-header-sub', type: 'festival_events_header' },
        ...eventList,
        { id: 'fest-banner-footer', type: 'festival_banner' }
      ];
    }
    if (activeTab === 'Lost & Found') {
      const apiList = filteredRequestsList.filter((item: any) => isLostFoundRequest(item));
      const localList = filteredCommunityPostsList
        .filter((p: any) => isLostFoundRequest(p))
        .map((p: any) => ({ 
          ...p, 
          isRequestItem: true,
          title: p.title || 'Lost & Found',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          request_type: 'lost_found',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url
        }));

      const lfMap = new Map();
      apiList.forEach(r => lfMap.set(r.id, r));
      localList.forEach(r => lfMap.set(r.id, r));

      const list = Array.from(lfMap.values()).sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));
      return list;
    }
    if (activeTab === 'Temple Updates') {
      const apiList = filteredRequestsList.filter((item: any) => isTempleUpdateRequest(item));
      const localList = filteredCommunityPostsList
        .filter((p: any) => isTempleUpdateRequest(p))
        .map((p: any) => ({ 
          ...p, 
          isRequestItem: true,
          title: p.title || 'Temple Update',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          request_type: 'temple_update',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url
        }));

      const tuMap = new Map();
      apiList.forEach(r => tuMap.set(r.id, r));
      localList.forEach(r => tuMap.set(r.id, r));

      const list = Array.from(tuMap.values()).sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));
      return list;
    }
    if (activeTab === 'Seva') {
      const apiSeva = filteredApiSevaRequests.map((r: any) => ({ ...r, isSevaPost: true, isRequestItem: true }));
      const localSeva = filteredCommunityPostsList
        .filter((p: any) => (p.category || '').toLowerCase().trim() === 'seva')
        .map((p: any) => ({ 
          ...p, 
          isSevaPost: true, 
          isRequestItem: true,
          title: p.title || 'Seva Request',
          description: p.description || p.content || '',
          user_name: p.user_name || p.user?.name || 'Devotee',
          created_at: p.created_at || p.timestamp || new Date().toISOString(),
          request_type: 'seva',
          image: p.image || p.image_url || p.media_url,
          image_url: p.image_url || p.image || p.media_url
        }));

      const sevaMap = new Map();
      apiSeva.forEach(s => sevaMap.set(s.id, s));
      localSeva.forEach(s => sevaMap.set(s.id, s));

      const mergedSeva = Array.from(sevaMap.values());
      const sortedSeva = mergedSeva.sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));

      return sortedSeva;
    }
    if (activeTab === 'Feed') {
      const itemMap = new Map();

      // All chat messages (community posts) only show in Feed section
      filteredCommunityPostsList.forEach(p => {
        // Clear any old/stale threadParentId from raw API messages to recompute cleanly
        const cleanPost = { ...p };
        if (cleanPost.id && !String(cleanPost.id).startsWith('post-')) {
          delete cleanPost.threadParentId;
        }
        itemMap.set(p.id, cleanPost);
      });

      // Discussion posts are always chat posts in Feed
      filteredDiscussionPostsList.forEach(p => {
        if (!itemMap.has(p.id)) {
          itemMap.set(p.id, p);
        }
      });

      // Include Community Requests in Feed
      filteredRequestsList.forEach(req => {
        if (!itemMap.has(req.id)) {
          itemMap.set(req.id, {
            ...req,
            type: 'request_item',
            isRequestInFeed: true,
          });
        }
      });

      const allItems = Array.from(itemMap.values());

      // Step 1: Sort ascending by ID (or fallback) to chronological order to find consecutive thread messages
      allItems.sort((a, b) => {
        const aIsLocal = String(a.id).startsWith('post-');
        const bIsLocal = String(b.id).startsWith('post-');
        if (aIsLocal && !bIsLocal) return 1; // local posts (newest) go to the end of chronological order
        if (!aIsLocal && bIsLocal) return -1;
        if (aIsLocal && bIsLocal) {
          return String(a.id).localeCompare(String(b.id));
        }

        const aNum = parseInt(a.id, 10);
        const bNum = parseInt(b.id, 10);
        const aIsNumeric = !isNaN(aNum) && /^\d+$/.test(String(a.id));
        const bIsNumeric = !isNaN(bNum) && /^\d+$/.test(String(b.id));

        if (aIsNumeric && bIsNumeric) {
          return aNum - bNum;
        }
        if (aIsNumeric && !bIsNumeric) return 1;
        if (!aIsNumeric && bIsNumeric) return -1;

        return String(a.id).localeCompare(String(b.id));
      });

      // Step 2: Reconstruct threadParentId for consecutive non-local messages from same sender within 1 minute
      for (let i = 0; i < allItems.length; i++) {
        const current = allItems[i];
        if (String(current.id).startsWith('post-')) continue; // Skip local posts (already have parent thread IDs)

        let j = i + 1;
        while (j < allItems.length) {
          const next = allItems[j];
          if (String(next.id).startsWith('post-')) break; // Stop at local posts

          const isSameSender = (next.sender_id && current.sender_id && String(next.sender_id) === String(current.sender_id)) ||
            (next.user?.name && current.user?.name && next.user.name === current.user.name);

          if (isSameSender) {
            const timeA = new Date(current.timestamp).getTime();
            const timeB = new Date(next.timestamp).getTime();
            const timeDiff = Math.abs(timeA - timeB);
            const isSameRelativeTime = current.timestamp && next.timestamp && current.timestamp === next.timestamp;

            if ((!isNaN(timeDiff) && timeDiff < 60000) || isSameRelativeTime) {
              next.threadParentId = current.threadParentId || current.id;
              j++;
              continue;
            }
          }
          break;
        }
        i = j - 1;
      }

      // Step 3: Separate parents and children
      const parents: any[] = [];
      const childrenMap = new Map<string, any[]>();

      allItems.forEach(item => {
        if (item.threadParentId) {
          const list = childrenMap.get(item.threadParentId) || [];
          list.push(item);
          childrenMap.set(item.threadParentId, list);
        } else {
          parents.push(item);
        }
      });

      // Step 4: Sort parent posts descending (newest first), pinning only recent announcements (last 24 hours) at the very top
      const sortCutoffMs = Date.now() - 24 * 60 * 60 * 1000;
      const isRecentAnn = (post: any) => {
        const isAnn = post.isNationalAnnouncement || post.isStateAnnouncement;
        if (!isAnn) return false;
        const ts = post.timestamp || post.created_at;
        if (!ts || ts === 'Just now') return true;
        try {
          const tMs = parseUTCDate(ts).getTime();
          return !isNaN(tMs) && tMs >= sortCutoffMs;
        } catch {
          return true;
        }
      };

      parents.sort((a, b) => {
        const aIsRecentAnn = isRecentAnn(a);
        const bIsRecentAnn = isRecentAnn(b);

        if (aIsRecentAnn && !bIsRecentAnn) return -1;
        if (!aIsRecentAnn && bIsRecentAnn) return 1;

        if (aIsRecentAnn && bIsRecentAnn) {
          // Both are recent announcements: national first, then state
          if (a.isNationalAnnouncement && !b.isNationalAnnouncement) return -1;
          if (!a.isNationalAnnouncement && b.isNationalAnnouncement) return 1;
        }

        const timeA = getUnixTimestamp(a);
        const timeB = getUnixTimestamp(b);
        if (timeA !== timeB) return timeB - timeA;

        return String(b.id).localeCompare(String(a.id));
      });

      // Step 5: Interleave children immediately after their parents
      const sortedResult: any[] = [];
      parents.forEach(parent => {
        sortedResult.push(parent);
        const children = childrenMap.get(parent.id);
        if (children) {
          // Sort children ascending by ID to display chronological thread replies
          children.sort((a, b) => {
            return String(a.id).localeCompare(String(b.id));
          });
          sortedResult.push(...children);
        }
      });

      return sortedResult;
    }

    return [];
  }, [activeTab, requests, events, discussionPosts, communityPosts, filteredRequests, filteredSevaRequests, user?.id, blockedUserIds]);

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

  const fetchCommunity = async (force = false) => {
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await ensureCategoriesLoaded();
      }
      const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
      if (!force && cachedData && Date.now() - (cachedData.lastFetched || 0) < 900000) {
        console.log('[Community] Using fresh cache, skipping fetchCommunity');
        setCommunity(cachedData.community);
        setRequests(cachedData.requests || []);
        setEvents(cachedData.events || []);
        setAllFestivals(cachedData.allFestivals || []);
        setCommunityPosts(cachedData.communityPosts || []);
        setLoading(false);
        return;
      }
      if (!cachedData) {
        setCommunity(null);
        setRequests([]);
        setEvents([]);
        setCommunityPosts([]);
        setLoading(true);
      }
      setHasMorePosts(true);
      let nextCommunity: any = { type: 'city', name: 'Community' };
      try {
        const response = await getCommunity(id as string);
        nextCommunity = response.data;
      } catch (err) {
        if (id === 'food_pune') {
          nextCommunity = {
            id: 'food_pune',
            name: 'Pune Food Sharing Group',
            type: 'city',
            members_count: 0,
            description: 'A community group for sharing food in Pune.'
          };
        } else if (id === 'mumbai-fallback' || id === 'city_default') {
          nextCommunity = {
            id: id,
            name: t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community',
            type: 'city',
            members_count: 0,
            description: 'My Community Group'
          };
        } else if (id === 'maharashtra-fallback') {
          nextCommunity = {
            id: id,
            name: t('language') === 'hi' ? 'महाराष्ट्र समुदाय' : 'Maharashtra Community',
            type: 'state',
            members_count: 0,
            description: 'Maharashtra State Community Group'
          };
        } else if (id === 'bharat-fallback') {
          nextCommunity = {
            id: id,
            name: t('language') === 'hi' ? 'भारत समुदाय' : 'Bharat Community',
            type: 'country',
            members_count: 0,
            description: 'Bharat National Community Group'
          };
        } else {
          throw err;
        }
      }
      setCommunity(nextCommunity);
      
      const currentSubgroup = nextCommunity.type === 'state'
        ? 'state'
        : (nextCommunity.type === 'country' || nextCommunity.type === 'national' ? 'national' : 'city');

      let stateCommunityId: string | null = null;
      let countryCommunityId: string | null = null;

      const { getCommunityRequests, getEvents, getCommunityMessages, getFestivalList, getCommunities } = require('../../src/services/api');

      if (nextCommunity.type === 'city') {
        // ⚡ Android: Reuse cached community IDs from refs to skip blocking sequential API call
        if (Platform.OS === 'android' && stateCommunityIdRef.current) {
          stateCommunityId = stateCommunityIdRef.current;
          countryCommunityId = countryCommunityIdRef.current;
        } else {
          try {
            const allJoinedRes = await getCommunities().catch(() => ({ data: [] }));
            const joinedList = allJoinedRes.data || [];

            const stateCommunity = joinedList.find((c: any) => c.type === 'state');
            const countryCommunity = joinedList.find((c: any) => c.type === 'country' || c.type === 'national');

            if (stateCommunity) {
              stateCommunityId = stateCommunity.id;
              stateCommunityIdRef.current = stateCommunity.id;
            }
            if (countryCommunity) {
              countryCommunityId = countryCommunity.id;
              countryCommunityIdRef.current = countryCommunity.id;
            }
          } catch (e) {
            console.warn('[Community] Failed to fetch joined communities:', e);
          }
        }
      }

      const promises: Promise<any>[] = [
        getCommunityRequests({ community_id: id as string }).catch(() => ({ data: [] })),
        getEvents().catch(() => ({ data: [] })),
        getCommunityMessages(id as string, currentSubgroup).catch(() => ({ data: [] })),
        stateCommunityId ? getCommunityMessages(stateCommunityId, 'state').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        countryCommunityId ? getCommunityMessages(countryCommunityId, 'national').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        getFestivalList().catch(() => ({ data: [] }))
      ];

      const isLocalCommunity = nextCommunity.type === 'city';
      if (isLocalCommunity) {
        promises.push(getCommunityRequests({ status: 'active', limit: 50 }).catch(() => ({ data: [] })));
      }

      const results = await Promise.all(promises);
      const reqResponse = results[0];
      const eventResponse = results[1];
      const msgResponse = results[2];
      const stateMsgResponse = results[3];
      const nationalMsgResponse = results[4];
      const festResponse = results[5];
      const globalReqResponse = isLocalCommunity ? results[6] : null;

      console.log('[Community] Requests fetched:', reqResponse.data?.length);
      let nextRequests = reqResponse.data || [];
      if (globalReqResponse && globalReqResponse.data) {
        const combined = [...nextRequests, ...globalReqResponse.data];
        nextRequests = combined.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i);
      }
      const nextEvents = eventResponse.data || [];
      setRequests(nextRequests);
      setEvents(nextEvents);

      let nextFestivals = allFestivals;
      if (festResponse.data && festResponse.data.length > 0) {
        nextFestivals = festResponse.data.map((f: any) => ({
          ...f,
          icon: 'flower-outline',
          color: '#F0F9FF',
          iconColor: '#00A3FF'
        }));
        setAllFestivals(nextFestivals);
      }

      // Map API messages to Twitter format
      const formattedMsgs = (msgResponse.data || []).map((msg: any) => ({
        id: msg.id || Math.random().toString(),
        user: {
          name: msg.sender_name || 'Anonymous',
          photo: msg.sender_photo,
          isVerified: msg.is_verified || false,
          verificationLabel: msg.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
        },
        content: msg.content,
        image: msg.media_url || msg.mediaUrl || msg.image,
        timestamp: msg.created_at || 'Just now',
        raw_timestamp: msg.created_at,
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: false,
        liked: (msg.liked_by || []).includes(user?.id),
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id, // Map sender ID to check for delete ownership
        isCommunityMsg: true,
        subgroupType: currentSubgroup,
        communityId: id as string,
        contact: msg.contact,
        sevaDetails: msg.seva_details,
        location: msg.location,
      }));

      // Map State API messages
      const formattedStateMsgs = (stateMsgResponse?.data || []).map((msg: any) => ({
        id: msg.id || Math.random().toString(),
        user: {
          name: msg.sender_name || 'Anonymous',
          photo: msg.sender_photo,
          isVerified: msg.is_verified || false,
          verificationLabel: msg.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
        },
        content: msg.content,
        image: msg.media_url || msg.mediaUrl || msg.image,
        timestamp: msg.created_at || 'Just now',
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: false,
        liked: (msg.liked_by || []).includes(user?.id),
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id,
        isStateAnnouncement: true,
        isCommunityMsg: true,
        subgroupType: 'state',
        communityId: stateCommunityId,
        contact: msg.contact,
        sevaDetails: msg.seva_details,
        location: msg.location,
      }));

      // Map National API messages
      const formattedNationalMsgs = (nationalMsgResponse?.data || []).map((msg: any) => ({
        id: msg.id || Math.random().toString(),
        user: {
          name: msg.sender_name || 'Anonymous',
          photo: msg.sender_photo,
          isVerified: msg.is_verified || false,
          verificationLabel: msg.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
        },
        content: msg.content,
        image: msg.media_url || msg.mediaUrl || msg.image,
        timestamp: msg.created_at || 'Just now',
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: false,
        liked: (msg.liked_by || []).includes(user?.id),
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id,
        isNationalAnnouncement: true,
        isCommunityMsg: true,
        subgroupType: 'national',
        communityId: countryCommunityId,
        contact: msg.contact,
        sevaDetails: msg.seva_details,
        location: msg.location,
      }));

      // Separate state & national announcements into recent (last 24 hours, to be pinned) and older (to go down the feed)
      const nowMs = Date.now();
      const cutoffMs = nowMs - 24 * 60 * 60 * 1000;
      const isWithin24Hours = (createdAtStr: string) => {
        if (!createdAtStr || createdAtStr === 'Just now') return true;
        try {
          const msgTime = parseUTCDate(createdAtStr).getTime();
          return !isNaN(msgTime) && msgTime >= cutoffMs;
        } catch (e) {
          return true;
        }
      };

      const recentStateMsgs = formattedStateMsgs.filter((msg: any) => isWithin24Hours(msg.timestamp));
      const olderStateMsgs = formattedStateMsgs.filter((msg: any) => !isWithin24Hours(msg.timestamp));

      const recentNationalMsgs = formattedNationalMsgs.filter((msg: any) => isWithin24Hours(msg.timestamp));
      const olderNationalMsgs = formattedNationalMsgs.filter((msg: any) => !isWithin24Hours(msg.timestamp));

      // Retrieve list of locally deleted post IDs to filter them from fresh server data
      const currentCache = useChatStore.getState().communityScreenCaches[cacheKey];
      const deletedIds = new Set<string>(currentCache?.deletedPostIds || []);

      let finalPosts: any[] = [];
      if (Platform.OS === 'ios') {
        const currentUser = useAuthStore.getState().user;
        const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
        const currentUserName = currentUser?.name || null;

        const serverPosts = [
          ...formattedMsgs,
          ...recentStateMsgs,
          ...olderStateMsgs,
          ...recentNationalMsgs,
          ...olderNationalMsgs
        ];
        const serverIds = new Set(serverPosts.map((p: any) => String(p.id)));
        const prevPosts = currentCache?.communityPosts || [];

        console.log('[iOS Community] prevPosts IDs:', prevPosts.map(p => p.id));
        console.log('[iOS Community] serverPosts IDs:', serverPosts.map(p => p.id));

        const localPosts = prevPosts.filter((p: any) => {
          const pIdStr = String(p.id);
          const isDeleted = deletedIds.has(pIdStr);
          if (isDeleted) return false;

          // If the post is already in the server response by ID, don't keep local version
          if (serverIds.has(pIdStr)) {
            console.log(`[iOS Community] Discarding local post ${pIdStr} because server has it by ID`);
            return false;
          }

          // If it's a local pending post (starts with 'post-'), also check if the server has already returned it by content matching
          if (pIdStr.startsWith('post-')) {
            const hasServerMatch = serverPosts.some((sp: any) => {
              const contentMatches = (p.content || '').trim() === (sp.content || '').trim();
              const senderMatches = (sp.sender_id && currentUserIdStr && String(sp.sender_id) === currentUserIdStr) ||
                (sp.user_id && currentUserIdStr && String(sp.user_id) === currentUserIdStr) ||
                (sp.user?.name && currentUserName && sp.user.name === currentUserName);
              return contentMatches && senderMatches;
            });
            if (hasServerMatch) {
              console.log(`[iOS Community] Discarding local post ${pIdStr} because server has it by content match`);
              return false;
            }
          }

          const isLocal = pIdStr.startsWith('post-') || 
            p.isUniversal || 
            iosUserCreatedPostIds.has(pIdStr) ||
            (p.sender_id && currentUserIdStr && String(p.sender_id) === currentUserIdStr) ||
            (p.user_id && currentUserIdStr && String(p.user_id) === currentUserIdStr);

          if (isLocal) {
            console.log(`[iOS Community] Keeping local post ${pIdStr} (isUniversal: ${p.isUniversal}, createdInSession: ${iosUserCreatedPostIds.has(pIdStr)})`);
          }

          return isLocal;
        });

        const seenIds = new Set(localPosts.map((p: any) => String(p.id)));

        // Filter fresh server posts — exclude any that were locally deleted or are already local
        const uniqueCityMsgs = formattedMsgs.filter((p: any) => !seenIds.has(String(p.id)) && !deletedIds.has(String(p.id)));
        const uniqueRecentStateMsgs = recentStateMsgs.filter((p: any) => !seenIds.has(String(p.id)) && !deletedIds.has(String(p.id)));
        const uniqueRecentNationalMsgs = recentNationalMsgs.filter((p: any) => !seenIds.has(String(p.id)) && !deletedIds.has(String(p.id)));
        const uniqueOlderStateMsgs = olderStateMsgs.filter((p: any) => !seenIds.has(String(p.id)) && !deletedIds.has(String(p.id)));
        const uniqueOlderNationalMsgs = olderNationalMsgs.filter((p: any) => !seenIds.has(String(p.id)) && !deletedIds.has(String(p.id)));

        const getPostTimeMs = (p: any) => {
          const ts = p.timestamp || p.created_at;
          if (!ts || ts === 'Just now') return Date.now();
          const parsed = parseUTCDate(ts).getTime();
          return Number.isNaN(parsed) ? Date.now() : parsed;
        };

        const sortedRecentNationalMsgs = [...uniqueRecentNationalMsgs].sort((a, b) => getPostTimeMs(b) - getPostTimeMs(a));
        const sortedRecentStateMsgs = [...uniqueRecentStateMsgs].sort((a, b) => getPostTimeMs(b) - getPostTimeMs(a));

        const olderCombined = [
          ...localPosts,
          ...uniqueCityMsgs,
          ...uniqueOlderStateMsgs,
          ...uniqueOlderNationalMsgs
        ].sort((a, b) => getPostTimeMs(b) - getPostTimeMs(a));

        finalPosts = [
          ...sortedRecentNationalMsgs,
          ...sortedRecentStateMsgs,
          ...olderCombined
        ];

        console.log('[iOS Community] finalPosts IDs:', finalPosts.map(p => p.id));

        setCommunityPosts(finalPosts);

        useChatStore.getState().setCommunityScreenCache(cacheKey, {
          community: nextCommunity,
          requests: nextRequests,
          events: nextEvents,
          allFestivals: nextFestivals,
          communityPosts: finalPosts,
          lastFetched: Date.now()
        });
      } else {
        // ORIGINAL reconciliation logic for Android/Web
        setCommunityPosts((prev: any[]) => {
          const serverIds = new Set([
            ...formattedMsgs.map((p: any) => p.id),
            ...recentStateMsgs.map((p: any) => p.id),
            ...olderStateMsgs.map((p: any) => p.id),
            ...recentNationalMsgs.map((p: any) => p.id),
            ...olderNationalMsgs.map((p: any) => p.id)
          ]);

          const serverPosts = [
            ...formattedMsgs,
            ...recentStateMsgs,
            ...olderStateMsgs,
            ...recentNationalMsgs,
            ...olderNationalMsgs
          ];

          // Keep local optimistic posts (either pending with 'post-' ID, user's own posts, or marked as isUniversal)
          const localPosts = prev.filter((p: any) => {
            const isDeleted = deletedIds.has(String(p.id));
            if (isDeleted) return false;

            const isLocal = String(p.id).startsWith('post-') || 
              p.isUniversal || 
              (p.sender_id && user?.id && String(p.sender_id) === String(user?.id)) ||
              (p.user_id && user?.id && String(p.user_id) === String(user?.id));

            if (!isLocal) return false;

            // If the post is already in the server response by ID, don't keep local version
            if (serverIds.has(p.id)) return false;

            // If it's a local pending post (starts with 'post-'), also check if the server has already returned it by content matching
            if (String(p.id).startsWith('post-')) {
              const hasServerMatch = serverPosts.some((sp: any) => {
                const contentMatches = (p.content || '').trim() === (sp.content || '').trim();
                const senderMatches = (sp.sender_id && user?.id && String(sp.sender_id) === String(user?.id)) ||
                  (sp.user_id && user?.id && String(sp.user_id) === String(user?.id)) ||
                  (sp.user?.name && user?.name && sp.user.name === user.name);
                return contentMatches && senderMatches;
              });
              if (hasServerMatch) return false;
            }

            return true;
          });
          const seenIds = new Set(localPosts.map((p: any) => p.id));

          // Filter fresh server posts — exclude any that were locally deleted
          const uniqueCityMsgs = formattedMsgs.filter((p: any) => !seenIds.has(p.id) && !deletedIds.has(String(p.id)));
          const uniqueRecentStateMsgs = recentStateMsgs.filter((p: any) => !seenIds.has(p.id) && !deletedIds.has(String(p.id)));
          const uniqueRecentNationalMsgs = recentNationalMsgs.filter((p: any) => !seenIds.has(p.id) && !deletedIds.has(String(p.id)));
          const uniqueOlderStateMsgs = olderStateMsgs.filter((p: any) => !seenIds.has(p.id) && !deletedIds.has(String(p.id)));
          const uniqueOlderNationalMsgs = olderNationalMsgs.filter((p: any) => !seenIds.has(p.id) && !deletedIds.has(String(p.id)));

          const getPostTimeMs = (p: any) => {
            const ts = p.timestamp || p.created_at;
            if (!ts || ts === 'Just now') return Date.now();
            const parsed = parseUTCDate(ts).getTime();
            return Number.isNaN(parsed) ? Date.now() : parsed;
          };

          const sortedRecentNationalMsgs = [...uniqueRecentNationalMsgs].sort((a, b) => getPostTimeMs(b) - getPostTimeMs(a));
          const sortedRecentStateMsgs = [...uniqueRecentStateMsgs].sort((a, b) => getPostTimeMs(b) - getPostTimeMs(a));

          const olderCombined = [
            ...localPosts,
            ...uniqueCityMsgs,
            ...uniqueOlderStateMsgs,
            ...uniqueOlderNationalMsgs
          ].sort((a, b) => getPostTimeMs(b) - getPostTimeMs(a));

          finalPosts = [
            ...sortedRecentNationalMsgs,
            ...sortedRecentStateMsgs,
            ...olderCombined
          ];

          // CRITICAL FIX: The cache must be updated with the newly computed array.
          // Doing this outside setCommunityPosts was caching an empty array due to async React state!
          useChatStore.getState().setCommunityScreenCache(cacheKey, {
            community: nextCommunity,
            requests: nextRequests,
            events: nextEvents,
            allFestivals: nextFestivals,
            communityPosts: finalPosts,
            lastFetched: Date.now()
          });

          return finalPosts;
        });
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMorePosts || communityPosts.length < 10) return;
    setLoadingMore(true);
    try {
      const { getCommunityMessages } = require('../../src/services/api');
      const currentSubgroup = community?.type === 'state'
        ? 'state'
        : (community?.type === 'country' || community?.type === 'national' ? 'national' : 'city');
      const cityPosts = communityPosts.filter((p: any) => !p.isStateAnnouncement && !p.isNationalAnnouncement && !String(p.id).startsWith('post-'));
      if (cityPosts.length === 0) {
        setHasMorePosts(false);
        setLoadingMore(false);
        return;
      }

      const oldestPost = cityPosts[cityPosts.length - 1];
      let beforeTimestamp = oldestPost.raw_timestamp || oldestPost.timestamp;
      // In case it's "Just now" or similar, we might have issues, but let's assume raw timestamp exists or try to use current time.
      if (beforeTimestamp === 'Just now' || beforeTimestamp === 'now') {
        beforeTimestamp = new Date().toISOString();
      }

      const msgResponse = await getCommunityMessages(id as string, currentSubgroup, 25, beforeTimestamp);
      const newMsgs = (msgResponse.data || []).map((msg: any) => ({
        id: msg.id || Math.random().toString(),
        user: {
          name: msg.sender_name || 'Anonymous',
          photo: msg.sender_photo,
          isVerified: msg.is_verified || false,
          verificationLabel: msg.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
        },
        content: msg.content,
        image: msg.media_url || msg.mediaUrl || msg.image,
        timestamp: msg.created_at || 'Just now',
        raw_timestamp: msg.created_at, // keep original for pagination
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: false,
        liked: (msg.liked_by || []).includes(user?.id),
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id, // Map sender ID to check for delete ownership
        isCommunityMsg: true,
        subgroupType: currentSubgroup,
        communityId: id as string,
        contact: msg.contact,
        sevaDetails: msg.seva_details,
        location: msg.location,
      }));

      if (newMsgs.length > 0) {
        setCommunityPosts(prev => {
          const updatedPosts = [...prev, ...newMsgs];

          // Update cache with the newly paginated posts so they persist when returning
          const currentCache = useChatStore.getState().communityScreenCaches[cacheKey];
          if (currentCache) {
            useChatStore.getState().setCommunityScreenCache(cacheKey, {
              ...currentCache,
              communityPosts: updatedPosts,
              lastFetched: Date.now()
            });
          }

          return updatedPosts;
        });
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCommunity(true).then(() => setRefreshing(false));
  }, []);

  const renderHeader = () => (
    <LinearGradient
      colors={['#FF8C3A', '#FFAD7D', '#FFD4AA', '#FFF1E8', '#FFFFFF']}
      locations={[0, 0.25, 0.55, 0.8, 1]}
      style={[styles.headerGradientContainer, { paddingTop: insets.top }]}
    >
      {/* Top Row: Back Button, Title, and Create Button */}
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/messages')}
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

  const renderDiscussionItem = ({ item }: { item: DiscussionPost }) => {
    // ⚡ Android: Use O(1) map lookup instead of O(n) findIndex to prevent slow rendering on large lists
    const index = Platform.OS === 'android'
      ? (combinedDataIndexMap.get(String(item.id)) ?? -1)
      : combinedData.findIndex(p => p.id === item.id);
    const nextItem = index !== -1 && index < combinedData.length - 1 ? combinedData[index + 1] : null;

    const hasNextThreadConnection = nextItem && (
      nextItem.threadParentId === item.id ||
      (item.threadParentId && nextItem.threadParentId === item.threadParentId)
    );
    const hasPrevThreadConnection = item.threadParentId !== undefined;

    const isFulfilled = (item as any).status === 'fulfilled' || (item as any).status === 'resolved' || (item as any).status === 'done';
    const isEventPost = (item as any).category === 'Events';

    const shouldTruncate = item.content.length > 300;
    const displayText = shouldTruncate
      ? item.content.slice(0, 300) + '...'
      : item.content;

    return (
      <View style={[
        styles.postContainer,
        hasNextThreadConnection && { paddingBottom: 0, borderBottomWidth: 0 },
        hasPrevThreadConnection && { paddingTop: 0 }
      ]}>
        {item.isRepost && (
          <View style={styles.repostHeaderLabel}>
            <Ionicons name="repeat" size={14} color="#536471" />
            <Text style={styles.repostHeaderText}>{item.repostedBy || 'Someone'} reposted</Text>
          </View>
        )}

        <View style={styles.postMainRow}>
          <View style={[styles.postLeftCol, { width: 48, alignItems: 'center' }]}>
            {hasPrevThreadConnection ? (
              // Child thread post: no avatar, just a continuous vertical line running from top to bottom
              <View style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, backgroundColor: '#CFD9DE', zIndex: 1 }} />
            ) : (
              // Parent thread post: show avatar, and draw a line down if there are replies
              <>
                <Avatar name={item.user.name} photo={item.user.photo} size={48} />
                {hasNextThreadConnection && (
                  <View style={{ position: 'absolute', left: 24, top: 48, bottom: 0, width: 2, backgroundColor: '#CFD9DE', zIndex: 1 }} />
                )}
              </>
            )}
          </View>

          <View style={[styles.postRightCol, hasPrevThreadConnection && { paddingLeft: 24 }]}>
            <View style={styles.postHeaderRow}>
              <View style={styles.postNameContainer}>
                <Text style={styles.feedPostUserName} numberOfLines={1}>{item.user.name}</Text>
                {item.user.isVerified && !item.hideBadge && <MaterialCommunityIcons name="check-decagram" size={18} color="#FF6B00" style={{ marginLeft: 2 }} />}
                <Text style={styles.postHandle} numberOfLines={1}>
                  {item.user.handle ? ` ${item.user.handle}` : ` @${item.user.name.replace(/\s+/g, '').toLowerCase()}`}
                </Text>
                <Text style={styles.postHandle} numberOfLines={1}> · {formatRelativeTime(item.timestamp)}</Text>
                {item.user.isFeatured && (
                  <View style={styles.featuredBadgeContainer}>
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </View>
                )}
                {(item as any).category && (item as any).category !== 'Feed' && (item as any).category !== 'Others' && (
                  <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>{(item as any).category.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              {(item.sender_id === user?.id || item.user.name === user?.name || String(item.id).startsWith('d')) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {((item as any).isRequestInFeed || ['requests', 'seva', 'lost & found', 'temple updates'].includes((item as any).category?.toLowerCase()) || (item as any).request_type) && !isFulfilled && (
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => handleResolveRequest(item)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleDeletePost(item.id)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
                  </TouchableOpacity>
                </View>
              ) : (
                // Non-owner: show Report button (Apple Guideline 1.2)
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    setPendingReportCommunityPost(item);
                    setReportCommunityPostModalVisible(true);
                  }}
                >
                  <Ionicons name="flag-outline" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleOpenCommentModal(item)}
              activeOpacity={0.8}
            >
              <Text selectable={true} style={styles.postContentText}>{displayText}</Text>
            </TouchableOpacity>

            {isEventPost && (item as any).start_time && (
              <View style={[styles.sevaInfoCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Text style={[styles.sevaInfoLabel, { color: '#166534' }]}>Event Date & Time</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={16} color="#166534" />
                  <Text style={[styles.sevaInfoText, { color: '#166534' }]}>
                    {formatDateTimeIST(new Date((item as any).start_time))}
                  </Text>
                </View>
              </View>
            )}

            {item.sevaDetails ? (
              <View style={styles.sevaInfoCard}>
                <Text style={styles.sevaInfoLabel}>Seva</Text>
                <Text style={styles.sevaInfoText}>{item.sevaDetails}</Text>
              </View>
            ) : null}

            {(item as any).location ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 }}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={{ fontSize: 12, color: '#888' }} numberOfLines={1}>{(item as any).location}</Text>
              </View>
            ) : null}

            {item.image && (
              <CommunityMediaItem
                media={item.image}
                style={styles.postMediaImage}
                isActive={activeVideoKey === (item.id ? String(item.id) : '')}
                onPress={() => setFullScreenMedia(typeof item.image === 'string' ? item.image : ((item.image as any)?.uri || ''))}
              />
            )}

            <View style={styles.postActionRow}>
              <TouchableOpacity
                style={styles.postActionBtn}
                onPress={() => handleOpenCommentModal(item)}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#536471" />
                <Text style={styles.postActionCount}>{item.comments > 0 ? item.comments : ''}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postActionBtn}
                onPress={() => handleRepost(item.id)}
              >
                <Ionicons name="repeat" size={20} color={item.isRepost ? "#00BA7C" : "#536471"} />
                <Text style={[styles.postActionCount, item.isRepost && { color: "#00BA7C" }]}>{item.reposts > 0 ? item.reposts : ''}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postActionBtn}
                onPress={() => handleLike(item.id)}
              >
                <Ionicons name={item.liked ? "heart" : "heart-outline"} size={19} color={item.liked ? "#F91880" : "#536471"} />
                <Text style={[styles.postActionCount, item.liked && { color: "#F91880" }]}>{item.likes > 0 ? item.likes : ''}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postActionBtn}
                onPress={() => handleShare(item.id)}
              >
                <Ionicons name="share-outline" size={18} color="#536471" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleCallPress = (phone: any) => {
    const phoneStr = typeof phone === 'string' ? phone : '';
    if (!phoneStr) {
      Alert.alert('Not Available', 'No contact phone number is available.');
      return;
    }
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Call ${phoneStr}?`);
      if (confirmed) {
        const { Linking } = require('react-native');
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
            const { Linking } = require('react-native');
            Linking.openURL(`tel:${phoneStr}`);
          }
        }
      ]
    );
  };

  const handleOpenMap = (location: string) => {
    if (!location || location === 'Online' || location === 'Local') return;
    const query = encodeURIComponent(location.trim());
    const nativeUrl = Platform.OS === 'ios' 
      ? `maps://0,0?q=${query}` 
      : `geo:0,0?q=${query}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    const { Linking } = require('react-native');
    // Try opening native map app directly first
    Linking.openURL(nativeUrl)
      .catch((err: any) => {
        console.warn('Could not open native map, trying browser fallback:', err);
        return Linking.openURL(webUrl);
      })
      .catch((webErr: any) => {
        console.error('Failed to open web maps fallback:', webErr);
        Alert.alert('Error', 'Unable to open maps application.');
      });
  };

  const handleWhatsAppPress = (phone: any, title: string) => {
    const phoneStr = typeof phone === 'string' ? phone : '';
    if (!phoneStr) {
      Alert.alert('Not Available', 'No contact phone number is available.');
      return;
    }
    const cleanPhone = phoneStr.replace(/[^0-9+]/g, '');
    const message = `Jai Jinendra! I saw your post "${title || 'Help Needed'}" on Brahmand. Let me know how I can help.`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    const { Linking } = require('react-native');
    Linking.canOpenURL(url).then((supported: boolean) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      }
    }).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp.');
    });
  };

  const renderSevaItem = ({ item }: { item: any }) => {
    const isFulfilled = item.status === 'fulfilled' || item.status === 'resolved' || item.status === 'done';
    const phone = item.contact || item.contact_number || item.user_phone;
    return (
      <View style={styles.festEventCard}>
        <View style={styles.festEventMain}>
          {(item.image || item.image_url || item.media_url) && (
            <CommunityMediaItem
              media={item.image || item.image_url || item.media_url}
              style={styles.festEventImage}
              isActive={activeVideoKey === (item.id ? String(item.id) : '')}
              onPress={() => setFullScreenMedia(typeof (item.image || item.image_url || item.media_url) === 'string' ? (item.image || item.image_url || item.media_url) : (item.image || item.image_url || item.media_url).uri)}
            />
          )}
          <View style={styles.festEventInfo}>
            <Text style={styles.festEventTitle} numberOfLines={2}>{item.title || item.content || 'Seva'}</Text>
            {item.description || item.content ? (
              <Text style={styles.festEventDesc} numberOfLines={2}>{item.description || item.content}</Text>
            ) : null}
            {item.sevaDetails ? (
              <View style={[styles.sevaInfoCard, { marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }]}>
                <Text style={[styles.sevaInfoLabel, { fontSize: 10, marginBottom: 2 }]}>Seva Details</Text>
                <Text style={[styles.sevaInfoText, { fontSize: 13, lineHeight: 18 }]}>{item.sevaDetails}</Text>
              </View>
            ) : null}
            <View style={styles.festEventMeta}>
              <View style={styles.festMetaRow}>
                <Ionicons name="heart" size={14} color="#E91E63" />
                <Text style={styles.festMetaText} numberOfLines={1}>Seva</Text>
              </View>
              <View style={styles.festMetaRow}>
                <Ionicons name="time-outline" size={14} color="#FF3B30" />
                <Text style={styles.festMetaText} numberOfLines={1}>{getTimeAgo(item.created_at || item.timestamp)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.festEventFooter, { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }]}>
          <View style={styles.festOrgDetailsRow}>
            <Avatar name={item.user?.name || item.user_name || 'User'} size={32} photo={item.user?.photo} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <View style={styles.festOrgNameRow}>
                <Text style={styles.festOrgName} numberOfLines={1}>{item.user?.name || item.user_name || 'User'}</Text>
                {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
              </View>
              <Text style={styles.festOrgLabel}>Volunteer • {item.location || 'Local'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.eventActionRow, { marginTop: 12, paddingHorizontal: 0 }]}>
          {/* Call button */}
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
            onPress={() => handleCallPress(phone)}
          >
            <Ionicons name="call" size={18} color="#16A34A" />
          </TouchableOpacity>

          {/* WhatsApp button */}
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => handleWhatsAppPress(phone, item.title || item.content || item.description)}
          >
            <FontAwesome5 name="whatsapp" size={18} color="#059669" />
          </TouchableOpacity>

          {/* Fulfill / Help Button */}
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            {item.user_id === user?.id || item.sender_id === user?.id ? (
              !isFulfilled && (
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#F59E0B', width: '100%' }]} onPress={() => handleResolveRequest(item)}>
                  <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
                </TouchableOpacity>
              )
            ) : null}

            {isFulfilled ? (
              <View style={[styles.helpBtn, { backgroundColor: '#D1FAE5', width: '100%' }]}>
                <Text style={[styles.helpBtnText, { color: '#166534' }]}>Completed ✅</Text>
              </View>
            ) : null}
          </View>

          {/* Share button */}
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleShareRequest(item)}>
            <Ionicons name="share-social-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleAttendPress = async (eventId: string, wantsToAttend: boolean, eventItem?: any) => {
    setRsvpStates(prev => ({
      ...prev,
      [eventId]: wantsToAttend ? 'yes' : 'no'
    }));

    // Schedule a 5-min reminder when user marks as attending
    if (wantsToAttend && eventItem?.start_time) {
      const title = eventItem.title || eventItem.content || 'Community Event';
      scheduleEventReminderNotification(title, eventItem.start_time, id as string)
        .catch(e => console.warn('[Community] Failed to schedule event reminder:', e));
    }

    try {
      if (typeof eventId === 'string' && !eventId.startsWith('post-') && !eventId.startsWith('dummy-')) {
        const { attendEvent } = require('../../src/services/api');
        if (wantsToAttend) {
          await attendEvent(eventId);
        } else {
          const { api: axiosInstance } = require('../../src/services/api');
          await axiosInstance.post(`/events/${eventId}/cancel-attendance`);
        }
      }
    } catch (err) {
      console.warn('Failed to update event attendance on backend:', err);
    }
  };

  const handleViewAttendees = async (item: any) => {
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
  };

  const renderEventItem = ({ item }: { item: any }) => {
    const isFulfilled = item.status === 'fulfilled' || item.status === 'resolved' || item.status === 'done';
    const phone = item.contact_number || item.contact || item.user_phone;
    const isCreator = item.user_id === user?.id || item.sender_id === user?.id || item.organizer_id === user?.id;

    const userIsAttendee = Array.isArray(item.attendees) && item.attendees.includes(user?.id);
    const rsvp = rsvpStates[item.id] || (userIsAttendee ? 'yes' : undefined);
    
    let displayGoingCount = item.attendee_count || 0;
    if (rsvpStates[item.id] === 'yes' && !userIsAttendee) {
      displayGoingCount += 1;
    } else if (rsvpStates[item.id] === 'no' && userIsAttendee) {
      displayGoingCount = Math.max(0, displayGoingCount - 1);
    }

    return (
      <View style={styles.festEventCard}>
        <View style={styles.festEventMain}>
          {(item.image_url || item.image || item.media_url) && (
            <CommunityMediaItem
              media={item.image_url || item.image || item.media_url}
              style={styles.festEventImage}
              isActive={activeVideoKey === (item.id ? String(item.id) : '')}
              onPress={() => setFullScreenMedia(typeof (item.image_url || item.image || item.media_url) === 'string' ? (item.image_url || item.image || item.media_url) : (item.image_url || item.image || item.media_url).uri)}
            />
          )}
          <View style={styles.festEventInfo}>
            <Text style={styles.festEventTitle} numberOfLines={2}>{item.title || 'Event'}</Text>
            {item.description ? (
              <Text style={styles.festEventDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <View style={styles.festEventMeta}>
              <View style={styles.festMetaRow}>
                <Ionicons name="calendar-outline" size={14} color="#FF6B00" />
                <Text style={styles.festMetaText} numberOfLines={1}>
                  {(() => {
                    if (!item.start_time) return 'Date not set';
                    const d = parseUTCDate(item.start_time);
                    if (isNaN(d.getTime())) return 'Date not set';
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    let hours = d.getHours();
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
                  })()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.festMetaRow}
                onPress={() => handleOpenMap(item.location || 'Online')}
                disabled={!item.location || item.location === 'Online'}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={14} color={item.location && item.location !== 'Online' ? "#FF6B00" : "#FF3B30"} />
                <Text style={[styles.festMetaText, item.location && item.location !== 'Online' && { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>{item.location || 'Online'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.festMetaRow}
                onPress={() => isCreator ? handleViewAttendees(item) : null}
                disabled={!isCreator}
              >
                <Ionicons name="people" size={14} color="#00C853" />
                <Text style={styles.festMetaText} numberOfLines={1}>{displayGoingCount} Going</Text>
                {isCreator && displayGoingCount > 0 && <Ionicons name="chevron-forward" size={12} color="#00C853" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.festEventFooter, { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }]}>
          <View style={styles.festOrgDetailsRow}>
            <Avatar name={item.user_name || item.user?.name || 'User'} size={32} photo={item.user?.photo} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <View style={styles.festOrgNameRow}>
                <Text style={styles.festOrgName} numberOfLines={1}>{item.user_name || item.user?.name || 'User'}</Text>
                {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
              </View>
              <Text style={styles.festOrgLabel}>Organizer • {getTimeAgo(item.start_time || item.created_at || item.timestamp)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.eventActionRow, { marginTop: 12, paddingHorizontal: 0 }]}>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
            onPress={() => handleCallPress(phone)}
          >
            <Ionicons name="call" size={18} color="#16A34A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => handleWhatsAppPress(phone, item.title)}
          >
            <FontAwesome5 name="whatsapp" size={18} color="#059669" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 8 }}>
            {item.user_id === user?.id || item.sender_id === user?.id ? (
              !isFulfilled && (
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#F59E0B', width: '100%' }]} onPress={() => handleResolveRequest(item)}>
                  <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
                </TouchableOpacity>
              )
            ) : null}

            {isFulfilled ? (
              <View style={[styles.helpBtn, { backgroundColor: '#D1FAE5', width: '100%' }]}>
                <Text style={[styles.helpBtnText, { color: '#166534' }]}>Completed ✅</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleShareRequest(item)}>
            <Ionicons name="share-social-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {!(item.user_id === user?.id || item.sender_id === user?.id || item.organizer_id === user?.id) && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 13, color: '#64748B', fontFamily: FONTS.regular }}>
                Want to attend?
              </Text>
              {rsvp === 'yes' && (
                <Text style={{ fontSize: 11, color: '#1D9BF0', marginTop: 2, fontFamily: FONTS.regular }}>
                  Your response has been shared with organizer.
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleAttendPress(item.id, rsvp !== 'yes', item)}
              style={{
                backgroundColor: rsvp === 'yes' ? '#1D9BF0' : '#FFFFFF',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#1D9BF0',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: rsvp === 'yes' ? '#FFFFFF' : '#1D9BF0', fontSize: 13, fontWeight: '700' }}>
                I will attend
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  const renderFestivalItem = ({ item, index }: { item: any; index: number }) => {
    const festImg = getCommunityFestivalImage(item.name);
    
    let formattedDate = 'Upcoming';
    if (item.date) {
      try {
        const d = parseUTCDate(item.date);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          formattedDate = `${day}/${month}/${d.getFullYear()}`;
        }
      } catch (err) {
        console.warn('Failed to parse date in card', err);
      }
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/festival-detail?index=${index}`)}
        style={[styles.festivalTypeCard, { backgroundColor: item.color || '#FFF5F0' }]}
      >
        <View style={styles.festivalIconCircle}>
          {festImg ? (
            <Image
              source={festImg}
              style={{ width: '100%', height: '100%', borderRadius: 28 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="calendar-outline" size={24} color="#FF6B00" />
          )}
        </View>
        <Text style={styles.festivalTypeName}>{item.name}</Text>
        <View style={styles.festivalEventCount}>
          <Text style={styles.festivalEventCountText}>{formattedDate}</Text>
        </View>
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

  const renderFestivalEvent = ({ item }: { item: any }) => (
    <View style={styles.festEventCard}>
      <View style={styles.festEventMain}>
        <CommunityMediaItem
          media={item.image}
          style={styles.festEventImage}
          isActive={activeVideoKey === (item.id ? String(item.id) : '')}
        />
        <View style={styles.festEventInfo}>
          <Text style={styles.festEventTitle}>{item.title}</Text>
          <Text style={styles.festEventDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.festEventMeta}>
            <TouchableOpacity 
              style={styles.festMetaRow}
              onPress={() => handleOpenMap(item.location)}
              disabled={!item.location || item.location === 'Online' || item.location === 'Local'}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={14} color={item.location && item.location !== 'Online' && item.location !== 'Local' ? "#FF6B00" : "#FF3B30"} />
              <Text style={[styles.festMetaText, item.location && item.location !== 'Online' && item.location !== 'Local' && { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>{item.location}</Text>
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.attendBtn} onPress={() => handleFestivalInterest(item)}>
            <Text style={styles.attendBtnText}>Set a reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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

  const renderRequestItem = ({ item }: { item: any }) => {
    const iconDetails = getRequestIconDetails(item);
    const isFulfilled = item.status === 'fulfilled' || item.status === 'resolved' || item.status === 'done';
    const phone = item.contact_number || item.contact || item.user_phone;
    const ownerName = item.user_name || item.user?.name || 'Requester';
    const requestTypeLabel = item.request_type ? String(item.request_type).toUpperCase() : 'REQUEST';
    
    return (
      <View style={styles.festEventCard}>
        <View style={[styles.requestOwnerRow, { alignItems: 'flex-start', justifyContent: 'flex-start', marginBottom: 8 }]}>
          <Avatar name={ownerName} photo={item.user?.photo} size={40} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={styles.feedPostUserName} numberOfLines={1}>{ownerName}</Text>
              {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6B00" style={{ marginLeft: 2 }} />}
              <Text style={styles.postHandle} numberOfLines={1}>
                {item.user?.handle ? ` ${item.user.handle}` : ` @${ownerName.replace(/\s+/g, '').toLowerCase()}`}
              </Text>
              <Text style={styles.postHandle} numberOfLines={1}> · {getTimeAgo(item.created_at || item.timestamp)}</Text>
              <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>{requestTypeLabel}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[{ backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: isFulfilled ? '#A7F3D0' : '#F0F0F0', padding: 16 }, isFulfilled ? { backgroundColor: '#F0FDF4' } : {}]}>
          <View style={styles.festEventMain}>
            {(item.image || item.image_url || item.media_url) && (
              <CommunityMediaItem
                media={item.image || item.image_url || item.media_url}
                style={styles.festEventImage}
                isActive={activeVideoKey === (item.id ? String(item.id) : '')}
                onPress={() => setFullScreenMedia(typeof (item.image || item.image_url || item.media_url) === 'string' ? (item.image || item.image_url || item.media_url) : (item.image || item.image_url || item.media_url).uri)}
              />
            )}
            <View style={styles.festEventInfo}>
              <Text style={styles.festEventTitle} numberOfLines={2}>{item.title || item.content || 'Request'}</Text>
              {item.description ? (
                <Text style={styles.festEventDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <View style={styles.festEventMeta}>
                {item.location ? (
                  <TouchableOpacity 
                    style={styles.festMetaRow}
                    onPress={() => handleOpenMap(item.location)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={14} color="#FF6B00" />
                    <Text style={[styles.festMetaText, { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <View style={styles.festMetaRow}>
                  <Ionicons name={iconDetails.name as any} size={14} color={iconDetails.color} />
                  <Text style={styles.festMetaText} numberOfLines={1}>{(item.urgency_level || 'Normal').toUpperCase()}</Text>
                </View>
                <View style={styles.festMetaRow}>
                  <Ionicons name="time-outline" size={14} color="#FF3B30" />
                  <Text style={styles.festMetaText} numberOfLines={1}>{getTimeAgo(item.created_at || item.timestamp)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 }} />

          <View style={[styles.eventActionRow, { marginTop: 0, paddingHorizontal: 0 }]}>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
            onPress={() => handleCallPress(phone)}
          >
            <Ionicons name="call" size={18} color="#16A34A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => handleWhatsAppPress(phone, item.title || item.content)}
          >
            <FontAwesome5 name="whatsapp" size={18} color="#059669" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 8 }}>
            {item.user_id === user?.id || item.sender_id === user?.id ? (
              !isFulfilled && (
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#F59E0B', width: '100%' }]} onPress={() => handleResolveRequest(item)}>
                  <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
                </TouchableOpacity>
              )
            ) : !isFulfilled ? (
              (() => {
                const isLostFound = isLostFoundRequest(item);
                const isTemple = isTempleUpdateRequest(item);
                if (!isLostFound && !isTemple) return null;
                const interest = interestMap[item.id] ?? { count: item.interested_count || 0, userInterested: (item.interested_by || []).includes(user?.id) };
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: '#666', flex: 1 }}>
                      {isLostFound ? 'Did you find this?' : 'Will you attend?'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleToggleInterest(item)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: interest.userInterested ? '#D1FAE5' : '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: interest.userInterested ? '#059669' : '#BBF7D0' }}
                    >
                      <Ionicons name="checkmark" size={16} color={interest.userInterested ? '#059669' : '#34D399'} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: interest.userInterested ? '#059669' : '#34D399' }}>
                        {interest.count > 0 ? `${interest.count} ${isLostFound ? 'found' : 'going'}` : isLostFound ? 'Found' : 'Going'}
                      </Text>
                    </TouchableOpacity>
                    {isTemple && !interest.userInterested && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#FEF2F2', padding: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FECACA' }}
                        onPress={() => {}}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()
            ) : null}

            {isFulfilled ? (
              <View style={[styles.helpBtn, { backgroundColor: '#D1FAE5', width: '100%' }]}>
                <Text style={[styles.helpBtnText, { color: '#166534' }]}>Completed ✅</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleShareRequest(item)}>
            <Ionicons name="share-social-outline" size={18} color="#888" />
          </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };


  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = parseUTCDate(dateString);
    if (Number.isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleResolveRequest = (item: any) => {
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
  };

  const executeResolve = async (item: any) => {
    try {
      if (item.request_type) {
        await resolveCommunityRequest(item.id);
      } else {
        const { deletePost } = require('../../src/services/api');
        await deletePost(item.id);
      }
      Alert.alert('Success', 'Request marked as fulfilled successfully!');
      fetchCommunity(true); // Reload requests list!
    } catch (error: any) {
      const { parseApiError } = require('../../src/services/api');
      Alert.alert('Error', parseApiError(error));
    }
  };

  const handleShareRequest = async (item: any) => {
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
  };

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
          const { Linking } = require('react-native');
          Linking.openURL(`tel:${contactNum}`);
        }
      });
    } else if (targetPhone) {
      options.push({
        text: `Call: ${targetPhone}`,
        onPress: () => {
          const { Linking } = require('react-native');
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

  const handleSearch = () => {
    Alert.alert('Search', 'Search feature coming soon to community feed!');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedImage(result.assets[0].uri);
      setSelectedMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setNewMessage(prev => prev + text);
      } else {
        Alert.alert('Clipboard Empty', 'There is no text in your clipboard to paste.');
      }
    } catch (error) {
      console.warn('Clipboard read error:', error);
      Alert.alert('Paste Error', 'Failed to read from clipboard.');
    }
  };

  const handleLike = (postId: string) => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    // Check in discussionPosts
    setDiscussionPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.liked;
        return {
          ...post,
          liked: !isLiked,
          likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1
        };
      }
      return post;
    }));

    // Find the post first to resolve community and subgroup properties correctly
    const matchedPost = communityPosts.find(p => p.id === postId);
    const isCommunityMsg = matchedPost ? !!matchedPost.isCommunityMsg : false;
    const targetSubgroup = matchedPost?.subgroupType || 'city';
    const targetCommunityId = matchedPost?.communityId || (id as string);

    // Also check in communityPosts
    setCommunityPosts(prev => {
      const updated = prev.map(post => {
        if (post.id === postId) {
          const isLiked = post.liked;
          return {
            ...post,
            liked: !isLiked,
            likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1
          };
        }
        return post;
      });
      useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
      return updated;
    });

    if (!postId.startsWith('post-')) {
      (async () => {
        try {
          const { togglePostLike, toggleCommunityMessageLike } = require('../../src/services/api');
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
  };

  const handleRepost = (postId: string) => {
    const postToRepost = discussionPosts.find(p => p.id === postId);
    if (!postToRepost) return;

    const newRepost: DiscussionPost = {
      ...postToRepost,
      id: `repost-${Date.now()}`,
      isRepost: true,
      repostedBy: user?.name || 'You',
      timestamp: 'Just now',
    };

    setDiscussionPosts(prev => [newRepost, ...prev]);

    // Also update the repost count on the original post
    setDiscussionPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, reposts: post.reposts + 1 };
      }
      return post;
    }));

    Alert.alert('Success', 'Post reposted successfully!');
  };

  const handleDeletePost = (postId: string) => {
    const postToDelete = discussionPosts.find(p => p.id === postId) || communityPosts.find(p => p.id === postId);
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
          // Save deleted ID so it is excluded even after re-fetch from server
          const currentDeleted = useChatStore.getState().communityScreenCaches[cacheKey]?.deletedPostIds || [];
          const newDeletedIds = [...new Set([...currentDeleted, postId])];
          useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated, deletedPostIds: newDeletedIds });
          return updated;
        });

        try {
          if (isCommunityMsg) {
            deleteCommunityMessage(communityId, subgroupType, postId).catch((e: any) => console.log('API delete community msg err:', e));
          } else {
            const { deletePost } = require('../../src/services/api');
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
              // Save deleted ID so it is excluded even after re-fetch from server
              const currentDeleted = useChatStore.getState().communityScreenCaches[cacheKey]?.deletedPostIds || [];
              const newDeletedIds = [...new Set([...currentDeleted, postId])];
              useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated, deletedPostIds: newDeletedIds });
              return updated;
            });

            try {
              if (isCommunityMsg) {
                await deleteCommunityMessage(communityId, subgroupType, postId);
              } else {
                const { deletePost } = require('../../src/services/api');
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
  };

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



  const executeCreatePost = async (categoryOverride?: string) => {
    if (!newMessage.trim() && !selectedImage) return;

    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    // Use activeTab as default category (but map 'Others' or empty to 'Feed')
    const finalCategory = (categoryOverride === 'Others' || !categoryOverride) ? 'Feed' : categoryOverride;

    let postLocation: string | undefined = undefined;
    if (finalCategory === 'Lost & Found') {
      try {
        const { ensureForegroundPermission, getCurrentPosition } = require('../../src/services/location');
        const hasPermission = await ensureForegroundPermission();
        if (hasPermission) {
          const pos = await getCurrentPosition({ accuracy: 3 });
          if (pos && pos.coords) {
            const { reverseGeocode } = require('../../src/services/api');
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
    }

    // Split text into chunks of max 250 characters
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
      image: index === 0 ? (selectedImage || undefined) : undefined, // Image only on parent
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
      isUniversal: true, // Flag to show in general Feed
      sender_id: user?.id, // Track ownership of local posts
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

    // Save category so it survives refetch even if API doesn't return it
    textChunks.forEach(chunk => {
      if (chunk.trim()) {
        saveLocalPost(chunk.trim(), finalCategory);
      }
    });

    // Attempt real API send if text or image is present
    (async () => {
      let uploadedUrl: string | undefined = undefined;
      const localImageToUpload = selectedImage;
      if (localImageToUpload) {
        try {
          const { uploadChatMedia } = require('../../src/services/api');
          const isVideoFile = selectedMediaType === 'video' || (typeof localImageToUpload === 'string' && (
            localImageToUpload.toLowerCase().endsWith('.mp4') || 
            localImageToUpload.toLowerCase().endsWith('.mov') || 
            localImageToUpload.toLowerCase().endsWith('.m4v') || 
            localImageToUpload.toLowerCase().endsWith('.webm') ||
            localImageToUpload.toLowerCase().includes('/video/') ||
            localImageToUpload.toLowerCase().includes('video=true')
          ));
          const fileExtension = isVideoFile ? (localImageToUpload.toLowerCase().endsWith('.mov') ? 'mov' : 'mp4') : 'jpg';
          const fileMime = isVideoFile ? (localImageToUpload.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4') : 'image/jpeg';

          const uploadRes = await uploadChatMedia({
            uri: localImageToUpload,
            name: `community_post_${Date.now()}.${fileExtension}`,
            type: fileMime
          });
          uploadedUrl = uploadRes?.data?.media_url || uploadRes?.data?.mediaUrl || uploadRes?.data?.url || uploadRes?.url || uploadRes?.mediaUrl;
          console.log('[Community] Media uploaded successfully:', uploadedUrl);
        } catch (error) {
          console.error('[Community] Media upload failed:', error);
        }
      }

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
              i === 0 ? (postLocation || undefined) : undefined
            );
            console.log(`[Community] Real thread chunk ${i + 1} sent`);

            // Deduplicate by updating the optimistic post with the real server ID and URL
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
            Alert.alert('Post Failed', errMsg);
            // Remove the optimistic post on failure
            if (Platform.OS === 'ios') {
              newPosts.forEach(np => {
                iosUserCreatedPostIds.delete(String(np.id));
              });
            }
            setCommunityPosts(prev => {
              const updated = prev.filter(p => !newPosts.some(np => np.id === p.id));
              if (Platform.OS === 'ios') {
                useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
              }
              return updated;
            });
            break;
          }
        }
      }
    })();

    setNewMessage('');
    setSelectedImage(null);
    setSelectedMediaType(null);
    setContactNumber('');
    setSevaDetails('');
    setShowCreateModal(false);

    // No longer switching tabs automatically to keep the user in their current context
    // The post will appear immediately in the Feed and its specific category
    // For Events with a date set, schedule a 5-min reminder for the creator
    if (finalCategory === 'Events' && eventDate) {
      scheduleEventReminderNotification(
        newMessage.trim() || 'Community Event',
        eventDate.toISOString(),
        id as string
      ).catch(e => console.warn('[Community] Failed to schedule event reminder on create:', e));
    }

    Alert.alert('Success', textChunks.length > 1 ? 'Your thread has been shared with the community!' : 'Your post has been shared with the community!');
  };

  const handleShare = async (postId: string) => {
    try {
      const appLink = `https://brahmand.app/community/${id}?postId=${postId}`;

      await Share.share({
        message: `Check out this community post on Brahmand!\n\n${appLink}`,
      });

      setDiscussionPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, shares: (post.shares || 0) + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleOpenCommentModal = async (post: any) => {
    setActiveComments([]);
    setShowCommentModal(post);
    setCommentText('');
    try {
      const { getPostComments, getCommunityMessageComments } = require('../../src/services/api');
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
  };

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

    try {
      const { addPostComment, addCommunityMessageComment } = require('../../src/services/api');
      let response;
      if (showCommentModal.isCommunityMsg) {
        response = await addCommunityMessageComment(showCommentModal.communityId || id, showCommentModal.subgroupType || 'city', targetPostId, textToSend);
      } else {
        response = await addPostComment(targetPostId, textToSend);
      }

      // Replace optimistic comment with server-returned comment (has real id, userId etc.)
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

      // Update comment count on communityPosts and cache
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

      // Update discussionPosts
      setDiscussionPosts(prev => prev.map(post => {
        if (post.id === targetPostId) {
          return { ...post, comments: (post.comments || 0) + 1 };
        }
        return post;
      }));
      setShowCommentModal(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
    } catch (error) {
      console.error('Failed to post comment:', error);
      // Rollback comment on error
      setActiveComments(prev => prev.filter(c => c.id !== tempId));
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    const commentToDelete = activeComments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    // Delete comment immediately from the state without confirmation popups
    setActiveComments(prev => prev.filter(c => c.id !== commentId));

    const targetPostId = showCommentModal?.id;
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
      const { deleteComment: deleteCommentApi } = require('../../src/services/api');
      deleteCommentApi(commentId).catch((e: any) => console.log('API delete comment err:', e));
    } catch (error) {
      console.log('[Community] Comment delete API error:', error);
    }
  };


  if (loading) {
    if (Platform.OS === 'android') {
      // ⚡ Android: Show skeleton UI with header so screen feels responsive immediately
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#FF8C3A', '#FFAD7D', '#FFD4AA', '#FFF1E8', '#FFFFFF']}
            locations={[0, 0.25, 0.55, 0.8, 1]}
            style={[styles.headerGradientContainer, { paddingTop: insets.top }]}
          >
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={() => router.replace('/(tabs)/messages')} style={styles.headerBackButton}>
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
          <View style={{ flex: 1, backgroundColor: '#FFF', padding: 16 }}>
            {[1, 2, 3, 4].map(k => (
              <View key={k} style={{ backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0' }} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <View style={{ width: '45%', height: 11, backgroundColor: '#E0E0E0', borderRadius: 6, marginBottom: 6 }} />
                    <View style={{ width: '25%', height: 9, backgroundColor: '#EBEBEB', borderRadius: 5 }} />
                  </View>
                </View>
                <View style={{ width: '90%', height: 10, backgroundColor: '#E8E8E8', borderRadius: 5, marginBottom: 6 }} />
                <View style={{ width: '70%', height: 10, backgroundColor: '#EFEFEF', borderRadius: 5 }} />
              </View>
            ))}
            <ActivityIndicator size="small" color="#FF8C3A" style={{ marginTop: 8 }} />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
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
        keyExtractor={(item, index) => {
          if (item.id) return String(item.id);
          return `${item.type || 'item'}-${index}`;
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={Platform.OS === 'android' ? 5 : 10}
        maxToRenderPerBatch={Platform.OS === 'android' ? 3 : 5}
        windowSize={Platform.OS === 'android' ? 3 : 5}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 100 : 50}
        renderItem={({ item }) => {
          if (item.type === 'festivals_header') {
            return (
              <View style={[styles.sectionHeader, { marginBottom: 10 }]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="calendar" size={24} color="#0EA5E9" style={{ marginRight: 10 }} />
                  <Text style={[styles.sectionTitle, { fontSize: 22 }]}>Festivals</Text>
                </View>
                <TouchableOpacity style={styles.filterDropdown} onPress={() => setShowFilterDropdown(!showFilterDropdown)}>
                  <Text style={styles.filterText} numberOfLines={1}>{selectedFestival || 'All Festivals'}</Text>
                  <Ionicons name="chevron-down" size={16} color="#444" />
                </TouchableOpacity>
              </View>
            );
          }
          if (item.type === 'festivals_list') {
            return (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={allFestivals}
                keyExtractor={(f, i) => f.id ? String(f.id) : `fest-${i}`}
                renderItem={renderFestivalItem}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 25 }}
              />
            );
          }
          if (item.type === 'festival_events_header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: 18 }]}>Upcoming Festival Events</Text>
                <TouchableOpacity style={styles.filterDropdown} onPress={() => setShowSortDropdown(!showSortDropdown)}>
                  <Text style={styles.filterText}>{festivalSort === 'latest' ? 'Latest First' : 'Oldest First'}</Text>
                  <Ionicons name="chevron-down" size={16} color="#444" />
                </TouchableOpacity>
              </View>
            );
          }
          if (item.type === 'festival_event') {
            return renderFestivalEvent({ item });
          }
          if (item.type === 'festival_banner') {
            return (
              <View style={styles.festBanner}>
                <View style={styles.festBannerLeft}>
                  <Ionicons name="sparkles-outline" size={28} color="#FF6B00" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.festBannerTitle}>Share the Joy of Festivals!</Text>
                    <Text style={styles.festBannerSub}>Create a festival post and invite others to be a part of the celebration.</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.createFestBtn} onPress={() => { setPostCategory('Festivals'); setShowCreateModal(true); }}>
                  <Text style={styles.createFestBtnText}>Create Festival Post</Text>
                </TouchableOpacity>
              </View>
            );
          }
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name={item.icon || "chatbubbles-outline"} size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
              </View>
            );
          }
          if (activeTab === 'Seva') {
            return renderSevaItem({ item });
          }
          if (activeTab === 'Lost & Found' || activeTab === 'Temple Updates') {
            return renderRequestItem({ item });
          }
          if (item.isRequestItem || item.type === 'request_item') {
            return renderRequestItem({ item });
          }
          if (activeTab === 'Requests') {
            return renderRequestItem({ item });
          }
          if (activeTab === 'Events') {
            return renderEventItem({ item });
          }
          return renderDiscussionItem({ item });
        }}
        onEndReached={activeTab === 'Feed' ? handleLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (activeTab === 'Feed' && loadingMore) ? <ActivityIndicator size="small" color="#FF3B30" style={{ padding: 20 }} /> : null}
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
      <Modal visible={showCreateModal} animationType="fade" transparent={false} hardwareAccelerated>
        <LinearGradient colors={['#FF8D57', '#EA9B76', '#F8EDE7']} locations={[0, 0.14, 0.32]} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 32 : (insets.top || 44) }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={[styles.createModalHeader, { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingTop: 15 }]}>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setPostCategory(''); setShowInlineCategories(false); setNewMessage(''); setSelectedImage(null); setSelectedMediaType(null); }}>
                <Text style={{ fontSize: 16, color: '#0F1419', fontFamily: FONTS.regular }}>Cancel</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 15, color: '#0F1419', fontWeight: '700', fontFamily: FONTS.bold }}>Create Post</Text>

              <TouchableOpacity
                style={[
                  styles.twitterPostBtn,
                  (!newMessage.trim() && !selectedImage) && { opacity: 0.5 }
                ]}
                onPress={handlePostButtonPress}
                disabled={!newMessage.trim() && !selectedImage}
              >
                <Text style={styles.twitterPostBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 12 }}>
                <Avatar name={user?.name || '?'} photo={user?.photo} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {!postCategory ? (
                    <TouchableOpacity
                      onPress={() => setShowInlineCategories(!showInlineCategories)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        gap: 6,
                        backgroundColor: '#FF6600',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons name="pricetag-outline" size={14} color="#FFF" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF', fontFamily: FONTS.bold }}>
                        {t('language') === 'hi' ? 'श्रेणी चुनें *' : 'Choose Category *'}
                      </Text>
                      <Ionicons name={showInlineCategories ? "chevron-up" : "chevron-down"} size={12} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.selectedCategoryBadge, { marginBottom: 10, marginTop: 0 }]}>
                      <Ionicons name="pricetag-outline" size={14} color="#FF6B00" />
                      <Text style={styles.selectedCategoryText}>
                        {t('language') === 'hi' ? 'श्रेणी' : 'Category'}: {getTranslatedTab(postCategory)}
                      </Text>
                      <TouchableOpacity onPress={() => { setPostCategory(''); }}>
                        <Ionicons name="close-circle" size={16} color="#FF6600" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {showInlineCategories && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontFamily: FONTS.bold, color: '#666', marginBottom: 8 }}>
                        {t('language') === 'hi' ? 'श्रेणी का चयन करें' : 'Select Category'}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {POST_CATEGORIES.map((cat) => {
                          let iconColor = '#536471';
                          if (cat === 'Others') iconColor = '#1D9BF0';
                          else if (cat === 'Seva') iconColor = '#E91E63';
                          else if (cat === 'Requests') iconColor = '#FF6B00';
                          else if (cat === 'Events') iconColor = '#00C853';
                          else if (cat === 'Lost & Found') iconColor = '#9C27B0';
                          else if (cat === 'Festivals') iconColor = '#FF9800';
                          else if (cat === 'Temple Updates') iconColor = '#795548';

                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => {
                                handleInlineCategorySelect(cat);
                                setShowInlineCategories(false);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#FFF',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: `${iconColor}30`,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1,
                              }}
                            >
                              <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: `${iconColor}15`,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 6
                              }}>
                                <Ionicons
                                  name={
                                    cat === 'Others' ? 'chatbubble-ellipses-outline' :
                                    cat === 'Seva' ? 'heart-outline' :
                                    cat === 'Requests' ? 'alert-circle-outline' :
                                    cat === 'Events' ? 'calendar-outline' :
                                    cat === 'Lost & Found' ? 'search-outline' :
                                    cat === 'Festivals' ? 'flame-outline' :
                                    'home-outline'
                                  }
                                  size={12}
                                  color={iconColor}
                                />
                              </View>
                              <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: '#333' }}>
                                {getTranslatedTab(cat)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  <MentionInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder={
                      t('language') === 'hi'
                        ? (postCategory ? 'क्या चल रहा है?' : 'लिखना शुरू करने के लिए ऊपर एक श्रेणी चुनें...')
                        : (postCategory ? "What's happening?" : "Select a category above to start writing...")
                    }
                    placeholderTextColor="#536471"
                    multiline
                    editable={!!postCategory}
                    inputStyle={{
                      fontSize: 18,
                      color: '#0F1419',
                      minHeight: 120,
                      textAlignVertical: 'top',
                      paddingTop: 4,
                      lineHeight: 24,
                      opacity: postCategory ? 1 : 0.6
                    }}
                    autoFocus={!!postCategory}
                  />

                  {/* Add Photo option directly beneath the input box for better accessibility */}
                  {!selectedImage ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (!postCategory) {
                          Alert.alert('', t('language') === 'hi' ? 'लिखना शुरू करने के लिए ऊपर एक श्रेणी चुनें...' : 'Select a category above to start writing...');
                          return;
                        }
                        handlePickImage();
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        gap: 6,
                        backgroundColor: !postCategory ? '#F0F0F0' : 'rgba(255, 102, 0, 0.08)',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: !postCategory ? '#E0E0E0' : 'rgba(255, 102, 0, 0.2)',
                      }}
                    >
                      <Ionicons name="images-outline" size={18} color={!postCategory ? "#A0A0A0" : "#FF6600"} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: !postCategory ? "#A0A0A0" : "#FF6600", fontFamily: FONTS.bold }}>
                        Add Media
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden', width: '100%', height: 250 }}>
                      <CommunityMediaItem media={selectedImage} style={{ width: '100%', height: '100%' }} isActive={true} />
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 4 }}
                        onPress={() => { setSelectedImage(null); setSelectedMediaType(null); }}
                      >
                        <Ionicons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {postCategory === 'Events' && (
                    <View style={{ marginTop: 15, backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F1419', marginBottom: 10 }}>Event Date & Time</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          onPress={openEventDatePicker}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' }}
                        >
                          <Ionicons name="calendar-outline" size={18} color="#FF6600" />
                          <Text style={{ marginLeft: 8, fontSize: 13, color: eventDate ? '#000' : '#888' }}>
                            {eventDate ? (() => {
                              const day = String(eventDate.getDate()).padStart(2, '0');
                              const month = String(eventDate.getMonth() + 1).padStart(2, '0');
                              return `${day}/${month}/${eventDate.getFullYear()}`;
                            })() : 'Select Date'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={openEventTimePicker}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' }}
                        >
                          <Ionicons name="time-outline" size={18} color="#FF6600" />
                          <Text style={{ marginLeft: 8, fontSize: 13, color: eventDate ? '#000' : '#888' }}>
                            {eventDate ? formatTimeIST(eventDate) : 'Select Time'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {showDatePicker && Platform.OS !== 'android' && (
                        <DateTimePicker
                          value={eventDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (event.type === 'set' && selectedDate) {
                              const currentDate = eventDate || new Date();
                              selectedDate.setHours(currentDate.getHours(), currentDate.getMinutes());
                              setEventDate(selectedDate);
                            }
                          }}
                        />
                      )}

                      {showTimePicker && Platform.OS !== 'android' && (
                        <DateTimePicker
                          value={eventDate || new Date()}
                          mode="time"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowTimePicker(false);
                            if (event.type === 'set' && selectedDate) {
                              const newDate = new Date(eventDate || new Date());
                              newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                              setEventDate(newDate);
                            }
                          }}
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>

            </KeyboardAwareScrollView>

            {/* Keyboard-docked toolbar with minimalist layout matching premium look */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.05)',
              backgroundColor: 'rgba(255,255,255,0.5)'
            }}>
              <View />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CharacterProgressCircle textLength={newMessage.length} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        </LinearGradient>
      </Modal>

      {/* Category Selector Bottom Sheet — shown when Post is tapped */}
      <Modal
        visible={showCategorySelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategorySelector(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setShowCategorySelector(false)}
        >
          <View
            style={{
              backgroundColor: '#FFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 24),
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -4 },
              elevation: 12,
            }}
            onStartShouldSetResponder={() => true}
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} />
            </View>

            <Text style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#0F1419',
              textAlign: 'center',
              marginBottom: 16,
              fontFamily: FONTS.bold,
            }}>
              Choose a Category
            </Text>

            <KeyboardAwareScrollView
              style={{ maxHeight: 400, paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {POST_CATEGORIES.map(cat => {
                let iconName: any = 'ellipse-outline';
                let iconColor = '#536471';
                let desc = '';
                if (cat === 'Others') { iconName = 'chatbubble-ellipses-outline'; iconColor = '#1D9BF0'; desc = 'General community discussion'; }
                else if (cat === 'Seva') { iconName = 'heart-outline'; iconColor = '#E91E63'; desc = 'Seva, donations & volunteer work'; }
                else if (cat === 'Requests') { iconName = 'alert-circle-outline'; iconColor = '#FF6B00'; desc = 'Help requests, blood needs, etc.'; }
                else if (cat === 'Events') { iconName = 'calendar-outline'; iconColor = '#00C853'; desc = 'Community events & gatherings'; }
                else if (cat === 'Lost & Found') { iconName = 'search-outline'; iconColor = '#9C27B0'; desc = 'Lost or found items'; }
                else if (cat === 'Festivals') { iconName = 'flame-outline'; iconColor = '#FF9800'; desc = 'Festival celebrations & updates'; }
                else if (cat === 'Temple Updates') { iconName = 'home-outline'; iconColor = '#795548'; desc = 'Temple news & renovations'; }

                return (
                  <TouchableOpacity
                    key={cat}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      marginBottom: 6,
                      backgroundColor: '#FAFAFA',
                      borderWidth: 1,
                      borderColor: '#F0F0F0',
                    }}
                    onPress={() => handleCategorySelectedAndPost(cat)}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${iconColor}15`,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}>
                      <Ionicons name={iconName} size={22} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: '#0F1419',
                        }}>
                          {cat}
                        </Text>
                        {cat === 'Requests' && !isKycVerified && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#FFF3E0',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}>
                            <Ionicons name="shield-checkmark" size={12} color="#FF6B00" />
                            <Text style={{ fontSize: 10, color: '#FF6B00', fontWeight: '700', marginLeft: 3 }}>KYC Required</Text>
                          </View>
                        )}
                      </View>
                      {desc ? (
                        <Text style={{
                          fontSize: 12,
                          color: '#536471',
                          marginTop: 2,
                        }}>
                          {desc}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                  </TouchableOpacity>
                );
              })}
            </KeyboardAwareScrollView>
          </View>
        </TouchableOpacity>
      </Modal>



      {/* Full Screen Media Modal */}
      <Modal visible={!!fullScreenMedia} transparent={true} animationType="fade" onRequestClose={() => setFullScreenMedia(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }} onPress={() => setFullScreenMedia(null)}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {fullScreenMedia && (
            <CommunityMediaItem 
              media={{ uri: fullScreenMedia }} 
              style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.8 }} 
            />
          )}
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={!!showCommentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCommentModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.modalOverlay}
        >
          <ToastContainer />
          <View style={[styles.commentModalContent, { paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 8 : 12) : (keyboardVisible ? 10 : Math.max(insets.bottom, 20)) }]}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>
                {t('language') === 'hi'
                  ? `टिप्पणियाँ (${showCommentModal?.comments ?? activeComments.length ?? 0})`
                  : `Comments (${showCommentModal?.comments ?? activeComments.length ?? 0})`}
              </Text>
              <TouchableOpacity onPress={() => setShowCommentModal(null)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView style={styles.commentsList} keyboardShouldPersistTaps="handled">
              {activeComments.filter(comment => {
                const uid = comment.userId || comment.user_id || comment.sender_id || comment.user?.id;
                return !uid || !blockedUserIds.includes(String(uid));
              }).length > 0 ? (
                activeComments
                  .filter(comment => {
                    const uid = comment.userId || comment.user_id || comment.sender_id || comment.user?.id;
                    return !uid || !blockedUserIds.includes(String(uid));
                  })
                  .map((comment, index, filteredArray) => (
                    <View key={comment.id} style={{ flexDirection: 'row', marginBottom: 20, position: 'relative' }}>
                      {/* Thread connector line for replies */}
                      {index < filteredArray.length - 1 && (
                      <View style={{ position: 'absolute', left: 16, top: 36, bottom: -20, width: 2, backgroundColor: '#CFD9DE', zIndex: -1 }} />
                    )}
                    <View style={{ marginRight: 12 }}>
                      <Avatar name={comment.userName} photo={comment.avatar} size={32} />
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#F7F9F9', padding: 12, borderRadius: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                          <Text style={{ fontWeight: '700', fontSize: 14, color: '#0F1419' }} numberOfLines={1}>{comment.userName}</Text>
                          {comment.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
                        </View>
                        {comment.userId === user?.id ? (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => handleDeleteComment(comment.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => handleCommentMenuPress(comment)}
                          >
                            <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text selectable={true} style={{ fontSize: 14, color: '#536471', marginTop: 4, lineHeight: 18 }}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                  <Ionicons name="chatbubble-outline" size={40} color="#CCC" />
                  <Text style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
                    {t('language') === 'hi'
                      ? 'अभी तक कोई टिप्पणी नहीं है। टिप्पणी करने वाले पहले व्यक्ति बनें!'
                      : 'No comments yet. Be the first to comment!'}
                  </Text>
                </View>
              )}
            </KeyboardAwareScrollView>

            <View style={styles.commentInputRow}>
              <Avatar name={user?.name || '?'} photo={user?.photo} size={32} />
              <MentionInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={t('language') === 'hi' ? 'एक टिप्पणी जोड़ें...' : 'Add a comment...'}
                placeholderTextColor="#888"
                inputStyle={styles.commentInput}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                <Text style={[styles.postCommentBtn, !commentText.trim() && { opacity: 0.5 }]}>
                  {t('language') === 'hi' ? 'पोस्ट' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight : 0 }} />}
            {Platform.OS === 'android' && (
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
                postId={pendingReportComment?.post_id || showCommentModal?.id || commentModalToRestore?.id || ''}
                apiFallback={async (reason, description) => {
                  if (pendingReportComment?.id) {
                    await reportComment(String(pendingReportComment.id), reason, description || '');
                  }
                }}
                onSuccess={() => {
                  // Keep reported comment visible
                  if (pendingReportComment) {
                    setKeptComments(prev => {
                      if (prev.some(c => c.id === pendingReportComment.id)) return prev;
                      return [...prev, pendingReportComment];
                    });
                  }
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Attendees Modal */}
      <Modal visible={!!showAttendeesModal} animationType="fade" transparent={true} onRequestClose={() => setShowAttendeesModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setShowAttendeesModal(null)} />
          <View style={[styles.bottomSheet, { height: '60%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 20 }}>Event Attendees</Text>

            {attendeesLoading ? (
              <ActivityIndicator size="large" color="#FF6B00" />
            ) : (
              <FlatList
                data={attendeesList}
                keyExtractor={(u) => u.id}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Avatar name={item.name} photo={item.photo} size={40} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>@{item.sl_id}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Ionicons name="people-outline" size={48} color="#CCC" />
                    <Text style={{ color: '#888', marginTop: 12 }}>No one has joined yet.</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Group Info Modal */}
      <Modal visible={showGroupInfoModal} animationType="fade" transparent={true} onRequestClose={() => setShowGroupInfoModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowGroupInfoModal(false)}>
          <TouchableOpacity activeOpacity={1} style={{ width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>Group Info</Text>
              <TouchableOpacity onPress={() => setShowGroupInfoModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, color: '#536471', marginBottom: 20, lineHeight: 20 }}>
                {community?.description || 'Connect with your local community. Share updates, requests, and engage with devotees.'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 10 }}>Members ({getCommunityMemberCount(community)})</Text>
              
              <View style={{ gap: 15 }}>
                {community?.members_details ? (
                  community.members_details.map((member: any, idx: number) => (
                    <View key={`member-detail-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar name={member.name} photo={member.photo} size={40} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{member.name}</Text>
                        <Text style={{ 
                          fontSize: 13, 
                          color: member.role === 'Owner' || member.role === 'Admin' ? '#FF6B00' : '#888', 
                          fontWeight: '500' 
                        }}>
                          {member.role}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <>
                    {community?.owner_id && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar name={community?.owner_name || (community?.owner_id === user?.id ? (user?.name || '') : 'Community Owner')} size={40} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>
                            {community?.owner_name || (community?.owner_id === user?.id ? user?.name : 'Community Owner')}
                          </Text>
                          <Text style={{ fontSize: 13, color: '#FF6B00', fontWeight: '500' }}>Owner</Text>
                        </View>
                      </View>
                    )}
                    
                    {(community?.admin_names || []).map((adminName: string, idx: number) => (
                      <View key={`admin-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar name={adminName} size={40} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{adminName}</Text>
                          <Text style={{ fontSize: 13, color: '#FF6B00', fontWeight: '500' }}>Admin</Text>
                        </View>
                      </View>
                    ))}

                    {(community?.member_names || []).map((memberName: string, idx: number) => (
                      <View key={`member-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar name={memberName} size={40} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{memberName}</Text>
                          <Text style={{ fontSize: 13, color: '#888', fontWeight: '500' }}>Member</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </KeyboardAwareScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showFilterDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterDropdown(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'transparent' }} 
          activeOpacity={1} 
          onPress={() => setShowFilterDropdown(false)}
        >
          <View style={[styles.twitterDropdownMenu, { top: 220, right: 20 }]}> 
            <KeyboardAwareScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
              {[
                { label: 'All Festivals', value: null },
                ...allFestivals.map(f => ({ label: f.name, value: f.name })),
              ].filter((item, index, self) => self.findIndex(t => t.value === item.value) === index).map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.twitterDropdownItem}
                  onPress={() => {
                    setSelectedFestival(opt.value);
                    setShowFilterDropdown(false);
                  }}
                >
                  <Text style={styles.twitterDropdownText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </KeyboardAwareScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showSortDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortDropdown(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'transparent' }} 
          activeOpacity={1} 
          onPress={() => setShowSortDropdown(false)}
        >
          <View style={[styles.twitterDropdownMenu, { top: 400, right: 20 }]}> 
            {[
              { label: 'Latest First', value: 'latest' },
              { label: 'Oldest First', value: 'oldest' },
            ].map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.twitterDropdownItem}
                onPress={() => {
                  setFestivalSort(opt.value as any);
                  setShowSortDropdown(false);
                }}
              >
                <Text style={styles.twitterDropdownText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
            if (commentModalToRestore) {
              setTimeout(() => {
                setShowCommentModal(commentModalToRestore);
                setCommentModalToRestore(null);
              }, 300);
            }
          }}
          reporterUid={user?.id || ''}
          reportedUserUid={pendingReportComment?.userId || pendingReportComment?.user_id || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
          contentId={String(pendingReportComment?.id || '')}
          contentType="comment"
          postId={pendingReportComment?.post_id || showCommentModal?.id || commentModalToRestore?.id || ''}
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
  eventCard: { width: SCREEN_WIDTH * 0.8, backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginRight: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#F0F0F0' },
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

  discussionCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#F5F5F5' },
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
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  sevaInfoCard: { backgroundColor: '#FFF7ED', borderRadius: 16, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#FDE3CE' },
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
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  commentInput: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14 },
  postCommentBtn: { color: '#FF3B30', fontWeight: '800', fontSize: 14 },

  postContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFF3F4', padding: 12 },
  repostHeaderLabel: { flexDirection: 'row', alignItems: 'center', marginLeft: 40, marginBottom: 4, gap: 4 },
  repostHeaderText: { fontSize: 13, color: '#536471', fontWeight: '700' },
  postMainRow: { flexDirection: 'row' },
  postLeftCol: { marginRight: 12 },
  postRightCol: { flex: 1, overflow: 'hidden' },
  postHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postNameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  feedPostUserName: { fontSize: 15, fontWeight: '700', color: '#0F1419', maxWidth: '65%' },
  postHandle: { fontSize: 15, color: '#536471', marginLeft: 4, flexShrink: 1 },
  postDot: { fontSize: 15, color: '#536471', marginHorizontal: 4 },
  postContentText: { fontSize: 16, color: '#0F1419', lineHeight: 22, marginTop: 4 },
  postMediaImage: { width: '100%', maxWidth: '100%', height: 250, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#EFF3F4', overflow: 'hidden' },
  postActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingRight: 40 },
  postActionCount: { fontSize: 13, color: '#536471' },

  imagePreviewContainer: { marginBottom: 12, position: 'relative', alignSelf: 'flex-start' },
  imagePreview: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 12 },

  filterDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', gap: 6 },
  filterText: { fontSize: 13, color: '#444', fontWeight: '600' },

  festivalTypeCard: { width: 100, padding: 15, borderRadius: 20, marginRight: 12, alignItems: 'center' },
  festivalIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  festivalTypeName: { fontSize: 12, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  festivalEventCount: { alignItems: 'center' },
  festivalEventCountNum: { fontSize: 18, fontWeight: '900', color: '#111' },
  festivalEventCountText: { fontSize: 10, fontWeight: '600', color: '#666' },

  requestOwnerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  requestOwnerMeta: { flex: 1, marginLeft: 12 },
  requestOwnerName: { fontSize: 15, fontWeight: '700', color: '#111' },
  requestOwnerSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  requestOwnerTime: { fontSize: 12, color: '#64748B' },
  festEventCard: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#F5F5F5' },
  festEventMain: { flexDirection: 'row', marginBottom: 12 },
  festEventImage: { width: 90, height: 90, borderRadius: 16 },
  festEventInfo: { flex: 1, marginLeft: 16 },
  festEventTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 6 },
  festEventDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 10 },
  festEventMeta: { gap: 6 },
  festMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  festMetaText: { fontSize: 12, color: '#444', fontWeight: '600', flexShrink: 1 },
  
  festEventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  festOrgDetailsRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  festOrgNameRow: { flexDirection: 'row', alignItems: 'center' },
  festOrgName: { fontSize: 14, fontWeight: '700', color: '#111' },
  festOrgLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  festActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attendBtn: { backgroundColor: '#FFF5F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FFEBE0' },
  attendBtnText: { color: '#FF6B00', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  festMiniBtn: { padding: 4 },

  festBanner: { marginHorizontal: 20, backgroundColor: '#FFF5F0', borderRadius: 20, padding: 15, marginTop: 10, marginBottom: 30, borderWidth: 1, borderColor: '#FFEBE0' },
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
});
