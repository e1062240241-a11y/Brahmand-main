/**
 * ReportModal - Reusable Apple Guideline 1.2 compliant report flow
 *
 * Shows reason selection → submit → confirmation message
 * Stores report in Firebase moderation_reports collection
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
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
  /** Optional fallback API call if Firebase fails */
  apiFallback?: (reason: ReportReason, description?: string) => Promise<void>;
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
  apiFallback,
}) => {
  const [step, setStep] = useState<Step>('select');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('select');
    setSelectedReason(null);
    setDescription('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setStep('submitting');
    setError(null);

    try {
      await submitReport({
        reporterUid,
        reportedUserUid,
        contentId,
        contentType,
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
          return;
        }
      } else {
        const errMsg = firebaseErr?.message || 'Could not submit report. Please check your connection and try again.';
        setError(errMsg);
        setStep('select');
        return;
      }
    }

    setStep('success');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {step === 'select' && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Report</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close report">
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>Why are you reporting this?</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.reasonList}
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
              </ScrollView>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !selectedReason && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason}
                accessibilityLabel="Submit report"
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
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 8,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  reasonList: {
    paddingBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reasonRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5EE',
  },
  reasonIcon: {
    marginRight: 12,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222',
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
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  submittingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#555',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#333',
    marginVertical: 12,
    textAlignVertical: 'top',
    backgroundColor: '#F9F9F9',
  },
});
