import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Module-level flag to ensure it plays on fresh app open
let hasCelebratedThisSession = false;

// Vibrant festive cracker palette
const CRACKER_COLORS = [
  '#FFD700', // Royal Gold
  '#FF9100', // Saffron / Amber
  '#FF1744', // Ruby Crimson
  '#F50057', // Festive Pink
  '#00E676', // Emerald Green
  '#00E5FF', // Celestial Cyan
  '#E040FB', // Radiant Violet
  '#FFEA00', // Electric Lemon
  '#FFFFFF', // Starlight White
];

const SPARK_SHAPES = ['✦', '★', '✨', '•', '✸'];

interface ParticleConfig {
  id: number;
  angle: number;
  speed: number;
  color: string;
  shape: string;
  size: number;
  gravity: number;
  rotation: number;
}

interface ActiveBurst {
  id: string;
  x: number;
  y: number;
  anim: Animated.Value;
  particles: ParticleConfig[];
  type: 'rocket' | 'flowerpot';
}

interface RocketTrail {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  anim: Animated.Value;
}

export interface DiwaliCrackerOverlayProps {
  /** If true, forces celebration regardless of session state */
  forceShow?: boolean;
}

export const DiwaliCrackerOverlay: React.FC<DiwaliCrackerOverlayProps> = ({
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => forceShow || !hasCelebratedThisSession);
  const [activeBursts, setActiveBursts] = useState<ActiveBurst[]>([]);
  const [rocketTrails, setRocketTrails] = useState<RocketTrail[]>([]);

  const overlayFade = React.useRef(new Animated.Value(1)).current;

  // Safe haptic feedback
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      if (Platform.OS !== 'web') {
        if (style === 'heavy') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (style === 'light') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (_e) {}
  }, []);

  // Spawn particle explosion at (x, y)
  const spawnBurst = useCallback(
    (x: number, y: number, type: 'rocket' | 'flowerpot' = 'rocket') => {
      const burstId = `burst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const particleCount = type === 'flowerpot' ? 36 : 30;

      const particles: ParticleConfig[] = [];
      const baseColor = CRACKER_COLORS[Math.floor(Math.random() * CRACKER_COLORS.length)];
      const secondaryColor = CRACKER_COLORS[Math.floor(Math.random() * CRACKER_COLORS.length)];

      for (let i = 0; i < particleCount; i++) {
        let angle: number;
        let speed: number;
        let gravity = 110;

        if (type === 'flowerpot') {
          angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.7);
          speed = 90 + Math.random() * 160;
          gravity = 150;
        } else {
          angle = (i * 2 * Math.PI) / particleCount + (Math.random() - 0.5) * 0.35;
          speed = 65 + Math.random() * 145;
        }

        particles.push({
          id: i,
          angle,
          speed,
          color: Math.random() > 0.4 ? baseColor : secondaryColor,
          shape: SPARK_SHAPES[Math.floor(Math.random() * SPARK_SHAPES.length)],
          size: 11 + Math.random() * 13,
          gravity,
          rotation: Math.random() * 360,
        });
      }

      const anim = new Animated.Value(0);

      const burst: ActiveBurst = {
        id: burstId,
        x,
        y,
        anim,
        particles,
        type,
      };

      setActiveBursts((prev) => [...prev.slice(-7), burst]);
      triggerHaptic(type === 'rocket' ? 'medium' : 'light');

      Animated.timing(anim, {
        toValue: 1,
        duration: type === 'flowerpot' ? 1400 : 1150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setActiveBursts((prev) => prev.filter((b) => b.id !== burstId));
      });
    },
    [triggerHaptic]
  );

  // Launch rocket ascending towards target
  const launchRocket = useCallback(
    (targetX: number, targetY: number) => {
      const rocketId = `rocket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const startX = targetX + (Math.random() - 0.5) * 40;
      const startY = SCREEN_HEIGHT - 30;

      const anim = new Animated.Value(0);

      const trail: RocketTrail = {
        id: rocketId,
        startX,
        startY,
        targetX,
        targetY,
        anim,
      };

      setRocketTrails((prev) => [...prev.slice(-4), trail]);

      Animated.timing(anim, {
        toValue: 1,
        duration: 520 + Math.random() * 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setRocketTrails((prev) => prev.filter((r) => r.id !== rocketId));
        spawnBurst(targetX, targetY, 'rocket');
      });
    },
    [spawnBurst]
  );

  // Main automatic celebration sequence on load
  useEffect(() => {
    if (!isVisible) return;
    hasCelebratedThisSession = true;

    // 1. Simultaneous rocket launches across the sky on opening
    const t1 = setTimeout(() => {
      launchRocket(SCREEN_WIDTH * 0.25, SCREEN_HEIGHT * 0.22);
    }, 120);

    const t2 = setTimeout(() => {
      launchRocket(SCREEN_WIDTH * 0.75, SCREEN_HEIGHT * 0.2);
    }, 340);

    const t3 = setTimeout(() => {
      launchRocket(SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.16);
      spawnBurst(60, SCREEN_HEIGHT - 170, 'flowerpot');
      spawnBurst(SCREEN_WIDTH - 60, SCREEN_HEIGHT - 170, 'flowerpot');
    }, 600);

    // 2. Follow-up celebratory fireworks cascade in the upper sky
    const t4 = setTimeout(() => {
      launchRocket(SCREEN_WIDTH * 0.2, SCREEN_HEIGHT * 0.28);
      launchRocket(SCREEN_WIDTH * 0.8, SCREEN_HEIGHT * 0.25);
    }, 1600);

    const t5 = setTimeout(() => {
      launchRocket(SCREEN_WIDTH * 0.52, SCREEN_HEIGHT * 0.24);
    }, 2200);

    // 3. Smooth auto-dismiss after ~5 seconds
    const t6 = setTimeout(() => {
      Animated.timing(overlayFade, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setIsVisible(false);
      });
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [isVisible, launchRocket, spawnBurst, overlayFade]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[styles.rootOverlay, { opacity: overlayFade }]}
      pointerEvents="none"
    >
      {/* ROCKET ASCENDING TRAILS (NO BACKGROUND) */}
      {rocketTrails.map((trail) => {
        const translateY = trail.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [trail.startY, trail.targetY],
        });
        const translateX = trail.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [trail.startX, trail.targetX],
        });
        const scale = trail.anim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.6, 1.2, 0.4],
        });
        const opacity = trail.anim.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={trail.id}
            pointerEvents="none"
            style={[
              styles.rocketContainer,
              {
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <View style={styles.rocketHead} />
            <View style={styles.rocketSparkTrail}>
              <View style={[styles.sparkDot, { backgroundColor: '#FFD700', width: 4, height: 4 }]} />
              <View style={[styles.sparkDot, { backgroundColor: '#FF6D00', width: 3, height: 6 }]} />
              <View style={[styles.sparkDot, { backgroundColor: '#FF1744', width: 2, height: 8 }]} />
            </View>
          </Animated.View>
        );
      })}

      {/* ACTIVE CRACKER BURSTS (NO BACKGROUND) */}
      {activeBursts.map((burst) => {
        const flashScale = burst.anim.interpolate({
          inputRange: [0, 0.15, 0.4, 1],
          outputRange: [0.2, 2.8, 1, 0],
        });
        const flashOpacity = burst.anim.interpolate({
          inputRange: [0, 0.1, 0.3, 1],
          outputRange: [0, 0.9, 0.4, 0],
        });

        return (
          <View
            key={burst.id}
            pointerEvents="none"
            style={[styles.burstContainer, { left: burst.x, top: burst.y }]}
          >
            <Animated.View
              style={[
                styles.burstFlash,
                {
                  transform: [{ scale: flashScale }],
                  opacity: flashOpacity,
                },
              ]}
            />

            {burst.particles.map((p) => {
              const rad = p.angle;
              const cos = Math.cos(rad);
              const sin = Math.sin(rad);

              const moveX = burst.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, cos * p.speed],
              });

              const moveY = burst.anim.interpolate({
                inputRange: [0, 0.35, 1],
                outputRange: [0, sin * p.speed * 0.6, sin * p.speed + p.gravity * 0.5],
              });

              const particleScale = burst.anim.interpolate({
                inputRange: [0, 0.2, 0.6, 1],
                outputRange: [0.3, 1.3, 0.9, 0],
              });

              const particleOpacity = burst.anim.interpolate({
                inputRange: [0, 0.1, 0.7, 0.9, 1],
                outputRange: [0, 1, 0.95, 0.5, 0],
              });

              return (
                <Animated.View
                  key={p.id}
                  style={[
                    styles.particleWrapper,
                    {
                      transform: [
                        { translateX: moveX },
                        { translateY: moveY },
                        { scale: particleScale },
                        { rotate: `${p.rotation}deg` },
                      ],
                      opacity: particleOpacity,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.particleGlyph,
                      {
                        color: p.color,
                        fontSize: p.size,
                        textShadowColor: p.color,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 8,
                      },
                    ]}
                  >
                    {p.shape}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rootOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent', // STRICT: No background
    zIndex: 9999,
  },
  rocketContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  rocketHead: {
    width: 6,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    shadowColor: '#FF9100',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  rocketSparkTrail: {
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  sparkDot: {
    borderRadius: 2,
  },
  burstContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  burstFlash: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 235, 150, 0.95)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  particleWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleGlyph: {
    fontWeight: '900',
    textAlign: 'center',
  },
});
