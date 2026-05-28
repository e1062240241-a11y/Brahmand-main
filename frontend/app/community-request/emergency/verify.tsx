import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { useVendorStore } from '../../../src/store/vendorStore';

import { getKYCStatus } from '../../../src/services/api';

export default function CommunityRequestEmergencyVerifyPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    community_id?: string,
    emergencyType?: string;
    hospitalName?: string;
    location?: string;
    urgency?: string;
    description?: string;
    contactPreference?: string;
    contactNumber?: string;
  }>();
  const { user, updateUser } = useAuthStore();
  const { myVendor, fetchMyVendor } = useVendorStore();

  const [phoneNumber, setPhoneNumber] = React.useState((params.contactNumber || user?.phone || '').replace(/[^0-9]/g, ''));


  React.useEffect(() => {
    fetchMyVendor();
  }, [fetchMyVendor]);

  const isKycVerified =
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified';

  const handleCompleteKyc = async () => {
    router.push('/kyc');
  };

  const handleSendOtp = () => {
    if (!isKycVerified) {
      router.push('/kyc');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Enter Phone', 'Please enter a valid phone number before sending OTP.');
      return;
    }
    router.push({
      pathname: '/community-request/emergency/otp',
      params: {
        community_id: params.community_id,
        phone: phoneNumber.replace(/[^0-9]/g, ''),
        emergencyType: params.emergencyType,
        hospitalName: params.hospitalName,
        location: params.location,
        urgency: params.urgency,
        description: params.description,
        contactPreference: params.contactPreference,
        contactNumber: params.contactNumber,
      },
    });
  };

  const handleContinue = () => {
    if (!isKycVerified) {
      router.push('/kyc');
      return;
    }
    router.push({
      pathname: '/community-request/emergency/review',
      params: {
        community_id: params.community_id,
        emergencyType: params.emergencyType,
        hospitalName: params.hospitalName,
        location: params.location,
        urgency: params.urgency,
        description: params.description,
        contactPreference: params.contactPreference,
        contactNumber: params.contactNumber,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Verify Your Number & Complete KYC</Text>
          <Text style={styles.subtitle}>To create and share your request, you need to verify your number and be KYC verified member.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>1</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Verify Your Number</Text>
            <Text style={styles.stepDescription}>We’ll send a 6 digit OTP to verify your mobile number.</Text>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter mobile number"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
              />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>2</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Complete KYC Verification</Text>
            <Text style={styles.stepDescription}>KYC helps us maintain trust and safety in the community.</Text>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>KYC Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isKycVerified && <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />}
                <Text style={[styles.detailValue, isKycVerified ? styles.verifiedText : styles.pendingText]}>
                  {isKycVerified ? 'Verified' : 'Not KYC Verified'}
                </Text>
              </View>
            </View>
            {!isKycVerified && (
              <TouchableOpacity style={styles.outlineButton} onPress={handleCompleteKyc} activeOpacity={0.8}>
                <Text style={styles.outlineButtonText}>Complete KYC Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>Your information is secure and never shared with anyone.</Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F2F4FF',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE0D6',
    color: '#E53935',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: SPACING.sm,
  },
  stepContent: {
    marginTop: SPACING.sm,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  detailBox: {
    backgroundColor: '#F8FAFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
  },
  verifiedText: {
    color: '#2E7D32',
  },
  pendingText: {
    color: '#E53935',
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F2F4FF',
    marginBottom: SPACING.md,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  phoneInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    color: COLORS.text,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  continueButton: {
    backgroundColor: '#FF6B00',
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});