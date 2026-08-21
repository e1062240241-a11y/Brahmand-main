import { ImageSourcePropType } from 'react-native';

const CDN_TEMPLE_BASE = 'https://brahmandfeed23.b-cdn.net/temples';
const tImg = (filename: string): ImageSourcePropType => ({ uri: `${CDN_TEMPLE_BASE}/${encodeURIComponent(filename)}` });

const TEMPLE_IMAGES: Record<string, ImageSourcePropType> = {
  // Jyotirlingas
  'jyotirling-somnath-temple-gujarat': tImg('SomnathTemple.webp'),
  'jyotirling-kedarnath-temple-uttarakhand': tImg('KedarnathTemple.webp'),
  'jyotirling-mahakaleshwar-temple-ujjain': tImg('MahakalTemple.webp'),
  'jyotirling-kashi-vishwanath-temple-varanasi': tImg('Kashi_Vishwanath.webp'),
  'jyotirling-bhimashankar-temple-maharashtra': tImg('Mamleshwar.webp'),
  'jyotirling-ramanathaswamy-temple-rameswaram': tImg('Ramanathaswamy-temple.webp'),
  'jyotirling-grishneshwar-temple-maharashtra': tImg('Grishneshwar.webp'),
  'jyotirling-grishneshwar-temple-ellora': tImg('Grishneshwar.webp'),
  'jyotirling-omkareshwar-temple-madhya-pradesh': tImg('Okareshwar.webp'),
  'jyotirling-trimbakeshwar-temple-maharashtra': tImg('TrimbakehwarTemple.webp'),
  'jyotirling-trimbakeshwar-temple-nashik': tImg('TrimbakehwarTemple.webp'),
  'jyotirling-nageshwar-temple-gujarat': tImg('Nageshwar.webp'),
  'jyotirling-nageshwar-temple-dwarka': tImg('Nageshwar.webp'),
  'jyotirling-mallikarjuna-temple-andhra-pradesh': tImg('Mallikarjuna.webp'),
  'jyotirling-mallikarjuna-temple-srisailam': tImg('Mallikarjuna.webp'),
  'jyotirling-baidyanath-temple-jharkhand': tImg('Baidyanath.webp'),
  'jyotirling-baidyanath-temple-deoghar': tImg('Baidyanath.webp'),
  
  // Sacred / Others & Char Dham
  'other-tirupati-balaji-temple-andhra-pradesh': tImg('Tirumala_090615.webp'),
  'other-vaishno-devi-temple-jammu-kashmir': tImg('VaishnoDeviTemple.webp'),
  'other-siddhivinayak-temple-mumbai': tImg('Siddhivinayak.webp'),
  'other-shree-siddhivinayak-temple': tImg('Siddhivinayak.webp'),
  'other-shirdi-sai-baba-temple-maharashtra': tImg('Sai_Baba.webp'),
  'other-jagannath-temple-puri': tImg('Jaganath.webp'),
  'chardham-jagannath-temple-puri': tImg('Jaganath.webp'),
  'chardham-badrinath-temple-uttarakhand': tImg('badrinath.webp'),
  'chardham-gangotri-temple-uttarakhand': tImg('gangotri.webp'),
  'chardham-yamunotri-temple-uttarakhand': tImg('yamunotritemple.webp'),
  'chardham-dwarkadhish-temple-dwarka': tImg('dwarakadhish.webp'),
  'other-golden-temple-amritsar': tImg('GoldenTemple.webp'),
  'other-meenakshi-temple-madurai': tImg('MeenakshiTemple.webp'),
  'other-iskcon-temple-bangalore-karnataka': tImg('ISKCON_Bangalore.webp'),
  'other-iskcon-bangalore-aarti': tImg('ISKCON_Bangalore.webp'),
  'other-iskcon-mira-road-thane': tImg('ISKCON_Mira_Road.webp'),
  'other-iskcon-temple-mumbai': tImg('ISKCON_Juhu.webp'),
  'other-iskcon-juhu': tImg('ISKCON_Juhu.webp'),
  'other-iskcon-temple-mumbai-juhu': tImg('ISKCON_Juhu.webp'),
  'other-mahalaxmi-temple': tImg('mahalaxmi.webp'),
  'other-shri-dwarkadhish-temple-dwarka': tImg('dwarakadhish.webp'),

  // Shakti Peethas (from assets/images/shaktipeeth)
  'shaktipeeth-kamakhya-temple-guwahati': tImg('kamakhya.webp'),
  'shakti-kamakhya-temple-assam': tImg('kamakhya.webp'),
  'shaktipeeth-kalighat-kali-temple-kolkata': tImg('kalighat.webp'),
  'shakti-kalighat-temple-kolkata': tImg('kalighat.webp'),
  'shaktipeeth-tarapith-temple-birbhum': tImg('tarapith.webp'),
  'shakti-tarapith-temple-bengal': tImg('tarapith.webp'),
  'shaktipeeth-ambaji-temple-gujarat': tImg('ambaji.webp'),
  'shakti-ambaji-temple-gujarat': tImg('ambaji.webp'),
  'shaktipeeth-vaishno-devi-temple-jammu-kashmir': tImg('vaishnodevi.webp'),
  'shaktipeeth-jwala-ji-temple-kangra': tImg('jwala.webp'),
  'shaktipeeth-chinnamasta-temple-rajarappa': tImg('chinnamasta.webp'),
  'shaktipeeth-mahalaxmi-temple-kolhapur': tImg('mahalaxmi.webp'),
  'shaktipeeth-chamundeshwari-temple-mysore': tImg('chamundeshwari.webp'),
  'shakti-chamundeshwari-temple-mysore': tImg('chamundeshwari.webp'),
  'shaktipeeth-vindhyavasini-temple-vindhyachal': tImg('vindhyavasini.webp'),
  'shaktipeeth-kamakhya-kanya-kumari-temple': tImg('kanyakumari.webp'),
  'shaktipeeth-sharda-peeth-kashmir': tImg('sharadapeeth.webp'),
  'shaktipeeth-hinglaj-devi-rajasthan': tImg('hinglajmata.webp'),
  'shaktipeeth-tripora-sundari-temple-tripura': tImg('tripurasundari.webp'),
  'shaktipeeth-attahas-temple-birbhum': tImg('Attahas-Shaktipeeth.webp'),
  'shaktipeeth-bakreshwar-temple-birbhum': tImg('Bakreswar.webp'),
  'shaktipeeth-nalateswari-temple-nalhati': tImg('nalateswari.webp'),
  'shaktipeeth-jogadya-temple-burdwan': tImg('jogadya.webp'),
  'shaktipeeth-kankalitala-temple-bolpur': tImg('kankalitala.webp'),
  'shaktipeeth-bhavani-mandir-tuljapur': tImg('tuljabhavani.webp'),
  'shaktipeeth-renuka-devi-temple-mahur': tImg('renukadevi.webp'),
  'shaktipeeth-saptashrungi-temple-nashik': tImg('saptashrungi.webp'),
  'shaktipeeth-danteshwari-temple-dantewada': tImg('danteshwari.webp'),
  'shaktipeeth-chamunda-devi-temple-kangra': tImg('Chamundatemple.webp'),
  'shaktipeeth-naina-devi-temple-bilaspur': tImg('Nainadevi.webp'),
  'shaktipeeth-brareshwari-devi-temple-kangra': tImg('brajeshwari.webp'),
  'shaktipeeth-chintpurni-devi-temple-una': tImg('chintpurni.webp'),
  'shaktipeeth-alopi-devi-temple-prayagraj': tImg('alopi-devi-mandir.webp'),
  'shaktipeeth-devi-patan-temple-balrampur': tImg('devipatan.webp'),
  'shaktipeeth-harsiddhi-mata-temple-ujjain': tImg('harsiddhi.webp'),
  'shaktipeeth-sharada-devi-temple-maihar': tImg('maihardevi.webp'),
  'shaktipeeth-biraja-temple-jajpur': tImg('biraja.webp'),
  'shaktipeeth-tara-tarini-temple-ganjam': tImg('taratarini.webp'),

  // Healing Temples (from assets/images/healingtemple)
  'healing-ramanasramam-tiruvannamalai': tImg('SriRamana.webp'),
  'healing-dhyanalinga-isha-coimbatore': tImg('dhyanalinga.webp'),
  'healing-virupaksha-temple-hampi': tImg('virupaksha.webp'),
  'healing-anandamayi-ma-ashram-haridwar': tImg('AnandamayiAshram.webp'),
  'hanuman-mehendipur-balaji-temple-dausa': tImg('Mehandipurbalaji.webp'),
  'healing-parmarth-niketan-rishikesh': tImg('ParmarthNiketan.webp'),
  'healing-sri-aurobindo-ashram-puducherry': tImg('SriAurobindo.webp'),
  'sacred-belur-math-ramakrishna-mission': tImg('BelurMath.webp'),
  'healing-sarnath-buddhist-monastery': tImg('sarnathvaranasi.webp'),
  'healing-sarnath-dhamek-stupa-monastery': tImg('sarnathvaranasi.webp'),
  'healing-sarnath-dhamek-stupa': tImg('sarnathvaranasi.webp'),
  'sarnath-dhamek-stupa-monastery': tImg('sarnathvaranasi.webp'),
  'sarnath-dhamek-stupa': tImg('sarnathvaranasi.webp'),
  'sacred-mahabodhi-temple-bodh-gaya': tImg('mahabodhi.webp'),
  'devi-kollur-mookambika-temple': tImg('kollurmookambika.webp'),
  'devi-chottanikara-temple-kochi': tImg('Chottanikkara.webp'),
  'sacred-vaitheeswaran-koil-mayiladuthurai': tImg('Vaitheeswaran.webp'),
  'healing-parli-vaijnath-temple': tImg('parliVajinath.webp'),
  'healing-dhanvantari-temple-kerala': tImg('SriDhanvantari.webp'),
  'sacred-suchindram-thanumalayan-temple': tImg('SuchindramThanumalay.webp'),
  'healing-ghati-subramanya-temple': tImg('GhatiSubramanyaTemple.webp'),
  'panchbhoota-srikalahasteeswara-temple-srikalahasti': tImg('Srikalahasteeswara.webp'),
  'sacred-kukke-subramanya-temple': tImg('KukkeSubramanya.webp'),
  'healing-mangaladevi-temple-mangalore': tImg('Mangaladevi.webp'),

  // Sacred Places & Shrines (from assets/images/sacred)
  'sacred-assi-ghat': tImg('Assi_Ghat.webp'),
  'sacred-bhalka-tirth-shrine': tImg('BhalkaTirthShrine.webp'),
  'sacred-bhartrihari-caves': tImg('Bhartrihari.webp'),
  'sacred-daulatabad-fort': tImg('Daulatabad.webp'),
  'sacred-ellora-kailasa-temple': tImg('ElloraKailasa.webp'),
  'sacred-gautam-rishi-ashram': tImg('GautamRishiAshram.webp'),
  'sacred-gyanvapi-kund': tImg('Gyanvapi.webp'),
  'sacred-manikarnika-ghat': tImg('Manikarnika_Ghat.webp'),
  'sacred-naulakha-mandir': tImg('Naulakha.webp'),
  'sacred-sandipani-ashram': tImg('SandipaniAshram.webp'),
  'sacred-shiva-trats-kund': tImg('ShivaTrats.webp'),
  'sacred-sonprayag-sangam': tImg('SonprayagSangam.webp'),
  'sacred-tapovan-caves': tImg('Tapovancaves.webp'),
  'sacred-triveni-sangam-ghat': tImg('Triveni-Ghat.webp'),
  'sacred-baan-stambh': tImg('baan.webp'),
  'sacred-bhairavnath-mandir': tImg('bhairavnath.webp'),
  'sacred-dashashwamedh-ghat': tImg('dashashwamedh-ghat.webp'),
  'sacred-gandhi-sarovar': tImg('gandhisarvor.webp'),
  'sacred-gita-mandir': tImg('gitamandir.webp'),
  'sacred-ram-ghat': tImg('ramghat.webp'),
  'sacred-shivganga-kund': tImg('shivganga.webp'),
  'sacred-trikuta-parvat': tImg('trikuta.webp'),
  'sacred-vasuki-tal': tImg('vasukital.webp'),

  // Ashtavinayak Shrines
  'ashtavinayak-mayureshwar-temple-morgaon': tImg('mayureshwar.webp'),
  'ashtavinayak-siddhivinayak-temple-siddhatek': tImg('Siddhivinayak-Temple.webp'),
  'ashtavinayak-ballaleshwar-temple-pali': tImg('ballaleshwar.webp'),
  'ashtavinayak-varadhavinayak-temple-mahad': tImg('VaradVinayak.webp'),
  'ashtavinayak-chintamani-temple-theur': tImg('chintamani.webp'),
  'ashtavinayak-girijatmak-temple-lenyadri': tImg('Girijatmaj.webp'),
  'ashtavinayak-vighnahar-temple-ozar': tImg('Vighnahar.webp'),
  'ashtavinayak-mahaganapati-temple-ranjangaon': tImg('Mahaganapati.webp'),

  // Panchbhoota Shrines
  'panchbhoota-ekambareswarar-temple-kanchipuram': tImg('Ekambareshwar.webp'),
  'panchbhoota-jambukeswarar-temple-thiruvanaikaval': tImg('jambukeswarar.webp'),
  'panchbhoota-arunachaleswarar-temple-thiruvannamalai': tImg('Arunachaleswarar.webp'),
  'panchbhoota-thillai-nataraja-temple-chidambaram': tImg('ThillaiNataraja.webp'),

  // Additional Sacred Temples in Sacred Folder
  'vishnu-bankey-bihari-temple-vrindavan': tImg('Bankebihari_temple.webp'),
  'other-brahma-temple-pushkar': tImg('Brahma_Temple.webp'),
  'other-brihadisvara-temple-thanjavur': tImg('Brihadisvara.webp'),
  'other-dakshineswar-kali-temple-kolkata': tImg('Dakshineswar-Kali-Temple.webp'),
  'other-dwarkadhish-temple-mathura': tImg('DwarkadhishMathura.webp'),
  'other-govind-dev-ji-temple-jaipur': tImg('GovindDev.webp'),
  'other-guruvayur-temple-kerala': tImg('Guruvayur.webp'),
  'other-jakhu-temple-shimla': tImg('Jakhu.webp'),
  'other-kalaram-temple-nashik': tImg('Kalaram.webp'),
  'other-kashtabhanjan-dev-hanumanji-sarangpur': tImg('Kashtabhanjan.webp'),
  'other-khatu-shyam-ji-temple-sikar': tImg('KhatuShyam.webp'),
  'other-lingaraj-temple-bhubaneswar': tImg('Lingaraj.webp'),
  'other-murudeshwar-temple-karnataka': tImg('Murudeshwara.webp'),
  'other-neelkanth-mahadev-temple-rishikesh': tImg('NeelKanth.webp'),
  'other-pashupatinath-temple-mandsaur': tImg('Pashupatinath.webp'),
  'other-prem-mandir-vrindavan': tImg('Premmandir.webp'),
  'other-salasar-balaji-temple-churu': tImg('SalasarBalaji.webp'),
  'other-sankat-mochan-hanuman-temple-varanasi': tImg('Sankatmochan.webp'),
  'other-shrinathji-temple-nathdwara': tImg('Shreenathjitemple.webp'),
  'other-shree-ram-janmabhoomi-mandir-ayodhya': tImg('Shri_Ram_Janambhoomi_Mandir.webp'),
  'other-padmanabhaswamy-temple-thiruvananthapuram': tImg('Sree_Padmanabhaswamy.webp'),
  'other-sri-ranganathaswamy-temple-srirangam': tImg('SriRanganathaswamy.webp'),
  'other-sun-temple-modhera': tImg('SunTemple.webp'),
  'other-triyuginarayan-temple-rudraprayag': tImg('Triyuginarayan.webp'),
  'other-tungnath-temple-chopta': tImg('Tungnath.webp'),
  'other-udupi-sri-krishna-matha': tImg('Udupi_Sri_Krishna_Matha_Temple.webp'),
  'other-vithoba-temple-pandharpur': tImg('Vithoba.webp'),
  'other-hanuman-garhi-temple-ayodhya': tImg('hanumangarhi.webp'),
  'hanuman-hanumangarhi-temple-ayodhya': tImg('hanumangarhi.webp'),
  'other-iskcon-temple-vrindavan': tImg('iskconVrindavan.webp'),
  'vishnu-iskcon-temple-vrindavan': tImg('iskconVrindavan.webp'),
  'vishnu-iskcon-temple-bangalore-karnataka': tImg('ISKCON_Bangalore.webp'),
  'vishnu-iskcon-mira-road-thane': tImg('ISKCON_Mira_Road.webp'),
  'vishnu-iskcon-temple-mumbai': tImg('ISKCON_Juhu.webp'),
  'other-karni-mata-temple-deshnoke': tImg('karnimata.webp'),
  'other-shri-krishna-janmasthan-mathura': tImg('krishnajanmasthan.webp'),
  'other-sabarimala-sree-dharma-sastha-temple': tImg('sabarimala.webp'),

  // Direct backend DB seed ID mappings for Vishnu / Krishna / Ram
  'vishnu-tirupati-balaji-temple-andhra-pradesh': tImg('Tirumala_090615.webp'),
  'vishnu-sri-ranganathaswamy-temple-srirangam': tImg('SriRanganathaswamy.webp'),
  'vishnu-guruvayur-temple-kerala': tImg('Guruvayur.webp'),
  'vishnu-padmanabhaswamy-temple-thiruvananthapuram': tImg('Sree_Padmanabhaswamy.webp'),
  'vishnu-prem-mandir-vrindavan': tImg('Premmandir.webp'),
  'vishnu-shri-ram-mandir-ayodhya': tImg('Shri_Ram_Janambhoomi_Mandir.webp'),
  'vishnu-dwarakadheesh-temple-mathura': tImg('DwarkadhishMathura.webp'),
  'vishnu-krishna-janmabhoomi-mathura': tImg('krishnajanmasthan.webp'),
  'vishnu-radha-raman-temple-vrindavan': tImg('shri-radha-raman.webp'),
  'vishnu-radha-damodar-temple-vrindavan': tImg('RadhaDamodar.webp'),
  'vishnu-govind-dev-ji-temple-jaipur': tImg('GovindDev.webp'),
  'vishnu-nathdwara-shrinathji-temple': tImg('Shreenathjitemple.webp'),
  'vishnu-kalaram-temple-nashik': tImg('Kalaram.webp'),
  'vishnu-vitthal-temple-pandharpur': tImg('Vithoba.webp'),
  'vishnu-venugopala-swamy-temple-mysore': tImg('VenugopalaSwamy.webp'),
  'vishnu-chennakesava-temple-belur': tImg('Chennakesava.webp'),
  'vishnu-simhachalam-temple-visakhapatnam': tImg('VarahaLakshmiNarasimha.webp'),
  'vishnu-ahobilam-narasimha-temple': tImg('AhobilamNavanarasimha.webp'),
  'vishnu-badrinath-dham-chamoli': tImg('badrinath.webp'),
  'vishnu-badrinath-temple-char-dham': tImg('badrinath.webp'),
  'vishnu-ananta-vasudeva-temple-bhubaneswar': tImg('AnantaVasudeva.webp'),

  // Direct backend DB seed ID mappings for Shiva
  'shiva-lingaraj-temple-bhubaneswar': tImg('Lingaraj.webp'),
  'shiva-brihadisvara-temple-thanjavur': tImg('Brihadisvara.webp'),
  'shiva-amarnath-cave-temple-kashmir': tImg('Amarnath.webp'),
  'shiva-tungnath-temple-chopta': tImg('Tungnath.webp'),
  'shiva-pashupatinath-temple-mandsaur': tImg('Pashupatinath.webp'),
  'shiva-bhojeshwar-temple-bhojpur': tImg('Bhojeshwar.webp'),
  'shiva-murudeshwar-temple-karnataka': tImg('Murudeshwara.webp'),
  'shiva-pashupatinath-temple-nepal-border': tImg('Pashupatinath.webp'),
  'shiva-trimbakeshwar-dham-nashik': tImg('TrimbakehwarTemple.webp'),
  'shiva-bhimashankar-jyotirling-pune': tImg('Mamleshwar.webp'),
  'shiva-somnath-patan-gujarat': tImg('SomnathTemple.webp'),
  'shiva-tarakeshwar-temple-hooghly': tImg('Tarakeshwar.webp'),
  'shiva-baba-dham-deoghar': tImg('Baidyanath.webp'),
  'shiva-kashi-vishwanath-corridor-varanasi': tImg('Kashi_Vishwanath.webp'),
  'shiva-mahakaleshwar-bhasma-temple': tImg('MahakalTemple.webp'),
  'shiva-omkareshwar-island-khandwa': tImg('Okareshwar.webp'),
  'shiva-kedarnath-himalayan-shrine': tImg('KedarnathTemple.webp'),
  'shiva-grishneshwar-ellora-caves': tImg('Grishneshwar.webp'),
  'shiva-nageshwar-darukavana-gujarat': tImg('Nageshwar.webp'),
  'shiva-ramanathaswamy-corridor-rameswaram': tImg('Ramanathaswamy-temple.webp'),
  'shiva-mallikarjuna-srisailam-hills': tImg('Mallikarjuna.webp'),
  'shiva-kapaleeshwarar-temple-chennai': tImg('kapaleeshwarar.webp'),
  'shiva-vadakkunnathan-temple-thrissur': tImg('Vadakkunnathan.webp'),
  'shiva-chinnamastika-shiva-temple': tImg('bhairavnath.webp'),
  'shiva-kotilingeshwara-temple-kolar': tImg('Kotilingeshwara.webp'),

  // Direct backend DB seed ID mappings for Devi
  'devi-meenakshi-temple-madurai': tImg('MeenakshiTemple.webp'),
  'devi-mahalaxmi-temple-mumbai': tImg('mahalaxmi.webp'),
  'devi-mumbadevi-temple-mumbai': tImg('mumba-devi.webp'),
  'devi-mansa-devi-temple-haridwar': tImg('MansaDevi.webp'),
  'devi-chandi-devi-temple-haridwar': tImg('chandi-devi.webp'),
  'devi-kamakhya-peeth-guwahati': tImg('kamakhya.webp'),
  'devi-kalighat-mandir-kolkata': tImg('kalighat.webp'),
  'devi-dakshineswar-kali-temple-kolkata': tImg('Dakshineswar-Kali-Temple.webp'),
  'devi-kanaka-durga-temple-vijayawada': tImg('KanakaDurga.webp'),
  'devi-sree-bhadrakali-temple-attukal': tImg('Attukal.webp'),
  'devi-bhramara-ambika-temple-srisailam': tImg('chamundeshwari.webp'),
  'devi-katil-durgaparameshwari-temple': tImg('KateelDurgaparameshwari.webp'),
  'devi-horanadu-annapoorneshwari-temple': tImg('Annapoorneshwari.webp'),

  // Direct backend DB seed ID mappings for Hanuman
  'hanuman-kashtabhanjan-dev-temple-sarangpur': tImg('Kashtabhanjan.webp'),
  'hanuman-marutam-temple-connaught-place': tImg('PracheenHanuman.webp'),
  'hanuman-maruti-temple-girgaum': tImg('Babulnath.webp'),
  'hanuman-sankat-mochan-shimla': tImg('Sankatmochan.webp'),
  'hanuman-kainchi-dham-neem-karoli': tImg('KainchiDham.webp'),
  'hanuman-bade-hanuman-mandir-prayagraj': tImg('BadeHanumanMandir.webp'),
  'hanuman-hanuman-garhi-ayodhya': tImg('hanumangarhi.webp'),
  'hanuman-salasar-balaji-temple-churu': tImg('SalasarBalaji.webp'),

  // Comprehensive Sacred Folder Assets & DB Temple Mappings
  'sacred-adikumbeswarar': tImg('AdiKumbeswarar.webp'),
  'sacred-agniswarar': tImg('Agniswarar.webp'),
  'sacred-ahobilamnavanarasimha': tImg('AhobilamNavanarasimha.webp'),
  'sacred-amareswaraswamy': tImg('AmareswaraSwamy.webp'),
  'sacred-amarnath': tImg('Amarnath.webp'),
  'sacred-ambalappuzha-sri-krishna-temple': tImg('Ambalappuzha_Sri_Krishna_Temple.webp'),
  'sacred-anantavasudeva': tImg('AnantaVasudeva.webp'),
  'sacred-annapoorneshwari': tImg('Annapoorneshwari.webp'),
  'sacred-apatsahayesvarar': tImg('Apatsahayesvarar.webp'),
  'sacred-aranmula-parthasarathy': tImg('Aranmula_Parthasarathy.webp'),
  'sacred-arunachaleswarar': tImg('Arunachaleswarar.webp'),
  'sacred-attukal': tImg('Attukal.webp'),
  'sacred-babulnath': tImg('Babulnath.webp'),
  'sacred-badehanumanmandir': tImg('BadeHanumanMandir.webp'),
  'sacred-baijnath': tImg('Baijnath.webp'),
  'sacred-bankebihari-temple': tImg('Bankebihari_temple.webp'),
  'sacred-bhadrachalam-temple': tImg('Bhadrachalam_temple.webp'),
  'sacred-bhalkatirthshrine': tImg('BhalkaTirthShrine.webp'),
  'sacred-bhartrihari': tImg('Bhartrihari.webp'),
  'sacred-bhojeshwar': tImg('Bhojeshwar.webp'),
  'sacred-bijlimahadev': tImg('BijliMahadev.webp'),
  'sacred-birla-temple': tImg('Birla-Temple.webp'),
  'sacred-brahma-temple': tImg('Brahma_Temple.webp'),
  'sacred-brihadisvara': tImg('Brihadisvara.webp'),
  'sacred-chamundi': tImg('Chamundi.webp'),
  'sacred-chennakesava': tImg('Chennakesava.webp'),
  'sacred-chottanikkara': tImg('Chottanikkara.webp'),
  'sacred-dakshineswar-kali-temple': tImg('Dakshineswar-Kali-Temple.webp'),
  'sacred-daulatabad': tImg('Daulatabad.webp'),
  'sacred-dharbaranyeswarar': tImg('Dharbaranyeswarar.webp'),
  'sacred-dharidevi': tImg('DhariDevi.webp'),
  'sacred-draksharama-temple': tImg('Draksharama_temple.webp'),
  'sacred-dwarkadhishmathura': tImg('DwarkadhishMathura.webp'),
  'sacred-ekambareshwar': tImg('Ekambareshwar.webp'),
  'sacred-ellorakailasa': tImg('ElloraKailasa.webp'),
  'sacred-gautamrishiashram': tImg('GautamRishiAshram.webp'),
  'sacred-girijatmaj': tImg('Girijatmaj.webp'),
  'sacred-gnanasaraswathi': tImg('GnanaSaraswathi.webp'),
  'sacred-gommateshwara': tImg('Gommateshwara.webp'),
  'sacred-gopnathmahadev': tImg('GopnathMahadev.webp'),
  'sacred-gorakhnath': tImg('Gorakhnath.webp'),
  'sacred-govinddev': tImg('GovindDev.webp'),
  'sacred-guruvayur': tImg('Guruvayur.webp'),
  'sacred-gyanvapi': tImg('Gyanvapi.webp'),
  'sacred-hidimbadevi': tImg('HidimbaDevi.webp'),
  'sacred-hidimba-devi': tImg('Hidimba_Devi.webp'),
  'sacred-jakhu': tImg('Jakhu.webp'),
  'sacred-janardhanaswamy': tImg('JanardhanaSwamy.webp'),
  'sacred-kainchidham': tImg('KainchiDham.webp'),
  'sacred-kalaram': tImg('Kalaram.webp'),
  'sacred-kalikamata': tImg('kalikamata.webp'),
  'sacred-kanakadurga': tImg('KanakaDurga.webp'),
  'sacred-kanchipuram-kamakshi': tImg('Kanchipuram_Kamakshi.webp'),
  'sacred-kasardevi': tImg('KasarDevi.webp'),
  'sacred-kashtabhanjan': tImg('Kashtabhanjan.webp'),
  'sacred-kateeldurgaparameshwari': tImg('KateelDurgaparameshwari.webp'),
  'sacred-khatushyam': tImg('KhatuShyam.webp'),
  'sacred-kondagattuanjaneyaswamy': tImg('KondagattuAnjaneyaSwamy.webp'),
  'sacred-kotilingeshwara': tImg('Kotilingeshwara.webp'),
  'sacred-ksheeraramalingeswara': tImg('KsheeraRamalingeswara.webp'),
  'sacred-kumararama-bhimesvara': tImg('Kumararama_Bhimesvara.webp'),
  'sacred-lingaraj': tImg('Lingaraj.webp'),
  'sacred-maa-mundeshwari-devi': tImg('Maa_Mundeshwari_Devi.webp'),
  'sacred-mahabaleshwar': tImg('Mahabaleshwar.webp'),
  'sacred-mahaganapati': tImg('Mahaganapati.webp'),
  'sacred-mahavirmandir': tImg('MahavirMandir.webp'),
  'sacred-mansadevi': tImg('MansaDevi.webp'),
  'sacred-murudeshwara': tImg('Murudeshwara.webp'),
  'sacred-naganathaswamy': tImg('Naganathaswamy.webp'),
  'sacred-nagaraja': tImg('Nagaraja.webp'),
  'sacred-naulakha': tImg('Naulakha.webp'),
  'sacred-neelkanth': tImg('NeelKanth.webp'),
  'sacred-palanimurugan': tImg('PalaniMurugan.webp'),
  'sacred-pashupatinath': tImg('Pashupatinath.webp'),
  'sacred-pazhamudircholai': tImg('Pazhamudircholai.webp'),
  'sacred-pracheenhanuman': tImg('PracheenHanuman.webp'),
  'sacred-premmandir': tImg('Premmandir.webp'),
  'sacred-punaura-sitamarhi': tImg('Punaura_Sitamarhi.webp'),
  'sacred-purnagiridevi': tImg('PurnagiriDevi.webp'),
  'sacred-radhadamodar': tImg('RadhaDamodar.webp'),
  'sacred-ramappa-temple': tImg('Ramappa_Temple.webp'),
  'sacred-ramatheertham': tImg('Ramatheertham.webp'),
  'sacred-ramnagar-fort': tImg('Ramnagar_Fort.webp'),
  'sacred-ranakpur': tImg('Ranakpur.webp'),
  'sacred-salasarbalaji': tImg('SalasarBalaji.webp'),
  'sacred-sandipaniashram': tImg('SandipaniAshram.webp'),
  'sacred-sankatmochan': tImg('Sankatmochan.webp'),
  'sacred-sarangapani': tImg('Sarangapani.webp'),
  'sacred-shivatrats': tImg('ShivaTrats.webp'),
  'sacred-shreenathjitemple': tImg('Shreenathjitemple.webp'),
  'sacred-shri-ram-janambhoomi-mandir': tImg('Shri_Ram_Janambhoomi_Mandir.webp'),
  'sacred-siddhivinayak-temple': tImg('Siddhivinayak-Temple.webp'),
  'sacred-someshwara': tImg('Someshwara.webp'),
  'sacred-sonprayagsangam': tImg('SonprayagSangam.webp'),
  'sacred-sree-padmanabhaswamy': tImg('Sree_Padmanabhaswamy.webp'),
  'sacred-sree-vallaba': tImg('Sree_Vallaba.webp'),
  'sacred-sriranganathaswamy': tImg('SriRanganathaswamy.webp'),
  'sacred-srivilliputhurandal': tImg('SrivilliputhurAndal.webp'),
  'sacred-suntemple': tImg('SunTemple.webp'),
  'sacred-suryanarkovil': tImg('SuryanarKovil.webp'),
  'sacred-swamimalaimurugan': tImg('SwamimalaiMurugan.webp'),
  'sacred-swaminarayanakshardham': tImg('SwaminarayanAkshardham.webp'),
  'sacred-tanotmata': tImg('TanotMata.webp'),
  'sacred-tapovancaves': tImg('Tapovancaves.webp'),
  'sacred-tarakeshwar': tImg('Tarakeshwar.webp'),
  'sacred-templeofvedicplanetarium': tImg('TempleofVedicPlanetarium.webp'),
  'sacred-thillainataraja': tImg('ThillaiNataraja.webp'),
  'sacred-thirunageswaramnaganathar': tImg('ThirunageswaramNaganathar.webp'),
  'sacred-thiruparankundrammurugan': tImg('ThiruparankundramMurugan.webp'),
  'sacred-thiruttani-temple-rajagopuram': tImg('Thiruttani_Temple_Rajagopuram.webp'),
  'sacred-thousandpillar': tImg('ThousandPillar.webp'),
  'sacred-tiruchendurmurugan': tImg('TiruchendurMurugan.webp'),
  'sacred-trilokinath': tImg('Trilokinath.webp'),
  'sacred-trinetreshwar': tImg('Trinetreshwar.webp'),
  'sacred-triprayarsree': tImg('TriprayarSree.webp'),
  'sacred-triveni-ghat': tImg('Triveni-Ghat.webp'),
  'sacred-triyuginarayan': tImg('Triyuginarayan.webp'),
  'sacred-tungnath': tImg('Tungnath.webp'),
  'sacred-udupi-sri-krishna-matha-temple': tImg('Udupi_Sri_Krishna_Matha_Temple.webp'),
  'sacred-uppiliappan': tImg('Uppiliappan.webp'),
  'sacred-vadakkunnathan': tImg('Vadakkunnathan.webp'),
  'sacred-varadvinayak': tImg('VaradVinayak.webp'),
  'sacred-varadharajaperumal': tImg('VaradharajaPerumal.webp'),
  'sacred-varahalakshminarasimha': tImg('VarahaLakshmiNarasimha.webp'),
  'sacred-vashishttemple': tImg('VashishtTemple.webp'),
  'sacred-veerabhadra': tImg('Veerabhadra.webp'),
  'sacred-venugopalaswamy': tImg('VenugopalaSwamy.webp'),
  'sacred-vighnahar': tImg('Vighnahar.webp'),
  'sacred-vishnupad': tImg('Vishnupad.webp'),
  'sacred-vithoba': tImg('Vithoba.webp'),
  'sacred-yadadrisrilakshminarasimha': tImg('YadadriSriLakshmiNarasimha.webp'),
  'sacred-baan': tImg('baan.webp'),
  'sacred-ballaleshwar': tImg('ballaleshwar.webp'),
  'sacred-bhairavnath': tImg('bhairavnath.webp'),
  'sacred-chandi-devi': tImg('chandi-devi.webp'),
  'sacred-chintamani': tImg('chintamani.webp'),
  'sacred-dilwara': tImg('dilwara.webp'),
  'sacred-gandhisarvor': tImg('gandhisarvor.webp'),
  'sacred-gitamandir': tImg('gitamandir.webp'),
  'sacred-hanumangarhi': tImg('hanumangarhi.webp'),
  'sacred-iskconvrindavan': tImg('iskconVrindavan.webp'),
  'sacred-jageshwar': tImg('jageshwar.webp'),
  'sacred-jambukeswarar': tImg('jambukeswarar.webp'),
  'sacred-kailashnathwar': tImg('kailashnathwar.webp'),
  'sacred-kapaleeshwarar': tImg('kapaleeshwarar.webp'),
  'sacred-karnimata': tImg('karnimata.webp'),
  'sacred-krishnajanmasthan': tImg('krishnajanmasthan.webp'),
  'sacred-mayureshwar': tImg('mayureshwar.webp'),
  'sacred-mumba-devi': tImg('mumba-devi.webp'),
  'sacred-ramghat': tImg('ramghat.webp'),
  'sacred-sabarimala': tImg('sabarimala.webp'),
  'sacred-sammed-shikharji': tImg('sammed-shikharji.webp'),
  'sacred-shivganga': tImg('shivganga.webp'),
  'sacred-shri-radha-raman': tImg('shri-radha-raman.webp'),
  'sacred-tapkeshwar': tImg('tapkeshwar.webp'),
  'sacred-trikuta': tImg('trikuta.webp'),
  'sacred-trinetra-ganesh-temple': tImg('trinetra-ganesh-temple.webp'),
  'sacred-tulsi-manas': tImg('tulsi-manas.webp'),
  // Direct backend DB seed ID mappings for Ashtavinayak

  // Direct backend DB seed ID mappings for Panchbhoota

  // Direct backend DB seed ID mappings for Sacred / Other temples
  'sacred-somnath-gujarat-coastal': tImg('SomnathTemple.webp'),
  'sacred-palani-murugan-temple': tImg('PalaniMurugan.webp'),
  'sacred-swamimalai-murugan-temple': tImg('SwamimalaiMurugan.webp'),
  'sacred-thiruthani-murugan-temple': tImg('Thiruttani_Temple_Rajagopuram.webp'),
  'sacred-thiruparankundram-murugan-temple': tImg('ThiruparankundramMurugan.webp'),
  'sacred-pazhamudircholai-murugan-temple': tImg('Pazhamudircholai.webp'),
  'sacred-tiruchendur-murugan-temple': tImg('TiruchendurMurugan.webp'),
  'sacred-shravanabelagola-gommateshwara': tImg('Gommateshwara.webp'),
  'sacred-mayapur-chandrodaya-mandir': tImg('TempleofVedicPlanetarium.webp'),
  'sacred-sammed-shikharji-parasnath': tImg('sammed-shikharji.webp'),
  'sacred-dilwara-jain-temples-mount-abu': tImg('dilwara.webp'),
  'sacred-ranakpur-jain-temple-pali': tImg('Ranakpur.webp'),
  'sacred-karni-mata-temple-deshnoke': tImg('karnimata.webp'),
  'sacred-tanot-mata-temple-jaisalmer': tImg('TanotMata.webp'),
  'sacred-brahma-temple-pushkar': tImg('Brahma_Temple.webp'),
  'sacred-khatu-shyam-temple-sikar': tImg('KhatuShyam.webp'),
  'sacred-trinetra-ganesh-temple-ranthambore': tImg('trinetra-ganesh-temple.webp'),
  'sacred-chamundeshwari-hill-mysore': tImg('chamundeshwari.webp'),
  'sacred-murudeshwar-coastal-temple': tImg('Murudeshwara.webp'),
  'sacred-gokarna-mahabaleshwar-temple': tImg('Mahabaleshwar.webp'),
  'sacred-triprayar-srama-temple-thrissur': tImg('TriprayarSree.webp'),
  'sacred-thiruvalla-sree-vallabha-temple': tImg('Sree_Vallaba.webp'),
  'sacred-ambalappuzha-sree-krishna-temple': tImg('Ambalappuzha_Sri_Krishna_Temple.webp'),
  'sacred-arankula-parthasarathy-temple': tImg('Aranmula_Parthasarathy.webp'),
  'sacred-janardhana-swamy-temple-varkala': tImg('JanardhanaSwamy.webp'),
  'sacred-nagaraja-temple-nagercoil': tImg('Nagaraja.webp'),
  'sacred-srivilliputhur-andal-temple': tImg('SrivilliputhurAndal.webp'),
  'sacred-oppiliappan-temple-kumbakonam': tImg('Uppiliappan.webp'),
  'sacred-sarangapani-temple-kumbakonam': tImg('Sarangapani.webp'),
  'sacred-kumbeshwarar-temple-kumbakonam': tImg('AdiKumbeswarar.webp'),
  'sacred-varadharaja-perumal-temple-kanchipuram': tImg('VaradharajaPerumal.webp'),
  'sacred-kamakshi-amman-temple-kanchipuram': tImg('Kanchipuram_Kamakshi.webp'),
  'sacred-thirunageswaram-naganathar-temple': tImg('ThirunageswaramNaganathar.webp'),
  'sacred-thingalur-chandran-temple': tImg('ThirunageswaramNaganathar.webp'),
  'sacred-alangudi-guru-temple': tImg('Apatsahayesvarar.webp'),
  'sacred-kanchanur-sukran-temple': tImg('Agniswarar.webp'),
  'sacred-thirunallar-saneeswaran-temple': tImg('Dharbaranyeswarar.webp'),
  'sacred-kethu-temple-keelaperumpallam': tImg('Naganathaswamy.webp'),
  'sacred-suryanar-kovil-kumbakonam': tImg('SuryanarKovil.webp'),
  'sacred-siddhivinayak-temple-mumbai': tImg('Siddhivinayak.webp'),
  'sacred-ramatheertham-vizianagaram': tImg('Ramatheertham.webp'),
  'sacred-draksharamam-bheemeswara-temple': tImg('Draksharama_temple.webp'),
  'sacred-amararamam-amaraswaraswamy-temple': tImg('AmareswaraSwamy.webp'),
  'sacred-somaramam-someshwara-swamy-temple': tImg('Someshwara.webp'),
  'sacred-ksheeraramam-ksheera-ramalingeswara': tImg('KsheeraRamalingeswara.webp'),
  'sacred-kumararamam-bhimeswara-swamy': tImg('Kumararama_Bhimesvara.webp'),
  'sacred-yadadri-narasimha-swamy-temple': tImg('YadadriSriLakshmiNarasimha.webp'),
  'sacred-bhadrachalam-sita-ramachandra-swamy': tImg('Bhadrachalam_temple.webp'),
  'sacred-thousand-pillar-temple-warangal': tImg('ThousandPillar.webp'),
  'sacred-ramappa-temple-mulugu': tImg('Ramappa_Temple.webp'),
  'sacred-gnana-saraswathi-temple-basar': tImg('GnanaSaraswathi.webp'),
  'sacred-kondagattu-anjaneya-swamy-temple': tImg('KondagattuAnjaneyaSwamy.webp'),
  'sacred-veerabhadra-temple-lepakshi': tImg('Veerabhadra.webp'),
  'sacred-patan-devi-temple-patna': tImg('MahavirMandir.webp'),
  'sacred-mahavir-mandir-patna': tImg('MahavirMandir.webp'),
  'sacred-janaki-mandir-sitamarhi': tImg('Punaura_Sitamarhi.webp'),
  'sacred-mundeshwari-devi-temple-kaimur': tImg('Maa_Mundeshwari_Devi.webp'),
  'sacred-gorakhnath-temple-gorakhpur': tImg('Gorakhnath.webp'),
  'sacred-tulsi-manas-temple-varanasi': tImg('tulsi-manas.webp'),
  'sacred-vibhuti-narayan-fort-temple-ramnagar': tImg('Ramnagar_Fort.webp'),
  'sacred-naini-devi-temple-nainital': tImg('Nainadevi.webp'),
  'sacred-triyuginarayan-temple-rudraprayag': tImg('Triyuginarayan.webp'),
  'sacred-dhari-devi-temple-srinagar-garhwal': tImg('DhariDevi.webp'),
  'sacred-neelkanth-mahadev-temple-rishikesh': tImg('NeelKanth.webp'),
  'sacred-tapkeshwar-temple-dehradun': tImg('tapkeshwar.webp'),
  'sacred-kasar-devi-temple-almora': tImg('KasarDevi.webp'),
  'sacred-jageshwar-dham-almora': tImg('jageshwar.webp'),
  'sacred-baijnath-temple-bageshwar': tImg('Baijnath.webp'),
  'sacred-purnagiri-devi-temple-champawat': tImg('PurnagiriDevi.webp'),
  'sacred-hadimba-devi-temple-manali': tImg('Hidimba_Devi.webp'),
  'sacred-bijli-mahadev-temple-kullu': tImg('BijliMahadev.webp'),
  'sacred-vashisht-kund-temple-manali': tImg('VashishtTemple.webp'),
  'sacred-triloknath-temple-lahaul': tImg('Trilokinath.webp'),
  'sacred-mahakali-temple-pavagadh': tImg('kalikamata.webp'),
  'sacred-bala-hanuman-temple-jamnagar': tImg('PracheenHanuman.webp'),
  'sacred-bhalkeeshwar-temple-veraval': tImg('BhalkaTirthShrine.webp'),
  'sacred-gopnath-mahadev-temple-bhavnagar': tImg('GopnathMahadev.webp'),
  'sacred-tarnetar-mahadev-temple-surendranagar': tImg('Trinetreshwar.webp'),
  'sacred-sun-temple-modhera': tImg('SunTemple.webp'),
  'sacred-somnath-mahadham-gujarat': tImg('SomnathTemple.webp'),
  'sacred-somnath-jyotirling-gujarat-core': tImg('SomnathTemple.webp'),
  'sacred-golden-temple-amritsar': tImg('GoldenTemple.webp'),
  'sacred-vasukital': tImg('vasukital.webp'),

  // Direct mappings & aliases for dataset completeness
  'sree-vallabha-temple-thiruvalla': tImg('Sree_Vallaba.webp'),
  'sree-vallabha-temple-–-thiruvalla': tImg('Sree_Vallaba.webp'),
  'sree-vallabha-temple---thiruvalla': tImg('Sree_Vallaba.webp'),
  'sree-vallabha-temple': tImg('Sree_Vallaba.webp'),
  'bhavani-temple': tImg('tuljabhavani.webp'),
  'bhavani-temple-tuljapur': tImg('tuljabhavani.webp'),
  'bhramaramba-mallikarjuna-temple': tImg('Mallikarjuna.webp'),
  'bhramaramba-mallikarjuna-temple-srisailam': tImg('Mallikarjuna.webp'),
};

const DEFAULT_TEMPLE_IMAGE: number = require('../../assets/images/temple-fallback-icon.png');

const DETAILED_LOOKUP_CACHE = new Map<string, any>();
const IMAGE_LOOKUP_CACHE = new Map<string, ImageSourcePropType>();

const normalizeTempleName = (
  name: string,
  options?: { stripLocation?: boolean; stripPrefixes?: boolean }
): string => {
  if (!name) return '';
  let str = name.toLowerCase().trim();

  // Replace unicode dashes (–, —) with standard hyphen
  str = str.replace(/[–—]/g, '-');

  // Normalize "Shree" / "Sri" / "Sree" → "shri"
  str = str.replace(/\b(shree|sri|sree)\b/g, 'shri');

  // Strip location suffixes if requested
  if (options?.stripLocation) {
    str = str.replace(/[\s\-]+(gujarat|uttarakhand|madhya-pradesh|madhya pradesh|maharashtra|varanasi|ellora|nashik|dwarka|srisailam|deoghar|andhra-pradesh|andhra pradesh|jammu-kashmir|jammu kashmir|mumbai|puri|amritsar|madurai|karnataka|thane|guwahati|kolkata|birbhum|bengal|kangra|rajarappa|kolhapur|mysore|vindhyachal|kashmir|rajasthan|tripura|nalhati|burdwan|bolpur|tuljapur|mahur|dantewada|bilaspur|una|prayagraj|balrampur|ujjain|maihar|jajpur|ganjam|dausa|rishikesh|puducherry|haridwar|mayiladuthurai|kerala|srikalahasti|mangalore|vrindavan|pushkar|thanjavur|mathura|jaipur|bhubaneswar|sikar|churu|ayodhya|thiruvananthapuram|srirangam|modhera|rudraprayag|chopta|pandharpur|deshnoke|gaya|delhi|thingalur|prabhas-patan|prabhas patan|kaimur|hampi|kochi|kollur)$/i, '');
  }

  // Strip common category prefixes if requested
  if (options?.stripPrefixes) {
    str = str.replace(/^(shaktipeeth|shakti|jyotirling|sacred|other|divyadesh|ashtavinayak|chardham|char-dham|healing|devi|vishnu|hanuman|panchbhoota)[-_\s]+/i, '');
  }

  // Remove punctuation and extra spaces
  return str.replace(/[^a-z0-9]/g, '');
};

// Pre-computed normalized lookup maps for O(1) tier resolution
const NORM_KEY_MAP = new Map<string, string>();
const NORM_NAME_MAP = new Map<string, string>();
const NORM_STRIPPED_MAP = new Map<string, string>();

// Initialize pre-computed normalized maps for TEMPLE_IMAGES
Object.keys(TEMPLE_IMAGES).forEach((key) => {
  const normKey = normalizeTempleName(key);
  if (normKey && !NORM_KEY_MAP.has(normKey)) {
    NORM_KEY_MAP.set(normKey, key);
  }

  const normName = normalizeTempleName(key, { stripLocation: true });
  if (normName && !NORM_NAME_MAP.has(normName)) {
    NORM_NAME_MAP.set(normName, key);
  }

  const normStripped = normalizeTempleName(key, { stripLocation: true, stripPrefixes: true });
  if (normStripped && !NORM_STRIPPED_MAP.has(normStripped)) {
    NORM_STRIPPED_MAP.set(normStripped, key);
  }
});

const TEMPLE_FALLBACK_POOL: ImageSourcePropType[] = [
  require('../../assets/images/temple-fallback-icon.png'),
];

const _rawGetTempleImageByNameDetailed = (name: string) => {
  const input = String(name || '').trim();
  if (!input) {
    return { key: 'DEFAULT_TEMPLE_IMAGE', res: DEFAULT_TEMPLE_IMAGE, tier: 'Tier 6 (Default)' };
  }

  // 1. Exact ID match (O(1))
  if (TEMPLE_IMAGES[input]) {
    return { key: input, res: TEMPLE_IMAGES[input], tier: 'Tier 1 (Exact ID)' };
  }

  // 2. Exact Normalized Key match (O(1))
  const normInputRaw = normalizeTempleName(input);
  if (normInputRaw && NORM_KEY_MAP.has(normInputRaw)) {
    const key = NORM_KEY_MAP.get(normInputRaw)!;
    return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 2 (Exact Normalized Key)' };
  }

  // 3. Exact Normalized Name match (with location suffix stripped) (O(1))
  const normInputNoLoc = normalizeTempleName(input, { stripLocation: true });
  if (normInputNoLoc && NORM_NAME_MAP.has(normInputNoLoc)) {
    const key = NORM_NAME_MAP.get(normInputNoLoc)!;
    return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 3 (Exact Normalized Name)' };
  }

  // 4. Prefix-stripped Normalized Key match (O(1))
  const normInputStripped = normalizeTempleName(input, { stripLocation: true, stripPrefixes: true });
  if (normInputStripped && NORM_STRIPPED_MAP.has(normInputStripped)) {
    const key = NORM_STRIPPED_MAP.get(normInputStripped)!;
    return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 4 (Prefix-stripped Key)' };
  }

  // 5. Controlled Fuzzy match (last resort before default fallback)
  if (normInputStripped && normInputStripped.length >= 4) {
    const s1 = normInputStripped.replace(/(mandir|temple|monastery|stupa|dhamek|ashram|peeth)/g, '');
    if (s1) {
      for (const [normKeyStripped, key] of NORM_STRIPPED_MAP.entries()) {
        if (normKeyStripped.length >= 4) {
          const s2 = normKeyStripped.replace(/(mandir|temple|monastery|stupa|dhamek|ashram|peeth)/g, '');
          if (s2 && (s1 === s2 || s1.includes(s2) || s2.includes(s1))) {
            return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 5 (Controlled Fuzzy Match)' };
          }
        }
      }
    }
  }

  // 6. DEFAULT_TEMPLE_IMAGE / Hash-based Pool Fallback
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const poolIndex = Math.abs(hash) % TEMPLE_FALLBACK_POOL.length;
  const fallbackAsset = TEMPLE_FALLBACK_POOL[poolIndex] || DEFAULT_TEMPLE_IMAGE;

  return { key: `poolFallback:${poolIndex}`, res: fallbackAsset, tier: 'Tier 6 (Default Fallback)' };
};

const getTempleImageByNameDetailed = (name: string) => {
  const key = String(name || '').trim();
  if (DETAILED_LOOKUP_CACHE.has(key)) return DETAILED_LOOKUP_CACHE.get(key)!;
  const res = _rawGetTempleImageByNameDetailed(key);
  DETAILED_LOOKUP_CACHE.set(key, res);
  return res;
};

const getTempleImageById = (id: string): ImageSourcePropType | null => {
  if (!id) return null;
  const detailed = getTempleImageByNameDetailed(id);
  if (detailed.tier.includes('Tier 6')) return null;
  return detailed.res || null;
};

const getTempleImageByNameStrict = (name: string): ImageSourcePropType | null => {
  if (!name) return null;
  const detailed = getTempleImageByNameDetailed(name);
  if (detailed.tier.includes('Tier 6')) return null;
  return detailed.res || null;
};

const getTempleImageByName = (name: string): ImageSourcePropType => {
  const key = String(name || '').trim();
  if (!key) return DEFAULT_TEMPLE_IMAGE;
  if (IMAGE_LOOKUP_CACHE.has(key)) return IMAGE_LOOKUP_CACHE.get(key) || DEFAULT_TEMPLE_IMAGE;
  const res = _rawGetTempleImageByNameDetailed(key).res || DEFAULT_TEMPLE_IMAGE;
  IMAGE_LOOKUP_CACHE.set(key, res);
  return res;
};

const resolveTempleImage = (item: any): ImageSourcePropType => {
  if (!item) return DEFAULT_TEMPLE_IMAGE;

  const id = String(
    item.temple_id ||
    item.templeId ||
    item.id ||
    ''
  ).trim();

  const name = String(item.name || '').trim();

  // 1. Deterministic local registry lookup by ID (Tiers 1-5 only)
  if (id) {
    const byId = getTempleImageById(id);
    if (byId) return byId;
  }

  // 2. Deterministic local registry lookup by name (Tiers 1-5 only)
  if (name) {
    const byName = getTempleImageByNameStrict(name);
    if (byName) return byName;
  }

  // 3. Remote URL check (valid HTTP / HTTPS string)
  const imageUrl = item.image_url || item.imageUrl;
  if (typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl.trim())) {
    return { uri: imageUrl.trim() };
  }

  // 4. Guaranteed local neutral fallback (Tier 6)
  return DEFAULT_TEMPLE_IMAGE;
};

export {
  TEMPLE_IMAGES,
  DEFAULT_TEMPLE_IMAGE,
  normalizeTempleName,
  getTempleImageById,
  getTempleImageByName,
  getTempleImageByNameDetailed,
  resolveTempleImage,
};