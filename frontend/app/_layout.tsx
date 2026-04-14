import React, { useEffect, useCallback } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Linking, BackHandler } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/theme';
import { FloatingUtilityButton } from '../src/components/FloatingUtilityButton';
import { useAdminStore } from '../src/store/adminStore';

function useAndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBackPress = useCallback(() => {
    if (pathname.startsWith('/community/')) {
      router.replace('/messages');
      return true;
    }
    return false;
  }, [pathname, router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [handleBackPress]);
}

// Handle deep links for circle invites
function useDeepLinkHandler() {
  const { token } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    const handleDeepLink = (event: any) => {
      if (!token) return;
      
      const url = event.url;
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.replace(/^\/+/, '');
        
        if (path.startsWith('join-circle/')) {
          const circleCode = path.replace('join-circle/', '');
          if (circleCode && pathname !== '/circle/join') {
            console.log('Deep link detected for circle:', circleCode);
          }
        }
      } catch (error) {
        console.warn('Failed to parse deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, [token, pathname]);
}

// Safe Slot wrapper to isolate navigation errors
function SafeSlot() {
  try {
    return <Slot />;
  } catch (error) {
    console.warn('Slot rendering crashed, showing fallback.', error);
    // For navigation errors, show a more user-friendly message
    if ((error as any)?.message?.includes('stale')) {
      return (
        <View style={styles.fallbackContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.fallbackText}>Loading...</Text>
        </View>
      );
    }
    return (
      <View style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
}

export default function RootLayout() {
  const pathname = usePathname();
  const { isLoading, loadStoredAuth, token } = useAuthStore();
  const { loadStoredAdminAuth } = useAdminStore();
  
  useDeepLinkHandler();
  useAndroidBackHandler();

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
