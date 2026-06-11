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
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePassportStore } from '../../../src/store/passportStore';
import { PassportAnswer, PassportMediaItem, PassportJourneyVisibility } from '../../../src/types/passport';

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
  const [date, setDate] = useState('06/05/2026');
  const [visibility, setVisibility] = useState<PassportJourneyVisibility>('private');

  // Step 2 State
  const [inspiration, setInspiration] = useState('Gratitude');
  const [travelWith, setTravelWith] = useState('FAMILY');
  const [startLocation, setStartLocation] = useState('');
  const [travelMode, setTravelMode] = useState('Train');
  const [duration, setDuration] = useState('');
  const [stayType, setStayType] = useState('');
  const [distance, setDistance] = useState('Under 2 km');
  const [isStayDropdownOpen, setIsStayDropdownOpen] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Derived state for suggestions
  const filteredLocations = startLocation.trim()
    ? indianCities.filter(city => city.toLowerCase().includes(startLocation.toLowerCase()))
    : [];

  // Step 3 State
  const [firstFeeling, setFirstFeeling] = useState('Peace');
  const [crowdStatus, setCrowdStatus] = useState(1);
  const [participatedPuja, setParticipatedPuja] = useState(true);
  const [pujaDetails, setPujaDetails] = useState('');
  const [touchedHeart, setTouchedHeart] = useState('');
  const [prasadExperience, setPrasadExperience] = useState('');
  const [media, setMedia] = useState<PassportMediaItem[]>([]);

  // Step 4 State (Placeholders)
  const [answers, setAnswers] = useState<PassportAnswer[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => {});
    }
  }, []);

  const handleNext = () => {
    if (step === 1 && (!location.trim() || !title.trim())) {
      Alert.alert('Missing details', 'Please add a title and location before continuing.');
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
        { question: 'Crowd status today', answer: crowdStatus === 0 ? 'Peaceful' : crowdStatus === 1 ? 'Moderate' : 'Crowded' },
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
      await addJourney({ title: title.trim(), location: location.trim(), date, media, answers, visibility });
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
            <Ionicons name="calendar-outline" size={18} color="#E87030" style={{ marginRight: 8 }} />
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
                <Ionicons name={item.icon as any} size={28} color={travelWith === item.id ? '#E87030' : '#777'} style={{marginBottom: 4}} />
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
          <View style={styles.whiteInputContainer}>
            <Ionicons name="calendar-outline" size={18} color="#E87030" style={{marginRight: 8}} />
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 5 Days"
              placeholderTextColor="#999"
              style={styles.whiteInputText}
            />
          </View>

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
              <View style={styles.sliderDotsRow}>
                {[0, 1, 2].map(idx => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.sliderDotWrapper}
                    onPress={() => setCrowdStatus(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.sliderDot, crowdStatus === idx && styles.sliderDotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
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
              <Ionicons name="mic" size={20} color="#E87030" style={styles.inputMicIcon} />
            </View>
          )}

          <Text style={styles.questionTitle}>What touched your heart most?</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              value={touchedHeart}
              onChangeText={setTouchedHeart}
              placeholder="The silent prayer, the fragrance of incense, the echo of bells..."
              placeholderTextColor="#999"
              style={styles.textArea}
              multiline
              textAlignVertical="top"
            />
            <Ionicons name="mic" size={20} color="#E87030" style={styles.textAreaIcon} />
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
          <View style={[styles.whiteInputContainer, { marginBottom: 20 }]}>
            <TextInput
              value={prasadExperience}
              onChangeText={setPrasadExperience}
              placeholder="Mention any special dhaba or local find."
              placeholderTextColor="#999"
              style={styles.whiteInputText}
            />
            <Ionicons name="mic" size={20} color="#E87030" style={styles.inputMicIcon} />
          </View>
        </View>
      );
    }

    // Fallback for Step 4
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Review & Save</Text>
        <Text style={{color: '#555', marginBottom: 20}}>Continue mapping your spiritual journey...</Text>
        
        <View>
          <View style={styles.reviewBlock}>
            <Text style={styles.inputLabel}>TITLE</Text>
            <Text style={styles.reviewValue}>{title}</Text>
          </View>
          <View style={styles.reviewBlock}>
            <Text style={styles.inputLabel}>LOCATION</Text>
            <Text style={styles.reviewValue}>{location}</Text>
          </View>
          <View style={styles.reviewBlock}>
            <Text style={styles.inputLabel}>INSPIRATION</Text>
            <Text style={styles.reviewValue}>{inspiration}</Text>
          </View>
          <View style={styles.reviewBlock}>
            <Text style={styles.inputLabel}>TRAVELING WITH</Text>
            <Text style={styles.reviewValue}>{travelWith}</Text>
          </View>
        </View>
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
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
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

        {/* Footer Buttons attached to the end of the content */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          {step < 4 ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="chevron-forward-outline" size={14} color="#FFF" style={{ width: 14, height: 12, marginLeft: 4 }} />
              <Ionicons name="chevron-forward-outline" size={14} color="#FFF" style={{ width: 14, height: 12, marginLeft: -10 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.continueButtonText}>{loading ? 'Saving...' : 'Save Journey'}</Text>
              <Ionicons name="checkmark-outline" size={14} color="#FFF" style={{ width: 14, height: 12, marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    color: '#E87030',
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
    backgroundColor: '#F07A3D',
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
    borderColor: '#FF7B00',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E87030',
  },
  continueButton: {
    flexDirection: 'row',
    width: 150.41,
    height: 56,
    backgroundColor: '#F07A3D',
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
    marginTop: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagActive: {
    backgroundColor: '#FF8D57',
    borderColor: '#FF8D57',
  },
  tagText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
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
    borderColor: '#E87030',
  },
  gridCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777',
    marginTop: 4,
  },
  gridCardTextActive: {
    color: '#E87030',
  },
  whiteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    backgroundColor: '#FF8D57',
    borderColor: '#FF8D57',
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
    borderColor: '#E87030',
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
    color: '#E87030',
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
    marginTop: 20,
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
    backgroundColor: '#FF8D57',
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 193, 177, 0.30)',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  crowdStatusLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  crowdStatusLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  sliderTrackContainer: {
    height: 16,
    width: '100%',
    justifyContent: 'center',
  },
  sliderTrack: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  sliderDotsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderDotWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  sliderDotActive: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: '#FF7B00',
  },
  textAreaContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 100,
    marginBottom: 0,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
  },
  textAreaIcon: {
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
});

