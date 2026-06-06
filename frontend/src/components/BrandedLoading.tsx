import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface BrandedLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const BrandedLoading: React.FC<BrandedLoadingProps> = ({
  message,
  fullScreen = true
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing logo animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );

    // Rotating loader animation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.logoContainer}>
        <Animated.Image
          source={require('../../assets/images/app-image.png')}
          style={[
            styles.logo,
            { transform: [{ scale: pulseAnim }] }
          ]}
          resizeMode="contain"
        />

        {/* Bold Branded Loader */}
        <View style={styles.loaderWrapper}>
          <Animated.View
            style={[
              styles.loaderRing,
              { transform: [{ rotate: spin }] }
            ]}
          />
        </View>
      </View>

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.brandName}>Brahmand</Text>
        <Text style={styles.tagline}>Spreading Spiritual Wisdom</Text>
      </View>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 40,
  },
  loaderWrapper: {
    position: 'absolute',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.primary,
    borderBottomColor: 'rgba(255, 102, 0, 0.1)',
    borderLeftColor: 'rgba(255, 102, 0, 0.1)',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
    opacity: 0.8,
  }
});
