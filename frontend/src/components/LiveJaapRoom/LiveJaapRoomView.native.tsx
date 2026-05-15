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
import { useAudioPlayer, requestRecordingPermissionsAsync } from 'expo-audio';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  AudioScenarioType,
  AudioProfileType,
} from 'react-native-agora';
import { getAgoraToken } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MANTRA_DATA: Record<string, { text: string; bg: any }> = {
  gayatri: {
    text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
  hanuman: {
    text: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि बरनऊँ रघुबर बिमल जसु जो दायकु फल चारि बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार जय हनुमान ज्ञान गुन सागर जय कपीस तिहुँ लोक उजागर राम दूत अतुलित बल धामा अंजनि पुत्र पवनसुत नामा महाबीर बिक्रम बजरंगी कुमति निवार सुमति के संगी कंचन बरन बिराज सुबेसा कानन कुंडल कुंचित केसा हाथ बज्र औ ध्वजा बिराजै काँधे मूँज जनेऊ साजै संकर सुवन केसरीनंदन तेज प्रताप महा जग बंदन बिद्यावान गुनी अति चातुर राम काज करिबे को आतुर प्रभु चरित्र सुनिबे को रसिया राम लखन सीता मन बसिया सूक्ष्म रूप धरि सियहिं दिखावा बिकट रूप धरि लंक जरावा भीम रूप धरि असुर सँहारे रामचन्द्र के काज सँवारे लाय सँजीवन लखन जियाये श्रीरघुबीर हरषि उर लाये रघुपति कीन्ही बहुत बड़ाई तुम मम प्रिय भरतहि सम भाई सहस बदन तुम्हरो जस गावैं अस कहि श्रीपति के कंठ लगावैं सनकादिक ब्रह्मादि मुनीसा नारद सारद सहित अहीसा जम कुबेर दिगपाल जहाँ ते कबि कोबिद कहि सके कहाँ ते तुम उपकार सुग्रीवहिं कीन्हा राम मिलाय राज पद दीन्हा तुम्हरो मंत्र बिभीषन माना लंकेस्वर भए सब जग जाना जुग सहस्र जोजन पर भानू लील्यो ताहि मधुर फल जानू प्रभु मुद्रिका मेलि मुख माहीं जलधि लाँघि गये अचरज नाहीं दुर्गम काज जगत के जेते सुगम अनुग्रह तुम्हरे तेते राम दुआरे तुम रखवारे होत न आग्या बिनु पैसारे सब सुख लहै तुम्हारी सरना तुम रक्षक काहू को डर ना आपन तेज सम्हारो आपै तीनों लोक हाँक तें काँपै भूत पिसाच निकट नहिं आवै महाबीर जब नाम सुनावै नासै रोग हरै सब पीरा जपत निरंतर हनुमत बीरा संकट तें हनुमान छुड़ावै मन क्रम बचन ध्यान जो लावै सब पर राम तपस्वी राजा तिन के काज सकल तुम साजा और मनोरथ जो कोई लावै सोइ अमित जीवन फल पावै चारों जुग परताप तुम्हारा है परसिद्ध जगत उजियारा साधु संत के तुम रखवारे असुर निकंदन राम दुलारे अष्ट सिद्धि नौ निधि के दाता अस बर दीन जानकी माता राम रसायन तुम्हरे पासा सदा रहो रघुपति के दासा तुम्हरे भजन राम को पावै जनम जनम के दुख बिसरावै अंत काल रघुबर पुर जाई जहाँ जन्म हरि भक्त कहाई और देवता चित्त न धरई हनुमत सेइ सर्ब सुख करई संकट कटै मिटै सब पीरा जो सुमिरै हनुमत बलबीरा जै जै जै हनुमान गोसाईं कृपा करहु गुरुदेव की नाईं जो सत बार पाठ कर कोई छूटहि बंदि महा सुख होई जो यह पढ़ै हनुमान चालीसा होय सिद्धि साखी गौरीसा तुलसीदास सदा हरि चेरा कीजै नाथ हृदय मँह डेरा पवनतनय संकट हरन मंगल मूरति रूप राम लखन सीता सहित हृदय बसहु सुर भूप',
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

const MANTRA_BG_AUDIO: Record<string, any> = {
  gayatri: require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3'),
  hanuman: require('../../../assets/audio/audio ekant/leberch-yoga-509709.mp3'), // Placeholder for Hanuman Chalisa audio
  krishna: require('../../../assets/audio/audio ekant/eisenkern1982-waterfall-176958.mp3'),
  shiva: require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3'),
  mrityunjaya: require('../../../assets/audio/audio ekant/rmultimediaeu-birds-and-waterfall-250309.mp3'),
};

export default function LiveJaapRoomView() {
  const router = useRouter();
  const { initialMic, mantraType, title: roomTitle } = useLocalSearchParams<{ 
    initialMic?: string, 
    mantraType?: string,
    title?: string 
  }>();
  
  const selectedMantra = MANTRA_DATA[mantraType || 'gayatri'] || MANTRA_DATA.gayatri;
  const WORDS = selectedMantra.text.split(' ');
  const ROOM_NAME = `jaap-${mantraType || 'gayatri'}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(initialMic === 'true');
  const [micStatus, setMicStatus] = useState('Joining room...');
  const [participantLabel, setParticipantLabel] = useState('Connecting...');
  const [remotePeers, setRemotePeers] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'chant' | 'path'>('chant');
  
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;
  
  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const agoraJoinedRef = useRef(false);
  
  const bgPlayer = useAudioPlayer(MANTRA_BG_AUDIO[mantraType || 'gayatri'] || MANTRA_BG_AUDIO.gayatri);

  useEffect(() => {
    if (bgPlayer) {
      bgPlayer.loop = true;
      bgPlayer.volume = isMuted ? 0 : 0.4;
      // Auto-play on native since user already interacted to reach this screen
      try {
        bgPlayer.play();
      } catch (e) {
        console.warn('Background player failed to play:', e);
      }
    }
  }, [bgPlayer, isMuted]);

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

    setupAgora();

    return () => {
      cleanupAgora();
    };
  }, []);

  useEffect(() => {
    Animated.timing(activeIndexAnim, {
      toValue: currentIndex,
      duration: 900,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isHolding) {
      timer = setTimeout(() => {
        setIsHolding(false);
        setCurrentIndex(0);
      }, 5000);
      return () => clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (currentIndex < WORDS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsHolding(true);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [currentIndex, isHolding]);

  const setupAgora = async () => {
    try {
      // If mic is intended to be on, ensure we have permission first
      if (isMicEnabled) {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          console.warn('[Agora] Mic permission not granted at start');
          setIsMicEnabled(false);
        }
      }

      console.log('[Agora] Fetching token for channel:', ROOM_NAME);
      const config = await getAgoraToken(ROOM_NAME);
      
      if (!config.enabled || !config.token || !config.appId) {
        console.error('[Agora] Token config invalid or disabled:', config);
        setMicStatus('Audio room not available');
        setParticipantLabel('Agora Not Configured');
        return;
      }

      console.log('[Agora] Initializing engine with AppID:', config.appId);
      await engine.current.initialize({
        appId: config.appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection) => {
          console.log('[Agora] Joined channel successfully:', connection.channelId);
          agoraJoinedRef.current = true;
          setParticipantLabel(`Connected to ${roomTitle || 'Sangat'}`);
          setMicStatus('Audio room live');
          
          // Initial mute state based on current isMicEnabled state
          engine.current.muteLocalAudioStream(!isMicEnabled);
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number) => {
          console.log('[Agora] Remote user joined:', remoteUid);
          setRemotePeers(prev => prev + 1);
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number) => {
          console.log('[Agora] Remote user offline:', remoteUid);
          setRemotePeers(prev => Math.max(0, prev - 1));
        },
        onError: (err: number, msg: string) => {
          console.error('[Agora] Error:', err, msg);
          setMicStatus(`Connection Error: ${err}`);
        }
      });

      await engine.current.setAudioProfile(
        AudioProfileType.AudioProfileMusicHighQualityStereo,
        AudioScenarioType.AudioScenarioGameStreaming
      );

      await engine.current.enableAudio();
      await engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      
      console.log('[Agora] Joining channel:', ROOM_NAME, 'UID:', config.uid);
      const joinResult = await engine.current.joinChannel(config.token, ROOM_NAME, config.uid || 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });

      if (joinResult !== 0) {
        console.error('[Agora] joinChannel failed with code:', joinResult);
        setMicStatus('Join failed');
      }
    } catch (error) {
      console.error('[Agora] Setup failed:', error);
      setMicStatus('Audio unavailable');
    }
  };

  const cleanupAgora = async () => {
    if (agoraJoinedRef.current) {
      await engine.current.leaveChannel();
      await engine.current.release();
    }
  };

  const toggleMic = async () => {
    if (isMicEnabled) {
      await engine.current.muteLocalAudioStream(true);
      setIsMicEnabled(false);
    } else {
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        await engine.current.muteLocalAudioStream(false);
        setIsMicEnabled(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={selectedMantra.bg} 
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(5,5,5,0.7)', 'rgba(5,5,5,0.9)', 'rgba(47,18,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/jaap');
                }
              }} 
              style={styles.headerBtn}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleBox}>
               <Text style={styles.participantLabel} numberOfLines={1}>{participantLabel}</Text>
               <Text style={styles.micStatusText}>{micStatus}</Text>
            </View>

            <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.headerBtn}>
              <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity 
              onPress={() => setActiveTab('chant')}
              style={[styles.tabButton, activeTab === 'chant' && styles.tabButtonActive]}
            >
              <Ionicons name="apps" size={18} color={activeTab === 'chant' ? '#FFEBB5' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === 'chant' && styles.tabTextActive]}>Chanting</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setActiveTab('path')}
              style={[styles.tabButton, activeTab === 'path' && styles.tabButtonActive]}
            >
              <Ionicons name="document-text" size={18} color={activeTab === 'path' ? '#FFEBB5' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === 'path' && styles.tabTextActive]}>Shloka Path</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
          >
            {activeTab === 'chant' ? (
              <View style={styles.mantraGrid}>
                {WORDS.map((word, index) => {
                  const scale = activeIndexAnim.interpolate({
                    inputRange: [index - 0.8, index, index + 0.8],
                    outputRange: [1, 1.15, 1],
                    extrapolate: 'clamp',
                  });
                  const opacity = activeIndexAnim.interpolate({
                    inputRange: [index - 0.8, index, index + 0.8],
                    outputRange: [0.25, 1, 0.25],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.Text
                      key={`${word}-${index}`}
                      style={[
                        styles.mantraWord,
                        {
                          transform: [{ scale }],
                          opacity,
                          textShadowColor: index === currentIndex ? '#ffd770' : 'transparent',
                          textShadowRadius: index === currentIndex ? 20 : 0,
                        },
                      ]}
                    >
                      {word}
                    </Animated.Text>
                  );
                })}
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

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/jaap');
                }
              }} 
              style={styles.endJaapBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.endJaapText}>End Jaap</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={toggleMic} 
              style={[styles.micPill, isMicEnabled && styles.micPillActive]}
              activeOpacity={0.8}
            >
              <Ionicons name={isMicEnabled ? "mic" : "mic-off"} size={18} color="#FFF" />
              <Text style={styles.micPillText}>{isMicEnabled ? 'Mic is Enabled' : 'Enable Microphone'}</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.upcomingBox, { opacity: upcomingFade }]}>
              <Text style={styles.upcomingLabel}>Upcoming Verse</Text>
              <Text style={styles.upcomingMantra} numberOfLines={1}>{WORDS[currentIndex + 1] || WORDS[0]}</Text>
            </Animated.View>

            <Text style={styles.roomStats}>Sangat: {remotePeers + 1} Devotees</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  participantLabel: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  micStatusText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 40,
    marginTop: 20,
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 22,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,107,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFEBB5',
  },
  mantraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    zIndex: 2,
    minHeight: 150,
  },
  mantraWord: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
    marginHorizontal: 6,
  },
  fullShlokaBox: {
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 24,
    borderRadius: 32,
    width: '92%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  scrollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,235,181,0.2)',
    paddingBottom: 10,
  },
  scrollHeaderText: {
    color: '#FFEBB5',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fullShlokaText: {
    color: '#FFEBB5',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  endJaapBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  endJaapText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  micPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 8,
  },
  micPillActive: {
    backgroundColor: 'rgba(255,102,0,0.2)',
    borderColor: 'rgba(255,102,0,0.5)',
  },
  micPillText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  upcomingBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    maxWidth: '80%',
    marginTop: 5,
  },
  upcomingLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 2,
  },
  upcomingMantra: {
    color: '#FFEBB5',
    fontSize: 13,
    fontWeight: '600',
  },
  roomStats: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
});
