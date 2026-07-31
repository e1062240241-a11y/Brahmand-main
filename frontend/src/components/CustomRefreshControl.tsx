import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, RefreshControl, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// ponytail: Instagram / Threads style custom spinner
interface InstagramSpinnerProps {
  refreshing: boolean;
  color?: string;
  size?: number;
}

export const InstagramSpinner: React.FC<InstagramSpinnerProps> = ({
  refreshing,
  color = '#8E8E93',
  size = 24,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (refreshing) {
      rotateAnim.setValue(0);
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      rotateAnim.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [refreshing]);

  if (!refreshing) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * 0.35;

  return (
    <View style={[styles.container, { height: size + 16 }]}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

// ponytail: Platform-optimized RefreshControl
// iOS: Uses native smooth spinner (visible immediately on pull, spins with drag, triggers early)
// Android: Clean white circular background badge around the spinner with primary tint color
export const InstagramRefreshControl: React.FC<
  React.ComponentProps<typeof RefreshControl> & { colors?: string[] }
> = ({
  tintColor = '#8E8E93',
  colors = ['#FF7A00', '#8E8E93'],
  progressBackgroundColor = '#FFFFFF',
  progressViewOffset = 20,
  ...props
}) => {
    return (
      <RefreshControl
        tintColor={Platform.OS === 'ios' ? tintColor : undefined}
        colors={Platform.OS === 'android' ? colors : undefined}
        progressBackgroundColor={Platform.OS === 'android' ? progressBackgroundColor : undefined}
        progressViewOffset={progressViewOffset}
        {...props}
      />
    );
  };

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
});
