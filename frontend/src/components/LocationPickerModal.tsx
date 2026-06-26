import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { forwardGeocode, reverseGeocode } from '../services/api';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

let MapView: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('LocationPickerModal: Native maps failed to load:', e);
  }
}

export interface LocationData {
  country: string;
  state: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  display_name?: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  title?: string;
  initialCoords?: { latitude: number; longitude: number } | null;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = 'Choose Location',
  initialCoords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      initializeRegion();
    }
  }, [visible, initialCoords]);

  const initializeRegion = async () => {
    let lat = 20.5937;
    let lng = 78.9629;

    if (initialCoords && initialCoords.latitude && initialCoords.longitude) {
      lat = initialCoords.latitude;
      lng = initialCoords.longitude;
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch (e) {
        console.warn('LocationPickerModal: Could not get current position for map init:', e);
      }
    }

    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setMapRegion(newRegion);
    setSearchQuery('');
    setSearchResults([]);

    setTimeout(() => {
      if (mapRef.current && Platform.OS !== 'web') {
        mapRef.current.animateToRegion(newRegion, 500);
      }
    }, 500);
  };

  const handleSearch = async (text: string) => {
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
      if (mapRef.current && Platform.OS !== 'web') {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
    setSearchResults([]);
    setSearchQuery(item.display_name || '');
    Keyboard.dismiss();
  };

  const handleConfirm = async () => {
    if (!mapRegion) return;
    setLoading(true);
    try {
      const response = await reverseGeocode(mapRegion.latitude, mapRegion.longitude);
      const data = response.data;
      const locationData: LocationData = {
        country: data.country || '',
        state: data.state || '',
        city: data.city || '',
        area: data.area || data.suburb || data.neighbourhood || '',
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        display_name: data.display_name || '',
      };
      onConfirm(locationData);
    } catch (e) {
      console.error('Confirm location error:', e);
      // Fallback location data if geocoding fails
      const fallbackData: LocationData = {
        country: 'Bharat',
        state: '',
        city: '',
        area: '',
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        display_name: `Lat: ${mapRegion.latitude.toFixed(6)}, Lng: ${mapRegion.longitude.toFixed(6)}`,
      };
      onConfirm(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
      hardwareAccelerated={Platform.OS === 'android'}
      statusBarTranslucent={Platform.OS === 'android'}
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Autocomplete Search input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city, area, or landmark..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {searching && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.xs }} />}

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

        {/* Map area */}
        <View style={styles.mapWrapper}>
          {Platform.OS === 'web' ? (
            <View style={styles.webMapFallback}>
              <Ionicons name="map-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.webMapFallbackText}>
                Map view is only available on native mobile app. Use the search bar above to locate places.
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
              <Text style={styles.webMapFallbackText}>Unable to load maps.</Text>
            </View>
          )}
        </View>

        {/* Confirm Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={loading || !mapRegion}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Selected Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    zIndex: 10,
    elevation: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.regular,
    lineHeight: 20,
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
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
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
    justifyContent: 'center',
    height: 50,
  },
  disabledButton: {
    backgroundColor: COLORS.primaryLight,
    opacity: 0.8,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
