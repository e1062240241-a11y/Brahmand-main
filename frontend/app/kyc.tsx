// accessibility: placeholder
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  BackHandler, 
  ActivityIndicator, 
  Alert,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useVendorStore } from '../src/store/vendorStore';
import { useAuthStore } from '../src/store/authStore';
import { VendorKYCModal } from '../src/components/VendorKYCModal';
import { getKYCStatus, sendNettyfishOTP, verifyNettyfishOTP } from '../src/services/api';
import { useTranslation } from '../src/utils/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, G, Circle } from 'react-native-svg';

// Custom SVGs from Figma specs
const PadlockIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path 
      d="M25.3333 13.3327H26.6667C27.4031 13.3327 28 13.9296 28 14.666V27.9993C28 28.7358 27.4031 29.3327 26.6667 29.3327H5.33333C4.59696 29.3327 4 28.7358 4 27.9993V14.666C4 13.9296 4.59696 13.3327 5.33333 13.3327H6.66667V11.9993C6.66667 6.8447 10.8453 2.66602 16 2.66602C21.1547 2.66602 25.3333 6.8447 25.3333 11.9993V13.3327ZM6.66667 15.9993V26.666H25.3333V15.9993H6.66667ZM14.6667 18.666H17.3333V23.9993H14.6667V18.666ZM22.6667 13.3327V11.9993C22.6667 8.31746 19.6819 5.33268 16 5.33268C12.3181 5.33268 9.33333 8.31746 9.33333 11.9993V13.3327H22.6667Z" 
      fill="#F26522" 
    />
  </Svg>
);

const ShieldIcon = ({ color = '#F26522', size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Path 
      d="M20 1.66602L33.6948 4.70932C34.4575 4.87878 35 5.55513 35 6.3363V22.9808C35 26.3243 33.329 29.4467 30.547 31.3013L20 38.3327L9.453 31.3013C6.67102 29.4467 5 26.3243 5 22.9808V6.3363C5 5.55513 5.54255 4.87878 6.30512 4.70932L20 1.66602ZM20 5.08067L8.33333 7.67325V22.9808C8.33333 25.2098 9.44733 27.2913 11.302 28.5278L20 34.3265L28.698 28.5278C30.5527 27.2913 31.6667 25.2098 31.6667 22.9808V7.67325L20 5.08067ZM27.4207 13.7024L29.7777 16.0594L19.171 26.666L12.1 19.595L14.457 17.2378L19.1698 21.9508L27.4207 13.7024Z" 
      fill={color} 
    />
  </Svg>
);

const WarningCardShieldIcon = ({ color = '#F26522', size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Rect 
      x={2} 
      y={2} 
      width={36} 
      height={36} 
      rx={8} 
      stroke={color} 
      strokeWidth={2} 
    />
    <G transform="translate(10, 10)">
      <Path 
        d="M10 0.833008L16.8474 2.35465C17.2288 2.43937 17.5 2.77755 17.5 3.16814V11.4908C17.5 13.1627 16.6645 14.724 15.2735 15.6513L10 19.1663L4.7265 15.6513C3.33551 14.724 2.5 13.1627 2.5 11.4908V3.16814C2.5 2.77755 2.77128 2.43937 3.15256 2.35465L10 0.833008ZM10 2.54025L4.16667 3.83654V11.4908C4.16667 12.6053 4.72367 13.646 5.651 14.2642L10 17.1637L14.349 14.2642C15.2763 13.646 15.8333 12.6053 15.8333 11.4908V3.83654L10 2.54025ZM13.7104 6.85108L14.8889 8.0296L9.5855 13.333L6.04999 9.79753L7.22851 8.61901L9.58491 10.9755L13.7104 6.85108Z" 
        fill={color} 
      />
    </G>
  </Svg>
);

const WarningShieldIcon = ({ color = '#F26522' }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path 
      d="M8 0.666016L13.4779 1.88334C13.783 1.95112 14 2.22166 14 2.53413V9.19195C14 10.5293 13.3316 11.7783 12.2188 12.5201L8 15.3327L3.7812 12.5201C2.66841 11.7783 2 10.5293 2 9.19195V2.53413C2 2.22166 2.21702 1.95112 2.52205 1.88334L8 0.666016ZM8 2.03188L3.33333 3.06891V9.19195C3.33333 10.0835 3.77893 10.9161 4.5208 11.4107L8 13.7302L11.4792 11.4107C12.2211 10.9161 12.6667 10.0835 12.6667 9.19195V3.06891L8 2.03188ZM10.9683 5.48057L11.9111 6.42338L7.6684 10.666L4.83999 7.83762L5.78281 6.89475L7.66793 8.77995L10.9683 5.48057Z" 
      fill={color} 
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" 
      stroke="#777777" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Path 
      d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11M6 11H18C19.1046 11 20 11.8954 20 13V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V13C4 11.8954 4.89543 11 6 11Z" 
      stroke="#777777" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

const CustomBackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M15.375 5.25L8.625 12L15.375 18.75" 
      stroke="black" 
      strokeWidth={2.25} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const SupportIcon = ({ style }: { style?: any }) => (
  <Svg width={20} height={18} viewBox="0 0 20 18" fill="none" style={style}>
    <Path 
      d="M9 18V16H17V8.9C17 6.95 16.3208 5.29583 14.9625 3.9375C13.6042 2.57917 11.95 1.9 10 1.9C8.05 1.9 6.39583 2.57917 5.0375 3.9375C3.67917 5.29583 3 6.95 3 8.9V15H2C1.45 15 0.979167 14.8042 0.5875 14.4125C0.195833 14.0208 0 13.55 0 13V11C0 10.65 0.0875 10.3208 0.2625 10.0125C0.4375 9.70417 0.683333 9.45833 1 9.275L1.075 7.95C1.20833 6.81667 1.5375 5.76667 2.0625 4.8C2.5875 3.83333 3.24583 2.99167 4.0375 2.275C4.82917 1.55833 5.7375 1 6.7625 0.6C7.7875 0.2 8.86667 0 10 0C11.1333 0 12.2083 0.2 13.225 0.6C14.2417 1 15.15 1.55417 15.95 2.2625C16.75 2.97083 17.4083 3.80833 17.925 4.775C18.4417 5.74167 18.775 6.79167 18.925 7.925L19 9.225C19.3167 9.375 19.5625 9.6 19.7375 9.9C19.9125 10.2 20 10.5167 20 10.85V13.15C20 13.4833 19.9125 13.8 19.7375 14.1C19.5625 14.4 19.3167 14.625 19 14.775V16C19 16.55 18.8042 17.0208 18.4125 17.4125C18.0208 17.8042 17.55 18 17 18H9ZM7 11C6.71667 11 6.47917 10.9042 6.2875 10.7125C6.09583 10.5208 6 10.2833 6 10C6 9.71667 6.09583 9.47917 6.2875 9.2875C6.47917 9.09583 6.71667 9 7 9C7.28333 9 7.52083 9.09583 7.7125 9.2875C7.90417 9.47917 8 9.71667 8 10C8 10.2833 7.90417 10.5208 7.7125 10.7125C7.52083 10.9042 7.28333 11 7 11ZM13 11C12.7167 11 12.4792 10.9042 12.2875 10.7125C12.0958 10.5208 12 10.2833 12 10C12 9.71667 12.0958 9.47917 12.2875 9.2875C12.4792 9.09583 12.7167 9 13 9C13.2833 9 13.5208 9.09583 13.7125 9.2875C13.9042 9.47917 14 9.71667 14 10C14 10.2833 13.9042 10.5208 13.7125 10.7125C13.5208 10.9042 13.2833 11 13 11ZM4.025 9.45C3.90833 7.68333 4.44167 6.16667 5.625 4.9C6.80833 3.63333 8.28333 3 10.05 3C11.5333 3 12.8375 3.47083 13.9625 4.4125C15.0875 5.35417 15.7667 6.55833 16 8.025C14.4833 8.00833 13.0875 7.6 11.8125 6.8C10.5375 6 9.55833 4.91667 8.875 3.55C8.60833 4.88333 8.04583 6.07083 7.1875 7.1125C6.32917 8.15417 5.275 8.93333 4.025 9.45Z" 
      fill="white"
    />
  </Svg>
);

const ProgressRing = ({ progress = 0.35, size = 60, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const percentage = Math.round(progress * 100);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="#FFDBCC" 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        <Circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="#FF7B00" 
          strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#A04100' }}>{percentage}%</Text>
      </View>
    </View>
  );
};

const TimelineItem = ({ isCompleted, isActive, title, description, iconName, showLine }: any) => {
  const getIconColor = () => {
    if (title === "Documents Received") return '#FFFFFF';
    if (isCompleted) return '#10B981';
    if (isActive) return '#FF7B00';
    return '#9CA3AF';
  };

  const getBgColor = () => {
    if (title === "Documents Received") return '#3C6A00';
    if (isCompleted) return '#D1FAE5';
    if (isActive) return '#FFEEE5';
    return '#F3F4F6';
  };

  const getBorderRadius = () => {
    if (title === "Documents Received") return 9999;
    return 16;
  };

  return (
    <View style={{ flexDirection: 'row', width: '100%', minHeight: 60 }}>
      <View style={{ alignItems: 'center', marginRight: 16, width: 32 }}>
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: getBorderRadius(), 
          backgroundColor: getBgColor(), 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Ionicons name={iconName as any} size={18} color={getIconColor()} />
        </View>
        {showLine && (
          <View style={{ 
            flex: 1, 
            width: 2, 
            backgroundColor: isCompleted ? '#10B981' : '#E5E7EB',
            marginVertical: 4
          }} />
        )}
      </View>
      <View style={{ flex: 1, paddingBottom: 12 }}>
        <Text style={{ 
          fontSize: 15, 
          fontWeight: '600', 
          color: '#231A11',
          marginBottom: 4
        }}>
          {title}
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#5A4136', 
          lineHeight: 20 
        }}>
          {description}
        </Text>
      </View>
    </View>
  );
};

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

export default function KYCStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { myVendor, fetchMyVendor } = useVendorStore();
  const { user, updateUser } = useAuthStore();
  const [kycVisible, setKycVisible] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Phone state
  const initialPhone = myVendor?.phone_number || user?.phone || '';
  const [phoneNumber, setPhoneNumber] = useState(formatPhoneNumber(initialPhone));
  const [countryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(25);
  const inputRefs = useRef<TextInput[]>([]);

  const refreshKycStatus = useCallback(async () => {
    try {
      await fetchMyVendor();
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || null;
      updateUser({
        kyc_status: serverStatus,
        is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
        kyc_submitted_at: response?.data?.submitted_at || null,
        kyc_verified_at: response?.data?.verified_at || null,
      } as any);
    } catch (error) {
      console.warn('Failed to refresh KYC status:', error);
    } finally {
      setLoadingStatus(false);
    }
  }, [fetchMyVendor, updateUser]);

  useEffect(() => {
    refreshKycStatus();
  }, [refreshKycStatus]);

  const status = (user as any)?.kyc_status || (myVendor as any)?.kyc_status || null;
  const isVerified = status === 'verified';
  const isReview = status === 'verified' || status === 'pending' || status === 'manual_review';
  const isRejected = !isReview && status === 'rejected';

  const handleBack = useCallback(() => {
    if (otpSent && !phoneVerified) {
      setOtpSent(false);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/vendor' as any);
    }
  }, [otpSent, phoneVerified, router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  useEffect(() => {
    if (otpSent && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, resendTimer]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      await sendNettyfishOTP(fullPhone);
      setOtpSent(true);
      setResendTimer(25);
      setOtp(['', '', '', '']);
      Alert.alert('Success', `OTP sent successfully to ${fullPhone}`);
    } catch (error: any) {
      console.warn('Failed to send OTP:', error);
      Alert.alert('Error', error?.response?.data?.detail || error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || otpLoading) return;
    await handleSendOTP();
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '');

    if (cleanValue.length > 1) {
      const digits = cleanValue.split('');
      const newOtp = [...otp];
      // If the pasted/autofilled value is 4 digits, always start from index 0
      const startIdx = digits.length === 4 ? 0 : index;
      for (let i = 0; i < digits.length; i++) {
        if (startIdx + i < 4) {
          newOtp[startIdx + i] = digits[i];
        }
      }
      setOtp(newOtp);
      
      const lastFocusedIdx = Math.min(startIdx + digits.length - 1, 3);
      inputRefs.current[lastFocusedIdx]?.focus();
      
      if (newOtp.every((digit) => digit !== '')) {
        verifyCode(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanValue.slice(-1);
    setOtp(newOtp);
    
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
    if (otpLoading) return;
    setOtpLoading(true);
    try {
      const trimmedCode = code.trim();
      const fullPhone = `${countryCode}${phoneNumber}`;
      await verifyNettyfishOTP(fullPhone, trimmedCode);
      setPhoneVerified(true);
      setOtpSent(false);
      Alert.alert('Success', 'Phone number verified successfully!');
    } catch (error: any) {
      console.warn('Failed to verify OTP:', error);
      Alert.alert('Error', error?.response?.data?.detail || error?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      Alert.alert('Error', 'Please enter the 4-digit OTP');
      return;
    }
    await verifyCode(code);
  };

  const getKYCAlertBg = () => {
    if (isVerified) return '#E8F5E9';
    if (isReview) return '#FFF9E6';
    if (isRejected) return '#FFEBEE';
    return '#FFF4ED';
  };

  const getKYCAlertColor = () => {
    if (isVerified) return '#2E7D32';
    if (isReview) return '#D97706';
    if (isRejected) return '#C62828';
    return '#F26522';
  };

  const getKYCAlertText = () => {
    if (isVerified) return 'KYC Verified! You are all set.';
    if (isReview) return 'Your KYC request is currently under review. This process usually takes up to 24 hours. Awaiting Admin Approval.';
    if (isRejected) return `Your KYC was rejected. Reason: ${(user as any)?.kyc_rejection_reason || 'Please submit valid documents.'}`;
    return 'Complete KYC to continue.';
  };

  if (otpSent && !phoneVerified) {
    return (
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={styles.otpFullScreenContainer}
      >
        <View style={styles.otpMandalaContainer}>
          <View style={styles.otpMandalaCircle} />
          <View style={[styles.otpMandalaCircle, styles.otpMandalaCircle2]} />
        </View>

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.otpHeader}>
            <TouchableOpacity style={styles.otpHeaderBackButton} onPress={() => setOtpSent(false)}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M15.375 5.25L8.625 12L15.375 18.75" stroke="black" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
            <Text style={styles.otpTitle}>Enter OTP</Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.otpScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.otpSubtitle}>
                We have sent a 4 digit OTP to{"\n"}
                <Text style={styles.otpSubtitleBold}>+91 {phoneNumber}</Text>
              </Text>

              <View style={{ height: 80 }} />

              <View style={styles.otpInputsRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref!; }}
                    style={[styles.otpDigitInput, otp[index] && styles.otpDigitInputFilled]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={4}
                    selectTextOnFocus
                    textContentType="oneTimeCode"
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                  />
                ))}
              </View>

              {otpLoading ? (
                <ActivityIndicator color="#F26522" style={{ marginTop: 16 }} />
              ) : null}

              <View style={styles.otpResendContainer}>
                <Text style={styles.otpDidNotReceiveText}>{"Didn't receive OTP?"}</Text>
                <TouchableOpacity 
                  onPress={handleResend} 
                  disabled={resendTimer > 0}
                  style={{ marginTop: 4 }}
                >
                  <Text style={[styles.otpResendText, resendTimer > 0 && styles.otpResendTextDisabled]}>
                    {resendTimer > 0 ? `Resend OTP in 00:${String(resendTimer).padStart(2, '0')}` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 170 }} />

              <View style={styles.otpNoteCard}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <Path d="M12 1L20.2169 2.82598C20.6745 2.92766 21 3.33347 21 3.80217V13.7889C21 15.795 19.9974 17.6684 18.3282 18.7812L12 23L5.6718 18.7812C4.00261 17.6684 3 15.795 3 13.7889V3.80217C3 3.33347 3.32553 2.92766 3.78307 2.82598L12 1ZM12 3.04879L5 4.60434V13.7889C5 15.1263 5.6684 16.3752 6.7812 17.1171L12 20.5963L17.2188 17.1171C18.3316 16.3752 19 15.1263 19 13.7889V4.60434L12 3.04879ZM16.4524 8.22183L17.8666 9.63604L11.5026 16L7.25999 11.7574L8.67421 10.3431L11.5019 13.1709L16.4524 8.22183Z" fill="#F26522"/>
                </Svg>
                <Text style={styles.otpNoteText}>This number will be used for all future communications regarding your request.</Text>
              </View>
            </ScrollView>

            <View style={styles.otpBottomButtonContainer}>
              <TouchableOpacity 
                style={styles.otpPrimaryBtn} 
                onPress={handleVerifyOTP} 
                disabled={otpLoading || otp.some((digit) => !digit)} 
                activeOpacity={0.8}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.otpPrimaryBtnText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const submissionDate = (user as any)?.kyc_submitted_at 
    ? new Date((user as any).kyc_submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const approvalDate = (user as any)?.kyc_verified_at 
    ? new Date((user as any).kyc_verified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
  const requestId = "BR-" + (myVendor?.id ? myVendor.id.slice(0, 6).toUpperCase() : "8921");

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={isReview ? [0, 0.1058, 0.2212] : [0, 0.0913, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={isReview ? ['top', 'bottom'] : ['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            {isReview ? <CustomBackIcon /> : <Ionicons name="chevron-back" size={24} color="#000000" />}
          </TouchableOpacity>
          <Text style={isReview ? styles.titleText : styles.title}>
            {isReview ? 'Request Status' : 'Verify Your Number & KYC'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loadingStatus ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#F26522" />
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={isReview ? styles.scrollContentStatus : styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isReview ? (
              <>
                {/* Status Card */}
                <View style={styles.statusCard}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.statusCardLabel}>REQUEST #{requestId}</Text>
                    <Text style={styles.statusCardTitle}>
                      {status === 'verified' ? 'Approved' : 'In Review'}
                    </Text>
                    <Text style={styles.statusCardSubtitle}>
                      {status === 'verified' ? `Approved on ${approvalDate}` : `Submitted on ${submissionDate}`}
                    </Text>
                  </View>
                  <ProgressRing progress={status === 'verified' ? 1.0 : 0.35} />
                </View>

                {/* Next Steps Section */}
                <View style={styles.nextStepsSection}>
                  <Text style={styles.sectionHeading}>Next Steps</Text>
                  
                  <View style={{ marginTop: 16 }}>
                    <TimelineItem 
                      isCompleted={true}
                      isActive={false}
                      title="Documents Received"
                      description="Successfully uploaded all KYC files."
                      iconName="checkmark"
                      showLine={true}
                    />
                    
                    <TimelineItem 
                      isCompleted={status === 'verified'}
                      isActive={status !== 'verified'}
                      title="Final Approval"
                      description="Quality check by our verification experts."
                      iconName={status === 'verified' ? 'checkmark' : 'sync'}
                      showLine={true}
                    />
                    
                    <TimelineItem 
                      isCompleted={status === 'verified'}
                      isActive={false}
                      title="Business Profile Live"
                      description="Your business visible to the community."
                      iconName={status === 'verified' ? 'checkmark' : 'settings'}
                      showLine={false}
                    />
                  </View>
                </View>

                {/* What to Expect Box */}
                <View style={styles.expectBox}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <Ionicons 
                      name={status === 'verified' ? 'checkmark-circle' : 'information-circle'} 
                      size={24} 
                      color={status === 'verified' ? '#10B981' : '#D97706'} 
                      style={{ marginTop: 2 }} 
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.expectBoxTitle}>
                        {status === 'verified' ? 'Verification Complete' : 'What to Expect'}
                      </Text>
                      <Text style={styles.expectBoxDescription}>
                        {status === 'verified' 
                          ? 'Your business is now fully verified and live on Brahmand! You can start managing your business from the vendor dashboard.' 
                          : 'Our team is currently verifying your business details. You will receive a push notification once the process is complete.'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                  <TouchableOpacity 
                    style={styles.contactSupportBtn}
                    onPress={() => {
                      Linking.openURL('tel:9326097414').catch((err) => {
                        console.error('Failed to open dialer:', err);
                        Alert.alert("Support", "Could not initiate call. Please dial: 9326097414");
                      });
                    }}
                  >
                    <SupportIcon style={{ marginRight: 8 }} />
                    <Text style={styles.contactSupportBtnText}>Contact Support</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.backHomeBtn}
                    onPress={() => router.replace('/(tabs)/vendor' as any)}
                  >
                    <Text style={styles.backHomeBtnText}>Back to Home</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Middle Illustration Cards Section */}
                <View style={styles.illustrationContainer}>
                  <View style={styles.padlockCard}>
                    <PadlockIcon />
                  </View>
                  
                  <View style={styles.shieldCenter}>
                    <ShieldIcon />
                  </View>

                  <View style={styles.placeholderCard}>
                    <View style={styles.avatarCircle} />
                    <View style={styles.profileLinesColumn}>
                      <View style={styles.profileLine} />
                      <View style={[styles.profileLine, { width: 20 }]} />
                    </View>
                  </View>
                </View>

                {/* Intro paragraph text */}
                <Text style={styles.introParagraph}>
                  To create and register your request, you need{"\n"}to verify your number and be a KYC verified{"\n"}member.
                </Text>

                {/* Card 1: Verify Your Number */}
                <View style={styles.whiteCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeCircle}>
                      <Text style={styles.badgeText}>1</Text>
                    </View>
                    <View style={styles.cardHeaderTexts}>
                      <Text style={styles.cardTitle}>Verify Your Number</Text>
                      <Text style={styles.cardDescription}>{"We'll send a 4 digit OTP to verify your"}{"\n"}mobile number.</Text>
                    </View>
                  </View>

                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryDropdown}>
                      <Text style={styles.countryText}>{countryCode}</Text>
                      <Ionicons name="chevron-down" size={14} color="#666666" />
                    </View>
                    <TextInput
                      style={styles.phoneNumberInput}
                      placeholder="Enter your mobile number"
                      placeholderTextColor="#999999"
                      value={phoneNumber}
                      onChangeText={(text) => {
                        const formatted = formatPhoneNumber(text);
                        setPhoneNumber(formatted);
                      }}
                      keyboardType="phone-pad"
                      maxLength={phoneNumber.length >= 10 ? 10 : 30}
                      editable={!phoneVerified}
                    />
                  </View>

                  {phoneVerified ? (
                    <View style={styles.verifiedSuccessBox}>
                      <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                      <Text style={styles.verifiedSuccessText}>Mobile number verified successfully</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.primaryBtn, otpLoading && { opacity: 0.7 }]} 
                      onPress={handleSendOTP}
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          Send OTP
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Card 2: Complete KYC Verification */}
                <View style={styles.whiteCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeCircle}>
                      <Text style={styles.badgeText}>2</Text>
                    </View>
                    <View style={styles.cardHeaderTexts}>
                      <Text style={styles.cardTitle}>Complete KYC Verification</Text>
                      <Text style={styles.cardDescription}>KYC helps us maintain trust and safety{"\n"}in the community.</Text>
                    </View>
                  </View>

                  <View style={[styles.warningBanner, { backgroundColor: getKYCAlertBg() }]}>
                    <WarningCardShieldIcon color={getKYCAlertColor()} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.warningTitle,
                        { color: getKYCAlertColor() }
                      ]}>
                        {isVerified ? 'KYC Verified' : 'Not KYC Verified'}
                      </Text>
                      <Text style={styles.warningDescription}>
                        {getKYCAlertText()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.primaryBtn, 
                      (!phoneVerified || isVerified) && styles.disabledBtn
                    ]} 
                    onPress={() => router.push({
                      pathname: '/kyc-submit',
                      params: { verifiedPhone: phoneNumber }
                    })}
                    disabled={!phoneVerified || isVerified}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isVerified ? 'Verified' : 'Complete KYC Now'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Disclaimer Footer */}
                <View style={styles.disclaimerContainer}>
                  <LockIcon />
                  <Text style={styles.disclaimerText}>
                    Your information is secure and never shared with anyone.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        )}

        <VendorKYCModal
          visible={kycVisible}
          onClose={() => setKycVisible(false)}
          vendorId={myVendor?.id || ''}
          allowUserKycFallback
          onKycUpdated={() => {
            setKycVisible(false);
            setLoadingStatus(true);
            refreshKycStatus();
          }}
        />
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
  refreshBtn: {
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
  },
  illustrationContainer: {
    flexDirection: 'row',
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  padlockCard: {
    width: 80,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#F26522',
  },
  shieldCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#F26522',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCard: {
    width: 96,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B9FFF',
  },
  profileLinesColumn: {
    gap: 4,
  },
  profileLine: {
    width: 32,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 9999,
  },
  introParagraph: {
    width: '100%',
    color: '#4A4A4A',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
    marginBottom: 24,
  },
  whiteCard: {
    width: '100%',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontWeight: '700',
  },
  cardHeaderTexts: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  cardDescription: {
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 50,
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  countryDropdown: {
    width: 70,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  countryText: {
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontWeight: '500',
  },
  phoneNumberInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  otpFieldInput: {
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 4,
  },
  verifiedSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 4,
  },
  verifiedSuccessText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    backgroundColor: '#F26522',
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
  resendLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  resendLinkText: {
    color: '#F26522',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  warningBanner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    marginTop: 4,
  },
  warningTitle: {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 2,
    color: '#2D2D2D',
  },
  warningDescription: {
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    gap: 8,
  },
  disclaimerText: {
    color: '#777777',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 21,
    flexShrink: 1,
  },
  otpFullScreenContainer: {
    flex: 1,
  },
  otpMandalaContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.08,
  },
  otpMandalaCircle: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  otpMandalaCircle2: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  otpHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    marginBottom: 44,
  },
  otpHeaderBackButton: {
    position: 'absolute',
    left: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  otpScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 0,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontStyle: 'normal',
    lineHeight: 39,
  },
  otpSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontStyle: 'normal',
    fontWeight: '400',
  },
  otpSubtitleBold: {
    fontSize: 16,
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontStyle: 'normal',
    fontWeight: '600',
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpDigitInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  otpDigitInputFilled: {
    borderWidth: 2,
    borderColor: '#F26522',
  },
  otpResendContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  otpDidNotReceiveText: {
    color: '#4A4A4A',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 22.5,
  },
  otpResendText: {
    color: '#F26522',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 22.5,
  },
  otpResendTextDisabled: {
    color: '#999999',
  },
  otpNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    minHeight: 85,
    alignSelf: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  otpNoteText: {
    flex: 1,
    color: '#4A4A4A',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 22.75,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  otpPrimaryBtn: {
    backgroundColor: '#F26522',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  otpPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  otpBottomButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  scrollContentStatus: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 17,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statusCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFDBCC',
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusCardLabel: {
    color: '#A04100',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statusCardTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginVertical: 2,
  },
  statusCardSubtitle: {
    color: '#5A4136',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  nextStepsSection: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  sectionHeading: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  expectBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE1D3',
    backgroundColor: 'rgba(235, 225, 211, 0.3)',
    padding: 16,
    alignSelf: 'center',
  },
  expectBoxTitle: {
    color: '#353127',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  expectBoxDescription: {
    color: '#4C463B',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22.75,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  bottomActions: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  contactSupportBtn: {
    width: '100%',
    height: 56,
    borderRadius: 45,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: 'rgba(255, 107, 0, 0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  contactSupportBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  backHomeBtn: {
    width: '100%',
    height: 56,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FF7B00',
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeBtnText: {
    color: '#A04100',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});
