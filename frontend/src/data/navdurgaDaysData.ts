export interface NavdurgaDayDetail {
  day: number;
  deviName: string;
  deviNameEn: string;
  titleSubtitle: string;
  colorName: string;
  colorNameEn: string;
  colorHex: string;
  colorMeaning: string;
  bhog: string;
  bhogEn: string;
  bhogSignificance: string;
  flower: string;
  mantra: string;
  dhyanShloka: string;
  audioTitle: string;
  audioUrl: string;
  emblemUri?: string;
  localImage?: any;
  gradientColors: [string, string, string];
  ritualSteps: {
    step: number;
    title: string;
    desc: string;
  }[];
  significance: string;
  katha?: string;
  beejMantra?: string;
  chakraOrPlanet?: string;
}

export const NAVDURGA_9_DAYS: NavdurgaDayDetail[] = [
  {
    day: 1,
    deviName: 'माँ शैलपुत्री',
    deviNameEn: 'Maa Shailputri',
    titleSubtitle: 'हिमालय पुत्री (Daughter of the Mountains)',
    colorName: 'पीला / नारंगी',
    colorNameEn: 'Yellow / Orange',
    colorHex: '#FB8C00',
    colorMeaning: 'खुशहाली, स्थिरता, ऊर्जा व संयम का प्रतीक (Grounding & Energy)',
    bhog: 'शुद्ध देशी गाय का घी, सफेद खीर व मिश्री',
    bhogEn: 'Pure Cow Desi Ghee, White Kheer & Mishri',
    bhogSignificance: 'आरोग्य, सौभाग्य, दीर्घायु व मानसिक शांति की प्राप्ति',
    flower: 'सफेद चमेली, सफेद कमल, सफेद गुलाब व लाल गुड़हल',
    mantra: 'ॐ देवी शैलपुत्र्यै नमः॥',
    beejMantra: 'ॐ ह्रीं श्रीं शैलपुत्र्यै नमः॥',
    dhyanShloka: 'वन्दे वाञ्छितलाभाय चन्द्रार्धकृतशेखराम्। वृषारूढां शूलधरां शैलपुत्रीं यशस्विनीम्॥',
    audioTitle: 'माँ शैलपुत्री स्तुति व वंदना (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/shailputri_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_durga.webp',
    localImage: require('../../assets/images/shailputri.jpg'),
    gradientColors: ['#E65100', '#F57C00', '#FF9800'],
    significance: 'माँ शैलपुत्री मूलाधार चक्र की अधिष्ठात्री देवी हैं तथा चन्द्रमा ग्रह की स्वामी हैं। इनकी आराधना से जीवन में स्थिरता, मानसिक तनाव से मुक्ति व तप का विकास होता है।',
    chakraOrPlanet: 'मूलाधार चक्र (Root Chakra) • स्वामी ग्रह: चन्द्र (Moon)',
    katha: 'पूर्व जन्म में माँ शैलपुत्री राजा दक्ष की पुत्री सती थीं और भगवान शिव की पत्नी थीं। राजा दक्ष ने एक भव्य यज्ञ आयोजित किया जिसमें सभी देवी-देवताओं को आमंत्रित किया, किंतु जानबूझकर शिवजी को निमंत्रण नहीं दिया। माता सती बिना बुलाए ही वहां पहुंचीं, जहां उनके पिता ने शिवजी का घोर अपमान किया। पति का अपमान सहन न कर पाने पर सती ने यज्ञ की पवित्र अग्नि में आत्मसमर्पण कर दिया।\n\nतत्पश्चात वही दिव्य शक्ति पर्वतराज हिमालय और मैना के घर पुत्री रूप में जन्मीं और "शैलपुत्री" कहलाईं। इस जन्म में भी उन्होंने कठोर तपस्या कर भगवान शिव को पति रूप में प्राप्त किया। आध्यात्मिक दृष्टि से यह पावन कथा अटूट भक्ति, धैर्य और नए दिव्य प्रारंभ का प्रतीक है।',
    ritualSteps: [
      { step: 1, title: 'घटस्थापना (Kalash Sthapana)', desc: 'मिट्टी के पात्र में सप्तधान्य (जौ) बोएं और उस पर गंगाजल युक्त तांबे का कलश, आम के पत्ते और नारियल स्थापित करें।' },
      { step: 2, title: 'अखंड ज्योति प्रज्वलन', desc: 'माँ भगवती के समक्ष शुद्ध घी का अखंड दीपक प्रज्वलित करें और ९ दिनों तक जलते रहने का संकल्प लें।' },
      { step: 3, title: 'शैलपुत्री आह्वान व पूजा', desc: 'श्वेत पुष्प और अक्षत लेकर माँ शैलपुत्री का ध्यान करें, कुमकुम व रोली से तिलक करें।' },
      { step: 4, title: 'घी का भोग व आरती', desc: 'गाय के शुद्ध देशी घी का भोग अर्पण करें तथा शैलपुत्री आरती व कपूर आरती संपन्न करें।' },
    ],
  },
  {
    day: 2,
    deviName: 'माँ ब्रह्मचारिणी',
    deviNameEn: 'Maa Brahmacharini',
    titleSubtitle: 'तपस्विनी स्वरूपा (The Ascetic Goddess)',
    colorName: 'सफेद',
    colorNameEn: 'White',
    colorHex: '#FFFFFF',
    colorMeaning: 'शांति, पवित्रता, सत्य व निर्मलता का प्रतीक (Peace & Purity)',
    bhog: 'शक्कर, मिश्री व सफेद मिष्ठान',
    bhogEn: 'Sugar, Rock Sugar (Mishri) & White Sweets',
    bhogSignificance: 'लंबी आयु, परिवार में सुख-समृद्धि व दृढ़ इच्छाशक्ति',
    flower: 'कमल व गुड़हल के पुष्प',
    mantra: 'ॐ देवी ब्रह्मचारिण्यै नमः॥',
    beejMantra: 'ॐ ऐं नमः॥',
    dhyanShloka: 'दधाना करपद्माभ्यामक्षमालाकमण्डलू। देवी प्रसीदतु मयि ब्रह्मचारिण्यनुत्तमा॥',
    audioTitle: 'माँ ब्रह्मचारिणी ध्यान व स्तोत्र (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/brahmacharini_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/festivals/sharad_navratri.webp',
    localImage: require('../../assets/images/brahmacharini.webp'),
    gradientColors: ['#424242', '#616161', '#9E9E9E'],
    significance: 'माँ ब्रह्मचारिणी कठिन तपस्या, संयम और वैराग्य की देवी हैं। इनकी साधना से साधक में एकाग्रता और संकटों से जूझने की शक्ति आती है।',
    chakraOrPlanet: 'स्वाधिष्ठान चक्र (Sacral Chakra) • स्वामी ग्रह: मंगल (Mars)',
    katha: 'पूर्व जन्म में इस देवी ने हिमालय के घर पुत्री रूप में जन्म लिया और नारद जी के उपदेश से भगवान शिव को पति रूप में पाने के लिए अति दुष्कर तपस्या की। एक हजार वर्ष तक केवल फल-मूल खाए और सौ वर्षों तक शाक पर निर्वाह किया। तत्पश्चात खुले आकाश के नीचे वर्षा व धूप सहते हुए टूटे हुए बिल्व पत्र खाकर तप करती रहीं। बाद में उन्होंने सूखे पत्ते खाना भी छोड़ दिया और "अपर्णा" कहलाईं। इस कठोर तप से प्रसन्न होकर ब्रह्मा जी ने उन्हें शिवजी को पति रूप में प्राप्त करने का वरदान दिया।',
    ritualSteps: [
      { step: 1, title: 'पवित्र स्नान व शुद्धि', desc: 'प्रातःकाल स्नानादि के बाद श्वेत वस्त्र धारण करें और माँ के चरण पखारें।' },
      { step: 2, title: 'कमंडल व जपमाला ध्यान', desc: 'माँ के दाएं हाथ में अक्षमाला और बाएं में कमंडल का ध्यान करते हुए गंध, अक्षत और पुष्प अर्पित करें।' },
      { step: 3, title: 'मिश्री व पंचामृत अर्पण', desc: 'माता को शक्कर, मिश्री या पंचामृत का भोग लगाकर दीर्घायु का वरदान मांगें।' },
      { step: 4, title: 'ब्रह्मचारिणी स्तोत्र पाठ', desc: 'माँ ब्रह्मचारिणी स्तोत्र व कवच का पाठ करें तथा कपूर आरती करें।' },
    ],
  },
  {
    day: 3,
    deviName: 'माँ चन्द्रघण्टा',
    deviNameEn: 'Maa Chandraghanta',
    titleSubtitle: 'घंटानाद स्वरूपा (The One with the Bell Moon)',
    colorName: 'लाल',
    colorNameEn: 'Red',
    colorHex: '#E53935',
    colorMeaning: 'शक्ति, पराक्रम, शौर्य व आकर्षण का प्रतीक (Courage & Passion)',
    bhog: 'दूध, मखाना खीर व पेड़ा',
    bhogEn: 'Milk Sweets & Makhana Kheer',
    bhogSignificance: 'शारीरिक व आत्मिक कष्टों का निवारण, साहस की प्राप्ति',
    flower: 'लाल गुलाब व शंखपुष्पी',
    mantra: 'ॐ देवी चन्द्रघण्टायै नमः॥',
    beejMantra: 'ॐ ऐं श्रीं शक्त्यै नमः॥',
    dhyanShloka: 'पिण्डज प्रवरारूढा चण्डकोपास्त्रकैर्युता। प्रसादम तनुते मह्यं चन्द्रघण्टेति विश्रुता॥',
    audioTitle: 'माँ चन्द्रघण्टा अमृतवाणी व वंदना (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/chandraghanta_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/temples/kamakhya.webp',
    localImage: require('../../assets/images/chandraghanta.jpg'),
    gradientColors: ['#B71C1C', '#C62828', '#D32F2F'],
    significance: 'माँ के मस्तक पर घंटे के आकार का अर्धचंद्र है। इनकी कृपा से अलौकिक सुगंध और घंटियों की मधुर ध्वनि जैसी सकारात्मक ऊर्जा का अनुभव होता है।',
    chakraOrPlanet: 'मणिपूर चक्र (Solar Plexus) • स्वामी ग्रह: शुक्र (Venus)',
    katha: 'जब भगवान शिव पार्वती जी से विवाह करने विचित्र बारात लेकर राजा हिमवान के महल पहुंचे, तो उनकी भयानक वेशभूषा देख सभी भयभीत हो गए। तब पार्वती जी ने तुरंत माँ चन्द्रघण्टा का स्वर्ण आभा युक्त दशभुजा रूप धारण किया, मस्तक पर घंटे के आकार का अर्धचंद्र सजाया और भगवान शिव से एक सौम्य राजकुमार का रूप धारण करने की विनती की। माँ के इस स्वरूप की कृपा से भय का नाश हुआ और विवाह उत्सव दिव्यता से संपन्न हुआ।',
    ritualSteps: [
      { step: 1, title: 'घंटा ध्वनि से आह्वान', desc: 'पूजा प्रारंभ करते समय पीतल या कांस्य की घंटी बजाकर नकारात्मक ऊर्जा दूर करें।' },
      { step: 2, title: 'लाल पुष्प व सिंदूर अर्पण', desc: 'माँ चन्द्रघण्टा को लाल गुलाब, सिंदूर, अक्षत और सुगंधित चन्दन अर्पित करें।' },
      { step: 3, title: 'दूध की खीर का भोग', desc: 'गाय के दूध से बनी मखाना खीर का भोग लगाकर परिवार के सभी सदस्यों में प्रसाद बांटें।' },
      { step: 4, title: 'शत्रु बाधा शांति पाठ', desc: 'माँ चन्द्रघण्टा के मंत्र का १०८ बार जप कर साहस व अभय की प्रार्थना करें।' },
    ],
  },
  {
    day: 4,
    deviName: 'माँ कूष्माण्डा',
    deviNameEn: 'Maa Kushmanda',
    titleSubtitle: 'ब्रह्मांड सृजनकर्ता (Creator of the Universe)',
    colorName: 'शाही नीला',
    colorNameEn: 'Royal Blue',
    colorHex: '#1E88E5',
    colorMeaning: 'असीम विस्तार, भव्यता, शक्ति व स्थिरता का प्रतीक (Elegance & Divinity)',
    bhog: 'मालपुआ',
    bhogEn: 'Malpua & Sweet Delicacies',
    bhogSignificance: 'बुद्धि, बल, यश और तेज में असाधारण वृद्धि',
    flower: 'पीले व नारंगी गेंदा पुष्प (Marigold)',
    mantra: 'ॐ देवी कूष्माण्डायै नमः॥',
    beejMantra: 'ॐ ह्रीं देव्यै नमः॥',
    dhyanShloka: 'सुरासम्पूर्ण कलशं रुधिराप्लुतमेव च। दधाना हस्तपद्माभ्यां कूष्माण्डा शुभदास्तु मे॥',
    audioTitle: 'माँ कूष्माण्डा स्तुति व आरती (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/kushmanda_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/festivals/navratri_story_hero.webp',
    localImage: require('../../assets/images/kushmanda.jpg'),
    gradientColors: ['#0D47A1', '#1565C0', '#1976D2'],
    significance: 'जब चारों ओर अंधकार था, तब अपनी मंद मुस्कान से इन्होंने ब्रह्मांड की रचना की थी। यह सूर्यमंडल के भीतर निवास करने वाली एकमात्र शक्ति हैं।',
    chakraOrPlanet: 'अनाहत चक्र (Heart Chakra) • स्वामी ग्रह: सूर्य (Sun)',
    katha: 'सृष्टि के आरंभ से पूर्व जब कोई लोक, नक्षत्र या प्रकाश नहीं था और केवल शून्य अंधकार फैला था, तब माँ भगवती ने अपनी ईषत् (मंद) मुस्कान से ब्रह्मांडीय अंड को जन्म दिया। इसलिए इन्हें कूष्माण्डा कहा गया। सूर्यलोक के भीतरी गर्भ में केवल माँ का निवास है और संपूर्ण जगत के सूर्य को उनका ही तेज प्रकाशित करता है।',
    ritualSteps: [
      { step: 1, title: 'सूर्य ऊर्जा ध्यान', desc: 'शाही नीले रंग के वस्त्र धारण कर पूर्व दिशा की ओर मुख करके माँ के तेजोमय रूप का ध्यान करें।' },
      { step: 2, title: 'अष्टभुजा कुमकुम अर्पण', desc: 'अष्टभुजा देवी को कुमकुम, सुहाग की सामग्री और पीले गेंदे के फूलों की माला चढ़ाएं।' },
      { step: 3, title: 'मालपुए का नैवेद्य', desc: 'घी में बने मालपुए का भोग अर्पित करें और ब्राह्मणों व कन्याओं को वितरित करें।' },
      { step: 4, title: 'कूष्माण्डा ध्यान व आरती', desc: 'गायत्री मंत्र सहित कूष्माण्डा बीज मंत्र का जाप कर धूप-दीप आरती संपन्न करें।' },
    ],
  },
  {
    day: 5,
    deviName: 'माँ स्कन्दमाता',
    deviNameEn: 'Maa Skandamata',
    titleSubtitle: 'कार्तिकेय जननी (Mother of Lord Kartikeya)',
    colorName: 'पीला',
    colorNameEn: 'Yellow',
    colorHex: '#FBC02D',
    colorMeaning: 'ज्ञान, बुद्धि, तेजस्विता व आनंद का प्रतीक (Wisdom & Joy)',
    bhog: 'केला (कदली फल)',
    bhogEn: 'Fresh Ripe Bananas',
    bhogSignificance: 'संतान सुख, मानसिक शांति व विवेक की प्राप्ति',
    flower: 'सफेद चमेली, मोगरा व कमल',
    mantra: 'ॐ देवी स्कन्दमातायै नमः॥',
    beejMantra: 'ॐ क्लीं स्कन्दमातायै नमः॥',
    dhyanShloka: 'सिंहासनगता नित्यं पद्माश्रितकरद्वया। शुभदास्तु सदा देवी स्कन्दमाता यशस्विनी॥',
    audioTitle: 'माँ स्कन्दमाता वंदना व वात्सल्य पाठ (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/skandamata_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/temples/vaishnodevi.webp',
    localImage: require('../../assets/images/skandmata.jpg'),
    gradientColors: ['#F57F17', '#FBC02D', '#FDD835'],
    significance: 'स्कन्द (भगवान कार्तिकेय) की माता होने के कारण इन्हें स्कन्दमाता कहा जाता है। इनकी पूजा से स्वतः ही भगवान कार्तिकेय की कृपा भी प्राप्त होती है।',
    chakraOrPlanet: 'विशुद्ध चक्र (Throat Chakra) • स्वामी ग्रह: बुध (Mercury)',
    katha: 'तारकासुर नामक दैत्य के अत्याचारों से देवलोक त्रस्त था। उसे वरदान था कि केवल शिवजी का पुत्र ही उसका वध कर सकेगा। भगवान शिव और माता पार्वती के तेज से जन्मे बालक स्कन्द (कार्तिकेय) को देवसेनापति बनाया गया। माँ ने अपनी गोद में बाल स्कन्द को बैठाकर वात्सल्य रूप में दर्शन दिए, जिससे स्कन्द ने तारकासुर का संहार किया।',
    ritualSteps: [
      { step: 1, title: 'मातृत्व व बालक स्कन्द पूजन', desc: 'माँ की गोद में बैठे बाल कार्तिकेय और माँ दोनों को एक साथ प्रणाम करें।' },
      { step: 2, title: 'श्वेत चंदन व पुष्प अर्पण', desc: 'सफेद चंदन का तिलक लगाएं और सुगन्धित मोगरे अथवा चमेली के फूल अर्पित करें।' },
      { step: 3, title: 'केले का विशेष भोग', desc: 'पके हुए केले का नैवेद्य लगाएं और बाद में इसे जरूरतमंदों में प्रसाद स्वरूप बांटें।' },
      { step: 4, title: 'संतान रक्षा व शांति मंत्र', desc: 'स्कन्दमाता के मंत्र का जप कर परिवार के स्वास्थ्य व वंश वृद्धि की प्रार्थना करें।' },
    ],
  },
  {
    day: 6,
    deviName: 'माँ कात्यायनी',
    deviNameEn: 'Maa Katyayani',
    titleSubtitle: 'महिषासुरमर्दिनी (The Warrior Goddess)',
    colorName: 'हरा',
    colorNameEn: 'Green',
    colorHex: '#43A047',
    colorMeaning: 'प्रकृति, विकास, समृद्धि व नवजीवन का प्रतीक (Growth & Harmony)',
    bhog: 'शुद्ध शहद (मधु)',
    bhogEn: 'Pure Raw Honey',
    bhogSignificance: 'आकर्षण, वाणी में ओज व विवाह संबंधित अड़चनों का निवारण',
    flower: 'लाल गुड़हल व गुलाब',
    mantra: 'ॐ देवी कात्यायन्यै नमः॥',
    beejMantra: 'ॐ क्लीं श्रीं त्रिनेत्रायै नमः॥',
    dhyanShloka: 'चन्द्रहासोज्ज्वलकरा शार्दूलवरवाहना। कात्यायनी शुभं दद्याद् देवी दानवघातिनी॥',
    audioTitle: 'माँ कात्यायनी महामंत्र व स्तुति (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/katyayani_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/temples/KanakaDurga.webp',
    localImage: require('../../assets/images/katayani.jpg'),
    gradientColors: ['#1B5E20', '#2E7D32', '#43A047'],
    significance: 'महर्षि कात्यायन की तपस्या से प्रकट हुई यह देवी महिषासुर का वध करने वाली हैं। ब्रज की गोपियों ने कृष्ण को पाने के लिए इन्हीं की आराधना की थी।',
    chakraOrPlanet: 'आज्ञा चक्र (Third Eye Chakra) • स्वामी ग्रह: बृहस्पति (Jupiter)',
    katha: 'महर्षि कात्यायन ने भगवती पराशक्ति को अपनी पुत्री के रूप में पाने के लिए वर्षों कठोर तपस्या की। जब महिषासुर के आतंक से त्रिलोकी कांप उठी, तब त्रिदेवों के तेज से महर्षि कात्यायन के आश्रम में देवी का प्राकट्य हुआ। महर्षि ने सर्वप्रथम उनका पूजन किया, इसलिए वे "कात्यायनी" कहलाईं। माँ ने सिंह पर सवार होकर महिषासुर का संहार किया।',
    ritualSteps: [
      { step: 1, title: 'गोधूलि वेला पूजन', desc: 'माँ कात्यायनी की पूजा शाम के समय (गोधूलि वेला) में करना विशेष रूप से फलदायी माना जाता है।' },
      { step: 2, title: 'लाल चुनरी व सिंदूर अर्पण', desc: 'माँ को गहरे लाल रंग की चुनरी, लाल चूड़ियां और सिंदूर अर्पित करें।' },
      { step: 3, title: 'शहद का अर्पण', desc: 'कांच या चांदी के पात्र में शुद्ध शहद का भोग लगाकर कांति व सौम्यता की प्रार्थना करें।' },
      { step: 4, title: 'शीघ्र विवाह व विजय संकल्प', desc: 'कात्यायनी महामंत्र का पाठ कर सभी प्रकार के भय और बाधाओं से मुक्ति पाएं।' },
    ],
  },
  {
    day: 7,
    deviName: 'माँ कालरात्रि',
    deviNameEn: 'Maa Kalaratri',
    titleSubtitle: 'शुभंकरी व अंधकार नाशिनी (The Destroyer of Darkness)',
    colorName: 'धूसर / स्लेटी',
    colorNameEn: 'Grey',
    colorHex: '#78909C',
    colorMeaning: 'संतुलन, सुरक्षा व नकारात्मक ऊर्जा के नाश का प्रतीक (Balance & Strength)',
    bhog: 'गुड़ व गुड़ से बनी मिठाई',
    bhogEn: 'Jaggery (Gud) & Sweets',
    bhogSignificance: 'शोक, अकाल मृत्यु का भय व तंत्र-बाधा का समूल नाश',
    flower: 'रात की रानी व नीलकमल',
    mantra: 'ॐ देवी कालरात्र्यै नमः॥',
    beejMantra: 'ॐ क्लीं ऐं श्रीं कालिकायै नमः॥',
    dhyanShloka: 'एकवेणी जपाकर्णपूरा नग्ना खरास्थिता। लम्बोष्ठी कर्णिकाकर्णी तैलाभ्यक्तशरीरिणी॥',
    audioTitle: 'माँ कालरात्रि कवच व विनाशक स्तुति (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/kalaratri_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/festivals/maha_saptami.webp',
    localImage: require('../../assets/images/kaalratri.jpg'),
    gradientColors: ['#37474F', '#546E7A', '#78909C'],
    significance: 'माँ का स्वरूप भले ही भयानक है, परंतु वह अपने भक्तों को सदा शुभ फल देती हैं, इसलिए इन्हें "शुभंकरी" भी कहा जाता है। ग्रह बाधाएं इनके नाम से दूर होती हैं।',
    chakraOrPlanet: 'सहस्रार चक्र (Crown Chakra) • स्वामी ग्रह: शनि (Saturn)',
    katha: 'रक्तबीज नामक दैत्य के रक्त की एक भी बूंद धरती पर गिरते ही लाखों नए दैत्य उत्पन्न हो जाते थे। देवताओं की प्रार्थना पर माँ दुर्गा ने अपने तेज से कालरात्रि को प्रकट किया। माँ कालरात्रि ने रक्तबीज का वध करते हुए उसके रक्त को धरती पर गिरने से पहले ही अपने खप्पर में पी लिया, जिससे सम्पूर्ण आसुरी सेना का समूल नाश हुआ।',
    ritualSteps: [
      { step: 1, title: 'निशा पूजा / रात्रि साधना', desc: 'सप्तमी की रात्रि में तेल का दीपक जलाकर माँ कालरात्रि का ध्यान किया जाता है।' },
      { step: 2, title: 'नीले पुष्प व लौंग अर्पण', desc: 'नीले पुष्प या लाल गुड़हल के साथ पूजा में कपूर और लौंग की आहुति दें।' },
      { step: 3, title: 'गुड़ का नैवेद्य', desc: 'माँ को शुद्ध गुड़ का भोग अर्पित करें और बाद में ब्राह्मण या गौमाता को खिलाएं।' },
      { step: 4, title: 'संकटमोचन कालरात्रि रक्षा कवच', desc: 'कालरात्रि कवच का पाठ कर समस्त बुरी नजर व भय से अपनी और परिजनों की रक्षा करें।' },
    ],
  },
  {
    day: 8,
    deviName: 'माँ महागौरी',
    deviNameEn: 'Maa Mahagauri',
    titleSubtitle: 'शंख-चन्द्र स्वरूपा (The Radiant & Pure Mother)',
    colorName: 'बैंगनी / जामुनी',
    colorNameEn: 'Purple',
    colorHex: '#8E24AA',
    colorMeaning: 'आध्यात्मिक शांति, गरिमा व ऐश्वर्य का प्रतीक (Spirituality & Grace)',
    bhog: 'नारियल (श्रीफल)',
    bhogEn: 'Coconut (Shreephal)',
    bhogSignificance: 'पूर्व जन्मों के पापों का क्षय, आर्थिक समृद्धि व सुख-शांति',
    flower: 'श्वेत चमेली व बेला के पुष्प',
    mantra: 'ॐ देवी महागौर्यै नमः॥',
    beejMantra: 'ॐ श्रीं क्लीं ह्रीं वरदायै नमः॥',
    dhyanShloka: 'श्वेते वृषेसमारूढा श्वेताम्बरधरा शुचिः। महागौरी शुभं दद्यान्महादेव प्रमोददा॥',
    audioTitle: 'माँ महागौरी महाआरती व स्तोत्र (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/mahagauri_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/festivals/durga_ashtami.webp',
    localImage: require('../../assets/images/mahagauri.jpg'),
    gradientColors: ['#4A148C', '#6A1B9A', '#7B1FA2'],
    significance: 'महाअष्टमी के पावन दिन माँ महागौरी की पूजा होती है। भगवान शिव की प्राप्ति के लिए कठोर तप के बाद गंगाजल से इनका शरीर विद्युत के समान गौर वर्ण हो गया था।',
    chakraOrPlanet: 'सोम चक्र (Soma Chakra) • स्वामी ग्रह: राहु (Rahu)',
    katha: 'भगवान शिव को पति रूप में पाने के लिए पार्वती जी ने हजारों वर्षों तक कठिन तपस्या की। धूप, वर्षा और धूल के कारण उनका शरीर अत्यंत कृष्ण (काला) पड़ गया था। जब भगवान शिव प्रसन्न हुए, तब उन्होंने गंगाजी के पावन जल से माँ के शरीर का अभिषेक किया। गंगाजल के स्पर्श से माँ का वर्ण विद्युत प्रभा के समान अत्यंत श्वेत और कांतिमय हो गया, जिससे वे "महागौरी" कहलाईं।',
    ritualSteps: [
      { step: 1, title: 'महाअष्टमी संधि पूजा', desc: 'अष्टमी और नवमी के मिलन काल में विशेष संधि पूजा संपन्न करें और दीप जलाएं।' },
      { step: 2, title: 'वस्त्र व श्रृंगार', desc: 'माँ को सुंदर चुनरी, चांदी की चूड़ियां और नारियल की माला अर्पित करें।' },
      { step: 3, title: 'कन्या पूजन (कंजक पूजन)', desc: '२ से १० वर्ष की कन्याओं के चरण धोएं, रोली-अक्षत लगाएं और हलवा-चना-पूरी खिलाकर दक्षिणा दें।' },
      { step: 4, title: 'महागौरी स्तोत्र व महाआरती', desc: 'माँ महागौरी स्तोत्र का पाठ कर समस्त भौतिक व आध्यात्मिक सिद्धियों की कामना करें।' },
    ],
  },
  {
    day: 9,
    deviName: 'माँ सिद्धिदात्री',
    deviNameEn: 'Maa Siddhidatri',
    titleSubtitle: 'सर्व सिद्धि प्रदायिनी (Bestower of All Siddhis)',
    colorName: 'मयूर हरा',
    colorNameEn: 'Peacock Green',
    colorHex: '#00897B',
    colorMeaning: 'समृद्धि, दिव्यता, अंतर्ज्ञान व असीम अनुग्रह का प्रतीक (Prosperity & Grace)',
    bhog: 'हलवा, काले चने व पूरी',
    bhogEn: 'Halwa, Poori & Black Chana',
    bhogSignificance: 'अष्ट सिद्धियों और नव निधियों की प्राप्ति, जीवन में पूर्णता',
    flower: 'कमल व सभी प्रकार के सुगंधित पुष्प',
    mantra: 'ॐ देवी सिद्धिदात्र्यै नमः॥',
    beejMantra: 'ॐ ह्रीं क्लीं ऐं सिद्धये नमः॥',
    dhyanShloka: 'सिद्ध गन्धर्व यक्षाद्यैरसुरैरमरैरपि। सेव्यमाना सदा भूयात् सिद्धिदा सिद्धिदायिनी॥',
    audioTitle: 'माँ सिद्धिदात्री सिद्धिदायिनी वंदना (2 min)',
    audioUrl: 'https://brahmandfeed23.b-cdn.net/assets/audio/siddhidatri_stuti.mp3',
    emblemUri: 'https://brahmandfeed23.b-cdn.net/festivals/maha_navami.webp',
    localImage: require('../../assets/images/sidharatri.jpg'),
    gradientColors: ['#004D40', '#00695C', '#00897B'],
    significance: 'महानवमी के दिन माँ सिद्धिदात्री सभी १८ सिद्धियों को देने वाली हैं। स्वयं भगवान शिव ने भी इनकी कृपा से ही अर्धनारीश्वर स्वरूप प्राप्त किया था।',
    chakraOrPlanet: 'निर्वाण चक्र (Nirvana Chakra) • स्वामी ग्रह: केतु (Ketu)',
    katha: 'मार्कण्डेय पुराण के अनुसार अणिमा, महिमा, गरिमा, लघिमा, प्राप्ति, प्राकाम्य, ईशित्व और वशित्व - ये आठ सिद्धियां माँ सिद्धिदात्री के आशीर्वाद से ही प्राप्त होती हैं। भगवान शिव ने समस्त सिद्धियां प्राप्त करने हेतु माँ सिद्धिदात्री की उपासना की थी। माँ की अनुकंपा से शिवजी का आधा शरीर देवी का हुआ और वे त्रिभुवन में "अर्धनारीश्वर" नाम से पूजित हुए।',
    ritualSteps: [
      { step: 1, title: 'महानवमी हवन (Havan)', desc: 'हवन कुंड में आम की समिधा, गाय का घी, गुग्गल और हवन सामग्री से माँ के बीज मंत्रों की आहुति दें।' },
      { step: 2, title: 'कन्या विदाई व आशीर्वाद', desc: 'कन्याओं को माँ का साक्षात रूप मानकर उनके चरण छूकर विदाई दें और सुख-समृद्धि का आशीर्वाद लें।' },
      { step: 3, title: 'हलवा-चना-पूरी महाभोग', desc: 'कढ़ाई में बना सूजी का हलवा, काले चने और तली पूरी का नैवेद्य अर्पित करें।' },
      { step: 4, title: 'पूर्णाहुति व व्रत पारण', desc: 'हवन की पूर्णाहुति के बाद आरती करें, कलश विसर्जन करें और पवित्र प्रसाद ग्रहण कर व्रत का पारण करें।' },
    ],
  },
];

/**
 * Calculates the current Navdurga active day (1 to 9).
 * If today falls within the 9-day window of the festival date, returns that specific day.
 * Otherwise defaults to Day 1 as active representation.
 */
export const getActiveNavdurgaDay = (festivalDateStr?: string): NavdurgaDayDetail => {
  if (!festivalDateStr) return NAVDURGA_9_DAYS[0];
  const festDate = new Date(festivalDateStr);
  if (isNaN(festDate.getTime())) return NAVDURGA_9_DAYS[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  festDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - festDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 9) {
    return NAVDURGA_9_DAYS[diffDays];
  }
  return NAVDURGA_9_DAYS[0];
};
