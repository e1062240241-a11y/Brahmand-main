import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface VendorRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const VendorRegistrationModal: React.FC<VendorRegistrationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');

  const resetForm = () => {
    setBusinessName('');
    setOwnerName('');
    setPhoneNumber('');
    setYearsInBusiness('');
    setAddress('');
    setCategories([]);
    setCategoryInput('');
  };

  const handleSubmit = async () => {
    console.log('🔵 Submit button pressed');
    
    Keyboard.dismiss();
    
    const trimmedBusinessName = businessName.trim();
    const trimmedOwnerName = ownerName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();

    console.log('Form Data:', {
      businessName: trimmedBusinessName,
      ownerName: trimmedOwnerName,
      phone: trimmedPhone,
      years: yearsInBusiness,
      address: trimmedAddress,
    });

    // Regex patterns
    const businessNameRegex = /^[a-zA-Z0-9\s&.,'-\/]{2,50}$/;
    const ownerNameRegex = /^[a-zA-Z\s.'-]{2,50}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const yearsRegex = /^(0|[1-9]\d?)$/;
    const addressRegex = /^[a-zA-Z0-9\s.,'#\-\/()]{5,150}$/;

    // Validation
    if (!trimmedBusinessName) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    if (!businessNameRegex.test(trimmedBusinessName)) {
      Alert.alert('Error', 'Business name must be 2 to 50 characters and can only contain letters, numbers, spaces, and standard punctuation (& . , \' - /)');
      return;
    }

    if (!trimmedOwnerName) {
      Alert.alert('Error', 'Owner name is required');
      return;
    }
    if (!ownerNameRegex.test(trimmedOwnerName)) {
      Alert.alert('Error', 'Owner name must be 2 to 50 characters and contain only letters, spaces, dots, and hyphens');
      return;
    }

    if (!trimmedPhone) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!phoneRegex.test(trimmedPhone)) {
      Alert.alert('Error', 'Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    if (!yearsInBusiness) {
      Alert.alert('Error', 'Years in business is required');
      return;
    }
    if (!yearsRegex.test(yearsInBusiness)) {
      Alert.alert('Error', 'Years in business must be a valid number between 0 and 99');
      return;
    }

    if (!trimmedAddress) {
      Alert.alert('Error', 'Address is required');
      return;
    }
    if (!addressRegex.test(trimmedAddress)) {
      Alert.alert('Error', 'Address must be between 5 and 150 characters and can only contain letters, numbers, spaces, and basic symbols (.,\'#-/())');
      return;
    }

    console.log('Validation passed');

    const payload = {
      businessName: trimmedBusinessName,
      ownerName: trimmedOwnerName,
      phoneNumber: trimmedPhone,
      yearsInBusiness: parseInt(yearsInBusiness, 10),
      address: trimmedAddress,
      categories: categories.length > 0 ? categories : [],
    };

    if (!onSubmit) {
      console.error('onSubmit is undefined!');
      Alert.alert('Error', 'Submit function is not available');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      resetForm();
      // Only close if successful (onSubmit might also close it, but good to be safe)
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      let errMsg = error?.message || 'Registration failed';
      if (error?.response?.data?.detail) {
        errMsg = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0].msg 
          : error.response.data.detail;
      }
      Alert.alert('Registration Error', String(errMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="storefront" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Register Your Business</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Business Name */}
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              placeholderTextColor={COLORS.textLight}
              value={businessName}
              onChangeText={setBusinessName}
            />

            {/* Owner Name */}
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter owner name"
              placeholderTextColor={COLORS.textLight}
              value={ownerName}
              onChangeText={setOwnerName}
            />

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor={COLORS.textLight}
              value={phoneNumber}
              onChangeText={(text) => {
                const numericText = text.replace(/\D/g, '');
                setPhoneNumber(numericText.slice(0, 10));
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {/* Years in Business */}
            <Text style={styles.label}>Years in Business *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter years (e.g., 5)"
              placeholderTextColor={COLORS.textLight}
              value={yearsInBusiness}
              onChangeText={(text) => {
                const numericText = text.replace(/\D/g, '');
                setYearsInBusiness(numericText.slice(0, 2));
              }}
              keyboardType="number-pad"
              maxLength={2}
            />

            {/* Categories */}
            <Text style={styles.label}>Categories (e.g. Plumber, Electrician) *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter a category and press Add"
                placeholderTextColor={COLORS.textLight}
                value={categoryInput}
                onChangeText={setCategoryInput}
                onSubmitEditing={() => {
                  const cat = categoryInput.trim();
                  if (cat && !categories.includes(cat)) {
                    setCategories([...categories, cat]);
                  }
                  setCategoryInput('');
                }}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: SPACING.md,
                  height: 50,
                  justifyContent: 'center',
                  borderRadius: BORDER_RADIUS.md,
                  marginLeft: SPACING.sm,
                }}
                onPress={() => {
                  const cat = categoryInput.trim();
                  if (cat && !categories.includes(cat)) {
                    setCategories([...categories, cat]);
                  }
                  setCategoryInput('');
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
            {categories.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md }}>
                {categories.map((cat, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${COLORS.primary}15`,
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: SPACING.xs,
                    borderRadius: BORDER_RADIUS.sm,
                    marginRight: SPACING.xs,
                    marginBottom: SPACING.xs,
                  }}>
                    <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '500' }}>{cat}</Text>
                    <TouchableOpacity onPress={() => setCategories(categories.filter(c => c !== cat))}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Address */}
            <Text style={styles.label}>Full Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter complete business address"
              placeholderTextColor={COLORS.textLight}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Register Business</Text>
              )}
            </TouchableOpacity>


            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    padding: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.md,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});