import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, Platform } from 'react-native';
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
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  title: string;
}

export default function SwipeButton({ onSwipeComplete, title }: SwipeButtonProps) {
  const buttonWidth = SCREEN_WIDTH - 50;
  const circleWidth = 48;
  const padding = 4;
  const slideDistance = buttonWidth - circleWidth - (padding * 2);

  const translateX = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const hintOpacity = useSharedValue(0);

  const swipedRef = useRef(false);
  const hasPlayedHintRef = useRef(false);
  const isHintAnimatingRef = useRef(false);

  const triggerOnSwipeComplete = useCallback(() => {
    onSwipeComplete();
    setTimeout(() => {
      swipedRef.current = false;
      translateX.value = 0;
    }, 1000);
  }, [onSwipeComplete, translateX]);

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

  // Onboarding micro-interaction: plays 3 times per page visit after 800-1200ms delay
  useEffect(() => {
    if (hasPlayedHintRef.current) return;

    const timer = setTimeout(() => {
      if (swipedRef.current || hasPlayedHintRef.current) return;
      hasPlayedHintRef.current = true;
      isHintAnimatingRef.current = true;

      // 1. Fade in small hint text
      hintOpacity.value = withTiming(1, { duration: 300 });

      // 2. Subtle pulse/glow on ॐ handle (repeated 3 times)
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 350, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        false
      );

      // 3. Slide 25% to right and return smoothly (repeated 3 times)
      translateX.value = withRepeat(
        withSequence(
          withTiming(slideDistance * 0.25, { duration: 450, easing: Easing.out(Easing.quad) }),
          withSpring(0, { stiffness: 80, damping: 12 })
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
        gestureState.dx > 3 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        !swipedRef.current &&
        gestureState.dx > 3 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        cancelHintAnimation();
        cancelAnimation(translateX);
      },
      onPanResponderMove: (_, gestureState) => {
        if (swipedRef.current) return;
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > slideDistance) newX = slideDistance;
        translateX.value = newX;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipedRef.current) return;
        if (gestureState.dx >= slideDistance * 0.6) {
          swipedRef.current = true;
          translateX.value = withTiming(slideDistance, { duration: 150 }, (finished) => {
            'worklet';
            if (finished) {
              runOnJS(triggerOnSwipeComplete)();
            }
          });
        } else {
          translateX.value = withSpring(0, { stiffness: 80, damping: 12 });
        }
      },
      onPanResponderTerminate: () => {
        if (!swipedRef.current) {
          translateX.value = withSpring(0, { stiffness: 80, damping: 12 });
        }
      },
    })
  ).current;

  // Reanimated 60 FPS animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateX.value / (slideDistance * 0.5)),
  }));

  const trackFillAnimatedStyle = useAnimatedStyle(() => ({
    width: translateX.value + circleWidth + padding * 2,
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: pulseScale.value },
    ],
  }));

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Orange track fill */}
      <Animated.View style={[styles.filledTrack, trackFillAnimatedStyle]} />

      {/* Main button title */}
      <Animated.Text style={[styles.text, titleAnimatedStyle]}>
        {title}
      </Animated.Text>

      {/* Small fading hint text */}
      <Animated.View style={[styles.hintOverlay, hintAnimatedStyle]} pointerEvents="none">
        <Text style={styles.hintText}>Swipe to Join →</Text>
      </Animated.View>

      {/* ॐ Handle */}
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
    height: 56,
    backgroundColor: '#E8630A',
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  filledTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF8800',
    borderRadius: 28,
  },
  text: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintOverlay: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  hintText: {
    color: '#FFE5D6',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    position: 'absolute',
    left: 4,
    zIndex: 10,
  },
  icon: {
    color: '#E8630A',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
