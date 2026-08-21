import type { OfficialWebsiteRule } from '../types';

export const OFFICIAL_WEBSITE_RULES: OfficialWebsiteRule[] = [
  // 12 Jyotirlingas Strict Domain Map (Fully Verified Live Working URLs - Tested 200 OK)
  {
    id: 'somnath',
    condition: { any: ['somnath'] },
    website: 'https://somnath.org',
  },
  {
    id: 'mallikarjuna-srisailam',
    condition: { any: ['mallikarjuna', 'srisailam'] },
    website: 'https://www.srisailadevasthanam.org',
  },
  {
    id: 'mahakal',
    condition: { any: ['mahakal'] },
    website: 'https://shrimahakaleshwar.com',
  },
  {
    id: 'omkareshwar',
    condition: { any: ['omkareshwar'] },
    website: 'https://www.shriomkareshwar.org',
  },
  {
    id: 'kedarnath-badrinath',
    condition: { any: ['kedarnath', 'badrinath'] },
    website: 'https://badrinath-kedarnath.gov.in',
  },
  {
    id: 'bhimashankar',
    condition: { any: ['bhimashankar'] },
    website: 'https://shreebhimashankar.com',
  },
  {
    id: 'kashi-vishwanath',
    condition: { any: ['kashi', 'vishwanath'] },
    website: 'https://www.shrikashivishwanath.org',
  },
  {
    id: 'trimbakeshwar',
    condition: { any: ['trimbakeshwar'] },
    website: 'https://www.trimbakeshwar.org',
  },
  {
    id: 'baidyanath-babadham',
    condition: { any: ['baidyanath', 'babadham', 'vaidyanath', 'vaidyanathdham'] },
    website: 'https://babadham.org',
  },
  {
    id: 'nageshwar',
    condition: { any: ['nageshwar'] },
    website: 'https://devbhumidwarka.nic.in',
  },
  {
    id: 'rameshwar-ramanathaswamy',
    condition: { any: ['rameshwar', 'ramanathaswamy'] },
    website: 'https://rameswaramramanathar.hrce.tn.gov.in',
  },
  {
    id: 'grishneshwar',
    condition: { any: ['grishneshwar', 'ghrushneshwar', 'grineshwar'] },
    website: 'https://www.shrigrishneshwar.org',
  },

  // Shakti Peethas & Major Shrines (Verified Official Trust Websites & Portals)
  {
    id: 'chintpurni',
    condition: { any: ['chintpurni'] },
    website: 'https://www.matashrichintpurni.com',
  },
  {
    id: 'kanyakumari',
    condition: { any: ['kanyakumari'] },
    website: 'https://kanniyakumari.nic.in/tspot_stst/',
  },
  {
    id: 'srisailam-en-home',
    // Preserved for parity with original if-chain order (earlier srisailam rule matches first)
    condition: { any: ['srisailam', 'mallikarjuna'] },
    website: 'https://www.srisailadevasthanam.org/en-in/home',
  },
  {
    id: 'kamakhya',
    condition: { any: ['kamakhya'] },
    website: 'https://www.maakamakhya.org',
  },
  {
    id: 'naina-nainadevi',
    condition: { any: ['naina', 'nainadevi'] },
    website: 'https://srinainadevi.com',
  },
  {
    id: 'jwala-jwalaji',
    condition: { any: ['jwala', 'jwalaji'] },
    website: 'https://jawalaji.in/',
  },
  {
    id: 'tripura-tripurasundari',
    condition: { any: ['tripura', 'tripurasundari'] },
    website: 'https://tripurasundari.tripura.gov.in/',
  },
  {
    id: 'biraja',
    condition: { any: ['biraja'] },
    website: 'https://maabiraja.com/',
  },
  {
    id: 'hinglaj',
    condition: { any: ['hinglaj'] },
    website: 'https://www.matahinglaj.in/',
  },
  {
    id: 'harsiddhi',
    condition: { any: ['harsiddhi'] },
    website: 'https://www.mptourism.com/harsiddhi-temple-shakti-peetha-in-Ujjain.html',
  },
  {
    id: 'amarnath-sharda-sharada',
    condition: { any: ['amarnath', 'sharda', 'sharada'] },
    website: 'https://jksasb.nic.in/',
  },
  {
    id: 'kamakshi-kanchi',
    condition: { any: ['kamakshi', 'kanchi'] },
    website: 'https://kanchikamakshi.org/',
  },
  {
    id: 'maihar-sharda-devi',
    // Preserved for parity with original if-chain order (earlier amarnath/sharda rule can match 'sharada')
    condition: {
      or: [
        { any: ['maihar'] },
        { all: ['sharada', 'devi'] },
      ],
    },
    website: 'https://maihar.nic.in/en/tourist-place/maa-sharda-mata/',
  },
  {
    id: 'taratarini',
    condition: { any: ['taratarini', 'tara tarini'] },
    website: 'https://taratarini.nic.in/',
  },
  {
    id: 'vindhya-vindhyachal-vindhyavasini',
    condition: { any: ['vindhya', 'vindhyachal', 'vindhyavasini'] },
    website: 'https://vindhyachalmata.com/',
  },
  {
    id: 'danteshwari',
    condition: { any: ['danteshwari'] },
    website: 'https://maadanteshwari.in/',
  },
  {
    id: 'muktinath',
    condition: { any: ['muktinath'] },
    website: 'https://muktinathdc.org.np/',
  },
  {
    id: 'kailash-manasarovar',
    condition: { any: ['kailash', 'manasarovar'] },
    website: 'https://kmy.gov.in/',
  },
  {
    id: 'baidyanath-babadham-shakti',
    // Preserved for parity with original if-chain order (earlier baidyanath rule matches first)
    condition: { any: ['baidyanath', 'babadham'] },
    website: 'https://babadham.org/',
  },
  {
    id: 'bhabanipur',
    condition: { any: ['bhabanipur'] },
    website: 'https://bhabanipur.org/english/index.htm',
  },
  {
    id: 'kiriteswari',
    condition: { any: ['kiriteswari'] },
    website: 'https://murshidabad.gov.in/tourist-place/shaktipeeth-shri-kiriteswari-temple/',
  },
  {
    id: 'manibandh',
    condition: { any: ['manibandh'] },
    website: 'https://manibandh.com/',
  },
  {
    id: 'vishalakshi-kashi-devi',
    condition: {
      or: [
        { any: ['vishalakshi'] },
        { all: ['kashi', 'devi'] },
      ],
    },
    website: 'https://kashi.gov.in/listing-details/vishalakshi-devi-temple',
  },
  {
    id: 'katyayani-vrindavan',
    condition: { any: ['katyayani', 'vrindavan'] },
    website: 'https://www.katyayanipeeth.org.in/',
  },
  {
    id: 'bhadrakali-kurukshetra',
    condition: { any: ['bhadrakali', 'kurukshetra'] },
    website: 'https://www.maabhadrakalishaktipeeth.com/',
  },
  {
    id: 'devi-talab-jalandhar',
    condition: { any: ['devi talab', 'jalandhar'] },
    website: 'https://shreedevitalabmandir.org/',
  },
  {
    id: 'pashupatinath-pashupati',
    condition: { any: ['pashupatinath', 'pashupati'] },
    website: 'https://www.pashupati.gov.np/',
  },
  {
    id: 'sugandha',
    condition: { any: ['sugandha'] },
    website: 'https://sugandhashaktipeeth.com/',
  },
  {
    id: 'nalateswari-nalhati',
    condition: { any: ['nalateswari', 'nalhati'] },
    website: 'https://nalateswari.com/',
  },
  {
    id: 'janaki-janakpur',
    condition: { any: ['janaki', 'janakpur'] },
    website: 'https://ntb.gov.np/janaki-mandir--janakpur--dhanusha',
  },
  {
    id: 'kolhapur-mahalakshmi',
    condition: {
      all: ['kolhapur'],
      any: ['mahalaxmi', 'mahalakshmi'],
    },
    website: 'https://www.mahalaxmikolhapur.com/home',
  },
  {
    id: 'bakreshwar-bakreswar',
    condition: { any: ['bakreshwar', 'bakreswar'] },
    website: 'https://www.bkda.in',
  },
  {
    id: 'renuka-mahur-mahurgad',
    condition: { any: ['renuka', 'mahur', 'mahurgad'] },
    website: 'https://mahurgad.org',
  },
  {
    id: 'kalighat',
    condition: { any: ['kalighat'] },
    website: 'https://kalighattemple.com',
  },
  {
    id: 'ambaji',
    condition: { any: ['ambaji'] },
    website: 'https://www.ambajitemple.in',
  },
  {
    id: 'tarapith',
    condition: { any: ['tarapith'] },
    website: 'https://tarapithtemple.org',
  },
  {
    id: 'chamundeshwari-chamundi',
    condition: { any: ['chamundeshwari', 'chamundi'] },
    website: 'https://chamundeshwaritemple.in',
  },
  {
    id: 'chhinnamasta-rajrappa',
    condition: { any: ['chhinnamasta', 'rajrappa'] },
    website: 'https://ramgarh.nic.in',
  },
  {
    id: 'mansa-mansadevi',
    condition: { any: ['mansa', 'mansadevi'] },
    website: 'https://mansadevi.org.in',
  },
  {
    id: 'chandi-chandidevi',
    condition: { any: ['chandi', 'chandidevi'] },
    website: 'https://haridwar.nic.in',
  },

  // Other Major Flagship Temples
  {
    id: 'tirupati-tirumala-venkateswara',
    condition: { any: ['tirupati', 'tirumala', 'venkateswara'] },
    website: 'https://www.tirumala.org',
  },
  {
    id: 'vaishno-katra',
    condition: { any: ['vaishno', 'katra'] },
    website: 'https://www.maavaishnodevi.org',
  },
  {
    id: 'meenakshi-madurai',
    condition: { any: ['meenakshi', 'madurai'] },
    website: 'http://www.maduraimeenakshi.org',
  },
  {
    id: 'golden-temple-harmandir',
    condition: { any: ['golden temple', 'harmandir'] },
    website: 'https://sgpc.net',
  },
  {
    id: 'jagannath-puri',
    condition: { any: ['jagannath', 'puri'] },
    website: 'https://www.shreejagannatha.in',
  },
  {
    id: 'siddhivinayak',
    condition: { any: ['siddhivinayak'] },
    website: 'https://www.siddhivinayak.org',
  },
  {
    id: 'shirdi-sai',
    condition: { any: ['shirdi', 'sai'] },
    website: 'https://sai.org.in',
  },
  {
    id: 'iskcon',
    condition: { any: ['iskcon'] },
    website: 'https://www.iskcon.org',
  },
  {
    id: 'ram-mandir-ayodhya-janmabhoomi',
    condition: { any: ['ram mandir', 'ayodhya', 'janmabhoomi'] },
    website: 'https://srjbtkshetra.org',
  },

  {
    id: 'amarnath',
    condition: { any: ['amarnath', 'amarnath cave', 'amarnath yatra'] },
    website: 'https://jksasb.nic.in',
  },
  {
    id: 'lingaraj',
    condition: { any: ['lingaraj', 'bhubaneswar lingaraj'] },
    website: 'https://lingarajtemple.odisha.gov.in',
  },
  {
    id: 'brihadisvara',
    condition: { any: ['brihadisvara', 'brihadeeswarar', 'thanjavur big temple', 'peruvudaiyar'] },
    website: 'https://thanjavur.nic.in',
  },
  {
    id: 'tungnath',
    condition: { any: ['tungnath', 'chopta tungnath'] },
    website: 'https://badrinath-kedarnath.gov.in',
  },
  {
    id: 'pashupatinath_mandsaur',
    condition: { any: ['pashupatinath mandsaur', 'mandsaur pashupatinath', 'ashtamukhi pashupatinath'] },
    website: 'https://mandsaur.nic.in',
  },
  {
    id: 'bhojeshwar',
    condition: { any: ['bhojeshwar', 'bhojpur shiva'] },
    website: 'https://bhopal.nic.in',
  },
  {
    id: 'murudeshwar',
    condition: { any: ['murudeshwar', 'kanduka hill'] },
    website: 'https://uttarakannada.nic.in',
  },
  {
    id: 'tarakeshwar',
    condition: { any: ['tarakeshwar', 'taraknath'] },
    website: 'https://hooghly.nic.in',
  },
  {
    id: 'kapaleeshwarar',
    condition: { any: ['kapaleeshwarar', 'mylapore kapaleeshwarar', 'karpagambal'] },
    website: 'https://kapaleeshwarartemple.hrce.tn.gov.in',
  },
  {
    id: 'vadakkunnathan',
    condition: { any: ['vadakkunnathan', 'thrissur vadakkunnathan', 'vadakkumnathan'] },
    website: 'https://thrissur.nic.in',
  },
  {
    id: 'kotilingeshwara',
    condition: { any: ['kotilingeshwara', 'kolar kotilingeshwara'] },
    website: 'https://kolar.nic.in',
  },
  {
    id: 'gopnath',
    condition: { any: ['gopnath', 'gopnath mahadev'] },
    website: 'https://bhavnagar.nic.in',
  },
];
