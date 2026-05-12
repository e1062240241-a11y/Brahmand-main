import React, { useState, useEffect, useCallback } from 'react';
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
  LayoutAnimation,
  Modal,
  Platform,
  TextInput,
  UIManager,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { getCircles, getCommunities, createCommunityRequest, getCommunityRequests, getMyCommunityRequests, resolveCommunityRequest, getConversations, getCulturalCommunities, getUserCulturalCommunity, updateUserCulturalCommunity, parseApiError } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';

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
  } catch {}
};

// Top tabs for Chat section
const TOP_TABS = ['Community', 'Private Chat'];

interface Circle {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  member_count: number;
  member_names?: string[];
  last_message?: string;
  last_message_time?: string;
}

interface Community {
  id: string;
  name: string;
  type: string;
  label?: string;
  member_count: number;
  is_default?: boolean;
}

interface CommunityRequest {
  id: string;
  user_id: string;
  request_type: string;
  title: string;
  description: string;
  contact_number: string;
  urgency_level: string;
  status: string;
  created_at: string;
  blood_group?: string;
  hospital_name?: string;
  amount?: number;
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
  
  // Top tab state (Community vs Private Chat)
  const defaultTopTab = params.tab && params.tab.toLowerCase().includes('private') ? 'Private Chat' : 'Community';
  const [activeTopTab, setActiveTopTab] = useState(defaultTopTab);
  
  // Community sub-tab state
  const [activeCommunityTab, setActiveCommunityTab] = useState('Chat');
  
  // Data states
  const [communities, setCommunities] = useState<Community[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [userLokSangma, setUserLokSangma] = useState<{ cultural_community: string | null; change_count: number; is_locked: boolean } | null>(null);
  const [showLokSangmaModal, setShowLokSangmaModal] = useState(false);
  const [lokSangmaSearch, setLokSangmaSearch] = useState('');
  const [lokSangmaList, setLokSangmaList] = useState<string[]>([]);
  const [lokSangmaLoading, setLokSangmaLoading] = useState(false);

  const dedupeCommunities = (items: Community[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (item.type === 'cultural') {
        const key = item.name?.trim().toLowerCase() || item.id;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
      }
      return true;
    });
  };
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalExpanded, setGeneralExpanded] = useState(false);
  const [offeringsExpanded, setOfferingsExpanded] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  }, []);

  const fetchData = useCallback(async () => {
    // Show cached data first for instant load
    const cacheKey = activeTopTab === 'Community' ? `communities_${activeCommunityTab}` : 'circles_cache';
    const cached = await getCachedData(cacheKey);
    if (cached?.data) {
      if (activeTopTab === 'Community') {
        if (activeCommunityTab === 'Chat') {
          setCommunities(dedupeCommunities((cached.data as Community[]).filter((item) => item.type !== 'home_area' && item.type !== 'area')));
        }
      } else {
        setCircles(cached.data);
      }
    }

    try {
      if (activeTopTab === 'Community') {
        if (activeCommunityTab === 'Chat') {
          const [communityRes, requestRes] = await Promise.all([
            getCommunities(),
            getCommunityRequests({ status: 'active', limit: 10 }),
          ]);
          const filtered = dedupeCommunities((communityRes.data || []).filter((item: Community) => item.type !== 'home_area' && item.type !== 'area'));
          setCommunities(filtered);
          setRequests(requestRes.data || []);
          // Cache
          await setCachedData('communities_Chat', filtered);
        } else if (activeCommunityTab === 'General') {
          setCommunities([]);
          setRequests([]);
        }
      } else {
        const res = await getCircles();
        setCircles(res.data || []);
        // Cache
        await setCachedData('circles_cache', res.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', parseApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTopTab, activeCommunityTab]);


  // Only fetch when screen is focused (not on every tab switch)
  useFocusEffect(
    useCallback(() => {
      if (activeTopTab === 'Private Chat') {
        fetchConversations();
      }
    }, [activeTopTab])
  );

  // Only fetch when screen is focused (not on every tab switch)
  useFocusEffect(
    useCallback(() => {
      if (activeTopTab === 'Private Chat') {
        fetchConversations();
      }
    }, [activeTopTab])
  );

  // Use regular useEffect only for initial load
  useEffect(() => {
    fetchData();
    fetchUserLokSangma();
  }, []);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    
    // Show cached data first for instant load
    const cached = await getCachedData(CONVERSATIONS_CACHE_KEY);
    if (cached?.data) {
      setConversations(cached.data);
      setLoadingConversations(false);
    }
    
    try {
      const response = await getConversations();
      const newConversations = response.data || [];
      setConversations(newConversations);
      // Cache for next time
      await setCachedData(CONVERSATIONS_CACHE_KEY, newConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleCommunityTabChange = async (tab: string) => {
    setActiveCommunityTab(tab);

    if (tab === 'General') {
      setGeneralExpanded(false);
      setOfferingsExpanded(false);
      return;
    }

    if (tab === 'Chat') {
      fetchUserLokSangma();
    }

    // No request creation at community sub-tabs, only show existing requests
  };

  // Request submission disabled inside community sub-tabs.

  const loadLokSangmaOptions = async (search?: string) => {
    setLokSangmaSearch(search || '');
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

  const handleOpenLokSangmaModal = () => {
    setLokSangmaSearch('');
    loadLokSangmaOptions('');
    setShowLokSangmaModal(true);
  };

  const fetchUserLokSangma = useCallback(async () => {
    try {
      const res = await getUserCulturalCommunity();
      setUserLokSangma(res.data);
    } catch (error) {
      console.error('Error fetching Lok Sangam:', error);
    }
  }, []);

  const handleSelectLokSangma = async (community: string) => {
    if (userLokSangma?.is_locked) {
      Alert.alert('Locked', 'You can only change your Lok Sangam once. It is now locked.');
      return;
    }

    const changeMessage = userLokSangma?.cultural_community
      ? `Change from "${userLokSangma.cultural_community}" to "${community}"? You have ${1 - (userLokSangma?.change_count || 0)} change remaining.`
      : `Set your Lok Sangam to "${community}"?`;

    Alert.alert('Confirm', changeMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateUserCulturalCommunity(community);
            await fetchUserLokSangma();
            setShowLokSangmaModal(false);
            Alert.alert('Success', 'Lok Sangam updated!');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update');
          }
        }
      }
    ]);
  };

  // Request submission disabled inside community sub-tabs.

  const handleResolveRequest = async (requestId: string) => {
    Alert.alert(
      'Mark as Fulfilled',
      'Are you sure you want to mark this request as fulfilled?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await resolveCommunityRequest(requestId);
              Alert.alert('Success', 'Request marked as fulfilled!');
              fetchData();
            } catch (error: any) {
              console.error('Error resolving request:', error);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to resolve request');
            }
          }
        }
      ]
    );
  };

  const getCommunityIcon = (type: string) => {
    switch (type) {
      case 'home_area': return 'home';
      case 'office_area': return 'business';
      case 'city': return 'location';
      case 'state': return 'map';
      case 'country': return 'flag';
      default: return 'people';
    }
  };

  const getCommunityColor = (type: string) => {
    switch (type) {
      case 'home_area': return COLORS.success;
      case 'office_area': return COLORS.info;
      case 'city': return '#9B59B6';
      case 'state': return COLORS.warning;
      case 'country': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return COLORS.error;
      case 'high': return '#E67E22';
      case 'medium': return COLORS.warning;
      default: return COLORS.success;
    }
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

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderCommunity = ({ item }: { item: Community }) => {
    const isRestricted = item.type === 'state' || item.type === 'country' || 
                        item.name?.toLowerCase().includes('state') || 
                        item.name?.toLowerCase().includes('national');
    
    const handlePress = () => {
      if (isRestricted) {
        showToast('You are not eligible to use this group');
      } else {
        router.push(`/community/${item.id}`);
      }
    };

    return (
      <View key={item.id}>
        {item.label && (
          <Text style={[styles.communityLabel, { color: getCommunityColor(item.type) }]}>
            {item.label}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.communityCard, 
            isRestricted && styles.restrictedCommunityCard
          ]}
          onPress={handlePress}
          activeOpacity={isRestricted ? 0.9 : 0.7}
        >
          <View style={[
            styles.communityIcon, 
            { backgroundColor: isRestricted ? '#F1C40F20' : `${getCommunityColor(item.type)}15` }
          ]}>
            <Ionicons 
              name={isRestricted ? 'ribbon' : getCommunityIcon(item.type)} 
              size={24} 
              color={isRestricted ? '#F1C40F' : getCommunityColor(item.type)} 
            />
          </View>
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{item.name}</Text>
            <Text style={styles.communityStats}>{item.member_count} members</Text>
          </View>
          <Ionicons 
            name={isRestricted ? "lock-closed-outline" : "chevron-forward"} 
            size={20} 
            color={isRestricted ? '#F1C40F' : COLORS.textLight} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCircle = ({ item }: { item: Circle }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.circleCard}
      onPress={() => router.push(`/chat/circle/${item.id}?name=${encodeURIComponent(item.name)}`)}
    >
      <View style={styles.circleAvatar}>
        <Avatar name={item.name} photo={item.photo} size={48} />
      </View>
      <View style={styles.circleInfo}>
        <Text style={styles.circleName}>{item.name}</Text>
        <Text style={styles.circleLastMessage} numberOfLines={1}>
          {item.last_message || 'No messages yet'}
        </Text>
      </View>
      <View style={styles.circleRight}>
        <Text style={styles.circleTime}>{item.last_message_time || ''}</Text>
        <Text style={styles.circleMemberCount}>{item.member_count} members</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: CommunityRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={[
          styles.urgencyBadge,
          { backgroundColor: `${getUrgencyColor(item.urgency_level)}20` }
        ]}>
          <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(item.urgency_level) }]} />
          <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency_level) }]}>
            {item.urgency_level.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.requestDate}>{formatDate(item.created_at)}</Text>
      </View>
      
      <Text style={styles.requestTitle}>{item.title}</Text>
      <Text style={styles.requestDescription} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.requestFooter}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={14} color={COLORS.primary} />
          <Text style={styles.contactButtonText}>{item.contact_number}</Text>
        </TouchableOpacity>
        
        {item.status === 'active' && (
          <TouchableOpacity 
            style={styles.fulfillButton}
            onPress={() => handleResolveRequest(item.id)}
          >
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.fulfillButtonText}>Fulfilled</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderActiveRequestCard = (item: CommunityRequest) => (
    <View key={item.id} style={styles.activeRequestCard}>
      <View style={styles.activeRequestHeader}>
        <View style={styles.activeRequestBadge}>
          <Text style={styles.activeRequestBadgeText}>{item.urgency_level?.toUpperCase() || 'ACTIVE'}</Text>
        </View>
        <View style={styles.activeRequestType}>
          <Text style={styles.activeRequestTypeText}>{item.request_type || 'Request'}</Text>
        </View>
      </View>
      <Text style={styles.activeRequestTitle}>{item.title}</Text>
      <Text style={styles.activeRequestDescription} numberOfLines={3}>
        {item.description || 'Community request needing support.'}
      </Text>
      <View style={styles.activeRequestFooter}>
        <Text style={styles.activeRequestMetaText}>{item.contact_number ? `Contact ${item.contact_number}` : 'Open request'}</Text>
      </View>
    </View>
  );

  const renderConversationItem = (item: DMConversation) => {
    const conversationId = item.conversation_id || item.chat_id || item.id;
    const otherUser = item.user;
    if (!conversationId || !otherUser) {
      return null;
    }

    return (
      <TouchableOpacity
        key={conversationId}
        style={styles.userItem}
        onPress={() => router.push(`/dm/${conversationId}`)}
      >
        <View style={styles.userAvatar}>
          {otherUser.photo ? (
            <Image source={{ uri: otherUser.photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {otherUser.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{otherUser.name}</Text>
          <Text style={styles.userSL} numberOfLines={1}>
            {item.last_message || `SL: ${otherUser.sl_id}`}
          </Text>
        </View>
        <View style={styles.userRight}>
          <Text style={styles.userTime}>{formatTime(item.last_message_at)}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topTabsContainer, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 25 : 12) }]}>
        <View style={styles.topTabsInner}>
          {TOP_TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.topTab,
                index !== TOP_TABS.length - 1 && styles.topTabSpacing,
                activeTopTab === tab && styles.topTabActive,
              ]}
              onPress={() => setActiveTopTab(tab)}
            >
              <Text style={[styles.topTabText, activeTopTab === tab && styles.topTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Community Tab Content */}
      {activeTopTab === 'Community' && (
        <ScrollView
          contentContainerStyle={styles.communityScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
            />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroCardTop}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroTitle}>Help your community</Text>
                <Text style={styles.heroSubtitle}>Together we can make a difference</Text>
              </View>
              <View style={styles.heroIconWrapper}>
                <Ionicons name="sparkles" size={24} color={COLORS.primary} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => router.push('/community-request')}
            >
              <Ionicons name="add" size={16} color={COLORS.surface} />
              <Text style={styles.heroActionText}>Create Request</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Active Requests</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {requests.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeRequestsRow}
            >
              {requests.map(renderActiveRequestCard)}
            </ScrollView>
          ) : (
            <View style={styles.emptyRequestRow}>
              <Text style={styles.emptyText}>There are no active community requests yet.</Text>
            </View>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Our Groups</Text>
          </View>

          <View style={styles.groupsContainer}>
            {communities.length > 0 ? (
              communities.map((item) => renderCommunity({ item }))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={44} color={COLORS.textLight} />
                <Text style={styles.emptyTitle}>No Groups Yet</Text>
                <Text style={styles.emptyText}>Join your first community group to start helping.</Text>
              </View>
            )}
          </View>

        </ScrollView>
      )}

      {/* Private Chat Tab Content */}
      {activeTopTab === 'Private Chat' && (
        <View style={styles.privateChatContainer}>
          <View style={styles.privateTopBar}>
            <Text style={styles.privateTopTitle}>Private Chat</Text>
            <TouchableOpacity style={styles.newChatPill} onPress={() => router.push('/dm/new')}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.newChatPillText}>New Chat</Text>
            </TouchableOpacity>
          </View>

          {loadingConversations ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingUsers} />
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchData();
                    fetchConversations();
                  }}
                />
              }
            >
                <Text style={styles.sectionHeader}>Groups</Text>
              {circles.length > 0 ? (
                circles.map((circle) => renderCircle({ item: circle }))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={44} color={COLORS.textLight} />
                  <Text style={styles.emptyTitle}>No Groups Yet</Text>
                  <Text style={styles.emptyText}>Create a group to chat in a shared space.</Text>
                </View>
              )}

              <Text style={styles.sectionHeader}>Recent Chats</Text>
              {conversations.length > 0 ? (
                conversations.map((conversation) => renderConversationItem(conversation))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={44} color={COLORS.textLight} />
                  <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                  <Text style={styles.emptyText}>Tap New Chat to start messaging someone.</Text>
                </View>
              )}


            </ScrollView>
          )}
        </View>
      )}


      <Modal visible={showLokSangmaModal} transparent animationType="slide" onRequestClose={() => setShowLokSangmaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Culture Group</Text>
              <TouchableOpacity onPress={() => setShowLokSangmaModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search culture groups..."
              placeholderTextColor={COLORS.textSecondary}
              value={lokSangmaSearch}
              onChangeText={(text) => loadLokSangmaOptions(text)}
            />

            {lokSangmaLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
            ) : (
              <ScrollView style={styles.lokSangmaList}>
                {lokSangmaList && lokSangmaList.length > 0 ? (
                  lokSangmaList.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.lokSangmaItem,
                        userLokSangma?.cultural_community === item && styles.lokSangmaItemSelected,
                      ]}
                      onPress={() => handleSelectLokSangma(item)}
                      disabled={userLokSangma?.is_locked}
                    >
                      <Text style={[
                        styles.lokSangmaItemText,
                        userLokSangma?.cultural_community === item && styles.lokSangmaItemTextSelected,
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No matching culture groups found.</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast Notice */}
      {toastVisible && (
        <View style={styles.toastContainer}>
          <View style={styles.toastContent}>
            <Ionicons name="information-circle" size={20} color="#FFF" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Live Mantra Jaap Button
  liveMantraButton: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.primary}08`,
  },
  liveMantraContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  liveMantraTextContainer: {
    flex: 1,
  },
  liveMantraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  liveMantraSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  // Top Tabs (Community | Private Chat)
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  chatHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  chatHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTabsContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  communityScroll: {
    padding: SPACING.md,
    paddingBottom: 120,
    backgroundColor: COLORS.background,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  heroIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
  },
  heroActionText: {
    color: COLORS.surface,
    fontWeight: '700',
    marginLeft: SPACING.xs,
  },
  culturalCommunityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  culturalCommunityHeader: {
    marginBottom: SPACING.xs,
  },
  culturalCommunityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  culturalCommunitySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  culturalCommunityInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  culturalCommunityAction: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  culturalCommunityActionLocked: {
    backgroundColor: `${COLORS.textSecondary}30`,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeRequestsRow: {
    paddingBottom: SPACING.sm,
  },
  activeRequestCard: {
    minWidth: 240,
    maxWidth: 260,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginRight: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  activeRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  activeRequestBadge: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  activeRequestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  activeRequestType: {
    backgroundColor: `${COLORS.secondary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
  },
  activeRequestTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  activeRequestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  activeRequestDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  activeRequestFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.sm,
  },
  activeRequestMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyRequestRow: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  groupsContainer: {
    marginBottom: SPACING.md,
  },
  groupCard: {
    marginBottom: SPACING.sm,
  },
  topTabsInner: {
    flexDirection: 'row',
  },
  topTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  topTabSpacing: {
    marginRight: SPACING.sm,
  },
  topTabActive: {
    backgroundColor: COLORS.primary,
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  topTabTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  headerAction: {
    padding: SPACING.sm,
  },
  headerActionContainer: {
    position: 'relative',
  },
  requestTypeMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.divider,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  requestTypeMenuItem: {
    padding: SPACING.sm,
    minWidth: 120,
  },
  requestTypeMenuText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  lockedText: {
    color: COLORS.error,
    marginLeft: SPACING.xs,
    fontSize: 13,
  },
  currentCGBanner: {
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  currentCGText: {
    color: COLORS.text,
    fontSize: 13,
  },
  lokSangamGroupBanner: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    marginBottom: SPACING.sm,
  },
  lokSangamGroupText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  lokSangamGroupSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  searchInput: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  lokSangmaList: {
    marginHorizontal: SPACING.md,
  },
  lokSangmaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  lokSangmaItemSelected: {
    backgroundColor: `${COLORS.primary}15`,
  },
  lokSangmaItemText: {
    color: COLORS.text,
    fontSize: 15,
  },
  lokSangmaItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  offeringsList: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  offeringsItem: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  offeringsText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  // Sub Tabs (Chat | Help | Blood...)
  subTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.sm,
  },
  subTabsSpacer: {
    flex: 1,
  },
  subTabsScroll: {
    flex: 1,
  },
  createRequestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginRight: SPACING.md,
    gap: 4,
  },
  createRequestPillText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  requestTypeMenu: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  requestTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  requestTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  requestTypeSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '75%',
  },
  requestMenuCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${COLORS.background}DD`,
  },
  requestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  requestCard: {
    width: '48%',
    minHeight: 110,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: `${COLORS.primary}08`,
    padding: SPACING.md,
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  requestCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  requestCardText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  subTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    borderRadius: 20,
  },
  subTabActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  subTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  subTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  pillDropdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  pillDropdownItem: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  pillDropdownText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  addButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  // Community Card
  communityLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  communityStats: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Circle Card
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  circleAvatar: {
    marginRight: SPACING.md,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  circleLastMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  circleRight: {
    alignItems: 'flex-end',
  },
  circleTime: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  circleMemberCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Request Card
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  requestDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  requestDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contactButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  fulfillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fulfillButtonText: {
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  culturalCommunityActionText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  cgModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: SPACING.md,
  },
  cgModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '80%',
  },
  cgModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cgModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  cgLockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  cgLockedText: {
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  cgCurrentBanner: {
    padding: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  cgCurrentText: {
    color: COLORS.text,
    fontSize: 14,
  },
  cgSearchInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  cgCreateButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  cgCreateButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  cgList: {
    maxHeight: 300,
  },
  cgItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  cgItemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  cgItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  cgItemTextSelected: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginTop: SPACING.lg,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  // Private Chat User List Styles
  privateChatContainer: {
    flex: 1,
  },
  privateTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  privateTopTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  newChatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    gap: 4,
  },
  newChatPillText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  userSearchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  userSearchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  loadingUsers: {
    marginTop: SPACING.xl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  userTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  userSL: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  groupsSection: {
    paddingTop: SPACING.sm,
  },
  groupsHeader: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  communityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  restrictedCommunityCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1C40F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  restrictedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
