import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { parseApiError, searchHospitals } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const CONTACT_OPTIONS = ['Call Me', 'WhatsApp', 'Email'];

export default function CommunityRequestBloodPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalSuggestions, setHospitalSuggestions] = useState<Array<{ name: string; address: string; area: string; city: string }>>([]);
  const [selectedHospital, setSelectedHospital] = useState<{ name: string; address: string; area: string; city: string } | null>(null);
  const [isHospitalSearching, setIsHospitalSearching] = useState(false);
  const [location, setLocation] = useState('Auto-detected');
  const [urgency, setUrgency] = useState('Low');
  const [description, setDescription] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [contactPreference, setContactPreference] = useState('Call Me');

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

    router.push({
      pathname: '/community-request/blood/review',
      params: {
        bloodGroup,
        hospitalName,
        location: location || 'Auto-detected',
        urgency,
        description,
        contactPreference,
        contactNumber,
      },
    });
  };

  const searchHospitalNames = async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
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
    if (trimmedName.length < 2) {
      setHospitalSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchHospitalNames(trimmedName);
    }, 300);

    return () => clearTimeout(timer);
  }, [hospitalName]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <TextInput
            style={styles.input}
            placeholder="Search hospital name..."
            placeholderTextColor={COLORS.textLight}
            value={hospitalName}
            onChangeText={(text) => {
              setHospitalName(text);
              setSelectedHospital(null);
            }}
          />
          {hospitalName.length >= 2 && (
            <View style={styles.suggestionsCard}>
              {isHospitalSearching ? (
                <Text style={styles.suggestionStatus}>Searching hospitals...</Text>
              ) : hospitalSuggestions.length > 0 ? (
                hospitalSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.name}-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleHospitalSelect(item)}
                  >
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionMeta}>{item.address || item.city || item.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View>
                  <Text style={styles.suggestionStatus}>No hospitals found</Text>
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleHospitalSelect({ name: hospitalName.trim(), address: hospitalName.trim(), area: '', city: '' })}
                  >
                    <Text style={styles.suggestionName}>Use hospital name as typed</Text>
                    <Text style={styles.suggestionMeta}>{hospitalName.trim()}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
                style={[styles.urgencyChip, urgency === level && styles.urgencyChipSelected(level)]}
                onPress={() => setUrgency(level)}
              >
                <Text style={[styles.urgencyText, urgency === level && styles.urgencyTextSelected(level)]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the situation (required)"
            placeholderTextColor={COLORS.textLight}
            multiline
          />
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
    </SafeAreaView>
  );
}

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
  urgencyChipSelected: (level: string) => ({
    backgroundColor: level === 'Urgent' ? '#E53935' : COLORS.primary,
    borderColor: level === 'Urgent' ? '#E53935' : COLORS.primary,
  }),
  urgencyText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  urgencyTextSelected: (level: string) => ({
    color: '#FFF',
  }),
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
    marginTop: SPACING.sm,
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
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});