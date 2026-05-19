import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Alert,
  Share,
  Modal,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCommunity, getCommunityMessages, sendCommunityMessage, deleteCommunityRequest, sendDirectMessage, getUserProfile } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';
import { MentionInput } from '../../src/components/MentionInput';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Persists across navigation (module-level cache) — survives tab switches but NOT full reloads
const localPostCategories = new Map<string, string>();

// Persists across full reloads via localStorage (web) / AsyncStorage (native)
const POST_CACHE_KEY = 'brahmand_local_posts';
function saveLocalPost(content: string, category: string) {
  localPostCategories.set(content, category);
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(POST_CACHE_KEY) : null;
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[content] = category;
    if (typeof localStorage !== 'undefined') localStorage.setItem(POST_CACHE_KEY, JSON.stringify(map));
  } catch {}
}
function getLocalCategory(content: string): string | undefined {
  const fromMap = localPostCategories.get(content);
  if (fromMap) return fromMap;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(POST_CACHE_KEY) : null;
    if (raw) {
      const map: Record<string, string> = JSON.parse(raw);
      return map[content];
    }
  } catch {}
  return undefined;
}

const COMMUNITY_TABS = ['Feed', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

const MOCK_FESTIVALS = [
  { id: '1', name: 'Diwali', icon: 'flame-outline', events: 12, color: '#FFF5F0', iconColor: '#FF6B00' },
  { id: '2', name: 'Navratri', icon: 'sunny-outline', events: 18, color: '#FFF9EB', iconColor: '#FFB800' },
  { id: '3', name: 'Janmashtami', icon: 'color-palette-outline', events: 10, color: '#F0F9FF', iconColor: '#00A3FF' },
  { id: '4', name: 'Ganesh Chaturthi', icon: 'flower-outline', events: 8, color: '#FFF0F5', iconColor: '#FF007A' },
  { id: '5', name: 'Makar Sankranti', icon: 'paper-plane-outline', events: 6, color: '#F0FFF4', iconColor: '#00C853' },
];

const MOCK_FESTIVAL_EVENTS = [
  {
    id: 'fe1',
    title: 'Diwali Celebration 2024',
    description: 'Join us for a grand Diwali celebration with prayers, lights & community dinner.',
    location: 'Ramakrishna Math, Andheri West',
    time: '31 Oct 2024, 6:00 PM',
    image: require('../../assets/images/image temple/Siddhivinayak-Temple.webp'),
    organizer: { name: 'Rahul Joshi', photo: null, isVerified: true },
    timeAgo: '2h ago'
  },
  {
    id: 'fe2',
    title: 'Ganesh Chaturthi Aarti',
    description: 'Community aarti and prasad distribution for all devotees.',
    location: 'Lokhandwala, Andheri West',
    time: '7 Sep 2024, 7:00 PM',
    image: require('../../assets/images/image temple/Siddhivinayak-Temple.webp'),
    organizer: { name: 'Neha Sharma', photo: null, isVerified: true },
    timeAgo: '5h ago'
  },
  {
    id: 'fe3',
    title: 'Navratri Garba Night',
    description: 'Nine nights of celebration, dance and divine energy.',
    location: 'NSCI Dome, Worli',
    time: '3 Oct 2024, 8:00 PM',
    image: require('../../assets/images/image temple/Siddhivinayak-Temple.webp'),
    organizer: { name: 'Amit Patel', photo: null, isVerified: true },
    timeAgo: '1d ago'
  }
];

interface DiscussionPost {
  id: string;
  user: {
    name: string;
    photo?: any;
    isVerified: boolean;
    verificationLabel: string;
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
}

const MOCK_DISCUSSION: DiscussionPost[] = [
  {
    id: 'd1',
    user: {
      name: 'Sadhvi Ritambhara Ji',
      isVerified: true,
      verificationLabel: 'Maharashtra Verified',
    },
    content: "This Sunday, join the statewide Hanuman Chalisa Path across Maharashtra. Let's come together for Dharma, Devotion & Desh.",
    timestamp: '2h ago',
    likes: 128,
    comments: 24,
    reposts: 16,
    shares: 0,
    liked: false,
  },
  {
    id: 'd2',
    user: {
      name: 'Swami Avimukteshwaranand',
      isVerified: true,
      verificationLabel: 'Bharat Verified',
    },
    content: "Dharma is not just prayer, it's action. Let's seva together for a stronger Bharat.",
    timestamp: '4h ago',
    likes: 96,
    comments: 18,
    reposts: 12,
    shares: 0,
    liked: false,
  },
  {
    id: 'd3',
    user: {
      name: 'Dr. Chinmay Pandya',
      isVerified: true,
      verificationLabel: 'Maharashtra Verified',
    },
    content: "Youth are the strength of our Bharat. Join the movement. Build values, build the future.",
    timestamp: '6h ago',
    likes: 78,
    comments: 14,
    reposts: 9,
    shares: 0,
    liked: false,
  }
];

export default function CommunityDetailScreen() {
  const { id, postId } = useLocalSearchParams<{ id: string, postId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  
  const [community, setCommunity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Feed');
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [discussionPosts, setDiscussionPosts] = useState<DiscussionPost[]>(MOCK_DISCUSSION);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [allFestivals, setAllFestivals] = useState<any[]>(MOCK_FESTIVALS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postCategory, setPostCategory] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  const [showCommentModal, setShowCommentModal] = useState<DiscussionPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeComments, setActiveComments] = useState<any[]>([]);

  const dynamicTabs = useMemo(() => {
    return COMMUNITY_TABS;
  }, []);

  const mostRecentRequest = useMemo(() => {
    if (!requests || requests.length === 0) {
      return {
        id: 'mock_1',
        title: 'O+ Blood Required urgently for operation',
        request_type: 'blood',
        description: 'Patient is admitted at Lifeline Hospital in ICU. Need 2 units of O+ blood as soon as possible. Any help would be highly appreciated.',
        contact_number: '+919876543210',
        urgency_level: 'critical',
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
        status: 'active',
        location: 'Andheri West, Mumbai',
        user_name: 'Rahul Joshi'
      };
    }
    return [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [requests]);

  const getUnixTimestamp = (item: any) => {
    if (item.created_at) {
      const d = new Date(item.created_at);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    if (item.timestamp) {
      const d = new Date(item.timestamp);
      if (!Number.isNaN(d.getTime())) return d.getTime();
      
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
    }
    if (item.start_time) {
      const d = new Date(item.start_time);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  };

  const combinedData = useMemo(() => {
    if (activeTab === 'Requests') {
      return requests;
    }
    if (activeTab === 'Events') {
      return events;
    }
    if (activeTab === 'Festivals') {
      return [
        { id: 'fest-header-main', type: 'festivals_header' },
        { id: 'fest-list-horizontal', type: 'festivals_list' },
        { id: 'fest-events-header-sub', type: 'festival_events_header' },
        ...MOCK_FESTIVAL_EVENTS.map(e => ({ ...e, type: 'festival_event' })),
        { id: 'fest-banner-footer', type: 'festival_banner' }
      ];
    }
    if (activeTab === 'Feed') {
      const itemMap = new Map();
      
      // Discussion posts are always chat posts in Feed
      discussionPosts.forEach(p => itemMap.set(p.id, p));
      
      // All chat messages (community posts) only show in Feed section
      communityPosts.forEach(p => {
        if (!itemMap.has(p.id)) {
          itemMap.set(p.id, p);
        }
      });

      // Also merge requests into the main feed!
      requests.forEach(r => {
        if (!itemMap.has(r.id)) {
          itemMap.set(r.id, { ...r, isRequestItem: true });
        }
      });
      
      // Sort everything chronologically by exact timestamp (latest first)
      return Array.from(itemMap.values()).sort((a, b) => getUnixTimestamp(b) - getUnixTimestamp(a));
    }
    
    // For other tabs (like Lost & Found, Seva, Temple Updates), they do not show chat messages either
    return [];
  }, [activeTab, requests, events, discussionPosts, communityPosts]);

  useFocusEffect(
    useCallback(() => {
      fetchCommunity();
    }, [id])
  );

  useFocusEffect(
    useCallback(() => {
      fetchCommunity();
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

  const fetchCommunity = async () => {
    try {
      setHasMorePosts(true);
      const response = await getCommunity(id as string);
      setCommunity(response.data);
      
      const { getCommunityRequests, getEvents, getCommunityMessages, getFestivalList } = require('../../src/services/api');
      
      const [reqResponse, eventResponse, msgResponse, festResponse] = await Promise.all([
        getCommunityRequests({ community_id: id as string }),
        getEvents(),
        getCommunityMessages(id as string, 'city'), // Assuming 'city' level for local posts
        getFestivalList()
      ]);
      
      console.log('[Community] Requests fetched:', reqResponse.data?.length);
      setRequests(reqResponse.data || []);
      setEvents(eventResponse.data || []);
      
      if (festResponse.data && festResponse.data.length > 0) {
        setAllFestivals(festResponse.data.map((f: any) => ({
          ...f,
          icon: 'flower-outline',
          color: '#F0F9FF',
          iconColor: '#00A3FF'
        })));
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
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: true,
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id, // Map sender ID to check for delete ownership
      }));

      setCommunityPosts((prev: any[]) => {
        const localPosts = prev.filter((p: any) => String(p.id).startsWith('post-'));
        const apiById = new Map(formattedMsgs.map((p: any) => [p.id, p]));
        for (const local of localPosts) {
          const existing = apiById.get(local.id);
          if (existing) {
            Object.assign(existing, local);
          } else {
            apiById.set(local.id, local);
          }
        }
        const seen = new Set(localPosts.map((p: any) => p.id));
        return [...localPosts, ...formattedMsgs.filter((p: any) => !seen.has(p.id))];
      });
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
      const msgResponse = await getCommunityMessages(id as string, 'city', communityPosts.length + 20);
      const newMsgs = (msgResponse.data || []).slice(communityPosts.length).map((msg: any) => ({
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
        hideBadge: true,
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id, // Map sender ID to check for delete ownership
      }));
      
      if (newMsgs.length > 0) {
        setCommunityPosts(prev => [...prev, ...newMsgs]);
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
    fetchCommunity().then(() => setRefreshing(false));
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={{ height: 60 + insets.top }} />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {dynamicTabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  const renderDiscussionItem = ({ item }: { item: DiscussionPost }) => (
    <View style={styles.postContainer}>
      {item.isRepost && (
        <View style={styles.repostHeaderLabel}>
          <Ionicons name="repeat" size={14} color="#536471" />
          <Text style={styles.repostHeaderText}>{item.repostedBy || 'Someone'} reposted</Text>
        </View>
      )}
      
      <View style={styles.postMainRow}>
        <View style={styles.postLeftCol}>
          <Avatar name={item.user.name} photo={item.user.photo} size={48} />
        </View>
        
        <View style={styles.postRightCol}>
          <View style={styles.postHeaderRow}>
            <View style={styles.postNameContainer}>
              <Text style={styles.feedPostUserName} numberOfLines={1}>{item.user.name}</Text>
              {item.user.isVerified && !item.hideBadge && <MaterialCommunityIcons name="check-decagram" size={18} color="#FF3B30" style={{ marginLeft: 2 }} />}
              <Text style={styles.postHandle} numberOfLines={1}> @{item.user.name.replace(/\s+/g, '').toLowerCase()}</Text>
            </View>
            {(item.sender_id === user?.id || item.user.name === user?.name) && (
              <TouchableOpacity 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.postContentText}>{item.content}</Text>
          
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.postMediaImage} resizeMode="cover" />
          )}

          <View style={styles.postActionRow}>
            <TouchableOpacity 
              style={styles.postActionBtn}
              onPress={() => {
                setActiveComments([]); // Clear old comments
                setShowCommentModal(item);
              }}
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


  const renderEventItem = ({ item }: { item: any }) => {
    // Basic date parsing for mock parity if data is real
    const eventDate = item.start_time ? new Date(item.start_time) : new Date();
    const dateNum = eventDate.getDate().toString();
    const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventInfoRow}>
          <View style={styles.eventDateCol}>
            <Text style={styles.eventDate}>{dateNum}</Text>
            <Text style={styles.eventMonth}>{month}</Text>
          </View>
          <View style={styles.eventTextCol}>
            <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.eventMeta}>{item.location || 'Online'}</Text>
            <View style={styles.goingRow}>
              <Ionicons name="people" size={12} color="#888" />
              <Text style={styles.goingText2}>{item.attendee_count || 0} Going</Text>
            </View>
          </View>
          {item.image_url && <Image source={{ uri: item.image_url }} style={styles.eventImage} />}
        </View>
        <View style={styles.eventActionRow}>
          <View style={styles.interestedBadge}>
            <Ionicons name="heart" size={14} color="#FF3B30" />
            <Text style={styles.interestedText}>{item.interested_count || 0} Interested</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFestivalItem = ({ item }: { item: any }) => (
    <View style={[styles.festivalTypeCard, { backgroundColor: item.color }]}>
      <View style={styles.festivalIconCircle}>
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
      </View>
      <Text style={styles.festivalTypeName}>{item.name}</Text>
      <View style={styles.festivalEventCount}>
        <Text style={styles.festivalEventCountNum}>{item.events}</Text>
        <Text style={styles.festivalEventCountText}>Events</Text>
      </View>
    </View>
  );

  const renderFestivalEvent = ({ item }: { item: any }) => (
    <View style={styles.festEventCard}>
      <View style={styles.festEventMain}>
        <Image source={item.image} style={styles.festEventImage} />
        <View style={styles.festEventInfo}>
          <Text style={styles.festEventTitle}>{item.title}</Text>
          <Text style={styles.festEventDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.festEventMeta}>
            <View style={styles.festMetaRow}>
              <Ionicons name="location-outline" size={14} color="#FF3B30" />
              <Text style={styles.festMetaText}>{item.location}</Text>
            </View>
            <View style={styles.festMetaRow}>
              <Ionicons name="time-outline" size={14} color="#FF3B30" />
              <Text style={styles.festMetaText}>{item.time}</Text>
            </View>
          </View>
        </View>
        <View style={styles.festOrganizerCol}>
          <Avatar name={item.organizer.name} size={40} />
          <View style={styles.festOrgDetails}>
            <View style={styles.festOrgNameRow}>
              <Text style={styles.festOrgName} numberOfLines={1}>{item.organizer.name}</Text>
              {item.organizer.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#007AFF" />}
            </View>
            <Text style={styles.festOrgLabel}>Organizer</Text>
            <Text style={styles.festTimeAgo}>{item.timeAgo}</Text>
          </View>
          <TouchableOpacity style={styles.attendBtn}>
            <Text style={styles.attendBtnText}>I Will Attend</Text>
          </TouchableOpacity>
          <View style={styles.festActionRow}>
             <TouchableOpacity style={styles.festMiniBtn}>
               <Ionicons name="bookmark-outline" size={18} color="#536471" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.festMiniBtn}>
               <Ionicons name="share-social-outline" size={18} color="#536471" />
             </TouchableOpacity>
          </View>
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
    return { name: 'help-circle', color: '#00796B', bg: '#E0F2F1' };
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const iconDetails = getRequestIconDetails(item);
    return (
      <View style={styles.eventCard}>
        <View style={styles.requestInterestedHeader}>
          <View style={styles.interestedBadge}>
            <Ionicons name="heart" size={14} color="#FF3B30" />
            <Text style={styles.interestedText}>{item.interested_count || 0} Interested</Text>
          </View>
          <Text style={styles.urgencyLabel}>{item.urgency_level || 'Normal'}</Text>
        </View>
        
        <View style={styles.eventInfoRow}>
          <View style={styles.requestIconCol}>
             <View style={[styles.requestIconBg, { backgroundColor: iconDetails.bg }]}>
               <Ionicons 
                 name={iconDetails.name as any} 
                 size={24} 
                 color={iconDetails.color} 
               />
             </View>
          </View>
          <View style={styles.eventTextCol}>
            <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.goingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="person" size={12} color="#888" />
                <Text style={styles.goingText2}>Requested by {item.user_name || 'Anonymous'}</Text>
              </View>
              <Text style={styles.timeAgoText}>{getTimeAgo(item.created_at)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.eventActionRow}>
          {item.user_id === user?.id ? (
            <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#FF3B30' }]} onPress={() => handleDeleteRequest(item.id)}>
              <Text style={styles.helpBtnText}>Delete Request</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.helpBtn} onPress={() => handleOfferHelp(item)}>
              <Text style={styles.helpBtnText}>Offer Help</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity>
            <Ionicons name="share-social-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleDeleteRequest = (requestId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to permanently delete this request?');
      if (confirmed) {
        (async () => {
          try {
            await deleteCommunityRequest(requestId);
            window.alert('Request deleted successfully!');
            fetchCommunity(); // Reload requests list!
          } catch (error: any) {
            const { parseApiError } = require('../../src/services/api');
            window.alert(parseApiError(error));
          }
        })();
      }
      return;
    }

    Alert.alert(
      'Delete Request',
      'Are you sure you want to permanently delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityRequest(requestId);
              Alert.alert('Success', 'Request deleted successfully!');
              fetchCommunity(); // Reload requests list!
            } catch (error: any) {
              const { parseApiError } = require('../../src/services/api');
              Alert.alert('Error', parseApiError(error));
            }
          }
        }
      ]
    );
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
      const messageText = `Hare Krishna! I saw your request '${item.title}' in the Mumbai Group and would like to offer my support/help.`;
      const confirmed = window.confirm(`Would you like to offer help to ${item.user_name || 'devotee'} by starting a chat?\n\nMessage: "${messageText}"`);
      if (confirmed) {
        try {
          const response = await sendDirectMessage(targetSlId, messageText);
          const conversationId = response.data?.chat_id || response.data?.conversation_id;
          if (conversationId) {
            router.push(`/dm/${conversationId}`);
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
        text: 'Send Message (Chat)',
        onPress: () => {
          Alert.alert(
            'Offer Help',
            `Send a message to ${item.user_name || 'devotee'}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send',
                onPress: async () => {
                  try {
                    const messageText = `Hare Krishna! I saw your request '${item.title}' in the Mumbai Group and would like to offer my support/help.`;
                    const response = await sendDirectMessage(targetSlId, messageText);
                    const conversationId = response.data?.chat_id || response.data?.conversation_id;
                    if (conversationId) {
                      router.push(`/dm/${conversationId}`);
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
      const appLink = `sanatanlok://community/${id}`;
      const webLink = `https://brahmand.app/community/${id}`;
      await Share.share({
        message: `Join the ${community?.name || 'Mumbai Community'} on Brahmand!\n\nApp Link: ${appLink}\nWeb View: ${webLink}`,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleLike = (postId: string) => {
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

    // Also check in communityPosts
    setCommunityPosts(prev => prev.map(post => {
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

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('Are you sure you want to delete this post from the community?');
      if (confirmDelete) {
        setDiscussionPosts(prev => prev.filter(post => post.id !== postId));
        setCommunityPosts(prev => prev.filter(post => post.id !== postId));
        
        try {
          const { deletePost } = require('../../src/services/api');
          deletePost(postId).catch((e: any) => console.log('API delete err:', e));
        } catch (error) {
          console.log('[Community] Post delete API error:', error);
        }
        
        alert('Post has been deleted successfully!');
      }
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post from the community?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDiscussionPosts(prev => prev.filter(post => post.id !== postId));
            setCommunityPosts(prev => prev.filter(post => post.id !== postId));
            
            try {
              const { deletePost } = require('../../src/services/api');
              await deletePost(postId);
            } catch (error) {
              console.log('[Community] Post delete API error (safe to ignore for local/mock posts):', error);
            }
            
            Alert.alert('Success', 'Post has been deleted successfully!');
          }
        }
      ]
    );
  };

  const handleCreatePost = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    // Use activeTab as default category (but 'Feed' maps to 'Seva')
    const finalCategory = postCategory || (activeTab === 'Feed' ? 'Seva' : activeTab);

    const newPost = {
      id: `post-${Date.now()}`,
      category: finalCategory,
      user: {
        name: user?.name || 'User',
        photo: user?.photo,
        isVerified: user?.personality_verification_status === 'approved',
        verificationLabel: (user as any)?.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
      },
      content: newMessage,
      image: selectedImage || undefined,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      reposts: 0,
      liked: false,
      hideBadge: true,
      contact: contactNumber || undefined,
      isUniversal: true, // Flag to show in general Feed
      sender_id: user?.id, // Track ownership of local posts
    };

    setCommunityPosts(prev => [newPost, ...prev]);

    // Save category so it survives refetch even if API doesn't return it
    if (newMessage.trim()) {
      saveLocalPost(newMessage.trim(), finalCategory);
    }

    // Attempt real API send if text or image is present
    (async () => {
      let uploadedUrl: string | undefined = undefined;
      const localImageToUpload = selectedImage;
      
      if (localImageToUpload) {
        try {
          const { uploadChatMedia } = require('../../src/services/api');
          const uploadRes = await uploadChatMedia({
            uri: localImageToUpload,
            name: `community_post_${Date.now()}.jpg`,
            type: 'image/jpeg'
          });
          uploadedUrl = uploadRes?.data?.media_url || uploadRes?.data?.mediaUrl || uploadRes?.data?.url || uploadRes?.url || uploadRes?.mediaUrl;
          console.log('[Community] Image uploaded successfully:', uploadedUrl);
        } catch (error) {
          console.error('[Community] Image upload failed:', error);
        }
      }

      if (newMessage.trim() || uploadedUrl) {
        try {
          const { sendCommunityMessage } = require('../../src/services/api');
          await sendCommunityMessage(id as string, 'city', newMessage, 'text', finalCategory, uploadedUrl);
          console.log('[Community] Real message sent with media:', uploadedUrl);
        } catch (error) {
          console.error('Failed to send real message:', error);
        }
      }
    })();

    setNewMessage('');
    setSelectedImage(null);
    setContactNumber('');
    setShowCreateModal(false);
    
    // No longer switching tabs automatically to keep the user in their current context
    // The post will appear immediately in the Feed and its specific category
    Alert.alert('Success', 'Your post has been shared with the community!');
  };

  const handleShare = async (postId: string) => {
    try {
      const appLink = `sanatanlok://community/${id}?postId=${postId}`;
      const webLink = `https://brahmand.app/community/${id}?postId=${postId}`;
      
      await Share.share({
        message: `Check out this community post on Brahmand!\n\nApp Link: ${appLink}\nWeb View: ${webLink}`,
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

  const handleAddComment = () => {
    if (!commentText.trim() || !showCommentModal) return;
    
    const newComment = {
      id: `comment-${Date.now()}`,
      userName: user?.name || 'You',
      text: commentText,
      avatar: user?.photo
    };

    setActiveComments(prev => [...prev, newComment]);

    setDiscussionPosts(prev => prev.map(post => {
      if (post.id === showCommentModal.id) {
        return { ...post, comments: (post.comments || 0) + 1 };
      }
      return post;
    }));
    
    setCommentText('');
    // Alert removed for smoother experience, comment appears immediately
  };



  if (loading) {
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
      {/* Sticky Top Bar */}
      <View style={[styles.stickyTopBar, { paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/messages')}
          style={styles.backButtonContainer}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
          {community && (
            <View style={styles.headerCommunityInfo}>
              <View style={styles.headerCommunityIconBg}>
                <Ionicons name="people" size={18} color="#FFF" />
              </View>
              <Text style={styles.headerCommunityName} numberOfLines={1}>
                {community.name}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.createPill} onPress={() => { setPostCategory(''); setShowCreateModal(true); }}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.createPillText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={combinedData}
        keyExtractor={(item, index) => {
          if (item.id) return String(item.id);
          return `${item.type || 'item'}-${index}`;
        }}
        renderItem={({ item }) => {
          if (item.type === 'festivals_header') {
            return (
              <View style={[styles.sectionHeader, { marginBottom: 10 }]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="calendar" size={24} color="#A855F7" style={{ marginRight: 10 }} />
                  <Text style={[styles.sectionTitle, { fontSize: 22 }]}>Festivals</Text>
                </View>
                <TouchableOpacity style={styles.filterDropdown}>
                  <Text style={styles.filterText}>All Festivals</Text>
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
                <TouchableOpacity style={styles.filterDropdown}>
                  <Text style={styles.filterText}>Latest First</Text>
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
                  <Ionicons name="sparkles-outline" size={28} color="#FF3B30" />
                  <View style={{ marginLeft: 12 }}>
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
            {renderHeader()}
            
            {(activeTab === 'Feed' || activeTab === 'Requests') && mostRecentRequest && (
              <View style={styles.recentRequestCard}>
                <LinearGradient 
                  colors={['#FFF5EE', '#FFFDFB']} 
                  style={styles.recentRequestGradient}
                >
                  <View style={styles.recentRequestHeader}>
                    <View style={styles.recentRequestTitleRow}>
                      <MaterialCommunityIcons name="bullhorn" size={20} color="#F25C05" />
                      <Text style={styles.recentRequestSectionTitle}>LATEST COMMUNITY REQUEST</Text>
                    </View>
                    <View style={[
                      styles.recentRequestUrgencyBadge, 
                      { backgroundColor: mostRecentRequest.urgency_level === 'critical' ? '#FEE2E2' : '#FEF3C7' }
                    ]}>
                      <Text style={[
                        styles.recentRequestUrgencyText,
                        { color: mostRecentRequest.urgency_level === 'critical' ? '#EF4444' : '#D97706' }
                      ]}>
                        {mostRecentRequest.urgency_level.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.recentRequestTitle} numberOfLines={1}>
                    {mostRecentRequest.title}
                  </Text>
                  <Text style={styles.recentRequestDesc} numberOfLines={2}>
                    {mostRecentRequest.description}
                  </Text>

                  <View style={styles.recentRequestFooter}>
                    <View style={styles.recentRequestLocRow}>
                      <Ionicons name="location" size={14} color="#64748B" />
                      <Text style={styles.recentRequestLocText} numberOfLines={1}>
                        {mostRecentRequest.location || 'Mumbai'}
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.recentRequestViewBtn}
                      onPress={() => router.push('/community-request/list')}
                    >
                      <Text style={styles.recentRequestViewBtnText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}

            {activeTab === 'Feed' && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Community Discussion</Text>
                  </View>
                  <View style={styles.verifiedMessagesBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#FF3B30" />
                    <Text style={styles.verifiedMessagesText}>Featured Verified Messages</Text>
                    <TouchableOpacity><Text style={styles.viewAllInline}>View All</Text></TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.mainContent}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <Avatar name={user?.name || '?'} photo={user?.photo} size={32} />
          <MentionInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Share your thoughts with your community..."
            placeholderTextColor="#888"
            inputStyle={styles.input}
          />
          <TouchableOpacity style={styles.footerIcon} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={handleCreatePost}>
            <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Screen Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent={false}>
        <View style={[styles.createModalRoot, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 40) : 0 }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.createModalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.createModalTitle}>Create Post</Text>
              <TouchableOpacity onPress={handleCreatePost}>
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createModalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.createPostUserInfo}>
                <Avatar name={user?.name || '?'} photo={user?.photo} size={50} />
                <View style={styles.createPostUserMeta}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                     <Text style={styles.createPostUserName}>{user?.name || 'Rahul Joshi'}</Text>
                     <MaterialCommunityIcons name="check-circle" size={16} color="#FF6B00" />
                  </View>
                  <Text style={styles.createPostUserLoc}>Andheri West, Mumbai</Text>
                </View>
              </View>

              <MentionInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Share your thoughts..."
                placeholderTextColor="#888"
                multiline
                inputStyle={styles.createPostInput}
                autoFocus
              />
              <Text style={styles.charCount}>{newMessage.length}/600</Text>

              <View style={styles.createDivider} />

              <View style={styles.createSection}>
                <Text style={styles.createSectionTitle}>Category <Text style={{color: '#FF3B30'}}>(Required)</Text></Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {COMMUNITY_TABS.filter(cat => cat !== 'Feed').map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.categoryChip, postCategory === cat && styles.categoryChipActive]}
                      onPress={() => setPostCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, postCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.categoryPicker}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.catIconCircle}>
                      <Ionicons name="heart-outline" size={20} color="#A855F7" />
                    </View>
                    <Text style={styles.catText}>{postCategory || activeTab}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#FF3B30" />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.infoBoxText}>Your post will be visible in the selected category and in the general community discussion.</Text>
              </View>

              <View style={styles.createSection}>
                <Text style={styles.createSectionTitle}>Contact Number <Text style={{color: '#888'}}>(Optional)</Text></Text>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity style={styles.phonePrefix}>
                     <Image source={{ uri: 'https://flagcdn.com/w40/in.png' }} style={styles.flagIcon} />
                     <Text style={styles.prefixText}>+91</Text>
                     <Ionicons name="chevron-down" size={14} color="#888" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number (optional)"
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.phoneSub}>Providing your number is optional. Others can contact you if you choose to share it.</Text>
              </View>

              <View style={styles.mediaActions}>
                <TouchableOpacity style={styles.mediaActionBtn} onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={24} color="#000" />
                  <Text style={styles.mediaActionLabel}>Add Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.trustBox}>
                 <View style={styles.trustIconBg}>
                   <Ionicons name="shield-checkmark" size={24} color="#FF6B00" />
                 </View>
                 <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.trustTitle}>Stay safe. Be trustworthy.</Text>
                   <Text style={styles.trustSub}>We encourage respectful and helpful posts that uplift our community.</Text>
                 </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={!!showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
          style={styles.modalOverlay}
        >
          <View style={[styles.commentModalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentModal(null)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.commentsList} keyboardShouldPersistTaps="handled">
              {activeComments.length > 0 ? (
                activeComments.map(comment => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Avatar name={comment.userName} photo={comment.avatar} size={32} />
                    <View style={styles.commentTextBubble}>
                      <Text style={styles.commentUserName}>{comment.userName}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                  <Ionicons name="chatbubble-outline" size={48} color="#CCC" />
                  <Text style={{ color: '#888', marginTop: 12, fontSize: 14 }}>No comments yet. Be the first to comment!</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <Avatar name={user?.name || '?'} photo={user?.photo} size={32} />
              <MentionInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#888"
                inputStyle={styles.commentInput}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                <Text style={[styles.postCommentBtn, !commentText.trim() && { opacity: 0.5 }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
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
  
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabsContent: { paddingHorizontal: 20, paddingVertical: 15, gap: 25 },
  tabItem: { paddingBottom: 5 },
  tabItemActive: { borderBottomWidth: 3, borderBottomColor: '#FF3B30' },
  goingText: { marginLeft: 6, fontSize: 13, color: '#888', fontFamily: FONTS.regular },
  timeAgoText: { fontSize: 11, color: '#AAA', fontFamily: FONTS.regular },
  tabText: { fontSize: 15, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#FF3B30', fontWeight: '700' },

  mainContent: { paddingBottom: 120 },
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
  requestIconCol: { marginRight: 15 },
  requestIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  helpBtn: { backgroundColor: '#F25C05', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  helpBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
  postRightCol: { flex: 1 },
  postHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postNameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  feedPostUserName: { fontSize: 15, fontWeight: '700', color: '#0F1419', maxWidth: '40%' },
  postHandle: { fontSize: 15, color: '#536471', marginLeft: 4, flexShrink: 1 },
  postDot: { fontSize: 15, color: '#536471', marginHorizontal: 4 },
  postContentText: { fontSize: 15, color: '#0F1419', lineHeight: 22, marginTop: 2 },
  postMediaImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#EFF3F4' },
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

  festEventCard: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 24, padding: 12, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#F5F5F5' },
  festEventMain: { flexDirection: 'row' },
  festEventImage: { width: 100, height: 120, borderRadius: 16 },
  festEventInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  festEventTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 4 },
  festEventDesc: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 10 },
  festEventMeta: { gap: 6 },
  festMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  festMetaText: { fontSize: 11, color: '#444', fontWeight: '600' },
  festOrganizerCol: { width: 100, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F0F0F0', paddingLeft: 8 },
  festOrgDetails: { alignItems: 'center', marginTop: 8, marginBottom: 12 },
  festOrgNameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  festOrgName: { fontSize: 11, fontWeight: '700', color: '#111' },
  festOrgLabel: { fontSize: 10, color: '#888' },
  festTimeAgo: { fontSize: 9, color: '#AAA', marginTop: 2 },
  attendBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 10, width: '100%' },
  attendBtnText: { color: '#FF3B30', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  festActionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
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
});
