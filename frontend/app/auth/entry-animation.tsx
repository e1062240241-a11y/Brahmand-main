import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

const AnimatedText = ({ text, style, delay = 0, duration = 300 }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: duration,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, delay, duration]);

  return <Animated.Text style={[style, { opacity }]}>{text}</Animated.Text>;
};

export default function EntryAnimationScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [agreed, setAgreed] = useState(false);

  const containerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0)).current;

  const word = "Brahmand";
  const letterDelay = 120;
  const initialDelay = 500;
  const wordAnimationDuration = initialDelay + word.length * letterDelay + 400;

  useEffect(() => {
    if (token) {
      router.replace('/home');
      return;
    }

    Animated.sequence([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(initialDelay),
    ]).start();

    // Start text animation logic happens in AnimatedText components
    // and wait for it to finish before showing bottom elements
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(dotScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bottomOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, wordAnimationDuration);

  }, [containerOpacity, contentOpacity, bottomOpacity, dotScale, router, token, wordAnimationDuration]);

  const handleContinue = () => {
    if (!agreed) return;

    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 0,
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
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.wordContainer}>
            {word.split('').map((letter, index) => (
              <AnimatedText
                key={index}
                text={letter}
                style={styles.appNameLetter}
                delay={initialDelay + index * letterDelay}
              />
            ))}
            <Animated.View style={[styles.dotContainer, { transform: [{ scale: dotScale }] }]}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.blueDot}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          </View>

          <Animated.Text style={[styles.tagline, { opacity: contentOpacity }]}>
            The Sanatan Community
          </Animated.Text>
        </View>

        <Animated.View style={[styles.bottomSection, { opacity: bottomOpacity }]}>
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
                Terms of Service and Privacy Policy
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
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
    flex: 1,
    justifyContent: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  appNameLetter: {
    fontFamily: 'Cinzel',
    fontSize: 28,
    fontWeight: '500',
    color: '#E6C87A',
    lineHeight: 36,
    letterSpacing: 14,
  },
  dotContainer: {
    marginLeft: 4,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  bottomSection: {
    width: '100%',
    maxWidth: 420,
    paddingBottom: 40,
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
    borderColor: '#000000',
    borderRadius: 6,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 18,
  },
  termsText: {
    flex: 1,
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  adminLoginButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  adminLoginText: {
    color: '#666666',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
