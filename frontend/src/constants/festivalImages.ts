export const FESTIVAL_IMAGE_MAP: Record<string, any> = {};

export const getFestivalImage = (name: string) => {
  const fallback = require('../../assets/images/traditional_diya_footer.png');
  if (!name || typeof name !== 'string') return fallback;

  const trimmed = name.trim();

  // 1. Direct match in map
  if (FESTIVAL_IMAGE_MAP[trimmed]) {
    return FESTIVAL_IMAGE_MAP[trimmed];
  }

  // 2. Case-insensitive exact match
  const searchLower = trimmed.toLowerCase();
  const exactKey = Object.keys(FESTIVAL_IMAGE_MAP).find(k => k.toLowerCase() === searchLower);
  if (exactKey) {
    return FESTIVAL_IMAGE_MAP[exactKey];
  }

  // 3. Handle names separated by slashes or commas e.g. "Makar Sankranti / Pongal", "Dussehra / Vijayadashami"
  const segments = searchLower.split(/[\/\,\-\–]/).map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    // Exact segment match
    const segMatch = Object.keys(FESTIVAL_IMAGE_MAP).find(k => k.toLowerCase() === seg);
    if (segMatch) {
      return FESTIVAL_IMAGE_MAP[segMatch];
    }
  }

  // 4. Substring match on segments
  for (const seg of segments) {
    const subMatch = Object.keys(FESTIVAL_IMAGE_MAP).find(k => {
      const kLower = k.toLowerCase();
      return seg.includes(kLower) || kLower.includes(seg);
    });
    if (subMatch) {
      return FESTIVAL_IMAGE_MAP[subMatch];
    }
  }

  // 5. Overall substring match
  const fallbackMatch = Object.keys(FESTIVAL_IMAGE_MAP).find(k => {
    const kLower = k.toLowerCase();
    return searchLower.includes(kLower) || kLower.includes(searchLower);
  });
  if (fallbackMatch) {
    return FESTIVAL_IMAGE_MAP[fallbackMatch];
  }

  return fallback;
};
