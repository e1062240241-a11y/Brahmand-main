/**
 * File: frontend/src/components/StoryAudioPlayer.tsx
 *
 * Dual-Track Audio Player for Brahmand Library - Cosmic Storyteller Mode ("मैं समय हूँ").
 *
 * Full Cross-Platform Support for Android, iOS, and Expo Web:
 * - Uses `expo-audio` (useAudioPlayer / useAudioPlayerStatus) on native and web.
 * - Synced manifest timing cues for spoken highlight illumination.
 * - Tanpura ambient drone toggle and volume adjustment.
 * - Haptic feedback on cue transitions via `expo-haptics`.
 * - Graceful fallback toast to classical mode if audio is unavailable.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { StoryScene, TimingCue, TimingManifest } from '../types/gitaStory';
import { useStoryStore } from '../store/useStoryStore';
import { api } from '../services/api';

interface StoryAudioPlayerProps {
  chapter: number;
  scene: StoryScene;
  onSceneComplete?: () => void;
  onCueActive?: (mark: string | null, activeSceneId?: string | null) => void;
  onClose?: () => void;
  autoPlay?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const StoryAudioPlayer: React.FC<StoryAudioPlayerProps> = ({
  chapter,
  scene,
  onSceneComplete,
  onCueActive,
  onClose,
  autoPlay = false,
}) => {
  const {
    isTanpuraEnabled,
    toggleTanpura,
    setIsPlaying,
    setCurrentPlayingSceneId,
    setViewMode,
  } = useStoryStore();

  const [cues, setCues] = useState<TimingCue[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAudioUnavailable, setIsAudioUnavailable] = useState<boolean>(false);
  const lastReportedMarkRef = useRef<string | null>(null);

  // Audio endpoint URL
  const backendBase = api?.defaults?.baseURL || '';
  const audioEndpoint = `${backendBase}/library/bhagavad-gita/story-audio/${chapter}/${scene.scene_id}`;

  const audioPlayer = useAudioPlayer(audioEndpoint);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const isPlayingLocal = Boolean(playerStatus?.playing);
  const currentTime = playerStatus?.currentTime ?? 0;
  const duration = playerStatus?.duration && playerStatus.duration > 0
    ? playerStatus.duration
    : (scene.duration_seconds_est || 60);

  // Configure Audio Mode once
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => {});
  }, []);

  // Sync state to Zustand
  useEffect(() => {
    setIsPlaying(isPlayingLocal);
    if (isPlayingLocal) {
      setCurrentPlayingSceneId(scene.scene_id);
    }
  }, [isPlayingLocal, scene.scene_id, setIsPlaying, setCurrentPlayingSceneId]);

  // Fetch timing manifest from X-Timing-Manifest header
  useEffect(() => {
    let isCancelled = false;

    async function fetchManifest() {
      try {
        const response = await fetch(audioEndpoint, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
        });

        if (isCancelled) return;

        if (response.status === 404 || !response.ok) {
          setIsAudioUnavailable(true);
          setErrorMsg('कथा ऑडियो लोड नहीं हो पाया। शास्त्रीय पाठ देखें?');
          return;
        }

        const rawManifestHeader =
          response.headers.get('x-timing-manifest') ||
          response.headers.get('X-Timing-Manifest');

        if (rawManifestHeader) {
          try {
            const decodedJson = decodeURIComponent(rawManifestHeader);
            const manifest: TimingManifest = JSON.parse(decodedJson);
            if (manifest && Array.isArray(manifest.cues)) {
              setCues(manifest.cues);
            }
          } catch (e) {
            console.warn('[StoryAudioPlayer] Manifest parse warning:', e);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[StoryAudioPlayer] Probe error:', err);
        }
      }
    }

    fetchManifest();
    return () => {
      isCancelled = true;
    };
  }, [audioEndpoint]);

  // Derive active cue from current time
  const activeCue = useMemo(() => {
    const currentMs = Math.floor(currentTime * 1000);
    return cues.find(
      (cue) => currentMs >= cue.start_ms && currentMs < cue.end_ms
    ) || null;
  }, [currentTime, cues]);

  const currentMark = activeCue ? activeCue.mark : null;
  const currentSceneId = activeCue?.scene_id || null;

  // Report mark change and trigger haptic pulse
  useEffect(() => {
    if (currentMark !== lastReportedMarkRef.current) {
      lastReportedMarkRef.current = currentMark;
      if (onCueActive) {
        onCueActive(currentMark, currentSceneId);
      }
      if (currentMark) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
  }, [currentMark, currentSceneId, onCueActive]);

  // Handle play completion
  useEffect(() => {
    if (playerStatus?.didJustFinish) {
      setIsPlaying(false);
      setCurrentPlayingSceneId(null);
      if (onCueActive) onCueActive(null);
      if (onSceneComplete) onSceneComplete();
    }
  }, [playerStatus?.didJustFinish, onSceneComplete, onCueActive, setIsPlaying, setCurrentPlayingSceneId]);

  // Cleanup on unmount or scene change
  useEffect(() => {
    return () => {
      try {
        audioPlayer?.pause();
      } catch {}
      setIsPlaying(false);
      setCurrentPlayingSceneId(null);
    };
  }, [audioPlayer, setIsPlaying, setCurrentPlayingSceneId]);

  // Autoplay handler
  useEffect(() => {
    if (autoPlay && audioPlayer && !isPlayingLocal) {
      audioPlayer.play();
    }
  }, [autoPlay, audioPlayer, isPlayingLocal]);

  const handleTogglePlay = useCallback(() => {
    if (!audioPlayer) return;
    Haptics.selectionAsync().catch(() => {});

    try {
      if (isPlayingLocal) {
        audioPlayer.pause();
        setIsPlaying(false);
      } else {
        audioPlayer.play();
        setIsPlaying(true);
      }
    } catch {
      setErrorMsg('कथा ऑडियो लोड नहीं हो पाया। शास्त्रीय पाठ देखें?');
      setIsAudioUnavailable(true);
    }
  }, [audioPlayer, isPlayingLocal, setIsPlaying]);

  const handleStopAndClose = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    try {
      audioPlayer?.pause();
    } catch {}
    setIsPlaying(false);
    setCurrentPlayingSceneId(null);
    if (onCueActive) onCueActive(null);
    if (onClose) {
      onClose();
    }
  }, [audioPlayer, setIsPlaying, setCurrentPlayingSceneId, onCueActive, onClose]);

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.playerCard}>
        {/* Top Info Bar */}
        <View style={styles.topInfoRow}>
          <View style={styles.sceneTitleGroup}>
            <View style={styles.pulsingDot} />
            <Text style={styles.sceneTitleText} numberOfLines={1}>
              प्रसंग {scene.seq}: {scene.title_hi}
            </Text>
            <Text style={styles.verseRangeText}>({scene.display_range})</Text>
          </View>

          <View style={styles.topRightActions}>
            {/* Tanpura Ambient Toggle */}
            <TouchableOpacity
              style={[
                styles.tanpuraToggleBtn,
                isTanpuraEnabled && styles.tanpuraToggleBtnActive,
              ]}
              onPress={toggleTanpura}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12 }}>🪕</Text>
              <Text
                style={[
                  styles.tanpuraToggleText,
                  isTanpuraEnabled && styles.tanpuraToggleTextActive,
                ]}
              >
                {isTanpuraEnabled ? 'तानपूरा' : 'तानपूरा बंद'}
              </Text>
            </TouchableOpacity>

            {/* Close / Stop Button */}
            <TouchableOpacity
              style={styles.closePlayerBtn}
              onPress={handleStopAndClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={17} color="#FDE68A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fallback & Recovery Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>ℹ️ {errorMsg}</Text>
            {isAudioUnavailable && (
              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => setViewMode('classical')}
              >
                <Text style={styles.switchModeBtnText}>शास्त्रीय पाठ देखें</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Controls Row */}
        <View style={styles.controlsRow}>
          {/* Main Play / Pause Button */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={handleTogglePlay}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isPlayingLocal ? 'pause' : 'play'}
              size={22}
              color="#140E0C"
              style={!isPlayingLocal ? { marginLeft: 2 } : undefined}
            />
          </TouchableOpacity>

          {/* Timeline Progress */}
          <View style={styles.timelineContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      100,
                      Math.max(0, (currentTime / (duration || 1)) * 100)
                    )}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.timeLabelRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 99,
  },
  playerCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(20, 14, 12, 0.96)',
    borderColor: '#B45309',
    borderWidth: 1.2,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sceneTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    marginRight: 8,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  sceneTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FDE68A',
    flexShrink: 1,
  },
  verseRangeText: {
    fontSize: 11,
    color: '#A8A29E',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tanpuraToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#261C14',
    borderColor: '#442817',
    borderWidth: 1,
  },
  tanpuraToggleBtnActive: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  tanpuraToggleText: {
    fontSize: 11,
    color: '#D6D3D1',
  },
  tanpuraToggleTextActive: {
    color: '#FEF3C7',
    fontWeight: 'bold',
  },
  closePlayerBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  errorBanner: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 53, 15, 0.4)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 11,
    color: '#FEF3C7',
    flex: 1,
    marginRight: 6,
  },
  switchModeBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  switchModeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#140E0C',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineContainer: {
    flex: 1,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  timeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#A8A29E',
    fontVariant: ['tabular-nums'],
  },
});
