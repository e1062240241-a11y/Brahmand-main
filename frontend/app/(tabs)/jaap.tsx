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
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { getTempleImageById, getTempleImageByName, getTempleImageByNameDetailed, resolveTempleImage, TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE } from '../../src/constants/templeImages';
import api, { getTemples } from '../../src/services/api';
import { getCurrentGayatriEnd, isWithinGayatriMantraWindow, formatTime, getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../../src/features/live-mantra/schedule';
import { formatTimeIST } from '../../src/utils/dateUtils';
import { useTranslation } from '../../src/utils/i18n';
import { useScrollToHideTabBar } from '../../src/utils/scroll';
import { Svg, Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { CustomLoader } from '../../src/components/CustomLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_H_MARGIN = 16;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_H_MARGIN * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.48);
const BANNER_RADIUS = 22;
const HERO_DOT_COUNT = 4;

const UPCOMING_GRID_PADDING = Platform.OS === 'android'
  ? 12
  : Math.max(10, (SCREEN_WIDTH - 361) / 2);

const UPCOMING_CARD_WIDTH = Platform.OS === 'android'
  ? (SCREEN_WIDTH - 2 * 12 - 16) / 3
  : 115;

const UPCOMING_CARD_HEIGHT = Platform.OS === 'android'
  ? Math.round(180 * (UPCOMING_CARD_WIDTH / 115))
  : 180;

const JAAP_CARD_WIDTH = Platform.OS === 'android' ? 125 : 115;
const JAAP_CARD_HEIGHT = Platform.OS === 'android' ? 190 : 180;
const JAAP_CARD_MARGIN_RIGHT = Platform.OS === 'android' ? 12 : 16;

const TempleCardImageItem = React.memo(({
  item,
  safeItemId,
  safeName,
  imageSource,
  router,
  t,
  renderSafeText,
  getTranslatedTempleName,
  getTranslatedTempleLocation,
  getTempleLocation,
}: any) => {
  const [currentSource, setCurrentSource] = useState(imageSource);
  const [hasError, setHasError] = useState(false);
  const targetId = item?.temple_id || item?.templeId || item?.id || safeItemId;

  useEffect(() => {
    setCurrentSource(imageSource);
    setHasError(false);

    console.log('[TEMPLE IMAGE COMPONENT MOUNT]', {
      templeId: targetId,
      templeName: safeName,
      source: imageSource,
    });

    return () => {
      console.log('[TEMPLE IMAGE COMPONENT UNMOUNT]', {
        templeId: targetId,
        templeName: safeName,
      });
    };
  }, [imageSource, targetId, safeName]);

  const rawDeity = renderSafeText(item?.deity) || 'LORD SHIVA';
  let formattedDeity = rawDeity;
  if (safeName.toLowerCase().includes('iskcon') || safeName.toLowerCase().includes('borivali')) {
    formattedDeity = 'LORD KRISHNA';
  }
  if (t('language') === 'hi') {
    const upper = formattedDeity.toUpperCase();
    if (upper.includes('SHIVA')) formattedDeity = 'भगवान शिव';
    else if (upper.includes('KRISHNA')) formattedDeity = 'भगवान कृष्ण';
    else if (upper.includes('GANESHA') || upper.includes('GANESH')) formattedDeity = 'भगवान गणेश';
    else if (upper.includes('HANUMAN')) formattedDeity = 'हनुमान जी';
    else if (upper.includes('LAXMI') || upper.includes('LAKSHMI')) formattedDeity = 'माता लक्ष्मी';
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.newTempleCard,
        pressed && Platform.OS === 'ios' && { opacity: 0.8 }
      ]}
      android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
      onPress={() => router.push(`/temple/${encodeURIComponent(safeItemId)}`)}
    >
      {hasError ? (
        <View style={[styles.newTempleCardImg, { backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA' }]}>
          <MaterialCommunityIcons name="temple-hindu" size={40} color="#FF6B00" />
        </View>
      ) : (
        <Image 
          source={currentSource} 
          style={styles.newTempleCardImg} 
          resizeMode="cover"
          onLoad={() => {
            console.log('[TEMPLE IMAGE LOAD SUCCESS]', {
              templeId: targetId,
              templeName: safeName,
              source: currentSource,
            });
          }}
          onError={(event) => {
            console.log('[TEMPLE IMAGE LOAD ERROR]', {
              templeId: targetId,
              templeName: safeName,
              source: currentSource,
              error: event.nativeEvent?.error,
            });
            if (!hasError) {
              setHasError(true);
            }
          }}
        />
      )}
      <View style={styles.newTempleCardInfo}>
        <View>
          <Text style={styles.newTempleCardDeity} numberOfLines={1}>
            {formattedDeity}
          </Text>
          <Text style={styles.newTempleCardName} numberOfLines={2}>{getTranslatedTempleName(safeName)}</Text>
          <Text style={styles.newTempleCardLoc} numberOfLines={1}>{getTranslatedTempleLocation(getTempleLocation(item), safeName)}</Text>
        </View>
      </View>
    </Pressable>
  );
});


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LIVE_JAAPS = [
  { 
    id: '1', 
    title: 'Hanuman\nChalisa', 
    devotees: '9.6K', 
    image: require('../../assets/images/hanuman_jaap_card_v2.webp'),
    slok: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि...'
  },
  { 
    id: '2', 
    title: 'Hare Krishna\nJaap', 
    devotees: '6.4K', 
    image: require('../../assets/images/krishna_jaap_card_v2.webp'),
    slok: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे...'
  },
  { 
    id: '3', 
    title: 'Om Namah\nShivaya', 
    devotees: '5.2K', 
    image: require('../../assets/images/shiva_jaap_card_v2.webp'),
    slok: 'ॐ नमः शिवाय ॐ नमः शिवाय...'
  },
  { 
    id: '4', 
    title: 'Gayatri\nMantra', 
    devotees: '4.8K', 
    image: require('../../assets/images/gayatri_jaap_card_v4_exact_clean.webp'),
    slok: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...'
  },
];

const UPCOMING_SESSIONS = [
  { id: '1', category: 'YOGA CLASS', title: 'Morning Yoga Flow', desc: 'Start your day with energy and positivity.', date: 'Tomorrow', time: '6:00 AM', going: '2.4K going', image: require('../../assets/images/yoga_session_img.webp') },
  { id: '2', category: 'GEETA PATH', title: 'Bhagavad Gita Chapter 2', desc: 'Dive deep into wisdom.', date: 'Tomorrow', time: '7:30 PM', going: '3.2K going', image: require('../../assets/images/geeta_session_v3.webp') },
  { id: '3', category: 'SANSKRIT CLASS', title: 'Sanskrit Language Basics', desc: 'Learn. Chant. Connect.', date: '21 May', time: '6:30 PM', going: '1.9K going', image: require('../../assets/images/sanskrit_session_v2_exact.webp') },
  { id: '4', category: 'MEDITATION', title: 'Breathing & Meditation', desc: 'Find calm within.', date: '22 May', time: '6:00 AM', going: '2.1K going', image: require('../../assets/images/yoga_session_img.webp') },
];

const UPCOMING_JAAPS = [
  {
    id: 'uj1',
    title: 'Ganesh Jaap',
    titleHi: 'गणेश जाप',
    mantraType: 'ganesh_aarti',
    image: require('../../assets/images/upcoming_ganesh.webp'),
    allowedDays: [3], // Wednesday
  },
  {
    id: 'uj2',
    title: 'Shani Chalisa',
    titleHi: 'शनि चालीसा',
    mantraType: 'shani_chalisa',
    image: require('../../assets/images/upcoming_shani.webp'),
    allowedDays: [6], // Saturday
  },
  {
    id: 'uj3',
    title: 'Shiv Mantra',
    titleHi: 'शिव मंत्र',
    mantraType: 'shiva',
    image: require('../../assets/images/upcoming_shiva.webp'),
    allowedDays: [1], // Monday
  },
  {
    id: 'uj4',
    title: 'Ganga Mantra',
    titleHi: 'गंगा मंत्र',
    mantraType: 'ganga',
    image: require('../../assets/images/upcoming_ganga.webp'),
    allowedDays: [0], // Sunday
  },
  {
    id: 'uj5',
    title: 'Radha Rani Jaap',
    titleHi: 'राधा रानी जाप',
    mantraType: 'radha_rani',
    image: require('../../assets/images/upcoming_radha_rani.webp'),
    allowedDays: [5], // Friday
  },
  {
    id: 'uj6',
    title: 'Durga Saptashati',
    titleHi: 'दुर्गा सप्तशती',
    mantraType: 'durga',
    image: require('../../assets/images/upcoming_durga.webp'),
    allowedDays: [2], // Tuesday
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

const getDayName = (day: number, lang: string) => {
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  return lang === 'hi' ? daysHi[day] : daysEn[day];
};

const getDayNameShort = (day: number, lang: string) => {
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
  return lang === 'hi' ? daysHi[day] : daysEn[day];
};

const BellIconSvg = ({ active, size = 13 }: { active: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <G clipPath="url(#bellClip)">
      <Path
        d="M14.7199 4.48486C14.6031 4.54595 14.4732 4.57778 14.3413 4.57762C14.0331 4.57814 13.7503 4.40665 13.6082 4.13307C13.107 3.13993 12.3475 2.30018 11.4095 1.70213C10.8632 1.37905 10.8715 0.585705 11.4244 0.274111C11.6959 0.121148 12.0303 0.134267 12.289 0.308017C13.473 1.0647 14.4344 2.12285 15.0745 3.37383C15.2834 3.77853 15.1247 4.27602 14.7199 4.48486ZM2.39069 4.13307C2.89187 3.13993 3.65139 2.30018 4.5894 1.70213C5.1417 1.38936 5.14831 0.596005 4.60129 0.27408C4.32368 0.110698 3.97634 0.123955 3.71198 0.308017C2.52791 1.0647 1.56653 2.12285 0.9265 3.37383C0.717213 3.77799 0.874982 4.27527 1.27898 4.48486C1.39581 4.54595 1.52573 4.57778 1.65757 4.57762C1.96583 4.57814 2.24864 4.40665 2.39069 4.13307ZM14.3125 10.8906C14.9535 11.7321 14.4433 12.952 13.394 13.0864C13.3367 13.0938 13.2791 13.0975 13.2214 13.0976H11.0096C10.7936 15.4148 8.15007 16.6292 6.25132 15.2835C5.53205 14.7737 5.07113 13.9754 4.98929 13.0976H2.77753C1.71968 13.0976 1.05848 11.9525 1.58737 11.0364C1.61657 10.9858 1.64897 10.9371 1.68436 10.8906C2.17701 10.2496 2.76516 9.0616 2.77547 7.04704C2.77706 3.02641 7.1305 0.515236 10.6117 2.52692C12.2273 3.46055 13.2221 5.18518 13.2214 7.05116C13.2317 9.0616 13.8198 10.2496 14.3125 10.8906ZM9.34615 13.0976H6.65274C6.86325 14.1343 8.11707 14.5543 8.90963 13.8537C9.13345 13.6558 9.2867 13.3904 9.34615 13.0976ZM12.6951 11.4486C12.1344 10.5553 11.5826 9.14199 11.5723 7.05528C11.5739 4.30487 8.59751 2.58414 6.21479 3.95797C5.10896 4.59557 4.42729 5.77469 4.42656 7.05116C4.41625 9.1413 3.86451 10.5553 3.30384 11.4486H12.6951Z"
        fill={active ? "#FFF" : "#FF7B00"}
      />
    </G>
    <Defs>
      <ClipPath id="bellClip">
        <Rect width={16} height={16} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default function JaapLandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const onJaapScrollTabBar = useScrollToHideTabBar();
  const [now, setNow] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'jaap' | 'temple'>('jaap');
  const sectionAnim = useRef(new Animated.Value(0)).current;
  const [heroBannerIndex, setHeroBannerIndex] = useState(0);
  const hanumanStatus = getCurrentHanumanStatus(now);
  const [invitedJaapId, setInvitedJaapId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [sessionReminders, setSessionReminders] = useState<Record<string, boolean>>({});
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
    const interval = setInterval(fetchActiveCounts, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isFocused, activeSection]);

  const sendJaapInviteFromCard = async (jaapId: string, mantraType: string, title: string) => {
    try {
      await api.post('/jaap/invite', {
        mantra_type: mantraType,
        mantra_title: title,
      });
      setInvitedJaapId(jaapId);
      const alertTitle = t('language') === 'hi' ? '🙏 निमंत्रण भेजा गया!' : '🙏 Invite Sent!';
      const alertMsg = t('language') === 'hi' ? `सभी भक्तों को ${title} में शामिल होने की सूचना दे दी गई है!` : `All devotees have been notified to join ${title}!`;
      Alert.alert(alertTitle, alertMsg);
      setTimeout(() => setInvitedJaapId(null), 10000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (t('language') === 'hi' ? 'निमंत्रण नहीं भेजा जा सका। कृपया पुनः प्रयास करें।' : 'Could not send invite. Please try again.');
      Alert.alert(t('language') === 'hi' ? 'निमंत्रण विफल' : 'Invite failed', msg);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await api.get('/jaap/reminders');
      if (response.data && response.data.reminders) {
        const loadedReminders: Record<string, boolean> = {};
        response.data.reminders.forEach((r: any) => {
          if (r.mantra_type === 'hanuman') {
            loadedReminders['1'] = true;
          } else if (r.mantra_type === 'krishna') {
            loadedReminders['2'] = true;
          } else if (r.mantra_type === 'shiva') {
            loadedReminders['3'] = true;
            loadedReminders['uj3'] = true;
          } else if (r.mantra_type === 'gayatri') {
            loadedReminders['4'] = true;
          } else if (r.mantra_type === 'radha_rani') {
            loadedReminders['uj5'] = true;
          } else if (r.mantra_type === 'ganesh') {
            loadedReminders['5'] = true;
          } else if (r.mantra_type === 'laxmi') {
            loadedReminders['6'] = true;
          } else if (r.mantra_type === 'ganesh_aarti') {
            loadedReminders['uj1'] = true;
          } else if (r.mantra_type === 'shani_chalisa') {
            loadedReminders['uj2'] = true;
          } else if (r.mantra_type === 'ganga') {
            loadedReminders['uj4'] = true;
          } else if (r.mantra_type === 'durga') {
            loadedReminders['uj6'] = true;
          }
        });
        setReminders(loadedReminders);
      }
    } catch (err) {
      console.warn('Failed to fetch reminders:', err);
    }
  };

  const handleSetReminder = async (jaapId: string, mantraType: string, sessionName: string) => {
    try {
      const response = await api.post('/jaap/reminder', {
        mantra_type: mantraType,
        session_name: sessionName,
      });
      const active = response.data.active;
      
      setReminders(prev => {
        const updated = { ...prev, [jaapId]: active };
        if (jaapId === '3' || jaapId === 'uj3') {
          updated['3'] = active;
          updated['uj3'] = active;
        }
        return updated;
      });
      
      let readableMantra = '';
      if (t('language') === 'hi') {
        if (mantraType === 'shiva') readableMantra = 'ॐ नमः शिवाय';
        else if (mantraType === 'hanuman') readableMantra = 'हनुमान चालीसा';
        else if (mantraType === 'krishna') readableMantra = 'कृष्णा जाप';
        else if (mantraType === 'gayatri') readableMantra = 'गायत्री मंत्र';
        else if (mantraType === 'ganesh') readableMantra = 'गणेश मंत्र';
        else if (mantraType === 'laxmi') readableMantra = 'लक्ष्मी मंत्र';
        else if (mantraType === 'ganesh_aarti') readableMantra = 'गणेश जाप';
        else if (mantraType === 'shani_chalisa') readableMantra = 'शनि चालीसा';
        else if (mantraType === 'ganga') readableMantra = 'गंगा मंत्र';
        else if (mantraType === 'durga') readableMantra = 'दुर्गा सप्तशती';
        else if (mantraType === 'radha_rani') readableMantra = 'राधा रानी जाप';
        else readableMantra = `${mantraType} जाप`;
      } else {
        if (mantraType === 'ganesh_aarti') readableMantra = 'Ganesh Jaap';
        else if (mantraType === 'shani_chalisa') readableMantra = 'Shani Chalisa';
        else if (mantraType === 'ganga') readableMantra = 'Ganga Mantra';
        else if (mantraType === 'durga') readableMantra = 'Durga Saptashati';
        else if (mantraType === 'radha_rani') readableMantra = 'Radha Rani Jaap';
        else readableMantra = mantraType === 'shiva' ? 'Om Namah Shivaya' : `${mantraType.charAt(0).toUpperCase() + mantraType.slice(1)} Chanting`;
      }

      if (active) {
        const titleText = t('language') === 'hi' ? '🔔 रिमाइंडर सक्रिय' : '🔔 Reminder Set!';
        const msgText = t('language') === 'hi' 
          ? `${readableMantra} के लिए आपका रिमाइंडर सफलतापूर्वक सक्रिय हो गया है।`
          : `Your reminder for ${readableMantra} has been successfully scheduled.`;
        Alert.alert(titleText, msgText);
      } else {
        const titleText = t('language') === 'hi' ? '🔔 रिमाइंडर हटाया गया' : '🔔 Reminders Removed';
        const msgText = t('language') === 'hi'
          ? `आपने ${readableMantra} की सूचनाओं को बंद कर दिया है।`
          : `You have unsubscribed from notifications for ${readableMantra}.`;
        Alert.alert(titleText, msgText);
      }
    } catch (err: any) {
      console.error('Failed to toggle reminder:', err);
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error', 
        t('language') === 'hi' ? 'रिमाइंडर चालू/बंद नहीं किया जा सका। कृपया पुनः लॉगिन करें।' : 'Could not toggle reminder. Please login again.'
      );
    }
  };

  const handleUpcomingCardPress = (jaap: any) => {
    const title = t('language') === 'hi' ? jaap.titleHi : jaap.title;
    Alert.alert(
      t('language') === 'hi' ? '🙏 जल्द ही आ रहा है' : '🙏 Coming Soon',
      t('language') === 'hi'
        ? `${title} सेवा जल्द ही आ रही है। कृपया प्रतीक्षा करें!`
        : `${title} is coming soon. Stay tuned!`
    );
  };


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

  useEffect(() => {
    if (isFocused) {
      fetchReminders();
    }
  }, [isFocused]);

  // Auto-scroll effect for More Live Jaaps
  useEffect(() => {
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
  }, []);

  const liveActive = isWithinGayatriMantraWindow(now);
  const liveEnd = getCurrentGayatriEnd(now);

  const fetchTemplesData = async () => {
    try {
      setLoadingTemples(true);
      const response = await getTemples();
      if (response.data) {
        setTemples(response.data);
        console.log('[TEMPLE SOURCE]', response.data.length, 'localDbCount: N/A', response.data.length);
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

  // Case-insensitive category helpers
  const BADA_CHAR_DHAM_IDS = [
    'chardham-badrinath-temple-uttarakhand',
    'chardham-dwarkadhish-temple-dwarka',
    'chardham-jagannath-temple-puri',
    'jyotirling-ramanathaswamy-temple-rameswaram',
  ];

  const CHOTA_CHAR_DHAM_IDS = [
    'chardham-badrinath-temple-uttarakhand',
    'jyotirling-kedarnath-temple-uttarakhand',
    'chardham-gangotri-temple-uttarakhand',
    'chardham-yamunotri-temple-uttarakhand',
  ];

  const isJyotirlinga = (t: any) => {
    const category = (t.category || '').trim().toLowerCase();
    const categoryIds = Array.isArray(t.category_ids)
      ? t.category_ids.map((c: string) => String(c).toLowerCase())
      : [];
    return category === 'jyotirlinga' || categoryIds.includes('jyotirlinga');
  };

  const isShaktiPeetha = (t: any) => {
    const category = (t.category || '').trim().toLowerCase();
    const categoryIds = Array.isArray(t.category_ids)
      ? t.category_ids.map((c: string) => String(c).toLowerCase())
      : [];
    return category.includes('shakti') || categoryIds.some((c: string) => c.includes('shakti'));
  };

  const isBadaCharDham = (t: any) => {
    const tid = (t.temple_id || t.id || '').toLowerCase();
    return BADA_CHAR_DHAM_IDS.includes(tid);
  };

  const isChotaCharDham = (t: any) => {
    const tid = (t.temple_id || t.id || '').toLowerCase();
    return CHOTA_CHAR_DHAM_IDS.includes(tid);
  };

  const isCharDham = (t: any) => {
    return isBadaCharDham(t) || isChotaCharDham(t);
  };

  const HEALING_TEMPLE_IDS = [
    // 1-15: Mental & Emotional Wellbeing Shrines
    'healing-ramanasramam-tiruvannamalai',
    'healing-dhyanalinga-isha-coimbatore',
    'jyotirling-mahakaleshwar-temple-ujjain',
    'healing-virupaksha-temple-hampi',
    'healing-anandamayi-ma-ashram-haridwar',
    'sacred-golden-temple-amritsar',
    'hanuman-mehendipur-balaji-temple-dausa',
    'shaktipeeth-kamakhya-temple-guwahati',
    'healing-parmarth-niketan-rishikesh',
    'healing-sri-aurobindo-ashram-puducherry',
    'sacred-belur-math-ramakrishna-mission',
    'healing-sarnath-buddhist-monastery',
    'sacred-mahabodhi-temple-bodh-gaya',
    'devi-kollur-mookambika-temple',
    'devi-chottanikara-temple-kochi',

    // 16-34: Physical Health & Recovery Shrines
    'sacred-vaitheeswaran-koil-mayiladuthurai',
    'jyotirling-baidyanath-temple-deoghar',
    'healing-parli-vaijnath-temple',
    'healing-dhanvantari-temple-kerala',
    'sacred-suchindram-thanumalayan-temple',
    'healing-ghati-subramanya-temple',
    'panchbhoota-srikalahasteeswara-temple-srikalahasti',
    'sacred-kukke-subramanya-temple',
    'jyotirling-trimbakeshwar-temple-nashik',
    'jyotirling-omkareshwar-temple-madhya-pradesh',
    'jyotirling-ramanathaswamy-temple-rameswaram',
    'jyotirling-kashi-vishwanath-temple-varanasi',
    'jyotirling-somnath-temple-gujarat',
    'jyotirling-nageshwar-temple-dwarka',
    'jyotirling-grishneshwar-temple-ellora',
    'jyotirling-mallikarjuna-temple-srisailam',
    'jyotirling-kedarnath-temple-uttarakhand',
    'jyotirling-bhimashankar-temple-maharashtra',
    'healing-mangaladevi-temple-mangalore'
  ];

  const isHealingTemple = (t: any) => {
    const tid = (t.temple_id || t.id || '').toLowerCase();
    return HEALING_TEMPLE_IDS.includes(tid);
  };

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

  const jyotirlingaTemples = (temples || []).filter(isJyotirlinga);

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

  const heroTitle = t('language') === 'hi'
    ? (liveActive ? 'महामृत्युंजय मंत्र' : 'सायंकालीन गायत्री जाप')
    : (liveActive ? 'Mahamrityunjaya Mantra' : 'Evening Gayatri Chanting');
  const heroTagline = t('language') === 'hi'
    ? (liveActive
        ? 'हम जाप करते हैं। हम ठीक होते हैं।\nहम एक साथ उठते हैं।'
        : 'दिव्य प्रकाश से जुड़ें। शाम 6:00 बजे से शुरू।')
    : (liveActive
        ? 'We chant. We heal.\nWe rise together.'
        : 'Connect with the divine light. Starting at 6:00 PM.');
  const heroTimeLabel = t('language') === 'hi'
    ? (liveActive
        ? `शाम ${liveEnd ? formatTime(liveEnd) : '5:00'} बजे तक लाइव`
        : 'अगला सत्र: आज शाम 6:00 बजे')
    : (liveActive
        ? `Live until ${liveEnd ? formatTime(liveEnd) : '5:00 PM'}`
        : 'Next Session: 6:00 PM Today');

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
          <View style={{ backgroundColor: 'transparent', paddingTop: 12, zIndex: 10 }}>
            <View style={[styles.heroFixedContainer, { height: BANNER_HEIGHT, marginTop: 0 }]}>
              <ImageBackground
                source={require('../../assets/images/jaap_hero_shiva_final.webp')}
                style={styles.heroBannerFill}
                imageStyle={styles.heroBannerImageStyle}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
                  locations={[0, 0.38, 1]}
                  style={StyleSheet.absoluteFillObject}
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
                          {heroTitle}
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
                        {heroTagline}
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
                          {heroTimeLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.bannerFooter}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.mockupJoinNowBtn,
                        pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                      ]}
                      android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                      onPress={() =>
                        router.push({
                          pathname: '/live-jaap-welcome',
                          params: {
                            mantraType: liveActive ? 'mrityunjaya' : 'gayatri',
                            title: liveActive ? 'Maha Mrityunjaya' : 'Gayatri Mantra',
                          },
                        })
                      }
                    >
                      <LinearGradient
                        colors={['#FF6B00', '#FF8800']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.mockupJoinGradient}
                      >
                        <MaterialCommunityIcons name="broadcast" size={17} color="#FFF" />
                        <Text style={styles.mockupJoinJaapText}>
                          {liveActive 
                            ? (t('language') === 'hi' ? 'लाइव जाप में शामिल हों' : 'Join Live Jaap') 
                            : (t('language') === 'hi' ? 'रिमाइंडर सेट करें' : 'Set Reminder')}
                        </Text>
                        <Ionicons name="chevron-forward" size={15} color="#FFF" />
                      </LinearGradient>
                    </Pressable>

                    <View style={styles.bannerDotsRow} pointerEvents="none">
                      {Array.from({ length: HERO_DOT_COUNT }).map((_, index) => (
                        <View
                          key={`hero-dot-${index}`}
                          style={[
                            styles.bannerDot,
                            index === heroBannerIndex && styles.bannerDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>
          </View>

            <View style={styles.sectionHeaderParity}>
              <Text style={styles.sectionTitleText}>{t('moreLiveJaaps')}</Text>
              <Pressable
                style={({ pressed }) => [
                  { flexDirection: 'row', alignItems: 'center' },
                  pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                ]}
                android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                onPress={() => router.push('/all-live-jaaps' as any)}
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
                  <Pressable
                    key={jaap.id}
                    style={({ pressed }) => [
                      styles.jaapCardContainer,
                      { backgroundColor: '#1A0A00' },
                      pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                    ]}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
                    onPress={() => router.push({
                      pathname: '/live-jaap-welcome',
                      params: {
                        mantraType: jaap.id === '1' ? 'hanuman' : jaap.id === '2' ? 'krishna' : jaap.id === '3' ? 'shiva' : jaap.id === '4' ? 'gayatri' : jaap.id === '5' ? 'ganesh' : jaap.id === '6' ? 'laxmi' : 'krishna',
                        title: jaap.title.replace('\n', ' ')
                      }
                    })}
                  >
                    <Image
                      source={jaap.image}
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      resizeMode="cover"
                    />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.jaapCardOverlayExact}>
                      <View style={styles.jaapCardTopRow}>
                        <View style={[styles.exactLiveBadge, (!showLive) && styles.mockupScheduledBadge, { maxWidth: showLive ? '65%' : '100%', paddingHorizontal: 8 }]}>
                          <Ionicons name={showLive ? "radio" : "time-outline"} size={10} color="#FFF" style={{ marginRight: 3 }} />
                          <Text style={[styles.exactLiveText, { flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{liveLabel}</Text>
                        </View>
                        {showLive && (
                          <View style={styles.exactCountBadge}>
                            <Ionicons name="people" size={10} color="#FFF" style={{ marginRight: 2 }} />
                            <Text style={styles.exactCountText}>
                              {(activeCounts[getMantraRoomName(jaap.id)] || 0).toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    <View style={styles.jaapCardBottomArea}>
                      <Text style={styles.jaapCardTitleExact}>{translatedTitle}</Text>
                      <Text style={styles.jaapCardSlokExact} numberOfLines={2}>{jaap.slok}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.exactJoinBtn,
                            { flex: 1 },
                            pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                          ]}
                          android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                          onPress={() => router.push({
                            pathname: '/live-jaap-welcome',
                            params: {
                              mantraType: jaap.id === '1' ? 'hanuman' : jaap.id === '2' ? 'krishna' : jaap.id === '3' ? 'shiva' : jaap.id === '4' ? 'gayatri' : jaap.id === '5' ? 'ganesh' : jaap.id === '6' ? 'laxmi' : 'krishna',
                              title: jaap.title.replace('\n', ' ')
                            }
                          })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Text style={styles.exactJoinText}>{t('join')}</Text>
                            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                              <Path d="M8.00596 0C1.85215 0 -1.99398 6.66666 1.08293 12C4.15983 17.3333 11.8521 17.3333 14.929 12C15.6306 10.7838 16 9.40429 16 8C15.9953 3.58365 12.419 0.00466837 8.00596 0ZM11.1229 8.50615L7.12585 11.2754C6.7365 11.5448 6.2017 11.2914 6.16322 10.8193C6.16187 10.8026 6.16118 10.7859 6.16118 10.7692V5.23077C6.16119 4.75705 6.67363 4.46098 7.08358 4.69784C7.09802 4.70619 7.11213 4.71512 7.12585 4.72462L11.1229 7.49384C11.4764 7.73853 11.4764 8.26147 11.1229 8.50615Z" fill="#FF7B00"/>
                            </Svg>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
              })}
            </ScrollView>

            {/* Katha Section (Temporarily hidden from UI) */}
            <View style={styles.sectionHeaderParity}>
              <Text style={styles.sectionTitleText}>
                {t('language') === 'hi' ? 'कथा' : 'Katha'}
              </Text>
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Pressable
                style={({ pressed }) => [
                  styles.bookCardKatha,
                  pressed && Platform.OS === 'ios' && { opacity: 0.9 }
                ]}
                android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                onPress={() => router.push('/library/katha' as any)}
              >
                <View style={styles.coverBoxKatha}>
                  <Image
                    source={require('../../assets/images/shamik_pathak_ji.webp')}
                    style={styles.coverImgKatha}
                    resizeMode="cover"
                  />
                  <View style={styles.progressTrackKatha}>
                    <View style={[styles.progressFillKatha, { width: '0%' }]} />
                  </View>
                </View>

                <View style={styles.bookMetaKatha}>
                  <Text style={styles.bookNameKatha} numberOfLines={1}>Shamik Pathak ji</Text>
                  <Text style={styles.bookSubKatha} numberOfLines={1}>Spiritual Guru • Astrologer • Panditji</Text>
                </View>
              </Pressable>
            </View>

            {/* More Upcoming Jaaps Section */}
            <View style={styles.sectionHeaderParity}>
              <Text style={styles.sectionTitleText}>
                {t('language') === 'hi' ? 'और आगामी जाप' : 'More Upcoming Jaaps'}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  { flexDirection: 'row', alignItems: 'center' },
                  pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                ]}
                android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                onPress={() => router.push('/all-live-jaaps' as any)}
              >
                <Text style={styles.viewAllSaffronRefined}>{t('viewAll')}</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF6600" />
              </Pressable>
            </View>

            <View style={[styles.upcomingGridContainer, { paddingHorizontal: UPCOMING_GRID_PADDING }]}>
              {UPCOMING_JAAPS.map((jaap) => {
                const isReminderActive = !!reminders[jaap.id];
                const displayName = t('language') === 'hi' ? jaap.titleHi : jaap.title;
                return (
                  <Pressable
                    key={jaap.id}
                    style={({ pressed }) => [
                      styles.upcomingCard,
                      { width: UPCOMING_CARD_WIDTH, height: UPCOMING_CARD_HEIGHT },
                      pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                    ]}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
                    onPress={() => handleUpcomingCardPress(jaap)}
                  >
                    <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, overflow: 'hidden' }]}>
                      <Image 
                        source={jaap.image} 
                        style={{ width: '100%', height: '100%', position: 'absolute' }} 
                        resizeMode="cover" 
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.8)']}
                        locations={[0, 0.5, 1]}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      <View style={styles.upcomingCardContent}>
                        <Text style={styles.upcomingCardTitle} numberOfLines={2}>
                          {displayName}
                        </Text>

                        <View style={[
                          styles.upcomingReminderBtn,
                          {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            borderWidth: 1,
                            elevation: 0,
                            shadowOpacity: 0,
                          }
                        ]}>
                          <Text style={{
                            color: '#FFF',
                            fontSize: 10,
                            fontWeight: '700',
                            letterSpacing: 0.5,
                          }} numberOfLines={1}>
                            {t('language') === 'hi' ? 'जल्द ही आ रहा है' : 'COMING SOON'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

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
                    source={require('../../assets/images/imagetemple/SomnathTemple.webp')}
                    style={styles.heroBannerFill}
                    imageStyle={styles.heroBannerImageStyle}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
                      locations={[0, 0.38, 1]}
                      style={StyleSheet.absoluteFillObject}
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
                            {t('language') === 'hi' ? '1,248 भक्त जाप कर रहे हैं' : '1,248 devotees are chanting'}
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
                          android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                          onPress={() =>
                            router.push({
                              pathname: '/temple/[id]',
                              params: {
                                id: 'jyotirling-somnath-temple-gujarat',
                                autoplayAarti: 'true',
                              },
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
                            android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
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
                                color={isSelected ? "#FFFFFF" : "#8B4513"} 
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
                          android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
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
          <Modal
            visible={showCharDhamDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCharDhamDropdown(false)}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => setShowCharDhamDropdown(false)}
            >
              <View style={styles.charDhamModalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>
                    {t('language') === 'hi' ? 'चार धाम परिपथ चुनें' : 'Select Pilgrimage Circuit'}
                  </Text>
                  <Pressable onPress={() => setShowCharDhamDropdown(false)} hitSlop={10}>
                    <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                  </Pressable>
                </View>

                {[
                  {
                    id: 'all',
                    titleEn: 'All Char Dham',
                    titleHi: 'सभी चार धाम',
                    subtitleEn: '7 Unique Sacred Shrines',
                    subtitleHi: '7 मुख्य पवित्र तीर्थ',
                    count: 7,
                  },
                  {
                    id: 'bada',
                    titleEn: 'Bada Char Dham',
                    titleHi: 'बड़ा चार धाम',
                    subtitleEn: 'National Pilgrimage Circuit (4 Shrines)',
                    subtitleHi: 'राष्ट्रीय चार धाम यात्रा (4 दिशाएं)',
                    count: 4,
                  },
                  {
                    id: 'chota',
                    titleEn: 'Chota Char Dham',
                    titleHi: 'छोटा चार धाम',
                    subtitleEn: 'Himalayan Shrine Circuit (4 Shrines)',
                    subtitleHi: 'हिमालयी चार धाम यात्रा (उत्तराखंड)',
                    count: 4,
                  },
                ].map((item) => {
                  const isSelected = charDhamSubFilter === item.id;
                  const title = t('language') === 'hi' ? item.titleHi : item.titleEn;
                  const subtitle = t('language') === 'hi' ? item.subtitleHi : item.subtitleEn;

                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.charDhamOptionRow,
                        isSelected && styles.charDhamOptionRowSelected,
                        pressed && { opacity: 0.85 }
                      ]}
                      onPress={() => {
                        setCharDhamSubFilter(item.id as any);
                        setShowCharDhamDropdown(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.charDhamOptionTitle, isSelected && styles.charDhamOptionTitleSelected]}>
                            {title}
                          </Text>
                          <View style={styles.charDhamBadge}>
                            <Text style={styles.charDhamBadgeText}>{item.count}</Text>
                          </View>
                        </View>
                        <Text style={styles.charDhamOptionSubtitle}>{subtitle}</Text>
                      </View>

                      <MaterialCommunityIcons
                        name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                        size={22}
                        color={isSelected ? "#F97316" : "#D1D5DB"}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Modal>
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
    elevation: 10,
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
  bannerDotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6, // Moved dots lower
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  bannerDotActive: {
    width: 18,
    backgroundColor: '#FF6600',
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
  exactJoinBtn: { backgroundColor: '#FFF', height: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, justifyContent: 'center' },
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
  templeCatPillsRow: { marginBottom: 12 },
  templeCatPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#F5E0C3' },
  templeCatPillActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  templeCatPillText: { fontSize: 13, fontWeight: '700', color: '#8B4513' },
  templeCatPillTextActive: { color: '#FFF' },
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
  newTempleCard: { backgroundColor: '#FFF', minHeight: 127, alignSelf: 'stretch', borderRadius: 16, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  newTempleCardImg: { width: 80, height: 95, borderRadius: 12 },
  newTempleCardInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  newTempleCardDeity: { color: '#FF6B35', fontSize: 11, fontWeight: '700', lineHeight: 15, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2, alignSelf: 'flex-start' },
  newTempleCardName: { color: '#1C1C1E', fontSize: 15, fontWeight: '700', lineHeight: 20, marginBottom: 2 },
  newTempleCardLoc: { color: 'rgba(0, 0, 0, 0.61)', fontSize: 13, fontWeight: '400', lineHeight: 18 },
  newTempleOpenBtn: { width: 190, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: '#FF7B00', alignSelf: 'center' },
  newTempleOpenBtnText: { color: '#FF7B00', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  blueBadge: { position: 'absolute', top: -8, left: 12, backgroundColor: '#0084FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  blueBadgeText: { color: '#FFF', fontSize: 9, fontFamily: 'Inter_700Bold' },
  upcomingGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 8,
    rowGap: 16,
    marginBottom: 20,
  },
  upcomingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A0A00',
  },
  upcomingCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
    paddingBottom: 10,
  },
  upcomingCardTitle: {
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 16.25,
  },
  upcomingReminderBtn: {
    backgroundColor: '#FFF',
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingReminderBtnActive: {
    backgroundColor: '#FF7B00',
  },
  upcomingReminderBtnText: {
    color: '#FF7B00',
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingReminderBtnTextActive: {
    color: '#FFF',
  },
  upcomingDayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  upcomingDayBadgeActive: {
    backgroundColor: '#FF6600',
  },
  upcomingDayBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bookCardKatha: {
    width: 192,
  },
  coverBoxKatha: {
    width: '100%',
    height: 250,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  coverImgKatha: {
    width: '100%',
    height: '100%',
  },
  progressTrackKatha: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(160,65,0,0.20)',
  },
  progressFillKatha: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  bookMetaKatha: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  bookNameKatha: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1C1C',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 2,
    lineHeight: 20,
  },
  bookSubKatha: {
    fontSize: 12,
    color: '#5A4136',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.2,
    lineHeight: 16,
  },

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  charDhamModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  charDhamOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charDhamOptionRowSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  charDhamOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  charDhamOptionTitleSelected: {
    color: '#F97316',
  },
  charDhamOptionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  charDhamBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  charDhamBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
  },
});
