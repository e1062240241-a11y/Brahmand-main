// accessibility: placeholder
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    } from 'react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { KaraokeSyncEngine, KaraokeData, KaraokeSection } from '../src/components/Karaoke';
import hanumanChalisaData from '../assets/data/hanuman-chalisa-karaoke.json';
import { useTranslation } from '../src/utils/i18n';

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
        name: 'Hanuman Chalisa',
        hindi: 'श्री हनुमान चालीसा',
        mantra: 'Jai Hanuman Gyan Gun Sagar',
        deity: 'Lord Hanuman',
        color: '#FF6B00',
        bgColor: '#FFF5EB',
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
    { id: 'waterfall', name: 'Peaceful Waterfall', hindiName: 'शांत झरना', icon: 'water', file: require('../assets/audio/audio ekant/rmultimediaeu-birds-and-waterfall-250309.mp3') },
    { id: 'yoga-zen', name: 'Yoga Zen Ambience', hindiName: 'योग ध्यान वातावरण', icon: 'leaf', file: require('../assets/audio/audio ekant/leberch-yoga-509070.mp3') },
    { id: 'yoga-meditation', name: 'Deep Meditation', hindiName: 'गहरा ध्यान', icon: 'musical-notes', file: require('../assets/audio/audio ekant/leberch-yoga-509709.mp3') },
    { id: 'nature', name: 'Birds & Waterfall', hindiName: 'पक्षी और झरना', icon: 'sunny', file: require('../assets/audio/audio ekant/rmultimediaeu-birds-and-waterfall-250309.mp3') },
];

const HANUMAN_CHALISA_AUDIO = require('../assets/audio/audio ekant/Hanuman chalisa.mp3');
const HANUMAN_CHALISA_KARAOKE: KaraokeData = hanumanChalisaData as unknown as KaraokeData;

const getKaraokeDuration = (): number => {
    const lastSection = HANUMAN_CHALISA_KARAOKE.structure[HANUMAN_CHALISA_KARAOKE.structure.length - 1];
    const end = lastSection ? (lastSection.type === 'music' ? lastSection.end : (lastSection.words[lastSection.words.length - 1]?.end ?? 0)) : 0;
    return Math.ceil(end);
};

const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
};

const EkantJaapPage = () => {
    const { t } = useTranslation();
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
    const [audioSource, setAudioSource] = useState<any | null>(null);
    const player = useAudioPlayer(audioSource, { updateInterval: 100 });
    const playerStatus = useAudioPlayerStatus(player);

    useEffect(() => {
        const initAudioMode = async () => {
            try {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    interruptionMode: 'doNotMix',
                    shouldRouteThroughEarpiece: false,
                });
            } catch (error) {
                console.warn('Failed to set audio mode in Ekant Jaap:', error);
            }
        };
        initAudioMode();
    }, []);

    const [isKaraokeMode, setIsKaraokeMode] = useState(false);
    const [karaokeCurrentTime, setKaraokeCurrentTime] = useState(0);
    const [karaokeSection, setKaraokeSection] = useState<KaraokeSection | null>(null);
    const [karaokeDuration, setKaraokeDuration] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasAutoPlayedRef = useRef(false);
    const karaokeTimeRef = useRef(0);
    const karaokeRunningRef = useRef(false);

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

        if (naam.id === 'hanuman') {
            hasAutoPlayedRef.current = false;
            const duration = getKaraokeDuration();
            setKaraokeDuration(duration);
            setTimeLeft(duration);
            setSelectedSlot({ id: 'karaoke', label: formatDuration(duration), seconds: duration, minutes: Math.ceil(duration / 60) });
            setAudioSource(HANUMAN_CHALISA_AUDIO);
            setIsKaraokeMode(true);
            setChosenMusic({ id: 'hanuman-chalisa', name: 'Hanuman Chalisa', hindiName: 'हनुमान चालीसा', icon: 'book', file: HANUMAN_CHALISA_AUDIO });
        }
    };

    const handleSelectSlot = (slot: typeof TIME_SLOTS[0]) => {
        setSelectedSlot(slot);
        setTimeLeft(slot.seconds);
        setLastMinute(slot.minutes);
        setShowMusicDialog(true);
        Vibration.vibrate(50);
    };

    useEffect(() => {
        if (isRunning && !isKaraokeMode) {
            intervalRef.current = setInterval(() => {
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
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, isKaraokeMode]);

    const beginJaap = async (music: typeof MUSIC_OPTIONS[0]) => {
        setShowMusicDialog(false);
        setChosenMusic(music);
        setAudioSource(music.file || null);
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
            try {
                player.pause();
            } catch (error) {
                console.warn('Ekant Jaap stop pause failed', error);
            }
        }
        setIsRunning(false);
        setIsComplete(false);
        setIsAudioEnabled(false);
        setIsKaraokeMode(false);
        setKaraokeCurrentTime(0);
        setKaraokeSection(null);
        setKaraokeDuration(0);
        hasAutoPlayedRef.current = false;
        karaokeTimeRef.current = 0;
        karaokeRunningRef.current = false;
        setLastMinute(null);
        setChosenMusic(null);
        setAudioSource(null);
        setShowMusicDialog(false);
        setSelectedNaam(null);
        setSelectedSlot(null);
    };

    const handleGoBack = () => {
        if (isRunning) {
            handleStop();
        } else {
            if (player) {
                try {
                    player.pause();
                } catch (error) {
                    console.warn('Ekant Jaap back pause failed', error);
                }
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (isKaraokeMode) {
                setIsKaraokeMode(false);
                setKaraokeDuration(0);
                hasAutoPlayedRef.current = false;
                setSelectedSlot(null);
                setSelectedNaam(null);
            } else if (selectedSlot) {
                setSelectedSlot(null);
                setTimeLeft(0);
            } else if (selectedNaam) {
                setSelectedNaam(null);
            } else {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(tabs)/jaap');
                }
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!player) return;

        if (isRunning) {
            try {
                player.volume = isAudioEnabled ? 1.0 : 0.0;
                if (!playerStatus?.playing) {
                    player.play();
                }
            } catch (error) {
                console.warn('Ekant Jaap audio play failed', error);
            }
        } else {
            try {
                if (playerStatus?.playing) {
                    player.pause();
                }
            } catch (error) {
                console.warn('Ekant Jaap audio pause failed', error);
            }
        }
    }, [player, isRunning, isAudioEnabled, playerStatus?.playing]);

    // Clean up player on unmount to prevent audio leaks
    useEffect(() => {
        return () => {
            if (player) {
                try {
                    player.pause();
                } catch (e) {
                    console.warn('Failed to pause player on unmount', e);
                }
            }
        };
    }, [player]);

    useEffect(() => {
        if (!player || !isKaraokeMode) return;
        if (hasAutoPlayedRef.current) return;

        player.loop = false;
        player.volume = isAudioEnabled ? 1.0 : 0.0;

        const attemptPlay = () => {
            if (hasAutoPlayedRef.current) return;
            try {
                player.play();
                hasAutoPlayedRef.current = true;
                setIsAudioEnabled(true);
                setIsRunning(true);
            } catch {
                // player not ready yet, will retry
            }
        };

        attemptPlay();

        const retryInterval = setInterval(() => {
            if (!hasAutoPlayedRef.current) {
                attemptPlay();
            } else {
                clearInterval(retryInterval);
            }
        }, 300);

        setTimeout(() => clearInterval(retryInterval), 15000);

        return () => clearInterval(retryInterval);
    }, [isKaraokeMode, player]);

    useEffect(() => {
        if (!isKaraokeMode || !playerStatus || !playerStatus.isLoaded) return;

        const currentPos = playerStatus.currentTime;
        setKaraokeCurrentTime(currentPos);

        if (isRunning && playerStatus.duration > 0) {
            const remaining = Math.max(0, Math.ceil(playerStatus.duration - currentPos));
            setTimeLeft(remaining);
        }

        if (isRunning && currentPos >= playerStatus.duration - 0.3 && playerStatus.duration > 1) {
            setIsRunning(false);
            setIsComplete(true);
            Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        }
    }, [playerStatus, isKaraokeMode, isRunning]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const progress = selectedSlot ? ((selectedSlot.seconds - timeLeft) / selectedSlot.seconds) * 100 : 0;

    if (!selectedNaam) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/(tabs)/jaap');
                                }
                            }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#D4A017" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>{t('language') === 'hi' ? 'एकांत जाप' : 'Ekant Jaap'}</Text>
                            <Text style={styles.headerSubtitle}>{t('language') === 'hi' ? 'शांतिपूर्ण आध्यात्मिक अभ्यास' : 'Peaceful Spiritual Practice'}</Text>
                        </View>
                        <Text style={styles.omSymbol}>🕉️</Text>
                    </View>

                    <Text style={styles.sectionTitle}>{t('language') === 'hi' ? 'पवित्र नाम चुनें' : 'Select Holy Name'}</Text>
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
                                    <Text style={[styles.naamName, { color: naam.color }]}>{t('language') === 'hi' ? naam.hindi.split(' ').slice(0,2).join(' ') || naam.name : naam.name}</Text>
                                    <Text style={styles.naamHindi}>{naam.hindi}</Text>
                                    <Text style={styles.naamDeity}>{t('language') === 'hi' ? (() => { const d = naam.deity; if (d === 'Lord Shiva') return 'भगवान शिव'; if (d === 'Lord Ram') return 'भगवान राम'; if (d === 'Lord Krishna') return 'भगवान कृष्ण'; if (d === 'Goddess Parvati') return 'माता पार्वती'; if (d === 'Gayatri Devi') return 'गायत्री देवी'; if (d === 'Lord Hanuman') return 'हनुमान जी'; if (d === 'Lord Ganesha') return 'भगवान गणेश'; if (d === 'Goddess Durga') return 'माता दुर्गा'; return d; })() : naam.deity}</Text>
                                </View>
                                {naam.id === 'hanuman' ? (
                                    <View style={styles.karaokeBadge}>
                                        <Ionicons name="sparkles" size={12} color="#FF6B00" />
                                        <Text style={styles.karaokeBadgeText}>{t('language') === 'hi' ? 'कराओके' : 'Karaoke'}</Text>
                                    </View>
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color={naam.color} />
                                )}
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

                    <Text style={styles.sectionTitle}>{t('language') === 'hi' ? 'समय चुनें' : 'Choose Duration'}</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.naamBanner, { backgroundColor: selectedNaam.bgColor }]}>
                            <Text style={styles.bannerOm}>🙏</Text>
                            <Text style={[styles.bannerHindi, { color: selectedNaam.color }]}>{selectedNaam.hindi}</Text>
                            <Text style={styles.bannerDeity}>{t('language') === 'hi' ? (() => { const d = selectedNaam.deity; if (d === 'Lord Shiva') return 'भगवान शिव'; if (d === 'Lord Ram') return 'भगवान राम'; if (d === 'Lord Krishna') return 'भगवान कृष्ण'; if (d === 'Goddess Parvati') return 'माता पार्वती'; if (d === 'Gayatri Devi') return 'गायत्री देवी'; if (d === 'Lord Hanuman') return 'हनुमान जी'; if (d === 'Lord Ganesha') return 'भगवान गणेश'; if (d === 'Goddess Durga') return 'माता दुर्गा'; return d; })() : selectedNaam.deity}</Text>
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
                                    <Text style={[styles.slotDuration, { color: selectedNaam.color }]}>{t('language') === 'hi' ? `${slot.minutes} मिनट` : slot.label}</Text>
                                    <Text style={styles.slotSub}>{t('language') === 'hi' ? 'पूर्ण एकाग्रता सत्र' : 'Complete focused session'}</Text>
                                </View>
                                <View style={[styles.slotBadge, { backgroundColor: selectedNaam.iconBg }]}>
                                    <Text style={[styles.slotBadgeText, { color: selectedNaam.color }]}>{t('language') === 'hi' ? 'चुनें' : 'SELECT'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <Text style={styles.infoOm}>🪔</Text>
                                <Text style={styles.infoTitle}>{t('language') === 'hi' ? 'यह कैसे काम करता है' : 'How it works'}</Text>
                            </View>
                            <Text style={styles.infoText}>{t('language') === 'hi' ? '१. समय स्लॉट चुनें (10, 20 या 30 मिनट)' : '1. Choose a time slot (10, 20, or 30 minutes)'}</Text>
                            <Text style={styles.infoText}>{t('language') === 'hi' ? '२. एकांत जाप शुरू करने के लिए Start दबाएं' : '2. Press Start to begin your Ekant Jaap'}</Text>
                            <Text style={styles.infoText}>{t('language') === 'hi' ? '३. टाइमर चलते समय नाम जपें' : '3. Chant the naam as the timer runs'}</Text>
                            <Text style={styles.infoText}>{t('language') === 'hi' ? '४. अपने अभ्यास के लिए पूरा सत्र पूरा करें' : '4. Complete the full session for your practice'}</Text>
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
                        <Ionicons name={isAudioEnabled ? "volume-high" : "volume-mute"} size={14} color={isAudioEnabled ? "#FF6B00" : "#555"} />
                        <Text style={[styles.jaapTopChipText, isAudioEnabled && { color: '#FF6B00' }]} numberOfLines={1}>
                            {isKaraokeMode 
                                ? (t('language') === 'hi' ? 'हनुमान चालीसा' : 'Hanuman Chalisa') 
                                : ((t('language') === 'hi' ? (chosenMusic as any)?.hindiName : chosenMusic?.name) || (t('language') === 'hi' ? 'संगीत नहीं' : 'No Music'))}
                            {isAudioEnabled ? '' : ` (${t('language') === 'hi' ? 'बंद' : 'Muted'})`}
                        </Text>
                        {isAudioEnabled && <View style={[styles.jaapTopChipIndicator, { backgroundColor: '#FF6B00' }]} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.jaapTopChip} onPress={handleGoBack}>
                        <Ionicons name="stopwatch-outline" size={14} color="#555" />
                        <Text style={styles.jaapTopChipText}>{t('language') === 'hi' ? 'जाप समाप्त करें' : 'End Focus'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.jaapCenter}>
                    <View style={styles.focusHeader}>
                        <Text style={styles.focusTitle}>{selectedNaam.name}</Text>
                        {isKaraokeMode ? (
                            <Text style={styles.focusSubtitle}>
                                {formatDuration(karaokeDuration)} • Auto-synced
                            </Text>
                        ) : (
                            <Text style={styles.focusSubtitle}>
                                {formatTimeIST(new Date())} → {formatTimeIST(new Date(Date.now() + timeLeft * 1000))}
                            </Text>
                        )}
                    </View>

                    <View style={styles.focusCircleRoot}>
                        <View style={styles.focusCircleBackground} />
                        <View style={styles.focusCircleInner}>
                            <View style={[styles.focusDeityIconContainer, { backgroundColor: '#FFFFFF' }]}>
                                <Ionicons name={selectedNaam.icon as any} size={72} color="#F59E0B" />
                            </View>
                        </View>
                        <View style={styles.progressContainer}>
                            <LinearGradient
                                colors={['#F59E0B', '#EF4444']}
                                style={[styles.progressRingGradient, {
                                    transform: [{ rotate: '-90deg' }],
                                    opacity: 0.8
                                }]}
                            />
                            <View style={styles.ringMask} />
                        </View>
                    </View>

                    <Text style={styles.focusTimerText}>{formatTime(timeLeft)}</Text>

                    <View style={styles.focusControlsRow}>
                        <TouchableOpacity
                            style={styles.materialFab}
                            onPress={() => {
                                if (!chosenMusic && !isKaraokeMode) {
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
                    {isKaraokeMode ? (
                        <KaraokeSyncEngine
                            data={HANUMAN_CHALISA_KARAOKE}
                            currentTime={karaokeCurrentTime}
                            isPlaying={isRunning}
                            onSectionChange={(section) => setKaraokeSection(section)}
                            style={styles.karaokeContainer}
                        />
                    ) : (
                        <>
                            <Text style={styles.footerMantraHindi}>{selectedNaam.hindi}</Text>
                            <Text style={styles.footerMantraEnglish}>{selectedNaam.mantra}</Text>
                        </>
                    )}
                </View>

                {showConfirmDialog && (
                    <View style={styles.dialogOverlay}>
                        <View style={[styles.dialogBox, { borderColor: '#D4A017' }]}>
                            <Text style={styles.dialogOm}>🙏</Text>
                            <Text style={styles.dialogTitle}>{t('language') === 'hi' ? 'जाप रोकें?' : 'Stop Jaap?'}</Text>
                            <View style={styles.dialogButtons}>
                                <TouchableOpacity style={[styles.dialogCancel, { borderColor: '#D4A017' }]} onPress={cancelStop}>
                                    <Text style={[styles.dialogCancelText, { color: '#D4A017' }]}>{t('language') === 'hi' ? 'जारी रखें' : 'Continue'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dialogConfirm, { backgroundColor: '#B22222' }]} onPress={confirmStop}>
                                    <Text style={styles.dialogConfirmText}>{t('language') === 'hi' ? 'रोकें' : 'Stop'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {showMusicDialog && (
                    <View style={styles.dialogOverlay}>
                        <View style={[styles.dialogBox, { borderColor: '#D4A017' }]}>
                            <Text style={styles.dialogOm}>🎵</Text>
                            <Text style={styles.dialogTitle}>{t('language') === 'hi' ? 'संगीत चुनें' : 'Choose Music'}</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {MUSIC_OPTIONS.map((music) => (
                                    <TouchableOpacity key={music.id} style={[styles.musicOptionCard, { borderColor: '#D4A017' }]} onPress={() => beginJaap(music)}>
                                        <View style={[styles.musicOptionIcon, { backgroundColor: '#FFF9F2' }]}><Ionicons name={music.icon as any} size={24} color="#D4A017" /></View>
                                        <Text style={[styles.musicOptionName, { color: '#D4A017' }]}>{t('language') === 'hi' ? (music as any).hindiName || music.name : music.name}</Text>
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
    karaokeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5EB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    karaokeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF6B00',
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
        backgroundColor: '#14B8A6',
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
        minHeight: 120,
    },
    karaokeContainer: {
        width: '100%',
        minHeight: 120,
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
    musicOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    musicOptionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    musicOptionName: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default EkantJaapPage;
