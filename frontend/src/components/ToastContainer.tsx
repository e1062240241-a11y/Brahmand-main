import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastMessage, useToastStore } from '../store/toastStore';

const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const { hideToast } = useToastStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

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
        toValue: -30,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast(toast.id);
    });
  };

  const getStatusDetails = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <Ionicons name="checkmark-circle" size={20} color="#34D399" />,
          borderColor: 'rgba(52, 211, 153, 0.25)',
          title: 'Success',
        };
      case 'error':
        return {
          icon: <Ionicons name="alert-circle" size={20} color="#F87171" />,
          borderColor: 'rgba(248, 113, 113, 0.25)',
          title: 'Error',
        };
      default:
        return {
          icon: <Ionicons name="information-circle" size={20} color="#FBBF24" />,
          borderColor: 'rgba(251, 191, 36, 0.25)',
          title: 'Info',
        };
    }
  };

  const { icon, borderColor, title } = getStatusDetails();

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderColor: borderColor,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.messageRow}>
          <View style={styles.iconWrapper}>
            {icon}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.messageText}>{toast.message}</Text>
          </View>
          {(!toast.actions || toast.actions.length === 0) && (
            <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#98A2B3" />
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
    <View style={[styles.container, { top: insets.top + 16 }]} pointerEvents="box-none">
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
  },
  toastItem: {
    backgroundColor: '#1E2229',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
  },
  contentContainer: {
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  iconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Outfit_600SemiBold' : 'Outfit',
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#D0D5DD',
    fontFamily: Platform.OS === 'ios' ? 'Inter_400Regular' : 'System',
    lineHeight: 18,
  },
  closeButton: {
    padding: 2,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnDestructive: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  actionBtnCancel: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Outfit_600SemiBold' : 'Outfit',
    fontWeight: '600',
  },
  actionTextDestructive: {
    color: '#F87171',
  },
  actionTextCancel: {
    color: '#98A2B3',
  },
});
