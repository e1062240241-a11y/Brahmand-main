import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
  AppState,
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
// Designed with an unmistakably wide, deep 3D open mouth revealing
// inner radiant gold cavity, with mango leaves framing the sides.
// -------------------------------------------------------------
interface OpenMouthKalashSvgProps {
  width?: number;
  height?: number;
}

const OpenMouthKalashSvg = React.memo(function OpenMouthKalashSvg({
  width = 36,
  height = 40,
}: OpenMouthKalashSvgProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 48 52">
      <Defs>
        {/* Pot Belly Golden Radial Gradient */}
        <SvgRadialGradient id="kalashGoldBelly" cx="35%" cy="38%" r="65%">
          <Stop offset="0%" stopColor="#FFFDE7" />
          <Stop offset="25%" stopColor="#FFD54F" />
          <Stop offset="65%" stopColor="#FFA000" />
          <Stop offset="90%" stopColor="#E65100" />
          <Stop offset="100%" stopColor="#BF360C" />
        </SvgRadialGradient>

        {/* Front Rolled Lip Golden Gradient */}
        <SvgLinearGradient id="goldenFrontLipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFE082" />
          <Stop offset="25%" stopColor="#FFFDE7" />
          <Stop offset="50%" stopColor="#FFD54F" />
          <Stop offset="80%" stopColor="#FFA000" />
          <Stop offset="100%" stopColor="#E65100" />
        </SvgLinearGradient>

        {/* Deep Hollow Cavity Gradient (Dark Depth transitioning to Gold) */}
        <SvgRadialGradient id="mouthInteriorCavity" cx="50%" cy="25%" r="65%">
          <Stop offset="0%" stopColor="#220B00" />
          <Stop offset="45%" stopColor="#542100" />
          <Stop offset="80%" stopColor="#9C4D00" />
          <Stop offset="100%" stopColor="#E67E22" />
        </SvgRadialGradient>

        {/* Glowing Gold Reservoir on Cavity Floor */}
        <SvgRadialGradient id="insideGoldGlow" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="30%" stopColor="#FFF9C4" />
          <Stop offset="70%" stopColor="#FFD54F" />
          <Stop offset="100%" stopColor="#FF8F00" />
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
          <Stop offset="55%" stopColor="#2E7D32" />
          <Stop offset="100%" stopColor="#4CAF50" />
        </SvgLinearGradient>
        <SvgLinearGradient id="leafGradLight" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#2E7D32" />
          <Stop offset="60%" stopColor="#43A047" />
          <Stop offset="100%" stopColor="#81C784" />
        </SvgLinearGradient>
      </Defs>

      {/* 1. Pedestal Base */}
      <Path
        d="M 15 44 C 15 42.5, 33 42.5, 33 44 L 32 48.5 C 32 49.5, 16 49.5, 16 48.5 Z"
        fill="url(#kalashBaseGrad)"
        stroke="#E65100"
        strokeWidth="0.5"
      />

      {/* 2. Mango Leaves (Amra Pallav) framing outward to the sides - opening remains clear */}
      {/* Top-left spreading leaf */}
      <Path
        d="M 17 14 C 11 8, 8 2, 9 0 C 12 3, 15 8, 18 14 Z"
        fill="url(#leafGradLight)"
      />
      <Line x1="9" y1="0.5" x2="17.5" y2="14" stroke="#C8E6C9" strokeWidth="0.5" opacity={0.8} />

      {/* Top-right spreading leaf */}
      <Path
        d="M 31 14 C 37 8, 40 2, 39 0 C 36 3, 33 8, 30 14 Z"
        fill="url(#leafGradLight)"
      />
      <Line x1="39" y1="0.5" x2="30.5" y2="14" stroke="#C8E6C9" strokeWidth="0.5" opacity={0.8} />

      {/* Mid-left outward leaf */}
      <Path
        d="M 16 16 C 9 13, 3 13, 0 14.5 C 3 17, 8 18.5, 16 18 Z"
        fill="url(#leafGradDark)"
      />

      {/* Mid-right outward leaf */}
      <Path
        d="M 32 16 C 39 13, 45 13, 48 14.5 C 45 17, 40 18.5, 32 18 Z"
        fill="url(#leafGradDark)"
      />

      {/* Lower-left leaf */}
      <Path
        d="M 17 19 C 9 18, 4 20, 1 23 C 5 24, 11 23, 17 21 Z"
        fill="url(#leafGradDark)"
      />

      {/* Lower-right leaf */}
      <Path
        d="M 31 19 C 39 18, 44 20, 47 23 C 43 24, 37 23, 31 21 Z"
        fill="url(#leafGradDark)"
      />

      {/* 3. Kalash Pot Body (Lota/Kumbha belly) */}
      <Path
        d="M 14 16 C 5 22, 4 35, 9.5 41.5 C 13.5 45, 34.5 45, 38.5 41.5 C 44 35, 43 22, 34 16 Z"
        fill="url(#kalashGoldBelly)"
        stroke="#FFA000"
        strokeWidth="0.8"
      />

      {/* Belly Left Highlight Sheen */}
      <Path
        d="M 10 24 C 7.5 29, 8.5 35, 13.5 39"
        stroke="rgba(255, 255, 255, 0.48)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* 4. Sacred Swastika (卐) on the Belly */}
      <Path
        d="M 24 26 L 24 35 M 19.5 30.5 L 28.5 30.5 M 24 26 L 27.5 26 M 24 35 L 20.5 35 M 19.5 30.5 L 19.5 27 M 28.5 30.5 L 28.5 34"
        stroke="#C62828"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 4 Auspicious Bindus */}
      <Circle cx="21.8" cy="28.5" r="0.7" fill="#C62828" />
      <Circle cx="26.2" cy="28.5" r="0.7" fill="#C62828" />
      <Circle cx="21.8" cy="32.5" r="0.7" fill="#C62828" />
      <Circle cx="26.2" cy="32.5" r="0.7" fill="#C62828" />

      {/* 5. Sacred Mauli/Kalava Thread (Red & Gold) around the neck */}
      <Rect x="14" y="14" width="20" height="3" rx="1.5" fill="#C62828" />
      <Line x1="18" y1="14" x2="18" y2="17" stroke="#FFE082" strokeWidth="0.8" />
      <Line x1="24" y1="14" x2="24" y2="17" stroke="#FFE082" strokeWidth="0.8" />
      <Line x1="30" y1="14" x2="30" y2="17" stroke="#FFE082" strokeWidth="0.8" />

      {/* 6. CLEARLY VISIBLE OPEN MOUTH (स्पष्ट खुला मुख) */}
      {/* Back Inner Rim Curve */}
      <Path
        d="M 9 10.5 C 9 4, 39 4, 39 10.5"
        stroke="#FFA000"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Deep 3D Hollow Interior Cavity of the Open Mouth */}
      <Ellipse
        cx="24"
        cy="10.5"
        rx="14.2"
        ry="6.0"
        fill="url(#mouthInteriorCavity)"
      />

      {/* Radiant Golden Glow inside the mouth depth where coins are created */}
      <Ellipse
        cx="24"
        cy="11.5"
        rx="10.5"
        ry="3.8"
        fill="url(#insideGoldGlow)"
      />
      {/* Subtle interior gold ripple contours */}
      <Ellipse cx="20.5" cy="11.2" rx="4.5" ry="1.6" fill="none" stroke="#FFE082" strokeWidth="0.5" opacity={0.8} />
      <Ellipse cx="27.5" cy="11.0" rx="4.2" ry="1.5" fill="none" stroke="#FFE082" strokeWidth="0.5" opacity={0.8} />

      {/* Front Rim Lip (Thick 3D Metallic Golden Flared Lip) */}
      <Path
        d="M 8.5 10.5 C 8.5 17.5, 39.5 17.5, 39.5 10.5"
        stroke="url(#goldenFrontLipGrad)"
        strokeWidth="3.0"
        strokeLinecap="round"
        fill="none"
      />

      {/* Glistening Highlight on Front Lip Crest */}
      <Path
        d="M 12 11.8 C 15 16, 33 16, 36 11.8"
        stroke="#FFFFFF"
        strokeWidth="1.0"
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
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
// Configuration: Continuous Streaming Coins Emerging from Inside Mouth
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
  { id: 1, startDelay: 0, duration: 1800, driftX: -5, fallDistance: 56, spinDeg: 320, coinSize: 11 },
  { id: 2, startDelay: 260, duration: 2000, driftX: 6, fallDistance: 58, spinDeg: -340, coinSize: 12 },
  { id: 3, startDelay: 520, duration: 1700, driftX: -10, fallDistance: 54, spinDeg: 360, coinSize: 10 },
  { id: 4, startDelay: 780, duration: 2100, driftX: 2, fallDistance: 60, spinDeg: -280, coinSize: 13 },
  { id: 5, startDelay: 1040, duration: 1850, driftX: 9, fallDistance: 55, spinDeg: 380, coinSize: 11 },
  { id: 6, startDelay: 1300, duration: 1950, driftX: -4, fallDistance: 62, spinDeg: -360, coinSize: 12 },
  { id: 7, startDelay: 1560, duration: 1750, driftX: 11, fallDistance: 52, spinDeg: 300, coinSize: 10 },
];

interface BurstCoinConfig {
  id: number;
  driftX: number;
  fallDistance: number;
  spinDeg: number;
  coinSize: number;
}

const BURST_COINS: BurstCoinConfig[] = [
  { id: 101, driftX: -12, fallDistance: 56, spinDeg: 460, coinSize: 13 },
  { id: 102, driftX: -3, fallDistance: 64, spinDeg: -520, coinSize: 14 },
  { id: 103, driftX: 7, fallDistance: 60, spinDeg: 420, coinSize: 12 },
  { id: 104, driftX: 15, fallDistance: 54, spinDeg: -380, coinSize: 13 },
];

// -------------------------------------------------------------
// Component: Self-Contained Continuous Falling Coin
// Manages its own animation: emerges from deep inside the open mouth cavity,
// rises slightly over the front rim lip, then cascades down in front.
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
    return () => {
      loop.stop();
      anim.stopAnimation();
    };
  }, [anim, cfg]);

  // Y trajectory: starts inside cavity (-3), rises slightly over lip (3), then falls down (fallDistance)
  const translateY = anim.interpolate({
    inputRange: [0, 0.14, 0.45, 1],
    outputRange: [-3, 3, 26, cfg.fallDistance],
  });

  // Natural gentle horizontal drift
  const translateX = anim.interpolate({
    inputRange: [0, 0.14, 0.5, 1],
    outputRange: [0, cfg.driftX * 0.2, cfg.driftX * 0.6, cfg.driftX],
  });

  // 3D tumble flip
  const scaleX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.2, 1, 0.2, 1],
  });

  // Rotation around Z-axis
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${cfg.spinDeg}deg`],
  });

  // Emerges small from cavity floor, expands to full size over rim, then slightly scales down with depth
  const scale = anim.interpolate({
    inputRange: [0, 0.14, 0.7, 1],
    outputRange: [0.35, 1, 0.95, 0.75],
  });

  // Fades in right inside cavity, fully visible as it pours, fades out at the bottom
  const opacity = anim.interpolate({
    inputRange: [0, 0.08, 0.82, 1],
    outputRange: [0, 1, 0.95, 0],
  });

  const halfSize = Math.round(cfg.coinSize / 2);

  return (
    <Animated.View
      style={[
        styles.fallingCoin,
        {
          left: -halfSize,
          top: -halfSize,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scale },
          ],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scaleX }] }}>
        <GoldCoin size={cfg.coinSize} />
      </Animated.View>
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
    return () => {
      burst.stop();
      bAnim.stopAnimation();
    };
  }, [bAnim, delay]);

  const translateY = bAnim.interpolate({
    inputRange: [0, 0.14, 0.5, 1],
    outputRange: [-3, 4, 28, cfg.fallDistance],
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

  const scale = bAnim.interpolate({
    inputRange: [0, 0.14, 0.7, 1],
    outputRange: [0.4, 1.05, 0.95, 0.8],
  });

  const opacity = bAnim.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [0, 1, 0.95, 0],
  });

  const halfSize = Math.round(cfg.coinSize / 2);

  return (
    <Animated.View
      style={[
        styles.fallingCoin,
        {
          left: -halfSize,
          top: -halfSize,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scale },
          ],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scaleX }] }}>
        <GoldCoin size={cfg.coinSize} />
      </Animated.View>
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
    size = Platform.OS === 'android' ? 34 : 38,
    onPress,
  }: KalashCoinAnimationProps) {
    // 1. Kalash Divine Hover & Gentle Natural Sway
    const kalashHoverY = useRef(new Animated.Value(0)).current;
    const kalashTilt = useRef(new Animated.Value(0)).current;
    const kalashScale = useRef(new Animated.Value(1)).current;
    const auraPulse = useRef(new Animated.Value(0.4)).current;

    // 2. Sparkle Twinkle Animations at the mouth rim
    const sparkleAnim1 = useRef(new Animated.Value(0)).current;
    const sparkleAnim2 = useRef(new Animated.Value(0)).current;

    // 3. Tap Burst State & AppState Pause Guard
    const [burstKey, setBurstKey] = useState(0);
    const [isBursting, setIsBursting] = useState(false);
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
    const burstTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Pause heavy continuous stream rendering when app is backgrounded to protect memory & CPU
    useEffect(() => {
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        setIsAppActive(nextAppState === 'active');
      });
      return () => {
        subscription.remove();
        if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      };
    }, []);

    // --- Continuous Looping Animation for Kalash Floating & Aura ---
    useEffect(() => {
      const hoverLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(kalashHoverY, {
            toValue: -1.5,
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
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(kalashTilt, {
            toValue: 0,
            duration: 2200,
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
        kalashHoverY.stopAnimation();
        kalashTilt.stopAnimation();
        auraPulse.stopAnimation();
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
        sparkleAnim1.stopAnimation();
        sparkleAnim2.stopAnimation();
      };
    }, [sparkleAnim1, sparkleAnim2]);

    // --- Interactive Tap Shower Handler ---
    const handlePress = useCallback(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}

      // Joyful Kalash bounce & slight pour nod
      Animated.sequence([
        Animated.parallel([
          Animated.spring(kalashScale, {
            toValue: 1.15,
            friction: 4,
            tension: 180,
            useNativeDriver: true,
          }),
          Animated.timing(kalashTilt, {
            toValue: 1.8,
            duration: 150,
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
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Trigger Burst of Extra Gold Coins Shower
      setBurstKey((prev) => prev + 1);
      setIsBursting(true);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(() => {
        setIsBursting(false);
      }, 1400);

      if (onPress) onPress();
    }, [kalashScale, kalashTilt, onPress]);

    // Kalash rests upright with subtle natural sway (0deg to -3deg), slight nod on tap (-8deg)
    const kalashRotate = kalashTilt.interpolate({
      inputRange: [0, 1, 1.8],
      outputRange: ['0deg', '-3deg', '-8deg'],
    });

    const kalashWidth = size;
    const kalashHeight = Math.round(size * (52 / 48));

    // Center of open mouth cavity in viewBox="0 0 48 52":
    // Mouth center is at x = 24 (50%) and y = 10.5 (20.2% from top)
    const mouthEmitterLeft = Math.round(kalashWidth * 0.5);
    const mouthEmitterTop = Math.round(kalashHeight * 0.20);

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
          activeOpacity={0.88}
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
              deep open mouth cavity coordinates (mouthEmitterLeft, mouthEmitterTop).
              Coins emerge directly from inside the open mouth!
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
              {/* Continuous Stream of Coins Emerging from Inside the Open Mouth (active when app active) */}
              {isAppActive &&
                STREAM_COINS.map((cfg) => (
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
    width: 38,
    height: 42,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  mouthSparkle1: {
    position: 'absolute',
    top: -6,
    left: -14,
  },
  mouthSparkle2: {
    position: 'absolute',
    top: -2,
    right: -14,
  },
});

export default KalashCoinAnimation;
