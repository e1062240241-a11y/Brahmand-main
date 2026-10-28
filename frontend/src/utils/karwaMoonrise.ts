import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface CityMoonriseData {
  id: string;
  city: string;
  hindiCity: string;
  state: string;
  hindiState: string;
  moonriseTime: string;
  hour: number; // 24-hr format
  minute: number;
  lat: number;
  lng: number;
  aliases: string[];
}

export const MAJOR_CITIES_MOONRISE: CityMoonriseData[] = [
  // --- National Capital Region & North ---
  { id: 'delhi', city: 'Delhi / NCR', hindiCity: 'दिल्ली / एन.सी.आर', state: 'Delhi', hindiState: 'दिल्ली', moonriseTime: '08:09 PM', hour: 20, minute: 9, lat: 28.6139, lng: 77.2090, aliases: ['delhi', 'ncr', 'new delhi', 'dilli', 'नई दिल्ली'] },
  { id: 'noida', city: 'Noida', hindiCity: 'नोएडा', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:08 PM', hour: 20, minute: 8, lat: 28.5355, lng: 77.3910, aliases: ['noida', 'greater noida', 'नोएडा', 'ग्रेटर नोएडा'] },
  { id: 'ghaziabad', city: 'Ghaziabad', hindiCity: 'गाजियाबाद', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:08 PM', hour: 20, minute: 8, lat: 28.6692, lng: 77.4538, aliases: ['ghaziabad', 'गाजियाबाद'] },
  { id: 'gurugram', city: 'Gurugram', hindiCity: 'गुरुग्राम', state: 'Haryana', hindiState: 'हरियाणा', moonriseTime: '08:10 PM', hour: 20, minute: 10, lat: 28.4595, lng: 77.0266, aliases: ['gurugram', 'gurgaon', 'गुड़गांव', 'गुरुग्राम'] },
  { id: 'faridabad', city: 'Faridabad', hindiCity: 'फरीदाबाद', state: 'Haryana', hindiState: 'हरियाणा', moonriseTime: '08:09 PM', hour: 20, minute: 9, lat: 28.4089, lng: 77.3178, aliases: ['faridabad', 'फरीदाबाद'] },

  // --- Uttar Pradesh ---
  { id: 'lucknow', city: 'Lucknow', hindiCity: 'लखनऊ', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '07:58 PM', hour: 19, minute: 58, lat: 26.8467, lng: 80.9462, aliases: ['lucknow', 'लखनऊ'] },
  { id: 'kanpur', city: 'Kanpur', hindiCity: 'कानपुर', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:01 PM', hour: 20, minute: 1, lat: 26.4499, lng: 80.3319, aliases: ['kanpur', 'cawnpore', 'कानपुर'] },
  { id: 'varanasi', city: 'Varanasi', hindiCity: 'वाराणसी', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '07:53 PM', hour: 19, minute: 53, lat: 25.3176, lng: 82.9739, aliases: ['varanasi', 'banaras', 'kashi', 'वाराणसी', 'काशी', 'बनारस'] },
  { id: 'prayagraj', city: 'Prayagraj', hindiCity: 'प्रयागराज', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '07:56 PM', hour: 19, minute: 56, lat: 25.4358, lng: 81.8463, aliases: ['prayagraj', 'allahabad', 'प्रयागराज', 'इलाहाबाद'] },
  { id: 'ayodhya', city: 'Ayodhya', hindiCity: 'अयोध्या', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '07:55 PM', hour: 19, minute: 55, lat: 26.7922, lng: 82.1998, aliases: ['ayodhya', 'faizabad', 'अयोध्या', 'फैजाबाद'] },
  { id: 'gorakhpur', city: 'Gorakhpur', hindiCity: 'गोरखपुर', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '07:49 PM', hour: 19, minute: 49, lat: 26.7606, lng: 83.3732, aliases: ['gorakhpur', 'गोरखपुर'] },
  { id: 'bareilly', city: 'Bareilly', hindiCity: 'बरेली', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:03 PM', hour: 20, minute: 3, lat: 28.3670, lng: 79.4304, aliases: ['bareilly', 'बरेली'] },
  { id: 'moradabad', city: 'Moradabad', hindiCity: 'मुरादाबाद', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:05 PM', hour: 20, minute: 5, lat: 28.8386, lng: 78.7733, aliases: ['moradabad', 'मुरादाबाद'] },
  { id: 'aligarh', city: 'Aligarh', hindiCity: 'अलीगढ़', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:08 PM', hour: 20, minute: 8, lat: 27.8974, lng: 78.0880, aliases: ['aligarh', 'अलीगढ़'] },
  { id: 'agra', city: 'Agra', hindiCity: 'आगरा', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:10 PM', hour: 20, minute: 10, lat: 27.1767, lng: 78.0081, aliases: ['agra', 'आगरा'] },
  { id: 'mathura', city: 'Mathura', hindiCity: 'मथुरा', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:11 PM', hour: 20, minute: 11, lat: 27.4924, lng: 77.6737, aliases: ['mathura', 'vrindavan', 'मथुरा', 'वृंदावन'] },
  { id: 'meerut', city: 'Meerut', hindiCity: 'मेरठ', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:07 PM', hour: 20, minute: 7, lat: 28.9845, lng: 77.7064, aliases: ['meerut', 'मेरठ'] },
  { id: 'saharanpur', city: 'Saharanpur', hindiCity: 'सहारनपुर', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:05 PM', hour: 20, minute: 5, lat: 29.9640, lng: 77.5460, aliases: ['saharanpur', 'सहारनपुर'] },
  { id: 'jhansi', city: 'Jhansi', hindiCity: 'झाँसी', state: 'Uttar Pradesh', hindiState: 'उत्तर प्रदेश', moonriseTime: '08:12 PM', hour: 20, minute: 12, lat: 25.4484, lng: 78.5685, aliases: ['jhansi', 'झांसी', 'झाँसी'] },

  // --- Rajasthan ---
  { id: 'jaipur', city: 'Jaipur', hindiCity: 'जयपुर', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:19 PM', hour: 20, minute: 19, lat: 26.9124, lng: 75.7873, aliases: ['jaipur', 'pink city', 'जयपुर'] },
  { id: 'jodhpur', city: 'Jodhpur', hindiCity: 'जोधपुर', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:26 PM', hour: 20, minute: 26, lat: 26.2389, lng: 73.0243, aliases: ['jodhpur', 'जोधपुर'] },
  { id: 'udaipur', city: 'Udaipur', hindiCity: 'उदयपुर', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:25 PM', hour: 20, minute: 25, lat: 24.5854, lng: 73.7125, aliases: ['udaipur', 'उदयपुर'] },
  { id: 'kota', city: 'Kota', hindiCity: 'कोटा', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:17 PM', hour: 20, minute: 17, lat: 25.2138, lng: 75.8648, aliases: ['kota', 'कोटा'] },
  { id: 'bikaner', city: 'Bikaner', hindiCity: 'बीकानेर', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:24 PM', hour: 20, minute: 24, lat: 28.0229, lng: 73.3119, aliases: ['bikaner', 'बीकानेर'] },
  { id: 'ajmer', city: 'Ajmer', hindiCity: 'अजमेर', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:21 PM', hour: 20, minute: 21, lat: 26.4499, lng: 74.6399, aliases: ['ajmer', 'अजमेर', 'pushkar', 'पुष्कर'] },
  { id: 'alwar', city: 'Alwar', hindiCity: 'अलवर', state: 'Rajasthan', hindiState: 'राजस्थान', moonriseTime: '08:14 PM', hour: 20, minute: 14, lat: 27.5530, lng: 76.6346, aliases: ['alwar', 'अलवर'] },

  // --- Punjab & Haryana ---
  { id: 'chandigarh', city: 'Chandigarh', hindiCity: 'चंडीगढ़', state: 'Punjab / Haryana', hindiState: 'पंजाब / हरियाणा', moonriseTime: '08:06 PM', hour: 20, minute: 6, lat: 30.7333, lng: 76.7794, aliases: ['chandigarh', 'mohali', 'panchkula', 'चंडीगढ़', 'मोहाली', 'पंचकुला'] },
  { id: 'ludhiana', city: 'Ludhiana', hindiCity: 'लुधियाना', state: 'Punjab', hindiState: 'पंजाब', moonriseTime: '08:09 PM', hour: 20, minute: 9, lat: 30.9010, lng: 75.8573, aliases: ['ludhiana', 'लुधियाना'] },
  { id: 'amritsar', city: 'Amritsar', hindiCity: 'अमृतसर', state: 'Punjab', hindiState: 'पंजाब', moonriseTime: '08:12 PM', hour: 20, minute: 12, lat: 31.6340, lng: 74.8723, aliases: ['amritsar', 'अमृतसर'] },
  { id: 'jalandhar', city: 'Jalandhar', hindiCity: 'जालंधर', state: 'Punjab', hindiState: 'पंजाब', moonriseTime: '08:10 PM', hour: 20, minute: 10, lat: 31.3260, lng: 75.5762, aliases: ['jalandhar', 'जालंधर'] },
  { id: 'patiala', city: 'Patiala', hindiCity: 'पटियाला', state: 'Punjab', hindiState: 'पंजाब', moonriseTime: '08:08 PM', hour: 20, minute: 8, lat: 30.3398, lng: 76.3869, aliases: ['patiala', 'पटियाला'] },
  { id: 'panipat', city: 'Panipat', hindiCity: 'पानीपत', state: 'Haryana', hindiState: 'हरियाणा', moonriseTime: '08:08 PM', hour: 20, minute: 8, lat: 29.3909, lng: 76.9635, aliases: ['panipat', 'पानीपत'] },
  { id: 'karnal', city: 'Karnal', hindiCity: 'करनाल', state: 'Haryana', hindiState: 'हरियाणा', moonriseTime: '08:07 PM', hour: 20, minute: 7, lat: 29.6857, lng: 76.9905, aliases: ['karnal', 'करनाल'] },
  { id: 'rohtak', city: 'Rohtak', hindiCity: 'रोहतक', state: 'Haryana', hindiState: 'हरियाणा', moonriseTime: '08:10 PM', hour: 20, minute: 10, lat: 28.8955, lng: 76.6066, aliases: ['rohtak', 'रोहतक'] },
  { id: 'hisar', city: 'Hisar', hindiCity: 'हिसार', state: 'Haryana', hindiState: 'हरियाणा', moonriseTime: '08:13 PM', hour: 20, minute: 13, lat: 29.1492, lng: 75.7217, aliases: ['hisar', 'हिसार'] },

  // --- Uttarakhand & Himachal & J&K ---
  { id: 'dehradun', city: 'Dehradun', hindiCity: 'देहरादून', state: 'Uttarakhand', hindiState: 'उत्तराखंड', moonriseTime: '08:02 PM', hour: 20, minute: 2, lat: 30.3165, lng: 78.0322, aliases: ['dehradun', 'देहरादून'] },
  { id: 'haridwar', city: 'Haridwar', hindiCity: 'हरिद्वार', state: 'Uttarakhand', hindiState: 'उत्तराखंड', moonriseTime: '08:03 PM', hour: 20, minute: 3, lat: 29.9457, lng: 78.1642, aliases: ['haridwar', 'rishikesh', 'हरिद्वार', 'ऋषिकेश'] },
  { id: 'haldwani', city: 'Haldwani', hindiCity: 'हल्द्वानी', state: 'Uttarakhand', hindiState: 'उत्तराखंड', moonriseTime: '08:01 PM', hour: 20, minute: 1, lat: 29.2183, lng: 79.5130, aliases: ['haldwani', 'nainital', 'हल्द्वानी', 'नैनीताल'] },
  { id: 'shimla', city: 'Shimla', hindiCity: 'शिमला', state: 'Himachal Pradesh', hindiState: 'हिमाचल प्रदेश', moonriseTime: '08:04 PM', hour: 20, minute: 4, lat: 31.1048, lng: 77.1734, aliases: ['shimla', 'शिमला'] },
  { id: 'jammu', city: 'Jammu', hindiCity: 'जम्मू', state: 'Jammu & Kashmir', hindiState: 'जम्मू व कश्मीर', moonriseTime: '08:08 PM', hour: 20, minute: 8, lat: 32.7266, lng: 74.8570, aliases: ['jammu', 'katra', 'जम्मू', 'कटरा'] },
  { id: 'srinagar', city: 'Srinagar', hindiCity: 'श्रीनगर', state: 'Jammu & Kashmir', hindiState: 'जम्मू व कश्मीर', moonriseTime: '08:06 PM', hour: 20, minute: 6, lat: 34.0837, lng: 74.7973, aliases: ['srinagar', 'श्रीनगर'] },

  // --- Madhya Pradesh & Chhattisgarh ---
  { id: 'bhopal', city: 'Bhopal', hindiCity: 'भोपाल', state: 'Madhya Pradesh', hindiState: 'मध्य प्रदेश', moonriseTime: '08:21 PM', hour: 20, minute: 21, lat: 23.2599, lng: 77.4126, aliases: ['bhopal', 'भोपाल'] },
  { id: 'indore', city: 'Indore', hindiCity: 'इंदौर', state: 'Madhya Pradesh', hindiState: 'मध्य प्रदेश', moonriseTime: '08:27 PM', hour: 20, minute: 27, lat: 22.7196, lng: 75.8577, aliases: ['indore', 'इंदौर'] },
  { id: 'gwalior', city: 'Gwalior', hindiCity: 'ग्वालियर', state: 'Madhya Pradesh', hindiState: 'मध्य प्रदेश', moonriseTime: '08:11 PM', hour: 20, minute: 11, lat: 26.2183, lng: 78.1828, aliases: ['gwalior', 'ग्वालियर'] },
  { id: 'jabalpur', city: 'Jabalpur', hindiCity: 'जबलपुर', state: 'Madhya Pradesh', hindiState: 'मध्य प्रदेश', moonriseTime: '08:13 PM', hour: 20, minute: 13, lat: 23.1815, lng: 79.9864, aliases: ['jabalpur', 'जबलपुर'] },
  { id: 'ujjain', city: 'Ujjain', hindiCity: 'उज्जैन', state: 'Madhya Pradesh', hindiState: 'मध्य प्रदेश', moonriseTime: '08:28 PM', hour: 20, minute: 28, lat: 23.1765, lng: 75.7885, aliases: ['ujjain', 'उज्जैन'] },
  { id: 'sagar', city: 'Sagar', hindiCity: 'सागर', state: 'Madhya Pradesh', hindiState: 'मध्य प्रदेश', moonriseTime: '08:16 PM', hour: 20, minute: 16, lat: 23.8388, lng: 78.7378, aliases: ['sagar', 'सागर'] },
  { id: 'raipur', city: 'Raipur', hindiCity: 'रायपुर', state: 'Chhattisgarh', hindiState: 'छत्तीसगढ़', moonriseTime: '08:07 PM', hour: 20, minute: 7, lat: 21.2514, lng: 81.6296, aliases: ['raipur', 'रायपुर', 'bhilai', 'दुर्ग', 'durg', 'भिलाई'] },
  { id: 'bilaspur', city: 'Bilaspur', hindiCity: 'बिलासपुर', state: 'Chhattisgarh', hindiState: 'छत्तीसगढ़', moonriseTime: '08:04 PM', hour: 20, minute: 4, lat: 22.0797, lng: 82.1409, aliases: ['bilaspur', 'बिलासपुर'] },

  // --- Bihar & Jharkhand ---
  { id: 'patna', city: 'Patna', hindiCity: 'पटना', state: 'Bihar', hindiState: 'बिहार', moonriseTime: '07:44 PM', hour: 19, minute: 44, lat: 25.5941, lng: 85.1376, aliases: ['patna', 'पटना'] },
  { id: 'gaya', city: 'Gaya', hindiCity: 'गया', state: 'Bihar', hindiState: 'बिहार', moonriseTime: '07:46 PM', hour: 19, minute: 46, lat: 24.7955, lng: 85.0002, aliases: ['gaya', 'बोधगया', 'bodhgaya', 'गया'] },
  { id: 'muzaffarpur', city: 'Muzaffarpur', hindiCity: 'मुजफ्फरपुर', state: 'Bihar', hindiState: 'बिहार', moonriseTime: '07:43 PM', hour: 19, minute: 43, lat: 26.1209, lng: 85.3647, aliases: ['muzaffarpur', 'मुजफ्फरपुर'] },
  { id: 'bhagalpur', city: 'Bhagalpur', hindiCity: 'भागलपुर', state: 'Bihar', hindiState: 'बिहार', moonriseTime: '07:39 PM', hour: 19, minute: 39, lat: 25.2425, lng: 86.9842, aliases: ['bhagalpur', 'भागलपुर'] },
  { id: 'ranchi', city: 'Ranchi', hindiCity: 'राँची', state: 'Jharkhand', hindiState: 'झारखंड', moonriseTime: '07:48 PM', hour: 19, minute: 48, lat: 23.3441, lng: 85.3096, aliases: ['ranchi', 'राँची', 'रांची'] },
  { id: 'jamshedpur', city: 'Jamshedpur', hindiCity: 'जमशेदपुर', state: 'Jharkhand', hindiState: 'झारखंड', moonriseTime: '07:45 PM', hour: 19, minute: 45, lat: 22.8046, lng: 86.2029, aliases: ['jamshedpur', 'tatanagar', 'जमशेदपुर', 'टाटानगर'] },
  { id: 'dhanbad', city: 'Dhanbad', hindiCity: 'धनबाद', state: 'Jharkhand', hindiState: 'झारखंड', moonriseTime: '07:44 PM', hour: 19, minute: 44, lat: 23.7957, lng: 86.4304, aliases: ['dhanbad', 'धनबाद', 'bokaro', 'बोकारो'] },

  // --- Gujarat & Maharashtra ---
  { id: 'ahmedabad', city: 'Ahmedabad', hindiCity: 'अहमदाबाद', state: 'Gujarat', hindiState: 'गुजरात', moonriseTime: '08:41 PM', hour: 20, minute: 41, lat: 23.0225, lng: 72.5714, aliases: ['ahmedabad', 'amdavad', 'gandhinagar', 'अहमदाबाद', 'गांधीनगर'] },
  { id: 'surat', city: 'Surat', hindiCity: 'सूरत', state: 'Gujarat', hindiState: 'गुजरात', moonriseTime: '08:46 PM', hour: 20, minute: 46, lat: 21.1702, lng: 72.8311, aliases: ['surat', 'सूरत'] },
  { id: 'vadodara', city: 'Vadodara', hindiCity: 'वडोदरा', state: 'Gujarat', hindiState: 'गुजरात', moonriseTime: '08:43 PM', hour: 20, minute: 43, lat: 22.3072, lng: 73.1812, aliases: ['vadodara', 'baroda', 'वडोदरा', 'बड़ौदा'] },
  { id: 'rajkot', city: 'Rajkot', hindiCity: 'राजकोट', state: 'Gujarat', hindiState: 'गुजरात', moonriseTime: '08:49 PM', hour: 20, minute: 49, lat: 22.3039, lng: 70.8022, aliases: ['rajkot', 'राजकोट'] },
  { id: 'mumbai', city: 'Mumbai', hindiCity: 'मुंबई', state: 'Maharashtra', hindiState: 'महाराष्ट्र', moonriseTime: '08:48 PM', hour: 20, minute: 48, lat: 19.0760, lng: 72.8777, aliases: ['mumbai', 'bombay', 'thane', 'navi mumbai', 'kalyan', 'बंबई', 'मुंबई', 'ठाणे', 'नवी मुंबई'] },
  { id: 'pune', city: 'Pune', hindiCity: 'पुणे', state: 'Maharashtra', hindiState: 'महाराष्ट्र', moonriseTime: '08:45 PM', hour: 20, minute: 45, lat: 18.5204, lng: 73.8567, aliases: ['pune', 'poona', 'pcmc', 'पुणे'] },
  { id: 'nagpur', city: 'Nagpur', hindiCity: 'नागपुर', state: 'Maharashtra', hindiState: 'महाराष्ट्र', moonriseTime: '08:18 PM', hour: 20, minute: 18, lat: 21.1458, lng: 79.0882, aliases: ['nagpur', 'नागपुर'] },
  { id: 'nashik', city: 'Nashik', hindiCity: 'नासिक', state: 'Maharashtra', hindiState: 'महाराष्ट्र', moonriseTime: '08:44 PM', hour: 20, minute: 44, lat: 19.9975, lng: 73.7898, aliases: ['nashik', 'nasik', 'नासिक', 'नाशिक'] },
  { id: 'aurangabad', city: 'Chhatrapati Sambhajinagar', hindiCity: 'छत्रपति संभाजीनगर (औरंगाबाद)', state: 'Maharashtra', hindiState: 'महाराष्ट्र', moonriseTime: '08:37 PM', hour: 20, minute: 37, lat: 19.8762, lng: 75.3433, aliases: ['aurangabad', 'sambhajinagar', 'औरंगाबाद', 'संभाजीनगर'] },

  // --- West Bengal & East ---
  { id: 'kolkata', city: 'Kolkata', hindiCity: 'कोलकाता', state: 'West Bengal', hindiState: 'पश्चिम बंगाल', moonriseTime: '07:37 PM', hour: 19, minute: 37, lat: 22.5726, lng: 88.3639, aliases: ['kolkata', 'calcutta', 'howrah', 'कोलकाता', 'कलकत्ता', 'हावड़ा'] },
  { id: 'siliguri', city: 'Siliguri', hindiCity: 'सिलीगुड़ी', state: 'West Bengal', hindiState: 'पश्चिम बंगाल', moonriseTime: '07:31 PM', hour: 19, minute: 31, lat: 26.7271, lng: 88.3953, aliases: ['siliguri', 'सिलीगुड़ी'] },
  { id: 'guwahati', city: 'Guwahati', hindiCity: 'गुवाहाटी', state: 'Assam', hindiState: 'असम', moonriseTime: '07:18 PM', hour: 19, minute: 18, lat: 26.1445, lng: 91.7362, aliases: ['guwahati', 'assam', 'गुवाहाटी', 'असम'] },
  { id: 'bhubaneswar', city: 'Bhubaneswar', hindiCity: 'भुवनेश्वर', state: 'Odisha', hindiState: 'ओडिशा', moonriseTime: '07:52 PM', hour: 19, minute: 52, lat: 20.2961, lng: 85.8245, aliases: ['bhubaneswar', 'cuttack', 'puri', 'भुवनेश्वर', 'कटक', 'पुरी'] },

  // --- South & Goa ---
  { id: 'bengaluru', city: 'Bengaluru', hindiCity: 'बेंगलुरु', state: 'Karnataka', hindiState: 'कर्नाटक', moonriseTime: '08:54 PM', hour: 20, minute: 54, lat: 12.9716, lng: 77.5946, aliases: ['bengaluru', 'bangalore', 'banglore', 'बेंगलुरु', 'बैंगलोर'] },
  { id: 'hyderabad', city: 'Hyderabad', hindiCity: 'हैदराबाद', state: 'Telangana', hindiState: 'तेलंगाना', moonriseTime: '08:40 PM', hour: 20, minute: 40, lat: 17.3850, lng: 78.4867, aliases: ['hyderabad', 'secunderabad', 'हैदराबाद', 'सिकंदराबाद'] },
  { id: 'chennai', city: 'Chennai', hindiCity: 'चेन्नई', state: 'Tamil Nadu', hindiState: 'तमिलनाडु', moonriseTime: '08:43 PM', hour: 20, minute: 43, lat: 13.0827, lng: 80.2707, aliases: ['chennai', 'madras', 'चेन्नई', 'मद्रास'] },
  { id: 'goa', city: 'Goa', hindiCity: 'गोवा (पणजी)', state: 'Goa', hindiState: 'गोवा', moonriseTime: '08:51 PM', hour: 20, minute: 51, lat: 15.4909, lng: 73.8278, aliases: ['goa', 'panaji', 'पणजी', 'गोवा'] },
];

export const POPULAR_CITY_IDS = ['delhi', 'mumbai', 'jaipur', 'lucknow', 'chandigarh', 'pune', 'bengaluru', 'ahmedabad', 'indore'];

export const STORAGE_KEY_SELECTED_CITY = '@karwa_selected_city';
export const STORAGE_KEY_MANUAL_CITY = '@karwa_user_manual_city';

/**
 * Calculates Haversine distance in kilometers between two lat/lng points.
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Finds the closest city in MAJOR_CITIES_MOONRISE to the given coordinates.
 */
export function findClosestCityByCoords(latitude: number, longitude: number): CityMoonriseData {
  let closest = MAJOR_CITIES_MOONRISE[0];
  let minDistance = Infinity;

  for (const c of MAJOR_CITIES_MOONRISE) {
    const dist = getDistanceKm(latitude, longitude, c.lat, c.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }

  return closest;
}

/**
 * Accurately models Karwa Chauth (29 Oct 2026) moonrise in India based on longitude and latitude.
 * In India, moonrise moves east-to-west (~3.8 minutes later per degree west).
 */
export function calculateApproximateMoonrise(lat: number, lng: number): {
  moonriseTime: string;
  hour: number;
  minute: number;
} {
  // Reference: Delhi (lat: 28.6139, lng: 77.2090) moonrise is 20:09 (08:09 PM)
  const baseMinutes = 20 * 60 + 9;
  const deltaLng = 77.2090 - lng; // positive if west of Delhi (later), negative if east (earlier)
  const deltaLat = 28.6139 - lat; // slight southward delay during late autumn
  const offsetMin = Math.round(deltaLng * 3.8 + deltaLat * 0.85);

  const totalMin = baseMinutes + offsetMin;
  const hour = Math.floor(totalMin / 60);
  const minute = totalMin % 60;

  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const pad = (n: number) => String(n).padStart(2, '0');
  const moonriseTime = `${pad(displayHour)}:${pad(minute)} ${ampm}`;

  return { moonriseTime, hour, minute };
}

/**
 * Dynamically creates a CityMoonriseData object for ANY custom city typed by the user
 * or present in their profile, preventing hardcoded city fallbacks.
 */
export function createCustomCityData(
  cityName: string,
  baseLocation?: { lat?: number; lng?: number; state?: string } | string
): CityMoonriseData {
  const cleanName = (cityName || '').trim();
  const id = `custom_${cleanName.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_')}`;

  let state = 'भारत';
  let lat = 26.85;
  let lng = 78.50; // Central Northern India default

  if (typeof baseLocation === 'string' && baseLocation.trim()) {
    state = baseLocation.trim();
  } else if (baseLocation && typeof baseLocation === 'object') {
    if (baseLocation.state) state = baseLocation.state;
    if (typeof baseLocation.lat === 'number' && typeof baseLocation.lng === 'number') {
      lat = baseLocation.lat;
      lng = baseLocation.lng;
    }
  }

  // If coordinates weren't supplied, check if the closest matching city in the catalog gives good coords
  if (lat === 26.85 && lng === 78.50) {
    const matched = matchCityByText(cleanName) || matchCityByText(state);
    if (matched) {
      lat = matched.lat;
      lng = matched.lng;
      if (state === 'भारत' && matched.state) state = matched.state;
    }
  }

  const { moonriseTime, hour, minute } = calculateApproximateMoonrise(lat, lng);

  return {
    id,
    city: cleanName,
    hindiCity: cleanName,
    state,
    hindiState: state,
    moonriseTime,
    hour,
    minute,
    lat,
    lng,
    aliases: [cleanName.toLowerCase()],
  };
}

/**
 * Robustly matches an input text (city name, district, state) to MAJOR_CITIES_MOONRISE.
 */
export function matchCityByText(text: string): CityMoonriseData | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase().trim();
  if (!lower) return null;

  // 1. Exact id or alias match
  for (const c of MAJOR_CITIES_MOONRISE) {
    if (c.id === lower) return c;
    if (c.aliases.some((a) => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))) {
      return c;
    }
  }

  // 2. City name match
  for (const c of MAJOR_CITIES_MOONRISE) {
    const cLower = c.city.toLowerCase();
    if (lower.includes(cLower) || cLower.includes(lower)) return c;
    if (c.hindiCity && lower.includes(c.hindiCity)) return c;
  }

  // 3. State fallback
  for (const c of MAJOR_CITIES_MOONRISE) {
    const sLower = c.state.toLowerCase();
    if (lower.includes(sLower) || sLower.includes(lower)) return c;
    if (c.hindiState && lower.includes(c.hindiState)) return c;
  }

  return null;
}

/**
 * Synchronous initial resolver that inspects user profile immediately on component mount,
 * completely eliminating any initial flash of a hardcoded default city.
 */
export function getInitialUserMoonCity(user?: any): CityMoonriseData {
  const hl =
    user?.home_location ||
    user?.location ||
    (user?.place_of_birth ? { city: user.place_of_birth } : null);

  if (hl) {
    if (typeof hl === 'object') {
      const cityName = hl.city || hl.area || hl.district;
      if (cityName) {
        const matched = matchCityByText(String(cityName));
        if (matched) return matched;
        return createCustomCityData(String(cityName), {
          lat: Number(hl.latitude || hl.lat) || undefined,
          lng: Number(hl.longitude || hl.lng) || undefined,
          state: hl.state ? String(hl.state) : undefined,
        });
      }
      const lat = Number(hl.latitude || hl.lat);
      const lng = Number(hl.longitude || hl.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat >= 8 && lat <= 38 && lng >= 68 && lng <= 98) {
        return findClosestCityByCoords(lat, lng);
      }
    } else if (typeof hl === 'string' && hl.trim()) {
      const matched = matchCityByText(hl);
      if (matched) return matched;
      return createCustomCityData(hl);
    }
  }

  return MAJOR_CITIES_MOONRISE[0];
}

/**
 * Intelligently resolves user's location to the nearest / matched Moonrise city:
 * 1. User manual selection in AsyncStorage (@karwa_user_manual_city) - supports JSON or ID
 * 2. User profile home_location / location / place_of_birth (preserves user's actual city name!)
 * 3. Legacy AsyncStorage '@karwa_selected_city'
 * 4. Device GPS (Location.getLastKnownPositionAsync with reverse-geocoding to get true city name)
 * 5. Default fallback to Delhi / NCR
 */
export async function detectUserMoonCity(user?: any): Promise<CityMoonriseData> {
  // 1. Explicit user manual selection takes top priority
  try {
    const manualChoice = await AsyncStorage.getItem(STORAGE_KEY_MANUAL_CITY);
    if (manualChoice) {
      if (manualChoice.startsWith('{')) {
        try {
          const parsed = JSON.parse(manualChoice);
          if (parsed && (parsed.city || parsed.hindiCity)) {
            return parsed;
          }
        } catch (_e) {}
      }
      const found = MAJOR_CITIES_MOONRISE.find((c) => c.id === manualChoice);
      if (found) return found;
      // If manualChoice is a custom string
      const matched = matchCityByText(manualChoice);
      if (matched) return matched;
      return createCustomCityData(manualChoice);
    }
  } catch (_e) {}

  // 2. User Profile location data (home_location, location, or place_of_birth)
  const hl =
    user?.home_location ||
    user?.location ||
    (user?.place_of_birth ? { city: user.place_of_birth } : null);

  if (hl) {
    if (typeof hl === 'object') {
      const userCity = hl.city || hl.area || hl.district;
      const lat = Number(hl.latitude || hl.lat);
      const lng = Number(hl.longitude || hl.lng);
      const hasCoords = !isNaN(lat) && !isNaN(lng) && lat >= 8 && lat <= 38 && lng >= 68 && lng <= 98;

      if (userCity) {
        const directMatch = matchCityByText(String(userCity));
        if (directMatch) return directMatch;
        return createCustomCityData(String(userCity), {
          lat: hasCoords ? lat : undefined,
          lng: hasCoords ? lng : undefined,
          state: hl.state ? String(hl.state) : undefined,
        });
      }

      if (hasCoords) {
        const closest = findClosestCityByCoords(lat, lng);
        if (closest) return closest;
      }
    } else if (typeof hl === 'string' && hl.trim()) {
      const matched = matchCityByText(hl);
      if (matched) return matched;
      return createCustomCityData(hl);
    }
  }

  // 3. Device location check via expo-location (with India boundary check + reverse geocode)
  try {
    const hasPermission = await Location.getForegroundPermissionsAsync().catch(() => null);
    if (hasPermission && hasPermission.granted) {
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      const lat = last?.coords?.latitude;
      const lng = last?.coords?.longitude;
      if (lat && lng && lat >= 8 && lat <= 38 && lng >= 68 && lng <= 98) {
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }).catch(() => null);
          if (rev && rev[0]) {
            const revCity = rev[0].city || rev[0].subregion || rev[0].district;
            const revState = rev[0].region || '';
            if (revCity) {
              const matched = matchCityByText(revCity);
              if (matched) return matched;
              return createCustomCityData(revCity, { lat, lng, state: revState });
            }
          }
        } catch (_e) {}

        const closest = findClosestCityByCoords(lat, lng);
        if (closest) return closest;
      }
    }
  } catch (_e) {}

  // 4. Default fallback
  return MAJOR_CITIES_MOONRISE[0];
}

export interface KarwaCountdownResult {
  target: Date;
  isRisen: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  timeStr: string;
  expectedDateLabel: string;
}

/**
 * Computes exact countdown to Karwa Chauth Moonrise for the given city.
 * In 2026, Karwa Chauth is on 29 October 2026.
 */
export function getKarwaMoonriseCountdown(
  city: CityMoonriseData,
  now: Date = new Date()
): KarwaCountdownResult {
  const currentYear = now.getFullYear();
  // Karwa Chauth 2026: 29 October (month 9 in 0-indexed JS)
  const target = new Date(currentYear, 9, 29, city.hour, city.minute, 0, 0);

  let diffMs = target.getTime() - now.getTime();

  // If moonrise occurred today within the last 14 hours (post-moonrise puja window):
  if (diffMs <= 0 && diffMs > -14 * 60 * 60 * 1000) {
    return {
      target,
      isRisen: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      timeStr: 'चंद्रोदय हो चुका',
      expectedDateLabel: 'आज करवा चौथ',
    };
  }

  // If Karwa Chauth 2026 has completely passed (>14h ago), target daily moonrise:
  if (diffMs <= -14 * 60 * 60 * 1000) {
    const dailyTarget = new Date(now);
    dailyTarget.setHours(city.hour, city.minute, 0, 0);
    diffMs = dailyTarget.getTime() - now.getTime();

    if (diffMs <= 0 && diffMs > -6 * 60 * 60 * 1000) {
      return {
        target: dailyTarget,
        isRisen: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalHours: 0,
        timeStr: 'चंद्रोदय हो चुका',
        expectedDateLabel: 'आज',
      };
    }

    if (diffMs <= 0) {
      dailyTarget.setDate(dailyTarget.getDate() + 1);
      diffMs = dailyTarget.getTime() - now.getTime();
    }
  }

  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const totalHours = Math.floor(totalSecs / 3600);

  const pad = (n: number) => String(n).padStart(2, '0');

  let timeStr = '';
  if (days >= 1) {
    timeStr = `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  } else {
    timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  // Determine expected date label
  let expectedDateLabel = '29 अक्टूबर (करवा चौथ)';
  const isSameDay =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate();

  if (isSameDay) {
    expectedDateLabel = 'आज करवा चौथ';
  }

  return {
    target,
    isRisen: false,
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    timeStr,
    expectedDateLabel,
  };
}
