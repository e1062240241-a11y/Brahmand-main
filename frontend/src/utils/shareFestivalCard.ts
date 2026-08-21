import { Share as RNShareApi, Platform, NativeModules } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.brahmand.app';

/**
 * Safely check if react-native-share native module is available in current build.
 */
const getRNShare = (): any => {
  try {
    if (!NativeModules.RNShare) {
      return null;
    }
    const RNShareModule = require('react-native-share');
    const Share = RNShareModule?.default || RNShareModule;
    if (Share && typeof Share.open === 'function') {
      return Share;
    }
  } catch (e) {
    console.warn('[shareFestivalCard] react-native-share native module check failed:', e);
  }
  return null;
};

/**
 * Safely check if ExpoIntentLauncher native module is available.
 */
const getIntentLauncher = (): any => {
  try {
    const IntentLauncher = require('expo-intent-launcher');
    if (IntentLauncher && typeof IntentLauncher.startActivityAsync === 'function') {
      return IntentLauncher;
    }
  } catch (e) {
    console.warn('[shareFestivalCard] ExpoIntentLauncher native module check failed:', e);
  }
  return null;
};

export const shareFestivalCard = async (
  uri: string | null,
  festivalName: string,
  festivalDescription: string = 'May this auspicious occasion bring joy and prosperity.'
): Promise<boolean> => {
  console.log('[shareFestivalCard] Called with URI:', uri, 'festivalName:', festivalName);

  const shareMessage =
    `✨ Wishing you and your family a very Happy ${festivalName}! ✨\n\n` +
    `${festivalDescription}\n\n` +
    `I created this personalized greeting on Brahmand App. Check out the link in the image or click below to download!\n` +
    `🔗 Download: ${PLAY_STORE_URL}`;

  try {
    const RNShare = getRNShare();

    // 1. Primary: Use react-native-share if native module is linked in binary
    if (RNShare) {
      try {
        console.log('[shareFestivalCard] Attempting Share.open via react-native-share...');
        const shareOptions: any = {
          title: `Share ${festivalName}`,
          message: shareMessage,
          failOnCancel: false,
        };

        if (uri) {
          shareOptions.url = uri;
          shareOptions.type = 'image/png';
        } else {
          shareOptions.url = PLAY_STORE_URL;
        }

        await RNShare.open(shareOptions);
        console.log('[shareFestivalCard] Share.open completed successfully');
        return true;
      } catch (rnShareErr: any) {
        if (
          rnShareErr &&
          (rnShareErr.message?.includes('User did not share') ||
            rnShareErr.message?.includes('CANCELLED') ||
            rnShareErr.message?.includes('dismissed'))
        ) {
          console.log('[shareFestivalCard] RNShare cancelled by user');
          return false;
        }
        console.warn('[shareFestivalCard] RNShare.open error, trying fallback:', rnShareErr);
      }
    }

    // 2. Android Specific Intent Launcher: Sends BOTH image + caption with Play Store link to WhatsApp/Apps
    if (Platform.OS === 'android' && uri) {
      const IntentLauncher = getIntentLauncher();
      if (IntentLauncher) {
        try {
          console.log('[shareFestivalCard] Triggering Android IntentLauncher with Image + Caption...');
          
          // Convert file:// cache URI to content:// URI so WhatsApp can read the image
          const contentUri = await FileSystem.getContentUriAsync(uri);
          
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: 'image/png',
            extra: {
              'android.intent.extra.STREAM': contentUri,
              'android.intent.extra.TEXT': shareMessage,
            },
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          });

          console.log('[shareFestivalCard] Android Intent launched successfully');
          return true;
        } catch (intentErr) {
          console.warn('[shareFestivalCard] Android IntentLauncher error:', intentErr);
        }
      }
    }

    // 3. Expo Sharing fallback for image (iOS or secondary fallback)
    if (uri) {
      console.log('[shareFestivalCard] Fallback to expo-sharing...');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${festivalName}`,
          UTI: 'public.png',
          ...(Platform.OS === 'ios' ? { text: shareMessage } : {}),
        });
        return true;
      }
    }

    // 4. Tertiary Fallback: Standard React Native Share (Text payload)
    console.log('[shareFestivalCard] Fallback to RN Share.share (text)...');
    const shareOptions = Platform.select({
      ios: {
        message: shareMessage,
        url: uri || PLAY_STORE_URL,
      },
      default: {
        message: shareMessage,
        title: `Share ${festivalName}`,
      },
    });

    await RNShareApi.share(shareOptions as any);
    return true;
  } catch (err) {
    console.warn('[shareFestivalCard] Share failed:', err);
    return false;
  }
};