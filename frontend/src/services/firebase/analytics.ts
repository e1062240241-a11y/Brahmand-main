import { Platform } from 'react-native';

type Params = Record<string, any> | undefined;

let nativeAnalyticsInstance: any = null;
let webAnalyticsInstance: any = null;

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
      nativeAnalyticsInstance = null;
    }
  }
  return nativeAnalyticsInstance;
}

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

// Enable analytics collection on initialization
export async function setAnalyticsCollectionEnabled(enabled: boolean = true) {
  try {
    const native = getNativeAnalytics();
    if (native && typeof native.setAnalyticsCollectionEnabled === 'function') {
      await native.setAnalyticsCollectionEnabled(enabled);
    }
  } catch (e) {
    console.warn('[Analytics] setAnalyticsCollectionEnabled error:', e);
  }
}

// Automatically enable collection when module is loaded
setAnalyticsCollectionEnabled(true).catch(() => {});

export async function logEvent(name: string, params?: Params) {
  try {
    // Sanitize event name (Firebase requires alphanumeric and underscores, max 40 chars)
    const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);

    if (Platform.OS === 'web') {
      const analytics = getWebAnalytics();
      if (analytics) {
        const { logEvent: firebaseLogEvent } = require('firebase/analytics');
        return firebaseLogEvent(analytics, sanitizedName, params || {});
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native && typeof native.logEvent === 'function') {
      return await native.logEvent(sanitizedName, params || {});
    }
  } catch (e) {
    // Analytics failures must never crash the user experience
  }
}

export async function logScreenView(screenName: string, screenClass?: string) {
  try {
    const cleanScreen = (screenName || 'Unknown').replace(/^\//, '') || 'home';

    if (Platform.OS === 'web') {
      const analytics = getWebAnalytics();
      if (analytics) {
        const { logEvent: firebaseLogEvent } = require('firebase/analytics');
        return firebaseLogEvent(analytics, 'screen_view', {
          firebase_screen: cleanScreen,
          firebase_screen_class: screenClass || cleanScreen,
        });
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native) {
      if (typeof native.logScreenView === 'function') {
        return await native.logScreenView({
          screen_name: cleanScreen,
          screen_class: screenClass || cleanScreen,
        });
      } else if (typeof native.logEvent === 'function') {
        return await native.logEvent('screen_view', {
          screen_name: cleanScreen,
          screen_class: screenClass || cleanScreen,
        });
      }
    }
  } catch (e) {
    // Silent catch
  }
}

export async function setUserId(id: string | null) {
  try {
    if (Platform.OS === 'web') {
      const analytics = getWebAnalytics();
      if (analytics) {
        const { setUserId: firebaseSetUserId } = require('firebase/analytics');
        return firebaseSetUserId(analytics, id);
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native && typeof native.setUserId === 'function') {
      return await native.setUserId(id);
    }
  } catch (e) {
    // Silent catch
  }
}

export async function setUserProperties(properties: Record<string, any>) {
  try {
    if (Platform.OS === 'web') {
      const analytics = getWebAnalytics();
      if (analytics) {
        const { setUserProperties: firebaseSetUserProperties } = require('firebase/analytics');
        return firebaseSetUserProperties(analytics, properties);
      }
      return;
    }

    const native = getNativeAnalytics();
    if (native && typeof native.setUserProperties === 'function') {
      // Firebase properties must have string values
      const sanitizedProps: Record<string, string> = {};
      for (const [key, val] of Object.entries(properties)) {
        if (val !== null && val !== undefined) {
          sanitizedProps[key] = String(val);
        }
      }
      return await native.setUserProperties(sanitizedProps);
    }
  } catch (e) {
    // Silent catch
  }
}

export default {
  logEvent,
  logScreenView,
  setUserId,
  setUserProperties,
  setAnalyticsCollectionEnabled,
};
