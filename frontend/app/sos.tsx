import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import SOSMap from '../src/components/SOSMap';


import { useAuthStore } from '../src/store/authStore';
import { createSOSAlert, resolveMyActiveSOS, getMySOSAlert, reverseGeocode } from '../src/services/api';

const { width } = Dimensions.get('window');

const SOS_TYPES = [
  { label: 'Medical', value: 'medical', icon: 'medical' },
  { label: 'Accident', value: 'accident', icon: 'car-sport' },
  { label: 'Other', value: 'other', icon: 'warning' },
];

export default function SOSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [stage, setStage] = useState<'type' | 'location' | 'countdown' | 'activating' | 'active'>('type');
  const [emergencyType, setEmergencyType] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [microLocation, setMicroLocation] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const [loadingText, setLoadingText] = useState<string>('Sending SOS Alert...');
  const [existingSOS, setExistingSOS] = useState<any>(null);
  const [resolving, setResolving] = useState(false);

  const handleBack = () => {
    if (stage === 'location' || stage === 'countdown') {
      setStage('type');
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use the SOS feature.');
          return;
        }

        // Try getting the location
        try {
          const enabled = await Location.hasServicesEnabledAsync();
          if (!enabled) {
            Alert.alert('Location Services Disabled', 'Please enable location services to use the SOS feature.');
            return;
          }

          setLoadingText('Updating live GPS...');
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000,
          });
          setLocation(loc);
          
          try {
            const response = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
            if (response.data) {
              setMicroLocation(response.data.display_name || '');
            }
          } catch (e) {
            console.warn('Backend reverse geocoding failed', e);
          }
          
        } catch (e) {
          console.warn('Error fetching current location, trying last known position...', e);
          let lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
          if (lastLoc) {
            setLocation(lastLoc);
          }
        }

        // Start watching for changes to keep it fresh
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (newLoc) => {
            setLocation(newLoc);
          }
        );
      } catch (err) {
        console.warn('Location setup failed', err);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMySOSAlert();
        if (res.data) setExistingSOS(res.data);
      } catch (_) {}
    })();
  }, []);

  const handleCancelExistingSOS = async () => {
    setResolving(true);
    try {
      await resolveMyActiveSOS('cancelled');
      setExistingSOS(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel SOS');
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'countdown' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (stage === 'countdown' && countdown === 0) {
      executeSOS();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage, countdown]);

  const handleContinueToLocation = async () => {
    if (!emergencyType) {
      Alert.alert('Select Type', 'Please select an emergency type to continue.');
      return;
    }
    
    if (!location) {
      setLoadingText('Detecting live location...');
      setStage('activating');
      
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use the SOS feature.');
          setStage('type');
          return;
        }

        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          Alert.alert('Location Services Disabled', 'Please enable location services to use the SOS feature.');
          setStage('type');
          return;
        }

        let loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000
        });
        setLocation(loc);
        
        try {
          const response = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
          if (response.data) {
            setMicroLocation(response.data.display_name || '');
          }
        } catch (e) {
          console.warn('Backend reverse geocoding failed', e);
        }
        
      } catch (e) {
        let lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
        if (lastLoc) {
          setLocation(lastLoc);
        } else {
          Alert.alert('Location Error', 'Could not detect your real location. Please ensure your GPS is turned on.');
          setStage('type');
          return;
        }
      }
    }
    
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
        micro_location: microLocation || 'Emergency SOS Page',
      });
      
      setStage('active');
    } catch (e) {
      setStage('location');
      Alert.alert('Error', 'Could not activate SOS. Please ensure you have internet connection or try calling emergency services.');
    }
  };

  const handleCancelCountdown = () => {
    setStage('location');
    setCountdown(10);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {existingSOS ? (
          <View style={styles.activeContainer}>
            <Ionicons name="alert-circle" size={80} color="#FF3B30" />
            <Text style={[styles.activeTitle, { color: '#FF3B30' }]}>SOS Already Active</Text>
            <Text style={styles.activeText}>
              You already have an active SOS alert. Cancel it before creating a new one.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#333', marginTop: 30, width: '100%' }]} 
              onPress={handleCancelExistingSOS}
              disabled={resolving}
            >
              {resolving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>CANCEL SOS</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (<>
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
                    onPress={() => setEmergencyType(option.value)}
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
              onPress={handleContinueToLocation}
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.mapContainer}>
              <SOSMap 
                latitude={location?.coords.latitude || 0} 
                longitude={location?.coords.longitude || 0} 
              />
            </View>

            <View style={styles.warningContainer}>
              <View style={[styles.warningIconBg, { backgroundColor: '#E5F6EB', width: 60, height: 60, marginTop: 10 }]}>
                <Ionicons name="location" size={30} color="#34C759" />
              </View>
              <Text style={styles.warningTitle}>Location Detected</Text>
              {location?.coords.accuracy && (
                <Text style={styles.warningText}>
                  GPS Accuracy: {location.coords.accuracy.toFixed(1)}m
                </Text>
              )}
            </View>

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
              style={styles.primaryButton} 
              onPress={handleStartCountdown}
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
            <ActivityIndicator size="large" color="#FF3B30" />
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
          </View>
        )}
        </>)}
      </KeyboardAvoidingView>
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
  },
  activatingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
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
});
