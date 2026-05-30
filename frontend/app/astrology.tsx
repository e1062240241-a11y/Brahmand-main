import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getNakshatraReport } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cosmic Analysis tab config
const COSMIC_TABS = [
  { key: 'physical', label: 'Physical', img: require('../assets/images/festival image/cosmic/cos1.png') },
  { key: 'character', label: 'Character', img: require('../assets/images/festival image/cosmic/cos2.png') },
  { key: 'education', label: 'Education', img: require('../assets/images/festival image/cosmic/cos3.png') },
  { key: 'family', label: 'Family', img: require('../assets/images/festival image/cosmic/cos4.png') },
  { key: 'health', label: 'Health', img: require('../assets/images/festival image/cosmic/cos5.png') },
];

export default function AstrologyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [activeCosmicTab, setActiveCosmicTab] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchKundli = useCallback(async (forceRefresh = false) => {
    try {
      if (!isMountedRef.current) return;
      setError('');
      setLoading(!forceRefresh);
      
      const response = await getNakshatraReport();
      if (isMountedRef.current) {
        setData(response.data || null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load Kundli report');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchKundli();
    return () => { isMountedRef.current = false; };
  }, [fetchKundli]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchKundli(true);
  };


  const normalizeTextBlock = (value: any) => {
    const text = Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean).join(' ')
      : String(value ?? '');
    return text.replace(/\s+/g, ' ').trim();
  };

  if (loading) {
    return (
      <LinearGradient 
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']} 
        locations={[0, 0.0913, 0.25]} 
        style={styles.loaderContainer}
      >
        <ActivityIndicator size="large" color="#C67C4E" />
        <Text style={styles.loaderText}>Mapping your cosmic stars...</Text>
      </LinearGradient>
    );
  }

  const details = data?.details || {};
  const report = data?.report || {};

  // Attribute grid items matching the Figma design
  const attributes = [
    { label: 'NAKSHATRA LORD', value: details.NaksahtraLord, img: require('../assets/images/iconattributes/Icon1.png'), color: '#F59E0B' },
    { label: 'RASHI LORD', value: details.SignLord, img: require('../assets/images/iconattributes/Icon2.png'), color: '#C67C4E' },
    { label: 'CHARAN', value: details.Charan, img: require('../assets/images/iconattributes/Icon3.png'), color: '#10B981' },
    { label: 'GAN', value: details.Gan, img: require('../assets/images/iconattributes/Icon4.png'), color: '#8B5CF6' },
    { label: 'YONI', value: details.Yoni, img: require('../assets/images/iconattributes/Icon5.png'), color: '#EC4899' },
    { label: 'NADI', value: details.Nadi, img: require('../assets/images/iconattributes/Icon6.png'), color: '#EF4444' },
    { label: 'VARNA', value: details.Varna, img: require('../assets/images/iconattributes/Icon7.png'), color: '#3B82F6' },
    { label: 'VASHYA', value: details.Vashya, img: require('../assets/images/iconattributes/Icon8.png'), color: '#C67C4E' },
  ];

  return (
    <LinearGradient 
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']} 
      locations={[0, 0.0913, 0.25]} 
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#5A3E2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Janam Kundli</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C67C4E" />}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {user?.profile_image ? (
                <Image source={{ uri: user.profile_image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={28} color="#C67C4E" />
                </View>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{user?.name || 'Devotee'}</Text>
              <View style={styles.profileStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.profileStatus}>Celestial Profile Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nakshatra & Rashi Card */}
        {!error && (
          <View style={styles.insightsCard}>
            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>NAKSHATRA</Text>
              <Text style={styles.insightValue}>{details.Naksahtra || '-'}</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>RASHI</Text>
              <Text style={styles.insightValue}>{details.sign || '-'}</Text>
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Spiritual Attributes */}
        {!error && details && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spiritual Attributes (Ashtakoot)</Text>
            <View style={styles.grid}>
              {attributes.map((attr, i) => (
                <View key={i} style={styles.attrCard}>
                  <View style={styles.attrIconBg}>  
                    <Image source={attr.img} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  </View>
                  <View style={styles.attrTextCol}>
                    <Text style={styles.attrLabel}>{attr.label}</Text>
                    <Text style={styles.attrValue}>{attr.value || '-'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cosmic Analysis */}
        {!error && report && Object.keys(report).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cosmic Analysis</Text>
            
            {/* Tab Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cosmicTabScroll} contentContainerStyle={styles.cosmicTabRow}>
              {COSMIC_TABS.map((tab) => {
                const isActive = activeCosmicTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.cosmicTab, isActive && styles.cosmicTabActive]}
                    onPress={() => setActiveCosmicTab(tab.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.cosmicTabIcon, isActive && styles.cosmicTabIconActive]}>
                      <Image source={tab.img} style={{ width: 36, height: 36, aspectRatio: 1, tintColor: isActive ? '#FFF' : undefined }} resizeMode="contain" />
                    </View>
                    <Text style={[styles.cosmicTabLabel, isActive && styles.cosmicTabLabelActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Report Content Modal */}
            <Modal
              visible={!!activeCosmicTab}
              transparent
              animationType="fade"
              onRequestClose={() => setActiveCosmicTab(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  {(() => {
                    const activeTabObj = COSMIC_TABS.find(t => t.key === activeCosmicTab);
                    if (!activeTabObj) return null;
                    
                    let activeReportText = '';
                    for (const [key, paragraphs] of Object.entries(report)) {
                      if (key.toLowerCase().includes(activeCosmicTab as string)) {
                        activeReportText = normalizeTextBlock(paragraphs);
                        break;
                      }
                    }

                    return (
                      <>
                        <View style={styles.modalIconWrap}>
                          <Image source={activeTabObj.img} style={{ width: 32, height: 32, tintColor: '#FFF' }} resizeMode="contain" />
                        </View>
                        <Text style={styles.modalTitle}>{activeTabObj.label} Summary</Text>
                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                          <Text style={styles.modalDesc}>{activeReportText || 'No summary available.'}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveCosmicTab(null)} activeOpacity={0.8}>
                          <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </View>
              </View>
            </Modal>
          </View>
        )}



        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    color: '#5C2A01',
    fontFamily: 'System',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
  },
  content: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#8D6E63', fontSize: 14 },

  // Profile
  profileSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2.5, borderColor: '#C67C4E',
    overflow: 'hidden', marginRight: 14,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: '#FCEADE', justifyContent: 'center', alignItems: 'center' },
  profileText: { flex: 1 },
  profileName: { 
    color: '#311303',
    fontFamily: 'System',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0.6,
    textTransform: 'capitalize',
  },
  profileStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#584235', marginRight: 6 },
  profileStatus: { fontSize: 16, color: '#584235', fontWeight: '400', lineHeight: 24, fontStyle: 'normal' },

  // Insights Card
  insightsCard: {
    flexDirection: 'row',
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1, borderColor: '#F0E0D0',
    shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  insightBox: { flex: 1, alignItems: 'center' },
  insightLabel: { fontSize: 12, color: '#584235', fontWeight: '700', lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', fontStyle: 'normal' },
  insightValue: { fontSize: 18, fontWeight: '600', color: '#994700', marginTop: 4, lineHeight: 24, textAlign: 'center', fontStyle: 'normal' },
  insightDivider: { width: 1, backgroundColor: '#F0E0D0' },

  // Section
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { 
    color: '#311303',
    fontFamily: 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
  },

  // Attribute Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  attrCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: '#F0E0D0',
    shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  attrIconBg: {
    width: 40, height: 40, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    backgroundColor: '#FFEAE0',
  },
  attrTextCol: { flex: 1 },
  attrLabel: { fontSize: 10, color: '#584235', fontWeight: '700', lineHeight: 12, textTransform: 'uppercase', fontStyle: 'normal' },
  attrValue: { fontSize: 16, color: '#311303', fontWeight: '700', lineHeight: 24, fontStyle: 'normal', marginTop: 2 },

  // Cosmic Tabs
  cosmicTabScroll: { marginBottom: 16 },
  cosmicTabRow: { gap: 12 },
  cosmicTab: { alignItems: 'center', width: 64 },
  cosmicTabActive: {},
  cosmicTabIcon: {
    width: 56, height: 56, borderRadius: 40,
    backgroundColor: '#FF7B00',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#F0D5B8',
  },
  cosmicTabIconActive: {
    backgroundColor: '#FF7B00',
    borderColor: '#FF7B00',
  },
  cosmicTabLabel: { fontSize: 12, fontWeight: '700', color: '#994700', marginTop: 6, textAlign: 'center', fontStyle: 'normal', lineHeight: 16, letterSpacing: 1.2, textTransform: 'capitalize' },
  cosmicTabLabelActive: { color: '#C67C4E' },

  // Report
  reportCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F0E0D0',
  },
  reportCategory: { fontSize: 11, fontWeight: '800', color: '#C67C4E', marginBottom: 8, letterSpacing: 1 },
  reportText: { fontSize: 14, color: '#5D4037', lineHeight: 22 },



  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, gap: 8, marginHorizontal: 20, marginTop: 16 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600', flex: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FF7B00',
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 250,
    width: '100%',
    marginBottom: 24,
  },
  modalDesc: {
    color: '#311303',
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
  },
  modalCloseBtn: {
    width: 302,
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
