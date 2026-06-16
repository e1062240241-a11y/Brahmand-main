import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUploadStore } from '../store/uploadStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useTranslation } from '../utils/i18n';
import { usePathname } from 'expo-router';

export const UploadProgressBanner = () => {
  const { isUploading, progress, isCompressing, status, mediaType, reset } = useUploadStore();
  const { t } = useTranslation();
  const pathname = usePathname();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const progressWidthAnim = useRef(new Animated.Value(0)).current;

  const showBanner = status !== 'idle';

  useEffect(() => {
    if (showBanner) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showBanner]);

  useEffect(() => {
    Animated.timing(progressWidthAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!showBanner) return null;

  // Determine if we are on a tab page where the tab bar is visible.
  // Tab bar pages typically include home, messages, jaap, jobs, profile.
  const tabPages = ['/home', '/messages', '/jaap', '/jobs', '/profile'];
  const isTabPage = tabPages.some(page => pathname.startsWith(page)) || pathname === '/' || pathname === '';
  const bottomPosition = isTabPage ? 90 : 30;

  const progressWidth = progressWidthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getStatusText = () => {
    if (status === 'success') {
      return mediaType === 'video'
        ? (t('language') === 'hi' ? 'वीडियो सफलतापूर्वक अपलोड हो गया!' : 'Video uploaded successfully!')
        : (t('language') === 'hi' ? 'पोस्ट सफलतापूर्वक अपलोड हो गई!' : 'Post uploaded successfully!');
    }
    if (status === 'error') {
      return t('language') === 'hi' ? 'अपलोड विफल रहा। पुनः प्रयास करें।' : 'Upload failed. Try again.';
    }
    if (isCompressing || status === 'compressing') {
      return t('language') === 'hi' ? 'प्रक्रिया चल रही है...' : 'Processing...';
    }
    return t('language') === 'hi' ? `अपलोड हो रहा है ${progress}%...` : `Uploading ${progress}%...`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            {status === 'success' ? (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            ) : status === 'error' ? (
              <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            ) : isCompressing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name={mediaType === 'video' ? 'videocam' : 'image'}
                size={22}
                color={COLORS.primary}
              />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.statusText} numberOfLines={1}>
              {getStatusText()}
            </Text>
            {status !== 'success' && status !== 'error' && (
              <Text style={styles.subText} numberOfLines={1}>
                {t('language') === 'hi' ? 'कृपया ऐप चालू रखें' : 'Please keep the app open'}
              </Text>
            )}
          </View>

          {(status === 'success' || status === 'error') && (
            <TouchableOpacity onPress={reset} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {status !== 'success' && status !== 'error' && (
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.15)',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  subText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#F0E8E0',
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
