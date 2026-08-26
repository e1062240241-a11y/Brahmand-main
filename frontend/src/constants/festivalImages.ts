// Available image assets mapped to festivals for variety
const imgDiya = { uri: 'https://brahmandfeed23.b-cdn.net/assets/traditional_diya_footer.webp' };
const imgShiva = { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_shiva.webp' };
const imgGanesh = { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_ganesh.webp' };
const imgDurga = { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_durga.webp' };
const imgGanga = { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_ganga.webp' };
const imgShani = { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_shani.webp' };
const imgRadha = { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_radha_rani.webp' };
const imgHanuman = { uri: 'https://brahmandfeed23.b-cdn.net/assets/hanuman_banner_new.webp' };
const imgKrishna = { uri: 'https://brahmandfeed23.b-cdn.net/assets/krishna_arjuna_chariot.webp' };
const imgGeeta = { uri: 'https://brahmandfeed23.b-cdn.net/assets/Bhagvad-geeta.webp' };

const CDN_FESTIVALS_BASE = 'https://brahmandfeed23.b-cdn.net/festivals';

const akshayaTritiya = { uri: `${CDN_FESTIVALS_BASE}/akshaya_tritiya.webp` };
const anantChaturdashi = { uri: `${CDN_FESTIVALS_BASE}/anant_chaturdashi.webp` };
const ashadhiEkadashi = { uri: `${CDN_FESTIVALS_BASE}/ashadhi_ekadashi.webp` };
const bhaiDooj = { uri: `${CDN_FESTIVALS_BASE}/bhai_dooj.webp` };
const bohagBihu = { uri: `${CDN_FESTIVALS_BASE}/bohag_bihu.webp` };
const chaitraSukhladi = { uri: `${CDN_FESTIVALS_BASE}/chaitra_sukhladi.webp` };
const chhathPuja = { uri: `${CDN_FESTIVALS_BASE}/chhath_puja.webp` };
const dhanteras = { uri: `${CDN_FESTIVALS_BASE}/dhanteras.webp` };
const dhanuSankranti = { uri: `${CDN_FESTIVALS_BASE}/dhanu_sankranti.webp` };
const diwali = { uri: `${CDN_FESTIVALS_BASE}/diwali.webp` };
const durgaAshtami = { uri: `${CDN_FESTIVALS_BASE}/durga_ashtami.webp` };
const dussehra = { uri: `${CDN_FESTIVALS_BASE}/dussehra.webp` };
const ganeshChaturthi = { uri: `${CDN_FESTIVALS_BASE}/ganesh_chaturthi.webp` };
const geetaJayanti = { uri: `${CDN_FESTIVALS_BASE}/geeta_jayanti.webp` };
const govardhanPuja = { uri: `${CDN_FESTIVALS_BASE}/govardhan_puja.webp` };
const guruPurnima = { uri: `${CDN_FESTIVALS_BASE}/guru_purnima.webp` };
const hanumanJanmotsav = { uri: `${CDN_FESTIVALS_BASE}/hanuman_janmotsav.webp` };
const happyHoli = { uri: `${CDN_FESTIVALS_BASE}/happy_holi.webp` };
const hariyaliTeej = { uri: `${CDN_FESTIVALS_BASE}/hariyali_teej.webp` };
const hindiNewYear = { uri: `${CDN_FESTIVALS_BASE}/hindi_new_year.webp` };
const holikaDahan = { uri: `${CDN_FESTIVALS_BASE}/holika_dahan.webp` };
const jagannathRathYatra = { uri: `${CDN_FESTIVALS_BASE}/jagannath_rath_yatra.webp` };
const janmashtami = { uri: `${CDN_FESTIVALS_BASE}/janmashtami.webp` };
const kajariTeej = { uri: `${CDN_FESTIVALS_BASE}/kajari_teej.webp` };
const kartikPurnima = { uri: `${CDN_FESTIVALS_BASE}/kartik_purnima.webp` };
const karvaChauth = { uri: `${CDN_FESTIVALS_BASE}/karva_chauth.webp` };
const maghBihu = { uri: `${CDN_FESTIVALS_BASE}/magh_bihu.webp` };
const mahaNavami = { uri: `${CDN_FESTIVALS_BASE}/maha_navami.webp` };
const mahaSaptami = { uri: `${CDN_FESTIVALS_BASE}/maha_saptami.webp` };
const mahaShivaratri = { uri: `${CDN_FESTIVALS_BASE}/maha_shivaratri.webp` };
const mahalayaAmavasya = { uri: `${CDN_FESTIVALS_BASE}/mahalaya_amavasya.webp` };
const maharishiValmikiJayanti = { uri: `${CDN_FESTIVALS_BASE}/maharishi_valmiki_jayanti.webp` };
const makarSankranti = { uri: `${CDN_FESTIVALS_BASE}/makar_sankranti.webp` };
const nagPanchami = { uri: `${CDN_FESTIVALS_BASE}/nag_panchami.webp` };
const onam = { uri: `${CDN_FESTIVALS_BASE}/onam.webp` };
const rakshaBandhan = { uri: `${CDN_FESTIVALS_BASE}/raksha_bandhan.webp` };
const ramNavami = { uri: `${CDN_FESTIVALS_BASE}/ram_navami.webp` };
const savitriPooja = { uri: `${CDN_FESTIVALS_BASE}/savitri_pooja.webp` };
const sharadNavratri = { uri: `${CDN_FESTIVALS_BASE}/sharad_navratri.webp` };
const sharadPurnima = { uri: `${CDN_FESTIVALS_BASE}/sharad_purnima.webp` };
const thaipusam = { uri: `${CDN_FESTIVALS_BASE}/thaipusam.webp` };
const vaisakhi = { uri: `${CDN_FESTIVALS_BASE}/vaisakhi.webp` };
const vasantPanchami = { uri: `${CDN_FESTIVALS_BASE}/vasant_panchami.webp` };
const vishwakarmaPuja = { uri: `${CDN_FESTIVALS_BASE}/vishwakarma_puja.webp` };

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
