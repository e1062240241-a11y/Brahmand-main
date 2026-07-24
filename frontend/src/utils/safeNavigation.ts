import { router } from 'expo-router';

/**
 * Safely performs navigation operations, retrying if the Root Layout navigator
 * has not finished mounting / initializing on application startup.
 */
export function safeNavigate(navFn: () => void, maxRetries = 20, delayMs = 50) {
  try {
    navFn();
  } catch (err: any) {
    const isNotReadyError =
      err?.message?.includes('Attempted to navigate before mounting') ||
      err?.message?.includes('not mounted') ||
      err?.message?.includes('isReady') ||
      err?.message?.includes('GO_BACK was not handled');

    if (isNotReadyError && maxRetries > 0) {
      setTimeout(() => {
        safeNavigate(navFn, maxRetries - 1, delayMs);
      }, delayMs);
    } else {
      console.warn('[SafeNavigate] Unhandled navigation error:', err);
    }
  }
}

export const safeRouter = {
  push: (href: any, options?: any) => {
    safeNavigate(() => router.push(href, options));
  },
  replace: (href: any, options?: any) => {
    safeNavigate(() => router.replace(href, options));
  },
  back: () => {
    safeNavigate(() => {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/home');
        }
      } catch {
        router.replace('/(tabs)/home');
      }
    });
  },
  canGoBack: () => {
    try {
      return router.canGoBack();
    } catch {
      return false;
    }
  }
};
