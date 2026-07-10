import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { SvgXml } from 'react-native-svg';

import { getNakshatraReport, updateExtendedProfile, getProfile, forwardGeocode } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { Avatar } from '../src/components/Avatar';
import { BrandedLoading } from '../src/components/BrandedLoading';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cosmic Analysis tab config
const COSMIC_TABS = [
  { key: 'physical', label: 'Physical', img: require('../assets/images/festival_image/cosmic/cos1.png') },
  { key: 'character', label: 'Character', img: require('../assets/images/festival_image/cosmic/cos2.png') },
  { key: 'education', label: 'Education', img: require('../assets/images/festival_image/cosmic/cos3.png') },
  { key: 'family', label: 'Family', img: require('../assets/images/festival_image/cosmic/cos4.png') },
  { key: 'health', label: 'Health', img: require('../assets/images/festival_image/cosmic/cos5.png') },
];

const CITIES_DB = [
  "Mumbai, Maharashtra, India",
  "Delhi, NCR, India",
  "Bengaluru, Karnataka, India",
  "Kolkata, West Bengal, India",
  "Chennai, Tamil Nadu, India",
  "Hyderabad, Telangana, India",
  "Pune, Maharashtra, India",
  "Ahmedabad, Gujarat, India",
  "Surat, Gujarat, India",
  "Jaipur, Rajasthan, India",
  "Lucknow, Uttar Pradesh, India",
  "Kanpur, Uttar Pradesh, India",
  "Nagpur, Maharashtra, India",
  "Indore, Madhya Pradesh, India",
  "Thane, Maharashtra, India",
  "Bhopal, Madhya Pradesh, India",
  "Visakhapatnam, Andhra Pradesh, India",
  "Pimpri-Chinchwad, Maharashtra, India",
  "Patna, Bihar, India",
  "Vadodara, Gujarat, India",
  "Ghaziabad, Uttar Pradesh, India",
  "Ludhiana, Punjab, India",
  "Agra, Uttar Pradesh, India",
  "Nashik, Maharashtra, India",
  "Ranchi, Jharkhand, India",
  "Faridabad, Haryana, India",
  "Meerut, Uttar Pradesh, India",
  "Rajkot, Gujarat, India",
  "Kalyan-Dombivli, Maharashtra, India",
  "Vasai-Virar, Maharashtra, India",
  "Varanasi, Uttar Pradesh, India",
  "Srinagar, Jammu & Kashmir, India",
  "Aurangabad, Maharashtra, India",
  "Dhanbad, Jharkhand, India",
  "Amritsar, Punjab, India",
  "Navi Mumbai, Maharashtra, India",
  "Allahabad, Uttar Pradesh, India",
  "Howrah, West Bengal, India",
  "Gwalior, Madhya Pradesh, India",
  "Jabalpur, Madhya Pradesh, India",
  "Coimbatore, Tamil Nadu, India",
  "Vijayawada, Andhra Pradesh, India",
  "Jodhpur, Rajasthan, India",
  "Madurai, Tamil Nadu, India",
  "Raipur, Chhattisgarh, India",
  "Kota, Rajasthan, India",
  "Chandigarh, India",
  "Guwahati, Assam, India",
  "Solapur, Maharashtra, India",
  "Hubli-Dharwad, Karnataka, India",
  "Mysore, Karnataka, India",
  "Trivandrum, Kerala, India",
  "Kochi, Kerala, India",
  "Dehradun, Uttarakhand, India",
  "Rishikesh, Uttarakhand, India",
  "Haridwar, Uttarakhand, India",
  "Shimla, Himachal Pradesh, India",
  "Dharamshala, Himachal Pradesh, India",
  "Jammu, Jammu & Kashmir, India",
  "Udaipur, Rajasthan, India",
  "Ajmer, Rajasthan, India",
  "Pushkar, Rajasthan, India",
  "New York, USA",
  "London, UK",
  "Toronto, Canada",
  "Dubai, UAE",
  "Singapore",
  "Sydney, Australia",
  "Melbourne, Australia",
  "Paris, France",
  "Berlin, Germany",
  "Tokyo, Japan",
];

export default function AstrologyScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [activeCosmicTab, setActiveCosmicTab] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Form States
  const [showForm, setShowForm] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLon, setSelectedLon] = useState<number | null>(null);
  const [isFocusedMain, setIsFocusedMain] = useState(false);
  const [isFocusedModal, setIsFocusedModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const fetchKundli = useCallback(async (forceRefresh = false, params?: any) => {
    try {
      if (!isMountedRef.current) return;
      setError('');
      setLoading(!forceRefresh);
      
      const response = await getNakshatraReport(params);
      if (isMountedRef.current) {
        setData(response.data || null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load Kundli report');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const checkAndInitProfile = async () => {
      // Start with already-synced user from authStore (refreshed by loadStoredAuth on startup)
      let activeUser = user;

      const hasBirthDetails = (u: typeof user) =>
        !!(u?.date_of_birth && u?.time_of_birth && u?.place_of_birth);

      // Only hit the network if the locally cached user is missing birth details
      if (!hasBirthDetails(activeUser)) {
        try {
          setLoading(true);
          const res = await getProfile();
          if (res?.data && isMountedRef.current) {
            updateUser(res.data);
            activeUser = { ...user, ...res.data } as typeof user;
          }
        } catch (err) {
          console.warn('Failed to fetch user profile on astrology mount:', err);
        }
      }

      if (!isMountedRef.current) return;

      if (activeUser) {
        let hasAllDetails = true;

        if (activeUser.date_of_birth) {
          const parsedDate = new Date(activeUser.date_of_birth);
          setDate(isNaN(parsedDate.getTime()) ? null : parsedDate);
        } else {
          hasAllDetails = false;
        }

        if (activeUser.time_of_birth) {
          setTimeOfBirth(activeUser.time_of_birth);
        } else {
          hasAllDetails = false;
        }

        if (activeUser.gender) {
          const g = activeUser.gender.toLowerCase();
          if (g === 'male' || g === 'female' || g === 'other') {
            setGender(g as any);
          }
        }

        if (activeUser.place_of_birth) {
          setPlaceOfBirth(activeUser.place_of_birth);
        } else {
          hasAllDetails = false;
        }

        if (hasAllDetails) {
          setShowForm(false);
          const parsedDate = new Date(activeUser.date_of_birth!);
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          const dobStr = `${year}-${month}-${day}`;

          // Sync jyotishStore in-memory state only (no backend write — data already persisted)
          try {
            const { useJyotishStore } = require('../src/store/jyotishStore');
            const js = useJyotishStore.getState();
            if (!js.dob || !js.tob || !js.pob) {
              useJyotishStore.setState({
                dob: dobStr,
                tob: activeUser.time_of_birth!,
                pob: activeUser.place_of_birth!,
              });
            }
          } catch (e) {
            console.warn('Failed to sync to jyotishStore in astrology mount:', e);
          }

          fetchKundli(false, {
            dob: dobStr,
            tob: activeUser.time_of_birth,
            lat: activeUser.place_of_birth_latitude,
            lon: activeUser.place_of_birth_longitude,
          });
        } else {
          setShowForm(true);
          setLoading(false);
        }
      } else {
        setShowForm(true);
        setLoading(false);
      }
    };

    checkAndInitProfile();

    return () => { isMountedRef.current = false; };
  }, [fetchKundli]);

  const onRefresh = () => {
    setRefreshing(true);
    if (date && timeOfBirth && placeOfBirth) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dobStr = `${year}-${month}-${day}`;

      fetchKundli(true, {
        dob: dobStr,
        tob: timeOfBirth.trim(),
        lat: user?.place_of_birth_latitude,
        lon: user?.place_of_birth_longitude,
      });
    } else {
      fetchKundli(true);
    }
  };

  const normalizeTextBlock = (value: any) => {
    const text = Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean).join(' ')
      : String(value ?? '');
    return text.replace(/\s+/g, ' ').trim();
  };

  const formatDateString = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeString = (hours: number, minutes: number) => {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const getDisplayTime = () => {
    if (!timeOfBirth) return '00:00:00';
    if (timeOfBirth.split(':').length === 2) {
      return `${timeOfBirth}:00`;
    }
    return timeOfBirth;
  };

  const getTimeValue = () => {
    const d = new Date();
    if (timeOfBirth) {
      const parts = timeOfBirth.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          d.setHours(hours);
          d.setMinutes(minutes);
        }
      }
    }
    return d;
  };

  const handlePlaceOfBirthChange = async (val: string) => {
    setPlaceOfBirth(val);
    setSelectedLat(null);
    setSelectedLon(null);
    
    if (val.trim().length >= 2) {
      // Instant local search suggestions first
      const localFiltered = CITIES_DB.filter(city =>
        city.toLowerCase().includes(val.toLowerCase())
      ).map(city => ({
        display_name: city,
        latitude: null,
        longitude: null
      }));
      setFilteredCities(localFiltered.slice(0, 5));

      // Network API search suggestions
      try {
        const response = await forwardGeocode(val);
        if (response && response.data && Array.isArray(response.data)) {
          const apiSuggestions = response.data.map((item: any) => ({
            display_name: item.display_name,
            latitude: item.latitude,
            longitude: item.longitude
          }));
          if (apiSuggestions.length > 0) {
            setFilteredCities(apiSuggestions.slice(0, 5));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch place of birth suggestions:', err);
      }
    } else {
      setFilteredCities([]);
    }
  };

  const handleCalculate = async () => {
    if (!date || !timeOfBirth.trim() || !placeOfBirth.trim()) {
      setValidationError('All fields (Date, Time, and Place of Birth) are mandatory.');
      return;
    }
    setValidationError('');
    setCalculating(true);

    try {
      let lat = selectedLat !== null ? selectedLat : 28.6139;
      let lon = selectedLon !== null ? selectedLon : 77.2090;

      if (selectedLat === null || selectedLon === null) {
        try {
          const results = await Location.geocodeAsync(placeOfBirth.trim());
          if (Array.isArray(results) && results.length > 0) {
            lat = results[0].latitude;
            lon = results[0].longitude;
          }
        } catch (err) {
          try {
            const q = encodeURIComponent(placeOfBirth.trim());
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
            }
          } catch {}
        }
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dobStr = `${year}-${month}-${day}`;

      const response = await updateExtendedProfile({
        date_of_birth: dobStr,
        time_of_birth: timeOfBirth.trim(),
        place_of_birth: placeOfBirth.trim(),
        place_of_birth_latitude: lat,
        place_of_birth_longitude: lon,
        gender: gender,
      });

      // Persist the birth details directly into the auth store so the form
      // is never shown again on subsequent visits (secureStorage is updated by updateUser).
      updateUser({
        ...(response.data || {}),
        date_of_birth: dobStr,
        time_of_birth: timeOfBirth.trim(),
        place_of_birth: placeOfBirth.trim(),
        place_of_birth_latitude: lat,
        place_of_birth_longitude: lon,
        gender: gender,
      });

      // Sync to Jyotish store too
      try {
        const { useJyotishStore } = require('../src/store/jyotishStore');
        await useJyotishStore.getState().setBirthDetails(dobStr, timeOfBirth.trim(), placeOfBirth.trim());
      } catch (e) {
        console.warn('Failed to sync to jyotishStore:', e);
      }

      setShowForm(false);
      setShowModal(false);
      fetchKundli(false, {
        dob: dobStr,
        tob: timeOfBirth.trim(),
        lat: lat,
        lon: lon,
      });
    } catch (err: any) {
      setValidationError(err?.response?.data?.detail || err?.message || 'Failed to update birth details');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <BrandedLoading message="Mapping your cosmic stars..." />
    );
  }

  const planets = data?.planets?.response;
  const planetsList = Array.isArray(planets) ? planets : [];
  const moon = planetsList.find((p: any) => p.name?.toLowerCase() === 'moon');
  const ascendant = planetsList.find((p: any) => p.name?.toLowerCase() === 'ascendant');

  const details = {
    Naksahtra: moon?.nakshatra || '-',
    sign: moon?.sign || '-',
    NaksahtraLord: moon?.nakshatra_lord || '-',
    SignLord: moon?.sign_lord || '-',
    Charan: ascendant?.sign || '-',
    Gan: ascendant?.sign_lord || '-',
    Yoni: data?.kaalsarp_dosha?.response?.type && data?.kaalsarp_dosha?.response?.type !== 'none' ? data.kaalsarp_dosha.response.type : 'Absent',
    Nadi: data?.mangal_dosha?.response?.is_mangal_dosha_present ? 'Present' : 'Absent',
    Varna: data?.sadhesati_status?.response?.is_undergoing_sadhesati ? 'Active' : 'Inactive',
    Vashya: data?.gem_suggestion?.response?.life_stone?.name || '-',
  };

  const report = {
    physical: data?.gem_suggestion?.response?.life_stone
      ? `Life Stone suggestion: ${data.gem_suggestion.response.life_stone.name}. Wear it on your ${data.gem_suggestion.response.life_stone.finger} made of ${data.gem_suggestion.response.life_stone.metal}.`
      : 'No physical gemstone details available.',
    character: data?.rudraksha_suggestion?.response?.detail || 'No character description available.',
    education: data?.mangal_dosha?.response?.description || 'No education status details available.',
    family: data?.pitra_dosha?.response?.description || 'No family status details available.',
    health: data?.sadhesati_status?.response?.description || 'No health status details available.',
  };

  const attributes = [
    { label: 'NAKSHATRA LORD', value: details.NaksahtraLord, img: require('../assets/images/iconattributes/Icon1.png'), color: '#F59E0B' },
    { label: 'RASHI LORD', value: details.SignLord, img: require('../assets/images/iconattributes/Icon2.png'), color: '#C67C4E' },
    { label: 'CHARAN', value: details.Charan, img: require('../assets/images/iconattributes/Icon3.png'), color: '#10B981' },
    { label: 'GAN', value: details.Gan, img: require('../assets/images/iconattributes/Icon4.png'), color: '#14B8A6' },
    { label: 'YONI', value: details.Yoni, img: require('../assets/images/iconattributes/Icon5.png'), color: '#EC4899' },
    { label: 'NADI', value: details.Nadi, img: require('../assets/images/iconattributes/Icon6.png'), color: '#EF4444' },
    { label: 'VARNA', value: details.Varna, img: require('../assets/images/iconattributes/Icon7.png'), color: '#3B82F6' },
    { label: 'VASHYA', value: details.Vashya, img: require('../assets/images/iconattributes/Icon8.png'), color: '#C67C4E' },
  ];

  return (
    <LinearGradient 
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']} 
      locations={[0, 0.1058, 0.2212]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#5A3E2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Janam Kundli</Text>
          {!showForm ? (
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerEditBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#5A3E2B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </SafeAreaView>

      {showForm ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter Birth Details</Text>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="calendar-outline" size={15} color="#5A4136" />
                <Text style={styles.inputLabel}>Date of Birth</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowTimePicker(false);
                }}
                style={styles.touchableInput}
              >
                <Text style={{ fontSize: 16, color: date ? '#1B1C1C' : '#A9968F' }}>
                  {date ? formatDateString(date) : 'dd/mm/yyyy'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  style={styles.pickerStyle}
                />
              )}
            </View>

            {/* Time of Birth */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="time-outline" size={15} color="#5A4136" />
                <Text style={styles.inputLabel}>Time of Birth</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowTimePicker(!showTimePicker);
                  setShowDatePicker(false);
                }}
                style={styles.touchableInput}
              >
                <Text style={{ fontSize: 16, color: timeOfBirth ? '#1B1C1C' : '#A9968F' }}>
                  {getDisplayTime()}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={getTimeValue()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => {
                    if (Platform.OS === 'android') {
                      setShowTimePicker(false);
                    }
                    if (selectedTime) {
                      setTimeOfBirth(formatTimeString(selectedTime.getHours(), selectedTime.getMinutes()));
                    }
                  }}
                  style={styles.pickerStyle}
                />
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="transgender-outline" size={15} color="#5A4136" />
                <Text style={styles.inputLabel}>Gender</Text>
              </View>
              <View style={styles.genderRowContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setGender('male')}
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                >
                  <Ionicons
                    name="male"
                    size={16}
                    color={gender === 'male' ? '#FF7B00' : '#7D685E'}
                  />
                  <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setGender('female')}
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                >
                  <Ionicons
                    name="female"
                    size={16}
                    color={gender === 'female' ? '#FF7B00' : '#7D685E'}
                  />
                  <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setGender('other')}
                  style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                >
                  <Ionicons
                    name="transgender"
                    size={16}
                    color={gender === 'other' ? '#FF7B00' : '#7D685E'}
                  />
                  <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Place of Birth */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="location-outline" size={15} color="#5A4136" />
                <Text style={styles.inputLabel}>Place of Birth</Text>
              </View>
              {filteredCities.length > 0 && isFocusedMain && (
                <View style={styles.suggestionsContainerAbove}>
                  {filteredCities.map((city, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setPlaceOfBirth(city.display_name);
                        setSelectedLat(city.latitude);
                        setSelectedLon(city.longitude);
                        setFilteredCities([]);
                        setIsFocusedMain(false);
                      }}
                    >
                      <Ionicons name="location-outline" size={14} color="#7D685E" style={{ marginRight: 8 }} />
                      <Text style={styles.suggestionText}>{city.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TextInput
                style={styles.textInput}
                placeholder="City, State or Country"
                placeholderTextColor="#A9968F"
                value={placeOfBirth}
                onFocus={() => {
                  setIsFocusedMain(true);
                  if (placeOfBirth.trim().length >= 2) {
                    handlePlaceOfBirthChange(placeOfBirth);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setIsFocusedMain(false);
                  }, 250);
                }}
                onChangeText={handlePlaceOfBirthChange}
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoNotice}>
              <Ionicons name="information-circle-outline" size={20} color="#FF7B00" />
              <Text style={styles.infoNoticeText}>
                Explore your Vedic birth chart and see how planetary placements shape your current cosmic phase.
              </Text>
            </View>

            {/* Validation Error */}
            {!!validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            {/* Calculate Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.calculateBtn}
              onPress={handleCalculate}
              disabled={calculating}
            >
              <Text style={styles.calculateBtnText}>
                {calculating ? 'Calculating...' : 'Calculate Kundli'}
              </Text>
              {!calculating && <Ionicons name="chevron-forward" size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C67C4E" />}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardAvatarWrapper}>
              <Avatar 
                name={user?.name || 'User'} 
                photo={user?.photo} 
                size={Platform.OS === 'android' ? 36 : 48} 
              />
            </View>
            <View style={styles.profileCardText}>
              <Text style={styles.profileCardName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileCardSub}>
                {(() => {
                  const parts: string[] = [];
                  const dob = user?.date_of_birth || '1994-09-24';
                  const tob = user?.time_of_birth || '06:45';

                  if (dob) {
                    const d = new Date(dob);
                    if (!isNaN(d.getTime())) {
                      const day = d.getDate();
                      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      parts.push(`${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`);
                    }
                  }
                  if (tob) {
                    const timeParts = tob.split(':');
                    if (timeParts.length >= 2) {
                      const h = parseInt(timeParts[0], 10);
                      const m = timeParts[1].padStart(2, '0');
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 === 0 ? 12 : h % 12;
                      parts.push(`${String(h12).padStart(2, '0')}:${m} ${ampm}`);
                    }
                  }
                  return parts.join(' • ');
                })()}
              </Text>
            </View>
          </View>

           {/* Kundli Chart Image */}
          <View style={styles.chartCard}>
            {data?.chart_d1 ? (
              <SvgXml
                xml={data.chart_d1}
                width={289}
                height={289}
                style={{ borderRadius: 12 }}
              />
            ) : (
              <Image
                source={require('../assets/images/kundli_chart.jpg')}
                style={styles.chartImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Ask AI Card commented out for now */}
          {/*
          <View style={styles.askAiCard}>
            <View style={styles.askAiHeader}>
              <Text style={styles.askAiIcon}>✦</Text>
              <View style={styles.askAiHeaderText}>
                <Text style={styles.askAiTitle}>Ask AI about your horoscope</Text>
                <Text style={styles.askAiSubtitle}>Get insights tailored to your situation</Text>
              </View>
            </View>
            <View style={styles.askAiChips}>
              {[
                { label: 'Love', icon: 'heart' },
                { label: 'Career', icon: 'briefcase' },
                { label: 'Health', icon: 'fitness' },
                { label: 'Auspicious Timing', icon: 'time' },
                { label: 'Spiritual Guidance', icon: 'sparkles' },
              ].map((chip) => (
                <View key={chip.label} style={styles.askAiChip}>
                  <Ionicons
                    name={chip.icon === 'sparkles' ? 'star' : chip.icon as any}
                    size={12}
                    color="#C67C4E"
                  />
                  <Text style={styles.askAiChipText}>{chip.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.askAiBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/ai-jyotish' as any)}
            >
              <Text style={styles.askAiBtnText}>Ask Now</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          */}

          {/* Nakshatra & Rashi Card */}
          {!error && (
            <View style={styles.insightsCard}>
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel} numberOfLines={1}>NAKSHATRA</Text>
                <Text style={styles.insightValue} numberOfLines={1}>{details.Naksahtra || '-'}</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel} numberOfLines={1}>RASHI</Text>
                <Text style={styles.insightValue} numberOfLines={1}>{details.sign || '-'}</Text>
              </View>
            </View>
          )}

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Spiritual Attributes */}
          {!error && details && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spiritual Attributes (Ashtakoot)</Text>
              <View style={styles.grid}>
                {attributes.map((attr, i) => (
                  <View key={i} style={styles.attrCard}>
                    <View style={styles.attrIconBg}>  
                      <Image source={attr.img} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    </View>
                    <View style={styles.attrTextCol}>
                      <Text style={styles.attrLabel}>{attr.label}</Text>
                      <Text style={styles.attrValue}>{attr.value || '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cosmic Analysis */}
          {!error && report && Object.keys(report).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Cosmic Analysis</Text>
              
              {/* Tab Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cosmicTabScroll} contentContainerStyle={styles.cosmicTabRow}>
                {COSMIC_TABS.map((tab) => {
                  const isActive = activeCosmicTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.cosmicTab, isActive && styles.cosmicTabActive]}
                      onPress={() => setActiveCosmicTab(tab.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cosmicTabIcon, isActive && styles.cosmicTabIconActive]}>
                        <Image source={tab.img} style={{ width: 36, height: 36, aspectRatio: 1, tintColor: isActive ? '#FFF' : undefined }} resizeMode="contain" />
                      </View>
                      <Text style={[styles.cosmicTabLabel, isActive && styles.cosmicTabLabelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Report Content Modal */}
              <Modal
                visible={!!activeCosmicTab}
                transparent
                animationType="fade"
                onRequestClose={() => setActiveCosmicTab(null)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalCard}>
                    {(() => {
                      const activeTabObj = COSMIC_TABS.find(t => t.key === activeCosmicTab);
                      if (!activeTabObj) return null;
                      
                      let activeReportText = '';
                      for (const [key, paragraphs] of Object.entries(report)) {
                        if (key.toLowerCase().includes(activeCosmicTab as string)) {
                          activeReportText = normalizeTextBlock(paragraphs);
                          break;
                        }
                      }

                      return (
                        <>
                          <View style={styles.modalIconWrap}>
                            <Image source={activeTabObj.img} style={{ width: 32, height: 32, tintColor: '#FFF' }} resizeMode="contain" />
                          </View>
                          <Text style={styles.modalTitle}>{activeTabObj.label} Summary</Text>
                          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={styles.modalDesc}>{activeReportText || 'No summary available.'}</Text>
                          </ScrollView>
                          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveCosmicTab(null)} activeOpacity={0.8}>
                            <Text style={styles.modalCloseText}>Close</Text>
                          </TouchableOpacity>
                        </>
                      );
                    })()}
                  </View>
                </View>
              </Modal>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* CHANGE BIRTH DETAILS BOTTOM SHEET MODAL */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.bottomSheetOverlay} 
          activeOpacity={1} 
          onPress={() => setShowModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.bottomSheetCard}
          >
            <View style={styles.bottomSheetHeader}>
              <View style={{ width: 24 }} />
              <Text style={styles.bottomSheetTitle}>Change Birth Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.bottomSheetClose}>
                <Ionicons name="close" size={24} color="#5A4136" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Date of Birth */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-outline" size={15} color="#5A4136" />
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowTimePicker(false);
                  }}
                  style={styles.touchableInput}
                >
                  <Text style={{ fontSize: 16, color: date ? '#1B1C1C' : '#A9968F' }}>
                    {date ? formatDateString(date) : 'dd/mm/yyyy'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                    style={styles.pickerStyle}
                  />
                )}
              </View>

              {/* Time of Birth */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="time-outline" size={15} color="#5A4136" />
                  <Text style={styles.inputLabel}>Time of Birth</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowTimePicker(!showTimePicker);
                    setShowDatePicker(false);
                  }}
                  style={styles.touchableInput}
                >
                  <Text style={{ fontSize: 16, color: timeOfBirth ? '#1B1C1C' : '#A9968F' }}>
                    {getDisplayTime()}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={getTimeValue()}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                      if (Platform.OS === 'android') {
                        setShowTimePicker(false);
                      }
                      if (selectedTime) {
                        setTimeOfBirth(formatTimeString(selectedTime.getHours(), selectedTime.getMinutes()));
                      }
                    }}
                    style={styles.pickerStyle}
                  />
                )}
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="transgender-outline" size={15} color="#5A4136" />
                  <Text style={styles.inputLabel}>Gender</Text>
                </View>
                <View style={styles.genderRowContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setGender('male')}
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  >
                    <Ionicons
                      name="male"
                      size={16}
                      color={gender === 'male' ? '#FF7B00' : '#7D685E'}
                    />
                    <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setGender('female')}
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  >
                    <Ionicons
                      name="female"
                      size={16}
                      color={gender === 'female' ? '#FF7B00' : '#7D685E'}
                    />
                    <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                      Female
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setGender('other')}
                    style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                  >
                    <Ionicons
                      name="transgender"
                      size={16}
                      color={gender === 'other' ? '#FF7B00' : '#7D685E'}
                    />
                    <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Place of Birth */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={15} color="#5A4136" />
                  <Text style={styles.inputLabel}>Place of Birth</Text>
                </View>
                {filteredCities.length > 0 && isFocusedModal && (
                  <View style={styles.suggestionsContainerAbove}>
                    {filteredCities.map((city, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setPlaceOfBirth(city.display_name);
                          setSelectedLat(city.latitude);
                          setSelectedLon(city.longitude);
                          setFilteredCities([]);
                          setIsFocusedModal(false);
                        }}
                      >
                        <Ionicons name="location-outline" size={14} color="#7D685E" style={{ marginRight: 8 }} />
                        <Text style={styles.suggestionText}>{city.display_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TextInput
                  style={styles.textInput}
                  placeholder="City, State or Country"
                  placeholderTextColor="#A9968F"
                  value={placeOfBirth}
                  onFocus={() => {
                    setIsFocusedModal(true);
                    if (placeOfBirth.trim().length >= 2) {
                      handlePlaceOfBirthChange(placeOfBirth);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsFocusedModal(false);
                    }, 250);
                  }}
                  onChangeText={handlePlaceOfBirthChange}
                />
              </View>

              {/* Info Box */}
              <View style={styles.infoNotice}>
                <Ionicons name="information-circle-outline" size={20} color="#FF7B00" />
                <Text style={styles.infoNoticeText}>
                  Explore your Vedic birth chart and see how planetary placements shape your current cosmic phase.
                </Text>
              </View>

              {/* Validation Error */}
              {!!validationError && (
                <Text style={styles.errorText}>{validationError}</Text>
              )}

              {/* Calculate Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.calculateBtn}
                onPress={handleCalculate}
                disabled={calculating}
              >
                <Text style={styles.calculateBtnText}>
                  {calculating ? 'Calculating...' : 'Calculate Kundli'}
                </Text>
                {!calculating && <Ionicons name="chevron-forward" size={18} color="#FFF" />}
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    color: '#5C2A01',
    fontFamily: 'System',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
  },
  headerEditBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#8D6E63', fontSize: 14 },

  // Form Styles
  formScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: 'rgba(160, 65, 0, 0.1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 10,
  },
  formTitle: {
    alignSelf: 'stretch',
    color: '#1B1C1C',
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 40,
    marginBottom: 20,
  },
  inputGroup: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    color: '#5A4136',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    marginLeft: 8,
  },
  touchableInput: {
    height: 50,
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    height: 50,
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1B1C1C',
  },
  genderRowContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    height: 50,
    padding: 3,
    alignItems: 'center',
  },
  genderButton: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF7B00',
  },
  genderButtonText: {
    color: '#7D685E',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#FF7B00',
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderColor: '#E2BFB0',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -4,
    paddingTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsContainerAbove: {
    position: 'absolute',
    bottom: 54,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderColor: '#E2BFB0',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2ECE9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1B1C1C',
  },
  infoNotice: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF5F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoNoticeText: {
    color: '#5A4136',
    fontFamily: 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16,
    marginLeft: 10,
    flex: 1,
  },
  calculateBtn: {
    alignSelf: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#FF7B00',
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(255, 123, 0, 0.30)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  calculateBtnText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textTransform: 'capitalize',
    marginRight: 8,
  },
  pickerStyle: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
  },

  // Profile Card (new design matching reference)
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    height: Platform.OS === 'android' ? 62 : 80,
    alignSelf: 'center',
    borderRadius: Platform.OS === 'android' ? 32 : 48,
    paddingHorizontal: 16,
    shadowColor: 'rgba(150, 73, 0, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    width: Platform.OS === 'android' ? 310 : 350,
  },
  profileCardAvatarWrapper: {
    borderWidth: Platform.OS === 'android' ? 1.5 : 2,
    borderColor: '#FF7B00',
    borderRadius: Platform.OS === 'android' ? 20 : 26,
    padding: Platform.OS === 'android' ? 1 : 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardText: {
    flex: 1,
  },
  profileCardName: {
    color: '#1A1C1C',
    fontFamily: 'System',
    fontSize: Platform.OS === 'android' ? 16 : 20,
    fontWeight: '600',
    lineHeight: Platform.OS === 'android' ? 18 : 20,
  },
  profileCardSub: {
    color: '#564337',
    fontFamily: 'System',
    fontSize: Platform.OS === 'android' ? 11 : 14,
    fontWeight: '500',
    lineHeight: Platform.OS === 'android' ? 14 : 20,
    marginTop: Platform.OS === 'android' ? 1 : 2,
  },

  // Kundli Chart
  chartCard: {
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  chartImage: {
    width: 289,
    height: 289,
    borderRadius: 12,
  },

  // Ask AI Card
  askAiCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0E0D0',
  },
  askAiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  askAiIcon: {
    fontSize: 18,
    color: '#FF7B00',
    marginRight: 10,
    marginTop: 1,
  },
  askAiHeaderText: {
    flex: 1,
  },
  askAiTitle: {
    color: '#1B1C1C',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  askAiSubtitle: {
    color: '#7D685E',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 2,
  },
  askAiChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  askAiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F0D5B8',
    gap: 5,
  },
  askAiChipText: {
    color: '#7D685E',
    fontSize: 12,
    fontWeight: '500',
  },
  askAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7B00',
    borderRadius: 50,
    height: 48,
    gap: 6,
    shadowColor: 'rgba(255, 123, 0, 0.30)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  askAiBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Legacy profile styles (kept for backward compat)
  profileSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2.5, borderColor: '#C67C4E',
    overflow: 'hidden', marginRight: 14,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: '#FCEADE', justifyContent: 'center', alignItems: 'center' },
  profileText: { flex: 1 },
  profileName: { 
    color: '#311303',
    fontFamily: 'System',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0.6,
    textTransform: 'capitalize',
  },
  profileStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#584235', marginRight: 6 },
  profileStatus: { fontSize: 16, color: '#584235', fontWeight: '400', lineHeight: 24, fontStyle: 'normal' },

  // Insights Card
  insightsCard: {
    flexDirection: 'row',
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1, borderColor: '#F0E0D0',
    shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  insightBox: { flex: 1, alignItems: 'center' },
  insightLabel: { 
    fontSize: Platform.OS === 'android' ? 10 : 12, 
    color: '#584235', 
    fontWeight: '700', 
    lineHeight: Platform.OS === 'android' ? 14 : 16, 
    letterSpacing: Platform.OS === 'android' ? 0.6 : 1.2, 
    textTransform: 'uppercase', 
    textAlign: 'center', 
    fontStyle: 'normal' 
  },
  insightValue: { 
    fontSize: Platform.OS === 'android' ? 16 : 18, 
    fontWeight: '600', 
    color: '#994700', 
    marginTop: 4, 
    lineHeight: Platform.OS === 'android' ? 22 : 24, 
    textAlign: 'center', 
    fontStyle: 'normal' 
  },
  insightDivider: { width: 1, backgroundColor: '#F0E0D0' },

  // Section
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { 
    color: '#311303',
    fontFamily: 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
  },

  // Attribute Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  attrCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: '#F0E0D0',
    shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  attrIconBg: {
    width: 40, height: 40, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    backgroundColor: '#FFEAE0',
  },
  attrTextCol: { flex: 1 },
  attrLabel: { fontSize: 10, color: '#584235', fontWeight: '700', lineHeight: 12, textTransform: 'uppercase', fontStyle: 'normal' },
  attrValue: { fontSize: 16, color: '#311303', fontWeight: '700', lineHeight: 24, fontStyle: 'normal', marginTop: 2 },

  // Cosmic Tabs
  cosmicTabScroll: { marginBottom: 16 },
  cosmicTabRow: { gap: 12 },
  cosmicTab: { alignItems: 'center', minWidth: 64 },
  cosmicTabActive: {},
  cosmicTabIcon: {
    width: 56, height: 56, borderRadius: 40,
    backgroundColor: '#FF7B00',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#F0D5B8',
  },
  cosmicTabIconActive: {
    backgroundColor: '#FF7B00',
    borderColor: '#FF7B00',
  },
  cosmicTabLabel: { fontSize: 11, fontWeight: '700', color: '#994700', marginTop: 4, textAlign: 'center', fontStyle: 'normal', lineHeight: 14, letterSpacing: 0.5, textTransform: 'capitalize' },
  cosmicTabLabelActive: { color: '#C67C4E' },

  // Report
  reportCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F0E0D0',
  },
  reportCategory: { fontSize: 11, fontWeight: '800', color: '#C67C4E', marginBottom: 8, letterSpacing: 1 },
  reportText: { fontSize: 14, color: '#5D4037', lineHeight: 22 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, gap: 8, marginHorizontal: 20, marginTop: 16 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600', flex: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FF7B00',
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 250,
    width: '100%',
    marginBottom: 24,
  },
  modalDesc: {
    color: '#311303',
    textAlign: 'center',
    fontFamily: 'System',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
  },
  modalCloseBtn: {
    width: 302,
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    color: '#1B1C1C',
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
    flex: 1,
  },
  bottomSheetClose: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
});
