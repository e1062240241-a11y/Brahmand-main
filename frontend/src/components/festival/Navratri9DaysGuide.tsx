import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { NAVDURGA_9_DAYS, NavdurgaDayDetail } from '../../data/navdurgaDaysData';
import { BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { shareNavratriDayPdf } from '../../utils/generateNavratriDayPdf';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');



// Real high-definition floral illustrations for each day matching the uploaded flower photos
const FLOWER_ASSETS: Record<number, any> = {
  1: require('../../../assets/images/navdurga_cards/flower_hd_1.png'),
  2: require('../../../assets/images/navdurga_cards/flower_hd_2.png'),
  3: require('../../../assets/images/navdurga_cards/flower_hd_3.png'),
  4: require('../../../assets/images/navdurga_cards/flower_hd_4.png'),
  5: require('../../../assets/images/navdurga_cards/flower_hd_5.png'),
  6: require('../../../assets/images/navdurga_cards/flower_hd_6.png'),
  7: require('../../../assets/images/navdurga_cards/flower_hd_7.png'),
  8: require('../../../assets/images/navdurga_cards/flower_hd_8.png'),
  9: require('../../../assets/images/navdurga_cards/flower_hd_9.png'),
};

// 100% Solid opaque pastel background for each day's card (Zero alpha transparency to eliminate Android Skia anti-aliasing edge artifacts)
const SOLID_CARD_BG: Record<number, string> = {
  1: '#FFFBEB', // Day 1: Yellow (soft warm cream)
  2: '#FAFAFA', // Day 2: White (clean off-white)
  3: '#FEF2F2', // Day 3: Red (soft blush rose)
  4: '#EFF6FF', // Day 4: Royal Blue (soft ice blue)
  5: '#FFEDD5', // Day 5: Orange (subtle warm orange)
  6: '#F0FDF4', // Day 6: Green (soft fresh mint)
  7: '#F3F4F6', // Day 7: Grey (soft silver slate)
  8: '#FAF5FF', // Day 8: Purple (soft lavender)
  9: '#F0FDFA', // Day 9: Peacock Green (soft teal)
};

// Golden ornamental lotus flourish at bottom of card (— 🪷 —)
const GoldenFlourish: React.FC = () => (
  <View style={styles.flourishContainer} pointerEvents="none">
    <View style={styles.flourishLine} />
    <Svg width={14} height={10} viewBox="0 0 16 12">
      <Path
        d="M8 1 Q10 5 13 4 Q11 8 8 10 Q5 8 3 4 Q6 5 8 1 Z"
        fill="#D4AF37"
        opacity={0.85}
      />
    </Svg>
    <View style={styles.flourishLine} />
  </View>
);

interface Navratri9DaysGuideProps {
  festivalDate?: string;
  onBack?: () => void;
  onJaapPress?: (mantra: string) => void;
}

export const Navratri9DaysGuide: React.FC<Navratri9DaysGuideProps> = ({
  festivalDate,
  onBack,
  onJaapPress,
}) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const userName = user?.name ? user.name.split(' ')[0] : 'भक्त';

  // Determine today's Navratri day index (0 to 8) based on actual dates
  // Only returns a valid index if Navratri has actually started and is ongoing
  const todayFestivalDayIndex = useMemo(() => {
    // If festivalDate prop is provided, parse it; otherwise check current year's Navratri date
    let festDate: Date | null = null;
    if (festivalDate) {
      const parsed = new Date(festivalDate);
      if (!isNaN(parsed.getTime())) festDate = parsed;
    }

    // Fallback: If no valid festivalDate passed or invalid, use current year's Sharad Navratri (e.g. 11 Oct 2026)
    if (!festDate) {
      const thisYear = new Date().getFullYear();
      festDate = new Date(`${thisYear}-10-11T00:00:00`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    festDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((today.getTime() - festDate.getTime()) / (1000 * 60 * 60 * 24));
    // Only return 0..8 if festival is currently ongoing (diff >= 0 and diff < 9)
    if (diff >= 0 && diff < 9) return diff;
    return -1; // Festival hasn't started yet or has ended (do NOT show fake 'आज')
  }, [festivalDate]);

  // Default selected day: if festival is live, select today's day; otherwise default to Day 1 (index 0)
  const initialDayIndex = todayFestivalDayIndex >= 0 ? todayFestivalDayIndex : 0;

  // Screen modes: 'color_select' (step 1: choose colour) | 'devi_detail' (step 2: view devi photo, name & details)
  const [viewMode, setViewMode] = useState<'color_select' | 'devi_detail'>('color_select');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(-1);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);

  // Guided tour sequence: Cycles through cards slowly and smoothly, then stops and settles on today's card
  const [animatedFocusIndex, setAnimatedFocusIndex] = useState<number>(0);
  const [isTourActiveState, setIsTourActiveState] = useState<boolean>(true);
  const [showColorText, setShowColorText] = useState<boolean>(true);

  const arrowBounceAnim = useRef(new Animated.Value(0)).current;
  const arrowGlowAnim = useRef(new Animated.Value(0.5)).current;
  const borderPulseAnim = useRef(new Animated.Value(0.6)).current;

  // Active day index throughout the day (Day 1..9 based on festival date, default Day 1)
  const activeFestivalDayIndex = todayFestivalDayIndex >= 0 ? todayFestivalDayIndex : 0;

  useEffect(() => {
    if (viewMode !== 'color_select') return;

    // Reset visibility flags when entering color_select screen
    setIsTourActiveState(true);
    setShowColorText(true);

    // Color text shows for 1 second, then disappears
    const colorTimer = setTimeout(() => {
      setShowColorText(false);
    }, 1000);

    // Smooth & relaxed card switching: each card stays highlighted for 1.1s so user can clearly see it
    const cycleInterval = setInterval(() => {
      setAnimatedFocusIndex((prev) => (prev + 1) % NAVDURGA_9_DAYS.length);
    }, 1100);

    // Tour runs for 4.5 seconds (relaxed intro), then stops completely and lands on today's card
    const tourTimer = setTimeout(() => {
      setIsTourActiveState(false);
    }, 4500);

    // Gentle upward float / bounce for the arrow
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounceAnim, {
          toValue: -5,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounceAnim, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    );

    // Glowing opacity breathing pulse for the arrow and card border
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(arrowGlowAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(borderPulseAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(arrowGlowAnim, {
            toValue: 0.45,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(borderPulseAnim, {
            toValue: 0.5,
            duration: 550,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    bounceLoop.start();
    glowLoop.start();

    return () => {
      clearTimeout(colorTimer);
      clearTimeout(tourTimer);
      clearInterval(cycleInterval);
      bounceLoop.stop();
      glowLoop.stop();
    };
  }, [viewMode]);

  // Eagerly pre-warm all 9 Devi image assets into memory cache on mount
  React.useEffect(() => {
    NAVDURGA_9_DAYS.forEach((item) => {
      if (item.localImage) {
        Image.prefetch(item.localImage).catch(() => { });
      } else if (item.emblemUri) {
        Image.prefetch(item.emblemUri).catch(() => { });
      }
    });
  }, []);

  const activeDay: NavdurgaDayDetail = NAVDURGA_9_DAYS[selectedDayIndex] || NAVDURGA_9_DAYS[0];
  const todayNavdurgaDay = todayFestivalDayIndex >= 0
    ? NAVDURGA_9_DAYS[todayFestivalDayIndex]
    : NAVDURGA_9_DAYS[0];

  const handleSelectColorCard = (index: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) { }
    setSelectedDayIndex(index);
    setIsDescExpanded(false);
    setViewMode('devi_detail');
  };

  const handleBackToColorSelect = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) { }
    setIsDescExpanded(false);
    setViewMode('color_select');
  };

  const handleShareDay = async (targetDay?: NavdurgaDayDetail) => {
    if (isSharingPdf) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) { }

    // If targetDay passed, use it. Otherwise, if in devi detail view use activeDay, or if in color select view use today's festival day (or activeDay if outside festival)
    const dayToShare = targetDay || (viewMode === 'devi_detail' ? activeDay : (todayFestivalDayIndex >= 0 ? todayNavdurgaDay : activeDay));
    setIsSharingPdf(true);
    try {
      await shareNavratriDayPdf(dayToShare);
    } catch (shareErr) {
      console.warn('[Navratri] PDF share error:', shareErr);
    } finally {
      setIsSharingPdf(false);
    }
  };

  // ==========================================
  // VIEW 1: COLOR SELECTION SCREEN (STEP 1)
  // Personalised & Spiritual Palette Hub
  // ==========================================
  if (viewMode === 'color_select') {
    const isTodayWhite = todayNavdurgaDay.colorHex === '#FFFFFF' || todayNavdurgaDay.colorHex === '#EEEEEE';

    return (
      <ScrollView
        style={styles.colorSelectScroll}
        contentContainerStyle={[
          styles.colorSelectScrollInner,
          { paddingTop: Math.max(insets.top + 8, 16) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Top Header Row with Transparent Back Button & Transparent Icon-only Share Button */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.headerBackButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={24} color="#7C2D12" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleShareDay(todayFestivalDayIndex >= 0 ? todayNavdurgaDay : activeDay)}
            style={styles.cornerShareButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isSharingPdf}
            accessibilityRole="button"
            accessibilityLabel={`Share ${todayFestivalDayIndex >= 0 ? todayNavdurgaDay.deviName : activeDay.deviName} Navratri guide PDF`}
          >
            {isSharingPdf ? (
              <ActivityIndicator size="small" color="#7C2D12" />
            ) : (
              <Ionicons name="share-social-outline" size={22} color="#7C2D12" />
            )}
          </TouchableOpacity>
        </View>

        {/* Header Title: किसी भी दिन का रंग चुनें और माँ के स्वरूप का दर्शन करें */}
        <View style={styles.allColorsHeaderRow}>
          <View style={styles.promptHeaderCenterCol}>
            <Text style={styles.colorSelectPromptSub}>
              किसी भी दिन का रंग चुनें और माँ के स्वरूप का दर्शन करें
            </Text>
          </View>
        </View>

        {/* 9 Colors Grid - 3 Sets of 3 Days with distinct spacing between each set */}
        <View style={styles.colorsGridContainer}>
          {[0, 1, 2].map((setIndex) => {
            const setDays = NAVDURGA_9_DAYS.slice(setIndex * 3, setIndex * 3 + 3);

            return (
              <View
                key={`set-${setIndex}`}
                style={[
                  styles.colorSetRow,
                  setIndex > 0 && styles.colorSetRowMargin,
                ]}
              >
                {setDays.map((item, localIdx) => {
                  const idx = setIndex * 3 + localIdx;
                  const isToday = idx === todayFestivalDayIndex;
                  const isSelected = idx === selectedDayIndex;

                  // Day-specific badge background derived directly from item.colorHex
                  const badgeBg = item.colorHex;
                  const badgeTextColor = item.day === 2 ? '#374151' : '#FFFFFF';

                  // Soft watercolor wave gradient colors at the bottom of each card
                  const waveGradients: Record<number, [string, string]> = {
                    1: ['rgba(254, 240, 138, 0)', 'rgba(251, 191, 36, 0.38)'],
                    2: ['rgba(243, 244, 246, 0)', 'rgba(209, 213, 219, 0.45)'],
                    3: ['rgba(254, 202, 202, 0)', 'rgba(248, 113, 113, 0.38)'],
                    4: ['rgba(191, 219, 254, 0)', 'rgba(96, 165, 250, 0.38)'],
                    5: ['rgba(254, 215, 170, 0)', 'rgba(251, 146, 60, 0.38)'],
                    6: ['rgba(187, 247, 208, 0)', 'rgba(74, 222, 128, 0.35)'],
                    7: ['rgba(226, 232, 240, 0)', 'rgba(148, 163, 184, 0.42)'],
                    8: ['rgba(243, 232, 255, 0)', 'rgba(192, 132, 252, 0.38)'],
                    9: ['rgba(204, 251, 241, 0)', 'rgba(45, 212, 191, 0.38)'],
                  };
                  const currentWave = waveGradients[item.day] || ['rgba(254, 215, 170, 0)', 'rgba(251, 146, 60, 0.3)'];
                  const flowerSource = FLOWER_ASSETS[item.day];

                  // 100% Solid opaque background - completely prevents Android edge artifacting
                  const cardBg = SOLID_CARD_BG[item.day] || '#FFFFFF';

                  const isTourActive = isTourActiveState && idx === animatedFocusIndex;
                  const isDayPersistentActive = !isTourActiveState && idx === activeFestivalDayIndex;

                  return (
                    <TouchableOpacity
                      key={item.day}
                      onPress={() => handleSelectColorCard(idx)}
                      activeOpacity={0.85}
                      style={[
                        styles.colorCard,
                        { backgroundColor: cardBg },
                        isTourActive && styles.colorCardTourBorder,
                        isDayPersistentActive && styles.colorCardTodayGoldBorder,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Day ${item.day} ${item.colorName} ${item.deviName}`}
                    >
                      {/* 1. Top-Left Circular Number Badge */}
                      <View
                        style={[
                          styles.dayNumberBadge,
                          { backgroundColor: badgeBg },
                          item.day === 2 && styles.dayTwoWhiteBadge,
                        ]}
                      >
                        <Text style={[styles.dayNumberBadgeText, { color: badgeTextColor }]}>
                          {item.day}
                        </Text>
                      </View>

                      {/* 2. Ribbon Tag: Only shows 'आज' if today matches */}
                      {isToday && (
                        <View style={styles.todayRibbonTag}>
                          <Text style={styles.todayRibbonText}>आज</Text>
                        </View>
                      )}

                      {/* 3. Center Flower Illustration */}
                      <View style={styles.cardIllustrationBox}>
                        {flowerSource && (
                          <Image
                            source={flowerSource}
                            style={[
                              styles.flowerImage,
                              (item.day === 7 || item.day === 8 || item.day === 9) && styles.flowerImageLarger,
                            ]}
                            contentFit="contain"
                          />
                        )}
                      </View>

                      {/* 4. Bottom Content: Color Name, Devi Name & Lotus Flourish */}
                      <View style={styles.cardBottomContent}>
                        <Text style={styles.colorCardTitle}>
                          {item.colorName.includes(' (') ? item.colorName.split(' (')[0] : item.colorName}
                        </Text>
                        {item.colorNameEn ? (
                          <Text style={styles.colorCardTitleEn}>
                            ({item.colorNameEn})
                          </Text>
                        ) : null}
                        <Text style={styles.colorCardSubTitle} numberOfLines={2}>
                          {item.deviName.replace('माँ ', '')}
                        </Text>
                        <GoldenFlourish />
                      </View>

                      {/* 7. Bottom Curved Color Accent Wave */}
                      <View style={styles.cardBottomWaveContainer} pointerEvents="none">
                        <LinearGradient
                          colors={currentWave}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />
                        {/* Subtle curved edge path */}
                        <Svg width="100%" height={24} viewBox="0 0 100 24" preserveAspectRatio="none">
                          <Path
                            d="M0 24 C30 8 70 8 100 24 L100 24 L0 24 Z"
                            fill={currentWave[1]}
                            opacity={0.3}
                          />
                        </Svg>
                      </View>

                      {/* Animated Glowing Up-Arrow Indicator at bottom of card */}
                      {isTourActive && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.cardBottomArrowBadge,
                            {
                              opacity: arrowGlowAnim,
                              transform: [{ translateY: arrowBounceAnim }],
                            },
                          ]}
                        >
                          <Ionicons name="chevron-up" size={14} color="#FFFFFF" />
                        </Animated.View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Devotional Inline Hint Banner: Borderless, shows Today's Color (1s only) & Devi Name (permanent) */}
        <View style={styles.clickHintBannerContainer}>
          {showColorText && (
            <View style={styles.todayColorTitleRow}>
              <View style={[styles.todayColorDot, { backgroundColor: todayNavdurgaDay.colorHex }]} />
              <Text style={styles.todayColorLabel}>
                {todayFestivalDayIndex >= 0 ? 'Today' : 'Day 1'} — {todayNavdurgaDay.colorName.includes(' (') ? todayNavdurgaDay.colorName.split(' (')[0] : todayNavdurgaDay.colorName}{todayNavdurgaDay.colorNameEn ? ` (${todayNavdurgaDay.colorNameEn})` : ''}
              </Text>
            </View>
          )}
          <Text style={styles.todayDeviNameText}>
            🌸 {todayNavdurgaDay.deviName} 🪷
          </Text>
          <Text style={styles.clickHintSubText}>
            Tap any <Text style={styles.clickHintHighlight}>Roop</Text> above to explore Her sacred <Text style={styles.clickHintHighlight}>Divine Form</Text>, <Text style={styles.clickHintHighlight}>Mantra</Text> & <Text style={styles.clickHintHighlight}>Katha</Text>
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ==========================================
  // VIEW 2: DEVI DETAIL PAGE (STEP 2)
  // Story Page Reference Immersive Background
  // ==========================================
  const isWhiteDay = activeDay.colorHex === '#FFFFFF' || activeDay.colorHex === '#EEEEEE';
  const heroImage = activeDay.localImage || (activeDay.emblemUri ? { uri: activeDay.emblemUri } : null);

  return (
    <View style={styles.storyPageContainer}>
      {/* 1. Full-Screen Immersive Deity Artwork Background */}
      {heroImage ? (
        <Image
          source={heroImage}
          style={styles.storyFullScreenImage}
          contentFit="cover"
          contentPosition={{ top: '0%', left: '26%' }}
          cachePolicy="memory-disk"
          transition={250}
        />
      ) : (
        <LinearGradient
          colors={activeDay.gradientColors}
          style={styles.storyFullScreenImage}
        />
      )}

      {/* 2. Multi-stage Vignette & Deep Dark Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(3, 7, 18, 0.45)',
          'rgba(3, 7, 18, 0.12)',
          'rgba(3, 7, 18, 0.12)',
          'rgba(3, 7, 18, 0.85)',
          '#030712',
          '#030712',
        ]}
        locations={[0, 0.22, 0.45, 0.68, 0.84, 1]}
        style={styles.storyFullScreenGradient}
      />

      {/* 3. Floating Top Bar: Back Button & Share Button (Corner buttons only, no day pill) */}
      <View style={[styles.floatingTopBar, { top: insets.top + (Platform.OS === 'ios' ? 4 : 8) }]}>
        <TouchableOpacity
          onPress={handleBackToColorSelect}
          style={styles.floatingGlassIconBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Back to color selection"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleShareDay(activeDay)}
          style={styles.floatingGlassIconBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isSharingPdf}
          accessibilityRole="button"
          accessibilityLabel="Share today's devi and color PDF"
        >
          {isSharingPdf ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* 4. Upper Section: Artwork clearance + Devi Title & Significance + Fixed Horizontal Line */}
      <View style={styles.storyFixedHeaderSection}>
        {/* Spacer to let majestic artwork be admired */}
        <View
          style={{
            height: Platform.OS === 'ios' ? Math.round(SCREEN_HEIGHT * 0.32) : Math.round(SCREEN_HEIGHT * 0.28),
          }}
        />

        {/* Devi Title & Significance Header */}
        <View style={styles.deviTitleSection}>
          <Text style={styles.storyDeviHeading}>{activeDay.deviName}</Text>
          <Text style={styles.storyDeviEnglish}>{activeDay.deviNameEn}</Text>
          <Text style={styles.storyDeviSubtitle}>{activeDay.titleSubtitle}</Text>

          {activeDay.chakraOrPlanet ? (
            <View style={styles.chakraPillRow}>
              <Text style={styles.chakraPillText}>{activeDay.chakraOrPlanet}</Text>
            </View>
          ) : null}

          <Text
            style={styles.storyDeviSignificance}
            numberOfLines={isDescExpanded ? undefined : 2}
          >
            {activeDay.significance}
          </Text>

          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (_e) { }
              setIsDescExpanded((prev) => !prev);
            }}
            activeOpacity={0.7}
            style={styles.descToggleBtn}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Text style={styles.descToggleText}>
              {isDescExpanded ? 'कम पढ़ें (Show Less) ▲' : 'और पढ़ें (Show More) ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gold Flourish Divider (Acts as the fixed top ceiling boundary for scrollable text) */}
        <View style={styles.sacredDividerRow}>
          <View style={styles.sacredDividerLine} />
          <Text style={styles.sacredDividerSymbol}>❖</Text>
          <View style={styles.sacredDividerLine} />
        </View>
      </View>

      {/* 5. Scrollable Content Section: Scrolls strictly below the horizontal divider line */}
      <View style={styles.storyScrollAreaBelowDivider}>
        <ScrollView
          style={styles.storyScroll}
          contentContainerStyle={[
            styles.storyScrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 36 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Sacred Content Body: Clean Editorial Rows */}
          <View style={styles.storyContentBody}>
            {/* Section A: Daily Sacred Offerings (Bhog, Flower, Auspicious Color) */}
            <View style={styles.editorialSection}>
              <Text style={styles.editorialSectionHeader}>दैनिक पवित्र अर्पण</Text>

              {/* Bhog Row */}
              <View style={styles.editorialItemRow}>
                <Text style={styles.editorialItemIcon}>🍯</Text>
                <View style={styles.editorialItemTextCol}>
                  <Text style={styles.editorialItemLabel}>दैनिक नैवेद्य (BHOG)</Text>
                  <Text style={styles.editorialItemValue}>{activeDay.bhog}</Text>
                  {activeDay.bhogSignificance ? (
                    <Text style={styles.editorialItemSub}>{activeDay.bhogSignificance}</Text>
                  ) : null}
                </View>
              </View>

              {/* Flower Row */}
              <View style={styles.editorialItemRow}>
                <Text style={styles.editorialItemIcon}>🌺</Text>
                <View style={styles.editorialItemTextCol}>
                  <Text style={styles.editorialItemLabel}>प्रिय पुष्प (FLOWER)</Text>
                  <Text style={styles.editorialItemValue}>{activeDay.flower}</Text>
                </View>
              </View>

              {/* Auspicious Color Row */}
              <View style={styles.editorialItemRow}>
                <View
                  style={[
                    styles.editorialColorSwatch,
                    { backgroundColor: activeDay.colorHex },
                    isWhiteDay && { borderColor: '#D1D5DB' },
                  ]}
                />
                <View style={styles.editorialItemTextCol}>
                  <Text style={styles.editorialItemLabel}>शुभ रंग (COLOR)</Text>
                  <Text style={styles.editorialItemValue}>{activeDay.colorName}</Text>
                  {activeDay.colorMeaning ? (
                    <Text style={styles.editorialItemSub}>{activeDay.colorMeaning}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Section B: Siddha Mantra & Dhyan Shloka */}
            <View style={styles.editorialSection}>
              <Text style={styles.editorialSectionHeader}>
                {activeDay.deviName.toUpperCase()} सिद्ध मंत्र
              </Text>

              <View style={styles.mantraInlineBlock}>
                <Text style={styles.storyMantraText}>{activeDay.mantra}</Text>

                <Text style={styles.storyDhyanShlokaText}>{activeDay.dhyanShloka}</Text>

                {activeDay.stuti ? (
                  <View style={styles.sacredExtraMantraBox}>
                    <Text style={styles.sacredExtraMantraLabel}>स्तुति (Stuti)</Text>
                    <Text style={styles.sacredExtraMantraText}>{activeDay.stuti}</Text>
                  </View>
                ) : null}

                {activeDay.stotra ? (
                  <View style={styles.sacredExtraMantraBox}>
                    <Text style={styles.sacredExtraMantraLabel}>स्तोत्र (Stotra)</Text>
                    <Text style={styles.sacredExtraMantraText}>{activeDay.stotra}</Text>
                  </View>
                ) : null}

                {activeDay.vedicMantra ? (
                  <View style={styles.sacredExtraMantraBox}>
                    <Text style={styles.sacredExtraMantraLabel}>वैदिक गायत्री / मंत्र (Vedic Mantra)</Text>
                    <Text style={styles.sacredExtraMantraText}>{activeDay.vedicMantra}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Section C: Paawan Katha (Story) */}
            {activeDay.katha ? (
              <View style={styles.editorialSection}>
                <View style={styles.kathaHeaderRow}>
                  <Text style={styles.kathaHeaderIcon}>📜</Text>
                  <Text style={styles.editorialSectionHeader}>पावन कथा (Divine Legend)</Text>
                </View>

                <View style={styles.kathaTextContainer}>
                  <Text style={styles.kathaBodyText}>{activeDay.katha}</Text>
                </View>
              </View>
            ) : null}

            {/* Section D: Special Feature OR Puja Vidhi Ritual Steps */}
            {activeDay.specialFeature ? (
              <View style={styles.editorialSection}>
                <View style={styles.kathaHeaderRow}>
                  <Text style={styles.editorialSectionHeader}>
                    {activeDay.specialFeature.title}
                  </Text>
                </View>

                <View style={styles.specialFeatureContainer}>
                  {activeDay.specialFeature.items.map((item, idx) => {
                    const isLast = idx === activeDay.specialFeature!.items.length - 1;
                    return (
                      <View
                        key={item.heading}
                        style={[
                          styles.specialFeatureRow,
                          isLast ? { borderBottomWidth: 0, paddingBottom: 4 } : undefined,
                        ]}
                      >
                        <View style={styles.specialFeatureContentCol}>
                          <Text style={styles.specialFeatureHeading}>{item.heading}</Text>
                          <Text style={styles.specialFeatureDesc}>{item.desc}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : activeDay.ritualSteps && activeDay.ritualSteps.length > 0 ? (
              <View style={styles.editorialSection}>
                <View style={styles.kathaHeaderRow}>
                  <Text style={styles.editorialSectionHeader}>
                    पूजा विधि (Puja Vidhi)
                  </Text>
                </View>

                <View style={styles.ritualStepsList}>
                  {activeDay.ritualSteps.map((step) => (
                    <View key={step.step} style={styles.editorialRitualRow}>
                      <View style={styles.ritualStepNumberBadge}>
                        <Text style={styles.ritualStepNumberText}>{step.step}</Text>
                      </View>
                      <View style={styles.ritualStepContentCol}>
                        <Text style={styles.editorialRitualTitle}>{step.title}</Text>
                        <Text style={styles.editorialRitualDesc}>{step.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFDF9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 6,
  },
  headerIndiaLogo: {
    width: 18,
    height: 18,
  },
  badgePillText: {
    color: '#7C2D12',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cornerShareButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Color selection prompt header
  colorSelectPromptBox: {
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  colorSelectPromptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#431407',
    marginBottom: 3,
  },
  colorSelectPromptSub: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 18,
  },

  colorSelectScroll: {
    flex: 1,
    backgroundColor: '#FFF9EF',
  },
  colorSelectScrollInner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },

  // 1. Personal Devotee Greeting Container (Clean, no card background/border)
  personalGreetingContainer: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    marginBottom: 20,
    gap: 10,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  greetingNamaste: {
    fontSize: 17,
    fontWeight: '900',
    color: '#7C2D12',
    letterSpacing: -0.3,
  },
  greetingSubtitleTag: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#C2410C',
    marginTop: 2,
  },
  greetingDivider: {
    height: 1,
    backgroundColor: 'rgba(254, 215, 170, 0.7)',
    marginVertical: 2,
  },
  rashiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  rashiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  greetingParagraph: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19.5,
    fontWeight: '500',
  },
  greetingHighlightText: {
    fontWeight: '800',
    color: '#9A3412',
  },
  greetingColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 8,
    marginVertical: 2,
  },
  greetingColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  greetingColorText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#431407',
    flex: 1,
  },
  greetingColorNameText: {
    fontWeight: '900',
  },
  greetingPrayerText: {
    fontSize: 12.5,
    color: '#78350F',
    lineHeight: 18.5,
    fontWeight: '500',
  },
  greetingFooterRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(254, 215, 170, 0.7)',
  },
  greetingWishText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7C2D12',
    lineHeight: 18,
  },
  greetingBrandSignature: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
    marginTop: 4,
    textAlign: 'right',
  },

  // 2. Today's Recommended Color Hero Highlight Card
  todayHeroColorCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 210, 105, 0.4)',
  },
  todayHeroGradient: {
    padding: 16,
  },
  todayHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  todayLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveDotText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FCA5A5',
    letterSpacing: 0.5,
  },
  todayDayBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F6D269',
    backgroundColor: 'rgba(246, 210, 105, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayHeroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  todayHeroOrb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  todayHeroTextGroup: {
    flex: 1,
  },
  todayHeroColorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  todayHeroDeviTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F6D269',
    marginTop: 2,
  },
  todayHeroMeaning: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 3,
    lineHeight: 16.5,
  },
  todayHeroTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  todayHeroTapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
  },

  // 3. Section Header for Grid
  allColorsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  promptHeaderCenterCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  calendarMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 4,
  },
  calendarMiniChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A3412',
  },

  // 3-column Grid for 9 Colors matching reference image (3 rows / sets of 3)
  colorsGridContainer: {
    width: '100%',
  },
  colorSetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  colorSetRowMargin: {
    marginTop: 20, // Clean distinct breathing space between each 3-box set
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  colorCard: {
    width: '31.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 0,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 168,
  },
  colorCardSelectedHalo: {
    borderColor: '#D4AF37',
    borderWidth: 2,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  colorCardTourBorder: {
    borderColor: '#E11D48',
    borderWidth: 2,
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  colorCardTodayGoldBorder: {
    borderColor: '#D4AF37',
    borderWidth: 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  cardBottomArrowBadge: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  clickHintBannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  todayColorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 4,
  },
  todayColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  todayColorLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#9A3412',
    letterSpacing: -0.1,
  },
  todayDeviNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C2D12',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  clickHintSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  clickHintHighlight: {
    fontWeight: '800',
    color: '#9A3412',
  },
  dayNumberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    elevation: 3,
  },
  dayTwoWhiteBadge: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.1,
  },
  dayNumberBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  todayRibbonTag: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 12,
  },
  todayRibbonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardIllustrationBox: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  flowerImage: {
    width: 46,
    height: 46,
  },
  flowerImageLarger: {
    width: 52,
    height: 52,
  },
  cardBottomContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 2,
  },
  colorCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
    letterSpacing: -0.1,
    marginBottom: 1,
    lineHeight: 16,
  },
  colorCardTitleEn: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#57534E',
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: 2,
    lineHeight: 13,
  },
  colorCardSubTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
  },
  flourishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    gap: 4,
    width: '100%',
  },
  flourishLine: {
    width: 14,
    height: 1,
    backgroundColor: '#E5C378',
    opacity: 0.85,
  },
  cardBottomWaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },

  // Story Page Immersive Background Styles (Matching Festival Story Page)
  storyPageContainer: {
    backgroundColor: '#030712',
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
    justifyContent: 'space-between',
  },
  storyFullScreenImage: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 36 : 22,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: Math.round(SCREEN_HEIGHT * 0.62),
  },
  storyFullScreenGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: Math.round(SCREEN_HEIGHT * 0.72),
  },
  storyHeroSpacer: {
    height: Platform.OS === 'ios' ? Math.round(SCREEN_HEIGHT * 0.46) : Math.round(SCREEN_HEIGHT * 0.42),
  },
  topNotchShield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 35,
  },
  floatingTopBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingGlassIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDayPill: {
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  floatingDayPillText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.4,
  },
  storyFixedHeaderSection: {
    zIndex: 20,
  },
  storyScrollAreaBelowDivider: {
    flex: 1,
    zIndex: 10,
  },
  storyScroll: {
    flex: 1,
  },
  storyScrollContent: {
    paddingTop: 6,
  },
  deviTitleSection: {
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  storyDeviHeading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  storyDeviEnglish: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FED7AA',
    marginTop: 2,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  storyDeviSubtitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FDE68A',
    marginTop: 4,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chakraPillRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginTop: 8,
  },
  chakraPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 0.2,
  },
  storyDeviSignificance: {
    fontSize: 14.5,
    color: '#E5E7EB',
    lineHeight: 23,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  descToggleBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
  },
  descToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.2,
  },
  sacredDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    marginVertical: 14,
    gap: 12,
  },
  sacredDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
  },
  sacredDividerSymbol: {
    fontSize: 13,
    color: '#FBBF24',
    opacity: 0.8,
  },
  storyContentBody: {
    paddingHorizontal: 22,
    gap: 22,
  },
  editorialSection: {
    marginBottom: 4,
  },
  editorialSectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.2,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  editorialItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  editorialItemIcon: {
    fontSize: 22,
    marginRight: 14,
    marginTop: 2,
  },
  editorialColorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 14,
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  editorialItemTextCol: {
    flex: 1,
  },
  editorialItemLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  editorialItemValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  editorialItemSub: {
    fontSize: 12.5,
    color: '#9CA3AF',
    lineHeight: 18,
    marginTop: 3,
  },
  mantraInlineBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    paddingBottom: 16,
  },
  storyMantraText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFBEB',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 30,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255, 215, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  beejMantraInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  beejMantraLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  beejMantraText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  storyDhyanShlokaText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#FDE68A',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    fontWeight: '600',
    paddingHorizontal: 8,
    opacity: 0.95,
  },
  sacredExtraMantraBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  sacredExtraMantraLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sacredExtraMantraText: {
    fontSize: 14.5,
    color: '#F9FAFB',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  kathaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  kathaHeaderIcon: {
    fontSize: 18,
    marginBottom: 10,
  },
  kathaTextContainer: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    paddingBottom: 16,
  },
  kathaBodyText: {
    fontSize: 15,
    color: '#F3F4F6',
    lineHeight: 24.5,
    letterSpacing: 0.2,
    fontWeight: '400',
  },
  specialFeatureContainer: {
    paddingVertical: 4,
    gap: 4,
  },
  specialFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  specialFeatureIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  specialFeatureContentCol: {
    flex: 1,
  },
  specialFeatureHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FDE68A',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  specialFeatureDesc: {
    fontSize: 13.5,
    color: '#E5E7EB',
    lineHeight: 20.5,
    letterSpacing: 0.2,
  },
  ritualStepsList: {
    gap: 12,
  },
  editorialRitualRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  ritualStepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 14,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  ritualStepNumberText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ritualStepContentCol: {
    flex: 1,
  },
  editorialRitualTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
    lineHeight: 21,
  },
  editorialRitualDesc: {
    fontSize: 13.5,
    color: '#D1D5DB',
    lineHeight: 20,
  },

  // Detail Page Top Bar
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 5,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C2D12',
  },

  // Devi Hero Card with Photo and Title
  deviHeroCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  deviImageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  deviHeroImage: {
    width: '100%',
    height: '100%',
  },
  deviHeroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviHeroFallbackText: {
    fontSize: 48,
  },
  deviHeroColorPill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  deviHeroColorPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deviMetaContainer: {
    padding: 14,
  },
  deviNameHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5B1E0A',
    letterSpacing: -0.2,
  },
  deviNameEnglishBadge: {
    fontSize: 13,
    color: '#7C2D12',
    fontWeight: '600',
    marginTop: 2,
  },
  deviSubtitle: {
    fontSize: 13,
    color: '#9A3412',
    marginTop: 3,
    fontWeight: '600',
  },
  deviSignificanceText: {
    fontSize: 13,
    color: '#57534E',
    marginTop: 8,
    lineHeight: 19,
  },

  // Content Body & Clean Unboxed Info Rows
  contentBody: {
    paddingTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  infoTextContent: {
    flex: 1,
  },
  largeColorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 12,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircleLead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  leadEmoji: {
    fontSize: 14,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A3412',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  fieldMeaning: {
    fontSize: 13,
    color: '#57534E',
    lineHeight: 18,
    fontWeight: '400',
  },

  // Mantra Section
  mantraSection: {
    paddingVertical: 12,
  },
  mantraHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabelMantra: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mantraText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#451A03',
    textAlign: 'center',
    marginVertical: 4,
    lineHeight: 24,
  },
  dhyanShlokaText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#78350F',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
    fontWeight: '500',
  },

  // Rituals Section
  ritualsSection: {
    marginTop: 10,
  },
  ritualsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ritualsHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C2D12',
  },
  ritualStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ritualStepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ritualStepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C2D12',
  },
  ritualStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  ritualStepDesc: {
    fontSize: 13,
    color: '#57534E',
    marginTop: 2,
    lineHeight: 18,
  },

  // Hero Solid CTA Button
  heroCTAButton: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#C2410C',
    height: 52,
    justifyContent: 'center',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  heroCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  heroCTAIconsWrapper: {
    marginRight: 8,
  },
  heroCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
