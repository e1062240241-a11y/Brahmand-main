import React, { useEffect } from 'react';
import { Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/theme';
import { FloatingUtilityButton } from '../src/components/FloatingUtilityButton';
import { useAdminStore } from '../src/store/adminStore';

export default function RootLayout() {
  const pathname = usePathname();
  const { isLoading, loadStoredAuth, token } = useAuthStore();
  const { loadStoredAdminAuth } = useAdminStore();

  useEffect(() => {
    Promise.allSettled([loadStoredAuth(), loadStoredAdminAuth()]).then((results) => {
      const authErr = results[0].status === 'rejected' ? results[0].reason : null;
      const adminErr = results[1].status === 'rejected' ? results[1].reason : null;
      if (authErr) {
        console.warn('Failed to load stored auth:', authErr?.message || authErr);
      }
      if (adminErr) {
        console.warn('Failed to load stored admin auth:', adminErr?.message || adminErr);
      }
    });
  }, [loadStoredAuth, loadStoredAdminAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Slot />
        {token && !pathname.startsWith('/admin') && <FloatingUtilityButton />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
