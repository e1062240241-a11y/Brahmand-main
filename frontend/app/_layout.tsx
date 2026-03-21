import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/theme';
import { FloatingUtilityButton } from '../src/components/FloatingUtilityButton';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Safe Slot wrapper to isolate navigation errors
function SafeSlot() {
  return (
    <ErrorBoundary fallback={
      <View style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    }>
      <Slot />
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const { isLoading, loadStoredAuth, token } = useAuthStore();

  useEffect(() => {
    loadStoredAuth().catch((e) => {
      console.warn('Failed to load stored auth:', e?.message || e);
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <SafeSlot />
      {/* Global Floating Button - only show when logged in */}
      {token && <FloatingUtilityButton />}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
