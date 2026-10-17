import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

/**
 * AnimatedBowArrow:
 * Horizontal Bow with Arrow shooting from bottom to top (Upwards).
 * The bow stave spans horizontally across the bottom curve, and the arrow aims and flies vertically upwards.
 *
 * Features:
 * - Horizontal golden ornate bow stave with string pulled down and snapping up
 * - Divine golden arrow pointing upward, pulling downwards under tension and shooting upwards
 * - Glowing aura pulse
 * - Interactive tap: releases arrow with haptics and navigates to profile
 */
export const AnimatedBowArrow = React.memo(function AnimatedBowArrow({
  size = Platform.OS === 'android' ? 46 : 52,
  onPress,
}: {
  size?: number;
  onPress?: () => void;
}) {
  const router = useRouter();

  // Animation values
  const stringPull = useRef(new Animated.Value(0)).current;
  const arrowFlight = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const bowScale = useRef(new Animated.Value(1)).current;

  // Gentle idle pulse for the golden glow
  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.9,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }, [glowPulse]);

  // Periodic automatic archery animation (draw downwards and release upwards every 4 seconds)
  useEffect(() => {
    let isMounted = true;
    let timer: any;

    const runArcheryCycle = () => {
      if (!isMounted) return;

      // 1. Pull down bowstring and arrow
      Animated.parallel([
        Animated.timing(stringPull, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(bowScale, {
          toValue: 1.05,
          duration: 550,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;

        // Brief hold at full tension
        setTimeout(() => {
          if (!isMounted) return;

          // 2. Release: string snaps back with spring, arrow shoots upwards
          Animated.parallel([
            Animated.spring(stringPull, {
              toValue: 0,
              friction: 4,
              tension: 120,
              useNativeDriver: true,
            }),
            Animated.spring(bowScale, {
              toValue: 1,
              friction: 5,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(arrowFlight, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
              }),
              Animated.timing(arrowOpacity, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            if (!isMounted) return;

            // 3. Reset arrow smoothly
            setTimeout(() => {
              if (!isMounted) return;
              arrowFlight.setValue(0);
              Animated.timing(arrowOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
              }).start();

              // Schedule next shot cycle
              timer = setTimeout(runArcheryCycle, 3800);
            }, 600);
          });
        }, 150);
      });
    };

    timer = setTimeout(runArcheryCycle, 1000);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [stringPull, bowScale, arrowFlight, arrowOpacity]);

  // Tap handler: instant shot + trigger navigation or callback
  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}

    // Manual quick shot upwards on tap
    Animated.sequence([
      Animated.timing(stringPull, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(stringPull, {
          toValue: 0,
          friction: 4,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(arrowFlight, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      arrowFlight.setValue(0);
      Animated.timing(arrowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  // Upward arrow flight interpolation (Negative Y shoots upwards)
  const arrowTranslateY = arrowFlight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const arrowPullOffsetY = stringPull.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const stringPullY = stringPull.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5.5],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="श्री राम धनुष-बाण"
      accessibilityHint="Profile par jaane ya arrow shoot karne ke liye tap karein"
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {/* Background Soft Aura Circle */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            transform: [{ scale: glowPulse }],
          },
        ]}
      />

      {/* Horizontal Bow & Upward Arrow Container */}
      <Animated.View
        style={[
          styles.bowContainer,
          {
            transform: [{ scale: bowScale }],
          },
        ]}
      >
        <Svg width="46" height="46" viewBox="0 0 36 36">
          <Defs>
            <SvgLinearGradient id="bowGoldGradH" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFF176" />
              <Stop offset="40%" stopColor="#FFA000" />
              <Stop offset="80%" stopColor="#E65100" />
              <Stop offset="100%" stopColor="#BF360C" />
            </SvgLinearGradient>
            <SvgLinearGradient id="arrowShimmerV" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#D84315" />
              <Stop offset="50%" stopColor="#FFA000" />
              <Stop offset="100%" stopColor="#FFE082" />
            </SvgLinearGradient>
            <SvgLinearGradient id="flameTipV" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#FF3D00" />
              <Stop offset="100%" stopColor="#FFD54F" />
            </SvgLinearGradient>
          </Defs>

          {/* Horizontal Golden Bow Stave (Arc curving downwards, ends at top) */}
          <Path
            d="M 5 25 C 11 14, 25 14, 31 25"
            fill="none"
            stroke="url(#bowGoldGradH)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Ornate Left & Right Bow Tips */}
          <Path
            d="M 5.5 26 C 4.5 24.5, 4 23.5, 3 25.5"
            fill="none"
            stroke="#FFE082"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M 30.5 26 C 31.5 24.5, 32 23.5, 33 25.5"
            fill="none"
            stroke="#FFE082"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Central Grip ornament */}
          <Path
            d="M 16.5 17.5 L 19.5 17.5"
            stroke="#FFE082"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </Svg>

        {/* Animated Horizontal Bow String */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ translateY: stringPullY }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width="46" height="46" viewBox="0 0 36 36">
            <Line
              x1="5"
              y1="25"
              x2="31"
              y2="25"
              stroke="#FFF9C4"
              strokeWidth="1.1"
              strokeDasharray="2,0.8"
              opacity={0.88}
            />
          </Svg>
        </Animated.View>

        {/* Animated Flying Divine Arrow (Shooting Upwards) */}
        <Animated.View
          style={[
            styles.arrowLayer,
            {
              transform: [
                { translateY: arrowTranslateY },
                { translateY: arrowPullOffsetY },
              ],
              opacity: arrowOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Svg width="46" height="46" viewBox="0 0 36 36">
            {/* Vertical Arrow Shaft */}
            <Line
              x1="18"
              y1="27"
              x2="18"
              y2="10"
              stroke="url(#arrowShimmerV)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Arrow Head (Teer Point facing upwards) */}
            <Path
              d="M 14.5 13 L 18 8 L 21.5 13 Z"
              fill="url(#flameTipV)"
              stroke="#FFE082"
              strokeWidth="0.6"
            />
            {/* Glowing Teer Tip Core */}
            <Path
              d="M 16.5 11.5 L 18 8.5 L 19.5 11.5 Z"
              fill="#FFFDE7"
            />
            {/* Feathers / Fletching at bottom */}
            <Path
              d="M 18 26.5 L 15 29 M 18 24.5 L 15 27"
              stroke="#FFA000"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <Path
              d="M 18 26.5 L 21 29 M 18 24.5 L 21 27"
              stroke="#FFA000"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  glowCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 179, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 0, 0.3)',
  },
  bowContainer: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 46,
    height: 46,
  },
});
