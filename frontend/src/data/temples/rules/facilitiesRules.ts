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
