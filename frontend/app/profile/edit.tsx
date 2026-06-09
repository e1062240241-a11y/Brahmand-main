import React, { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { BORDER_RADIUS, COLORS, SPACING } from '../../src/constants/theme';
import { getUserProfile, updateExtendedProfile, deleteUserProfile } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from '../../src/utils/i18n';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateUser, logout } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const handleBack = () => {
    router.replace('/(tabs)/profile');
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [kuldevi, setKuldevi] = useState('');
  const [kuldeviTempleArea, setKuldeviTempleArea] = useState('');
  const [gotra, setGotra] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(''); // stored as DD/MM/YYYY for display
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getUserProfile();
        const data = response.data || {};
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
        } else {
          setDateOfBirth(rawDob);
        }
        setTimeOfBirth(data.time_of_birth || '');
        setPlaceOfBirth(
          data.place_of_birth ||
            [homeLocation.area, homeLocation.city, homeLocation.state].filter(Boolean).join(', ')
        );
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
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
    if (timeOfBirth && !/^\d{2}:\d{2}$/.test(timeOfBirth.trim())) {
      return t('language') === 'hi' ? 'जन्म का समय HH:MM प्रारूप में होना चाहिए' : 'Time of birth must be in HH:MM format';
    }
    return '';
  };

  const handleDeleteAccount = () => {
    const performDeletion = async () => {
      setDeleting(true);
      try {
        await deleteUserProfile();
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
        Alert.alert(t('language') === 'hi' ? 'त्रुटि' : 'Error', err?.response?.data?.detail || err?.message || 'Failed to delete account');
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          t('language') === 'hi' 
            ? 'चेतावनी: क्या आप वाकई अपना खाता स्थायी रूप से हटाना चाहते हैं? इस कार्रवाई को पूर्ववत नहीं किया जा सकता है और आपका सारा डेटा (पोस्ट, टिप्पणियाँ, प्रोफ़ाइल जानकारी) पूरी तरह से हटा दिया जाएगा।' 
            : 'WARNING: Are you sure you want to permanently delete your account? This action cannot be undone and all your data (posts, comments, profile information) will be completely removed.'
        )
      ) {
        performDeletion();
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
          onPress: performDeletion,
        },
      ]
    );
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
          <TouchableOpacity onPress={handleBack}>
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
                <Input
                  label={t('language') === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="DD/MM/YYYY"
                  keyboardType="numbers-and-punctuation"
                />
                <Input
                  label={t('language') === 'hi' ? 'जन्म का समय' : 'Time of Birth'}
                  value={timeOfBirth}
                  onChangeText={setTimeOfBirth}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />
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
  headerSpacer: {
    width: 24,
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
});
