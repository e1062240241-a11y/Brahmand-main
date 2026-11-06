import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { FONTS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DiwaliGreetingBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const translateYAnim = useRef(new Animated.Value(15)).current;
  const diyaPulse = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const svgWidth = Math.min(SCREEN_WIDTH - 40, 340);

  useEffect(() => {
    // Diya rhythmic pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(diyaPulse, {
          toValue: 1.18,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(diyaPulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();

    // Subtle golden shimmer loop
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    shimmerLoop.start();

    // Reveal right after initial crackers ignite
    const revealTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 550);

    // Gracefully fade out after celebratory moment (~5.5 seconds)
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setIsVisible(false);
      });
    }, 5500);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(fadeTimer);
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [opacityAnim, scaleAnim, translateYAnim, diyaPulse, shimmerAnim]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {/* Top Row: Auspicious Glowing Diyas & Transparent Brahmand Logo */}
      <View style={styles.topDiyaRow}>
        <Animated.Text style={[styles.diyaEmoji, { transform: [{ scale: diyaPulse }] }]}>
          🪔
        </Animated.Text>
        <Image
          source={require('../../../assets/images/brahmand_logo_transparent.png')}
          style={styles.brahmandLogo}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.diyaEmoji, { transform: [{ scale: diyaPulse }] }]}>
          🪔
        </Animated.Text>
      </View>

      {/* Auspicious Vedic Sanskrit Tag with Gold Halo */}
      <View style={styles.sanskritPill}>
        <Text style={styles.sanskritHeading}>शुभ दीपावली</Text>
      </View>

      {/* Main Attraction: Royal Metallic 24K Gold "Happy Diwali" SVG Title */}
      <View style={styles.svgTitleWrapper}>
        <Svg height={48} width={svgWidth} viewBox={`0 0 ${svgWidth} 48`}>
          <Defs>
            <SvgLinearGradient id="metallicDiwaliGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFFDE7" />
              <Stop offset="25%" stopColor="#FFE082" />
              <Stop offset="55%" stopColor="#FFB300" />
              <Stop offset="85%" stopColor="#FF6F00" />
              <Stop offset="100%" stopColor="#BF360C" />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            x={svgWidth / 2}
            y={36}
            textAnchor="middle"
            fill="url(#metallicDiwaliGold)"
            stroke="#4A000A"
            strokeWidth="1.4"
            fontFamily={FONTS.brandTitle}
            fontSize="34"
            fontWeight="bold"
            letterSpacing="1.2"
          >
            Happy Diwali
          </SvgText>
        </Svg>
      </View>

      {/* Prestigious Brand Signature Line */}
      <View style={styles.fromBrahmandRow}>
        <Text style={styles.fromText}>from</Text>
        <View style={styles.brandBadge}>
          <Text style={styles.brandStar}>✦</Text>
          <Text style={styles.brahmandBrandText}>BRAHMAND</Text>
          <Text style={styles.brandStar}>✦</Text>
        </View>
      </View>

      {/* High-Contrast Sacred Blessings (Rich Ruby/Mahogany with 100% legibility) */}
      <Text style={styles.blessingsText}>
        May the divine light illuminate your home with peace, happiness & eternal prosperity!
      </Text>

      {/* Decorative Golden Starlight Rule */}
      <View style={styles.ornamentalRule}>
        <View style={styles.ruleLine} />
        <Text style={styles.ruleDiya}>🪔</Text>
        <View style={styles.ruleLine} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'transparent', // STRICT: No background added
  },
  topDiyaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 4,
  },
  diyaEmoji: {
    fontSize: 28,
    textShadowColor: '#FF6F00',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brahmandLogo: {
    width: 52,
    height: 52,
  },
  sanskritPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(216, 67, 21, 0.4)',
    backgroundColor: 'rgba(255, 248, 225, 0.4)',
    gap: 6,
    marginBottom: 4,
  },
  sanskritSparkle: {
    fontSize: 11,
    color: '#D84315',
  },
  sanskritHeading: {
    fontSize: 14.5,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#5C0612',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  svgTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginVertical: 2,
  },
  fromBrahmandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  fromText: {
    fontSize: 14,
    fontFamily: 'System',
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#5C0612',
    letterSpacing: 0.5,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandStar: {
    fontSize: 11,
    color: '#D84315',
  },
  brahmandBrandText: {
    fontSize: 18,
    fontFamily: FONTS.brandTitle,
    fontWeight: '900',
    color: '#7C1400',
    letterSpacing: 2.2,
    textShadowColor: 'rgba(255, 215, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  blessingsText: {
    fontSize: 12.5,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#3B0900',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginTop: 2,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ornamentalRule: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginTop: 6,
    gap: 8,
  },
  ruleLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(180, 83, 9, 0.35)',
  },
  ruleDiya: {
    fontSize: 12,
  },
});
