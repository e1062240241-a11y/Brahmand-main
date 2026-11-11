import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { chhathPujaCornerImage } from '../home/homeConstants';

interface Props {
  onPress: () => void;
  size?: number;
}

/**
 * ChhathPujaCornerAvatar:
 * Authentic, beautiful devotional animation of a traditional Indian woman devotee
 * in sacred river water offering Arghya (sacred offerings in bamboo soop) to Surya Dev.
 *
 * Core Devotional Animation:
 * 1. Devotee Woman Offering Arghya: Reverently lifts the sacred soop upwards towards
 *    the rising Sun God, pauses at peak prayer, and gently lowers back in a fluid,
 *    meditative 3.8-second cycle with zero stutter or glitch.
 * 2. Divine Surya Dev Solar Aura: Soft golden-amber solar radiance breathing behind
 *    the devotee, bathing the scene in holy dawn light.
 * 3. Auspicious "छठ पूजा" Label: Glowing in sacred golden lettering underneath.
 */
export const ChhathPujaCornerAvatar: React.FC<Props> = React.memo(({
  onPress,
  size = Platform.OS === 'android' ? 58 : 64,
}) => {
  // 1. Arghya Offering Lifting & Lowering Motion (Physical Prayer Cycle)
  const arghyaAnim = useRef(new Animated.Value(0)).current;

  // 2. Divine Surya Dev Solar Aura Breath
  const sunAuraAnim = useRef(new Animated.Value(0)).current;

  // 3. Text Radiant Gold Glow
  const textGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Arghya Offering Loop: Meditative, fluid 3800ms liturgical cycle
    const arghyaLoop = Animated.loop(
      Animated.sequence([
        // Lifting Arghya smoothly upwards towards Surya Dev
        Animated.timing(arghyaAnim, {
          toValue: 1,
          duration: 1650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        // Sacred pause in reverence at peak elevation
        Animated.delay(450),
        // Gracefully descending back to heart level
        Animated.timing(arghyaAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(200),
      ])
    );
    arghyaLoop.start();

    // 2. Divine Solar Aura Breathing Glow
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sunAuraAnim, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(sunAuraAnim, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    auraLoop.start();

    // 3. Auspicious Text Glow
    const textLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(textGlowAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(textGlowAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    textLoop.start();

    return () => {
      arghyaLoop.stop();
      auraLoop.stop();
      textLoop.stop();
    };
  }, [arghyaAnim, sunAuraAnim, textGlowAnim]);

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

  // --- Interpolations ---

  // Arghya Offering Physical Movement (Smooth elevation and reverent forward tilt)
  const arghyaTranslateY = arghyaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4.5],
  });

  const arghyaScale = arghyaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const arghyaRotate = arghyaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1.8deg'],
  });

  // Solar Aura Breath Scale & Opacity
  const auraScale = sunAuraAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.12],
  });

  const auraOpacity = sunAuraAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });

  // Text Radiant Glow
  const textOpacity = textGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const textScale = textGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  const avatarWidth = size;
  // Authentic aspect ratio matching the 942 x 889 cropped illustration
  const avatarHeight = Math.round(avatarWidth * (889 / 942));
  const auraSize = Math.round(avatarWidth * 1.18);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="View your profile - Chhath Puja Arghya Animation"
      style={[styles.container, { width: avatarWidth + 4 }]}
    >
      <View style={{ width: avatarWidth + 4, height: avatarHeight, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* ========================================================= */}
        {/* LAYER 1: DIVINE SURYA DEV (Lord Sun) BACKDROP AURA        */}
        {/* ========================================================= */}
        <Animated.View
          style={{
            position: 'absolute',
            width: auraSize,
            height: auraSize,
            transform: [{ scale: auraScale }],
            opacity: auraOpacity,
          }}
          pointerEvents="none"
        >
          <Svg width={auraSize} height={auraSize} viewBox={`0 0 ${auraSize} ${auraSize}`}>
            <Defs>
              <SvgRadialGradient id="chhathSunHalo" cx="50%" cy="45%" r="50%">
                <Stop offset="0%" stopColor="#FFF9C4" stopOpacity={0.85} />
                <Stop offset="35%" stopColor="#FFB300" stopOpacity={0.55} />
                <Stop offset="70%" stopColor="#FF6F00" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#E65100" stopOpacity={0} />
              </SvgRadialGradient>
            </Defs>
            <Circle cx={auraSize / 2} cy={auraSize / 2} r={auraSize / 2} fill="url(#chhathSunHalo)" />
          </Svg>
        </Animated.View>

        {/* ========================================================= */}
        {/* LAYER 2: DEVOTEE WOMAN OFFERING ARGHYA (Animated.Image)   */}
        {/* ========================================================= */}
        <Animated.View
          style={{
            width: avatarWidth,
            height: avatarHeight,
            transform: [
              { translateY: arghyaTranslateY },
              { scale: arghyaScale },
              { rotate: arghyaRotate },
            ],
          }}
        >
          <Animated.Image
            source={chhathPujaCornerImage}
            style={{
              width: avatarWidth,
              height: avatarHeight,
              backgroundColor: 'transparent',
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* ========================================================= */}
      {/* LAYER 3: AUSPICIOUS "छठ पूजा" FESTIVE GREETING TEXT       */}
      {/* ========================================================= */}
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
            styles.greetingText,
            {
              fontFamily: brandFont,
            },
          ]}
          numberOfLines={1}
        >
          छठ पूजा
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

export default ChhathPujaCornerAvatar;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
    paddingVertical: 1,
  },
  textContainer: {
    backgroundColor: 'transparent',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  greetingText: {
    fontSize: Platform.OS === 'android' ? 9.5 : 10,
    fontWeight: '800',
    color: '#FFFDE7', // Radiant sunlit cream
    letterSpacing: 0.45,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: '#E65100', // Deep sacred solar amber glow
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
