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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { getCircles, getCommunities, createCommunityRequest, getCommunityRequests, getMyCommunityRequests, resolveCommunityRequest, getConversations, getCulturalCommunities, getUserCulturalCommunity, updateUserCulturalCommunity, parseApiError } from '../../src/services/api';
import { RequestFormModal } from '../../src/components/RequestFormModal';
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
  
  const [showLokSangmaModal, setShowLokSangmaModal] = useState(false);
  const [lokSangmaSearch, setLokSangmaSearch] = useState('');
  const [lokSangmaList, setLokSangmaList] = useState<string[]>([]);
  const [lokSangmaLoading, setLokSangmaLoading] = useState(false);
  const [userLokSangma, setUserLokSangma] = useState<{ cultural_community: string | null; change_count: number; is_locked: boolean } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalExpanded, setGeneralExpanded] = useState(false);
  const [offeringsExpanded, setOfferingsExpanded] = useState(false);
  const [selectedOfferingType, setSelectedOfferingType] = useState<'Food' | 'Blanket' | 'Clothes' | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestTypeMenu, setShowRequestTypeMenu] = useState(false);
  const [requestType, setRequestType] = useState<'Help' | 'Blood' | 'Medical' | 'Financial' | 'Petition'>('Blood');
  const [showCGModal, setShowCGModal] = useState(false);
  const [cgSearch, setCGSearch] = useState('');
  const [cgList, setCGList] = useState<string[]>([]);
  const [cgLoading, setCGLoading] = useState(false);
  const [userCG, setUserCG] = useState<{ cultural_community: string | null; change_count: number; is_locked: boolean } | null>(null);

  const fetchData = useCallback(async () => {
    // Show cached data first for instant load
    const cacheKey = activeTopTab === 'Community' ? `communities_${activeCommunityTab}` : 'circles_cache';
    const cached = await getCachedData(cacheKey);
    if (cached?.data) {
      if (activeTopTab === 'Community') {
        if (activeCommunityTab === 'Chat') {
          setCommunities((cached.data as Community[]).filter((item) => item.type !== 'home_area' && item.type !== 'area'));
        }
      } else {
        setCircles(cached.data);
      }
    }
    
    try {
      if (activeTopTab === 'Community') {
        if (activeCommunityTab === 'Chat') {
          const res = await getCommunities();
          const filtered = (res.data || []).filter((item: Community) => item.type !== 'home_area' && item.type !== 'area');
          setCommunities(filtered);
          setRequests([]);
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

  const fetchUserCG = useCallback(async () => {
    try {
      const res = await getUserCulturalCommunity();
      setUserCG(res.data);
    } catch (error) {
      console.error('Error fetching My Culture Group:', error);
    }
  }, []);

  const loadCulturalCommunities = useCallback(async (search?: string) => {
    setCGLoading(true);
    try {
      const res = await getCulturalCommunities(search);
      setCGList(res.data || []);
    } catch (error) {
      console.error('Error loading cultural communities:', error);
    } finally {
      setCGLoading(false);
    }
  }, []);

  const handleOpenCGModal = () => {
    loadCulturalCommunities();
    fetchUserCG();
    setShowCGModal(true);
  };

  const handleSelectCG = async (community: string) => {
    const changeMessage = userCG?.cultural_community
      ? `Change from "${userCG.cultural_community}" to "${community}"?`
      : `Set your My Culture Group to "${community}"?`;

    Alert.alert('Confirm', changeMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateUserCulturalCommunity(community);
            await fetchUserCG();
            setShowCGModal(false);
            Alert.alert('Success', 'My Culture Group updated!');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update');
          }
        }
      }
    ]);
  };

  // Only fetch when screen is focused (not on every tab switch)
  useFocusEffect(
    useCallback(() => {
      fetchUserCG();
      if (activeTopTab === 'Private Chat') {
        fetchConversations();
      }
    }, [activeTopTab])
  );

  // Only fetch when screen is focused (not on every tab switch)
  useFocusEffect(
    useCallback(() => {
      fetchUserCG();
      if (activeTopTab === 'Private Chat') {
        fetchConversations();
      }
    }, [activeTopTab])
  );

  // Use regular useEffect only for initial load
  useEffect(() => {
    fetchData();
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
    loadLokSangmaOptions();
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
      Alert.alert('Locked', 'You have already changed your Lok Sangam 2 times. It is now locked.');
      return;
    }

    const changeMessage = userLokSangma?.cultural_community
      ? `Change from "${userLokSangma.cultural_community}" to "${community}"? You have ${2 - (userLokSangma?.change_count || 0)} changes remaining.`
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

  const renderCommunity = ({ item }: { item: Community }) => (
    <View>
      {item.label && (
        <Text style={[styles.communityLabel, { color: getCommunityColor(item.type) }]}>
          {item.label}
        </Text>
      )}
      <TouchableOpacity
        style={styles.communityCard}
        onPress={() => router.push(`/community/${item.id}`)}
      >
        <View style={[styles.communityIcon, { backgroundColor: `${getCommunityColor(item.type)}15` }]}>
          <Ionicons name={getCommunityIcon(item.type)} size={24} color={getCommunityColor(item.type)} />
        </View>
        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>{item.name}</Text>
          <Text style={styles.communityStats}>{item.member_count} members</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

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
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Top Tabs: Community | Private Chat */}
      <View style={styles.topTabsContainer}>
        <View style={styles.topTabsInner}>
          {TOP_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.topTab, activeTopTab === tab && styles.topTabActive]}
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
        <>
          {/* Create Request button for Community */}
          <View style={styles.subTabsContainer}>
            <View style={styles.subTabsSpacer} />
            <TouchableOpacity
              style={styles.createRequestPill}
              onPress={() => setShowRequestTypeMenu(!showRequestTypeMenu)}
            >
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.createRequestPillText}>Create Request</Text>
            </TouchableOpacity>
          </View>

          {showRequestTypeMenu && activeTopTab === 'Community' && (
            <View style={styles.pillDropdown}>
              {(['Blood', 'Medical', 'Petition'] as const)
                .filter((type) => !(activeCommunityTab === 'Chat' && type === 'Medical'))
                .map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pillDropdownItem}
                    onPress={() => {
                      setShowRequestTypeMenu(false);
                      setRequestType(type as any);
                      setSelectedOfferingType(null);
                      setShowRequestModal(true);
                    }}
                  >
                    <Text style={styles.pillDropdownText}>{type}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Community Content */}
          {activeCommunityTab === 'Chat' ? (
            <>
              <FlatList
                data={communities}
                renderItem={renderCommunity}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyTitle}>No Communities</Text>
                    <Text style={styles.emptyText}>Set up your location to join communities</Text>
                  </View>
                }
                ListFooterComponent={() => (
                  <View style={styles.culturalCommunityCard}>
                    <Text style={styles.culturalCommunityTitle}>My Culture Group</Text>
                    <Text style={styles.culturalCommunitySubtitle}>
                      {userCG?.cultural_community || 'Tap to set'}
                    </Text>
                    <TouchableOpacity style={styles.culturalCommunityAction} onPress={handleOpenCGModal}>
                      <Text style={styles.culturalCommunityActionText}>
                        {userCG?.cultural_community ? 'Change' : 'Set'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          ) : activeCommunityTab === 'General' ? (
            <View style={styles.generalContainer}>
              <TouchableOpacity
                style={styles.generalBar}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setGeneralExpanded(!generalExpanded);
                  setOfferingsExpanded(false);
                }}
              >
                <Text style={styles.generalBarText}>General Options</Text>
                <Ionicons
                  name={generalExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.text}
                />
              </TouchableOpacity>

              {generalExpanded && (
                <View style={styles.generalOptions}>
                  <TouchableOpacity 
                    style={styles.generalOptionItem} 
                    onPress={() => {
                      setRequestType('Help');
                      setShowRequestModal(true);
                    }}
                  >
                    <Text style={styles.generalOptionText}>Study</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.generalOptionItem}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setOfferingsExpanded(!offeringsExpanded);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.generalOptionText}>Offerings</Text>
                      <Ionicons
                        name={offeringsExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {offeringsExpanded && (
                    <View style={styles.offeringsList}>
                      {['Food', 'Blanket', 'Clothes'].map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={styles.offeringsItem}
                          onPress={() => {
                            setRequestType('Financial');
                            setSelectedOfferingType(item as 'Food' | 'Blanket' | 'Clothes');
                            setOfferingsExpanded(false);
                            setShowRequestModal(true);
                          }}
                        >
                          <Text style={styles.offeringsText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <>
              <FlatList
              data={requests}
              renderItem={renderRequest}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyTitle}>No {activeCommunityTab} Requests</Text>
                  <Text style={styles.emptyText}>Tap + in the top-right to create a new {activeCommunityTab.toLowerCase()} request</Text>
                </View>
              }
            />
            </>
          )}
        </>
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

      {/* Lok Sangam selection modal */}
      <Modal
        visible={showLokSangmaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLokSangmaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Lok Sangam</Text>
              <TouchableOpacity onPress={() => setShowLokSangmaModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {userLokSangma?.is_locked && (
              <View style={styles.lockedBanner}>
                <Ionicons name="lock-closed" size={16} color={COLORS.error} />
                <Text style={styles.lockedText}>Locked - Maximum changes reached</Text>
              </View>
            )}

            {userLokSangma?.cultural_community && !userLokSangma?.is_locked && (
              <View style={styles.currentCGBanner}>
                <Text style={styles.currentCGText}>
                  Current Lok Sangam: {userLokSangma.cultural_community} ({2 - (userLokSangma.change_count || 0)} changes left)
                </Text>
              </View>
            )}

            <TextInput
              style={styles.searchInput}
              placeholder="Search Lok Sangam..."
              placeholderTextColor={COLORS.textLight}
              value={lokSangmaSearch}
              onChangeText={(text) => {
                setLokSangmaSearch(text);
                loadLokSangmaOptions(text);
              }}
            />

            {lokSangmaLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
            ) : (
              <FlatList
                data={lokSangmaList}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
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
                    {userLokSangma?.cultural_community === item && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.lokSangmaList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No Lok Sangam found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <RequestFormModal
        visible={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedOfferingType(null);
        }}
        requestType={requestType}
        selectedOfferingType={selectedOfferingType}
        communities={communities}
        user={user ?? undefined}
        onSubmit={async (data: any) => {
          console.log('Full request data being sent:', JSON.stringify(data, null, 2));
          try {
            const response = await createCommunityRequest({
              community_id: data.community_id,
              request_type: data.request_type,
              visibility_level: data.visibility_level || 'area',
              title: data.title || `${data.request_type} Request`,
              description: data.description || 'Request created from community tab',
              contact_number: data.contact_number,
              urgency_level: data.urgency_level || 'low',
              blood_group: data.blood_group,
              hospital_name: data.hospital_name,
              location: data.location,
              amount: data.amount,
              support_needed: data.support_needed,
              contact_person_name: data.contact_person_name,
            });
            console.log('Request created successfully:', response);
            Alert.alert('Success', 'Your request has been posted!');
            fetchData();
          } catch (error: any) {
            console.error('Error submitting request full:', error);
            const responseData = error.response?.data;
            console.error('Response data:', JSON.stringify(responseData, null, 2));
            let errorMessage = 'Failed to submit request';
            if (responseData) {
              if (Array.isArray(responseData.detail)) {
                errorMessage = responseData.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
              } else if (typeof responseData.detail === 'string') {
                errorMessage = responseData.detail;
              } else if (typeof responseData === 'object') {
                errorMessage = JSON.stringify(responseData);
              }
            }
            Alert.alert('Error', errorMessage);
            throw error;
          }
        }}
      />

      <Modal
        visible={showCGModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCGModal(false)}
      >
        <View style={styles.cgModalOverlay}>
          <View style={styles.cgModalContent}>
            <View style={styles.cgModalHeader}>
              <Text style={styles.cgModalTitle}>Select My Culture Group</Text>
              <TouchableOpacity onPress={() => setShowCGModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {userCG?.cultural_community && (
              <View style={styles.cgCurrentBanner}>
                <Text style={styles.cgCurrentText}>
                  Current: {userCG.cultural_community}
                </Text>
              </View>
            )}
            <TextInput
              style={styles.cgSearchInput}
              placeholder="Search communities..."
              placeholderTextColor={COLORS.textLight}
              value={cgSearch}
              onChangeText={(text) => {
                setCGSearch(text);
                loadCulturalCommunities(text);
              }}
            />
            {cgLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
            ) : (
              <>
                {cgSearch.trim().length > 0 && !cgList.some((item) => item.toLowerCase() === cgSearch.trim().toLowerCase()) && (
                  <TouchableOpacity
                    style={styles.cgCreateButton}
                    onPress={() => handleSelectCG(cgSearch.trim())}
                    disabled={userCG?.is_locked}
                  >
                    <Text style={styles.cgCreateButtonText}>
                      Use "{cgSearch.trim()}" as my culture group
                    </Text>
                  </TouchableOpacity>
                )}
                <FlatList
                  data={cgList}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.cgItem,
                        userCG?.cultural_community === item && styles.cgItemSelected,
                      ]}
                      onPress={() => handleSelectCG(item)}
                    >
                      <Text style={[
                        styles.cgItemText,
                        userCG?.cultural_community === item && styles.cgItemTextSelected,
                      ]}>
                        {item}
                      </Text>
                      {userCG?.cultural_community === item && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.cgList}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No communities found</Text>
                  }
                />
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
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
  topTabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  topTabsInner: {
    flexDirection: 'row',
    flex: 1,
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
  topTab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabActive: {
    borderBottomColor: COLORS.primary,
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  topTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
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
    borderRadius: 16,
    marginBottom: 12,
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
    borderRadius: 16,
    marginBottom: 12,
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
  culturalCommunityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  culturalCommunityTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  culturalCommunitySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  culturalCommunityAction: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
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
});
