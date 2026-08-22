import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  useWindowDimensions,
  Modal,
  StatusBar,
  AppState,
  AppStateStatus,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeVideoView, useSafeVideoPlayer, isPlayerValid } from '../../src/components/SafeVideoView';
import { useIsFocused } from '@react-navigation/native';

import { API_URL } from '../../src/services/api';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (_e) {}

let ScreenOrientation: any = null;
try {
  ScreenOrientation = require('expo-screen-orientation');
} catch (_e) {}

// API_URL from src/services/api automatically resolves 10.0.2.2 for Android Emulator, LAN IP for devices, and localhost for Web/iOS
const API_BASE_URL = (API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const shamikPathakCover = require('../../assets/images/shamik_pathak_ji.webp');

interface KathaEpisode {
  id: string;
  title: string;
  episode_number: number;
  date: string;
  duration: string;
  guru_name: string;
  video_url: string;
  thumbnail_url?: string;
  description?: string;
  is_new?: boolean;
}

interface KathaStatus {
  is_live: boolean;
  mode: string;
  title: string;
  guru_name: string;
  banner_message: string;
  next_stream_at: string;
  server_time_ist?: string;
  current_broadcast_start_time?: string;
  active_episode_number?: number;
  active_video_url?: string;
  active_episode_id?: string;
  active_duration?: string;
}

export default function KathaPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [episodes, setEpisodes] = useState<KathaEpisode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<KathaEpisode | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [hasSyncedLive, setHasSyncedLive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LATEST' | 'PART1' | 'PART2'>('ALL');
  const [status, setStatus] = useState<KathaStatus>({
    is_live: false,
    mode: 'OFF_AIR',
    title: 'Acharya Shamik Pathak Ji — Shravan Katha',
    guru_name: 'Acharya Shamik Pathak Ji',
    banner_message: 'Shravan Katha Daily Uploaded Episodes',
    next_stream_at: '2026-08-13T08:00:00+05:30',
  });

  const maxEpisodeNumber = useMemo(() => {
    if (!episodes || episodes.length === 0) return 0;
    return Math.max(...episodes.map(e => e.episode_number || 0));
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    if (!episodes) return [];
    if (activeFilter === 'LATEST') {
      return episodes.filter(e => e.episode_number === maxEpisodeNumber || e.is_new);
    }
    if (activeFilter === 'PART1') {
      return episodes.filter(e => (e.episode_number || 0) <= 10);
    }
    if (activeFilter === 'PART2') {
      return episodes.filter(e => (e.episode_number || 0) > 10);
    }
    return episodes;
  }, [episodes, activeFilter, maxEpisodeNumber]);

  // Custom Hotstar Minimalist Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekBarWidth, setSeekBarWidth] = useState(1);
  const hideControlsTimer = useRef<any>(null);
  const playScale = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [userSelectedEpisode, setUserSelectedEpisode] = useState<KathaEpisode | null>(null);
  const [epDurations, setEpDurations] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem('KATHA_EP_DURATIONS').then((val: string | null) => {
        if (val) {
          try { setEpDurations(JSON.parse(val)); } catch (_e) {}
        }
      }).catch(() => {});
    } catch (_e) {}
  }, []);
  const isUserSelectedOldEpisode = !!userSelectedEpisode;
  const activeVideoUrl = isUserSelectedOldEpisode
    ? (userSelectedEpisode?.video_url || '')
    : (status.is_live ? (status.active_video_url || activeEpisode?.video_url || '') : '');

  const player = useSafeVideoPlayer(activeVideoUrl, (p) => {
    try {
      p.loop = false;
      p.muted = false;
      if (status.is_live || isUserSelectedOldEpisode) {
        p.play();
        setIsPlaying(true);
      } else {
        p.pause();
        setIsPlaying(false);
      }
    } catch (_e) {}
  });

  // Live Sync & Auto-Play Logic
  useEffect(() => {
    if (!isPlayerValid(player) || !activeVideoUrl) return;
    if (!status.is_live && !isUserSelectedOldEpisode) {
      try {
        player.pause();
        setIsPlaying(false);
      } catch (_e) {}
      return;
    }

    let attempts = 0;
    const syncAndPlay = () => {
      try {
        if (!isPlayerValid(player)) return;

        // Auto-play
        player.play();
        setIsPlaying(true);

        // Calculate live broadcast offset using real-time device clock vs broadcast start time
        if (status.is_live && !isUserSelectedOldEpisode) {
          if (status.current_broadcast_start_time) {
            const realTimeNowMs = Date.now();
            const startTimeMs = new Date(status.current_broadcast_start_time).getTime();
            const offsetSeconds = Math.max(0, (realTimeNowMs - startTimeMs) / 1000);

            if (offsetSeconds > 0) {
              const currentPos = typeof player.currentTime === 'number' ? player.currentTime : 0;
              if (Math.abs(currentPos - offsetSeconds) > 1.5) {
                try {
                  player.currentTime = offsetSeconds;
                } catch (_e) {
                  try {
                    if (typeof player.seekTo === 'function') player.seekTo(offsetSeconds);
                  } catch (_e2) {}
                }
              }
            }
          }
        }
      } catch (_e) {}
    };

    syncAndPlay();
    const interval = setInterval(() => {
      attempts++;
      syncAndPlay();
      if (attempts >= 6) clearInterval(interval);
    }, 600);

    return () => clearInterval(interval);
  }, [player, activeVideoUrl, status.is_live, status.server_time_ist, status.current_broadcast_start_time, isUserSelectedOldEpisode]);

  // Track playback time and duration every 500ms
  useEffect(() => {
    if (!isPlayerValid(player)) return;

    const interval = setInterval(() => {
      try {
        if (isPlayerValid(player)) {
          if (typeof player.currentTime === 'number') {
            setCurrentTime(player.currentTime);
          }
          if (typeof player.duration === 'number' && player.duration > 0) {
            setDuration(player.duration);
            const activeId = userSelectedEpisode?.id || activeEpisode?.id;
            if (activeId) {
              const formatted = formatTime(player.duration);
              setEpDurations(prev => {
                if (prev[activeId] === formatted) return prev;
                const next = { ...prev, [activeId]: formatted };
                try {
                  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                  AsyncStorage.setItem('KATHA_EP_DURATIONS', JSON.stringify(next));
                } catch (_e) {}
                return next;
              });
            }
          }
        }
      } catch (_e) {}
    }, 500);

    return () => clearInterval(interval);
  }, [player, userSelectedEpisode?.id, activeEpisode?.id]);

  // Zero-Heat Thermal & Background Management: Instantly pause video when screen loses focus or app goes to background
  useEffect(() => {
    const handlePause = () => {
      if (isPlayerValid(player)) {
        try {
          player.pause();
          setIsPlaying(false);
        } catch (_e) {}
      }
    };

    if (!isFocused) {
      handlePause();
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        handlePause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused, player]);

  // Auto-hide custom Hotstar controls after 3.5 seconds
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [activeVideoUrl]);

  const togglePlayPause = () => {
    resetControlsTimer();
    Animated.sequence([
      Animated.timing(playScale, {
        toValue: 0.75,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(playScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isPlayerValid(player)) return;
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (_e) {}
  };

  const toggleShowHideControls = () => {
    if (showControls) {
      setShowControls(false);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    } else {
      resetControlsTimer();
    }
  };

  const toggleRotation = () => {
    resetControlsTimer();
    setIsLandscape(prev => !prev);
  };

  const toggleMute = () => {
    resetControlsTimer();
    if (!isPlayerValid(player)) return;
    try {
      player.muted = !isMuted;
      setIsMuted(!isMuted);
    } catch (_e) {}
  };

  const formatTime = (secs: number): string => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const KNOWN_EP_DURATIONS: Record<string, string> = {
    saavan_katha_ep1: '14:12',
    saavan_katha_ep2: '12:33',
    saavan_katha_ep3: '14:47',
    saavan_katha_ep4: '15:55',
    saavan_katha_ep5: '15:30',
    saavan_katha_ep6: '07:45',
    saavan_katha_ep7: '06:01',
    saavan_katha_ep8: '10:01',
    saavan_katha_ep9: '06:50',
    saavan_katha_ep10: '07:39',
  };

  const formatDurationString = (dur: any, epId?: string, isSelectedEp?: boolean): string => {
    if (isSelectedEp && duration > 0) {
      return formatTime(duration);
    }
    if (epId && epDurations[epId]) {
      return epDurations[epId];
    }
    if (epId && KNOWN_EP_DURATIONS[epId]) {
      return KNOWN_EP_DURATIONS[epId];
    }
    if (!dur) return '00:00';
    if (typeof dur === 'number') return formatTime(dur);
    const s = String(dur).trim();
    if (s.startsWith('00:')) return s.slice(3);
    return s;
  };

  const handleSeek = (e: any) => {
    resetControlsTimer();
    // Strictly block seeking during live broadcast
    if (status.is_live && !isUserSelectedOldEpisode) return;
    if (!isPlayerValid(player) || duration <= 0 || seekBarWidth <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const percentage = Math.max(0, Math.min(1, clickX / seekBarWidth));
    const targetSeconds = percentage * duration;
    try {
      if (player.seekTo) {
        player.seekTo(targetSeconds);
      } else if (player.seekBy) {
        player.seekBy(targetSeconds - player.currentTime);
      } else {
        player.currentTime = targetSeconds;
      }
      setCurrentTime(targetSeconds);
    } catch (_e) {}
  };

  const fetchKathaData = async () => {
    // console.log('[KathaPage] API_BASE_URL =', API_BASE_URL);
    // console.log('[KathaPage] Fetching:', `${API_BASE_URL}/api/katha/episodes`);
    try {
      // 1. Fetch status
      const statusRes = await fetch(`${API_BASE_URL}/api/katha/status`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (statusJson.status === 'success') {
          setStatus({
            is_live: statusJson.is_live,
            mode: statusJson.mode,
            title: statusJson.title,
            guru_name: statusJson.guru_name,
            banner_message: statusJson.banner_message,
            next_stream_at: statusJson.next_stream_at,
            current_broadcast_start_time: statusJson.current_broadcast_start_time,
            server_time_ist: statusJson.server_time_ist,
            active_video_url: statusJson.active_video_url || statusJson.prefetched_video_url,
          });
          if (statusJson.prefetched_video_url) {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              AsyncStorage.setItem('PREFETCHED_KATHA_URL', statusJson.prefetched_video_url);
            } catch (_e) {}
          }
        }
      }

      // 2. Fetch episodes
      // console.log('[KathaPage] Fetching episodes from:', `${API_BASE_URL}/api/katha/episodes`);
      const epRes = await fetch(`${API_BASE_URL}/api/katha/episodes`);
      // console.log('[KathaPage] Episodes response status:', epRes.status);
      if (epRes.ok) {
        const epJson = await epRes.json();
        // console.log('[KathaPage] Episodes received:', JSON.stringify(epJson.episodes?.map((e: any) => ({ id: e.id, title: e.title, video_url: e.video_url }))));
        if (epJson.status === 'success' && Array.isArray(epJson.episodes) && epJson.episodes.length > 0) {
          setEpisodes(epJson.episodes);

          // Select the latest episode (highest episode_number)
          const latestEp = epJson.episodes.reduce((prev: KathaEpisode, current: KathaEpisode) => {
            return (prev.episode_number || 0) > (current.episode_number || 0) ? prev : current;
          });
          setActiveEpisode(latestEp);
          // console.log('[KathaPage] setEpisodes called with', epJson.episodes.length, 'episodes');
        } else {
          console.warn('[KathaPage] API returned empty episodes');
          setEpisodes([]);
          setActiveEpisode(null);
        }
      } else {
        console.warn('[KathaPage] Episode fetch failed with status:', epRes.status);
        setEpisodes([]);
        setActiveEpisode(null);
      }
    } catch (err) {
      console.warn('[KathaPage] Error fetching data:', err);
      setEpisodes([]);
      setActiveEpisode(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch status and episodes when screen is focused
  useEffect(() => {
    if (!isFocused) return;
    fetchKathaData();
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchKathaData();
  };

  const handleSelectEpisode = (ep: KathaEpisode) => {
    setUserSelectedEpisode(ep);
    setActiveEpisode(ep);
    setIsPlaying(true);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const renderPlayerContent = (isModal: boolean) => {
    const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
    return (
      <Pressable
        style={[styles.playerWrapper, isModal && styles.fullscreenPlayerWrapper]}
        onPress={toggleShowHideControls}
      >
        {activeVideoUrl ? (
          <SafeVideoView
            player={player}
            ExpoVideoModule={ExpoVideoModule}
            source={activeVideoUrl}
            posterSource={activeEpisode?.thumbnail_url && !imageErrors[activeEpisode?.id || ''] ? { uri: activeEpisode.thumbnail_url } : shamikPathakCover}
            style={styles.videoPlayer}
            nativeControls={false}
            contentFit={isModal ? "contain" : "fill"}
          />
        ) : (
          <Image source={shamikPathakCover} style={styles.videoPlayer} resizeMode="cover" />
        )}

        {/* Hotstar Minimalist Control Overlay (No Seeking Bar, Clean Transparent Look) */}
        {showControls && (status.is_live || isUserSelectedOldEpisode) && (
          <Pressable style={styles.hotstarOverlay} onPress={toggleShowHideControls}>
            {/* Top Badge Info & Landscape Back Button */}
            <View style={styles.hotstarTopRow} pointerEvents="box-none">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isModal && (
                  <TouchableOpacity style={styles.landscapeBackBtn} onPress={toggleRotation}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                  </TouchableOpacity>
                )}
                {/* Top Left Day Katha Video Clean Text with Red Vertical Line */}
                <View style={{ width: 3.5, height: 16, backgroundColor: '#FF0000', borderRadius: 2, marginRight: 6 }} />
                <Text style={styles.topLeftKathaTitle}>
                  {activeEpisode ? `DAY ${activeEpisode.episode_number} • KATHA VIDEO` : 'KATHA VIDEO'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {status.is_live ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#FF0000' }]}>
                    <View style={styles.liveDot} />
                    <Text style={styles.badgeText}>
                      {status.mode === 'REPEAT_TELECAST' ? 'REPEAT TELECAST' : 'LIVE NOW'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Ionicons name="radio" size={12} color="#FF6B00" style={{ marginRight: 5 }} />
                    <Text style={[styles.badgeText, { color: '#FFF' }]}>
                      {activeEpisode ? `DAY ${activeEpisode.episode_number}` : '8:00 AM & 8:00 PM'}
                    </Text>
                  </View>
                )}

                {/* Close Player button when off-air and viewing old episode */}
                {!status.is_live && isUserSelectedOldEpisode && !isModal && (
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => setUserSelectedEpisode(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Center Big Play/Pause Button (No Circle, Thicker Icon, Smooth Scale Animation) */}
            <Pressable
              onPress={togglePlayPause}
              style={{ alignSelf: 'center', padding: 20 }}
            >
              <Animated.View style={{ transform: [{ scale: playScale }] }}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={52}
                  color="#FFFFFF"
                  style={{
                    marginLeft: isPlaying ? 0 : 5,
                    textShadowColor: 'rgba(0,0,0,0.6)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                />
              </Animated.View>
            </Pressable>

            {/* Bottom Control Bar */}
            <View style={styles.hotstarBottomBar} pointerEvents="box-none">
              {/* Live Broadcast Elapsed Timer Display (Non-Seekable) */}
              {status.is_live && !isUserSelectedOldEpisode && (
                <View style={styles.liveTimerContainer} pointerEvents="none">
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveTimerText}>LIVE • {formatTime(currentTime)}</Text>
                </View>
              )}

              {/* Seek Bar & Progress Display for Recorded Library Episodes */}
              {isUserSelectedOldEpisode && duration > 0 && (
                <View style={styles.seekBarContainer} pointerEvents="auto">
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Pressable
                    style={styles.seekBarTrack}
                    onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
                    onPress={handleSeek}
                  >
                    <View style={styles.seekBarTrackBackground}>
                      <View style={[styles.seekBarProgress, { width: `${progressPercent}%` }]} />
                    </View>
                    <View style={[styles.seekBarThumb, { left: `${progressPercent}%` }]} />
                  </Pressable>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              )}

              <View style={styles.hotstarBottomRow}>
                <View style={styles.bottomLeftControls}>
                  <TouchableOpacity
                    style={styles.bottomControlBtn}
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={20}
                      color="#FFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bottomControlBtn}
                    onPress={toggleMute}
                  >
                    <Ionicons
                      name={isMuted ? "volume-mute" : "volume-high"}
                      size={20}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Video Rotate / Fullscreen Button on Right Bottom */}
                <TouchableOpacity
                  style={styles.bottomControlBtn}
                  onPress={toggleRotation}
                >
                  <Ionicons
                    name={isModal ? "contract-outline" : "expand-outline"}
                    size={20}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.09, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Fullscreen 90-Degree Landscape Modal */}
      <Modal
        visible={isLandscape}
        animationType="none"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setIsLandscape(false)}
      >
        <View style={styles.landscapeModalContainer}>
          <StatusBar hidden={isLandscape} />
          <View
            style={{
              width: windowHeight,
              height: windowWidth,
              transform: [{ rotate: '90deg' }],
              backgroundColor: '#000000',
              overflow: 'hidden',
            }}
          >
            {renderPlayerContent(true)}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#331800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔱 श्रावण कथा</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
        }
      >
        {/* Main Player & Hotstar Custom Minimalist Controls (Only shown when Live or Episode Selected) */}
        {(status.is_live || isUserSelectedOldEpisode) && (
          <>
            <Animated.View style={[
              styles.playerContainer,
              {
                transform: [
                  {
                    scale: scrollY.interpolate({
                      inputRange: [0, 180],
                      outputRange: [1, 0.93],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [0, 200],
                      outputRange: [0, 15],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }
            ]}>
              <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: '#000000', position: 'relative' }}>
                {renderPlayerContent(false)}
                {/* Scroll-driven Black Overlay Mask */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: '#000000',
                      opacity: scrollY.interpolate({
                        inputRange: [0, 150, 400],
                        outputRange: [0, 0.15, 0.35],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
            </Animated.View>

            {/* Active Details / Banner Info */}
            <View style={styles.activeDetails}>
              {status.is_live && isUserSelectedOldEpisode && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FF0000',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginBottom: 10,
                    gap: 6,
                  }}
                  onPress={() => setUserSelectedEpisode(null)}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Watch Live Stream Now</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.activeTitle}>
                {isUserSelectedOldEpisode ? activeEpisode?.title : status.title}
              </Text>
              <Text style={styles.guruSubtitle}>
                {isUserSelectedOldEpisode ? activeEpisode?.guru_name : status.guru_name} • अध्यात्म गुरु एवं कथावाचक
              </Text>
              <Text style={styles.scheduleText}>
                {isUserSelectedOldEpisode ? 'कथा अध्याय' : status.banner_message}
              </Text>
            </View>
          </>
        )}

        {/* Episode Library Section (Always available) */}
        <View style={styles.librarySection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="movie-play-outline" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>श्रावण कथा अध्याय</Text>
          </View>

          {/* Quick Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBarContainer}
            style={{ marginBottom: 14 }}
          >
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
              onPress={() => setActiveFilter('ALL')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
                सभी अध्याय
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'LATEST' && styles.filterChipActive]}
              onPress={() => setActiveFilter('LATEST')}
            >
              <View style={styles.chipRedDot} />
              <Text style={[styles.filterChipText, activeFilter === 'LATEST' && styles.filterChipTextActive]}>
                नवीनतम (NEW)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'PART1' && styles.filterChipActive]}
              onPress={() => setActiveFilter('PART1')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'PART1' && styles.filterChipTextActive]}>
                Day 1 - 10
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'PART2' && styles.filterChipActive]}
              onPress={() => setActiveFilter('PART2')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'PART2' && styles.filterChipTextActive]}>
                Day 11+
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 30 }} />
          ) : filteredEpisodes.length > 0 ? (
            <View style={styles.verticalGridContainer}>
              {filteredEpisodes.map((ep) => {
                const isSelected = activeEpisode?.id === ep.id;
                const isNewEpisode = ep.is_new || ep.episode_number === maxEpisodeNumber;
                return (
                  <TouchableOpacity
                    key={ep.id}
                    style={[styles.episodeBoxCard, isSelected && styles.episodeCardSelected]}
                    activeOpacity={0.88}
                    onPress={() => handleSelectEpisode(ep)}
                  >
                    <View style={styles.thumbnailBox}>
                      <Image
                        source={ep.thumbnail_url && !imageErrors[ep.id] ? { uri: ep.thumbnail_url } : shamikPathakCover}
                        style={styles.thumbnailImg}
                        resizeMode="cover"
                        onError={() => setImageErrors(prev => ({ ...prev, [ep.id]: true }))}
                      />

                      {/* NEW Video Badge Overlay */}
                      {isNewEpisode && (
                        <View style={styles.newBadgePill}>
                          <View style={styles.newBadgeDot} />
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}

                      <View style={styles.playOverlay}>
                        <Ionicons
                          name={isSelected && isPlaying ? "pause" : "play"}
                          size={22}
                          color="#FFF"
                        />
                      </View>
                      <View style={styles.durationTag}>
                        <Text style={styles.durationText}>{formatDurationString(ep.duration, ep.id, isSelected)}</Text>
                      </View>
                    </View>

                    <View style={styles.boxEpisodeMeta}>
                      <View style={styles.epHeaderRow}>
                        <Text style={styles.epBadge}>Day {ep.episode_number}</Text>
                        <Text style={styles.epDate}>{ep.date}</Text>
                      </View>

                      <Text style={styles.epTitle} numberOfLines={2}>
                        {ep.title}
                      </Text>

                      <Text style={styles.epGuru} numberOfLines={1}>
                        {ep.guru_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No episodes found in this filter.</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const DARK = '#1B1C1C';
const BROWN = '#5A4136';
const ORANGE = '#FF6B00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 244, 235, 0.90)', // Glassmorphism translucent warm amber tint
    borderWidth: 1.2,
    borderColor: 'rgba(255, 107, 0, 0.25)', // Subtle warm amber glass border
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#2A1508', // Rich Sacred Dark Amber
    fontFamily: Platform.OS === 'ios' ? 'Devanagari Sangam MN' : 'serif',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255, 107, 0, 0.25)', // Elegant 3D Warm Glow Shadow
    textShadowOffset: { width: 1, height: 1.5 },
    textShadowRadius: 2.5,
  },
  playerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 1216 / 2160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  offAirContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offAirTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  offAirSub: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 5,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  hotstarOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'space-between',
    padding: 12,
  },
  hotstarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  landscapeBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
    marginRight: 6,
  },
  liveTimerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  centerPlayBtn: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,107,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fullscreenPlayerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    paddingHorizontal: 0,
    paddingTop: 0,
    backgroundColor: '#000',
  },
  fullscreenPlayerWrapper: {
    width: '100%',
    height: '100%',
    aspectRatio: undefined as any,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotstarBottomBar: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  hotstarBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seekBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
    gap: 8,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  seekBarTrack: {
    flex: 1,
    height: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  seekBarTrackBackground: {
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  seekBarProgress: {
    height: 2.5,
    backgroundColor: '#FF0000',
    borderRadius: 1.5,
  },
  seekBarThumb: {
    position: 'absolute',
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginLeft: -4,
  },
  bottomLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomControlBtn: {
    padding: 6,
  },
  topLeftKathaTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Roboto-Bold' : 'sans-serif-medium',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  liveStreamLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.4)',
  },
  smallRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
    marginRight: 6,
  },
  liveStreamLabelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeDetails: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 6,
    lineHeight: 25,
    flexWrap: 'wrap',
  },
  guruSubtitle: {
    fontSize: 13.5,
    color: BROWN,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  scheduleText: {
    fontSize: 12.5,
    color: ORANGE,
    fontWeight: '700',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  descriptionBox: {
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#4A3B32',
    lineHeight: 20,
    fontWeight: '400',
  },
  librarySection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
  },
  verticalGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  episodeBoxCard: {
    width: '48%',
    backgroundColor: '#FFFFF0', // Light Yellow tint
    borderRadius: 16,
    padding: 9,
    borderWidth: 1.2,
    borderColor: 'rgba(255,107,0,0.2)', // Light neutral/subtle border by default
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  episodeCardSelected: {
    borderColor: '#7B2CBF', // Vibrant Purple border on selected card
    backgroundColor: '#FFFDEB',
    borderWidth: 2.2,
    elevation: 4,
    shadowColor: '#7B2CBF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  boxEpisodeMeta: {
    marginTop: 8,
  },
  thumbnailBox: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  episodeMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  epHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  epBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE,
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  epDate: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  epTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
    lineHeight: 19,
  },
  epGuru: {
    fontSize: 12,
    color: BROWN,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  filterBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF4ED',
    borderWidth: 1,
    borderColor: '#FFD6C2',
  },
  filterChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A4136',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  chipRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
    marginRight: 5,
  },
  newBadgePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  newBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
