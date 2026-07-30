import { ImageSourcePropType } from 'react-native';

const TEMPLE_IMAGES: Record<string, ImageSourcePropType> = {
  // Jyotirlingas
  'jyotirling-somnath-temple-gujarat': require('../../assets/images/image temple/SomnathTemple.jpg'),
  'jyotirling-kedarnath-temple-uttarakhand': require('../../assets/images/image temple/KedarnathTemple.jpg'),
  'jyotirling-mahakaleshwar-temple-ujjain': require('../../assets/images/image temple/MahakalTemple.webp'),
  'jyotirling-kashi-vishwanath-temple-varanasi': require('../../assets/images/image temple/Kashi_Vishwanath.jpg'),
  'jyotirling-bhimashankar-temple-maharashtra': require('../../assets/images/image temple/Mamleshwar.jpg'),
  'jyotirling-ramanathaswamy-temple-rameswaram': require('../../assets/images/image temple/Ramanathaswamy-temple.webp'),
  'jyotirling-grishneshwar-temple-maharashtra': require('../../assets/images/image temple/Grishneshwar.webp'),
  'jyotirling-grishneshwar-temple-ellora': require('../../assets/images/image temple/Grishneshwar.webp'),
  'jyotirling-omkareshwar-temple-madhya-pradesh': require('../../assets/images/image temple/Okareshwar.jpeg'),
  'jyotirling-trimbakeshwar-temple-maharashtra': require('../../assets/images/image temple/TrimbakehwarTemple.jpg'),
  'jyotirling-trimbakeshwar-temple-nashik': require('../../assets/images/image temple/TrimbakehwarTemple.jpg'),
  'jyotirling-nageshwar-temple-gujarat': require('../../assets/images/image temple/Nageshwar.webp'),
  'jyotirling-nageshwar-temple-dwarka': require('../../assets/images/image temple/Nageshwar.webp'),
  'jyotirling-mallikarjuna-temple-andhra-pradesh': require('../../assets/images/image temple/Mallikarjuna.jpg'),
  'jyotirling-mallikarjuna-temple-srisailam': require('../../assets/images/image temple/Mallikarjuna.jpg'),
  'jyotirling-baidyanath-temple-jharkhand': require('../../assets/images/image temple/Baidyanath.webp'),
  'jyotirling-baidyanath-temple-deoghar': require('../../assets/images/image temple/Baidyanath.webp'),
  
  // Sacred / Others
  'other-tirupati-balaji-temple-andhra-pradesh': require('../../assets/images/image temple/Tirumala_090615.jpg'),
  'other-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/image temple/VaishnoDeviTemple.webp'),
  'other-siddhivinayak-temple-mumbai': require('../../assets/images/image temple/Siddhivinayak.jpg'),
  'other-shree-siddhivinayak-temple': require('../../assets/images/image temple/Siddhivinayak.jpg'),
  'other-shirdi-sai-baba-temple-maharashtra': require('../../assets/images/image temple/Sai_Baba.jpg'),
  'other-jagannath-temple-puri': require('../../assets/images/image temple/JagannathTemple.jpeg'),
  'other-golden-temple-amritsar': require('../../assets/images/image temple/GoldenTemple.jpg'),
  'other-meenakshi-temple-madurai': require('../../assets/images/image temple/MeenakshiTemple.jpg'),
  'other-iskcon-temple-bangalore-karnataka': require('../../assets/images/image temple/ISKCON_Bangalore.jpg'),
  'other-iskcon-bangalore-aarti': require('../../assets/images/image temple/ISKCON_Bangalore.jpg'),
  'other-iskcon-mira-road-thane': require('../../assets/images/image temple/ISKCON_Mira_Road.jpg'),
  'other-iskcon-temple-mumbai': require('../../assets/images/image temple/ISKCON_Juhu.jpg'),
  'other-iskcon-juhu': require('../../assets/images/image temple/ISKCON_Juhu.jpg'),
  'other-iskcon-temple-mumbai-juhu': require('../../assets/images/image temple/ISKCON_Juhu.jpg'),
  'other-mahalaxmi-temple': require('../../assets/images/laxmi_jaap_card.png'),
};

const DEFAULT_TEMPLE_IMAGE: ImageSourcePropType = require('../../assets/images/image temple/SomnathTemple.jpg');

const normalizeTempleName = (name: string) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const getTempleIdFromName = (name: string, prefix: 'jyotirling' | 'other' = 'other') =>
  `${prefix}-${normalizeTempleName(name)}`;

const getTempleImageById = (id: string) => {
  if (TEMPLE_IMAGES[id]) return TEMPLE_IMAGES[id];
  const normId = normalizeTempleName(id);
  for (const key of Object.keys(TEMPLE_IMAGES)) {
    if (normalizeTempleName(key) === normId || normId.includes(normalizeTempleName(key))) {
      return TEMPLE_IMAGES[key];
    }
  }
  return DEFAULT_TEMPLE_IMAGE;
};

const getTempleImageByName = (name: string) => {
  const lowerName = String(name || '').toLowerCase().trim();
  if (!lowerName) return DEFAULT_TEMPLE_IMAGE;
  
  // Direct Keyword Matching for precision across all seed temples
  if (lowerName.includes('somnath')) return TEMPLE_IMAGES['jyotirling-somnath-temple-gujarat'];
  if (lowerName.includes('kedarnath')) return TEMPLE_IMAGES['jyotirling-kedarnath-temple-uttarakhand'];
  if (lowerName.includes('mahakal')) return TEMPLE_IMAGES['jyotirling-mahakaleshwar-temple-ujjain'];
  if (lowerName.includes('vishwanath') || lowerName.includes('kashi')) return TEMPLE_IMAGES['jyotirling-kashi-vishwanath-temple-varanasi'];
  if (lowerName.includes('bhimashankar')) return TEMPLE_IMAGES['jyotirling-bhimashankar-temple-maharashtra'];
  if (lowerName.includes('ramanathaswamy') || lowerName.includes('rameswaram')) return TEMPLE_IMAGES['jyotirling-ramanathaswamy-temple-rameswaram'];
  if (lowerName.includes('grishneshwar') || lowerName.includes('ghrushneshwar')) return TEMPLE_IMAGES['jyotirling-grishneshwar-temple-ellora'];
  if (lowerName.includes('omkareshwar') || lowerName.includes('amkareshwar')) return TEMPLE_IMAGES['jyotirling-omkareshwar-temple-madhya-pradesh'];
  if (lowerName.includes('trimbak')) return TEMPLE_IMAGES['jyotirling-trimbakeshwar-temple-nashik'];
  if (lowerName.includes('nageshwar')) return TEMPLE_IMAGES['jyotirling-nageshwar-temple-dwarka'];
  if (lowerName.includes('mallikarjuna') || lowerName.includes('srisailam')) return TEMPLE_IMAGES['jyotirling-mallikarjuna-temple-srisailam'];
  if (lowerName.includes('baidyanath') || lowerName.includes('deoghar') || lowerName.includes('vaidyanath')) return TEMPLE_IMAGES['jyotirling-baidyanath-temple-deoghar'];

  if (lowerName.includes('tirupati') || lowerName.includes('balaji') || lowerName.includes('venkateswara') || lowerName.includes('tirumala')) {
    return TEMPLE_IMAGES['other-tirupati-balaji-temple-andhra-pradesh'];
  }
  if (lowerName.includes('vaishno')) {
    return TEMPLE_IMAGES['other-vaishno-devi-temple-jammu-kashmir'];
  }
  if (lowerName.includes('siddhivinayak')) {
    return TEMPLE_IMAGES['other-siddhivinayak-temple-mumbai'];
  }
  if (lowerName.includes('shirdi') || lowerName.includes('sai baba') || lowerName.includes('saibaba')) {
    return TEMPLE_IMAGES['other-shirdi-sai-baba-temple-maharashtra'];
  }
  if (lowerName.includes('jagannath') || lowerName.includes('puri')) {
    return TEMPLE_IMAGES['other-jagannath-temple-puri'];
  }
  if (lowerName.includes('golden temple') || lowerName.includes('harmandir') || lowerName.includes('amritsar')) {
    return TEMPLE_IMAGES['other-golden-temple-amritsar'];
  }
  if (lowerName.includes('meenakshi') || lowerName.includes('madurai')) {
    return TEMPLE_IMAGES['other-meenakshi-temple-madurai'];
  }
  if (lowerName.includes('iskcon') && (lowerName.includes('mira') || lowerName.includes('thane') || lowerName.includes('borivali'))) {
    return TEMPLE_IMAGES['other-iskcon-mira-road-thane'];
  }
  if (lowerName.includes('iskcon') && (lowerName.includes('bangalore') || lowerName.includes('bengaluru'))) {
    return TEMPLE_IMAGES['other-iskcon-temple-bangalore-karnataka'];
  }
  if (lowerName.includes('iskcon') && (lowerName.includes('juhu') || lowerName.includes('mumbai'))) {
    return TEMPLE_IMAGES['other-iskcon-temple-mumbai'];
  }

  const jyotirlingId = getTempleIdFromName(name, 'jyotirling');
  if (TEMPLE_IMAGES[jyotirlingId]) return TEMPLE_IMAGES[jyotirlingId];

  const otherId = getTempleIdFromName(name, 'other');
  if (TEMPLE_IMAGES[otherId]) return TEMPLE_IMAGES[otherId];

  const norm = normalizeTempleName(name);
  if (norm.length > 3) {
    for (const key of Object.keys(TEMPLE_IMAGES)) {
      if (key.includes(norm) || norm.includes(key.replace(/^(jyotirling|other)-/, ''))) {
        return TEMPLE_IMAGES[key];
      }
    }
  }

  // Hash-based deterministic pool selection to prevent all unmapped temples from showing Somnath Temple
  const pool = Object.values(TEMPLE_IMAGES);
  let hash = 0;
  for (let i = 0; i < lowerName.length; i++) {
    hash = (hash << 5) - hash + lowerName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index] || DEFAULT_TEMPLE_IMAGE;
};

export { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE, getTempleImageById, getTempleImageByName };