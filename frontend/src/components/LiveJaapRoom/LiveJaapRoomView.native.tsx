// accessibility: placeholder
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Alert,
  Share,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentHanumanStatus, getCurrentOtherJaapStatus, getSynchronizedIndex } from '../../features/live-mantra/schedule';
import type { IRtcEngine, RtcConnection } from 'react-native-agora';
import { getAgoraToken } from '../../services/api';
import { usePassportStore } from '../../store/passportStore';
import { useTranslation } from '../../utils/i18n';
import { socketService } from '../../services/socket';
import { useKeepAwake } from 'expo-keep-awake';
declare const require: any;

const getAgoraModule = (): typeof import('react-native-agora') => require('react-native-agora');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MANTRA_DATA: Record<string, { text: string; bg: any }> = {
  gayatri: {
    text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
  hanuman: {
    text: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि बरनऊँ रघुबर बिमल जसु जो दायकु फल चारि बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार जय हनुमान ज्ञान गुन सागर जय कपीस तिहुँ लोक उजागर राम दूत अतुलित बल धामा अंजनि पुत्र पवनसुत नामा महाबीर बिक्रम बजरंगी कुमति निवार सुमति के संगी कंचन बरन बिराज सुबेसा कानन कुंडल कुंचित केसा हाथ बज्र औ ध्वजा बिराजै काँधे मूँज जनेऊ साजै संकर सुवन केसरीनंदन तेज प्रताप महा जग बंदन बिद्यावान गुनी अति चातुर राम काज करिबे को आतुर प्रभु चरित्र सुनिबे को रसिया राम लखन सीता मन बसिया सूक्ष्म रूप धरि सियहिं दिखावा बिकट रूप धरि लंक जरावा भीम रूप धरि असुर सँहारे रामचन्द्र के काज सँवारे लाय सँजीवन लखन जियाये श्रीरघुबीर हरषि उर लाये रघुपति कीन्ही बहुत बड़ाई तुम मम प्रिय भरतहि सम भाई सहस बदन तुम्हरो जस गावैं अस कहि श्रीपति के कंठ लगावैं सनकादिक ब्रह्मादि मुनीसा नारद सारद सहित अहीसा जम कुबेर दिगपाल जहाँ ते कबि कोबिद कहि सके कहाँ ते तुम उपकार सुग्रीवहिं कीन्हा राम मिलाय राज पद दीन्हा तुम्हरो मंत्र बिभीषन माना लंकेस्वर भए सब जग जाना जुग सहस्र जोजन पर भानू लील्यो ताहि मधुर फल जानू प्रभु मुद्रिका मेलि मुख माहीं जलधि लाँघि गये अचरज नाहीं दुर्गम काज जगत के जेते सुगम अनुग्रह तुम्हरे तेते राम दुआरे तुम रखवारे होत न आग्या बिनु पैसारे सब सुख लहै तुम्हारी सरना तुम रक्षक काहू को डर ना आपन तेज सम्हारो आपै तीनों लोक हाँक तें काँपै भूत पिसाच निकट नहिं आवै महाबीर जब नाम सुनावै नासै रोग हरै सब पीरा जपत निरंतर हनुमत बीरा संकट तें हनुमान छुड़ावै मन क्रम बचन ध्यान जो लावै सब पर राम तपस्वी राजा तिन के काज सकल तुम साजा और मनोरथ जो कोई लावै सोइ अमित जीवन फल पावै चारों जुग परताप तुम्हारा है परसिद्ध जगत उजियारा साधु संत के तुम रखवारे असुर निकंदन राम दुलारे अष्ट सिद्धि नौ निधि के दाता अस बर दीन जानकी माता राम रसायन तुम्हरे पासा सदा रहो रघुपति के दासा तुम्हरे भजन राम को पावै जनम जनम के दुख bिसरावै अंत काल रघुबर पुर जाई जहाँ जन्म हरि भक्त कहाई और देवता चित्त न धरई हनुमत सेइ सर्ब सुख करई संकट कटै मिटै सब पीरा जो सुमिरै हनुमत बलबीरा जै जै जै हनुमान गोसाईं कृपा करहु गुरुदेव की नाईं जो सत बार पाठ कर कोई छूटहि बंदि महा सुख होई जो यह पढ़ै हनुमान चालीसा होय सिद्धि साखी गौरीसा तुलसीदास सदा हरि चेरा कीजै नाथ हृदय मँह डेरा पवनतनय संकट हरन मंगल मूरति रूप राम लखन सीता सहित हृदय बसहु सुर भूप',
    bg: require('../../../assets/images/hanuman_jaap_card_v2.png'),
  },
  krishna: {
    text: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे',
    bg: require('../../../assets/images/krishna_jaap_card_v2.png'),
  },
  shiva: {
    text: 'ॐ\u00A0नमः\u00A0शिवाय',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
  mrityunjaya: {
    text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्',
    bg: require('../../../assets/images/jaap_hero_shiva_final.png'),
  },
  ganesh: {
    text: 'ॐ गं गणपतये नमः ॐ गं गणपतये नमः ॐ गं गणपतये नमः ॐ गं गणपतये नमः',
    bg: require('../../../assets/images/ganesh_jaap_card.png'),
  },
  laxmi: {
    text: 'ॐ श्रीं महालक्ष्म्यै नमः ॐ श्रीं महालक्ष्म्यै नमः ॐ श्रीं महालक्ष्म्यै नमः',
    bg: require('../../../assets/images/laxmi_jaap_card.png'),
  },
  shani_chalisa: {
    text: 'जय गणेश गिरिजा सुवन मंगल करन कृपाल दीनन के दुख दूर करि कीजै नाथ निहाल जय जय श्री शनिदेव प्रभु सुनहु विनय महाराज करहु कृपा हे रवि तनय राखहु जन की लाज जयति जयति शनिदेव दयाला करत सदा भक्तन प्रतिपाला चारि भुजा तनु श्याम विराजै माथे मुकुट छविली छाजै परम विशाल रूप अति सुन्दर तेज प्रताप जगत् प्रकाशक लोह अस्त्र कालिका प्यारा चंवर ढुरै प्यारे सिर द्वारा खड्ग त्रिशूल कुठार हाथ मह पल मह शत्रु करहि सब दाह मह पिंगल मन्द सुनयन लाला अति मन्द रूप सोहै विकराला कंचन थार आरती कीजै जा पर कुंकुम अक्षत दीजै कंचन दीप जलै दिन राती आरती करत भक्त हरषाती जय जय शनिदेव रवि नन्दन विध्न हरण मंगल के बन्दन लोह मन्दिर अति सुन्दर साजे घण्टा शंख झांझ बहु बाजे कीजै कृपा भक्तन पर स्वामी घट घट वासी अन्तर्यामी भक्तन के हित अवतार लीन्हा असुर मारि सुरन सुख दीन्हा जबहिं राम बनवासहि गयऊ तबहिं शनि कोप कोप भयो लछिमन को लगि शक्ति बाना तबहिं शनि कोप भयो अपमाना रावन की लंका जल गई तबहिं शनि कोप भयो दुःखदाई कौरव पाण्डव युद्ध भयो जब तबहिं शनि कोप भयो दुःख तब विक्रम पर जब कोप दिखायो पल मह राज पाट सब गयो हरिश्चन्द्र राजा बलवन्ता पल मह भयो भिखारी अनन्ता कीजै कृपा दयालु विधाता तुम हो जग के भाग्य विधाता तुमको ध्यावै जो मन लाई ताके दुख सब जाहिं नसाई जो यह चालीसा नित गावै ताके सब संकट कट जावै मन्दिर मह आरती करै जो कोय ताके घर मह मंगल होय शनिदेव की आरती गावै सो नर मनवाञ्छित फल पावै',
    bg: require('../../../assets/images/upcoming_shani.jpg'),
  },
};

const MANTRA_BG_AUDIO: Record<string, any> = {
  gayatri: require('../../../assets/audio/audio_ekant/gayatri_mantra.wav'),
  hanuman: require('../../../assets/audio/audio_ekant/hanuman_chalisa.mp3'),
  krishna: require('../../../assets/audio/audio_ekant/krishna_jaap.mp4'),
  shiva: require('../../../assets/audio/audio_ekant/final_om_namah_shivaay.mp4'),
  mrityunjaya: require('../../../assets/audio/audio_ekant/rmultimediaeu-birds-and-waterfall-250309.mp3'),
  ganesh: require('../../../assets/audio/audio_ekant/leberch-yoga-509070.mp3'),
  laxmi: require('../../../assets/audio/audio_ekant/rmultimediaeu-birds-and-waterfall-250309.mp3'),
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
  { type: 'music', startTime: 63.18, endTime: 72.52, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 72.52, endTime: 76.96, items: ['बुद्धिहीन', 'तनु', 'जानिके'] },
  { type: 'music', startTime: 76.96, endTime: 86.1, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 86.1, endTime: 89.62, items: ['सुमिरौं', 'पवन-कुमार'] },
  { type: 'music', startTime: 89.62, endTime: 93.62, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 93.62, endTime: 98.36, items: ['बल', 'बुधि', 'बिद्या', 'देहु', 'मोहिं'] },
  { type: 'music', startTime: 98.36, endTime: 99.36, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 99.36, endTime: 102.86, items: ['हरहु', 'कलेस', 'बिकार'] },
  { type: 'music', startTime: 102.86, endTime: 115.8, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 115.8, endTime: 120.14, items: ['जय', 'हनुमान', 'ज्ञान', 'गुन', 'सागर'] },
  { type: 'vocal', startTime: 120.14, endTime: 125.32, items: ['जय', 'कपीस', 'तिहुँ', 'लोक', 'उजागर'] },
  { type: 'vocal', startTime: 125.1, endTime: 130.38, items: ['राम', 'दूत', 'अतुलित', 'बल', 'धामा'] },
  { type: 'vocal', startTime: 130.38, endTime: 136.24, items: ['अंजनि', 'पुत्र', 'पवनसुत', 'नामा'] },
  { type: 'music', startTime: 136.24, endTime: 147.0, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 147.0, endTime: 152.08, items: ['महाबीर', 'बिक्रम', 'बजरंगी'] },
  { type: 'vocal', startTime: 152.08, endTime: 157.46, items: ['कुमति', 'निवार', 'सुमति', 'के', 'संगी'] },
  { type: 'vocal', startTime: 157.18, endTime: 162.58, items: ['कंचन', 'बरन', 'बिराज', 'सुबेसा'] },
  { type: 'vocal', startTime: 162.58, endTime: 168.24, items: ['कानन', 'कुंडल', 'कुंचित', 'केसा'] },
  { type: 'music', startTime: 168.24, endTime: 179.12, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 179.12, endTime: 184.04, items: ['हाथ', 'बज्र', 'औ', 'ध्वजा', 'बिराजै'] },
  { type: 'vocal', startTime: 184.64, endTime: 189.38, items: ['काँधे', 'मूँज', 'जनेऊ', 'साजै'] },
  { type: 'vocal', startTime: 189.96, endTime: 194.48, items: ['संकर', 'सुवन', 'केसरीनंदन'] },
  { type: 'vocal', startTime: 194.0, endTime: 199.9, items: ['तेज', 'प्रताप', 'महा', 'जग', 'बंदन'] },
  { type: 'music', startTime: 199.9, endTime: 211.26, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 211.26, endTime: 215.7, items: ['बिद्यावान', 'गुनी', 'अति', 'चातुर'] },
  { type: 'vocal', startTime: 215.7, endTime: 221.06, items: ['रामकाज', 'करिबे', 'को', 'आतुर'] },
  { type: 'vocal', startTime: 221.08, endTime: 226.6, items: ['प्रभुचरित्र', 'सुनिबे', 'को', 'रसिया'] },
  { type: 'vocal', startTime: 226.6, endTime: 232.0, items: ['रामलखन', 'सीता', 'मन', 'बसिया'] },
  { type: 'vocal', startTime: 232.18, endTime: 234.82, items: ['सूक्ष्म', 'रूप', 'धरि', 'सियहिं', 'दिखावा'] },
  { type: 'vocal', startTime: 234.82, endTime: 237.5, items: ['बिकट', 'रूप', 'धरि', 'लंक', 'जरावा'] },
  { type: 'vocal', startTime: 237.5, endTime: 240.12, items: ['भीम', 'रूप', 'धरि', 'असुर', 'सँहारे'] },
  { type: 'vocal', startTime: 240.12, endTime: 242.84, items: ['रामचन्द्र', 'के', 'काज', 'सँवारे'] },
  { type: 'music', startTime: 242.84, endTime: 279.5, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 279.5, endTime: 285.18, items: ['लाय', 'सँजीवन', 'लखन', 'जियाए'] },
  { type: 'vocal', startTime: 285.18, endTime: 290.66, items: ['श्रीरघुबीर', 'हरषि', 'उर', 'लाए'] },
  { type: 'vocal', startTime: 290.66, endTime: 295.92, items: ['रघुपति', 'कीन्ही', 'बहुत', 'बड़ाई'] },
  { type: 'vocal', startTime: 295.92, endTime: 302.0, items: ['तुम', 'मम', 'प्रिय', 'भरतहि', 'सम', 'भाई'] },
  { type: 'music', startTime: 302.0, endTime: 312.56, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 312.56, endTime: 317.66, items: ['सहस', 'बदन', 'तुम्हरो', 'जस', 'गावैं'] },
  { type: 'vocal', startTime: 318.08, endTime: 323.0, items: ['अस', 'कहि', 'श्रीपति', 'कंठ', 'लगावैं'] },
  { type: 'vocal', startTime: 323.34, endTime: 327.96, items: ['सनकादिक', 'ब्रह्मादि', 'मुनीसा'] },
  { type: 'vocal', startTime: 328.72, endTime: 333.3, items: ['नारद', 'सारद', 'सहित', 'अहीसा'] },
  { type: 'music', startTime: 333.3, endTime: 343.5, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 343.5, endTime: 349.56, items: ['जम', 'कुबेर', 'दिगपाल', 'जहाँ', 'ते'] },
  { type: 'vocal', startTime: 349.86, endTime: 355.06, items: ['कबि', 'कोबिद', 'कहि', 'सके', 'कहाँ', 'ते'] },
  { type: 'vocal', startTime: 355.06, endTime: 360.46, items: ['तुम', 'उपकार', 'सुग्रीवहिं', 'कीन्हा'] },
  { type: 'vocal', startTime: 360.46, endTime: 365.58, items: ['राम', 'मिलाय', 'राज', 'पद', 'दीन्हा'] },
  { type: 'music', startTime: 365.58, endTime: 376.56, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 376.56, endTime: 381.32, items: ['तुम्हरो', 'मंत्र', 'बिभीषन', 'माना'] },
  { type: 'vocal', startTime: 380.92, endTime: 386.66, items: ['लंकेस्वर', 'भए', 'सब', 'जग', 'जाना'] },
  { type: 'vocal', startTime: 386.04, endTime: 391.0, items: ['जुग', 'सहस्र', 'जोजन', 'पर', 'भानू'] },
  { type: 'vocal', startTime: 391.92, endTime: 397.56, items: ['लील्यो', 'ताहि', 'मधुर', 'फल', 'जानू'] },
  { type: 'vocal', startTime: 397.56, endTime: 400.2, items: ['प्रभु', 'मुद्रिका', 'मेलि', 'मुख', 'माहीं'] },
  { type: 'vocal', startTime: 400.2, endTime: 402.9, items: ['जलधि', 'लाँघि', 'गये', 'अचरज', 'नाहीं'] },
  { type: 'vocal', startTime: 402.9, endTime: 405.5, items: ['दुर्गम', 'काज', 'जगत', 'के', 'जेते'] },
  { type: 'vocal', startTime: 405.5, endTime: 408.32, items: ['सुगम', 'अनुग्रह', 'तुम्हरे', 'तेते'] },
  { type: 'music', startTime: 408.32, endTime: 445.5, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 445.5, endTime: 450.58, items: ['राम', 'दुआरे', 'तुम', 'रखवारे'] },
  { type: 'vocal', startTime: 451.32, endTime: 456.14, items: ['होत', 'न', 'आग्या', 'बिनु', 'पैसारे'] },
  { type: 'vocal', startTime: 456.14, endTime: 461.62, items: ['सब', 'सुख', 'लहै', 'तुम्हारी', 'सरना'] },
  { type: 'vocal', startTime: 461.62, endTime: 466.0, items: ['तुम', 'रक्षक', 'काहू', 'को', 'डर', 'ना'] },
  { type: 'music', startTime: 466.0, endTime: 478.1, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 478.1, endTime: 482.96, items: ['आपन', 'तेज', 'सम्हारो', 'आपै'] },
  { type: 'vocal', startTime: 482.96, endTime: 488.0, items: ['तीनों', 'लोग', 'हाँक', 'तें', 'काँपै'] },
  { type: 'vocal', startTime: 488.0, endTime: 493.5, items: ['भूत', 'पिसाच', 'निकट', 'नहिं', 'आवै'] },
  { type: 'vocal', startTime: 493.5, endTime: 499.0, items: ['महाबीर', 'जब', 'नाम', 'सुनावै'] },
  { type: 'music', startTime: 499.0, endTime: 509.36, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 509.36, endTime: 514.68, items: ['नासै', 'रोग', 'हरै', 'सब', 'पीरा'] },
  { type: 'vocal', startTime: 515.0, endTime: 520.26, items: ['जपत', 'निरंतर', 'हनुमत', 'बीरा'] },
  { type: 'vocal', startTime: 520.26, endTime: 525.24, items: ['संकट', 'तें', 'हनुमान', 'छुड़ावै'] },
  { type: 'vocal', startTime: 525.24, endTime: 531.0, items: ['मन', 'क्रम', 'बचन', 'ध्यान', 'जो', 'लावै'] },
  { type: 'music', startTime: 531.0, endTime: 541.6, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 541.6, endTime: 546.6, items: ['सब', 'पर', 'राम', 'तपस्वी', 'राजा'] },
  { type: 'vocal', startTime: 546.6, endTime: 552.0, items: ['तिन', 'के', 'काज', 'सकल', 'तुम', 'साजा'] },
  { type: 'vocal', startTime: 552.0, endTime: 557.5, items: ['और', 'मनोरथ', 'जो', 'कोई', 'लावै'] },
  { type: 'vocal', startTime: 557.5, endTime: 562.48, items: ['सोइ', 'अमित', 'जीवन', 'फल', 'पावै'] },
  { type: 'vocal', startTime: 562.5, endTime: 565.48, items: ['चारों', 'जुग', 'परताप', 'तुम्हारा'] },
  { type: 'vocal', startTime: 565.48, endTime: 568.1, items: ['है', 'परसिद्ध', 'जगत', 'उजियारा'] },
  { type: 'vocal', startTime: 568.12, endTime: 571.0, items: ['साधु', 'संत', 'के', 'तुम', 'रखवारे'] },
  { type: 'vocal', startTime: 571.0, endTime: 573.62, items: ['असुर', 'निकंदन', 'राम', 'दुलारे'] },
  { type: 'music', startTime: 573.62, endTime: 610.5, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 610.5, endTime: 616.06, items: ['अष्ट', 'सिद्धि', 'नौ', 'निधि', 'के', 'दाता'] },
  { type: 'vocal', startTime: 616.06, endTime: 621.42, items: ['अस', 'बर', 'दीन', 'जानकी', 'माता'] },
  { type: 'vocal', startTime: 621.0, endTime: 626.5, items: ['राम', 'रसायन', 'तुम्हरे', 'पासा'] },
  { type: 'vocal', startTime: 626.5, endTime: 632.0, items: ['सदा', 'रहो', 'रघुपति', 'के', 'दासा'] },
  { type: 'music', startTime: 632.0, endTime: 642.6, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 642.6, endTime: 648.22, items: ['तुम्हरे', 'भजन', 'राम', 'को', 'पावै'] },
  { type: 'vocal', startTime: 648.8, endTime: 653.5, items: ['जनम', 'जनम', 'के', 'दुख', 'बिसरावै'] },
  { type: 'vocal', startTime: 653.5, endTime: 658.68, items: ['अंत', 'काल', 'रघुबर', 'पुर', 'जाई'] },
  { type: 'vocal', startTime: 658.68, endTime: 663.86, items: ['जहाँ', 'जन्म', 'हरि', 'भक्त', 'कहाई'] },
  { type: 'music', startTime: 663.86, endTime: 674.5, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 674.5, endTime: 680.0, items: ['और', 'देवता', 'चित्त', 'न', 'धरई'] },
  { type: 'vocal', startTime: 680.0, endTime: 685.32, items: ['हनुमत', 'सेइ', 'सर्ब', 'सुख', 'करई'] },
  { type: 'vocal', startTime: 685.32, endTime: 691.0, items: ['संकट', 'कटै', 'मिटै', 'सब', 'पीरा'] },
  { type: 'vocal', startTime: 691.0, endTime: 696.3, items: ['जो', 'सुमिरै', 'हनुमत', 'बलबीरा'] },
  { type: 'music', startTime: 696.3, endTime: 704.3, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 704.3, endTime: 708.64, items: ['जै', 'जै', 'जै'] },
  { type: 'vocal', startTime: 708.64, endTime: 711.6, items: ['हनुमान', 'गोसाईं'] },
  { type: 'vocal', startTime: 711.6, endTime: 717.06, items: ['कृपा', 'करहु', 'गुरुदेव', 'की', 'नाईं'] },
  { type: 'vocal', startTime: 717.06, endTime: 722.1, items: ['जो', 'सत', 'बार', 'पाठ', 'कर', 'कोई'] },
  { type: 'vocal', startTime: 722.1, endTime: 727.1, items: ['छूटहि', 'बंदि', 'महा', 'सुख', 'होई'] },
  { type: 'vocal', startTime: 727.1, endTime: 730.82, items: ['जो', 'यह', 'पढ़ै', 'हनुमान', 'चालीसा'] },
  { type: 'vocal', startTime: 730.82, endTime: 733.52, items: ['होय', 'सिद्धि', 'साखी', 'गौरीसा'] },
  { type: 'vocal', startTime: 733.52, endTime: 736.14, items: ['तुलसीदास', 'सदा', 'हरि', 'चेरा'] },
  { type: 'vocal', startTime: 736.14, endTime: 738.96, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'music', startTime: 738.96, endTime: 741.96, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 741.96, endTime: 746.62, items: ['जो', 'यह', 'पढ़ै', 'हनुमान', 'चालीसा'] },
  { type: 'vocal', startTime: 746.66, endTime: 752.0, items: ['होय', 'सिद्धि', 'साखी', 'गौरीसा'] },
  { type: 'vocal', startTime: 752.0, endTime: 757.38, items: ['तुलसीदास', 'सदा', 'हरि', 'चेरा'] },
  { type: 'vocal', startTime: 757.38, endTime: 762.96, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'music', startTime: 762.96, endTime: 768.42, items: ['🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 768.42, endTime: 774.1, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'music', startTime: 774.1, endTime: 779.04, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 779.04, endTime: 784.84, items: ['कीजै', 'नाथ', 'हृदय', 'मँह', 'डेरा'] },
  { type: 'music', startTime: 784.84, endTime: 817.26, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 817.26, endTime: 822.0, items: ['पवनतनय', 'संकट', 'हरन'] },
  { type: 'music', startTime: 822.0, endTime: 827.16, items: ['🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 827.16, endTime: 831.0, items: ['मंगल', 'मूरति', 'रूप'] },
  { type: 'music', startTime: 831.0, endTime: 837.74, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 837.74, endTime: 842.0, items: ['राम', 'लखन', 'सीता', 'सहित'] },
  { type: 'music', startTime: 842.0, endTime: 843.3, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 843.3, endTime: 846.66, items: ['हृदय', 'बसहु', 'सुर', 'भूप'] },
  { type: 'music', startTime: 846.66, endTime: 878.4, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨'] },
  { type: 'vocal', startTime: 878.4, endTime: 882.06, items: ['बोलो', 'भाई', 'सियावर', 'रामचंद्र', 'की', 'जय'] },
  { type: 'music', startTime: 882.06, endTime: 888.38, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶'] },
  { type: 'vocal', startTime: 888.38, endTime: 892.0, items: ['पवनसुत', 'हनुमान', 'की', 'जय'] },
  { type: 'music', startTime: 892.0, endTime: 897.86, items: ['🎵', '🎶', '✨', '🎵', '🎵'] },
  { type: 'vocal', startTime: 897.86, endTime: 900.92, items: ['उमापति', 'महादेव', 'की', 'जय'] },
  { type: 'music', startTime: 900.92, endTime: 905.0, items: ['🎵', '🎶', '✨', '🎵'] },
  { type: 'vocal', startTime: 905.0, endTime: 911.5, items: ['बोलो', 'भाई', 'सब', 'संतन', 'की', 'जय'] },
  { type: 'music', startTime: 911.5, endTime: 961.39, items: ['🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵', '🎶', '✨', '🎵', '🎵'] }
];

const getSlotId = (date: Date, mType: string): string => {
  const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  if (mType === 'hanuman') {
    const status = getCurrentHanumanStatus(date);
    if (status.isActive) {
      return `${dateStr}_${status.sessionName}`;
    }
  } else {
    const status = getCurrentOtherJaapStatus(date, mType);
    if (status.isActive) {
      return `${dateStr}_${status.sessionName}`;
    }
  }
  return `${dateStr}_offline`;
};

export default function LiveJaapRoomView() {
  useKeepAwake();
  const { t } = useTranslation();
  const router = useRouter();
  const { initialMic, mantraType, title: roomTitle, fromHome } = useLocalSearchParams<{ 
    initialMic?: string, 
    mantraType?: string,
    title?: string,
    fromHome?: string 
  }>();
  const insets = useSafeAreaInsets();
  const streamIdRef = useRef<number | null>(null);

  const handleShare = async () => {
    try {
      const shareMessage = `Join me in the Live Jaap Room for collective chanting of ${roomTitle || (mantraType === 'hanuman' ? 'Hanuman Chalisa' : 'Gayatri Mantra')}! Let's chant together.`;
      await Share.share({
        message: shareMessage,
      });
    } catch (error: any) {
      console.log('Error sharing:', error.message);
    }
  };

  const [now, setNow] = useState(new Date());
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [personalCount, setPersonalCount] = useState(0);
  const lastTimeRef = useRef(0);
  const accumulatedTimeRef = useRef(0);

  const currentSlotId = useMemo(() => {
    return getSlotId(now, mantraType || 'gayatri');
  }, [now, mantraType]);

  const { countKey, accKey } = useMemo(() => {
    const prefix = mantraType === 'hanuman' ? '@hanuman_jaap' : `@jaap_${mantraType || 'gayatri'}`;
    return {
      countKey: `${prefix}_personal_count_${currentSlotId}`,
      accKey: `${prefix}_accumulated_seconds_${currentSlotId}`
    };
  }, [mantraType, currentSlotId]);

  const countKeyRef = useRef(countKey);
  const accKeyRef = useRef(accKey);

  useEffect(() => {
    countKeyRef.current = countKey;
    accKeyRef.current = accKey;
  }, [countKey, accKey]);

  // Load personal count and accumulated progress from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(countKey).then(val => {
      if (val) {
        const parsed = parseInt(val, 10);
        setPersonalCount(isNaN(parsed) ? 0 : parsed);
      } else {
        setPersonalCount(0);
      }
    });

    AsyncStorage.getItem(accKey).then(val => {
      if (val) {
        const parsed = parseFloat(val);
        accumulatedTimeRef.current = isNaN(parsed) ? 0 : parsed;
      } else {
        accumulatedTimeRef.current = 0;
      }
    });
  }, [countKey, accKey]);

  useEffect(() => {
    if (!isAppActive) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAppActive]);

  const hanumanStatus = getCurrentHanumanStatus(now);
  const otherStatus = getCurrentOtherJaapStatus(now, mantraType);

  const isHanuman = mantraType === 'hanuman';
  const isKedarnath = mantraType === 'kedarnath';
  const isOtherLiveJaap = !isHanuman && !isKedarnath && (mantraType === 'gayatri' || mantraType === 'krishna' || mantraType === 'shiva' || mantraType === 'ganesh' || mantraType === 'laxmi' || mantraType === 'mrityunjaya' || mantraType === 'shani_chalisa');

  const isSessionActive = isHanuman ? hanumanStatus.isActive : (isOtherLiveJaap ? otherStatus.isActive : true);
  
  const selectedMantra = MANTRA_DATA[mantraType || 'gayatri'] || MANTRA_DATA.gayatri;
  const WORDS = useMemo(() => {
    if (mantraType === 'gayatri') {
      return [
        'ॐ भूर्भुवः स्वः',
        'तत्सवितुर्वरेण्यं',
        'भर्गो देवस्य धीमहि',
        'धियो यो नः प्रचोदयात्'
      ];
    }
    return selectedMantra.text.split(/[\s\u00A0]+/g);
  }, [selectedMantra.text, mantraType]);
  
  const MANTRA_LINES = useMemo(() => {
    if (mantraType === 'gayatri') {
      return WORDS;
    }
    const lines = [];
    const wordsPerLine = mantraType === 'krishna' ? 8 : 4;
    for (let i = 0; i < WORDS.length; i += wordsPerLine) {
      lines.push(WORDS.slice(i, i + wordsPerLine).join(' '));
    }
    return lines;
  }, [WORDS, mantraType]);
  
  const ROOM_NAME = `jaap-${mantraType || 'gayatri'}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(initialMic === 'true');
  const [micStatus, setMicStatus] = useState('Joining room...');
  const [participantLabel, setParticipantLabel] = useState('Connecting...');
  const [remotePeers, setRemotePeers] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'chant' | 'path'>('chant');
  const [reactions, setReactions] = useState<{ id: number; emoji: string; anim: Animated.Value }[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeDevotees, setActiveDevotees] = useState<number>(() => {
    return 1200 + Math.floor(Math.random() * 301);
  });
  const joinTimeRef = useRef(Date.now());
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;
  const glowAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Scroller Animators
  const soloMoveAnim = useRef(new Animated.Value(100)).current;
  const soloFadeAnim = useRef(new Animated.Value(0)).current;
  
  const engine = useRef<IRtcEngine | null>(null);
  const agoraJoinedRef = useRef(false);
  const agoraInitializedRef = useRef(false);
  
  const bgPlayer = useAudioPlayer(MANTRA_BG_AUDIO[mantraType || 'gayatri'] || MANTRA_BG_AUDIO.gayatri, { updateInterval: 500, keepAudioSessionActive: true });
  const audioStatus = useAudioPlayerStatus(bgPlayer);

  // Polling loop for smooth subtitle highlight updates on Native
  useEffect(() => {
    if (!bgPlayer || !isAppActive) return;
    const interval = setInterval(() => {
      if (bgPlayer.currentTime !== undefined && bgPlayer.currentTime !== null) {
        const rawTime = bgPlayer.currentTime;
        const elapsed = mantraType === 'gayatri' ? (rawTime - 2.0 + 29.276) % 29.276 : rawTime;
        setCurrentTimeState(elapsed);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [bgPlayer, mantraType, isAppActive]);


  // Get active line and highlighted index
  const getActiveKaraokeState = () => {
    if (mantraType === 'hanuman') {
      if (hanumanStatus.isActive && 'isBreak' in hanumanStatus && hanumanStatus.isBreak) {
        return {
          lineItems: ['Have a deep breath'],
          highlightedIdx: 0,
          isMusic: false,
          key: 'hanuman-break',
          previousLineText: '',
          nextLineText: '',
        };
      }

      const time = audioStatus?.currentTime || 0;
      
      let segIndex = 0;
      for (let i = 0; i < HANUMAN_CHALISA_SEGMENTS.length; i++) {
        if (time >= HANUMAN_CHALISA_SEGMENTS[i].startTime && time < HANUMAN_CHALISA_SEGMENTS[i].endTime) {
          segIndex = i;
          break;
        }
      }
      if (time >= HANUMAN_CHALISA_SEGMENTS[HANUMAN_CHALISA_SEGMENTS.length - 1].endTime) {
        segIndex = HANUMAN_CHALISA_SEGMENTS.length - 1;
      }
      const seg = HANUMAN_CHALISA_SEGMENTS[segIndex];
      
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
      
      // Calculate previous line text
      let previousLineText = '';
      const prevLineStartIndex = (lineIndex - 1) * 4;
      if (prevLineStartIndex >= 0) {
        previousLineText = seg.items.slice(prevLineStartIndex, prevLineStartIndex + 4).join(' ');
      } else if (segIndex - 1 >= 0) {
        const prevSeg = HANUMAN_CHALISA_SEGMENTS[segIndex - 1];
        const prevSegLastLineIndex = Math.floor((prevSeg.items.length - 1) / 4);
        previousLineText = prevSeg.items.slice(prevSegLastLineIndex * 4, prevSegLastLineIndex * 4 + 4).join(' ');
      }
      
      // Calculate next line text
      let nextLineText = '';
      const nextLineStartIndex = (lineIndex + 1) * 4;
      if (nextLineStartIndex < seg.items.length) {
        nextLineText = seg.items.slice(nextLineStartIndex, nextLineStartIndex + 4).join(' ');
      } else if (segIndex + 1 < HANUMAN_CHALISA_SEGMENTS.length) {
        nextLineText = HANUMAN_CHALISA_SEGMENTS[segIndex + 1].items.slice(0, 4).join(' ');
      } else {
        nextLineText = HANUMAN_CHALISA_SEGMENTS[0].items.slice(0, 4).join(' ');
      }
      
      return {
        lineItems,
        highlightedIdx,
        isMusic,
        key: `hanuman-${seg.startTime}-${lineIndex}`,
        previousLineText,
        nextLineText,
      };
    } else {
      const wordsPerLine = mantraType === 'gayatri' ? 1 : (mantraType === 'krishna' ? 8 : 4);
      const lineIndex = mantraType === 'gayatri' ? currentIndex : Math.floor(currentIndex / wordsPerLine);
      const lineItems = MANTRA_LINES[lineIndex] ? MANTRA_LINES[lineIndex].split(' ') : [];
      const highlightedIdx = mantraType === 'gayatri' ? 0 : currentIndex % wordsPerLine;
      
      const previousLineText = lineIndex - 1 >= 0 ? MANTRA_LINES[lineIndex - 1] : '';
      const nextLineText = MANTRA_LINES[lineIndex + 1] || MANTRA_LINES[0] || '';
      
      return {
        lineItems,
        highlightedIdx,
        isMusic: false,
        key: `other-${lineIndex}`,
        previousLineText,
        nextLineText,
      };
    }
  };

  const { lineItems, highlightedIdx, isMusic, key: activeLineKey, previousLineText, nextLineText } = getActiveKaraokeState();

  // Upcoming line text
  const getUpcomingLineText = () => {
    if (mantraType === 'hanuman') {
      if (hanumanStatus.isActive && 'isBreak' in hanumanStatus && hanumanStatus.isBreak) {
        return 'Prepare to chant next round';
      }

      const time = audioStatus?.currentTime || 0;
      
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
      const itemIndex = Math.min(
        Math.floor(progress * seg.items.length),
        seg.items.length - 1
      );
      const lineIndex = Math.floor(itemIndex / 4);
      
      const nextLineStartIndex = (lineIndex + 1) * 4;
      if (nextLineStartIndex < seg.items.length) {
        return seg.items.slice(nextLineStartIndex, nextLineStartIndex + 4).join(' ');
      } else if (segIndex + 1 < HANUMAN_CHALISA_SEGMENTS.length) {
        const nextSeg = HANUMAN_CHALISA_SEGMENTS[segIndex + 1];
        return nextSeg.items.slice(0, 4).join(' ');
      } else {
        return HANUMAN_CHALISA_SEGMENTS[0].items.slice(0, 4).join(' ');
      }
    } else {
      const wordsPerLine = mantraType === 'krishna' ? 8 : 4;
      const nextLineIdx = Math.floor(currentIndex / wordsPerLine) + 1;
      return MANTRA_LINES[nextLineIdx] || MANTRA_LINES[0];
    }
  };

  const upcomingLineText = getUpcomingLineText();

  // Dedicated animation effect for Hanuman Chalisa karaoke transitions
  useEffect(() => {
    if (mantraType !== 'hanuman') return;
    
    // Entry animation (slides up from 35)
    soloMoveAnim.setValue(35);
    soloFadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(soloMoveAnim, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(soloFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [activeLineKey, mantraType]);

  // Accumulate native playback time
  useEffect(() => {
    if (audioStatus) {
      if (mantraType === 'shani_chalisa') return;
      const newTime = audioStatus.currentTime || 0;
      const lastTime = lastTimeRef.current;
      const diff = newTime - lastTime;
      
      let totalDuration = 0;
      if (mantraType === 'gayatri') {
        totalDuration = 29.276;
      } else if (mantraType === 'shiva') {
        totalDuration = 8.48; // 8.48s loop contains 1 main chant + instrumental tail, so 1 loop = 1 count
      } else if (mantraType === 'krishna') {
        totalDuration = 11.385; // 22.77s / 2 repetitions
      } else {
        const wordDurations = WORDS.map((w: string) => (w.length > 7 ? 3.0 : 1.2));
        totalDuration = wordDurations.reduce((a: number, b: number) => a + b, 0) + 4.0;
      }

      if (diff > 0 && diff < 3.0) {
        accumulatedTimeRef.current += diff;

        if (Math.floor(accumulatedTimeRef.current) % 10 === 0) {
          AsyncStorage.setItem(accKeyRef.current, accumulatedTimeRef.current.toString());
        }
        
        const threshold = isHanuman ? 961.39 : totalDuration;
        if (accumulatedTimeRef.current >= threshold) {
          accumulatedTimeRef.current = Math.max(0, accumulatedTimeRef.current - threshold);
          AsyncStorage.setItem(accKeyRef.current, accumulatedTimeRef.current.toString());
          setPersonalCount(prev => {
            const next = prev + 1;
            AsyncStorage.setItem(countKeyRef.current, next.toString());
            
            // Record to Passport Store
            usePassportStore.getState().addJaap(1, mantraType);
            if (isHanuman) {
              usePassportStore.getState().awardBadge(
                "Hanuman Chalisa Completed",
                "Completed 1 full Hanuman Chalisa jaap session."
              );
              setShowCompletion(true);
            } else {
              if (next % 108 === 0) {
                const readableMantra = mantraType === 'shiva' ? 'Om Namah Shivaya' : 'Gayatri Mantra';
                usePassportStore.getState().awardBadge(
                  `${readableMantra} Mala Completed`,
                  `Completed 1 full Mala (108 chants) of ${readableMantra}.`
                );
                setShowCompletion(true);
              }
            }
            return next;
          });
        }
      }
      lastTimeRef.current = newTime;
    }
  }, [audioStatus?.currentTime, mantraType, WORDS]);

  useEffect(() => {
    if (bgPlayer) {
      bgPlayer.loop = true;
      try {
        if (mantraType === 'shani_chalisa') {
          bgPlayer.pause();
          return;
        }
        const isCurrentlyBreak = isHanuman && hanumanStatus.isActive && hanumanStatus.isBreak;
        if (isSessionActive && !isCurrentlyBreak && !showCompletion) {
          // Perform an instant initial seek to the expected position before play starts
          let expected = 0;
          if (isHanuman) {
            const status = getCurrentHanumanStatus(new Date());
            if (status.isActive && !status.isCompleted && !status.isBreak) {
              expected = status.audioPositionSeconds;
            }
          } else {
            const status = getCurrentOtherJaapStatus(new Date(), mantraType);
            if (status.isActive) {
              const totalDuration = mantraType === 'gayatri' ? 29.276 : (mantraType === 'krishna' ? 22.77 : 8.48);
              expected = mantraType === 'gayatri'
                ? (status.elapsedSeconds + 2.0) % 29.276
                : status.elapsedSeconds % totalDuration;
            }
          }
          if (expected > 0) {
            bgPlayer.seekTo(expected);
          }
          bgPlayer.volume = isMuted ? 0 : (mantraType === 'hanuman' ? 0.3 : 0.9);
          bgPlayer.play();
        } else {
          bgPlayer.pause();
          if (isCurrentlyBreak) {
            bgPlayer.seekTo(0);
          }
        }
      } catch (e) {
        console.warn('Background player failed to play:', e);
      }
    }
  }, [bgPlayer, mantraType, isSessionActive, isHanuman, hanumanStatus.isActive ? hanumanStatus.isBreak : false, showCompletion]);

  // Handle dynamic volume changes on Native without re-triggering playback
  useEffect(() => {
    if (bgPlayer) {
      if (mantraType === 'shani_chalisa') {
        bgPlayer.volume = 0;
        bgPlayer.pause();
        return;
      }
      bgPlayer.volume = isMuted ? 0 : (mantraType === 'hanuman' ? 0.3 : 0.9);
    }
  }, [bgPlayer, isMuted, mantraType]);

  // Drift check and synchronization for Native player
  const syncPlayback = useCallback(() => {
    if (!bgPlayer || mantraType === 'shani_chalisa') return;
    if (mantraType === 'hanuman') {
      const status = getCurrentHanumanStatus(new Date());
      if (status.isActive && !status.isCompleted && !status.isBreak) {
        bgPlayer.seekTo(status.audioPositionSeconds);
      }
    } else {
      const status = getCurrentOtherJaapStatus(new Date(), mantraType);
      if (status.isActive) {
        const totalDuration = mantraType === 'gayatri' ? 29.276 : (mantraType === 'krishna' ? 22.77 : 8.48);
        const expected = mantraType === 'gayatri'
          ? (status.elapsedSeconds + 2.0) % 29.276
          : status.elapsedSeconds % totalDuration;
        bgPlayer.seekTo(expected);
      }
    }
  }, [bgPlayer, mantraType]);

  const updateActiveDevotees = useCallback((realCount: number) => {
    const baseCount = realCount > 10 ? realCount * 18 : Math.floor(Math.random() * 17) + 2;
    const finalCount = baseCount * 18 + Math.floor(Math.random() * 11) - 5;
    setActiveDevotees(Math.max(18, finalCount));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const active = nextAppState === 'active';
      setIsAppActive(active);
      if (active) {
        syncPlayback();
        glowAnimRef.current?.start();
        fadeAnimRef.current?.start();
      } else {
        glowAnimRef.current?.stop();
        fadeAnimRef.current?.stop();
      }
    });
    return () => subscription.remove();
  }, [syncPlayback]);

  // Explicit unmount cleanup for native background audio player
  useEffect(() => {
    return () => {
      if (bgPlayer) {
        try {
          bgPlayer.pause();
        } catch (e) {
          console.warn('Failed to pause bgPlayer on unmount:', e);
        }
      }
    };
  }, [bgPlayer]);

  // Cleanup Agora when completion screen is shown
  useEffect(() => {
    if (showCompletion) {
      cleanupAgora();
    }
  }, [showCompletion]);

  useEffect(() => {
    const initAudioMode = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
          shouldRouteThroughEarpiece: false,
          shouldPlayInBackground: true,
          allowsRecording: true,
          allowsBackgroundRecording: true,
        });
      } catch (error) {
        console.warn('Failed to set audio mode in LiveJaapRoom:', error);
      }
    };
    initAudioMode();

    glowAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    fadeAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(upcomingFade, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(upcomingFade, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(1600),
      ])
    );

    if (AppState.currentState === 'active') {
      glowAnimRef.current.start();
      fadeAnimRef.current.start();
    }

    setupAgora();
    return () => {
      glowAnimRef.current?.stop();
      fadeAnimRef.current?.stop();
      cleanupAgora();
    };
  }, []);

  const navigation = useNavigation();
  const allowedToRemoveRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowedToRemoveRef.current || showCompletion) {
        return;
      }
      e.preventDefault();
      allowedToRemoveRef.current = true;
      setShowCompletion(true);
    });
    return unsubscribe;
  }, [navigation, showCompletion]);

  useEffect(() => {
    const rName = 'jaap_' + (mantraType || 'gayatri');
    
    socketService.connect().then(() => {
      socketService.joinRoom(rName).then((res: any) => {
        syncPlayback();
        if (res && typeof res.count === 'number') {
          updateActiveDevotees(res.count);
        }
      });
    }).catch(err => console.warn('Socket connection failed in LiveJaapRoomView.native:', err));

    const handleCountUpdate = (data: { room: string; count: number }) => {
      if (data.room === rName) {
        updateActiveDevotees(data.count);
      }
    };
    
    socketService.onEvent('room_count_update', handleCountUpdate);

    return () => {
      socketService.offEvent('room_count_update', handleCountUpdate);
      socketService.leaveRoom(rName);
    };
  }, [mantraType, syncPlayback, updateActiveDevotees]);

  useEffect(() => {
    if (mantraType === 'hanuman') return;

    const WORDS_PER_LINE = 4;
    const isNewLine = currentIndex % WORDS_PER_LINE === 0;

    if (isNewLine) {
      soloMoveAnim.setValue(35);
      soloFadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(soloMoveAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(soloFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }

    Animated.timing(activeIndexAnim, {
      toValue: currentIndex,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      if ((currentIndex + 1) % WORDS_PER_LINE === 0) {
         Animated.parallel([
           Animated.timing(soloMoveAnim, { toValue: -35, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
           Animated.timing(soloFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
         ]).start(() => {
           soloMoveAnim.setValue(35);
         });
      }
    };
  }, [currentIndex, mantraType]);

  // Synchronized progress calculation for other live jaaps
  useEffect(() => {
    if (mantraType === 'hanuman' || mantraType === 'shani_chalisa') return;
    if (isSessionActive) {
      const time = currentTimeState || 0;
      const { currentIndex: syncIdx, isHolding: syncHold } = getSynchronizedIndex(WORDS, time, mantraType);
      setCurrentIndex(syncIdx);
      setIsHolding(syncHold);
    }
  }, [mantraType, isSessionActive, WORDS, currentTimeState]);

  useEffect(() => {
    if (mantraType === 'hanuman' || (isSessionActive && mantraType !== 'shani_chalisa')) return;
    if (!isAppActive) return;

    let timer: ReturnType<typeof setTimeout>;
    const isHanuman = mantraType === 'hanuman';
    
    if (isHolding) {
      timer = setTimeout(() => {
        setIsHolding(false);
        setCurrentIndex(0);
        if (mantraType === 'shani_chalisa') {
          setPersonalCount(prev => {
            const next = prev + 1;
            AsyncStorage.setItem(countKeyRef.current, next.toString());
            usePassportStore.getState().addJaap(1, mantraType);
            return next;
          });
        }
      }, 4000); 
      return () => clearTimeout(timer);
    }

    const currentWord = WORDS[currentIndex] || '';
    const wordDuration = isHanuman 
      ? (currentWord.length > 7 ? 800 : 500)
      : (currentWord.length > 7 ? 3000 : 1200);

    timer = setTimeout(() => {
      if (currentIndex < WORDS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsHolding(true);
      }
    }, wordDuration);
    return () => clearTimeout(timer);
  }, [currentIndex, isHolding, WORDS, mantraType, isSessionActive, isAppActive]);

  const setupAgora = async () => {
    try {
      const config = await getAgoraToken(ROOM_NAME);
      if (!config.enabled || !config.token || !config.appId) {
        setMicStatus(isMicEnabled ? (t('language') === 'hi' ? 'माइक चालू है' : 'Microphone Active') : (t('language') === 'hi' ? 'माइक बंद है' : 'Muted'));
        setParticipantLabel(t('agoraNotConfigured'));
        return;
      }
      const { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } = getAgoraModule();
      const agoraEngine = createAgoraRtcEngine();
      engine.current = agoraEngine;

      await agoraEngine.initialize({
        appId: config.appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      agoraInitializedRef.current = true;
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection) => {
          agoraJoinedRef.current = true;
          setParticipantLabel(`${t('connectedTo')} ${roomTitle || 'Sangat'}`);
          setMicStatus(isMicEnabled ? (t('language') === 'hi' ? 'माइक चालू है' : 'Microphone Active') : (t('language') === 'hi' ? 'माइक बंद है' : 'Muted'));
          
          // Create data stream for reactions
          try {
            const id = agoraEngine.createDataStream({
              syncWithAudio: false,
              ordered: false
            });
            streamIdRef.current = id;
          } catch (err) {
            console.warn('[Agora] Failed to create data stream', err);
          }
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number) => {
          setRemotePeers(prev => prev + 1);
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number) => {
          setRemotePeers(prev => Math.max(0, prev - 1));
        },
        onStreamMessage: (connection: RtcConnection, remoteUid: number, streamId: number, data: Uint8Array) => {
          try {
            const message = new TextDecoder().decode(data);
            const parsed = JSON.parse(message);
            if (parsed.type === 'reaction') {
              addReaction(parsed.emoji, false);
            }
          } catch (e) {
            console.warn('[Agora] Failed to decode stream message', e);
          }
        },
        onError: (err: number, msg: string) => {
          console.warn('[Agora] error code:', err, msg);
        }
      });
      await agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      await agoraEngine.joinChannel(config.token, ROOM_NAME, config.uid || 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        publishMicrophoneTrack: false, // Dummy mic: do not publish audio
        autoSubscribeAudio: false,     // Dummy mic: do not subscribe to others
      });
    } catch (error) {
      console.warn('[Agora] setup error:', error);
      setMicStatus(isMicEnabled ? (t('language') === 'hi' ? 'माइक चालू है' : 'Microphone Active') : (t('language') === 'hi' ? 'माइक बंद है' : 'Muted'));
    }
  };

  const cleanupAgora = async () => {
    try {
      if (agoraJoinedRef.current) {
        await engine.current?.leaveChannel();
      }
    } catch (e) {
      console.warn('[Agora] leaveChannel error:', e);
    }
    try {
      if (agoraInitializedRef.current) {
        await engine.current?.release();
        engine.current = null;
        agoraInitializedRef.current = false;
      }
    } catch (e) {
      console.warn('[Agora] release error:', e);
    }
    agoraJoinedRef.current = false;
  };

  const toggleMic = async () => {
    if (isMicEnabled) {
      setIsMicEnabled(false);
      setMicStatus(t('language') === 'hi' ? 'माइक बंद है' : 'Muted');
    } else {
      setIsMicEnabled(true);
      setMicStatus(t('language') === 'hi' ? 'माइक चालू है' : 'Microphone Active');
    }
  };

  const addReaction = (emoji: string, broadcast = true) => {
    const id = Date.now() + Math.random();
    const anim = new Animated.Value(0);
    setReactions(prev => [...prev, { id, emoji, anim }]);
    
    if (broadcast && streamIdRef.current !== null) {
      const message = JSON.stringify({ type: 'reaction', emoji });
      const data = new TextEncoder().encode(message);
      engine.current?.sendStreamMessage(streamIdRef.current, data, data.length);
    }

    Animated.timing(anim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    });
  };

  useEffect(() => {
    if (showCompletion) {
      router.replace({
        pathname: '/jaap-completed',
        params: { mantraType, fromHome }
      });
    }
  }, [showCompletion, mantraType, fromHome]);

  if (showCompletion) {
    return null;
  }

  return (
    <ImageBackground source={require('../../../assets/images/live_jaap_room_bg.png')} style={styles.container} resizeMode="cover">
      <Stack.Screen options={{ gestureEnabled: false }} />
      <StatusBar barStyle="dark-content" />
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* NEW HEADER */}
        <View style={styles.headerNew}>
          <TouchableOpacity onPress={() => {
              setShowCompletion(true);
            }} style={styles.headerBtn}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.titleContainerNew}>
              <Text style={styles.titleNew} numberOfLines={1}>{roomTitle || (t('language') === 'hi' ? 'हनुमान चालीसा' : 'Hanuman Chalisa')}</Text>
              <Text style={styles.subtitleNew}>{t('language') === 'hi' ? 'लाइव सामूहिक जाप' : 'LIVE COLLECTIVE JAAP'}</Text>
            </View>
            <View style={styles.countPillNew}>
              <Text style={styles.countLabelNew}>{isHanuman ? t('yourCount') : t('malaCount')}</Text>
              <Text style={styles.countValueNew}>{isHanuman ? personalCount : Math.floor(personalCount / 108)}</Text>
            </View>
          </View>

        {!isSessionActive ? (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownGlassCard}>
                <Text style={styles.countdownOmSymbol}>🕉️</Text>
                <Text style={styles.countdownTitle}>{roomTitle ? `${roomTitle} ${t('liveChanting')}` : t('liveChanting')}</Text>
                <Text style={styles.countdownSubtitle}>{t('liveJaapOffline')}</Text>
                
                <View style={styles.countdownTimerBox}>
                  <Text style={styles.countdownLabel}>{t('nextSessionStartsIn')}</Text>
                  <Text style={styles.countdownTimerText}>
                    {(() => {
                      const nextStart = (isHanuman && !hanumanStatus.isActive) 
                        ? hanumanStatus.nextSessionStart 
                        : ((!isHanuman && !otherStatus.isActive) ? otherStatus.nextSessionStart : null);
                      if (!nextStart) return '00:00:00';
                      const diffMs = nextStart.getTime() - now.getTime();
                      if (diffMs <= 0) return '00:00:00';
                      const hrs = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      const secs = Math.floor((diffMs % 60000) / 1000);
                      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    })()}
                  </Text>
                  <Text style={styles.nextSessionNameText}>
                    {t('language') === 'hi' ? 'सत्र' : 'Session'}: {(() => {
                      const nextName = (isHanuman && !hanumanStatus.isActive) 
                        ? hanumanStatus.nextSessionName 
                        : ((!isHanuman && !otherStatus.isActive) ? otherStatus.nextSessionName : '');
                      if (t('language') === 'hi') {
                        if (nextName.includes('Morning')) return nextName.replace('Morning', 'सुबह का');
                        if (nextName.includes('Afternoon')) return nextName.replace('Afternoon', 'दोपहर का');
                        if (nextName.includes('Evening')) return nextName.replace('Evening', 'शाम का');
                        if (nextName.includes('Night')) return nextName.replace('Night', 'रात का');
                      }
                      return nextName;
                    })()}
                  </Text>
                </View>

                <View style={styles.personalOfflineStatsBox}>
                  <Ionicons name="person-circle-outline" size={24} color="#FFEBB5" />
                  <Text style={styles.personalOfflineStatsTitle}>{t('completedChantingCount')}</Text>
                  <Text style={styles.personalOfflineStatsCount}>{personalCount}</Text>
                </View>

                <View style={styles.scheduleDetailsBox}>
                  <Text style={styles.scheduleTitle}>{t('dailyLiveSchedule')}</Text>
                  {isHanuman ? (
                    <>
                      <Text style={styles.scheduleItem}>{t('morningSchedule')}</Text>
                      <Text style={styles.scheduleItem}>{t('afternoonSchedule')}</Text>
                      <Text style={styles.scheduleItem}>{t('eveningSchedule')}</Text>
                      <Text style={styles.scheduleItem}>{t('nightSchedule')}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.scheduleItem}>{t('morningGaneshSchedule')}</Text>
                      <Text style={styles.scheduleItem}>{t('eveningGaneshSchedule')}</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity 
                  style={styles.ekantRedirectBtn}
                  onPress={() => router.replace('/ekant-jaap')}
                >
                  <LinearGradient
                    colors={['#FF6B00', '#FF8A00']}
                    style={styles.ekantBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="person" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.ekantRedirectBtnText}>{t('chantInEkantMode')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
        ) : (
            <View style={styles.activeRoomContainerNew}>
              {/* CHANTING WITH YOU PILL */}
              <View style={styles.chantingWithYouContainer}>
                <View style={styles.chantingWithYouPill}>
                  <Text style={styles.chantingLabelNew}>{t('chantingWithYou')}</Text>
                  <Text style={styles.chantingValueNew}>{activeDevotees.toLocaleString()} {t('souls')} </Text>
                  <Ionicons name="cellular" size={14} color="#FF8A00" />
                </View>
              </View>

              {/* MALA COUNT & PROGRESS AREA */}
              <View style={styles.malaStatusContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.85)', 'rgba(254, 227, 208, 0.9)']}
                  style={styles.malaStatusCard}
                >
                  <View style={styles.malaHeaderRow}>
                    <MaterialCommunityIcons name="dharmachakra" size={20} color="#FF6600" />
                    <Text style={styles.malaTitleText}>{t('personalMalaProgress')}</Text>
                  </View>
                  
                  {/* Beads Progress Bar */}
                  <View style={styles.beadsProgressRow}>
                    <View style={styles.beadsProgressBarBg}>
                      <View style={[styles.beadsProgressBarFill, { width: `${((personalCount % 108) / 108) * 100}%` }]} />
                    </View>
                    <Text style={styles.beadsText}>{personalCount % 108} / 108 {t('beads')}</Text>
                  </View>

                  {/* Completed Mala Section */}
                  {Math.floor(personalCount / 108) > 0 && (
                    <View style={styles.completedMalaSection}>
                      <LinearGradient
                        colors={['#FF6B00', '#FF8A00']}
                        style={styles.completedMalaBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                        <Text style={styles.completedMalaText}>
                          {Math.floor(personalCount / 108)} {t('language') === 'hi' ? 'माला पूर्ण' : (Math.floor(personalCount / 108) === 1 ? 'Mala Done' : 'Malas Done')}
                        </Text>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                      </LinearGradient>
                    </View>
                  )}
                </LinearGradient>
              </View>

              {/* MAIN CHANTING LYRICS AREA */}
              <View style={styles.lyricsAreaNew}>
                {isHanuman && hanumanStatus.isActive && hanumanStatus.isBreak ? (
                   <View style={styles.breakMessageContainer}>
                     <Text style={[styles.breakTextMain, { color: '#000' }]}>{t('deepBreath')}</Text>
                     <Text style={[styles.breakTextSub, { color: '#555' }]}>{t('nextJaapStartingSoon')}</Text>
                   </View>
                ) : (
                   <View style={styles.lyricsBoxNew}>
                      {/* Current Line */}
                      <View style={styles.currentLineBoxNew}>
                        {lineItems.map((word: string, idx: number) => {
                          const isHighlighted = mantraType === 'gayatri' || highlightedIdx === idx;
                          return (
                            <Text key={`${word}-${idx}`} style={[styles.wordNew, isHighlighted && styles.wordHighlightNew]}>
                              {word}{' '}
                            </Text>
                          );
                        })}
                      </View>
                      
                      {/* Next Line */}
                      <View style={styles.nextLineBoxNew}>
                         <Text style={styles.nextLineTextNew}>{nextLineText || ' '}</Text>
                      </View>
                   </View>
                )}
              </View>

              {/* BOTTOM ACTIONS AND METRICS */}
              <View style={styles.bottomAreaNew}>
                {/* Emojis */}
                <View style={styles.reactionRowNew}>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('❤️')}>
                     <Text style={styles.reactionEmojiNew}>❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('🙏')}>
                     <Text style={styles.reactionEmojiNew}>🙏</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('🔥')}>
                     <Text style={styles.reactionEmojiNew}>🔥</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reactionBtnNew} onPress={() => addReaction('ॐ')}>
                     <Text style={styles.reactionEmojiNew}>ॐ</Text>
                  </TouchableOpacity>
                </View>

                {/* Metrics */}
                <View style={styles.metricsRowNew}>
                  <View style={styles.metricItemNew}>
                    <Text style={styles.metricLabelNew}>{t('jaap').toUpperCase()}</Text>
                    <Text style={styles.metricValueNew}>{(isHanuman && hanumanStatus.isActive) ? hanumanStatus.roundOfSession : 1}<Text style={styles.metricSlashNew}> / {(isHanuman && hanumanStatus.isActive) ? hanumanStatus.totalRepsInSession : 21}</Text></Text>
                  </View>
                  <View style={styles.metricItemNew}>
                    <Text style={styles.metricLabelNew}>{t('remaining').toUpperCase()}</Text>
                    <Text style={styles.metricValueNew}>{(() => {
                        const nextEnd = (isHanuman && hanumanStatus.isActive) ? hanumanStatus.sessionEnd : (otherStatus.isActive ? otherStatus.sessionEnd : null);
                        if (!nextEnd) return '0h 0m';
                        const diffMs = nextEnd.getTime() - now.getTime();
                        if (diffMs <= 0) return '0h 0m';
                        const hrs = Math.floor(diffMs / 3600000);
                        const mins = Math.floor((diffMs % 3600000) / 60000);
                        return `${hrs}h ${mins}m`;
                      })()} <Text style={styles.metricSlashNew}>{t('remaining')}</Text></Text>
                  </View>
                  <View style={styles.metricItemNew}>
                    <Text style={styles.metricLabelNew}>{t('line').toUpperCase()}</Text>
                    <Text style={styles.metricValueNew}>
                      {(() => {
                        if (isHanuman) return Math.floor((audioStatus?.currentTime || 0)/15) + 1;
                        const wordsPerLine = mantraType === 'krishna' ? 8 : 4;
                        return Math.floor(currentIndex / wordsPerLine) + 1;
                      })()}
                      <Text style={styles.metricSlashNew}>
                        {' '}
                        / {isHanuman ? 65 : Math.ceil(WORDS.length / (mantraType === 'krishna' ? 8 : 4))}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Controls Bar */}
                <View style={styles.controlsBarNew}>
                  <TouchableOpacity onPress={toggleMic} style={isMicEnabled ? styles.volumeMuteBtnNew : styles.controlIconBtnNew}>
                    {isMicEnabled ? (
                      <Svg width={18} height={24} viewBox="0 0 18 24" fill="none">
                        <Rect x="5.25" y="1" width="7.5" height="13.5" rx="3.75" fill="#FFF" />
                        <Path d="M1.6 11.35C1.6 15.35 4.9 18.65 8.9 18.65C12.9 18.65 16.2 15.35 16.2 11.35" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                        <Path d="M8.9 18.65V22.7" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                      </Svg>
                    ) : (
                      <Svg width={18} height={24} viewBox="0 0 18 24" fill="none">
                        <Path d="M17.6291 20.541L1.40498 2.69451C0.979499 2.23743 0.218764 2.41235 0.0356704 3.00937C-0.0472796 3.27983 0.0166581 3.57396 0.204392 3.78557L4.0495 8.01499V11.3521C4.04866 14.9532 7.82314 17.3082 11.0573 15.7245L12.1828 16.9616C11.1922 17.5412 10.0645 17.8451 8.91673 17.8417C5.33422 17.8378 2.43101 14.9346 2.42709 11.3521C2.42709 10.7276 1.75109 10.3373 1.21029 10.6496C0.959305 10.7945 0.804683 11.0623 0.804683 11.3521C0.809802 15.5162 3.96284 19.002 8.10552 19.4236V22.7089C8.10552 23.3334 8.78152 23.7237 9.32233 23.4115C9.57332 23.2666 9.72793 22.9988 9.72793 22.7089V19.4225C10.9982 19.3 12.2207 18.8752 13.2932 18.1834L16.4285 21.6311C16.8429 22.0982 17.6076 21.9415 17.8049 21.349C17.8987 21.0675 17.8313 20.7582 17.6291 20.541ZM8.91673 14.5969C7.12461 14.597 5.67191 13.1442 5.67191 11.3521V9.79964L9.89626 14.4458C9.57941 14.546 9.24905 14.597 8.91673 14.5969ZM14.7493 14.2004C15.1844 13.3141 15.4093 12.3394 15.4064 11.3521C15.4064 10.7276 16.0824 10.3373 16.6232 10.6496C16.8742 10.7945 17.0288 11.0623 17.0288 11.3521C17.0321 12.5866 16.7507 13.8052 16.2064 14.9133C16.0704 15.1919 15.7874 15.3686 15.4773 15.3686C15.3539 15.3687 15.232 15.3402 15.1214 15.2854C14.7191 15.0885 14.5525 14.6028 14.7493 14.2004ZM4.4551 2.92266C5.95251 -0.511902 10.6064 -1.03751 12.8321 1.97656C13.4493 2.81229 13.7828 3.82356 13.7839 4.86245V11.3521C13.7838 11.5214 13.775 11.6906 13.7576 11.8591C13.7143 12.2739 13.3635 12.5884 12.9464 12.5861C12.918 12.5876 12.8896 12.5876 12.8612 12.5861C12.4158 12.5393 12.0925 12.1403 12.1392 11.6948C12.1504 11.5833 12.1565 11.4677 12.1565 11.3541V4.86245C12.1493 2.3646 9.44081 0.81121 7.2812 2.06635C6.68582 2.41238 6.21596 2.93885 5.93961 3.56959C5.72577 4.1563 4.95698 4.2915 4.5558 3.81295C4.34652 3.56333 4.30687 3.21272 4.4551 2.92266Z" fill="#1A1A1A" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={isMuted ? styles.controlIconBtnNew : styles.volumeMuteBtnNew}>
                    {isMuted ? (
                      <Svg width={24} height={22} viewBox="0 0 24 22" fill="none">
                        <Path d="M3.8443 1.08202C3.42997 0.614997 2.66542 0.771644 2.46814 1.36398C2.37439 1.64548 2.44182 1.9557 2.64397 2.17286L5.83438 5.68262H1.62207C0.726197 5.68258 0 6.40881 0 7.30469V13.793C0 14.6888 0.726197 15.4151 1.62207 15.415H6.20948L13.2898 20.9209C13.7827 21.3041 14.5056 21.01 14.591 20.3916C14.596 20.355 14.5986 20.3181 14.5986 20.2812V15.3228L18.8647 20.0156C19.279 20.4826 20.0435 20.326 20.2408 19.7337C20.3346 19.4522 20.2671 19.1419 20.065 18.9248L3.8443 1.08202ZM1.62207 7.30468H5.67724V13.793H1.62207V7.30468ZM12.9765 18.6227L7.29931 14.2076V7.29353L12.9765 13.5385V18.6227ZM17.2345 12.1577C18.0438 11.2386 18.0438 9.86112 17.2345 8.94196C16.8067 8.48723 17.6393 7.59679 17.6393 7.59679C17.9399 7.52599 18.2546 7.63206 18.451 7.87038C19.8007 9.40252 19.8007 11.6992 18.451 13.2313C18.0378 13.6996 17.2726 13.5449 17.0737 12.9529C16.9814 12.6781 17.0427 12.375 17.2345 12.1577ZM9.10791 4.45288C8.83259 4.09934 8.89614 3.58952 9.24984 3.3144L13.2898 0.171634C13.7827 -0.211559 14.5056 0.0825251 14.591 0.700994C14.5963 0.739234 14.5988 0.777803 14.5986 0.816409V8.40262C14.5986 9.02696 13.9228 9.41717 13.3821 9.105C13.1311 8.96012 12.9765 8.69238 12.9765 8.40262V2.47497L10.2454 4.60394C9.89069 4.87743 9.38144 4.81162 9.10791 4.45694V4.45288ZM23.52 10.5488C23.5212 12.5442 22.7858 14.4697 21.4549 15.9564C21.0312 16.4149 20.27 16.2428 20.0847 15.6466C20.0015 15.3786 20.0627 15.0867 20.2465 14.8747C22.4492 12.4118 22.4492 8.68688 20.2465 6.22398C19.8227 5.76545 20.0543 5.02018 20.6632 4.88248C20.9548 4.81653 21.2591 4.91637 21.4549 5.14226C22.7861 6.6283 23.52 8.5537 23.52 10.5488Z" fill="#1A1A1A" />
                      </Svg>
                    ) : (
                      <Svg width={24} height={22} viewBox="0 0 24 22" fill="none">
                        <Path d="M1.62207 5.68262H5.83438L12.9765 0V22L5.83438 16.3174H1.62207C0.726197 16.3174 0 15.5912 0 14.6953V7.30469C0 6.40881 0.726197 5.68262 1.62207 5.68262Z" fill="#FFF" />
                        <Path d="M16.5 7.5C18 9 18 13 16.5 14.5" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                        <Path d="M19.5 4.5C22.5 7.5 22.5 14.5 19.5 17.5" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} style={styles.controlIconBtnNew}>
                    <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
                      <Path d="M15.8304 15.4299C14.708 15.4295 13.6334 15.8966 12.8512 16.7247L8.0525 13.5514C8.42996 12.5555 8.42996 11.45 8.0525 10.4541L12.8512 7.28079C15.0902 9.64055 18.9724 8.62162 19.8392 5.44671C20.706 2.2718 17.9072 -0.677903 14.8014 0.137241C12.3801 0.772727 11.0444 3.44402 11.9498 5.84032L7.15105 9.01365C4.91459 6.65131 1.03126 7.66579 0.161055 10.8397C-0.709151 14.0136 2.08642 16.9665 5.19309 16.1549C5.93751 15.9605 6.61515 15.5579 7.15105 14.9919L11.9498 18.1652C10.7911 21.24 13.302 24.4522 16.4694 23.9473C19.6369 23.4423 21.0853 19.5989 19.0765 17.0291C18.2858 16.0175 17.092 15.4294 15.8304 15.4299ZM15.8304 1.72131C17.7535 1.72131 18.9555 3.86328 17.9939 5.57686C17.0323 7.29043 14.6284 7.29043 13.6668 5.57686C13.4475 5.18612 13.3321 4.74287 13.3321 4.29168C13.3321 2.8721 14.4506 1.72131 15.8304 1.72131ZM4.1719 14.5731C2.24876 14.5731 1.04679 12.4312 2.00836 10.7176C2.96994 9.004 5.37387 9.004 6.33544 10.7176C6.5547 11.1083 6.67013 11.5516 6.67013 12.0028C6.67013 13.4223 5.55164 14.5731 4.1719 14.5731ZM15.8304 22.2842C13.9072 22.2842 12.7052 20.1423 13.6668 18.4287C14.6284 16.7151 17.0323 16.7151 17.9939 18.4287C18.2132 18.8194 18.3286 19.2627 18.3286 19.7139C18.3286 21.1334 17.2101 22.2842 15.8304 22.2842Z" fill="#1A1A1A" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
        )}
      </View>

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  soloWordBox: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginVertical: 28 },
  soloLineWordsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: SCREEN_WIDTH - 24 },
  soloWordText: { fontSize: 50, textAlign: 'center', fontFamily: 'Outfit_700Bold', letterSpacing: 0.2 },
  soloWordHighlighted: { color: '#FFEBB5', textShadowColor: '#FF8A00', textShadowRadius: 18, transform: [{ scale: 1.08 }] },
  soloWordDimmed: { color: 'rgba(255, 255, 255, 0.28)', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  soloGlow: { position: 'absolute', width: 280, height: 120, borderRadius: 60, zIndex: -1 },
  soloOrnateUnderline: { width: 120, height: 3, backgroundColor: '#FF8A00', marginTop: 14, borderRadius: 2, opacity: 0.8 },
  verticalLyricsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  sideLineText: {
    fontSize: 26,
    textAlign: 'center',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 0.5,
  },
  nextLineText: {
    color: 'rgba(255, 235, 181, 0.4)', // Warm gold/yellow with 0.4 opacity
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previousLineText: {
    color: 'rgba(255, 235, 181, 0.25)', // More faded warm gold
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sideLineContainer: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH - 40,
  },
  fullShlokaBox: { marginTop: 40, backgroundColor: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 32, width: '92%', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  scrollHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,235,181,0.2)', paddingBottom: 10 },
  scrollHeaderText: { color: '#FFEBB5', fontSize: 14, fontWeight: '800' },
  fullShlokaText: { color: '#FFEBB5', fontSize: 20, textAlign: 'center', lineHeight: 36, fontWeight: '700' },
  footerContainer: { paddingBottom: 10, width: '100%', alignItems: 'center', gap: 15 },
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
  roomStatusBanner: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.25)',
  },
  roomStatusBannerGradient: {
    padding: 12,
    gap: 8,
  },
  bannerRowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerMainText: {
    color: '#FFEBB5',
    fontSize: 13,
    fontWeight: '700',
  },
  roundBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roundBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFEBB5',
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  countdownGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  countdownOmSymbol: {
    fontSize: 48,
    color: '#FF6B00',
    marginBottom: 8,
  },
  countdownTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  countdownSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  countdownTimerBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  countdownLabel: {
    color: '#FF8800',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  countdownTimerText: {
    color: '#FFEBB5',
    fontSize: 38,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,138,0,0.3)',
    textShadowRadius: 8,
  },
  nextSessionNameText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  scheduleDetailsBox: {
    width: '100%',
    gap: 6,
    marginBottom: 28,
  },
  scheduleTitle: {
    color: '#FFEBB5',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  scheduleItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  ekantRedirectBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  ekantBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekantRedirectBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  personalOfflineStatsBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
  },
  personalOfflineStatsTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginLeft: 10,
  },
  personalOfflineStatsCount: {
    color: '#FFEBB5',
    fontSize: 18,
    fontWeight: '800',
    backgroundColor: 'rgba(255, 138, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 0, 0.3)',
  },
  breakMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  breakTextMain: {
    color: '#FFEBB5',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  breakTextSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  breakCountdownCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakCountdownText: {
    color: '#FFEBB5',
    fontSize: 16,
    fontWeight: '700',
  },

  headerNew: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
  backBtnNew: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  titleContainerNew: { flex: 1, alignItems: 'center' },
  titleNew: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  subtitleNew: { fontSize: 10, fontWeight: '700', color: '#D45D00', letterSpacing: 1.5, marginTop: 2 },
  countPillNew: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', gap: 6 },
  countLabelNew: { fontSize: 9, fontWeight: '700', color: '#555', textAlign: 'right', lineHeight: 10 },
  countValueNew: { fontSize: 18, fontWeight: '800', color: '#000' },
  
  activeRoomContainerNew: { flex: 1, justifyContent: 'space-between' },
  chantingWithYouContainer: { alignItems: 'center', marginTop: 25 },
  chantingWithYouPill: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  chantingLabelNew: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 0.5 },
  chantingValueNew: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },

  lyricsAreaNew: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  lyricsBoxNew: { alignItems: 'center', width: '100%' },
  currentLineBoxNew: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 30 },
  wordNew: { fontSize: 30, fontWeight: '400', color: '#44403C', textAlign: 'center', lineHeight: 48, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  wordHighlightNew: {
    color: '#FF7300',
    fontWeight: '900',
    fontSize: 34,
    textShadowColor: 'rgba(255, 115, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  nextLineBoxNew: { alignItems: 'center', paddingHorizontal: 10 },
  nextLineTextNew: { fontSize: 18, fontWeight: '500', color: 'rgba(0,0,0,0.4)', textAlign: 'center', lineHeight: 28 },

  bottomAreaNew: { paddingBottom: Platform.OS === 'ios' ? 10 : 20, paddingHorizontal: 20 },
  reactionRowNew: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 25 },
  reactionBtnNew: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  reactionEmojiNew: { fontSize: 24 },
  reactionBadgeNew: { position: 'absolute', top: -4, right: -10, backgroundColor: '#FF453A', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  reactionBadgeTextNew: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  
  metricsRowNew: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 25 },
  metricItemNew: { alignItems: 'center' },
  metricLabelNew: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.5)', letterSpacing: 1, marginBottom: 4 },
  metricValueNew: { fontSize: 16, fontWeight: '800', color: '#000' },
  metricSlashNew: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.5)' },

  controlsBarNew: {
    flexDirection: 'row',
    backgroundColor: '#FEE3D0',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 71,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
    gap: 24,
  },
  controlIconBtnNew: { padding: 10 },
  volumeMuteBtnNew: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF8A00', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF8A00', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  malaStatusContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  malaStatusCard: {
    width: '90%',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    elevation: 4,
    shadowColor: '#FF6600',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  malaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  malaTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1400',
  },
  beadsProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  beadsProgressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  beadsProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 4,
  },
  beadsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D45D00',
    minWidth: 65,
    textAlign: 'right',
  },
  completedMalaSection: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedMalaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  completedMalaText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  completionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  completionSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  completionLotusContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  completionLotusEmoji: {
    fontSize: 28,
  },
  completionTitle: {
    fontSize: 36,
    fontFamily: 'Outfit_700Bold',
    color: '#5A4136',
    textAlign: 'center',
    letterSpacing: -0.9,
    marginTop: 16,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#5A4136',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 29.25,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  completionCard: {
    width: '100%',
    maxWidth: 342,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  completionBlurView: {
    ...StyleSheet.absoluteFillObject,
  },
  completionCardText1: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24.75,
    marginBottom: 16,
    zIndex: 1,
  },
  completionCardText2: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    zIndex: 1,
  },
  completionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 1,
  },
  completionButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFF',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  completionFooterContainer: {
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  completionFooterMantra: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
});
