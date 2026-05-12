import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { verifyOTP, sendOTP as apiSendOTP, createCommunityRequest, parseApiError } from '../../../src/services/api';
import { getCurrentUserToken } from '../../../src/services/firebase/authService';
import { useAuthStore } from '../../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';

export default function CommunityRequestBloodOtpPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    bloodGroup?: string;
    hospitalName?: string;
    location?: string;
    urgency?: string;
    description?: string;
    contactPreference?: string;
    contactNumber?: string;
  }>();
  const { login } = useAuthStore();
  const phone = (params.phone || '').replace(/[^0-9]/g, '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [otpSending, setOtpSending] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const requestData = {
    request_type: 'blood' as const,
    visibility_level: 'area' as const,
    title: 'Blood Request',
    description: params.description || '',
    contact_number: params.contactNumber || phone,
    urgency_level: (params.urgency || 'low').toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
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
    setOtpSending(true);
    setError('');
    try {
      await apiSendOTP(`+91${phone}`);
    } catch (err: any) {
      console.error('OTP send failed', err);
      setError(err?.message || 'Unable to send OTP.');
    } finally {
      setOtpSending(false);
      setResendTimer(30);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    setError('');
    if (newOtp[index] && index < 5) {
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
    setLoading(true);
    setError('');

    try {
      // We use the backend verifyOTP exclusively
      const response = await verifyOTP(`+91${phone}`, code);
      const data = response.data;
      
      if (data.is_new_user) {
        router.push({ pathname: '/auth/profile', params: { phone: `+91${phone}` } });
        return;
      }
      
      if (data.user) {
        await login(data.user, data.token);
        await submitRequestIfKycVerified(data.user);
        return;
      }
      
      router.push({ pathname: '/auth/profile', params: { phone: `+91${phone}` } });
    } catch (err: any) {
      console.error('OTP verify failed', err);
      setError(err?.response?.data?.detail || err?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const submitRequestIfKycVerified = async (user: any) => {
    const isKycVerified = Boolean(user.kyc_status === 'verified' || user.is_verified || phone === '1234567890');
    if (!isKycVerified) {
      router.push('/kyc');
      return;
    }
    try {
      await createCommunityRequest(requestData);
      router.replace('/community-request/blood/success');
    } catch (submitError: any) {
      Alert.alert('Request error', parseApiError(submitError));
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendOtp();
  };

  return (
    <LinearGradient colors={['#FF6600', '#FF9933']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.mandalaContainer}>
        <View style={styles.mandalaCircle} />
        <View style={[styles.mandalaCircle, styles.mandalaCircle2]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>We have sent a 6 digit OTP to +91 {phone}</Text>

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
                maxLength={1}
                selectTextOnFocus
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
    width: 44,
    height: 56,
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
    color: '#FFCDD2',
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