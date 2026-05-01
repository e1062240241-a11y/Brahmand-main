import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
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
import * as FileSystem from 'expo-file-system/legacy';
import { socketService } from '../../services/socket';
import { getRealtimeIceServers, getRealtimeSfuToken, type RealtimeIceServer } from '../../services/api';
import { isWithinGayatriMantraWindow } from './schedule';

declare const require: any;

const ROOM_NAME = 'mantra-jaap-live-room';
const CHUNK_DURATION_MS = 1800;
const DEFAULT_ICE_SERVERS: RealtimeIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];
const MANTRA = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्';
const WORDS = MANTRA.split(' ');

const getUriExtension = (uri: string) => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? match[1] : 'm4a';
};

const createPeerId = () => `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type VoiceTransport = 'connecting' | 'sfu' | 'webrtc' | 'relay';

type WebRTCApi = {
  RTCPeerConnection: any;
  RTCSessionDescription?: any;
  RTCIceCandidate?: any;
  mediaDevices: {
    getUserMedia: (constraints: any) => Promise<any>;
  };
};

type LiveKitApi = {
  Room: any;
  RoomEvent: Record<string, string>;
  AudioSession?: {
    startAudioSession?: () => Promise<void>;
    stopAudioSession?: () => Promise<void>;
  };
};

const loadWebRTCApi = (): WebRTCApi | null => {
  if (Platform.OS === 'web') {
    const webGlobal = globalThis as any;
    if (webGlobal.RTCPeerConnection && webGlobal.navigator?.mediaDevices?.getUserMedia) {
      return {
        RTCPeerConnection: webGlobal.RTCPeerConnection,
        RTCSessionDescription: webGlobal.RTCSessionDescription,
        RTCIceCandidate: webGlobal.RTCIceCandidate,
        mediaDevices: webGlobal.navigator.mediaDevices,
      };
    }
    return null;
  }

  try {
    const nativeWebRTC = require('react-native-webrtc');
    if (nativeWebRTC?.RTCPeerConnection && nativeWebRTC?.mediaDevices?.getUserMedia) {
      return {
        RTCPeerConnection: nativeWebRTC.RTCPeerConnection,
        RTCSessionDescription: nativeWebRTC.RTCSessionDescription,
        RTCIceCandidate: nativeWebRTC.RTCIceCandidate,
        mediaDevices: nativeWebRTC.mediaDevices,
      };
    }
  } catch {
    // The old Socket.IO audio relay remains available when native WebRTC is not bundled.
  }

  return null;
};

const loadLiveKitApi = (): LiveKitApi | null => {
  try {
    const livekitClient = require('livekit-client');
    let AudioSession;

    if (Platform.OS !== 'web') {
      const livekitNative = require('@livekit/react-native');
      livekitNative.registerGlobals?.();
      AudioSession = livekitNative.AudioSession;
    }

    if (livekitClient?.Room && livekitClient?.RoomEvent) {
      return {
        Room: livekitClient.Room,
        RoomEvent: livekitClient.RoomEvent,
        AudioSession,
      };
    }
  } catch {
    // SFU packages are optional in local/dev builds; mesh fallback remains available.
  }

  return null;
};

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
  const [voiceTransport, setVoiceTransport] = useState<VoiceTransport>('connecting');

  const roomMutedRef = useRef(roomMuted);
  const isMutedRef = useRef(isMuted);
  const isMicEnabledRef = useRef(isMicEnabled);
  const micPermissionGrantedRef = useRef(micPermissionGranted);
  const voiceTransportRef = useRef<VoiceTransport>('connecting');
  const liveKitApiRef = useRef<LiveKitApi | null>(null);
  const sfuRoomRef = useRef<any>(null);
  const webRTCApiRef = useRef<WebRTCApi | null>(null);
  const iceServersRef = useRef<RealtimeIceServer[]>(DEFAULT_ICE_SERVERS);
  const turnEnabledRef = useRef(false);

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
  const localStreamRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, any>>(new Map());
  const remoteAudioTracksRef = useRef<Map<string, any[]>>(new Map());

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

  const setLocalTracksEnabled = (enabled: boolean) => {
    const localStream = localStreamRef.current;
    if (!localStream?.getAudioTracks) {
      return;
    }

    localStream.getAudioTracks().forEach((track: any) => {
      track.enabled = enabled;
    });
  };

  const setRemoteTracksEnabled = (enabled: boolean) => {
    remoteAudioTracksRef.current.forEach((tracks) => {
      tracks.forEach((track) => {
        track.enabled = enabled;
      });
    });
  };

  const rememberRemoteTrack = (peerId: string, track: any) => {
    if (!track || track.kind !== 'audio') {
      return;
    }

    const currentTracks = remoteAudioTracksRef.current.get(peerId) ?? [];
    if (!currentTracks.some((item) => item.id === track.id)) {
      track.enabled = !isMutedRef.current && !roomMutedRef.current;
      remoteAudioTracksRef.current.set(peerId, [...currentTracks, track]);
    }
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) {
      setLocalTracksEnabled(isMicEnabledRef.current && !roomMutedRef.current);
      return localStreamRef.current;
    }

    const webRTCApi = webRTCApiRef.current;
    if (!webRTCApi) {
      return null;
    }

    const granted = micPermissionGrantedRef.current || (await requestMicPermission());
    if (!granted) {
      return null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const stream = await webRTCApi.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    localStreamRef.current = stream;
    setLocalTracksEnabled(isMicEnabledRef.current && !roomMutedRef.current);
    return stream;
  };

  const serializeRTCDescription = (description: any) => {
    if (!description) return description;
    return typeof description.toJSON === 'function' ? description.toJSON() : description;
  };

  const serializeRTCCandidate = (candidate: any) => {
    if (!candidate) return candidate;
    return typeof candidate.toJSON === 'function' ? candidate.toJSON() : candidate;
  };

  const buildRTCSessionDescription = (description: any) => {
    const webRTCApi = webRTCApiRef.current;
    if (webRTCApi?.RTCSessionDescription) {
      return new webRTCApi.RTCSessionDescription(description);
    }
    return description;
  };

  const buildRTCIceCandidate = (candidate: any) => {
    const webRTCApi = webRTCApiRef.current;
    if (webRTCApi?.RTCIceCandidate) {
      return new webRTCApi.RTCIceCandidate(candidate);
    }
    return candidate;
  };

  const attachLocalStreamToPeer = async (peerConnection: any) => {
    const localStream = localStreamRef.current;
    if (!localStream?.getTracks) {
      return;
    }

    const existingSenders = typeof peerConnection.getSenders === 'function'
      ? peerConnection.getSenders()
      : [];

    localStream.getTracks().forEach((track: any) => {
      const alreadyAttached = existingSenders.some((sender: any) => sender.track?.id === track.id);
      if (!alreadyAttached && typeof peerConnection.addTrack === 'function') {
        peerConnection.addTrack(track, localStream);
      }
    });

    if (!peerConnection.addTrack && typeof peerConnection.addStream === 'function') {
      peerConnection.addStream(localStream);
    }
  };

  const createPeerConnection = (peerId: string) => {
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) {
      return existing;
    }

    const webRTCApi = webRTCApiRef.current;
    if (!webRTCApi) {
      return null;
    }

    const peerConnection = new webRTCApi.RTCPeerConnection({
      iceServers: iceServersRef.current,
      iceCandidatePoolSize: 4,
    });
    if (typeof peerConnection.addTransceiver === 'function') {
      try {
        peerConnection.addTransceiver('audio', { direction: 'recvonly' });
      } catch {
        // Older native WebRTC builds may not support transceiver constraints.
      }
    }

    peerConnection.onicecandidate = (event: any) => {
      if (!event.candidate) {
        return;
      }
      socketService.emit('webrtc_ice_candidate', {
        room: ROOM_NAME,
        fromPeerId: localPeerId,
        toPeerId: peerId,
        candidate: serializeRTCCandidate(event.candidate),
      });
    };

    peerConnection.ontrack = (event: any) => {
      rememberRemoteTrack(peerId, event.track);
      addRemoteSpeaker(peerId);
      setMicStatus('Receiving live audio');
    };

    peerConnection.onaddstream = (event: any) => {
      event.stream?.getAudioTracks?.().forEach((track: any) => rememberRemoteTrack(peerId, track));
      addRemoteSpeaker(peerId);
      setMicStatus('Receiving live audio');
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === 'connected') {
        addRemoteSpeaker(peerId);
        setMicStatus(isMicEnabledRef.current ? 'Live audio connected' : 'Listening live');
      }
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        removeRemotePeer(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, peerConnection);
    return peerConnection;
  };

  const negotiateWithPeer = async (peerId: string) => {
    if (!webRTCApiRef.current || !isMountedRef.current) {
      return;
    }

    try {
      const peerConnection = createPeerConnection(peerId);
      if (!peerConnection) {
        return;
      }

      await attachLocalStreamToPeer(peerConnection);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await peerConnection.setLocalDescription(offer);

      socketService.emit('webrtc_offer', {
        room: ROOM_NAME,
        fromPeerId: localPeerId,
        toPeerId: peerId,
        description: serializeRTCDescription(peerConnection.localDescription ?? offer),
      });
    } catch (error) {
      console.warn('Failed to negotiate Jaap audio peer', error);
      setMicStatus('Live audio reconnecting…');
    }
  };

  const renegotiateAllPeers = async () => {
    const peers = Array.from(peerConnectionsRef.current.keys());
    await Promise.all(peers.map((peerId) => negotiateWithPeer(peerId)));
  };

  const handleWebRTCOffer = async (data: any) => {
    if (!data?.fromPeerId || data.toPeerId !== localPeerId || !data.description) {
      return;
    }

    try {
      const peerConnection = createPeerConnection(data.fromPeerId);
      if (!peerConnection) {
        return;
      }

      await attachLocalStreamToPeer(peerConnection);
      await peerConnection.setRemoteDescription(buildRTCSessionDescription(data.description));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketService.emit('webrtc_answer', {
        room: ROOM_NAME,
        fromPeerId: localPeerId,
        toPeerId: data.fromPeerId,
        description: serializeRTCDescription(peerConnection.localDescription ?? answer),
      });

      addRemotePeer(data.fromPeerId);
    } catch (error) {
      console.warn('Failed to answer Jaap audio peer', error);
    }
  };

  const handleWebRTCAnswer = async (data: any) => {
    if (!data?.fromPeerId || data.toPeerId !== localPeerId || !data.description) {
      return;
    }

    try {
      const peerConnection = peerConnectionsRef.current.get(data.fromPeerId);
      if (!peerConnection) {
        return;
      }
      await peerConnection.setRemoteDescription(buildRTCSessionDescription(data.description));
      addRemotePeer(data.fromPeerId);
    } catch (error) {
      console.warn('Failed to apply Jaap audio answer', error);
    }
  };

  const handleWebRTCIceCandidate = async (data: any) => {
    if (!data?.fromPeerId || data.toPeerId !== localPeerId || !data.candidate) {
      return;
    }

    try {
      const peerConnection = createPeerConnection(data.fromPeerId);
      if (!peerConnection) {
        return;
      }
      await peerConnection.addIceCandidate(buildRTCIceCandidate(data.candidate));
    } catch (error) {
      console.warn('Failed to add Jaap audio ICE candidate', error);
    }
  };

  const closePeerConnection = (peerId: string) => {
    const peerConnection = peerConnectionsRef.current.get(peerId);
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch {
        // noop
      }
    }
    peerConnectionsRef.current.delete(peerId);
    remoteAudioTracksRef.current.delete(peerId);
  };

  const cleanupWebRTC = () => {
    peerConnectionsRef.current.forEach((peerConnection) => {
      try {
        peerConnection.close();
      } catch {
        // noop
      }
    });
    peerConnectionsRef.current.clear();
    remoteAudioTracksRef.current.clear();

    const localStream = localStreamRef.current;
    if (localStream?.getTracks) {
      localStream.getTracks().forEach((track: any) => {
        try {
          track.stop();
        } catch {
          // noop
        }
      });
    }
    localStreamRef.current = null;
  };

  const connectSfuRoom = async () => {
    const liveKitApi = loadLiveKitApi();
    if (!liveKitApi) {
      return false;
    }

    const sfuConfig = await getRealtimeSfuToken(ROOM_NAME);
    if (!sfuConfig.enabled || !sfuConfig.url || !sfuConfig.token) {
      return false;
    }

    const room = new liveKitApi.Room({
      adaptiveStream: false,
      dynacast: true,
      publishDefaults: {
        stopMicTrackOnMute: false,
      },
    });

    liveKitApiRef.current = liveKitApi;
    sfuRoomRef.current = room;

    const roomEvent = liveKitApi.RoomEvent;
    room.on(roomEvent.ParticipantConnected, (participant: any) => {
      addRemotePeer(participant.identity);
    });
    room.on(roomEvent.ParticipantDisconnected, (participant: any) => {
      removeRemotePeer(participant.identity);
    });
    room.on(roomEvent.TrackSubscribed, (_track: any, publication: any, participant: any) => {
      if (publication?.kind === 'audio' || publication?.source === 'microphone') {
        addRemotePeer(participant.identity);
        addRemoteSpeaker(participant.identity);
        setMicStatus('Receiving SFU audio');
      }
    });
    room.on(roomEvent.Disconnected, () => {
      setRemotePeers([]);
      setRemoteSpeakers([]);
    });
    room.on(roomEvent.ConnectionStateChanged, (state: string) => {
      if (state === 'connected') {
        setMicStatus('SFU audio connected');
      }
    });

    await liveKitApi.AudioSession?.startAudioSession?.();
    await room.connect(sfuConfig.url, sfuConfig.token, {
      autoSubscribe: true,
    });

    room.remoteParticipants?.forEach?.((participant: any) => {
      addRemotePeer(participant.identity);
    });

    await room.localParticipant?.setMicrophoneEnabled?.(false);
    voiceTransportRef.current = 'sfu';
    setVoiceTransport('sfu');
    setMicStatus('SFU room ready');
    return true;
  };

  const cleanupSfu = async () => {
    const room = sfuRoomRef.current;
    sfuRoomRef.current = null;
    if (room) {
      try {
        await room.localParticipant?.setMicrophoneEnabled?.(false);
        room.disconnect?.();
      } catch {
        // noop
      }
    }

    try {
      await liveKitApiRef.current?.AudioSession?.stopAudioSession?.();
    } catch {
      // noop
    }
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
    if (voiceTransportRef.current === 'sfu') {
      try {
        await sfuRoomRef.current?.localParticipant?.setMicrophoneEnabled?.(true);
        setMicStatus('SFU mic live');
      } catch (error) {
        console.warn('Failed to start SFU mic', error);
        setMicStatus('Microphone unavailable');
        setIsMicEnabled(false);
      }
      return;
    }

    if (voiceTransportRef.current === 'webrtc') {
      try {
        await ensureLocalStream();
        setLocalTracksEnabled(true);
        await renegotiateAllPeers();
        setMicStatus('Live mantra mic ready');
      } catch (error) {
        console.warn('Failed to start WebRTC mic', error);
        setMicStatus('Microphone unavailable');
        setIsMicEnabled(false);
      }
      return;
    }

    if (recordingActiveRef.current || roomMuted || !isMicEnabled || !isConnected) {
      return;
    }
    recordingActiveRef.current = true;
    setMicStatus('Live mantra mic ready');
    await startChunkRecording();
  };

  const stopVoiceLoop = async () => {
    if (voiceTransportRef.current === 'sfu') {
      try {
        await sfuRoomRef.current?.localParticipant?.setMicrophoneEnabled?.(false);
      } catch {
        // noop
      }
      setMicStatus(isMicEnabledRef.current ? 'Microphone paused' : 'Microphone off');
      return;
    }

    if (voiceTransportRef.current === 'webrtc') {
      setLocalTracksEnabled(false);
      setMicStatus(isMicEnabledRef.current ? 'Microphone paused' : 'Microphone off');
      await renegotiateAllPeers();
      return;
    }

    recordingActiveRef.current = false;
    await stopCurrentRecording();
    setMicStatus(isMicEnabled ? 'Microphone paused' : 'Microphone off');
  };

  const requestMicPermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
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
      setMicStatus('Microphone off');
      return;
    }

    const granted = micPermissionGrantedRef.current || (await requestMicPermission());
    if (!granted) {
      return;
    }

    setIsMicEnabled(true);
    isMicEnabledRef.current = true;
    setMicStatus('Microphone enabled');
    if (!roomMuted) {
      await startVoiceLoop();
    }
  };

  useEffect(() => {
    roomMutedRef.current = roomMuted;
    setRemoteTracksEnabled(!isMutedRef.current && !roomMuted);
  }, [roomMuted]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    setRemoteTracksEnabled(!isMuted && !roomMuted);
  }, [isMuted, roomMuted]);

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
    setLocalTracksEnabled(isMicEnabled && !roomMuted);
  }, [isMicEnabled, roomMuted]);

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
    closePeerConnection(data.peerId);
    removeRemotePeer(data.peerId);
  };

  const connectSocket = async () => {
    try {
      try {
        const sfuConnected = await connectSfuRoom();
        if (sfuConnected) {
          setIsConnected(true);
          setParticipantLabel('SFU room connected');
          return;
        }
      } catch (error) {
        console.warn('SFU connection failed, falling back to mesh', error);
        await cleanupSfu();
      }

      const webRTCApi = loadWebRTCApi();
      webRTCApiRef.current = webRTCApi;
      voiceTransportRef.current = webRTCApi ? 'webrtc' : 'relay';
      setVoiceTransport(webRTCApi ? 'webrtc' : 'relay');

      if (webRTCApi) {
        try {
          const realtimeConfig = await getRealtimeIceServers();
          if (realtimeConfig.iceServers?.length) {
            iceServersRef.current = realtimeConfig.iceServers;
          }
          turnEnabledRef.current = realtimeConfig.turnEnabled;
          setMicStatus(realtimeConfig.turnEnabled ? 'TURN relay ready' : 'STUN room ready');
        } catch (error) {
          console.warn('Failed to load realtime ICE servers', error);
          iceServersRef.current = DEFAULT_ICE_SERVERS;
          turnEnabledRef.current = false;
        }
      }

      await socketService.connect();
      setIsConnected(true);
      setParticipantLabel('Room connected');
      setMicStatus(
        webRTCApi
          ? turnEnabledRef.current ? 'Live audio room ready with TURN' : 'Live audio room ready'
          : 'Relay audio room ready'
      );

      socketService.onEvent('voice_chunk', handleRemoteChunk);
      socketService.onEvent('peer_joined', handlePeerJoined);
      socketService.onEvent('peer_left', handlePeerLeft);
      socketService.onEvent('webrtc_offer', handleWebRTCOffer);
      socketService.onEvent('webrtc_answer', handleWebRTCAnswer);
      socketService.onEvent('webrtc_ice_candidate', handleWebRTCIceCandidate);

      const joinResult = await socketService.joinRoom(ROOM_NAME, localPeerId);
      if (joinResult?.peers?.length) {
        setRemotePeers(joinResult.peers);
        if (webRTCApi) {
          await Promise.all(joinResult.peers.map((peerId: string) => negotiateWithPeer(peerId)));
        }
      }
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
      socketService.offEvent('webrtc_offer', handleWebRTCOffer);
      socketService.offEvent('webrtc_answer', handleWebRTCAnswer);
      socketService.offEvent('webrtc_ice_candidate', handleWebRTCIceCandidate);
      socketService.leaveRoom(ROOM_NAME, localPeerId);
      stopVoiceLoop();
      cleanupSfu();
      cleanupWebRTC();
      cleanupRemoteSounds();
    };
    // The socket room is intentionally joined once for this peer id.
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
            {voiceTransport === 'sfu' ? 'SFU peers' : voiceTransport === 'webrtc' ? 'Live peers' : 'Relay peers'}: {remotePeers.length || 0}
            {remoteSpeakers.length ? ` · voices ${remoteSpeakers.length}` : ''}
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
