import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';
import festivalEnrichments from '../data/festival-enrichments';
import { getFestivalImage } from '../constants/festivalImages';

interface RelatedFestival {
  id?: string;
  name: string;
  date?: string;
  emoji?: string;
}

interface FestivalDetailCardProps {
  festival: any;
  onBack: () => void;
  onGuidePress?: (section: string) => void;
  /** Optional — called when a related festival chip is tapped. Safe to omit. */
  onRelatedFestivalPress?: (relatedFestival: RelatedFestival) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_WIDTH <= 360;

// Unique Section Styling & Icons Config
const SECTION_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  bgGradient: [string, string];
  emoji: string;
  stripColor: string;
}> = {
  Story: {
    icon: 'book',
    accent: '#D97706',
    bgGradient: ['#FFFBEB', '#FEF3C7'],
    emoji: '📖',
    stripColor: '#F59E0B',
  },
  Origin: {
    icon: 'compass',
    accent: '#B45309',
    bgGradient: ['#FEF3C7', '#FDE68A'],
    emoji: '🧭',
    stripColor: '#D97706',
  },
  About: {
    icon: 'flower',
    accent: '#15803D',
    bgGradient: ['#F0FDF4', '#DCFCE7'],
    emoji: '🌸',
    stripColor: '#16A34A',
  },
  Purpose: {
    icon: 'sparkles',
    accent: '#C2410C',
    bgGradient: ['#FFEDD5', '#FED7AA'],
    emoji: '✨',
    stripColor: '#EA580C',
  },
  Importance: {
    icon: 'star',
    accent: '#B91C1C',
    bgGradient: ['#FEF2F2', '#FEE2E2'],
    emoji: '👑',
    stripColor: '#DC2626',
  },
  Celebration: {
    icon: 'happy',
    accent: '#047857',
    bgGradient: ['#ECFDF5', '#D1FAE5'],
    emoji: '🪔',
    stripColor: '#059669',
  },
  'Puja Vidhi': {
    icon: 'flame',
    accent: '#9A3412',
    bgGradient: ['#FFF7ED', '#FFEDD5'],
    emoji: '🔱',
    stripColor: '#C2410C',
  },
  Mantra: {
    icon: 'musical-notes',
    accent: '#6B21A8',
    bgGradient: ['#F3E8FF', '#E9D5FF'],
    emoji: '🕉',
    stripColor: '#7E22CE',
  },
};

// Date Formatter & Days Countdown Calculation
const formatFestivalDate = (dateStr: string) => {
  if (!dateStr) return 'Date TBD';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr;
};

const calculateDaysRemaining = (dateStr: string) => {
  if (!dateStr) return null;
  const festDate = new Date(dateStr);
  if (isNaN(festDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  festDate.setHours(0, 0, 0, 0);
  const diffTime = festDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today!';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `${diffDays} Days to go`;
  return null;
};

// Fun Facts Carousel ("Did You Know?")
const FACT_CARD_GAP = 12;
const FACT_CARD_WIDTH = SCREEN_WIDTH - SPACING.md * 2 - 36;

const FunFactsCarousel = ({ facts }: { facts: string[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 320,
      delay: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (FACT_CARD_WIDTH + FACT_CARD_GAP));
    setActiveIndex(Math.max(0, Math.min(index, facts.length - 1)));
  };

  if (!facts || facts.length === 0) return null;

  return (
    <Animated.View style={[styles.factsSection, { opacity: fadeIn }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.factsHeadingRow}>
          <View style={styles.goldBadgeDot} />
          <Ionicons name="bulb" size={18} color="#D4AF37" />
          <Text style={styles.sectionHeading}>Did You Know?</Text>
        </View>
        {facts.length > 1 && (
          <Text style={styles.sectionCount}>
            {activeIndex + 1}/{facts.length}
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={FACT_CARD_WIDTH + FACT_CARD_GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.factsScrollContent}
      >
        {facts.map((fact, i) => (
          <View
            key={i}
            style={[
              styles.factCard,
              { width: FACT_CARD_WIDTH, marginRight: i === facts.length - 1 ? 0 : FACT_CARD_GAP },
            ]}
          >
            <View style={styles.factCardDecor}>
              <Text style={styles.mandalaPattern}>🌸 🪔 🌸</Text>
            </View>
            <Ionicons name="sparkles" size={18} color="#D4AF37" style={styles.factIcon} />
            <Text style={styles.factText} maxFontSizeMultiplier={1.3}>
              {fact}
            </Text>
          </View>
        ))}
      </ScrollView>

      {facts.length > 1 && (
        <View style={styles.dotsRow}>
          {facts.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// Animated & Unique Section Item Card
const GuideItem = ({
  section,
  index,
  festivalName,
  isVisited,
  onPress,
}: {
  section: { title: string; value: string };
  index: number;
  festivalName: string;
  isVisited: boolean;
  onPress: () => void;
}) => {
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const handleTextLayout = useCallback((e: any) => {
    if (e.nativeEvent.lines.length > 2) {
      setIsTruncated(true);
    }
  }, []);

  const cfg = SECTION_CONFIG[section.title] || {
    icon: 'sparkles',
    accent: '#C2410C',
    bgGradient: ['#FFF7ED', '#FFEDD5'],
    emoji: '🪔',
    stripColor: '#EA580C',
  };

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
      <TouchableOpacity
        style={[
          styles.guideItem,
          isVisited && styles.guideItemVisited,
          IS_SMALL_SCREEN && styles.guideItemCompact,
        ]}
        activeOpacity={0.92}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       accessibilityRole="button" accessibilityLabel="Button">
        {/* Decorative Top Accent Strip */}
        <View style={[styles.cardAccentStrip, { backgroundColor: cfg.stripColor }]} />

        {/* Custom Icon Box */}
        <LinearGradient
          colors={cfg.bgGradient}
          style={styles.guideIconBox}
        >
          <Text style={styles.guideEmoji}>{cfg.emoji}</Text>
        </LinearGradient>

        {/* Text Details */}
        <View style={styles.guideTextContainer}>
          <View style={styles.guideHeaderRow}>
            <Text style={[styles.guideTitle, { color: cfg.accent }]}>{section.title}</Text>
            {isVisited && (
              <View style={styles.visitedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#D4AF37" />
                <Text style={styles.visitedText}>Explored</Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={2}
            onTextLayout={handleTextLayout}
            style={styles.guideDescription}
            maxFontSizeMultiplier={1.3}
          >
            {section.value}
          </Text>
          {isTruncated && (
            <Text style={[styles.seeMore, { color: cfg.accent }]} maxFontSizeMultiplier={1.3}>
              Explore Section →
            </Text>
          )}
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={cfg.accent}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main Component
const FestivalDetailCard = ({ festival, onBack, onGuidePress, onRelatedFestivalPress }: FestivalDetailCardProps) => {
  const [visitedSections, setVisitedSections] = useState<string[]>([]);
  const festivalName = festival.festival_name || festival.name || 'Hariyali Teej';
  const festivalId = festival.id || festivalName;

  // Enrichments data mapping
  const enrichmentKey = (festivalName || '').toLowerCase();
  const enrichment = festivalEnrichments[enrichmentKey];

  // Dynamic section data per festival with distinct non-overlapping fields
  const rawStory = enrichment?.origin || festival.story || festival.origin || festival.summary;
  const rawAbout = enrichment?.summary || festival.summary;
  const rawPurpose = enrichment?.purpose || festival.purpose;
  const rawImportance = enrichment?.importance || festival.importance;
  const rawCelebration = enrichment?.celebration || festival.celebration;
  const rawPujaVidhi = festival.puja_vidhi || (festival.rituals ? (Array.isArray(festival.rituals) ? festival.rituals.join('. ') : festival.rituals) : null);
  const rawMantra = enrichment?.mantra || festival.mantra;

  const sections = [
    { title: 'Story',       value: rawStory },
    { title: 'About',       value: rawAbout },
    { title: 'Importance',  value: rawImportance },
    { title: 'Puja Vidhi',  value: rawPujaVidhi },
  ].filter((s) => Boolean(s.value));

  // Load visited sections progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(`@visited_${festivalId}`);
        if (stored) {
          setVisitedSections(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load visited sections', e);
      }
    };
    loadProgress();
  }, [festivalId]);

  const handleGuideSectionClick = (sectionTitle: string) => {
    if (!visitedSections.includes(sectionTitle)) {
      const updated = [...visitedSections, sectionTitle];
      setVisitedSections(updated);
      AsyncStorage.setItem(`@visited_${festivalId}`, JSON.stringify(updated)).catch(() => {});
    }
    onGuidePress?.(sectionTitle);
  };

  const funFacts: string[] = festival.funFacts ?? festival.fun_facts ?? [
    'Hariyali Teej is celebrated on the third day of the bright fortnight of the monsoon month Shravan.',
    'Green glass bangles and green sarees symbolize nature’s blooming beauty and marital bliss.',
    'Intricate Henna / Mehndi patterns applied on hands are believed to bring divine blessings.',
    'Lush tree swings (jhulas) are traditionally set up under banyan trees for women to sing Teej songs.'
  ];

  const deity = festival.deity || festival.deity_name || (festivalName.toLowerCase().includes('shiva') || festivalName.toLowerCase().includes('teej') ? 'Goddess Parvati & Lord Shiva' : 'Vedic Deities');
  const daysRemaining = calculateDaysRemaining(festival.date || '2026-08-15');
  const festivalImgAsset = getFestivalImage(festival);

  const completedCount = visitedSections.length;
  const totalCount = sections.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.page}>
      {/* Background Watermark Mehndi Motif Overlay */}
      <View style={styles.watermarkOverlay} pointerEvents="none">
        <Text style={styles.watermarkText}>☸ 🌿 🏵 🌿 ☸</Text>
      </View>

      {/* Cultural Hero Card */}
      <LinearGradient
        colors={['#8B0000', '#B22222', '#1E4620']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, IS_SMALL_SCREEN && styles.heroCardCompact]}
      >
        {/* Low-opacity Hero Image Background */}
        {festivalImgAsset && (
          <Image
            source={festivalImgAsset}
            style={styles.heroBackgroundImage}
            contentFit="cover"
          />
        )}
        <View style={styles.heroGradientOverlay} />

        {/* Top Badges Row */}
        <View style={styles.heroTopRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>🪔 SACRED FESTIVAL GUIDE</Text>
          </View>
          {daysRemaining && (
            <View style={styles.countdownBadge}>
              <Ionicons name="time" size={12} color="#FFD700" />
              <Text style={styles.countdownText}>{daysRemaining}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={[styles.heroTitle, IS_SMALL_SCREEN && styles.heroTitleCompact]}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={2}
        >
          {festivalName}
        </Text>

        {/* Deity & Date Row */}
        <View style={styles.deityDateContainer}>
          <View style={styles.deityBadge}>
            <Ionicons name="sparkles" size={13} color="#FFD700" />
            <Text style={styles.deityBadgeText}>{deity}</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={14} color="#FFD580" />
            <Text style={styles.heroDate}>{formatFestivalDate(festival.date || '2026-08-15')}</Text>
          </View>
        </View>

        {/* Gold Accent Divider */}
        <View style={styles.heroDivider} />

        <Text style={styles.heroHint}>
          🌿 Immerse yourself in divine mythology, rituals & monsoon traditions
        </Text>
      </LinearGradient>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressTitle}>Section Completion Tracker</Text>
            <Text style={styles.progressCount}>
              {completedCount} of {totalCount} Explored
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      )}

      {/* Reordered Guide Sections */}
      <View style={styles.guideSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Festival Guide Topics</Text>
          {sections.length > 0 && (
            <Text style={styles.sectionCount}>({sections.length} Topics)</Text>
          )}
        </View>

        {sections.map((section, index) => (
          <GuideItem
            key={section.title}
            section={section}
            index={index}
            festivalName={festivalName}
            isVisited={visitedSections.includes(section.title)}
            onPress={() => handleGuideSectionClick(section.title)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: '#FDFBF7',
    position: 'relative',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 40,
    right: 10,
    left: 10,
    opacity: 0.04,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 54,
    color: '#B8860B',
  },

  // Hero
  heroCard: {
    borderRadius: 22,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 22,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCardCompact: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(75, 0, 0, 0.45)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroPillText: {
    color: '#FFE4B5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: '#FFD700',
  },
  countdownText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: FONTS.brandTitle,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  deityDateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  deityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deityBadgeText: {
    color: '#FFF8E7',
    fontSize: 11.5,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDate: {
    color: '#FFD580',
    fontSize: 13,
    fontWeight: '600',
  },
  heroDivider: {
    height: 1.5,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: 10,
  },
  heroHint: {
    color: '#FFE4B5',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Progress Bar
  progressContainer: {
    backgroundColor: '#FFFBF0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: 14,
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#78350F',
    fontSize: 13,
    fontWeight: '700',
  },
  progressCount: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 3,
  },

  // Guide Section
  guideSection: {
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#451A03',
    fontSize: 17,
    fontWeight: '700',
  },
  goldBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  sectionCount: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '600',
  },

  // Guide Item Card
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  guideItemVisited: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFFDF5',
  },
  guideItemCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  guideIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  guideEmoji: {
    fontSize: 22,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  visitedText: {
    color: '#B83200',
    fontSize: 10,
    fontWeight: '700',
  },
  guideDescription: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
  seeMore: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'right',
  },
  chevron: {
    marginLeft: 8,
  },

  // Fun Facts / Carousel
  factsSection: {
    marginBottom: 20,
  },
  factsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factsScrollContent: {
    paddingRight: SPACING.md,
  },
  factCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    padding: 16,
    minHeight: 88,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  factCardDecor: {
    position: 'absolute',
    top: 4,
    right: 8,
    opacity: 0.15,
  },
  mandalaPattern: {
    fontSize: 12,
  },
  factIcon: {
    marginBottom: 6,
  },
  factText: {
    color: '#451A03',
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
  },
  dotActive: {
    backgroundColor: '#D97706',
    width: 18,
  },
});

export default FestivalDetailCard;


