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
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { searchHospitals, createCommunityRequest, parseApiError, reverseGeocode } from '../../src/services/api';
import { ensureForegroundPermission, getCurrentPosition } from '../../src/services/location';
import { LinearGradient } from 'expo-linear-gradient';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Don\'t Know'];
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];
const CONTACT_OPTIONS = ['Phone Call', 'WhatsApp', 'Platform DM'];

export default function BloodRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ community_id?: string }>();
  const insets = useSafeAreaInsets();

  // Form State
  const [bloodGroup, setBloodGroup] = useState('');
  const [location, setLocation] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Urgent');
  const [contactPref, setContactPref] = useState('');

  // UI State
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'blood' | 'contact' | null>(null);

  // Debounced Location Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = location.trim();
      if (query.length >= 2 && !selectedLocation) {
        setIsSearchingLocation(true);
        try {
          const response = await searchHospitals(query);
          setLocationSuggestions(response.data.results || []);
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

  const handleGpsDetect = async () => {
    setIsSearchingLocation(true);
    try {
      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Please grant location permissions to auto-detect your location.');
        return;
      }
      const position = await getCurrentPosition({ accuracy: 3 });
      const { latitude, longitude } = position.coords;
      const response = await reverseGeocode(latitude, longitude);
      const data = response.data;
      if (data && data.display_name) {
        setLocation(data.display_name);
        setSelectedLocation({
          name: data.display_name,
          address: data.display_name,
          area: data.area || '',
          city: data.city || ''
        });
      } else {
        Alert.alert('Detection failed', 'Could not resolve location address.');
      }
    } catch (err: any) {
      console.error('GPS detection failed', err);
      Alert.alert('Detection failed', 'An error occurred while fetching your current position.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const openModal = (type: 'blood' | 'contact') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (modalType === 'blood') setBloodGroup(option);
    if (modalType === 'contact') setContactPref(option);
    setModalVisible(false);
  };

  const handleContinue = async () => {
    if (!bloodGroup) return Alert.alert('Error', 'Please select a blood group');
    if (!location) return Alert.alert('Error', 'Please provide a hospital location');
    if (!unitsNeeded) return Alert.alert('Error', 'Please specify units needed');
    if (!contactPref) return Alert.alert('Error', 'Please select a contact preference');

    router.push({
      pathname: '/community-request/blood/review',
      params: { community_id: params.community_id,
        bloodGroup: bloodGroup,
        hospitalName: location, // Using location as hospital name or vice versa
        location: location,
        urgency: urgency,
        description: `Units Needed: ${unitsNeeded}. ${description}`,
        contactPreference: contactPref,
      }
    });
  };

  const renderModalContent = () => {
    let options: string[] = [];
    let title = '';
    if (modalType === 'blood') { options = BLOOD_GROUPS; title = 'Select Blood Group'; }
    if (modalType === 'contact') { options = CONTACT_OPTIONS; title = 'Contact Preference'; }

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalBar} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingBottom: 30 }}
            numColumns={modalType === 'blood' ? 3 : 1}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  (bloodGroup === item || contactPref === item) && styles.optionItemSelected,
                  modalType === 'blood' && styles.bloodOptionItem
                ]}
                onPress={() => handleSelectOption(item)}
              >
                <Text style={[styles.optionText, (bloodGroup === item || contactPref === item) && styles.optionTextSelected]}>{item}</Text>
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
      <LinearGradient colors={['#FFFDFD', '#F9F9F9']} style={styles.gradientBg} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.topHeaderBack} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#E53935" />
          </TouchableOpacity>
          <Text style={styles.topHeaderText}>Blood Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.cardContainerWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.cardContainer}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <View style={styles.headerBar}>
                <LinearGradient colors={['#FFEBEE', '#FFCDD2']} style={styles.iconCircle}>
                  <FontAwesome5 name="tint" size={26} color="#E53935" />
                </LinearGradient>
                <View style={styles.headerTextCol}>
                  <Text style={styles.title}>Emergency Blood Request</Text>
                  <Text style={styles.subtitle}>Fill in the patient's requirements</Text>
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Blood Group Needed <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('blood')}>
                  <Text style={[styles.dropdownButtonText, !bloodGroup && styles.placeholderText]}>{bloodGroup || 'Select Blood Group'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Hospital Location <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.searchInputContainer}>
                  <TouchableOpacity onPress={handleGpsDetect} style={{ padding: 4 }} disabled={isSearchingLocation}>
                    <Ionicons name="location-sharp" size={18} color="#E53935" style={{ marginRight: 6 }} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search hospital or area"
                    placeholderTextColor="#BBB"
                    value={location}
                    onChangeText={(t) => { setLocation(t); if (selectedLocation) setSelectedLocation(null); }}
                  />
                  {isSearchingLocation ? (
                    <ActivityIndicator size="small" color="#E53935" />
                  ) : location.length > 0 ? (
                    <TouchableOpacity onPress={() => { setLocation(''); setSelectedLocation(null); setLocationSuggestions([]); }} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={18} color="#BBB" />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="search" size={18} color="#BBB" />
                  )}
                </View>
                {location.trim().length >= 2 && !selectedLocation && (
                  <View style={styles.suggestionsContainer}>
                    {isSearchingLocation ? (
                      <Text style={styles.suggestionStatus}>Searching hospitals...</Text>
                    ) : locationSuggestions.length > 0 ? (
                      locationSuggestions.map((item, i) => (
                        <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => handleLocationSelect(item)}>
                          <Ionicons name="navigate-circle-outline" size={20} color="#E53935" style={{ marginRight: 10 }} />
                          <View style={styles.suggestionTextContainer}>
                            <Text style={styles.suggestionName} numberOfLines={1}>{item.name || item.display_name}</Text>
                            {(item.address || item.display_name) && (
                              <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address || item.display_name}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View>
                        <Text style={styles.suggestionStatus}>No hospitals found</Text>
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => handleLocationSelect({ name: location.trim(), address: location.trim(), area: '', city: '' })}
                        >
                          <Ionicons name="navigate-circle-outline" size={20} color="#E53935" style={{ marginRight: 10 }} />
                          <View style={styles.suggestionTextContainer}>
                            <Text style={styles.suggestionName}>Use hospital / location as typed</Text>
                            <Text style={styles.suggestionAddress}>{location.trim()}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Units Needed <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="How many units? (e.g. 2 Units)"
                    placeholderTextColor="#BBB"
                    value={unitsNeeded}
                    onChangeText={setUnitsNeeded}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Additional Details (Optional)</Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Patient name, specific hospital room, etc."
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
                <Text style={styles.fieldLabel}>Contact Preference <Text style={styles.requiredAsterisk}>*</Text></Text>
                <TouchableOpacity style={styles.dropdownButton} activeOpacity={0.7} onPress={() => openModal('contact')}>
                  <Text style={[styles.dropdownButtonText, !contactPref && styles.placeholderText]}>{contactPref || 'Select contact method'}</Text>
                  <Ionicons name="chevron-down" size={18} color="#AAA" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
                <LinearGradient colors={['#E53935', '#C62828']} style={styles.continueGradient}>
                  <Text style={styles.continueButtonText}>Post Blood Request</Text>
                  <Ionicons name="water" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.bottomDisclaimer}>Verified donors will be notified instantly</Text>
              <View style={{ height: Math.max(insets.bottom, 20) }} />
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
  topHeaderText: { color: '#E53935', fontSize: 17, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  cardContainerWrapper: { flex: 1, marginHorizontal: 16, marginTop: 10, marginBottom: 10 },
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
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  suggestionTextContainer: { marginLeft: 12, flex: 1 },
  suggestionName: { fontSize: 14, fontFamily: FONTS.bold, color: '#333' },
  suggestionAddress: { fontSize: 12, fontFamily: FONTS.regular, color: '#999', marginTop: 2 },
  suggestionStatus: { padding: 12, fontSize: 13, color: '#999', textAlign: 'center' },

  inputWrapper: { backgroundColor: '#F9F9FB', borderWidth: 1, borderColor: '#F0F0F3', borderRadius: 16, paddingHorizontal: 18 },
  input: { fontSize: 15, fontFamily: FONTS.regular, color: '#333', paddingVertical: 16 },
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
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: '#111' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F7', justifyContent: 'center', alignItems: 'center' },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12, borderRadius: 16, marginBottom: 8 },
  bloodOptionItem: { width: '30%', margin: '1.5%', justifyContent: 'center' },
  optionItemSelected: { backgroundColor: '#FFEBEE' },
  optionText: { fontSize: 16, color: '#444', fontFamily: FONTS.regular, textAlign: 'center' },
  optionTextSelected: { color: '#E53935', fontFamily: FONTS.bold },
});
