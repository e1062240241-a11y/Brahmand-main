const defaultDiya = require('../../assets/images/traditional_diya_footer.png');
const defaultFestival = require('../../assets/images/traditional_diya_footer.png');

// Dedicated Festival Image Assets - Deities, Diyas, Sacred Symbols only (No Temple Buildings)
const upcomingDurga = require('../../assets/images/upcoming_durga.png');
const upcomingGanesh = require('../../assets/images/upcoming_ganesh.jpg');
const upcomingGanga = require('../../assets/images/upcoming_ganga.jpg');
const upcomingRadhaRani = require('../../assets/images/upcoming_radha_rani.png');
const upcomingShani = require('../../assets/images/upcoming_shani.jpg');
const upcomingShiva = require('../../assets/images/upcoming_shiva.jpg');

const imageRamcharitmanas = require('../../assets/images/Ramcharitmanas.jpg');
const imageLaxmi = require('../../assets/images/laxmi_jaap_card.png');
const imageKrishna = require('../../assets/images/krishna_jaap_card.png');
const imageKrishnaChariot = require('../../assets/images/krishna_arjuna_chariot.png');
const imageHanuman = require('../../assets/images/hanuman_banner_new.jpg');
const imageGayatri = require('../../assets/images/gayatri_jaap_card.png');
const imageSunlightHero = require('../../assets/images/sunlight_vedic_hero.png');
const imageSacredDiya = require('../../assets/images/sacred_diya_footer.png');
const imagePinkLotus = require('../../assets/images/pink_lotus_splash.png');
const imageShivaJaap = require('../../assets/images/shiva_jaap_card_v2.png');
const imageVedicBook = require('../../assets/images/ancient_vedic_book_hero.png');

const akshayaTritiya = imageLaxmi;
const anantChaturdashi = upcomingGanesh;
const ashadhiEkadashi = imageKrishna;
const bhaiDooj = imageSacredDiya;
const bohagBihu = imageSunlightHero;
const chaitraSukhladi = imageSunlightHero;
const chhathPuja = upcomingGanga;
const dhanteras = imageLaxmi;
const dhanuSankranti = imageSunlightHero;
const diwali = imageLaxmi;
const durgaAshtami = upcomingDurga;
const dussehra = imageRamcharitmanas;
const ganeshChaturthi = upcomingGanesh;
const geetaJayanti = imageKrishnaChariot;
const govardhanPuja = imageKrishna;
const guruPurnima = imageKrishna;
const hanumanJanmotsav = imageHanuman;
const happyHoli = imagePinkLotus;
const hariyaliTeej = imagePinkLotus;
const hindiNewYear = imageSunlightHero;
const holikaDahan = imageSacredDiya;
const jagannathRathYatra = imageKrishna;
const janmashtami = upcomingRadhaRani;
const kajariTeej = imagePinkLotus;
const kartikPurnima = defaultDiya;
const karvaChauth = imagePinkLotus;
const maghBihu = imageSunlightHero;
const mahaNavami = upcomingDurga;
const mahaSaptami = upcomingDurga;
const mahaShivaratri = upcomingShiva;
const mahalayaAmavasya = upcomingDurga;
const maharishiValmikiJayanti = imageVedicBook;
const makarSankranti = imageSunlightHero;
const nagPanchami = imageShivaJaap;
const onam = imagePinkLotus;
const rakshaBandhan = imageSacredDiya;
const ramNavami = imageRamcharitmanas;
const savitriPooja = imageSacredDiya;
const sharadNavratri = upcomingDurga;
const sharadPurnima = defaultDiya;
const thaipusam = upcomingShiva;
const vaisakhi = imageSunlightHero;
const vasantPanchami = imageGayatri;
const vishwakarmaPuja = imageVedicBook;

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
  'Deepavali': diwali,
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
  'Buddha Purnima': guruPurnima,
  'Dev Uthani Ekadashi': ashadhiEkadashi,
  'Tulsi Vivah': govardhanPuja,
};

export const getFestivalImage = (festivalInput: any) => {
  const fallback = defaultFestival || defaultDiya;
  if (!festivalInput) return fallback;

  // 0. If festivalInput itself is a require module ID (number)
  if (typeof festivalInput === 'number') {
    return festivalInput;
  }

  let nameStr = '';
  if (typeof festivalInput === 'object') {
    // If festivalInput.image is a direct numeric asset require module
    if (typeof festivalInput.image === 'number') {
      return festivalInput.image;
    }
    if (typeof festivalInput.image_url === 'number') {
      return festivalInput.image_url;
    }
    const remoteUrl = festivalInput.image || festivalInput.image_url || festivalInput.photo || festivalInput.imageUrl;
    if (remoteUrl && typeof remoteUrl === 'string' && remoteUrl.startsWith('http')) {
      // Ensure HTTPS for iOS App Transport Security (ATS) compliance
      const secureUrl = remoteUrl.replace(/^http:\/\//i, 'https://');
      return { uri: secureUrl };
    }
    nameStr = festivalInput.name || festivalInput.festival_name || festivalInput.title || '';
  } else if (typeof festivalInput === 'string') {
    nameStr = festivalInput;
  }

  if (!nameStr || typeof nameStr !== 'string') return fallback;

  const trimmed = nameStr.trim();
  if (!trimmed) return fallback;

  // 1. Direct exact key match
  if (FESTIVAL_IMAGE_MAP[trimmed]) {
    return FESTIVAL_IMAGE_MAP[trimmed];
  }

  // 2. Case-insensitive exact match
  const searchLower = trimmed.toLowerCase();
  const exactKey = Object.keys(FESTIVAL_IMAGE_MAP).find(k => k.toLowerCase() === searchLower);
  if (exactKey) {
    return FESTIVAL_IMAGE_MAP[exactKey];
  }

  // 3. Handle names separated by slashes or dashes or commas (e.g. "Makar Sankranti / Pongal")
  const segments = searchLower.split(/[\/\,\-\–]/).map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const segMatch = Object.keys(FESTIVAL_IMAGE_MAP).find(k => k.toLowerCase() === seg);
    if (segMatch) {
      return FESTIVAL_IMAGE_MAP[segMatch];
    }
  }

  // 4. Targeted Key Term Match to prevent accidental substring mismatches (like "Jayanti" or "Navami")
  if (searchLower.includes('shiva') || searchLower.includes('shivaratri')) return mahaShivaratri;
  if (searchLower.includes('ganesh') || searchLower.includes('ganpati')) return ganeshChaturthi;
  if (searchLower.includes('hanuman') || searchLower.includes('janmotsav')) return hanumanJanmotsav;
  if (searchLower.includes('janmashtami') || searchLower.includes('krishna')) return janmashtami;
  if (searchLower.includes('chhath')) return chhathPuja;
  if (searchLower.includes('dhanteras')) return dhanteras;
  if (searchLower.includes('dussehra') || searchLower.includes('vijayadashami')) return dussehra;
  if (searchLower.includes('diwali') || searchLower.includes('deepavali')) return diwali;
  if (searchLower.includes('ram navami') || searchLower.includes('rama navami')) return ramNavami;
  if (searchLower.includes('durga ashtami') || searchLower.includes('maha ashtami')) return durgaAshtami;
  if (searchLower.includes('maha navami')) return mahaNavami;
  if (searchLower.includes('maha saptami')) return mahaSaptami;
  if (searchLower.includes('sharad navratri') || searchLower.includes('navratri')) return sharadNavratri;
  if (searchLower.includes('holika')) return holikaDahan;
  if (searchLower.includes('holi')) return happyHoli;
  if (searchLower.includes('karva') || searchLower.includes('karwa')) return karvaChauth;
  if (searchLower.includes('raksha') || searchLower.includes('rakhi')) return rakshaBandhan;
  if (searchLower.includes('makar') || searchLower.includes('sankranti') || searchLower.includes('pongal')) return makarSankranti;
  if (searchLower.includes('onam')) return onam;
  if (searchLower.includes('geeta') || searchLower.includes('gita')) return geetaJayanti;
  if (searchLower.includes('valmiki')) return maharishiValmikiJayanti;
  if (searchLower.includes('guru purnima')) return guruPurnima;
  if (searchLower.includes('bhai dooj')) return bhaiDooj;
  if (searchLower.includes('govardhan')) return govardhanPuja;
  if (searchLower.includes('nag') || searchLower.includes('naga')) return nagPanchami;
  if (searchLower.includes('vishwakarma')) return vishwakarmaPuja;
  if (searchLower.includes('vasant') || searchLower.includes('saraswati')) return vasantPanchami;
  if (searchLower.includes('akshaya') || searchLower.includes('tritiya')) return akshayaTritiya;
  if (searchLower.includes('hariyali teej')) return hariyaliTeej;
  if (searchLower.includes('kajari teej')) return kajariTeej;
  if (searchLower.includes('magh bihu')) return maghBihu;
  if (searchLower.includes('bohag bihu') || searchLower.includes('bihu')) return bohagBihu;
  if (searchLower.includes('baisakhi') || searchLower.includes('vaisakhi') || searchLower.includes('vishu')) return vaisakhi;
  if (searchLower.includes('rath yatra') || searchLower.includes('jagannath')) return jagannathRathYatra;
  if (searchLower.includes('thaipusam')) return thaipusam;
  if (searchLower.includes('ekadashi')) return ashadhiEkadashi;
  if (searchLower.includes('savitri')) return savitriPooja;
  if (searchLower.includes('anant')) return anantChaturdashi;
  if (searchLower.includes('kartik purnima')) return kartikPurnima;
  if (searchLower.includes('sharad purnima')) return sharadPurnima;
  if (searchLower.includes('buddha') || searchLower.includes('purnima')) return guruPurnima;

  return fallback;
};

