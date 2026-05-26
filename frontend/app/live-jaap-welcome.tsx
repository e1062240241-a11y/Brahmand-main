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
             <Text style={styles.welcomeText}>Welcome to</Text>
             <Text style={styles.liveJaapText}>{title || 'Hanuman Chalisa'}</Text>
             <View style={styles.ornateDivider}>
               <Text style={styles.lotusIcon}>🪷</Text>
             </View>
          </View>

          {/* MANTRA PREVIEW */}
          <View style={styles.mantraPreviewBox}>
            <Text style={styles.mantraPreviewText}>
              श्रीगुरु चरन सरोज रज, निज मनु मुकुर सुधारि{'\n'}
              बरनऊँ रघुबर बिमल जसु, जो दायकु फल चारि
            </Text>
          </View>

          {/* SUBTITLE */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleMain}>A sacred space for collective chanting.</Text>
          </View>

          {/* GUIDELINES LIST */}
          <View style={styles.guidelinesContainer}>
            {GUIDELINES.map((item, index) => (
              <View key={item.id} style={[styles.card, index === GUIDELINES.length - 1 ? styles.cardNoBorder : null]}>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* JOIN BUTTON */}
          <View style={styles.footerContainer}>
            <SwipeButton 
              title="Join Live Jaap Now" 
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
              <Text style={styles.privacyText}>Private & Secure Sacred Space</Text>
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
    marginTop: 30, 
    flex: 1 
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
});
