// accessibility: placeholder
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ExpoImage } from 'expo-image';
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
  ImageBackground,
  SafeAreaView,
  AppState,
  Vibration,
  DeviceEventEmitter
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useHelpRequestStore } from '../store/helpRequestStore';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../utils/i18n';
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
import { SOSFlowModal } from './SOSFlowModal';
import { SOSResponderModal } from './SOSResponderModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.85;

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
    } catch { }
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
  const [dismissedSOSIds, setDismissedSOSIds] = useState<Set<string>>(new Set());

  const checkSOSStatus = useCallback(async () => {
    try {
      const mySOSRes = await getMySOSAlert();
      setActiveSOS(mySOSRes.data);

      const ok = await LocationService.ensureForegroundPermission();
      if (ok) {
        const location = await LocationService.getCurrentPosition({});
        await updateCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        const nearbyRes = await getActiveSOSAlerts({ lat: location.coords.latitude, lng: location.coords.longitude, radius: 10000 });
        const otherSOS = (nearbyRes.data || []).filter((s: any) => s.id !== mySOSRes.data?.id);
        
        // Filter out dismissed alerts
        const visibleSOS = otherSOS.filter((s: any) => s.id && !dismissedSOSIds.has(s.id));
        setNearbySOSCount(visibleSOS.length);
        setNearbySOSAlerts(visibleSOS);
      }
    } catch (error) { }
  }, [dismissedSOSIds]);

  useEffect(() => {
    const loadDismissed = async () => {
      try {
        const saved = await AsyncStorage.getItem(`dismissed_sos_${user?.id || 'anon'}`);
        if (saved) {
          setDismissedSOSIds(new Set(JSON.parse(saved)));
        }
      } catch (e) {
        console.warn('Failed to load dismissed SOS alerts:', e);
      }
    };
    loadDismissed();
  }, [user?.id]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('open_sos_modal', () => {
      setModalVisible(true);
      checkSOSStatus();
    });
    return () => sub.remove();
  }, [checkSOSStatus]);

  const [microLocation, setMicroLocation] = useState('');
  const [microLocationLoading, setMicroLocationLoading] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [sosFlowVisible, setSosFlowVisible] = useState(false);
  const [incomingSOS, setIncomingSOS] = useState<any>(null);
  const [sosResponderModalVisible, setSosResponderModalVisible] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [fetchedCoordinates, setFetchedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const sosRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sosExpandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sosRadiusLevel, setSosRadiusLevel] = useState(0);
  const overlayFade = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0)).current;

  const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppStateVisible(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  const resolveMyActiveSOS = async (status: 'resolved' | 'cancelled') => {
    if (!activeSOS?.id) return;
    try {
      await resolveSOSAlert(activeSOS.id, status);
    } catch (error) {
      console.error('Resolve SOS error:', error);
      throw error;
    }
  };

  const [myCommunityRequests, setMyCommunityRequests] = useState<any[]>([]);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [communityRequestLoading, setCommunityRequestLoading] = useState(false);
  const [wisdom, setWisdom] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [nextFestival, setNextFestival] = useState<any>(null);
  const [gitaDropdownOpen, setGitaDropdownOpen] = useState(false);
  const [hubExpanded, setHubExpanded] = useState(false);

  const wheelAnim = useRef(new Animated.Value(0)).current;
  const hubAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(overlayFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(menuScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.spring(wheelAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.spring(hubAnim, { toValue: hubExpanded ? 1 : 0, useNativeDriver: true, tension: 40, friction: 8 })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayFade, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(menuScale, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(wheelAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(hubAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [modalVisible, hubExpanded]);

  const rayPulseAnim = useRef(new Animated.Value(0)).current;
  const sosGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible && appStateVisible === 'active') {
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
      rayPulseAnim.stopAnimation();
      sosGlowAnim.stopAnimation();
      rayPulseAnim.setValue(0);
      sosGlowAnim.setValue(0);
    }
  }, [modalVisible, appStateVisible]);

  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  const handleMainButtonPress = () => {
    if (modalVisible) {
      closeUtilityModal();
    } else {
      resetSOSFlow();
      setModalVisible(true);
      loadInitialUtilityData();
    }
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
    if (nearbySOSCount > 0 && appStateVisible === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.ease, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [nearbySOSCount, appStateVisible]);

  const resetSOSFlow = () => {
    setMicroLocation('');
    setMicroLocationLoading(false);
    setLocationFetched(false);
    setFetchedCoordinates(null);
  };

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
      case 'petition': return '#0EA5E9';
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
    } catch (error) { }
  };

  const handleDismissNearbySOS = async () => {
    const nextDismissed = new Set(dismissedSOSIds);
    nearbySOSAlerts.forEach((s: any) => {
      if (s.id) {
        nextDismissed.add(s.id);
      }
    });
    setDismissedSOSIds(nextDismissed);
    setNearbySOSCount(0);
    setNearbySOSAlerts([]);
    try {
      await AsyncStorage.setItem(
        `dismissed_sos_${user?.id || 'anon'}`,
        JSON.stringify(Array.from(nextDismissed))
      );
    } catch (e) {
      console.warn('Failed to save dismissed SOS alerts:', e);
    }
  };

  const loadInitialUtilityData = async () => {
    if (!user?.id) {
      if (!hasLoadedData) {
        await loadUtilityData();
        setHasLoadedData(true);
      }
      return;
    }
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
    if (!user?.id) return;

    checkSOSStatus();
    fetchMyCommunityRequests();

    // Listen for real-time SOS alerts via socket
    const handleSOSAlert = (data: any) => {
      console.log('[Socket] Real-time SOS alert:', data);
      if (data.creator_id !== user?.id) {
        setIncomingSOS(data);
        setSosResponderModalVisible(true);
        Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true); // true = repeat
      }
    };

    socketService.onEvent('sos_alert', handleSOSAlert);

    // Check for pending SOS from push notifications
    const checkPendingSOS = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      if (typeof window !== 'undefined' && (window as any).__PENDING_SOS) {
        const data = (window as any).__PENDING_SOS;
        delete (window as any).__PENDING_SOS;
        setIncomingSOS(data);
        setSosResponderModalVisible(true);
      }
    }, 2000);

    sosRefreshTimerRef.current = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      checkSOSStatus();
      fetchMyCommunityRequests();
    }, 60000);

    return () => {
      if (sosRefreshTimerRef.current) clearInterval(sosRefreshTimerRef.current);
      clearInterval(checkPendingSOS);
      socketService.offEvent('sos_alert', handleSOSAlert);
    };
  }, [checkSOSStatus, user?.id]);

  const fetchMyCommunityRequests = async () => {
    if (!user?.id) return;
    try {
      const response = await getMyActiveCommunityRequests();
      let requests = response.data || [];
      // Strict filtering: ensure we only show requests specifically tied to this user
      requests = requests.filter((req: any) => {
        const isOwner = req.user_id === user.id || req.creator_id === user.id || req.created_by === user.id;
        return isOwner && req.status !== 'fulfilled' && req.status !== 'resolved';
      });
      setMyCommunityRequests(requests);
    } catch (error) { }
  };

  const startSOSFlow = () => {
    setModalVisible(false);
    router.push('/sos');
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

        // Try native reverse geocoding for a readable address
        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (results.length > 0) {
            const place: any = results[0];
            const parts = [
              place.name || place.street,
              place.subLocality || place.district,
              place.city,
            ].filter(Boolean);
            const addr = parts.join(', ');
            if (addr && !microLocation) {
              setMicroLocation(addr);
            }
          }
        } catch (e) {
          console.warn('[FloatingUtility] Native reverse geocode failed:', e);
        }
      }
    } catch (error) {
    } finally {
      setMicroLocationLoading(false);
    }
  };


  const RADIUS_LEVELS = [5, 15, 50];

  const handleCreateSOS = async (data: { type: string; microLocation: string; latitude?: number; longitude?: number }, level = 0) => {
    setSOSLoading(true);
    try {
      const { type, microLocation: mLoc } = data;
      let latitude: number, longitude: number;

      // Priority: manual picker coords > previously fetched coords > live GPS
      if (data.latitude && data.longitude) {
        latitude = data.latitude;
        longitude = data.longitude;
      } else if (fetchedCoordinates) {
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
        emergency_type: type,
        micro_location: mLoc,
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
      if (AppState.currentState !== 'active') return;
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
      } catch { }
    }, 600_000);

    return () => {
      if (sosExpandTimerRef.current) {
        clearInterval(sosExpandTimerRef.current);
        sosExpandTimerRef.current = null;
      }
    };
  }, [activeSOS, sosRadiusLevel]);

  const handleRespondToSOS = async (sosId: string) => {
    if (isResponding) return;
    setIsResponding(true);
    try {
      await respondToSOS(sosId, 'coming');
      setRespondedSOSIds(prev => new Set([...prev, sosId]));

      // Auto-open map for directions when responding
      const sos = nearbySOSAlerts.find(s => s.id === sosId) || incomingSOS;
      if (sos) {
        openNearbySOSLocation(sos);
      }

      Alert.alert('Dhanyawad!', 'The creator has been notified that you are on the way.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to respond to SOS');
    } finally {
      setIsResponding(false);
    }
  };

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
        {
          text: 'Yes', onPress: async () => {
            setSOSLoading(true);
            try {
              await resolveMyActiveSOS('resolved');
              setActiveSOS(null);
            } catch (error) { } finally { setSOSLoading(false); }
          }
        }
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
    } catch { }
    router.push({ pathname: '/panchang', params: { needsLocation: '1' } });
  };

  const SOS_TYPES = [
    { label: 'Medical', value: 'medical' },
    { label: 'Accident', value: 'accident' },
    { label: 'Safety', value: 'safety' },
    { label: 'Other', value: 'other' }
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.floatingButtonContainer,
          { bottom: 90 + insets.bottom },
          isChatPage && { bottom: 150 + insets.bottom },
          { transform: [...pan.getTranslateTransform(), { scale: activeSOS ? pulseAnim : 1 }] },
          { zIndex: 1000 }
        ]}
      >
        <View style={[
          styles.floatingButton,
          activeSOS && styles.floatingButtonActiveSOS,
          modalVisible && styles.floatingButtonOpen,
        ]}>
          <View style={[
            styles.fabRing,
            activeSOS && styles.fabRingSOS,
            modalVisible && styles.fabRingOpen,
          ]} />
          <LinearGradient
            colors={
              activeSOS
                ? ['#FF5252', '#C62828']
                : modalVisible
                  ? ['#FFF8F0', '#FFE8CC']
                  : ['#FF9A4D', '#FF6600', '#E85D04']
            }
            locations={activeSOS || modalVisible ? undefined : [0, 0.55, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.fabGradient}
          >
            {modalVisible ? (
              <Ionicons name="close" size={28} color={COLORS.primary} />
            ) : activeSOS ? (
              <View style={styles.fabSOSIconWrap}>
                <MaterialCommunityIcons name="alarm-light" size={28} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.fabDefaultContent}>
                <View style={styles.fabAvatarRing}>
                  <ExpoImage
                    source={require('../../assets/images/tab bar/my_krishna.png')}
                    style={styles.fabAvatar}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.fabSparkBadge}>
                  <Ionicons name="sparkles" size={11} color="#FFF8E1" />
                </View>
              </View>
            )}
          </LinearGradient>
          {!modalVisible && !activeSOS && nearbySOSCount > 0 && (
            <View style={styles.fabAlertBadge}>
              <Text style={styles.fabAlertBadgeText}>
                {nearbySOSCount > 9 ? '9+' : nearbySOSCount}
              </Text>
            </View>
          )}
        </View>
        {!modalVisible && !activeSOS && nearbySOSCount > 0 && (
          <TouchableOpacity 
            style={styles.fabDismissBtn}
            onPress={handleDismissNearbySOS}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={14} color="#666" />
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.modalOverlay,
          { opacity: overlayFade, pointerEvents: modalVisible ? 'auto' : 'none' }
        ]}
      >
        <TouchableOpacity style={styles.overlayBackground} activeOpacity={1} onPress={closeUtilityModal} />
        <Animated.View
          style={[
            styles.modalContentWrapper,
            { transform: [{ scale: menuScale }, { translateY: menuScale.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }
          ]}
        >


          <View style={styles.hubContainer}>
            {/* Outer Circle Ring */}
            <View style={[styles.outerCircleRing, activeSOS && styles.outerCircleRingSOS]} />

            {/* Main Menu Circle */}
            <Animated.View style={[
              styles.mainMenuCircle,
              { opacity: wheelAnim, transform: [{ scale: wheelAnim }] },
              activeSOS && styles.mainMenuCircleSOS
            ]}>
              {activeSOS ? (
                /* 1. CREATOR SOS ACTIVE VIEW (100% Replication of 1st Image) */
                <View style={styles.sosActiveView}>
                  <View style={styles.sosHeader}>
                    <View style={styles.sosCircleIcon}>
                      <Text style={styles.sosHeaderText}>SOS</Text>
                    </View>
                    <Text style={styles.sosActiveTitle}>{t('yourSosIsActive')}</Text>
                    <Text style={styles.sosActiveSub}>{t('sosActiveSub')}</Text>
                  </View>
 
                  <View style={styles.centerGuruContainerSOS}>
                    <View style={styles.guruImageWrapperSOS}>
                      <ExpoImage source={require('../../assets/images/tab bar/my_krishna.png')} style={styles.guruImage} contentFit="cover" />
                    </View>
                  </View>
 
                  <View style={styles.sosStatusCard}>
                    <View style={styles.sosStatusHeader}>
                      <View style={styles.peopleIconBox}>
                        <Ionicons name="people" size={24} color="#FFF" />
                      </View>
                      <View style={styles.sosStatusTextCol}>
                        <Text style={styles.sosStatusTitle}>{(activeSOS.responders?.length || 0)} {(activeSOS.responders?.length === 1) ? t('personIs') : t('peopleAre')}</Text>
                        <Text style={styles.sosStatusTitle}>{t('comingToHelpYou')}</Text>
                        <View style={styles.sosVerifiedRow}>
                          <Ionicons name="checkmark-circle" size={12} color="#FFD54F" />
                          <Text style={styles.sosVerifiedText}>{(activeSOS.responders?.length || 0)} {t('respondersConfirmed')}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.receivedHelpBtn}
                      onPress={() => handleResolveActiveSOS('resolved')}
                    >
                      <View style={styles.receivedHelpCheck}>
                        <Ionicons name="checkmark" size={18} color="#D32F2F" />
                      </View>
                      <Text style={styles.receivedHelpText}>{t('receivedHelp')}</Text>
                    </TouchableOpacity>
                  </View>
 
                  <TouchableOpacity style={styles.cancelSOSLink} onPress={() => handleResolveActiveSOS('cancelled')}>
                    <Text style={styles.cancelSOSText}>{t('cancelSOS')}</Text>
                  </TouchableOpacity>
 
                  {/* Red Themed Menu Items in Background */}
                  <View style={[styles.menuItem, styles.posTopLeft, { opacity: 0.4 }]}>
                    <Image source={require('../../assets/images/custom_library_icon.png')} style={{ width: 20, height: 20, tintColor: '#FFF' }} resizeMode="contain" />
                    <Text style={styles.itemTitleSOSSmall}>{t('brahmandLibrary').replace('\n', ' ')}</Text>
                  </View>
                  <View style={[styles.menuItem, styles.posTopRight, { opacity: 0.4 }]}>
                    <Image source={require('../../assets/images/custom_passport_icon.png')} style={{ width: 20, height: 20, tintColor: '#FFF' }} resizeMode="contain" />
                    <Text style={styles.itemTitleSOSSmall}>{t('brahmandPassport').replace('\n', ' ')}</Text>
                  </View>
                  <View style={[styles.menuItem, styles.posBottomLeft, { opacity: 0.4 }]}>
                    <Image source={require('../../assets/images/custom_festival_icon.png')} style={{ width: 20, height: 20, tintColor: '#FFF' }} resizeMode="contain" />
                    <Text style={styles.itemTitleSOSSmall}>{t('horoscope')}</Text>
                  </View>
                  <View style={[styles.menuItem, styles.posLeft, { opacity: 0.4 }]}>
                    <Image source={require('../../assets/images/custom_panchang_icon.png')} style={{ width: 20, height: 20, tintColor: '#FFF' }} resizeMode="contain" />
                    <Text style={styles.itemTitleSOSSmall}>{t('panchang')}</Text>
                  </View>
 
                  <View style={styles.arrowTop}><Ionicons name="chevron-up" size={24} color="#FFF" /></View>
                  <View style={styles.arrowBottom}><Ionicons name="chevron-down" size={24} color="#FFF" /></View>
                </View>
              ) : nearbySOSAlerts.length > 0 ? (
                /* 2. RESPONDER SOS ALERT VIEW (100% Replication of 2nd Image) */
                <View style={[styles.sosResponderView, styles.mainMenuCircleSOS]}>
                  <View style={styles.sosAlertHeader}>
                    <View style={styles.alertIconCircle}>
                      <MaterialCommunityIcons name="alarm-light" size={24} color="#D32F2F" />
                    </View>
                    <Text style={styles.sosAlertTitle}>{t('sosAlert')}</Text>
                    <Text style={styles.sosAlertSub}>{t('someoneNeedsHelp')}</Text>
                    <Text style={styles.sosAlertHighlight}>{t('nearestToRespond')}</Text>
                  </View>
 
                  <View style={styles.victimCard}>
                    <View style={styles.victimRow}>
                      <View style={styles.victimAvatarBox}>
                        {nearbySOSAlerts[0].creator_image || nearbySOSAlerts[0].user_photo ? (
                          <Image source={{ uri: nearbySOSAlerts[0].creator_image || nearbySOSAlerts[0].user_photo }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        ) : (
                          <Ionicons name="person" size={30} color="#DDD" />
                        )}
                      </View>
                      <View style={styles.victimInfo}>
                        <Text style={styles.victimName}>{nearbySOSAlerts[0].creator_name || nearbySOSAlerts[0].user_name || 'Rahul Sharma'}</Text>
                        <View style={styles.victimTypeRow}>
                          <MaterialCommunityIcons name="medical-bag" size={14} color="#D32F2F" />
                          <Text style={styles.victimTypeText}>{nearbySOSAlerts[0].emergency_type?.toUpperCase() === 'MEDICAL' ? t('medicalEmergency') : (nearbySOSAlerts[0].emergency_type?.toUpperCase() || t('medicalEmergency'))}</Text>
                        </View>
                        <View style={styles.victimLocRow}>
                          <Ionicons name="location-outline" size={12} color="#666" />
                          <Text style={styles.victimLocText} numberOfLines={1}>{nearbySOSAlerts[0].micro_location || 'Sector 15, Noida, Uttar Pradesh'}</Text>
                        </View>
                        <View style={styles.victimLocRow}>
                          <MaterialCommunityIcons name="target" size={12} color="#666" />
                          <Text style={styles.victimLocText}>{nearbySOSAlerts[0].distance?.toFixed(2) || '0.04'} {t('kmAwayFromYou')}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#BBB" />
                    </View>
                  </View>
 
                  <View style={styles.communityCall}>
                    <Ionicons name="people-outline" size={16} color="#FFF" />
                    <Text style={styles.communityCallText}>{t('pleaseHelpCommunity')}</Text>
                  </View>
 
                  <View style={styles.responderActionRow}>
                    {nearbySOSAlerts[0].responders?.some((r: any) => r.user_id === user?.id) ? (
                      <TouchableOpacity
                        style={[styles.responderBtn, { backgroundColor: '#388E3C' }]}
                        disabled={true}
                      >
                        <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                        <Text style={styles.responderBtnText}>{t('onTheWay').toUpperCase()}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.responderBtn, { backgroundColor: '#4CAF50' }, isResponding && { opacity: 0.7 }]}
                        onPress={() => handleRespondToSOS(nearbySOSAlerts[0].id)}
                        disabled={isResponding}
                      >
                        {isResponding ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="walk" size={22} color="#FFF" />
                            <Text style={styles.responderBtnText}>{t('onMyWay')}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.responderBtn, { backgroundColor: '#FF9800' }]}
                      onPress={() => {
                        const phone = nearbySOSAlerts[0].creator_phone || nearbySOSAlerts[0].phone || nearbySOSAlerts[0].phone_number || '';
                        if (!phone) {
                          Alert.alert('Not Available', 'Phone number not provided.');
                          return;
                        }
                        Alert.alert(
                          t('emergencyContact'),
                          `${t('phoneNumberLabel')}${phone}`,
                          [
                            { text: t('cancel'), style: 'cancel' },
                            { text: t('callAction'), onPress: () => Linking.openURL(`tel:${phone}`) }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="call" size={22} color="#FFF" />
                      <Text style={styles.responderBtnText}>{t('call')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.responderBtn, { backgroundColor: '#2196F3' }]}
                      onPress={() => openNearbySOSLocation(nearbySOSAlerts[0])}
                    >
                      <MaterialCommunityIcons name="navigation" size={22} color="#FFF" />
                      <Text style={styles.responderBtnText}>{t('openMap')}</Text>
                    </TouchableOpacity>
                  </View>
 
                  <TouchableOpacity style={styles.closeAlertX} onPress={closeUtilityModal}>
                    <View style={styles.closeXCircle}>
                      <Ionicons name="close" size={20} color="#333" />
                    </View>
                    <Text style={styles.closeXText}>{t('closeAlert')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* DEFAULT CIRCULAR MENU */
                <>
                  <View style={[styles.segmentLine, { transform: [{ rotate: '30deg' }] }]} />
                  <View style={[styles.segmentLine, { transform: [{ rotate: '90deg' }] }]} />
                  <View style={[styles.segmentLine, { transform: [{ rotate: '150deg' }] }]} />
 
                  <View style={styles.innerCircleBorder} />
 
                  <View style={styles.arrowTop}><Ionicons name="chevron-up" size={24} color="#FFF" /></View>
                  <View style={styles.arrowBottom}><Ionicons name="chevron-down" size={24} color="#FFF" /></View>
 
                  <View style={styles.wheelWrapper}>
                    <TouchableOpacity style={[styles.menuItem, styles.posTopLeft]} onPress={() => { setModalVisible(false); router.push('/library'); }}>
                      <View style={[styles.iconBox, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}><Image source={require('../../assets/images/custom_library_icon.png')} style={{ display: 'flex', width: 80, height: 80, paddingTop: 8, paddingRight: 8, paddingBottom: 6, paddingLeft: 8, justifyContent: 'center', alignItems: 'center', gap: 20, aspectRatio: 1 }} resizeMode="contain" /></View>
                      <Text style={styles.itemTitle}>{t('brahmandLibrary')}</Text>
                      <Text style={styles.itemSub}>{t('knowledgeWisdom')}</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={[styles.menuItem, styles.posTopRight]} onPress={() => { setModalVisible(false); router.push('/passport'); }}>
                      <View style={[styles.iconBox, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}><Image source={require('../../assets/images/custom_passport_icon.png')} style={{ display: 'flex', width: 80, height: 80, paddingTop: 8, paddingRight: 8, paddingBottom: 6, paddingLeft: 8, justifyContent: 'center', alignItems: 'center', gap: 20, aspectRatio: 1 }} resizeMode="contain" /></View>
                      <Text style={styles.itemTitle}>{t('brahmandPassport')}</Text>
                      <Text style={styles.itemSub}>{t('spiritualJourney')}</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={[styles.menuItem, styles.posRight]} onPress={() => { setModalVisible(false); router.push('/astrology?mode=kundli'); }}>
                      <View style={[styles.iconBox, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}><Image source={require('../../assets/images/custom_kundli_icon.png')} style={{ display: 'flex', width: 80, height: 80, paddingTop: 8, paddingRight: 8, paddingBottom: 6, paddingLeft: 8, justifyContent: 'center', alignItems: 'center', gap: 20, aspectRatio: 1 }} resizeMode="contain" /></View>
                      <Text style={styles.itemTitle}>{t('kundli')}</Text>
                      <Text style={styles.itemSub}>{t('planetView')}</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity
                      style={[styles.menuItem, styles.posBottomRight]}
                      onPress={startSOSFlow}
                      onLongPress={startSOSFlow}
                    >
                      <View style={[styles.sosButtonLarge, activeSOS && styles.sosButtonActive]}>
                        <Text style={styles.sosButtonText}>SOS</Text>
                      </View>
                      <Text style={styles.itemTitleSOS}>{t('emergencySOS')}</Text>
                      <Text style={styles.itemSub}>{t('tapForHelp')}</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={[styles.menuItem, styles.posBottomLeft]} onPress={() => { setModalVisible(false); router.push('/horoscope'); }}>
                      <View style={[styles.iconBox, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}><Image source={require('../../assets/images/custom_festival_icon_2.png')} style={{ display: 'flex', width: 80, height: 80, paddingTop: 8, paddingRight: 8, paddingBottom: 6, paddingLeft: 8, justifyContent: 'center', alignItems: 'center', gap: 20, aspectRatio: 1 }} resizeMode="contain" /></View>
                      <Text style={styles.itemTitle}>{t('horoscope')}</Text>
                      <Text style={styles.itemSub}>{t('dailyPredictions')}</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity style={[styles.menuItem, styles.posLeft]} onPress={openPanchangWithLocation}>
                      <View style={[styles.iconBox, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}><Image source={require('../../assets/images/custom_panchang_icon.png')} style={{ display: 'flex', width: 80, height: 80, paddingTop: 8, paddingRight: 8, paddingBottom: 6, paddingLeft: 8, justifyContent: 'center', alignItems: 'center', gap: 20, aspectRatio: 1 }} resizeMode="contain" /></View>
                      <Text style={styles.itemTitle}>{t('panchang')}</Text>
                      <Text style={styles.itemSub}>{t('dailyHinduCalendar')}</Text>
                    </TouchableOpacity>
                  </View>
 
                  <TouchableOpacity
                    style={styles.centerGuruContainer}
                    activeOpacity={0.9}
                    onPress={() => { setModalVisible(false); router.push('/my-krishna'); }}
                  >
                    <View style={styles.guruImageWrapper}>
                      <ExpoImage source={require('../../assets/images/tab bar/my_krishna.png')} style={styles.guruImage} contentFit="cover" />
                    </View>
                    <View style={styles.guruTitleBox}>
                      <Ionicons name="leaf" size={16} color="#FFD54F" style={{ marginBottom: -2 }} />
                      <Text style={styles.guruName}>{t('myKrishnaSmall')}</Text>
                      <View style={styles.guruSubLine}>
                        <View style={styles.guruLine} />
                        <Text style={styles.guruSubText}>{t('aiGuru')}</Text>
                        <View style={styles.guruLine} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>

      <SOSResponderModal
        visible={sosResponderModalVisible}
        sosData={incomingSOS}
        onClose={() => {
          setSosResponderModalVisible(false);
          Vibration.cancel();
          if (incomingSOS?.sos_id || incomingSOS?.id) {
            const idToDismiss = incomingSOS.sos_id || incomingSOS.id;
            setDismissedSOSIds(prev => {
              const next = new Set(prev);
              next.add(idToDismiss);
              AsyncStorage.setItem(`dismissed_sos_${user?.id || 'anon'}`, JSON.stringify(Array.from(next)));
              return next;
            });
          }
        }}
        onRespond={async (id) => {
          Vibration.cancel();
          await handleRespondToSOS(id);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: { position: 'absolute', bottom: 90, right: 16, zIndex: 1000 },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingButtonActiveSOS: {
    shadowColor: '#E53935',
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  floatingButtonOpen: {
    shadowColor: '#8D6E63',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(255, 213, 79, 0.85)',
    backgroundColor: 'rgba(255, 248, 240, 0.25)',
  },
  fabRingSOS: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },
  fabRingOpen: {
    borderColor: 'rgba(255, 102, 0, 0.35)',
    backgroundColor: 'rgba(255, 248, 240, 0.6)',
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fabDefaultContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 248, 240, 0.9)',
    backgroundColor: '#FFF8E1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fabSparkBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(62, 39, 35, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabSOSIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabAlertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fabAlertBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 999,
  },
  overlayBackground: { ...StyleSheet.absoluteFillObject },
  modalContentWrapper: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  hubContainer: {
    width: MENU_SIZE,
    height: MENU_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircleRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: MENU_SIZE * 0.5,
    borderWidth: 8,
    borderColor: 'rgba(255, 145, 0, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainMenuCircle: {
    width: '98%',
    height: '98%',
    borderRadius: MENU_SIZE * 0.49,
    backgroundColor: 'rgba(255, 248, 225, 0.85)',
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerCircleBorder: {
    position: 'absolute',
    width: '62%',
    height: '62%',
    borderRadius: MENU_SIZE * 0.31,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  segmentLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#FFD54F',
    opacity: 0.5,
  },
  arrowTop: {
    position: 'absolute',
    top: 5,
    alignItems: 'center',
    backgroundColor: '#FF6F00',
    borderRadius: 12,
    padding: 2,
  },
  arrowBottom: {
    position: 'absolute',
    bottom: 5,
    alignItems: 'center',
    backgroundColor: '#FF6F00',
    borderRadius: 12,
    padding: 2,
  },
  wheelWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  menuItem: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3E2723',
    textAlign: 'center',
    lineHeight: 12,
  },
  itemTitleSOS: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 4,
  },
  itemSub: {
    fontSize: 7,
    color: '#8D6E63',
    textAlign: 'center',
    marginTop: 1,
  },
  posTopLeft: { top: '15%', left: '15%' },
  posTopRight: { top: '15%', right: '15%' },
  posRight: { top: '42%', right: '4%' },
  posBottomRight: { bottom: '12%', right: '14%' },
  posBottomLeft: { bottom: '15%', left: '15%' },
  posLeft: { top: '42%', left: '4%' },
  sosButtonLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF1744',
    borderWidth: 4,
    borderColor: 'rgba(255, 23, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sosButtonActive: {
    backgroundColor: '#D32F2F',
  },
  sosButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  centerGuruContainer: {
    width: '48%',
    height: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  guruImageWrapper: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#FFD54F',
    backgroundColor: '#FFF8E1',
    overflow: 'hidden',
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  guruImage: {
    width: '100%',
    height: '100%',
  },
  guruTitleBox: {
    position: 'absolute',
    bottom: -10,
    alignItems: 'center',
  },
  guruName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3E2723',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  guruSubLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guruLine: {
    width: 15,
    height: 1,
    backgroundColor: '#FFD54F',
  },
  guruSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  sosStepsFullScreen: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 350,
    zIndex: 3000,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 40,
    zIndex: 10,
  },
  fullStepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stepIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  fullStepTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  fullStepSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  sosFullHoldButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  holdInnerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF3B30',
  },
  holdProgressRing: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 80,
    zIndex: -1,
  },
  sosFullTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
  },
  sosFullTypeBtn: {
    width: '45%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sosFullTypeBtnActive: {
    backgroundColor: '#1A1A1A',
  },
  sosFullTypeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  sosFullTypeBtnTextActive: {
    color: '#FFF',
  },
  sosFullInput: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: '#FFF',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sosFullSendBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  sosFullSendBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF3B30',
  },
  countdownValueLarge: {
    fontSize: 160,
    fontWeight: '900',
    color: '#FFF',
  },
  countdownSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 60,
    fontWeight: '600',
  },
  sosFullCancelBtn: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  sosFullCancelBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  // NEW SOS ACTIVE STYLES (REPLICATION)
  outerCircleRingSOS: { borderColor: 'rgba(255, 59, 48, 0.5)', backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  mainMenuCircleSOS: { backgroundColor: '#D32F2F', borderColor: '#FF5252', borderWidth: 2 },
  sosActiveView: { width: '100%', height: '100%', alignItems: 'center', padding: 12 },
  sosHeader: { alignItems: 'center', marginTop: 4 },
  sosCircleIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sosHeaderText: { color: '#D32F2F', fontWeight: '900', fontSize: 12 },
  sosActiveTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  sosActiveSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, textAlign: 'center', marginTop: 2, lineHeight: 14 },
  centerGuruContainerSOS: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  guruImageWrapperSOS: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#FFD54F', backgroundColor: '#FFF8E1', overflow: 'hidden' },
  sosStatusCard: {
    width: '82%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: -8
  },
  sosStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  peopleIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sosStatusTextCol: { flex: 1 },
  sosStatusTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', lineHeight: 15 },
  sosVerifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  sosVerifiedText: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '600' },
  receivedHelpBtn: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  receivedHelpCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  receivedHelpText: { flex: 1, textAlign: 'center', color: '#D32F2F', fontWeight: '900', fontSize: 11, marginRight: 14 },
  cancelSOSLink: { marginTop: 10 },
  cancelSOSText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
  itemTitleSOSSmall: { color: '#FFF', fontSize: 8, fontWeight: '800', textAlign: 'center', marginTop: 4 },

  sosResponderView: { width: '100%', height: '100%', alignItems: 'center', padding: 12 },
  sosAlertHeader: { alignItems: 'center', marginTop: 4 },
  alertIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sosAlertTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  sosAlertSub: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  sosAlertHighlight: { color: '#FFD54F', fontSize: 11, fontWeight: '800', marginTop: 2 },
  victimCard: {
    width: '94%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8
  },
  victimRow: { flexDirection: 'row', alignItems: 'center' },
  victimAvatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  victimInfo: { flex: 1 },
  victimName: { fontSize: 14, fontWeight: '900', color: '#111' },
  victimPhone: { fontSize: 11, fontWeight: '700', color: '#666', marginBottom: 1 },
  victimTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  victimTypeText: { fontSize: 9, fontWeight: '900', color: '#D32F2F' },
  victimLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  victimLocText: { fontSize: 9, color: '#666', fontWeight: '600', flex: 1 },
  communityCall: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 6 },
  communityCallText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  responderActionRow: { flexDirection: 'row', gap: 8, width: '100%', justifyContent: 'center' },
  responderBtn: { width: 80, height: 65, borderRadius: 10, justifyContent: 'center', alignItems: 'center', padding: 4 },
  responderBtnText: { color: '#FFF', fontSize: 8, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  closeAlertX: { position: 'absolute', top: -4, right: -4, alignItems: 'center' },
  closeXCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  closeXText: { fontSize: 8, color: '#666', fontWeight: '700', marginTop: 2 },
  fabDismissBtn: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 1005,
  },
});

export default FloatingUtilityButton;
