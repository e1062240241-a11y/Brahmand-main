import { Avatar } from '../Avatar';
import HomeFeedTabs from '../HomeFeedTabs';
import UiverseNotifyButton from '../UiverseNotifyButton';
import { FONTS } from '../../constants/theme';
import { formatTime } from '../../features/live-mantra/schedule';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView as ExpoVideoView } from 'expo-video';
import { useSafeVideoPlayer, isPlayerValid } from '../SafeVideoView';
import React from 'react';
import { useRouter } from 'expo-router';
import { Animated, AppState, Easing, Image, ImageBackground, Platform, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './home.styles';
import { PAGE_PADDING, SCREEN_WIDTH, baseQuickAccess, formatFestivalDate, shivaImage } from './homeConstants';
import { ActionCardsRow } from './ActionCardsRow';
import { scheduleShravanKatha15MinReminder } from '../../services/pushNotifications';
import { SharadPurnimaMoonCorner } from './SharadPurnimaMoonCorner';
import Svg, { Circle, Defs, RadialGradient, Stop, Path, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const sharadPurnimaBannerImage = require('../../../assets/images/festivals/sharad_purnima_banner.jpg');

const DynamicEventBadge = React.memo(function DynamicEventBadge({
    eventStatus,
    targetLiveTime,
    isFocused = true,
}: {
    eventStatus: 'upcoming' | 'starting_soon' | 'live' | 'between_streams' | 'ended' | 'campaign_completed';
    targetLiveTime?: Date;
    isFocused?: boolean;
}) {
    const isLive = eventStatus === 'live';
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const pulseOpacity = React.useRef(new Animated.Value(0.4)).current;
    const [timeLeftStr, setTimeLeftStr] = React.useState<string>('');

    const hasFiredImpression = React.useRef(false);

    // Track Single Impression Analytics on mount
    React.useEffect(() => {
        if (!hasFiredImpression.current) {
            hasFiredImpression.current = true;
            if (__DEV__) {
                console.log(`[Analytics] banner_impression fired for eventStatus: ${eventStatus}`);
            }
        }
    }, [eventStatus]);

    const [, setAppStateTick] = React.useState(0);
    React.useEffect(() => {
        if (!isFocused) return;
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                setAppStateTick((prev) => prev + 1);
            }
        });
        return () => subscription.remove();
    }, [isFocused]);

    // Real-time Countdown Interval for upcoming / starting_soon / between_streams states
    React.useEffect(() => {
        if (isLive || eventStatus === 'ended' || eventStatus === 'campaign_completed' || !targetLiveTime) {
            setTimeLeftStr('');
            return;
        }

        let intervalId: any = null;

        const updateTimer = () => {
            const now = new Date();
            const diffMs = targetLiveTime.getTime() - now.getTime();

            if (diffMs <= 0) {
                setTimeLeftStr('00:00');
                return;
            }

            const totalSecs = Math.floor(diffMs / 1000);
            const hours = Math.floor(totalSecs / 3600);
            const minutes = Math.floor((totalSecs % 3600) / 60);

            const pad = (n: number) => n.toString().padStart(2, '0');
            if (hours > 0) {
                setTimeLeftStr(`${pad(hours)}h ${pad(minutes)}m`);
            } else {
                setTimeLeftStr(`${pad(minutes)}m`);
            }
        };

        const startTimer = () => {
            updateTimer();
            if (!intervalId) {
                intervalId = setInterval(updateTimer, 1000);
            }
        };

        const stopTimer = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        if (isFocused && AppState.currentState === 'active') {
            startTimer();
        }

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && isFocused) {
                startTimer();
            } else {
                stopTimer();
            }
        });

        return () => {
            stopTimer();
            subscription.remove();
        };
    }, [eventStatus, isLive, targetLiveTime, isFocused]);

    // Live Pulse Animation Loop
    React.useEffect(() => {
        if (!isLive) return;
        const loop = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(pulseOpacity, {
                        toValue: 0.05,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0.4,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isLive, pulseAnim, pulseOpacity]);

    let badgeBg = 'rgba(216, 90, 0, 0.9)';
    let badgeBorder = 'rgba(255, 215, 0, 0.5)';
    let badgeText = 'FREE REGISTRATION';
    let badgeIcon = '🔱';

    if (eventStatus === 'live') {
        return null;
    } else if (eventStatus === 'starting_soon') {
        badgeBg = '#E65100';
        badgeBorder = 'rgba(255, 235, 59, 0.8)';
        badgeText = 'STARTING SOON';
        badgeIcon = '🔴';
    } else if (eventStatus === 'between_streams') {
        badgeBg = 'rgba(30, 25, 20, 0.88)';
        badgeBorder = '#FFD700';
        badgeText = 'SHRAVAN KATHA';
        badgeIcon = '📺';
    } else if (eventStatus === 'campaign_completed' || eventStatus === 'ended') {
        badgeBg = 'rgba(40, 40, 40, 0.85)';
        badgeBorder = 'rgba(255, 215, 0, 0.4)';
        badgeText = 'SHRAVAN KATHA COMPLETED';
        badgeIcon = '🕉';
    }

    return (
        <View
            pointerEvents="none"
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 10,
            }}
        >
            <Text
                style={{
                    color: '#FFD700',
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 0.3,
                    textShadowColor: 'rgba(0, 0, 0, 0.9)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                }}
            >
                {badgeIcon} {badgeText}
            </Text>
        </View>
    );
});

const StaticBannerCard = ({ source, width, onPress, onPressIn, onPressOut, children }: any) => (
    <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{
            width,
            height: Platform.OS === 'ios' ? 185 : 160,
            borderRadius: 16,
            overflow: 'hidden',
            alignSelf: 'center',
            marginBottom: 5,
            backgroundColor: '#000',
            // intentionally NO shadowColor / shadowOpacity / elevation
        }}
    >
        <Image
            source={source}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
            resizeMode="cover"
        />
        <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.25)']}
            style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 2,
                paddingHorizontal: 14,
                paddingVertical: 12,
                justifyContent: 'space-between',
            }}
        >
            {children}
        </LinearGradient>
    </Pressable>
);

interface StarData {
    top: number;
    left: any;
    size: number;
    group: 1 | 2 | 3 | 4;
    isDiamond?: boolean;
    isSparkle?: boolean;
    color?: string;
}

// 4-pointed flared diffraction-spike sparkle star
const SparkleStar = React.memo(function SparkleStar({
    size,
    color = '#FFFFFF',
}: {
    size: number;
    color?: string;
}) {
    const half = size;
    return (
        <Svg width={size * 2} height={size * 2} viewBox={`-${half} -${half} ${size * 2} ${size * 2}`}>
            <Defs>
                <RadialGradient id={`spkGlow-${size}`} cx="0" cy="0" r={half} gradientUnits="userSpaceOnUse">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="40%" stopColor={color} stopOpacity="0.85" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0" />
                </RadialGradient>
            </Defs>
            <Path
                d={`M 0,-${half} Q 0,0 ${half},0 Q 0,0 0,${half} Q 0,0 -${half},0 Q 0,0 0,-${half} Z`}
                fill={`url(#spkGlow-${size})`}
            />
            <Circle cx="0" cy="0" r={Math.max(1.4, size * 0.28)} fill="#FFFFFF" />
        </Svg>
    );
});

const STAR_CATALOG: StarData[] = [
    // Bleed stars (status bar / Dynamic Island nocturnal canopy)
    { top: -45, left: '22%', size: 7.5, group: 1, isSparkle: true, color: '#D4E9FF' },
    { top: -38, left: '58%', size: 3.2, group: 2 },
    { top: -46, left: '84%', size: 4.8, group: 3, isDiamond: true },
    { top: -20, left: '42%', size: 2.8, group: 4 },
    { top: -14, left: '76%', size: 8.0, group: 1, isSparkle: true, color: '#FFFFFF' },
    { top: -28, left: '92%', size: 2.5, group: 2 },

    // Header title zone stars
    { top: 8, left: '34%', size: 4.2, group: 2, isDiamond: true },
    { top: 22, left: '54%', size: 2.8, group: 3 },
    { top: 10, left: '72%', size: 8.5, group: 1, isSparkle: true, color: '#FFEBB0' },
    { top: 26, left: '88%', size: 3.5, group: 4 },
    { top: 40, left: '24%', size: 3.0, group: 2 },
    { top: 48, left: '66%', size: 4.5, group: 3, isDiamond: true },
    { top: 58, left: '44%', size: 7.2, group: 1, isSparkle: true, color: '#E2F1FF' },
    { top: 66, left: '80%', size: 3.2, group: 4 },

    // Mid sky stars (around banners & quick access)
    { top: 78, left: '16%', size: 3.6, group: 4 },
    { top: 86, left: '78%', size: 5.2, group: 2, isDiamond: true },
    { top: 102, left: '32%', size: 2.8, group: 3 },
    { top: 114, left: '90%', size: 7.8, group: 1, isSparkle: true, color: '#D4E9FF' },
    { top: 132, left: '50%', size: 3.8, group: 4 },
    { top: 150, left: '22%', size: 3.0, group: 2 },
    { top: 168, left: '82%', size: 4.6, group: 3, isDiamond: true },
    { top: 186, left: '38%', size: 3.2, group: 1 },
    { top: 210, left: '68%', size: 8.0, group: 4, isSparkle: true, color: '#FFFFFF' },
    { top: 235, left: '14%', size: 3.5, group: 2 },
    { top: 258, left: '86%', size: 2.8, group: 3 },
    { top: 285, left: '46%', size: 4.8, group: 1, isDiamond: true },
    { top: 310, left: '28%', size: 3.0, group: 4 },
    { top: 325, left: '74%', size: 3.4, group: 2 },
];

const CelestialNightCanopy = React.memo(function CelestialNightCanopy({
    insetsTop = 0,
}: {
    insetsTop?: number;
}) {
    // 4 native animation drivers for organic, staggered star twinkling (opacity & scale)
    const twinkle1 = React.useRef(new Animated.Value(0.3)).current;
    const twinkle2 = React.useRef(new Animated.Value(0.85)).current;
    const twinkle3 = React.useRef(new Animated.Value(0.2)).current;
    const twinkle4 = React.useRef(new Animated.Value(0.5)).current;

    // Comet (धूमकेतु) streak animation drivers on app open
    const cometAnim = React.useRef(new Animated.Value(0)).current;
    const microMeteorAnim = React.useRef(new Animated.Value(0)).current;

    // Launch comet across the cosmic sky
    const triggerCosmicComet = React.useCallback(() => {
        cometAnim.setValue(0);
        microMeteorAnim.setValue(0);

        // Primary majestic comet
        Animated.timing(cometAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.bezier(0.22, 0.61, 0.36, 1),
            useNativeDriver: true,
        }).start();

        // Secondary subtle fast trailing micro-meteor (offset by 280ms)
        setTimeout(() => {
            Animated.timing(microMeteorAnim, {
                toValue: 1,
                duration: 1100,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
            }).start();
        }, 280);
    }, [cometAnim, microMeteorAnim]);

    React.useEffect(() => {
        // Star Group 1: Fast sparkle shimmer with breathing scale (1500ms loop)
        const anim1 = Animated.loop(
            Animated.sequence([
                Animated.timing(twinkle1, {
                    toValue: 1.0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(twinkle1, {
                    toValue: 0.3,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        // Star Group 2: Mid-paced gentle pulse (2300ms loop)
        const anim2 = Animated.loop(
            Animated.sequence([
                Animated.timing(twinkle2, {
                    toValue: 0.25,
                    duration: 2300,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(twinkle2, {
                    toValue: 1.0,
                    duration: 2300,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        // Star Group 3: Slow majestic breathing star (3200ms loop)
        const anim3 = Animated.loop(
            Animated.sequence([
                Animated.timing(twinkle3, {
                    toValue: 0.95,
                    duration: 3200,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(twinkle3, {
                    toValue: 0.2,
                    duration: 3200,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        // Star Group 4: Glittering diamond stars (1900ms loop)
        const anim4 = Animated.loop(
            Animated.sequence([
                Animated.timing(twinkle4, {
                    toValue: 1.0,
                    duration: 1900,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(twinkle4, {
                    toValue: 0.35,
                    duration: 1900,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        anim1.start();
        anim2.start();
        anim3.start();
        anim4.start();

        // 🌟 Launch Comet when user opens the app (600ms delay after mount)
        const initialCometTimer = setTimeout(() => {
            triggerCosmicComet();
        }, 600);

        // Periodic gentle repeat every 25s for living nocturnal cosmos
        const periodicInterval = setInterval(() => {
            triggerCosmicComet();
        }, 25000);

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
            anim4.stop();
            clearTimeout(initialCometTimer);
            clearInterval(periodicInterval);
        };
    }, [twinkle1, twinkle2, twinkle3, twinkle4, triggerCosmicComet]);

    // Scale interpolations for dynamic twinkling
    const scale1 = twinkle1.interpolate({ inputRange: [0.3, 1.0], outputRange: [0.75, 1.35] });
    const scale2 = twinkle2.interpolate({ inputRange: [0.25, 1.0], outputRange: [0.7, 1.4] });
    const scale3 = twinkle3.interpolate({ inputRange: [0.2, 0.95], outputRange: [0.65, 1.45] });
    const scale4 = twinkle4.interpolate({ inputRange: [0.35, 1.0], outputRange: [0.75, 1.55] });

    // Primary Comet trajectory & dynamics
    const cometTranslateX = cometAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-140, SCREEN_WIDTH + 80],
    });
    const cometTranslateY = cometAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 155],
    });
    const cometOpacity = cometAnim.interpolate({
        inputRange: [0, 0.08, 0.7, 0.9, 1],
        outputRange: [0, 1, 0.95, 0.35, 0],
    });
    const cometScaleX = cometAnim.interpolate({
        inputRange: [0, 0.15, 0.75, 1],
        outputRange: [0.5, 1.3, 1.0, 0.4],
    });

    // Micro-meteor trajectory & dynamics
    const microTranslateX = microMeteorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, SCREEN_WIDTH + 60],
    });
    const microTranslateY = microMeteorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [45, 140],
    });
    const microOpacity = microMeteorAnim.interpolate({
        inputRange: [0, 0.1, 0.65, 0.9, 1],
        outputRange: [0, 0.85, 0.8, 0.2, 0],
    });

    const totalHeight = 440 + insetsTop;
    const bleedTop = -(insetsTop + 40);

    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: bleedTop,
                left: -PAGE_PADDING,
                right: -PAGE_PADDING,
                height: totalHeight,
                zIndex: 0,
                overflow: 'hidden',
            }}
        >
            {/* Luminous celestial moonlight radiance centered on the corner moon */}
            <Svg width="100%" height={totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
                <Defs>
                    <RadialGradient
                        id="headerMoonAura"
                        cx={PAGE_PADDING + 22}
                        cy={insetsTop + 40}
                        r="290"
                        gradientUnits="userSpaceOnUse"
                    >
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                        <Stop offset="25%" stopColor="#E2F1FF" stopOpacity="0.22" />
                        <Stop offset="55%" stopColor="#8AB4E2" stopOpacity="0.07" />
                        <Stop offset="85%" stopColor="#1E2433" stopOpacity="0.01" />
                        <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Circle cx={PAGE_PADDING + 22} cy={insetsTop + 40} r="290" fill="url(#headerMoonAura)" />
            </Svg>

            {/* 🌠 Primary Majestic Comet (धूमकेतु) streaking across the night sky */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: insetsTop + 25,
                    left: 0,
                    width: 140,
                    height: 32,
                    opacity: cometOpacity,
                    transform: [
                        { translateX: cometTranslateX },
                        { translateY: cometTranslateY },
                        { rotate: '18deg' },
                        { scaleX: cometScaleX },
                    ],
                }}
            >
                <Svg width={140} height={32} viewBox="0 0 140 32">
                    <Defs>
                        <SvgLinearGradient id="cometTailGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                            <Stop offset="0%" stopColor="#AEE9F7" stopOpacity="0" />
                            <Stop offset="40%" stopColor="#AEE9F7" stopOpacity="0.2" />
                            <Stop offset="75%" stopColor="#DDF2FF" stopOpacity="0.75" />
                            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                        </SvgLinearGradient>
                        <RadialGradient id="cometNucleusAura" cx="126" cy="16" r="14" gradientUnits="userSpaceOnUse">
                            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                            <Stop offset="30%" stopColor="#E0F2FE" stopOpacity="0.95" />
                            <Stop offset="65%" stopColor="#7DD3FC" stopOpacity="0.5" />
                            <Stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    {/* Outer luminous tail beam */}
                    <Path d="M 0 16 L 126 10 L 126 22 Z" fill="url(#cometTailGrad)" opacity={0.35} />
                    {/* Inner core radiant tail */}
                    <Path d="M 15 16 L 126 13 L 126 19 Z" fill="url(#cometTailGrad)" />
                    {/* Coma halo aura */}
                    <Circle cx="126" cy="16" r="13" fill="url(#cometNucleusAura)" />
                    {/* Blazing hot nucleus */}
                    <Circle cx="126" cy="16" r="3.5" fill="#FFFFFF" />
                    <Circle cx="127" cy="16" r="1.8" fill="#FFFFFF" />
                </Svg>
            </Animated.View>

            {/* 🌠 Secondary Trailing Micro-Meteor (उल्का) */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: insetsTop + 40,
                    left: 0,
                    width: 90,
                    height: 20,
                    opacity: microOpacity,
                    transform: [
                        { translateX: microTranslateX },
                        { translateY: microTranslateY },
                        { rotate: '16deg' },
                    ],
                }}
            >
                <Svg width={90} height={20} viewBox="0 0 90 20">
                    <Defs>
                        <SvgLinearGradient id="microTailGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                            <Stop offset="0%" stopColor="#93C5FD" stopOpacity="0" />
                            <Stop offset="60%" stopColor="#BFDBFE" stopOpacity="0.5" />
                            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                        </SvgLinearGradient>
                    </Defs>
                    <Path d="M 0 10 L 82 8.5 L 82 11.5 Z" fill="url(#microTailGrad)" />
                    <Circle cx="82" cy="10" r="2.2" fill="#FFFFFF" />
                </Svg>
            </Animated.View>

            {/* ✨ Twinkling Animated Celestial Stars with Scale & Opacity */}
            {STAR_CATALOG.map((star, idx) => {
                let opacityAnim: Animated.Value;
                let scaleAnim: Animated.AnimatedInterpolation<number>;

                if (star.group === 1) {
                    opacityAnim = twinkle1;
                    scaleAnim = scale1;
                } else if (star.group === 2) {
                    opacityAnim = twinkle2;
                    scaleAnim = scale2;
                } else if (star.group === 3) {
                    opacityAnim = twinkle3;
                    scaleAnim = scale3;
                } else {
                    opacityAnim = twinkle4;
                    scaleAnim = scale4;
                }

                const starTop = insetsTop + 40 + star.top;

                // 4-pointed diffraction spike sparkle star
                if (star.isSparkle) {
                    return (
                        <Animated.View
                            key={`sky-star-${idx}`}
                            style={{
                                position: 'absolute',
                                top: starTop - star.size,
                                left: star.left,
                                opacity: opacityAnim,
                                transform: [{ scale: scaleAnim }],
                            }}
                        >
                            <SparkleStar size={star.size} color={star.color} />
                        </Animated.View>
                    );
                }

                // Diamond tilted star
                if (star.isDiamond) {
                    return (
                        <Animated.View
                            key={`sky-star-${idx}`}
                            style={{
                                position: 'absolute',
                                top: starTop,
                                left: star.left,
                                width: star.size,
                                height: star.size,
                                backgroundColor: '#FFFFFF',
                                opacity: opacityAnim,
                                transform: [{ rotate: '45deg' }, { scale: scaleAnim }],
                                shadowColor: '#FFFFFF',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.95,
                                shadowRadius: 3.5,
                            }}
                        />
                    );
                }

                // Luminous circular star
                return (
                    <Animated.View
                        key={`sky-star-${idx}`}
                        style={{
                            position: 'absolute',
                            top: starTop,
                            left: star.left,
                            width: star.size,
                            height: star.size,
                            borderRadius: star.size / 2,
                            backgroundColor: '#FFFFFF',
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                            shadowColor: '#E2F1FF',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 3,
                        }}
                    />
                );
            })}
        </View>
    );
});

export const HomeHeaderComponent = React.memo(function HomeHeaderComponent({
    user,
    firstName,
    avatarUri,
    unreadCount,
    nextFestival,
    t,
    searchActive,
    setSearchActive,
    searchTerm,
    setSearchTerm,
    hashtagResults,
    loadingHashtags,
    searchResults,
    loadingUsers,
    followingSet,
    handleFollowUser,
    saveRecentSearch,
    recentSearches,
    setRecentSearches,
    reminders,
    handleSetReminder,
    handleLiveJaapNavigation,
    handleNotificationPress,
    hanumanStatus,
    shivaStatus,
    hanumanChantCount,
    shivaChantCount,
    safeCommunityRequests,
    activeTab,
    setActiveTab,
    activeFeatureIndex,
    setActiveFeatureIndex,
    activeBannerIndex,
    setActiveBannerIndex,
    screenWidth,
    featureSnapInterval,
    featureCardWidth,
    featureCardHeight,
    cityId,
    cityName,
    cityMembers,
    localId,
    localSubgroup,
    realGroupName,
    localMembers,
    topFeaturesScrollRef,
    topFeaturesAutoScrollIndex,
    bannerScrollRef,
    bannerAutoScrollIndex,
    isHoldingTopFeaturesRef,
    isHoldingBannerRef,
    isFocused,
    kathaStatus,
    quickAccessItems,
}: {
    user: any;
    firstName: string;
    avatarUri?: string;
    unreadCount: number;
    nextFestival: any;
    t: (key: string) => string;
    searchActive: boolean;
    setSearchActive: (v: boolean) => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    hashtagResults: any[];
    loadingHashtags: boolean;
    searchResults: any[];
    loadingUsers: boolean;
    followingSet: Set<string>;
    handleFollowUser: (id: string) => void;
    saveRecentSearch: (item: any) => void;
    recentSearches: any[];
    setRecentSearches: (v: any[]) => void;
    reminders: Record<string, boolean>;
    handleSetReminder: (mantraType: string, sessionName: string) => void;
    handleLiveJaapNavigation: (mantraType: string, title: string) => void;
    handleNotificationPress: () => void;
    hanumanStatus: any;
    shivaStatus: any;
    hanumanChantCount: number;
    shivaChantCount: number;
    safeCommunityRequests: any[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    activeFeatureIndex: number;
    setActiveFeatureIndex: (v: number) => void;
    activeBannerIndex: number;
    setActiveBannerIndex: (v: number) => void;
    screenWidth: number;
    featureSnapInterval: number;
    featureCardWidth: number;
    featureCardHeight: number;
    cityId: any;
    cityName: string;
    cityMembers: number;
    localId: any;
    localSubgroup: string;
    realGroupName: string;
    localMembers: number;
    topFeaturesScrollRef: any;
    topFeaturesAutoScrollIndex: any;
    bannerScrollRef: any;
    bannerAutoScrollIndex?: React.MutableRefObject<number>;
    isHoldingTopFeaturesRef?: React.MutableRefObject<boolean>;
    isHoldingBannerRef?: React.MutableRefObject<boolean>;
    isFocused?: boolean;
    kathaStatus?: any;
    quickAccessItems?: any[];
}) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const statusBarHeight = Platform.OS === 'android' ? Math.max(RNStatusBar.currentHeight ?? 0, insets.top) : insets.top;
    const isNavigatingRef = React.useRef(false);

    const handleNavigateKatha = React.useCallback(() => {
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;
        router.push('/library/katha');
        setTimeout(() => {
            isNavigatingRef.current = false;
        }, 1000);
    }, [router]);

    const featuredItems = quickAccessItems && quickAccessItems.length > 0 ? quickAccessItems : baseQuickAccess;
    const [videoError, setVideoError] = React.useState(false);

    const achPlayer = useSafeVideoPlayer('https://brahmandfeed23.b-cdn.net/assets/ACH.mp4', (player) => {
        player.loop = true;
        player.muted = true;
        try {
            player.pause();
        } catch (_e) { }
    });

    React.useEffect(() => {
        if (!isPlayerValid(achPlayer)) return;

        const statusSubscription = achPlayer.addListener('statusChange', (payload: any) => {
            const status = typeof payload === 'string' ? payload : payload?.status;
            const error = typeof payload === 'object' ? payload?.error : undefined;
            if (status === 'error' || error) {
                if (__DEV__) {
                    console.warn('[HomeHeaderComponent] Video playback error, using WebP fallback:', error || status);
                }
                setVideoError(true);
            }
        });

        return () => {
            statusSubscription?.remove();
        };
    }, [achPlayer]);

    const isHanumanActive = Boolean(hanumanStatus?.isActive);

    React.useEffect(() => {
        if (!isPlayerValid(achPlayer)) return;
        const activeFocused = isFocused !== false;

        const updatePlayback = (appState: string = AppState.currentState) => {
            if (!isPlayerValid(achPlayer)) return;
            const isAppActive = appState === 'active';
            const targetBannerIdx = isHanumanActive ? 1 : -1;
            const shouldPlay = activeFocused && isAppActive && !videoError && activeBannerIndex === targetBannerIdx;
            if (shouldPlay) {
                try {
                    achPlayer.play();
                } catch (err) {
                    if (__DEV__) {
                        console.warn('[HomeHeaderComponent] Error starting video playback:', err);
                    }
                }
            } else {
                try {
                    achPlayer.pause();
                } catch (_e) { }
            }
        };

        updatePlayback();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            updatePlayback(nextAppState);
        });

        return () => {
            subscription.remove();
            try {
                if (isPlayerValid(achPlayer)) achPlayer.pause();
            } catch (_e) { }
        };
    }, [achPlayer, isFocused, videoError, activeBannerIndex, isHanumanActive]);
    return (
        <View style={{ paddingTop: 0 }}>
            {/* Feed loading state is now handled inside FeedSection */}
            <View>
                <View style={[styles.upperContentWrapper, { paddingTop: statusBarHeight + (Platform.OS === 'android' ? 6 : 2) }]}>
                    <CelestialNightCanopy insetsTop={statusBarHeight} />
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <SharadPurnimaMoonCorner
                                size={Platform.OS === 'android' ? 44 : 50}
                                showBadge={false}
                                onPress={() => router.push('/(tabs)/profile')}
                            />
                        </View>

                        <View style={{
                            position: 'absolute',
                            left: 54,
                            right: 90,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }} pointerEvents="none">
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: '#FFFFFF',
                                    textAlign: 'center',
                                    fontFamily: FONTS.brandTitle, // LOCKED: Brand typography identity
                                    fontSize: Platform.OS === 'android' ? 22 : 26,
                                    lineHeight: Platform.OS === 'android' ? 32 : undefined,
                                    fontStyle: 'normal',
                                    fontWeight: '400',
                                    letterSpacing: 0.5,
                                    includeFontPadding: true, // Prevents Android Cinzel font serifs from getting clipped!
                                    paddingHorizontal: 4,
                                    paddingVertical: Platform.OS === 'android' ? 4 : 2,
                                    textShadowColor: 'rgba(255, 255, 255, 0.45)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 8,
                                }}
                            >
                                BRAHMAND
                            </Text>
                        </View>

                        <View style={styles.headerRight}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.headerIconButton,
                                    Platform.OS === 'ios' && pressed && { opacity: 0.6 }
                                ]}
                                android_ripple={{
                                    color: 'rgba(255, 255, 255, 0.2)',
                                    borderless: true,
                                    foreground: true,
                                    radius: 20,
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => setSearchActive(!searchActive)}
                                accessibilityRole="button"
                                accessibilityLabel={searchActive ? "Close search" : "Open search"}
                            >
                                <Ionicons name={searchActive ? "close-outline" : "search-outline"} size={Platform.OS === 'android' ? 22 : 24} color="#FFFFFF" />
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.headerIconButton,
                                    Platform.OS === 'ios' && pressed && { opacity: 0.6 }
                                ]}
                                android_ripple={{
                                    color: 'rgba(255, 255, 255, 0.2)',
                                    borderless: true,
                                    foreground: true,
                                    radius: 20,
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={handleNotificationPress}
                                accessibilityRole="button"
                                accessibilityLabel="Notifications"
                            >
                                <View pointerEvents="none">
                                    <Ionicons name="notifications-outline" size={Platform.OS === 'android' ? 22 : 24} color="#FFFFFF" />
                                    {(unreadCount > 0 || (!!nextFestival && (nextFestival.days_until === 0 || nextFestival.days_until === 1))) && <View style={styles.notificationDot} />}
                                </View>
                            </Pressable>
                        </View>
                    </View>


                    {searchActive ? (
                        <View style={styles.searchPanel}>
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={18} color="#6F5C70" />
                                <TextInput
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    placeholder={t('recentSearchPlaceholder')}
                                    placeholderTextColor="#8E7D90"
                                    autoFocus
                                    accessibilityLabel="Search users or hashtags"
                                    accessibilityHint="Type a username or hashtag starting with #"
                                />
                            </View>
                            {searchTerm.trim().length > 0 ? (
                                <View style={styles.searchResultsSection}>
                                    {searchTerm.trim().startsWith('#') ? (
                                        loadingHashtags ? (
                                            <Text style={styles.searchStatusText}>{t('loadingHashtags')}</Text>
                                        ) : hashtagResults.length > 0 ? (
                                            <TouchableOpacity
                                                style={styles.userResultItem}
                                                activeOpacity={0.8}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Hashtag ${searchTerm.trim()}`}
                                                onPress={() => {
                                                    const hashtag = searchTerm.trim().replace(/^#+/, '');
                                                    router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
                                                }}
                                            >
                                                <View style={styles.hashtagIcon}>
                                                    <Ionicons name="pricetag" size={22} color="#8C36DB" />
                                                </View>
                                                <View style={styles.userResultText}>
                                                    <Text style={styles.userResultName}>#{searchTerm.trim().replace('#', '')}</Text>
                                                    <Text style={styles.userResultMeta}>{hashtagResults.length} posts</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.searchStatusText}>{t('noPostsHashtag')}</Text>
                                        )
                                    ) : loadingUsers ? (
                                        <Text style={styles.searchStatusText}>{t('loadingUsers')}</Text>
                                    ) : searchResults.length > 0 ? (
                                        <>
                                            {searchResults.map((item) => {
                                                const isFollowing = followingSet.has(item.id);
                                                return (
                                                    <View key={item.id} style={styles.userResultItem}>
                                                        <TouchableOpacity
                                                            style={styles.userResultContent}
                                                            activeOpacity={0.8}
                                                            accessibilityRole="button"
                                                            accessibilityLabel={`View profile of ${item.name || 'User'}`}
                                                            onPress={() => {
                                                                saveRecentSearch(item);
                                                                router.push(`/profile/${item.id}`);
                                                            }}
                                                        >
                                                            <Avatar name={item.name || 'User'} photo={item.photo} size={42} />
                                                            <View style={styles.userResultText}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Text style={styles.userResultName}>{item.name || 'Unknown'}</Text>
                                                                    {item.is_verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
                                                                </View>
                                                                <Text style={styles.userResultMeta}>{item.sl_id || item.phone || ''}</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.followButton, isFollowing && styles.followingButton]}
                                                            activeOpacity={0.8}
                                                            accessibilityRole="button"
                                                            accessibilityLabel={isFollowing ? `Unfollow ${item.name || 'user'}` : `Follow ${item.name || 'user'}`}
                                                            onPress={() => handleFollowUser(item.id)}
                                                        >
                                                            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                                                {isFollowing ? t('following') : t('follow')}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <Text style={styles.searchStatusText}>{t('noUsersFound')}</Text>
                                    )}
                                </View>
                            ) : recentSearches.length > 0 ? (
                                <View style={styles.recentSearchSection}>
                                    <View style={styles.recentSearchHeader}>
                                        <Text style={styles.recentSearchesTitle}>{t('recentSearchTitle')}</Text>
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Clear recent search history"
                                            onPress={async () => {
                                                if (user?.id) {
                                                    setRecentSearches([]);
                                                    await AsyncStorage.removeItem(`recent_searches_${user.id}`);
                                                }
                                            }}
                                        >
                                            <Text style={styles.clearHistoryText}>{t('clearHistory')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.recentSearchList}
                                    >
                                        {recentSearches.map((item) => (
                                            <TouchableOpacity
                                                key={`recent-${item.id}`}
                                                style={styles.recentSearchItem}
                                                activeOpacity={0.7}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Recent search ${item.name || 'User'}`}
                                                onPress={() => router.push(`/profile/${item.id}`)}
                                            >
                                                <Avatar name={item.name || 'User'} photo={item.photo} size={60} />
                                                <Text style={styles.recentSearchName} numberOfLines={1}>
                                                    {item.name?.split(' ')[0] || 'User'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <View
                            style={[styles.topFeatureRow, { flexDirection: 'column', alignItems: 'center', marginTop: 12, marginBottom: 8 }]}
                        >
                            <ScrollView
                                ref={topFeaturesScrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={featureSnapInterval}
                                decelerationRate="fast"
                                contentContainerStyle={{ gap: 10, paddingHorizontal: PAGE_PADDING }}
                                style={{ width: '100%' }}
                                onTouchStart={() => {
                                    if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = true;
                                }}
                                onTouchEnd={() => {
                                    if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = false;
                                }}
                                onTouchCancel={() => {
                                    if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = false;
                                }}
                                onScrollBeginDrag={() => {
                                    if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = true;
                                }}
                                onScrollEndDrag={() => {
                                    setTimeout(() => {
                                        if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = false;
                                    }, 1200);
                                }}
                                onMomentumScrollEnd={() => {
                                    setTimeout(() => {
                                        if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = false;
                                    }, 1200);
                                }}
                                onScroll={(e) => {
                                    const x = e.nativeEvent.contentOffset.x;
                                    const idx = Math.round(x / featureSnapInterval);
                                    const clampedIdx = Math.max(0, Math.min(idx, featuredItems.length - 1));
                                    setActiveFeatureIndex(clampedIdx);
                                    topFeaturesAutoScrollIndex.current = clampedIdx;
                                }}
                                scrollEventThrottle={16}
                            >
                                {featuredItems.map((item, idx) => {
                                    let cardBg = '#FFFFFF';
                                    let iconBg = '#FF8A3D';
                                    if (item.label === 'Panchang') {
                                        cardBg = '#FFF9F0';
                                        iconBg = '#FF9800';
                                    } else if (item.label === 'My Krishn') {
                                        cardBg = '#FFF8EB';
                                        iconBg = '#FF6B00';
                                    } else if (item.label === 'SOS') {
                                        cardBg = '#FFF5F5';
                                        iconBg = '#FF3B30';
                                    }

                                    let displayLabel = item.label;
                                    let displaySubtitle = item.subtitle;

                                    if (t('language') === 'hi') {
                                        if (item.label === 'My Krishn') {
                                            displayLabel = 'मेरे कृष्ण';
                                            displaySubtitle = 'एआई धर्म मार्गदर्शन';
                                        } else if (item.label === 'SOS') {
                                            displayLabel = 'एसओएस (SOS)';
                                            displaySubtitle = 'आपके आसपास के सनातनी लोग';
                                        } else if (item.label === 'Panchang') {
                                            displayLabel = 'पंचांग';
                                            displaySubtitle = 'Plan with\nVedic wisdom';
                                        } else if (item.label === 'Kundli') {
                                            displayLabel = 'कुंडली';
                                            displaySubtitle = 'Your birth chart insights';
                                        } else if (item.label === 'Brahmand Passport') {
                                            displayLabel = 'ब्रह्मांड पासपोर्ट';
                                            displaySubtitle = 'आपकी मंदिर यात्रा का रिकॉर्ड';
                                        } else if (item.label === 'Festival') {
                                            displayLabel = 'त्योहार के दिन';
                                            displaySubtitle = 'अगला त्योहार और अनुष्ठान';
                                        } else if (item.label === 'Brahmand Library') {
                                            displayLabel = 'ब्रह्मांड पुस्तकालय';
                                            displaySubtitle = 'ज्ञान की खोज करें';
                                        }
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.featureCard,
                                                Platform.OS === 'android' && { width: featureCardWidth, height: featureCardHeight, paddingHorizontal: 12 }
                                            ]}
                                            activeOpacity={0.9}
                                            accessibilityRole="button"
                                            accessibilityLabel={displayLabel}
                                            accessibilityHint={displaySubtitle ? displaySubtitle.replace('\n', ' ') : undefined}
                                            onPressIn={() => {
                                                if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = true;
                                            }}
                                            onPressOut={() => {
                                                if (isHoldingTopFeaturesRef) isHoldingTopFeaturesRef.current = false;
                                            }}
                                            onPress={() => {
                                                if (item.label === 'Panchang') router.push('/panchang');
                                                else if (item.label === 'My Krishn') router.push('/my-krishna');
                                                else if (item.label === 'SOS') router.push('/sos');
                                                else if (item.label === 'Kundli') router.push('/astrology' as any);
                                                else if (item.label === 'Brahmand Passport') router.push('/passport');
                                                else if (item.label === 'Festival') router.push('/festivals');
                                                else if (item.label === 'Brahmand Library') router.push('/library');
                                            }}
                                        >
                                            {item.label === 'SOS' ? (
                                                <View style={Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255, 0, 0, 0.10)', justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 0, 0, 0.10)', justifyContent: 'center', alignItems: 'center' }}>
                                                    <View style={Platform.OS === 'android' ? { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 0, 0, 0.50)', justifyContent: 'center', alignItems: 'center' } : { width: 42.2, height: 42.2, borderRadius: 21.1, backgroundColor: 'rgba(255, 0, 0, 0.50)', justifyContent: 'center', alignItems: 'center' }}>
                                                        <View style={Platform.OS === 'android' ? { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' } : { width: 34.5, height: 34.5, borderRadius: 17.25, backgroundColor: 'rgba(255, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Text style={Platform.OS === 'android' ? { color: '#FFF', textAlign: 'center', fontFamily: 'System', fontSize: 10, fontWeight: '600' } : { color: '#FFF', textAlign: 'center', fontFamily: 'System', fontSize: 11, fontWeight: '600' }}>SOS</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            ) : item.label === 'My Krishn' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <ExpoImage source={require('../../../assets/images/tab-bar/my_krishna.webp')} style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 42, height: 42 }} contentFit="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Panchang' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/panchang_icon_3.webp' }} style={Platform.OS === 'android' ? { width: 24, height: 24 } : { width: 26, height: 26 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Kundli' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_kundli_icon.webp' }} style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 44, height: 44 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Brahmand Passport' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 58, overflow: 'visible' } : { overflow: 'visible', width: 52, height: 67 }]}>
                                                    <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_passport_icon.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 58, flexShrink: 0, aspectRatio: 41 / 52 } : { width: 53, height: 67, flexShrink: 0, aspectRatio: 41 / 52 }} resizeMode="contain" />
                                                </View>
                                            ) : item.label === 'Festival' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_festival_icon_2.webp' }} style={Platform.OS === 'android' ? { width: 24, height: 24 } : { width: 26, height: 26 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Brahmand Library' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/library_icon_3.webp' }} style={Platform.OS === 'android' ? { width: 22, height: 22 } : { width: 24, height: 24 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, backgroundColor: iconBg } : { backgroundColor: iconBg }]}>
                                                    <Ionicons name="calendar" size={Platform.OS === 'android' ? 22 : 24} color="#FFF" />
                                                </View>
                                            )}
                                            <View style={[styles.featureTextContainer, Platform.OS === 'android' && { marginLeft: 8 }]}>
                                                <Text style={[styles.featureTitle, Platform.OS === 'android' && { fontSize: 13, lineHeight: 15 }]} numberOfLines={undefined}>{displayLabel}</Text>
                                                {displaySubtitle ? (
                                                    <Text style={[styles.featureSubtitle, Platform.OS === 'android' && { fontSize: 9.5, lineHeight: 11.5 }]} numberOfLines={undefined}>{displaySubtitle}</Text>
                                                ) : null}
                                            </View>
                                            <Ionicons name="chevron-forward" size={10} color="#999" style={{ marginLeft: 'auto' }} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 4 }}>
                                {featuredItems.map((_, idx) => {
                                    const dist = Math.abs(idx - activeFeatureIndex);
                                    let size = 8;
                                    let opacity = 1;
                                    if (dist === 0) {
                                        size = 8;
                                        opacity = 1;
                                    } else if (dist === 1) {
                                        size = 5.5;
                                        opacity = 0.65;
                                    } else if (dist === 2) {
                                        size = 4;
                                        opacity = 0.45;
                                    } else {
                                        size = 3;
                                        opacity = 0.3;
                                    }

                                    return (
                                        <View
                                            key={idx}
                                            style={{
                                                width: size,
                                                height: size,
                                                borderRadius: size / 2,
                                                backgroundColor: dist === 0 ? '#FFF' : `rgba(255, 255, 255, ${opacity})`,
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    )}



                    <View
                        style={{ position: 'relative' }}
                    >
                        <ScrollView
                            ref={bannerScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            decelerationRate="fast"
                            snapToInterval={screenWidth - 40 + 12}
                            snapToAlignment="start"
                            disableIntervalMomentum={true}
                            directionalLockEnabled={true}
                            removeClippedSubviews={false}
                            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                            onTouchStart={() => {
                                if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                            }}
                            onTouchEnd={() => {
                                if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                            }}
                            onTouchCancel={() => {
                                if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                            }}
                            onScrollBeginDrag={() => {
                                if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                            }}
                            onScrollEndDrag={() => {
                                setTimeout(() => {
                                    if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                }, 1500);
                            }}
                            onMomentumScrollEnd={(e) => {
                                setTimeout(() => {
                                    if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                }, 1500);
                                const x = e.nativeEvent.contentOffset.x;
                                const itemWidth = screenWidth - 40 + 12;
                                const idx = Math.min(2, Math.max(0, Math.round(x / (itemWidth || 1))));
                                if (idx !== activeBannerIndex) {
                                    setActiveBannerIndex(idx);
                                }
                                if (bannerAutoScrollIndex) {
                                    bannerAutoScrollIndex.current = idx;
                                }
                            }}
                            scrollEventThrottle={32}
                        >
                            {/* Banner 1: Sharad Purnima Festival Banner */}
                            <Pressable
                                key="sharad_purnima_banner"
                                onPress={() => {
                                    try {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    } catch (_e) { }
                                    router.push('/festivals');
                                }}
                                onPressIn={() => { if (isHoldingBannerRef) isHoldingBannerRef.current = true; }}
                                onPressOut={() => { if (isHoldingBannerRef) isHoldingBannerRef.current = false; }}
                                style={{
                                    width: screenWidth - 40,
                                    height: Platform.OS === 'ios' ? 185 : 160,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    alignSelf: 'center',
                                    marginBottom: 5,
                                    backgroundColor: '#050D1A',
                                }}
                            >
                                <Image
                                    source={sharadPurnimaBannerImage}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    resizeMode="cover"
                                />

                                {/* Subtle bottom gradient overlay for explore button */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: 52,
                                        flexDirection: 'row',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        paddingHorizontal: 12,
                                        paddingBottom: 6,
                                        zIndex: 5,
                                    }}
                                    pointerEvents="box-none"
                                >
                                    <View
                                        style={{
                                            borderRadius: 16,
                                            overflow: 'hidden',
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.35,
                                            shadowRadius: 3,
                                            elevation: 3,
                                        }}
                                    >
                                        <Pressable
                                            android_ripple={{
                                                color: 'rgba(255, 255, 255, 0.32)',
                                                borderless: false,
                                            }}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                try {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                } catch (_e) { }
                                                router.push('/festivals');
                                            }}
                                            onPressIn={() => {
                                                if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                                            }}
                                            onPressOut={() => {
                                                if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                            }}
                                            style={({ pressed }) => [
                                                {
                                                    backgroundColor: 'rgba(255, 81, 0, 0.92)',
                                                    height: 30,
                                                    paddingHorizontal: 14,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                    borderRadius: 15,
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255, 255, 255, 0.45)',
                                                    opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1,
                                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                                },
                                            ]}
                                        >
                                            <Text style={{
                                                color: '#FFF',
                                                fontSize: 12,
                                                fontWeight: '800',
                                                letterSpacing: 0.3,
                                            }}>
                                                {t('language') === 'hi' ? 'शरद पूर्णिमा दर्शन' : 'Explore Festival'}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={13} color="#FFF" />
                                        </Pressable>
                                    </View>
                                </LinearGradient>
                            </Pressable>

                            {/* Helper components for Banner 2 & Banner 3 */}
                            {(() => {
                                const renderHanumanBanner = (key: string) => (
                                    <StaticBannerCard
                                        key={key}
                                        width={screenWidth - 40}
                                        source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/hanuman_banner_new.webp' }}
                                        onPress={() => handleLiveJaapNavigation('hanuman', 'Hanuman Chalisa')}
                                        onPressIn={() => { if (isHoldingBannerRef) isHoldingBannerRef.current = true; }}
                                        onPressOut={() => { if (isHoldingBannerRef) isHoldingBannerRef.current = false; }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                            {/* Top Left Content */}
                                            <View style={{ flex: 1, paddingTop: 0, paddingLeft: 0, marginRight: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                                    <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                                    <Text style={[
                                                        styles.featuredLiveTitle,
                                                        {
                                                            color: '#FFF',
                                                            fontFamily: 'System',
                                                            fontSize: 15,
                                                            fontStyle: 'normal',
                                                            fontWeight: '700',
                                                            letterSpacing: 1,
                                                            textShadowColor: 'rgba(0,0,0,0.9)',
                                                            textShadowOffset: { width: 0, height: 1 },
                                                            textShadowRadius: 6,
                                                        }
                                                    ]}>Hanuman Chalisa</Text>
                                                </View>

                                                <Text style={[styles.featuredDevotees, {
                                                    color: '#FFF',
                                                    fontWeight: '600',
                                                    opacity: 0.9,
                                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 4,
                                                    marginLeft: 14,
                                                    marginTop: 0,
                                                    marginBottom: 2,
                                                    fontSize: 13
                                                }]}>
                                                    {hanumanStatus.isActive
                                                        ? `${hanumanChantCount.toLocaleString()} ${t('devoteesChanting') || 'devotees chanting together'}`
                                                        : (t('language') === 'hi'
                                                            // 🧡 Engagement: Reframed transactional completion "जाप पूरा" to devotional offering "जाप समर्पित"
                                                            // Lever: Devotional Reframing + Satsang Proof
                                                            // UI: Text-only change, zero new components.
                                                            ? '2300+ भक्त पहले ही जाप समर्पित कर चुके हैं'
                                                            : '2300+ devotees already offered jaap')}
                                                </Text>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                                    <Ionicons name="time-outline" size={13} color="#FFF" />
                                                    <Text style={[styles.featuredTime, {
                                                        marginTop: 0,
                                                        marginLeft: 4,
                                                        color: '#FFF',
                                                        fontWeight: '600',
                                                        fontSize: 12
                                                    }]}>
                                                        {hanumanStatus.isActive
                                                            ? (t('language') === 'hi'
                                                                // 🧡 Engagement: Reframed transactional counter "जाप पूर्ण" to devotional offering "चालीसा समर्पित" + proximity "बस X और"
                                                                // Lever: Reframing + Proximity to Completion
                                                                // Why: "समर्पित" evokes spiritual devotion over task completion; showing remaining count triggers Zeigarnik effect.
                                                                // UI: Text-only change, zero layout/visual additions.
                                                                ? `${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} चालीसा समर्पित${(hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession) > 0 ? ` — बस ${hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession} और` : ''}`
                                                                : `${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} jaap offered${(hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession) > 0 ? ` — just ${hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession} more` : ''}`)
                                                            : (hanumanStatus.nextSessionStart
                                                                ? (t('language') === 'hi'
                                                                    // 🧡 Engagement: Reframed transactional time announcement ("जाप 6:00 बजे शुरू होगा") to devotional commitment framing ("अगला जाप 6:00 बजे — संकल्प लें 🚩")
                                                                    // Lever: Reframing + Sanskara/Sankalpa (Culture over Utility)
                                                                    // Why: "संकल्प" (Sacred Vow) invites user to form a daily spiritual intention rather than treating the app like a passive broadcast schedule.
                                                                    // UI: Text-only change, zero visual components or layout added.
                                                                    ? `अगला जाप ${formatTime(hanumanStatus.nextSessionStart)} बजे — संकल्प लें 🚩`
                                                                    : `Next jaap at ${formatTime(hanumanStatus.nextSessionStart)} — Take Sankalpa 🚩`)
                                                                : (t('language') === 'hi' ? 'जल्द ही लाइव — संकल्प लें 🚩' : 'Going live soon — Take Sankalpa 🚩'))}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Top Right LIVE Badge */}
                                            <View style={[styles.liveBadge, {
                                                alignSelf: 'flex-start',
                                                backgroundColor: hanumanStatus.isActive ? '#FF0000' : '#FF7A00',
                                                paddingHorizontal: hanumanStatus.isActive ? 8 : 10,
                                            }]}>
                                                {hanumanStatus.isActive && <View style={styles.liveDot} />}
                                                <Text style={[styles.liveBadgeText, { marginLeft: hanumanStatus.isActive ? 4 : 0 }]}>
                                                    {hanumanStatus.isActive
                                                        ? 'LIVE'
                                                        : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live')}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Bottom Button Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 0 }}>
                                            <Pressable
                                                style={({ pressed }) => [
                                                    styles.joinJaapButton,
                                                    {
                                                        backgroundColor: '#FF5100',
                                                        display: 'flex',
                                                        width: 138,
                                                        height: 36,
                                                        paddingHorizontal: 12,
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        borderRadius: 20,
                                                        borderWidth: 1,
                                                        borderColor: 'rgba(255, 255, 255, 0.4)',
                                                        shadowColor: '#FF5100',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: 0.5,
                                                        shadowRadius: 5,
                                                        elevation: 4,
                                                        transform: [{ scale: pressed ? 0.95 : 1 }],
                                                    }
                                                ]}
                                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
                                                onPressIn={() => {
                                                    if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                                                }}
                                                onPressOut={() => {
                                                    if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                                }}
                                                onPress={() => {
                                                    try {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    } catch (_e) { }
                                                    handleLiveJaapNavigation('hanuman', 'Hanuman Chalisa');
                                                }}
                                            >
                                                <Ionicons name="play" size={12} color="#FFF" />
                                                <Text style={styles.joinJaapText}>{t('joinLiveJaap')}</Text>
                                            </Pressable>

                                            <Pressable
                                                style={({ pressed }) => ({
                                                    backgroundColor: reminders['hanuman'] ? '#FFF' : 'rgba(255, 255, 255, 0.2)',
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: reminders['hanuman'] ? '#FF5100' : 'rgba(255, 255, 255, 0.4)',
                                                    transform: [{ scale: pressed ? 0.92 : 1 }],
                                                })}
                                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
                                                onPressIn={() => {
                                                    if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                                                }}
                                                onPressOut={() => {
                                                    if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                                }}
                                                onPress={() => {
                                                    try {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    } catch (_e) { }
                                                    handleSetReminder('hanuman', 'Hanuman Chalisa');
                                                }}
                                            >
                                                <Ionicons
                                                    name={reminders['hanuman'] ? "notifications" : "notifications-outline"}
                                                    size={18}
                                                    color={reminders['hanuman'] ? '#FF5100' : '#FFF'}
                                                />
                                            </Pressable>
                                        </View>
                                    </StaticBannerCard>
                                );

                                return renderHanumanBanner('hanuman_banner');
                            })()}

                            <StaticBannerCard
                                width={screenWidth - 40}
                                source={shivaImage}
                                onPress={() => handleLiveJaapNavigation('shiva', 'Om Namah Shivay')}
                                onPressIn={() => { if (isHoldingBannerRef) isHoldingBannerRef.current = true; }}
                                onPressOut={() => { if (isHoldingBannerRef) isHoldingBannerRef.current = false; }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                    {/* Top Left Content */}
                                    <View style={{ flex: 1, paddingTop: 0, paddingLeft: 0, marginRight: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                            <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                            <Text style={[
                                                styles.featuredLiveTitle,
                                                {
                                                    color: '#FFF',
                                                    fontFamily: 'System',
                                                    fontSize: 15,
                                                    fontStyle: 'normal',
                                                    fontWeight: '700',
                                                    letterSpacing: 1,
                                                    textShadowColor: 'rgba(0,0,0,0.9)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 6,
                                                }
                                            ]}>Mahamrityunjaya Mantra</Text>
                                        </View>

                                        <Text style={[styles.featuredDevotees, {
                                            color: '#FFF',
                                            fontWeight: '600',
                                            opacity: 0.9,
                                            textShadowColor: 'rgba(0,0,0,0.8)',
                                            textShadowOffset: { width: 0, height: 1 },
                                            textShadowRadius: 4,
                                            marginLeft: 14,
                                            marginTop: 0,
                                            marginBottom: 2,
                                            fontSize: 13
                                        }]}>
                                            {shivaStatus.isActive
                                                ? `${shivaChantCount.toLocaleString()} ${t('devoteesChanting') || 'devotees chanting together'}`
                                                : (t('language') === 'hi'
                                                    // 🧡 Engagement: Reframed transactional completion "जाप पूरा कर चुके हैं" to devotional offering "जाप समर्पित कर चुके हैं"
                                                    // Lever: Reframing + Devotional Framing + Satsang Social Proof
                                                    // Why: "समर्पित" evokes sacred offering and devotional sentiment (bhavna) rather than a task completed.
                                                    // UI: Text-only change, zero new components.
                                                    ? '1800+ भक्त पहले ही जाप समर्पित कर चुके हैं'
                                                    : '1800+ devotees already offered jaap')}
                                        </Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                            <Ionicons name="time-outline" size={13} color="#FFF" />
                                            <Text style={[styles.featuredTime, {
                                                marginTop: 0,
                                                marginLeft: 4,
                                                color: '#FFF',
                                                fontWeight: '600',
                                                fontSize: 12
                                            }]}>
                                                {shivaStatus.isActive
                                                    ? `${t('liveUntil')} ${shivaStatus.sessionEnd ? formatTime(shivaStatus.sessionEnd) : '5:00 PM'}`
                                                    : (shivaStatus.nextSessionStart
                                                        ? (t('language') === 'hi'
                                                            // 🧡 Engagement: Reframed transactional time announcement to spiritual commitment framing
                                                            // Lever: Culture/Habit (Sanskara & Sankalpa) + Reframing
                                                            // Why: Indian users respond to "संकल्प" (devotional pledge) rather than generic schedule info.
                                                            // UI: Text-only change, zero visual additions.
                                                            ? `अगला जाप ${formatTime(shivaStatus.nextSessionStart)} बजे — संकल्प लें 🚩`
                                                            : `Next jaap at ${formatTime(shivaStatus.nextSessionStart)} — Take Sankalpa 🚩`)
                                                        : (t('language') === 'hi' ? 'जल्द ही लाइव — संकल्प लें 🚩' : 'Going live soon — Take Sankalpa 🚩'))}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Top Right LIVE Badge */}
                                    <View style={[styles.liveBadge, {
                                        alignSelf: 'flex-start',
                                        backgroundColor: shivaStatus.isActive ? '#FF0000' : '#FF7A00',
                                        paddingHorizontal: shivaStatus.isActive ? 8 : 10,
                                    }]}>
                                        {shivaStatus.isActive && <View style={styles.liveDot} />}
                                        <Text style={[styles.liveBadgeText, { marginLeft: shivaStatus.isActive ? 4 : 0 }]}>
                                            {shivaStatus.isActive
                                                ? 'LIVE'
                                                : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Bottom Button Row */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 0 }}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.joinJaapButton,
                                            {
                                                backgroundColor: '#FF5100',
                                                display: 'flex',
                                                width: 138,
                                                height: 36,
                                                paddingHorizontal: 12,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: 6,
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                                shadowColor: '#FF5100',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.5,
                                                shadowRadius: 5,
                                                elevation: 4,
                                                transform: [{ scale: pressed ? 0.95 : 1 }],
                                            }
                                        ]}
                                        android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
                                        onPressIn={() => {
                                            if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                                        }}
                                        onPressOut={() => {
                                            if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                        }}
                                        onPress={() => {
                                            try {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            } catch (_e) { }
                                            handleLiveJaapNavigation('shiva', 'Om Namah Shivay');
                                        }}
                                    >
                                        <Ionicons name="play" size={12} color="#FFF" />
                                        <Text style={styles.joinJaapText}>{t('joinLiveJaap')}</Text>
                                    </Pressable>

                                    <Pressable
                                        style={({ pressed }) => ({
                                            backgroundColor: reminders['shiva'] ? '#FFF' : 'rgba(255, 255, 255, 0.2)',
                                            width: 36,
                                            height: 36,
                                            borderRadius: 18,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: reminders['shiva'] ? '#FF5100' : 'rgba(255, 255, 255, 0.4)',
                                            transform: [{ scale: pressed ? 0.92 : 1 }],
                                        })}
                                        android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
                                        onPressIn={() => {
                                            if (isHoldingBannerRef) isHoldingBannerRef.current = true;
                                        }}
                                        onPressOut={() => {
                                            if (isHoldingBannerRef) isHoldingBannerRef.current = false;
                                        }}
                                        onPress={() => {
                                            try {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            } catch (_e) { }
                                            handleSetReminder('shiva', 'Mahamrityunjaya Mantra');
                                        }}
                                    >
                                        <Ionicons
                                            name={reminders['shiva'] ? "notifications" : "notifications-outline"}
                                            size={18}
                                            color={reminders['shiva'] ? '#FF5100' : '#FFF'}
                                        />
                                    </Pressable>
                                </View>
                            </StaticBannerCard>

                        </ScrollView>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 6 }}>
                            {[0, 1, 2].map((idx) => (
                                <View
                                    key={idx}
                                    style={{
                                        width: activeBannerIndex === idx ? 16 : 6,
                                        height: 5,
                                        borderRadius: 3,
                                        backgroundColor: activeBannerIndex === idx ? '#FFD700' : 'rgba(255, 255, 255, 0.35)',
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                </View>

                <ActionCardsRow t={t} safeCommunityRequests={safeCommunityRequests} />

                <View style={styles.twoButtonsRow}>
                    {/* Mumbai Community Card */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.communityCardMini,
                            Platform.OS === 'android' && { overflow: 'hidden' },
                            pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                        ]}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.35)', borderless: false }}
                        onPress={() => {
                            router.push({
                                pathname: '/community/[id]',
                                params: { id: cityId, subgroup: 'city', name: cityName }
                            });
                        }}
                    >
                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/mumbai_pin.webp' }} style={styles.communityCardIcon} />
                        <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                            <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('cityCommunity').toUpperCase()}</Text>
                            <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                                {cityName}
                            </Text>
                            <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>{cityMembers} {t('members')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                    </Pressable>

                    {/* Local Community Card */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.communityCardMini,
                            Platform.OS === 'android' && { overflow: 'hidden' },
                            pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                        ]}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.35)', borderless: false }}
                        onPress={() => {
                            router.push({
                                pathname: '/community/[id]',
                                params: { id: localId, subgroup: localSubgroup, name: realGroupName }
                            });
                        }}
                    >
                        <View style={styles.communityCardIconBox}>
                            <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/food_sharing.webp' }} style={styles.communityCardIconRound} />
                        </View>
                        <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                            <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('foodSharing').toUpperCase()}</Text>
                            <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                                {realGroupName}
                            </Text>
                            <View style={styles.miniCardBottomRow}>
                                <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>{localMembers} {t('members')}</Text>
                                <View style={styles.sevaBadgeMini}>
                                    <Text style={styles.sevaBadgeTextMini}>Seva</Text>
                                </View>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                    </Pressable>
                </View>
            </View>

                <View style={{ zIndex: 10, elevation: 10, backgroundColor: 'transparent' }}>
                    <HomeFeedTabs
                        activeTab={activeTab}
                        onTabChange={(tab: string) => {
                            requestAnimationFrame(() => {
                                setActiveTab(tab);
                            });
                        }}
                    />
                </View>
            </View>
            );
});
