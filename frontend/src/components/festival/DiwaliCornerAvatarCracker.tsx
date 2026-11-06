import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { diwaliPujaDiyaImage } from '../home/homeConstants';

interface Props {
  onPress: () => void;
  size?: number;
}

export const DiwaliCornerAvatarCracker: React.FC<Props> = React.memo(({
  onPress,
}) => {
  // Gentle flame breathing / pulse animation for the Diya
  const diyaPulse = useRef(new Animated.Value(1)).current;
  // Glowing aura loop for the "Happy Diwali" text
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Subtle, sacred flame pulse loop
    const diyaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(diyaPulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(diyaPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    diyaLoop.start();

    // 2. Animated text radiant glow cycle
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    glowLoop.start();

    return () => {
      diyaLoop.stop();
      glowLoop.stop();
    };
  }, [diyaPulse, glowAnim]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    onPress();
  };

  const brandFont = Platform.select({
    android: 'Cinzel-Bold',
    default: 'Cinzel',
  });

  // Animated glow properties for text
  const textOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const textScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.02],
  });

  const diyaWidth = Platform.OS === 'android' ? 42 : 44;
  const diyaHeight = Math.round(diyaWidth * (650 / 736)); // ~37-39px

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="View your profile - Happy Diwali"
      style={styles.container}
    >
      {/* 1. Traditional Carved Diya Artwork with Marigolds & Jasmine */}
      <Animated.Image
        source={diwaliPujaDiyaImage}
        style={[
          styles.diyaImage,
          {
            width: diyaWidth,
            height: diyaHeight,
            transform: [{ scale: diyaPulse }],
          },
        ]}
        resizeMode="contain"
      />

      {/* 2. Animated Radiant Glowing "Happy Diwali" Text (Zero Background, No Sparkles) */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ scale: textScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.happyDiwaliText,
            {
              fontFamily: brandFont,
            },
          ]}
          numberOfLines={1}
        >
          Happy Diwali
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    paddingVertical: 1,
  },
  diyaImage: {
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  textContainer: {
    backgroundColor: 'transparent', // STRICT: No background
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  happyDiwaliText: {
    fontSize: Platform.OS === 'android' ? 8 : 8.5,
    fontWeight: '800',
    color: '#FFFDE7', // Radiant gold/starlight
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: '#FF8F00', // Deep festive amber/saffron glow
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
