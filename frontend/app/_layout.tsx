import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Slot, usePathname, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Linking, BackHandler, Platform, LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/authStore';
import { startAuthStateListener } from '../src/services/firebase/authService';
import { addNotificationResponseReceivedListener, addNotificationReceivedListener, getLastNotificationResponse } from '../src/services/pushNotifications';
import { sendDirectMessage, getCommunities, getCircles, getConversations, discoverCommunities } from '../src/services/api';
import { getAllMutedConversations } from '../src/services/mutedChats';
import { COLORS } from '../src/constants/theme';
import { useAdminStore } from '../src/store/adminStore';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { MuteProvider } from '../src/contexts/MuteContext';
import { useNotificationStore } from '../src/store/notificationStore';
import { ToastContainer } from '../src/components/ToastContainer';
import { UploadProgressBanner } from '../src/components/UploadProgressBanner';
import { toast } from '../src/store/toastStore';
import { Alert as RNAlert } from 'react-native';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { syncDatabase } from '../src/database/sync';
import { GlobalFAB } from '../src/components/GlobalFAB';
import { initSyncQueueListener } from '../src/services/syncQueueService';
import { socketService } from '../src/services/socket';

import { originalAlert } from '../src/utils/nativeAlert';
import { setAudioModeAsync } from 'expo-audio';

LogBox.ignoreLogs(['UIKitCore] RCTScrollViewComponentView', 'RCTScrollViewComponentView implements focusItemsInRect:']);

RNAlert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  const titleStr = typeof title === 'string' ? title : '';
  const bodyStr = typeof message === 'string' ? message : '';
  const displayMsg = titleStr && bodyStr && titleStr !== 'Success' && titleStr !== 'Error' && titleStr !== 'Info'
    ? `${titleStr}: ${bodyStr}`
    : (bodyStr || titleStr);

  const isError = titleStr.toLowerCase().includes('error') || titleStr.toLowerCase().includes('fail') ||
    displayMsg.toLowerCase().includes('error') || displayMsg.toLowerCase().includes('fail');
  const isSuccess = titleStr.toLowerCase().includes('success') || titleStr.toLowerCase().includes('saved') ||
    titleStr.toLowerCase().includes('updated') || displayMsg.toLowerCase().includes('success');

  const mappedActions = buttons?.map(btn => ({
    text: btn.text || 'OK',
    style: btn.style,
    onPress: btn.onPress || (() => { })
  }));

  toast.show(displayMsg, isSuccess ? 'success' : (isError ? 'error' : 'info'), 10000, mappedActions);
};

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.alert = (message: any) => {
    const msgStr = String(message || '');
    const isError = msgStr.toLowerCase().includes('error') || msgStr.toLowerCase().includes('fail');
    const isSuccess = msgStr.toLowerCase().includes('success') || msgStr.toLowerCase().includes('saved') || msgStr.toLowerCase().includes('updated');
    toast.show(msgStr, isSuccess ? 'success' : (isError ? 'error' : 'info'));
  };
}

// Intercept hardware back on main pages to avoid accidental exit and crashes
function useAppBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onBackPress = () => {
      console.log('[BackHandler] Pathname:', pathname);

      // 1. If we are on a main tab screen, NEVER exit with a back gesture/button
      const mainTabs = [
        '/home', '/messages', '/jaap', '/jobs', '/profile', '/vendor', '/index',
        '/(tabs)/home', '/(tabs)/messages', '/(tabs)/jaap', '/(tabs)/jobs', '/(tabs)/profile', '/(tabs)/vendor'
      ];

      if (mainTabs.includes(pathname) || pathname === '/' || pathname === '') {
        console.log('[BackHandler] Blocking exit at root-like path.');
        return true; // Consume event, do nothing
      }

      // 2. Specific fix for community pages
      if (pathname.startsWith('/community/')) {
        router.replace('/(tabs)/messages');
        return true;
      }

      // 3. Fallback: If we can go back, do it safely
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      // 4. Default: Return true to prevent hard exit from common screens
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [pathname, router]);
}

import * as ExpoLinking from 'expo-linking';

function isValidAppPath(path: string): boolean {
  const cleanPath = path.split('?')[0];

  const staticPaths = [
    '/home',
    '/messages',
    '/jaap',
    '/jobs',
    '/profile',
    '/vendor',
    '/sos',
    '/kyc-submit',
    '/kyc-success',
    '/kyc',
    '/live-jaap-welcome',
    '/circle/create',
    '/community/create',
    '/community-tweets',
    '/astrology',
    '/horoscope',
    '/panchang',
    '/festivals',
    '/all-live-jaaps',
    '/my-krishna',
    '/library',
    '/passport',
    '/settings',
    '/verification',
    '/privacy-policy',
    '/badges',
    '/ekant-jaap',
    '/live-mantra',
    '/community-request'
  ];

  if (staticPaths.includes(cleanPath)) {
    return true;
  }

  const dynamicPrefixes = [
    '/post/',
    '/community/',
    '/dm/',
    '/vendor/',
    '/temple/',
    '/profile/',
    '/festival-detail/',
    '/festival-section-detail/',
    '/hashtag/',
    '/community-request/',
    '/library/'
  ];

  for (const prefix of dynamicPrefixes) {
    if (cleanPath.startsWith(prefix) && cleanPath.length > prefix.length) {
      return true;
    }
  }

  return false;
}

// Handle deep links for universal links (https://brahmand.app/*) and custom scheme (sanatanlok://)
function useDeepLinkHandler() {
  const { token, isAuthenticated, setPendingDeepLink, pendingDeepLink } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (!event.url) return;

      try {
        let path: string | null = null;
        const raw = event.url;

        // Universal link: https://brahmand.app/some/path
        if (raw.startsWith('https://brahmand.app') || raw.startsWith('http://brahmand.app')) {
          const urlObj = new URL(raw);
          path = urlObj.pathname + urlObj.search;
        } else {
          // Custom scheme: sanatanlok://some/path
          const parsed = ExpoLinking.parse(raw);
          const parsedPath = parsed.path ? String(parsed.path).replace(/^\/+/, '') : '';
          let pathWithQuery = parsedPath ? `/${parsedPath}` : '';
          const queryParams = parsed.queryParams;
          if (queryParams && Object.keys(queryParams).length > 0) {
            const searchParams = new URLSearchParams();
            for (const [key, val] of Object.entries(queryParams)) {
              if (val !== undefined && val !== null) {
                searchParams.append(key, String(val));
              }
            }
            const searchStr = searchParams.toString();
            if (searchStr) {
              pathWithQuery += `?${searchStr}`;
            }
          }
          path = pathWithQuery ? pathWithQuery.replace(/\/\/+/, '/') : null;
        }

        if (!path || path === '/') return;

        // Validate the path
        if (!isValidAppPath(path)) {
          console.warn('[DeepLink] Invalid or unsupported deep link path:', path);
          toast.show('Invalid or unsupported link', 'error');
          // If we launched the app via an invalid deep link, fallback to home
          if (token && isAuthenticated) {
            router.replace('/home');
          }
          return;
        }

        // If authenticated, navigate immediately
        if (token && isAuthenticated) {
          console.log('[DeepLink] Navigating to path:', path);
          router.push(path as any);
        } else {
          // Otherwise, save the pending deep link
          console.log('[DeepLink] Saving pending deep link:', path);
          setPendingDeepLink(path);
        }

      } catch (error) {
        console.warn('[DeepLink] Failed to parse deep link:', error, event.url);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened from a cold start via a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLink] Initial URL on launch:', url);
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [token, isAuthenticated, router, setPendingDeepLink]);

  // Handle immediate routing once user logs in (for normal app sessions when layout mounts and auth resolves)
  useEffect(() => {
    if (token && isAuthenticated && pendingDeepLink) {
      const path = pendingDeepLink;
      setPendingDeepLink(null); // Clear first to avoid duplicate pushes
      console.log('[DeepLink] Redirecting to pending deep link after auth load:', path);

      setTimeout(() => {
        router.push(path as any);
      }, 100);
    }
  }, [token, isAuthenticated, pendingDeepLink, router, setPendingDeepLink]);
}

function useNotificationResponseHandler() {
  const router = useRouter();
  const processedResponseKey = useRef<string | null>(null);

  useEffect(() => {
    const getResponseKey = (response: any) => {
      const actionId = response?.actionIdentifier || response?.actionId || 'default';
      const data = response?.notification?.request?.content?.data;
      const type = data?.type;
      const chatId = data?.chat_id;
      const sosId = data?.sos_id;
      const postId = data?.post_id;
      const actorUserId = data?.actor_user_id;
      const messageId = data?.message_id;
      const requestId = data?.requestId;
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
      if (type === 'community_like' && messageId) {
        return `comm_like:${messageId}:${actionId}`;
      }
      if (type === 'community_request' && requestId) {
        return `comm_req:${requestId}:${actionId}`;
      }
      return null;
    };

    const navigateOrQueue = (path: string) => {
      const { token, isAuthenticated, user } = useAuthStore.getState();
      if (token && isAuthenticated && user?.name) {
        console.log('[Push] Navigating directly to:', path);
        router.push(path as any);
      } else {
        console.log('[Push] Not authenticated or initialized yet. Queueing deep link path:', path);
        useAuthStore.getState().setPendingDeepLink(path);
      }
    };

    const navigateToDm = (chatId: string) => {
      if (!chatId) return;
      navigateOrQueue(`/dm/${chatId}`);
    };

    const navigateToProfile = (userId: string) => {
      if (!userId) return;
      navigateOrQueue(`/profile/${userId}`);
    };

    const navigateToPost = (postId: string) => {
      if (!postId) return;
      navigateOrQueue(`/post/${postId}`);
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
        // Trigger background sync immediately when user taps on DM notification
        if (Platform.OS !== 'web') {
          try {
            const { syncDatabase } = require('../src/database/sync');
            syncDatabase().catch((err: any) => console.warn('[Push] Background sync failed:', err));
          } catch (e) {
            console.warn('[Push] Failed to require syncDatabase:', e);
          }
        }
        navigateToDm(data.chat_id);
        return;
      }

      if (data.type === 'follow' && data.actor_user_id) {
        navigateToProfile(String(data.actor_user_id));
        return;
      }

      if (data.type === 'community_like' && data.community_id && data.message_id) {
        navigateOrQueue(`/community/${data.community_id}?postId=${data.message_id}`);
        return;
      }

      if (data.type === 'community_request' && data.requestId) {
        navigateOrQueue(`/community-request/list?requestId=${data.requestId}`);
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
      // Handle Jaap reminder notification tap - open app to specific live jaap welcome screen
      if (data.type === 'jaap_reminder' && data.mantra_type) {
        let titleVal = '';
        if (data.mantra_type === 'hanuman') titleVal = 'Hanuman Chalisa';
        else if (data.mantra_type === 'krishna') titleVal = 'Hare Krishna Jaap';
        else if (data.mantra_type === 'shiva') titleVal = 'Om Namah Shivaya';
        else if (data.mantra_type === 'gayatri') titleVal = 'Gayatri Mantra';
        else if (data.mantra_type === 'ganesh') titleVal = 'Ganesh Mantra';
        else if (data.mantra_type === 'laxmi') titleVal = 'Laxmi Mantra';
        else if (data.mantra_type === 'mrityunjaya') titleVal = 'Maha Mrityunjaya';
        else titleVal = data.mantra_type.charAt(0).toUpperCase() + data.mantra_type.slice(1);

        console.log(`[Push] Routing jaap_reminder for ${data.mantra_type} to live-jaap-welcome`);
        navigateOrQueue(`/live-jaap-welcome?mantraType=${data.mantra_type}&title=${encodeURIComponent(titleVal)}`);
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
  }, [router]);
}

function useMutedNotificationFilter() {
  const mutedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    getAllMutedConversations().then(set => { mutedRef.current = set; });
  }, []);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    const init = async () => {
      sub = await addNotificationReceivedListener(async (notification: any) => {
        const data = notification?.request?.content?.data;

        // Trigger background sync immediately when message notification is received
        if (data?.type === 'dm' || data?.type === 'message' || data?.type === 'circle_message') {
          if (Platform.OS !== 'web') {
            try {
              const { syncDatabase } = require('../src/database/sync');
              syncDatabase().catch((err: any) => console.warn('[Push] Foreground sync on message failed:', err));
            } catch (e) {
              console.warn('[Push] Failed to require syncDatabase:', e);
            }
          }
        }

        if (data?.type === 'dm' && data?.chat_id && mutedRef.current.has(data.chat_id)) {
          const Notifications = await import('expo-notifications');
          await Notifications.dismissNotificationAsync(notification.request.identifier);
        } else {
          try {
            const { unreadCount, setUnreadCount, addRecentNotification } = useNotificationStore.getState();
            addRecentNotification(notification);
            setUnreadCount(unreadCount + 1);
          } catch (e) {
            console.warn('[Push] Failed to increment unreadCount on message receive:', e);
          }
        }
      });
    };
    init();
    return () => { sub?.remove(); };
  }, []);
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
        <BrandedLoading message="Loading..." />
      );
    }
    return (
      <BrandedLoading />
    );
  }
}

import { useLanguageStore } from '../src/utils/i18n';

export default function RootLayout() {
  const pathname = usePathname();
  const isDarkScreen =
    pathname.includes('/profile') ||
    pathname.includes('/reel') ||
    pathname.includes('/post/') ||
    pathname === '/community-tweets';
  const { isLoading, loadStoredAuth, token, isAuthenticated, initPushNotifications } = useAuthStore();
  const { loadStoredAdminAuth } = useAdminStore();
  const pushInitStartedRef = useRef(false);
  const [fontsReady, setFontsReady] = useState(false);

  useDeepLinkHandler();
  useAppBackHandler();
  useNotificationResponseHandler();
  useMutedNotificationFilter();

  useEffect(() => {
    const initAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
          allowsRecording: false,
          shouldRouteThroughEarpiece: false,
          shouldPlayInBackground: false,
        });
      } catch (error) {
        console.warn('[Audio] Failed to set default audio mode:', error);
      }
    };
    if (Platform.OS !== 'web') {
      initAudio();
    }
  }, []);

  useEffect(() => {
    initSyncQueueListener();
  }, []);

  useEffect(() => {
    useLanguageStore.getState().loadLanguage();
    Promise.allSettled([loadStoredAuth(), loadStoredAdminAuth()]).then((results) => {
      const authErr = results[0].status === 'rejected' ? results[0].reason : null;
      const adminErr = results[1].status === 'rejected' ? results[1].reason : null;
      if (authErr) {
        console.warn('Failed to load stored auth:', authErr?.message || authErr);
      }
      if (adminErr) {
        console.warn('Failed to load stored admin auth:', adminErr?.message || adminErr);
      }

      // Sync birth details into jyotishStore after auth is restored.
      // loadStoredAuth already fetched the fresh profile from backend, so
      // loadBirthDetails will find birth details in authStore immediately.
      try {
        const { token } = useAuthStore.getState();
        if (token) {
          const { useJyotishStore } = require('../src/store/jyotishStore');
          useJyotishStore.getState().loadBirthDetails().catch((e: any) => {
            console.warn('Failed to load birth details on startup:', e);
          });
        }
      } catch (e) {
        console.warn('Failed to require jyotishStore on startup:', e);
      }
    });
  }, [loadStoredAuth, loadStoredAdminAuth]);

  useEffect(() => {
    const unsubscribe = startAuthStateListener((user) => {
      if (user) {
        console.log('[Auth] onAuthStateChanged: user signed in via auto-verification');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !token || !isAuthenticated || pushInitStartedRef.current) return;
    pushInitStartedRef.current = true;
    initPushNotifications().catch((error) => {
      console.warn('[Push] Auto init on app load failed:', error);
    });
  }, [isLoading, token, isAuthenticated, initPushNotifications]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isLoading && isAuthenticated && token) {
      syncDatabase()
        .then(() => console.log('[Sync] WatermelonDB sync complete on startup'))
        .catch((err) => console.warn('[Sync] WatermelonDB sync failed on startup:', err));
    }
  }, [isLoading, isAuthenticated, token]);

  // Preload community data after auth resolves — cache it so Community tab shows instantly
  useEffect(() => {
    if (isLoading || !isAuthenticated || !token) return;

    const preload = async () => {
      try {
        const [communitiesRes, circlesRes, conversationsRes, discoverRes] = await Promise.all([
          getCommunities().catch(() => ({ data: [] })),
          getCircles().catch(() => ({ data: [] })),
          getConversations().catch(() => ({ data: [] })),
          discoverCommunities().catch(() => ({ data: [] })),
        ]);

        if (Platform.OS === 'web') {
          if (communitiesRes?.data?.length) {
            AsyncStorage.setItem('web_communities_cache', JSON.stringify(communitiesRes.data)).catch(() => { });
          }
          if (circlesRes?.data?.length) {
            AsyncStorage.setItem('web_circles_cache', JSON.stringify(circlesRes.data)).catch(() => { });
          }
          if (conversationsRes?.data?.length) {
            AsyncStorage.setItem('web_dms_cache', JSON.stringify(conversationsRes.data)).catch(() => { });
          }
          if (discoverRes?.data) {
            const discoverData = Array.isArray(discoverRes.data) ? discoverRes.data : discoverRes.data?.data || [];
            AsyncStorage.setItem('user_groups_discover_cache', JSON.stringify({ data: discoverData, timestamp: Date.now() })).catch(() => { });
          }
        }
      } catch (e) {
        console.warn('[Preload] Community data preload failed:', e);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => preload(), { timeout: 3000 });
    } else {
      setTimeout(preload, 500);
    }
  }, [isLoading, isAuthenticated, token]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && token) {
      socketService.connect().catch((err) => {
        console.warn('[Socket] Global connection failed:', err);
      });

      const handleNewNotification = (notification: any) => {
        try {
          const { unreadCount, setUnreadCount, addRecentNotification } = useNotificationStore.getState();
          addRecentNotification(notification);
          setUnreadCount(unreadCount + 1);
          if (pathname !== '/notifications' && pathname !== '/(tabs)/notifications') {
            toast.show(notification.title || 'New Notification', 'info');
          }
        } catch (e) {
          console.warn('[Socket] Failed to process real-time notification:', e);
        }
      };

      socketService.onEvent('new_notification', handleNewNotification);

      return () => {
        socketService.offEvent('new_notification', handleNewNotification);
      };
    } else if (!isLoading && !isAuthenticated) {
      socketService.disconnect();
    }
  }, [isLoading, isAuthenticated, token, pathname]);

  useEffect(() => {
    (async () => {
      try {
        const Font = require('expo-font');
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
          Outfit_400Regular,
          Outfit_500Medium,
          Outfit_600SemiBold,
          Outfit_700Bold,
          'Cinzel': { uri: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/static/Cinzel-Medium.ttf' },
          'Poppins': { uri: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf' },
        });
      } catch (e) {
        console.warn('[Fonts] Non-blocking font load failed:', e);
      }
      setFontsReady(true);
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style={Platform.OS === 'android' ? 'dark' : isDarkScreen ? 'light' : 'dark'}
          backgroundColor="transparent"
          translucent={true}
        />
        <MuteProvider>
          <Stack screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            contentStyle: { backgroundColor: COLORS.background }
          }}>
            {/* Disable swipe-back gesture on the main tabs to prevent exiting to splash/auth */}
            <Stack.Screen
              key="(tabs)"
              name="(tabs)"
              options={{
                animation: 'fade',
                gestureEnabled: false
              }}
            />
            <Stack.Screen
              key="index"
              name="index"
              options={{
                animation: 'fade',
                gestureEnabled: false
              }}
            />
            {/* Modals and Creation Forms - Slide from Bottom */}
            <Stack.Screen
              key="community-request/blood"
              name="community-request/blood"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-request/food"
              name="community-request/food"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-request/gau-seva"
              name="community-request/gau-seva"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-request/animal-care"
              name="community-request/animal-care"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-request/temple-help"
              name="community-request/temple-help"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-request/emergency"
              name="community-request/emergency"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-request/other"
              name="community-request/other"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="sos"
              name="sos"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="kyc-submit"
              name="kyc-submit"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="kyc-success"
              name="kyc-success"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="live-jaap-welcome"
              name="live-jaap-welcome"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="circle/create"
              name="circle/create"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community/create"
              name="community/create"
              options={{
                animation: 'slide_from_right',
                gestureDirection: 'vertical'
              }}
            />
            <Stack.Screen
              key="community-tweets"
              name="community-tweets"
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              key="jaap-completed"
              name="jaap-completed"
              options={{
                animation: 'fade',
                gestureEnabled: false
              }}
            />
            <Stack.Screen
              key="my-krishna"
              name="my-krishna"
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              key="library/index"
              name="library/index"
              options={{
                animation: 'slide_from_right',
              }}
            />
            {/* Other standard stack navigations will inherit default slide_from_right */}
          </Stack>
          <GlobalFAB />
          <UploadProgressBanner />
          <ToastContainer />
        </MuteProvider>
      </SafeAreaProvider>

    </GestureHandlerRootView>
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
