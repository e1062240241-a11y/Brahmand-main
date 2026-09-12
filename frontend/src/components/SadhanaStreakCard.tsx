import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  usePassportStore,
  calculateSadhanaStreak,
  WeekDayStreakInfo,
} from '../store/passportStore';
import { useTranslation } from '../utils/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_H_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_H_MARGIN * 2;

export interface SadhanaStreakCardProps {
  onPressChant?: () => void;
}

export const SadhanaStreakCard: React.FC<SadhanaStreakCardProps> = ({ onPressChant }) => {
  const { language } = useTranslation();
  const router = useRouter();
  const isHindi = language === 'hi';

  const dailyHanuman = usePassportStore((state) => state.daily_hanuman_count) || {};
  const dailyOther = usePassportStore((state) => state.daily_other_jaap_count) || {};

  // Calculate streak data in IST
  const streakData = useMemo(() => {
    return calculateSadhanaStreak(dailyHanuman, dailyOther);
  }, [dailyHanuman, dailyOther]);

  const {
    currentStreak,
    isTodayCompleted,
    todayCount,
    weekDays,
  } = streakData;

  // Pulse animation for today's active dot: ONLY when todayCount > 0 (diya is lit) and incomplete
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // 🪔 Core Domain Rule: Diya flame pulse/glow only starts once user has performed jaap today!
    if (todayCount > 0 && !isTodayCompleted) {
      const pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 950,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 950,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 950,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 950,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(1);
    }
  }, [todayCount, isTodayCompleted, pulseAnim, glowAnim]);

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onPressChant) {
      onPressChant();
    } else {
      // Direct live experience route: open live jaap welcome
      router.push({
        pathname: '/live-jaap-welcome',
        params: { mantraType: 'hanuman', fromStreak: 'true' },
      });
    }
  };

  // Hindi day abbreviations
  const hindiDayLabels = ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'];

  // Status Chip Text & Styling
  // 🪔 Diya only reflects lit state when todayCount > 0 or completed
  let statusChipText = '';
  let statusChipType: 'complete' | 'in_progress' | 'unlit' = 'unlit';

  if (isTodayCompleted) {
    statusChipType = 'complete';
    statusChipText = isHindi ? '✨ दीप प्रज्वलित' : '✨ Diya Lit';
  } else if (todayCount > 0) {
    statusChipType = 'in_progress';
    const remaining = Math.max(0, 108 - todayCount);
    statusChipText = isHindi
      ? `🪔 ${remaining} शेष`
      : `🪔 ${remaining} left`;
  } else {
    statusChipType = 'unlit';
    statusChipText = isHindi ? 'दीप प्रज्वलित करें 🙏' : 'Light Diya Today 🙏';
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.outerContainer,
        Platform.OS === 'ios' && pressed && styles.cardPressed,
      ]}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={
        isHindi
          ? `साधना संकल्प: ${currentStreak} दिन`
          : `Sadhana Sankalpa: ${currentStreak} days`
      }
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 248, 238, 0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Top Header Row: Streak Title + Today's Status Chip */}
        <View style={styles.topRow}>
          <View style={styles.streakTitleWrap}>
            <Text
              style={[
                styles.diyaIcon,
                todayCount === 0 && !isTodayCompleted ? styles.diyaIconUnlit : styles.diyaIconLit,
              ]}
            >
              🪔
            </Text>
            <Text style={styles.streakTitleText}>
              {currentStreak > 0
                ? isHindi
                  ? `${currentStreak} दिवसीय संकल्प`
                  : `${currentStreak} Days Sankalpa`
                : isHindi
                ? 'साधना संकल्प'
                : 'Sadhana Sankalpa'}
            </Text>
          </View>

          <View
            style={[
              styles.statusChip,
              statusChipType === 'complete'
                ? styles.statusChipComplete
                : statusChipType === 'in_progress'
                ? styles.statusChipInProgress
                : styles.statusChipUnlit,
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                statusChipType === 'complete'
                  ? styles.statusTextComplete
                  : statusChipType === 'in_progress'
                  ? styles.statusTextInProgress
                  : styles.statusTextUnlit,
              ]}
              numberOfLines={1}
            >
              {statusChipText}
            </Text>
          </View>
        </View>

        {/* 7-Day Micro Tracker Row */}
        <View style={styles.weekRow}>
          {weekDays.map((day: WeekDayStreakInfo, index: number) => {
            const displayLabel = isHindi ? hindiDayLabels[index] : day.dayLabel;

            return (
              <View key={day.dateStr} style={styles.dayCol}>
                <Text
                  style={[
                    styles.dayLabel,
                    day.isToday && styles.dayLabelToday,
                  ]}
                >
                  {displayLabel}
                </Text>

                <View style={styles.dotSlot}>
                  {day.isToday && !day.isCompleted ? (
                    todayCount > 0 ? (
                      // 🪔 Diya is LIT with flame glow and pulsing animation
                      <Animated.View
                        style={[
                          styles.dotCircle,
                          styles.todayLitPendingDot,
                          {
                            transform: [{ scale: pulseAnim }],
                            opacity: glowAnim,
                          },
                        ]}
                      >
                        <Text style={styles.todayDiyaMiniLit}>🪔</Text>
                      </Animated.View>
                    ) : (
                      // 🪔 Diya is UNLIT: Waiting for user to perform their first chant today
                      <View style={[styles.dotCircle, styles.todayUnlitDot]}>
                        <Text style={styles.todayDiyaMiniUnlit}>🪔</Text>
                      </View>
                    )
                  ) : day.isCompleted ? (
                    <View style={[styles.dotCircle, styles.completedDot]}>
                      <Text style={styles.lotusMini}>🪷</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.dotCircle,
                        day.isFuture ? styles.futureDot : styles.pastEmptyDot,
                      ]}
                    >
                      <View
                        style={[
                          styles.innerEmptyPoint,
                          day.isFuture && styles.innerPointFuture,
                        ]}
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.28)',
    backgroundColor: '#FFF8F0',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  cardGradient: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  streakTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  diyaIcon: {
    fontSize: 14,
  },
  diyaIconLit: {
    opacity: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
      android: {},
    }),
  },
  diyaIconUnlit: {
    opacity: 0.38,
  },
  streakTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#882E06',
    letterSpacing: 0.2,
  },
  statusChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 0.8,
  },
  statusChipComplete: {
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderColor: 'rgba(34, 197, 94, 0.32)',
  },
  statusChipInProgress: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.42)',
  },
  statusChipUnlit: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.22)',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  statusTextComplete: {
    color: '#15803D',
  },
  statusTextInProgress: {
    color: '#B45309',
  },
  statusTextUnlit: {
    color: '#9A3412',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 1,
  },
  dayCol: {
    alignItems: 'center',
    gap: 3,
  },
  dayLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(124, 45, 18, 0.6)',
  },
  dayLabelToday: {
    color: '#C2410C',
    fontWeight: '900',
  },
  dotSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDot: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.2,
    borderColor: '#F59E0B',
    ...Platform.select({
      ios: {
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  lotusMini: {
    fontSize: 13,
  },
  todayLitPendingDot: {
    backgroundColor: 'rgba(255, 237, 213, 0.98)',
    borderWidth: 1.4,
    borderColor: '#EA580C',
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  todayDiyaMiniLit: {
    fontSize: 12,
  },
  todayUnlitDot: {
    backgroundColor: 'rgba(254, 243, 199, 0.25)',
    borderWidth: 1.1,
    borderColor: 'rgba(217, 119, 6, 0.32)',
    borderStyle: 'dashed',
  },
  todayDiyaMiniUnlit: {
    fontSize: 11,
    opacity: 0.32,
  },
  pastEmptyDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 0.8,
    borderColor: 'rgba(124, 45, 18, 0.18)',
  },
  futureDot: {
    backgroundColor: 'transparent',
    borderWidth: 0.8,
    borderColor: 'rgba(124, 45, 18, 0.10)',
    borderStyle: 'dashed',
  },
  innerEmptyPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(124, 45, 18, 0.22)',
  },
  innerPointFuture: {
    backgroundColor: 'rgba(124, 45, 18, 0.08)',
  },
});
