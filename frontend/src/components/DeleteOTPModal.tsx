import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { Input } from './Input';
import { Button } from './Button';
import { sendNettyfishOTP } from '../services/api';
import { useTranslation } from '../utils/i18n';

interface DeleteOTPModalProps {
  visible: boolean;
  phoneNumber: string;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  title?: string;
  description?: string;
}

export const DeleteOTPModal: React.FC<DeleteOTPModalProps> = ({
  visible,
  phoneNumber,
  onClose,
  onVerify,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (visible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visible, timer]);

  useEffect(() => {
    if (visible) {
      setOtp('');
      sendInitialOTP();
    }
  }, [visible]);

  const sendInitialOTP = async () => {
    if (!phoneNumber) return;
    setSendingOTP(true);
    try {
      await sendNettyfishOTP(phoneNumber);
      setTimer(30);
    } catch (error: any) {
      console.warn('Failed to send OTP:', error);
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error',
        error?.response?.data?.detail || error?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    await sendInitialOTP();
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert(
        t('language') === 'hi' ? 'अमान्य OTP' : 'Invalid OTP',
        t('language') === 'hi' ? 'कृपया सही OTP दर्ज करें।' : 'Please enter a valid OTP.'
      );
      return;
    }
    setLoading(true);
    try {
      await onVerify(otp.trim());
      setOtp('');
    } catch (error: any) {
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error',
        error?.response?.data?.detail || error?.message || 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {title || (t('language') === 'hi' ? 'हटाने की पुष्टि करें' : 'Confirm Deletion')}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.description}>
                {description ||
                  (t('language') === 'hi'
                    ? `आपके पंजीकृत मोबाइल नंबर (${phoneNumber}) पर एक OTP भेजा गया है। जारी रखने के लिए इसे दर्ज करें।`
                    : `An OTP has been sent to your registered mobile number (${phoneNumber}). Please enter it to continue.`)}
              </Text>

              <View style={styles.inputContainer}>
                <Input
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading && !sendingOTP}
                  autoFocus
                />
              </View>

              <Button
                title={t('language') === 'hi' ? 'सत्यापित करें और हटाएं' : 'Verify & Delete'}
                onPress={handleVerify}
                loading={loading}
                disabled={loading || sendingOTP || otp.length < 4}
                style={styles.verifyButton}
              />

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResend}
                accessibilityRole="button"
                accessibilityLabel="Button"
                disabled={timer > 0 || sendingOTP || loading}
              >
                {sendingOTP ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={[styles.resendText, (timer > 0 || loading) && styles.resendTextDisabled]}>
                    {t('language') === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP'}
                    {timer > 0 ? ` (${timer}s)` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  container: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  verifyButton: {
    backgroundColor: COLORS.error,
    marginBottom: SPACING.md,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: COLORS.textSecondary,
  },
});
