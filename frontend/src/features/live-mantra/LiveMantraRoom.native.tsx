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
      bgPlayer.play();
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
      const config = await getAgoraToken(ROOM_NAME);
      if (!config.enabled || !config.token || !config.appId) {
        setMicStatus('Agora room not available');
        return false;
      }

      agoraUidRef.current = config.uid || 0;
      
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

      // Default to muted for privacy
      await engine.current.muteLocalAudioStream(true);
      return true;
    } catch (error) {
      console.error('[Agora] Failed to setup Agora:', error);
      setMicStatus('Audio room unavailable');
      return false;
    }
  };

  const cleanupAgora = async () => {
    if (agoraJoinedRef.current) {
      try {
        await engine.current.leaveChannel();
        await engine.current.release();
      } catch (error) {
        console.warn('Agora cleanup error', error);
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
      duration: 900,
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

          <View style={styles.controlPanel}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isMicEnabled && !roomMuted ? styles.controlButtonActive : null,
              ]}
              onPress={handleMicToggle}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMicEnabled ? 'mic' : 'mic-off'}
                size={22}
                color="#FFF"
              />
              <Text style={styles.controlLabel}>{isMicEnabled ? 'Mic On' : 'Mic Off'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.micStatus} numberOfLines={1}>
            {voiceTransport === 'sfu' ? 'Standard Room' : 'Agora Live Room'}: {remotePeers.length || 0}
            {remoteSpeakers.length ? ` · voices ${remoteSpeakers.length}` : ''}
          </Text>
        </View>

      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={26} color="#FFF" />
      </TouchableOpacity>
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
    fontSize: 38,
    fontWeight: '700',
    marginHorizontal: 6,
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
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 26,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,215,121,0.18)',
    borderColor: 'rgba(255,215,121,0.35)',
  },
  controlButtonMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  controlLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  micStatus: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    maxWidth: '85%',
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
  closeButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
});
