import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  InteractionManager,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { getFestivalList } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { CustomLoader } from '../src/components/CustomLoader';
import { getFestivalImage } from '../src/constants/festivalImages';
import {
  syncFestivalReminders,
  toggleAllFestivals,
  getAllFestivalReminders,
} from '../src/utils/festivalReminders';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FestivalItemData {
  id?: string;
  name?: string;
  festival_name?: string;
  title?: string;
  date: string;
  description?: string;
  image?: string | number;
  image_url?: string | number;
  photo?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

interface HeroHeaderProps {
  userName: string;
  nextFestivalName: string;
  onTypingComplete: () => void;
}

interface FestivalItemProps {
  festival: FestivalItemData;
  index: number;
  isReady: boolean;
  onPress: (index: number) => void;
}

// FlashList v2 compatibility helper (matching temple.tsx & profile.tsx)
const SafeFlashList = FlashList as any;

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const EASING_CUBIC = Easing.out(Easing.cubic);

const CARD_COLORS: readonly string[] = [
  '#FFE082', // Yellow
  '#B2EBF2', // Light Blue
  '#F48FB1', // Pink
  '#A7F3D0', // Mint Green
  '#A5D6A7', // Green
  '#FFCC80', // Orange
  '#CFD8DC', // Blue Grey
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

/**
 * Pure helper function to format a YYYY-MM-DD date string into "DD Month YYYY"
 */
const formatFestivalDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = MONTH_NAMES[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr;
};

/**
 * Extract display name from festival data object
 */
const getFestivalDisplayName = (festival?: FestivalItemData | null): string => {
  if (!festival) return 'Upcoming Festival';
  return festival.name || festival.festival_name || festival.title || 'Upcoming Festival';
};

// ============================================================================
// COMPONENTS
// ============================================================================

// --- 1. Clean Top-Left Hero Header: Streamlined Greeting + Dynamic Subtitle ---
const HeroHeader: React.FC<HeroHeaderProps> = React.memo(({
  userName,
  nextFestivalName,
  onTypingComplete,
}) => {
  const reducedMotion = useReducedMotion();
  const targetGreeting = `Hello ${userName || 'Friend'} 👋`;
  const [streamedText, setStreamedText] = useState<string>(reducedMotion ? targetGreeting : '');
  const [isTyping, setIsTyping] = useState<boolean>(!reducedMotion);

  // Subtitle animation values (driven by Reanimated on UI thread)
  const subtitleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const subtitleTranslateY = useSharedValue(reducedMotion ? 0 : 8);

  // Cursor opacity animation (Reanimated UI thread - replaces useState/setInterval)
  const cursorOpacity = useSharedValue(1);

  const displayFestival = nextFestivalName && nextFestivalName.trim().length > 0
    ? nextFestivalName.trim()
    : 'Upcoming Festival';

  // Typewriter streaming effect
  useEffect(() => {
    if (reducedMotion) {
      subtitleOpacity.value = 1;
      subtitleTranslateY.value = 0;
      onTypingComplete();
      return;
    }

    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setStreamedText(targetGreeting.slice(0, idx));
      if (idx >= targetGreeting.length) {
        clearInterval(timer);
        setIsTyping(false);
        onTypingComplete();

        // 200ms delay after typing finishes, followed by 400ms cubic transition
        subtitleOpacity.value = withDelay(
          200,
          withTiming(1, { duration: 400, easing: EASING_CUBIC })
        );
        subtitleTranslateY.value = withDelay(
          200,
          withTiming(0, { duration: 400, easing: EASING_CUBIC })
        );
      }
    }, 40);

    return () => clearInterval(timer);
  }, [targetGreeting, reducedMotion, onTypingComplete, subtitleOpacity, subtitleTranslateY]);

  // Reanimated cursor blinking animation (eliminates JS thread re-renders)
  useEffect(() => {
    if (reducedMotion || !isTyping) {
      cursorOpacity.value = 0;
      return;
    }

    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 })
      ),
      -1,
      true
    );

    return () => {
      cursorOpacity.value = 0;
    };
  }, [isTyping, reducedMotion, cursorOpacity]);

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View style={styles.heroContainer} accessibilityRole="header">
      {/* Left-Aligned Streaming Typewriter Greeting */}
      <Text style={styles.greetingTitle} aria-hidden={true}>
        {streamedText}
        {isTyping && (
          <Animated.Text style={[styles.cursor, animatedCursorStyle]}>|</Animated.Text>
        )}
      </Text>

      {/* Dynamic Context-Aware Subtitle */}
      <Animated.View style={animatedSubtitleStyle}>
        <Text style={styles.festivalSubMessage}>
          Your next celebration is here — <Text style={styles.festivalHighlight}>{displayFestival}</Text>. Let's walk through its traditions together. ✨
        </Text>
      </Animated.View>
    </View>
  );
});

HeroHeader.displayName = 'HeroHeader';

// --- 2. Cascading Festival List Card ---
const FestivalItem: React.FC<FestivalItemProps> = React.memo(({ festival, index, isReady, onPress }: FestivalItemProps) => {
  const reducedMotion = useReducedMotion();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const festivalName = getFestivalDisplayName(festival);
  const festivalImg = useMemo(() => getFestivalImage(festival), [festival]);
  const formattedDate = useMemo(() => formatFestivalDate(festival.date), [festival.date]);

  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cardTranslateY = useSharedValue(reducedMotion ? 0 : 24);

  const handlePress = useCallback(() => {
    onPress(index);
  }, [onPress, index]);

  useEffect(() => {
    if (reducedMotion) {
      cardOpacity.value = 1;
      cardTranslateY.value = 0;
      return;
    }

    if (isReady) {
      const delay = 350 + index * 60;
      cardOpacity.value = withDelay(delay, withTiming(1, { duration: 380, easing: EASING_CUBIC }));
      cardTranslateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: EASING_CUBIC }));
    }
  }, [isReady, index, reducedMotion, cardOpacity, cardTranslateY]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardTouchable}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${festivalName}, on ${formattedDate}`}
      >
        <View style={[styles.festivalCardContainer, { backgroundColor: color }]}>
          <View style={styles.cardInnerPadding}>
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardLabel}>Festival</Text>
                <Text style={styles.cardName}>{festivalName}</Text>
                <Text style={styles.cardDate}>{formattedDate}</Text>
              </View>

              <View style={styles.cardRightSection}>
                <View style={styles.artworkBox}>
                  <Image
                    source={festivalImg}
                    style={styles.artworkImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
                <View style={styles.chevronWrapper}>
                  <Ionicons name="chevron-forward" size={16} color="#000000" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

FestivalItem.displayName = 'FestivalItem';

// --- 3. Main Festival Page ---
const FestivalPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [festivals, setFestivals] = useState<FestivalItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [allRemindersEnabled, setAllRemindersEnabled] = useState<boolean>(false);
  const [isTogglingAll, setIsTogglingAll] = useState<boolean>(false);
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false);

  // Use useRef for mount check to safely guard async calls and avoid state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  const checkGlobalReminderState = useCallback(async () => {
    try {
      const allReminders = await getAllFestivalReminders();
      if (isMountedRef.current) {
        setAllRemindersEnabled(Object.keys(allReminders).length > 0);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Fetch festival list on mount
  useEffect(() => {
    isMountedRef.current = true;

    const loadFestivals = async () => {
      try {
        const response = await getFestivalList();
        const items: FestivalItemData[] = response?.data || response || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = (Array.isArray(items) ? items : []).filter((f: FestivalItemData) => {
          if (!f.date) return true;
          return new Date(f.date) >= today;
        });

        const sorted = upcoming.sort(
          (a: FestivalItemData, b: FestivalItemData) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const finalList = sorted.length > 0 ? sorted : items;

        if (isMountedRef.current) {
          setFestivals(finalList);
          setLoading(false);
        }

        InteractionManager.runAfterInteractions(() => {
          if (isMountedRef.current) {
            checkGlobalReminderState();
            syncFestivalReminders(finalList).catch(console.warn);
          }
        });
      } catch (err) {
        console.warn('Failed to load festivals', err);
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadFestivals();

    return () => {
      isMountedRef.current = false;
    };
  }, [checkGlobalReminderState]);

  const handleToggleAll = useCallback(async () => {
    if (isTogglingAll) return;
    setIsTogglingAll(true);
    try {
      const newValue = !allRemindersEnabled;
      await toggleAllFestivals(festivals, newValue);
      if (isMountedRef.current) {
        setAllRemindersEnabled(newValue);
      }

      Alert.alert(
        newValue ? 'All Reminders Set' : 'Reminders Cancelled',
        newValue
          ? 'You will be notified before every upcoming festival.'
          : 'All scheduled festival notifications have been removed.'
      );
    } catch (_err) {
      Alert.alert('Notice', 'Unable to update reminder preferences.');
    } finally {
      if (isMountedRef.current) {
        setIsTogglingAll(false);
      }
    }
  }, [allRemindersEnabled, festivals, isTogglingAll]);

  const handleItemPress = useCallback(
    (index: number) => {
      router.push(`/festival-detail?index=${index}`);
    },
    [router]
  );

  const handleTypingComplete = useCallback(() => {
    setIsTypingComplete(true);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const userName = useMemo(() => user?.name?.split(' ')[0] || 'Friend', [user?.name]);
  const nextFestivalName = useMemo(() => getFestivalDisplayName(festivals[0]), [festivals]);

  const renderItem = useCallback(
    ({ item, index }: { item: FestivalItemData; index: number }) => (
      <FestivalItem
        festival={item}
        index={index}
        isReady={isTypingComplete}
        onPress={handleItemPress}
      />
    ),
    [handleItemPress, isTypingComplete]
  );

  const keyExtractor = useCallback(
    (item: FestivalItemData, idx: number) => item?.id || `${item?.name || 'fest'}-${item?.date || idx}-${idx}`,
    []
  );

  const listHeader = useMemo(
    () => (
      <HeroHeader
        userName={userName}
        nextFestivalName={nextFestivalName}
        onTypingComplete={handleTypingComplete}
      />
    ),
    [userName, nextFestivalName, handleTypingComplete]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomLoader size={70} message="Loading Festivals..." />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.page} edges={['top']}>
        {/* Top Header Bar with Transparent Back Button & Corner Notification Bell */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={26} color="#000000" />
          </TouchableOpacity>

          {/* Notification Button in Top-Right Corner */}
          <TouchableOpacity
            style={[
              styles.cornerNotificationButton,
              allRemindersEnabled && styles.cornerNotificationButtonActive,
            ]}
            onPress={handleToggleAll}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              allRemindersEnabled
                ? 'Disable all festival reminders'
                : 'Enable all festival reminders'
            }
          >
            <Ionicons
              name={allRemindersEnabled ? 'notifications' : 'notifications-outline'}
              size={22}
              color={allRemindersEnabled ? '#E65100' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        <SafeFlashList
          data={festivals}
          renderItem={renderItem}
          estimatedItemSize={132}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

// ============================================================================
// STYLESHEET
// ============================================================================

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  cornerNotificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cornerNotificationButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroContainer: {
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 20,
  },
  greetingTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 42,
    textAlign: 'left',
    fontFamily: Platform.select({
      ios: 'Canela-Bold',
      android: 'serif',
      default: 'serif',
    }),
    letterSpacing: -0.6,
  },
  festivalSubMessage: {
    fontSize: 15,
    color: '#262626',
    fontWeight: '400',
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'left',
    fontFamily: Platform.select({
      ios: 'MaisonNeue-Book',
      android: 'Inter_400Regular',
      default: 'System',
    }),
    letterSpacing: 0.1,
  },
  festivalHighlight: {
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.select({
      ios: 'Canela-Medium',
      android: 'serif',
      default: 'serif',
    }),
    letterSpacing: -0.2,
  },
  cursor: {
    color: '#E65100',
    fontWeight: '400',
  },
  cardTouchable: {
    marginBottom: 12,
  },
  festivalCardContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    minHeight: 110,
  },
  cardInnerPadding: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    opacity: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'left',
  },
  cardDate: {
    fontSize: 13,
    color: '#000000',
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'left',
  },
  cardRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artworkBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFF5F0',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FestivalPage;

