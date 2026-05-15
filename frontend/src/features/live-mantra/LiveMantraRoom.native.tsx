import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestRecordingPermissionsAsync, useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { isWithinGayatriMantraWindow } from './schedule';
import { getAgoraToken } from '../../services/api';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  IRtcEngineEventHandler,
} from 'react-native-agora';

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '4f7199e5d22f4aaf936700d75affe65d';

declare const require: any;

const ROOM_NAME = 'mantra-jaap-live-room';
const MANTRA = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्';
const WORDS = MANTRA.split(' ');
const BG_MUSIC = require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3');

type VoiceTransport = 'sfu' | 'agora';

export const LiveMantraRoom = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roomMuted, setRoomMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [micStatus, setMicStatus] = useState('Connecting to live room…');
  const [isConnected, setIsConnected] = useState(false);
  const [participantLabel, setParticipantLabel] = useState('Joining room...');
  const [remoteSpeakers, setRemoteSpeakers] = useState<string[]>([]);
  const [remotePeers, setRemotePeers] = useState<string[]>([]);
  const [voiceTransport, setVoiceTransport] = useState<VoiceTransport>('sfu');
  const [reactions, setReactions] = useState<{ id: number; emoji: string; anim: Animated.Value }[]>([]);

  const engine = useRef<IRtcEngine>(createAgoraRtcEngine());
  const agoraJoinedRef = useRef(false);
  const agoraUidRef = useRef(0);

  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const isMicEnabledRef = useRef(isMicEnabled);
  const micPermissionGrantedRef = useRef(micPermissionGranted);
  const roomMutedRef = useRef(roomMuted);

  const bgPlayer = useAudioPlayer(BG_MUSIC);

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


  const addRemoteSpeaker = (peerId: string) => {
    setRemoteSpeakers((current) => {
      if (current.includes(peerId)) return current;
      return [...current, peerId].slice(-5);
    });
  };

  const addRemotePeer = (peerId: string) => {
    setRemotePeers((current) => {
      if (current.includes(peerId)) return current;
      return [...current, peerId];
    });
  };

  const removeRemotePeer = (peerId: string) => {
    setRemotePeers((current) => current.filter((item) => item !== peerId));
  };

  const connectAgora = async () => {
    try {
      console.log('[Agora] Connecting for channel:', ROOM_NAME);
      const config = await getAgoraToken(ROOM_NAME);
      if (!config.enabled || !config.token || !config.appId) {
        console.error('[Agora] Token config invalid or disabled:', config);
        setMicStatus('Agora room not available');
        return false;
      }

      agoraUidRef.current = config.uid || 0;
      
      console.log('[Agora] Initializing engine with AppID:', config.appId);
      await engine.current.initialize({
        appId: config.appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
          console.log('[Agora] Joined channel successfully:', connection.channelId, 'UID:', connection.localUid);
          agoraJoinedRef.current = true;
          setIsConnected(true);
          setParticipantLabel('Connected to Sangat');
          setMicStatus('Audio room live');
          
          // Set initial mute state
          engine.current.muteLocalAudioStream(!isMicEnabled);
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
          console.log('[Agora] Remote user joined:', remoteUid);
          addRemotePeer(String(remoteUid));
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {
          console.log('[Agora] Remote user left:', remoteUid, 'Reason:', reason);
          removeRemotePeer(String(remoteUid));
        },
        onRemoteAudioStateChanged: (connection: RtcConnection, remoteUid: number, state: number) => {
          if (state === 2) { // RemoteAudioStateDecoding
            addRemoteSpeaker(String(remoteUid));
          }
        },
        onError: (err: number, msg: string) => {
          console.error('[Agora] Connection Error:', err, msg);
          setMicStatus(`Connection error: ${err}`);
          setIsConnected(false);
        },
        onConnectionStateChanged: (connection: RtcConnection, state: number, reason: number) => {
          console.log('[Agora] Connection state changed:', state, 'Reason:', reason);
        }
      });

      await engine.current.enableAudio();
      await engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      
      console.log('[Agora] Attempting to join channel:', ROOM_NAME, 'with UID:', agoraUidRef.current);
      const joinResult = await engine.current.joinChannel(config.token, ROOM_NAME, agoraUidRef.current, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });

      if (joinResult !== 0) {
        console.error('[Agora] joinChannel failed with code:', joinResult);
        setMicStatus('Join failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Agora] Failed to setup Agora:', error);
      setMicStatus('Audio room unavailable');
      return false;
    }
  };

  const cleanupAgora = async () => {
    if (agoraJoinedRef.current) {
      console.log('[Agora] Cleaning up engine...');
      try {
        await engine.current.leaveChannel();
        await engine.current.release();
      } catch (error) {
        console.warn('[Agora] Cleanup error', error);
      }
      agoraJoinedRef.current = false;
    }
  };

  const startVoiceLoop = async () => {
    try {
      await engine.current.muteLocalAudioStream(false);
      setMicStatus('Agora mic live');
    } catch (error) {
      console.warn('Failed to start Agora mic', error);
      setMicStatus('Microphone unavailable');
      setIsMicEnabled(false);
    }
  };

  const stopVoiceLoop = async () => {
    try {
      await engine.current.muteLocalAudioStream(true);
      setMicStatus(isMicEnabled ? 'Microphone paused' : 'Microphone off');
    } catch {
      // noop
    }
  };

  const requestMicPermission = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      setMicPermissionGranted(granted);
      micPermissionGrantedRef.current = granted;
      if (!granted) {
        setIsMicEnabled(false);
        setMicStatus('Microphone permission denied');
        return false;
      }
      setMicStatus('Microphone enabled');
      return true;
    } catch (error) {
      console.warn('Mic permission request failed', error);
      setIsMicEnabled(false);
      setMicStatus('Microphone unavailable');
      return false;
    }
  };

  const handleMicToggle = async () => {
    if (isMicEnabled) {
      setIsMicEnabled(false);
      isMicEnabledRef.current = false;
      await stopVoiceLoop();
      return;
    }

    const granted = micPermissionGrantedRef.current || (await requestMicPermission());
    if (!granted) {
      return;
    }

    setIsMicEnabled(true);
    isMicEnabledRef.current = true;
    if (!roomMuted) {
      await startVoiceLoop();
    }
  };

  const addReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const anim = new Animated.Value(0);
    setReactions(prev => [...prev, { id, emoji, anim }]);
    
    Animated.timing(anim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    });
  };

  useEffect(() => {
    roomMutedRef.current = roomMuted;
  }, [roomMuted]);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);

  useEffect(() => {
    micPermissionGrantedRef.current = micPermissionGranted;
  }, [micPermissionGranted]);

  const handleRoomMute = async () => {
    const nextRoomMuted = !roomMuted;
    setRoomMuted(nextRoomMuted);
    if (nextRoomMuted) {
      await stopVoiceLoop();
      setMicStatus('Room muted');
    } else if (isMicEnabled) {
      await startVoiceLoop();
      setMicStatus('Room live');
    }
  };

  useEffect(() => {
    connectAgora();

    return () => {
      cleanupAgora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const checkWindow = () => {
      if (!isWithinGayatriMantraWindow()) {
        router.replace('/live-mantra');
      }
    };

    checkWindow();
    const timer = setInterval(checkWindow, 15_000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    if (isMicEnabled && !roomMuted && isConnected) {
      startVoiceLoop();
    }
    // Mic state transitions are guarded by refs inside the voice loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMicEnabled, roomMuted, isConnected]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.9,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowOpacity]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(upcomingFade, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(upcomingFade, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ])
    ).start();
  }, [upcomingFade]);

  useEffect(() => {
    Animated.timing(activeIndexAnim, {
      toValue: currentIndex,
      duration: 500, // Snappier transition
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeIndexAnim, currentIndex]);

  const handleClose = useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/live-mantra');
    }
  }, [router]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isHolding) {
      timer = setTimeout(() => {
        setIsHolding(false);
        setCurrentIndex(0);
      }, 4000); // Faster reset
      return () => clearTimeout(timer);
    }

    // Adaptive word timing: Long words get 3s hold, others 1.2s
    const currentWord = WORDS[currentIndex] || '';
    const wordDuration = currentWord.length > 7 ? 3000 : 1200;

    timer = setTimeout(() => {
      if (currentIndex < WORDS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsHolding(true);
      }
    }, wordDuration);

    return () => clearTimeout(timer);
  }, [currentIndex, isHolding]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.background}> 
        <LinearGradient
          colors={['#050505', '#120800', '#2f1200']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.silhouetteOverlay} pointerEvents="none" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerCloseButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/temple');
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.statusBlock}>
            <Text style={styles.subTitle}>{participantLabel}</Text>
            <Text style={styles.statusText}>{micStatus}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsMuted((prev) => !prev)}
            style={styles.muteButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <View style={styles.glowRing}>
            <Animated.View style={[styles.glowPulse, { opacity: glowOpacity }]} />
          </View>

          <View style={styles.mantraRow}>
            {WORDS.map((word, index) => {
              const scale = activeIndexAnim.interpolate({
                inputRange: [index - 0.8, index, index + 0.8],
                outputRange: [0.95, 1.18, 0.95],
                extrapolate: 'clamp',
              });
              const opacity = activeIndexAnim.interpolate({
                inputRange: [index - 0.8, index, index + 0.8],
                outputRange: [0.22, 1, 0.22],
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
                      textShadowRadius: index === currentIndex ? 24 : 0,
                    },
                  ]}
                >
                  {word}
                </Animated.Text>
              );
            })}
          </View>

          <Animated.View style={[styles.upcomingContainer, { opacity: upcomingFade }]}> 
            <Text style={styles.upcomingLabel}>Upcoming Mantra</Text>
            <Text style={styles.upcomingText}>ॐ भूर्भुवः स्वः</Text>
          </Animated.View>

          <View style={styles.reactionOverlay} pointerEvents="none">
            {reactions.map(r => (
              <Animated.Text
                key={r.id}
                style={[
                  styles.floatingEmoji,
                  {
                    opacity: r.anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                      { translateY: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
                      { translateX: r.anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 15, -15, 10, 0] }) },
                      { scale: r.anim.interpolate({ inputRange: [0, 0.2], outputRange: [0.6, 1.2], extrapolate: 'clamp' }) }
                    ]
                  }
                ]}
              >
                {r.emoji}
              </Animated.Text>
            ))}
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.roomStatsBox}>
               <Text style={styles.roomStats}>Sangat: {remotePeers.length + 1} Devotees</Text>
            </View>

            <View style={styles.transparentControlBar}>
              <View style={styles.leftControls}>
                <TouchableOpacity onPress={handleMicToggle} style={styles.iconCircle}>
                  <Ionicons name={isMicEnabled ? "mic" : "mic-off"} size={22} color={isMicEnabled ? "#4CD964" : "#FFF"} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/live-mantra');
                    }
                  }} 
                  style={[styles.iconCircle, { backgroundColor: '#FF3B30' }]}
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.rightReactions}>
                {['🙏', '❤️', '😊', '🔔'].map((emoji) => (
                  <TouchableOpacity 
                    key={emoji} 
                    onPress={() => addReaction(emoji)}
                    style={styles.reactionBtn}
                  >
                    <Text style={styles.reactionBtnText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  background: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 96,
    overflow: 'hidden',
  },
  silhouetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 160, 35, 0.08)',
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  statusBlock: {
    flex: 1,
  },
  subTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  statusText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    marginTop: 4,
  },
  muteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,215,120,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowPulse: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 205, 74, 0.14)',
  },
  mantraRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  mantraWord: {
    color: '#FFF',
    fontSize: 40, // Slightly larger
    fontWeight: '800',
    marginHorizontal: 8,
    textAlign: 'center',
  },
  upcomingContainer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  upcomingLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  upcomingText: {
    color: '#FFEBB5',
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  transparentControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rightReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactionBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBtnText: {
    fontSize: 22,
  },
  reactionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 100,
    paddingRight: 40,
    zIndex: 100,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 32,
    bottom: 0,
  },
  roomStatsBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomStats: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  headerCloseButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
