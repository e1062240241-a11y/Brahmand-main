import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform, KeyboardAvoidingView, BackHandler, Keyboard, FlatList, ScrollView} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../../src/constants/theme';
import { searchHospitals } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';

const EMERGENCY_TYPES = ['Medical', 'Accident', 'Fire', 'Police', 'Other'];
const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const CONTACT_OPTIONS = ['Phone Call', 'WhatsApp', 'Platform Only'];
const COUNTRY_CODES = [
  { code: '+91', country: 'India (🇮🇳)' },
  { code: '+1', country: 'US / Canada (🇺🇸)' },
  { code: '+44', country: 'UK (🇬🇧)' },
  { code: '+971', country: 'UAE (🇦🇪)' },
  { code: '+977', country: 'Nepal (🇳🇵)' },
  { code: '+880', country: 'Bangladesh (🇧🇩)' },
  { code: '+61', country: 'Australia (🇦🇺)' },
];

const formatPhoneNumber = (text: string) => {
  let cleaned = text.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = cleaned.slice(1);
  }
  return cleaned.replace(/[^0-9]/g, '').slice(0, 10);
};

export default function CommunityRequestEmergencyPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ community_id?: string }>();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [emergencyType, setEmergencyType] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalSuggestions, setHospitalSuggestions] = useState<Array<{ name: string; address: string; area: string; city: string }>>([]);
  const [selectedHospital, setSelectedHospital] = useState<{ name: string; address: string; area: string; city: string } | null>(null);
  const [isHospitalSearching, setIsHospitalSearching] = useState(false);
  
  const [location, setLocation] = useState('Auto-detected');
  const [urgency, setUrgency] = useState('Urgent');
  const [description, setDescription] = useState('');
  
  const [contactPreference, setContactPreference] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [contactNumber, setContactNumber] = useState(user?.phone ? formatPhoneNumber(user.phone) : '');

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (user?.home_location) {
      const { area, city, state } = user.home_location;
      const parts = [area, city, state].filter(Boolean);
      if (parts.length > 0) {
        setLocation(parts.join(', '));
      }
    }
  }, [user]);

  // Debounced Search using Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hospitalName.length >= 1 && !selectedHospital) {
        setIsHospitalSearching(true);
        try {
          const response = await searchHospitals(hospitalName);
          setHospitalSuggestions(response.data.results || []);
        } catch (error) {
          console.error('Search error', error);
        } finally {
          setIsHospitalSearching(false);
        }
      } else {
        setHospitalSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hospitalName, selectedHospital]);

  const handleHospitalSelect = (hospital: any) => {
    setHospitalName(hospital.name);
    setSelectedHospital(hospital);
    setHospitalSuggestions([]);
    
    const parts = [hospital.area, hospital.city].filter(Boolean);
    if (parts.length > 0) {
      setLocation(parts.join(', '));
    }
  };

  const handleSubmit = () => {
    if (!emergencyType) {
      Alert.alert('Select Type', 'Please select the type of emergency.');
      return;
    }
    if (!hospitalName.trim()) {
      Alert.alert('Location Required', 'Please enter the hospital or location.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please describe the situation.');
      return;
    }
    if (!contactNumber.trim() || contactNumber.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (!contactPreference) {
      Alert.alert('Contact Preference', 'Please select a contact method.');
      return;
    }

    router.push({
      pathname: '/community-request/emergency/review',
      params: { community_id: params.community_id,
        emergencyType,
        hospitalName,
        location: location || 'Auto-detected',
        urgency,
        description,
        contactPreference,
        contactNumber: `${countryCode}${contactNumber}`,
      },
    });
  };
  const handleBack = () => {
    router.replace({
      pathname: '/community-request',
      params: params.community_id ? { community_id: params.community_id } : {}
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [params.community_id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderText}>1. Emergency Help</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.cardContainerWrapper} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.cardContainer}>
          <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" extraScrollHeight={260}>
            
            {/* Inner Header */}
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <View style={styles.iconCircle}>
                <Ionicons name="alert" size={24} color="#E53935" />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>Emergency Help Request</Text>
                <Text style={styles.subtitle}>Fill in the details below</Text>
              </View>
            </View>

            {/* Type of Emergency */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Type of Emergency <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowTypeModal(true)}>
                <Text style={[styles.dropdownButtonText, !emergencyType && styles.placeholderText]}>
                  {emergencyType || 'Select Emergency Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Hospital / Location */}
            <View style={[styles.fieldSection, { zIndex: 10 }]}>
              <Text style={styles.fieldLabel}>Hospital / Location <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={styles.autocompleteWrapper}>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search hospital or location"
                    placeholderTextColor="#999"
                    value={hospitalName}
                    onChangeText={(text) => {
                      setHospitalName(text);
                      setSelectedHospital(null);
                    }}
                  />
                  <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                </View>

                {hospitalName.length >= 1 && !selectedHospital && (
                  <View style={styles.suggestionsCard}>
                    {isHospitalSearching ? (
                      <Text style={styles.suggestionStatus}>Searching locations...</Text>
                    ) : hospitalSuggestions.length > 0 ? (
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        style={{ maxHeight: 200 }}
                      >
                        {hospitalSuggestions.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => handleHospitalSelect(item)}
                          >
                            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={styles.suggestionName}>{item.name}</Text>
                              <Text style={styles.suggestionAddress}>{item.address}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          setSelectedHospital({ name: hospitalName, address: '', area: '', city: '' });
                          setHospitalSuggestions([]);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                        <View style={styles.suggestionTextContainer}>
                          <Text style={styles.suggestionName}>Use "{hospitalName}"</Text>
                          <Text style={styles.suggestionAddress}>Custom location</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              <Text style={styles.helperText}>Start typing to find the hospital</Text>
            </View>

            {/* Urgency Level */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Urgency Level <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={styles.segmentedControl}>
                {URGENCY_OPTIONS.map((item) => {
                  const isSelected = urgency === item;
                  const isUrgent = item === 'Urgent';
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.segmentButton,
                        isSelected && (isUrgent ? styles.segmentButtonSelectedUrgent : styles.segmentButtonSelected)
                      ]}
                      onPress={() => setUrgency(item)}
                    >
                      <Text style={[
                        styles.segmentButtonText,
                        isSelected && (isUrgent ? styles.segmentButtonTextSelectedUrgent : styles.segmentButtonTextSelected)
                      ]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Description <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the situation (required)"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Contact Phone Number */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Contact Phone Number <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity style={styles.countryCodeSelector} activeOpacity={0.7} onPress={() => setShowCountryModal(true)}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <View style={styles.phoneInputDivider} />
                <TextInput
                  style={styles.phoneNumberInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#999"
                  value={contactNumber}
                  onChangeText={(t) => setContactNumber(formatPhoneNumber(t))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Contact Preference */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Contact Preference <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowContactModal(true)}>
                <Text style={[styles.dropdownButtonText, !contactPreference && styles.placeholderText]}>
                  {contactPreference || 'Select contact method'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.bottomDisclaimer}>You will review your request in the next step</Text>

            <View style={{ height: 40 }} />
          </KeyboardAwareScrollView>
        </View>
        {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight : 0 }} />}
      </KeyboardAvoidingView>

      {/* Emergency Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Emergency Type</Text>
            {EMERGENCY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setEmergencyType(type);
                  setShowTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contact Preference Modal */}
      <Modal visible={showContactModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowContactModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Contact Method</Text>
            {CONTACT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  setContactPreference(opt);
                  setShowContactModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Country Code Modal */}
      <Modal visible={showCountryModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            {COUNTRY_CODES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.modalOption}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, countryCode === item.code && { fontWeight: '700', color: '#F25C05' }]}>
                  {item.code} ({item.country})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4EE', // Matching the outer warm tinted background
  },
  topHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  topHeaderText: {
    color: '#F05D17', // Matching exactly the top orange
    fontSize: 16,
    fontWeight: '700',
  },
  cardContainerWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#E53935',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA', // Slight gray tint for input background
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 10,
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 14,
  },
  searchIcon: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentButtonSelected: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButtonSelectedUrgent: {
    backgroundColor: '#FFEBEA',
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  segmentButtonTextSelected: {
    color: '#222',
  },
  segmentButtonTextSelectedUrgent: {
    color: '#E53935',
  },
  continueButton: {
    backgroundColor: '#F25C05', // Exact orange from screenshot
    borderRadius: 45,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomDisclaimer: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 16,
  },
  autocompleteWrapper: { position: 'relative', zIndex: 10 },
  suggestionsCard: {
    position: 'absolute',
    bottom: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F4FF',
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F6F6',
  },
  suggestionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#666',
  },
  suggestionStatus: {
    padding: 16,
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    color: '#222',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
});
