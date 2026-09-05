import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';

export interface AartiItem {
  id: string;
  name: string;
  time: string;
  color?: string;
  positionPercent?: number;
}

interface DarshanAartiScheduleProps {
  openingTime?: string;
  closingTime?: string;
  generalDarshanText?: string;
  aartis?: AartiItem[];
  vipInfoText?: string;
}

const DEFAULT_AARTIS: AartiItem[] = [
  { id: 'mangala', name: 'Mangala Aarti', time: '4:00 AM', color: '#2563EB' },
  { id: 'bhog', name: 'Bhog Aarti', time: '1:00 PM', color: '#D97706' },
  { id: 'sandhya', name: 'Sandhya Aarti', time: '6:30 PM', color: '#7C3AED' },
];

/* Sub-component for Aarti row with spring press scaling interaction */
const AartiRow: React.FC<{
  item: AartiItem;
  index: number;
  isLast: boolean;
  accentColor: string;
}> = ({ item, index, isLast, accentColor }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View entering={FadeInRight.delay(100 + index * 80).duration(400)}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.aartiItemRow,
          !isLast && styles.aartiBorderBottom,
          pressed && { backgroundColor: '#F8FAFC' },
        ]}
      >
        <Animated.View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
          <View style={styles.aartiLeft}>
            <Text style={styles.aartiNameText}>{item.name}</Text>
          </View>

          <View style={[styles.aartiTimeBadge, { borderColor: `${accentColor}40` }]}>
            <Text style={styles.aartiTimeText}>{item.time}</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

/* Sub-component for Hero timing card with subtle press scale & pulse */
const HeroTimingCard: React.FC<{ openingTime: string; closingTime: string }> = ({
  openingTime,
  closingTime,
}) => {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View entering={FadeInDown.duration(450)}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.timingsCard, animatedCardStyle]}>
          <View style={styles.timingItem}>
            <View style={[styles.timingIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Animated.View style={animatedPulseStyle}>
                <Ionicons name="sunny" size={20} color="#D97706" />
              </Animated.View>
            </View>
            <View style={styles.timingTextContainer}>
              <Text style={styles.timingLabel}>Opening Time</Text>
              <Text style={styles.timingValue} numberOfLines={3}>{openingTime}</Text>
            </View>
          </View>

          <View style={styles.timingDivider} />

          <View style={styles.timingItem}>
            <View style={[styles.timingIconWrap, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="moon" size={18} color="#4F46E5" />
            </View>
            <View style={styles.timingTextContainer}>
              <Text style={styles.timingLabel}>Closing Time</Text>
              <Text style={styles.timingValue} numberOfLines={3}>{closingTime}</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const DarshanAartiSchedule: React.FC<DarshanAartiScheduleProps> = ({
  openingTime = '4:00 AM',
  closingTime = '9:00 PM',
  generalDarshanText,
  aartis = DEFAULT_AARTIS,
  vipInfoText = 'VIP / Special Darshan Available',
}) => {
  return (
    <View style={styles.container}>
      {/* SECTION TITLE */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="time" size={18} color="#D97706" />
        </View>
        <Text style={styles.sectionTitle}>Darshan & Aarti Schedule</Text>
      </View>

      {/* 1. HERO TIMINGS CARD (OPENING & CLOSING WITH PULSE & PRESS INTERACTION) */}
      <HeroTimingCard openingTime={openingTime} closingTime={closingTime} />

      {/* Optional General Darshan Info Banner */}
      {generalDarshanText ? (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.generalDarshanBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#2563EB" style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={styles.generalDarshanText}>
            General Darshan: <Text style={styles.generalDarshanBold}>{generalDarshanText}</Text>
          </Text>
        </Animated.View>
      ) : null}

      {/* 2. DAILY AARTI TIMINGS LIST WITH STAGGERED ENTRANCE & PRESS SCALE */}
      <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.aartiCardContainer}>
        <Text style={styles.aartiCardHeader}>Daily Aarti & Rituals</Text>

        <View style={styles.aartiList}>
          {aartis.map((item, index) => {
            const isLast = index === aartis.length - 1;
            const accentColor = item.color || '#D97706';

            return (
              <AartiRow
                key={item.id || `${item.name}-${index}`}
                item={item}
                index={index}
                isLast={isLast}
                accentColor={accentColor}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* 3. VIP & SPECIAL DARSHAN INFO BANNER */}
      {vipInfoText ? (
        <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.vipCard}>
          <View style={styles.vipBadgeIcon}>
            <Ionicons name="sparkles" size={16} color="#059669" />
          </View>
          <View style={{ flex: 1, flexShrink: 1 }}>
            <Text style={styles.vipTitle}>VIP & Special Queue</Text>
            <Text style={styles.vipSubtext}>{vipInfoText}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  /* 1. Hero Timings Card */
  timingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  timingTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  timingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  timingDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    flexShrink: 0,
  },

  /* General Darshan Banner */
  generalDarshanBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  generalDarshanText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
  generalDarshanBold: {
    fontWeight: '700',
    color: '#1E3A8A',
  },

  /* 2. Aarti Timings Container */
  aartiCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  aartiCardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  aartiList: {
    flexDirection: 'column',
  },
  aartiItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  aartiBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  aartiLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  aartiNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
  aartiTimeBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 1,
    maxWidth: '55%',
  },
  aartiTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    flexWrap: 'wrap',
  },

  /* 3. VIP Banner */
  vipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vipBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  vipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  vipSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
});

