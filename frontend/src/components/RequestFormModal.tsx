import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { HospitalSearchInput } from './HospitalSearchInput';
import { sendOTP, verifyOTP } from '../services/api';

interface CommunityOption {
  id: string;
  name: string;
  type?: string;
}

interface User {
  home_location?: {
    area?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface RequestFormModalProps {
  visible: boolean;
  onClose: () => void;
  requestType: 'Help' | 'Blood' | 'Medical' | 'Financial' | 'Petition';
  selectedOfferingType?: 'Food' | 'Blanket' | 'Clothes' | null;
  communities?: CommunityOption[];
  user?: User;
  onSubmit: (data: any) => Promise<void>;
}

const VISIBILITY_OPTIONS = [
  { key: 'city', label: 'My City Community', icon: 'location' },
  { key: 'state', label: 'My State Community', icon: 'map' },
  { key: 'national', label: 'National Community', icon: 'flag' },
];

const URGENCY_OPTIONS = [
  { key: 'low', label: 'Low', color: COLORS.success },
  { key: 'medium', label: 'Medium', color: COLORS.warning },
  { key: 'high', label: 'High', color: '#E67E22' },
  { key: 'critical', label: 'Critical', color: COLORS.error },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RequestFormModal: React.FC<RequestFormModalProps> = ({
  visible,
  onClose,
  requestType,
  selectedOfferingType,
  communities = [],
  user,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState('area');
  const [urgency, setUrgency] = useState('low');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(communities[0]?.id ?? null);

  useEffect(() => {
    if (communities.length > 0) {
      setSelectedCommunityId((prev) => prev || communities[0].id);
    }
  }, [communities, selectedCommunityId]);

  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [phoneOtpStage, setPhoneOtpStage] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpMessage, setPhoneOtpMessage] = useState<string | null>(null);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  // Blood specific
  const [bloodGroup, setBloodGroup] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalArea, setHospitalArea] = useState('');
  const [location, setLocation] = useState('');
  
  // Financial specific
  const [amount, setAmount] = useState('');

  // Petition specific
  const [petitionTitle, setPetitionTitle] = useState('');
  const [supportNeeded, setSupportNeeded] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContactNumber('');
    setPhoneOtpStage('idle');
    setPhoneOtp('');
    setPhoneOtpMessage(null);
    setPhoneOtpError(null);
    setPhoneSending(false);
    setPhoneVerifying(false);
    setVerifiedPhone('');
    setBloodGroup('');
    setHospitalName('');
    setHospitalArea('');
    setLocation('');
    setAmount('');
    setPetitionTitle('');
    setSupportNeeded('');
    setContactPersonName('');
    setVisibility('area');
    setUrgency('low');
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Validation with user feedback
    if (!description.trim()) {
      setLoading(false);
      Alert.alert('Required Field', 'Please enter a description for your request.');
      return;
    }
    if (!contactNumber.trim()) {
      setLoading(false);
      Alert.alert('Required Field', 'Please enter your contact number.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(contactNumber.trim())) {
      setLoading(false);
      Alert.alert('Error', 'Contact number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (requestType === 'Blood' && phoneOtpStage !== 'verified') {
      setLoading(false);
      Alert.alert('Verify Phone', 'Please verify your contact number with OTP before posting a blood request.');
      return;
    }
    if (requestType === 'Blood' && !bloodGroup) {
      setLoading(false);
      Alert.alert('Required Field', 'Please select a blood group.');
      return;
    }
    if (requestType === 'Financial' && !selectedOfferingType) {
      if (!amount.trim()) {
        setLoading(false);
        Alert.alert('Required Field', 'Please enter amount required.');
        return;
      }
      const amountRegex = /^[1-9]\d*(\.\d{1,2})?$/;
      if (!amountRegex.test(amount.trim())) {
        setLoading(false);
        Alert.alert('Invalid Amount', 'Please enter a valid positive number for the amount.');
        return;
      }
    }

    // Determine community_id based on visibility level
    let computedCommunityId: string | undefined;
    
    if (selectedCommunityId) {
      // User explicitly selected a community
      computedCommunityId = selectedCommunityId;
    } else if (user?.home_location) {
      // Find community based on visibility level and user's location
      const userArea = user.home_location.area;
      const userCity = user.home_location.city;
      const userState = user.home_location.state;
      
      const foundCommunity = communities.find(c => {
        if (visibility === 'city') {
          return c.type === 'city' && c.name.toLowerCase().includes(userCity?.toLowerCase() || '');
        } else if (visibility === 'state') {
          return c.type === 'state' && c.name.toLowerCase().includes(userState?.toLowerCase() || '');
        }
        return false;
      });
      
      if (foundCommunity) {
        computedCommunityId = foundCommunity.id;
      }
    }

    try {
      setLoading(true);

      const computedTitle = requestType === 'Petition'
        ? petitionTitle
        : selectedOfferingType
          ? `${selectedOfferingType} Offering Request`
          : (title || `${requestType} Request`);

      const computedDescription = description || (selectedOfferingType ? `${selectedOfferingType} is required for community offerings.` : '');

      const data = {
        community_id: computedCommunityId,
        request_type: requestType.toLowerCase(),
        visibility_level: visibility,
        urgency_level: urgency,
        title: computedTitle,
        description: computedDescription,
        contact_number: contactNumber,
        // Optionally include offerings string so it appears in group feed
        ...(selectedOfferingType && { support_needed: selectedOfferingType }),
        // Blood specific
        ...(requestType === 'Blood' && {
          blood_group: bloodGroup,
          hospital_name: hospitalName,
          location
        }),
        // Financial specific
        ...(requestType === 'Financial' && { 
          amount: parseFloat(amount) || 0 
        }),
        // Medical specific
        ...(requestType === 'Medical' && { 
          hospital_name: hospitalName,
          location 
        }),
        // Petition specific
        ...(requestType === 'Petition' && {
          support_needed: supportNeeded,
          contact_person_name: contactPersonName,
        }),
      };
      console.log('Submitting request:', data);
      await onSubmit(data);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', error?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const normalizePhoneDigits = (phone: string) => phone.replace(/[^0-9]/g, '');

  useEffect(() => {
    const normalized = normalizePhoneDigits(contactNumber);
    if (normalized !== verifiedPhone) {
      setPhoneOtpStage('idle');
      setPhoneOtp('');
      setPhoneOtpMessage(null);
      setPhoneOtpError(null);
    }
  }, [contactNumber, verifiedPhone]);

  const handleSendPhoneOtp = async () => {
    const trimmedPhone = normalizePhoneDigits(contactNumber);
    if (trimmedPhone.length !== 10) {
      setPhoneOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setPhoneOtpError(null);
    setPhoneOtpMessage(null);
    setPhoneSending(true);

    try {
      await sendOTP(trimmedPhone);
      setPhoneOtpStage('sent');
      setPhoneOtpMessage(`OTP sent to +91${trimmedPhone}.`);
    } catch (error: any) {
      setPhoneOtpError(error?.response?.data?.detail || error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp.trim()) {
      setPhoneOtpError('Please enter the OTP sent to your phone.');
      return;
    }

    setPhoneOtpError(null);
    setPhoneVerifying(true);

    try {
      const trimmedPhone = normalizePhoneDigits(contactNumber);
      await verifyOTP(trimmedPhone, phoneOtp.trim());
      setPhoneOtpStage('verified');
      setVerifiedPhone(trimmedPhone);
      setPhoneOtpMessage('Phone verified successfully.');
    } catch (error: any) {
      setPhoneOtpError(error?.response?.data?.detail || error?.message || 'OTP verification failed. Please try again.');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const getTitle = () => {
    switch (requestType) {
      case 'Blood': return 'Blood Donation Request';
      case 'Medical': return 'Medical Help Request';
      case 'Financial':
        return selectedOfferingType ? `${selectedOfferingType} Offering Request` : 'Financial Help Request';
      case 'Petition': return 'Create Petition';
      default: return 'Help Request';
    }
  };

  const getIcon = () => {
    switch (requestType) {
      case 'Blood': return 'water';
      case 'Medical': return 'medkit';
      case 'Financial': return 'cash';
      case 'Petition': return 'document-text';
      default: return 'hand-left';
    }
  };

  const getIconColor = () => {
    switch (requestType) {
      case 'Blood': return '#E74C3C';
      case 'Medical': return '#27AE60';
      case 'Financial': return '#F39C12';
      case 'Petition': return '#9B59B6';
      default: return COLORS.primary;
    }
  };

  // Render Petition-specific form
  const renderPetitionForm = () => (
    <>
      <Text style={styles.label}>Petition Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="What is this petition about?"
        placeholderTextColor={COLORS.textLight}
        value={petitionTitle}
        onChangeText={setPetitionTitle}
      />

      <Text style={styles.label}>Support Needed</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 1000 signatures, community support"
        placeholderTextColor={COLORS.textLight}
        value={supportNeeded}
        onChangeText={setSupportNeeded}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Explain the cause and why people should support..."
        placeholderTextColor={COLORS.textLight}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Contact Person Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name or organization name"
        placeholderTextColor={COLORS.textLight}
        value={contactPersonName}
        onChangeText={setContactPersonName}
      />

      <Text style={styles.label}>Contact Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="+91 XXXXX XXXXX"
        placeholderTextColor={COLORS.textLight}
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />
    </>
  );

  // Render standard request form
  const renderStandardForm = () => (
    <>
      {/* Visibility Selector */}
      <Text style={styles.label}>Post Request Visibility</Text>
      <View style={styles.visibilityContainer}>
        {VISIBILITY_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.visibilityOption,
              visibility === option.key && styles.visibilityOptionSelected,
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => setVisibility(option.key)}
            android_ripple={{ color: COLORS.primary + '20', borderless: false }}
          >
            <View style={styles.radioOuter}>
              {visibility === option.key && <View style={styles.radioInner} />}
            </View>
            <Ionicons 
              name={option.icon as any} 
              size={18} 
              color={visibility === option.key ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={[
              styles.visibilityText,
              visibility === option.key && styles.visibilityTextSelected,
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Blood Group Selector (for Blood requests) */}
      {requestType === 'Blood' && (
        <>
          <Text style={styles.label}>Blood Group Required *</Text>
          <View style={styles.bloodGroupContainer}>
            {BLOOD_GROUPS.map((bg) => (
              <Pressable
                key={bg}
                style={({ pressed }) => [
                  styles.bloodGroupBtn,
                  bloodGroup === bg && styles.bloodGroupBtnSelected,
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => setBloodGroup(bg)}
                android_ripple={{ color: '#E74C3C20', borderless: false }}
              >
                <Text style={[
                  styles.bloodGroupText,
                  bloodGroup === bg && styles.bloodGroupTextSelected,
                ]}>
                  {bg}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Hospital Name *</Text>
          <HospitalSearchInput
            value={hospitalName}
            onSelect={(hospital) => {
              setHospitalName(hospital.name);
              setHospitalArea(hospital.area);
              // Auto-fill location with area and city
              if (hospital.area || hospital.city) {
                setLocation(hospital.area ? `${hospital.area}, ${hospital.city}` : hospital.city);
              }
            }}
            placeholder="Search hospital name..."
          />

          {hospitalArea ? (
            <View style={styles.areaInfoContainer}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.areaInfoText}>Area: {hospitalArea}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address/location"
            placeholderTextColor={COLORS.textLight}
            value={location}
            onChangeText={setLocation}
          />
        </>
      )}

      {/* Medical specific fields */}
      {requestType === 'Medical' && (
        <>
          <Text style={styles.label}>Hospital/Clinic Name</Text>
          <HospitalSearchInput
            value={hospitalName}
            onSelect={(hospital) => {
              setHospitalName(hospital.name);
              setHospitalArea(hospital.area);
              // Auto-fill location with area and city
              if (hospital.area || hospital.city) {
                setLocation(hospital.area ? `${hospital.area}, ${hospital.city}` : hospital.city);
              }
            }}
            placeholder="Search hospital or clinic name..."
          />

          {hospitalArea ? (
            <View style={styles.areaInfoContainer}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.areaInfoText}>Area: {hospitalArea}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter location/address"
            placeholderTextColor={COLORS.textLight}
            value={location}
            onChangeText={setLocation}
          />
        </>
      )}

      {/* Community selector (for outside-community created request to be placed in a group) */}
      {Array.isArray(communities) && communities.length > 0 && requestType !== 'Blood' && (
        <>
          <Text style={styles.label}>Community *</Text>
          <View style={styles.communityDropdown}>
            {communities.map((community) => (
              <Pressable
                key={community?.id}
                style={({ pressed }) => [
                  styles.communityOption,
                  selectedCommunityId === community?.id && styles.communityOptionActive,
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => setSelectedCommunityId(community?.id)}
                android_ripple={{ color: COLORS.primary + '20', borderless: false }}
              >
                <Text
                  style={[
                    styles.communityText,
                    selectedCommunityId === community?.id && styles.communityTextActive,
                  ]}
                >
                  {community?.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Urgency Level */}
      <Text style={styles.label}>Urgency Level</Text>
      <View style={styles.urgencyContainer}>
        {URGENCY_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.urgencyBtn,
              urgency === option.key && { backgroundColor: `${option.color}15`, borderColor: option.color },
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => setUrgency(option.key)}
            android_ripple={{ color: option.color + '20', borderless: false }}
          >
            <View style={[
              styles.urgencyDot,
              { backgroundColor: option.color },
            ]} />
            <Text style={[
              styles.urgencyText,
              urgency === option.key && { color: option.color, fontWeight: '600' },
            ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Amount (for Financial requests, excluding offerings sub-type) */}
      {requestType === 'Financial' && !selectedOfferingType && (
        <>
          <Text style={styles.label}>Amount Required (Rs)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount needed"
            placeholderTextColor={COLORS.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </>
      )}

      {/* Title (for Help requests) */}
      {requestType === 'Help' && (
        <>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief title for your request"
            placeholderTextColor={COLORS.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </>
      )}

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your request in detail..."
        placeholderTextColor={COLORS.textLight}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Contact Number */}
      <Text style={styles.label}>Contact Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="+91 XXXXX XXXXX"
        placeholderTextColor={COLORS.textLight}
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />

      {requestType === 'Blood' && (
        <View style={styles.otpSection}>
          {phoneOtpMessage ? (
            <Text style={phoneOtpStage === 'verified' ? styles.successText : styles.infoText}>
              {phoneOtpMessage}
            </Text>
          ) : null}
          {phoneOtpError ? (
            <Text style={styles.errorText}>{phoneOtpError}</Text>
          ) : null}

          <View style={styles.otpButtonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.otpButton,
                (phoneSending || phoneVerifying) && styles.otpButtonDisabled,
                pressed && !(phoneSending || phoneVerifying) && { opacity: 0.8 }
              ]}
              onPress={handleSendPhoneOtp}
              disabled={phoneSending || phoneVerifying}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
            >
              {phoneSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.otpButtonText}>
                  {phoneOtpStage === 'sent' ? 'Resend OTP' : 'Send OTP'}
                </Text>
              )}
            </Pressable>
          </View>

          {phoneOtpStage === 'sent' && (
            <>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="Enter OTP"
                placeholderTextColor={COLORS.textLight}
                value={phoneOtp}
                onChangeText={setPhoneOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.otpButton,
                  (phoneVerifying || !phoneOtp.trim()) && styles.otpButtonDisabled,
                  pressed && !(phoneVerifying || !phoneOtp.trim()) && { opacity: 0.8 }
                ]}
                onPress={handleVerifyPhoneOtp}
                disabled={phoneVerifying || !phoneOtp.trim()}
                android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
              >
                {phoneVerifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.otpButtonText}>Verify OTP</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      )}
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ marginRight: 15 }, pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 20 }}
            >
              <Ionicons name="chevron-back" size={28} color={COLORS.text} />
            </Pressable>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBg, { backgroundColor: `${getIconColor()}15` }]}>
                <Ionicons name={getIcon()} size={20} color={getIconColor()} />
              </View>
              <View>
                <Text style={styles.headerTitle}>{getTitle()}</Text>
                {selectedOfferingType && requestType === 'Financial' && (
                  <Text style={styles.selectedOfferingText}>{selectedOfferingType}</Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 20 }}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {requestType === 'Petition' ? renderPetitionForm() : renderStandardForm()}

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                loading && styles.submitBtnDisabled,
                pressed && !loading && { opacity: 0.85 }
              ]}
              onPress={handleSubmit}
              disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {requestType === 'Petition' ? 'Create Petition' : 'Post Request'}
                </Text>
              )}
            </Pressable>

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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedOfferingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
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
    height: 120,
    paddingTop: SPACING.md,
  },
  visibilityContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  visibilityOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  visibilityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  visibilityTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  bloodGroupBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  bloodGroupBtnSelected: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  bloodGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bloodGroupTextSelected: {
    color: '#FFFFFF',
  },
  urgencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  urgencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  urgencyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  areaInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.sm,
  },
  areaInfoText: {
    marginLeft: SPACING.xs,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  otpSection: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  otpButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: SPACING.sm,
  },
  otpButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpButtonDisabled: {
    opacity: 0.6,
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  otpInput: {
    marginTop: SPACING.sm,
  },
  infoText: {
    color: COLORS.primary,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  successText: {
    color: COLORS.success,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  communityDropdown: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  communityOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  communityOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  communityText: {
    color: COLORS.text,
    fontSize: 14,
  },
  communityTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
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
