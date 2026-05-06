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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { askAstrologyAI, getNakshatraReport } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AstrologyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ question: string; answer: string }[]>([]);
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

  const submitQuestion = async () => {
    if (!question.trim() || chatLoading) return;
    const q = question.trim();
    setChatLoading(true);
    try {
      const response = await askAstrologyAI({
        question: q,
        astrology: { kind: 'kundli', payload: data },
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

  const InfoCard = ({ label, value, icon, color = COLORS.primary }: any) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconBg, { backgroundColor: `${color}10` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Mapping your cosmic stars...</Text>
      </View>
    );
  }

  const details = data?.details || {};
  const report = data?.report || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Janam Kundli</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* User Summary Header */}
        <LinearGradient colors={['#FFF9F2', '#FFFFFF']} style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <View style={styles.zodiacCircle}>
              <Text style={styles.zodiacOm}>ॐ</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.userName}>{user?.name || 'Devotee'}</Text>
              <Text style={styles.userSub}>{user?.date_of_birth} • {user?.time_of_birth}</Text>
            </View>
          </View>
          
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.mainInsights}>
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>Nakshatra</Text>
                <Text style={styles.insightValue}>{details.Naksahtra}</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>Rashi</Text>
                <Text style={styles.insightValue}>{details.sign}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Detailed Attributes Grid */}
        {!error && details && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spiritual Attributes (Ashtakoot)</Text>
            <View style={styles.grid}>
              <InfoCard label="Nakshatra Lord" value={details.NaksahtraLord} icon="sunny" color="#F59E0B" />
              <InfoCard label="Rashi Lord" value={details.SignLord} icon="planet" color="#6366F1" />
              <InfoCard label="Charan" value={details.Charan} icon="footsteps" color="#10B981" />
              <InfoCard label="Gan" value={details.Gan} icon="people" color="#8B5CF6" />
              <InfoCard label="Yoni" value={details.Yoni} icon="heart" color="#EC4899" />
              <InfoCard label="Nadi" value={details.Nadi} icon="pulse" color="#EF4444" />
              <InfoCard label="Varna" value={details.Varna} icon="ribbon" color="#3B82F6" />
              <InfoCard label="Vashya" value={details.Vashya} icon="leaf" color="#14B8A6" />
            </View>
          </View>
        )}

        {/* Report Sections */}
        {!error && report && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cosmic Analysis</Text>
            {Object.entries(report).map(([key, paragraphs]: any) => (
              <View key={key} style={styles.reportCard}>
                <Text style={styles.reportCategory}>{key.toUpperCase()}</Text>
                {paragraphs.map((p: string, idx: number) => (
                  <Text key={idx} style={styles.reportText}>{p}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* AI Consultation Section */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            <Text style={styles.aiTitle}>Consult Birth Chart AI</Text>
          </View>
        <View style={styles.aiInputRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="chatbubble-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ask about your destiny..."
                placeholderTextColor="#9CA3AF"
                value={question}
                onChangeText={setQuestion}
                multiline
              />
            </View>
            <TouchableOpacity 
              style={[styles.sendBtn, chatLoading && { opacity: 0.7 }]} 
              onPress={submitQuestion}
              disabled={chatLoading}
            >
              {chatLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          {chatMessages.map((msg, idx) => (
            <View key={idx} style={styles.messageCard}>
              <Text style={styles.msgQuestion}>Q: {msg.question}</Text>
              <Text style={styles.msgAnswer}>{msg.answer}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  content: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  heroSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  zodiacCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  zodiacOm: { fontSize: 24, color: '#D97706' },
  heroText: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  userSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  mainInsights: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightBox: { flex: 1, alignItems: 'center' },
  insightLabel: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  insightDivider: { width: 1, height: '100%', backgroundColor: '#F3F4F6', marginHorizontal: 10 },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCard: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - 12) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 1 },
  reportCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  reportCategory: { fontSize: 12, fontWeight: '800', color: COLORS.primary, marginBottom: 8, letterSpacing: 1 },
  reportText: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 8 },
  aiSection: { padding: SPACING.md, backgroundColor: '#FDF2F2' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: '#991B1B' },
  aiInputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: { marginTop: 4, marginRight: 8 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingTop: 0,
    minHeight: 40,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  messageCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginTop: 15, borderWidth: 1, borderColor: '#FEE2E2' },
  msgQuestion: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 6 },
  msgAnswer: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, gap: 8 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
});
