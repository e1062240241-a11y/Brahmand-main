export const getMapEmbedUrl = (coords: { latitude: number; longitude: number }) =>
  `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&output=embed`;

export const getMapSearchUrl = (coords: { latitude: number; longitude: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;

export const getMapHtml = (coords: { latitude: number; longitude: number }) => `
<html>
<body style="margin: 0; padding: 0;">
<iframe
width="100%"
height="100%"
frameborder="0"
style="border:0;"
src="${getMapEmbedUrl(coords)}"
allowfullscreen
/>
</body>
</html>`;
