import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
    Vibration,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NaamJaap {
    id: string;
    name: string;
    hindi: string;
    mantra: string;
    deity: string;
    color: string;
    bgColor: string;
    icon: string;
    iconBg: string;
}

const NAAM_JAAP_LIST: NaamJaap[] = [
    {
        id: 'shiv',
        name: 'Shiv Jaap',
        mantra: 'Om Namah Shivaya',
        hindi: 'ॐ नमः शिवाय',
        deity: 'Lord Shiva',
        color: '#FF5722',
        bgColor: '#FFF3E0',
        icon: 'flame',
        iconBg: '#FFE0B2'
    },
    {
        id: 'ram',
        name: 'Ram Jaap',
        mantra: 'Shri Ram Jai Ram Jai Jai Ram',
        hindi: 'श्री राम जय राम जय जय राम',
        deity: 'Lord Ram',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        icon: 'star',
        iconBg: '#C8E6C9'
    },
    {
        id: 'krishna',
        name: 'Krishna Jaap',
        mantra: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare',
        hindi: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे',
        deity: 'Lord Krishna',
        color: '#2196F3',
        bgColor: '#E3F2FD',
        icon: 'planet',
        iconBg: '#BBDEFB'
    },
    {
        id: 'sarva-mangal',
        name: 'Sarva Mangal Jaap',
        mantra: 'Sarva Mangal Mangalye Shive Sarvartha Sadhike',
        hindi: 'सर्व मंगल मांगल्ये शिवे सर्वार्थ साधिके',
        deity: 'Goddess Parvati',
        color: '#9C27B0',
        bgColor: '#F3E5F5',
        icon: 'sparkles',
        iconBg: '#E1BEE7'
    },
    {
        id: 'gayatri',
        name: 'Gayatri Jaap',
        mantra: 'Om Bhur Bhuvah Swaha',
        hindi: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
        deity: 'Gayatri Devi',
        color: '#FF9800',
        bgColor: '#FFF8E1',
        icon: 'sunny',
        iconBg: '#FFECB3'
    },
    {
        id: 'hanuman',
        name: 'Hanuman Jaap',
        mantra: 'Om Hanumate Namah',
        hindi: 'ॐ हनुमते नमः',
        deity: 'Lord Hanuman',
        color: '#F44336',
        bgColor: '#FFEBEE',
        icon: 'body',
        iconBg: '#FFCDD2'
    },
    {
        id: 'ganesh',
        name: 'Ganesh Jaap',
        mantra: 'Om Gam Ganapataye Namah',
        hindi: 'ॐ गं गणपतये नमः',
        deity: 'Lord Ganesha',
        color: '#795548',
        bgColor: '#EFEBE9',
        icon: 'diamond',
        iconBg: '#D7CCC8'
    },
    {
        id: 'durga',
        name: 'Durga Jaap',
        mantra: 'Om Dum Durgayei Namah',
        hindi: 'ॐ दुं दुर्गायै नमः',
        deity: 'Goddess Durga',
        color: '#E91E63',
        bgColor: '#FCE4EC',
        icon: 'shield-checkmark',
        iconBg: '#F8BBD0'
    }
];

const TIME_SLOTS = [
    { id: '10', label: '10 Minutes', seconds: 600, minutes: 10 },
    { id: '20', label: '20 Minutes', seconds: 1200, minutes: 20 },
    { id: '30', label: '30 Minutes', seconds: 1800, minutes: 30 },
];

const MUSIC_OPTIONS = [
    { id: 'waterfall', name: 'Peaceful Waterfall', icon: 'water', file: require('../assets/audio/audio ekant/eisenkern1982-waterfall-176958.mp3') },
    { id: 'yoga-zen', name: 'Yoga Zen Ambience', icon: 'leaf', file: require('../assets/audio/audio ekant/leberch-yoga-509070.mp3') },
    { id: 'yoga-meditation', name: 'Deep Meditation', icon: 'musical-notes', file: require('../assets/audio/audio ekant/leberch-yoga-509709.mp3') },
    { id: 'nature', name: 'Birds & Waterfall', icon: 'sunny', file: require('../assets/audio/audio ekant/rmultimediaeu-birds-and-waterfall-250309.mp3') },
];

const EkantJaapPage = () => {
    const router = useRouter();
    const [selectedNaam, setSelectedNaam] = useState<NaamJaap | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<typeof TIME_SLOTS[0] | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalJaapCount, setTotalJaapCount] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showMusicDialog, setShowMusicDialog] = useState(false);
    const [lastMinute, setLastMinute] = useState<number | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [chosenMusic, setChosenMusic] = useState<typeof MUSIC_OPTIONS[0] | null>(null);
    const player = useAudioPlayer(chosenMusic?.file);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Animations for the new UI
    const swirlRotation = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;
    const blobAnim1 = useRef(new Animated.Value(0)).current;
    const blobAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRunning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowPulse, { toValue: 1, duration: 3000, useNativeDriver: true }),
                    Animated.timing(glowPulse, { toValue: 0.7, duration: 3000, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [isRunning]);

    const bgOpacity = glowPulse;

    const rotate = swirlRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const handleSelectNaam = (naam: NaamJaap) => {
        setSelectedNaam(naam);
        Vibration.vibrate(50);
    };

    const handleSelectSlot = (slot: typeof TIME_SLOTS[0]) => {
        setSelectedSlot(slot);
        setTimeLeft(slot.seconds);
        setLastMinute(slot.minutes);
        setShowMusicDialog(true);
        Vibration.vibrate(50);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setIsComplete(true);
                        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
                        return 0;
                    }
                    const nextValue = prev - 1;
                    const newMinutes = Math.ceil(nextValue / 60);
                    const oldMinutes = Math.ceil(prev / 60);
                    if (newMinutes !== oldMinutes && newMinutes > 0) {
                        setLastMinute(newMinutes);
                    }
                    return nextValue;
                });
                setTotalJaapCount((c) => c + 1);
            }, 1000);
        } else {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning]);

    const beginJaap = async (music: typeof MUSIC_OPTIONS[0]) => {
        setShowMusicDialog(false);
        setChosenMusic(music);
        if (!selectedNaam || !selectedSlot) return;

        setIsRunning(true);
        setIsAudioEnabled(true);
        setIsComplete(false);
        Vibration.vibrate(200);
    };

    const handleStop = () => {
        setShowConfirmDialog(true);
    };

    const cancelStop = () => {
        setShowConfirmDialog(false);
    };

    const confirmStop = () => {
        setShowConfirmDialog(false);
        if (player) {
            player.pause();
        }
        setIsRunning(false);
        setIsComplete(false);
        setIsAudioEnabled(false);
        setLastMinute(null);
        setChosenMusic(null);
        setShowMusicDialog(false);
        setSelectedNaam(null);
        setSelectedSlot(null);
    };

    const handleGoBack = () => {
        if (isRunning) {
            handleStop();
        } else {
            if (player) {
                player.pause();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (selectedSlot) {
                setSelectedSlot(null);
                setTimeLeft(0);
            } else if (selectedNaam) {
                setSelectedNaam(null);
            } else {
                router.back();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (player) {
            player.loop = true;
            player.volume = 0.5;
            if (isRunning && isAudioEnabled) {
                player.play();
            } else {
                player.pause();
            }
        }
    }, [player, isRunning, isAudioEnabled, chosenMusic]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (player) {
                player.pause();
            }
        };
    }, [player]);

    const progress = selectedSlot ? ((selectedSlot.seconds - timeLeft) / selectedSlot.seconds) * 100 : 0;

    if (!selectedNaam) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#D4A017" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Ekant Jaap</Text>
                            <Text style={styles.headerSubtitle}>Peaceful Spiritual Practice</Text>
                        </View>
                        <Text style={styles.omSymbol}>🕉️</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Select Holy Name</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {NAAM_JAAP_LIST.map((naam) => (
                            <TouchableOpacity
                                key={naam.id}
                                style={[styles.naamCard, { borderLeftColor: naam.color }]}
                                onPress={() => handleSelectNaam(naam)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.naamIconContainer, { backgroundColor: naam.iconBg }]}>
                                    <Ionicons name={naam.icon as any} size={24} color={naam.color} />
                                </View>
                                <View style={styles.naamInfo}>
                                    <Text style={[styles.naamName, { color: naam.color }]}>{naam.name}</Text>
                                    <Text style={styles.naamHindi}>{naam.hindi}</Text>
                                    <Text style={styles.naamDeity}>{naam.deity}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={naam.color} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    if (!selectedSlot) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                            <Ionicons name="arrow-back" size={24} color="#D4A017" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.omSymbol}>🕉️</Text>
                            <Text style={[styles.headerTitle, { color: selectedNaam.color }]}>{selectedNaam.name}</Text>
                        </View>
                        <Ionicons name={selectedNaam.icon as any} size={32} color={selectedNaam.color} />
                    </View>

                    <Text style={styles.sectionTitle}>Choose Duration</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.naamBanner, { backgroundColor: selectedNaam.bgColor }]}>
                            <Text style={styles.bannerOm}>🙏</Text>
                            <Text style={[styles.bannerHindi, { color: selectedNaam.color }]}>{selectedNaam.hindi}</Text>
                            <Text style={styles.bannerDeity}>{selectedNaam.deity}</Text>
                        </View>

                        {TIME_SLOTS.map((slot) => (
                            <TouchableOpacity
                                key={slot.id}
                                style={[styles.slotCard, { borderColor: selectedNaam.color }]}
                                onPress={() => handleSelectSlot(slot)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.slotIconContainer, { backgroundColor: selectedNaam.bgColor }]}>
                                    <Ionicons name="time" size={28} color={selectedNaam.color} />
                                </View>
                                <View style={styles.slotInfo}>
                                    <Text style={[styles.slotDuration, { color: selectedNaam.color }]}>{slot.label}</Text>
                                    <Text style={styles.slotSub}>Complete focused session</Text>
                                </View>
                                <View style={[styles.slotBadge, { backgroundColor: selectedNaam.iconBg }]}>
                                    <Text style={[styles.slotBadgeText, { color: selectedNaam.color }]}>SELECT</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <Text style={styles.infoOm}>🪔</Text>
                                <Text style={styles.infoTitle}>How it works</Text>
                            </View>
                            <Text style={styles.infoText}>1. Choose a time slot (10, 20, or 30 minutes)</Text>
                            <Text style={styles.infoText}>2. Press Start to begin your Ekant Jaap</Text>
                            <Text style={styles.infoText}>3. Chant the naam as the timer runs</Text>
                            <Text style={styles.infoText}>4. Complete the full session for your practice</Text>
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.jaapSafeArea, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.jaapContainer}>
                <View style={styles.jaapTopBar}>
                    <TouchableOpacity style={styles.jaapTopChip} onPress={() => setIsAudioEnabled(!isAudioEnabled)}>
                        <Ionicons name="musical-notes" size={14} color="#555" />
                        <Text style={styles.jaapTopChipText} numberOfLines={1}>
                            {chosenMusic?.name || 'No Music'}
                        </Text>
                        <View style={styles.jaapTopChipIndicator} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.jaapTopChip} onPress={handleGoBack}>
                        <Ionicons name="stopwatch-outline" size={14} color="#555" />
                        <Text style={styles.jaapTopChipText}>End Focus</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.jaapCenter}>
                    <View style={styles.focusHeader}>
                        <Text style={styles.focusTitle}>{selectedNaam.name}</Text>
                        <Text style={styles.focusSubtitle}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    <View style={styles.focusCircleRoot}>
                        <View style={styles.focusCircleBackground} />
                        <View style={styles.focusCircleInner}>
                            <View style={[styles.focusDeityIconContainer, { backgroundColor: '#FFFFFF' }]}>
                                <Ionicons name={selectedNaam.icon as any} size={72} color="#F59E0B" />
                            </View>
                        </View>
                        {/* Gradient Progress Ring */}
                        <View style={styles.progressContainer}>
                            <LinearGradient
                                colors={['#F59E0B', '#EF4444']}
                                style={[styles.progressRingGradient, { 
                                    transform: [{ rotate: '-90deg' }],
                                    opacity: 0.8 
                                }]}
                            />
                            {/* Mask to create ring effect */}
                            <View style={styles.ringMask} />
                        </View>
                    </View>

                    <Text style={styles.focusTimerText}>{formatTime(timeLeft)}</Text>

                    <View style={styles.focusControlsRow}>
                        <TouchableOpacity 
                            style={styles.materialFab} 
                            onPress={() => {
                                if (!chosenMusic) {
                                    setShowMusicDialog(true);
                                } else {
                                    setIsRunning(!isRunning);
                                }
                            }}
                        >
                            <Ionicons name={isRunning ? "pause" : "play"} size={32} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.mantraFooter}>
                    <Text style={styles.footerMantraHindi}>{selectedNaam.hindi}</Text>
                    <Text style={styles.footerMantraEnglish}>{selectedNaam.mantra}</Text>
                </View>

                {showConfirmDialog && (
                    <View style={styles.dialogOverlay}>
                        <View style={[styles.dialogBox, { borderColor: '#D4A017' }]}>
                            <Text style={styles.dialogOm}>🙏</Text>
                            <Text style={styles.dialogTitle}>Stop Jaap?</Text>
                            <View style={styles.dialogButtons}>
                                <TouchableOpacity style={[styles.dialogCancel, { borderColor: '#D4A017' }]} onPress={cancelStop}>
                                    <Text style={[styles.dialogCancelText, { color: '#D4A017' }]}>Continue</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dialogConfirm, { backgroundColor: '#B22222' }]} onPress={confirmStop}>
                                    <Text style={styles.dialogConfirmText}>Stop</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {showMusicDialog && (
                    <View style={styles.dialogOverlay}>
                        <View style={[styles.dialogBox, { borderColor: '#D4A017' }]}>
                            <Text style={styles.dialogOm}>🎵</Text>
                            <Text style={styles.dialogTitle}>Choose Music</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {MUSIC_OPTIONS.map((music) => (
                                    <TouchableOpacity key={music.id} style={[styles.musicOptionCard, { borderColor: '#D4A017' }]} onPress={() => beginJaap(music)}>
                                        <View style={[styles.musicOptionIcon, { backgroundColor: '#FFF9F2' }]}><Ionicons name={music.icon as any} size={24} color="#D4A017" /></View>
                                        <Text style={[styles.musicOptionName, { color: '#D4A017' }]}>{music.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    container: {
        flex: 1,
        padding: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingHorizontal: 4,
    },
    omSymbol: {
        fontSize: 28,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#D4A017',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#8B0000',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#B8860B',
        marginTop: 2,
        fontStyle: 'italic',
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    naamCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderLeftWidth: 5,
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    naamIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    naamInfo: {
        flex: 1,
    },
    naamName: {
        fontSize: 16,
        fontWeight: '700',
    },
    naamHindi: {
        fontSize: 14,
        color: '#5D4037',
        marginTop: 2,
        fontWeight: '600',
    },
    naamDeity: {
        fontSize: 11,
        color: '#B8860B',
        marginTop: 2,
    },
    naamBanner: {
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#D4A017',
    },
    bannerOm: {
        fontSize: 32,
        marginBottom: 8,
    },
    bannerHindi: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    bannerDeity: {
        fontSize: 14,
        color: '#8B6914',
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#8B0000',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 2,
        borderColor: '#D4A017',
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    slotIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    slotInfo: {
        flex: 1,
    },
    slotDuration: {
        fontSize: 20,
        fontWeight: '700',
    },
    slotSub: {
        fontSize: 13,
        color: '#8B6914',
        marginTop: 2,
    },
    slotBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    slotBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: SPACING.lg,
        marginTop: SPACING.md,
        borderWidth: 1,
        borderColor: '#EFEBE9',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    infoOm: {
        fontSize: 20,
        marginRight: 8,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#8B4513',
    },
    infoText: {
        fontSize: 14,
        color: '#5D4037',
        lineHeight: 22,
        marginBottom: 4,
    },
    jaapSafeArea: {
        flex: 1,
    },
    jaapContainer: {
        flex: 1,
        padding: SPACING.md,
    },
    jaapTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    jaapTopChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        maxWidth: SCREEN_WIDTH * 0.4,
    },
    jaapTopChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    jaapTopChipIndicator: {
        width: 4,
        height: 12,
        backgroundColor: '#A855F7',
        borderRadius: 2,
    },
    jaapCenter: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    focusHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    focusTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111827',
    },
    focusSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    focusCircleRoot: {
        width: 260,
        height: 260,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusCircleBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 130,
        borderWidth: 20,
        borderColor: '#F3F4F6',
    },
    focusCircleInner: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#FAF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    focusDeityIconContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 130,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressRingGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 130,
    },
    ringMask: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#FFFFFF',
    },
    focusTimerText: {
        fontSize: 64,
        fontWeight: '700',
        color: '#111827',
        marginTop: 30,
    },
    focusControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        gap: 20,
    },
    materialFab: {
        backgroundColor: '#111827',
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    footerMantraEnglish: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 4,
    },
    mantraFooter: {
        paddingBottom: 20,
        alignItems: 'center',
    },
    footerMantraHindi: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    footerCount: {
        fontSize: 14,
        color: '#6B7280',
    },
    mantraDisplay: {
        marginTop: 30,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    mantraHindi: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    mantraEnglish: {
        fontSize: 16,
        color: '#5D4037',
        fontStyle: 'italic',
        textAlign: 'center',
        opacity: 0.7,
    },
    bottomArea: {
        height: 180,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    completeBadge: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    completeOm: {
        fontSize: 32,
        marginBottom: 10,
    },
    completeText: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 5,
    },
    actionButton: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    progressSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    progressBar: {
        width: SCREEN_WIDTH - 80,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    startButton: {
        flexDirection: 'row',
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    startOm: {
        fontSize: 24,
        marginRight: 12,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 1,
    },
    stopButton: {
        flexDirection: 'row',
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopButtonText: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    dialogOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    dialogBox: {
        width: SCREEN_WIDTH * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
    },
    dialogOm: {
        fontSize: 40,
        marginBottom: 16,
    },
    dialogTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#333',
        marginBottom: 12,
    },
    dialogButtons: {
        width: '100%',
    },
    dialogCancel: {
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    dialogCancelText: {
        fontSize: 16,
        fontWeight: '700',
    },
    dialogConfirm: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogConfirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    dialogOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    dialogBox: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    dialogOm: { fontSize: 32, marginBottom: 10 },
    dialogTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    dialogButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    dialogCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    dialogCancelText: { fontWeight: '600' },
    dialogConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    dialogConfirmText: { color: '#FFF', fontWeight: '600' },
    musicOptionCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    musicOptionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    musicOptionName: { fontSize: 15, fontWeight: '600' },
});

export default EkantJaapPage;
