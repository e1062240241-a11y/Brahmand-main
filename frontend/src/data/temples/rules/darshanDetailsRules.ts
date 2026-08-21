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
    id: 'kainchi_dham',
    condition: { any: ['kainchi dham', 'neem karoli baba ashram', 'kainchi ashram', 'neem karoli baba'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:00 PM',
      generalDarshan: '6:00 AM – 8:00 PM (Summer: 6:00 AM – 8:00 PM, Winter: 7:00 AM – 7:00 PM)',
      vipDarshan: 'General queue only; calm, disciplined entry for all devotees',
      aartis: {
        'Morning Kakad Aarti': '6:45 AM',
        'Evening Aarti': '6:45 PM',
      },
    },
  },
  {
    id: 'prasanthi_nilayam',
    condition: { any: ['prasanthi nilayam', 'sathya sai baba ashram', 'puttaparthi ashram', 'puttaparthi sai baba'] },
    darshan: {
      opening: '4:45 AM',
      closing: '8:00 PM',
      generalDarshan: '8:00 AM – 11:30 AM, 4:30 PM – 7:00 PM (Sai Kulwant Hall)',
      vipDarshan: 'Seating arranged systematically in Sai Kulwant Hall; open access',
      aartis: {
        'Omkaram & Suprabhatam': '5:15 AM',
        'Morning Bhajans': '9:00 AM',
        'Evening Bhajans & Mangala Harathi': '5:15 PM – 6:00 PM',
      },
    },
  },
  {
    id: 'swaminarayan_akshardham_delhi',
    condition: { any: ['swaminarayan akshardham', 'akshardham delhi', 'delhi akshardham'] },
    darshan: {
      opening: '10:00 AM',
      closing: '8:00 PM',
      generalDarshan: '10:00 AM – 6:30 PM (Mondays Closed)',
      vipDarshan: 'Exhibition & Water Show ticket counters available on-site',
      aartis: {
        'Morning Mandir Aarti': '10:00 AM',
        'Evening Sandhya Aarti': '6:00 PM',
        'Sahaj Anand Water Show': '7:15 PM',
      },
    },
  },
  {
    id: 'matrimandir_auroville',
    condition: { any: ['matrimandir', 'auroville matrimandir', 'auroville ashram'] },
    darshan: {
      opening: '9:00 AM',
      closing: '5:00 PM',
      generalDarshan: 'Viewing Point: 9:00 AM – 4:00 PM; Inner Chamber Meditation: 9:00 AM – 12:00 PM (Prior pass required)',
      vipDarshan: 'Book Inner Chamber meditation pass in advance at Visitors Centre',
      aartis: {
        'Morning Silence Meditation': '9:00 AM',
        'Concentration Session': '11:00 AM',
        'Sunset Amphitheatre Silence': '5:00 PM',
      },
    },
  },
  {
    id: 'iskcon_vrindavan',
    condition: { any: ['iskcon vrindavan', 'krishna balaram mandir', 'vrindavan iskcon'] },
    darshan: {
      opening: '4:30 AM',
      closing: '8:45 PM',
      generalDarshan: '4:30 AM – 12:45 PM, 4:30 PM – 8:45 PM',
      vipDarshan: 'Open general darshan; special seva bookings available at ISKCON office',
      aartis: {
        'Mangala Aarti': '4:30 AM',
        'Tulsi Aarti': '5:00 AM',
        'Darshan Aarti & Guru Puja': '7:15 AM',
        'Raj Bhog Aarti': '12:00 PM',
        'Sandhya Aarti (Gaura Aarti)': '6:30 PM',
      },
    },
  },
  {
    id: 'art_of_living_bengaluru',
    condition: { any: ['art of living', 'art of living international center', 'sri sri gurukul', 'art of living bengaluru'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 9:00 PM (Campus tours 9:00 AM – 5:00 PM)',
      vipDarshan: 'Register at Reception Desk / Information Center at main entry gate',
      aartis: {
        'Morning Yoga & Meditation': '6:30 AM',
        'Guru Puja / Abhishekam': '9:00 AM',
        'Evening Satsang & Wisdom Session': '6:30 PM – 8:30 PM',
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
  {
    id: 'badi_patan_devi',
    condition: { any: ['patan devi', 'badi patan devi', 'patneshwari', 'patna devi'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: 'Morning: 7:00 AM – 12:00 PM; Evening: 3:00 PM – 6:00 PM (Mid-day break: 12:00 PM – 3:00 PM)',
      vipDarshan: '₹100 Special Entry pass available to bypass general queue during non-peak hours',
      aartis: {
        'Mangala Aarti': '5:00 AM – 7:00 AM',
        'General Darshan': '7:00 AM – 12:00 PM',
        'Mid-day Break': '12:00 PM – 3:00 PM',
        'Evening Darshan': '3:00 PM – 6:00 PM',
        'Sandhya Aarti & Shayan': '6:30 PM – 9:00 PM',
      },
    },
  },
  {
    id: 'chinnamasta_rajrappa',
    condition: { any: ['chinnamasta', 'chinnamastika', 'rajrappa'] },
    darshan: {
      opening: 'Summer: 4:00 AM | Winter: 5:30 AM',
      closing: 'Summer: 10:00 PM | Winter: 9:30 PM',
      generalDarshan: 'Summer: 4:00 AM – 10:00 PM | Winter: 5:30 AM – 9:30 PM (Closed briefly during Aarti)',
      vipDarshan: 'Devotees must be 18+ yrs; Photo ID proof & address required for darshan',
      aartis: {
        'Morning Aarti': '6:00 AM',
        'Evening Aarti': '8:00 PM',
      },
    },
  },
  {
    id: 'kamakshi_amman_kanchipuram',
    condition: { any: ['kamakshi', 'kamakshi amman', 'kanchipuram kamakshi'] },
    darshan: {
      opening: '5:30 AM',
      closing: '9:00 PM',
      generalDarshan: 'Morning: 5:30 AM – 12:30 PM | Evening: 3:45 PM – 9:00 PM (Nadai closed 12:30 PM – 3:45 PM)',
      vipDarshan: 'Special Darshan queues available; Gayathri Mandapam restricted during Poornima Nava Varna Pooja',
      aartis: {
        'Goh Pooja & Viswarupa Darshanam': '5:30 AM',
        'Kala Sandhi Abhishekam': '5:45 AM – 6:45 AM',
        'Utchikalam (Midday)': '10:30 AM – 11:30 AM',
        'Sayarksha (Evening)': '4:30 PM – 5:30 PM',
        'Arthajama Pooja': '8:30 PM – 8:40 PM',
        'Palliarai Pooja': '8:30 PM',
      },
    },
  },
  {
    id: 'bhramaramba_srisailam',
    condition: { any: ['bhramaramba', 'bhramarambika', 'srisailam shakti peetha'] },
    darshan: {
      opening: '4:30 AM',
      closing: '9:00 PM',
      generalDarshan: 'Morning: 4:30 AM – 1:00 PM | Evening: 6:00 PM – 9:00 PM (Break 1:00 PM – 6:00 PM)',
      vipDarshan: 'Sarva Darshan: Free | Seeghra: ₹150 | Bhramaramba Quick: ₹200 | VIP: ₹500/person',
      aartis: {
        'Mangala Aarti': '4:30 AM',
        'Abhishekam': '4:30 AM – 6:00 AM',
        'Mahamangala Aarti (Evening)': '5:20 PM – 6:00 PM',
        'Sandhya Aarti': '6:00 PM',
      },
    },
  },
  {
    id: 'kanaka_durga_vijayawada',
    condition: { any: ['kanaka durga', 'kanakadurgamma', 'indrakeeladri', 'vijayawada durga'] },
    darshan: {
      opening: '3:00 AM',
      closing: '10:00 PM',
      generalDarshan: 'Dharma Darshanam: 4:00 AM – 5:45 PM & 6:15 PM – 10:00 PM (Anna Prasadam 10 AM – 4 PM)',
      vipDarshan: 'Online booking at kanakadurgamma.org; Live YouTube stream on SriKanakaDurga Official; Paroksha Seva',
      aartis: {
        'Suprabhatha Seva': '3:00 AM – 3:30 AM',
        'Prathakala Darshan': '3:30 AM – 4:00 AM',
        'Dharma Darshanam & Mukha Mandapam': '4:00 AM – 5:45 PM',
        'Evening Session': '6:15 PM – 10:00 PM',
      },
    },
  },
  {
    id: 'kanyakumari_bhagavathy',
    condition: { any: ['kanyakumari', 'kumari devi', 'bhagavathy amman kanyakumari'] },
    darshan: {
      opening: '4:30 AM',
      closing: '8:30 PM',
      generalDarshan: 'Morning: 4:30 AM – 12:30 PM | Evening: 4:00 PM – 8:30 PM (Midday closing: 12:30 PM – 4:00 PM)',
      vipDarshan: 'Special queue lines available during sunrise/sunset hours and Navratri festival',
      aartis: {
        'Thiruvanadal (Temple opening)': '4:30 AM',
        'Abhishegam (Morning)': '5:00 AM',
        'Deeparathanai (Morning)': '6:00 AM',
        'Abhishegam (Midday)': '10:00 AM',
        'Uchikala Pooja': '11:30 AM',
        'Thiruvanadal Aadi (Midday Closing)': '12:30 PM',
        'Reopening (Evening)': '4:00 PM',
        'Sayaratchai Deeparathanai': '6:30 PM',
        'Sribali': '8:15 PM',
        'Ekanta Deeparathanai & Closing': '8:25 PM – 8:30 PM',
      },
    },
  },
  {
    id: 'attukal_bhagavathy_thiruvananthapuram',
    condition: { any: ['attukal', 'attukalamma', 'attukal bhagavathy', 'thiruvananthapuram bhagavathy'] },
    darshan: {
      opening: '4:30 AM',
      closing: '8:30 PM',
      generalDarshan: 'Morning: 4:30 AM – 12:30 PM | Evening: 4:00 PM – 8:30 PM (Madhura Pooja break 12:30 PM – 4:00 PM)',
      vipDarshan: 'Special queue arrangements during annual Attukal Pongala festival (Guinness World Record gathering)',
      aartis: {
        'Morning Prayers & Abhishekam': '4:30 AM – 6:00 AM',
        'Midday Madhura Pooja': '12:00 PM – 12:30 PM',
        'Evening Reopening': '4:00 PM',
        'Deeparadhana & Pushpanjali': '6:30 PM – 7:30 PM',
        'Sayana Pooja & Door Closure': '8:15 PM – 8:30 PM',
      },
    },
  },
  {
    id: 'chottanikkara_bhagavathy_kochi',
    condition: { any: ['chottanikkara', 'chottanikkara bhagavathy', 'rajarajeswari chottanikkara', 'kizhukkavu'] },
    darshan: {
      opening: '4:00 AM (3:30 AM Mandalam & Fridays)',
      closing: '8:45 PM',
      generalDarshan: 'Morning: 4:00 AM – 12:00 PM | Evening: 4:00 PM – 8:45 PM (Special 3:30 AM opening on Fridays & Mandalam)',
      vipDarshan: 'Special queue & Bhajanam pass for Kizhukkavu Bhadrakaali Guruthi Nivedyam exorcism rituals',
      aartis: {
        'Nirmalaya Darshan': '4:00 AM',
        'Ethruthu Pooja & Seeveli': '5:00 AM – 5:45 AM',
        'Guruthi Nivedyam (Kizhukavu)': '7:30 AM',
        'Pantheeradi Pooja': '7:00 AM – 8:00 AM',
        'Ucha Pooja & Ucha Seeveli': '11:00 AM – 12:00 PM',
        'Evening Reopening & Deeparadhana': '4:00 PM & Sunset (post 6 PM)',
        'Athazha Pooja & Seeveli': '7:00 PM – 8:00 PM',
        'Valiya Guruthi at Kizhukavu': '8:30 PM – 8:45 PM',
      },
    },
  },
  {
    id: 'kateel_durgaparameshwari_mangalore',
    condition: { any: ['kateel', 'durgaparameshwari kateel', 'kateel durga', 'nandini river temple'] },
    darshan: {
      opening: '4:00 AM',
      closing: '10:00 PM',
      generalDarshan: 'Morning: 5:00 AM – 1:00 PM | Evening: 3:00 PM – 9:00 PM (Best peaceful darshan 5:00 AM – 8:00 AM)',
      vipDarshan: 'Free Annadana Prasadam meals daily & Yakshagana dance-drama performances on temple grounds',
      aartis: {
        'Morning Aarti': '5:30 AM',
        'Afternoon Aarti': '12:30 PM',
        'Evening Aarti': '7:30 PM',
      },
    },
  },
  {
    id: 'horanadu_annapoorneshwari',
    condition: { any: ['horanadu', 'annapoorneshwari horanadu', 'adishakthyathmaka', 'horanadu temple'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 9:00 PM continuous (Special queue for 70+ elderly, pregnant women, & differently-abled)',
      vipDarshan: '400-year continuous Annadanam (Free Feast 12:30-3:30 PM & 7:30-9:00 PM); Special priority queues for senior citizens',
      aartis: {
        'Morning Pooja & Abhishekam': '7:00 AM – 8:00 AM',
        'Morning Mahamangalarati': '9:00 AM',
        'Afternoon Pooja': '11:00 AM – 1:30 PM',
        'Afternoon Mahamangalarati': '1:30 PM',
        'Evening Darshan & Pooja': '5:30 PM – 9:00 PM',
        'Night Pooja & Mahamangalarati': '8:30 PM – 9:00 PM',
      },
    },
  },
  {
    id: 'mookambika_kollur',
    condition: { any: ['mookambika', 'kollur mookambika', 'mookambika temple', 'kollur'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: 'Morning: 5:00 AM – 7:15 AM & 7:45 AM – 11:30 AM | Noon: 12:00 PM – 1:30 PM | Afternoon: 3:00 PM – 5:00 PM (Darshan only) | Evening: 5:00 PM – 9:00 PM',
      vipDarshan: 'Online booking at kollurmookambikatemple.org; Nightly Saraswathi Mandapa Utsava Seve',
      aartis: {
        'Linga Abhishekam & Ganahoma': '5:15 AM – 5:30 AM',
        'Morning Pooja & Dantha Dhavana': '6:30 AM – 7:15 AM',
        'Morning Mangalarathi & Bali Utsavam': '8:00 AM – 8:15 AM',
        'Noon Pooja & Maha Mangalarathi': '11:30 AM – 12:30 PM',
        'Evening Pradosha Pooja & Abhisheka': '6:30 PM – 7:30 PM',
        'Night Bali Utsava & Saraswathi Mantapa Seve': '8:15 PM – 8:30 PM',
        'Kashaya Mangalarathi & Closing': '9:00 PM',
      },
    },
  },

  {
    id: 'amarnath',
    condition: { any: ['amarnath', 'amarnath cave', 'amarnath yatra'] },
    darshan: {
      opening: 'July–August (Yatra Season)',
      closing: 'Varies by SASB Schedule',
      generalDarshan: '6:00 AM – 6:00 PM during Yatra Season from Baltal & Chandanwari routes.',
      vipDarshan: 'Mandatory advance registration via jksasb.nic.in with RFID card and medical certificate.',
      aartis: {
        'Morning Cave Aarti': '6:00 AM',
        'Evening Cave Aarti': '5:00 PM',
      },
    },
  },
  {
    id: 'lingaraj',
    condition: { any: ['lingaraj', 'bhubaneswar lingaraj'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 12:30 PM & 3:30 PM – 9:00 PM. (Midday closure 12:30 PM – 3:30 PM for Bhoga).',
      vipDarshan: 'Managed queue lines in central courtyard; inner sanctum access managed by Sevayats.',
      aartis: {
        'Mangala Aarti': '6:30 AM',
        'Mahadipa Placement (Shivratri)': '10:00 PM',
      },
    },
  },
  {
    id: 'brihadisvara',
    condition: { any: ['brihadisvara', 'brihadeeswarar', 'thanjavur big temple', 'peruvudaiyar'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:30 PM',
      generalDarshan: '6:00 AM – 12:30 PM & 4:00 PM – 8:30 PM. Free general darshan queue.',
      vipDarshan: 'Organized queue lines managed by ASI and temple administration during weekends and Chola festivals.',
      aartis: {
        'Uchikaala Pooja': '12:00 PM',
        'Sayaratchai Pooja': '6:00 PM',
      },
    },
  },
  {
    id: 'tungnath',
    condition: { any: ['tungnath', 'chopta tungnath'] },
    darshan: {
      opening: 'May (Akshaya Tritiya / Vaisakh)',
      closing: 'October/November (Diwali / Kartik)',
      generalDarshan: '6:00 AM – 7:00 PM continuously during open season.',
      vipDarshan: 'Free open access; 3.5 km trek from Chopta base mandatory for all devotees.',
      aartis: {
        'Morning Trekker Aarti': '6:30 AM',
        'Sandhya Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'pashupatinath_mandsaur',
    condition: { any: ['pashupatinath mandsaur', 'mandsaur pashupatinath', 'ashtamukhi pashupatinath'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 9:00 PM continuously on all days.',
      vipDarshan: 'Special queue arrangements available on Shravan Mondays and Shivratri.',
      aartis: {
        'Pratah Aarti': '6:30 AM',
        'Sandhya Bhasma Aarti': '7:30 PM',
      },
    },
  },
  {
    id: 'bhojeshwar',
    condition: { any: ['bhojeshwar', 'bhojpur shiva'] },
    darshan: {
      opening: '6:00 AM',
      closing: '7:00 PM',
      generalDarshan: '6:00 AM – 7:00 PM (Regulated by Archaeological Survey of India).',
      vipDarshan: 'Free open entry for all pilgrims; managed lines on Shivratri festival.',
      aartis: {
        'Pratah Aarti': '7:00 AM',
        'Sayanh Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'murudeshwar',
    condition: { any: ['murudeshwar', 'kanduka hill'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:30 PM',
      generalDarshan: '6:00 AM – 1:00 PM & 3:00 PM – 8:30 PM. (Midday closure 1:00 PM – 3:00 PM).',
      vipDarshan: 'Lift service available to 18th floor of Raja Gopura (₹20 per head) for aerial statue views.',
      aartis: {
        'Maha Mangala Aarti': '12:15 PM',
        'Raja Gopura Night Aarti': '8:00 PM',
      },
    },
  },
  {
    id: 'tarakeshwar',
    condition: { any: ['tarakeshwar', 'taraknath'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:30 PM',
      generalDarshan: '6:00 AM – 1:30 PM & 4:00 PM – 8:30 PM. (Midday closure 1:30 PM – 4:00 PM).',
      vipDarshan: 'Special Jal Dhal (Water Pouring) queues during Gajan festival and Shravan month.',
      aartis: {
        'Mangal Aarti': '6:00 AM',
        'Sandhya Aarti & Bhog': '7:00 PM',
      },
    },
  },
  {
    id: 'kapaleeshwarar',
    condition: { any: ['kapaleeshwarar', 'mylapore kapaleeshwarar', 'karpagambal'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: '5:00 AM – 12:30 PM & 4:00 PM – 9:00 PM. (Midday closure 12:30 PM – 4:00 PM).',
      vipDarshan: 'Special ₹20 / ₹50 quick darshan lines available during festival days.',
      aartis: {
        'Kala Santhi Pooja': '6:00 AM',
        'Uchikkala Pooja': '12:00 PM',
        'Sayaratchai Pooja': '6:00 PM',
      },
    },
  },
  {
    id: 'vadakkunnathan',
    condition: { any: ['vadakkunnathan', 'thrissur vadakkunnathan', 'vadakkumnathan'] },
    darshan: {
      opening: '3:30 AM',
      closing: '8:30 PM',
      generalDarshan: '3:30 AM – 11:00 AM & 5:00 PM – 8:30 PM. (Midday closure 11:00 AM – 5:00 PM).',
      vipDarshan: 'Traditional Kerala temple entry rules apply to all pilgrims; no special paid tickets.',
      aartis: {
        'Nirmalya Darshanam': '3:30 AM',
        'Ucha Pooja': '10:30 AM',
        'Athazha Pooja': '7:30 PM',
      },
    },
  },
  {
    id: 'kotilingeshwara',
    condition: { any: ['kotilingeshwara', 'kolar kotilingeshwara'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 9:00 PM continuously on all days.',
      vipDarshan: 'Nominal ₹20 entry ticket; special camera pass available at ticket window.',
      aartis: {
        'Morning Maha Pooja': '6:30 AM',
        'Evening Deeparadhana': '7:00 PM',
      },
    },
  },
  {
    id: 'gopnath',
    condition: { any: ['gopnath', 'gopnath mahadev'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:00 PM',
      generalDarshan: '6:00 AM – 8:00 PM continuously.',
      vipDarshan: 'Free open access; serene seashore environment for all pilgrims.',
      aartis: {
        'Pratah Aarti': '6:30 AM',
        'Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'mayureshwar_morgaon',
    condition: { any: ['mayureshwar', 'moreshwar', 'morgaon', 'morgaon ganesha'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM continuous (Special senior citizen & divyang assistance available)',
      vipDarshan: 'Online Abhishek booking & expedited queue via Chinchwad Deosthan Trust',
      aartis: {
        'Prakshal Puja': '5:00 AM',
        'Morning Shodashopachar Puja': '7:00 AM',
        'Noon Pooja': '12:00 PM',
        'Evening Samudaik Aarti': '7:30 PM',
        'Night Panchopachar Puja': '8:00 PM',
        'Shej Aarti': '10:00 PM',
      },
    },
  },
  {
    id: 'siddhivinayak_siddhatek',
    condition: { any: ['siddhivinayak siddhatek', 'siddhatek', 'siddhatek ganesha'] },
    darshan: {
      opening: '5:30 AM',
      closing: '9:30 PM',
      generalDarshan: '5:30 AM – 9:30 PM (Hilltop Pradakshina road ~30 min walk around hillock)',
      vipDarshan: 'Direct Abhishek booking at Deosthan counter',
      aartis: {
        'Kakad Aarti': '5:30 AM',
        'Noon Mahapuja': '12:15 PM',
        'Evening Sanj Aarti': '7:30 PM',
        'Shej Aarti': '9:30 PM',
      },
    },
  },
  {
    id: 'ballaleshwar_pali',
    condition: { any: ['ballaleshwar', 'pali ganesha', 'pali ballaleshwar'] },
    darshan: {
      opening: '5:30 AM',
      closing: '10:00 PM',
      generalDarshan: '5:30 AM – 10:00 PM (Extended till 11:00 PM on Sankashti Chaturthi)',
      vipDarshan: 'Special Abhishek Pass available at Trust office',
      aartis: {
        'Kakad Aarti': '5:30 AM',
        'Morning Abhishek': '6:00 AM – 11:30 AM',
        'Noon Mahanaivedya': '12:00 PM',
        'Evening Aarti with European Bell': '6:30 PM',
        'Shej Aarti': '9:30 PM',
      },
    },
  },
  {
    id: 'varadavinayak_mahad',
    condition: { any: ['varadavinayak', 'mahad ganesha', 'mahad varadavinayak'] },
    darshan: {
      opening: '5:00 AM',
      closing: '9:00 PM',
      generalDarshan: '5:00 AM – 9:00 PM continuous (Devotees can pay respects near the historic Nanda Deep lamp)',
      vipDarshan: 'Sahastravartan & Special Puja booking via Temple Trust office',
      aartis: {
        'Kakad Aarti': '5:00 AM',
        'Morning Panchamrit Puja': '8:00 AM',
        'Noon Naivedya Aarti': '12:00 PM',
        'Evening Sanj Aarti': '7:00 PM',
        'Shej Aarti': '9:00 PM',
      },
    },
  },
  {
    id: 'chintamani_theur',
    condition: { any: ['chintamani', 'theur', 'theur chintamani'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM (Open 4:00 AM – 11:00 PM on Angarki & Sankashti Chaturthi)',
      vipDarshan: 'Special Trust Darshan Line & Online Pooja booking',
      aartis: {
        'Kakad Aarti': '5:30 AM',
        'Morning Maha Aarti': '7:30 AM',
        'Madhyan Aarti': '12:00 PM',
        'Evening Aarti': '8:00 PM',
        'Shej Aarti': '10:00 PM',
      },
    },
  },
  {
    id: 'girijatmaj_lenyadri',
    condition: { any: ['girijatmaj', 'lenyadri', 'lenyadri ganesha'] },
    darshan: {
      opening: '5:00 AM',
      closing: '8:30 PM',
      generalDarshan: '5:00 AM – 8:30 PM (Requires climbing 307 stone steps to Cave 7; Palanquin service available for elderly)',
      vipDarshan: 'Special Darshan Line; Cave entry managed by Archaeological Survey of India (ASI)',
      aartis: {
        'Kakad Aarti': '5:30 AM',
        'Morning Panchamrit Puja': '8:00 AM',
        'Noon Aarti': '12:00 PM',
        'Evening Dhoopaarti': '8:00 PM',
      },
    },
  },
  {
    id: 'vighneshwar_ozar',
    condition: { any: ['vighneshwar', 'ozar', 'ojhar', 'ozar ganesha'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:00 PM',
      generalDarshan: '5:00 AM – 10:00 PM continuous riverside complex darshan',
      vipDarshan: 'Online Abhishek registration & special queue for senior citizens',
      aartis: {
        'Prakshalana Pooja': '5:30 AM',
        'Morning Maha Aarti': '7:30 AM',
        'Madhyan Pooja': '12:00 PM',
        'Evening Haripath': '7:30 PM',
        'Evening Maha Aarti': '8:30 PM',
        'Shej Aarti': '10:00 PM',
      },
    },
  },
  {
    id: 'mahaganapati_ranjangaon',
    condition: { any: ['mahaganapati', 'ranjangaon', 'ranjangaon ganpati'] },
    darshan: {
      opening: '5:00 AM',
      closing: '10:30 PM',
      generalDarshan: '5:00 AM – 10:30 PM continuous (Located directly on Pune-Ahmednagar Highway with ample parking)',
      vipDarshan: 'Satyavinayak Puja & E-Darshan booking via Shree Kshetra Ranjangaon Devasthan Trust',
      aartis: {
        'Morning Abhishek': '5:30 AM',
        'Morning Samudaik Aarti': '7:30 AM',
        'Madhyan Mahapuja': '11:30 AM',
        'Evening Samudaik Aarti': '7:30 PM',
        'Shej Aarti': '10:00 PM',
      },
    },
  },
  {
    id: 'mahalakshmi_mumbai',
    condition: { any: ['mahalakshmi mumbai', 'mahalakshmi temple mumbai', 'mahalaxmi mumbai'] },
    darshan: {
      opening: '6:00 AM',
      closing: '10:00 PM',
      generalDarshan: '6:00 AM – 10:00 PM continuous (closed during specific Aarti & Bhog breaks)',
      vipDarshan: 'Special Senior Citizen / Differently-Abled entry line',
      aartis: {
        'Morning Aarti': '6:45 AM – 7:30 AM',
        'Naivedya (Sacred Offering)': '11:45 AM – 12:20 PM',
        'Evening Dhoop Aarti': '6:15 PM – 6:40 PM',
        'Evening Main Aarti': '7:20 PM – 7:45 PM',
      },
    },
  },
  {
    id: 'mumbadevi_mumbai',
    condition: { any: ['mumbadevi', 'mumba devi', 'mumbadevi temple mumbai'] },
    darshan: {
      opening: '6:00 AM',
      closing: '9:00 PM',
      generalDarshan: '6:00 AM – 9:00 PM (Closed on Mondays till 12 PM for clean-up)',
      vipDarshan: 'Direct Queue Pass via Mumbadevi Temple Trust Counter',
      aartis: {
        'Morning Mangala Aarti': '6:30 AM',
        'Madhyan Bhog Aarti': '12:00 PM',
        'Evening Aarti': '7:30 PM',
        'Shej Aarti': '9:00 PM',
      },
    },
  },
  {
    id: 'naina_devi_nainital',
    condition: { any: ['naina devi', 'nainadevi nainital', 'naina devi temple'] },
    darshan: {
      opening: '6:00 AM',
      closing: '10:00 PM',
      generalDarshan: '6:00 AM – 10:00 PM (Summer: 6 AM - 10 PM, Winter: 7 AM - 9 PM)',
      vipDarshan: 'Direct sanctum queue line for pilgrims',
      aartis: {
        'Prata Aarti': '6:00 AM',
        'Bhog Aarti': '12:00 PM',
        'Sandhya Aarti': '6:30 PM',
        'Shayan Aarti': '9:30 PM',
      },
    },
  },
  {
    id: 'dhari_devi_uttarakhand',
    condition: { any: ['dhari devi', 'dharidevi', 'dhari devi temple'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:00 PM',
      generalDarshan: '6:00 AM – 8:00 PM continuous river platform darshan',
      vipDarshan: 'Special Pujaris assistance for Chandi Path & Abhishek',
      aartis: {
        'Prata Mangala Aarti': '6:00 AM',
        'Madhyan Bhog': '12:00 PM',
        'Evening Sandhya Aarti': '7:00 PM',
      },
    },
  },
  {
    id: 'kasar_devi_almora',
    condition: { any: ['kasar devi', 'kasardevi', 'kasar devi temple'] },
    darshan: {
      opening: '6:00 AM',
      closing: '7:00 PM',
      generalDarshan: '6:00 AM – 7:00 PM hilltop shrine darshan',
      vipDarshan: 'Peaceful open courtyard meditation & prayer space',
      aartis: {
        'Morning Sunrise Aarti': '6:00 AM',
        'Evening Sunset Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'purnagiri_champawat',
    condition: { any: ['purnagiri', 'purnagiri temple', 'punyagiri champawat'] },
    darshan: {
      opening: '5:00 AM',
      closing: '8:00 PM',
      generalDarshan: '5:00 AM – 8:00 PM hill peak darshan (24 hours open during Navratri Fair)',
      vipDarshan: 'Token system during Chaitra Navratri Fair',
      aartis: {
        'Mangala Prata Aarti': '5:30 AM',
        'Madhyan Bhog Aarti': '12:00 PM',
        'Sandhya Maha Aarti': '6:30 PM',
      },
    },
  },
  {
    id: 'hidimba_devi_manali',
    condition: { any: ['hidimba devi', 'hadimba temple', 'hidimba manali'] },
    darshan: {
      opening: '8:00 AM',
      closing: '6:00 PM',
      generalDarshan: '8:00 AM – 6:00 PM continuous wooden cave temple darshan',
      vipDarshan: 'Direct walk-in queue inside cedar forest park',
      aartis: {
        'Morning Puja & Aarti': '8:30 AM',
        'Evening Sandhya Aarti': '5:30 PM',
      },
    },
  },
  {
    id: 'kalika_mata_pavagadh',
    condition: { any: ['kalika mata pavagadh', 'pavagadh mahakali', 'kalika mata temple'] },
    darshan: {
      opening: '6:00 AM',
      closing: '8:00 PM',
      generalDarshan: '6:00 AM – 8:00 PM (Pavagadh Ropeway runs 6:00 AM – 6:00 PM)',
      vipDarshan: 'Express Ropeway ticket holders & senior citizen priority',
      aartis: {
        'Pratatah Mangala Aarti': '6:00 AM',
        'Madhyan Bhog Aarti': '12:00 PM',
        'Sandhya Aarti': '7:30 PM',
      },
    },
  },
];






