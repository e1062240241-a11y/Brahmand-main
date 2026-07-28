import React, { useEffect, useMemo, useState } from 'react';
import {ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  Dimensions,
  Modal,
  ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { generateUserAadhaarOtp, getKYCStatus, submitKYC, verifyUserAadhaarOtp, validateKYCImage } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from '../src/components/KeyboardAwareScrollView';

type KycStatus = 'pending' | 'manual_review' | 'verified' | 'rejected' | null;

const COUNTRY_CODES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+971', name: 'UAE' },
  { code: '+977', name: 'Nepal' },
  { code: '+65', name: 'Singapore' },
  { code: '+61', name: 'Australia' },
];

const LockIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#666666" strokeWidth={2} />
    <Path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#666666" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default function KycSubmitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verifiedPhone?: string; returnUrl?: string }>();
  const { verifiedPhone, returnUrl } = params;
  const { user, updateUser } = useAuthStore();

  const [statusLoading, setStatusLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validatingImage, setValidatingImage] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Custom Date and Country Picker States
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
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

  const defaultDobDate = React.useMemo(() => {
    if (dob && dob.length === 10) {
      const parts = dob.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (y >= 1920 && y <= new Date().getFullYear()) {
          const parsed = new Date(y, m, d);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
    }
    return dobDate || new Date(2000, 0, 1);
  }, [dob, dobDate]);

  const handleDobChange = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);

    if (cleaned.length === 8) {
      const d = parseInt(cleaned.slice(0, 2), 10);
      const m = parseInt(cleaned.slice(2, 4), 10) - 1;
      const y = parseInt(cleaned.slice(4, 8), 10);
      if (y >= 1920 && y <= new Date().getFullYear()) {
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime())) {
          setDobDate(parsed);
        }
      }
    }
  };

  useEffect(() => {
    let rawPhone =
      params.verifiedPhone ||
      (user as any)?.kyc_verified_phone ||
      user?.phone ||
      (user as any)?.phone_number ||
      '';
    if (rawPhone) {
      let phoneVal = String(rawPhone).trim();
      if (phoneVal.startsWith('+91')) {
        setCountryCode('+91');
        phoneVal = phoneVal.slice(3).trim();
      } else if (phoneVal.startsWith('91') && phoneVal.length > 10) {
        setCountryCode('+91');
        phoneVal = phoneVal.slice(2).trim();
      }
      setPhoneNumber(phoneVal);
    }
    if (user) {
      setFullName(user.name || '');
    }
  }, [user, params.verifiedPhone]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setStatusLoading(true);
        const response = await getKYCStatus();
        const serverStatus = (response?.data?.kyc_status || null) as KycStatus;
        const verifiedPhone = response?.data?.kyc_verified_phone;
        setKycStatus(serverStatus);
        const currentUser = useAuthStore.getState().user;
        if (serverStatus) {
          updateUser({
            kyc_status: serverStatus,
            is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
            kyc_verified_phone: verifiedPhone || (currentUser as any)?.kyc_verified_phone
          } as any);
        }
        if (verifiedPhone) {
          let phoneVal = String(verifiedPhone).trim();
          if (phoneVal.startsWith('+91')) {
            setCountryCode('+91');
            phoneVal = phoneVal.slice(3).trim();
          } else if (phoneVal.startsWith('91') && phoneVal.length > 10) {
            setCountryCode('+91');
            phoneVal = phoneVal.slice(2).trim();
          }
          setPhoneNumber(phoneVal);
        }
        const hasVerifiedPhone = Boolean(params.verifiedPhone || verifiedPhone || (currentUser as any)?.kyc_verified_phone || currentUser?.phone);
        const isAlreadyPendingOrVerified = serverStatus === 'verified' || serverStatus === 'pending' || serverStatus === 'manual_review';
        if (!hasVerifiedPhone && !isAlreadyPendingOrVerified) {
          router.replace({
            pathname: '/kyc',
            params: returnUrl ? { returnUrl } : {}
          } as any);
          return;
        }
      } catch {
        setKycStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };

    loadStatus();
  }, [updateUser, params.verifiedPhone, returnUrl, router]);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickImageAsBase64 = async (forSelfie: boolean) => {
    setUploadError(null);
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
    const asset = result.assets[0];
    const base64 = asset?.base64;
    const uri = asset?.uri;
    if (!base64) {
      const err = 'Unable to read selected image. Please pick another photo.';
      setUploadError(err);
      Alert.alert('Upload Error', err);
      return;
    }

    // Strict file type validation: ONLY JPG and PNG allowed (WEBP strictly disallowed)
    const fileExtension = uri ? uri.split('.').pop()?.toLowerCase() : '';
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      const err = '📄 Unsupported file format. Please upload a JPG or PNG image.';
      setUploadError(err);
      Alert.alert('Unsupported Format', err);
      return;
    }

    // Size limit check: 5MB (5242880 bytes)
    const fileSize = asset.fileSize || Math.round((base64.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024;
    if (fileSize > maxSize) {
      const err = '📦 File is too large. Please upload an image smaller than 5 MB.';
      setUploadError(err);
      Alert.alert('File Too Large', err);
      return;
    }

    if (forSelfie) {
      setSelfieBase64(base64);
      setSelfieUri(uri);
    } else {
      setIdPhotoBase64(base64);
      setIdPhotoUri(uri);

      // Instantly validate document content
      setValidatingImage(true);
      try {
        const response = await validateKYCImage({
          id_photo: base64,
          id_type: idType,
          id_number: idNumber.trim() || undefined,
          full_name: fullName,
        });
        if (response?.data && !response.data.valid) {
          const reason = response.data.reason || "❌ This doesn't look like a government ID. Please upload a clear photo of your Aadhaar, PAN, Voter ID, or Driving License.";
          setUploadError(reason);
          Alert.alert('Document Rejected', reason);
          setIdPhotoBase64(undefined);
          setIdPhotoUri(undefined);
        } else {
          setUploadError(null);
          if (response?.data?.extracted_id_number && (!idNumber || idNumber.trim() === '')) {
            const cleanNum = response.data.extracted_id_number.replace(/[^0-9A-Za-z]/g, '');
            if (cleanNum) setIdNumber(cleanNum);
          }
          if (response?.data?.extracted_name && (!fullName || fullName.trim() === '')) {
            setFullName(response.data.extracted_name);
          }
          Alert.alert('Validation Successful', 'Your document matches the verification standards.');
        }
      } catch (err: any) {
        const errMsg = err?.response?.data?.detail || err?.message || "🌐 We couldn't verify your document right now. Please try again in a few moments.";
        setUploadError(errMsg);
        Alert.alert('Verification Issue', errMsg);
        setIdPhotoBase64(undefined);
        setIdPhotoUri(undefined);
      } finally {
        setValidatingImage(false);
      }
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
    setUploadError(null);
    if (!fullName.trim()) {
      Alert.alert('Missing Details', 'Please enter your Full Name.');
      return;
    }
    if (!idPhotoBase64) {
      const err = 'Please upload a clear photo of your Aadhaar, PAN, Voter ID, or Driving License.';
      setUploadError(err);
      Alert.alert('Missing ID Proof', err);
      return;
    }

    const cleanPhone = phoneNumber.trim();
    let fullPhone = cleanPhone;
    if (cleanPhone) {
      fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `${countryCode}${cleanPhone}`;
    } else {
      fullPhone = params.verifiedPhone || (user as any)?.kyc_verified_phone || user?.phone || '';
    }

    setSubmitLoading(true);
    try {
      const response = await submitKYC({
        kyc_role: 'vendor',
        id_type: idType,
        id_number: idNumber.trim() || '123456789012',
        id_photo: idPhotoBase64,
        selfie_photo: selfieBase64,
        bypass_validation: false,
        full_name: fullName.trim(),
        phone_number: fullPhone,
        date_of_birth: dob.trim(),
      });

      const newStatus = (response?.data?.status || 'pending') as KycStatus;
      const requestNo = response?.data?.kyc_request_no;
      setKycStatus(newStatus);
      updateUser({
        kyc_status: newStatus,
        kyc_verified_phone: fullPhone || (user as any)?.kyc_verified_phone,
        phone: fullPhone || user?.phone,
      } as any);

      if (requestNo) {
        router.replace({
          pathname: '/kyc-success',
          params: { requestNo, returnUrl }
        } as any);
      } else {
        router.replace({
          pathname: '/kyc-success',
          params: { returnUrl }
        } as any);
      }
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || "🌐 We couldn't verify your document right now. Please try again in a few moments.";
      setUploadError(message);
      Alert.alert('Document Verification Failed', message);
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
          <TouchableOpacity style={styles.backBtn} onPress={() => returnUrl ? router.replace(returnUrl as any) : router.back()}>
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
            <KeyboardAwareScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Image 
                source={require('../assets/images/verification_header_illustration.png')} 
                style={styles.illustrationHeaderImage}
              />

              <Text style={styles.introParagraph}>
                KYC helps us maintain trust and safety in{"\n"}the community.
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
                    style={[styles.primaryBtn, styles.shortGoBackBtn]} 
                    onPress={() => returnUrl ? router.replace(returnUrl as any) : router.replace('/(tabs)/profile')}
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
                        <View style={styles.inputWrapper}>
                          <Svg width={18} height={20} viewBox="0 0 18 20" fill="none" style={{ marginLeft: 12, marginRight: 8, width: 17.78 }}>
                            <Path d="M14.0759 16.6677V15.186C14.0759 13.5505 12.7481 12.2227 11.1126 12.2227H6.66756C5.03205 12.2227 3.70422 13.5505 3.70422 15.186V16.6677" stroke="#9CA3AF" strokeWidth={1.48167} strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M5.92664 6.29536C5.92664 7.93087 7.25446 9.2587 8.88997 9.2587C10.5255 9.2587 11.8533 7.93087 11.8533 6.29536C11.8533 4.65986 10.5255 3.33203 8.88997 3.33203C7.25446 3.33203 5.92664 4.65986 5.92664 6.29536V6.29536" stroke="#9CA3AF" strokeWidth={1.48167} strokeLinecap="round" strokeLinejoin="round"/>
                          </Svg>
                          <TextInput
                            style={styles.textInput}
                            placeholder="Enter your full name"
                            placeholderTextColor="#9CA3AF"
                            value={fullName}
                            onChangeText={setFullName}
                          />
                        </View>
                      </View>

                      {/* DOB input */}
                      <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                          <Svg width={18} height={20} viewBox="0 0 18 20" fill="none" style={{ marginLeft: 12, marginRight: 8, width: 17.78 }}>
                            <Path d="M5.92664 2.5918V5.55513" stroke="#9CA3AF" strokeWidth={1.48167} strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M11.8534 2.5918V5.55513" stroke="#9CA3AF" strokeWidth={1.48167} strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M3.7042 4.07422H14.0759C14.8936 4.07422 15.5575 4.73813 15.5575 5.55589V15.9276C15.5575 16.7453 14.8936 17.4092 14.0759 17.4092H3.7042C2.88645 17.4092 2.22253 16.7453 2.22253 15.9276V5.55589C2.22253 4.73813 2.88645 4.07422 3.7042 4.07422V4.07422" stroke="#9CA3AF" strokeWidth={1.48167} strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M2.22253 8.51758H15.5575" stroke="#9CA3AF" strokeWidth={1.48167} strokeLinecap="round" strokeLinejoin="round"/>
                          </Svg>
                          <TextInput
                            style={styles.textInput}
                            placeholder="DD/MM/YYYY (e.g. 15/08/1998)"
                            placeholderTextColor="#9CA3AF"
                            value={dob}
                            onChangeText={handleDobChange}
                            keyboardType="numeric"
                            maxLength={10}
                            editable={true}
                          />
                          <TouchableOpacity
                            style={{ paddingHorizontal: 12 }}
                            onPress={() => {
                              setDobDate(defaultDobDate);
                              setShowDatePicker(true);
                            }}
                          >
                            <Ionicons name="calendar-outline" size={20} color="#F26522" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {showDatePicker && (
                        Platform.OS === 'ios' || Platform.OS === 'web' ? (
                          <Modal
                            transparent={true}
                            animationType="fade"
                            visible={showDatePicker}
                            onRequestClose={() => setShowDatePicker(false)}
                          >
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                              <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, width: 330, maxHeight: '80%' }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10, textAlign: 'center' }}>
                                  Select Date of Birth
                                </Text>

                                {/* Quick Year Selector */}
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>Select Year:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 36 }}>
                                  {Array.from({ length: 65 }, (_, i) => 2008 - i).map((yr) => {
                                    const activeYear = (dobDate || defaultDobDate).getFullYear();
                                    const isSelected = activeYear === yr;
                                    return (
                                      <TouchableOpacity
                                        key={yr}
                                        onPress={() => {
                                          const currentDate = dobDate || defaultDobDate;
                                          const updated = new Date(yr, currentDate.getMonth(), currentDate.getDate());
                                          setDobDate(updated);
                                        }}
                                        style={{
                                          paddingHorizontal: 12,
                                          paddingVertical: 6,
                                          borderRadius: 8,
                                          backgroundColor: isSelected ? '#F26522' : '#F3F4F6',
                                          marginRight: 6,
                                        }}
                                      >
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#FFF' : '#374151' }}>
                                          {yr}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </ScrollView>

                                {Platform.OS === 'ios' && (
                                  <DateTimePicker
                                    value={dobDate || defaultDobDate}
                                    mode="date"
                                    display="inline"
                                    maximumDate={new Date()}
                                    onChange={(event, selectedDate) => {
                                      if (selectedDate) {
                                        setDobDate(selectedDate);
                                      }
                                    }}
                                  />
                                )}

                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 12 }}>
                                  <TouchableOpacity 
                                    style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                                    onPress={() => setShowDatePicker(false)}
                                  >
                                    <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={{ backgroundColor: '#F26522', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                                    onPress={() => {
                                      setShowDatePicker(false);
                                      const dateToUse = dobDate || defaultDobDate;
                                      const day = String(dateToUse.getDate()).padStart(2, '0');
                                      const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
                                      const year = dateToUse.getFullYear();
                                      setDob(`${day}/${month}/${year}`);
                                    }}
                                  >
                                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Confirm</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </Modal>
                        ) : (
                          <DateTimePicker
                            value={dobDate || defaultDobDate}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={(event, selectedDate) => {
                              setShowDatePicker(false);
                              if (selectedDate) {
                                setDobDate(selectedDate);
                                const day = String(selectedDate.getDate()).padStart(2, '0');
                                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const year = selectedDate.getFullYear();
                                setDob(`${day}/${month}/${year}`);
                              }
                            }}
                          />
                        )
                      )}

                      {/* Phone input */}
                      <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="call-outline" size={18} color="#666666" style={styles.inputIcon} />
                          <TouchableOpacity 
                            style={styles.countrySelector}
                            onPress={() => setShowCountryPicker(true)}
                          >
                            <Text style={styles.countryText}>{countryCode}</Text>
                            <Ionicons name="chevron-down" size={12} color="#666666" style={{ marginLeft: 2 }} />
                          </TouchableOpacity>
                          <View style={styles.dividerLine} />
                          <TextInput
                            style={styles.textInput}
                            placeholder="Mobile number"
                            placeholderTextColor="#9CA3AF"
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

                    <View style={styles.fieldsContainer}>
                      {/* Dashed Upload Card */}
                      <TouchableOpacity 
                        style={styles.dashedCard} 
                        onPress={() => pickImageAsBase64(false)}
                      >
                        {validatingImage ? (
                          <View style={styles.dashedCardInner}>
                            <ActivityIndicator color="#F26522" size="large" />
                            <Text style={styles.uploadMainText}>Verifying document details...</Text>
                            <Text style={styles.uploadSubText}>Please wait while our AI scans your ID document.</Text>
                          </View>
                        ) : idPhotoUri ? (
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
                              {"Aadhaar Card, PAN Card, Voter ID, or\nDriving License\n(JPG or PNG up to 5MB)"}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {uploadError ? (
                        <View style={styles.errorCardContainer}>
                          <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 2 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.errorCardTitle}>Verification Issue</Text>
                            <Text style={styles.errorCardText}>{uploadError}</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Card 3: Selfie Verification (Bypassed for testing ID) */}
                  {/*
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
                            <Text style={styles.uploadMainText}>Take Selfie</Text>
                            <Text style={styles.uploadSubText}>
                              Make sure your face is clearly visible.
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  */}

                  {/* Submit Button */}
                  <TouchableOpacity 
                    style={[
                      styles.primaryBtn, 
                      styles.submitBtnPosition,
                      submitLoading && styles.disabledBtn
                    ]} 
                    onPress={submit}
                    disabled={submitLoading}
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
            </KeyboardAwareScrollView>
          </KeyboardAvoidingView>
        )}

        <Modal
          visible={showCountryPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country Code</Text>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <KeyboardAwareScrollView>
                {COUNTRY_CODES.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.countryItem}
                    onPress={() => {
                      setCountryCode(item.code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryItemText}>{item.code} ({item.name})</Text>
                  </TouchableOpacity>
                ))}
              </KeyboardAwareScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEEE5',
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
    width: '100%',
    height: undefined,
    aspectRatio: 131 / 70,
    resizeMode: 'contain',
    marginTop: -15,
    marginBottom: 4,
  },
  introParagraph: {
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 22,
    marginTop: 0,
    marginBottom: 24,
  },
  whiteCard: {
    padding: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    alignSelf: 'stretch',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 4,
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
    gap: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 16,
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
    display: 'flex',
    height: 180,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FFF5F1',
    overflow: 'hidden',
  },
  dashedCardInner: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 20,
  },
  cloudCircle: {
    display: 'flex',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderRadius: 9999,
    backgroundColor: '#FFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadMainText: {
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 20,
  },
  uploadSubText: {
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 15,
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
    width: Platform.OS === 'android' ? 320 : 361,
    height: Platform.OS === 'android' ? 48 : 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    backgroundColor: '#F26522',
    shadowColor: '#FED7AA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  shortGoBackBtn: {
    width: 180,
    height: 44,
    borderRadius: 22,
  },
  submitBtnPosition: {
    marginTop: 8,
    marginBottom: 20,
  },
  disabledBtn: {
    backgroundColor: '#CCCCCC',
  },
  primaryBtnText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 16,
    fontStyle: 'normal',
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
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 13.75,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 15,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryItemText: {
    fontSize: 16,
    color: '#374151',
  },
  errorCardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    width: '100%',
  },
  errorCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorCardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B91C1C',
    lineHeight: 17,
  },
});