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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../src/features/live-mantra/schedule';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GUIDELINES = [
  { id: '1', icon: 'volume-mute', title: 'Be Silent When Needed', desc: 'Avoid unnecessary background noise.' },
  { id: '2', icon: 'heart', title: 'Respect the Sacred Space', desc: 'This is a devotional space.' },
  { id: '3', icon: 'person', title: 'Chant with Devotion', desc: 'Focus on the mantra, chant sincerely.' },
  { id: '4', icon: 'people', title: 'No Distractions', desc: 'Avoid chatting or switching apps.' },
  { id: '5', icon: 'shield-checkmark', title: 'Stay Positive', desc: 'Only positive thoughts and vibrations.' },
];

const MANTRA_PREVIEW: Record<string, string> = {
  gayatri: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् । ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्...',
  hanuman: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि बरनऊँ रघुबर बिमल जसु जो दायकु फल चारि बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार...',
  krishna: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे । हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे...',
  shiva: 'ॐ नमः शिवाय । ॐ नमः शिवाय । नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय । नित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय...',
  mrityunjaya: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् । ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्...',
  kedarnath: 'जय केदार उदार शंकर, मन हरत छवि आपकी । ध्यान धरत सुर-नर-मुनि सब, जय हो केदारनाथ की ॥ जय शिव ओंकारा, जय हर शिव ओंकारा, ब्रह्मा विष्णु सदाशिव अर्द्धांगी धारा ॥ ॐ जय केदारनाथ देवा...',
};

export default function LiveJaapWelcomeScreen() {
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
      <StatusBar barStyle="dark-content" />
      <ImageBackground 
        source={require('../assets/images/sacred_jaap_welcome_bg_1778756095448.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']} 
          style={StyleSheet.absoluteFill} 
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
             <View style={styles.mandalaContainer}>
                <Text style={styles.omText}>ॐ</Text>
             </View>
             <Text style={styles.welcomeText}>Welcome to</Text>
             <Text style={styles.liveJaapText}>{title || 'Live Jaap'}</Text>
             <View style={styles.ornateDivider}>
               <View style={styles.line} /><Text style={styles.lotusIcon}>🪷</Text><View style={styles.line} />
             </View>
          </View>

          {isHanuman && (
            <View style={styles.statusBanner}>
              {hanumanStatus.isActive ? (
                <View style={styles.activeBannerInner}>
                  <View style={styles.liveDotRing} />
                  <Text style={styles.statusTextActive}>
                    {hanumanStatus.isCompleted
                      ? `Session Completed (Waiting for next)`
                      : `${hanumanStatus.sessionName} Session • Round ${hanumanStatus.roundOfSession} of ${hanumanStatus.totalRepsInSession} (Total Round ${hanumanStatus.roundOfDay}/51)`}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveBannerInner}>
                  <Ionicons name="time-outline" size={16} color="#7B6A58" style={{ marginRight: 6 }} />
                  <Text style={styles.statusTextInactive}>
                    Next Live: {hanumanStatus.nextSessionName} Session Starts in {(() => {
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
                    {mantraType === 'gayatri' || mantraType === 'shiva' ? 'Live • Open 24 Hours' : `${otherStatus.sessionName} Session • Live (8 AM - 11 AM & 4 PM - 9 PM)`}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveBannerInner}>
                  <Ionicons name="time-outline" size={16} color="#7B6A58" style={{ marginRight: 6 }} />
                  <Text style={styles.statusTextInactive}>
                    Next Live: {otherStatus.nextSessionName} Session Starts in {(() => {
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
            <ScrollView style={{ maxHeight: 100 }} showsVerticalScrollIndicator={true}>
              <Text style={styles.mantraPreviewText}>
                {MANTRA_PREVIEW[mantraType || 'gayatri'] || MANTRA_PREVIEW.gayatri}
              </Text>
            </ScrollView>
          </View>

          {/* SUBTITLE */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleMain}>A sacred space for collective chanting.</Text>
          </View>

          {/* GUIDELINES LIST */}
          <View style={styles.guidelinesContainer}>
            {GUIDELINES.map((item) => (
              <View key={item.id} style={styles.card}>
                <LinearGradient colors={['#FF8A00', '#FF6600']} style={styles.cardIconCircle}>
                  <Ionicons name={item.icon as any} size={14} color="#FFF" />
                </LinearGradient>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* JOIN BUTTON */}
          <View style={styles.footerContainer}>
            <TouchableOpacity 
              style={styles.joinButton} 
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/live-jaap-room',
                params: { 
                  initialMic: 'false',
                  mantraType: mantraType || 'gayatri',
                  title: title || 'Gayatri Mantra',
                  // Ensure audio and written formats are correctly linked
                  hasAudio: 'true',
                  hasText: 'true',
                  fromHome: fromHome || 'false'
                }
              })}
            >
              <LinearGradient
                colors={
                  !isSessionActive
                    ? ['#7B6A58', '#9F8D7C']
                    : ['#FF6B00', '#FF8A00']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {mantraType === 'kedarnath' 
                    ? 'Watch Live Aarti Now' 
                    : !isSessionActive
                      ? 'Enter Live Room (Chant Solo / Wait)'
                      : 'Join Live Jaap Now'}
                </Text>
                <View style={styles.buttonOmCircle}>
                  <Text style={styles.buttonOmText}>ॐ</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed" size={10} color="#7B6A58" />
              <Text style={styles.privacyText}>Private & Secure Sacred Space</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
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
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  mandalaContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 138, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  omText: { fontSize: 32, color: '#FF6600', fontWeight: 'bold' },
  welcomeText: { fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#4A2E1F' },
  liveJaapText: { fontSize: 38, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#4A2E1F', lineHeight: 44 },
  ornateDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  line: { width: 30, height: 1, backgroundColor: '#FF9F2F', opacity: 0.4 },
  lotusIcon: { marginHorizontal: 8, fontSize: 10, color: '#FF9F2F' },
  mantraPreviewBox: {
    marginTop: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 102, 0, 0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.1)',
    width: '100%',
  },
  mantraPreviewText: {
    fontSize: 14,
    color: '#4A2E1F',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitleContainer: { alignItems: 'center', marginTop: 5 },
  subtitleMain: { fontSize: 11, color: '#7B6A58', textAlign: 'center', fontWeight: '600' },
  guidelinesContainer: { width: '100%', gap: 6 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTextContent: { flex: 1 },
  cardTitle: { fontSize: 11, fontWeight: 'bold', color: '#4A2E1F' },
  cardDesc: { fontSize: 9, color: '#7B6A58' },
  micSection: { width: '100%', alignItems: 'center' },
  micPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B6A58',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  micPillActive: {
    backgroundColor: '#FF6600',
  },
  micPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerContainer: { width: '100%', alignItems: 'center' },
  joinButton: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonText: { color: '#FFF', fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', flex: 1, textAlign: 'center' },
  buttonOmCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  buttonOmText: { fontSize: 18, color: '#FF6B00', fontWeight: 'bold' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  privacyText: { fontSize: 10, color: '#7B6A58', marginLeft: 5 },
  statusBanner: {
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 102, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDotRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  statusTextActive: {
    color: '#4A2E1F',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  inactiveBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextInactive: {
    color: '#7B6A58',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
