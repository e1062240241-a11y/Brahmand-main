import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * DussehraHeaderExperience:
 * 1. Dhanush-string Curve & Arrow Animation (Interactive Bow & Arrow)
 * 2. Ravan Buraai Ticker (10 -> 0 sins countdown)
 * 3. 0-count victory celebration flash
 */
export const DussehraHeaderExperience = React.memo(function DussehraHeaderExperience() {
  const [buraaiCount, setBuraaiCount] = useState<number>(() => {
    const hour = new Date().getHours();
    // In morning (6am) count is 10, by evening (18:00 / 6pm Dahan) it ticks down toward 0
    if (hour < 6) return 10;
    if (hour >= 18) return 0;
    const progress = (hour - 6) / 12;
    return Math.max(1, Math.round(10 * (1 - progress)));
  });

  const [hasShot, setHasShot] = useState(false);
  const [flashVictory, setFlashVictory] = useState(false);

  // Animated bow string pull back and arrow release
  const pullAnim = useRef(new Animated.Value(0)).current;
  const arrowFlyAnim = useRef(new Animated.Value(0)).current;
  const flamePulse = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Flame glow pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(flamePulse, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(flamePulse, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [flamePulse]);

  // Handle shooting arrow on Ravan
  const handleShootArrow = () => {
    if (hasShot) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (_e) {}

    // Pull bowstring back
    Animated.timing(pullAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      // Release bowstring and fly arrow
      Animated.parallel([
        Animated.spring(pullAnim, {
          toValue: 0,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(arrowFlyAnim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setHasShot(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_e) {}

        // Reduce one buraai head
        setBuraaiCount((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            triggerVictoryFlash();
          }
          return next;
        });

        // Reset arrow for next target
        setTimeout(() => {
          arrowFlyAnim.setValue(0);
          setHasShot(false);
        }, 1200);
      });
    });
  };

  const triggerVictoryFlash = () => {
    setFlashVictory(true);
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFlashVictory(false);
    });
  };

  // Arrow trajectory translation
  const arrowTranslateX = arrowFlyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH * 0.44],
  });

  const arrowOpacity = arrowFlyAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0],
  });

  const stringPullOffset = pullAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const sins = [
    'काम', 'क्रोध', 'मोह', 'लोभ', 'मद',
    'मत्सर', 'अहंकार', 'द्वेष', 'अन्याय', 'अधर्म'
  ];
  const activeSin = sins[buraaiCount > 0 ? buraaiCount - 1 : 0] || 'धर्म विजय';

  return (
    <View style={styles.container}>
      {/* Golden victory flash overlay when all 10 heads vanquished */}
      {flashVictory && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            {
              opacity: flashAnim,
            },
          ]}
        />
      )}

      {/* Interactive Dhanush-String Bow Bar & Buraai Ticker */}
      <View style={styles.barRow}>
        {/* Left Bow with bowstring curve */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleShootArrow}
          style={styles.dhanushButton}
          accessibilityRole="button"
          accessibilityLabel="श्री राम धनुष चलाएं"
        >
          <View style={styles.bowWrap}>
            <Svg width="42" height="32" viewBox="0 0 42 32">
              <Defs>
                <SvgLinearGradient id="goldBowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFE082" />
                  <Stop offset="50%" stopColor="#FFA000" />
                  <Stop offset="100%" stopColor="#D84315" />
                </SvgLinearGradient>
              </Defs>
              {/* Golden Bow Curved Stave */}
              <Path
                d="M 6 4 C 18 10, 18 22, 6 28"
                fill="none"
                stroke="url(#goldBowGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Bow string */}
              <Line
                x1="6"
                y1="4"
                x2="6"
                y2="28"
                stroke="#FFE082"
                strokeWidth="1.2"
                strokeDasharray="2,1"
              />
            </Svg>

            {/* Flying Divine Arrow */}
            <Animated.View
              style={[
                styles.arrowContainer,
                {
                  transform: [
                    { translateX: arrowTranslateX },
                    { translateX: stringPullOffset },
                  ],
                  opacity: arrowOpacity,
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.arrowIcon}>🏹</Text>
            </Animated.View>
          </View>

          <View style={styles.bowLabelContainer}>
            <Text style={styles.bowActionText}>शर संधान</Text>
            <Text style={styles.bowSubText}>Tap to strike</Text>
          </View>
        </TouchableOpacity>

        {/* Center Connecting Glowing Bow-String Ray */}
        <View style={styles.midStringLine}>
          <View style={styles.stringGlow} />
        </View>

        {/* Right: Ravan Buraai Ticker (10 -> 0) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleShootArrow}
          style={[
            styles.ravanTickerCard,
            buraaiCount === 0 && styles.ravanDefeatedCard,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`बुराई मीटर: ${buraaiCount} शीश शेष`}
        >
          <Animated.View
            style={[
              styles.flameContainer,
              { transform: [{ scale: flamePulse }] },
            ]}
          >
            <Text style={styles.flameIcon}>
              {buraaiCount === 0 ? '✨' : '🔥'}
            </Text>
          </Animated.View>

          <View style={styles.tickerTextWrap}>
            <View style={styles.tickerHeaderRow}>
              <Text style={styles.tickerBadgeTitle}>
                {buraaiCount === 0 ? 'दशानन दहन पूर्ण' : `दशानन शीश : ${buraaiCount}/10`}
              </Text>
              <Text style={styles.ravanSilhouette}>
                {buraaiCount === 0 ? '👑' : '👺'}
              </Text>
            </View>
            <Text style={styles.sinTag} numberOfLines={1}>
              {buraaiCount === 0 ? 'सत्य की विजय 🚩' : `दहन: ${activeSin}`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 14,
    marginTop: 2,
    marginBottom: 6,
  },
  flashOverlay: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    bottom: -500,
    backgroundColor: '#FFD54F',
    zIndex: 9999,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 243, 224, 0.92)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.22)',
    // Hardware accelerated shadow
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  dhanushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bowWrap: {
    width: 38,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    left: 8,
    top: 4,
    zIndex: 10,
  },
  arrowIcon: {
    fontSize: 16,
  },
  bowLabelContainer: {
    marginLeft: 2,
  },
  bowActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BF360C',
    letterSpacing: 0.2,
  },
  bowSubText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#8D6E63',
  },
  midStringLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  stringGlow: {
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(255, 152, 0, 0.45)',
    borderRadius: 1,
  },
  ravanTickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 108, 0, 0.35)',
    maxWidth: '52%',
  },
  ravanDefeatedCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
  },
  flameContainer: {
    marginRight: 5,
  },
  flameIcon: {
    fontSize: 13,
  },
  tickerTextWrap: {
    flexShrink: 1,
  },
  tickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tickerBadgeTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D84315',
  },
  ravanSilhouette: {
    fontSize: 11,
  },
  sinTag: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#795548',
  },
});
