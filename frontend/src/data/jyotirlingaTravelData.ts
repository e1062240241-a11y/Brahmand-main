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

export const EXPLORE_NEARBY_DATA: Record<string, { sacredPlaces: SacredPlaceItem[]; nearbyTemples: NearbyTempleItem[] }> = {
  // 1. Baidyanath Jyotirlinga (Deoghar, Jharkhand)
  'jyotirling-baidyanath-temple-deoghar': {
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
        templeId: 'jyotirling-kashi-vishwanath-temple-varanasi',
        name: 'Kashi Vishwanath Jyotirling',
        image: getTempleImageById('jyotirling-kashi-vishwanath-temple-varanasi'),
        distance: '480 km',
      },
    ],
  },

  // 2. Grishneshwar (Ellora, Maharashtra)
  'jyotirling-grishneshwar-temple-ellora': {
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
        templeId: 'jyotirling-trimbakeshwar-temple-nashik',
        name: 'Trimbakeshwar Shiva Temple',
        image: getTempleImageById('jyotirling-trimbakeshwar-temple-nashik'),
        distance: '172 km',
      },
    ],
  },

  // 3. Somnath (Veraval, Gujarat)
  'jyotirling-somnath-temple-gujarat': {
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
        templeId: 'jyotirling-nageshwar-temple-dwarka',
        name: 'Nageshwar Jyotirling',
        image: getTempleImageById('jyotirling-nageshwar-temple-dwarka'),
        distance: '230 km',
      },
      {
        templeId: 'other-shri-dwarkadhish-temple-dwarka',
        name: 'Shree Dwarkadhish Temple',
        image: getTempleImageById('other-shri-dwarkadhish-temple-dwarka'),
        distance: '235 km',
      },
    ],
  },

  // 4. Kedarnath (Uttarakhand)
  'jyotirling-kedarnath-temple-uttarakhand': {
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
        templeId: 'tungnath-mahadev-temple-chopta',
        name: 'Tungnath Mahadev Temple',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '88 km',
      },
      {
        templeId: 'badrinath-temple-uttarakhand',
        name: 'Badrinath Temple',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '218 km',
      },
      {
        templeId: 'triyuginarayan-shiva-temple',
        name: 'Triyuginarayan Temple',
        image: getTempleImageById('jyotirling-kedarnath-temple-uttarakhand'),
        distance: '25 km',
      },
    ],
  },

  // 5. Mahakaleshwar (Ujjain, MP)
  'jyotirling-mahakaleshwar-temple-ujjain': {
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
        templeId: 'jyotirling-omkareshwar-temple-madhya-pradesh',
        name: 'Omkareshwar Jyotirling',
        image: getTempleImageById('jyotirling-omkareshwar-temple-madhya-pradesh'),
        distance: '140 km',
      },
    ],
  },

  // 6. Kashi Vishwanath (Varanasi, UP)
  'jyotirling-kashi-vishwanath-temple-varanasi': {
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

  // Filter circuit Journey to exclude current temple itself
  const filteredCircuit = circuitJourney.filter((item) => item.templeId !== templeId);

  const cleanNameLower = templeName.toLowerCase().trim();

  // Retrieve or generate base items with custom generated spiritual local assets
  const rawData = EXPLORE_NEARBY_DATA[templeId] || {
    sacredPlaces: [
      {
        id: 'gen_sp1',
        name: 'Sacred Bathing Teertham Ghat',
        category: 'Ghat' as const,
        distance: '0.5 km',
        significance: 'Holy water tank for ritual bathing before entering sanctum.',
        locationQuery: `${templeName} Teertham Pond`,
      },
      {
        id: 'gen_sp2',
        name: 'Pilgrim Heritage Corridor',
        category: 'Heritage' as const,
        distance: '1.2 km',
        significance: 'Historic spiritual pathway lined with ancient shrines & banyan trees.',
        locationQuery: `${templeName} Heritage Walk`,
      },
      {
        id: 'gen_sp3',
        name: 'Sacred Cave Hermitage',
        category: 'Cave' as const,
        distance: '1.8 km',
        significance: 'Peaceful cave hermitage associated with ancient rishi penance.',
        locationQuery: `${templeName} Garden`,
      },
    ],
    nearbyTemples: [
      {
        templeId: 'jyotirling-grishneshwar-temple-ellora',
        name: 'Grishneshwar Jyotirling',
        image: getTempleImageById('jyotirling-grishneshwar-temple-ellora'),
        distance: 'Nearby Region',
      },
      {
        templeId: 'other-shirdi-sai-baba-temple-maharashtra',
        name: 'Shirdi Sai Baba Temple',
        image: getTempleImageById('other-shirdi-sai-baba-temple-maharashtra'),
        distance: 'Regional Shrine',
      },
      {
        templeId: 'other-tirupati-balaji-temple-andhra-pradesh',
        name: 'Tirupati Balaji Temple',
        image: getTempleImageById('other-tirupati-balaji-temple-andhra-pradesh'),
        distance: 'Major Pilgrim Center',
      },
    ],
  };

  // Strict filtering: Remove self from nearby sacred places and nearby temples
  const filteredSacredPlaces = rawData.sacredPlaces.filter((place) => {
    if (place.linkedTempleId && place.linkedTempleId === templeId) return false;
    if (cleanNameLower && place.name.toLowerCase().includes(cleanNameLower)) return false;
    return true;
  });

  const filteredNearbyTemples = rawData.nearbyTemples.filter((temple) => {
    if (temple.templeId === templeId) return false;
    if (cleanNameLower && temple.name.toLowerCase().includes(cleanNameLower)) return false;
    return true;
  });

  return {
    templeId,
    templeName,
    nearbySacredPlaces: filteredSacredPlaces,
    nearbyTemples: filteredNearbyTemples,
    journeyTitle,
    circuitJourney: filteredCircuit,
  };
}
