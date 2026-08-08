import { getTempleImageById } from '../constants/templeImages';

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
  'somnath-temple-gujarat': 'somnath',
  'somnath temple': 'somnath',

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

  // Baidyanath
  baidyanath: 'baidyanath',
  deoghar: 'baidyanath',
  'jyotirling-baidyanath-temple-deoghar': 'baidyanath',

  // Grishneshwar
  grishneshwar: 'grishneshwar',
  ellora: 'grishneshwar',
  'jyotirling-grishneshwar-temple-ellora': 'grishneshwar',

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

  // Nageshwar
  nageshwar: 'nageshwar',
  'jyotirling-nageshwar-temple-dwarka': 'nageshwar',

  // Ramanathaswamy
  ramanathaswamy: 'ramanathaswamy',
  rameswaram: 'ramanathaswamy',
  'jyotirling-ramanathaswamy-temple-rameswaram': 'ramanathaswamy',

  // Srisailam
  srisailam: 'srisailam',
  mallikarjuna: 'srisailam',
  'jyotirling-mallikarjuna-temple-srisailam': 'srisailam',

  // Tanot Mata (Jaisalmer, Rajasthan)
  'tanot-mata': 'tanot-mata',
  '37t4zb9pvlgwrh9u1le4': 'tanot-mata',
  'tanot mata temple – jaisalmer': 'tanot-mata',
  'tanot mata temple': 'tanot-mata',
  'tanot mata': 'tanot-mata',
};

/**
 * Deterministic Normalization Function
 * Resolves any incoming raw temple ID or temple name string into a canonical key.
 */
export function normalizeTempleKey(rawInput: string): string {
  if (!rawInput) return '';
  const lower = String(rawInput).toLowerCase().trim();

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
  ];

  for (const item of coreKeywords) {
    if (cleanedInput.includes(item.kw)) {
      return item.canonical;
    }
  }

  return lower;
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
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '25 km',
      },
      {
        templeId: 'tungnath-mahadev-temple-chopta',
        name: 'Tungnath Mahadev Temple',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '88 km',
      },
      {
        templeId: 'badrinath',
        name: 'Badrinath Temple',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
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
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '3 km',
      },
      {
        templeId: 'kedarnath',
        name: 'Kedarnath Temple',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '218 km',
      },
      {
        templeId: 'yoganarasimha-temple-joshimath',
        name: 'Narsingh Temple Joshimath',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
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
        image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
        distance: '0.1 km',
      },
      {
        templeId: 'kaal-bhairav-mandir-varanasi',
        name: 'Kaal Bhairav Mandir',
        image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
        distance: '1.5 km',
      },
      {
        templeId: 'sankat-mochan-hanuman-temple-varanasi',
        name: 'Sankat Mochan Temple',
        image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
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
        image: getTempleImageById('jyotirling-baidyanath-temple-deoghar'),
        distance: '43 km',
      },
      {
        templeId: 'shakti-tarapith-temple-bengal',
        name: 'Tarapith Shakti Peeth',
        image: getTempleImageById('other-vaishno-devi-temple-jammu-kashmir'),
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
        name: 'Mokshakund Teerth',
        category: 'Ghat',
        distance: '0.3 km',
        significance: 'Sacred water tank behind Bhimashankar sanctum associated with Sage Kaushika.',
        locationQuery: 'Mokshakund Bhimashankar',
      },
      {
        id: 'bh2',
        name: 'Gupt Bhimashankar Stream',
        category: 'Heritage',
        distance: '2 km',
        significance: 'Origin stream of Bhima River emerging hidden amidst dense Sahyadri forests.',
        locationQuery: 'Gupt Bhimashankar Forest',
      },
      {
        id: 'bh3',
        name: 'Bhimashankar Wildlife Sanctuary Trail',
        category: 'Heritage',
        distance: '1 km',
        significance: 'Sacred grove sanctuary home to the Malabar Giant Squirrel (Shekru).',
        locationQuery: 'Bhimashankar Wildlife Sanctuary',
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
        image: getTempleImageById('jyotirling-ramanathaswamy-temple-rameswaram'),
        distance: '12 km',
      },
      {
        templeId: 'meenakshi-amman-temple-madurai',
        name: 'Meenakshi Amman Temple Madurai',
        image: getTempleImageById('jyotirling-ramanathaswamy-temple-rameswaram'),
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
        image: getTempleImageById('jyotirling-mallikarjuna-temple-srisailam'),
        distance: '3 km',
      },
      {
        templeId: 'paladhara-panchadhara-srisailam',
        name: 'Paladhara Panchadhara Shrine',
        image: getTempleImageById('jyotirling-mallikarjuna-temple-srisailam'),
        distance: '4 km',
      },
    ],
  },
};

export function isCharDham(templeId: string, templeName: string = '', category: string = ''): boolean {
  const checkStr = `${templeId} ${templeName} ${category}`.toLowerCase();
  return (
    checkStr.includes('char dham') ||
    checkStr.includes('chardham') ||
    checkStr.includes('badrinath') ||
    checkStr.includes('kedarnath') ||
    checkStr.includes('jagannath') ||
    checkStr.includes('dwarkadhish') ||
    checkStr.includes('gangotri') ||
    checkStr.includes('yamunotri')
  );
}

export function isHealingTemple(templeId: string, templeName: string = '', category: string = ''): boolean {
  const checkStr = `${templeId} ${templeName} ${category}`.toLowerCase();
  return (
    checkStr.includes('healing') ||
    checkStr.includes('miracle') ||
    checkStr.includes('sai baba') ||
    checkStr.includes('shirdi') ||
    checkStr.includes('balaji') ||
    checkStr.includes('tirupati')
  );
}

export function isShaktiPeetha(templeId: string, templeName: string = '', category: string = ''): boolean {
  const checkStr = `${templeId} ${templeName} ${category}`.toLowerCase();
  return (
    checkStr.includes('shakti') ||
    checkStr.includes('peeth') ||
    checkStr.includes('devi') ||
    checkStr.includes('mata') ||
    checkStr.includes('kamakhya') ||
    checkStr.includes('vaishno') ||
    checkStr.includes('meenakshi') ||
    checkStr.includes('mahalaxmi') ||
    checkStr.includes('kalighat') ||
    checkStr.includes('ambaji') ||
    checkStr.includes('chamundeshwari') ||
    checkStr.includes('kamakshi')
  );
}

export function isJyotirlinga(templeId: string, templeName: string = '', category: string = ''): boolean {
  const checkStr = `${templeId} ${templeName} ${category}`.toLowerCase();
  return (
    checkStr.includes('jyotirling') ||
    checkStr.includes('somnath') ||
    checkStr.includes('mahakal') ||
    checkStr.includes('omkareshwar') ||
    checkStr.includes('bhimashankar') ||
    checkStr.includes('kashi') ||
    checkStr.includes('trimbak') ||
    checkStr.includes('baidyanath') ||
    checkStr.includes('nageshwar') ||
    checkStr.includes('srisailam') ||
    checkStr.includes('rameswaram') ||
    checkStr.includes('grishneshwar')
  );
}

export function getExploreNearbyData(
  templeId: string,
  templeName: string = '',
  category: string = ''
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
  const currentTempleKey = normalizeTempleKey(templeId) || normalizeTempleKey(templeName);

  // Retrieve curated entry
  const curatedData = EXPLORE_NEARBY_DATA[currentTempleKey];

  // Diagnostic logging
  console.log('[NEARBY RESOLUTION]', {
    rawId: templeId,
    rawName: templeName,
    currentTempleKey,
    hasCuratedData: !!curatedData,
    sacredPlacesCount: curatedData?.sacredPlaces?.length ?? 0,
    nearbyTemplesCount: curatedData?.nearbyTemples?.length ?? 0,
  });

  if (!curatedData) {
    console.warn('[NEARBY DATA MISSING]', {
      rawId: templeId,
      rawName: templeName,
      currentTempleKey,
    });
  }

  // 1. Nearby Sacred Places: Direct curated data (Independent, NOT filtered by self-temple key)
  const sacredPlaces: SacredPlaceItem[] = curatedData?.sacredPlaces ?? [];

  // 2. Nearby Temples: Curated nearby temples WITH self-temple exclusion
  const rawNearbyTemples: NearbyTempleItem[] = curatedData?.nearbyTemples ?? [];
  const filteredNearbyTemples = rawNearbyTemples.filter((t) => {
    const templeItemKey = normalizeTempleKey(t.templeId) || normalizeTempleKey(t.name);
    return templeItemKey !== currentTempleKey;
  });

  console.log('[NEARBY FILTER RESULT]', {
    currentTempleKey,
    beforeCount: rawNearbyTemples.length,
    afterCount: filteredNearbyTemples.length,
    temples: filteredNearbyTemples.map((t) => ({ id: t.templeId, name: t.name })),
  });

  // 3. Circuit Journey: Exclude self-temple
  const filteredCircuit = circuitJourney.filter((item) => {
    const itemKey = normalizeTempleKey(item.templeId) || normalizeTempleKey(item.name);
    return itemKey !== currentTempleKey;
  });

  return {
    templeId,
    templeName,
    hasCuratedData: !!curatedData,
    nearbySacredPlaces: sacredPlaces,
    nearbyTemples: filteredNearbyTemples,
    journeyTitle,
    circuitJourney: filteredCircuit,
  };
}
