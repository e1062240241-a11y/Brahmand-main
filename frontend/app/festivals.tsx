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
  isHindi?: boolean;
  onTypingComplete: () => void;
}

interface FestivalItemProps {
  festival: FestivalItemData;
  index: number;
  isReady: boolean;
  isHindi?: boolean;
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
const getFestivalDisplayName = (festival?: FestivalItemData | null, isHindi: boolean = false): string => {
  const fallback = isHindi ? 'आगामी पर्व' : 'Upcoming Festival';
  if (!festival) return fallback;
  return festival.name || festival.festival_name || festival.title || fallback;
};

// ============================================================================
// COMPONENTS
// ============================================================================

// --- 1. Clean Top-Left Hero Header: Streamlined Greeting + Dynamic Subtitle ---
const HeroHeader: React.FC<HeroHeaderProps> = React.memo(({
  userName,
  nextFestivalName,
  isHindi = false,
  onTypingComplete,
}) => {
  const reducedMotion = useReducedMotion();
  const defaultUser = isHindi ? 'मित्र' : 'Friend';
  const targetGreeting = isHindi ? `नमस्ते ${userName || defaultUser} 👋` : `Hello ${userName || defaultUser} 👋`;
  const [streamedText, setStreamedText] = useState<string>(reducedMotion ? targetGreeting : '');
  const [isTyping, setIsTyping] = useState<boolean>(!reducedMotion);

  // Subtitle animation values (driven by Reanimated on UI thread)
  const subtitleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const subtitleTranslateY = useSharedValue(reducedMotion ? 0 : 8);

  // Cursor opacity animation (Reanimated UI thread - replaces useState/setInterval)
  const cursorOpacity = useSharedValue(1);

  const defaultFestival = isHindi ? 'आगामी पर्व' : 'Upcoming Festival';
  const displayFestival = nextFestivalName && nextFestivalName.trim().length > 0
    ? nextFestivalName.trim()
    : defaultFestival;

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
          {isHindi ? (
            <>
              आपका अगला पर्व आ गया है — <Text style={styles.festivalHighlight}>{displayFestival}</Text>। आइए इसकी परंपराओं को साथ समझें। ✨
            </>
          ) : (
            <>
              Your next celebration is here — <Text style={styles.festivalHighlight}>{displayFestival}</Text>. Let's walk through its traditions together. ✨
            </>
          )}
        </Text>
      </Animated.View>
    </View>
  );
});

HeroHeader.displayName = 'HeroHeader';

// --- 2. Cascading Festival List Card ---
const FestivalItem: React.FC<FestivalItemProps> = React.memo(({ festival, index, isReady, isHindi = false, onPress }: FestivalItemProps) => {
  const reducedMotion = useReducedMotion();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const festivalName = getFestivalDisplayName(festival, isHindi);
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
                <Text style={styles.cardLabel}>{isHindi ? 'त्योहार' : 'Festival'}</Text>
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

  const isHindi = user?.language === 'hi';

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
        newValue
          ? (isHindi ? 'सभी रिमाइंडर सेट हो गए 🔔' : 'All Reminders Set 🔔')
          : (isHindi ? 'रिमाइंडर रद्द कर दिए गए' : 'Reminders Cancelled'),
        newValue
          ? (isHindi ? 'आपको हर आगामी त्योहार और नवरात्रि के दिनों से पहले सूचित किया जाएगा।' : 'You will be notified before every upcoming festival and Navratri day.')
          : (isHindi ? 'सभी निर्धारित त्योहार सूचनाएं हटा दी गई हैं।' : 'All scheduled festival notifications have been removed.')
      );
    } catch (err: any) {
      console.warn('[Festivals] Failed to toggle reminders:', err);
      const isPermissionErr =
        err?.message?.toLowerCase().includes('permission') ||
        err?.message?.toLowerCase().includes('denied');

      Alert.alert(
        isHindi ? 'सूचना' : 'Notice',
        isPermissionErr
          ? (isHindi
              ? 'कृपया सेटिंग्स में जाकर Brahmand ऐप के लिए नोटिफिकेशन की अनुमति दें।'
              : 'Please enable notifications for Brahmand in your device Settings to receive festival reminders.')
          : (isHindi
              ? 'रिमाइंडर प्राथमिकताओं को अपडेट करने में असमर्थ। कृपया पुनः प्रयास करें।'
              : 'Unable to update reminder preferences. Please try again.')
      );
    } finally {
      if (isMountedRef.current) {
        setIsTogglingAll(false);
      }
    }
  }, [allRemindersEnabled, festivals, isHindi, isTogglingAll]);

  const handleItemPress = useCallback(
    (index: number) => {
      const selectedItem = festivals[index];
      const targetId = selectedItem?.id ? String(selectedItem.id) : '';
      const targetName = encodeURIComponent(selectedItem?.festival_name || selectedItem?.name || selectedItem?.title || '');
      router.push(`/festival-detail?index=${index}&id=${encodeURIComponent(targetId)}&name=${targetName}`);
    },
    [router, festivals]
  );

  const handleTypingComplete = useCallback(() => {
    setIsTypingComplete(true);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const userName = useMemo(() => user?.name?.split(' ')[0] || (isHindi ? 'मित्र' : 'Friend'), [user?.name, isHindi]);
  const nextFestivalName = useMemo(() => getFestivalDisplayName(festivals[0], isHindi), [festivals, isHindi]);

  const renderItem = useCallback(
    ({ item, index }: { item: FestivalItemData; index: number }) => (
      <FestivalItem
        festival={item}
        index={index}
        isReady={isTypingComplete}
        isHindi={isHindi}
        onPress={handleItemPress}
      />
    ),
    [handleItemPress, isHindi, isTypingComplete]
  );

  const keyExtractor = useCallback(
    (item: FestivalItemData, idx: number) => item?.id || `${item?.name || 'fest'}-${item?.date || idx}-${idx}`,
    []
  );

  const navratriFestival = useMemo(() => {
    return festivals.find((f) => {
      const name = (f.name || f.festival_name || f.title || '').toLowerCase();
      const id = String(f.id || '').toLowerCase();
      return name.includes('navratri') || name.includes('durga') || id.includes('navratri');
    }) || festivals[0];
  }, [festivals]);

  const navratriFestivalIndex = useMemo(() => {
    const idx = festivals.findIndex((f) => {
      const name = (f.name || f.festival_name || f.title || '').toLowerCase();
      const id = String(f.id || '').toLowerCase();
      return name.includes('navratri') || name.includes('durga') || id.includes('navratri');
    });
    return idx >= 0 ? idx : 0;
  }, [festivals]);

  const handleNavDurgaPress = useCallback(() => {
    const targetId = navratriFestival?.id ? String(navratriFestival.id) : '';
    const targetName = encodeURIComponent(navratriFestival?.festival_name || navratriFestival?.name || navratriFestival?.title || 'Navratri');
    router.push(`/festival-section-detail?index=${navratriFestivalIndex}&id=${encodeURIComponent(targetId)}&name=${targetName}&section=Nav%20Durga`);
  }, [router, navratriFestival, navratriFestivalIndex]);

  const listHeader = useMemo(
    () => (
      <View>
        <HeroHeader
          userName={userName}
          nextFestivalName={nextFestivalName}
          isHindi={isHindi}
          onTypingComplete={handleTypingComplete}
        />

        {/* Independent Nav Durga 9 Swaroop Card Section */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleNavDurgaPress}
          style={styles.navDurgaCardTouchable}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isHindi ? 'माँ नवदुर्गा ९ पावन स्वरूप दर्शन एवं उपासना' : 'Nav Durga 9 Divine Forms & Rituals'}
        >
          <LinearGradient
            colors={['#7C2D12', '#9A3412', '#C2410C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.navDurgaCardGradient}
          >
            {/* Subtle Divine Ornamental Glow */}
            <View style={styles.navDurgaGlowCircle} pointerEvents="none" />

            <View style={styles.navDurgaCardContent}>
              <View style={styles.navDurgaTextCol}>
                <View style={styles.navDurgaBadgeRow}>
                  <View style={styles.navDurgaPill}>
                    <Text style={styles.navDurgaPillText}>९ पावन स्वरूप</Text>
                  </View>
                  <View style={styles.navDurgaSpecialPill}>
                    <Text style={styles.navDurgaSpecialText}>विशेष दर्शन</Text>
                  </View>
                </View>

                <Text style={styles.navDurgaTitle}>
                  {isHindi ? 'माँ नवदुर्गा दर्शन' : 'Maa Navdurga Darshan'}
                </Text>

                <Text style={styles.navDurgaSubtitle} numberOfLines={2}>
                  {isHindi
                    ? '९ देवियों के पावन स्वरूप, शुभ रंग, भोग, प्रिय पुष्प व सिद्ध मंत्र'
                    : '9 Sacred Forms, Daily Colors, Divine Bhog, Flowers & Mantras'}
                </Text>

                <View style={styles.navDurgaActionRow}>
                  <Text style={styles.navDurgaActionText}>
                    {isHindi ? 'दर्शन करें' : 'Explore Now'}
                  </Text>
                  <Ionicons name="arrow-forward-circle" size={18} color="#FFEDD5" />
                </View>
              </View>

              <View style={styles.navDurgaIconBox}>
                <Image
                  source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/maa_durga_icon.webp' }}
                  style={styles.navDurgaIconImg}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Section Heading for Festival List */}
        <View style={styles.festivalsListHeader}>
          <Text style={styles.festivalsListTitle}>
            {isHindi ? 'आगामी पर्व एवं व्रत' : 'Upcoming Festivals & Vrats'}
          </Text>
          <Text style={styles.festivalsListCount}>
            {festivals.length > 0 ? `(${festivals.length})` : ''}
          </Text>
        </View>
      </View>
    ),
    [
      userName,
      nextFestivalName,
      isHindi,
      handleTypingComplete,
      handleNavDurgaPress,
      festivals.length,
    ]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomLoader size={70} message={isHindi ? 'त्योहार लोड हो रहे हैं...' : 'Loading Festivals...'} />
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
            accessibilityLabel={isHindi ? 'पीछे जाएं' : 'Go back'}
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
                ? (isHindi ? 'सभी त्योहार रिमाइंडर बंद करें' : 'Disable all festival reminders')
                : (isHindi ? 'सभी त्योहार रिमाइंडर चालू करें' : 'Enable all festival reminders')
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
  navDurgaCardTouchable: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  navDurgaCardGradient: {
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 237, 213, 0.35)',
  },
  navDurgaGlowCircle: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 237, 213, 0.12)',
  },
  navDurgaCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navDurgaTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  navDurgaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  navDurgaPill: {
    backgroundColor: 'rgba(255, 237, 213, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 237, 213, 0.35)',
  },
  navDurgaPillText: {
    color: '#FFEDD5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  navDurgaSpecialPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  navDurgaSpecialText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  navDurgaTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Canela-Bold',
      android: 'serif',
      default: 'serif',
    }),
    letterSpacing: -0.3,
  },
  navDurgaSubtitle: {
    color: 'rgba(255, 237, 213, 0.92)',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  navDurgaActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navDurgaActionText: {
    color: '#FFEDD5',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  navDurgaIconBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 237, 213, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 237, 213, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  navDurgaIconImg: {
    width: '100%',
    height: '100%',
  },
  festivalsListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 2,
  },
  festivalsListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  festivalsListCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default FestivalPage;

