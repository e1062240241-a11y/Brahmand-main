// accessibility: placeholder
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../src/services/api';
import { Svg, Path } from 'react-native-svg';

import { getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../src/features/live-mantra/schedule';
import { useTranslation } from '../src/utils/i18n';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2;

const LIVE_JAAPS = [
  {
    id: '1',
    title: 'Hanuman\nChalisa',
    devotees: '9.6K',
    mantraType: 'hanuman',
    image: require('../assets/images/hanuman_jaap_card_v2.webp'),
    slok: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि...',
    color: '#FF6B00',
  },
  {
    id: '2',
    title: 'Hare Krishna\nJaap',
    devotees: '6.4K',
    mantraType: 'krishna',
    image: require('../assets/images/krishna_jaap_card_v2.webp'),
    slok: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे...',
    color: '#1A6BB5',
  },
  {
    id: '3',
    title: 'Om Namah\nShivaya',
    devotees: '5.2K',
    mantraType: 'shiva',
    image: require('../assets/images/shiva_jaap_card_v2.webp'),
    slok: 'ॐ नमः शिवाय ॐ नमः शिवाय...',
    color: '#7B3F9E',
  },
  {
    id: '4',
    title: 'Gayatri\nMantra',
    devotees: '4.8K',
    mantraType: 'gayatri',
    image: require('../assets/images/gayatri_jaap_card_v4_exact_clean.webp'),
    slok: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...',
    color: '#D4AF37',
  },
];

export default function AllLiveJaapsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [now, setNow] = React.useState(new Date());
  const [activeCounts, setActiveCounts] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ['jaap_hanuman', 'jaap_krishna', 'jaap_shiva', 'jaap_gayatri', 'jaap_ganesh', 'jaap_laxmi'].forEach(room => {
      initial[room] = Math.floor(Math.random() * 17) + 2;
    });
    return initial;
  });

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    let active = true;
    const fetchActiveCounts = async () => {
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
  }, []);

  const hanumanStatus = getCurrentHanumanStatus(now);

  const goToJaap = (jaap: (typeof LIVE_JAAPS)[0]) => {
    router.push({
      pathname: '/live-jaap-welcome',
      params: { mantraType: jaap.mantraType, title: jaap.title.replace('\n', ' ') },
    });
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/jaap');
            }
          }} 
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#FF6600" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('language') === 'hi' ? 'सभी लाइव जाप' : 'All Live Jaaps'}</Text>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{LIVE_JAAPS.length} {t('language') === 'hi' ? 'अभी लाइव' : 'Live Now'}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Devotee count banner */}
      <LinearGradient
        colors={['#FFF4EB', '#FFE8D6']}
        style={styles.bannerRow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="people" size={18} color="#FF6600" />
        <Text style={styles.bannerText}>
          {t('language') === 'hi' 
            ? <Text>जुड़ें <Text style={styles.bannerBold}>50,000+</Text> भक्त अभी एकसाथ जाप कर रहे हैं</Text>
            : <Text>Join <Text style={styles.bannerBold}>50,000+</Text> devotees chanting together right now</Text>}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {LIVE_JAAPS.map((jaap) => {
          const isHanuman = jaap.mantraType === 'hanuman';
          const isKedarnath = jaap.mantraType === 'kedarnath';
          const isOtherLiveJaap = !isHanuman && !isKedarnath && (jaap.mantraType === 'gayatri' || jaap.mantraType === 'krishna' || jaap.mantraType === 'shiva' || jaap.mantraType === 'ganesh' || jaap.mantraType === 'laxmi' || jaap.mantraType === 'mrityunjaya');

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
            const otherStatus = getCurrentOtherJaapStatus(now, jaap.mantraType);
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

          return (
            <TouchableOpacity
              key={jaap.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => goToJaap(jaap)}
            >
              <Image source={jaap.image} style={styles.cardImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.92)']}
                style={styles.cardOverlay}
              >
                {/* Top badges */}
                <View style={styles.cardTop}>
                  <View style={[styles.liveBadge, (!showLive) && styles.mockupScheduledBadge, { maxWidth: showLive ? '65%' : '100%', paddingHorizontal: 10 }]}>
                    <Ionicons name={showLive ? "radio" : "time-outline"} size={10} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={[styles.liveBadgeText, { flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{liveLabel}</Text>
                  </View>
                  {showLive && (
                    <View style={styles.countBadge}>
                      <Ionicons name="people" size={10} color="#FFF" style={{ marginRight: 3 }} />
                      <Text style={styles.countBadgeText}>
                        {(activeCounts[getMantraRoomName(jaap.id)] || 0).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bottom content */}
                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle}>
                    {t('language') === 'hi' ? (() => {
                      if (jaap.id === '1') return 'हनुमान\nचालीसा';
                      if (jaap.id === '2') return 'हरे कृष्ण\nजाप';
                      if (jaap.id === '3') return 'ओम् नमः\nशिवाय';
                      if (jaap.id === '4') return 'गायत्री\nमंत्र';
                      if (jaap.id === '5') return 'गणेश\nमंत्र';
                      if (jaap.id === '6') return 'लक्ष्मी\nमंत्र';
                      if (jaap.id === '7') return 'कृष्ण\nजाप';
                      return jaap.title;
                    })() : jaap.title}
                  </Text>
                  <Text style={styles.cardSlok} numberOfLines={2}>{jaap.slok}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[styles.exactJoinBtn, { flex: 1 }]}
                      onPress={() => goToJaap(jaap)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Text style={styles.exactJoinText}>{t('join')}</Text>
                        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                          <Path d="M8.00596 0C1.85215 0 -1.99398 6.66666 1.08293 12C4.15983 17.3333 11.8521 17.3333 14.929 12C15.6306 10.7838 16 9.40429 16 8C15.9953 3.58365 12.419 0.00466837 8.00596 0ZM11.1229 8.50615L7.12585 11.2754C6.7365 11.5448 6.2017 11.2914 6.16322 10.8193C6.16187 10.8026 6.16118 10.7859 6.16118 10.7692V5.23077C6.16119 4.75705 6.67363 4.46098 7.08358 4.69784C7.09802 4.70619 7.11213 4.71512 7.12585 4.72462L11.1229 7.49384C11.4764 7.73853 11.4764 8.26147 11.1229 8.50615Z" fill="#FF7B00"/>
                        </Svg>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Bottom spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5E0C3',
    // shadow for iOS
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    // elevation for Android
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#2D1400',
    fontFamily: 'Outfit_800ExtraBold',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFD6B0',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#8B4513',
    fontFamily: 'Inter_600SemiBold',
  },
  bannerBold: {
    color: '#FF6600',
    fontFamily: 'Inter_800ExtraBold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: 270,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1A0A00',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    // Android shadow
    elevation: 14,
    marginBottom: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    backgroundColor: '#E31E24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
  },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  cardBottom: {
    width: '100%',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Outfit_800ExtraBold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  cardSlok: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 10,
  },
  exactJoinBtn: {
    backgroundColor: '#FFF',
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    justifyContent: 'center',
  },
  exactJoinText: {
    color: '#FF6600',
    fontSize: 13,
    fontWeight: '800',
  },
  joinBtn: {
    backgroundColor: '#FFF',
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  joinWaveBox: {
    marginRight: 10,
  },
  mockupScheduledBadge: {
    backgroundColor: '#FF8800',
  },
});
