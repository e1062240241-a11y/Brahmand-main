import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FestivalData } from '../../types/festival';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StaggerCardProps {
  index: number;
  isTriggered: boolean;
  children: React.ReactNode;
}

const StaggerCard: React.FC<StaggerCardProps> = ({ index, isTriggered, children }) => {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 24);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    if (isTriggered) {
      opacity.value = withDelay(
        index * 70,
        withTiming(1, {
          duration: 360,
          easing: Easing.out(Easing.cubic),
        })
      );
      translateY.value = withDelay(
        index * 70,
        withTiming(0, {
          duration: 380,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [isTriggered, index, reducedMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export interface StaggeredFestivalContentProps {
  festival: FestivalData;
  isHandoffStarted: boolean;
  onEventPress?: (eventId: string) => void;
  onAartiReminderPress?: (aartiId: string) => void;
  onJoinKathaPress?: () => void;
}

export const StaggeredFestivalContent: React.FC<StaggeredFestivalContentProps> = ({
  festival,
  isHandoffStarted,
  onEventPress,
  onAartiReminderPress,
  onJoinKathaPress,
}) => {
  const primaryColor = festival.gradientColors?.[0] || '#FF6600';
  const accentColor = festival.gradientColors?.[1] || '#E53935';

  // Format countdown days
  const getCountdown = () => {
    if (!festival.date) return 'Celebration Today';
    const festDate = new Date(festival.date);
    if (isNaN(festDate.getTime())) return festival.date;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    festDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((festDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Festivities Live Today!';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `${diffDays} Days Remaining`;
    return 'Celebrated this year';
  };

  const handleCardPress = (action?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    action?.();
  };

  return (
    <View style={styles.container}>
      {/* 1. Countdown Card */}
      <StaggerCard index={0} isTriggered={isHandoffStarted}>
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Countdown: ${getCountdown()}, Date: ${festival.date}`}
        >
          <LinearGradient
            colors={['rgba(255, 102, 0, 0.08)', 'rgba(255, 153, 51, 0.02)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}1A` }]}>
                <Ionicons name="time-outline" size={22} color={primaryColor} />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.cardSubTitle}>SACRED COUNTDOWN</Text>
                <Text style={styles.countdownTitle}>{getCountdown()}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${primaryColor}20` }]}>
                <Text style={[styles.statusPillText, { color: primaryColor }]}>SHUBH</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaInfoRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.metaLabel}>{festival.date || 'Tithi TBD'}</Text>
              </View>
              {festival.shubhMuhurat && (
                <View style={styles.metaItem}>
                  <Ionicons name="sparkles-outline" size={14} color="#B45309" />
                  <Text style={styles.metaLabel}>{festival.shubhMuhurat}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </StaggerCard>

      {/* 2. Aarti Schedule Card */}
      <StaggerCard index={1} isTriggered={isHandoffStarted}>
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Aarti and Puja Schedule"
        >
          <View style={styles.cardContentPadding}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flame-outline" size={22} color="#DC2626" />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.cardSubTitle}>TEMPLE TIMINGS</Text>
                <Text style={styles.cardTitle}>Aarti & Darshan Schedule</Text>
              </View>
            </View>

            <View style={styles.scheduleList}>
              {(festival.aartiSchedule && festival.aartiSchedule.length > 0
                ? festival.aartiSchedule
                : [
                    { id: '1', name: 'Mangala Aarti', time: '05:30 AM', priest: 'Acharya Sharma' },
                    { id: '2', name: 'Maha Bhog & Puja', time: '12:00 PM', priest: 'Head Pujari' },
                    { id: '3', name: 'Sandhya Maha Aarti', time: '07:00 PM', priest: 'Devotee Sangha', isImportant: true },
                  ]
              ).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.scheduleItem, item.isImportant && styles.scheduleItemHighlight]}
                  onPress={() => handleCardPress(() => onAartiReminderPress?.(item.id))}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} at ${item.time}. Tap to set a reminder.`}
                >
                  <View style={styles.scheduleTimeBadge}>
                    <Text style={styles.scheduleTimeText}>{item.time}</Text>
                  </View>
                  <View style={styles.scheduleTextGroup}>
                    <Text style={styles.scheduleName}>{item.name}</Text>
                    {item.priest && <Text style={styles.schedulePriest}>{item.priest}</Text>}
                  </View>
                  <Ionicons name="notifications-outline" size={18} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </StaggerCard>

      {/* 3. Katha Status Card */}
      <StaggerCard index={2} isTriggered={isHandoffStarted}>
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Live Katha Status and Broadcast"
        >
          <LinearGradient
            colors={['#FFFBEB', '#FEF3C7']}
            style={styles.cardContentPadding}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FDE68A' }]}>
                <Ionicons name="mic-outline" size={22} color="#B45309" />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.cardSubTitle}>DIVINE DISCOURSE</Text>
                <Text style={styles.cardTitle}>Live Katha & Shravan</Text>
              </View>
              {festival.kathaStatus?.isLive && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.kathaInfoBox}>
              <Text style={styles.kathaTitle}>
                {festival.kathaStatus?.title || `${festival.name} Mahatmya & Katha`}
              </Text>
              <Text style={styles.kathaSpeaker}>
                Speaker: {festival.kathaStatus?.speaker || 'Shri Rameshwar Das Ji'}
              </Text>
              {festival.kathaStatus?.currentChapter && (
                <Text style={styles.kathaChapter}>
                  Chapter: {festival.kathaStatus.currentChapter}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: primaryColor }]}
              onPress={() => handleCardPress(onJoinKathaPress)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Listen to Live Katha Audio"
            >
              <Ionicons name="volume-medium-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {festival.kathaStatus?.isLive ? 'Join Live Katha Stream' : 'Listen to Recorded Katha'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </StaggerCard>

      {/* 4. Community Events Card */}
      <StaggerCard index={3} isTriggered={isHandoffStarted}>
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Community Events and Gatherings"
        >
          <View style={styles.cardContentPadding}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="people-outline" size={22} color="#4338CA" />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <Text style={styles.cardSubTitle}>SATSANG & SEVA</Text>
                <Text style={styles.cardTitle}>Community Events</Text>
              </View>
            </View>

            <View style={styles.eventList}>
              {(festival.communityEvents && festival.communityEvents.length > 0
                ? festival.communityEvents
                : [
                    { id: '101', title: 'Grand Prasad Distribution & Bhandara', time: '01:00 PM', location: 'Main Temple Hall', attendeesCount: 340 },
                    { id: '102', title: 'Evening Bhajan & Kirtan Mandali', time: '06:30 PM', location: 'Courtyard', attendeesCount: 185 },
                  ]
              ).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => handleCardPress(() => onEventPress?.(event.id))}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${event.title}, at ${event.time}, located at ${event.location || 'Temple grounds'}`}
                >
                  <View style={styles.eventTextGroup}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="location-outline" size={13} color="#666" />
                      <Text style={styles.eventLocation}>{event.location || 'Temple'}</Text>
                      <Text style={styles.eventDot}>•</Text>
                      <Ionicons name="time-outline" size={13} color="#666" />
                      <Text style={styles.eventTime}>{event.time}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </StaggerCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: SPACING.xxl,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 18,
  },
  cardContentPadding: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderTextGroup: {
    flex: 1,
  },
  cardSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#888',
    marginBottom: 2,
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  scheduleList: {
    marginTop: 6,
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  scheduleItemHighlight: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  scheduleTimeBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginRight: 12,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scheduleTextGroup: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  schedulePriest: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kathaInfoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  kathaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 4,
  },
  kathaSpeaker: {
    fontSize: 13,
    color: '#92400E',
  },
  kathaChapter: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventList: {
    marginTop: 6,
    gap: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  eventTextGroup: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
  },
  eventDot: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
});
