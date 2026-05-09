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
import { Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { getDailyHoroscope, askAstrologyAI } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Aries', hindi: 'Mesh', icon: '♈', dates: '21 March - 19 April', color: '#FF6B00', image: require('../assets/icons/horoicon /aries.svg') },
  { id: 'taurus', name: 'Taurus', hindi: 'Vrishabh', icon: '♉', dates: '20 April - 20 May', color: '#8E44AD', image: require('../assets/icons/horoicon /taurus.svg') },
  { id: 'gemini', name: 'Gemini', hindi: 'Mithun', icon: '♊', dates: '21 May - 20 June', color: '#2ECC71', image: require('../assets/images/zodiac/gemini.png') },
  { id: 'cancer', name: 'Cancer', hindi: 'Kark', icon: '♋', dates: '21 June - 22 July', color: '#3498DB', image: require('../assets/icons/horoicon /cancer.svg') },
  { id: 'leo', name: 'Leo', hindi: 'Simha', icon: '♌', dates: '23 July - 22 August', color: '#F1C40F', image: require('../assets/icons/horoicon /leo.svg') },
  { id: 'virgo', name: 'Virgo', hindi: 'Kanya', icon: '♍', dates: '23 August - 22 September', color: '#16A085', image: require('../assets/icons/horoicon /virgo.svg') },
  { id: 'libra', name: 'Libra', hindi: 'Tula', icon: '♎', dates: '23 September - 22 October', color: '#E67E22', image: require('../assets/icons/horoicon /libra.svg') },
  { id: 'scorpio', name: 'Scorpio', hindi: 'Vrishchik', icon: '♏', dates: '23 October - 21 November', color: '#C0392B', image: require('../assets/icons/horoicon /scorpio.svg') },
  { id: 'sagittarius', name: 'Sagittarius', hindi: 'Dhanu', icon: '♐', dates: '22 November - 21 December', color: '#2980B9', image: require('../assets/icons/horoicon /sagittarius.svg') },
  { id: 'capricorn', name: 'Capricorn', hindi: 'Makar', icon: '♑', dates: '22 December - 19 January', color: '#273C75', image: require('../assets/icons/horoicon /capricorn.svg') },
  { id: 'aquarius', name: 'Aquarius', hindi: 'Kumbh', icon: '♒', dates: '20 January - 18 February', color: '#192A56', image: require('../assets/icons/horoicon /aquarius.svg') },
  { id: 'pisces', name: 'Pisces', hindi: 'Meen', icon: '♓', dates: '19 February - 20 March', color: '#44BD32', image: require('../assets/icons/horoicon /pisces.svg') },
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
        <LinearGradient colors={['#FFAD7E', '#FFCCAB', '#FFFFFF']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loaderText}>Consulting the heavens...</Text>
      </View>
    );
  }

  const predictionData = payload?.prediction || {};
  const scores = payload?.scores || { finance: 84, love: 59, health: 57, overall: 66 };
  const lucky = payload?.lucky || { number: '1, 8', color: 'Red', colorHex: '#FF0000' };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF8A4C', '#FFB894', '#FFF0E6']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rashi</Text>
          <TouchableOpacity onPress={toggleDropdown} style={styles.backBtn}>
            <Ionicons name="apps-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Date Pill */}
          <View style={styles.datePillContainer}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>
                Today {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchHoroscope(selectedZodiac.id)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Sign Header */}
              <View style={styles.signHeaderRow}>
                <View style={styles.signTitleCol}>
                  <Text style={styles.signNameText}>{selectedZodiac.name}</Text>
                  <Text style={styles.signDatesText}>{selectedZodiac.dates}</Text>
                </View>
                <View style={styles.signIllustrationContainer}>
                  <View style={[styles.illustrationBg, { backgroundColor: selectedZodiac.color + '20', borderWidth: 0 }]}>
                    {(selectedZodiac as any).image ? (
                      <ExpoImage source={(selectedZodiac as any).image} style={styles.zodiacImage} contentFit="contain" />
                    ) : (
                      <Text style={styles.largeZodiacEmoji}>{selectedZodiac.icon}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Metrics Section */}
              <View style={styles.metricsContainer}>
                <View style={styles.leftMetrics}>
                  <MetricBar label="Finance" value={scores.finance} />
                  <MetricBar label="Love" value={scores.love} />
                  <MetricBar label="Health" value={scores.health} />
                </View>
                
                <View style={styles.centerMetric}>
                  <View style={styles.verticalBarContainer}>
                    <LinearGradient
                      colors={['#E65C00', '#FF8C42']}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.verticalBarFill, { height: `${scores.overall}%` }]}
                    >
                      <Text style={styles.verticalBarText}>{scores.overall}%</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.metricLabel}>Overall</Text>
                </View>

                <View style={styles.rightMetrics}>
                  <View style={styles.luckyBox}>
                    <Text style={styles.luckyValue}>{lucky.number}</Text>
                    <Text style={styles.luckyLabel}>Lucky Number</Text>
                  </View>
                  <View style={[styles.luckyBox, { backgroundColor: lucky.colorHex || '#FF0000' }]}>
                    <Text style={[styles.luckyValue, { color: '#FFF' }]}>{lucky.color}</Text>
                    <Text style={[styles.luckyLabel, { color: '#FFF' }]}>Lucky Colour</Text>
                  </View>
                </View>
              </View>

              <View style={styles.predictionContent}>
                {Object.entries(predictionData).map(([key, value], index) => {
                  if (!value) return null;
                  const label = key.replace(/_/g, ' ').toUpperCase();
                  let iconName: any = 'star';
                  if (key.includes('personal')) iconName = 'person';
                  if (key.includes('profession')) iconName = 'briefcase';
                  if (key.includes('health')) iconName = 'heart';
                  if (key.includes('emotion')) iconName = 'happy';
                  if (key.includes('travel')) iconName = 'airplane';
                  if (key.includes('luck')) iconName = 'leaf';

                  return (
                    <View key={key}>
                      <View style={styles.sectionDivider}>
                        <View style={styles.dividerLine} />
                        <Ionicons name="bonfire" size={12} color="#FF6B00" style={styles.dividerIcon} />
                        <View style={styles.dividerLine} />
                      </View>
                      
                      <View style={styles.sectionRow}>
                        <View style={styles.sectionIconCol}>
                          <Ionicons name={iconName} size={32} color="#111" />
                        </View>
                        <View style={styles.sectionTextCol}>
                          <Text style={styles.sectionLabel}>{label}</Text>
                          <Text style={styles.sectionDescription}>{String(value)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Detailed Content Dropdown Overlay moved here */}
      {showDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ZODIAC_SIGNS.map((z) => (
                <TouchableOpacity key={z.id} style={styles.dropdownOption} onPress={() => selectZodiac(z)}>
                  <Text style={styles.dropdownOptionIcon}>{z.icon}</Text>
                  <Text style={styles.dropdownOptionName}>{z.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const MetricBar = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.metricBarItem}>
    <View style={styles.metricBarTrack}>
      <LinearGradient
        colors={['#E65C00', '#FF8C42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.metricBarFill, { width: `${value}%` }]}
      >
        <Text style={styles.metricBarText}>{value}%</Text>
      </LinearGradient>
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#444', fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  datePillContainer: { alignItems: 'center', marginTop: 10 },
  datePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  datePillText: { fontSize: 13, color: '#333', fontWeight: '700' },
  signHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  signTitleCol: { flex: 1 },
  signNameText: { fontSize: 36, fontWeight: '900', color: '#111' },
  signDatesText: { fontSize: 14, color: '#444', fontWeight: '700', marginTop: 4 },
  signIllustrationContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  zodiacImage: { width: 90, height: 90 },
  largeZodiacEmoji: { fontSize: 48 },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  leftMetrics: { flex: 1.2, gap: 12 },
  centerMetric: { flex: 0.8, alignItems: 'center' },
  rightMetrics: { flex: 1, gap: 10 },
  metricBarItem: { gap: 4 },
  metricBarTrack: {
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  metricBarFill: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  metricBarText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  metricLabel: { fontSize: 12, color: '#444', fontWeight: '700', marginTop: 2 },
  verticalBarContainer: {
    width: 50,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  verticalBarFill: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalBarText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  luckyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: 60,
  },
  luckyValue: { fontSize: 18, fontWeight: '900', color: '#111' },
  luckyLabel: { fontSize: 10, fontWeight: '700', color: '#444', textAlign: 'center', marginTop: 2 },
  predictionContent: { paddingHorizontal: 24, marginTop: 10 },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 107, 0, 0.3)' },
  dividerIcon: { marginHorizontal: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  sectionIconCol: { width: 40, marginTop: 4 },
  sectionTextCol: { flex: 1 },
  sectionLabel: { fontSize: 14, fontWeight: '900', color: '#FF6B00', marginBottom: 6 },
  sectionDescription: { fontSize: 15, color: '#333', lineHeight: 22, fontWeight: '500' },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  dropdownContent: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 60,
    borderRadius: 16,
    padding: 10,
    maxHeight: 400,
    elevation: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionIcon: { fontSize: 20, marginRight: 12 },
  dropdownOptionName: { fontSize: 16, fontWeight: '700', color: '#333' },
  errorContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: COLORS.error, textAlign: 'center', fontSize: 14, fontWeight: '500' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 20 },
  retryText: { color: COLORS.surface, fontWeight: '700' },
});
