// accessibility: placeholder
import { formatTimeIST } from '../../src/utils/dateUtils';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  Platform,
  TextInput,
  Image,
  ImageBackground,
  Animated,
  Dimensions,
  Linking,
  InteractionManager,
  Keyboard,
} from 'react-native';
import { InstagramRefreshControl } from '../../src/components/CustomRefreshControl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from '../../src/utils/i18n';
import { useScrollToHideTabBar } from '../../src/utils/scroll';
import Svg, { Path } from 'react-native-svg';
import {
  getCircles,
  getCommunities,
  getCommunityRequests,
  getConversations,
  parseApiError,
  resolveCommunityRequest,
  discoverCommunities,
  joinCommunityDirect,
  getMyCreationRequests,
  clearDirectMessages,
} from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { getAllMutedConversations } from '../../src/services/mutedChats';
import { SyncManager } from '../../src/database/syncManager';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/database';

const { width } = Dimensions.get('window');
const CONVERSATIONS_CACHE_KEY = 'conversations_cache';
const COMMUNITIES_CACHE_KEY = 'communities_cache';
const USER_GROUPS_CACHE_KEY = 'user_groups_discover_cache';
const USER_GROUPS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let initialCommunityFetchDone = false;
let initialChatFetchDone = false;

// Responsive row component for chats with instant tap feedback
const PressableDepthRow = ({ children, onPress, onLongPress, style }: any) => {
  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}
    }
    onLongPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.65}
      style={style}
      onPress={onPress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={500}
    >
      {children}
    </TouchableOpacity>
  );
};


// Cache helpers
const getCachedData = async (key: string) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
};

const setCachedData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { }
};

const formatLastMessage = (lastMessage: string | undefined, isHindi: boolean): string => {
  if (!lastMessage) return '';

  const trimmed = lastMessage.trim();

  // 1. Check if it looks like a JSON string
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.postId || parsed.post_id || parsed.mediaUrl || parsed.media_url || parsed.media_type) {
        if (parsed.media_type === 'video' || parsed.mediaType === 'video') {
          return isHindi ? '🎥 वीडियो' : '🎥 Video';
        }
        if (parsed.media_type === 'image' || parsed.mediaType === 'image') {
          return isHindi ? '📷 फोटो' : '📷 Photo';
        }
        return isHindi ? 'साझा की गई पोस्ट' : 'Shared Post';
      }
      if (parsed.phone || parsed.name) {
        return isHindi ? '👤 संपर्क' : '👤 Contact';
      }
    } catch (e) {
      // JSON parse error, fallback to regex check below
    }
  }

  // 2. Regex check for stringified JSON or shared post structure
  const rawString = trimmed.toLowerCase();
  if (rawString.includes('post_id') || rawString.includes('postid') || rawString.includes('media_url') || rawString.includes('mediaurl')) {
    return isHindi ? 'साझा की गई पोस्ट' : 'Shared Post';
  }

  // 3. Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const cleanUrl = trimmed.split('?')[0].toLowerCase();
    const isImage = cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.includes('/images/') || cleanUrl.includes('/photo/') || cleanUrl.includes('image');
    const isVideo = cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mkv') || cleanUrl.includes('/videos/') || cleanUrl.includes('video');

    if (isImage) {
      return isHindi ? '📷 फोटो' : '📷 Photo';
    }
    if (isVideo) {
      return isHindi ? '🎥 वीडियो' : '🎥 Video';
    }
    return isHindi ? 'लिंक' : 'Link';
  }

  // 4. Check for contact format "Name\nPhone"
  const lines = trimmed.split('\n');
  if (lines.length >= 2) {
    const possiblePhone = lines[lines.length - 1].replace(/[\s\-\(\)\+]/g, '');
    if (/^\d+$/.test(possiblePhone) && possiblePhone.length >= 7) {
      return isHindi ? '👤 संपर्क' : '👤 Contact';
    }
  }

  return lastMessage;
};

interface Circle {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  member_count: number;
  last_message?: string;
  last_message_time?: string;
}

interface Community {
  id: string;
  name: string;
  type: string;
  label?: string;
  member_count: number;
  photo?: string;
  is_default?: boolean;
}

interface CommunityRequest {
  id: string;
  user_id: string;
  user_name?: string;
  request_type: string;
  title: string;
  description: string;
  contact_number: string;
  urgency_level: string;
  status: string;
  created_at: string;
  blood_group?: string;
  location?: string;
  support_needed?: string;
}

interface DMConversation {
  conversation_id?: string;
  chat_id?: string;
  id?: string;
  user?: {
    id: string;
    name: string;
    sl_id: string;
    photo?: string;
    is_verified?: boolean;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

function MessagesScreen({
  observedCommunities = [],
  observedConversations = [],
}: {
  observedCommunities?: any[];
  observedConversations?: any[];
}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, logout } = useAuthStore();
  const homeLoc = user?.home_location;
  const hasValidLocation = !!(
    homeLoc &&
    typeof homeLoc === 'object' &&
    (homeLoc.city || homeLoc.state || homeLoc.area || homeLoc.country || (homeLoc as any).display_name)
  ) || !!(user?.location) || !!((user as any)?.default_communities && (user as any).default_communities.length > 0);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [communityHeaderLayout, setCommunityHeaderLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const onMessagesScrollTabBar = useScrollToHideTabBar();

  const [activeTopTab, setActiveTopTab] = useState<'Community' | 'Private Chat'>('Community');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const segmentAnim = useRef(new Animated.Value(0)).current;

  const handleTabSwitch = (tab: 'Community' | 'Private Chat') => {
    if (tab === activeTopTab) return;
    setActiveTopTab(tab);
    Animated.spring(segmentAnim, {
      toValue: tab === 'Community' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);
  const activeRequestScrollRef = useRef<ScrollView>(null);

  const [apiCommunities, setApiCommunities] = useState<any[]>([]);
  const [apiCircles, setApiCircles] = useState<any[]>([]);
  const [apiDMs, setApiDMs] = useState<any[]>([]);
  const [dmMetadataMap, setDmMetadataMap] = useState<Record<string, { senderId?: string; status?: string }>>({});

  // C) Debounce Socket / DB Updates (500ms debounce to prevent high-frequency re-renders)
  const [debouncedConversations, setDebouncedConversations] = useState(observedConversations);
  const socketDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (socketDebounceRef.current) {
      clearTimeout(socketDebounceRef.current);
    }
    socketDebounceRef.current = setTimeout(() => {
      setDebouncedConversations(observedConversations);
    }, 500);

    return () => {
      if (socketDebounceRef.current) {
        clearTimeout(socketDebounceRef.current);
      }
    };
  }, [observedConversations]);

  // A) Conversations Lazy Loading (Initial load: 20 conversations, paginate on scroll)
  const [visibleConversationCount, setVisibleConversationCount] = useState(20);

  useEffect(() => {
    setVisibleConversationCount(20);
  }, [searchQuery, activeTopTab]);

  const communities = useMemo(() => {
    const source = Platform.OS === 'web' ? apiCommunities : observedCommunities;
    return source.filter((c: any) => c.type !== 'user_group');
  }, [observedCommunities, apiCommunities]);

  const circles = useMemo(() => {
    if (Platform.OS === 'web') {
      return apiCircles.map((c: any) => ({
        id: c.id,
        name: c.name,
        photo: c.photo,
        member_count: c.member_count || 0,
        last_message: c.last_message,
        last_message_time: c.last_message_time || c.updated_at ? formatTimeIST(c.last_message_time || c.updated_at) : '',
      }));
    }
    const dbCircles = debouncedConversations
      .filter(c => c.type === 'circle')
      .map(c => ({
        id: c.id,
        name: c.name,
        photo: c.photo,
        member_count: c.memberCount || 0,
        last_message: c.lastMessage,
        last_message_time: c.lastMessageAt ? formatTimeIST(c.lastMessageAt) : '',
      }));
    if (dbCircles.length === 0 && apiCircles.length > 0) {
      return apiCircles.map((c: any) => ({
        id: c.id,
        name: c.name,
        photo: c.photo,
        member_count: c.member_count || 0,
        last_message: c.last_message,
        last_message_time: c.last_message_time || c.updated_at ? formatTimeIST(c.last_message_time || c.updated_at) : '',
      }));
    }
    return dbCircles;
  }, [debouncedConversations, apiCircles]);

  const conversations = useMemo(() => {
    if (Platform.OS === 'web') {
      return apiDMs.map((c: any) => {
        const convId = c.conversation_id || c.chat_id || c.id;
        return {
          id: convId,
          conversation_id: convId,
          user: {
            id: c.user?.id || '',
            name: c.user?.name || '',
            sl_id: c.user?.sl_id || '',
            photo: c.user?.photo || '',
            is_verified: c.user?.is_verified || false,
          },
          last_message: c.last_message,
          last_message_at: c.last_message_at || c.updated_at ? new Date(c.last_message_at || c.updated_at).toISOString() : undefined,
          last_message_status: c.last_message_status,
          last_message_sender_id: c.last_message_sender_id,
        };
      });
    }
    const dbDMs = debouncedConversations
      .filter(c => c.type === 'dm')
      .map(c => {
        const lastMsgMeta = dmMetadataMap[c.id];
        return {
          id: c.id,
          conversation_id: c.id,
          user: {
            id: c.otherUserId || '',
            name: c.name,
            sl_id: c.slId || '',
            photo: c.photo,
            is_verified: false,
          },
          last_message: c.lastMessage,
          last_message_at: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : undefined,
          last_message_status: lastMsgMeta?.status,
          last_message_sender_id: lastMsgMeta?.senderId,
        };
      });
    if (dbDMs.length === 0 && apiDMs.length > 0) {
      return apiDMs.map((c: any) => {
        const convId = c.conversation_id || c.chat_id || c.id;
        return {
          id: convId,
          conversation_id: convId,
          user: {
            id: c.user?.id || '',
            name: c.user?.name || '',
            sl_id: c.user?.sl_id || '',
            photo: c.user?.photo || '',
            is_verified: c.user?.is_verified || false,
          },
          last_message: c.last_message,
          last_message_at: c.last_message_at || c.updated_at ? new Date(c.last_message_at || c.updated_at).toISOString() : undefined,
          last_message_status: c.last_message_status,
          last_message_sender_id: c.last_message_sender_id,
        };
      });
    }
    return dbDMs;
  }, [debouncedConversations, apiDMs, dmMetadataMap]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return circles;
    return circles.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.last_message || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, circles]);

  const filteredAll = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(chat =>
      (chat.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.last_message || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, conversations]);

  const paginatedConversations = useMemo(() => {
    return filteredAll.slice(0, visibleConversationCount);
  }, [filteredAll, visibleConversationCount]);

  const [userGroups, setUserGroups] = useState<Community[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [mutedConversations, setMutedConversations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);
  const [hierarchyExpanded, setHierarchyExpanded] = useState(false);
  const [hierarchyChildHeight, setHierarchyChildHeight] = useState(176);
  const hierarchyExpandAnim = useRef(new Animated.Value(0)).current;

  const getUrgencyBadgeStyle = (level: string) => {
    const lvl = (level || '').toLowerCase();
    if (lvl === 'critical' || lvl === 'urgent') {
      return { bg: '#FEE2E2', text: '#EF4444', border: '#FCA5A5' };
    }
    if (lvl === 'high') {
      return { bg: '#FFEDD5', text: '#F97316', border: '#FDBA74' };
    }
    if (lvl === 'medium') {
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
    }
    return { bg: '#ECFDF5', text: '#10B981', border: '#6EE7B7' };
  };

  const handleCall = (number: string) => {
    if (!number) return;
    const cleaned = number.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleWhatsApp = (number: string, title: string) => {
    if (!number) return;
    const formatted = number.replace(/\D/g, ''); // Official WhatsApp format must exclude '+' and other non-digits
    const text = encodeURIComponent(`Hare Krishna! I saw your community request "${title}" on Brahmand App and would like to extend my help.`);
    Linking.openURL(`https://wa.me/${formatted}?text=${text}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp');
    });
  };

  const handleResolveRequest = async (requestId: string) => {
    try {
      await resolveCommunityRequest(requestId);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'resolved' } : r));
      setSelectedRequest(null);
      Alert.alert('Success', 'Request marked as fulfilled successfully!');
    } catch (err: any) {
      Alert.alert('Error', parseApiError(err));
    }
  };

  // Only show real requests from the database
  const requestsToRender = requests;

  const userGroupsToRender = userGroups;

  // --- Local Community Join state ---
  const [joinedLocalIds, setJoinedLocalIds] = useState<Set<string>>(new Set());
  const [joiningLocalId, setJoiningLocalId] = useState<string | null>(null);

  const handleJoinLocal = async (communityId: string, name: string) => {
    setJoiningLocalId(communityId);
    try {
      await joinCommunityDirect(communityId);
      setJoinedLocalIds(prev => new Set(prev).add(communityId));

      // Update cache so it persists when returning to this screen
      try {
        const cached = await AsyncStorage.getItem(USER_GROUPS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.data && Array.isArray(parsed.data)) {
            parsed.data = parsed.data.map((c: any) =>
              c.id === communityId ? { ...c, is_member: true } : c
            );
            await AsyncStorage.setItem(USER_GROUPS_CACHE_KEY, JSON.stringify(parsed));
          }
        }
      } catch (cacheErr) {
        console.warn('Failed to update cache after join local', cacheErr);
      }

      Alert.alert('Joined!', `You have joined ${name}.`);
    } catch (err: any) {
      Alert.alert('Error', parseApiError(err));
    } finally {
      setJoiningLocalId(null);
    }
  };

  const handleDeleteChat = (conversationId: string) => {
    Alert.alert(
      t('language') === 'hi' ? 'चैट हटाएं' : 'Delete Chat',
      t('language') === 'hi'
        ? 'क्या आप वाकई इस चैट को हटाना चाहते हैं? इससे सभी संदेश हट जाएंगे।'
        : 'Are you sure you want to delete this chat? This will remove all messages.',
      [
        { text: t('language') === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: t('language') === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Call API to clear messages on backend
              await clearDirectMessages(conversationId);

              // 2. Delete locally in WatermelonDB (if not Web)
              if (Platform.OS !== 'web') {
                try {
                  const convCollection = database.get('conversations');
                  const record = await convCollection.find(conversationId);
                  await database.write(async () => {
                    await record.destroyPermanently();
                  });
                } catch (dbErr) {
                  console.warn('Failed to delete locally from WatermelonDB', dbErr);
                }
              } else {
                // On web, remove from apiDMs state
                setApiDMs(prev => prev.filter(c => (c.conversation_id || c.chat_id || c.id) !== conversationId));
              }
            } catch (err: any) {
              Alert.alert('Error', parseApiError(err));
            }
          }
        }
      ]
    );
  };

  const getRequestTheme = (item: any) => {
    const title = (item?.title || '').toLowerCase();
    const desc = (item?.description || '').toLowerCase();
    const type = (item?.request_type || '').toLowerCase();
    const support = (item?.support_needed || '').toLowerCase();

    if (type === 'blood' || title.includes('blood') || desc.includes('blood') || support === 'blood') {
      return {
        gradColors: ['#FFEBEB', '#FFD6D6'] as const,
        border: '#FFA8A8',
        icon: 'water',
        iconColor: '#E53935',
        btnBorderColor: '#E53935',
        label: 'Blood Request',
      };
    }
    if (title.includes('elder') || desc.includes('elder') || title.includes('senior') || desc.includes('senior') || title.includes('old') || desc.includes('old') || type === 'elderly' || support === 'elderly care' || support === 'elderly') {
      return {
        gradColors: ['#EBF7EB', '#D6F0D6'] as const,
        border: '#A8E0A8',
        icon: 'human-cane',
        iconColor: '#2E7D32',
        btnBorderColor: '#2E7D32',
        label: 'Elderly Care',
      };
    }
    if (title.includes('food') || desc.includes('food') || title.includes('baby') || desc.includes('baby') || support === 'food') {
      return {
        gradColors: ['#FFFDEB', '#FFF9C4'] as const,
        border: '#FFE082',
        icon: 'baby-face',
        iconColor: '#F57F17',
        btnBorderColor: '#F57F17',
        label: 'Food Request',
      };
    }
    if (title.includes('cow') || desc.includes('cow') || title.includes('gau') || desc.includes('animal') || desc.includes('gau') || type === 'gau' || support === 'animal care') {
      return {
        gradColors: ['#FDF8F5', '#F5EBE1'] as const, // Warm light beige
        border: 'rgba(141, 110, 99, 0.2)',
        icon: 'cow',
        iconColor: '#6D4C41',
        btnBorderColor: '#6D4C41',
        label: 'Cow Seva',
      };
    }
    return {
      gradColors: ['#FFF6F0', '#FFEBD6'] as const, // Warm light peach
      border: 'rgba(230, 81, 0, 0.2)',
      icon: 'wheelchair',
      iconColor: '#E65100',
      btnBorderColor: '#E65100',
      label: 'Help Request',
    };
  };

  const formatMemberCount = (count: number) => {
    const adjusted = count * 11;
    if (adjusted >= 1000) return `${(adjusted / 1000).toFixed(adjusted >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
    return String(adjusted);
  };

  const getCommunityFigmaDetails = (item: Community) => {
    const nameLower = (item.name || '').toLowerCase();
    const rawCount = item.member_count ?? (item as any).members_count ?? (item as any).memberCount ?? (Array.isArray((item as any).members) ? (item as any).members.length : 1);
    const count = rawCount || 1;

    if (nameLower.includes('mumbai') || item.type === 'city') {
      return {
        label: t('language') === 'hi' ? 'शहर समुदाय' : 'CITY COMMUNITY',
        name: t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community',
        memberCount: count ? `${formatMemberCount(count)} ${t('language') === 'hi' ? 'सदस्य' : 'members'}` : (t('language') === 'hi' ? '0 सदस्य' : '0 members'),
        avatarBadge: '+8',
        iconBg: '#FFFFFF',
        iconColor: '#9F45FF',
        iconName: 'location-sharp',
        isCityCard: true,
      };
    }
    if (nameLower.includes('maharashtra') || item.type === 'state') {
      return {
        label: t('language') === 'hi' ? 'राज्य समुदाय' : 'STATE COMMUNITY',
        name: t('language') === 'hi' ? 'महाराष्ट्र समुदाय' : 'Maharashtra Community',
        memberCount: count ? `${formatMemberCount(count)} ${t('language') === 'hi' ? 'सदस्य' : 'members'}` : (t('language') === 'hi' ? '0 सदस्य' : '0 members'),
        avatarBadge: '+9',
        iconBg: 'transparent',
        iconColor: '#FF9500',
        iconName: 'medal',
        showLock: true,
      };
    }
    if (nameLower.includes('bharat') || nameLower.includes('india') || nameLower.includes('national') || item.type === 'country') {
      return {
        label: t('language') === 'hi' ? 'राष्ट्रीय समुदाय' : 'NATIONAL COMMUNITY',
        name: t('language') === 'hi' ? 'भारत समुदाय' : (item.name || 'Bharat Community'),
        memberCount: count ? `${formatMemberCount(count)} ${t('language') === 'hi' ? 'सदस्य' : 'members'}` : (t('language') === 'hi' ? '0 सदस्य' : '0 members'),
        avatarBadge: '+2',
        iconBg: 'transparent',
        iconColor: '#FF9500',
        iconName: 'medal',
      };
    }

    return {
      label: item.type === 'city' ? (t('language') === 'hi' ? 'शहर समुदाय' : 'CITY COMMUNITY') : item.type === 'state' ? (t('language') === 'hi' ? 'राज्य समुदाय' : 'STATE COMMUNITY') : (t('language') === 'hi' ? 'राष्ट्रीय समुदाय' : 'NATIONAL COMMUNITY'),
      name: item.name,
      memberCount: count ? `${formatMemberCount(count)} ${t('language') === 'hi' ? 'सदस्य' : 'members'}` : (t('language') === 'hi' ? '0 सदस्य' : '0 members'),
      avatarBadge: '+5',
      iconBg: 'transparent',
      iconColor: item.type === 'city' ? '#9F45FF' : '#FF9500',
      iconName: item.type === 'city' ? 'location-sharp' : 'medal',
    };
  };

  const partitionVerifiedCommunities = () => {
    const city =
      communities.find((c) => c.type === 'city' && (c.name || '').toLowerCase().includes('mumbai')) ||
      communities.find((c) => (c.name || '').toLowerCase().includes('mumbai')) ||
      communities.find((c) => c.type === 'city');
    const state =
      communities.find((c) => c.type === 'state' || (c.name || '').toLowerCase().includes('maharashtra'));
    const national =
      communities.find(
        (c) =>
          c.type === 'country' ||
          (c.name || '').toLowerCase().includes('bharat') ||
          (c.name || '').toLowerCase().includes('india')
      );
    const others = communities.filter((c) => c.id !== city?.id && c.id !== state?.id && c.id !== national?.id);
    return { city, state, national, others };
  };

  const getCommunitySubgroup = (item: Community) => {
    if (item.type === 'state') return 'state';
    if (item.type === 'country') return 'national';
    return 'city';
  };

  const resolveCommunityForNavigation = (item: Community): Community | null => {
    if (!String(item.id || '').includes('fallback')) {
      return item;
    }
    const nameLower = (item.name || '').toLowerCase();
    if (item.type === 'city' || nameLower.includes('mumbai')) {
      return (
        communities.find((c) => c.type === 'city' && (c.name || '').toLowerCase().includes('mumbai')) ||
        communities.find((c) => (c.name || '').toLowerCase().includes('mumbai')) ||
        communities.find((c) => c.type === 'city') ||
        item
      );
    }
    if (item.type === 'state' || nameLower.includes('maharashtra')) {
      return (
        communities.find((c) => c.type === 'state' || (c.name || '').toLowerCase().includes('maharashtra')) ||
        item
      );
    }
    if (item.type === 'country' || nameLower.includes('bharat') || nameLower.includes('india')) {
      return (
        communities.find(
          (c) =>
            c.type === 'country' ||
            (c.name || '').toLowerCase().includes('bharat') ||
            (c.name || '').toLowerCase().includes('india')
        ) || item
      );
    }
    return item;
  };

  const openCommunity = (item: Community, isLocked: boolean, lockedLabel?: string) => {
    if (isLocked) {
      return;
    }
    const resolved = resolveCommunityForNavigation(item);
    if (!resolved) {
      return;
    }
    router.push({
      pathname: '/community/[id]',
      params: {
        id: String(resolved.id),
        subgroup: getCommunitySubgroup(resolved),
        name: resolved.name || '',
      },
    });
  };

  const getCommunityLockState = (item: Community) => {
    const isVerified = user?.personality_verification_status === 'approved';
    const userLevel = user?.verification_level;
    if (item.type === 'state') {
      return !isVerified || (userLevel !== 'state' && userLevel !== 'national');
    }
    if (item.type === 'country') {
      return !isVerified || userLevel !== 'national';
    }
    return false;
  };

  const renderAvatarStack = (item: Community, figma: ReturnType<typeof getCommunityFigmaDetails>, isLocked: boolean) => {
    if (isLocked) {
      return (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedBadgeText}>Verify Access</Text>
        </View>
      );
    }
    return (
      <View style={styles.avatarStack}>
        {[1, 2, 3, 4].map((i) => (
          <Image
            key={i}
            source={{ uri: `https://i.pravatar.cc/100?u=${item.id}${i}` }}
            style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -10 }]}
          />
        ))}
        <View style={[styles.stackAvatarCount, { marginLeft: -10, backgroundColor: figma.iconColor }]}>
          <Text style={styles.stackAvatarCountText}>{figma.avatarBadge}</Text>
        </View>
      </View>
    );
  };

  const toggleHierarchyExpand = () => {
    const nextExpanded = !hierarchyExpanded;
    setHierarchyExpanded(nextExpanded);
    Animated.spring(hierarchyExpandAnim, {
      toValue: nextExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 72,
      friction: 12,
    }).start();
  };

  const renderMedalIcon = () => (
    <Image
      source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/community_medal_icon.webp' }}
      style={styles.medalIconImage}
      resizeMode="contain"
    />
  );

  const renderVerifiedCommunityRow = (
    item: Community,
    options?: { showDivider?: boolean; nested?: boolean }
  ) => {
    const isLocked = getCommunityLockState(item);
    const figma = getCommunityFigmaDetails(item);
    const lockedLabel = item.type === 'country' ? 'National Community' : 'State Community';
    const useMedal = item.type === 'state' || item.type === 'country';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.verifiedGroupRow, options?.nested && styles.verifiedGroupRowNested]}
        activeOpacity={0.85}
        onPress={() => openCommunity(item, isLocked, lockedLabel)}
      >
        <View style={styles.verifiedGroupIconWrap}>
          {useMedal ? (
            renderMedalIcon()
          ) : (
            <View style={[styles.communityIconBox, { backgroundColor: figma.iconBg }]}>
              <Ionicons name={figma.iconName as any} size={22} color={isLocked ? '#AAA' : figma.iconColor} />
            </View>
          )}
        </View>
        <View style={styles.communityItemContent}>
          <View style={styles.communityLabelRow}>
            <Text style={[styles.communityItemLabel, { color: isLocked ? '#AAA' : figma.iconColor }]}>{figma.label}</Text>
            {isLocked && (figma as any).showLock && (
              <Ionicons name="lock-closed" size={11} color="#FF3B30" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={[styles.communityItemName, isLocked && { color: '#666' }]}>{figma.name}</Text>
          <Text style={styles.communityItemMembers}>{figma.memberCount}</Text>
        </View>
        <View style={styles.communityItemRight}>
          {renderAvatarStack(item, figma, isLocked)}
          <Ionicons name="chevron-forward" size={18} color="#C4C4C4" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHierarchyAccordion = (cityItem: Community, state?: Community, national?: Community) => {
    const cityFigma = getCommunityFigmaDetails(cityItem);
    const hasChildren = !!(state || national);
    const chevronRotate = hierarchyExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
    const childrenMaxHeight = hierarchyExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, hierarchyChildHeight],
    });
    const childrenOpacity = hierarchyExpandAnim.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0, 0.4, 1],
    });
    const childrenTranslateY = hierarchyExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-10, 0],
    });

    return (
      <View style={[styles.hierarchyModule, hierarchyExpanded && styles.hierarchyModuleExpanded]}>
        <LinearGradient
          colors={['#FFE4CC', '#FFD9B8', '#FFCEA8']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.mumbaiCommunityCard,
            hierarchyExpanded && hasChildren && styles.mumbaiCommunityCardExpanded,
          ]}
        >
          <TouchableOpacity
            style={styles.mumbaiCardMainTouch}
            activeOpacity={0.92}
            onPress={() => openCommunity(cityItem, false)}
          >
            <View style={styles.mumbaiIconSquare}>
              <Image
                source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/mumbai_pin.webp' }}
                style={styles.mumbaiIconImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.communityItemContent}>
              <Text style={[styles.communityItemLabel, { color: '#9F45FF' }]}>{cityFigma.label}</Text>
              <Text style={styles.communityItemName}>{cityFigma.name}</Text>
              <Text style={styles.communityItemMembers}>{cityFigma.memberCount}</Text>
            </View>
            <View style={styles.communityItemRight}>
              {renderAvatarStack(cityItem, cityFigma, false)}
              {!hasChildren ? (
                <Ionicons name="chevron-forward" size={18} color="#C4C4C4" style={{ marginLeft: 4 }} />
              ) : null}
            </View>
          </TouchableOpacity>
          {hasChildren ? (
            <TouchableOpacity
              style={styles.mumbaiChevronTouch}
              activeOpacity={0.7}
              onPress={toggleHierarchyExpand}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
            >
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Ionicons name="chevron-down" size={20} color="#9F45FF" />
              </Animated.View>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        {hasChildren ? (
          <Animated.View
            style={{
              maxHeight: childrenMaxHeight,
              opacity: childrenOpacity,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                transform: [{ translateY: childrenTranslateY }],
              }}
              onLayout={(e) => {
                const measured = Math.ceil(e.nativeEvent.layout.height);
                if (measured > 0 && measured !== hierarchyChildHeight) {
                  setHierarchyChildHeight(measured);
                }
              }}
            >
              <View style={styles.verifiedGroupCardNested}>
                {state ? renderVerifiedCommunityRow(state, { nested: true }) : null}
                {state && national ? <View style={styles.verifiedGroupDivider} /> : null}
                {national ? renderVerifiedCommunityRow(national, { nested: true }) : null}
              </View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    );
  };

  const renderCommunityBanner = () => {
    return (
      <View style={styles.heroBanner}>
        <LinearGradient
          colors={['#FFFFFF', '#FFF8F2', '#FFF3E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroBannerContent}>
          {/* Foreground Content */}
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>
              {t('language') === 'hi' ? 'अपने समुदाय की मदद करें' : 'Help your community'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('language') === 'hi' ? 'हम मिलकर बदलाव ला सकते हैं' : 'Together we can make a difference'}
            </Text>
            <TouchableOpacity
              style={[styles.heroButton, { marginTop: 10, alignSelf: 'flex-start' }]}
              activeOpacity={0.9}
              onPress={() => router.push('/community-request')}
            >
              <Text style={styles.heroButtonText}>
                {t('language') === 'hi' ? '+ अनुरोध बनाएं' : '+ Create Request'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Centered Background Illustration */}
          <Image
            source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/community_banner_heart.webp' }}
            style={styles.heroImageDeco}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  };

  const renderOurCommunitiesSection = () => {
    const { city, state, national, others } = partitionVerifiedCommunities();
    const fallbackCity: Community = {
      id: 'mumbai-fallback',
      name: t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community',
      type: 'city',
      member_count: 0,
    };
    const fallbackState: Community = {
      id: 'maharashtra-fallback',
      name: t('language') === 'hi' ? 'महाराष्ट्र समुदाय' : 'Maharashtra Community',
      type: 'state',
      member_count: 0,
    };
    const fallbackNational: Community = {
      id: 'bharat-fallback',
      name: t('language') === 'hi' ? 'भारत समुदाय' : 'Bharat Community',
      type: 'country',
      member_count: 0,
    };
    const cityItem = city || fallbackCity;
    const stateItem = state || fallbackState;
    const nationalItem = national || fallbackNational;

    return (
      <View style={styles.ourCommunitiesBlock}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark" size={18} color="#FF6600" />
            <Text style={styles.sectionTitle}>
              {t('language') === 'hi' ? 'हमारे समुदाय ' : 'Our Communities '}
              <Text style={styles.verifiedInline}>
                {t('language') === 'hi' ? '(सत्यापित)' : '(Verified)'}
              </Text>
            </Text>
          </View>
        </View>

        {renderHierarchyAccordion(cityItem, stateItem, nationalItem)}
      </View>
    );
  };

  const fetchData = useCallback(async () => {
    try {
      if (activeTopTab === 'Community') {
        setLoading((prev) => {
          // If we have existing data, don't show loading spinner (Stale-While-Revalidate)
          if (communities.length > 0 && requests.length > 0) return false;
          return true;
        });

        // Trigger background sync for WatermelonDB
        SyncManager.requestSync();

        const [communityRes, requestRes, myPendingRes] = await Promise.all([
          getCommunities().catch((err) => { console.warn('getCommunities err', err); return { data: [] }; }),
          getCommunityRequests({ status: 'active', limit: 10 }).catch((err) => { console.warn('getCommunityRequests err', err); return { data: [] }; }),
          getMyCreationRequests().catch((err) => { console.warn('getMyCreationRequests err', err); return { data: [] }; }),
        ]);

        if (__DEV__) {
          console.log('[DEBUG] communityRes:', communityRes?.data?.length, 'requestRes:', requestRes?.data?.length);
        }

        const allComms = communityRes.data || [];

        if (Platform.OS === 'web') {
          setApiCommunities(allComms);
          AsyncStorage.setItem('web_communities_cache', JSON.stringify(allComms)).catch(() => { });
        }

        // Persist to WatermelonDB (non-blocking - failure here should not break the UI)
        if (Platform.OS !== 'web') {
          InteractionManager.runAfterInteractions(async () => {
            try {
              await database.write(async () => {
                const communitiesCollection = database.get('communities');
                const batchOps: any[] = [];
                for (const comm of allComms) {
                  const records = await communitiesCollection.query(Q.where('id', comm.id)).fetch();
                  const existing = records && records.length > 0 ? records[0] : null;
                  if (existing) {
                    batchOps.push(
                      existing.prepareUpdate((record: any) => {
                        record.name = comm.name;
                        record.description = comm.description;
                        record.photo = comm.photo;
                        record.type = comm.type;
                        record.memberCount = comm.member_count || 0;
                      })
                    );
                  } else {
                    batchOps.push(
                      communitiesCollection.prepareCreate((record: any) => {
                        record._raw.id = comm.id;
                        record.name = comm.name;
                        record.description = comm.description;
                        record.photo = comm.photo;
                        record.type = comm.type;
                        record.memberCount = comm.member_count || 0;
                      })
                    );
                  }
                }
                if (batchOps.length > 0) {
                  await database.batch(batchOps);
                }
              });
            } catch (dbErr) {
              if (__DEV__) console.warn('[DEBUG] WatermelonDB write failed (non-fatal):', dbErr);
            }
          });
        }

        // Fetch ALL user_group communities — load from cache first, then refresh
        try {
          const pendingGroups = (myPendingRes.data || []).map((req: any) => ({
            ...req,
            type: req.type || 'local',
            is_pending: true,
            member_count: req.member_ids?.length || 1,
          }));

          // Fetch fresh from discover endpoint EVERY TIME for now to avoid stale cache issues
          const discoverRes = await discoverCommunities();
          const allDiscovered = discoverRes.data || [];
          const allUserGroups = allDiscovered.filter(
            (item: Community) => item.type === 'user_group' || item.type === 'local'
          );
          // Also include any user_group the current user is a member of (from getCommunities)
          const myUserGroups = allComms.filter((item: Community) => item.type === 'user_group' || item.type === 'local');

          // Merge and deduplicate by id, prioritize pending ones for the current user
          const merged = [...pendingGroups, ...allUserGroups, ...myUserGroups];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

          if (__DEV__) {
            console.log('[DEBUG] final unique userGroups:', unique.length, unique.map((c: any) => c.name));
          }

          setUserGroups(unique);
          // Persist to cache
          await AsyncStorage.setItem(USER_GROUPS_CACHE_KEY, JSON.stringify({ data: unique, timestamp: Date.now() }));
        } catch (e) {
          if (__DEV__) console.log('[DEBUG] error in userGroups logic:', e);
          // Fallback if discover fails
          const myUserGroups = allComms.filter((item: Community) => item.type === 'user_group' || item.type === 'local');
          const pendingGroups = (myPendingRes.data || []).map((req: any) => ({
            ...req,
            type: req.type || 'local',
            is_pending: true,
            member_count: req.member_ids?.length || 1,
          }));
          const merged = [...pendingGroups, ...myUserGroups];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setUserGroups(unique);
        }

        setRequests(requestRes.data || []);
      } else {
        setLoading((prev) => {
          if (circles.length > 0 || conversations.length > 0) return false;
          return true;
        });

        const [circlesRes, convRes] = await Promise.all([
          getCircles(),
          getConversations()
        ]);

        const allCircles = circlesRes.data || [];
        const allDMs = convRes.data || [];

        setApiCircles(allCircles);
        setApiDMs(allDMs);

        const metaMap: Record<string, { senderId?: string; status?: string }> = {};
        for (const dm of allDMs) {
          const dmId = dm.conversation_id || dm.id;
          metaMap[dmId] = {
            senderId: dm.last_message_sender_id,
            status: dm.last_message_status,
          };
        }
        setDmMetadataMap(metaMap);
        AsyncStorage.setItem('dm_metadata_map', JSON.stringify(metaMap)).catch(() => { });
        if (Platform.OS === 'web') {
          AsyncStorage.setItem('web_circles_cache', JSON.stringify(allCircles)).catch(() => { });
          AsyncStorage.setItem('web_dms_cache', JSON.stringify(allDMs)).catch(() => { });
        }

        // Persist to WatermelonDB
        if (Platform.OS !== 'web') {
          InteractionManager.runAfterInteractions(async () => {
            try {
              await database.write(async () => {
                const conversationsCollection = database.get('conversations');
                const batchOps: any[] = [];

                // Upsert Circles
                for (const circle of allCircles) {
                  const records = await conversationsCollection.query(Q.where('id', circle.id)).fetch();
                  const existing = records && records.length > 0 ? records[0] : null;
                  if (existing) {
                    batchOps.push(
                      existing.prepareUpdate((record: any) => {
                        record.name = circle.name;
                        record.photo = circle.photo;
                        record.lastMessage = circle.last_message;
                        record.lastMessageAt = circle.last_message_time ? new Date(circle.last_message_time) : undefined;
                        record.memberCount = circle.member_count;
                        record.type = 'circle';
                        record.updatedAt = new Date();
                      })
                    );
                  } else {
                    batchOps.push(
                      conversationsCollection.prepareCreate((record: any) => {
                        record._raw.id = circle.id;
                        record.name = circle.name;
                        record.photo = circle.photo;
                        record.lastMessage = circle.last_message;
                        record.lastMessageAt = circle.last_message_time ? new Date(circle.last_message_time) : undefined;
                        record.memberCount = circle.member_count;
                        record.type = 'circle';
                        record.unreadCount = 0;
                        record.updatedAt = new Date();
                      })
                    );
                  }
                }

                // Upsert DMs
                for (const dm of allDMs) {
                  const dmId = dm.conversation_id || dm.id;
                  const records = await conversationsCollection.query(Q.where('id', dmId)).fetch();
                  const existing = records && records.length > 0 ? records[0] : null;
                  if (existing) {
                    batchOps.push(
                      existing.prepareUpdate((record: any) => {
                        record.name = dm.user?.name;
                        record.photo = dm.user?.photo;
                        record.lastMessage = dm.last_message;
                        record.lastMessageAt = dm.last_message_at ? new Date(dm.last_message_at) : undefined;
                        record.unreadCount = dm.unread_count || 0;
                        record.type = 'dm';
                        record.slId = dm.user?.sl_id;
                        record.otherUserId = dm.user?.id;
                        record.updatedAt = new Date();
                      })
                    );
                  } else {
                    batchOps.push(
                      conversationsCollection.prepareCreate((record: any) => {
                        record._raw.id = dmId;
                        record.name = dm.user?.name;
                        record.photo = dm.user?.photo;
                        record.lastMessage = dm.last_message;
                        record.lastMessageAt = dm.last_message_at ? new Date(dm.last_message_at) : undefined;
                        record.unreadCount = dm.unread_count || 0;
                        record.type = 'dm';
                        record.slId = dm.user?.sl_id;
                        record.otherUserId = dm.user?.id;
                        record.updatedAt = new Date();
                      })
                    );
                  }
                }

                if (batchOps.length > 0) {
                  await database.batch(batchOps);
                }
              });
            } catch (dbErr) {
              // Non-fatal DB write failure
            }
          });
        }
      }
    } catch (error: any) {
      console.warn('Error fetching data:', error.message || error);
      if (error.response?.status === 401) {
        logout();
        router.replace('/');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTopTab, logout]);

  useEffect(() => {
    getAllMutedConversations().then(setMutedConversations);

    // Load cached user groups on initial mount to display immediately
    const loadCachedUserGroups = async () => {
      try {
        const cached = await AsyncStorage.getItem(USER_GROUPS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const data = Array.isArray(parsed) ? parsed : parsed?.data;
          if (Array.isArray(data) && data.length > 0) {
            setUserGroups(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load cached user groups:', err);
      }

      try {
        const metaCached = await AsyncStorage.getItem('dm_metadata_map');
        if (metaCached) {
          setDmMetadataMap(JSON.parse(metaCached));
        }
      } catch (err) {
        console.warn('Failed to load dm_metadata_map cache:', err);
      }

      if (Platform.OS === 'web') {
        try {
          const [commCached, circlesCached, dmsCached] = await Promise.all([
            AsyncStorage.getItem('web_communities_cache'),
            AsyncStorage.getItem('web_circles_cache'),
            AsyncStorage.getItem('web_dms_cache')
          ]);
          if (commCached) {
            const parsed = JSON.parse(commCached);
            if (Array.isArray(parsed)) setApiCommunities(parsed);
          }
          if (circlesCached) {
            const parsed = JSON.parse(circlesCached);
            if (Array.isArray(parsed)) setApiCircles(parsed);
          }
          if (dmsCached) {
            const parsed = JSON.parse(dmsCached);
            if (Array.isArray(parsed)) setApiDMs(parsed);
          }
        } catch (err) {
          console.warn('Failed to load cached web data:', err);
        }
      }
    };
    loadCachedUserGroups();
  }, []);

  useEffect(() => {
    // Reset fetch flags when user changes or logs out to ensure fresh data for new user
    initialCommunityFetchDone = false;
    initialChatFetchDone = false;
  }, [user?.id]);

  const fetchConversations = async () => {
    // No-op: fetchData now handles both circles and conversations,
    // and observers update the UI automatically.
  };



  useEffect(() => {
    if (!isFocused) return;
    if (activeTopTab === 'Community' && requests.length > 0) {
      const totalCount = requests.length;
      let currentIndex = 0;
      const timer = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalCount;
        const cardWidth = 132;
        activeRequestScrollRef.current?.scrollTo({ x: currentIndex * cardWidth, animated: true });
      }, 5000); // 5 seconds interval, direct ref scroll without state re-render loop
      return () => clearInterval(timer);
    }
  }, [activeTopTab, requests.length, isFocused]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        getAllMutedConversations().then(setMutedConversations);
        fetchData();
      });
      return () => task.cancel();
    }, [fetchData])
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';

    // Ensure UTC interpretation if missing timezone suffix
    let ds = String(dateString);
    if (!ds.includes('Z') && !ds.includes('+')) {
      ds = ds.includes('T') ? `${ds}Z` : `${ds.replace(' ', 'T')}Z`;
    }

    const date = new Date(ds);
    if (Number.isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // --- RENDERING COMPONENTS ---

  const renderActiveRequestCard = useCallback((item: any, index: number) => {
    const theme = getRequestTheme(item);

    return (
      <Pressable
        key={item.id ? `${item.id}-${index}` : `request-${index}`}
        style={({ pressed }) => [
          pressed && Platform.OS === 'ios' && { opacity: 0.9 }
        ]}
        android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
        onPress={() => setSelectedRequest(item)}
      >
        <LinearGradient
          colors={theme.gradColors}
          style={[styles.figmaRequestCard, { borderColor: theme.border }]}
        >
          <View style={styles.figmaRequestIconWrapper}>
            <MaterialCommunityIcons name={theme.icon as any} size={28} color={theme.iconColor} />
          </View>

          <Text style={styles.figmaRequestTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.figmaRequestLocation} numberOfLines={1}>
            {item.location || 'Mumbai'}
          </Text>

          <Text style={styles.figmaRequestTime}>
            {getTimeAgo(item.created_at)}
          </Text>

          <View style={[styles.figmaRequestBtn, { borderColor: theme.btnBorderColor }]}>
            <Text style={[styles.figmaRequestBtnText, { color: theme.btnBorderColor }]}>View &gt;</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }, [getRequestTheme, getTimeAgo, setSelectedRequest]);


  const renderLocalCommunityCard = useCallback((item: Community, index: number) => {
    const borderColor = '#397339';
    const isJoined = joinedLocalIds.has(item.id) || (item as any).is_member || communities.some(c => c.id === item.id);
    const isJoining = joiningLocalId === item.id;
    const isPending = (item as any).is_pending;

    return (
      <Pressable
        key={`${item.id}-${index}`}
        style={({ pressed }) => [
          styles.localCommCard,
          {
            borderRadius: 10,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: '#397339',
            backgroundColor: '#ECF4E3',
            overflow: 'hidden',
          },
          isPending && { opacity: 0.8 },
          pressed && Platform.OS === 'ios' && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
        onPress={() => isPending ? Alert.alert('Pending', 'This community is awaiting activation from other team members.') : router.push(`/community/${item.id}`)}
      >
        <View style={styles.localCommAvatarWrapper}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.localCommAvatar} />
          ) : (
            <Avatar name={item.name} size={56} />
          )}
        </View>

        <View style={styles.localCommContent}>
          <Text style={styles.localCommName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.localCommMembers}>{((item.member_count || (item as any).members_count || (item as any).memberCount || 1) * 11)} members</Text>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          {!isPending && (
            <TouchableOpacity
              style={[styles.localJoinBtn, { borderColor }, isJoined && { borderColor: '#CCC' }]}
              onPress={(e) => {
                e.stopPropagation();
                if (!isJoined) handleJoinLocal(item.id, item.name);
              }}
              disabled={isJoining || isJoined}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color={borderColor} style={{ width: 36 }} />
              ) : (
                <Text style={[styles.localJoinBtnText, { color: isJoined ? '#AAA' : borderColor }]}>
                  {isJoined ? '✓ Joined' : 'Join'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {isPending && (
            <View style={[styles.localJoinBtn, { borderColor: '#FFA500', backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.localJoinBtnText, { color: '#D97706' }]}>Pending</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }, [joinedLocalIds, joiningLocalId, communities, handleJoinLocal, router]);


  // ────────────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.09, 0.25]}
      style={styles.container}
    >
      <View
        style={styles.headerPadding}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setCommunityHeaderLayout({ x: 0, y: insets.top || 0, width, height });
        }}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.segmentedTrack}>
            {/* Animated sliding thumb — single source of truth */}
            <Animated.View
              style={[
                styles.segmentThumb,
                {
                  transform: [{
                    translateX: segmentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (width - 32 - 8) / 2],
                    }),
                  }],
                },
              ]}
              pointerEvents="none"
            />

            {/* Community tab */}
            <Pressable
              style={styles.segmentPill}
              onPress={() => handleTabSwitch('Community')}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTopTab === 'Community' && styles.segmentTextActive,
                ]}
              >
                {t('language') === 'hi' ? 'समुदाय' : 'Community'}
              </Text>
            </Pressable>

            {/* Private Chat tab */}
            <Pressable
              style={styles.segmentPill}
              onPress={() => handleTabSwitch('Private Chat')}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTopTab === 'Private Chat' && styles.segmentTextActive,
                ]}
              >
                {t('language') === 'hi' ? 'व्यक्तिगत चैट' : 'Private Chat'}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        refreshControl={<InstagramRefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        onScroll={(event) => {
          onMessagesScrollTabBar(event);
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 350;
          if (isCloseToBottom && activeTopTab === 'Private Chat') {
            if (visibleConversationCount < filteredAll.length) {
              setVisibleConversationCount(prev => Math.min(prev + 20, filteredAll.length));
            }
          }
        }}
        scrollEventThrottle={Platform.OS === 'android' ? 32 : 16}
      >
        {activeTopTab === 'Community' ? (
          !hasValidLocation ? (
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={64} color="#FF8A00" style={{ marginBottom: 16 }} />
              <Text style={styles.noLocationTitle}>
                {t('language') === 'hi'
                  ? 'आप कम्युनिटी ग्रुप में नहीं जुड़े हैं'
                  : 'You are not added in community groups'}
              </Text>
              <Text style={styles.noLocationSub}>
                {t('language') === 'hi'
                  ? 'कम्युनिटी ग्रुप्स में जुड़ने के लिए कृपया अपना स्थान सेट करें।'
                  : 'To get added, please configure your home location.'}
              </Text>
              <TouchableOpacity
                style={styles.noLocationButton}
                activeOpacity={0.8}
                onPress={() => router.push('/settings/location')}
              >
                <Text style={styles.noLocationButtonText}>
                  {t('language') === 'hi' ? 'स्थान सेट करें' : 'Configure Location'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.communityContent}>
              {loading && communities.length === 0 && requests.length === 0 ? (
                <View style={styles.skeletonContainer}>
                  <View style={styles.skeletonBanner} />
                  <View style={styles.skeletonSectionHeader}>
                    <View style={styles.skeletonSectionTitle} />
                    <View style={styles.skeletonChip} />
                  </View>
                  <View style={styles.skeletonSlider}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={styles.skeletonCard} />
                    ))}
                  </View>
                  <View style={styles.skeletonSectionHeader}>
                    <View style={styles.skeletonSectionTitle} />
                  </View>
                  <View style={styles.skeletonSlider}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={styles.skeletonRequestCard} />
                    ))}
                  </View>
                </View>
              ) : (
                <>
                  {renderCommunityBanner()}
                  {renderOurCommunitiesSection()}

                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <MaterialCommunityIcons name="account-group-outline" size={22} color="#FF6600" />
                      <Text style={styles.sectionTitle}>
                        {t('language') === 'hi' ? 'स्थानीय समुदाय ' : 'Local Communities '}
                        <Text style={styles.subTitleSmall}>
                          {t('language') === 'hi' ? '(उपयोगकर्ता समूह)' : '(User groups)'}
                        </Text>
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/community/discover')}>
                      <Text style={styles.viewAllText}>{t('language') === 'hi' ? 'सभी देखें' : 'View All'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Local Communities Slider */}
                  {userGroupsToRender.length > 0 ? (
                    <View style={{ marginBottom: 10, minHeight: 190 }}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                      >
                        {userGroupsToRender.map((item, idx) => renderLocalCommunityCard(item, idx))}
                      </ScrollView>
                    </View>
                  ) : (
                    <View style={styles.localCommEmptyBox}>
                      <Text style={styles.localCommEmptyText}>
                        {t('language') === 'hi' ? 'अभी तक कोई उपयोगकर्ता समूह नहीं बनाया गया है। शुरुआत करने वाले पहले बनें!' : 'No user groups created yet. Be the first to start one!'}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Active Requests */}
              {requestsToRender.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {t('language') === 'hi' ? 'सक्रिय सामुदायिक अनुरोध' : 'Active Community Requests'}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/community-request/list')}>
                      <Text style={styles.viewAllText}>{t('language') === 'hi' ? 'सभी देखें' : 'View All'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 10, minHeight: 230 }}>
                    <ScrollView
                      ref={activeRequestScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
                      snapToInterval={132}
                      decelerationRate="fast"
                      snapToAlignment="start"
                      style={Platform.OS === 'web' ? ({ cursor: 'grab' } as any) : {}}
                      onMomentumScrollEnd={(e) => {
                        const x = e.nativeEvent.contentOffset.x;
                        setActiveRequestIndex(Math.round(x / 132));
                      }}
                    >
                      {requestsToRender.map((item, index) => renderActiveRequestCard(item, index))}
                    </ScrollView>
                  </View>
                </>
              )}

              <View style={{ height: 90 }} />
            </View>
          )
        ) : (
          <View style={styles.privateChatContent}>
            {/* Search Bar */}
            <View
              style={[
                styles.searchBarContainer,
                isSearchFocused && {
                  borderColor: '#0088CC',
                  borderWidth: 1.5,
                  shadowColor: '#0088CC',
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 5,
                  backgroundColor: '#FAFCFF',
                }
              ]}
            >
              <Pressable
                style={styles.searchPressableArea}
                onPress={() => searchInputRef.current?.focus()}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', foreground: true, borderless: false }}
              >
                <Ionicons name="search" size={20} color={isSearchFocused ? '#0088CC' : '#8E8E93'} style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder={t('findPeopleGroups')}
                  placeholderTextColor="#8E8E93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  autoCapitalize="none"
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  router.push('/dm/new');
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.16)', foreground: true, borderless: false }}
                style={styles.composeButton}
              >
                <Ionicons name="create-outline" size={22} color="#000000" />
              </Pressable>
            </View>

            {/* Group Chats Section */}
            {filteredGroups.length > 0 ? (
              <View style={styles.chatSection}>
                <Text style={styles.privateChatSectionTitle}>{t('groupChats')}</Text>
                {filteredGroups.map((item, index) => (
                  <PressableDepthRow
                    key={item.id ? `${item.id}-${index}` : `group-${index}`}
                    style={styles.chatRow}
                    onPress={() => {
                      router.push(`/chat/circle/${item.id}`);
                    }}
                  >
                    <Avatar name={item.name} photo={item.photo} size={52} />
                    <View style={styles.chatRowMiddle}>
                      <Text style={styles.chatRowTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.chatRowSubtitle} numberOfLines={1}>
                        {formatLastMessage(item.last_message, t('language') === 'hi') || t('startConversation')}
                      </Text>
                    </View>
                    <View style={styles.chatRowRight}>
                      <Text style={styles.chatRowTime}>{item.last_message_time || ''}</Text>
                      {!!item.last_message && (
                        <MaterialCommunityIcons
                          name="check-all"
                          size={18}
                          color="#34B7F1"
                          style={styles.checkmarkIcon}
                        />
                      )}
                    </View>
                  </PressableDepthRow>
                ))}
              </View>
            ) : !searchQuery && (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  {t('noGroupChatsYet')}
                </Text>
              </View>
            )}

            {/* All Chats Section */}
            {filteredAll.length > 0 ? (
              <View style={styles.chatSection}>
                <Text style={styles.privateChatSectionTitle}>{t('allChats')}</Text>
                {paginatedConversations.map((item, index) => {
                  const conversationId = item.conversation_id || item.id;
                  const itemKey = conversationId ? `${conversationId}-${index}` : `dm-${index}`;
                  return (
                    <View key={itemKey}>
                      <PressableDepthRow
                        style={styles.chatRow}
                        onPress={() => {
                          const userSL = (item.user as any)?.sl_id || (item.user as any)?.slId || '';
                          router.push(`/dm/${conversationId}?userId=${item.user?.id || ''}&userName=${encodeURIComponent(item.user?.name || '')}&userSL=${encodeURIComponent(userSL)}&userPhoto=${encodeURIComponent(item.user?.photo || '')}`);
                        }}
                        onLongPress={() => handleDeleteChat(conversationId)}
                      >
                        <Avatar name={item.user?.name || '?'} photo={item.user?.photo} size={52} />
                        <View style={styles.chatRowMiddle}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.chatRowTitle} numberOfLines={1}>{item.user?.name}</Text>
                            {(item.user as any)?.is_verified && (
                              <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6B00" style={{ marginLeft: 4 }} />
                            )}
                          </View>
                          <Text style={styles.chatRowSubtitle} numberOfLines={1}>
                            {formatLastMessage(item.last_message, t('language') === 'hi') || (t('language') === 'hi' ? 'एक संदेश भेजें' : 'Send a message')}
                          </Text>
                        </View>
                        <View style={styles.chatRowRight}>
                          <Text style={styles.chatRowTime}>{formatTime(item.last_message_at)}</Text>
                          {(() => {
                            if (!item.last_message) return null;
                            const isMyMessage = item.last_message_sender_id === user?.id;
                            if (!isMyMessage) return null;

                            if (item.last_message_status === 'sending') {
                              return (
                                <MaterialCommunityIcons
                                  name="clock-outline"
                                  size={16}
                                  color={COLORS.textLight}
                                  style={styles.checkmarkIcon}
                                />
                              );
                            }
                            if (item.last_message_status === 'read') {
                              return (
                                <MaterialCommunityIcons
                                  name="check-all"
                                  size={18}
                                  color={COLORS.primary}
                                  style={styles.checkmarkIcon}
                                />
                              );
                            }
                            // Default to sent/delivered
                            return (
                              <MaterialCommunityIcons
                                name="check"
                                size={16}
                                color={COLORS.textLight}
                                style={styles.checkmarkIcon}
                              />
                            );
                          })()}
                        </View>
                      </PressableDepthRow>
                      {index < paginatedConversations.length - 1 && <View style={styles.chatSeparator} />}
                    </View>
                  );
                })}

                {visibleConversationCount < filteredAll.length && (
                  <TouchableOpacity
                    style={styles.loadMoreConversationsBtn}
                    onPress={() => setVisibleConversationCount(prev => Math.min(prev + 20, filteredAll.length))}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.loadMoreConversationsText}>
                      {t('language') === 'hi'
                        ? `और ${Math.min(20, filteredAll.length - visibleConversationCount)} संदेश लोड करें (${filteredAll.length - visibleConversationCount} बाकी)`
                        : `Load ${Math.min(20, filteredAll.length - visibleConversationCount)} More Conversations (${filteredAll.length - visibleConversationCount} remaining)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : !searchQuery && (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  {t('language') === 'hi' ? 'अभी तक कोई निजी संदेश नहीं है' : 'No private messages yet'}
                </Text>
              </View>
            )}

            {filteredGroups.length === 0 && filteredAll.length === 0 && !!searchQuery && (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  {t('language') === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No results found'}
                </Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>
      {/* Locked Group Banner */}

      {/* Detailed Modal Bottom Sheet */}
      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRequest(null)}
        statusBarTranslucent
      >
        {selectedRequest && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalDismiss}
              activeOpacity={1}
              onPress={() => setSelectedRequest(null)}
            />
            <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetTypeRow}>
                  <View style={[styles.sheetIconBg, { backgroundColor: getRequestTheme(selectedRequest).iconColor + '15' }]}>
                    <MaterialCommunityIcons
                      name={getRequestTheme(selectedRequest).icon as any}
                      size={28}
                      color={getRequestTheme(selectedRequest).iconColor}
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.sheetTypeLabel, { color: getRequestTheme(selectedRequest).iconColor }]}>
                      {(() => {
                        const engLabel = getRequestTheme(selectedRequest).label || selectedRequest.request_type || 'Help Request';
                        if (t('language') === 'hi') {
                          if (engLabel === 'Blood Request') return 'रक्त की आवश्यकता';
                          if (engLabel === 'Food Request') return 'भोजन की आवश्यकता';
                          if (engLabel === 'Cow Seva') return 'गौ सेवा';
                          return 'मदद की आवश्यकता';
                        }
                        return engLabel.toUpperCase();
                      })()}
                    </Text>
                    <Text style={styles.sheetTime}>{getTimeAgo(selectedRequest.created_at)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={() => setSelectedRequest(null)}
                  >
                    <Ionicons name="close-circle" size={26} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sheetContent}>
                <View style={styles.requestInfoCard}>
                  <Text style={styles.sheetTitle}>{selectedRequest.title}</Text>

                  <View style={styles.sheetMetaRow}>
                    <View style={[styles.urgencyBadgeSheet, {
                      backgroundColor: getUrgencyBadgeStyle(selectedRequest.urgency_level).bg,
                      borderColor: getUrgencyBadgeStyle(selectedRequest.urgency_level).border
                    }]}>
                      <Text style={[styles.urgencyTextSheet, { color: getUrgencyBadgeStyle(selectedRequest.urgency_level).text }]}>
                        {(() => {
                          const lvl = (selectedRequest.urgency_level || '').toLowerCase();
                          if (t('language') === 'hi') {
                            if (lvl === 'critical' || lvl === 'urgent') return 'अति आवश्यक';
                            if (lvl === 'high') return 'उच्च प्राथमिकता';
                            if (lvl === 'medium') return 'मध्यम';
                            return 'सामान्य';
                          }
                          return `${selectedRequest.urgency_level.toUpperCase()} URGENCY`;
                        })()}
                      </Text>
                    </View>
                    <View style={styles.sheetLocBadge}>
                      <Ionicons name="location" size={14} color="#64748B" />
                      <Text style={styles.sheetLocText}>{selectedRequest.location || 'Mumbai'}</Text>
                    </View>
                  </View>

                  <Text style={styles.sheetDescSectionTitle}>
                    {t('language') === 'hi' ? 'विवरण' : 'Details / Description'}
                  </Text>
                  <Text style={styles.sheetDesc}>
                    {selectedRequest.description || (t('language') === 'hi' ? 'कोई विवरण नहीं दिया गया है।' : 'No description provided.')}
                  </Text>

                  <View style={styles.requesterCard}>
                    <Ionicons name="person-circle" size={36} color="#E2E8F0" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.requesterName}>
                        {selectedRequest.user_name || (t('language') === 'hi' ? 'पड़ोसी' : 'Neighbor')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.sheetIconButton}
                    onPress={() => handleCall(selectedRequest.contact_number)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={22} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sheetIconButton, { backgroundColor: '#25D366' }]}
                    onPress={() => handleWhatsApp(selectedRequest.contact_number, selectedRequest.title)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" />
                  </TouchableOpacity>

                  {selectedRequest.user_id === user?.id ? (
                    <TouchableOpacity
                      style={[styles.sheetBtn, styles.sheetFulfillBtn]}
                      onPress={() => handleResolveRequest(selectedRequest.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
                      <Text style={styles.sheetFulfillBtnText}>
                        {t('language') === 'hi' ? 'अनुरोध पूरा करें' : 'Fulfill Request'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.sheetBtn, { backgroundColor: '#FF8A00' }]}
                      onPress={() => handleWhatsApp(selectedRequest.contact_number, selectedRequest.title)}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="hand-heart" size={22} color="#FFF" />
                      <Text style={styles.sheetFulfillBtnText}>
                        {t('language') === 'hi' ? 'मदद की पेशकश करें' : 'Offer Help'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  noLocationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  noLocationTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  noLocationSub: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  noLocationButton: {
    backgroundColor: '#FF8A00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  noLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  headerPadding: { paddingBottom: 12 },
  segmentedTrack: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    alignSelf: 'stretch',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    height: 48,
    // relative so the absolute thumb sits inside it
    position: 'relative',
    overflow: 'hidden',
    padding: 4,
  },
  // The white sliding thumb — absolutely positioned, z=-1
  segmentThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 0,
  },
  segmentPill: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    // no background — thumb slides behind
    backgroundColor: 'transparent',
  },
  segmentPillActive: {},   // kept for backwards compat — no longer needed
  segmentText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    // inactive = muted white so it's clearly different from active
    color: 'rgba(255, 255, 255, 0.75)',
  },
  segmentTextActive: {
    color: '#EA4C0F',
  },

  mainContent: { flex: 1, backgroundColor: 'transparent' },
  mainContentContainer: { paddingBottom: 24 },
  communityContent: { paddingHorizontal: 16, paddingTop: 12 },
  ourCommunitiesBlock: { marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  hierarchyModule: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.12)',
    shadowColor: '#FF9500',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hierarchyModuleExpanded: {
    borderColor: 'rgba(255, 149, 0, 0.18)',
  },
  mumbaiCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 88,
  },
  mumbaiCommunityCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  mumbaiCardMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mumbaiChevronTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 2,
  },
  mumbaiIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mumbaiIconImage: { width: 36, height: 36 },
  verifiedGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  verifiedGroupCardNested: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  verifiedGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 88,
  },
  verifiedGroupRowNested: {
    backgroundColor: '#FFFFFF',
  },
  medalIconImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  verifiedGroupDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 12,
  },
  verifiedGroupIconWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityLabelRow: { flexDirection: 'row', alignItems: 'center' },

  heroBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 132,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.08)',
    shadowColor: '#C98B4E',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: 110,
    position: 'relative',
  },
  heroImageDeco: {
    position: 'absolute',
    bottom: -12,
    aspectRatio: 69 / 25,
    zIndex: 0,
    opacity: 1,
    width: 280,
    height: 80,
    right: -10,
    transform: [{ scaleX: 3.0 }, { scaleY: 2.7 }],
  },
  heroTextCol: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 12,
    fontFamily: 'sans-serif',
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  heroSubtitle: {
    width: 150,
    fontSize: 10,
    fontFamily: 'sans-serif',
    fontWeight: '400',
    color: '#000000',
  },
  heroActionCol: {
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginRight: -6,
    marginTop: 16,
  },
  heroButton: {
    backgroundColor: '#EA4C0F',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold
  },
  verifiedInline: { color: '#888', fontSize: 14, fontFamily: FONTS.regular },
  bloodCardBgIllust: { position: 'absolute', right: -10, top: 20, opacity: 0.3 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#111', flexShrink: 1 },
  viewAllText: { fontSize: 13, color: '#FF6600', fontFamily: FONTS.bold },
  verifiedTag: { color: '#888', fontSize: 12, fontFamily: FONTS.regular },
  subTitleSmall: { color: '#888', fontSize: 10, fontFamily: FONTS.regular },

  horizontalScroll: { paddingBottom: 10, paddingRight: 20 },
  activeRequestCard: { width: width * 0.48, borderRadius: 24, padding: 14, marginRight: 14, minHeight: 190, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  reqCardIllustWrapper: { position: 'absolute', right: -40, bottom: -40, width: 280, height: 280, opacity: 0.3 },
  reqCardIllustImage: { width: '100%', height: '100%' },
  reqCardHeader: { flex: 1, zIndex: 1 },
  reqCardTitle: { fontSize: 15, fontFamily: FONTS.bold, color: '#000', marginBottom: 8, lineHeight: 18 },
  reqUrgencyPill: { backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, elevation: 1, shadowOpacity: 0.05, shadowRadius: 2 },
  reqUrgencyText: { fontSize: 10, fontFamily: FONTS.bold },
  reqCardFooter: { marginTop: 'auto', zIndex: 1 },
  reqInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reqInfoText: { fontSize: 11, color: '#000', marginLeft: 4, fontFamily: FONTS.medium, flex: 1, lineHeight: 14 },
  reqPosterName: { fontSize: 11, color: '#000', marginLeft: 4, fontFamily: FONTS.medium },
  reqPostedTime: { fontSize: 10, color: '#555', marginLeft: 'auto' },

  figmaRequestCard: { width: 120, height: 220, borderRadius: 20, borderWidth: 1, padding: 12, marginRight: 12, alignItems: 'center', justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, overflow: 'hidden' },
  figmaRequestIconWrapper: { marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  figmaRequestTitle: { fontSize: 13, fontFamily: FONTS.bold, textAlign: 'center', color: '#000', marginTop: 10, lineHeight: 17, paddingHorizontal: 4 },
  figmaRequestLocation: { fontSize: 10, fontStyle: 'italic', textAlign: 'center', color: '#333', marginTop: 8, paddingHorizontal: 4 },
  figmaRequestTime: { fontSize: 9, textAlign: 'center', color: '#888', marginTop: 6 },
  figmaRequestBtn: { borderWidth: 1.5, borderRadius: 14, width: 80, height: 28, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 6, marginTop: 'auto' },
  figmaRequestBtnText: { fontSize: 10, fontFamily: FONTS.bold },

  figmaVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  figmaVerifiedText: { color: '#FFF', fontSize: 10, fontFamily: FONTS.bold },

  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  dotActive: { backgroundColor: '#FF6600', width: 12 },
  dotInactive: { backgroundColor: '#DDD' },

  communityListItemLocked: { opacity: 0.8 },
  lockedBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  lockedBadgeText: { fontSize: 10, color: '#AAA', fontFamily: FONTS.bold },
  communityIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  communityItemContent: { flex: 1, paddingRight: 6 },
  communityItemLabel: { fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.4, marginBottom: 2 },
  communityItemName: { fontSize: 12, fontFamily: FONTS.bold, color: '#000', lineHeight: 16 },
  communityItemMembers: { fontSize: 10, color: '#666', marginTop: 2, fontFamily: FONTS.regular },
  communityItemRight: { flexDirection: 'row', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  stackAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF' },
  stackAvatarCount: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  stackAvatarCountText: { fontSize: 8, fontFamily: FONTS.bold, color: '#FFF' },

  localCommCard: {
    width: 132,
    height: 168,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  localCommAvatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: 2
  },
  localCommAvatar: { width: 56, height: 56, borderRadius: 28 },
  localCommContent: { alignItems: 'center', marginTop: 4 },
  localCommName: { fontSize: 11, fontFamily: FONTS.bold, color: '#000', textAlign: 'center', lineHeight: 14 },
  localCommMembers: { fontSize: 10, color: '#666', fontFamily: FONTS.regular, marginTop: 2, textAlign: 'center' },
  localCommPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: '#FFFFFF', minWidth: 72, alignItems: 'center' },
  localCommPillText: { fontSize: 10, fontFamily: FONTS.bold },
  localJoinBtn: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1.5, minWidth: 52, alignItems: 'center' },
  localJoinBtnText: { fontSize: 10, fontFamily: FONTS.bold },
  localCommEmptyBox: { backgroundColor: '#FAF9F6', borderWidth: 1, borderColor: '#EAE8E2', borderStyle: 'dashed', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginHorizontal: 16 },
  localCommEmptyText: { fontSize: 12, color: '#888', fontFamily: FONTS.regular, textAlign: 'center' },

  footerCTA: { backgroundColor: '#FFF3E0', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  footerIconBox: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  plusOverlay: { position: 'absolute', right: 8, bottom: 8 },
  footerTextCol: { flex: 1, paddingHorizontal: 12 },
  footerTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#111' },
  footerSub: { fontSize: 11, fontFamily: FONTS.regular, color: '#666', marginTop: 4 },
  footerButton: { backgroundColor: '#FF6600', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  footerButtonText: { color: '#FFF', fontSize: 12, fontFamily: FONTS.bold, marginLeft: 4 },

  chatContent: { paddingHorizontal: 16, paddingTop: 10 },
  chatSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  chatSectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#111' },
  chatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 20, marginBottom: 12, elevation: 1 },
  chatItemInfo: { flex: 1, marginLeft: 12 },
  chatItemName: { fontSize: 16, fontFamily: FONTS.bold, color: '#111' },
  chatItemLastMsg: { fontSize: 13, color: '#888', marginTop: 2 },
  chatItemRight: { alignItems: 'flex-end' },
  chatItemTime: { fontSize: 11, color: '#AAA' },
  chatBadge: { backgroundColor: '#FF6600', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  chatBadgeText: { color: '#FFF', fontSize: 10, fontFamily: FONTS.bold },
  newChatHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  newChatHeaderText: {
    color: '#FF6600',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  emptyChat: { padding: 20, alignItems: 'center' },
  emptyChatText: { color: '#AAA', fontSize: 14 },

  lockedBannerContainer: {
    position: 'absolute',
    // bottom: handled dynamically
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  lockedBannerContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8D4',
  },
  lockedBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lockedBannerTextCol: {
    flex: 1,
  },
  lockedBannerTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#111',
  },
  lockedBannerSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  lockedBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  modalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTypeLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sheetTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetContent: {},
  requestInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE8D4',
    shadowColor: '#FF8A00',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 12,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  urgencyBadgeSheet: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  urgencyTextSheet: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  sheetLocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flex: 1,
  },
  sheetLocText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
    flex: 1,
  },
  sheetDescSectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 8,
  },
  sheetDesc: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 20,
  },
  requesterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  requesterName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    fontWeight: '700',
  },
  requesterLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIconButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sheetCallBtn: {
    backgroundColor: '#6366F1',
  },
  sheetCallBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  sheetWhatsAppBtn: {
    backgroundColor: '#10B981',
  },
  sheetWhatsAppBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  sheetFulfillBtn: {
    backgroundColor: '#F59E0B',
  },
  sheetFulfillBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  privateChatContent: {
    paddingTop: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    paddingRight: 6,
  },
  searchPressableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 16,
    paddingRight: 8,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#000000',
    paddingVertical: 8,
    height: '100%',
  },
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chatSection: {
    marginBottom: 20,
  },
  privateChatSectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1C1C1E',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chatRowMiddle: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 14,
  },
  chatRowTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  chatRowSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8E8E93',
  },
  chatRowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 48,
  },
  chatRowTime: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8E8E93',
    marginBottom: 4,
  },
  checkmarkIcon: {
    marginTop: 2,
  },
  chatSeparator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 82,
    marginRight: 16,
  },
  skeletonContainer: {
    paddingVertical: 20,
  },
  skeletonBanner: {
    height: 100,
    backgroundColor: '#FFDCC5',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  skeletonSectionTitle: {
    width: 140,
    height: 18,
    backgroundColor: '#E8D5C8',
    borderRadius: 8,
  },
  skeletonChip: {
    width: 60,
    height: 18,
    backgroundColor: '#E8D5C8',
    borderRadius: 8,
  },
  skeletonSlider: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  skeletonCard: {
    width: 152,
    height: 170,
    backgroundColor: '#FFEEE5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFDDCC',
  },
  skeletonRequestCard: {
    width: 140,
    height: 200,
    backgroundColor: '#FFEEE5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFDDCC',
  },
  loadMoreConversationsBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreConversationsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6600',
  },
});

const enhance = withObservables([], () => ({
  observedCommunities: database.get('communities').query().observe(),
  observedConversations: database.get('conversations').query(Q.sortBy('last_message_at', Q.desc)).observe(),
}));

export default enhance(MessagesScreen);
