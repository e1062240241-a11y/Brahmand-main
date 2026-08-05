import React, { useRef, useEffect, useState } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  View,
  Text,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface UiverseNotifyButtonProps {
  isNotified?: boolean;
  onPress?: () => void;
  label?: string;
  notifiedLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const UiverseNotifyButton: React.FC<UiverseNotifyButtonProps> = ({
  isNotified = false,
  onPress,
  label = 'Notify Me',
  notifiedLabel = "You're In",
  style,
  textStyle,
  size = 'medium',
  showIcon = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimatingSuccess, setIsAnimatingSuccess] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.75)).current;
  const starRotateAnim = useRef(new Animated.Value(0)).current;

  // New Animations: Shake, Ripple, Green Color Transition & Tick Scale
  const bellShakeAnim = useRef(new Animated.Value(0)).current;
  const rippleScaleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacityAnim = useRef(new Animated.Value(0)).current;
  const greenTransitionAnim = useRef(new Animated.Value(isNotified ? 1 : 0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(isNotified ? 1 : 0)).current;

  useEffect(() => {
    if (isNotified && !isAnimatingSuccess) {
      greenTransitionAnim.setValue(1);
      checkmarkScaleAnim.setValue(1);
    } else if (!isNotified && !isAnimatingSuccess) {
      greenTransitionAnim.setValue(0);
      checkmarkScaleAnim.setValue(0);
    }
  }, [isNotified]);

  useEffect(() => {
    // Pulse animation for inner glowing circles
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Slow rotation animation for cosmic starfield
    const rotateLoop = Animated.loop(
      Animated.timing(starRotateAnim, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  const triggerAnimationSequence = () => {
    // 1. Medium Haptic Feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}

    setIsAnimatingSuccess(true);
    rippleScaleAnim.setValue(0.2);
    rippleOpacityAnim.setValue(0.8);

    // 2. Button Compress (scale 0.95 for 180ms) + Bell shake + Ripple expansion
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // Bell shake sequence (halka shake -15deg -> 15deg -> -10deg -> 10deg -> 0)
      Animated.sequence([
        Animated.timing(bellShakeAnim, { toValue: -1, duration: 40, useNativeDriver: true }),
        Animated.timing(bellShakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(bellShakeAnim, { toValue: -0.6, duration: 40, useNativeDriver: true }),
        Animated.timing(bellShakeAnim, { toValue: 0.6, duration: 40, useNativeDriver: true }),
        Animated.timing(bellShakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
      ]),
      // Orange Ripple expansion
      Animated.parallel([
        Animated.timing(rippleScaleAnim, {
          toValue: 3.5,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacityAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 3. Green color fill & Tick checkmark scale up
      Animated.parallel([
        Animated.timing(greenTransitionAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.spring(checkmarkScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimatingSuccess(false);
      });
    });
  };

  const handlePress = () => {
    if (!isNotified) {
      triggerAnimationSequence();
    } else {
      // If toggling off, transition back
      Animated.timing(greenTransitionAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      checkmarkScaleAnim.setValue(0);
    }
    onPress?.();
  };

  const handlePressIn = () => {
    if (!isAnimatingSuccess) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isAnimatingSuccess) {
      Animated.spring(scaleAnim, {
        toValue: isHovered ? 1.05 : 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleHoverIn = () => {
    setIsHovered(true);
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const spin = starRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bellRotate = bellShakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const activeNotified = isNotified || isAnimatingSuccess;
  const displayLabel = activeNotified ? notifiedLabel : label;

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const paddingVertical = isSmall ? (Platform.OS === 'android' ? 4 : 5) : isLarge ? 12 : (Platform.OS === 'android' ? 6 : 8);
  const paddingHorizontal = isSmall ? 12 : isLarge ? 24 : 16;
  const fontSize = isSmall ? 10.5 : isLarge ? 15 : 12.5;
  const iconSize = isSmall ? 12 : isLarge ? 18 : 14;

  const gradientColors: [string, string, ...string[]] = ['#FFE082', '#FF9800', '#FF5722', '#D84315'];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...({
          onHoverIn: handleHoverIn,
          onHoverOut: handleHoverOut,
        } as any)}
        style={styles.pressableWrapper}
      >
        {/* Outer Multi-color Cosmic Gradient Border Wrapper */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.gradientBorder, { borderRadius: 50 }]}
        >
          {/* Inner Container */}
          <Animated.View
            style={[
              styles.innerContainer,
              {
                paddingVertical,
                paddingHorizontal,
                borderRadius: 48,
                backgroundColor: '#1E120A',
              },
            ]}
          >


            {/* Background Glow Circles Layer */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Animated.View
                style={[
                  styles.glowCircleOrange,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: 0.7,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.glowCircleAmber,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: 0.75,
                  },
                ]}
              />
            </View>

            {/* Rotating Starfield Background Overlay Layer */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.starsOverlayContainer,
                { transform: [{ rotate: spin }] },
              ]}
            >
              {/* Scattered Star Particles */}
              <View style={[styles.starDot, { top: 3, left: 10, opacity: 0.8 }]} />
              <View style={[styles.starDot, { top: 18, left: 45, opacity: 0.6, width: 2, height: 2 }]} />
              <View style={[styles.starDot, { top: 8, right: 15, opacity: 0.9 }]} />
              <View style={[styles.starDot, { bottom: 6, left: 25, opacity: 0.7 }]} />
              <View style={[styles.starDot, { bottom: 12, right: 35, opacity: 0.85, width: 2, height: 2 }]} />
            </Animated.View>

            {/* Button Content Layer (Icon + Glowing Text) */}
            <View style={styles.contentRow}>
              {showIcon && (
                activeNotified ? (
                  <Animated.View style={{ transform: [{ scale: checkmarkScaleAnim }], marginRight: 5 }}>
                    <Svg width={iconSize + 6} height={iconSize + 6} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M4.5 12.5L9.5 17.5L19.5 6.5"
                        stroke="#000000"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Animated.View>
                ) : (
                  <Animated.View style={{ transform: [{ rotate: bellRotate }], marginRight: 5 }}>
                    <Ionicons
                      name="notifications-outline"
                      size={iconSize}
                      color="#ffffff"
                    />
                  </Animated.View>
                )
              )}
              <Text
                style={[
                  styles.text,
                  {
                    fontSize,
                  },
                  activeNotified && { color: '#FFFFFF', textShadowColor: 'transparent' },
                  textStyle,
                ]}
              >
                {displayLabel}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientBorder: {
    padding: 2.2, // Double gradient border thickness
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    position: 'relative',
    backgroundColor: '#1E120A',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircleOrange: {
    position: 'absolute',
    left: -10,
    top: -5,
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 109, 0, 0.75)',
  },
  glowCircleAmber: {
    position: 'absolute',
    right: -10,
    bottom: -5,
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 179, 0, 0.8)',
  },
  glowCircleGreenLeft: {
    position: 'absolute',
    left: -10,
    top: -5,
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  glowCircleGreenRight: {
    position: 'absolute',
    right: -10,
    bottom: -5,
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(174, 234, 0, 0.85)',
  },
  rippleOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 109, 0, 0.7)',
    zIndex: 1,
  },
  starsOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starDot: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  text: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 224, 130, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});

export default UiverseNotifyButton;
