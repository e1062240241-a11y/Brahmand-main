import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Pressable, Platform, Modal } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const backdropOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const defaultTitle = t('language') === 'hi' ? 'पोस्ट हटाएं' : 'Delete Post';
  const defaultDesc = t('language') === 'hi'
    ? 'क्या आप वाकई इस पोस्ट को हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।'
    : 'Are you sure you want to delete this post? This action cannot be undone.';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Dialog Box */}
        <Animated.View style={[styles.dialogContainer, { transform: [{ scale }] }]}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="trash-outline"
              size={32}
              color="#D32F2F"
            />
          </View>

          <Text style={styles.title}>{title || defaultTitle}</Text>
          <Text style={styles.description}>{description || defaultDesc}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('language') === 'hi' ? 'रद्द करें' : 'Cancel'}>
              <Text style={styles.cancelButtonText}>{t('language') === 'hi' ? 'रद्द करें' : 'Cancel'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              accessibilityRole="button"
              accessibilityLabel={t('language') === 'hi' ? 'हटाएं' : 'Delete'}
              onPress={() => {
                onClose();
                onConfirm();
              }}
            >
              <Text style={styles.confirmButtonText}>{t('language') === 'hi' ? 'हटाएं' : 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  dialogContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
    backgroundColor: '#1E1E1E', // Matching dark theme aesthetics of post details
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#3D2020',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
