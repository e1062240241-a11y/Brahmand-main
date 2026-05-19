import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getCommunityRequests } from '../../src/services/api';

const { width } = Dimensions.get('window');

interface CommunityRequest {
  id: string;
  title: string;
  description: string;
  request_type: string;
  contact_number: string;
  urgency_level: string;
  status: string;
  created_at: string;
  location: string;
  user_name?: string;
  support_needed?: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All Requests', icon: 'apps', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'blood', name: 'Blood Requests', icon: 'water', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'emergency', name: 'Emergency', icon: 'alert-circle', color: '#F97316', bg: '#FFF7ED' },
  { id: 'food', name: 'Food / Grocery', icon: 'basket', color: '#F25C05', bg: '#FFF4EE' },
  { id: 'gau', name: 'Gau Seva / Animal', icon: 'cow', color: '#10B981', bg: '#ECFDF5' },
  { id: 'temple', name: 'Temple Support', icon: 'home', color: '#D97706', bg: '#FEF3C7' },
  { id: 'other', name: 'Others', icon: 'help-circle', color: '#6B7280', bg: '#F9FAFB' },
];

export default function ActiveRequestsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);

  // Mock fallbacks exactly matching the design
  const mockRequests: CommunityRequest[] = [
    { id: 'mock_1', title: 'O+ Blood Required urgently for operation', request_type: 'blood', description: 'Patient is admitted at Lifeline Hospital in ICU. Need 2 units of O+ blood as soon as possible. Any help would be highly appreciated.', contact_number: '+919876543210', urgency_level: 'critical', created_at: new Date(Date.now() - 10 * 60000).toISOString(), status: 'active', location: 'Andheri West, Mumbai', user_name: 'Rahul Joshi' },
    { id: 'mock_2', title: 'Baby Food Required for twins', request_type: 'food', description: 'Requiring starter formulas and baby foods for 6-month-old twin babies. Family in financial distress.', contact_number: '+919988776655', urgency_level: 'high', created_at: new Date(Date.now() - 60 * 60000).toISOString(), status: 'active', location: 'Bandra West, Mumbai', user_name: 'Priya Sharma' },
    { id: 'mock_3', title: 'Elderly Care Support needed this weekend', request_type: 'care', description: 'Looking for a volunteer who can spend 2 hours with an elderly uncle on Sunday, help him go to temple and get groceries.', contact_number: '+918877665544', urgency_level: 'medium', created_at: new Date(Date.now() - 120 * 60000).toISOString(), status: 'active', location: 'Powai, Mumbai', user_name: 'Amit Patel' },
    { id: 'mock_4', title: 'Cow Seva - Straw & Fodder distribution help', request_type: 'gau', description: 'Volunteers required to distribute fodder and help clean cowsheds at our local Gaushala tomorrow morning.', contact_number: '+917766554433', urgency_level: 'low', created_at: new Date(Date.now() - 180 * 60000).toISOString(), status: 'active', location: 'Gau-shala, Ghatkopar', user_name: 'Gaurav Das' },
    { id: 'mock_5', title: 'Accident Emergency - Medicine assistance', request_type: 'emergency', description: 'Emergency medication needs to be collected and delivered to Saint Mary ICU. Immediate assistance required.', contact_number: '+919654321987', urgency_level: 'critical', created_at: new Date(Date.now() - 15 * 60000).toISOString(), status: 'active', location: 'Santacruz East, Mumbai', user_name: 'Vikram Malhotra' },
    { id: 'mock_6', title: 'Temple cleanup and Bhandara volunteers', request_type: 'temple', description: 'Need 5 volunteers to clean the Shiva temple premises and serve food during the Saturday Bhandara.', contact_number: '+919123456789', urgency_level: 'low', created_at: new Date(Date.now() - 300 * 60000).toISOString(), status: 'active', location: 'Shiva Mandir, Borivali', user_name: 'Suresh Mehta' }
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getCommunityRequests({ status: 'active', limit: 50 });
      const apiRequests = res.data || [];
      
      // Merge Mock requests to ensure there is high-fidelity content even if DB is empty
      const combined = [...apiRequests, ...mockRequests];
      
      // Deduplicate by ID
      const uniqueRequests = combined.filter(
        (v, i, a) => a.findIndex(t => t.id === v.id) === i
      );
      
      setRequests(uniqueRequests);
    } catch (error) {
      console.log('Failed to fetch community requests:', error);
      setRequests(mockRequests);
    } finally {
      setLoading(false);
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
      const diff = Date.now() - new Date(dateStr).getTime();
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
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleWhatsApp = (number: string, title: string) => {
    if (!number) return;
    const formatted = number.replace(/\D/g, ''); // Official WhatsApp format must exclude '+' and other non-digits
    const text = encodeURIComponent(`Hare Krishna! I saw your community request "${title}" on Brahmand App and would like to extend my help.`);
    Linking.openURL(`https://wa.me/${formatted}?text=${text}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp');
    });
  };

  const handleShare = async (request: CommunityRequest) => {
    try {
      await Share.share({
        title: request.title,
        message: `📢 *Brahmand Community Request*\n\n*${request.title}*\n📍 Location: ${request.location}\n⚠️ Urgency: ${request.urgency_level.toUpperCase()}\n\n💬 Description:\n"${request.description}"\n\n📞 Contact number: ${request.contact_number}\n\nJoin Brahmand App to support your neighbors and help our community grow.`,
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

    return (
      <TouchableOpacity
        style={[styles.requestCard, { borderColor: theme.border }]}
        activeOpacity={0.9}
        onPress={() => setSelectedRequest(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.iconColor + '15' }]}>
            <MaterialCommunityIcons name={theme.icon as any} size={22} color={theme.iconColor} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.cardTypeLabel, { color: theme.iconColor }]}>{theme.label}</Text>
            <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg, borderColor: urgency.border }]}>
            <Text style={[styles.urgencyText, { color: urgency.text }]}>{item.urgency_level.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.locText} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.callBtn]} 
              onPress={() => handleCall(item.contact_number)}
            >
              <Ionicons name="call" size={14} color="#FFF" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.waBtn]}
              onPress={() => handleWhatsApp(item.contact_number, item.title)}
            >
              <FontAwesome5 name="whatsapp" size={14} color="#FFF" />
              <Text style={styles.actionBtnText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)/messages')}
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
                  <Text style={styles.requesterName}>{selectedRequest.user_name || 'Verified Neighbor'}</Text>
                  <Text style={styles.requesterLabel}>Community Member</Text>
                </View>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity 
                  style={[styles.sheetBtn, styles.sheetShareBtn]}
                  onPress={() => handleShare(selectedRequest)}
                >
                  <Ionicons name="share-social" size={20} color="#475569" />
                  <Text style={styles.sheetShareBtnText}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.sheetBtn, styles.sheetCallBtn]}
                  onPress={() => handleCall(selectedRequest.contact_number)}
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                  <Text style={styles.sheetCallBtnText}>Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sheetBtn, styles.sheetWhatsAppBtn]}
                  onPress={() => handleWhatsApp(selectedRequest.contact_number, selectedRequest.title)}
                >
                  <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                  <Text style={styles.sheetWhatsAppBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  callBtn: {
    backgroundColor: '#6366F1',
  },
  waBtn: {
    backgroundColor: '#10B981',
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
  requesterName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1E293B',
    fontWeight: '700',
  },
  requesterLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
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
