import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  BackHandler, 
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Button } from '../../src/components/Button';
import { setupDualLocation, reverseGeocode, forwardGeocode } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('Native maps failed to load:', e);
  }
}

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
    router.back?.();
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

  // Map Picker Modal States
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState<'home' | 'office' | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const mapRef = React.useRef<any>(null);

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
          ? `स्थान का पता लगाना विफल रहा: ${err.message || 'अज्ञान त्रुटि'}`
          : `Location detection failed: ${err.message || 'Unknown error'}`
      );
    } finally {
      if (Platform.OS !== 'web') {
        if (type === 'home') setDetectingHome(false);
        else setDetectingOffice(false);
      }
    }
  };

  const openMapPicker = async (type: 'home' | 'office') => {
    setMapTarget(type);
    let initialLat = 20.5937;
    let initialLng = 78.9629;
    
    const targetLoc = type === 'home' ? homeLocation : officeLocation;
    if (targetLoc && targetLoc.latitude !== undefined && targetLoc.longitude !== undefined) {
      const parsedLat = parseFloat(targetLoc.latitude as any);
      const parsedLng = parseFloat(targetLoc.longitude as any);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        initialLat = parsedLat;
        initialLng = parsedLng;
      }
    } else {
      // Try to get current device location as starting point if available
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          initialLat = pos.coords.latitude;
          initialLng = pos.coords.longitude;
        }
      } catch (e) {}
    }

    const newRegion = {
      latitude: initialLat,
      longitude: initialLng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setMapRegion(newRegion);
    
    setSearchQuery('');
    setSearchResults([]);
    setMapPickerVisible(true);

    // Animate map after it mounts
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
    }, 500);
  };

  const handleSearchLocation = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await forwardGeocode(text);
      if (response && response.data) {
        setSearchResults(response.data);
      }
    } catch (e) {
      console.error('Forward geocoding error:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.latitude as any);
    const lng = parseFloat(item.longitude as any);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
    setSearchResults([]);
    setSearchQuery(item.display_name || '');
    Keyboard.dismiss();
  };

  const handleConfirmLocation = async () => {
    if (!mapRegion || !mapTarget) {
      setMapPickerVisible(false);
      return;
    }
    setLoading(true);
    try {
      const response = await reverseGeocode(mapRegion.latitude, mapRegion.longitude);
      const locData: LocationData = {
        country: response.data.country,
        state: response.data.state,
        city: response.data.city,
        area: response.data.area,
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        display_name: response.data.display_name || '',
      };
      
      if (mapTarget === 'home') {
        setHomeLocation(locData);
      } else {
        setOfficeLocation(locData);
      }
      setHasChanges(true);
      setMapPickerVisible(false);
    } catch (e: any) {
      console.error('Confirm location error:', e);
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error',
        t('language') === 'hi' ? 'स्थान विवरण प्राप्त करने में विफल' : 'Failed to retrieve location details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocations = async () => {
    if (!homeLocation) {
      setError(t('language') === 'hi' ? 'घर का स्थान आवश्यक है' : 'Home location is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await setupDualLocation({
        home_location: homeLocation,
        office_location: officeLocation || undefined,
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
    onManualSelect: () => void,
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
              <Text style={styles.areaText}>{location.area || 'Unknown Area'}</Text>
            </View>
            <Text style={styles.addressText}>
              {location.city}, {location.state}
            </Text>
            <Text style={styles.countryText}>{location.country}</Text>
            
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={onDetect} disabled={isDetecting}>
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>
                  {isDetecting ? (t('language') === 'hi' ? 'पता लगाया जा रहा है...' : 'Detecting...') : (t('language') === 'hi' ? 'ऑटो पता लगाएं' : 'Auto Detect')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, { marginLeft: SPACING.md }]} onPress={onManualSelect}>
                <Ionicons name="map" size={16} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>
                  {t('language') === 'hi' ? 'मानचित्र / खोज' : 'Map / Search'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.detectButtonsContainer}>
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
                    {t('language') === 'hi' ? 'ऑटो पता लगाएं' : 'Auto Detect'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.detectButton, { marginTop: SPACING.sm }]} 
              onPress={onManualSelect}
            >
              <Ionicons name="map" size={20} color={COLORS.primary} />
              <Text style={styles.detectText}>
                {t('language') === 'hi' ? 'मानचित्र / खोज से चुनें' : 'Choose via Map / Search'}
              </Text>
            </TouchableOpacity>
          </View>
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
            () => openMapPicker('home'),
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
            () => openMapPicker('office'),
            'business',
            COLORS.info
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Community Preview */}
          {homeLocation && (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>
                {t('language') === 'hi' ? 'अपडेट के बाद आपके समुदाय:' : 'Your Communities After Update:'}
              </Text>
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
          {homeLocation && hasChanges && (
            <Button
              title={t('language') === 'hi' ? 'स्थान और समुदाय अपडेट करें' : 'Update Location & Communities'}
              onPress={handleUpdateLocations}
              loading={loading}
              style={styles.button}
            />
          )}
        </View>
      </ScrollView>

      {/* Map Picker & Search Modal */}
      <Modal
        visible={mapPickerVisible}
        animationType="slide"
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMapPickerVisible(false)}>
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {mapTarget === 'home' 
                ? (t('language') === 'hi' ? 'घर का स्थान चुनें' : 'Choose Home Location')
                : (t('language') === 'hi' ? 'कार्यालय का स्थान चुनें' : 'Choose Office Location')
              }
            </Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Search Section */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('language') === 'hi' ? 'स्थान खोजें...' : 'Search location...'}
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={handleSearchLocation}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchLocation('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            {searching && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.xs }} />}
            
            {/* Search Suggestions */}
            {searchResults.length > 0 && (
              <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Map Section */}
          <View style={styles.mapWrapper}>
            {Platform.OS === 'web' ? (
              <View style={styles.webMapFallback}>
                <Ionicons name="map-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.webMapFallbackText}>
                  {t('language') === 'hi' ? 'मानचित्र दृश्य केवल मोबाइल ऐप पर उपलब्ध है।' : 'Map view is only available on mobile app.'}
                </Text>
                {mapRegion && (
                  <View style={styles.coordsBox}>
                    <Text style={styles.coordsText}>Latitude: {mapRegion.latitude.toFixed(6)}</Text>
                    <Text style={styles.coordsText}>Longitude: {mapRegion.longitude.toFixed(6)}</Text>
                  </View>
                )}
              </View>
            ) : MapView && mapRegion ? (
              <>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={mapRegion}
                  onRegionChangeComplete={(region: any) => setMapRegion(region)}
                  showsUserLocation
                  showsMyLocationButton={true}
                />
                <View style={styles.mapPinContainer} pointerEvents="none">
                  <Ionicons name="location" size={40} color={COLORS.primary} />
                </View>
              </>
            ) : (
              <View style={styles.webMapFallback}>
                <Ionicons name="warning-outline" size={48} color={COLORS.error} />
                <Text style={styles.webMapFallbackText}>
                  {t('language') === 'hi' ? 'मानचित्र लोड करने में असमर्थ' : 'Unable to load map'}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Confirmation Bar */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
              <Text style={styles.confirmButtonText}>
                {t('language') === 'hi' ? 'इस स्थान की पुष्टि करें' : 'Confirm This Location'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    borderWidth: 1,
    borderColor: COLORS.divider,
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
  actionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  detectButtonsContainer: {
    marginTop: SPACING.xs,
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
    fontSize: 15,
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
    borderWidth: 1,
    borderColor: COLORS.divider,
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
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  suggestionsList: {
    maxHeight: 200,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  webMapFallbackText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  coordsBox: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  coordsText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.text,
  },
  modalFooter: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
