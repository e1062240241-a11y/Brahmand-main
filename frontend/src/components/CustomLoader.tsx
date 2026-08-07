import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';


interface CustomLoaderProps {
  size?: number;
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({
  size = 64,
  color = '#2563EB', // Vibrant Blue
  message,
  fullScreen = true,
  style,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const strokeWidth = Math.max(3, Math.round(size / 14));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * 0.35;

  return (
    <View style={[fullScreen ? styles.fullScreenContainer : styles.inlineContainer, style]}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        {/* Rotating Blue Arc Spinner */}
        <Animated.View style={[styles.absoluteCenter, animatedSpinnerStyle]}>
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>

      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  absoluteCenter: {
    position: 'absolute',
  },
  messageText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomLoader;
