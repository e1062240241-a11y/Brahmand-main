import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  InteractionManager,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
  useReducedMotion,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FestivalData } from '../../types/festival';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EMBLEM_SIZE = 130;
const HEADER_EMBLEM_SIZE = 50;

// Module-level session memory to prevent replaying during the same app session
const playedFestivalSessions = new Set<string>();

export const hasPlayedFestivalIntro = (festivalId: string): boolean => {
  return playedFestivalSessions.has(festivalId);
};

export const markFestivalIntroPlayed = (festivalId: string): void => {
  playedFestivalSessions.add(festivalId);
};

export const resetFestivalIntroSession = (festivalId?: string): void => {
  if (festivalId) {
    playedFestivalSessions.delete(festivalId);
  } else {
    playedFestivalSessions.clear();
  }
};

export interface FestivalOpeningOverlayProps {
  festival: FestivalData;
  onAnimationComplete?: () => void;
  onHandoffStart?: () => void;
  forcePlay?: boolean;
}

export const FestivalOpeningOverlay: React.FC<FestivalOpeningOverlayProps> = ({
  festival,
  onAnimationComplete,
  onHandoffStart,
  forcePlay = false,
}) => {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState<boolean>(
    typeof festival.emblem === 'number' || !festival.emblem
  );
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(true);
  const isSkippedRef = useRef(false);

  // Target values for handoff to header position
  const headerTop = insets.top + 16;
  const targetHeaderY = -(SCREEN_HEIGHT / 2 - headerTop - HEADER_EMBLEM_SIZE / 2);
  const targetHeaderScale = HEADER_EMBLEM_SIZE / EMBLEM_SIZE;

  // Shared Animation Values (All on UI thread)
  const emblemScale = useSharedValue(0.5);
  const emblemTranslateY = useSharedValue(0);
  const emblemOpacity = useSharedValue(0);
  
  const shimmerTranslateX = useSharedValue(-EMBLEM_SIZE * 1.5);
  const shimmerOpacity = useSharedValue(0);

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(24);

  const bgOverlayOpacity = useSharedValue(1);
  const bgHeaderMorph = useSharedValue(0); // 0 = full screen, 1 = header bounds

  // Safe callback completion handlers
  const handleFinish = useCallback(() => {
    markFestivalIntroPlayed(festival.id);
    setIsOverlayVisible(false);
    onAnimationComplete?.();
  }, [festival.id, onAnimationComplete]);

  const handleNotifyHandoff = useCallback(() => {
    onHandoffStart?.();
  }, [onHandoffStart]);

  // Skip animation function (instant fast-forward to final state on user tap)
  const skipAnimation = useCallback(() => {
    if (isSkippedRef.current) return;
    isSkippedRef.current = true;

    // Cancel any running animations
    cancelAnimation(emblemScale);
    cancelAnimation(emblemTranslateY);
    cancelAnimation(emblemOpacity);
    cancelAnimation(shimmerTranslateX);
    cancelAnimation(shimmerOpacity);
    cancelAnimation(titleOpacity);
    cancelAnimation(titleTranslateY);
    cancelAnimation(bgOverlayOpacity);
    cancelAnimation(bgHeaderMorph);

    // Fast-forward directly to final state
    emblemScale.value = targetHeaderScale;
    emblemTranslateY.value = targetHeaderY;
    emblemOpacity.value = 1;
    shimmerOpacity.value = 0;
    titleOpacity.value = 0;
    bgOverlayOpacity.value = 0;
    bgHeaderMorph.value = 1;

    handleNotifyHandoff();
    handleFinish();
  }, [
    emblemScale,
    emblemTranslateY,
    emblemOpacity,
    shimmerTranslateX,
    shimmerOpacity,
    titleOpacity,
    titleTranslateY,
    bgOverlayOpacity,
    bgHeaderMorph,
    targetHeaderScale,
    targetHeaderY,
    handleNotifyHandoff,
    handleFinish,
  ]);

  // Orchestrate the Google Gemini-style opening sequence
  const startAnimationSequence = useCallback(() => {
    if (isSkippedRef.current) return;

    // Accessibility rule: Render final state instantly if reduced motion is enabled
    if (reducedMotion) {
      skipAnimation();
      return;
    }

    // PHASE 1: The Hero Bloom (0s → 0.7s)
    // 1. Centered emblem springs in (scale 0.5 -> 1.0) with custom spring physics
    emblemOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
    emblemScale.value = withSequence(
      withSpring(1.0, {
        stiffness: 120,
        damping: 14,
        mass: 1,
      }),
      // Heartbeat pulse at ~0.55s (1.0 -> 1.06 -> 1.0)
      withDelay(
        150,
        withSequence(
          withTiming(1.06, { duration: 140, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 140, easing: Easing.out(Easing.quad) })
        )
      )
    );

    // 2. Shimmer sweep: sweeps left-to-right across the emblem frame exactly once
    shimmerOpacity.value = withSequence(
      withDelay(180, withTiming(1, { duration: 150 })),
      withDelay(400, withTiming(0, { duration: 180 }))
    );
    shimmerTranslateX.value = withDelay(
      150,
      withTiming(EMBLEM_SIZE * 1.5, {
        duration: 520,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // 3. Festival names fade in below emblem
    titleOpacity.value = withDelay(
      220,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
    titleTranslateY.value = withDelay(
      220,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) })
    );

    // PHASE 2: The Handoff (0.7s → 1.4s)
    const HANDOFF_DELAY = 720;
    const HANDOFF_DURATION = 480;

    // Trigger parent content cascade initiation
    // Smoothly shrink & glide upward to become the page's header emblem
    emblemScale.value = withDelay(
      HANDOFF_DELAY,
      withTiming(targetHeaderScale, {
        duration: HANDOFF_DURATION,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      })
    );

    emblemTranslateY.value = withDelay(
      HANDOFF_DELAY,
      withTiming(targetHeaderY, {
        duration: HANDOFF_DURATION,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      })
    );

    // Fade out centered title as emblem glides to header
    titleOpacity.value = withDelay(
      HANDOFF_DELAY,
      withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) })
    );

    // Full-screen gradient settles into header region, revealing the page body
    bgHeaderMorph.value = withDelay(
      HANDOFF_DELAY,
      withTiming(1, {
        duration: HANDOFF_DURATION,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      })
    );

    bgOverlayOpacity.value = withDelay(
      HANDOFF_DELAY + 100,
      withTiming(0, {
        duration: HANDOFF_DURATION - 100,
        easing: Easing.out(Easing.quad),
      }, (isFinished) => {
        if (isFinished) {
          runOnJS(handleFinish)();
        }
      })
    );

    // Notify parent to start content card stagger cascade
    setTimeout(() => {
      if (!isSkippedRef.current) {
        handleNotifyHandoff();
      }
    }, HANDOFF_DELAY);
  }, [
    reducedMotion,
    skipAnimation,
    emblemOpacity,
    emblemScale,
    shimmerOpacity,
    shimmerTranslateX,
    titleOpacity,
    titleTranslateY,
    targetHeaderScale,
    targetHeaderY,
    bgHeaderMorph,
    bgOverlayOpacity,
    handleNotifyHandoff,
    handleFinish,
  ]);

  // Trigger sequence after screen transition finishes
  useEffect(() => {
    // Check session playback deduplication rule
    if (!forcePlay && hasPlayedFestivalIntro(festival.id)) {
      setIsOverlayVisible(false);
      onHandoffStart?.();
      onAnimationComplete?.();
      return;
    }

    // Wait for screen navigation transition to complete (prevents frame drops)
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      // Small safety delay (50ms) to ensure layout mounts cleanly
      const timer = setTimeout(() => {
        startAnimationSequence();
      }, 50);

      return () => clearTimeout(timer);
    });

    return () => {
      interactionPromise.cancel();
    };
  }, [festival.id, forcePlay, startAnimationSequence, onHandoffStart, onAnimationComplete]);

  // Dynamic colors with fallback
  const colors: [string, string, string] = festival.gradientColors && festival.gradientColors.length === 3
    ? festival.gradientColors
    : ['#FF6600', '#E53935', '#8E24AA'];

  // Animated Styles (Must remain unconditional for React Hook consistency)
  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      opacity: bgOverlayOpacity.value,
    };
  });

  const animatedEmblemStyle = useAnimatedStyle(() => {
    return {
      opacity: emblemOpacity.value,
      transform: [
        { translateY: emblemTranslateY.value },
        { scale: emblemScale.value },
      ],
    };
  });

  const animatedShimmerStyle = useAnimatedStyle(() => {
    return {
      opacity: shimmerOpacity.value,
      transform: [{ translateX: shimmerTranslateX.value }],
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    };
  });

  const isRemoteImage = typeof festival.emblem === 'string' && festival.emblem.startsWith('http');

  if (!isOverlayVisible) {
    return null;
  }

  return (
    <Pressable
      style={StyleSheet.absoluteFillObject}
      onPress={skipAnimation}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Skip opening animation for ${festival.name}`}
      accessibilityHint="Tap anywhere to skip the festival introduction animation"
    >
      {/* Full-screen Dynamic Festival Gradient Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.fullScreenContainer, animatedBgStyle]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Ambient Bloom Light Radiance */}
        <View style={styles.ambientGlow} />
      </Animated.View>

      {/* Centered Hero Bloom & Handoff Content Container */}
      <View style={styles.centerContainer} pointerEvents="none">
        <Animated.View style={[styles.emblemWrapper, animatedEmblemStyle]}>
          {/* Emblem Background Aura */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
            style={styles.emblemBackground}
          >
            {/* Emblem Image / Icon */}
            {festival.emblem ? (
              typeof festival.emblem === 'string' && !festival.emblem.startsWith('http') ? (
                <Text style={styles.emblemGlyph}>{festival.emblem}</Text>
              ) : (
                <Image
                  source={festival.emblem}
                  style={styles.emblemImage}
                  contentFit="cover"
                  onLoad={() => setImageLoaded(true)}
                  cachePolicy="memory-disk"
                />
              )
            ) : (
              <Text style={styles.emblemGlyph}>🪔</Text>
            )}

            {/* Remote image gradient placeholder safety */}
            {isRemoteImage && !imageLoaded && (
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {/* Shimmer Sweep Overlay Mask (Runs only once after image is loaded) */}
            {imageLoaded && (
              <View style={styles.shimmerContainer} pointerEvents="none">
                <Animated.View style={[styles.shimmerSlice, animatedShimmerStyle]}>
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0)',
                      'rgba(255, 255, 255, 0.75)',
                      'rgba(255, 255, 255, 0)',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Dynamic Festival Titles below Emblem */}
        <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
          <Text style={styles.festivalName} numberOfLines={2}>
            {festival.name}
          </Text>
          {festival.nameHi ? (
            <Text style={styles.festivalNameHi}>{festival.nameHi}</Text>
          ) : null}
          <View style={styles.tapToSkipBadge}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.tapToSkipText}>Tap anywhere to skip</Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    zIndex: 100,
  },
  ambientGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: (SCREEN_WIDTH * 0.9) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: SCREEN_HEIGHT / 2 - (SCREEN_WIDTH * 0.9) / 2,
    left: SCREEN_WIDTH / 2 - (SCREEN_WIDTH * 0.9) / 2,
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  emblemWrapper: {
    width: EMBLEM_SIZE,
    height: EMBLEM_SIZE,
    borderRadius: EMBLEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  emblemBackground: {
    width: EMBLEM_SIZE,
    height: EMBLEM_SIZE,
    borderRadius: EMBLEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  emblemImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: EMBLEM_SIZE / 2,
  },
  emblemGlyph: {
    fontSize: 60,
    textAlign: 'center',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerSlice: {
    width: EMBLEM_SIZE * 0.9,
    height: '100%',
  },
  titleContainer: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  festivalName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  festivalNameHi: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFF2C6',
    marginTop: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  tapToSkipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tapToSkipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
