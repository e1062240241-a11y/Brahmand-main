const defaultDiya = require('../../assets/images/traditional_diya_footer.png');
const defaultFestival = require('../../assets/images/custom_festival_icon_2.png');
const ganeshImg = require('../../assets/images/upcoming_ganesh.jpg');
const durgaImg = require('../../assets/images/upcoming_durga.png');
const shivaImg = require('../../assets/images/upcoming_shiva.jpg');
const gangaImg = require('../../assets/images/upcoming_ganga.jpg');
const radhaImg = require('../../assets/images/upcoming_radha_rani.png');
const hanumanImg = require('../../assets/images/hanuman_banner_new.jpg');

export const FESTIVAL_IMAGE_MAP: Record<string, any> = {
  'Makar Sankranti': defaultFestival,
  'Pongal': defaultFestival,
  'Akshaya Tritiya': defaultDiya,
  'Anant Chaturdashi': ganeshImg,
  'Ashadhi Ekadashi': defaultDiya,
  'Bhai Dooj': defaultDiya,
  'Bohag Bihu': defaultFestival,
  'Chaitra Sukhladi': defaultFestival,
  'Chhath Puja': gangaImg,
  'Dhanteras': defaultDiya,
  'Dhanu Sankranti': defaultFestival,
  'Diwali': defaultDiya,
  'Durga Ashtami': durgaImg,
  'Dussehra': durgaImg,
  'Ganesh Chaturthi': ganeshImg,
  'Geeta Jayanti': radhaImg,
  'Govardhan Puja': radhaImg,
  'Guru Purnima': defaultDiya,
  'Hanuman Janmotsav': hanumanImg,
  'Hanuman Jayanti': hanumanImg,
  'Holi': defaultFestival,
  'Happy Holi': defaultFestival,
  'Hariyali Teej': radhaImg,
  'Hindi New Year': defaultFestival,
  'Holika Dahan': defaultFestival,
  'Jagannath Rath Yatra': defaultDiya,
  'Janmashtami': radhaImg,
  'Kajari Teej': radhaImg,
  'Kartik Purnima': defaultDiya,
  'Karva Chauth': radhaImg,
  'Magh Bihu': defaultFestival,
  'Maha Navami': durgaImg,
  'Maha Saptami': durgaImg,
  'Maha Shivaratri': shivaImg,
  'Mahalaya Amavasya': durgaImg,
  'Maharishi Valmiki Jayanti': defaultDiya,
  'Nag Panchami': shivaImg,
  'Onam': defaultFestival,
  'Raksha Bandhan': defaultDiya,
  'Ram Navami': radhaImg,
  'Savitri Pooja': defaultDiya,
  'Sharad Navratri': durgaImg,
  'Sharad Purnima': defaultDiya,
  'Thaipusam': defaultDiya,
  'Vaisakhi': defaultFestival,
  'Vasant Panchami': defaultDiya,
  'Vishwakarma Puja': defaultDiya,
};

export const getFestivalImage = (name: string) => {
  const fallback = defaultDiya;
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
