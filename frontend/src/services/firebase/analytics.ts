import { Platform } from 'react-native';

type Params = Record<string, any> | undefined;

let nativeModule: any = null;
let nativeInstance: any = null;
let webAnalyticsInstance: any = null;

/**
 * Get native @react-native-firebase/analytics modular module and instance
 */
function getNativeAnalytics() {
  if (Platform.OS === 'web') return { mod: null, inst: null };
  if (!nativeModule) {
    try {
      nativeModule = require('@react-native-firebase/analytics');
      if (typeof nativeModule.getAnalytics === 'function') {
        nativeInstance = nativeModule.getAnalytics();
      } else if (typeof nativeModule.default === 'function') {
        nativeInstance = nativeModule.default();
      } else {
        nativeInstance = nativeModule;
      }
    } catch {
      nativeModule = null;
      nativeInstance = null;
    }
  }
  return { mod: nativeModule, inst: nativeInstance };
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
    const { mod, inst } = getNativeAnalytics();
    if (mod && typeof mod.setAnalyticsCollectionEnabled === 'function' && inst) {
      await mod.setAnalyticsCollectionEnabled(inst, enabled);
    } else if (inst && typeof inst.setAnalyticsCollectionEnabled === 'function') {
      await inst.setAnalyticsCollectionEnabled(enabled);
    }
  } catch {
    // Silent catch
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

  try {
    if (Platform.OS === 'web') {
      const web = getWebAnalytics();
      if (web) {
        const { logEvent: webLogEvent } = require('firebase/analytics');
        return webLogEvent(web, safeName, safeParams);
      }
      return;
    }

    const { mod, inst } = getNativeAnalytics();
    if (mod && typeof mod.logEvent === 'function' && inst) {
      return await mod.logEvent(inst, safeName, safeParams);
    } else if (inst && typeof inst.logEvent === 'function') {
      return await inst.logEvent(safeName, safeParams);
    }
  } catch {
    // Never crash or affect UI performance
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
 * Uses standard logEvent('screen_view') to comply with Firebase modular standard
 */
export async function logScreenView(screenName: string, screenClass?: string) {
  const cleanScreen = formatScreenName(screenName);
  const cleanClass = screenClass || cleanScreen;

  if (__DEV__) {
    console.log(`[Analytics:Native] ScreenView: ${cleanScreen} (${cleanClass})`);
  }

  try {
    return await logEvent('screen_view', {
      screen_name: cleanScreen,
      screen_class: cleanClass,
      firebase_screen: cleanScreen,
      firebase_screen_class: cleanClass,
    });
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

  try {
    if (Platform.OS === 'web') {
      const web = getWebAnalytics();
      if (web) {
        const { setUserId: webSetUserId } = require('firebase/analytics');
        return webSetUserId(web, safeId);
      }
      return;
    }

    const { mod, inst } = getNativeAnalytics();
    if (mod && typeof mod.setUserId === 'function' && inst) {
      return await mod.setUserId(inst, safeId);
    } else if (inst && typeof inst.setUserId === 'function') {
      return await inst.setUserId(safeId);
    }
  } catch (e) {
    // Silent catch
  }
}

/**
 * Log standard Login event via logEvent
 */
export async function logLogin(method: string = 'phone') {
  return await logEvent('login', { method });
}

/**
 * Log standard Sign Up event via logEvent
 */
export async function logSignUp(method: string = 'phone') {
  return await logEvent('sign_up', { method });
}

/**
 * Log standard Content Selection via logEvent
 */
export async function logSelectContent(contentType: string, itemId: string) {
  return await logEvent('select_content', {
    content_type: contentType.slice(0, 40),
    item_id: String(itemId).slice(0, 100),
  });
}

/**
 * Log standard Share event via logEvent
 */
export async function logShare(contentType: string, itemId: string, method: string = 'app_share') {
  return await logEvent('share', {
    content_type: contentType.slice(0, 40),
    item_id: String(itemId).slice(0, 100),
    method: method.slice(0, 40),
  });
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

    const { mod, inst } = getNativeAnalytics();
    if (mod && typeof mod.setUserProperties === 'function' && inst) {
      return await mod.setUserProperties(inst, sanitizedProps);
    } else if (inst && typeof inst.setUserProperties === 'function') {
      return await inst.setUserProperties(sanitizedProps);
    }
  } catch (e) {
    // Silent catch
  }
}

const TRACKED_TIME_SCREENS = new Set([
  'Home',
  'Profile',
  'SettingsMenu',
  'Library',
  'Jaap',
  'Panchang',
  'Festivals',
]);

const activeScreenTimers: Record<string, number> = {};

/**
 * Start tracking time spent on a specific screen/tab
 * Only tracks: Home, Profile, SettingsMenu, Library, Jaap, Panchang, Festivals
 */
export function startScreenTime(screenKey: string) {
  if (!TRACKED_TIME_SCREENS.has(screenKey)) return;
  activeScreenTimers[screenKey] = Date.now();
}

/**
 * End tracking time spent and log directly to Firebase Analytics
 */
export function endScreenTime(screenKey: string) {
  const startTime = activeScreenTimers[screenKey];
  if (!startTime) return;
  delete activeScreenTimers[screenKey];

  const durationSeconds = Math.round((Date.now() - startTime) / 1000);
  if (durationSeconds >= 2 && durationSeconds <= 14400) {
    logEvent('time_spent', {
      screen_name: screenKey,
      duration_seconds: durationSeconds,
      duration_minutes: Math.round((durationSeconds / 60) * 10) / 10,
    });
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
  startScreenTime,
  endScreenTime,
};
