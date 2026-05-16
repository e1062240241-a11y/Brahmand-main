import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Platform,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MANTRA_DATA: Record<string, { text: string; bg: any }> = {
  gayatri: {
    text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
  hanuman: {
    text: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि बरनऊँ रघुबर बिमल जसु जो दायकु फल चारि बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार जय हनुमान ज्ञान गुन सागर जय कपीस तिहुँ लोक उजागर राम दूत अतुलित बल धामा अंजनि पुत्र पवनसुत नामा महाबीर बिक्रम बजरंगी कुमति निवार सुमति के संगी कंचन बरन बिराज सुबेसा कानन कुंडल कुंचित केसा हाथ बज्र औ ध्वजा बिराजै काँधे मूँज जनेऊ साजै संकर सुवन केसरीनंदन तेज प्रताप महा जग बंदन बिद्यावान गुनी अति चातुर राम काज करिबे को आतुर प्रभु चरित्र सुनिबे को रसिया राम लखन सीता मन बसिया सूक्ष्म रूप धरि सियहिं दिखावा बिकट रूप धरि लंक जरावा भीम रूप धरि असुर सँहारे रामचन्द्र के काज सँवारे लाय सँजीवन लखन जियाये श्रीरघुबीर हरषि उर लाये रघुपति कीन्ही बहुत बड़ाई तुम मम प्रिय भरतहि सम भाई सहस बदन तुम्हरो जस गावैं अस कहि श्रीपति के कंठ लगावैं सनकादिक ब्रह्मादि मुनीसा नारद सारद सहित अहीसा जम कुबेर दिगपाल जहाँ ते कबि कोबिद कहि सके कहाँ ते तुम उपकार सुग्रीवहिं कीन्हा राम मिलाय राज पद दीन्हा तुम्हरो मंत्र बिभीषन माना लंकेस्वर भए सब जग जाना जुग सहस्र जोजन पर भानू लील्यो ताहि मधुर फल जानू प्रभु मुद्रिका मेलि मुख माहीं जलधि लाँघि गये अचरज नाहीं दुर्गम काज जगत के जेते सुगम अनुग्रह तुम्हरे तेते राम दुआरे तुम रखवारे होत न आग्या बिनु पैसारे सब सुख लहै तुम्हारी सरना तुम रक्षक काहू को डर ना आपन तेज सम्हारो आपै तीनों लोक हाँक तें काँपै भूत पिसाच निकट नहिं आवै महाबीर जब नाम सुनावै नासै रोग हरै सब पीरा जपत निरंतर हनुमत बीरा संकट तें हनुमान छुड़ावै मन क्रम बचन ध्यान जो लावै सब पर राम तपस्वी राजा तिन के काज सकल तुम साजा और मनोरथ जो कोई लावै सोइ अमित जीवन फल पावै चारों जुग परताप तुम्हारा है परसिद्ध जगत उजियारा साधु संत के तुम रखवारे असुर निकंदन राम दुलारे अष्ट सिद्धि नौ निधि के दाता अस बर दीन जानकी माता राम रसायन तुम्hre पासा सदा रहो रघुपति के दासा तुम्हरे भजन राम को पावै जनम जनम के दुख bिसरावै अंत काल रघुबर पुर जाई जहाँ जन्म हरि भक्त कहाई और देवता चित्त न धरई हनुमत सेइ सर्ब सुख करई संकट कटै मिटै सब पीरा जो सुमिरै हनुमत बलबीरा जै जै जै हनुमान गोसाईं कृपा करहु गुरुदेव की नाईं जो सत बार पाठ कर कोई छूटहि बंदि महा सुख होई जो यह पढ़ै हनुमान चालीसा होय सिद्धि साखी गौरीसा तुलसीदास सदा हरि चेरा कीजै नाथ हृदय मँह डेरा पवनतनय संकट हरन मंगल मूरति रूप राम लखन सीता सहित हृदय बसहु सुर भूप',
    bg: require('../../../assets/images/hanuman_jaap_card_v2.png'),
  },
  krishna: {
    text: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे',
    bg: require('../../../assets/images/krishna_jaap_card_v2.png'),
  },
  shiva: {
    text: 'ॐ नमः शिवाय । ॐ नमः शिवाय । नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय । नित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय ॥ १ ॥ मन्दाकिनीसलिलचन्दनचर्चिताय नन्दीश्वरप्रमथनाथमहेश्वराय । मन्दारपुष्पबहुपुष्पसुपूजिताय तस्मै मकाराय नमः शिवाय ॥ २ ॥ शिवाय गौरीवदनाब्जवृन्दसूर्याय दक्षाध्वरनाशकाय । श्रीनीलकण्ठाय वृषध्वजाय तस्मै शिकाराय नमः शिवाय ॥ ३ ॥ वसिष्ठकुम्भोद्भवगौतमार्यमुनीन्द्रदेवार्चितशेखराय । चन्द्रार्कवैश्वानरलोचनाय तस्मै वकाराय नमः शिवाय ॥ ४ ॥ यक्षस्वरूपाय जटाधराय पिनाकहस्ताय सनातनाय । दिव्याय देवाय दिगम्बराय तस्मै यकाराय नमः शिवाय ॥ ५ ॥',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
  mrityunjaya: {
    text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
};

const MANTRA_BG_AUDIO_URLS: Record<string, string> = {
  gayatri: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
  hanuman: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
  krishna: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
  shiva: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
  mrityunjaya: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
};

export default function LiveJaapRoomView() {
  const router = useRouter();
  const { mantraType, title: roomTitle } = useLocalSearchParams<{ 
    mantraType?: string,
    title?: string 
  }>();
  
  const selectedMantra = MANTRA_DATA[mantraType || 'gayatri'] || MANTRA_DATA.gayatri;
  const WORDS = selectedMantra.text.split(' ');
  
  const getLines = () => {
    const lines = [];
    for (let i = 0; i < WORDS.length; i += 4) {
      lines.push(WORDS.slice(i, i + 4).join(' '));
    }
    return lines;
  };
  const MANTRA_LINES = getLines();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'chant' | 'path'>('chant');
  const [reactions, setReactions] = useState<{ id: number; emoji: string; anim: Animated.Value }[]>([]);
  
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;
  
  // Scroller Animators
  const soloMoveAnim = useRef(new Animated.Value(100)).current;
  const soloFadeAnim = useRef(new Animated.Value(0)).current;
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const url = MANTRA_BG_AUDIO_URLS[mantraType || 'gayatri'] || MANTRA_BG_AUDIO_URLS.gayatri;
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = isMuted ? 0 : 0.4;
      audioRef.current = audio;
      const playAudio = async () => {
        try { await audio.play(); } catch (e) { console.warn('Auto-play blocked'); }
      };
      playAudio();
      return () => { audio.pause(); audioRef.current = null; };
    }
  }, [mantraType, isMuted]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(upcomingFade, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(upcomingFade, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(1600),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const isHanuman = mantraType === 'hanuman';
    const WORDS_PER_LINE = 4;
    const isNewLine = currentIndex % WORDS_PER_LINE === 0;

    if (isNewLine) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(soloMoveAnim, { toValue: 0, duration: isHanuman ? 250 : 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(soloFadeAnim, { toValue: 1, duration: isHanuman ? 200 : 300, useNativeDriver: true }),
        ]),
        Animated.delay(isHanuman ? 50 : 100),
      ]).start();
    }

    Animated.timing(activeIndexAnim, {
      toValue: currentIndex,
      duration: isHanuman ? 300 : 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      if ((currentIndex + 1) % WORDS_PER_LINE === 0) {
         Animated.parallel([
           Animated.timing(soloMoveAnim, { toValue: -100, duration: isHanuman ? 200 : 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
           Animated.timing(soloFadeAnim, { toValue: 0, duration: isHanuman ? 150 : 250, useNativeDriver: true }),
         ]).start(() => {
           soloMoveAnim.setValue(100);
         });
      }
    };
  }, [currentIndex, mantraType]);

  useEffect(() => {
    let timer: any;
    const isHanuman = mantraType === 'hanuman';
    if (isHolding) {
      timer = setTimeout(() => { setIsHolding(false); setCurrentIndex(0); }, 4000); 
      return () => clearTimeout(timer);
    }
    const currentWord = WORDS[currentIndex] || '';
    const wordDuration = isHanuman ? (currentWord.length > 7 ? 800 : 500) : (currentWord.length > 7 ? 3000 : 1200);
    timer = setTimeout(() => {
      if (currentIndex < WORDS.length - 1) setCurrentIndex(currentIndex + 1);
      else setIsHolding(true);
    }, wordDuration);
    return () => clearTimeout(timer);
  }, [currentIndex, isHolding, WORDS, mantraType]);

  const addReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const anim = new Animated.Value(0);
    setReactions(prev => [...prev, { id, emoji, anim }]);
    Animated.timing(anim, {
      toValue: 1, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(() => { setReactions(prev => prev.filter(r => r.id !== id)); });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={selectedMantra.bg} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient colors={['rgba(5,5,5,0.7)', 'rgba(5,5,5,0.9)', 'rgba(47,18,0,0.85)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/jaap'); }} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
               <Text style={styles.participantLabel} numberOfLines={1}>{roomTitle || 'Live Jaap'}</Text>
               <Text style={styles.micStatusText}>Collective Chanting Room</Text>
            </View>
            <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.headerBtn}>
              <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity onPress={() => setActiveTab('chant')} style={[styles.tabButton, activeTab === 'chant' && styles.tabButtonActive]}>
              <Ionicons name="apps" size={18} color={activeTab === 'chant' ? '#FFEBB5' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === 'chant' && styles.tabTextActive]}>Chanting</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('path')} style={[styles.tabButton, activeTab === 'path' && styles.tabButtonActive]}>
              <Ionicons name="document-text" size={18} color={activeTab === 'path' ? '#FFEBB5' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === 'path' && styles.tabTextActive]}>Shloka Path</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={[styles.scrollContainer, { justifyContent: 'center', flex: 1 }]} scrollEnabled={false}>
            {activeTab === 'chant' ? (
              <View style={styles.soloFocusContainer}>
                 <Animated.View key={`line-${Math.floor(currentIndex / 4)}`} style={[styles.soloWordBox, { opacity: soloFadeAnim, transform: [{ translateY: soloMoveAnim }] }]}>
                    <LinearGradient colors={['rgba(255,138,0,0.15)', 'rgba(255,138,0,0)']} style={styles.soloGlow} />
                    <View style={styles.soloLineWordsRow}>
                      {MANTRA_LINES[Math.floor(currentIndex / 4)]?.split(' ').map((word, idx) => {
                        const isHighlighted = (currentIndex % 4) === idx;
                        return (
                          <Text key={`${word}-${idx}`} style={[styles.soloWordText, isHighlighted ? styles.soloWordHighlighted : styles.soloWordDimmed]}>
                            {word}{' '}
                          </Text>
                        );
                      })}
                    </View>
                    <View style={styles.soloOrnateUnderline} />
                 </Animated.View>
              </View>
            ) : (
              <View style={styles.fullShlokaBox}>
                <View style={styles.scrollHeader}>
                  <Ionicons name="document-text" size={16} color="#FFEBB5" />
                  <Text style={styles.scrollHeaderText}>Sacred Full Path</Text>
                </View>
                <Text style={styles.fullShlokaText}>{selectedMantra.text}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.reactionOverlay} pointerEvents="none">
            {reactions.map(r => (
              <Animated.Text key={r.id} style={[styles.floatingEmoji, {
                opacity: r.anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
                  { translateX: r.anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 15, -15, 10, 0] }) },
                  { scale: r.anim.interpolate({ inputRange: [0, 0.2], outputRange: [0.6, 1.2], extrapolate: 'clamp' }) }
                ]
              }]}>{r.emoji}</Animated.Text>
            ))}
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.roomStatsBox}><Text style={styles.roomStats}>Sangat: Devotional Session</Text></View>
            <Animated.View style={[styles.upcomingBox, { opacity: upcomingFade }]}>
               <Text style={styles.upcomingLabel}>Upcoming Verse</Text>
               <Text style={styles.upcomingMantra} numberOfLines={1}>{MANTRA_LINES[Math.floor(currentIndex / 4) + 1] || MANTRA_LINES[0]}</Text>
            </Animated.View>
            <View style={styles.transparentControlBar}>
              <View style={styles.leftControls}>
                <TouchableOpacity onPress={() => setIsMicEnabled(!isMicEnabled)} style={[styles.iconCircle, isMicEnabled && { backgroundColor: 'rgba(76, 217, 100, 0.2)', borderColor: '#4CD964' }]}>
                  <Ionicons name={isMicEnabled ? "mic" : "mic-off"} size={22} color={isMicEnabled ? "#4CD964" : "#FFF"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/jaap'); }} style={[styles.iconCircle, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.rightReactions}>
                {['🙏', '❤️', '😊', '🔔'].map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => addReaction(emoji)} style={styles.reactionBtn}><Text style={styles.reactionBtnText}>{emoji}</Text></TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  participantLabel: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  micStatusText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  scrollContainer: { paddingVertical: 20, alignItems: 'center' },
  tabBar: { flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, marginTop: 20, borderRadius: 25, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 10 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 22, gap: 8 },
  tabButtonActive: { backgroundColor: 'rgba(255,107,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#FFEBB5' },
  soloFocusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: SCREEN_WIDTH },
  soloWordBox: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  soloLineWordsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: SCREEN_WIDTH - 40 },
  soloWordText: { fontSize: 44, fontWeight: '900', textAlign: 'center' },
  soloWordHighlighted: { color: '#FFF', textShadowColor: '#FF8A00', textShadowRadius: 15, transform: [{ scale: 1.05 }] },
  soloWordDimmed: { color: 'rgba(255,255,255,0.3)' },
  soloGlow: { position: 'absolute', width: 280, height: 120, borderRadius: 60, zIndex: -1 },
  soloOrnateUnderline: { width: 80, height: 2, backgroundColor: '#FF8A00', marginTop: 10, borderRadius: 1, opacity: 0.6 },
  fullShlokaBox: { marginTop: 40, backgroundColor: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 32, width: '92%', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  scrollHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,235,181,0.2)', paddingBottom: 10 },
  scrollHeaderText: { color: '#FFEBB5', fontSize: 14, fontWeight: '800' },
  fullShlokaText: { color: '#FFEBB5', fontSize: 20, textAlign: 'center', lineHeight: 36, fontWeight: '700' },
  footerContainer: { paddingBottom: 30, width: '100%', alignItems: 'center', gap: 15 },
  transparentControlBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', width: '92%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  leftControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rightReactions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  reactionBtnText: { fontSize: 22 },
  reactionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 100, paddingRight: 40, zIndex: 100 },
  floatingEmoji: { position: 'absolute', fontSize: 32, bottom: 0 },
  roomStatsBox: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roomStats: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  upcomingBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', maxWidth: '80%' },
  upcomingLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  upcomingMantra: { color: '#FFEBB5', fontSize: 13, fontWeight: '600' },
});
