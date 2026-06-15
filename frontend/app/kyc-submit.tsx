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
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { generateUserAadhaarOtp, getKYCStatus, submitKYC, verifyUserAadhaarOtp } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

type KycStatus = 'pending' | 'manual_review' | 'verified' | 'rejected' | null;

const { width } = Dimensions.get('window');



const LockIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#666666" strokeWidth={2} />
    <Path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#666666" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default function KycSubmitScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [statusLoading, setStatusLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [idType, setIdType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoBase64, setIdPhotoBase64] = useState<string | undefined>(undefined);
  const [idPhotoUri, setIdPhotoUri] = useState<string | undefined>(undefined);
  
  const [selfieBase64, setSelfieBase64] = useState<string | undefined>(undefined);
  const [selfieUri, setSelfieUri] = useState<string | undefined>(undefined);

  // OTP States
  const [otpFlowActive, setOtpFlowActive] = useState(false);
  const [otpReferenceId, setOtpReferenceId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPhoneNumber(user.phone || '');
    }
  }, [user]);

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
    const uri = result.assets[0]?.uri;
    if (!base64) {
      Alert.alert('Upload Error', 'Unable to read selected image.');
      return;
    }

    if (forSelfie) {
      setSelfieBase64(base64);
      setSelfieUri(uri);
    } else {
      setIdPhotoBase64(base64);
      setIdPhotoUri(uri);
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
    if (!fullName.trim()) {
      Alert.alert('Missing Details', 'Please enter your Full Name.');
      return;
    }

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
        kyc_role: 'vendor',
        id_type: idType,
        id_number: idNumber.trim(),
        id_photo: idPhotoBase64,
        selfie_photo: selfieBase64,
      });

      const newStatus = (response?.data?.status || 'pending') as KycStatus;
      setKycStatus(newStatus);
      updateUser({ kyc_status: newStatus } as any);

      Alert.alert(
        'KYC Submitted',
        newStatus === 'verified'
          ? 'Your KYC is verified successfully.'
          : 'Your KYC request is submitted and pending admin approval.',
        [{ text: 'OK', onPress: () => router.replace('/kyc') }]
      );
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to submit KYC.';
      Alert.alert('Submission Failed', message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Complete Your KYC</Text>
          <View style={{ width: 40 }} />
        </View>

        {statusLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#F26522" />
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Illustration Header */}
              <Image 
                source={require('../assets/images/kyc_steps_header.png')} 
                style={styles.illustrationHeaderImage} 
              />

              <Text style={styles.introParagraph}>
                KYC helps us maintain trust and safety{"\n"}in the community.
              </Text>

              {kycStatus === 'verified' || kycStatus === 'pending' || kycStatus === 'manual_review' ? (
                <View style={[styles.whiteCard, { alignItems: 'center', gap: 20 }]}>
                  <View style={styles.statusBox}>
                    <Ionicons 
                      name={kycStatus === 'verified' ? 'checkmark-circle' : 'time'} 
                      size={48} 
                      color={kycStatus === 'verified' ? '#2E7D32' : '#F26522'} 
                    />
                    <Text style={styles.statusTitle}>
                      {kycStatus === 'verified' ? 'KYC Verified' : 'KYC Under Review'}
                    </Text>
                    <Text style={styles.statusDescription}>
                      {kycStatus === 'verified' 
                        ? 'Your KYC documents have been successfully verified.' 
                        : 'Your documents have been submitted and are under review. It usually takes 24 hours.'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={() => router.replace('/kyc')}
                  >
                    <Text style={styles.primaryBtnText}>Go Back</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Card 1: Personal Information */}
                  <View style={styles.whiteCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeCircle}>
                        <Text style={styles.badgeText}>1</Text>
                      </View>
                      <View style={styles.cardHeaderTexts}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <Text style={styles.cardDescription}>Please provide your basic details.</Text>
                      </View>
                    </View>

                    <View style={styles.fieldsContainer}>
                      {/* Name input */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Full Name (as per ID)</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="person-outline" size={18} color="#666666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.textInput}
                            placeholder="Enter your full name"
                            placeholderTextColor="#999999"
                            value={fullName}
                            onChangeText={setFullName}
                          />
                        </View>
                      </View>

                      {/* DOB input */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Date of Birth</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="calendar-outline" size={18} color="#666666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.textInput}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor="#999999"
                            value={dob}
                            onChangeText={setDob}
                          />
                        </View>
                      </View>

                      {/* Phone input */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="call-outline" size={18} color="#666666" style={styles.inputIcon} />
                          <View style={styles.countrySelector}>
                            <Text style={styles.countryText}>+91</Text>
                            <Ionicons name="chevron-down" size={12} color="#666666" style={{ marginLeft: 2 }} />
                          </View>
                          <View style={styles.dividerLine} />
                          <TextInput
                            style={styles.textInput}
                            placeholder="Mobile number"
                            placeholderTextColor="#999999"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            maxLength={10}
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Card 2: Identity Verification */}
                  <View style={styles.whiteCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeCircle}>
                        <Text style={styles.badgeText}>2</Text>
                      </View>
                      <View style={styles.cardHeaderTexts}>
                        <Text style={styles.cardTitle}>Identity Verification</Text>
                        <Text style={styles.cardDescription}>Upload a valid government issued ID.</Text>
                      </View>
                    </View>

                    {/* Segment switcher */}
                    <View style={styles.segmentRow}>
                      <TouchableOpacity
                        style={[styles.segmentButton, idType === 'aadhaar' && styles.segmentActive]}
                        onPress={() => setIdType('aadhaar')}
                      >
                        <Text style={[styles.segmentText, idType === 'aadhaar' && styles.segmentTextActive]}>Aadhaar Card</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentButton, idType === 'pan' && styles.segmentActive]}
                        onPress={() => setIdType('pan')}
                      >
                        <Text style={[styles.segmentText, idType === 'pan' && styles.segmentTextActive]}>PAN Card</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fieldsContainer}>
                      {/* ID Number input */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                          {idType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Card Number'}
                        </Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="id-card-outline" size={18} color="#666666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.textInput}
                            placeholder={idType === 'aadhaar' ? 'Enter 12-digit Aadhaar' : 'Enter 10-char PAN'}
                            placeholderTextColor="#999999"
                            value={idNumber}
                            onChangeText={setIdNumber}
                            maxLength={idType === 'aadhaar' ? 12 : 10}
                            autoCapitalize={idType === 'pan' ? 'characters' : 'none'}
                            keyboardType={idType === 'aadhaar' ? 'numeric' : 'default'}
                          />
                        </View>
                      </View>

                      {/* Dashed Upload Card */}
                      <Text style={styles.inputLabel}>Upload ID Proof</Text>
                      <TouchableOpacity 
                        style={styles.dashedCard} 
                        onPress={() => pickImageAsBase64(false)}
                      >
                        {idPhotoUri ? (
                          <View style={styles.previewContainer}>
                            <Image source={{ uri: idPhotoUri }} style={styles.previewImage} />
                            <View style={styles.changeOverlay}>
                              <Ionicons name="camera" size={24} color="#FFF" />
                              <Text style={styles.changeText}>Change Image</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.dashedCardInner}>
                            <View style={styles.cloudCircle}>
                              <Ionicons name="cloud-upload-outline" size={24} color="#F26522" />
                            </View>
                            <Text style={styles.uploadMainText}>Upload ID Proof</Text>
                            <Text style={styles.uploadSubText}>
                              Aadhaar Card, PAN Card, Passport or Driving License (JPEG, PNG up to 5MB)
                            </Text>
                            <View style={styles.tagLabel}>
                              <Text style={styles.tagLabelText}>brahmand team</Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Aadhaar OTP Flow */}
                      {idType === 'aadhaar' && idNumber.trim().length === 12 && (
                        <View style={styles.otpVerifyBlock}>
                          {!otpFlowActive ? (
                            <TouchableOpacity 
                              style={styles.outlineBtn}
                              onPress={handleGenerateOtp}
                              disabled={otpLoading}
                            >
                              {otpLoading ? (
                                <ActivityIndicator color="#F26522" />
                              ) : (
                                <Text style={styles.outlineBtnText}>Send OTP to Aadhaar Registered Mobile</Text>
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View style={{ gap: 12 }}>
                              <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Enter Aadhaar OTP</Text>
                                <View style={styles.inputWrapper}>
                                  <Ionicons name="lock-closed-outline" size={18} color="#666666" style={styles.inputIcon} />
                                  <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter 6-digit OTP"
                                    placeholderTextColor="#999999"
                                    value={otpValue}
                                    onChangeText={setOtpValue}
                                    keyboardType="numeric"
                                    maxLength={6}
                                  />
                                </View>
                              </View>
                              <View style={styles.otpActionRow}>
                                <TouchableOpacity 
                                  style={[styles.outlineBtn, { flex: 1 }]}
                                  onPress={handleVerifyOtp}
                                  disabled={otpLoading || otpVerified}
                                >
                                  <Text style={styles.outlineBtnText}>
                                    {otpVerified ? 'Verified ✓' : 'Verify OTP'}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={[styles.outlineBtn, { flex: 1 }]}
                                  onPress={handleGenerateOtp}
                                  disabled={otpLoading}
                                >
                                  <Text style={styles.outlineBtnText}>Resend</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Card 3: Selfie Verification */}
                  <View style={styles.whiteCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeCircle}>
                        <Text style={styles.badgeText}>3</Text>
                      </View>
                      <View style={styles.cardHeaderTexts}>
                        <Text style={styles.cardTitle}>Selfie Verification</Text>
                        <Text style={styles.cardDescription}>Take a clear selfie for verification.</Text>
                      </View>
                    </View>

                    <View style={styles.fieldsContainer}>
                      <TouchableOpacity 
                        style={styles.dashedCard} 
                        onPress={() => pickImageAsBase64(true)}
                      >
                        {selfieUri ? (
                          <View style={styles.previewContainer}>
                            <Image source={{ uri: selfieUri }} style={styles.previewImage} />
                            <View style={styles.changeOverlay}>
                              <Ionicons name="camera" size={24} color="#FFF" />
                              <Text style={styles.changeText}>Retake Selfie</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.dashedCardInner}>
                            <View style={styles.cloudCircle}>
                              <Ionicons name="camera-outline" size={24} color="#F26522" />
                            </View>
                            <Text style={styles.uploadMainText}>Take a Selfie</Text>
                            <Text style={styles.uploadSubText}>
                              Please ensure your face is clearly visible, well-lit, and not covered.
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity 
                    style={[
                      styles.primaryBtn, 
                      styles.submitBtnPosition,
                      (submitLoading || (idType === 'aadhaar' && !otpVerified)) && styles.disabledBtn
                    ]} 
                    onPress={submit}
                    disabled={submitLoading || (idType === 'aadhaar' && !otpVerified)}
                  >
                    {submitLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Submit KYC</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Disclaimer Footer */}
              <View style={styles.disclaimerContainer}>
                <LockIcon />
                <Text style={styles.disclaimerText}>
                  Your information is secure and never shared with anyone.
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 32.5,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  illustrationHeaderImage: {
    width: 393,
    height: 210,
    aspectRatio: 131 / 70,
    resizeMode: 'contain',
    marginTop: 16,
    marginBottom: 8,
  },
  introParagraph: {
    color: '#4B5563',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 22.75,
    marginBottom: 24,
  },
  whiteCard: {
    width: 361,
    alignSelf: 'center',
    padding: 24,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  badgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F26522',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  cardHeaderTexts: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 20,
  },
  fieldsContainer: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  inputContainer: {
    width: '100%',
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  inputWrapper: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  dividerLine: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5E5',
    marginRight: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  segmentActive: {
    backgroundColor: '#F26522',
    borderColor: '#F26522',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  dashedCard: {
    width: '100%',
    height: 120,
    borderWidth: 1.5,
    borderColor: '#F26522',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFF8F5',
    overflow: 'hidden',
  },
  dashedCardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  cloudCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEFE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  uploadSubText: {
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 14,
  },
  tagLabel: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFEFE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#F26522',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  otpVerifyBlock: {
    width: '100%',
    marginTop: 10,
  },
  outlineBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F26522',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: {
    color: '#F26522',
    fontSize: 13,
    fontWeight: '600',
  },
  otpActionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  primaryBtn: {
    width: 361,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F26522',
  },
  submitBtnPosition: {
    marginTop: 8,
    marginBottom: 20,
  },
  disabledBtn: {
    backgroundColor: '#CCCCCC',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    width: '100%',
  },
  disclaimerText: {
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 11,
    fontWeight: '400',
  },
  statusBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});