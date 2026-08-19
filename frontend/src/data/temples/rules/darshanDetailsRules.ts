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
  {
    id: 'harsiddhi',
    condition: { any: ['harsiddhi'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: '5:00 AM – 9:00 PM',
      vipDarshan: 'Free entry for all devotees; priority line during peak hours',
      aartis: {
        'Morning Aarti': '5:30 AM',
        'Noon Bhog': '12:00 PM',
        'Evening Aarti': '7:30 PM (Grand Lighting of Deepstambhs)',
      },
    },
  },
  {
    id: 'tripura_sundari',
    condition: { any: ['tripura sundari', 'tripurasundari', 'matabari'] },
    darshan: {
      opening: 'Summer: 5:00 AM | Winter: 5:30 AM',
      closing: 'Summer: 9:00 PM | Winter: 8:30 PM',
      generalDarshan: 'Morning: 5:00 AM – 12:00 PM; Afternoon: 3:00 PM – 8:00 PM (Closed 12:00 PM – 3:00 PM)',
      vipDarshan: '₹100–₹500 VIP Pass available depending on season',
      aartis: {
        'Mangala Aarti': '5:00 AM (Summer) / 5:30 AM (Winter)',
        'Bhoga Aarti': '11:30 AM',
        'Sandhya Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'jwalaji',
    condition: { any: ['jwala', 'jwalaji'] },
    darshan: {
      opening: 'Summer: 6:00 AM | Winter: 7:00 AM',
      closing: 'Summer: 10:00 PM | Winter: 9:30 PM',
      generalDarshan: 'Summer: 6:00 AM – 11:30 AM & 12:30 PM – 10:00 PM | Winter: 7:00 AM – 11:00 AM & 12:30 PM – 9:30 PM',
      vipDarshan: 'Special darshan lines managed by temple trust during Navratri',
      aartis: {
        'Morning Aarti': 'Summer 6:00 AM | Winter 7:00 AM',
        'Evening Aarti': 'Summer 8:00 PM | Winter 7:00 PM',
      },
    },
  },
  {
    id: 'brajeshwari',
    condition: { any: ['brajeshwari', 'vajreshwari'] },
    darshan: {
      opening: 'Summer: 5:00 AM | Winter: 5:30 AM',
      closing: 'Summer: 9:00 PM | Winter: 8:00 PM',
      generalDarshan: 'Summer: 5:00 AM – 12:00 PM & 12:30 PM – 9:00 PM | Winter: 5:30 AM – 12:00 PM & 12:30 PM – 8:00 PM',
      vipDarshan: 'Online Darshan Parchi slip booking available',
      aartis: {
        'Mangal Aarti': 'Summer 5:00 AM | Winter 5:45 AM',
        'Mukhya Aarti': 'Summer 5:15 AM – 6:15 AM | Winter 6:00 AM – 7:00 AM',
        'Evening Aarti (with Saeya)': 'Summer 7:00 PM | Winter 6:30 PM',
      },
    },
  },
  {
    id: 'chintpurni',
    condition: { any: ['chintpurni', 'chhinnamastika'] },
    darshan: {
      opening: '4:00 AM',
      closing: '10:00 PM',
      generalDarshan: '4:00 AM – 10:00 PM (Bhog break: 12:00 PM – 12:30 PM)',
      vipDarshan: 'Darshan Parchi slip mandatory from security guard; online Aarti available',
      aartis: {
        'Morning Snana & Aarti': '6:30 AM',
        'Evening Snana & Aarti': '6:30 PM – 8:00 PM',
        'Goddess Sayan': '10:00 PM',
      },
    },
  },
  {
    id: 'naina_devi',
    condition: { any: ['naina devi', 'nainadevi'] },
    darshan: {
      opening: '4:00 AM (Navratri: 2:00 AM)',
      closing: '10:00 PM (Navratri: 12:00 AM)',
      generalDarshan: 'Normal Days: 4:00 AM – 10:00 PM | Navratri: 2:00 AM – 12:00 AM',
      vipDarshan: 'Ropeway / Cable car access available to hilltop temple; Live YouTube darshan available',
      aartis: {
        'Morning Aarti': '5:00 AM',
        'Evening Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'chamunda_devi_kangra',
    condition: { any: ['chamunda', 'chamundeshwar dham', 'nandikeshwar'] },
    darshan: {
      opening: 'Summer: 5:00 AM | Winter: 6:00 AM',
      closing: 'Summer: 10:00 PM | Winter: 9:00 PM',
      generalDarshan: 'Summer: 5:00 AM – 12:00 PM & 1:00 PM – 10:00 PM | Winter: 6:00 AM – 12:00 PM & 1:00 PM – 9:00 PM (Closed 12:00–1:00 PM for Bhog)',
      vipDarshan: 'Free entry for regular darshan; Darshan Parchi slip available online',
      aartis: {
        'Morning Aarti': '8:00 AM – 8:45 AM',
        'Evening Aarti': '7:10 PM – 7:50 PM (Live broadcast on MH1 Prime)',
      },
    },
  },
  {
    id: 'mansa_devi',
    condition: { any: ['mansa devi', 'mansadevi'] },
    darshan: {
      opening: 'Summer: 4:00 AM | Winter: 5:00 AM',
      closing: 'Summer: 10:00 PM | Winter: 9:00 PM',
      generalDarshan: 'Summer: 4:00 AM – 10:00 PM | Winter: 5:00 AM – 9:00 PM',
      vipDarshan: 'Sugam Darshan Token: ₹100 | Mandap Darshan Token: ₹500 | Cable car & Lift facility available',
      aartis: {
        'Morning Aarti': 'Summer 4:30 AM / 5:00 AM | Winter 5:00 AM / 5:30 AM',
        'Evening Aarti': 'Summer 7:00 PM / 7:30 PM | Winter 6:30 PM / 7:00 PM',
      },
    },
  },
  {
    id: 'chandi_devi_haridwar',
    condition: { any: ['chandi devi', 'chandidevi', 'neel parvat'] },
    darshan: {
      opening: '5:30 AM',
      closing: '8:00 PM',
      generalDarshan: 'Morning: 5:30 AM – 12:00 PM; Evening: 4:00 PM – 8:00 PM (Sanctum cleaning break 12:00 PM – 4:00 PM)',
      vipDarshan: 'Special darshan lane for Seva ticket holders and senior citizens (65+); Ropeway (Udan Khatola) available',
      aartis: {
        'Mangala Aarti': '5:30 AM',
        'Abhishekam': 'Tuesdays & Sundays',
        'Sandhya Aarti': 'Evening',
      },
    },
  },
  {
    id: 'alopi_devi_prayagraj',
    condition: { any: ['alopi', 'alopidevi', 'alopi mata'] },
    darshan: {
      opening: '5:00 AM (Tue/Fri: 4:00 AM | Navratri: 24×7)',
      closing: '9:30 PM – 11:00 PM (Tue/Fri: 12:00 AM Midnight)',
      generalDarshan: '5:00 AM – 12:00 PM & 4:00 PM – 11:00 PM (Tue/Fri 4:00 AM – 12:00 AM; Navratri open 24x7 with night Jagran)',
      vipDarshan: 'Devotees pray to an empty silver swing (Jhoola) where the Goddess invisibly resides',
      aartis: {
        'Morning Aarti': '7:00 AM',
        'Evening Aarti': '8:00 PM',
      },
    },
  },
  {
    id: 'vindhyavasini',
    condition: { any: ['vindhyavasini', 'vindhyachal'] },
    darshan: {
      opening: 'Normal: 5:00 AM | Navratri: 4:00 AM',
      closing: 'Normal: Midnight | Navratri: 3:00 AM',
      generalDarshan: 'Normal: 5:00 AM – 12:00 PM, 1:30 PM – 7:15 PM, 8:15 PM – 9:30 PM, 10:30 PM – 12:00 AM | Navratri: 4:00 AM – 12:00 PM, 1:00 PM – 7:30 PM, 8:30 PM – 9:30 PM, 10:30 PM – 3:00 AM',
      vipDarshan: 'Follow queue discipline; vehicles banned near shrine during Navratri',
      aartis: {
        'Mangala Aarti': 'Early Morning',
        'Abhishek': 'Morning (Panchamrit Snan)',
        'Shringar': 'Pre-Bhog',
        'Bhog & Naivedya': 'Noon & Evening',
        'Sandhya Aarti': 'Dusk',
        'Shayan Aarti': 'Night before deity rests',
      },
    },
  },
  {
    id: 'devipatan',
    condition: { any: ['devipatan', 'tulsipur'] },
    darshan: {
      opening: '6:00 AM / 9:00 AM',
      closing: '8:00 PM / 9:00 PM',
      generalDarshan: '9:00 AM – 9:00 PM (Hours extend during Navratri)',
      vipDarshan: 'Head-shaving (Mundan) ceremony for children available as sacred tradition',
      aartis: {
        'Morning Aarti': '5:00 AM',
        'Afternoon Aarti': '12:00 PM',
        'Evening Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'sharada_peeth',
    condition: { any: ['sharada peeth', 'sharda peeth', 'neelum valley'] },
    darshan: {
      opening: 'Access restricted',
      closing: 'Access restricted',
      generalDarshan: 'No regular daily darshan (Historical site in ruins; pilgrimage by official permit only)',
      vipDarshan: 'Subject to international permissions & security conditions',
      aartis: {
        'Historical Aarti': 'Conducted during organized official pilgrimages',
      },
    },
  },
  {
    id: 'fullara_attahas',
    condition: { any: ['fullara', 'attahas', 'labhpur'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Direct queue entry available; modest traditional attire encouraged',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'bakreshwar',
    condition: { any: ['bakreshwar', 'bakreswar', 'suri'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Holy dip in natural thermal hot springs (Kunds) before temple entry',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'nalateswari',
    condition: { any: ['nalateswari', 'nalateswari temple', 'nalhati'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Direct queue access available; traditional modest attire required',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'jogadya',
    condition: { any: ['jogadya', 'khirgram', 'burdwan'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Special annual festival submerged deity darshan event at Khirgram pond',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'kankalitala',
    condition: { any: ['kankalitala', 'kankali', 'bolpur'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Direct queue entry available; modest traditional clothing expected',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'bahula',
    condition: { any: ['bahula', 'ketugram'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Direct queue access available; traditional modest attire required',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'ujaani_mangal_chandi',
    condition: { any: ['ujaani', 'mangal chandi', 'mangalkote'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Direct queue entry available; modest clothing expected',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'kiriteswari',
    condition: { any: ['kiriteswari', 'kiriteswari temple', 'kiritchona', 'murshidabad'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM',
      vipDarshan: 'Direct queue access; historic sacred shrine site',
      aartis: {
        'Morning Aarti': 'Standard Morning Aarti',
        'Evening Aarti': 'Standard Evening Aarti',
      },
    },
  },
  {
    id: 'maihar_sharda_devi',
    condition: { any: ['maihar', 'sharda devi maihar', 'maihar mata'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: '5:00 AM – 12:00 PM & 4:00 PM – 9:00 PM',
      vipDarshan: 'Special Aarti Tokens (Mangala / Rajbhog / Sayan): ₹501; Ropeway available 7:00 AM – 7:00 PM (₹150 adults)',
      aartis: {
        'Morning Aarti': '5:00 AM',
        'Afternoon Aarti (Mahanaivedya)': '1:00 PM',
        'Evening Aarti (Maha Aarti)': '7:00 PM',
      },
    },
  },
  {
    id: 'danteshwari_dantewada',
    condition: { any: ['danteshwari', 'dantewada'] },
    darshan: {
      opening: '5:00 AM',
      closing: '7:00 PM',
      generalDarshan: '5:00 AM – 7:00 PM (Prasad distribution 11:00 AM – 5:00 PM)',
      vipDarshan: 'Direct queue entry; heavy rush during Fagun Mela and Navratri',
      aartis: {
        'Morning Aarti': '5:30 AM',
        'Evening Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'hinglaj_mata',
    condition: { any: ['hinglaj', 'hinglaj mata', 'hingol', 'nani mandir'] },
    darshan: {
      opening: '6:00 AM',
      closing: '6:00 PM',
      generalDarshan: '6:00 AM – 6:00 PM',
      vipDarshan: 'Annual Hinglaj Yatra (April–May); international pilgrimage permit/visa required',
      aartis: {
        'Morning Puja': '6:00 AM',
        'Evening Puja': '5:00 PM',
      },
    },
  },
  {
    id: 'biraja_jajpur',
    condition: { any: ['biraja', 'biraja temple', 'jajpur'] },
    darshan: {
      opening: '6:00 AM',
      closing: '10:00 PM',
      generalDarshan: '6:00 AM – 1:00 PM & 3:00 PM – 10:00 PM',
      vipDarshan: 'Special Seva access during 16-day Sharadiya Durga Puja & Simhadhwaja Ratha festival',
      aartis: {
        'Morning Seva & Aarti': '4:00 AM – 4:30 AM',
        'Midday Seva': '1:00 PM',
        'Afternoon Seva': '3:00 PM',
        'Evening Aarti': '7:00 PM',
        'Night Seva': '10:00 PM',
      },
    },
  },
  {
    id: 'taratarini_ganjam',
    condition: { any: ['taratarini', 'tara tarini', 'puruna risi', 'ganjam'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:30 AM – 12:30 PM, 2:00 PM – 5:30 PM, 6:30 PM – 8:30 PM',
      vipDarshan: 'Ropeway & 999 hill steps access available; hair-offering (Mundan) rituals on Tuesdays',
      aartis: {
        'Mangala Alati': '6:30 AM',
        'Morning Aarti': '6:00 AM',
        'Ucha Pooja (Midday)': '12:00 PM',
        'Sandhya Aarti': '6:30 PM',
      },
    },
  },
];





