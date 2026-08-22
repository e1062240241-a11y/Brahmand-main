import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInRight,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { getFestivalList } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AnimatedFestivalCardProps {
  fest: string;
  idx: number;
  onPress: () => void;
}

const AnimatedFestivalCard: React.FC<AnimatedFestivalCardProps> = ({ fest, idx, onPress }) => {
  const theme = FEST_THEMES[idx % FEST_THEMES.length];
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    // Subtle looping pulse animation on the icon badge
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [iconScale]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 10, stiffness: 180 });
  };

  return (
    <Animated.View entering={FadeInRight.delay(80 * idx).duration(350)}>
      <Animated.View style={cardAnimStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.uiverseCard,
            {
              backgroundColor: theme.bg,
              borderColor: theme.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Festival: ${fest}`}
        >
          <Animated.View style={[styles.uiverseIconBadge, { backgroundColor: theme.badgeBg }, iconAnimStyle]}>
            <Ionicons name={theme.iconName} size={18} color={theme.iconColor} />
          </Animated.View>
          <Text style={[styles.uiverseCardText, { color: theme.textColor }]}>
            {fest}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badgeBg: string;
}

export interface RouteTransportItem {
  type: 'air' | 'rail' | 'bus';
  label: string;
  distance: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

interface AboutTempleStoryProps {
  templeName?: string;
  subtitle?: string;
  introDescription?: string;
  significance?: string;
  history?: string;
  architecture?: string;
  festivals?: string[];
  airRoute?: string;
  railRoute?: string;
  busRoute?: string;
}

const FEST_THEMES = [
  { bg: '#FFF7ED', border: '#FFEDD5', badgeBg: '#FFEDD5', iconColor: '#EA580C', textColor: '#9A3412', iconName: 'sparkles-outline' as const },
  { bg: '#F0FDF4', border: '#DCFCE7', badgeBg: '#DCFCE7', iconColor: '#166534', textColor: '#166534', iconName: 'flame-outline' as const },
  { bg: '#EFF6FF', border: '#DBEAFE', badgeBg: '#DBEAFE', iconColor: '#2563EB', textColor: '#1D4ED8', iconName: 'calendar-outline' as const },
  { bg: '#F5F3FF', border: '#EDE9FE', badgeBg: '#EDE9FE', iconColor: '#7C3AED', textColor: '#6D28D9', iconName: 'flower-outline' as const },
  { bg: '#FDF2F8', border: '#FCE7F3', badgeBg: '#FCE7F3', iconColor: '#DB2777', textColor: '#9D174D', iconName: 'ribbon-outline' as const },
] as const;

const formatStringProp = (
  val: string | Record<string, unknown> | null | undefined,
  fallback: string = ''
): string => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.city || obj.state || obj.country) {
      return [obj.city, obj.state, obj.country].filter(Boolean).join(', ');
    }
    return JSON.stringify(val);
  }
  return String(val);
};

export const AboutTempleStory = React.memo<AboutTempleStoryProps>(({
  templeName = 'Shree Temple',
  subtitle = 'Sacred Pilgrimage Site',
  introDescription = 'A profound center of devotion, revered for centuries by millions of pilgrims.',
  significance = 'A holy pilgrimage center blessed with ancient spiritual heritage and divine grace.',
  history = 'Tracing its origins to ancient eras, the temple was sustained and restored across generations by devout patrons.',
  architecture = 'Constructed in traditional sacred temple architectural style featuring sanctified pillars and stone carvings.',
  festivals,
  airRoute = '',
  railRoute = '',
  busRoute = '',
}) => {
  const safeSubtitle = formatStringProp(subtitle, 'Sacred Pilgrimage Landmark');
  const safeIntro = formatStringProp(introDescription, 'A profound center of devotion.');
  const safeSignificance = formatStringProp(significance, 'A holy shrine blessed with sacred spiritual heritage and divine grace.');
  const safeHistory = formatStringProp(history, 'Tracing ancient origins, restored across generations by devout patrons.');
  const safeArchitecture = formatStringProp(architecture, 'Constructed in traditional temple architectural style with sacred stone carvings.');
  const safeAir = formatStringProp(airRoute, '');
  const safeRail = formatStringProp(railRoute, '');
  const safeBus = formatStringProp(busRoute, '');

  const router = useRouter();

  const handleFestPress = useCallback(async (festName: string) => {
    if (!festName) return;
    try {
      const response = await getFestivalList();
      const items: any[] = response?.data || [];
      const cleanTarget = festName.toLowerCase().replace(/[^a-z0-9]/g, '');

      let matchedIndex = items.findIndex((f: any) => {
        const name = (f?.name || f?.festival_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return name && (name === cleanTarget || name.includes(cleanTarget) || cleanTarget.includes(name));
      });

      if (matchedIndex >= 0) {
        router.push(`/festival-detail?index=${matchedIndex}`);
      }
    } catch {
      // Do nothing if festival is not found in master list
    }
  }, [router]);

  const safeFestivals = useMemo(() => {
    if (Array.isArray(festivals) && festivals.length > 0) {
      return festivals.map(f => {
        if (!f) return '';
        if (typeof f === 'string') return f.trim();
        if (typeof f === 'object' && f !== null) {
          const obj = f as Record<string, any>;
          const extracted = obj.name || obj.festival_name || obj.title || obj.festivalName || obj.label;
          if (typeof extracted === 'string') return extracted.trim();
        }
        return '';
      }).filter((item): item is string => Boolean(item) && item !== '[object Object]');
    }
    return [];
  }, [festivals]);

  const storyNodes = useMemo(() => {
    const rawNodes: StoryNode[] = [
      {
        id: 'significance',
        title: 'Mythological Significance',
        description: safeSignificance,
        iconName: 'sparkles',
        iconColor: '#D97706',
        badgeBg: '#FEF3C7',
      },
      {
        id: 'history',
        title: 'History & Heritage',
        description: safeHistory,
        iconName: 'time-outline',
        iconColor: '#475569',
        badgeBg: '#F1F5F9',
      },
      {
        id: 'architecture',
        title: 'Architecture & Style',
        description: safeArchitecture,
        iconName: 'color-palette-outline',
        iconColor: '#7C3AED',
        badgeBg: '#F5F3FF',
      },
    ];
    return rawNodes.filter((node) => node.description.trim().length > 0);
  }, [safeSignificance, safeHistory, safeArchitecture]);

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <Text style={styles.sectionHeaderTitle}>About Temple</Text>

      {/* 1. INTRO EDITORIAL SUBTITLE & DESCRIPTION */}
      <View style={styles.introBlock}>
        <Text style={styles.templeSubtitle}>{safeSubtitle}</Text>
        <Text style={styles.introParagraph}>{safeIntro}</Text>
      </View>

      {/* 2. STORY TIMELINE (VERTICAL CONNECTED RAIL) */}
      {storyNodes.length > 0 && (
        <View style={styles.timelineContainer}>
          {storyNodes.map((node, index) => {
            const isLast = index === storyNodes.length - 1;
            return (
              <View
                key={node.id}
                style={styles.storyRow}
                accessibilityRole="text"
                accessibilityLabel={`${node.title}: ${node.description}`}
              >
                {/* Left Column: Rail Line & Circle Badge */}
                <View style={styles.railColumn}>
                  <View style={[styles.nodeCircle, { backgroundColor: node.badgeBg }]}>
                    <Ionicons name={node.iconName} size={15} color={node.iconColor} />
                  </View>
                  {!isLast && <View style={styles.connectingLine} />}
                </View>

                {/* Right Column: Node Title & Description */}
                <View style={[styles.contentColumn, !isLast && { paddingBottom: 20 }]}>
                  <Text style={styles.nodeTitle}>{node.title}</Text>
                  <Text style={styles.nodeDescription}>{node.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 3. MAJOR FESTIVALS CELEBRATED (Scrollable Horizontal Pill Cards with Reanimated) */}
      {safeFestivals.length > 0 && (
        <Animated.View style={styles.festivalsBlock} entering={FadeInDown.duration(400)}>
          <Text style={styles.subHeadingTitle}>Major festivals</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableCardsRow}
          >
            {safeFestivals.map((fest, idx) => (
              <AnimatedFestivalCard
                key={`fest-card-${idx}`}
                fest={fest}
                idx={idx}
                onPress={() => handleFestPress(fest)}
              />
            ))}
          </Animated.ScrollView>
        </Animated.View>
      )}

      {/* 4. TRAVEL & HOW TO REACH (RESTORED CLASSIC CARDS) */}
      {(safeAir || safeRail || safeBus) ? (
        <View style={styles.travelSectionRestored}>
          <View style={styles.travelHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Travel & How to Reach</Text>
          </View>

          <View style={styles.transportCardsGrid}>
            {safeAir ? (
              <View
                style={styles.transportCardItem}
                accessibilityRole="text"
                accessibilityLabel={`By Air: ${safeAir}`}
              >
                <View style={[styles.transportIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="airplane-outline" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transportCardTitle}>By Air</Text>
                  <Text style={styles.transportCardValue}>{safeAir}</Text>
                </View>
              </View>
            ) : null}

            {safeRail ? (
              <View
                style={styles.transportCardItem}
                accessibilityRole="text"
                accessibilityLabel={`By Rail: ${safeRail}`}
              >
                <View style={[styles.transportIconBadge, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="train-outline" size={20} color="#166534" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transportCardTitle}>By Rail</Text>
                  <Text style={styles.transportCardValue}>{safeRail}</Text>
                </View>
              </View>
            ) : null}

            {safeBus ? (
              <View
                style={styles.transportCardItem}
                accessibilityRole="text"
                accessibilityLabel={`By Bus: ${safeBus}`}
              >
                <View style={[styles.transportIconBadge, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="bus-outline" size={20} color="#C2410C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transportCardTitle}>By Bus / Road</Text>
                  <Text style={styles.transportCardValue}>{safeBus}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
});

AboutTempleStory.displayName = 'AboutTempleStory';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 14,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  /* 1. Intro Editorial Subtitle & Description */
  introBlock: {
    marginBottom: 16,
  },
  templeSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  introParagraph: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  /* 2. Story Timeline (Vertical Rail) */
  timelineContainer: {
    marginBottom: 16,
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  railColumn: {
    width: 32,
    alignItems: 'center',
  },
  nodeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: -2,
    marginBottom: -2,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 4,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  nodeDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  /* 3. Uiverse Expanding Festival Cards */
  festivalsBlock: {
    marginBottom: 18,
  },
  subHeadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  scrollableCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
  },
  uiverseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  uiverseIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uiverseCardText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },

  /* 4. Restored Travel Section Cards */
  travelSectionRestored: {
    marginTop: 16,
  },
  travelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  transportCardsGrid: {
    gap: 10,
  },
  transportCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    padding: 12,
    gap: 12,
  },
  transportIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  transportCardValue: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

