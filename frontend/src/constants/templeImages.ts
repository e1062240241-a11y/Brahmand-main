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
  
  // Sacred / Others & Char Dham
  'other-tirupati-balaji-temple-andhra-pradesh': require('../../assets/images/image temple/Tirumala_090615.jpg'),
  'other-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/image temple/VaishnoDeviTemple.webp'),
  'other-siddhivinayak-temple-mumbai': require('../../assets/images/image temple/Siddhivinayak.jpg'),
  'other-shree-siddhivinayak-temple': require('../../assets/images/image temple/Siddhivinayak.jpg'),
  'other-shirdi-sai-baba-temple-maharashtra': require('../../assets/images/image temple/Sai_Baba.jpg'),
  'other-jagannath-temple-puri': require('../../assets/images/image temple/Jaganath.jpg'),
  'chardham-jagannath-temple-puri': require('../../assets/images/image temple/Jaganath.jpg'),
  'chardham-badrinath-temple-uttarakhand': require('../../assets/images/image temple/badrinath.webp'),
  'chardham-gangotri-temple-uttarakhand': require('../../assets/images/image temple/gangotri.jpg'),
  'chardham-yamunotri-temple-uttarakhand': require('../../assets/images/image temple/yamunotritemple.webp'),
  'chardham-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.jpg'),
  'other-golden-temple-amritsar': require('../../assets/images/image temple/GoldenTemple.jpg'),
  'other-meenakshi-temple-madurai': require('../../assets/images/image temple/MeenakshiTemple.jpg'),
  'other-iskcon-temple-bangalore-karnataka': require('../../assets/images/image temple/ISKCON_Bangalore.jpg'),
  'other-iskcon-bangalore-aarti': require('../../assets/images/image temple/ISKCON_Bangalore.jpg'),
  'other-iskcon-mira-road-thane': require('../../assets/images/image temple/ISKCON_Mira_Road.jpg'),
  'other-iskcon-temple-mumbai': require('../../assets/images/image temple/ISKCON_Juhu.jpg'),
  'other-iskcon-juhu': require('../../assets/images/image temple/ISKCON_Juhu.jpg'),
  'other-iskcon-temple-mumbai-juhu': require('../../assets/images/image temple/ISKCON_Juhu.jpg'),
  'other-mahalaxmi-temple': require('../../assets/images/shaktipeeth/mahalaxmi.jpeg'),
  'other-shri-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.jpg'),

  // Shakti Peethas (from assets/images/shaktipeeth)
  'shaktipeeth-kamakhya-temple-guwahati': require('../../assets/images/shaktipeeth/kamakhya.webp'),
  'shakti-kamakhya-temple-assam': require('../../assets/images/shaktipeeth/kamakhya.webp'),
  'shaktipeeth-kalighat-kali-temple-kolkata': require('../../assets/images/shaktipeeth/kalighat.jpg'),
  'shakti-kalighat-temple-kolkata': require('../../assets/images/shaktipeeth/kalighat.jpg'),
  'shaktipeeth-tarapith-temple-birbhum': require('../../assets/images/shaktipeeth/tarapith.jpeg'),
  'shakti-tarapith-temple-bengal': require('../../assets/images/shaktipeeth/tarapith.jpeg'),
  'shaktipeeth-ambaji-temple-gujarat': require('../../assets/images/shaktipeeth/ambaji.jpg'),
  'shakti-ambaji-temple-gujarat': require('../../assets/images/shaktipeeth/ambaji.jpg'),
  'shaktipeeth-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/shaktipeeth/vaishnodevi.jpg'),
  'shaktipeeth-jwala-ji-temple-kangra': require('../../assets/images/shaktipeeth/jwala.jpeg'),
  'shaktipeeth-chinnamasta-temple-rajarappa': require('../../assets/images/shaktipeeth/chinnamasta.jpeg'),
  'shaktipeeth-mahalaxmi-temple-kolhapur': require('../../assets/images/shaktipeeth/mahalaxmi.jpeg'),
  'shaktipeeth-chamundeshwari-temple-mysore': require('../../assets/images/shaktipeeth/chamundeshwari.jpeg'),
  'shakti-chamundeshwari-temple-mysore': require('../../assets/images/shaktipeeth/chamundeshwari.jpeg'),
  'shaktipeeth-vindhyavasini-temple-vindhyachal': require('../../assets/images/shaktipeeth/vindhyavasini.webp'),
  'shaktipeeth-kamakhya-kanya-kumari-temple': require('../../assets/images/shaktipeeth/kanyakumari.jpeg'),
  'shaktipeeth-sharda-peeth-kashmir': require('../../assets/images/shaktipeeth/sharadapeeth.jpeg'),
  'shaktipeeth-hinglaj-devi-rajasthan': require('../../assets/images/shaktipeeth/hinglajmata.jpg'),
  'shaktipeeth-tripora-sundari-temple-tripura': require('../../assets/images/shaktipeeth/tripurasundari.jpeg'),
  'shaktipeeth-attahas-temple-birbhum': require('../../assets/images/shaktipeeth/Attahas-Shaktipeeth.webp'),
  'shaktipeeth-bakreshwar-temple-birbhum': require('../../assets/images/shaktipeeth/Bakreswar.jpg'),
  'shaktipeeth-nalateswari-temple-nalhati': require('../../assets/images/shaktipeeth/nalateswari.jpeg'),
  'shaktipeeth-jogadya-temple-burdwan': require('../../assets/images/shaktipeeth/jogadya.jpeg'),
  'shaktipeeth-kankalitala-temple-bolpur': require('../../assets/images/shaktipeeth/kankalitala.jpeg'),
  'shaktipeeth-bhavani-mandir-tuljapur': require('../../assets/images/shaktipeeth/tuljabhavani.jpeg'),
  'shaktipeeth-renuka-devi-temple-mahur': require('../../assets/images/shaktipeeth/renukadevi.jpg'),
  'shaktipeeth-saptashrungi-temple-nashik': require('../../assets/images/shaktipeeth/saptashrungi.jpeg'),
  'shaktipeeth-danteshwari-temple-dantewada': require('../../assets/images/shaktipeeth/danteshwari.webp'),
  'shaktipeeth-chamunda-devi-temple-kangra': require('../../assets/images/shaktipeeth/Chamundatemple.jpeg'),
  'shaktipeeth-naina-devi-temple-bilaspur': require('../../assets/images/shaktipeeth/Nainadevi.jpeg'),
  'shaktipeeth-brareshwari-devi-temple-kangra': require('../../assets/images/shaktipeeth/brajeshwari.jpeg'),
  'shaktipeeth-chintpurni-devi-temple-una': require('../../assets/images/shaktipeeth/chintpurni.jpg'),
  'shaktipeeth-alopi-devi-temple-prayagraj': require('../../assets/images/shaktipeeth/alopi-devi-mandir.jpg'),
  'shaktipeeth-devi-patan-temple-balrampur': require('../../assets/images/shaktipeeth/devipatan.jpeg'),
  'shaktipeeth-harsiddhi-mata-temple-ujjain': require('../../assets/images/shaktipeeth/harsiddhi.jpeg'),
  'shaktipeeth-sharada-devi-temple-maihar': require('../../assets/images/shaktipeeth/maihardevi.webp'),
  'shaktipeeth-biraja-temple-jajpur': require('../../assets/images/shaktipeeth/biraja.jpeg'),
  'shaktipeeth-tara-tarini-temple-ganjam': require('../../assets/images/shaktipeeth/taratarini.jpeg'),
  // Healing Temples (from assets/images/healingtemple)
  'healing-ramanasramam-tiruvannamalai': require('../../assets/images/healingtemple/SriRamana.jpg'),
  'healing-dhyanalinga-isha-coimbatore': require('../../assets/images/healingtemple/dhyanalinga.jpg'),
  'healing-virupaksha-temple-hampi': require('../../assets/images/healingtemple/virupaksha.webp'),
  'healing-anandamayi-ma-ashram-haridwar': require('../../assets/images/healingtemple/AnandamayiAshram.png'),
  'hanuman-mehendipur-balaji-temple-dausa': require('../../assets/images/healingtemple/Mehandipurbalaji.jpeg'),
  'healing-parmarth-niketan-rishikesh': require('../../assets/images/healingtemple/ParmarthNiketan.jpg'),
  'healing-sri-aurobindo-ashram-puducherry': require('../../assets/images/healingtemple/SriAurobindo.jpeg'),
  'sacred-belur-math-ramakrishna-mission': require('../../assets/images/healingtemple/BelurMath.jpg'),
  'healing-sarnath-buddhist-monastery': require('../../assets/images/healingtemple/sarnathvaranasi.jpeg'),
  'sacred-mahabodhi-temple-bodh-gaya': require('../../assets/images/healingtemple/mahabodhi.jpeg'),
  'devi-kollur-mookambika-temple': require('../../assets/images/healingtemple/kollurmookambika.avif'),
  'devi-chottanikara-temple-kochi': require('../../assets/images/healingtemple/Chottanikkara.jpg'),
  'sacred-vaitheeswaran-koil-mayiladuthurai': require('../../assets/images/healingtemple/Vaitheeswaran.jpeg'),
  'healing-parli-vaijnath-temple': require('../../assets/images/healingtemple/parliVajinath.jpeg'),
  'healing-dhanvantari-temple-kerala': require('../../assets/images/healingtemple/SriDhanvantari.jpg'),
  'sacred-suchindram-thanumalayan-temple': require('../../assets/images/healingtemple/SuchindramThanumalay.jpg'),
  'healing-ghati-subramanya-temple': require('../../assets/images/healingtemple/GhatiSubramanyaTemple .jpeg'),
  'panchbhoota-srikalahasteeswara-temple-srikalahasti': require('../../assets/images/healingtemple/Srikalahasteeswara.jpeg'),
  'sacred-kukke-subramanya-temple': require('../../assets/images/healingtemple/KukkeSubramanya .jpeg'),
  'healing-mangaladevi-temple-mangalore': require('../../assets/images/healingtemple/Mangaladevi .jpeg'),

  // Sacred Places (from assets/images/sacred)
  'sacred-assi-ghat': require('../../assets/images/sacred/Assi_Ghat.webp'),
  'sacred-bhalka-tirth-shrine': require('../../assets/images/sacred/BhalkaTirthShrine.webp'),
  'sacred-bhartrihari-caves': require('../../assets/images/sacred/Bhartrihari.webp'),
  'sacred-daulatabad-fort': require('../../assets/images/sacred/Daulatabad.webp'),
  'sacred-ellora-kailasa-temple': require('../../assets/images/sacred/ElloraKailasa.webp'),
  'sacred-gautam-rishi-ashram': require('../../assets/images/sacred/GautamRishiAshram.webp'),
  'sacred-gyanvapi-kund': require('../../assets/images/sacred/Gyanvapi.webp'),
  'sacred-manikarnika-ghat': require('../../assets/images/sacred/Manikarnika_Ghat.webp'),
  'sacred-naulakha-mandir': require('../../assets/images/sacred/Naulakha.webp'),
  'sacred-sandipani-ashram': require('../../assets/images/sacred/SandipaniAshram.webp'),
  'sacred-shiva-trats-kund': require('../../assets/images/sacred/ShivaTrats.webp'),
  'sacred-sonprayag-sangam': require('../../assets/images/sacred/SonprayagSangam.webp'),
  'sacred-tapovan-caves': require('../../assets/images/sacred/Tapovancaves.webp'),
  'sacred-triveni-sangam-ghat': require('../../assets/images/sacred/Triveni-Ghat.webp'),
  'sacred-baan-stambh': require('../../assets/images/sacred/baan.webp'),
  'sacred-bhairavnath-mandir': require('../../assets/images/sacred/bhairavnath.webp'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/sacred/dashashwamedh-ghat.webp'),
  'sacred-gandhi-sarovar': require('../../assets/images/sacred/gandhisarvor.webp'),
  'sacred-gita-mandir': require('../../assets/images/sacred/gitamandir.webp'),
  'sacred-ram-ghat': require('../../assets/images/sacred/ramghat.webp'),
  'sacred-shivganga-kund': require('../../assets/images/sacred/shivganga.webp'),
  'sacred-trikuta-parvat': require('../../assets/images/sacred/trikuta.webp'),
  'sacred-vasuki-tal': require('../../assets/images/sacred/vasukital.webp'),
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

  if (TEMPLE_IMAGES[name]) return TEMPLE_IMAGES[name];
  const byIdMatch = getTempleImageById(name);
  if (byIdMatch && byIdMatch !== DEFAULT_TEMPLE_IMAGE) return byIdMatch;

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
  if (lowerName.includes('dwarkadhish') || lowerName.includes('dwarakdhish') || lowerName.includes('dwarakadheesh')) {
    return TEMPLE_IMAGES['other-shri-dwarkadhish-temple-dwarka'];
  }
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
  if (lowerName.includes('mahalaxmi') || lowerName.includes('mahalakshmi')) {
    return TEMPLE_IMAGES['other-mahalaxmi-temple'];
  }

  // Shakti Peethas Keyword Matching
  if (lowerName.includes('bakreshwar') || lowerName.includes('bakreswar')) return TEMPLE_IMAGES['shaktipeeth-bakreshwar-temple-birbhum'];
  if (lowerName.includes('attahas') || lowerName.includes('fullara')) return TEMPLE_IMAGES['shaktipeeth-attahas-temple-birbhum'];
  if (lowerName.includes('kamakhya')) return TEMPLE_IMAGES['shaktipeeth-kamakhya-temple-guwahati'];
  if (lowerName.includes('kalighat')) return TEMPLE_IMAGES['shaktipeeth-kalighat-kali-temple-kolkata'];
  if (lowerName.includes('tarapith')) return TEMPLE_IMAGES['shaktipeeth-tarapith-temple-birbhum'];
  if (lowerName.includes('ambaji')) return TEMPLE_IMAGES['shaktipeeth-ambaji-temple-gujarat'];
  if (lowerName.includes('jwala')) return TEMPLE_IMAGES['shaktipeeth-jwala-ji-temple-kangra'];
  if (lowerName.includes('chinnamasta') || lowerName.includes('rajrappa')) return TEMPLE_IMAGES['shaktipeeth-chinnamasta-temple-rajarappa'];
  if (lowerName.includes('chamundeshwari') || lowerName.includes('chamundi')) return TEMPLE_IMAGES['shaktipeeth-chamundeshwari-temple-mysore'];
  if (lowerName.includes('vindhya') || lowerName.includes('vindhyavasini')) return TEMPLE_IMAGES['shaktipeeth-vindhyavasini-temple-vindhyachal'];
  if (lowerName.includes('kanyakumari')) return TEMPLE_IMAGES['shaktipeeth-kamakhya-kanya-kumari-temple'];
  if (lowerName.includes('sharada peeth') || lowerName.includes('sharda peeth')) return TEMPLE_IMAGES['shaktipeeth-sharda-peeth-kashmir'];
  if (lowerName.includes('hinglaj')) return TEMPLE_IMAGES['shaktipeeth-hinglaj-devi-rajasthan'];
  if (lowerName.includes('tripura sundari')) return TEMPLE_IMAGES['shaktipeeth-tripora-sundari-temple-tripura'];
  if (lowerName.includes('nalateswari') || lowerName.includes('nalhati')) return TEMPLE_IMAGES['shaktipeeth-nalateswari-temple-nalhati'];
  if (lowerName.includes('jogadya')) return TEMPLE_IMAGES['shaktipeeth-jogadya-temple-burdwan'];
  if (lowerName.includes('kankalitala')) return TEMPLE_IMAGES['shaktipeeth-kankalitala-temple-bolpur'];
  if (lowerName.includes('tulja') || lowerName.includes('tuljabhavani')) return TEMPLE_IMAGES['shaktipeeth-bhavani-mandir-tuljapur'];
  if (lowerName.includes('renuka')) return TEMPLE_IMAGES['shaktipeeth-renuka-devi-temple-mahur'];
  if (lowerName.includes('saptashrungi')) return TEMPLE_IMAGES['shaktipeeth-saptashrungi-temple-nashik'];
  if (lowerName.includes('danteshwari')) return TEMPLE_IMAGES['shaktipeeth-danteshwari-temple-dantewada'];
  if (lowerName.includes('chamunda devi')) return TEMPLE_IMAGES['shaktipeeth-chamunda-devi-temple-kangra'];
  if (lowerName.includes('naina devi')) return TEMPLE_IMAGES['shaktipeeth-naina-devi-temple-bilaspur'];
  if (lowerName.includes('brajeshwari') || lowerName.includes('brareshwari')) return TEMPLE_IMAGES['shaktipeeth-brareshwari-devi-temple-kangra'];
  if (lowerName.includes('chintpurni')) return TEMPLE_IMAGES['shaktipeeth-chintpurni-devi-temple-una'];
  if (lowerName.includes('alopi')) return TEMPLE_IMAGES['shaktipeeth-alopi-devi-temple-prayagraj'];
  if (lowerName.includes('devi patan')) return TEMPLE_IMAGES['shaktipeeth-devi-patan-temple-balrampur'];
  if (lowerName.includes('harsiddhi')) return TEMPLE_IMAGES['shaktipeeth-harsiddhi-mata-temple-ujjain'];
  if (lowerName.includes('maihar') || (lowerName.includes('sharada') && lowerName.includes('devi'))) return TEMPLE_IMAGES['shaktipeeth-sharada-devi-temple-maihar'];
  if (lowerName.includes('biraja')) return TEMPLE_IMAGES['shaktipeeth-biraja-temple-jajpur'];
  if (lowerName.includes('kalika mata') || lowerName.includes('pavagadh')) return TEMPLE_IMAGES['sacred-mahakali-temple-pavagadh'];

  // Healing Temples Keyword Matching
  if (lowerName.includes('ramanasramam') || lowerName.includes('ramana maharshi')) return TEMPLE_IMAGES['healing-ramanasramam-tiruvannamalai'];
  if (lowerName.includes('dhyanalinga')) return TEMPLE_IMAGES['healing-dhyanalinga-isha-coimbatore'];
  if (lowerName.includes('virupaksha')) return TEMPLE_IMAGES['healing-virupaksha-temple-hampi'];
  if (lowerName.includes('anandamayi')) return TEMPLE_IMAGES['healing-anandamayi-ma-ashram-haridwar'];
  if (lowerName.includes('mehendipur') || lowerName.includes('mehandipur')) return TEMPLE_IMAGES['hanuman-mehendipur-balaji-temple-dausa'];
  if (lowerName.includes('parmarth')) return TEMPLE_IMAGES['healing-parmarth-niketan-rishikesh'];
  if (lowerName.includes('aurobindo')) return TEMPLE_IMAGES['healing-sri-aurobindo-ashram-puducherry'];
  if (lowerName.includes('belur math')) return TEMPLE_IMAGES['sacred-belur-math-ramakrishna-mission'];
  if (lowerName.includes('sarnath')) return TEMPLE_IMAGES['healing-sarnath-buddhist-monastery'];
  if (lowerName.includes('mahabodhi') || lowerName.includes('bodh gaya')) return TEMPLE_IMAGES['sacred-mahabodhi-temple-bodh-gaya'];
  if (lowerName.includes('mookambika') || lowerName.includes('kollur')) return TEMPLE_IMAGES['devi-kollur-mookambika-temple'];
  if (lowerName.includes('chottanikara') || lowerName.includes('chottanikkara')) return TEMPLE_IMAGES['devi-chottanikara-temple-kochi'];
  if (lowerName.includes('vaitheeswaran')) return TEMPLE_IMAGES['sacred-vaitheeswaran-koil-mayiladuthurai'];
  if (lowerName.includes('vaijnath') || lowerName.includes('parli')) return TEMPLE_IMAGES['healing-parli-vaijnath-temple'];
  if (lowerName.includes('dhanvantari')) return TEMPLE_IMAGES['healing-dhanvantari-temple-kerala'];
  if (lowerName.includes('suchindram') || lowerName.includes('thanumalayan')) return TEMPLE_IMAGES['sacred-suchindram-thanumalayan-temple'];
  if (lowerName.includes('ghati subramanya')) return TEMPLE_IMAGES['healing-ghati-subramanya-temple'];
  if (lowerName.includes('srikalahast') || lowerName.includes('kalahasti')) return TEMPLE_IMAGES['panchbhoota-srikalahasteeswara-temple-srikalahasti'];
  if (lowerName.includes('kukke')) return TEMPLE_IMAGES['sacred-kukke-subramanya-temple'];
  if (lowerName.includes('mangaladevi')) return TEMPLE_IMAGES['healing-mangaladevi-temple-mangalore'];

  // Sacred Places Keyword Matching
  if (lowerName.includes('assi ghat')) return TEMPLE_IMAGES['sacred-assi-ghat'];
  if (lowerName.includes('bhalka')) return TEMPLE_IMAGES['sacred-bhalka-tirth-shrine'];
  if (lowerName.includes('bhartrihari')) return TEMPLE_IMAGES['sacred-bhartrihari-caves'];
  if (lowerName.includes('daulatabad')) return TEMPLE_IMAGES['sacred-daulatabad-fort'];
  if (lowerName.includes('ellora') || lowerName.includes('kailasa')) return TEMPLE_IMAGES['sacred-ellora-kailasa-temple'];
  if (lowerName.includes('gautam rishi')) return TEMPLE_IMAGES['sacred-gautam-rishi-ashram'];
  if (lowerName.includes('gyanvapi')) return TEMPLE_IMAGES['sacred-gyanvapi-kund'];
  if (lowerName.includes('manikarnika')) return TEMPLE_IMAGES['sacred-manikarnika-ghat'];
  if (lowerName.includes('naulakha')) return TEMPLE_IMAGES['sacred-naulakha-mandir'];
  if (lowerName.includes('sandipani')) return TEMPLE_IMAGES['sacred-sandipani-ashram'];
  if (lowerName.includes('shiva trats')) return TEMPLE_IMAGES['sacred-shiva-trats-kund'];
  if (lowerName.includes('sonprayag')) return TEMPLE_IMAGES['sacred-sonprayag-sangam'];
  if (lowerName.includes('tapovan')) return TEMPLE_IMAGES['sacred-tapovan-caves'];
  if (lowerName.includes('triveni')) return TEMPLE_IMAGES['sacred-triveni-sangam-ghat'];
  if (lowerName.includes('baan stambh')) return TEMPLE_IMAGES['sacred-baan-stambh'];
  if (lowerName.includes('bhairavnath')) return TEMPLE_IMAGES['sacred-bhairavnath-mandir'];
  if (lowerName.includes('dashashwamedh')) return TEMPLE_IMAGES['sacred-dashashwamedh-ghat'];
  if (lowerName.includes('gandhi sarovar')) return TEMPLE_IMAGES['sacred-gandhi-sarovar'];
  if (lowerName.includes('gita mandir')) return TEMPLE_IMAGES['sacred-gita-mandir'];
  if (lowerName.includes('ram ghat')) return TEMPLE_IMAGES['sacred-ram-ghat'];
  if (lowerName.includes('shivganga')) return TEMPLE_IMAGES['sacred-shivganga-kund'];
  if (lowerName.includes('trikuta') || lowerName.includes('trikut')) return TEMPLE_IMAGES['sacred-trikuta-parvat'];
  if (lowerName.includes('vasuki tal')) return TEMPLE_IMAGES['sacred-vasuki-tal'];

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