import React, { useEffect, useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, Modal, View, StatusBar, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THREADS_EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const THREADS_EASE_IN = Easing.bezier(0.25, 1, 0.5, 1);

export type ViewerOrigin = { x: number; y: number; width: number; height: number } | null;

export interface AnimatedFullScreenMediaViewerProps {
  mediaUrl: string | null;
  origin?: ViewerOrigin;
  onClose: () => void;
  CommunityMediaItem?: React.ComponentType<{ media: any; style: any; isActive?: boolean }>;
}

export const AnimatedFullScreenMediaViewer: React.FC<AnimatedFullScreenMediaViewerProps> = ({
  mediaUrl,
  origin,
  onClose,
}) => {
  const progress = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const visible = Boolean(mediaUrl);

  const startCloseAnimation = useCallback(() => {
    progress.value = withTiming(0, { duration: 230, easing: THREADS_EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, progress]);

  useEffect(() => {
    if (visible) {
      dragX.value = 0;
      dragY.value = 0;
      pinchScale.value = 1;
      progress.value = 0;
      progress.value = withSpring(1, { dampingRatio: 0.9, duration: 340 });
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } else {
      progress.value = 0;
    }
  }, [visible, mediaUrl, dragX, dragY, pinchScale, progress]);

  // Double tap to zoom 2.2x and reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (pinchScale.value > 1.2) {
        pinchScale.value = withSpring(1, { dampingRatio: 0.85, duration: 260 });
        dragX.value = withSpring(0, { dampingRatio: 0.85 });
        dragY.value = withSpring(0, { dampingRatio: 0.85 });
      } else {
        pinchScale.value = withSpring(2.2, { dampingRatio: 0.85, duration: 280 });
      }
    });

  // Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      pinchScale.value = Math.max(0.8, Math.min(3.5, e.scale));
    })
    .onEnd(() => {
      'worklet';
      if (pinchScale.value < 1) {
        pinchScale.value = withSpring(1, { dampingRatio: 0.85, duration: 240 });
      }
    });

  // Interactive swipe down to dismiss gesture with velocity handoff
  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onUpdate((e) => {
      'worklet';
      if (pinchScale.value <= 1.05) {
        dragY.value = e.translationY;
        dragX.value = e.translationX * 0.35;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (pinchScale.value <= 1.05) {
        if (Math.abs(e.translationY) > 85 || Math.abs(e.velocityY) > 550) {
          progress.value = withTiming(0, { duration: 210, easing: THREADS_EASE_IN }, (finished) => {
            if (finished) {
              runOnJS(onClose)();
            }
          });
        } else {
          dragY.value = withSpring(0, { dampingRatio: 0.85, duration: 280, velocity: e.velocityY });
          dragX.value = withSpring(0, { dampingRatio: 0.85, duration: 280, velocity: e.velocityX });
        }
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, Gesture.Race(doubleTapGesture, panGesture));

  // Dark backdrop opacity
  const backdropStyle = useAnimatedStyle(() => {
    const dragFade = Math.max(0, 1 - Math.abs(dragY.value) / 320);
    const bgOpacity = interpolate(progress.value, [0, 1], [0, 0.98], Extrapolation.CLAMP) * dragFade;
    return {
      opacity: bgOpacity,
    };
  });

  // Zoom-from-origin content style (Threads / iOS Photos effect)
  const contentStyle = useAnimatedStyle(() => {
    const p = progress.value;

    const dragScale = Math.max(0.75, 1 - Math.abs(dragY.value) / 1000);
    const opacity = interpolate(p, [0, 0.08, 1], [0.3, 1, 1], Extrapolation.CLAMP);

    if (!origin || origin.width <= 0 || origin.height <= 0) {
      // Clean fallback if no origin bounds measured
      const scale = interpolate(p, [0, 1], [0.88, 1], Extrapolation.CLAMP) * dragScale * pinchScale.value;
      return {
        opacity,
        transform: [
          { translateX: dragX.value },
          { translateY: dragY.value },
          { scale },
        ],
      };
    }

    const originCenterX = origin.x + origin.width / 2;
    const originCenterY = origin.y + origin.height / 2;
    const screenCenterX = SCREEN_WIDTH / 2;
    const screenCenterY = SCREEN_HEIGHT / 2;

    const startTx = originCenterX - screenCenterX;
    const startTy = originCenterY - screenCenterY;
    const startScale = Math.min(1, Math.max(0.15, origin.width / SCREEN_WIDTH));

    const currentTx = interpolate(p, [0, 1], [startTx, 0], Extrapolation.CLAMP) + dragX.value;
    const currentTy = interpolate(p, [0, 1], [startTy, 0], Extrapolation.CLAMP) + dragY.value;
    const currentScale = interpolate(p, [0, 1], [startScale, 1], Extrapolation.CLAMP) * dragScale * pinchScale.value;
    const currentRadius = interpolate(p, [0, 1], [14, 0], Extrapolation.CLAMP);

    return {
      opacity,
      borderRadius: currentRadius,
      transform: [
        { translateX: currentTx },
        { translateY: currentTy },
        { scale: currentScale },
      ],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={startCloseAnimation}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Background Dimming Layer */}
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]} />

        {/* Tap backdrop to dismiss */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={startCloseAnimation} />

        {/* Close Button */}
        <Pressable
          onPress={startCloseAnimation}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close image viewer"
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>

        {/* Interactive Gesture & Zooming Image */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.imageWrapper,
              contentStyle,
            ]}
          >
            <Image
              source={typeof mediaUrl === 'string' ? { uri: mediaUrl } : (mediaUrl as any)}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
});

export default AnimatedFullScreenMediaViewer;
