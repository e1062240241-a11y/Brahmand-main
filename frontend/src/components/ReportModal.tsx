import React, { useState, useEffect, useRef } from 'react';
import {Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView} from 'react-native';
import { useSafeAreaInsets, SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import {
  submitReport,
  ReportReason,
  ContentType,
} from '../services/firebase/moderationService';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reporterUid: string;
  reportedUserUid: string;
  contentId: string;
  contentType: ContentType;
  postId?: string;
  apiFallback?: (reason: ReportReason, description?: string) => Promise<void>;
  /** Optional success callback called after report is submitted */
  onSuccess?: (reason: ReportReason) => void;
}

const REASONS: { key: ReportReason; label: string; icon: string }[] = [
  { key: 'spam', label: 'Spam', icon: 'alert-circle-outline' },
  { key: 'harassment', label: 'Harassment', icon: 'hand-left-outline' },
  { key: 'hate_speech', label: 'Hate Speech', icon: 'megaphone-outline' },
  { key: 'violence', label: 'Violence', icon: 'warning-outline' },
  { key: 'sexual_content', label: 'Sexual Content', icon: 'eye-off-outline' },
  { key: 'fake_profile', label: 'Fake Profile', icon: 'person-remove-outline' },
  { key: 'scam_fraud', label: 'Scam / Fraud', icon: 'card-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

type Step = 'select' | 'submitting' | 'success';

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  reporterUid,
  reportedUserUid,
  contentId,
  contentType,
  postId,
  apiFallback,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('select');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const submittingRef = useRef(false);

  const reset = () => {
    setStep('select');
    setSelectedReason(null);
    setDescription('');
    setError(null);
    submittingRef.current = false;
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      reset();
    }
  }, [visible]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason || submittingRef.current) return;
    submittingRef.current = true;
    setStep('submitting');
    setError(null);

    try {
      await submitReport({
        reporterUid,
        reportedUserUid,
        contentId,
        contentType,
        postId,
        reason: selectedReason,
        description,
      });
    } catch (firebaseErr: any) {
      console.warn('[ReportModal] Firebase write failed, trying API fallback:', firebaseErr);
      // Try API fallback if provided
      if (apiFallback) {
        try {
          await apiFallback(selectedReason, description);
        } catch (apiErr: any) {
          console.warn('[ReportModal] API fallback also failed:', apiErr);
          const errMsg = apiErr?.response?.data?.detail || apiErr?.message || 'Could not submit report. Please check your connection and try again.';
          setError(errMsg);
          setStep('select');
          submittingRef.current = false;
          return;
        }
      } else {
        const errMsg = firebaseErr?.message || 'Could not submit report. Please check your connection and try again.';
        setError(errMsg);
        setStep('select');
        submittingRef.current = false;
        return;
      }
    }

    setStep('success');
    submittingRef.current = false;
    if (onSuccess) {
      onSuccess(selectedReason);
    }
  };

  const modalContent = (
    <View style={styles.overlay}>
      <ContextSafeAreaView style={[styles.sheet, { paddingBottom: Platform.OS === 'android' ? 16 : Math.max(insets.bottom, 24) }]} edges={['bottom']}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {step === 'select' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Report</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close report" accessibilityRole="button">
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Why are you reporting this?</Text>

            <KeyboardAwareScrollView
              style={Platform.OS === 'android' ? styles.scrollView : undefined}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reasonList}
              keyboardShouldPersistTaps="handled"
            >
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.reasonRow,
                    selectedReason === r.key && styles.reasonRowSelected,
                  ]}
                  onPress={() => setSelectedReason(r.key)}
                  accessibilityLabel={r.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedReason === r.key }}
                >
                  <Ionicons
                    name={r.icon as any}
                    size={22}
                    color={selectedReason === r.key ? COLORS.primary : '#555'}
                    style={styles.reasonIcon}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === r.key && styles.reasonLabelSelected,
                    ]}
                  >
                    {r.label}
                  </Text>
                  {selectedReason === r.key && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Additional comments (optional)"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
                <Text style={styles.charCount}>
                  {description.length}/200
                </Text>
              </View>
            </KeyboardAwareScrollView>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                !selectedReason && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason}
              accessibilityLabel="Submit report"
              accessibilityRole="button"
              accessibilityState={{ disabled: !selectedReason }}
            >
              <Text style={styles.submitText}>Submit Report</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'submitting' && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.submittingText}>Submitting...</Text>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.centerContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Report Submitted</Text>
            <Text style={styles.successMessage}>
              Thank you. Your report has been submitted for review.
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleClose}
              accessibilityLabel="Done"
              accessibilityRole="button"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ContextSafeAreaView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {modalContent}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    maxHeight: Platform.OS === 'android' ? '90%' : '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 9999,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontWeight: '500',
  },
  reasonList: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 10 : 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: Platform.OS === 'android' ? 6 : 8,
    backgroundColor: '#FDFBF7',
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
  },
  reasonRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5EB',
  },
  reasonIcon: {
    marginRight: 14,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  reasonLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#E8E0D8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  submittingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  successIcon: {
    marginBottom: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 9999,
    padding: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 54,
    paddingVertical: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textInputContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E8E0D8',
    borderRadius: 14,
    padding: 14,
    minHeight: Platform.OS === 'android' ? 70 : 90,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
    backgroundColor: '#FCF9F6',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
  scrollView: {
    flexShrink: 1,
  },
});
