import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

export default function EntryAnimationScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [agreed, setAgreed] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (token) {
      router.replace('/feed');
      return;
    }

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale, router, token]);

  const handleContinue = () => {
    if (!agreed) return;

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/auth/phone');
    });
  };

  const handleOpenPrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  return (
    <LinearGradient
      colors={['#FF6600', '#FF9933']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.mandalaContainer}>
        <View style={styles.mandalaCircle} />
        <View style={[styles.mandalaCircle, styles.mandalaCircle2]} />
        <View style={[styles.mandalaCircle, styles.mandalaCircle3]} />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoBg}>
            <Text style={styles.omSymbol}>ॐ</Text>
          </View>
          <Text style={styles.appName}>Brahmand</Text>
          <Text style={styles.tagline}>The Sanatan Community</Text>
        </Animated.View>

        <View style={styles.bottomSection}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={handleOpenPrivacyPolicy}>
                Terms of Service and Community Guidelines
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, !agreed && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!agreed}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminLoginButton}
            onPress={() => router.push('/admin/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.adminLoginText}>Login as Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mandalaContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.08,
  },
  mandalaCircle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mandalaCircle2: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
  },
  mandalaCircle3: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 1.5,
  },
  logoBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  omSymbol: {
    fontSize: 80,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  appName: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: '100%',
    maxWidth: 420,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    lineHeight: 18,
  },
  termsText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  adminLoginButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  adminLoginText: {
    color: '#FFFFFF',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
