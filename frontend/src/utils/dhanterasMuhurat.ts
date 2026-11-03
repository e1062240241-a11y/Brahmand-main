import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface DhanterasCityMuhurat {
  id: string;
  cityName: string;
  hindiCity: string;
  state: string;
  muhurat: string;
  startTime: string;
  endTime: string;
  pradoshKaal: string;
  vrishabhaLagna: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export interface CityDetectionResult {
  city: DhanterasCityMuhurat;
  isAutoDetected: boolean;
  method?: 'manual' | 'gps' | 'profile' | 'fallback';
}

export const STORAGE_KEY_DHANTERAS_CITY = '@dhanteras_selected_city';

// Verified Drik Panchang Timings for Dhanteras Puja (6 November 2026)
// Calculated according to local Sunset (Suryast), Pradosh Kaal, and Vrishabha Sthir Lagna.
export const DHANTERAS_CITIES: DhanterasCityMuhurat[] = [
  {
    id: 'delhi',
    cityName: 'New Delhi',
    hindiCity: 'नई दिल्ली / NCR',
    state: 'Delhi',
    muhurat: '6:02 PM – 7:57 PM',
    startTime: '6:02 PM',
    endTime: '7:57 PM',
    pradoshKaal: '5:33 PM – 8:09 PM',
    vrishabhaLagna: '6:02 PM – 7:57 PM',
    lat: 28.6139,
    lng: 77.2090,
    aliases: ['delhi', 'new delhi', 'dilli', 'ncr', 'नई दिल्ली', 'दिल्ली'],
  },
  {
    id: 'noida',
    cityName: 'Noida',
    hindiCity: 'नोएडा',
    state: 'Uttar Pradesh',
    muhurat: '6:01 PM – 7:57 PM',
    startTime: '6:01 PM',
    endTime: '7:57 PM',
    pradoshKaal: '5:32 PM – 8:08 PM',
    vrishabhaLagna: '6:01 PM – 7:57 PM',
    lat: 28.5355,
    lng: 77.3910,
    aliases: ['noida', 'greater noida', 'नोएडा', 'ग्रेटर नोएडा'],
  },
  {
    id: 'gurugram',
    cityName: 'Gurugram',
    hindiCity: 'गुरुग्राम',
    state: 'Haryana',
    muhurat: '6:03 PM – 7:59 PM',
    startTime: '6:03 PM',
    endTime: '7:59 PM',
    pradoshKaal: '5:34 PM – 8:10 PM',
    vrishabhaLagna: '6:03 PM – 7:59 PM',
    lat: 28.4595,
    lng: 77.0266,
    aliases: ['gurugram', 'gurgaon', 'गुरुग्राम', 'गुड़गांव'],
  },
  {
    id: 'jaipur',
    cityName: 'Jaipur',
    hindiCity: 'जयपुर',
    state: 'Rajasthan',
    muhurat: '6:11 PM – 8:07 PM',
    startTime: '6:11 PM',
    endTime: '8:07 PM',
    pradoshKaal: '5:41 PM – 8:17 PM',
    vrishabhaLagna: '6:11 PM – 8:07 PM',
    lat: 26.9124,
    lng: 75.7873,
    aliases: ['jaipur', 'pink city', 'जयपुर', 'अलवर', 'अजमेर', 'ajmer'],
  },
  {
    id: 'chandigarh',
    cityName: 'Chandigarh',
    hindiCity: 'चंडीगढ़',
    state: 'Punjab / Haryana',
    muhurat: '6:00 PM – 7:54 PM',
    startTime: '6:00 PM',
    endTime: '7:54 PM',
    pradoshKaal: '5:31 PM – 8:06 PM',
    vrishabhaLagna: '6:00 PM – 7:54 PM',
    lat: 30.7333,
    lng: 76.7794,
    aliases: ['chandigarh', 'mohali', 'panchkula', 'ludhiana', 'amritsar', 'चंडीगढ़', 'मोहाली', 'पंचकुला', 'लुधियाना'],
  },
  {
    id: 'lucknow',
    cityName: 'Lucknow',
    hindiCity: 'लखनऊ',
    state: 'Uttar Pradesh',
    muhurat: '5:50 PM – 7:47 PM',
    startTime: '5:50 PM',
    endTime: '7:47 PM',
    pradoshKaal: '5:22 PM – 7:58 PM',
    vrishabhaLagna: '5:50 PM – 7:47 PM',
    lat: 26.8467,
    lng: 80.9462,
    aliases: ['lucknow', 'kanpur', 'लखनऊ', 'कानपुर', 'अयोध्या', 'ayodhya'],
  },
  {
    id: 'varanasi',
    cityName: 'Varanasi',
    hindiCity: 'वाराणसी',
    state: 'Uttar Pradesh',
    muhurat: '5:44 PM – 7:42 PM',
    startTime: '5:44 PM',
    endTime: '7:42 PM',
    pradoshKaal: '5:16 PM – 7:53 PM',
    vrishabhaLagna: '5:44 PM – 7:42 PM',
    lat: 25.3176,
    lng: 82.9739,
    aliases: ['varanasi', 'kashi', 'banaras', 'prayagraj', 'allahabad', 'वाराणसी', 'काशी', 'बनारस', 'प्रयागराज'],
  },
  {
    id: 'patna',
    cityName: 'Patna',
    hindiCity: 'पटना',
    state: 'Bihar',
    muhurat: '5:36 PM – 7:33 PM',
    startTime: '5:36 PM',
    endTime: '7:33 PM',
    pradoshKaal: '5:07 PM – 7:44 PM',
    vrishabhaLagna: '5:36 PM – 7:33 PM',
    lat: 25.5941,
    lng: 85.1376,
    aliases: ['patna', 'gaya', 'muzaffarpur', 'bhagalpur', 'ranchi', 'bihar', 'पटना', 'गया', 'बिहार', 'रांची'],
  },
  {
    id: 'kolkata',
    cityName: 'Kolkata',
    hindiCity: 'कोलकाता',
    state: 'West Bengal',
    muhurat: '5:28 PM – 7:26 PM',
    startTime: '5:28 PM',
    endTime: '7:26 PM',
    pradoshKaal: '4:58 PM – 7:37 PM',
    vrishabhaLagna: '5:28 PM – 7:26 PM',
    lat: 22.5726,
    lng: 88.3639,
    aliases: ['kolkata', 'calcutta', 'howrah', 'durgapur', 'siliguri', 'कोलकाता', 'कलकत्ता', 'हावड़ा'],
  },
  {
    id: 'mumbai',
    cityName: 'Mumbai',
    hindiCity: 'मुंबई',
    state: 'Maharashtra',
    muhurat: '6:35 PM – 8:35 PM',
    startTime: '6:35 PM',
    endTime: '8:35 PM',
    pradoshKaal: '6:07 PM – 8:42 PM',
    vrishabhaLagna: '6:35 PM – 8:35 PM',
    lat: 19.0760,
    lng: 72.8777,
    aliases: ['mumbai', 'bombay', 'thane', 'navi mumbai', 'kalyan', 'मुंबई', 'बंबई', 'ठाणे', 'नवी मुंबई'],
  },
  {
    id: 'pune',
    cityName: 'Pune',
    hindiCity: 'पुणे',
    state: 'Maharashtra',
    muhurat: '6:32 PM – 8:31 PM',
    startTime: '6:32 PM',
    endTime: '8:31 PM',
    pradoshKaal: '6:04 PM – 8:39 PM',
    vrishabhaLagna: '6:32 PM – 8:31 PM',
    lat: 18.5204,
    lng: 73.8567,
    aliases: ['pune', 'poona', 'pcmc', 'nashik', 'नासिक', 'पुणे'],
  },
  {
    id: 'ahmedabad',
    cityName: 'Ahmedabad',
    hindiCity: 'अहमदाबाद',
    state: 'Gujarat',
    muhurat: '6:30 PM – 8:28 PM',
    startTime: '6:30 PM',
    endTime: '8:28 PM',
    pradoshKaal: '5:59 PM – 8:36 PM',
    vrishabhaLagna: '6:30 PM – 8:28 PM',
    lat: 23.0225,
    lng: 72.5714,
    aliases: ['ahmedabad', 'amdavad', 'gandhinagar', 'surat', 'vadodara', 'rajkot', 'अहमदाबाद', 'सूरत', 'वडोदरा', 'राजकोट'],
  },
  {
    id: 'hyderabad',
    cityName: 'Hyderabad',
    hindiCity: 'हैदराबाद',
    state: 'Telangana',
    muhurat: '6:15 PM – 8:13 PM',
    startTime: '6:15 PM',
    endTime: '8:13 PM',
    pradoshKaal: '5:46 PM – 8:22 PM',
    vrishabhaLagna: '6:15 PM – 8:13 PM',
    lat: 17.3850,
    lng: 78.4867,
    aliases: ['hyderabad', 'secunderabad', 'हैदराबाद', 'सिकंदराबाद'],
  },
  {
    id: 'bengaluru',
    cityName: 'Bengaluru',
    hindiCity: 'बेंगलुरु',
    state: 'Karnataka',
    muhurat: '6:25 PM – 8:20 PM',
    startTime: '6:25 PM',
    endTime: '8:20 PM',
    pradoshKaal: '5:54 PM – 8:31 PM',
    vrishabhaLagna: '6:25 PM – 8:20 PM',
    lat: 12.9716,
    lng: 77.5946,
    aliases: ['bengaluru', 'bangalore', 'mysuru', 'बेंगलुरु', 'बैंगलोर'],
  },
  {
    id: 'chennai',
    cityName: 'Chennai',
    hindiCity: 'चेन्नई',
    state: 'Tamil Nadu',
    muhurat: '6:14 PM – 8:10 PM',
    startTime: '6:14 PM',
    endTime: '8:10 PM',
    pradoshKaal: '5:43 PM – 8:20 PM',
    vrishabhaLagna: '6:14 PM – 8:10 PM',
    lat: 13.0827,
    lng: 80.2707,
    aliases: ['chennai', 'madras', 'coimbatore', 'चेन्नई', 'मद्रास'],
  },
];

// Helper to find closest city from coordinates
function findClosestCity(lat: number, lng: number): DhanterasCityMuhurat {
  let closest = DHANTERAS_CITIES[0];
  let minDistance = Number.MAX_VALUE;

  for (const c of DHANTERAS_CITIES) {
    const dLat = c.lat - lat;
    const dLng = c.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = c;
    }
  }
  return closest;
}

// Find city by name or alias
export function findDhanterasCityByName(name: string): DhanterasCityMuhurat | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  return DHANTERAS_CITIES.find(
    (c) =>
      c.id === q ||
      c.cityName.toLowerCase() === q ||
      c.hindiCity.toLowerCase() === q ||
      c.aliases.some((alias) => q.includes(alias) || alias.includes(q))
  );
}

/**
 * Detects user's city for Dhanteras automatically:
 * 1. Checks manually saved selection (if user manually switched)
 * 2. Checks user profile city attribute (user.city, user.location, user.home_location)
 * 3. Checks stored @user_home_location in AsyncStorage
 * 4. Checks device GPS coordinates with reverse geocoding
 * 5. Fallback: New Delhi
 */
export async function detectUserDhanterasCity(user?: any): Promise<CityDetectionResult> {
  // 1. Manually saved city choice
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_DHANTERAS_CITY);
    if (saved) {
      const matched = DHANTERAS_CITIES.find((c) => c.id === saved);
      if (matched) {
        return { city: matched, isAutoDetected: false, method: 'manual' };
      }
    }
  } catch (_e) {}

  // 2. User profile location
  if (user) {
    const candidate =
      user.home_location?.city ||
      user.city ||
      user.current_city ||
      user.location ||
      user.address;
    if (candidate) {
      const matched = findDhanterasCityByName(String(candidate));
      if (matched) {
        return { city: matched, isAutoDetected: true, method: 'profile' };
      }
    }
  }

  // 3. Cached home location from AsyncStorage
  try {
    const rawHome = await AsyncStorage.getItem('@user_home_location');
    if (rawHome) {
      const parsed = JSON.parse(rawHome);
      const cName = parsed?.city || parsed?.name || '';
      if (cName) {
        const matched = findDhanterasCityByName(String(cName));
        if (matched) {
          return { city: matched, isAutoDetected: true, method: 'profile' };
        }
      }
      if (parsed?.lat && parsed?.lng) {
        return {
          city: findClosestCity(Number(parsed.lat), Number(parsed.lng)),
          isAutoDetected: true,
          method: 'profile',
        };
      }
    }
  } catch (_e) {}

  // 4. Device GPS Location (via expo-location)
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 1800000 })) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

      if (pos && pos.coords) {
        const { latitude, longitude } = pos.coords;
        // Attempt reverse geocoding to match city name
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (rev && rev[0]) {
            const revCity = rev[0].city || rev[0].subregion || rev[0].district;
            if (revCity) {
              const matched = findDhanterasCityByName(revCity);
              if (matched) {
                return { city: matched, isAutoDetected: true, method: 'gps' };
              }
            }
          }
        } catch (_revErr) {}

        return {
          city: findClosestCity(latitude, longitude),
          isAutoDetected: true,
          method: 'gps',
        };
      }
    }
  } catch (_e) {}

  // 5. Default fallback: New Delhi
  return { city: DHANTERAS_CITIES[0], isAutoDetected: false, method: 'fallback' };
}

/**
 * Force refresh GPS detection, clearing any manual selection.
 */
export async function forceDetectGpsCity(): Promise<CityDetectionResult> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_DHANTERAS_CITY);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos && pos.coords) {
        const { latitude, longitude } = pos.coords;
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (rev && rev[0]) {
            const revCity = rev[0].city || rev[0].subregion || rev[0].district;
            if (revCity) {
              const matched = findDhanterasCityByName(revCity);
              if (matched) {
                return { city: matched, isAutoDetected: true, method: 'gps' };
              }
            }
          }
        } catch (_revErr) {}

        return {
          city: findClosestCity(latitude, longitude),
          isAutoDetected: true,
          method: 'gps',
        };
      }
    }
  } catch (_e) {}

  return { city: DHANTERAS_CITIES[0], isAutoDetected: false, method: 'fallback' };
}

export async function saveUserDhanterasCity(cityId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_DHANTERAS_CITY, cityId);
  } catch (_e) {}
}

// Accurate Structured Dhanteras 2026 Panchang & Ritual Information
export const DHANTERAS_2026_CONFIG = {
  festivalDate: '6 November 2026',
  festivalDay: 'Friday (शुक्रवार)',
  tithi: 'कार्तिक कृष्ण त्रयोदशी',
  trayodashiStart: '6 नवंबर, सुबह 10:30 AM',
  trayodashiEnd: '7 नवंबर, सुबह 10:47 AM',
  pujaDuration: '1 घंटा 56 मिनट',
  source: 'Drik Panchang (दृक पंचांग प्रामाणिक गणना)',
  dateRuleExplanation:
    'धनतेरस पूजा प्रदोष काल (सूर्यास्त के बाद) में त्रयोदशी तिथि के संयोग में की जाती है। 7 नवंबर की शाम तक चतुर्दशी तिथि शुरू हो जाएगी, अतः 6 नवंबर 2026 ही शास्त्रसम्मत व मान्य तिथि है।',

  // Astronomical Explanation why timings vary across cities:
  whyCityTimesDiffer:
    'हर शहर का समय अलग क्यों होता है? क्योंकि सूर्यास्त (Sunset) और वृषभ स्थिर लग्न दोनों भौगोलिक स्थान (अक्षांश व देशांतर / Latitude & Longitude) के अनुसार बदलते हैं। आपके शहर के स्थानीय सूर्यास्त के बाद का प्रदोष काल ही धनतेरस पूजा का शास्त्रसम्मत समय होता है।',

  // Shopping windows for 6 Nov 2026:
  shopping: {
    recommendedStart: '6 नवंबर, सुबह 10:30 AM के बाद (त्रयोदशी तिथि प्रारंभ होने पर)',
    avoidBefore: 'सुबह 10:30 से पहले द्वादशी तिथि है, अतः इस समय खरीदारी से बचें।',
    rahuKaal: {
      time: 'सुबह 10:42 AM – दोपहर 12:04 PM',
      warning: 'राहु काल में कोई भी नई वस्तु, सोना-चांदी या वाहन न खरीदें।',
    },
    choghadiyaSlots: [
      { name: 'शुभ चौघड़िया', time: 'दोपहर 12:02 PM – 01:24 PM', tag: 'अति शुभ' },
      { name: 'चर चौघड़िया', time: 'शाम 04:07 PM – 05:29 PM', tag: 'शुभ' },
      { name: 'लाभ चौघड़िया', time: 'रात 08:46 PM – 10:24 PM', tag: 'लाभप्रद' },
      { name: 'शुभ व अमृत चौघड़िया', time: 'रात 12:02 AM – 04:57 AM (7 Nov)', tag: 'सर्वश्रेष्ठ' },
    ],
    whatToBuy: [
      { item: 'सोने-चांदी के सिक्के व आभूषण', desc: 'मां लक्ष्मी व कुबेर की कृपा और समृद्धि वृद्धि के लिए।' },
      { item: 'पीतल, तांबा या नए बर्तन', desc: 'धन्वंतरि देव अमृत कलश लेकर प्रकट हुए थे। पीतल उनका प्रिय धातु है।' },
      { item: 'झाड़ू (Broom)', desc: 'मत्स्य पुराण अनुसार झाड़ू में मां लक्ष्मी का वास होता है, यह दरिद्रता दूर करती है।' },
      { item: 'साबुत धनिया (Dhana)', desc: 'दिवाली पर पूजा के बाद इसे तिजोरी में रखना व बगीचे में बोना शुभ माना जाता है।' },
      { item: 'गोमती चक्र व कौड़ियां', desc: 'धन आकर्षण और नकारात्मक ऊर्जा से सुरक्षा के लिए।' },
      { item: 'वाहन, भूमि या इलेक्ट्रॉनिक्स', desc: 'शुभ चौघड़िया में नए कार्य व साधन की शुरुआत।' },
      { item: 'मिट्टी का दीपक (Diya)', desc: 'सुलभ, पवित्र और परंपरा का मूल प्रतीक।' },
    ],
    whatToAvoid: [
      { item: 'काले बर्तन या काली वस्तुएं', desc: 'काले रंग को पूजा व समृद्धि में वर्जित माना जाता है।' },
      { item: 'लोहे व स्टील की नुकीली चीजें', desc: 'चाकू, कैंची, ब्लेड आदि नुकीली धारदार वस्तुएं न खरीदें।' },
      { item: 'खाली बर्तन घर लाना', desc: 'दुकान से बर्तन लाते समय उसे खाली न लाएं, उसमें पानी, चावल या बताशा अवश्य भरें।' },
    ],
  },

  // Yam Deep Daan
  yamDeepDaan: {
    title: 'यम दीप दान (Akal Mrityu Nivaran)',
    time: '6 नवंबर, शाम प्रदोष काल',
    instructions:
      'शाम को घर के मुख्य द्वार के बाहर, दक्षिण दिशा की तरफ मुख करके एक चौमुखा (चार बत्तियों वाला) दीपक जलाएं। यह अकाल मृत्यु के भय को समाप्त करने और परिवार की रक्षा के लिए किया जाता है।',
  },

  // Puja Vidhi & Steps
  pujaVidhi: [
    { step: 1, title: 'शुद्धि व संकल्प', desc: 'सूर्यास्त के बाद स्नान कर शुद्ध वस्त्र धारण करें और मन को एकाग्र करें।' },
    { step: 2, title: 'चौकी स्थापना', desc: 'ईशान कोण (उत्तर-पूर्व) में चौकी पर लाल कपड़ा बिछाकर भगवान धन्वंतरि, मां लक्ष्मी और कुबेर देव की मूर्ति या चित्र स्थापित करें।' },
    { step: 3, title: 'कलश व दीप स्थापना', desc: 'चौकी के पास जल से भरा कलश स्थापित करें और घी का अखंड दीपक प्रज्वलित करें।' },
    { step: 4, title: 'पंचोपचार पूजन', desc: 'पुष्प, अक्षत, रोली, चंदन, धूप, नैवेद्य और फल तीनों देवों को श्रद्धापूर्वक अर्पित करें।' },
    { step: 5, title: 'विशिष्ट भोग अर्पण', desc: 'कुबेर देव को सफेद मिठाई और भगवान धन्वंतरि को पीली मिठाई या खीर का भोग लगाएं।' },
    { step: 6, title: 'नूतन वस्तु पूजन', desc: 'धनतेरस पर खरीदी गई नई वस्तु (सोना, चांदी, बर्तन या सिक्के) पर रोली-अक्षत लगाकर पूजा में रखें।' },
    { step: 7, title: 'आरती व यम दीप', desc: 'धन्वंतरि व लक्ष्मी जी की आरती करें और अंत में घर के बाहर दक्षिण मुखी यम दीप प्रज्वलित करें।' },
  ],

  // Mantras
  mantras: [
    {
      deity: 'भगवान कुबेर (Lord Kuber)',
      short: 'ॐ ह्रीं कुबेराय नमः',
      full: 'ॐ यक्षाय कुबेराय वैश्रवणाय धनधान्याधिपतये धनधान्यसमृद्धिं मे देहि दापय स्वाहा।',
    },
    {
      deity: 'मां महालक्ष्मी (Maa Lakshmi)',
      short: 'ॐ श्रीं महालक्ष्म्यै नमः',
      full: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद श्रीं ह्रीं श्रीं ॐ महालक्ष्म्यै नमः।',
    },
    {
      deity: 'भगवान धन्वंतरि (Lord Dhanvantari)',
      short: 'ॐ धन्वंतरये नमः',
      full: 'ॐ नमो भगवते वासुदेवाय धन्वंतरये अमृतकलश हस्ताय सर्वामय विनाशनाय त्रैलोक्यनाथाय श्री महाविष्णवे नमः।',
    },
  ],

  // Diwali Week 2026 Schedule
  diwaliWeek: [
    { date: '6 Nov 2026', day: 'शुक्रवार (Fri)', festival: 'धनतेरस (Dhanteras)', note: 'धन्वंतरि जयंती व यम दीप दान' },
    { date: '8 Nov 2026', day: 'रविवार (Sun)', festival: 'नरक चतुर्दशी / छोटी दिवाली', note: 'रूप चौदस, अभ्यंग स्नान' },
    { date: '8 Nov 2026', day: 'रविवार (Sun)', festival: 'दीपावली महालक्ष्मी पूजन', note: 'दिल्ली मुहूर्त: शाम 5:54 – 7:50 PM' },
    { date: '10 Nov 2026', day: 'मंगलवार (Tue)', festival: 'गोवर्धन पूजा व अन्नकूट', note: 'श्रीकृष्ण गोवर्धन लीला पूजन' },
    { date: '11 Nov 2026', day: 'बुधवार (Wed)', festival: 'भाई दूज (यम द्वितीया)', note: 'भाई-बहन का पावन पर्व' },
  ],
};
