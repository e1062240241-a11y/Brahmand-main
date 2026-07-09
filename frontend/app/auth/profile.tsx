import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Keyboard
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
import { useLanguageStore } from '../../src/utils/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isAndroid = Platform.OS === 'android';

  // Responsive layouts to prevent clipping/distortion and fit screen on iOS & Android
  const photoSize = Platform.OS === 'ios' 
    ? (windowHeight < 700 ? 76 : (windowHeight < 850 ? 88 : 100)) 
    : Math.min(96, Math.max(80, windowWidth * 0.24));
  const photoEditBadgeSize = Platform.OS === 'ios' 
    ? (windowHeight < 700 ? 24 : 28) 
    : Math.round(photoSize * 0.3);
  const photoEditBadgeRight = Platform.OS === 'ios' ? 4 : 0;
  const inputHeight = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 40 : (windowHeight < 850 ? 44 : 48))
    : 44;
  const buttonHeight = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 40 : (windowHeight < 850 ? 44 : 48))
    : 44;
  const labelFontSize = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 13 : 14)
    : (windowWidth < 360 ? 12 : 13);
  const labelMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 4 : (windowHeight < 850 ? 6 : 8))
    : 6;
  const labelMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 2 : (windowHeight < 850 ? 3 : 4))
    : 3;
  const inputMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 6 : (windowHeight < 850 ? 8 : 10))
    : 8;
  const titleFontSize = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 18 : (windowHeight < 850 ? 20 : 22))
    : (windowWidth < 360 ? 18 : 20);
  const captionFontSize = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 11 : (windowHeight < 850 ? 12 : 13))
    : (windowWidth < 360 ? 11 : 12);
  const languageButtonHeight = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 34 : (windowHeight < 850 ? 36 : 40))
    : 34;

  const sacredLanguageMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 4 : 6)
    : 4;
  const sacredLanguageMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 2 : 4)
    : 2;
  const languageContainerMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 8 : (windowHeight < 850 ? 10 : 12))
    : 12;
  const languageContainerMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 2 : 4)
    : 2;
  const continueButtonMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 6 : 8)
    : 10;
  const continueButtonMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 8 : (windowHeight < 850 ? 10 : 12))
    : 12;
  const continueButtonFontSize = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 15 : (windowHeight < 850 ? 16 : 17))
    : (windowWidth < 360 ? 16 : 18);
  const continueButtonLineHeight = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 20 : (windowHeight < 850 ? 22 : 23))
    : (windowWidth < 360 ? 22 : 24);
  const footerFontSize = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 9 : (windowHeight < 850 ? 10 : 11))
    : (windowWidth < 360 ? 10 : 11);
  const footerLineHeight = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 12 : (windowHeight < 850 ? 13 : 14))
    : (windowWidth < 360 ? 13 : 14);
  const footerMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 2 : 4)
    : 4;
  const infoCardPadding = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 8 : (windowHeight < 850 ? 10 : 12))
    : 10;
  const infoCardMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 2 : 4)
    : 4;
  const infoCardMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 4 : 6)
    : 16;
  const titleMarginTop = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 6 : 8)
    : 10;
  const titleMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 6 : 8)
    : 10;
  const captionMarginBottom = Platform.OS === 'ios'
    ? (windowHeight < 700 ? 10 : (windowHeight < 850 ? 12 : 14))
    : 12;

  const storeLanguage = useLanguageStore((state) => state.language);
  const storeSetLanguage = useLanguageStore((state) => state.setLanguage);
  
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

  // Keyboard-adaptive suggestion positioning
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showCityAbove, setShowCityAbove] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);
  const cityInputRef = useRef<View>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setShowCityAbove(false);
      }
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const checkCitySpace = useCallback(() => {
    if (cityInputRef.current) {
      cityInputRef.current.measureInWindow((x, y, width, height) => {
        const windowHeight = Dimensions.get('window').height;
        const spaceBelow = windowHeight - y - height - keyboardHeight;
        console.log('[checkCitySpace]', { y, height, windowHeight, keyboardHeight, spaceBelow });
        if (keyboardHeight > 0 && spaceBelow < 220) {
          setShowCityAbove(true);
        } else {
          setShowCityAbove(false);
        }
      });
    }
  }, [keyboardHeight]);

  useEffect(() => {
    if (citySuggestions.length > 0) {
      checkCitySpace();
    }
  }, [citySuggestions, keyboardHeight, checkCitySpace]);

  const getTranslation = (key: string) => {
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
        hi: 'का चयनित स्थान हमें आपको आस-पास के भक्तों, मंदिरों और आपके स्थानीय सनातन समुदाय से जोड़ने में मदद करेगा। 🕉️🙏' 
      },
      sacredLanguage: { en: 'Sacred Language', hi: 'पवित्र भाषा' },
      continueToMyJourney: { en: 'Continue to My Journey ', hi: 'मेरी यात्रा पर आगे बढ़ें ' },
      footerText: { en: 'By beginning, you align with our Terms of Spiritual Connection and Privacy Sanctuary.', hi: 'शुरुआत करके, आप हमारे आध्यात्मिक जुड़ाव की शर्तों और गोपनीयता अभयारण्य के साथ संरेखित होते हैं।' },
      pleaseEnterFullname: { en: 'Please enter your full name', hi: 'कृपया अपना पूरा नाम दर्ज करें' },
      enterCityAndDetectLocation: { en: 'Please enter your current city and auto-detect your location', hi: 'कृपया अपना वर्तमान शहर दर्ज करें और अपना स्थान स्वचालित रूप से पता करें' },
      cityLocationMustMatch: { en: 'Your current city and detected location must match', hi: 'आपका वर्तमान शहर और स्थान का मिलान होना चाहिए' }
    };
    return dict[key]?.[isHi ? 'hi' : 'en'] || key;
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
    const c = city.trim().toLowerCase();
    const cc = currentCity.trim().toLowerCase();
    const isMatching = c && cc && (cc.includes(c) || c.includes(cc));
    return !firstName.trim() || !surname.trim() || !city.trim() || !currentCity.trim() || !isMatching;
  };

  const handleContinue = async () => {
    const trimmed = `${firstName.trim()} ${surname.trim()}`.trim();
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
            {
              paddingTop: Math.max(insets.top, 10),
              paddingBottom: Platform.OS === 'ios' 
                ? Math.max(insets.bottom, 10) 
                : Math.max(insets.bottom, 8) + 8,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={[styles.title, { fontSize: titleFontSize, marginTop: titleMarginTop, marginBottom: titleMarginBottom }]}>{getTranslation('beginYourJourney')}</Text>

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

            <Text style={[styles.caption, { fontSize: captionFontSize, marginBottom: captionMarginBottom }]}>{getTranslation('awakenVisualEssence')}</Text>

            {/* Full Name */}
            <Text style={[styles.label, { fontSize: labelFontSize, marginTop: labelMarginTop, marginBottom: labelMarginBottom }]}>
              {getTranslation('fullName')} <Text style={{ color: '#E53935' }}>*</Text>
            </Text>
            <View style={[styles.sideBySideContainer, { marginBottom: inputMarginBottom }]}>
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
            <Text style={[styles.label, { fontSize: labelFontSize, marginTop: labelMarginTop, marginBottom: labelMarginBottom }]}>
              {getTranslation('currentCity')} <Text style={{ color: '#E53935' }}>*</Text>
            </Text>
            <View ref={cityInputRef} style={styles.cityInputWrapper}>
              <View style={[styles.dropdownContainer, { height: inputHeight, marginBottom: inputMarginBottom }]}>
                <View style={styles.dropdownLeft}>
                  <Ionicons name="location-outline" size={22} color="#C5B49F" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.autocompleteInput}
                    placeholder={getTranslation('enterCurrentCity')}
                    placeholderTextColor="#C5B49F"
                    value={city}
                    onFocus={() => setIsCityFocused(true)}
                    onBlur={() => setIsCityFocused(false)}
                    onChangeText={(text) => {
                      setCity(text);
                      setLocation(text);
                      handleSearchCity(text);
                    }}
                  />
                </View>
                {isSearchingCity ? (
                  <ActivityIndicator size="small" color="#FF7B00" />
                ) : (
                  <Ionicons name="chevron-down" size={20} color="#8B4F3B" />
                )}
              </View>

              {/* City Autocomplete Suggestions Dropdown */}
              {citySuggestions.length > 0 && (
                <View style={[
                  styles.suggestionsContainer,
                  Platform.OS === 'ios'
                    ? { bottom: inputHeight + inputMarginBottom }
                    : (showCityAbove ? styles.suggestionsAbove : styles.suggestionsBelow)
                ]}>
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
            </View>

            {/* Location Selection (GPS) */}
            <Text style={[styles.label, { fontSize: labelFontSize, marginTop: labelMarginTop, marginBottom: labelMarginBottom }]}>
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

            {/* Information Card */}
            <View style={[styles.infoCard, { padding: infoCardPadding, marginTop: infoCardMarginTop, marginBottom: infoCardMarginBottom }]}>
              <Ionicons name="information-circle-outline" size={24} color="#FF7B00" />
              <Text style={styles.infoText}>
                {getTranslation('infoText')}
              </Text>
            </View>

             {/* Sacred Language */}
            <Text style={[styles.sacredLanguageLabel, { marginTop: sacredLanguageMarginTop, marginBottom: sacredLanguageMarginBottom }]}>{getTranslation('sacredLanguage')}</Text>
            <View style={[styles.languageContainer, { marginBottom: languageContainerMarginBottom, marginTop: languageContainerMarginTop }]}>
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
                { height: buttonHeight, marginTop: continueButtonMarginTop, marginBottom: continueButtonMarginBottom },
                isButtonDisabled() && styles.continueButtonEmpty,
              ]}
              onPress={handleContinue}
              disabled={isButtonDisabled() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FF7B00" />
              ) : (
                <View style={styles.continueButtonContent}>
                  <Text style={[styles.continueButtonText, { fontSize: continueButtonFontSize, lineHeight: continueButtonLineHeight }, isButtonDisabled() && styles.continueButtonTextEmpty]}>{getTranslation('continueToMyJourney')}</Text>
                  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                    <Path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill={isButtonDisabled() ? '#FF7B00' : 'white'}/>
                  </Svg>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Text */}
            <Text style={[styles.footerText, { fontSize: footerFontSize, lineHeight: footerLineHeight, marginTop: footerMarginTop }]}>
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
    padding: Platform.OS === 'android' ? 10 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 4 : 8,
    marginBottom: Platform.OS === 'android' ? 16 : 8,
    shadowColor: 'rgba(139, 79, 59, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: Platform.OS === 'android' ? 16 : 19.5,
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '500',
    fontStyle: 'normal',
    marginLeft: Platform.OS === 'android' ? 8 : 12,
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#C5B49F',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  autoDetectButtonText: {
    fontSize: 16,
    color: '#FF7B00',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '500',
  },
  autocompleteInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    paddingLeft: 8,
    paddingRight: 0,
    paddingVertical: 0,
  },
  cityInputWrapper: {
    position: 'relative',
    zIndex: 1000,
    alignSelf: 'stretch',
  },
  suggestionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0C0AF',
    borderRadius: 12,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
  },
  suggestionsBelow: {
    top: Platform.OS === 'android' ? 50 : 56,
  },
  suggestionsAbove: {
    bottom: Platform.OS === 'android' ? 50 : 56,
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
});
