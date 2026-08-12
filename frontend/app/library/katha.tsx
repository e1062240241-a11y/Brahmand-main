import React, { useEffect, useState, useRef } from 'react';
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
  const [status, setStatus] = useState<KathaStatus>({
    is_live: false,
    mode: 'OFF_AIR',
    title: 'Acharya Shamik Pathak Ji — Shravan Katha',
    guru_name: 'Acharya Shamik Pathak Ji',
    banner_message: 'Shravan Katha Daily Uploaded Episodes',
    next_stream_at: '2026-08-13T08:00:00+05:30',
  });

  // Custom Hotstar Minimalist Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekBarWidth, setSeekBarWidth] = useState(1);
  const hideControlsTimer = useRef<any>(null);

  const isUserSelectedOldEpisode = activeEpisode && activeEpisode.id !== status.active_episode_id;
  const activeVideoUrl = isUserSelectedOldEpisode
    ? activeEpisode.video_url
    : (status.active_video_url || '');

  // We want to pause initially if it's live and we haven't synced yet
  const shouldInitialPause = status.is_live && !isUserSelectedOldEpisode && !hasSyncedLive;

  const player = useSafeVideoPlayer(activeVideoUrl, (p) => {
    try {
      p.loop = false;
      p.muted = false;
      if (shouldInitialPause) {
        p.pause();
        setIsPlaying(false);
      } else {
        p.play();
      }
    } catch (_e) {}
  });

  useEffect(() => {
    if (isPlayerValid(player)) {
      // Live Sync Logic
      if (status.is_live && status.server_time_ist && status.current_broadcast_start_time && !hasSyncedLive && !isUserSelectedOldEpisode) {
        // Only attempt to seek if video has loaded its duration and is ready
        if (player.status === 'readyToPlay' || player.status === 'playing') {
          const serverTime = new Date(status.server_time_ist).getTime();
          const startTime = new Date(status.current_broadcast_start_time).getTime();
          // We use absolute seekTo (which is mapped to currentTime on web/expo-video if needed, but seekBy from 0 is also fine)
          const offsetSeconds = Math.max(0, (serverTime - startTime) / 1000);

          if (offsetSeconds > 0) {
            // Initially the video is at 0:00 (paused)
            try {
              if (player.seekTo) {
                player.seekTo(offsetSeconds);
              } else if (player.seekBy) {
                player.seekBy(offsetSeconds);
              } else {
                player.currentTime = offsetSeconds;
              }
            } catch(_e) {}

            setHasSyncedLive(true);
            setIsPlaying(true);
            player.play();
          }
        }
      }
    }
  }, [activeVideoUrl, player, status, player?.status, hasSyncedLive, isUserSelectedOldEpisode]);

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
          }
        }
      } catch (_e) {}
    }, 500);

    return () => clearInterval(interval);
  }, [player]);

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

  const handleSeek = (e: any) => {
    resetControlsTimer();
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
    console.log('[KathaPage] API_BASE_URL =', API_BASE_URL);
    console.log('[KathaPage] Fetching:', `${API_BASE_URL}/api/katha/episodes`);
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
          });
        }
      }

      // 2. Fetch episodes
      console.log('[KathaPage] Fetching episodes from:', `${API_BASE_URL}/api/katha/episodes`);
      const epRes = await fetch(`${API_BASE_URL}/api/katha/episodes`);
      console.log('[KathaPage] Episodes response status:', epRes.status);
      if (epRes.ok) {
        const epJson = await epRes.json();
        console.log('[KathaPage] Episodes received:', JSON.stringify(epJson.episodes?.map((e: any) => ({ id: e.id, title: e.title, video_url: e.video_url }))));
        if (epJson.status === 'success' && Array.isArray(epJson.episodes) && epJson.episodes.length > 0) {
          setEpisodes(epJson.episodes);

          // Select the latest episode (highest episode_number)
          const latestEp = epJson.episodes.reduce((prev: KathaEpisode, current: KathaEpisode) => {
            return (prev.episode_number || 0) > (current.episode_number || 0) ? prev : current;
          });
          setActiveEpisode(latestEp);
          console.log('[KathaPage] setEpisodes called with', epJson.episodes.length, 'episodes');
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

  // Initial fetch
  useEffect(() => {
    fetchKathaData();
  }, []);

  // When screen comes back into focus (e.g. after admin upload),
  // silently refresh the episode list ONLY — do NOT reset active player
  useEffect(() => {
    if (!isFocused) return;
    const refreshEpisodesOnly = async () => {
      try {
        const epRes = await fetch(`${API_BASE_URL}/api/katha/episodes`);
        if (epRes.ok) {
          const epJson = await epRes.json();
          if (epJson.status === 'success' && Array.isArray(epJson.episodes) && epJson.episodes.length > 0) {
            setEpisodes(epJson.episodes);
            // Only update active episode if none is set yet
            setActiveEpisode(prev => {
              if (prev) return prev;
              const latestEp = epJson.episodes.reduce((p: KathaEpisode, c: KathaEpisode) => {
                return (p.episode_number || 0) > (c.episode_number || 0) ? p : c;
              });
              return latestEp;
            });
            console.log('[KathaPage] isFocused refresh: episodes updated:', epJson.episodes.length);
          }
        }
      } catch (_e) {}
    };
    // Delay slightly to avoid running on first mount (initial fetch handles that)
    const t = setTimeout(refreshEpisodesOnly, 300);
    return () => clearTimeout(t);
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchKathaData();
  };

  const handleSelectEpisode = (ep: KathaEpisode) => {
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
        {!status.is_live && !isUserSelectedOldEpisode ? (
          <View style={styles.offAirContainer}>
            <Image
              source={shamikPathakCover}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
              resizeMode="cover"
            />
            <Ionicons name="radio" size={48} color="#FF6B00" />
            <Text style={styles.offAirTitle}>Currently Off-Air</Text>
            <Text style={styles.offAirSub}>
              {status.banner_message}
            </Text>
            <Text style={[styles.offAirSub, { marginTop: 12, color: '#FF6B00', fontWeight: 'bold' }]}>
              Next stream at {status.next_stream_at ? new Date(status.next_stream_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '8:00 AM'}
            </Text>
          </View>
        ) : (
          activeVideoUrl ? (
            <SafeVideoView
              player={player}
              ExpoVideoModule={ExpoVideoModule}
              source={activeVideoUrl}
              posterSource={activeEpisode?.thumbnail_url && !imageErrors[activeEpisode?.id || ''] ? { uri: activeEpisode.thumbnail_url } : shamikPathakCover}
              style={styles.videoPlayer}
              nativeControls={false}
              contentFit="cover"
            />
          ) : (
            <Image source={shamikPathakCover} style={styles.videoPlayer} resizeMode="cover" />
          )
        )}

        {/* Hotstar Minimalist Control Overlay (No Seeking Bar, Clean Transparent Look) */}
        {showControls && (status.is_live || isUserSelectedOldEpisode) && (
          <Pressable style={styles.hotstarOverlay} onPress={toggleShowHideControls}>
            {/* Top Badge Info & Landscape Back Button */}
            <View style={styles.hotstarTopRow} pointerEvents="box-none">
              {isModal ? (
                <TouchableOpacity style={styles.landscapeBackBtn} onPress={toggleRotation}>
                  <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 1 }} />
              )}

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
            </View>

            {/* Center Big Play/Pause Button */}
            <TouchableOpacity
              style={styles.centerPlayBtn}
              activeOpacity={0.8}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={32}
                color="#FFF"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            {/* Bottom Control Bar */}
            <View style={styles.hotstarBottomBar} pointerEvents="box-none">
              {/* Seek Bar & Progress Display for Recorded / Off-Air Episodes */}
              {(!status.is_live || isUserSelectedOldEpisode) && duration > 0 && (
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

                {/* Katha Video Label */}
                <View style={styles.liveStreamLabelWrap}>
                  <Ionicons name="play-circle-outline" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.liveStreamLabelText}>
                    {activeEpisode ? `DAY ${activeEpisode.episode_number} • KATHA VIDEO` : 'KATHA VIDEO'}
                  </Text>
                </View>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1B1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shravan Katha</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
        }
      >
        {/* Main Player & Hotstar Custom Minimalist Controls */}
        <View style={styles.playerContainer}>
          {renderPlayerContent(false)}
        </View>

          {/* Active Episode Details */}
          <View style={styles.activeDetails}>
            <Text style={styles.activeTitle}>
              {isUserSelectedOldEpisode ? activeEpisode?.title : status.title}
            </Text>
            <Text style={styles.guruSubtitle}>
              {isUserSelectedOldEpisode ? activeEpisode?.guru_name : status.guru_name} • Spiritual Guru & Astrologer
            </Text>
            <Text style={styles.scheduleText}>
              {isUserSelectedOldEpisode ? 'Library Episode' : status.banner_message}
            </Text>
          </View>

        {/* Episode Library Section (Only shown when Off-Air) */}
        {!status.is_live && (
          <View style={styles.librarySection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="movie-play-outline" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Shravan Katha Episodes</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 30 }} />
          ) : episodes.length > 0 ? (
            episodes.map((ep) => {
              const isSelected = activeEpisode?.id === ep.id;
              return (
                <TouchableOpacity
                  key={ep.id}
                  style={[styles.episodeCard, isSelected && styles.episodeCardSelected]}
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
                    <View style={styles.playOverlay}>
                      <Ionicons
                        name={isSelected && isPlaying ? "pause" : "play"}
                        size={20}
                        color="#FFF"
                      />
                    </View>
                    <View style={styles.durationTag}>
                      <Text style={styles.durationText}>{ep.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.episodeMeta}>
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
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No episodes uploaded yet. Check back during live broadcast!</Text>
            </View>
          )}
          </View>
        )}
      </ScrollView>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
  },
  playerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  playerWrapper: {
    width: '100%',
    height: 220,
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
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    borderRadius: 0,
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
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  seekBarProgress: {
    height: 4,
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    marginLeft: -5,
  },
  bottomLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomControlBtn: {
    padding: 6,
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
    paddingHorizontal: 4,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
    lineHeight: 24,
  },
  guruSubtitle: {
    fontSize: 13,
    color: BROWN,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: ORANGE,
    fontWeight: '700',
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
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F3',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.15)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  episodeCardSelected: {
    borderColor: ORANGE,
    backgroundColor: '#FFF0E5',
    borderWidth: 1.5,
  },
  thumbnailBox: {
    width: 120,
    height: 80,
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
});
