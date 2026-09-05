import { getTempleImageById, getTempleImageByName } from '../constants/templeImages';
import { CENTRALIZED_SACRED_PLACES_DATA } from './templeSacredPlacesData';
import JYOTIRLINGA_JSON_DATA from './Nearby_Sacred_Temples_12_Jyotirlingas.json';
import SHAKTI_PEETHAS_JSON_DATA from './Nearby_Sacred_Temples_Shakti_Peethas.json';
import HEALING_ASHRAM_JSON_DATA from './Nearby_Sacred_Temples_Healing_Ashram.json';

export interface SacredPlaceItem {
  id: string;
  name: string;
  category: 'Temple' | 'Cave' | 'Fort' | 'Ghat' | 'Heritage' | 'Lake' | 'Shrine';
  distance: string;
  significance?: string; // Rich spiritual insight/significance for the devotee
  linkedTempleId?: string;
  locationQuery?: string;
}

export interface NearbyTempleItem {
  templeId: string;
  name: string;
  image: any;
  distance: string;
}

export interface CircuitJourneyItem {
  templeId: string;
  name: string;
  image: any;
  state: string;
}

export interface ExploreNearbyData {
  templeId: string;
  templeName: string;
  hasCuratedData: boolean;
  nearbySacredPlaces: SacredPlaceItem[];
  nearbyTemples: NearbyTempleItem[];
  journeyTitle: string;
  circuitJourney: CircuitJourneyItem[];
}

export const ALL_12_JYOTIRLINGAS: CircuitJourneyItem[] = [
  {
    templeId: 'jyotirling-grishneshwar-temple-ellora',
    name: 'Grishneshwar',
    state: 'Maharashtra',
    image: getTempleImageById('jyotirling-grishneshwar-temple-ellora'),
  },
  {
    templeId: 'jyotirling-somnath-temple-gujarat',
    name: 'Somnath',
    state: 'Gujarat',
    image: getTempleImageById('jyotirling-somnath-temple-gujarat'),
  },
  {
    templeId: 'jyotirling-mallikarjuna-temple-srisailam',
    name: 'Mallikarjuna',
    state: 'Andhra Pradesh',
    image: getTempleImageById('jyotirling-mallikarjuna-temple-srisailam'),
  },
  {
    templeId: 'jyotirling-mahakaleshwar-temple-ujjain',
    name: 'Mahakaleshwar',
    state: 'Madhya Pradesh',
    image: getTempleImageById('jyotirling-mahakaleshwar-temple-ujjain'),
  },
  {
    templeId: 'jyotirling-omkareshwar-temple-madhya-pradesh',
    name: 'Omkareshwar',
    state: 'Madhya Pradesh',
    image: getTempleImageById('jyotirling-omkareshwar-temple-madhya-pradesh'),
  },
  {
    templeId: 'jyotirling-bhimashankar-temple-maharashtra',
    name: 'Bhimashankar',
    state: 'Maharashtra',
    image: getTempleImageById('jyotirling-bhimashankar-temple-maharashtra'),
  },
  {
    templeId: 'jyotirling-kashi-vishwanath-temple-varanasi',
    name: 'Kashi Vishwanath',
    state: 'Uttar Pradesh',
    image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
  },
  {
    templeId: 'jyotirling-trimbakeshwar-temple-nashik',
    name: 'Trimbakeshwar',
    state: 'Maharashtra',
    image: getTempleImageById('jyotirling-trimbakeshwar-temple-nashik'),
  },
  {
    templeId: 'jyotirling-baidyanath-temple-deoghar',
    name: 'Baidyanath',
    state: 'Jharkhand',
    image: getTempleImageById('jyotirling-baidyanath-temple-deoghar'),
  },
  {
    templeId: 'jyotirling-nageshwar-temple-dwarka',
    name: 'Nageshwar',
    state: 'Gujarat',
    image: getTempleImageById('jyotirling-nageshwar-temple-dwarka'),
  },
  {
    templeId: 'jyotirling-ramanathaswamy-temple-rameswaram',
    name: 'Ramanathaswamy',
    state: 'Tamil Nadu',
    image: getTempleImageById('jyotirling-ramanathaswamy-temple-rameswaram'),
  },
  {
    templeId: 'jyotirling-kedarnath-temple-uttarakhand',
    name: 'Kedarnath',
    state: 'Uttarakhand',
    image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
  },
];

export const ALL_SHAKTI_PEETHAS: CircuitJourneyItem[] = [
  {
    templeId: 'other-vaishno-devi-temple-jammu-kashmir',
    name: 'Vaishno Devi',
    state: 'Jammu & Kashmir',
    image: getTempleImageById('other-vaishno-devi-temple-jammu-kashmir'),
  },
  {
    templeId: 'shakti-kamakhya-temple-assam',
    name: 'Kamakhya Mandir',
    state: 'Assam',
    image: getTempleImageById('shakti-kamakhya-temple-assam'),
  },
  {
    templeId: 'other-meenakshi-temple-madurai',
    name: 'Meenakshi Amman',
    state: 'Tamil Nadu',
    image: getTempleImageById('other-meenakshi-temple-madurai'),
  },
  {
    templeId: 'other-mahalaxmi-temple',
    name: 'Mahalaxmi Temple',
    state: 'Maharashtra',
    image: getTempleImageById('other-mahalaxmi-temple'),
  },
  {
    templeId: 'shakti-kalighat-temple-kolkata',
    name: 'Kalighat Mandir',
    state: 'West Bengal',
    image: getTempleImageById('shakti-kalighat-temple-kolkata'),
  },
  {
    templeId: 'shakti-ambaji-temple-gujarat',
    name: 'Ambaji Temple',
    state: 'Gujarat',
    image: getTempleImageById('shakti-ambaji-temple-gujarat'),
  },
  {
    templeId: 'shakti-chamundeshwari-temple-mysore',
    name: 'Chamundeshwari',
    state: 'Karnataka',
    image: getTempleImageById('shakti-chamundeshwari-temple-mysore'),
  },
];

export const ALL_CHAR_DHAM: CircuitJourneyItem[] = [
  {
    templeId: 'jyotirling-kedarnath-temple-uttarakhand',
    name: 'Kedarnath Temple',
    state: 'Uttarakhand',
    image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
  },
  {
    templeId: 'other-jagannath-temple-puri',
    name: 'Jagannath Puri',
    state: 'Odisha',
    image: getTempleImageById('other-jagannath-temple-puri'),
  },
  {
    templeId: 'other-shri-dwarkadhish-temple-dwarka',
    name: 'Shree Dwarkadhish',
    state: 'Gujarat',
    image: getTempleImageById('other-shri-dwarkadhish-temple-dwarka'),
  },
  {
    templeId: 'jyotirling-ramanathaswamy-temple-rameswaram',
    name: 'Ramanathaswamy',
    state: 'Tamil Nadu',
    image: getTempleImageById('jyotirling-ramanathaswamy-temple-rameswaram'),
  },
];

export const ALL_HEALING_TEMPLES: CircuitJourneyItem[] = [
  {
    templeId: 'other-shirdi-sai-baba-temple-maharashtra',
    name: 'Shirdi Sai Baba',
    state: 'Maharashtra',
    image: getTempleImageById('other-shirdi-sai-baba-temple-maharashtra'),
  },
  {
    templeId: 'other-vaishno-devi-temple-jammu-kashmir',
    name: 'Vaishno Devi',
    state: 'Jammu & Kashmir',
    image: getTempleImageById('other-vaishno-devi-temple-jammu-kashmir'),
  },
  {
    templeId: 'other-tirupati-balaji-temple-andhra-pradesh',
    name: 'Tirupati Balaji',
    state: 'Andhra Pradesh',
    image: getTempleImageById('other-tirupati-balaji-temple-andhra-pradesh'),
  },
  {
    templeId: 'other-golden-temple-amritsar',
    name: 'Golden Temple',
    state: 'Punjab',
    image: getTempleImageById('other-golden-temple-amritsar'),
  },
  {
    templeId: 'other-siddhivinayak-temple-mumbai',
    name: 'Siddhivinayak',
    state: 'Maharashtra',
    image: getTempleImageById('other-siddhivinayak-temple-mumbai'),
  },
];

export const ALL_SACRED_DESTINATIONS: CircuitJourneyItem[] = [
  {
    templeId: 'jyotirling-somnath-temple-gujarat',
    name: 'Somnath Temple',
    state: 'Gujarat',
    image: getTempleImageById('jyotirling-somnath-temple-gujarat'),
  },
  {
    templeId: 'other-tirupati-balaji-temple-andhra-pradesh',
    name: 'Tirupati Balaji',
    state: 'Andhra Pradesh',
    image: getTempleImageById('other-tirupati-balaji-temple-andhra-pradesh'),
  },
  {
    templeId: 'other-golden-temple-amritsar',
    name: 'Golden Temple',
    state: 'Punjab',
    image: getTempleImageById('other-golden-temple-amritsar'),
  },
  {
    templeId: 'other-shirdi-sai-baba-temple-maharashtra',
    name: 'Shirdi Sai Baba',
    state: 'Maharashtra',
    image: getTempleImageById('other-shirdi-sai-baba-temple-maharashtra'),
  },
  {
    templeId: 'jyotirling-kashi-vishwanath-temple-varanasi',
    name: 'Kashi Vishwanath',
    state: 'Uttar Pradesh',
    image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
  },
  {
    templeId: 'other-jagannath-temple-puri',
    name: 'Jagannath Temple',
    state: 'Odisha',
    image: getTempleImageById('other-jagannath-temple-puri'),
  },
];

// Central Canonical Temple Alias Registry
export const TEMPLE_KEY_ALIASES: Record<string, string> = {
  // Kedarnath
  kedarnath: 'kedarnath',
  'jyotirling-kedarnath-temple-uttarakhand': 'kedarnath',
  'other-kedarnath-temple-uttarakhand': 'kedarnath',
  'shiva-kedarnath-himalayan-shrine': 'kedarnath',
  'chardham-kedarnath-temple-uttarakhand': 'kedarnath',
  'kedarnath temple': 'kedarnath',

  // Badrinath
  badrinath: 'badrinath',
  'badrinath-temple-uttarakhand': 'badrinath',
  'chardham-badrinath-temple-uttarakhand': 'badrinath',
  'other-badrinath-temple-uttarakhand': 'badrinath',
  'badrinath temple': 'badrinath',

  // Somnath
  somnath: 'somnath',
  'jyotirling-somnath-temple-gujarat': 'somnath',
  'shiva-somnath-patan-gujarat': 'somnath',
  'somnath-temple-gujarat': 'somnath',
  'somnath temple': 'somnath',
  'sacred-somnath-mahadham-gujarat': 'somnath',
  'sacred-somnath-jyotirling-gujarat-core': 'somnath',
  'sacred-somnath-gujarat-coastal': 'somnath',
  'sacred-somnath-temple-prabhas-patan': 'somnath',

  // Dwarkadhish
  dwarka: 'dwarkadhish',
  dwarkadhish: 'dwarkadhish',
  'other-shri-dwarkadhish-temple-dwarka': 'dwarkadhish',
  'chardham-dwarkadhish-temple-dwarka': 'dwarkadhish',
  'shree dwarkadhish temple': 'dwarkadhish',

  // Jagannath Puri
  puri: 'jagannath-puri',
  jagannath: 'jagannath-puri',
  'jagannath-puri': 'jagannath-puri',
  'other-jagannath-temple-puri': 'jagannath-puri',
  'chardham-jagannath-temple-puri': 'jagannath-puri',
  'jagannath puri': 'jagannath-puri',

  // Mahakaleshwar
  mahakal: 'mahakaleshwar',
  mahakaleshwar: 'mahakaleshwar',
  'jyotirling-mahakaleshwar-temple-ujjain': 'mahakaleshwar',

  // Kashi Vishwanath
  kashi: 'kashi-vishwanath',
  vishwanath: 'kashi-vishwanath',
  varanasi: 'kashi-vishwanath',
  'jyotirling-kashi-vishwanath-temple-varanasi': 'kashi-vishwanath',
  'kaal-bhairav-mandir-varanasi': 'kashi-vishwanath',
  'annapurna-mata-mandir-varanasi': 'kashi-vishwanath',
  'sankat-mochan-hanuman-temple-varanasi': 'kashi-vishwanath',

  // Kedarnath sub-temples
  'triyuginarayan-shiva-temple': 'kedarnath',
  'tungnath-mahadev-temple-chopta': 'kedarnath',

  // Badrinath sub-temples
  'mata-murti-temple-badrinath': 'badrinath',
  'yoganarasimha-temple-joshimath': 'badrinath',

  // Baidyanath sub-temples
  'basukinath-dham-jharkhand': 'baidyanath',
  'shakti-tarapith-temple-bengal': 'baidyanath',

  // Grishneshwar sub-temples
  'bhadra-maruti-temple-khuldabad': 'grishneshwar',

  // Omkareshwar sub-temples
  'mamleshwar-temple-omkareshwar': 'omkareshwar',

  // Trimbakeshwar sub-temples
  'kalaram-temple-nashik': 'trimbakeshwar',

  // Nageshwar sub-temples
  'rukmini-devi-temple-dwarka': 'nageshwar',

  // Ramanathaswamy sub-temples
  'kothandaramaswamy-temple-rameswaram': 'ramanathaswamy',

  // Srisailam sub-temples
  'sakshi-ganapati-temple-srisailam': 'srisailam',
  'paladhara-panchadhara-srisailam': 'srisailam',

  // Baidyanath
  baidyanath: 'baidyanath',
  deoghar: 'baidyanath',
  'jyotirling-baidyanath-temple-deoghar': 'baidyanath',
  'jyotirling-baidyanath-temple-jharkhand': 'baidyanath',

  // Grishneshwar
  grishneshwar: 'grishneshwar',
  ellora: 'grishneshwar',
  'jyotirling-grishneshwar-temple-ellora': 'grishneshwar',
  'jyotirling-grishneshwar-temple-maharashtra': 'grishneshwar',

  // Omkareshwar
  omkareshwar: 'omkareshwar',
  'jyotirling-omkareshwar-temple-madhya-pradesh': 'omkareshwar',

  // Bhimashankar
  bhimashankar: 'bhimashankar',
  'jyotirling-bhimashankar-temple-maharashtra': 'bhimashankar',

  // Trimbakeshwar
  trimbakeshwar: 'trimbakeshwar',
  nashik: 'trimbakeshwar',
  'jyotirling-trimbakeshwar-temple-nashik': 'trimbakeshwar',
  'jyotirling-trimbakeshwar-temple-maharashtra': 'trimbakeshwar',

  // Nageshwar
  nageshwar: 'nageshwar',
  'jyotirling-nageshwar-temple-dwarka': 'nageshwar',
  'jyotirling-nageshwar-temple-gujarat': 'nageshwar',

  // Ramanathaswamy
  ramanathaswamy: 'ramanathaswamy',
  rameswaram: 'ramanathaswamy',
  'jyotirling-ramanathaswamy-temple-rameswaram': 'ramanathaswamy',

  // Srisailam
  srisailam: 'srisailam',
  mallikarjuna: 'srisailam',
  'jyotirling-mallikarjuna-temple-srisailam': 'srisailam',
  'jyotirling-mallikarjuna-temple-andhra-pradesh': 'srisailam',
  'shiva-mallikarjuna-srisailam-hills': 'srisailam',
  '03abhqee4jiqtw68lqtu': 'srisailam',
  '03abHQEE4Jiqtw68lqtu': 'srisailam',
  'mallikarjuna srisailam temple': 'srisailam',

  // Tanot Mata (Jaisalmer, Rajasthan)
  'tanot-mata': 'tanot-mata',
  '37t4zb9pvlgwrh9u1le4': 'tanot-mata',
  'tanot mata temple – jaisalmer': 'tanot-mata',
  'tanot mata temple': 'tanot-mata',
  'tanot mata': 'tanot-mata',

  // Belur Math (Howrah, West Bengal)
  'belur-math': 'belur-math',
  'dtrmucbaxr9v5gjfo2kb': 'belur-math',
  'DtRMUCBaXR9V5Gjfo2KB': 'belur-math',
  'sacred-belur-math-ramakrishna-mission': 'belur-math',
  'belur math – howrah': 'belur-math',
  'belur math': 'belur-math',

  // Mayureshwar Temple (Morgaon, Maharashtra)
  'mayureshwar-morgaon': 'mayureshwar-morgaon',
  '0hdlczpzohjcatktpcbc': 'mayureshwar-morgaon',
  '0hdlCZpzoHJCatKTPCbc': 'mayureshwar-morgaon',
  'ashtavinayak-mayureshwar-temple-morgaon': 'mayureshwar-morgaon',
  'mayureshwar temple – morgaon': 'mayureshwar-morgaon',
  'mayureshwar temple': 'mayureshwar-morgaon',
  'morgaon': 'mayureshwar-morgaon',

  // Ghati Subramanya (Karnataka)
  'ghati-subramanya': 'ghati-subramanya',
  '2dbo7xbfpgt2zxsnithf': 'ghati-subramanya',
  '2dBo7xbFpgT2ZxsnITHF': 'ghati-subramanya',
  'ghati subramanya temple – doddaballapur': 'ghati-subramanya',
  'ghati subramanya temple': 'ghati-subramanya',
  'ghati subramanya': 'ghati-subramanya',

  // Siddhivinayak Mumbai vs Siddhatek
  'siddhivinayak-mumbai': 'siddhivinayak-mumbai',
  'sacred-siddhivinayak-temple-mumbai': 'siddhivinayak-mumbai',
  'other-siddhivinayak-temple-mumbai': 'siddhivinayak-mumbai',
  'shree-siddhivinayak-ganapati': 'siddhivinayak-mumbai',
  'shree siddhivinayak ganapati temple': 'siddhivinayak-mumbai',
  'siddhivinayak temple – mumbai': 'siddhivinayak-mumbai',
  'ilpcwntrabtr43s244ao': 'siddhivinayak-mumbai',

  'siddhivinayak-siddhatek': 'siddhivinayak-siddhatek',
  'ashtavinayak-siddhivinayak-temple-siddhatek': 'siddhivinayak-siddhatek',
  'siddhivinayak temple – siddhatek': 'siddhivinayak-siddhatek',
  'hsysquoiqa3jz5oyct6q': 'siddhivinayak-siddhatek',
};

/**
 * Deterministic Normalization Function
 * Resolves any incoming raw temple ID or temple name string into a canonical key.
 * Supports passing both rawInput (e.g. ID) and an optional nameInput (e.g. Name)
 * to resolve canonical keys even when IDs are arbitrary database strings.
 */
export function normalizeTempleKey(rawInput: string, nameInput?: string): string {
  const tryResolve = (input?: string): string | null => {
    if (!input) return null;
    const lower = String(input).toLowerCase().trim();
    if (!lower) return null;

    // 1. Direct match in dictionary
    if (TEMPLE_KEY_ALIASES[lower]) {
      return TEMPLE_KEY_ALIASES[lower];
    }

    const cleanedInput = lower.replace(/[^a-z0-9]/g, '');

    // 2. Exact match after stripping non-alphanumeric
    for (const [alias, canonical] of Object.entries(TEMPLE_KEY_ALIASES)) {
      const cleanedAlias = alias.replace(/[^a-z0-9]/g, '');
      if (cleanedInput === cleanedAlias) {
        return canonical;
      }
    }

    // 3. Robust Keyword Matching for all Major Pilgrimage Hubs
    const coreKeywords: { kw: string; canonical: string }[] = [
      { kw: 'kedarnath', canonical: 'kedarnath' },
      { kw: 'badrinath', canonical: 'badrinath' },
      { kw: 'somnath', canonical: 'somnath' },
      { kw: 'dwarkadhish', canonical: 'dwarkadhish' },
      { kw: 'dwarka', canonical: 'dwarkadhish' },
      { kw: 'puri', canonical: 'jagannath-puri' },
      { kw: 'jagannath', canonical: 'jagannath-puri' },
      { kw: 'mahakal', canonical: 'mahakaleshwar' },
      { kw: 'mahakaleshwar', canonical: 'mahakaleshwar' },
      { kw: 'kashi', canonical: 'kashi-vishwanath' },
      { kw: 'vishwanath', canonical: 'kashi-vishwanath' },
      { kw: 'baidyanath', canonical: 'baidyanath' },
      { kw: 'deoghar', canonical: 'baidyanath' },
      { kw: 'grishneshwar', canonical: 'grishneshwar' },
      { kw: 'ellora', canonical: 'grishneshwar' },
      { kw: 'omkareshwar', canonical: 'omkareshwar' },
      { kw: 'bhimashankar', canonical: 'bhimashankar' },
      { kw: 'trimbakeshwar', canonical: 'trimbakeshwar' },
      { kw: 'nageshwar', canonical: 'nageshwar' },
      { kw: 'ramanathaswamy', canonical: 'ramanathaswamy' },
      { kw: 'rameswaram', canonical: 'ramanathaswamy' },
      { kw: 'srisailam', canonical: 'srisailam' },
      { kw: 'mallikarjuna', canonical: 'srisailam' },
      { kw: 'tanot', canonical: 'tanot-mata' },
      { kw: 'belur math', canonical: 'belur-math' },
      { kw: 'belurmath', canonical: 'belur-math' },
      { kw: 'morgaon', canonical: 'mayureshwar-morgaon' },
      { kw: 'mayureshwar', canonical: 'mayureshwar-morgaon' },
    ];

    for (const item of coreKeywords) {
      if (cleanedInput.includes(item.kw)) {
        return item.canonical;
      }
    }

    return null;
  };

  const keyFromRaw = tryResolve(rawInput);
  if (keyFromRaw) return keyFromRaw;

  if (nameInput) {
    const keyFromName = tryResolve(nameInput);
    if (keyFromName) return keyFromName;
  }

  return rawInput
    ? String(rawInput).toLowerCase().trim()
    : nameInput
    ? String(nameInput).toLowerCase().trim()
    : '';
}

const JYOTIRLINGA_NAME_MAP: Record<string, string> = {
  'somnath': 'somnath',
  'mallikarjuna (srisailam)': 'srisailam',
  'mahakaleshwar (ujjain)': 'mahakaleshwar',
  'omkareshwar': 'omkareshwar',
  'kedarnath': 'kedarnath',
  'bhimashankar': 'bhimashankar',
  'kashi vishwanath (varanasi)': 'kashi-vishwanath',
  'trimbakeshwar': 'trimbakeshwar',
  'rameshwaram': 'ramanathaswamy',
  'nageshwar': 'nageshwar',
  'baidyanath dham (deoghar)': 'baidyanath',
  'grishneshwar': 'grishneshwar',
  'aundha nagnath': 'aundha-nagnath',
  'parli vaijnath': 'parli-vaijnath',
};

export const JYOTIRLINGA_SACRED_PLACES_DATA: Record<string, SacredPlaceItem[]> = {};

if (JYOTIRLINGA_JSON_DATA && Array.isArray((JYOTIRLINGA_JSON_DATA as any).data)) {
  for (const entry of (JYOTIRLINGA_JSON_DATA as any).data) {
    const rawName = String(entry.jyotirlinga || '').toLowerCase().trim();
    const canonicalKey = JYOTIRLINGA_NAME_MAP[rawName] || normalizeTempleKey(rawName);
    const locationStr = String(entry.location || '').trim();

    if (canonicalKey && Array.isArray(entry.nearby_sacred_temples)) {
      const places: SacredPlaceItem[] = [];

      for (let idx = 0; idx < entry.nearby_sacred_temples.length; idx++) {
        const item = entry.nearby_sacred_temples[idx];
        if (item.exists === false) continue;

        const placeName = String(item.name || '').trim();
        if (!placeName) continue;

        const cleanDist = String(item.distance || '').replace('~', '').trim();
        const dummyItem = { name: placeName, category: 'Shrine' as const } as SacredPlaceItem;
        const normCategory = normalizeSacredPlaceCategory(dummyItem);

        places.push({
          id: `${canonicalKey}_jyo_${idx + 1}`,
          name: placeName,
          category: normCategory,
          distance: cleanDist || 'Nearby',
          significance: String(item.significance || '').trim(),
          locationQuery: `${placeName}, ${locationStr}`,
        });
      }

      if (places.length > 0) {
        JYOTIRLINGA_SACRED_PLACES_DATA[canonicalKey] = places;
      }
    }
  }
}

const SHAKTI_TEMPLE_ALIAS_MAP: Record<string, string[]> = {
  'kamakhya temple': ['kamakhya', 'bGqr42M269EFeCmbPQ1f', 'kamakhya-temple-guwahati', 'kamakhya-devi-sanctuary-assam', '8ulQF8kVt3yQAwAQC208', 'shaktipeeth-kamakhya-temple-guwahati'],
  'kalighat temple': ['kalighat', 'R0rCbxgp6wWizA0bQDk3', 'kalighat-kali-temple-kolkata', 'kalighat-kali-shrine-kolkata'],
  'tarapith temple': ['tarapith', '9FpEMJtXRlC8ooeLeqS0', 'tarapith-temple-birbhum'],
  'vaishno devi temple': ['vaishno-devi', '5vawXjLGFdM16y0JdIlE', 'vaishno-devi-temple-jammu-kashmir'],
  'jwalamukhi temple': ['jwalamukhi', 'Khngz0yKSfUmeEwreNHL', 'jwala-ji-temple-kangra', 'jwalamukhi-temple-kangra', 'e5DUhLAcDqrLC4o7IgJv', 'chamunda-devi-temple-kangra', 'o2EfRgCyXDbTicfV2j1c', 'brajeshwari-devi-temple-kangra'],
  'chintpurni devi temple': ['chintpurni', 'J7qGPHAmVDKqnVBjDoKz', 'chintpurni-devi-temple-una'],
  'naina devi temple (bilaspur)': ['naina-devi', 'aZUIh0yRZgKTUQF2h7Yq', 'naina-devi-temple-bilaspur'],
  'kanyakumari bhagavathy amman temple': ['kanyakumari-bhagavathy', 'cesyNvigMvTFq7i7qBug', 'kanyakumari-devi-temple-kanyakumari'],
  'kalika mata temple, pavagadh': ['kalika-mata-pavagadh', '8sz8D7ODqv3cA0jmS8zg', 'kalika-mata-temple-pavagadh'],
  'ambaji temple': ['ambaji', 'tTPEJVrk4FYklMYIc7dU', 'ambaji-temple-gujarat'],
  'hinglaj mata temple': ['hinglaj', '89OA8R8mKzUODJCtWnlN', 'hinglaj-mata-temple-barmer'],
  'sharada peeth': ['sharada-peeth', 'BlI0l8wJGcIE1WBlmuBu', 'sharada-peeth-kashmir', 'ZXpdi065TQXVJBTRUw7S', 'sharada-devi-temple-maihar'],
  'tripura (tripurasundari / matabari)': ['tripura-sundari', 'E35DqFvnB2ZJ60Gp4Goi', 'tripura-sundari-temple-udaipur'],
  'shondot / danteshwari temple': ['danteshwari', 'ibTnhap9UDqJASab5PTa', 'danteshwari-temple-dantewada'],
  'attahas (fullara) shakti peeth': ['fullara-attahas', 'wPeAggfGaqHEaC0JGX7n', 'fullara-attahas-temple-birbhum'],
  'kankalitala shakti peeth': ['kankalitala', 'x7pqfMwvM8n3BucndCcz', 'kankalitala-temple-bolpur'],
  'nalhati (nalateshwari) shakti peeth': ['nalhati', 'vpMToG0KQdYoDNFqBSCN', 'nalateswari-temple-nalhati'],
  'bakreswar dham': ['bakreshwar', '4btYs0KS1COTglTH5bLm', 'bakreshwar-temple-birbhum'],
  'prayaga shakti peethas (alopi devi / lalita devi / kalyani devi)': ['alopi-devi', 'sStkB4MtHN88qI4N7W6M', 'alopi-devi-temple-prayagraj', 'ICgj9P6dgETsIXxqobw3', 'devi-patan-temple-tulsipur'],
  'biraja (vimala) shakti peeth': ['biraja', 'S9Q9YZ8cyecGkqnJ1084', 'biraja-temple-jajpur', 'gM0FGwHQWEqqRdE277GL', 'tara-tarini-temple-ganjam'],
  'karavira (kolhapur) shakti peeth': ['kolhapur-mahalaxmi', 'YyBwlm5wyyZkgxrvScDR', 'mahalaxmi-temple-kolhapur', '08pXdMR1eLLkHjrtHADk', 'renuka-devi-temple-mahur', 'FEowNmwowgheGJSN1uZs', 'saptashrungi-nivasini-temple-vani', 'OVWk1L9Z2HLI64V84L3m', 'tulja-bhavani-temple-tuljapur'],
  'kamakshi / kanchipuram shakti peeth': ['kamakshi-amman', 'kamakshi-amman-temple-kanchipuram'],
  'chhinnamasta shakti peeth': ['chinnamasta', 'c8YyaSSSqH8EoSMqMR2T', 'chinnamasta-temple-rajrappa'],
  'yogadya (khirdagram) shakti peeth': ['khirgram-jogadya', 'dpGJtzLLhjI0ozYX2w1q', 'jogadya-temple-khirgram'],
  'meenakshi amman temple': ['meenakshi-amman', 'oLcJ1cE4dIDdK7D7SCq8', 'chamundeshwari-temple-mysore'],
  'vishalakshi temple': ['shaktipeeth-vishalakshi-temple-varanasi', 'boYR6tKcdOcuGYebPDkR', 'vindhyavasini-temple-vindhyachal'],
  'avanti (gadkalika) shakti peeth': ['gadkalika-ujjain', 'RWHljJGGXrXtNPSni8gB', 'harsiddhi-mata-temple-ujjain'],
};

export const SHAKTI_PEETHA_SACRED_PLACES_DATA: Record<string, SacredPlaceItem[]> = {};

if (SHAKTI_PEETHAS_JSON_DATA && Array.isArray((SHAKTI_PEETHAS_JSON_DATA as any).data)) {
  for (const entry of (SHAKTI_PEETHAS_JSON_DATA as any).data) {
    const rawName = String(entry.shakti_peeth || '').toLowerCase().trim();
    const cleanRawKey = rawName.replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    const locationStr = String(entry.location || '').trim();

    if (Array.isArray(entry.nearby_sacred_temples)) {
      const places: SacredPlaceItem[] = [];

      for (let idx = 0; idx < entry.nearby_sacred_temples.length; idx++) {
        const item = entry.nearby_sacred_temples[idx];
        if (item.exists === false) continue;

        const placeName = String(item.name || '').trim();
        if (!placeName) continue;

        const cleanDist = String(item.distance || '').replace('~', '').trim();
        const dummyItem = { name: placeName, category: 'Shrine' as const } as SacredPlaceItem;
        const normCategory = normalizeSacredPlaceCategory(dummyItem);

        places.push({
          id: `${cleanRawKey}_sp_${idx + 1}`,
          name: placeName,
          category: normCategory,
          distance: cleanDist || 'Nearby',
          significance: String(item.significance || '').trim(),
          locationQuery: `${placeName}, ${locationStr}`,
        });
      }

      if (places.length > 0) {
        SHAKTI_PEETHA_SACRED_PLACES_DATA[rawName] = places;
        if (cleanRawKey) {
          SHAKTI_PEETHA_SACRED_PLACES_DATA[cleanRawKey] = places;
        }
        
        const aliases = SHAKTI_TEMPLE_ALIAS_MAP[rawName] || [];
        for (const alias of aliases) {
          SHAKTI_PEETHA_SACRED_PLACES_DATA[alias] = places;
          SHAKTI_PEETHA_SACRED_PLACES_DATA[alias.toLowerCase()] = places;
        }
      }
    }
  }
}

const HEALING_ASHRAM_TEMPLE_ALIAS_MAP: Record<string, string[]> = {
  'kainchi dham (neem karoli baba ashram)': ['kainchi-dham', 'hanuman-kainchi-dham-neem-karoli', 'neem-karoli-baba', 'kainchi-dham-ashram-nainital', 'kainchi-dham-ashram'],
  'prasanthi nilayam (sri sathya sai baba ashram)': ['prasanthi-nilayam', 'puttaparthi', 'sathya-sai-baba', 'sri-sathya-sai-ashram', 'prasanthi-nilayam-puttaparthi'],
  'akshardham temple': ['akshardham', 'akshardham-delhi', 'swaminarayan-akshardham', 'akshardham-temple-delhi'],
  'shirdi sai baba temple (samadhi mandir)': ['shirdi-sai-baba', 'shirdi', 'sai-baba-shirdi', 'other-shirdi-sai-baba-temple-maharashtra', 'shirdi-sai-baba-temple-shirdi'],
  'auroville matrimandir': ['auroville', 'matrimandir', 'auroville-matrimandir-puducherry'],
  'iskcon temple (sri krishna balaram mandir)': ['iskcon-vrindavan', 'krishna-balaram-mandir', 'iskcon-temple-vrindavan', 'other-iskcon-temple-mumbai', 'other-iskcon-mira-road-thane', 'other-iskcon-temple-bangalore-karnataka'],
  'art of living international center': ['art-of-living', 'sri-sri-ravishankar-ashram', 'aol-bangalore', 'art-of-living-bangalore'],
  'arunachaleswarar temple (tiruvannamalai)': ['arunachaleswarar', 'tiruvannamalai', 'annamaliyar', 'arunachaleswara-temple'],
  'sharada peeth': ['sharada-peeth', 'sharda-peeth-kashmir', 'shaktipeeth-sharda-peeth-kashmir', 'sharada-devi-temple-maihar'],
  'chottanikara devi temple': ['chottanikkara', 'chottanikara', 'chottanikkara-devi', 'chottanikkara-temple-kochi'],
  'kollur mookambika temple': ['mookambika', 'kollur-mookambika', 'kollur-mookambika-temple'],
  'mehendipur balaji temple': ['mehendipur-balaji', 'mehandipur-balaji', 'mehendipur-balaji-temple-dausa'],
  'dhanvantari temple (nelluvai sree dhanwanthari)': ['dhanvantari', 'nelluvai-dhanwanthari', 'dhanvantari-temple-nelluvai'],
  'kukke subramanya temple': ['kukke-subramanya', 'subramanya', 'kukke-subramanya-temple'],
  'ghati subramanya temple': ['ghati-subramanya', 'ghati-subramanya-temple'],
  'suchindram thanumalayan temple': ['suchindram', 'thanumalayan', 'suchindram-thanumalaya-temple'],
  'mangaladevi temple': ['mangaladevi', 'mangaladevi-mangaluru', 'mangaladevi-temple-mangaluru'],
  'sri ramana ashram (ramanasramam)': ['ramana-ashram', 'ramanasramam', 'sri-ramana', 'ramana-maharshi-ashram'],
  'dhyanalinga (isha yoga center)': ['dhyanalinga', 'isha-yoga-center', 'healing-dhyanalinga-isha-coimbatore', 'dhyanalinga-isha-yoga-center'],
  'anandamayi ma ashram': ['anandamayi-ma-ashram', 'anandamayi-ashram', 'healing-anandamayi-ma-ashram-haridwar'],
  'parmarth niketan ashram': ['parmarth-niketan', 'parmarth-niketan-rishikesh'],
  'sri aurobindo ashram': ['sri-aurobindo-ashram', 'aurobindo-ashram', 'healing-sri-aurobindo-ashram-puducherry'],
  'belur math (ramakrishna mission)': ['belur-math', 'sacred-belur-math-ramakrishna-mission', 'belur-math-howrah'],
  'sarnath buddhist monastery': ['sarnath', 'sarnath-buddhist-monastery', 'healing-sarnath-buddhist-monastery'],
  'mahabodhi temple (bodh gaya)': ['mahabodhi', 'mahabodhi-temple-bodh-gaya', 'bodh-gaya'],
  'golden temple (sri harmandir sahib)': ['golden-temple', 'harmandir-sahib', 'amritsar-golden-temple', 'other-golden-temple-amritsar'],
  'vaishno devi temple': ['vaishno-devi', 'vaishno-devi-temple-jammu-kashmir', 'other-vaishno-devi-temple-jammu-kashmir'],
  'tirupati balaji (sri venkateswara swamy temple)': ['tirupati-balaji', 'venkateswara', 'vishnu-tirupati-balaji-temple-andhra-pradesh', 'other-tirupati-balaji-temple-andhra-pradesh', 'tirumala'],
};

export const HEALING_ASHRAM_SACRED_PLACES_DATA: Record<string, SacredPlaceItem[]> = {};

if (HEALING_ASHRAM_JSON_DATA && Array.isArray((HEALING_ASHRAM_JSON_DATA as any).data)) {
  for (const entry of (HEALING_ASHRAM_JSON_DATA as any).data) {
    const rawName = String(entry.temple || '').toLowerCase().trim();
    const cleanRawKey = rawName.replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    const locationStr = String(entry.location || '').trim();

    if (Array.isArray(entry.nearby_sacred_temples)) {
      const places: SacredPlaceItem[] = [];

      for (let idx = 0; idx < entry.nearby_sacred_temples.length; idx++) {
        const item = entry.nearby_sacred_temples[idx];
        if (item.exists === false) continue;

        const placeName = String(item.name || '').trim();
        if (!placeName) continue;

        const cleanDist = String(item.distance || '').replace('~', '').trim();
        const dummyItem = { name: placeName, category: 'Shrine' as const } as SacredPlaceItem;
        const normCategory = normalizeSacredPlaceCategory(dummyItem);

        places.push({
          id: `${cleanRawKey}_h_${idx + 1}`,
          name: placeName,
          category: normCategory,
          distance: cleanDist || 'Nearby',
          significance: String(item.significance || '').trim(),
          locationQuery: `${placeName}, ${locationStr}`,
        });
      }

      if (places.length > 0) {
        HEALING_ASHRAM_SACRED_PLACES_DATA[rawName] = places;
        if (cleanRawKey) {
          HEALING_ASHRAM_SACRED_PLACES_DATA[cleanRawKey] = places;
        }

        const aliases = HEALING_ASHRAM_TEMPLE_ALIAS_MAP[rawName] || [];
        for (const alias of aliases) {
          HEALING_ASHRAM_SACRED_PLACES_DATA[alias] = places;
          HEALING_ASHRAM_SACRED_PLACES_DATA[alias.toLowerCase()] = places;
        }
      }
    }
  }
}

export const EXPLORE_NEARBY_DATA: Record<
  string,
  { sacredPlaces: SacredPlaceItem[]; nearbyTemples: NearbyTempleItem[] }
> = {
  // 1. Kedarnath (Uttarakhand)
  kedarnath: {
    sacredPlaces: [
      {
        id: 'k1',
        name: 'Bhairavnath Mandir Ridge',
        category: 'Temple',
        distance: '0.5 km',
        significance: 'Guardian deity temple protecting Kedar valley during winter months.',
        locationQuery: 'Bhairavnath Temple Kedarnath',
      },
      {
        id: 'k2',
        name: 'Gandhi Sarovar Glacial Lake',
        category: 'Lake',
        distance: '3 km',
        significance: 'Glacial lake where Yudhishthira embarked on his heavenly ascent.',
        locationQuery: 'Gandhi Sarovar Chorabari lake Kedarnath',
      },
      {
        id: 'k3',
        name: 'Vasuki Tal High Altitude Lake',
        category: 'Lake',
        distance: '8 km',
        significance: 'Crystal-clear glacial lake offering views of Chaukhamba peaks.',
        locationQuery: 'Vasuki Tal Kedarnath',
      },
      {
        id: 'k4',
        name: 'Sonprayag Sangam',
        category: 'Ghat',
        distance: '18 km',
        significance: 'Confluence of Mandakini and Basuki rivers on Kedarnath trek.',
        locationQuery: 'Sonprayag Kedarnath Route',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'triyuginarayan-shiva-temple',
        name: 'Triyuginarayan Temple',
        image: getTempleImageByName('Triyuginarayan'),
        distance: '25 km',
      },
      {
        templeId: 'tungnath-mahadev-temple-chopta',
        name: 'Tungnath Mahadev Temple',
        image: getTempleImageByName('Tungnath'),
        distance: '88 km',
      },
      {
        templeId: 'badrinath',
        name: 'Badrinath Temple',
        image: getTempleImageByName('Badrinath'),
        distance: '218 km',
      },
    ],
  },

  // 2. Badrinath (Uttarakhand)
  badrinath: {
    sacredPlaces: [
      {
        id: 'b1',
        name: 'Tapt Kund Thermal Springs',
        category: 'Ghat',
        distance: '0.1 km',
        significance: 'Natural hot sulfur water spring for purification before Badri Darshan.',
        locationQuery: 'Tapt Kund Badrinath',
      },
      {
        id: 'b2',
        name: 'Mana First Indian Village',
        category: 'Heritage',
        distance: '3 km',
        significance: 'Mythological village housing Vyas Gufa and Saraswati River Origin.',
        locationQuery: 'Mana Village Badrinath',
      },
      {
        id: 'b3',
        name: 'Vyas Cave & Ganesh Gufa',
        category: 'Cave',
        distance: '3.2 km',
        significance: 'Ancient cave where Sage Vyasa composed Mahabharata with Lord Ganesha.',
        locationQuery: 'Vyas Gufa Mana Badrinath',
      },
      {
        id: 'b4',
        name: 'Charan Paduka Sacred Rock',
        category: 'Heritage',
        distance: '3 km',
        significance: 'Sacred boulder bearing footprints of Lord Vishnu on Neelkanth slope.',
        locationQuery: 'Charan Paduka Badrinath',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'mata-murti-temple-badrinath',
        name: 'Mata Murti Temple',
        image: getTempleImageByName('Mata Murti'),
        distance: '3 km',
      },
      {
        templeId: 'kedarnath',
        name: 'Kedarnath Temple',
        image: getTempleImageByName('Kedarnath'),
        distance: '218 km',
      },
      {
        templeId: 'yoganarasimha-temple-joshimath',
        name: 'Narsingh Temple Joshimath',
        image: getTempleImageByName('Narsingh'),
        distance: '45 km',
      },
    ],
  },

  // 3. Somnath (Gujarat)
  somnath: {
    sacredPlaces: [
      {
        id: 's1',
        name: 'Bhalka Tirth Shrine',
        category: 'Heritage',
        distance: '4 km',
        significance: 'Holy site where Lord Shri Krishna completed his earthly incarnation.',
        locationQuery: 'Bhalka Tirth Veraval',
      },
      {
        id: 's2',
        name: 'Triveni Sangam Ghat',
        category: 'Ghat',
        distance: '1.5 km',
        significance: 'Confluence of Hiran, Kapila, and Saraswati rivers meeting the ocean.',
        locationQuery: 'Triveni Sangam Somnath',
      },
      {
        id: 's3',
        name: 'Gita Mandir & Deotsarg Tirth',
        category: 'Temple',
        distance: '1.8 km',
        significance: 'White marble shrine engraved with 700 Bhagavad Gita shlokas.',
        locationQuery: 'Gita Mandir Somnath',
      },
      {
        id: 's4',
        name: 'Baan Stambh Ocean Promenade',
        category: 'Heritage',
        distance: '0.2 km',
        significance: 'Ancient directional pillar pointing straight to the South Pole ocean.',
        locationQuery: 'Baan Stambh Somnath Beach',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'old-somnath-ahilya-temple',
        name: 'Ahilya Holkar Temple (Old Somnath)',
        image: getTempleImageById('jyotirling-somnath-temple-gujarat'),
        distance: '0.2 km',
      },
      {
        templeId: 'nageshwar',
        name: 'Nageshwar Jyotirling',
        image: getTempleImageById('jyotirling-nageshwar-temple-dwarka'),
        distance: '230 km',
      },
      {
        templeId: 'dwarkadhish',
        name: 'Shree Dwarkadhish Temple',
        image: getTempleImageById('other-shri-dwarkadhish-temple-dwarka'),
        distance: '235 km',
      },
    ],
  },

  // 4. Dwarkadhish (Dwarka, Gujarat)
  dwarkadhish: {
    sacredPlaces: [
      {
        id: 'dw1',
        name: 'Gomti Ghat & Sangam',
        category: 'Ghat',
        distance: '0.3 km',
        significance: 'Sacred riverfront ghat where Gomti river meets Arabian Sea.',
        locationQuery: 'Gomti Ghat Dwarka',
      },
      {
        id: 'dw2',
        name: 'Sudama Setu Suspension Bridge',
        category: 'Heritage',
        distance: '0.4 km',
        significance: 'Iconic pedestrian cable bridge named after Lord Krishna’s friend Sudama.',
        locationQuery: 'Sudama Setu Dwarka',
      },
      {
        id: 'dw3',
        name: 'Bhadkeshwar Mahadev Shrine',
        category: 'Temple',
        distance: '1.5 km',
        significance: 'Ancient ocean-bound Shiva temple surrounded by waves during high tide.',
        locationQuery: 'Bhadkeshwar Mahadev Dwarka',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'nageshwar',
        name: 'Nageshwar Jyotirling',
        image: getTempleImageById('jyotirling-nageshwar-temple-dwarka'),
        distance: '16 km',
      },
      {
        templeId: 'rukmini-devi-temple-dwarka',
        name: 'Rukmini Devi Temple',
        image: getTempleImageById('other-shri-dwarkadhish-temple-dwarka'),
        distance: '2.5 km',
      },
      {
        templeId: 'somnath',
        name: 'Somnath Jyotirling',
        image: getTempleImageById('jyotirling-somnath-temple-gujarat'),
        distance: '235 km',
      },
    ],
  },

  // 5. Jagannath Puri (Odisha)
  'jagannath-puri': {
    sacredPlaces: [
      {
        id: 'p1',
        name: 'Swargadwar Beach Ghat',
        category: 'Ghat',
        distance: '2 km',
        significance: 'Sacred coastal cremation and bathing ghat offering heavenly entry.',
        locationQuery: 'Swargadwar Puri',
      },
      {
        id: 'p2',
        name: 'Narendra Pokhari Sacred Tank',
        category: 'Lake',
        distance: '1 km',
        significance: 'Historic holy lake where Chandan Yatra boat festivals take place.',
        locationQuery: 'Narendra Pokhari Puri',
      },
      {
        id: 'p3',
        name: 'Grand Road Bada Danda',
        category: 'Heritage',
        distance: '0.1 km',
        significance: 'World famous wide avenue used for annual Lord Jagannath Rath Yatra.',
        locationQuery: 'Bada Danda Grand Road Puri',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'gundicha-temple-puri',
        name: 'Gundicha Temple Puri',
        image: getTempleImageById('other-jagannath-temple-puri'),
        distance: '3 km',
      },
      {
        templeId: 'lokanath-temple-puri',
        name: 'Lokanath Temple Puri',
        image: getTempleImageById('other-jagannath-temple-puri'),
        distance: '2.5 km',
      },
      {
        templeId: 'konark-sun-temple-odisha',
        name: 'Konark Sun Temple',
        image: getTempleImageById('other-jagannath-temple-puri'),
        distance: '35 km',
      },
    ],
  },

  // 6. Mahakaleshwar (Ujjain, MP)
  mahakaleshwar: {
    sacredPlaces: [
      {
        id: 'm1',
        name: 'Ram Ghat Shipra River',
        category: 'Ghat',
        distance: '1 km',
        significance: 'Historic Kumbh Mela holy bathing ghat on Shipra river bank.',
        locationQuery: 'Ram Ghat Ujjain',
      },
      {
        id: 'm2',
        name: 'Harsiddhi Mata Mandir (Shakti Peeth)',
        category: 'Temple',
        distance: '0.5 km',
        significance: '51st Shakti Peeth where Goddess Sati’s elbow fell.',
        locationQuery: 'Harsiddhi Mata Mandir Ujjain',
      },
      {
        id: 'm3',
        name: 'Bhartrihari Caves',
        category: 'Cave',
        distance: '3.5 km',
        significance: 'Ancient riverfront caves where King Bhartrihari meditated.',
        locationQuery: 'Bhartrihari Caves Ujjain',
      },
      {
        id: 'm4',
        name: 'Sandipani Ashram Gurukul',
        category: 'Heritage',
        distance: '5 km',
        significance: 'Vedic gurukul where Lord Shri Krishna and Balarama studied.',
        locationQuery: 'Sandipani Ashram Ujjain',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'kal-bhairav-temple-ujjain',
        name: 'Kal Bhairav Mandir Ujjain',
        image: getTempleImageById('jyotirling-mahakaleshwar-temple-ujjain'),
        distance: '5 km',
      },
      {
        templeId: 'chintaman-ganesh-mandir-ujjain',
        name: 'Chintaman Ganesh Mandir',
        image: getTempleImageById('jyotirling-mahakaleshwar-temple-ujjain'),
        distance: '7 km',
      },
      {
        templeId: 'omkareshwar',
        name: 'Omkareshwar Jyotirling',
        image: getTempleImageById('jyotirling-omkareshwar-temple-madhya-pradesh'),
        distance: '140 km',
      },
    ],
  },

  // 7. Kashi Vishwanath (Varanasi, UP)
  'kashi-vishwanath': {
    sacredPlaces: [
      {
        id: 'v1',
        name: 'Dashashwamedh Ghat',
        category: 'Ghat',
        distance: '0.8 km',
        significance: 'Famous riverfront ghat renowned for grand evening Ganga Aarti.',
        locationQuery: 'Dashashwamedh Ghat Varanasi',
      },
      {
        id: 'v2',
        name: 'Manikarnika Ghat',
        category: 'Ghat',
        distance: '0.4 km',
        significance: 'Sacred liberation cremation ghat believed to offer Moksha.',
        locationQuery: 'Manikarnika Ghat Varanasi',
      },
      {
        id: 'v3',
        name: 'Gyanvapi Kund Reservoir',
        category: 'Ghat',
        distance: '0.1 km',
        significance: 'Historic sacred water reservoir adjacent to Vishwanath corridor.',
        locationQuery: 'Gyanvapi Kund Varanasi',
      },
      {
        id: 'v4',
        name: 'Assi Ghat',
        category: 'Ghat',
        distance: '3 km',
        significance: 'Southernmost confluence ghat famous for morning Subah-e-Banaras.',
        locationQuery: 'Assi Ghat Varanasi',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'annapurna-mata-mandir-varanasi',
        name: 'Annapurna Mata Mandir',
        image: getTempleImageById('devi-annapoorneshwari-temple-horanadu') || getTempleImageByName('Annapurna'),
        distance: '0.1 km',
      },
      {
        templeId: 'kaal-bhairav-mandir-varanasi',
        name: 'Kaal Bhairav Mandir',
        image: getTempleImageById('sacred-bhairavnath') || getTempleImageByName('bhairavnath'),
        distance: '1.5 km',
      },
      {
        templeId: 'sankat-mochan-hanuman-temple-varanasi',
        name: 'Sankat Mochan Temple',
        image: getTempleImageById('other-sankat-mochan-hanuman-temple-varanasi') || getTempleImageByName('sankatmochan'),
        distance: '4 km',
      },
    ],
  },

  // 8. Baidyanath (Deoghar, Jharkhand)
  baidyanath: {
    sacredPlaces: [
      {
        id: 'bd1',
        name: 'Shivganga Kund',
        category: 'Ghat',
        distance: '0.3 km',
        significance: 'Sacred holy bathing pool where Ravana rested the Shivling before consecration.',
        locationQuery: 'Shivganga Kund Deoghar',
      },
      {
        id: 'bd2',
        name: 'Naulakha Mandir',
        category: 'Temple',
        distance: '3 km',
        significance: 'Architectural 146-ft Radha-Krishna temple built by Queen Charushila.',
        locationQuery: 'Naulakha Mandir Deoghar',
      },
      {
        id: 'bd3',
        name: 'Trikuta Parvat (Trikut Pahar)',
        category: 'Heritage',
        distance: '15 km',
        significance: 'Sacred three-peaked mountain with ropeway & ancient Shiva cave shrine.',
        locationQuery: 'Trikuta Parvat Deoghar',
      },
      {
        id: 'bd4',
        name: 'Tapovan Caves & Ashram',
        category: 'Cave',
        distance: '10 km',
        significance: 'Ancient meditation caves where Sage Valmiki performed tapasya.',
        locationQuery: 'Tapovan Caves Deoghar',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'basukinath-dham-jharkhand',
        name: 'Basukinath Dham Temple',
        image: getTempleImageByName('Basukinath'),
        distance: '43 km',
      },
      {
        templeId: 'shakti-tarapith-temple-bengal',
        name: 'Tarapith Shakti Peeth',
        image: getTempleImageByName('Tarapith'),
        distance: '125 km',
      },
      {
        templeId: 'kashi-vishwanath',
        name: 'Kashi Vishwanath Jyotirling',
        image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
        distance: '480 km',
      },
    ],
  },

  // 9. Grishneshwar (Ellora, Maharashtra)
  grishneshwar: {
    sacredPlaces: [
      {
        id: 'g1',
        name: 'Ellora Kailasa Temple (Cave 16)',
        category: 'Heritage',
        distance: '1.8 km',
        significance: 'World’s largest monolithic rock-cut Shiva temple excavated top-down.',
        locationQuery: 'Ellora Cave 16 Kailasa Temple',
      },
      {
        id: 'g2',
        name: 'Shiva Trats Kund & Ahilyabai Tank',
        category: 'Ghat',
        distance: '0.3 km',
        significance: 'Ahilyabai Holkar’s sacred bathing ghat & holy water tank.',
        locationQuery: 'Shiva Trats Kund Ellora',
      },
      {
        id: 'g3',
        name: 'Daulatabad Fort (Devgiri)',
        category: 'Fort',
        distance: '14 km',
        significance: 'Impregnable 12th-century medieval hill fortress overlooking Ellora.',
        locationQuery: 'Daulatabad Fort Devgiri',
      },
      {
        id: 'g4',
        name: 'Gautam Rishi Ashram & Caves',
        category: 'Cave',
        distance: '4 km',
        significance: 'Ancient hermitage of Sage Gautama in the sacred Ellora hills.',
        locationQuery: 'Gautam Rishi Ashram Ellora Hills',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'bhadra-maruti-temple-khuldabad',
        name: 'Bhadra Maruti Temple',
        image: getTempleImageById('other-shirdi-sai-baba-temple-maharashtra'),
        distance: '5 km',
      },
      {
        templeId: 'other-shirdi-sai-baba-temple-maharashtra',
        name: 'Shirdi Sai Baba Samadhi Mandir',
        image: getTempleImageById('other-shirdi-sai-baba-temple-maharashtra'),
        distance: '78 km',
      },
      {
        templeId: 'trimbakeshwar',
        name: 'Trimbakeshwar Shiva Temple',
        image: getTempleImageById('jyotirling-trimbakeshwar-temple-nashik'),
        distance: '172 km',
      },
    ],
  },

  // 10. Omkareshwar (Khandwa, MP)
  omkareshwar: {
    sacredPlaces: [
      {
        id: 'om1',
        name: 'Narmada Sangam Ghat',
        category: 'Ghat',
        distance: '0.5 km',
        significance: 'Sacred confluence where Narmada river wraps around Omkareshwar island.',
        locationQuery: 'Narmada Ghat Omkareshwar',
      },
      {
        id: 'om2',
        name: 'Kuber Bhandari Kund',
        category: 'Ghat',
        distance: '1 km',
        significance: 'Ancient riverbank water pool dedicated to Lord Kuber.',
        locationQuery: 'Kuber Bhandari Omkareshwar',
      },
      {
        id: 'om3',
        name: 'Omkareshwar Parikrama Path',
        category: 'Heritage',
        distance: '7 km',
        significance: '7 km circumambulation trail encircling the sacred Om-shaped island.',
        locationQuery: 'Parikrama Path Omkareshwar',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'mamleshwar-temple-omkareshwar',
        name: 'Mamleshwar Temple',
        image: getTempleImageById('jyotirling-omkareshwar-temple-madhya-pradesh'),
        distance: '0.2 km',
      },
      {
        templeId: 'mahakaleshwar',
        name: 'Mahakaleshwar Jyotirling',
        image: getTempleImageById('jyotirling-mahakaleshwar-temple-ujjain'),
        distance: '140 km',
      },
    ],
  },

  // 11. Bhimashankar (Pune, Maharashtra)
  bhimashankar: {
    sacredPlaces: [
      {
        id: 'bh1',
        name: 'Gupt Bhimashankar Stream & Trail',
        category: 'Heritage',
        distance: '2 km',
        significance: 'Mystical origin trail of the Bhima River emerging hidden amidst dense Sahyadri forests.',
        locationQuery: 'Gupt Bhimashankar Forest',
      },
      {
        id: 'bh2',
        name: 'Kamalaja Mata Mandir',
        category: 'Temple',
        distance: '0.5 km',
        significance: 'Venerated shrine dedicated to Goddess Parvati (Kamalaja Devi) within the temple complex.',
        locationQuery: 'Kamalaja Mata Mandir Bhimashankar',
      },
      {
        id: 'bh3',
        name: 'Sakshi Vinayak Temple',
        category: 'Temple',
        distance: '1 km',
        significance: 'Revered Ganesha shrine where pilgrims seek blessings as a witness to their pilgrimage.',
        locationQuery: 'Sakshi Vinayak Temple Bhimashankar',
      },
      {
        id: 'bh4',
        name: 'Lenyadri Girijatmaj Ganesha Temple',
        category: 'Temple',
        distance: '45 km',
        significance: 'Prominent Ashtavinayak cave temple carved into the Junnar mountain cliffs.',
        locationQuery: 'Lenyadri Girijatmaj Ganesha Temple',
      },
      {
        id: 'bh5',
        name: 'Ozar Vigneshwara Temple',
        category: 'Temple',
        distance: '62 km',
        significance: 'Sacred Ashtavinayak shrine of Lord Ganesha situated along the Kukadi riverbank.',
        locationQuery: 'Ozar Vigneshwara Temple',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'trimbakeshwar',
        name: 'Trimbakeshwar Shiva Temple',
        image: getTempleImageById('jyotirling-trimbakeshwar-temple-nashik'),
        distance: '230 km',
      },
      {
        templeId: 'grishneshwar',
        name: 'Grishneshwar Jyotirling',
        image: getTempleImageById('jyotirling-grishneshwar-temple-ellora'),
        distance: '210 km',
      },
    ],
  },

  // 12. Trimbakeshwar (Nashik, Maharashtra)
  trimbakeshwar: {
    sacredPlaces: [
      {
        id: 't1',
        name: 'Kushavarta Kund',
        category: 'Ghat',
        distance: '0.2 km',
        significance: 'Sacred bathing tank where Sage Gautama held River Godavari to release sin.',
        locationQuery: 'Kushavarta Kund Trimbakeshwar',
      },
      {
        id: 't2',
        name: 'Brahmagiri Hill Trek',
        category: 'Heritage',
        distance: '2 km',
        significance: 'Holy mountain peak source of Godavari river with 700 stone steps.',
        locationQuery: 'Brahmagiri Hill Trimbakeshwar',
      },
      {
        id: 't3',
        name: 'Gangadwar & Ramha Gufa Caves',
        category: 'Cave',
        distance: '1.5 km',
        significance: 'Mountain cliff cave shrine marking Godavari river descent.',
        locationQuery: 'Gangadwar Trimbakeshwar',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'kalaram-temple-nashik',
        name: 'Kalaram Temple Nashik',
        image: getTempleImageById('jyotirling-trimbakeshwar-temple-nashik'),
        distance: '28 km',
      },
      {
        templeId: 'other-shirdi-sai-baba-temple-maharashtra',
        name: 'Shirdi Sai Baba Samadhi Mandir',
        image: getTempleImageById('other-shirdi-sai-baba-temple-maharashtra'),
        distance: '115 km',
      },
      {
        templeId: 'bhimashankar',
        name: 'Bhimashankar Jyotirling',
        image: getTempleImageById('jyotirling-bhimashankar-temple-maharashtra'),
        distance: '230 km',
      },
    ],
  },

  // 13. Nageshwar (Dwarka, Gujarat)
  nageshwar: {
    sacredPlaces: [
      {
        id: 'n1',
        name: 'Nageshwar Sarovar Kund',
        category: 'Ghat',
        distance: '0.2 km',
        significance: 'Holy water reservoir surrounding the massive 85-ft Lord Shiva statue.',
        locationQuery: 'Nageshwar Sarovar Dwarka',
      },
      {
        id: 'n2',
        name: 'Gopi Talav Lake',
        category: 'Lake',
        distance: '5 km',
        significance: 'Sacred yellow clay lake associated with Gopis & Shri Krishna.',
        locationQuery: 'Gopi Talav Dwarka',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'dwarkadhish',
        name: 'Shree Dwarkadhish Temple',
        image: getTempleImageById('other-shri-dwarkadhish-temple-dwarka'),
        distance: '16 km',
      },
      {
        templeId: 'rukmini-devi-temple-dwarka',
        name: 'Rukmini Devi Temple',
        image: getTempleImageById('other-shri-dwarkadhish-temple-dwarka'),
        distance: '14 km',
      },
      {
        templeId: 'somnath',
        name: 'Somnath Jyotirling',
        image: getTempleImageById('jyotirling-somnath-temple-gujarat'),
        distance: '230 km',
      },
    ],
  },

  // 14. Ramanathaswamy (Rameswaram, TN)
  ramanathaswamy: {
    sacredPlaces: [
      {
        id: 'r1',
        name: 'Agni Theertham Beach Ghat',
        category: 'Ghat',
        distance: '0.2 km',
        significance: 'Sacred ocean beach where Lord Rama performed purification after Lanka war.',
        locationQuery: 'Agni Theertham Rameswaram',
      },
      {
        id: 'r2',
        name: '22 Holy Wells Inside Sanctum Corridor',
        category: 'Ghat',
        distance: '0.1 km',
        significance: '22 sacred fresh water wells inside long temple corridor for pilgrim bath.',
        locationQuery: '22 Teertham Rameswaram Temple',
      },
      {
        id: 'r3',
        name: 'Dhanushkodi Sangam Point',
        category: 'Heritage',
        distance: '18 km',
        significance: 'Ghost town & tip of Ram Setu where Bay of Bengal meets Indian Ocean.',
        locationQuery: 'Dhanushkodi Beach Rameswaram',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'kothandaramaswamy-temple-rameswaram',
        name: 'Kothandaramaswamy Temple',
        image: getTempleImageByName('Kothandaramaswamy'),
        distance: '12 km',
      },
      {
        templeId: 'meenakshi-amman-temple-madurai',
        name: 'Meenakshi Amman Temple Madurai',
        image: getTempleImageByName('Meenakshi'),
        distance: '170 km',
      },
    ],
  },

  // 15. Srisailam (Andhra Pradesh)
  srisailam: {
    sacredPlaces: [
      {
        id: 'sr1',
        name: 'Pathala Ganga Narmada Ghat',
        category: 'Ghat',
        distance: '3 km',
        significance: 'Krishna river sacred gorge reachable by ropeway or 852 stone steps.',
        locationQuery: 'Pathala Ganga Srisailam',
      },
      {
        id: 'sr2',
        name: 'Akka Mahadevi Caves',
        category: 'Cave',
        distance: '10 km',
        significance: 'Natural riverine caves where 12th-century saint Akka Mahadevi meditated.',
        locationQuery: 'Akka Mahadevi Caves Srisailam',
      },
      {
        id: 'sr3',
        name: 'Srisailam Dam Viewpoint',
        category: 'Heritage',
        distance: '8 km',
        significance: 'Panoramic viewpoint overlooking one of South India’s largest dams.',
        locationQuery: 'Srisailam Dam Viewpoint',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'sakshi-ganapati-temple-srisailam',
        name: 'Sakshi Ganapati Temple',
        image: getTempleImageByName('Sakshi Ganapati'),
        distance: '3 km',
      },
      {
        templeId: 'paladhara-panchadhara-srisailam',
        name: 'Paladhara Panchadhara Shrine',
        image: getTempleImageByName('Paladhara'),
        distance: '4 km',
      },
    ],
  },

  // Belur Math (Howrah, West Bengal)
  'belur-math': {
    sacredPlaces: [
      {
        id: 'bm1',
        name: 'Dakshineswar Kali Temple',
        category: 'Temple',
        distance: '2.7 km',
        significance: 'Historic Bhavatarini Kali shrine associated with Paramahamsa Sri Ramakrishna across the Hooghly River.',
        locationQuery: 'Dakshineswar Kali Temple Kolkata',
      },
      {
        id: 'bm2',
        name: 'Adyapeath Mandir',
        category: 'Temple',
        distance: '3.2 km',
        significance: 'Revered spiritual temple dedicated to Adya Ma, founded by Annada Thakur.',
        locationQuery: 'Adyapeath Mandir Dakshineswar',
      },
      {
        id: 'bm3',
        name: "Old Math & Nilambar Mukherjee's Garden House",
        category: 'Heritage',
        distance: '1 km',
        significance: "Sacred heritage garden residence where Holy Mother Sri Sarada Devi stayed and meditated.",
        locationQuery: "Nilambar Mukherjee Garden House Belur",
      },
    ],
    nearbyTemples: [
      {
        templeId: 'dakshineswar-kali-temple-kolkata',
        name: 'Dakshineswar Kali Temple',
        image: getTempleImageByName('Dakshineswar'),
        distance: '2.7 km',
      },
      {
        templeId: 'shaktipeeth-kalighat-kali-temple-kolkata',
        name: 'Kalighat Kali Temple',
        image: getTempleImageByName('Kalighat'),
        distance: '18 km',
      },
    ],
  },

  // Mayureshwar Temple (Morgaon, Maharashtra)
  'mayureshwar-morgaon': {
    sacredPlaces: [
      {
        id: 'mm1',
        name: 'Karha River Confluence Ghat',
        category: 'Ghat',
        distance: '0.5 km',
        significance: 'Sacred riverfront ghat along the Karha River associated with Lord Ganesha ritual baths.',
        locationQuery: 'Karha River Morgaon',
      },
      {
        id: 'mm2',
        name: 'Nandi Mandap & Stone Elephant Shrines',
        category: 'Heritage',
        distance: '0.1 km',
        significance: 'Unique architecture featuring a prominent Nandi bull facing Lord Mayureshwar shrine.',
        locationQuery: 'Mayureshwar Temple Morgaon',
      },
      {
        id: 'mm3',
        name: 'Chintamani Temple (Theur)',
        category: 'Temple',
        distance: '55 km',
        significance: 'Revered 2nd Ashtavinayak shrine dedicated to Lord Ganesha.',
        locationQuery: 'Chintamani Temple Theur',
      },
      {
        id: 'mm4',
        name: 'Mahaganapati Temple (Ranjangaon)',
        category: 'Temple',
        distance: '68 km',
        significance: 'Prominent Ashtavinayak pilgrimage shrine invoking Lord Ganesha before battle.',
        locationQuery: 'Mahaganapati Temple Ranjangaon',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'ashtavinayak-chintamani-temple-theur',
        name: 'Chintamani Temple Theur',
        image: getTempleImageByName('Chintamani'),
        distance: '55 km',
      },
      {
        templeId: 'ashtavinayak-mahaganapati-temple-ranjangaon',
        name: 'Mahaganapati Temple Ranjangaon',
        image: getTempleImageByName('Mahaganapati'),
        distance: '68 km',
      },
      {
        templeId: 'bhimashankar',
        name: 'Bhimashankar Jyotirling',
        image: getTempleImageById('jyotirling-bhimashankar-temple-maharashtra'),
        distance: '160 km',
      },
    ],
  },

  // Ghati Subramanya (Doddaballapur, Karnataka)
  'ghati-subramanya': {
    sacredPlaces: [
      {
        id: 'gs1',
        name: 'Kumaradhara Teertha (Holy Pond)',
        category: 'Ghat',
        distance: '0.2 km',
        significance: 'Sacred natural pond where devotees take a holy dip before offering prayers to Lord Subramanya.',
        locationQuery: 'Kumaradhara Teertha Ghati Subramanya',
      },
      {
        id: 'gs2',
        name: 'Naga Prathishtapana Anthill Shrine',
        category: 'Shrine',
        distance: '0.1 km',
        significance: 'Sacred grove featuring thousands of snake idols (Naga Prathishta) installed by pilgrims.',
        locationQuery: 'Naga Prathishta Ghati Subramanya',
      },
      {
        id: 'gs3',
        name: 'Makalidurga Hill & Fort Trail',
        category: 'Fort',
        distance: '10 km',
        significance: 'Scenic granite hill crowned with an ancient fort and Shiva temple, popular for pilgrimage trekking.',
        locationQuery: 'Makalidurga Fort Karnataka',
      },
    ],
    nearbyTemples: [
      {
        templeId: 'bhoga-nandeeshwara-temple-nandi',
        name: 'Bhoga Nandeeshwara Temple (Nandi Hills)',
        image: getTempleImageByName('Bhoga Nandeeshwara'),
        distance: '32 km',
      },
      {
        templeId: 'iskcon-temple-bangalore',
        name: 'ISKCON Temple Bengaluru',
        image: getTempleImageByName('ISKCON Bengaluru'),
        distance: '45 km',
      },
    ],
  },
};

export const BADA_CHAR_DHAM_IDS = [
  'chardham-badrinath-temple-uttarakhand',
  'chardham-dwarkadhish-temple-dwarka',
  'chardham-jagannath-temple-puri',
  'jyotirling-ramanathaswamy-temple-rameswaram',
];

export const CHOTA_CHAR_DHAM_IDS = [
  'chardham-badrinath-temple-uttarakhand',
  'jyotirling-kedarnath-temple-uttarakhand',
  'chardham-gangotri-temple-uttarakhand',
  'chardham-yamunotri-temple-uttarakhand',
];

export const HEALING_TEMPLE_IDS = [
  'healing-ramanasramam-tiruvannamalai',
  'healing-dhyanalinga-isha-coimbatore',
  'jyotirling-mahakaleshwar-temple-ujjain',
  'healing-virupaksha-temple-hampi',
  'healing-anandamayi-ma-ashram-haridwar',
  'sacred-golden-temple-amritsar',
  'hanuman-mehendipur-balaji-temple-dausa',
  'shaktipeeth-kamakhya-temple-guwahati',
  'healing-parmarth-niketan-rishikesh',
  'healing-sri-aurobindo-ashram-puducherry',
  'sacred-belur-math-ramakrishna-mission',
  'healing-sarnath-buddhist-monastery',
  'sacred-mahabodhi-temple-bodh-gaya',
  'devi-kollur-mookambika-temple',
  'devi-chottanikara-temple-kochi',
  'sacred-vaitheeswaran-koil-mayiladuthurai',
  'jyotirling-baidyanath-temple-deoghar',
  'healing-parli-vaijnath-temple',
  'healing-dhanvantari-temple-kerala',
  'sacred-suchindram-thanumalayan-temple',
  'healing-ghati-subramanya-temple',
  'panchbhoota-srikalahasteeswara-temple-srikalahasti',
  'sacred-kukke-subramanya-temple',
  'jyotirling-trimbakeshwar-temple-nashik',
  'jyotirling-omkareshwar-temple-madhya-pradesh',
  'jyotirling-ramanathaswamy-temple-rameswaram',
  'jyotirling-kashi-vishwanath-temple-varanasi',
  'jyotirling-somnath-temple-gujarat',
  'jyotirling-nageshwar-temple-dwarka',
  'jyotirling-grishneshwar-temple-ellora',
  'jyotirling-mallikarjuna-temple-srisailam',
  'jyotirling-kedarnath-temple-uttarakhand',
  'jyotirling-bhimashankar-temple-maharashtra',
  'healing-mangaladevi-temple-mangalore',
];

export const getTempleId = (t: any): string => {
  if (!t) return '';
  if (typeof t === 'string') return t.toLowerCase().trim();
  return String(t.templeId || t.temple_id || t._raw?.temple_id || t.id || '').toLowerCase().trim();
};

export function deduplicateTemples<T = any>(temples: T[]): T[] {
  if (!Array.isArray(temples)) return [];
  const dedupedMap = new Map<string, T>();

  for (const rec of temples) {
    if (!rec) continue;
    const rawId = getTempleId(rec);
    const name = String((rec as any).name || (rec as any)._raw?.name || '').trim();
    const cKey = normalizeTempleKey(rawId, name);
    const fallbackKey = (rawId || name).toLowerCase().trim();
    const keyToUse = cKey || fallbackKey;

    if (keyToUse) {
      if (!dedupedMap.has(keyToUse)) {
        dedupedMap.set(keyToUse, rec);
      } else {
        const existing = dedupedMap.get(keyToUse) as any;
        const exId = getTempleId(existing);
        if (!exId.startsWith('jyotirling-') && rawId.startsWith('jyotirling-')) {
          dedupedMap.set(keyToUse, { ...existing, ...rec });
        } else {
          if ((rec as any).is_following !== undefined) existing.is_following = (rec as any).is_following;
          if ((rec as any).follower_count !== undefined) existing.follower_count = (rec as any).follower_count;
        }
      }
    }
  }

  return Array.from(dedupedMap.values());
}

function unpackTempleInput(
  input: any,
  nameInput?: string,
  categoryInput?: string
): { tid: string; tName: string; category: string; categoryIds: string[]; tags: string[] } {
  if (input && typeof input === 'object') {
    const tid = getTempleId(input);
    const tName = String(input.name || input._raw?.name || nameInput || '').toLowerCase();
    const category = String(input.category || input.type || categoryInput || '').toLowerCase();
    const categoryIds = Array.isArray(input.category_ids)
      ? input.category_ids.map((c: any) => String(c).toLowerCase())
      : [];
    const tags = Array.isArray(input.tags)
      ? input.tags.map((tg: any) => String(tg).toLowerCase())
      : [];
    return { tid, tName, category, categoryIds, tags };
  } else {
    const tid = String(input || '').toLowerCase();
    const tName = String(nameInput || '').toLowerCase();
    const category = String(categoryInput || '').toLowerCase();
    return { tid, tName, category, categoryIds: [], tags: [] };
  }
}

export const JYOTIRLINGA_CANONICAL_KEYS = new Set([
  'somnath',
  'srisailam',
  'mahakaleshwar',
  'omkareshwar',
  'kedarnath',
  'bhimashankar',
  'kashi-vishwanath',
  'trimbakeshwar',
  'baidyanath',
  'nageshwar',
  'ramanathaswamy',
  'grishneshwar',
  'aundha-nagnath',
  'parli-vaijnath',
]);

export function isJyotirlinga(input: any, templeName: string = '', category: string = ''): boolean {
  const { tid, tName } = unpackTempleInput(input, templeName, category);
  const canonicalKey = normalizeTempleKey(tid, tName);
  return Boolean(canonicalKey && JYOTIRLINGA_CANONICAL_KEYS.has(canonicalKey));
}

const SHAKTI_PEETHA_KEYS = new Set([
  'kamakhya',
  'kalighat',
  'tarapith',
  'ambaji',
  'tripura-sundari',
  'jwala-ji',
  'hinglaj',
  'chhinnamasta',
  'biraja',
  'vishalakshi',
  'mangalagauri',
  'kanyakumari',
  'naina-devi',
  'harsiddhi',
  'sharda-peeth',
  'amarnath-shakti',
  'kamakshi-amman',
  'maihar-sharda',
  'taratarini',
  'vindhyavasini',
  'danteshwari',
  'muktinath-gandaki',
  'bhabanipur',
  'kiriteswari',
  'manibandh',
  'katyayani-vrindavan',
  'bhadrakali-kurukshetra',
  'devi-talab-jalandhar',
  'pashupatinath-guheshwari',
  'sugandha',
  'attahas',
  'kankalitala',
  'nalateswari',
  'janaki-janakpur',
  'chintpurni',
  'mookambika',
  'chottanikara',
]);

export function isShaktiPeetha(input: any, templeName: string = '', categoryInput: string = ''): boolean {
  const { tid, tName, category, categoryIds, tags } = unpackTempleInput(input, templeName, categoryInput);

  if (
    category.includes('shakti') ||
    category.includes('peetha') ||
    categoryIds.some((c) => c.includes('shakti')) ||
    tags.some((tg) => tg.includes('shakti'))
  ) {
    return true;
  }

  const cKey = normalizeTempleKey(tid, tName);
  if (cKey && SHAKTI_PEETHA_KEYS.has(cKey)) {
    return true;
  }

  const checkStr = `${tid} ${tName} ${category}`.toLowerCase().trim();

  const shaktiPeethaKeywords = [
    'kamakhya',
    'kamakshi',
    'kalighat',
    'tarapith',
    'tarapeeth',
    'ambaji',
    'chhinnamasta',
    'jwala ji',
    'jwalaji',
    'hinglaj',
    'mahakali',
    'tripura sundari',
    'tripureshwari',
    'biraja',
    'vimala',
    'mangalagauri',
    'vishalakshi',
    'shakti peetha',
    'shakti pitha',
    'shaktipeetha',
    'shaktipitha',
    'chintpurni',
    'mookambika',
    'chottanikara',
  ];

  return shaktiPeethaKeywords.some((keyword) => checkStr.includes(keyword));
}

export function isBadaCharDham(input: any, templeName: string = '', categoryInput: string = ''): boolean {
  const { tid, tName, category, categoryIds, tags } = unpackTempleInput(input, templeName, categoryInput);

  if (
    category.includes('bada char dham') ||
    category.includes('bada_char_dham') ||
    categoryIds.some((c) => c.includes('bada_char_dham')) ||
    tags.some((tg) => tg.includes('bada_char_dham'))
  ) {
    return true;
  }

  const cKey = normalizeTempleKey(tid, tName);
  const BADA_KEYS = new Set(['badrinath', 'dwarkadhish', 'jagannath-puri', 'ramanathaswamy']);
  if (cKey && BADA_KEYS.has(cKey)) return true;

  return BADA_CHAR_DHAM_IDS.includes(tid);
}

export function isChotaCharDham(input: any, templeName: string = '', categoryInput: string = ''): boolean {
  const { tid, tName, category, categoryIds, tags } = unpackTempleInput(input, templeName, categoryInput);

  if (
    category.includes('chota char dham') ||
    category.includes('chota_char_dham') ||
    categoryIds.some((c) => c.includes('chota_char_dham')) ||
    tags.some((tg) => tg.includes('chota_char_dham'))
  ) {
    return true;
  }

  const cKey = normalizeTempleKey(tid, tName);
  const CHOTA_KEYS = new Set(['badrinath', 'kedarnath', 'gangotri', 'yamunotri']);
  if (cKey && CHOTA_KEYS.has(cKey)) return true;

  return CHOTA_CHAR_DHAM_IDS.includes(tid);
}

export function isCharDham(input: any, templeName: string = '', category: string = ''): boolean {
  return isBadaCharDham(input, templeName, category) || isChotaCharDham(input, templeName, category);
}

export function isHealingTemple(input: any, templeName: string = '', categoryInput: string = ''): boolean {
  const { tid, tName, category, categoryIds, tags } = unpackTempleInput(input, templeName, categoryInput);

  if (
    category.includes('healing') ||
    categoryIds.some((c) => c.includes('healing')) ||
    tags.some((tg) => tg.includes('healing'))
  ) {
    return true;
  }

  if (HEALING_TEMPLE_IDS.includes(tid)) return true;

  const checkStr = `${tid} ${tName} ${category}`.toLowerCase();
  return (
    checkStr.includes('healing') ||
    checkStr.includes('miracle') ||
    checkStr.includes('sai baba') ||
    checkStr.includes('shirdi') ||
    checkStr.includes('balaji') ||
    checkStr.includes('tirupati')
  );
}

import TEMPLE_DUMP_DATA from '../constants/templeDataDump.json';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper to parse a distance string (e.g. "0.5 km", "230 km") into a numeric value in kilometers.
 * @param distanceStr - Raw distance string representation.
 * @returns Distance in kilometers, or Infinity if unparseable.
 */
export function parseDistanceKm(distanceStr: string): number {
  if (!distanceStr) return Infinity;
  const match = String(distanceStr).match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : Infinity;
}

/** In-memory cache for computed coordinate fallback distances */
const COORD_CACHE = new Map<string, NearbyTempleItem[]>();

/**
 * Clears the in-memory coordinate fallback distance cache.
 */
export function clearNearbyCache(): void {
  COORD_CACHE.clear();
}

/**
 * Retrieves diagnostic statistics for the nearby coordinate cache.
 */
export function getNearbyCacheStats(): { cachedCount: number } {
  return { cachedCount: COORD_CACHE.size };
}

/**
 * Intelligently normalizes the visual category of a sacred place based on its name and attributes.
 */
export function normalizeSacredPlaceCategory(place: SacredPlaceItem): SacredPlaceItem['category'] {
  if (!place || !place.name) return place?.category || 'Shrine';
  const n = place.name.toLowerCase();

  if (n.includes('cave') || n.includes('gufa') || n.includes('gupha')) return 'Cave';
  if (n.includes('fort') || n.includes('killa') || n.includes('garh')) return 'Fort';
  if (n.includes('lake') || n.includes(' tal ') || n.endsWith(' tal') || (n.includes('sarovar') && !n.includes('temple'))) return 'Lake';
  if (n.includes('ghat') || n.includes('kund') || n.includes('pokhari') || n.includes('sangam') || n.includes('theertham') || n.includes('bathing')) return 'Ghat';
  if (n.includes('mandir') || n.includes('temple') || n.includes('jyotirling') || n.includes('shakti peeth') || n.includes('ashram') || n.includes('math') || n.includes('matha') || n.includes('shrine')) return 'Temple';
  if (n.includes('bridge') || n.includes('village') || n.includes('promenade') || n.includes('rock') || n.includes('dam') || n.includes('setu') || n.includes('trail') || n.includes('path') || n.includes('trek')) return 'Heritage';

  return place.category || 'Shrine';
}

/**
 * Main resolution engine for "Explore Nearby" sacred places, temples, and circuit journeys.
 *
 * Priority Resolution Pipeline:
 * 1. Curated Hand-crafted Data (EXPLORE_NEARBY_DATA) - Prioritized if non-empty.
 * 2. Centralized Master Dataset (CENTRALIZED_SACRED_PLACES_DATA) - Fallback for sacred places.
 * 3. Spatial Coordinate Distance Engine - Fallback for nearby temples using Haversine & Bounding Box filters.
 *
 * Features:
 * - Priority override preservation (empty curated arrays do not block centralized data).
 * - High-performance spatial indexing (bounding box pre-filtering + memory caching).
 * - Identity-matched deduplication across aliases and raw IDs.
 * - Optional proximity distance filtering (`maxDistanceKm`).
 *
 * @param templeId - Raw route or Firestore ID of the active temple.
 * @param templeName - Human-readable name of the active temple.
 * @param category - Category classification (e.g., Jyotirlinga, Shakti Peetha, Char Dham).
 * @param coords - Optional geographical coordinates of the active temple.
 * @param options - Additional resolution options (e.g. maxDistanceKm filter).
 * @returns Structured ExploreNearbyData object with deduplicated sacred places, temples, and circuit journey.
 */
export function getExploreNearbyData(
  templeId: string,
  templeName: string = '',
  category: string = '',
  coords?: { latitude: number; longitude: number },
  options?: { maxDistanceKm?: number }
): ExploreNearbyData {
  let journeyTitle = 'Continue Your Jyotirlinga Journey';
  let circuitJourney = ALL_12_JYOTIRLINGAS;

  if (isCharDham(templeId, templeName, category)) {
    journeyTitle = 'Continue Your Char Dham Journey';
    circuitJourney = ALL_CHAR_DHAM;
  } else if (isHealingTemple(templeId, templeName, category)) {
    journeyTitle = 'Continue Your Sacred Healing Journey';
    circuitJourney = ALL_HEALING_TEMPLES;
  } else if (isShaktiPeetha(templeId, templeName, category)) {
    journeyTitle = 'Continue Your Shakti Peetha Journey';
    circuitJourney = ALL_SHAKTI_PEETHAS;
  } else if (isJyotirlinga(templeId, templeName, category)) {
    journeyTitle = 'Continue Your Jyotirlinga Journey';
    circuitJourney = ALL_12_JYOTIRLINGAS;
  } else {
    journeyTitle = 'Continue Your Sacred Pilgrimage Journey';
    circuitJourney = ALL_SACRED_DESTINATIONS;
  }

  // Determine canonical temple key
  const currentTempleKey = normalizeTempleKey(templeId, templeName);

  // Retrieve curated entry
  const curatedData = EXPLORE_NEARBY_DATA[currentTempleKey];

  // 1. Priority Data Logic: Curated non-empty sacred places take precedence, followed by JSON research dataset, then Centralized master dataset lookup
  const curatedSacred =
    curatedData?.sacredPlaces && curatedData.sacredPlaces.length > 0
      ? curatedData.sacredPlaces
      : null;

  const jsonSacred =
    JYOTIRLINGA_SACRED_PLACES_DATA[currentTempleKey] ??
    JYOTIRLINGA_SACRED_PLACES_DATA[normalizeTempleKey(templeId)] ??
    JYOTIRLINGA_SACRED_PLACES_DATA[normalizeTempleKey(templeName)] ??
    null;

  const cleanIdKey = String(templeId || '').toLowerCase().trim();
  const cleanNameSlug = String(templeName || '').replace(/[\–\–\—\-\(\)\/,]/g, ' ').toLowerCase().trim().replace(/\s+/g, '-');

  const jsonShaktiSacred =
    SHAKTI_PEETHA_SACRED_PLACES_DATA[cleanIdKey] ??
    SHAKTI_PEETHA_SACRED_PLACES_DATA[cleanNameSlug] ??
    SHAKTI_PEETHA_SACRED_PLACES_DATA[currentTempleKey] ??
    SHAKTI_PEETHA_SACRED_PLACES_DATA[normalizeTempleKey(templeId)] ??
    SHAKTI_PEETHA_SACRED_PLACES_DATA[normalizeTempleKey(templeName)] ??
    null;

  const jsonHealingSacred =
    HEALING_ASHRAM_SACRED_PLACES_DATA[cleanIdKey] ??
    HEALING_ASHRAM_SACRED_PLACES_DATA[cleanNameSlug] ??
    HEALING_ASHRAM_SACRED_PLACES_DATA[currentTempleKey] ??
    HEALING_ASHRAM_SACRED_PLACES_DATA[normalizeTempleKey(templeId)] ??
    HEALING_ASHRAM_SACRED_PLACES_DATA[normalizeTempleKey(templeName)] ??
    null;

  const rawCentralized =
    CENTRALIZED_SACRED_PLACES_DATA[templeId] ??
    CENTRALIZED_SACRED_PLACES_DATA[String(templeId).toLowerCase().trim()] ??
    CENTRALIZED_SACRED_PLACES_DATA[currentTempleKey] ??
    CENTRALIZED_SACRED_PLACES_DATA[normalizeTempleKey(templeName)] ??
    CENTRALIZED_SACRED_PLACES_DATA[normalizeTempleKey(templeId)] ??
    [];

  // Reject synthetic boilerplate entries like "Sanctum Complex", "Heritage Bathing Ghat & Kund", "Ancient Meditation Hill"
  const centralizedSacred = rawCentralized.filter((item) => {
    const n = (item.name || '').toLowerCase();
    const s = (item.significance || '').toLowerCase();
    if (n.includes('sanctum complex') || n.includes('bathing ghat & kund') || n.includes('ancient meditation hill')) return false;
    if (s.includes('main spiritual complex of') || s.includes('adjacent to') || s.includes('tranquil retreat and historical heritage point')) return false;
    return true;
  });

  const initialSacredPlaces: SacredPlaceItem[] = curatedSacred ?? jsonSacred ?? jsonShaktiSacred ?? jsonHealingSacred ?? (centralizedSacred.length > 0 ? centralizedSacred : []);
  const rawSacredPlaces = initialSacredPlaces;

  // 2. Nearby Temples: Curated non-empty nearby temples OR Cached Coordinate-based Fallback
  let rawNearbyTemples: NearbyTempleItem[] =
    curatedData?.nearbyTemples && curatedData.nearbyTemples.length > 0
      ? [...curatedData.nearbyTemples]
      : [];

  // Fallback: If no curated nearby temples, compute via coordinates using inventory (cached)
  if (rawNearbyTemples.length === 0) {
    const cacheKey = `${currentTempleKey}_${coords?.latitude || 0}_${coords?.longitude || 0}`;
    if (COORD_CACHE.has(cacheKey)) {
      rawNearbyTemples = COORD_CACHE.get(cacheKey)!;
    } else {
      let currentLat = coords?.latitude;
      let currentLon = coords?.longitude;

      if ((!currentLat || !currentLon) && Array.isArray(TEMPLE_DUMP_DATA)) {
        const dumpMatch = (TEMPLE_DUMP_DATA as any[]).find((t) => {
          const dumpKey = normalizeTempleKey(t.id || t.temple_id, t.name);
          return dumpKey === currentTempleKey || t.id === templeId || t.temple_id === templeId;
        });
        if (dumpMatch?.coords?.latitude && dumpMatch?.coords?.longitude) {
          currentLat = dumpMatch.coords.latitude;
          currentLon = dumpMatch.coords.longitude;
        }
      }

      if (currentLat && currentLon && Array.isArray(TEMPLE_DUMP_DATA)) {
        const candidates: { templeId: string; name: string; image: any; distanceKm: number; distance: string }[] = [];

        for (const candidate of TEMPLE_DUMP_DATA as any[]) {
          const candKey = normalizeTempleKey(candidate.id || candidate.temple_id, candidate.name);
          const candidateId = candidate.temple_id || candidate.id;

          // Exclude current temple early from coordinate distance calculation (exact ID or exact name match)
          if (
            candidateId === templeId ||
            (candidate.name && templeName && normalizeTempleKey(candidate.name) === normalizeTempleKey(templeName))
          ) {
            continue;
          }
          if (!candidate.coords?.latitude || !candidate.coords?.longitude) continue;

          // Efficient Bounding Box pre-filter (~3.0 degrees lat/lon ~300km) to avoid heavy haversine calculations
          const latDiff = Math.abs(candidate.coords.latitude - currentLat);
          const lonDiff = Math.abs(candidate.coords.longitude - currentLon);
          if (latDiff > 3.0 || lonDiff > 3.0) continue;

          const distKm = calculateDistanceKm(
            currentLat,
            currentLon,
            candidate.coords.latitude,
            candidate.coords.longitude
          );

          candidates.push({
            templeId: candidateId,
            name: candidate.name,
            image: getTempleImageById(candidateId) || getTempleImageById(candKey),
            distanceKm: distKm,
            distance: `${Math.round(distKm)} km`,
          });
        }

        candidates.sort((a, b) => a.distanceKm - b.distanceKm);
        rawNearbyTemples = candidates.slice(0, 3).map((item) => ({
          templeId: item.templeId,
          name: item.name,
          image: item.image,
          distance: item.distance,
        }));
        COORD_CACHE.set(cacheKey, rawNearbyTemples);
      }
    }
  }

  // Robust Canonical Self-Identity Matcher (only filter out exact same temple)
  const isCurrentTemple = (item: any) => {
    if (!item) return false;

    const itemId = String(item.templeId || item.id || '').toLowerCase().trim();
    const itemName = String(item.name || '').toLowerCase().trim();
    const activeId = String(templeId || '').toLowerCase().trim();
    const activeName = String(templeName || '').toLowerCase().trim();

    if (itemId && activeId && itemId === activeId) return true;
    if (itemName && activeName && itemName === activeName) return true;

    return false;
  };

  // Helper to identify auto-generated filler template items
  const isGenericSyntheticSacredPlace = (item: SacredPlaceItem) => {
    if (!item || !item.name) return false;
    const name = item.name;
    return (
      name.endsWith('Sanctum Complex') ||
      name.endsWith('Heritage Bathing Ghat & Kund') ||
      name.endsWith('Ancient Meditation Hill')
    );
  };

  // Final Output Level Self-Filtering across all collections (filtering synthetic filler)
  const filteredSacredPlaces = rawSacredPlaces.filter((item) => !isCurrentTemple(item) && !isGenericSyntheticSacredPlace(item));
  const filteredNearbyTemples = rawNearbyTemples.filter((item) => !isCurrentTemple(item));
  const filteredCircuit = circuitJourney.filter((item) => !isCurrentTemple(item));

  // Enhanced Deduplication for Nearby Temples & Sacred Places (by canonical ID & normalized clean name)
  const seenNearbyTempleKeys = new Set<string>();
  let deduplicatedNearbyTemples: NearbyTempleItem[] = [];
  for (const item of filteredNearbyTemples) {
    const normIdKey = normalizeTempleKey(item.templeId);
    const normNameKey = normalizeTempleKey(item.name);
    const cleanNameKey = String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const primaryKey = normIdKey || normNameKey || cleanNameKey;

    if (primaryKey && !seenNearbyTempleKeys.has(primaryKey) && !seenNearbyTempleKeys.has(cleanNameKey)) {
      seenNearbyTempleKeys.add(primaryKey);
      seenNearbyTempleKeys.add(cleanNameKey);
      deduplicatedNearbyTemples.push(item);
    }
  }

  const seenSacredNames = new Set<string>();
  let deduplicatedSacredPlaces: SacredPlaceItem[] = [];
  for (const item of filteredSacredPlaces) {
    const cleanName = String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanName && !seenSacredNames.has(cleanName)) {
      seenSacredNames.add(cleanName);
      deduplicatedSacredPlaces.push({
        ...item,
        category: normalizeSacredPlaceCategory(item),
      });
    }
  }

  // Apply optional maxDistanceKm proximity filter
  if (options?.maxDistanceKm && options.maxDistanceKm > 0) {
    const maxDist = options.maxDistanceKm;
    deduplicatedSacredPlaces = deduplicatedSacredPlaces.filter(
      (item) => parseDistanceKm(item.distance) <= maxDist
    );
    deduplicatedNearbyTemples = deduplicatedNearbyTemples.filter(
      (item) => parseDistanceKm(item.distance) <= maxDist
    );
  }

  const hasCuratedData = deduplicatedSacredPlaces.length > 0 || deduplicatedNearbyTemples.length > 0;

  return {
    templeId,
    templeName,
    hasCuratedData,
    nearbySacredPlaces: deduplicatedSacredPlaces,
    nearbyTemples: deduplicatedNearbyTemples,
    journeyTitle,
    circuitJourney: filteredCircuit,
  };
}


