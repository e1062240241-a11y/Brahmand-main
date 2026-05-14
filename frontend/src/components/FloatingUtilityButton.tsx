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
  ImageBackground,
  SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { SOSFlowModal } from './SOSFlowModal';

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
  const [microLocation, setMicroLocation] = useState('');
  const [microLocationLoading, setMicroLocationLoading] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  const [sosFlowVisible, setSosFlowVisible] = useState(false);
  const [fetchedCoordinates, setFetchedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const sosRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sosExpandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sosRadiusLevel, setSosRadiusLevel] = useState(0);
  const overlayFade = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0)).current;

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
    } catch (error) { }
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
    } catch (error) { }
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
    fetchMyCommunityRequests();
    sosRefreshTimerRef.current = setInterval(() => {
      checkSOSStatus();
      fetchMyCommunityRequests();
    }, 60_000);
    return () => {
      if (sosRefreshTimerRef.current) clearInterval(sosRefreshTimerRef.current);
    };
  }, [checkSOSStatus]);

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
    resetSOSFlow();
    setSosFlowVisible(true);
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


  const RADIUS_LEVELS = [5, 15, 50];

  const handleCreateSOS = async (data: { type: string; microLocation: string }, level = 0) => {
    setSOSLoading(true);
    try {
      const { type, microLocation: mLoc } = data;
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
    try {
      await respondToSOS(sosId, 'coming');
      setRespondedSOSIds(prev => new Set([...prev, sosId]));
      Alert.alert('Dhanyawad!', 'The creator has been notified that you are on the way.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to respond to SOS');
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
          isChatPage && { bottom: 150 },
          { transform: [...pan.getTranslateTransform(), { scale: activeSOS ? pulseAnim : 1 }] },
          { opacity: overlayFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
        ]}
      >
        <View style={[styles.floatingButton, activeSOS && styles.floatingButtonActiveSOS]}>
          <View style={[styles.glassBackground, activeSOS && styles.glassBackgroundActiveSOS]}>
            {activeSOS ? <Ionicons name="alert-circle" size={24} color="#FFFFFF" /> : <View style={styles.redDot} />}
          </View>
        </View>
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
            <View style={styles.outerCircleRing} />
            
            {/* Main Menu Circle */}
            <Animated.View style={[styles.mainMenuCircle, { opacity: wheelAnim, transform: [{ scale: wheelAnim }] }]}>
              {/* Segment Dividers */}
              <View style={[styles.segmentLine, { transform: [{ rotate: '30deg' }] }]} />
              <View style={[styles.segmentLine, { transform: [{ rotate: '90deg' }] }]} />
              <View style={[styles.segmentLine, { transform: [{ rotate: '150deg' }] }]} />
              
              {/* Inner Circle Border */}
              <View style={styles.innerCircleBorder} />

              {/* Navigation Arrows */}
              <View style={styles.arrowTop}><Ionicons name="chevron-up" size={24} color="#FFF" /></View>
              <View style={styles.arrowBottom}><Ionicons name="chevron-down" size={24} color="#FFF" /></View>

              {/* Menu Items */}
              <View style={styles.wheelWrapper}>
                {/* Top Left: Library */}
                <TouchableOpacity style={[styles.menuItem, styles.posTopLeft]} onPress={() => { setModalVisible(false); router.push('/library'); }}>
                  <View style={styles.iconBox}><Ionicons name="book" size={28} color="#2196F3" /></View>
                  <Text style={styles.itemTitle}>Brahmand{"\n"}Library</Text>
                  <Text style={styles.itemSub}>Knowledge & Wisdom</Text>
                </TouchableOpacity>

                {/* Top Right: Passport */}
                <TouchableOpacity style={[styles.menuItem, styles.posTopRight]} onPress={() => { setModalVisible(false); router.push('/passport'); }}>
                  <View style={[styles.iconBox, { backgroundColor: '#FFD600' }]}><Ionicons name="airplane" size={28} color="#FFF" /></View>
                  <Text style={styles.itemTitle}>Brahmand{"\n"}Passport</Text>
                  <Text style={styles.itemSub}>Spiritual Journey</Text>
                </TouchableOpacity>

                {/* Middle Right: Kundli */}
                <TouchableOpacity style={[styles.menuItem, styles.posRight]} onPress={() => { setModalVisible(false); router.push('/astrology?mode=kundli'); }}>
                  <View style={styles.iconBox}><Ionicons name="planet" size={28} color="#7C4DFF" /></View>
                  <Text style={styles.itemTitle}>Kundli</Text>
                  <Text style={styles.itemSub}>Planet{"\n"}View</Text>
                </TouchableOpacity>

                {/* Bottom Right: Emergency SOS */}
                <TouchableOpacity 
                  style={[styles.menuItem, styles.posBottomRight]} 
                  onPress={() => activeSOS ? handleResolveActiveSOS('resolved') : startSOSFlow()}
                  onLongPress={() => !activeSOS && startSOSFlow()}
                >
                  <View style={[styles.sosButtonLarge, activeSOS && styles.sosButtonActive]}>
                    <Text style={styles.sosButtonText}>SOS</Text>
                  </View>
                  <Text style={styles.itemTitleSOS}>Emergency SOS</Text>
                  <Text style={styles.itemSub}>Double Tap for Help</Text>
                </TouchableOpacity>

                {/* Bottom Left: Horoscope */}
                <TouchableOpacity style={[styles.menuItem, styles.posBottomLeft]} onPress={() => { setModalVisible(false); router.push('/horoscope'); }}>
                  <View style={styles.iconBox}><Ionicons name="star" size={28} color="#448AFF" /></View>
                  <Text style={styles.itemTitle}>Horoscope</Text>
                  <Text style={styles.itemSub}>Daily{"\n"}Predictions</Text>
                </TouchableOpacity>

                {/* Middle Left: Panchang */}
                <TouchableOpacity style={[styles.menuItem, styles.posLeft]} onPress={openPanchangWithLocation}>
                  <View style={[styles.iconBox, { backgroundColor: '#FF6D00' }]}><Ionicons name="calendar" size={28} color="#FFF" /></View>
                  <Text style={styles.itemTitle}>Panchang</Text>
                  <Text style={styles.itemSub}>Daily{"\n"}Hindu Calendar</Text>
                </TouchableOpacity>
              </View>

              {/* Center: my Krishna AI Guru */}
              <TouchableOpacity 
                style={styles.centerGuruContainer}
                activeOpacity={0.9}
                onPress={() => { setModalVisible(false); router.push('/my-krishna'); }}
              >
                <View style={styles.guruImageWrapper}>
                  <Image source={require('../../assets/images/krishna_guru.png')} style={styles.guruImage} />
                </View>
                <View style={styles.guruTitleBox}>
                   <Ionicons name="leaf" size={16} color="#FFD54F" style={{ marginBottom: -2 }} />
                   <Text style={styles.guruName}>my Krishna</Text>
                   <View style={styles.guruSubLine}>
                     <View style={styles.guruLine} />
                     <Text style={styles.guruSubText}>AI Guru</Text>
                     <View style={styles.guruLine} />
                   </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>

      <SOSFlowModal
        visible={sosFlowVisible}
        onClose={() => setSosFlowVisible(false)}
        onCreateSOS={handleCreateSOS}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: { position: 'absolute', bottom: 90, right: 16, zIndex: 1000 },
  floatingButton: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  floatingButtonEmergency: { shadowColor: '#E53935', shadowOpacity: 0.4 },
  floatingButtonActiveSOS: { shadowColor: '#E53935', shadowOpacity: 0.6 },
  glassBackground: { width: '100%', height: '100%', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderRadius: 28 },
  glassBackgroundEmergency: { backgroundColor: '#FF3B30' },
  glassBackgroundActiveSOS: { backgroundColor: '#E53935' },
  redDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#E53935' },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  overlayBackground: { ...StyleSheet.absoluteFillObject },
  modalContentWrapper: { 
    width: SCREEN_WIDTH, 
    height: SCREEN_WIDTH * 1.2,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  hubContainer: {
    width: SCREEN_WIDTH * 0.94,
    height: SCREEN_WIDTH * 0.94,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircleRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.47,
    borderWidth: 8,
    borderColor: 'rgba(255, 145, 0, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainMenuCircle: {
    width: '98%',
    height: '98%',
    borderRadius: SCREEN_WIDTH * 0.46,
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
    borderRadius: SCREEN_WIDTH * 0.3,
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
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  }
});

export default FloatingUtilityButton;
