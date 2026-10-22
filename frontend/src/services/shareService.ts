import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FestivalData, FestivalEvent, AttributionParams } from '../types/festival';
import { API_URL } from './api';

/**
 * ============================================================================
 * HOW THE VIRAL LOOP WORKS (PLEASE READ BEFORE MODIFYING)
 * ============================================================================
 * Generic "Share App" buttons have near-zero forwarding velocity because users
 * do not forward marketing spam or raw schedules into family WhatsApp groups.
 *
 * People DO forward:
 * 1. Time-sensitive practical rituals / checklists (e.g. "Kheer rakhne ka
 *    shubh muhurat aur niyam") where family members depend on accurate timing.
 * 2. High-status personalized artifacts (PDFs with recipient's name baked in).
 *
 * Every shared link, PDF footer, or poster contains attribution parameters:
 * ?from=<source>&uid=<userId>&fest=<festivalId>
 * When a recipient opens the link or scans the QR code in a PDF footer,
 * `captureAttribution()` stores this context. When the recipient signs up or
 * creates their own personalized guide, the loop attributes conversion and
 * recursively produces more personalized shares.
 * ============================================================================
 */

export const APP_BASE_URL = 'https://brahmand.app';

/**
 * Appends tracked attribution parameters to any destination path/URL.
 */
export function buildTrackedUrl(path: string, params: AttributionParams): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = `${APP_BASE_URL}${cleanPath}`;
  const queryParts: string[] = [];

  if (params.from) queryParts.push(`from=${encodeURIComponent(params.from)}`);
  if (params.uid) queryParts.push(`uid=${encodeURIComponent(params.uid)}`);
  if (params.fest) queryParts.push(`fest=${encodeURIComponent(params.fest)}`);

  return queryParts.length > 0 ? `${base}?${queryParts.join('&')}` : base;
}

/**
 * Captures ?from, ?uid, ?fest from window URL on Web or handles stored attribution on Native.
 */
export async function captureAttribution(): Promise<AttributionParams | null> {
  try {
    let from: string | null = null;
    let uid: string | null = null;
    let fest: string | null = null;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search || '');
      from = searchParams.get('from');
      uid = searchParams.get('uid');
      fest = searchParams.get('fest');
    }

    if (from || uid || fest) {
      const attribution: AttributionParams = {
        from: from || 'organic_direct',
        uid: uid || 'anonymous',
        fest: fest || '',
      };
      await AsyncStorage.setItem('brahmand_attribution', JSON.stringify(attribution));
      return attribution;
    }

    const stored = await AsyncStorage.getItem('brahmand_attribution');
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.warn('[Attribution] Failed to process attribution params', err);
    return null;
  }
}

/**
 * Safe executor for Native & Web Share.
 * Silently catches user cancellations and falls back to clipboard.
 */
export async function executeNativeShare({
  title,
  message,
  url,
  fileUri,
  onCopiedFallback,
}: {
  title: string;
  message: string;
  url?: string;
  fileUri?: string;
  onCopiedFallback?: () => void;
}): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  try {
    // 1. File sharing priority if fileUri provided and Sharing is available
    if (fileUri) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: title,
          mimeType: fileUri.endsWith('.pdf') ? 'application/pdf' : 'image/png',
          UTI: fileUri.endsWith('.pdf') ? 'com.adobe.pdf' : 'public.png',
        });
        return 'shared';
      }
    }

    // 2. Text/URL Share via React Native Share API
    const shareContent = {
      title,
      message: Platform.OS === 'ios' ? message : [message, url].filter(Boolean).join('\n\n'),
      url: Platform.OS === 'ios' && url ? url : undefined,
    };

    const result = await Share.share(shareContent, { dialogTitle: title });
    if (result.action === Share.sharedAction) {
      return 'shared';
    } else if (result.action === Share.dismissedAction) {
      return 'cancelled';
    }
    return 'shared';
  } catch (err: any) {
    // Silent catch for user abort/cancellation
    if (err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
      return 'cancelled';
    }

    console.warn('[Share] Native share failed, falling back to clipboard', err);
    try {
      const copyText = [message, url].filter(Boolean).join('\n\n');
      await Clipboard.setStringAsync(copyText);
      onCopiedFallback?.();
      return 'copied';
    } catch (clipboardErr) {
      console.error('[Share] Clipboard fallback failed', clipboardErr);
      return 'failed';
    }
  }
}

/* -------------------------------------------------------------------------- */
/* SHARE MODE BUILDERS                                                        */
/* -------------------------------------------------------------------------- */

/**
 * MODE 1: PRACTICAL GUIDE (Hero - Highest Forward Velocity)
 */
export async function sharePracticalGuide(
  event: FestivalEvent,
  userId: string,
  festivalId?: string,
  onCopiedFallback?: () => void
) {
  const festId = festivalId || event.festivalId || 'festival';
  const trackedUrl = buildTrackedUrl(`/events/${event.id}`, {
    from: `share_app_practical_${event.id}`,
    uid: userId || 'guest',
    fest: festId,
  });

  const stepsText = (event.practicalSteps || [])
    .map((s, idx) => {
      const windowStr = s.idealTimeWindow ? ` [${s.idealTimeWindow}]` : '';
      const noteStr = s.significanceOrNote ? ` (${s.significanceOrNote})` : '';
      return `${idx + 1}. ${s.action}${windowStr}${noteStr}`;
    })
    .join('\n');

  const lines = [
    `📌 *${event.title} — Shubh Samay & Niyam*`,
    event.date ? `🗓️ *Date:* ${event.date}` : '',
    event.time ? `⏰ *Samay:* ${event.time}` : '',
    event.location ? `📍 *Sthaan:* ${event.location}` : '',
    stepsText ? `\n*Kaise karna hai (Vidhi & Steps):*\n${stepsText}` : '',
    `\nPoori jaankari aur live reminders ke liye Brahmand app dekhein:\n${trackedUrl}`,
  ].filter(Boolean);

  return executeNativeShare({
    title: `${event.title} Guide`,
    message: lines.join('\n'),
    url: trackedUrl,
    onCopiedFallback,
  });
}

/**
 * MODE 2: PERSONALISED SHARE (Named PDF with Tracked QR Code)
 */
export async function sharePersonalisedGuide(
  event: FestivalEvent,
  recipientName: string,
  userId: string,
  festivalId?: string,
  onCopiedFallback?: () => void
) {
  const festId = festivalId || event.festivalId || 'festival';
  const sanitizedName = recipientName.trim();
  const pdfEndpoint = `${API_URL}/events/generate-pdf`;

  // Download PDF locally into cache
  const localFileName = `${sanitizedName.replace(/\s+/g, '_')}_${event.id}_guide.pdf`;
  const targetUri = `${FileSystem.cacheDirectory}${localFileName}`;

  const downloadResult = await FileSystem.downloadAsync(
    pdfEndpoint,
    targetUri,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      // Pass query parameters if GET or send request via file download
    }
  );

  // If downloadAsync needs POST, we can write body using an axios/fetch request
  let fileUriToShare = downloadResult.uri;
  if (downloadResult.status !== 200) {
    // Direct POST fetch fallback for binary streams
    const response = await fetch(pdfEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        festivalId: festId,
        recipientName: sanitizedName,
        userId: userId || 'guest',
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();
    const base64data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    await FileSystem.writeAsStringAsync(targetUri, base64data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    fileUriToShare = targetUri;
  }

  const trackedUrl = buildTrackedUrl(`/events/${event.id}`, {
    from: `pdf_${encodeURIComponent(sanitizedName.toLowerCase())}`,
    uid: userId || 'guest',
    fest: festId,
  });

  const message = `Kripya ${sanitizedName} ke liye taiyaar vishesh guide dekhein: ${event.title}.\n${trackedUrl}`;

  return executeNativeShare({
    title: `${sanitizedName} ke liye: ${event.title}`,
    message,
    url: trackedUrl,
    fileUri: fileUriToShare,
    onCopiedFallback,
  });
}

/**
 * MODE 3: MY SCHEDULE
 */
export async function shareMySchedule(
  starredEvents: FestivalEvent[],
  festival: FestivalData,
  userId: string,
  onCopiedFallback?: () => void
) {
  const trackedUrl = buildTrackedUrl(`/festivals/${festival.id}/schedule`, {
    from: 'share_my_schedule',
    uid: userId || 'guest',
    fest: festival.id,
  });

  const eventLines =
    starredEvents.length > 0
      ? starredEvents
          .map((e) => `• ${e.date ? `${e.date} ` : ''}${e.time ? `@ ${e.time} — ` : ''}${e.title}${e.location ? ` (${e.location})` : ''}`)
          .join('\n')
      : 'Koi event save nahi kiya gaya.';

  const message = [
    `🗓️ *Mera Festival Schedule: ${festival.name}*`,
    festival.venue || festival.city ? `📍 ${[festival.venue, festival.city].filter(Boolean).join(', ')}` : '',
    `\n*Chune gaye aayojan:*\n${eventLines}`,
    `\nApna schedule banayein aur dekhein:\n${trackedUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return executeNativeShare({
    title: `My Schedule - ${festival.name}`,
    message,
    url: trackedUrl,
    onCopiedFallback,
  });
}

/**
 * MODE 4: FULL FESTIVAL (Fallback Mode - Last in sheet)
 */
export async function shareFullFestival(
  festival: FestivalData,
  userId: string,
  onCopiedFallback?: () => void
) {
  const trackedUrl = buildTrackedUrl(`/festivals/${festival.id}`, {
    from: 'share_app_full',
    uid: userId || 'guest',
    fest: festival.id,
  });

  const message = [
    `🎉 *${festival.name}*`,
    festival.date ? `📅 *Date:* ${festival.date}` : '',
    festival.venue || festival.city ? `📍 *Sthaan:* ${[festival.venue, festival.city].filter(Boolean).join(', ')}` : '',
    festival.description ? `\n${festival.description}` : '',
    `\nPoore programs, aayojan aur updates Brahmand par dekhein:\n${trackedUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return executeNativeShare({
    title: festival.name,
    message,
    url: trackedUrl,
    onCopiedFallback,
  });
}

/**
 * MODE 5: POSTER / IMAGE SHARE
 */
export async function sharePosterImage(
  imageUri: string,
  festival: FestivalData,
  userId: string,
  onCopiedFallback?: () => void
) {
  const trackedUrl = buildTrackedUrl(`/festivals/${festival.id}`, {
    from: 'share_poster_image',
    uid: userId || 'guest',
    fest: festival.id,
  });

  const message = `Dekhein ${festival.name} ki vishesh jhalak! ${trackedUrl}`;

  return executeNativeShare({
    title: `${festival.name} Card`,
    message,
    url: trackedUrl,
    fileUri: imageUri,
    onCopiedFallback,
  });
}
