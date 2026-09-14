import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, Platform, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  cancelAnimation,
  Easing,
  runOnJS,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  title: string;
}

const CHEVRONS = [0, 1, 2, 3, 4, 5];

const ChevronItem = React.memo(function ChevronItem({ index, waveProgress }: { index: number; waveProgress: SharedValue<number> }) {
  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const phase = (waveProgress.value - index * 0.12 + 1) % 1;
    const opacity = 0.25 + 0.75 * Math.sin(phase * Math.PI);
    const translateX = Math.sin(phase * Math.PI) * 3.5;

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.Text style={[styles.chevronSign, animStyle]}>
      ❯
    </Animated.Text>
  );
});

const ChevronWave = () => {
  const waveProgress = useSharedValue(0);

  useEffect(() => {
    waveProgress.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.linear }),
      -1,
      false
    );
  }, [waveProgress]);

  return (
    <View style={styles.chevronsRow}>
      {CHEVRONS.map((i) => (
        <ChevronItem key={i} index={i} waveProgress={waveProgress} />
      ))}
    </View>
  );
};

export default function SwipeButton({ onSwipeComplete, title }: SwipeButtonProps) {
  const circleWidth = 50;
  const padding = 4;

  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 50);
  const slideDistance = Math.max(0, containerWidth - circleWidth - (padding * 2));

  const translateX = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const hintOpacity = useSharedValue(0);
  const isDragging = useSharedValue(0);

  const swipedRef = useRef(false);
  const hasPlayedHintRef = useRef(false);
  const isHintAnimatingRef = useRef(false);
  const hasPassedThresholdRef = useRef(false);

  const triggerOnSwipeComplete = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    onSwipeComplete();
    setTimeout(() => {
      swipedRef.current = false;
      hasPassedThresholdRef.current = false;
      translateX.value = withTiming(0, { duration: 250 });
      isDragging.value = withTiming(0, { duration: 200 });
    }, 1000);
  }, [onSwipeComplete, translateX, isDragging]);

  const onHintAnimationEnd = useCallback(() => {
    isHintAnimatingRef.current = false;
    hintOpacity.value = withTiming(0, { duration: 350 });
  }, [hintOpacity]);

  // Immediately cancel onboarding hint animation if user touches or drags
  const cancelHintAnimation = useCallback(() => {
    hasPlayedHintRef.current = true;
    if (isHintAnimatingRef.current) {
      isHintAnimatingRef.current = false;
      cancelAnimation(translateX);
      cancelAnimation(pulseScale);
      cancelAnimation(hintOpacity);

      pulseScale.value = withTiming(1, { duration: 150 });
      hintOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [translateX, pulseScale, hintOpacity]);

  // Onboarding micro-interaction: plays once per page visit after delay
  useEffect(() => {
    if (hasPlayedHintRef.current || slideDistance <= 0) return;

    const timer = setTimeout(() => {
      if (swipedRef.current || hasPlayedHintRef.current) return;
      hasPlayedHintRef.current = true;
      isHintAnimatingRef.current = true;

      hintOpacity.value = withTiming(1, { duration: 300 });

      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 350, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        false
      );

      translateX.value = withRepeat(
        withSequence(
          withTiming(slideDistance * 0.2, { duration: 450, easing: Easing.out(Easing.quad) }),
          withSpring(0, { stiffness: 140, damping: 22, mass: 1, overshootClamping: true })
        ),
        3,
        false,
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onHintAnimationEnd)();
          }
        }
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [slideDistance, onHintAnimationEnd, hintOpacity, pulseScale, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swipedRef.current,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !swipedRef.current &&
        Math.abs(gestureState.dx) > 3 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        !swipedRef.current &&
        Math.abs(gestureState.dx) > 3 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        cancelHintAnimation();
        cancelAnimation(translateX);
        isDragging.value = withTiming(1, { duration: 120 });
        hasPassedThresholdRef.current = false;
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (_) {}
      },
      onPanResponderMove: (_, gestureState) => {
        if (swipedRef.current) return;
        const rawX = gestureState.dx;

        // Elastic resistance (rubber-banding) for high-responsiveness iOS feel:
        let calculatedX: number;
        if (rawX < 0) {
          // Strong elastic resistance when dragging backwards
          calculatedX = -Math.pow(Math.abs(rawX), 0.5) * 1.8;
        } else if (rawX <= slideDistance) {
          // Responsive 1:1 direct tracking
          calculatedX = rawX;
        } else {
          // Noticeable elastic resistance beyond slide distance
          const excess = rawX - slideDistance;
          calculatedX = slideDistance + Math.pow(excess, 0.5) * 1.8;
        }

        translateX.value = calculatedX;

        // Haptic feedback when crossing the 60% completion threshold
        if (rawX >= slideDistance * 0.6 && !hasPassedThresholdRef.current) {
          hasPassedThresholdRef.current = true;
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (_) {}
        } else if (rawX < slideDistance * 0.6 && hasPassedThresholdRef.current) {
          hasPassedThresholdRef.current = false;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipedRef.current) return;
        isDragging.value = withTiming(0, { duration: 150 });

        // Trigger on reaching 55% or on brisk rightward flick (velocity > 0.6)
        const passedDistance = gestureState.dx >= slideDistance * 0.55;
        const passedVelocity = gestureState.dx > slideDistance * 0.2 && gestureState.vx > 0.6;

        if (passedDistance || passedVelocity) {
          swipedRef.current = true;
          translateX.value = withSpring(slideDistance, {
            stiffness: 240,
            damping: 25,
            mass: 0.75,
            overshootClamping: true,
          }, (finished) => {
            'worklet';
            if (finished) {
              runOnJS(triggerOnSwipeComplete)();
            }
          });
        } else {
          translateX.value = withSpring(0, {
            stiffness: 220,
            damping: 24,
            mass: 0.85,
            overshootClamping: true,
          });
        }
      },
      onPanResponderTerminate: () => {
        if (!swipedRef.current) {
          isDragging.value = withTiming(0, { duration: 150 });
          translateX.value = withSpring(0, {
            stiffness: 220,
            damping: 24,
            mass: 0.85,
            overshootClamping: true,
          });
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const measuredWidth = e.nativeEvent.layout.width;
    if (measuredWidth > 0 && Math.abs(measuredWidth - containerWidth) > 1) {
      setContainerWidth(measuredWidth);
    }
  };

  // Main title fades out cleanly and shifts gently to right
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const clampedX = Math.max(0, Math.min(slideDistance, translateX.value));
    const fadeEnd = slideDistance > 0 ? slideDistance * 0.45 : 1;
    const opacity = interpolate(clampedX, [0, fadeEnd], [1, 0], Extrapolation.CLAMP);
    const titleShift = interpolate(clampedX, [0, slideDistance], [0, 14], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateX: titleShift }],
    };
  });

  // Track follow-fill: expands smoothly from left as circle moves
  const trackFillAnimatedStyle = useAnimatedStyle(() => {
    const clampedX = Math.max(0, Math.min(slideDistance, translateX.value));
    return {
      width: clampedX + circleWidth + padding * 2,
    };
  });

  // Circular/rounded pod backing that travels together with the circle knob
  const circularPodAnimatedStyle = useAnimatedStyle(() => {
    const clampedX = Math.max(0, Math.min(slideDistance, translateX.value));
    const dragScale = interpolate(isDragging.value, [0, 1], [1, 1.15], Extrapolation.CLAMP);
    const podOpacity = interpolate(clampedX, [0, slideDistance * 0.5, slideDistance], [0.35, 0.6, 0.85], Extrapolation.CLAMP);

    return {
      opacity: podOpacity,
      transform: [
        { translateX: clampedX },
        { scale: dragScale },
      ],
    };
  });

  // Circle knob with responsive drag touch feedback
  const circleAnimatedStyle = useAnimatedStyle(() => {
    const clampedX = Math.max(0, Math.min(slideDistance, translateX.value));
    const dragScale = interpolate(isDragging.value, [0, 1], [1, 1.05], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: clampedX },
        { scale: pulseScale.value * dragScale },
      ],
    };
  });

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Double tap to activate"
      accessibilityActions={[{ name: 'activate', label: 'Activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') {
          triggerOnSwipeComplete();
        }
      }}
    >
      {/* Dynamic trailing active orange track */}
      <Animated.View style={[styles.filledTrack, trackFillAnimatedStyle]} />

      {/* Backing pod that travels together with the circle knob */}
      <Animated.View style={[styles.circularPod, circularPodAnimatedStyle]} pointerEvents="none" />

      {/* Main button title */}
      <Animated.Text style={[styles.text, titleAnimatedStyle]}>
        {title}
      </Animated.Text>

      {/* Chevrons guide animation */}
      <Animated.View style={[styles.hintOverlay, hintAnimatedStyle]} pointerEvents="none">
        <ChevronWave />
      </Animated.View>

      {/* ॐ Slide Handle / Thumb */}
      <Animated.View
        style={[styles.circle, circleAnimatedStyle]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.icon}>ॐ</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 58,
    backgroundColor: '#D95600',
    borderRadius: 29,
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  filledTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF7A00',
    borderRadius: 29,
  },
  circularPod: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 4,
  },
  text: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hintOverlay: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  chevronsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronSign: {
    color: '#FFE5D6',
    fontSize: 16,
    fontWeight: '900',
    marginHorizontal: 1.5,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
    position: 'absolute',
    left: 4,
    zIndex: 10,
  },
  icon: {
    color: '#D95600',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

