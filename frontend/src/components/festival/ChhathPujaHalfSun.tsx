import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Ellipse,
  Path,
  Line,
  G,
} from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
}

// 21 Divine solar rays fanning out symmetrically in a rising semicircle
const SUN_RAYS = [
  { d: "M 22.6 25.5 L 14.1 23.5 L 22.8 24.5 Z", isPrimary: true },
  { d: "M 23.0 23.8 L 18.4 21.9 L 23.2 23.1 Z", isPrimary: false },
  { d: "M 23.5 22.4 L 14.6 17.5 L 23.9 21.5 Z", isPrimary: true },
  { d: "M 24.3 20.9 L 19.7 17.3 L 24.7 20.3 Z", isPrimary: false },
  { d: "M 25.1 19.7 L 17.1 11.7 L 25.8 19.0 Z", isPrimary: true },
  { d: "M 26.3 18.4 L 22.3 13.1 L 26.9 18.0 Z", isPrimary: false },
  { d: "M 27.5 17.5 L 21.3 6.7 L 28.3 17.0 Z", isPrimary: true },
  { d: "M 29.0 16.6 L 26.3 9.7 L 29.7 16.4 Z", isPrimary: false },
  { d: "M 30.4 16.1 L 27.1 3.0 L 31.3 15.8 Z", isPrimary: true },
  { d: "M 32.0 15.7 L 31.3 7.5 L 32.8 15.6 Z", isPrimary: false },
  { d: "M 33.5 15.5 L 34.0 1.0 L 34.5 15.5 Z", isPrimary: true }, // Peak Center Ray (pointing straight up)
  { d: "M 35.2 15.6 L 36.7 7.5 L 36.0 15.7 Z", isPrimary: false },
  { d: "M 36.7 15.8 L 40.9 3.0 L 37.6 16.1 Z", isPrimary: true },
  { d: "M 38.3 16.4 L 41.7 9.7 L 39.0 16.6 Z", isPrimary: false },
  { d: "M 39.7 17.0 L 46.7 6.7 L 40.5 17.5 Z", isPrimary: true },
  { d: "M 41.1 18.0 L 45.7 13.1 L 41.7 18.4 Z", isPrimary: false },
  { d: "M 42.2 19.0 L 50.9 11.7 L 42.9 19.7 Z", isPrimary: true },
  { d: "M 43.3 20.3 L 48.3 17.3 L 43.7 20.9 Z", isPrimary: false },
  { d: "M 44.1 21.5 L 53.4 17.5 L 44.5 22.4 Z", isPrimary: true },
  { d: "M 44.8 23.1 L 49.6 21.9 L 45.0 23.8 Z", isPrimary: false },
  { d: "M 45.2 24.5 L 53.9 23.5 L 45.4 25.5 Z", isPrimary: true },
];

/**
 * ChhathPujaHalfSun:
 * Luminous rising half-sun crest placed above the "BRAHMAND" home title,
 * modeled directly after the iconic Chhath Puja banner sun emblem.
 */
export const ChhathPujaHalfSun: React.FC<Props> = React.memo(({
  width = Platform.OS === 'android' ? 54 : 58,
  height = Platform.OS === 'android' ? 22 : 24,
}) => {
  // Gentle solar corona breathing pulse
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, [glowAnim]);

  const auraScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  const auraOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  return (
    <Animated.View
      style={{
        width,
        height,
        alignItems: 'center',
        justifyContent: 'flex-end',
        transform: [{ scale: auraScale }],
        opacity: auraOpacity,
      }}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox="0 0 68 28">
        <Defs>
          {/* Solar Backdrop Glow */}
          <SvgRadialGradient id="sunAuraBackdrop" cx="50%" cy="85%" r="65%">
            <Stop offset="0%" stopColor="#FFF9C4" stopOpacity={0.8} />
            <Stop offset="45%" stopColor="#FFB300" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#FF8F00" stopOpacity={0} />
          </SvgRadialGradient>

          {/* Primary Long Ray Gradient */}
          <SvgLinearGradient id="sunRayPrimary" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#FF8F00" />
            <Stop offset="45%" stopColor="#FFA000" />
            <Stop offset="80%" stopColor="#FFCA28" />
            <Stop offset="100%" stopColor="#FFF59D" />
          </SvgLinearGradient>

          {/* Secondary Shorter Ray Gradient */}
          <SvgLinearGradient id="sunRaySecondary" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#E65100" />
            <Stop offset="60%" stopColor="#FF9800" />
            <Stop offset="100%" stopColor="#FFD54F" />
          </SvgLinearGradient>

          {/* Semicircular Dome Core Gradient */}
          <SvgLinearGradient id="sunDomeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFDE7" />
            <Stop offset="30%" stopColor="#FFE082" />
            <Stop offset="75%" stopColor="#FFA000" />
            <Stop offset="100%" stopColor="#E65100" />
          </SvgLinearGradient>
        </Defs>

        {/* 1. Luminous Solar Backdrop Glow */}
        <Ellipse cx="34" cy="22" rx="28" ry="16" fill="url(#sunAuraBackdrop)" />

        {/* 2. 21 Radiating Sun Rays (Spreading upwards symmetrically) */}
        <G>
          {SUN_RAYS.map((ray, index) => (
            <Path
              key={`ray-${index}`}
              d={ray.d}
              fill={ray.isPrimary ? "url(#sunRayPrimary)" : "url(#sunRaySecondary)"}
            />
          ))}
        </G>

        {/* 3. Rising Semicircular Half-Sun Dome */}
        <Path d="M 23.5 27 A 10.5 10.5 0 0 1 44.5 27 Z" fill="url(#sunDomeGrad)" />

        {/* 4. Inner Luminous Core Arc */}
        <Path d="M 26 27 A 8 8 0 0 1 42 27 Z" fill="#FFFDE7" opacity={0.45} />

        {/* 5. Base Horizon Line */}
        <Line x1="16" y1="27.2" x2="52" y2="27.2" stroke="#E65100" strokeWidth="0.8" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
});

export default ChhathPujaHalfSun;

