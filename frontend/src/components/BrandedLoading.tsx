import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface BrandedLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const BrandedLoading: React.FC<BrandedLoadingProps> = ({
  message,
  fullScreen = true
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.delay(0),
        Animated.timing(dot1, { toValue: -15, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.delay(400),
      ])
    );
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(dot2, { toValue: -15, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.delay(400),
      ])
    );
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(dot3, { toValue: -15, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.delay(400),
      ])
    );
    anim1.start(); anim2.start(); anim3.start();
    return () => { anim1.stop(); anim2.stop(); anim3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.loaderContainer}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
      </View>

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginHorizontal: 6,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
