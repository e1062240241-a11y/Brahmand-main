import type { DarshanDetailsRule } from '../types';

export const DARSHAN_DETAILS_RULES: DarshanDetailsRule[] = [
  {
    id: 'somnath',
    condition: { any: ['somnath'] },
    darshan: {
      opening: '6:00 AM',
      closing: '10:00 PM',
      generalDarshan: '6:00 AM – 10:00 PM',
      vipDarshan: 'Available at Somnath Trust office desk',
      aartis: {
        'Mangala Aarti': '7:00 AM',
        'Rajbhog Aarti': '12:00 PM',
        'Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'mallikarjuna',
    condition: { any: ['mallikarjuna', 'srisailam'] },
    darshan: {
      opening: '4:30 AM',
      closing: '10:00 PM',
      generalDarshan: '6:30 AM – 3:30 PM, 6:00 PM – 9:00 PM',
      vipDarshan: 'Paid Sevas & Sparsha Darshan available',
      aartis: {
        'Mangala Aarti (Suprabhatam)': '4:30 AM',
        'Maha Mangala Aarti': '6:30 AM',
        'Nitya Kalyanotsavam': '5:00 PM',
        'Ekantha Seva': '9:30 PM',
      },
    },
  },
  {
    id: 'mahakal',
    condition: { any: ['mahakal', 'ujjain'] },
    darshan: {
      opening: '4:00 AM',
      closing: '11:00 PM',
      generalDarshan: '4:00 AM – 11:00 PM',
      vipDarshan: 'VIP Sheghra Darshan (₹250) & online Bhasma Aarti booking available',
      aartis: {
        'Bhasma Aarti': '4:00 AM – 6:00 AM',
        'Naivedya Aarti': '7:30 AM',
        'Sandhya Aarti': '6:30 PM',
        'Shayan Aarti': '10:30 PM',
      },
    },
  },
  {
    id: 'omkareshwar',
    condition: { any: ['omkareshwar'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 3:50 PM, 4:15 PM – 9:30 PM',
      vipDarshan: 'VIP / Special Pooja pass available',
      aartis: {
        'Mangal Aarti': '5:00 AM',
        'Maha Bhog Aarti': '12:05 PM',
        'Sandhya Aarti': '7:00 PM',
        'Shayan Aarti': '9:00 PM',
      },
    },
  },
  {
    id: 'kedarnath',
    condition: { any: ['kedarnath'] },
    darshan: {
      opening: '4:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 3:00 PM, 5:00 PM – 9:00 PM',
      vipDarshan: 'Priority Darshan pass available during Char Dham season',
      aartis: {
        'Maha Abhishek Puja': '4:00 AM',
        'Morning Darshan': '6:00 AM',
        'Evening Sandhya Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'bhimashankar',
    condition: { any: ['bhimashankar'] },
    darshan: {
      opening: '4:30 AM',
      closing: '9:30 PM',
      generalDarshan: '5:00 AM – 9:30 PM (Sanctum closes briefly 3:00 PM – 4:00 PM for Madhyan Aarti)',
      vipDarshan: 'Special Pooja booking available',
      aartis: {
        'Kakar Aarti': '4:30 AM',
        'Nijaroop Darshan': '5:00 AM',
        'Madhyan Aarti': '3:00 PM',
        'Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'kashi-vishwanath',
    condition: { any: ['kashi', 'vishwanath', 'varanasi'] },
    darshan: {
      opening: '3:00 AM',
      closing: '11:00 PM',
      generalDarshan: '4:00 AM – 11:00 PM',
      vipDarshan: 'Sugam Darshan (₹300) available online & corridor counter',
      aartis: {
        'Mangla Aarti': '3:00 AM – 4:00 AM',
        'Bhoga Aarti': '11:15 AM – 12:20 PM',
        'Sapta Rishi Aarti': '7:00 PM – 8:15 PM',
        'Shringar Aarti': '9:00 PM – 10:15 PM',
        'Shayan Aarti': '10:30 PM – 11:00 PM',
      },
    },
  },
  {
    id: 'trimbakeshwar',
    condition: { any: ['trimbakeshwar', 'trimbak'] },
    darshan: {
      opening: '5:30 AM',
      closing: '9:00 PM',
      generalDarshan: '5:30 AM – 9:00 PM',
      vipDarshan: 'VIP / Paid Seva queue available',
      aartis: {
        'Mangal Aarti': '5:30 AM',
        'Madhyan Pooja': '1:00 PM – 1:30 PM',
        'Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'baidyanath',
    condition: { any: ['baidyanath', 'babadham', 'vaidyanath', 'deoghar'] },
    darshan: {
      opening: '4:00 AM',
      closing: '9:00 PM',
      generalDarshan: '4:00 AM – 3:30 PM, 6:00 PM – 9:00 PM',
      vipDarshan: 'Special Darshan pass available',
      aartis: {
        'Sarkari Puja & Mangala Aarti': '4:00 AM – 5:30 AM',
        'Sandhya Aarti': '6:00 PM',
        'Shayan Aarti': '8:30 PM',
      },
    },
  },
  {
    id: 'nageshwar',
    condition: { any: ['nageshwar', 'nageshvara'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 12:30 PM, 5:00 PM – 9:00 PM',
      vipDarshan: 'Special Abhishek Pooja available',
      aartis: {
        'Morning Mangla Aarti': '6:00 AM',
        'Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'rameshwar',
    condition: { any: ['rameshwar', 'ramanathaswamy', 'rameswaram'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: '5:00 AM – 1:00 PM, 3:00 PM – 9:00 PM',
      vipDarshan: 'Special Darshan & 22 Holy Wells bath passes available',
      aartis: {
        'Spatika Linga Darshan': '5:00 AM – 6:00 AM',
        'Uchikala Puja': '10:00 AM',
        'Sayaratchai Puja': '6:00 PM',
        'Arthajama Puja': '8:30 PM',
      },
    },
  },
  {
    id: 'grishneshwar',
    condition: { any: ['grishneshwar', 'ghrushneshwar', 'grineshwar', 'ellora'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:30 PM',
      generalDarshan: '5:00 AM – 9:30 PM',
      vipDarshan: 'Special Pooja & Sparsh Darshan available',
      aartis: {
        'Mangal Aarti': '5:30 AM',
        'Madhyan Bhog Aarti': '1:00 PM',
        'Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'kamakhya',
    condition: { any: ['kamakhya'] },
    darshan: {
      opening: '8:00 AM (activities begin 5:30 AM)',
      closing: '5:15 PM (Sunset)',
      generalDarshan: '8:00 AM – 1:00 PM, 2:30 PM – 5:15 PM',
      vipDarshan: 'VIP Special Pass queue available at counter',
      aartis: {
        'Snana of Pithasthana': '5:30 AM',
        'Nitya Puja': '6:00 AM',
        'Temple Door Opening': '8:00 AM',
        'Cooked Bhog Offering (Closed)': '1:00 PM – 2:30 PM',
        'Temple Door Closing (Sunset)': '5:15 PM',
        'Sandhya Aarti': '7:30 PM',
      },
    },
  },
  {
    id: 'kalighat',
    condition: { any: ['kalighat', 'kali temple kolkata'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:30 PM',
      generalDarshan: '5:00 AM – 2:00 PM; 5:00 PM – 10:30 PM (Closed 2:00 PM – 5:00 PM)',
      vipDarshan: 'VIP Pass & Special Queue available',
      aartis: {
        'Mangala Aarti': '~4:00 AM',
        'Noon Aarti': '~12:00 PM',
        'Sandhya Aarti': '~6:30 PM',
        'Shayana Aarti': '~10:00 PM',
      },
    },
  },
  {
    id: 'dakshineswar',
    condition: { any: ['dakshineswar', 'dakshineswar kali'] },
    darshan: {
      opening: '5:30 AM (Summer) / 6:00 AM (Winter)',
      closing: '9:00 PM (Summer) / 8:30 PM (Winter)',
      generalDarshan: 'Summer: 5:30 AM – 11:30 AM & 3:30 PM – 9:00 PM; Winter: 6:00 AM – 12:30 PM & 3:00 PM – 8:30 PM',
      vipDarshan: 'General queue & special festival entry',
      aartis: {
        'Mangal Aarti': '4:00 AM (Summer) / 5:00 AM (Winter)',
        'Bhog Offering': '12:30 PM',
        'Sandhya Aarti': '6:30 PM',
        'Shital Bhog & Shayan': '8:00 PM',
      },
    },
  },
  {
    id: 'tarapith',
    condition: { any: ['tarapith'] },
    darshan: {
      opening: '5:30 AM',
      closing: '10:00 PM',
      generalDarshan: '5:30 AM – 12:00 PM; 1:30 PM – 5:00 PM; 6:00 PM – 10:00 PM (Closed 12:00–1:30 PM & 5:00–6:00 PM)',
      vipDarshan: 'Special queue available',
      aartis: {
        'Mangala Aarti': '~4:00 AM',
        'Morning Aarti': '~5:00 AM',
        'Noon Bhog Aarti': '~12:00 PM',
        'Sandhya Aarti': '~7:00 PM',
        'Shayana Aarti': '~10:00 PM',
      },
    },
  },
  {
    id: 'vaishno_devi',
    condition: { any: ['vaishno_devi', 'vaishnodevi', 'mata vaishno devi'] },
    darshan: {
      opening: 'Open 24×7, 365 Days',
      closing: 'Open 24×7 (Bhawan never closes)',
      generalDarshan: '24×7 Continuous Darshan (Brief pause during Attka Aarti)',
      vipDarshan: 'Shrine Board online slip & priority queue available',
      aartis: {
        'Morning Attka Aarti': '6:20 AM – 8:00 AM',
        'Evening Attka Aarti': '7:20 PM – 8:30 PM',
      },
    },
  },
  {
    id: 'ambaji',
    condition: { any: ['ambaji'] },
    darshan: {
      opening: '8:00 AM',
      closing: '9:00 PM',
      generalDarshan: 'Morning: 8:00 AM – 11:30 AM; Afternoon: 12:30 PM – 4:30 PM; Evening: 7:00 PM – 9:00 PM',
      vipDarshan: 'Special queue available during peak hours',
      aartis: {
        'Mangala Aarti': '6:00 AM',
        'Rajbhog Aarti': '12:00 PM',
        'Sandhya Aarti': '7:00 PM',
        'Shayan Aarti': '9:00 PM',
      },
    },
  },
  {
    id: 'chamundeshwari',
    condition: { any: ['chamundeshwari', 'chamundi'] },
    darshan: {
      opening: '7:30 AM (Abhisheka 6:00 AM - 7:30 AM / Fri 5:00 AM)',
      closing: '9:00 PM',
      generalDarshan: 'Morning: 7:30 AM – 2:00 PM; Evening: 3:30 PM – 6:00 PM; Night: 7:30 PM – 9:00 PM',
      vipDarshan: '₹100 & ₹300 Special Express Pass counters available',
      aartis: {
        'Morning Aarti': '6:00 AM',
        'Afternoon Aarti': '12:00 PM',
        'Evening Aarti': '7:30 PM',
      },
    },
  },
];


