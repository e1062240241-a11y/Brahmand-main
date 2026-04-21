import { Platform } from 'react-native';

type Params = Record<string, any> | undefined;

let rnAnalytics: any = null;
let expoAnalytics: any = null;

if (Platform.OS !== 'web') {
  try {
    // prefer @react-native-firebase/analytics on native
    // use require to avoid bundling on web
     
    rnAnalytics = require('@react-native-firebase/analytics').default;
  } catch (e) {
    rnAnalytics = null;
  }
} else {
  try {
    // try expo-firebase-analytics for web-compatible behavior if present
     
    expoAnalytics = require('expo-firebase-analytics');
  } catch (e) {
    expoAnalytics = null;
  }
}

export async function logEvent(name: string, params?: Params) {
  if (Platform.OS === 'web') {
    if (expoAnalytics && typeof expoAnalytics.logEvent === 'function') {
      return expoAnalytics.logEvent(name, params);
    }
    try {
      // fallback to Firebase Web SDK if available
       
      const { getAnalytics, logEvent: firebaseLogEvent } = require('firebase/analytics');
       
      const { getApp } = require('firebase/app');
      const analytics = getAnalytics(getApp());
      return firebaseLogEvent(analytics, name, params || {});
    } catch (e) {
      // no-op if no web analytics available
      // keep web behavior unchanged for testing
      // console.warn('No web analytics available', e);
      return;
    }
  }

  // native
  if (rnAnalytics) {
    return rnAnalytics().logEvent(name, params || {});
  }

  // no-op if native analytics not installed
  // console.warn('Native analytics not available');
  return;
}

export async function setUserId(id: string | null) {
  if (Platform.OS === 'web') {
    if (expoAnalytics && typeof expoAnalytics.setUserId === 'function') {
      return expoAnalytics.setUserId(id);
    }
    try {
      const { getAnalytics, setUserId: firebaseSetUserId } = require('firebase/analytics');
      const { getApp } = require('firebase/app');
      const analytics = getAnalytics(getApp());
      return firebaseSetUserId(analytics, id);
    } catch (e) {
      return;
    }
  }

  if (rnAnalytics) {
    return rnAnalytics().setUserId(id);
  }

  return;
}

export default {
  logEvent,
  setUserId,
};
