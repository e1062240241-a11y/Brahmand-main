import type { FacilitiesRule } from '../types';

export const FACILITIES_RULES: FacilitiesRule[] = [
  {
    id: 'somnath',
    condition: { any: ['somnath'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'puja_booking', 'medical_aid'],
  },
  {
    id: 'mallikarjuna',
    condition: { any: ['mallikarjuna', 'srisailam'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'puja_booking', 'medical_aid'],
  },
  {
    id: 'mahakal',
    condition: { any: ['mahakal'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'mobile_deposit', 'puja_booking', 'medical_aid'],
  },
  {
    id: 'omkareshwar',
    condition: { any: ['omkareshwar'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'bhojanalaya', 'puja_booking'],
  },
  {
    id: 'dwarka',
    condition: { any: ['dwarka', 'dwarkadhish'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'mobile_deposit', 'puja_booking'],
  },
  {
    id: 'kedarnath',
    condition: { any: ['kedarnath'] },
    facilities: ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'bhojanalaya', 'medical_aid', 'transport_assistance'],
  },
  {
    id: 'bhimashankar',
    condition: { any: ['bhimashankar'] },
    facilities: ['parking', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'puja_booking'],
  },
  {
    id: 'kashi-vishwanath',
    condition: { any: ['kashi', 'vishwanath'] },
    facilities: ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'mobile_deposit', 'puja_booking', 'medical_aid'],
  },
  {
    id: 'trimbakeshwar',
    condition: { any: ['trimbakeshwar'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'puja_booking'],
  },
  {
    id: 'baidyanath',
    condition: { any: ['baidyanath', 'babadham', 'vaidyanath'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'bhojanalaya', 'medical_aid'],
  },
  {
    id: 'nageshwar',
    condition: { any: ['nageshwar'] },
    facilities: ['parking', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair'],
  },
  {
    id: 'rameshwar',
    condition: { any: ['rameshwar', 'ramanathaswamy'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'medical_aid'],
  },
  {
    id: 'grishneshwar',
    condition: { any: ['grishneshwar', 'ghrushneshwar', 'grineshwar'] },
    facilities: ['parking', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'puja_booking'],
  },
  {
    id: 'tirupati',
    condition: { any: ['tirupati', 'tirumala', 'venkateswara'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'medical_aid', 'hair_tonsuring'],
  },
  {
    id: 'golden-temple',
    condition: { any: ['golden temple', 'harmandir'] },
    facilities: ['locker', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'bhojanalaya', 'holy_kund'],
  },
  {
    id: 'vaishno-devi',
    condition: { any: ['vaishno', 'katra'] },
    facilities: ['locker', 'drinking_water', 'restrooms', 'bhojanalaya', 'medical_aid', 'transport_assistance'],
  },
  {
    id: 'jagannath-puri',
    condition: { any: ['jagannath', 'puri'] },
    facilities: ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'bhojanalaya'],
  },
  {
    id: 'iskcon',
    condition: { any: ['iskcon'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'bhojanalaya', 'dharamshala'],
  },
  {
    id: 'shirdi-sai',
    condition: { any: ['shirdi', 'sai'] },
    facilities: ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'medical_aid'],
  },
  {
    id: 'siddhivinayak',
    condition: { any: ['siddhivinayak'] },
    facilities: ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'mobile_deposit'],
  },
];

export const DEFAULT_FACILITIES: string[] = [
  'parking',
  'locker',
  'prasad',
  'drinking_water',
  'restrooms',
  'shoe_stand',
];

FACILITIES_RULES.push(
  {
    id: 'amarnath',
    condition: { any: ['amarnath', 'amarnath cave', 'amarnath yatra'] },
    facilities: ['medical_aid', 'food_stalls', 'rfid_counter', 'helicopter_booking', 'trek_support', 'restrooms'],
  },
  {
    id: 'lingaraj',
    condition: { any: ['lingaraj', 'bhubaneswar lingaraj'] },
    facilities: ['viewing_platform', 'shoe_stand', 'prasad', 'cloak_room', 'security_screening', 'restrooms'],
  },
  {
    id: 'brihadisvara',
    condition: { any: ['brihadisvara', 'brihadeeswarar', 'thanjavur big temple', 'peruvudaiyar'] },
    facilities: ['asi_info_center', 'shoe_stand', 'drinking_water', 'wheelchair', 'parking'],
  },
  {
    id: 'tungnath',
    condition: { any: ['tungnath', 'chopta tungnath'] },
    facilities: ['trek_support', 'tea_stalls', 'pony_service', 'dharamshala', 'first_aid'],
  },
  {
    id: 'pashupatinath_mandsaur',
    condition: { any: ['pashupatinath mandsaur', 'mandsaur pashupatinath', 'ashtamukhi pashupatinath'] },
    facilities: ['river_ghats', 'prasad', 'parking', 'rest_sheds', 'shoe_stand'],
  },
  {
    id: 'bhojeshwar',
    condition: { any: ['bhojeshwar', 'bhojpur shiva'] },
    facilities: ['asi_heritage_park', 'info_signage', 'snack_stalls', 'parking', 'restrooms'],
  },
  {
    id: 'murudeshwar',
    condition: { any: ['murudeshwar', 'kanduka hill'] },
    facilities: ['gopura_lift', 'panoramic_deck', 'beach_access', 'canteen', 'parking', 'dharamshala'],
  },
  {
    id: 'tarakeshwar',
    condition: { any: ['tarakeshwar', 'taraknath'] },
    facilities: ['holy_tank', 'bhog_counter', 'dharamshala', 'shoe_stand', 'railway_proximity'],
  },
  {
    id: 'kapaleeshwarar',
    condition: { any: ['kapaleeshwarar', 'mylapore kapaleeshwarar', 'karpagambal'] },
    facilities: ['temple_tank', 'shoe_stand', 'prasad', 'wheelchair', 'devotional_library'],
  },
  {
    id: 'vadakkunnathan',
    condition: { any: ['vadakkunnathan', 'thrissur vadakkunnathan', 'vadakkumnathan'] },
    facilities: ['maithanam_greens', 'prasad', 'shoe_stand', 'cloak_room', 'security_screening'],
  },
  {
    id: 'kotilingeshwara',
    condition: { any: ['kotilingeshwara', 'kolar kotilingeshwara'] },
    facilities: ['anna_dasoha', 'parking', 'linga_office', 'prasad', 'restrooms'],
  },
  {
    id: 'gopnath',
    condition: { any: ['gopnath', 'gopnath mahadev'] },
    facilities: ['seashore_promenade', 'dharamshala', 'parking', 'prasad', 'sunset_point'],
  },
  {
    id: 'kainchi_dham',
    condition: { any: ['kainchi dham', 'neem karoli baba ashram', 'kainchi ashram', 'neem karoli baba'] },
    facilities: ['free_bhandara', 'ashram_stay', 'shoe_counter', 'bookstore', 'restrooms', 'parking'],
  },
  {
    id: 'prasanthi_nilayam',
    condition: { any: ['prasanthi nilayam', 'sathya sai baba ashram', 'puttaparthi ashram', 'puttaparthi sai baba'] },
    facilities: ['sai_kulwant_hall', 'super_speciality_hospital', 'canteen_south_north', 'electronics_counter', 'wheelchair_assistance', 'ashram_dormitories'],
  },
  {
    id: 'swaminarayan_akshardham_delhi',
    condition: { any: ['swaminarayan akshardham', 'akshardham delhi', 'delhi akshardham'] },
    facilities: ['musical_fountain_show', 'boat_ride_exhibition', 'premvati_food_court', 'free_cloakroom', 'wheelchair_rental', 'atm_parking'],
  },
  {
    id: 'matrimandir_auroville',
    condition: { any: ['matrimandir', 'auroville matrimandir', 'auroville ashram'] },
    facilities: ['visitors_centre', 'meditation_inner_chamber', 'solar_kitchen', 'banyan_tree_garden', 'shuttle_electric_vehicle', 'information_desk'],
  },
  {
    id: 'iskcon_vrindavan',
    condition: { any: ['iskcon vrindavan', 'krishna balaram mandir', 'vrindavan iskcon'] },
    facilities: ['govindas_restaurant', 'guesthouse', '24hr_kirtan_hall', 'gift_bookstore', 'shoe_deposit', 'prasad_counters'],
  },
  {
    id: 'art_of_living_bengaluru',
    condition: { any: ['art of living', 'art of living international center', 'sri sri gurukul', 'art of living bengaluru'] },
    facilities: ['vishalakshi_mantap', 'ayurveda_hospital_panchakarma', 'annapurna_dining_hall', 'divya_desh_bookstore', 'shuttle_buggy', 'nature_lake'],
  }
);

