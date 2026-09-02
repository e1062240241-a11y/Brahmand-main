/**
 * mediaQuality.ts
 * Utilities for smart media quality switching.
 * Generates thumbnail URLs by appending query params that are
 * commonly supported by CDNs (Cloudinary, imgix, Firebase, etc.).
 * Falls back to the original URL when thumbnail generation fails.
 */

export type MediaQuality = 'high' | 'thumbnail';

const THUMBNAIL_WIDTH = 200;  // px – small enough to download fast
const THUMBNAIL_QUALITY = 40; // jpeg quality 0-100

/**
 * Build a thumbnail URL for a given media URL.
 * Strategy (tries in order):
 *  1. Cloudinary auto-transform
 *  2. Firebase/GCS resize suffix
 *  3. Imgix params
 *  4. Plain query-string hint (ignored by most, but harmless)
 */
export function getThumbnailUrl(mediaUrl: string): string {
  if (!mediaUrl) return '';

  try {
    // ── Cloudinary ──────────────────────────────────────────────────────────
    if (mediaUrl.includes('res.cloudinary.com')) {
      // Insert /w_200,q_40,f_auto/ before the version/filename segment
      return mediaUrl.replace(
        /\/upload\//,
        `/upload/w_${THUMBNAIL_WIDTH},q_${THUMBNAIL_QUALITY},f_auto,c_fill/`,
      );
    }

    // ── Firebase Storage / Google Cloud Storage ──────────────────────────────
    // GCS doesn't natively resize; use query params that are ignored but
    // signal intent. For actual resizing, the backend should pre-generate thumbs.
    if (mediaUrl.includes('firebasestorage.googleapis.com') || mediaUrl.includes('.storage.googleapis.com')) {
      // We can't verify if it exists without fetching, so we try the raw CDN
      // with quality hint appended to alt url
      return mediaUrl.includes('?')
        ? `${mediaUrl}&thumb=1&w=${THUMBNAIL_WIDTH}`
        : `${mediaUrl}?thumb=1&w=${THUMBNAIL_WIDTH}`;
    }

    // ── Imgix ─────────────────────────────────────────────────────────────────
    if (mediaUrl.includes('.imgix.net')) {
      const sep = mediaUrl.includes('?') ? '&' : '?';
      return `${mediaUrl}${sep}w=${THUMBNAIL_WIDTH}&q=${THUMBNAIL_QUALITY}&auto=format`;
    }

    // ── Run.app / Cloud Run CDN ──────────────────────────────────────────────
    // Custom backend: append query params as hints
    if (mediaUrl.includes('.run.app')) {
      const sep = mediaUrl.includes('?') ? '&' : '?';
      return `${mediaUrl}${sep}thumb=1&w=${THUMBNAIL_WIDTH}`;
    }

    // ── Generic fallback: original URL ───────────────────────────────────────
    return mediaUrl;
  } catch {
    return mediaUrl;
  }
}

/**
 * Return the media URL to use based on quality level.
 * 'high' → original URL
 * 'thumbnail' → CDN-transformed thumbnail URL (or best approximation)
 */
export function getMediaUrl(post: any, quality: MediaQuality): string {
  const rawUrl: string =
    post?.media_url ||
    post?.mediaUrl ||
    post?.image_url ||
    post?.imageUrl ||
    post?.thumbnail_url ||
    post?.thumbnailUrl ||
    '';

  if (!rawUrl) return '';

  const mediaType = String(post?.media_type || post?.mediaType || '').toLowerCase();
  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(rawUrl);

  if (isVideo) {
    // Videos: always return the original video URL (do not use the image poster/thumbnail here,
    // as overriding media_url with a jpeg causes AVPlayer to crash/throw errors when preloading or playing).
    return rawUrl;
  }

  if (quality === 'high') {
    return rawUrl;
  }

  // For thumbnails, prefer an explicit thumbnail_url field first
  const explicitThumb: string =
    post?.thumbnail_url ||
    post?.thumbnailUrl ||
    post?.metadata?.thumbnail_url ||
    '';

  if (explicitThumb && explicitThumb !== rawUrl) {
    return explicitThumb;
  }

  // Images: try CDN thumbnail transform
  return getThumbnailUrl(rawUrl);
}

/**
 * Check if a post index qualifies for high quality on initial load.
 * Posts 0–4 (first 5) get high quality immediately.
 */
export function getInitialQuality(index: number): MediaQuality {
  return index < 5 ? 'high' : 'thumbnail';
}
