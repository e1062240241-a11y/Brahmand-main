import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useKathaPlayerStore, KathaEpisode } from '../../store/kathaPlayerStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const shamikPathakCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/shamik_pathak_ji.webp' };

const BAR_COUNT = 24;

interface KathaVisualizerViewProps {
  episode: KathaEpisode | null;
  onSwitchToVideo: () => void;
}

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

export const KathaVisualizerView: React.FC<KathaVisualizerViewProps> = ({
  episode,
  onSwitchToVideo,
}) => {
  const isPlaying = useKathaPlayerStore((state) => state.isPlaying);
  const currentTime = useKathaPlayerStore((state) => state.currentTime);
  const duration = useKathaPlayerStore((state) => state.duration);
  const playbackRate = useKathaPlayerStore((state) => state.playbackRate);
  const togglePlayPause = useKathaPlayerStore((state) => state.togglePlayPause);
  const seekBy = useKathaPlayerStore((state) => state.seekBy);
  const seekTo = useKathaPlayerStore((state) => state.seekTo);
  const setPlaybackRate = useKathaPlayerStore((state) => state.setPlaybackRate);

  const [trackWidth, setTrackWidth] = useState(SCREEN_WIDTH - 64);

  // Rotation animation for the sacred mandala ring
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Breathing aura animation (Diya flame pulsation)
  const auraPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (isPlaying) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(auraPulse, {
            toValue: 1.18,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(auraPulse, {
            toValue: 0.94,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      Animated.timing(auraPulse, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    return () => anim?.stop();
  }, [isPlaying, auraPulse]);

  // Dynamic Audio Visualizer Soundwave Bars
  const barHeights = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(12))
  ).current;

  useEffect(() => {
    if (!isPlaying) {
      // Return bars to resting harmonic curve
      barHeights.forEach((bar, index) => {
        const mid = BAR_COUNT / 2;
        const dist = Math.abs(index - mid);
        const restingHeight = Math.max(8, 22 - dist * 1.2);
        Animated.timing(bar, {
          toValue: restingHeight,
          duration: 350,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    let isSubscribed = true;
    const animateBars = () => {
      if (!isSubscribed) return;

      const animations = barHeights.map((bar, i) => {
        const factor = Math.sin((i / BAR_COUNT) * Math.PI);
        const minHeight = 8 + factor * 6;
        const maxHeight = 28 + Math.random() * 32 * (0.6 + factor * 0.4);
        const targetHeight = Math.random() > 0.4 ? maxHeight : minHeight;
        const durationMs = 180 + Math.floor(Math.random() * 160);

        return Animated.timing(bar, {
          toValue: targetHeight,
          duration: durationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start(() => {
        if (isSubscribed) {
          animateBars();
        }
      });
    };

    animateBars();
    return () => {
      isSubscribed = false;
    };
  }, [isPlaying, barHeights]);

  // Progress Seek Handler
  const handleSeekPress = useCallback(
    (e: any) => {
      if (duration <= 0 || trackWidth <= 0) return;
      const clickX = e.nativeEvent.locationX;
      const percentage = Math.max(0, Math.min(1, clickX / trackWidth));
      const targetSeconds = percentage * duration;
      seekTo(targetSeconds);
    },
    [duration, trackWidth, seekTo]
  );

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  // Toggle speed cycle (1x -> 1.25x -> 1.5x -> 2x)
  const cycleSpeed = useCallback(() => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIndex]);
  }, [playbackRate, setPlaybackRate]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2A1104', '#170802', '#0C0301']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header Mode Toggle */}
      <View style={styles.topToolbar}>
        <View style={styles.liveListeningTag}>
          <View style={[styles.liveDot, { backgroundColor: isPlaying ? '#00E676' : '#FFB300' }]} />
          <Text style={styles.liveListeningText}>
            {isPlaying ? 'श्रवण जारी है' : 'विराम'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.switchModeButton}
          onPress={onSwitchToVideo}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam-outline" size={16} color="#FFD54F" />
          <Text style={styles.switchModeText}>वीडियो देखें</Text>
        </TouchableOpacity>
      </View>

      {/* Central Visualizer Section */}
      <View style={styles.visualizerCenter}>
        {/* Sacred Aura Halo */}
        <Animated.View
          style={[
            styles.sacredAura,
            {
              transform: [{ scale: auraPulse }],
              opacity: isPlaying ? 0.85 : 0.45,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 140, 0, 0.55)', 'rgba(255, 193, 7, 0.25)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        {/* Rotating Sacred Mandala Sunburst Ring */}
        <Animated.View
          style={[
            styles.mandalaRing,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.mandalaInnerDashes} />
        </Animated.View>

        {/* Central Album Artwork */}
        <View style={styles.artworkContainer}>
          <Image
            source={episode?.thumbnail_url ? { uri: episode.thumbnail_url } : shamikPathakCover}
            style={styles.artworkImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
            style={styles.artworkGradient}
          />
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>
              {episode?.episode_number ? `DAY ${episode.episode_number}` : 'कथा'}
            </Text>
          </View>
        </View>

        {/* Dynamic Equalizer Waveform Soundwave Bars */}
        <View style={styles.equalizerRow}>
          {barHeights.map((barAnim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.equalizerBar,
                {
                  height: barAnim,
                  backgroundColor: isPlaying
                    ? idx % 2 === 0
                      ? '#FFA000'
                      : '#FFD54F'
                    : 'rgba(255, 179, 0, 0.4)',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Katha Episode Meta Information */}
      <View style={styles.metaSection}>
        <Text style={styles.episodeTitle} numberOfLines={2}>
          {episode?.title || 'श्रावण शिव महापुराण कथा'}
        </Text>
        <Text style={styles.guruSubtitle} numberOfLines={1}>
          {episode?.guru_name || 'परम पूज्य आचार्य शमिक पाठक जी महाराज'} • अध्यात्म रसपान
        </Text>
      </View>

      {/* Progress & Seekbar */}
      <View style={styles.progressSection}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
        </View>

        <Pressable
          style={styles.trackContainer}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          onPress={handleSeekPress}
        >
          <View style={styles.trackBackground}>
            <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={[styles.trackThumb, { left: `${progressPercent}%` }]} />
        </Pressable>
      </View>

      {/* Devotional Controls Dock */}
      <View style={styles.controlsDock}>
        <TouchableOpacity
          style={styles.secondaryControlBtn}
          onPress={cycleSpeed}
          activeOpacity={0.7}
        >
          <Text style={styles.speedText}>{playbackRate}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => seekBy(-10)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="rewind-10" size={30} color="#FFD54F" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseBtn}
          onPress={togglePlayPause}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00', '#E65100']}
            style={styles.playGradient}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={34}
              color="#FFFFFF"
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => seekBy(10)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="fast-forward-10" size={30} color="#FFD54F" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryControlBtn}
          onPress={() => seekTo(0)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="restart" size={24} color="#FFD54F" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#170802',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 179, 0, 0.25)',
    elevation: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    marginBottom: 16,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveListeningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveListeningText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.4)',
    gap: 6,
  },
  switchModeText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '700',
  },
  visualizerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    position: 'relative',
    marginVertical: 4,
  },
  sacredAura: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
  },
  mandalaRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 64, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mandalaInnerDashes: {
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  artworkContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFD54F',
    position: 'relative',
    elevation: 10,
    shadowColor: '#FF8F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  dayBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: '#FF6F00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  equalizerRow: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    height: 60,
  },
  equalizerBar: {
    width: 4,
    borderRadius: 3,
  },
  metaSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  episodeTitle: {
    color: '#FFF8E1',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  guruSubtitle: {
    color: '#FFB300',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressSection: {
    width: '100%',
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeLabel: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '600',
  },
  trackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#FFB300',
    borderRadius: 3,
  },
  trackThumb: {
    position: 'absolute',
    top: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    borderWidth: 2.5,
    borderColor: '#FF8F00',
    marginLeft: -7,
    elevation: 4,
  },
  controlsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  secondaryControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '800',
  },
  skipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  playGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
