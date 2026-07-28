const defaultDiya = require('../../assets/images/traditional_diya_footer.png');
const defaultFestival = require('../../assets/images/custom_festival_icon_2.png');
const ganeshImg = require('../../assets/images/upcoming_ganesh.jpg');
const durgaImg = require('../../assets/images/upcoming_durga.png');
const shivaImg = require('../../assets/images/upcoming_shiva.jpg');
const gangaImg = require('../../assets/images/upcoming_ganga.jpg');
const radhaImg = require('../../assets/images/upcoming_radha_rani.png');
const hanumanImg = require('../../assets/images/hanuman_banner_new.jpg');

// Dedicated Festival Image Assets
const akshayaTritiya = require('../../assets/images/festivals/Akshaya Tritiya.jpg');
const anantChaturdashi = require('../../assets/images/festivals/Anant Chaturdashi.jpg');
const ashadhiEkadashi = require('../../assets/images/festivals/Ashadhi Ekadashi_.jpg');
const bhaiDooj = require('../../assets/images/festivals/Bhai Dooj.jpg');
const bohagBihu = require('../../assets/images/festivals/Bohag Bihu.jpg');
const chaitraSukhladi = require('../../assets/images/festivals/Chaitra Sukhladi.jpg');
const chhathPuja = require('../../assets/images/festivals/Chhath Puja.jpg');
const dhanteras = require('../../assets/images/festivals/Dhanteras.jpg');
const dhanuSankranti = require('../../assets/images/festivals/Dhanu Sankranti.jpeg');
const diwali = require('../../assets/images/festivals/Diwali.jpeg');
const durgaAshtami = require('../../assets/images/festivals/Durga Ashtami.jpeg');
const dussehra = require('../../assets/images/festivals/Dussehra.jpg');
const ganeshChaturthi = require('../../assets/images/festivals/Ganesh Chaturthi.jpeg');
const geetaJayanti = require('../../assets/images/festivals/Geeta Jayanti.jpg');
const govardhanPuja = require('../../assets/images/festivals/Govardhan Puja.jpg');
const guruPurnima = require('../../assets/images/festivals/Guru Purnima.jpg');
const hanumanJanmotsav = require('../../assets/images/festivals/Hanuman janmotsav.jpg');
const happyHoli = require('../../assets/images/festivals/Happy Holi.jpg');
const hariyaliTeej = require('../../assets/images/festivals/Hariyali Teej.jpeg');
const hindiNewYear = require('../../assets/images/festivals/Hindi New Year.jpg');
const holikaDahan = require('../../assets/images/festivals/Holika Dahan.jpg');
const jagannathRathYatra = require('../../assets/images/festivals/Jagannath Rath Yatra.jpg');
const janmashtami = require('../../assets/images/festivals/Janmashtami.jpg');
const kajariTeej = require('../../assets/images/festivals/Kajari Teej.jpeg');
const kartikPurnima = require('../../assets/images/festivals/Kartik Purnima.jpeg');
const karvaChauth = require('../../assets/images/festivals/Karva Chauth.jpg');
const maghBihu = require('../../assets/images/festivals/Magh Bihu.jpg');
const mahaNavami = require('../../assets/images/festivals/Maha Navami.jpeg');
const mahaSaptami = require('../../assets/images/festivals/Maha Saptami.jpg');
const mahaShivaratri = require('../../assets/images/festivals/Maha Shivaratri.jpeg');
const mahalayaAmavasya = require('../../assets/images/festivals/Mahalaya Amavasya.jpg');
const maharishiValmikiJayanti = require('../../assets/images/festivals/Maharishi Valmiki Jayanti.jpg');
const makarSankranti = require('../../assets/images/festivals/Makar Sankranti.png');
const nagPanchami = require('../../assets/images/festivals/Nag Panchami.jpg');
const onam = require('../../assets/images/festivals/Onam.jpg');
const rakshaBandhan = require('../../assets/images/festivals/Raksha Bandhan.jpg');
const ramNavami = require('../../assets/images/festivals/Ram Navami.jpg');
const savitriPooja = require('../../assets/images/festivals/Savitri Pooja_.jpg');
const sharadNavratri = require('../../assets/images/festivals/Sharad Navratri.jpg');
const sharadPurnima = require('../../assets/images/festivals/Sharad Purnima.jpg');
const thaipusam = require('../../assets/images/festivals/Thaipusam.jpg');
const vaisakhi = require('../../assets/images/festivals/Vaisakhi.jpg');
const vasantPanchami = require('../../assets/images/festivals/Vasant Panchami.jpg');
const vishwakarmaPuja = require('../../assets/images/festivals/Vishwakarma Puja.jpeg');

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

