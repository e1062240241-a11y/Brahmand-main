import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface DiwaliCityMuhurat {
  id: string;
  cityName: string;
  hindiCity: string;
  state: string;
  muhurat: string;
  startTime: string;
  endTime: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export interface CityDetectionResult {
  city: DiwaliCityMuhurat;
  isAutoDetected: boolean;
  method?: 'manual' | 'gps' | 'profile' | 'fallback';
}

export const STORAGE_KEY_DIWALI_CITY = '@diwali_selected_city';

// Verified Drik Panchang Timings from Diwali 2026 Muhurat & Puja Guide (8 November 2026)
// Calculated for New Delhi and major Indian metropolitan centers based on local Sunset and Vrishabha Sthir Lagna.
export const DIWALI_CITIES: DiwaliCityMuhurat[] = [
  {
    id: 'delhi',
    cityName: 'New Delhi',
    hindiCity: 'नई दिल्ली / NCR',
    state: 'Delhi',
    muhurat: '5:54 PM – 7:50 PM',
    startTime: '5:54 PM',
    endTime: '7:50 PM',
    lat: 28.6139,
    lng: 77.2090,
    aliases: ['delhi', 'new delhi', 'dilli', 'ncr', 'नई दिल्ली', 'दिल्ली'],
  },
  {
    id: 'noida',
    cityName: 'Noida',
    hindiCity: 'नोएडा',
    state: 'Uttar Pradesh',
    muhurat: '5:54 PM – 7:49 PM',
    startTime: '5:54 PM',
    endTime: '7:49 PM',
    lat: 28.5355,
    lng: 77.3910,
    aliases: ['noida', 'greater noida', 'नोएडा', 'ग्रेटर नोएडा'],
  },
  {
    id: 'gurugram',
    cityName: 'Gurugram',
    hindiCity: 'गुरुग्राम / Gurgaon',
    state: 'Haryana',
    muhurat: '5:55 PM – 7:51 PM',
    startTime: '5:55 PM',
    endTime: '7:51 PM',
    lat: 28.4595,
    lng: 77.0266,
    aliases: ['gurgaon', 'gurugram', 'गुरुग्राम', 'गुडगाँव'],
  },
  {
    id: 'chandigarh',
    cityName: 'Chandigarh',
    hindiCity: 'चंडीगढ़',
    state: 'Punjab / Haryana',
    muhurat: '5:52 PM – 7:46 PM',
    startTime: '5:52 PM',
    endTime: '7:46 PM',
    lat: 30.7333,
    lng: 76.7794,
    aliases: ['chandigarh', 'mohali', 'panchkula', 'चंडीगढ़'],
  },
  {
    id: 'mumbai',
    cityName: 'Mumbai',
    hindiCity: 'मुंबई',
    state: 'Maharashtra',
    muhurat: '6:27 PM – 8:27 PM',
    startTime: '6:27 PM',
    endTime: '8:27 PM',
    lat: 19.0760,
    lng: 72.8777,
    aliases: ['mumbai', 'bombay', 'thane', 'navi mumbai', 'मुंबई', 'बॉम्बे'],
  },
  {
    id: 'pune',
    cityName: 'Pune',
    hindiCity: 'पुणे',
    state: 'Maharashtra',
    muhurat: '6:24 PM – 8:24 PM',
    startTime: '6:24 PM',
    endTime: '8:24 PM',
    lat: 18.5204,
    lng: 73.8567,
    aliases: ['pune', 'poona', 'पुणे'],
  },
  {
    id: 'ahmedabad',
    cityName: 'Ahmedabad',
    hindiCity: 'अहमदाबाद',
    state: 'Gujarat',
    muhurat: '6:22 PM – 8:20 PM',
    startTime: '6:22 PM',
    endTime: '8:20 PM',
    lat: 23.0225,
    lng: 72.5714,
    aliases: ['ahmedabad', 'amdavad', 'gandhinagar', 'अहमदाबाद', 'अमदावाद'],
  },
  {
    id: 'jaipur',
    cityName: 'Jaipur',
    hindiCity: 'जयपुर',
    state: 'Rajasthan',
    muhurat: '6:03 PM – 7:59 PM',
    startTime: '6:03 PM',
    endTime: '7:59 PM',
    lat: 26.9124,
    lng: 75.7873,
    aliases: ['jaipur', 'pink city', 'जयपुर'],
  },
  {
    id: 'kolkata',
    cityName: 'Kolkata',
    hindiCity: 'कोलकाता',
    state: 'West Bengal',
    muhurat: '5:20 PM – 7:18 PM',
    startTime: '5:20 PM',
    endTime: '7:18 PM',
    lat: 22.5726,
    lng: 88.3639,
    aliases: ['kolkata', 'calcutta', 'howrah', 'कोलकाता', 'कलकत्ता'],
  },
  {
    id: 'chennai',
    cityName: 'Chennai',
    hindiCity: 'चेन्नई',
    state: 'Tamil Nadu',
    muhurat: '6:07 PM – 8:09 PM',
    startTime: '6:07 PM',
    endTime: '8:09 PM',
    lat: 13.0827,
    lng: 80.2707,
    aliases: ['chennai', 'madras', 'चेन्नई', 'मद्रास'],
  },
  {
    id: 'hyderabad',
    cityName: 'Hyderabad',
    hindiCity: 'हैदराबाद',
    state: 'Telangana',
    muhurat: '6:07 PM – 8:08 PM',
    startTime: '6:07 PM',
    endTime: '8:08 PM',
    lat: 17.3850,
    lng: 78.4867,
    aliases: ['hyderabad', 'secunderabad', 'हैदराबाद', 'सिकंदराबाद'],
  },
  {
    id: 'bengaluru',
    cityName: 'Bengaluru',
    hindiCity: 'बेंगलुरु / Bangalore',
    state: 'Karnataka',
    muhurat: '6:17 PM – 8:20 PM',
    startTime: '6:17 PM',
    endTime: '8:20 PM',
    lat: 12.9716,
    lng: 77.5946,
    aliases: ['bangalore', 'bengaluru', 'बेंगलुरु', 'बैंगलोर'],
  },
];

export const DIWALI_2026_CONFIG = {
  festivalName: 'Diwali 2026',
  hindiFestivalName: 'शुभ दीपावली 2026',
  dateString: 'Sunday, 8 November 2026',
  hindiDateString: 'रविवार, 8 नवंबर 2026 (कार्तिक कृष्ण अमावस्या)',
  tithi: 'कार्तिक कृष्ण अमावस्या',
  amavasyaStart: '11:27 AM on 8 Nov 2026',
  amavasyaEnd: '12:31 PM on 9 Nov 2026',
  mainPujaMuhurat: '5:54 PM to 7:50 PM',
  pujaDuration: '1 hr 56 min',
  pradoshKaal: '5:31 PM to 8:09 PM',
  vrishabhaLagna: '5:54 PM to 7:50 PM (स्थिर लग्न — ताकि लक्ष्मी घर में स्थिर रहें)',
  abhyangSnan: '5:41 AM to 6:38 AM (सूर्योदय से पूर्व, चंद्रोदय काल में)',
  sunrise: '6:37 AM',
  sunset: '5:31 PM',
  sunsetRule: 'यदि आपका शहर सूची में नहीं है, तो अपने स्थानीय सूर्यास्त समय में लगभग 23 मिनट जोड़ें।',
};

// 5-Day Festive Calendar from PDF
export const DIWALI_5_DAYS = [
  {
    day: 'Dhanteras',
    hindiDay: 'धनतेरस / धन्वंतरि जयंती',
    date: 'Fri, 6 Nov 2026',
    tithiDesc: 'त्रयोदशी 10:30 AM से आरंभ। लक्ष्मी-कुबेर पूजा 6:02–7:57 PM (प्रदोष काल 5:33–8:09 PM)। यम दीपदान: दक्षिण दिशा की ओर एक दीपक घर के मुख्य द्वार पर जलाएं।',
    action: 'सोना-चांदी, बर्तन खरीदारी, धन्वंतरि व कुबेर पूजन और यम दीपदान।',
    icon: 'sparkles',
  },
  {
    day: 'Kali Chaudas / Choti Diwali',
    hindiDay: 'काली चौदस / छोटी दिवाली',
    date: 'Sat, 7 Nov 2026',
    tithiDesc: 'चतुर्दशी 10:47 AM से। निशिता काल में काली पूजा 11:39 PM–12:31 AM (7-8 नवंबर की रात)।',
    action: 'दीपोत्सव के पहले दिए जलाएं और नकारात्मक ऊर्जा के निवारण हेतु माँ काली की आराधना करें।',
    icon: 'moon',
  },
  {
    day: 'Narak Chaturdashi & Diwali',
    hindiDay: 'नरक चतुर्दशी एवं मुख्य दीपावली',
    date: 'Sun, 8 Nov 2026',
    tithiDesc: 'कार्तिक कृष्ण अमावस्या तिथि। स्थिर वृषभ लग्न एवं प्रदोष काल में महालक्ष्मी पूजन का मुख्य पावन दिवस।',
    action: 'सूर्योदय पूर्व अभ्यंग स्नान, संध्या समय महालक्ष्मी-गणेश व कुबेर पूजन, बही-खाता पूजन एवं दीपदान।',
    icon: 'flame',
  },
  {
    day: 'Gap Day',
    hindiDay: 'अमावस्या वृद्धि (विश्राम दिवस)',
    date: 'Mon, 9 Nov 2026',
    tithiDesc: 'अमावस्या तिथि दोपहर 12:31 PM तक चलेगी। इस दिन कोई विशेष धार्मिक पर्व नहीं है; कई राज्यों में सार्वजनिक अवकाश।',
    action: 'पारिवारिक मिलन, दीप प्रज्वलन व अन्नदान।',
    icon: 'calendar',
  },
  {
    day: 'Govardhan Puja / Annakut',
    hindiDay: 'गोवर्धन पूजा / अन्नकूट / गुजराती नूतन वर्ष',
    date: 'Tue, 10 Nov 2026',
    tithiDesc: 'कार्तिक शुक्ल प्रतिपदा (9 Nov 12:31 PM से 10 Nov 2:00 PM तक)। गोवर्धन पूजा प्रातःकाल मुहूर्त: 6:40 AM – 8:50 AM (अवधि 2 घंटे 10 मिनट)।',
    action: 'गाय के गोबर से गोवर्धन पर्वत बनाकर पूजन, 56 भोग अन्नकूट समर्पण, सप्त परिक्रमा व नए बही-खाता पूजन।',
    icon: 'flower',
  },
  {
    day: 'Bhai Dooj',
    hindiDay: 'भाई दूज / यम द्वितीया',
    date: 'Wed, 11 Nov 2026',
    tithiDesc: 'द्वितीया दोपहर 3:53 PM तक। भाई दूज तिलक अपराह्न काल में: 1:10 PM–3:20 PM।',
    action: 'बहनें भाइयों को तिलक लगाकर उनकी दीर्घायु व सुख की मंगलकामना करती हैं।',
    icon: 'heart',
  },
];

// Choghadiya & Rahu Kaal for 8 November 2026
export const DIWALI_CHOGHADIYA_2026 = {
  auspicious: [
    { name: 'लाभ (Laabh)', time: '9:21 AM – 10:43 AM', desc: 'व्यवसाय व मांगलिक कार्यों हेतु उत्तम' },
    { name: 'अमृत (Amrit)', time: '10:43 AM – 12:04 PM', desc: 'सर्वश्रेष्ठ अमृत मुहूर्त, हर कार्य सिद्धि' },
    { name: 'शुभ (Shubh)', time: '1:26 PM – 2:48 PM', desc: 'मांगलिक आयोजन व खरीदारी हेतु शुभ' },
  ],
  avoid: [
    { name: 'राहु काल (Rahu Kaal)', time: '4:09 PM – 5:31 PM', desc: 'कोई भी नया या शुभ कार्य न करें' },
    { name: 'गुलिक काल (Gulika)', time: '2:48 PM – 4:09 PM', desc: 'वर्जित समय' },
    { name: 'यमगण्ड (Yamaganda)', time: '12:04 PM – 1:26 PM', desc: 'वर्जित समय' },
  ],
  eveningNote: 'शाम का मुख्य पूजा मुहूर्त (5:54–7:50 PM) राहु काल के बाहर है, अतः इसमें कोई दोष नहीं है — पूजा इसी स्थिर लग्न में करें।',
};

// Small Points That Matter (Dos & Don'ts from PDF Page 3)
export const DIWALI_RULES_NIYAM = [
  'पूजा निश्चित मुहूर्त (5:54–7:50 PM) में ही करें — स्थिर वृषभ लग्न ही धन की स्थिरता का मुख्य कारण है। इसे रात 8 बजे के बाद न टालें।',
  'यदि आपके पंचांग में शाम को सिंह काल दिया गया हो, तो उससे बचें और वृषभ लग्न में ही पूजा करें; धन के लिए चर की अपेक्षा स्थिर लग्न श्रेष्ठ है।',
  'गणेश जी की पूजा सदैव माँ लक्ष्मी से पहले करें। गणेश जी के बिना की गई लक्ष्मी पूजा अधूरी मानी जाती है।',
  'पूजा करते समय पूर्व या उत्तर-पूर्व (ईशान) दिशा की ओर मुख करें; मूर्तियों को चौकी या ऊंचे आसन पर रखें, सीधे फर्श पर कभी न रखें।',
  'माँ लक्ष्मी या गणेश जी को तुलसी दल कभी न चढ़ाएं — तुलसी केवल भगवान विष्णु को प्रिय है। भोग में प्याज, लहसुन, मदिरा या तामसिक वस्तुएं वर्जित हैं।',
  'पूजा का दीपक दक्षिण दिशा की ओर न रखें; दक्षिण दिशा यम की दिशा है। दीपक को मूर्ति के दाईं ओर रखें।',
  'शाम को गोधूलि वेला में, अंधेरा होने से पहले ही घर के सभी दिए जलाएं और हर कमरे, बालकनी और सीढ़ी पर रोशनी करें — दीवाली का अर्थ ही अंधेरे कोने को मिटाना है।',
  'संध्या पूजा के बाद घर में झाड़ू न लगाएं और उस रात घर से कोई भी वस्तु बाहर न फेंकें।',
  'दीपावली के दिन किसी को कर्ज न दें और न ही लें; अपनी तिजोरी या लॉकर को हल्का सा खुला रखें और बही-खाते पूजा वेदी पर रखें।',
  'पूजा के समय घर का मुख्य द्वार बंद न रखें — इसे खुला या थोड़ा खुला रखें ताकि माँ लक्ष्मी का प्रवेश हो सके।',
  'पूजा के समय कोई कलह, रोना, बच्चों को डांटना या सोना पूरी तरह वर्जित है। घर में शांति और आनंद का वातावरण रखें।',
  'टूटे-फूटे बर्तन रसोई या घर में न रखें; चूल्हे पर कभी भी खाली बर्तन न छोड़ें।',
  'धनतेरस पर सोना, चांदी, तांबा या पीतल के बर्तन खरीदें; इस दिन धारदार लोहे की वस्तुएं (चाकू, कैंची, ब्लेड) खरीदने से बचें।',
  'पटाखे: स्थानीय दिशानिर्देशों का पालन करें और पूजा कक्ष तथा छोटे बच्चों से सुरक्षित दूरी पर ही सावधानीपूर्वक आतिशबाजी करें।',
];

// Two Things to Know About 2026 (from PDF Page 3)
export const DIWALI_2026_SPECIAL_NOTES = [
  {
    title: '1. 2026 में दिवाली अत्यधिक विलंब (Late) से क्यों है?',
    content: 'वर्ष 2026 में अधिक मास (अधिक ज्येष्ठ मास, मध्य मई से मध्य जून 2026) पड़ने के कारण कार्तिक अमावस्या अपने सामान्य 2025 के समय से लगभग 19 दिन आगे खिसक गई है। इसी कारण यह महापर्व अक्टूबर के अंत में न होकर 8 नवंबर को पड़ा है।',
  },
  {
    title: '2. पंचांग भेद: गोवर्धन पूजा और भाई दूज की तिथियाँ',
    content: 'दृक पंचांग (Drik Panchang) के अनुसार गोवर्धन पूजा मंगलवार, 10 नवंबर 2026 को है। कार्तिक शुक्ल प्रतिपदा तिथि 9 नवंबर दोपहर 12:31 PM से शुरू होकर 10 नवंबर दोपहर 2:00 PM तक रहेगी, इसलिए प्रातःकाल पूजा का शुभ मुहूर्त 10 नवंबर को ही है — प्रातःकाल 6:40 AM से 8:50 AM (अवधि: 2 घंटे 10 मिनट)। भाई दूज बुधवार, 11 नवंबर 2026 को मनाई जाएगी।',
  },
];

// Dedicated Govardhan Puja 2026 Config (Drik Panchang)
export const GOVARDHAN_PUJA_2026_CONFIG = {
  festivalName: 'Govardhan Puja 2026',
  hindiFestivalName: 'गोवर्धन पूजा / अन्नकूट 2026',
  day: 'Tuesday',
  hindiDay: 'मंगलवार',
  dateString: 'Tuesday, 10 November 2026',
  hindiDateString: 'मंगलवार, 10 नवंबर 2026 (कार्तिक शुक्ल प्रतिपदा)',
  tithi: 'कार्तिक शुक्ल प्रतिपदा',
  tithiStart: '9 Nov 2026, 12:31 PM',
  tithiEnd: '10 Nov 2026, 2:00 PM',
  tithiExplanation: 'कार्तिक शुक्ल प्रतिपदा तिथि 9 नवंबर 12:31 PM से शुरू होकर 10 नवंबर 2:00 PM तक रहेगी, इसी लिए प्रातःकाल पूजा मुहूर्त 10 नवंबर का ही है।',
  pratahkaalMuhurat: '6:40 AM – 8:50 AM',
  pujaDuration: '2 घंटे 10 मिनट',
  drikpanchangReference: 'Drik Panchang',
};

// Haversine distance calculator
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function detectUserDiwaliCity(user?: any): Promise<CityDetectionResult> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_DIWALI_CITY);
    if (saved) {
      const found = DIWALI_CITIES.find((c) => c.id === saved);
      if (found) {
        return { city: found, isAutoDetected: false, method: 'manual' };
      }
    }
  } catch (_e) { }

  if (user?.city || user?.location) {
    const raw = String(user.city || user.location).trim().toLowerCase();
    for (const c of DIWALI_CITIES) {
      if (c.aliases.some((a) => raw.includes(a) || a.includes(raw))) {
        return { city: c, isAutoDetected: true, method: 'profile' };
      }
    }
  }

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getLastKnownPositionAsync({});
      if (pos?.coords) {
        let closest = DIWALI_CITIES[0];
        let minDist = Infinity;
        for (const c of DIWALI_CITIES) {
          const dist = getDistanceKm(pos.coords.latitude, pos.coords.longitude, c.lat, c.lng);
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        }
        return { city: closest, isAutoDetected: true, method: 'gps' };
      }
    }
  } catch (_e) { }

  return { city: DIWALI_CITIES[0], isAutoDetected: true, method: 'fallback' };
}

