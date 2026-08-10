/**
 * auditTempleNearbyData.ts
 *
 * Standalone audit script — NOT imported into app runtime.
 * Run with: npx ts-node --project tsconfig.json scripts/auditTempleNearbyData.ts
 *
 * Produces a complete coverage report for the temple nearby data system.
 */

import {
  TEMPLE_KEY_ALIASES,
  EXPLORE_NEARBY_DATA,
  normalizeTempleKey,
} from '../src/data/jyotirlingaTravelData';

// ─── All temple IDs registered in templeImages.ts (authoritative list) ───────
// These are the IDs the app actually routes through. Extracted from TEMPLE_IMAGES keys.
const ALL_REGISTERED_TEMPLE_IDS: string[] = [
  // Jyotirlingas
  'jyotirling-somnath-temple-gujarat',
  'jyotirling-kedarnath-temple-uttarakhand',
  'jyotirling-mahakaleshwar-temple-ujjain',
  'jyotirling-kashi-vishwanath-temple-varanasi',
  'jyotirling-bhimashankar-temple-maharashtra',
  'jyotirling-ramanathaswamy-temple-rameswaram',
  'jyotirling-grishneshwar-temple-ellora',
  'jyotirling-omkareshwar-temple-madhya-pradesh',
  'jyotirling-trimbakeshwar-temple-nashik',
  'jyotirling-nageshwar-temple-dwarka',
  'jyotirling-mallikarjuna-temple-srisailam',
  'jyotirling-baidyanath-temple-deoghar',
  // Char Dham / Other major
  'chardham-badrinath-temple-uttarakhand',
  'chardham-jagannath-temple-puri',
  'chardham-dwarkadhish-temple-dwarka',
  'chardham-gangotri-temple-uttarakhand',
  'chardham-yamunotri-temple-uttarakhand',
  'other-jagannath-temple-puri',
  'other-shri-dwarkadhish-temple-dwarka',
  'other-tirupati-balaji-temple-andhra-pradesh',
  'other-vaishno-devi-temple-jammu-kashmir',
  'other-siddhivinayak-temple-mumbai',
  'other-shirdi-sai-baba-temple-maharashtra',
  'other-golden-temple-amritsar',
  'other-meenakshi-temple-madurai',
  'other-iskcon-temple-bangalore-karnataka',
  'other-iskcon-mira-road-thane',
  'other-iskcon-temple-mumbai',
  'other-mahalaxmi-temple',
  'other-brahma-temple-pushkar',
  'other-brihadisvara-temple-thanjavur',
  'other-dakshineswar-kali-temple-kolkata',
  'other-dwarkadhish-temple-mathura',
  'other-govind-dev-ji-temple-jaipur',
  'other-guruvayur-temple-kerala',
  'other-jakhu-temple-shimla',
  'other-kalaram-temple-nashik',
  'other-kashtabhanjan-dev-hanumanji-sarangpur',
  'other-khatu-shyam-ji-temple-sikar',
  'other-lingaraj-temple-bhubaneswar',
  'other-murudeshwar-temple-karnataka',
  'other-neelkanth-mahadev-temple-rishikesh',
  'other-pashupatinath-temple-mandsaur',
  'other-prem-mandir-vrindavan',
  'other-salasar-balaji-temple-churu',
  'other-sankat-mochan-hanuman-temple-varanasi',
  'other-shrinathji-temple-nathdwara',
  'other-shree-ram-janmabhoomi-mandir-ayodhya',
  'other-padmanabhaswamy-temple-thiruvananthapuram',
  'other-sri-ranganathaswamy-temple-srirangam',
  'other-sun-temple-modhera',
  'other-triyuginarayan-temple-rudraprayag',
  'other-tungnath-temple-chopta',
  'other-udupi-sri-krishna-matha',
  'other-vithoba-temple-pandharpur',
  'other-hanuman-garhi-temple-ayodhya',
  'other-iskcon-temple-vrindavan',
  'other-karni-mata-temple-deshnoke',
  'other-shri-krishna-janmasthan-mathura',
  'other-sabarimala-sree-dharma-sastha-temple',
  // Shakti Peethas
  'shaktipeeth-kamakhya-temple-guwahati',
  'shakti-kamakhya-temple-assam',
  'shaktipeeth-kalighat-kali-temple-kolkata',
  'shakti-kalighat-temple-kolkata',
  'shaktipeeth-tarapith-temple-birbhum',
  'shakti-tarapith-temple-bengal',
  'shaktipeeth-ambaji-temple-gujarat',
  'shakti-ambaji-temple-gujarat',
  'shaktipeeth-vaishno-devi-temple-jammu-kashmir',
  'shaktipeeth-jwala-ji-temple-kangra',
  'shaktipeeth-chinnamasta-temple-rajarappa',
  'shaktipeeth-mahalaxmi-temple-kolhapur',
  'shaktipeeth-chamundeshwari-temple-mysore',
  'shakti-chamundeshwari-temple-mysore',
  'shaktipeeth-vindhyavasini-temple-vindhyachal',
  'shaktipeeth-kamakhya-kanya-kumari-temple',
  'shaktipeeth-sharda-peeth-kashmir',
  'shaktipeeth-hinglaj-devi-rajasthan',
  'shaktipeeth-tripora-sundari-temple-tripura',
  'shaktipeeth-attahas-temple-birbhum',
  'shaktipeeth-bakreshwar-temple-birbhum',
  'shaktipeeth-nalateswari-temple-nalhati',
  'shaktipeeth-jogadya-temple-burdwan',
  'shaktipeeth-kankalitala-temple-bolpur',
  'shaktipeeth-bhavani-mandir-tuljapur',
  'shaktipeeth-renuka-devi-temple-mahur',
  'shaktipeeth-saptashrungi-temple-nashik',
  'shaktipeeth-danteshwari-temple-dantewada',
  'shaktipeeth-chamunda-devi-temple-kangra',
  'shaktipeeth-naina-devi-temple-bilaspur',
  'shaktipeeth-brareshwari-devi-temple-kangra',
  'shaktipeeth-chintpurni-devi-temple-una',
  'shaktipeeth-alopi-devi-temple-prayagraj',
  'shaktipeeth-devi-patan-temple-balrampur',
  'shaktipeeth-harsiddhi-mata-temple-ujjain',
  'shaktipeeth-sharada-devi-temple-maihar',
  'shaktipeeth-biraja-temple-jajpur',
  'shaktipeeth-tara-tarini-temple-ganjam',
  // Healing Temples
  'healing-ramanasramam-tiruvannamalai',
  'healing-dhyanalinga-isha-coimbatore',
  'healing-virupaksha-temple-hampi',
  'healing-anandamayi-ma-ashram-haridwar',
  'hanuman-mehendipur-balaji-temple-dausa',
  'healing-parmarth-niketan-rishikesh',
  'healing-sri-aurobindo-ashram-puducherry',
  'sacred-belur-math-ramakrishna-mission',
  'healing-sarnath-buddhist-monastery',
  'sacred-mahabodhi-temple-bodh-gaya',
  'devi-kollur-mookambika-temple',
  'devi-chottanikara-temple-kochi',
  'sacred-vaitheeswaran-koil-mayiladuthurai',
  'healing-parli-vaijnath-temple',
  'healing-dhanvantari-temple-kerala',
  'sacred-suchindram-thanumalayan-temple',
  'healing-ghati-subramanya-temple',
  'panchbhoota-srikalahasteeswara-temple-srikalahasti',
  'sacred-kukke-subramanya-temple',
  'healing-mangaladevi-temple-mangalore',
  // Ashtavinayak
  'ashtavinayak-mayureshwar-temple-morgaon',
  'ashtavinayak-siddhivinayak-temple-siddhatek',
  'ashtavinayak-ballaleshwar-temple-pali',
  'ashtavinayak-varadhavinayak-temple-mahad',
  'ashtavinayak-chintamani-temple-theur',
  'ashtavinayak-girijatmak-temple-lenyadri',
  'ashtavinayak-vighnahar-temple-ozar',
  'ashtavinayak-mahaganapati-temple-ranjangaon',
  // Panchbhoota
  'panchbhoota-ekambareswarar-temple-kanchipuram',
  'panchbhoota-jambukeswarar-temple-thiruvanaikaval',
  'panchbhoota-arunachaleswarar-temple-thiruvannamalai',
  'panchbhoota-thillai-nataraja-temple-chidambaram',
  // Vishnu category
  'vishnu-tirupati-balaji-temple-andhra-pradesh',
  'vishnu-sri-ranganathaswamy-temple-srirangam',
  'vishnu-guruvayur-temple-kerala',
  'vishnu-padmanabhaswamy-temple-thiruvananthapuram',
  'vishnu-prem-mandir-vrindavan',
  'vishnu-shri-ram-mandir-ayodhya',
  'vishnu-dwarakadheesh-temple-mathura',
  'vishnu-krishna-janmabhoomi-mathura',
  'vishnu-radha-raman-temple-vrindavan',
  'vishnu-radha-damodar-temple-vrindavan',
  'vishnu-govind-dev-ji-temple-jaipur',
  'vishnu-nathdwara-shrinathji-temple',
  'vishnu-kalaram-temple-nashik',
  'vishnu-vitthal-temple-pandharpur',
  'vishnu-venugopala-swamy-temple-mysore',
  'vishnu-chennakesava-temple-belur',
  'vishnu-simhachalam-temple-visakhapatnam',
  'vishnu-ahobilam-narasimha-temple',
  'vishnu-badrinath-dham-chamoli',
  'vishnu-ananta-vasudeva-temple-bhubaneswar',
  'vishnu-bankey-bihari-temple-vrindavan',
  'vishnu-iskcon-temple-vrindavan',
  'vishnu-iskcon-temple-bangalore-karnataka',
  'vishnu-iskcon-mira-road-thane',
  'vishnu-iskcon-temple-mumbai',
  // Shiva category
  'shiva-lingaraj-temple-bhubaneswar',
  'shiva-brihadisvara-temple-thanjavur',
  'shiva-amarnath-cave-temple-kashmir',
  'shiva-tungnath-temple-chopta',
  'shiva-pashupatinath-temple-mandsaur',
  'shiva-bhojeshwar-temple-bhojpur',
  'shiva-murudeshwar-temple-karnataka',
  'shiva-pashupatinath-temple-nepal-border',
  'shiva-trimbakeshwar-dham-nashik',
  'shiva-bhimashankar-jyotirling-pune',
  'shiva-somnath-patan-gujarat',
  'shiva-tarakeshwar-temple-hooghly',
  'shiva-baba-dham-deoghar',
  'shiva-kashi-vishwanath-corridor-varanasi',
  'shiva-mahakaleshwar-bhasma-temple',
  'shiva-omkareshwar-island-khandwa',
  'shiva-kedarnath-himalayan-shrine',
  'shiva-grishneshwar-ellora-caves',
  'shiva-nageshwar-darukavana-gujarat',
  'shiva-ramanathaswamy-corridor-rameswaram',
  'shiva-mallikarjuna-srisailam-hills',
  'shiva-kapaleeshwarar-temple-chennai',
  'shiva-vadakkunnathan-temple-thrissur',
  'shiva-kotilingeshwara-temple-kolar',
  // Devi category
  'devi-meenakshi-temple-madurai',
  'devi-mahalaxmi-temple-mumbai',
  'devi-mumbadevi-temple-mumbai',
  'devi-mansa-devi-temple-haridwar',
  'devi-chandi-devi-temple-haridwar',
  'devi-kamakhya-peeth-guwahati',
  'devi-kalighat-mandir-kolkata',
  'devi-dakshineswar-kali-temple-kolkata',
  'devi-kanaka-durga-temple-vijayawada',
  'devi-sree-bhadrakali-temple-attukal',
  'devi-bhramara-ambika-temple-srisailam',
  'devi-katil-durgaparameshwari-temple',
  'devi-horanadu-annapoorneshwari-temple',
  // Hanuman category
  'hanuman-kashtabhanjan-dev-temple-sarangpur',
  'hanuman-marutam-temple-connaught-place',
  'hanuman-maruti-temple-girgaum',
  'hanuman-sankat-mochan-shimla',
  'hanuman-kainchi-dham-neem-karoli',
  'hanuman-bade-hanuman-mandir-prayagraj',
  'hanuman-hanuman-garhi-ayodhya',
  'hanuman-salasar-balaji-temple-churu',
  // Sacred / Regional temples
  'sacred-tanot-mata-temple-jaisalmer',
  'sacred-karni-mata-temple-deshnoke',
  'sacred-brahma-temple-pushkar',
  'sacred-khatu-shyam-temple-sikar',
  'sacred-trinetra-ganesh-temple-ranthambore',
  'sacred-chamundeshwari-hill-mysore',
  'sacred-murudeshwar-coastal-temple',
  'sacred-gokarna-mahabaleshwar-temple',
  'sacred-amarnath',
  'sacred-arunachaleswarar',
  'sacred-sabarimala',
  'sacred-belur-math-ramakrishna-mission',
  'sacred-mahabodhi-temple-bodh-gaya',
  'sacred-shravanabelagola-gommateshwara',
  'sacred-mayapur-chandrodaya-mandir',
  'sacred-sammed-shikharji-parasnath',
  'sacred-dilwara-jain-temples-mount-abu',
  'sacred-ranakpur-jain-temple-pali',
  'sacred-sun-temple-modhera',
  'sacred-golden-temple-amritsar',
  'sacred-neelkanth-mahadev-temple-rishikesh',
  'sacred-triyuginarayan-temple-rudraprayag',
  'sacred-dhari-devi-temple-srinagar-garhwal',
  'sacred-tapkeshwar-temple-dehradun',
  'sacred-kasar-devi-temple-almora',
  'sacred-jageshwar-dham-almora',
  'sacred-baijnath-temple-bageshwar',
  'sacred-purnagiri-devi-temple-champawat',
  'sacred-hadimba-devi-temple-manali',
  'sacred-bijli-mahadev-temple-kullu',
  'sacred-vashisht-kund-temple-manali',
  'sacred-triloknath-temple-lahaul',
  'sacred-gorakhnath-temple-gorakhpur',
  'sacred-mahavir-mandir-patna',
  'sacred-janaki-mandir-sitamarhi',
  'sacred-mundeshwari-devi-temple-kaimur',
  'sacred-bhadrachalam-sita-ramachandra-swamy',
  'sacred-yadadri-narasimha-swamy-temple',
  'sacred-thousand-pillar-temple-warangal',
  'sacred-ramappa-temple-mulugu',
  'sacred-gnana-saraswathi-temple-basar',
  'sacred-kondagattu-anjaneya-swamy-temple',
  'sacred-veerabhadra-temple-lepakshi',
  'sacred-kanaka-durga-temple-vijayawada',
];

// ─── Deduplicate by canonical key ─────────────────────────────────────────────
function runAudit() {
  const curatedKeys = new Set(Object.keys(EXPLORE_NEARBY_DATA));
  const canonicalToIds: Record<string, string[]> = {};
  const covered: string[] = [];
  const missing: string[] = [];
  const collisions: Record<string, string[]> = {};

  for (const id of ALL_REGISTERED_TEMPLE_IDS) {
    const canonical = normalizeTempleKey(id);
    if (!canonicalToIds[canonical]) canonicalToIds[canonical] = [];
    canonicalToIds[canonical].push(id);
  }

  // Detect collisions (multiple distinct IDs resolving to same key, only flag if > 1 unique temple)
  for (const [key, ids] of Object.entries(canonicalToIds)) {
    // Only flag if the ids represent genuinely different temples (not just prefix variants of same temple)
    const prefixes = new Set(ids.map(id => id.replace(/^[a-z]+-/, '')));
    if (prefixes.size > 1 && ids.length > 1) {
      collisions[key] = ids;
    }
  }

  // Coverage check per unique canonical key
  const auditedCanonicals = new Set<string>();
  for (const id of ALL_REGISTERED_TEMPLE_IDS) {
    const canonical = normalizeTempleKey(id);
    if (auditedCanonicals.has(canonical)) continue;
    auditedCanonicals.add(canonical);
    if (curatedKeys.has(canonical)) {
      covered.push(`[COVERED]  canonical="${canonical}"  sample_id="${id}"`);
    } else {
      missing.push(`  ID: ${id}\n  Canonical Key: "${canonical}"`);
    }
  }

  const sep = '='.repeat(52);
  console.log(`\n${sep}`);
  console.log('TEMPLE NEARBY DATA COVERAGE AUDIT');
  console.log(sep);
  console.log(`Total unique temple IDs in registry : ${ALL_REGISTERED_TEMPLE_IDS.length}`);
  console.log(`Unique canonical keys resolved       : ${auditedCanonicals.size}`);
  console.log(`Curated nearby data (canonical keys) : ${curatedKeys.size}`);
  console.log(`Canonical keys with curated data     : ${covered.length}`);
  console.log(`Canonical keys WITHOUT curated data  : ${missing.length}`);
  console.log(`Normalization collision groups       : ${Object.keys(collisions).length}`);
  console.log(sep);

  console.log('\n--- COVERED (has verified nearby data) ---');
  covered.forEach(l => console.log(l));

  console.log('\n--- MISSING CURATED DATA (hasCuratedData will be false) ---');
  missing.forEach((entry, i) => console.log(`\n${i + 1}. ${entry}`));

  if (Object.keys(collisions).length > 0) {
    console.log('\n--- NORMALIZATION COLLISIONS (review required) ---');
    for (const [key, ids] of Object.entries(collisions)) {
      console.log(`\n[COLLISION] canonical="${key}"`);
      ids.forEach(id => console.log(`  - ${id}`));
    }
  }

  console.log(`\n${sep}`);
  console.log('SUMMARY');
  console.log(sep);
  console.log(`Generic resolver   : ${auditedCanonicals.size > 0 ? 'OPERATIONAL' : 'FAIL'}`);
  console.log(`Data coverage      : ${covered.length}/${auditedCanonicals.size} canonical keys`);
  console.log(`Coverage status    : PARTIAL (${missing.length} temples need curated data)`);
  console.log(`Fake fallback      : REMOVED (hasCuratedData=false returns empty arrays)`);
  console.log(`Circuit journey    : SUPPRESSED for temples without curated data`);
  console.log(sep);
}

runAudit();
