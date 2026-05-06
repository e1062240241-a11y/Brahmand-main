import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getDailyHoroscope, askAstrologyAI } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Aries', hindi: 'Mesh', icon: '♈' },
  { id: 'taurus', name: 'Taurus', hindi: 'Vrishabh', icon: '♉' },
  { id: 'gemini', name: 'Gemini', hindi: 'Mithun', icon: '♊' },
  { id: 'cancer', name: 'Cancer', hindi: 'Kark', icon: '♋' },
  { id: 'leo', name: 'Leo', hindi: 'Simha', icon: '♌' },
  { id: 'virgo', name: 'Virgo', hindi: 'Kanya', icon: '♍' },
  { id: 'libra', name: 'Libra', hindi: 'Tula', icon: '♎' },
  { id: 'scorpio', name: 'Scorpio', hindi: 'Vrishchik', icon: '♏' },
  { id: 'sagittarius', name: 'Sagittarius', hindi: 'Dhanu', icon: '♐' },
  { id: 'capricorn', name: 'Capricorn', hindi: 'Makar', icon: '♑' },
  { id: 'aquarius', name: 'Aquarius', hindi: 'Kumbh', icon: '♒' },
  { id: 'pisces', name: 'Pisces', hindi: 'Meen', icon: '♓' },
];

export default function HoroscopeScreen() {
  const router = useRouter();
  const [selectedZodiac, setSelectedZodiac] = useState(ZODIAC_SIGNS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchHoroscope = useCallback(async (zodiacId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await getDailyHoroscope(zodiacId);
      if (isMountedRef.current) {
        setPayload(response.data);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load horoscope');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchHoroscope(selectedZodiac.id);
  }, [selectedZodiac.id, fetchHoroscope]);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const selectZodiac = (zodiac: typeof ZODIAC_SIGNS[0]) => {
    setSelectedZodiac(zodiac);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Consulting the heavens...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Rashifal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Zodiac Selector Dropdown */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Choose your Sun Sign</Text>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={toggleDropdown}>
            <View style={styles.dropdownTriggerContent}>
              <Text style={styles.zodiacIcon}>{selectedZodiac.icon}</Text>
              <View style={styles.zodiacText}>
                <Text style={styles.zodiacName}>{selectedZodiac.name}</Text>
                <Text style={styles.zodiacHindi}>{selectedZodiac.hindi}</Text>
              </View>
            </View>
            <Ionicons 
              name={showDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.textLight} 
            />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdown}>
              {ZODIAC_SIGNS.map((zodiac) => (
                <TouchableOpacity
                  key={zodiac.id}
                  style={[
                    styles.dropdownItem,
                    selectedZodiac.id === zodiac.id && styles.selectedItem
                  ]}
                  onPress={() => selectZodiac(zodiac)}
                >
                  <Text style={styles.dropdownIcon}>{zodiac.icon}</Text>
                  <Text style={styles.dropdownName}>{zodiac.name}</Text>
                  {selectedZodiac.id === zodiac.id && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.primary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchHoroscope(selectedZodiac.id)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF9F2']}
              style={styles.predictionCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
                <Text style={styles.cardEyebrow}>Daily Prediction</Text>
              </View>
              
              {typeof payload?.prediction === 'string' ? (
                <Text style={styles.predictionText}>{payload.prediction}</Text>
              ) : typeof payload?.prediction === 'object' && payload.prediction !== null ? (
                <View style={styles.categoriesContainer}>
                  {Object.entries(payload.prediction).map(([key, value]) => {
                    if (!value) return null;
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let iconName: any = 'star-outline';
                    if (key.includes('personal')) iconName = 'heart-outline';
                    if (key.includes('profession')) iconName = 'briefcase-outline';
                    if (key.includes('health')) iconName = 'fitness-outline';
                    if (key.includes('emotion')) iconName = 'happy-outline';
                    if (key.includes('travel')) iconName = 'airplane-outline';
                    if (key.includes('luck')) iconName = 'sparkles-outline';

                    return (
                      <View key={key} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <Ionicons name={iconName} size={18} color={COLORS.primary} />
                          <Text style={styles.categoryLabel}>{label}</Text>
                        </View>
                        <Text style={styles.categoryText}>{String(value)}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.predictionText}>
                  Your daily celestial guidance is being prepared. Check back shortly!
                </Text>
              )}

            </LinearGradient>


            {/* Additional Insights Section */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Spiritual Insights</Text>
              <View style={styles.insightCard}>
                <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                <Text style={styles.insightText}>
                  Align your energies today with meditation and focused prayers. The planetary alignment suggests a time for reflection.
                </Text>
              </View>
            </View>
          </View>
        )}
        <View style={{ height: 100 }} />
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  scrollView: { flex: 1 },
  selectorContainer: {
    padding: SPACING.md, backgroundColor: COLORS.surface, zIndex: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  selectorLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF9F2', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: '#F6D4B8',
  },
  dropdownTriggerContent: { flexDirection: 'row', alignItems: 'center' },
  zodiacIcon: { fontSize: 24, marginRight: 12 },
  zodiacText: { justifyContent: 'center' },
  zodiacName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  zodiacHindi: { fontSize: 12, color: COLORS.textSecondary },
  dropdown: {
    marginTop: 8, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: 4,
    borderWidth: 1, borderColor: COLORS.border, elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: BORDER_RADIUS.md, gap: 12,
  },
  selectedItem: { backgroundColor: '#FFF9F2' },
  dropdownIcon: { fontSize: 20 },
  dropdownName: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.text },
  content: { padding: SPACING.md },
  predictionCard: {
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  dateBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dateText: { color: COLORS.surface, fontSize: 11, fontWeight: '700' },
  cardEyebrow: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  predictionText: { fontSize: 15, color: COLORS.text, lineHeight: 24, fontWeight: '400' },
  categoriesContainer: { gap: 16 },
  categoryItem: { gap: 8 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  categoryText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  insightsSection: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  insightCard: {
    flexDirection: 'row', backgroundColor: '#F0F9FF', padding: 16, borderRadius: BORDER_RADIUS.lg, gap: 12, borderWidth: 1, borderColor: '#BAE6FD',
  },
  insightText: { flex: 1, fontSize: 14, color: '#0369A1', lineHeight: 20 },
  errorContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: COLORS.error, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 20 },
  retryText: { color: COLORS.surface, fontWeight: '700' },
});
