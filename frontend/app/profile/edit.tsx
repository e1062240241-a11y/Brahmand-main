import React, { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { BORDER_RADIUS, COLORS, SPACING } from '../../src/constants/theme';
import { getUserProfile, updateExtendedProfile, deleteUserProfile } from '../../src/services/api';
import { useAuthStore, sanitizeUserProfile } from '../../src/store/authStore';
import { useVendorStore } from '../../src/store/vendorStore';
import { useTranslation } from '../../src/utils/i18n';
import { DeleteOTPModal } from '../../src/components/DeleteOTPModal';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateUser, logout } = useAuthStore();
  const { myVendor, fetchMyVendor } = useVendorStore();
  const [deleting, setDeleting] = useState(false);
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [kuldevi, setKuldevi] = useState('');
  const [kuldeviTempleArea, setKuldeviTempleArea] = useState('');
  const [gotra, setGotra] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(''); // stored as DD/MM/YYYY for display
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');

  const [gender, setGender] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getUserProfile();
        let data = response.data || {};
        if (Platform.OS === 'android') {
          data = sanitizeUserProfile(data);
        }
        const homeLocation = data.home_location || data.location || {};

        setName(data.name || '');
        setLanguage(data.language || '');
        setKuldevi(data.kuldevi || '');
        setKuldeviTempleArea(data.kuldevi_temple_area || '');
        setGotra(data.gotra || '');
        // Convert YYYY-MM-DD from backend → DD/MM/YYYY for Indian format display
        const rawDob = data.date_of_birth || '';
        if (rawDob && /^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
          const [y, m, d] = rawDob.split('-');
          setDateOfBirth(`${d}/${m}/${y}`);
          setDobDate(new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
        } else {
          setDateOfBirth(rawDob);
          if (rawDob) {
            const parsed = new Date(rawDob);
            if (!isNaN(parsed.getTime())) {
              setDobDate(parsed);
            }
          }
        }
        let rawTob = data.time_of_birth || '';
        if (rawTob) {
          const parts = rawTob.split(':');
          if (parts.length >= 2) {
            rawTob = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
        }
        setTimeOfBirth(rawTob);
        setPlaceOfBirth(
          data.place_of_birth ||
            [homeLocation.area, homeLocation.city, homeLocation.state].filter(Boolean).join(', ')
        );
        setGender(data.gender || '');
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    fetchMyVendor().catch(() => {});
  }, []);

  const astrologyReady = useMemo(() => {
    return Boolean(dateOfBirth.trim() && timeOfBirth.trim() && placeOfBirth.trim());
  }, [dateOfBirth, placeOfBirth, timeOfBirth]);

  // Convert DD/MM/YYYY → YYYY-MM-DD for API
  const convertDobForApi = (dob: string): string => {
    const trimmed = dob.trim();
    if (!trimmed) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return `${y}-${m}-${d}`;
    }
    return trimmed; // already in YYYY-MM-DD or other format
  };

  const validate = () => {
    if (dateOfBirth) {
      const dob = dateOfBirth.trim();
      const isIndianFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
      const isIsoFormat = /^\d{4}-\d{2}-\d{2}$/.test(dob);
      if (!isIndianFormat && !isIsoFormat) {
        return t('language') === 'hi' ? 'जन्म तिथि DD/MM/YYYY प्रारूप में होनी चाहिए' : 'Date of birth must be in DD/MM/YYYY format';
      }
    }
    if (timeOfBirth && !/^\d{2}:\d{2}(:\d{2})?$/.test(timeOfBirth.trim())) {
      return t('language') === 'hi' ? 'जन्म का समय HH:MM प्रारूप में होना चाहिए' : 'Time of birth must be in HH:MM format';
    }
    return '';
  };

  const handleDeleteAccount = () => {
    // Check for phone number requirement
    const userPhone = useAuthStore.getState().user?.phone;
    if (!userPhone) {
      Alert.alert(
        t('language') === 'hi' ? 'फ़ोन नंबर आवश्यक है' : 'Phone Number Required',
        t('language') === 'hi'
          ? 'खाता हटाने के लिए एक पंजीकृत मोबाइल नंबर की आवश्यकता होती है। कृपया पहले अपनी प्रोफ़ाइल में फ़ोन नंबर अपडेट करें।'
          : 'A registered mobile number is required to delete your account. Please update your phone number first.'
      );
      return;
    }

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          t('language') === 'hi' 
            ? 'चेतावनी: क्या आप वाकई अपना खाता स्थायी रूप से हटाना चाहते हैं? इस कार्रवाई को पूर्ववत नहीं किया जा सकता है और आपका सारा डेटा (पोस्ट, टिप्पणियाँ, प्रोफ़ाइल जानकारी) पूरी तरह से हटा दिया जाएगा।' 
            : 'WARNING: Are you sure you want to permanently delete your account? This action cannot be undone and all your data (posts, comments, profile information) will be completely removed.'
        )
      ) {
        setOtpModalVisible(true);
      }
      return;
    }

    Alert.alert(
      t('language') === 'hi' ? 'खाता हटाएं' : 'Delete Account',
      t('language') === 'hi' 
        ? 'चेतावनी: क्या आप वाकई अपना खाता स्थायी रूप से हटाना चाहते हैं? इस कार्रवाई को पूर्ववत नहीं किया जा सकता है और आपका सारा डेटा पूरी तरह से हटा दिया जाएगा।' 
        : 'WARNING: Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be completely removed.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('language') === 'hi' ? 'स्थायी रूप से हटाएं' : 'Delete Permanently',
          style: 'destructive',
          onPress: () => setOtpModalVisible(true),
        },
      ]
    );
  };

  const handleVerifyOTPAndDelete = async (otp: string) => {
    try {
      await deleteUserProfile(otp);
      setOtpModalVisible(false);
      Alert.alert(
        t('language') === 'hi' ? 'खाता हटा दिया गया' : 'Account Deleted',
        t('language') === 'hi' ? 'आपका खाता सफलतापूर्वक हटा दिया गया है।' : 'Your account has been deleted successfully.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/');
            },
          },
        ]
      );
    } catch (err: any) {
      throw err; // Propagate error to modal to display it
    }
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Attempt to geocode the entered place to coordinates so astrology can use exact birth location
      let lat: number | undefined;
      let lng: number | undefined;
      const placeText = placeOfBirth.trim();
      if (placeText) {
        try {
          const results = await Location.geocodeAsync(placeText);
          if (Array.isArray(results) && results.length > 0) {
            lat = results[0].latitude;
            lng = results[0].longitude;
          }
        } catch {
          // geocodeAsync may not be available on all platforms; fallback to Nominatim lookup
          try {
            const q = encodeURIComponent(placeText);
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lng = parseFloat(data[0].lon);
            }
          } catch {
            // ignore geocoding failure — we'll still save the textual place
          }
        }
      }

      const response = await updateExtendedProfile({
        name: name.trim() || undefined,
        language: language.trim() || undefined,
        kuldevi: kuldevi.trim() || undefined,
        kuldevi_temple_area: kuldeviTempleArea.trim() || undefined,
        gotra: gotra.trim() || undefined,
        date_of_birth: dateOfBirth.trim() ? convertDobForApi(dateOfBirth) : undefined,
        time_of_birth: timeOfBirth.trim() || undefined,
        place_of_birth: placeText || undefined,
        place_of_birth_latitude: lat,
        place_of_birth_longitude: lng,
        gender: gender.trim() || undefined,
      });

      updateUser(response.data || {});
      Alert.alert(
        t('language') === 'hi' ? 'प्रोफ़ाइल अपडेट हो गई' : 'Profile Updated',
        astrologyReady
          ? (t('language') === 'hi' ? 'आपके जन्म के विवरण सहेज लिए गए हैं। कुंडली और ज्योतिष ऐप में हर जगह इनका उपयोग कर सकते हैं।' : 'Your birth details are saved. Horoscope and astrology can reuse them across the app.')
          : (t('language') === 'hi' ? 'आपकी प्रोफ़ाइल का विवरण अपडेट कर दिया गया है।' : 'Your profile details were updated.'),
        [{ text: 'OK', onPress: handleBack }],
      );
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {t('language') === 'hi' ? 'प्रोफ़ाइल लोड हो रही है...' : 'Loading profile...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('language') === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>
                {t('language') === 'hi' ? 'ज्योतिष प्रोफ़ाइल' : 'Astrology Profile'}
              </Text>
              <Text style={styles.heroText}>
                {t('language') === 'hi' ? 'अपने जन्म का विवरण यहाँ एक बार सहेजें। राशिफल और ज्योतिष पेज ऐप में हर जगह इनका उपयोग करेंगे।' : 'Save your birth details once here. Horoscope and astrology pages will reuse them everywhere in the app.'}
              </Text>
              <View style={[styles.statusBadge, astrologyReady ? styles.statusBadgeReady : styles.statusBadgePending]}>
                <Ionicons
                  name={astrologyReady ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={astrologyReady ? COLORS.success : COLORS.warning}
                />
                <Text style={[styles.statusText, astrologyReady ? styles.statusTextReady : styles.statusTextPending]}>
                  {astrologyReady 
                    ? (t('language') === 'hi' ? 'ज्योतिष तैयार है' : 'Astrology ready') 
                    : (t('language') === 'hi' ? 'जन्म का विवरण गायब है' : 'Birth details missing')}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('language') === 'hi' ? 'सामान्य जानकारी' : 'Basic Info'}
              </Text>
              <View style={styles.card}>
                <Input 
                  label={t('language') === 'hi' ? 'नाम' : 'Name'} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder={t('language') === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'} 
                />
                <Input 
                  label={t('language') === 'hi' ? 'भाषा' : 'Language'} 
                  value={language} 
                  onChangeText={setLanguage} 
                  placeholder={t('language') === 'hi' ? 'पसंदीदा भाषा' : 'Preferred language'} 
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('language') === 'hi' ? 'जन्म का विवरण' : 'Birth Details'}
              </Text>
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!dobDate) {
                      setDobDate(new Date());
                    }
                    setShowDatePicker(!showDatePicker);
                    setShowTimePicker(false);
                  }}
                >
                  <View pointerEvents="none">
                    <Input
                      label={t('language') === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}
                      value={dateOfBirth}
                      placeholder="DD/MM/YYYY"
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dobDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setDobDate(selectedDate);
                        const day = String(selectedDate.getDate()).padStart(2, '0');
                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const year = selectedDate.getFullYear();
                        setDateOfBirth(`${day}/${month}/${year}`);
                      }
                    }}
                    style={{ alignSelf: 'center', marginVertical: 8 }}
                  />
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowTimePicker(!showTimePicker);
                    setShowDatePicker(false);
                  }}
                >
                  <View pointerEvents="none">
                    <Input
                      label={t('language') === 'hi' ? 'जन्म का समय' : 'Time of Birth'}
                      value={timeOfBirth}
                      placeholder="HH:MM"
                      editable={false}
                    />
                  </View>
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
                        const hours = String(selectedTime.getHours()).padStart(2, '0');
                        const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
                        setTimeOfBirth(`${hours}:${minutes}`);
                      }
                    }}
                    style={{ alignSelf: 'center', marginVertical: 8 }}
                  />
                )}

                {/* Gender */}
                <View style={styles.genderContainer}>
                  <Text style={styles.genderLabel}>
                    {t('language') === 'hi' ? 'लिंग' : 'Gender'}
                  </Text>
                  <View style={styles.genderRowContainer}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setGender('male')}
                      style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                    >
                      <Ionicons
                        name="male"
                        size={16}
                        color={gender === 'male' ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                        {t('language') === 'hi' ? 'पुरुष' : 'Male'}
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
                        color={gender === 'female' ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                        {t('language') === 'hi' ? 'महिला' : 'Female'}
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
                        color={gender === 'other' ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>
                        {t('language') === 'hi' ? 'अन्य' : 'Other'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Input
                  label={t('language') === 'hi' ? 'जन्म स्थान' : 'Place of Birth'}
                  value={placeOfBirth}
                  onChangeText={setPlaceOfBirth}
                  placeholder={t('language') === 'hi' ? 'शहर, राज्य, देश' : 'City, State, Country'}
                />
                <Text style={styles.helperText}>
                  {t('language') === 'hi' ? 'ये तीन फ़ील्ड वे हैं जिनकी राशिफल और ज्योतिष सुविधाओं को आवश्यकता है। सहेजने के बाद, ऐप उनका स्वचालित रूप से उपयोग करता है।' : 'These three fields are what the horoscope and astrology features need. Once saved, the app uses them automatically.'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('language') === 'hi' ? 'वैकल्पिक आध्यात्मिक विवरण' : 'Optional Spiritual Details'}
              </Text>
              <View style={styles.card}>
                <Input 
                  label={t('language') === 'hi' ? 'कुलदेवी / कुलदेवता' : 'Kuldevi / Kuldevta'} 
                  value={kuldevi} 
                  onChangeText={setKuldevi} 
                  placeholder={t('language') === 'hi' ? 'वैकल्पिक' : 'Optional'} 
                />
                <Input
                  label={t('language') === 'hi' ? 'कुलदेवी मंदिर क्षेत्र' : 'Kuldevi Temple Area'}
                  value={kuldeviTempleArea}
                  onChangeText={setKuldeviTempleArea}
                  placeholder={t('language') === 'hi' ? 'वैकल्पिक' : 'Optional'}
                />
                <Input 
                  label={t('language') === 'hi' ? 'गोत्र' : 'Gotra'} 
                  value={gotra} 
                  onChangeText={setGotra} 
                  placeholder={t('language') === 'hi' ? 'वैकल्पिक' : 'Optional'} 
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Service Registration Info */}
            {myVendor && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('language') === 'hi' ? 'सेवा पंजीकरण' : 'Service Registration'}
                </Text>
                <View style={styles.card}>
                  <View style={styles.vendorRow}>
                    <Ionicons name="storefront-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.vendorLabel}>{t('language') === 'hi' ? 'व्यवसाय का नाम' : 'Business Name'}</Text>
                  </View>
                  <Text style={styles.vendorValue}>{myVendor.business_name || '—'}</Text>

                  <View style={[styles.vendorRow, { marginTop: 12 }]}>
                    <Ionicons name="person-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.vendorLabel}>{t('language') === 'hi' ? 'मालिक का नाम' : 'Owner Name'}</Text>
                  </View>
                  <Text style={styles.vendorValue}>{myVendor.owner_name || '—'}</Text>

                  <View style={[styles.vendorRow, { marginTop: 12 }]}>
                    <Ionicons name="call-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.vendorLabel}>{t('language') === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
                  </View>
                  <Text style={styles.vendorValue}>{myVendor.phone_number || '—'}</Text>

                  <View style={[styles.vendorRow, { marginTop: 12 }]}>
                    <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.vendorLabel}>{t('language') === 'hi' ? 'पता' : 'Address'}</Text>
                  </View>
                  <Text style={styles.vendorValue}>{myVendor.full_address || '—'}</Text>

                  {(myVendor.categories || []).length > 0 && (
                    <>
                      <View style={[styles.vendorRow, { marginTop: 12 }]}>
                        <Ionicons name="grid-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.vendorLabel}>{t('language') === 'hi' ? 'श्रेणियाँ' : 'Categories'}</Text>
                      </View>
                      <View style={styles.categoriesWrap}>
                        {(myVendor.categories || []).map((cat: string, idx: number) => (
                          <View key={idx} style={styles.categoryChip}>
                            <Text style={styles.categoryChipText}>{cat}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {myVendor.business_gallery_images && myVendor.business_gallery_images.filter(Boolean).length > 0 && (
                    <>
                      <View style={[styles.vendorRow, { marginTop: 12 }]}>
                        <Ionicons name="images-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.vendorLabel}>{t('language') === 'hi' ? 'व्यवसाय की तस्वीरें' : 'Business Photos'}</Text>
                      </View>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.photosScroll}
                        contentContainerStyle={styles.photosContent}
                      >
                        {myVendor.business_gallery_images.filter(Boolean).map((photoUrl: string, idx: number) => (
                          <View key={idx} style={styles.photoContainer}>
                            <Image source={{ uri: photoUrl }} style={styles.photoImage} />
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.editServiceBtn}
                    onPress={() => router.push('/vendor/dashboard')}
                  >
                    <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.editServiceBtnText}>
                      {t('language') === 'hi' ? 'सेवा प्रोफ़ाइल संपादित करें' : 'Edit Service Profile'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Button 
              title={t('language') === 'hi' ? 'प्रोफ़ाइल सहेजें' : 'Save Profile'} 
              onPress={handleSave} 
              loading={saving} 
              style={styles.saveButton} 
            />

            <View style={styles.dangerZoneSection}>
              <Text style={styles.dangerZoneTitle}>
                {t('language') === 'hi' ? 'खतरनाक क्षेत्र' : 'Danger Zone'}
              </Text>
              <View style={styles.dangerZoneCard}>
                <Text style={styles.dangerZoneText}>
                  {t('language') === 'hi' ? 'अपने ब्रह्मांड खाते को स्थायी रूप से हटाएं। यह कार्रवाई अपरिवर्तनीय है, और आपके सभी पोस्ट, टिप्पणियाँ और प्रोफ़ाइल डेटा स्थायी रूप से मिटा दिए जाएंगे।' : 'Permanently delete your Brahmand account. This action is irreversible, and all your posts, comments, and profile data will be permanently wiped.'}
                </Text>
                <TouchableOpacity
                  style={[styles.deleteButton, deleting && styles.disabledBtn]}
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                  activeOpacity={0.8}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.deleteButtonText}>
                        {t('language') === 'hi' ? 'खाता हटाएं' : 'Delete Account'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DeleteOTPModal
        visible={otpModalVisible}
        phoneNumber={useAuthStore.getState().user?.phone || ''}
        onClose={() => setOtpModalVisible(false)}
        onVerify={handleVerifyOTPAndDelete}
        title={t('language') === 'hi' ? 'खाता हटाएं' : 'Delete Account'}
        description={t('language') === 'hi' ? 'खाता हटाने के लिए OTP सत्यापित करें' : 'Verify OTP to delete your account'}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardWrap: {
    flex: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  heroText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeReady: {
    backgroundColor: `${COLORS.success}15`,
  },
  statusBadgePending: {
    backgroundColor: `${COLORS.warning}18`,
  },
  statusText: {
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 12,
  },
  statusTextReady: {
    color: COLORS.success,
  },
  statusTextPending: {
    color: COLORS.warning,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.sm,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
  dangerZoneSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  dangerZoneCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}33`,
  },
  dangerZoneText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  vendorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vendorValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: `${COLORS.primary}18`,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  editServiceBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editServiceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  genderContainer: {
    marginBottom: SPACING.md,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  genderRowContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  genderButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}0B`,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderButtonTextActive: {
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  modalButtonCancel: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonOk: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  photosScroll: {
    marginTop: 6,
    marginBottom: 4,
  },
  photosContent: {
    gap: 8,
    paddingRight: 10,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});
