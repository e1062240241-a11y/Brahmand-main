import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Platform, 
  TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import { updateExtendedProfile } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

export default function LocationSetupScreen() {
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const ScrollWrapper = Platform.OS === 'android' ? View : SafeAreaView;

  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // DateTimePicker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dobValue, setDobValue] = useState<Date | null>(null);
  const [tobValue, setTobValue] = useState<Date | null>(null);
  const [seconds, setSeconds] = useState('00');

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

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

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
        setSuggestions(data);
      }
    } catch (err) {
      console.warn('Error fetching place suggestions:', err);
    }
  };

  const handleNext = async () => {
    if (!dob) {
      setError('Please select your Date of Birth');
      return;
    }
    if (!tob) {
      setError('Please select your Time of Birth');
      return;
    }
    if (!place.trim()) {
      setError('Please enter your Place of Birth');
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
      setError(err.response?.data?.detail || 'Failed to save birth details');
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
      <ScrollWrapper style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'android' && {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badgeCircle}>
                <Svg width={29.333} height={29.333} viewBox="0 0 30 30" fill="none">
                  <Path d="M24 10.6667L22.3333 7L18.6667 5.33333L22.3333 3.66667L24 0L25.6667 3.66667L29.3333 5.33333L25.6667 7L24 10.6667ZM24 29.3333L22.3333 25.6667L18.6667 24L22.3333 22.3333L24 18.6667L25.6667 22.3333L29.3333 24L25.6667 25.6667L24 29.3333ZM10.6667 25.3333L7.33333 18L0 14.6667L7.33333 11.3333L10.6667 4L14 11.3333L21.3333 14.6667L14 18L10.6667 25.3333Z" fill="#FF7B00"/>
                </Svg>
              </View>
            </View>

            {/* Header */}
            <Text style={styles.title}>Begin Your Celestial Map</Text>
            <Text style={styles.subtitle}>
              The stars were in a specific alignment the moment you arrived.
            </Text>

            {/* Date of Birth Field */}
            <View style={styles.labelRow}>
              <Ionicons name="calendar-outline" size={16} color="#584235" style={styles.labelIcon} />
              <Text style={styles.label}>Date of Birth</Text>
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
              <Text style={styles.label}>Time of Birth</Text>
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
                    <Text style={styles.secondsLabel}>Seconds:</Text>
                    <TextInput
                      style={styles.secondsInput}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor="#C5B49F"
                      value={seconds}
                      onChangeText={(val) => {
                        const cleanVal = val.replace(/[^0-9]/g, '');
                        const secNum = Math.min(59, parseInt(cleanVal) || 0);
                        const secStr = cleanVal ? secNum.toString().padStart(2, '0') : '';
                        setSeconds(secStr);
                        const activeSec = cleanVal ? secNum : 0;
                        
                        let baseTime = tobValue ? new Date(tobValue) : new Date();
                        baseTime.setSeconds(activeSec);
                        setTobValue(baseTime);
                        setTob(formatTime(baseTime));
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
                    }
                  }}
                />
              )
            )}

            {/* Android Standalone Seconds Input */}
            {Platform.OS === 'android' && tob ? (
              <View style={styles.androidSecondsContainer}>
                <Text style={styles.secondsLabel}>Seconds:</Text>
                <TextInput
                  style={styles.secondsInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#C5B49F"
                  value={seconds}
                  onChangeText={(val) => {
                    const cleanVal = val.replace(/[^0-9]/g, '');
                    const secNum = Math.min(59, parseInt(cleanVal) || 0);
                    const secStr = cleanVal ? secNum.toString().padStart(2, '0') : '';
                    setSeconds(secStr);
                    const activeSec = cleanVal ? secNum : 0;
                    
                    let baseTime = tobValue ? new Date(tobValue) : new Date();
                    baseTime.setSeconds(activeSec);
                    setTobValue(baseTime);
                    setTob(formatTime(baseTime));
                  }}
                />
              </View>
            ) : null}

            {/* Place of Birth Field */}
            <View style={styles.labelRow}>
              <Ionicons name="location-outline" size={16} color="#584235" style={styles.labelIcon} />
              <Text style={styles.label}>Place of Birth</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="City, State, Country"
                placeholderTextColor="#C5B49F"
                value={place}
                onChangeText={(text) => {
                  setPlace(text);
                  setError('');
                  fetchSuggestions(text);
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
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setPlace(item.display_name);
                      setSuggestions([]);
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color="#723600" style={{ marginRight: 8 }} />
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#FF7B00" />
              </View>
              <Text style={styles.infoText}>
                Creating your <Text style={styles.boldOrangeText}>Kundli</Text> unlocks personalised <Text style={styles.boldOrangeText}>Jyotish</Text> insights, <Text style={styles.boldOrangeText}>spiritual guidance</Text> and recommendations tailored to your journey. 🙏
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
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
                    <Text style={styles.nextButtonText}>Next </Text>
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </ScrollWrapper>
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
    marginBottom: 10,
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
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  subtitle: {
    color: '#564337',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: 6,
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
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
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
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    marginTop: -8,
    marginBottom: 10,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 10,
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
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7B00',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  infoIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 26,
    color: '#723600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '400',
    fontStyle: 'normal',
    marginLeft: 20,
  },
  boldOrangeText: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 26,
    color: '#FF7B00',
  },
  buttonRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  skipButton: {
    width: 160,
    height: 56,
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
    height: 56,
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
  },
});
