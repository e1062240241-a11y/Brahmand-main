import { ImageSourcePropType } from 'react-native';

const TEMPLE_IMAGES: Record<string, ImageSourcePropType> = {
  // Jyotirlingas
  'jyotirling-somnath-temple-gujarat': require('../../assets/images/image temple/SomnathTemple.webp'),
  'jyotirling-kedarnath-temple-uttarakhand': require('../../assets/images/image temple/KedarnathTemple.webp'),
  'jyotirling-mahakaleshwar-temple-ujjain': require('../../assets/images/image temple/MahakalTemple.webp'),
  'jyotirling-kashi-vishwanath-temple-varanasi': require('../../assets/images/image temple/Kashi_Vishwanath.webp'),
  'jyotirling-bhimashankar-temple-maharashtra': require('../../assets/images/image temple/Mamleshwar.webp'),
  'jyotirling-ramanathaswamy-temple-rameswaram': require('../../assets/images/image temple/Ramanathaswamy-temple.webp'),
  'jyotirling-grishneshwar-temple-maharashtra': require('../../assets/images/image temple/Grishneshwar.webp'),
  'jyotirling-grishneshwar-temple-ellora': require('../../assets/images/image temple/Grishneshwar.webp'),
  'jyotirling-omkareshwar-temple-madhya-pradesh': require('../../assets/images/image temple/Okareshwar.webp'),
  'jyotirling-trimbakeshwar-temple-maharashtra': require('../../assets/images/image temple/TrimbakehwarTemple.webp'),
  'jyotirling-trimbakeshwar-temple-nashik': require('../../assets/images/image temple/TrimbakehwarTemple.webp'),
  'jyotirling-nageshwar-temple-gujarat': require('../../assets/images/image temple/Nageshwar.webp'),
  'jyotirling-nageshwar-temple-dwarka': require('../../assets/images/image temple/Nageshwar.webp'),
  'jyotirling-mallikarjuna-temple-andhra-pradesh': require('../../assets/images/image temple/Mallikarjuna.webp'),
  'jyotirling-mallikarjuna-temple-srisailam': require('../../assets/images/image temple/Mallikarjuna.webp'),
  'jyotirling-baidyanath-temple-jharkhand': require('../../assets/images/image temple/Baidyanath.webp'),
  'jyotirling-baidyanath-temple-deoghar': require('../../assets/images/image temple/Baidyanath.webp'),
  
  // Sacred / Others & Char Dham
  'other-tirupati-balaji-temple-andhra-pradesh': require('../../assets/images/image temple/Tirumala_090615.webp'),
  'other-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/image temple/VaishnoDeviTemple.webp'),
  'other-siddhivinayak-temple-mumbai': require('../../assets/images/image temple/Siddhivinayak.webp'),
  'other-shree-siddhivinayak-temple': require('../../assets/images/image temple/Siddhivinayak.webp'),
  'other-shirdi-sai-baba-temple-maharashtra': require('../../assets/images/image temple/Sai_Baba.webp'),
  'other-jagannath-temple-puri': require('../../assets/images/image temple/Jaganath.webp'),
  'chardham-jagannath-temple-puri': require('../../assets/images/image temple/Jaganath.webp'),
  'chardham-badrinath-temple-uttarakhand': require('../../assets/images/image temple/badrinath.webp'),
  'chardham-gangotri-temple-uttarakhand': require('../../assets/images/image temple/gangotri.webp'),
  'chardham-yamunotri-temple-uttarakhand': require('../../assets/images/image temple/yamunotritemple.webp'),
  'chardham-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.webp'),
  'other-golden-temple-amritsar': require('../../assets/images/image temple/GoldenTemple.webp'),
  'other-meenakshi-temple-madurai': require('../../assets/images/image temple/MeenakshiTemple.webp'),
  'other-iskcon-temple-bangalore-karnataka': require('../../assets/images/image temple/ISKCON_Bangalore.webp'),
  'other-iskcon-bangalore-aarti': require('../../assets/images/image temple/ISKCON_Bangalore.webp'),
  'other-iskcon-mira-road-thane': require('../../assets/images/image temple/ISKCON_Mira_Road.webp'),
  'other-iskcon-temple-mumbai': require('../../assets/images/image temple/ISKCON_Juhu.webp'),
  'other-iskcon-juhu': require('../../assets/images/image temple/ISKCON_Juhu.webp'),
  'other-iskcon-temple-mumbai-juhu': require('../../assets/images/image temple/ISKCON_Juhu.webp'),
  'other-mahalaxmi-temple': require('../../assets/images/shaktipeeth/mahalaxmi.webp'),
  'other-shri-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.webp'),

  // Shakti Peethas (from assets/images/shaktipeeth)
  'shaktipeeth-kamakhya-temple-guwahati': require('../../assets/images/shaktipeeth/kamakhya.webp'),
  'shakti-kamakhya-temple-assam': require('../../assets/images/shaktipeeth/kamakhya.webp'),
  'shaktipeeth-kalighat-kali-temple-kolkata': require('../../assets/images/shaktipeeth/kalighat.webp'),
  'shakti-kalighat-temple-kolkata': require('../../assets/images/shaktipeeth/kalighat.webp'),
  'shaktipeeth-tarapith-temple-birbhum': require('../../assets/images/shaktipeeth/tarapith.webp'),
  'shakti-tarapith-temple-bengal': require('../../assets/images/shaktipeeth/tarapith.webp'),
  'shaktipeeth-ambaji-temple-gujarat': require('../../assets/images/shaktipeeth/ambaji.webp'),
  'shakti-ambaji-temple-gujarat': require('../../assets/images/shaktipeeth/ambaji.webp'),
  'shaktipeeth-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/shaktipeeth/vaishnodevi.webp'),
  'shaktipeeth-jwala-ji-temple-kangra': require('../../assets/images/shaktipeeth/jwala.webp'),
  'shaktipeeth-chinnamasta-temple-rajarappa': require('../../assets/images/shaktipeeth/chinnamasta.webp'),
  'shaktipeeth-mahalaxmi-temple-kolhapur': require('../../assets/images/shaktipeeth/mahalaxmi.webp'),
  'shaktipeeth-chamundeshwari-temple-mysore': require('../../assets/images/shaktipeeth/chamundeshwari.webp'),
  'shakti-chamundeshwari-temple-mysore': require('../../assets/images/shaktipeeth/chamundeshwari.webp'),
  'shaktipeeth-vindhyavasini-temple-vindhyachal': require('../../assets/images/shaktipeeth/vindhyavasini.webp'),
  'shaktipeeth-kamakhya-kanya-kumari-temple': require('../../assets/images/shaktipeeth/kanyakumari.webp'),
  'shaktipeeth-sharda-peeth-kashmir': require('../../assets/images/shaktipeeth/sharadapeeth.webp'),
  'shaktipeeth-hinglaj-devi-rajasthan': require('../../assets/images/shaktipeeth/hinglajmata.webp'),
  'shaktipeeth-tripora-sundari-temple-tripura': require('../../assets/images/shaktipeeth/tripurasundari.webp'),
  'shaktipeeth-attahas-temple-birbhum': require('../../assets/images/shaktipeeth/Attahas-Shaktipeeth.webp'),
  'shaktipeeth-bakreshwar-temple-birbhum': require('../../assets/images/shaktipeeth/Bakreswar.webp'),
  'shaktipeeth-nalateswari-temple-nalhati': require('../../assets/images/shaktipeeth/nalateswari.webp'),
  'shaktipeeth-jogadya-temple-burdwan': require('../../assets/images/shaktipeeth/jogadya.webp'),
  'shaktipeeth-kankalitala-temple-bolpur': require('../../assets/images/shaktipeeth/kankalitala.webp'),
  'shaktipeeth-bhavani-mandir-tuljapur': require('../../assets/images/shaktipeeth/tuljabhavani.webp'),
  'shaktipeeth-renuka-devi-temple-mahur': require('../../assets/images/shaktipeeth/renukadevi.webp'),
  'shaktipeeth-saptashrungi-temple-nashik': require('../../assets/images/shaktipeeth/saptashrungi.webp'),
  'shaktipeeth-danteshwari-temple-dantewada': require('../../assets/images/shaktipeeth/danteshwari.webp'),
  'shaktipeeth-chamunda-devi-temple-kangra': require('../../assets/images/shaktipeeth/Chamundatemple.webp'),
  'shaktipeeth-naina-devi-temple-bilaspur': require('../../assets/images/shaktipeeth/Nainadevi.webp'),
  'shaktipeeth-brareshwari-devi-temple-kangra': require('../../assets/images/shaktipeeth/brajeshwari.webp'),
  'shaktipeeth-chintpurni-devi-temple-una': require('../../assets/images/shaktipeeth/chintpurni.webp'),
  'shaktipeeth-alopi-devi-temple-prayagraj': require('../../assets/images/shaktipeeth/alopi-devi-mandir.webp'),
  'shaktipeeth-devi-patan-temple-balrampur': require('../../assets/images/shaktipeeth/devipatan.webp'),
  'shaktipeeth-harsiddhi-mata-temple-ujjain': require('../../assets/images/shaktipeeth/harsiddhi.webp'),
  'shaktipeeth-sharada-devi-temple-maihar': require('../../assets/images/shaktipeeth/maihardevi.webp'),
  'shaktipeeth-biraja-temple-jajpur': require('../../assets/images/shaktipeeth/biraja.webp'),
  'shaktipeeth-tara-tarini-temple-ganjam': require('../../assets/images/shaktipeeth/taratarini.webp'),

  // Healing Temples (from assets/images/healingtemple)
  'healing-ramanasramam-tiruvannamalai': require('../../assets/images/healingtemple/SriRamana.webp'),
  'healing-dhyanalinga-isha-coimbatore': require('../../assets/images/healingtemple/dhyanalinga.webp'),
  'healing-virupaksha-temple-hampi': require('../../assets/images/healingtemple/virupaksha.webp'),
  'healing-anandamayi-ma-ashram-haridwar': require('../../assets/images/healingtemple/AnandamayiAshram.png'),
  'hanuman-mehendipur-balaji-temple-dausa': require('../../assets/images/healingtemple/Mehandipurbalaji.webp'),
  'healing-parmarth-niketan-rishikesh': require('../../assets/images/healingtemple/ParmarthNiketan.webp'),
  'healing-sri-aurobindo-ashram-puducherry': require('../../assets/images/healingtemple/SriAurobindo.webp'),
  'sacred-belur-math-ramakrishna-mission': require('../../assets/images/healingtemple/BelurMath.webp'),
  'healing-sarnath-buddhist-monastery': require('../../assets/images/healingtemple/sarnathvaranasi.webp'),
  'sacred-mahabodhi-temple-bodh-gaya': require('../../assets/images/healingtemple/mahabodhi.webp'),
  'devi-kollur-mookambika-temple': require('../../assets/images/healingtemple/kollurmookambika.avif'),
  'devi-chottanikara-temple-kochi': require('../../assets/images/healingtemple/Chottanikkara.webp'),
  'sacred-vaitheeswaran-koil-mayiladuthurai': require('../../assets/images/healingtemple/Vaitheeswaran.webp'),
  'healing-parli-vaijnath-temple': require('../../assets/images/healingtemple/parliVajinath.webp'),
  'healing-dhanvantari-temple-kerala': require('../../assets/images/healingtemple/SriDhanvantari.webp'),
  'sacred-suchindram-thanumalayan-temple': require('../../assets/images/healingtemple/SuchindramThanumalay.webp'),
  'healing-ghati-subramanya-temple': require('../../assets/images/healingtemple/GhatiSubramanyaTemple.webp'),
  'panchbhoota-srikalahasteeswara-temple-srikalahasti': require('../../assets/images/healingtemple/Srikalahasteeswara.webp'),
  'sacred-kukke-subramanya-temple': require('../../assets/images/healingtemple/KukkeSubramanya.webp'),
  'healing-mangaladevi-temple-mangalore': require('../../assets/images/healingtemple/Mangaladevi.webp'),

  // Sacred Places & Shrines (from assets/images/sacred)
  'sacred-assi-ghat': require('../../assets/images/sacred/Assi_Ghat.jpg'),
  'sacred-bhalka-tirth-shrine': require('../../assets/images/sacred/BhalkaTirthShrine.jpeg'),
  'sacred-bhartrihari-caves': require('../../assets/images/sacred/Bhartrihari.jpg'),
  'sacred-daulatabad-fort': require('../../assets/images/sacred/Daulatabad.jpeg'),
  'sacred-ellora-kailasa-temple': require('../../assets/images/sacred/ElloraKailasa.jpeg'),
  'sacred-gautam-rishi-ashram': require('../../assets/images/sacred/GautamRishiAshram.jpeg'),
  'sacred-gyanvapi-kund': require('../../assets/images/sacred/Gyanvapi.jpg'),
  'sacred-manikarnika-ghat': require('../../assets/images/sacred/Manikarnika_Ghat.jpg'),
  'sacred-naulakha-mandir': require('../../assets/images/sacred/Naulakha.jpeg'),
  'sacred-sandipani-ashram': require('../../assets/images/sacred/SandipaniAshram.avif'),
  'sacred-shiva-trats-kund': require('../../assets/images/sacred/ShivaTrats.jpeg'),
  'sacred-sonprayag-sangam': require('../../assets/images/sacred/SonprayagSangam.jpeg'),
  'sacred-tapovan-caves': require('../../assets/images/sacred/Tapovancaves.jpeg'),
  'sacred-triveni-sangam-ghat': require('../../assets/images/sacred/Triveni-Ghat.webp'),
  'sacred-baan-stambh': require('../../assets/images/sacred/baan.jpeg'),
  'sacred-bhairavnath-mandir': require('../../assets/images/sacred/bhairavnath.jpg'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/sacred/dashashwamedh-ghat.jpeg'),
  'sacred-gandhi-sarovar': require('../../assets/images/sacred/gandhisarvor.avif'),
  'sacred-gita-mandir': require('../../assets/images/sacred/gitamandir.jpeg'),
  'sacred-ram-ghat': require('../../assets/images/sacred/ramghat.jpg'),
  'sacred-shivganga-kund': require('../../assets/images/sacred/shivganga.jpg'),
  'sacred-trikuta-parvat': require('../../assets/images/sacred/trikuta.jpg'),
  'sacred-vasuki-tal': require('../../assets/images/sacred/vasukital.jpg'),

  // Ashtavinayak Shrines
  'ashtavinayak-mayureshwar-temple-morgaon': require('../../assets/images/sacred/mayureshwar.webp'),
  'ashtavinayak-siddhivinayak-temple-siddhatek': require('../../assets/images/sacred/Siddhivinayak-Temple.jpg'),
  'ashtavinayak-ballaleshwar-temple-pali': require('../../assets/images/sacred/ballaleshwar.jpg'),
  'ashtavinayak-varadhavinayak-temple-mahad': require('../../assets/images/sacred/VaradVinayak.jpeg'),
  'ashtavinayak-chintamani-temple-theur': require('../../assets/images/sacred/chintamani.jpeg'),
  'ashtavinayak-girijatmak-temple-lenyadri': require('../../assets/images/sacred/Girijatmaj.webp'),
  'ashtavinayak-vighnahar-temple-ozar': require('../../assets/images/sacred/Vighnahar.jpg'),
  'ashtavinayak-mahaganapati-temple-ranjangaon': require('../../assets/images/sacred/Mahaganapati.jpeg'),

  // Panchbhoota Shrines
  'panchbhoota-ekambareswarar-temple-kanchipuram': require('../../assets/images/sacred/Ekambareshwar.jpeg'),
  'panchbhoota-jambukeswarar-temple-thiruvanaikaval': require('../../assets/images/sacred/jambukeswarar.jpeg'),
  'panchbhoota-arunachaleswarar-temple-thiruvannamalai': require('../../assets/images/sacred/Arunachaleswarar.jpeg'),
  'panchbhoota-thillai-nataraja-temple-chidambaram': require('../../assets/images/sacred/ThillaiNataraja.jpeg'),

  // Additional Sacred Temples in Sacred Folder
  'vishnu-bankey-bihari-temple-vrindavan': require('../../assets/images/sacred/Bankebihari_temple.jpg'),
  'other-brahma-temple-pushkar': require('../../assets/images/sacred/Brahma_Temple.jpg'),
  'other-brihadisvara-temple-thanjavur': require('../../assets/images/sacred/Brihadisvara.jpeg'),
  'other-dakshineswar-kali-temple-kolkata': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.jpg'),
  'other-dwarkadhish-temple-mathura': require('../../assets/images/sacred/DwarkadhishMathura.jpeg'),
  'other-govind-dev-ji-temple-jaipur': require('../../assets/images/sacred/GovindDev.jpg'),
  'other-guruvayur-temple-kerala': require('../../assets/images/sacred/Guruvayur.jpeg'),
  'other-jakhu-temple-shimla': require('../../assets/images/sacred/Jakhu.jpg'),
  'other-kalaram-temple-nashik': require('../../assets/images/sacred/Kalaram.jpeg'),
  'other-kashtabhanjan-dev-hanumanji-sarangpur': require('../../assets/images/sacred/Kashtabhanjan.jpg'),
  'other-khatu-shyam-ji-temple-sikar': require('../../assets/images/sacred/KhatuShyam.webp'),
  'other-lingaraj-temple-bhubaneswar': require('../../assets/images/sacred/Lingaraj.avif'),
  'other-murudeshwar-temple-karnataka': require('../../assets/images/sacred/Murudeshwara.jpg'),
  'other-neelkanth-mahadev-temple-rishikesh': require('../../assets/images/sacred/NeelKanth.jpeg'),
  'other-pashupatinath-temple-mandsaur': require('../../assets/images/sacred/Pashupatinath.jpg'),
  'other-prem-mandir-vrindavan': require('../../assets/images/sacred/Premmandir.jpeg'),
  'other-salasar-balaji-temple-churu': require('../../assets/images/sacred/SalasarBalaji.jpg'),
  'other-sankat-mochan-hanuman-temple-varanasi': require('../../assets/images/sacred/Sankatmochan.webp'),
  'other-shrinathji-temple-nathdwara': require('../../assets/images/sacred/Shreenathjitemple.avif'),
  'other-shree-ram-janmabhoomi-mandir-ayodhya': require('../../assets/images/sacred/Shri_Ram_Janambhoomi_Mandir.jpg'),
  'other-padmanabhaswamy-temple-thiruvananthapuram': require('../../assets/images/sacred/Sree_Padmanabhaswamy.jpg'),
  'other-sri-ranganathaswamy-temple-srirangam': require('../../assets/images/sacred/SriRanganathaswamy.jpeg'),
  'other-sun-temple-modhera': require('../../assets/images/sacred/SunTemple.jpg'),
  'other-triyuginarayan-temple-rudraprayag': require('../../assets/images/sacred/Triyuginarayan.jpg'),
  'other-tungnath-temple-chopta': require('../../assets/images/sacred/Tungnath.jpg'),
  'other-udupi-sri-krishna-matha': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.jpg'),
  'other-vithoba-temple-pandharpur': require('../../assets/images/sacred/Vithoba.jpg'),
  'other-hanuman-garhi-temple-ayodhya': require('../../assets/images/sacred/hanumangarhi.jpeg'),
  'other-iskcon-temple-vrindavan': require('../../assets/images/sacred/iskconVrindavan.jpeg'),
  'other-karni-mata-temple-deshnoke': require('../../assets/images/sacred/karnimata.jpg'),
  'other-shri-krishna-janmasthan-mathura': require('../../assets/images/sacred/krishnajanmasthan.jpeg'),
  'other-sabarimala-sree-dharma-sastha-temple': require('../../assets/images/sacred/sabarimala.avif'),
};

const DEFAULT_TEMPLE_IMAGE: ImageSourcePropType = require('../../assets/images/image temple/SomnathTemple.webp');

const TEMPLE_FALLBACK_POOL: ImageSourcePropType[] = [
  require('../../assets/images/image temple/SomnathTemple.webp'),
  require('../../assets/images/image temple/KedarnathTemple.webp'),
  require('../../assets/images/image temple/MahakalTemple.webp'),
  require('../../assets/images/image temple/Kashi_Vishwanath.webp'),
  require('../../assets/images/image temple/Siddhivinayak.webp'),
  require('../../assets/images/image temple/Tirumala_090615.webp'),
  require('../../assets/images/image temple/Jaganath.webp'),
  require('../../assets/images/image temple/GoldenTemple.webp'),
  require('../../assets/images/image temple/MeenakshiTemple.webp'),
  require('../../assets/images/dwarakadhish.webp'),
  require('../../assets/images/image temple/badrinath.webp'),
];

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
    const normKey = normalizeTempleName(key);
    if (normKey === normId || (normId.length > 5 && normId.includes(normKey))) {
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

  // Ashtavinayak & Ganesha Keyword Matching
  if (lowerName.includes('mayureshwar') || lowerName.includes('moreshwar') || lowerName.includes('morgaon')) return TEMPLE_IMAGES['ashtavinayak-mayureshwar-temple-morgaon'];
  if (lowerName.includes('siddhatek')) return TEMPLE_IMAGES['ashtavinayak-siddhivinayak-temple-siddhatek'];
  if (lowerName.includes('ballaleshwar') || lowerName.includes('pali')) return TEMPLE_IMAGES['ashtavinayak-ballaleshwar-temple-pali'];
  if (lowerName.includes('varadhavinayak') || lowerName.includes('mahad')) return TEMPLE_IMAGES['ashtavinayak-varadhavinayak-temple-mahad'];
  if (lowerName.includes('chintamani')) return TEMPLE_IMAGES['ashtavinayak-chintamani-temple-theur'];
  if (lowerName.includes('girijatmak') || lowerName.includes('lenyadri') || lowerName.includes('girijatmaj')) return TEMPLE_IMAGES['ashtavinayak-girijatmak-temple-lenyadri'];
  if (lowerName.includes('vighnahar') || lowerName.includes('ozar')) return TEMPLE_IMAGES['ashtavinayak-vighnahar-temple-ozar'];
  if (lowerName.includes('mahaganapati') || lowerName.includes('ranjangaon')) return TEMPLE_IMAGES['ashtavinayak-mahaganapati-temple-ranjangaon'];
  if (lowerName.includes('ashtavinayak')) return TEMPLE_IMAGES['other-siddhivinayak-temple-mumbai'];

  // Panchbhoota Shrines Keyword Matching
  if (lowerName.includes('ekambareswarar') || lowerName.includes('ekambareshwar')) return TEMPLE_IMAGES['panchbhoota-ekambareswarar-temple-kanchipuram'];
  if (lowerName.includes('jambukeswarar')) return TEMPLE_IMAGES['panchbhoota-jambukeswarar-temple-thiruvanaikaval'];
  if (lowerName.includes('arunachaleswarar')) return TEMPLE_IMAGES['panchbhoota-arunachaleswarar-temple-thiruvannamalai'];
  if (lowerName.includes('thillai nataraja') || lowerName.includes('chidambaram')) return TEMPLE_IMAGES['panchbhoota-thillai-nataraja-temple-chidambaram'];

  // Additional Sacred Shrines Keyword Matching
  if (lowerName.includes('bankey bihari') || lowerName.includes('banke bihari')) return TEMPLE_IMAGES['vishnu-bankey-bihari-temple-vrindavan'];
  if (lowerName.includes('brahma temple') || lowerName.includes('pushkar')) return TEMPLE_IMAGES['other-brahma-temple-pushkar'];
  if (lowerName.includes('brihadisvara') || lowerName.includes('thanjavur')) return TEMPLE_IMAGES['other-brihadisvara-temple-thanjavur'];
  if (lowerName.includes('dakshineswar')) return TEMPLE_IMAGES['other-dakshineswar-kali-temple-kolkata'];
  if (lowerName.includes('dwarkadhish') && lowerName.includes('mathura')) return TEMPLE_IMAGES['other-dwarkadhish-temple-mathura'];
  if (lowerName.includes('govind dev')) return TEMPLE_IMAGES['other-govind-dev-ji-temple-jaipur'];
  if (lowerName.includes('guruvayur')) return TEMPLE_IMAGES['other-guruvayur-temple-kerala'];
  if (lowerName.includes('jakhu') || lowerName.includes('jakhhoo')) return TEMPLE_IMAGES['other-jakhu-temple-shimla'];
  if (lowerName.includes('kalaram')) return TEMPLE_IMAGES['other-kalaram-temple-nashik'];
  if (lowerName.includes('kashtabhanjan') || lowerName.includes('sarangpur')) return TEMPLE_IMAGES['other-kashtabhanjan-dev-hanumanji-sarangpur'];
  if (lowerName.includes('khatu shyam')) return TEMPLE_IMAGES['other-khatu-shyam-ji-temple-sikar'];
  if (lowerName.includes('lingaraj')) return TEMPLE_IMAGES['other-lingaraj-temple-bhubaneswar'];
  if (lowerName.includes('murudeshwar')) return TEMPLE_IMAGES['other-murudeshwar-temple-karnataka'];
  if (lowerName.includes('neelkanth') || lowerName.includes('neel kanth')) return TEMPLE_IMAGES['other-neelkanth-mahadev-temple-rishikesh'];
  if (lowerName.includes('pashupatinath')) return TEMPLE_IMAGES['other-pashupatinath-temple-mandsaur'];
  if (lowerName.includes('prem mandir')) return TEMPLE_IMAGES['other-prem-mandir-vrindavan'];
  if (lowerName.includes('salasar balaji') || lowerName.includes('salasar')) return TEMPLE_IMAGES['other-salasar-balaji-temple-churu'];
  if (lowerName.includes('sankat mochan') || lowerName.includes('sankatmochan')) return TEMPLE_IMAGES['other-sankat-mochan-hanuman-temple-varanasi'];
  if (lowerName.includes('shrinathji') || lowerName.includes('nathdwara')) return TEMPLE_IMAGES['other-shrinathji-temple-nathdwara'];
  if (lowerName.includes('ram janmabhoomi') || lowerName.includes('ram mandir')) return TEMPLE_IMAGES['other-shree-ram-janmabhoomi-mandir-ayodhya'];
  if (lowerName.includes('padmanabhaswamy')) return TEMPLE_IMAGES['other-padmanabhaswamy-temple-thiruvananthapuram'];
  if (lowerName.includes('ranganathaswamy') || lowerName.includes('srirangam')) return TEMPLE_IMAGES['other-sri-ranganathaswamy-temple-srirangam'];
  if (lowerName.includes('sun temple') || lowerName.includes('modhera')) return TEMPLE_IMAGES['other-sun-temple-modhera'];
  if (lowerName.includes('triyuginarayan')) return TEMPLE_IMAGES['other-triyuginarayan-temple-rudraprayag'];
  if (lowerName.includes('tungnath')) return TEMPLE_IMAGES['other-tungnath-temple-chopta'];
  if (lowerName.includes('udupi')) return TEMPLE_IMAGES['other-udupi-sri-krishna-matha'];
  if (lowerName.includes('vithoba') || lowerName.includes('pandharpur')) return TEMPLE_IMAGES['other-vithoba-temple-pandharpur'];
  if (lowerName.includes('hanuman garhi') || lowerName.includes('hanumangarhi')) return TEMPLE_IMAGES['other-hanuman-garhi-temple-ayodhya'];
  if (lowerName.includes('karni mata')) return TEMPLE_IMAGES['other-karni-mata-temple-deshnoke'];
  if (lowerName.includes('krishna janmasthan') || lowerName.includes('janmasthan')) return TEMPLE_IMAGES['other-shri-krishna-janmasthan-mathura'];
  if (lowerName.includes('sabarimala')) return TEMPLE_IMAGES['other-sabarimala-sree-dharma-sastha-temple'];

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
  if (lowerName.includes('baan stambh') || (lowerName.includes('baan') && lowerName.includes('stambh'))) return TEMPLE_IMAGES['sacred-baan-stambh'];
  if (lowerName.includes('bhairavnath')) return TEMPLE_IMAGES['sacred-bhairavnath-mandir'];
  if (lowerName.includes('dashashwamedh')) return TEMPLE_IMAGES['sacred-dashashwamedh-ghat'];
  if (lowerName.includes('gandhi sarovar') || lowerName.includes('gandhisarovar')) return TEMPLE_IMAGES['sacred-gandhi-sarovar'];
  if (lowerName.includes('gita mandir') || lowerName.includes('geeta mandir')) return TEMPLE_IMAGES['sacred-gita-mandir'];
  if (lowerName.includes('ram ghat') || lowerName.includes('ramghat')) return TEMPLE_IMAGES['sacred-ram-ghat'];
  if (lowerName.includes('shivganga')) return TEMPLE_IMAGES['sacred-shivganga-kund'];
  if (lowerName.includes('trikuta') || lowerName.includes('trikut')) return TEMPLE_IMAGES['sacred-trikuta-parvat'];
  if (lowerName.includes('vasuki tal') || lowerName.includes('vasukital')) return TEMPLE_IMAGES['sacred-vasuki-tal'];

  const jyotirlingId = getTempleIdFromName(name, 'jyotirling');
  if (TEMPLE_IMAGES[jyotirlingId]) return TEMPLE_IMAGES[jyotirlingId];

  const otherId = getTempleIdFromName(name, 'other');
  if (TEMPLE_IMAGES[otherId]) return TEMPLE_IMAGES[otherId];

  const norm = normalizeTempleName(name);
  if (norm.length > 3) {
    for (const key of Object.keys(TEMPLE_IMAGES)) {
      if (key.includes(norm) || norm.includes(key.replace(/^(jyotirling|other|shaktipeeth|healing|sacred|ashtavinayak|panchbhoota|vishnu)-/, ''))) {
        return TEMPLE_IMAGES[key];
      }
    }
  }

  // Hash-based deterministic pool selection using dedicated TEMPLE images pool
  let hash = 0;
  for (let i = 0; i < lowerName.length; i++) {
    hash = (hash << 5) - hash + lowerName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TEMPLE_FALLBACK_POOL.length;
  return TEMPLE_FALLBACK_POOL[index] || DEFAULT_TEMPLE_IMAGE;
};

export { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE, getTempleImageById, getTempleImageByName };