import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Path,
  G,
} from 'react-native-svg';

interface FestiveCardBallsDecorationProps {
  width?: number;
}

/**
 * Authentic Paytm-Style Diwali Box Decoration:
 * Features a traditional Toran (garland) of alternating 3D Yellow and Red Marigold (Genda Phool)
 * pom-pom balls strung across the top edge with decorative hanging corner drops.
 */
export const FestiveCardBallsDecoration: React.FC<FestiveCardBallsDecorationProps> = React.memo(({
  width = 175,
}) => {
  const w = Math.max(width, 150);
  const ballRadius = 4.2;

  // Calculate number of balls to span the top edge
  const startX = 14;
  const endX = w - 14;
  const span = endX - startX;
  const numBalls = Math.max(9, Math.floor(span / 13) + 1);
  const step = span / (numBalls - 1);

  // Top garland balls with gentle 3px hanging curve (festive toran sag)
  const topBalls = [];
  for (let i = 0; i < numBalls; i++) {
    const x = startX + i * step;
    const normalized = (i - (numBalls - 1) / 2) / ((numBalls - 1) / 2);
    const sag = (1 - normalized * normalized) * 3;
    const y = 6 + sag;
    const isYellow = i % 2 === 0;
    topBalls.push({ x, y, isYellow, key: `top-${i}` });
  }

  // Left corner hanging drop (Red, Yellow, Red)
  const leftDrops = [
    { x: 6, y: 14, isYellow: false, key: 'ld-1' },
    { x: 6, y: 22, isYellow: true, key: 'ld-2' },
    { x: 6, y: 30, isYellow: false, key: 'ld-3' },
  ];

  // Right corner hanging drop (Red, Yellow, Red)
  const rightDrops = [
    { x: w - 6, y: 14, isYellow: false, key: 'rd-1' },
    { x: w - 6, y: 22, isYellow: true, key: 'rd-2' },
    { x: w - 6, y: 30, isYellow: false, key: 'rd-3' },
  ];

  // Scalloped path string for connecting garland thread
  const pathD = `M 6 10 Q ${w / 2} 16 ${w - 6} 10`;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={w} height={42} viewBox={`0 0 ${w} 42`}>
        <Defs>
          {/* 3D Auspicious Marigold Yellow Sphere */}
          <RadialGradient id="marigoldYellow" cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFFDE7" />
            <Stop offset="30%" stopColor="#FFD54F" />
            <Stop offset="70%" stopColor="#FFB300" />
            <Stop offset="95%" stopColor="#FF8F00" />
            <Stop offset="100%" stopColor="#E65100" />
          </RadialGradient>

          {/* 3D Auspicious Kumkum Red Sphere */}
          <RadialGradient id="kumkumRed" cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFEBEE" />
            <Stop offset="30%" stopColor="#EF5350" />
            <Stop offset="70%" stopColor="#D32F2F" />
            <Stop offset="95%" stopColor="#B71C1C" />
            <Stop offset="100%" stopColor="#7F0000" />
          </RadialGradient>

          {/* Golden Tassel Bead Gradient */}
          <RadialGradient id="goldBead" cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFF9C4" />
            <Stop offset="50%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#FF8F00" />
          </RadialGradient>
        </Defs>

        {/* Sacred Green Mango Leaf / Ashoka Leaf accents at both corners */}
        <Path
          d="M 6 5 C 1 9, 0 15, 6 18 C 12 15, 11 9, 6 5 Z"
          fill="#2E7D32"
          opacity={0.85}
        />
        <Path
          d={`M ${w - 6} 5 C ${w - 11} 9, ${w - 12} 15, ${w - 6} 18 C ${w} 15, ${w - 1} 9, ${w - 6} 5 Z`}
          fill="#2E7D32"
          opacity={0.85}
        />

        {/* Connecting Festive Garland Thread */}
        <Path
          d={pathD}
          stroke="#4CAF50"
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
        />

        {/* Vertical Side Drop Threads */}
        <Path d="M 6 8 L 6 35" stroke="#4CAF50" strokeWidth={1} />
        <Path d={`M ${w - 6} 8 L ${w - 6} 35`} stroke="#4CAF50" strokeWidth={1} />

        {/* Left Corner Drops */}
        {leftDrops.map((b) => (
          <G key={b.key}>
            <Circle
              cx={b.x}
              cy={b.y}
              r={ballRadius}
              fill={b.isYellow ? 'url(#marigoldYellow)' : 'url(#kumkumRed)'}
            />
            {/* Specular 3D highlight */}
            <Circle
              cx={b.x - 1.2}
              cy={b.y - 1.2}
              r={1.2}
              fill="rgba(255, 255, 255, 0.75)"
            />
          </G>
        ))}

        {/* Golden Tassel Bell on Left Drop */}
        <Circle cx={6} cy={35} r={2.4} fill="url(#goldBead)" />

        {/* Right Corner Drops */}
        {rightDrops.map((b) => (
          <G key={b.key}>
            <Circle
              cx={b.x}
              cy={b.y}
              r={ballRadius}
              fill={b.isYellow ? 'url(#marigoldYellow)' : 'url(#kumkumRed)'}
            />
            {/* Specular 3D highlight */}
            <Circle
              cx={b.x - 1.2}
              cy={b.y - 1.2}
              r={1.2}
              fill="rgba(255, 255, 255, 0.75)"
            />
          </G>
        ))}

        {/* Golden Tassel Bell on Right Drop */}
        <Circle cx={w - 6} cy={35} r={2.4} fill="url(#goldBead)" />

        {/* Top Garland Balls */}
        {topBalls.map((b) => (
          <G key={b.key}>
            <Circle
              cx={b.x}
              cy={b.y}
              r={ballRadius}
              fill={b.isYellow ? 'url(#marigoldYellow)' : 'url(#kumkumRed)'}
            />
            {/* Specular 3D highlight */}
            <Circle
              cx={b.x - 1.2}
              cy={b.y - 1.2}
              r={1.2}
              fill="rgba(255, 255, 255, 0.75)"
            />
          </G>
        ))}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 42,
    zIndex: 10,
    overflow: 'visible',
  },
});

