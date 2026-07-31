// Available image assets mapped to festivals for variety
const imgDiya = require('../../assets/images/traditional_diya_footer.png');
const imgShiva = require('../../assets/images/upcoming_shiva.jpg');
const imgGanesh = require('../../assets/images/upcoming_ganesh.jpg');
const imgDurga = require('../../assets/images/upcoming_durga.png');
const imgGanga = require('../../assets/images/upcoming_ganga.jpg');
const imgShani = require('../../assets/images/upcoming_shani.jpg');
const imgRadha = require('../../assets/images/upcoming_radha_rani.png');
const imgHanuman = require('../../assets/images/hanuman_banner_new.jpg');
const imgKrishna = require('../../assets/images/krishna_arjuna_chariot.png');
const imgGeeta = require('../../assets/images/Bhagvad-geeta.jpg');

const akshayaTritiya = imgRadha;
const anantChaturdashi = imgGanesh;
const ashadhiEkadashi = imgKrishna;
const bhaiDooj = imgRadha;
const bohagBihu = imgGanga;
const chaitraSukhladi = imgRadha;
const chhathPuja = imgGanga;
const dhanteras = imgDiya;
const dhanuSankranti = imgShani;
const diwali = imgDiya;
const durgaAshtami = imgDurga;
const dussehra = imgDurga;
const ganeshChaturthi = imgGanesh;
const geetaJayanti = imgGeeta;
const govardhanPuja = imgKrishna;
const guruPurnima = imgGeeta;
const hanumanJanmotsav = imgHanuman;
const happyHoli = imgRadha;
const hariyaliTeej = imgRadha;
const hindiNewYear = imgShani;
const holikaDahan = imgRadha;
const jagannathRathYatra = imgKrishna;
const janmashtami = imgKrishna;
const kajariTeej = imgRadha;
const kartikPurnima = imgGanga;
const karvaChauth = imgRadha;
const maghBihu = imgGanga;
const mahaNavami = imgDurga;
const mahaSaptami = imgDurga;
const mahaShivaratri = imgShiva;
const mahalayaAmavasya = imgDurga;
const maharishiValmikiJayanti = imgGeeta;
const makarSankranti = imgShani;
const nagPanchami = imgShiva;
const onam = imgGanga;
const rakshaBandhan = imgRadha;
const ramNavami = imgKrishna;
const savitriPooja = imgRadha;
const sharadNavratri = imgDurga;
const sharadPurnima = imgRadha;
const thaipusam = imgShiva;
const vaisakhi = imgGanga;
const vasantPanchami = imgRadha;
const vishwakarmaPuja = imgShani;

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
  const fallback = imgDiya;
  if (!festivalInput) return fallback;

  // 0. If festivalInput itself is a require module ID (number)
  if (typeof festivalInput === 'number') {
    return festivalInput;
  }

  let nameStr = '';
  if (typeof festivalInput === 'object') {
    if (typeof festivalInput.image === 'number') {
      return festivalInput.image;
    }
    if (typeof festivalInput.image_url === 'number') {
      return festivalInput.image_url;
    }
    const remoteUrl = festivalInput.image || festivalInput.image_url || festivalInput.photo || festivalInput.imageUrl;
    if (remoteUrl && typeof remoteUrl === 'string' && remoteUrl.startsWith('http')) {
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

  // 4. Targeted Key Term Match to prevent accidental substring mismatches
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
