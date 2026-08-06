import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
  Share,
  Dimensions,
  BackHandler,
  AppState,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getCommunityRequests, resolveCommunityRequest } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { socketService } from '../../src/services/socket';
import { Avatar } from '../../src/components/Avatar';

const { width } = Dimensions.get('window');

interface CommunityRequest {
  id: string;
  community_id: string;
  title: string;
  description: string;
  request_type: string;
  contact_number: string;
  urgency_level: string;
  status: string;
  created_at: string;
  location: string;
  user_name?: string;
  user?: { name?: string; photo?: string; is_verified?: boolean };
  support_needed?: string;
  user_id?: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All Requests', icon: 'apps', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'blood', name: 'Blood Requests', icon: 'water', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'emergency', name: 'Emergency', icon: 'alert-circle', color: '#F97316', bg: '#FFF7ED' },
  { id: 'food', name: 'Food / Grocery', icon: 'basket', color: '#F25C05', bg: '#FFF4EE' },
  { id: 'gau', name: 'Gau Seva / Animal', icon: 'paw', color: '#10B981', bg: '#ECFDF5' },
  { id: 'temple', name: 'Temple Support', icon: 'home', color: '#D97706', bg: '#FEF3C7' },
  { id: 'other', name: 'Others', icon: 'help-circle', color: '#6B7280', bg: '#F9FAFB' },
];

export default function ActiveRequestsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);

  const params = useLocalSearchParams<{ community_id?: string, requestId?: string }>();
  const [initialRouteHandled, setInitialRouteHandled] = useState(false);
  const [ticker, setTicker] = useState(0);

  const parseUTCDate = (dateString?: string) => {
    if (!dateString) return new Date(NaN);
    let ds = String(dateString);
    if (!ds.includes('Z') && !ds.includes('+') && !ds.match(/-\d\d:\d\d$/)) {
      ds = ds.includes('T') ? `${ds}Z` : `${ds.replace(' ', 'T')}Z`;
    }
    return new Date(ds);
  };

  // Timer to refresh "time ago" labels every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Socket listener & Polling fallback for real-time requests
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const initSocket = () => {
      try {
        if (params.community_id) {
          socketService.joinRoom(params.community_id);
        }
      } catch (err) {
        console.log('[Socket] Connection failed in RequestList:', err);
      }
    };

    initSocket();

    const handleNewRequest = (newRequest: CommunityRequest) => {
      console.log('[Socket] New community request received:', newRequest.id);
      
      // If we are filtering by community and it doesn't match, ignore
      if (params.community_id && 
          newRequest.community_id && 
          String(newRequest.community_id) !== String(params.community_id)) {
        return;
      }
      
      setRequests(prev => {
        // Check if it already exists (avoid duplicates)
        if (prev.find(r => r.id === newRequest.id)) return prev;
        return sortRequests([newRequest, ...prev]);
      });
    };

    socketService.onEvent('new_community_request', handleNewRequest);

    // Polling fallback (every 30 seconds) to ensure list stays fresh even if socket drops
    pollingInterval = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      fetchRequests(false); // background fetch
    }, 30000);

    return () => {
      socketService.offEvent('new_community_request', handleNewRequest);
      if (params.community_id) {
        socketService.leaveRoom(params.community_id);
      }
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [params.community_id]);

  useEffect(() => {
    fetchRequests(true);
  }, [params.community_id]);

  useEffect(() => {
    if (!loading && requests.length > 0 && params.requestId && !initialRouteHandled) {
      const found = requests.find(r => r.id === params.requestId);
      if (found) {
        setSelectedRequest(found);
      }
      setInitialRouteHandled(true);
    }
  }, [loading, requests, params.requestId, initialRouteHandled]);

  useEffect(() => {
    const onBackPress = () => {
      if (selectedRequest) {
        setSelectedRequest(null);
        return true;
      }
      if (params.community_id) {
        router.replace(`/community/${params.community_id}`);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(tabs)/messages');
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selectedRequest, params.community_id]);

  const sortRequests = (list: CommunityRequest[]) => {
    return [...list].sort((a, b) => {
      return parseUTCDate(b.created_at).getTime() - parseUTCDate(a.created_at).getTime();
    });
  };

  const fetchRequests = async (showLoading = true) => {
    const cacheKey = params.community_id 
      ? `community_requests_${params.community_id}` 
      : 'community_requests_all';

    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequests(parsed);
          setLoading(false);
          showLoading = false;
        }
      }
    } catch (cacheError) {
      console.log('Failed to load cached community requests:', cacheError);
    }

    try {
      if (showLoading) setLoading(true);
      const [activeRes, resolvedRes] = await Promise.all([
        getCommunityRequests({ status: 'active', limit: 50, community_id: params.community_id }),
        getCommunityRequests({ status: 'resolved', limit: 50, community_id: params.community_id })
      ]);
      const apiRequests = [...(activeRes.data || []), ...(resolvedRes.data || [])];
      
      // Filter out resolved requests older than 15 days and garbage data
      const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
      const filtered = apiRequests.filter(req => {
        // Filter out obvious garbage data
        if (
          req.description?.includes('GHDTYGFTYTY') ||
          req.title?.includes('GHDTYGFTYTY') ||
          req.description === 'Phone Call' || 
          req.description === 'WhatsApp'
        ) {
          return false;
        }

        if (req.status === 'resolved') {
          const createdAt = parseUTCDate(req.created_at).getTime();
          return !Number.isNaN(createdAt) && createdAt >= fifteenDaysAgo;
        }
        return true;
      });
      
      const sorted = sortRequests(filtered);
      setRequests(sorted);
      
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(sorted));
      } catch (cacheSaveError) {
        console.log('Failed to save community requests to cache:', cacheSaveError);
      }
    } catch (error) {
      console.log('Failed to fetch community requests:', error);
      setRequests(prev => prev.length > 0 ? prev : []);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveRequest = async (requestId: string) => {
    try {
      await resolveCommunityRequest(requestId);
      Alert.alert('Success', 'Request marked as fulfilled successfully!');
      setRequests(prev => sortRequests(prev.map(req => req.id === requestId ? { ...req, status: 'resolved' } : req)));
      setSelectedRequest(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Unable to fulfill request');
    }
  };

  const getRequestTheme = (item: CommunityRequest) => {
    const type = (item.request_type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();

    if (type === 'blood' || title.includes('blood') || desc.includes('blood')) {
      return {
        colors: ['#FFE3E0', '#FFF0EE'],
        border: 'rgba(239, 68, 68, 0.2)',
        icon: 'water',
        iconColor: '#EF4444',
        label: 'Blood Needed',
      };
    }
    if (type === 'emergency' || type === 'critical' || title.includes('emergency') || desc.includes('emergency')) {
      return {
        colors: ['#FFEEDC', '#FFF8F0'],
        border: 'rgba(249, 115, 22, 0.2)',
        icon: 'alert-circle',
        iconColor: '#F97316',
        label: 'Emergency',
      };
    }
    if (type === 'food' || title.includes('food') || desc.includes('food') || title.includes('grocery')) {
      return {
        colors: ['#FFEED0', '#FFF7E6'],
        border: 'rgba(242, 92, 5, 0.2)',
        icon: 'basket',
        iconColor: '#F25C05',
        label: 'Food / Grocery',
      };
    }
    if (type === 'gau' || type === 'animal' || title.includes('cow') || desc.includes('cow') || desc.includes('animal') || desc.includes('dog')) {
      return {
        colors: ['#ECFDF5', '#F0FDF4'],
        border: 'rgba(16, 185, 129, 0.2)',
        icon: 'cow',
        iconColor: '#10B981',
        label: 'Gau Seva / Animal',
      };
    }
    if (type === 'temple' || title.includes('temple') || desc.includes('temple') || title.includes('volunteer')) {
      return {
        colors: ['#FEF3C7', '#FFFBEB'],
        border: 'rgba(217, 119, 6, 0.2)',
        icon: 'home',
        iconColor: '#D97706',
        label: 'Temple Help',
      };
    }
    return {
      colors: ['#F3F4F6', '#F9FAFB'],
      border: 'rgba(107, 114, 128, 0.15)',
      icon: 'help-circle',
      iconColor: '#6B7280',
      label: 'Other Help',
    };
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      if (!dateStr) return 'Recently';
      const parsedDate = parseUTCDate(dateStr);
      const diff = Date.now() - parsedDate.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleCall = (number: string) => {
    if (!number) return;
    const cleaned = number.replace(/[^\d+]/g, '');
    Alert.alert(
      'Contact Number',
      `Phone Number: ${number}\nDo you want to call this number?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${cleaned}`).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          }
        }
      ]
    );
  };

  const handleWhatsApp = (number: string, title: string, requestId?: string) => {
    if (!number) return;
    const formatted = number.replace(/\D/g, ''); // Official WhatsApp format must exclude '+' and other non-digits
    
    let messageText = `Hare Krishna! I saw your community request "${title}" on Brahmand App and would like to extend my help.`;
    if (requestId) {
      messageText += `\n\nRequest Link: https://brahmand.app/community-request/list?requestId=${requestId}`;
    }
    
    const text = encodeURIComponent(messageText);
    Linking.openURL(`https://wa.me/${formatted}?text=${text}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp');
    });
  };

  const handleShare = async (request: CommunityRequest) => {
    try {
      // Create a deep link using the app scheme targeting the list page with the request ID
      const deepLink = `https://brahmand.app/community-request/list?requestId=${request.id}`;
      const typeLabel = getRequestTheme(request).label.toUpperCase();
      
      await Share.share({
        title: request.title,
        message: `📢 *Brahmand Community Request*\n\n[${typeLabel}]\n*${request.title}*\n📍 Location: ${request.location}\n⚠️ Urgency: ${request.urgency_level.toUpperCase()}\n\n💬 Description:\n"${request.description}"\n\n📞 Contact number: ${request.contact_number}\n\nTap the link below to open in Brahmand App and offer help:\n${deepLink}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const theme = getRequestTheme(req);
    
    // Category Filter
    if (selectedCategory !== 'all') {
      const type = selectedCategory;
      if (type === 'blood' && theme.label !== 'Blood Needed') return false;
      if (type === 'emergency' && theme.label !== 'Emergency') return false;
      if (type === 'food' && theme.label !== 'Food / Grocery') return false;
      if (type === 'gau' && theme.label !== 'Gau Seva / Animal') return false;
      if (type === 'temple' && theme.label !== 'Temple Help') return false;
      if (type === 'other' && theme.label !== 'Other Help') return false;
    }

    // Search query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = (req.title || '').toLowerCase().includes(query);
      const matchDesc = (req.description || '').toLowerCase().includes(query);
      const matchLoc = (req.location || '').toLowerCase().includes(query);
      return matchTitle || matchDesc || matchLoc;
    }

    return true;
  });

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

  const renderRequestCard = ({ item }: { item: CommunityRequest }) => {
    const theme = getRequestTheme(item);
    const urgency = getUrgencyBadgeStyle(item.urgency_level);
    const isResolved = item.status === 'resolved';
    const ownerName = item.user_name || item.user?.name || 'Requester';
    const requestTypeLabel = item.request_type ? String(item.request_type).toUpperCase() : 'REQUEST';

    return (
      <TouchableOpacity
        style={styles.requestCard} 
        activeOpacity={0.9}
        onPress={() => setSelectedRequest(item)}
      >
        <View style={[styles.requesterHeader, { alignItems: 'flex-start', justifyContent: 'flex-start', marginBottom: 8 }]}>
          <Avatar name={ownerName} photo={item.user?.photo} size={40} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111' }} numberOfLines={1}>{ownerName}</Text>
              {item.user?.is_verified && <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6B00" style={{ marginLeft: 2 }} />}
              <Text style={{ fontSize: 14, color: '#536471' }} numberOfLines={1}>
                @{ownerName.replace(/\s+/g, '').toLowerCase()}
              </Text>
              <Text style={{ fontSize: 14, color: '#536471' }} numberOfLines={1}> · {getTimeAgo(item.created_at)}</Text>
              <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>{requestTypeLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.requestContentCard, { borderColor: isResolved ? '#A7F3D0' : theme.border }, isResolved && { backgroundColor: '#F0FDF4' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: isResolved ? '#10B98115' : theme.iconColor + '15' }]}>
              <MaterialCommunityIcons 
                name={isResolved ? 'check-circle' : theme.icon as any} 
                size={22} 
                color={isResolved ? '#10B981' : theme.iconColor} 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.cardTypeLabel, { color: isResolved ? '#10B981' : theme.iconColor }]}>
                {isResolved ? 'Help Completed' : theme.label}
              </Text>
            </View>
            {isResolved ? (
              <View style={[styles.urgencyBadge, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.urgencyText, { color: '#065F46' }]}>RESOLVED</Text>
              </View>
            ) : (
              <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg, borderColor: urgency.border }]}>
                <Text style={[styles.urgencyText, { color: urgency.text }]}>{item.urgency_level.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, isResolved && { color: '#065F46' }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardFooter}>
            {isResolved ? (
              <View style={styles.resolvedFooterRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.viewBtn]}
                  onPress={() => setSelectedRequest(item)}
                >
                  <Ionicons name="eye" size={14} color="#6366F1" />
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
                <View style={styles.helpDoneBadge}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={styles.helpDoneBadgeText}>Help Done ✅</Text>
                </View>
              </View>
            ) : (
              <View style={styles.activeFooterRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.viewBtn]}
                  onPress={() => setSelectedRequest(item)}
                >
                  <Ionicons name="eye" size={14} color="#6366F1" />
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, styles.waBtn]}
                  onPress={() => handleWhatsApp(item.contact_number, item.title, item.id)}
                >
                  <FontAwesome5 name="whatsapp" size={14} color="#FFF" />
                  <Text style={styles.actionBtnText}>Offer Help</Text>
                </TouchableOpacity>

                {item.user_id === user?.id && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.fulfillBtn]}
                    onPress={() => handleResolveRequest(item.id)}
                  >
                    <Ionicons name="checkmark-done" size={14} color="#FFF" />
                    <Text style={styles.actionBtnText}>Fulfill</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => {
              if (params.community_id) {
                router.replace(`/community/${params.community_id}`);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/messages');
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Active Community Requests</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => router.push('/community-request')}
          >
            <Ionicons name="add" size={24} color="#F25C05" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search blood, foods, locations..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.categoryScrollContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryContent}
            renderItem={({ item }) => {
              const isActive = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.catChip,
                    isActive && { backgroundColor: item.color, borderColor: item.color }
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={16} 
                    color={isActive ? '#FFF' : item.color} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[styles.catChipText, isActive && { color: '#FFF', fontFamily: FONTS.bold }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Main List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#F25C05" />
            <Text style={styles.loadingText}>Fetching active requests...</Text>
          </View>
        ) : filteredRequests.length > 0 ? (
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => fetchRequests(true)}
                colors={['#F25C05']}
              />
            }
          />
        ) : (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="clipboard-alert-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptySubtitle}>Try searching for something else or check other categories.</Text>
            <TouchableOpacity 
              style={styles.createFirstBtn}
              onPress={() => router.push('/community-request')}
            >
              <Text style={styles.createFirstBtnText}>Create New Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

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
                      {getRequestTheme(selectedRequest).label.toUpperCase()}
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
                    <Text style={styles.sheetLocText}>{selectedRequest.location}</Text>
                  </View>
                </View>

                <Text style={styles.sheetDescSectionTitle}>Details / Description</Text>
                <Text style={styles.sheetDesc}>{selectedRequest.description}</Text>

                <View style={styles.requesterCard}>
                  <Ionicons name="person-circle" size={40} color="#E2E8F0" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.sheetRequesterName}>{selectedRequest.user_name || 'Verified Neighbor'}</Text>
                    <Text style={styles.sheetRequesterLabel}>Community Member</Text>
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
                    onPress={() => handleWhatsApp(selectedRequest.contact_number, selectedRequest.title, selectedRequest.id)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5 name="whatsapp" size={22} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.sheetIconButtonSecondary}
                    onPress={() => handleShare(selectedRequest)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social" size={20} color="#475569" />
                  </TouchableOpacity>

                  {selectedRequest.status === 'resolved' ? (
                    <View style={[styles.sheetBtn, { backgroundColor: '#10B981', flex: 1 }]}>
                      <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 14, fontFamily: FONTS.bold, fontWeight: '800' }}>Help Done</Text>
                    </View>
                  ) : selectedRequest.user_id === user?.id ? (
                    <TouchableOpacity 
                      style={[styles.sheetBtn, { backgroundColor: '#F59E0B', flex: 1 }]}
                      onPress={() => handleResolveRequest(selectedRequest.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 14, fontFamily: FONTS.bold, fontWeight: '800' }}>Fulfill Request</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.sheetBtn, { backgroundColor: '#FF8A00', flex: 1 }]}
                      onPress={() => handleWhatsApp(selectedRequest.contact_number, selectedRequest.title, selectedRequest.id)}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="hand-heart" size={22} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 14, fontFamily: FONTS.bold, fontWeight: '800' }}>Offer Help</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  addBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
  },
  headerTitleText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1E293B',
    padding: 0,
  },
  categoryScrollContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  catChipText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#334155',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestContentCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTypeLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  timeAgo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  cardFooter: {
    width: '100%',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  locText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
    flex: 1,
  },
  resolvedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  activeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    flex: 1,
  },
  requesterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requesterMeta: {
    flex: 1,
    marginLeft: 12,
  },
  requesterName: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  requesterRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  requesterTime: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 12,
  },
  viewBtn: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: '#FFF',
  },
  viewBtnText: {
    color: '#6366F1',
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  waBtn: {
    backgroundColor: '#10B981',
  },
  fulfillBtn: {
    backgroundColor: '#F59E0B',
  },
  helpDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  helpDoneBadgeText: {
    color: '#065F46',
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  createFirstBtn: {
    backgroundColor: '#F25C05',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 20,
  },
  createFirstBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '800',
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
  sheetRequesterName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    fontWeight: '700',
  },
  sheetRequesterLabel: {
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconButtonSecondary: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
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
  sheetShareBtn: {
    backgroundColor: '#F1F5F9',
    maxWidth: 70,
  },
  sheetShareBtnText: {
    display: 'none',
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
});
