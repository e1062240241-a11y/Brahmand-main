// accessibility: placeholder
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
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

import { getDailyHoroscope } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { BrandedLoading } from '../src/components/BrandedLoading';

import { useAuthStore } from '../src/store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Aries', hindi: 'Mesh', icon: '♈', dates: '21 March - 19 April', color: '#FF6B00', image: require('../assets/images/tab bar/rashi/Aries.png') },
  { id: 'taurus', name: 'Taurus', hindi: 'Vrishabh', icon: '♉', dates: '20 April - 20 May', color: '#8E44AD', image: require('../assets/images/tab bar/rashi/Taurus.png') },
  { id: 'gemini', name: 'Gemini', hindi: 'Mithun', icon: '♊', dates: '21 May - 20 June', color: '#2ECC71', image: require('../assets/images/tab bar/rashi/gemini.png') },
  { id: 'cancer', name: 'Cancer', hindi: 'Kark', icon: '♋', dates: '21 June - 22 July', color: '#3498DB', image: require('../assets/images/tab bar/rashi/cancer.png') },
  { id: 'leo', name: 'Leo', hindi: 'Simha', icon: '♌', dates: '23 July - 22 August', color: '#F1C40F', image: require('../assets/images/tab bar/rashi/Leo.png') },
  { id: 'virgo', name: 'Virgo', hindi: 'Kanya', icon: '♍', dates: '23 August - 22 September', color: '#16A085', image: require('../assets/images/tab bar/rashi/Virgo.png') },
  { id: 'libra', name: 'Libra', hindi: 'Tula', icon: '♎', dates: '23 September - 22 October', color: '#E67E22', image: require('../assets/images/tab bar/rashi/Libra.png') },
  { id: 'scorpio', name: 'Scorpio', hindi: 'Vrishchik', icon: '♏', dates: '23 October - 21 November', color: '#C0392B', image: require('../assets/images/tab bar/rashi/Scorpio.png') },
  { id: 'sagittarius', name: 'Sagittarius', hindi: 'Dhanu', icon: '♐', dates: '22 November - 21 December', color: '#2980B9', image: require('../assets/images/tab bar/rashi/sagittarius.png') },
  { id: 'capricorn', name: 'Capricorn', hindi: 'Makar', icon: '♑', dates: '22 December - 19 January', color: '#273C75', image: require('../assets/images/tab bar/rashi/Capricorn.png') },
  { id: 'aquarius', name: 'Aquarius', hindi: 'Kumbh', icon: '♒', dates: '20 January - 18 February', color: '#192A56', image: require('../assets/images/tab bar/rashi/Aquarius.png') },
  { id: 'pisces', name: 'Pisces', hindi: 'Meen', icon: '♓', dates: '19 February - 20 March', color: '#44BD32', image: require('../assets/images/tab bar/rashi/Pisces.png') },
];

const PREDICTION_SECTIONS = [
  { label: 'PERSONAL LIFE', keys: ['fiance', 'personal_life', 'personal'], icon: require('../assets/images/tab bar/rashi/Person-Fill Streamline Phosphor-Fill.png'), fallback: 'Something feels slightly tense in your interactions today, and you can sense it without anyone saying it directly. You may expect others to respond quickly or clearly, yet their pace feels slower than yours. That gap can create irritation if left unchecked. Instead of reacting fast, pause and observe what is actually being said. Small adjustments in tone and timing can help you avoid unnecessary friction during the day today.' },
  { label: 'PROFESSION', keys: ['love', 'profession', 'career'], icon: require('../assets/images/tab bar/rashi/Briefcase-Fill Streamline Phosphor-Fill.png'), fallback: 'Work matters feel more demanding as expectations rise and responses feel sharper than usual. With the Moon in Capricorn in your tenth house squaring Mars in Aries, you may feel pushed to prove something quickly. But rushing decisions can lead to missteps. Focus on clear priorities and give your actions structure. When you slow your reactions, your authority comes through stronger and people take you more seriously over time now.' },
  { label: 'HEALTH', keys: ['health'], icon: require('../assets/images/tab bar/rashi/heart.png'), fallback: 'Pay attention to how you breathe. Slowing down will calm your system faster than forcing yourself to relax.' },
  { label: 'EMOTIONS', keys: ['overall', 'emotion', 'emotions'], icon: require('../assets/images/tab bar/rashi/Smiley-Melting-Fill Streamline Phosphor-Fill.png'), fallback: 'You are reacting faster than you are processing. Give yourself space before responding, even in small conversations.' },
  { label: 'TRAVEL', keys: ['travel'], icon: require('../assets/images/tab bar/rashi/Trolley-Suitcase-Fill Streamline Phosphor-Fill.png'), fallback: 'If you have plans to move, keep them simple and leave room for delays or changes. Staying flexible will make the experience smoother.' },
  { label: 'LUCK', keys: ['luck'], icon: require('../assets/images/tab bar/rashi/Clover-Fill Streamline Phosphor-Fill.png'), fallback: 'Things work better when you slow reactions and act with intention. When your actions match your priorities, you create your own sense of timing.' },
];

export default function HoroscopeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Set default state
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');
  const [selectedZodiac, setSelectedZodiac] = useState(ZODIAC_SIGNS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMountedRef = useRef(true);

  // Set default rashi on mount if user profile has one
  useEffect(() => {
    isMountedRef.current = true;
    const rashi = user?.rashi;
    if (rashi) {
      const match = ZODIAC_SIGNS.find(z => z.hindi.toLowerCase() === rashi.toLowerCase() || z.name.toLowerCase() === rashi.toLowerCase());
      if (match) {
        setSelectedZodiac(match);
      }
    }
    return () => { isMountedRef.current = false; };
  }, [user?.rashi]);

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
    if (viewMode === 'details') {
      fetchHoroscope(selectedZodiac.id);
    }
  }, [selectedZodiac.id, fetchHoroscope, viewMode]);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const selectZodiac = (zodiac: typeof ZODIAC_SIGNS[0]) => {
    setSelectedZodiac(zodiac);
    setShowDropdown(false);
    setViewMode('details');
  };

  if (loading) {
    return (
      <BrandedLoading message="Consulting the heavens..." />
    );
  }

  const predictionData = payload?.detailed_predictions || {};
  const scores = payload?.scores || { finance: 84, love: 59, health: 57, overall: 66 };
  const lucky = {
    number: String(payload?.lucky_number || payload?.lucky?.number || '1, 8'),
    color: String(payload?.lucky_color || payload?.lucky?.color || 'Red'),
    colorHex: String(payload?.lucky_color_hex || payload?.lucky?.colorHex || '#FF6B00'),
  };

  const normalizeTextBlock = (value: any) => {
    const text = Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean).join(' ')
      : String(value ?? '');

    return text.replace(/\s+/g, ' ').trim();
  };

  const renderPrediction = () => {
    if (typeof payload?.prediction === 'string') {
      return <Text style={styles.predictionText}>{payload.prediction}</Text>;
    }

    if (Array.isArray(payload?.prediction)) {
      return (
        <Text style={styles.predictionText}>{normalizeTextBlock(payload.prediction)}</Text>
      );
    }

    if (typeof payload?.prediction === 'object' && payload.prediction !== null) {
      return (
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
                <Ionicons name={iconName} size={20} color="#E65C00" />
                <Text style={styles.categoryLabel}>{label}</Text>
                <Text style={styles.categoryValue}>{normalizeTextBlock(value)}</Text>
              </View>
            );
          })}
        </View>
      );
    }

    return null;
  };

  if (viewMode === 'grid') {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFEEE5' }}>
        <LinearGradient
          colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
          locations={[0, 0.0913, 0.25]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
            <Text style={styles.gridTitle}>What's your Rashi</Text>
            
            <View style={styles.grid}>
              {ZODIAC_SIGNS.map((zodiac) => {
                return (
                  <TouchableOpacity 
                    key={zodiac.id} 
                    style={styles.gridCard}
                    onPress={() => selectZodiac(zodiac)}
                    activeOpacity={0.75}
                  >
                    <ExpoImage source={zodiac.image} style={{ width: 100, height: 100, marginBottom: 10 }} contentFit="contain" />
                    <Text style={styles.gridName}>{zodiac.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#FFEEE5' }]}>
      {/* Full gradient background */}
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('grid')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cosmic Guidance</Text>
          <TouchableOpacity onPress={toggleDropdown} style={styles.backBtn}>
            <Ionicons name="apps-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Sign Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroLeft}>
              <Text style={styles.signNameText}>{selectedZodiac.name}</Text>
              <Text style={styles.signDateText}>
                Today {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.heroImageWrapper}>
              <ExpoImage source={selectedZodiac.image} style={styles.zodiacImage} contentFit="contain" />
            </View>
          </View>

          {loading ? (
            <BrandedLoading message="Consulting the heavens..." />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FFF" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchHoroscope(selectedZodiac.id)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Metrics Section */}
              <View style={styles.metricsContainer}>
                {/* Left: Horizontal bars */}
                <View style={styles.leftMetrics}>
                  <MetricBar label="Finance" value={scores.finance} />
                  <MetricBar label="Love" value={scores.love} />
                  <MetricBar label="Health" value={scores.health} />
                </View>

                {/* Center: Overall vertical bar */}
                <View style={styles.centerMetric}>
                  <View style={styles.verticalBarTrack}>
                    <LinearGradient
                      colors={['#FFF4C6', '#FFD738']}
                      locations={[0, 0.5668]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[styles.verticalBarFill, { height: `${scores.overall}%` as any }]}
                    >
                      <Text style={styles.verticalBarText}>{scores.overall}%</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.metricLabel}>Overall</Text>
                </View>

                {/* Right: Lucky */}
                <View style={styles.rightMetrics}>
                  <View style={styles.luckyItem}>
                    <View style={styles.luckyNumberBox}>
                      <Text style={styles.luckyValue}>{lucky.number}</Text>
                    </View>
                    <Text style={styles.luckyLabel}>Lucky{'\n'}Number</Text>
                  </View>
                  
                  <View style={styles.luckyItem}>
                    <LinearGradient 
                      colors={['#FFAF95', '#E13F08']} 
                      style={styles.luckyColorBox}
                    >
                      <Text style={[styles.luckyValue, { color: '#FFF', fontSize: 16 }]}>{lucky.color}</Text>
                    </LinearGradient>
                    <Text style={styles.luckyLabel}>Lucky{'\n'}Colour</Text>
                  </View>
                </View>
              </View>

              {/* AI Card */}
              <View style={styles.aiCard}>
                <View style={styles.aiCardHeader}>
                  <Ionicons name="sparkles" size={20} color="#FF8C00" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.aiCardTitle}>Ask AI about your horoscope</Text>
                    <Text style={styles.aiCardSubtitle}>Get insights tailored to your situation</Text>
                  </View>
                </View>
                <Text style={styles.aiCardBody}>
                  Get personalised horoscope guidance for love, career, relationships, timing, and your spiritual journey.
                </Text>
                <View style={styles.aiTagsRow}>
                  <View style={styles.aiTag}>
                    <Ionicons name="time-outline" size={12} color="#FF8C00" />
                    <Text style={styles.aiTagText}>Auspicious Timing</Text>
                  </View>
                  <View style={styles.aiTag}>
                    <Ionicons name="flame-outline" size={12} color="#FF8C00" />
                    <Text style={styles.aiTagText}>Spiritual Guidance</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.aiButton}>
                  <Text style={styles.aiButtonText}>Ask Now</Text>
                </TouchableOpacity>
              </View>

              {/* Prediction sections */}
              {renderPrediction()}

              {/* Detailed category sections */}
              {PREDICTION_SECTIONS.map((section, index) => {
                let text = '';
                if (typeof predictionData === 'object' && predictionData !== null) {
                  for (const k of section.keys) {
                    if (predictionData[k]) {
                      text = String(predictionData[k]);
                      break;
                    }
                  }
                }
                
                // Fallback text if backend doesn't provide it
                if (!text) {
                  text = section.fallback;
                }

                // Explicit override for Aries page as requested
                if (selectedZodiac.id === 'aries') {
                  if (section.label === 'PERSONAL LIFE') {
                    text = 'Something feels slightly tense in your interactions today, and you can sense it without anyone saying it directly. You may expect others to respond quickly or clearly, yet their pace feels slower than yours. That gap can create irritation if left unchecked. Instead of reacting fast, pause and observe what is actually being said. Small adjustments in tone and timing can help you avoid unnecessary friction during the day today.';
                  } else if (section.label === 'PROFESSION') {
                    text = 'Work matters feel more demanding as expectations rise and responses feel sharper than usual. With the Moon in Capricorn in your tenth house squaring Mars in Aries, you may feel pushed to prove something quickly. But rushing decisions can lead to missteps. Focus on clear priorities and give your actions structure. When you slow your reactions, your authority comes through stronger and people take you more seriously over time now.';
                  } else if (section.label === 'HEALTH') {
                    text = 'That push to stay on top of everything can show up in your body as tightness or restlessness. You might notice tension in your shoulders or a tendency to rush through meals or routines. Slow your pace where you can. Even short breaks help reset your system. Pay attention to how you breathe, because steady breathing will calm your system faster than forcing yourself to relax in moments like this.';
                  } else if (section.label === 'EMOTIONS') {
                    text = 'You are reacting faster than you are processing, and that creates inner pressure. Give yourself space before responding, even in small conversations. When you allow a gap between feeling and action, your emotional clarity improves and you stop carrying tension from one situation into another.';
                  }
                }

                return (
                  <View key={section.label}>
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Ionicons name="flame" size={14} color="#F47B3E" style={{ marginHorizontal: 8 }} />
                      <View style={styles.dividerLine} />
                    </View>
                    <View style={styles.predictionRow}>
                      <View style={styles.predictionLeftIcon}>
                        <ExpoImage source={section.icon} style={{ width: 32, height: 32 }} tintColor="#F47B3E" contentFit="contain" />
                      </View>
                      <View style={styles.predictionRightContent}>
                        <Text style={styles.predictionSectionLabel}>{section.label}</Text>
                        <Text style={styles.predictionSectionText}>{text}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Zodiac grid dropdown overlay */}
      {showDropdown && (
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ZODIAC_SIGNS.map((z) => (
                <TouchableOpacity key={z.id} style={styles.dropdownOption} onPress={() => selectZodiac(z)}>
                  <ExpoImage source={z.image} style={{ width: 28, height: 28, marginRight: 12 }} contentFit="contain" />
                  <Text style={styles.dropdownOptionName}>{z.name}</Text>
                  <Text style={styles.dropdownOptionHindi}>{z.hindi}</Text>
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
        colors={['#FFD738', '#FFF4C6']} 
        locations={[0.0029, 0.5673]}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
        style={[styles.metricBarFill, { width: `${value}%` as any }]}
      >
        <Text style={styles.metricBarText}>{value}%</Text>
      </LinearGradient>
    </View>
    <Text style={styles.metricBarLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  gridTitle: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 28,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
    columnGap: 0,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 40) / 3,
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridName: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'System',
    fontWeight: '600',
    textAlign: 'center',
  },
  gridHindiName: {
    fontSize: 11,
    color: '#8B3A2A',
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  container: { flex: 1, backgroundColor: '#F47B3E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderInline: { padding: 40, alignItems: 'center', gap: 16 },
  loaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  // Hero section
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroLeft: { flex: 1 },
  signNameText: { fontSize: 40, fontWeight: '700', color: 'rgba(0, 0, 0, 0.90)', lineHeight: 44 },
  signDateText: { fontSize: 12, color: '#000', fontWeight: '500', lineHeight: 24, marginTop: 4 },
  heroImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: 'rgba(196, 49, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  zodiacImage: { width: 90, height: 90 },
  // Metrics section (no card wrapper)
  metricsContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  leftMetrics: { flex: 1.3, gap: 16 },
  centerMetric: { flex: 0.8, alignItems: 'center', gap: 4 },
  rightMetrics: { flex: 1, gap: 16 },
  metricBarItem: { gap: 4 },
  metricBarTrack: {
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(153,153,153,0.36)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricBarText: { color: '#000', fontSize: 13, fontWeight: '700' },
  metricBarLabel: { fontSize: 12, color: '#000', fontWeight: '600' },
  metricLabel: { fontSize: 12, color: '#000', fontWeight: '600', marginTop: 4 },
  verticalBarTrack: {
    width: 68,
    height: 132,
    borderWidth: 1,
    borderColor: 'rgba(153,153,153,0.36)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalBarFill: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalBarText: { color: '#000', fontSize: 14, fontWeight: '700' },
  luckyItem: {
    alignItems: 'center',
    flex: 1,
  },
  luckyNumberBox: {
    width: 73,
    height: 62,
    borderWidth: 1,
    borderColor: 'rgba(153,153,153,0.36)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  luckyColorBox: {
    width: 73,
    height: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  luckyValue: { fontSize: 20, fontWeight: '600', color: '#111' },
  luckyLabel: { fontSize: 11, fontWeight: '600', color: '#000', textAlign: 'center' },
  // AI card
  aiCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  aiCardTitle: { fontSize: 16, fontWeight: '600', color: '#231917', lineHeight: 24 },
  aiCardSubtitle: { fontSize: 12, color: '#85736E', marginTop: 2, fontWeight: '400', lineHeight: 19.5 },
  aiCardBody: { fontSize: 14, color: '#53433F', lineHeight: 20, marginBottom: 14, fontWeight: '400' },
  aiTagsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFD9A8',
  },
  aiTagText: { fontSize: 11, color: '#FF8C00', fontWeight: '700' },
  aiButton: {
    backgroundColor: '#FF7B00',
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  aiButtonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  // Prediction sections
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(244, 123, 62, 0.3)',
  },
  predictionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  predictionLeftIcon: {
    width: 44,
    alignItems: 'center',
    marginRight: 12,
    marginTop: 20,
  },
  predictionRightContent: {
    flex: 1,
  },
  predictionSectionLabel: { fontSize: 12, fontWeight: '800', color: '#F47B3E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  predictionSectionText: { fontSize: 16, color: '#000', lineHeight: 24, fontWeight: '500' },
  content: { paddingHorizontal: 20, marginTop: 16 },
  predictionCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  dateText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cardEyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF6B00',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  predictionText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#222',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  categoryItem: {
    width: '47%',
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.1)',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65C00',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Dropdown
  dropdownOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
  },
  dropdownContent: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 60,
    borderRadius: 20,
    padding: 10,
    maxHeight: 420,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownOptionName: { fontSize: 15, fontWeight: '700', color: '#222', flex: 1 },
  dropdownOptionHindi: { fontSize: 13, color: '#F47B3E', fontWeight: '600' },
  errorContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#FFF', textAlign: 'center', fontSize: 14, fontWeight: '500' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  retryText: { color: '#FFF', fontWeight: '700' },
});