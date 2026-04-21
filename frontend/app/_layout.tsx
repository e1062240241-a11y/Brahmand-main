import React, { useEffect, useCallback, useRef } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Linking, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { addNotificationResponseReceivedListener, getLastNotificationResponse } from '../src/services/pushNotifications';
import { sendDirectMessage } from '../src/services/api';
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

function useNotificationResponseHandler() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const processedResponseKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.name) {
      return;
    }

    const getResponseKey = (response: any) => {
      const actionId = response?.actionIdentifier || response?.actionId || 'default';
      const data = response?.notification?.request?.content?.data;
      const chatId = data?.chat_id;
      const sosId = data?.sos_id;
      if (chatId) {
        return `${chatId}:${actionId}`;
      }
      return sosId ? `${sosId}:${actionId}` : null;
    };

    const navigateToDm = (chatId: string) => {
      if (!chatId) return;
      console.log('[Push] Navigating to DM chat:', chatId);
      router.push(`/dm/${chatId}`);
    };

    const handleResponse = async (response: any) => {
      if (!response?.notification?.request?.content?.data) {
        return;
      }

      const actionId = response.actionIdentifier || response.actionId || 'default';
      const data = response.notification.request.content.data;
      const responseKey = getResponseKey(response);
      if (!responseKey || responseKey === processedResponseKey.current) {
        return;
      }
      processedResponseKey.current = responseKey;

      if (data.type === 'dm' && data.chat_id) {
        navigateToDm(data.chat_id);
        return;
      }

      if (data.type === 'sos_alert' && actionId === 'accept_sos') {
        const creatorSlId = data.creator_sl_id;
        if (!creatorSlId) {
          console.warn('[Push] SOS creator sl_id missing in notification data');
          return;
        }

        try {
          await sendDirectMessage(creatorSlId, 'accepted your SOS request.');
          console.log('[Push] Sent SOS acceptance message to creator', creatorSlId);
        } catch (error) {
          console.warn('[Push] Failed to send SOS acceptance DM:', error);
        }
      }
    };

    let subscription: any;
    const initListener = async () => {
      try {
        const lastResponse = await getLastNotificationResponse();
        if (lastResponse) {
          await handleResponse(lastResponse);
        }
      } catch (error) {
        console.warn('[Push] Failed to read last notification response:', error);
      }

      try {
        subscription = await addNotificationResponseReceivedListener(handleResponse);
      } catch (error) {
        console.warn('[Push] Failed to register notification response listener:', error);
      }
    };

    initListener();

    return () => {
      subscription?.remove?.();
    };
  }, [isAuthenticated, user?.name]);
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
  useNotificationResponseHandler();

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
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <Slot />
        {token && !pathname.startsWith('/admin') && <FloatingUtilityButton />}
      </SafeAreaView>
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
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  fallbackText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  }
});
