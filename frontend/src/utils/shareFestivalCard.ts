import { Share as RNShareApi, Platform, NativeModules } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.brahmand.app';

// Pre-compiled regex for fast cancellation detection
const CANCELLATION_REGEX = /cancelled|dismissed|user did not share/i;

// -------------------------------------------------------------
// TYPESAFE INTERFACES FOR OPTIONAL MODULES & PAYLOADS
// -------------------------------------------------------------
interface RNShareModule {
  open(options: RNShareOptions): Promise<unknown>;
}

interface IntentLauncherModule {
  startActivityAsync(activity: string, options: Record<string, unknown>): Promise<unknown>;
}

interface ActivityItemSource {
  placeholderItem: { type: string; content: string };
  item: { default: { type: string; content: string } };
  linkMetadata?: { title?: string };
}

interface RNShareOptions {
  title?: string;
  subject?: string;
  message?: string;
  url?: string;
  type?: string;
  filename?: string;
  failOnCancel?: boolean;
  activityItemSources?: ActivityItemSource[];
}

interface SharePayload {
  cleanTitle: string;
  greetingHeader: string;
  shareMessage: string;
}

// -------------------------------------------------------------
// HELPER UTILITIES & TYPESAFE LOGGING
// -------------------------------------------------------------
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
};

const isUserCancellation = (err: unknown): boolean => {
  const message = getErrorMessage(err);
  return CANCELLATION_REGEX.test(message);
};

const ensureFileProtocol = (path: string): string => {
  if (!path) return path;
  return path.startsWith('file://') ? path : `file://${path}`;
};

const logShare = (level: 'info' | 'warn' | 'error', message: string, data?: unknown) => {
  if (__DEV__) {
    const timestamp = new Date().toISOString();
    const prefix = `[ShareFestivalCard ${timestamp}] [${level.toUpperCase()}]`;
    if (data !== undefined) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }
};

/**
 * Safely load react-native-share module with TypeScript typing.
 */
const getRNShare = (): RNShareModule | null => {
  try {
    if (!NativeModules.RNShare) {
      return null;
    }
    const RNShareModule = require('react-native-share');
    const Share = RNShareModule?.default || RNShareModule;
    if (Share && typeof Share.open === 'function') {
      return Share as RNShareModule;
    }
  } catch (e: unknown) {
    logShare('warn', 'react-native-share native module check failed', getErrorMessage(e));
  }
  return null;
};

/**
 * Safely load ExpoIntentLauncher module with TypeScript typing.
 */
const getIntentLauncher = (): IntentLauncherModule | null => {
  try {
    const IntentLauncher = require('expo-intent-launcher');
    if (IntentLauncher && typeof IntentLauncher.startActivityAsync === 'function') {
      return IntentLauncher as IntentLauncherModule;
    }
  } catch (e: unknown) {
    logShare('warn', 'ExpoIntentLauncher native module check failed', getErrorMessage(e));
  }
  return null;
};

/**
 * Construct formatted share message and headers.
 */
const buildSharePayload = (
  festivalName: string,
  festivalDescription: string = 'May this auspicious occasion bring joy and prosperity.'
): SharePayload => {
  const cleanTitle = festivalName.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Festival';
  const greetingHeader = `✨ Wishing you and your family a very Happy ${festivalName}! ✨`;

  const shareMessage =
    `${greetingHeader}\n\n` +
    `${festivalDescription}\n\n` +
    `I created this personalized greeting on Brahmand App. Check out the link in the image or click below to download!\n` +
    `🔗 Download: ${PLAY_STORE_URL}`;

  return { cleanTitle, greetingHeader, shareMessage };
};

/**
 * Prepares image file in FileSystem.documentDirectory with caching & forced PNG conversion.
 */
const prepareImageFile = async (
  uri: string,
  cleanTitle: string,
  convertToPng: boolean = false
): Promise<string> => {
  logShare('info', 'Source URI Validation Check in prepareImageFile:', {
    rawUri: uri,
    isLocalFile: uri.startsWith('file://') || uri.startsWith('/'),
    isHttp: uri.startsWith('http://') || uri.startsWith('https://'),
    isBase64: uri.startsWith('data:'),
  });

  const friendlyFileName = `${cleanTitle}_Greeting.png`;
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const targetUri = `${baseDir}${friendlyFileName}`;

  try {
    let processedUri = uri;

    // 1. Forced WebP/AVIF/captured image to PNG conversion via expo-image-manipulator
    if (convertToPng) {
      try {
        const ImageManipulator = require('expo-image-manipulator');
        if (ImageManipulator && typeof ImageManipulator.manipulateAsync === 'function') {
          logShare('info', 'Executing forced PNG conversion via ImageManipulator...');
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [],
            { format: ImageManipulator.SaveFormat.PNG, compress: 1.0 }
          );
          if (manipulated?.uri) {
            processedUri = manipulated.uri;
            logShare('info', 'ImageManipulator PNG conversion succeeded:', manipulated.uri);
          }
        }
      } catch (manipErr: unknown) {
        logShare('warn', 'ImageManipulator PNG conversion failed, falling back to direct copy:', getErrorMessage(manipErr));
      }
    }

    // 2. Save converted PNG to target URI in documentDirectory
    await FileSystem.copyAsync({
      from: processedUri,
      to: targetUri,
    });

    logShare('info', 'File successfully copied to documentDirectory:', targetUri);
    return ensureFileProtocol(targetUri);
  } catch (err: unknown) {
    logShare('warn', 'prepareImageFile error, returning original normalized URI:', getErrorMessage(err));
    return ensureFileProtocol(uri);
  }
};

/**
 * Universal fallback pipeline (RNShareApi.share -> expo-sharing)
 */
const executeUniversalFallback = async (
  fileUrl: string | null,
  payload: SharePayload
): Promise<boolean> => {
  const { greetingHeader, shareMessage } = payload;

  // 1. React Native Built-in Share
  try {
    logShare('info', 'Executing universal fallback via RN Share.share...');
    await RNShareApi.share({
      message: shareMessage,
      url: fileUrl || PLAY_STORE_URL,
      title: greetingHeader,
    });
    return true;
  } catch (rnApiErr: unknown) {
    logShare('warn', 'RNShareApi fallback failed', getErrorMessage(rnApiErr));
  }

  // 2. Expo Sharing
  if (fileUrl) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        logShare('info', 'Executing universal fallback via expo-sharing...');
        await Sharing.shareAsync(fileUrl, {
          mimeType: 'image/png',
          dialogTitle: greetingHeader,
          UTI: 'public.png',
        });
        return true;
      }
    } catch (sharingErr: unknown) {
      logShare('warn', 'expo-sharing fallback failed', getErrorMessage(sharingErr));
    }
  }

  return false;
};

/**
 * iOS-specific share pipeline with DocumentDirectory file & linkMetadata.title.
 */
const shareIOS = async (
  uri: string | null,
  payload: SharePayload
): Promise<boolean> => {
  logShare('info', 'Executing iOS share pipeline');
  const { cleanTitle, greetingHeader, shareMessage } = payload;

  let fileUrl: string | null = null;
  if (uri) {
    fileUrl = await prepareImageFile(uri, cleanTitle, true);
  }

  // Diagnostic path logging
  if (fileUrl) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUrl);
      logShare('info', 'File verification in shareIOS:', {
        fileUrl,
        exists: fileInfo.exists,
        size: fileInfo.exists ? fileInfo.size : 'N/A',
      });
    } catch (e: unknown) {
      logShare('warn', 'fileInfo check error:', getErrorMessage(e));
    }
  }

  const RNShare = getRNShare();
  if (RNShare) {
    try {
      logShare('info', 'Attempting react-native-share on iOS with activityItemSources linkMetadata.title...');
      const shareOptions: RNShareOptions = {
        title: greetingHeader,
        subject: greetingHeader,
        message: shareMessage,
        failOnCancel: false,
      };

      if (fileUrl) {
        shareOptions.url = fileUrl;
        shareOptions.type = 'image/png';
        shareOptions.filename = `${cleanTitle} Greeting`;

        // Safe iOS LinkPresentation metadata with title (icon property omitted to prevent ImageIO crash)
        shareOptions.activityItemSources = [
          {
            placeholderItem: { type: 'url', content: fileUrl },
            item: { default: { type: 'url', content: fileUrl } },
            linkMetadata: {
              title: greetingHeader,
            },
          },
          {
            placeholderItem: { type: 'text', content: shareMessage },
            item: { default: { type: 'text', content: shareMessage } },
          },
        ];
      } else {
        shareOptions.url = PLAY_STORE_URL;
      }

      await RNShare.open(shareOptions);
      logShare('info', 'iOS react-native-share completed successfully');
      return true;
    } catch (rnErr: unknown) {
      if (isUserCancellation(rnErr)) {
        logShare('info', 'iOS share cancelled by user');
        return false;
      }
      logShare('warn', 'iOS react-native-share failed, triggering universal fallback', getErrorMessage(rnErr));
    }
  }

  return executeUniversalFallback(fileUrl, payload);
};

/**
 * Android-specific share pipeline with IntentLauncher & third-party app support.
 */
const shareAndroid = async (
  uri: string | null,
  payload: SharePayload
): Promise<boolean> => {
  logShare('info', 'Executing Android share pipeline');
  const { cleanTitle, greetingHeader, shareMessage } = payload;

  let fileUrl: string | null = null;
  if (uri) {
    fileUrl = await prepareImageFile(uri, cleanTitle, false);
  }

  const RNShare = getRNShare();
  if (RNShare) {
    try {
      logShare('info', 'Attempting react-native-share on Android...');
      const shareOptions: RNShareOptions = {
        title: greetingHeader,
        subject: greetingHeader,
        message: shareMessage,
        failOnCancel: false,
      };

      if (fileUrl) {
        shareOptions.url = fileUrl;
        shareOptions.type = 'image/png';
        shareOptions.filename = `${cleanTitle} Greeting`;
      } else {
        shareOptions.url = PLAY_STORE_URL;
      }

      await RNShare.open(shareOptions);
      logShare('info', 'Android react-native-share completed successfully');
      return true;
    } catch (rnShareErr: unknown) {
      if (isUserCancellation(rnShareErr)) {
        logShare('info', 'Android share cancelled by user');
        return false;
      }
      logShare('warn', 'Android react-native-share failed, trying IntentLauncher', getErrorMessage(rnShareErr));
    }
  }

  // Android Specific Intent Launcher: Sends BOTH image + caption to WhatsApp & messaging apps
  if (fileUrl) {
    const IntentLauncher = getIntentLauncher();
    if (IntentLauncher) {
      try {
        logShare('info', 'Triggering Android IntentLauncher with Image + Caption...');
        const contentUri = await FileSystem.getContentUriAsync(fileUrl);

        await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
          type: 'image/png',
          extra: {
            'android.intent.extra.STREAM': contentUri,
            'android.intent.extra.TEXT': shareMessage,
          },
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });

        logShare('info', 'Android Intent launched successfully');
        return true;
      } catch (intentErr: unknown) {
        logShare('warn', 'Android IntentLauncher error:', getErrorMessage(intentErr));
      }
    }
  }

  return executeUniversalFallback(fileUrl, payload);
};

/**
 * Web-specific share pipeline using navigator.share.
 */
const shareWeb = async (
  uri: string | null,
  payload: SharePayload
): Promise<boolean> => {
  logShare('info', 'Executing Web share pipeline');
  const { greetingHeader, shareMessage } = payload;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const webShareData: ShareData = {
        title: greetingHeader,
        text: shareMessage,
        url: uri || PLAY_STORE_URL,
      };
      await navigator.share(webShareData);
      logShare('info', 'Web navigator.share completed successfully');
      return true;
    } catch (webErr: unknown) {
      if (isUserCancellation(webErr)) {
        logShare('info', 'Web share cancelled by user');
        return false;
      }
      logShare('warn', 'Web navigator.share error:', getErrorMessage(webErr));
    }
  }

  return false;
};

/**
 * Main cross-platform share controller router.
 */
export const shareFestivalCard = async (
  uri: string | null,
  festivalName: string,
  festivalDescription: string = 'May this auspicious occasion bring joy and prosperity.'
): Promise<boolean> => {
  logShare('info', 'shareFestivalCard invoked with source URI validation:', {
    festivalName,
    platform: Platform.OS,
    hasUri: Boolean(uri),
    rawUri: uri,
  });

  const payload = buildSharePayload(festivalName, festivalDescription);

  switch (Platform.OS) {
    case 'ios':
      return shareIOS(uri, payload);
    case 'android':
      return shareAndroid(uri, payload);
    case 'web':
      return shareWeb(uri, payload);
    default:
      return shareAndroid(uri, payload);
  }
};

/**
 * Universal text/link/image content sharing helper.
 * Silently handles user cancellation without raising errors/alerts.
 */
export const shareContent = async (options: {
  title?: string;
  message: string;
  url?: string;
  imageUri?: string;
}): Promise<boolean> => {
  const { title = 'Brahmand', message, url, imageUri } = options;

  if (imageUri) {
    return shareFestivalCard(imageUri, title, message);
  }

  const payload: SharePayload = {
    cleanTitle: title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Brahmand',
    greetingHeader: title,
    shareMessage: message,
  };

  try {
    return await executeUniversalFallback(url || null, payload);
  } catch (err: unknown) {
    if (isUserCancellation(err)) {
      return false;
    }
    logShare('warn', 'shareContent execution error:', getErrorMessage(err));
    return false;
  }
};