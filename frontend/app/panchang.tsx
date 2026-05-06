import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getPanchang, askAstrologyAI, reverseGeocode, forwardGeocode } from '../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import LocationService from '../src/services/location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'panchang' | 'chaughadiya' | 'hora' | 'planets';

export default function PanchangScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; needsLocation?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const userLocation = (user as any)?.home_location;
  
  const initialLocationLabel = [
    (user as any)?.location?.area,
    (user as any)?.location?.city,
    (user as any)?.location?.state,
  ].filter(Boolean).join(', ') || 'Current location unavailable';

  const [activeTab, setActiveTab] = useState<TabType>('panchang');
  const [activeCoords, setActiveCoords] = useState<{ lat?: number; lng?: number }>({
    lat: userLocation?.latitude,
    lng: userLocation?.longitude,
  });
  const [activeLocationLabel, setActiveLocationLabel] = useState(initialLocationLabel);
  const [locationLoading, setLocationLoading] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ question: string; answer: string }[]>([]);

  const isMountedRef = useRef(true);

  const fetchPanchang = useCallback(async (lat?: number, lng?: number, forceRefresh = false) => {
    try {
      if (!isMountedRef.current) return;
      setLoading(!forceRefresh);
      setError('');
      
      const response = await getPanchang();
      if (isMountedRef.current) {
        setPayload(response.data);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load Panchang');
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
    fetchPanchang();
    return () => { isMountedRef.current = false; };
  }, [fetchPanchang]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPanchang(activeCoords.lat, activeCoords.lng, true);
  };

  const submitQuestion = async () => {
    if (!question.trim() || chatLoading) return;
    const q = question.trim();
    setChatLoading(true);
    try {
      const response = await askAstrologyAI({
        question: q,
        astrology: { kind: 'panchang', payload },
      });
      if (isMountedRef.current) {
        setChatMessages(prev => [{ question: q, answer: response.data?.answer || 'No guidance available.' }, ...prev]);
        setQuestion('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMountedRef.current) setChatLoading(false);
    }
  };

  const renderPanchangTab = () => {
    if (!payload?.overview) return null;
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sunny" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Daily Overview</Text>
        </View>
        <View style={styles.card}>
          {payload.overview.map((item: any, idx: number) => (
            <View key={idx} style={[styles.infoRow, idx === payload.overview.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.infoIcon, { backgroundColor: `${COLORS.primary}10` }]}>
                <Ionicons 
                  name={item.label === 'Tithi' ? 'moon' : item.label === 'Nakshatra' ? 'star' : 'planet'} 
                  size={16} color={COLORS.primary} 
                />
              </View>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Sun & Moon Timings</Text>
        </View>
        <View style={styles.card}>
          {(payload.timings || []).map((item: any, idx: number) => (
            <View key={idx} style={[styles.infoRow, idx === payload.timings.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderChaughadiyaTab = () => {
    if (!payload?.chaughadiya) return null;
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Chaughadiya Muhurta</Text>
        </View>
        
        {['Day', 'Night'].map((type) => (
          <View key={type}>
            <Text style={styles.subSectionTitle}>{type} Muhurtas</Text>
            <View style={styles.card}>
              {payload.chaughadiya[type.toLowerCase()]?.map((m: any, idx: number) => (
                <View key={idx} style={styles.muhurtaRow}>
                  <View style={styles.muhurtaTimeContainer}>
                    <Text style={styles.muhurtaTime}>{m.time}</Text>
                    <Text style={styles.muhurtaName}>{m.muhurta}</Text>
                  </View>
                  <View style={styles.muhurtaValueContainer}>
                    <View style={{ backgroundColor: m.is_good ? '#10B98120' : '#EF444420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ color: m.is_good ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: '700' }}>
                        {m.muhurta === 'Amrit' || m.muhurta === 'Shubh' || m.muhurta === 'Labh' ? 'VERY GOOD' : m.muhurta === 'Chal' ? 'NEUTRAL' : 'AVOID'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderHoraTab = () => {
    if (!payload?.hora) return null;
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hourglass" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Hora Muhurta</Text>
        </View>
        {['Day', 'Night'].map((type) => (
          <View key={type}>
            <Text style={styles.subSectionTitle}>{type} Horas</Text>
            <View style={styles.card}>
              {payload.hora[type.toLowerCase()]?.map((h: any, idx: number) => (
                <View key={idx} style={styles.muhurtaRow}>
                  <View style={styles.muhurtaTimeContainer}>
                    <Text style={styles.muhurtaTime}>{h.time}</Text>
                    <Text style={styles.muhurtaName}>{h.hora} Hora</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPlanetsTab = () => {
    if (!payload?.planets) return null;
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="planet" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Planetary Positions</Text>
        </View>
        <View style={styles.card}>
          {payload.planets.map((p: any, idx: number) => (
            <View key={idx} style={styles.planetRow}>
              <View style={styles.planetInfo}>
                <Text style={styles.planetName}>{p.name}</Text>
                {p.is_retro === 'true' && <Text style={styles.retroTag}>RETROGRADE</Text>}
              </View>
              <View style={styles.planetDetails}>
                <Text style={styles.planetSign}>{p.sign} ({p.sign_lord})</Text>
                <Text style={styles.planetDegree}>{p.full_degree.toFixed(2)}°</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Connecting to Astrology API...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panchang & Muhurta</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <Text style={styles.locationText} numberOfLines={1}>{activeLocationLabel}</Text>
        </View>
        <Text style={styles.dateText}>{new Date().toDateString()}</Text>
      </View>

      <View style={styles.tabBar}>
        {(['panchang', 'chaughadiya', 'hora', 'planets'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'panchang' && renderPanchangTab()}
        {activeTab === 'chaughadiya' && renderChaughadiyaTab()}
        {activeTab === 'hora' && renderHoraTab()}
        {activeTab === 'planets' && renderPlanetsTab()}

        {/* AI Chat History */}
        {chatMessages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Consultations</Text>
            {chatMessages.map((m, i) => (
              <View key={i} style={styles.aiMessageCard}>
                <Text style={styles.userQuestion}>Q: {m.question}</Text>
                <Text style={styles.aiAnswer}>{m.answer}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky AI Input */}
      <View style={[styles.stickyComposerWrap, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        <View style={styles.askRow}>
          <TextInput
            style={styles.questionInput}
            placeholder="Ask anything about today..."
            placeholderTextColor={COLORS.textLight}
            value={question}
            onChangeText={setQuestion}
          />
          <TouchableOpacity style={styles.askButton} onPress={submitQuestion} disabled={chatLoading}>
            {chatLoading ? <ActivityIndicator size="small" color={COLORS.surface} /> : <Ionicons name="send" size={20} color={COLORS.surface} />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  locationHeader: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: '#FFF9F2', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', flex: 1 },
  dateText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  activeTabLabel: { color: COLORS.primary },
  scrollView: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  tabContent: { padding: SPACING.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  subSectionTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { flex: 1, color: '#6B7280', fontSize: 13 },
  infoValue: { flex: 1, textAlign: 'right', color: '#111827', fontSize: 13, fontWeight: '600' },
  muhurtaRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  muhurtaTimeContainer: { flex: 2 },
  muhurtaValueContainer: { flex: 1, alignItems: 'flex-end' },
  muhurtaTime: { fontSize: 12, color: '#6B7280' },
  muhurtaName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  planetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  planetInfo: { flex: 1 },
  planetName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  retroTag: { fontSize: 10, color: '#EF4444', fontWeight: '700', marginTop: 2 },
  planetDetails: { flex: 2, alignItems: 'flex-end' },
  planetSign: { fontSize: 13, color: '#111827', fontWeight: '600' },
  planetDegree: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  aiMessageCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  userQuestion: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  aiAnswer: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  stickyComposerWrap: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  askRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  questionInput: { flex: 1, height: 44, backgroundColor: '#F9FAFB', borderRadius: 22, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  askButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: SPACING.md, marginTop: 10 },
});
