// Available image assets mapped to festivals for variety
const imgDiya = require('../../assets/images/traditional_diya_footer.webp');
const imgShiva = require('../../assets/images/upcoming_shiva.webp');
const imgGanesh = require('../../assets/images/upcoming_ganesh.webp');
const imgDurga = require('../../assets/images/upcoming_durga.webp');
const imgGanga = require('../../assets/images/upcoming_ganga.webp');
const imgShani = require('../../assets/images/upcoming_shani.webp');
const imgRadha = require('../../assets/images/upcoming_radha_rani.webp');
const imgHanuman = require('../../assets/images/hanuman_banner_new.webp');
const imgKrishna = require('../../assets/images/krishna_arjuna_chariot.webp');
const imgGeeta = require('../../assets/images/Bhagvad-geeta.webp');

const akshayaTritiya = require('../../assets/images/festivals/akshaya_tritiya.webp');
const anantChaturdashi = require('../../assets/images/festivals/anant_chaturdashi.webp');
const ashadhiEkadashi = require('../../assets/images/festivals/ashadhi_ekadashi.webp');
const bhaiDooj = require('../../assets/images/festivals/bhai_dooj.webp');
const bohagBihu = require('../../assets/images/festivals/bohag_bihu.webp');
const chaitraSukhladi = require('../../assets/images/festivals/chaitra_sukhladi.webp');
const chhathPuja = require('../../assets/images/festivals/chhath_puja.webp');
const dhanteras = require('../../assets/images/festivals/dhanteras.webp');
const dhanuSankranti = require('../../assets/images/festivals/dhanu_sankranti.webp');
const diwali = require('../../assets/images/festivals/diwali.webp');
const durgaAshtami = require('../../assets/images/festivals/durga_ashtami.webp');
const dussehra = require('../../assets/images/festivals/dussehra.webp');
const ganeshChaturthi = require('../../assets/images/festivals/ganesh_chaturthi.webp');
const geetaJayanti = require('../../assets/images/festivals/geeta_jayanti.webp');
const govardhanPuja = require('../../assets/images/festivals/govardhan_puja.webp');
const guruPurnima = require('../../assets/images/festivals/guru_purnima.webp');
const hanumanJanmotsav = require('../../assets/images/festivals/hanuman_janmotsav.webp');
const happyHoli = require('../../assets/images/festivals/happy_holi.webp');
const hariyaliTeej = require('../../assets/images/festivals/hariyali_teej.webp');
const hindiNewYear = require('../../assets/images/festivals/hindi_new_year.webp');
const holikaDahan = require('../../assets/images/festivals/holika_dahan.webp');
const jagannathRathYatra = require('../../assets/images/festivals/jagannath_rath_yatra.webp');
const janmashtami = require('../../assets/images/festivals/janmashtami.webp');
const kajariTeej = require('../../assets/images/festivals/kajari_teej.webp');
const kartikPurnima = require('../../assets/images/festivals/kartik_purnima.webp');
const karvaChauth = require('../../assets/images/festivals/karva_chauth.webp');
const maghBihu = require('../../assets/images/festivals/magh_bihu.webp');
const mahaNavami = require('../../assets/images/festivals/maha_navami.webp');
const mahaSaptami = require('../../assets/images/festivals/maha_saptami.webp');
const mahaShivaratri = require('../../assets/images/festivals/maha_shivaratri.webp');
const mahalayaAmavasya = require('../../assets/images/festivals/mahalaya_amavasya.webp');
const maharishiValmikiJayanti = require('../../assets/images/festivals/maharishi_valmiki_jayanti.webp');
const makarSankranti = require('../../assets/images/festivals/makar_sankranti.webp');
const nagPanchami = require('../../assets/images/festivals/nag_panchami.webp');
const onam = require('../../assets/images/festivals/onam.webp');
const rakshaBandhan = require('../../assets/images/festivals/raksha_bandhan.webp');
const ramNavami = require('../../assets/images/festivals/ram_navami.webp');
const savitriPooja = require('../../assets/images/festivals/savitri_pooja.webp');
const sharadNavratri = require('../../assets/images/festivals/sharad_navratri.webp');
const sharadPurnima = require('../../assets/images/festivals/sharad_purnima.webp');
const thaipusam = require('../../assets/images/festivals/thaipusam.webp');
const vaisakhi = require('../../assets/images/festivals/vaisakhi.webp');
const vasantPanchami = require('../../assets/images/festivals/vasant_panchami.webp');
const vishwakarmaPuja = require('../../assets/images/festivals/vishwakarma_puja.webp');

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
