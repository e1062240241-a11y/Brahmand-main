import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { COLORS, FONTS } from '../constants/theme';
import { reverseGeocode } from '../services/api';
import { fetchFullAddress } from '../utils/locationHelper';
import { LocationPickerModal, LocationData } from './LocationPickerModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface SOSFlowModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateSOS: (data: { type: string; microLocation: string; latitude?: number; longitude?: number }) => Promise<void>;
}

export const SOSFlowModal: React.FC<SOSFlowModalProps> = ({ visible, onClose, onCreateSOS }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [emergencyType, setEmergencyType] = useState('medical');
  const [microLocation, setMicroLocation] = useState('');
  const [address, setAddress] = useState('Fetching location...');
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleConfirmManualLocation = (locData: LocationData) => {
    if (locData.latitude && locData.longitude) {
      setCoords({ latitude: locData.latitude, longitude: locData.longitude });
      const parts = [locData.area, locData.city, locData.state, locData.country].filter(Boolean);
      const fullAddr = locData.display_name || parts.join(', ') || 'Selected Location';
      setAddress(fullAddr);
      setMicroLocation(fullAddr);
    }
    setPickerVisible(false);
  };

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && step === 3) {
      fetchAddress();
    }
    if (!visible) {
      resetFlow();
    }
  }, [visible, step]);

  useEffect(() => {
    if (step === 4) {
      startCountdown();
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
  }, [step]);

  const resetFlow = () => {
    setStep(1);
    setEmergencyType('medical');
    setMicroLocation('');
    setCountdown(10);
    setLoading(false);
    setCoords(null);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  const fetchAddress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Permission denied');
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setAddress('Location services disabled');
        return;
      }
      setAddress('Fetching live GPS...');

      let location: Location.LocationObject | null = null;
      try {
        location = await getCurrentPositionWithTimeout({
          accuracy: Location.Accuracy.Balanced,
        }, 5000);
      } catch (e1) {
        console.warn('[SOSModal] Current position fetch timed out, trying last known...');
      }

      if (!location) {
        location = await getLastKnownPositionWithTimeout(3000);
      }

      if (!location) {
        throw new Error('All location retrieval attempts failed');
      }

      // Set raw coordinates immediately as a fallback display so user has instant feedback!
      const fallbackAddr = `Lat: ${location.coords.latitude.toFixed(6)}, Lng: ${location.coords.longitude.toFixed(6)}`;
      setAddress(fallbackAddr);
      setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });

      // Try geocoding with timeout and fallback
      try {
        let results: any[] = [];
        try {
          results = await reverseGeocodeWithTimeout({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }, 3000);
        } catch (_) {}

        const fullAddr = await fetchFullAddress(location.coords.latitude, location.coords.longitude, results);
        if (fullAddr) {
          setAddress(fullAddr);
          setMicroLocation(fullAddr);
        }
      } catch (e) {
        console.warn('[SOSModal] Address fetching failed', e);
      }
    } catch (error) {
      console.error('Fetch address error:', error);
      setAddress('Could not fetch address');
    }
  };

  const startCountdown = () => {
    setCountdown(10);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          handleFinalCreate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFinalCreate = async () => {
    setLoading(true);
    try {
      await onCreateSOS({
        type: emergencyType,
        microLocation,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <View style={[
            styles.progressStep, 
            step === i ? styles.progressStepActive : styles.progressStepInactive
          ]}>
            {step === i ? (
              <Text style={styles.progressStepText}>{i}</Text>
            ) : (
              <View style={[
                styles.progressStepDot, 
                step > i && { opacity: 1 }
              ]} />
            )}
          </View>
          {i < 4 && <View style={[styles.progressLine, step > i && styles.progressLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.shieldIconContainer}>
        <View style={styles.shieldIconBg}>
           <MaterialCommunityIcons name="shield-alert" size={50} color="#FF0000" />
        </View>
      </View>
      
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.description}>
        Tap START SOS to begin the emergency process and notify nearby community members.
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View style={styles.featureIconBg}>
            <Ionicons name="notifications" size={20} color="#FF0000" />
          </View>
          <Text style={styles.featureText}>Fast community alerts</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIconBg}>
            <Ionicons name="location" size={20} color="#FF0000" />
          </View>
          <Text style={styles.featureText}>Your location will be shared</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIconBg}>
            <Ionicons name="call" size={20} color="#FF0000" />
          </View>
          <Text style={styles.featureText}>Your mobile number will be shared</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIconBg}>
            <Ionicons name="people" size={20} color="#FF0000" />
          </View>
          <Text style={styles.featureText}>Help is on the way</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={() => setStep(2)}>
        <View style={styles.buttonIconContainer}>
          <Text style={styles.exclamationMark}>!</Text>
        </View>
        <Text style={styles.mainButtonText}>START SOS</Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>
        Your location and mobile number will be shared to help people reach you faster.
      </Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderProgressBar()}

      <Text style={styles.stepHeading}>Confirm Emergency Type</Text>
      <Text style={styles.stepSubHeading}>Choose the type of emergency you are facing.</Text>

      <View style={styles.typeGrid}>
        {[
          { id: 'medical', label: 'Medical', icon: 'heart-pulse' },
          { id: 'accident', label: 'Accident', icon: 'car' },
          { id: 'safety', label: 'Safety', icon: 'shield-check' },
          { id: 'other', label: 'Other', icon: 'dots-horizontal' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.typeButton, emergencyType === t.id && styles.typeButtonActive]}
            onPress={() => {
              setEmergencyType(t.id);
              // Auto-continue to next step after selection
              setTimeout(() => {
                setStep(3);
              }, 400);
            }}
          >
            <View style={[styles.typeIconBg, emergencyType === t.id && styles.typeIconBgActive]}>
              <MaterialCommunityIcons 
                name={t.icon as any} 
                size={24} 
                color={emergencyType === t.id ? '#FF0000' : '#333'} 
              />
            </View>
            <Text style={[styles.typeLabel, emergencyType === t.id && styles.typeLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={() => setStep(3)}>
        <Text style={styles.mainButtonText}>CONTINUE</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} style={styles.cancelLink}>
        <Text style={styles.cancelLinkText}>Cancel SOS</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep(2)} style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderProgressBar()}

      <Text style={styles.stepHeading}>Add Micro Location</Text>
      <Text style={styles.stepSubHeading}>
        We've detected your location. Add more details to help people find you exactly.
      </Text>

      <TouchableOpacity 
        style={styles.locationCard} 
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.locationIconBg}>
          <MaterialCommunityIcons name="target" size={24} color="#2E7D32" />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Location detected (Tap to change)</Text>
          <Text style={styles.locationAddress} numberOfLines={3}>
            {address}
          </Text>
        </View>
        <Ionicons name="pencil-outline" size={20} color="#2E7D32" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.locationCard, { backgroundColor: '#FFF5EB', borderColor: '#FFD7C2', borderWidth: 1, marginTop: -20, marginBottom: 20 }]} 
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="map-outline" size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
        <Text style={[styles.locationLabel, { color: COLORS.primary, marginBottom: 0 }]}>
          Choose Location Manually (Map/Search)
        </Text>
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Add more details (optional)</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Flat 203, Tower B, Green View Apartments"
          value={microLocation}
          onChangeText={setMicroLocation}
          placeholderTextColor="#999"
        />
        <Ionicons name="lock-closed" size={18} color="#999" />
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={() => setStep(4)}>
        <Text style={styles.mainButtonText}>CREATE SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep(2)} style={styles.cancelLink}>
        <Text style={styles.cancelLinkText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep(3)} style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderProgressBar()}

      <Text style={styles.stepHeading}>SOS sending in</Text>

      <View style={styles.countdownContainer}>
        <View style={styles.countdownCircle}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>

      <Text style={styles.countdownSubText}>
        You can cancel before the alert is sent.
      </Text>

      <TouchableOpacity 
        style={[styles.mainButton, styles.cancelButton]} 
        onPress={() => setStep(3)}
      >
        <Text style={styles.cancelButtonText}>CANCEL SOS</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
        hardwareAccelerated={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FF0000" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LocationPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handleConfirmManualLocation}
        title="Confirm SOS Location"
        initialCoords={coords}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    minHeight: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FFF1F1',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  shieldIconContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#333',
  },
  mainButton: {
    width: '100%',
    height: 64,
    backgroundColor: '#FF0000',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainButtonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  buttonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exclamationMark: {
    color: '#FF0000',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  footerNote: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  // Step 2 & Header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    marginTop: 10,
  },
  headerIconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FF0000',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepInactive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  progressStepActive: {
    backgroundColor: '#FF0000',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  progressStepText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  progressStepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
    opacity: 0.3,
  },
  progressLine: {
    width: 40,
    height: 1.5,
    backgroundColor: '#FFEAEA',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#FF0000',
  },
  stepHeading: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubHeading: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  typeGrid: {
    width: '100%',
    marginBottom: 32,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  typeButtonActive: {
    backgroundColor: '#FFF1F1',
    borderColor: '#FF0000',
    borderWidth: 1.5,
  },
  typeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeIconBgActive: {
    backgroundColor: '#FF0000',
  },
  typeLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#333',
  },
  typeLabelActive: {
    color: '#FF0000',
  },
  cancelLink: {
    marginTop: 24,
    padding: 10,
  },
  cancelLinkText: {
    color: '#FF0000',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  // Step 3
  locationCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F1',
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#2E7D32',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#4CAF50',
  },
  inputLabel: {
    width: '100%',
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 64,
    paddingVertical: 8,
    marginBottom: 40,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#000',
  },
  // Step 4
  countdownContainer: {
    marginVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 96,
    fontFamily: FONTS.bold,
    color: '#FF0000',
  },
  countdownSubText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF0000',
    shadowOpacity: 0,
    elevation: 0,
  },
  cancelButtonText: {
    color: '#FF0000',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
    zIndex: 100,
  },
});
