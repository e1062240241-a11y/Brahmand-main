import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, BackHandler, ViewStyle, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { parseApiError, searchHospitals } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { HospitalSearchInput } from '../../src/components/HospitalSearchInput';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const CONTACT_OPTIONS = ['Call Me', 'WhatsApp', 'Email'];

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

export default function CommunityRequestBloodPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ community_id?: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalSuggestions, setHospitalSuggestions] = useState<{ name: string; address: string; area: string; city: string }[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<{ name: string; address: string; area: string; city: string } | null>(null);
  const [isHospitalSearching, setIsHospitalSearching] = useState(false);
  const [location, setLocation] = useState('Auto-detected');
  const [urgency, setUrgency] = useState('Low');
  const [description, setDescription] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [contactNumber, setContactNumber] = useState(user?.phone ? formatPhoneNumber(user.phone) : '');
  const [contactPreference, setContactPreference] = useState('Call Me');
  const [showCountryModal, setShowCountryModal] = useState(false);

  useEffect(() => {
    if (user?.home_location) {
      const { area, city, state } = user.home_location;
      const parts = [area, city, state].filter(Boolean);
      if (parts.length > 0) {
        setLocation(parts.join(', '));
      }
    }
  }, [user]);

  const handleSubmit = () => {
    if (!bloodGroup) {
      Alert.alert('Select Blood Group', 'Please select a blood group.');
      return;
    }
    if (!hospitalName.trim()) {
      Alert.alert('Hospital Required', 'Please enter the hospital name.');
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

    router.push({
      pathname: '/community-request/blood/review',
      params: {
        community_id: params.community_id,
        bloodGroup,
        hospitalName,
        location: location || 'Auto-detected',
        urgency,
        description,
        contactPreference,
        contactNumber: `${countryCode}${contactNumber}`,
      },
    });
  };

  const searchHospitalNames = async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 1) {
      setHospitalSuggestions([]);
      return;
    }
    setIsHospitalSearching(true);
    try {
      const response = await searchHospitals(trimmedQuery, 10);
      const results = response.data?.results || response.data || [];
      setHospitalSuggestions(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Hospital search failed', error);
      setHospitalSuggestions([]);
    } finally {
      setIsHospitalSearching(false);
    }
  };

  const handleHospitalSelect = (item: { name: string; address: string; area: string; city: string }) => {
    const normalizedAddress = item.address?.trim() || item.city?.trim() || item.name?.trim() || 'Auto-detected';
    setHospitalName(item.name);
    setSelectedHospital(item);
    setLocation(normalizedAddress);
    setHospitalSuggestions([]);
  };

  React.useEffect(() => {
    const trimmedName = hospitalName.trim();
    if (trimmedName.length < 1 || selectedHospital) {
      setHospitalSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchHospitalNames(trimmedName);
    }, 300);

    return () => clearTimeout(timer);
  }, [hospitalName, selectedHospital]);

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
    <SafeAreaView style={styles.container as ViewStyle}>
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>Blood Request</Text>
          <Text style={styles.pageSubtitle}>Fill in the details below</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Blood Group</Text>
          <View style={styles.selectRow}>
            {BLOOD_GROUPS.map((group) => (
              <TouchableOpacity
                key={group}
                style={[styles.optionChip, bloodGroup === group && styles.optionChipSelected]}
                onPress={() => setBloodGroup(group)}
              >
                <Text style={[styles.optionText, bloodGroup === group && styles.optionTextSelected]}>{group}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Hospital Name</Text>
          <HospitalSearchInput
            value={hospitalName}
            onSelect={(h) => {
              setHospitalName(h.name);
              setSelectedHospital(h);
              if (h.address || h.city) {
                setLocation(h.address || h.city);
              }
            }}
            placeholder="Search hospital name..."
          />
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Location (Auto-detected)</Text>
          <View style={[styles.input, styles.disabledInput]}>
            <Text style={styles.disabledText}>{location || 'Auto-detected'}</Text>
          </View>
          {selectedHospital ? (
            <View style={styles.hospitalDetailCard}>
              <Text style={styles.hospitalDetailTitle}>Selected hospital</Text>
              <Text style={styles.hospitalDetailName}>{selectedHospital.name}</Text>
              <Text style={styles.hospitalDetailMeta}>{selectedHospital.address}</Text>
              {selectedHospital.area || selectedHospital.city ? (
                <Text style={styles.hospitalDetailMeta}>{[selectedHospital.area, selectedHospital.city].filter(Boolean).join(', ')}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Urgency Level</Text>
          <View style={styles.selectRow}>
            {URGENCY_OPTIONS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.urgencyChip, urgency === level && urgencyChipSelectedStyle(level)]}
                onPress={() => setUrgency(level)}
              >
                <Text style={[styles.urgencyText, urgency === level && urgencyTextSelectedStyle(level)]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the situation (required)"
              placeholderTextColor={COLORS.textLight}
              multiline
              maxLength={200}
            />
            <Text style={{ fontSize: 12, color: "#999", textAlign: "right", marginTop: 4, marginRight: 4 }}>
              {description?.length || 0}/200
            </Text>
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Contact Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity style={styles.countryCodeSelector} activeOpacity={0.7} onPress={() => setShowCountryModal(true)}>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.text} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.phoneInputDivider} />
            <TextInput
              style={styles.phoneNumberInput}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textLight}
              value={contactNumber}
              onChangeText={(t) => setContactNumber(formatPhoneNumber(t))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Contact Preference</Text>
          <View style={styles.selectRow}>
            {CONTACT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionChip, contactPreference === option && styles.optionChipSelected]}
                onPress={() => setContactPreference(option)}
              >
                <Text style={[styles.optionText, contactPreference === option && styles.optionTextSelected]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Country Code Modal */}
      <Modal visible={showCountryModal} transparent animationType="fade" onRequestClose={() => setShowCountryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryModal(false)}>
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitleText}>Select Country Code</Text>
            {COUNTRY_CODES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[styles.countryOptionItem, countryCode === item.code && styles.countryOptionSelected]}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryModal(false);
                }}
              >
                <Text style={[styles.countryOptionText, countryCode === item.code && styles.countryOptionTextSelected]}>
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

const urgencyChipSelectedStyle = (level: string) => ({
  backgroundColor: level === 'Urgent' ? '#E53935' : COLORS.primary,
  borderColor: level === 'Urgent' ? '#E53935' : COLORS.primary,
});

const urgencyTextSelectedStyle = (level: string) => ({
  color: '#FFF',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pageHeaderText: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  fieldSection: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  optionText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionTextSelected: {
    color: '#FFF',
  },
  urgencyChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: '#FFFFFF',
  },
  urgencyText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    color: COLORS.text,
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: '#F2F4FF',
  },
  disabledText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  hospitalDetailCard: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  hospitalDetailTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  hospitalDetailName: {
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  hospitalDetailMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionsCard: {
    marginBottom: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  suggestionName: {
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  suggestionMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  suggestionStatus: {
    padding: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 45,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.sm,
    height: 52,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.xs,
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    elevation: 5,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  countryOptionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 6,
    backgroundColor: '#F8F9FA',
  },
  countryOptionSelected: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  countryOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  countryOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});