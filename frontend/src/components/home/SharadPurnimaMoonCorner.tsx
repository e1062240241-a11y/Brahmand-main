import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Easing,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Path,
  ClipPath,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getAstronomicalMoonPhase,
  getMoonIlluminatedPath,
  LunarPhaseInfo,
} from '../../utils/lunarPhase';

interface SharadPurnimaMoonCornerProps {
  size?: number;
  showBadge?: boolean;
  onPress?: () => void;
  style?: any;
  /**
   * If true, forces the moon to render as 100% Full Moon (Sharad Purnima)
   * Defaults to calculating real-time astronomical phase based on current date.
   */
  forceFullMoon?: boolean;
}

/**
 * SharadPurnimaMoonCorner:
 * Displays dynamic, real-time Moon Phases (चन्द्र कलाएँ) leading up to
 * 100% Full Moon (अमृत चंद्र) on Sharad Purnima.
 *
 * Features:
 * - 100% Transparent background (no box, no circle container).
 * - Real-time astronomical lunar phase / tithi calculation.
 * - On Sharad Purnima day: 100% glorious Full Moon with radiant 16 rays.
 * - On other days: Shows the accurate waxing / waning phase with natural earthshine.
 * - Interactive Moon Phase modal allowing users to preview and explore all lunar phases.
 * - Profile navigation with tactile haptic feedback.
 */
export const SharadPurnimaMoonCorner: React.FC<SharadPurnimaMoonCornerProps> = React.memo(
  function SharadPurnimaMoonCorner({
    size = Platform.OS === 'android' ? 44 : 50,
    showBadge = false,
    onPress,
    style,
    forceFullMoon = false,
  }) {
    const router = useRouter();

    // Modal state for exploring lunar phases
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Active phase override (null = real-time today, number = preview phase 0..1)
    const [previewPhase, setPreviewPhase] = useState<number | null>(
      forceFullMoon ? 0.5 : null
    );

    // Compute lunar phase info
    const lunarInfo: LunarPhaseInfo = useMemo(() => {
      if (forceFullMoon) {
        return getAstronomicalMoonPhase(new Date(), 0.5);
      }
      if (previewPhase !== null) {
        return getAstronomicalMoonPhase(new Date(), previewPhase);
      }
      return getAstronomicalMoonPhase(new Date());
    }, [forceFullMoon, previewPhase]);

    // Native animation drivers for silky-smooth 60fps performance
    const glowAnim = useRef(new Animated.Value(0.85)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const rayRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // 1. Soft silvery moon breathing glow
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1.05,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      // 2. Very subtle nocturnal float (1.2px gentle drift)
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -1.5,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 1.2,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      // 3. Slow, majestic rotation of divine moonlight rays (60s loop)
      const rayAnimation = Animated.loop(
        Animated.timing(rayRotate, {
          toValue: 1,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      glowAnimation.start();
      floatAnimation.start();
      rayAnimation.start();

      return () => {
        glowAnimation.stop();
        floatAnimation.stop();
        rayAnimation.stop();
      };
    }, [glowAnim, floatAnim, rayRotate]);

    const handleCornerPress = () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}
      setIsModalVisible(true);
    };

    const handleNavigateProfile = () => {
      setIsModalVisible(false);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}
      if (onPress) {
        onPress();
      } else {
        router.push('/(tabs)/profile');
      }
    };

    const handleNavigateFestival = () => {
      setIsModalVisible(false);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}
      router.push('/festivals');
    };

    const raySpin = rayRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const halfSize = size / 2;
    const moonRadius = size * 0.40;

    // Ray opacity depends on illumination (radiant on Full Moon, subtle on crescent)
    const rayBaseOpacity = Math.max(0.15, (lunarInfo.illumination / 100) * 0.85);

    // SVG Clip path for the illuminated moon portion
    const illuminatedPath = useMemo(() => {
      return getMoonIlluminatedPath(halfSize, halfSize, moonRadius, lunarInfo.phase);
    }, [halfSize, moonRadius, lunarInfo.phase]);

    return (
      <>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleCornerPress}
          style={[styles.wrapper, style]}
          accessibilityRole="button"
          accessibilityLabel={`${lunarInfo.phaseNameHindi} - Tap to view Moon Phases & Profile`}
          accessibilityHint="Shows moon phases and profile shortcut"
        >
          <Animated.View
            style={[
              styles.container,
              {
                width: size,
                height: size,
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            {/* 1. Soft Silvery-Gold Divine Moon Rays (Radiates around moon, no background box) */}
            {lunarInfo.illumination > 30 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.raysContainer,
                  {
                    width: size,
                    height: size,
                    opacity: rayBaseOpacity,
                    transform: [{ rotate: raySpin }],
                  },
                ]}
              >
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <Defs>
                    <SvgLinearGradient id="cornerMoonRayGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                      <Stop offset="50%" stopColor="#FFF9E6" stopOpacity="0.4" />
                      <Stop offset="100%" stopColor="#F5EDD0" stopOpacity="0" />
                    </SvgLinearGradient>
                  </Defs>
                  <G>
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const angle = (idx * 360) / 16;
                      const rad = (angle * Math.PI) / 180;
                      const rInner = moonRadius * 1.05;
                      const rOuter = moonRadius * 1.28;
                      const x1 = halfSize + Math.cos(rad) * rInner;
                      const y1 = halfSize + Math.sin(rad) * rInner;
                      const x2 = halfSize + Math.cos(rad) * rOuter;
                      const y2 = halfSize + Math.sin(rad) * rOuter;
                      return (
                        <Path
                          key={`ray-${idx}`}
                          d={`M ${x1} ${y1} L ${x2} ${y2}`}
                          stroke="url(#cornerMoonRayGrad)"
                          strokeWidth={idx % 2 === 0 ? 1.2 : 0.7}
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </G>
                </Svg>
              </Animated.View>
            )}

            {/* 2. Moon Disk with Dynamic Phase Clipping */}
            <View style={styles.svgContainer}>
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                  {/* ClipPath for current Lunar Phase */}
                  <ClipPath id="cornerPhaseClip">
                    <Path d={illuminatedPath} />
                  </ClipPath>

                  {/* Pearlescent Full Moon Gradient */}
                  <RadialGradient
                    id="cornerMoonGrad"
                    cx="36%"
                    cy="32%"
                    r="70%"
                    fx="30%"
                    fy="26%"
                  >
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="30%" stopColor="#FFFDF7" stopOpacity="1" />
                    <Stop offset="65%" stopColor="#F5F3E8" stopOpacity="1" />
                    <Stop offset="88%" stopColor="#E8E3D2" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#D8D1BD" stopOpacity="1" />
                  </RadialGradient>

                  {/* Soft Lunar Maria Texture */}
                  <SvgLinearGradient id="cornerLunarTexture" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#C8C2AF" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#B3ACA0" stopOpacity="0.48" />
                  </SvgLinearGradient>

                  {/* Crater Shadow */}
                  <RadialGradient id="cornerCraterShadow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#9C9588" stopOpacity="0.4" />
                    <Stop offset="80%" stopColor="#C4BDAF" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#DDD8CC" stopOpacity="0" />
                  </RadialGradient>
                </Defs>

                {/* Base Dark Moon Sphere (Earthshine outline for unlit portion) */}
                <Circle
                  cx={halfSize}
                  cy={halfSize}
                  r={moonRadius}
                  fill="#121622"
                  fillOpacity={0.25}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={0.6}
                />

                {/* Illuminated Moon Sphere (Clipped to Lunar Phase) */}
                <G clipPath="url(#cornerPhaseClip)">
                  {/* Moon Solid Face */}
                  <Circle
                    cx={halfSize}
                    cy={halfSize}
                    r={moonRadius}
                    fill="url(#cornerMoonGrad)"
                    stroke="#EAE4D2"
                    strokeWidth={0.6}
                  />

                  {/* Realistic Lunar Maria */}
                  <Circle
                    cx={halfSize + moonRadius * 0.28}
                    cy={halfSize - moonRadius * 0.25}
                    r={moonRadius * 0.22}
                    fill="url(#cornerLunarTexture)"
                  />
                  <Circle
                    cx={halfSize - moonRadius * 0.25}
                    cy={halfSize - moonRadius * 0.05}
                    r={moonRadius * 0.32}
                    fill="url(#cornerLunarTexture)"
                  />
                  <Circle
                    cx={halfSize + moonRadius * 0.12}
                    cy={halfSize + moonRadius * 0.30}
                    r={moonRadius * 0.26}
                    fill="url(#cornerLunarTexture)"
                  />
                  <Circle
                    cx={halfSize - moonRadius * 0.34}
                    cy={halfSize + moonRadius * 0.28}
                    r={moonRadius * 0.14}
                    fill="url(#cornerCraterShadow)"
                  />
                  <Circle
                    cx={halfSize + moonRadius * 0.38}
                    cy={halfSize + moonRadius * 0.08}
                    r={moonRadius * 0.10}
                    fill="url(#cornerCraterShadow)"
                  />

                  {/* Specular Rim Highlight Arc */}
                  <Path
                    d={`M ${halfSize - moonRadius * 0.70} ${halfSize - moonRadius * 0.58} A ${moonRadius * 0.94} ${moonRadius * 0.94} 0 0 1 ${halfSize + moonRadius * 0.45} ${halfSize - moonRadius * 0.78}`}
                    stroke="#FFFFFF"
                    strokeWidth={1.3}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.9}
                  />
                </G>
              </Svg>
            </View>
          </Animated.View>

          {showBadge && (
            <View style={styles.badgeWrap}>
              <View style={styles.badgePill}>
                <View style={styles.silverDot} />
                <Text style={styles.badgeText}>
                  {lunarInfo.isPurnima ? 'शरद पूर्णिमा' : lunarInfo.tithiNameHindi}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Interactive Moon Phases & Panchang Modal */}
        <Modal
          visible={isModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setIsModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>चन्द्र दर्शन व कलाएँ</Text>
                  <Text style={styles.modalSubtitle}>Lunar Phases • Hindu Panchang</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#757575" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Big Animated Moon Display */}
                <View style={styles.bigMoonWrapper}>
                  <BigMoonDisplay phase={lunarInfo.phase} />
                  <View style={styles.illuminationBadge}>
                    <Text style={styles.illuminationText}>
                      {lunarInfo.illumination}% Illumination
                    </Text>
                  </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>तिथि व पक्ष:</Text>
                    <Text style={styles.infoValue}>
                      {lunarInfo.paksha} • {lunarInfo.tithiNameHindi}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>चंद्र कला:</Text>
                    <Text style={[styles.infoValue, { color: '#E65100', fontWeight: '800' }]}>
                      {lunarInfo.phaseNameHindi}
                    </Text>
                  </View>
                  <Text style={styles.descText}>{lunarInfo.description}</Text>
                </View>

                {/* Phase Presets Selector */}
                <Text style={styles.sectionLabel}>चंद्र कलाएँ देखें (Select Phase to Preview):</Text>
                <View style={styles.presetGrid}>
                  {PHASE_PRESETS.map((item) => {
                    const isSelected =
                      (item.phase === null && previewPhase === null) ||
                      (item.phase !== null && Math.abs((previewPhase ?? -1) - item.phase) < 0.02);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync();
                          } catch (_e) {}
                          setPreviewPhase(item.phase);
                        }}
                        style={[
                          styles.presetChip,
                          isSelected && styles.presetChipActive,
                          item.highlight && styles.presetChipHighlight,
                        ]}
                      >
                        <Text style={styles.presetIcon}>{item.icon}</Text>
                        <Text
                          style={[
                            styles.presetLabel,
                            isSelected && styles.presetLabelActive,
                            item.highlight && styles.presetLabelHighlight,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Navigation Buttons */}
                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    activeOpacity={0.85}
                    onPress={handleNavigateFestival}
                  >
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>
                      शरद पूर्णिमा उत्सव व कथा
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    activeOpacity={0.85}
                    onPress={handleNavigateProfile}
                  >
                    <Ionicons name="person-circle-outline" size={20} color="#333333" />
                    <Text style={styles.secondaryActionText}>मेरी प्रोफाइल (My Profile)</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }
);

/**
 * High-Resolution Big Moon display for modal
 */
const BigMoonDisplay: React.FC<{ phase: number }> = React.memo(function BigMoonDisplay({ phase }) {
  const size = 110;
  const halfSize = size / 2;
  const moonRadius = size * 0.42;

  const illuminatedPath = useMemo(() => {
    return getMoonIlluminatedPath(halfSize, halfSize, moonRadius, phase);
  }, [halfSize, moonRadius, phase]);

  const illumination = Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id="bigMoonPhaseClip">
            <Path d={illuminatedPath} />
          </ClipPath>

          <RadialGradient id="bigMoonGrad" cx="35%" cy="30%" r="72%" fx="28%" fy="24%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="30%" stopColor="#FFFDF7" stopOpacity="1" />
            <Stop offset="65%" stopColor="#F5F3E8" stopOpacity="1" />
            <Stop offset="88%" stopColor="#E8E3D2" stopOpacity="1" />
            <Stop offset="100%" stopColor="#D8D1BD" stopOpacity="1" />
          </RadialGradient>

          <SvgLinearGradient id="bigLunarTexture" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#C8C2AF" stopOpacity="0.38" />
            <Stop offset="100%" stopColor="#B3ACA0" stopOpacity="0.52" />
          </SvgLinearGradient>

          <RadialGradient id="bigCraterShadow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#9C9588" stopOpacity="0.45" />
            <Stop offset="80%" stopColor="#C4BDAF" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#DDD8CC" stopOpacity="0" />
          </RadialGradient>

          <SvgLinearGradient id="bigMoonRayGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#FFF9E6" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#F5EDD0" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* 16 rays around the big moon */}
        {illumination > 40 && (
          <G opacity={(illumination / 100) * 0.9}>
            {Array.from({ length: 16 }).map((_, idx) => {
              const angle = (idx * 360) / 16;
              const rad = (angle * Math.PI) / 180;
              const rInner = moonRadius * 1.05;
              const rOuter = moonRadius * 1.25;
              const x1 = halfSize + Math.cos(rad) * rInner;
              const y1 = halfSize + Math.sin(rad) * rInner;
              const x2 = halfSize + Math.cos(rad) * rOuter;
              const y2 = halfSize + Math.sin(rad) * rOuter;
              return (
                <Path
                  key={`big-ray-${idx}`}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="url(#bigMoonRayGrad)"
                  strokeWidth={idx % 2 === 0 ? 1.8 : 1.0}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        )}

        {/* Base Dark Moon Sphere (Night Earthshine) */}
        <Circle
          cx={halfSize}
          cy={halfSize}
          r={moonRadius}
          fill="#1A202C"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth={0.8}
        />

        {/* Illuminated Region */}
        <G clipPath="url(#bigMoonPhaseClip)">
          <Circle
            cx={halfSize}
            cy={halfSize}
            r={moonRadius}
            fill="url(#bigMoonGrad)"
            stroke="#EAE4D2"
            strokeWidth={0.8}
          />
          {/* Maria */}
          <Circle
            cx={halfSize + moonRadius * 0.28}
            cy={halfSize - moonRadius * 0.25}
            r={moonRadius * 0.22}
            fill="url(#bigLunarTexture)"
          />
          <Circle
            cx={halfSize - moonRadius * 0.25}
            cy={halfSize - moonRadius * 0.05}
            r={moonRadius * 0.32}
            fill="url(#bigLunarTexture)"
          />
          <Circle
            cx={halfSize + moonRadius * 0.12}
            cy={halfSize + moonRadius * 0.30}
            r={moonRadius * 0.26}
            fill="url(#bigLunarTexture)"
          />
          <Circle
            cx={halfSize - moonRadius * 0.34}
            cy={halfSize + moonRadius * 0.28}
            r={moonRadius * 0.14}
            fill="url(#bigCraterShadow)"
          />
          <Circle
            cx={halfSize + moonRadius * 0.38}
            cy={halfSize + moonRadius * 0.08}
            r={moonRadius * 0.10}
            fill="url(#bigCraterShadow)"
          />
          {/* Specular Edge */}
          <Path
            d={`M ${halfSize - moonRadius * 0.70} ${halfSize - moonRadius * 0.58} A ${moonRadius * 0.94} ${moonRadius * 0.94} 0 0 1 ${halfSize + moonRadius * 0.45} ${halfSize - moonRadius * 0.78}`}
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={0.95}
          />
        </G>
      </Svg>
    </View>
  );
});

// Phase presets list
const PHASE_PRESETS = [
  { id: 'today', label: 'आज (Live Today)', icon: '📅', phase: null, highlight: false },
  { id: 'sharad', label: 'शरद पूर्णिमा (Full)', icon: '🌕', phase: 0.5, highlight: true },
  { id: 'chaturdashi', label: 'चतुर्दशी (98%)', icon: '🌔', phase: 0.45, highlight: false },
  { id: 'ashtami', label: 'अष्टमी (50%)', icon: '🌓', phase: 0.25, highlight: false },
  { id: 'dwitiya', label: 'द्वितीया (15%)', icon: '🌒', phase: 0.15, highlight: false },
  { id: 'amavasya', label: 'अमावस्या (0%)', icon: '🌑', phase: 0.0, highlight: false },
  { id: 'krishna', label: 'कृष्ण पक्ष (Waning)', icon: '🌖', phase: 0.65, highlight: false },
];

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  raysContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    alignItems: 'center',
    marginTop: -2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(200, 195, 180, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 3,
  },
  silverDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9E9E9E',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#424242',
    letterSpacing: 0.2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  bigMoonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    marginVertical: 10,
  },
  illuminationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  illuminationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#616161',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '700',
  },
  descText: {
    fontSize: 12,
    color: '#5D4037',
    marginTop: 6,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  presetChipActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  presetChipHighlight: {
    borderColor: '#FFA000',
    borderWidth: 1.2,
  },
  presetIcon: {
    fontSize: 13,
  },
  presetLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  presetLabelActive: {
    color: '#E65100',
    fontWeight: '800',
  },
  presetLabelHighlight: {
    fontWeight: '800',
  },
  actionButtonsCol: {
    gap: 8,
    marginTop: 4,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D85A00',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#D85A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  secondaryActionText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 13,
  },
});
