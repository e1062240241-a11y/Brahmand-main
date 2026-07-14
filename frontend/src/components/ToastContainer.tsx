import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ToastMessage, useToastStore } from '../store/toastStore';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const { hideToast } = useToastStore();
  const actions = toast.actions;

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

    const duration = actions && actions.length > 0 ? 10000 : toast.duration;

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

  const handleTap = () => {
    if (toast.onPress) {
      toast.onPress();
    } else if (actions && actions.length > 0) {
      actions[0].onPress();
    }
    dismiss();
  };

  const { user } = useAuthStore();
  const displayPhoto = toast.avatarUrl || user?.photo;
  const hasPhoto = !!(
    displayPhoto &&
    displayPhoto !== 'nan' &&
    displayPhoto !== 'NaN' &&
    displayPhoto !== 'None' &&
    displayPhoto !== ''
  );

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.toastItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          minHeight: 62,
          paddingRight: 11,
        },
      ] as any}
      onPress={handleTap}
    >
      {Platform.OS !== 'web' ? (
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(10px)' } as any]} />
      )}
      <View style={styles.contentContainer}>
        <View style={styles.messageRow}>
          {hasPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="notifications-outline" size={20} color="#FF6600" />
            </View>
          )}
          <View style={styles.textContainer}>
            {toast.title ? (
              <Text style={styles.titleText} numberOfLines={2} ellipsizeMode="tail">
                {toast.title}
              </Text>
            ) : null}
            <Text style={styles.messageText}>{toast.message}</Text>
          </View>
        </View>

        {actions && actions.length > 0 && (
          <View style={[
            styles.actionsContainer,
            actions.length > 2 && {
              flexDirection: 'column',
              alignItems: 'stretch',
            }
          ]}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionBtn,
                  actions.length > 2 && {
                    width: '100%',
                    paddingVertical: 10,
                  },
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
    </AnimatedTouchableOpacity>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 16 }] as any} pointerEvents="box-none">
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
    width: 373,
    maxWidth: '90%',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 11,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: 'rgba(0, 0, 0, 0.50)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 10,
    alignSelf: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  avatarImage: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    marginRight: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  avatarPlaceholder: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Outfit_600SemiBold' : 'Outfit',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Inter_400Regular' : 'System',
    fontWeight: '400',
    lineHeight: 14,
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
    backgroundColor: 'rgba(46, 28, 26, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(46, 28, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionBtnCancel: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(46, 28, 26, 0.15)',
  },
  actionText: {
    color: '#2E1C1A',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Outfit_600SemiBold' : 'Outfit',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionTextDestructive: {
    color: '#EF4444',
  },
  actionTextCancel: {
    color: '#5C4643',
  },
});
