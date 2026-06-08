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
  Modal,
  TouchableWithoutFeedback,
  TextInput,
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
  { label: 'LOVE', keys: ['love', 'fiance', 'personal_life', 'personal'], icon: require('../assets/images/jyotish/love.png'), fallback: 'Focus on harmony and understanding in your personal relationships today.' },
  { label: 'FINANCE', keys: ['finance', 'profession', 'career'], icon: require('../assets/images/jyotish/finance.png'), fallback: 'Keep a steady pace at work. Patience and diligence will bring long-term success.' },
  { label: 'HEALTH', keys: ['health'], icon: require('../assets/images/jyotish/health.png'), fallback: 'Take time to rest and recharge. Balance your physical and mental well-being.' },
  { label: 'OVERALL', keys: ['overall', 'emotion', 'emotions', 'luck'], icon: require('../assets/images/jyotish/overall.png'), fallback: 'A generally positive day ahead. Trust your intuition.' },
];

const getLuckyColorConfig = (colorName: string) => {
  const name = colorName.toLowerCase().trim();
  let gradient: [string, string, ...string[]] = ['#FC8260', '#D84315']; // Default orange-red
  let textColor = '#FFF';

  if (name.includes('red')) { gradient = ['#FF6B6B', '#C92A2A']; }
  else if (name.includes('blue')) { gradient = ['#4DABF7', '#1864AB']; }
  else if (name.includes('green')) { gradient = ['#69DB7C', '#2B8A3E']; }
  else if (name.includes('yellow')) { gradient = ['#FFE066', '#E67700']; textColor = '#000'; }
  else if (name.includes('orange')) { gradient = ['#FFA94D', '#D9480F']; }
  else if (name.includes('pink')) { gradient = ['#FF93D2', '#A61E4D']; }
  else if (name.includes('purple')) { gradient = ['#B197FC', '#5F3DC4']; }
  else if (name.includes('white')) { gradient = ['#F8F9FA', '#CED4DA']; textColor = '#000'; }
  else if (name.includes('black')) { gradient = ['#495057', '#212529']; }
  else if (name.includes('brown')) { gradient = ['#D9A566', '#8B4513']; }
  else if (name.includes('grey') || name.includes('gray')) { gradient = ['#ADB5BD', '#495057']; }

  return { gradient, textColor };
};

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
  const [activeCategory, setActiveCategory] = useState(PREDICTION_SECTIONS[0].label);
  const [modalVisible, setModalVisible] = useState(false);

  const isMountedRef = useRef(true);
  const hasSetDefaultRashiRef = useRef(false);

  // Set default rashi on mount if user profile has one
  useEffect(() => {
    isMountedRef.current = true;
    const rashi = user?.rashi;
    if (rashi && !hasSetDefaultRashiRef.current) {
      const match = ZODIAC_SIGNS.find(z => z.hindi.toLowerCase() === rashi.toLowerCase() || z.name.toLowerCase() === rashi.toLowerCase());
      if (match) {
        setSelectedZodiac(match);
        hasSetDefaultRashiRef.current = true;
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
  
  const luckyColorConfig = getLuckyColorConfig(lucky.color);

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
              <Ionicons name="chevron-back" size={24} color="#291715" />
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
        locations={[0, 0.2, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('grid')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#291715" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Jyotish</Text>
          <View style={{ width: 40 }} />
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
                      colors={['#FFF9DF', '#FDE047']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[styles.verticalBarFill, { height: `${scores.overall ?? 66}%` as any }]}
                    >
                      <Text style={styles.verticalBarText}>{scores.overall ?? 66}%</Text>
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
                      colors={luckyColorConfig.gradient} 
                      style={styles.luckyColorBox}
                    >
                      <Text style={[styles.luckyValue, { color: luckyColorConfig.textColor, fontSize: 16 }]}>{lucky.color}</Text>
                    </LinearGradient>
                    <Text style={styles.luckyLabel}>Lucky{'\n'}Colour</Text>
                  </View>
                </View>
              </View>

              {/* AI Card */}
              <View style={styles.aiCard}>
                <View style={styles.aiCardHeader}>
                  <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="sparkles" size={20} color="#FF8C00" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.aiCardTitle}>Ask AI about your horoscope</Text>
                    <Text style={styles.aiCardSubtitle}>Get insights tailored to your situation</Text>
                  </View>
                </View>
                <View style={styles.aiTagsRow}>
                  <View style={styles.aiTag}>
                    <ExpoImage source={require('../assets/images/jyotish/love.svg')} style={{ width: 12, height: 12, tintColor: '#FF8C00' }} contentFit="contain" />
                    <Text style={styles.aiTagText}>Love</Text>
                  </View>
                  <View style={styles.aiTag}>
                    <ExpoImage source={require('../assets/images/jyotish/career.svg')} style={{ width: 12, height: 12, tintColor: '#FF8C00' }} contentFit="contain" />
                    <Text style={styles.aiTagText}>Career</Text>
                  </View>
                  <View style={styles.aiTag}>
                    <ExpoImage source={require('../assets/images/jyotish/health_new.svg')} style={{ width: 12, height: 12, tintColor: '#FF8C00' }} contentFit="contain" />
                    <Text style={styles.aiTagText}>Health</Text>
                  </View>
                  <View style={styles.aiTag}>
                    <ExpoImage source={require('../assets/images/jyotish/auspicious.svg')} style={{ width: 12, height: 12, tintColor: '#FF8C00' }} contentFit="contain" />
                    <Text style={styles.aiTagText}>Auspicious Timing</Text>
                  </View>
                  <View style={styles.aiTag}>
                    <ExpoImage source={require('../assets/images/jyotish/spiritual.svg')} style={{ width: 12, height: 12, tintColor: '#FF8C00' }} contentFit="contain" />
                    <Text style={styles.aiTagText}>Spiritual Guidance</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/ai-jyotish')}>
                  <Text style={styles.aiButtonText}>Ask Now</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Cosmic Analysis Section */}
              <View style={styles.cosmicAnalysisContainer}>
                <Text style={styles.cosmicAnalysisTitle}>Cosmic Analysis</Text>
                
                <View style={styles.cosmicAnalysisTabsContainer}>
                  {PREDICTION_SECTIONS.map((section) => {
                    const isActive = activeCategory === section.label;
                    return (
                      <TouchableOpacity 
                        key={section.label}
                        style={styles.cosmicTabItem}
                        onPress={() => {
                          setActiveCategory(section.label);
                          setModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[
                          styles.cosmicTabCircle,
                          { 
                            backgroundColor: '#FF7B00',
                            borderColor: '#FF7B00',
                            borderWidth: 1,
                          }
                        ]}>
                          <Image 
                            source={section.icon} 
                            style={[
                              styles.cosmicTabIcon,
                              { tintColor: '#FFFFFF' }
                            ]} 
                            resizeMode="contain" 
                          />
                        </View>
                        <Text style={[
                          styles.cosmicTabLabel,
                          { color: isActive ? '#994700' : '#A67C52' }
                        ]}>
                          {section.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Cosmic Analysis Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            {(() => {
              const section = PREDICTION_SECTIONS.find(s => s.label === activeCategory);
              if (!section) return null;
              
              let text = '';
              if (typeof predictionData === 'object' && predictionData !== null) {
                for (const k of section.keys) {
                  if (predictionData[k]) {
                    text = String(predictionData[k]);
                    break;
                  }
                }
              }
              const predictionText = text || section.fallback;

              return (
                <>
                  <View style={styles.modalIconContainer}>
                    <Image source={section.icon} style={{ width: 32, height: 32, tintColor: '#FFF' }} resizeMode="contain" />
                  </View>
                  <Text style={styles.modalTitle}>{section.label}</Text>
                  <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalDescription}>{predictionText}</Text>
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

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
        colors={['#FDF48A', '#FFF9E1']} 
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#5C2A01', fontFamily: 'System', lineHeight: 24, fontStyle: 'normal' },
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
    paddingTop: 4,
    paddingBottom: 12,
  },
  heroLeft: { flex: 1, paddingTop: 0 },
  signNameText: { fontSize: 48, fontWeight: '800', color: '#111', lineHeight: 54 },
  signDateText: { fontSize: 15, color: '#111', fontWeight: '600', lineHeight: 24, marginTop: 4 },
  heroImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  zodiacImage: { width: 100, height: 100 },
  // Metrics section
  metricsContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  leftMetrics: { width: 160 },
  centerMetric: { alignItems: 'center' },
  rightMetrics: { alignItems: 'center', width: 73 },
  metricBarItem: { marginBottom: 16 },
  metricBarTrack: {
    width: 160,
    height: 36,
    borderWidth: 1,
    borderColor: 'rgba(153, 153, 153, 0.36)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricBarText: { color: '#000', fontSize: 16, fontWeight: '800' },
  metricBarLabel: { fontSize: 14, color: '#000', fontWeight: '500', fontFamily: 'System', fontStyle: 'normal', lineHeight: 24, marginTop: 6 },
  metricLabel: { width: 48, fontSize: 14, color: '#000', fontWeight: '500', fontFamily: 'System', fontStyle: 'normal', lineHeight: 24, marginTop: 8, textAlign: 'center' },
  verticalBarTrack: {
    width: 68,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  verticalBarFill: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalBarText: { color: '#000', fontSize: 16, fontWeight: '800' },
  luckyItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  luckyNumberBox: {
    width: 73,
    height: 62,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  luckyColorBox: {
    width: 73,
    height: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  luckyValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  luckyLabel: { width: 62, fontSize: 14, color: '#000', textAlign: 'center', fontFamily: 'System', fontStyle: 'normal', fontWeight: '500', lineHeight: 18 },
  // AI card
  aiCard: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    display: 'flex',
    minHeight: 140,
    paddingVertical: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8C2BC',
    backgroundColor: '#FFF',
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 22 },
  aiCardTitle: {
    alignSelf: 'stretch',
    color: '#231917',
    fontFamily: 'System',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
  },
  aiCardSubtitle: {
    alignSelf: 'stretch',
    color: '#85736E',
    fontFamily: 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 19.5,
    marginTop: 2,
  },
  aiTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 22 },
  aiTag: {
    flexDirection: 'row',
    height: 28,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: '#FFDBD1',
  },
  aiTagText: { fontSize: 11, color: '#FF8C00', fontWeight: '700' },
  aiButton: {
    display: 'flex',
    width: 315,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    borderRadius: 9999,
    backgroundColor: '#FF7B00',
  },
  aiButtonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  // Cosmic Analysis
  cosmicAnalysisContainer: {
    marginTop: 0,
    marginBottom: 24,
  },
  cosmicAnalysisTitle: {
    color: '#311303',
    fontFamily: 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cosmicAnalysisTabsContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cosmicTabItem: {
    alignItems: 'center',
    gap: 4,
  },
  cosmicTabCircle: {
    width: 56,
    height: 56,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cosmicTabIcon: {
    width: 28,
    height: 28,
  },
  cosmicTabLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    borderRadius: 32,
    padding: 24,
    paddingTop: 44, // Space for the overlapping icon
    alignItems: 'center',
    shadowColor: 'rgba(122, 80, 57, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -28,
  },
  modalTitle: {
    color: '#FF7B00',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  modalDescription: {
    color: '#584235',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: '#FF7B00',
    width: '100%',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },

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
    fontSize: 14,
    lineHeight: 20,
    color: '#53433F',
    fontWeight: '400',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
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