import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import { getCommunity, getCommunityMessages, sendCommunityMessage, getCommunityRequests, resolveCommunityRequest } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';

const TABS = ['Chat', 'General', 'Blood', 'Medical', 'Petition'];

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
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!resolvedCommunityId) return;
    try {
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
    } catch (error) {
      console.error('Error fetching data:', error);
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

      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Create request button disabled for all non-Chat tabs as per requirement */}
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {activeTab === 'Chat' ? (
          // Chat Messages
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
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
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.md,
    flexGrow: 1,
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
