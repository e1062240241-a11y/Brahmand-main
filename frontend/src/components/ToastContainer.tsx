import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { ToastMessage, useToastStore } from '../store/toastStore';

const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
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
        toValue: -20,
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
          icon: <Ionicons name="checkmark" size={18} color="#12B76A" />,
          containerStyle: { borderColor: 'rgba(18, 183, 106, 0.15)', backgroundColor: '#F6FEF9' },
          title: 'Success',
        };
      case 'error':
        return {
          icon: <Ionicons name="alert-outline" size={18} color="#F04438" />,
          containerStyle: { borderColor: 'rgba(240, 68, 56, 0.15)', backgroundColor: '#FEF3F2' },
          title: 'Error',
        };
      default:
        return {
          icon: <Ionicons name="information-outline" size={18} color="#0086C9" />,
          containerStyle: { borderColor: 'rgba(0, 134, 201, 0.15)', backgroundColor: '#F0F9FF' },
          title: 'Information',
        };
    }
  };

  const { icon, containerStyle, title } = getStatusDetails();

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
          <View style={[styles.iconWrapper, containerStyle]}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F2F4F7',
  },
  contentContainer: {
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 2,
    fontFamily: 'System',
  },
  messageText: {
    fontSize: 13,
    color: '#475467',
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary || '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  actionBtnDestructive: {
    backgroundColor: '#D92D20',
  },
  actionBtnCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  actionTextDestructive: {
    color: '#FFFFFF',
  },
  actionTextCancel: {
    color: '#344054',
  },
});
