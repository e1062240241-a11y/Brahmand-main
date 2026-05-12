import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Linking,
  Platform,
  PanResponder,
  Image,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useHelpRequestStore } from '../store/helpRequestStore';
import { useAuthStore } from '../store/authStore';
import { 
  getWisdom, 
  getGitaShloka,
  createSOSAlert, 
  getMySOSAlert, 
  resolveSOSAlert,
  getActiveSOSAlerts,
  getMyActiveCommunityRequests,
  resolveCommunityRequest,
  updateCurrentLocation,
  respondToSOS,
  getPanchang,
  getNextFestival
} from '../services/api';
import * as Location from 'expo-location';
import LocationService from '../services/location';
import { socketService } from '../services/socket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Chapter and verses count for Bhagavad Gita (18 chapters)
const CHAPTER_VERSES = [47, 72, 43, 42, 42, 29, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 20];

// Get day of year (1-366)
const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// Convert shloka index (0-699) to chapter and verse
const getChapterVerse = (index: number): { chapter: number; verse: number } => {
  let cumulative = 0;
  for (let ch = 0; ch < CHAPTER_VERSES.length; ch++) {
    if (index < cumulative + CHAPTER_VERSES[ch]) {
      return { chapter: ch + 1, verse: index - cumulative + 1 };
    }
    cumulative += CHAPTER_VERSES[ch];
  }
  return { chapter: 1, verse: 1 }; // Fallback
};

// Get today's shloka index (same for all users)
const getTodaysShlokaIndex = (): number => {
  const dayOfYear = getDayOfYear();
  return (dayOfYear - 1) % 700; // 0-699
};

// Storage key for caching
const SHLOKA_CACHE_KEY = 'daily_gita_shloka';

// Load cached shloka or fetch new one
const loadDailyShloka = async (): Promise<{
  chapter: number;
  verse: number;
  slok: string;
  translation: string;
} | null> => {
  try {
    const today = new Date().toDateString();
    const cached = await AsyncStorage.getItem(SHLOKA_CACHE_KEY);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === today && parsed.slok) {
        return parsed;
      }
    }
    
    // Fetch new shloka
    const shlokaIndex = getTodaysShlokaIndex();
    const { chapter, verse } = getChapterVerse(shlokaIndex);
    
    const data = await getGitaShloka(chapter, verse);
    
    if (data && data.slok) {
      const translations: string[] = [];
      if (data.siva?.ec) translations.push(data.siva.ec);
      if (data.siva?.et) translations.push(data.siva.et);
      if (data.adi?.et) translations.push(data.adi.et);
      if (data.gambir?.et) translations.push(data.gambir.et);
      if (data.purohit?.et) translations.push(data.purohit.et);
      
      let translation = translations.length > 0 
        ? translations.reduce((a, b) => a.length > b.length ? a : b)
        : 'Translation not available';
      
      translation = translation
        .replace(/[\u0000-\u001F\u007F-\uFFFF]/g, '')
        .replace(/\?+/g, '?')
        .replace(/\? /g, ' ')
        .replace(/ \?/g, ' ')
        .replace(/^\?+/, '')
        .replace(/\?$/, '')
        .trim();
      
      const shlokaData = {
        chapter: data.chapter,
        verse: data.verse,
        slok: data.slok,
        translation: translation,
        date: today
      };
      
      await AsyncStorage.setItem(SHLOKA_CACHE_KEY, JSON.stringify(shlokaData));
      return shlokaData;
    }
    return null;
  } catch (error) {
    console.error('Error loading daily shloka:', error);
    try {
      const cached = await AsyncStorage.getItem(SHLOKA_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  }
};

const getPanchangData = async () => {
  try {
    const response = await getPanchang();
    return response.data;
  } catch (error) {
    return null;
  }
};

const getFestivalsData = async () => {
  try {
    const response = await getNextFestival();
    return response.data;
  } catch (error) {
    return null;
  }
};

export const FloatingUtilityButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isChatPage = typeof pathname === 'string' && (pathname.startsWith('/chat/') || pathname.startsWith('/dm/'));
  const [modalVisible, setModalVisible] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSOSLoading] = useState(false);
  const { activeRequest, fetchActiveRequest, resolveRequest, hasActiveRequest } = useHelpRequestStore();
  
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [nearbySOSCount, setNearbySOSCount] = useState(0);
  const [nearbySOSAlerts, setNearbySOSAlerts] = useState<any[]>([]);
  const [respondedSOSIds, setRespondedSOSIds] = useState<Set<string>>(new Set());
  const [sosStage, setSosStage] = useState<'idle' | 'hold' | 'type' | 'micro' | 'countdown'>('idle');
  const [sosType, setSosType] = useState<string>('medical');
  const [microLocation, setMicroLocation] = useState('');
  const [microLocationLoading, setMicroLocationLoading] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [fetchedCoordinates, setFetchedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [countdownValue, setCountdownValue] = useState(8);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdConfirmedRef = useRef(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sosRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [myCommunityRequests, setMyCommunityRequests] = useState<any[]>([]);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [communityRequestLoading, setCommunityRequestLoading] = useState(false);
  const [wisdom, setWisdom] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [nextFestival, setNextFestival] = useState<any>(null);
  const [gitaDropdownOpen, setGitaDropdownOpen] = useState(false);
  
  const wheelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(wheelAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    } else {
      wheelAnim.setValue(0);
    }
  }, [modalVisible]);

  const rayPulseAnim = useRef(new Animated.Value(0)).current;
  const sosGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      // Loop for "Live" Chamatkari Rays
      Animated.loop(
        Animated.sequence([
          Animated.timing(rayPulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(rayPulseAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Loop for "Live" SOS Glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(sosGlowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(sosGlowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      rayPulseAnim.setValue(0);
      sosGlowAnim.setValue(0);
    }
  }, [modalVisible]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  const handleMainButtonPress = () => {
    resetSOSFlow();
    setModalVisible(true);
    loadInitialUtilityData();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true;
        }
        const currentX = (pan.x as any)._offset + gestureState.dx;
        const currentY = (pan.y as any)._offset + gestureState.dy;
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        let nextX = gestureState.dx;
        let nextY = gestureState.dy;
        if (currentX > 10) nextX = 10 - (pan.x as any)._offset;
        if (currentX < -(screenWidth - 72)) nextX = -(screenWidth - 72) - (pan.x as any)._offset;
        if (currentY > 80) nextY = 80 - (pan.y as any)._offset;
        if (currentY < -(screenHeight - 150)) nextY = -(screenHeight - 150) - (pan.y as any)._offset;
        pan.x.setValue(nextX);
        pan.y.setValue(nextY);
      },
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        if (!isDragging.current) {
          handleMainButtonPress();
        }
        isDragging.current = false;
      }
    })
  ).current;

  useEffect(() => {
    if (nearbySOSCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.ease, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [nearbySOSCount]);

  const resetSOSFlow = () => {
    setSosStage('idle');
    setSosType('medical');
    setMicroLocation('');
    setMicroLocationLoading(false);
    setLocationFetched(false);
    setFetchedCoordinates(null);
    setHoldProgress(0);
    setCountdownValue(8);
    holdConfirmedRef.current = false;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  const openSOSLocation = async () => {
    if (!activeSOS?.latitude || !activeSOS?.longitude) {
      Alert.alert('Location unavailable', 'Cannot open map without coordinates.');
      return;
    }
    try {
      await Linking.openURL(`https://maps.google.com/?q=${activeSOS.latitude},${activeSOS.longitude}`);
    } catch {
      Alert.alert('Error', 'Could not open maps.');
    }
  };

  const openNearbySOSLocation = async (sos: any) => {
    const lat = sos.latitude;
    const lng = sos.longitude;
    if (lat == null || lng == null) {
      Alert.alert('Location unavailable', 'Cannot open map without coordinates.');
      return;
    }
    try {
      await Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    } catch {
      Alert.alert('Error', 'Could not open maps.');
    }
  };

  const handleResolveCommunityRequest = async (requestId: string) => {
    setResolvingRequestId(requestId);
    setCommunityRequestLoading(true);
    try {
      await resolveCommunityRequest(requestId);
      setMyCommunityRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: 'fulfilled' } : req)
      );
      Alert.alert('Success', 'Request marked as fulfilled!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to resolve request');
    } finally {
      setCommunityRequestLoading(false);
      setResolvingRequestId(null);
    }
  };

  const getCommunityRequestIcon = (type: string): string => {
    switch (type) {
      case 'blood': return 'water';
      case 'medical': return 'medkit';
      case 'petition': return 'document-text';
      case 'financial': return 'cash';
      default: return 'hand-left';
    }
  };

  const getCommunityRequestColor = (type: string): string => {
    switch (type) {
      case 'blood': return '#E53935';
      case 'medical': return '#1976D2';
      case 'petition': return '#7C3AED';
      case 'financial': return '#43A047';
      default: return COLORS.primary;
    }
  };

  useEffect(() => {
    return () => {
      resetSOSFlow();
    };
  }, []);

  const loadUtilityData = async () => {
    try {
      const [wisdomRes, panRes, festRes, gitaRes] = await Promise.all([
        getWisdom().catch(() => null),
        getPanchangData(),
        getFestivalsData(),
        loadDailyShloka()
      ]);
      setWisdom({ ...(wisdomRes?.data || {}), gitaShloka: gitaRes });
      setPanchang(panRes);
      setNextFestival(festRes);
    } catch (error) {}
  };

  const checkSOSStatus = useCallback(async () => {
    try {
      const mySOSRes = await getMySOSAlert();
      setActiveSOS(mySOSRes.data);

      const ok = await LocationService.ensureForegroundPermission();
      if (ok) {
        const location = await LocationService.getCurrentPosition({});
        await updateCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        const nearbyRes = await getActiveSOSAlerts({ lat: location.coords.latitude, lng: location.coords.longitude, radius: 1 });
        const otherSOS = (nearbyRes.data || []).filter((s: any) => s.id !== mySOSRes.data?.id);
        setNearbySOSCount(otherSOS.length);
        setNearbySOSAlerts(otherSOS);
      }
    } catch (error) {}
  }, []);

  const loadInitialUtilityData = async () => {
    fetchMyCommunityRequests();
    await Promise.allSettled([
      fetchActiveRequest(),
      hasLoadedData ? Promise.resolve() : loadUtilityData(),
      checkSOSStatus(),
    ]);
    if (!hasLoadedData) setHasLoadedData(true);
  };

  const closeUtilityModal = () => {
    setModalVisible(false);
    resetSOSFlow();
  };

  useEffect(() => {
    checkSOSStatus();
    sosRefreshTimerRef.current = setInterval(checkSOSStatus, 60_000);
    return () => {
      if (sosRefreshTimerRef.current) clearInterval(sosRefreshTimerRef.current);
    };
  }, [checkSOSStatus]);

  const fetchMyCommunityRequests = async () => {
    try {
      const response = await getMyActiveCommunityRequests();
      let requests = response.data || [];
      if (user?.id) {
        requests = requests.filter((req: any) => {
          const isMyRequest = req.user_id === user.id || req.creator_id === user.id || req.created_by === user.id;
          return isMyRequest && req.status !== 'fulfilled';
        });
      }
      setMyCommunityRequests(requests);
    } catch (error) {}
  };

  const startSOSFlow = () => {
    resetSOSFlow();
    setSosStage('hold');
  };

  const fetchCurrentMicroLocation = async () => {
    setMicroLocationLoading(true);
    try {
      const ok = await LocationService.ensureForegroundPermission();
      if (!ok) return;
      const location = await LocationService.getCurrentPosition({ enableHighAccuracy: true });
      if (location?.coords) {
        setLocationFetched(true);
        setFetchedCoordinates({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      }
    } catch (error) {
    } finally {
      setMicroLocationLoading(false);
    }
  };

  const handleSOSHoldStart = () => {
    holdConfirmedRef.current = false;
    const start = Date.now();
    holdTimerRef.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / 3000);
      setHoldProgress(progress);
      if (progress >= 1) handleSOSHoldComplete();
    }, 50);
  };

  const handleSOSHoldComplete = () => {
    holdConfirmedRef.current = true;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setSosStage('type');
  };

  const handleSOSHoldEnd = () => {
    if (holdConfirmedRef.current) return;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setHoldProgress(0);
  };

  const handleStartSOSCountdown = () => setSosStage('countdown');
  const handleCancelSOSCountdown = () => resetSOSFlow();

  const RADIUS_LEVELS = [5, 15, 50];

  const handleCreateSOS = async (level = 0) => {
    setSOSLoading(true);
    try {
      let latitude: number, longitude: number;
      if (fetchedCoordinates) {
        latitude = fetchedCoordinates.latitude;
        longitude = fetchedCoordinates.longitude;
      } else {
        const location = await LocationService.getCurrentPosition({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      const response = await createSOSAlert({
        latitude,
        longitude,
        emergency_type: sosType,
        micro_location: microLocation,
        radius: RADIUS_LEVELS[level],
      });
      setActiveSOS(response.data);
      setSosRadiusLevel(level);
      closeUtilityModal();
      Alert.alert('SOS Alert Sent', 'Stay safe!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send SOS');
      resetSOSFlow();
    } finally {
      setSOSLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSOS) {
      if (sosExpandTimerRef.current) {
        clearInterval(sosExpandTimerRef.current);
        sosExpandTimerRef.current = null;
      }
      return;
    }

    sosExpandTimerRef.current = setInterval(async () => {
      try {
        const res = await getMySOSAlert();
        const current = res.data;
        if (!current || (current.responders?.length || 0) > 0) {
          if (sosExpandTimerRef.current) {
            clearInterval(sosExpandTimerRef.current);
            sosExpandTimerRef.current = null;
          }
          return;
        }

        const nextLevel = sosRadiusLevel + 1;
        if (nextLevel >= RADIUS_LEVELS.length) {
          if (sosExpandTimerRef.current) {
            clearInterval(sosExpandTimerRef.current);
            sosExpandTimerRef.current = null;
          }
          return;
        }

        await resolveMyActiveSOS('cancelled');
        const loc = await LocationService.getCurrentPosition({});
        const response = await createSOSAlert({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          emergency_type: current.emergency_type || 'other',
          micro_location: current.micro_location || '',
          radius: RADIUS_LEVELS[nextLevel],
        });
        setActiveSOS(response.data);
        setSosRadiusLevel(nextLevel);
      } catch {}
    }, 600_000);

    return () => {
      if (sosExpandTimerRef.current) {
        clearInterval(sosExpandTimerRef.current);
        sosExpandTimerRef.current = null;
      }
    };
  }, [activeSOS, sosRadiusLevel]);

  useEffect(() => {
    if (sosStage !== 'countdown') return;
    setCountdownValue(8);
    countdownTimerRef.current = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          handleCreateSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [sosStage]);

  const handleResolveActiveSOS = async (status: 'resolved' | 'cancelled') => {
    if (!activeSOS) return;
    if (status === 'cancelled') {
       try {
         setSOSLoading(true);
         await resolveMyActiveSOS('cancelled');
         setActiveSOS(null);
       } catch (error: any) {
         Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel SOS');
       } finally { setSOSLoading(false); }
       return;
    }

    Alert.alert(
      'Help Received',
      'Confirm this action?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: async () => {
          setSOSLoading(true);
          try {
            await resolveMyActiveSOS('resolved');
            setActiveSOS(null);
          } catch (error) {} finally { setSOSLoading(false); }
        }}
      ]
    );
  };

  const openPanchangWithLocation = async () => {
    setModalVisible(false);
    try {
      const ok = await LocationService.ensureForegroundPermission();
      if (ok) {
        const loc = await LocationService.getCurrentPosition({});
        router.push({ pathname: '/panchang', params: { lat: String(loc.coords.latitude), lng: String(loc.coords.longitude) } });
        return;
      }
    } catch {}
    router.push({ pathname: '/panchang', params: { needsLocation: '1' } });
  };

  const SOS_TYPES = [
    { label: 'Medical', value: 'medical' },
    { label: 'Accident', value: 'accident' },
    { label: 'Safety', value: 'safety' },
    { label: 'Other', value: 'other' }
  ];

  return (
    <>
      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.floatingButtonContainer,
          isChatPage && { bottom: 150 },
          { transform: [...pan.getTranslateTransform(), { scale: nearbySOSCount > 0 ? pulseAnim : 1 }] }
        ]}
      >
        <View style={[styles.floatingButton, nearbySOSCount > 0 && styles.floatingButtonEmergency, activeSOS && styles.floatingButtonActiveSOS]}>
          <View style={[styles.glassBackground, nearbySOSCount > 0 && styles.glassBackgroundEmergency, activeSOS && styles.glassBackgroundActiveSOS]}>
            {activeSOS ? <Ionicons name="alert-circle" size={24} color="#FFFFFF" /> : nearbySOSCount > 0 ? <Ionicons name="alert" size={24} color="#FFFFFF" /> : <View style={styles.redDot} />}
          </View>
        </View>
      </Animated.View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeUtilityModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.overlayBackground} activeOpacity={1} onPress={closeUtilityModal} />
          <KeyboardAvoidingView style={styles.modalContentWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={styles.closeButton} onPress={closeUtilityModal}>
              <Ionicons name="close-circle" size={42} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <ScrollView 
              style={{ width: '100%' }}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 100, paddingTop: 60 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Active SOS Warning Bar */}
              {activeSOS && (
                <View style={styles.activeSOSBar}>
                  <Ionicons name="alert-circle" size={24} color="#FFF" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activeSOSTitle}>SOS ALERT ACTIVE</Text>
                    <Text style={styles.activeSOSSubtitle}>Help is being sought in {activeSOS.area}</Text>
                  </View>
                  <TouchableOpacity style={styles.sosMapBtn} onPress={openSOSLocation}>
                    <Ionicons name="navigate" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sosResolveBtn} onPress={() => handleResolveActiveSOS('resolved')}>
                    <Text style={styles.sosResolveText}>I'M SAFE</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Gita Shloka Card */}
              <View style={styles.gitaCardCompact}>
                <TouchableOpacity 
                  style={styles.gitaHeaderRow}
                  onPress={() => setGitaDropdownOpen(!gitaDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <View style={styles.gitaIconBgSmall}>
                    <Ionicons name="book" size={16} color="#FF8F00" />
                  </View>
                  <View style={styles.gitaInfo}>
                    <Text style={styles.gitaTitleCompact}>Gita {wisdom?.gitaShloka ? `Ch ${wisdom.gitaShloka.chapter}:${wisdom.gitaShloka.verse}` : 'Daily'}</Text>
                    <Text style={styles.gitaSanskritCompact} numberOfLines={1}>
                      {wisdom?.gitaShloka?.slok || 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन。'}
                    </Text>
                  </View>
                  <Ionicons name={gitaDropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#FF8F00" />
                </TouchableOpacity>
                {gitaDropdownOpen && (
                  <View style={styles.gitaDropdownContent}>
                    <Text style={styles.gitaTranslation}>
                      {wisdom?.gitaShloka?.translation || 'Perform your duty without attachment to the results.'}
                    </Text>
                  </View>
                )}
              </View>

              {/* My Community Requests */}
              {myCommunityRequests.length > 0 && (
                <View style={styles.communityRequestsSection}>
                  <Text style={styles.sectionTitle}>My Requests</Text>
                  {myCommunityRequests.map((request) => (
                    <View key={request.id} style={styles.communityRequestCard}>
                      <View style={styles.communityRequestHeader}>
                        <View style={[styles.requestTypeBadge, { backgroundColor: `${getCommunityRequestColor(request.request_type)}20` }]}>
                          <Ionicons name={getCommunityRequestIcon(request.request_type) as any} size={16} color={getCommunityRequestColor(request.request_type)} />
                        </View>
                        <Text style={styles.communityRequestType}>{request.request_type?.toUpperCase()}</Text>
                        <TouchableOpacity style={styles.resolveButton} onPress={() => handleResolveCommunityRequest(request.id)}>
                          <Ionicons name="checkmark-circle" size={16} color="#43A047" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.communityRequestTitle}>{request.title}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Nearby SOS Alerts */}
              {nearbySOSAlerts.length > 0 && (
                <View style={styles.communityRequestsSection}>
                  <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Nearby Emergencies ({nearbySOSAlerts.length})</Text>
                  {nearbySOSAlerts.map((sos) => (
                    <View key={sos.id} style={[styles.communityRequestCard, { borderColor: '#FFCDD2', borderWidth: 1 }]}>
                      <View style={styles.communityRequestHeader}>
                        <View style={[styles.requestTypeBadge, { backgroundColor: '#FFEBEE' }]}>
                          <Ionicons name="alert" size={16} color="#FF3B30" />
                        </View>
                        <Text style={styles.communityRequestType}>{sos.emergency_type?.toUpperCase()}</Text>
                        <Text style={{ fontSize: 10, color: '#FF3B30', fontWeight: '800' }}>{sos.distance?.toFixed(1)}km</Text>
                      </View>
                      <Text style={styles.communityRequestTitle}>{sos.micro_location || 'Emergency near you'}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                         <TouchableOpacity style={styles.sosActionBtn} onPress={() => openNearbySOSLocation(sos)}>
                           <Text style={styles.sosActionBtnText}>MAP</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={[styles.sosActionBtn, { backgroundColor: '#FF3B30' }]} onPress={() => sos.phone_number && Linking.openURL(`tel:${sos.phone_number}`)}>
                           <Text style={styles.sosActionBtnText}>CALL</Text>
                         </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.modalContent}>
                {sosStage === 'idle' ? (
                  <Animated.View style={[styles.circularMenuContainer, { opacity: wheelAnim, transform: [{ scale: wheelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
                    <View style={styles.menuGlow} />
                    <View style={styles.outerRing} />
                    
                    {/* Segment Dividers */}
                    <View style={[styles.segmentLine, { transform: [{ rotate: '0deg' }] }]} />
                    <View style={[styles.segmentLine, { transform: [{ rotate: '60deg' }] }]} />
                    <View style={[styles.segmentLine, { transform: [{ rotate: '120deg' }] }]} />
                    
                    <View style={styles.wheelWrapper}>
                      {/* Brahmand Library (Top-Left) */}
                      <TouchableOpacity 
                        style={[styles.segmentButton, { top: 65, left: 150 }]}
                        onPress={() => { setModalVisible(false); router.push('/library'); }}
                      >
                        <View style={styles.segmentCard}>
                          <View style={[styles.segmentIconBg, { backgroundColor: '#E3F2FD' }]}><Ionicons name="book" size={30} color="#1976D2" /></View>
                          <Text style={styles.segmentTitle}>Brahmand Library</Text>
                          <Text style={styles.segmentSubtitle}>Knowledge & Wisdom</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Brahmand Passport (Top-Right) */}
                      <TouchableOpacity 
                        style={[styles.segmentButton, { top: 65, right: 150 }]}
                        onPress={() => { setModalVisible(false); router.push('/passport'); }}
                      >
                        <View style={styles.segmentCard}>
                          <View style={[styles.segmentIconBg, { backgroundColor: '#FFF9C4' }]}><Ionicons name="airplane" size={30} color="#FBC02D" /></View>
                          <Text style={styles.segmentTitle}>Brahmand Passport</Text>
                          <Text style={styles.segmentSubtitle}>Spiritual Journey</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Kundli (Mid-Right) */}
                      <TouchableOpacity 
                        style={[styles.segmentButton, { top: 290, right: 20 }]}
                        onPress={() => { setModalVisible(false); router.push('/astrology?mode=kundli'); }}
                      >
                        <View style={styles.segmentCard}>
                          <View style={[styles.segmentIconBg, { backgroundColor: '#F3E5F5' }]}><Ionicons name="planet" size={30} color="#7B1FA2" /></View>
                          <Text style={styles.segmentTitle}>Kundli</Text>
                          <Text style={styles.segmentSubtitle}>Planet View</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Emergency SOS (Bottom-Right) */}
                      <TouchableOpacity 
                        style={[styles.segmentButton, { bottom: 65, right: 150 }]} 
                        onPress={() => activeSOS ? handleResolveActiveSOS('resolved') : startSOSFlow()}
                        onLongPress={() => !activeSOS && handleStartSOSCountdown()}
                      >
                        <Animated.View style={{
                          position: 'absolute',
                          width: 160,
                          height: 160,
                          borderRadius: 80,
                          backgroundColor: 'rgba(255, 23, 68, 0.2)',
                          opacity: sosGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
                          transform: [{ scale: sosGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
                          zIndex: -1,
                        }} />
                        <View style={[styles.sosCircularButton, activeSOS && styles.sosCircularButtonActive]}>
                          <View style={styles.sosButtonInner}><Text style={styles.sosButtonTextLarge}>SOS</Text></View>
                        </View>
                        <Text style={styles.segmentTitle}>Emergency SOS</Text>
                        <Text style={styles.segmentSubtitle}>Double Tap for Help</Text>
                      </TouchableOpacity>

                      {/* Horoscope (Bottom-Left) */}
                      <TouchableOpacity 
                        style={[styles.segmentButton, { bottom: 65, left: 150 }]} 
                        onPress={() => { setModalVisible(false); router.push('/horoscope'); }}
                      >
                        <View style={styles.segmentCard}>
                          <View style={[styles.segmentIconBg, { backgroundColor: '#E1F5FE' }]}><Ionicons name="star" size={30} color="#0288D1" /></View>
                          <Text style={styles.segmentTitle}>Horoscope</Text>
                          <Text style={styles.segmentSubtitle}>Daily Predictions</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Panchang (Mid-Left) */}
                      <TouchableOpacity 
                        style={[styles.segmentButton, { top: 290, left: 20 }]} 
                        onPress={openPanchangWithLocation}
                      >
                        <View style={styles.segmentCard}>
                          <View style={[styles.segmentIconBg, { backgroundColor: '#FFEBEE' }]}><Ionicons name="calendar" size={30} color="#C62828" /></View>
                          <Text style={styles.segmentTitle}>Panchang</Text>
                          <Text style={styles.segmentSubtitle}>Daily Hindu Calendar</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.centralAvatarContainer}>
                      <View style={[styles.avatarLightRay, { width: 300, height: 300, opacity: 0.3 }]} />
                      <View style={[styles.avatarLightRay, { width: 260, height: 260, opacity: 0.5 }]} />
                      <View style={[styles.avatarLightRay, { width: 220, height: 220, opacity: 0.8 }]} />
                      
                      <View style={styles.centralAvatarBorder}>
                        <Image source={require('../../assets/images/krishna_guru.png')} style={styles.centralAvatar} />
                      </View>
                      <View style={styles.centralTitleContainer}>
                        <Text style={styles.centralTitleLogo}>my Krishna</Text>
                        <View style={styles.centralTitleSubRow}>
                          <View style={styles.titleLine} /><Text style={styles.centralTitleSub}>AI Guru</Text><View style={styles.titleLine} />
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity style={[styles.arrowButton, styles.arrowUp]}>
                      <Ionicons name="chevron-up" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.arrowButton, styles.arrowDown]}>
                      <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Animated.View>
                ) : (
                  <View style={styles.sosStepsContainer}>
                    {sosStage === 'hold' && (
                      <View style={styles.holdContainer}>
                        <Text style={styles.sosStepTitle}>Hold to Confirm</Text>
                        <TouchableOpacity style={styles.sosHoldButton} onPressIn={handleSOSHoldStart} onPressOut={handleSOSHoldEnd} onLongPress={handleSOSHoldComplete} delayLongPress={3000}>
                          <Text style={styles.sosHoldButtonText}>HOLD TO CONFIRM</Text>
                          <View style={styles.sosHoldProgressBar}><View style={[styles.sosHoldProgressFill, { width: `${Math.round(holdProgress * 100)}%`}]} /></View>
                        </TouchableOpacity>
                      </View>
                    )}
                    {sosStage === 'type' && (
                      <View style={styles.typeContainer}>
                        <Text style={styles.sosStepTitle}>Emergency Type</Text>
                        <View style={styles.sosTypeGrid}>
                          {SOS_TYPES.map(t => (
                            <TouchableOpacity key={t.value} style={[styles.sosTypeButton, sosType === t.value && styles.sosTypeButtonSelected]} onPress={() => setSosType(t.value)}>
                              <Text style={[styles.sosTypeButtonText, sosType === t.value && styles.sosTypeButtonSelected && { color: '#FFFFFF' }]}>{t.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity style={styles.sosButton} onPress={() => setSosStage('micro')}><Text style={styles.sosButtonMainText}>CONTINUE</Text></TouchableOpacity>
                      </View>
                    )}
                    {sosStage === 'micro' && (
                      <View style={styles.microContainer}>
                        <Text style={styles.sosStepTitle}>Add Details</Text>
                        <TextInput style={styles.sosInput} placeholder="Floor/Landmark" value={microLocation} onChangeText={setMicroLocation} />
                        <TouchableOpacity style={styles.sosButton} onPress={() => handleCreateSOS(0)}><Text style={styles.sosButtonMainText}>SEND ALERT</Text></TouchableOpacity>
                      </View>
                    )}
                    {sosStage === 'countdown' && (
                      <View style={styles.countdownContainer}>
                        <Text style={styles.sosCountdownText}>{countdownValue}</Text>
                        <TouchableOpacity style={[styles.sosButton, styles.sosCancelCountdownButton]} onPress={handleCancelSOSCountdown}><Text style={styles.sosButtonMainText}>CANCEL</Text></TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: { position: 'absolute', bottom: 90, right: 16, zIndex: 1000 },
  floatingButton: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  floatingButtonEmergency: { shadowColor: '#E53935', shadowOpacity: 0.4 },
  floatingButtonActiveSOS: { shadowColor: '#E53935', shadowOpacity: 0.6 },
  glassBackground: { width: '100%', height: '100%', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderRadius: 32 },
  glassBackgroundEmergency: { backgroundColor: '#FF3B30' },
  glassBackgroundActiveSOS: { backgroundColor: '#E53935' },
  redDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#E53935' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  overlayBackground: { ...StyleSheet.absoluteFillObject },
  modalContentWrapper: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  circularMenuContainer: { 
    width: 700, 
    height: 700, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(255, 243, 224, 0.15)', // Light orange tint
    borderRadius: 350,
  },
  menuGlow: { 
    position: 'absolute', 
    width: 750, 
    height: 750, 
    borderRadius: 375, 
    backgroundColor: 'rgba(255, 145, 0, 0.05)',
  },
  outerRing: { 
    position: 'absolute', 
    width: 640, 
    height: 640, 
    borderRadius: 320, 
    borderWidth: 2, 
    borderColor: 'rgba(255, 152, 0, 0.2)',
    backgroundColor: 'rgba(255, 224, 178, 0.1)', // Inner orange shade
  },
  wheelWrapper: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  segmentLine: {
    position: 'absolute',
    width: 2,
    height: 320,
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    left: 349,
    top: 30,
    transform: [{ rotate: '0deg' }],
  },
  segmentButton: { 
    position: 'absolute', 
    width: 140, 
    alignItems: 'center',
    zIndex: 10,
  },
  segmentCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 12, 
    width: 120, 
    height: 120, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    elevation: 8 
  },
  segmentIconBg: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  segmentTitle: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#37474F', 
    textAlign: 'center' 
  },
  segmentSubtitle: { 
    fontSize: 9, 
    color: '#90A4AE', 
    textAlign: 'center', 
    marginTop: 2 
  },
  sosCircularButton: { 
    width: 115, 
    height: 115, 
    borderRadius: 57.5, 
    backgroundColor: '#FF3B30', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 10, 
    borderColor: 'rgba(255, 59, 48, 0.1)', 
    marginBottom: 8, 
    shadowColor: '#FF1744', // Intense red glow
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 25, 
    elevation: 15 
  },
  sosCircularButtonActive: { 
    backgroundColor: '#D32F2F', 
    borderColor: 'rgba(211, 47, 47, 0.3)' 
  },
  sosButtonInner: { 
    width: 86, 
    height: 86, 
    borderRadius: 43, 
    backgroundColor: '#FF3B30', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  sosButtonTextLarge: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#FFFFFF' 
  },
  centralAvatarContainer: { 
    width: 320, // Expanded for rays
    height: 320, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  avatarLightRay: {
    position: 'absolute',
    borderRadius: 160,
    backgroundColor: 'rgba(255, 235, 59, 0.2)', // Yellow chamatkari rays
    shadowColor: '#FDD835',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  centralAvatarBorder: { 
    width: 190, 
    height: 190, 
    borderRadius: 95, 
    borderWidth: 4, 
    borderColor: '#FFD54F', // Golden border for chamatkari effect
    padding: 3, 
    backgroundColor: '#FFFFFF', 
    overflow: 'hidden',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    zIndex: 10,
  },
  centralAvatar: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 95 
  },
  centralTitleContainer: { 
    position: 'absolute', 
    bottom: 30, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 22, 
    paddingVertical: 12, 
    borderRadius: 22, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#FFD54F', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 4,
    zIndex: 20,
  },
  centralTitleLogo: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#FF8F00', // Brighter orange
    letterSpacing: 0.5,
  },
  centralTitleSubRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: -2 
  },
  centralTitleSub: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#B0BEC5', 
    marginHorizontal: 10 
  },
  titleLine: { 
    width: 18, 
    height: 1.5, 
    backgroundColor: '#FFE0B2' 
  },
  arrowButton: {
    position: 'absolute',
    width: 52,
    height: 34,
    backgroundColor: '#FB8C00',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  arrowUp: { 
    top: 30,
  },
  arrowDown: { 
    bottom: 30,
  },
  closeButton: { 
    position: 'absolute', 
    top: 50, 
    right: 25, 
    zIndex: 100 
  },
  sosStepsContainer: { 
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center',
  },
  sosStepTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#1A1A1A', 
    marginBottom: 20 
  },
  sosButton: { 
    backgroundColor: '#FF3B30', 
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginBottom: 12,
  },
  sosButtonMainText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '800' 
  },
  sosHoldButton: { 
    width: 220, 
    height: 220, 
    borderRadius: 110, 
    backgroundColor: '#FF3B30', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  sosHoldButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '900', 
    fontSize: 18,
    textAlign: 'center', 
    padding: 10 
  },
  sosHoldProgressBar: { 
    width: '80%', 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    borderRadius: 4, 
    marginTop: 15 
  },
  sosHoldProgressFill: { 
    height: '100%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 4 
  },
  sosTypeGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 30, 
    justifyContent: 'center' 
  },
  sosTypeButton: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 25, 
    borderWidth: 1.5, 
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  sosTypeButtonSelected: { 
    backgroundColor: '#FF3B30', 
    borderColor: '#FF3B30' 
  },
  sosTypeButtonText: { 
    color: '#616161',
    fontWeight: '700',
  },
  sosInput: { 
    width: '100%', 
    borderBottomWidth: 2, 
    borderColor: '#FFCCBC', 
    paddingVertical: 12, 
    marginBottom: 30, 
    fontSize: 18,
    color: '#1A1A1A',
  },
  sosCountdownText: { 
    fontSize: 130, 
    fontWeight: '900', 
    color: '#FF3B30', 
    marginBottom: 20,
  },
  countdownOverlay: { 
    backgroundColor: 'rgba(255, 59, 48, 0.05)' 
  },
  holdContainer: { alignItems: 'center' },
  typeContainer: { alignItems: 'center', width: '100%' },
  microContainer: { alignItems: 'center', width: '100%' },
  countdownContainer: { alignItems: 'center' },
  sosCancelCountdownButton: { 
    marginTop: 20, 
    backgroundColor: '#424242',
    paddingHorizontal: 40,
  },
  intersectionDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFB74D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  activeSOSBar: {
    width: '90%',
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  activeSOSTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeSOSSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  sosMapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sosResolveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sosResolveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  gitaCardCompact: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  gitaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gitaIconBgSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gitaInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  gitaTitleCompact: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF8F00',
  },
  gitaSanskritCompact: {
    fontSize: 14,
    color: '#37474F',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  gitaDropdownContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  gitaTranslation: {
    fontSize: 13,
    color: '#546E7A',
    lineHeight: 18,
    fontWeight: '500',
  },
  communityRequestsSection: {
    width: '90%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#37474F',
    marginBottom: 12,
    paddingLeft: 4,
  },
  communityRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  communityRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  communityRequestType: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#78909C',
    letterSpacing: 0.5,
  },
  communityRequestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263238',
  },
  resolveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosActionBtn: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sosActionBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  }
});

export default FloatingUtilityButton;
