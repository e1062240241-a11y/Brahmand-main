import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
    Vibration,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NaamJaap = {
    id: string;
    name: string;
    mantra: string;
    hindi: string;
    subtitle: string;
    deity: string;
    icon: string;
    color: string;
    bgColor: string;
    iconBg: string;
    ticker: string;
};

const NAAM_JAAP_LIST: NaamJaap[] = [
    {
        id: 'shiv',
        name: 'Shiv Jaap',
        mantra: 'Om Namah Shivaya',
        hindi: 'ॐ नमः शिवाय',
        subtitle: 'Om Na-mah Shi-va-ya',
        deity: 'Lord Shiva',
        icon: 'flame',
        color: '#FF5722',
        bgColor: '#FFF3E0',
        iconBg: '#FFE0B2',
        ticker: '  Om Namah Shivaya   •   ॐ नमः शिवाय   •   Har Har Mahadev   •   शंभू शंभू   •   महादेव महादेव   •   Bholenath Bholenath   •   ॐ नमः शिवाय   •   Namah Shivaya   •   ',
    },
    {
        id: 'ram',
        name: 'Ram Jaap',
        mantra: 'Shri Ram Jai Ram Jai Jai Ram',
        hindi: 'श्री राम जय राम जय जय राम',
        subtitle: 'Shri Ram   Jai Ram   Jai Jai Ram',
        deity: 'Lord Ram',
        icon: 'star',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        iconBg: '#C8E6C9',
        ticker: '  Shri Ram Jai Ram Jai Jai Ram   •   श्री राम जय राम जय जय राम   •   Jai Shri Ram   •   राम राम   •   Sita Ram Sita Ram   •   जय जय राम   •   ',
    },
    {
        id: 'krishna',
        name: 'Krishna Jaap',
        mantra: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare',
        hindi: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे',
        subtitle: 'Ha-re   Krish-na   Ha-re   Krish-na',
        deity: 'Lord Krishna',
        icon: 'planet',
        color: '#2196F3',
        bgColor: '#E3F2FD',
        iconBg: '#BBDEFB',
        ticker: '  Hare Krishna Hare Krishna   •   हरे कृष्ण हरे कृष्ण   •   Krishna Krishna Hare Hare   •   कृष्ण कृष्ण हरे हरे   •   Radhe Radhe   •   राधे राधे   •   Hare Rama Hare Rama   •   ',
    },
    {
        id: 'sarva-mangal',
        name: 'Sarva Mangal Jaap',
        mantra: 'Sarva Mangal Mangalye Shive Sarvartha Sadhike',
        hindi: 'सर्व मंगल मांगल्ये शिवे सर्वार्थ साधिके',
        subtitle: 'Sar-va   Man-gal   Man-ga-lye   Shi-ve',
        deity: 'Goddess Parvati',
        icon: 'sparkles',
        color: '#9C27B0',
        bgColor: '#F3E5F5',
        iconBg: '#E1BEE7',
        ticker: '  Sarva Mangal Mangalye   •   सर्व मंगल मांगल्ये   •   Shive Sarvartha Sadhike   •   शिवे सर्वार्थ साधिके   •   Sharnye Tryambake Gauri   •   शरण्ये त्र्यम्बके गौरी   •   Narayani Namostute   •   नारायणि नमोस्तुते   •   ',
    },
    {
        id: 'gayatri',
        name: 'Gayatri Jaap',
        mantra: 'Om Bhur Bhuvah Swaha',
        hindi: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
        subtitle: 'Om   Bhur   Bhuvah   Swa-ha',
        deity: 'Gayatri Devi',
        icon: 'sunny',
        color: '#FF9800',
        bgColor: '#FFF8E1',
        iconBg: '#FFECB3',
        ticker: '  Om Bhur Bhuvah Swaha   •   ॐ भूर्भुवः स्वः   •   Tat Savitur Varenyam   •   भर्गो देवस्य धीमहि   •   धियो यो नः प्रचोदयात्   • ',
    },
    {
        id: 'hanuman',
        name: 'Hanuman Jaap',
        mantra: 'Om Hanumate Namah',
        hindi: 'ॐ हनुमते नमः',
        subtitle: 'Om   Ha-nu-ma-te   Na-mah',
        deity: 'Lord Hanuman',
        icon: 'body',
        color: '#F44336',
        bgColor: '#FFEBEE',
        iconBg: '#FFCDD2',
        ticker: '  Om Hanumate Namah   •   ॐ हनुमते नमः   •   Bajrang Bali Ki Jai   •   हनुमान हनुमान   •   जय हनुमान जय हनुमान   • ',
    },
    {
        id: 'ganesh',
        name: 'Ganesh Jaap',
        mantra: 'Om Gam Ganapataye Namah',
        hindi: 'ॐ गं गणपतये नमः',
        subtitle: 'Om   Gam   Ga-na-pa-ta-ye',
        deity: 'Lord Ganesha',
        icon: 'diamond',
        color: '#795548',
        bgColor: '#EFEBE9',
        iconBg: '#D7CCC8',
        ticker: '  Om Gam Ganapataye Namah   •   ॐ गं गणपतये नमः   •   Vakratunda Mahakaya   •   गजानन गजानन   •   ',
    },
    {
        id: 'durga',
        name: 'Durga Jaap',
        mantra: 'Om Dum Durgayei Namah',
        hindi: 'ॐ दुं दुर्गायै नमः',
        subtitle: 'Om   Dum   Dur-ga-yei   Na-mah',
        deity: 'Goddess Durga',
        icon: 'shield-checkmark',
        color: '#E91E63',
        bgColor: '#FCE4EC',
        iconBg: '#F8BBD0',
        ticker: '  Om Dum Durgayei Namah   •   ॐ दुं दुर्गायै नमः   •   जय माता दी   •   दुर्गा दुर्गा   •   नमोस्तुते   •   ',
    },
];

const TIME_SLOTS = [
    { label: '10 min', seconds: 600, minutes: 10 },
    { label: '20 min', seconds: 1200, minutes: 20 },
    { label: '30 min', seconds: 1800, minutes: 30 },
];

const MUSIC_OPTIONS = [
    { id: 'yoga', name: 'Yoga Zen Ambience', icon: 'leaf', path: '/audio/yoga-509070.mp3' },
    { id: 'leberch', name: 'Leberch Yoga', icon: 'musical-notes', path: '/audio/leberch-yoga-509070.mp3' },
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
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const chantAnimRef = useRef(new Animated.Value(1)).current;
    const chantOpacityRef = useRef(new Animated.Value(1)).current;

    const startChantAnimation = useCallback(() => {
        chantOpacityRef.setValue(0.5);
        Animated.loop(
            Animated.sequence([
                Animated.timing(chantAnimRef, {
                    toValue: 1.05,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(chantAnimRef, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const stopChantAnimation = useCallback(() => {
        chantAnimRef.setValue(1);
        chantOpacityRef.setValue(1);
    }, []);

    const handleSelectNaam = (naam: NaamJaap) => {
        setSelectedNaam(naam);
        setSelectedSlot(null);
        setChosenMusic(null);
        setIsRunning(false);
        setIsComplete(false);
        setIsAudioEnabled(false);
        setShowMusicDialog(false);
        setTimeLeft(0);
        setTotalJaapCount(0);
    };

    const handleSelectSlot = (slot: typeof TIME_SLOTS[0]) => {
        setSelectedSlot(slot);
        setTimeLeft(slot.seconds);
        setLastMinute(slot.minutes);
    };

    const handleStartPress = () => {
        setShowMusicDialog(true);
    };

    const beginJaap = async (music: typeof MUSIC_OPTIONS[0]) => {
        setShowMusicDialog(false);
        setChosenMusic(music);
        if (!selectedNaam || !selectedSlot) return;
        setIsRunning(true);
        setIsAudioEnabled(true);
        setIsComplete(false);
        setLastMinute(Math.ceil(selectedSlot.seconds / 60));
        Vibration.vibrate(200);
        startChantAnimation();

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    intervalRef.current = null;
                    setIsRunning(false);
                    setIsComplete(true);
                    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
                    stopChantAnimation();
                    return 0;
                }
                const newMinutes = Math.ceil((prev - 1) / 60);
                const oldMinutes = Math.ceil(prev / 60);
                if (newMinutes !== oldMinutes && newMinutes > 0) {
                    setLastMinute(newMinutes);
                }
                return prev - 1;
            });
            setTotalJaapCount((c) => c + 1);
        }, 1000);
    };

    const handleStop = () => {
        setShowConfirmDialog(true);
    };

    const confirmStop = () => {
        setShowConfirmDialog(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
        setIsComplete(false);
        setIsAudioEnabled(false);
        setLastMinute(null);
        setChosenMusic(null);
        setShowMusicDialog(false);
        stopChantAnimation();
        setSelectedNaam(null);
        setSelectedSlot(null);
    };

    const cancelStop = () => {
        setShowConfirmDialog(false);
    };

    const handleGoBack = useCallback(() => {
        if (isRunning) {
            handleStop();
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setSelectedNaam(null);
            setSelectedSlot(null);
            setChosenMusic(null);
            setIsRunning(false);
            setIsComplete(false);
            setIsAudioEnabled(false);
            setLastMinute(null);
            setShowMusicDialog(false);
            setTimeLeft(0);
            setTotalJaapCount(0);
            setShowConfirmDialog(false);
            router.replace('/(tabs)/home');
        }
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!isRunning || !chosenMusic) return;
        const audio = new Audio(chosenMusic.path);
        audio.loop = true;
        audio.volume = 0.5;
        audio.preload = 'auto';
        audioRef.current = audio;

        if (isAudioEnabled) {
            audio.play().catch(() => { });
        }

        return () => {
            audio.pause();
            if (audioRef.current === audio) audioRef.current = null;
        };
    }, [isRunning, chosenMusic]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isAudioEnabled) {
            audioRef.current.play().catch(() => { });
        } else {
            audioRef.current.pause();
        }
    }, [isAudioEnabled]);

    const progress = selectedSlot ? ((selectedSlot.seconds - timeLeft) / selectedSlot.seconds) * 100 : 0;

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    /* ========== SELECTION SCREEN ========== */
    if (!selectedNaam) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
                            <Ionicons name="arrow-back" size={24} color="#D4A017" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.omSymbol}>🕉️</Text>
                            <Text style={styles.headerTitle}>Ekant Jaap</Text>
                        </View>
                        <Text style={styles.omSymbol}>🪷</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {NAAM_JAAP_LIST.map((naam) => (
                            <TouchableOpacity
                                key={naam.id}
                                style={[styles.naamCard, { borderLeftColor: naam.color }]}
                                activeOpacity={0.7}
                                onPress={() => handleSelectNaam(naam)}
                            >
                                <View style={[styles.naamIconContainer, { backgroundColor: naam.iconBg }]}>
                                    <Ionicons name={naam.icon as any} size={24} color={naam.color} />
                                </View>
                                <View style={styles.naamInfo}>
                                    <Text style={[styles.naamName, { color: naam.color }]}>{naam.name}</Text>
                                    <Text style={styles.naamMantra}>{naam.mantra}</Text>
                                    <Text style={styles.naamHindi}>{naam.hindi}</Text>
                                    <Text style={styles.naamDeity}>{naam.deity}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={22} color="#B8860B" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    /* ========== SLOT SELECTION ========== */
    if (!selectedSlot) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
                            <Ionicons name="arrow-back" size={24} color="#D4A017" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.omSymbol}>🕉️</Text>
                            <Text style={[styles.headerTitle, { color: selectedNaam.color }]}>{selectedNaam.name}</Text>
                            <Text style={styles.headerSubtitle}>{selectedNaam.mantra}</Text>
                        </View>
                        <Ionicons name={selectedNaam.icon as any} size={32} color={selectedNaam.color} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={[styles.naamBanner, { backgroundColor: selectedNaam.bgColor }]}>
                            <Text style={styles.bannerOm}>🕉️</Text>
                            <Text style={[styles.bannerHindi, { color: selectedNaam.color }]}>{selectedNaam.hindi}</Text>
                            <Text style={styles.bannerDeity}>{selectedNaam.deity}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Choose Your Jaap Time</Text>

                        {TIME_SLOTS.map((slot) => (
                            <TouchableOpacity
                                key={slot.label}
                                style={styles.slotCard}
                                activeOpacity={0.7}
                                onPress={() => handleSelectSlot(slot)}
                            >
                                <View style={[styles.slotIconContainer, { backgroundColor: selectedNaam.bgColor }]}>
                                    <Ionicons name="timer" size={28} color={selectedNaam.color} />
                                </View>
                                <View style={styles.slotInfo}>
                                    <Text style={[styles.slotDuration, { color: selectedNaam.color }]}>{slot.label}</Text>
                                    <Text style={styles.slotSub}>{slot.minutes} minutes of continuous {selectedNaam.name.toLowerCase()}</Text>
                                </View>
                                <View style={[styles.slotBadge, { backgroundColor: selectedNaam.bgColor }]}>
                                    <Text style={[styles.slotBadgeText, { color: selectedNaam.color }]}>{slot.label}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <Text style={styles.infoOm}>🪔</Text>
                                <Text style={styles.infoTitle}>How it works</Text>
                            </View>
                            <Text style={styles.infoText}>
                                1. Choose a time slot (10, 20, or 30 minutes)
                            </Text>
                            <Text style={styles.infoText}>
                                2. Press Start to begin your Ekant Jaap
                            </Text>
                            <Text style={styles.infoText}>
                                3. Chant the naam as the timer runs and subtitles scroll
                            </Text>
                            <Text style={styles.infoText}>
                                4. Complete the full session for your spiritual practice
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    /* ========== JAAP TIMER SCREEN ========== */
    return (
        <SafeAreaView style={[styles.jaapSafeArea, { backgroundColor: selectedNaam.bgColor }]}>
            <View style={styles.jaapContainer}>
                {/* Top bar */}
                <View style={styles.jaapTopBar}>
                    <TouchableOpacity style={styles.jaapBackBtn} onPress={handleGoBack} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="#D4A017" />
                    </TouchableOpacity>
                    <View style={styles.jaapTopTitleContainer}>
                        <Text style={styles.topOm}>🕉️</Text>
                        <Text style={[styles.jaapTopTitle, { color: selectedNaam.color }]}>{selectedNaam.name}</Text>
                    </View>
                    <View style={styles.jaapTopControls}>
                        {isRunning && (
                            <TouchableOpacity
                                style={[styles.audioBtn, { borderColor: selectedNaam.color, backgroundColor: isAudioEnabled ? selectedNaam.color : '#FFFFFF' }]}
                                onPress={() => setIsAudioEnabled(!isAudioEnabled)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={isAudioEnabled ? 'volume-high' : 'volume-mute'}
                                    size={18}
                                    color={isAudioEnabled ? '#FFFFFF' : selectedNaam.color}
                                />
                            </TouchableOpacity>
                        )}
                        <View style={[styles.jaapTopRight, { borderColor: selectedNaam.color }]}>
                            <Text style={styles.flameSymbol}>🔥</Text>
                            <Text style={[styles.jaapTopCount, { color: selectedNaam.color }]}>{totalJaapCount}</Text>
                        </View>
                    </View>
                </View>

                {/* Center content - Lyrics focused */}
                <View style={styles.jaapCenter}>
                    {/* Bold Lyrics Display */}
                    <View style={styles.lyricsContainer}>
                        <View style={[styles.lyricsCard, { borderColor: selectedNaam.color }]}>
                            <View style={styles.lyricsHeader}>
                                <Text style={styles.lyricOm}>🙏</Text>
                                <Text style={[styles.lyricsDeity, { color: selectedNaam.color }]}>{selectedNaam.deity}</Text>
                            </View>
                            <Animated.Text style={[styles.lyricsHindi, { color: selectedNaam.color, transform: [{ scale: chantAnimRef }] }]}>
                                {selectedNaam.hindi}
                            </Animated.Text>
                            <View style={[styles.lyricsDivider, { backgroundColor: selectedNaam.color }]} />
                            <Animated.Text style={[styles.lyricsEnglish, { color: '#5D4037', transform: [{ scale: chantAnimRef }] }]}>
                                {selectedNaam.mantra}
                            </Animated.Text>
                        </View>
                    </View>

                    {/* Timer below lyrics */}
                    <View style={[styles.timerCircle, { borderColor: selectedNaam.color }]}>
                        <View style={styles.timerInnerRing}>
                            <Text style={styles.timerOm}>🕉️</Text>
                            <Text style={[styles.timerText, { color: selectedNaam.color }]}>
                                {formatTime(timeLeft)}
                            </Text>
                            {!isRunning && !isComplete && (
                                <Text style={styles.timerSessionLabel}>{selectedSlot.label} session</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Fixed bottom action area */}
                <View style={styles.bottomArea}>
                    {isComplete ? (
                        <>
                            <View style={[styles.completeBadge, { backgroundColor: selectedNaam.bgColor }]}>
                                <Text style={styles.completeOm}>🪷</Text>
                                <Text style={[styles.completeText, { color: selectedNaam.color }]}>Jaap Complete!</Text>
                                <Text style={styles.completeSub}>You completed {selectedSlot.label} of {selectedNaam.name.toLowerCase()}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: selectedNaam.color }]}
                                onPress={() => {
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                        audioRef.current = null;
                                    }
                                    setIsComplete(false);
                                    setIsAudioEnabled(false);
                                    setSelectedSlot(null);
                                    setTimeLeft(0);
                                    setTotalJaapCount(0);
                                }}
                            >
                                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Do Another Jaap</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Progress bar */}
                            <View style={styles.progressSection}>
                                <View style={[styles.progressBar, { backgroundColor: selectedNaam.iconBg }]}>
                                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: selectedNaam.color }]} />
                                </View>
                                <Text style={styles.progressLabel}>
                                    {isRunning ? 'Jaap in progress...' : 'Ready to begin'}
                                </Text>
                            </View>

                            {/* Start/Stop button */}
                            {!isRunning ? (
                                <TouchableOpacity
                                    style={[styles.startButton, { backgroundColor: selectedNaam.color }]}
                                    onPress={handleStartPress}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.startOm}>🪔</Text>
                                    <Text style={styles.startButtonText}>Start Jaap</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.stopButton, { borderColor: selectedNaam.color }]}
                                    onPress={handleStop}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="stop-circle" size={24} color={selectedNaam.color} />
                                    <Text style={[styles.stopButtonText, { color: selectedNaam.color }]}>Stop Jaap</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>

                {/* Confirm dialog */}
                {showConfirmDialog && (
                    <View style={styles.dialogOverlay}>
                        <View style={[styles.dialogBox, { borderColor: selectedNaam.color }]}>
                            <Text style={styles.dialogOm}>🙏</Text>
                            <Text style={styles.dialogTitle}>Stop Jaap?</Text>
                            <Text style={styles.dialogText}>Are you sure you want to stop your {selectedNaam.name.toLowerCase()} session?</Text>
                            <View style={styles.dialogButtons}>
                                <TouchableOpacity style={[styles.dialogCancel, { borderColor: selectedNaam.color }]} onPress={cancelStop}>
                                    <Text style={[styles.dialogCancelText, { color: selectedNaam.color }]}>Continue Jaap</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dialogConfirm, { backgroundColor: '#B22222' }]} onPress={confirmStop}>
                                    <Text style={styles.dialogConfirmText}>Stop Jaap</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Music selection dialog */}
                {showMusicDialog && (
                    <View style={styles.dialogOverlay}>
                        <View style={[styles.dialogBox, { borderColor: selectedNaam.color }]}>
                            <Text style={styles.dialogOm}>🎵</Text>
                            <Text style={styles.dialogTitle}>Choose Music</Text>
                            <Text style={styles.dialogText}>Select background music for your jaap</Text>
                            {MUSIC_OPTIONS.map((music) => (
                                <TouchableOpacity
                                    key={music.id}
                                    style={[styles.musicOptionCard, { borderColor: selectedNaam.color }]}
                                    activeOpacity={0.7}
                                    onPress={() => beginJaap(music)}
                                >
                                    <View style={[styles.musicOptionIcon, { backgroundColor: selectedNaam.bgColor }]}>
                                        <Ionicons name={music.icon as any} size={24} color={selectedNaam.color} />
                                    </View>
                                    <Text style={[styles.musicOptionName, { color: selectedNaam.color }]}>{music.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={selectedNaam.color} />
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={[styles.dialogCancel, { borderColor: '#999', marginTop: 8 }]} onPress={() => setShowMusicDialog(false)}>
                                <Text style={[styles.dialogCancelText, { color: '#666' }]}>Cancel</Text>
                            </TouchableOpacity>
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
        backgroundColor: '#FFF8E7',
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
    naamMantra: {
        fontSize: 13,
        color: '#8B6914',
        marginTop: 2,
        fontStyle: 'italic',
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
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        borderRadius: 8,
    },
    slotBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: '#FFF3E0',
        borderRadius: 16,
        padding: SPACING.lg,
        marginTop: SPACING.md,
        borderWidth: 1,
        borderColor: '#D4A017',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    infoOm: {
        fontSize: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8B0000',
    },
    infoText: {
        fontSize: 13,
        color: '#5D4037',
        lineHeight: 22,
        marginBottom: SPACING.xs,
    },
    /* JAAP TIMER SCREEN */
    jaapSafeArea: {
        flex: 1,
    },
    jaapContainer: {
        flex: 1,
        padding: SPACING.md,
    },
    jaapTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    jaapBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#D4A017',
        justifyContent: 'center',
        alignItems: 'center',
    },
    jaapTopTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    jaapTopControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    audioBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topOm: {
        fontSize: 22,
    },
    jaapTopTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    jaapTopRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
    },
    flameSymbol: {
        fontSize: 16,
    },
    jaapTopCount: {
        fontSize: 16,
        fontWeight: '700',
    },
    jaapCenter: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
    },
    bottomArea: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    timerCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#FFFFFF',
        borderWidth: 5,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: SPACING.md,
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    timerInnerRing: {
        width: 138,
        height: 138,
        borderRadius: 69,
        backgroundColor: '#FFFBF0',
        borderWidth: 2,
        borderColor: '#E8D5B7',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
    },
    timerOm: {
        fontSize: 18,
        marginBottom: 2,
    },
    timerText: {
        fontSize: 30,
        fontWeight: '800',
        fontFamily: 'monospace',
        lineHeight: 38,
    },
    timerSessionLabel: {
        fontSize: 10,
        color: '#B8860B',
        marginTop: 2,
        fontWeight: '600',
    },
    /* Lyrics Display */
    lyricsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md,
    },
    lyricsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: SPACING.lg,
        width: '100%',
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    lyricsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.xs,
    },
    lyricOm: {
        fontSize: 18,
    },
    lyricsDeity: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    lyricsHindi: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: SPACING.sm,
    },
    lyricsDivider: {
        width: 80,
        height: 4,
        borderRadius: 2,
        marginBottom: SPACING.sm,
    },
    lyricsEnglish: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 26,
        letterSpacing: 0.5,
    },
    progressSection: {
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    progressFill: {
        height: 8,
        borderRadius: 4,
    },
    progressLabel: {
        fontSize: 15,
        color: '#8B0000',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    buttonContainer: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: 30,
        gap: SPACING.sm,
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    startOm: {
        fontSize: 22,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: 30,
        borderWidth: 3,
        gap: SPACING.sm,
    },
    stopButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    completeBadge: {
        alignItems: 'center',
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        width: '100%',
        borderWidth: 2,
        borderColor: '#D4A017',
    },
    completeOm: {
        fontSize: 40,
        marginBottom: SPACING.sm,
    },
    completeText: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: SPACING.sm,
    },
    completeSub: {
        fontSize: 14,
        color: '#8B6914',
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: 30,
        gap: SPACING.sm,
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    dialogOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(139, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    dialogBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: SPACING.lg,
        width: SCREEN_WIDTH - SPACING.lg * 2,
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    dialogOm: {
        fontSize: 36,
        marginBottom: SPACING.sm,
    },
    dialogTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#8B0000',
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    dialogText: {
        fontSize: 14,
        color: '#5D4037',
        textAlign: 'center',
        marginBottom: SPACING.sm,
        lineHeight: 22,
    },
    musicOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: SPACING.sm,
    },
    musicOptionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    musicOptionName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
    },
    dialogButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    dialogCancel: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
    },
    dialogCancelText: {
        fontSize: 14,
        fontWeight: '700',
    },
    dialogConfirm: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    dialogConfirmText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default EkantJaapPage;

