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
          icon: <Ionicons name="checkmark" size={14} color="#12B76A" />,
          containerStyle: { borderColor: 'rgba(18, 183, 106, 0.15)', backgroundColor: '#F6FEF9' },
          title: 'Success',
        };
      case 'error':
        return {
          icon: <Ionicons name="alert-outline" size={14} color="#F04438" />,
          containerStyle: { borderColor: 'rgba(240, 68, 56, 0.15)', backgroundColor: '#FEF3F2' },
          title: 'Error',
        };
      default:
        return {
          icon: <Ionicons name="information-outline" size={14} color="#0086C9" />,
          containerStyle: { borderColor: 'rgba(0, 134, 201, 0.15)', backgroundColor: '#F0F9FF' },
          title: 'Info',
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
            <Text style={styles.messageText}>
              <Text style={styles.titleText}>{title}: </Text>
              {toast.message}
            </Text>
          </View>
          {(!toast.actions || toast.actions.length === 0) && (
            <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
              <Ionicons name="close" size={16} color="#98A2B3" />
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
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignSelf: 'center',
    maxWidth: '100%',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F2F4F7',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101828',
    fontFamily: 'System',
  },
  messageText: {
    fontSize: 13,
    color: '#475467',
    fontWeight: '400',
    fontFamily: 'System',
  },
  closeButton: {
    padding: 4,
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    paddingTop: 8,
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary || '#FF6600',
  },
  actionBtnDestructive: {
    borderBottomColor: '#D92D20',
  },
  actionBtnCancel: {
    borderBottomColor: '#667085',
  },
  actionText: {
    color: COLORS.primary || '#FF6600',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  actionTextDestructive: {
    color: '#D92D20',
  },
  actionTextCancel: {
    color: '#667085',
  },
});
