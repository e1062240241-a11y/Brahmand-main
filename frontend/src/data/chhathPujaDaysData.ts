export interface ChhathDayDetail {
  day: number;
  name: string;
  nameHi: string;
  dateStr: string;
  tithi: string;
  tagline: string;
  themeColor: string;
  bgGradient: [string, string];
  icon: string;
  meaning: string;
  description: string;
  keyRituals: {
    title: string;
    desc: string;
    icon: string;
  }[];
  prasad: string;
  fastingRule: string;
}

export const CHHATH_PUJA_4_DAYS: ChhathDayDetail[] = [
  {
    day: 1,
    name: 'Nahay Khay',
    nameHi: 'नहाय-खाय',
    dateStr: 'Friday, 13 November 2026',
    tithi: 'कार्तिक शुक्ल चतुर्थी',
    tagline: 'पवित्र स्नान, शुद्धता का संकल्प व सात्विक लौकी-भात भोग',
    themeColor: '#EA580C',
    bgGradient: ['#FFF7ED', '#FED7AA'],
    icon: 'water',
    meaning: 'The name means "bathe and eat".',
    description:
      'The name means "bathe and eat". The parvaitin takes a purifying bath, traditionally in the Ganga or the nearest river or pond, ideally before sunrise, and brings water home from the same water body. The house, the kitchen, the courtyard and the path to the ghat are cleaned. An earthen or new stove is made - in strict households, with that river water - and from this day all the festival food is cooked on it.\n\nOnly one meal is eaten, in the afternoon: lauki bhaat, bottle gourd cooked with chana dal and served with arva rice, cooked without onion or garlic and offered to the deity first. In many families the day also marks the formal start of the vow, with the woman who is taking it up receiving the blessings of the household.',
    keyRituals: [
      {
        title: 'Purifying River Bath',
        desc: 'Parvaitin bathes before sunrise in Ganga or sacred river/pond, and carries holy water home for festival cooking.',
        icon: 'water-outline',
      },
      {
        title: 'New Earthen Stove (Mitti Ka Chulha)',
        desc: 'A new earthen stove is prepared with river water. All festival offerings from this day onward are cooked exclusively on it with mango wood.',
        icon: 'flame-outline',
      },
      {
        title: 'Sacred Lauki Bhaat Meal',
        desc: 'Single meal eaten in the afternoon: pure bottle gourd cooked with chana dal and arva rice without onion/garlic, offered to the deity first.',
        icon: 'restaurant-outline',
      },
      {
        title: 'Formal Start of the Vow (Sankalp)',
        desc: 'The devotee formally takes up the sacred vow of Chhath, receiving the elder blessings of the household.',
        icon: 'heart-outline',
      },
    ],
    prasad: 'कद्दू-भात (लौकी की सब्जी, चना दाल, अरवा चावल) व सेंधा नमक',
    fastingRule: 'Single pure meal eaten in the afternoon after holy bath and puja.',
  },
  {
    day: 2,
    name: 'Lohanda and Kharna',
    nameHi: 'लोहंडा व खरना',
    dateStr: 'Saturday, 14 November 2026',
    tithi: 'कार्तिक शुक्ल पंचमी',
    tagline: 'दिनभर का निर्जला उपवास, संध्या गुड़ खीर-रोटी भोग व 36 घंटे के महाव्रत का आरंभ',
    themeColor: '#D97706',
    bgGradient: ['#FFFBEB', '#FDE68A'],
    icon: 'moon',
    meaning: 'The sacred meal before the 36-hour grand fast begins.',
    description:
      'A day-long fast without water, broken only after sunset. In the evening the parvaitin cooks gud ki kheer (rice pudding with jaggery) and roti, offers it first, and then eats - this is kharna, the last meal before the long fast. The prasad is shared with family. From this moment begins the 36-hour nirjala vrat, with no food and no water at all until sunrise on the fourth day.\n\nKharna is also the day the festival\'s kitchen goes into full production. Thekuas are rolled and fried in ghee, and in many homes a small mud altar called the bedi is prepared near the ghat or in the courtyard and decorated, an act described in the folk tradition as waking Chhathi Maiya for the days ahead.',
    keyRituals: [
      {
        title: 'Day-Long Fast Without Water',
        desc: 'Devotees observe a strict fast without even a drop of water through the entire day until after sunset.',
        icon: 'hourglass-outline',
      },
      {
        title: 'Evening Kharna Meal (Gud Ki Kheer & Roti)',
        desc: 'Cooked on a clean earthen stove with sugarcane jaggery (gud), milk, and wheat roti, offered in silence to Chhathi Maiya and shared with family.',
        icon: 'sparkles-outline',
      },
      {
        title: 'Commencement of 36-Hour Nirjala Vrat',
        desc: 'Immediately following Kharna prasad, the unbroken 36-hour waterless fast begins until morning Arghya on Day 4.',
        icon: 'shield-checkmark-outline',
      },
      {
        title: 'Thekua Kitchen Production & Bedi Altar',
        desc: 'Traditional Thekuas are rolled and fried in pure ghee. A consecrated mud altar (Bedi) is prepared to wake Chhathi Maiya for the sacred days ahead.',
        icon: 'nutrition-outline',
      },
    ],
    prasad: 'गुड़ की खीर (रसियाव), शुद्ध घी चुपड़ी रोटी, केला व ठेकुआ',
    fastingRule: 'Day-long fast broken post-sunset; then uninterrupted 36-hour Nirjala fast begins.',
  },
  {
    day: 3,
    name: 'Sandhya Arghya',
    nameHi: 'संध्या अर्घ्य (पहला अर्घ्य)',
    dateStr: 'Sunday, 15 November 2026',
    tithi: 'कार्तिक शुक्ल षष्ठी',
    tagline: 'अस्ताचलगामी सूर्य को अर्घ्य, सूप समर्पण व रात्रि कोसी जागरण',
    themeColor: '#C2410C',
    bgGradient: ['#FFF1F2', '#FECDD3'],
    icon: 'sunny',
    meaning: 'Offering Arghya to the setting sun — the only festival in the world honoring sunset.',
    description:
      'The main day. The ghat is decorated with sugarcane stalks, banana stems, marigold, rangoli and rows of earthen lamps; in towns, the roads to the river are cleaned and barricaded days in advance. Each parvaitin carries a soop, a bamboo winnowing basket, loaded with thekua, raw rice, coconut, sugarcane, and whole seasonal fruit.\n\nAt sunset the devotees stand in the water - waist deep where the river allows, or in a small temporary pool built at home - raise the soop towards the sun and offer arghya while a family member pours water or milk over it. This is the only time in the year when the setting sun receives arghya. Folk songs run through the whole evening.\n\nThe fast continues through the night. In many places a kosi or mandap is built of sugarcane stalks and lit with earthen lamps, and women keep vigil around it, singing in Bhojpuri, Maithili or Magahi until dawn. It is a night of company rather than sleep, and in the villages of Bihar it is the loudest night of the year.',
    keyRituals: [
      {
        title: 'Ghat Decoration & Journey to River',
        desc: 'Ghats are decorated with sugarcane stalks, banana stems, marigolds, and earthen lamps. Devotees carry the sacred Daura on their heads.',
        icon: 'trail-sign-outline',
      },
      {
        title: 'The Bamboo Soop (Loaded Offerings)',
        desc: 'Each parvaitin carries a bamboo winnowing soop loaded with fresh Thekua, raw rice, coconut with sindoor, sugarcane, and seasonal fruits.',
        icon: 'basket-outline',
      },
      {
        title: 'Sunset Arghya in Waist-Deep Water',
        desc: 'Devotees stand in the sacred river, raising the soop towards the setting sun while family members pour holy water and cow milk over the offerings.',
        icon: 'flame-outline',
      },
      {
        title: 'Nightlong Kosi Mandap Vigil',
        desc: 'A canopy (Kosi) of sugarcane stalks is lit with 24 or 36 earthen diyas. Women stay awake all night singing folk songs in Bhojpuri, Maithili, and Magahi.',
        icon: 'musical-notes-outline',
      },
    ],
    prasad: 'सूप में सजा ठेकुआ, भुसवा, नारियल, ईख, कच्चा केला, डाभ नींबू व मौसमी फल',
    fastingRule: 'Complete Nirjala fast (no food, no water) through day and night.',
  },
  {
    day: 4,
    name: 'Usha Arghya and Parana',
    nameHi: 'उषा अर्घ्य व पारण (समापन)',
    dateStr: 'Monday, 16 November 2026',
    tithi: 'कार्तिक शुक्ल सप्तमी',
    tagline: 'उदीयमान सूर्य को प्रातः अर्घ्य, 36 घंटे के व्रत का पारण व प्रसाद वितरण',
    themeColor: '#B45309',
    bgGradient: ['#FFFBEB', '#FDE68A'],
    icon: 'sunny-outline',
    meaning: 'Greeting the rising sun, ending the 36-hour fast, and widespread prasad sharing.',
    description:
      'Before sunrise the same group returns to the same water, this time to greet the rising sun. The arghya is offered again, the soop raised to the first light. With that, the 36-hour fast ends. The parvaitin breaks it - parana - with prasad, usually a little of the kheer and roti kept from kharna or the thekua offered at the ghat, and then distributes prasad to family, neighbours and anyone who asks. The household then eats, and the festival closes.',
    keyRituals: [
      {
        title: 'Pre-Dawn River Assembly',
        desc: 'Devotees gather at the ghat before dawn with freshly prepared offerings in the decorated soop, eagerly awaiting the first golden rays.',
        icon: 'partly-sunny-outline',
      },
      {
        title: 'Morning Arghya to Surya Dev',
        desc: 'As the sun crests the horizon, devotees raise the soop towards the rising light, offering milk and holy water with heartfelt prayers.',
        icon: 'sunny-outline',
      },
      {
        title: 'Parana (Breaking the 36-Hour Fast)',
        desc: 'The Parvaitin breaks the fast with raw milk, ginger, sprouted gram, kheer, and the sacred Thekua prasad, concluding the grand penance.',
        icon: 'trophy-outline',
      },
      {
        title: 'Prasad Vitran to All',
        desc: 'The auspicious Thekua and fruit prasad is distributed freely to family, neighbours, and everyone present before the household festive feast begins.',
        icon: 'people-outline',
      },
    ],
    prasad: 'पवित्र ठेकुआ, कसासार, अदरक-गुड़, कच्चा दूध व अर्घ्य का प्रसाद',
    fastingRule: '36-hour fast successfully completed at sunrise; broken with sacred Parana.',
  },
];

