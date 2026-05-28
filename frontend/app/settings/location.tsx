import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Button } from '../../src/components/Button';
import { setupDualLocation, reverseGeocode } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

interface LocationData {
  country: string;
  state: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  display_name?: string;
}

const normalizeUserLocation = (location: any): LocationData | null => {
  if (!location) return null;
  return {
    country: location.country || '',
    state: location.state || '',
    city: location.city || '',
    area: location.area || '',
    latitude: location.latitude,
    longitude: location.longitude,
    display_name: location.display_name,
  };
};

export default function ChangeLocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const handleBack = useCallback(() => {
    // Try to go back in navigation stack; if unavailable, navigate to profile screen
    // router.back() works for native navigation; fallback ensures user lands on profile
    router.back?.();
    // If back navigation didn't happen (e.g., on web where history may be empty), replace with profile
    // Note: router.back() returns undefined; we use a short timeout to check navigation state if needed.
    // For simplicity, also call replace as a safe fallback.
    router.replace('/profile');
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  const { user, updateUser } = useAuthStore();

  const [homeLocation, setHomeLocation] = useState<LocationData | null>(
    normalizeUserLocation(user?.home_location) || null
  );
  const [officeLocation, setOfficeLocation] = useState<LocationData | null>(
    normalizeUserLocation((user as any)?.office_location) || null
  );
  const [loading, setLoading] = useState(false);
  const [detectingHome, setDetectingHome] = useState(false);
  const [detectingOffice, setDetectingOffice] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = t('language') === 'hi' ? 'अपने क्षेत्र का पता लगाने के लिए कृपया स्थान पहुंच सक्षम करें।' : 'Please enable location access to detect your area.';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert(
            t('language') === 'hi' ? 'स्थान अनुमति आवश्यक है' : 'Location Permission Required', 
            msg, 
            [{ text: 'OK' }]
          );
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      if (Platform.OS === 'web') {
        window.alert(
          t('language') === 'hi' ? 'स्थान अनुमति अनुरोध विफल रहा। कृपया अपनी ब्राउज़र सेटिंग्स जांचें।' : 'Location permission request failed. Please check your browser settings.'
        );
      }
      return false;
    }
  };

  const detectCurrentLocation = async (type: 'home' | 'office') => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
           setError(t('language') === 'hi' ? 'भू-स्थान आपके ब्राउज़र द्वारा समर्थित नहीं है' : 'Geolocation is not supported by your browser');
           return;
        }
        
        if (type === 'home') setDetectingHome(true);
        else setDetectingOffice(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await reverseGeocode(latitude, longitude);
              const locationData: LocationData = {
                country: response.data.country,
                state: response.data.state,
                city: response.data.city,
                area: response.data.area,
                latitude,
                longitude,
                display_name: response.data.display_name,
              };

              if (type === 'home') setHomeLocation(locationData);
              else setOfficeLocation(locationData);
              setHasChanges(true);
            } catch (apiErr: any) {
              console.error('Reverse geocode error:', apiErr);
              setError(t('language') === 'hi' ? 'स्थान का पता नहीं लगाया जा सका। कृपया मैन्युअल रूप से दर्ज करें।' : 'Could not decode location. Please enter manually.');
            } finally {
              if (type === 'home') setDetectingHome(false);
              else setDetectingOffice(false);
            }
          },
          (geoError) => {
            console.error('Browser geolocation error:', geoError);
            setError(
              t('language') === 'hi' 
                ? `स्थान त्रुटि: ${geoError.message}। कृपया ब्राउज़र अनुमतियाँ जांचें।` 
                : `Location error: ${geoError.message}. Please check browser permissions.`
            );
            if (type === 'home') setDetectingHome(false);
            else setDetectingOffice(false);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
        return;
      }

      // Native flow
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      if (type === 'home') setDetectingHome(true);
      else setDetectingOffice(true);
      setError('');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const response = await reverseGeocode(latitude, longitude);
      const locationData: LocationData = {
        country: response.data.country,
        state: response.data.state,
        city: response.data.city,
        area: response.data.area,
        latitude,
        longitude,
        display_name: response.data.display_name,
      };

      if (type === 'home') setHomeLocation(locationData);
      else setOfficeLocation(locationData);
      setHasChanges(true);
    } catch (err: any) {
      console.error('Location detection error:', err);
      setError(
        t('language') === 'hi'
          ? `स्थान का पता लगाना विफल रहा: ${err.message || 'अज्ञात त्रुटि'}`
          : `Location detection failed: ${err.message || 'Unknown error'}`
      );
    } finally {
      if (Platform.OS !== 'web') {
        if (type === 'home') setDetectingHome(false);
        else setDetectingOffice(false);
      }
    }
  };

  const handleUpdateLocations = async () => {
    if (!homeLocation || !officeLocation) {
      setError(t('language') === 'hi' ? 'घर और कार्यालय दोनों स्थान आवश्यक हैं' : 'Both home and office locations are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await setupDualLocation({
        home_location: homeLocation,
        office_location: officeLocation,
      });

      updateUser(response.data.user);
      
      Alert.alert(
        t('language') === 'hi' ? 'स्थान अपडेट कर दिया गया' : 'Location Updated',
        t('language') === 'hi' ? 'आपके नए स्थानों के आधार पर आपके समुदायों को अपडेट कर दिया गया है।' : 'Your communities have been updated based on your new locations.',
        [{ text: 'OK', onPress: handleBack }]
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || (t('language') === 'hi' ? 'स्थान अपडेट करने में विफल। कृपया पुन: प्रयास करें।' : 'Failed to update locations. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const renderLocationCard = (
    title: string,
    location: LocationData | null,
    isDetecting: boolean,
    onDetect: () => void,
    icon: keyof typeof Ionicons.glyphMap,
    color: string
  ) => {
    const displayTitle = 
      title === 'Home Location' 
        ? (t('language') === 'hi' ? 'घर का स्थान' : 'Home Location') 
        : (t('language') === 'hi' ? 'कार्यालय का स्थान' : 'Office Location');

    return (
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={[styles.locationIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.locationTitle}>{displayTitle}</Text>
        </View>

        {location ? (
          <View style={styles.locationDetails}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={COLORS.success} />
              <Text style={styles.areaText}>{location.area}</Text>
            </View>
            <Text style={styles.addressText}>
              {location.city}, {location.state}
            </Text>
            <Text style={styles.countryText}>{location.country}</Text>
            
            <TouchableOpacity style={styles.changeButton} onPress={onDetect}>
              <Ionicons name="navigate" size={16} color={COLORS.primary} />
              <Text style={styles.changeText}>
                {t('language') === 'hi' ? 'नए स्थान का पता लगाएं' : 'Detect New Location'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.detectButton} 
            onPress={onDetect}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.detectingText}>
                  {t('language') === 'hi' ? 'आपके स्थान का पता लगाया जा रहा है...' : 'Detecting your location...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
                <Text style={styles.detectText}>
                  {t('language') === 'hi' ? 'स्थान का पता लगाएं' : 'Detect Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('language') === 'hi' ? 'स्थान बदलें' : 'Change Location'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              {t('language') === 'hi' ? 'अपना स्थान बदलने से आपकी समुदाय सदस्यताएँ स्वचालित रूप से अपडेट हो जाएँगी। आप पुराने स्थान के समुदायों को छोड़ देंगे और नए समुदायों में शामिल हो जाएँगे।' : 'Changing your location will automatically update your community memberships. You will leave old location communities and join new ones.'}
            </Text>
          </View>

          {/* Home Location */}
          {renderLocationCard(
            'Home Location',
            homeLocation,
            detectingHome,
            () => detectCurrentLocation('home'),
            'home',
            COLORS.success
          )}

          {/* Office Location */}
          <View style={styles.divider} />
          {renderLocationCard(
            'Office Location',
            officeLocation,
            detectingOffice,
            () => detectCurrentLocation('office'),
            'business',
            COLORS.info
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Community Preview */}
          {homeLocation && officeLocation && (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>
                {t('language') === 'hi' ? 'अपडेट के बाद आपके समुदाय:' : 'Your Communities After Update:'}
              </Text>
              <View style={styles.previewItem}>
                <Ionicons name="home" size={16} color={COLORS.success} />
                <Text style={styles.previewText}>
                  {homeLocation.area} {t('language') === 'hi' ? 'समुदाय' : 'Community'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Ionicons name="business" size={16} color={COLORS.info} />
                <Text style={styles.previewText}>
                  {officeLocation.area} {t('language') === 'hi' ? 'कार्यालय समुदाय' : 'Office Community'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Ionicons name="location" size={16} color="#9B59B6" />
                <Text style={styles.previewText}>
                  {homeLocation.city} {t('language') === 'hi' ? 'समुदाय' : 'Community'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Ionicons name="map" size={16} color={COLORS.warning} />
                <Text style={styles.previewText}>
                  {homeLocation.state} {t('language') === 'hi' ? 'समुदाय' : 'Community'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Ionicons name="flag" size={16} color={COLORS.primary} />
                <Text style={styles.previewText}>
                  {t('language') === 'hi' ? 'भारत समुदाय' : 'Bharat Community'}
                </Text>
              </View>
            </View>
          )}

          {/* Update Button */}
          {homeLocation && officeLocation && hasChanges && (
            <Button
              title={t('language') === 'hi' ? 'स्थान और समुदाय अपडेट करें' : 'Update Location & Communities'}
              onPress={handleUpdateLocations}
              loading={loading}
              style={styles.button}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.info}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 18,
  },
  locationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationDetails: {
    paddingLeft: 52,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  areaText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  countryText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  changeText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  detectText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  detectingText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  divider: {
    height: SPACING.md,
  },
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  previewBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  button: {
    marginTop: SPACING.lg,
  },
});
