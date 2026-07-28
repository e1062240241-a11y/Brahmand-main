import React, { useState, useEffect } from 'react';
import {View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  BackHandler} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { forwardGeocode, createCommunityRequest, parseApiError } from '../../src/services/api';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore } from '../../src/store/vendorStore';

const { width } = Dimensions.get('window');
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];
const HELP_TYPES = [
  'Rescue Needed',
  'Food Required',
  'Medical Treatment',
  'Adoption Help',
  'Shelter Required',
  'Emergency Care',
  'Lost Animal',
  'Animal Abuse Concern',
  'Volunteer Needed',
  'Other Support'
];
const ANIMAL_TYPES = [
  'Dog',
  'Cat',
  'Cow',
  'Bird',
  'Monkey',
  'Street Animal',
  'Injured Animal',
  'Abandoned Pet',
  'Other Animal'
];
const CONTACT_OPTIONS = ['Phone Call', 'WhatsApp', 'Platform DM'];
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

export default function AnimalCareRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ community_id?: string }>();
  const { user } = useAuthStore();
  const { myVendor } = useVendorStore();

  const isKycVerified =
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified';

  useEffect(() => {
    if (!isKycVerified) {
      router.replace({
        pathname: '/kyc',
        params: { returnUrl: '/community-request' }
      });
    }
  }, [isKycVerified]);
  
  // Form State
  const [helpType, setHelpType] = useState('');
  const [animalType, setAnimalType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Urgent');
  const [contactPref, setContactPref] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ? formatPhoneNumber(user.phone) : '');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'help' | 'animal' | 'contact' | 'country' | null>(null);

  const openModal = (type: 'help' | 'animal' | 'contact' | 'country') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (modalType === 'help') setHelpType(option);
    if (modalType === 'animal') setAnimalType(option);
    if (modalType === 'contact') setContactPref(option);
    if (modalType === 'country') setCountryCode(option.split(' ')[0]);
    setModalVisible(false);
  };

  const handleContinue = async () => {
    if (!helpType) return Alert.alert('Error', 'Please select the type of help needed');
    if (!animalType) return Alert.alert('Error', 'Please select animal type');
    if (!location) return Alert.alert('Error', 'Please provide a location');
    if (!description.trim()) return Alert.alert('Error', 'Please describe the situation');
    if (!phoneNumber.trim() || phoneNumber.length < 10) return Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
    if (!contactPref) return Alert.alert('Error', 'Please select a contact preference');

    setIsSubmitting(true);
    try {
      await createCommunityRequest({
        community_id: params.community_id,
        request_type: 'help',
        title: `Animal Care: ${animalType} - ${helpType}`,
        description: description,
        contact_number: `${countryCode}${phoneNumber.trim()}`,
        urgency_level: (urgency === 'Urgent' ? 'critical' : urgency.toLowerCase()) as any,
        location: location,
        support_needed: 'Animal Care',
      });

      Alert.alert('Success', 'Request posted!', [{
        text: 'OK',
        onPress: () => {
          router.replace({
            pathname: '/community-request',
            params: params.community_id ? { community_id: params.community_id } : {}
          });
        }
      }]);
    } catch (error: any) {
      Alert.alert('Error', parseApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModalContent = () => {
    let options: string[] = [];
    let title = '';
    if (modalType === 'help') { options = HELP_TYPES; title = 'Select Type of Help'; }
    if (modalType === 'animal') { options = ANIMAL_TYPES; title = 'Select Animal Type'; }
    if (modalType === 'contact') { options = CONTACT_OPTIONS; title = 'Contact Preference'; }
    if (modalType === 'country') { options = COUNTRY_CODES.map(c => `${c.code} ${c.country}`); title = 'Select Country Code'; }

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalBar} />
          <View style={styles.modalHeaderOrange}>
            <Text style={styles.modalTitleWhite}>{title}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtnWhite}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.optionItem, (helpType === item || animalType === item || contactPref === item) && styles.optionItemSelected]} 
                onPress={() => handleSelectOption(item)}
              >
                <Text style={[styles.optionText, (helpType === item || animalType === item || contactPref === item) && styles.optionTextSelected]}>{item}</Text>
                {(helpType === item || animalType === item || contactPref === item) && (
                  <Ionicons name="checkmark-circle" size={22} color="#F25C05" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
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
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#FDFBFB', '#EBEDEE']} style={styles.gradientBg} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.topHeaderBack} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#F25C05" />
          </TouchableOpacity>
          <Text style={styles.topHeaderText}>Animal Care / Rescue</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={styles.cardContainerWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.cardContainer}>
            <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <View style={styles.headerBar}>
                <LinearGradient colors={['#FFF3E0', '#FFE0B2']} style={styles.iconCircle}>
                  <Ionicons name="paw" size={28} color="#EF6C00" />
                </LinearGradient>
                <View style={styles.headerTextCol}>
                  <Text style={styles.title}>Request Details</Text>
                  <Text style={styles.subtitle}>Fill in every small detail below</Text>
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Type of Help <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('help')}>
                  <Text style={[styles.dropdownButtonText, !helpType && styles.placeholderText]}>{helpType || 'Select Type of Help'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Animal Type <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('animal')}>
                  <Text style={[styles.dropdownButtonText, !animalType && styles.placeholderText]}>{animalType || 'Select Animal Type'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Location <Text style={styles.requiredAsterisk}>*</Text></Text>
                <AutocompleteInput
                  placeholder="Search area or location"
                  placeholderTextColor="#BBB"
                  value={location}
                  onChangeText={(t) => { setLocation(t); if (selectedLocation) setSelectedLocation(null); }}
                  onSelect={(item) => {
                    const name = item.isCustom ? item.name : item.label;
                    setLocation(name);
                    setSelectedLocation(item);
                  }}
                  onSearch={async (query) => {
                    const response = await forwardGeocode(query);
                    const results = response.data || [];
                    if (query.trim()) {
                      results.push({
                        display_name: `Use "${query}" as typed`,
                        name: query,
                        value: query,
                        label: `Use "${query}" as typed`,
                        isCustom: true
                      });
                    }
                    return results;
                  }}
                  minimumQueryLength={1}
                  inputContainerStyle={styles.searchInputContainer}
                  inputStyle={styles.searchInput}
                  dropdownStyle={styles.suggestionsContainer}
                  itemStyle={styles.suggestionItem}
                  itemTextStyle={styles.suggestionText}
                  iconName="location-sharp"
                  iconColor="#EF6C00"
                  showChevron={false}
                />
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Description <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe the situation"
                    placeholderTextColor="#BBB"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Urgency Level <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.segmentedControl}>
                  {URGENCY_LEVELS.map((item) => (
                    <TouchableOpacity key={item} style={[styles.segmentButton, urgency === item && (item === 'Urgent' ? styles.segmentButtonSelectedUrgent : styles.segmentButtonSelected)]} onPress={() => setUrgency(item)}>
                      <Text style={[styles.segmentButtonText, urgency === item && (item === 'Urgent' ? styles.segmentButtonTextSelectedUrgent : styles.segmentButtonTextSelected)]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Contact Phone Number <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity style={styles.countryCodeSelector} activeOpacity={0.7} onPress={() => openModal('country')}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  <View style={styles.phoneInputDivider} />
                  <TextInput
                    style={styles.phoneNumberInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#BBB"
                    value={phoneNumber}
                    onChangeText={(t) => setPhoneNumber(formatPhoneNumber(t))}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Contact Preference <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('contact')}>
                  <Text style={[styles.dropdownButtonText, !contactPref && styles.placeholderText]}>{contactPref || 'Select contact method'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.continueButton, isSubmitting && { opacity: 0.7 }]} onPress={handleContinue} disabled={isSubmitting}>
                <LinearGradient colors={['#F25C05', '#D35400']} style={styles.continueGradient}>
                  {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <Text style={styles.continueButtonText}>Post Request</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <Text style={styles.bottomDisclaimer}>Your request will be visible to nearby volunteers</Text>
              <View style={{ height: 40 }} />
            </KeyboardAwareScrollView>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={modalVisible} transparent animationType="slide">
          {renderModalContent()}
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  gradientBg: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  topHeader: { 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 14, 
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(0,0,0,0.03)' 
  },
  topHeaderBack: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderText: { color: '#F25C05', fontSize: 17, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  cardContainerWrapper: { flex: 1, marginHorizontal: 16, marginTop: 10, marginBottom: 20 },
  cardContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 30, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 5,
    overflow: 'hidden'
  },
  content: { padding: 24 },
  headerBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 54, height: 54, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: 14 },
  headerTextCol: { flex: 1 },
  title: { fontSize: 20, fontFamily: FONTS.bold, color: '#111' },
  subtitle: { fontSize: 13, fontFamily: FONTS.regular, color: '#999', marginTop: 2 },
  
  fieldSection: { marginBottom: 22 },
  fieldLabel: { fontSize: 14, fontFamily: FONTS.bold, color: '#333', marginBottom: 10, marginLeft: 4 },
  requiredAsterisk: { color: '#FF5252' },
  
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9FB', borderWidth: 1, borderColor: '#F0F0F3', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16 },
  dropdownButtonText: { fontSize: 15, fontFamily: FONTS.regular, color: '#333' },
  placeholderText: { color: '#BBB' },
  
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB', borderWidth: 1, borderColor: '#F0F0F3', borderRadius: 16, paddingHorizontal: 18 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: FONTS.regular, color: '#333', paddingVertical: 16 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9FB', borderWidth: 1, borderColor: '#F0F0F3', borderRadius: 16, paddingHorizontal: 14, height: 54 },
  countryCodeSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 10 },
  countryCodeText: { fontSize: 15, fontFamily: FONTS.bold, color: '#333' },
  phoneInputDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0', marginHorizontal: 10 },
  phoneNumberInput: { flex: 1, fontSize: 15, fontFamily: FONTS.regular, color: '#333', paddingVertical: 10 },
  suggestionsContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F3', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  suggestionText: { marginLeft: 10, fontSize: 14, color: '#444', flex: 1 },
  
  textAreaWrapper: { backgroundColor: '#F9F9FB', borderWidth: 1, borderColor: '#F0F0F3', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 },
  textArea: { minHeight: 100, fontSize: 15, color: '#333', textAlignVertical: 'top' },
  
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F0F0F3', borderRadius: 16, padding: 5 },
  segmentButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  segmentButtonSelected: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segmentButtonSelectedUrgent: { backgroundColor: '#FFEBEE' },
  segmentButtonText: { fontSize: 13, fontFamily: FONTS.bold, color: '#777' },
  segmentButtonTextSelected: { color: '#111' },
  segmentButtonTextSelectedUrgent: { color: '#FF5252' },
  
  continueButton: { marginTop: 10, borderRadius: 45, overflow: 'hidden' },
  continueGradient: { flexDirection: 'row', paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontFamily: FONTS.bold },
  bottomDisclaimer: { textAlign: 'center', color: '#BBB', fontSize: 12, marginTop: 18, fontFamily: FONTS.regular },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalBar: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalHeaderOrange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, backgroundColor: '#F25C05', padding: 12, borderRadius: 8 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: '#111' },
  modalTitleWhite: { fontSize: 18, fontFamily: FONTS.bold, color: '#FFF' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F7', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtnWhite: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12, borderRadius: 16, marginBottom: 8 },
  optionItemSelected: { backgroundColor: '#FFF4EE' },
  optionText: { fontSize: 16, color: '#444', fontFamily: FONTS.regular },
  optionTextSelected: { color: '#F25C05', fontFamily: FONTS.bold },
});
