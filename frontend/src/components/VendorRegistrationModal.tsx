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
import { useTranslation } from '../utils/i18n';

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
  const { t } = useTranslation();
  const isHi = t('language') === 'hi';

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
    const businessNameRegex = /^[a-zA-Z0-9\u0900-\u097F\s&.,'-\/]{2,50}$/; // allow devanagari letters
    const ownerNameRegex = /^[a-zA-Z\u0900-\u097F\s.'-]{2,50}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const yearsRegex = /^(0|[1-9]\d?)$/;
    const addressRegex = /^[a-zA-Z0-9\u0900-\u097F\s.,'#\-\/()]{5,150}$/;

    // Validation
    if (!trimmedBusinessName) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'व्यवसाय का नाम आवश्यक है' : 'Business name is required'
      );
      return;
    }
    if (!businessNameRegex.test(trimmedBusinessName)) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi 
          ? 'व्यवसाय का नाम 2 से 50 वर्णों का होना चाहिए और इसमें केवल अक्षर, संख्याएं, रिक्त स्थान और मानक विराम चिह्न (& . , \' - /) हो सकते हैं' 
          : 'Business name must be 2 to 50 characters and can only contain letters, numbers, spaces, and standard punctuation (& . , \' - /)'
      );
      return;
    }

    if (!trimmedOwnerName) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'मालिक का नाम आवश्यक है' : 'Owner name is required'
      );
      return;
    }
    if (!ownerNameRegex.test(trimmedOwnerName)) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi 
          ? 'मालिक का नाम 2 से 50 वर्णों का होना चाहिए और इसमें केवल अक्षर, रिक्त स्थान, बिंदु और हाइफ़न होने चाहिए' 
          : 'Owner name must be 2 to 50 characters and contain only letters, spaces, dots, and hyphens'
      );
      return;
    }

    if (!trimmedPhone) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'फ़ोन नंबर आवश्यक है' : 'Phone number is required'
      );
      return;
    }
    if (!phoneRegex.test(trimmedPhone)) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi 
          ? 'फ़ोन नंबर 6, 7, 8, या 9 से शुरू होने वाला एक वैध 10-अंकीय मोबाइल नंबर होना चाहिए' 
          : 'Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9'
      );
      return;
    }

    if (!yearsInBusiness) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'व्यवसाय में वर्ष आवश्यक है' : 'Years in business is required'
      );
      return;
    }
    if (!yearsRegex.test(yearsInBusiness)) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi 
          ? 'व्यवसाय में वर्ष 0 और 99 के बीच एक वैध संख्या होनी चाहिए' 
          : 'Years in business must be a valid number between 0 and 99'
      );
      return;
    }

    if (!trimmedAddress) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'पता आवश्यक है' : 'Address is required'
      );
      return;
    }
    if (!addressRegex.test(trimmedAddress)) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi 
          ? 'पता 5 से 150 वर्णों के बीच होना चाहिए और इसमें केवल अक्षर, संख्याएं, रिक्त स्थान और मूल प्रतीक (.,\'#-/()) हो सकते हैं' 
          : 'Address must be between 5 and 150 characters and can only contain letters, numbers, spaces, and basic symbols (.,\'#-/())'
      );
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
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'सबमिट फ़ंक्शन उपलब्ध नहीं है' : 'Submit function is not available'
      );
      return;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      let errMsg = error?.message || 'Registration failed';
      if (error?.response?.data?.detail) {
        errMsg = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0].msg 
          : error.response.data.detail;
      }
      Alert.alert(
        isHi ? 'पंजीकरण त्रुटि' : 'Registration Error',
        String(errMsg)
      );
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTranslation = (cat: string) => {
    const map: { [key: string]: string } = {
      'Carpenter': 'बढ़ई',
      'Housemaid': 'कामवाली बाई',
      'Plumber': 'नलसाज',
      'Electrician': 'बिजली मिस्त्री',
      'Cook': 'रसोइया',
      'Teacher': 'शिक्षक',
      'Painter': 'रंगसाज',
      'Beautician': 'ब्यूटीशियन',
    };
    return isHi ? (map[cat] || cat) : cat;
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
              <Text style={styles.headerTitle}>
                {isHi ? 'अपना व्यवसाय पंजीकृत करें' : 'Register Your Business'}
              </Text>
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
            <Text style={styles.label}>{isHi ? 'व्यवसाय का नाम *' : 'Business Name *'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isHi ? 'व्यवसाय का नाम दर्ज करें' : 'Enter business name'}
              placeholderTextColor={COLORS.textLight}
              value={businessName}
              onChangeText={setBusinessName}
            />

            {/* Owner Name */}
            <Text style={styles.label}>{isHi ? 'मालिक का नाम *' : 'Owner Name *'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isHi ? 'मालिक का नाम दर्ज करें' : 'Enter owner name'}
              placeholderTextColor={COLORS.textLight}
              value={ownerName}
              onChangeText={setOwnerName}
            />

            {/* Phone Number */}
            <Text style={styles.label}>{isHi ? 'फ़ोन नंबर *' : 'Phone Number *'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isHi ? '10-अंकीय फ़ोन नंबर दर्ज करें' : 'Enter 10-digit phone number'}
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
            <Text style={styles.label}>{isHi ? 'व्यवसाय के वर्ष *' : 'Years in Business *'}</Text>
            <TextInput
              style={styles.input}
              placeholder={isHi ? 'वर्ष दर्ज करें (जैसे, 5)' : 'Enter years (e.g., 5)'}
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
            <Text style={styles.label}>
              {isHi ? 'श्रेणियाँ (जैसे नलसाज, बिजली मिस्त्री) *' : 'Categories (e.g. Plumber, Electrician) *'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={isHi ? 'एक श्रेणी दर्ज करें और जोड़ें दबाएं' : 'Enter a category and press Add'}
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
                <Text style={{ color: '#FFF', fontWeight: '600' }}>{isHi ? 'जोड़ें' : 'Add'}</Text>
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
                    <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '500' }}>
                      {getCategoryTranslation(cat)}
                    </Text>
                    <TouchableOpacity onPress={() => setCategories(categories.filter(c => c !== cat))}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Address */}
            <Text style={styles.label}>{isHi ? 'पूरा पता *' : 'Full Address *'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={isHi ? 'व्यवसाय का पूरा पता दर्ज करें' : 'Enter complete business address'}
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
                <Text style={styles.submitBtnText}>
                  {isHi ? 'व्यवसाय पंजीकृत करें' : 'Register Business'}
                </Text>
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