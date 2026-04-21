import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../src/constants/theme';

const PRIVACY_POLICY_URL = 'https://brahmand.app/privacy-policy/';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = PRIVACY_POLICY_URL;
      return;
    }

    Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <View style={styles.redirectContainer}>
        <Text style={styles.redirectText}>Opening Privacy Policy...</Text>
        <TouchableOpacity style={styles.openButton} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Text style={styles.openButtonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: SPACING.sm,
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  redirectContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  redirectText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  openButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  openButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
});
