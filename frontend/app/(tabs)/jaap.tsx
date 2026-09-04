// accessibility: placeholder
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Image,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ImageBackground,
  Alert,
  LayoutAnimation,
  UIManager,
  Animated,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveTempleImage } from '../../src/constants/templeImages';
import api, { getTemples } from '../../src/services/api';
import {
  isJyotirlinga,
  isShaktiPeetha,
  isBadaCharDham,
  isChotaCharDham,
  isCharDham,
  isHealingTemple,
  deduplicateTemples,
} from '../../src/data/jyotirlingaTravelData';
import { socketService } from '../../src/services/socket';
import { getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../../src/features/live-mantra/schedule';
import { formatTimeIST } from '../../src/utils/dateUtils';
import { useTranslation } from '../../src/utils/i18n';
import { useScrollToHideTabBar } from '../../src/utils/scroll';
import { Svg, Path, Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { CustomLoader } from '../../src/components/CustomLoader';
import { KathaSection } from '../../src/components/KathaSection';
import { SubtleJoinButton } from '../../src/components/SubtleJoinButton';
import { TempleCard, TempleCardImageItem } from '../../src/components/TempleCard';
import { CharDhamModal } from '../../src/components/CharDhamModal';
import { LiveJaapCard, JAAP_CARD_WIDTH, JAAP_CARD_HEIGHT, JAAP_CARD_MARGIN_RIGHT } from '../../src/components/LiveJaapCard';
import { UpcomingJaapsSection } from '../../src/components/UpcomingJaapsSection';
import { JaapHeroBanner } from '../../src/components/JaapHeroBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_H_MARGIN = 16;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_H_MARGIN * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.48);
const BANNER_RADIUS = 22;



if (Platform.OS === 'android' && !(global as any).nativeFabricUIManager && !(global as any)._IS_FABRIC && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LIVE_JAAPS = [
  {
    id: '1',
    title: 'Hanuman\nChalisa',
    devotees: '9.6K',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/hanuman_jaap_card_v2.webp' },
    slok: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि...'
  },
  {
    id: '2',
    title: 'Hare Krishna\nJaap',
    devotees: '6.4K',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/krishna_jaap_card_v2.webp' },
    slok: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे...'
  },
  {
    id: '3',
    title: 'Om Namah\nShivaya',
    devotees: '5.2K',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/shiva_jaap_card_v2.webp' },
    slok: 'ॐ नमः शिवाय ॐ नमः शिवाय...'
  },
  {
    id: '4',
    title: 'Gayatri\nMantra',
    devotees: '4.8K',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/gayatri_jaap_card_v4_exact_clean.webp' },
    slok: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...'
  },
];




const getMantraRoomName = (id: string) => {
  if (id === '1') return 'jaap_hanuman';
  if (id === '2') return 'jaap_krishna';
  if (id === '3') return 'jaap_shiva';
  if (id === '4') return 'jaap_gayatri';
  if (id === '5') return 'jaap_ganesh';
  if (id === '6') return 'jaap_laxmi';
  if (id === '7') return 'jaap_krishna';
  return 'jaap_gayatri';
};

export default function JaapLandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; section?: string }>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const onJaapScrollTabBar = useScrollToHideTabBar();
  const [now, setNow] = useState(new Date());

  const isNavigatingRef = useRef(false);
  const safeNavigate = useCallback((action: () => void | Promise<void>, cooldown = 800) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      action();
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, cooldown);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      isNavigatingRef.current = false;
    }
  }, [isFocused]);

  const initialSection =
    params.tab === 'temple' || params.section === 'temple' ? 'temple' : 'jaap';
  const [activeSection, setActiveSection] = useState<'jaap' | 'temple'>(initialSection);
  const sectionAnim = useRef(new Animated.Value(initialSection === 'temple' ? 1 : 0)).current;
  const hanumanStatus = getCurrentHanumanStatus(now);
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ['jaap_hanuman', 'jaap_krishna', 'jaap_shiva', 'jaap_gayatri', 'jaap_ganesh', 'jaap_laxmi'].forEach(room => {
      initial[room] = Math.floor(Math.random() * 17) + 2;
    });
    return initial;
  });

  useEffect(() => {
    if (!isFocused || activeSection !== 'jaap') return;

    let active = true;
    const fetchActiveCounts = async () => {
      if (AppState.currentState !== 'active') return;
      try {
        const response = await api.get('/jaap/active-count', {
          params: { rooms: 'jaap_hanuman,jaap_krishna,jaap_shiva,jaap_gayatri,jaap_ganesh,jaap_laxmi' }
        });
        if (active && response && response.data) {
          const sanitizedData: Record<string, number> = {};
          Object.keys(response.data).forEach((key) => {
            const realCount = response.data[key] || 0;
            // If count is > 10, show count * 18, else show randomized count (2 to 18) directly
            sanitizedData[key] = realCount > 10 ? realCount * 18 : Math.floor(Math.random() * 17) + 2;
          });
          setActiveCounts(sanitizedData);
        }
      } catch (error) {
        console.warn('Error fetching active jaap counts:', error);
      }
    };

    fetchActiveCounts();

    // Listen for real-time room active counts via WebSockets without HTTP polling
    socketService.connect().then(() => {
      ['jaap_hanuman', 'jaap_krishna', 'jaap_shiva', 'jaap_gayatri', 'jaap_ganesh', 'jaap_laxmi'].forEach((rName) => {
        socketService.joinRoom(rName);
      });
    }).catch(err => console.warn('Socket connect failed on Jaap tab:', err));

    const handleRoomActiveCount = (data: { room: string; count: number }) => {
      if (data && data.room) {
        const realCount = data.count || 0;
        const mapped = realCount > 10 ? realCount * 18 : Math.floor(Math.random() * 17) + 2;
        setActiveCounts(prev => ({ ...prev, [data.room]: mapped }));
      }
    };

    socketService.onEvent('room_active_count', handleRoomActiveCount);

    return () => {
      active = false;
      socketService.offEvent('room_active_count', handleRoomActiveCount);
    };
  }, [isFocused, activeSection]);


  // Auto-scroll ref for More Live Jaaps
  const jaapScrollRef = useRef<ScrollView>(null);
  const jaapScrollOffset = useRef(0);
  const jaapScrollDir = useRef(1); // 1 = forward, -1 = backward
  const CARD_WIDTH = JAAP_CARD_WIDTH + JAAP_CARD_MARGIN_RIGHT; // approx card width + gap

  // Temple State
  const [temples, setTemples] = useState<any[]>([]);
  const [loadingTemples, setLoadingTemples] = useState(false);
  const [templeSearch, setTempleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Jyotirlinga' | 'Shakti Peetha' | 'Bada Char Dham' | 'Chota Char Dham' | 'Char Dham' | 'Healing Temples' | 'Sacred'>('Bada Char Dham');

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, [isFocused]);

  // Auto-scroll effect for More Live Jaaps (Only active when focused and app in foreground)
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');

  useEffect(() => {
    if (!isFocused) {
      setAppActive(false);
      return;
    }
    setAppActive(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppActive(nextAppState === 'active');
    });
    return () => subscription.remove();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused || !appActive) return;
    const maxOffset = CARD_WIDTH * (LIVE_JAAPS.length - 2);
    const autoScroll = setInterval(() => {
      jaapScrollOffset.current += jaapScrollDir.current * CARD_WIDTH;
      if (jaapScrollOffset.current >= maxOffset) {
        jaapScrollDir.current = -1;
      } else if (jaapScrollOffset.current <= 0) {
        jaapScrollDir.current = 1;
      }
      jaapScrollRef.current?.scrollTo({ x: jaapScrollOffset.current, animated: true });
    }, 4000);
    return () => clearInterval(autoScroll);
  }, [isFocused, appActive]);

  const fetchTemplesData = async () => {
    try {
      setLoadingTemples(true);
      const response = await getTemples();
      if (response.data) {
        const deduplicated = deduplicateTemples(response.data);
        setTemples(deduplicated);
        console.log('[TEMPLE SOURCE]', deduplicated.length, 'localDbCount: N/A', deduplicated.length);
      }
    } catch (error) {
      console.error('Error fetching temples in Jaap:', error);
    } finally {
      setLoadingTemples(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'temple' && temples.length === 0) {
      fetchTemplesData();
    }
  }, [activeSection]);

  const renderSafeText = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.name) return String(val.name);
      if (val.name_hi) return String(val.name_hi);
      if (val.title) return String(val.title);
      if (val.label) return String(val.label);
      if (val.value) return String(val.value);
      return '';
    }
    return String(val);
  };

  const getTempleLocation = (item: any) => {
    if (typeof item.location === 'string') return item.location;
    if (typeof item.location === 'object' && item.location !== null) {
      const { area, city, state } = item.location;
      const parts = [area, city, state]
        .filter(Boolean)
        .map(val => (typeof val === 'object' ? renderSafeText(val) : String(val)))
        .filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    return renderSafeText(item.location) || 'Unknown Location';
  };

  const getTranslatedTempleName = (nameInput: any) => {
    const name = renderSafeText(nameInput);
    const lower = name.toLowerCase();
    if (lower.includes('mahalaxmi') || lower.includes('mahalakshmi')) {
      return t('language') === 'hi' ? 'श्री महालक्ष्मी मंदिर' : 'Shri Mahalakshmi Mandir';
    }
    if (lower.includes('siddhivinayak')) {
      return t('language') === 'hi' ? 'श्री सिद्धिविनायक गणपति मंदिर' : 'Shree Siddhivinayak Ganapati Temple';
    }
    if (lower.includes('iskcon') && lower.includes('bangalore')) {
      return t('language') === 'hi' ? 'श्री इस्कॉन मंदिर बेंगलुरु' : 'ISKCON Bangalore';
    }
    if (lower.includes('tirupati') || lower.includes('tirumala')) {
      return t('language') === 'hi' ? 'श्री तिरुपति बालाजी मंदिर' : 'Tirupati Balaji Temple';
    }
    if (t('language') === 'hi') {
      if (name.includes('Kedarnath')) return 'श्री केदारनाथ मंदिर';
      if (name.includes('Somnath')) return 'श्री सोमनाथ ज्योतिर्लिंग';
      if (name.includes('Kashi')) return 'श्री काशी विश्वनाथ मंदिर';
      if (name.includes('Badrinath')) return 'श्री बद्रीनाथ मंदिर';
      if (name.includes('Mahakaleshwar')) return 'श्री महाकालेश्वर ज्योतिर्लिंग';
      if (name.includes('Omkareshwar')) return 'श्री ओंकारेश्वर ज्योतिर्लिंग';
      if (name.includes('Rameshwaram')) return 'श्री रामेश्वरम ज्योतिर्लिंग';
      if (name.includes('Mallikarjuna')) return 'श्री मल्लिकार्जुन ज्योतिर्लिंग';
      if (name.includes('Bhimashankar')) return 'श्री भीमशंकर ज्योतिर्लिंग';
      if (name.includes('Trimbakeshwar')) return 'श्री त्र्यंबकेश्वर ज्योतिर्लिंग';
      if (name.includes('Vaidyanath')) return 'श्री बैद्यनाथ ज्योतिर्लिंग';
      if (name.includes('Ghrishneshwar')) return 'श्री घृष्णेश्वर ज्योतिर्लिंग';
    }
    return name.replace(/Borivali/ig, 'Mira Road');
  };

  const getTranslatedTempleLocation = (locInput: any, nameInput?: any) => {
    let finalLoc = renderSafeText(locInput);
    const nameStr = renderSafeText(nameInput);
    if (finalLoc.includes('Mira Road') || finalLoc.includes('Thane') || finalLoc.toLowerCase().includes('borivali') || (nameStr && nameStr.toLowerCase().includes('iskcon') && (nameStr.toLowerCase().includes('mira') || nameStr.toLowerCase().includes('borivali')))) {
      finalLoc = 'Mira Road, Mumbai, Maharashtra.';
    }
    if (t('language') === 'hi') {
      let l = finalLoc;
      if (l.includes('Uttarakhand')) l = l.replace('Uttarakhand', 'उत्तराखंड');
      if (l.includes('Gujarat')) l = l.replace('Gujarat', 'गुजरात');
      if (l.includes('Uttar Pradesh')) l = l.replace('Uttar Pradesh', 'उत्तर प्रदेश');
      if (l.includes('Madhya Pradesh')) l = l.replace('Madhya Pradesh', 'मध्य प्रदेश');
      if (l.includes('Maharashtra')) l = l.replace('Maharashtra', 'महाराष्ट्र');
      if (l.includes('Tamil Nadu')) l = l.replace('Tamil Nadu', 'तमिलनाडु');
      if (l.includes('Andhra Pradesh')) l = l.replace('Andhra Pradesh', 'आंध्र प्रदेश');
      if (l.includes('Jharkhand')) l = l.replace('Jharkhand', 'झारखंड');
      return l;
    }
    return finalLoc;
  };

  const [charDhamSubFilter, setCharDhamSubFilter] = useState<'bada' | 'chota' | 'all'>('bada');
  const [showCharDhamDropdown, setShowCharDhamDropdown] = useState(false);

  const filteredTemples = (temples || []).filter(t => {
    const q = templeSearch.trim().toLowerCase();

    let matchesSearch = true;
    if (q.length > 0) {
      matchesSearch = (t.name || '').toLowerCase().includes(q);
    }

    let matchesCategory = true;
    if (selectedCategory === 'Jyotirlinga') {
      matchesCategory = isJyotirlinga(t);
    } else if (selectedCategory === 'Shakti Peetha') {
      matchesCategory = isShaktiPeetha(t);
    } else if (selectedCategory === 'Char Dham') {
      if (charDhamSubFilter === 'bada') {
        matchesCategory = isBadaCharDham(t);
      } else if (charDhamSubFilter === 'chota') {
        matchesCategory = isChotaCharDham(t);
      } else {
        matchesCategory = isCharDham(t);
      }
    } else if (selectedCategory === 'Healing Temples') {
      matchesCategory = isHealingTemple(t);
    } else if (selectedCategory === 'Sacred') {
      matchesCategory = !isJyotirlinga(t) && !isShaktiPeetha(t) && !isCharDham(t) && !isHealingTemple(t);
    }

    return matchesSearch && matchesCategory;
  });

  const jyotirlingaTemples = (temples || []).filter((t: any) => isJyotirlinga(t));

  const switchSection = useCallback((section: 'jaap' | 'temple') => {
    if (section === activeSection) return;
    setActiveSection(section);
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
      );
    }
    Animated.spring(sectionAnim, {
      toValue: section === 'jaap' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeSection, sectionAnim]);

  useEffect(() => {
    const target = params.tab || params.section;
    if ((target === 'temple' || target === 'jaap') && target !== activeSection) {
      switchSection(target);
    }
  }, [params.tab, params.section, switchSection, activeSection]);

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>

        <View style={[styles.stickyTopTabsWrap, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topTabsContainer}>
            <View style={styles.topTabsInner}>
              {/* Animated sliding thumb — single source of truth */}
              <Animated.View
                style={[
                  styles.topTabThumb,
                  {
                    transform: [{
                      translateX: sectionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (SCREEN_WIDTH - 40 - 8) / 2],
                      }),
                    }],
                  },
                ]}
                pointerEvents="none"
              />

              {/* Jaap tab */}
              <Pressable
                style={styles.topTabButton}
                onPress={() => switchSection('jaap')}
              >
                <Text
                  style={[
                    styles.topTabText,
                    activeSection === 'jaap' && styles.topTabTextActive,
                  ]}
                >
                  {t('jaap')}
                </Text>
              </Pressable>

              {/* Temple tab */}
              <Pressable
                style={styles.topTabButton}
                onPress={() => switchSection('temple')}
              >
                <Text
                  style={[
                    styles.topTabText,
                    activeSection === 'temple' && styles.topTabTextActive,
                  ]}
                >
                  {t('temple')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {activeSection === 'jaap' ? (
          <ScrollView
            style={styles.mainScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
            bounces
            onScroll={onJaapScrollTabBar}
          >
            {/* Top Jaap Hero Banner */}
            <JaapHeroBanner now={now} />

            <View style={styles.sectionHeaderParity}>
              <Text style={styles.sectionTitleText}>{t('moreLiveJaaps')}</Text>
              <Pressable
                style={({ pressed }) => [
                  { flexDirection: 'row', alignItems: 'center' },
                  pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                ]}
                android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                onPress={() => safeNavigate(() => router.push('/all-live-jaaps' as any))}
              >
                <Text style={styles.viewAllSaffronRefined}>{t('viewAll')}</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF6600" />
              </Pressable>
            </View>

            <ScrollView
              ref={jaapScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniCardsRowPadding}
              scrollEventThrottle={16}
              onScroll={(e) => {
                jaapScrollOffset.current = e.nativeEvent.contentOffset.x;
              }}
            >
              {LIVE_JAAPS.map((jaap) => {
                const isHanuman = jaap.id === '1';
                const isOtherLiveJaap = jaap.id === '2' || jaap.id === '3' || jaap.id === '4' || jaap.id === '5' || jaap.id === '6' || jaap.id === '7';

                let showLive = true;
                let liveLabel = 'LIVE';

                if (isHanuman) {
                  const hanumanActive = hanumanStatus.isActive;
                  showLive = hanumanActive;
                  if (hanumanActive) {
                    if (hanumanStatus.isCompleted) {
                      liveLabel = t('language') === 'hi' ? 'पूरा हुआ' : 'COMPLETED';
                    } else {
                      liveLabel = t('language') === 'hi'
                        ? `लाइव • ${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} जाप`
                        : `LIVE • ${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} jaap done`;
                    }
                  } else {
                    if (hanumanStatus.nextSessionStart) {
                      const timeStr = formatTimeIST(hanumanStatus.nextSessionStart);
                      liveLabel = t('language') === 'hi' ? `जल्द ही • ${timeStr}` : `SOON • ${timeStr}`;
                    } else {
                      liveLabel = t('language') === 'hi' ? 'जल्द ही' : 'SOON';
                    }
                  }
                } else if (isOtherLiveJaap) {
                  const mType = jaap.id === '2' ? 'krishna' : jaap.id === '3' ? 'shiva' : jaap.id === '4' ? 'gayatri' : jaap.id === '5' ? 'ganesh' : jaap.id === '6' ? 'laxmi' : 'krishna';
                  const otherStatus = getCurrentOtherJaapStatus(now, mType);
                  showLive = otherStatus.isActive;
                  if (otherStatus.isActive) {
                    liveLabel = t('language') === 'hi' ? 'लाइव' : 'LIVE';
                  } else {
                    if (otherStatus.nextSessionStart) {
                      const timeStr = formatTimeIST(otherStatus.nextSessionStart);
                      liveLabel = t('language') === 'hi' ? `जल्द ही • ${timeStr}` : `SOON • ${timeStr}`;
                    } else {
                      liveLabel = t('language') === 'hi' ? 'जल्द ही' : 'SOON';
                    }
                  }
                }

                // Simple Hindi translation of titles
                let translatedTitle = jaap.title;
                if (t('language') === 'hi') {
                  if (jaap.id === '1') translatedTitle = 'हनुमान\nचालीसा';
                  else if (jaap.id === '2') translatedTitle = 'हरे कृष्णा\nजाप';
                  else if (jaap.id === '3') translatedTitle = 'ॐ नमः\nशिवाय';
                  else if (jaap.id === '4') translatedTitle = 'गायत्री\nमंत्र';
                  else if (jaap.id === '5') translatedTitle = 'गणेश\nमंत्र';
                  else if (jaap.id === '6') translatedTitle = 'लक्ष्मी\nमंत्र';
                  else if (jaap.id === '7') translatedTitle = 'कृष्णा\nजाप';
                }

                return (
                  <LiveJaapCard
                    key={jaap.id}
                    jaap={jaap}
                    showLive={showLive}
                    liveLabel={liveLabel}
                    activeCount={activeCounts[getMantraRoomName(jaap.id)] || 0}
                    translatedTitle={translatedTitle}
                    joinText={t('join')}
                    onJoin={() => safeNavigate(() => {
                      router.push({
                        pathname: '/live-jaap-welcome',
                        params: {
                          mantraType: jaap.id === '1' ? 'hanuman' : jaap.id === '2' ? 'krishna' : jaap.id === '3' ? 'shiva' : jaap.id === '4' ? 'gayatri' : jaap.id === '5' ? 'ganesh' : jaap.id === '6' ? 'laxmi' : 'krishna',
                          title: jaap.title.replace('\n', ' ')
                        }
                      });
                    })}
                  />
                );
              })}
            </ScrollView>

            {/* Shravan Katha Devotional Section */}
            <KathaSection onNavigate={safeNavigate} />

            {/* More Upcoming Jaaps Section */}
            <UpcomingJaapsSection />

          </ScrollView>
        ) : (
          <>
            <FlatList
              style={styles.mainScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
              onScroll={onJaapScrollTabBar}
              scrollEventThrottle={16}
              data={filteredTemples}
              keyExtractor={(item, index) => renderSafeText(item.temple_id || item.templeId || item.id || item._id) || index.toString()}
              initialNumToRender={8}
              maxToRenderPerBatch={6}
              windowSize={5}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={Platform.OS === 'android'}
              ListHeaderComponent={
                <View>
                  <View style={{ backgroundColor: 'transparent', paddingTop: 12, zIndex: 10 }}>
                    {/* Hero Banner (Same structure as Jaap tab banner) */}
                    <View style={[styles.heroFixedContainer, { height: BANNER_HEIGHT, marginTop: 0 }]}>
                      <ImageBackground
                        source={{ uri: 'https://brahmandfeed23.b-cdn.net/temples/SomnathTemple.webp' }}
                        style={styles.heroBannerFill}
                        imageStyle={styles.heroBannerImageStyle}
                        resizeMode="cover"
                      >
                        <LinearGradient
                          colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
                          locations={[0, 0.38, 1]}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.bannerContent}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ paddingTop: 0, paddingLeft: 0 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                <Text style={{
                                  color: '#FFF',
                                  fontFamily: 'System',
                                  fontSize: 15,
                                  fontStyle: 'normal',
                                  fontWeight: '700',
                                  letterSpacing: 1,
                                  textShadowColor: 'rgba(0,0,0,0.9)',
                                  textShadowOffset: { width: 0, height: 1 },
                                  textShadowRadius: 6,
                                }}>
                                  {t('language') === 'hi' ? 'सोमनाथ मंदिर' : 'Somnath Mandir'}
                                </Text>
                              </View>

                              <Text style={{
                                color: '#FFF',
                                fontWeight: '600',
                                opacity: 0.9,
                                textShadowColor: 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 4,
                                marginLeft: 14,
                                marginTop: 0,
                                marginBottom: 2,
                                fontSize: 13
                              }}>
                                {/* 🧡 Engagement: Reframed "भक्त जाप कर रहे हैं" to "भक्त साथ में जाप कर रहे हैं" for Satsang/collective devotion feeling */}
                                {/* Lever: Social Proof (Satsang) */}
                                {/* UI: Text-only change, no new visual components */}
                                {t('language') === 'hi' ? '1,248 भक्त साथ में जाप कर रहे हैं' : '1,248 devotees chanting together'}
                              </Text>

                              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                <Ionicons name="time-outline" size={13} color="#FFF" />
                                <Text style={{
                                  marginTop: 0,
                                  marginLeft: 4,
                                  color: '#FFF',
                                  fontWeight: '600',
                                  fontSize: 12
                                }}>
                                  {t('language') === 'hi' ? 'शाम 5:00 बजे तक लाइव' : 'Live until 5:00 PM'}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.mockupLiveBadge, { alignSelf: 'flex-start' }]}>
                              <View style={styles.liveDot} />
                              <Text style={styles.mockupLiveText}>{t('language') === 'hi' ? 'लाइव' : 'LIVE'}</Text>
                            </View>
                          </View>
                          <View style={[styles.bannerFooter, { paddingBottom: 0 }]}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.mockupJoinNowBtn,
                                pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                              ]}
                              android_ripple={{ color: 'rgba(255, 107, 0, 0.2)', borderless: false }}
                              onPress={() =>
                                safeNavigate(() => {
                                  router.push({
                                    pathname: '/temple/[id]',
                                    params: {
                                      id: 'jyotirling-somnath-temple-gujarat',
                                      autoplayAarti: 'true',
                                    },
                                  });
                                })
                              }
                            >
                              <LinearGradient colors={['#FF6B00', '#FF8800']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mockupJoinGradient}>
                                <Text style={styles.mockupJoinJaapText}>
                                  {t('language') === 'hi' ? 'लाइव आरती में शामिल हों' : 'Join Live Aarti'}
                                </Text>
                                <Ionicons name="chevron-forward" size={15} color="#FFF" />
                              </LinearGradient>
                            </Pressable>
                          </View>
                        </View>
                      </ImageBackground>
                    </View>

                    {/* Search Bar matching image */}
                    <View style={styles.newTempleSearchSection}>
                      <View style={styles.newTempleSearchBarWrapper}>
                        <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 10 }} />
                        <TextInput
                          placeholder={t('searchMandir')}
                          style={styles.newTempleSearchInput}
                          value={templeSearch}
                          onChangeText={setTempleSearch}
                          placeholderTextColor="#999"
                        />
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.filterIconBtn,
                          pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                        ]}
                        android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: true, radius: 24 }}
                      >
                        <MaterialCommunityIcons name="text-search" size={28} color="#FF6600" />
                      </Pressable>
                    </View>

                    {/* Temple Category Pills */}
                    <View style={styles.templeCatPillsRow}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                        {(['All', 'Jyotirlinga', 'Shakti Peetha', 'Char Dham', 'Healing Temples', 'Sacred'] as const).map((cat) => {
                          let displayCat: string = cat;
                          if (t('language') === 'hi') {
                            if (cat === 'All') displayCat = 'सभी';
                            else if (cat === 'Jyotirlinga') displayCat = 'ज्योतिर्लिंग';
                            else if (cat === 'Shakti Peetha') displayCat = 'शक्ति पीठ';
                            else if (cat === 'Char Dham') displayCat = 'चार धाम';
                            else if (cat === 'Healing Temples') displayCat = 'आरोग्य मंदिर';
                            else if (cat === 'Sacred') displayCat = 'पवित्र';
                          }

                          const isSelected = selectedCategory === cat;

                          if (cat === 'Char Dham') {
                            let subLabel = 'Bada Char Dham';
                            if (t('language') === 'hi') {
                              subLabel = charDhamSubFilter === 'bada' ? 'बड़ा चार धाम' : charDhamSubFilter === 'chota' ? 'छोटा चार धाम' : 'सभी चार धाम';
                            } else {
                              subLabel = charDhamSubFilter === 'bada' ? 'Bada Char Dham' : charDhamSubFilter === 'chota' ? 'Chota Char Dham' : 'All Char Dham';
                            }

                            return (
                              <Pressable
                                key={cat}
                                style={({ pressed }) => [
                                  styles.templeCatPill,
                                  isSelected && styles.templeCatPillActive,
                                  pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                                ]}
                                android_ripple={{ color: 'rgba(255, 255, 255, 0.35)', borderless: false }}
                                onPress={() => {
                                  setSelectedCategory('Char Dham');
                                  setShowCharDhamDropdown(true);
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Text style={[styles.templeCatPillText, isSelected && styles.templeCatPillTextActive]}>
                                    {displayCat} ({subLabel})
                                  </Text>
                                  <MaterialCommunityIcons
                                    name="chevron-down"
                                    size={16}
                                    color={isSelected ? "#FF6600" : "#8B4513"}
                                    style={{ marginLeft: 4 }}
                                  />
                                </View>
                              </Pressable>
                            );
                          }

                          return (
                            <Pressable
                              key={cat}
                              style={({ pressed }) => [
                                styles.templeCatPill,
                                selectedCategory === cat && styles.templeCatPillActive,
                                pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                              ]}
                              android_ripple={{ color: 'rgba(255, 255, 255, 0.35)', borderless: false }}
                              onPress={() => setSelectedCategory(cat)}
                            >
                              <Text style={[styles.templeCatPillText, selectedCategory === cat && styles.templeCatPillTextActive]}>{displayCat}</Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              }
              ListEmptyComponent={
                loadingTemples ? (
                  <CustomLoader size={60} fullScreen={false} message="Loading Sacred Temples..." />
                ) : (
                  <View style={styles.noTemplesFound}>
                    <MaterialCommunityIcons name="temple-hindu-outline" size={60} color="#F5E0C3" />
                    <Text style={styles.noTemplesText}>
                      {t('language') === 'hi' ? 'कोई पवित्र मंदिर नहीं मिला।' : 'No sacred temples found.'}
                    </Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => {
                const safeItemId = renderSafeText(item.id || item.temple_id || item._id);
                const safeName = renderSafeText(item.name);
                const imageSource = resolveTempleImage(item);

                return (
                  <View style={styles.newTempleListPadding}>
                    <TempleCardImageItem
                      key={safeItemId || index}
                      item={item}
                      safeItemId={safeItemId}
                      safeName={safeName}
                      imageSource={imageSource}
                      router={router}
                      t={t}
                      renderSafeText={renderSafeText}
                      getTranslatedTempleName={getTranslatedTempleName}
                      getTranslatedTempleLocation={getTranslatedTempleLocation}
                      getTempleLocation={getTempleLocation}
                    />
                  </View>
                );
              }}
            />

            {/* Char Dham Sub-Circuit Selection Modal */}
            <CharDhamModal
              visible={showCharDhamDropdown}
              onClose={() => setShowCharDhamDropdown(false)}
              charDhamSubFilter={charDhamSubFilter}
              setCharDhamSubFilter={setCharDhamSubFilter}
              t={t}
            />
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  stickyTopTabsWrap: {
    zIndex: 100,
    elevation: 0,
    backgroundColor: 'transparent',
    paddingBottom: 10,
  },
  mainScroll: {
    flex: 1,
  },
  topTabsContainer: {
    paddingHorizontal: 20,
  },
  topTabsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    padding: 4,
    height: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  topTabThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 0,
  },
  topTabButton: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  topTabButtonActive: {},
  topTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  topTabTextActive: {
    color: '#EA4C0F',
  },
  // legacy (kept for other references)
  jaapTabExact: { flex: 1, height: '100%' },
  jaapGradientExact: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  jaapMandalaHeader: { display: 'none' },
  jaapContentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  omSymbolExact: { fontSize: 24, color: '#FFF', fontWeight: '800' },
  tabTextColumn: { justifyContent: 'center' },
  tabTitleExact: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  tabSubExact: { display: 'none' },
  lotusPetalEdge: { display: 'none' },
  petalCurve: { display: 'none' },
  templeTabExact: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  templeContentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  templeIconBoxExact: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  templeTitleExact: { color: '#FF6600', fontSize: 18, fontWeight: '900' },
  templeSubExact: { display: 'none' },
  heroTitleSectionExact: { paddingHorizontal: 25, marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroTextCol: { flex: 1 },
  liveJaapTag: { color: '#FF6600', fontSize: 14, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10 },
  heroMainTitleExact: { fontSize: 26, fontWeight: '800', color: '#2D1400', lineHeight: 34, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  viewAllPillRefined: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,102,0,0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1.2, borderColor: '#FF6600' },
  viewAllTextRefined: { color: '#FF6600', fontSize: 14, fontWeight: '900', marginRight: 2 },
  heroFixedContainer: {
    width: BANNER_WIDTH,
    overflow: 'hidden',
    marginHorizontal: BANNER_H_MARGIN,
    borderRadius: BANNER_RADIUS,
    marginTop: 12,
    backgroundColor: '#1A0A00',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  heroBannerFill: {
    width: '100%',
    height: '100%',
  },
  heroBannerImageStyle: {
    borderRadius: BANNER_RADIUS,
  },
  bannerContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  bannerTopSpacer: {
    flex: 1,
  },
  bannerTextBlock: {
    flexShrink: 1,
    paddingRight: 8,
    marginBottom: 35, // Pushes the text block even further upwards
  },
  mockupLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 3,
  },
  mockupScheduledBadge: {
    backgroundColor: '#FF8800',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 5,
  },
  mockupLiveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  mockupMainTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  mockupTagline: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 18,
  },
  bannerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  bannerTimeText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerFooter: {
    minHeight: 56,
    justifyContent: 'flex-end',
    paddingBottom: 0, // reduced to 0 to push button to bottom edge
  },
  mockupJoinNowBtn: {
    alignSelf: 'flex-start',
    borderRadius: 26,
    zIndex: 4,
    maxWidth: '78%',
    elevation: 8,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    backgroundColor: '#FF6B00',
    overflow: 'hidden',
  },
  mockupJoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 26,
    gap: 8,
  },
  mockupJoinJaapText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  mockupOmCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mockupOmIcon: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  mockupWaveformBox: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row' },
  sectionHeaderParity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 4, marginBottom: 6 },
  viewAllBtnRefined: { paddingHorizontal: 10, paddingVertical: 5 },
  viewAllPillBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  viewAllPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  viewAllPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    lineHeight: 36,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      default: { fontFamily: 'System' },
    }),
  },
  viewAllSaffronRefined: { color: '#FF6600', fontSize: 16, fontWeight: '800' },
  miniCardsRowPadding: { paddingLeft: 25 },
  jaapCardContainer: { width: JAAP_CARD_WIDTH, height: JAAP_CARD_HEIGHT, marginRight: JAAP_CARD_MARGIN_RIGHT, borderRadius: 20, overflow: 'hidden' },
  jaapCardOverlayExact: { flex: 1, padding: 10, justifyContent: 'space-between' },
  jaapCardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  exactLiveBadge: { backgroundColor: '#E31E24', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  exactLiveText: { color: '#FFF', fontSize: Platform.OS === 'android' ? 9.5 : 9, fontWeight: '900' },
  exactCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jaapCardBellBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  jaapCardBellBtnActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: '#FFD700',
  },
  exactCountText: { color: '#FFF', fontSize: 9, fontWeight: '800', marginLeft: 2 },
  jaapCardBottomArea: { width: '100%' },
  jaapCardTitleExact: { color: '#FFF', fontSize: 14, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, marginBottom: 6 },
  jaapCardSlokExact: { display: 'none' },
  exactJoinBtn: { backgroundColor: '#FFF', height: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, justifyContent: 'center', overflow: 'hidden' },
  exactJoinText: { color: '#FF6600', fontSize: 13, fontWeight: '800' },
  waveformIconBox: { display: 'none' },
  sessionsColPadding: { paddingHorizontal: 20 },
  // New session card matching provided design
  sessionCard: {
    backgroundColor: '#F5E6D3',
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  sessionImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    flexShrink: 0,
  },
  sessionTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionCat: {
    color: '#FF6600',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'left',
    marginBottom: 2,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1400',
    lineHeight: 20,
    marginBottom: 2,
  },
  sessionDesc: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
    opacity: 0.75,
    lineHeight: 16,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FF6600',
    borderRadius: 30,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  reminderBtnText: {
    color: '#FF6600',
    fontSize: 15,
    fontWeight: '700',
  },
  // legacy styles kept for other uses
  exactSessionItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBF5', borderRadius: 24, padding: 15, marginBottom: 15, elevation: 5, shadowColor: '#8B4513', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#F5E0C3' },
  exactSessionImg: { width: 100, height: 100, borderRadius: 18, marginRight: 15 },
  exactSessionMainInfo: { flex: 2, gap: 4 },
  exactSessionCat: { color: '#FF6600', fontSize: 12, fontWeight: '900' },
  exactSessionTitle: { fontSize: 18, fontWeight: '800', color: '#2D1400' },
  exactSessionDesc: { fontSize: 12, color: '#8B4513', opacity: 0.7 },
  exactSessionDateTimeCol: { flex: 1.2, gap: 8 },
  exactSessionGoingCol: { flex: 1.2 },
  metaEntry: { flexDirection: 'row', alignItems: 'center' },
  metaEntryText: { fontSize: 13, color: '#8B4513', fontWeight: '700', marginLeft: 8 },
  exactSetReminderBtn: { flex: 1.5, backgroundColor: '#FFF', height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#FFB380', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  exactReminderText: { color: '#FF6600', fontSize: 12, fontWeight: '800' },

  // Temple View Styles
  templeViewContainer: { flex: 1, paddingTop: 20 },
  templeSearchSection: { paddingHorizontal: 20, marginBottom: 15 },
  templeSearchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: '#F5E0C3' },
  templeSearchInputField: { flex: 1, fontSize: 14, color: '#2D1400', fontWeight: '600' },
  templeCatPillsRow: { marginBottom: 14 },
  templeCatPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    borderBottomWidth: 3.5,
    borderBottomColor: 'transparent',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templeCatPillActive: {
    borderBottomColor: '#FF6600',
  },
  templeCatPillText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#666',
  },
  templeCatPillTextActive: {
    color: '#FF6600',
  },
  templeListPadding: { paddingHorizontal: 20 },
  templeCardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 12, marginBottom: 15, elevation: 4, shadowColor: '#8B4513', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#F5E0C3' },
  templeCardImg: { width: 80, height: 80, borderRadius: 18 },
  templeCardInfo: { flex: 1, marginLeft: 15, gap: 4 },
  templeCardName: { fontSize: 17, fontWeight: '800', color: '#2D1400' },
  templeCardLocRow: { flexDirection: 'row', alignItems: 'center' },
  templeCardLocText: { fontSize: 12, color: '#8B4513', fontWeight: '700', marginLeft: 4, opacity: 0.8 },
  templeCardDeity: { fontSize: 11, color: '#8B4513', fontWeight: '600', opacity: 0.6 },
  templeCardTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6600', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  templeCardTagText: { fontSize: 9, fontWeight: '900', color: '#FFF', textTransform: 'uppercase' },
  noTemplesFound: { alignItems: 'center', marginTop: 60, gap: 15 },
  noTemplesText: { fontSize: 16, color: '#8B4513', fontWeight: '700', opacity: 0.5 },

  newTempleSearchSection: { paddingHorizontal: 16, marginTop: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  newTempleSearchBarWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, height: 46, borderWidth: 1, borderColor: '#CCC' },
  newTempleSearchInput: { flex: 1, fontSize: 14, color: '#333', fontFamily: 'Inter_500Medium' },
  filterIconBtn: { padding: 4 },
  newTempleListPadding: { paddingHorizontal: 16, paddingBottom: 6 },
  newTempleOpenBtn: { width: 190, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: '#FF7B00', alignSelf: 'center' },
  newTempleOpenBtnText: { color: '#FF7B00', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  blueBadge: { position: 'absolute', top: -8, left: 12, backgroundColor: '#0084FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  blueBadgeText: { color: '#FFF', fontSize: 9, fontFamily: 'Inter_700Bold' },

  // Premium Char Dham Pill & Modal Styles
  charDhamPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    elevation: 2,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  charDhamPillWrapperActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
    borderWidth: 1.5,
  },
  charDhamPillMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  charDhamPillMainTextActive: {
    color: '#F97316',
  },
  charDhamPillDot: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },
  charDhamPillDotActive: {
    color: '#F97316',
  },
  charDhamPillSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  charDhamPillSubTextActive: {
    color: '#F97316',
  },
});
