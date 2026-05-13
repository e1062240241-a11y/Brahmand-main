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
  const [circles, setCircles] = useState<Circle[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [mutedConversations, setMutedConversations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

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
        
        // Filter out very specific types if needed, but here we want to show groups
        const filtered = (communityRes.data || []).filter(
          (item: Community) => item.type !== 'home_area' && item.type !== 'area' && item.type !== 'cultural'
        );
        
        setCommunities(filtered);
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

  // --- RENDERING COMPONENTS ---

  const renderActiveRequestCard = (item: CommunityRequest) => {
    const isBlood = item.request_type?.toLowerCase() === 'blood';
    const isFood = item.request_type?.toLowerCase() === 'food';
    const isCare = item.request_type?.toLowerCase() === 'care';

    const cardBg = isBlood ? '#FFE8E8' : isFood ? '#F1F9E8' : '#F4EEFF';
    const accentColor = isBlood ? '#FF5252' : isFood ? '#4CAF50' : '#7E57C2';
    const illustSource = isBlood 
      ? require('../../assets/images/illust_blood.png') 
      : isFood 
        ? require('../../assets/images/illust_food.png') 
        : require('../../assets/images/illust_care.png');

    return (
      <TouchableOpacity key={item.id} style={[styles.activeRequestCard, { backgroundColor: cardBg }]}>
        <View style={styles.reqCardIllustWrapper}>
          <Image source={illustSource} style={styles.reqCardIllustImage} resizeMode="contain" />
        </View>
        
        <View style={styles.reqCardHeader}>
          <Text style={styles.reqCardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.reqUrgencyPill}>
            <Text style={[styles.reqUrgencyText, { color: accentColor }]}>{item.urgency_level || 'Medium'}</Text>
          </View>
        </View>

        <View style={styles.reqCardFooter}>
          <View style={styles.reqInfoRow}>
            <Ionicons name="location-sharp" size={12} color="#000" />
            <Text style={styles.reqInfoText} numberOfLines={2}>{item.location || 'Mumbai'}</Text>
          </View>
          <View style={[styles.reqInfoRow, { marginBottom: 0 }]}>
            <Ionicons name="person-circle-sharp" size={14} color="#000" />
            <Text style={styles.reqPosterName} numberOfLines={1}>Posted by {item.user_name || 'User'}</Text>
            <Text style={styles.reqPostedTime}>10 min ago</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  const renderCommunityItem = (item: Community) => {
    const isVerified = user?.personality_verification_status === 'approved';
    const userLevel = user?.verification_level; // 'state' or 'national'
    
    let isLocked = false;
    if (item.type === 'state') {
      // Locked if not verified OR verified at a level that isn't state/national (shouldn't happen but safe)
      isLocked = !isVerified || (userLevel !== 'state' && userLevel !== 'national');
    } else if (item.type === 'country') {
      // Locked if not verified OR verified only at state level
      isLocked = !isVerified || userLevel !== 'national';
    }
    const label = item.type === 'city' ? 'CITY COMMUNITY' : item.type === 'state' ? 'STATE COMMUNITY' : item.type === 'country' ? 'NATIONAL COMMUNITY' : 'COMMUNITY';
    const labelColor = item.type === 'city' ? '#9B59B6' : item.type === 'state' ? '#E67E22' : '#D35400';
    const iconName = item.type === 'city' ? 'location' : item.type === 'state' ? 'map' : 'flag';
    const iconColor = item.type === 'city' ? '#A55EEA' : item.type === 'state' ? '#FB8C00' : '#FF5252';

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
        <View style={[styles.communityIconBox, { backgroundColor: isLocked ? '#F0F0F0' : `${iconColor}15` }]}>
          <Ionicons name={isLocked ? 'lock-closed' : iconName} size={26} color={isLocked ? '#AAA' : iconColor} />
        </View>
        <View style={styles.communityItemContent}>
          <Text style={[styles.communityItemLabel, { color: isLocked ? '#AAA' : labelColor }]}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.communityItemName, isLocked && { color: '#666' }]}>{item.name}</Text>
            {isLocked && <Ionicons name="lock-closed" size={14} color="#AAA" style={{ marginLeft: 6 }} />}
          </View>
          <Text style={styles.communityItemMembers}>{item.member_count?.toLocaleString()} members</Text>
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
              <View style={[styles.stackAvatarCount, { marginLeft: -10 }]}>
                <Text style={styles.stackAvatarCountText}>+8</Text>
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

  const renderLocalCommunityCard = (item: any, index: number) => {
    const isPurple = index % 2 === 1;
    const cardBg = isPurple ? '#F4EEFF' : '#F1F9E8';
    const borderColor = isPurple ? '#7E57C2' : '#4CAF50';
    const pillText = item.badge || 'Seva';

    return (
      <TouchableOpacity key={item.id} style={[styles.localCommCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.localCommMenu}>
          <Ionicons name="ellipsis-vertical" size={18} color="#000" />
        </View>
        
        <View style={styles.localCommAvatarWrapper}>
          <Image source={{ uri: item.image }} style={styles.localCommAvatar} />
        </View>

        <View style={styles.localCommContent}>
          <Text style={styles.localCommName}>{item.name}</Text>
          <Text style={styles.localCommMembers}>{item.members} members</Text>
        </View>

        <View style={[styles.localCommPill, { borderColor }]}>
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
                size={42} 
                color={activeTopTab === 'Community' ? '#FFF' : '#FF6600'} 
                style={styles.topTabIcon} 
              />
              <View style={styles.topTabTextCol}>
                <Text style={[styles.topTabTitle, { color: activeTopTab === 'Community' ? '#FFF' : '#333' }]}>Community</Text>
                <Text style={[styles.topTabSub, { color: activeTopTab === 'Community' ? 'rgba(255,255,255,0.9)' : '#888' }]}>Connect, Join & Grow Together</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.topTabCard, activeTopTab === 'Private Chat' ? styles.topTabCardActivePrivate : styles.topTabCardInactive]}
              onPress={() => setActiveTopTab('Private Chat')}
            >
              <MaterialCommunityIcons 
                name="chat-processing-outline" 
                size={40} 
                color="#111" 
                style={styles.topTabIcon} 
              />
              <View style={styles.topTabTextCol}>
                <Text style={styles.topTabTitleDark}>Private Chat</Text>
                <Text style={styles.topTabSubDark}>One-to-one Spiritual Connections</Text>
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

            {/* Active Requests */}
            {requests.length > 0 && (
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
                    snapToInterval={width * 0.48 + 14}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    style={Platform.OS === 'web' ? { cursor: 'grab' } : {}}
                    onMomentumScrollEnd={(e) => {
                      const x = e.nativeEvent.contentOffset.x;
                      const cardWidth = width * 0.48 + 14;
                      setActiveRequestIndex(Math.round(x / cardWidth));
                    }}
                  >
                    {requests.map(renderActiveRequestCard)}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Verified Communities */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our Communities <Text style={styles.verifiedTag}>(Verified) <Ionicons name="shield-checkmark" size={14} color="#FF6600" /></Text></Text>
            </View>
            <View style={styles.communitiesList}>
              {communities.map(renderCommunityItem)}
            </View>

            {/* Local Communities Header */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={24} color="#FF6600" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Loacl Communities <Text style={styles.subTitleSmall}>(User Groups)</Text></Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Local Communities Slider */}
            <View style={{ marginBottom: 10 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              >
                {[
                  { id: 'lc1', name: 'Indore Seva Group', members: 128, badge: 'Seva', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
                  { id: 'lc2', name: 'Borivali Youth Connect', members: 96, badge: 'Youth', image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400' },
                  { id: 'lc3', name: 'Pune Food Sharing Group', members: 236, badge: 'Seva', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400' }
                ].map((item, idx) => renderLocalCommunityCard(item, idx))}
              </ScrollView>
            </View>

            {/* Create Community CTA */}
            <View style={styles.footerCTA}>
              <View style={styles.footerIconBox}>
                 <Ionicons name="people" size={32} color="#FF6600" />
                 <View style={styles.plusOverlay}><Ionicons name="add-circle" size={16} color="#FF6600" /></View>
              </View>
              <View style={styles.footerTextCol}>
                <Text style={styles.footerTitle}>Create Your Community</Text>
                <Text style={styles.footerSub}>Build your own local community and bring like-minded people together.</Text>
              </View>
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.footerButtonText}>Create Community</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ height: 120 }} />
          </View>
        ) : (
          <View style={styles.chatContent}>
             <View style={styles.chatSectionHeader}>
                <Text style={styles.chatSectionTitle}>Groups & Circles</Text>
                <TouchableOpacity onPress={() => router.push('/circles')}>
                  <Text style={styles.viewAllText}>Manage</Text>
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
             
             <View style={{ height: 120 }} />
          </View>
        )}
      </ScrollView>
      {/* Locked Group Banner */}
      {showLockedBanner && (
        <View style={styles.lockedBannerContainer}>
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
  topTabCard: { flex: 1, height: 80, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  topTabCardActive: { backgroundColor: '#FF4D00' },
  topTabCardActivePrivate: { backgroundColor: '#FFF' },
  topTabCardInactive: { backgroundColor: '#FFF' },
  topTabIcon: { marginRight: 12 },
  topTabTextCol: { flex: 1 },
  topTabTitle: { fontSize: 16, fontFamily: FONTS.bold },
  topTabSub: { fontSize: 9, fontFamily: FONTS.regular, marginTop: 1, lineHeight: 12 },
  topTabTitleDark: { fontSize: 16, fontFamily: FONTS.bold, color: '#111' },
  topTabSubDark: { fontSize: 9, fontFamily: FONTS.regular, color: '#888', marginTop: 1, lineHeight: 12 },

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

  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  dotActive: { backgroundColor: '#FF6600', width: 12 },
  dotInactive: { backgroundColor: '#DDD' },

  communitiesList: { marginBottom: 24, gap: 12 },
  communityListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBF1', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#FFE8D4' },
  communityListItemLocked: { backgroundColor: '#F9F9F9', borderColor: '#EEE' },
  lockedBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginRight: 8 },
  lockedBadgeText: { fontSize: 10, color: '#AAA', fontFamily: FONTS.bold },
  communityIconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  communityItemContent: { flex: 1 },
  communityItemLabel: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5, marginBottom: 2 },
  communityItemName: { fontSize: 16, fontFamily: FONTS.bold, color: '#111' },
  communityItemMembers: { fontSize: 12, color: '#888', marginTop: 2 },
  communityItemRight: { flexDirection: 'row', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  stackAvatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#FFFBF1' },
  stackAvatarCount: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFD4B2', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFBF1' },
  stackAvatarCountText: { fontSize: 9, fontFamily: FONTS.bold, color: '#FF6600' },

  localCommCard: { width: width * 0.38, borderRadius: 24, padding: 15, marginRight: 15, borderWidth: 1.5, alignItems: 'center' },
  localCommMenu: { position: 'absolute', right: 10, top: 10 },
  localCommAvatarWrapper: { width: 75, height: 75, borderRadius: 37.5, overflow: 'hidden', marginBottom: 12, borderWidth: 2, borderColor: '#FFF', elevation: 3, shadowOpacity: 0.1, shadowRadius: 3 },
  localCommAvatar: { width: '100%', height: '100%' },
  localCommContent: { alignItems: 'center', marginBottom: 12 },
  localCommName: { fontSize: 13, fontFamily: FONTS.bold, color: '#000', textAlign: 'center', marginBottom: 4 },
  localCommMembers: { fontSize: 11, color: '#333', fontFamily: FONTS.medium },
  localCommPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: '#FFF' },
  localCommPillText: { fontSize: 11, fontFamily: FONTS.bold },

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
  emptyChat: { padding: 20, alignItems: 'center' },
  emptyChatText: { color: '#AAA', fontSize: 14 },
  
  lockedBannerContainer: {
    position: 'absolute',
    bottom: 100, // Above tab bar
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
