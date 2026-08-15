import { SPECIAL_TEMPLE_DATA, DEFAULT_TEMPLE_LOCATIONS } from './templeStaticData';
import { CATEGORY_BADGE_MAP } from './templeDisplayMaps';

export const getCategoryBadge = (category?: string) => {
  if (!category) return null;
  const lower = category.toLowerCase().trim();
  for (const [key, value] of Object.entries(CATEGORY_BADGE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return { emoji: '🛕', label: category };
};

export const getSpecialTempleKey = (nameOrId: string) => {
  if (!nameOrId || typeof nameOrId !== 'string') return '';
  const normalizedName = nameOrId.toLowerCase().trim();
  if (!normalizedName || normalizedName === 'temple' || normalizedName === 'shrine') return '';

  const specialTemple = Object.entries(SPECIAL_TEMPLE_DATA).find(([key, value]) => {
    const keyLower = key.toLowerCase();
    if (keyLower === normalizedName) return true;

    return value.aliases.some((alias) => {
      const aliasLower = alias.toLowerCase().trim();
      if (!aliasLower || aliasLower.length < 3) return false;
      if (aliasLower === normalizedName) return true;
      const regex = new RegExp(`\\b${aliasLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(normalizedName);
    });
  });

  if (specialTemple) {
    return specialTemple[0];
  }
  return '';
};

export const formatTempleLocation = (temple: any) => {
  const location = temple?.location;
  const specialKey = getSpecialTempleKey(temple?.name);
  if (!location || (typeof location === 'object' && Object.keys(location).length === 0)) {
    if (specialKey) {
      return DEFAULT_TEMPLE_LOCATIONS[specialKey];
    }
    return DEFAULT_TEMPLE_LOCATIONS[temple?.name] || 'Unknown location';
  }
  if (typeof location === 'string') return location;
  const fallback = [location.area, location.city, location.state, location.country]
    .filter(Boolean)
    .join(', ');
  if (fallback) return fallback;
  if (specialKey) {
    return DEFAULT_TEMPLE_LOCATIONS[specialKey];
  }
  return Object.values(location || {})
    .filter((value) => typeof value === 'string' && value.trim())
    .join(', ') || DEFAULT_TEMPLE_LOCATIONS[temple?.name] || 'Unknown location';
};

export const getTempleAartiSessions = (timings: Record<string, string>, templeName: string) => {
  const order = ['morning', 'afternoon', 'evening'];
  const entries = Object.entries(timings || {}).filter(([, value]) => value);
  const ordered = order
    .map((key) => entries.find(([name]) => name.toLowerCase() === key))
    .filter(Boolean) as [string, string][];
  const rest = entries.filter(([name]) => !order.includes(name.toLowerCase()));
  const sessions = [...ordered, ...rest];
  if (sessions.length > 0) return sessions;

  const specialKey = getSpecialTempleKey(templeName);
  const specialTemple = SPECIAL_TEMPLE_DATA[specialKey];
  if (specialTemple?.aartiSessions?.length) {
    return specialTemple.aartiSessions.map(({ title, time }) => [title, time] as [string, string]);
  }
  return [];
};

export const checkIsAartiLive = (sessions: [string, string][]) => {
  if (!sessions || sessions.length === 0) return false;
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
  const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();

  for (const session of sessions) {
    const timeStr = session[1].split('-')[0].trim();
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = parseInt(match[2], 10);
      const period = match[3].toUpperCase();

      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      const sessionMinutes = hour * 60 + min;
      let diff = currentMinutes - sessionMinutes;
      if (diff < -720) diff += 1440;
      if (diff > 720) diff -= 1440;

      if (diff >= -15 && diff <= 45) {
        return true;
      }
    }
  }
  return false;
};
