import React, { useEffect, useCallback, useRef } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Linking, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { startAuthStateListener } from '../src/services/firebase/authService';
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
      const type = data?.type;
      const chatId = data?.chat_id;
      const sosId = data?.sos_id;
      const postId = data?.post_id;
      const actorUserId = data?.actor_user_id;
      if (chatId) {
        return `${chatId}:${actionId}`;
      }
      if (sosId) {
        return `${sosId}:${actionId}`;
      }
      if (postId) {
        return `post:${postId}:${actionId}`;
      }
      if (type === 'follow' && actorUserId) {
        return `follow:${actorUserId}:${actionId}`;
      }
      return null;
    };

    const navigateToDm = (chatId: string) => {
      if (!chatId) return;
      console.log('[Push] Navigating to DM chat:', chatId);
      router.push(`/dm/${chatId}`);
    };

    const navigateToProfile = (userId: string) => {
      if (!userId) return;
      console.log('[Push] Navigating to profile:', userId);
      router.push(`/profile/${userId}`);
    };

    const navigateToPost = (postId: string) => {
      if (!postId) return;
      console.log('[Push] Navigating to post:', postId);
      router.push(`/post/${postId}`);
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

      if (data.type === 'follow' && data.actor_user_id) {
        navigateToProfile(String(data.actor_user_id));
        return;
      }

      if (data.type === 'post_like') {
        if (data.post_id) {
          navigateToPost(String(data.post_id));
          return;
        }
        if (data.actor_user_id) {
          navigateToProfile(String(data.actor_user_id));
          return;
        }
      }

      if (data.type === 'post_comment') {
        if (data.post_id) {
          navigateToPost(String(data.post_id));
          return;
        }
        if (data.actor_user_id) {
          navigateToProfile(String(data.actor_user_id));
          return;
        }
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
        return;
      }

      // Handle SOS notification tap - open app with SOS modal
      if (data.type === 'sos_alert') {
        console.log('[Push] SOS notification received, data:', data);
        if (typeof window !== 'undefined') {
          (window as any).__PENDING_SOS = data;
        }
        return;
      }

      // Handle SOS responder count update
      if (data.type === 'sos_responder_count') {
        console.log('[Push] SOS responder count update:', data);
        if (typeof window !== 'undefined') {
          (window as any).__SOS_RESPONDER_COUNT = {
            sos_id: data.sos_id,
            count: parseInt(data.responder_count || '0', 10),
            name: data.responder_name || 'Someone'
          };
        }
        return;
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
  const { isLoading, loadStoredAuth, token, isAuthenticated, initPushNotifications } = useAuthStore();
  const { loadStoredAdminAuth } = useAdminStore();
  const pushInitStartedRef = useRef(false);
  
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

  // Start Firebase auth state listener to catch silent auto-verification on Android
  useEffect(() => {
    const unsubscribe = startAuthStateListener((user) => {
      if (user) {
        console.log('[Auth] onAuthStateChanged: user signed in via auto-verification');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !token || !isAuthenticated || pushInitStartedRef.current) {
      return;
    }

    pushInitStartedRef.current = true;
    initPushNotifications().catch((error) => {
      console.warn('[Push] Auto init on app load failed:', error);
    });
  }, [isLoading, token, isAuthenticated, initPushNotifications]);

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
