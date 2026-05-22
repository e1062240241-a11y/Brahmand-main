import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import {
  getCircles,
  getCommunities,
  getCommunityRequests,
  getConversations,
  getCulturalCommunities,
  getUserCulturalCommunity,
  updateUserCulturalCommunity,
  parseApiError,
  resolveCommunityRequest,
  discoverCommunities,
} from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { getAllMutedConversations } from '../../src/services/mutedChats';

const { width } = Dimensions.get('window');
const CONVERSATIONS_CACHE_KEY = 'conversations_cache';
const COMMUNITIES_CACHE_KEY = 'communities_cache';
const USER_GROUPS_CACHE_KEY = 'user_groups_discover_cache';
const USER_GROUPS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  };
  last_message?: string;
  last_message_at?: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [activeTopTab, setActiveTopTab] = useState<'Community' | 'Private Chat'>('Community');
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);
  const activeRequestScrollRef = useRef<ScrollView>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userGroups, setUserGroups] = useState<Community[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
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
      Alert.alert('Success', 'Request marked as fulfilled successfully!');
      setSelectedRequest(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', parseApiError(err));
    }
  };

  // Only show real requests from the database
  const requestsToRender = requests;

  const userGroupsToRender = userGroups;

  const getRequestTheme = (item: any) => {
    const title = (item?.title || '').toLowerCase();
    const desc = (item?.description || '').toLowerCase();
    const type = (item?.request_type || '').toLowerCase();
    const support = (item?.support_needed || '').toLowerCase();

    if (type === 'blood' || title.includes('blood') || desc.includes('blood') || support === 'blood') {
      return {
        gradColors: ['#FFF0F0', '#FFE8E8'] as const, // Warm light rose
        border: 'rgba(255, 100, 100, 0.2)',
        icon: 'water',
        iconColor: '#E53935',
        btnBorderColor: '#E53935',
        label: 'Blood Request',
      };
    }
    if (title.includes('food') || desc.includes('food') || title.includes('baby') || desc.includes('baby') || support === 'food') {
      return {
        gradColors: ['#FFFAF0', '#FFF3CC'] as const, // Warm light cream
        border: 'rgba(255, 160, 0, 0.2)',
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
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
    return String(count);
  };

  const getCommunityFigmaDetails = (item: Community) => {
    const nameLower = (item.name || '').toLowerCase();

    if (nameLower.includes('mumbai') || item.type === 'city') {
      return {
        label: 'CITY COMMUNITY',
        name: item.name || 'Mumbai Community',
        memberCount: item.member_count ? `${formatMemberCount(item.member_count)} members` : '13K members',
        avatarBadge: '+8',
        iconBg: '#FFFFFF',
        iconColor: '#9F45FF',
        iconName: 'location-sharp',
        isCityCard: true,
      };
    }
    if (nameLower.includes('maharashtra') || item.type === 'state') {
      return {
        label: 'STATE COMMUNITY',
        name: 'Maharashtra Community',
        memberCount: '14K members',
        avatarBadge: '+9',
        iconBg: 'transparent',
        iconColor: '#FF9500',
        iconName: 'medal',
        showLock: true,
      };
    }
    if (nameLower.includes('bharat') || nameLower.includes('india') || nameLower.includes('national') || item.type === 'country') {
      return {
        label: 'NATIONAL COMMUNITY',
        name: item.name || 'Bharat Community',
        memberCount: item.member_count ? `${formatMemberCount(item.member_count)} members` : '14K members',
        avatarBadge: '+2',
        iconBg: 'transparent',
        iconColor: '#FF9500',
        iconName: 'medal',
      };
    }

    return {
      label: item.type === 'city' ? 'CITY COMMUNITY' : item.type === 'state' ? 'STATE COMMUNITY' : 'NATIONAL COMMUNITY',
      name: item.name,
      memberCount: item.member_count ? `${formatMemberCount(item.member_count)} members` : '1.2K members',
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
        null
      );
    }
    if (item.type === 'state' || nameLower.includes('maharashtra')) {
      return (
        communities.find((c) => c.type === 'state' || (c.name || '').toLowerCase().includes('maharashtra')) ||
        null
      );
    }
    if (item.type === 'country' || nameLower.includes('bharat') || nameLower.includes('india')) {
      return (
        communities.find(
          (c) =>
            c.type === 'country' ||
            (c.name || '').toLowerCase().includes('bharat') ||
            (c.name || '').toLowerCase().includes('india')
        ) || null
      );
    }
    return null;
  };

  const openCommunity = (item: Community, isLocked: boolean, lockedLabel?: string) => {
    if (isLocked) {
      setShowLockedBanner(lockedLabel || 'Community');
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
      source={require('../../assets/images/community_medal_icon.png')}
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
                source={require('../../assets/images/mumbai_pin.png')}
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

  const renderCommunityBanner = () => (
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
          <Text style={styles.heroTitle}>Help your community</Text>
          <Text style={styles.heroSubtitle}>Together we can make a difference</Text>
        </View>

        {/* Centered Background Illustration */}
        <Image
          source={require('../../assets/images/community_banner_heart.png')}
          style={styles.heroImageDeco}
          resizeMode="contain"
        />

        <View style={styles.heroActionCol}>
          <TouchableOpacity
            style={styles.heroButton}
            activeOpacity={0.9}
            onPress={() => router.push('/community-request')}
          >
            <Text style={styles.heroButtonText}>+ Create Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOurCommunitiesSection = () => {
    const { city, state, national, others } = partitionVerifiedCommunities();
    const fallbackCity: Community = {
      id: 'mumbai-fallback',
      name: 'Mumbai Community',
      type: 'city',
      member_count: 13000,
    };
    const fallbackState: Community = {
      id: 'maharashtra-fallback',
      name: 'Maharashtra Community',
      type: 'state',
      member_count: 14000,
    };
    const fallbackNational: Community = {
      id: 'bharat-fallback',
      name: 'Bharat Community',
      type: 'country',
      member_count: 14000,
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
              Our Communities <Text style={styles.verifiedInline}>(Verified)</Text>
            </Text>
          </View>
        </View>

        {renderHierarchyAccordion(cityItem, stateItem, nationalItem)}

        {others.map((item) => renderVerifiedCommunityRow(item))}
      </View>
    );
  };

  // Lok Sangam State
  const [userLokSangma, setUserLokSangma] = useState<{ cultural_community: string | null; change_count: number; is_locked: boolean } | null>(null);
  const [showLokSangmaModal, setShowLokSangmaModal] = useState(false);
  const [lokSangmaSearch, setLokSangmaSearch] = useState('');
  const [lokSangmaList, setLokSangmaList] = useState<string[]>([]);
  const [lokSangmaLoading, setLokSangmaLoading] = useState(false);
  const [showLockedBanner, setShowLockedBanner] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (activeTopTab === 'Community') {
        setLoading((prev) => {
          // If we have existing data, don't show loading spinner (Stale-While-Revalidate)
          if (communities.length > 0 && requests.length > 0) return false;
          return true;
        });

        const [communityRes, requestRes] = await Promise.all([
          getCommunities(),
          getCommunityRequests({ status: 'active', limit: 10 }),
        ]);

        const allComms = communityRes.data || [];
        const verifiedComms = allComms.filter(
          (item: Community) => item.type !== 'home_area' && item.type !== 'area' && item.type !== 'cultural' && item.type !== 'user_group'
        );
        const userGroupsList = allComms.filter(
          (item: Community) => item.type === 'user_group'
        );

        setCommunities(verifiedComms);

        // Fetch ALL user_group communities — load from cache first, then refresh
        try {
          // Show cached user groups immediately
          const cachedGroups = await AsyncStorage.getItem(USER_GROUPS_CACHE_KEY);
          if (cachedGroups) {
            const { data: cachedData, timestamp } = JSON.parse(cachedGroups);
            if (Array.isArray(cachedData) && cachedData.length > 0) {
              setUserGroups(cachedData);
              // Skip network if cache is fresh
              if (Date.now() - timestamp < USER_GROUPS_CACHE_TTL) {
                setRequests(requestRes.data || []);
                return;
              }
            }
          }
          // Fetch fresh from discover endpoint
          const discoverRes = await discoverCommunities();
          const allDiscovered = discoverRes.data || [];
          const allUserGroups = allDiscovered.filter(
            (item: Community) => item.type === 'user_group'
          );
          // Also include any user_group the current user is a member of (from getCommunities)
          const myUserGroups = allComms.filter((item: Community) => item.type === 'user_group');
          // Merge and deduplicate by id
          const merged = [...allUserGroups, ...myUserGroups];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setUserGroups(unique);
          // Persist to cache
          await AsyncStorage.setItem(USER_GROUPS_CACHE_KEY, JSON.stringify({ data: unique, timestamp: Date.now() }));
        } catch {
          // Fallback to just my user_groups if discover fails
          const myUserGroups = allComms.filter((item: Community) => item.type === 'user_group');
          setUserGroups(myUserGroups);
        }

        setRequests(requestRes.data || []);
      } else {
        setLoading((prev) => {
          if (circles.length > 0) return false;
          return true;
        });
        const res = await getCircles();
        setCircles(res.data || []);
        fetchConversations();
      }
    } catch (error: any) {
      console.warn('Error fetching data:', error.message || error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTopTab, logout]);

  useEffect(() => {
    getAllMutedConversations().then(setMutedConversations);
  }, []);

  const fetchConversations = async () => {
    setLoadingConversations((prev) => conversations.length === 0 ? true : prev);
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error: any) {
      console.warn('Error fetching conversations:', error.message || error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchUserLokSangma = useCallback(async () => {
    try {
      const res = await getUserCulturalCommunity();
      setUserLokSangma(res.data);
    } catch (error: any) {
      console.warn('Error fetching Lok Sangam:', error.message || error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  }, [logout]);

  const loadLokSangmaOptions = async (search?: string) => {
    setLokSangmaLoading(true);
    try {
      const res = await getCulturalCommunities(search);
      setLokSangmaList(res.data || []);
    } catch (error: any) {
      console.warn('Error loading Lok Sangam options:', error.message || error);
    } finally {
      setLokSangmaLoading(false);
    }
  };

  const handleSelectLokSangma = async (community: string) => {
    if (userLokSangma?.is_locked) {
      Alert.alert('Locked', 'You can only change your Lok Sangam once. It is now locked.');
      return;
    }
    Alert.alert('Confirm', `Set your Lok Sangam to "${community}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateUserCulturalCommunity(community);
            await fetchUserLokSangma();
            setShowLokSangmaModal(false);
          } catch (error: any) {
            Alert.alert('Error', parseApiError(error));
          }
        }
      }
    ]);
  };

  useEffect(() => {
    fetchData();
    fetchUserLokSangma();
  }, [fetchData]);

  useEffect(() => {
    if (!isFocused) return;
    if (activeTopTab === 'Community' && requests.length > 0) {
      const totalCount = requests.length;
      const timer = setInterval(() => {
        setActiveRequestIndex((prev) => {
          const nextIndex = (prev + 1) % totalCount;
          const cardWidth = 132; // actual layout card width (120) + margin (12)
          activeRequestScrollRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
          return nextIndex;
        });
      }, 4000); // Advance every 4 seconds
      return () => clearInterval(timer);
    }
  }, [activeTopTab, requests.length, isFocused]);

  useFocusEffect(
    useCallback(() => {
      getAllMutedConversations().then(setMutedConversations);
      if (activeTopTab === 'Private Chat') {
        fetchConversations();
      }
    }, [activeTopTab])
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '1h ago';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // --- RENDERING COMPONENTS ---

  const renderActiveRequestCard = (item: any) => {
    const theme = getRequestTheme(item);

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => setSelectedRequest(item)}
        activeOpacity={0.9}
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
      </TouchableOpacity>
    );
  };


  const renderLocalCommunityCard = (item: Community, index: number) => {
    const isPurple = index % 2 === 1 || (item.label || '').toLowerCase().includes('youth');
    const cardBg = isPurple ? '#F7ECFC' : '#EEF5EA';
    const borderColor = isPurple ? '#7A38B3' : '#437953';
    const badgeBg = '#FFFFFF';
    const pillText = isPurple ? 'Youth' : 'Seva';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.localCommCard, { backgroundColor: cardBg, borderColor }]}
        onPress={() => router.push(`/community/${item.id}`)}
      >
        <View style={[styles.localCommAvatarWrapper, { borderColor: `${borderColor}55` }]}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.localCommAvatar} />
          ) : (
            <Avatar name={item.name} size={58} />
          )}
        </View>

        <View style={styles.localCommContent}>
          <Text style={styles.localCommName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.localCommMembers}>{item.member_count} members</Text>
        </View>

        <View style={[styles.localCommPill, { backgroundColor: badgeBg, borderColor }]}>
          <Text style={[styles.localCommPillText, { color: borderColor }]}>{pillText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFFFFF']}
      locations={[0, 0.0481, 0.2404]}
      style={styles.container}
    >
      <View style={styles.headerPadding}>
        <SafeAreaView edges={['top']}>
          <View style={styles.segmentedTrack}>
            <TouchableOpacity
              style={[styles.segmentPill, activeTopTab === 'Community' && styles.segmentPillActive]}
              onPress={() => setActiveTopTab('Community')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTopTab === 'Community' && styles.segmentTextActive,
                ]}
              >
                Community
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentPill, activeTopTab === 'Private Chat' && styles.segmentPillActive]}
              onPress={() => setActiveTopTab('Private Chat')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTopTab === 'Private Chat' && styles.segmentTextActive,
                ]}
              >
                Private Chat
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.mainContentContainer}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {activeTopTab === 'Community' ? (
          <View style={styles.communityContent}>
            {renderCommunityBanner()}
            {renderOurCommunitiesSection()}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color="#FF6600" />
                <Text style={styles.sectionTitle}>
                  Local Communities <Text style={styles.subTitleSmall}>(User groups)</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/community/discover')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Local Communities Slider */}
            {userGroupsToRender.length > 0 ? (
              <View style={{ marginBottom: 10 }}>
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
                <Text style={styles.localCommEmptyText}>No user groups created yet. Be the first to start one!</Text>
              </View>
            )}

            {/* Active Requests */}
            {requestsToRender.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Community Requests</Text>
                  <TouchableOpacity onPress={() => router.push('/community-request/list')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ marginTop: 10 }}>
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
                    {requestsToRender.map(renderActiveRequestCard)}
                  </ScrollView>
                </View>
              </>
            )}

            <View style={{ height: 90 }} />
          </View>
        ) : (
          <View style={styles.chatContent}>
            <View style={styles.chatSectionHeader}>
              <Text style={styles.chatSectionTitle}>Groups & Circles</Text>
              <TouchableOpacity
                onPress={() => router.push('/dm/new')}
                style={styles.newChatHeaderButton}
              >
                <Ionicons name="chatbubbles-outline" size={16} color="#FF6600" />
                <Text style={styles.newChatHeaderText}>New Chat</Text>
              </TouchableOpacity>
            </View>
            {circles.length > 0 ? (
              circles.map(circle => (
                <TouchableOpacity
                  key={circle.id}
                  style={styles.chatItem}
                  onPress={() => router.push(`/chat/circle/${circle.id}`)}
                >
                  <Avatar name={circle.name} photo={circle.photo} size={50} />
                  <View style={styles.chatItemInfo}>
                    <Text style={styles.chatItemName}>{circle.name}</Text>
                    <Text style={styles.chatItemLastMsg} numberOfLines={1}>{circle.last_message || 'Start a conversation'}</Text>
                  </View>
                  <View style={styles.chatItemRight}>
                    <Text style={styles.chatItemTime}>{circle.last_message_time || ''}</Text>
                    {circle.member_count > 0 && <View style={styles.chatBadge}><Text style={styles.chatBadgeText}>{circle.member_count}</Text></View>}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No group chats yet</Text>
              </View>
            )}

            <View style={styles.chatSectionHeader}>
              <Text style={styles.chatSectionTitle}>Direct Messages</Text>
            </View>
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const conversationId = conv.conversation_id || conv.id;
                const isMuted = conversationId ? mutedConversations.has(conversationId) : false;
                return (
                  <TouchableOpacity
                    key={conversationId}
                    style={styles.chatItem}
                    onPress={() => router.push(`/dm/${conversationId}`)}
                  >
                    <Avatar name={conv.user?.name || '?'} photo={conv.user?.photo} size={50} />
                    <View style={styles.chatItemInfo}>
                      <Text style={styles.chatItemName}>{conv.user?.name}</Text>
                      <Text style={[styles.chatItemLastMsg, isMuted ? { color: COLORS.textLight } : undefined]} numberOfLines={1}>{conv.last_message || 'Send a message'}</Text>
                    </View>
                    <View style={styles.chatItemRight}>
                      <Text style={styles.chatItemTime}>{formatTime(conv.last_message_at)}</Text>
                      {isMuted && <Ionicons name="notifications-off" size={14} color={COLORS.textLight} style={{ marginTop: 4 }} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No private messages yet</Text>
              </View>
            )}

            <View style={{ height: 90 }} />
          </View>
        )}
      </ScrollView>
      {/* Locked Group Banner */}
      {showLockedBanner && (
        <View style={[styles.lockedBannerContainer, { bottom: 90 }]}>
          <TouchableOpacity
            style={styles.lockedBannerContent}
            onPress={() => {
              setShowLockedBanner(null);
              router.push('/profile/personality-verification');
            }}
          >
            <View style={styles.lockedBannerIcon}>
              <Ionicons name="lock-closed" size={20} color="#FF6600" />
            </View>
            <View style={styles.lockedBannerTextCol}>
              <Text style={styles.lockedBannerTitle}>Access Restricted</Text>
              <Text style={styles.lockedBannerSub}>This {showLockedBanner} is for verified personalities. Click to verify yourself.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowLockedBanner(null)} style={styles.lockedBannerClose}>
              <Ionicons name="close" size={20} color="#AAA" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Detailed Modal Bottom Sheet */}
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
                    {(getRequestTheme(selectedRequest).label || selectedRequest.request_type || 'Help Request').toUpperCase()}
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
              <Text style={styles.sheetTitle}>{selectedRequest.title}</Text>

              <View style={styles.sheetMetaRow}>
                <View style={[styles.urgencyBadgeSheet, {
                  backgroundColor: getUrgencyBadgeStyle(selectedRequest.urgency_level).bg,
                  borderColor: getUrgencyBadgeStyle(selectedRequest.urgency_level).border
                }]}>
                  <Text style={[styles.urgencyTextSheet, { color: getUrgencyBadgeStyle(selectedRequest.urgency_level).text }]}>
                    {selectedRequest.urgency_level.toUpperCase()} URGENCY
                  </Text>
                </View>
                <View style={styles.sheetLocBadge}>
                  <Ionicons name="location" size={14} color="#64748B" />
                  <Text style={styles.sheetLocText}>{selectedRequest.location || 'Mumbai'}</Text>
                </View>
              </View>

              <Text style={styles.sheetDescSectionTitle}>Details / Description</Text>
              <Text style={styles.sheetDesc}>{selectedRequest.description || 'No description provided.'}</Text>

              <View style={styles.requesterCard}>
                <Ionicons name="person-circle" size={40} color="#E2E8F0" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.requesterName}>{selectedRequest.user_name || 'Verified Neighbor'}</Text>
                  <Text style={styles.requesterLabel}>Community Member</Text>
                </View>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={[styles.sheetBtn, styles.sheetCallBtn]}
                  onPress={() => handleCall(selectedRequest.contact_number)}
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                  <Text style={styles.sheetCallBtnText}>Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetBtn, styles.sheetWhatsAppBtn]}
                  onPress={() => handleWhatsApp(selectedRequest.contact_number, selectedRequest.title)}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
                  <Text style={styles.sheetWhatsAppBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                {selectedRequest.user_id === user?.id && (
                  <TouchableOpacity 
                    style={[styles.sheetBtn, styles.sheetFulfillBtn]}
                    onPress={() => handleResolveRequest(selectedRequest.id)}
                  >
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                    <Text style={styles.sheetFulfillBtnText}>Fulfill Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerPadding: { paddingBottom: 12 },
  segmentedTrack: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 5,
    paddingRight: 7.5,
    paddingBottom: 4,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
  },
  segmentPill: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#8E8E93',
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
    left: '50%',
    bottom: -12,
    width: 207,
    height: 75,
    aspectRatio: 69 / 25,
    marginLeft: -103.5,
    zIndex: 0,
    opacity: 1,
    transform: [{ scaleX: 2.15 }, { scaleY: 2.6 }],
  },
  heroTextCol: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#000000',
    marginBottom: 4,
  },
  heroSubtitle: {
    width: 135,
    height: 32,
    fontSize: 12,
    fontFamily: FONTS.regular,
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
  subTitleSmall: { color: '#888', fontSize: 12, fontFamily: FONTS.regular },

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
  communityItemLabel: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.4, marginBottom: 3 },
  communityItemName: { fontSize: 14, fontFamily: FONTS.bold, color: '#000', lineHeight: 18 },
  communityItemMembers: { fontSize: 11, color: '#666', marginTop: 2, fontFamily: FONTS.regular },
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
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  localCommAvatarWrapper: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 1.5, marginTop: 2 },
  localCommAvatar: { width: '100%', height: '100%' },
  localCommContent: { alignItems: 'center', marginTop: 4 },
  localCommName: { fontSize: 12, fontFamily: FONTS.bold, color: '#000', textAlign: 'center', lineHeight: 15 },
  localCommMembers: { fontSize: 10, color: '#666', fontFamily: FONTS.regular, marginTop: 2, textAlign: 'center' },
  localCommPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: '#FFFFFF', minWidth: 72, alignItems: 'center' },
  localCommPillText: { fontSize: 10, fontFamily: FONTS.bold },
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
    gap: 12,
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
});
