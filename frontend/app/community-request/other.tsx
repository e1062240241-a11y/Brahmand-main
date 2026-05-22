import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { forwardGeocode, createCommunityRequest, parseApiError } from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];
const HELP_TYPES = [
  'Community Assistance',
  'Local Area Support',
  'Volunteer Needed',
  'Awareness Request',
  'Donation Support',
  'Educational Help',
  'Spiritual Guidance',
  'Family Support',
  'Community Coordination',
  'Travel Assistance',
  'Temporary Shelter',
  'Miscellaneous Help'
];
const CONTACT_OPTIONS = ['Phone Call', 'WhatsApp', 'Platform DM'];

export default function OtherRequestScreen() {
  const router = useRouter();
  
  // Form State
  const [helpType, setHelpType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Urgent');
  const [contactPref, setContactPref] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'help' | 'contact' | null>(null);

  // Debounced Location Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (location.length >= 3 && !selectedLocation) {
        setIsSearchingLocation(true);
        try {
          const response = await forwardGeocode(location);
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
  }, [location, selectedLocation]);

  const handleLocationSelect = (item: any) => {
    const name = item.display_name || item.formatted_address || item.name;
    setLocation(name);
    setSelectedLocation(item);
    setLocationSuggestions([]);
  };

  const openModal = (type: 'help' | 'contact') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (modalType === 'help') setHelpType(option);
    if (modalType === 'contact') setContactPref(option);
    setModalVisible(false);
  };

  const handleContinue = async () => {
    if (!helpType) return Alert.alert('Error', 'Please select or enter type of help');
    if (!location) return Alert.alert('Error', 'Please provide a location');
    if (!description.trim()) return Alert.alert('Error', 'Please describe the help you need');
    if (!phoneNumber.trim()) return Alert.alert('Error', 'Please enter your contact number');
    if (!contactPref) return Alert.alert('Error', 'Please select a contact preference');

    setIsSubmitting(true);
    try {
      await createCommunityRequest({
        request_type: 'help',
        title: `Community Request: ${helpType}`,
        description: description,
        contact_number: phoneNumber.trim(),
        urgency_level: (urgency === 'Urgent' ? 'critical' : urgency.toLowerCase()) as any,
        location: location,
        support_needed: 'General',
      });

      Alert.alert('Success', 'Request posted!', [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }]);
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

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalBar} />
          <View style={styles.modalBar} />
          <View style={styles.modalHeaderOrange}>
            <Text style={styles.modalTitleWhite}>Dropdown Options</Text>
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
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/community-request');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#FDFBFB', '#EBEDEE']} style={styles.gradientBg} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.topHeaderBack} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#F25C05" />
          </TouchableOpacity>
          <Text style={styles.topHeaderText}>Other Community Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={styles.cardContainerWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.cardContainer}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <View style={styles.headerBar}>
                <LinearGradient colors={['#E0F2F1', '#B2DFDB']} style={styles.iconCircle}>
                  <Ionicons name="ellipsis-horizontal-circle" size={28} color="#00796B" />
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
                <View style={styles.searchInputContainer}>
                  <Ionicons name="location-sharp" size={18} color="#00796B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search area or location"
                    placeholderTextColor="#BBB"
                    value={location}
                    onChangeText={(t) => { setLocation(t); if (selectedLocation) setSelectedLocation(null); }}
                  />
                  {isSearchingLocation ? <ActivityIndicator size="small" color="#00796B" /> : <Ionicons name="search" size={18} color="#BBB" />}
                </View>
                {locationSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {locationSuggestions.map((item, i) => (
                      <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => handleLocationSelect(item)}>
                        <Ionicons name="navigate-circle-outline" size={20} color="#666" />
                        <Text style={styles.suggestionText} numberOfLines={1}>{item.display_name || item.formatted_address}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Description <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe the help you need"
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
                <View style={styles.searchInputContainer}>
                  <Ionicons name="call" size={18} color="#00796B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter mobile number (e.g. +919876543210)"
                    placeholderTextColor="#BBB"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={15}
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
              
              <Text style={styles.bottomDisclaimer}>Community members will reach out to help</Text>
              <View style={{ height: 40 }} />
            </ScrollView>
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
  
  continueButton: { marginTop: 10, borderRadius: 18, overflow: 'hidden' },
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
