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
  'healing-anandamayi-ma-ashram-haridwar': require('../../assets/images/healingtemple/AnandamayiAshram.png'),
  'hanuman-mehendipur-balaji-temple-dausa': require('../../assets/images/healingtemple/Mehandipurbalaji.webp'),
  'healing-parmarth-niketan-rishikesh': require('../../assets/images/healingtemple/ParmarthNiketan.webp'),
  'healing-sri-aurobindo-ashram-puducherry': require('../../assets/images/healingtemple/SriAurobindo.webp'),
  'sacred-belur-math-ramakrishna-mission': require('../../assets/images/healingtemple/BelurMath.webp'),
  'healing-sarnath-buddhist-monastery': require('../../assets/images/healingtemple/sarnathvaranasi.webp'),
  'sacred-mahabodhi-temple-bodh-gaya': require('../../assets/images/healingtemple/mahabodhi.webp'),
  'devi-kollur-mookambika-temple': require('../../assets/images/healingtemple/kollurmookambika.avif'),
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
  'sacred-assi-ghat': require('../../assets/images/sacred/Assi_Ghat.jpg'),
  'sacred-bhalka-tirth-shrine': require('../../assets/images/sacred/BhalkaTirthShrine.jpg'),
  'sacred-bhartrihari-caves': require('../../assets/images/sacred/Bhartrihari.jpg'),
  'sacred-daulatabad-fort': require('../../assets/images/sacred/Daulatabad.jpg'),
  'sacred-ellora-kailasa-temple': require('../../assets/images/sacred/ElloraKailasa.jpg'),
  'sacred-gautam-rishi-ashram': require('../../assets/images/sacred/GautamRishiAshram.jpg'),
  'sacred-gyanvapi-kund': require('../../assets/images/sacred/Gyanvapi.jpg'),
  'sacred-manikarnika-ghat': require('../../assets/images/sacred/Manikarnika_Ghat.jpg'),
  'sacred-naulakha-mandir': require('../../assets/images/sacred/Naulakha.jpg'),
  'sacred-sandipani-ashram': require('../../assets/images/sacred/SandipaniAshram.avif'),
  'sacred-shiva-trats-kund': require('../../assets/images/sacred/ShivaTrats.jpg'),
  'sacred-sonprayag-sangam': require('../../assets/images/sacred/SonprayagSangam.jpg'),
  'sacred-tapovan-caves': require('../../assets/images/sacred/Tapovancaves.jpg'),
  'sacred-triveni-sangam-ghat': require('../../assets/images/sacred/Triveni-Ghat.webp'),
  'sacred-baan-stambh': require('../../assets/images/sacred/baan.jpg'),
  'sacred-bhairavnath-mandir': require('../../assets/images/sacred/bhairavnath.jpg'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/sacred/dashashwamedh-ghat.jpg'),
  'sacred-gandhi-sarovar': require('../../assets/images/sacred/gandhisarvor.avif'),
  'sacred-gita-mandir': require('../../assets/images/sacred/gitamandir.jpg'),
  'sacred-ram-ghat': require('../../assets/images/sacred/ramghat.jpg'),
  'sacred-shivganga-kund': require('../../assets/images/sacred/shivganga.jpg'),
  'sacred-trikuta-parvat': require('../../assets/images/sacred/trikuta.jpg'),
  'sacred-vasuki-tal': require('../../assets/images/sacred/vasukital.jpg'),

  // Ashtavinayak Shrines
  'ashtavinayak-mayureshwar-temple-morgaon': require('../../assets/images/sacred/mayureshwar.webp'),
  'ashtavinayak-siddhivinayak-temple-siddhatek': require('../../assets/images/sacred/Siddhivinayak-Temple.jpg'),
  'ashtavinayak-ballaleshwar-temple-pali': require('../../assets/images/sacred/ballaleshwar.jpg'),
  'ashtavinayak-varadhavinayak-temple-mahad': require('../../assets/images/sacred/VaradVinayak.jpg'),
  'ashtavinayak-chintamani-temple-theur': require('../../assets/images/sacred/chintamani.jpg'),
  'ashtavinayak-girijatmak-temple-lenyadri': require('../../assets/images/sacred/Girijatmaj.webp'),
  'ashtavinayak-vighnahar-temple-ozar': require('../../assets/images/sacred/Vighnahar.jpg'),
  'ashtavinayak-mahaganapati-temple-ranjangaon': require('../../assets/images/sacred/Mahaganapati.jpg'),

  // Panchbhoota Shrines
  'panchbhoota-ekambareswarar-temple-kanchipuram': require('../../assets/images/sacred/Ekambareshwar.jpg'),
  'panchbhoota-jambukeswarar-temple-thiruvanaikaval': require('../../assets/images/sacred/jambukeswarar.jpg'),
  'panchbhoota-arunachaleswarar-temple-thiruvannamalai': require('../../assets/images/sacred/Arunachaleswarar.jpg'),
  'panchbhoota-thillai-nataraja-temple-chidambaram': require('../../assets/images/sacred/ThillaiNataraja.jpg'),

  // Additional Sacred Temples in Sacred Folder
  'vishnu-bankey-bihari-temple-vrindavan': require('../../assets/images/sacred/Bankebihari_temple.jpg'),
  'other-brahma-temple-pushkar': require('../../assets/images/sacred/Brahma_Temple.jpg'),
  'other-brihadisvara-temple-thanjavur': require('../../assets/images/sacred/Brihadisvara.jpg'),
  'other-dakshineswar-kali-temple-kolkata': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.jpg'),
  'other-dwarkadhish-temple-mathura': require('../../assets/images/sacred/DwarkadhishMathura.jpg'),
  'other-govind-dev-ji-temple-jaipur': require('../../assets/images/sacred/GovindDev.jpg'),
  'other-guruvayur-temple-kerala': require('../../assets/images/sacred/Guruvayur.jpg'),
  'other-jakhu-temple-shimla': require('../../assets/images/sacred/Jakhu.jpg'),
  'other-kalaram-temple-nashik': require('../../assets/images/sacred/Kalaram.jpg'),
  'other-kashtabhanjan-dev-hanumanji-sarangpur': require('../../assets/images/sacred/Kashtabhanjan.jpg'),
  'other-khatu-shyam-ji-temple-sikar': require('../../assets/images/sacred/KhatuShyam.webp'),
  'other-lingaraj-temple-bhubaneswar': require('../../assets/images/sacred/Lingaraj.avif'),
  'other-murudeshwar-temple-karnataka': require('../../assets/images/sacred/Murudeshwara.jpg'),
  'other-neelkanth-mahadev-temple-rishikesh': require('../../assets/images/sacred/NeelKanth.jpg'),
  'other-pashupatinath-temple-mandsaur': require('../../assets/images/sacred/Pashupatinath.jpg'),
  'other-prem-mandir-vrindavan': require('../../assets/images/sacred/Premmandir.jpg'),
  'other-salasar-balaji-temple-churu': require('../../assets/images/sacred/SalasarBalaji.jpg'),
  'other-sankat-mochan-hanuman-temple-varanasi': require('../../assets/images/sacred/Sankatmochan.webp'),
  'other-shrinathji-temple-nathdwara': require('../../assets/images/sacred/Shreenathjitemple.avif'),
  'other-shree-ram-janmabhoomi-mandir-ayodhya': require('../../assets/images/sacred/Shri_Ram_Janambhoomi_Mandir.jpg'),
  'other-padmanabhaswamy-temple-thiruvananthapuram': require('../../assets/images/sacred/Sree_Padmanabhaswamy.jpg'),
  'other-sri-ranganathaswamy-temple-srirangam': require('../../assets/images/sacred/SriRanganathaswamy.jpg'),
  'other-sun-temple-modhera': require('../../assets/images/sacred/SunTemple.jpg'),
  'other-triyuginarayan-temple-rudraprayag': require('../../assets/images/sacred/Triyuginarayan.jpg'),
  'other-tungnath-temple-chopta': require('../../assets/images/sacred/Tungnath.jpg'),
  'other-udupi-sri-krishna-matha': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.jpg'),
  'other-vithoba-temple-pandharpur': require('../../assets/images/sacred/Vithoba.jpg'),
  'other-hanuman-garhi-temple-ayodhya': require('../../assets/images/sacred/hanumangarhi.jpg'),
  'other-iskcon-temple-vrindavan': require('../../assets/images/sacred/iskconVrindavan.jpg'),
  'other-karni-mata-temple-deshnoke': require('../../assets/images/sacred/karnimata.jpg'),
  'other-shri-krishna-janmasthan-mathura': require('../../assets/images/sacred/krishnajanmasthan.jpg'),
  'other-sabarimala-sree-dharma-sastha-temple': require('../../assets/images/sacred/sabarimala.avif'),

  // Comprehensive Sacred Folder Assets & DB Temple Mappings
  'sacred-adikumbeswarar': require('../../assets/images/sacred/AdiKumbeswarar.jpg'),
  'sacred-agniswarar': require('../../assets/images/sacred/Agniswarar.webp'),
  'sacred-ahobilamnavanarasimha': require('../../assets/images/sacred/AhobilamNavanarasimha.jpg'),
  'sacred-amareswaraswamy': require('../../assets/images/sacred/AmareswaraSwamy.jpg'),
  'sacred-amarnath': require('../../assets/images/sacred/Amarnath.jpg'),
  'sacred-ambalappuzha-sri-krishna-temple': require('../../assets/images/sacred/Ambalappuzha_Sri_Krishna_Temple.jpg'),
  'sacred-anantavasudeva': require('../../assets/images/sacred/AnantaVasudeva.jpg'),
  'sacred-annapoorneshwari': require('../../assets/images/sacred/Annapoorneshwari.webp'),
  'sacred-apatsahayesvarar': require('../../assets/images/sacred/Apatsahayesvarar.jpg'),
  'sacred-aranmula-parthasarathy': require('../../assets/images/sacred/Aranmula_Parthasarathy.jpg'),
  'sacred-arunachaleswarar': require('../../assets/images/sacred/Arunachaleswarar.jpg'),
  'sacred-assi-ghat': require('../../assets/images/sacred/Assi_Ghat.jpg'),
  'sacred-attukal': require('../../assets/images/sacred/Attukal.jpg'),
  'sacred-babulnath': require('../../assets/images/sacred/Babulnath.jpg'),
  'sacred-badehanumanmandir': require('../../assets/images/sacred/BadeHanumanMandir.jpg'),
  'sacred-baijnath': require('../../assets/images/sacred/Baijnath.jpg'),
  'sacred-bankebihari-temple': require('../../assets/images/sacred/Bankebihari_temple.jpg'),
  'sacred-bhadrachalam-temple': require('../../assets/images/sacred/Bhadrachalam_temple.jpg'),
  'sacred-bhalkatirthshrine': require('../../assets/images/sacred/BhalkaTirthShrine.jpg'),
  'sacred-bhartrihari': require('../../assets/images/sacred/Bhartrihari.jpg'),
  'sacred-bhojeshwar': require('../../assets/images/sacred/Bhojeshwar.jpg'),
  'sacred-bijlimahadev': require('../../assets/images/sacred/BijliMahadev.jpg'),
  'sacred-birla-temple': require('../../assets/images/sacred/Birla-Temple.webp'),
  'sacred-brahma-temple': require('../../assets/images/sacred/Brahma_Temple.jpg'),
  'sacred-brihadisvara': require('../../assets/images/sacred/Brihadisvara.jpg'),
  'sacred-chamundi': require('../../assets/images/sacred/Chamundi.jpg'),
  'sacred-chennakesava': require('../../assets/images/sacred/Chennakesava.jpg'),
  'sacred-chottanikkara': require('../../assets/images/sacred/Chottanikkara.jpg'),
  'sacred-dakshineswar-kali-temple': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.jpg'),
  'sacred-daulatabad': require('../../assets/images/sacred/Daulatabad.jpg'),
  'sacred-dharbaranyeswarar': require('../../assets/images/sacred/Dharbaranyeswarar.jpg'),
  'sacred-dharidevi': require('../../assets/images/sacred/DhariDevi.jpg'),
  'sacred-draksharama-temple': require('../../assets/images/sacred/Draksharama_temple.jpg'),
  'sacred-dwarkadhishmathura': require('../../assets/images/sacred/DwarkadhishMathura.jpg'),
  'sacred-ekambareshwar': require('../../assets/images/sacred/Ekambareshwar.jpg'),
  'sacred-ellorakailasa': require('../../assets/images/sacred/ElloraKailasa.jpg'),
  'sacred-gautamrishiashram': require('../../assets/images/sacred/GautamRishiAshram.jpg'),
  'sacred-girijatmaj': require('../../assets/images/sacred/Girijatmaj.webp'),
  'sacred-gnanasaraswathi': require('../../assets/images/sacred/GnanaSaraswathi.jpg'),
  'sacred-gommateshwara': require('../../assets/images/sacred/Gommateshwara.jpg'),
  'sacred-gopnathmahadev': require('../../assets/images/sacred/GopnathMahadev.jpg'),
  'sacred-gorakhnath': require('../../assets/images/sacred/Gorakhnath.jpg'),
  'sacred-govinddev': require('../../assets/images/sacred/GovindDev.jpg'),
  'sacred-guruvayur': require('../../assets/images/sacred/Guruvayur.jpg'),
  'sacred-gyanvapi': require('../../assets/images/sacred/Gyanvapi.jpg'),
  'sacred-hidimbadevi': require('../../assets/images/sacred/HidimbaDevi.jpg'),
  'sacred-hidimba-devi': require('../../assets/images/sacred/Hidimba_Devi.jpg'),
  'sacred-jakhu': require('../../assets/images/sacred/Jakhu.jpg'),
  'sacred-janardhanaswamy': require('../../assets/images/sacred/JanardhanaSwamy.jpg'),
  'sacred-kainchidham': require('../../assets/images/sacred/KainchiDham.jpg'),
  'sacred-kalaram': require('../../assets/images/sacred/Kalaram.jpg'),
  'sacred-kalikamata': require('../../assets/images/sacred/KalikaMata.jpg'),
  'sacred-kanakadurga': require('../../assets/images/sacred/KanakaDurga.jpg'),
  'sacred-kanchipuram-kamakshi': require('../../assets/images/sacred/Kanchipuram_Kamakshi.jpg'),
  'sacred-kasardevi': require('../../assets/images/sacred/KasarDevi.jpg'),
  'sacred-kashtabhanjan': require('../../assets/images/sacred/Kashtabhanjan.jpg'),
  'sacred-kateeldurgaparameshwari': require('../../assets/images/sacred/KateelDurgaparameshwari.jpg'),
  'sacred-khatushyam': require('../../assets/images/sacred/KhatuShyam.webp'),
  'sacred-kondagattuanjaneyaswamy': require('../../assets/images/sacred/KondagattuAnjaneyaSwamy.jpg'),
  'sacred-kotilingeshwara': require('../../assets/images/sacred/Kotilingeshwara.jpg'),
  'sacred-ksheeraramalingeswara': require('../../assets/images/sacred/KsheeraRamalingeswara.jpg'),
  'sacred-kumararama-bhimesvara': require('../../assets/images/sacred/Kumararama_Bhimesvara.jpg'),
  'sacred-lingaraj': require('../../assets/images/sacred/Lingaraj.avif'),
  'sacred-maa-mundeshwari-devi': require('../../assets/images/sacred/Maa_Mundeshwari_Devi.jpg'),
  'sacred-mahabaleshwar': require('../../assets/images/sacred/Mahabaleshwar.jpg'),
  'sacred-mahaganapati': require('../../assets/images/sacred/Mahaganapati.jpg'),
  'sacred-mahavirmandir': require('../../assets/images/sacred/MahavirMandir.jpg'),
  'sacred-manikarnika-ghat': require('../../assets/images/sacred/Manikarnika_Ghat.jpg'),
  'sacred-mansadevi': require('../../assets/images/sacred/MansaDevi.jpg'),
  'sacred-murudeshwara': require('../../assets/images/sacred/Murudeshwara.jpg'),
  'sacred-naganathaswamy': require('../../assets/images/sacred/Naganathaswamy.jpg'),
  'sacred-nagaraja': require('../../assets/images/sacred/Nagaraja.jpg'),
  'sacred-naulakha': require('../../assets/images/sacred/Naulakha.jpg'),
  'sacred-neelkanth': require('../../assets/images/sacred/NeelKanth.jpg'),
  'sacred-palanimurugan': require('../../assets/images/sacred/PalaniMurugan.avif'),
  'sacred-pashupatinath': require('../../assets/images/sacred/Pashupatinath.jpg'),
  'sacred-pazhamudircholai': require('../../assets/images/sacred/Pazhamudircholai.jpg'),
  'sacred-pracheenhanuman': require('../../assets/images/sacred/PracheenHanuman.jpg'),
  'sacred-premmandir': require('../../assets/images/sacred/Premmandir.jpg'),
  'sacred-punaura-sitamarhi': require('../../assets/images/sacred/Punaura_Sitamarhi.jpg'),
  'sacred-purnagiridevi': require('../../assets/images/sacred/PurnagiriDevi.jpg'),
  'sacred-radhadamodar': require('../../assets/images/sacred/RadhaDamodar.jpg'),
  'sacred-ramappa-temple': require('../../assets/images/sacred/Ramappa_Temple.jpg'),
  'sacred-ramatheertham': require('../../assets/images/sacred/Ramatheertham.jpg'),
  'sacred-ramnagar-fort': require('../../assets/images/sacred/Ramnagar_Fort.jpg'),
  'sacred-ranakpur': require('../../assets/images/sacred/Ranakpur.jpg'),
  'sacred-salasarbalaji': require('../../assets/images/sacred/SalasarBalaji.jpg'),
  'sacred-sandipaniashram': require('../../assets/images/sacred/SandipaniAshram.avif'),
  'sacred-sankatmochan': require('../../assets/images/sacred/Sankatmochan.webp'),
  'sacred-sarangapani': require('../../assets/images/sacred/Sarangapani.jpg'),
  'sacred-shivatrats': require('../../assets/images/sacred/ShivaTrats.jpg'),
  'sacred-shreenathjitemple': require('../../assets/images/sacred/Shreenathjitemple.avif'),
  'sacred-shri-ram-janambhoomi-mandir': require('../../assets/images/sacred/Shri_Ram_Janambhoomi_Mandir.jpg'),
  'sacred-siddhivinayak-temple': require('../../assets/images/sacred/Siddhivinayak-Temple.jpg'),
  'sacred-someshwara': require('../../assets/images/sacred/Someshwara.jpg'),
  'sacred-sonprayagsangam': require('../../assets/images/sacred/SonprayagSangam.jpg'),
  'sacred-sree-padmanabhaswamy': require('../../assets/images/sacred/Sree_Padmanabhaswamy.jpg'),
  'sacred-sree-vallaba': require('../../assets/images/sacred/Sree_Vallaba.jpg'),
  'sacred-sriranganathaswamy': require('../../assets/images/sacred/SriRanganathaswamy.jpg'),
  'sacred-srivilliputhurandal': require('../../assets/images/sacred/SrivilliputhurAndal.jpg'),
  'sacred-suntemple': require('../../assets/images/sacred/SunTemple.jpg'),
  'sacred-suryanarkovil': require('../../assets/images/sacred/SuryanarKovil.jpg'),
  'sacred-swamimalaimurugan': require('../../assets/images/sacred/SwamimalaiMurugan.jpg'),
  'sacred-swaminarayanakshardham': require('../../assets/images/sacred/SwaminarayanAkshardham.jpg'),
  'sacred-tanotmata': require('../../assets/images/sacred/TanotMata.jpg'),
  'sacred-tapovancaves': require('../../assets/images/sacred/Tapovancaves.jpg'),
  'sacred-tarakeshwar': require('../../assets/images/sacred/Tarakeshwar.jpg'),
  'sacred-templeofvedicplanetarium': require('../../assets/images/sacred/TempleofVedicPlanetarium.jpg'),
  'sacred-thillainataraja': require('../../assets/images/sacred/ThillaiNataraja.jpg'),
  'sacred-thirunageswaramnaganathar': require('../../assets/images/sacred/ThirunageswaramNaganathar.jpg'),
  'sacred-thiruparankundrammurugan': require('../../assets/images/sacred/ThiruparankundramMurugan.avif'),
  'sacred-thiruttani-temple-rajagopuram': require('../../assets/images/sacred/Thiruttani_Temple_Rajagopuram.jpg'),
  'sacred-thousandpillar': require('../../assets/images/sacred/ThousandPillar.jpg'),
  'sacred-tiruchendurmurugan': require('../../assets/images/sacred/TiruchendurMurugan.jpg'),
  'sacred-trilokinath': require('../../assets/images/sacred/Trilokinath.jpg'),
  'sacred-trinetreshwar': require('../../assets/images/sacred/Trinetreshwar.jpg'),
  'sacred-triprayarsree': require('../../assets/images/sacred/TriprayarSree.jpg'),
  'sacred-triveni-ghat': require('../../assets/images/sacred/Triveni-Ghat.webp'),
  'sacred-triyuginarayan': require('../../assets/images/sacred/Triyuginarayan.jpg'),
  'sacred-tungnath': require('../../assets/images/sacred/Tungnath.jpg'),
  'sacred-udupi-sri-krishna-matha-temple': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.jpg'),
  'sacred-uppiliappan': require('../../assets/images/sacred/Uppiliappan.jpg'),
  'sacred-vadakkunnathan': require('../../assets/images/sacred/Vadakkunnathan.jpg'),
  'sacred-varadvinayak': require('../../assets/images/sacred/VaradVinayak.jpg'),
  'sacred-varadharajaperumal': require('../../assets/images/sacred/VaradharajaPerumal.jpg'),
  'sacred-varahalakshminarasimha': require('../../assets/images/sacred/VarahaLakshmiNarasimha.jpg'),
  'sacred-vashishttemple': require('../../assets/images/sacred/VashishtTemple.jpg'),
  'sacred-veerabhadra': require('../../assets/images/sacred/Veerabhadra.jpg'),
  'sacred-venugopalaswamy': require('../../assets/images/sacred/VenugopalaSwamy.jpg'),
  'sacred-vighnahar': require('../../assets/images/sacred/Vighnahar.jpg'),
  'sacred-vishnupad': require('../../assets/images/sacred/Vishnupad.jpg'),
  'sacred-vithoba': require('../../assets/images/sacred/Vithoba.jpg'),
  'sacred-yadadrisrilakshminarasimha': require('../../assets/images/sacred/YadadriSriLakshmiNarasimha.webp'),
  'sacred-baan': require('../../assets/images/sacred/baan.jpg'),
  'sacred-ballaleshwar': require('../../assets/images/sacred/ballaleshwar.jpg'),
  'sacred-bhairavnath': require('../../assets/images/sacred/bhairavnath.jpg'),
  'sacred-chandi-devi': require('../../assets/images/sacred/chandi-devi.webp'),
  'sacred-chintamani': require('../../assets/images/sacred/chintamani.jpg'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/sacred/dashashwamedh-ghat.jpg'),
  'sacred-dilwara': require('../../assets/images/sacred/dilwara.jpg'),
  'sacred-gandhisarvor': require('../../assets/images/sacred/gandhisarvor.avif'),
  'sacred-gitamandir': require('../../assets/images/sacred/gitamandir.jpg'),
  'sacred-hanumangarhi': require('../../assets/images/sacred/hanumangarhi.jpg'),
  'sacred-iskconvrindavan': require('../../assets/images/sacred/iskconVrindavan.jpg'),
  'sacred-jageshwar': require('../../assets/images/sacred/jageshwar.webp'),
  'sacred-jambukeswarar': require('../../assets/images/sacred/jambukeswarar.jpg'),
  'sacred-kailashnathwar': require('../../assets/images/sacred/kailashnathwar.jpg'),
  'sacred-kapaleeshwarar': require('../../assets/images/sacred/kapaleeshwarar.webp'),
  'sacred-karnimata': require('../../assets/images/sacred/karnimata.jpg'),
  'sacred-krishnajanmasthan': require('../../assets/images/sacred/krishnajanmasthan.jpg'),
  'sacred-mayureshwar': require('../../assets/images/sacred/mayureshwar.webp'),
  'sacred-mumba-devi': require('../../assets/images/sacred/mumba-devi.jpg'),
  'sacred-ramghat': require('../../assets/images/sacred/ramghat.jpg'),
  'sacred-sabarimala': require('../../assets/images/sacred/sabarimala.avif'),
  'sacred-sammed-shikharji': require('../../assets/images/sacred/sammed-shikharji.jpg'),
  'sacred-shivganga': require('../../assets/images/sacred/shivganga.jpg'),
  'sacred-shri-radha-raman': require('../../assets/images/sacred/shri-radha-raman.jpg'),
  'sacred-tapkeshwar': require('../../assets/images/sacred/tapkeshwar.jpg'),
  'sacred-trikuta': require('../../assets/images/sacred/trikuta.jpg'),
  'sacred-trinetra-ganesh-temple': require('../../assets/images/sacred/trinetra-ganesh-temple.jpg'),
  'sacred-tulsi-manas': require('../../assets/images/sacred/tulsi-manas.jpg'),
  'sacred-vasukital': require('../../assets/images/sacred/vasukital.jpg'),
  'dwarkadhishtempledwarka': require('../../assets/images/sacred/DwarkadhishMathura.jpg'),
  'ekambareswarartemplekanchipuram': require('../../assets/images/sacred/Ekambareshwar.jpg'),
  'jambukeswarartemplethiruvanaikaval': require('../../assets/images/sacred/jambukeswarar.jpg'),
  'arunachaleswarartemplethiruvannamalai': require('../../assets/images/sacred/Arunachaleswarar.jpg'),
  'thillainatarajatemplechidambaram': require('../../assets/images/sacred/ThillaiNataraja.jpg'),
  'mayureshwartemplemorgaon': require('../../assets/images/sacred/mayureshwar.webp'),
  'siddhivinayaktemplesiddhatek': require('../../assets/images/sacred/Siddhivinayak-Temple.jpg'),
  'ballaleshwartemplepali': require('../../assets/images/sacred/ballaleshwar.jpg'),
  'varadhavinayaktemplemahad': require('../../assets/images/sacred/VaradharajaPerumal.jpg'),
  'chintamanitempletheur': require('../../assets/images/sacred/chintamani.jpg'),
  'girijatmaktemplelenyadri': require('../../assets/images/sacred/Girijatmaj.webp'),
  'vighnahartempleozar': require('../../assets/images/sacred/Vighnahar.jpg'),
  'mahaganapatitempleranjangaon': require('../../assets/images/sacred/Mahaganapati.jpg'),
  'chamundeshwaritemplemysore': require('../../assets/images/sacred/Chamundi.jpg'),
  'sriranganathaswamytemplesrirangam': require('../../assets/images/sacred/SriRanganathaswamy.jpg'),
  'guruvayurtemplekerala': require('../../assets/images/sacred/Guruvayur.jpg'),
  'iskcontemplevrindavan': require('../../assets/images/sacred/iskconVrindavan.jpg'),
  'premmandirvrindavan': require('../../assets/images/sacred/Premmandir.jpg'),
  'iskconmiraroadthane': require('../../assets/images/sacred/iskconVrindavan.jpg'),
  'iskcontemplemumbaijuhu': require('../../assets/images/sacred/iskconVrindavan.jpg'),
  'iskcontemplebengalurukarnataka': require('../../assets/images/sacred/iskconVrindavan.jpg'),
  'lingarajtemplebhubaneswar': require('../../assets/images/sacred/Lingaraj.avif'),
  'brihadisvaratemplethanjavur': require('../../assets/images/sacred/Brihadisvara.jpg'),
  'amarnathtemplejammukashmir': require('../../assets/images/sacred/Amarnath.jpg'),
  'tungnathtemplechopta': require('../../assets/images/sacred/Tungnath.jpg'),
  'pashupatinathtemplemandsaur': require('../../assets/images/sacred/Pashupatinath.jpg'),
  'bhojeshwartemplebhojpur': require('../../assets/images/sacred/Bhojeshwar.jpg'),
  'murudeshwartemplekarnataka': require('../../assets/images/sacred/Murudeshwara.jpg'),
  'mumbadevitemplemumbai': require('../../assets/images/sacred/mumba-devi.jpg'),
  'mansadevitempleharidwar': require('../../assets/images/sacred/MansaDevi.jpg'),
  'chandidevitempleharidwar': require('../../assets/images/sacred/chandi-devi.webp'),
  'sankatmochanhanumantemplevaranasi': require('../../assets/images/sacred/Sankatmochan.webp'),
  'salasarbalajitemplechuru': require('../../assets/images/sacred/SalasarBalaji.jpg'),
  'hanumangarhitempleayodhya': require('../../assets/images/sacred/hanumangarhi.jpg'),
  'jakhutempleshimla': require('../../assets/images/sacred/Jakhu.jpg'),
  'siddhivinayaktemplemumbai': require('../../assets/images/sacred/Siddhivinayak-Temple.jpg'),
  'swaminarayanakshardhamdelhi': require('../../assets/images/sacred/SwaminarayanAkshardham.jpg'),
  'chamundadevitemplekangra': require('../../assets/images/sacred/Chamundi.jpg'),
  'dwarkadhishtemplemathura': require('../../assets/images/sacred/DwarkadhishMathura.jpg'),
  'shrikrishnajanmasthanmathura': require('../../assets/images/sacred/krishnajanmasthan.jpg'),
  'radhadamodartemplevrindavan': require('../../assets/images/sacred/RadhaDamodar.jpg'),
  'govinddevjitemplejaipur': require('../../assets/images/sacred/GovindDev.jpg'),
  'kalaramtemplenashik': require('../../assets/images/sacred/Kalaram.jpg'),
  'vithobatemplepandharpur': require('../../assets/images/sacred/Vithoba.jpg'),
  'venugopalaswamytemplekrsmysore': require('../../assets/images/sacred/VenugopalaSwamy.jpg'),
  'chennakesavatemplebelur': require('../../assets/images/sacred/Chennakesava.jpg'),
  'varahalakshminarasimhatemplesimhachalam': require('../../assets/images/sacred/VarahaLakshmiNarasimha.jpg'),
  'ahobilamnavanarasimhatemple': require('../../assets/images/sacred/AhobilamNavanarasimha.jpg'),
  'anantavasudevatemplebhubaneswar': require('../../assets/images/sacred/AnantaVasudeva.jpg'),
  'pashupatinathshrineindonepalborder': require('../../assets/images/sacred/Pashupatinath.jpg'),
  'tarakeshwartemplehooghly': require('../../assets/images/sacred/Tarakeshwar.jpg'),
  'kapaleeshwarartemplemylapore': require('../../assets/images/sacred/kapaleeshwarar.webp'),
  'vadakkunnathantemplethrissur': require('../../assets/images/sacred/Vadakkunnathan.jpg'),
  'bhairavnathshivashrinerajrappa': require('../../assets/images/sacred/bhairavnath.jpg'),
  'kotilingeshwaratemplekolar': require('../../assets/images/sacred/Kotilingeshwara.jpg'),
  'dakshineswarkalitemplekolkata': require('../../assets/images/sacred/Dakshineswar-Kali-Temple.jpg'),
  'kanakadurgatemplevijayawada': require('../../assets/images/sacred/KanakaDurga.jpg'),
  'attukalbhagavathytemplethiruvananthapuram': require('../../assets/images/sacred/Attukal.jpg'),
  'chottanikkarabhagavathytemplekochi': require('../../assets/images/sacred/Chottanikkara.jpg'),
  'kateeldurgaparameshwaritemplemangalore': require('../../assets/images/sacred/KateelDurgaparameshwari.jpg'),
  'annapoorneshwaritemplehoranadu': require('../../assets/images/sacred/Annapoorneshwari.webp'),
  'shreekashtabhanjandevhanumanjisarangpur': require('../../assets/images/sacred/Kashtabhanjan.jpg'),
  'pracheenhanumanmandirdelhi': require('../../assets/images/sacred/PracheenHanuman.jpg'),
  'girgaonbabulnathhanumanmandirmumbai': require('../../assets/images/sacred/Babulnath.jpg'),
  'sankatmochantempleshimla': require('../../assets/images/sacred/Sankatmochan.webp'),
  'kainchidhamashramnainital': require('../../assets/images/sacred/KainchiDham.jpg'),
  'badehanumanmandirlyinghanumanprayagraj': require('../../assets/images/sacred/BadeHanumanMandir.jpg'),
  'sabarimalasreedharmasasthatemple': require('../../assets/images/sacred/sabarimala.avif'),
  'palanimurugantempledindigul': require('../../assets/images/sacred/PalaniMurugan.avif'),
  'swamimalaimurugantemplethanjavur': require('../../assets/images/sacred/SwamimalaiMurugan.jpg'),
  'thiruparankundrammurugantemplemadurai': require('../../assets/images/sacred/ThiruparankundramMurugan.avif'),
  'pazhamudircholaimurugantemplemadurai': require('../../assets/images/sacred/Pazhamudircholai.jpg'),
  'tiruchendurmurugantemplethoothukudi': require('../../assets/images/sacred/TiruchendurMurugan.jpg'),
  'gommateshwarastatueshravanabelagola': require('../../assets/images/sacred/Gommateshwara.jpg'),
  'templeofvedicplanetariumtovpmayapur': require('../../assets/images/sacred/TempleofVedicPlanetarium.jpg'),
  'sammedshikharjigiridih': require('../../assets/images/sacred/sammed-shikharji.jpg'),
  'dilwaratemplesmountabu': require('../../assets/images/sacred/dilwara.jpg'),
  'ranakpurjaintemplepali': require('../../assets/images/sacred/Ranakpur.jpg'),
  'karnimatatemplerattempledeshnoke': require('../../assets/images/sacred/karnimata.jpg'),
  'tanotmatatemplejaisalmer': require('../../assets/images/sacred/TanotMata.jpg'),
  'brahmatemplepushkar': require('../../assets/images/sacred/Brahma_Temple.jpg'),
  'khatushyamjitemplesikar': require('../../assets/images/sacred/KhatuShyam.webp'),
  'trinetraganeshtempleranthambore': require('../../assets/images/sacred/Trinetreshwar.jpg'),
  'chamundihillsanctuarymysuru': require('../../assets/images/sacred/Chamundi.jpg'),
  'udupisrikrishnamathaudupi': require('../../assets/images/sacred/Udupi_Sri_Krishna_Matha_Temple.jpg'),
  'murudeshwarcoastalsanctuary': require('../../assets/images/sacred/Murudeshwara.jpg'),
  'mahabaleshwartemplegokarna': require('../../assets/images/sacred/Mahabaleshwar.jpg'),
  'triprayarsreeramatemplethrissur': require('../../assets/images/sacred/TriprayarSree.jpg'),
  'sreevallabhatemplethiruvalla': require('../../assets/images/sacred/Sree_Vallaba.jpg'),
  'ambalappuzhasrikrishnatemplealappuzha': require('../../assets/images/sacred/Ambalappuzha_Sri_Krishna_Temple.jpg'),
  'aranmulaparthasarathytemplepathanamthitta': require('../../assets/images/sacred/Aranmula_Parthasarathy.jpg'),
  'janardhanaswamytemplevarkala': require('../../assets/images/sacred/JanardhanaSwamy.jpg'),
  'nagarajatemplenagercoil': require('../../assets/images/sacred/Nagaraja.jpg'),
  'srivilliputhurandaltemplevirudhunagar': require('../../assets/images/sacred/SrivilliputhurAndal.jpg'),
  'uppiliappantemplekumbakonam': require('../../assets/images/sacred/Uppiliappan.jpg'),
  'sarangapanitemplekumbakonam': require('../../assets/images/sacred/Sarangapani.jpg'),
  'adikumbeswarartemplekumbakonam': require('../../assets/images/sacred/AdiKumbeswarar.jpg'),
  'varadharajaperumaltemplekanchipuram': require('../../assets/images/sacred/VaradharajaPerumal.jpg'),
  'thirunageswaramnaganathartemple': require('../../assets/images/sacred/ThirunageswaramNaganathar.jpg'),
  'apatsahayesvarartemplealangudi': require('../../assets/images/sacred/Apatsahayesvarar.jpg'),
  'kailasanathartemplethingalur': require('../../assets/images/sacred/kailashnathwar.jpg'),
  'agniswarartemplekanchanur': require('../../assets/images/sacred/Agniswarar.webp'),
  'dharbaranyeswarartemplethirunallar': require('../../assets/images/sacred/Dharbaranyeswarar.jpg'),
  'naganathaswamytemplekeelaperumpallam': require('../../assets/images/sacred/Naganathaswamy.jpg'),
  'suryanarkovilkumbakonam': require('../../assets/images/sacred/SuryanarKovil.jpg'),
  'ramatheerthamtemplevizianagaram': require('../../assets/images/sacred/Ramatheertham.jpg'),
  'draksharamambheemeswaratemplekakinada': require('../../assets/images/sacred/Draksharama_temple.jpg'),
  'amareswaraswamytempleamaravati': require('../../assets/images/sacred/AmareswaraSwamy.jpg'),
  'someshwaraswamytemplebhimavaram': require('../../assets/images/sacred/Someshwara.jpg'),
  'ksheeraramalingeswaratemplepalakollu': require('../../assets/images/sacred/KsheeraRamalingeswara.jpg'),
  'kumarabhimeswaraswamytemplesamalkota': require('../../assets/images/sacred/Kumararama_Bhimesvara.jpg'),
  'yadadrisrilakshminarasimhatemple': require('../../assets/images/sacred/YadadriSriLakshmiNarasimha.webp'),
  'thousandpillartemplewarangal': require('../../assets/images/sacred/ThousandPillar.jpg'),
  'ramappatemplemulugu': require('../../assets/images/sacred/Ramappa_Temple.jpg'),
  'gnanasaraswathitemplebasar': require('../../assets/images/sacred/GnanaSaraswathi.jpg'),
  'kondagattuanjaneyaswamytemplejagtial': require('../../assets/images/sacred/KondagattuAnjaneyaSwamy.jpg'),
  'veerabhadratemplelepakshi': require('../../assets/images/sacred/Veerabhadra.jpg'),
  'vishnupadtemplegaya': require('../../assets/images/sacred/Vishnupad.jpg'),
  'mahavirmandirpatna': require('../../assets/images/sacred/MahavirMandir.jpg'),
  'punauradhamjanakitemplesitamarhi': require('../../assets/images/sacred/Punaura_Sitamarhi.jpg'),
  'gorakhnathtemplegorakhpur': require('../../assets/images/sacred/Gorakhnath.jpg'),
  'tulsimanasmandirvaranasi': require('../../assets/images/sacred/tulsi-manas.jpg'),
  'ramnagarforttemplevaranasi': require('../../assets/images/sacred/Ramnagar_Fort.jpg'),
  'triyuginarayantemplerudraprayag': require('../../assets/images/sacred/Triyuginarayan.jpg'),
  'dharidevitemplesrinagargarhwal': require('../../assets/images/sacred/DhariDevi.jpg'),
  'neelkanthmahadevtemplerishikesh': require('../../assets/images/sacred/NeelKanth.jpg'),
  'tapkeshwarmahadevtempledehradun': require('../../assets/images/sacred/tapkeshwar.jpg'),
  'kasardevitemplealmora': require('../../assets/images/sacred/KasarDevi.jpg'),
  'jageshwardhamtemplecomplexalmora': require('../../assets/images/sacred/jageshwar.webp'),
  'baijnathtemplecomplexbageshwar': require('../../assets/images/sacred/Baijnath.jpg'),
  'purnagiridevitemplechampawat': require('../../assets/images/sacred/PurnagiriDevi.jpg'),
  'hidimbadevitemplemanali': require('../../assets/images/sacred/HidimbaDevi.jpg'),
  'bijlimahadevtemplekullu': require('../../assets/images/sacred/BijliMahadev.jpg'),
  'vashishttemplehotspringsmanali': require('../../assets/images/sacred/VashishtTemple.jpg'),
  'triloknathtemplelahaulvalley': require('../../assets/images/sacred/Trilokinath.jpg'),
  'kalikamatatemplepavagadh': require('../../assets/images/sacred/KalikaMata.jpg'),
  'bhalkatirthveraval': require('../../assets/images/sacred/BhalkaTirthShrine.jpg'),
  'gopnathmahadevtemplebhavnagar': require('../../assets/images/sacred/GopnathMahadev.jpg'),
  'trinetreshwarmahadevtempletarnetar': require('../../assets/images/sacred/Trinetreshwar.jpg'),
  'suntemplemodhera': require('../../assets/images/sacred/SunTemple.jpg'),
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


const ALL_PREFIXES = /^(jyotirling|other|shaktipeeth|healing|sacred|ashtavinayak|panchbhoota|vishnu|shiva|devi|hanuman|ganapati|chardham|shakti)-/g;

const stripPrefix = (s: string) => s.replace(ALL_PREFIXES, '').replace(ALL_PREFIXES, '');

const IMAGE_LOOKUP_CACHE = new Map<string, ImageSourcePropType>();

const getTempleImageById = (id: string) => {
  if (!id) return null;
  if (IMAGE_LOOKUP_CACHE.has(id)) return IMAGE_LOOKUP_CACHE.get(id) || null;

  let result: ImageSourcePropType | null = null;

  // 1. Exact match
  if (TEMPLE_IMAGES[id]) {
    result = TEMPLE_IMAGES[id];
  } else {
    const normId = normalizeTempleName(id);
    const strippedId = stripPrefix(normId); // e.g. "venugopala-swamy-temple-mysore"

    for (const key of Object.keys(TEMPLE_IMAGES)) {
      const normKey = normalizeTempleName(key);
      const strippedKey = stripPrefix(normKey); // e.g. "venugopalaswamy"

      if (
        normKey === normId ||
        strippedKey === strippedId ||
        (strippedId.length > 5 && (strippedKey.includes(strippedId) || strippedId.includes(strippedKey)))
      ) {
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
  if (lowerName.includes('kalika mata') || lowerName.includes('pavagadh')) return TEMPLE_IMAGES['shaktipeeth-bhavani-mandir-tuljapur'];

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

  // Extended Shiva Temple keyword matching
  if (lowerName.includes('trimbak raja') || (lowerName.includes('trimbak') && lowerName.includes('nashik'))) return TEMPLE_IMAGES['jyotirling-trimbakeshwar-temple-nashik'];
  if (lowerName.includes('bhimashankar') && (lowerName.includes('pune') || lowerName.includes('forest'))) return TEMPLE_IMAGES['jyotirling-bhimashankar-temple-maharashtra'];
  if ((lowerName.includes('somnath') && (lowerName.includes('jyotirlinga') || lowerName.includes('shrine') || lowerName.includes('veraval') || lowerName.includes('patan'))) || lowerName.includes('somnath maha') || lowerName.includes('somnath coastal') || lowerName.includes('somnath temple complex')) return TEMPLE_IMAGES['jyotirling-somnath-temple-gujarat'];
  if (lowerName.includes('baba baidyanath') || lowerName.includes('baba dham') || (lowerName.includes('baidyanath') && lowerName.includes('deoghar'))) return TEMPLE_IMAGES['jyotirling-baidyanath-temple-deoghar'];
  if (lowerName.includes('kashi vishwanath corridor') || (lowerName.includes('kashi') && lowerName.includes('corridor'))) return TEMPLE_IMAGES['jyotirling-kashi-vishwanath-temple-varanasi'];
  if (lowerName.includes('mahakal jyotirlinga') || (lowerName.includes('mahakal') && lowerName.includes('ujjain'))) return TEMPLE_IMAGES['jyotirling-mahakaleshwar-temple-ujjain'];
  if (lowerName.includes('omkareshwar island') || (lowerName.includes('omkareshwar') && lowerName.includes('narmada'))) return TEMPLE_IMAGES['jyotirling-omkareshwar-temple-madhya-pradesh'];
  if (lowerName.includes('kedarnath himalayan') || (lowerName.includes('kedarnath') && lowerName.includes('himalayan'))) return TEMPLE_IMAGES['jyotirling-kedarnath-temple-uttarakhand'];
  if ((lowerName.includes('grishneshwar') && (lowerName.includes('red') || lowerName.includes('ellora'))) || lowerName.includes('ghrushneshwar')) return TEMPLE_IMAGES['jyotirling-grishneshwar-temple-ellora'];
  if (lowerName.includes('nageshwar darukavana') || (lowerName.includes('nageshwar') && lowerName.includes('dwarka'))) return TEMPLE_IMAGES['jyotirling-nageshwar-temple-dwarka'];
  if (lowerName.includes('ramanathaswamy') && lowerName.includes('corridor')) return TEMPLE_IMAGES['jyotirling-ramanathaswamy-temple-rameswaram'];
  if (lowerName.includes('mallikarjuna srisailam') || (lowerName.includes('mallikarjuna') && lowerName.includes('hills'))) return TEMPLE_IMAGES['jyotirling-mallikarjuna-temple-srisailam'];
  if (lowerName.includes('gopnath mahadev') || lowerName.includes('gopnath')) return TEMPLE_IMAGES['sacred-gopnathmahadev'];
  if (lowerName.includes('trinetreshwar') || lowerName.includes('tarnetar')) return TEMPLE_IMAGES['sacred-trinetreshwar'];

  // Extended Vishnu Temple keyword matching
  if (lowerName.includes('ahobilam') || lowerName.includes('navanarasimha') || lowerName.includes('narasimha')) return TEMPLE_IMAGES['sacred-ahobilamnavanarasimha'];
  if (lowerName.includes('badri vishal') || (lowerName.includes('badrinath') && lowerName.includes('chamoli'))) return TEMPLE_IMAGES['chardham-badrinath-temple-uttarakhand'];
  if (lowerName.includes('ananta vasudeva') || lowerName.includes('anantavasudeva')) return TEMPLE_IMAGES['sacred-anantavasudeva'];
  if (lowerName.includes('venugopala') || lowerName.includes('venugopalaswamy')) return TEMPLE_IMAGES['sacred-venugopalaswamy'];
  if (lowerName.includes('radha raman') || lowerName.includes('radharaman')) return TEMPLE_IMAGES['other-prem-mandir-vrindavan'];
  if (lowerName.includes('radha damodar') || lowerName.includes('damodar')) return TEMPLE_IMAGES['sacred-radhadamodar'];
  if (lowerName.includes('ayodhya ram') || lowerName.includes('ram mandir complex') || lowerName.includes('ayodhya')) return TEMPLE_IMAGES['other-shree-ram-janmabhoomi-mandir-ayodhya'];

  // Extended Devi Temple keyword matching
  if (lowerName.includes('mansa devi') || lowerName.includes('mansadevi')) return TEMPLE_IMAGES['sacred-mansadevi'];
  if (lowerName.includes('mumbadevi') || lowerName.includes('mumbai devi')) return TEMPLE_IMAGES['other-mahalaxmi-temple'];
  if (lowerName.includes('kamakhya') && (lowerName.includes('assam') || lowerName.includes('sanctuary') || lowerName.includes('guwahati'))) return TEMPLE_IMAGES['shaktipeeth-kamakhya-temple-guwahati'];
  if (lowerName.includes('kalighat') && (lowerName.includes('kolkata') || lowerName.includes('kali') || lowerName.includes('shrine'))) return TEMPLE_IMAGES['shaktipeeth-kalighat-kali-temple-kolkata'];
  if (lowerName.includes('kanaka durga') || lowerName.includes('vijayawada')) return TEMPLE_IMAGES['sacred-kanakadurga'];
  if (lowerName.includes('bhramaramba') || lowerName.includes('bhramara') || (lowerName.includes('ambika') && lowerName.includes('srisailam'))) return TEMPLE_IMAGES['jyotirling-mallikarjuna-temple-srisailam'];
  if (lowerName.includes('kateel') || lowerName.includes('durgaparameshwari')) return TEMPLE_IMAGES['healing-mangaladevi-temple-mangalore'];

  // Extended Hanuman Temple keyword matching  
  if (lowerName.includes('pracheen hanuman') || lowerName.includes('marutam') || lowerName.includes('connaught')) return TEMPLE_IMAGES['other-hanuman-garhi-temple-ayodhya'];
  if (lowerName.includes('girgaon') || lowerName.includes('babulnath') || lowerName.includes('girgaum')) return TEMPLE_IMAGES['other-sankat-mochan-hanuman-temple-varanasi'];
  if (lowerName.includes('sankat mochan') && lowerName.includes('shimla')) return TEMPLE_IMAGES['other-jakhu-temple-shimla'];
  if (lowerName.includes('kainchi dham') || lowerName.includes('neem karoli') || lowerName.includes('kainchi')) return TEMPLE_IMAGES['sacred-kainchidham'];
  if (lowerName.includes('bade hanuman') || lowerName.includes('lying hanuman') || (lowerName.includes('hanuman') && lowerName.includes('prayagraj'))) return TEMPLE_IMAGES['other-hanuman-garhi-temple-ayodhya'];
  if (lowerName.includes('bala hanuman') && lowerName.includes('jamnagar')) return TEMPLE_IMAGES['other-sankat-mochan-hanuman-temple-varanasi'];

  // Extended Sacred Places keyword matching
  if (lowerName.includes('palani') || (lowerName.includes('murugan') && lowerName.includes('dindigul'))) return TEMPLE_IMAGES['sacred-palanimurugan'];
  if (lowerName.includes('swamimalai') && lowerName.includes('murugan')) return TEMPLE_IMAGES['sacred-swamimalaimurugan'];
  if (lowerName.includes('tiruttani') || (lowerName.includes('murugan') && lowerName.includes('tiruvallur'))) return TEMPLE_IMAGES['sacred-swamimalaimurugan'];
  if (lowerName.includes('thiruparankundram') || (lowerName.includes('murugan') && lowerName.includes('madurai'))) return TEMPLE_IMAGES['sacred-tiruchendurmurugan'];
  if (lowerName.includes('tiruchendur') && lowerName.includes('murugan')) return TEMPLE_IMAGES['sacred-tiruchendurmurugan'];
  if (lowerName.includes('tovp') || lowerName.includes('vedic planetarium') || lowerName.includes('mayapur') || lowerName.includes('chandrodaya')) return TEMPLE_IMAGES['sacred-templeofvedicplanetarium'];
  if (lowerName.includes('tanot mata') || (lowerName.includes('tanot') && lowerName.includes('jaisalmer'))) return TEMPLE_IMAGES['sacred-tanotmata'];
  if (lowerName.includes('khatu shyam')) return TEMPLE_IMAGES['other-khatu-shyam-ji-temple-sikar'];
  if (lowerName.includes('chamundi hill') || (lowerName.includes('chamundi') && lowerName.includes('mysore'))) return TEMPLE_IMAGES['shaktipeeth-chamundeshwari-temple-mysore'];
  if (lowerName.includes('murudeshwar') && lowerName.includes('coastal')) return TEMPLE_IMAGES['other-murudeshwar-temple-karnataka'];
  if (lowerName.includes('triprayar') || lowerName.includes('sree rama') && lowerName.includes('thrissur')) return TEMPLE_IMAGES['other-guruvayur-temple-kerala'];
  if (lowerName.includes('sree vallabha') || lowerName.includes('thiruvalla')) return TEMPLE_IMAGES['sacred-sree-vallaba'];
  if (lowerName.includes('ambalappuzha') || lowerName.includes('alappuzha')) return TEMPLE_IMAGES['other-guruvayur-temple-kerala'];
  if (lowerName.includes('aranmula') || lowerName.includes('parthasarathy')) return TEMPLE_IMAGES['other-padmanabhaswamy-temple-thiruvananthapuram'];
  if (lowerName.includes('janardhana swamy') || lowerName.includes('varkala')) return TEMPLE_IMAGES['sacred-janardhanaswamy'];
  if (lowerName.includes('srivilliputhur') || lowerName.includes('andal')) return TEMPLE_IMAGES['sacred-srivilliputhurandal'];
  if (lowerName.includes('uppiliappan') || lowerName.includes('oppiliappan')) return TEMPLE_IMAGES['sacred-uppiliappan'];
  if (lowerName.includes('adi kumbeswarar') || (lowerName.includes('kumbeswarar') && lowerName.includes('kumbakonam'))) return TEMPLE_IMAGES['sacred-adikumbeswarar'];
  if (lowerName.includes('varadharaja perumal') || (lowerName.includes('varadharaja') && lowerName.includes('kanchipuram'))) return TEMPLE_IMAGES['sacred-varadharajaperumal'];
  if (lowerName.includes('kamakshi') && lowerName.includes('kanchipuram')) return TEMPLE_IMAGES['sacred-kanchipuram-kamakshi'];
  if (lowerName.includes('thirunageswaram') || lowerName.includes('naganathaswamy') && lowerName.includes('keelaperumpallam')) return TEMPLE_IMAGES['sacred-naganathaswamy'];
  if (lowerName.includes('apatsahayesvarar') || lowerName.includes('alangudi')) return TEMPLE_IMAGES['sacred-apatsahayesvarar'];
  if (lowerName.includes('thingalur') || lowerName.includes('kailasanathar') && lowerName.includes('thingalur')) return TEMPLE_IMAGES['sacred-suryanarkovil'];
  if (lowerName.includes('agniswarar') || lowerName.includes('kanchanur')) return TEMPLE_IMAGES['sacred-suryanarkovil'];
  if (lowerName.includes('dharbaranyeswarar') || lowerName.includes('thirunallar')) return TEMPLE_IMAGES['sacred-dharbaranyeswarar'];
  if (lowerName.includes('naganathaswamy') && lowerName.includes('keelaperumpallam')) return TEMPLE_IMAGES['sacred-naganathaswamy'];
  if (lowerName.includes('suryanar') || lowerName.includes('suryanar kovil')) return TEMPLE_IMAGES['sacred-suryanarkovil'];
  if (lowerName.includes('draksharamam') || lowerName.includes('bheemeswara') && lowerName.includes('kakinada')) return TEMPLE_IMAGES['sacred-kondagattuanjaneyaswamy'];
  if (lowerName.includes('amareswara') || lowerName.includes('amaravati')) return TEMPLE_IMAGES['sacred-amareswaraswamy'];
  if (lowerName.includes('ksheera ramalingeswara') || lowerName.includes('palakollu')) return TEMPLE_IMAGES['sacred-ksheeraramalingeswara'];
  if (lowerName.includes('kumara bhimeswara') || lowerName.includes('samalkota')) return TEMPLE_IMAGES['sacred-kondagattuanjaneyaswamy'];
  if (lowerName.includes('yadadri') || lowerName.includes('lakshmi narasimha') && lowerName.includes('yadadri')) return TEMPLE_IMAGES['sacred-ahobilamnavanarasimha'];
  if (lowerName.includes('sita ramachandra') || lowerName.includes('bhadrachalam')) return TEMPLE_IMAGES['sacred-bhadrachalam-temple'];
  if (lowerName.includes('thousand pillar') || lowerName.includes('warangal')) return TEMPLE_IMAGES['sacred-kondagattuanjaneyaswamy'];
  if (lowerName.includes('gnana saraswathi') || lowerName.includes('basar')) return TEMPLE_IMAGES['sacred-mahavirmandir'];
  if (lowerName.includes('kondagattu') || lowerName.includes('anjaneya swamy')) return TEMPLE_IMAGES['sacred-kondagattuanjaneyaswamy'];
  if (lowerName.includes('patan devi') || lowerName.includes('patna devi')) return TEMPLE_IMAGES['sacred-mansadevi'];
  if (lowerName.includes('mahavir mandir') || (lowerName.includes('mahavir') && lowerName.includes('patna'))) return TEMPLE_IMAGES['sacred-mahavirmandir'];
  if (lowerName.includes('punaura dham') || lowerName.includes('janaki mandir') || lowerName.includes('sitamarhi')) return TEMPLE_IMAGES['sacred-mansadevi'];
  if (lowerName.includes('mundeshwari') || lowerName.includes('kaimur')) return TEMPLE_IMAGES['sacred-mansadevi'];
  if (lowerName.includes('ramnagar fort') || lowerName.includes('vibhuti narayan')) return TEMPLE_IMAGES['sacred-gita-mandir'];
  if (lowerName.includes('naina devi') && lowerName.includes('nainital')) return TEMPLE_IMAGES['shaktipeeth-naina-devi-temple-bilaspur'];
  if (lowerName.includes('dhari devi') || lowerName.includes('srinagar garhwal')) return TEMPLE_IMAGES['sacred-dharidevi'];
  if (lowerName.includes('kasar devi') || (lowerName.includes('kasar') && lowerName.includes('almora'))) return TEMPLE_IMAGES['sacred-kasardevi'];
  if (lowerName.includes('purnagiri') || lowerName.includes('champawat')) return TEMPLE_IMAGES['sacred-mansadevi'];
  if (lowerName.includes('hidimba') || lowerName.includes('hadimba')) return TEMPLE_IMAGES['sacred-hidimbadevi'];
  if (lowerName.includes('bijli mahadev') || (lowerName.includes('bijli') && lowerName.includes('kullu'))) return TEMPLE_IMAGES['sacred-bijlimahadev'];
  if (lowerName.includes('vashisht') || (lowerName.includes('hot springs') && lowerName.includes('manali'))) return TEMPLE_IMAGES['sacred-vashishttemple'];
  if (lowerName.includes('triloknath') || lowerName.includes('lahaul')) return TEMPLE_IMAGES['triloknathtemplelahaulvalley'];
  if (lowerName.includes('birla mandir') || lowerName.includes('laxmi narayan') && lowerName.includes('jaipur')) return TEMPLE_IMAGES['other-govind-dev-ji-temple-jaipur'];
  if (lowerName.includes('akshardham') || lowerName.includes('swaminarayan') && lowerName.includes('delhi')) return TEMPLE_IMAGES['other-shree-ram-janmabhoomi-mandir-ayodhya'];
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