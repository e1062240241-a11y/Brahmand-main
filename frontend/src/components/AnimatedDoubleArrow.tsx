import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedDoubleArrowProps {
  color?: string;
  size?: number;
}

export const AnimatedDoubleArrow = React.memo(({
  color = '#FF7B00',
  size = 11,
}: AnimatedDoubleArrowProps) => {
  const transX1 = useRef(new Animated.Value(0)).current;
  const transX2 = useRef(new Animated.Value(0)).current;
  const opacity1 = useRef(new Animated.Value(0.65)).current;
  const opacity2 = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    // Chevron 1: subtle nudge forward + opacity glow, return, rest
    const anim1 = Animated.sequence([
      Animated.parallel([
        Animated.timing(transX1, {
          toValue: 4,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity1, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(transX1, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity1, {
          toValue: 0.65,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
    ]);

    // Chevron 2: 70ms trailing delay to create a polished subtle >> wave
    const anim2 = Animated.sequence([
      Animated.delay(70),
      Animated.parallel([
        Animated.timing(transX2, {
          toValue: 4.5,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity2, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(transX2, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity2, {
          toValue: 0.65,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1130),
    ]);

    const loopAnim = Animated.loop(
      Animated.parallel([anim1, anim2])
    );

    loopAnim.start();

    return () => {
      loopAnim.stop();
    };
  }, [transX1, transX2, opacity1, opacity2]);

  return (
    <Animated.View style={styles.container} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateX: transX1 }], opacity: opacity1 }}>
        <Ionicons
          name="chevron-forward"
          size={size}
          color={color}
          style={{ marginRight: -size * 0.4 }}
        />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: transX2 }], opacity: opacity2 }}>
        <Ionicons
          name="chevron-forward"
          size={size}
          color={color}
        />
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});

export default AnimatedDoubleArrow;
