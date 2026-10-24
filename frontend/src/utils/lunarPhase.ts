/**
 * Lunar Phase & Hindu Panchang Tithi Utility
 * Calculates astronomical moon phase, illumination percentage,
 * Paksha, Tithi name, and SVG clip path for real-time rendering.
 */

export interface LunarPhaseInfo {
  phase: number; // 0.0 to 1.0 (0.0 = New Moon, 0.5 = Full Moon / Purnima, 1.0 = New Moon)
  illumination: number; // 0 to 100%
  cycleDay: number; // 0 to 29.53
  tithiNumber: number; // 1 to 30
  paksha: 'शुक्ल पक्ष' | 'कृष्ण पक्ष';
  tithiNameHindi: string;
  phaseNameHindi: string;
  phaseNameEn: string;
  isPurnima: boolean;
  isSharadPurnimaSeason: boolean;
  description: string;
}

const TITHI_NAMES = [
  'प्रतिपदा',
  'द्वितीया',
  'तृतीया',
  'चतुर्थी',
  'पंचमी',
  'षष्ठी',
  'सप्तमी',
  'अष्टमी',
  'नवमी',
  'दशमी',
  'एकादशी',
  'द्वादशी',
  'त्रयोदशी',
  'चतुर्दशी',
  'पूर्णिमा',
];

// Reference known New Moon: 2000-01-06 18:14 UTC
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_DAYS = 29.53058867;
const DAY_MS = 86400000;

/**
 * Calculates the exact lunar phase and tithi details for any given date.
 */
export function getAstronomicalMoonPhase(
  date: Date = new Date(),
  overridePhase?: number
): LunarPhaseInfo {
  let phase: number;
  let cycleDay: number;

  if (typeof overridePhase === 'number') {
    phase = Math.min(1, Math.max(0, overridePhase));
    cycleDay = phase * SYNODIC_MONTH_DAYS;
  } else {
    const diffMs = date.getTime() - REF_NEW_MOON_MS;
    const diffDays = diffMs / DAY_MS;
    cycleDay = ((diffDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
    phase = cycleDay / SYNODIC_MONTH_DAYS;
  }

  // Illumination percentage (0% at New Moon, 100% at Full Moon)
  const illumination = Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100);

  // Tithi calculation (30 Tithis in a synodic month, 12 degrees each)
  const tithiIndex = Math.min(29, Math.max(0, Math.floor(phase * 30)));
  const tithiNumber = tithiIndex + 1;

  // Purnima is around phase 0.50 (tithiIndex 14)
  const isPurnima = tithiIndex === 14 || (phase >= 0.47 && phase <= 0.53);

  let paksha: 'शुक्ल पक्ष' | 'कृष्ण पक्ष';
  let tithiNameHindi: string;

  if (tithiIndex < 15) {
    paksha = 'शुक्ल पक्ष';
    tithiNameHindi = TITHI_NAMES[tithiIndex];
  } else {
    paksha = 'कृष्ण पक्ष';
    tithiNameHindi = tithiIndex === 29 ? 'अमावस्या' : TITHI_NAMES[tithiIndex - 15];
  }

  // Check if current date falls near Sharad Purnima season (Ashwin month: Sept - Oct)
  const month = date.getMonth(); // 8 = Sept, 9 = Oct
  const isSharadPurnimaSeason = (month === 8 || month === 9) && isPurnima;

  // English & Hindi Phase names
  let phaseNameHindi = '';
  let phaseNameEn = '';
  let description = '';

  if (isPurnima) {
    phaseNameHindi = isSharadPurnimaSeason ? 'शरद पूर्णिमा • पूर्ण चंद्र' : 'पूर्णिमा • पूर्ण चंद्र';
    phaseNameEn = isSharadPurnimaSeason ? 'Sharad Purnima (Full Moon)' : 'Full Moon (Purnima)';
    description =
      'शरद पूर्णिमा के दिन चंद्रमा अपनी समस्त 16 कलाओं से युक्त होकर अमृत वर्षा करता है।';
  } else if (phase < 0.03 || phase > 0.97) {
    phaseNameHindi = 'अमावस्या (नव चंद्र)';
    phaseNameEn = 'New Moon (Amavasya)';
    description = 'अमावस्या: आत्म-चिंतन व साधना का पावन समय।';
  } else if (phase < 0.23) {
    phaseNameHindi = `शुक्ल ${tithiNameHindi} (बाल चंद्र)`;
    phaseNameEn = 'Waxing Crescent';
    description = 'शुक्ल पक्ष: चंद्र कलाओं की वृद्धि और सकारात्मक ऊर्जा।';
  } else if (phase >= 0.23 && phase <= 0.27) {
    phaseNameHindi = 'शुक्ल अष्टमी (प्रथम अर्ध चंद्र)';
    phaseNameEn = 'First Quarter';
    description = 'शुक्ल अष्टमी: 50% प्रकाशयुक्त दिव्य चंद्र रूप।';
  } else if (phase < 0.47) {
    phaseNameHindi = `शुक्ल ${tithiNameHindi} (कुबड़ा चंद्र)`;
    phaseNameEn = 'Waxing Gibbous';
    description = 'पूर्णिमा की ओर बढ़ता हुआ तेजस्वी चंद्र।';
  } else if (phase <= 0.73) {
    phaseNameHindi = `कृष्ण ${tithiNameHindi} (क्षीण होता चंद्र)`;
    phaseNameEn = 'Waning Gibbous';
    description = 'कृष्ण पक्ष: ज्ञान व वैराग्य की साधना का काल।';
  } else if (phase > 0.73 && phase <= 0.77) {
    phaseNameHindi = 'कृष्ण अष्टमी (अंतिम अर्ध चंद्र)';
    phaseNameEn = 'Last Quarter';
    description = 'कृष्ण अष्टमी: 50% कृष्ण पक्षीय चंद्र।';
  } else {
    phaseNameHindi = `कृष्ण ${tithiNameHindi} (कृष्ण बाल चंद्र)`;
    phaseNameEn = 'Waning Crescent';
    description = 'अमावस्या की ओर अग्रसर सौम्य चंद्र कला।';
  }

  return {
    phase,
    illumination,
    cycleDay,
    tithiNumber,
    paksha,
    tithiNameHindi,
    phaseNameHindi,
    phaseNameEn,
    isPurnima,
    isSharadPurnimaSeason,
    description,
  };
}

/**
 * Generates the SVG path for the illuminated portion of the moon.
 * @param cx Center X
 * @param cy Center Y
 * @param r Moon radius
 * @param phase Phase fraction (0.0 to 1.0, where 0.5 is Full Moon)
 */
export function getMoonIlluminatedPath(cx: number, cy: number, r: number, phase: number): string {
  // Full Moon (between 0.48 and 0.52): complete circle
  if (phase >= 0.48 && phase <= 0.52) {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  }

  // New Moon (below 0.02 or above 0.98): essentially dark / empty sliver
  if (phase < 0.015 || phase > 0.985) {
    return '';
  }

  // Width of terminator curve across the horizontal center
  const w = Math.abs(r * Math.cos(2 * Math.PI * phase));
  const wStr = w > 0.1 ? w.toFixed(2) : '0.1';

  if (phase < 0.5) {
    // Waxing: Right side is illuminated
    // Outer arc from top (cx, cy - r) to bottom (cx, cy + r) along the right limb
    const outer = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r}`;

    if (phase < 0.25) {
      // Crescent: inner terminator bulges to the right (sweep = 0 from bottom to top)
      return `${outer} A ${wStr} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else if (phase > 0.25) {
      // Gibbous: inner terminator bulges to the left (sweep = 1 from bottom to top)
      return `${outer} A ${wStr} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    } else {
      // First Quarter: straight line through center
      return `${outer} L ${cx} ${cy - r} Z`;
    }
  } else {
    // Waning: Left side is illuminated
    // Outer arc from top (cx, cy - r) to bottom (cx, cy + r) along the left limb
    const outer = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;

    if (phase < 0.75) {
      // Waning Gibbous: inner terminator bulges to the right (sweep = 0 from bottom to top)
      return `${outer} A ${wStr} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else if (phase > 0.75) {
      // Waning Crescent: inner terminator bulges to the left (sweep = 1 from bottom to top)
      return `${outer} A ${wStr} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    } else {
      // Last Quarter: straight line through center
      return `${outer} L ${cx} ${cy - r} Z`;
    }
  }
}
