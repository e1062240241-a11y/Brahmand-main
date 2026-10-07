import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NAVDURGA_9_DAYS, NavdurgaDayDetail } from '../../data/navdurgaDaysData';
import { BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialDayIndex);

  const activeDay: NavdurgaDayDetail = NAVDURGA_9_DAYS[selectedDayIndex] || NAVDURGA_9_DAYS[0];
  const todayNavdurgaDay = todayFestivalDayIndex >= 0 
    ? NAVDURGA_9_DAYS[todayFestivalDayIndex] 
    : NAVDURGA_9_DAYS[0];

  const handleSelectColorCard = (index: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}
    setSelectedDayIndex(index);
    setViewMode('devi_detail');
  };

  const handleBackToColorSelect = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    setViewMode('color_select');
  };

  const handleShareDay = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}
    const shareMessage = `🌸 शारदीय नवरात्रि • दिवस ${activeDay.day}\n` +
      `🔱 देवी स्वरूप: ${activeDay.deviName} (${activeDay.deviNameEn})\n` +
      `🎨 आज का शुभ रंग: ${activeDay.colorName} (${activeDay.colorNameEn})\n` +
      `🍯 दैनिक भोग: ${activeDay.bhog}\n` +
      `📿 सिद्ध मंत्र: ${activeDay.mantra}\n\n` +
      `शुभ नवरात्रि! डाउनलोड करें ब्रह्मांड (Sanatan Lok) 🚩`;

    try {
      await Share.share({
        message: shareMessage,
        title: `Navratri Day ${activeDay.day} - ${activeDay.deviName}`,
      });
    } catch (_err) {}
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
            onPress={handleShareDay}
            style={styles.cornerShareButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Share Navratri guide"
          >
            <Ionicons name="share-social-outline" size={22} color="#7C2D12" />
          </TouchableOpacity>
        </View>

        {/* 1. Personalised Devotee Welcome (Clean Text, No Card Background/Border) */}
        <View style={styles.personalGreetingContainer}>
          {/* Header: 🌺 जय माता दी, [नाम] 🙏 */}
          <View style={styles.greetingHeaderRow}>
            <View style={styles.greetingTitleContainer}>
              <Text style={styles.greetingNamaste}>
                🌺 जय माता दी{userName ? `, ${userName}` : ''} 🙏
              </Text>
            </View>
          </View>

          {/* Paragraph 1: आज माँ [देवी का नाम] की कृपा आपके जीवन में सुख, शांति और समृद्धि लेकर आए। ✨ */}
          <Text style={styles.greetingParagraph}>
            आज <Text style={styles.greetingHighlightText}>{todayNavdurgaDay.deviName}</Text> की कृपा आपके जीवन में{' '}
            <Text style={styles.greetingHighlightText}>सुख, शांति, आरोग्य और समृद्धि</Text> लेकर आए। ✨
          </Text>

          {/* Paragraph 2: माँ आपके हर संकल्प को शक्ति दें... */}
          <Text style={styles.greetingPrayerText}>
            माँ आपके हर संकल्प को शक्ति दें, हर प्रार्थना को विश्वास दें, और आपके जीवन को अपने पावन आशीर्वाद से भर दें। 🌸
          </Text>

          {/* Wish & Signature */}
          <View style={styles.greetingFooterRow}>
            <Text style={styles.greetingWishText}>
              आपको और आपके परिवार को नवरात्रि की हार्दिक शुभकामनाएँ।
            </Text>
            <Text style={styles.greetingBrandSignature}>— Brahmand 🙏</Text>
          </View>
        </View>

        {/* 3. Section Divider & All 9 Days Grid Header */}
        <View style={styles.allColorsHeaderRow}>
          <View>
            <Text style={styles.colorSelectPromptTitle}>नवरात्रि के ९ पावन रंग</Text>
            <Text style={styles.colorSelectPromptSub}>
              किसी भी दिन का रंग चुनें और माँ के स्वरूप का दर्शन करें
            </Text>
          </View>
        </View>

        {/* 4. 9 Colors Grid - Click to fill with respective colour */}
        <View style={styles.colorsGrid}>
          {NAVDURGA_9_DAYS.map((item, idx) => {
            const isWhiteColor = item.colorHex === '#FFFFFF' || item.colorHex === '#EEEEEE';
            const isToday = idx === todayFestivalDayIndex;
            const isSelected = idx === selectedDayIndex;

            // When selected, card is filled with its own vibrant color!
            const cardBgColor = isSelected ? item.colorHex : '#FFFFFF';
            const isDarkBackground = isSelected && !isWhiteColor;

            return (
              <TouchableOpacity
                key={item.day}
                onPress={() => handleSelectColorCard(idx)}
                activeOpacity={0.82}
                style={[
                  styles.colorCard,
                  { backgroundColor: cardBgColor },
                  isSelected && styles.colorCardFilledActive,
                  isSelected && isWhiteColor && { borderWidth: 1.5, borderColor: '#D1D5DB' },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Day ${item.day} ${item.colorName} ${item.deviName}${isSelected ? ' Selected' : ''}`}
              >
                {/* Ribbon Tag: Only shows 'आज' if Navratri has actually started and today matches this day */}
                {isToday && (
                  <View style={[
                    styles.todayRibbonTag,
                    isSelected && { backgroundColor: isWhiteColor ? '#EA580C' : '#FFFFFF' },
                  ]}>
                    <Text style={[
                      styles.todayRibbonText,
                      isSelected && !isWhiteColor && { color: item.colorHex },
                    ]}>
                      आज
                    </Text>
                  </View>
                )}

                {/* Large Color Swatch Circle */}
                <View
                  style={[
                    styles.colorCardSwatch,
                    {
                      backgroundColor: isSelected
                        ? (isWhiteColor ? '#F3F4F6' : '#FFFFFF')
                        : item.colorHex,
                    },
                    isWhiteColor && !isSelected && { borderWidth: 1.5, borderColor: '#D1D5DB' },
                  ]}
                >
                  <Text
                    style={[
                      styles.colorCardDayNumber,
                      {
                        color: isSelected
                          ? (isWhiteColor ? '#1C1917' : item.colorHex)
                          : (isWhiteColor ? '#1C1917' : '#FFFFFF'),
                      },
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>

                {/* Day & Color Name */}
                <Text
                  style={[
                    styles.colorCardTitle,
                    { color: isDarkBackground ? '#FFFFFF' : '#1C1917' },
                  ]}
                  numberOfLines={2}
                >
                  {item.colorName}
                </Text>
                <Text
                  style={[
                    styles.colorCardSubTitle,
                    { color: isDarkBackground ? 'rgba(255, 255, 255, 0.9)' : '#78716C' },
                  ]}
                  numberOfLines={1}
                >
                  {item.deviName.replace('माँ ', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
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
      {/* 1. Full-Screen Immersive Deity Artwork Background (Identical to Story Page) */}
      {heroImage ? (
        <Image
          source={heroImage}
          style={styles.storyFullScreenImage}
          contentFit="cover"
          contentPosition={{ top: '0%', left: '26%' }}
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={activeDay.gradientColors}
          style={styles.storyFullScreenImage}
        />
      )}

      {/* 2. Multi-stage Vignette & Deep Dark Gradient Overlay (Identical to Story Page) */}
      <LinearGradient
        colors={[
          'rgba(3, 7, 18, 0.55)',
          'rgba(3, 7, 18, 0.15)',
          'rgba(3, 7, 18, 0.15)',
          'rgba(3, 7, 18, 0.82)',
          '#030712',
          '#030712',
        ]}
        locations={[0, 0.22, 0.42, 0.62, 0.78, 1]}
        style={styles.storyFullScreenGradient}
      />

      {/* 3. Floating Top Bar: Back Button & Share Button */}
      <View style={[styles.floatingTopBar, { top: insets.top + (Platform.OS === 'ios' ? 10 : 8) }]}>
        <TouchableOpacity
          onPress={handleBackToColorSelect}
          style={styles.floatingBackButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to color selection"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShareDay}
          style={styles.floatingShareButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share today's devi and color"
        >
          <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 4. Scrollable Narrative & Ritual Content over the Background */}
      <ScrollView
        style={styles.storyScroll}
        contentContainerStyle={styles.storyScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Spacer allowing the majestic deity artwork to shine through */}
        <View style={styles.storyHeroSpacer} />

        {/* Devi Title Section */}
        <View style={styles.deviTitleSection}>
          <Text style={styles.storyDeviHeading}>{activeDay.deviName}</Text>
          <Text style={styles.storyDeviEnglish}>{activeDay.deviNameEn}</Text>
          <Text style={styles.storyDeviSubtitle}>{activeDay.titleSubtitle}</Text>
          <Text style={styles.storyDeviSignificance}>{activeDay.significance}</Text>
        </View>

        {/* Content Body Cards */}
        <View style={styles.storyContentCards}>
          {/* 1. Bhog Offering Card */}
          <View style={styles.storyGlassCard}>
            <View style={styles.storyIconLeadCircle}>
              <Text style={styles.leadEmoji}>🍯</Text>
            </View>
            <View style={styles.infoTextContent}>
              <Text style={styles.storyFieldLabel}>दैनिक नैवेद्य</Text>
              <Text style={styles.storyFieldValue}>{activeDay.bhog}</Text>
              <Text style={styles.storyFieldMeaning}>{activeDay.bhogSignificance}</Text>
            </View>
          </View>

          {/* 3. Favourite Flower Card */}
          <View style={styles.storyGlassCard}>
            <View style={styles.storyIconLeadCircle}>
              <Text style={styles.leadEmoji}>🌺</Text>
            </View>
            <View style={styles.infoTextContent}>
              <Text style={styles.storyFieldLabel}>प्रिय पुष्प</Text>
              <Text style={styles.storyFieldValue}>{activeDay.flower}</Text>
              <Text style={styles.storyFieldMeaning}>माँ भगवती को अर्पण कर आशीर्वाद प्राप्त करें</Text>
            </View>
          </View>

          {/* 4. Devi Siddha Mantra Card */}
          <View style={styles.storyMantraCard}>
            <View style={styles.mantraHeaderRow}>
              <Text style={styles.storyMantraHeaderLabel}>
                {activeDay.deviName.toUpperCase()} सिद्ध मंत्र
              </Text>
            </View>
            <Text style={styles.storyMantraText}>{activeDay.mantra}</Text>
            <Text style={styles.storyDhyanShlokaText}>{activeDay.dhyanShloka}</Text>
          </View>

          {/* 5. Puja Ritual Steps */}
          <View style={styles.storyRitualsCard}>
            <View style={styles.ritualsHeaderRow}>
              <Ionicons name="flame" size={17} color="#F97316" />
              <Text style={styles.storyRitualsHeading}>
                दिवस {activeDay.day} दैनिक पूजा विधि (Daily Ritual)
              </Text>
            </View>

            {activeDay.ritualSteps.map((step) => (
              <View key={step.step} style={styles.storyRitualStepItem}>
                <View style={styles.storyRitualStepBadge}>
                  <Text style={styles.storyRitualStepBadgeText}>{step.step}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.storyRitualStepTitle}>{step.title}</Text>
                  <Text style={styles.storyRitualStepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#FFFDF9',
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
    justifyContent: 'space-between',
    marginBottom: 12,
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

  // 3-column Grid for 9 Colors
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  colorCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  colorCardFilledActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 0,
    transform: [{ scale: 1.03 }],
  },
  todayRibbonTag: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  todayRibbonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  selectedRibbonTag: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#EA580C',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  colorCardSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  colorCardSwatchSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  colorCardDayNumber: {
    fontSize: 14,
    fontWeight: '900',
  },
  colorCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
  colorCardTitleSelected: {
    color: '#9A3412',
    fontWeight: '900',
  },
  colorCardSubTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78716C',
    textAlign: 'center',
    marginTop: 2,
  },

  // Story Page Reference Immersive Background Styles
  storyPageContainer: {
    backgroundColor: '#030712',
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
    justifyContent: 'space-between',
  },
  storyFullScreenImage: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 32,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.58,
  },
  storyFullScreenGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.70,
  },
  floatingTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 8,
    left: 14,
    right: 14,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingBackButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingShareButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyScroll: {
    flex: 1,
    zIndex: 10,
  },
  storyScrollContent: {
    paddingBottom: 80,
  },
  storyHeroSpacer: {
    height: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.48 : SCREEN_HEIGHT * 0.44,
  },
  deviTitleSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  deviDayPillRow: {
    marginBottom: 8,
  },
  storyDeviHeading: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  storyDeviEnglish: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FED7AA',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyDeviSubtitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#F3F4F6',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyDeviSignificance: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 22,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyContentCards: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyGlassCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  storyIconLeadCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  storyFieldLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyFieldValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyFieldMeaning: {
    fontSize: 13.5,
    color: '#D1D5DB',
    lineHeight: 19,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyMantraCard: {
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  storyMantraHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyMantraText: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#FFFBEB',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 28,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  storyDhyanShlokaText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#FDE68A',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 22,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyRitualsCard: {
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  storyRitualsHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FB923C',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyRitualStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storyRitualStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  storyRitualStepBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  storyRitualStepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storyRitualStepDesc: {
    fontSize: 13.5,
    color: '#D1D5DB',
    marginTop: 3,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
