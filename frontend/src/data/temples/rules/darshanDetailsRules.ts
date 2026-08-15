import type { DarshanDetailsRule } from '../types';

export const DARSHAN_DETAILS_RULES: DarshanDetailsRule[] = [
  {
    id: 'somnath',
    condition: { any: ['somnath'] },
    darshan: {
      opening: '6:00 AM',
      closing: '10:00 PM',
      generalDarshan: '6:00 AM – 10:00 PM',
      vipDarshan: 'Available on selected occasions',
    },
  },
  {
    id: 'mallikarjuna',
    condition: { any: ['mallikarjuna', 'srisailam'] },
    darshan: {
      opening: '4:30 AM',
      closing: '10:00 PM',
      generalDarshan: '6:30 AM – 9:00 PM',
      vipDarshan: 'Paid Sevas available',
    },
  },
  {
    id: 'mahakal',
    condition: { any: ['mahakal'] },
    darshan: {
      opening: '4:00 AM',
      closing: '11:00 PM',
      generalDarshan: '4:00 AM – 11:00 PM',
      vipDarshan: 'VIP Darshan & Bhasma Aarti booking available',
    },
  },
  {
    id: 'omkareshwar',
    condition: { any: ['omkareshwar'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Special Darshan available',
    },
  },
  {
    id: 'kedarnath',
    condition: { any: ['kedarnath'] },
    darshan: {
      opening: '4:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 3:00 PM, 5:00 PM – 9:00 PM',
      vipDarshan: 'Priority Darshan available during season',
    },
  },
  {
    id: 'bhimashankar',
    condition: { any: ['bhimashankar'] },
    darshan: {
      opening: '4:30 AM',
      closing: '9:30 PM',
      generalDarshan: '5:00 AM – 9:30 PM',
      vipDarshan: 'Special Pooja booking available',
    },
  },
  {
    id: 'kashi-vishwanath',
    condition: { any: ['kashi', 'vishwanath'] },
    darshan: {
      opening: '3:00 AM',
      closing: '11:00 PM',
      generalDarshan: '4:00 AM – 11:00 PM',
      vipDarshan: 'Sugam Darshan available',
    },
  },
  {
    id: 'trimbakeshwar',
    condition: { any: ['trimbakeshwar'] },
    darshan: {
      opening: '5:30 AM',
      closing: '9:00 PM',
      generalDarshan: '5:30 AM – 9:00 PM',
      vipDarshan: 'Paid Sevas available',
    },
  },
  {
    id: 'baidyanath',
    condition: { any: ['baidyanath', 'babadham', 'vaidyanath'] },
    darshan: {
      opening: '4:00 AM',
      closing: '9:00 PM',
      generalDarshan: '4:00 AM – 3:30 PM, 6:00 PM – 9:00 PM',
      vipDarshan: 'Special Darshan available',
    },
  },
  {
    id: 'nageshwar',
    condition: { any: ['nageshwar'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 9:00 PM',
      vipDarshan: 'Special Pooja available',
    },
  },
  {
    id: 'rameshwar',
    condition: { any: ['rameshwar', 'ramanathaswamy'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: '5:00 AM – 1:00 PM, 3:00 PM – 9:00 PM',
      vipDarshan: 'Special Darshan & Sevas available',
    },
  },
  {
    id: 'grishneshwar',
    condition: { any: ['grishneshwar', 'ghrushneshwar', 'grineshwar'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:30 PM',
      generalDarshan: '5:00 AM – 9:30 PM',
      vipDarshan: 'Special Poojas available',
    },
  },
];
