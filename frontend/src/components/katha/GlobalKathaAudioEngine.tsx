import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useKathaPlayerStore } from '../../store/kathaPlayerStore';

/**
 * Headless Global Audio Engine for Katha Sangrah.
 * Manages background & cross-screen audio streaming for continuous listening.
 */
export const GlobalKathaAudioEngine: React.FC = () => {
  const pathname = usePathname();
  const activeEpisode = useKathaPlayerStore((state) => state.activeEpisode);
  const isPlaying = useKathaPlayerStore((state) => state.isPlaying);
  const isListenMode = useKathaPlayerStore((state) => state.isListenMode);
  const playbackRate = useKathaPlayerStore((state) => state.playbackRate);
  const requestSeek = useKathaPlayerStore((state) => state.requestSeek);
  const clearRequestSeek = useKathaPlayerStore((state) => state.clearRequestSeek);
  const setTime = useKathaPlayerStore((state) => state.setTime);
  const pause = useKathaPlayerStore((state) => state.pause);

  // Determine if user is currently watching video inside the Katha screen
  const isInsideKathaScreen = pathname?.includes('/library/katha') || pathname === 'library/katha';
  const shouldAudioPlay = Boolean(
    activeEpisode?.video_url &&
    isPlaying &&
    (isListenMode || !isInsideKathaScreen)
  );

  const audioSource = activeEpisode?.video_url ? activeEpisode.video_url : null;
  const audioPlayer = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(audioPlayer);

  // Set audio mode for smooth background/cross-tab listening
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      }).catch(() => {});
    }
  }, []);

  // Sync playback command (play / pause)
  useEffect(() => {
    if (!audioPlayer) return;

    try {
      if (shouldAudioPlay) {
        if (!status?.playing) {
          audioPlayer.play();
        }
      } else {
        if (status?.playing) {
          audioPlayer.pause();
        }
      }
    } catch (_e) {}
  }, [audioPlayer, shouldAudioPlay, status?.playing]);

  // Handle seek requests from user actions (seekbar, -10s, +10s)
  useEffect(() => {
    if (!audioPlayer || requestSeek === null) return;

    try {
      if (typeof audioPlayer.seekTo === 'function') {
        audioPlayer.seekTo(requestSeek);
      } else if ('currentTime' in audioPlayer) {
        (audioPlayer as any).currentTime = requestSeek;
      }
    } catch (_e) {}

    clearRequestSeek();
  }, [audioPlayer, requestSeek, clearRequestSeek]);

  // Handle playback rate adjustment (1x, 1.25x, 1.5x)
  useEffect(() => {
    if (!audioPlayer) return;
    try {
      if (typeof (audioPlayer as any).setPlaybackRate === 'function') {
        (audioPlayer as any).setPlaybackRate(playbackRate);
      } else if ('playbackRate' in audioPlayer) {
        (audioPlayer as any).playbackRate = playbackRate;
      }
    } catch (_e) {}
  }, [audioPlayer, playbackRate]);

  // Sync elapsed time and duration back to global store
  const lastSyncRef = useRef<number>(0);
  useEffect(() => {
    if (!status) return;

    const currentSecs = typeof status.currentTime === 'number' ? status.currentTime : 0;
    const durationSecs = typeof status.duration === 'number' ? status.duration : 0;

    const now = Date.now();
    if (now - lastSyncRef.current > 300) {
      lastSyncRef.current = now;
      setTime(currentSecs, durationSecs);
    }

    if (status.didJustFinish) {
      pause();
    }
  }, [status, setTime, pause]);

  return null;
};
