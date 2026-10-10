import {
  PDFDocument,
  rgb,
  degrees,
  pushGraphicsState,
  popGraphicsState,
  clip,
  endPath,
  appendBezierCurve,
  moveTo,
  closePath,
} from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share as RNShare, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { NavdurgaDayDetail } from '../data/navdurgaDaysData';
import {
  getFestivalTheme,
  loadPdfFonts,
  renderDynamicFestivalPage1,
  renderDynamicFestivalPage2,
  cleanTextForPdf,
  wrapText,
  decodeBase64ToUint8,
  getTrackedBrahmandUrl,
  addClickableLink,
  drawQrCodeMatrix,
} from './generateFestivalStoryPdf';

// Map of local image modules for all 9 Navdurga days
const NAVDURGA_LOCAL_IMAGES: Record<number, any> = {
  1: require('../../assets/images/shailputri.jpg'),
  2: require('../../assets/images/brahmacharini.webp'),
  3: require('../../assets/images/chandraghanta.jpg'),
  4: require('../../assets/images/kushmanda.jpg'),
  5: require('../../assets/images/skandmata.jpg'),
  6: require('../../assets/images/katayani.jpg'),
  7: require('../../assets/images/kaalratri.jpg'),
  8: require('../../assets/images/mahagauri.jpg'),
  9: require('../../assets/images/sidharatri.jpg'),
};

// Rich authentic 5-chapter sacred narratives for each of the 9 Navdurga days,
// matching the editorial depth and word-count of Ganesh Chaturthi master story PDF.
const NAVDURGA_SACRED_STORIES: Record<number, {
  subtitle: string;
  chapters: { id: number; title: string; icon: 'lotus' | 'diya' | 'star' | 'anjali' | 'flower'; content: string }[];
}> = {
  1: {
    subtitle: 'Himalaya Putri & Sati Punarjanma - Ashwin Shukla Pratipada',
    chapters: [
      {
        id: 1,
        title: 'Divya Utpatti',
        icon: 'lotus',
        content: 'Apne poorva janma mein Maa Shailputri Prajapati Daksha ki kripalu putri aur Bhagwan Shiva ki ardhangini Sati ke roop mein prakat hui thi. Jab Prajapati Daksha ne vishal yajna aayojit karke Mahadev ka niraadar kiya, tab apne pati ke sammaan ki raksha hetu Mata Sati ne usi yajna ki pavitra agni mein apna shareer aahut kar diya.',
      },
      {
        id: 2,
        title: 'Kathin Tapasya',
        icon: 'diya',
        content: 'Punarjanma mein unhone Parvatraj Himavat aur Maina Devi ke yahan Shailputri ke roop mein avatar liya. Barfile shikharon par unhone hazaron varshon tak anany bhakti ke saath kadi tapasya ki. Shubh shwet Nandi bail par viraajman hokar, daayein haath mein trishool aur baayein mein kamal dharan kar unhone pavitra tapasya purna ki.',
      },
      {
        id: 3,
        title: 'Shiva Milana',
        icon: 'star',
        content: 'Unki nishtha aur atoot tapasya dekhkar Bhagwan Shiva prasanna hue aur unhe punah apni ardh-shakti ke roop mein swikaar kiya. Muladhara chakra aur Chandrama grah ko niyantrit karne wali Maa Shailputri sabhi sadhakon ke jeevan mein aatmik sthirta, dharmi shanti aur mangal aashirwad sthaapit karti hain.',
      },
      {
        id: 4,
        title: 'Kripa Aur Pujan',
        icon: 'anjali',
        content: 'Pratipada ki pawan tithi par bhakt Kalash Sthapana karke Akhand Jyoti prajjwalit karte hain. Mata ko shuddh desi gay ka ghee, safed mishri-kheer aur safed chameli ke phool arpit karke bhakt mansik shanti, deerghaayu aur jeevan ke sabhi sankaton se mukti ka aashirwad paate hain.',
      },
      {
        id: 5,
        title: 'Pawan Parva',
        icon: 'flower',
        content: 'Shubh peele vastra dharan karke parivaar mandiron aur gharon mein Maa Shailputri Stuti ka paath karte hain. Garba aur Dandiya ki pawan dhunon ke saath Navratri ka aarambh hota hai, jahan sabhi bhakt Mata se nirbhayata, divya roshni aur samriddhi ki prarthana karte hain.',
      },
    ],
  },
  2: {
    subtitle: 'Gyan Swaroopa & Kathin Tapacharini - Ashwin Shukla Dwitiya',
    chapters: [
      {
        id: 1,
        title: 'Divya Sankalp',
        icon: 'lotus',
        content: 'Devrishi Narada ke margdarshan par Bhagwan Shiva ko pati roop mein paane ke liye Mata Parvati ne raj-paat tyag diya aur ghane Himalaya vanon mein pravesh kiya. Shwet vastra dharan karke, daayein haath mein Akshamala aur baayein mein Kamandalu lekar unhone apni kathor tapasya aarambh ki.',
      },
      {
        id: 2,
        title: 'Aparna Tapasya',
        icon: 'diya',
        content: 'Pehle ek hazaar varsh tak unhone kewal kande-mool aur fal khakar bitaaye, phir sau varshon tak shaak aur zameen par gire sookhe bel-patra khaye. Ant mein patte khana bhi chhod dene par devtaon ne unhe Aparna naam se sammanit kiya, unki sahan-shakti par poora brahmand aashcharyachakit reh gaya.',
      },
      {
        id: 3,
        title: 'Mahadev Kripa',
        icon: 'star',
        content: 'Aisi anokhi tapasya dekhkar Mahadev Chandra-mauli unke samaksh prakat hue aur unke manovanchhit sankalp ko purna kiya. Swadhishthana chakra ko jaagrit karne wali aur Mangal Dosh ko shaant karne wali Maa Brahmacharini bhakton ko aatm-shakti aur safalta pradaan karti hain.',
      },
      {
        id: 4,
        title: 'Bhog Aur Aashirwad',
        icon: 'anjali',
        content: 'Dwitiya tithi par bhakt Mata ko shuddh shakkar, mishri, panchamrit aur shwet kamal ke pushpa arpit karte hain. Vidhyarthi aur sadhak Mata se atoot dhairya, teekshna buddhi, vidya mein vijay aur aalasya se mukti paane ke liye prarthana karte hain.',
      },
      {
        id: 5,
        title: 'Pavitra Parampara',
        icon: 'flower',
        content: 'Shaant shwet aur sunahre rang ke vastra pahan kar bhakt "Tapashcharini Tvamhi Tapatraya Nivarinim" stotra ka jaap karte hain. Ghar-ghar mein katha aur aarti se tyag, sachhi sadhna aur dharmik aatm-sanyam ka sandesh goonj uthta hai.',
      },
    ],
  },
  3: {
    subtitle: 'Veer Swaroopa & Ghanta-Dharini Devi - Ashwin Shukla Tritiya',
    chapters: [
      {
        id: 1,
        title: 'Raudra Avatar',
        icon: 'lotus',
        content: 'Jab asura Mahishasura ne Indra ka swargasana chheen kar devtaon ko nishkasit kar diya, tab Tridev ke tej aur krodh se Maa Chandraghanta ka yoddha roop prakat hua. Unke mastak par ghante ke aakar ka adbhut ardhachandra shobhayaman tha, jo shatruon ke liye kaal tha.',
      },
      {
        id: 2,
        title: 'Yuddh Sankalp',
        icon: 'diya',
        content: 'Dahadte hue swarn-simha par sawaar hokar, das bhujaon mein trishool, khadga, gada, dhanush aur divya ghanta dharan kar Mata yuddh-bhoomi mein utareen. Bhakton ke liye unka chehra karuna aur mamta se paripoorn tha, par asuron ke liye unke netron mein vinashkaari agni dahak rahi thi.',
      },
      {
        id: 3,
        title: 'Asura Sanhar',
        icon: 'star',
        content: 'Maa ke divya ghante ki bhayanak dhwani teeno lokon mein goonj uthi, jisne asura senaon ko stambhit kar unki maaya ko nasht kar diya. Shiva ke trishool aur Vishnu ke chakra se unhone danavon ka ant kiya aur swarga ko punah dharmik shanti lauta di.',
      },
      {
        id: 4,
        title: 'Bhog Aur Phala',
        icon: 'anjali',
        content: 'Tritiya par bhakt Maa Chandraghanta ko kesar-yukt doodh, makhana kheer aur lal gende ke phool arpit karte hain. Manipura chakra aur Shukra grah ko shaant rakhne wali Mata saare bhay, anchahe darr aur chintaon ko har kar aatm-vishwas pradaan karti hain.',
      },
      {
        id: 5,
        title: 'Utsav Ullaas',
        icon: 'flower',
        content: 'Lal rang ke utsav vastra pehankar bhakt Mata ke kavach ka paath karte hain. Mandiron ke ghante shaam ki aarti ke saath goonjte hain, jo ye yaad dilate hain ki adharm chahe kitna bhi bada ho, sachche saahas ke aage hamesha parajit hota hai.',
      },
    ],
  },
  4: {
    subtitle: 'Brahmand Srijankari & Surya Mandala Devi - Ashwin Shukla Chaturthi',
    chapters: [
      {
        id: 1,
        title: 'Srishti Ka Aarambh',
        icon: 'lotus',
        content: 'Srishti ke nirman se pehle jab charo taraf ghanghor andhera aur shunya tha, koi grah ya nakshatra nahi the, tab aadi-shakti ne ek madhur aur madhumay muskaan bikheri. Unki usi divya mand muskaan se prakash ka maha-visphot hua aur pure brahmand ka janam hua.',
      },
      {
        id: 2,
        title: 'Surya Lok Niwasini',
        icon: 'diya',
        content: 'Maa Kushmanda Surya mandal ke bheetar nivas karti hain, jahan unke tej ko sehne ki shakti kisi anya devta mein nahi hai. Ashtabhuja roop mein chakra, gada, kamal aur ashta-siddhiyon ki mala dharan karke, simha par sawaar hokar wo samast loka ko urja aur jeevan deti hain.',
      },
      {
        id: 3,
        title: 'Anandmay Srishti',
        icon: 'star',
        content: 'Unka ye srishti nirman kisi parishram ka nahi, balki unki anant mamta aur param anand ka sehej pravah tha. Safed petha (kushmanda) ki bali aur bhog priya hone ke kaaran unhe Kushmanda kaha gaya. Wo hriday sthit Anahata chakra aur Surya dev ki adhishtatri devi hain.',
      },
      {
        id: 4,
        title: 'Bhog Aur Arogya',
        icon: 'anjali',
        content: 'Chaturthi ke din bhakt shuddh ghee ke bane malpua, safed petha aur narangi phoolon ki mala arpit karte hain. Unke pawan mantra ke jaap se asadhya rogon se mukti, tejasvi swasthya, yash aur aayu ki praapti hoti hai.',
      },
      {
        id: 5,
        title: 'Neel Varna Utsav',
        icon: 'flower',
        content: 'Aakash aur brahmand ki vishalta ka prateek royal blue (neela) rang pehankar bhakt katha aur kirtan mein leen hote hain. Parivaar prasad baant kar anand manate hain aur Mata se aashirwad maangte hain ki unke jeevan mein sada urja aur roshni bani rahe.',
      },
    ],
  },
  5: {
    subtitle: 'Skanda Mata & Padmasana Devi - Ashwin Shukla Panchami',
    chapters: [
      {
        id: 1,
        title: 'Skanda Ki Janani',
        icon: 'lotus',
        content: 'Jab atyachari asura Tarakasura ko ye vardaan mila ki kewal Shiva-putra hi uska vadh kar sakta hai, tab Mata Parvati ne divya senani Skanda (Kartikeya) ko janam diya. Is mamtamayi roop mein Mata chhah-mukh wale balak Skanda ko apni god mein pyaar se bithaaye hue hain.',
      },
      {
        id: 2,
        title: 'Dev-Sena Senani',
        icon: 'diya',
        content: 'Kamal ke aasan par viraajman aur shant simha par sawaar hokar Maa Skandamata ne apne putra ko dharmi sanskar aur yuddh-vidya di. Dev-sena ke adhyaksh bankar Kumar Kartikeya ne Tarakasura ka ant kiya aur devlok ko mukti dilayi.',
      },
      {
        id: 3,
        title: 'Do-Gun Phal',
        icon: 'star',
        content: 'God mein balak Skanda ke hone ke kaaran, Skandamata ki puja karne se bhakt ko Mata Durga ke saath Bhagwan Kartikeya ki bhi kripa mil jaati hai. Vishuddha kantha chakra aur Budh grah ko shubh karne wali Mata gyani vani aur moksha ka vardaan deti hain.',
      },
      {
        id: 4,
        title: 'Santana Sukh Bhog',
        icon: 'anjali',
        content: 'Panchami tithi par bhakt pake huye kele, kesar kheer aur safed kamal ke pushpa arpit karte hain. Santana sukh ki kamna karne wale dampati sachche man se aashirwad maangte hain, aur mata-pita apne bachhon ki suraksha aur unke ujjwal bhavishya ki prarthana karte hain.',
      },
      {
        id: 5,
        title: 'Bhagwi Utsav Shobha',
        icon: 'flower',
        content: 'Utsahi santri (bhagwa) rang dharan karke bhakt "Simhasanagata Nityam Padmashritakaradvaya" stotra ka paath karte hain. Aarti ki pawan dhunon ke saath Mata ki aisi mamta ka gunagaan hota hai jo har sankat mein dhaal ban kar khadi rehti hai.',
      },
    ],
  },
  6: {
    subtitle: 'Maharishi Katyayana Putri & Mahishasura Mardini - Ashwin Shukla Shashthi',
    chapters: [
      {
        id: 1,
        title: 'Katyayan Ashram Avatar',
        icon: 'lotus',
        content: 'Mahishasura ke atyacharon se mukti paane ke liye tapasvi Maharishi Katyayana ne kadi tapasya karke Mata ko apni putri ke roop mein paane ka var maanga. Tridev ke krodh-tej se jab divya devi prakat hui, toh unhone rishi ke aashram mein kripalu putri ban kar avataran liya.',
      },
      {
        id: 2,
        title: 'Gopiyon Ka Vrata',
        icon: 'diya',
        content: 'Chamakte hue Chandrahasa khadga, kamal aur abhay mudra ke saath swarn-aabha wali Mata simha par sawaar hui. Dwapara Yuga mein Vrindavan ki Gopiyon ne Yamuna tat par Shree Krishna ko pati roop mein paane ke liye Maa Katyayani ka hi pavitra vrata kiya tha.',
      },
      {
        id: 3,
        title: 'Mahishasura Vadh',
        icon: 'star',
        content: 'Shashthi ke din yuddh-kshetra mein utarkar Maa ne Mahishasura ki maha-sena ka ant kiya. Apni divya talwar se unhone bhainsa-roopi asura ka mastak dhar se alag kar diya, jiske baad sabhi devtaon ne unhe Mahishasuramardini keh kar naman kiya.',
      },
      {
        id: 4,
        title: 'Vivah Sukh Bhog',
        icon: 'anjali',
        content: 'Maa Katyayani ko chandi ki katori mein shuddh shehad, peela halwa aur lal gulab arpit kiye jaate hain. Ajna teesre-netra chakra aur Guru Brihaspati ko santulit karne wali Mata vivah mein aane wali sabhi badhaon ko door karke shreshtha jeevansathi ka vardaan deti hain.',
      },
      {
        id: 5,
        title: 'Harit Shringar Utsav',
        icon: 'flower',
        content: 'Vijay aur prakriti ke prateek hare rang ke vastra pehankar pujan kiya jaata hai. Dhunuchi naach aur shankh-dhwani ke saath Durga Puja ka Bodhan anushthan shuru hota hai, jo adharm par dharm ki shashwat jeet ka sandesh deta hai.',
      },
    ],
  },
  7: {
    subtitle: 'Kaal Ki Naashak & Shubhankari Devi - Ashwin Shukla Saptami',
    chapters: [
      {
        id: 1,
        title: 'Bhayanak Tej',
        icon: 'lotus',
        content: 'Jab asura Shumbha, Nishumbha aur rakt se hazaron daanav paida karne wale Raktabija ne hahakar machaya, tab Mata ne apne komal roop ko tyag kar teesre netra se krodh-agni prakat ki. Andhkaar ko bhedne wali, bijli jaise netron wali Maa Kalaratri ka roop samne aaya.',
      },
      {
        id: 2,
        title: 'Chamunda Yuddh',
        icon: 'diya',
        content: 'Khule kaale baal, teen dahakte netra aur bijli ki mala pehankar Mata gardabh (gadhe) par sawaar hokar ranbhoomi mein aayi. Haath mein lohe ka kataar aur vajra dharan karke unhone asura Chanda aur Munda ka sanhar kiya, jisse unka naam Chamunda pada.',
      },
      {
        id: 3,
        title: 'Raktabija Sanhar',
        icon: 'star',
        content: 'Jab Raktabija ke khoon ki boondon se naye asura janam lene lage, tab Maa Kalaratri ne apni vishal jeebh faila kar uska saara rakt dharti par girne se pehle hi pee liya. Asura ko jeevan-daan na milne par unhone uska poori tarah ant kar teeno lok bacha liye.',
      },
      {
        id: 4,
        title: 'Shubhankari Kripa',
        icon: 'anjali',
        content: 'Bahar se bhayanak dikhne par bhi Mata man se atyant dayalu aur Shubhankari hain, jo apne bhakton ko har darr se mukt rakhti hain. Gud ki mithai aur raat ki rani ke phool arpit karne par Shani dosh, bhoot-pret badha aur akaal mrityu ka bhay samapt hota hai.',
      },
      {
        id: 5,
        title: 'Dheerya Saptami',
        icon: 'flower',
        content: 'Gambhir slatey-grey (dhoosar) rang ke vastra pehankar bhakt aadhi raat ko Kalaratri Kavach ka paath karte hain. Bhakt vishwas rakhte hain ki andheri raat ke baad hi roshni ki nayi subah aati hai, aur Mata har burai se unki dhaal banti hain.',
      },
    ],
  },
  8: {
    subtitle: 'Shant Swaroopa & Pavitra Tapomayi - Ashwin Shukla Ashtami',
    chapters: [
      {
        id: 1,
        title: 'Ganga Snan Shuddhi',
        icon: 'lotus',
        content: 'Bhagwan Shiva ko paane ke liye hazaron saal dhoop, dhool aur barf mein tap karte-karte Mata Parvati ka sundar shareer shyam-varna aur dhool-dhoosarit ho gaya tha. Unki sachchi tapasya se pighal kar Mahadev prakat hue aur unhone Ganga ji ke pavitra jal se Mata ko snan karwaya.',
      },
      {
        id: 2,
        title: 'Gaur Varna Utpatti',
        icon: 'diya',
        content: 'Ganga ke divya jal ke sparsh se unka shyam shareer purnima ke chandrama aur safed chameli ke phool jaisa chamakne laga. Shwet vastra dharan karke, shubh safed bail par viraajman hokar wo Maa Mahagauri ke roop mein poore sansaar mein prasiddh hui.',
      },
      {
        id: 3,
        title: 'Anant Shanti Vardaan',
        icon: 'star',
        content: 'Trishool, Damaru aur abhay-varad mudra dharan karne wali Maa Mahagauri aatmik shuddhi aur shanti ka saakshaat prateek hain. Sahasrara chakra aur Rahu grah ko shant karne wali Mata purani karmic badhaon ko mita kar ghar-aangan mein shanti laati hain.',
      },
      {
        id: 4,
        title: 'Kanya Pujan Bhog',
        icon: 'anjali',
        content: 'Maha Ashtami par gharon mein Kanya Pujan kiya jaata hai, jahan nau kanyaon ko Navdurga ka roop maan kar unke charan dhoe jaate hain. Halwa, poori, kaale chane aur nariyal ka bhog lagakar parivaar sukh, samriddhi aur aarogya ka aashirwad paate hain.',
      },
      {
        id: 5,
        title: 'Sandhi Puja Aarti',
        icon: 'flower',
        content: 'Bhavya baingani (purple) rang ke vastra pehankar 108 deepakon ke saath Sandhi Puja ki aarti hoti hai. Mandiron mein "Mahagauri Shubham Dadyan Mahadev Pramodada" ke madhur jaap se sabhi ke jeevan mein prem aur pavitrata ka ujaala bhar jaata hai.',
      },
    ],
  },
  9: {
    subtitle: 'Ashta-Siddhi Daatri & Purna Kripamayi - Ashwin Shukla Navami',
    chapters: [
      {
        id: 1,
        title: 'Aadi Shakti Prakatya',
        icon: 'lotus',
        content: 'Srishti ke aarambh mein jab kuch nahi tha, tab Bhagwan Shiva ne srishti rachne ki shakti paane ke liye Aadi Parashakti ki aradhana ki. Tab Mata unke baayein bhag se Maa Siddhidatri ke roop mein prakat hui aur Mahadev ko saari divya shaktiyan pradaan keen.',
      },
      {
        id: 2,
        title: 'Ardhanarishwara Roop',
        icon: 'diya',
        content: 'Maa ki kripa se hi Bhagwan Shiva ko Ardhanarishwara roop mila, jahan purush tatva aur prakriti ka shashwat milan hua. Mata sabhi aath siddhiyon—Anima, Mahima, Garima, Laghima, Prapti, Prakamya, Ishitva aur Vashitva ki swami hain.',
      },
      {
        id: 3,
        title: 'Navadurga Purnata',
        icon: 'star',
        content: 'Lal kamal par viraajman hokar aur simha par sawaar hokar, charon haathon mein chakra, gada, shankh aur kamal dharan karke Maa ne nav-ratri ki pawan yatra ko purna kiya. Dev, Gandharva aur manushya sabhi unke charnon mein sar jhukate hain.',
      },
      {
        id: 4,
        title: 'Maha Navami Havan',
        icon: 'anjali',
        content: 'Maha Navami par bhakt til, kheer, halwa-poori aur kaale chano ke saath purna-aahuti havan karte hain. Sahasrara chakra aur Ketu grah ko shubh karne wali Mata har shubh karya mein asaan safalta aur aakhir mein moksha ka vardaan deti hain.',
      },
      {
        id: 5,
        title: 'Mayur Harit Parva',
        icon: 'flower',
        content: 'Samriddhi aur purnata ke prateek mor-pankhi (peacock green) vastra pehankar bhakt Kanya Bhoj aur prasad vitaran karte hain. Devotees Mata ka aabhar vyakt karte hain aur prarthana karte hain ki unka aashirwad saal bhar unke parivaar par bana rahe.',
      },
    ],
  },
};

// Romanized Vedic Mantras and Dhyan Shlokas for all 9 Navdurga Days
// (Ensures pristine ASCII rendering in PDF without Devanagari stripping or Ganesh fallbacks)
const NAVDURGA_ROMAN_MANTRAS: Record<number, {
  mantraHead: string;
  mantraText: string;
  shloka1: string;
  shloka2: string;
}> = {
  1: {
    mantraHead: '|| VEDIC MAA SHAILPUTRI SIDDHA MANTRA ||',
    mantraText: 'OM DEVI SHAILAPUTRYAI NAMAHA',
    shloka1: 'VANDE VANDHITA LABHAYA CHANDRARDHAKRITASHEKHARAM',
    shloka2: 'VRISHARUDHAM SHULADHARAM SHAILAPUTRIM YASHASVINIM',
  },
  2: {
    mantraHead: '|| VEDIC MAA BRAHMACHARINI SIDDHA MANTRA ||',
    mantraText: 'OM DEVI BRAHMACHARINYAI NAMAHA',
    shloka1: 'DADHANA KARA PADMAGHYAM AKSHAMALA KAMANDALU',
    shloka2: 'DEVI PRASIDATU MAYI BRAHMACHARINYANUTTAMA',
  },
  3: {
    mantraHead: '|| VEDIC MAA CHANDRAGHANTA SIDDHA MANTRA ||',
    mantraText: 'OM DEVI CHANDRAGHANTAYAI NAMAHA',
    shloka1: 'PINDAJA PRAVARARUDHA CHANDAKOPASTRUKAIRYUTA',
    shloka2: 'PRASADAM TANUTE MAHYAM CHANDRAGHANTETI VISHRUTA',
  },
  4: {
    mantraHead: '|| VEDIC MAA KUSHMANDA SIDDHA MANTRA ||',
    mantraText: 'OM DEVI KUSHMANDAYAI NAMAHA',
    shloka1: 'SURASAMPURNA KALASHAM RUDHIRAPLUTAMEVA CHA',
    shloka2: 'DADHANA HASTAPADMAGHYAM KUSHMANDA SHUBHADASTU ME',
  },
  5: {
    mantraHead: '|| VEDIC MAA SKANDAMATA SIDDHA MANTRA ||',
    mantraText: 'OM DEVI SKANDAMATAYAI NAMAHA',
    shloka1: 'SIMHASANAGATA NITYAM PADMASHRI TAKARADVAYA',
    shloka2: 'SHUBHADAATU SADA DEVI SKANDAMATA YASHASVINI',
  },
  6: {
    mantraHead: '|| VEDIC MAA KATYAYANI SIDDHA MANTRA ||',
    mantraText: 'OM DEVI KATYAYANYAI NAMAHA',
    shloka1: 'CHANDRAHASOJ JVALAKARA SHARDULA VARAVAHANA',
    shloka2: 'KATYAYANI SHUBHAM DADYAD DEVI DANAVA GHATINI',
  },
  7: {
    mantraHead: '|| VEDIC MAA KALARATRI SIDDHA MANTRA ||',
    mantraText: 'OM DEVI KALARATRYAI NAMAHA',
    shloka1: 'EKAVENI JAPAKARNA PURANAGNA KHARASTHITA',
    shloka2: 'LAMBOSHVI KARNIKAKARNI KAKURDIR DHAVANI SHUBHA',
  },
  8: {
    mantraHead: '|| VEDIC MAA MAHAGAURI SIDDHA MANTRA ||',
    mantraText: 'OM DEVI MAHAGAURYAI NAMAHA',
    shloka1: 'SHVETE VRISHE SAMARUDHA SHVETAMBARADHARA SHUCHIH',
    shloka2: 'MAHAGAURI SHUBHAM DADYAN MAHADEVA PRAMODADA',
  },
  9: {
    mantraHead: '|| VEDIC MAA SIDDHIDATRI SIDDHA MANTRA ||',
    mantraText: 'OM DEVI SIDDHIDATRYAI NAMAHA',
    shloka1: 'SIDDHA GANDHARVA YAKSHADYAIR ASURAIR AMARAIRAPI',
    shloka2: 'SEVYAMANA SADA BHUYAT SIDDHIDA SIDDHIDAYINI',
  },
};

/**
 * Builds the 5 authentic story chapters for any of the 9 Navdurga days,
 * matching the exact editorial depth, chapter structure, and word-count
 * of the master Ganesh Chaturthi PDF.
 */
function buildNavdurgaChapters(dayData: NavdurgaDayDetail) {
  const storyData = NAVDURGA_SACRED_STORIES[dayData.day];
  if (storyData && storyData.chapters?.length === 5) {
    return storyData.chapters.map((ch) => ({
      ...ch,
      content: cleanTextForPdf(ch.content),
    }));
  }

  // Fallback if day is somehow out of 1-9 bounds
  const kathaText = dayData.katha || '';
  const para1 = 'Tridev ke tej aur alaukik aashirwad se Maa Durga ka divya avatar hua, jinhone adharm ka naash kar dharmi shanti sthaapit ki.';
  const para2 = 'Kadi tapasya aur anany bhakti ke bal par Mata ne sabhi daanavon aur kashton ko parajit kar teeno lokon ko shanti pradaan ki.';
  const para3 = 'Maa ki pawan upasana se hriday ke saare darr, sankat aur chintayein nasht hoti hain, aur aatm-shakti ka sanchar hota hai.';
  const para4 = `Bhakt Mata ko pavitra ${dayData.bhogEn || 'shubh naivedya'} aur taaza phool arpit karke unka divya aashirwad prapt karte hain.`;
  const para5 = `Pavitra Navratri mein bhakt poori shradhha se stuti aur aarti gaate hain, aur Mata ka aashirwad ghar-ghar mein prajjwalit hota hai.`;

  return [
    { id: 1, title: 'Divya Utpatti', icon: 'lotus' as const, content: cleanTextForPdf(para1) },
    { id: 2, title: 'Kathin Tapasya', icon: 'diya' as const, content: cleanTextForPdf(para2) },
    { id: 3, title: 'Vijay Praapti', icon: 'star' as const, content: cleanTextForPdf(para3) },
    { id: 4, title: 'Bhog Aur Kripa', icon: 'anjali' as const, content: cleanTextForPdf(para4) },
    { id: 5, title: 'Pawan Parva', icon: 'flower' as const, content: cleanTextForPdf(para5) },
  ];
}

/**
 * Generates an authentic 2-Page Festival Story PDF using the exact same master design
 * as Ganesh Chaturthi (Mandala, Flanking Diyas, Two-tone Typography, Drop Caps, App Marketing Card with Scannable QR).
 */
export async function generateNavratriDayPdf(dayData: NavdurgaDayDetail): Promise<string> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Brahmand - Navratri Day ${dayData.day} ${cleanTextForPdf(dayData.deviNameEn)} Katha`);
  doc.setAuthor('Brahmand - Daily Sanatan Community');
  doc.setSubject(`Navratri Day ${dayData.day} Story and Blessings`);
  doc.setCreator('Brahmand Platform');

  const fonts = await loadPdfFonts(doc);

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const localImage = NAVDURGA_LOCAL_IMAGES[dayData.day] || dayData.localImage;
  const chapters = buildNavdurgaChapters(dayData);

  const storyData = NAVDURGA_SACRED_STORIES[dayData.day];
  const storySubtitle = storyData?.subtitle || cleanTextForPdf(dayData.titleSubtitle) || 'Cosmic Shakti & Goddess Durga Triumph';

  const romanMantraData = NAVDURGA_ROMAN_MANTRAS[dayData.day] || {
    mantraHead: `|| VEDIC MAA ${dayData.deviNameEn.toUpperCase()} SIDDHA MANTRA ||`,
    mantraText: 'OM DUM DURGAYEI NAMAHA',
    shloka1: 'SARVAMANGALA MANGALYE SHIVE SARVARTHA SADHIKE',
    shloka2: 'SHARANYE TRYAMBAKE GAURI NARAYANI NAMOSTUTE',
  };

  const festivalPayload = {
    name: `Navratri Day ${dayData.day}`,
    festival_name: `Navratri Day ${dayData.day}`,
    titleSubtitle: storySubtitle,
    subtitle: storySubtitle,
    deity: dayData.deviNameEn,
    dayData: {
      ...dayData,
      titleSubtitle: storySubtitle,
      chapters,
    },
    localImage,
    customHeroImage: localImage,
    mantraHead: romanMantraData.mantraHead,
    mantraText: romanMantraData.mantraText,
    shloka1: romanMantraData.shloka1,
    shloka2: romanMantraData.shloka2,
  };

  const theme = getFestivalTheme(festivalPayload);

  // Load the royal Navratri arch frame asset (matching reference image)
  let embeddedArchFrame: any = null;
  try {
    const archAsset = Asset.fromModule(require('../../assets/images/navratri_royal_arch_frame.jpg'));
    await archAsset.downloadAsync();
    const archUri = archAsset.localUri || archAsset.uri;
    if (archUri) {
      const archB64 = await FileSystem.readAsStringAsync(archUri, { encoding: FileSystem.EncodingType.Base64 });
      embeddedArchFrame = await doc.embedJpg(decodeBase64ToUint8(archB64));
    }
  } catch (archErr) {
    console.warn('[PDF] Could not embed royal arch frame asset:', archErr);
  }

  // ==========================================
  // PAGE 1: ROYAL NAVRATRI TEMPLE ARCH ARTWORK
  // ==========================================
  const page1 = doc.addPage([pageWidth, pageHeight]);
  await renderNavratriRoyalPage1(doc, page1, theme, fonts, festivalPayload, embeddedArchFrame);

  // ==========================================
  // PAGE 2: ILLUMINATED KATHA NARRATIVE CHAPTERS
  // ==========================================
  const page2 = doc.addPage([pageWidth, pageHeight]);
  await renderNavratriRoyalPage2(doc, page2, theme, fonts, festivalPayload, embeddedArchFrame);

  // Save 2-Page PDF
  const base64Pdf = await doc.saveAsBase64({ useObjectStreams: false });
  const sanitizedName = `navratri_day_${dayData.day}_${dayData.deviNameEn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  const filename = `${sanitizedName}_katha.pdf`;

  const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const rawUri = `${targetDir}${filename}`;
  const fileUri = rawUri.startsWith('file://') ? rawUri : `file://${rawUri}`;

  try {
    const existing = await FileSystem.getInfoAsync(fileUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (_cleanErr) {}

  await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

/**
 * Shares the Navratri Day PDF using the hardened native sharing pipeline.
 */
export async function shareNavratriDayPdf(
  dayData: NavdurgaDayDetail
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const fileUri = await generateNavratriDayPdf(dayData);
    const trackingShareUrl = getTrackedBrahmandUrl(`navratri_day_${dayData.day}`, 'whatsapp_share');

    const shareTitle = `शुभ नवरात्रि • दिवस ${dayData.day}: ${dayData.deviName} (${dayData.deviNameEn})`;
    const shareMessage =
      `🌸 *शुभ नवरात्रि • दिवस ${dayData.day}: ${dayData.deviName}* 🌸\n\n` +
      `🎨 आज का शुभ रंग: ${dayData.colorName}\n` +
      `🍯 पावन नैवेद्य (भोग): ${dayData.bhog}\n` +
      `🌺 प्रिय पुष्प: ${dayData.flower}\n` +
      `📿 सिद्ध मंत्र: ${dayData.mantra}\n\n` +
      `📖 माँ के स्वरूप दर्शन, संपूर्ण पावन कथा व आध्यात्मिक रहस्य हेतु संलग्न PDF देखें।\n\n` +
      `🛕 *Download Brahmand App* for 1,000+ Live Temple Darshans, Daily Vedic Panchang, and Jaap Counter:\n` +
      `👉 ${trackingShareUrl}`;

    const isUserCancellation = (err: any) => {
      const msg = String(err?.message || err || '').toLowerCase();
      return (
        msg.includes('cancel') ||
        msg.includes('dismiss') ||
        msg.includes('did not share') ||
        msg.includes('user cancelled')
      );
    };

    if (Platform.OS === 'android') {
      try {
        const RNShareModule = require('react-native-share');
        const shareApi = RNShareModule?.default || RNShareModule;
        if (shareApi && typeof shareApi.open === 'function') {
          await shareApi.open({
            title: shareTitle,
            subject: shareTitle,
            message: shareMessage,
            url: fileUri,
            type: 'application/pdf',
            filename: `Navratri_Day_${dayData.day}_${dayData.deviNameEn.replace(/[^a-zA-Z0-9]/g, '_')}_Katha`,
            failOnCancel: false,
          });
          return { success: true, uri: fileUri };
        }
      } catch (rnErr: any) {
        if (isUserCancellation(rnErr)) return { success: true, uri: fileUri };
      }

      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: shareTitle,
          });
          return { success: true, uri: fileUri };
        }
      } catch (exErr: any) {
        if (isUserCancellation(exErr)) return { success: true, uri: fileUri };
      }

      await RNShare.share({ title: shareTitle, message: shareMessage });
      return { success: true, uri: fileUri };
    }

    // iOS Pipeline
    try {
      const RNShareModule = require('react-native-share');
      const shareApi = RNShareModule?.default || RNShareModule;
      if (shareApi && typeof shareApi.open === 'function') {
        await shareApi.open({
          title: shareTitle,
          subject: shareTitle,
          message: shareMessage,
          url: fileUri,
          type: 'application/pdf',
          filename: `Navratri_Day_${dayData.day}_${dayData.deviNameEn.replace(/[^a-zA-Z0-9]/g, '_')}_Katha`,
          failOnCancel: false,
        });
        return { success: true, uri: fileUri };
      }
    } catch (shareErr: any) {
      if (isUserCancellation(shareErr)) return { success: true, uri: fileUri };
    }

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: shareTitle,
          UTI: 'com.adobe.pdf',
        });
        return { success: true, uri: fileUri };
      }
    } catch (expoErr: any) {
      if (isUserCancellation(expoErr)) return { success: true, uri: fileUri };
    }

    await RNShare.share({ title: shareTitle, message: shareMessage });
    return { success: true, uri: fileUri };
  } catch (err: any) {
    console.error('Error in shareNavratriDayPdf:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * PAGE 1: ROYAL NAVRATRI TEMPLE ARCH DESIGN
 * Renders the exact golden floral temple arch from the reference image,
 * with the sacred Devi form in the sanctum sanctorum, two-tone typography,
 * personalized blessing, and Vedic Navdurga Siddha Mantra.
 */
async function renderNavratriRoyalPage1(
  doc: PDFDocument,
  page1: any,
  theme: any,
  fonts: any,
  festival: any,
  embeddedArchFrame: any
): Promise<void> {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const cx = pageWidth / 2;

  const { fontCinzel, fontTimes, fontTimesItalic, fontHelveticaBold, displayFont, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;

  // Dynamic royal palette
  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08);
  const colTerracotta = theme.secondaryAccent || rgb(0.769, 0.388, 0.247);
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);
  const colPeachDeep = rgb(0.961, 0.710, 0.541);
  const colSage = rgb(0.541, 0.584, 0.451);
  const colSageDeep = rgb(0.20, 0.28, 0.15);
  const colAmber = theme.gold || rgb(0.878, 0.651, 0.298);
  const colInk = rgb(0.10, 0.07, 0.05);
  const colInkSoft = rgb(0.18, 0.13, 0.10);

  // 1. Warm Ivory Parchment Background Base (#FBF6EC)
  page1.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.984, 0.965, 0.925),
  });

  // 2. Draw Full-Bleed Royal Arch Frame (Marigold Garlands, Bells, Peacock Feathers & Kalash from Reference Image)
  if (embeddedArchFrame) {
    page1.drawImage(embeddedArchFrame, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  // 3. TOP BRAND HEADER: Prominent & Royal Header clearly below arch decor
  let curY = 672;
  const brandName = 'B R A H M A N D';
  const brandFontSize = 22.5; // Made noticeably bigger and bolder
  const bW = brandFont.widthOfTextAtSize(brandName, brandFontSize);
  const logoDim = 27; // Proportional prominent logo
  const logoGap = 10;
  const totalHeaderW = brahmandLogo ? (logoDim + logoGap + bW) : bW;
  const headerStartX = (pageWidth - totalHeaderW) / 2;

  if (brahmandLogo) {
    page1.drawImage(brahmandLogo, {
      x: headerStartX,
      y: curY - 4,
      width: logoDim,
      height: logoDim,
    });
  }

  page1.drawText(brandName, {
    x: brahmandLogo ? headerStartX + logoDim + logoGap : headerStartX,
    y: curY,
    size: brandFontSize,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 17;

  const tagText = "SHARAD   NAVRATRI   •   DIVYA   ARCHANA";
  const tagW = fontHelveticaBold.widthOfTextAtSize(tagText, 7.5);
  const tagX = (pageWidth - tagW) / 2;

  page1.drawLine({ start: { x: tagX - 32, y: curY + 2 }, end: { x: tagX - 10, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.7 });
  page1.drawText(tagText, {
    x: tagX,
    y: curY,
    size: 7.5,
    font: fontHelveticaBold,
    color: colSageDeep,
  });
  page1.drawLine({ start: { x: tagX + tagW + 10, y: curY + 2 }, end: { x: tagX + tagW + 32, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.7 });

  // 4. SANCTUM MEDALLION: High-definition Devi Image positioned in the central sanctum space
  const mCy = 512;
  const coreR = 106;

  let embeddedHero: any = null;
  const localImageMod = festival?.localImage || festival?.customHeroImage;
  if (localImageMod) {
    try {
      const modAsset = Asset.fromModule(localImageMod);
      await modAsset.downloadAsync();
      const uri = modAsset.localUri || modAsset.uri;
      if (uri) {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const bytes = decodeBase64ToUint8(b64);
        try {
          embeddedHero = await doc.embedJpg(bytes);
        } catch {
          embeddedHero = await doc.embedPng(bytes);
        }
      }
    } catch (err) {
      console.warn('[PDF] Error embedding hero image module:', err);
    }
  }

  if (embeddedHero) {
    // Elegant soft golden glow aura ring around image
    page1.drawCircle({
      x: cx,
      y: mCy,
      size: coreR + 5,
      borderColor: colAmber,
      borderWidth: 2,
      opacity: 0.85,
    });
    page1.drawCircle({
      x: cx,
      y: mCy,
      size: coreR + 9,
      borderColor: colCrimson,
      borderWidth: 0.8,
      opacity: 0.6,
    });

    const k = 0.5522847498 * coreR;
    page1.pushOperators(
      pushGraphicsState(),
      moveTo(cx + coreR, mCy),
      appendBezierCurve(cx + coreR, mCy + k, cx + k, mCy + coreR, cx, mCy + coreR),
      appendBezierCurve(cx - k, mCy + coreR, cx - coreR, mCy + k, cx - coreR, mCy),
      appendBezierCurve(cx - coreR, mCy - k, cx - k, mCy - coreR, cx, mCy - coreR),
      appendBezierCurve(cx + k, mCy - coreR, cx + coreR, mCy - k, cx + coreR, mCy),
      closePath(),
      clip(),
      endPath()
    );

    const imgDim = coreR * 2;
    page1.drawImage(embeddedHero, {
      x: cx - coreR,
      y: mCy - coreR,
      width: imgDim,
      height: imgDim,
    });

    page1.pushOperators(popGraphicsState());
  }

  // 5. FESTIVAL TITLE & LOCKUP (Positioned right below the sanctum)
  curY = 370;

  const rawTitle = cleanTextForPdf(theme.name).toUpperCase();
  const titleWords = rawTitle.split(/\s+/);
  let part1 = rawTitle;
  let part2 = '';
  if (titleWords.length > 1) {
    const half = Math.ceil(titleWords.length / 2);
    part1 = titleWords.slice(0, half).join(' ') + ' ';
    part2 = titleWords.slice(half).join(' ');
  }

  const titleFontSize = rawTitle.length > 22 ? 21 : 24;
  const p1W = brandFont.widthOfTextAtSize(part1, titleFontSize);
  const p2W = part2 ? brandFont.widthOfTextAtSize(part2, titleFontSize) : 0;
  const totalTW = p1W + p2W;
  const startTX = (pageWidth - totalTW) / 2;

  page1.drawText(part1, {
    x: startTX,
    y: curY,
    size: titleFontSize,
    font: brandFont,
    color: colInk,
  });
  if (part2) {
    page1.drawText(part2, {
      x: startTX + p1W,
      y: curY,
      size: titleFontSize,
      font: brandFont,
      color: colCrimson,
    });
  }

  curY -= 17;

  // Subtitle / Occasion
  const occSub = cleanTextForPdf(theme.subtitle || 'Shakti Upasana & Divine Triumph').toUpperCase();
  const occSize = occSub.length > 38 ? 8.6 : 9.5;
  const dSubW = fontTimesItalic.widthOfTextAtSize(occSub, occSize);
  page1.drawText(occSub, {
    x: (pageWidth - dSubW) / 2,
    y: curY,
    size: occSize,
    font: fontTimesItalic,
    color: colTerracottaDk,
  });

  curY -= 14;

  // 6. SYMMETRICAL GOLDEN JEWEL DIVIDER
  const jwWidth = 240;
  const jwX = (pageWidth - jwWidth) / 2;
  page1.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 22, y: curY }, thickness: 0.8, color: colAmber, opacity: 0.85 });
  page1.drawLine({ start: { x: cx + 22, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.8, color: colAmber, opacity: 0.85 });
  page1.drawRectangle({ x: cx - 3.5, y: curY - 3.5, width: 7, height: 7, color: colCrimson, rotate: degrees(45) });
  page1.drawCircle({ x: cx, y: curY, size: 2, color: colAmber });

  curY -= 12;

  // 7. BLESSING SECTION (Dedicated Maa Durga Blessing card with semi-translucent soft parchment)
  const deviClean = cleanTextForPdf(theme.deity);
  const festClean = cleanTextForPdf(theme.name);
  const greetClean = cleanTextForPdf(theme.greeting);
  const blessingParagraph =
    `Dear Devotee, may this sacred celebration of ${festClean} arrive at your home with divine radiance, fearlessness, and boundless auspiciousness. ${greetClean} May the divine grace of ${deviClean} dissolve all obstacles, ushering pure peace, health, spiritual strength, and timeless prosperity into your home - today, and always.`;

  const bCardW = 450;
  const blessLines = wrapText(blessingParagraph, fontTimes, 9.0, bCardW - 32);
  const bCardH = 15 + blessLines.length * 12.5 + 4;
  const bCardX = (pageWidth - bCardW) / 2;
  const bCardY = curY - bCardH;

  // Card with warm white glow
  page1.drawRectangle({
    x: bCardX,
    y: bCardY,
    width: bCardW,
    height: bCardH,
    color: rgb(0.995, 0.985, 0.965),
    borderColor: colAmber,
    borderWidth: 0.8,
    opacity: 0.95,
  });

  page1.drawLine({
    start: { x: cx - 34, y: bCardY + bCardH },
    end: { x: cx + 34, y: bCardY + bCardH },
    thickness: 1.2,
    color: colCrimson,
  });

  const blessEyebrow = 'A   BLESSING   FROM   THE   BRAHMAND   FAMILY';
  const bewW = brandFont.widthOfTextAtSize(blessEyebrow, 7.5);
  page1.drawText(blessEyebrow, {
    x: (pageWidth - bewW) / 2,
    y: bCardY + bCardH - 11.0,
    size: 7.5,
    font: brandFont,
    color: colCrimson,
  });

  let blY = bCardY + bCardH - 22.5;
  for (const bLine of blessLines) {
    const blW = fontTimes.widthOfTextAtSize(bLine, 9.0);
    page1.drawText(bLine, {
      x: (pageWidth - blW) / 2,
      y: blY,
      size: 9.0,
      font: fontTimes,
      color: colInk,
    });
    blY -= 12.5;
  }

  curY = bCardY - 14;

  // 8. VEDIC NAVDURGA SIDDHA MANTRA
  const mHead = cleanTextForPdf(festival?.mantraHead || '|| VEDIC MAA DURGA SIDDHA MANTRA ||').toUpperCase();
  const mText = cleanTextForPdf(festival?.mantraText || 'OM DUM DURGAYEI NAMAHA').toUpperCase();
  const shloka1 = cleanTextForPdf(festival?.shloka1 || 'SARVAMANGALA MANGALYE SHIVE SARVARTHA SADHIKE').toUpperCase();
  const shloka2 = cleanTextForPdf(festival?.shloka2 || 'SHARANYE TRYAMBAKE GAURI NARAYANI NAMOSTUTE').toUpperCase();

  const mHeadW = brandFont.widthOfTextAtSize(mHead, 7.5);
  page1.drawText(mHead, {
    x: (pageWidth - mHeadW) / 2,
    y: curY,
    size: 7.5,
    font: brandFont,
    color: colSageDeep,
  });

  curY -= 12;
  const mTextW = brandFont.widthOfTextAtSize(mText, 11.2);
  page1.drawText(mText, {
    x: (pageWidth - mTextW) / 2,
    y: curY,
    size: 11.2,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 11.5;
  const s1W = fontTimes.widthOfTextAtSize(shloka1, 7.6);
  page1.drawText(shloka1, {
    x: (pageWidth - s1W) / 2,
    y: curY,
    size: 7.6,
    font: fontTimes,
    color: colInk,
  });

  curY -= 10;
  const s2W = fontTimes.widthOfTextAtSize(shloka2, 7.6);
  page1.drawText(shloka2, {
    x: (pageWidth - s2W) / 2,
    y: curY,
    size: 7.6,
    font: fontTimes,
    color: colInk,
  });

  // 9. FOOTER
  const footY = 22;
  page1.drawLine({
    start: { x: 38, y: footY + 36 },
    end: { x: pageWidth - 38, y: footY + 36 },
    thickness: 0.8,
    color: colAmber,
    opacity: 0.85,
  });

  const fLogoDim = 16;
  if (brahmandLogo) {
    page1.drawImage(brahmandLogo, {
      x: 44,
      y: footY + 11,
      width: fLogoDim,
      height: fLogoDim,
    });
  }

  const fBrandX = brahmandLogo ? 44 + fLogoDim + 6 : 44;
  page1.drawText('BRAHMAND', {
    x: fBrandX,
    y: footY + 13,
    size: 10.5,
    font: brandFont,
    color: colCrimson,
  });

  page1.drawText('Discover more on Brahmand  *  https://brahmand.app', {
    x: 44,
    y: footY + 1,
    size: 7.5,
    font: fontTimesItalic,
    color: colInkSoft,
  });

  try {
    const footerTrackingUrl = getTrackedBrahmandUrl(theme.name, 'pdf_footer');
    const pfxW = fontTimesItalic.widthOfTextAtSize('Discover more on Brahmand  *  ', 7.5);
    const lnkW = fontTimesItalic.widthOfTextAtSize('https://brahmand.app', 7.5);
    addClickableLink(doc, page1, footerTrackingUrl, [
      44 + pfxW - 2,
      footY - 4,
      44 + pfxW + lnkW + 2,
      footY + 13,
    ]);
  } catch (_e) {}

  const pageText = 'PAGE 1 OF 2  *  DAILY SANATAN COMMUNITY';
  const ptW = fontHelveticaBold.widthOfTextAtSize(pageText, 7);
  page1.drawText(pageText, {
    x: pageWidth - 44 - ptW,
    y: footY + 8,
    size: 7,
    font: fontHelveticaBold,
    color: colCrimson,
  });
}

/**
 * PAGE 2: ROYAL ILLUMINATED KATHA NARRATIVE
 * Features the subtle arch watermark background with elegant drop caps,
 * Hinglish chapters, and the high-converting Brahmand app card.
 */
async function renderNavratriRoyalPage2(
  doc: PDFDocument,
  page2: any,
  theme: any,
  fonts: any,
  festival: any,
  embeddedArchFrame: any
): Promise<void> {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const cx = pageWidth / 2;

  const { fontCinzel, fontTimes, fontTimesItalic, fontHelvetica, fontHelveticaBold, fontPoppins, displayFont, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;

  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08);
  const colTerracotta = theme.secondaryAccent || rgb(0.769, 0.388, 0.247);
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);
  const colPeachDeep = rgb(0.961, 0.710, 0.541);
  const colSage = rgb(0.541, 0.584, 0.451);
  const colSageDeep = rgb(0.20, 0.28, 0.15);
  const colAmber = theme.gold || rgb(0.878, 0.651, 0.298);
  const colVintageGold = rgb(0.784, 0.663, 0.494);
  const colMaroonHead = rgb(0.290, 0.082, 0.098);
  const colFeatureText = rgb(0.200, 0.200, 0.200);
  const colInk = rgb(0.10, 0.07, 0.05);
  const colInkSoft = rgb(0.18, 0.13, 0.10);

  // 1. Warm Ivory Base Background
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.988, 0.970, 0.935),
  });

  // 2. Soft Background Arch Frame Watermark
  if (embeddedArchFrame) {
    page2.drawImage(embeddedArchFrame, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      opacity: 0.18,
    });
  }

  // Double sacred border matching temple aesthetics
  page2.drawRectangle({
    x: 12,
    y: 12,
    width: pageWidth - 24,
    height: pageHeight - 24,
    borderColor: colAmber,
    borderWidth: 1.0,
    opacity: 0.85,
  });
  page2.drawRectangle({
    x: 15,
    y: 15,
    width: pageWidth - 30,
    height: pageHeight - 30,
    borderColor: colCrimson,
    borderWidth: 0.5,
    opacity: 0.6,
  });

  // 3. TOP BRAND HEADER
  let curY = pageHeight - 38;
  const brandName = 'B R A H M A N D';
  const bW = brandFont.widthOfTextAtSize(brandName, 18);
  const logoDim = 24;
  const logoGap = 8;
  const totalHeaderW = brahmandLogo ? (logoDim + logoGap + bW) : bW;
  const headerStartX = (pageWidth - totalHeaderW) / 2;

  if (brahmandLogo) {
    page2.drawImage(brahmandLogo, {
      x: headerStartX,
      y: curY - 4,
      width: logoDim,
      height: logoDim,
    });
  }

  page2.drawText(brandName, {
    x: brahmandLogo ? headerStartX + logoDim + logoGap : headerStartX,
    y: curY,
    size: 18,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 17;

  const tagText = "DAILY   SANATAN   COMMUNITY";
  const tagW = fontHelveticaBold.widthOfTextAtSize(tagText, 7);
  const tagX = (pageWidth - tagW) / 2;

  page2.drawLine({ start: { x: tagX - 32, y: curY + 2 }, end: { x: tagX - 10, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.7 });
  page2.drawText(tagText, {
    x: tagX,
    y: curY,
    size: 7,
    font: fontHelveticaBold,
    color: colSageDeep,
  });
  page2.drawLine({ start: { x: tagX + tagW + 10, y: curY + 2 }, end: { x: tagX + tagW + 32, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.7 });

  curY -= 16;

  // 4. TITLE BLOCK: Two-tone Story Title
  const festClean = cleanTextForPdf(theme.name).toUpperCase();
  const t1 = `${festClean} `;
  const t2 = 'KATHA';
  const tSize = festClean.length > 18 ? 17 : 19.5;
  const t1W = brandFont.widthOfTextAtSize(t1, tSize);
  const t2W = brandFont.widthOfTextAtSize(t2, tSize);
  const totTW = t1W + t2W;
  const sTX = (pageWidth - totTW) / 2;

  page2.drawText(t1, {
    x: sTX,
    y: curY,
    size: tSize,
    font: brandFont,
    color: colInk,
  });
  page2.drawText(t2, {
    x: sTX + t1W,
    y: curY,
    size: tSize,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 16;

  const storySub = cleanTextForPdf(theme.subtitle || 'Sanatan Dharma Heritage');
  const ssW = fontTimesItalic.widthOfTextAtSize(storySub, 9.5);
  page2.drawText(storySub, {
    x: (pageWidth - ssW) / 2,
    y: curY,
    size: 9.5,
    font: fontTimesItalic,
    color: colTerracottaDk,
  });

  curY -= 14;

  // Symmetrical Jewel Divider
  const jwWidth = 240;
  const jwX = (pageWidth - jwWidth) / 2;
  page2.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 20, y: curY }, thickness: 0.8, color: colAmber, opacity: 0.85 });
  page2.drawLine({ start: { x: cx + 20, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.8, color: colAmber, opacity: 0.85 });
  page2.drawRectangle({ x: cx - 3.5, y: curY - 3.5, width: 7, height: 7, color: colCrimson, rotate: degrees(45) });

  curY -= 16;

  // 5. 5 CHAPTERS OF KATHA NARRATIVE (Spacious 14pt typography with open drop caps)
  const p2Margin = 38;
  const p2ContentWidth = pageWidth - p2Margin * 2;
  const bodyFontSize = 14;
  const bodyLineHeight = 17.2;

  const chaptersCount = Math.min(5, theme.chapters.length);
  for (let cIdx = 0; cIdx < chaptersCount; cIdx++) {
    const ch = theme.chapters[cIdx];
    const cleanContent = cleanTextForPdf(ch.content);
    const dropLetter = cleanContent.charAt(0) || 'T';
    const restOfText = cleanContent.slice(1);
    const dropCapSize = 29;
    const dropW = brandFont.widthOfTextAtSize(dropLetter, dropCapSize);

    page2.drawText(dropLetter, {
      x: p2Margin,
      y: curY - 11,
      size: dropCapSize,
      font: brandFont,
      color: colCrimson,
    });

    const dropIndent = dropW + 5;
    const firstLinesWidth = p2ContentWidth - dropIndent;

    const words = restOfText.split(/\s+/);
    let line1 = '';
    let line2 = '';
    let wordIdx = 0;

    while (wordIdx < words.length) {
      const test = line1 ? `${line1} ${words[wordIdx]}` : words[wordIdx];
      if (fontTimes.widthOfTextAtSize(test, bodyFontSize) <= firstLinesWidth) {
        line1 = test;
        wordIdx++;
      } else {
        break;
      }
    }

    while (wordIdx < words.length) {
      const test = line2 ? `${line2} ${words[wordIdx]}` : words[wordIdx];
      if (fontTimes.widthOfTextAtSize(test, bodyFontSize) <= firstLinesWidth) {
        line2 = test;
        wordIdx++;
      } else {
        break;
      }
    }

    const remainingWords = words.slice(wordIdx).join(' ');
    const remainingLines = remainingWords ? wrapText(remainingWords, fontTimes, bodyFontSize, p2ContentWidth) : [];

    let lineY = curY;
    if (line1) {
      page2.drawText(line1, {
        x: p2Margin + dropIndent,
        y: lineY,
        size: bodyFontSize,
        font: fontTimes,
        color: colInk,
      });
      lineY -= bodyLineHeight;
    }
    if (line2) {
      page2.drawText(line2, {
        x: p2Margin + dropIndent,
        y: lineY,
        size: bodyFontSize,
        font: fontTimes,
        color: colInk,
      });
      lineY -= bodyLineHeight;
    }

    for (const remLine of remainingLines) {
      page2.drawText(remLine, {
        x: p2Margin,
        y: lineY,
        size: bodyFontSize,
        font: fontTimes,
        color: colInk,
      });
      lineY -= bodyLineHeight;
    }

    curY = lineY - 14;
  }

  // 6. MARKETING / BRAHMAND APP SECTION (100% Center-Aligned Stack)
  curY -= 14;

  // Symmetrical subtle top divider
  const topSepW = 280;
  const topSepX = (pageWidth - topSepW) / 2;
  page2.drawLine({
    start: { x: topSepX, y: curY },
    end: { x: cx - 20, y: curY },
    thickness: 0.7,
    color: colAmber,
    opacity: 0.85,
  });
  page2.drawRectangle({
    x: cx - 3,
    y: curY - 3,
    width: 6,
    height: 6,
    color: colCrimson,
    rotate: degrees(45),
  });
  page2.drawLine({
    start: { x: cx + 20, y: curY },
    end: { x: topSepX + topSepW, y: curY },
    thickness: 0.7,
    color: colAmber,
    opacity: 0.85,
  });

  curY -= 13;

  // 6a. Centered Header & Subheadline
  const eyebrowText = 'BRAHMAND';
  const ebW = brandFont.widthOfTextAtSize(eyebrowText, 10);
  const bannerHeadline = '•   Carry Sacred Shakti & Blessings Daily   •';
  const bhFont = fontPoppins || fontHelveticaBold;
  const bhSize = 8.5;
  const bhW = bhFont.widthOfTextAtSize(bannerHeadline, bhSize);

  const headTotalW = ebW + 8 + bhW;
  const headStartX = (pageWidth - headTotalW) / 2;

  page2.drawText(eyebrowText, {
    x: headStartX,
    y: curY,
    size: 10,
    font: brandFont,
    color: colCrimson,
  });
  page2.drawText(bannerHeadline, {
    x: headStartX + ebW + 8,
    y: curY,
    size: bhSize,
    font: bhFont,
    color: colMaroonHead,
  });

  curY -= 14;

  // 6b. Centered Feature Bullets
  const featureBullets = [
    {
      title: 'Free Kundli: ',
      desc: 'Instant Vedic Janam Kundli, Dosha analysis & daily predictions at zero cost.',
    },
    {
      title: 'Sanatan SOS: ',
      desc: 'Real-time emergency assistance and local community support when you need it most.',
    },
    {
      title: 'Vedic Services: ',
      desc: 'Connect with verified Services, and participate in community seva.',
    },
  ];

  const textFont = fontPoppins || fontHelvetica;
  const titleFont = fontPoppins || fontHelveticaBold;
  const bulletMaxW = pageWidth - p2Margin * 2 - 20;

  for (const b of featureBullets) {
    const fullLineText = `${b.title}${b.desc}`;
    const wrappedLines = wrapText(fullLineText, textFont, 8.2, bulletMaxW);

    for (let lIdx = 0; lIdx < wrappedLines.length; lIdx++) {
      const lineStr = wrappedLines[lIdx];
      const lineW = textFont.widthOfTextAtSize(lineStr, 8.2);
      const lineX = (pageWidth - lineW) / 2;

      if (lIdx === 0) {
        // Draw small gold/crimson diamond at the left of the centered first line
        page2.drawRectangle({
          x: lineX - 9,
          y: curY + 2,
          width: 4,
          height: 4,
          color: colCrimson,
          rotate: degrees(45),
        });
      }

      page2.drawText(lineStr, {
        x: lineX,
        y: curY,
        size: 8.2,
        font: lIdx === 0 ? titleFont : textFont,
        color: lIdx === 0 ? colMaroonHead : colFeatureText,
      });

      curY -= 11.5;
    }
    curY -= 2;
  }

  curY -= 4;

  // 6c. Centered Store Row Label
  const storeLabel = 'AVAILABLE ON GOOGLE PLAY & APP STORE';
  const slW = fontHelveticaBold.widthOfTextAtSize(storeLabel, 8.0);
  page2.drawText(storeLabel, {
    x: (pageWidth - slW) / 2,
    y: curY,
    size: 8.0,
    font: fontHelveticaBold,
    color: colSageDeep,
  });

  curY -= 18;

  // 6d. Centered, Prominently Sized Store Badges (Scale increased from 0.40 to 0.55)
  const storeRowY = curY;
  const playPaths = [
    { p: 'M 3.25 2.14 C 2.87 2.53 2.65 3.14 2.65 3.94 L 2.65 20.06 C 2.65 20.86 2.87 21.47 3.25 21.86 L 3.32 21.93 L 12.44 12.81 L 12.44 12.38 L 12.44 12.38 L 3.32 3.26 Z', c: rgb(0.25, 0.63, 0.96) },
    { p: 'M 15.48 15.85 L 12.44 12.81 L 12.44 12.38 L 15.48 9.34 L 15.56 9.38 L 19.16 11.43 C 20.19 12.01 20.19 12.97 19.16 13.55 L 15.56 15.60 Z', c: rgb(1.0, 0.79, 0.0) },
    { p: 'M 15.56 15.60 L 12.44 12.48 L 3.25 21.86 C 3.59 22.22 4.15 22.27 4.80 21.90 L 15.56 15.60', c: rgb(0.92, 0.26, 0.21) },
    { p: 'M 15.56 9.38 L 4.80 3.28 C 4.15 2.91 3.59 2.96 3.25 3.32 L 12.44 12.51 Z', c: rgb(0.18, 0.73, 0.42) },
  ];
  const playScale = 0.55; // Increased image size
  const playIconW = 24 * playScale;
  const playTextSize = 10;
  const playTextW = fontHelveticaBold.widthOfTextAtSize('Google Play', playTextSize);
  const playTotalW = playIconW + 7 + playTextW;

  const appleScale = 0.55; // Increased image size
  const appleIconW = 24 * appleScale;
  const appleTextSize = 10;
  const appleTextW = fontHelveticaBold.widthOfTextAtSize('App Store', appleTextSize);
  const appleTotalW = appleIconW + 7 + appleTextW;

  const storeGap = 36;
  const combinedStoresW = playTotalW + storeGap + appleTotalW;
  const playStartX = (pageWidth - combinedStoresW) / 2;
  const appleStartX = playStartX + playTotalW + storeGap;

  // Draw Google Play
  for (const seg of playPaths) {
    page2.drawSvgPath(seg.p, { x: playStartX, y: storeRowY + 9, scale: playScale, color: seg.c });
  }
  page2.drawText('Google Play', {
    x: playStartX + playIconW + 7,
    y: storeRowY,
    size: playTextSize,
    font: fontHelveticaBold,
    color: colInk,
  });

  // Draw App Store
  const applePath =
    'M 18.71 19.5 C 17.88 20.74 17.00 21.93 15.66 21.97 C 14.32 22.01 13.88 21.20 12.37 21.20 C 10.84 21.20 10.37 21.93 9.09 21.97 C 7.79 22.01 6.80 20.69 5.96 19.47 C 4.25 17.00 2.94 12.48 4.70 9.42 C 5.57 7.91 7.13 6.95 8.82 6.93 C 10.10 6.91 11.31 7.79 12.10 7.79 C 12.87 7.79 14.33 6.72 15.89 6.89 C 16.55 6.92 18.39 7.15 19.56 8.87 C 19.46 8.93 17.37 10.15 17.39 12.63 C 17.42 15.60 20.00 16.59 20.03 16.60 C 20.00 16.70 19.61 18.06 18.71 19.5 Z M 14.97 4.57 C 15.65 3.75 16.11 2.61 15.98 1.46 C 14.99 1.50 13.79 2.12 13.08 2.95 C 12.45 3.68 11.90 4.85 12.05 5.97 C 13.16 6.06 14.29 5.39 14.97 4.57 Z';
  page2.drawSvgPath(applePath, { x: appleStartX, y: storeRowY + 9, scale: appleScale, color: colInk });
  page2.drawText('App Store', {
    x: appleStartX + appleIconW + 7,
    y: storeRowY,
    size: appleTextSize,
    font: fontHelveticaBold,
    color: colInk,
  });

  // Interactive Store Links
  const playStoreUri = 'https://play.google.com/store/apps/details?id=com.brahmand.app';
  addClickableLink(doc, page2, playStoreUri, [
    playStartX - 6,
    storeRowY - 8,
    playStartX + playTotalW + 6,
    storeRowY + 24,
  ]);

  const appStoreUri = 'https://apps.apple.com/in/app/brahmand-app/id6765467224';
  addClickableLink(doc, page2, appStoreUri, [
    appleStartX - 6,
    storeRowY - 8,
    appleStartX + appleTotalW + 6,
    storeRowY + 24,
  ]);

  // 6e. Centered QR Code Shifted Right Below Store Icons
  curY = storeRowY - 20;

  const qrSize = 74;
  const qrBoxX = (pageWidth - qrSize) / 2;
  const qrBoxY = curY - qrSize;
  const quietZone = 5;

  page2.drawRectangle({
    x: qrBoxX - quietZone,
    y: qrBoxY - quietZone,
    width: qrSize + quietZone * 2,
    height: qrSize + quietZone * 2,
    color: rgb(1, 1, 1),
    borderColor: colVintageGold,
    borderWidth: 0.8,
  });

  const referralQrUrl = getTrackedBrahmandUrl(theme.name, 'pdf_qr_scan');
  drawQrCodeMatrix(
    page2,
    referralQrUrl,
    qrBoxX,
    qrBoxY,
    qrSize,
    rgb(0.04, 0.04, 0.04),
    rgb(1, 1, 1),
    brahmandLogo
  );

  // Centered Caption below QR
  const qrCaption = 'Scan to Join Free';
  const capW = brandFont.widthOfTextAtSize(qrCaption, 8.0);
  page2.drawText(qrCaption, {
    x: (pageWidth - capW) / 2,
    y: qrBoxY - 13,
    size: 8.0,
    font: brandFont,
    color: colMaroonHead,
  });

  addClickableLink(doc, page2, referralQrUrl, [
    qrBoxX - quietZone,
    qrBoxY - quietZone - 15,
    qrBoxX + qrSize + quietZone,
    qrBoxY + qrSize + quietZone,
  ]);

  // 7. FOOTER
  const footY = 22;
  page2.drawLine({
    start: { x: 38, y: footY + 36 },
    end: { x: pageWidth - 38, y: footY + 36 },
    thickness: 0.8,
    color: colAmber,
    opacity: 0.85,
  });

  const fLogoDim = 16;
  if (brahmandLogo) {
    page2.drawImage(brahmandLogo, {
      x: 44,
      y: footY + 11,
      width: fLogoDim,
      height: fLogoDim,
    });
  }

  const fBrandX = brahmandLogo ? 44 + fLogoDim + 6 : 44;
  page2.drawText('BRAHMAND', {
    x: fBrandX,
    y: footY + 13,
    size: 10.5,
    font: brandFont,
    color: colCrimson,
  });

  page2.drawText('Discover more on Brahmand  *  https://brahmand.app', {
    x: 44,
    y: footY + 1,
    size: 7.5,
    font: fontTimesItalic,
    color: colInkSoft,
  });

  const pageText = 'PAGE 2 OF 2  *  DAILY SANATAN COMMUNITY';
  const ptW = fontHelveticaBold.widthOfTextAtSize(pageText, 7);
  page2.drawText(pageText, {
    x: pageWidth - 44 - ptW,
    y: footY + 8,
    size: 7,
    font: fontHelveticaBold,
    color: colCrimson,
  });
}
