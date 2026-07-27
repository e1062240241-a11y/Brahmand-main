import React, { useState, useRef } from 'react';
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
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initializeFirebase, firebaseConfig, isAnonymousPhone } from '../../src/services/firebase/config';
import { loginAnonymous } from '../../src/services/api';

// Debug: Log Firebase config on web
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  console.log('[Phone Auth] Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId ? 'SET' : 'MISSING',
  });
}

const formatPhoneNumber = (text: string) => {
  // Keep only numbers and plus sign (for country code detection)
  let cleaned = text.replace(/[^0-9+]/g, '');

  // Normalize leading +91, 91, or 0
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = cleaned.slice(1);
  }

  // Keep only digits and slice to 10
  return cleaned.replace(/[^0-9]/g, '').slice(0, 10);
};

export default function PhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const [phone, setPhone] = useState<string>(formatPhoneNumber(params.phone?.toString() || ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // Initialize Firebase on mount
  React.useEffect(() => {
    initializeFirebase();
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!router.canGoBack()) {
      router.replace('/auth/entry-animation');
    }
  }, [router]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhone = `+91${phone}`;

      if (isAnonymousPhone(fullPhone)) {
        console.log('[Phone Auth] Detected anonymous predefined number');
        router.push({ pathname: '/auth/profile', params: { phone: fullPhone, anonymous: 'true' } });
        return;
      }

      const digits = fullPhone.replace(/[^0-9]/g, '');
      const isMockNumber =
        digits.endsWith('1234567890') ||
        digits.endsWith('9876543210') ||
        digits.includes('9999') ||
        digits.includes('1111');

      if (isMockNumber) {
        console.log('[Phone Auth] Detected mock testing number, using backend OTP service');
        const { sendOTP } = require('../../src/services/api');
        await sendOTP(fullPhone);
        router.push({ pathname: '/auth/otp', params: { phone: fullPhone, mock: 'true' } });
        return;
      }

      // Use Firebase Phone Auth instead of backend API
      try {
        const { sendFirebaseOTP } = require('../../src/services/firebase/authService');
        await sendFirebaseOTP(fullPhone);

        console.log('[Phone Auth] OTP sent via Firebase');
        router.push({ pathname: '/auth/otp', params: { phone: fullPhone } });
        return;
      } catch (firebaseErr: any) {
        console.warn('[Phone Auth] Firebase OTP failed:', firebaseErr);
        const errCode = firebaseErr?.code || '';
        const errMsg = firebaseErr?.message || '';

        const isAppNotAuthorized =
          errCode === 'auth/app-not-authorized' ||
          errCode === 'auth/invalid-app-credential' ||
          errMsg.includes('app-not-authorized') ||
          errMsg.includes('play_integrity_token') ||
          errMsg.includes('not authorized');

        if (isAppNotAuthorized) {
          console.log('[Phone Auth] Falling back to backend OTP service due to Firebase app authorization error...');
          try {
            const { sendOTP } = require('../../src/services/api');
            await sendOTP(fullPhone);
            router.push({ pathname: '/auth/otp', params: { phone: fullPhone, mock: 'true' } });
            return;
          } catch (backendErr: any) {
            throw new Error('Firebase Auth is not authorized for this app build (missing SHA-1 / Play Integrity in Firebase Console). Please verify SHA-1 in Firebase settings.');
          }
        }
        throw firebaseErr;
      }
    } catch (err: any) {
      console.log('[Phone Auth] OTP send error:', err);
      let message = err?.message || 'Failed to send OTP. Please try again.';
      if (err?.code === 'auth/captcha-check-failed') {
        message = 'CAPTCHA verification failed. Please try again.';
      } else if (err?.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.OS === 'android' ? undefined : 'height')}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
        {Platform.OS === 'web' ? <div id="recaptcha-container-fixed"></div> : null}


        <View style={styles.content}>
          <View style={styles.inputsStack}>
            <Text style={styles.title}>Enter your phone</Text>
            <Text style={styles.subtitle}>{"We'll send you a verification code"}</Text>

            {/* Phone Input */}
            <TouchableWithoutFeedback onPress={() => phoneInputRef.current?.focus()}>
              <View style={styles.phoneContainer}>
                <View style={[styles.prefixBox, isFocused && styles.activeBorder]}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={[styles.phoneInput, isFocused && styles.activeBorder]}
                  placeholder="Phone number"
                  placeholderTextColor="#F5EEDC"
                  value={phone}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setPhone(formatted);
                    setError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={25}
                  autoFocus
                  showSoftInputOnFocus={true}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  importantForAutofill="yes"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </TouchableWithoutFeedback>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>

        {/* Action Button at the bottom */}
        <View style={[
          styles.bottomContainer,
          Platform.OS === 'android' && {
            paddingBottom: Math.max(insets.bottom + 16, 24)
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              phone.length === 0 && styles.sendButtonEmpty,
              phone.length > 0 && phone.length !== 10 && styles.sendButtonPartial,
            ]}
            onPress={handleSendOTP}
            disabled={phone.length !== 10 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.sendButtonText, phone.length === 0 && styles.sendButtonTextEmpty]}>Enter Phone Number</Text>
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
    ...Platform.select({
      android: {
        justifyContent: 'flex-start',
        paddingTop: 64,
      },
      default: {
        justifyContent: 'center',
      },
    }),
    paddingHorizontal: 16,
  },
  inputsStack: {
    width: '100%',
  },
  title: {
    color: '#FFB065',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: 0.07,
    marginBottom: 16,
  },
  subtitle: {
    color: '#F5EEDC',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 36,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefixBox: {
    height: 48,
    paddingLeft: 8,
    paddingRight: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 220, 0.3)',
    backgroundColor: '#000000',
  },
  prefixText: {
    color: '#F5EEDC',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingLeft: 16,
    paddingRight: Platform.OS === 'android' ? 16 : 147,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 220, 0.3)',
    backgroundColor: '#000000',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#F5EEDC',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  activeBorder: {
    borderColor: '#FF7B00',
  },
  error: {
    color: '#FFCCCC',
    fontSize: 14,
    marginTop: 8,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    alignItems: 'center',
    width: '100%',
  },
  sendButton: {
    width: Platform.OS === 'android' ? '100%' : 359,
    maxWidth: Platform.OS === 'android' ? 359 : undefined,
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
  sendButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF7B00',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonPartial: {
    backgroundColor: '#FF7B00',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  sendButtonTextEmpty: {
    color: '#FF7B00',
  },
});
