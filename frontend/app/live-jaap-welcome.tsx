// accessibility: placeholder
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../src/features/live-mantra/schedule';
import SwipeButton from '../src/components/SwipeButton';
import { useTranslation } from '../src/utils/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getGuidelines = (lang: string) => [
  { id: '1', icon: 'volume-mute', title: lang === 'hi' ? 'शांत रहें' : 'Be Silent When Needed', desc: lang === 'hi' ? 'अनावश्यक शोर करने से बचें।' : 'Avoid unnecessary background noise.' },
  { id: '2', icon: 'heart', title: lang === 'hi' ? 'पवित्र स्थान का सम्मान करें' : 'Respect the Sacred Space', desc: lang === 'hi' ? 'यह एक भक्तिपूर्ण स्थान है।' : 'This is a devotional space.' },
  { id: '3', icon: 'person', title: lang === 'hi' ? 'भक्ति भाव से जपें' : 'Chant with Devotion', desc: lang === 'hi' ? 'मंत्र पर ध्यान केंद्रित करें, सच्चे मन से जपें।' : 'Focus on the mantra, chant sincerely.' },
  { id: '4', icon: 'people', title: lang === 'hi' ? 'ध्यान न भटकाएं' : 'No Distractions', desc: lang === 'hi' ? 'दूसरों से बात करने या ऐप्स बदलने से बचें।' : 'Avoid chatting or switching apps.' },
  { id: '5', icon: 'shield-checkmark', title: lang === 'hi' ? 'सकारात्मक रहें' : 'Stay Positive', desc: lang === 'hi' ? 'केवल सकारात्मक विचार और कंपन रखें।' : 'Only positive thoughts and vibrations.' },
];

const getTranslatedTitle = (title: string): string => {
  const map: Record<string, string> = {
    'Hanuman Chalisa': 'हनुमान चालीसा',
    'Hare Krishna Jaap': 'हरे कृष्ण जाप',
    'Hare Krishna\nJaap': 'हरे कृष्ण जाप',
    'Om Namah Shivaya': 'ॐ नमः शिवाय',
    'Om Namah\nShivaya': 'ॐ नमः शिवाय',
    'Gayatri Mantra': 'गायत्री मंत्र',
    'Gayatri\nMantra': 'गायत्री मंत्र',
    'Ganesh Mantra': 'गणेश मंत्र',
    'Ganesh\nMantra': 'गणेश मंत्र',
    'Laxmi Mantra': 'लक्ष्मी मंत्र',
    'Laxmi\nMantra': 'लक्ष्मी मंत्र',
    'Krishna Jaap': 'कृष्ण जाप',
    'Krishna\nJaap': 'कृष्ण जाप',
    'Maha Mrityunjaya': 'महामृत्युंजय मंत्र',
    'Kedarnath': 'केदारनाथ',
  };
  return map[title] || title;
};

const MANTRA_PREVIEW: Record<string, string> = {
  gayatri: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् । ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्...',
  hanuman: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि बरनऊँ रघुबर बिमल जसु जो दायकु फल चारि बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार...',
  krishna: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे । हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे...',
  shiva: 'ॐ नमः शिवाय । ॐ नमः शिवाय । नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय । नित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय...',
  mrityunjaya: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् । ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्...',
  kedarnath: 'जय केदार उदार शंकर, मन हरत छवि आपकी । ध्यान धरत सुर-नर-मुनि सब, जय हो केदारनाथ की ॥ जय शिव ओंकारा, जय हर शिव ओंकारा, ब्रह्मा विष्णु सदाशिव अर्द्धांगी धारा ॥ ॐ जय केदारनाथ देवा...',
  ganesh: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
  laxmi: 'ॐ श्रीं ह्रीं क्लीं महालक्ष्म्यै नमः । ॐ श्रीं ह्रीं क्लीं महालक्ष्म्यै नमः ।',
};

const MANTRA_PREVIEW_EN: Record<string, string> = {
  gayatri: 'Om Bhuur-Bhuvah Svah Tat-Savitur-Varenyam Bhargo Devasya Dhiimahi Dhiyo Yo Nah Pracodayaat |',
  hanuman: 'Shree Guru Charan Saroj Raj, Nij Manu Mukur Sudhaari. Barnau Raghuvar Bimal Jasu, Jo Dayaku Phal Chaari...',
  krishna: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare, Hare Rama Hare Rama Rama Rama Hare Hare.',
  shiva: 'Om Namah Shivaya | Om Namah Shivaya | Nagendra Haaraaya Trilocanaaya Bhasmaangaraagaaya Maheshvaraaya...',
  mrityunjaya: 'Om Tryambakam Yajaamahe Sugandhim Pushtivardhanam | Urvaarukamiva Bandhanaan Mrityormukshiiya Maamrutaat |',
  kedarnath: 'Jai Kedarnath Udar Shankar, Man Harat Chhavi Aapki. Dhyan Dharat Sur-Nar-Muni Sab, Jai Ho Kedarnath Ki...',
  ganesh: 'Vakratunda Mahakaya Surya Koti Samaprabha | Nirvighnam Kuru Me Deva Sarva Karyeshu Sarvada ||',
  laxmi: 'Om Shreem Hreem Kleem Maha Lakshmyai Namah | Om Shreem Hreem Kleem Maha Lakshmyai Namah |',
};

export default function LiveJaapWelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mantraType, title, fromHome } = useLocalSearchParams<{ mantraType?: string, title?: string, fromHome?: string }>();
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hanumanStatus = getCurrentHanumanStatus(now);
  const otherStatus = getCurrentOtherJaapStatus(now, mantraType);

  const isHanuman = mantraType === 'hanuman';
  const isKedarnath = mantraType === 'kedarnath';
  const isOtherLiveJaap = !isHanuman && !isKedarnath && (mantraType === 'gayatri' || mantraType === 'krishna' || mantraType === 'shiva' || mantraType === 'ganesh' || mantraType === 'laxmi' || mantraType === 'mrityunjaya');

  const isSessionActive = isHanuman ? hanumanStatus.isActive : (isOtherLiveJaap ? otherStatus.isActive : true);
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <StatusBar barStyle="dark-content" />
      <View style={styles.background}>
        <LinearGradient 
          colors={['#FF8D57', '#EA9B76', '#F8EDE7', '#F8EDE7']} 
          locations={[0, 0.05, 0.25, 1]}
          style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} 
        />

        <View style={[styles.mainContent, { paddingTop: insets.top + 5, paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity 
            onPress={() => {
              if (mantraType === 'kedarnath' || fromHome === 'true') {
                router.replace('/(tabs)/home');
              } else {
                router.replace('/(tabs)/jaap');
              }
            }} 
            style={[styles.backBtn, { top: insets.top + 10 }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={24} color="#4A2E1F" />
          </TouchableOpacity>

          {/* HEADER OM */}
          <View style={styles.headerContainer}>
             <Text style={styles.welcomeText}>{t('language') === 'hi' ? 'स्वागत है' : 'Welcome to'}</Text>
             <Text style={styles.liveJaapText}>{t('language') === 'hi' ? getTranslatedTitle(title || 'Hanuman Chalisa') : (title || 'Hanuman Chalisa')}</Text>
             <View style={styles.ornateDivider}>
               <Text style={styles.lotusIcon}>🪷</Text>
             </View>
          </View>
          {isHanuman && (
            <View style={styles.statusBanner}>
              {hanumanStatus.isActive ? (
                <View style={styles.activeBannerInner}>
                  <View style={styles.liveDotRing} />
                  <Text style={styles.statusTextActive}>
                    {hanumanStatus.isCompleted
                      ? (t('language') === 'hi' ? 'सत्र समाप्त (अगले सत्र की प्रतीक्षा)' : 'Session Completed (Waiting for next)')
                      : t('language') === 'hi'
                        ? `${hanumanStatus.sessionName === 'Morning' ? 'सुबह का' : hanumanStatus.sessionName === 'Afternoon' ? 'दोपहर का' : hanumanStatus.sessionName === 'Evening' ? 'शाम का' : 'रात का'} सत्र • राउंड ${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} (कुल राउंड ${hanumanStatus.roundOfDay}/51)`
                        : `${hanumanStatus.sessionName} Session • Round ${hanumanStatus.roundOfSession} of ${hanumanStatus.totalRepsInSession} (Total Round ${hanumanStatus.roundOfDay}/51)`}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveBannerInner}>
                  <Ionicons name="time-outline" size={16} color="#7B6A58" style={{ marginRight: 6 }} />
                  <Text style={styles.statusTextInactive}>
                    {t('language') === 'hi' ? 'अगला लाइव सत्र' : 'Next Live'}: {(() => {
                      const sName = hanumanStatus.nextSessionName;
                      if (t('language') === 'hi') {
                        if (sName === 'Morning') return 'सुबह';
                        if (sName === 'Afternoon') return 'दोपहर';
                        if (sName === 'Evening') return 'शाम';
                        if (sName === 'Night') return 'रात';
                      }
                      return sName;
                    })()} {t('language') === 'hi' ? 'शुरू होने में' : 'Session Starts in'} {(() => {
                      if (!hanumanStatus.nextSessionStart) return '';
                      const diffMs = hanumanStatus.nextSessionStart.getTime() - now.getTime();
                      const hrs = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      const secs = Math.floor((diffMs % 60000) / 1000);
                      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    })()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {isOtherLiveJaap && (
            <View style={styles.statusBanner}>
              {otherStatus.isActive ? (
                <View style={styles.activeBannerInner}>
                  <View style={styles.liveDotRing} />
                  <Text style={styles.statusTextActive}>
                    {t('language') === 'hi'
                      ? `${otherStatus.sessionName === 'Morning' ? 'सुबह का' : otherStatus.sessionName === 'Afternoon' ? 'दोपहर का' : otherStatus.sessionName === 'Evening' ? 'शाम का' : 'रात का'} सत्र • लाइव`
                      : `${otherStatus.sessionName} Session • Live`}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveBannerInner}>
                  <Ionicons name="time-outline" size={16} color="#7B6A58" style={{ marginRight: 6 }} />
                  <Text style={styles.statusTextInactive}>
                    {t('language') === 'hi' ? 'अगला लाइव सत्र' : 'Next Live'}: {(() => {
                      const sName = otherStatus.nextSessionName;
                      if (t('language') === 'hi') {
                        if (sName === 'Morning') return 'सुबह का';
                        if (sName === 'Afternoon') return 'दोपहर का';
                        if (sName === 'Evening') return 'शाम का';
                        if (sName === 'Night') return 'रात का';
                      }
                      return sName ? `${sName} Session` : '';
                    })()} {t('language') === 'hi' ? 'शुरू होने में' : 'Starts in'} {(() => {
                      if (!otherStatus.nextSessionStart) return '';
                      const diffMs = otherStatus.nextSessionStart.getTime() - now.getTime();
                      const hrs = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      const secs = Math.floor((diffMs % 60000) / 1000);
                      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    })()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* MANTRA PREVIEW - SCROLLABLE FOR LONG TEXTS LIKE HANUMAN CHALISA */}
          <View style={styles.mantraPreviewBox}>
            <Text style={styles.mantraPreviewText}>
              {t('language') === 'hi'
                ? MANTRA_PREVIEW[mantraType || 'hanuman'] || MANTRA_PREVIEW['hanuman']
                : MANTRA_PREVIEW_EN[mantraType || 'hanuman'] || MANTRA_PREVIEW_EN['hanuman']}
            </Text>
          </View>

          {/* SUBTITLE */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleMain}>
              {t('language') === 'hi'
                ? 'सामूहिक जाप के लिए एक पवित्र स्थान।'
                : 'A sacred space for collective chanting.'}
            </Text>
          </View>

          {/* GUIDELINES LIST */}
          <ScrollView 
            style={{ flex: 1, marginTop: 15 }} 
            contentContainerStyle={{ paddingBottom: 20, alignItems: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.guidelinesContainer}>
              {getGuidelines(t('language')).map((item, index, arr) => (
                <View key={item.id} style={[styles.card, index === arr.length - 1 ? styles.cardNoBorder : null]}>
                  <View style={styles.cardTextContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* JOIN BUTTON */}
          <View style={styles.footerContainer}>
            <SwipeButton 
              title={t('language') === 'hi' ? 'अभी लाइव जाप में शामिल हों' : 'Join Live Jaap Now'} 
              onSwipeComplete={() => {
                router.push({
                  pathname: '/live-jaap-room',
                  params: { 
                    initialMic: 'false',
                    mantraType: mantraType || 'hanuman',
                    title: title || 'Hanuman Chalisa',
                    hasAudio: 'true',
                    hasText: 'true',
                    fromHome: fromHome || 'false'
                  }
                });
              }}
            />

            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={14} color="#7B6A58" />
              <Text style={styles.privacyText}>
                {t('language') === 'hi' ? 'निजी और सुरक्षित आध्यात्मिक स्थान' : 'Private & Secure Sacred Space'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  background: { flex: 1 },
  mainContent: { flex: 1, paddingHorizontal: 25, justifyContent: 'space-between' },
  headerContainer: { alignItems: 'center', marginTop: 10 },
  backBtn: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBanner: {
    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    width: '90%',
  },
  activeBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(74, 186, 126, 0.08)',
  },
  inactiveBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 106, 88, 0.05)',
  },
  liveDotRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ABA7E',
    marginRight: 8,
  },
  statusTextActive: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  statusTextInactive: {
    fontSize: 12,
    color: '#7B6A58',
    fontWeight: '600',
  },
  welcomeText: { 
    color: '#374151',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 28,
    marginBottom: 4 
  },
  liveJaapText: { 
    color: '#3D2B1F',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.9,
  },
  ornateDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  lotusIcon: { fontSize: 16 },
  mantraPreviewBox: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
  },
  mantraPreviewText: {
    fontSize: 14,
    color: '#4A2E1F',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  subtitleContainer: { alignItems: 'center', marginVertical: 15 },
  subtitleMain: { 
    fontSize: 16, 
    color: '#4B5563', 
    textAlign: 'center', 
    fontWeight: '500', // 510 mapped to 500
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', // SF Pro fallback
    fontStyle: 'normal',
    lineHeight: 24,
  },
  guidelinesContainer: { 
    width: 286,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    alignSelf: 'center',
    marginTop: 10,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  cardNoBorder: {
    borderBottomWidth: 0,
  },
  cardTextContent: { 
    display: 'flex',
    width: 286,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  cardTitle: { 
    color: '#000',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 0,
  },
  cardDesc: { fontSize: 14, color: '#374151' },
  footerContainer: { width: '100%', alignItems: 'center', marginTop: 20 },
  privacyNote: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  privacyText: { fontSize: 13, color: '#64748B', marginLeft: 6 },
  tapJoinButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#E8630A',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    shadowColor: '#E8630A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tapJoinButtonText: {
    flex: 1,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 48,
  },
  tapJoinButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tapJoinButtonIcon: {
    color: '#E8630A',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
