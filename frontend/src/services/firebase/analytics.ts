import { Platform } from 'react-native';

type Params = Record<string, any> | undefined;

let nativeAnalyticsInstance: any = null;
let webAnalyticsInstance: any = null;

/**
 * Get native @react-native-firebase/analytics instance for Android / iOS
 */
function getNativeAnalytics() {
  if (Platform.OS === 'web') return null;
  if (!nativeAnalyticsInstance) {
    try {
      const analyticsModule = require('@react-native-firebase/analytics');
      const getInst = analyticsModule?.default || analyticsModule;
      if (typeof getInst === 'function') {
        nativeAnalyticsInstance = getInst();
      } else if (getInst && typeof getInst.logEvent === 'function') {
        nativeAnalyticsInstance = getInst;
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('[Analytics:Native] Module init error:', e);
      }
      nativeAnalyticsInstance = null;
    }
  }
  return nativeAnalyticsInstance;
}

/**
 * Web fallback
 */
function getWebAnalytics() {
  if (Platform.OS !== 'web') return null;
  if (!webAnalyticsInstance) {
    try {
      const { getAnalytics } = require('firebase/analytics');
      const { getApp } = require('firebase/app');
      webAnalyticsInstance = getAnalytics(getApp());
    } catch (e) {
      webAnalyticsInstance = null;
    }
  }
  return webAnalyticsInstance;
}

/**
 * Sanitize event name strictly for Firebase Android & iOS limits:
 * - 1 to 40 characters
 * - Alphanumeric characters and underscores only
 * - Must start with an alphabetic character
 */
function sanitizeEventName(name: string): string {
  if (!name) return 'custom_event';
  let cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!/^[a-zA-Z]/.test(cleaned)) {
    cleaned = 'e_' + cleaned;
  }
  return cleaned.slice(0, 40);
}

/**
 * Sanitize parameters for Firebase native restrictions:
 * - Max 25 params per event
 * - Key: max 40 chars, alphanumeric + underscores
 * - Value: string (max 100 chars), number, or boolean
 */
function sanitizeParams(params?: Params): Record<string, any> {
  if (!params || typeof params !== 'object') return {};
  const sanitized: Record<string, any> = {};
  const entries = Object.entries(params).slice(0, 25);

  for (const [key, val] of entries) {
    const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    if (!cleanKey) continue;

    if (typeof val === 'string') {
      sanitized[cleanKey] = val.slice(0, 100);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      sanitized[cleanKey] = val;
    } else if (val !== null && val !== undefined) {
      sanitized[cleanKey] = String(val).slice(0, 100);
    }
  }
  return sanitized;
}

/**
 * Set collection enabled on iOS & Android native level
 */
export async function setAnalyticsCollectionEnabled(enabled: boolean = true) {
  try {
    const native = getNativeAnalytics();
    if (native && typeof native.setAnalyticsCollectionEnabled === 'function') {
      await native.setAnalyticsCollectionEnabled(enabled);
      if (__DEV__) {
        console.log('[Analytics:Native] Collection enabled:', enabled);
      }
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[Analytics:Native] setAnalyticsCollectionEnabled failed:', e);
    }
  }
}

// Auto-activate collection at module load
setAnalyticsCollectionEnabled(true).catch(() => {});

/**
 * Log custom event on Native & Web
 */
export async function logEvent(name: string, params?: Params) {
  const safeName = sanitizeEventName(name);
  const safeParams = sanitizeParams(params);

  if (__DEV__) {
    console.log(`[Analytics:Native] Event: ${safeName}`, safeParams);
  }

  try {
    if (Platform.OS === 'web') {
      const web = getWebAnalytics();
      if (web) {
        const { logEvent: webLogEvent } = require('firebase/analytics');
        return webLogEvent(web, safeName, safeParams);
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native && typeof native.logEvent === 'function') {
      return await native.logEvent(safeName, safeParams);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn(`[Analytics:Native] Failed to log event ${safeName}:`, e);
    }
  }
}

function formatScreenName(name: string): string {
  if (!name) return 'Home';
  const clean = name.replace(/^\//, '').replace(/^\(tabs\)\//, '');
  if (clean === 'home' || clean === '') return 'Home';
  if (clean === 'jaap') return 'Temple';
  if (clean === 'messages') return 'Community';
  if (clean === 'vendor') return 'Services';
  if (clean === 'profile') return 'Profile';
  return clean.replace(/[^a-zA-Z0-9_\-\/]/g, '_').slice(0, 40);
}

/**
 * Log Screen View on Android / iOS with exact screen name
 */
export async function logScreenView(screenName: string, screenClass?: string) {
  const cleanScreen = formatScreenName(screenName);
  const cleanClass = screenClass || cleanScreen;

  if (__DEV__) {
    console.log(`[Analytics:Native] ScreenView: ${cleanScreen} (${cleanClass})`);
  }

  try {
    if (Platform.OS === 'web') {
      const web = getWebAnalytics();
      if (web) {
        const { logEvent: webLogEvent } = require('firebase/analytics');
        return webLogEvent(web, 'screen_view', {
          firebase_screen: cleanScreen,
          firebase_screen_class: cleanClass,
        });
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native) {
      if (typeof native.logScreenView === 'function') {
        return await native.logScreenView({
          screen_name: cleanScreen,
          screen_class: cleanClass,
        });
      } else if (typeof native.logEvent === 'function') {
        return await native.logEvent('screen_view', {
          screen_name: cleanScreen,
          screen_class: cleanClass,
        });
      }
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[Analytics:Native] logScreenView failed:', e);
    }
  }
}

/**
 * Set user ID for cross-device tracking on iOS / Android
 */
export async function setUserId(id: string | null) {
  const safeId = id ? String(id).slice(0, 100) : null;

  if (__DEV__) {
    console.log(`[Analytics:Native] SetUserId: ${safeId}`);
  }

  try {
    if (Platform.OS === 'web') {
      const web = getWebAnalytics();
      if (web) {
        const { setUserId: webSetUserId } = require('firebase/analytics');
        return webSetUserId(web, safeId);
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native && typeof native.setUserId === 'function') {
      return await native.setUserId(safeId);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[Analytics:Native] setUserId failed:', e);
    }
  }
}

/**
 * Log standard Login event
 */
export async function logLogin(method: string = 'phone') {
  if (__DEV__) {
    console.log(`[Analytics:Native] Login: method=${method}`);
  }
  try {
    const native = getNativeAnalytics();
    if (native && typeof native.logLogin === 'function') {
      return await native.logLogin({ method });
    }
    return await logEvent('login', { method });
  } catch (e) {
    return await logEvent('login', { method });
  }
}

/**
 * Log standard Sign Up event
 */
export async function logSignUp(method: string = 'phone') {
  if (__DEV__) {
    console.log(`[Analytics:Native] SignUp: method=${method}`);
  }
  try {
    const native = getNativeAnalytics();
    if (native && typeof native.logSignUp === 'function') {
      return await native.logSignUp({ method });
    }
    return await logEvent('sign_up', { method });
  } catch (e) {
    return await logEvent('sign_up', { method });
  }
}

/**
 * Log standard Content Selection (e.g. clicked a temple, post, community)
 */
export async function logSelectContent(contentType: string, itemId: string) {
  try {
    const native = getNativeAnalytics();
    if (native && typeof native.logSelectContent === 'function') {
      return await native.logSelectContent({
        content_type: contentType.slice(0, 40),
        item_id: String(itemId).slice(0, 100),
      });
    }
    return await logEvent('select_content', {
      content_type: contentType,
      item_id: String(itemId),
    });
  } catch (e) {
    // Silent catch
  }
}

/**
 * Log standard Share event
 */
export async function logShare(contentType: string, itemId: string, method: string = 'app_share') {
  try {
    const native = getNativeAnalytics();
    if (native && typeof native.logShare === 'function') {
      return await native.logShare({
        content_type: contentType.slice(0, 40),
        item_id: String(itemId).slice(0, 100),
        method: method.slice(0, 40),
      });
    }
    return await logEvent('share', {
      content_type: contentType,
      item_id: String(itemId),
      method,
    });
  } catch (e) {
    // Silent catch
  }
}

/**
 * Set user properties (e.g. language, role, registration_date)
 */
export async function setUserProperties(properties: Record<string, any>) {
  try {
    const sanitizedProps: Record<string, string> = {};
    for (const [key, val] of Object.entries(properties)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24);
      if (cleanKey && val !== null && val !== undefined) {
        sanitizedProps[cleanKey] = String(val).slice(0, 36);
      }
    }

    if (Platform.OS === 'web') {
      const web = getWebAnalytics();
      if (web) {
        const { setUserProperties: webSetUserProperties } = require('firebase/analytics');
        return webSetUserProperties(web, sanitizedProps);
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native && typeof native.setUserProperties === 'function') {
      return await native.setUserProperties(sanitizedProps);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[Analytics:Native] setUserProperties failed:', e);
    }
  }
}

export default {
  logEvent,
  logScreenView,
  setUserId,
  setUserProperties,
  logLogin,
  logSignUp,
  logSelectContent,
  logShare,
  setAnalyticsCollectionEnabled,
};
