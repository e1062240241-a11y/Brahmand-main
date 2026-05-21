import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { ToastMessage, useToastStore } from '../store/toastStore';

const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const { hideToast } = useToastStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // If there are actions, we want a longer duration so the user has time to click
    const duration = toast.actions && toast.actions.length > 0 ? 10000 : toast.duration;

    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast(toast.id);
    });
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Ionicons name="checkmark-circle-outline" size={22} color="#34C759" />;
      case 'error':
        return <Ionicons name="alert-circle-outline" size={22} color="#FF3B30" />;
      default:
        return <Ionicons name="information-circle-outline" size={22} color="#007AFF" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.messageRow}>
          <View style={styles.iconContainer}>{getIcon()}</View>
          <Text style={styles.messageText}>{toast.message}</Text>
          {(!toast.actions || toast.actions.length === 0) && (
            <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#AEAEB2" />
            </TouchableOpacity>
          )}
        </View>
        
        {toast.actions && toast.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {toast.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionBtn,
                  action.style === 'destructive' && styles.actionBtnDestructive,
                  action.style === 'cancel' && styles.actionBtnCancel,
                ]}
                onPress={() => {
                  action.onPress();
                  dismiss();
                }}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.style === 'destructive' && styles.actionTextDestructive,
                    action.style === 'cancel' && styles.actionTextCancel,
                  ]}
                >
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 20 }]}>
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  toastItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentContainer: {
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginRight: 10,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'System',
    lineHeight: 18,
  },
  closeButton: {
    padding: 2,
    marginLeft: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 10,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary || '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDestructive: {
    backgroundColor: '#FF3B30',
  },
  actionBtnCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  actionTextDestructive: {
    color: '#FFFFFF',
  },
  actionTextCancel: {
    color: '#E5E5EA',
  },
});
