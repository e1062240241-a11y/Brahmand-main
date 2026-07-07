import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerUser } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS } from '../../src/constants/theme';
import { useLanguageStore } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isAndroid = Platform.OS === 'android';

  // Responsive layouts for Android to prevent clipping/distortion
  const photoSize = isAndroid ? Math.min(120, Math.max(96, windowWidth * 0.28)) : 128;
  const photoEditBadgeSize = isAndroid ? Math.round(photoSize * 0.3) : 36;
  const photoEditBadgeRight = isAndroid ? 0 : 4;
  const inputHeight = isAndroid ? (windowHeight < 700 ? 50 : 54) : 56;
  const buttonHeight = isAndroid ? (windowHeight < 700 ? 50 : 54) : 56;
  const labelFontSize = isAndroid ? (windowWidth < 360 ? 13 : 14) : 16;
  const labelMarginTop = isAndroid ? (windowHeight < 700 ? 6 : 10) : 12;
  const labelMarginBottom = isAndroid ? (windowHeight < 700 ? 4 : 6) : 8;
  const inputMarginBottom = isAndroid ? (windowHeight < 700 ? 10 : 12) : 16;
  const titleFontSize = isAndroid ? (windowWidth < 360 ? 22 : 24) : 24;
  const captionFontSize = isAndroid ? (windowWidth < 360 ? 13 : 14) : 14;
  const languageButtonHeight = isAndroid ? (windowHeight < 700 ? 36 : 40) : 44;

  const storeLanguage = useLanguageStore((state) => state.language);
  const storeSetLanguage = useLanguageStore((state) => state.setLanguage);
  
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [language, setLanguage] = useState(storeLanguage === 'hi' ? 'Hindi' : 'English');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Android autocomplete city states
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  const getTranslation = (key: string) => {
    if (Platform.OS === 'android') {
      const isHi = storeLanguage === 'hi';
      const dict: Record<string, { en: string; hi: string }> = {
        beginYourJourney: { en: 'Begin Your Journey', hi: 'अपनी यात्रा शुरू करें' },
        awakenVisualEssence: { en: 'Awaken your visual essence', hi: 'अपनी दृश्य सार को जगाएं' },
        fullName: { en: 'Full Name', hi: 'पूरा नाम' },
        firstName: { en: 'First name', hi: 'पहला नाम' },
        surname: { en: 'Surname', hi: 'उपनाम' },
        currentCity: { en: 'Current City', hi: 'वर्तमान शहर' },
        enterCurrentCity: { en: 'Enter current city...', hi: 'वर्तमान शहर दर्ज करें...' },
        location: { en: 'Location', hi: 'स्थान' },
        locationNotDetected: { en: 'Location not detected', hi: 'स्थान का पता नहीं चला' },
        detectingLocation: { en: 'Detecting Location...', hi: 'स्थान का पता लगाया जा रहा है...' },
        detect: { en: 'Detect', hi: 'पता करें' },
        infoText: { 
          en: 'Your selected location will help us connect you with nearby devotees, temples, and your local Sanatan community. 🕉️🙏', 
          hi: 'आपका चयनित स्थान हमें आपको आस-पास के भक्तों, मंदिरों और आपके स्थानीय सनातन समुदाय से जोड़ने में मदद करेगा। 🕉️🙏' 
        },
        sacredLanguage: { en: 'Sacred Language', hi: 'पवित्र भाषा' },
        continueToMyJourney: { en: 'Continue to My Journey ', hi: 'मेरी यात्रा पर आगे बढ़ें ' },
        footerText: { en: 'By beginning, you align with our Terms of Spiritual Connection and Privacy Sanctuary.', hi: 'शुरुआत करके, आप हमारे आध्यात्मिक जुड़ाव की शर्तों और गोपनीयता अभयारण्य के साथ संरेखित होते हैं।' },
        pleaseEnterFullname: { en: 'Please enter your full name', hi: 'कृपया अपना पूरा नाम दर्ज करें' },
        enterCityAndDetectLocation: { en: 'Please enter your current city and auto-detect your location', hi: 'कृपया अपना वर्तमान शहर दर्ज करें और अपना स्थान स्वचालित रूप से पता करें' },
        cityLocationMustMatch: { en: 'Your current city and detected location must match', hi: 'आपका वर्तमान शहर और स्थान का मिलान होना चाहिए' }
      };
      return dict[key]?.[isHi ? 'hi' : 'en'] || key;
    } else {
      const dict: Record<string, string> = {
        beginYourJourney: 'Begin Your Journey',
        awakenVisualEssence: 'Awaken your visual essence',
        fullName: 'Full Name',
        firstName: 'First name',
        surname: 'Surname',
        currentCity: 'Current City',
        enterCurrentCity: 'Enter current city...',
        location: 'Location',
        locationNotDetected: 'Location not detected',
        detectingLocation: 'Detecting Location...',
        detect: 'Detect',
        infoText: 'Your selected location will help us connect you with nearby devotees, temples, and your local Sanatan community. 🕉️🙏',
        sacredLanguage: 'Sacred Language',
        continueToMyJourney: 'Continue to My Journey ',
        footerText: 'By beginning, you align with our Terms of Spiritual Connection and Privacy Sanctuary.',
        pleaseEnterFullname: 'Please enter your full name',
        enterCityAndDetectLocation: 'Please enter your current city and auto-detect your location',
        cityLocationMustMatch: 'Your current city and detected location must match'
      };
      return dict[key] || key;
    }
  };

  const handleSearchCity = async (query: string) => {
    if (!query || query.length < 3) {
      setCitySuggestions([]);
      return;
    }

    setIsSearchingCity(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'BrahmandApp/1.0',
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setCitySuggestions(data);
      }
    } catch (err) {
      console.warn('Error fetching city suggestions:', err);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleFetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission was denied');
        return;
      }

      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const readableLocation = [
          address.city || address.subregion || address.district,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        const finalLoc = readableLocation || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
        setCurrentCity(finalLoc);
        setLocation(finalLoc);
      } else {
        const fallbackLoc = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
        setCurrentCity(fallbackLoc);
        setLocation(fallbackLoc);
      }
    } catch (err) {
      console.warn('Error fetching location:', err);
      setError('Error fetching location');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera roll permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const isButtonDisabled = () => {
    if (Platform.OS === 'android') {
      const c = city.trim().toLowerCase();
      const cc = currentCity.trim().toLowerCase();
      const isMatching = c && cc && (cc.includes(c) || c.includes(cc));
      return !firstName.trim() || !surname.trim() || !city.trim() || !currentCity.trim() || !isMatching;
    }
    return !name.trim();
  };

  const handleContinue = async () => {
    let trimmed = name.trim();
    if (Platform.OS === 'android') {
      trimmed = `${firstName.trim()} ${surname.trim()}`.trim();
      if (!firstName.trim() || !surname.trim()) {
        setError(getTranslation('pleaseEnterFullname'));
        return;
      }
      if (!city.trim() || !currentCity.trim()) {
        setError(getTranslation('enterCityAndDetectLocation'));
        return;
      }
      const c = city.trim().toLowerCase();
      const cc = currentCity.trim().toLowerCase();
      const isMatching = cc.includes(c) || c.includes(cc);
      if (!isMatching) {
        setError(getTranslation('cityLocationMustMatch'));
        return;
      }
    } else {
      if (!trimmed) {
        setError(getTranslation('pleaseEnterYourName'));
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await registerUser({
        phone: phone || '',
        name: trimmed,
        photo,
        language,
      });

      await login(response.data.user, response.data.token);
      router.replace('/auth/location');
    } catch (err: any) {
      console.warn('Registration failed/warning, proceeding anyway:', err);
      router.replace('/auth/location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.1058, 0.2212]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'android' && {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 12) + 12,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={[styles.title, isAndroid && { fontSize: titleFontSize, marginBottom: isAndroid ? 6 : 8 }]}>{getTranslation('beginYourJourney')}</Text>

            {/* Profile Photo */}
            <TouchableOpacity style={[styles.photoContainer, { width: photoSize, height: photoSize }]} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={[styles.photo, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]} />
              ) : (
                <View style={[styles.photoPlaceholder, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]} />
              )}
              <View style={[styles.photoEditBadge, { width: photoEditBadgeSize, height: photoEditBadgeSize, borderRadius: photoEditBadgeSize / 2, right: photoEditBadgeRight }]}>
                <Ionicons name="camera" size={isAndroid ? Math.round(photoEditBadgeSize * 0.5) : 18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.caption, isAndroid && { fontSize: captionFontSize, marginBottom: isAndroid ? 12 : 20 }]}>{getTranslation('awakenVisualEssence')}</Text>

            {Platform.OS === 'android' ? (
              <>
                {/* Full Name */}
                {/* Full Name */}
                <Text style={[styles.label, isAndroid && { fontSize: labelFontSize, marginTop: labelMarginTop, marginBottom: labelMarginBottom }]}>
                  {getTranslation('fullName')} <Text style={{ color: '#E53935' }}>*</Text>
                </Text>
                <View style={[styles.sideBySideContainer, isAndroid && { marginBottom: inputMarginBottom }]}>
                  <View style={[styles.halfInputContainer, { height: inputHeight }]}>
                    <TextInput
                      style={styles.androidTextInput}
                      placeholder={getTranslation('firstName')}
                      placeholderTextColor="#C5B49F"
                      value={firstName}
                      onChangeText={(text) => {
                        const formattedText = text.charAt(0).toUpperCase() + text.slice(1);
                        setFirstName(formattedText);
                        setError('');
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.halfInputContainer, { height: inputHeight }]}>
                    <TextInput
                      style={styles.androidTextInput}
                      placeholder={getTranslation('surname')}
                      placeholderTextColor="#C5B49F"
                      value={surname}
                      onChangeText={(text) => {
                        const formattedText = text.charAt(0).toUpperCase() + text.slice(1);
                        setSurname(formattedText);
                        setError('');
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Current City Selection */}
                <Text style={[styles.label, isAndroid && { fontSize: labelFontSize, marginTop: labelMarginTop, marginBottom: labelMarginBottom }]}>
                  {getTranslation('currentCity')} <Text style={{ color: '#E53935' }}>*</Text>
                </Text>
                <View style={[styles.dropdownContainer, { height: inputHeight, marginBottom: inputMarginBottom }]}>
                  <View style={styles.dropdownLeft}>
                    <Ionicons name="location-outline" size={22} color="#C5B49F" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.autocompleteInput}
                      placeholder={getTranslation('enterCurrentCity')}
                      placeholderTextColor="#C5B49F"
                      value={city}
                      onChangeText={(text) => {
                        setCity(text);
                        setLocation(text);
                        handleSearchCity(text);
                      }}
                    />
                  </View>
                  {isSearchingCity && <ActivityIndicator size="small" color="#FF7B00" />}
                </View>

                {/* City Autocomplete Suggestions Dropdown */}
                {citySuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                      {citySuggestions.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionItem}
                          onPress={() => {
                            const cityName = item.address.city || 
                                              item.address.town || 
                                              item.address.village || 
                                              item.address.suburb || 
                                              item.display_name.split(',')[0];
                            setCity(cityName);
                            setLocation(cityName);
                            setCitySuggestions([]);
                          }}
                        >
                          <Ionicons name="location-outline" size={16} color="#FF7B00" style={{ marginRight: 8 }} />
                          <Text style={styles.suggestionText} numberOfLines={1}>
                            {item.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Location Selection (GPS) */}
                <Text style={[styles.label, isAndroid && { fontSize: labelFontSize, marginTop: labelMarginTop, marginBottom: labelMarginBottom }]}>
                  {getTranslation('location')} <Text style={{ color: '#E53935' }}>*</Text>
                </Text>
                <View style={[styles.dropdownContainer, { height: inputHeight, marginBottom: inputMarginBottom }]}>
                  <View style={styles.dropdownLeft}>
                    <Ionicons name="locate-outline" size={22} color="#FF7B00" style={{ marginRight: 8 }} />
                    <Text style={currentCity ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>
                      {loading ? getTranslation('detectingLocation') : (currentCity || getTranslation('locationNotDetected'))}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.detectButtonInline, { height: isAndroid ? (windowHeight < 700 ? 32 : 36) : 36 }]}
                    onPress={handleFetchLocation}
                    disabled={loading}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.detectButtonTextInline}>{getTranslation('detect')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Full Name */}
                <Text style={styles.label}>{getTranslation('fullName')}</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="person-outline" size={22} color="#C5B49F" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Soul name or legal name"
                    placeholderTextColor="#C5B49F"
                    value={name}
                    onChangeText={(text) => {
                      let formattedText = text;
                      setName(formattedText);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* Location */}
                <Text style={styles.label}>{getTranslation('location')}</Text>
                <View style={styles.inputContainer}>
                  <TouchableOpacity onPress={handleFetchLocation} style={styles.inputIconContainer} disabled={loading}>
                    <Ionicons name="location-outline" size={22} color="#C5B49F" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Your current coordinates..."
                    placeholderTextColor="#C5B49F"
                    value={location}
                    onChangeText={(text) => setLocation(text)}
                  />
                </View>
              </>
            )}

            {/* Information Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#FF7B00" />
              <Text style={styles.infoText}>
                {getTranslation('infoText')}
              </Text>
            </View>

             {/* Sacred Language */}
            <Text style={[styles.sacredLanguageLabel, isAndroid && { marginTop: isAndroid ? 4 : 6, marginBottom: isAndroid ? 2 : 4 }]}>{getTranslation('sacredLanguage')}</Text>
            <View style={[styles.languageContainer, isAndroid && { marginBottom: isAndroid ? 12 : 24, marginTop: isAndroid ? 2 : 4 }]}>
              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  { height: languageButtonHeight },
                  language === 'English' ? styles.languageButtonActive : styles.languageButtonInactive
                ]}
                onPress={() => {
                  setLanguage('English');
                  storeSetLanguage('en');
                }}
              >
                <Text 
                  style={
                    language === 'English' ? styles.languageButtonTextActive : styles.languageButtonTextInactive
                  }
                >
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  { height: languageButtonHeight },
                  language === 'Hindi' ? styles.languageButtonActive : styles.languageButtonInactive
                ]}
                onPress={() => {
                  setLanguage('Hindi');
                  storeSetLanguage('hi');
                }}
              >
                <Text 
                  style={
                    language === 'Hindi' ? styles.languageButtonTextActive : styles.languageButtonTextInactive
                  }
                >
                  हिन्दी
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { height: buttonHeight, marginTop: isAndroid ? 10 : 10, marginBottom: isAndroid ? 12 : 16 },
                isButtonDisabled() && styles.continueButtonEmpty,
              ]}
              onPress={handleContinue}
              disabled={isButtonDisabled() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FF7B00" />
              ) : (
                <View style={styles.continueButtonContent}>
                  <Text style={[styles.continueButtonText, isAndroid && { fontSize: isAndroid ? (windowWidth < 360 ? 16 : 18) : 20, lineHeight: isAndroid ? (windowWidth < 360 ? 22 : 24) : 28 }, isButtonDisabled() && styles.continueButtonTextEmpty]}>{getTranslation('continueToMyJourney')}</Text>
                  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                    <Path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill={isButtonDisabled() ? '#FF7B00' : 'white'}/>
                  </Svg>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Text */}
            <Text style={[styles.footerText, isAndroid && { fontSize: isAndroid ? (windowWidth < 360 ? 10 : 11) : 12, lineHeight: isAndroid ? (windowWidth < 360 ? 13 : 14) : 16, marginTop: isAndroid ? 4 : 8 }]}>
              {getTranslation('footerText')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#5A4136',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 10 : 12,
    marginBottom: Platform.OS === 'android' ? 10 : 16,
  },
  photoContainer: {
    position: 'relative',
    marginTop: Platform.OS === 'android' ? 6 : 8,
    marginBottom: Platform.OS === 'android' ? 8 : 12,
    shadowColor: 'rgba(139, 79, 59, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  photo: {
    width: Platform.OS === 'android' ? 100 : 128,
    height: Platform.OS === 'android' ? 100 : 128,
    borderRadius: 9999,
  },
  photoPlaceholder: {
    width: Platform.OS === 'android' ? 100 : 128,
    height: Platform.OS === 'android' ? 100 : 128,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(153, 71, 0, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: Platform.OS === 'android' ? 0 : 4,
    width: Platform.OS === 'android' ? 32 : 36,
    height: Platform.OS === 'android' ? 32 : 36,
    borderRadius: Platform.OS === 'android' ? 16 : 18,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  caption: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? 12 : 20,
  },
  label: {
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontWeight: '600',
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    alignSelf: 'flex-start',
    marginBottom: Platform.OS === 'android' ? 6 : 8,
    marginTop: Platform.OS === 'android' ? 8 : 12,
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: 56,
    ...Platform.select({
      ios: {
        paddingTop: 16.5,
        paddingBottom: 16.5,
      },
      android: {
        paddingTop: 0,
        paddingBottom: 0,
      },
      default: {
        paddingTop: 16.5,
        paddingBottom: 16.5,
      }
    }),
    paddingRight: 16,
    paddingLeft: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    ...Platform.select({
      android: {
        paddingVertical: 0,
      }
    })
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: '#C5B49F',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFDFB',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7B00',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: 'rgba(139, 79, 59, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19.5,
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '500',
    fontStyle: 'normal',
    marginLeft: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 12,
    marginBottom: Platform.OS === 'android' ? 12 : 24,
    marginTop: Platform.OS === 'android' ? 2 : 4,
  },
  languageButton: {
    height: Platform.OS === 'android' ? 36 : 44,
    borderRadius: 22,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  languageButtonActive: {
    backgroundColor: '#FF7B00',
    borderColor: '#FF7B00',
  },
  languageButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF7B00',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  languageButtonTextInactive: {
    color: '#584235',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  sacredLanguageLabel: {
    color: '#994700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
    alignSelf: 'flex-start',
    marginBottom: Platform.OS === 'android' ? 2 : 4,
    marginTop: Platform.OS === 'android' ? 4 : 6,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
    height: Platform.OS === 'android' ? 50 : 56,
    borderRadius: 28,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 10 : 10,
    marginBottom: Platform.OS === 'android' ? 12 : 16,
    shadowColor: 'rgba(143, 76, 56, 0.30)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF7B00',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: Platform.OS === 'android' ? 18 : 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontStyle: 'normal',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 24 : 28,
  },
  continueButtonTextEmpty: {
    color: '#FF7B00',
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    color: '#584235',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 14 : 16,
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 4 : 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '500',
    fontStyle: 'normal',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: Platform.OS === 'android' ? 12 : 16,
  },
  halfInputContainer: {
    flex: 1,
    height: Platform.OS === 'android' ? 50 : 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  androidTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: 'System',
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  dropdownContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'android' ? 50 : 56,
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: Platform.OS === 'android' ? 12 : 16,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: 'System',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#C5B49F',
    fontFamily: 'System',
  },
  autoDetectButtonText: {
    fontSize: 16,
    color: '#FF7B00',
    fontFamily: 'System',
    fontWeight: '500',
  },
  autocompleteInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: 'System',
    paddingLeft: 8,
    paddingRight: 0,
    paddingVertical: 0,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0C0AF',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    alignSelf: 'stretch',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEEE5',
  },
  suggestionText: {
    fontSize: 14,
    color: '#5A4136',
    flex: 1,
  },
  detectButtonInline: {
    backgroundColor: '#FF7B00',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: Platform.OS === 'android' ? 32 : 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectButtonTextInline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
