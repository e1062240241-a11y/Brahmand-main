import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const moonAsset = require('../../../assets/images/festivals/karwa_moon_clean.png');
const chalniAsset = require('../../../assets/images/festivals/chalni_transparent.png');

interface ChalniMoonProfileAvatarProps {
  size?: number;
  onPress?: () => void;
}

export const ChalniMoonProfileAvatar = React.memo(function ChalniMoonProfileAvatar({
  size = Platform.OS === 'android' ? 44 : 52,
  onPress,
}: ChalniMoonProfileAvatarProps) {
  const router = useRouter();

  // Animation values for "Chalni aani-jaani chahiye" (Coming and Going loop)
  const chalniProgress = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  // Gentle float for the moon itself
  const moonFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Chalni "Aani-Jaani" sequence loop:
    // Progress: 0 = hidden below/away, 1 = positioned directly over the moon
    const chalniLoop = Animated.loop(
      Animated.sequence([
        // Enter: Chalni slides up in front of the moon
        Animated.timing(chalniProgress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
        // Pause: Stays in front of the moon (viewing moon through chalni)
        Animated.delay(2600),
        // Exit: Chalni smoothly slides down and away
        Animated.timing(chalniProgress, {
          toValue: 0,
          duration: 1300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        // Pause: Pure moon visible alone without chalni
        Animated.delay(2000),
      ])
    );

    // 2. Subtle moon breathing float
    const moonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonFloat, {
          toValue: -1.5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(moonFloat, {
          toValue: 1.5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    chalniLoop.start();
    moonLoop.start();

    return () => {
      chalniLoop.stop();
      moonLoop.stop();
    };
  }, [chalniProgress, moonFloat]);

  // Interpolations for Chalni entry/exit
  const chalniTranslateY = chalniProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [size * 1.35, 0],
  });

  const chalniTranslateX = chalniProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.25, 0],
  });

  const chalniRotate = chalniProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const chalniOpacity = chalniProgress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0.5, 1],
  });

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1.0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}

    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const moonSize = size * 0.82;
  const borderRadius = size / 2;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="करवा चौथ छलनी एवं चंद्र दर्शन, प्रोफाइल देखें"
      style={[styles.touchable, { width: size, height: size }]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        {/* 1. Pure Glowing Moon (No background box, completely transparent) */}
        <Animated.View
          style={[
            styles.moonWrapper,
            {
              width: moonSize,
              height: moonSize,
              transform: [{ translateY: moonFloat }],
            },
          ]}
        >
          <Image
            source={moonAsset}
            style={{ width: moonSize, height: moonSize }}
            contentFit="contain"
            priority="high"
          />
        </Animated.View>

        {/* 2. Chalni (छलनी) coming in front of the moon and going away */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.chalniWrapper,
            {
              width: size,
              height: size,
              opacity: chalniOpacity,
              transform: [
                { translateY: chalniTranslateY },
                { translateX: chalniTranslateX },
                { rotate: chalniRotate },
              ],
            },
          ]}
        >
          <Image
            source={chalniAsset}
            style={{ width: size, height: size }}
            contentFit="contain"
            priority="high"
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  touchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  moonWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chalniWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
