import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, RefreshControl, Platform, Text, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// OmSpinner: Universal, lightweight, background-free spiritual loading spinner
// Compatible drop-in replacement for React Native's ActivityIndicator
// ---------------------------------------------------------------------------
export interface OmSpinnerProps {
  refreshing?: boolean;
  size?: number | 'small' | 'large';
  color?: string;
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const OmSpinner: React.FC<OmSpinnerProps> = ({
  refreshing = true,
  size = 36,
  color = '#FF6B00',
  ringColor,
  style,
}) => {
  const numericSize =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 22
      : size === 'large'
      ? 44
      : 36;
  const activeRingColor = ringColor || color || '#FF7A00';

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let spinAnim: Animated.CompositeAnimation | null = null;
    let breatheAnim: Animated.CompositeAnimation | null = null;

    if (refreshing) {
      rotateAnim.setValue(0);
      spinAnim = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnim.start();

      pulseAnim.setValue(1);
      breatheAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.94,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      breatheAnim.start();
    } else {
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }

    return () => {
      if (spinAnim) spinAnim.stop();
      if (breatheAnim) breatheAnim.stop();
    };
  }, [refreshing, rotateAnim, pulseAnim]);

  if (!refreshing) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const strokeWidth = numericSize <= 24 ? 1.8 : 2.5;
  const radius = Math.max(2, (numericSize - (strokeWidth * 2 + 2)) / 2);

  return (
    <View style={[styles.omSpinnerContainer, { width: numericSize, height: numericSize }, style]}>
      {/* Outer Rotating Halo Arc */}
      <Animated.View style={[styles.ringWrapper, { width: numericSize, height: numericSize, transform: [{ rotate: spin }] }]}>
        <Svg width={numericSize} height={numericSize} viewBox={`0 0 ${numericSize} ${numericSize}`}>
          {/* Subtle translucent ambient ring */}
          <Circle
            cx={numericSize / 2}
            cy={numericSize / 2}
            r={radius}
            stroke={color}
            strokeWidth={Math.max(1, strokeWidth - 0.8)}
            fill="none"
            opacity={0.25}
          />
          {/* Radiant spinning arc */}
          <Circle
            cx={numericSize / 2}
            cy={numericSize / 2}
            r={radius}
            stroke={activeRingColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${radius * 2.2} ${radius * 1.5}`}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Center ॐ with Subtle Breathing Pulse */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Text
          style={[
            styles.omText,
            {
              color,
              fontSize: Math.round(numericSize * 0.48),
            },
          ]}
        >
          ॐ
        </Text>
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// OmRefreshControl: Suppresses native OS spinners on both iOS and Android
// ---------------------------------------------------------------------------
export const OmRefreshControl: React.FC<
  React.ComponentProps<typeof RefreshControl>
> = ({ style, colors, progressBackgroundColor, tintColor, ...props }) => {
  return (
    <RefreshControl
      tintColor={tintColor || (Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.01)' : 'transparent')}
      colors={colors || ['transparent']}
      progressBackgroundColor={progressBackgroundColor || 'transparent'}
      style={[{ backgroundColor: 'transparent' }, style]}
      {...props}
    />
  );
};

// ---------------------------------------------------------------------------
// Universal Aliases (replaces legacy Instagram spinner & refresh control)
// ---------------------------------------------------------------------------
export const OmPullRefreshIndicator = OmSpinner;
export const InstagramSpinner = OmSpinner;
export const InstagramRefreshControl = OmRefreshControl;

const styles = StyleSheet.create({
  omSpinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  omText: {
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
