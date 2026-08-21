import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedGoldKathaTitleProps {
  title: string;
}

/* Devotional Banner Title Stack:
 * #1 Animated Gold-Gradient Text + #4 Layered Text-Shadow Glow + #10 Subtle Breathing Animation + #8 Clamp Sizing
 */
export const AnimatedGoldKathaTitle = React.memo(({ title }: AnimatedGoldKathaTitleProps) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [breatheAnim]);

  const scale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  const glowOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  // Clamp() Sizing (#8): responsive font size bounded between 22px and 28px
  const fontSize = Math.min(Math.max(SCREEN_WIDTH * 0.062, 22), 28);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Layered Text-Shadow Glow Background (#4) */}
      <Animated.Text
        style={{
          fontSize,
          fontWeight: '800',
          color: '#8B4513',
          textShadowColor: 'rgba(255, 215, 0, 0.85)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 10,
          opacity: glowOpacity,
          textAlign: 'center',
          letterSpacing: 0.6,
        }}
      >
        {title}
      </Animated.Text>
    </Animated.View>
  );
});
