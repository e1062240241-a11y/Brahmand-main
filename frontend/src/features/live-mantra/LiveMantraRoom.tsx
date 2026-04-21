import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { socketService } from '../../services/socket';
import { isWithinGayatriMantraWindow } from './schedule';

const ROOM_NAME = 'mantra-jaap-live-room';
const CHUNK_DURATION_MS = 1800;
const MANTRA = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्';
const WORDS = MANTRA.split(' ');

const getUriExtension = (uri: string) => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1] : 'm4a';
};

const createPeerId = () => `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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

  const roomMutedRef = useRef(roomMuted);
  const isMutedRef = useRef(isMuted);

  const localPeerId = useMemo(() => createPeerId(), []);

  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const bgPulse = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingActiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const soundPlayersRef = useRef<Audio.Sound[]>([]);

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

  const cleanupRemoteSounds = async () => {
    await Promise.all(
      soundPlayersRef.current.map(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch {
          // ignore cleanup failures
        }
      })
    );
    soundPlayersRef.current = [];
  };

  const handleRemoteChunk = async (data: any) => {
    if (!data || data.peerId === localPeerId || roomMutedRef.current || isMutedRef.current) {
      return;
    }

    console.log('LiveMantra: received voice_chunk', data?.peerId);
    const { chunk, format, peerId } = data;
    if (!chunk || !format || !peerId) {
      return;
    }

    addRemoteSpeaker(peerId);

    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
    const cacheUri = `${baseDir}live-mantra-${peerId}-${Date.now().toString(36)}.${format}`;
    try {
      await FileSystem.writeAsStringAsync(cacheUri, chunk, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: cacheUri },
        { shouldPlay: true, volume: 1.0 }
      );

      soundPlayersRef.current.push(sound);
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await sound.unloadAsync();
          } catch {
            // noop
          }
          soundPlayersRef.current = soundPlayersRef.current.filter((item) => item !== sound);
        }
      });
    } catch (error) {
      console.warn('Failed to play remote audio chunk', error);
    }
  };

  const emitAudioChunk = (chunk: string, format: string) => {
    socketService.emit('voice_chunk', {
      room: ROOM_NAME,
      peerId: localPeerId,
      chunk,
      format,
      timestamp: new Date().toISOString(),
    });
  };

  const stopCurrentRecording = async () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const currentRecording = recordingRef.current;
    recordingRef.current = null;
    if (currentRecording) {
      try {
        await currentRecording.stopAndUnloadAsync();
      } catch {
        // ignore stop failures
      }
    }
  };

  const startChunkRecording = async () => {
    if (!isMountedRef.current || roomMuted || !isMicEnabled || !isConnected) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
      recordingRef.current = recording;
      setMicStatus('Recording live mantra…');

      recordingTimerRef.current = setTimeout(async () => {
        const finishedRecording = recordingRef.current === recording ? recording : null;
        recordingRef.current = null;
        recordingTimerRef.current = null;

        if (!finishedRecording) {
          return;
        }

        try {
          await finishedRecording.stopAndUnloadAsync();
          const uri = finishedRecording.getURI();
          if (uri) {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            emitAudioChunk(base64, getUriExtension(uri));
          }
        } catch (error) {
          console.warn('Failed to capture audio chunk', error);
        }

        if (recordingActiveRef.current && !roomMuted && isMicEnabled && isMountedRef.current) {
          await startChunkRecording();
        }
      }, CHUNK_DURATION_MS);
    } catch (error) {
      console.warn('Audio recording failed', error);
      setMicStatus('Microphone unavailable');
      setIsMicEnabled(false);
      recordingActiveRef.current = false;
    }
  };

  const startVoiceLoop = async () => {
    if (recordingActiveRef.current || roomMuted || !isMicEnabled || !isConnected) {
      return;
    }
    recordingActiveRef.current = true;
    setMicStatus('Live mantra mic ready');
    await startChunkRecording();
  };

  const stopVoiceLoop = async () => {
    recordingActiveRef.current = false;
    await stopCurrentRecording();
    setMicStatus(isMicEnabled ? 'Microphone paused' : 'Microphone off');
  };

  const requestMicPermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      setMicPermissionGranted(granted);
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
      await stopVoiceLoop();
      setMicStatus('Microphone off');
      return;
    }

    const granted = micPermissionGranted || (await requestMicPermission());
    if (!granted) {
      return;
    }

    setIsMicEnabled(true);
    setMicStatus('Microphone enabled');
    if (!roomMuted) {
      await startVoiceLoop();
    }
  };

  useEffect(() => {
    roomMutedRef.current = roomMuted;
  }, [roomMuted]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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

  const handlePeerJoined = (data: any) => {
    if (!data?.peerId || data.peerId === localPeerId) {
      return;
    }
    addRemotePeer(data.peerId);
  };

  const handlePeerLeft = (data: any) => {
    if (!data?.peerId) {
      return;
    }
    removeRemotePeer(data.peerId);
  };

  const connectSocket = async () => {
    try {
      await socketService.connect();
      setIsConnected(true);
      setParticipantLabel('Room connected');
      setMicStatus('Live room ready');

      const joinResult = await socketService.joinRoom(ROOM_NAME, localPeerId);
      if (joinResult?.peers?.length) {
        setRemotePeers(joinResult.peers);
      }

      socketService.onEvent('voice_chunk', handleRemoteChunk);
      socketService.onEvent('peer_joined', handlePeerJoined);
      socketService.onEvent('peer_left', handlePeerLeft);
    } catch (error) {
      console.warn('Socket connection failed', error);
      setIsConnected(false);
      setParticipantLabel('Connection failed');
      setMicStatus('Room unavailable');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    connectSocket();

    return () => {
      isMountedRef.current = false;
      socketService.offEvent('voice_chunk', handleRemoteChunk);
      socketService.offEvent('peer_joined', handlePeerJoined);
      socketService.offEvent('peer_left', handlePeerLeft);
      socketService.leaveRoom(ROOM_NAME, localPeerId);
      stopVoiceLoop();
      cleanupRemoteSounds();
    };
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
  }, [isMicEnabled, roomMuted, isConnected]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgPulse, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bgPulse]);

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

  const backgroundScale = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.background, { transform: [{ scale: backgroundScale }] }]}> 
        <LinearGradient
          colors={['#050505', '#120800', '#2f1200']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.silhouetteOverlay} />
        <View style={styles.header}>
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
            <TouchableOpacity
              style={[
                styles.controlButton,
                roomMuted ? styles.controlButtonMuted : null,
              ]}
              onPress={handleRoomMute}
              activeOpacity={0.8}
            >
              <Ionicons
                name={roomMuted ? 'volume-mute' : 'volume-medium'}
                size={22}
                color="#FFF"
              />
              <Text style={styles.controlLabel}>{roomMuted ? 'Room Muted' : 'Room Live'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.micStatus} numberOfLines={1}>
            Remote users: {remotePeers.length || 0}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/temple');
            }
          }}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
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
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
