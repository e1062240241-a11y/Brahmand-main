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
  notifiedLabel = 'Notified',
  style,
  textStyle,
  size = 'medium',
  showIcon = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.75)).current;
  const starRotateAnim = useRef(new Animated.Value(0)).current;

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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isHovered ? 1.05 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
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

  const displayLabel = isNotified ? notifiedLabel : label;

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const paddingVertical = isSmall ? (Platform.OS === 'android' ? 4 : 5) : isLarge ? 12 : (Platform.OS === 'android' ? 6 : 8);
  const paddingHorizontal = isSmall ? 12 : isLarge ? 24 : 16;
  const fontSize = isSmall ? 10.5 : isLarge ? 15 : 12.5;
  const iconSize = isSmall ? 12 : isLarge ? 18 : 14;

  const gradientColors: [string, string, ...string[]] = isNotified
    ? ['#FF6D00', '#FF3D00', '#DD2C00', '#FFAB00']
    : ['#FFE082', '#FF9800', '#FF5722', '#D84315'];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
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
          {/* Inner Dark Backdrop Button Container */}
          <View
            style={[
              styles.innerContainer,
              {
                paddingVertical,
                paddingHorizontal,
                borderRadius: 48,
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
                    opacity: isNotified ? 0.95 : 0.7,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.glowCircleAmber,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: isNotified ? 0.95 : 0.75,
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
                <Ionicons
                  name={isNotified ? 'notifications' : 'notifications-outline'}
                  size={iconSize}
                  color={isNotified ? '#FFE082' : '#ffffff'}
                  style={{ marginRight: 5 }}
                />
              )}
              <Text
                style={[
                  styles.text,
                  {
                    fontSize,
                  },
                  textStyle,
                ]}
              >
                {displayLabel}
              </Text>
            </View>
          </View>
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
