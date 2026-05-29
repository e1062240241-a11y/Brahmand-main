import React, { useState } from 'react';
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
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { DEFAULT_CATEGORIES } from '../store/vendorStore';

let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('Native maps failed to load:', e);
  }
}

const getWebMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBK-mmtVFjREbCAP8Ea_a5RfsL4uCAoSUs&libraries=places"></script>
    <style>
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; font-family: sans-serif; }
      #map { width: 100%; height: calc(100% - 70px); }
      #search-box {
        position: absolute; top: 10px; left: 10px; right: 10px; z-index: 5;
        background: #fff; padding: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      #search-input {
        width: 100%; border: none; outline: none; font-size: 16px;
      }
      #footer {
        position: absolute; bottom: 0; left: 0; right: 0; height: 70px;
        background: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
      }
      button {
        background: #FF3B30; color: #fff; border: none; padding: 14px 24px;
        border-radius: 8px; font-size: 16px; font-weight: bold; width: 90%; cursor: pointer;
      }
      .center-marker {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%);
        z-index: 1000; margin-top: -35px; pointer-events: none;
      }
      .pac-container {
        z-index: 10000 !important;
      }
    </style>
  </head>
  <body>
    <div id="search-box">
      <input id="search-input" type="text" placeholder="Search for location" />
    </div>
    <div id="map"></div>
    <div class="center-marker">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#FF3B30">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
    <div id="footer">
      <button onclick="confirmLocation()" id="confirmBtn">Confirm Location</button>
    </div>
    <script>
      let map;
      let centerPos = { lat: ${lat}, lng: ${lng} };
      
      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: centerPos,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            () => {},
            { timeout: 5000 }
          );
        }

        const input = document.getElementById('search-input');
        const searchBox = new google.maps.places.SearchBox(input);

        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length == 0) return;
          const bounds = new google.maps.LatLngBounds();
          places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) return;
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
      }

      function confirmLocation() {
        var btn = document.getElementById('confirmBtn');
        btn.innerText = "Loading...";
        btn.disabled = true;

        const center = map.getCenter();
        const lat = center.lat();
        const lng = center.lng();
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            window.parent.postMessage(JSON.stringify({
              type: 'capture',
              latitude: lat,
              longitude: lng,
              address: address
            }), '*');
          } else {
            window.parent.postMessage(JSON.stringify({
              type: 'error',
              message: 'Could not fetch address'
            }), '*');
            btn.innerText = "Confirm Location";
            btn.disabled = false;
          }
        });
      }
      
      window.onload = initMap;
    </script>
  </body>
</html>
`;

const WEB_MAP_HTML_DEFAULT = getWebMapHtml(19.0760, 72.8777);

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
  const [loading, setLoading] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filteredCategories = categoryInput.trim()
    ? DEFAULT_CATEGORIES.filter(c => 
        c.toLowerCase().includes(categoryInput.toLowerCase()) && 
        !categories.includes(c)
      )
    : DEFAULT_CATEGORIES.filter(c => !categories.includes(c));

  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && mapPickerVisible) {
      const handleWebMessage = (event: any) => {
        try {
          if (typeof event.data !== 'string') return;
          const payload = JSON.parse(event.data);
          if (payload.type === 'capture') {
            setAddress(payload.address);
            setMapPickerVisible(false);
          } else if (payload.type === 'error') {
            Alert.alert('Error', payload.message);
          }
        } catch (e) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [mapPickerVisible]);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocoded.length > 0) {
        const place = geocoded[0];
        const components = [
          place.name,
          place.streetNumber,
          place.street,
          place.district,
          place.city,
          place.subregion,
          place.region,
          place.postalCode,
          place.country
        ];
        const uniqueComponents = [...new Set(components.filter(Boolean))];
        const addr = uniqueComponents.join(', ');
        setAddress(addr);
      } else {
        Alert.alert('Error', 'Could not determine address from location.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get location.');
    } finally {
      setLoading(false);
    }
  };

  const openMap = async () => {
    if (Platform.OS !== 'web' && !MapView) {
      Alert.alert('Unavailable', 'Map functionality is currently unavailable.');
      return;
    }
    
    // Set a default fallback immediately so the map renders while waiting
    if (!mapRegion) {
      setMapRegion({ latitude: 19.0760, longitude: 72.8777, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
    
    // Open immediately to prevent blocking UI
    setMapPickerVisible(true);

    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status === 'granted') {
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        
        const location: any = await Promise.race([locationPromise, timeoutPromise]);
        
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (e) {
      // Keep default mapRegion if location fetching fails
      console.warn('Location error in openMap:', e);
    }
  };

  const handleMapConfirm = async () => {
    if (!mapRegion) {
      setMapPickerVisible(false);
      return;
    }
    setLoading(true);
    try {
      const geocoded = await Location.reverseGeocodeAsync({ 
        latitude: mapRegion.latitude, 
        longitude: mapRegion.longitude 
      });
      if (geocoded.length > 0) {
        const place = geocoded[0];
        const components = [
          place.name,
          place.streetNumber,
          place.street,
          place.district,
          place.city,
          place.subregion,
          place.region,
          place.postalCode,
          place.country
        ];
        const uniqueComponents = [...new Set(components.filter(Boolean))];
        const addr = uniqueComponents.join(', ');
        setAddress(addr);
      } else {
        Alert.alert('Error', 'Could not get address for selected location.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get address for selected location.');
    } finally {
      setLoading(false);
      setMapPickerVisible(false);
    }
  };

  const resetForm = () => {
    setBusinessName('');
    setOwnerName('');
    setPhoneNumber('');
    setYearsInBusiness('');
    setAddress('');
    setCategories([]);
    setCategoryInput('');
  };

  const handleSubmit = async () => {
    console.log('🔵 Submit button pressed');
    
    Keyboard.dismiss();
    
    const trimmedBusinessName = businessName.trim();
    const trimmedOwnerName = ownerName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();

    console.log('Form Data:', {
      businessName: trimmedBusinessName,
      ownerName: trimmedOwnerName,
      phone: trimmedPhone,
      years: yearsInBusiness,
      address: trimmedAddress,
    });

    // Regex patterns
    const businessNameRegex = /^[a-zA-Z0-9\s&.,'-\/]{2,50}$/;
    const ownerNameRegex = /^[a-zA-Z\s.'-]{2,50}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const yearsRegex = /^(0|[1-9]\d?)$/;
    const addressRegex = /^[a-zA-Z0-9\s.,'#\-\/()]{5,150}$/;

    // Validation
    if (!trimmedBusinessName) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    if (trimmedBusinessName.length < 3 || trimmedBusinessName.length > 50) {
      Alert.alert('Error', 'Business name must be between 3 and 50 characters');
      return;
    }
    if (!/^[a-zA-Z0-9]/.test(trimmedBusinessName)) {
      Alert.alert('Error', 'Business name must start with a letter or number');
      return;
    }
    if (/\s{2,}/.test(trimmedBusinessName)) {
      Alert.alert('Error', 'Business name cannot contain consecutive spaces');
      return;
    }
    if (!businessNameRegex.test(trimmedBusinessName)) {
      Alert.alert('Error', 'Business name contains invalid characters. Can only contain letters, numbers, spaces, and & . , \' - /');
      return;
    }
    if (!trimmedBusinessName.split(/\s+/).every(word => /^[A-Z0-9]/.test(word))) {
      Alert.alert('Error', 'Each word in the business name must start with a capital letter or number (e.g. "Swiggy Delivery")');
      return;
    }

    if (!trimmedOwnerName) {
      Alert.alert('Error', 'Owner name is required');
      return;
    }
    if (trimmedOwnerName.length < 3 || trimmedOwnerName.length > 50) {
      Alert.alert('Error', 'Owner name must be between 3 and 50 characters');
      return;
    }
    if (!/^[a-zA-Z]/.test(trimmedOwnerName)) {
      Alert.alert('Error', 'Owner name must start with a letter');
      return;
    }
    if (/\s{2,}/.test(trimmedOwnerName)) {
      Alert.alert('Error', 'Owner name cannot contain consecutive spaces');
      return;
    }
    if (!ownerNameRegex.test(trimmedOwnerName)) {
      Alert.alert('Error', 'Owner name must contain only letters, spaces, dots, and hyphens');
      return;
    }
    if (!trimmedOwnerName.split(/\s+/).every(word => /^[A-Z]/.test(word))) {
      Alert.alert('Error', 'Each word in the owner name must start with a capital letter');
      return;
    }

    if (!trimmedPhone) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!phoneRegex.test(trimmedPhone)) {
      Alert.alert('Error', 'Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    if (!yearsInBusiness) {
      Alert.alert('Error', 'Years in business is required');
      return;
    }
    if (!yearsRegex.test(yearsInBusiness)) {
      Alert.alert('Error', 'Years in business must be a valid number between 0 and 99');
      return;
    }

    if (!trimmedAddress) {
      Alert.alert('Error', 'Address is required');
      return;
    }
    if (trimmedAddress.length < 10 || trimmedAddress.length > 150) {
      Alert.alert('Error', 'Address must be between 10 and 150 characters');
      return;
    }
    if (/\s{2,}/.test(trimmedAddress)) {
      Alert.alert('Error', 'Address cannot contain consecutive spaces');
      return;
    }
    if (!addressRegex.test(trimmedAddress)) {
      Alert.alert('Error', 'Address must contain only alphanumeric characters, spaces, and basic symbols (.,\'#-/())');
      return;
    }

    console.log('Validation passed');

    const payload = {
      businessName: trimmedBusinessName,
      ownerName: trimmedOwnerName,
      phoneNumber: trimmedPhone,
      yearsInBusiness: parseInt(yearsInBusiness, 10),
      address: trimmedAddress,
      categories: categories.length > 0 ? categories : [],
    };

    if (!onSubmit) {
      console.error('onSubmit is undefined!');
      Alert.alert('Error', 'Submit function is not available');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      resetForm();
      // Only close if successful (onSubmit might also close it, but good to be safe)
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      let errMsg = error?.message || 'Registration failed';
      if (error?.response?.data?.detail) {
        errMsg = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0].msg 
          : error.response.data.detail;
      }
      Alert.alert('Registration Error', String(errMsg));
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

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Business Name */}
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              placeholderTextColor={COLORS.textLight}
              value={businessName}
              onChangeText={(text) => {
                const filtered = text.replace(/[^a-zA-Z0-9\s&.,'-\/]/g, '');
                const capitalized = filtered
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                setBusinessName(capitalized.slice(0, 50));
              }}
            />

            {/* Owner Name */}
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter owner name"
              placeholderTextColor={COLORS.textLight}
              value={ownerName}
              onChangeText={(text) => {
                const filtered = text.replace(/[^a-zA-Z\s.'-]/g, '');
                const capitalized = filtered
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                setOwnerName(capitalized.slice(0, 50));
              }}
            />

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit phone number"
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

            {/* Categories */}
            <Text style={styles.label}>Categories (e.g. Plumber, Electrician) *</Text>
            <View style={{ marginBottom: SPACING.md }}>
              <TextInput
                style={styles.input}
                placeholder="Search or enter a category"
                placeholderTextColor={COLORS.textLight}
                value={categoryInput}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  setCategoryInput(filtered.slice(0, 30));
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                onSubmitEditing={() => {
                  const cat = categoryInput.trim();
                  if (cat && !categories.includes(cat)) {
                    if (categories.length >= 5) {
                      Alert.alert('Limit reached', 'Maximum 5 categories allowed');
                      return;
                    }
                    setCategories([...categories, cat]);
                  }
                  setCategoryInput('');
                  setShowCategoryDropdown(false);
                }}
              />
            </View>

            {/* Category Dropdown (Pills) */}
            {categoryInput.trim().length > 0 && (
              <View style={styles.categoryDropdown}>
                {filteredCategories.slice(0, 10).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.suggestionPill}
                    onPress={() => {
                      if (categories.length >= 5) {
                        Alert.alert('Limit reached', 'Maximum 5 categories allowed');
                        return;
                      }
                      setCategories([...categories, cat]);
                      setCategoryInput('');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.suggestionPillText}>{cat}</Text>
                    <Ionicons name="add" size={14} color={COLORS.text} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
                
                {/* Custom Category Add */}
                {categoryInput.trim() && !filteredCategories.includes(categoryInput.trim()) && (
                  <TouchableOpacity
                    style={[styles.suggestionPill, { backgroundColor: `${COLORS.primary}15`, borderColor: COLORS.primary }]}
                    onPress={() => {
                      if (categories.length >= 5) {
                        Alert.alert('Limit reached', 'Maximum 5 categories allowed');
                        return;
                      }
                      setCategories([...categories, categoryInput.trim()]);
                      setCategoryInput('');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={[styles.suggestionPillText, { color: COLORS.primary }]}>Add "{categoryInput.trim()}"</Text>
                    <Ionicons name="add-circle" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Selected Categories */}
            {categories.length > 0 && (
              <View style={styles.selectedCategories}>
                {categories.map((cat, idx) => (
                  <View key={idx} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{cat}</Text>
                    <TouchableOpacity onPress={() => setCategories(categories.filter(c => c !== cat))}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
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
              onChangeText={(text) => {
                const filtered = text.replace(/[^a-zA-Z0-9\s.,'#\-\/()]/g, '');
                setAddress(filtered.slice(0, 150));
              }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: `${COLORS.primary}15`, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                onPress={detectLocation}
                disabled={loading}
              >
                <Ionicons name="locate" size={18} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Detect</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: `${COLORS.primary}15`, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                onPress={openMap}
                disabled={loading}
              >
                <Ionicons name="map" size={18} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Map</Text>
              </TouchableOpacity>
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

      {/* Map Picker Modal */}
      <Modal visible={mapPickerVisible} animationType="slide" onRequestClose={() => setMapPickerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setMapPickerVisible(false)} style={{ marginRight: SPACING.md }}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Location</Text>
            </View>
          </View>
          
          {Platform.OS === 'web' ? (
            <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
              {React.createElement('iframe', {
                title: 'Web Map Picker',
                srcDoc: WEB_MAP_HTML_DEFAULT,
                style: {
                  width: '100%',
                  height: '100%',
                  border: '0',
                  display: 'block',
                },
              } as any)}
            </View>
          ) : MapView && mapRegion ? (
            <View style={{ flex: 1 }}>
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ flex: 1 }}
                initialRegion={mapRegion}
                region={mapRegion}
                onRegionChangeComplete={(region: any) => setMapRegion(region)}
                showsUserLocation
                showsMyLocationButton={false}
              />
              <View style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 }}>
                <GooglePlacesAutocomplete
                  placeholder="Search for location"
                  fetchDetails={true}
                  keyboardShouldPersistTaps="handled"
                  onPress={(data, details = null) => {
                    if (details?.geometry?.location) {
                      setMapRegion({
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      });
                    }
                  }}
                  query={{
                    key: 'AIzaSyBK-mmtVFjREbCAP8Ea_a5RfsL4uCAoSUs',
                    language: 'en',
                  }}
                  styles={{
                    container: { flex: 1 },
                    listView: { position: 'absolute', top: 50, backgroundColor: 'white', borderRadius: 8, elevation: 5, zIndex: 20, width: '100%' },
                    textInput: { height: 44, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
                  }}
                />
              </View>
              <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32 }} pointerEvents="none">
                <Ionicons name="location" size={36} color={COLORS.primary} />
              </View>
              <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }, loading && styles.submitBtnDisabled]}
                  onPress={handleMapConfirm}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Confirm Location</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: COLORS.text }}>Map unavailable.</Text>
            </View>
          )}
        </SafeAreaView>
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
    marginBottom: SPACING.sm,
  },
  categorySearchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  categoryDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestionPillText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
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