import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Platform,
  Easing,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MANTRA_DATA: Record<string, { text: string; bg: any }> = {
  gayatri: {
    text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
hanuman: {
    text: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि बरनऊँ रघुबर बिमल जसु जो दायकु फल चारि बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार जय हनुमान ज्ञान गुन सागर जय कपीस तिहुँ लोक उजागर',
    bg: require('../../../assets/images/hanuman_jaap_card_v2.png'),
  },
  krishna: {
    text: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे',
    bg: require('../../../assets/images/krishna_jaap_card_v2.png'),
  },
  shiva: {
    text: 'ॐ नमः शिवाय ॐ नमः शिवाय ॐ नमः शिवाय',
    bg: require('../../../assets/images/shiva_jaap_card_v2.png'),
  },
};

const HANUMAN_CHALISA_SEGMENTS = [
  { type: 'music', startTime: 0.0, endTime: 32.7, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 32.7, endTime: 36.82, items: ['श्रीगुरु', 'चरन', 'सरोज', 'रज'] },
  { type: 'music', startTime: 36.82, endTime: 46.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 46.0, endTime: 49.5, items: ['निज', 'मन', 'मुकुर', 'सुधारि'] },
  { type: 'music', startTime: 49.5, endTime: 54.2, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 54.2, endTime: 58.2, items: ['बरनऊँ', 'रघुबर', 'बिमल', 'जसु'] },
  { type: 'music', startTime: 58.2, endTime: 59.4, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 59.4, endTime: 63.18, items: ['जो', 'दायकु', 'फल', 'चारि'] },
  { type: 'music', startTime: 63.18, endTime: 72.6, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 72.6, endTime: 77.7, items: ['बुद्धिहीन', 'तनु', 'जानिके'] },
  { type: 'music', startTime: 77.7, endTime: 86.1, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 86.1, endTime: 89.7, items: ['सुमिरौं', 'पवन-कुमार'] },
  { type: 'music', startTime: 89.7, endTime: 94.0, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 94.0, endTime: 96.1, items: ['बल', 'बुधि', 'बिद्या', 'देहु', 'मोहिं'] },
  { type: 'vocal', startTime: 96.8, endTime: 101.0, items: ['हरहु', 'कलेस', 'बिकार'] },
  { type: 'music', startTime: 101.0, endTime: 116.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 116.0, endTime: 121.0, items: ['जय', 'हनुमान', 'ज्ञान', 'गुन', 'सागर'] },
  { type: 'vocal', startTime: 121.0, endTime: 126.0, items: ['जय', 'कपीस', 'तिहुँ', 'लोक', 'उजागर'] },
  { type: 'vocal', startTime: 126.0, endTime: 131.0, items: ['राम', 'दूत', 'अतुलित', 'बल', 'धामा'] },
  { type: 'vocal', startTime: 131.0, endTime: 136.0, items: ['अंजनि', 'पुत्र', 'पवनसुत', 'नामा'] },
  { type: 'music', startTime: 136.0, endTime: 145.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 145.0, endTime: 151.0, items: ['महाबीर', 'बिक्रम', 'बजरंगी'] },
  { type: 'vocal', startTime: 151.0, endTime: 157.0, items: ['कुमति', 'निवार', 'सुमति', 'के', 'संगी'] },
  { type: 'vocal', startTime: 157.0, endTime: 162.76, items: ['कंचन', 'बरन', 'बिराज', 'सुबेसा'] },
  { type: 'vocal', startTime: 162.76, endTime: 168.36, items: ['कानन', 'कुंडल', 'कुंचित', 'केसा'] },
  { type: 'music', startTime: 168.36, endTime: 179.32, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 179.32, endTime: 184.06, items: ['हाथ', 'बज्र', 'औ', 'ध्वजा', 'बिराजै'] },
  { type: 'vocal', startTime: 184.64, endTime: 189.38, items: ['काँधे', 'मूँज', 'जनेऊ', 'साजै'] },
  { type: 'vocal', startTime: 189.96, endTime: 194.48, items: ['संकर', 'सुवन', 'केसरीनंदन'] },
  { type: 'vocal', startTime: 194.48, endTime: 200.0, items: ['तेज', 'प्रताप', 'महा', 'जग', 'बंदन'] },
  { type: 'music', startTime: 200.0, endTime: 211.26, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 211.26, endTime: 215.7, items: ['बिद्यावान', 'गुनी', 'अति', 'चातुर'] },
  { type: 'vocal', startTime: 215.7, endTime: 221.08, items: ['रामकाज', 'करिबे', 'को', 'आतुर'] },
  { type: 'vocal', startTime: 221.08, endTime: 226.6, items: ['प्रभुचरित्र', 'सुनिबे', 'को', 'रसिया'] },
  { type: 'vocal', startTime: 226.6, endTime: 232.0, items: ['रामलखन', 'सीता', 'मन', 'बसिया'] },
  { type: 'vocal', startTime: 232.2, endTime: 234.8, items: ['सूक्ष्म', 'रूप', 'धरि', 'सियहिं', 'दिखावा'] },
  { type: 'vocal', startTime: 234.8, endTime: 237.48, items: ['बिकट', 'रूप', 'धरि', 'लंक', 'जरावा'] },
  { type: 'vocal', startTime: 237.48, endTime: 240.0, items: ['भीम', 'रूप', 'धरि', 'असुर', 'सँहारे'] },
  { type: 'vocal', startTime: 240.0, endTime: 242.98, items: ['रामचन्द्र', 'के', 'काज', 'सँवारे'] },
  { type: 'music', startTime: 242.98, endTime: 272.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 272.0, endTime: 285.18, items: ['लाय', 'सँजीवन', 'लखन', 'जियाए'] },
  { type: 'vocal', startTime: 285.18, endTime: 290.66, items: ['श्रीरघुबीर', 'हरषि', 'उर', 'लाए'] },
  { type: 'vocal', startTime: 290.66, endTime: 295.92, items: ['रघुपति', 'कीन्ही', 'बहुत', 'बड़ाई'] },
  { type: 'vocal', startTime: 295.92, endTime: 302.0, items: ['तुम', 'मम', 'प्रिय', 'भरतहि', 'सम', 'भाई'] },
  { type: 'music', startTime: 302.0, endTime: 310.6, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 310.6, endTime: 317.66, items: ['सहस', 'बदन', 'तुम्हरो', 'जस', 'गावैं'] },
  { type: 'vocal', startTime: 317.66, endTime: 323.0, items: ['अस', 'कहि', 'श्रीपति', 'कंठ', 'लगावैं'] },
  { type: 'vocal', startTime: 323.0, endTime: 328.28, items: ['सनकादिक', 'ब्रह्मादि', 'मुनीसा'] },
  { type: 'vocal', startTime: 328.28, endTime: 332.0, items: ['नारद', 'सारद', 'सहित', 'अहीसा'] },
  { type: 'vocal', startTime: 332.0, endTime: 349.56, items: ['जम', 'कुबेर', 'दिगपाल', 'जहाँ', 'ते'] },
  { type: 'vocal', startTime: 349.56, endTime: 355.06, items: ['कबि', 'कोबिद', 'कहि', 'सके', 'कहाँ', 'ते'] },
  { type: 'vocal', startTime: 355.06, endTime: 360.46, items: ['तुम', 'उपकार', 'सुग्रीवहिं', 'कीन्हा'] },
  { type: 'vocal', startTime: 360.46, endTime: 365.58, items: ['राम', 'मिलाय', 'राज', 'पद', 'दीन्हा'] },
  { type: 'vocal', startTime: 365.58, endTime: 381.32, items: ['तुम्हरो', 'मंत्र', 'बिभीषन', 'माना'] },
  { type: 'vocal', startTime: 381.32, endTime: 386.66, items: ['लंकेस्वर', 'भए', 'सब', 'जग', 'जाना'] },
  { type: 'vocal', startTime: 386.66, endTime: 391.0, items: ['जुग', 'सहस्र', 'जोजन', 'पर', 'भानू'] },
  { type: 'vocal', startTime: 391.0, endTime: 395.5, items: ['लील्यो', 'ताहि', 'मधुर', 'फल', 'जानू'] },
  { type: 'vocal', startTime: 395.5, endTime: 400.0, items: ['प्रभु', 'मुद्रिका', 'मेलि', 'मुख', 'माहीं'] },
  { type: 'vocal', startTime: 400.0, endTime: 402.78, items: ['जलधि', 'लाँघि', 'गये', 'अचरज', 'नाहीं'] },
  { type: 'vocal', startTime: 402.78, endTime: 405.48, items: ['दुर्गम', 'काज', 'जगत', 'के', 'जेते'] },
  { type: 'vocal', startTime: 405.48, endTime: 408.32, items: ['सुगम', 'अनुग्रह', 'तुम्हरे', 'तेते'] },
  { type: 'music', startTime: 408.32, endTime: 436.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 436.0, endTime: 446.0, items: ['राम', 'दुआरे', 'तुम', 'रखवारे'] },
  { type: 'vocal', startTime: 446.0, endTime: 456.58, items: ['होत', 'न', 'आग्या', 'बिनु', 'पैसारे'] },
  { type: 'vocal', startTime: 456.58, endTime: 461.62, items: ['सब', 'सुख', 'लहै', 'तुम्हारी', 'सरना'] },
  { type: 'vocal', startTime: 461.62, endTime: 466.0, items: ['तुम', 'रक्षक', 'काहू', 'को', 'डर', 'ना'] },
  { type: 'vocal', startTime: 466.0, endTime: 478.0, items: ['आपन', 'तेज', 'सम्हारो', 'आपै'] },
  { type: 'vocal', startTime: 478.0, endTime: 488.0, items: ['तीनों', 'लोग', 'हाँक', 'तें', 'काँपै'] },
  { type: 'vocal', startTime: 488.0, endTime: 493.5, items: ['भूत', 'पिसाच', 'निकट', 'नहिं', 'आवै'] },
  { type: 'vocal', startTime: 493.5, endTime: 499.0, items: ['महाबीर', 'जब', 'नाम', 'सुनावै'] },
  { type: 'music', startTime: 499.0, endTime: 507.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 507.0, endTime: 515.0, items: ['नासै', 'रोग', 'हरै', 'सब', 'पीरा'] },
  { type: 'vocal', startTime: 515.0, endTime: 520.26, items: ['जपत', 'निरंतर', 'हनुमत', 'बीरा'] },
  { type: 'vocal', startTime: 520.26, endTime: 525.24, items: ['संकट', 'तें', 'हनुमान', 'छुड़ावै'] },
  { type: 'vocal', startTime: 525.24, endTime: 531.0, items: ['मन', 'क्रम', 'बचन', 'ध्यान', 'जो', 'लावै'] },
  { type: 'music', startTime: 531.0, endTime: 540.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 540.0, endTime: 546.0, items: ['सब', 'पर', 'राम', 'तपस्वी', 'राजा'] },
  { type: 'vocal', startTime: 546.0, endTime: 552.0, items: ['तिन', 'के', 'काज', 'सकल', 'तुम', 'साजा'] },
  { type: 'vocal', startTime: 552.0, endTime: 557.5, items: ['और', 'मनोरथ', 'जो', 'कोई', 'लावै'] },
  { type: 'vocal', startTime: 557.5, endTime: 562.5, items: ['सोइ', 'अमित', 'जीवन', 'फल', 'पावै'] },
  { type: 'vocal', startTime: 562.5, endTime: 565.3, items: ['चारों', 'जुग', 'परताप', 'तुम्हारा'] },
  { type: 'vocal', startTime: 565.3, endTime: 568.12, items: ['है', 'परसिद्ध', 'जगत', 'उजियारा'] },
  { type: 'vocal', startTime: 568.12, endTime: 571.0, items: ['साधु', 'संत', 'के', 'तुम', 'रखवारे'] },
  { type: 'vocal', startTime: 571.0, endTime: 573.62, items: ['असुर', 'निकंदन', 'राम', 'दुलारे'] },
  { type: 'music', startTime: 573.62, endTime: 605.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 605.0, endTime: 613.0, items: ['अष्ट', 'सिद्धि', 'नौ', 'निधि', 'के', 'दाता'] },
  { type: 'vocal', startTime: 613.0, endTime: 621.0, items: ['अस', 'बर', 'दीन', 'जानकी', 'माता'] },
  { type: 'vocal', startTime: 621.0, endTime: 626.5, items: ['राम', 'रसायन', 'तुम्हरे', 'पासा'] },
  { type: 'vocal', startTime: 626.5, endTime: 632.0, items: ['सदा', 'रहो', 'रघुपति', 'के', 'दासा'] },
  { type: 'vocal', startTime: 632.32, endTime: 648.0, items: ['तुम्हरे', 'भजन', 'राम', 'को', 'पावै'] },
  { type: 'vocal', startTime: 648.52, endTime: 653.0, items: ['जनम', 'जनम', 'के', 'दुख', 'बिसरावै'] },
  { type: 'vocal', startTime: 653.0, endTime: 658.68, items: ['अंत', 'काल', 'रघुबर', 'पुर', 'जाई'] },
  { type: 'vocal', startTime: 658.68, endTime: 663.86, items: ['जहाँ', 'जन्म', 'हरि', 'भक्त', 'कहाई'] },
  { type: 'vocal', startTime: 663.86, endTime: 680.0, items: ['और', 'देवता', 'चित्त', 'न', 'धरई'] },
  { type: 'vocal', startTime: 680.0, endTime: 685.32, items: ['हनुमत', 'सेइ', 'सर्ब', 'सुख', 'करई'] },
  { type: 'vocal', startTime: 685.32, endTime: 691.0, items: ['संकट', 'कटै', 'मिटै', 'सब', 'पीरा'] },
  { type: 'vocal', startTime: 691.0, endTime: 696.3, items: ['जो', 'सुमिरै', 'हनुमत', 'बलबीरा'] },
  { type: 'vocal', startTime: 696.3, endTime: 711.9, items: ['जै', 'जै', 'जै', 'हनुमान', 'गोसाईं'] },
  { type: 'vocal', startTime: 711.9, endTime: 717.1, items: ['कृपा', 'करहु', 'गुरुदेव', 'की', 'नाईं'] },
  { type: 'vocal', startTime: 717.1, endTime: 722.1, items: ['जो', 'सत', 'बार', 'पाठ', 'कर', 'कोई'] },
  { type: 'vocal', startTime: 722.1, endTime: 727.1, items: ['छूटहि', 'बंदि', 'महा', 'सुख', 'होई'] },
  { type: 'vocal', startTime: 727.1, endTime: 730.0, items: ['जो', 'यह', 'पढ़ै', 'हनुमान', 'चालीसा'] },
  { type: 'vocal', startTime: 730.0, endTime: 733.0, items: ['होय', 'सिद्धि', 'साखी', 'गौरीसा'] },
  { type: 'vocal', startTime: 733.0, endTime: 736.0, items: ['तुलसीदास', 'सदा', 'हरि', 'चेरा'] },
  { type: 'vocal', startTime: 736.0, endTime: 738.96, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'vocal', startTime: 738.96, endTime: 745.0, items: ['जो', 'यह', 'पढ़ै', 'हनुमान', 'चालीसा'] },
  { type: 'vocal', startTime: 745.0, endTime: 751.92, items: ['होय', 'सिद्धि', 'साखी', 'गौरीसा'] },
  { type: 'vocal', startTime: 751.92, endTime: 757.0, items: ['तुलसीदास', 'सदा', 'हरि', 'चेरा'] },
  { type: 'vocal', startTime: 757.0, endTime: 762.96, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'vocal', startTime: 762.96, endTime: 774.1, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'vocal', startTime: 774.1, endTime: 784.84, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'music', startTime: 784.84, endTime: 800.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 800.0, endTime: 822.0, items: ['पवनतनय', 'संकट', 'हरन'] },
  { type: 'vocal', startTime: 822.0, endTime: 831.0, items: ['मंगल', 'मूरति', 'रूप'] },
  { type: 'vocal', startTime: 831.0, endTime: 842.1, items: ['राम', 'लखन', 'सीता', 'सहित'] },
  { type: 'vocal', startTime: 842.1, endTime: 846.66, items: ['हृदय', 'बसहु', 'सुर', 'भूप'] },
  { type: 'music', startTime: 846.66, endTime: 878.4, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 878.4, endTime: 882.06, items: ['बोलो', 'भाई', 'सियावर', 'रामचंद्र', 'की', 'जय'] },
  { type: 'vocal', startTime: 882.06, endTime: 892.0, items: ['पवनसुत', 'हनुमान', 'की', 'जय'] },
  { type: 'vocal', startTime: 892.0, endTime: 900.92, items: ['उमापति', 'महादेव', 'की', 'जय'] },
  { type: 'vocal', startTime: 900.92, endTime: 911.5, items: ['बोलो', 'भाई', 'सब', 'संतन', 'की', 'जय'] },
  { type: 'music', startTime: 911.5, endTime: 961.39, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] }
];

const MANTRA_AUDIO: Record<string, any> = {
  hanuman: require('../../../assets/audio/audio ekant/Hanuman chalisa.mp3'),
  gayatri: require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3'),
  krishna: require('../../../assets/audio/audio ekant/leberch-yoga-509709.mp3'),
  shiva: require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3'),
};

const MANTRA_BG_AUDIO_URLS: Record<string, string> = {
  hanuman: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31f6c31f6c.mp3',
  gayatri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
  krishna: 'https://cdn.pixabay.com/audio/2022/01/18/audio_0a4c9a6b2f.mp3',
  shiva: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1532c.mp3',
};

export default function LiveJaapRoomView() {
  const router = useRouter();
  const { mantraType, title: roomTitle, fromHome } = useLocalSearchParams<{ 
    mantraType?: string,
    title?: string,
    fromHome?: string 
  }>();
  
  const selectedMantra = MANTRA_DATA[mantraType || 'gayatri'] || MANTRA_DATA.gayatri;
  const WORDS = selectedMantra.text.split(' ');
  
  const getLines = () => {
    const lines = [];
    for (let i = 0; i < WORDS.length; i += 4) {
      lines.push(WORDS.slice(i, i + 4).join(' '));
    }
    return lines;
  };
  const MANTRA_LINES = getLines();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'chant' | 'path'>('chant');
  const [reactions, setReactions] = useState<{ id: number; emoji: string; anim: Animated.Value }[]>([]);
  
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;
  
  // Scroller Animators
  const soloMoveAnim = useRef(new Animated.Value(100)).current;
  const soloFadeAnim = useRef(new Animated.Value(0)).current;

  // Get active line and highlighted index
  const getActiveKaraokeState = () => {
    if (mantraType === 'hanuman') {
      const time = currentTimeState;
      
      let seg = HANUMAN_CHALISA_SEGMENTS[0];
      for (const s of HANUMAN_CHALISA_SEGMENTS) {
        if (time >= s.startTime && time < s.endTime) {
          seg = s;
          break;
        }
      }
      if (time >= HANUMAN_CHALISA_SEGMENTS[HANUMAN_CHALISA_SEGMENTS.length - 1].endTime) {
        seg = HANUMAN_CHALISA_SEGMENTS[HANUMAN_CHALISA_SEGMENTS.length - 1];
      }
      
      const duration = seg.endTime - seg.startTime;
      const progress = Math.max(0, Math.min(1, (time - seg.startTime) / duration));
      const itemIndex = Math.min(
        Math.floor(progress * seg.items.length),
        seg.items.length - 1
      );
      
      const lineIndex = Math.floor(itemIndex / 4);
      const lineItems = seg.items.slice(lineIndex * 4, lineIndex * 4 + 4);
      const highlightedIdx = itemIndex % 4;
      const isMusic = seg.type === 'music';
      
      return {
        lineItems,
        highlightedIdx,
        isMusic,
        key: `hanuman-${seg.startTime}-${lineIndex}`,
      };
    } else {
      const lineIndex = Math.floor(currentIndex / 4);
      const lineItems = MANTRA_LINES[lineIndex] ? MANTRA_LINES[lineIndex].split(' ') : [];
      const highlightedIdx = currentIndex % 4;
      
      return {
        lineItems,
        highlightedIdx,
        isMusic: false,
        key: `other-${lineIndex}`,
      };
    }
  };

  const { lineItems, highlightedIdx, isMusic, key: activeLineKey } = getActiveKaraokeState();

  // Upcoming line text
  const getUpcomingLineText = () => {
    if (mantraType === 'hanuman') {
      const time = currentTimeState;
      let segIndex = 0;
      for (let i = 0; i < HANUMAN_CHALISA_SEGMENTS.length; i++) {
        const s = HANUMAN_CHALISA_SEGMENTS[i];
        if (time >= s.startTime && time < s.endTime) {
          segIndex = i;
          break;
        }
      }
      const seg = HANUMAN_CHALISA_SEGMENTS[segIndex];
      const duration = seg.endTime - seg.startTime;
      const progress = Math.max(0, Math.min(1, (time - seg.startTime) / duration));
      const itemIndex = Math.min(Math.floor(progress * seg.items.length), seg.items.length - 1);
      const lineIndex = Math.floor(itemIndex / 4);
      const nextLineStartIndex = (lineIndex + 1) * 4;
      if (nextLineStartIndex < seg.items.length) {
        return seg.items.slice(nextLineStartIndex, nextLineStartIndex + 4).join(' ');
      } else if (segIndex + 1 < HANUMAN_CHALISA_SEGMENTS.length) {
        return HANUMAN_CHALISA_SEGMENTS[segIndex + 1].items.slice(0, 4).join(' ');
      } else {
        return HANUMAN_CHALISA_SEGMENTS[0].items.slice(0, 4).join(' ');
      }
    } else {
      const nextLineIdx = Math.floor(currentIndex / 4) + 1;
      return MANTRA_LINES[nextLineIdx] || MANTRA_LINES[0];
    }
  };

  const upcomingLineText = getUpcomingLineText();

  // Dedicated animation effect for Hanuman Chalisa karaoke transitions
  useEffect(() => {
    if (mantraType !== 'hanuman') return;
    
    // Entry animation
    soloMoveAnim.setValue(50);
    soloFadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(soloMoveAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(soloFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [activeLineKey, mantraType]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const source = MANTRA_AUDIO[mantraType || 'gayatri'] || MANTRA_AUDIO.gayatri;
      let url = '';
      if (typeof source === 'number') {
        const resolved = Image.resolveAssetSource(source);
        url = resolved ? resolved.uri : '';
      } else if (typeof source === 'string') {
        url = source;
      } else if (source && typeof source === 'object' && source.uri) {
        url = source.uri;
      }
      
      if (!url) {
        url = MANTRA_BG_AUDIO_URLS[mantraType || 'gayatri'] || MANTRA_BG_AUDIO_URLS.gayatri;
      }

      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = isMuted ? 0 : 0.4;
      audioRef.current = audio;
      
      const handleTimeUpdate = () => {
        if (mantraType === 'hanuman') {
          setCurrentTimeState(audio.currentTime);
        }
      };
      audio.addEventListener('timeupdate', handleTimeUpdate);
      
      const playAudio = async () => {
        try { await audio.play(); } catch (e) { console.warn('Auto-play blocked'); }
      };
      playAudio();
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [mantraType, isMuted]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(upcomingFade, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(upcomingFade, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(1600),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (mantraType === 'hanuman') return;

    const isHanuman = mantraType === 'hanuman';
    const WORDS_PER_LINE = 4;
    const isNewLine = currentIndex % WORDS_PER_LINE === 0;

    if (isNewLine) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(soloMoveAnim, { toValue: 0, duration: isHanuman ? 250 : 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(soloFadeAnim, { toValue: 1, duration: isHanuman ? 200 : 300, useNativeDriver: true }),
        ]),
        Animated.delay(isHanuman ? 50 : 100),
      ]).start();
    }

    Animated.timing(activeIndexAnim, {
      toValue: currentIndex,
      duration: isHanuman ? 300 : 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      if ((currentIndex + 1) % WORDS_PER_LINE === 0) {
         Animated.parallel([
           Animated.timing(soloMoveAnim, { toValue: -100, duration: isHanuman ? 200 : 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
           Animated.timing(soloFadeAnim, { toValue: 0, duration: isHanuman ? 150 : 250, useNativeDriver: true }),
         ]).start(() => {
           soloMoveAnim.setValue(100);
         });
      }
    };
  }, [currentIndex, mantraType]);

  useEffect(() => {
    if (mantraType === 'hanuman') return;

    let timer: any;
    const isHanuman = mantraType === 'hanuman';
    if (isHolding) {
      timer = setTimeout(() => { setIsHolding(false); setCurrentIndex(0); }, 4000); 
      return () => clearTimeout(timer);
    }
    const currentWord = WORDS[currentIndex] || '';
    const wordDuration = isHanuman ? (currentWord.length > 7 ? 800 : 500) : (currentWord.length > 7 ? 3000 : 1200);
    timer = setTimeout(() => {
      if (currentIndex < WORDS.length - 1) setCurrentIndex(currentIndex + 1);
      else setIsHolding(true);
    }, wordDuration);
    return () => clearTimeout(timer);
  }, [currentIndex, isHolding, WORDS, mantraType]);

  const addReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const anim = new Animated.Value(0);
    setReactions(prev => [...prev, { id, emoji, anim }]);
    Animated.timing(anim, {
      toValue: 1, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(() => { setReactions(prev => prev.filter(r => r.id !== id)); });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={selectedMantra.bg} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient colors={['rgba(5,5,5,0.7)', 'rgba(5,5,5,0.9)', 'rgba(47,18,0,0.85)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {
              if (mantraType === 'kedarnath' || fromHome === 'true') {
                router.replace('/(tabs)/home');
              } else {
                router.replace('/(tabs)/jaap');
              }
            }} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
               <Text style={styles.participantLabel} numberOfLines={1}>{roomTitle || 'Live Jaap'}</Text>
               <Text style={styles.micStatusText}>Collective Chanting Room</Text>
            </View>
            <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.headerBtn}>
              <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity onPress={() => setActiveTab('chant')} style={[styles.tabButton, activeTab === 'chant' && styles.tabButtonActive]}>
              <Ionicons name="apps" size={18} color={activeTab === 'chant' ? '#FFEBB5' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === 'chant' && styles.tabTextActive]}>Chanting</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('path')} style={[styles.tabButton, activeTab === 'path' && styles.tabButtonActive]}>
              <Ionicons name="document-text" size={18} color={activeTab === 'path' ? '#FFEBB5' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === 'path' && styles.tabTextActive]}>Shloka Path</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={[styles.scrollContainer, { justifyContent: 'center', flex: 1 }]} scrollEnabled={false}>
            {activeTab === 'chant' ? (
              <View style={styles.soloFocusContainer}>
                 <Animated.View key={activeLineKey} style={[styles.soloWordBox, { opacity: soloFadeAnim, transform: [{ translateY: soloMoveAnim }] }]}>
                    <LinearGradient colors={['rgba(255,138,0,0.15)', 'rgba(255,138,0,0)']} style={styles.soloGlow} />
                    <View style={styles.soloLineWordsRow}>
                      {lineItems.map((word, idx) => {
                        const isHighlighted = highlightedIdx === idx;
                        return (
                          <Text 
                            key={`${word}-${idx}`} 
                            style={[
                              styles.soloWordText, 
                              isHighlighted ? styles.soloWordHighlighted : styles.soloWordDimmed,
                              isMusic && { fontSize: 32, marginHorizontal: 8 }
                            ]}
                          >
                            {word}{' '}
                          </Text>
                        );
                      })}
                    </View>
                    <View style={styles.soloOrnateUnderline} />
                 </Animated.View>
              </View>
            ) : (
              <View style={styles.fullShlokaBox}>
                <View style={styles.scrollHeader}>
                  <Ionicons name="document-text" size={16} color="#FFEBB5" />
                  <Text style={styles.scrollHeaderText}>Sacred Full Path</Text>
                </View>
                <Text style={styles.fullShlokaText}>{selectedMantra.text}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.reactionOverlay} pointerEvents="none">
            {reactions.map(r => (
              <Animated.Text key={r.id} style={[styles.floatingEmoji, {
                opacity: r.anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: r.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
                  { translateX: r.anim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 15, -15, 10, 0] }) },
                  { scale: r.anim.interpolate({ inputRange: [0, 0.2], outputRange: [0.6, 1.2], extrapolate: 'clamp' }) }
                ]
              }]}>{r.emoji}</Animated.Text>
            ))}
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.roomStatsBox}><Text style={styles.roomStats}>Sangat: Devotional Session</Text></View>
            <Animated.View style={[styles.upcomingBox, { opacity: upcomingFade }]}>
               <Text style={styles.upcomingLabel}>Upcoming Verse</Text>
               <Text style={styles.upcomingMantra} numberOfLines={1}>{upcomingLineText}</Text>
            </Animated.View>
            <View style={styles.transparentControlBar}>
              <View style={styles.leftControls}>
                <TouchableOpacity onPress={() => setIsMicEnabled(!isMicEnabled)} style={[styles.iconCircle, isMicEnabled && { backgroundColor: 'rgba(76, 217, 100, 0.2)', borderColor: '#4CD964' }]}>
                  <Ionicons name={isMicEnabled ? "mic" : "mic-off"} size={22} color={isMicEnabled ? "#4CD964" : "#FFF"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  if (mantraType === 'kedarnath' || fromHome === 'true') {
                    router.replace('/(tabs)/home');
                  } else {
                    router.replace('/(tabs)/jaap');
                  }
                }} style={[styles.iconCircle, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.rightReactions}>
                {['🙏', '❤️', '😊', '🔔'].map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => addReaction(emoji)} style={styles.reactionBtn}><Text style={styles.reactionBtnText}>{emoji}</Text></TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  participantLabel: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  micStatusText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  scrollContainer: { paddingVertical: 20, alignItems: 'center' },
  tabBar: { flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, marginTop: 20, borderRadius: 25, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 10 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 22, gap: 8 },
  tabButtonActive: { backgroundColor: 'rgba(255,107,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#FFEBB5' },
  soloFocusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: SCREEN_WIDTH },
  soloWordBox: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  soloLineWordsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: SCREEN_WIDTH - 40 },
  soloWordText: { fontSize: 44, fontWeight: '900', textAlign: 'center' },
  soloWordHighlighted: { color: '#FFF', textShadowColor: '#FF8A00', textShadowRadius: 15, transform: [{ scale: 1.05 }] },
  soloWordDimmed: { color: 'rgba(255,255,255,0.3)' },
  soloGlow: { position: 'absolute', width: 280, height: 120, borderRadius: 60, zIndex: -1 },
  soloOrnateUnderline: { width: 80, height: 2, backgroundColor: '#FF8A00', marginTop: 10, borderRadius: 1, opacity: 0.6 },
  fullShlokaBox: { marginTop: 40, backgroundColor: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 32, width: '92%', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  scrollHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,235,181,0.2)', paddingBottom: 10 },
  scrollHeaderText: { color: '#FFEBB5', fontSize: 14, fontWeight: '800' },
  fullShlokaText: { color: '#FFEBB5', fontSize: 20, textAlign: 'center', lineHeight: 36, fontWeight: '700' },
  footerContainer: { paddingBottom: 30, width: '100%', alignItems: 'center', gap: 15 },
  transparentControlBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', width: '92%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  leftControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rightReactions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  reactionBtnText: { fontSize: 22 },
  reactionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 100, paddingRight: 40, zIndex: 100 },
  floatingEmoji: { position: 'absolute', fontSize: 32, bottom: 0 },
  roomStatsBox: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roomStats: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  upcomingBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', maxWidth: '80%' },
  upcomingLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  upcomingMantra: { color: '#FFEBB5', fontSize: 13, fontWeight: '600' },
});
