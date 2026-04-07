import React, { useEffect, useState, useRef } from 'react';
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
  Share
} from 'react-native';

interface MantraSession {
  id: string;
  name: string;
  mantra: string;
  participants: number;
  duration: string;
  isLive: boolean;
}

const MANTRA_SESSIONS: MantraSession[] = [
  { id: '1', name: 'Radha Krishna 108x', mantra: 'Om Kleem Krishnaya Namah', participants: 14, duration: '45 min', isLive: true },
  { id: '2', name: 'Gayatri Mantra', mantra: 'Om Bhur Bhuva Swaha', participants: 9, duration: '30 min', isLive: true },
  { id: '3', name: 'Mahamrityunjaya Jaap', mantra: 'Om Tryambakam Yajamahe', participants: 5, duration: '20 min', isLive: true },
  { id: '4', name: 'Om Namah Shivaya', mantra: 'Om Namah Shivaya', participants: 12, duration: '15 min', isLive: false },
  { id: '5', name: 'Hanuman Chalisa', mantra: 'Shri Guru Charan Saroj Raj', participants: 8, duration: '25 min', isLive: false },
];
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import { getCommunity, getCommunityMessages, sendCommunityMessage, getCommunityRequests, resolveCommunityRequest } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';

const TABS = ['Blood', 'Medical', 'Petition', 'Search'];
const MAIN_TABS = ['Live Mantra'];

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_photo?: string;
  created_at: string;
  message_type?: string;
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
  hospital_name?: string;
  location?: string;
  amount?: number;
  support_needed?: string;
}

interface Community {
  id: string;
  name: string;
  member_count: number;
  code: string;
}

export default function CommunityDetailScreen() {
  const { id, communityId } = useLocalSearchParams<{ id: string; communityId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const resolvedCommunityId = communityId || id;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState('Chat');
  const [activeMainTab, setActiveMainTab] = useState('Live Mantra');
  const [isMantraPlaying, setIsMantraPlaying] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [cachedRequests, setCachedRequests] = useState<Record<string, CommunityRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleBackPress = useCallback(() => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/messages');
  }, [router]);

  useEffect(() => {
    fetchCommunity();
  }, [resolvedCommunityId]);

  useEffect(() => {
    if (community) {
      fetchData();
    }
  }, [activeTab, community]);

  const fetchCommunity = async () => {
    if (!resolvedCommunityId) {
      setLoading(false);
      return;
    }
    try {
      const response = await getCommunity(resolvedCommunityId);
      setCommunity(response.data);
    } catch (error: any) {
      console.error('Error fetching community:', error);
      const message =
        error?.response?.data?.detail ||
        error?.userFriendlyMessage ||
        error?.message ||
        'Unable to load community data. Please check your network or server status.';
      Alert.alert('Network Error', message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!resolvedCommunityId) return;
    try {
      if (activeTab === 'Live Mantra Jaap') {
        // Live mantra mode does not require API calls here
        setMessages([]);
        setRequests([]);
        return;
      }

      if (activeTab === 'Chat') {
        // Fetch chat messages
        const response = await getCommunityMessages(resolvedCommunityId, 'chat');
        setMessages(response.data || []);
        setRequests([]);
      } else if (activeTab === 'General') {
        // General tab - fetch requests created from outside general feed (help/financial/other)
        const response = await getCommunityRequests({
          community_id: resolvedCommunityId,
          limit: 50
        });

        const allRequests = response.data || [];
        const generalRequests = allRequests.filter((req: any) =>
          ['help', 'financial', 'other'].includes(req.request_type)
        );

        setRequests(generalRequests);
        setCachedRequests(prev => ({ ...prev, General: generalRequests }));
        setMessages([]);
      } else {
        // Fetch community requests for this tab type (Blood/Medical/Petition)
        const requestTypeMap: Record<string, string> = {
          'Blood': 'blood',
          'Medical': 'medical',
          'Petition': 'petition'
        };
        const targetType = requestTypeMap[activeTab];
        const response = await getCommunityRequests({
          type: targetType,
          community_id: resolvedCommunityId,
          limit: 50
        });
        // Frontend filter as backup in case API doesn't filter properly
        const filteredRequests = (response.data || []).filter((req: any) => 
          req.request_type === targetType
        );
        setRequests(filteredRequests);
        setCachedRequests(prev => ({ ...prev, [activeTab]: filteredRequests }));
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      const message =
        error?.response?.data?.detail ||
        error?.userFriendlyMessage ||
        error?.message ||
        'Unable to load community data. Please check your network or server status.';
      Alert.alert('Network Error', message);
      setMessages([]);
      setRequests([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setMessages([]);
    setRequests(cachedRequests[tab] || []);
    setRefreshing(true);
    // No request creation inside community group tabs; list only.
    // This tab switch is read-only in non-chat modes.
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !resolvedCommunityId) return;
    
    setSending(true);
    try {
      await sendCommunityMessage(resolvedCommunityId, 'chat', newMessage.trim());
      setNewMessage('');
      fetchData();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleShareCommunityInvite = async () => {
    if (!community?.id) return;

    const groupUnique = (community.code || community.name || community.id)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || community.id;

    const query = [
      `communityId=${encodeURIComponent(community.id)}`,
      `name=${encodeURIComponent(community.name)}`,
      community.code ? `code=${encodeURIComponent(community.code)}` : '',
    ].filter(Boolean).join('&');

    const webBaseUrl =
      process.env.EXPO_PUBLIC_APP_SHARE_URL ||
      process.env.EXPO_PUBLIC_SHARE_BASE_URL ||
      'https://brahmand-frontend-hi4rz6fdrq-uc.a.run.app';
    const webLink = `${webBaseUrl.replace(/\/$/, '')}/community/${groupUnique}${query ? `?${query}` : ''}`;
    const appLink = ExpoLinking.createURL(`/community/${community.id}`);

    try {
      await Share.share({
        title: 'Join my community on Brahmand',
        message: `Join "${community.name}" on Brahmand.\n${webLink}\n\nApp link: ${appLink}`,
        url: webLink,
      });
    } catch {
      Alert.alert('Error', 'Unable to open share options right now. Please try again.');
    }
  };

  const handleResolveRequest = async (requestId: string) => {
    console.log('=== handleResolveRequest called ===');
    console.log('Request ID:', requestId);
    console.log('API call about to be made...');
    
    Alert.alert(
      'Mark as Fulfilled',
      'Are you sure you want to mark this request as fulfilled?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            console.log('=== Confirm pressed, calling API ===');
            try {
              console.log('Calling resolveCommunityRequest with ID:', requestId);
              const response = await resolveCommunityRequest(requestId);
              console.log('=== API Response ===', response);
              Alert.alert('Success', 'Request marked as fulfilled!');
              // Refresh the request list
              console.log('=== Refreshing data ===');
              fetchData();
            } catch (error: any) {
              console.error('=== Error resolving request ===', error);
              console.error('Error response:', error.response?.data);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to resolve request');
            }
          }
        }
      ]
    );
  };

  // Request submission disabled inside community group detail view.
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return COLORS.error;
      case 'high': return '#E67E22';
      case 'medium': return COLORS.warning;
      default: return COLORS.success;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Avatar name={item.sender_name} photo={item.sender_photo} size={32} />
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage && styles.ownMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage && styles.ownMessageTime
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderRequest = ({ item }: { item: CommunityRequest }) => {
    const isOwn = item.user_id === user?.id;
    const isFulfilled = item.status === 'fulfilled';
    console.log('=== renderRequest ===');
    console.log('item.user_id:', item.user_id);
    console.log('user?.id:', user?.id);
    console.log('isOwn:', isOwn);
    console.log('item.status:', item.status);
    
    return (
      <View style={[styles.requestCard, isFulfilled && styles.requestCardFulfilled]}>
        <View style={styles.requestHeader}>
          <View style={styles.requestTypeContainer}>
            <View style={[
              styles.urgencyBadge,
              { backgroundColor: `${getUrgencyColor(item.urgency_level)}20` }
            ]}>
              <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(item.urgency_level) }]} />
              <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency_level) }]}>
                {item.urgency_level.toUpperCase()}
              </Text>
            </View>
            {item.request_type === 'blood' && item.blood_group && (
              <View style={styles.bloodBadge}>
                <Ionicons name="water" size={14} color="#E74C3C" />
                <Text style={styles.bloodText}>{item.blood_group}</Text>
              </View>
            )}
            {isFulfilled && (
              <View style={styles.fulfilledBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.fulfilledText}>Fulfilled</Text>
              </View>
            )}
          </View>
          <Text style={styles.requestDate}>{formatDate(item.created_at)}</Text>
        </View>
        
        <Text style={styles.requestTitle}>{item.title}</Text>
        <Text style={styles.requestDescription} numberOfLines={3}>{item.description}</Text>
        
        {item.hospital_name && (
          <View style={styles.requestDetail}>
            <Ionicons name="medical" size={14} color={COLORS.textSecondary} />
            <Text style={styles.requestDetailText}>{item.hospital_name}</Text>
          </View>
        )}
        
        {item.location && (
          <View style={styles.requestDetail}>
            <Ionicons name="location" size={14} color={COLORS.textSecondary} />
            <Text style={styles.requestDetailText}>{item.location}</Text>
          </View>
        )}
        
        {item.amount && (
          <View style={styles.requestDetail}>
            <Ionicons name="cash" size={14} color={COLORS.textSecondary} />
            <Text style={styles.requestDetailText}>Rs {item.amount.toLocaleString()}</Text>
          </View>
        )}
        
        <View style={styles.requestFooter}>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call" size={16} color={COLORS.primary} />
            <Text style={styles.contactButtonText}>{item.contact_number}</Text>
          </TouchableOpacity>
          
          {item.status === 'active' && (
            <TouchableOpacity 
              style={styles.fulfillButton}
              onPress={() => {
                console.log('=== Button pressed for request:', item.id);
                handleResolveRequest(item.id);
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.fulfillButtonText}>Mark Fulfilled</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Community not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.memberCount}>{community.member_count} members</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.codeLabel}>Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{community.code}</Text>
            <TouchableOpacity style={styles.codeShareButton} onPress={handleShareCommunityInvite}>
              <Ionicons name="share-social-outline" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Top tab group (Community / Private Chat) */}
      <View style={styles.topTabsContainer}>
        <TouchableOpacity
          style={[styles.topTab, activeTab !== 'Live Mantra Jaap' && styles.topTabActive]}
          onPress={() => { setActiveMainTab('Live Mantra'); setActiveTab('Chat'); }}
        >
          <Text style={[styles.topTabText, activeTab !== 'Live Mantra Jaap' && styles.topTabTextActive]}>Community</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTab, activeTab === 'Live Mantra Jaap' && styles.topTabActive]}
          onPress={() => setActiveTab('Private Chat')}
        >
          <Text style={[styles.topTabText, activeTab === 'Private Chat' && styles.topTabTextActive]}>Private Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topTabPlus}
          onPress={() => Alert.alert('Create', 'Implement create new group or chat here')}
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Live Mantra section embed (in community) */}
      <TouchableOpacity 
        style={[styles.liveMantraSection, isMantraPlaying && styles.liveMantraSectionActive]}
        onPress={() => router.push(`/community/${id}/mantra`)}
      >
        <View style={styles.liveMantraSectionContent}>
          <View style={styles.liveMantraIconContainer}>
            <Ionicons 
              name={isMantraPlaying ? 'musical-note' : 'musical-notes'} 
              size={24} 
              color={isMantraPlaying ? '#FFFFFF' : COLORS.primary} 
            />
          </View>
          <View style={styles.liveMantraTextContainer}>
            <Text style={[styles.communitySectionTitle, isMantraPlaying && styles.communitySectionTitleActive]}>
              {isMantraPlaying ? '🎵 Now Playing' : '🕉️ Live Mantra Jaap'}
            </Text>
            <Text style={[styles.liveMantraCardTitle, isMantraPlaying && styles.liveMantraCardTitleActive]}>
              {isMantraPlaying ? 'Tap to control playback' : 'Join live chanting sessions'}
            </Text>
          </View>
          <Ionicons 
            name={isMantraPlaying ? 'pause-circle' : 'play-circle'} 
            size={32} 
            color={isMantraPlaying ? '#FFFFFF' : COLORS.primary} 
          />
        </View>
      </TouchableOpacity>

      {/* Home area cards (Andheri, Mumbai, Maharashtra, Bharat) */}
      <View style={styles.communityLevelContainer}>
        <Text style={styles.communitySectionTitle}>Home Area</Text>
        <TouchableOpacity style={styles.communityCard} onPress={() => { /* navigate to Andheri group */ }}>
          <Ionicons name="people" size={24} color={COLORS.primary} />
          <View style={styles.communityCardTextWrap}>
            <Text style={styles.communityCardTitle}>Andheri Group</Text>
            <Text style={styles.communityCardSub}>9 members</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={styles.communitySectionTitle}>City Community</Text>
        <TouchableOpacity style={styles.communityCard} onPress={() => { /* navigate to Mumbai */ }}>
          <Ionicons name="location" size={24} color="#8E44AD" />
          <View style={styles.communityCardTextWrap}>
            <Text style={styles.communityCardTitle}>Mumbai Group</Text>
            <Text style={styles.communityCardSub}>9 members</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={styles.communitySectionTitle}>State Community</Text>
        <TouchableOpacity style={styles.communityCard} onPress={() => { /* navigate to Maharashtra */ }}>
          <Ionicons name="map" size={24} color="#F39C12" />
          <View style={styles.communityCardTextWrap}>
            <Text style={styles.communityCardTitle}>Maharashtra Group</Text>
            <Text style={styles.communityCardSub}>10 members</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={styles.communitySectionTitle}>National Community</Text>
        <TouchableOpacity style={styles.communityCard} onPress={() => { /* navigate to Bharat */ }}>
          <Ionicons name="flag" size={24} color="#E74C3C" />
          <View style={styles.communityCardTextWrap}>
            <Text style={styles.communityCardTitle}>Bharat Group</Text>
            <Text style={styles.communityCardSub}>10 members</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Home area (static) */}
      <View style={styles.homeArea}>
        <Text style={styles.homeAreaTitle}>Community Home</Text>
        <Text style={styles.homeAreaSubtitle}>Connect with members and access key community controls</Text>
      </View>

      {/* Live Mantra Header */}
      <TouchableOpacity 
        style={[styles.liveMantraHeader, isMantraPlaying && styles.liveMantraHeaderActive]}
        onPress={() => { setActiveMainTab('Live Mantra'); setActiveTab('Live Mantra Jaap'); }}
      >
        <View style={styles.liveMantraHeaderLeft}>
          {isMantraPlaying ? (
            <Ionicons name="musical-note" size={20} color="#FFFFFF" />
          ) : (
            <View style={[styles.liveDotAnimated, isMantraPlaying && styles.liveDotPlaying]} />
          )}
          <Text style={[styles.liveMantraHeaderTitle, isMantraPlaying && styles.liveMantraHeaderTitleActive]}>
            {isMantraPlaying ? 'Now Playing' : 'Live Mantra Jaap'}
          </Text>
        </View>
        <View style={styles.liveMantraHeaderRight}>
          <Text style={[styles.liveMantraHeaderSubtitle, isMantraPlaying && styles.liveMantraHeaderSubtitleActive]}>
            {isMantraPlaying ? 'Tap to control' : 'Tap to join'}
          </Text>
          <Ionicons name={isMantraPlaying ? 'pause-circle' : 'chevron-forward'} size={20} color={isMantraPlaying ? '#FFFFFF' : COLORS.primary} />
        </View>
      </TouchableOpacity>


      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {activeTab === 'Chat' ? (
          // Quick Actions + Chat Messages
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatMessagesList}
            inverted={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
              </View>
            }
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListHeaderComponent={
              <View style={styles.quickActionsContainer}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: '#FF6B00' }]}
                    onPress={() => setActiveTab('Blood')}
                  >
                    <Ionicons name="water" size={24} color="#FFFFFF" />
                    <Text style={styles.quickActionCardText}>Blood Request</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: '#E74C3C' }]}
                    onPress={() => setActiveTab('Medical')}
                  >
                    <Ionicons name="medical" size={24} color="#FFFFFF" />
                    <Text style={styles.quickActionCardText}>Medical Help</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: '#9B59B6' }]}
                    onPress={() => { setActiveMainTab('Live Mantra'); }}
                  >
                    <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
                    <Text style={styles.quickActionCardText}>Mantra Jaap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: '#3498DB' }]}
                    onPress={() => setActiveTab('Petition')}
                  >
                    <Ionicons name="document-text" size={24} color="#FFFFFF" />
                    <Text style={styles.quickActionCardText}>Petition</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        ) : (
          // Request list for General/Blood/Medical/Petition tabs
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.requestsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
            }
            ListEmptyComponent={
              refreshing ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>No {activeTab.toLowerCase()} requests yet</Text>
                </View>
              )
            }
          />
        )}

        {/* Live Mantra CTA Bar (below chat messages and above input) */}
        {activeTab === 'Chat' && (
          <View style={styles.liveMantraBottomBar}>
            <View>
              <Text style={styles.liveMantraBottomTitle}>Live Mantra Jaap</Text>
              <Text style={styles.liveMantraBottomSubtitle}>Join the ongoing spiritual chant session</Text>
            </View>
            <TouchableOpacity
              style={styles.liveMantraBottomButton}
              onPress={() => setActiveTab('Live Mantra Jaap')}
            >
              <Ionicons name="musical-notes" size={18} color="#fff" />
              <Text style={styles.liveMantraBottomButtonText}>Go Live</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area - Only show for Chat tab */}
        {activeTab === 'Chat' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textLight}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeShareButton: {
    marginLeft: SPACING.xs,
    padding: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.sm,
  },
  tabsScroll: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  addButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  liveMantraSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  liveMantraSectionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  liveMantraSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMantraIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  liveMantraTextContainer: {
    flex: 1,
  },
  liveMantraCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  communitySectionTitleActive: {
    color: '#FFFFFF',
  },
  liveMantraCardTitleActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  liveMantraCardTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  liveMantraCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C3E50',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  liveMantraCardButtonText: {
    color: '#FFFFFF',
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  chatMessagesList: {
    paddingBottom: SPACING.md,
    flexGrow: 1,
  },
  quickActionsContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionCardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  requestsList: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  generalContainer: {
    padding: SPACING.md,
  },
  generalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  generalBarText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  generalOptions: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  generalOptionItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  generalOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.xs,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  createRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginTop: SPACING.lg,
  },
  createRequestBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  topTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  topTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.xs,
  },
  topTabActive: {
    backgroundColor: COLORS.primary,
  },
  topTabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  topTabTextActive: {
    color: '#FFFFFF',
  },
  topTabPlus: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginLeft: SPACING.xs,
  },
  communityLevelContainer: {
    backgroundColor: '#FEF6EB',
    padding: SPACING.md,
  },
  communitySectionTitle: {
    marginTop: SPACING.md,
    color: '#8E44AD',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  communityCardTextWrap: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  communityCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  communityCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  liveMantraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  liveMantraBottomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  liveMantraBottomSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  liveMantraBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  liveMantraBottomButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    fontSize: 15,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  // Request card styles
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  requestCardFulfilled: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bloodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E74C3C',
    marginLeft: 4,
  },
  requestDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  contactButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  activeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mainTabActive: {
    backgroundColor: '#FFFFFF',
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: SPACING.xs,
  },
  mainTabTextActive: {
    color: COLORS.primary,
  },
  liveIndicator: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: SPACING.xs,
  },
  liveIndicatorText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  liveMantraHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDotAnimated: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    marginRight: SPACING.sm,
  },
  liveDotPlaying: {
    backgroundColor: '#FFFFFF',
  },
  liveMantraHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  liveMantraHeaderTitleActive: {
    color: '#FFFFFF',
  },
  liveMantraHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMantraHeaderSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  liveMantraHeaderSubtitleActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  liveMantraHeaderActive: {
    backgroundColor: COLORS.primary,
  },
  quickActionContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  quickActionText: {
    color: '#FFF',
    fontWeight: '700',
  },
  liveMantraContainer: {
    flex: 1,
    backgroundColor: '#EAF5FF',
    padding: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  homeArea: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  homeAreaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  homeAreaSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  homeOptionbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  homeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  homeOptionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  homeOptionText: {
    marginLeft: SPACING.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  homeOptionTextActive: {
    color: '#FFFFFF',
  },
  liveMantraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  activeSessionsContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  activeSessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  joinSessionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  joinSessionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    color: COLORS.text,
    fontSize: 16,
  },
  mantraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
  },
  mantraButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: SPACING.sm,
  },
  hintText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  fulfillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  fulfillButtonText: {
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontSize: 12,
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  fulfilledText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 2,
  },
});
