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
import { getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../src/features/live-mantra/schedule';
import { useTranslation } from '../src/utils/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const LIVE_JAAPS = [
  {
    id: '1',
    title: 'Hanuman\nChalisa',
    devotees: '9.6K',
    mantraType: 'hanuman',
    image: require('../assets/images/hanuman_jaap_card_v2.png'),
    slok: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि...',
    color: '#FF6B00',
  },
  {
    id: '2',
    title: 'Hare Krishna\nJaap',
    devotees: '6.4K',
    mantraType: 'krishna',
    image: require('../assets/images/krishna_jaap_card_v2.png'),
    slok: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे...',
    color: '#1A6BB5',
  },
  {
    id: '3',
    title: 'Om Namah\nShivaya',
    devotees: '5.2K',
    mantraType: 'shiva',
    image: require('../assets/images/shiva_jaap_card_v2.png'),
    slok: 'ॐ नमः शिवाय ॐ नमः शिवाय...',
    color: '#7B3F9E',
  },
  {
    id: '4',
    title: 'Gayatri\nMantra',
    devotees: '4.8K',
    mantraType: 'gayatri',
    image: require('../assets/images/gayatri_jaap_card_v4_exact_clean.png'),
    slok: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...',
    color: '#D4AF37',
  },
  {
    id: '5',
    title: 'Ganesh\nMantra',
    devotees: '8.2K',
    mantraType: 'ganesh',
    image: require('../assets/images/ganesh_jaap_card.png'),
    slok: 'ॐ गं गणपतये नमः ॐ गं गणपतये नमः...',
    color: '#E07820',
  },
  {
    id: '6',
    title: 'Laxmi\nMantra',
    devotees: '6.1K',
    mantraType: 'laxmi',
    image: require('../assets/images/laxmi_jaap_card.png'),
    slok: 'ॐ श्रीं महालक्ष्म्यै नमः ॐ श्रीं...',
    color: '#C2185B',
  },
  {
    id: '7',
    title: 'Krishna\nJaap',
    devotees: '7.2K',
    mantraType: 'krishna',
    image: require('../assets/images/krishna_jaap_card_v3.png'),
    slok: 'राधे राधे राधे राधे श्याम मिलाए दे...',
    color: '#283593',
  },
];

export default function AllLiveJaapsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const hanumanStatus = getCurrentHanumanStatus(now);

  const goToJaap = (jaap: (typeof LIVE_JAAPS)[0]) => {
    router.push({
      pathname: '/live-jaap-welcome',
      params: { mantraType: jaap.mantraType, title: jaap.title.replace('\n', ' ') },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header with gradient */}
      <LinearGradient
        colors={['#FFFBF5', '#FFF3E8']}
        style={styles.header}
      >
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
      </LinearGradient>

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
                liveLabel = t('language') === 'hi' ? `लाइव • ${hanumanStatus.roundOfDay}/51` : `LIVE • ${hanumanStatus.roundOfDay}/51`;
              }
            } else {
              if (hanumanStatus.nextSessionStart) {
                const timeStr = hanumanStatus.nextSessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                const timeStr = otherStatus.nextSessionStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                  <View style={[styles.liveBadge, (!showLive) && styles.mockupScheduledBadge]}>
                    <Ionicons name="radio" size={10} color="#FFF" style={{ marginRight: 3 }} />
                    <Text style={styles.liveBadgeText}>{liveLabel}</Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Ionicons name="people" size={10} color="#FFF" style={{ marginRight: 3 }} />
                    <Text style={styles.countBadgeText}>{jaap.devotees}</Text>
                  </View>
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
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.joinBtnOuter}
                    onPress={() => goToJaap(jaap)}
                  >
                    <LinearGradient
                      colors={['#FF6B00', '#FF9000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.joinBtnGradient}
                    >
                      <Text style={styles.joinBtnText}>{t('language') === 'hi' ? 'जुड़ें ओम्' : 'Join ओम्'}</Text>
                      <MaterialCommunityIcons name="waveform" size={16} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* Bottom spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
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
    gap: 16,
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
  joinBtnOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    // iOS shadow
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    // Android
    elevation: 5,
  },
  joinBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 20,
    gap: 8,
    paddingHorizontal: 18,
  },
  joinBtn: {
    backgroundColor: '#FFF',
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  joinBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  joinWaveBox: {
    marginRight: 10,
  },
  mockupScheduledBadge: {
    backgroundColor: '#FF8800',
  },
});
