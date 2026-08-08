import { ImageSourcePropType } from 'react-native';

const TEMPLE_IMAGES: Record<string, ImageSourcePropType> = {
  // Jyotirlingas
  'jyotirling-somnath-temple-gujarat': require('../../assets/images/imagetemple/SomnathTemple.webp'),
  'jyotirling-kedarnath-temple-uttarakhand': require('../../assets/images/imagetemple/KedarnathTemple.webp'),
  'jyotirling-mahakaleshwar-temple-ujjain': require('../../assets/images/imagetemple/MahakalTemple.webp'),
  'jyotirling-kashi-vishwanath-temple-varanasi': require('../../assets/images/imagetemple/Kashi_Vishwanath.webp'),
  'jyotirling-bhimashankar-temple-maharashtra': require('../../assets/images/imagetemple/Mamleshwar.webp'),
  'jyotirling-ramanathaswamy-temple-rameswaram': require('../../assets/images/imagetemple/Ramanathaswamy-temple.webp'),
  'jyotirling-grishneshwar-temple-maharashtra': require('../../assets/images/imagetemple/Grishneshwar.webp'),
  'jyotirling-grishneshwar-temple-ellora': require('../../assets/images/imagetemple/Grishneshwar.webp'),
  'jyotirling-omkareshwar-temple-madhya-pradesh': require('../../assets/images/imagetemple/Okareshwar.webp'),
  'jyotirling-trimbakeshwar-temple-maharashtra': require('../../assets/images/imagetemple/TrimbakehwarTemple.webp'),
  'jyotirling-trimbakeshwar-temple-nashik': require('../../assets/images/imagetemple/TrimbakehwarTemple.webp'),
  'jyotirling-nageshwar-temple-gujarat': require('../../assets/images/imagetemple/Nageshwar.webp'),
  'jyotirling-nageshwar-temple-dwarka': require('../../assets/images/imagetemple/Nageshwar.webp'),
  'jyotirling-mallikarjuna-temple-andhra-pradesh': require('../../assets/images/imagetemple/Mallikarjuna.webp'),
  'jyotirling-mallikarjuna-temple-srisailam': require('../../assets/images/imagetemple/Mallikarjuna.webp'),
  'jyotirling-baidyanath-temple-jharkhand': require('../../assets/images/imagetemple/Baidyanath.webp'),
  'jyotirling-baidyanath-temple-deoghar': require('../../assets/images/imagetemple/Baidyanath.webp'),
  
  // Sacred / Others & Char Dham
  'other-tirupati-balaji-temple-andhra-pradesh': require('../../assets/images/imagetemple/Tirumala_090615.webp'),
  'other-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/imagetemple/VaishnoDeviTemple.webp'),
  'other-siddhivinayak-temple-mumbai': require('../../assets/images/imagetemple/Siddhivinayak.webp'),
  'other-shree-siddhivinayak-temple': require('../../assets/images/imagetemple/Siddhivinayak.webp'),
  'other-shirdi-sai-baba-temple-maharashtra': require('../../assets/images/imagetemple/Sai_Baba.webp'),
  'other-jagannath-temple-puri': require('../../assets/images/imagetemple/Jaganath.webp'),
  'chardham-jagannath-temple-puri': require('../../assets/images/imagetemple/Jaganath.webp'),
  'chardham-badrinath-temple-uttarakhand': require('../../assets/images/imagetemple/badrinath.webp'),
  'chardham-gangotri-temple-uttarakhand': require('../../assets/images/imagetemple/gangotri.webp'),
  'chardham-yamunotri-temple-uttarakhand': require('../../assets/images/imagetemple/yamunotritemple.webp'),
  'chardham-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.webp'),
  'other-golden-temple-amritsar': require('../../assets/images/imagetemple/GoldenTemple.webp'),
  'other-meenakshi-temple-madurai': require('../../assets/images/imagetemple/MeenakshiTemple.webp'),
  'other-iskcon-temple-bangalore-karnataka': require('../../assets/images/imagetemple/ISKCON_Bangalore.webp'),
  'other-iskcon-bangalore-aarti': require('../../assets/images/imagetemple/ISKCON_Bangalore.webp'),
  'other-iskcon-mira-road-thane': require('../../assets/images/imagetemple/ISKCON_Mira_Road.webp'),
  'other-iskcon-temple-mumbai': require('../../assets/images/imagetemple/ISKCON_Juhu.webp'),
  'other-iskcon-juhu': require('../../assets/images/imagetemple/ISKCON_Juhu.webp'),
  'other-iskcon-temple-mumbai-juhu': require('../../assets/images/imagetemple/ISKCON_Juhu.webp'),
  'other-mahalaxmi-temple': require('../../assets/images/imagetemple/mahalaxmi.webp'),
  'other-shri-dwarkadhish-temple-dwarka': require('../../assets/images/dwarakadhish.webp'),

  // Shakti Peethas (from assets/images/shaktipeeth)
  'shaktipeeth-kamakhya-temple-guwahati': require('../../assets/images/imagetemple/kamakhya.webp'),
  'shakti-kamakhya-temple-assam': require('../../assets/images/imagetemple/kamakhya.webp'),
  'shaktipeeth-kalighat-kali-temple-kolkata': require('../../assets/images/imagetemple/kalighat.webp'),
  'shakti-kalighat-temple-kolkata': require('../../assets/images/imagetemple/kalighat.webp'),
  'shaktipeeth-tarapith-temple-birbhum': require('../../assets/images/imagetemple/tarapith.webp'),
  'shakti-tarapith-temple-bengal': require('../../assets/images/imagetemple/tarapith.webp'),
  'shaktipeeth-ambaji-temple-gujarat': require('../../assets/images/imagetemple/ambaji.webp'),
  'shakti-ambaji-temple-gujarat': require('../../assets/images/imagetemple/ambaji.webp'),
  'shaktipeeth-vaishno-devi-temple-jammu-kashmir': require('../../assets/images/imagetemple/vaishnodevi.webp'),
  'shaktipeeth-jwala-ji-temple-kangra': require('../../assets/images/imagetemple/jwala.webp'),
  'shaktipeeth-chinnamasta-temple-rajarappa': require('../../assets/images/imagetemple/chinnamasta.webp'),
  'shaktipeeth-mahalaxmi-temple-kolhapur': require('../../assets/images/imagetemple/mahalaxmi.webp'),
  'shaktipeeth-chamundeshwari-temple-mysore': require('../../assets/images/imagetemple/chamundeshwari.webp'),
  'shakti-chamundeshwari-temple-mysore': require('../../assets/images/imagetemple/chamundeshwari.webp'),
  'shaktipeeth-vindhyavasini-temple-vindhyachal': require('../../assets/images/imagetemple/vindhyavasini.webp'),
  'shaktipeeth-kamakhya-kanya-kumari-temple': require('../../assets/images/imagetemple/kanyakumari.webp'),
  'shaktipeeth-sharda-peeth-kashmir': require('../../assets/images/imagetemple/sharadapeeth.webp'),
  'shaktipeeth-hinglaj-devi-rajasthan': require('../../assets/images/imagetemple/hinglajmata.webp'),
  'shaktipeeth-tripora-sundari-temple-tripura': require('../../assets/images/imagetemple/tripurasundari.webp'),
  'shaktipeeth-attahas-temple-birbhum': require('../../assets/images/imagetemple/Attahas-Shaktipeeth.webp'),
  'shaktipeeth-bakreshwar-temple-birbhum': require('../../assets/images/imagetemple/Bakreswar.webp'),
  'shaktipeeth-nalateswari-temple-nalhati': require('../../assets/images/imagetemple/nalateswari.webp'),
  'shaktipeeth-jogadya-temple-burdwan': require('../../assets/images/imagetemple/jogadya.webp'),
  'shaktipeeth-kankalitala-temple-bolpur': require('../../assets/images/imagetemple/kankalitala.webp'),
  'shaktipeeth-bhavani-mandir-tuljapur': require('../../assets/images/imagetemple/tuljabhavani.webp'),
  'shaktipeeth-renuka-devi-temple-mahur': require('../../assets/images/imagetemple/renukadevi.webp'),
  'shaktipeeth-saptashrungi-temple-nashik': require('../../assets/images/imagetemple/saptashrungi.webp'),
  'shaktipeeth-danteshwari-temple-dantewada': require('../../assets/images/imagetemple/danteshwari.webp'),
  'shaktipeeth-chamunda-devi-temple-kangra': require('../../assets/images/imagetemple/Chamundatemple.webp'),
  'shaktipeeth-naina-devi-temple-bilaspur': require('../../assets/images/imagetemple/Nainadevi.webp'),
  'shaktipeeth-brareshwari-devi-temple-kangra': require('../../assets/images/imagetemple/brajeshwari.webp'),
  'shaktipeeth-chintpurni-devi-temple-una': require('../../assets/images/imagetemple/chintpurni.webp'),
  'shaktipeeth-alopi-devi-temple-prayagraj': require('../../assets/images/imagetemple/alopi-devi-mandir.webp'),
  'shaktipeeth-devi-patan-temple-balrampur': require('../../assets/images/imagetemple/devipatan.webp'),
  'shaktipeeth-harsiddhi-mata-temple-ujjain': require('../../assets/images/imagetemple/harsiddhi.webp'),
  'shaktipeeth-sharada-devi-temple-maihar': require('../../assets/images/imagetemple/maihardevi.webp'),
  'shaktipeeth-biraja-temple-jajpur': require('../../assets/images/imagetemple/biraja.webp'),
  'shaktipeeth-tara-tarini-temple-ganjam': require('../../assets/images/imagetemple/taratarini.webp'),

  // Healing Temples (from assets/images/healingtemple)
  'healing-ramanasramam-tiruvannamalai': require('../../assets/images/imagetemple/SriRamana.webp'),
  'healing-dhyanalinga-isha-coimbatore': require('../../assets/images/imagetemple/dhyanalinga.webp'),
  'healing-virupaksha-temple-hampi': require('../../assets/images/imagetemple/virupaksha.webp'),
  'healing-anandamayi-ma-ashram-haridwar': require('../../assets/images/imagetemple/AnandamayiAshram.webp'),
  'hanuman-mehendipur-balaji-temple-dausa': require('../../assets/images/imagetemple/Mehandipurbalaji.webp'),
  'healing-parmarth-niketan-rishikesh': require('../../assets/images/imagetemple/ParmarthNiketan.webp'),
  'healing-sri-aurobindo-ashram-puducherry': require('../../assets/images/imagetemple/SriAurobindo.webp'),
  'sacred-belur-math-ramakrishna-mission': require('../../assets/images/imagetemple/BelurMath.webp'),
  'healing-sarnath-buddhist-monastery': require('../../assets/images/imagetemple/sarnathvaranasi.webp'),
  'sacred-mahabodhi-temple-bodh-gaya': require('../../assets/images/imagetemple/mahabodhi.webp'),
  'devi-kollur-mookambika-temple': require('../../assets/images/imagetemple/kollurmookambika.webp'),
  'devi-chottanikara-temple-kochi': require('../../assets/images/imagetemple/Chottanikkara.webp'),
  'sacred-vaitheeswaran-koil-mayiladuthurai': require('../../assets/images/imagetemple/Vaitheeswaran.webp'),
  'healing-parli-vaijnath-temple': require('../../assets/images/imagetemple/parliVajinath.webp'),
  'healing-dhanvantari-temple-kerala': require('../../assets/images/imagetemple/SriDhanvantari.webp'),
  'sacred-suchindram-thanumalayan-temple': require('../../assets/images/imagetemple/SuchindramThanumalay.webp'),
  'healing-ghati-subramanya-temple': require('../../assets/images/imagetemple/GhatiSubramanyaTemple.webp'),
  'panchbhoota-srikalahasteeswara-temple-srikalahasti': require('../../assets/images/imagetemple/Srikalahasteeswara.webp'),
  'sacred-kukke-subramanya-temple': require('../../assets/images/imagetemple/KukkeSubramanya.webp'),
  'healing-mangaladevi-temple-mangalore': require('../../assets/images/imagetemple/Mangaladevi.webp'),

  // Sacred Places & Shrines (from assets/images/sacred)
  'sacred-assi-ghat': require('../../assets/images/imagetemple/Assi_Ghat.webp'),
  'sacred-bhalka-tirth-shrine': require('../../assets/images/imagetemple/BhalkaTirthShrine.webp'),
  'sacred-bhartrihari-caves': require('../../assets/images/imagetemple/Bhartrihari.webp'),
  'sacred-daulatabad-fort': require('../../assets/images/imagetemple/Daulatabad.webp'),
  'sacred-ellora-kailasa-temple': require('../../assets/images/imagetemple/ElloraKailasa.webp'),
  'sacred-gautam-rishi-ashram': require('../../assets/images/imagetemple/GautamRishiAshram.webp'),
  'sacred-gyanvapi-kund': require('../../assets/images/imagetemple/Gyanvapi.webp'),
  'sacred-manikarnika-ghat': require('../../assets/images/imagetemple/Manikarnika_Ghat.webp'),
  'sacred-naulakha-mandir': require('../../assets/images/imagetemple/Naulakha.webp'),
  'sacred-sandipani-ashram': require('../../assets/images/imagetemple/SandipaniAshram.webp'),
  'sacred-shiva-trats-kund': require('../../assets/images/imagetemple/ShivaTrats.webp'),
  'sacred-sonprayag-sangam': require('../../assets/images/imagetemple/SonprayagSangam.webp'),
  'sacred-tapovan-caves': require('../../assets/images/imagetemple/Tapovancaves.webp'),
  'sacred-triveni-sangam-ghat': require('../../assets/images/imagetemple/Triveni-Ghat.webp'),
  'sacred-baan-stambh': require('../../assets/images/imagetemple/baan.webp'),
  'sacred-bhairavnath-mandir': require('../../assets/images/imagetemple/bhairavnath.webp'),
  'sacred-dashashwamedh-ghat': require('../../assets/images/imagetemple/dashashwamedh-ghat.webp'),
  'sacred-gandhi-sarovar': require('../../assets/images/imagetemple/gandhisarvor.webp'),
  'sacred-gita-mandir': require('../../assets/images/imagetemple/gitamandir.webp'),
  'sacred-ram-ghat': require('../../assets/images/imagetemple/ramghat.webp'),
  'sacred-shivganga-kund': require('../../assets/images/imagetemple/shivganga.webp'),
  'sacred-trikuta-parvat': require('../../assets/images/imagetemple/trikuta.webp'),
  'sacred-vasuki-tal': require('../../assets/images/imagetemple/vasukital.webp'),

  // Ashtavinayak Shrines
  'ashtavinayak-mayureshwar-temple-morgaon': require('../../assets/images/imagetemple/mayureshwar.webp'),
  'ashtavinayak-siddhivinayak-temple-siddhatek': require('../../assets/images/imagetemple/Siddhivinayak-Temple.webp'),
  'ashtavinayak-ballaleshwar-temple-pali': require('../../assets/images/imagetemple/ballaleshwar.webp'),
  'ashtavinayak-varadhavinayak-temple-mahad': require('../../assets/images/imagetemple/VaradVinayak.webp'),
  'ashtavinayak-chintamani-temple-theur': require('../../assets/images/imagetemple/chintamani.webp'),
  'ashtavinayak-girijatmak-temple-lenyadri': require('../../assets/images/imagetemple/Girijatmaj.webp'),
  'ashtavinayak-vighnahar-temple-ozar': require('../../assets/images/imagetemple/Vighnahar.webp'),
  'ashtavinayak-mahaganapati-temple-ranjangaon': require('../../assets/images/imagetemple/Mahaganapati.webp'),

  // Panchbhoota Shrines
  'panchbhoota-ekambareswarar-temple-kanchipuram': require('../../assets/images/imagetemple/Ekambareshwar.webp'),
  'panchbhoota-jambukeswarar-temple-thiruvanaikaval': require('../../assets/images/imagetemple/jambukeswarar.webp'),
  'panchbhoota-arunachaleswarar-temple-thiruvannamalai': require('../../assets/images/imagetemple/Arunachaleswarar.webp'),
  'panchbhoota-thillai-nataraja-temple-chidambaram': require('../../assets/images/imagetemple/ThillaiNataraja.webp'),

  // Additional Sacred Temples in Sacred Folder
  'vishnu-bankey-bihari-temple-vrindavan': require('../../assets/images/imagetemple/Bankebihari_temple.webp'),
  'other-brahma-temple-pushkar': require('../../assets/images/imagetemple/Brahma_Temple.webp'),
  'other-brihadisvara-temple-thanjavur': require('../../assets/images/imagetemple/Brihadisvara.webp'),
  'other-dakshineswar-kali-temple-kolkata': require('../../assets/images/imagetemple/Dakshineswar-Kali-Temple.webp'),
  'other-dwarkadhish-temple-mathura': require('../../assets/images/imagetemple/DwarkadhishMathura.webp'),
  'other-govind-dev-ji-temple-jaipur': require('../../assets/images/imagetemple/GovindDev.webp'),
  'other-guruvayur-temple-kerala': require('../../assets/images/imagetemple/Guruvayur.webp'),
  'other-jakhu-temple-shimla': require('../../assets/images/imagetemple/Jakhu.webp'),
  'other-kalaram-temple-nashik': require('../../assets/images/imagetemple/Kalaram.webp'),
  'other-kashtabhanjan-dev-hanumanji-sarangpur': require('../../assets/images/imagetemple/Kashtabhanjan.webp'),
  'other-khatu-shyam-ji-temple-sikar': require('../../assets/images/imagetemple/KhatuShyam.webp'),
  'other-lingaraj-temple-bhubaneswar': require('../../assets/images/imagetemple/Lingaraj.webp'),
  'other-murudeshwar-temple-karnataka': require('../../assets/images/imagetemple/Murudeshwara.webp'),
  'other-neelkanth-mahadev-temple-rishikesh': require('../../assets/images/imagetemple/NeelKanth.webp'),
  'other-pashupatinath-temple-mandsaur': require('../../assets/images/imagetemple/Pashupatinath.webp'),
  'other-prem-mandir-vrindavan': require('../../assets/images/imagetemple/Premmandir.webp'),
  'other-salasar-balaji-temple-churu': require('../../assets/images/imagetemple/SalasarBalaji.webp'),
  'other-sankat-mochan-hanuman-temple-varanasi': require('../../assets/images/imagetemple/Sankatmochan.webp'),
  'other-shrinathji-temple-nathdwara': require('../../assets/images/imagetemple/Shreenathjitemple.webp'),
  'other-shree-ram-janmabhoomi-mandir-ayodhya': require('../../assets/images/imagetemple/Shri_Ram_Janambhoomi_Mandir.webp'),
  'other-padmanabhaswamy-temple-thiruvananthapuram': require('../../assets/images/imagetemple/Sree_Padmanabhaswamy.webp'),
  'other-sri-ranganathaswamy-temple-srirangam': require('../../assets/images/imagetemple/SriRanganathaswamy.webp'),
  'other-sun-temple-modhera': require('../../assets/images/imagetemple/SunTemple.webp'),
  'other-triyuginarayan-temple-rudraprayag': require('../../assets/images/imagetemple/Triyuginarayan.webp'),
  'other-tungnath-temple-chopta': require('../../assets/images/imagetemple/Tungnath.webp'),
  'other-udupi-sri-krishna-matha': require('../../assets/images/imagetemple/Udupi_Sri_Krishna_Matha_Temple.webp'),
  'other-vithoba-temple-pandharpur': require('../../assets/images/imagetemple/Vithoba.webp'),
  'other-hanuman-garhi-temple-ayodhya': require('../../assets/images/imagetemple/hanumangarhi.webp'),
  'hanuman-hanumangarhi-temple-ayodhya': require('../../assets/images/imagetemple/hanumangarhi.webp'),
  'other-iskcon-temple-vrindavan': require('../../assets/images/imagetemple/iskconVrindavan.webp'),
  'vishnu-iskcon-temple-vrindavan': require('../../assets/images/imagetemple/iskconVrindavan.webp'),
  'vishnu-iskcon-temple-bangalore-karnataka': require('../../assets/images/imagetemple/ISKCON_Bangalore.webp'),
  'vishnu-iskcon-mira-road-thane': require('../../assets/images/imagetemple/ISKCON_Mira_Road.webp'),
  'vishnu-iskcon-temple-mumbai': require('../../assets/images/imagetemple/ISKCON_Juhu.webp'),
  'other-karni-mata-temple-deshnoke': require('../../assets/images/imagetemple/karnimata.webp'),
  'other-shri-krishna-janmasthan-mathura': require('../../assets/images/imagetemple/krishnajanmasthan.webp'),
  'other-sabarimala-sree-dharma-sastha-temple': require('../../assets/images/imagetemple/sabarimala.webp'),

  // Direct backend DB seed ID mappings for Vishnu / Krishna / Ram
  'vishnu-tirupati-balaji-temple-andhra-pradesh': require('../../assets/images/imagetemple/Tirumala_090615.webp'),
  'vishnu-sri-ranganathaswamy-temple-srirangam': require('../../assets/images/imagetemple/SriRanganathaswamy.webp'),
  'vishnu-guruvayur-temple-kerala': require('../../assets/images/imagetemple/Guruvayur.webp'),
  'vishnu-padmanabhaswamy-temple-thiruvananthapuram': require('../../assets/images/imagetemple/Sree_Padmanabhaswamy.webp'),
  'vishnu-prem-mandir-vrindavan': require('../../assets/images/imagetemple/Premmandir.webp'),
  'vishnu-shri-ram-mandir-ayodhya': require('../../assets/images/imagetemple/Shri_Ram_Janambhoomi_Mandir.webp'),
  'vishnu-dwarakadheesh-temple-mathura': require('../../assets/images/imagetemple/DwarkadhishMathura.webp'),
  'vishnu-krishna-janmabhoomi-mathura': require('../../assets/images/imagetemple/krishnajanmasthan.webp'),
  'vishnu-radha-raman-temple-vrindavan': require('../../assets/images/imagetemple/shri-radha-raman.webp'),
  'vishnu-radha-damodar-temple-vrindavan': require('../../assets/images/imagetemple/RadhaDamodar.webp'),
  'vishnu-govind-dev-ji-temple-jaipur': require('../../assets/images/imagetemple/GovindDev.webp'),
  'vishnu-nathdwara-shrinathji-temple': require('../../assets/images/imagetemple/Shreenathjitemple.webp'),
  'vishnu-kalaram-temple-nashik': require('../../assets/images/imagetemple/Kalaram.webp'),
  'vishnu-vitthal-temple-pandharpur': require('../../assets/images/imagetemple/Vithoba.webp'),
  'vishnu-venugopala-swamy-temple-mysore': require('../../assets/images/imagetemple/VenugopalaSwamy.webp'),
  'vishnu-chennakesava-temple-belur': require('../../assets/images/imagetemple/Chennakesava.webp'),
  'vishnu-simhachalam-temple-visakhapatnam': require('../../assets/images/imagetemple/VarahaLakshmiNarasimha.webp'),
  'vishnu-ahobilam-narasimha-temple': require('../../assets/images/imagetemple/AhobilamNavanarasimha.webp'),
  'vishnu-badrinath-dham-chamoli': require('../../assets/images/imagetemple/badrinath.webp'),
  'vishnu-badrinath-temple-char-dham': require('../../assets/images/imagetemple/badrinath.webp'),
  'vishnu-ananta-vasudeva-temple-bhubaneswar': require('../../assets/images/imagetemple/AnantaVasudeva.webp'),

  // Direct backend DB seed ID mappings for Shiva
  'shiva-lingaraj-temple-bhubaneswar': require('../../assets/images/imagetemple/Lingaraj.webp'),
  'shiva-brihadisvara-temple-thanjavur': require('../../assets/images/imagetemple/Brihadisvara.webp'),
  'shiva-amarnath-cave-temple-kashmir': require('../../assets/images/imagetemple/Amarnath.webp'),
  'shiva-tungnath-temple-chopta': require('../../assets/images/imagetemple/Tungnath.webp'),
  'shiva-pashupatinath-temple-mandsaur': require('../../assets/images/imagetemple/Pashupatinath.webp'),
  'shiva-bhojeshwar-temple-bhojpur': require('../../assets/images/imagetemple/Bhojeshwar.webp'),
  'shiva-murudeshwar-temple-karnataka': require('../../assets/images/imagetemple/Murudeshwara.webp'),
  'shiva-pashupatinath-temple-nepal-border': require('../../assets/images/imagetemple/Pashupatinath.webp'),
  'shiva-trimbakeshwar-dham-nashik': require('../../assets/images/imagetemple/TrimbakehwarTemple.webp'),
  'shiva-bhimashankar-jyotirling-pune': require('../../assets/images/imagetemple/Mamleshwar.webp'),
  'shiva-somnath-patan-gujarat': require('../../assets/images/imagetemple/SomnathTemple.webp'),
  'shiva-tarakeshwar-temple-hooghly': require('../../assets/images/imagetemple/Tarakeshwar.webp'),
  'shiva-baba-dham-deoghar': require('../../assets/images/imagetemple/Baidyanath.webp'),
  'shiva-kashi-vishwanath-corridor-varanasi': require('../../assets/images/imagetemple/Kashi_Vishwanath.webp'),
  'shiva-mahakaleshwar-bhasma-temple': require('../../assets/images/imagetemple/MahakalTemple.webp'),
  'shiva-omkareshwar-island-khandwa': require('../../assets/images/imagetemple/Okareshwar.webp'),
  'shiva-kedarnath-himalayan-shrine': require('../../assets/images/imagetemple/KedarnathTemple.webp'),
  'shiva-grishneshwar-ellora-caves': require('../../assets/images/imagetemple/Grishneshwar.webp'),
  'shiva-nageshwar-darukavana-gujarat': require('../../assets/images/imagetemple/Nageshwar.webp'),
  'shiva-ramanathaswamy-corridor-rameswaram': require('../../assets/images/imagetemple/Ramanathaswamy-temple.webp'),
  'shiva-mallikarjuna-srisailam-hills': require('../../assets/images/imagetemple/Mallikarjuna.webp'),
  'shiva-kapaleeshwarar-temple-chennai': require('../../assets/images/imagetemple/kapaleeshwarar.webp'),
  'shiva-vadakkunnathan-temple-thrissur': require('../../assets/images/imagetemple/Vadakkunnathan.webp'),
  'shiva-chinnamastika-shiva-temple': require('../../assets/images/imagetemple/bhairavnath.webp'),
  'shiva-kotilingeshwara-temple-kolar': require('../../assets/images/imagetemple/Kotilingeshwara.webp'),

  // Direct backend DB seed ID mappings for Devi
  'devi-meenakshi-temple-madurai': require('../../assets/images/imagetemple/MeenakshiTemple.webp'),
  'devi-mahalaxmi-temple-mumbai': require('../../assets/images/imagetemple/mahalaxmi.webp'),
  'devi-mumbadevi-temple-mumbai': require('../../assets/images/imagetemple/mumba-devi.webp'),
  'devi-mansa-devi-temple-haridwar': require('../../assets/images/imagetemple/MansaDevi.webp'),
  'devi-chandi-devi-temple-haridwar': require('../../assets/images/imagetemple/chandi-devi.webp'),
  'devi-kamakhya-peeth-guwahati': require('../../assets/images/imagetemple/kamakhya.webp'),
  'devi-kalighat-mandir-kolkata': require('../../assets/images/imagetemple/kalighat.webp'),
  'devi-dakshineswar-kali-temple-kolkata': require('../../assets/images/imagetemple/Dakshineswar-Kali-Temple.webp'),
  'devi-kanaka-durga-temple-vijayawada': require('../../assets/images/imagetemple/KanakaDurga.webp'),
  'devi-sree-bhadrakali-temple-attukal': require('../../assets/images/imagetemple/Attukal.webp'),
  'devi-bhramara-ambika-temple-srisailam': require('../../assets/images/imagetemple/chamundeshwari.webp'),
  'devi-katil-durgaparameshwari-temple': require('../../assets/images/imagetemple/KateelDurgaparameshwari.webp'),
  'devi-horanadu-annapoorneshwari-temple': require('../../assets/images/imagetemple/Annapoorneshwari.webp'),

  // Direct backend DB seed ID mappings for Hanuman
  'hanuman-kashtabhanjan-dev-temple-sarangpur': require('../../assets/images/imagetemple/Kashtabhanjan.webp'),
  'hanuman-marutam-temple-connaught-place': require('../../assets/images/imagetemple/PracheenHanuman.webp'),
  'hanuman-maruti-temple-girgaum': require('../../assets/images/imagetemple/Babulnath.webp'),
  'hanuman-sankat-mochan-shimla': require('../../assets/images/imagetemple/Sankatmochan.webp'),
  'hanuman-kainchi-dham-neem-karoli': require('../../assets/images/imagetemple/KainchiDham.webp'),
  'hanuman-bade-hanuman-mandir-prayagraj': require('../../assets/images/imagetemple/BadeHanumanMandir.webp'),
  'hanuman-hanuman-garhi-ayodhya': require('../../assets/images/imagetemple/hanumangarhi.webp'),
  'hanuman-salasar-balaji-temple-churu': require('../../assets/images/imagetemple/SalasarBalaji.webp'),

  // Comprehensive Sacred Folder Assets & DB Temple Mappings
  'sacred-adikumbeswarar': require('../../assets/images/imagetemple/AdiKumbeswarar.webp'),
  'sacred-agniswarar': require('../../assets/images/imagetemple/Agniswarar.webp'),
  'sacred-ahobilamnavanarasimha': require('../../assets/images/imagetemple/AhobilamNavanarasimha.webp'),
  'sacred-amareswaraswamy': require('../../assets/images/imagetemple/AmareswaraSwamy.webp'),
  'sacred-amarnath': require('../../assets/images/imagetemple/Amarnath.webp'),
  'sacred-ambalappuzha-sri-krishna-temple': require('../../assets/images/imagetemple/Ambalappuzha_Sri_Krishna_Temple.webp'),
  'sacred-anantavasudeva': require('../../assets/images/imagetemple/AnantaVasudeva.webp'),
  'sacred-annapoorneshwari': require('../../assets/images/imagetemple/Annapoorneshwari.webp'),
  'sacred-apatsahayesvarar': require('../../assets/images/imagetemple/Apatsahayesvarar.webp'),
  'sacred-aranmula-parthasarathy': require('../../assets/images/imagetemple/Aranmula_Parthasarathy.webp'),
  'sacred-arunachaleswarar': require('../../assets/images/imagetemple/Arunachaleswarar.webp'),
  'sacred-attukal': require('../../assets/images/imagetemple/Attukal.webp'),
  'sacred-babulnath': require('../../assets/images/imagetemple/Babulnath.webp'),
  'sacred-badehanumanmandir': require('../../assets/images/imagetemple/BadeHanumanMandir.webp'),
  'sacred-baijnath': require('../../assets/images/imagetemple/Baijnath.webp'),
  'sacred-bankebihari-temple': require('../../assets/images/imagetemple/Bankebihari_temple.webp'),
  'sacred-bhadrachalam-temple': require('../../assets/images/imagetemple/Bhadrachalam_temple.webp'),
  'sacred-bhalkatirthshrine': require('../../assets/images/imagetemple/BhalkaTirthShrine.webp'),
  'sacred-bhartrihari': require('../../assets/images/imagetemple/Bhartrihari.webp'),
  'sacred-bhojeshwar': require('../../assets/images/imagetemple/Bhojeshwar.webp'),
  'sacred-bijlimahadev': require('../../assets/images/imagetemple/BijliMahadev.webp'),
  'sacred-birla-temple': require('../../assets/images/imagetemple/Birla-Temple.webp'),
  'sacred-brahma-temple': require('../../assets/images/imagetemple/Brahma_Temple.webp'),
  'sacred-brihadisvara': require('../../assets/images/imagetemple/Brihadisvara.webp'),
  'sacred-chamundi': require('../../assets/images/imagetemple/Chamundi.webp'),
  'sacred-chennakesava': require('../../assets/images/imagetemple/Chennakesava.webp'),
  'sacred-chottanikkara': require('../../assets/images/imagetemple/Chottanikkara.webp'),
  'sacred-dakshineswar-kali-temple': require('../../assets/images/imagetemple/Dakshineswar-Kali-Temple.webp'),
  'sacred-daulatabad': require('../../assets/images/imagetemple/Daulatabad.webp'),
  'sacred-dharbaranyeswarar': require('../../assets/images/imagetemple/Dharbaranyeswarar.webp'),
  'sacred-dharidevi': require('../../assets/images/imagetemple/DhariDevi.webp'),
  'sacred-draksharama-temple': require('../../assets/images/imagetemple/Draksharama_temple.webp'),
  'sacred-dwarkadhishmathura': require('../../assets/images/imagetemple/DwarkadhishMathura.webp'),
  'sacred-ekambareshwar': require('../../assets/images/imagetemple/Ekambareshwar.webp'),
  'sacred-ellorakailasa': require('../../assets/images/imagetemple/ElloraKailasa.webp'),
  'sacred-gautamrishiashram': require('../../assets/images/imagetemple/GautamRishiAshram.webp'),
  'sacred-girijatmaj': require('../../assets/images/imagetemple/Girijatmaj.webp'),
  'sacred-gnanasaraswathi': require('../../assets/images/imagetemple/GnanaSaraswathi.webp'),
  'sacred-gommateshwara': require('../../assets/images/imagetemple/Gommateshwara.webp'),
  'sacred-gopnathmahadev': require('../../assets/images/imagetemple/GopnathMahadev.webp'),
  'sacred-gorakhnath': require('../../assets/images/imagetemple/Gorakhnath.webp'),
  'sacred-govinddev': require('../../assets/images/imagetemple/GovindDev.webp'),
  'sacred-guruvayur': require('../../assets/images/imagetemple/Guruvayur.webp'),
  'sacred-gyanvapi': require('../../assets/images/imagetemple/Gyanvapi.webp'),
  'sacred-hidimbadevi': require('../../assets/images/imagetemple/HidimbaDevi.webp'),
  'sacred-hidimba-devi': require('../../assets/images/imagetemple/Hidimba_Devi.webp'),
  'sacred-jakhu': require('../../assets/images/imagetemple/Jakhu.webp'),
  'sacred-janardhanaswamy': require('../../assets/images/imagetemple/JanardhanaSwamy.webp'),
  'sacred-kainchidham': require('../../assets/images/imagetemple/KainchiDham.webp'),
  'sacred-kalaram': require('../../assets/images/imagetemple/Kalaram.webp'),
  'sacred-kalikamata': require('../../assets/images/imagetemple/kalikamata.webp'),
  'sacred-kanakadurga': require('../../assets/images/imagetemple/KanakaDurga.webp'),
  'sacred-kanchipuram-kamakshi': require('../../assets/images/imagetemple/Kanchipuram_Kamakshi.webp'),
  'sacred-kasardevi': require('../../assets/images/imagetemple/KasarDevi.webp'),
  'sacred-kashtabhanjan': require('../../assets/images/imagetemple/Kashtabhanjan.webp'),
  'sacred-kateeldurgaparameshwari': require('../../assets/images/imagetemple/KateelDurgaparameshwari.webp'),
  'sacred-khatushyam': require('../../assets/images/imagetemple/KhatuShyam.webp'),
  'sacred-kondagattuanjaneyaswamy': require('../../assets/images/imagetemple/KondagattuAnjaneyaSwamy.webp'),
  'sacred-kotilingeshwara': require('../../assets/images/imagetemple/Kotilingeshwara.webp'),
  'sacred-ksheeraramalingeswara': require('../../assets/images/imagetemple/KsheeraRamalingeswara.webp'),
  'sacred-kumararama-bhimesvara': require('../../assets/images/imagetemple/Kumararama_Bhimesvara.webp'),
  'sacred-lingaraj': require('../../assets/images/imagetemple/Lingaraj.webp'),
  'sacred-maa-mundeshwari-devi': require('../../assets/images/imagetemple/Maa_Mundeshwari_Devi.webp'),
  'sacred-mahabaleshwar': require('../../assets/images/imagetemple/Mahabaleshwar.webp'),
  'sacred-mahaganapati': require('../../assets/images/imagetemple/Mahaganapati.webp'),
  'sacred-mahavirmandir': require('../../assets/images/imagetemple/MahavirMandir.webp'),
  'sacred-mansadevi': require('../../assets/images/imagetemple/MansaDevi.webp'),
  'sacred-murudeshwara': require('../../assets/images/imagetemple/Murudeshwara.webp'),
  'sacred-naganathaswamy': require('../../assets/images/imagetemple/Naganathaswamy.webp'),
  'sacred-nagaraja': require('../../assets/images/imagetemple/Nagaraja.webp'),
  'sacred-naulakha': require('../../assets/images/imagetemple/Naulakha.webp'),
  'sacred-neelkanth': require('../../assets/images/imagetemple/NeelKanth.webp'),
  'sacred-palanimurugan': require('../../assets/images/imagetemple/PalaniMurugan.webp'),
  'sacred-pashupatinath': require('../../assets/images/imagetemple/Pashupatinath.webp'),
  'sacred-pazhamudircholai': require('../../assets/images/imagetemple/Pazhamudircholai.webp'),
  'sacred-pracheenhanuman': require('../../assets/images/imagetemple/PracheenHanuman.webp'),
  'sacred-premmandir': require('../../assets/images/imagetemple/Premmandir.webp'),
  'sacred-punaura-sitamarhi': require('../../assets/images/imagetemple/Punaura_Sitamarhi.webp'),
  'sacred-purnagiridevi': require('../../assets/images/imagetemple/PurnagiriDevi.webp'),
  'sacred-radhadamodar': require('../../assets/images/imagetemple/RadhaDamodar.webp'),
  'sacred-ramappa-temple': require('../../assets/images/imagetemple/Ramappa_Temple.webp'),
  'sacred-ramatheertham': require('../../assets/images/imagetemple/Ramatheertham.webp'),
  'sacred-ramnagar-fort': require('../../assets/images/imagetemple/Ramnagar_Fort.webp'),
  'sacred-ranakpur': require('../../assets/images/imagetemple/Ranakpur.webp'),
  'sacred-salasarbalaji': require('../../assets/images/imagetemple/SalasarBalaji.webp'),
  'sacred-sandipaniashram': require('../../assets/images/imagetemple/SandipaniAshram.webp'),
  'sacred-sankatmochan': require('../../assets/images/imagetemple/Sankatmochan.webp'),
  'sacred-sarangapani': require('../../assets/images/imagetemple/Sarangapani.webp'),
  'sacred-shivatrats': require('../../assets/images/imagetemple/ShivaTrats.webp'),
  'sacred-shreenathjitemple': require('../../assets/images/imagetemple/Shreenathjitemple.webp'),
  'sacred-shri-ram-janambhoomi-mandir': require('../../assets/images/imagetemple/Shri_Ram_Janambhoomi_Mandir.webp'),
  'sacred-siddhivinayak-temple': require('../../assets/images/imagetemple/Siddhivinayak-Temple.webp'),
  'sacred-someshwara': require('../../assets/images/imagetemple/Someshwara.webp'),
  'sacred-sonprayagsangam': require('../../assets/images/imagetemple/SonprayagSangam.webp'),
  'sacred-sree-padmanabhaswamy': require('../../assets/images/imagetemple/Sree_Padmanabhaswamy.webp'),
  'sacred-sree-vallaba': require('../../assets/images/imagetemple/Sree_Vallaba.webp'),
  'sacred-sriranganathaswamy': require('../../assets/images/imagetemple/SriRanganathaswamy.webp'),
  'sacred-srivilliputhurandal': require('../../assets/images/imagetemple/SrivilliputhurAndal.webp'),
  'sacred-suntemple': require('../../assets/images/imagetemple/SunTemple.webp'),
  'sacred-suryanarkovil': require('../../assets/images/imagetemple/SuryanarKovil.webp'),
  'sacred-swamimalaimurugan': require('../../assets/images/imagetemple/SwamimalaiMurugan.webp'),
  'sacred-swaminarayanakshardham': require('../../assets/images/imagetemple/SwaminarayanAkshardham.webp'),
  'sacred-tanotmata': require('../../assets/images/imagetemple/TanotMata.webp'),
  'sacred-tapovancaves': require('../../assets/images/imagetemple/Tapovancaves.webp'),
  'sacred-tarakeshwar': require('../../assets/images/imagetemple/Tarakeshwar.webp'),
  'sacred-templeofvedicplanetarium': require('../../assets/images/imagetemple/TempleofVedicPlanetarium.webp'),
  'sacred-thillainataraja': require('../../assets/images/imagetemple/ThillaiNataraja.webp'),
  'sacred-thirunageswaramnaganathar': require('../../assets/images/imagetemple/ThirunageswaramNaganathar.webp'),
  'sacred-thiruparankundrammurugan': require('../../assets/images/imagetemple/ThiruparankundramMurugan.webp'),
  'sacred-thiruttani-temple-rajagopuram': require('../../assets/images/imagetemple/Thiruttani_Temple_Rajagopuram.webp'),
  'sacred-thousandpillar': require('../../assets/images/imagetemple/ThousandPillar.webp'),
  'sacred-tiruchendurmurugan': require('../../assets/images/imagetemple/TiruchendurMurugan.webp'),
  'sacred-trilokinath': require('../../assets/images/imagetemple/Trilokinath.webp'),
  'sacred-trinetreshwar': require('../../assets/images/imagetemple/Trinetreshwar.webp'),
  'sacred-triprayarsree': require('../../assets/images/imagetemple/TriprayarSree.webp'),
  'sacred-triveni-ghat': require('../../assets/images/imagetemple/Triveni-Ghat.webp'),
  'sacred-triyuginarayan': require('../../assets/images/imagetemple/Triyuginarayan.webp'),
  'sacred-tungnath': require('../../assets/images/imagetemple/Tungnath.webp'),
  'sacred-udupi-sri-krishna-matha-temple': require('../../assets/images/imagetemple/Udupi_Sri_Krishna_Matha_Temple.webp'),
  'sacred-uppiliappan': require('../../assets/images/imagetemple/Uppiliappan.webp'),
  'sacred-vadakkunnathan': require('../../assets/images/imagetemple/Vadakkunnathan.webp'),
  'sacred-varadvinayak': require('../../assets/images/imagetemple/VaradVinayak.webp'),
  'sacred-varadharajaperumal': require('../../assets/images/imagetemple/VaradharajaPerumal.webp'),
  'sacred-varahalakshminarasimha': require('../../assets/images/imagetemple/VarahaLakshmiNarasimha.webp'),
  'sacred-vashishttemple': require('../../assets/images/imagetemple/VashishtTemple.webp'),
  'sacred-veerabhadra': require('../../assets/images/imagetemple/Veerabhadra.webp'),
  'sacred-venugopalaswamy': require('../../assets/images/imagetemple/VenugopalaSwamy.webp'),
  'sacred-vighnahar': require('../../assets/images/imagetemple/Vighnahar.webp'),
  'sacred-vishnupad': require('../../assets/images/imagetemple/Vishnupad.webp'),
  'sacred-vithoba': require('../../assets/images/imagetemple/Vithoba.webp'),
  'sacred-yadadrisrilakshminarasimha': require('../../assets/images/imagetemple/YadadriSriLakshmiNarasimha.webp'),
  'sacred-baan': require('../../assets/images/imagetemple/baan.webp'),
  'sacred-ballaleshwar': require('../../assets/images/imagetemple/ballaleshwar.webp'),
  'sacred-bhairavnath': require('../../assets/images/imagetemple/bhairavnath.webp'),
  'sacred-chandi-devi': require('../../assets/images/imagetemple/chandi-devi.webp'),
  'sacred-chintamani': require('../../assets/images/imagetemple/chintamani.webp'),
  'sacred-dilwara': require('../../assets/images/imagetemple/dilwara.webp'),
  'sacred-gandhisarvor': require('../../assets/images/imagetemple/gandhisarvor.webp'),
  'sacred-gitamandir': require('../../assets/images/imagetemple/gitamandir.webp'),
  'sacred-hanumangarhi': require('../../assets/images/imagetemple/hanumangarhi.webp'),
  'sacred-iskconvrindavan': require('../../assets/images/imagetemple/iskconVrindavan.webp'),
  'sacred-jageshwar': require('../../assets/images/imagetemple/jageshwar.webp'),
  'sacred-jambukeswarar': require('../../assets/images/imagetemple/jambukeswarar.webp'),
  'sacred-kailashnathwar': require('../../assets/images/imagetemple/kailashnathwar.webp'),
  'sacred-kapaleeshwarar': require('../../assets/images/imagetemple/kapaleeshwarar.webp'),
  'sacred-karnimata': require('../../assets/images/imagetemple/karnimata.webp'),
  'sacred-krishnajanmasthan': require('../../assets/images/imagetemple/krishnajanmasthan.webp'),
  'sacred-mayureshwar': require('../../assets/images/imagetemple/mayureshwar.webp'),
  'sacred-mumba-devi': require('../../assets/images/imagetemple/mumba-devi.webp'),
  'sacred-ramghat': require('../../assets/images/imagetemple/ramghat.webp'),
  'sacred-sabarimala': require('../../assets/images/imagetemple/sabarimala.webp'),
  'sacred-sammed-shikharji': require('../../assets/images/imagetemple/sammed-shikharji.webp'),
  'sacred-shivganga': require('../../assets/images/imagetemple/shivganga.webp'),
  'sacred-shri-radha-raman': require('../../assets/images/imagetemple/shri-radha-raman.webp'),
  'sacred-tapkeshwar': require('../../assets/images/imagetemple/tapkeshwar.webp'),
  'sacred-trikuta': require('../../assets/images/imagetemple/trikuta.webp'),
  'sacred-trinetra-ganesh-temple': require('../../assets/images/imagetemple/trinetra-ganesh-temple.webp'),
  'sacred-tulsi-manas': require('../../assets/images/imagetemple/tulsi-manas.webp'),
  // Direct backend DB seed ID mappings for Ashtavinayak

  // Direct backend DB seed ID mappings for Panchbhoota

  // Direct backend DB seed ID mappings for Sacred / Other temples
  'sacred-somnath-gujarat-coastal': require('../../assets/images/imagetemple/SomnathTemple.webp'),
  'sacred-palani-murugan-temple': require('../../assets/images/imagetemple/PalaniMurugan.webp'),
  'sacred-swamimalai-murugan-temple': require('../../assets/images/imagetemple/SwamimalaiMurugan.webp'),
  'sacred-thiruthani-murugan-temple': require('../../assets/images/imagetemple/Thiruttani_Temple_Rajagopuram.webp'),
  'sacred-thiruparankundram-murugan-temple': require('../../assets/images/imagetemple/ThiruparankundramMurugan.webp'),
  'sacred-pazhamudircholai-murugan-temple': require('../../assets/images/imagetemple/Pazhamudircholai.webp'),
  'sacred-tiruchendur-murugan-temple': require('../../assets/images/imagetemple/TiruchendurMurugan.webp'),
  'sacred-shravanabelagola-gommateshwara': require('../../assets/images/imagetemple/Gommateshwara.webp'),
  'sacred-mayapur-chandrodaya-mandir': require('../../assets/images/imagetemple/TempleofVedicPlanetarium.webp'),
  'sacred-sammed-shikharji-parasnath': require('../../assets/images/imagetemple/sammed-shikharji.webp'),
  'sacred-dilwara-jain-temples-mount-abu': require('../../assets/images/imagetemple/dilwara.webp'),
  'sacred-ranakpur-jain-temple-pali': require('../../assets/images/imagetemple/Ranakpur.webp'),
  'sacred-karni-mata-temple-deshnoke': require('../../assets/images/imagetemple/karnimata.webp'),
  'sacred-tanot-mata-temple-jaisalmer': require('../../assets/images/imagetemple/TanotMata.webp'),
  'sacred-brahma-temple-pushkar': require('../../assets/images/imagetemple/Brahma_Temple.webp'),
  'sacred-khatu-shyam-temple-sikar': require('../../assets/images/imagetemple/KhatuShyam.webp'),
  'sacred-trinetra-ganesh-temple-ranthambore': require('../../assets/images/imagetemple/trinetra-ganesh-temple.webp'),
  'sacred-chamundeshwari-hill-mysore': require('../../assets/images/imagetemple/chamundeshwari.webp'),
  'sacred-murudeshwar-coastal-temple': require('../../assets/images/imagetemple/Murudeshwara.webp'),
  'sacred-gokarna-mahabaleshwar-temple': require('../../assets/images/imagetemple/Mahabaleshwar.webp'),
  'sacred-triprayar-srama-temple-thrissur': require('../../assets/images/imagetemple/TriprayarSree.webp'),
  'sacred-thiruvalla-sree-vallabha-temple': require('../../assets/images/imagetemple/Sree_Vallaba.webp'),
  'sacred-ambalappuzha-sree-krishna-temple': require('../../assets/images/imagetemple/Ambalappuzha_Sri_Krishna_Temple.webp'),
  'sacred-arankula-parthasarathy-temple': require('../../assets/images/imagetemple/Aranmula_Parthasarathy.webp'),
  'sacred-janardhana-swamy-temple-varkala': require('../../assets/images/imagetemple/JanardhanaSwamy.webp'),
  'sacred-nagaraja-temple-nagercoil': require('../../assets/images/imagetemple/Nagaraja.webp'),
  'sacred-srivilliputhur-andal-temple': require('../../assets/images/imagetemple/SrivilliputhurAndal.webp'),
  'sacred-oppiliappan-temple-kumbakonam': require('../../assets/images/imagetemple/Uppiliappan.webp'),
  'sacred-sarangapani-temple-kumbakonam': require('../../assets/images/imagetemple/Sarangapani.webp'),
  'sacred-kumbeshwarar-temple-kumbakonam': require('../../assets/images/imagetemple/AdiKumbeswarar.webp'),
  'sacred-varadharaja-perumal-temple-kanchipuram': require('../../assets/images/imagetemple/VaradharajaPerumal.webp'),
  'sacred-kamakshi-amman-temple-kanchipuram': require('../../assets/images/imagetemple/Kanchipuram_Kamakshi.webp'),
  'sacred-thirunageswaram-naganathar-temple': require('../../assets/images/imagetemple/ThirunageswaramNaganathar.webp'),
  'sacred-thingalur-chandran-temple': require('../../assets/images/imagetemple/ThirunageswaramNaganathar.webp'),
  'sacred-alangudi-guru-temple': require('../../assets/images/imagetemple/Apatsahayesvarar.webp'),
  'sacred-kanchanur-sukran-temple': require('../../assets/images/imagetemple/Agniswarar.webp'),
  'sacred-thirunallar-saneeswaran-temple': require('../../assets/images/imagetemple/Dharbaranyeswarar.webp'),
  'sacred-kethu-temple-keelaperumpallam': require('../../assets/images/imagetemple/Naganathaswamy.webp'),
  'sacred-suryanar-kovil-kumbakonam': require('../../assets/images/imagetemple/SuryanarKovil.webp'),
  'sacred-ramatheertham-vizianagaram': require('../../assets/images/imagetemple/Ramatheertham.webp'),
  'sacred-draksharamam-bheemeswara-temple': require('../../assets/images/imagetemple/Draksharama_temple.webp'),
  'sacred-amararamam-amaraswaraswamy-temple': require('../../assets/images/imagetemple/AmareswaraSwamy.webp'),
  'sacred-somaramam-someshwara-swamy-temple': require('../../assets/images/imagetemple/Someshwara.webp'),
  'sacred-ksheeraramam-ksheera-ramalingeswara': require('../../assets/images/imagetemple/KsheeraRamalingeswara.webp'),
  'sacred-kumararamam-bhimeswara-swamy': require('../../assets/images/imagetemple/Kumararama_Bhimesvara.webp'),
  'sacred-yadadri-narasimha-swamy-temple': require('../../assets/images/imagetemple/YadadriSriLakshmiNarasimha.webp'),
  'sacred-bhadrachalam-sita-ramachandra-swamy': require('../../assets/images/imagetemple/Bhadrachalam_temple.webp'),
  'sacred-thousand-pillar-temple-warangal': require('../../assets/images/imagetemple/ThousandPillar.webp'),
  'sacred-ramappa-temple-mulugu': require('../../assets/images/imagetemple/Ramappa_Temple.webp'),
  'sacred-gnana-saraswathi-temple-basar': require('../../assets/images/imagetemple/GnanaSaraswathi.webp'),
  'sacred-kondagattu-anjaneya-swamy-temple': require('../../assets/images/imagetemple/KondagattuAnjaneyaSwamy.webp'),
  'sacred-veerabhadra-temple-lepakshi': require('../../assets/images/imagetemple/Veerabhadra.webp'),
  'sacred-patan-devi-temple-patna': require('../../assets/images/imagetemple/MahavirMandir.webp'),
  'sacred-mahavir-mandir-patna': require('../../assets/images/imagetemple/MahavirMandir.webp'),
  'sacred-janaki-mandir-sitamarhi': require('../../assets/images/imagetemple/Punaura_Sitamarhi.webp'),
  'sacred-mundeshwari-devi-temple-kaimur': require('../../assets/images/imagetemple/Maa_Mundeshwari_Devi.webp'),
  'sacred-gorakhnath-temple-gorakhpur': require('../../assets/images/imagetemple/Gorakhnath.webp'),
  'sacred-tulsi-manas-temple-varanasi': require('../../assets/images/imagetemple/tulsi-manas.webp'),
  'sacred-vibhuti-narayan-fort-temple-ramnagar': require('../../assets/images/imagetemple/Ramnagar_Fort.webp'),
  'sacred-naini-devi-temple-nainital': require('../../assets/images/imagetemple/Nainadevi.webp'),
  'sacred-triyuginarayan-temple-rudraprayag': require('../../assets/images/imagetemple/Triyuginarayan.webp'),
  'sacred-dhari-devi-temple-srinagar-garhwal': require('../../assets/images/imagetemple/DhariDevi.webp'),
  'sacred-neelkanth-mahadev-temple-rishikesh': require('../../assets/images/imagetemple/NeelKanth.webp'),
  'sacred-tapkeshwar-temple-dehradun': require('../../assets/images/imagetemple/tapkeshwar.webp'),
  'sacred-kasar-devi-temple-almora': require('../../assets/images/imagetemple/KasarDevi.webp'),
  'sacred-jageshwar-dham-almora': require('../../assets/images/imagetemple/jageshwar.webp'),
  'sacred-baijnath-temple-bageshwar': require('../../assets/images/imagetemple/Baijnath.webp'),
  'sacred-purnagiri-devi-temple-champawat': require('../../assets/images/imagetemple/PurnagiriDevi.webp'),
  'sacred-hadimba-devi-temple-manali': require('../../assets/images/imagetemple/Hidimba_Devi.webp'),
  'sacred-bijli-mahadev-temple-kullu': require('../../assets/images/imagetemple/BijliMahadev.webp'),
  'sacred-vashisht-kund-temple-manali': require('../../assets/images/imagetemple/VashishtTemple.webp'),
  'sacred-triloknath-temple-lahaul': require('../../assets/images/imagetemple/Trilokinath.webp'),
  'sacred-mahakali-temple-pavagadh': require('../../assets/images/imagetemple/kalikamata.webp'),
  'sacred-bala-hanuman-temple-jamnagar': require('../../assets/images/imagetemple/PracheenHanuman.webp'),
  'sacred-bhalkeeshwar-temple-veraval': require('../../assets/images/imagetemple/BhalkaTirthShrine.webp'),
  'sacred-gopnath-mahadev-temple-bhavnagar': require('../../assets/images/imagetemple/GopnathMahadev.webp'),
  'sacred-tarnetar-mahadev-temple-surendranagar': require('../../assets/images/imagetemple/Trinetreshwar.webp'),
  'sacred-sun-temple-modhera': require('../../assets/images/imagetemple/SunTemple.webp'),
  'sacred-somnath-mahadham-gujarat': require('../../assets/images/imagetemple/SomnathTemple.webp'),
  'sacred-somnath-jyotirling-gujarat-core': require('../../assets/images/imagetemple/SomnathTemple.webp'),
  'sacred-golden-temple-amritsar': require('../../assets/images/imagetemple/GoldenTemple.webp'),
  'sacred-vasukital': require('../../assets/images/imagetemple/vasukital.webp'),
};

const DEFAULT_TEMPLE_IMAGE: number = require('../../assets/images/clean_parchment_bg.webp');

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

const TEMPLE_FALLBACK_POOL: ImageSourcePropType[] = [
  require('../../assets/images/clean_parchment_bg.webp'),
];

const _rawGetTempleImageByNameDetailed = (name: string) => {
  const input = String(name || '').trim();
  if (!input) {
    return { key: 'DEFAULT_TEMPLE_IMAGE', res: DEFAULT_TEMPLE_IMAGE, tier: 'Tier 6 (Default)' };
  }

  // 1. Exact ID match
  if (TEMPLE_IMAGES[input]) {
    return { key: input, res: TEMPLE_IMAGES[input], tier: 'Tier 1 (Exact ID)' };
  }

  const allKeys = Object.keys(TEMPLE_IMAGES);

  // 2. Exact Normalized Key match
  const normInputRaw = normalizeTempleName(input);
  if (normInputRaw) {
    for (const key of allKeys) {
      if (normalizeTempleName(key) === normInputRaw) {
        return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 2 (Exact Normalized Key)' };
      }
    }
  }

  // 3. Exact Normalized Name match (with location suffix stripped)
  const normInputNoLoc = normalizeTempleName(input, { stripLocation: true });
  if (normInputNoLoc) {
    for (const key of allKeys) {
      if (normalizeTempleName(key, { stripLocation: true }) === normInputNoLoc) {
        return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 3 (Exact Normalized Name)' };
      }
    }
  }

  // 4. Prefix-stripped Normalized Key match
  const normInputStripped = normalizeTempleName(input, { stripLocation: true, stripPrefixes: true });
  if (normInputStripped) {
    for (const key of allKeys) {
      if (normalizeTempleName(key, { stripLocation: true, stripPrefixes: true }) === normInputStripped) {
        return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 4 (Prefix-stripped Key)' };
      }
    }
  }

  // 5. Controlled Fuzzy match (last resort before default fallback)
  if (normInputStripped) {
    for (const key of allKeys) {
      const normKeyStripped = normalizeTempleName(key, { stripLocation: true, stripPrefixes: true });
      if (normInputStripped.length >= 4 && normKeyStripped.length >= 4) {
        const s1 = normInputStripped.replace(/(mandir|temple)/g, '');
        const s2 = normKeyStripped.replace(/(mandir|temple)/g, '');
        if (s1 && s2 && (s1 === s2 || s1.includes(s2) || s2.includes(s1))) {
          return { key, res: TEMPLE_IMAGES[key], tier: 'Tier 5 (Controlled Fuzzy Match)' };
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

const getTempleImageById = (id: string): ImageSourcePropType | null => {
  if (!id) return null;
  const detailed = _rawGetTempleImageByNameDetailed(id);
  if (detailed.tier.includes('Tier 6')) return null;
  return detailed.res || null;
};

const getTempleImageByNameDetailed = (name: string) => {
  const key = String(name || '').trim();
  if (DETAILED_LOOKUP_CACHE.has(key)) return DETAILED_LOOKUP_CACHE.get(key)!;
  const res = _rawGetTempleImageByNameDetailed(key);
  DETAILED_LOOKUP_CACHE.set(key, res);
  return res;
};

const getTempleImageByName = (name: string): ImageSourcePropType => {
  const key = String(name || '').trim();
  if (!key) return DEFAULT_TEMPLE_IMAGE;
  if (IMAGE_LOOKUP_CACHE.has(key)) return IMAGE_LOOKUP_CACHE.get(key) || DEFAULT_TEMPLE_IMAGE;
  const res = _rawGetTempleImageByNameDetailed(key).res || DEFAULT_TEMPLE_IMAGE;
  IMAGE_LOOKUP_CACHE.set(key, res);
  return res;
};

export {
  TEMPLE_IMAGES,
  DEFAULT_TEMPLE_IMAGE,
  normalizeTempleName,
  getTempleImageById,
  getTempleImageByName,
  getTempleImageByNameDetailed,
};