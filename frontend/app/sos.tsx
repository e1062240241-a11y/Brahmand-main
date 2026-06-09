import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView, Linking, Vibration, Animated, DeviceEventEmitter } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import SOSMap from '../src/components/SOSMap';
import { LocationPickerModal, LocationData } from '../src/components/LocationPickerModal';


import { useAuthStore } from '../src/store/authStore';
import { createSOSAlert, resolveMyActiveSOS, getMySOSAlert, reverseGeocode } from '../src/services/api';

const { width } = Dimensions.get('window');

// Robust Promise wrappers with hard Javascript timeouts to prevent native Expo hanging bugs
const getCurrentPositionWithTimeout = async (options: any, timeoutMs: number): Promise<Location.LocationObject> => {
  return Promise.race([
    Location.getCurrentPositionAsync(options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GPS_TIMEOUT')), timeoutMs)
    )
  ]);
};

const getLastKnownPositionWithTimeout = async (timeoutMs: number): Promise<Location.LocationObject | null> => {
  return Promise.race([
    Location.getLastKnownPositionAsync(),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    )
  ]);
};

const reverseGeocodeWithTimeout = async (
  coords: { latitude: number; longitude: number },
  timeoutMs: number
 ): Promise<Location.LocationGeocodedAddress[]> => {
  return Promise.race([
    Location.reverseGeocodeAsync(coords),
    new Promise<Location.LocationGeocodedAddress[]>((resolve) =>
      setTimeout(() => resolve([]), timeoutMs)
    )
  ]);
};

const SOS_TYPES = [
  { label: 'Safety', value: 'safety', icon: 'shield-checkmark' },
  { label: 'Medical', value: 'medical', icon: 'medkit' },
  { label: 'Accident', value: 'accident', icon: 'car-sport' },
  { label: 'Other', value: 'other', icon: 'warning' },
];

export default function SOSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [stage, setStage] = useState<'type' | 'location' | 'countdown' | 'activating' | 'active'>('type');
  const [emergencyType, setEmergencyType] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsErrorType, setGpsErrorType] = useState<'permission' | 'disabled' | 'timeout' | null>(null);
  const [microLocation, setMicroLocation] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [loadingText, setLoadingText] = useState<string>('Sending SOS Alert...');
  const [existingSOS, setExistingSOS] = useState<any>(null);
  const [resolving, setResolving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleConfirmManualLocation = (locData: LocationData) => {
    if (locData.latitude && locData.longitude) {
      setLocation({
        coords: {
          latitude: locData.latitude,
          longitude: locData.longitude,
          altitude: null,
          accuracy: 1.0,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      const parts = [locData.area, locData.city, locData.state].filter(Boolean);
      setMicroLocation(parts.join(', ') || locData.display_name || '');
      setGpsErrorType(null);
    }
    setPickerVisible(false);
  };

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage === 'activating') {
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);

      const createAnim = (val: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim = Animated.parallel([
        createAnim(pulse1, 0),
        createAnim(pulse2, 600),
        createAnim(pulse3, 1200),
      ]);
      anim.start();

      return () => {
        anim.stop();
      };
    }
  }, [stage]);

  const handleBack = () => {
    if (stage === 'location' || stage === 'countdown') {
      setStage('type');
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const fetchLiveLocation = async (showAlerts = true): Promise<boolean> => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsErrorType('permission');
        if (showAlerts) {
          Alert.alert('Permission Denied', 'Location permissions are required to detect your real-time coordinates for SOS.');
        }
        return false;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setGpsErrorType('disabled');
        if (showAlerts) {
          Alert.alert('GPS Disabled', 'Location services are disabled on your device. Please turn on GPS.');
        }
        return false;
      }

      let loc: Location.LocationObject | null = null;
      try {
        loc = await getCurrentPositionWithTimeout({
          accuracy: Location.Accuracy.High,
        }, 5000);
      } catch (e1) {
        console.warn('[SOS] Current position fetch timed out, trying balanced...');
        try {
          loc = await getCurrentPositionWithTimeout({
            accuracy: Location.Accuracy.Balanced,
          }, 3000);
        } catch (e2) {}
      }

      if (!loc) {
        loc = await getLastKnownPositionWithTimeout(2000);
      }

      if (loc) {
        setLocation(loc);
        setGpsErrorType(null);
        try {
          const results = await reverseGeocodeWithTimeout({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          }, 3000);
          
          if (results.length > 0) {
            const place = results[0] as any;
            const parts = [
              place.name || place.street,
              place.subLocality || place.district,
              place.city,
            ].filter(Boolean);
            setMicroLocation(parts.join(', ') || '');
          }
        } catch (e) {
          console.warn('[SOS] Reverse geocoding failed', e);
        }
        return true;
      } else {
        setGpsErrorType('timeout');
        if (showAlerts) {
          Alert.alert('GPS Timeout', 'Could not fetch a strong GPS signal. Please retry in an open area.');
        }
        return false;
      }
    } catch (err) {
      console.warn('Location setup failed', err);
      setGpsErrorType('timeout');
      if (showAlerts) {
        Alert.alert('GPS Error', 'An unexpected error occurred while fetching your location.');
      }
      return false;
    }
  };

  useEffect(() => {
    // Attempt silent real-time location fetch on mount
    fetchLiveLocation(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMySOSAlert();
        if (res.data) {
          setExistingSOS(res.data);
          setStage('active');
        }
      } catch (_) {}
    })();
  }, []);

  const handleCancelExistingSOS = async () => {
    setResolving(true);
    try {
      await resolveMyActiveSOS('cancelled');
      setExistingSOS(null);
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel SOS');
      return false;
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'countdown' && countdown > 0) {
      if (countdown === 10) {
        Vibration.vibrate([0, 500, 200, 500, 200], true);
      }
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (stage === 'countdown' && countdown === 0) {
      Vibration.cancel();
      executeSOS();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage, countdown]);

  const handleContinueToLocation = async (type?: string) => {
    const activeType = type || emergencyType;
    if (!activeType) {
      Alert.alert('Select Type', 'Please select an emergency type to continue.');
      return;
    }
    
    setLoadingText('Detecting live location...');
    setStage('activating');
    
    await fetchLiveLocation(true);
    
    setStage('location');
  };

  const handleRetryLocation = async () => {
    setLoadingText('Retrying GPS Detection...');
    setStage('activating');
    await fetchLiveLocation(true);
    setStage('location');
  };

  const handleStartCountdown = () => {
    if (!location) {
      Alert.alert('Location Required', 'SOS feature requires location access.');
      return;
    }
    setCountdown(10);
    setStage('countdown');
  };

  const executeSOS = async () => {
    if (!location) {
      Alert.alert('Location Error', 'Location is not available. Please try again.');
      setStage('location');
      return;
    }
    setLoadingText('Sending SOS Alert...');
    setStage('activating');
    
    try {
      await createSOSAlert({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        emergency_type: emergencyType,
        micro_location: microLocation || '',
      });
      
      Vibration.vibrate(1000);

      DeviceEventEmitter.emit('open_sos_modal');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Vibration.cancel();
      setStage('location');
      const errorMsg = e.response?.data?.detail || e.message || 'Could not activate SOS. Please ensure you have internet connection or try calling emergency services.';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleCancelCountdown = () => {
    Vibration.cancel();
    setStage('location');
    setCountdown(10);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        style={styles.content}
      >
        {stage === 'type' && (
          <>
            <View style={styles.warningContainer}>
              <View style={styles.warningIconBg}>
                <Ionicons name="alert" size={40} color="#FF3B30" />
              </View>
              <Text style={styles.warningTitle}>Confirm Emergency Type</Text>
              <Text style={styles.warningText}>
                Please select the nature of your emergency to notify nearby Sanatan Lok members effectively.
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              {SOS_TYPES.map((option) => {
                const isSelected = emergencyType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.typeOption,
                      isSelected && styles.typeOptionSelected
                    ]}
                    onPress={() => {
                      setEmergencyType(option.value);
                      // Auto-continue to location stage after selection
                      setTimeout(() => {
                        handleContinueToLocation(option.value);
                      }, 400);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={isSelected ? '#FF3B30' : '#666'} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      isSelected && styles.typeOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity 
              style={[styles.primaryButton, !emergencyType && styles.primaryButtonDisabled]} 
              onPress={() => handleContinueToLocation()}
              disabled={!emergencyType}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>CONTINUE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Cancel SOS</Text>
            </TouchableOpacity>
          </>
        )}

        {stage === 'location' && (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ 
              flexGrow: 1, 
              paddingBottom: Math.max(insets.bottom, 20) 
            }}
          >
            <View style={styles.mapContainer}>
              {location ? (
                <SOSMap 
                  latitude={location.coords.latitude} 
                  longitude={location.coords.longitude} 
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
                  <ActivityIndicator size="large" color="#FF3B30" />
                  <Text style={{ marginTop: 10, color: '#666' }}>Fetching your location...</Text>
                </View>
              )}
            </View>

            {location ? (
              <View style={styles.warningContainer}>
                <View style={[styles.warningIconBg, { backgroundColor: '#E5F6EB', width: 60, height: 60, marginTop: 10 }]}>
                  <Ionicons name="location" size={30} color="#34C759" />
                </View>
                <Text style={styles.warningTitle}>Location Detected</Text>
                {location.coords.accuracy && (
                  <Text style={styles.warningText}>
                    GPS Accuracy: {location.coords.accuracy.toFixed(1)}m
                  </Text>
                )}
                
                {/* Clickable Google Maps Link */}
                <TouchableOpacity 
                  style={styles.mapsLinkBtn} 
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="map-outline" size={16} color="#FF3B30" />
                  <Text style={styles.mapsLinkText}>
                    View Live GPS Link ({location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.mapsLinkBtn, { marginTop: 10, backgroundColor: '#FFF5EB', borderColor: '#FFD7C2' }]} 
                  onPress={() => setPickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-sharp" size={16} color="#FF6B00" />
                  <Text style={[styles.mapsLinkText, { color: '#FF6B00' }]}>
                    Choose Manually (Map / Search)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.warningContainer}>
                <View style={[styles.warningIconBg, { backgroundColor: '#FFF0F0', width: 60, height: 60, marginTop: 10 }]}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </View>
                
                {gpsErrorType === 'permission' && (
                  <>
                    <Text style={[styles.warningTitle, { color: '#FF3B30' }]}>Permission Denied</Text>
                    <Text style={styles.warningText}>
                      Brahmand needs Location permission to fetch your real-time position during an emergency.
                    </Text>
                    
                    <View style={styles.guideBox}>
                      <Text style={styles.guideHeader}>How to enable permission:</Text>
                      <Text style={styles.guideStep}>1. Tap 'Open Settings' button below.</Text>
                      <Text style={styles.guideStep}>2. Tap 'Permissions' or 'Location'.</Text>
                      <Text style={styles.guideStep}>3. Select 'Allow all the time' or 'While using the app'.</Text>
                    </View>

                    <View style={styles.errorBtnRow}>
                      <TouchableOpacity 
                        style={styles.actionSettingsBtn} 
                        onPress={() => Linking.openSettings()}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="settings-outline" size={16} color="#FFF" />
                        <Text style={styles.actionSettingsText}>Open Settings</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionRetryBtn} 
                        onPress={handleRetryLocation}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh" size={16} color="#FF3B30" />
                        <Text style={styles.actionRetryText}>Retry</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[styles.mapsLinkBtn, { marginTop: 15, width: '100%', justifyContent: 'center' }]} 
                      onPress={() => setPickerVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="map-outline" size={16} color="#FF3B30" />
                      <Text style={styles.mapsLinkText}>Choose Location Manually (Map / Search)</Text>
                    </TouchableOpacity>
                  </>
                )}

                {gpsErrorType === 'disabled' && (
                  <>
                    <Text style={[styles.warningTitle, { color: '#FF3B30' }]}>GPS/Location is OFF</Text>
                    <Text style={styles.warningText}>
                      Your device Location services are currently disabled. Real-time GPS is required to alert responders.
                    </Text>
                    
                    <View style={styles.guideBox}>
                      <Text style={styles.guideHeader}>How to turn on GPS:</Text>
                      {Platform.OS === 'ios' ? (
                        <>
                          <Text style={styles.guideStep}>1. Tap 'Open Settings' button below.</Text>
                          <Text style={styles.guideStep}>2. Go to Privacy & Security &rarr; Location Services.</Text>
                          <Text style={styles.guideStep}>3. Toggle the switch to ON.</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.guideStep}>1. Swipe down from the top of your screen to open Quick Panel.</Text>
                          <Text style={styles.guideStep}>2. Locate and tap the 'Location' or 'GPS' toggle to turn it ON.</Text>
                          <Text style={styles.guideStep}>3. Or tap 'Open Settings' below and toggle location services.</Text>
                        </>
                      )}
                    </View>

                    <View style={styles.errorBtnRow}>
                      <TouchableOpacity 
                        style={styles.actionSettingsBtn} 
                        onPress={() => Linking.openSettings()}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="settings-outline" size={16} color="#FFF" />
                        <Text style={styles.actionSettingsText}>Open Settings</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionRetryBtn} 
                        onPress={handleRetryLocation}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh" size={16} color="#FF3B30" />
                        <Text style={styles.actionRetryText}>Retry</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[styles.mapsLinkBtn, { marginTop: 15, width: '100%', justifyContent: 'center' }]} 
                      onPress={() => setPickerVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="map-outline" size={16} color="#FF3B30" />
                      <Text style={styles.mapsLinkText}>Choose Location Manually (Map / Search)</Text>
                    </TouchableOpacity>
                  </>
                )}

                {(gpsErrorType === 'timeout' || !gpsErrorType) && (
                  <>
                    <Text style={[styles.warningTitle, { color: '#FF3B30' }]}>GPS Signal Weak</Text>
                    <Text style={styles.warningText}>
                      We couldn't detect a strong real-time GPS signal. Please move to an open area and try again.
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.retryFetchBtn} 
                      onPress={handleRetryLocation}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={16} color="#FFF" />
                      <Text style={styles.retryFetchText}>Retry Fetching GPS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.retryFetchBtn, { backgroundColor: '#FF6B00', marginTop: 10 }]} 
                      onPress={() => setPickerVisible(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="map-outline" size={16} color="#FFF" />
                      <Text style={styles.retryFetchText}>Select Manually on Map</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Add More Detail (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter personal accurate address, landmark..."
                placeholderTextColor="#999"
                value={microLocation}
                onChangeText={setMicroLocation}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity 
              style={[styles.primaryButton, !location && styles.primaryButtonDisabled]} 
              onPress={handleStartCountdown}
              disabled={!location}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>CREATE SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {stage === 'countdown' && (
          <View style={styles.countdownContainer}>
            <View style={[styles.warningIconBg, { backgroundColor: '#FFF0F0' }]}>
              <Ionicons name="warning" size={40} color="#FF3B30" />
            </View>
            <Text style={styles.warningTitle}>SOS Sending in...</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.warningText}>
              Cancel now if this was a mistake. Your community and contacts will be alerted in {countdown} seconds.
            </Text>
            
            <View style={{ flex: 1 }} />
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelCountdown}>
              <Text style={styles.secondaryButtonText}>Cancel SOS</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'activating' && (
          <View style={styles.activatingContainer}>
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseCircle, {
                transform: [{ scale: pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
                opacity: pulse1.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.6, 0.3, 0] })
              }]} />
              <Animated.View style={[styles.pulseCircle, {
                transform: [{ scale: pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
                opacity: pulse2.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.6, 0.3, 0] })
              }]} />
              <Animated.View style={[styles.pulseCircle, {
                transform: [{ scale: pulse3.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
                opacity: pulse3.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.6, 0.3, 0] })
              }]} />
              <View style={styles.pulseCenter}>
                <Ionicons name="radio" size={32} color="#FFF" />
              </View>
            </View>
            <Text style={styles.activatingText}>{loadingText}</Text>
          </View>
        )}

        {stage === 'active' && (
          <View style={styles.activeContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            <Text style={styles.activeTitle}>SOS Active</Text>
            <Text style={styles.activeText}>
              Your emergency contacts and nearby community members have been alerted with your live location. Help is on the way.
            </Text>
            <TouchableOpacity style={styles.primaryButtonBlack} onPress={handleBack}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#FF3B30', marginTop: 16 }]} 
              onPress={async () => {
                const success = await handleCancelExistingSOS();
                if (success) {
                  Alert.alert('Cancelled', 'Your SOS request has been cancelled successfully.', [
                    { text: 'OK', onPress: handleBack }
                  ]);
                }
              }}
              disabled={resolving}
              activeOpacity={0.8}
            >
              {resolving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>CANCEL SOS</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handleConfirmManualLocation}
        title="Confirm SOS Location"
        initialCoords={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  warningIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  optionsContainer: {
    marginTop: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  typeOptionSelected: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },
  typeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  typeOptionTextSelected: {
    color: '#FF3B30',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FF3B30',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  primaryButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonBlack: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  primaryButtonDisabled: {
    backgroundColor: '#FFA5A0',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
  },
  activatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  activatingText: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
    textAlign: 'center',
  },
  pulseContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  pulseCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  activeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  activeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34C759',
    marginTop: 20,
    marginBottom: 12,
  },
  activeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  textInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    width: '100%',
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: '800',
    color: '#FF3B30',
    marginVertical: 20,
  },
  mapsLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFC1C1',
    gap: 8,
  },
  mapsLinkText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  retryFetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 15,
    gap: 8,
    shadowColor: '#FF3B30',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  retryFetchText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  guideBox: {
    backgroundColor: '#FAF5F5',
    borderWidth: 1,
    borderColor: '#FFD1D1',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    width: '100%',
    alignSelf: 'stretch',
  },
  guideHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D32F2F',
    marginBottom: 6,
  },
  guideStep: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  errorBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    justifyContent: 'center',
    width: '100%',
  },
  actionSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#FF3B30',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  actionSettingsText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  actionRetryText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '800',
  },
});
