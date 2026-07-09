import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Platform, 
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import { updateExtendedProfile } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { useLanguageStore } from '../../src/utils/i18n';

export default function LocationSetupScreen() {
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const ScrollWrapper = Platform.OS === 'android' ? View : SafeAreaView;
  const language = useLanguageStore((state) => state.language);

  const getTranslation = (key: string) => {
    if (Platform.OS !== 'android') {
      const defaults: Record<string, string> = {
        beginSpiritualJourney: 'Begin Your Spiritual Journey',
        starsAlignment: 'The stars were in a specific alignment the moment you arrived.',
        dateOfBirth: 'Date of Birth',
        timeOfBirth: 'Time of Birth',
        placeOfBirth: 'Place of Birth',
        seconds: 'Seconds:',
        cityStateCountry: 'City, State, Country',
        skip: 'Skip',
        next: 'Next',
        pleaseSelectDob: 'Please select your Date of Birth',
        pleaseSelectTob: 'Please select your Time of Birth',
        pleaseEnterPob: 'Please enter your Place of Birth',
        failedToSave: 'Failed to save birth details'
      };
      return defaults[key] || key;
    }

    const isHi = language === 'hi';
    const dict: Record<string, { en: string; hi: string }> = {
      beginSpiritualJourney: { en: 'Begin Your Spiritual Journey', hi: 'अपनी आध्यात्मिक यात्रा शुरू करें' },
      starsAlignment: {
        en: 'The stars were in a specific alignment the moment you arrived.',
        hi: 'आपके जन्म के समय तारे एक विशेष संरेखण में थे।'
      },
      dateOfBirth: { en: 'Date of Birth', hi: 'जन्म तिथि' },
      timeOfBirth: { en: 'Time of Birth', hi: 'जन्म समय' },
      placeOfBirth: { en: 'Place of Birth', hi: 'जन्म स्थान' },
      seconds: { en: 'Seconds:', hi: 'सेकंड:' },
      cityStateCountry: { en: 'City, State, Country', hi: 'शहर, राज्य, देश' },
      infoTextKundli: {
        en: 'Creating your Kundli unlocks personalised Jyotish insights, spiritual guidance and recommendations tailored to your journey. 🙏',
        hi: 'आपकी कुंडली बनाने से व्यक्तिगत ज्योतिष अंतर्दृष्टि, आध्यात्मिक मार्गदर्शन और आपकी यात्रा के अनुकूल अनुशंसाएं मिलती हैं। 🙏'
      },
      skip: { en: 'Skip', hi: 'छोड़ें' },
      next: { en: 'Next', hi: 'आगे बढ़ें' },
      pleaseSelectDob: { en: 'Please select your Date of Birth', hi: 'कृपया अपनी जन्म तिथि चुनें' },
      pleaseSelectTob: { en: 'Please select your Time of Birth', hi: 'कृपया अपना जन्म समय चुनें' },
      pleaseEnterPob: { en: 'Please enter your Place of Birth', hi: 'कृपया अपना जन्म स्थान दर्ज करें' },
      failedToSave: { en: 'Failed to save birth details', hi: 'जन्म विवरण सहेजने में विफल' }
    };
    return dict[key]?.[isHi ? 'hi' : 'en'] || key;
  };

  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const inputContainerRef = useRef<View>(null);
  const [showAbove, setShowAbove] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
        setShowAbove(false);
      }
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const checkSpace = () => {
    if (inputContainerRef.current) {
      inputContainerRef.current.measureInWindow((x, y, width, height) => {
        const windowHeight = Dimensions.get('window').height;
        const spaceBelow = windowHeight - y - height - keyboardHeight;
        if (keyboardHeight > 0 && spaceBelow < 220) {
          setShowAbove(true);
        } else {
          setShowAbove(false);
        }
      });
    }
  };

  useEffect(() => {
    if (suggestions.length > 0) {
      checkSpace();
    }
  }, [suggestions, keyboardHeight]);

  // DateTimePicker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dobValue, setDobValue] = useState<Date | null>(null);
  const [tobValue, setTobValue] = useState<Date | null>(null);
  const [seconds, setSeconds] = useState('00');
  const [showSecondsInput, setShowSecondsInput] = useState(false);

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getCleanPlaceName = (item: any): string => {
    if (!item || !item.address) return item?.display_name || '';

    const addr = item.address;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || addr.suburb || addr.hamlet;
    const state = addr.state || addr.region || addr.province || addr.state_district;
    const country = addr.country;

    const parts = [];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);

    if (parts.length === 0) {
      return item.display_name;
    }

    return parts.join(', ');
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`,
        {
          headers: {
            'User-Agent': 'BrahmandApp/1.0',
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any) => ({
          ...item,
          formatted_name: getCleanPlaceName(item),
        }));
        
        // Remove duplicates and entries with empty formatted_name
        const unique = formatted.filter((item, index, self) => 
          item.formatted_name && 
          self.findIndex(t => t.formatted_name === item.formatted_name) === index
        );
        
        setSuggestions(unique.slice(0, 5));
      }
    } catch (err) {
      console.warn('Error fetching place suggestions:', err);
    }
  };

  const handleNext = async () => {
    if (!dob) {
      setError(getTranslation('pleaseSelectDob'));
      return;
    }
    if (!tob) {
      setError(getTranslation('pleaseSelectTob'));
      return;
    }
    if (!place.trim()) {
      setError(getTranslation('pleaseEnterPob'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await updateExtendedProfile({
        date_of_birth: dob,
        time_of_birth: tob,
        place_of_birth: place.trim(),
      });
      
      updateUser(response.data.user);
      router.replace('/home');
    } catch (err: any) {
      setError(err.response?.data?.detail || getTranslation('failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/home');
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
        style={{ flex: 1 }}
      >
        <ScrollWrapper style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent,
              Platform.OS === 'android' && {
                paddingTop: Math.max(insets.top, 10),
                paddingBottom: Math.max(insets.bottom, 10),
              }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.content}>
            <View style={styles.topSection}>
              {/* Header Badge */}
              <View style={styles.badgeContainer}>
              <View style={styles.badgeCircle}>
                <Svg 
                  width={Platform.OS === 'android' ? 22 : 29.333} 
                  height={Platform.OS === 'android' ? 22 : 29.333} 
                  viewBox="0 0 30 30" 
                  fill="none"
                >
                  <Path d="M24 10.6667L22.3333 7L18.6667 5.33333L22.3333 3.66667L24 0L25.6667 3.66667L29.3333 5.33333L25.6667 7L24 10.6667ZM24 29.3333L22.3333 25.6667L18.6667 24L22.3333 22.3333L24 18.6667L25.6667 22.3333L29.3333 24L25.6667 25.6667L24 29.3333ZM10.6667 25.3333L7.33333 18L0 14.6667L7.33333 11.3333L10.6667 4L14 11.3333L21.3333 14.6667L14 18L10.6667 25.3333Z" fill="#FF7B00"/>
                </Svg>
              </View>
            </View>

            {/* Header */}
            <Text style={styles.title}>{getTranslation('beginSpiritualJourney')}</Text>
            <Text style={styles.subtitle}>
              {getTranslation('starsAlignment')}
            </Text>

            {/* Date of Birth Field */}
            <View style={styles.labelRow}>
              <Ionicons name="calendar-outline" size={16} color="#584235" style={styles.labelIcon} />
              <Text style={styles.label}>{getTranslation('dateOfBirth')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={() => setShowDatePicker(!showDatePicker)}
              activeOpacity={0.8}
            >
              <Text style={[styles.inputText, !dob && styles.placeholderText]}>
                {dob || 'dd/mm/yyyy'}
              </Text>
            </TouchableOpacity>

            {/* Date Picker */}
            {showDatePicker && (
              Platform.OS === 'ios' ? (
                <View style={styles.inlinePickerContainer}>
                  <DateTimePicker
                    value={dobValue || new Date()}
                    mode="date"
                    display="inline"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDobValue(selectedDate);
                        setDob(formatDate(selectedDate));
                      }
                    }}
                  />
                </View>
              ) : (
                <DateTimePicker
                  value={dobValue || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDobValue(selectedDate);
                      setDob(formatDate(selectedDate));
                    }
                  }}
                />
              )
            )}

            {/* Time of Birth Field */}
            <View style={styles.labelRow}>
              <Ionicons name="time-outline" size={16} color="#584235" style={styles.labelIcon} />
              <Text style={styles.label}>{getTranslation('timeOfBirth')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={() => setShowTimePicker(!showTimePicker)}
              activeOpacity={0.8}
            >
              <Text style={[styles.inputText, !tob && styles.placeholderText]}>
                {tob || '00:00:00'}
              </Text>
            </TouchableOpacity>

            {/* Time Picker */}
            {showTimePicker && (
              Platform.OS === 'ios' ? (
                <View style={styles.inlinePickerContainer}>
                  <DateTimePicker
                    value={tobValue || new Date()}
                    mode="time"
                    display="spinner"
                    is24Hour={true}
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        const newTime = new Date(selectedTime);
                        newTime.setSeconds(parseInt(seconds) || 0);
                        setTobValue(newTime);
                        setTob(formatTime(newTime));
                      }
                    }}
                  />
                  <View style={styles.secondsSelectorContainer}>
                    <Text style={styles.secondsLabel}>{getTranslation('seconds')}</Text>
                    <TextInput
                      style={styles.secondsInput}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor="#C5B49F"
                      value={seconds}
                      onChangeText={(val) => {
                        const cleanVal = val.replace(/[^0-9]/g, '');
                        setSeconds(cleanVal);
                        const secNum = Math.min(59, parseInt(cleanVal) || 0);
                        
                        let baseTime = tobValue ? new Date(tobValue) : new Date();
                        baseTime.setSeconds(secNum);
                        setTobValue(baseTime);
                        setTob(formatTime(baseTime));
                      }}
                      onBlur={() => {
                        const padded = (seconds || '00').padStart(2, '0');
                        setSeconds(padded);
                      }}
                    />
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={tobValue || new Date()}
                  mode="time"
                  display="default"
                  is24Hour={true}
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      const newTime = new Date(selectedTime);
                      newTime.setSeconds(parseInt(seconds) || 0);
                      setTobValue(newTime);
                      setTob(formatTime(newTime));
                      setShowSecondsInput(true);
                    }
                  }}
                />
              )
            )}

            {/* Android Standalone Seconds Input */}
            {Platform.OS === 'android' && tob && showSecondsInput ? (
              <View style={styles.androidSecondsContainer}>
                <Text style={styles.secondsLabel}>{getTranslation('seconds')}</Text>
                <TextInput
                  style={styles.secondsInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#C5B49F"
                  value={seconds}
                  onChangeText={(val) => {
                    const cleanVal = val.replace(/[^0-9]/g, '');
                    setSeconds(cleanVal);
                    const secNum = Math.min(59, parseInt(cleanVal) || 0);
                    
                    let baseTime = tobValue ? new Date(tobValue) : new Date();
                    baseTime.setSeconds(secNum);
                    setTobValue(baseTime);
                    setTob(formatTime(baseTime));
                  }}
                  onBlur={() => {
                    const padded = (seconds || '00').padStart(2, '0');
                    setSeconds(padded);
                    setShowSecondsInput(false);
                  }}
                  onSubmitEditing={() => {
                    setShowSecondsInput(false);
                  }}
                  returnKeyType="done"
                />
              </View>
            ) : null}

            {/* Place of Birth Field */}
            <View style={styles.labelRow}>
              <Ionicons name="location-outline" size={16} color="#584235" style={styles.labelIcon} />
              <Text style={styles.label}>{getTranslation('placeOfBirth')}</Text>
            </View>
            <View 
              ref={inputContainerRef}
              style={{ zIndex: 100, position: 'relative', width: '100%' }}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={getTranslation('cityStateCountry')}
                  placeholderTextColor="#C5B49F"
                  value={place}
                  onChangeText={(text) => {
                    setPlace(text);
                    setError('');
                    fetchSuggestions(text);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setTimeout(checkSpace, 100);
                    }
                  }}
                />
                <TouchableOpacity onPress={() => {
                  if (suggestions.length > 0) {
                    setSuggestions([]);
                  } else {
                    fetchSuggestions(place || 'Delhi');
                  }
                }}>
                  <Ionicons name={suggestions.length > 0 ? "chevron-up-outline" : "chevron-down-outline"} size={20} color="#C5B49F" />
                </TouchableOpacity>
              </View>

              {/* Suggestions list */}
              {suggestions.length > 0 && (
                <View 
                  style={[
                    styles.suggestionsContainer,
                    Platform.OS === 'ios'
                      ? { bottom: 60 }
                      : (showAbove ? styles.suggestionsAbove : styles.suggestionsBelow)
                  ]}
                >
                  <ScrollView
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 200 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setPlace(item.formatted_name);
                          setSuggestions([]);
                        }}
                      >
                        <Ionicons name="location-outline" size={16} color="#723600" style={{ marginRight: 8 }} />
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.formatted_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#FF7B00" />
              </View>
              {Platform.OS === 'android' && language === 'hi' ? (
                <Text style={styles.infoText}>
                  आपकी <Text style={styles.boldOrangeText}>कुंडली</Text> बनाने से व्यक्तिगत <Text style={styles.boldOrangeText}>ज्योतिष</Text> अंतर्दृष्टि, <Text style={styles.boldOrangeText}>आध्यात्मिक मार्गदर्शन</Text> और आपकी यात्रा के अनुकूल अनुशंसाएं मिलती हैं। 🙏
                </Text>
              ) : (
                <Text style={styles.infoText}>
                  Creating your <Text style={styles.boldOrangeText}>Kundli</Text> unlocks personalised <Text style={styles.boldOrangeText}>Jyotish</Text> insights, <Text style={styles.boldOrangeText}>spiritual guidance</Text> and recommendations tailored to your journey. 🙏
                </Text>
              )}
            </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>{getTranslation('skip')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.nextButton} 
                onPress={handleNext}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>{getTranslation('next')} </Text>
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </ScrollWrapper>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  androidSecondsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      android: {
        flex: 1,
        justifyContent: 'space-between',
      }
    })
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'android' ? 15 : 4,
    marginBottom: Platform.OS === 'android' ? 15 : 8,
  },
  badgeCircle: {
    width: Platform.OS === 'android' ? 48 : 64,
    height: Platform.OS === 'android' ? 48 : 64,
    borderRadius: Platform.OS === 'android' ? 24 : 32,
    backgroundColor: '#FBE9E0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    color: '#1E1B17',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: Platform.OS === 'android' ? 22 : 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: Platform.OS === 'android' ? 28 : 32,
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 6 : 4,
    marginBottom: Platform.OS === 'android' ? 8 : 4,
  },
  subtitle: {
    color: '#564337',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: Platform.OS === 'android' ? 20 : 24,
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? 24 : 16,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Platform.OS === 'android' ? 6 : 4,
    marginTop: Platform.OS === 'android' ? 12 : 6,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: Platform.OS === 'android' ? 50 : 50,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    marginBottom: Platform.OS === 'android' ? 14 : 10,
  },
  inputText: {
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  placeholderText: {
    color: '#C5B49F',
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
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  inlinePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    padding: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionsBelow: {
    top: 52,
  },
  suggestionsAbove: {
    bottom: Platform.OS === 'android' ? 66 : 62,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE6',
  },
  suggestionText: {
    color: '#584235',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  infoCard: {
    alignSelf: 'stretch',
    padding: Platform.OS === 'android' ? 16 : 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7B00',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: Platform.OS === 'android' ? 20 : 8,
  },
  infoIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: Platform.OS === 'android' ? 14 : 16,
    lineHeight: Platform.OS === 'android' ? 20 : 26,
    color: '#723600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '400',
    fontStyle: 'normal',
    marginLeft: Platform.OS === 'android' ? 12 : 20,
  },
  boldOrangeText: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: Platform.OS === 'android' ? 20 : 26,
    color: '#FF7B00',
  },
  buttonRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 12,
    marginTop: Platform.OS === 'android' ? 24 : 24,
    marginBottom: Platform.OS === 'android' ? 16 : 8,
  },
  skipButton: {
    width: 160,
    height: Platform.OS === 'android' ? 52 : 56,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.00)',
    shadowColor: 'rgba(160, 65, 0, 0.20)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  skipButtonText: {
    color: '#584235',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  nextButton: {
    width: 160,
    height: Platform.OS === 'android' ? 52 : 56,
    borderRadius: 50,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: 'rgba(160, 65, 0, 0.20)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  secondsSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE6',
    paddingTop: 10,
    width: '100%',
    justifyContent: 'center',
  },
  secondsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    marginRight: 10,
  },
  secondsInput: {
    width: 60,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    paddingVertical: 0,
  },
});
