import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { generateUserAadhaarOtp, getKYCStatus, submitKYC, verifyUserAadhaarOtp } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';

type KycStatus = 'pending' | 'manual_review' | 'verified' | 'rejected' | null;

export default function KycSubmitScreen() {
  const router = useRouter();
  const { updateUser } = useAuthStore();

  const [statusLoading, setStatusLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);
  const [idType, setIdType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoBase64, setIdPhotoBase64] = useState<string | undefined>(undefined);
  const [selfieBase64, setSelfieBase64] = useState<string | undefined>(undefined);
  const [otpFlowActive, setOtpFlowActive] = useState(false);
  const [otpReferenceId, setOtpReferenceId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setStatusLoading(true);
        const response = await getKYCStatus();
        const serverStatus = (response?.data?.kyc_status || null) as KycStatus;
        setKycStatus(serverStatus);
        if (serverStatus) {
          updateUser({ kyc_status: serverStatus } as any);
        }
      } catch {
        setKycStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };

    loadStatus();
  }, [updateUser]);

  const statusText = useMemo(() => {
    if (kycStatus === 'verified') return 'Your KYC is verified. You can now view CVs.';
    if (kycStatus === 'pending' || kycStatus === 'manual_review') {
      return 'Your KYC request is submitted and pending admin approval.';
    }
    if (kycStatus === 'rejected') return 'Your KYC was rejected. Please resubmit your details.';
    return 'Submit KYC to view candidate CVs.';
  }, [kycStatus]);

  const pickImageAsBase64 = async (forSelfie: boolean) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      base64: true,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.length) return;
    const base64 = result.assets[0]?.base64;
    if (!base64) {
      Alert.alert('Upload Error', 'Unable to read selected image.');
      return;
    }

    if (forSelfie) {
      setSelfieBase64(base64);
    } else {
      setIdPhotoBase64(base64);
    }
  };

  useEffect(() => {
    setOtpFlowActive(false);
    setOtpReferenceId('');
    setOtpValue('');
    setOtpVerified(false);
  }, [idType]);

  useEffect(() => {
    if (idType === 'aadhaar' && otpVerified) {
      setOtpVerified(false);
      setOtpFlowActive(false);
      setOtpReferenceId('');
      setOtpValue('');
    }
  }, [idNumber, idType, otpVerified]);

  const handleGenerateOtp = async () => {
    const trimmed = idNumber.trim();
    if (trimmed.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Aadhaar number must be 12 digits.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await generateUserAadhaarOtp({
        aadhaar_number: trimmed,
        consent: 'Y',
        reason: 'Jobs KYC verification',
      });
      const referenceId =
        response?.data?.reference_id ||
        response?.data?.sandbox_response?.reference_id ||
        response?.data?.sandbox_response?.data?.reference_id ||
        '';

      if (!referenceId) {
        Alert.alert('OTP Error', 'OTP generated but reference ID is missing. Please retry.');
        return;
      }

      setOtpReferenceId(referenceId);
      setOtpFlowActive(true);
      setOtpVerified(false);
      Alert.alert('OTP Sent', 'OTP sent to your Aadhaar-linked mobile number.');
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to generate OTP.';
      Alert.alert('OTP Failed', typeof message === 'string' ? message : 'Failed to generate OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpReferenceId) {
      Alert.alert('Missing Reference', 'Please generate OTP first.');
      return;
    }
    if (!otpValue.trim()) {
      Alert.alert('Missing OTP', 'Please enter the OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      await verifyUserAadhaarOtp({
        reference_id: otpReferenceId,
        otp: otpValue.trim(),
      });
      setOtpVerified(true);
      Alert.alert('Verified', 'Aadhaar OTP verified successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to verify OTP.';
      Alert.alert('Verification Failed', typeof message === 'string' ? message : 'Failed to verify OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const submit = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Missing Details', 'Please enter your ID number.');
      return;
    }

    if (idType === 'aadhaar' && idNumber.trim().length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Aadhaar number must be 12 digits.');
      return;
    }

    if (idType === 'pan' && idNumber.trim().length !== 10) {
      Alert.alert('Invalid PAN', 'PAN number must be 10 characters.');
      return;
    }

    if (idType === 'aadhaar' && !otpVerified) {
      Alert.alert('OTP Required', 'Please verify Aadhaar OTP before submitting KYC.');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await submitKYC({
        kyc_role: 'organizer',
        id_type: idType,
        id_number: idNumber.trim(),
        id_photo: idPhotoBase64,
        selfie_photo: idType === 'pan' ? selfieBase64 : undefined,
      });

      const newStatus = (response?.data?.status || 'pending') as KycStatus;
      setKycStatus(newStatus);
      updateUser({ kyc_status: newStatus } as any);

      Alert.alert(
        'KYC Submitted',
        newStatus === 'verified'
          ? 'Your KYC is verified. You can now view CVs.'
          : 'Your KYC request is sent for admin approval. CV access unlocks after approval.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to submit KYC.';
      Alert.alert('Submission Failed', message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>KYC Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {statusLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.statusCard}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>

            {kycStatus === 'verified' ? (
              <Button title="Back" onPress={() => router.back()} style={styles.submitButton} />
            ) : (
              <>
                <Text style={styles.label}>ID Type</Text>
                <View style={styles.segmentRow}>
                  <TouchableOpacity
                    style={[styles.segmentButton, idType === 'aadhaar' && styles.segmentActive]}
                    onPress={() => setIdType('aadhaar')}
                  >
                    <Text style={[styles.segmentText, idType === 'aadhaar' && styles.segmentTextActive]}>Aadhaar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segmentButton, idType === 'pan' && styles.segmentActive]}
                    onPress={() => setIdType('pan')}
                  >
                    <Text style={[styles.segmentText, idType === 'pan' && styles.segmentTextActive]}>PAN</Text>
                  </TouchableOpacity>
                </View>

                <Input
                  label={idType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'}
                  placeholder={idType === 'aadhaar' ? 'Enter 12-digit Aadhaar' : 'Enter PAN'}
                  value={idNumber}
                  onChangeText={setIdNumber}
                  autoCapitalize={idType === 'pan' ? 'characters' : 'none'}
                />

                {idType === 'aadhaar' && (
                  <View style={styles.otpSection}>
                    {!otpFlowActive ? (
                      <Button
                        title="Send Aadhaar OTP"
                        onPress={handleGenerateOtp}
                        loading={otpLoading}
                        style={styles.otpActionBtn}
                      />
                    ) : (
                      <>
                        <Input
                          label="Aadhaar OTP"
                          placeholder="Enter OTP"
                          value={otpValue}
                          onChangeText={setOtpValue}
                          keyboardType="number-pad"
                        />
                        <View style={styles.otpRow}>
                          <Button
                            title={otpVerified ? 'OTP Verified' : 'Verify OTP'}
                            onPress={handleVerifyOtp}
                            loading={otpLoading}
                            disabled={otpVerified}
                            style={styles.otpActionBtn}
                          />
                          <Button
                            title="Resend OTP"
                            onPress={handleGenerateOtp}
                            variant="outline"
                            loading={otpLoading}
                            style={styles.otpActionBtn}
                          />
                        </View>
                      </>
                    )}
                  </View>
                )}

                <Text style={styles.label}>ID Document (optional)</Text>
                <TouchableOpacity style={styles.uploadRow} onPress={() => pickImageAsBase64(false)}>
                  <Ionicons name="document-attach" size={18} color={COLORS.primary} />
                  <Text style={styles.uploadText}>{idPhotoBase64 ? 'ID document selected' : 'Upload ID document'}</Text>
                </TouchableOpacity>

                {idPhotoBase64 ? <Image source={{ uri: `data:image/jpeg;base64,${idPhotoBase64}` }} style={styles.preview} /> : null}

                {idType === 'pan' && (
                  <>
                    <Text style={styles.label}>Selfie (optional)</Text>
                    <TouchableOpacity style={styles.uploadRow} onPress={() => pickImageAsBase64(true)}>
                      <Ionicons name="camera" size={18} color={COLORS.primary} />
                      <Text style={styles.uploadText}>{selfieBase64 ? 'Selfie selected' : 'Upload selfie'}</Text>
                    </TouchableOpacity>
                    {selfieBase64 ? <Image source={{ uri: `data:image/jpeg;base64,${selfieBase64}` }} style={styles.preview} /> : null}
                  </>
                )}

                <Button title="Submit KYC" onPress={submit} loading={submitLoading} style={styles.submitButton} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statusText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
  },
  segmentTextActive: {
    color: COLORS.textWhite,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  uploadText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  preview: {
    marginTop: SPACING.sm,
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  otpSection: {
    marginBottom: SPACING.md,
  },
  otpRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  otpActionBtn: {
    flex: 1,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
});