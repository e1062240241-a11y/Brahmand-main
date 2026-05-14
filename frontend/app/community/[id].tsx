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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCommunity, getCommunityMessages, sendCommunityMessage } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  shares: number;
  reposts: number;
  liked?: boolean;
  isRepost?: boolean;
  repostedBy?: string;
  image?: string;
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
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
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postCategory, setPostCategory] = useState('Feed');
  const [contactNumber, setContactNumber] = useState('');
  
  const [showCommentModal, setShowCommentModal] = useState<DiscussionPost | null>(null);
  const [commentText, setCommentText] = useState('');

  const dynamicTabs = useMemo(() => {
    return COMMUNITY_TABS.filter(tab => {
      if (tab === 'Requests') return requests.length > 0;
      return true;
    });
  }, [requests]);

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const response = await getCommunity(id as string);
      setCommunity(response.data);
      
      const { getCommunityRequests, getEvents, getCommunityMessages, getFestivalList } = require('../../src/services/api');
      
      const [reqResponse, eventResponse, msgResponse, festResponse] = await Promise.all([
        getCommunityRequests({ community_id: id as string }),
        getEvents(),
        getCommunityMessages(id as string, 'city'), // Assuming 'city' level for local posts
        getFestivalList()
      ]);
      
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
        image: msg.media_url,
        timestamp: 'Just now',
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: true,
      }));
      
      setCommunityPosts(formattedMsgs);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || communityPosts.length < 10) return;
    setLoadingMore(true);
    try {
      const { getCommunityMessages } = require('../../src/services/api');
      const msgResponse = await getCommunityMessages(id as string, 'city', 20); // Simple infinite scroll
      // Append more messages...
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
      <ImageBackground 
        source={require('../../assets/images/community_banner_ultimate.png')} 
        style={styles.headerBg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
          style={styles.headerOverlay}
        >
          <View style={{ height: 60 + insets.top }} />

          <View style={styles.communityInfo}>
            <View style={styles.communityIconWrapper}>
              <View style={styles.communityIcon}>
                <Ionicons name="people" size={28} color="#FFF" />
              </View>
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.communityTitle}>{community?.name || 'Mumbai Community'}</Text>
              <Text style={styles.communityStats}>
                {community?.member_count?.toLocaleString() || '1.8K'} Members  •  Mumbai, Maharashtra
              </Text>
            </View>
          </View>

          <Text style={styles.tagline}>
            Connect with your local community. Share updates, find help, and stay updated with local events.
          </Text>
        </LinearGradient>
      </ImageBackground>

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
              <Text style={styles.postUserName} numberOfLines={1}>{item.user.name}</Text>
              {item.user.isVerified && !item.hideBadge && <MaterialCommunityIcons name="check-decagram" size={18} color="#FF3B30" style={{ marginLeft: 2 }} />}
              <Text style={styles.postHandle} numberOfLines={1}> @{item.user.name.replace(/\s+/g, '').toLowerCase()}</Text>
            </View>
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
            </TouchableOpacity>
          </View>

          <Text style={styles.postContentText}>{item.content}</Text>
          
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.postMediaImage} resizeMode="cover" />
          )}

          <View style={styles.postActionRow}>
            <TouchableOpacity 
              style={styles.postActionBtn}
              onPress={() => setShowCommentModal(item)}
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
              <Text style={styles.goingText}>{item.attendee_count || 0} Going</Text>
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

  const renderRequestItem = ({ item }: { item: any }) => (
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
           <View style={[styles.requestIconBg, { backgroundColor: item.request_type === 'blood' ? '#FFEBEB' : '#F0F7FF' }]}>
             <Ionicons 
               name={item.request_type === 'blood' ? 'water' : 'medical'} 
               size={24} 
               color={item.request_type === 'blood' ? '#FF3B30' : '#007AFF'} 
             />
           </View>
        </View>
        <View style={styles.eventTextCol}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.goingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="person" size={12} color="#888" />
              <Text style={styles.goingText}>Requested by {item.user_name || 'Anonymous'}</Text>
            </View>
            <Text style={styles.timeAgoText}>{getTimeAgo(item.created_at)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.eventActionRow}>
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpBtnText}>Offer Help</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="share-social-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );

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

  const handleNotifications = () => {
    router.push('/notifications');
  };

  const handleShareCommunity = async () => {
    try {
      await Share.share({
        message: `Join the ${community?.name || 'Mumbai Community'} on Brahmand!`,
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
    setDiscussionPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.liked;
        return {
          ...post,
          liked: !isLiked,
          likes: isLiked ? post.likes - 1 : post.likes + 1
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

  const handleCreatePost = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    const newPost = {
      id: `post-${Date.now()}`,
      category: postCategory,
      user: {
        name: user?.name || 'User',
        photo: user?.photo,
        isVerified: user?.personality_verification_status === 'approved',
        verificationLabel: user?.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
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
      isUniversal: true // Flag to show in general Feed
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    
    // Attempt real API send if text is present
    if (newMessage.trim()) {
      try {
        const { sendCommunityMessage } = require('../../src/services/api');
        await sendCommunityMessage(id as string, 'city', newMessage);
      } catch (error) {
        console.error('Failed to send real message:', error);
      }
    }

    setNewMessage('');
    setSelectedImage(null);
    setContactNumber('');
    setShowCreateModal(false);
  };

  const handleShare = async (postId: string) => {
    try {
      await Share.share({
        message: 'Check out this community post on Brahmand!',
      });
      setDiscussionPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, shares: post.shares + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !showCommentModal) return;
    
    setDiscussionPosts(prev => prev.map(post => {
      if (post.id === showCommentModal.id) {
        return { ...post, comments: post.comments + 1 };
      }
      return post;
    }));
    
    setCommentText('');
    Alert.alert('Success', 'Comment added successfully!');
  };

  const combinedData = useMemo(() => {
    if (activeTab === 'Requests') return requests;
    if (activeTab === 'Festivals') {
      return [
        { type: 'festivals_header' },
        { type: 'festivals_list' },
        { type: 'festival_events_header' },
        ...MOCK_FESTIVAL_EVENTS.map(e => ({ ...e, type: 'festival_event' })),
        { type: 'festival_banner' }
      ];
    }
    if (activeTab === 'Feed') {
      return [
        ...discussionPosts, 
        { type: 'header', title: 'Community Requests', icon: 'hand-left-outline' },
        ...requests.slice(0, 3).map(r => ({ ...r, type: 'request_item' })),
        { type: 'header', title: 'Community Posts', icon: 'chatbubbles-outline' },
        ...communityPosts // Show ALL posts in general Feed
      ];
    }
    // Handle other tabs
    const tabPosts = communityPosts.filter(p => p.category === activeTab);
    if (tabPosts.length > 0) {
      return [{ type: 'header', title: `${activeTab} Updates`, icon: 'newspaper-outline' }, ...tabPosts];
    }
    return [];
  }, [activeTab, requests, discussionPosts, communityPosts]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Top Bar */}
      <View style={[styles.stickyTopBar, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home');
            }
          }} 
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.createPill} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.createPillText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>2</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShareCommunity}>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={combinedData}
        keyExtractor={item => item.id || (item.type + (item.title || ''))}
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
                keyExtractor={f => f.id}
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
                  <Ionicons name="party-outline" size={28} color="#FF3B30" />
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
          if (item.type === 'request_item') {
            return renderRequestItem({ item });
          }
          return activeTab === 'Requests' ? renderRequestItem({ item }) : renderDiscussionItem({ item });
        }}
        onEndReached={activeTab === 'Feed' ? handleLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loadingMore ? <ActivityIndicator size="small" color="#FF3B30" style={{ padding: 20 }} /> : null}
        ListHeaderComponent={() => (
          <View>
            {renderHeader()}
            
            {activeTab === 'Feed' && (
              <>
                {events.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <Ionicons name="calendar-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Upcoming Events & Meetups</Text>
                      </View>
                      <TouchableOpacity>
                        <Text style={styles.viewAll}>View All <Ionicons name="chevron-forward" size={12} /></Text>
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={events}
                      keyExtractor={item => item.id}
                      renderItem={renderEventItem}
                      contentContainerStyle={styles.eventsList}
                    />
                  </>
                )}

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
            <TextInput
              style={styles.input}
              placeholder="Share your thoughts with your community..."
              value={newMessage}
              onChangeText={setNewMessage}
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.footerIcon} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={24} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Full Screen Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.createModalRoot}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

              <TextInput
                style={styles.createPostInput}
                placeholder="Share your thoughts..."
                multiline
                value={newMessage}
                onChangeText={setNewMessage}
                autoFocus
              />
              <Text style={styles.charCount}>{newMessage.length}/600</Text>

              <View style={styles.createDivider} />

              <View style={styles.createSection}>
                <Text style={styles.createSectionTitle}>Category <Text style={{color: '#FF3B30'}}>(Required)</Text></Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {COMMUNITY_TABS.map(cat => (
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
                    <Text style={styles.catText}>{postCategory}</Text>
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
        </SafeAreaView>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={!!showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              {/* Dummy comments for replica */}
              <View style={styles.commentItem}>
                <Avatar name="Rahul" size={32} />
                <View style={styles.commentTextBubble}>
                  <Text style={styles.commentUserName}>Rahul Sharma</Text>
                  <Text style={styles.commentText}>Jai Shri Ram! Looking forward to the bhajan sandhya.</Text>
                </View>
              </View>
              <View style={styles.commentItem}>
                <Avatar name="Neha" size={32} />
                <View style={styles.commentTextBubble}>
                  <Text style={styles.commentUserName}>Neha Gupta</Text>
                  <Text style={styles.commentText}>Great initiative for the food donation drive.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.commentInputRow}>
              <Avatar name={user?.name || '?'} photo={user?.photo} size={32} />
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                <Text style={[styles.postCommentBtn, !commentText.trim() && { opacity: 0.5 }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
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

  mainContent: { paddingBottom: 100 },
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
  goingText: { fontSize: 12, color: '#888' },
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
  postUserName: { fontSize: 16, fontWeight: '700', color: '#111' },
  postSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  postTimestamp: { fontSize: 12, color: '#888' },
  postLabel: { fontSize: 12, color: '#444', fontWeight: '600' },
  
  postBody: { marginTop: 15, paddingHorizontal: 8 },
  quoteIcon: { marginBottom: -10, opacity: 0.8 },
  postContent: { fontSize: 15, color: '#333', lineHeight: 24, fontWeight: '500' },
  
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionText: { fontSize: 13, color: '#666', fontWeight: '600' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
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
  
  requestInterestedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  urgencyLabel: { fontSize: 11, fontWeight: '700', color: '#888', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  requestIconCol: { marginRight: 15 },
  requestIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  helpBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
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
  postUserName: { fontSize: 15, fontWeight: '700', color: '#0F1419', maxWidth: '40%' },
  postHandle: { fontSize: 15, color: '#536471', marginLeft: 4, flexShrink: 1 },
  postDot: { fontSize: 15, color: '#536471', marginHorizontal: 4 },
  postTimestamp: { fontSize: 15, color: '#536471' },
  postContentText: { fontSize: 15, color: '#0F1419', lineHeight: 22, marginTop: 2 },
  postMediaImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: '#EFF3F4' },
  postActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingRight: 40 },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
