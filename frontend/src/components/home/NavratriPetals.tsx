import React from 'react';
import { Animated, Dimensions, Easing, View } from 'react-native';

// ponytail: date-gated petals, delete after 2026-10-21. Auto-stops after ~15s.
const START = new Date('2026-10-10T00:00:00').getTime();
const END = new Date('2026-10-21T00:00:00').getTime();

export function isNavratriActive(now: number = Date.now()) {
  return now >= START && now < END;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AREA_H = 300;
const COLORS = ['#FFB703', '#E76F51', '#FF595E', '#F4A261', '#FBBF24'];

interface Spec {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: string;
}

function Petal({ spec }: { spec: Spec }) {
  const [fall] = React.useState(() => new Animated.Value(0));

  React.useEffect(() => {
    const anim = Animated.timing(fall, {
      toValue: 1,
      duration: spec.duration,
      delay: spec.delay,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fall, spec.duration, spec.delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-24, AREA_H + 24] });
  const translateX = fall.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, spec.drift, -spec.drift, spec.drift * 0.6, 0],
  });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', spec.spin] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: spec.left,
        top: 0,
        opacity: 0.9,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    >
      <View
        style={{
          width: spec.size,
          height: spec.size * 0.7,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        }}
      />
    </Animated.View>
  );
}

export const NavratriPetals = React.memo(function NavratriPetals() {
  const [done, setDone] = React.useState(false);
  const specs = React.useMemo<Spec[]>(() => {
    const count = SCREEN_WIDTH < 380 ? 14 : 20;
    return Array.from({ length: count }, () => ({
      left: Math.random() * (SCREEN_WIDTH - 16),
      size: 7 + Math.random() * 6,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      delay: Math.random() * 4000,
      duration: 6000 + Math.random() * 5000,
      drift: 8 + Math.random() * 14,
      spin: `${180 + Math.random() * 360}deg`,
    }));
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setDone(true), 15000);
    return () => clearTimeout(t);
  }, []);

  if (!isNavratriActive() || done) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: AREA_H,
        overflow: 'hidden',
        zIndex: 999,
        elevation: 999,
      }}
    >
      {specs.map((spec, i) => (
        <Petal key={i} spec={spec} />
      ))}
    </View>
  );
});
