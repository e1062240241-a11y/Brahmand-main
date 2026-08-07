import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ProfileCompletionCardProps {
  progress?: number; // percentage value e.g. 60
  onEditProfile?: () => void;
  onClose?: () => void;
  autoDismissMs?: number;
  style?: StyleProp<ViewStyle>;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  progress = 60,
  onEditProfile,
  onClose,
  autoDismissMs,
  style,
}) => {
  const router = useRouter();

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Progress Bar Fill Animation (0% to target progress)
    Animated.timing(progressAnim, {
      toValue: Math.min(Math.max(progress, 0), 100) / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Auto dismiss if configured
    let dismissTimer: NodeJS.Timeout | null = null;
    if (autoDismissMs && onClose) {
      dismissTimer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
    }

    // 2. Sparkle Pulse/Rotate Loop
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1.25,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    // 3. CTA Button Pulse Every ~2.5 Seconds
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    sparkleLoop.start();
    pulseLoop.start();

    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
      sparkleLoop.stop();
      pulseLoop.stop();
    };
  }, [progress, progressAnim, sparkleAnim, pulseAnim, autoDismissMs, onClose]);

  const handlePress = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      router.push('/vendor/dashboard');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.cardContainer, style]}>
      {/* Header with Sparkle Icon */}
      <View style={styles.headerRow}>
        <Animated.View
          style={[
            styles.sparkleBg,
            { transform: [{ scale: sparkleAnim }] },
          ]}
        >
          <Ionicons name="sparkles" size={22} color="#F97316" />
        </Animated.View>
        <Text style={styles.headerTitle}>Make Your Business Shine</Text>

        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Message Body */}
      <View style={styles.bodySection}>
        <Text style={styles.successTitle}>
          Your business has been created successfully.
        </Text>
        <Text style={styles.successSubtext}>
          Businesses with complete profiles receive more views and build greater customer trust.
        </Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>

        {/* Outer Bar Track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillContainer, { width: progressWidth }]}>
            <LinearGradient
              colors={['#FF8D57', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
          </Animated.View>
        </View>
      </View>

      {/* CTA Pulsing Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%', marginTop: 20 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaButtonWrapper}
          onPress={handlePress}
        >
          <LinearGradient
            colors={['#FF6600', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            <Text style={styles.ctaButtonText}>Edit Business Profile</Text>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FFD3B6',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginVertical: 12,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sparkleBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#231917',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    flex: 1,
  },
  bodySection: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  successSubtext: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  progressSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F97316',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  progressTrack: {
    height: 12,
    width: '100%',
    backgroundColor: '#FFECE0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFillContainer: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
  },
  ctaButtonWrapper: {
    width: '100%',
    height: 52,
    borderRadius: 45,
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 45,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});
