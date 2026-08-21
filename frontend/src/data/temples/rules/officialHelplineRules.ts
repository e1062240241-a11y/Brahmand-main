import type { OfficialHelplineRule } from '../types';

export const OFFICIAL_HELPLINE_RULES: OfficialHelplineRule[] = [
  // Shakti Peethas & Major Shrines Helplines
  {
    id: 'chintpurni',
    condition: { any: ['chintpurni'] },
    helpline: '+91 1976 255 818',
  },
  {
    id: 'kanyakumari',
    condition: { any: ['kanyakumari'] },
    helpline: '+91 4652 241 421 / +91 4652 246 223',
  },
  {
    id: 'srisailam-mallikarjuna',
    condition: { any: ['srisailam', 'mallikarjuna'] },
    helpline: '+91 85242 88888',
  },
  {
    id: 'kamakhya',
    condition: { any: ['kamakhya'] },
    helpline: '+91 361 273 4654',
  },
  {
    id: 'naina-nainadevi',
    condition: { any: ['naina', 'nainadevi'] },
    helpline: '+91 1800 180 8069 (Toll Free)',
  },
  {
    id: 'jwala-jwalaji',
    condition: { any: ['jwala', 'jwalaji'] },
    helpline: '+91 1970 222 28',
  },
  {
    id: 'tripura-tripurasundari',
    condition: { any: ['tripura', 'tripurasundari'] },
    helpline: '+91 3821 223 520',
  },
  {
    id: 'biraja',
    condition: { any: ['biraja'] },
    helpline: '+91 6728 223 900',
  },
  {
    id: 'amarnath-sharda',
    condition: { any: ['amarnath', 'sharda'] },
    helpline: '+91 194 231 3149',
  },
  {
    id: 'kamakshi-kanchi',
    condition: { any: ['kamakshi', 'kanchi'] },
    helpline: '+91 44 2722 2609',
  },
  {
    id: 'taratarini',
    condition: { any: ['taratarini', 'tara tarini'] },
    helpline: '+91 680 228 1456',
  },
  {
    id: 'danteshwari',
    condition: { any: ['danteshwari'] },
    helpline: '+91 83606 01008',
  },
  {
    id: 'baidyanath-babadham',
    condition: { any: ['baidyanath', 'babadham'] },
    helpline: '+91 6432 232 295',
  },
  {
    id: 'manibandh',
    condition: { any: ['manibandh'] },
    helpline: '+91 94602 14919',
  },
  {
    id: 'attahas-fullara',
    condition: { any: ['attahas', 'fullara'] },
    helpline: '+91 94343 48482',
  },
  {
    id: 'katyayani-vrindavan',
    condition: { any: ['katyayani', 'vrindavan'] },
    helpline: '+91 73009 28885',
  },
  {
    id: 'bhadrakali-kurukshetra',
    condition: { any: ['bhadrakali', 'kurukshetra'] },
    helpline: '+91 85709 91111',
  },
  {
    id: 'devi-talab-jalandhar',
    condition: { any: ['devi talab', 'jalandhar'] },
    helpline: '+91 181 229 1252',
  },
  {
    id: 'kankalitala',
    condition: { any: ['kankalitala'] },
    helpline: '+91 98306 66215',
  },
  {
    id: 'nalateswari-nalhati',
    condition: { any: ['nalateswari', 'nalhati'] },
    helpline: '+91 3465 255 333',
  },
  {
    id: 'kolhapur-mahalakshmi',
    condition: {
      all: ['kolhapur'],
      any: ['mahalaxmi', 'mahalakshmi'],
    },
    helpline: '+91 231 262 3011',
  },

  // 12 Jyotirlingas Helpline Map
  {
    id: 'somnath',
    condition: { any: ['somnath'] },
    helpline: '02876-231212 / +91 94282 14914 / 94282 14993',
  },
  {
    id: 'mahakal',
    condition: { any: ['mahakal'] },
    helpline: '1800 233 1008 / 0734-2550563',
  },
  {
    id: 'omkareshwar',
    condition: { any: ['omkareshwar'] },
    helpline: '07280-271228 / +91-8989998686',
  },
  {
    id: 'kedarnath',
    condition: { any: ['kedarnath'] },
    helpline: '+91-8534001008 / +91-7302257116 (BKTC)',
  },
  {
    id: 'badrinath',
    condition: { any: ['badrinath'] },
    helpline: '+91-8979001008 / +91-7302257116 (BKTC)',
  },
  {
    id: 'bhimashankar',
    condition: { any: ['bhimashankar'] },
    helpline: '02135-222880 / 02133-284222',
  },
  {
    id: 'kashi-vishwanath',
    condition: { any: ['kashi', 'vishwanath'] },
    helpline: '+91 70802 92930 / +91 6393 131 608',
  },
  {
    id: 'trimbakeshwar',
    condition: { any: ['trimbakeshwar'] },
    helpline: '02594-233215 / 02594-234251',
  },
  {
    id: 'nageshwar',
    condition: { any: ['nageshwar'] },
    helpline: '+91-2869-286234',
  },
  {
    id: 'rameshwar-ramanathaswamy',
    condition: { any: ['rameshwar', 'ramanathaswamy'] },
    helpline: '0453-221223 / 0453-221230',
  },
  {
    id: 'grishneshwar-ghrushneshwar',
    condition: { any: ['grishneshwar', 'ghrushneshwar'] },
    helpline: '02437-243555',
  },

  // Other Major Flagship Temples
  {
    id: 'tirupati-tirumala-venkateswara',
    condition: { any: ['tirupati', 'tirumala', 'venkateswara'] },
    helpline: '155257 (Toll-Free) / 0877-2233333',
  },
  {
    id: 'vaishno-katra',
    condition: { any: ['vaishno', 'katra'] },
    helpline: '1800-180-7212 (Toll-Free) / 01991-234804',
  },
  {
    id: 'meenakshi-madurai',
    condition: { any: ['meenakshi', 'madurai'] },
    helpline: '0452-2344360 / 0452-2349868',
  },
  {
    id: 'golden-temple-harmandir',
    condition: { any: ['golden temple', 'harmandir'] },
    helpline: '0183-2553957 / 0183-2553958',
  },
  {
    id: 'jagannath-puri',
    condition: { any: ['jagannath', 'puri'] },
    helpline: '06752-222002',
  },
  {
    id: 'siddhivinayak',
    condition: { any: ['siddhivinayak'] },
    helpline: '022-24222072 / 022-24373626',
  },
  {
    id: 'shirdi-sai',
    condition: { any: ['shirdi', 'sai'] },
    helpline: '02423-265500',
  },
  {
    id: 'ram-mandir-ayodhya',
    condition: { any: ['ram mandir', 'ayodhya'] },
    helpline: '1800 180 5533',
  },

  {
    id: 'amarnath',
    condition: { any: ['amarnath', 'amarnath cave', 'amarnath yatra'] },
    helpline: '1800-180-7198 / 0191-2478991',
  },
  {
    id: 'lingaraj',
    condition: { any: ['lingaraj', 'bhubaneswar lingaraj'] },
    helpline: '0674-2430006',
  },
  {
    id: 'brihadisvara',
    condition: { any: ['brihadisvara', 'brihadeeswarar', 'thanjavur big temple', 'peruvudaiyar'] },
    helpline: '04362-230131',
  },
  {
    id: 'tungnath',
    condition: { any: ['tungnath', 'chopta tungnath'] },
    helpline: '01372-252187',
  },
  {
    id: 'pashupatinath_mandsaur',
    condition: { any: ['pashupatinath mandsaur', 'mandsaur pashupatinath', 'ashtamukhi pashupatinath'] },
    helpline: '07422-242201',
  },
  {
    id: 'bhojeshwar',
    condition: { any: ['bhojeshwar', 'bhojpur shiva'] },
    helpline: '0755-2661558',
  },
  {
    id: 'murudeshwar',
    condition: { any: ['murudeshwar', 'kanduka hill'] },
    helpline: '08385-268572',
  },
  {
    id: 'tarakeshwar',
    condition: { any: ['tarakeshwar', 'taraknath'] },
    helpline: '033-26382021',
  },
  {
    id: 'kapaleeshwarar',
    condition: { any: ['kapaleeshwarar', 'mylapore kapaleeshwarar', 'karpagambal'] },
    helpline: '044-24641670',
  },
  {
    id: 'vadakkunnathan',
    condition: { any: ['vadakkunnathan', 'thrissur vadakkunnathan', 'vadakkumnathan'] },
    helpline: '0487-2424108',
  },
  {
    id: 'kotilingeshwara',
    condition: { any: ['kotilingeshwara', 'kolar kotilingeshwara'] },
    helpline: '08153-267555',
  },
  {
    id: 'gopnath',
    condition: { any: ['gopnath', 'gopnath mahadev'] },
    helpline: '0278-2521000',
  },
  {
    id: 'kainchi_dham',
    condition: { any: ['kainchi dham', 'neem karoli baba ashram', 'kainchi ashram', 'neem karoli baba'] },
    helpline: '+91 5942 281 028',
  },
  {
    id: 'prasanthi_nilayam',
    condition: { any: ['prasanthi nilayam', 'sathya sai baba ashram', 'puttaparthi ashram', 'puttaparthi sai baba'] },
    helpline: '+91 8555 287 194 / +91 8555 287 236',
  },
  {
    id: 'swaminarayan_akshardham_delhi',
    condition: { any: ['swaminarayan akshardham', 'akshardham delhi', 'delhi akshardham'] },
    helpline: '+91 11 4344 2344 / +91 11 2275 0000',
  },
  {
    id: 'matrimandir_auroville',
    condition: { any: ['matrimandir', 'auroville matrimandir', 'auroville ashram'] },
    helpline: '+91 413 262 2239 / +91 413 262 2127',
  },
  {
    id: 'iskcon_vrindavan',
    condition: { any: ['iskcon vrindavan', 'krishna balaram mandir', 'vrindavan iskcon'] },
    helpline: '+91 565 254 0370 / +91 73022 41108',
  },
  {
    id: 'art_of_living_bengaluru',
    condition: { any: ['art of living', 'art of living international center', 'sri sri gurukul', 'art of living bengaluru'] },
    helpline: '+91 80 6761 2345 / +91 80 6726 2626',
  },
];

