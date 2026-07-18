// accessibility: placeholder
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
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';

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

// ─── Responsive breakpoint (spec §10 — small screens ≤ 360dp) ────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_WIDTH <= 360;

// ─── Section Icon Mapping ─────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  About:       'information-circle-outline',
  Origin:      'globe-outline',
  Purpose:     'sparkles-outline',
  Importance:  'star-outline',
  Celebration: 'happy-outline',
  Mantra:      'musical-notes-outline',
};

// ─── Date Formatter ───────────────────────────────────────────────────────────
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

// ─── Fun Facts Carousel ("Did You Know?") ─────────────────────────────────────
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
          <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
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
        accessibilityRole="adjustable"
        accessibilityLabel="Festival trivia carousel"
      >
        {facts.map((fact, i) => (
          <View
            key={i}
            style={[
              styles.factCard,
              { width: FACT_CARD_WIDTH, marginRight: i === facts.length - 1 ? 0 : FACT_CARD_GAP },
            ]}
            accessibilityRole="text"
            accessibilityLabel={`Fun fact ${i + 1} of ${facts.length}: ${fact}`}
          >
            <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} style={styles.factIcon} />
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

// ─── Related Festivals Row ─────────────────────────────────────────────────────
const RelatedFestivalsRow = ({
  items,
  onPress,
}: {
  items: RelatedFestival[];
  onPress?: (item: RelatedFestival) => void;
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.relatedSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.factsHeadingRow}>
          <Ionicons name="albums-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionHeading}>Related Festivals</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.relatedScrollContent}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.id ?? item.name ?? i}
            style={styles.relatedCard}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onPress?.(item);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} — related festival`}
            accessibilityHint={`Opens details for ${item.name}`}
          >
            <Text style={styles.relatedEmoji}>{item.emoji ?? '🪔'}</Text>
            <Text style={styles.relatedName} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {item.name}
            </Text>
            {!!item.date && (
              <Text style={styles.relatedDate} numberOfLines={1}>
                {formatFestivalDate(item.date)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Animated Guide Item ──────────────────────────────────────────────────────
const GuideItem = ({
  section,
  index,
  festivalName,
  onPress,
}: {
  section: { title: string; value: string };
  index: number;
  festivalName: string;
  onPress: () => void;
}) => {
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  // Spec §10: "See more →" affordance only shown when preview text actually truncates
  const [isTruncated, setIsTruncated] = useState(false);

  // Stagger mount animation
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
    // Spec §8: light haptic tap on guide item press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  // Detect real truncation from the rendered text layout rather than guessing
  const handleTextLayout = useCallback((e: any) => {
    if (e.nativeEvent.lines.length > 2) {
      setIsTruncated(true);
    }
  }, []);

  const iconName = SECTION_ICONS[section.title] ?? 'chevron-forward-outline';

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
      <TouchableOpacity
        style={[styles.guideItem, IS_SMALL_SCREEN && styles.guideItemCompact]}
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${section.title} — tap to read full details`}
        accessibilityHint={`Opens the ${section.title} section of ${festivalName}`}
      >
        {/* Icon */}
        <View style={styles.guideIconBox}>
          <Ionicons name={iconName} size={22} color={COLORS.primary} />
        </View>

        {/* Text */}
        <View style={styles.guideTextContainer}>
          <Text style={styles.guideTitle}>{section.title}</Text>
          <Text
            numberOfLines={2}
            onTextLayout={handleTextLayout}
            style={styles.guideDescription}
            maxFontSizeMultiplier={1.3}
          >
            {section.value}
          </Text>
          {isTruncated && (
            <Text style={styles.seeMore} maxFontSizeMultiplier={1.3}>
              See more →
            </Text>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} style={styles.chevron} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FestivalDetailCard = ({ festival, onBack, onGuidePress, onRelatedFestivalPress }: FestivalDetailCardProps) => {
  const sections = [
    { title: 'About',       value: festival.summary },
    { title: 'Origin',      value: festival.origin },
    { title: 'Purpose',     value: festival.purpose },
    { title: 'Importance',  value: festival.importance },
    { title: 'Celebration', value: festival.celebration },
    { title: 'Mantra',      value: festival.mantra },
  ].filter((s) => s.value);

  // Optional enrichment data — supports either naming convention from the API,
  // renders nothing if absent so existing payloads are unaffected.
  const funFacts: string[] = festival.funFacts ?? festival.fun_facts ?? [];
  const relatedFestivals: RelatedFestival[] =
    festival.relatedFestivals ?? festival.related_festivals ?? [];

  return (
    <View style={styles.page}>
      {/* ── Hero Card ───────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#FF6600', '#D4430A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, IS_SMALL_SCREEN && styles.heroCardCompact]}
      >
        {/* Label pill */}
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>🏮  UPCOMING FESTIVAL</Text>
        </View>

        {/* Festival name */}
        <Text
          style={[styles.heroTitle, IS_SMALL_SCREEN && styles.heroTitleCompact]}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {festival.festival_name}
        </Text>

        {/* Date */}
        <Text style={styles.heroDate}>
          {formatFestivalDate(festival.date)}
        </Text>

        {/* Divider */}
        <View style={styles.heroDivider} />

        {/* Helper hint */}
        <Text style={styles.heroHint}>
          Tap a section below to explore the full guide
        </Text>
      </LinearGradient>

      {/* ── Did You Know? (fun facts / trivia) ─────────────────────────── */}
      <FunFactsCarousel facts={funFacts} />

      {/* ── Guide Section ───────────────────────────────────────────────── */}
      <View style={styles.guideSection}>
        {/* Section header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Festival Guide</Text>
          {sections.length > 0 && (
            <Text style={styles.sectionCount}>({sections.length})</Text>
          )}
        </View>

        {/* Empty state */}
        {sections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="information-circle-outline" size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>Festival details coming soon</Text>
          </View>
        ) : (
          sections.map((section, index) => (
            <GuideItem
              key={section.title}
              section={section}
              index={index}
              festivalName={festival.festival_name}
              onPress={() => onGuidePress?.(section.title)}
            />
          ))
        )}
      </View>

      {/* ── Related Festivals ───────────────────────────────────────────── */}
      <RelatedFestivalsRow items={relatedFestivals} onPress={onRelatedFestivalPress} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.background,
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 22,
    marginBottom: 20,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardCompact: {
    // Spec §10: small screens (≤360dp) — reduce hero padding
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  heroPillText: {
    color: '#FFE4B5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    fontFamily: FONTS.brandTitle,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroTitleCompact: {
    // Spec §10: cap festival name size on small screens
    fontSize: 26,
    lineHeight: 32,
  },
  heroDate: {
    color: '#FFD580',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 14,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginBottom: 12,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
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
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Fun Facts / "Did You Know?" Carousel
  factsSection: {
    marginBottom: 22,
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
    backgroundColor: '#FFF3E6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.15)',
    padding: 16,
    minHeight: 88,
    justifyContent: 'center',
  },
  factIcon: {
    marginBottom: 8,
  },
  factText: {
    color: '#4B3621',
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,102,0,0.25)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
  },

  // Related Festivals
  relatedSection: {
    marginTop: 4,
  },
  relatedScrollContent: {
    paddingRight: SPACING.md,
    gap: 10,
  },
  relatedCard: {
    width: 128,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: 10,
    alignItems: 'flex-start',
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  relatedEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  relatedName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  relatedDate: {
    color: '#FF6600',
    fontSize: 11,
    fontWeight: '500',
  },

  // Guide Item Card
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  guideItemCompact: {
    // Spec §10: small screens — compress internal padding
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  guideIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,102,0,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  guideDescription: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
  },
  seeMore: {
    color: '#FF6600',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'right',
  },
  chevron: {
    marginLeft: 8,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: SPACING.xl,
    gap: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FestivalDetailCard;
