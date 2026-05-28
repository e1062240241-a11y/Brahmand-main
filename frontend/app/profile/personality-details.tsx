import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePersonalityStore } from '../../src/store/personalityStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function PersonalityDetailsScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { data, updateData } = usePersonalityStore();

  const [formData, setFormData] = useState({
    fullName: data.fullName,
    dob: data.dob,
    gender: data.gender,
    mobile: data.mobile,
    email: data.email,
    city: data.city,
  });

  const [errors, setErrors] = useState<any>({});
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dateParts, setDateParts] = useState({
    day: data.dob ? data.dob.split(' ')[0] : '01',
    month: data.dob ? data.dob.split(' ')[1] : 'January',
    year: data.dob ? data.dob.split(' ')[2] : '2000',
  });

  // Sync with store if data hydrates after mount
  React.useEffect(() => {
    if (data.fullName && !formData.fullName) {
      setFormData({
        fullName: data.fullName,
        dob: data.dob,
        gender: data.gender,
        mobile: data.mobile,
        email: data.email,
        city: data.city,
      });
      if (data.dob) {
        const parts = data.dob.split(' ');
        setDateParts({ day: parts[0], month: parts[1], year: parts[2] });
      }
    }
  }, [data]);

  const handleBack = () => {
    router.back();
  };

  const handleDateConfirm = () => {
    setFormData({ ...formData, dob: `${dateParts.day} ${dateParts.month} ${dateParts.year}` });
    setShowDatePicker(false);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.fullName) newErrors.fullName = 'Required';
    if (!formData.dob) newErrors.dob = 'Required';
    if (!formData.gender) newErrors.gender = 'Required';
    if (!formData.mobile) newErrors.mobile = 'Required';
    if (!formData.city) newErrors.city = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      updateData(formData);
      router.push('/profile/personality-background');
    }
  };

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const cityOptions = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];
  
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 80 }, (_, i) => (2010 - i).toString());

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.mainTitle}>Personal Details</Text>
            <Text style={styles.subtitle}>Please enter your personal information.</Text>

            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, errors.fullName && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    value={formData.fullName}
                    onChangeText={(val) => setFormData({ ...formData, fullName: val })}
                  />
                </View>
              </View>

              {/* Date of Birth */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.inputWrapper, errors.dob && styles.inputError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.inputText, !formData.dob && styles.placeholderText]}>
                    {formData.dob || 'Select date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#2D2D2D" />
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.inputWrapper, errors.gender && styles.inputError]}
                  onPress={() => setShowGenderPicker(true)}
                >
                  <Text style={[styles.inputText, !formData.gender && styles.placeholderText]}>
                    {formData.gender || 'Select gender'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#2D2D2D" />
                </TouchableOpacity>
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, errors.mobile && styles.inputError]}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter your mobile number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={formData.mobile}
                    onChangeText={(val) => setFormData({ ...formData, mobile: val })}
                  />
                </View>
              </View>

              {/* Email ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email ID (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email id"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(val) => setFormData({ ...formData, email: val })}
                  />
                </View>
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.inputWrapper, errors.city && styles.inputError]}
                  onPress={() => setShowCityPicker(true)}
                >
                  <Text style={[styles.inputText, !formData.city && styles.placeholderText]}>
                    {formData.city || 'Select your city'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#2D2D2D" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#2D2D2D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <FlatList
                  data={days}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setDateParts({ ...dateParts, day: item })}>
                      <Text style={[styles.pickerItem, dateParts.day === item && styles.pickerItemActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={i => i}
                />
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <FlatList
                  data={months}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setDateParts({ ...dateParts, month: item })}>
                      <Text style={[styles.pickerItem, dateParts.month === item && styles.pickerItemActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={i => i}
                />
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <FlatList
                  data={years}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setDateParts({ ...dateParts, year: item })}>
                      <Text style={[styles.pickerItem, dateParts.year === item && styles.pickerItemActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={i => i}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleDateConfirm}>
              <Text style={styles.modalConfirmButtonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender Picker Modal */}
      <SelectionModal 
        visible={showGenderPicker} 
        onClose={() => setShowGenderPicker(false)} 
        options={genderOptions}
        onSelect={(val: string) => setFormData({ ...formData, gender: val })}
        title="Select Gender"
      />

      {/* City Picker Modal */}
      <SelectionModal 
        visible={showCityPicker} 
        onClose={() => setShowCityPicker(false)} 
        options={cityOptions}
        onSelect={(val: string) => setFormData({ ...formData, city: val })}
        title="Select City"
      />
    </View>
  );
}

const SelectionModal = ({ visible, onClose, options, onSelect, title }: any) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#2D2D2D" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3D1C10',
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    marginBottom: 32,
    fontFamily: 'Inter_400Regular',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  required: {
    color: '#FF6600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8E0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  inputError: {
    borderColor: '#FF4B4B',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#2D2D2D',
    fontFamily: 'Inter_400Regular',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
    fontFamily: 'Inter_400Regular',
  },
  placeholderText: {
    color: '#999',
  },
  countryCode: {
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#F0E8E0',
    justifyContent: 'center',
    height: '60%',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  continueButton: {
    backgroundColor: '#FF6600',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  optionItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter_400Regular',
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 250,
    paddingHorizontal: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
  },
  pickerItemActive: {
    color: '#FF6600',
    fontWeight: '800',
    backgroundColor: '#FFF1E8',
    borderRadius: 8,
  },
  modalConfirmButton: {
    backgroundColor: '#FF6600',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
});
