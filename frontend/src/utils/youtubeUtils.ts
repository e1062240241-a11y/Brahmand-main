export function getYoutubeVideoId(url: string) {
  if (!url) return null;
  if (url.includes('live_stream')) return null; // Prevent matching "live_stream" as 11-char video ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function getYoutubeAppUrl(url: string) {
  if (!url) return '';
  if (url.includes('channel=')) {
    const channelId = url.split('channel=')[1].split('&')[0];
    return `https://www.youtube.com/channel/${channelId}/live`;
  }
  if (url.includes('@')) {
    const handle = url.split('@')[1].split('/')[0].split('?')[0];
    return `https://www.youtube.com/@${handle}/live`;
  }
  return url;
}

export function getYoutubeEmbedUrl(url: string) {
  if (!url) return '';
  if (url.includes('embed/live_stream')) {
    return url + '&autoplay=1&enablejsapi=1&origin=https://www.youtube.com&playsinline=1';
  }
  if (url.includes('embed/')) {
    return url;
  }
  const videoId = getYoutubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=https://www.youtube.com&playsinline=1&rel=0`;
  }
  if (url.includes('@')) {
    const handle = url.split('@')[1].split('/')[0].split('?')[0];
    return `https://www.youtube.com/@${handle}/live`;
  }
  return url;
}

export function getYoutubeMobileUrl(url: string) {
  if (url.includes('embed?listType=playlist&list=')) {
    const listId = url.split('&list=')[1].split('&')[0];
    return `https://m.youtube.com/playlist?list=${listId}`;
  }

  return getYoutubeEmbedUrl(url);
}

export const getYoutubeHtml = (embedUrl: string) => `
<html>
<body style="margin: 0; padding: 0; background: #000;">
<iframe
width="100%"
height="100%"
frameborder="0"
style="border:0;"
src="${embedUrl}"
allow="autoplay; encrypted-media"
allowfullscreen
/>
</body>
</html>`;
