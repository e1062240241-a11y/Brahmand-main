export interface FestivalThemeConfig {
  gradientColors: [string, string, string];
  nameHi?: string;
  emblem: string; // Emoji glyph or icon
  deity: string;
}

export const FESTIVAL_THEMES: Record<string, FestivalThemeConfig> = {
  diwali: {
    gradientColors: ['#FF6F00', '#D84315', '#4A148C'],
    nameHi: 'दीपावली महोत्सव',
    emblem: '🪔',
    deity: 'Maa Lakshmi & Lord Ganesha',
  },
  deepavali: {
    gradientColors: ['#FF6F00', '#D84315', '#4A148C'],
    nameHi: 'दीपावली',
    emblem: '🪔',
    deity: 'Maa Lakshmi',
  },
  holi: {
    gradientColors: ['#E91E63', '#9C27B0', '#FF9800'],
    nameHi: 'होली का महापर्व',
    emblem: '🎨',
    deity: 'Lord Krishna & Radha Rani',
  },
  navratri: {
    gradientColors: ['#C2185B', '#E64A19', '#FBC02D'],
    nameHi: 'शारदीय नवरात्रि',
    emblem: '🔱',
    deity: 'Maa Durga',
  },
  dussehra: {
    gradientColors: ['#E65100', '#BF360C', '#2E7D32'],
    nameHi: 'विजयदशमी',
    emblem: '🏹',
    deity: 'Lord Rama',
  },
  maha_shivratri: {
    gradientColors: ['#1A237E', '#4A148C', '#004D40'],
    nameHi: 'महाशिवरात्रि',
    emblem: '🕉',
    deity: 'Lord Shiva & Mata Parvati',
  },
  shivratri: {
    gradientColors: ['#1A237E', '#4A148C', '#004D40'],
    nameHi: 'महाशिवरात्रि',
    emblem: '🕉',
    deity: 'Lord Shiva',
  },
  janmashtami: {
    gradientColors: ['#0D47A1', '#1976D2', '#FFD700'],
    nameHi: 'श्री कृष्ण जन्माष्टमी',
    emblem: '🦚',
    deity: 'Bhagwan Shri Krishna',
  },
  ganesh_chaturthi: {
    gradientColors: ['#E65100', '#C2185B', '#F57F17'],
    nameHi: 'गणेश चतुर्थी',
    emblem: '🐘',
    deity: 'Bhagwan Ganesha',
  },
  raksha_bandhan: {
    gradientColors: ['#C2185B', '#FF7043', '#FFD54F'],
    nameHi: 'रक्षाबंधन',
    emblem: '🧵',
    deity: 'Sacred Bonds of Protection',
  },
  ram_navami: {
    gradientColors: ['#E65100', '#F57C00', '#FFB300'],
    nameHi: 'श्री राम नवमी',
    emblem: '🏹',
    deity: 'Maryada Purushottam Shri Rama',
  },
  makar_sankranti: {
    gradientColors: ['#0288D1', '#FFA000', '#D32F2F'],
    nameHi: 'मकर संक्रांति',
    emblem: '🪁',
    deity: 'Surya Dev',
  },
  teej: {
    gradientColors: ['#2E7D32', '#388E3C', '#FBC02D'],
    nameHi: 'हरियाली तीज',
    emblem: '🌸',
    deity: 'Mata Parvati & Lord Shiva',
  },
  default: {
    gradientColors: ['#FF6600', '#E53935', '#8E24AA'],
    nameHi: 'पावन पर्व',
    emblem: '🪔',
    deity: 'Vedic Deities',
  },
};

export const getFestivalTheme = (festivalName: string): FestivalThemeConfig => {
  if (!festivalName) return FESTIVAL_THEMES.default;
  const normalized = festivalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  for (const [key, value] of Object.entries(FESTIVAL_THEMES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return FESTIVAL_THEMES.default;
};
