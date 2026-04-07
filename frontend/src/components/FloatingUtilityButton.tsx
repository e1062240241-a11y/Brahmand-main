import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  resolveCommunityRequest
} from '../services/api';
import * as Location from 'expo-location';
import LocationService from '../services/location';

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

// Temporarily disable remote Panchang API calls during dev to avoid 403/auth issues.
const getPanchangData = async () => {
  return null;
};

const getFestivalsData = async () => {
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
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSOSLoading] = useState(false);
  const { activeRequest, fetchActiveRequest, resolveRequest, hasActiveRequest } = useHelpRequestStore();
  
  // SOS state
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [nearbySOSCount, setNearbySOSCount] = useState(0);
  
  // Community requests state
  const [myCommunityRequests, setMyCommunityRequests] = useState<any[]>([]);
  const [communityRequestLoading, setCommunityRequestLoading] = useState(false);
  const [communityRequestsExpanded, setCommunityRequestsExpanded] = useState(true);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  
  // Spiritual data
  const [wisdom, setWisdom] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [nextFestival, setNextFestival] = useState<any>(null);
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

  const checkSOSStatus = async () => {
    try {
      // Check for user's active SOS
      const mySOSRes = await getMySOSAlert();
      setActiveSOS(mySOSRes.data);

      // Check for nearby SOS alerts
      const ok = await LocationService.ensureForegroundPermission();
      if (ok) {
        const location = await LocationService.getCurrentPosition({});
        const nearbyRes = await getActiveSOSAlerts({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          radius: 10
        });
        // Don't count user's own SOS
        const otherSOS = (nearbyRes.data || []).filter((s: any) => s.id !== mySOSRes.data?.id);
        setNearbySOSCount(otherSOS.length);
      }
    } catch (error) {
      console.error('Error checking SOS status:', error);
    }
  };

  const loadInitialUtilityData = async () => {
    // Always fetch fresh community requests when opening modal
    fetchMyCommunityRequests();

    if (hasLoadedData) return;

    await Promise.allSettled([
      fetchActiveRequest(),
      loadUtilityData(),
      checkSOSStatus(),
    ]);
    setHasLoadedData(true);
  };

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

  const handleCreateSOS = async () => {
    Alert.alert(
      'Emergency SOS',
      'This will alert nearby community members with your location. Are you sure you need emergency help?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'SEND SOS', 
          style: 'destructive', 
          onPress: async () => {
            setSOSLoading(true);
            try {
              const ok = await LocationService.ensureForegroundPermission();
              if (!ok) {
                Alert.alert('Location Required', 'Please enable location to send SOS alert');
                return;
              }

              const location = await LocationService.getCurrentPosition({});
              
              const response = await createSOSAlert({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              });
              
              setActiveSOS(response.data);
              Alert.alert('SOS Alert Sent', 'Your emergency alert has been sent to nearby community members. Stay safe!');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to send SOS alert');
            } finally {
              setSOSLoading(false);
            }
          }
        }
      ]
    );
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
        { transform: [{ scale: hasNearbyEmergency ? pulseAnim : 1 }] }
      ]}>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            hasNearbyEmergency && styles.floatingButtonEmergency,
            activeSOS && styles.floatingButtonActiveSOS
          ]}
          onPress={() => {
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
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.overlayBackground} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalTitle}>Sanatan Utilities</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Active SOS Section */}
              {activeSOS && (
                <View style={styles.activeSosCard}>
                  <View style={styles.activeSosHeader}>
                    <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.activeSosTitle}>YOUR SOS IS ACTIVE</Text>
                  </View>
                  <Text style={styles.activeSosLocation}>
                    Location: {activeSOS.area}, {activeSOS.city}
                  </Text>
                  {activeSOS.responders?.length > 0 && (
                    <Text style={styles.activeSosResponders}>
                      {activeSOS.responders.length} people responding
                    </Text>
                  )}
                  
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

              {/* Gita Slok Card */}
              <View style={styles.gitaCard}>
                <View style={styles.gitaHeader}>
                  <View style={styles.gitaIconBg}>
                    <Ionicons name="book" size={24} color={COLORS.success} />
                  </View>
                  <View>
                    <Text style={styles.gitaTitle}>Bhagavad Gita</Text>
                    <Text style={styles.gitaSubtitle}>
                      {wisdom?.gitaShloka 
                        ? `Chapter ${wisdom.gitaShloka.chapter}, Verse ${wisdom.gitaShloka.verse}`
                        : wisdom?.chapter 
                          ? `Chapter ${wisdom.chapter}, Verse ${wisdom.verse}` 
                          : 'Daily Wisdom'
                      }
                    </Text>
                  </View>
                </View>
                <Text style={styles.gitaSanskrit}>
                  {wisdom?.gitaShloka?.slok || wisdom?.sanskrit || 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।'}
                </Text>
                <ScrollView 
                  style={styles.gitaTranslationScroll} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  indicatorStyle="black"
                  scrollEventThrottle={16}
                >
                  <Text style={styles.gitaTranslation}>
                    {wisdom?.gitaShloka?.translation || wisdom?.translation || wisdom?.quote || 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.'}
                  </Text>
                </ScrollView>
              </View>

              {/* Utility Shortcuts */}
              <View style={styles.utilityGrid}>
                <TouchableOpacity 
                  style={styles.utilityCard}
                  onPress={openPanchangWithLocation}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#FFE5CC' }]}>
                    <Ionicons name="calendar" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.utilityTitle}>Panchang</Text>
                  <Text style={styles.utilitySubtitle}>{panchang?.tithi || 'Loading...'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.utilityCard}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/astrology?mode=horoscope');
                  }}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="star" size={20} color={COLORS.info} />
                  </View>
                  <Text style={styles.utilityTitle}>Horoscope</Text>
                  <Text style={styles.utilitySubtitle}>Birth profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.utilityCard}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/astrology?mode=kundli');
                  }}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="planet" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.utilityTitle}>Kundli</Text>
                  <Text style={styles.utilitySubtitle}>Planet view</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.festivalCard}>
                <View style={styles.festivalHeader}>
                  <View style={[styles.utilityIconBg, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="sparkles" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.festivalContent}>
                    <Text style={styles.utilityTitle}>Next Festival</Text>
                    <Text style={styles.utilitySubtitle}>{nextFestival?.name || 'Loading...'}</Text>
                  </View>
                </View>
                <Text style={styles.mediumDetail}>
                  {nextFestival?.days_until !== undefined ? `Starts in ${nextFestival.days_until} days` : ''}
                </Text>
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
                  
                  <Text style={styles.sosDescription}>
                    Use this if you need urgent help. This will instantly alert nearby community members with your location.
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
                        <Text style={styles.sosButtonMainText}>SEND SOS</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.sosNote}>
                    Your location will be shared to help people reach you faster.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: 'rgba(200, 200, 200, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassBackgroundEmergency: {
    backgroundColor: '#E53935',
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
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
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
  activeSosResponders: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  sosButtonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  utilityGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  utilityIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  utilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  utilitySubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  mediumDetail: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  festivalCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
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
    backgroundColor: '#FFF5F5',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
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
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
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
  sosNote: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  // Community Requests Section
  communityRequestsSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  communityRequestCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
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
