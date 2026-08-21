import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  Modal,
  findNodeHandle
} from 'react-native';
import { KeyboardAwareScrollView } from '../../../src/components/KeyboardAwareScrollView';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePassportStore } from '../../../src/store/passportStore';
import { PassportAnswer, PassportMediaItem, PassportJourneyVisibility } from '../../../src/types/passport';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

const { width, height } = Dimensions.get('window');
const isSmallAndroid = Platform.OS === 'android' && height < 820;

const inspirations = ['Faith', 'Gratitude', 'Seeking blessings', 'Family tradition', 'Personal reflection', 'Other'];
const travelWithOptions = [
  { id: 'ALONE', icon: 'person-outline' },
  { id: 'FAMILY', icon: 'people-outline' },
  { id: 'FRIENDS', icon: 'people-circle-outline' },
  { id: 'GROUP', icon: 'earth-outline' }
];
const travelModes = [
  { id: 'Flight', icon: 'airplane-outline' },
  { id: 'Train', icon: 'train-outline' },
  { id: 'Bus', icon: 'bus-outline' },
  { id: 'Car', icon: 'car-outline' }
];
const distances = ['Walking', 'Under 2 km', '2-5 km', '5+ km'];
const stayTypeOptions = ['Dharamshala', 'Ashram', 'Hotel', 'Homestay'];

const indianCities = [
  'Varanasi, Uttar Pradesh', 'Ayodhya, Uttar Pradesh', 'Mathura, Uttar Pradesh',
  'Kedarnath, Uttarakhand', 'Badrinath, Uttarakhand', 'Rishikesh, Uttarakhand', 'Haridwar, Uttarakhand',
  'Ujjain, Madhya Pradesh', 'Omkareshwar, Madhya Pradesh', 'Somnath, Gujarat', 'Dwarka, Gujarat',
  'Puri, Odisha', 'Tirupati, Andhra Pradesh', 'Madurai, Tamil Nadu', 'Rameshwaram, Tamil Nadu',
  'Kanchipuram, Tamil Nadu', 'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Delhi, Delhi',
  'Jaipur, Rajasthan', 'Pushkar, Rajasthan', 'Amritsar, Punjab', 'Katra, Jammu and Kashmir'
];

const firstFeelings = ['Awe', 'Peace', 'Gratitude', 'Excitement', 'Emotional', 'Other'];

export default function NewPassportJourneyScreen() {
  const keyboardScrollRef = useRef<any>(null);
  const startLocationInputRef = useRef<TextInput>(null);
  const destinationLocationInputRef = useRef<TextInput>(null);

  const handleInputFocus = (e: any) => {
    const node = findNodeHandle(e.target);
    if (node) {
      setTimeout(() => {
        keyboardScrollRef.current?.scrollToFocusedInput(node);
      }, 100);
    }
  };

  const handleScrollOnType = (ref: React.RefObject<TextInput | null>) => {
    const node = findNodeHandle(ref.current);
    if (node) {
      setTimeout(() => {
        keyboardScrollRef.current?.scrollToFocusedInput(node);
      }, 50);
    }
  };
  const router = useRouter();
  const addJourney = usePassportStore((state) => state.addJourney);
  const awardBadge = usePassportStore((state) => state.awardBadge);
  const journeyCount = usePassportStore((state) => state.journeys.length);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [visibility, setVisibility] = useState<PassportJourneyVisibility>('private');
  const [locationError, setLocationError] = useState<string | null>(null);

  const validateLocation = (val: string): boolean => {
    if (!val.trim()) {
      setLocationError('Location is required.');
      return false;
    }
    if (val.trim().length < 3) {
      setLocationError('Location name must be at least 3 characters.');
      return false;
    }
    setLocationError(null);
    return true;
  };

  // Step 2 State
  const [inspiration, setInspiration] = useState('');
  const [travelWith, setTravelWith] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [travelMode, setTravelMode] = useState('');
  const [duration, setDuration] = useState('');
  const [stayType, setStayType] = useState('');
  const [distance, setDistance] = useState('');
  const [isStayDropdownOpen, setIsStayDropdownOpen] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showLocationSuggestionsStep1, setShowLocationSuggestionsStep1] = useState(false);
  const [showStep1DatePicker, setShowStep1DatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const parseDateString = (str: string | undefined | null): Date => {
    if (!str || typeof str !== 'string') return new Date();
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return new Date();
  };

  const formatDateString = (d: Date | undefined | null): string => {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onStep1DateChange = (event: any, selectedDate?: Date) => {
    setShowStep1DatePicker(false);
    if (selectedDate) {
      setDate(formatDateString(selectedDate));
      setDuration('');
    }
  };

  // Derived state for suggestions
  const filteredLocations = startLocation.trim()
    ? (() => {
        // OPT: Lift toLowerCase out of the filter loop
        const lowerStartLoc = startLocation.toLowerCase();
        return indianCities.filter(city => city.toLowerCase().includes(lowerStartLoc));
      })()
    : [];

  const filteredLocationsStep1 = location.trim()
    ? (() => {
        // OPT: Lift toLowerCase out of the filter loop
        const lowerLoc = location.toLowerCase();
        return indianCities.filter(city => city.toLowerCase().includes(lowerLoc));
      })()
    : indianCities;

  useEffect(() => {
    const isDropdownOpenStep1 = showLocationSuggestionsStep1 && (
      filteredLocationsStep1.length > 0 || location.trim() !== ''
    );
    if (isDropdownOpenStep1) {
      const node = findNodeHandle(destinationLocationInputRef.current);
      if (node) {
        setTimeout(() => {
          keyboardScrollRef.current?.scrollToFocusedInput(node);
        }, 80);
      }
    }
  }, [showLocationSuggestionsStep1, filteredLocationsStep1.length, location]);

  useEffect(() => {
    if (showLocationSuggestions && filteredLocations.length > 0) {
      const node = findNodeHandle(startLocationInputRef.current);
      if (node) {
        setTimeout(() => {
          keyboardScrollRef.current?.scrollToFocusedInput(node);
        }, 80);
      }
    }
  }, [showLocationSuggestions, filteredLocations.length]);

  // Step 3 State
  const [firstFeeling, setFirstFeeling] = useState('');
  const [crowdStatus, setCrowdStatus] = useState(1);
  const [participatedPuja, setParticipatedPuja] = useState(false);
  const [pujaDetails, setPujaDetails] = useState('');
  const [touchedHeart, setTouchedHeart] = useState('');
  const [prasadExperience, setPrasadExperience] = useState('');
  const [media, setMedia] = useState<PassportMediaItem[]>([]);

  // Step 4 State
  const [answers, setAnswers] = useState<PassportAnswer[]>([]);
  const [darshanExperience, setDarshanExperience] = useState('');
  const [blessingCarried, setBlessingCarried] = useState('');
  const [journeyFeelings, setJourneyFeelings] = useState<string[]>([]);
  const [unforgettableMemory, setUnforgettableMemory] = useState('');
  const [accommodationRecommend, setAccommodationRecommend] = useState<'Yes' | 'No' | ''>('');
  const [accommodationWhy, setAccommodationWhy] = useState('');
  const [rememberBecause, setRememberBecause] = useState('');
  const [shareWithCommunity, setShareWithCommunity] = useState(false);

  const [activeMicField, setActiveMicField] = useState<'puja' | 'touched' | 'prasad' | 'darshan' | 'blessing' | 'memory' | 'remember' | 'accommodation' | null>(null);

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript || "";
    if (activeMicField === 'puja') {
      setPujaDetails(text);
    } else if (activeMicField === 'touched') {
      setTouchedHeart(text);
    } else if (activeMicField === 'prasad') {
      setPrasadExperience(text);
    } else if (activeMicField === 'darshan') {
      setDarshanExperience(text);
    } else if (activeMicField === 'blessing') {
      setBlessingCarried(text);
    } else if (activeMicField === 'memory') {
      setUnforgettableMemory(text);
    } else if (activeMicField === 'remember') {
      setRememberBecause(text);
    } else if (activeMicField === 'accommodation') {
      setAccommodationWhy(text);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setActiveMicField(null);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech recognition error:", event.error);
    setActiveMicField(null);
  });

  const handleMicPress = async (field: 'puja' | 'touched' | 'prasad' | 'darshan' | 'blessing' | 'memory' | 'remember' | 'accommodation') => {
    if (activeMicField === field) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch (err) {
        console.log("Error stopping mic:", err);
      }
      setActiveMicField(null);
      return;
    }

    if (activeMicField) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch (err) {
        console.log("Error stopping other mic:", err);
      }
    }

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Microphone access is required for speech input.");
        return;
      }

      setActiveMicField(field);
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
      });
    } catch (error) {
      console.log("Error starting voice recognition:", error);
      Alert.alert("Error", "Speech recognition failed to start.");
      setActiveMicField(null);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => {});
    }
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const isLocValid = validateLocation(location);
      if (!title.trim() || !date.trim() || !isLocValid) {
        if (!isLocValid) {
          Alert.alert('Missing details', location.trim() ? 'Location name must be at least 3 characters.' : 'Location is required.');
        } else {
          Alert.alert('Missing details', 'Please add a title, location, and date before continuing.');
        }
        return;
      }
    }
    if (step === 2) {
      if (!inspiration || !travelWith || !startLocation.trim() || !travelMode || !duration || !stayType || !distance) {
        Alert.alert('Missing details', 'Please fill out all fields on this page before continuing.');
        return;
      }
      if (startLocation.trim().length < 3) {
        Alert.alert('Invalid Location', 'Start location must be at least 3 characters.');
        return;
      }
    }
    if (step === 3) {
      if (!firstFeeling || !touchedHeart.trim() || !prasadExperience.trim()) {
        Alert.alert('Missing details', 'Please fill out all fields on this page before continuing.');
        return;
      }
      if (participatedPuja && !pujaDetails.trim()) {
        Alert.alert('Missing details', 'Please specify the Puja/Seva details.');
        return;
      }
      if (media.length === 0) {
        Alert.alert('Missing details', 'Please upload a photo or memory before continuing.');
        return;
      }
      // Collect answers before moving to step 4
      const newAnswers: PassportAnswer[] = [
        { question: 'What inspired you to take this journey?', answer: inspiration },
        { question: 'Who are you traveling with?', answer: travelWith },
        { question: 'Where is your journey starting from?', answer: startLocation },
        { question: 'How are you traveling?', answer: travelMode },
        { question: 'Travel duration', answer: duration },
        { question: 'Where are you staying?', answer: stayType },
        { question: 'Distance from temple', answer: distance },
        { question: 'What was your first feeling when you saw the temple or sacred place?', answer: firstFeeling },
        { question: 'Crowd status today', answer: crowdStatus === 0 ? 'Peaceful' : crowdStatus === 1 ? 'Moderate' : crowdStatus === 2 ? 'Busy' : 'Crowded' },
        { question: 'Participated in Puja/Seva?', answer: participatedPuja ? `Yes: ${pujaDetails}` : 'No' },
        { question: 'What touched your heart most?', answer: touchedHeart },
        { question: 'What prasad, food, or local experience stood out to you?', answer: prasadExperience },
      ];
      setAnswers(newAnswers);
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0 || step === 1) {
      if (step === 1) {
        setStep(0);
        return;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/passport/timeline' as any);
      }
      return;
    }
    setStep(step - 1);
  };

  const handleSave = async () => {
    const isLocValid = validateLocation(location);
    if (!title.trim() || !isLocValid) {
      if (!isLocValid) {
        Alert.alert('Missing details', location.trim() ? 'Location name must be at least 3 characters.' : 'Location is required.');
      } else {
        Alert.alert('Missing details', 'Please complete the journey title and location.');
      }
      return;
    }

    if (!darshanExperience.trim() || !blessingCarried.trim() || journeyFeelings.length === 0 || !unforgettableMemory.trim() || !accommodationRecommend || !rememberBecause.trim()) {
      Alert.alert('Missing details', 'Please fill out all fields on this page before recording the journey.');
      return;
    }
    if (accommodationRecommend === 'Yes' && !accommodationWhy.trim()) {
      Alert.alert('Missing details', 'Please specify the accommodation recommendation details.');
      return;
    }

    setLoading(true);
    try {
      const step4Answers: PassportAnswer[] = [
        { question: 'Darshan experience in one sentence', answer: darshanExperience },
        { question: 'Blessing, prayer, or sankalp carried?', answer: blessingCarried },
        { question: 'How did this journey make you feel?', answer: journeyFeelings.join(', ') },
        { question: 'Unforgettable memory', answer: unforgettableMemory },
        { question: 'Accommodation recommendation?', answer: accommodationRecommend ? `${accommodationRecommend}: ${accommodationWhy}` : '' },
        { question: 'I will remember this journey because...', answer: rememberBecause },
      ].filter(a => a.answer.trim() !== '');
      const allAnswers = [...answers, ...step4Answers];

      // Convert DD/MM/YYYY → ISO string for consistent storage & display
      const dateISO = (() => {
        if (!date) return new Date().toISOString();
        const parts = date.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts.map(Number);
          const parsed = new Date(y, m - 1, d);
          if (!isNaN(parsed.getTime())) return parsed.toISOString();
        }
        return date; // fallback as-is
      })();

      const newJourneyId = await addJourney({ title: title.trim(), location: location.trim(), date: dateISO, media, answers: allAnswers, visibility });
      if (journeyCount === 0) {
        await awardBadge('First Journey', 'Created your first Brahmand Passport journey');
      }

      // Trigger background sync to immediately push the new journey (and public feed post if visibility is public) to the backend
      try {
        const { SyncManager } = require('../../../src/database/syncManager');
        SyncManager.requestSync();
      } catch (e) {
        console.warn('[Passport] Failed to trigger sync:', e);
      }

      router.replace({
        pathname: `/passport/journey/${newJourneyId}`,
        params: { justRecorded: 'true' }
      } as any);
    } catch (error) {
      console.error('[NewJourney] Save failed:', error);
      Alert.alert('Save Failed', 'Unable to save the journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMedia: PassportMediaItem = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          type: 'photo'
        };
        setMedia([newMedia]);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create your journey</Text>
          
          <Text style={styles.inputLabel}>TITLE</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="My Spiritual Journey"
              placeholderTextColor="#999"
              style={styles.inputText}
            />
            <Ionicons name="pencil-outline" size={18} color="#888" />
          </View>

          <Text style={styles.inputLabel}>LOCATION</Text>
          {(() => {
            const isDropdownOpenStep1 = showLocationSuggestionsStep1 && location.trim() !== '';
            return (
              <>
                {isDropdownOpenStep1 && (
                  <View style={[styles.dropdownContainer, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: 0, marginBottom: 0, borderTopWidth: 1 }]}>
                    {filteredLocationsStep1.length > 0 ? (
                      filteredLocationsStep1.slice(0, 5).map((city, index) => (
                        <TouchableOpacity
                          key={city}
                          style={[
                            styles.dropdownOption,
                            index === Math.min(filteredLocationsStep1.length, 5) - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setLocation(city);
                            setLocationError(null);
                            setShowLocationSuggestionsStep1(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{city}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <TouchableOpacity
                        style={[styles.dropdownOption, { borderBottomWidth: 0 }]}
                        onPress={() => {
                          const trimmed = location.trim();
                          if (trimmed.length < 3) {
                            Alert.alert('Invalid Location', 'Location name must be at least 3 characters long.');
                          } else {
                            setLocation(trimmed);
                            setLocationError(null);
                            setShowLocationSuggestionsStep1(false);
                          }
                        }}
                      >
                        <View>
                          <Text style={[styles.dropdownOptionText, { color: '#E87030', fontWeight: '600' }]}>
                            {`+ Add "${location}" manually`}
                          </Text>
                          {location.trim().length < 3 && (
                            <Text style={{ fontSize: 11, color: '#C0392B', marginTop: 2 }}>
                              Requires at least 3 characters
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={[styles.inputContainer, isDropdownOpenStep1 && { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 }]}>
                  <Ionicons name="location-outline" size={18} color="#E87030" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={destinationLocationInputRef}
                    value={location}
                    onChangeText={(text) => {
                      setLocation(text);
                      setShowLocationSuggestionsStep1(true);
                      if (text.trim() === '') {
                        setLocationError('Location is required.');
                      } else if (text.trim().length < 3) {
                        setLocationError('Location name must be at least 3 characters.');
                      } else {
                        setLocationError(null);
                      }
                      handleScrollOnType(destinationLocationInputRef);
                    }}
                    onFocus={() => setShowLocationSuggestionsStep1(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestionsStep1(false), 250)}
                    placeholder="Kedarnath, Uttarakhand"
                    placeholderTextColor="#999"
                    style={styles.inputText}
                  />
                </View>
              </>
            );
          })()}
          {locationError && (
            <Text style={styles.errorText}>{locationError}</Text>
          )}

          <Text style={styles.inputLabel}>DATE</Text>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setShowStep1DatePicker(true)} 
            style={styles.inputContainer}
          >
            <Ionicons name="calendar-outline" size={18} color="#E87030" style={{ marginRight: 8 }} />
            <TextInput
              value={date}
              editable={false}
              pointerEvents="none"
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
              style={styles.inputText}
            />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>PRIVACY</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, visibility === 'private' && styles.toggleButtonActive]}
              onPress={() => {
                setVisibility('private');
                setShareWithCommunity(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, visibility === 'private' && styles.toggleTextActive]}>Private</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, visibility === 'public' && styles.toggleButtonActive]}
              onPress={() => {
                setVisibility('public');
                setShareWithCommunity(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, visibility === 'public' && styles.toggleTextActive]}>Public</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.questionTitle}>What inspired you to take this journey?</Text>
          <View style={styles.tagsContainer}>
            {inspirations.map(item => (
              <TouchableOpacity 
                key={item} 
                style={[styles.tag, inspiration === item && styles.tagActive]}
                onPress={() => setInspiration(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tagText, inspiration === item && styles.tagTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionTitle}>Who are you traveling with?</Text>
          <View style={styles.grid2x2}>
            {travelWithOptions.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.gridCard, travelWith === item.id && styles.gridCardActive]}
                onPress={() => setTravelWith(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={28} color={travelWith === item.id ? '#FF8C32' : '#777'} style={{marginBottom: 4}} />
                <Text style={[styles.gridCardText, travelWith === item.id && styles.gridCardTextActive]}>{item.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionTitle}>Where is your journey starting from?</Text>
          {(() => {
            const isDropdownOpenStep2 = showLocationSuggestions && startLocation.trim() !== '';
            return (
              <>
                {isDropdownOpenStep2 && (
                  <View style={[styles.dropdownContainer, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 0, marginBottom: 0, borderTopWidth: 1 }]}>
                    {filteredLocations.length > 0 ? (
                      filteredLocations.slice(0, 5).map((city, index) => (
                        <TouchableOpacity
                          key={city}
                          style={[
                            styles.dropdownOption,
                            index === Math.min(filteredLocations.length, 5) - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setStartLocation(city);
                            setShowLocationSuggestions(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{city}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <TouchableOpacity
                        style={[styles.dropdownOption, { borderBottomWidth: 0 }]}
                        onPress={() => {
                          const trimmed = startLocation.trim();
                          if (trimmed.length < 3) {
                            Alert.alert('Invalid Location', 'Location name must be at least 3 characters long.');
                          } else {
                            setStartLocation(trimmed);
                            setShowLocationSuggestions(false);
                          }
                        }}
                      >
                        <View>
                          <Text style={[styles.dropdownOptionText, { color: '#E87030', fontWeight: '600' }]}>
                            {`+ Add "${startLocation}" manually`}
                          </Text>
                          {startLocation.trim().length < 3 && (
                            <Text style={{ fontSize: 11, color: '#C0392B', marginTop: 2 }}>
                              Requires at least 3 characters
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <View style={[styles.whiteInputContainer, isDropdownOpenStep2 && { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 }]}>
                  <Ionicons name="location-outline" size={18} color="#E87030" style={{marginRight: 8}} />
                  <TextInput
                    ref={startLocationInputRef}
                    value={startLocation}
                    onChangeText={(text) => {
                      setStartLocation(text);
                      setShowLocationSuggestions(true);
                      handleScrollOnType(startLocationInputRef);
                    }}
                    onFocus={(e) => {
                      setShowLocationSuggestions(true);
                      handleInputFocus(e);
                    }}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    placeholder="Enter your city or state"
                    placeholderTextColor="#999"
                    style={styles.whiteInputText}
                  />
                </View>
              </>
            );
          })()}

          <Text style={styles.questionTitle}>How are you traveling?</Text>
          <View style={styles.rowOptions}>
            {travelModes.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.rowOption, travelMode === item.id && styles.rowOptionActive]}
                onPress={() => setTravelMode(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={18} color={travelMode === item.id ? '#FFF' : '#777'} style={{marginRight: 4}} />
                <Text style={[styles.rowOptionText, travelMode === item.id && styles.rowOptionTextActive]}>{item.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionTitle}>Travel duration</Text>
          <TouchableOpacity 
            style={styles.whiteInputContainer}
            onPress={() => setShowEndDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color="#E87030" style={{ marginRight: 8 }} />
            <Text style={[styles.whiteInputText, !duration && { color: '#999' }]}>
              {duration || 'e.g. 5 Days'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.questionTitle}>Where are you staying?</Text>
          <TouchableOpacity 
            style={[styles.whiteInputContainer, isStayDropdownOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, borderBottomWidth: 0 }]}
            onPress={() => setIsStayDropdownOpen(!isStayDropdownOpen)}
            activeOpacity={0.8}
          >
            <Text style={[styles.whiteInputText, !stayType && {color: '#999'}]}>
              {stayType || 'Select Type of Stay'}
            </Text>
            <Ionicons name={isStayDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color="#999" />
          </TouchableOpacity>
          {isStayDropdownOpen && (
            <View style={styles.dropdownContainer}>
              {stayTypeOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    index === stayTypeOptions.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    setStayType(option);
                    setIsStayDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.questionTitle}>Distance from temple</Text>
          <View style={styles.grid2x2Distances}>
            {distances.map(item => (
              <TouchableOpacity 
                key={item} 
                style={[styles.gridOption, distance === item && styles.gridOptionActive]}
                onPress={() => setDistance(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.gridOptionText, distance === item && styles.gridOptionTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.questionTitle}>What was your first feeling when you saw the temple or sacred place?</Text>
          <View style={styles.tagsContainer}>
            {firstFeelings.map(item => (
              <TouchableOpacity 
                key={item} 
                style={[styles.tag, firstFeeling === item && styles.tagActive]}
                onPress={() => setFirstFeeling(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tagText, firstFeeling === item && styles.tagTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.questionTitle}>Crowd status today</Text>
          <View style={styles.crowdStatusContainer}>
            <View style={styles.crowdStatusLabels}>
              <Text style={styles.crowdStatusLabel}>Peaceful</Text>
              <Text style={styles.crowdStatusLabel}>Crowded</Text>
            </View>
            <View style={styles.sliderTrackContainer}>
              <View style={styles.sliderTrack} />
              <View style={[
                styles.sliderThumb,
                { left: `${(crowdStatus / 3) * 100}%`, marginLeft: -12 }
              ]} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                {[0, 1, 2, 3].map(idx => (
                  <TouchableOpacity
                    key={idx}
                    style={{ flex: 1, height: '100%' }}
                    onPress={() => setCrowdStatus(idx)}
                    activeOpacity={1}
                  />
                ))}
              </View>
            </View>
            <View style={styles.sliderDotsRow}>
              {[0, 1, 2, 3].map(idx => (
                <View
                  key={idx}
                  style={[
                    styles.sliderDot,
                    idx <= crowdStatus && styles.sliderDotActive
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.questionTitleSwitch}>Participated in Puja/Seva?</Text>
            <TouchableOpacity 
              style={[styles.toggleSwitch, participatedPuja && styles.toggleSwitchActive]} 
              onPress={() => setParticipatedPuja(!participatedPuja)}
              activeOpacity={0.9}
            >
              <View style={[styles.toggleSwitchThumb, participatedPuja && styles.toggleSwitchThumbActive]} />
            </TouchableOpacity>
          </View>
          
           {participatedPuja && (
            <View style={styles.whiteInputContainer}>
              <TextInput
                value={pujaDetails}
                onChangeText={setPujaDetails}
                placeholder="If yes, which one? (e.g. Ganga Aarti)"
                placeholderTextColor="#999"
                style={styles.whiteInputText}
              />
              <TouchableOpacity onPress={() => handleMicPress('puja')} activeOpacity={0.7}>
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color={activeMicField === 'puja' ? '#FF8C32' : '#FF8C32'} 
                  style={[styles.inputMicIcon, activeMicField === 'puja' && { backgroundColor: '#FFEBE0' }]} 
                />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.questionTitle}>What touched your heart most?</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              value={touchedHeart}
              onChangeText={setTouchedHeart}
              placeholder="The silent prayer, the fragrance of incense, the echo of bells..."
              placeholderTextColor="#897265"
              style={styles.textArea}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity 
              onPress={() => handleMicPress('touched')} 
              activeOpacity={0.7}
              style={{ position: 'absolute', bottom: 12, right: 12 }}
            >
              <Ionicons 
                name="mic" 
                size={20} 
                color={activeMicField === 'touched' ? '#FF8C32' : '#FF8C32'} 
                style={[styles.textAreaIcon, activeMicField === 'touched' && { backgroundColor: '#FFEBE0' }, { position: 'relative', bottom: 0, right: 0 }]} 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.questionTitle}>Share a photo or memory</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={handleImageUpload} activeOpacity={0.8}>
            {media.length > 0 ? (
              <Image source={{ uri: media[0].uri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="document-text-outline" size={32} color="#DDC1B1" />
                <Text style={styles.uploadTextTitle}>Tap to upload your darshan</Text>
                <Text style={styles.uploadTextSubtitle}>Maximum size 10MB</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.questionTitle}>What prasad, food, or local experience stood out to you?</Text>
          <View style={styles.prasadInputContainer}>
            <TextInput
              value={prasadExperience}
              onChangeText={setPrasadExperience}
              placeholder="Mention any special dhaba or local find."
              placeholderTextColor="#897265"
              style={styles.prasadInputText}
            />
            <TouchableOpacity onPress={() => handleMicPress('prasad')} activeOpacity={0.7}>
              <Ionicons 
                name="mic" 
                size={20} 
                color={activeMicField === 'prasad' ? '#FF8C32' : '#FF8C32'} 
                style={[styles.inputMicIcon, activeMicField === 'prasad' && { backgroundColor: '#FFEBE0' }]} 
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Step 4: Complete Your Journey — Full Figma Implementation
    const feelingOptions = ['Peaceful', 'Grateful', 'Emotional', 'Inspired', 'Blessed', 'Connected'];

    return (
      <View style={styles.stepContainer}>

        {/* 1. Darshan experience in one sentence */}
        <Text style={styles.questionTitle}>Darshan experience in one sentence</Text>
        <View style={styles.step4InputContainer}>
          <TextInput
            value={darshanExperience}
            onChangeText={setDarshanExperience}
            placeholder="e.g. A profound sense of stillness surrounded the deity."
            placeholderTextColor="rgba(86, 67, 55, 0.40)"
            style={[styles.step4InputText, { lineHeight: undefined }]}
            multiline
            textAlignVertical="top"
            numberOfLines={2}
          />
          <TouchableOpacity
            onPress={() => handleMicPress('darshan')}
            activeOpacity={0.7}
            style={[styles.step4MicBtn, activeMicField === 'darshan' && { backgroundColor: '#FFEBE0' }]}
          >
            <Ionicons
              name="mic"
              size={14}
              color="#FF8C32"
            />
          </TouchableOpacity>
        </View>

        {/* 2. Blessing, prayer, or sankalp carried? */}
        <Text style={styles.questionTitle}>Blessing, prayer, or sankalp carried?</Text>
        <View style={styles.step4InputContainer}>
          <TextInput
            value={blessingCarried}
            onChangeText={setBlessingCarried}
            placeholder="What intention did you set during this visit?"
            placeholderTextColor="rgba(86, 67, 55, 0.40)"
            style={[styles.step4InputText, { lineHeight: 24 }]}
            multiline
            textAlignVertical="top"
            numberOfLines={2}
          />
          <TouchableOpacity
            onPress={() => handleMicPress('blessing')}
            activeOpacity={0.7}
            style={[styles.step4MicBtn, activeMicField === 'blessing' && { backgroundColor: '#FFEBE0' }]}
          >
            <Ionicons
              name="mic"
              size={14}
              color="#FF8C32"
            />
          </TouchableOpacity>
        </View>

        {/* 3. How did this journey make you feel? */}
        <Text style={styles.questionTitle}>How did this journey make you feel?</Text>
        <View style={styles.tagsContainer}>
          {feelingOptions.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.tag, journeyFeelings.includes(item) && styles.tagActive]}
              onPress={() => {
                setJourneyFeelings(prev =>
                  prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tagText, journeyFeelings.includes(item) && styles.tagTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. UNFORGETTABLE MEMORY */}
        <View style={styles.memoryCard}>
          <Text style={styles.memoryLabel}>UNFORGETTABLE MEMORY</Text>
          <View style={{ flex: 1, alignSelf: 'stretch', position: 'relative' }}>
            <TextInput
              value={unforgettableMemory}
              onChangeText={setUnforgettableMemory}
              placeholder="The sunrise over the temple ghats..."
              placeholderTextColor="#6B7280"
              style={[styles.textArea, { paddingBottom: 30, color: '#6B7280' }]}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={() => handleMicPress('memory')}
              activeOpacity={0.7}
              style={[styles.step4MicBtn, { position: 'absolute', bottom: 0, right: 0 }, activeMicField === 'memory' && { backgroundColor: '#FFEBE0' }]}
            >
              <Ionicons
                name="mic"
                size={14}
                color="#FF8C32"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Accommodation recommendation? */}
        <View style={styles.accommodationCard}>
          <View style={styles.accommodationHeaderRow}>
            <Text style={styles.accommodationTitle}>Accommodation{'\n'}recommendation?</Text>
            <View style={styles.yesNoRow}>
              <TouchableOpacity
                style={[styles.yesNoBtn, accommodationRecommend === 'Yes' && styles.yesNoBtnActive]}
                onPress={() => setAccommodationRecommend(accommodationRecommend === 'Yes' ? '' : 'Yes')}
                activeOpacity={0.8}
              >
                <Text style={[styles.yesNoText, accommodationRecommend === 'Yes' && styles.yesNoTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yesNoBtn, accommodationRecommend === 'No' && styles.yesNoBtnActive]}
                onPress={() => setAccommodationRecommend(accommodationRecommend === 'No' ? '' : 'No')}
                activeOpacity={0.8}
              >
                <Text style={[styles.yesNoText, accommodationRecommend === 'No' && styles.yesNoTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
          {accommodationRecommend === 'Yes' && (
            <View style={styles.accommodationInputContainer}>
              <TextInput
                value={accommodationWhy}
                onChangeText={setAccommodationWhy}
                placeholder="Why or where?"
                placeholderTextColor="#897265"
                style={styles.accommodationInputText}
              />
              <TouchableOpacity onPress={() => handleMicPress('accommodation')} activeOpacity={0.7} style={[styles.step4MicBtn, activeMicField === 'accommodation' && { backgroundColor: '#FFEBE0' }]}>
                <Ionicons
                  name="mic"
                  size={14}
                  color="#FF8C32"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 6. I will remember this journey because... */}
        <Text style={styles.questionTitle}>I will remember this journey because...</Text>
        <View style={styles.rememberContainer}>
          <TextInput
            value={rememberBecause}
            onChangeText={setRememberBecause}
            placeholder="...it reconnected me with my ancestral roots."
            placeholderTextColor="rgba(86, 67, 55, 0.30)"
            style={styles.rememberTextInput}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={() => handleMicPress('remember')}
            activeOpacity={0.7}
            style={[styles.step4MicBtn, activeMicField === 'remember' && { backgroundColor: '#FFEBE0' }]}
          >
            <Ionicons
              name="mic"
              size={14}
              color="#FF8C32"
            />
          </TouchableOpacity>
        </View>

        {/* 7. Satvik Tip Card */}
        <View style={styles.satvikCard}>
          <View style={styles.satvikHeader}>
            <Text style={styles.satvikIcon}>🌿</Text>
            <Text style={styles.satvikTitle}>SATVIK TIP</Text>
          </View>
          <Text style={styles.satvikSubtitle}>Advice for future devotees</Text>
          <Text style={styles.satvikText}>Arrive before 4 AM for the morning Aarti</Text>
        </View>

        {/* 8. Share with Brahmand community? */}
        <View style={styles.shareRow}>
          <View style={styles.shareIconWrap}>
            <Ionicons name="people" size={22} color="#FFF" />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.shareTitle}>Share with Brahmand community?</Text>
            <Text style={styles.shareSubtitle}>Inspire other yatris with your reflection.</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleSwitch, shareWithCommunity && styles.toggleSwitchActive]}
            onPress={() => {
              const nextVal = !shareWithCommunity;
              setShareWithCommunity(nextVal);
              setVisibility(nextVal ? 'public' : 'private');
            }}
            activeOpacity={0.9}
          >
            <View style={[styles.toggleSwitchThumb, shareWithCommunity && styles.toggleSwitchThumbActive]} />
          </TouchableOpacity>
        </View>

        {/* Record Journey full-width button */}
        <TouchableOpacity
          style={[styles.recordJourneyBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.recordJourneyText}>{loading ? 'Saving...' : 'Record Journey'}</Text>
        </TouchableOpacity>

      </View>
    );
  };


  const getHeader = () => {
    if (step === 1) {
      return { title: 'Journey Creation', subtitle: 'Capture your Yatra memory in a single flow.', progressLabel: 'STEP 1 OF 4', rightLabel: '' };
    } else if (step === 2) {
      return { title: 'Start Your Journey 🚩', subtitle: "Tell us about your pilgrimage before or while you're traveling.", progressLabel: 'STEP 2 OF 4', rightLabel: 'Memories & Reflections' };
    } else if (step === 3) {
      return { title: 'During Your Visit 🛕', subtitle: "Capture the moments while they're still fresh in your heart.", progressLabel: 'STEP 3 OF 4', rightLabel: 'Memories & Reflections' };
    } else {
      return { title: 'Complete Your Journey 🙏', subtitle: "Reflect on your experience before the memories fade.", progressLabel: 'STEP 4 OF 4', rightLabel: 'Memories & Reflections' };
    }
  }

  if (step === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <LinearGradient
          colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
          locations={[0, 0.0913, 0.25]}
          style={StyleSheet.absoluteFillObject}
        />
        <ScrollView contentContainerStyle={styles.introScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introTopContainer}>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 10 }}>
              <TouchableOpacity onPress={handleBack} style={{ marginRight: 24, marginTop: 4, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M15.375 5.25L8.625 12L15.375 18.75" stroke="black" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
              <Text style={[styles.introTitle, { marginBottom: 0, flex: 1 }]}>Story Summary{"\n"}Generated{"\n"}by Brahmand</Text>
            </View>
            
            {/* Hero Section */}
            <View style={styles.introHero}>
              <Text style={styles.introSubtitle}>
                Brahmand creates a soulful record of{"\n"}your sacred pilgrimage from your{"\n"}responses.
              </Text>
            </View>

            {/* Bento Grid */}
            <View style={styles.bentoContainer}>
              <View style={styles.bentoRow}>
                {/* Card 1: Story */}
                <View style={styles.bentoCard}>
                  <BlurView intensity={12} tint="light" style={styles.bentoBlur}>
                    <Svg width={22} height={16} viewBox="0 0 22 16" fill="none">
                      <Path d="M13 5.9V4.2C13.55 3.96667 14.1125 3.79167 14.6875 3.675C15.2625 3.55833 15.8667 3.5 16.5 3.5C16.9333 3.5 17.3583 3.53333 17.775 3.6C18.1917 3.66667 18.6 3.75 19 3.85V5.45C18.6 5.3 18.1958 5.1875 17.7875 5.1125C17.3792 5.0375 16.95 5 16.5 5C15.8667 5 15.2583 5.07917 14.675 5.2375C14.0917 5.39583 13.5333 5.61667 13 5.9ZM13 11.4V9.7C13.55 9.46667 14.1125 9.29167 14.6875 9.175C15.2625 9.05833 15.8667 9 16.5 9C16.9333 9 17.3583 9.03333 17.775 9.1C18.1917 9.16667 18.6 9.25 19 9.35V10.95C18.6 10.8 18.1958 10.6125 17.7875 10.5375C17.3792 10.5375 16.95 10.5 16.5 10.5C15.8667 10.5 15.2583 10.575 14.675 10.725C14.0917 10.875 13.5333 11.1 13 11.4ZM13 8.65V6.95C13.55 6.71667 14.1125 6.54167 14.6875 6.425C15.2625 6.30833 15.8667 6.25 16.5 6.25C16.9333 6.25 17.3583 6.28333 17.775 6.35C18.1917 6.41667 18.6 6.5 19 6.6V8.2C18.6 8.05 18.1958 7.9375 17.7875 7.8625C17.3792 7.7875 16.95 7.75 16.5 7.75C15.8667 7.75 15.2583 7.82917 14.675 7.9875C14.0917 8.14583 13.5333 8.36667 13 8.65ZM5.5 12C6.28333 12 7.04583 12.0875 7.7875 12.2625C8.52917 12.4375 9.26667 12.7 10 13.05V3.2C9.31667 2.8 8.59167 2.5 7.825 2.3C7.05833 2.1 6.28333 2 5.5 2C4.9 2 4.30417 2.05833 3.7125 2.175C3.12083 2.29167 2.55 2.46667 2 2.7V12.6C2.58333 12.4 3.1625 12.25 3.7375 12.15C4.3125 12.05 4.9 12 5.5 12ZM12 13.05C12.7333 12.7 13.4708 12.4375 14.2125 12.2625C14.9542 12.0875 15.7167 12 16.5 12C17.1 12 17.6875 12.05 18.2625 12.15C18.8375 12.25 19.4167 12.4 20 12.6V2.7C19.45 2.46667 18.8792 2.29167 18.2875 2.175C17.6958 2.05833 17.1 2 16.5 2C15.7167 2 14.9417 2.1 14.175 2.3C13.4083 2.5 12.6833 2.8 12 3.2V13.05ZM11 16C10.2 15.3667 9.33333 14.875 8.4 14.525C7.46667 14.175 6.5 14 5.5 14C4.8 14 4.1125 14.0917 3.4375 14.275C2.7625 14.4583 2.11667 14.7167 1.5 15.05C1.15 15.2333 0.8125 15.225 0.4875 15.025C0.1625 14.825 0 14.5333 0 14.15V2.1C0 1.91667 0.0458333 1.74167 0.1375 1.575C0.229167 1.40833 0.366667 1.28333 0.55 1.2C1.31667 0.8 2.11667 0.5 2.95 0.3C3.78333 0.1 4.63333 0 5.5 0C6.46667 0 7.4125 0.125 8.3375 0.375C9.2625 0.625 10.15 1 11 1.5C11.85 1 12.7375 0.625 13.6625 0.375C14.5875 0.125 15.5333 0 16.5 0C17.3667 0 18.2167 0.1 19.05 0.3C19.8833 0.5 20.6833 0.8 21.45 1.2C21.6333 1.28333 21.7708 1.40833 21.8625 1.575C21.9542 1.74167 22 1.91667 22 2.1V14.15C22 14.5333 21.8375 14.825 21.5125 15.025C21.1875 15.225 20.85 15.2333 20.5 15.05C19.8833 14.7167 19.2375 14.4583 18.5625 14.275C17.8875 14.0917 17.2 14 16.5 14C15.5 14 14.5333 14.175 13.6 14.525C12.6667 14.875 11.8 15.3667 11 16Z" fill="#964900" />
                    </Svg>
                    <Text style={[styles.bentoCardText, { color: '#964900' }]}>Story</Text>
                  </BlurView>
                </View>
                {/* Card 2: Highlights */}
                <View style={styles.bentoCard}>
                  <BlurView intensity={12} tint="light" style={styles.bentoBlur}>
                    <Svg width={20} height={21} viewBox="0 0 20 21" fill="none">
                      <Path d="M0 21V10H2V12H4L6.975 2.125V0H8.975V2H11V0H13V2L16 12H18V10H20V21H11V16H9V21H0ZM6.7 10H13.3L12.7 8H7.3L6.7 10ZM7.9 6H12.1L11.5 4H8.5L7.9 6ZM2 19H7V14H13V19H18V14H14.5L13.9 12H6.1L5.5 14H2V19Z" fill="#B22B1D" />
                    </Svg>
                    <Text style={[styles.bentoCardText, { color: '#B22B1D' }]}>Highlights</Text>
                  </BlurView>
                </View>
              </View>

              <View style={styles.bentoRow}>
                {/* Card 3: Insights */}
                <View style={styles.bentoCard}>
                  <BlurView intensity={12} tint="light" style={styles.bentoBlur}>
                    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                      <Path d="M5.5 14.5L12.5 12.5L14.5 5.5L7.5 7.5L5.5 14.5ZM10 11.5C9.58333 11.5 9.22917 11.3542 8.9375 11.0625C8.64583 10.7708 8.5 10.4167 8.5 10C8.5 9.58333 8.64583 9.22917 8.9375 8.9375C9.22917 8.64583 9.58333 8.5 10 8.5C10.4167 8.5 10.7708 8.64583 11.0625 8.9375C11.3542 9.22917 11.5 9.58333 11.5 10C11.5 10.4167 11.3542 10.7708 11.0625 11.0625C10.7708 11.3542 10.4167 11.5 10 11.5ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2167 18 14.1042 17.2208 15.6625 15.6625C17.2208 14.1042 18 12.2167 18 10C18 7.78333 17.2208 5.89583 15.6625 4.3375C14.1042 2.77917 12.2167 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 12.2167 2.77917 14.1042 4.3375 15.6625C5.89583 17.2208 7.78333 18 10 18Z" fill="#735C00" />
                    </Svg>
                    <Text style={[styles.bentoCardText, { color: '#735C00' }]}>Insights</Text>
                  </BlurView>
                </View>
                {/* Card 4: Reflections */}
                <View style={styles.bentoCard}>
                  <BlurView intensity={12} tint="light" style={styles.bentoBlur}>
                    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                      <Path d="M15 11L10.85 6.95C10.3333 6.45 9.89583 5.89583 9.5375 5.2875C9.17917 4.67917 9 4.01667 9 3.3C9 2.38333 9.32083 1.60417 9.9625 0.9625C10.6042 0.320833 11.3833 0 12.3 0C12.8333 0 13.3333 0.1125 13.8 0.3375C14.2667 0.5625 14.6667 0.866667 15 1.25C15.3333 0.866667 15.7333 0.5625 16.2 0.3375C16.6667 0.1125 17.1667 0 17.7 0C18.6167 0 19.3958 0.320833 20.0375 0.9625C20.6792 1.60417 21 2.38333 21 3.3C21 4.01667 20.825 4.67917 20.475 5.2875C20.125 5.89583 19.6917 6.45 19.175 6.95L15 11ZM15 8.2L17.725 5.525C18.0417 5.20833 18.3333 4.87083 18.6 4.5125C18.8667 4.15417 19 3.75 19 3.3C19 2.93333 18.875 2.625 18.625 2.375C18.375 2.125 18.0667 2 17.7 2C17.4667 2 17.2458 2.04583 17.0375 2.1375C16.8292 2.22917 16.65 2.36667 16.5 2.55L15 4.35L13.5 2.55C13.35 2.36667 13.1708 2.22917 12.9625 2.1375C12.7542 2.04583 12.5333 2 12.3 2C11.9333 2 11.625 2.125 11.375 2.375C11.125 2.625 11 2.93333 11 3.3C11 3.75 11.1333 4.15417 11.4 4.5125C11.6667 4.87083 11.9583 5.20833 12.275 5.525L15 8.2ZM6 16.5L12.95 18.4L18.9 16.55C18.8167 16.4 18.6958 16.2708 18.5375 16.1625C18.3792 16.0542 18.2 16 18 16H12.95C12.5 16 12.1417 15.9833 11.875 15.95C11.6083 15.9167 11.3333 15.85 11.05 15.75L8.725 14.975L9.275 13.025L11.3 13.7C11.5833 13.7833 11.9167 13.85 12.3 13.9C12.6833 13.95 13.25 13.9833 14 14C14 13.8167 13.9458 13.6417 13.8375 13.475C13.7292 13.3083 13.6 13.2 13.45 13.15L7.6 11H6V16.5ZM0 20V9H7.6C7.71667 9 7.83333 9.0125 7.95 9.0375C8.06667 9.0625 8.175 9.09167 8.275 9.125L14.15 11.3C14.7 11.5 15.1458 11.85 15.4875 12.35C15.8292 12.85 16 13.4 16 14H18C18.8333 14 19.5417 14.275 20.125 14.825C20.7083 15.375 21 16.1 21 17V18L13 20.5L6 18.55V20H0ZM2 18H4V11H2V18Z" fill="#964900" />
                    </Svg>
                    <Text style={[styles.bentoCardText, { color: '#964900' }]}>Reflections</Text>
                  </BlurView>
                </View>
              </View>

              {/* Card 5: Recommendations (spans full width) */}
              <View style={[styles.bentoCard, styles.bentoCardFull]}>
                <BlurView intensity={12} tint="light" style={styles.bentoBlur}>
                  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                    <Path d="M6 16L10 12.95L14 16L12.5 11.05L16.5 8.2H11.6L10 3L8.4 8.2H3.5L7.5 11.05L6 16ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="#B22B1D" />
                  </Svg>
                  <Text style={[styles.bentoCardText, { color: '#B22B1D' }]}>Recommendations</Text>
                </BlurView>
              </View>
            </View>

            {/* Shareable Journey Card */}
            <View style={styles.shareableCard}>
              <BlurView intensity={12} tint="light" style={styles.shareableBlur}>
                <View style={styles.shareableIconWrap}>
                  <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
                    <Path d="M8 12C8.55 12 9.02083 11.8042 9.4125 11.4125C9.80417 11.0208 10 10.55 10 10C10 9.45 9.80417 8.97917 9.4125 8.5875C9.02083 8.19583 8.55 8 8 8C7.45 8 6.97917 8.19583 6.5875 8.5875C6.19583 8.97917 6 9.45 6 10C6 10.55 6.19583 11.0208 6.5875 11.4125C7.97917 11.8042 7.45 12 8 12ZM4 16H12V15.425C12 15.025 11.8917 14.6583 11.675 14.325C11.4583 13.9917 11.1583 13.7417 10.775 13.575C10.3417 13.3917 9.89583 13.25 9.4375 13.15C8.97917 13.05 8.5 13 8 13C7.5 13 7.02083 13.05 6.5625 13.15C6.10417 13.25 5.65833 13.3917 5.225 13.575C4.84167 13.7417 4.54167 13.9917 4.325 14.325C4.10833 14.6583 4 15.025 4 15.425V16ZM14 20H2C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H10L16 6V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20ZM14 18V6.85L9.15 2H2V18H14ZM2 18V2V6.85V18Z" fill="#964900" />
                  </Svg>
                </View>
                <View style={styles.shareableTextWrap}>
                  <Text style={styles.shareableTitle}>Shareable Journey Card</Text>
                  <Text style={styles.shareableSubtitle}>A permanent stamp for your Passport.</Text>
                </View>
              </BlurView>
            </View>

          </View>

          <View style={{ height: Platform.OS === 'ios' ? 8 : 24 }} />

          {/* Tagline wrapper with background only up to Om (🕉️) */}
          <View style={styles.taglineBgWrapper}>
            <Text style={styles.taglineText}>
              {"\"Not just where you went—but what the journey meant to you. 🕉️\""}
            </Text>
          </View>

          <View style={styles.introBottomActionsContainer}>
            {/* Note Text */}
            <Text style={styles.noteText}>
              Some questions will be asked after the journey{"\n"}or while you travel.
            </Text>

            {/* Actions */}
            <View style={styles.actionWrapper}>
              <TouchableOpacity
                style={styles.continueToCardBtn}
                activeOpacity={0.85}
                onPress={() => setStep(1)}
              >
                <Text style={styles.continueToCardText}>Continue to Journey Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.maybeLaterBtn}
                activeOpacity={0.8}
                onPress={handleBack}
              >
                <Text style={styles.maybeLaterText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const headerInfo = getHeader();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#FF8C32', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAwareScrollView ref={keyboardScrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <TouchableOpacity onPress={handleBack} style={{ marginRight: 12, padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={[styles.pageTitle, { marginBottom: 0, flex: 1 }]}>{headerInfo.title}</Text>
            </View>
            <Text style={styles.pageSubtitle}>{headerInfo.subtitle}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressText}>{headerInfo.progressLabel}</Text>
              {!!headerInfo.rightLabel && <Text style={styles.progressTextRight}>{headerInfo.rightLabel}</Text>}
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
            </View>
          </View>

          {renderStepContent()}
        </View>

        {/* Footer */}
        {step < 4 && (
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="chevron-forward-outline" size={14} color="#FFF" style={{ width: 14, height: 12, marginLeft: 4 }} />
              <Ionicons name="chevron-forward-outline" size={14} color="#FFF" style={{ width: 14, height: 12, marginLeft: -10 }} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollView>

      {showStep1DatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={showStep1DatePicker} transparent animationType="fade">
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowStep1DatePicker(false)}
            >
              <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 20, shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.1, elevation: 5 }}>
                <DateTimePicker
                  value={parseDateString(date)}
                  mode="date"
                  display="inline"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setDate(formatDateString(selectedDate));
                    }
                    setShowStep1DatePicker(false);
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={parseDateString(date)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStep1DatePicker(false);
              if (event.type === 'set' && selectedDate) {
                setDate(formatDateString(selectedDate));
              }
            }}
          />
        )
      )}

      {showEndDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={showEndDatePicker} transparent animationType="fade">
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowEndDatePicker(false)}
            >
              <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 20, shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.1, elevation: 5 }}>
                <DateTimePicker
                  value={date ? parseDateString(date) : new Date()}
                  mode="date"
                  display="inline"
                  minimumDate={date ? parseDateString(date) : new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const startDateObj = date ? parseDateString(date) : new Date();
                      const diffTime = selectedDate.getTime() - startDateObj.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      setDuration(`${diffDays} Day${diffDays > 1 ? 's' : ''}`);
                    }
                    setShowEndDatePicker(false);
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={date ? parseDateString(date) : new Date()}
            mode="date"
            display="default"
            minimumDate={date ? parseDateString(date) : new Date()}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (event.type === 'set' && selectedDate) {
                const startDateObj = date ? parseDateString(date) : new Date();
                const diffTime = selectedDate.getTime() - startDateObj.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setDuration(`${diffDays} Day${diffDays > 1 ? 's' : ''}`);
              }
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 0 : 12,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    alignSelf: 'stretch',
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 40,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF8C32',
    letterSpacing: 0.5,
  },
  progressTextRight: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  progressBarBackground: {
    flexDirection: 'row',
    height: 8,
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 9999,
    backgroundColor: '#E8E1DA',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#FF7B00',
    borderRadius: 9999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#777',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7EBE1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7EBE1',
    borderRadius: 30,
    padding: 4,
    height: 52,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FF8C32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 'auto',
    paddingTop: 20,
  },
  backButton: {
    width: 150,
    height: 56,
    paddingVertical: 8,
    paddingHorizontal: 24,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FF8C32',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF8C32',
  },
  continueButton: {
    flexDirection: 'row',
    width: 150.41,
    height: 56,
    backgroundColor: '#FF8C32',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'capitalize',
    marginRight: 4,
  },
  
  // Step 2 Styles
  stepContainer: {
    paddingBottom: 20,
  },
  questionTitle: {
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 12,
    marginTop: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF8C32',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagActive: {
    backgroundColor: '#FF8C32',
    borderColor: '#FF8C32',
  },
  tagText: {
    color: '#564337',
    textAlign: 'center',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20,
  },
  tagTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (width - 48 - 12) / 2,
    height: 81,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 17,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDC1B1',
  },
  gridCardActive: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FF8C32',
  },
  gridCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777',
    marginTop: 4,
  },
  gridCardTextActive: {
    color: '#FF8C32',
  },
  whiteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDC1B1',
  },
  whiteInputText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    paddingVertical: 0,
  },
  rowOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowOption: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rowOptionActive: {
    backgroundColor: '#FF8C32',
    borderColor: '#FF8C32',
  },
  rowOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  rowOptionTextActive: {
    color: '#FFF',
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#333',
  },
  grid2x2Distances: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridOption: {
    width: (width - 48 - 12) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDC1B1',
  },
  gridOptionActive: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FF8C32',
  },
  gridOptionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#564337',
    textAlign: 'center',
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    lineHeight: 20,
  },
  gridOptionTextActive: {
    color: '#FF8C32',
  },
  reviewBlock: {
    marginBottom: 16,
  },
  reviewValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  
  // Step 3 Styles
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 0,
  },
  questionTitleSwitch: {
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 24,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#FF8C32',
  },
  toggleSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    transform: [{ translateX: 0 }],
  },
  toggleSwitchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  inputMicIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 4,
    backgroundColor: '#FFF5F0',
    borderRadius: 14,
    overflow: 'hidden',
    width: 28,
    height: 28,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  crowdStatusContainer: {
    display: 'flex',
    padding: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.30)',
    backgroundColor: '#FFF',
    marginBottom: 0,
  },
  crowdStatusLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  crowdStatusLabel: {
    fontSize: 14,
    color: '#564337',
    fontFamily: 'SF Pro',
    fontWeight: '500',
  },
  sliderTrackContainer: {
    height: 24,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8E1DA',
    borderRadius: 9999,
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF8C32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderDotsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 6,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD2B2',
  },
  sliderDotActive: {
    backgroundColor: '#FF8C32',
  },
  textAreaContainer: {
    width: 350,
    maxWidth: '100%',
    alignSelf: 'center',
    height: 138,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.30)',
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 0,
  },
  textArea: {
    flex: 1,
    alignSelf: 'stretch',
    color: '#897265',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  textAreaIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 4,
    backgroundColor: '#FFF5F0',
    borderRadius: 14,
    overflow: 'hidden',
    width: 28,
    height: 28,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  uploadBox: {
    height: 140,
    backgroundColor: '#F5EBE6',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DDC1B1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadTextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#564337',
    marginTop: 8,
  },
  uploadTextSubtitle: {
    fontSize: 12,
    color: '#8C7A6F',
    marginTop: 4,
  },
  prasadInputContainer: {
    display: 'flex',
    width: 350,
    maxWidth: '100%',
    alignSelf: 'center',
    height: 61,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDC1B1',
    backgroundColor: '#FFF',
    marginBottom: 0,
  },
  prasadInputText: {
    flex: 1,
    alignSelf: 'stretch',
    color: '#897265',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    textAlign: 'center',
  },

  // Step 4 Styles
  step4InputContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 13,
    paddingRight: 20,
    paddingBottom: 14,
    paddingLeft: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDC1B1',
    backgroundColor: '#FFF',
    marginBottom: 0,
    minHeight: 48,
  },
  step4InputText: {
    flex: 1,
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginRight: 8,
    minHeight: 40,
  },
  step4MicBtn: {
    display: 'flex',
    height: 30,
    width: 30,
    padding: 8,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: '#EEE7DF',
  },
  memoryCard: {
    display: 'flex',
    width: 350,
    maxWidth: '100%',
    alignSelf: 'center',
    height: 158,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.30)',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 24,
    marginBottom: 0,
  },
  memoryLabel: {
    color: '#FF8C32',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  accommodationCard: {
    display: 'flex',
    width: 350,
    maxWidth: '100%',
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.20)',
    backgroundColor: '#FFF',
    marginTop: 24,
    marginBottom: 0,
  },
  accommodationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  accommodationTitle: {
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 22,
  },
  accommodationInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: 42,
    paddingTop: 13,
    paddingRight: 20,
    paddingBottom: 14,
    paddingLeft: 20,
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDC1B1',
    backgroundColor: '#FFF',
  },
  accommodationInputText: {
    flex: 1,
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '400',
    marginRight: 8,
  },
  yesNoRow: {
    display: 'flex',
    flexDirection: 'row',
    padding: 4,
    alignItems: 'flex-start',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.30)',
    backgroundColor: '#FFF',
  },
  yesNoBtn: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  yesNoBtnActive: {
    backgroundColor: '#FF8C32',
  },
  yesNoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#564337',
  },
  yesNoTextActive: {
    color: '#FFF',
  },
  satvikCard: {
    display: 'flex',
    width: 350,
    maxWidth: '100%',
    alignSelf: 'center',
    height: 120,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C32',
    backgroundColor: '#FFDCC7',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 24,
    marginBottom: 0,
  },
  satvikHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  satvikIcon: {
    fontSize: 16,
  },
  satvikTitle: {
    color: '#FF8C32',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  satvikSubtitle: {
    color: '#FF8C32',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  satvikText: {
    color: '#6B7280',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  shareTitle: {
    color: '#650000',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  shareSubtitle: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  rememberContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 13,
    paddingRight: 20,
    paddingBottom: 14,
    paddingLeft: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C32',
    backgroundColor: '#FFF',
    marginBottom: 0,
    minHeight: 48,
  },
  rememberTextInput: {
    flex: 1,
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: undefined,
    marginRight: 8,
    minHeight: 40,
  },
  shareRow: {
    display: 'flex',
    flexDirection: 'row',
    width: 350,
    maxWidth: '100%',
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginTop: 24,
    marginBottom: 0,
  },
  shareIconWrap: {
    display: 'flex',
    width: 34.91,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: '#FE624E',
  },
  recordJourneyBtn: {
    marginTop: 24,
    marginBottom: 12,
    width: 350,
    height: 64,
    alignSelf: 'center',
    backgroundColor: '#FF8C32',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(150, 73, 0, 0.20)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  recordJourneyText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
  },
  footerContainerStep4: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButtonStep4: {
    height: 44,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introScrollContent: {
    flexGrow: 1,
  },
  introTopContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    paddingHorizontal: 21,
    paddingTop: Platform.OS === 'ios' ? 32 : 40,
    paddingBottom: 0,
  },
  taglineBgWrapper: {
    width: '100%',
    maxWidth: 308,
    alignSelf: 'center',
    backgroundColor: '#FFF8F1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 222, 213, 0.50)',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  introBottomActionsContainer: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    paddingHorizontal: 21,
    alignItems: 'center',
    flexDirection: 'column',
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  introHero: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  introTitle: {
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 10,
  },
  introSubtitle: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 14.5,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
  bentoContainer: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  bentoCard: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 222, 213, 0.50)',
    overflow: 'hidden',
  },
  bentoBlur: {
    flex: 1,
    padding: 4,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bentoCardFull: {
    width: '100%',
  },
  bentoCardText: {
    fontFamily: 'SF Pro',
    fontSize: 12.5,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
  },
  shareableCard: {
    width: '100%',
    height: 68,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 50, 0.30)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: Platform.OS === 'ios' ? 8 : 14,
  },
  shareableBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  shareableIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 140, 50, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareableTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  shareableTitle: {
    color: '#964900',
    fontFamily: 'SF Pro',
    fontSize: 14.5,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18,
  },
  shareableSubtitle: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 14,
  },
  taglineText: {
    color: '#964900',
    fontFamily: 'SF Pro',
    fontSize: 13,
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  noteText: {
    color: 'rgba(86, 67, 55, 0.8)',
    fontFamily: 'SF Pro',
    fontSize: 11.5,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
  },
  actionWrapper: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  continueToCardBtn: {
    width: '100%',
    maxWidth: 308,
    height: 48,
    backgroundColor: '#FF8C32',
    borderRadius: 9999,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  continueToCardText: {
    color: '#FFF',
    fontFamily: 'SF Pro',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  maybeLaterBtn: {
    width: '100%',
    maxWidth: 308,
    height: 48,
    borderColor: '#FF7B00',
    borderWidth: 1,
    borderRadius: 9999,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  maybeLaterText: {
    color: '#964900',
    fontFamily: 'SF Pro',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
});

