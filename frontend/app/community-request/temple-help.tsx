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
  BackHandler,
  Keyboard,
  ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { forwardGeocode, createCommunityRequest, parseApiError } from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore } from '../../src/store/vendorStore';

const { width } = Dimensions.get('window');
const HELP_TYPES = [
  'Temple Event Volunteers',
  'Festival Volunteers',
  'Food Seva Volunteers',
  'Temple Cleaning Seva',
  'Crowd Management Help',
  'Donation Distribution',
  'Decoration / Setup Help',
  'Bhajan / Spiritual Event Support',
  'Emergency Temple Support',
  'Technical / Media Support',
  'Security Volunteers',
  'Other Temple Support'
];
const VOLUNTEER_OPTIONS = ['1-5', '5-10', '10-50', '50+'];
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

export default function TempleHelpRequestScreen() {
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
  const [templeLocation, setTempleLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState('');
  const [description, setDescription] = useState('');
  const [contactPref, setContactPref] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ? formatPhoneNumber(user.phone) : '');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'help' | 'volunteers' | 'contact' | 'country' | null>(null);

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

  // Debounced Location Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (templeLocation.length >= 1 && !selectedLocation) {
        setIsSearchingLocation(true);
        try {
          const response = await forwardGeocode(templeLocation);
          setLocationSuggestions(response.data || []);
        } catch (error) {
          console.warn('Location search failed', error);
        } finally {
          setIsSearchingLocation(false);
        }
      } else {
        setLocationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [templeLocation, selectedLocation]);

  const handleLocationSelect = (item: any) => {
    const name = item.display_name || item.formatted_address || item.name;
    setTempleLocation(name);
    setSelectedLocation(item);
    setLocationSuggestions([]);
  };

  const openModal = (type: 'help' | 'volunteers' | 'contact' | 'country') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (modalType === 'help') setHelpType(option);
    if (modalType === 'volunteers') setVolunteersNeeded(option);
    if (modalType === 'contact') setContactPref(option);
    if (modalType === 'country') setCountryCode(option.split(' ')[0]);
    setModalVisible(false);
  };

  const handleContinue = async () => {
    if (!helpType) return Alert.alert('Error', 'Please select the type of help needed');
    if (!templeLocation) return Alert.alert('Error', 'Please provide a temple location');
    if (!volunteersNeeded) return Alert.alert('Error', 'Please specify number of volunteers needed');
    if (!description.trim()) return Alert.alert('Error', 'Please describe the help needed');
    if (!phoneNumber.trim() || phoneNumber.length < 10) return Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
    if (!contactPref) return Alert.alert('Error', 'Please select a contact preference');

    setIsSubmitting(true);
    try {
      await createCommunityRequest({
        community_id: params.community_id,
        request_type: 'help',
        title: `Temple Help: ${helpType}`,
        description: `${description}\nVolunteers needed: ${volunteersNeeded}\nDate/Time: ${dateTime}`,
        contact_number: `${countryCode}${phoneNumber.trim()}`,
        urgency_level: 'medium',
        location: templeLocation,
        support_needed: 'Volunteer',
      });

      Alert.alert('Success', 'Temple help request posted!', [{
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
    if (modalType === 'volunteers') { options = VOLUNTEER_OPTIONS; title = 'Volunteers Needed'; }
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
                style={[styles.optionItem, (helpType === item || volunteersNeeded === item || contactPref === item) && styles.optionItemSelected]} 
                onPress={() => handleSelectOption(item)}
              >
                <Text style={[styles.optionText, (helpType === item || volunteersNeeded === item || contactPref === item) && styles.optionTextSelected]}>{item}</Text>
                {(helpType === item || volunteersNeeded === item || contactPref === item) && (
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
            <Ionicons name="chevron-back" size={22} color="#D97706" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.topHeaderText}>Temple & Volunteer Help</Text>
            <Text style={styles.topHeaderSubtext}>Seva Support</Text>
          </View>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="temple-hindu" size={14} color="#D97706" />
            <Text style={styles.headerBadgeText}>Temple</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={styles.cardContainerWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.cardContainer}>
            <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" extraScrollHeight={260}>
              
              <View style={styles.bannerContainer}>
                <View style={styles.headerBar}>
                  <LinearGradient colors={['#FFF3E0', '#FFE0B2']} style={styles.iconCircle}>
                    <MaterialCommunityIcons name="temple-hindu" size={28} color="#FB8C00" />
                  </LinearGradient>
                  <View style={styles.headerTextCol}>
                    <Text style={styles.title}>Request Details</Text>
                    <Text style={styles.subtitle}>Fill in every small detail below</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Type of Help <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('help')}>
                  <Text style={[styles.dropdownButtonText, !helpType && styles.placeholderText]}>{helpType || 'Select Type of Help'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldSection, { zIndex: 10 }]}>
                <Text style={styles.fieldLabel}>Temple / Location <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.autocompleteWrapper}>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="location-sharp" size={18} color="#FB8C00" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search temple or location"
                      placeholderTextColor="#BBB"
                      value={templeLocation}
                      onChangeText={(t) => { setTempleLocation(t); if (selectedLocation) setSelectedLocation(null); }}
                    />
                    {isSearchingLocation ? <ActivityIndicator size="small" color="#FB8C00" /> : <Ionicons name="search" size={18} color="#BBB" />}
                  </View>

                  {locationSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        style={{ maxHeight: 200 }}
                      >
                        {locationSuggestions.map((item, index) => (
                          <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleLocationSelect(item)}>
                            <Ionicons name="navigate-circle-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                            <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name || item.formatted_address}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Date / Time (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Next Sunday, 10 AM"
                    placeholderTextColor="#BBB"
                    value={dateTime}
                    onChangeText={setDateTime}
                  />
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>No. of Volunteers Needed <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('volunteers')}>
                  <Text style={[styles.dropdownButtonText, !volunteersNeeded && styles.placeholderText]}>{volunteersNeeded || 'Select number'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Description <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe the help needed"
                    placeholderTextColor="#BBB"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
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
              
              <Text style={styles.bottomDisclaimer}>Volunteers will contact you for details</Text>
              <View style={{ height: 40 }} />
            </KeyboardAwareScrollView>
          </View>
          {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight : 0 }} />}
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
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  headerBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: '#D97706', marginLeft: 4 },
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
  headerBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  bannerContainer: { backgroundColor: '#FFFDF9', borderRadius: 18, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFF3E0' },
  iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
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
  autocompleteWrapper: { position: 'relative', zIndex: 10 },
  suggestionsContainer: { position: 'absolute', bottom: 58, left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E8ECF4', maxHeight: 200, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  suggestionText: { marginLeft: 10, fontSize: 14, color: '#3C3C43', flex: 1 },
  
  inputWrapper: { backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 16 },
  input: { fontSize: 15, fontFamily: FONTS.regular, color: '#1C1C1E', paddingVertical: 14 },
  textAreaWrapper: { backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#E8ECF4', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  textArea: { minHeight: 84, fontSize: 15, color: '#1C1C1E', textAlignVertical: 'top', fontFamily: FONTS.regular },
  
  continueButton: { marginTop: 12, borderRadius: 28, overflow: 'hidden', shadowColor: '#D97706', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  continueGradient: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
  disclaimerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  bottomDisclaimer: { color: '#8E8E93', fontSize: 12, fontFamily: FONTS.regular },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '72%', shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20 },
  modalBar: { width: 36, height: 4, backgroundColor: '#D1D1D6', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeaderOrange: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, backgroundColor: '#D97706', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  modalTitleWhite: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFF' },
  modalCloseBtnWhite: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  optionItemSelected: { backgroundColor: '#FFF8E1', borderColor: '#FFECB3' },
  optionText: { fontSize: 15, color: '#2C2C2E', fontFamily: FONTS.regular },
  optionTextSelected: { color: '#D97706', fontFamily: FONTS.bold },
});
