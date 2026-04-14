import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { VENDOR_CATEGORIES } from '../store/vendorStore';

interface VendorRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const VendorRegistrationModal: React.FC<VendorRegistrationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const mapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';
  const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

  const filteredCategories = VENDOR_CATEGORIES.filter(
    cat => cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
    !selectedCategories.includes(cat)
  );

  const resetForm = () => {
    setBusinessName('');
    setOwnerName('');
    setPhoneNumber('');
    setYearsInBusiness('');
    setSelectedCategories([]);
    setAddress('');
    setLocationLink('');
    setLatitude(null);
    setLongitude(null);
    setCategorySearch('');
  };

  const addCategory = (category: string) => {
    if (selectedCategories.length >= 5) {
      Alert.alert('Limit Reached', 'You can select up to 5 categories.');
      return;
    }
    setSelectedCategories([...selectedCategories, category]);
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const buildMapPickerHtml = (apiKey: string, initialLat: number, initialLng: number) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; }
      #map { width: 100%; height: 100%; }
      .topbar {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        display: flex;
        gap: 8px;
        z-index: 3;
      }
      #searchInput {
        flex: 1;
        height: 44px;
        border: none;
        border-radius: 12px;
        padding: 0 14px;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      #myLocationBtn {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 18px;
      }
      .center-pin {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -100%);
        z-index: 2;
        font-size: 32px;
        pointer-events: none;
      }
      .capture-wrap {
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 18px;
        z-index: 3;
      }
      #captureBtn {
        width: 100%;
        height: 46px;
        border: none;
        border-radius: 12px;
        background: #f57c00;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      #hint {
        margin-top: 8px;
        text-align: center;
        color: #fff;
        font-size: 12px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.6);
      }
    </style>
  </head>
  <body>
    <div class="topbar">
      <input id="searchInput" type="text" placeholder="Search location" />
      <button id="myLocationBtn" title="My location">📍</button>
    </div>
    <div id="map"></div>
    <div class="center-pin">📌</div>
    <div class="capture-wrap">
      <button id="captureBtn">Capture This Location</button>
      <div id="hint">Move map under pin and tap capture</div>
    </div>

    <script>
      let map;
      let geocoder;
      let selected = { lat: ${initialLat}, lng: ${initialLng} };

      function postToApp(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage(JSON.stringify(payload), '*');
        }
      }

      function initMap() {
        geocoder = new google.maps.Geocoder();
        map = new google.maps.Map(document.getElementById('map'), {
          center: selected,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        map.addListener('idle', () => {
          const center = map.getCenter();
          selected = { lat: center.lat(), lng: center.lng() };
        });

        const input = document.getElementById('searchInput');
        const searchBox = new google.maps.places.SearchBox(input);
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (!places || !places.length) return;
          const place = places[0];
          if (!place.geometry || !place.geometry.location) return;
          map.panTo(place.geometry.location);
          map.setZoom(17);
          selected = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        });

        document.getElementById('myLocationBtn').addEventListener('click', () => {
          if (!navigator.geolocation) {
            postToApp({ type: 'error', message: 'Geolocation not supported on this device.' });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              selected = { lat: position.coords.latitude, lng: position.coords.longitude };
              map.panTo(selected);
              map.setZoom(18);
            },
            () => postToApp({ type: 'error', message: 'Could not fetch current location.' }),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });

        document.getElementById('captureBtn').addEventListener('click', () => {
          geocoder.geocode({ location: selected }, (results, status) => {
            const address = status === 'OK' && results && results[0] ? results[0].formatted_address : '';
            postToApp({
              type: 'capture',
              latitude: selected.lat,
              longitude: selected.lng,
              locationLink: 'https://maps.google.com/?q=' + selected.lat + ',' + selected.lng,
              locationLabel: address,
            });
          });
        });
      }

      window.initMap = initMap;
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap"></script>
  </body>
</html>
`;

  const openMapPicker = () => {
    if (!mapsApiKey) {
      Alert.alert('Map API Key Missing', 'Set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in frontend env to open map picker.');
      return;
    }
    setMapPickerVisible(true);
  };

  const applyCapturedLocation = (payload: any) => {
    const lat = Number(payload?.latitude);
    const lng = Number(payload?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert('Map Error', 'Invalid coordinates captured from map.');
      return;
    }
    setLatitude(lat);
    setLongitude(lng);
    setLocationLink(String(payload?.locationLink || `https://maps.google.com/?q=${lat},${lng}`));
    if (payload?.locationLabel) {
      setLocationLabel(String(payload.locationLabel));
      setAddress((prev) => (prev.trim() ? prev : String(payload.locationLabel)));
    }
    setMapPickerVisible(false);
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapPickerVisible || typeof window === 'undefined') {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      const raw = event?.data;
      if (typeof raw !== 'string') return;

      try {
        const payload = JSON.parse(raw);
        if (payload?.type === 'error') {
          Alert.alert('Map Error', payload?.message || 'Unable to use map.');
          return;
        }
        if (payload?.type === 'capture') {
          applyCapturedLocation(payload);
        }
      } catch {
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mapPickerVisible]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);

    const showAlert = (title: string, message: string) => {
      if (Platform.OS === 'web') {
        window.alert(`${title}: ${message}`);
      } else {
        Alert.alert(title, message);
      }
    };

    const setLocationData = async (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      setLocationLink(`https://maps.google.com/?q=${lat},${lng}`);

      try {
        const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocoded.length > 0) {
          const place = geocoded[0];
          const labelParts = [
            place.name,
            place.street,
            place.subregion || place.city,
            place.region,
            place.postalCode,
            place.country,
          ].filter(Boolean);
          setLocationLabel(labelParts.join(', '));
        } else {
          setLocationLabel(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      } catch {
        setLocationLabel(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    };

    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          showAlert('Error', 'Geolocation is not supported in this browser.');
          return;
        }

        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              await setLocationData(position.coords.latitude, position.coords.longitude);
              resolve();
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Location permission is required.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        await setLocationData(location.coords.latitude, location.coords.longitude);
      }

      showAlert('Success', 'Location captured successfully!');
    } catch (error: any) {
      showAlert('Error', error?.message || 'Failed to get location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!businessName.trim() || !ownerName.trim() || !phoneNumber.trim() || !yearsInBusiness) {
      Alert.alert('Missing Information', 'Please fill all required fields.');
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Phone number must contain exactly 10 digits.');
      return;
    }

    if (!/^[0-9]+$/.test(yearsInBusiness) || parseInt(yearsInBusiness, 10) <= 0) {
      Alert.alert('Invalid Years in Business', 'Please enter a valid number of years in business.');
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert('Missing Categories', 'Please select at least one business category.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Missing Address', 'Please enter your business address.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.trim(),
        yearsInBusiness: parseInt(yearsInBusiness, 10) || 0,
        categories: selectedCategories,
        address: address.trim(),
        locationLink,
        latitude,
        longitude,
      });
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error registering vendor:', error);
      let message = 'Failed to register. Please try again.';
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map((item: any) => item.msg || JSON.stringify(item)).join('\n');
        } else if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else {
          message = JSON.stringify(error.response.data.detail);
        }
      } else if (error?.message) {
        message = error.message;
      }
      Alert.alert('Registration Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="storefront" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Register Your Business</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Business Name */}
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              placeholderTextColor={COLORS.textLight}
              value={businessName}
              onChangeText={setBusinessName}
            />

            {/* Owner Name */}
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter owner name"
              placeholderTextColor={COLORS.textLight}
              value={ownerName}
              onChangeText={setOwnerName}
            />

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.textLight}
              value={phoneNumber}
              onChangeText={(text) => {
                const numericText = text.replace(/\D/g, '');
                setPhoneNumber(numericText.slice(0, 10));
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {/* Years in Business */}
            <Text style={styles.label}>Years in Business *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter years (e.g., 5)"
              placeholderTextColor={COLORS.textLight}
              value={yearsInBusiness}
              onChangeText={(text) => {
                const numericText = text.replace(/\D/g, '');
                setYearsInBusiness(numericText.slice(0, 2));
              }}
              keyboardType="number-pad"
              maxLength={2}
            />

            {/* Business Categories */}
            <Text style={styles.label}>Business Categories * (Select up to 5)</Text>
            
            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
              <View style={styles.selectedCategories}>
                {selectedCategories.map((cat) => (
                  <View key={cat} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{cat}</Text>
                    <TouchableOpacity onPress={() => removeCategory(cat)}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Category Search */}
            <View style={styles.categorySearchContainer}>
              <Ionicons name="search" size={18} color={COLORS.textLight} />
              <TextInput
                style={styles.categorySearchInput}
                placeholder="Search categories (Gym, Yoga, Restaurant...)"
                placeholderTextColor={COLORS.textLight}
                value={categorySearch}
                onChangeText={(text) => {
                  setCategorySearch(text);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
              />
            </View>

            {/* Category Dropdown */}
            {showCategoryDropdown && filteredCategories.length > 0 && (
              <View style={styles.categoryDropdown}>
                {filteredCategories.slice(0, 6).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryOption}
                    onPress={() => addCategory(cat)}
                  >
                    <Text style={styles.categoryOptionText}>{cat}</Text>
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Address */}
            <Text style={styles.label}>Full Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter complete business address"
              placeholderTextColor={COLORS.textLight}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Location */}
            <Text style={styles.label}>Location Link</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationButtonsRow}>
                <TouchableOpacity
                  style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                >
                  <Ionicons name="locate" size={18} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>
                    {locationLoading ? 'Capturing...' : 'Get Current Location'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={openMapPicker}
                >
                  <Ionicons name="map" size={18} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>Open Map</Text>
                </TouchableOpacity>
              </View>
              {latitude && longitude && (
                <View style={styles.locationInfoContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      if (locationLink) Linking.openURL(locationLink).catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.locationLinkText}>{locationLink}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Register Business</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={mapPickerVisible}
        animationType="slide"
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapHeaderTitle}>Pick Business Location</Text>
            <TouchableOpacity onPress={() => setMapPickerVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' ? (
            <View style={styles.webMapFrameContainer}>
              {React.createElement('iframe', {
                title: 'Business Location Map Picker',
                srcDoc: buildMapPickerHtml(mapsApiKey, latitude ?? 19.076, longitude ?? 72.8777),
                style: {
                  width: '100%',
                  height: '100%',
                  border: '0',
                  display: 'block',
                },
              } as any)}
            </View>
          ) : NativeWebView ? (
            <NativeWebView
              source={{ html: buildMapPickerHtml(mapsApiKey, latitude ?? 19.076, longitude ?? 72.8777) }}
              originWhitelist={["*"]}
              onMessage={(event: any) => {
                try {
                  const payload = JSON.parse(event.nativeEvent.data || '{}');
                  if (payload.type === 'error') {
                    Alert.alert('Map Error', payload.message || 'Unable to use map.');
                    return;
                  }
                  if (payload.type === 'capture') {
                    applyCapturedLocation(payload);
                  }
                } catch {
                  Alert.alert('Map Error', 'Failed to read selected location.');
                }
              }}
            />
          ) : null}
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    padding: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.md,
  },
  selectedCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    gap: 4,
  },
  categoryTagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  categorySearchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  categoryDropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginTop: SPACING.xs,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  categoryOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  locationContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  locationButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationInfoText: {
    fontSize: 13,
    color: COLORS.success,
  },
  locationInfoContainer: {
    marginTop: SPACING.sm,
    flex: 1,
  },
  locationLabelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  locationLinkText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  mapHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  webMapFrameContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
