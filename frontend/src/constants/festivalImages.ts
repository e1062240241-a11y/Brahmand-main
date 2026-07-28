const defaultDiya = require('../../assets/images/traditional_diya_footer.png');
const defaultFestival = require('../../assets/images/custom_festival_icon_2.png');
const ganeshImg = require('../../assets/images/upcoming_ganesh.jpg');
const durgaImg = require('../../assets/images/upcoming_durga.png');
const shivaImg = require('../../assets/images/upcoming_shiva.jpg');
const gangaImg = require('../../assets/images/upcoming_ganga.jpg');
const radhaImg = require('../../assets/images/upcoming_radha_rani.png');
const hanumanImg = require('../../assets/images/hanuman_banner_new.jpg');

// Dedicated Festival Image Assets with fallback guarantees
const akshayaTritiya = defaultFestival;
const anantChaturdashi = defaultFestival;
const ashadhiEkadashi = defaultFestival;
const bhaiDooj = defaultFestival;
const bohagBihu = defaultFestival;
const chaitraSukhladi = defaultFestival;
const chhathPuja = durgaImg;
const dhanteras = defaultDiya;
const dhanuSankranti = defaultFestival;
const diwali = defaultDiya;
const durgaAshtami = durgaImg;
const dussehra = defaultFestival;
const ganeshChaturthi = ganeshImg;
const geetaJayanti = defaultFestival;
const govardhanPuja = defaultFestival;
const guruPurnima = defaultFestival;
const hanumanJanmotsav = hanumanImg;
const happyHoli = defaultFestival;
const hariyaliTeej = defaultFestival;
const hindiNewYear = defaultFestival;
const holikaDahan = defaultFestival;
const jagannathRathYatra = defaultFestival;
const janmashtami = radhaImg;
const kajariTeej = defaultFestival;
const kartikPurnima = defaultDiya;
const karvaChauth = defaultFestival;
const maghBihu = defaultFestival;
const mahaNavami = durgaImg;
const mahaSaptami = durgaImg;
const mahaShivaratri = shivaImg;
const mahalayaAmavasya = defaultFestival;
const maharishiValmikiJayanti = defaultFestival;
const makarSankranti = defaultFestival;
const nagPanchami = defaultFestival;
const onam = defaultFestival;
const rakshaBandhan = defaultFestival;
const ramNavami = defaultFestival;
const savitriPooja = defaultFestival;
const sharadNavratri = durgaImg;
const sharadPurnima = defaultFestival;
const thaipusam = defaultFestival;
const vaisakhi = defaultFestival;
const vasantPanchami = defaultFestival;
const vishwakarmaPuja = defaultFestival;

export const FESTIVAL_IMAGE_MAP: Record<string, any> = {
  'Makar Sankranti': makarSankranti,
  'Pongal': makarSankranti,
  'Akshaya Tritiya': akshayaTritiya,
  'Anant Chaturdashi': anantChaturdashi,
  'Ashadhi Ekadashi': ashadhiEkadashi,
  'Bhai Dooj': bhaiDooj,
  'Bohag Bihu': bohagBihu,
  'Chaitra Sukhladi': chaitraSukhladi,
  'Cheti Chand': chaitraSukhladi,
  'Ugadi': chaitraSukhladi,
  'Gudi Padwa': chaitraSukhladi,
  'Chhath Puja': chhathPuja,
  'Dhanteras': dhanteras,
  'Dhanu Sankranti': dhanuSankranti,
  'Diwali': diwali,
  'Naraka Chaturdashi': diwali,
  'Durga Ashtami': durgaAshtami,
  'Maha Ashtami': durgaAshtami,
  'Dussehra': dussehra,
  'Vijayadashami': dussehra,
  'Ganesh Chaturthi': ganeshChaturthi,
  'Geeta Jayanti': geetaJayanti,
  'Govardhan Puja': govardhanPuja,
  'Guru Purnima': guruPurnima,
  'Hanuman Janmotsav': hanumanJanmotsav,
  'Hanuman Jayanti': hanumanJanmotsav,
  'Holi': happyHoli,
  'Happy Holi': happyHoli,
  'Hariyali Teej': hariyaliTeej,
  'Hindi New Year': hindiNewYear,
  'Holika Dahan': holikaDahan,
  'Jagannath Rath Yatra': jagannathRathYatra,
  'Rath Yatra': jagannathRathYatra,
  'Janmashtami': janmashtami,
  'Krishna Janmashtami': janmashtami,
  'Kajari Teej': kajariTeej,
  'Kartik Purnima': kartikPurnima,
  'Karva Chauth': karvaChauth,
  'Magh Bihu': maghBihu,
  'Maha Navami': mahaNavami,
  'Maha Saptami': mahaSaptami,
  'Maha Shivaratri': mahaShivaratri,
  'Shivaratri': mahaShivaratri,
  'Mahalaya Amavasya': mahalayaAmavasya,
  'Maharishi Valmiki Jayanti': maharishiValmikiJayanti,
  'Valmiki Jayanti': maharishiValmikiJayanti,
  'Nag Panchami': nagPanchami,
  'Onam': onam,
  'Raksha Bandhan': rakshaBandhan,
  'Varalakshmi Vrat': rakshaBandhan,
  'Ram Navami': ramNavami,
  'Savitri Pooja': savitriPooja,
  'Savitri Puja': savitriPooja,
  'Sharad Navratri': sharadNavratri,
  'Navratri': sharadNavratri,
  'Sharad Purnima': sharadPurnima,
  'Thaipusam': thaipusam,
  'Vaisakhi': vaisakhi,
  'Baisakhi': vaisakhi,
  'Vishu': vaisakhi,
  'Tamil New Year': vaisakhi,
  'Vasant Panchami': vasantPanchami,
  'Vishwakarma Puja': vishwakarmaPuja,
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

