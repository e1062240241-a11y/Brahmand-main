import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useKathaPlayerStore } from '../../store/kathaPlayerStore';

const shamikPathakCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/shamik_pathak_ji.webp' };
const MINI_BARS_COUNT = 5;

export const GlobalKathaFloatingPlayer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const activeEpisode = useKathaPlayerStore((state) => state.activeEpisode);
  const isPlaying = useKathaPlayerStore((state) => state.isPlaying);
  const togglePlayPause = useKathaPlayerStore((state) => state.togglePlayPause);
  const stop = useKathaPlayerStore((state) => state.stop);

  // If no episode is playing or user is already on the full Katha screen, don't show floating bar
  const isInsideKathaScreen = pathname?.includes('/library/katha') || pathname === 'library/katha';

  // Check if current route is one of the main tab screens
  const isTabScreen =
    !pathname ||
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname.includes('/(tabs)') ||
    pathname.includes('/home') ||
    pathname.includes('/messages') ||
    pathname.includes('/vendor') ||
    pathname.includes('/jaap') ||
    pathname.includes('/profile');

  // Mini live equalizer animation bars
  const miniBars = useRef(
    Array.from({ length: MINI_BARS_COUNT }, () => new Animated.Value(4))
  ).current;

  useEffect(() => {
    if (!isPlaying) {
      miniBars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 4,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    let isSubscribed = true;
    const animateMiniBars = () => {
      if (!isSubscribed) return;

      const animations = miniBars.map((bar) => {
        const targetHeight = 4 + Math.random() * 16;
        const duration = 160 + Math.random() * 140;
        return Animated.timing(bar, {
          toValue: targetHeight,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start(() => {
        if (isSubscribed) {
          animateMiniBars();
        }
      });
    };

    animateMiniBars();
    return () => {
      isSubscribed = false;
    };
  }, [isPlaying, miniBars]);

  // Pulsing glow around avatar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (isPlaying) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    return () => anim?.stop();
  }, [isPlaying, pulseAnim]);

  if (!activeEpisode || isInsideKathaScreen) {
    return null;
  }

  const bottomOffset = isTabScreen
    ? Math.max(82, (insets.bottom || 0) + 76)
    : Math.max(16, (insets.bottom || 0) + 12);

  const handleOpenFullKatha = () => {
    router.push('/library/katha');
  };

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={handleOpenFullKatha}
        activeOpacity={0.92}
      >
        <LinearGradient
          colors={['#241208', '#140803']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Glowing Avatar */}
          <View style={styles.avatarSection}>
            <Animated.View
              style={[
                styles.avatarGlowRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isPlaying ? 0.7 : 0.2,
                },
              ]}
            />
            <Image
              source={
                activeEpisode.thumbnail_url
                  ? { uri: activeEpisode.thumbnail_url }
                  : shamikPathakCover
              }
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          {/* Mini Visualizer Equalizer */}
          <View style={styles.equalizerContainer}>
            {miniBars.map((barAnim, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.miniBar,
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

          {/* Episode Info */}
          <View style={styles.infoSection}>
            <Text style={styles.titleText} numberOfLines={1}>
              {activeEpisode.episode_number ? `Day ${activeEpisode.episode_number}: ` : ''}
              {activeEpisode.title || 'श्रावण कथा'}
            </Text>
            <Text style={styles.subtitleText} numberOfLines={1}>
              {activeEpisode.guru_name || 'आचार्य शमिक पाठक जी'} • श्रवण जारी
            </Text>
          </View>

          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color="#FFD54F"
            />
          </TouchableOpacity>

          {/* Close/Stop Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={(e) => {
              e.stopPropagation();
              stop();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color="#FFB300" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cardTouchable: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 179, 0, 0.4)',
    gap: 10,
  },
  avatarSection: {
    width: 42,
    height: 42,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8F00',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    gap: 2.5,
    justifyContent: 'center',
  },
  miniBar: {
    width: 3,
    borderRadius: 1.5,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFF8E1',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitleText: {
    color: '#FFB300',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
