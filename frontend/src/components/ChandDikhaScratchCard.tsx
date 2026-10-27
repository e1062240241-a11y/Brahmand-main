import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image as RNImage,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Svg, {
  Defs,
  Mask,
  Rect,
  Path,
  Circle,
  G,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Pattern,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive card sizing
const DEFAULT_CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const DEFAULT_CARD_HEIGHT = Math.round(DEFAULT_CARD_WIDTH * 1.36); // ~490px

// Scratch brush parameters (Google Pay feel)
const BRUSH_SIZE = 54; // Smooth, generous finger stroke
const REVEAL_THRESHOLD = 0.38; // 38% cleared triggers the celebratory auto-reveal

// Sample grid for exact cleared area percentage calculation
const SAMPLE_GRID_COLS = 12;
const SAMPLE_GRID_ROWS = 16;
const TOTAL_SAMPLE_POINTS = SAMPLE_GRID_COLS * SAMPLE_GRID_ROWS;

export interface ChandDikhaScratchCardProps {
  festivalName?: string;
  senderName?: string;
  onRevealComplete?: () => void;
  width?: number;
  height?: number;
  initialRevealed?: boolean;
}

export interface ChandDikhaCardHandle {
  resetScratch: () => void;
  revealFull: () => void;
  isRevealed: boolean;
  viewNode: any;
}

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  emoji: string;
}

export const ChandDikhaScratchCard = forwardRef<any, ChandDikhaScratchCardProps>(
  (
    {
      festivalName = 'करवा चौथ',
      senderName = '',
      onRevealComplete,
      width = DEFAULT_CARD_WIDTH,
      height = DEFAULT_CARD_HEIGHT,
      initialRevealed = false,
    },
    ref
  ) => {
    // Paths drawn by the user for SVG Mask
    const [paths, setPaths] = useState<string[]>([]);
    const [activePath, setActivePath] = useState<string>('');
    const [tapCircles, setTapCircles] = useState<{ x: number; y: number }[]>([]);
    const [sparks, setSparks] = useState<SparkParticle[]>([]);

    const [isRevealed, setIsRevealed] = useState<boolean>(initialRevealed);
    const [scratchPercent, setScratchPercent] = useState<number>(initialRevealed ? 100 : 0);

    const cardRef = useRef<View>(null);
    const currentPathRef = useRef<string>('');
    const isRevealingRef = useRef<boolean>(initialRevealed);
    const lastHapticTimeRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);

    // Cleared sample points tracking
    const clearedSamplesRef = useRef<boolean[]>(
      new Array(TOTAL_SAMPLE_POINTS).fill(initialRevealed)
    );

    // Animations
    const foilOpacityAnim = useRef(new Animated.Value(initialRevealed ? 0 : 1)).current;
    const celebrateAnim = useRef(new Animated.Value(initialRevealed ? 1 : 0)).current;
    const moonGlowAnim = useRef(new Animated.Value(1)).current;

    // Distinguish festivals
    const norm = (festivalName || '').toLowerCase();
    const isKarwaChauth =
      norm.includes('karwa') ||
      norm.includes('karva') ||
      festivalName.includes('करवा');
    const isSharadPurnima =
      norm.includes('sharad') ||
      norm.includes('kojagiri') ||
      festivalName.includes('शरद');

    const cleanSender = (senderName || '').trim();

    // Subtle pulsing moon aura
    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(moonGlowAnim, {
            toValue: 1.07,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(moonGlowAnim, {
            toValue: 0.96,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, [moonGlowAnim]);

    // Handle celebratory completion
    const handleRevealAll = useCallback(() => {
      if (isRevealingRef.current) return;
      isRevealingRef.current = true;
      setIsRevealed(true);
      setScratchPercent(100);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      Animated.parallel([
        Animated.timing(foilOpacityAnim, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.spring(celebrateAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onRevealComplete?.();
      });
    }, [foilOpacityAnim, celebrateAnim, onRevealComplete]);

    // Reset scratch card to pristine state
    const handleReset = useCallback(() => {
      isRevealingRef.current = false;
      setIsRevealed(false);
      setScratchPercent(0);
      setPaths([]);
      setActivePath('');
      setTapCircles([]);
      setSparks([]);
      currentPathRef.current = '';
      clearedSamplesRef.current = new Array(TOTAL_SAMPLE_POINTS).fill(false);
      foilOpacityAnim.setValue(1);
      celebrateAnim.setValue(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, [foilOpacityAnim, celebrateAnim]);

    useImperativeHandle(ref, () => ({
      resetScratch: handleReset,
      revealFull: handleRevealAll,
      isRevealed,
      viewNode: cardRef.current,
    }));

    // Spawn fleeting stardust sparks at the fingertip
    const spawnSparks = useCallback((x: number, y: number) => {
      const emojis = ['✨', '✦', '⭐', '✧'];
      const newSparks: SparkParticle[] = [
        {
          id: Math.random(),
          x: x + (Math.random() * 28 - 14),
          y: y + (Math.random() * 28 - 14),
          size: Math.random() * 8 + 8,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        },
      ];
      setSparks((prev) => [...prev.slice(-6), ...newSparks]);
    }, []);

    // Update cleared sample points to measure exact scratch percentage
    const updateSampleCoverage = useCallback(
      (x: number, y: number) => {
        const stepX = width / SAMPLE_GRID_COLS;
        const stepY = height / SAMPLE_GRID_ROWS;
        const brushRadiusSq = (BRUSH_SIZE * 0.6) ** 2;

        let newlyCleared = 0;
        const samples = clearedSamplesRef.current;

        for (let r = 0; r < SAMPLE_GRID_ROWS; r++) {
          const sampleY = (r + 0.5) * stepY;
          for (let c = 0; c < SAMPLE_GRID_COLS; c++) {
            const idx = r * SAMPLE_GRID_COLS + c;
            if (!samples[idx]) {
              const sampleX = (c + 0.5) * stepX;
              const distSq = (sampleX - x) ** 2 + (sampleY - y) ** 2;
              if (distSq <= brushRadiusSq) {
                samples[idx] = true;
                newlyCleared++;
              }
            }
          }
        }

        if (newlyCleared > 0) {
          const clearedCount = samples.filter(Boolean).length;
          const ratio = clearedCount / TOTAL_SAMPLE_POINTS;
          const pct = Math.round(ratio * 100);
          setScratchPercent(pct);

          if (ratio >= REVEAL_THRESHOLD && !isRevealingRef.current) {
            handleRevealAll();
          }
        }
      },
      [width, height, handleRevealAll]
    );

    // PanResponder for smooth finger stroke tracking (like Google Pay)
    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !isRevealingRef.current,
          onMoveShouldSetPanResponder: () => !isRevealingRef.current,
          onPanResponderGrant: (evt) => {
            if (isRevealingRef.current) return;
            const { locationX, locationY } = evt.nativeEvent;
            currentPathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
            setActivePath(currentPathRef.current);

            // Add circle at start for instant tap response
            setTapCircles((prev) => [
              ...prev.slice(-40),
              { x: Math.round(locationX), y: Math.round(locationY) },
            ]);

            spawnSparks(locationX, locationY);
            updateSampleCoverage(locationX, locationY);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          },
          onPanResponderMove: (evt) => {
            if (isRevealingRef.current) return;
            const { locationX, locationY } = evt.nativeEvent;

            // Throttle frame rate for fluid 60fps gesture rendering
            const now = Date.now();
            if (now - lastFrameTimeRef.current < 16) return;
            lastFrameTimeRef.current = now;

            currentPathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
            setActivePath(currentPathRef.current);

            updateSampleCoverage(locationX, locationY);

            // Throttle haptic rattle (every 65ms) to feel like physical metallic foil scratch
            if (now - lastHapticTimeRef.current > 65) {
              lastHapticTimeRef.current = now;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              spawnSparks(locationX, locationY);
            }
          },
          onPanResponderRelease: () => {
            if (currentPathRef.current) {
              setPaths((prev) => [...prev, currentPathRef.current]);
              currentPathRef.current = '';
              setActivePath('');
            }
          },
        }),
      [spawnSparks, updateSampleCoverage]
    );

    // Clear transient sparks over time
    useEffect(() => {
      if (sparks.length === 0) return;
      const timer = setTimeout(() => {
        setSparks((prev) => (prev.length > 0 ? prev.slice(1) : []));
      }, 350);
      return () => clearTimeout(timer);
    }, [sparks]);

    return (
      <View style={[styles.wrapper, { width }]}>
        {/* Main Card */}
        <View
          ref={cardRef}
          collapsable={false}
          style={[styles.card, { width, height }]}
        >
          {/* ======================================================== */}
          {/* UNDERNEATH LAYER: THE CELESTIAL FULL MOON & BLESSINGS   */}
          {/* ======================================================== */}
          <LinearGradient
            colors={['#030712', '#070E24', '#0B1536', '#040817']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          >
            {/* Twinkling ambient star field */}
            <View style={styles.starCluster} pointerEvents="none">
              <Text style={[styles.star, { top: 16, left: 20 }]}>✦</Text>
              <Text style={[styles.star, { top: 28, right: 26 }]}>✧</Text>
              <Text style={[styles.star, { top: 65, left: 35 }]}>·</Text>
              <Text style={[styles.star, { top: 110, right: 18 }]}>✦</Text>
              <Text style={[styles.star, { bottom: 90, left: 24 }]}>✧</Text>
              <Text style={[styles.star, { bottom: 45, right: 30 }]}>✦</Text>
            </View>

            {/* Sacred Brahmand Crest Watermark */}
            <View style={styles.brandCrest}>
              <RNImage
                source={require('../../assets/images/brahmand_logo_official.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>BRAHMAND</Text>
            </View>

            {/* Golden Shloka Pill */}
            <View style={styles.goldenTraditionBadge}>
              <Text style={styles.goldenTraditionSparkle}>✨</Text>
              <Text style={styles.goldenTraditionText} numberOfLines={1}>
                {isKarwaChauth
                  ? '॥ ॐ श्रीं सोम सोमाय नमः • ॐ नमः शिवायै ॥'
                  : isSharadPurnima
                  ? '॥ ॐ सों सोमाय नमः • ॐ महालक्ष्म्यै नमः ॥'
                  : '॥ ॐ सोम सोमाय नमः • सर्वे भवन्तु सुखिनः ॥'}
              </Text>
              <Text style={styles.goldenTraditionSparkle}>✨</Text>
            </View>

            {/* Glowing Sacred Moon with Radiant Pulsing Halo */}
            <View style={styles.moonStage}>
              <Animated.View
                style={[
                  styles.lunarHalo,
                  {
                    transform: [{ scale: moonGlowAnim }],
                  },
                ]}
              />
              <RNImage
                source={require('../../assets/images/festivals/sharad_moon_transparent.png')}
                style={styles.moonImage}
                resizeMode="contain"
              />
            </View>

            {/* Headline Festival Greetings */}
            <View style={styles.blessingBox}>
              <Text style={styles.festivalTitleText} numberOfLines={1}>
                {isKarwaChauth
                  ? 'करवा चौथ'
                  : isSharadPurnima
                  ? 'शरद पूर्णिमा'
                  : festivalName}
              </Text>
              <Text style={styles.festivalSubheading}>
                की पावन अमृतमयी शुभकामनाएं
              </Text>

              {/* Golden Line Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerSparkle}>✦ 🌕 ✦</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Poetic & Divine Blessings */}
              <Text style={styles.poeticBlessing}>
                {isKarwaChauth
                  ? 'पावन चाँद का दीदार आपके जीवन में अखंड सौभाग्य, अटूट प्रेम एवं दीर्घायु का वरदान लाए।'
                  : isSharadPurnima
                  ? 'शरद पूर्णिमा के चंद्रमा की धवल चांदनी आपके जीवन में उत्तम आरोग्य, सुख-शांति एवं माँ लक्ष्मी की कृपा बरसाए।'
                  : 'पावन पूर्णिमा के चंद्रमा का दिव्य प्रकाश आपके जीवन में सुख, शांति एवं समृद्धि का संचार करे।'}
              </Text>

              {/* Personalized Sender Attribution */}
              {cleanSender ? (
                <View style={styles.senderPill}>
                  <Text style={styles.senderNamaste}>🙏</Text>
                  <Text style={styles.senderLabel}>सप्रेम प्रेषक :</Text>
                  <Text style={styles.senderNameText} numberOfLines={1}>
                    {cleanSender} सपरिवार
                  </Text>
                </View>
              ) : (
                <View style={styles.senderPill}>
                  <Text style={styles.senderNamaste}>🙏</Text>
                  <Text style={styles.senderNameText}>
                    ॥ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ॥
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ======================================================== */}
          {/* OVERLAY LAYER: AUTHENTIC GOOGLE PAY STYLE SCRATCH FOIL   */}
          {/* ======================================================== */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.scratchOverlay,
              { opacity: foilOpacityAnim },
            ]}
            pointerEvents={isRevealed ? 'none' : 'auto'}
            {...panResponder.panHandlers}
          >
            {/* SVG Mask: White Rect = Foil Opaque; Black Path/Circles = Hole Through Foil */}
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
              <Defs>
                <Mask id="chandScratchMask">
                  {/* Base: 100% Opaque Foil */}
                  <Rect x="0" y="0" width={width} height={height} fill="#FFFFFF" />

                  {/* Individual tap punch holes */}
                  {tapCircles.map((c, i) => (
                    <Circle
                      key={`tap-${i}`}
                      cx={c.x}
                      cy={c.y}
                      r={BRUSH_SIZE / 2}
                      fill="#000000"
                    />
                  ))}

                  {/* Committed finger drag paths */}
                  {paths.map((p, i) => (
                    <Path
                      key={`p-${i}`}
                      d={p}
                      stroke="#000000"
                      strokeWidth={BRUSH_SIZE}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}

                  {/* Active dragging path */}
                  {Boolean(activePath) && (
                    <Path
                      d={activePath}
                      stroke="#000000"
                      strokeWidth={BRUSH_SIZE}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                </Mask>

                {/* Metallic Midnight Blue/Purple Foil Gradient (GPay Style) */}
                <SvgLinearGradient id="gpayFoilGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#0B0F2A" />
                  <Stop offset="30%" stopColor="#1E1B4B" />
                  <Stop offset="65%" stopColor="#2E1065" />
                  <Stop offset="100%" stopColor="#0B0F2A" />
                </SvgLinearGradient>

                {/* Golden metallic border shine */}
                <SvgLinearGradient id="goldSheen" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <Stop offset="50%" stopColor="#FDE047" stopOpacity="0.9" />
                  <Stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
                </SvgLinearGradient>
              </Defs>

              {/* The Scratchable Foil Surface (Masked by chandScratchMask) */}
              <G mask="url(#chandScratchMask)">
                {/* Metallic Card Background */}
                <Rect x="0" y="0" width={width} height={height} fill="url(#gpayFoilGrad)" />

                {/* Ornate Golden Metallic Border Frame */}
                <Rect
                  x="8"
                  y="8"
                  width={width - 16}
                  height={height - 16}
                  rx="18"
                  fill="none"
                  stroke="url(#goldSheen)"
                  strokeWidth="1.5"
                  strokeDasharray="8 4"
                />

                {/* Diagonal subtle metallic foil sheen strokes */}
                <Path
                  d={`M 0 ${height * 0.4} L ${width} ${height * 0.1}`}
                  stroke="rgba(254, 240, 138, 0.12)"
                  strokeWidth="40"
                />
                <Path
                  d={`M 0 ${height * 0.75} L ${width} ${height * 0.45}`}
                  stroke="rgba(254, 240, 138, 0.1)"
                  strokeWidth="50"
                />

                {/* Constellation & Stardust patterns on the foil */}
                <Circle cx={width * 0.2} cy={height * 0.15} r="2" fill="#FDE047" opacity="0.6" />
                <Circle cx={width * 0.8} cy={height * 0.22} r="2.5" fill="#FDE047" opacity="0.5" />
                <Circle cx={width * 0.15} cy={height * 0.75} r="1.8" fill="#FDE047" opacity="0.5" />
                <Circle cx={width * 0.82} cy={height * 0.82} r="2.2" fill="#FDE047" opacity="0.6" />
              </G>
            </Svg>

            {/* Instructional Overlay Teaser (Softly fades as scratching begins) */}
            <View
              style={[
                styles.foilContentOverlay,
                { opacity: Math.max(0, 1 - scratchPercent / 18) },
              ]}
              pointerEvents="none"
            >
              <View style={styles.foilBrandRow}>
                <RNImage
                  source={require('../../assets/images/brahmand_logo_official.png')}
                  style={styles.foilLogo}
                  resizeMode="contain"
                />
                <Text style={styles.foilBrandName}>BRAHMAND SPECIAL</Text>
              </View>

              {/* Shimmering Center Crest */}
              <View style={styles.gpaySeal}>
                <Ionicons name="moon" size={44} color="#FBBF24" />
                <View style={styles.sealSparkleWrap}>
                  <Text style={styles.sealSparkleEmoji}>✨</Text>
                </View>
              </View>

              {/* Catchy GPay Style Hook */}
              <View style={styles.taglineBox}>
                <Text style={styles.foilHeadline}>चाँद दिखा?</Text>
                <Text style={styles.foilPunchline}>
                  जब तक चाँद नहीं देखा,
                </Text>
                <Text style={styles.foilSubPunchline}>
                  तब तक विश नहीं मिलेगी!
                </Text>
              </View>

              {/* Swipe/Scratch Prompt */}
              <View style={styles.swipePromptPill}>
                <Text style={styles.swipeHandEmoji}>👆</Text>
                <Text style={styles.swipePromptText}>
                  उंगली से स्क्रैच करें (Scratch Here)
                </Text>
                <Text style={styles.swipeSparkleEmoji}>✨</Text>
              </View>
            </View>

            {/* Flying Stardust Sparks while scratching */}
            {sparks.map((sp) => (
              <Text
                key={sp.id}
                style={[
                  styles.sparkItem,
                  {
                    left: sp.x,
                    top: sp.y,
                    fontSize: sp.size,
                  },
                ]}
                pointerEvents="none"
              >
                {sp.emoji}
              </Text>
            ))}

            {/* Live Scratch Percentage Counter (Corner Pill) */}
            {scratchPercent > 0 && (
              <View style={styles.cornerProgressPill} pointerEvents="none">
                <Ionicons name="sparkles" size={11} color="#1E1B4B" />
                <Text style={styles.cornerProgressText}>
                  {scratchPercent}% Scratched
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Celebratory Banner on Successful Moon Sighting */}
          {isRevealed && (
            <Animated.View
              style={[
                styles.darshanBanner,
                {
                  opacity: celebrateAnim,
                  transform: [
                    {
                      translateY: celebrateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-25, 0],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.darshanBannerText}>
                🌕 चाँद दिख गया! दर्शन सम्पूर्ण 🌕
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Card Footer Controls: Scratch Again / Reveal Quick Button */}
        <View style={styles.footerControlRow}>
          {isRevealed ? (
            <TouchableOpacity
              style={styles.controlPillButton}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color="#FDE047" />
              <Text style={styles.controlPillText}>फिर से स्क्रैच करें (Scratch Again)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.controlPillButton}
              onPress={handleRevealAll}
              activeOpacity={0.8}
            >
              <Ionicons name="eye" size={14} color="#FDE047" />
              <Text style={styles.controlPillText}>सीधे चाँद देखें (Reveal Now)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#030712',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  starCluster: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    color: 'rgba(254, 240, 138, 0.7)',
    fontSize: 12,
  },
  brandCrest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  brandLogo: {
    width: 20,
    height: 20,
  },
  brandTitle: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#FEF08A',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goldenTraditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    marginTop: 8,
    maxWidth: '90%',
  },
  goldenTraditionSparkle: {
    fontSize: 10,
    marginHorizontal: 3,
  },
  goldenTraditionText: {
    fontSize: 10,
    color: '#FDE047',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  moonStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    height: 142,
  },
  lunarHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(254, 240, 138, 0.22)',
    shadowColor: '#FEF08A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 32,
  },
  moonImage: {
    width: 130,
    height: 130,
  },
  blessingBox: {
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 8,
  },
  festivalTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFBEB',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(245, 158, 11, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  festivalSubheading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FDE047',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(251, 191, 36, 0.35)',
  },
  dividerSparkle: {
    fontSize: 10,
    color: '#FDE047',
    paddingHorizontal: 8,
  },
  poeticBlessing: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#E2E8F0',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  senderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 12,
    borderWidth: 0.8,
    borderColor: 'rgba(254, 240, 138, 0.25)',
    maxWidth: '92%',
  },
  senderNamaste: {
    fontSize: 12,
    marginRight: 4,
  },
  senderLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 4,
  },
  senderNameText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FEF08A',
  },
  // Scratch Foil Overlay
  scratchOverlay: {
    zIndex: 10,
  },
  foilContentOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  foilBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  foilLogo: {
    width: 18,
    height: 18,
  },
  foilBrandName: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FEF08A',
  },
  gpaySeal: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  sealSparkleWrap: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  sealSparkleEmoji: {
    fontSize: 16,
  },
  taglineBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  foilHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFBEB',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  foilPunchline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 4,
  },
  foilSubPunchline: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FBBF24',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(245, 158, 11, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipePromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.6)',
    gap: 6,
  },
  swipeHandEmoji: {
    fontSize: 15,
  },
  swipePromptText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDE047',
    letterSpacing: 0.3,
  },
  swipeSparkleEmoji: {
    fontSize: 12,
  },
  sparkItem: {
    position: 'absolute',
    zIndex: 20,
  },
  cornerProgressPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE047',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cornerProgressText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  darshanBanner: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  darshanBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: 0.4,
  },
  footerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  controlPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    gap: 6,
  },
  controlPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE047',
  },
});

export default ChandDikhaScratchCard;
