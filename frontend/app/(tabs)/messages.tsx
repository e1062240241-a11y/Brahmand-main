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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  parseApiError 
} from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { getAllMutedConversations } from '../../src/services/mutedChats';

const { width } = Dimensions.get('window');
const CONVERSATIONS_CACHE_KEY = 'conversations_cache';
const COMMUNITIES_CACHE_KEY = 'communities_cache';

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
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

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

  // Mock datasets matching Figma design exactly for fallback & rendering
  const requestsToRender = requests.length > 0 ? requests : [
    { id: 'mock_1', title: 'O+Blood Required', request_type: 'blood', description: '', contact_number: '', urgency_level: 'critical', created_at: new Date(Date.now() - 10 * 60000).toISOString(), status: 'active', location: 'Andheri West, Mumbai' },
    { id: 'mock_2', title: 'Baby Food Required', request_type: 'food', description: '', contact_number: '', urgency_level: 'high', created_at: new Date(Date.now() - 60 * 60000).toISOString(), status: 'active', location: 'Bandra West, Mumbai' },
    { id: 'mock_3', title: 'Elderly Care Suport', request_type: 'care', description: '', contact_number: '', urgency_level: 'medium', created_at: new Date(Date.now() - 120 * 60000).toISOString(), status: 'active', location: 'Powai, Mumbai' },
    { id: 'mock_4', title: 'Cow Seva', request_type: 'gau', description: '', contact_number: '', urgency_level: 'low', created_at: new Date(Date.now() - 60 * 60000).toISOString(), status: 'active', location: 'Gau-shala, Ghatkopar' },
  ];

  const userGroupsToRender = userGroups;

  const getRequestTheme = (item: CommunityRequest) => {
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const type = (item.request_type || '').toLowerCase();
    const support = (item.support_needed || '').toLowerCase();

    if (type === 'blood' || title.includes('blood') || desc.includes('blood') || support === 'blood') {
      return {
        gradColors: ['#FFF0EE', '#FFE3E0'],
        border: 'rgba(255, 0, 34, 0.15)',
        icon: 'water',
        iconColor: '#E12D3D',
        btnBorderColor: '#FF5C5A',
      };
    }
    if (title.includes('food') || desc.includes('food') || title.includes('baby') || desc.includes('baby') || support === 'food') {
      return {
        gradColors: ['#FFF7E6', '#FFEED0'],
        border: 'rgba(255, 153, 0, 0.15)',
        icon: 'baby-face',
        iconColor: '#3397EE',
        btnBorderColor: '#FFB300',
      };
    }
    if (title.includes('cow') || desc.includes('cow') || title.includes('gau') || desc.includes('animal') || desc.includes('gau') || type === 'gau' || support === 'animal care') {
      return {
        gradColors: ['#F6EEF8', '#ECDCEF'],
        border: 'rgba(174, 0, 174, 0.15)',
        icon: 'cow',
        iconColor: '#5D4037',
        btnBorderColor: '#AE00AE',
      };
    }
    return {
      gradColors: ['#EEF7F2', '#DCEFE3'],
      border: 'rgba(13, 198, 0, 0.15)',
      icon: 'wheelchair',
      iconColor: '#757575',
      btnBorderColor: '#0DC600',
    };
  };

  const getCommunityFigmaDetails = (item: Community) => {
    const nameLower = (item.name || '').toLowerCase();
    
    if (nameLower.includes('mumbai') || item.type === 'city') {
      return {
        label: 'CITY COMMUNITY',
        name: 'Mumbai Community',
        memberCount: '13K members',
        avatarBadge: '+8',
        iconBg: '#F6EEFD',
        iconColor: '#9F45FF',
        iconName: 'location-sharp',
      };
    }
    if (nameLower.includes('maharashtra') || item.type === 'state') {
      return {
        label: 'STATE COMMUNITY',
        name: 'Maharashtra Community',
        memberCount: '14K members',
        avatarBadge: '+9',
        iconBg: '#FFF9E6',
        iconColor: '#FF9500',
        iconName: 'shield',
      };
    }
    if (nameLower.includes('bharat') || nameLower.includes('india') || nameLower.includes('national') || item.type === 'country') {
      return {
        label: 'NATIONAL COMMUNITY',
        name: 'Bharat Community',
        memberCount: '14K members',
        avatarBadge: '+11',
        iconBg: '#FFEBEB',
        iconColor: '#FF4500',
        iconName: 'flag',
      };
    }
    
    return {
      label: item.type === 'city' ? 'CITY COMMUNITY' : item.type === 'state' ? 'STATE COMMUNITY' : 'NATIONAL COMMUNITY',
      name: item.name,
      memberCount: `${item.member_count?.toLocaleString() || '1.2K'} members`,
      avatarBadge: '+5',
      iconBg: item.type === 'city' ? '#F6EEFD' : item.type === 'state' ? '#FFF9E6' : '#FFEBEB',
      iconColor: item.type === 'city' ? '#9F45FF' : item.type === 'state' ? '#FF9500' : '#FF4500',
      iconName: item.type === 'city' ? 'location-sharp' : item.type === 'state' ? 'shield' : 'flag',
    };
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
        const [communityRes, requestRes] = await Promise.all([
          getCommunities(),
          getCommunityRequests({ status: 'active', limit: 10 }),
        ]);
        
        const allComms = communityRes.data || [];
        // Filter out very specific types if needed, but here we want to show groups
        const verifiedComms = allComms.filter(
          (item: Community) => item.type !== 'home_area' && item.type !== 'area' && item.type !== 'cultural' && item.type !== 'user_group'
        );
        
        const userGroupsList = allComms.filter(
          (item: Community) => item.type === 'user_group'
        );

        setCommunities(verifiedComms);
        setUserGroups(userGroupsList);
        setRequests(requestRes.data || []);
      } else {
        const res = await getCircles();
        setCircles(res.data || []);
        fetchConversations();
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTopTab]);

  useEffect(() => {
    getAllMutedConversations().then(setMutedConversations);
  }, []);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchUserLokSangma = useCallback(async () => {
    try {
      const res = await getUserCulturalCommunity();
      setUserLokSangma(res.data);
    } catch (error) {
      console.error('Error fetching Lok Sangam:', error);
    }
  }, []);

  const loadLokSangmaOptions = async (search?: string) => {
    setLokSangmaLoading(true);
    try {
      const res = await getCulturalCommunities(search);
      setLokSangmaList(res.data || []);
    } catch (error) {
      console.error('Error loading Lok Sangam options:', error);
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
    if (activeTopTab === 'Community') {
      const combinedCount = (requests?.length || 0) + 3; // Real + 3 mock cards
      const timer = setInterval(() => {
        setActiveRequestIndex((prev) => {
          const nextIndex = (prev + 1) % combinedCount;
          const cardWidth = width * 0.48 + 14;
          activeRequestScrollRef.current?.scrollTo({ x: nextIndex * cardWidth, animated: true });
          return nextIndex;
        });
      }, 4000); // Advance every 4 seconds
      return () => clearInterval(timer);
    }
  }, [activeTopTab, requests?.length]);

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

  const renderActiveRequestCard = (item: CommunityRequest) => {
    const theme = getRequestTheme(item);

    return (
      <TouchableOpacity 
        key={item.id} 
        onPress={() => router.push(`/community-request`)}
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


  const renderCommunityItem = (item: Community) => {
    const isVerified = user?.personality_verification_status === 'approved';
    const userLevel = user?.verification_level; // 'state' or 'national'
    
    let isLocked = false;
    if (item.type === 'state') {
      isLocked = !isVerified || (userLevel !== 'state' && userLevel !== 'national');
    } else if (item.type === 'country') {
      isLocked = !isVerified || userLevel !== 'national';
    }

    const figma = getCommunityFigmaDetails(item);

    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.communityListItem, isLocked && styles.communityListItemLocked]}
        onPress={() => {
          if (isLocked) {
            setShowLockedBanner(item.type === 'country' ? 'National Community' : 'State Community');
          } else {
            router.push(`/community/${item.id}`);
          }
        }}
      >
        <View style={[styles.communityIconBox, { backgroundColor: figma.iconBg }]}>
          <Ionicons name={figma.iconName as any} size={22} color={isLocked ? '#AAA' : figma.iconColor} />
        </View>
        <View style={styles.communityItemContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.communityItemLabel, { color: isLocked ? '#AAA' : figma.iconColor }]}>{figma.label}</Text>
            {isLocked && <Ionicons name="lock-closed" size={10} color="#FF3B30" style={{ marginLeft: 4 }} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.communityItemName, isLocked && { color: '#666' }]}>{figma.name}</Text>
          </View>
          <Text style={styles.communityItemMembers}>{figma.memberCount}</Text>
        </View>
        <View style={styles.communityItemRight}>
          {!isLocked ? (
            <View style={styles.avatarStack}>
              {[1, 2, 3, 4].map((i) => (
                <Image 
                  key={i} 
                  source={{ uri: `https://i.pravatar.cc/100?u=${item.id}${i}` }} 
                  style={[styles.stackAvatar, { marginLeft: i === 0 ? 0 : -10 }]} 
                />
              ))}
              <View style={[styles.stackAvatarCount, { marginLeft: -10, backgroundColor: figma.iconColor }]}>
                <Text style={[styles.stackAvatarCountText, { color: '#FFF' }]}>{figma.avatarBadge}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>Verify Access</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </View>
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
        <View style={styles.localCommMenu}>
          <Ionicons name="ellipsis-vertical" size={16} color="#000" />
        </View>
        
        <View style={[styles.localCommAvatarWrapper, { borderColor: `${borderColor}33` }]}>
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
    <View style={styles.container}>
      <LinearGradient colors={['#FF9933', '#FFF8F0']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topTabsWrapper}>
            <TouchableOpacity 
              style={[styles.topTabCard, activeTopTab === 'Community' ? styles.topTabCardActive : styles.topTabCardInactive]}
              onPress={() => setActiveTopTab('Community')}
            >
              <MaterialCommunityIcons 
                name="account-group" 
                size={22} 
                color={activeTopTab === 'Community' ? '#FFF' : '#000'} 
                style={styles.topTabIcon} 
              />
              <View style={styles.topTabTextCol}>
                <Text style={activeTopTab === 'Community' ? styles.topTabTitle : styles.topTabTitleDark}>Community</Text>
                <Text style={activeTopTab === 'Community' ? styles.topTabSub : styles.topTabSubDark}>Connect, Join & Grow Together</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.topTabCard, activeTopTab === 'Private Chat' ? styles.topTabCardActive : styles.topTabCardInactive]}
              onPress={() => setActiveTopTab('Private Chat')}
            >
              <MaterialCommunityIcons 
                name="chat-processing-outline" 
                size={20} 
                color={activeTopTab === 'Private Chat' ? '#FFF' : '#000'} 
                style={styles.topTabIcon} 
              />
              <View style={styles.topTabTextCol}>
                <Text style={activeTopTab === 'Private Chat' ? styles.topTabTitle : styles.topTabTitleDark}>Private Chat</Text>
                <Text style={activeTopTab === 'Private Chat' ? styles.topTabSub : styles.topTabSubDark}>One-to-one Spiritual Connections</Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.mainContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {activeTopTab === 'Community' ? (
          <View style={styles.communityContent}>
            {/* Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroTextCol}>
                <Text style={styles.heroTitle}>Help your community</Text>
                <Text style={styles.heroSubtitle}>Together we can{"\n"}make a difference</Text>
                <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/community-request')}>
                  <Ionicons name="add" size={16} color="#FFF" />
                  <Text style={styles.heroButtonText}>Create Request</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.heroImageContainer}>
                <Image 
                  source={require('../../assets/images/community_hero_final.png')} 
                  style={styles.heroImageHalf}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Verified Communities */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sectionTitle}>Our Communities</Text>
                <View style={styles.figmaVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={10} color="#FFF" />
                  <Text style={styles.figmaVerifiedText}>Verified</Text>
                </View>
              </View>
            </View>
            <View style={styles.communitiesList}>
              {communities.map(renderCommunityItem)}
            </View>

            {/* Local Communities Header */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={24} color="#FF6600" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Local Communities <Text style={styles.subTitleSmall}>(User Groups)</Text></Text>
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
                  <TouchableOpacity onPress={() => router.push('/community-request')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ marginTop: 10 }}>
                  <ScrollView 
                    ref={activeRequestScrollRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
                    snapToInterval={130}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    style={Platform.OS === 'web' ? { cursor: 'grab' } : {}}
                    onMomentumScrollEnd={(e) => {
                      const x = e.nativeEvent.contentOffset.x;
                      setActiveRequestIndex(Math.round(x / 130));
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },
  headerGradient: { paddingBottom: 20 },
  topTabsWrapper: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 12 },
  topTabCard: { flex: 1, height: 53, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 0 } },
  topTabCardActive: { backgroundColor: '#FF3400', borderWidth: 1, borderColor: '#FFFFFF' },
  topTabCardActivePrivate: { backgroundColor: 'rgba(255, 255, 255, 0.50)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.10)' },
  topTabCardInactive: { backgroundColor: 'rgba(255, 255, 255, 0.50)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.10)' },
  topTabIcon: { marginRight: 8 },
  topTabTextCol: { flex: 1 },
  topTabTitle: { fontSize: 11, fontFamily: FONTS.bold, color: '#FFF' },
  topTabSub: { fontSize: 9, fontFamily: FONTS.regular, marginTop: 1, color: 'rgba(255,255,255,0.9)', lineHeight: 10 },
  topTabTitleDark: { fontSize: 11, fontFamily: FONTS.bold, color: '#000' },
  topTabSubDark: { fontSize: 9, fontFamily: FONTS.regular, color: '#666', marginTop: 1, lineHeight: 10 },

  mainContent: { flex: 1 },
  communityContent: { paddingHorizontal: 16, paddingTop: 16 },
  
  heroBanner: { backgroundColor: '#FFF9F5', borderRadius: 24, marginBottom: 24, overflow: 'hidden', height: 160, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  heroTextCol: { flex: 1.5, paddingLeft: 20 },
  heroTitle: { fontSize: 26, fontFamily: FONTS.bold, color: '#111', fontWeight: '900' },
  heroSubtitle: { fontSize: 14, fontFamily: FONTS.regular, color: '#333', marginTop: 6, lineHeight: 20 },
  heroButton: { backgroundColor: '#FF6600', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginTop: 15, elevation: 4 },
  heroButtonText: { color: '#FFF', fontSize: 14, fontFamily: FONTS.bold, marginLeft: 6 },
  heroImageContainer: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'flex-end' },
  heroImageHalf: { width: '100%', height: '100%', opacity: 0.95 },
  bloodCardBgIllust: { position: 'absolute', right: -10, top: 20, opacity: 0.3 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  sectionTitle: { fontSize: 17, fontFamily: FONTS.bold, color: '#111' },
  viewAllText: { fontSize: 14, color: '#FF6600', fontFamily: FONTS.bold },
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

  figmaVerifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  figmaVerifiedText: { color: '#FFF', fontSize: 9, fontFamily: FONTS.bold },

  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  dotActive: { backgroundColor: '#FF6600', width: 12 },
  dotInactive: { backgroundColor: '#DDD' },

  communitiesList: { marginBottom: 24, backgroundColor: '#FDF3EA', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 149, 0, 0.10)', paddingTop: 17, paddingRight: 7, paddingBottom: 16, paddingLeft: 6, gap: 12 },
  communityListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', padding: 10 },
  communityListItemLocked: { opacity: 0.8 },
  lockedBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  lockedBadgeText: { fontSize: 10, color: '#AAA', fontFamily: FONTS.bold },
  communityIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  communityItemContent: { flex: 1 },
  communityItemLabel: { fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.5, marginBottom: 2 },
  communityItemName: { fontSize: 12, fontFamily: FONTS.bold, color: '#000' },
  communityItemMembers: { fontSize: 10, color: '#888', marginTop: 2 },
  communityItemRight: { flexDirection: 'row', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  stackAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#FDF3EA' },
  stackAvatarCount: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FDF3EA' },
  stackAvatarCountText: { fontSize: 8, fontFamily: FONTS.bold },

  localCommCard: { width: 140, height: 170, borderRadius: 16, padding: 12, marginRight: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'space-between', position: 'relative', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  localCommMenu: { position: 'absolute', right: 10, top: 10, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  localCommAvatarWrapper: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', borderWidth: 1.5, elevation: 1, shadowOpacity: 0.05, shadowRadius: 1, marginTop: 4 },
  localCommAvatar: { width: '100%', height: '100%' },
  localCommContent: { alignItems: 'center', marginTop: 4 },
  localCommName: { fontSize: 11, fontFamily: FONTS.bold, color: '#000', textAlign: 'center' },
  localCommMembers: { fontSize: 9, color: '#666', fontFamily: FONTS.regular, marginTop: 2 },
  localCommPill: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, borderWidth: 1, backgroundColor: '#FFFFFF' },
  localCommPillText: { fontSize: 9, fontFamily: FONTS.bold },
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
});
