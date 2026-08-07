import { ImageSourcePropType } from 'react-native';

const TEMPLE_IMAGES: Record<string, ImageSourcePropType> = {
  // Jyotirlingas
  'jyotirling-somnath-temple-gujarat': require('../../assets/images/image temple/SomnathTemple.webp'),
  'jyotirling-kedarnath-temple-uttarakhand': require('../../assets/images/image temple/KedarnathTemple.webp'),
  'jyotirling-mahakaleshwar-temple-ujjain': require('../../assets/images/image temple/MahakalTemple.webp'),
  'jyotirling-kashi-vishwanath-temple-varanasi': require('../../assets/images/image temple/Kashi_Vishwanath.webp'),
  'jyotirling-bhimashankar-temple-maharashtra': require('../../assets/images/image temple/Mamleshwar.webp'),
  'jyotirling-ramanathaswamy-temple-rameswaram': require('../../assets/images/image temple/Ramanathaswamy-temple.webp'),
  'jyotirling-grishneshwar-temple-maharashtra': require('../../assets/images/image temple/Grishneshwar.webp'),
  'jyotirling-grishneshwar-temple-ellora': require('../../assets/images/image temple/Grishneshwar.webp'),
  'jyotirling-omkareshwar-temple-madhya-pradesh': require('../../assets/images/image temple/Okareshwar.webp'),
  'jyotirling-trimbakeshwar-temple-maharashtra': require('../../assets/images/image temple/TrimbakehwarTemple.webp'),
  'jyotirling-trimbakeshwar-temple-nashik': require('../../assets/images/image temple/TrimbakehwarTemple.webp'),
  'jyotirling-nageshwar-temple-gujarat': require('../../assets/images/image temple/Nageshwar.webp'),
  'jyotirling-nageshwar-temple-dwarka': require('../../assets/images/image temple/Nageshwar.webp'),
  'jyotirling-mallikarjuna-temple-andhra-pradesh': require('../../assets/images/image temple/Mallikarjuna.webp'),
  'jyotirling-mallikarjuna-temple-srisailam': require('../../assets/images/image temple/Mallikarjuna.webp'),
  'jyotirling-baidyanath-temple-jharkhand': require('../../assets/images/image temple/Baidyanath.webp'),
  'jyotirling-baidyanath-temple-deoghar': require('../../assets/images/image temple/Baidyanath.webp'),
  
  // Sacred / Others & Char Dham
  'other-tirupati-balaji-temple-andhra-pradesh': require('../../assets/images/image temple/Tirumala_090615.webp'),
  'other-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/image temple/VaishnoDeviTemple.webp'),
  'other-siddhivinayak-temple-mumbai': require('../../assets/images/image temple/Siddhivinayak.webp'),
  'other-shree-siddhivinayak-temple': require('../../assets/images/image temple/Siddhivinayak.webp'),
  'other-shirdi-sai-baba-temple-maharashtra': require('../../assets/images/image temple/Sai_Baba.webp'),
  'other-jagannath-temple-puri': require('../../assets/images/image temple/Jaganath.webp'),
  'chardham-jagannath-temple-puri': require('../../assets/images/image temple/Jaganath.webp'),
  'chardham-badrinath-temple-uttarakhand': require('../../assets/images/image temple/badrinath.webp'),
  'chardham-gangotri-temple-uttarakhand': require('../../assets/images/image temple/gangotri.webp'),
  'chardham-yamunotri-temple-uttarakhand': require('../../assets/images/image temple/yamunotritemple.webp'),
  'chardham-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.webp'),
  'other-golden-temple-amritsar': require('../../assets/images/image temple/GoldenTemple.webp'),
  'other-meenakshi-temple-madurai': require('../../assets/images/image temple/MeenakshiTemple.webp'),
  'other-iskcon-temple-bangalore-karnataka': require('../../assets/images/image temple/ISKCON_Bangalore.webp'),
  'other-iskcon-bangalore-aarti': require('../../assets/images/image temple/ISKCON_Bangalore.webp'),
  'other-iskcon-mira-road-thane': require('../../assets/images/image temple/ISKCON_Mira_Road.webp'),
  'other-iskcon-temple-mumbai': require('../../assets/images/image temple/ISKCON_Juhu.webp'),
  'other-iskcon-juhu': require('../../assets/images/image temple/ISKCON_Juhu.webp'),
  'other-iskcon-temple-mumbai-juhu': require('../../assets/images/image temple/ISKCON_Juhu.webp'),
  'other-mahalaxmi-temple': require('../../assets/images/shaktipeeth/mahalaxmi.webp'),
  'other-shri-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.webp'),

  // Shakti Peethas (from assets/images/shaktipeeth)
  'shaktipeeth-kamakhya-temple-guwahati': require('../../assets/images/shaktipeeth/kamakhya.webp'),
  'shakti-kamakhya-temple-assam': require('../../assets/images/shaktipeeth/kamakhya.webp'),
  'shaktipeeth-kalighat-kali-temple-kolkata': require('../../assets/images/shaktipeeth/kalighat.webp'),
  'shakti-kalighat-temple-kolkata': require('../../assets/images/shaktipeeth/kalighat.webp'),
  'shaktipeeth-tarapith-temple-birbhum': require('../../assets/images/shaktipeeth/tarapith.webp'),
  'shakti-tarapith-temple-bengal': require('../../assets/images/shaktipeeth/tarapith.webp'),
  'shaktipeeth-ambaji-temple-gujarat': require('../../assets/images/shaktipeeth/ambaji.webp'),
  'shakti-ambaji-temple-gujarat': require('../../assets/images/shaktipeeth/ambaji.webp'),
  'shaktipeeth-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/shaktipeeth/vaishnodevi.webp'),
  'shaktipeeth-jwala-ji-temple-kangra': require('../../assets/images/shaktipeeth/jwala.webp'),
  'shaktipeeth-chinnamasta-temple-rajarappa': require('../../assets/images/shaktipeeth/chinnamasta.webp'),
  'shaktipeeth-mahalaxmi-temple-kolhapur': require('../../assets/images/shaktipeeth/mahalaxmi.webp'),
  'shaktipeeth-chamundeshwari-temple-mysore': require('../../assets/images/shaktipeeth/chamundeshwari.webp'),
  'shakti-chamundeshwari-temple-mysore': require('../../assets/images/shaktipeeth/chamundeshwari.webp'),
  'shaktipeeth-vindhyavasini-temple-vindhyachal': require('../../assets/images/shaktipeeth/vindhyavasini.webp'),
  'shaktipeeth-kamakhya-kanya-kumari-temple': require('../../assets/images/shaktipeeth/kanyakumari.webp'),
  'shaktipeeth-sharda-peeth-kashmir': require('../../assets/images/shaktipeeth/sharadapeeth.webp'),
  'shaktipeeth-hinglaj-devi-rajasthan': require('../../assets/images/shaktipeeth/hinglajmata.webp'),
  'shaktipeeth-tripora-sundari-temple-tripura': require('../../assets/images/shaktipeeth/tripurasundari.webp'),
  'shaktipeeth-attahas-temple-birbhum': require('../../assets/images/shaktipeeth/Attahas-Shaktipeeth.webp'),
  'shaktipeeth-bakreshwar-temple-birbhum': require('../../assets/images/shaktipeeth/Bakreswar.webp'),
  'shaktipeeth-nalateswari-temple-nalhati': require('../../assets/images/shaktipeeth/nalateswari.webp'),
  'shaktipeeth-jogadya-temple-burdwan': require('../../assets/images/shaktipeeth/jogadya.webp'),
  'shaktipeeth-kankalitala-temple-bolpur': require('../../assets/images/shaktipeeth/kankalitala.webp'),
  'shaktipeeth-bhavani-mandir-tuljapur': require('../../assets/images/shaktipeeth/tuljabhavani.webp'),
  'shaktipeeth-renuka-devi-temple-mahur': require('../../assets/images/shaktipeeth/renukadevi.webp'),
  'shaktipeeth-saptashrungi-temple-nashik': require('../../assets/images/shaktipeeth/saptashrungi.webp'),
  'shaktipeeth-danteshwari-temple-dantewada': require('../../assets/images/shaktipeeth/danteshwari.webp'),
  'shaktipeeth-chamunda-devi-temple-kangra': require('../../assets/images/shaktipeeth/Chamundatemple.webp'),
  'shaktipeeth-naina-devi-temple-bilaspur': require('../../assets/images/shaktipeeth/Nainadevi.webp'),
  'shaktipeeth-brareshwari-devi-temple-kangra': require('../../assets/images/shaktipeeth/brajeshwari.webp'),
  'shaktipeeth-chintpurni-devi-temple-una': require('../../assets/images/shaktipeeth/chintpurni.webp'),
  'shaktipeeth-alopi-devi-temple-prayagraj': require('../../assets/images/shaktipeeth/alopi-devi-mandir.webp'),
  'shaktipeeth-devi-patan-temple-balrampur': require('../../assets/images/shaktipeeth/devipatan.webp'),
  'shaktipeeth-harsiddhi-mata-temple-ujjain': require('../../assets/images/shaktipeeth/harsiddhi.webp'),
  'shaktipeeth-sharada-devi-temple-maihar': require('../../assets/images/shaktipeeth/maihardevi.webp'),
  'shaktipeeth-biraja-temple-jajpur': require('../../assets/images/shaktipeeth/biraja.webp'),
  'shaktipeeth-tara-tarini-temple-ganjam': require('../../assets/images/shaktipeeth/taratarini.webp'),

  // Healing Temples (from assets/images/healingtemple)
  'healing-ramanasramam-tiruvannamalai': require('../../assets/images/healingtemple/SriRamana.webp'),
  'healing-dhyanalinga-isha-coimbatore': require('../../assets/images/healingtemple/dhyanalinga.webp'),
  'healing-virupaksha-temple-hampi': require('../../assets/images/healingtemple/virupaksha.webp'),
  'healing-anandamayi-ma-ashram-haridwar': require('../../assets/images/healingtemple/AnandamayiAshram.webp'),
  'hanuman-mehendipur-balaji-temple-dausa': require('../../assets/images/healingtemple/Mehandipurbalaji.webp'),
  'healing-parmarth-niketan-rishikesh': require('../../assets/images/healingtemple/ParmarthNiketan.webp'),
  'healing-sri-aurobindo-ashram-puducherry': require('../../assets/images/healingtemple/SriAurobindo.webp'),
  'sacred-belur-math-ramakrishna-mission': require('../../assets/images/healingtemple/BelurMath.webp'),
  'healing-sarnath-buddhist-monastery': require('../../assets/images/healingtemple/sarnathvaranasi.webp'),
  'sacred-mahabodhi-temple-bodh-gaya': require('../../assets/images/healingtemple/mahabodhi.webp'),
  'devi-kollur-mookambika-temple': require('../../assets/images/healingtemple/kollurmookambika.webp'),
  'devi-chottanikara-temple-kochi': require('../../assets/images/healingtemple/Chottanikkara.webp'),
  'sacred-vaitheeswaran-koil-mayiladuthurai': require('../../assets/images/healingtemple/Vaitheeswaran.webp'),
  'healing-parli-vaijnath-temple': require('../../assets/images/healingtemple/parliVajinath.webp'),
  'healing-dhanvantari-temple-kerala': require('../../assets/images/healingtemple/SriDhanvantari.webp'),
  'sacred-suchindram-thanumalayan-temple': require('../../assets/images/healingtemple/SuchindramThanumalay.webp'),
  'healing-ghati-subramanya-temple': require('../../assets/images/healingtemple/GhatiSubramanyaTemple.webp'),
  'panchbhoota-srikalahasteeswara-temple-srikalahasti': require('../../assets/images/healingtemple/Srikalahasteeswara.webp'),
  'sacred-kukke-subramanya-temple': require('../../assets/images/healingtemple/KukkeSubramanya.webp'),
  'healing-mangaladevi-temple-mangalore': require('../../assets/images/healingtemple/Mangaladevi.webp'),

  // Sacred Places & Shrines (from assets/images/sacred)
  'sacred-assi-ghat': require('../../assets/images/sacred/Assi_Ghat.webp'),
  'sacred-bhalka-tirth-shrine': require('../../assets/images/sacred/BhalkaTirthShrine.webp'),
  'sacred-bhartrihari-caves': require('../../assets/images/sacred/Bhartrihari.webp'),
  'sacred-daulatabad-fort': require('../../assets/images/sacred/Daulatabad.webp'),
  'sacred-ellora-kailasa-temple': require('../../assets/images/sacred/ElloraKailasa.webp'),
  'sacred-gautam-rishi-ashram': require('../../assets/images/sacred/GautamRishiAshram.webp'),
  'sacred-gyanvapi-kund': require('../../assets/images/sacred/Gyanvapi.webp'),
  'sacred-manikarnika-ghat': require('../../assets/images/sacred/Manikarnika_Ghat.webp'),
  'sacred-naulakha-mandir': require('../../assets/images/sacred/Naulakha.webp'),
  'sacred-sandipani-ashram': require('../../assets/images/sacred/SandipaniAshram.webp'),
  'sacred-shiva-trats-kund': require('../../assets/images/sacred/ShivaTrats.webp'),
  'sacred-sonprayag-sangam': require('../../assets/images/sacred/SonprayagSangam.webp'),
  'sacred-tapovan-caves': require('../../assets/images/sacred/Tapovancaves.webp'),
  'sacred-triveni-sangam-ghat': require('../../assets/images/sacred/Triveni-Ghat.webp'),
  'sacred-baan-stambh': require('../../assets/images/sacred/baan.webp'),
  'sacred-bhairavnath-mandir': require('../../assets/images/sacred/bhairavnath.webp'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/sacred/dashashwamedh-ghat.webp'),
  'sacred-gandhi-sarovar': require('../../assets/images/sacred/gandhisarvor.webp'),
  'sacred-gita-mandir': require('../../assets/images/sacred/gitamandir.webp'),
  'sacred-ram-ghat': require('../../assets/images/sacred/ramghat.webp'),
  'sacred-shivganga-kund': require('../../assets/images/sacred/shivganga.webp'),
  'sacred-trikuta-parvat': require('../../assets/images/sacred/trikuta.webp'),
  'sacred-vasuki-tal': require('../../assets/images/sacred/vasukital.webp'),

  // Ashtavinayak Shrines
  'ashtavinayak-mayureshwar-temple-morgaon': require('../../assets/images/sacred/mayureshwar.webp'),
  'ashtavinayak-siddhivinayak-temple-siddhatek': require('../../assets/images/sacred/Siddhivinayak-Temple.webp'),
  'ashtavinayak-ballaleshwar-temple-pali': require('../../assets/images/sacred/ballaleshwar.webp'),
  'ashtavinayak-varadhavinayak-temple-mahad': require('../../assets/images/sacred/VaradVinayak.webp'),
  'ashtavinayak-chintamani-temple-theur': require('../../assets/images/sacred/chintamani.webp'),
  'ashtavinayak-girijatmak-temple-lenyadri': require('../../assets/images/sacred/Girijatmaj.webp'),
  'ashtavinayak-vighnahar-temple-ozar': require('../../assets/images/sacred/Vighnahar.webp'),
  'ashtavinayak-mahaganapati-temple-ranjangaon': require('../../assets/images/sacred/Mahaganapati.webp'),

  // Panchbhoota Shrines
  'panchbhoota-ekambareswarar-temple-kanchipuram': require('../../assets/images/sacred/Ekambareshwar.webp'),
  'panchbhoota-jambukeswarar-temple-thiruvanaikaval': require('../../assets/images/sacred/jambukeswarar.webp'),
  'panchbhoota-arunachaleswarar-temple-thiruvannamalai': require('../../assets/images/sacred/Arunachaleswarar.webp'),
  'panchbhoota-thillai-nataraja-temple-chidambaram': require('../../assets/images/sacred/ThillaiNataraja.webp'),

  // Additional Sacred Temples in Sacred Folder
  'vishnu-bankey-bihari-temple-vrindavan': require('../../assets/images/sacred/Bankebihari_temple.webp'),
  'other-brahma-temple-pushkar': require('../../assets/images/sacred/Brahma_Temple.webp'),
  'other-brihadisvara-temple-thanjavur': require('../../assets/images/sacred/Brihadisvara.webp'),
  'other-dakshineswar-kali-temple-kolkata': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.webp'),
  'other-dwarkadhish-temple-mathura': require('../../assets/images/sacred/DwarkadhishMathura.webp'),
  'other-govind-dev-ji-temple-jaipur': require('../../assets/images/sacred/GovindDev.webp'),
  'other-guruvayur-temple-kerala': require('../../assets/images/sacred/Guruvayur.webp'),
  'other-jakhu-temple-shimla': require('../../assets/images/sacred/Jakhu.webp'),
  'other-kalaram-temple-nashik': require('../../assets/images/sacred/Kalaram.webp'),
  'other-kashtabhanjan-dev-hanumanji-sarangpur': require('../../assets/images/sacred/Kashtabhanjan.webp'),
  'other-khatu-shyam-ji-temple-sikar': require('../../assets/images/sacred/KhatuShyam.webp'),
  'other-lingaraj-temple-bhubaneswar': require('../../assets/images/sacred/Lingaraj.webp'),
  'other-murudeshwar-temple-karnataka': require('../../assets/images/sacred/Murudeshwara.webp'),
  'other-neelkanth-mahadev-temple-rishikesh': require('../../assets/images/sacred/NeelKanth.webp'),
  'other-pashupatinath-temple-mandsaur': require('../../assets/images/sacred/Pashupatinath.webp'),
  'other-prem-mandir-vrindavan': require('../../assets/images/sacred/Premmandir.webp'),
  'other-salasar-balaji-temple-churu': require('../../assets/images/sacred/SalasarBalaji.webp'),
  'other-sankat-mochan-hanuman-temple-varanasi': require('../../assets/images/sacred/Sankatmochan.webp'),
  'other-shrinathji-temple-nathdwara': require('../../assets/images/sacred/Shreenathjitemple.webp'),
  'other-shree-ram-janmabhoomi-mandir-ayodhya': require('../../assets/images/sacred/Shri_Ram_Janambhoomi_Mandir.webp'),
  'other-padmanabhaswamy-temple-thiruvananthapuram': require('../../assets/images/sacred/Sree_Padmanabhaswamy.webp'),
  'other-sri-ranganathaswamy-temple-srirangam': require('../../assets/images/sacred/SriRanganathaswamy.webp'),
  'other-sun-temple-modhera': require('../../assets/images/sacred/SunTemple.webp'),
  'other-triyuginarayan-temple-rudraprayag': require('../../assets/images/sacred/Triyuginarayan.webp'),
  'other-tungnath-temple-chopta': require('../../assets/images/sacred/Tungnath.webp'),
  'other-udupi-sri-krishna-matha': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.webp'),
  'other-vithoba-temple-pandharpur': require('../../assets/images/sacred/Vithoba.webp'),
  'other-hanuman-garhi-temple-ayodhya': require('../../assets/images/sacred/hanumangarhi.webp'),
  'other-iskcon-temple-vrindavan': require('../../assets/images/sacred/iskconVrindavan.webp'),
  'other-karni-mata-temple-deshnoke': require('../../assets/images/sacred/karnimata.webp'),
  'other-shri-krishna-janmasthan-mathura': require('../../assets/images/sacred/krishnajanmasthan.webp'),
  'other-sabarimala-sree-dharma-sastha-temple': require('../../assets/images/sacred/sabarimala.webp'),

  // Comprehensive Sacred Folder Assets & DB Temple Mappings
  'sacred-adikumbeswarar': require('../../assets/images/sacred/AdiKumbeswarar.webp'),
  'sacred-agniswarar': require('../../assets/images/sacred/Agniswarar.webp'),
  'sacred-ahobilamnavanarasimha': require('../../assets/images/sacred/AhobilamNavanarasimha.webp'),
  'sacred-amareswaraswamy': require('../../assets/images/sacred/AmareswaraSwamy.webp'),
  'sacred-amarnath': require('../../assets/images/sacred/Amarnath.webp'),
  'sacred-ambalappuzha-sri-krishna-temple': require('../../assets/images/sacred/Ambalappuzha_Sri_Krishna_Temple.webp'),
  'sacred-anantavasudeva': require('../../assets/images/sacred/AnantaVasudeva.webp'),
  'sacred-annapoorneshwari': require('../../assets/images/sacred/Annapoorneshwari.webp'),
  'sacred-apatsahayesvarar': require('../../assets/images/sacred/Apatsahayesvarar.webp'),
  'sacred-aranmula-parthasarathy': require('../../assets/images/sacred/Aranmula_Parthasarathy.webp'),
  'sacred-arunachaleswarar': require('../../assets/images/sacred/Arunachaleswarar.webp'),
  'sacred-assi-ghat': require('../../assets/images/sacred/Assi_Ghat.webp'),
  'sacred-attukal': require('../../assets/images/sacred/Attukal.webp'),
  'sacred-babulnath': require('../../assets/images/sacred/Babulnath.webp'),
  'sacred-badehanumanmandir': require('../../assets/images/sacred/BadeHanumanMandir.webp'),
  'sacred-baijnath': require('../../assets/images/sacred/Baijnath.webp'),
  'sacred-bankebihari-temple': require('../../assets/images/sacred/Bankebihari_temple.webp'),
  'sacred-bhadrachalam-temple': require('../../assets/images/sacred/Bhadrachalam_temple.webp'),
  'sacred-bhalkatirthshrine': require('../../assets/images/sacred/BhalkaTirthShrine.webp'),
  'sacred-bhartrihari': require('../../assets/images/sacred/Bhartrihari.webp'),
  'sacred-bhojeshwar': require('../../assets/images/sacred/Bhojeshwar.webp'),
  'sacred-bijlimahadev': require('../../assets/images/sacred/BijliMahadev.webp'),
  'sacred-birla-temple': require('../../assets/images/sacred/Birla-Temple.webp'),
  'sacred-brahma-temple': require('../../assets/images/sacred/Brahma_Temple.webp'),
  'sacred-brihadisvara': require('../../assets/images/sacred/Brihadisvara.webp'),
  'sacred-chamundi': require('../../assets/images/sacred/Chamundi.webp'),
  'sacred-chennakesava': require('../../assets/images/sacred/Chennakesava.webp'),
  'sacred-chottanikkara': require('../../assets/images/sacred/Chottanikkara.webp'),
  'sacred-dakshineswar-kali-temple': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.webp'),
  'sacred-daulatabad': require('../../assets/images/sacred/Daulatabad.webp'),
  'sacred-dharbaranyeswarar': require('../../assets/images/sacred/Dharbaranyeswarar.webp'),
  'sacred-dharidevi': require('../../assets/images/sacred/DhariDevi.webp'),
  'sacred-draksharama-temple': require('../../assets/images/sacred/Draksharama_temple.webp'),
  'sacred-dwarkadhishmathura': require('../../assets/images/sacred/DwarkadhishMathura.webp'),
  'sacred-ekambareshwar': require('../../assets/images/sacred/Ekambareshwar.webp'),
  'sacred-ellorakailasa': require('../../assets/images/sacred/ElloraKailasa.webp'),
  'sacred-gautamrishiashram': require('../../assets/images/sacred/GautamRishiAshram.webp'),
  'sacred-girijatmaj': require('../../assets/images/sacred/Girijatmaj.webp'),
  'sacred-gnanasaraswathi': require('../../assets/images/sacred/GnanaSaraswathi.webp'),
  'sacred-gommateshwara': require('../../assets/images/sacred/Gommateshwara.webp'),
  'sacred-gopnathmahadev': require('../../assets/images/sacred/GopnathMahadev.webp'),
  'sacred-gorakhnath': require('../../assets/images/sacred/Gorakhnath.webp'),
  'sacred-govinddev': require('../../assets/images/sacred/GovindDev.webp'),
  'sacred-guruvayur': require('../../assets/images/sacred/Guruvayur.webp'),
  'sacred-gyanvapi': require('../../assets/images/sacred/Gyanvapi.webp'),
  'sacred-hidimbadevi': require('../../assets/images/sacred/HidimbaDevi.webp'),
  'sacred-hidimba-devi': require('../../assets/images/sacred/Hidimba_Devi.webp'),
  'sacred-jakhu': require('../../assets/images/sacred/Jakhu.webp'),
  'sacred-janardhanaswamy': require('../../assets/images/sacred/JanardhanaSwamy.webp'),
  'sacred-kainchidham': require('../../assets/images/sacred/KainchiDham.webp'),
  'sacred-kalaram': require('../../assets/images/sacred/Kalaram.webp'),
  'sacred-kalikamata': require('../../assets/images/sacred/KalikaMata.webp'),
  'sacred-kanakadurga': require('../../assets/images/sacred/KanakaDurga.webp'),
  'sacred-kanchipuram-kamakshi': require('../../assets/images/sacred/Kanchipuram_Kamakshi.webp'),
  'sacred-kasardevi': require('../../assets/images/sacred/KasarDevi.webp'),
  'sacred-kashtabhanjan': require('../../assets/images/sacred/Kashtabhanjan.webp'),
  'sacred-kateeldurgaparameshwari': require('../../assets/images/sacred/KateelDurgaparameshwari.webp'),
  'sacred-khatushyam': require('../../assets/images/sacred/KhatuShyam.webp'),
  'sacred-kondagattuanjaneyaswamy': require('../../assets/images/sacred/KondagattuAnjaneyaSwamy.webp'),
  'sacred-kotilingeshwara': require('../../assets/images/sacred/Kotilingeshwara.webp'),
  'sacred-ksheeraramalingeswara': require('../../assets/images/sacred/KsheeraRamalingeswara.webp'),
  'sacred-kumararama-bhimesvara': require('../../assets/images/sacred/Kumararama_Bhimesvara.webp'),
  'sacred-lingaraj': require('../../assets/images/sacred/Lingaraj.webp'),
  'sacred-maa-mundeshwari-devi': require('../../assets/images/sacred/Maa_Mundeshwari_Devi.webp'),
  'sacred-mahabaleshwar': require('../../assets/images/sacred/Mahabaleshwar.webp'),
  'sacred-mahaganapati': require('../../assets/images/sacred/Mahaganapati.webp'),
  'sacred-mahavirmandir': require('../../assets/images/sacred/MahavirMandir.webp'),
  'sacred-manikarnika-ghat': require('../../assets/images/sacred/Manikarnika_Ghat.webp'),
  'sacred-mansadevi': require('../../assets/images/sacred/MansaDevi.webp'),
  'sacred-murudeshwara': require('../../assets/images/sacred/Murudeshwara.webp'),
  'sacred-naganathaswamy': require('../../assets/images/sacred/Naganathaswamy.webp'),
  'sacred-nagaraja': require('../../assets/images/sacred/Nagaraja.webp'),
  'sacred-naulakha': require('../../assets/images/sacred/Naulakha.webp'),
  'sacred-neelkanth': require('../../assets/images/sacred/NeelKanth.webp'),
  'sacred-palanimurugan': require('../../assets/images/sacred/PalaniMurugan.webp'),
  'sacred-pashupatinath': require('../../assets/images/sacred/Pashupatinath.webp'),
  'sacred-pazhamudircholai': require('../../assets/images/sacred/Pazhamudircholai.webp'),
  'sacred-pracheenhanuman': require('../../assets/images/sacred/PracheenHanuman.webp'),
  'sacred-premmandir': require('../../assets/images/sacred/Premmandir.webp'),
  'sacred-punaura-sitamarhi': require('../../assets/images/sacred/Punaura_Sitamarhi.webp'),
  'sacred-purnagiridevi': require('../../assets/images/sacred/PurnagiriDevi.webp'),
  'sacred-radhadamodar': require('../../assets/images/sacred/RadhaDamodar.webp'),
  'sacred-ramappa-temple': require('../../assets/images/sacred/Ramappa_Temple.webp'),
  'sacred-ramatheertham': require('../../assets/images/sacred/Ramatheertham.webp'),
  'sacred-ramnagar-fort': require('../../assets/images/sacred/Ramnagar_Fort.webp'),
  'sacred-ranakpur': require('../../assets/images/sacred/Ranakpur.webp'),
  'sacred-salasarbalaji': require('../../assets/images/sacred/SalasarBalaji.webp'),
  'sacred-sandipaniashram': require('../../assets/images/sacred/SandipaniAshram.webp'),
  'sacred-sankatmochan': require('../../assets/images/sacred/Sankatmochan.webp'),
  'sacred-sarangapani': require('../../assets/images/sacred/Sarangapani.webp'),
  'sacred-shivatrats': require('../../assets/images/sacred/ShivaTrats.webp'),
  'sacred-shreenathjitemple': require('../../assets/images/sacred/Shreenathjitemple.webp'),
  'sacred-shri-ram-janambhoomi-mandir': require('../../assets/images/sacred/Shri_Ram_Janambhoomi_Mandir.webp'),
  'sacred-siddhivinayak-temple': require('../../assets/images/sacred/Siddhivinayak-Temple.webp'),
  'sacred-someshwara': require('../../assets/images/sacred/Someshwara.webp'),
  'sacred-sonprayagsangam': require('../../assets/images/sacred/SonprayagSangam.webp'),
  'sacred-sree-padmanabhaswamy': require('../../assets/images/sacred/Sree_Padmanabhaswamy.webp'),
  'sacred-sree-vallaba': require('../../assets/images/sacred/Sree_Vallaba.webp'),
  'sacred-sriranganathaswamy': require('../../assets/images/sacred/SriRanganathaswamy.webp'),
  'sacred-srivilliputhurandal': require('../../assets/images/sacred/SrivilliputhurAndal.webp'),
  'sacred-suntemple': require('../../assets/images/sacred/SunTemple.webp'),
  'sacred-suryanarkovil': require('../../assets/images/sacred/SuryanarKovil.webp'),
  'sacred-swamimalaimurugan': require('../../assets/images/sacred/SwamimalaiMurugan.webp'),
  'sacred-swaminarayanakshardham': require('../../assets/images/sacred/SwaminarayanAkshardham.webp'),
  'sacred-tanotmata': require('../../assets/images/sacred/TanotMata.webp'),
  'sacred-tapovancaves': require('../../assets/images/sacred/Tapovancaves.webp'),
  'sacred-tarakeshwar': require('../../assets/images/sacred/Tarakeshwar.webp'),
  'sacred-templeofvedicplanetarium': require('../../assets/images/sacred/TempleofVedicPlanetarium.webp'),
  'sacred-thillainataraja': require('../../assets/images/sacred/ThillaiNataraja.webp'),
  'sacred-thirunageswaramnaganathar': require('../../assets/images/sacred/ThirunageswaramNaganathar.webp'),
  'sacred-thiruparankundrammurugan': require('../../assets/images/sacred/ThiruparankundramMurugan.webp'),
  'sacred-thiruttani-temple-rajagopuram': require('../../assets/images/sacred/Thiruttani_Temple_Rajagopuram.webp'),
  'sacred-thousandpillar': require('../../assets/images/sacred/ThousandPillar.webp'),
  'sacred-tiruchendurmurugan': require('../../assets/images/sacred/TiruchendurMurugan.webp'),
  'sacred-trilokinath': require('../../assets/images/sacred/Trilokinath.webp'),
  'sacred-trinetreshwar': require('../../assets/images/sacred/Trinetreshwar.webp'),
  'sacred-triprayarsree': require('../../assets/images/sacred/TriprayarSree.webp'),
  'sacred-triveni-ghat': require('../../assets/images/sacred/Triveni-Ghat.webp'),
  'sacred-triyuginarayan': require('../../assets/images/sacred/Triyuginarayan.webp'),
  'sacred-tungnath': require('../../assets/images/sacred/Tungnath.webp'),
  'sacred-udupi-sri-krishna-matha-temple': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.webp'),
  'sacred-uppiliappan': require('../../assets/images/sacred/Uppiliappan.webp'),
  'sacred-vadakkunnathan': require('../../assets/images/sacred/Vadakkunnathan.webp'),
  'sacred-varadvinayak': require('../../assets/images/sacred/VaradVinayak.webp'),
  'sacred-varadharajaperumal': require('../../assets/images/sacred/VaradharajaPerumal.webp'),
  'sacred-varahalakshminarasimha': require('../../assets/images/sacred/VarahaLakshmiNarasimha.webp'),
  'sacred-vashishttemple': require('../../assets/images/sacred/VashishtTemple.webp'),
  'sacred-veerabhadra': require('../../assets/images/sacred/Veerabhadra.webp'),
  'sacred-venugopalaswamy': require('../../assets/images/sacred/VenugopalaSwamy.webp'),
  'sacred-vighnahar': require('../../assets/images/sacred/Vighnahar.webp'),
  'sacred-vishnupad': require('../../assets/images/sacred/Vishnupad.webp'),
  'sacred-vithoba': require('../../assets/images/sacred/Vithoba.webp'),
  'sacred-yadadrisrilakshminarasimha': require('../../assets/images/sacred/YadadriSriLakshmiNarasimha.webp'),
  'sacred-baan': require('../../assets/images/sacred/baan.webp'),
  'sacred-ballaleshwar': require('../../assets/images/sacred/ballaleshwar.webp'),
  'sacred-bhairavnath': require('../../assets/images/sacred/bhairavnath.webp'),
  'sacred-chandi-devi': require('../../assets/images/sacred/chandi-devi.webp'),
  'sacred-chintamani': require('../../assets/images/sacred/chintamani.webp'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/sacred/dashashwamedh-ghat.webp'),
  'sacred-dilwara': require('../../assets/images/sacred/dilwara.webp'),
  'sacred-gandhisarvor': require('../../assets/images/sacred/gandhisarvor.webp'),
  'sacred-gitamandir': require('../../assets/images/sacred/gitamandir.webp'),
  'sacred-hanumangarhi': require('../../assets/images/sacred/hanumangarhi.webp'),
  'sacred-iskconvrindavan': require('../../assets/images/sacred/iskconVrindavan.webp'),
  'sacred-jageshwar': require('../../assets/images/sacred/jageshwar.webp'),
  'sacred-jambukeswarar': require('../../assets/images/sacred/jambukeswarar.webp'),
  'sacred-kailashnathwar': require('../../assets/images/sacred/kailashnathwar.webp'),
  'sacred-kapaleeshwarar': require('../../assets/images/sacred/kapaleeshwarar.webp'),
  'sacred-karnimata': require('../../assets/images/sacred/karnimata.webp'),
  'sacred-krishnajanmasthan': require('../../assets/images/sacred/krishnajanmasthan.webp'),
  'sacred-mayureshwar': require('../../assets/images/sacred/mayureshwar.webp'),
  'sacred-mumba-devi': require('../../assets/images/sacred/mumba-devi.webp'),
  'sacred-ramghat': require('../../assets/images/sacred/ramghat.webp'),
  'sacred-sabarimala': require('../../assets/images/sacred/sabarimala.webp'),
  'sacred-sammed-shikharji': require('../../assets/images/sacred/sammed-shikharji.webp'),
  'sacred-shivganga': require('../../assets/images/sacred/shivganga.webp'),
  'sacred-shri-radha-raman': require('../../assets/images/sacred/shri-radha-raman.webp'),
  'sacred-tapkeshwar': require('../../assets/images/sacred/tapkeshwar.webp'),
  'sacred-trikuta': require('../../assets/images/sacred/trikuta.webp'),
  'sacred-trinetra-ganesh-temple': require('../../assets/images/sacred/trinetra-ganesh-temple.webp'),
  'sacred-tulsi-manas': require('../../assets/images/sacred/tulsi-manas.webp'),
  'sacred-vasukital': require('../../assets/images/sacred/vasukital.webp'),
  'dwarkadhishtempledwarka': require('../../assets/images/sacred/DwarkadhishMathura.webp'),
  'ekambareswarartemplekanchipuram': require('../../assets/images/sacred/Ekambareshwar.webp'),
  'jambukeswarartemplethiruvanaikaval': require('../../assets/images/sacred/jambukeswarar.webp'),
  'arunachaleswarartemplethiruvannamalai': require('../../assets/images/sacred/Arunachaleswarar.webp'),
  'thillainatarajatemplechidambaram': require('../../assets/images/sacred/ThillaiNataraja.webp'),
  'mayureshwartemplemorgaon': require('../../assets/images/sacred/mayureshwar.webp'),
  'siddhivinayaktemplesiddhatek': require('../../assets/images/sacred/Siddhivinayak-Temple.webp'),
  'ballaleshwartemplepali': require('../../assets/images/sacred/ballaleshwar.webp'),
  'varadhavinayaktemplemahad': require('../../assets/images/sacred/VaradharajaPerumal.webp'),
  'chintamanitempletheur': require('../../assets/images/sacred/chintamani.webp'),
  'girijatmaktemplelenyadri': require('../../assets/images/sacred/Girijatmaj.webp'),
  'vighnahartempleozar': require('../../assets/images/sacred/Vighnahar.webp'),
  'mahaganapatitempleranjangaon': require('../../assets/images/sacred/Mahaganapati.webp'),
  'chamundeshwaritemplemysore': require('../../assets/images/sacred/Chamundi.webp'),
  'sriranganathaswamytemplesrirangam': require('../../assets/images/sacred/SriRanganathaswamy.webp'),
  'guruvayurtemplekerala': require('../../assets/images/sacred/Guruvayur.webp'),
  'iskcontemplevrindavan': require('../../assets/images/sacred/iskconVrindavan.webp'),
  'premmandirvrindavan': require('../../assets/images/sacred/Premmandir.webp'),
  'iskconmiraroadthane': require('../../assets/images/sacred/iskconVrindavan.webp'),
  'iskcontemplemumbaijuhu': require('../../assets/images/sacred/iskconVrindavan.webp'),
  'iskcontemplebengalurukarnataka': require('../../assets/images/sacred/iskconVrindavan.webp'),
  'lingarajtemplebhubaneswar': require('../../assets/images/sacred/Lingaraj.webp'),
  'brihadisvaratemplethanjavur': require('../../assets/images/sacred/Brihadisvara.webp'),
  'amarnathtemplejammukashmir': require('../../assets/images/sacred/Amarnath.webp'),
  'tungnathtemplechopta': require('../../assets/images/sacred/Tungnath.webp'),
  'pashupatinathtemplemandsaur': require('../../assets/images/sacred/Pashupatinath.webp'),
  'bhojeshwartemplebhojpur': require('../../assets/images/sacred/Bhojeshwar.webp'),
  'murudeshwartemplekarnataka': require('../../assets/images/sacred/Murudeshwara.webp'),
  'mumbadevitemplemumbai': require('../../assets/images/sacred/mumba-devi.webp'),
  'mansadevitempleharidwar': require('../../assets/images/sacred/MansaDevi.webp'),
  'chandidevitempleharidwar': require('../../assets/images/sacred/chandi-devi.webp'),
  'sankatmochanhanumantemplevaranasi': require('../../assets/images/sacred/Sankatmochan.webp'),
  'salasarbalajitemplechuru': require('../../assets/images/sacred/SalasarBalaji.webp'),
  'hanumangarhitempleayodhya': require('../../assets/images/sacred/hanumangarhi.webp'),
  'jakhutempleshimla': require('../../assets/images/sacred/Jakhu.webp'),
  'siddhivinayaktemplemumbai': require('../../assets/images/sacred/Siddhivinayak-Temple.webp'),
  'swaminarayanakshardhamdelhi': require('../../assets/images/sacred/SwaminarayanAkshardham.webp'),
  'chamundadevitemplekangra': require('../../assets/images/sacred/Chamundi.webp'),
  'dwarkadhishtemplemathura': require('../../assets/images/sacred/DwarkadhishMathura.webp'),
  'shrikrishnajanmasthanmathura': require('../../assets/images/sacred/krishnajanmasthan.webp'),
  'radhadamodartemplevrindavan': require('../../assets/images/sacred/RadhaDamodar.webp'),
  'govinddevjitemplejaipur': require('../../assets/images/sacred/GovindDev.webp'),
  'kalaramtemplenashik': require('../../assets/images/sacred/Kalaram.webp'),
  'vithobatemplepandharpur': require('../../assets/images/sacred/Vithoba.webp'),
  'venugopalaswamytemplekrsmysore': require('../../assets/images/sacred/VenugopalaSwamy.webp'),
  'chennakesavatemplebelur': require('../../assets/images/sacred/Chennakesava.webp'),
  'varahalakshminarasimhatemplesimhachalam': require('../../assets/images/sacred/VarahaLakshmiNarasimha.webp'),
  'ahobilamnavanarasimhatemple': require('../../assets/images/sacred/AhobilamNavanarasimha.webp'),
  'anantavasudevatemplebhubaneswar': require('../../assets/images/sacred/AnantaVasudeva.webp'),
  'pashupatinathshrineindonepalborder': require('../../assets/images/sacred/Pashupatinath.webp'),
  'tarakeshwartemplehooghly': require('../../assets/images/sacred/Tarakeshwar.webp'),
  'kapaleeshwarartemplemylapore': require('../../assets/images/sacred/kapaleeshwarar.webp'),
  'vadakkunnathantemplethrissur': require('../../assets/images/sacred/Vadakkunnathan.webp'),
  'bhairavnathshivashrinerajrappa': require('../../assets/images/sacred/bhairavnath.webp'),
  'kotilingeshwaratemplekolar': require('../../assets/images/sacred/Kotilingeshwara.webp'),
  'dakshineswarkalitemplekolkata': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.webp'),
  'kanakadurgatemplevijayawada': require('../../assets/images/sacred/KanakaDurga.webp'),
  'attukalbhagavathytemplethiruvananthapuram': require('../../assets/images/sacred/Attukal.webp'),
  'chottanikkarabhagavathytemplekochi': require('../../assets/images/sacred/Chottanikkara.webp'),
  'kateeldurgaparameshwaritemplemangalore': require('../../assets/images/sacred/KateelDurgaparameshwari.webp'),
  'annapoorneshwaritemplehoranadu': require('../../assets/images/sacred/Annapoorneshwari.webp'),
  'shreekashtabhanjandevhanumanjisarangpur': require('../../assets/images/sacred/Kashtabhanjan.webp'),
  'pracheenhanumanmandirdelhi': require('../../assets/images/sacred/PracheenHanuman.webp'),
  'girgaonbabulnathhanumanmandirmumbai': require('../../assets/images/sacred/Babulnath.webp'),
  'sankatmochantempleshimla': require('../../assets/images/sacred/Sankatmochan.webp'),
  'kainchidhamashramnainital': require('../../assets/images/sacred/KainchiDham.webp'),
  'badehanumanmandirlyinghanumanprayagraj': require('../../assets/images/sacred/BadeHanumanMandir.webp'),
  'sabarimalasreedharmasasthatemple': require('../../assets/images/sacred/sabarimala.webp'),
  'palanimurugantempledindigul': require('../../assets/images/sacred/PalaniMurugan.webp'),
  'swamimalaimurugantemplethanjavur': require('../../assets/images/sacred/SwamimalaiMurugan.webp'),
  'thiruparankundrammurugantemplemadurai': require('../../assets/images/sacred/ThiruparankundramMurugan.webp'),
  'pazhamudircholaimurugantemplemadurai': require('../../assets/images/sacred/Pazhamudircholai.webp'),
  'tiruchendurmurugantemplethoothukudi': require('../../assets/images/sacred/TiruchendurMurugan.webp'),
  'gommateshwarastatueshravanabelagola': require('../../assets/images/sacred/Gommateshwara.webp'),
  'templeofvedicplanetariumtovpmayapur': require('../../assets/images/sacred/TempleofVedicPlanetarium.webp'),
  'sammedshikharjigiridih': require('../../assets/images/sacred/sammed-shikharji.webp'),
  'dilwaratemplesmountabu': require('../../assets/images/sacred/dilwara.webp'),
  'ranakpurjaintemplepali': require('../../assets/images/sacred/Ranakpur.webp'),
  'karnimatatemplerattempledeshnoke': require('../../assets/images/sacred/karnimata.webp'),
  'tanotmatatemplejaisalmer': require('../../assets/images/sacred/TanotMata.webp'),
  'brahmatemplepushkar': require('../../assets/images/sacred/Brahma_Temple.webp'),
  'khatushyamjitemplesikar': require('../../assets/images/sacred/KhatuShyam.webp'),
  'trinetraganeshtempleranthambore': require('../../assets/images/sacred/Trinetreshwar.webp'),
  'chamundihillsanctuarymysuru': require('../../assets/images/sacred/Chamundi.webp'),
  'udupisrikrishnamathaudupi': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.webp'),
  'murudeshwarcoastalsanctuary': require('../../assets/images/sacred/Murudeshwara.webp'),
  'mahabaleshwartemplegokarna': require('../../assets/images/sacred/Mahabaleshwar.webp'),
  'triprayarsreeramatemplethrissur': require('../../assets/images/sacred/TriprayarSree.webp'),
  'sreevallabhatemplethiruvalla': require('../../assets/images/sacred/Sree_Vallaba.webp'),
  'ambalappuzhasrikrishnatemplealappuzha': require('../../assets/images/sacred/Ambalappuzha_Sri_Krishna_Temple.webp'),
  'aranmulaparthasarathytemplepathanamthitta': require('../../assets/images/sacred/Aranmula_Parthasarathy.webp'),
  'janardhanaswamytemplevarkala': require('../../assets/images/sacred/JanardhanaSwamy.webp'),
  'nagarajatemplenagercoil': require('../../assets/images/sacred/Nagaraja.webp'),
  'srivilliputhurandaltemplevirudhunagar': require('../../assets/images/sacred/SrivilliputhurAndal.webp'),
  'uppiliappantemplekumbakonam': require('../../assets/images/sacred/Uppiliappan.webp'),
  'sarangapanitemplekumbakonam': require('../../assets/images/sacred/Sarangapani.webp'),
  'adikumbeswarartemplekumbakonam': require('../../assets/images/sacred/AdiKumbeswarar.webp'),
  'varadharajaperumaltemplekanchipuram': require('../../assets/images/sacred/VaradharajaPerumal.webp'),
  'thirunageswaramnaganathartemple': require('../../assets/images/sacred/ThirunageswaramNaganathar.webp'),
  'apatsahayesvarartemplealangudi': require('../../assets/images/sacred/Apatsahayesvarar.webp'),
  'kailasanathartemplethingalur': require('../../assets/images/sacred/kailashnathwar.webp'),
  'agniswarartemplekanchanur': require('../../assets/images/sacred/Agniswarar.webp'),
  'dharbaranyeswarartemplethirunallar': require('../../assets/images/sacred/Dharbaranyeswarar.webp'),
  'naganathaswamytemplekeelaperumpallam': require('../../assets/images/sacred/Naganathaswamy.webp'),
  'suryanarkovilkumbakonam': require('../../assets/images/sacred/SuryanarKovil.webp'),
  'ramatheerthamtemplevizianagaram': require('../../assets/images/sacred/Ramatheertham.webp'),
  'draksharamambheemeswaratemplekakinada': require('../../assets/images/sacred/Draksharama_temple.webp'),
  'amareswaraswamytempleamaravati': require('../../assets/images/sacred/AmareswaraSwamy.webp'),
  'someshwaraswamytemplebhimavaram': require('../../assets/images/sacred/Someshwara.webp'),
  'ksheeraramalingeswaratemplepalakollu': require('../../assets/images/sacred/KsheeraRamalingeswara.webp'),
  'kumarabhimeswaraswamytemplesamalkota': require('../../assets/images/sacred/Kumararama_Bhimesvara.webp'),
  'yadadrisrilakshminarasimhatemple': require('../../assets/images/sacred/YadadriSriLakshmiNarasimha.webp'),
  'thousandpillartemplewarangal': require('../../assets/images/sacred/ThousandPillar.webp'),
  'ramappatemplemulugu': require('../../assets/images/sacred/Ramappa_Temple.webp'),
  'gnanasaraswathitemplebasar': require('../../assets/images/sacred/GnanaSaraswathi.webp'),
  'kondagattuanjaneyaswamytemplejagtial': require('../../assets/images/sacred/KondagattuAnjaneyaSwamy.webp'),
  'veerabhadratemplelepakshi': require('../../assets/images/sacred/Veerabhadra.webp'),
  'vishnupadtemplegaya': require('../../assets/images/sacred/Vishnupad.webp'),
  'mahavirmandirpatna': require('../../assets/images/sacred/MahavirMandir.webp'),
  'punauradhamjanakitemplesitamarhi': require('../../assets/images/sacred/Punaura_Sitamarhi.webp'),
  'gorakhnathtemplegorakhpur': require('../../assets/images/sacred/Gorakhnath.webp'),
  'tulsimanasmandirvaranasi': require('../../assets/images/sacred/tulsi-manas.webp'),
  'ramnagarforttemplevaranasi': require('../../assets/images/sacred/Ramnagar_Fort.webp'),
  'triyuginarayantemplerudraprayag': require('../../assets/images/sacred/Triyuginarayan.webp'),
  'dharidevitemplesrinagargarhwal': require('../../assets/images/sacred/DhariDevi.webp'),
  'neelkanthmahadevtemplerishikesh': require('../../assets/images/sacred/NeelKanth.webp'),
  'tapkeshwarmahadevtempledehradun': require('../../assets/images/sacred/tapkeshwar.webp'),
  'kasardevitemplealmora': require('../../assets/images/sacred/KasarDevi.webp'),
  'jageshwardhamtemplecomplexalmora': require('../../assets/images/sacred/jageshwar.webp'),
  'baijnathtemplecomplexbageshwar': require('../../assets/images/sacred/Baijnath.webp'),
  'purnagiridevitemplechampawat': require('../../assets/images/sacred/PurnagiriDevi.webp'),
  'hidimbadevitemplemanali': require('../../assets/images/sacred/HidimbaDevi.webp'),
  'bijlimahadevtemplekullu': require('../../assets/images/sacred/BijliMahadev.webp'),
  'vashishttemplehotspringsmanali': require('../../assets/images/sacred/VashishtTemple.webp'),
  'triloknathtemplelahaulvalley': require('../../assets/images/sacred/Trilokinath.webp'),
  'kalikamatatemplepavagadh': require('../../assets/images/sacred/KalikaMata.webp'),
  'bhalkatirthveraval': require('../../assets/images/sacred/BhalkaTirthShrine.webp'),
  'gopnathmahadevtemplebhavnagar': require('../../assets/images/sacred/GopnathMahadev.webp'),
  'trinetreshwarmahadevtempletarnetar': require('../../assets/images/sacred/Trinetreshwar.webp'),
  'suntemplemodhera': require('../../assets/images/sacred/SunTemple.webp'),
};

const DEFAULT_TEMPLE_IMAGE: ImageSourcePropType = require('../../assets/images/image temple/SomnathTemple.webp');

const TEMPLE_FALLBACK_POOL: ImageSourcePropType[] = [
  require('../../assets/images/image temple/SomnathTemple.webp'),
  require('../../assets/images/image temple/KedarnathTemple.webp'),
  require('../../assets/images/image temple/MahakalTemple.webp'),
  require('../../assets/images/image temple/Kashi_Vishwanath.webp'),
  require('../../assets/images/image temple/Siddhivinayak.webp'),
  require('../../assets/images/image temple/Tirumala_090615.webp'),
  require('../../assets/images/image temple/Jaganath.webp'),
  require('../../assets/images/image temple/GoldenTemple.webp'),
  require('../../assets/images/image temple/MeenakshiTemple.webp'),
  require('../../assets/images/dwarakadhish.webp'),
  require('../../assets/images/image temple/badrinath.webp'),
];

const normalizeTempleName = (name: string) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const getTempleIdFromName = (name: string, prefix: 'jyotirling' | 'other' = 'other') =>
  `${prefix}-${normalizeTempleName(name)}`;


const IMAGE_LOOKUP_CACHE = new Map<string, ImageSourcePropType>();

const getTempleImageById = (id: string) => {
  if (!id) return null;
  if (IMAGE_LOOKUP_CACHE.has(id)) return IMAGE_LOOKUP_CACHE.get(id) || null;

  let result: ImageSourcePropType | null = null;
  if (TEMPLE_IMAGES[id]) {
    result = TEMPLE_IMAGES[id];
  } else {
    const normId = normalizeTempleName(id);
    for (const key of Object.keys(TEMPLE_IMAGES)) {
      const normKey = normalizeTempleName(key);
      if (normKey === normId || (normId.length > 5 && normId.includes(normKey))) {
        result = TEMPLE_IMAGES[key];
        break;
      }
    }
  }

  if (result) {
    IMAGE_LOOKUP_CACHE.set(id, result);
  }
  return result;
};

const _rawGetTempleImageByName = (name: string) => {
  const lowerName = String(name || '').toLowerCase().trim();
  if (!lowerName) return DEFAULT_TEMPLE_IMAGE;

  if (TEMPLE_IMAGES[name]) return TEMPLE_IMAGES[name];
  const cleanNameKey = lowerName.replace(/[^a-z0-9]/g, "");
  if (cleanNameKey && TEMPLE_IMAGES[cleanNameKey]) return TEMPLE_IMAGES[cleanNameKey];

  if (cleanNameKey && cleanNameKey.length > 3) {
    for (const key of Object.keys(TEMPLE_IMAGES)) {
      const cleanKey = key.replace(/[^a-z0-9]/g, "");
      if (cleanKey && (cleanKey === cleanNameKey || (cleanKey.length > 5 && (cleanKey.includes(cleanNameKey) || cleanNameKey.includes(cleanKey))))) {
        return TEMPLE_IMAGES[key];
      }
    }
  }

  const byIdMatch = getTempleImageById(name);
  if (byIdMatch) return byIdMatch;

  // Direct Keyword Matching for precision across all seed temples
  if (lowerName.includes('somnath')) return TEMPLE_IMAGES['jyotirling-somnath-temple-gujarat'];
  if (lowerName.includes('kedarnath')) return TEMPLE_IMAGES['jyotirling-kedarnath-temple-uttarakhand'];
  if (lowerName.includes('mahakal')) return TEMPLE_IMAGES['jyotirling-mahakaleshwar-temple-ujjain'];
  if (lowerName.includes('vishwanath') || lowerName.includes('kashi')) return TEMPLE_IMAGES['jyotirling-kashi-vishwanath-temple-varanasi'];
  if (lowerName.includes('bhimashankar')) return TEMPLE_IMAGES['jyotirling-bhimashankar-temple-maharashtra'];
  if (lowerName.includes('ramanathaswamy') || lowerName.includes('rameswaram')) return TEMPLE_IMAGES['jyotirling-ramanathaswamy-temple-rameswaram'];
  if (lowerName.includes('grishneshwar') || lowerName.includes('ghrushneshwar')) return TEMPLE_IMAGES['jyotirling-grishneshwar-temple-ellora'];
  if (lowerName.includes('omkareshwar') || lowerName.includes('amkareshwar')) return TEMPLE_IMAGES['jyotirling-omkareshwar-temple-madhya-pradesh'];
  if (lowerName.includes('trimbak')) return TEMPLE_IMAGES['jyotirling-trimbakeshwar-temple-nashik'];
  if (lowerName.includes('dwarkadhish') || lowerName.includes('dwarakdhish') || lowerName.includes('dwarakadheesh')) {
    return TEMPLE_IMAGES['other-shri-dwarkadhish-temple-dwarka'];
  }
  if (lowerName.includes('nageshwar')) return TEMPLE_IMAGES['jyotirling-nageshwar-temple-dwarka'];
  if (lowerName.includes('mallikarjuna') || lowerName.includes('srisailam')) return TEMPLE_IMAGES['jyotirling-mallikarjuna-temple-srisailam'];
  if (lowerName.includes('baidyanath') || lowerName.includes('deoghar') || lowerName.includes('vaidyanath')) return TEMPLE_IMAGES['jyotirling-baidyanath-temple-deoghar'];

  // Ashtavinayak & Ganesha Keyword Matching
  if (lowerName.includes('mayureshwar') || lowerName.includes('moreshwar') || lowerName.includes('morgaon')) return TEMPLE_IMAGES['ashtavinayak-mayureshwar-temple-morgaon'];
  if (lowerName.includes('siddhatek')) return TEMPLE_IMAGES['ashtavinayak-siddhivinayak-temple-siddhatek'];
  if (lowerName.includes('ballaleshwar') || lowerName.includes('pali')) return TEMPLE_IMAGES['ashtavinayak-ballaleshwar-temple-pali'];
  if (lowerName.includes('varadhavinayak') || lowerName.includes('mahad')) return TEMPLE_IMAGES['ashtavinayak-varadhavinayak-temple-mahad'];
  if (lowerName.includes('chintamani')) return TEMPLE_IMAGES['ashtavinayak-chintamani-temple-theur'];
  if (lowerName.includes('girijatmak') || lowerName.includes('lenyadri') || lowerName.includes('girijatmaj')) return TEMPLE_IMAGES['ashtavinayak-girijatmak-temple-lenyadri'];
  if (lowerName.includes('vighnahar') || lowerName.includes('ozar')) return TEMPLE_IMAGES['ashtavinayak-vighnahar-temple-ozar'];
  if (lowerName.includes('mahaganapati') || lowerName.includes('ranjangaon')) return TEMPLE_IMAGES['ashtavinayak-mahaganapati-temple-ranjangaon'];
  if (lowerName.includes('ashtavinayak')) return TEMPLE_IMAGES['other-siddhivinayak-temple-mumbai'];

  // Panchbhoota Shrines Keyword Matching
  if (lowerName.includes('ekambareswarar') || lowerName.includes('ekambareshwar')) return TEMPLE_IMAGES['panchbhoota-ekambareswarar-temple-kanchipuram'];
  if (lowerName.includes('jambukeswarar')) return TEMPLE_IMAGES['panchbhoota-jambukeswarar-temple-thiruvanaikaval'];
  if (lowerName.includes('arunachaleswarar')) return TEMPLE_IMAGES['panchbhoota-arunachaleswarar-temple-thiruvannamalai'];
  if (lowerName.includes('thillai nataraja') || lowerName.includes('chidambaram')) return TEMPLE_IMAGES['panchbhoota-thillai-nataraja-temple-chidambaram'];

  // Additional Sacred Shrines Keyword Matching
  if (lowerName.includes('bankey bihari') || lowerName.includes('banke bihari')) return TEMPLE_IMAGES['vishnu-bankey-bihari-temple-vrindavan'];
  if (lowerName.includes('brahma temple') || lowerName.includes('pushkar')) return TEMPLE_IMAGES['other-brahma-temple-pushkar'];
  if (lowerName.includes('brihadisvara') || lowerName.includes('thanjavur')) return TEMPLE_IMAGES['other-brihadisvara-temple-thanjavur'];
  if (lowerName.includes('dakshineswar')) return TEMPLE_IMAGES['other-dakshineswar-kali-temple-kolkata'];
  if (lowerName.includes('dwarkadhish') && lowerName.includes('mathura')) return TEMPLE_IMAGES['other-dwarkadhish-temple-mathura'];
  if (lowerName.includes('govind dev')) return TEMPLE_IMAGES['other-govind-dev-ji-temple-jaipur'];
  if (lowerName.includes('guruvayur')) return TEMPLE_IMAGES['other-guruvayur-temple-kerala'];
  if (lowerName.includes('jakhu') || lowerName.includes('jakhhoo')) return TEMPLE_IMAGES['other-jakhu-temple-shimla'];
  if (lowerName.includes('kalaram')) return TEMPLE_IMAGES['other-kalaram-temple-nashik'];
  if (lowerName.includes('kashtabhanjan') || lowerName.includes('sarangpur')) return TEMPLE_IMAGES['other-kashtabhanjan-dev-hanumanji-sarangpur'];
  if (lowerName.includes('khatu shyam')) return TEMPLE_IMAGES['other-khatu-shyam-ji-temple-sikar'];
  if (lowerName.includes('lingaraj')) return TEMPLE_IMAGES['other-lingaraj-temple-bhubaneswar'];
  if (lowerName.includes('murudeshwar')) return TEMPLE_IMAGES['other-murudeshwar-temple-karnataka'];
  if (lowerName.includes('neelkanth') || lowerName.includes('neel kanth')) return TEMPLE_IMAGES['other-neelkanth-mahadev-temple-rishikesh'];
  if (lowerName.includes('pashupatinath')) return TEMPLE_IMAGES['other-pashupatinath-temple-mandsaur'];
  if (lowerName.includes('prem mandir')) return TEMPLE_IMAGES['other-prem-mandir-vrindavan'];
  if (lowerName.includes('salasar balaji') || lowerName.includes('salasar')) return TEMPLE_IMAGES['other-salasar-balaji-temple-churu'];
  if (lowerName.includes('sankat mochan') || lowerName.includes('sankatmochan')) return TEMPLE_IMAGES['other-sankat-mochan-hanuman-temple-varanasi'];
  if (lowerName.includes('shrinathji') || lowerName.includes('nathdwara')) return TEMPLE_IMAGES['other-shrinathji-temple-nathdwara'];
  if (lowerName.includes('ram janmabhoomi') || lowerName.includes('ram mandir')) return TEMPLE_IMAGES['other-shree-ram-janmabhoomi-mandir-ayodhya'];
  if (lowerName.includes('padmanabhaswamy')) return TEMPLE_IMAGES['other-padmanabhaswamy-temple-thiruvananthapuram'];
  if (lowerName.includes('ranganathaswamy') || lowerName.includes('srirangam')) return TEMPLE_IMAGES['other-sri-ranganathaswamy-temple-srirangam'];
  if (lowerName.includes('sun temple') || lowerName.includes('modhera')) return TEMPLE_IMAGES['other-sun-temple-modhera'];
  if (lowerName.includes('triyuginarayan')) return TEMPLE_IMAGES['other-triyuginarayan-temple-rudraprayag'];
  if (lowerName.includes('tungnath')) return TEMPLE_IMAGES['other-tungnath-temple-chopta'];
  if (lowerName.includes('udupi')) return TEMPLE_IMAGES['other-udupi-sri-krishna-matha'];
  if (lowerName.includes('vithoba') || lowerName.includes('pandharpur')) return TEMPLE_IMAGES['other-vithoba-temple-pandharpur'];
  if (lowerName.includes('hanuman garhi') || lowerName.includes('hanumangarhi')) return TEMPLE_IMAGES['other-hanuman-garhi-temple-ayodhya'];
  if (lowerName.includes('karni mata')) return TEMPLE_IMAGES['other-karni-mata-temple-deshnoke'];
  if (lowerName.includes('krishna janmasthan') || lowerName.includes('janmasthan')) return TEMPLE_IMAGES['other-shri-krishna-janmasthan-mathura'];
  if (lowerName.includes('sabarimala')) return TEMPLE_IMAGES['other-sabarimala-sree-dharma-sastha-temple'];

  if (lowerName.includes('tirupati') || lowerName.includes('balaji') || lowerName.includes('venkateswara') || lowerName.includes('tirumala')) {
    return TEMPLE_IMAGES['other-tirupati-balaji-temple-andhra-pradesh'];
  }
  if (lowerName.includes('vaishno')) {
    return TEMPLE_IMAGES['other-vaishno-devi-temple-jammu-kashmir'];
  }
  if (lowerName.includes('siddhivinayak')) {
    return TEMPLE_IMAGES['other-siddhivinayak-temple-mumbai'];
  }
  if (lowerName.includes('shirdi') || lowerName.includes('sai baba') || lowerName.includes('saibaba')) {
    return TEMPLE_IMAGES['other-shirdi-sai-baba-temple-maharashtra'];
  }
  if (lowerName.includes('jagannath') || lowerName.includes('puri')) {
    return TEMPLE_IMAGES['other-jagannath-temple-puri'];
  }
  if (lowerName.includes('golden temple') || lowerName.includes('harmandir') || lowerName.includes('amritsar')) {
    return TEMPLE_IMAGES['other-golden-temple-amritsar'];
  }
  if (lowerName.includes('meenakshi') || lowerName.includes('madurai')) {
    return TEMPLE_IMAGES['other-meenakshi-temple-madurai'];
  }
  if (lowerName.includes('iskcon') && (lowerName.includes('mira') || lowerName.includes('thane') || lowerName.includes('borivali'))) {
    return TEMPLE_IMAGES['other-iskcon-mira-road-thane'];
  }
  if (lowerName.includes('iskcon') && (lowerName.includes('bangalore') || lowerName.includes('bengaluru'))) {
    return TEMPLE_IMAGES['other-iskcon-temple-bangalore-karnataka'];
  }
  if (lowerName.includes('iskcon') && (lowerName.includes('juhu') || lowerName.includes('mumbai'))) {
    return TEMPLE_IMAGES['other-iskcon-temple-mumbai'];
  }
  if (lowerName.includes('mahalaxmi') || lowerName.includes('mahalakshmi')) {
    return TEMPLE_IMAGES['other-mahalaxmi-temple'];
  }

  // Shakti Peethas Keyword Matching
  if (lowerName.includes('bakreshwar') || lowerName.includes('bakreswar')) return TEMPLE_IMAGES['shaktipeeth-bakreshwar-temple-birbhum'];
  if (lowerName.includes('attahas') || lowerName.includes('fullara')) return TEMPLE_IMAGES['shaktipeeth-attahas-temple-birbhum'];
  if (lowerName.includes('kamakhya')) return TEMPLE_IMAGES['shaktipeeth-kamakhya-temple-guwahati'];
  if (lowerName.includes('kalighat')) return TEMPLE_IMAGES['shaktipeeth-kalighat-kali-temple-kolkata'];
  if (lowerName.includes('tarapith')) return TEMPLE_IMAGES['shaktipeeth-tarapith-temple-birbhum'];
  if (lowerName.includes('ambaji')) return TEMPLE_IMAGES['shaktipeeth-ambaji-temple-gujarat'];
  if (lowerName.includes('jwala')) return TEMPLE_IMAGES['shaktipeeth-jwala-ji-temple-kangra'];
  if (lowerName.includes('chinnamasta') || lowerName.includes('rajrappa')) return TEMPLE_IMAGES['shaktipeeth-chinnamasta-temple-rajarappa'];
  if (lowerName.includes('chamundeshwari') || lowerName.includes('chamundi')) return TEMPLE_IMAGES['shaktipeeth-chamundeshwari-temple-mysore'];
  if (lowerName.includes('vindhya') || lowerName.includes('vindhyavasini')) return TEMPLE_IMAGES['shaktipeeth-vindhyavasini-temple-vindhyachal'];
  if (lowerName.includes('kanyakumari')) return TEMPLE_IMAGES['shaktipeeth-kamakhya-kanya-kumari-temple'];
  if (lowerName.includes('sharada peeth') || lowerName.includes('sharda peeth')) return TEMPLE_IMAGES['shaktipeeth-sharda-peeth-kashmir'];
  if (lowerName.includes('hinglaj')) return TEMPLE_IMAGES['shaktipeeth-hinglaj-devi-rajasthan'];
  if (lowerName.includes('tripura sundari')) return TEMPLE_IMAGES['shaktipeeth-tripora-sundari-temple-tripura'];
  if (lowerName.includes('nalateswari') || lowerName.includes('nalhati')) return TEMPLE_IMAGES['shaktipeeth-nalateswari-temple-nalhati'];
  if (lowerName.includes('jogadya')) return TEMPLE_IMAGES['shaktipeeth-jogadya-temple-burdwan'];
  if (lowerName.includes('kankalitala')) return TEMPLE_IMAGES['shaktipeeth-kankalitala-temple-bolpur'];
  if (lowerName.includes('tulja') || lowerName.includes('tuljabhavani')) return TEMPLE_IMAGES['shaktipeeth-bhavani-mandir-tuljapur'];
  if (lowerName.includes('renuka')) return TEMPLE_IMAGES['shaktipeeth-renuka-devi-temple-mahur'];
  if (lowerName.includes('saptashrungi')) return TEMPLE_IMAGES['shaktipeeth-saptashrungi-temple-nashik'];
  if (lowerName.includes('danteshwari')) return TEMPLE_IMAGES['shaktipeeth-danteshwari-temple-dantewada'];
  if (lowerName.includes('chamunda devi')) return TEMPLE_IMAGES['shaktipeeth-chamunda-devi-temple-kangra'];
  if (lowerName.includes('naina devi')) return TEMPLE_IMAGES['shaktipeeth-naina-devi-temple-bilaspur'];
  if (lowerName.includes('brajeshwari') || lowerName.includes('brareshwari')) return TEMPLE_IMAGES['shaktipeeth-brareshwari-devi-temple-kangra'];
  if (lowerName.includes('chintpurni')) return TEMPLE_IMAGES['shaktipeeth-chintpurni-devi-temple-una'];
  if (lowerName.includes('alopi')) return TEMPLE_IMAGES['shaktipeeth-alopi-devi-temple-prayagraj'];
  if (lowerName.includes('devi patan')) return TEMPLE_IMAGES['shaktipeeth-devi-patan-temple-balrampur'];
  if (lowerName.includes('harsiddhi')) return TEMPLE_IMAGES['shaktipeeth-harsiddhi-mata-temple-ujjain'];
  if (lowerName.includes('maihar') || (lowerName.includes('sharada') && lowerName.includes('devi'))) return TEMPLE_IMAGES['shaktipeeth-sharada-devi-temple-maihar'];
  if (lowerName.includes('biraja')) return TEMPLE_IMAGES['shaktipeeth-biraja-temple-jajpur'];
  if (lowerName.includes('kalika mata') || lowerName.includes('pavagadh')) return TEMPLE_IMAGES['sacred-mahakali-temple-pavagadh'];

  // Healing Temples Keyword Matching
  if (lowerName.includes('ramanasramam') || lowerName.includes('ramana maharshi')) return TEMPLE_IMAGES['healing-ramanasramam-tiruvannamalai'];
  if (lowerName.includes('dhyanalinga')) return TEMPLE_IMAGES['healing-dhyanalinga-isha-coimbatore'];
  if (lowerName.includes('virupaksha')) return TEMPLE_IMAGES['healing-virupaksha-temple-hampi'];
  if (lowerName.includes('anandamayi')) return TEMPLE_IMAGES['healing-anandamayi-ma-ashram-haridwar'];
  if (lowerName.includes('mehendipur') || lowerName.includes('mehandipur')) return TEMPLE_IMAGES['hanuman-mehendipur-balaji-temple-dausa'];
  if (lowerName.includes('parmarth')) return TEMPLE_IMAGES['healing-parmarth-niketan-rishikesh'];
  if (lowerName.includes('aurobindo')) return TEMPLE_IMAGES['healing-sri-aurobindo-ashram-puducherry'];
  if (lowerName.includes('belur math')) return TEMPLE_IMAGES['sacred-belur-math-ramakrishna-mission'];
  if (lowerName.includes('sarnath')) return TEMPLE_IMAGES['healing-sarnath-buddhist-monastery'];
  if (lowerName.includes('mahabodhi') || lowerName.includes('bodh gaya')) return TEMPLE_IMAGES['sacred-mahabodhi-temple-bodh-gaya'];
  if (lowerName.includes('mookambika') || lowerName.includes('kollur')) return TEMPLE_IMAGES['devi-kollur-mookambika-temple'];
  if (lowerName.includes('chottanikara') || lowerName.includes('chottanikkara')) return TEMPLE_IMAGES['devi-chottanikara-temple-kochi'];
  if (lowerName.includes('vaitheeswaran')) return TEMPLE_IMAGES['sacred-vaitheeswaran-koil-mayiladuthurai'];
  if (lowerName.includes('vaijnath') || lowerName.includes('parli')) return TEMPLE_IMAGES['healing-parli-vaijnath-temple'];
  if (lowerName.includes('dhanvantari')) return TEMPLE_IMAGES['healing-dhanvantari-temple-kerala'];
  if (lowerName.includes('suchindram') || lowerName.includes('thanumalayan')) return TEMPLE_IMAGES['sacred-suchindram-thanumalayan-temple'];
  if (lowerName.includes('ghati subramanya')) return TEMPLE_IMAGES['healing-ghati-subramanya-temple'];
  if (lowerName.includes('srikalahast') || lowerName.includes('kalahasti')) return TEMPLE_IMAGES['panchbhoota-srikalahasteeswara-temple-srikalahasti'];
  if (lowerName.includes('kukke')) return TEMPLE_IMAGES['sacred-kukke-subramanya-temple'];
  if (lowerName.includes('mangaladevi')) return TEMPLE_IMAGES['healing-mangaladevi-temple-mangalore'];

  // Sacred Places Keyword Matching
  if (lowerName.includes('assi ghat')) return TEMPLE_IMAGES['sacred-assi-ghat'];
  if (lowerName.includes('bhalka')) return TEMPLE_IMAGES['sacred-bhalka-tirth-shrine'];
  if (lowerName.includes('bhartrihari')) return TEMPLE_IMAGES['sacred-bhartrihari-caves'];
  if (lowerName.includes('daulatabad')) return TEMPLE_IMAGES['sacred-daulatabad-fort'];
  if (lowerName.includes('ellora') || lowerName.includes('kailasa')) return TEMPLE_IMAGES['sacred-ellora-kailasa-temple'];
  if (lowerName.includes('gautam rishi')) return TEMPLE_IMAGES['sacred-gautam-rishi-ashram'];
  if (lowerName.includes('gyanvapi')) return TEMPLE_IMAGES['sacred-gyanvapi-kund'];
  if (lowerName.includes('manikarnika')) return TEMPLE_IMAGES['sacred-manikarnika-ghat'];
  if (lowerName.includes('naulakha')) return TEMPLE_IMAGES['sacred-naulakha-mandir'];
  if (lowerName.includes('sandipani')) return TEMPLE_IMAGES['sacred-sandipani-ashram'];
  if (lowerName.includes('shiva trats')) return TEMPLE_IMAGES['sacred-shiva-trats-kund'];
  if (lowerName.includes('sonprayag')) return TEMPLE_IMAGES['sacred-sonprayag-sangam'];
  if (lowerName.includes('tapovan')) return TEMPLE_IMAGES['sacred-tapovan-caves'];
  if (lowerName.includes('triveni')) return TEMPLE_IMAGES['sacred-triveni-sangam-ghat'];
  if (lowerName.includes('baan stambh') || (lowerName.includes('baan') && lowerName.includes('stambh'))) return TEMPLE_IMAGES['sacred-baan-stambh'];
  if (lowerName.includes('bhairavnath')) return TEMPLE_IMAGES['sacred-bhairavnath-mandir'];
  if (lowerName.includes('dashashwamedh')) return TEMPLE_IMAGES['sacred-dashashwamedh-ghat'];
  if (lowerName.includes('gandhi sarovar') || lowerName.includes('gandhisarovar')) return TEMPLE_IMAGES['sacred-gandhi-sarovar'];
  if (lowerName.includes('gita mandir') || lowerName.includes('geeta mandir')) return TEMPLE_IMAGES['sacred-gita-mandir'];
  if (lowerName.includes('ram ghat') || lowerName.includes('ramghat')) return TEMPLE_IMAGES['sacred-ram-ghat'];
  if (lowerName.includes('shivganga')) return TEMPLE_IMAGES['sacred-shivganga-kund'];
  if (lowerName.includes('trikuta') || lowerName.includes('trikut')) return TEMPLE_IMAGES['sacred-trikuta-parvat'];
  if (lowerName.includes('vasuki tal') || lowerName.includes('vasukital')) return TEMPLE_IMAGES['sacred-vasuki-tal'];

  const jyotirlingId = getTempleIdFromName(name, 'jyotirling');
  if (TEMPLE_IMAGES[jyotirlingId]) return TEMPLE_IMAGES[jyotirlingId];

  const otherId = getTempleIdFromName(name, 'other');
  if (TEMPLE_IMAGES[otherId]) return TEMPLE_IMAGES[otherId];

  const norm = normalizeTempleName(name);
  if (norm.length > 3) {
    for (const key of Object.keys(TEMPLE_IMAGES)) {
      if (key.includes(norm) || norm.includes(key.replace(/^(jyotirling|other|shaktipeeth|healing|sacred|ashtavinayak|panchbhoota|vishnu)-/, ''))) {
        return TEMPLE_IMAGES[key];
      }
    }
  }

  // Hash-based deterministic pool selection using dedicated TEMPLE images pool
  let hash = 0;
  for (let i = 0; i < lowerName.length; i++) {
    hash = (hash << 5) - hash + lowerName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TEMPLE_FALLBACK_POOL.length;
  return TEMPLE_FALLBACK_POOL[index] || DEFAULT_TEMPLE_IMAGE;
};

const getTempleImageByName = (name: string) => {
  const key = String(name || '').trim();
  if (!key) return DEFAULT_TEMPLE_IMAGE;
  if (IMAGE_LOOKUP_CACHE.has(key)) return IMAGE_LOOKUP_CACHE.get(key)!;
  const res = _rawGetTempleImageByName(key);
  IMAGE_LOOKUP_CACHE.set(key, res);
  return res;
};

export { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE, getTempleImageById, getTempleImageByName };