// accessibility: placeholder
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { createCommunityRequest, parseApiError } from '../../../src/services/api';
// import { getCurrentUserToken } from '../../../src/services/firebase/authService';
import { useAuthStore } from '../../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';

export default function CommunityRequestBloodOtpPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    community_id?: string;
    phone?: string;
    bloodGroup?: string;
    hospitalName?: string;
    location?: string;
    urgency?: string;
    description?: string;
    contactPreference?: string;
    contactNumber?: string;
  }>();
  const { login, user } = useAuthStore();
  const rawPhone = (params.phone || '').replace(/[^0-9]/g, '');
  const phone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [nattyFishRequestId, setNattyFishRequestId] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const requestData = {
    request_type: 'blood' as const,
    visibility_level: 'area' as const,
    title: 'Blood Request',
    description: params.description || '',
    contact_number: params.contactNumber || phone,
    urgency_level: (params.urgency === 'Urgent' ? 'critical' : (params.urgency || 'low').toLowerCase()) as 'low' | 'medium' | 'high' | 'critical',
    blood_group: params.bloodGroup || '',
    hospital_name: params.hospitalName || '',
    location: params.location || '',
  };

  useEffect(() => {
    if (!phone) {
      Alert.alert('Phone missing', 'Please provide a phone number first.');
      router.replace('/community-request/blood/verify');
      return;
    }
    sendOtp();
  }, [phone]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendOtp = async () => {
    if (otpSending) return;
    setOtpSending(true);
    setError('');
    try {
      console.log('[NattyFish] Requesting backend to send OTP to:', phone);
      const response = await api.post('/auth/nettyfish/send', {
        phone: `+91${phone}`,
        purpose: 'blood_request'
      });
      console.log('[NattyFish] Send response:', response.data);

      setResendTimer(30);
    } catch (err: any) {
      console.error('NattyFish OTP send failed', err);
      setError(err?.response?.data?.detail || err?.message || 'Unable to send OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '');

    if (Platform.OS === 'android' && cleanValue.length > 1) {
      const digits = cleanValue.split('');
      const newOtp = [...otp];
      const startIdx = cleanValue.length === 4 ? 0 : index;
      for (let i = 0; i < digits.length; i++) {
        if (startIdx + i < 4) {
          newOtp[startIdx + i] = digits[i];
        }
      }
      setOtp(newOtp);
      setError('');
      
      const lastFocusedIdx = Math.min(startIdx + digits.length - 1, 3);
      inputRefs.current[lastFocusedIdx]?.focus();
      
      if (newOtp.every((digit) => digit !== '')) {
        verifyCode(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = Platform.OS === 'android' ? cleanValue.slice(-1) : cleanValue;
    setOtp(newOtp);
    setError('');
    if (newOtp[index] && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((digit) => digit !== '')) {
      verifyCode(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      console.log('[NattyFish] Verifying OTP via backend...');
      const response = await api.post('/auth/nettyfish/verify', {
        phone: `+91${phone}`,
        otp: code,
        purpose: 'blood_request'
      });
      console.log('[NattyFish] Verify response:', response.data);

      if (response.data.status === 'success') {
        // Verification successful, proceed with submission
        await submitRequestIfKycVerified(user);
      } else {
        throw new Error(response.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('NattyFish verify failed', err);
      setError(err?.response?.data?.detail || err?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const submitRequestIfKycVerified = async (user: any) => {
    try {
      await createCommunityRequest({ ...requestData, community_id: params.community_id });
      router.replace({
        pathname: '/community-request/blood/success',
        params: { community_id: params.community_id }
      });
    } catch (submitError: any) {
      Alert.alert('Request error', parseApiError(submitError));
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || otpSending) return;
    await sendOtp();
  };

  return (
    <LinearGradient colors={['#FF6600', '#FF9933']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.mandalaContainer}>
        <View style={styles.mandalaCircle} />
        <View style={[styles.mandalaCircle, styles.mandalaCircle2]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>We have sent a 4 digit OTP to +91 {phone}</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref!; }}
                style={[styles.otpInput, otp[index] && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={Platform.OS === 'android' ? 4 : 1}
                selectTextOnFocus
                textContentType="oneTimeCode"
                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {otpSending ? <ActivityIndicator color="#FFFFFF" style={{ marginTop: SPACING.md }} /> : null}

          <TouchableOpacity style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]} onPress={handleResend} disabled={resendTimer > 0}>
            <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
              {resendTimer > 0 ? `Resend OTP in 00:${String(resendTimer).padStart(2, '0')}` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.noteCard}>
            <Text style={styles.noteText}>This number will be used for all future communications regarding your request.</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => verifyCode(otp.join(''))} disabled={loading || otp.some((digit) => !digit)} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Verify & Continue</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mandalaContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.08,
  },
  mandalaCircle: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mandalaCircle2: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  keyboardView: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FFFFFF',
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  error: {
    color: '#FFF',
    backgroundColor: 'rgba(211, 47, 47, 0.3)',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center',
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '600',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: 'rgba(255,255,255,0.7)',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});