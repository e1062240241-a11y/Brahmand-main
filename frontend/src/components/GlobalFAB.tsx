// accessibility: placeholder
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ImageBackground,
  PanResponder,
  Dimensions,
  DeviceEventEmitter,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMySOSAlert, resolveSOSAlert, getActiveSOSAlerts, respondToSOS } from '../services/api';
import { useTranslation } from '../utils/i18n';
import LocationService from '../services/location';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';

export function GlobalFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabScale = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;
  const fabItemAnims = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [nearbySOSAlerts, setNearbySOSAlerts] = useState<any[]>([]);
  const [isResponding, setIsResponding] = useState(false);

  const checkSOSStatus = useCallback(async () => {
    try {
      const res = await getMySOSAlert();
      setActiveSOS(res.data);

      let lat = undefined;
      let lng = undefined;
      try {
        const ok = await LocationService.ensureForegroundPermission();
        if (ok) {
          const location = await LocationService.getCurrentPosition({});
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        }
      } catch (locErr) {
        console.warn('Location fetch failed in SOS check:', locErr);
      }

      // Always fetch nearby alerts, even without location
      const params: any = { radius: 10000 };
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      
      const nearbyRes = await getActiveSOSAlerts(params);
      const otherSOS = (nearbyRes.data || []).filter((s: any) => s.id !== res.data?.id);
      setNearbySOSAlerts(otherSOS);

    } catch (e) {
      console.error('Failed to check SOS status:', e);
    }
  }, []);

  const handleRespondToSOS = async (sosId: string) => {
    if (isResponding) return;
    setIsResponding(true);
    try {
      await respondToSOS(sosId, 'coming');
      const sos = nearbySOSAlerts.find(s => s.id === sosId);
      if (sos?.latitude && sos?.longitude) {
        await Linking.openURL(`https://maps.google.com/?q=${sos.latitude},${sos.longitude}`);
      }
      Alert.alert('Dhanyawad!', 'The creator has been notified that you are on the way.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to respond to SOS');
    } finally {
      setIsResponding(false);
    }
  };

  // Poll & Listen for Realtime SOS events
  useEffect(() => {
    if (!user?.id) return;

    checkSOSStatus();

    const handleSOSAlert = () => {
      checkSOSStatus();
    };
    const handleSOSResponse = () => {
      checkSOSStatus();
    };

    socketService.onEvent('sos_alert', handleSOSAlert);
    socketService.onEvent('sos_response', handleSOSResponse);

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkSOSStatus();
      }
    }, 10000);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkSOSStatus();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      socketService.offEvent('sos_alert', handleSOSAlert);
      socketService.offEvent('sos_response', handleSOSResponse);
    };
  }, [checkSOSStatus, user?.id]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('open_sos_modal', () => {
      setFabExpanded(true);
      Animated.parallel([
        Animated.spring(fabScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(fabRotation, { toValue: 1, duration: 300, useNativeDriver: true }),
        ...fabItemAnims.map((anim, i) =>
          Animated.spring(anim, { toValue: 1, friction: 5, tension: 50, delay: i * 40, useNativeDriver: true })
        ),
      ]).start();
      checkSOSStatus();
    });

    // Check for pending SOS from background notification
    if ((window as any).__PENDING_SOS) {
      setTimeout(() => {
        DeviceEventEmitter.emit('open_sos_modal');
        (window as any).__PENDING_SOS = null;
      }, 500);
    }

    return () => sub.remove();
  }, [fabScale, fabRotation, fabItemAnims, checkSOSStatus]);

  const handleResolveActiveSOS = async (status: 'resolved' | 'cancelled') => {
    if (!activeSOS?.id) return;
    if (status === 'cancelled') {
      try {
        await resolveSOSAlert(activeSOS.id, status);
        setActiveSOS(null);
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel SOS');
      }
      return;
    }
    Alert.alert(
      'Help Received',
      'Confirm this action?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: async () => {
            try {
              await resolveSOSAlert(activeSOS.id, status);
              setActiveSOS(null);
            } catch (error) {}
          }
        }
      ]
    );
  };

  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Claim responder only if the user drags
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const toggleFab = useCallback(() => {
    const toOpen = !fabExpanded;
    setFabExpanded(toOpen);
    if (toOpen) {
      Animated.parallel([
        Animated.spring(fabScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(fabRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        ...fabItemAnims.map((anim, i) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 50,
            delay: i * 40,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fabRotation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...fabItemAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [fabExpanded, fabScale, fabRotation, fabItemAnims]);

  // Do not show FAB on authentication screens
  if (!pathname || pathname === '/' || pathname === '/index' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      {/* ─── Floating Action Button (FAB) Overlay ─── */}
      {fabExpanded && (
        <TouchableOpacity
          style={fabStyles.overlay}
          activeOpacity={1}
          onPress={toggleFab}
        >
          <Animated.View
            style={[
              fabStyles.menuContainer,
              {
                transform: [{ scale: fabScale }],
                opacity: fabScale,
              },
            ]}
          >
            {/* Outer decorative ring */}
            <View style={[fabStyles.outerRing, (activeSOS || nearbySOSAlerts.length > 0) && { backgroundColor: '#FFEBEE' }]}>
              {/* Inner circle with items */}
              <View style={[fabStyles.innerCircle, (activeSOS || nearbySOSAlerts.length > 0) && { backgroundColor: '#D32F2F' }]}>
                {/* Decorative dotted ring */}
                <View style={[fabStyles.dottedRing, (activeSOS || nearbySOSAlerts.length > 0) && { borderColor: 'rgba(255, 255, 255, 0.2)' }]} />

                {/* Menu items arranged in a circle */}
                {[
                  { label: 'Festival', icon: 'calendar-outline' as const, route: '/festivals' },
                  { label: 'Kundli', icon: 'planet-outline' as const, route: '/astrology' },
                  { label: 'Brahmand\nPassport', icon: 'compass-outline' as const, route: '/passport' },
                  { label: 'My Krishna', icon: 'heart-outline' as const, route: '/my-krishna' },
                  { label: 'Panchang', icon: 'today-outline' as const, route: '/panchang' },
                  { label: 'Brahmand\nLibrary', icon: 'library-outline' as const, route: '/library' },
                  { label: 'Jyotish', icon: 'star-outline' as const, route: '/horoscope' },
                ].map((item, index) => {
                  // Position items in a circle (7 items, starting from top)
                  const totalItems = 7;
                  const angleStep = (2 * Math.PI) / totalItems;
                  const startAngle = -Math.PI / 2; // Start from top
                  const angle = startAngle + index * angleStep;
                  const radius = 120;
                  const centerX = 180 - 40; // center of 360 - half of 80
                  const centerY = 180 - 40 - 15; // Shift up by 15px for visual centering with text
                  const x = centerX + radius * Math.cos(angle);
                  const y = centerY + radius * Math.sin(angle);

                  return (
                    <Animated.View
                      key={item.label}
                      style={[
                        fabStyles.menuItem,
                        {
                          left: x,
                          top: y,
                          transform: [{ scale: fabItemAnims[index] }],
                          opacity: (activeSOS || nearbySOSAlerts.length > 0) ? 0.35 : fabItemAnims[index],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          fabStyles.menuItemButton,
                          { backgroundColor: 'transparent', shadowOpacity: 0 }
                        ]}
                        activeOpacity={0.8}
                        disabled={!!(activeSOS || nearbySOSAlerts.length > 0)}
                        onPress={() => {
                          toggleFab();
                          setTimeout(() => {
                            router.push(item.route as any);
                          }, 200);
                        }}
                      >
                        {item.label === 'My Krishna' ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ExpoImage source={require('../../assets/images/tab bar/my_krishna.png')} style={{ width: 80, height: 80 }} contentFit="contain" />
                          </ImageBackground>
                        ) : item.label === 'Festival' ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/custom_festival_icon_2.png')} style={{ width: 54, height: 54 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Kundli' ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/tab bar/hand_eye_phosphor.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label.includes('Passport') ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/custom_passport_icon.png')} style={{ width: 72, height: 72 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Panchang' ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/panchang_icon_3.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label.includes('Library') ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/library_icon_3.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Jyotish' ? (
                          <ImageBackground source={require('../../assets/images/tab bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/tab bar/siren_phosphor2.png')} style={{ width: 42, height: 42 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : (
                          <Ionicons name={item.icon as any} size={28} color="#FFF" />
                        )}
                      </TouchableOpacity>
                      <Text style={[fabStyles.menuItemLabel, (activeSOS || nearbySOSAlerts.length > 0) && { color: '#FFF' }]}>
                        {item.label}
                      </Text>
                    </Animated.View>
                  );
                })}

                {/* Center Content */}
                {activeSOS ? (
                  <View style={[StyleSheet.absoluteFill, fabStyles.sosActiveView]}>
                    <View style={fabStyles.sosHeader}>
                      <View style={fabStyles.sosCircleIcon}>
                        <Text style={fabStyles.sosHeaderText}>SOS</Text>
                      </View>
                      <Text style={fabStyles.sosActiveTitle}>{t('yourSosIsActive') || 'YOUR SOS IS ACTIVE'}</Text>
                      <Text style={fabStyles.sosActiveSub}>{t('sosActiveSub') || 'We are notifying nearby users and keeping you safe.'}</Text>
                    </View>
                    <View style={fabStyles.centerGuruContainerSOS}>
                      <View style={fabStyles.guruImageWrapperSOS}>
                        <ExpoImage source={require('../../assets/images/tab bar/my_krishna.png')} style={fabStyles.guruImage} contentFit="cover" />
                      </View>
                    </View>
                    <View style={fabStyles.sosStatusCard}>
                      <View style={fabStyles.sosStatusHeader}>
                        <View style={fabStyles.peopleIconBox}>
                          <Ionicons name="people" size={24} color="#FFF" />
                        </View>
                        <View style={fabStyles.sosStatusTextCol}>
                          <Text style={fabStyles.sosStatusTitle}>{(activeSOS.responders?.length || 0)} {(activeSOS.responders?.length === 1) ? (t('personIs') || 'PERSON IS') : (t('peopleAre') || 'PEOPLE ARE')}</Text>
                          <Text style={fabStyles.sosStatusTitle}>{t('comingToHelpYou') || 'COMING TO HELP YOU'}</Text>
                          <View style={fabStyles.sosVerifiedRow}>
                            <Ionicons name="checkmark-circle" size={12} color="#FFD54F" />
                            <Text style={fabStyles.sosVerifiedText}>{(activeSOS.responders?.length || 0)} {t('respondersConfirmed') || 'responders confirmed nearby'}</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={fabStyles.receivedHelpBtn}
                        onPress={() => handleResolveActiveSOS('resolved')}
                      >
                        <View style={fabStyles.receivedHelpCheck}>
                          <Ionicons name="checkmark" size={18} color="#D32F2F" />
                        </View>
                        <Text style={fabStyles.receivedHelpText}>{t('receivedHelp') || 'I HAVE RECEIVED HELP'}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={fabStyles.cancelSOSLink} onPress={() => handleResolveActiveSOS('cancelled')}>
                      <Text style={fabStyles.cancelSOSText}>{t('cancelSOS') || 'Cancel SOS'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : nearbySOSAlerts.length > 0 ? (
                  <View style={[StyleSheet.absoluteFill, fabStyles.sosActiveView]}>
                    <View style={fabStyles.sosHeader}>
                      <View style={fabStyles.alertIconCircle}>
                        <MaterialCommunityIcons name="alarm-light" size={24} color="#D32F2F" />
                      </View>
                      <Text style={fabStyles.sosActiveTitle}>{t('sosAlert') || 'SOS ALERT'}</Text>
                      <Text style={fabStyles.sosActiveSub}>{t('someoneNeedsHelp') || 'Someone nearby needs help'}</Text>
                      <Text style={fabStyles.sosAlertHighlight}>{t('nearestToRespond') || 'You are the nearest to respond'}</Text>
                    </View>

                    <View style={fabStyles.victimCard}>
                      <View style={fabStyles.victimRow}>
                        <View style={fabStyles.victimAvatarBox}>
                          {nearbySOSAlerts[0].creator_image || nearbySOSAlerts[0].user_photo ? (
                            <Image source={{ uri: nearbySOSAlerts[0].creator_image || nearbySOSAlerts[0].user_photo }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                          ) : (
                            <Ionicons name="person" size={30} color="#DDD" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={fabStyles.victimName}>{nearbySOSAlerts[0].creator_name || nearbySOSAlerts[0].user_name || 'Unknown'}</Text>
                          <View style={fabStyles.victimTypeRow}>
                            <MaterialCommunityIcons name="medical-bag" size={14} color="#D32F2F" />
                            <Text style={fabStyles.victimTypeText}>{nearbySOSAlerts[0].emergency_type?.toUpperCase() || 'EMERGENCY'}</Text>
                          </View>
                          <View style={fabStyles.victimLocRow}>
                            <Ionicons name="location-outline" size={12} color="#999" />
                            <Text style={fabStyles.victimLocText} numberOfLines={1}>{nearbySOSAlerts[0].micro_location || 'Nearby location'}</Text>
                          </View>
                          <View style={fabStyles.victimLocRow}>
                            <MaterialCommunityIcons name="target" size={12} color="#999" />
                            <Text style={fabStyles.victimLocText}>{nearbySOSAlerts[0].distance?.toFixed(2) || '?'} km away</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={fabStyles.responderActionRow}>
                      {nearbySOSAlerts[0].responders?.some((r: any) => r.user_id === user?.id) ? (
                        <TouchableOpacity
                          style={[fabStyles.responderBtn, { backgroundColor: '#388E3C' }]}
                          disabled={true}
                        >
                          <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                          <Text style={fabStyles.responderBtnText}>{"ON THE WAY"}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[fabStyles.responderBtn, { backgroundColor: '#4CAF50' }, isResponding && { opacity: 0.7 }]}
                          onPress={() => handleRespondToSOS(nearbySOSAlerts[0].id)}
                          disabled={isResponding}
                        >
                          {isResponding ? (
                            <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="walk" size={22} color="#FFF" />
                              <Text style={fabStyles.responderBtnText}>{"I'M ON\nMY WAY"}</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[fabStyles.responderBtn, { backgroundColor: '#FF9800' }]}
                        onPress={() => {
                          const phone = nearbySOSAlerts[0].creator_phone || nearbySOSAlerts[0].phone || nearbySOSAlerts[0].phone_number || '';
                          if (!phone) { Alert.alert('Not Available', 'Phone number not provided.'); return; }
                          Linking.openURL(`tel:${phone}`);
                        }}
                      >
                        <Ionicons name="call" size={22} color="#FFF" />
                        <Text style={fabStyles.responderBtnText}>CALL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[fabStyles.responderBtn, { backgroundColor: '#2196F3' }]}
                        onPress={() => {
                          const s = nearbySOSAlerts[0];
                          if (s?.latitude && s?.longitude) {
                            Linking.openURL(`https://maps.google.com/?q=${s.latitude},${s.longitude}`);
                          } else {
                            Alert.alert('Location Not Available', 'This SOS has no coordinate details.');
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="navigation" size={22} color="#FFF" />
                        <Text style={fabStyles.responderBtnText}>MAP</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={fabStyles.cancelSOSLink} onPress={toggleFab}>
                      <Text style={fabStyles.cancelSOSText}>Close Alert</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Animated.View
                    style={[
                      fabStyles.centerButton,
                      {
                        transform: [{ scale: fabItemAnims[7] }],
                        opacity: fabItemAnims[7],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={fabStyles.centerButtonInner}
                      activeOpacity={0.85}
                      onPress={() => {
                        toggleFab();
                        setTimeout(() => {
                          router.push('/sos');
                        }, 200);
                      }}
                    >
                      <Image
                        source={require('../../assets/images/sos_icon_3.png')}
                        style={{ width: 102, height: 102, borderRadius: 51, alignSelf: 'center' }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <Text style={fabStyles.centerLabel}>SOS</Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* FAB trigger button */}
      <Animated.View
        style={[
          fabStyles.fab,
          { bottom: 90 + insets.bottom },
          { transform: pan.getTranslateTransform() },
          fabExpanded && { opacity: 0 },
          (activeSOS || nearbySOSAlerts.length > 0) && { backgroundColor: '#D32F2F', borderColor: '#FFCDD2' }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={0.85}
          onPress={toggleFab}
        >
          {activeSOS || nearbySOSAlerts.length > 0 ? (
            <MaterialCommunityIcons name="alarm-light" size={30} color="#FFF" />
          ) : (
            <ExpoImage
              source={require('../../assets/images/tab bar/my_krishna.png')}
              style={fabStyles.fabIcon}
              contentFit="cover"
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const fabStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 99999, // Ensure very high z-index
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 99,
  },
  menuContainer: {
    width: 380,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#FFD5B8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  innerCircle: {
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#FFEEE7',
    position: 'relative',
  },
  dottedRing: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 0, 0.15)',
    borderStyle: 'dashed',
  },
  menuItem: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
  },
  menuItemButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItemSos: {
    backgroundColor: '#FF0000',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  menuItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
  centerButton: {
    position: 'absolute',
    left: 126,
    top: 112,
    alignItems: 'center',
    width: 108,
  },
  centerButtonInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFD5B8',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 100, // Make elevation very high for persistent visibility
    zIndex: 99999, // Super high zIndex
    borderWidth: 3,
    borderColor: '#FFD5B8',
  },
  fabIcon: {
    width: 50,
    height: 50,
  },
  sosActiveView: { alignItems: 'center', padding: 12, justifyContent: 'center' },
  sosHeader: { alignItems: 'center', marginTop: -10 },
  sosCircleIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  sosHeaderText: { color: '#D32F2F', fontWeight: '900', fontSize: 16 },
  sosActiveTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  sosActiveSub: { color: '#FFCDD2', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 },
  centerGuruContainerSOS: { marginTop: 12, alignItems: 'center' },
  guruImageWrapperSOS: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: '#FFF', overflow: 'hidden' },
  guruImage: { width: '100%', height: '100%' },
  sosStatusCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginTop: 16, width: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sosStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  peopleIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sosStatusTextCol: { flex: 1 },
  sosStatusTitle: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  sosVerifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sosVerifiedText: { color: '#FFD54F', fontSize: 10, marginLeft: 4, fontWeight: '600' },
  receivedHelpBtn: { backgroundColor: '#FFF', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  receivedHelpCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  receivedHelpText: { color: '#D32F2F', fontSize: 12, fontWeight: '800' },
  cancelSOSLink: { marginTop: 12, padding: 8 },
  cancelSOSText: { color: '#FFCDD2', fontSize: 12, textDecorationLine: 'underline', fontWeight: '600' },
  alertIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sosAlertHighlight: { color: '#FFD54F', fontSize: 11, fontWeight: '700', marginTop: 4 },
  victimCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, marginTop: 10, width: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  victimRow: { flexDirection: 'row', alignItems: 'center' },
  victimAvatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  victimName: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  victimTypeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  victimTypeText: { color: '#FFCDD2', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  victimLocRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  victimLocText: { color: '#FFCDD2', fontSize: 10, marginLeft: 4 },
  responderActionRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10, width: '85%' },
  responderBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  responderBtnText: { color: '#FFF', fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 2 },
});
