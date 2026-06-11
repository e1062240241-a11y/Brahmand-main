import React, { useEffect, useState } from 'react';
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
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePassportStore } from '../../../src/store/passportStore';
import { PassportAnswer, PassportMediaItem, PassportJourneyVisibility } from '../../../src/types/passport';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

const { width } = Dimensions.get('window');

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
  const router = useRouter();
  const addJourney = usePassportStore((state) => state.addJourney);
  const awardBadge = usePassportStore((state) => state.awardBadge);
  const journeyCount = usePassportStore((state) => state.journeys.length);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [title, setTitle] = useState('My Spiritual Journey');
  const [location, setLocation] = useState('Kedarnath, Uttarakhand');
  const [date, setDate] = useState('');
  const [visibility, setVisibility] = useState<PassportJourneyVisibility>('private');

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
  const [showStep1DatePicker, setShowStep1DatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const parseDateString = (str: string): Date => {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  };

  const formatDateString = (d: Date): string => {
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
    ? indianCities.filter(city => city.toLowerCase().includes(startLocation.toLowerCase()))
    : [];

  // Step 3 State
  const [firstFeeling, setFirstFeeling] = useState('');
  const [crowdStatus, setCrowdStatus] = useState(1);
  const [participatedPuja, setParticipatedPuja] = useState(true);
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
    if (step === 1 && (!location.trim() || !title.trim() || !date.trim())) {
      Alert.alert('Missing details', 'Please add a title, location, and date before continuing.');
      return;
    }
    if (step === 3) {
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
    if (step === 1) {
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
    if (!title.trim() || !location.trim()) {
      Alert.alert('Missing details', 'Please complete the journey title and location.');
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
      await addJourney({ title: title.trim(), location: location.trim(), date, media, answers: allAnswers, visibility });
      if (journeyCount === 0) {
        await awardBadge('First Journey', 'Created your first Brahmand Passport journey');
      }
      Alert.alert('Journey Saved', 'Your journey has been added to Brahmand Passport.');
      router.push('/passport/timeline' as any);
    } catch (error) {
      Alert.alert('Save Failed', 'Unable to save the journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={18} color="#E87030" style={{ marginRight: 8 }} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Kedarnath, Uttarakhand"
              placeholderTextColor="#999"
              style={styles.inputText}
            />
          </View>

          <Text style={styles.inputLabel}>DATE</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setShowStep1DatePicker(true)} style={{ marginRight: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="calendar-outline" size={18} color="#E87030" />
            </TouchableOpacity>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
              style={styles.inputText}
            />
          </View>

          <Text style={styles.inputLabel}>PRIVACY</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, visibility === 'private' && styles.toggleButtonActive]}
              onPress={() => setVisibility('private')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, visibility === 'private' && styles.toggleTextActive]}>Private</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, visibility === 'public' && styles.toggleButtonActive]}
              onPress={() => setVisibility('public')}
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
          <View style={[styles.whiteInputContainer, (showLocationSuggestions && filteredLocations.length > 0) && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, borderBottomWidth: 0 }]}>
            <Ionicons name="location-outline" size={18} color="#E87030" style={{marginRight: 8}} />
            <TextInput
              value={startLocation}
              onChangeText={(text) => {
                setStartLocation(text);
                setShowLocationSuggestions(true);
              }}
              onFocus={() => setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
              placeholder="Enter your city or state"
              placeholderTextColor="#999"
              style={styles.whiteInputText}
            />
          </View>
          {showLocationSuggestions && filteredLocations.length > 0 && (
            <View style={styles.dropdownContainer}>
              {filteredLocations.slice(0, 5).map((city, index) => (
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
              ))}
            </View>
          )}

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
            placeholderTextColor="#897265"
            style={styles.step4InputText}
            multiline
            textAlignVertical="top"
            numberOfLines={2}
          />
          <TouchableOpacity
            onPress={() => handleMicPress('darshan')}
            activeOpacity={0.7}
            style={styles.step4MicBtn}
          >
            <Ionicons
              name="mic"
              size={20}
              color={activeMicField === 'darshan' ? '#FF8C32' : '#FF8C32'}
              style={[styles.inputMicIcon, activeMicField === 'darshan' && { backgroundColor: '#FFEBE0' }]}
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
            placeholderTextColor="#897265"
            style={styles.step4InputText}
            multiline
            textAlignVertical="top"
            numberOfLines={2}
          />
          <TouchableOpacity
            onPress={() => handleMicPress('blessing')}
            activeOpacity={0.7}
            style={styles.step4MicBtn}
          >
            <Ionicons
              name="mic"
              size={20}
              color={activeMicField === 'blessing' ? '#FF8C32' : '#FF8C32'}
              style={[styles.inputMicIcon, activeMicField === 'blessing' && { backgroundColor: '#FFEBE0' }]}
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
        <View style={styles.memoryLabelRow}>
          <Text style={styles.memoryLabel}>UNFORGETTABLE MEMORY</Text>
        </View>
        <View style={styles.textAreaContainer}>
          <TextInput
            value={unforgettableMemory}
            onChangeText={setUnforgettableMemory}
            placeholder="The sunrise over the temple ghats..."
            placeholderTextColor="#897265"
            style={styles.textArea}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={() => handleMicPress('memory')}
            activeOpacity={0.7}
            style={{ position: 'absolute', bottom: 12, right: 12 }}
          >
            <Ionicons
              name="mic"
              size={20}
              color={activeMicField === 'memory' ? '#FF8C32' : '#FF8C32'}
              style={[styles.textAreaIcon, activeMicField === 'memory' && { backgroundColor: '#FFEBE0' }, { position: 'relative', bottom: 0, right: 0 }]}
            />
          </TouchableOpacity>
        </View>

        {/* 5. Accommodation recommendation? */}
        <View style={styles.accommodationRow}>
          <Text style={styles.questionTitleSwitch}>Accommodation recommendation?</Text>
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
          <View style={styles.step4InputContainer}>
            <TextInput
              value={accommodationWhy}
              onChangeText={setAccommodationWhy}
              placeholder="Why or where?"
              placeholderTextColor="#897265"
              style={[styles.step4InputText, { minHeight: 40 }]}
            />
            <TouchableOpacity onPress={() => handleMicPress('accommodation')} activeOpacity={0.7} style={styles.step4MicBtn}>
              <Ionicons
                name="mic"
                size={20}
                color={activeMicField === 'accommodation' ? '#FF8C32' : '#FF8C32'}
                style={[styles.inputMicIcon, activeMicField === 'accommodation' && { backgroundColor: '#FFEBE0' }]}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* 6. I will remember this journey because... */}
        <Text style={styles.questionTitle}>I will remember this journey because...</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            value={rememberBecause}
            onChangeText={setRememberBecause}
            placeholder="...it reconnected me with my ancestral roots."
            placeholderTextColor="#897265"
            style={styles.textArea}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={() => handleMicPress('remember')}
            activeOpacity={0.7}
            style={{ position: 'absolute', bottom: 12, right: 12 }}
          >
            <Ionicons
              name="mic"
              size={20}
              color={activeMicField === 'remember' ? '#FF8C32' : '#FF8C32'}
              style={[styles.textAreaIcon, activeMicField === 'remember' && { backgroundColor: '#FFEBE0' }, { position: 'relative', bottom: 0, right: 0 }]}
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
            <Ionicons name="people" size={22} color="#E87030" />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.questionTitleSwitch}>Share with Brahmand community?</Text>
            <Text style={styles.shareSubtitle}>Inspire other yatris with your reflection.</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleSwitch, shareWithCommunity && styles.toggleSwitchActive]}
            onPress={() => setShareWithCommunity(!shareWithCommunity)}
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

  const headerInfo = getHeader();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#FF8C32', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>{headerInfo.title}</Text>
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

        {/* Footer — Step 4: only Back link; Record Journey is inline in content */}
        {step < 4 ? (
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
        ) : (
          <View style={styles.footerContainerStep4}>
            <TouchableOpacity style={styles.backButtonStep4} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
    paddingRight: 79.5,
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 9999,
    backgroundColor: '#E8E1DA',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#FF8C32',
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
    paddingVertical: 13,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDC1B1',
  },
  whiteInputText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
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
    marginBottom: 12,
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
    marginBottom: 12,
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
    marginBottom: 20,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDC1B1',
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 4,
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
    marginTop: 2,
  },
  memoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  memoryLabel: {
    color: '#FF8C32',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  accommodationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yesNoBtn: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.30)',
    backgroundColor: '#FFF',
  },
  yesNoBtnActive: {
    backgroundColor: '#FF8C32',
    borderColor: '#FF8C32',
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
    backgroundColor: '#FFF5ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD5B0',
    padding: 16,
    marginTop: 28,
    marginBottom: 4,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'SF Pro',
  },
  satvikSubtitle: {
    color: '#564337',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SF Pro',
    marginBottom: 4,
  },
  satvikText: {
    color: '#1E1B17',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro',
    lineHeight: 20,
  },
  shareSubtitle: {
    color: '#897265',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'SF Pro',
    marginTop: 2,
    lineHeight: 18,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E5DF',
  },
  shareIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD5B0',
  },
  recordJourneyBtn: {
    marginTop: 20,
    marginBottom: 12,
    height: 56,
    backgroundColor: '#FF8C32',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  recordJourneyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SF Pro',
    letterSpacing: 0.3,
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
});

