import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Circle,
  Ellipse,
  Rect,
  Line,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// -------------------------------------------------------------
// Component: Auspicious Vedic Gold Coin (स्वर्ण मुद्रा)
// -------------------------------------------------------------
interface GoldCoinProps {
  size?: number;
}

const GoldCoin = React.memo(function GoldCoin({ size = 12 }: GoldCoinProps) {
  const uniqueId = React.useId().replace(/:/g, '_');
  const radGradId = `coinRadGrad_${uniqueId}`;
  const rimGradId = `coinRimGrad_${uniqueId}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Defs>
        <SvgRadialGradient id={radGradId} cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#FFFDE7" />
          <Stop offset="30%" stopColor="#FFE082" />
          <Stop offset="70%" stopColor="#FFA000" />
          <Stop offset="100%" stopColor="#E65100" />
        </SvgRadialGradient>
        <SvgLinearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF9C4" />
          <Stop offset="50%" stopColor="#FFB300" />
          <Stop offset="100%" stopColor="#BF360C" />
        </SvgLinearGradient>
      </Defs>

      {/* Outer Coin Edge with Milled Rim */}
      <Circle
        cx="9"
        cy="9"
        r="8.2"
        fill={`url(#${radGradId})`}
        stroke={`url(#${rimGradId})`}
        strokeWidth="1"
      />

      {/* Inner Embossed Ring */}
      <Circle
        cx="9"
        cy="9"
        r="6.3"
        fill="none"
        stroke="#FFF8E1"
        strokeWidth="0.6"
        strokeDasharray="1.2,0.9"
        opacity={0.88}
      />

      {/* Sacred 8-Point Lakshmi Star of Abundance (अष्टलक्ष्मी प्रतीक) */}
      <Path
        d="M 9 4.8 L 10.3 7.5 L 13.2 9 L 10.3 10.5 L 9 13.2 L 7.7 10.5 L 4.8 9 L 7.7 7.5 Z"
        fill="#FFF9C4"
        opacity={0.95}
      />
      <Circle cx="9" cy="9" r="1.5" fill="#E65100" />
      <Circle cx="9" cy="9" r="0.8" fill="#FFFDE7" />

      {/* Top Specular Arc Highlight */}
      <Path
        d="M 5 4.5 C 6.8 3.4 10.8 3.4 12.8 4.6"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
    </Svg>
  );
});

// -------------------------------------------------------------
// Component: Open-Mouth Sacred Kalash (खुले मुख वाला स्वर्ण कलश)
// Designed with a wide open 3D mouth revealing inner golden cavity,
// with mango leaves framing the sides without obstructing the opening.
// -------------------------------------------------------------
interface OpenMouthKalashSvgProps {
  width?: number;
  height?: number;
}

const OpenMouthKalashSvg = React.memo(function OpenMouthKalashSvg({
  width = 34,
  height = 38,
}: OpenMouthKalashSvgProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 46 50">
      <Defs>
        {/* Pot Belly Golden Radial Gradient */}
        <SvgRadialGradient id="kalashGoldBelly" cx="35%" cy="40%" r="65%">
          <Stop offset="0%" stopColor="#FFF9C4" />
          <Stop offset="25%" stopColor="#FFD54F" />
          <Stop offset="65%" stopColor="#FFA000" />
          <Stop offset="90%" stopColor="#E65100" />
          <Stop offset="100%" stopColor="#BF360C" />
        </SvgRadialGradient>

        {/* Outer Rim Lip Gradient */}
        <SvgLinearGradient id="goldenLipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFE082" />
          <Stop offset="30%" stopColor="#FFF9C4" />
          <Stop offset="70%" stopColor="#FFD54F" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </SvgLinearGradient>

        {/* Inner Mouth Hollow Shadow Gradient */}
        <SvgRadialGradient id="mouthInteriorCavity" cx="50%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#3E1E00" />
          <Stop offset="45%" stopColor="#6D3B00" />
          <Stop offset="80%" stopColor="#B26500" />
          <Stop offset="100%" stopColor="#FFB300" />
        </SvgRadialGradient>

        {/* Glowing Gold Pile inside the Mouth */}
        <SvgRadialGradient id="insideGoldGlow" cx="45%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#FFFDE7" />
          <Stop offset="40%" stopColor="#FFD54F" />
          <Stop offset="85%" stopColor="#FFA000" />
          <Stop offset="100%" stopColor="#E65100" />
        </SvgRadialGradient>

        {/* Base Pedestal Gradient */}
        <SvgLinearGradient id="kalashBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFA000" />
          <Stop offset="50%" stopColor="#FFE082" />
          <Stop offset="100%" stopColor="#E65100" />
        </SvgLinearGradient>

        {/* Mango Leaves Gradients */}
        <SvgLinearGradient id="leafGradDark" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#1B5E20" />
          <Stop offset="50%" stopColor="#2E7D32" />
          <Stop offset="100%" stopColor="#4CAF50" />
        </SvgLinearGradient>
        <SvgLinearGradient id="leafGradLight" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#2E7D32" />
          <Stop offset="60%" stopColor="#43A047" />
          <Stop offset="100%" stopColor="#81C784" />
        </SvgLinearGradient>

        {/* Overspill Coin Gradient */}
        <SvgRadialGradient id="peekCoinGrad" cx="35%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#FFFDE7" />
          <Stop offset="55%" stopColor="#FFD54F" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </SvgRadialGradient>
      </Defs>

      {/* 1. Pedestal Base */}
      <Path
        d="M 15.5 43 C 15.5 41.5, 30.5 41.5, 30.5 43 L 29.5 46.5 C 29.5 47.5, 16.5 47.5, 16.5 46.5 Z"
        fill="url(#kalashBaseGrad)"
        stroke="#E65100"
        strokeWidth="0.5"
      />

      {/* 2. Mango Leaves (Amra Pallav) framing the neck without blocking the open mouth */}
      {/* Upper-left leaf */}
      <Path
        d="M 15 13 C 10.5 7, 9.5 2, 11 0 C 13.5 3.5, 15 8, 16 13 Z"
        fill="url(#leafGradLight)"
      />
      <Line x1="11" y1="1" x2="15.5" y2="13" stroke="#C8E6C9" strokeWidth="0.5" opacity={0.8} />

      {/* Upper-right leaf */}
      <Path
        d="M 31 13 C 35.5 7, 36.5 2, 35 0 C 32.5 3.5, 31 8, 30 13 Z"
        fill="url(#leafGradLight)"
      />
      <Line x1="35" y1="1" x2="30.5" y2="13" stroke="#C8E6C9" strokeWidth="0.5" opacity={0.8} />

      {/* Mid-left spreading leaf */}
      <Path
        d="M 14 15 C 8 11.5, 4 11, 1 12 C 4 14.5, 9 16, 14 16.5 Z"
        fill="url(#leafGradDark)"
      />

      {/* Mid-right spreading leaf */}
      <Path
        d="M 32 15 C 38 11.5, 42 11, 45 12 C 42 14.5, 37 16, 32 16.5 Z"
        fill="url(#leafGradDark)"
      />

      {/* Lower-left leaf */}
      <Path
        d="M 15 17 C 8 16, 4 17.5, 1 20 C 5 21, 10 20, 15 18.5 Z"
        fill="url(#leafGradDark)"
      />

      {/* Lower-right leaf */}
      <Path
        d="M 31 17 C 38 16, 42 17.5, 45 20 C 41 21, 36 20, 31 18.5 Z"
        fill="url(#leafGradDark)"
      />

      {/* 3. Kalash Pot Body (Lota/Kumbha belly) */}
      <Path
        d="M 16 17 C 7.5 23, 6.5 34.5, 11.5 40.5 C 15 43.5, 31 43.5, 34.5 40.5 C 39.5 34.5, 38.5 23, 30 17 Z"
        fill="url(#kalashGoldBelly)"
        stroke="#FFA000"
        strokeWidth="0.8"
      />

      {/* Belly Left Highlight Sheen */}
      <Path
        d="M 11.5 24 C 8.5 29, 9.5 35, 14.5 39"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />

      {/* 4. Sacred Swastika (卐) on the Belly */}
      <Path
        d="M 23 26 L 23 35 M 18.5 30.5 L 27.5 30.5 M 23 26 L 26.5 26 M 23 35 L 19.5 35 M 18.5 30.5 L 18.5 27 M 27.5 30.5 L 27.5 34"
        stroke="#C62828"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 4 Auspicious Bindus */}
      <Circle cx="20.8" cy="28.5" r="0.7" fill="#C62828" />
      <Circle cx="25.2" cy="28.5" r="0.7" fill="#C62828" />
      <Circle cx="20.8" cy="32.5" r="0.7" fill="#C62828" />
      <Circle cx="25.2" cy="32.5" r="0.7" fill="#C62828" />

      {/* 5. Sacred Mauli/Kalava Thread (Red & Gold) around the neck */}
      <Rect x="15.5" y="14.5" width="15" height="3" rx="1.5" fill="#C62828" />
      <Line x1="18.5" y1="14.5" x2="18.5" y2="17.5" stroke="#FFE082" strokeWidth="0.8" />
      <Line x1="23" y1="14.5" x2="23" y2="17.5" stroke="#FFE082" strokeWidth="0.8" />
      <Line x1="27.5" y1="14.5" x2="27.5" y2="17.5" stroke="#FFE082" strokeWidth="0.8" />

      {/* 6. OPEN MOUTH (खुला मुख) - Deep 3D Hollow Opening */}
      {/* Back Rim Lip */}
      <Path
        d="M 11 11 C 11 6.5, 35 6.5, 35 11"
        stroke="#FFB300"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Deep Hollow Interior Cavity of the Open Mouth */}
      <Ellipse
        cx="23"
        cy="11"
        rx="11.2"
        ry="4.2"
        fill="url(#mouthInteriorCavity)"
      />

      {/* Glowing Liquid Gold & Heap of Coins inside the open mouth */}
      <Ellipse
        cx="23"
        cy="11.5"
        rx="8.5"
        ry="2.8"
        fill="url(#insideGoldGlow)"
      />
      {/* Inner coin edge embossing */}
      <Ellipse cx="19.5" cy="11.2" rx="3.5" ry="1.2" fill="#FFE082" stroke="#FF8F00" strokeWidth="0.4" />
      <Ellipse cx="26.5" cy="11" rx="3.8" ry="1.3" fill="#FFF59D" stroke="#FF8F00" strokeWidth="0.4" />
      <Ellipse cx="23" cy="12" rx="4.2" ry="1.4" fill="#FFD54F" stroke="#E65100" strokeWidth="0.4" />

      {/* Front Rim Lip (Thick 3D Metallic Golden Lip) */}
      <Path
        d="M 11 11 C 11 15.8, 35 15.8, 35 11"
        stroke="url(#goldenLipGrad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Glistening Highlight on Front Lip */}
      <Path
        d="M 13.5 12.5 C 16.5 14.8, 29.5 14.8, 32.5 12.5"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />

      {/* 7. Shimmering Gold Coins Peeking / Overflowing right at the Rim Lip */}
      <Circle cx="17.5" cy="13" r="3.2" fill="url(#peekCoinGrad)" stroke="#FFE082" strokeWidth="0.5" />
      <Circle cx="27.5" cy="13.2" r="3.4" fill="url(#peekCoinGrad)" stroke="#FFF9C4" strokeWidth="0.5" />
      <Circle cx="22.5" cy="14.2" r="3.5" fill="url(#peekCoinGrad)" stroke="#FFE082" strokeWidth="0.5" />
      <Circle cx="22.5" cy="14.2" r="1.5" fill="#E65100" opacity={0.6} />
    </Svg>
  );
});

// -------------------------------------------------------------
// Component: Twinkling Celestial Sparkle (दिव्य चमक)
// -------------------------------------------------------------
const SparkleStar = React.memo(function SparkleStar({
  size = 8,
  color = '#FFF9C4',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M 8 0 C 8 4, 12 8, 16 8 C 12 8, 8 12, 8 16 C 8 12, 4 8, 0 8 C 4 8, 8 4, 8 0 Z"
        fill={color}
      />
      <Circle cx="8" cy="8" r="1.6" fill="#FFFFFF" />
    </Svg>
  );
});

// -------------------------------------------------------------
// Configuration: Continuous Streaming Coins from Open Mouth
// -------------------------------------------------------------
interface StreamCoinConfig {
  id: number;
  startDelay: number;
  duration: number;
  driftX: number;
  fallDistance: number;
  spinDeg: number;
  coinSize: number;
}

const STREAM_COINS: StreamCoinConfig[] = [
  { id: 1, startDelay: 0, duration: 1750, driftX: -6, fallDistance: 54, spinDeg: 320, coinSize: 11 },
  { id: 2, startDelay: 220, duration: 1950, driftX: 6, fallDistance: 58, spinDeg: -340, coinSize: 12 },
  { id: 3, startDelay: 440, duration: 1650, driftX: -12, fallDistance: 52, spinDeg: 360, coinSize: 10 },
  { id: 4, startDelay: 680, duration: 2050, driftX: 2, fallDistance: 60, spinDeg: -280, coinSize: 13 },
  { id: 5, startDelay: 920, duration: 1800, driftX: 9, fallDistance: 55, spinDeg: 380, coinSize: 11 },
  { id: 6, startDelay: 1160, duration: 1900, driftX: -4, fallDistance: 62, spinDeg: -360, coinSize: 12 },
  { id: 7, startDelay: 1400, duration: 1700, driftX: 12, fallDistance: 51, spinDeg: 300, coinSize: 10 },
  { id: 8, startDelay: 1640, duration: 2000, driftX: -8, fallDistance: 57, spinDeg: -320, coinSize: 12 },
];

interface BurstCoinConfig {
  id: number;
  driftX: number;
  fallDistance: number;
  spinDeg: number;
  coinSize: number;
}

const BURST_COINS: BurstCoinConfig[] = [
  { id: 101, driftX: -14, fallDistance: 58, spinDeg: 460, coinSize: 13 },
  { id: 102, driftX: -3, fallDistance: 65, spinDeg: -520, coinSize: 14 },
  { id: 103, driftX: 8, fallDistance: 62, spinDeg: 420, coinSize: 12 },
  { id: 104, driftX: 18, fallDistance: 56, spinDeg: -380, coinSize: 13 },
];

// -------------------------------------------------------------
// Component: Self-Contained Continuous Falling Coin
// Manages its own Animated.Value safely (immune to Fast Refresh issues)
// -------------------------------------------------------------
const FallingStreamCoin = React.memo(function FallingStreamCoin({
  cfg,
}: {
  cfg: StreamCoinConfig;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const loop = Animated.sequence([
      Animated.delay(cfg.startDelay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: cfg.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [anim, cfg]);

  const translateY = anim.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [-2, 5, cfg.fallDistance],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, cfg.driftX * 0.3, cfg.driftX],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${cfg.spinDeg}deg`],
  });

  const scaleX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.22, 1, 0.22, 1],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.12, 0.7, 1],
    outputRange: [0.28, 1, 0.95, 0.8],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.08, 0.8, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  return (
    <Animated.View
      style={[
        styles.fallingCoin,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scaleX },
            { scale },
          ],
        },
      ]}
    >
      <GoldCoin size={cfg.coinSize} />
    </Animated.View>
  );
});

// -------------------------------------------------------------
// Component: Self-Contained Tap Burst Coin
// -------------------------------------------------------------
const BurstStreamCoin = React.memo(function BurstStreamCoin({
  cfg,
  delay,
}: {
  cfg: BurstCoinConfig;
  delay: number;
}) {
  const bAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const burst = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(bAnim, {
        toValue: 1,
        duration: 1050,
        useNativeDriver: true,
      }),
    ]);
    burst.start();
    return () => burst.stop();
  }, [bAnim, delay]);

  const translateY = bAnim.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [-2, 6, cfg.fallDistance],
  });

  const translateX = bAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, cfg.driftX * 0.35, cfg.driftX],
  });

  const rotate = bAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${cfg.spinDeg}deg`],
  });

  const scaleX = bAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.2, 1, 0.2, 1],
  });

  const opacity = bAnim.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 0.95, 0],
  });

  return (
    <Animated.View
      style={[
        styles.fallingCoin,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scaleX },
          ],
        },
      ]}
    >
      <GoldCoin size={cfg.coinSize} />
    </Animated.View>
  );
});

// -------------------------------------------------------------
// Main Component: KalashCoinAnimation
// -------------------------------------------------------------
interface KalashCoinAnimationProps {
  size?: number;
  onPress?: () => void;
}

export const KalashCoinAnimation: React.FC<KalashCoinAnimationProps> = React.memo(
  function KalashCoinAnimation({
    size = Platform.OS === 'android' ? 32 : 36,
    onPress,
  }: KalashCoinAnimationProps) {
    // 1. Kalash Idle Hover & Gentle Tilting Animation Values
    const kalashHoverY = useRef(new Animated.Value(0)).current;
    const kalashTilt = useRef(new Animated.Value(0)).current;
    const kalashScale = useRef(new Animated.Value(1)).current;
    const auraPulse = useRef(new Animated.Value(0.4)).current;

    // 2. Sparkle Twinkle Animations
    const sparkleAnim1 = useRef(new Animated.Value(0)).current;
    const sparkleAnim2 = useRef(new Animated.Value(0)).current;

    // 3. Tap Burst State
    const [burstKey, setBurstKey] = useState(0);
    const [isBursting, setIsBursting] = useState(false);

    // --- Continuous Looping Animation for Kalash Floating & Aura ---
    useEffect(() => {
      const hoverLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(kalashHoverY, {
            toValue: -2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(kalashHoverY, {
            toValue: 1.5,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      );

      const tiltLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(kalashTilt, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(kalashTilt, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const auraLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(auraPulse, {
            toValue: 0.85,
            duration: 1700,
            useNativeDriver: true,
          }),
          Animated.timing(auraPulse, {
            toValue: 0.35,
            duration: 1700,
            useNativeDriver: true,
          }),
        ])
      );

      hoverLoop.start();
      tiltLoop.start();
      auraLoop.start();

      return () => {
        hoverLoop.stop();
        tiltLoop.stop();
        auraLoop.stop();
      };
    }, [kalashHoverY, kalashTilt, auraPulse]);

    // --- Sparkle Twinkle Loops at the open mouth rim ---
    useEffect(() => {
      const loop1 = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim1, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim1, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
        ])
      );

      const loop2 = Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(sparkleAnim2, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim2, {
            toValue: 0,
            duration: 1300,
            useNativeDriver: true,
          }),
        ])
      );

      loop1.start();
      loop2.start();

      return () => {
        loop1.stop();
        loop2.stop();
      };
    }, [sparkleAnim1, sparkleAnim2]);

    // --- Interactive Tap Shower Handler ---
    const handlePress = useCallback(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}

      // Joyful Kalash bounce & extra pour tilt
      Animated.sequence([
        Animated.parallel([
          Animated.spring(kalashScale, {
            toValue: 1.18,
            friction: 4,
            tension: 180,
            useNativeDriver: true,
          }),
          Animated.timing(kalashTilt, {
            toValue: 1.8,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(kalashScale, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.timing(kalashTilt, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Trigger Burst of Extra Gold Coins Shower
      setBurstKey((prev) => prev + 1);
      setIsBursting(true);
      setTimeout(() => {
        setIsBursting(false);
      }, 1400);

      if (onPress) onPress();
    }, [kalashScale, kalashTilt, onPress]);

    // Interpolate Kalash Rotation: rests at -12deg pouring angle, tilts to -20deg / -28deg on pour/tap
    const kalashRotate = kalashTilt.interpolate({
      inputRange: [0, 1, 1.8],
      outputRange: ['-12deg', '-20deg', '-28deg'],
    });

    const kalashWidth = size;
    const kalashHeight = Math.round(size * 1.12);

    // Exact mouth emitter coordinates relative to the Kalash:
    // In viewBox="0 0 46 50", mouth is centered at x=23 (50%) and y=11 (22% from top).
    const mouthEmitterLeft = Math.round(kalashWidth * 0.5);
    const mouthEmitterTop = Math.round(kalashHeight * 0.22);

    return (
      <View style={styles.outerContainer} pointerEvents="box-none">
        {/* Soft Divine Golden Glow Aura behind Kalash */}
        <Animated.View
          style={[
            styles.auraGlow,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              opacity: auraPulse,
              transform: [{ scale: auraPulse }],
            },
          ]}
          pointerEvents="none"
        />

        {/* Kalash Touch Target & Animated Vessel */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          style={styles.touchable}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Auspicious Open-Mouth Kalash showering gold coins"
        >
          <Animated.View
            style={[
              styles.kalashWrapper,
              {
                width: kalashWidth,
                height: kalashHeight,
                transform: [
                  { translateY: kalashHoverY },
                  { rotate: kalashRotate },
                  { scale: kalashScale },
                ],
              },
            ]}
          >
            {/* The Open-Mouth Kalash Pot */}
            <OpenMouthKalashSvg width={kalashWidth} height={kalashHeight} />

            {/*
              Coins Emitter Container:
              Critically positioned INSIDE the Kalash wrapper, precisely at the
              open mouth coordinates (mouthEmitterLeft, mouthEmitterTop).
              This guarantees coins ALWAYS emerge from inside the open mouth!
            */}
            <View
              style={[
                styles.mouthCoinsEmitter,
                {
                  left: mouthEmitterLeft,
                  top: mouthEmitterTop,
                },
              ]}
              pointerEvents="none"
            >
              {/* Continuous Stream of Coins Emerging from Inside the Open Mouth */}
              {STREAM_COINS.map((cfg) => (
                <FallingStreamCoin key={cfg.id} cfg={cfg} />
              ))}

              {/* Extra Burst Coins on Tap from Inside the Open Mouth */}
              {isBursting &&
                BURST_COINS.map((cfg, idx) => (
                  <BurstStreamCoin
                    key={`${burstKey}_${cfg.id}`}
                    cfg={cfg}
                    delay={idx * 60}
                  />
                ))}

              {/* Sparkles radiating right from the open mouth rim */}
              <Animated.View
                style={[
                  styles.mouthSparkle1,
                  {
                    opacity: sparkleAnim1,
                    transform: [{ scale: sparkleAnim1 }],
                  },
                ]}
              >
                <SparkleStar size={8} color="#FFFDE7" />
              </Animated.View>

              <Animated.View
                style={[
                  styles.mouthSparkle2,
                  {
                    opacity: sparkleAnim2,
                    transform: [{ scale: sparkleAnim2 }],
                  },
                ]}
              >
                <SparkleStar size={7} color="#FFE082" />
              </Animated.View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }
);

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    width: 36,
    height: 40,
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  kalashWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  auraGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    top: -2,
    left: -4,
  },
  mouthCoinsEmitter: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallingCoin: {
    position: 'absolute',
    // Center the coin on the emitter origin
    left: -7,
    top: -7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mouthSparkle1: {
    position: 'absolute',
    top: -8,
    left: -12,
  },
  mouthSparkle2: {
    position: 'absolute',
    top: 2,
    right: -14,
  },
});

export default KalashCoinAnimation;
