import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyFirebaseToken } from '../../src/services/api';
import { getCurrentUserToken, verifyFirebaseOTP, sendFirebaseOTP } from '../../src/services/firebase/authService';
import { isAnonymousPhone } from '../../src/services/firebase/config';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const formatPhoneForDisplay = (rawPhone: string) => {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/\s+/g, '');
  if (cleaned.startsWith('+91')) {
    return `+91 ${cleaned.slice(3)}`;
  }
  return rawPhone;
};

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuthStore();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/auth/phone');
  };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (phone && isAnonymousPhone(phone as string)) {
      router.replace({ pathname: '/auth/profile', params: { phone, anonymous: 'true' } });
      return;
    }
  }, [phone, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
      // 1. Verify OTP via Firebase client SDK
      console.log('[OTP] Verifying with Firebase...');
      const idToken = await verifyFirebaseOTP(code);

      // 2. Exchange Firebase ID Token for backend session JWT
      console.log('[OTP] Firebase verified, exchanging for backend token...');
      const response = await verifyFirebaseToken(idToken);
      const data = response.data;

      if (data.is_new_user) {
        // New user — go to profile setup
        router.replace({ pathname: '/auth/profile', params: { phone } });
      } else {
        // Existing registered user — log in and go to home
        await login(data.user, data.token);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.log('Verification Error:', err);
      let message = 'Invalid OTP. Please try again.';

      if (err?.code === 'auth/invalid-verification-code') {
        message = 'Invalid code. Please check and try again.';
      } else if (err?.code === 'auth/code-expired') {
        message = 'OTP has expired. Please request a new one.';
      } else if (err?.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      if (!phone) {
        setError('Phone number missing. Please go back and request OTP again.');
        return;
      }

      // Resend via Firebase
      await sendFirebaseOTP(phone as string);

      setResendTimer(30);
      setError('OTP resent. Enter the new code.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.log('[OTP] resend error:', err);
      setError(err?.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleVerifyPress = () => {
    const code = otp.join('');
    if (code.length === 6) {
      verifyCode(code);
    } else {
      const firstEmptyIndex = otp.findIndex(digit => !digit);
      if (firstEmptyIndex !== -1) {
        inputRefs.current[firstEmptyIndex]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the code sent to {formatPhoneForDisplay(phone || '')}</Text>

          {/* OTP Inputs */}
          <TouchableWithoutFeedback onPress={() => {
            const firstEmptyIndex = otp.findIndex(digit => !digit);
            const indexToFocus = firstEmptyIndex !== -1 ? firstEmptyIndex : 5;
            inputRefs.current[indexToFocus]?.focus();
          }}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref!;
                  }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                />
              ))}
            </View>
          </TouchableWithoutFeedback>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading && (
            <ActivityIndicator color="#FF7B00" style={{ marginTop: SPACING.md }} />
          )}

          {/* Resend */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resendTimer > 0}
          >
            <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Button at the bottom */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              otp.join('').length === 0 && styles.actionButtonEmpty,
              otp.join('').length > 0 && otp.join('').length < 6 && styles.actionButtonPartial,
            ]}
            onPress={handleVerifyPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.actionButtonText, otp.join('').length === 0 && styles.actionButtonTextEmpty]}>
                {otp.join('').length > 0 ? 'Verify OTP' : 'Enter OTP'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 96 : 64,
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFB065',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: 0.07,
    marginBottom: 17,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: SPACING.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF7B00',
    backgroundColor: '#000000',
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    textAlign: 'center',
  },
  otpInputFilled: {
    backgroundColor: '#000000',
  },
  error: {
    color: '#FFCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  resendText: {
    fontSize: 16,
    color: '#F5EEDC',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  resendTextDisabled: {
    color: 'rgba(245, 238, 220, 0.5)',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    width: 359,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(143, 76, 56, 0.30)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'center',
  },
  actionButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF7B00',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonPartial: {
    backgroundColor: '#FF7B00',
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  actionButtonTextEmpty: {
    color: '#FF7B00',
  },
});
