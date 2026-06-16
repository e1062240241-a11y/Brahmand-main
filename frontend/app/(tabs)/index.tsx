import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../../src/utils/dateUtils';
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { 
  SafeAreaView, 
  useSafeAreaInsets 
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCommunities, createCommunityRequest, getCommunityRequests, parseApiError } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { RequestFormModal } from '../../src/components/RequestFormModal';

const TABS = ['Chat', 'Help', 'Blood', 'Medical', 'Financial', 'Petition'];

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
  user_name?: string;
  user?: { name?: string; photo?: string; is_verified?: boolean };
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
}

export default function CommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState('Chat');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'Help' | 'Blood' | 'Medical' | 'Financial' | 'Petition'>('Help');
  
  // Cultural Community state
  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'Chat') {
        // Fetch communities list
        const res = await getCommunities();
        setCommunities(res.data || []);
        setRequests([]);
      } else {
        // Fetch community requests for this tab type
        const requestTypeMap: Record<string, string> = {
          'Help': 'help',
          'Blood': 'blood',
          'Medical': 'medical',
          'Financial': 'financial',
          'Petition': 'petition'
        };
        const response = await getCommunityRequests({
          type: requestTypeMap[activeTab],
          limit: 50
        });
        setRequests(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setErrorMessage(parseApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!userId) {
      router.replace('/');
      return;
    }
    fetchData();
  }, [fetchData, router, userId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'Chat') {
      setRequestType(tab as any);
    }
  };

  const handleAddRequest = () => {
    if (activeTab === 'Chat') {
      Alert.alert('Select a request type', 'Please select a specific request tab (Blood / Medical / Petition / Financial) to create a request.');
      return;
    }
    setRequestType(activeTab as any);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (data: any) => {
    try {
      console.log('Submitting community request:', data);
      
      // Ensure minimum length requirements
      const title = data.title || `${data.request_type} Request`;
      const description = data.description || 'Request created from community tab';
      
      // Create community request via API
      await createCommunityRequest({
        request_type: data.request_type,
        visibility_level: data.visibility_level || 'area',
        title: title.length >= 2 ? title : `${data.request_type} Request`,
        description: description.length >= 10 ? description : description.padEnd(10, '.'),
        contact_number: data.contact_number,
        urgency_level: data.urgency_level || 'low',
        blood_group: data.blood_group,
        hospital_name: data.hospital_name,
        location: data.location,
        amount: data.amount,
        support_needed: data.support_needed,
        contact_person_name: data.contact_person_name,
      });
      
      Alert.alert('Success', 'Your request has been posted!');
      fetchData();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', parseApiError(error));
      throw error;
    }
  };

  const getCommunityIcon = (type: string) => {
    switch (type) {
      case 'city': return 'location';
      case 'state': return 'map';
      case 'country': return 'flag';
      default: return 'people';
    }
  };

  const getCommunityColor = (type: string) => {
    switch (type) {
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
    return formatDateIST(date);
  };


  // ⚡ Bolt: Wrapped in useCallback to prevent recreation on every render,
  // reducing unnecessary FlatList re-renders.
  const renderCommunity = useCallback(({ item }: { item: Community }) => (
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
          <Text style={styles.communityStats}>{(item.member_count || (item as any).members_count || 0)} members</Text>
        </View>
        {item.is_default && (
          <Ionicons name="lock-closed" size={14} color={COLORS.textLight} style={{ marginRight: 8 }} />
        )}
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  ), [router]);

  // ⚡ Bolt: Wrapped in useCallback to keep render function stable across
  // component re-renders, optimizing FlatList rendering performance.
  const renderRequest = useCallback(({ item }: { item: CommunityRequest }) => {
    const ownerName = item.user_name || item.user?.name || 'Requester';
    const requestTypeLabel = item.request_type ? String(item.request_type).toUpperCase() : 'REQUEST';

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestOwnerRow}>
          <Avatar name={ownerName} photo={item.user?.photo} size={34} />
          <View style={styles.requestOwnerMeta}>
            <Text style={styles.requestOwnerSubtext} numberOfLines={1}>{requestTypeLabel}</Text>
          </View>
          <Text style={styles.requestOwnerTime}>{formatDate(item.created_at)}</Text>
        </View>

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
          <View style={styles.activeStatus}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>
    </View>
  );
}, []);

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.09, 0.25]}
      style={styles.container}
    >
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
        {activeTab !== 'Chat' && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddRequest}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Content */}
      {activeTab === 'Chat' ? (
        <>
          {/* Community List */}
          <FlatList
            data={communities}
            renderItem={renderCommunity}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No communities yet</Text>
                <Text style={styles.emptySubtext}>Set up your location to join communities</Text>
              </View>
            }
          />
        </>
      ) : (
        // Request List
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} requests yet</Text>
              <Text style={styles.emptySubtext}>Be the first to create a request</Text>
              <TouchableOpacity 
                style={styles.createRequestBtn}
                onPress={handleAddRequest}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.createRequestBtnText}>Create {activeTab} Request</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Request Form Modal */}
      <RequestFormModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        requestType={requestType}
        communities={communities}
        onSubmit={handleSubmitRequest}
      />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  // Request card styles
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
  requestOwnerTime: {
    fontSize: 12,
    color: COLORS.textLight,
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
  requestOwnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  requestOwnerMeta: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  requestOwnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  requestOwnerSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  errorBanner: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C2C7',
    borderWidth: 1,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  errorBannerText: {
    color: '#842029',
    fontSize: 13,
    textAlign: 'center',
  },
  // Cultural Community Styles
  cgSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  cgSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  cgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  cgIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cgContent: {
    flex: 1,
  },
  cgTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cgSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  lockedText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: SPACING.xs,
  },
  currentCGBanner: {
    backgroundColor: `${COLORS.primary}15`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  currentCGText: {
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
  },
  cgCreateButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  cgCreateButtonText: {
    fontWeight: '700',
    color: COLORS.background,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cgList: {
    maxHeight: 400,
  },
  cgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  cgItemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  cgItemText: {
    fontSize: 15,
    color: COLORS.text,
  },
  cgItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
