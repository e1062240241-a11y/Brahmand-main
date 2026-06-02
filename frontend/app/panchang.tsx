import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getPanchang, askAstrologyAI } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design Tokens
const ORANGE = '#FF6B00';
const DARK = '#1A1A1A';
const BROWN = '#5A4136';
const CLAY = '#8E7164';

type TabType = 'panchang' | 'chaughadiya' | 'hora' | 'planets';

export default function PanchangScreen() {
  const router = useRouter();
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

  const getAdvancedPanchang = () => payload?.sources?.advanced_panchang || payload?.sources?.panchang_advanced;
  const getChaughadiyaSource = () => payload?.chaughadiya || payload?.sources?.chaughadiya_muhurta?.chaughadiya;
  const getHoraSource = () => payload?.hora || payload?.sources?.hora_muhurta?.hora;
  const getPlanetsSource = () => payload?.planets || payload?.sources?.planet_panchang;

  const formatTimeValue = (value: any) => {
    if (value == null || value === '') return '';
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (!normalized) return '';
      return normalized.split(':').map((part) => part.trim().padStart(2, '0')).join(':');
    }
    if (typeof value === 'object') {
      const h = String(value.hour ?? value.Hours ?? value.h ?? 0).padStart(2, '0');
      const m = String(value.minute ?? value.Minutes ?? value.m ?? 0).padStart(2, '0');
      return `${h}:${m}`;
    }
    return String(value);
  };

  const renderPanchangTab = () => {
    const advanced = getAdvancedPanchang();
    if (!advanced && !payload?.overview) return <Text style={styles.emptyText}>No data available</Text>;

    const overview = payload?.overview?.length ? payload.overview : [
      { label: 'Tithi', value: advanced?.tithi?.details?.tithi_name, icon: 'moon' },
      { label: 'Nakshatra', value: advanced?.nakshatra?.details?.nak_name, icon: 'star' },
      { label: 'Yoga', value: advanced?.yog?.details?.yog_name, icon: 'planet' },
      { label: 'Karana', value: advanced?.karan?.details?.karan_name, icon: 'planet' },
    ].filter(i => i.value);

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Daily Overview</Text>
        <View style={styles.card}>
          {overview.map((item: any, idx: number) => (
            <View key={idx} style={[styles.infoRow, idx === overview.length - 1 && { borderBottomWidth: 0 }]}> 
              <View style={styles.infoIconBox}>
                <Ionicons name={item.icon || 'moon'} size={18} color={ORANGE} />
              </View>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Sun & Moon Timings</Text>
        <View style={styles.card}>
          {[
            { label: 'Sunrise', value: advanced?.sunrise },
            { label: 'Sunset', value: advanced?.sunset },
            { label: 'Moonrise', value: advanced?.moonrise },
            { label: 'Moonset', value: advanced?.moonset },
          ].filter(i => i.value).map((item, idx, arr) => (
            <View key={idx} style={[styles.infoRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{formatTimeValue(item.value)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderChaughadiyaTab = () => {
    const chaughadiyaSource = getChaughadiyaSource();
    if (!chaughadiyaSource) return <Text style={styles.emptyText}>No data available</Text>;
    
    return (
      <View style={styles.tabContent}>
        {['Day', 'Night'].map((type) => (
          <View key={type}>
            <Text style={styles.sectionTitle}>{type} Muhurtas</Text>
            <View style={styles.card}>
              {chaughadiyaSource[type.toLowerCase()]?.map((m: any, idx: number, arr: any[]) => (
                <View key={idx} style={[styles.muhurtaRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.muhurtaTime}>{m.time}</Text>
                    <Text style={styles.muhurtaName}>{m.muhurta}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: m.is_good ? '#10B98120' : '#EF444420' }]}>
                    <Text style={[styles.badgeText, { color: m.is_good ? '#10B981' : '#EF4444' }]}>
                      {m.is_good ? 'GOOD' : 'AVOID'}
                    </Text>
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
    const horaSource = getHoraSource();
    if (!horaSource) return <Text style={styles.emptyText}>No data available</Text>;
    
    return (
      <View style={styles.tabContent}>
        {['Day', 'Night'].map((type) => (
          <View key={type}>
            <Text style={styles.sectionTitle}>{type} Horas</Text>
            <View style={styles.card}>
              {horaSource[type.toLowerCase()]?.map((h: any, idx: number, arr: any[]) => (
                <View key={idx} style={[styles.muhurtaRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
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
    const planetsSource = getPlanetsSource();
    if (!planetsSource?.length) return <Text style={styles.emptyText}>No data available</Text>;
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Planetary Positions</Text>
        <View style={styles.card}>
          {planetsSource.map((p: any, idx: number, arr: any[]) => (
            <View key={idx} style={[styles.planetRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planetName}>{p.name}</Text>
                {(p.is_retro === 'true' || p.isRetro === 'true' || p.isRetro === true) && (
                  <Text style={styles.retroTag}>RETROGRADE</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planetSign}>{p.sign || p.signName} ({p.sign_lord || p.signLord || ''})</Text>
                <Text style={styles.planetDegree}>{(p.full_degree ?? p.fullDegree ?? 0).toFixed(2)}°</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#F08A5D', '#F6A56F', '#FFEEE5', '#FFFFFF']}
        locations={[0, 0.08, 0.25, 0.4]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#3D1A00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Panchang</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#3D1A00" />
        </TouchableOpacity>
      </View>

      {/* Location Bar */}
      <View style={styles.locationBar}>
        <Ionicons name="location" size={16} color={ORANGE} />
        <Text style={styles.locationText} numberOfLines={1}>{activeLocationLabel}</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['panchang', 'chaughadiya', 'hora', 'planets'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : (
          <>
            {activeTab === 'panchang' && renderPanchangTab()}
            {activeTab === 'chaughadiya' && renderChaughadiyaTab()}
            {activeTab === 'hora' && renderHoraTab()}
            {activeTab === 'planets' && renderPlanetsTab()}

            {/* AI Chat History */}
            {chatMessages.length > 0 && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Astrology Insights</Text>
                {chatMessages.map((m, i) => (
                  <View key={i} style={styles.aiCard}>
                    <Text style={styles.aiQ}>Q: {m.question}</Text>
                    <Text style={styles.aiA}>{m.answer}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky AI Input */}
      <View style={[styles.aiInputWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.aiInputBox}>
          <TextInput
            style={styles.aiInput}
            placeholder="Ask AI about today's muhurta..."
            placeholderTextColor="#A09090"
            value={question}
            onChangeText={setQuestion}
          />
          <TouchableOpacity style={styles.aiSendBtn} onPress={submitQuestion} disabled={chatLoading}>
            {chatLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="sparkles" size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: '#3D1A00',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  locationBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  locationText: { flex: 1, fontSize: 13, color: DARK, fontWeight: '600', marginLeft: 8 },
  dateText: { fontSize: 13, color: CLAY, fontWeight: '500' },
  
  tabContainer: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10,
  },
  tabItem: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: ORANGE },
  tabText: { fontSize: 14, fontWeight: '600', color: CLAY },
  tabTextActive: { color: ORANGE },

  tabContent: { paddingHorizontal: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 12, marginTop: 10 },
  
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(226, 191, 176, 0.20)', marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  infoIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { flex: 1, fontSize: 14, color: CLAY, fontWeight: '500' },
  infoValue: { fontSize: 14, color: DARK, fontWeight: '700' },
  
  muhurtaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  muhurtaTime: { fontSize: 12, color: CLAY, marginBottom: 4 },
  muhurtaName: { fontSize: 15, fontWeight: '700', color: DARK },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  planetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  planetName: { fontSize: 15, fontWeight: '700', color: DARK },
  retroTag: { fontSize: 10, color: '#EF4444', fontWeight: '700', marginTop: 4 },
  planetSign: { fontSize: 14, fontWeight: '600', color: DARK },
  planetDegree: { fontSize: 12, color: CLAY, marginTop: 2 },

  loader: { marginTop: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: CLAY, marginTop: 40, fontSize: 15 },
  
  aiCard: { backgroundColor: '#FFFAF7', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFE4D6' },
  aiQ: { fontSize: 14, fontWeight: '700', color: ORANGE, marginBottom: 6 },
  aiA: { fontSize: 14, color: BROWN, lineHeight: 22 },

  aiInputWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0E8E0',
    paddingHorizontal: 20, paddingTop: 12,
  },
  aiInputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F5F2', borderRadius: 24, paddingHorizontal: 16, height: 48,
  },
  aiInput: { flex: 1, fontSize: 14, color: DARK },
  aiSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center' },
});
