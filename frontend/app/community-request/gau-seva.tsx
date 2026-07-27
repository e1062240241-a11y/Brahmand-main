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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  'Cow Feeding Support',
  'Injured Cow Help',
  'Stray Animal Feeding',
  'Animal Rescue Support',
  'Veterinary Assistance',
  'Cow Shelter Support',
  'Animal Transportation Help',
  'Water / Fodder Support',
  'Temple Cow Seva',
  'Adoption Assistance',
  'Other Animal Care Support'
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

export default function GauSevaRequestScreen() {
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
        pathname: '/kyc-submit',
        params: { returnUrl: '/community-request' }
      });
    }
  }, [isKycVerified]);
  
  // Form State
  const [helpType, setHelpType] = useState('');
  const [location, setLocation] = useState('');
  const [animalsInvolved, setAnimalsInvolved] = useState('');
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
  const [modalType, setModalType] = useState<'help' | 'contact' | 'country' | null>(null);

  const openModal = (type: 'help' | 'contact' | 'country') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (modalType === 'help') setHelpType(option);
    if (modalType === 'contact') setContactPref(option);
    if (modalType === 'country') setCountryCode(option.split(' ')[0]);
    setModalVisible(false);
  };

  const handleContinue = async () => {
    if (!helpType) return Alert.alert('Error', 'Please select the type of help needed');
    if (!location) return Alert.alert('Error', 'Please provide a location');
    if (!animalsInvolved) return Alert.alert('Error', 'Please enter number of animals involved');
    if (!description.trim()) return Alert.alert('Error', 'Please describe the situation');
    if (!phoneNumber.trim() || phoneNumber.length < 10) return Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
    if (!contactPref) return Alert.alert('Error', 'Please select a contact preference');

    setIsSubmitting(true);
    try {
      await createCommunityRequest({
        community_id: params.community_id,
        request_type: 'help',
        title: `Gau Seva: ${helpType}`,
        description: `${description}\nAnimals involved: ${animalsInvolved}`,
        contact_number: `${countryCode}${phoneNumber.trim()}`,
        urgency_level: (urgency === 'Urgent' ? 'critical' : urgency.toLowerCase()) as any,
        location: location,
        support_needed: 'Animal Care',
      });

      Alert.alert('Success', 'Gau Seva request posted!', [{
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
                style={[styles.optionItem, (helpType === item || contactPref === item) && styles.optionItemSelected]} 
                onPress={() => handleSelectOption(item)}
              >
                <Text style={[styles.optionText, (helpType === item || contactPref === item) && styles.optionTextSelected]}>{item}</Text>
                {(helpType === item || contactPref === item) && (
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
          <TouchableOpacity style={styles.topHeaderBack} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#10B981" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.topHeaderText}>Gau Seva & Animal Care</Text>
            <Text style={styles.topHeaderSubtext}>Community Support</Text>
          </View>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="cow" size={14} color="#10B981" />
            <Text style={styles.headerBadgeText}>Gau Seva</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={styles.cardContainerWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.cardContainer}>
            <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <View style={styles.headerBar}>
                <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.iconCircle}>
                  <MaterialCommunityIcons name="cow" size={28} color="#43A047" />
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
                  iconColor="#43A047"
                  showChevron={false}
                />
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Animals Involved <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter number of animals"
                    placeholderTextColor="#BBB"
                    value={animalsInvolved}
                    onChangeText={setAnimalsInvolved}
                    keyboardType="numeric"
                  />
                </View>
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
    paddingVertical: 12, 
    paddingHorizontal: 16,
  },
  topHeaderBack: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  topHeaderText: { color: '#1A1A1E', fontSize: 17, fontFamily: FONTS.bold },
  topHeaderSubtext: { color: '#8E8E93', fontSize: 12, fontFamily: FONTS.regular, marginTop: 1 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: '#10B981', marginLeft: 4 },
  cardContainerWrapper: { flex: 1, marginHorizontal: 16, marginTop: 6, marginBottom: 16 },
  cardContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 16, 
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  content: { padding: 20 },
  headerBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  headerTextCol: { flex: 1 },
  title: { fontSize: 19, fontFamily: FONTS.bold, color: '#1A1A1E' },
  subtitle: { fontSize: 13, fontFamily: FONTS.regular, color: '#8E8E93', marginTop: 2 },
  
  fieldSection: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontFamily: FONTS.bold, color: '#2C2C2E' },
  requiredAsterisk: { color: '#FF3B30' },
  
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 16, height: 52 },
  dropdownButtonText: { fontSize: 15, fontFamily: FONTS.regular, color: '#1C1C1E' },
  placeholderText: { color: '#A0A0AB' },
  
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 16, height: 52 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: FONTS.regular, color: '#1C1C1E' },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 12, height: 52 },
  countryCodeSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E8ECF4' },
  countryCodeText: { fontSize: 14, fontFamily: FONTS.bold, color: '#1C1C1E' },
  phoneInputDivider: { width: 1, height: 22, backgroundColor: '#E0E0E0', marginHorizontal: 10 },
  phoneNumberInput: { flex: 1, fontSize: 15, fontFamily: FONTS.regular, color: '#1C1C1E', paddingVertical: 10 },
  suggestionsContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8ECF4', marginTop: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  suggestionText: { marginLeft: 10, fontSize: 14, color: '#3C3C43', flex: 1 },
  
  inputWrapper: { backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 16 },
  input: { fontSize: 15, fontFamily: FONTS.regular, color: '#1C1C1E', paddingVertical: 14 },
  textAreaWrapper: { backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  textArea: { minHeight: 84, fontSize: 15, color: '#1C1C1E', textAlignVertical: 'top', fontFamily: FONTS.regular },
  
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F0F2F7', borderRadius: 14, padding: 4 },
  segmentButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentButtonSelected: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segmentButtonSelectedUrgent: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  segmentButtonText: { fontSize: 13, fontFamily: FONTS.bold, color: '#8E8E93' },
  segmentButtonTextSelected: { color: '#1C1C1E' },
  segmentButtonTextSelectedUrgent: { color: '#D32F2F' },
  
  continueButton: { marginTop: 12, borderRadius: 28, overflow: 'hidden', shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  continueGradient: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
  disclaimerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  bottomDisclaimer: { color: '#8E8E93', fontSize: 12, fontFamily: FONTS.regular },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '72%', shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20 },
  modalBar: { width: 36, height: 4, backgroundColor: '#D1D1D6', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeaderOrange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  modalTitleWhite: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFF' },
  modalCloseBtnWhite: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  optionItemSelected: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  optionText: { fontSize: 15, color: '#2C2C2E', fontFamily: FONTS.regular },
  optionTextSelected: { color: '#10B981', fontFamily: FONTS.bold },
});
