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
import { createMediaItem } from '../../../src/services/passportService';

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

  // Step 3/4 State (Placeholders)
  const [media, setMedia] = useState<PassportMediaItem[]>([]);
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
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
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
          <View style={styles.whiteInputContainer}>
            <Ionicons name="location-outline" size={18} color="#E87030" style={{marginRight: 8}} />
            <TextInput
              value={startLocation}
              onChangeText={setStartLocation}
              placeholder="Enter your city or state"
              placeholderTextColor="#999"
              style={styles.whiteInputText}
            />
          </View>

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

    // Fallback for Step 3 and 4
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{step === 3 ? 'Add Photos & Reflections' : 'Review & Save'}</Text>
        <Text style={{color: '#555', marginBottom: 20}}>Continue mapping your spiritual journey...</Text>
        
        {step === 4 && (
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
        )}
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

        {/* Footer Buttons attached to the page content */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>

          {step < 4 ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="chevron-forward-outline" size={16} color="#FFF" style={{ marginLeft: 4 }} />
              <Ionicons name="chevron-forward-outline" size={16} color="#FFF" style={{ marginLeft: -10 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.continueButtonText}>{loading ? 'Saving...' : 'Save Journey'}</Text>
              <Ionicons name="checkmark-outline" size={18} color="#FFF" style={{ marginLeft: 4 }} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    fontFamily: 'SF Pro',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'SF Pro',
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
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(232, 112, 48, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E87030',
    borderRadius: 2,
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
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: '#E87030',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E87030',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#F07A3D',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F07A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginRight: 4,
  },
  
  // Step 2 Styles
  stepContainer: {
    paddingBottom: 20,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
});

