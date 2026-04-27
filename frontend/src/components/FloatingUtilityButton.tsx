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
  Platform
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
  getPanchang
} from '../services/api';
import * as Location from 'expo-location';
import LocationService from '../services/location';
import { socketService } from '../services/socket';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper to parse remote JSON and avoid crash from HTML or plain text errors
const fetchJson = async (url: string) => {
  try {
    const response = await fetch(url);
    const raw = await response.text();
    if (!response.ok) {
      console.warn(`Remote fetch failed ${url}`, response.status, raw);
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (parseError) {
      console.warn(`Remote fetch returned non-JSON payload for ${url}`, raw.slice(0, 320));
      return null;
    }
  } catch (error) {
    console.error(`Remote fetch error for ${url}:`, error);
    return null;
  }
};

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
        console.log('Using cached shloka:', parsed.chapter, parsed.verse);
        return parsed;
      }
    }
    
    // Fetch new shloka
    const shlokaIndex = getTodaysShlokaIndex();
    const { chapter, verse } = getChapterVerse(shlokaIndex);
    
    console.log('Fetching new shloka:', chapter, verse);
    const data = await getGitaShloka(chapter, verse);
    
    if (data && data.slok) {
      // Get English translation - check multiple sources and use the longest one
      const translations: string[] = [];
      
      // Prefer full commentary (ec) over short translation (et)
      if (data.siva?.ec) translations.push(data.siva.ec);
      if (data.siva?.et) translations.push(data.siva.et);
      if (data.adi?.et) translations.push(data.adi.et);
      if (data.gambir?.et) translations.push(data.gambir.et);
      if (data.purohit?.et) translations.push(data.purohit.et);
      
      // Use the longest translation (usually the full commentary)
      let translation = translations.length > 0 
        ? translations.reduce((a, b) => a.length > b.length ? a : b)
        : 'Translation not available';
      
      // Clean up problematic characters from the API response
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
      
      // Cache it
      await AsyncStorage.setItem(SHLOKA_CACHE_KEY, JSON.stringify(shlokaData));
      console.log('Cached new shloka');
      
      return shlokaData;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading daily shloka:', error);
    
    // Try to return cached data even if expired
    try {
      const cached = await AsyncStorage.getItem(SHLOKA_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    
    return null;
  }
};

// Helper functions for Panch data
const getPanchangData = async () => {
  try {
    const response = await getPanchang();
    return response.data;
  } catch (error) {
    console.warn('Panchang fetch error:', error);
    return null;
  }
};

const getFestivalsData = async () => {
  // Festivals data - could be added later
  return null;
};

const getHelpIcon = (type: string): string => {
  switch (type) {
    case 'blood': return 'water';
    case 'medical': return 'medkit';
    case 'financial': return 'cash';
    case 'food': return 'restaurant';
    default: return 'hand-left';
  }
};

const getHelpColor = (type: string): string => {
  switch (type) {
    case 'blood': return '#E53935';
    case 'medical': return '#1976D2';
    case 'financial': return '#43A047';
    case 'food': return '#FB8C00';
    default: return COLORS.primary;
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
  
  // SOS state
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [nearbySOSCount, setNearbySOSCount] = useState(0);
  const [nearbySOSAlerts, setNearbySOSAlerts] = useState<any[]>([]);
  const [respondedSOSIds, setRespondedSOSIds] = useState<Set<string>>(new Set());
  const [sosStage, setSosStage] = useState<'idle' | 'hold' | 'type' | 'micro' | 'countdown'>('idle');
  const [sosType, setSosType] = useState<string>('');
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
  
  // Community requests state
  const [myCommunityRequests, setMyCommunityRequests] = useState<any[]>([]);
  const [communityRequestLoading, setCommunityRequestLoading] = useState(false);
  const [communityRequestsExpanded, setCommunityRequestsExpanded] = useState(true);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  
  // Spiritual data
  const [wisdom, setWisdom] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [nextFestival, setNextFestival] = useState<any>(null);
  const [gitaDropdownOpen, setGitaDropdownOpen] = useState(false);
  const homeLocation = (user as any)?.home_location;
  
  // Pulse animation for nearby SOS
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (nearbySOSCount > 0) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [nearbySOSCount]);

  const resetSOSFlow = () => {
    setSosStage('idle');
    setSosType('');
    setMicroLocation('');
    setMicroLocationLoading(false);
    setLocationFetched(false);
    setFetchedCoordinates(null);
    setHoldProgress(0);
    setCountdownValue(5);
    holdConfirmedRef.current = false;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const openSOSLocation = async () => {
    if (!activeSOS?.latitude || !activeSOS?.longitude) {
      Alert.alert('Location unavailable', 'Cannot open map without coordinates.');
      return;
    }

    const lat = activeSOS.latitude;
    const lng = activeSOS.longitude;
    const label = encodeURIComponent('SOS Location');
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    }
  };

  const openNearbySOSLocation = async (sos: any) => {
    const lat = sos.latitude;
    const lng = sos.longitude;
    if (lat == null || lng == null) {
      Alert.alert('Location unavailable', 'Cannot open map without coordinates.');
      return;
    }

    const label = encodeURIComponent('Nearby SOS Location');
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    }
  };

  useEffect(() => {
    return () => {
      resetSOSFlow();
    };
  }, []);

  const loadUtilityData = async () => {
    try {
      const [wisdomRes, panchangData, festivalData, gitaShloka] = await Promise.all([
        getWisdom().catch(() => null),
        getPanchangData(),
        getFestivalsData(),
        loadDailyShloka()
      ]);
      setWisdom(wisdomRes?.data);
      setPanchang(panchangData);
      setNextFestival(festivalData);
      // Store Gita shloka separately
      if (gitaShloka) {
        setWisdom((prev: any) => ({ ...prev, gitaShloka }));
      }
    } catch (error) {
      console.error('Error loading utility data:', error);
    }
  };

  const checkSOSStatus = useCallback(async () => {
    try {
      // Check for user's active SOS
      const mySOSRes = await getMySOSAlert();
      setActiveSOS(mySOSRes.data);

      // Check for nearby SOS alerts
      const ok = await LocationService.ensureForegroundPermission();
      if (ok) {
        const location = await LocationService.getCurrentPosition({});
        try {
          await updateCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (updateError) {
          console.warn('[SOS] Failed to update current location:', updateError);
        }
        const nearbyRes = await getActiveSOSAlerts({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          radius: 1
        });
        // Don't count user's own SOS
        const otherSOS = (nearbyRes.data || []).filter((s: any) => s.id !== mySOSRes.data?.id);
        setNearbySOSCount(otherSOS.length);
        setNearbySOSAlerts(otherSOS);
      }
    } catch (error) {
      console.error('Error checking SOS status:', error);
    }
  }, []);

  const loadInitialUtilityData = async () => {
    // Always refresh community requests and nearby SOS when opening modal
    fetchMyCommunityRequests();

    await Promise.allSettled([
      fetchActiveRequest(),
      hasLoadedData ? Promise.resolve() : loadUtilityData(),
      checkSOSStatus(),
    ]);

    if (!hasLoadedData) {
      setHasLoadedData(true);
    }
  };

  const closeUtilityModal = () => {
    setModalVisible(false);
    resetSOSFlow();
    if (!activeSOS && !hasActiveRequest()) {
      setNearbySOSCount(0);
      setNearbySOSAlerts([]);
    }
  };

  const handleIncomingSOSAlert = useCallback(async () => {
    try {
      await checkSOSStatus();
    } catch (error) {
      console.warn('[SOS] incoming alert refresh failed', error);
    }
  }, [checkSOSStatus]);

  // Handle responding to a nearby SOS (I'm on my way)
  const handleSOSRespond = async (sos: any, response: string) => {
    if (!sos?.id) return;
    if (respondedSOSIds.has(sos.id)) return;
    
    try {
      await respondToSOS(sos.id, response as 'coming' | 'called');
      setRespondedSOSIds(new Set([...respondedSOSIds, sos.id]));
      Alert.alert(
        'Response Sent',
        `You've told ${sos.user_name || 'the person'} that you're coming!`
      );
    } catch (error: any) {
      console.warn('[SOS] respond failed', error);
      Alert.alert('Error', 'Failed to send response. Please try again.');
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSOSRefresh = async () => {
      try {
        await socketService.connect();
        socketService.onEvent('sos_alert', handleIncomingSOSAlert);
      } catch (error) {
        console.warn('[SOS] socket connect failed', error);
      }
    };

    initSOSRefresh();
    checkSOSStatus();

    sosRefreshTimerRef.current = setInterval(() => {
      if (!mounted) return;
      checkSOSStatus();
    }, 60_000);

    return () => {
      mounted = false;
      if (sosRefreshTimerRef.current) {
        clearInterval(sosRefreshTimerRef.current);
      }
      socketService.offEvent('sos_alert', handleIncomingSOSAlert);
    };
  }, [checkSOSStatus, handleIncomingSOSAlert]);

  const fetchMyCommunityRequests = async () => {
    try {
      const response = await getMyActiveCommunityRequests();
      let requests = response.data || [];
      
      console.log('=== fetchMyCommunityRequests ===');
      console.log('Total requests from API:', requests.length);
      console.log('Current user ID:', user?.id);
      
      // Filter to only show current user's active requests (robust check)
      // Check multiple user ID fields for safety
      if (user?.id) {
        const beforeFilter = requests.length;
        requests = requests.filter((req: any) => {
          const isMyRequest = req.user_id === user.id || 
                            req.creator_id === user.id ||
                            req.created_by === user.id;
          const isActive = req.status !== 'fulfilled' && req.status !== 'resolved';
          return isMyRequest && isActive;
        });
        console.log('Filtered from', beforeFilter, 'to', requests.length, 'requests');
        console.log('Sample request user_ids:', requests.slice(0, 3).map((r: any) => r.user_id));
      } else {
        console.log('No user logged in, showing empty');
        requests = [];
      }
      
      setMyCommunityRequests(requests);
    } catch (error: any) {
      console.error('Error fetching community requests:', error);
    }
  };

  const SOS_TYPES = [
    { label: 'Medical', value: 'medical' },
    { label: 'Accident', value: 'accident' },
    { label: 'Safety', value: 'safety' },
    { label: 'Other', value: 'other' }
  ];

  const startSOSFlow = () => {
    resetSOSFlow();
    setSosType('medical');
    setSosStage('type');
  };

  const getLocationText = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded.length > 0) {
        const place = geocoded[0];
        return [place.name, place.street, place.district, place.city, place.region]
          .filter(Boolean)
          .join(', ');
      }
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
    }
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  };

  const fetchCurrentMicroLocation = async (showAlert: boolean = true) => {
    setMicroLocationLoading(true);
    try {
      const ok = await LocationService.ensureForegroundPermission();
      if (!ok) {
        if (showAlert) {
          Alert.alert('Location Required', 'Please enable location services and grant permission to fetch your current location.');
        }
        setLocationFetched(false);
        setFetchedCoordinates(null);
        return;
      }

      const location = await LocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });
      if (location?.coords) {
        setLocationFetched(true);
        setFetchedCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error: any) {
      if (showAlert) {
        Alert.alert('Location Error', 'Unable to fetch current location. Please enable location permissions and try again.');
      }
      setLocationFetched(false);
      setFetchedCoordinates(null);
      console.warn('Fetch current micro location failed:', error);
    } finally {
      setMicroLocationLoading(false);
    }
  };

  useEffect(() => {
    if (sosStage === 'micro') {
      fetchCurrentMicroLocation(true);
    }
  }, [sosStage]);

  const openFetchedLocation = async () => {
    if (!fetchedCoordinates) return;

    const { latitude, longitude } = fetchedCoordinates;
    const label = encodeURIComponent('Current Location');
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://maps.google.com/?q=${latitude},${longitude}`);
    }
  };

  const handleSOSHoldStart = () => {
    if (sosStage !== 'hold') return;
    holdConfirmedRef.current = false;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    const start = Date.now();
    setHoldProgress(0);
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / 3000);
      setHoldProgress(progress);
      if (progress >= 1) {
        handleSOSHoldComplete();
      }
    }, 50);
  };

  const handleSOSHoldComplete = () => {
    if (sosStage !== 'hold') return;
    holdConfirmedRef.current = true;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(1);
    setSosStage('type');
  };

  const handleSOSHoldEnd = () => {
    if (holdConfirmedRef.current) {
      return;
    }
    if (sosStage !== 'hold') return;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
    setSosStage('idle');
  };

  const handleStartSOSCountdown = () => {
    setSosStage('countdown');
  };

  const handleCancelSOSCountdown = () => {
    resetSOSFlow();
  };

  const handleSubmitSOS = async () => {
    setSOSLoading(true);
    try {
      const ok = await LocationService.ensureForegroundPermission();
      if (!ok) {
        Alert.alert('Location Required', 'Please enable location to send SOS alert');
        resetSOSFlow();
        return;
      }

      let latitude: number;
      let longitude: number;
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
        emergency_type: sosType || 'other',
        micro_location: microLocation || '',
        radius: 1,
      });

      setActiveSOS(response.data);
      resetSOSFlow();
      Alert.alert('SOS Alert Sent', 'Your emergency alert has been sent to nearby community members. Stay safe!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send SOS alert');
      resetSOSFlow();
    } finally {
      setSOSLoading(false);
    }
  };

  useEffect(() => {
    if (sosStage !== 'countdown') return;
    setCountdownValue(8);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    countdownTimerRef.current = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          handleSubmitSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [sosStage]);

  const handleCreateSOS = () => {
    startSOSFlow();
  };

  const handleResolveCommunityRequest = async (requestId: string) => {
    console.log('handleResolveCommunityRequest called with:', requestId);
    
    // Use custom confirmation instead of Alert to avoid navigation issues on web
    setResolvingRequestId(requestId);
    setCommunityRequestLoading(true);
    
    try {
      console.log('Making API call to resolve...');
      const response = await resolveCommunityRequest(requestId);
      console.log('Resolve response:', response);
      
      // Show success and refresh immediately
      setMyCommunityRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: 'fulfilled' } : req)
      );
      
      Alert.alert('Success', 'Request marked as fulfilled!');
    } catch (error: any) {
      console.error('Error resolving request:', error);
      console.error('Error response:', error.response?.data);
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

  const handleResolveActiveSOS = async (status: 'resolved' | 'cancelled') => {
    if (!activeSOS) return;
    
    const message = status === 'resolved' 
      ? 'Has help arrived? This will close your SOS alert.'
      : 'Cancel your SOS alert?';
    
    Alert.alert(
      status === 'resolved' ? 'Help Received' : 'Cancel SOS',
      message,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            setSOSLoading(true);
            try {
              await resolveSOSAlert(activeSOS.id, status);
              setActiveSOS(null);
              Alert.alert('Success', status === 'resolved' ? 'Glad you received help!' : 'SOS alert cancelled');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to resolve SOS');
            } finally {
              setSOSLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStopHelp = async () => {
    console.log('handleStopHelp called, activeRequest:', activeRequest);
    
    if (!activeRequest) {
      Alert.alert('No Request', 'No active help request found.');
      return;
    }
    
    Alert.alert(
      'Resolve Help Request',
      'Has your help request been fulfilled? This will close the request.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          console.log('Confirm pressed, resolving request:', activeRequest.id);
          setLoading(true);
          try {
            await resolveRequest();
            console.log('Request resolved successfully');
            setModalVisible(false);
            Alert.alert('Success', 'Your help request has been marked as fulfilled.');
            // Refresh active request status
            fetchActiveRequest();
          } catch (error: any) {
            console.error('Error resolving request:', error);
            Alert.alert('Error', error?.message || 'Failed to resolve request. Please try again.');
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };

  const openPanchangWithLocation = async () => {
    setModalVisible(false);

    try {
      const hasPermission = await LocationService.ensureForegroundPermission();
      if (hasPermission) {
        const location = await LocationService.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        });

        router.push({
          pathname: '/panchang',
          params: {
            lat: String(location.coords.latitude),
            lng: String(location.coords.longitude),
          },
        });
        return;
      }
    } catch {
      // Use home location fallback below
    }

    if (typeof homeLocation?.latitude === 'number' && typeof homeLocation?.longitude === 'number') {
      router.push({
        pathname: '/panchang',
        params: {
          lat: String(homeLocation.latitude),
          lng: String(homeLocation.longitude),
        },
      });
      return;
    }

    router.push({ pathname: '/panchang', params: { needsLocation: '1' } });
  };

  const isActiveHelp = hasActiveRequest();
  const hasNearbyEmergency = nearbySOSCount > 0;
  const hasCommunityRequests = myCommunityRequests.length > 0;

  return (
    <>
      {/* Floating Button */}
      <Animated.View style={[
        styles.floatingButtonContainer,
        isChatPage && { bottom: 150 },
        { transform: [{ scale: hasNearbyEmergency ? pulseAnim : 1 }] }
      ]}>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            hasNearbyEmergency && styles.floatingButtonEmergency,
            activeSOS && styles.floatingButtonActiveSOS
          ]}
          onPress={() => {
            resetSOSFlow();
            setModalVisible(true);
            loadInitialUtilityData();
          }}
          activeOpacity={0.9}
        >
          <View style={[
            styles.glassBackground,
            hasNearbyEmergency && styles.glassBackgroundEmergency,
            activeSOS && styles.glassBackgroundActiveSOS
          ]}>
            {activeSOS ? (
              <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
            ) : isActiveHelp && activeRequest ? (
              <Ionicons 
                name={getHelpIcon(activeRequest.type) as any} 
                size={22} 
                color={getHelpColor(activeRequest.type)} 
              />
            ) : hasNearbyEmergency ? (
              <Ionicons name="alert" size={22} color="#FFFFFF" />
            ) : hasCommunityRequests ? (
              <View style={styles.communityRequestsDot} />
            ) : (
              <View style={styles.redDot} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Panel Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeUtilityModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={[styles.overlayBackground, sosStage === 'countdown' && styles.countdownOverlay]} 
            activeOpacity={1} 
            onPress={closeUtilityModal}
          />
          <KeyboardAvoidingView
            style={styles.modalContentWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
          >
            <View style={[styles.modalContent, sosStage === 'countdown' && styles.countdownModalContent]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeUtilityModal}
                >
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalTitle}>Sanatan Utilities</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScrollContent}>
              {/* Active SOS Section */}
              {activeSOS && (
                <View style={styles.activeSosCard}>
                  <View style={styles.activeSosHeader}>
                    <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.activeSosTitle}>YOUR SOS IS ACTIVE</Text>
                  </View>
                  {activeSOS.latitude && activeSOS.longitude ? (
                    <TouchableOpacity style={styles.activeSosLink} onPress={openSOSLocation}>
                      <Text style={styles.activeSosLinkText}>View Creator Location</Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text style={styles.activeSosStatus}>
                    {activeSOS.responders?.length > 0 ? 'Help is on the way' : 'Searching for help'}
                  </Text>
                  <Text style={styles.activeSosLocation}>
                    Emergency: {activeSOS.emergency_type ? activeSOS.emergency_type.toUpperCase() : 'UNKNOWN'}
                  </Text>
                  {activeSOS.micro_location ? (
                    <Text style={styles.activeSosLocation}>
                      Micro-location: {activeSOS.micro_location}
                    </Text>
                  ) : null}
                  {activeSOS.responders?.length > 0 && (
                    <Text style={styles.activeSosResponders}>
                      {activeSOS.responders.length} people responding
                    </Text>
                  )}
                  <TouchableOpacity style={styles.sosMapButton} onPress={openSOSLocation}>
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={[styles.sosButtonText, { marginLeft: SPACING.xs }]}>Open Map</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.sosButtonRow}>
                    <TouchableOpacity 
                      style={styles.sosResolveButton}
                      onPress={() => handleResolveActiveSOS('resolved')}
                      disabled={sosLoading}
                    >
                      {sosLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                          <Text style={styles.sosButtonText}>HELP RECEIVED</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.sosCancelButton}
                      onPress={() => handleResolveActiveSOS('cancelled')}
                      disabled={sosLoading}
                    >
                      <Ionicons name="close-circle" size={18} color={COLORS.error} />
                      <Text style={[styles.sosButtonText, { color: COLORS.error }]}>CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Nearby SOS Alerts */}
              {!activeSOS && nearbySOSAlerts.length > 0 && (
                <View style={styles.nearbySOSSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Nearby SOS Alerts</Text>
                    <Text style={styles.nearbySOSMeta}>{nearbySOSCount} nearby</Text>
                  </View>
                  {nearbySOSAlerts.map((sos) => (
                    <View key={sos.id} style={styles.nearbySOSCard}>
                      <View style={styles.nearbySOSHeader}>
                        <Text style={styles.nearbySOSTitle}>{sos.emergency_type?.toUpperCase() || 'SOS'}</Text>
                        <Text style={styles.nearbySOSDistance}>{sos.distance?.toFixed(2)} km</Text>
                      </View>
                      <Text style={styles.nearbySOSLocation}>{sos.micro_location || `${sos.area}, ${sos.city}`}</Text>
                      <View style={styles.nearbySOSActions}>
                        {respondedSOSIds.has(sos.id) ? (
                          <TouchableOpacity 
                            style={[styles.sosMapButton, { backgroundColor: COLORS.success, opacity: 0.7 }]} 
                            disabled
                          >
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={[styles.sosButtonText, { marginLeft: SPACING.xs }]}>Response Sent</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            style={[styles.sosMapButton, { backgroundColor: COLORS.success }]} 
                            onPress={() => handleSOSRespond(sos, 'coming')}
                          >
                            <Ionicons name="walk" size={16} color="#FFFFFF" />
                            <Text style={[styles.sosButtonText, { marginLeft: SPACING.xs }]}>I'm on my way</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={[styles.sosMapButton, { backgroundColor: COLORS.primary }]} 
                          onPress={() => {
                            if (sos.phone_number) {
                              Linking.openURL(`tel:${sos.phone_number}`);
                            }
                          }}
                        >
                          <Ionicons name="call" size={16} color="#FFFFFF" />
                          <Text style={[styles.sosButtonText, { marginLeft: SPACING.xs }]}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sosMapButton} onPress={() => openNearbySOSLocation(sos)}>
                          <Ionicons name="navigate" size={16} color="#FFFFFF" />
                          <Text style={[styles.sosButtonText, { marginLeft: SPACING.xs }]}>Open Map</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Active Help Request Section */}
              {isActiveHelp && activeRequest && (
                <View style={styles.activeHelpCard}>
                  <View style={styles.activeHelpHeader}>
                    <View style={[styles.helpTypeBadge, { backgroundColor: `${getHelpColor(activeRequest.type)}20` }]}>
                      <Ionicons name={getHelpIcon(activeRequest.type) as any} size={18} color={getHelpColor(activeRequest.type)} />
                    </View>
                    <Text style={styles.activeHelpTitle}>Your Active Help Request</Text>
                  </View>
                  <Text style={styles.activeHelpType}>{activeRequest.type.toUpperCase()} - {activeRequest.title}</Text>
                  <Text style={styles.activeHelpUrgency}>Urgency: {activeRequest.urgency}</Text>
                  
                  <TouchableOpacity 
                    style={styles.stopHelpButton}
                    onPress={handleStopHelp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.stopHelpText}>MARK AS FULFILLED</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* My Community Requests Section */}
              {myCommunityRequests.length > 0 && (
                <View style={styles.communityRequestsSection}>
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setCommunityRequestsExpanded(!communityRequestsExpanded)}
                  >
                    <Text style={styles.sectionTitle}>My Community Requests ({myCommunityRequests.length})</Text>
                    <Ionicons 
                      name={communityRequestsExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={COLORS.textSecondary} 
                    />
                  </TouchableOpacity>
                  
                  {communityRequestsExpanded && myCommunityRequests.map((request) => (
                    <View 
                      key={request.id} 
                      style={[
                        styles.communityRequestCard,
                        request.status === 'fulfilled' && styles.communityRequestCardFulfilled
                      ]}
                    >
                      <View style={styles.communityRequestHeader}>
                        <View style={[styles.requestTypeBadge, { backgroundColor: `${getCommunityRequestColor(request.request_type)}20` }]}>
                          <Ionicons 
                            name={getCommunityRequestIcon(request.request_type) as any} 
                            size={16} 
                            color={getCommunityRequestColor(request.request_type)} 
                          />
                        </View>
                        <Text style={styles.communityRequestType}>
                          {request.request_type?.toUpperCase()}
                        </Text>
                        {request.status === 'fulfilled' && (
                          <View style={styles.fulfilledBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                            <Text style={styles.fulfilledText}>Fulfilled</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.communityRequestTitle} numberOfLines={1}>
                        {request.title}
                      </Text>
                      <Text style={styles.communityRequestDescription} numberOfLines={2}>
                        {request.description}
                      </Text>
                      <View style={styles.communityRequestFooter}>
                        <Text style={styles.communityRequestMeta}>
                          {request.location} • {request.urgency_level}
                        </Text>
                        {request.status !== 'fulfilled' && (
                          <TouchableOpacity 
                            style={styles.resolveButton}
                            onPress={() => handleResolveCommunityRequest(request.id)}
                            disabled={resolvingRequestId === request.id}
                          >
                            {resolvingRequestId === request.id ? (
                              <ActivityIndicator size={14} color={COLORS.success} />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                                <Text style={styles.resolveButtonText}>Mark Fulfilled</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Gita Slok Card - Full Sanskrit, Dropdown for Explanation */}
              <View style={styles.gitaCardCompact}>
                <TouchableOpacity 
                  style={styles.gitaHeaderRow}
                  onPress={() => setGitaDropdownOpen(!gitaDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <View style={styles.gitaIconBgSmall}>
                    <Ionicons name="book" size={16} color={COLORS.success} />
                  </View>
                  <View style={styles.gitaInfo}>
                    <Text style={styles.gitaTitleCompact}>Gita {wisdom?.gitaShloka ? `Ch ${wisdom.gitaShloka.chapter}:${wisdom.gitaShloka.verse}` : wisdom?.chapter ? `Ch ${wisdom.chapter}:${wisdom.verse}` : 'Daily'}</Text>
                    <Text style={styles.gitaSanskritCompact}>
                      {wisdom?.gitaShloka?.slok || wisdom?.sanskrit || 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।'}
                    </Text>
                  </View>
                  <Ionicons 
                    name={gitaDropdownOpen ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
                {gitaDropdownOpen && (
                  <View style={styles.gitaDropdownContent}>
                    <Text style={styles.gitaTranslation}>
                      {wisdom?.gitaShloka?.translation || wisdom?.translation || wisdom?.quote || 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Utility Shortcuts */}
              <View style={styles.utilityGrid}>
                <TouchableOpacity 
                  style={styles.utilityCard}
                  onPress={() => {
                    openPanchangWithLocation();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#FFE5CC' }]}> 
                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.utilityTitle}>Panchang</Text>
                  <Text style={styles.utilitySubtitle}>Daily</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.utilityCard}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/astrology');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#E3F2FD' }]}> 
                    <Ionicons name="star" size={20} color={COLORS.info} />
                  </View>
                  <Text style={styles.utilityTitle}>Horoscope</Text>
                  <Text style={styles.utilitySubtitle}>Daily</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.utilityCard}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/astrology?mode=kundli');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="planet" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.utilityTitle}>Kundli</Text>
                  <Text style={styles.utilitySubtitle}>Planet view</Text>
                </TouchableOpacity>
              </View>

{/* Next Festival - Full Width Bar */}
              <View style={styles.festivalBar}>
                <View style={styles.festivalBarContent}>
                  <View style={[styles.utilityIconBg, { backgroundColor: '#E8F5E9' }]}> 
                    <Ionicons name="sparkles" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.festivalInfo}>
                    <Text style={styles.festivalTitle}>Next Festival</Text>
                    <Text style={styles.festivalName}>{nextFestival?.name || 'Loading...'}</Text>
                  </View>
                  <View style={styles.festivalDays}>
                    <Text style={styles.festivalDaysText}>
                      {nextFestival?.days_until !== undefined ? `${nextFestival.days_until}d` : '--'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Library & Passport Row */}
              <View style={styles.festivalRow}>
                <TouchableOpacity
                  style={styles.libraryButton}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/library');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#E3F2FD' }]}> 
                    <Ionicons name="book" size={20} color={COLORS.info} />
                  </View>
                  <Text style={styles.libraryButtonTitle}>Brahmand Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.passportButton}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/passport');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#FFD700' }]}> 
                    <Ionicons name="airplane" size={20} color="#B8860B" />
                  </View>
                  <Text style={styles.passportButtonTitle}>Brahmand Passport</Text>
                </TouchableOpacity>
              </View>

              {/* SOS Card */}
              {!activeSOS && (
                <View style={styles.sosCard}>
                  <View style={styles.sosHeader}>
                    <View style={styles.sosIconBg}>
                      <Ionicons name="alert-circle" size={28} color={COLORS.error} />
                    </View>
                    <Text style={styles.sosTitle}>Emergency SOS</Text>
                  </View>

                  {sosStage === 'idle' && (
                    <>
                      <Text style={styles.sosDescription}>
                        Tap START SOS to begin the medical confirmation flow and send an emergency alert to nearby community members.
                      </Text>
                      <TouchableOpacity 
                        style={styles.sosButton}
                        onPress={handleCreateSOS}
                        activeOpacity={0.8}
                        disabled={sosLoading}
                      >
                        {sosLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Ionicons name="alert" size={20} color="#FFFFFF" />
                            <Text style={styles.sosButtonMainText}>START SOS</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.sosNote}>
                        Your location will be shared to help people reach you faster.
                      </Text>
                    </>
                  )}

                  {sosStage === 'hold' && (
                    <>
                      <Text style={styles.sosStepTitle}>Hold to Confirm</Text>
                      <Text style={styles.sosStepSubtitle}>Keep pressing the button for 3 seconds to confirm your emergency.</Text>
                      <TouchableOpacity
                        style={styles.sosHoldButton}
                        activeOpacity={1}
                        onPressIn={handleSOSHoldStart}
                        onPressOut={handleSOSHoldEnd}
                        onLongPress={handleSOSHoldComplete}
                        delayLongPress={3000}
                      >
                        <Text style={styles.sosHoldButtonText}>HOLD TO CONFIRM</Text>
                        <View style={styles.sosHoldProgressBar}>
                          <View style={[styles.sosHoldProgressFill, { width: `${Math.round(holdProgress * 100)}%`}]} />
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  {sosStage === 'type' && (
                    <>
                      <Text style={styles.sosStepTitle}>Confirm Emergency Type</Text>
                      <Text style={styles.sosStepSubtitle}>Medical is selected by default for fast response.</Text>
                      <View style={styles.sosTypeGrid}>
                        {SOS_TYPES.map((typeOption) => (
                          <TouchableOpacity
                            key={typeOption.value}
                            style={[
                              styles.sosTypeButton,
                              sosType === typeOption.value && styles.sosTypeButtonSelected,
                            ]}
                            onPress={() => setSosType(typeOption.value)}
                          >
                            <Text style={[
                              styles.sosTypeButtonText,
                              sosType === typeOption.value && styles.sosTypeButtonTextSelected,
                            ]}>
                              {typeOption.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={[styles.sosButton, !sosType ? styles.sosButtonDisabled : null]}
                        onPress={() => setSosStage('micro')}
                        disabled={!sosType}
                      >
                        <Text style={styles.sosButtonMainText}>CONTINUE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.sosSecondaryButton} onPress={resetSOSFlow}>
                        <Text style={styles.sosSecondaryText}>Cancel SOS</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {sosStage === 'micro' && (
                    <>
                      <Text style={styles.sosStepTitle}>Add Micro Location</Text>
                      <Text style={styles.sosStepSubtitle}>Specify floor, flat, landmark or any nearby detail.</Text>
                      <View style={styles.sosFetchRow}>
                        <TouchableOpacity
                          style={[
                            styles.sosLocationButton,
                            locationFetched && styles.sosLocationButtonFetched,
                          ]}
                          onPress={() => fetchCurrentMicroLocation()}
                          disabled={microLocationLoading}
                        >
                          {microLocationLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="location" size={18} color="#FFFFFF" />
                              <Text style={styles.sosLocationButtonText}>
                                {locationFetched ? 'Location fetched' : 'Fetching current location...'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                        {locationFetched && (
                          <TouchableOpacity style={styles.sosLocationLink} onPress={openFetchedLocation}>
                            <Text style={styles.sosLocationLinkText}>Open fetched location</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TextInput
                        style={styles.sosInput}
                        placeholder="If you are in building or apartment, add floor/flat/block"
                        placeholderTextColor={COLORS.textSecondary}
                        value={microLocation}
                        onChangeText={setMicroLocation}
                        multiline
                      />
                      <TouchableOpacity
                        style={[styles.sosButton, !locationFetched ? styles.sosButtonDisabled : null]}
                        onPress={() => setSosStage('countdown')}
                        disabled={!locationFetched}
                      >
                        <Text style={styles.sosButtonMainText}>CREATE SOS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.sosSecondaryButton} onPress={() => setSosStage('type')}>
                        <Text style={styles.sosSecondaryText}>Back</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {sosStage === 'countdown' && (
                    <>
                      <Text style={styles.sosStepTitle}>SOS sending in</Text>
                      <Text style={styles.sosCountdownText}>{countdownValue}</Text>
                      <Text style={styles.sosStepSubtitle}>You can cancel before the alert is sent.</Text>
                      <TouchableOpacity
                        style={[styles.sosButton, styles.sosCancelCountdownButton]}
                        onPress={handleCancelSOSCountdown}
                      >
                        <Text style={styles.sosButtonMainText}>CANCEL SOS</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 90,
    right: 16,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingButtonEmergency: {
    shadowColor: '#E53935',
    shadowOpacity: 0.4,
  },
  floatingButtonActiveSOS: {
    shadowColor: '#E53935',
    shadowOpacity: 0.6,
  },
  glassBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  glassBackgroundEmergency: {
    backgroundColor: '#FF3B30',
  },
  glassBackgroundActiveSOS: {
    backgroundColor: '#E53935',
  },
  redDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E53935',
  },
  communityRequestsDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#7C3AED',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentWrapper: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
    maxHeight: SCREEN_HEIGHT * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  countdownModalContent: {
    backgroundColor: '#FFCDD2',
  },
  modalScrollContent: {
    paddingBottom: SPACING.xl,
  },
  countdownOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.35)',
  },
  activeSosLink: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  activeSosLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  // Active SOS Card
  activeSosCard: {
    backgroundColor: '#E53935',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  activeSosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activeSosTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  activeSosLocation: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  activeSosStatus: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  activeSosResponders: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  sosButtonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sosMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  sosResolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43A047',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  sosCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Active Help Request
  activeHelpCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  activeHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  helpTypeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  activeHelpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeHelpType: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  activeHelpUrgency: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  stopHelpButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  stopHelpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  // Gita Card
  gitaCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  gitaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gitaIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  gitaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  gitaSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  gitaSanskrit: {
    fontSize: 13,
    color: '#2E7D32',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  gitaTranslationScroll: {
    maxHeight: 150,
    backgroundColor: '#F9F9F9',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  gitaTranslation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'left',
  },
  // Compact Gita Card
  gitaCardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gitaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  gitaIconBgSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  gitaInfo: {
    flex: 1,
  },
  gitaTitleCompact: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  gitaSanskritCompact: {
    fontSize: 14,
    color: '#2E7D32',
    fontStyle: 'italic',
    marginTop: 2,
  },
  gitaDropdownContent: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  utilityGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledUtilityCard: {
    opacity: 0.55,
  },
  utilityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  utilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  utilitySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  mediumDetail: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  festivalRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  festivalCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  festivalCardCompact: {
    flex: 2,
    marginBottom: 0,
  },
  festivalBar: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  festivalBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  festivalInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  festivalTitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  festivalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  festivalDays: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  festivalDaysText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  libraryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  libraryButtonTitle: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  passportButton: {
    flex: 1,
    backgroundColor: '#FFF9C4',
    borderRadius: 16,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passportButtonTitle: {
    color: '#B8860B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  festivalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  festivalContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  // SOS Card
  sosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sosIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
  sosDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  sosButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  sosButtonMainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.sm,
    letterSpacing: 1,
  },
  sosButtonDisabled: {
    opacity: 0.55,
  },
  sosSecondaryButton: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  sosSecondaryText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sosStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sosStepSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  sosHoldButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosHoldButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sosHoldProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  sosHoldProgressFill: {
    height: 6,
    backgroundColor: '#FFFFFF',
  },
  sosTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sosTypeButton: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xs,
  },
  sosTypeButtonSelected: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  sosTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sosTypeButtonTextSelected: {
    color: '#FFFFFF',
  },
  sosFetchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sosLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error,
  },
  sosLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: SPACING.xs,
  },
  sosLocationButtonFetched: {
    backgroundColor: COLORS.success,
  },
  sosLocationLink: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  sosLocationLinkText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
  },
  sosLocationStatus: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  sosInput: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.divider,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  sosCountdownText: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  sosCancelCountdownButton: {
    backgroundColor: '#B71C1C',
  },
  sosNote: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  nearbySOSSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbySOSCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  nearbySOSHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nearbySOSTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  nearbySOSDistance: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  nearbySOSLocation: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  nearbySOSActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  nearbySOSMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Community Requests Section
  communityRequestsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
  },
  communityRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  communityRequestCardFulfilled: {
    borderColor: COLORS.success,
    backgroundColor: `${COLORS.success}10`,
  },
  communityRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  requestTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  communityRequestType: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  fulfilledText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 2,
  },
  communityRequestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  communityRequestDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  communityRequestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityRequestMeta: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: `${COLORS.success}15`,
    borderRadius: BORDER_RADIUS.sm,
  },
  resolveButtonText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
});
