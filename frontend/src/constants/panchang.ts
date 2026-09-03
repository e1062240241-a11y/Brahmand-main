import {
  ChoghadiyaItem,
  HoraItem,
  HoraNature,
  PlanetItemDisplay,
  ShadowPlanetDisplay,
} from '../types/panchang';

export const STATIC_CHOGHADIYA_LIST: readonly ChoghadiyaItem[] = [
  { muhurta: 'Char', time: '06:00 - 07:30', is_good: true },
  { muhurta: 'Amrit', time: '07:30 - 09:30', is_good: true },
  { muhurta: 'Amrit', time: '09:00 - 10:30', is_good: true },
  { muhurta: 'Kaal', time: '10:30 - 12:00', is_good: false },
  { muhurta: 'Shubh', time: '12:00 - 13:30', is_good: true },
  { muhurta: 'Rog', time: '13:00 - 15:30', is_good: false },
  { muhurta: 'Labh', time: '15:00 - 16:30', is_good: true },
  { muhurta: 'Udveg', time: '16:00 - 18:30', is_good: false },
] as const;

export const GOOD_MUHURTAS: readonly string[] = [
  'Amrit',
  'Shubh',
  'Labh',
  'Char',
  'Chara',
] as const;

export const STATIC_HORA_LIST: readonly HoraItem[] = [
  { time: '05:45 AM - 06:45 AM', hora: 'Sun', nature: { text: 'BENEFIC', type: 'good' } },
  { time: '06:45 AM - 07:45 AM', hora: 'Venus', nature: { text: 'GOOD', type: 'good' } },
  { time: '07:45 AM - 08:45 AM', hora: 'Mercury', nature: { text: 'NEUTRAL', type: 'neutral' } },
  { time: '08:45 AM - 09:45 AM', hora: 'Moon', nature: { text: 'BENEFIC', type: 'good' } },
  { time: '09:45 AM - 10:45 AM', hora: 'Saturn', nature: { text: 'MALEFIC', type: 'bad' } },
  { time: '10:45 AM - 11:45 AM', hora: 'Jupiter', nature: { text: 'BENEFIC', type: 'good' } },
  { time: '11:45 AM - 12:45 PM', hora: 'Mars', nature: { text: 'BAD', type: 'bad' } },
] as const;

export const PLANET_NATURES: Record<string, HoraNature> = {
  Sun: { text: 'BENEFIC', type: 'good' },
  Moon: { text: 'BENEFIC', type: 'good' },
  Mars: { text: 'BAD', type: 'bad' },
  Mercury: { text: 'NEUTRAL', type: 'neutral' },
  Jupiter: { text: 'BENEFIC', type: 'good' },
  Venus: { text: 'GOOD', type: 'good' },
  Saturn: { text: 'MALEFIC', type: 'bad' },
};

export const PLANET_ICONS: Record<string, { uri: string }> = {
  Sun: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/sun2.webp' },
  Venus: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/venus.webp' },
  Mercury: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/mercury.webp' },
  Moon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/mon.webp' },
  Saturn: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/saturn.webp' },
  Jupiter: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/jupiter2.webp' },
  Mars: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/mars.webp' },
};

export const PLANET_DETAILS: Record<string, { sanskrit: string; desc: string; icon: { uri: string } }> = {
  Sun: {
    sanskrit: 'SURYA',
    desc: 'Auspicious for new beginnings and leadership roles.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/sun3.webp' },
  },
  Moon: {
    sanskrit: 'CHANDRA',
    desc: 'Mental peace and emotional stability. Good for family.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/moon2.webp' },
  },
  Jupiter: {
    sanskrit: 'GURU',
    desc: 'Internal growth. Re-evaluate financial investments.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/jupiter2.webp' },
  },
  Mars: {
    sanskrit: 'MANGAL',
    desc: 'High courage and ambition. Avoid arguments today.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/mars2.webp' },
  },
  Saturn: {
    sanskrit: 'SHANI',
    desc: 'Focus on discipline and planning. Patience is key.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/saturn2.webp' },
  },
  Rahu: {
    sanskrit: 'RAHU',
    desc: 'TRANSFORMATION',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/rahu.webp' },
  },
  Ketu: {
    sanskrit: 'KETU',
    desc: 'WISDOM',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/ketu.webp' },
  },
};

export const DEFAULT_MAIN_PLANETS_FALLBACK: PlanetItemDisplay[] = [
  {
    name: 'Sun',
    sanskrit: 'SURYA',
    sign: 'Aries',
    degree: "15° 42'",
    motion: 'DIRECT',
    desc: 'Auspicious for new beginnings and leadership roles.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/sun3.webp' },
  },
  {
    name: 'Moon',
    sanskrit: 'CHANDRA',
    sign: 'Cancer',
    degree: "22° 11'",
    motion: 'DIRECT',
    desc: 'Mental peace and emotional stability. Good for family.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/moon2.webp' },
  },
  {
    name: 'Jupiter',
    sanskrit: 'GURU',
    sign: 'Taurus',
    degree: "08° 15'",
    motion: 'RETRO',
    desc: 'Internal growth. Re-evaluate financial investments.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/jupiter2.webp' },
  },
  {
    name: 'Mars',
    sanskrit: 'MANGAL',
    sign: 'Leo',
    degree: "04° 29'",
    motion: 'DIRECT',
    desc: 'High courage and ambition. Avoid arguments today.',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/mars2.webp' },
  },
];

export const DEFAULT_SHADOW_PLANETS_FALLBACK: ShadowPlanetDisplay[] = [
  {
    name: 'Rahu',
    signDegree: "Pisces • 12° 50'",
    meaning: 'TRANSFORMATION',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/rahu.webp' },
  },
  {
    name: 'Ketu',
    signDegree: "Virgo • 12° 50'",
    meaning: 'WISDOM',
    icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/ketu.webp' },
  },
];

export const DEFAULT_SATURN_FALLBACK: PlanetItemDisplay = {
  name: 'Saturn',
  sanskrit: 'SHANI',
  sign: 'Aquarius',
  degree: "28° 02'",
  motion: 'DIRECT',
  desc: 'Focus on discipline and planning. Patience is key.',
  icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/saturn2.webp' },
};

export const SUN_MOON_ICONS = {
  sunrise: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/sun.webp',
  sunset: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/sunset.webp',
  moonrise: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/moonrise.webp',
  moonset: 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/moonset.webp',
} as const;

export const CELESTIAL_EVENT_ICON = 'https://brahmandfeed23.b-cdn.net/assets/zodiac/su/celestial.webp';
