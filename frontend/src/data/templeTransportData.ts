export interface TempleTransport {
  air: string;
  rail: string;
  bus: string;
}

export type TransportDetails = TempleTransport;


export const CURATED_TEMPLE_TRANSPORT: Record<string, TempleTransport> = {
  "somnath": {
    "air": "Rajkot International Airport (~200 km), Diu Airport (~85 km)",
    "rail": "Veraval Junction Railway Station (~7 km)",
    "bus": "GSRTC buses connect Somnath directly with Rajkot, Ahmedabad, Dwarka, and Porbandar."
  },
  "mallikarjuna": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~200 km)",
    "rail": "Markapur Road Railway Station (~85 km), Nandyal Junction (~160 km)",
    "bus": "APSRTC buses operate round-the-clock from Hyderabad (MGBS), Kurnool, Guntur, and Vijayawada."
  },
  "mahakaleshwar": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~55 km)",
    "rail": "Ujjain Junction Railway Station (~2 km)",
    "bus": "MPRTS & interstate buses run frequently from Indore, Bhopal, and Omkareshwar to Ujjain Dewas Gate Stand."
  },
  "omkareshwar": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~85 km)",
    "rail": "Omkareshwar Road Station (~12 km), Khandwa Junction (~70 km), Indore Junction (~80 km)",
    "bus": "MPRTS buses connect Omkareshwar directly with Indore, Ujjain, and Khandwa."
  },
  "kedarnath": {
    "air": "Jolly Grant Airport Dehradun (~238 km to Gaurikund) + Helipad services at Phata/Sersi/Guptkashi",
    "rail": "Rishikesh Railway Station (~215 km), Yog Nagari Rishikesh (~218 km)",
    "bus": "GMOU & UTC buses operate from Rishikesh & Haridwar to Sonprayag/Gaurikund; 16 km trek to sanctum."
  },
  "bhimashankar": {
    "air": "Pune International Airport (~110 km)",
    "rail": "Pune Junction Railway Station (~110 km)",
    "bus": "MSRTC buses operate regularly from Pune (Shivajinagar/Swargate) and Manchar to Bhimashankar."
  },
  "kashi": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~25 km)",
    "rail": "Varanasi Junction (BSB) (~4 km), Banaras (BSBS) (~3 km)",
    "bus": "UPSRTC & local electric buses operate regularly connecting Cantt Bus Stand to Godowlia and Ghats."
  },
  "trimbakeshwar": {
    "air": "Nashik Ozar Airport (~50 km), Chhatrapati Shivaji Maharaj International Airport Mumbai (~170 km)",
    "rail": "Nashik Road Railway Station (NK) (~38 km)",
    "bus": "MSRTC city & express buses ply every 15 minutes between Nashik CBS and Trimbakeshwar bus stand."
  },
  "baidyanath": {
    "air": "Deoghar Airport (DGH) (~12 km), Birsa Munda Airport Ranchi (~250 km)",
    "rail": "Baidyanathdham Station (~1 km), Jasidih Junction (JSME) (~8 km)",
    "bus": "JSRTC and private buses connect Deoghar directly with Ranchi, Patna, Asansol, and Kolkata."
  },
  "nageshwar": {
    "air": "Jamnagar Airport (~145 km)",
    "rail": "Dwarka Railway Station (~16 km)",
    "bus": "Local buses and taxis ply continuously on the Dwarka-Nageshwar route (~15 mins)."
  },
  "ramanathaswamy": {
    "air": "Madurai International Airport (~175 km)",
    "rail": "Rameswaram Railway Station (~1.5 km)",
    "bus": "TNSTC & SETC buses connect Rameswaram with Madurai, Tiruchirappalli, Kanyakumari, and Chennai."
  },
  "grishneshwar": {
    "air": "Chhatrapati Sambhajinagar (Aurangabad) Airport (~35 km)",
    "rail": "Chhatrapati Sambhajinagar Railway Station (~30 km)",
    "bus": "MSRTC buses connect Ellora directly from Central Bus Stand Chhatrapati Sambhajinagar."
  },
  "badrinath": {
    "air": "Jolly Grant Airport Dehradun (~315 km)",
    "rail": "Rishikesh Railway Station (~295 km), Haridwar Junction (~318 km)",
    "bus": "UTC and private luxury coaches run directly from Haridwar, Rishikesh, and Joshimath along NH 7."
  },
  "dwarkadhish": {
    "air": "Jamnagar Airport (~135 km), Rajkot Airport (~225 km)",
    "rail": "Dwarka Railway Station (DWK) (~2 km)",
    "bus": "GSRTC sleeper and express buses connect Dwarka directly with Jamnagar, Rajkot, Somnath, and Ahmedabad."
  },
  "jagannath-puri": {
    "air": "Biju Patnaik International Airport Bhubaneswar (~60 km)",
    "rail": "Puri Railway Station (PURI) (~2.5 km)",
    "bus": "OSRTC buses connect Puri Grand Road directly with Bhubaneswar, Cuttack, and Konark."
  },
  "vaishno-devi": {
    "air": "Jammu Civil Enclave / Jammu Airport (~50 km)",
    "rail": "Shri Mata Vaishno Devi Katra Railway Station (SVDK) (~1.5 km)",
    "bus": "JKSRTC deluxe & Volvo buses run continuously from Jammu Tawi, Amritsar, Delhi, and Chandigarh to Katra."
  },
  "kamakhya": {
    "air": "Lokpriya Gopinath Bordoloi International Airport Guwahati (~20 km)",
    "rail": "Kamakhya Junction (KYQ) (~3 km), Guwahati Railway Station (GHY) (~8 km)",
    "bus": "ASTC and city buses connect Nilachal Hill base directly with Guwahati railway station and Paltan Bazaar."
  },
  "meenakshi": {
    "air": "Madurai International Airport (IXM) (~12 km)",
    "rail": "Madurai Junction Railway Station (MDU) (~1.5 km)",
    "bus": "TNSTC buses connect Mattuthavani & Periyar bus stands directly to Meenakshi Temple."
  },
  "mahalaxmi": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~18 km)",
    "rail": "Mahalaxmi Railway Station (~1 km), Mumbai Central (~3 km)",
    "bus": "BEST buses and taxis connect Mahalaxmi temple directly with Churchgate, Dadar, and CST."
  },
  "kalighat": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~22 km)",
    "rail": "Howrah Junction (~8 km), Kalighat Metro Station (~1 km)",
    "bus": "Kolkata Metro & WBTC buses connect Kalighat directly with Howrah, Sealdah, and Esplanade."
  },
  "ambaji": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~180 km)",
    "rail": "Abu Road Railway Station (~20 km)",
    "bus": "GSRTC buses connect Ambaji directly with Ahmedabad, Palanpur, Himmatnagar, and Mount Abu."
  },
  "chamundeshwari": {
    "air": "Mysuru Airport (MYQ) (~12 km), Kempegowda Airport Bengaluru (~185 km)",
    "rail": "Mysuru Junction Railway Station (~13 km)",
    "bus": "KSRTC Volvo and city buses operate frequently from Mysuru City Bus Stand to Chamundi Hill top."
  },
  "golden-temple": {
    "air": "Sri Guru Ram Dass Jee International Airport Amritsar (~13 km)",
    "rail": "Amritsar Junction Railway Station (ASR) (~2 km)",
    "bus": "Punjab Roadways & PRTC buses operate round-the-clock from ISBT Amritsar with free electric shuttle service."
  },
  "shirdi": {
    "air": "Shirdi International Airport (SAG) (~14 km)",
    "rail": "Sainagar Shirdi Railway Station (SNSI) (~3 km), Kopergaon Station (~16 km)",
    "bus": "MSRTC sleeper & luxury Volvo buses operate non-stop from Mumbai, Pune, Nashik, and Surat."
  },
  "tirupati": {
    "air": "Tirupati International Airport (TIR) (~15 km)",
    "rail": "Tirupati Main Station (TPTY) (~2 km), Renigunta Junction (~10 km)",
    "bus": "APSRTC & KSRTC buses operate 24/7 from Tirupati bus stand up to Tirumala hill top every 2 minutes."
  },
  "siddhivinayak": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~11 km)",
    "rail": "Dadar Railway Station (~1.5 km), Prabhadevi Station (~1 km)",
    "bus": "BEST buses and taxis connect Prabhadevi directly with Dadar, Lower Parel, and Churchgate."
  },
  "ramanasramam": {
    "air": "Chennai International Airport (~170 km)",
    "rail": "Tiruvannamalai Railway Station (~3 km)",
    "bus": "TNSTC & PRTC buses connect Tiruvannamalai directly from Chennai CMBT, Bengaluru, Puducherry, and Salem."
  },
  "dhyanalinga": {
    "air": "Coimbatore International Airport (~42 km)",
    "rail": "Coimbatore Junction (~30 km)",
    "bus": "TNSTC bus route 14D operates frequently from Gandhipuram Bus Stand to Isha Yoga Center."
  },
  "virupaksha": {
    "air": "Jindal Vijayanagar Airport Toranagallu (~40 km), Hubballi Airport (~140 km)",
    "rail": "Hosapete Junction (HPT) (~13 km)",
    "bus": "KSRTC local buses connect Hosapete bus stand directly to Hampi bazaar every 15 minutes."
  },
  "anandamayi": {
    "air": "Jolly Grant Airport Dehradun (~38 km)",
    "rail": "Haridwar Junction (~3 km)",
    "bus": "UTC & private buses connect Kankhal Haridwar with Delhi ISBT and Dehradun."
  },
  "mehendipur": {
    "air": "Jaipur International Airport (~100 km)",
    "rail": "Bandikui Junction (~15 km)",
    "bus": "RSRTC buses connect Mehendipur Balaji directly from Jaipur, Bharatpur, Agra, and Delhi."
  },
  "parmarth": {
    "air": "Jolly Grant Airport Dehradun (~22 km)",
    "rail": "Yog Nagari Rishikesh Railway Station (~4 km)",
    "bus": "UTC buses and local shared autos connect Swargashram Rishikesh with Haridwar and Dehradun."
  },
  "aurobindo": {
    "air": "Puducherry Airport (~7 km), Chennai International Airport (~160 km)",
    "rail": "Puducherry Railway Station (~2 km)",
    "bus": "PRTC & TNSTC buses connect Puducherry directly with Chennai, Villupuram, and Chidambaram."
  },
  "belur": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~15 km)",
    "rail": "Belur Railway Station (~1.5 km), Howrah Junction (~6 km)",
    "bus": "WBTC buses and ferry services on Hooghly river connect Belur Math directly with Dakshineswar & Howrah."
  },
  "sarnath": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~24 km)",
    "rail": "Sarnath Railway Station (~1 km), Varanasi Junction (~10 km)",
    "bus": "Regular autorickshaws, e-rickshaws, and city buses connect Sarnath with Varanasi city center."
  },
  "mahabodhi": {
    "air": "Gaya International Airport (~10 km), Patna Airport (~115 km)",
    "rail": "Gaya Junction (~16 km)",
    "bus": "BSRTC tourist buses and auto-rickshaws run every 10 minutes between Gaya Junction and Bodh Gaya."
  },
  "mookambika": {
    "air": "Mangaluru International Airport (~135 km)",
    "rail": "Byndoor Mookambika Road Station (~28 km), Kundapura Station (~40 km)",
    "bus": "KSRTC sleeper and express buses operate directly from Bengaluru, Mangaluru, Shimoga, and Udupi."
  },
  "chottanikkara": {
    "air": "Cochin International Airport (~38 km)",
    "rail": "Ernakulam Junction (South) (~17 km), Tripunithura Railway Station (~6 km)",
    "bus": "KSRTC and local buses connect Chottanikkara directly with Ernakulam, Tripunithura, and Kottayam."
  },
  "vaitheeswaran": {
    "air": "Tiruchirappalli International Airport (~135 km)",
    "rail": "Vaitheeswaran Koil Railway Station (~1 km), Mayiladuthurai Junction (~14 km)",
    "bus": "TNSTC buses operate frequently from Sirkazhi, Mayiladuthurai, Chidambaram, and Kumbakonam."
  },
  "parli": {
    "air": "Latur Airport (~70 km), Nanded Airport (~105 km)",
    "rail": "Parli Vaijnath Railway Station (~2 km)",
    "bus": "MSRTC buses connect Parli directly with Beed, Latur, Nanded, Aurangabad, and Pune."
  },
  "dhanvantari": {
    "air": "Cochin International Airport (~18 km)",
    "rail": "Angamaly Railway Station (~10 km), Aluva Station (~15 km)",
    "bus": "KSRTC & local buses connect Thottuva Dhanwanthari temple near Perumbavoor with Kochi."
  },
  "suchindram": {
    "air": "Trivandrum International Airport (~75 km)",
    "rail": "Nagercoil Junction (~6 km), Kanyakumari Station (~12 km)",
    "bus": "TNSTC buses connect Suchindram directly on the Nagercoil-Kanyakumari highway."
  },
  "ghati-subramanya": {
    "air": "Kempegowda International Airport Bengaluru (~45 km)",
    "rail": "Doddaballapur Railway Station (~12 km), Makalidurga Station (~8 km)",
    "bus": "KSRTC & BMTC buses ply regularly from Majestic Bengaluru and Doddaballapur to Ghati Subramanya."
  },
  "srikalahasti": {
    "air": "Tirupati Airport (Renigunta, ~25 km)",
    "rail": "Srikalahasti Railway Station (~2 km), Renigunta Junction (~25 km)",
    "bus": "APSRTC buses connect Srikalahasti directly with Tirupati, Chennai, and Nellore."
  },
  "kukke": {
    "air": "Mangaluru International Airport (~115 km)",
    "rail": "Subrahmanya Road Railway Station (SBHR) (~12 km)",
    "bus": "KSRTC express & KSRTC KSRTC sleeper buses run non-stop from Bengaluru, Mangaluru, Mysore, and Hassan."
  },
  "horanadu": {
    "air": "Mangaluru International Airport (~125 km)",
    "rail": "Kadur Railway Station (~130 km), Shimoga Station (~135 km)",
    "bus": "KSRTC and private sleeper buses operate directly from Bengaluru, Mysuru, Mangaluru, and Chikmagalur."
  },
  "mangaladevi": {
    "air": "Mangaluru International Airport (~15 km)",
    "rail": "Mangaluru Central Railway Station (~3 km)",
    "bus": "City buses (Route 27) and taxis connect Mangaladevi temple directly with Hampankatta & KSRTC stand."
  },
  "ambalappuzha": {
    "air": "Cochin International Airport (~115 km), Trivandrum International Airport (~140 km)",
    "rail": "Ambalapuzha Railway Station (~2 km), Alappuzha Railway Station (~14 km)",
    "bus": "KSRTC and private buses connect Ambalappuzha directly on the NH 66 highway between Alappuzha and Kollam."
  },
  "mallikarjuna-srisailam": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~200 km)",
    "rail": "Markapur Road Railway Station (~85 km), Nandyal Junction (~160 km)",
    "bus": "APSRTC & TSRTC buses run round-the-clock from Hyderabad (MGBS), Kurnool, and Vijayawada."
  },
  "renuka-devi-mahur": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Mahur Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Mahur with regional depots."
  },
  "mayureshwar-morgaon": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Morgaon Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Morgaon with regional depots."
  },
  "ambalappuzha-sri-krishna-alappuzha": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Ambalapuzha Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Ambalapuzha with major district terminals."
  },
  "sankat-mochan-shimla": {
    "air": "Shimla Airport Jubbarhatti (~20 km), Chandigarh International Airport (~120 km)",
    "rail": "Shimla Railway Station (Toy Train) (~5 km), Kalka Railway Station (~85 km)",
    "bus": "HRTC and local Shimla city buses operate regularly from ISBT Tutikandi along Kalka-Shimla highway."
  },
  "ghati-subramanya-doddaballapur": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Bengaluru Rural Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Bengaluru Rural central bus depot."
  },
  "jakhu-shimla": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Shimla with hill stations."
  },
  "pashupatinath-indo-nepal-border": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Pithoragarh along major national highway corridors."
  },
  "tanot-mata-jaisalmer": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Jaisalmer Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Jaisalmer central stand."
  },
  "thirunageswaram-naganathar": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "bakreshwar-birbhum": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Suri Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Suri bus terminus daily."
  },
  "varadhavinayak-mahad": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Mahad Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Mahad with regional depots."
  },
  "naganathaswamy-keelaperumpallam": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Mayiladuthurai Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Mayiladuthurai with municipal bus stands."
  },
  "annapoorneshwari-horanadu": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Chikkamagaluru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Chikkamagaluru central bus depot."
  },
  "udupi-sri-krishna-udupi": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Udupi Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Udupi central bus depot."
  },
  "vithoba-pandharpur": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Pandharpur Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Pandharpur with regional depots."
  },
  "mahakal-ujjain": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~55 km)",
    "rail": "Ujjain Junction Railway Station (~2 km)",
    "bus": "MPRTS & interstate buses run frequently from Indore, Bhopal, and Omkareshwar to Ujjain Dewas Gate Stand."
  },
  "vaishno-devi-jammu-&-kashmir": {
    "air": "Jammu Civil Enclave / Jammu Airport (~50 km)",
    "rail": "Shri Mata Vaishno Devi Katra Railway Station (SVDK) (~1.5 km)",
    "bus": "JKSRTC deluxe & Volvo buses run continuously from Jammu Tawi, Amritsar, Delhi, and Chandigarh to Katra."
  },
  "sree-vallabha-thiruvalla": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Thiruvalla Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Thiruvalla with major district terminals."
  },
  "swamimalai-murugan-thanjavur": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "vadakkunnathan-thrissur": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Thrissur Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Thrissur with major district terminals."
  },
  "ayodhya-ram": {
    "air": "Maharishi Valmiki International Airport Ayodhya (AYJ) (~10 km)",
    "rail": "Ayodhya Dham Junction (AY) (~1 km), Ayodhya Cantt (AYC) (~7 km)",
    "bus": "UPSRTC express buses run continuously from Lucknow (Alambagh), Gorakhpur, Varanasi, and Prayagraj."
  },
  "srivilliputhur-andal-virudhunagar": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Srivilliputhur Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Srivilliputhur with municipal bus stands."
  },
  "hinglaj-mata-barmer": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Barmer Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Barmer central stand."
  },
  "kashi-vishwanath-corridor": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~25 km)",
    "rail": "Varanasi Junction (BSB) (~4 km), Banaras (BSBS) (~3 km)",
    "bus": "UPSRTC & local electric buses operate regularly connecting Cantt Bus Stand to Godowlia and Ghats."
  },
  "sammed-shikharji-giridih": {
    "air": "Birsa Munda Airport Ranchi (~110 km), Deoghar Airport (~90 km)",
    "rail": "Giridih Railway Station (~3 km), Jasidih Junction / Ranchi Station (~70 km)",
    "bus": "JSRTC and private interstate buses connect Giridih directly with capital routes."
  },
  "chintamani-theur": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Theur Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Theur with regional depots."
  },
  "adi-kumbeswarar-kumbakonam": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "naina-devi-nainital": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Nainital along major national highway corridors."
  },
  "gopnath-mahadev-bhavnagar": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Bhavnagar Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Bhavnagar directly with all major district hubs."
  },
  "kalika-mata-pavagadh": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Panchmahal Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Panchmahal directly with all major district hubs."
  },
  "kamakhya-devi-assam": {
    "air": "Lokpriya Gopinath Bordoloi International Airport Guwahati (~20 km)",
    "rail": "Kamakhya Junction (KYQ) (~3 km), Guwahati Railway Station (GHY) (~8 km)",
    "bus": "ASTC and city buses connect Nilachal Hill base directly with Guwahati railway station and Paltan Bazaar."
  },
  "somnath-veraval": {
    "air": "Diu Airport (~85 km), Rajkot International Airport (~200 km)",
    "rail": "Veraval Junction (~7 km), Somnath Railway Station (~1 km)",
    "bus": "GSRTC buses connect Somnath directly with Junagadh, Rajkot, Dwarka, and Ahmedabad."
  },
  "tarapith-birbhum": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Tarapith Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Tarapith bus terminus daily."
  },
  "hidimba-devi-manali": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Kullu with hill stations."
  },
  "raeertham-vizianagaram": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Vizianagaram Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Vizianagaram."
  },
  "amareswara-swamy-amaravati": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Amaravati Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Amaravati."
  },
  "iskcon-mira-road-thane": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Mira Road Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Mira Road with regional depots."
  },
  "ranakpur-jain-pali": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Ranakpur Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Ranakpur central stand."
  },
  "sri-aurobindo-puducherry": {
    "air": "Puducherry Airport (~7 km), Chennai International Airport (~160 km)",
    "rail": "Puducherry Railway Station (PDY) (~2 km)",
    "bus": "PRTC & TNSTC buses connect Puducherry directly with Chennai ECR/OMR, Villupuram, and Chidambaram."
  },
  "neelkanth-mahadev-rishikesh": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Pauri Garhwal along major national highway corridors."
  },
  "chamundi-hill-mysuru": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Mysuru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Mysuru central bus depot."
  },
  "bhairavnath-shiva-rajrappa": {
    "air": "Birsa Munda Airport Ranchi (~110 km), Deoghar Airport (~90 km)",
    "rail": "Ramgarh Railway Station (~3 km), Jasidih Junction / Ranchi Station (~70 km)",
    "bus": "JSRTC and private interstate buses connect Ramgarh directly with capital routes."
  },
  "golden-amritsar": {
    "air": "Sri Guru Ram Dass Jee International Airport Amritsar (~13 km)",
    "rail": "Amritsar Junction Railway Station (ASR) (~2 km)",
    "bus": "Punjab Roadways & PRTC buses operate round-the-clock from ISBT Amritsar with free electric shuttle service."
  },
  "uppiliappan-kumbakonam": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "sharada-kashmir": {
    "air": "Sheikh ul-Alam International Airport Srinagar (~25 km), Jammu Airport (~60 km)",
    "rail": "Jammu Tawi Railway Station (~50 km), Katra Station (~30 km)",
    "bus": "JKSRTC buses and private taxis ply regularly along Kupwara highway routes."
  },
  "mansa-devi-haridwar": {
    "air": "Jolly Grant Airport Dehradun (~20 km to Rishikesh, ~35 km to Haridwar)",
    "rail": "Haridwar Junction (HW) / Yog Nagari Rishikesh (YNRK) (~3 km)",
    "bus": "UTC Volvo & express buses run continuously from ISBT Kashmiri Gate Delhi to Haridwar & Rishikesh."
  },
  "somnath-coastal-pilgrimage": {
    "air": "Diu Airport (~85 km), Rajkot International Airport (~200 km)",
    "rail": "Veraval Junction (~7 km), Somnath Railway Station (~1 km)",
    "bus": "GSRTC buses connect Somnath directly with Junagadh, Rajkot, Dwarka, and Ahmedabad."
  },
  "dilwara-s-mount-abu": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Mount Abu Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Mount Abu central stand."
  },
  "belur-howrah": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~20 km)",
    "rail": "Howrah Junction (~7 km), Sealdah Railway Station (~6 km), Kalighat Metro (~1 km)",
    "bus": "Kolkata Metro and WBTC buses connect Kalighat directly with Howrah, Sealdah, and Esplanade."
  },
  "tripura-sundari-udaipur": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Udaipur Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Udaipur."
  },
  "someshwara-swamy-bhimavaram": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Bhimavaram Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Bhimavaram."
  },
  "bade-hanuman-lying-hanuman-prayagraj": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Prayagraj Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Prayagraj with regional headquarters."
  },
  "kukke-subramanya-dakshina-kannada": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Subramanya Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Subramanya central bus depot."
  },
  "badrinath-uttarakhand": {
    "air": "Jolly Grant Airport Dehradun (~315 km)",
    "rail": "Rishikesh Railway Station (~295 km), Haridwar Junction (~318 km)",
    "bus": "UTC and private luxury coaches run directly from Haridwar, Rishikesh, and Joshimath along NH 7."
  },
  "saptashrungi-nivasini-vani": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Vani Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Vani with regional depots."
  },
  "murudeshwar-coastal": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Murudeshwar Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Murudeshwar central bus depot."
  },
  "shree-kashtabhanjan-dev-hanumanji-sarangpur": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Sarangpur Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Sarangpur directly with all major district hubs."
  },
  "yamunotri-uttarakhand": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Uttarkashi along major national highway corridors."
  },
  "ramanathaswamy-long-corridor": {
    "air": "Madurai International Airport (~175 km)",
    "rail": "Rameswaram Railway Station (RMM) (~1.5 km)",
    "bus": "TNSTC & SETC buses run regularly from Madurai, Tiruchirappalli, Kanyakumari, and Chennai."
  },
  "padmanabhaswamy-thiruvananthapuram": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Thiruvananthapuram Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Thiruvananthapuram with major district terminals."
  },
  "mahaganapati-ranjangaon": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Ranjangaon Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Ranjangaon with regional depots."
  },
  "varadharaja-perumal-kanchipuram": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Kanchipuram Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Kanchipuram with municipal bus stands."
  },
  "siddhivinayak-siddhatek": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "kumara-bhimeswara-swamy-samalkota": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Samalkota Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Samalkota."
  },
  "devi-patan-tulsipur": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Balrampur Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Balrampur with regional headquarters."
  },
  "siddhivinayak-mumbai": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "chintpurni-devi-una": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Una with hill stations."
  },
  "tarakeshwar-hooghly": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Tarakeswar Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Tarakeswar bus terminus daily."
  },
  "tungnath-chopta": {
    "air": "Jolly Grant Airport Dehradun (~238 km to Gaurikund) + Helipad services at Phata/Sersi/Guptkashi",
    "rail": "Rishikesh Railway Station (~215 km), Yog Nagari Rishikesh (~218 km)",
    "bus": "GMOU & UTC buses operate from Rishikesh & Haridwar to Sonprayag/Gaurikund; 16 km trek to sanctum."
  },
  "apatsahayesvarar-alangudi": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Valangaiman Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Valangaiman with municipal bus stands."
  },
  "brahma-pushkar": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Pushkar Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Pushkar central stand."
  },
  "thousand-pillar-warangal": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~35 km)",
    "rail": "Secunderabad Junction (~15 km), Hyderabad Deccan (~12 km)",
    "bus": "TSRTC buses run continuously connecting Hanumakonda with Hyderabad MGBS."
  },
  "jwala-ji-kangra": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Kangra with hill stations."
  },
  "kasar-devi-almora": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Almora along major national highway corridors."
  },
  "chottanikkara-bhagavathy-kochi": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Kochi Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Kochi with major district terminals."
  },
  "ramappa-mulugu": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~35 km)",
    "rail": "Secunderabad Junction (~15 km), Hyderabad Deccan (~12 km)",
    "bus": "TSRTC buses run continuously connecting Mulugu with Hyderabad MGBS."
  },
  "guruvayur-kerala": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Guruvayur Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Guruvayur with major district terminals."
  },
  "radha-raman-vrindavan": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Vrindavan Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Vrindavan with regional headquarters."
  },
  "triyuginarayan-rudraprayag": {
    "air": "Jolly Grant Airport Dehradun (~238 km to Gaurikund) + Helipad services at Phata/Sersi/Guptkashi",
    "rail": "Rishikesh Railway Station (~215 km), Yog Nagari Rishikesh (~218 km)",
    "bus": "GMOU & UTC buses operate from Rishikesh & Haridwar to Sonprayag/Gaurikund; 16 km trek to sanctum."
  },
  "draksharamam-bheemeswara-kakinada": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Kakinada Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Kakinada."
  },
  "tiruchendur-murugan-thoothukudi": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Tiruchendur Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Tiruchendur with municipal bus stands."
  },
  "shrinathji-nathdwara": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Nathdwara Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Nathdwara central stand."
  },
  "nageshwar-darukavana-dwarka": {
    "air": "Jamnagar Airport (~135 km), Rajkot Airport (~225 km)",
    "rail": "Dwarka Railway Station (DWK) (~2 km)",
    "bus": "GSRTC sleeper and express buses connect Dwarka directly with Jamnagar, Rajkot, Somnath, and Ahmedabad."
  },
  "prem-vrindavan": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Vrindavan Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Vrindavan with regional headquarters."
  },
  "iskcon-mumbai-juhu": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "mundeshwari-devi-kaimur": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Kaimur Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Kaimur."
  },
  "dhari-devi-srinagar-garhwal": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Pauri Garhwal along major national highway corridors."
  },
  "somnath-divine-gujarat": {
    "air": "Diu Airport (~85 km), Rajkot International Airport (~200 km)",
    "rail": "Veraval Junction (~7 km), Somnath Railway Station (~1 km)",
    "bus": "GSRTC buses connect Somnath directly with Junagadh, Rajkot, Dwarka, and Ahmedabad."
  },
  "pashupatinath-mandsaur": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~90 km), Raja Bhoj Airport Bhopal (~110 km)",
    "rail": "Mandsaur Railway Station (~3 km), Ujjain Junction / Bhopal Junction (~60 km)",
    "bus": "MPRTS and state transport buses run frequently through Mandsaur bus stand."
  },
  "dharbaranyeswarar-thirunallar": {
    "air": "Puducherry Airport (~7 km), Chennai International Airport (~160 km)",
    "rail": "Puducherry Railway Station (~2 km), Villupuram Junction (~38 km)",
    "bus": "PRTC & TNSTC buses run frequently connecting Karaikal with coastal highway routes."
  },
  "srikalahasteeswara-srikalahasti": {
    "air": "Tirupati International Airport (TIR) (~15 km to Tirupati, ~25 km to Srikalahasti)",
    "rail": "Tirupati Main Station (TPTY) (~2 km), Renigunta Junction (~10 km)",
    "bus": "APSRTC & KSRTC buses operate 24/7 from Chennai, Bengaluru, Vijayawada, and Hyderabad."
  },
  "varaha-lakshmi-narasimha-simhachalam": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Visakhapatnam Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Visakhapatnam."
  },
  "venugopala-swamy-krs-mysore": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Mysuru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Mysuru central bus depot."
  },
  "triloknath-lahaul-valley": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Lahaul and Spiti with hill stations."
  },
  "vishnupad-gaya": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Gaya Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Gaya."
  },
  "tulja-bhavani-tuljapur": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Tuljapur Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Tuljapur with regional depots."
  },
  "sankat-mochan-hanuman-varanasi": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~25 km)",
    "rail": "Varanasi Junction (BSB) (~4 km), Banaras (BSBS) (~3 km)",
    "bus": "UPSRTC & local electric buses operate regularly connecting Cantt Bus Stand to Godowlia and Ghats."
  },
  "kondagattu-anjaneya-swamy-jagtial": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~35 km)",
    "rail": "Secunderabad Junction (~15 km), Hyderabad Deccan (~12 km)",
    "bus": "TSRTC buses run continuously connecting Jagtial with Hyderabad MGBS."
  },
  "amarnath-jammu-&-kashmir": {
    "air": "Sheikh ul-Alam International Airport Srinagar (~25 km), Jammu Airport (~60 km)",
    "rail": "Jammu Tawi Railway Station (~50 km), Katra Station (~30 km)",
    "bus": "JKSRTC buses and private taxis ply regularly along Anantnag highway routes."
  },
  "kalighat-kali-kolkata": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~20 km)",
    "rail": "Howrah Junction (~7 km), Sealdah Railway Station (~6 km), Kalighat Metro (~1 km)",
    "bus": "Kolkata Metro and WBTC buses connect Kalighat directly with Howrah, Sealdah, and Esplanade."
  },
  "brihadisvara-thanjavur": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Thanjavur Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Thanjavur with municipal bus stands."
  },
  "dakshineswar-kali-kolkata": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~20 km)",
    "rail": "Howrah Junction (~7 km), Sealdah Railway Station (~6 km), Kalighat Metro (~1 km)",
    "bus": "Kolkata Metro and WBTC buses connect Kalighat directly with Howrah, Sealdah, and Esplanade."
  },
  "jageshwar-almora": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Almora along major national highway corridors."
  },
  "harsiddhi-mata-ujjain": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~55 km)",
    "rail": "Ujjain Junction Railway Station (~2 km)",
    "bus": "MPRTS & interstate buses run frequently from Indore, Bhopal, and Omkareshwar to Ujjain Dewas Gate Stand."
  },
  "dhyanalinga-&-isha-yoga-center": {
    "air": "Coimbatore International Airport (CJB) (~42 km)",
    "rail": "Coimbatore Junction Railway Station (CBE) (~30 km)",
    "bus": "TNSTC bus route 14D operates frequently from Gandhipuram Bus Stand to Isha Yoga Center."
  },
  "kateel-durgaparameshwari-mangalore": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Mangalore Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Mangalore central bus depot."
  },
  "biraja-jajpur": {
    "air": "Biju Patnaik International Airport Bhubaneswar (~70 km)",
    "rail": "Jajpur Railway Station (~3 km), Bhubaneswar Junction (~50 km)",
    "bus": "OSRTC buses connect Jajpur with coastal and central district bus stands."
  },
  "ksheera-ramalingeswara-palakollu": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Palakollu Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Palakollu."
  },
  "badri-vishal-chamoli": {
    "air": "Jolly Grant Airport Dehradun (~315 km)",
    "rail": "Rishikesh Railway Station (~295 km), Haridwar Junction (~318 km)",
    "bus": "UTC and private luxury coaches run directly from Haridwar, Rishikesh, and Joshimath along NH 7."
  },
  "janardhana-swamy-varkala": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Varkala Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Varkala with major district terminals."
  },
  "grishneshwar-red-rock-ellora": {
    "air": "Chhatrapati Sambhajinagar (Aurangabad) Airport (~35 km)",
    "rail": "Chhatrapati Sambhajinagar Railway Station (~30 km)",
    "bus": "MSRTC buses connect Ellora directly from Central Bus Stand Chhatrapati Sambhajinagar."
  },
  "purnagiri-devi-champawat": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Champawat along major national highway corridors."
  },
  "thanumalayan-suchindram": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Suchindram Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Suchindram with municipal bus stands."
  },
  "trimbak-raja-nashik": {
    "air": "Nashik Ozar Airport (~50 km), Chhatrapati Shivaji Maharaj International Airport Mumbai (~170 km)",
    "rail": "Nashik Road Railway Station (NK) (~38 km)",
    "bus": "MSRTC city & express buses ply every 15 minutes between Nashik CBS and Trimbakeshwar bus stand."
  },
  "sarangapani-kumbakonam": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "bhramaramba-devi-srisailam": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~200 km)",
    "rail": "Markapur Road Railway Station (~85 km), Nandyal Junction (~160 km)",
    "bus": "APSRTC & TSRTC buses run round-the-clock from Hyderabad (MGBS), Kurnool, and Vijayawada."
  },
  "jambukeswarar-thiruvanaikaval": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Tiruchirappalli Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Tiruchirappalli with municipal bus stands."
  },
  "trinetreshwar-mahadev-tarnetar": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Surendranagar Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Surendranagar directly with all major district hubs."
  },
  "tapkeshwar-mahadev-dehradun": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Dehradun along major national highway corridors."
  },
  "palani-murugan-dindigul": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Palani Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Palani with municipal bus stands."
  },
  "ahobilam-navanarasimha": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Ahobilam Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Ahobilam."
  },
  "shree-ram-janmabhoomi-ayodhya": {
    "air": "Maharishi Valmiki International Airport Ayodhya (AYJ) (~10 km)",
    "rail": "Ayodhya Dham Junction (AY) (~1 km), Ayodhya Cantt (AYC) (~7 km)",
    "bus": "UPSRTC express buses run continuously from Lucknow (Alambagh), Gorakhpur, Varanasi, and Prayagraj."
  },
  "arunachaleswarar-thiruvannamalai": {
    "air": "Chennai International Airport (~170 km)",
    "rail": "Tiruvannamalai Railway Station (TNM) (~3 km)",
    "bus": "TNSTC & PRTC buses connect Tiruvannamalai directly from Chennai CMBT, Bengaluru, Puducherry, and Salem."
  },
  "vashisht-&-hot-springs-manali": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Kullu with hill stations."
  },
  "birla-laxmi-narayan-jaipur": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Jaipur Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Jaipur central stand."
  },
  "govind-dev-ji-jaipur": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Jaipur Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Jaipur central stand."
  },
  "of-vedic-planetarium-tovp-mayapur": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Mayapur Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Mayapur bus terminus daily."
  },
  "gnana-saraswathi-basar": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~35 km)",
    "rail": "Secunderabad Junction (~15 km), Hyderabad Deccan (~12 km)",
    "bus": "TSRTC buses run continuously connecting Nirmal with Hyderabad MGBS."
  },
  "girgaon-babulnath-hanuman-mumbai": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "mahalaxmi-kolhapur": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "dwarkadhish-ura": {
    "air": "Jamnagar Airport (~135 km), Rajkot Airport (~225 km)",
    "rail": "Dwarka Railway Station (DWK) (~2 km)",
    "bus": "GSRTC sleeper and express buses connect Dwarka directly with Jamnagar, Rajkot, Somnath, and Ahmedabad."
  },
  "pracheen-hanuman-delhi": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "New Delhi Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to New Delhi."
  },
  "mumbadevi-mumbai": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "sharada-devi-maihar": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~90 km), Raja Bhoj Airport Bhopal (~110 km)",
    "rail": "Maihar Railway Station (~3 km), Ujjain Junction / Bhopal Junction (~60 km)",
    "bus": "MPRTS and state transport buses run frequently through Maihar bus stand."
  },
  "mahavir-patna": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Patna Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Patna."
  },
  "khatu-shyam-ji-sikar": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Sikar Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Sikar central stand."
  },
  "naina-devi-bilaspur": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Bilaspur with hill stations."
  },
  "mahalaxmi-mumbai": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "kamakhya-guwahati": {
    "air": "Lokpriya Gopinath Bordoloi International Airport Guwahati (~20 km)",
    "rail": "Kamakhya Junction (KYQ) (~3 km), Guwahati Railway Station (GHY) (~8 km)",
    "bus": "ASTC and city buses connect Nilachal Hill base directly with Guwahati railway station and Paltan Bazaar."
  },
  "ballaleshwar-pali": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Pali Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Pali with regional depots."
  },
  "sarnath-ek-stupa-&": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~25 km)",
    "rail": "Varanasi Junction (BSB) (~4 km), Banaras (BSBS) (~3 km)",
    "bus": "UPSRTC & local electric buses operate regularly connecting Cantt Bus Stand to Godowlia and Ghats."
  },
  "vindhyavasini-vindhyachal": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Mirzapur Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Mirzapur with regional headquarters."
  },
  "karni-mata-rat-deshnoke": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Bikaner Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Bikaner central stand."
  },
  "chinnamasta-rajrappa": {
    "air": "Birsa Munda Airport Ranchi (~110 km), Deoghar Airport (~90 km)",
    "rail": "Ramgarh Railway Station (~3 km), Jasidih Junction / Ranchi Station (~70 km)",
    "bus": "JSRTC and private interstate buses connect Ramgarh directly with capital routes."
  },
  "sabarimala-sree-dharma-sastha": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Pathanamthitta Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Pathanamthitta with major district terminals."
  },
  "kanyakumari-devi-kanyakumari": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Kanyakumari Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Kanyakumari with municipal bus stands."
  },
  "veerabhadra-lepakshi": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Anantapur Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Anantapur."
  },
  "swaminarayan-akshar-delhi": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "New Delhi Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to New Delhi."
  },
  "radha-damodar-vrindavan": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Vrindavan Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Vrindavan with regional headquarters."
  },
  "jogadya-khirgram": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Burdwan Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Burdwan bus terminus daily."
  },
  "chamunda-devi-kangra": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Kangra with hill stations."
  },
  "yadadri-sri-lakshmi-narasimha": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~35 km)",
    "rail": "Secunderabad Junction (~15 km), Hyderabad Deccan (~12 km)",
    "bus": "TSRTC buses run continuously connecting Yadadri Bhuvanagiri with Hyderabad MGBS."
  },
  "mahabodhi-bodh-gaya": {
    "air": "Gaya International Airport (GAY) (~10 km), Patna Airport (~115 km)",
    "rail": "Gaya Junction (GAYA) (~16 km)",
    "bus": "BSRTC tourist buses and auto-rickshaws run every 10 minutes between Gaya Junction and Bodh Gaya."
  },
  "mookambika-kollur": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Udupi Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Udupi central bus depot."
  },
  "ananta-vasudeva-bhubaneswar": {
    "air": "Biju Patnaik International Airport Bhubaneswar (~70 km)",
    "rail": "Bhubaneswar Railway Station (~3 km), Bhubaneswar Junction (~50 km)",
    "bus": "OSRTC buses connect Bhubaneswar with coastal and central district bus stands."
  },
  "shri-krishna-janmasthan-ura": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Mathura Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Mathura with regional headquarters."
  },
  "anandamayi-ma-haridwar": {
    "air": "Jolly Grant Airport Dehradun (~20 km to Rishikesh, ~35 km to Haridwar)",
    "rail": "Haridwar Junction (HW) / Yog Nagari Rishikesh (YNRK) (~3 km)",
    "bus": "UTC Volvo & express buses run continuously from ISBT Kashmiri Gate Delhi to Haridwar & Rishikesh."
  },
  "murudeshwar-karnataka": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Murudeshwar Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Murudeshwar central bus depot."
  },
  "tara-tarini-ganjam": {
    "air": "Biju Patnaik International Airport Bhubaneswar (~70 km)",
    "rail": "Berhampur Railway Station (~3 km), Bhubaneswar Junction (~50 km)",
    "bus": "OSRTC buses connect Berhampur with coastal and central district bus stands."
  },
  "kainchi-nainital": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Nainital along major national highway corridors."
  },
  "parmarth-niketan-rishikesh": {
    "air": "Jolly Grant Airport Dehradun (~20 km to Rishikesh, ~35 km to Haridwar)",
    "rail": "Haridwar Junction (HW) / Yog Nagari Rishikesh (YNRK) (~3 km)",
    "bus": "UTC Volvo & express buses run continuously from ISBT Kashmiri Gate Delhi to Haridwar & Rishikesh."
  },
  "ekambareswarar-kanchipuram": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Kanchipuram Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Kanchipuram with municipal bus stands."
  },
  "trinetra-ganesh-ranthambore": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Sawai Madhopur Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Sawai Madhopur central stand."
  },
  "kanaka-durga-vijayawada": {
    "air": "Vijayawada International Airport (~80 km), Visakhapatnam Airport (~90 km), Tirupati Airport (~80 km)",
    "rail": "Vijayawada Railway Station (~3 km), Vijayawada Junction (~60 km)",
    "bus": "APSRTC Super Luxury & Ultra Deluxe buses ply continuously through Vijayawada."
  },
  "tiruttani-murugan-tiruvallur": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Tiruttani Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Tiruttani with municipal bus stands."
  },
  "tirupati-balaji-andhra-pradesh": {
    "air": "Tirupati International Airport (TIR) (~15 km to Tirupati, ~25 km to Srikalahasti)",
    "rail": "Tirupati Main Station (TPTY) (~2 km), Renigunta Junction (~10 km)",
    "bus": "APSRTC & KSRTC buses operate 24/7 from Chennai, Bengaluru, Vijayawada, and Hyderabad."
  },
  "danteshwari-dantewada": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Dantewada Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Dantewada."
  },
  "gangotri-uttarakhand": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Uttarkashi along major national highway corridors."
  },
  "salasar-balaji-churu": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Salasar Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Salasar central stand."
  },
  "mangaladevi-mangalore": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Mangaluru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Mangaluru central bus depot."
  },
  "mehendipur-balaji-dausa": {
    "air": "Jaipur International Airport (~140 km), Jodhpur Airport (~130 km), Udaipur Airport (~110 km)",
    "rail": "Dausa Railway Station (~3 km), Jaipur Junction (~90 km)",
    "bus": "RSRTC express and private Volvo buses run daily routes through Dausa central stand."
  },
  "sun-modhera": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Mehsana Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Mehsana directly with all major district hubs."
  },
  "baidyanath-deoghar": {
    "air": "Deoghar Airport (DGH) (~12 km), Birsa Munda Airport Ranchi (~250 km)",
    "rail": "Baidyanathdham Station (~1 km), Jasidih Junction (JSME) (~8 km)",
    "bus": "JSRTC and private buses connect Deoghar directly with Ranchi, Patna, Asansol, and Kolkata."
  },
  "bhimashankar-maharashtra": {
    "air": "Pune International Airport (~110 km)",
    "rail": "Pune Junction Railway Station (~110 km)",
    "bus": "MSRTC buses operate regularly from Pune (Shivajinagar/Swargate) and Manchar to Bhimashankar."
  },
  "grishneshwar-ellora": {
    "air": "Chhatrapati Sambhajinagar (Aurangabad) Airport (~35 km)",
    "rail": "Chhatrapati Sambhajinagar Railway Station (~30 km)",
    "bus": "MSRTC buses connect Ellora directly from Central Bus Stand Chhatrapati Sambhajinagar."
  },
  "kashi-vishwanath-varanasi": {
    "air": "Varanasi Babatpur Airport (25 km)",
    "rail": "Varanasi Junction (4.5 km)",
    "bus": "Varanasi Bus Stand (5 km)"
  },
  "kedarnath-uttarakhand": {
    "air": "Jolly Grant Airport Dehradun (~238 km to Gaurikund) + Helipad services at Phata/Sersi/Guptkashi",
    "rail": "Rishikesh Railway Station (~215 km), Yog Nagari Rishikesh (~218 km)",
    "bus": "GMOU & UTC buses operate from Rishikesh & Haridwar to Sonprayag/Gaurikund; 16 km trek to sanctum."
  },
  "mahakaleshwar-ujjain": {
    "air": "Indore Airport (55 km)",
    "rail": "Ujjain Junction (1.5 km)",
    "bus": "Ujjain Bus Stand (2 km)"
  },
  "nageshwar-dwarka": {
    "air": "Jamnagar Airport (~135 km), Rajkot Airport (~225 km)",
    "rail": "Dwarka Railway Station (DWK) (~2 km)",
    "bus": "GSRTC sleeper and express buses connect Dwarka directly with Jamnagar, Rajkot, Somnath, and Ahmedabad."
  },
  "omkareshwar-madhya-pradesh": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~85 km)",
    "rail": "Omkareshwar Road Station (~12 km), Khandwa Junction (~70 km), Indore Junction (~80 km)",
    "bus": "MPRTS buses connect Omkareshwar directly with Indore, Ujjain, and Khandwa."
  },
  "ramanathaswamy-rameswaram": {
    "air": "Madurai International Airport (~175 km)",
    "rail": "Rameswaram Railway Station (RMM) (~1.5 km)",
    "bus": "TNSTC & SETC buses run regularly from Madurai, Tiruchirappalli, Kanyakumari, and Chennai."
  },
  "somnath-gujarat": {
    "air": "Diu Airport (85 km)",
    "rail": "Veraval Junction (7 km)",
    "bus": "Somnath Bus Stand (6 km)"
  },
  "trimbakeshwar-nashik": {
    "air": "Nashik Ozar Airport (~50 km), Chhatrapati Shivaji Maharaj International Airport Mumbai (~170 km)",
    "rail": "Nashik Road Railway Station (NK) (~38 km)",
    "bus": "MSRTC city & express buses ply every 15 minutes between Nashik CBS and Trimbakeshwar bus stand."
  },
  "nagaraja-nagercoil": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Nagercoil Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Nagercoil with municipal bus stands."
  },
  "tulsi-manas-varanasi": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~25 km)",
    "rail": "Varanasi Junction (BSB) (~4 km), Banaras (BSBS) (~3 km)",
    "bus": "UPSRTC & local electric buses operate regularly connecting Cantt Bus Stand to Godowlia and Ghats."
  },
  "sita-ramachandra-swamy-bhadrachalam": {
    "air": "Rajiv Gandhi International Airport Hyderabad (~35 km)",
    "rail": "Secunderabad Junction (~15 km), Hyderabad Deccan (~12 km)",
    "bus": "TSRTC buses run continuously connecting Bhadrachalam with Hyderabad MGBS."
  },
  "sri-ranganathaswamy-srirangam": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Tiruchirappalli Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Tiruchirappalli with municipal bus stands."
  },
  "virupaksha-hampi": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Hampi Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Hampi central bus depot."
  },
  "baba-baidyanath-deoghar": {
    "air": "Deoghar Airport (DGH) (~12 km), Birsa Munda Airport Ranchi (~250 km)",
    "rail": "Baidyanathdham Station (~1 km), Jasidih Junction (JSME) (~8 km)",
    "bus": "JSRTC and private buses connect Deoghar directly with Ranchi, Patna, Asansol, and Kolkata."
  },
  "bankey-bihari-vrindavan": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Vrindavan Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Vrindavan with regional headquarters."
  },
  "shri-bala-hanuman-jamnagar": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Jamnagar Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Jamnagar directly with all major district hubs."
  },
  "punaura-janaki-sitamarhi": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Sitamarhi Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Sitamarhi."
  },
  "omkareshwar-island-narmada": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~85 km)",
    "rail": "Omkareshwar Road Station (~12 km), Khandwa Junction (~70 km), Indore Junction (~80 km)",
    "bus": "MPRTS buses connect Omkareshwar directly with Indore, Ujjain, and Khandwa."
  },
  "kailasanathar-thingalur": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Thanjavur Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Thanjavur with municipal bus stands."
  },
  "shirdi-sai-baba-maharashtra": {
    "air": "Shirdi International Airport (SAG) (~14 km)",
    "rail": "Sainagar Shirdi Railway Station (SNSI) (~3 km), Kopergaon Station (~16 km)",
    "bus": "MSRTC sleeper & luxury Volvo buses operate non-stop from Mumbai, Pune, Nashik, and Surat."
  },
  "chennakesava-belur": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~20 km)",
    "rail": "Howrah Junction (~7 km), Sealdah Railway Station (~6 km), Kalighat Metro (~1 km)",
    "bus": "Kolkata Metro and WBTC buses connect Kalighat directly with Howrah, Sealdah, and Esplanade."
  },
  "bhimashankar-forest-pune": {
    "air": "Pune International Airport (~110 km)",
    "rail": "Pune Junction Railway Station (~110 km)",
    "bus": "MSRTC buses operate regularly from Pune (Shivajinagar/Swargate) and Manchar to Bhimashankar."
  },
  "brajeshwari-devi-kangra": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Kangra with hill stations."
  },
  "chamundeshwari-mysore": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Mysuru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Mysuru central bus depot."
  },
  "sri-dhanvantari-nelluvai": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Thrissur Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Thrissur with major district terminals."
  },
  "somnath-maha-kshetra": {
    "air": "Diu Airport (~85 km), Rajkot International Airport (~200 km)",
    "rail": "Veraval Junction (~7 km), Somnath Railway Station (~1 km)",
    "bus": "GSRTC buses connect Somnath directly with Junagadh, Rajkot, Dwarka, and Ahmedabad."
  },
  "iskcon-bangalore-aarti": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Bengaluru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Bengaluru central bus depot."
  },
  "iskcon-juhu-mumbai": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "shri-mahalakshmi": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "meenakshi-madurai": {
    "air": "Madurai International Airport (IXM) (~12 km)",
    "rail": "Madurai Junction Railway Station (MDU) (~1.5 km)",
    "bus": "TNSTC buses connect Mattuthavani & Periyar bus stands directly to Meenakshi Temple."
  },
  "shree-siddhivinayak-ganapati": {
    "air": "Chhatrapati Shivaji Maharaj International Airport Mumbai (~10 km)",
    "rail": "Dadar Railway Station (~2 km), CSMT (~10 km), Churchgate (~12 km)",
    "bus": "BEST city buses, Mumbai Metro, local trains, and black-and-yellow taxis operate round the clock."
  },
  "attukal-bhagavathy-thiruvananthapuram": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Thiruvananthapuram Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Thiruvananthapuram with major district terminals."
  },
  "parli-vaijnath-beed": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Beed Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Beed with regional depots."
  },
  "kamakshi-amman-kanchipuram": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Kanchipuram Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Kanchipuram with municipal bus stands."
  },
  "kotilingeshwara-kolar": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Kolar Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Kolar central bus depot."
  },
  "pazhamudircholai-murugan-madurai": {
    "air": "Madurai International Airport (IXM) (~12 km)",
    "rail": "Madurai Junction Railway Station (MDU) (~1.5 km)",
    "bus": "TNSTC buses connect Mattuthavani & Periyar bus stands directly to Meenakshi Temple."
  },
  "bhalka-tirth-veraval": {
    "air": "Diu Airport (~85 km), Rajkot International Airport (~200 km)",
    "rail": "Veraval Junction (~7 km), Somnath Railway Station (~1 km)",
    "bus": "GSRTC buses connect Somnath directly with Junagadh, Rajkot, Dwarka, and Ahmedabad."
  },
  "bijli-mahadev-kullu": {
    "air": "Gaggal Airport Kangra (~50 km), Shimla Airport Jubbarhatti (~40 km), Kullu Bhuntar Airport (~60 km)",
    "rail": "Pathankot Junction (~80 km), Kalka Railway Station (~60 km), Shimla Station (~20 km)",
    "bus": "HRTC deluxe mountain buses operate daily connecting Kullu with hill stations."
  },
  "kalaram-nashik": {
    "air": "Nashik Ozar Airport (~50 km), Chhatrapati Shivaji Maharaj International Airport Mumbai (~170 km)",
    "rail": "Nashik Road Railway Station (NK) (~38 km)",
    "bus": "MSRTC city & express buses ply every 15 minutes between Nashik CBS and Trimbakeshwar bus stand."
  },
  "vighnahar-ozar": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Ozar Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Ozar with regional depots."
  },
  "girijatmak-lenyadri": {
    "air": "Chhatrapati Shivaji Maharaj Airport Mumbai (~140 km), Pune Airport (~130 km)",
    "rail": "Junnar Railway Station (~3 km), Pune Junction / Dadar Station (~70 km)",
    "bus": "MSRTC Shivneri and express buses ply regularly connecting Junnar with regional depots."
  },
  "lingaraj-bhubaneswar": {
    "air": "Biju Patnaik International Airport Bhubaneswar (~70 km)",
    "rail": "Bhubaneswar Railway Station (~3 km), Bhubaneswar Junction (~50 km)",
    "bus": "OSRTC buses connect Bhubaneswar with coastal and central district bus stands."
  },
  "triprayar-sree-rama-thrissur": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Thrissur Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Thrissur with major district terminals."
  },
  "vaitheeswaran-koil-mayiladuthurai": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "gommateshwara-statue-shravanabelagola": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Hassan Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Hassan central bus depot."
  },
  "alopi-devi-prayagraj": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Prayagraj Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Prayagraj with regional headquarters."
  },
  "ambaji-gujarat": {
    "air": "Sardar Vallabhbhai Patel International Airport Ahmedabad (~120 km), Rajkot Airport (~100 km)",
    "rail": "Ambaji Railway Station (~3 km), Ahmedabad Junction (~80 km)",
    "bus": "GSRTC sleeper and Gurjarnagri buses connect Ambaji directly with all major district hubs."
  },
  "dwarkadhish-dwarka": {
    "air": "Jamnagar Airport (~135 km), Rajkot Airport (~225 km)",
    "rail": "Dwarka Railway Station (DWK) (~2 km)",
    "bus": "GSRTC sleeper and express buses connect Dwarka directly with Jamnagar, Rajkot, Somnath, and Ahmedabad."
  },
  "hanuman-garhi-ayodhya": {
    "air": "Maharishi Valmiki International Airport Ayodhya (AYJ) (~10 km)",
    "rail": "Ayodhya Dham Junction (AY) (~1 km), Ayodhya Cantt (AYC) (~7 km)",
    "bus": "UPSRTC express buses run continuously from Lucknow (Alambagh), Gorakhpur, Varanasi, and Prayagraj."
  },
  "iskcon-bengaluru-karnataka": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Bengaluru Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Bengaluru central bus depot."
  },
  "suryanar-kovil-kumbakonam": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "sri-ramanasramam-tiruvannamalai": {
    "air": "Chennai International Airport (~170 km)",
    "rail": "Tiruvannamalai Railway Station (TNM) (~3 km)",
    "bus": "TNSTC & PRTC buses connect Tiruvannamalai directly from Chennai CMBT, Bengaluru, Puducherry, and Salem."
  },
  "mahabaleshwar-gokarna": {
    "air": "Kempegowda International Airport Bengaluru (~120 km), Mangaluru Airport (~110 km)",
    "rail": "Gokarna Railway Station (~4 km), Bengaluru City Station (~60 km)",
    "bus": "KSRTC express and sleeper buses operate continuously to Gokarna central bus depot."
  },
  "nalateswari-nalhati": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Nalhati Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Nalhati bus terminus daily."
  },
  "bhojeshwar-bhojpur": {
    "air": "Devi Ahilya Bai Holkar Airport Indore (~90 km), Raja Bhoj Airport Bhopal (~110 km)",
    "rail": "Bhojpur Railway Station (~3 km), Ujjain Junction / Bhopal Junction (~60 km)",
    "bus": "MPRTS and state transport buses run frequently through Bhojpur bus stand."
  },
  "fullara-attahas-birbhum": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Labhpur Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Labhpur bus terminus daily."
  },
  "baijnath-bageshwar": {
    "air": "Jolly Grant Airport Dehradun (~80 km), Pantnagar Airport (~90 km)",
    "rail": "Rishikesh / Haridwar Junction (~60 km), Kathgodam Railway Station (~70 km)",
    "bus": "UTC & GMOU hill buses connect Bageshwar along major national highway corridors."
  },
  "kankalitala-bolpur": {
    "air": "Netaji Subhash Chandra Bose International Airport Kolkata (~100 km), Bagdogra Airport (~120 km)",
    "rail": "Bolpur Railway Station (~4 km), Howrah Junction (~80 km)",
    "bus": "WBTC and private intercity buses serve Bolpur bus terminus daily."
  },
  "kapaleeshwarar-mylapore": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Chennai Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Chennai with municipal bus stands."
  },
  "iskcon-vrindavan": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Vrindavan Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Vrindavan with regional headquarters."
  },
  "thillai-nataraja-chidambaram": {
    "air": "Chennai International Airport / Madurai Airport (~90 km)",
    "rail": "Chidambaram Railway Station (~3 km), Madurai Junction (~50 km)",
    "bus": "TNSTC and SETC buses run round-the-clock connecting Chidambaram with municipal bus stands."
  },
  "shri-dwarkadhish-dwarka": {
    "air": "Jamnagar Airport (~135 km), Rajkot Airport (~225 km)",
    "rail": "Dwarka Railway Station (DWK) (~2 km)",
    "bus": "GSRTC sleeper and express buses connect Dwarka directly with Jamnagar, Rajkot, Somnath, and Ahmedabad."
  },
  "aranmula-parthasarathy-pathanamthitta": {
    "air": "Cochin International Airport (~85 km), Trivandrum Airport (~120 km)",
    "rail": "Aranmula Railway Station (~3 km), Ernakulam Junction (~45 km)",
    "bus": "KSRTC and private luxury buses operate frequently connecting Aranmula with major district terminals."
  },
  "agniswarar-kanchanur": {
    "air": "Tiruchirappalli International Airport (TRZ) (~90 km)",
    "rail": "Kumbakonam Railway Station (KMU) (~2 km), Mayiladuthurai Junction (~20 km)",
    "bus": "TNSTC buses connect Kumbakonam bus stand directly with Tanjore, Chidambaram, Chennai, and Trichy."
  },
  "gorakhnath-gorakhpur": {
    "air": "Lal Bahadur Shastri Airport Varanasi (~70 km), Chaudhary Charan Singh Airport Lucknow (~110 km)",
    "rail": "Gorakhpur Railway Station (~3 km), Varanasi Junction / Lucknow Charbagh (~60 km)",
    "bus": "UPSRTC Janrath and AC buses connect Gorakhpur with regional headquarters."
  },
  "chandi-devi-haridwar": {
    "air": "Jolly Grant Airport Dehradun (~20 km to Rishikesh, ~35 km to Haridwar)",
    "rail": "Haridwar Junction (HW) / Yog Nagari Rishikesh (YNRK) (~3 km)",
    "bus": "UTC Volvo & express buses run continuously from ISBT Kashmiri Gate Delhi to Haridwar & Rishikesh."
  },
  "badi-patan-devi-patna": {
    "air": "Nearest regional airport (~60 km)",
    "rail": "Patna Railway Station (~5 km)",
    "bus": "State transport and private buses operate regular services to Patna."
  },
  "kedarnath-himalayan": {
    "air": "Jolly Grant Airport Dehradun (~238 km to Gaurikund) + Helipad services at Phata/Sersi/Guptkashi",
    "rail": "Rishikesh Railway Station (~215 km), Yog Nagari Rishikesh (~218 km)",
    "bus": "GMOU & UTC buses operate from Rishikesh & Haridwar to Sonprayag/Gaurikund; 16 km trek to sanctum."
  },
  "thiruparankundram-murugan-madurai": {
    "air": "Madurai International Airport (IXM) (~12 km)",
    "rail": "Madurai Junction Railway Station (MDU) (~1.5 km)",
    "bus": "TNSTC buses connect Mattuthavani & Periyar bus stands directly to Meenakshi Temple."
  },
  "ramnagar-fort-varanasi": {
    "air": "Lal Bahadur Shastri International Airport Varanasi (~25 km)",
    "rail": "Varanasi Junction (BSB) (~4 km), Banaras (BSBS) (~3 km)",
    "bus": "UPSRTC & local electric buses operate regularly connecting Cantt Bus Stand to Godowlia and Ghats."
  }
};

export const TEMPLE_TRANSPORT_ALIASES: Record<string, string> = {
  "somnath": "somnath",
  "mallikarjuna": "mallikarjuna",
  "mahakaleshwar": "mahakaleshwar",
  "omkareshwar": "omkareshwar",
  "kedarnath": "kedarnath",
  "bhimashankar": "bhimashankar",
  "kashi": "kashi",
  "trimbakeshwar": "trimbakeshwar",
  "baidyanath": "baidyanath",
  "nageshwar": "nageshwar",
  "ramanathaswamy": "ramanathaswamy",
  "grishneshwar": "grishneshwar",
  "badrinath": "badrinath",
  "dwarkadhish": "dwarkadhish",
  "jagannath-puri": "jagannath-puri",
  "vaishno-devi": "vaishno-devi",
  "kamakhya": "kamakhya",
  "meenakshi": "meenakshi",
  "mahalaxmi": "mahalaxmi",
  "kalighat": "kalighat",
  "ambaji": "ambaji",
  "chamundeshwari": "chamundeshwari",
  "golden-temple": "golden-temple",
  "shirdi": "shirdi",
  "tirupati": "tirupati",
  "siddhivinayak": "siddhivinayak",
  "ramanasramam": "ramanasramam",
  "dhyanalinga": "dhyanalinga",
  "virupaksha": "virupaksha",
  "anandamayi": "anandamayi",
  "mehendipur": "mehendipur",
  "parmarth": "parmarth",
  "aurobindo": "aurobindo",
  "belur": "belur",
  "sarnath": "sarnath",
  "mahabodhi": "mahabodhi",
  "mookambika": "mookambika",
  "chottanikkara": "chottanikkara",
  "vaitheeswaran": "vaitheeswaran",
  "parli": "parli",
  "dhanvantari": "dhanvantari",
  "suchindram": "suchindram",
  "ghati-subramanya": "ghati-subramanya",
  "srikalahasti": "srikalahasti",
  "kukke": "kukke",
  "horanadu": "horanadu",
  "mangaladevi": "mangaladevi",
  "ambalappuzha": "ambalappuzha",
  "mallikarjuna-srisailam": "mallikarjuna-srisailam",
  "shiva-mallikarjuna-srisailam-hills": "mallikarjuna-srisailam",
  "03abhqee4jiqtw68lqtu": "mallikarjuna-srisailam",
  "mallikarjuna srisailam temple": "mallikarjuna-srisailam",
  "renuka-devi-mahur": "renuka-devi-mahur",
  "shaktipeeth-renuka-devi-temple-mahur": "renuka-devi-mahur",
  "08pxdmr1ellkhjrthadk": "renuka-devi-mahur",
  "renuka devi temple – mahur": "renuka-devi-mahur",
  "renuka devi temple": "renuka-devi-mahur",
  "chardham-jagannath-temple-puri": "jagannath-puri",
  "0hfpwt5bhkt6ei8f0hfa": "jagannath-puri",
  "jagannath temple – puri": "jagannath-puri",
  "jagannath temple": "jagannath-puri",
  "mayureshwar-morgaon": "mayureshwar-morgaon",
  "ashtavinayak-mayureshwar-temple-morgaon": "mayureshwar-morgaon",
  "0hdlczpzohjcatktpcbc": "mayureshwar-morgaon",
  "mayureshwar temple – morgaon": "mayureshwar-morgaon",
  "mayureshwar temple": "mayureshwar-morgaon",
  "ambalappuzha-sri-krishna-alappuzha": "ambalappuzha-sri-krishna-alappuzha",
  "sacred-ambalappuzha-sree-krishna-temple": "ambalappuzha-sri-krishna-alappuzha",
  "0rgrdnopk9ngg7jkclpl": "ambalappuzha-sri-krishna-alappuzha",
  "ambalappuzha sri krishna temple – alappuzha": "ambalappuzha-sri-krishna-alappuzha",
  "ambalappuzha sri krishna temple": "ambalappuzha-sri-krishna-alappuzha",
  "sankat-mochan-shimla": "sankat-mochan-shimla",
  "hanuman-sankat-mochan-shimla": "sankat-mochan-shimla",
  "1eps4bbjvb3cnfkkjkoe": "sankat-mochan-shimla",
  "sankat mochan temple – shimla": "sankat-mochan-shimla",
  "sankat mochan temple": "sankat-mochan-shimla",
  "ghati-subramanya-doddaballapur": "ghati-subramanya-doddaballapur",
  "healing-ghati-subramanya-temple": "ghati-subramanya-doddaballapur",
  "2dbo7xbfpgt2zxsnithf": "ghati-subramanya-doddaballapur",
  "ghati subramanya temple – doddaballapur": "ghati-subramanya-doddaballapur",
  "ghati subramanya temple": "ghati-subramanya-doddaballapur",
  "jakhu-shimla": "jakhu-shimla",
  "hanuman-jakhu-temple-shimla": "jakhu-shimla",
  "2mfgiz2xswzdpeszpfh3": "jakhu-shimla",
  "jakhu temple – shimla": "jakhu-shimla",
  "jakhu temple": "jakhu-shimla",
  "pashupatinath-indo-nepal-border": "pashupatinath-indo-nepal-border",
  "shiva-pashupatinath-temple-nepal-border": "pashupatinath-indo-nepal-border",
  "2udyelbdwk1yy3uwnqo4": "pashupatinath-indo-nepal-border",
  "pashupatinath shrine – indo-nepal border": "pashupatinath-indo-nepal-border",
  "pashupatinath shrine": "pashupatinath-indo-nepal-border",
  "tanot-mata-jaisalmer": "tanot-mata-jaisalmer",
  "sacred-tanot-mata-temple-jaisalmer": "tanot-mata-jaisalmer",
  "37t4zb9pvlgwrh9u1le4": "tanot-mata-jaisalmer",
  "tanot mata temple – jaisalmer": "tanot-mata-jaisalmer",
  "tanot mata temple": "tanot-mata-jaisalmer",
  "thirunageswaram-naganathar": "thirunageswaram-naganathar",
  "sacred-thirunageswaram-naganathar-temple": "thirunageswaram-naganathar",
  "3gtmty0s4tusafdztmef": "thirunageswaram-naganathar",
  "thirunageswaram naganathar temple": "thirunageswaram-naganathar",
  "bakreshwar-birbhum": "bakreshwar-birbhum",
  "shaktipeeth-bakreshwar-temple-birbhum": "bakreshwar-birbhum",
  "4btys0ks1cotglth5blm": "bakreshwar-birbhum",
  "bakreshwar temple – birbhum": "bakreshwar-birbhum",
  "bakreshwar temple": "bakreshwar-birbhum",
  "varadhavinayak-mahad": "varadhavinayak-mahad",
  "ashtavinayak-varadhavinayak-temple-mahad": "varadhavinayak-mahad",
  "4faoeb9hx0cee7qh3e6n": "varadhavinayak-mahad",
  "varadhavinayak temple – mahad": "varadhavinayak-mahad",
  "varadhavinayak temple": "varadhavinayak-mahad",
  "naganathaswamy-keelaperumpallam": "naganathaswamy-keelaperumpallam",
  "sacred-kethu-temple-keelaperumpallam": "naganathaswamy-keelaperumpallam",
  "4qmo6ynwy8wjgtdtps1j": "naganathaswamy-keelaperumpallam",
  "naganathaswamy temple – keelaperumpallam": "naganathaswamy-keelaperumpallam",
  "naganathaswamy temple": "naganathaswamy-keelaperumpallam",
  "annapoorneshwari-horanadu": "annapoorneshwari-horanadu",
  "devi-horanadu-annapoorneshwari-temple": "annapoorneshwari-horanadu",
  "4wwc0gxs56xdrpkv6ftl": "annapoorneshwari-horanadu",
  "annapoorneshwari temple – horanadu": "annapoorneshwari-horanadu",
  "annapoorneshwari temple": "annapoorneshwari-horanadu",
  "udupi-sri-krishna-udupi": "udupi-sri-krishna-udupi",
  "sacred-udupi-sri-krishna-matha": "udupi-sri-krishna-udupi",
  "50n8usjt1we9tyzqjp3q": "udupi-sri-krishna-udupi",
  "udupi sri krishna matha – udupi": "udupi-sri-krishna-udupi",
  "udupi sri krishna matha": "udupi-sri-krishna-udupi",
  "vithoba-pandharpur": "vithoba-pandharpur",
  "vishnu-vitthal-temple-pandharpur": "vithoba-pandharpur",
  "5eh3t52ratkfb1cieoba": "vithoba-pandharpur",
  "vithoba temple – pandharpur": "vithoba-pandharpur",
  "vithoba temple": "vithoba-pandharpur",
  "mahakal-ujjain": "mahakal-ujjain",
  "shiva-mahakaleshwar-bhasma-temple": "mahakal-ujjain",
  "5gmdwyyaa38wx46qlyun": "mahakal-ujjain",
  "mahakal jyotirlinga shrine – ujjain": "mahakal-ujjain",
  "mahakal jyotirlinga shrine": "mahakal-ujjain",
  "vaishno-devi-jammu-&-kashmir": "vaishno-devi-jammu-&-kashmir",
  "shaktipeeth-vaishno-devi-temple-jammu-kashmir": "vaishno-devi-jammu-&-kashmir",
  "5vawxjlgfdm16y0jdile": "vaishno-devi-jammu-&-kashmir",
  "vaishno devi temple – jammu & kashmir": "vaishno-devi-jammu-&-kashmir",
  "vaishno devi temple": "vaishno-devi-jammu-&-kashmir",
  "sree-vallabha-thiruvalla": "sree-vallabha-thiruvalla",
  "sacred-thiruvalla-sree-vallabha-temple": "sree-vallabha-thiruvalla",
  "6aksoultaltb708deznu": "sree-vallabha-thiruvalla",
  "sree vallabha temple – thiruvalla": "sree-vallabha-thiruvalla",
  "sree vallabha temple": "sree-vallabha-thiruvalla",
  "swamimalai-murugan-thanjavur": "swamimalai-murugan-thanjavur",
  "sacred-swamimalai-murugan-temple": "swamimalai-murugan-thanjavur",
  "6rx5rysvzra49bdemhuo": "swamimalai-murugan-thanjavur",
  "swamimalai murugan temple – thanjavur": "swamimalai-murugan-thanjavur",
  "swamimalai murugan temple": "swamimalai-murugan-thanjavur",
  "vadakkunnathan-thrissur": "vadakkunnathan-thrissur",
  "shiva-vadakkunnathan-temple-thrissur": "vadakkunnathan-thrissur",
  "6s59vqpdfqskvaaatyd5": "vadakkunnathan-thrissur",
  "vadakkunnathan temple – thrissur": "vadakkunnathan-thrissur",
  "vadakkunnathan temple": "vadakkunnathan-thrissur",
  "ayodhya-ram": "ayodhya-ram",
  "vishnu-shri-ram-mandir-ayodhya": "ayodhya-ram",
  "7di6qmfywyv3flbb37w3": "ayodhya-ram",
  "ayodhya ram mandir complex": "ayodhya-ram",
  "srivilliputhur-andal-virudhunagar": "srivilliputhur-andal-virudhunagar",
  "sacred-srivilliputhur-andal-temple": "srivilliputhur-andal-virudhunagar",
  "81cn00dttcmsvjcsgkhf": "srivilliputhur-andal-virudhunagar",
  "srivilliputhur andal temple – virudhunagar": "srivilliputhur-andal-virudhunagar",
  "srivilliputhur andal temple": "srivilliputhur-andal-virudhunagar",
  "hinglaj-mata-barmer": "hinglaj-mata-barmer",
  "shaktipeeth-hinglaj-devi-rajasthan": "hinglaj-mata-barmer",
  "89oa8r8mkzuodjctwnln": "hinglaj-mata-barmer",
  "hinglaj mata temple – barmer": "hinglaj-mata-barmer",
  "hinglaj mata temple": "hinglaj-mata-barmer",
  "kashi-vishwanath-corridor": "kashi-vishwanath-corridor",
  "shiva-kashi-vishwanath-corridor-varanasi": "kashi-vishwanath-corridor",
  "8akfrkrpydaxwnmko3jy": "kashi-vishwanath-corridor",
  "kashi vishwanath corridor shrine": "kashi-vishwanath-corridor",
  "sammed-shikharji-giridih": "sammed-shikharji-giridih",
  "sacred-sammed-shikharji-parasnath": "sammed-shikharji-giridih",
  "8alrbblnjlur0wg4kdpm": "sammed-shikharji-giridih",
  "sammed shikharji – giridih": "sammed-shikharji-giridih",
  "sammed shikharji": "sammed-shikharji-giridih",
  "chintamani-theur": "chintamani-theur",
  "ashtavinayak-chintamani-temple-theur": "chintamani-theur",
  "8coqxxm2m0aee4embgdi": "chintamani-theur",
  "chintamani temple – theur": "chintamani-theur",
  "chintamani temple": "chintamani-theur",
  "adi-kumbeswarar-kumbakonam": "adi-kumbeswarar-kumbakonam",
  "sacred-kumbeshwarar-temple-kumbakonam": "adi-kumbeswarar-kumbakonam",
  "8iavbcebhru3rqmzodtk": "adi-kumbeswarar-kumbakonam",
  "adi kumbeswarar temple – kumbakonam": "adi-kumbeswarar-kumbakonam",
  "adi kumbeswarar temple": "adi-kumbeswarar-kumbakonam",
  "naina-devi-nainital": "naina-devi-nainital",
  "sacred-naini-devi-temple-nainital": "naina-devi-nainital",
  "8vjaxrfgqu0lndhmlhe1": "naina-devi-nainital",
  "naina devi temple – nainital": "naina-devi-nainital",
  "naina devi temple": "naina-devi-bilaspur",
  "gopnath-mahadev-bhavnagar": "gopnath-mahadev-bhavnagar",
  "sacred-gopnath-mahadev-temple-bhavnagar": "gopnath-mahadev-bhavnagar",
  "8cvh8y6yqlngnsoxfcsq": "gopnath-mahadev-bhavnagar",
  "gopnath mahadev temple – bhavnagar": "gopnath-mahadev-bhavnagar",
  "gopnath mahadev temple": "gopnath-mahadev-bhavnagar",
  "kalika-mata-pavagadh": "kalika-mata-pavagadh",
  "sacred-mahakali-temple-pavagadh": "kalika-mata-pavagadh",
  "8sz8d7odqv3ca0jms8zg": "kalika-mata-pavagadh",
  "kalika mata temple – pavagadh": "kalika-mata-pavagadh",
  "kalika mata temple": "kalika-mata-pavagadh",
  "kamakhya-devi-assam": "kamakhya-devi-assam",
  "devi-kamakhya-peeth-guwahati": "kamakhya-devi-assam",
  "8ulqf8kvt3yqawaqc208": "kamakhya-devi-assam",
  "kamakhya devi sanctuary – assam": "kamakhya-devi-assam",
  "kamakhya devi sanctuary": "kamakhya-devi-assam",
  "somnath-veraval": "somnath-veraval",
  "shiva-somnath-patan-gujarat": "somnath-veraval",
  "965y4sna4pikh9tfjwcs": "somnath-veraval",
  "somnath jyotirlinga shrine – veraval": "somnath-veraval",
  "somnath jyotirlinga shrine": "somnath-veraval",
  "tarapith-birbhum": "tarapith-birbhum",
  "shaktipeeth-tarapith-temple-birbhum": "tarapith-birbhum",
  "9fpemjtxrlc8ooeleqs0": "tarapith-birbhum",
  "tarapith temple – birbhum": "tarapith-birbhum",
  "tarapith temple": "tarapith-birbhum",
  "hidimba-devi-manali": "hidimba-devi-manali",
  "sacred-hadimba-devi-temple-manali": "hidimba-devi-manali",
  "9qme1n7icamnftszs1nv": "hidimba-devi-manali",
  "hidimba devi temple – manali": "hidimba-devi-manali",
  "hidimba devi temple": "hidimba-devi-manali",
  "raeertham-vizianagaram": "raeertham-vizianagaram",
  "sacred-ramatheertham-vizianagaram": "raeertham-vizianagaram",
  "9sz8mfmmrvh7ssacajzu": "raeertham-vizianagaram",
  "ramatheertham temple – vizianagaram": "raeertham-vizianagaram",
  "ramatheertham temple": "raeertham-vizianagaram",
  "amareswara-swamy-amaravati": "amareswara-swamy-amaravati",
  "sacred-amararamam-amaraswaraswamy-temple": "amareswara-swamy-amaravati",
  "a2euztlfsjri0tuhdckv": "amareswara-swamy-amaravati",
  "amareswara swamy temple – amaravati": "amareswara-swamy-amaravati",
  "amareswara swamy temple": "amareswara-swamy-amaravati",
  "iskcon-mira-road-thane": "iskcon-mira-road-thane",
  "vishnu-iskcon-mira-road-thane": "iskcon-mira-road-thane",
  "a5xo8668yihw4pkvibbt": "iskcon-mira-road-thane",
  "iskcon mira road – thane": "iskcon-mira-road-thane",
  "iskcon mira road": "iskcon-mira-road-thane",
  "ranakpur-jain-pali": "ranakpur-jain-pali",
  "sacred-ranakpur-jain-temple-pali": "ranakpur-jain-pali",
  "a6hwgf2we5yvva9mbvir": "ranakpur-jain-pali",
  "ranakpur jain temple – pali": "ranakpur-jain-pali",
  "ranakpur jain temple": "ranakpur-jain-pali",
  "sri-aurobindo-puducherry": "sri-aurobindo-puducherry",
  "healing-sri-aurobindo-ashram-puducherry": "sri-aurobindo-puducherry",
  "adni907vtd4stm4smslg": "sri-aurobindo-puducherry",
  "sri aurobindo ashram – puducherry": "sri-aurobindo-puducherry",
  "sri aurobindo ashram": "sri-aurobindo-puducherry",
  "neelkanth-mahadev-rishikesh": "neelkanth-mahadev-rishikesh",
  "sacred-neelkanth-mahadev-temple-rishikesh": "neelkanth-mahadev-rishikesh",
  "alyt3ahi82r8ya5zjtok": "neelkanth-mahadev-rishikesh",
  "neelkanth mahadev temple – rishikesh": "neelkanth-mahadev-rishikesh",
  "neelkanth mahadev temple": "neelkanth-mahadev-rishikesh",
  "chamundi-hill-mysuru": "chamundi-hill-mysuru",
  "sacred-chamundeshwari-hill-mysore": "chamundi-hill-mysuru",
  "anmjgg4j0cn7piypzcer": "chamundi-hill-mysuru",
  "chamundi hill sanctuary – mysuru": "chamundi-hill-mysuru",
  "chamundi hill sanctuary": "chamundi-hill-mysuru",
  "bhairavnath-shiva-rajrappa": "bhairavnath-shiva-rajrappa",
  "shiva-chinnamastika-shiva-temple": "bhairavnath-shiva-rajrappa",
  "aqxa93v1503sfgqxvsrf": "bhairavnath-shiva-rajrappa",
  "bhairavnath shiva shrine – rajrappa": "bhairavnath-shiva-rajrappa",
  "bhairavnath shiva shrine": "bhairavnath-shiva-rajrappa",
  "golden-amritsar": "golden-amritsar",
  "sacred-golden-temple-amritsar": "golden-amritsar",
  "bjfpcngktngxwgw1fqso": "golden-amritsar",
  "golden temple – amritsar": "golden-amritsar",
  "golden temple": "golden-amritsar",
  "uppiliappan-kumbakonam": "uppiliappan-kumbakonam",
  "sacred-oppiliappan-temple-kumbakonam": "uppiliappan-kumbakonam",
  "bxu3njx31mvf9mmbnqaq": "uppiliappan-kumbakonam",
  "uppiliappan temple – kumbakonam": "uppiliappan-kumbakonam",
  "uppiliappan temple": "uppiliappan-kumbakonam",
  "sharada-kashmir": "sharada-kashmir",
  "shaktipeeth-sharda-peeth-kashmir": "sharada-kashmir",
  "bli0l8wjgcie1wblmubu": "sharada-kashmir",
  "sharada peeth – kashmir": "sharada-kashmir",
  "sharada peeth": "sharada-kashmir",
  "mansa-devi-haridwar": "mansa-devi-haridwar",
  "devi-mansa-devi-temple-haridwar": "mansa-devi-haridwar",
  "bt9chv3tzf3ckia2f4kn": "mansa-devi-haridwar",
  "mansa devi temple – haridwar": "mansa-devi-haridwar",
  "mansa devi temple": "mansa-devi-haridwar",
  "somnath-coastal-pilgrimage": "somnath-coastal-pilgrimage",
  "sacred-somnath-gujarat-coastal": "somnath-coastal-pilgrimage",
  "cjx15pvkibr9loy5xtws": "somnath-coastal-pilgrimage",
  "somnath coastal pilgrimage sanctuary": "somnath-coastal-pilgrimage",
  "dilwara-s-mount-abu": "dilwara-s-mount-abu",
  "sacred-dilwara-jain-temples-mount-abu": "dilwara-s-mount-abu",
  "cqxyvg3gbs2o76rb6i7f": "dilwara-s-mount-abu",
  "dilwara temples – mount abu": "dilwara-s-mount-abu",
  "dilwara temples": "dilwara-s-mount-abu",
  "belur-howrah": "belur-howrah",
  "sacred-belur-math-ramakrishna-mission": "belur-howrah",
  "dtrmucbaxr9v5gjfo2kb": "belur-howrah",
  "belur math – howrah": "belur-howrah",
  "belur math": "belur-howrah",
  "tripura-sundari-udaipur": "tripura-sundari-udaipur",
  "shaktipeeth-tripora-sundari-temple-tripura": "tripura-sundari-udaipur",
  "e35dqfvnb2zj60gp4goi": "tripura-sundari-udaipur",
  "tripura sundari temple – udaipur": "tripura-sundari-udaipur",
  "tripura sundari temple": "tripura-sundari-udaipur",
  "someshwara-swamy-bhimavaram": "someshwara-swamy-bhimavaram",
  "sacred-somaramam-someshwara-swamy-temple": "someshwara-swamy-bhimavaram",
  "eb3qiu9hncrjydrjkpbb": "someshwara-swamy-bhimavaram",
  "someshwara swamy temple – bhimavaram": "someshwara-swamy-bhimavaram",
  "someshwara swamy temple": "someshwara-swamy-bhimavaram",
  "bade-hanuman-lying-hanuman-prayagraj": "bade-hanuman-lying-hanuman-prayagraj",
  "hanuman-bade-hanuman-mandir-prayagraj": "bade-hanuman-lying-hanuman-prayagraj",
  "eqvpmfha4vwbts8nmwau": "bade-hanuman-lying-hanuman-prayagraj",
  "bade hanuman mandir (lying hanuman) – prayagraj": "bade-hanuman-lying-hanuman-prayagraj",
  "bade hanuman mandir (lying hanuman)": "bade-hanuman-lying-hanuman-prayagraj",
  "kukke-subramanya-dakshina-kannada": "kukke-subramanya-dakshina-kannada",
  "sacred-kukke-subramanya-temple": "kukke-subramanya-dakshina-kannada",
  "espwlwwpvbchslwmsvhj": "kukke-subramanya-dakshina-kannada",
  "kukke subramanya temple – dakshina kannada": "kukke-subramanya-dakshina-kannada",
  "kukke subramanya temple": "kukke-subramanya-dakshina-kannada",
  "badrinath-uttarakhand": "badrinath-uttarakhand",
  "vishnu-badrinath-temple-char-dham": "badrinath-uttarakhand",
  "ewwlj2p3b2k6ypdt6di4": "badrinath-uttarakhand",
  "badrinath shrine – uttarakhand": "badrinath-uttarakhand",
  "badrinath shrine": "badrinath-uttarakhand",
  "saptashrungi-nivasini-vani": "saptashrungi-nivasini-vani",
  "shaktipeeth-saptashrungi-temple-nashik": "saptashrungi-nivasini-vani",
  "feownmwowghegjsn1uzs": "saptashrungi-nivasini-vani",
  "saptashrungi nivasini temple – vani": "saptashrungi-nivasini-vani",
  "saptashrungi nivasini temple": "saptashrungi-nivasini-vani",
  "murudeshwar-coastal": "murudeshwar-coastal",
  "sacred-murudeshwar-coastal-temple": "murudeshwar-coastal",
  "fkav6vrumrmxwgjuiicn": "murudeshwar-coastal",
  "murudeshwar coastal sanctuary": "murudeshwar-coastal",
  "shree-kashtabhanjan-dev-hanumanji-sarangpur": "shree-kashtabhanjan-dev-hanumanji-sarangpur",
  "hanuman-kashtabhanjan-dev-temple-sarangpur": "shree-kashtabhanjan-dev-hanumanji-sarangpur",
  "fw99cdffpi9weefnfd8c": "shree-kashtabhanjan-dev-hanumanji-sarangpur",
  "shree kashtabhanjan dev hanumanji – sarangpur": "shree-kashtabhanjan-dev-hanumanji-sarangpur",
  "shree kashtabhanjan dev hanumanji": "shree-kashtabhanjan-dev-hanumanji-sarangpur",
  "yamunotri-uttarakhand": "yamunotri-uttarakhand",
  "chardham-yamunotri-temple-uttarakhand": "yamunotri-uttarakhand",
  "fa1uthrpmx2uptpkpop4": "yamunotri-uttarakhand",
  "yamunotri temple – uttarakhand": "yamunotri-uttarakhand",
  "yamunotri temple": "yamunotri-uttarakhand",
  "ramanathaswamy-long-corridor": "ramanathaswamy-long-corridor",
  "shiva-ramanathaswamy-corridor-rameswaram": "ramanathaswamy-long-corridor",
  "gch8j3mqraljmnk8jmge": "ramanathaswamy-long-corridor",
  "ramanathaswamy long corridor temple": "ramanathaswamy-long-corridor",
  "padmanabhaswamy-thiruvananthapuram": "padmanabhaswamy-thiruvananthapuram",
  "vishnu-padmanabhaswamy-temple-thiruvananthapuram": "padmanabhaswamy-thiruvananthapuram",
  "gz4ymqwfhryfqleobzk4": "padmanabhaswamy-thiruvananthapuram",
  "padmanabhaswamy temple – thiruvananthapuram": "padmanabhaswamy-thiruvananthapuram",
  "padmanabhaswamy temple": "padmanabhaswamy-thiruvananthapuram",
  "mahaganapati-ranjangaon": "mahaganapati-ranjangaon",
  "ashtavinayak-mahaganapati-temple-ranjangaon": "mahaganapati-ranjangaon",
  "gckohretvihorvmtrlg0": "mahaganapati-ranjangaon",
  "mahaganapati temple – ranjangaon": "mahaganapati-ranjangaon",
  "mahaganapati temple": "mahaganapati-ranjangaon",
  "varadharaja-perumal-kanchipuram": "varadharaja-perumal-kanchipuram",
  "sacred-varadharaja-perumal-temple-kanchipuram": "varadharaja-perumal-kanchipuram",
  "h1h8woz4k0pxaktgtohq": "varadharaja-perumal-kanchipuram",
  "varadharaja perumal temple – kanchipuram": "varadharaja-perumal-kanchipuram",
  "varadharaja perumal temple": "varadharaja-perumal-kanchipuram",
  "siddhivinayak-siddhatek": "siddhivinayak-siddhatek",
  "ashtavinayak-siddhivinayak-temple-siddhatek": "siddhivinayak-siddhatek",
  "hsysquoiqa3jz5oyct6q": "siddhivinayak-siddhatek",
  "siddhivinayak temple – siddhatek": "siddhivinayak-siddhatek",
  "siddhivinayak temple": "siddhivinayak-mumbai",
  "kumara-bhimeswara-swamy-samalkota": "kumara-bhimeswara-swamy-samalkota",
  "sacred-kumararamam-bhimeswara-swamy": "kumara-bhimeswara-swamy-samalkota",
  "i39jxdddoi8gh4oyuaza": "kumara-bhimeswara-swamy-samalkota",
  "kumara bhimeswara swamy temple – samalkota": "kumara-bhimeswara-swamy-samalkota",
  "kumara bhimeswara swamy temple": "kumara-bhimeswara-swamy-samalkota",
  "devi-patan-tulsipur": "devi-patan-tulsipur",
  "shaktipeeth-devi-patan-temple-balrampur": "devi-patan-tulsipur",
  "icgj9p6dgetsixxqobw3": "devi-patan-tulsipur",
  "devi patan temple – tulsipur": "devi-patan-tulsipur",
  "devi patan temple": "devi-patan-tulsipur",
  "siddhivinayak-mumbai": "siddhivinayak-mumbai",
  "sacred-siddhivinayak-temple-mumbai": "siddhivinayak-mumbai",
  "ilpcwntrabtr43s244ao": "siddhivinayak-mumbai",
  "siddhivinayak temple – mumbai": "siddhivinayak-mumbai",
  "chintpurni-devi-una": "chintpurni-devi-una",
  "shaktipeeth-chintpurni-devi-temple-una": "chintpurni-devi-una",
  "j7qgphamvdkqnvbjdokz": "chintpurni-devi-una",
  "chintpurni devi temple – una": "chintpurni-devi-una",
  "chintpurni devi temple": "chintpurni-devi-una",
  "tarakeshwar-hooghly": "tarakeshwar-hooghly",
  "shiva-tarakeshwar-temple-hooghly": "tarakeshwar-hooghly",
  "jtluxxt7o3jlrgnezmxf": "tarakeshwar-hooghly",
  "tarakeshwar temple – hooghly": "tarakeshwar-hooghly",
  "tarakeshwar temple": "tarakeshwar-hooghly",
  "tungnath-chopta": "tungnath-chopta",
  "shiva-tungnath-temple-chopta": "tungnath-chopta",
  "k4rciinahfeayownkejp": "tungnath-chopta",
  "tungnath temple – chopta": "tungnath-chopta",
  "tungnath temple": "tungnath-chopta",
  "apatsahayesvarar-alangudi": "apatsahayesvarar-alangudi",
  "sacred-alangudi-guru-temple": "apatsahayesvarar-alangudi",
  "k58zinpyp09lhlbxa8ux": "apatsahayesvarar-alangudi",
  "apatsahayesvarar temple – alangudi": "apatsahayesvarar-alangudi",
  "apatsahayesvarar temple": "apatsahayesvarar-alangudi",
  "brahma-pushkar": "brahma-pushkar",
  "sacred-brahma-temple-pushkar": "brahma-pushkar",
  "kpubjsmxiwtoy2xgoe1z": "brahma-pushkar",
  "brahma temple – pushkar": "brahma-pushkar",
  "brahma temple": "brahma-pushkar",
  "thousand-pillar-warangal": "thousand-pillar-warangal",
  "sacred-thousand-pillar-temple-warangal": "thousand-pillar-warangal",
  "kyeczmkl1dyqhs5yyyo5": "thousand-pillar-warangal",
  "thousand pillar temple – warangal": "thousand-pillar-warangal",
  "thousand pillar temple": "thousand-pillar-warangal",
  "jwala-ji-kangra": "jwala-ji-kangra",
  "shaktipeeth-jwala-ji-temple-kangra": "jwala-ji-kangra",
  "khngz0yksfumeewrenhl": "jwala-ji-kangra",
  "jwala ji temple – kangra": "jwala-ji-kangra",
  "jwala ji temple": "jwala-ji-kangra",
  "kasar-devi-almora": "kasar-devi-almora",
  "sacred-kasar-devi-temple-almora": "kasar-devi-almora",
  "kkxf7axrfvqerchlazrq": "kasar-devi-almora",
  "kasar devi temple – almora": "kasar-devi-almora",
  "kasar devi temple": "kasar-devi-almora",
  "chottanikkara-bhagavathy-kochi": "chottanikkara-bhagavathy-kochi",
  "devi-chottanikara-temple-kochi": "chottanikkara-bhagavathy-kochi",
  "krpkgexwhktt5hl1ymut": "chottanikkara-bhagavathy-kochi",
  "chottanikkara bhagavathy temple – kochi": "chottanikkara-bhagavathy-kochi",
  "chottanikkara bhagavathy temple": "chottanikkara-bhagavathy-kochi",
  "ramappa-mulugu": "ramappa-mulugu",
  "sacred-ramappa-temple-mulugu": "ramappa-mulugu",
  "l8opaf8b4j9jetwjwd8z": "ramappa-mulugu",
  "ramappa temple – mulugu": "ramappa-mulugu",
  "ramappa temple": "ramappa-mulugu",
  "guruvayur-kerala": "guruvayur-kerala",
  "vishnu-guruvayur-temple-kerala": "guruvayur-kerala",
  "lymldf5eqsivlxqjy3ni": "guruvayur-kerala",
  "guruvayur temple – kerala": "guruvayur-kerala",
  "guruvayur temple": "guruvayur-kerala",
  "radha-raman-vrindavan": "radha-raman-vrindavan",
  "vishnu-radha-raman-temple-vrindavan": "radha-raman-vrindavan",
  "m20cizy9rrrrozvb97on": "radha-raman-vrindavan",
  "radha raman temple – vrindavan": "radha-raman-vrindavan",
  "radha raman temple": "radha-raman-vrindavan",
  "triyuginarayan-rudraprayag": "triyuginarayan-rudraprayag",
  "sacred-triyuginarayan-temple-rudraprayag": "triyuginarayan-rudraprayag",
  "m3m2x21tbiligekqbuaq": "triyuginarayan-rudraprayag",
  "triyuginarayan temple – rudraprayag": "triyuginarayan-rudraprayag",
  "triyuginarayan temple": "triyuginarayan-rudraprayag",
  "draksharamam-bheemeswara-kakinada": "draksharamam-bheemeswara-kakinada",
  "sacred-draksharamam-bheemeswara-temple": "draksharamam-bheemeswara-kakinada",
  "m3yn7arm5f73ikmz1qag": "draksharamam-bheemeswara-kakinada",
  "draksharamam bheemeswara temple – kakinada": "draksharamam-bheemeswara-kakinada",
  "draksharamam bheemeswara temple": "draksharamam-bheemeswara-kakinada",
  "tiruchendur-murugan-thoothukudi": "tiruchendur-murugan-thoothukudi",
  "sacred-tiruchendur-murugan-temple": "tiruchendur-murugan-thoothukudi",
  "m4rgoutex9vmunoc05ly": "tiruchendur-murugan-thoothukudi",
  "tiruchendur murugan temple – thoothukudi": "tiruchendur-murugan-thoothukudi",
  "tiruchendur murugan temple": "tiruchendur-murugan-thoothukudi",
  "shrinathji-nathdwara": "shrinathji-nathdwara",
  "vishnu-nathdwara-shrinathji-temple": "shrinathji-nathdwara",
  "mdfwk7jwni7uantslbtn": "shrinathji-nathdwara",
  "shrinathji temple – nathdwara": "shrinathji-nathdwara",
  "shrinathji temple": "shrinathji-nathdwara",
  "nageshwar-darukavana-dwarka": "nageshwar-darukavana-dwarka",
  "shiva-nageshwar-darukavana-gujarat": "nageshwar-darukavana-dwarka",
  "mkl8qru1ergspgqfvgrl": "nageshwar-darukavana-dwarka",
  "nageshwar darukavana shrine – dwarka": "nageshwar-darukavana-dwarka",
  "nageshwar darukavana shrine": "nageshwar-darukavana-dwarka",
  "prem-vrindavan": "prem-vrindavan",
  "vishnu-prem-mandir-vrindavan": "prem-vrindavan",
  "mxnecxemtkmqaptowpeo": "prem-vrindavan",
  "prem mandir – vrindavan": "prem-vrindavan",
  "prem mandir": "prem-vrindavan",
  "iskcon-mumbai-juhu": "iskcon-mumbai-juhu",
  "vishnu-iskcon-temple-mumbai": "iskcon-mumbai-juhu",
  "mcnkind3sfnl2el8cutl": "iskcon-mumbai-juhu",
  "iskcon temple mumbai – juhu": "iskcon-mumbai-juhu",
  "iskcon temple mumbai": "iskcon-mumbai-juhu",
  "mundeshwari-devi-kaimur": "mundeshwari-devi-kaimur",
  "sacred-mundeshwari-devi-temple-kaimur": "mundeshwari-devi-kaimur",
  "mvwt1caalygmyiqcqpko": "mundeshwari-devi-kaimur",
  "mundeshwari devi temple – kaimur": "mundeshwari-devi-kaimur",
  "mundeshwari devi temple": "mundeshwari-devi-kaimur",
  "dhari-devi-srinagar-garhwal": "dhari-devi-srinagar-garhwal",
  "sacred-dhari-devi-temple-srinagar-garhwal": "dhari-devi-srinagar-garhwal",
  "mylbln26hkjc2aeckitq": "dhari-devi-srinagar-garhwal",
  "dhari devi temple – srinagar garhwal": "dhari-devi-srinagar-garhwal",
  "dhari devi temple": "dhari-devi-srinagar-garhwal",
  "somnath-divine-gujarat": "somnath-divine-gujarat",
  "sacred-somnath-temple-prabhas-patan": "somnath-divine-gujarat",
  "nu9qwwu1wji7rvsdj8gr": "somnath-divine-gujarat",
  "somnath divine shrine – gujarat": "somnath-divine-gujarat",
  "somnath divine shrine": "somnath-divine-gujarat",
  "pashupatinath-mandsaur": "pashupatinath-mandsaur",
  "shiva-pashupatinath-temple-mandsaur": "pashupatinath-mandsaur",
  "nur1ynfcc7rovuomfmuq": "pashupatinath-mandsaur",
  "pashupatinath temple – mandsaur": "pashupatinath-mandsaur",
  "pashupatinath temple": "pashupatinath-mandsaur",
  "dharbaranyeswarar-thirunallar": "dharbaranyeswarar-thirunallar",
  "sacred-thirunallar-saneeswaran-temple": "dharbaranyeswarar-thirunallar",
  "nhhjgfbr4j7bxgpksi1d": "dharbaranyeswarar-thirunallar",
  "dharbaranyeswarar temple – thirunallar": "dharbaranyeswarar-thirunallar",
  "dharbaranyeswarar temple": "dharbaranyeswarar-thirunallar",
  "srikalahasteeswara-srikalahasti": "srikalahasteeswara-srikalahasti",
  "panchbhoota-srikalahasteeswara-temple-srikalahasti": "srikalahasteeswara-srikalahasti",
  "oab7zzwmn3kujrtqrznf": "srikalahasteeswara-srikalahasti",
  "srikalahasteeswara temple – srikalahasti": "srikalahasteeswara-srikalahasti",
  "srikalahasteeswara temple": "srikalahasteeswara-srikalahasti",
  "varaha-lakshmi-narasimha-simhachalam": "varaha-lakshmi-narasimha-simhachalam",
  "vishnu-simhachalam-temple-visakhapatnam": "varaha-lakshmi-narasimha-simhachalam",
  "oco1rx0rzdobha90apu2": "varaha-lakshmi-narasimha-simhachalam",
  "varaha lakshmi narasimha temple – simhachalam": "varaha-lakshmi-narasimha-simhachalam",
  "varaha lakshmi narasimha temple": "varaha-lakshmi-narasimha-simhachalam",
  "venugopala-swamy-krs-mysore": "venugopala-swamy-krs-mysore",
  "vishnu-venugopala-swamy-temple-mysore": "venugopala-swamy-krs-mysore",
  "ooximzzfldjrxbwm8bws": "venugopala-swamy-krs-mysore",
  "venugopala swamy temple – krs mysore": "venugopala-swamy-krs-mysore",
  "venugopala swamy temple": "venugopala-swamy-krs-mysore",
  "triloknath-lahaul-valley": "triloknath-lahaul-valley",
  "sacred-triloknath-temple-lahaul": "triloknath-lahaul-valley",
  "oqve0pdnqehs5ljnj2af": "triloknath-lahaul-valley",
  "triloknath temple – lahaul valley": "triloknath-lahaul-valley",
  "triloknath temple": "triloknath-lahaul-valley",
  "vishnupad-gaya": "vishnupad-gaya",
  "sacred-vishnupad-temple-gaya": "vishnupad-gaya",
  "oux3s3xohnvldkmst4tl": "vishnupad-gaya",
  "vishnupad temple – gaya": "vishnupad-gaya",
  "vishnupad temple": "vishnupad-gaya",
  "tulja-bhavani-tuljapur": "tulja-bhavani-tuljapur",
  "shaktipeeth-bhavani-mandir-tuljapur": "tulja-bhavani-tuljapur",
  "ovwk1l9z2hli64v84l3m": "tulja-bhavani-tuljapur",
  "tulja bhavani temple – tuljapur": "tulja-bhavani-tuljapur",
  "tulja bhavani temple": "tulja-bhavani-tuljapur",
  "sankat-mochan-hanuman-varanasi": "sankat-mochan-hanuman-varanasi",
  "hanuman-sankat-mochan-temple-varanasi": "sankat-mochan-hanuman-varanasi",
  "pbeeijakajwt3ue2pvxj": "sankat-mochan-hanuman-varanasi",
  "sankat mochan hanuman temple – varanasi": "sankat-mochan-hanuman-varanasi",
  "sankat mochan hanuman temple": "sankat-mochan-hanuman-varanasi",
  "kondagattu-anjaneya-swamy-jagtial": "kondagattu-anjaneya-swamy-jagtial",
  "sacred-kondagattu-anjaneya-swamy-temple": "kondagattu-anjaneya-swamy-jagtial",
  "pgklurndwkkprplaiptr": "kondagattu-anjaneya-swamy-jagtial",
  "kondagattu anjaneya swamy temple – jagtial": "kondagattu-anjaneya-swamy-jagtial",
  "kondagattu anjaneya swamy temple": "kondagattu-anjaneya-swamy-jagtial",
  "amarnath-jammu-&-kashmir": "amarnath-jammu-&-kashmir",
  "shiva-amarnath-cave-temple-kashmir": "amarnath-jammu-&-kashmir",
  "q46oq6xnqyej1cskxtu3": "amarnath-jammu-&-kashmir",
  "amarnath temple – jammu & kashmir": "amarnath-jammu-&-kashmir",
  "amarnath temple": "amarnath-jammu-&-kashmir",
  "kalighat-kali-kolkata": "kalighat-kali-kolkata",
  "shaktipeeth-kalighat-kali-temple-kolkata": "kalighat-kali-kolkata",
  "r0rcbxgp6wwiza0bqdk3": "kalighat-kali-kolkata",
  "kalighat kali temple – kolkata": "kalighat-kali-kolkata",
  "kalighat kali temple": "kalighat-kali-kolkata",
  "brihadisvara-thanjavur": "brihadisvara-thanjavur",
  "shiva-brihadisvara-temple-thanjavur": "brihadisvara-thanjavur",
  "rdsed7srscn2xxtgiymb": "brihadisvara-thanjavur",
  "brihadisvara temple – thanjavur": "brihadisvara-thanjavur",
  "brihadisvara temple": "brihadisvara-thanjavur",
  "dakshineswar-kali-kolkata": "dakshineswar-kali-kolkata",
  "devi-dakshineswar-kali-temple-kolkata": "dakshineswar-kali-kolkata",
  "revz1xlfd7nathplmg2j": "dakshineswar-kali-kolkata",
  "dakshineswar kali temple – kolkata": "dakshineswar-kali-kolkata",
  "dakshineswar kali temple": "dakshineswar-kali-kolkata",
  "jageshwar-almora": "jageshwar-almora",
  "sacred-jageshwar-dham-almora": "jageshwar-almora",
  "ror5m7uucw8zfefiy4k1": "jageshwar-almora",
  "jageshwar dham temple complex – almora": "jageshwar-almora",
  "jageshwar dham temple complex": "jageshwar-almora",
  "harsiddhi-mata-ujjain": "harsiddhi-mata-ujjain",
  "shaktipeeth-harsiddhi-mata-temple-ujjain": "harsiddhi-mata-ujjain",
  "rwhljjggxrxtnpsni8gb": "harsiddhi-mata-ujjain",
  "harsiddhi mata temple – ujjain": "harsiddhi-mata-ujjain",
  "harsiddhi mata temple": "harsiddhi-mata-ujjain",
  "dhyanalinga-&-isha-yoga-center": "dhyanalinga-&-isha-yoga-center",
  "healing-dhyanalinga-isha-coimbatore": "dhyanalinga-&-isha-yoga-center",
  "reoda2z7uzfwqrpf00to": "dhyanalinga-&-isha-yoga-center",
  "dhyanalinga & isha yoga center": "dhyanalinga-&-isha-yoga-center",
  "kateel-durgaparameshwari-mangalore": "kateel-durgaparameshwari-mangalore",
  "devi-katil-durgaparameshwari-temple": "kateel-durgaparameshwari-mangalore",
  "s026cs265dc7wureq6gk": "kateel-durgaparameshwari-mangalore",
  "kateel durgaparameshwari temple – mangalore": "kateel-durgaparameshwari-mangalore",
  "kateel durgaparameshwari temple": "kateel-durgaparameshwari-mangalore",
  "biraja-jajpur": "biraja-jajpur",
  "shaktipeeth-biraja-temple-jajpur": "biraja-jajpur",
  "s9q9yz8cyecgkqnj1084": "biraja-jajpur",
  "biraja temple – jajpur": "biraja-jajpur",
  "biraja temple": "biraja-jajpur",
  "ksheera-ramalingeswara-palakollu": "ksheera-ramalingeswara-palakollu",
  "sacred-ksheeraramam-ksheera-ramalingeswara": "ksheera-ramalingeswara-palakollu",
  "slnfubhqpr0rifdmchl7": "ksheera-ramalingeswara-palakollu",
  "ksheera ramalingeswara temple – palakollu": "ksheera-ramalingeswara-palakollu",
  "ksheera ramalingeswara temple": "ksheera-ramalingeswara-palakollu",
  "badri-vishal-chamoli": "badri-vishal-chamoli",
  "vishnu-badrinath-dham-chamoli": "badri-vishal-chamoli",
  "snbkg7kajwqcy7evriqh": "badri-vishal-chamoli",
  "badri vishal temple – chamoli": "badri-vishal-chamoli",
  "badri vishal temple": "badri-vishal-chamoli",
  "janardhana-swamy-varkala": "janardhana-swamy-varkala",
  "sacred-janardhana-swamy-temple-varkala": "janardhana-swamy-varkala",
  "ss7ayw8bhzevryemx6bl": "janardhana-swamy-varkala",
  "janardhana swamy temple – varkala": "janardhana-swamy-varkala",
  "janardhana swamy temple": "janardhana-swamy-varkala",
  "grishneshwar-red-rock-ellora": "grishneshwar-red-rock-ellora",
  "shiva-grishneshwar-ellora-caves": "grishneshwar-red-rock-ellora",
  "tbh6pghkmptugivhuw1c": "grishneshwar-red-rock-ellora",
  "grishneshwar red rock temple – ellora": "grishneshwar-red-rock-ellora",
  "grishneshwar red rock temple": "grishneshwar-red-rock-ellora",
  "purnagiri-devi-champawat": "purnagiri-devi-champawat",
  "sacred-purnagiri-devi-temple-champawat": "purnagiri-devi-champawat",
  "tjclcrbivjxw3xbr7azk": "purnagiri-devi-champawat",
  "purnagiri devi temple – champawat": "purnagiri-devi-champawat",
  "purnagiri devi temple": "purnagiri-devi-champawat",
  "thanumalayan-suchindram": "thanumalayan-suchindram",
  "sacred-suchindram-thanumalayan-temple": "thanumalayan-suchindram",
  "tly6skkopybzbwdyzlhs": "thanumalayan-suchindram",
  "thanumalayan temple – suchindram": "thanumalayan-suchindram",
  "thanumalayan temple": "thanumalayan-suchindram",
  "trimbak-raja-nashik": "trimbak-raja-nashik",
  "shiva-trimbakeshwar-dham-nashik": "trimbak-raja-nashik",
  "ur7e2jphygxywr8kefyj": "trimbak-raja-nashik",
  "trimbak raja temple – nashik": "trimbak-raja-nashik",
  "trimbak raja temple": "trimbak-raja-nashik",
  "sarangapani-kumbakonam": "sarangapani-kumbakonam",
  "sacred-sarangapani-temple-kumbakonam": "sarangapani-kumbakonam",
  "uabysmozwjcxoraoxpus": "sarangapani-kumbakonam",
  "sarangapani temple – kumbakonam": "sarangapani-kumbakonam",
  "sarangapani temple": "sarangapani-kumbakonam",
  "bhramaramba-devi-srisailam": "bhramaramba-devi-srisailam",
  "devi-bhramara-ambika-temple-srisailam": "bhramaramba-devi-srisailam",
  "ut1rvimxkqys9mt69add": "bhramaramba-devi-srisailam",
  "bhramaramba devi temple – srisailam": "bhramaramba-devi-srisailam",
  "bhramaramba devi temple": "bhramaramba-devi-srisailam",
  "jambukeswarar-thiruvanaikaval": "jambukeswarar-thiruvanaikaval",
  "panchbhoota-jambukeswarar-temple-thiruvanaikaval": "jambukeswarar-thiruvanaikaval",
  "vgmssv6p4zxnmna01mnu": "jambukeswarar-thiruvanaikaval",
  "jambukeswarar temple – thiruvanaikaval": "jambukeswarar-thiruvanaikaval",
  "jambukeswarar temple": "jambukeswarar-thiruvanaikaval",
  "trinetreshwar-mahadev-tarnetar": "trinetreshwar-mahadev-tarnetar",
  "sacred-tarnetar-mahadev-temple-surendranagar": "trinetreshwar-mahadev-tarnetar",
  "vmffntti4hloszpmzyv6": "trinetreshwar-mahadev-tarnetar",
  "trinetreshwar mahadev temple – tarnetar": "trinetreshwar-mahadev-tarnetar",
  "trinetreshwar mahadev temple": "trinetreshwar-mahadev-tarnetar",
  "tapkeshwar-mahadev-dehradun": "tapkeshwar-mahadev-dehradun",
  "sacred-tapkeshwar-temple-dehradun": "tapkeshwar-mahadev-dehradun",
  "vww2tlkghh4awwzl6jg7": "tapkeshwar-mahadev-dehradun",
  "tapkeshwar mahadev temple – dehradun": "tapkeshwar-mahadev-dehradun",
  "tapkeshwar mahadev temple": "tapkeshwar-mahadev-dehradun",
  "chardham-badrinath-temple-uttarakhand": "badrinath-uttarakhand",
  "vfoihximy9kkkxlv6so5": "badrinath-uttarakhand",
  "badrinath temple – uttarakhand": "badrinath-uttarakhand",
  "badrinath temple": "badrinath-uttarakhand",
  "palani-murugan-dindigul": "palani-murugan-dindigul",
  "sacred-palani-murugan-temple": "palani-murugan-dindigul",
  "vmrgfjimwzxnrwt96bwg": "palani-murugan-dindigul",
  "palani murugan temple – dindigul": "palani-murugan-dindigul",
  "palani murugan temple": "palani-murugan-dindigul",
  "ahobilam-navanarasimha": "ahobilam-navanarasimha",
  "vishnu-ahobilam-narasimha-temple": "ahobilam-navanarasimha",
  "vy6oz8sb3cxxzxulusoe": "ahobilam-navanarasimha",
  "ahobilam navanarasimha temple": "ahobilam-navanarasimha",
  "shree-ram-janmabhoomi-ayodhya": "shree-ram-janmabhoomi-ayodhya",
  "sacred-shree-ram-janmabhoomi-mandir-ayodhya": "shree-ram-janmabhoomi-ayodhya",
  "wl8flbxehmunbdaud8pl": "shree-ram-janmabhoomi-ayodhya",
  "shree ram janmabhoomi mandir – ayodhya": "shree-ram-janmabhoomi-ayodhya",
  "shree ram janmabhoomi mandir": "shree-ram-janmabhoomi-ayodhya",
  "arunachaleswarar-thiruvannamalai": "arunachaleswarar-thiruvannamalai",
  "panchbhoota-arunachaleswarar-temple-thiruvannamalai": "arunachaleswarar-thiruvannamalai",
  "wrouhft8qw21gm7haqwh": "arunachaleswarar-thiruvannamalai",
  "arunachaleswarar temple – thiruvannamalai": "arunachaleswarar-thiruvannamalai",
  "arunachaleswarar temple": "arunachaleswarar-thiruvannamalai",
  "vashisht-&-hot-springs-manali": "vashisht-&-hot-springs-manali",
  "sacred-vashisht-kund-temple-manali": "vashisht-&-hot-springs-manali",
  "x2wyyamehz2uad7k1tus": "vashisht-&-hot-springs-manali",
  "vashisht temple & hot springs – manali": "vashisht-&-hot-springs-manali",
  "vashisht temple & hot springs": "vashisht-&-hot-springs-manali",
  "birla-laxmi-narayan-jaipur": "birla-laxmi-narayan-jaipur",
  "sacred-birla-mandir-jaipur": "birla-laxmi-narayan-jaipur",
  "x71bvw8iv9gwqpn0uek2": "birla-laxmi-narayan-jaipur",
  "birla mandir (laxmi narayan) – jaipur": "birla-laxmi-narayan-jaipur",
  "birla mandir (laxmi narayan)": "birla-laxmi-narayan-jaipur",
  "govind-dev-ji-jaipur": "govind-dev-ji-jaipur",
  "vishnu-govind-dev-ji-temple-jaipur": "govind-dev-ji-jaipur",
  "x9hkx56upc8ksbv1nkut": "govind-dev-ji-jaipur",
  "govind dev ji temple – jaipur": "govind-dev-ji-jaipur",
  "govind dev ji temple": "govind-dev-ji-jaipur",
  "of-vedic-planetarium-tovp-mayapur": "of-vedic-planetarium-tovp-mayapur",
  "sacred-mayapur-chandrodaya-mandir": "of-vedic-planetarium-tovp-mayapur",
  "xrqjxr7vffy99lrlwwx1": "of-vedic-planetarium-tovp-mayapur",
  "temple of vedic planetarium (tovp) – mayapur": "of-vedic-planetarium-tovp-mayapur",
  "temple of vedic planetarium (tovp)": "of-vedic-planetarium-tovp-mayapur",
  "gnana-saraswathi-basar": "gnana-saraswathi-basar",
  "sacred-gnana-saraswathi-temple-basar": "gnana-saraswathi-basar",
  "y9lc6ahuteu1g0w4atnv": "gnana-saraswathi-basar",
  "gnana saraswathi temple – basar": "gnana-saraswathi-basar",
  "gnana saraswathi temple": "gnana-saraswathi-basar",
  "girgaon-babulnath-hanuman-mumbai": "girgaon-babulnath-hanuman-mumbai",
  "hanuman-maruti-temple-girgaum": "girgaon-babulnath-hanuman-mumbai",
  "yeev66fvwqp966ycbahb": "girgaon-babulnath-hanuman-mumbai",
  "girgaon babulnath hanuman mandir – mumbai": "girgaon-babulnath-hanuman-mumbai",
  "girgaon babulnath hanuman mandir": "girgaon-babulnath-hanuman-mumbai",
  "mahalaxmi-kolhapur": "mahalaxmi-kolhapur",
  "shaktipeeth-mahalaxmi-temple-kolhapur": "mahalaxmi-kolhapur",
  "yybwlm5wyyzkgxrvscdr": "mahalaxmi-kolhapur",
  "mahalaxmi temple – kolhapur": "mahalaxmi-kolhapur",
  "mahalaxmi temple": "mahalaxmi-mumbai",
  "dwarkadhish-ura": "dwarkadhish-ura",
  "vishnu-dwarakadheesh-temple-mathura": "dwarkadhish-ura",
  "z3i7mmjdz0oavpysgiy1": "dwarkadhish-ura",
  "dwarkadhish temple – mathura": "dwarkadhish-ura",
  "dwarkadhish temple": "dwarkadhish-dwarka",
  "pracheen-hanuman-delhi": "pracheen-hanuman-delhi",
  "hanuman-marutam-temple-connaught-place": "pracheen-hanuman-delhi",
  "zdgsgw17iiqgn4hykywc": "pracheen-hanuman-delhi",
  "pracheen hanuman mandir – delhi": "pracheen-hanuman-delhi",
  "pracheen hanuman mandir": "pracheen-hanuman-delhi",
  "mumbadevi-mumbai": "mumbadevi-mumbai",
  "devi-mumbadevi-temple-mumbai": "mumbadevi-mumbai",
  "ztldmcb507jld8nzyfhd": "mumbadevi-mumbai",
  "mumbadevi temple – mumbai": "mumbadevi-mumbai",
  "mumbadevi temple": "mumbadevi-mumbai",
  "sharada-devi-maihar": "sharada-devi-maihar",
  "shaktipeeth-sharada-devi-temple-maihar": "sharada-devi-maihar",
  "zxpdi065tqxvjbtruw7s": "sharada-devi-maihar",
  "sharada devi temple – maihar": "sharada-devi-maihar",
  "sharada devi temple": "sharada-devi-maihar",
  "mahavir-patna": "mahavir-patna",
  "sacred-mahavir-mandir-patna": "mahavir-patna",
  "acztqvmsvjiunyz8phxj": "mahavir-patna",
  "mahavir mandir – patna": "mahavir-patna",
  "mahavir mandir": "mahavir-patna",
  "khatu-shyam-ji-sikar": "khatu-shyam-ji-sikar",
  "sacred-khatu-shyam-temple-sikar": "khatu-shyam-ji-sikar",
  "arezlqvkdz10qj2stc9v": "khatu-shyam-ji-sikar",
  "khatu shyam ji temple – sikar": "khatu-shyam-ji-sikar",
  "khatu shyam ji temple": "khatu-shyam-ji-sikar",
  "naina-devi-bilaspur": "naina-devi-bilaspur",
  "shaktipeeth-naina-devi-temple-bilaspur": "naina-devi-bilaspur",
  "azuih0yrzgktuqf2h7yq": "naina-devi-bilaspur",
  "naina devi temple – bilaspur": "naina-devi-bilaspur",
  "mahalaxmi-mumbai": "mahalaxmi-mumbai",
  "devi-mahalaxmi-temple-mumbai": "mahalaxmi-mumbai",
  "awxxdbmrl4t30plq4dqn": "mahalaxmi-mumbai",
  "mahalaxmi temple – mumbai": "mahalaxmi-mumbai",
  "kamakhya-guwahati": "kamakhya-guwahati",
  "shaktipeeth-kamakhya-temple-guwahati": "kamakhya-guwahati",
  "bgqr42m269efecmbpq1f": "kamakhya-guwahati",
  "kamakhya temple – guwahati": "kamakhya-guwahati",
  "kamakhya temple": "kamakhya-guwahati",
  "ballaleshwar-pali": "ballaleshwar-pali",
  "ashtavinayak-ballaleshwar-temple-pali": "ballaleshwar-pali",
  "bpsw9furjf4eh4tke319": "ballaleshwar-pali",
  "ballaleshwar temple – pali": "ballaleshwar-pali",
  "ballaleshwar temple": "ballaleshwar-pali",
  "sarnath-ek-stupa-&": "sarnath-ek-stupa-&",
  "healing-sarnath-buddhist-monastery": "sarnath-ek-stupa-&",
  "bm2nqnibvjouswkmez8o": "sarnath-ek-stupa-&",
  "sarnath dhamek stupa & monastery": "sarnath-ek-stupa-&",
  "vindhyavasini-vindhyachal": "vindhyavasini-vindhyachal",
  "shaktipeeth-vindhyavasini-temple-vindhyachal": "vindhyavasini-vindhyachal",
  "boyr6tkcdocugyebpdkr": "vindhyavasini-vindhyachal",
  "vindhyavasini temple – vindhyachal": "vindhyavasini-vindhyachal",
  "vindhyavasini temple": "vindhyavasini-vindhyachal",
  "karni-mata-rat-deshnoke": "karni-mata-rat-deshnoke",
  "sacred-karni-mata-temple-deshnoke": "karni-mata-rat-deshnoke",
  "c12ejqmmngpfalu6ptwh": "karni-mata-rat-deshnoke",
  "karni mata temple (rat temple) – deshnoke": "karni-mata-rat-deshnoke",
  "karni mata temple (rat temple)": "karni-mata-rat-deshnoke",
  "chinnamasta-rajrappa": "chinnamasta-rajrappa",
  "shaktipeeth-chinnamasta-temple-rajarappa": "chinnamasta-rajrappa",
  "c8yyasssqh8eosmqmr2t": "chinnamasta-rajrappa",
  "chinnamasta temple – rajrappa": "chinnamasta-rajrappa",
  "chinnamasta temple": "chinnamasta-rajrappa",
  "sabarimala-sree-dharma-sastha": "sabarimala-sree-dharma-sastha",
  "sacred-sabarimala-sree-dharma-sastha-temple": "sabarimala-sree-dharma-sastha",
  "caulrgu2ucpeez3fjpfi": "sabarimala-sree-dharma-sastha",
  "sabarimala sree dharma sastha temple": "sabarimala-sree-dharma-sastha",
  "kanyakumari-devi-kanyakumari": "kanyakumari-devi-kanyakumari",
  "shaktipeeth-kamakhya-kanya-kumari-temple": "kanyakumari-devi-kanyakumari",
  "cesynvigmvtfq7i7qbug": "kanyakumari-devi-kanyakumari",
  "kanyakumari devi temple – kanyakumari": "kanyakumari-devi-kanyakumari",
  "kanyakumari devi temple": "kanyakumari-devi-kanyakumari",
  "veerabhadra-lepakshi": "veerabhadra-lepakshi",
  "sacred-veerabhadra-temple-lepakshi": "veerabhadra-lepakshi",
  "ct63duujbsu4rzimjwgm": "veerabhadra-lepakshi",
  "veerabhadra temple – lepakshi": "veerabhadra-lepakshi",
  "veerabhadra temple": "veerabhadra-lepakshi",
  "swaminarayan-akshar-delhi": "swaminarayan-akshar-delhi",
  "sacred-akshardham-temple-delhi": "swaminarayan-akshar-delhi",
  "d49dkapi0iog9f6to4bi": "swaminarayan-akshar-delhi",
  "swaminarayan akshardham – delhi": "swaminarayan-akshar-delhi",
  "swaminarayan akshardham": "swaminarayan-akshar-delhi",
  "radha-damodar-vrindavan": "radha-damodar-vrindavan",
  "vishnu-radha-damodar-temple-vrindavan": "radha-damodar-vrindavan",
  "d5gu9edwzurkhimgzcus": "radha-damodar-vrindavan",
  "radha damodar temple – vrindavan": "radha-damodar-vrindavan",
  "radha damodar temple": "radha-damodar-vrindavan",
  "jogadya-khirgram": "jogadya-khirgram",
  "shaktipeeth-jogadya-temple-burdwan": "jogadya-khirgram",
  "dpgjtzllhji0ozyx2w1q": "jogadya-khirgram",
  "jogadya temple – khirgram": "jogadya-khirgram",
  "jogadya temple": "jogadya-khirgram",
  "chamunda-devi-kangra": "chamunda-devi-kangra",
  "shaktipeeth-chamunda-devi-temple-kangra": "chamunda-devi-kangra",
  "e5duhlacdqrlc4o7igjv": "chamunda-devi-kangra",
  "chamunda devi temple – kangra": "chamunda-devi-kangra",
  "chamunda devi temple": "chamunda-devi-kangra",
  "yadadri-sri-lakshmi-narasimha": "yadadri-sri-lakshmi-narasimha",
  "sacred-yadadri-narasimha-swamy-temple": "yadadri-sri-lakshmi-narasimha",
  "f7i8kasqboals58xexvp": "yadadri-sri-lakshmi-narasimha",
  "yadadri sri lakshmi narasimha temple": "yadadri-sri-lakshmi-narasimha",
  "mahabodhi-bodh-gaya": "mahabodhi-bodh-gaya",
  "sacred-mahabodhi-temple-bodh-gaya": "mahabodhi-bodh-gaya",
  "f8wgaksvcsvejla7nxwk": "mahabodhi-bodh-gaya",
  "mahabodhi temple complex – bodh gaya": "mahabodhi-bodh-gaya",
  "mahabodhi temple complex": "mahabodhi-bodh-gaya",
  "mookambika-kollur": "mookambika-kollur",
  "devi-kollur-mookambika-temple": "mookambika-kollur",
  "fhe1oi6kcpctzkjyscqo": "mookambika-kollur",
  "mookambika temple – kollur": "mookambika-kollur",
  "mookambika temple": "mookambika-kollur",
  "ananta-vasudeva-bhubaneswar": "ananta-vasudeva-bhubaneswar",
  "vishnu-ananta-vasudeva-temple-bhubaneswar": "ananta-vasudeva-bhubaneswar",
  "fqbrne6h8ikemgyxvroy": "ananta-vasudeva-bhubaneswar",
  "ananta vasudeva temple – bhubaneswar": "ananta-vasudeva-bhubaneswar",
  "ananta vasudeva temple": "ananta-vasudeva-bhubaneswar",
  "shri-krishna-janmasthan-ura": "shri-krishna-janmasthan-ura",
  "vishnu-krishna-janmabhoomi-mathura": "shri-krishna-janmasthan-ura",
  "fzqs99e4lrlov3lplfda": "shri-krishna-janmasthan-ura",
  "shri krishna janmasthan – mathura": "shri-krishna-janmasthan-ura",
  "shri krishna janmasthan": "shri-krishna-janmasthan-ura",
  "anandamayi-ma-haridwar": "anandamayi-ma-haridwar",
  "healing-anandamayi-ma-ashram-haridwar": "anandamayi-ma-haridwar",
  "fxc1tnxmkvbszvf3ku9b": "anandamayi-ma-haridwar",
  "anandamayi ma ashram – haridwar": "anandamayi-ma-haridwar",
  "anandamayi ma ashram": "anandamayi-ma-haridwar",
  "murudeshwar-karnataka": "murudeshwar-karnataka",
  "shiva-murudeshwar-temple-karnataka": "murudeshwar-karnataka",
  "gabq0ig3e9k11g1kb6wh": "murudeshwar-karnataka",
  "murudeshwar temple – karnataka": "murudeshwar-karnataka",
  "murudeshwar temple": "murudeshwar-karnataka",
  "tara-tarini-ganjam": "tara-tarini-ganjam",
  "shaktipeeth-tara-tarini-temple-ganjam": "tara-tarini-ganjam",
  "gm0fgwhqweqqrde277gl": "tara-tarini-ganjam",
  "tara tarini temple – ganjam": "tara-tarini-ganjam",
  "tara tarini temple": "tara-tarini-ganjam",
  "kainchi-nainital": "kainchi-nainital",
  "hanuman-kainchi-dham-neem-karoli": "kainchi-nainital",
  "gqt8qbj9e75tsv9lu0hj": "kainchi-nainital",
  "kainchi dham ashram – nainital": "kainchi-nainital",
  "kainchi dham ashram": "kainchi-nainital",
  "parmarth-niketan-rishikesh": "parmarth-niketan-rishikesh",
  "healing-parmarth-niketan-rishikesh": "parmarth-niketan-rishikesh",
  "gk9ovjmwolqg8gw5fyzf": "parmarth-niketan-rishikesh",
  "parmarth niketan ashram – rishikesh": "parmarth-niketan-rishikesh",
  "parmarth niketan ashram": "parmarth-niketan-rishikesh",
  "ekambareswarar-kanchipuram": "ekambareswarar-kanchipuram",
  "panchbhoota-ekambareswarar-temple-kanchipuram": "ekambareswarar-kanchipuram",
  "hclqmvvohgueayvroqli": "ekambareswarar-kanchipuram",
  "ekambareswarar temple – kanchipuram": "ekambareswarar-kanchipuram",
  "ekambareswarar temple": "ekambareswarar-kanchipuram",
  "trinetra-ganesh-ranthambore": "trinetra-ganesh-ranthambore",
  "sacred-trinetra-ganesh-temple-ranthambore": "trinetra-ganesh-ranthambore",
  "hg6o6hcy7r4fwk995ox0": "trinetra-ganesh-ranthambore",
  "trinetra ganesh temple – ranthambore": "trinetra-ganesh-ranthambore",
  "trinetra ganesh temple": "trinetra-ganesh-ranthambore",
  "kanaka-durga-vijayawada": "kanaka-durga-vijayawada",
  "devi-kanaka-durga-temple-vijayawada": "kanaka-durga-vijayawada",
  "hllmxbjadcufp4wlbopu": "kanaka-durga-vijayawada",
  "kanaka durga temple – vijayawada": "kanaka-durga-vijayawada",
  "kanaka durga temple": "kanaka-durga-vijayawada",
  "tiruttani-murugan-tiruvallur": "tiruttani-murugan-tiruvallur",
  "sacred-thiruthani-murugan-temple": "tiruttani-murugan-tiruvallur",
  "hmc1jzjbcigzkap3envz": "tiruttani-murugan-tiruvallur",
  "tiruttani murugan temple – tiruvallur": "tiruttani-murugan-tiruvallur",
  "tiruttani murugan temple": "tiruttani-murugan-tiruvallur",
  "tirupati-balaji-andhra-pradesh": "tirupati-balaji-andhra-pradesh",
  "vishnu-tirupati-balaji-temple-andhra-pradesh": "tirupati-balaji-andhra-pradesh",
  "hyt0kubhplj6ombtf7zf": "tirupati-balaji-andhra-pradesh",
  "tirupati balaji temple – andhra pradesh": "tirupati-balaji-andhra-pradesh",
  "tirupati balaji temple": "tirupati-balaji-andhra-pradesh",
  "danteshwari-dantewada": "danteshwari-dantewada",
  "shaktipeeth-danteshwari-temple-dantewada": "danteshwari-dantewada",
  "ibtnhap9udqjasab5pta": "danteshwari-dantewada",
  "danteshwari temple – dantewada": "danteshwari-dantewada",
  "danteshwari temple": "danteshwari-dantewada",
  "gangotri-uttarakhand": "gangotri-uttarakhand",
  "chardham-gangotri-temple-uttarakhand": "gangotri-uttarakhand",
  "imueu1wqwhzmaj6xg4bu": "gangotri-uttarakhand",
  "gangotri temple – uttarakhand": "gangotri-uttarakhand",
  "gangotri temple": "gangotri-uttarakhand",
  "salasar-balaji-churu": "salasar-balaji-churu",
  "hanuman-salasar-balaji-temple-churu": "salasar-balaji-churu",
  "ioulof1zl1wog2vdqysx": "salasar-balaji-churu",
  "salasar balaji temple – churu": "salasar-balaji-churu",
  "salasar balaji temple": "salasar-balaji-churu",
  "mangaladevi-mangalore": "mangaladevi-mangalore",
  "healing-mangaladevi-temple-mangalore": "mangaladevi-mangalore",
  "ipdp5ohclysibc47jxxb": "mangaladevi-mangalore",
  "mangaladevi temple – mangalore": "mangaladevi-mangalore",
  "mangaladevi temple": "mangaladevi-mangalore",
  "mehendipur-balaji-dausa": "mehendipur-balaji-dausa",
  "hanuman-mehendipur-balaji-temple-dausa": "mehendipur-balaji-dausa",
  "j8lyluaukj3cvd3t3brh": "mehendipur-balaji-dausa",
  "mehendipur balaji temple – dausa": "mehendipur-balaji-dausa",
  "mehendipur balaji temple": "mehendipur-balaji-dausa",
  "sun-modhera": "sun-modhera",
  "sacred-sun-temple-modhera": "sun-modhera",
  "jk9fcyrky9qs5asbespd": "sun-modhera",
  "sun temple – modhera": "sun-modhera",
  "sun temple": "sun-modhera",
  "baidyanath-deoghar": "baidyanath-deoghar",
  "jyotirling-baidyanath-temple-deoghar": "baidyanath-deoghar",
  "baidyanath temple – deoghar": "baidyanath-deoghar",
  "baidyanath temple": "baidyanath-deoghar",
  "bhimashankar-maharashtra": "bhimashankar-maharashtra",
  "jyotirling-bhimashankar-temple-maharashtra": "bhimashankar-maharashtra",
  "bhimashankar temple – maharashtra": "bhimashankar-maharashtra",
  "bhimashankar temple": "bhimashankar-maharashtra",
  "grishneshwar-ellora": "grishneshwar-ellora",
  "jyotirling-grishneshwar-temple-ellora": "grishneshwar-ellora",
  "grishneshwar temple – ellora": "grishneshwar-ellora",
  "grishneshwar temple": "grishneshwar-ellora",
  "kashi-vishwanath-varanasi": "kashi-vishwanath-varanasi",
  "jyotirling-kashi-vishwanath-temple-varanasi": "kashi-vishwanath-varanasi",
  "kashi vishwanath temple – varanasi": "kashi-vishwanath-varanasi",
  "kashi vishwanath temple": "kashi-vishwanath-varanasi",
  "kedarnath-uttarakhand": "kedarnath-uttarakhand",
  "jyotirling-kedarnath-temple-uttarakhand": "kedarnath-uttarakhand",
  "kedarnath temple – uttarakhand": "kedarnath-uttarakhand",
  "kedarnath temple": "kedarnath-uttarakhand",
  "mahakaleshwar-ujjain": "mahakaleshwar-ujjain",
  "jyotirling-mahakaleshwar-temple-ujjain": "mahakaleshwar-ujjain",
  "mahakaleshwar temple – ujjain": "mahakaleshwar-ujjain",
  "mahakaleshwar temple": "mahakaleshwar-ujjain",
  "jyotirling-mallikarjuna-temple-srisailam": "mallikarjuna-srisailam",
  "mallikarjuna temple – srisailam": "mallikarjuna-srisailam",
  "mallikarjuna temple": "mallikarjuna-srisailam",
  "nageshwar-dwarka": "nageshwar-dwarka",
  "jyotirling-nageshwar-temple-dwarka": "nageshwar-dwarka",
  "nageshwar temple – dwarka": "nageshwar-dwarka",
  "nageshwar temple": "nageshwar-dwarka",
  "omkareshwar-madhya-pradesh": "omkareshwar-madhya-pradesh",
  "jyotirling-omkareshwar-temple-madhya-pradesh": "omkareshwar-madhya-pradesh",
  "omkareshwar temple – madhya pradesh": "omkareshwar-madhya-pradesh",
  "omkareshwar temple": "omkareshwar-madhya-pradesh",
  "ramanathaswamy-rameswaram": "ramanathaswamy-rameswaram",
  "jyotirling-ramanathaswamy-temple-rameswaram": "ramanathaswamy-rameswaram",
  "ramanathaswamy temple – rameswaram": "ramanathaswamy-rameswaram",
  "ramanathaswamy temple": "ramanathaswamy-rameswaram",
  "somnath-gujarat": "somnath-gujarat",
  "jyotirling-somnath-temple-gujarat": "somnath-gujarat",
  "somnath temple – gujarat": "somnath-gujarat",
  "somnath temple": "somnath-gujarat",
  "trimbakeshwar-nashik": "trimbakeshwar-nashik",
  "jyotirling-trimbakeshwar-temple-nashik": "trimbakeshwar-nashik",
  "trimbakeshwar temple – nashik": "trimbakeshwar-nashik",
  "trimbakeshwar temple": "trimbakeshwar-nashik",
  "nagaraja-nagercoil": "nagaraja-nagercoil",
  "sacred-nagaraja-temple-nagercoil": "nagaraja-nagercoil",
  "lcdqbp0vjqsxiqq2ipn3": "nagaraja-nagercoil",
  "nagaraja temple – nagercoil": "nagaraja-nagercoil",
  "nagaraja temple": "nagaraja-nagercoil",
  "tulsi-manas-varanasi": "tulsi-manas-varanasi",
  "sacred-tulsi-manas-temple-varanasi": "tulsi-manas-varanasi",
  "lm1ypgzz4zyuxso7itaa": "tulsi-manas-varanasi",
  "tulsi manas mandir – varanasi": "tulsi-manas-varanasi",
  "tulsi manas mandir": "tulsi-manas-varanasi",
  "sita-ramachandra-swamy-bhadrachalam": "sita-ramachandra-swamy-bhadrachalam",
  "sacred-bhadrachalam-sita-ramachandra-swamy": "sita-ramachandra-swamy-bhadrachalam",
  "lytydmttsq45pogif08p": "sita-ramachandra-swamy-bhadrachalam",
  "sita ramachandra swamy temple – bhadrachalam": "sita-ramachandra-swamy-bhadrachalam",
  "sita ramachandra swamy temple": "sita-ramachandra-swamy-bhadrachalam",
  "sri-ranganathaswamy-srirangam": "sri-ranganathaswamy-srirangam",
  "vishnu-sri-ranganathaswamy-temple-srirangam": "sri-ranganathaswamy-srirangam",
  "m0qktiaqq2zf85hgjfxg": "sri-ranganathaswamy-srirangam",
  "sri ranganathaswamy temple – srirangam": "sri-ranganathaswamy-srirangam",
  "sri ranganathaswamy temple": "sri-ranganathaswamy-srirangam",
  "virupaksha-hampi": "virupaksha-hampi",
  "healing-virupaksha-temple-hampi": "virupaksha-hampi",
  "mz1rzkpnj29ktaxd8ef2": "virupaksha-hampi",
  "virupaksha temple – hampi": "virupaksha-hampi",
  "virupaksha temple": "virupaksha-hampi",
  "baba-baidyanath-deoghar": "baba-baidyanath-deoghar",
  "shiva-baba-dham-deoghar": "baba-baidyanath-deoghar",
  "mc8xl58sjguh4tiqkxpm": "baba-baidyanath-deoghar",
  "baba baidyanath jyotirlinga – deoghar": "baba-baidyanath-deoghar",
  "baba baidyanath jyotirlinga": "baba-baidyanath-deoghar",
  "bankey-bihari-vrindavan": "bankey-bihari-vrindavan",
  "vishnu-bankey-bihari-temple-vrindavan": "bankey-bihari-vrindavan",
  "md0ynrl6if6u1kbglsfn": "bankey-bihari-vrindavan",
  "bankey bihari temple – vrindavan": "bankey-bihari-vrindavan",
  "bankey bihari temple": "bankey-bihari-vrindavan",
  "shri-bala-hanuman-jamnagar": "shri-bala-hanuman-jamnagar",
  "sacred-bala-hanuman-temple-jamnagar": "shri-bala-hanuman-jamnagar",
  "nmgux0f5d0ujto2frgrm": "shri-bala-hanuman-jamnagar",
  "shri bala hanuman temple – jamnagar": "shri-bala-hanuman-jamnagar",
  "shri bala hanuman temple": "shri-bala-hanuman-jamnagar",
  "punaura-janaki-sitamarhi": "punaura-janaki-sitamarhi",
  "sacred-janaki-mandir-sitamarhi": "punaura-janaki-sitamarhi",
  "nvktrngywnlu6icyccad": "punaura-janaki-sitamarhi",
  "punaura dham janaki temple – sitamarhi": "punaura-janaki-sitamarhi",
  "punaura dham janaki temple": "punaura-janaki-sitamarhi",
  "omkareshwar-island-narmada": "omkareshwar-island-narmada",
  "shiva-omkareshwar-island-khandwa": "omkareshwar-island-narmada",
  "ndxyiglg9tb4hjfpcuea": "omkareshwar-island-narmada",
  "omkareshwar island mandir – narmada": "omkareshwar-island-narmada",
  "omkareshwar island mandir": "omkareshwar-island-narmada",
  "kailasanathar-thingalur": "kailasanathar-thingalur",
  "sacred-thingalur-chandran-temple": "kailasanathar-thingalur",
  "ndpohuju83eaowolivrn": "kailasanathar-thingalur",
  "kailasanathar temple – thingalur": "kailasanathar-thingalur",
  "kailasanathar temple": "kailasanathar-thingalur",
  "shirdi-sai-baba-maharashtra": "shirdi-sai-baba-maharashtra",
  "sacred-shirdi-sai-baba-temple-maharashtra": "shirdi-sai-baba-maharashtra",
  "nmnwwhoyfkujk8fyxzir": "shirdi-sai-baba-maharashtra",
  "shirdi sai baba temple – maharashtra": "shirdi-sai-baba-maharashtra",
  "shirdi sai baba temple": "shirdi-sai-baba-maharashtra",
  "chennakesava-belur": "chennakesava-belur",
  "vishnu-chennakesava-temple-belur": "chennakesava-belur",
  "noepkqnxylju4eprzcs9": "chennakesava-belur",
  "chennakesava temple – belur": "chennakesava-belur",
  "chennakesava temple": "chennakesava-belur",
  "bhimashankar-forest-pune": "bhimashankar-forest-pune",
  "shiva-bhimashankar-jyotirling-pune": "bhimashankar-forest-pune",
  "nw3gupofgd9w1uuzdx6s": "bhimashankar-forest-pune",
  "bhimashankar forest temple – pune": "bhimashankar-forest-pune",
  "bhimashankar forest temple": "bhimashankar-forest-pune",
  "brajeshwari-devi-kangra": "brajeshwari-devi-kangra",
  "shaktipeeth-brareshwari-devi-temple-kangra": "brajeshwari-devi-kangra",
  "o2efrgcyxdbticfv2j1c": "brajeshwari-devi-kangra",
  "brajeshwari devi temple – kangra": "brajeshwari-devi-kangra",
  "brajeshwari devi temple": "brajeshwari-devi-kangra",
  "chamundeshwari-mysore": "chamundeshwari-mysore",
  "shaktipeeth-chamundeshwari-temple-mysore": "chamundeshwari-mysore",
  "olcj1ce4diddk7d7scq8": "chamundeshwari-mysore",
  "chamundeshwari temple – mysore": "chamundeshwari-mysore",
  "chamundeshwari temple": "chamundeshwari-mysore",
  "sri-dhanvantari-nelluvai": "sri-dhanvantari-nelluvai",
  "healing-dhanvantari-temple-kerala": "sri-dhanvantari-nelluvai",
  "ojzzr3kvuacphfcywlqo": "sri-dhanvantari-nelluvai",
  "sri dhanvantari temple – nelluvai": "sri-dhanvantari-nelluvai",
  "sri dhanvantari temple": "sri-dhanvantari-nelluvai",
  "somnath-maha-kshetra": "somnath-maha-kshetra",
  "sacred-somnath-mahadham-gujarat": "somnath-maha-kshetra",
  "ompvuicgwlvxhlfkclil": "somnath-maha-kshetra",
  "somnath maha kshetra": "somnath-maha-kshetra",
  "other-golden-temple-amritsar": "golden-amritsar",
  "other-iskcon-mira-road-thane": "iskcon-mira-road-thane",
  "iskcon-bangalore-aarti": "iskcon-bangalore-aarti",
  "other-iskcon-temple-bangalore-karnataka": "iskcon-bangalore-aarti",
  "iskcon bangalore aarti": "iskcon-bangalore-aarti",
  "iskcon-juhu-mumbai": "iskcon-juhu-mumbai",
  "other-iskcon-temple-mumbai": "iskcon-juhu-mumbai",
  "iskcon juhu mumbai": "iskcon-juhu-mumbai",
  "other-jagannath-temple-puri": "jagannath-puri",
  "shri-mahalakshmi": "shri-mahalakshmi",
  "other-mahalaxmi-temple": "shri-mahalakshmi",
  "shri mahalakshmi mandir": "shri-mahalakshmi",
  "meenakshi-madurai": "meenakshi-madurai",
  "other-meenakshi-temple-madurai": "meenakshi-madurai",
  "meenakshi temple – madurai": "meenakshi-madurai",
  "meenakshi temple": "meenakshi-madurai",
  "other-shirdi-sai-baba-temple-maharashtra": "shirdi-sai-baba-maharashtra",
  "shree-siddhivinayak-ganapati": "shree-siddhivinayak-ganapati",
  "other-siddhivinayak-temple-mumbai": "shree-siddhivinayak-ganapati",
  "shree siddhivinayak ganapati temple": "shree-siddhivinayak-ganapati",
  "other-tirupati-balaji-temple-andhra-pradesh": "tirupati-balaji-andhra-pradesh",
  "other-vaishno-devi-temple-jammu-kashmir": "vaishno-devi-jammu-&-kashmir",
  "attukal-bhagavathy-thiruvananthapuram": "attukal-bhagavathy-thiruvananthapuram",
  "devi-sree-bhadrakali-temple-attukal": "attukal-bhagavathy-thiruvananthapuram",
  "p5jup3pni1y1ktsp9zyi": "attukal-bhagavathy-thiruvananthapuram",
  "attukal bhagavathy temple – thiruvananthapuram": "attukal-bhagavathy-thiruvananthapuram",
  "attukal bhagavathy temple": "attukal-bhagavathy-thiruvananthapuram",
  "parli-vaijnath-beed": "parli-vaijnath-beed",
  "healing-parli-vaijnath-temple": "parli-vaijnath-beed",
  "phxrbffoxeppppaz2lcj": "parli-vaijnath-beed",
  "parli vaijnath temple – beed": "parli-vaijnath-beed",
  "parli vaijnath temple": "parli-vaijnath-beed",
  "kamakshi-amman-kanchipuram": "kamakshi-amman-kanchipuram",
  "sacred-kamakshi-amman-temple-kanchipuram": "kamakshi-amman-kanchipuram",
  "pmzrlh8uzd13ywoiqtac": "kamakshi-amman-kanchipuram",
  "kamakshi amman temple – kanchipuram": "kamakshi-amman-kanchipuram",
  "kamakshi amman temple": "kamakshi-amman-kanchipuram",
  "kotilingeshwara-kolar": "kotilingeshwara-kolar",
  "shiva-kotilingeshwara-temple-kolar": "kotilingeshwara-kolar",
  "potlh5xh8ree1ku91qbf": "kotilingeshwara-kolar",
  "kotilingeshwara temple – kolar": "kotilingeshwara-kolar",
  "kotilingeshwara temple": "kotilingeshwara-kolar",
  "pazhamudircholai-murugan-madurai": "pazhamudircholai-murugan-madurai",
  "sacred-pazhamudircholai-murugan-temple": "pazhamudircholai-murugan-madurai",
  "pu75pkelyqezhlr9ul6i": "pazhamudircholai-murugan-madurai",
  "pazhamudircholai murugan temple – madurai": "pazhamudircholai-murugan-madurai",
  "pazhamudircholai murugan temple": "pazhamudircholai-murugan-madurai",
  "bhalka-tirth-veraval": "bhalka-tirth-veraval",
  "sacred-bhalkeeshwar-temple-veraval": "bhalka-tirth-veraval",
  "q9cse2b8zofofg2v6cgq": "bhalka-tirth-veraval",
  "bhalka tirth – veraval": "bhalka-tirth-veraval",
  "bhalka tirth": "bhalka-tirth-veraval",
  "bijli-mahadev-kullu": "bijli-mahadev-kullu",
  "sacred-bijli-mahadev-temple-kullu": "bijli-mahadev-kullu",
  "qjtk14hn1nlxeiu1gz8g": "bijli-mahadev-kullu",
  "bijli mahadev temple – kullu": "bijli-mahadev-kullu",
  "bijli mahadev temple": "bijli-mahadev-kullu",
  "kalaram-nashik": "kalaram-nashik",
  "vishnu-kalaram-temple-nashik": "kalaram-nashik",
  "qnldccuxsiteu2zn7mpe": "kalaram-nashik",
  "kalaram temple – nashik": "kalaram-nashik",
  "kalaram temple": "kalaram-nashik",
  "vighnahar-ozar": "vighnahar-ozar",
  "ashtavinayak-vighnahar-temple-ozar": "vighnahar-ozar",
  "qx4ndl99kihxz9h2lv7p": "vighnahar-ozar",
  "vighnahar temple – ozar": "vighnahar-ozar",
  "vighnahar temple": "vighnahar-ozar",
  "girijatmak-lenyadri": "girijatmak-lenyadri",
  "ashtavinayak-girijatmak-temple-lenyadri": "girijatmak-lenyadri",
  "qxv1emlegq5knzrxt5ez": "girijatmak-lenyadri",
  "girijatmak temple – lenyadri": "girijatmak-lenyadri",
  "girijatmak temple": "girijatmak-lenyadri",
  "lingaraj-bhubaneswar": "lingaraj-bhubaneswar",
  "shiva-lingaraj-temple-bhubaneswar": "lingaraj-bhubaneswar",
  "r4gxbxembpqeyjdrta88": "lingaraj-bhubaneswar",
  "lingaraj temple – bhubaneswar": "lingaraj-bhubaneswar",
  "lingaraj temple": "lingaraj-bhubaneswar",
  "triprayar-sree-rama-thrissur": "triprayar-sree-rama-thrissur",
  "sacred-triprayar-srama-temple-thrissur": "triprayar-sree-rama-thrissur",
  "rtnupahxl9isbnnsbs5x": "triprayar-sree-rama-thrissur",
  "triprayar sree rama temple – thrissur": "triprayar-sree-rama-thrissur",
  "triprayar sree rama temple": "triprayar-sree-rama-thrissur",
  "vaitheeswaran-koil-mayiladuthurai": "vaitheeswaran-koil-mayiladuthurai",
  "sacred-vaitheeswaran-koil-mayiladuthurai": "vaitheeswaran-koil-mayiladuthurai",
  "rehyevtegfhkqctjhgzv": "vaitheeswaran-koil-mayiladuthurai",
  "vaitheeswaran koil – mayiladuthurai": "vaitheeswaran-koil-mayiladuthurai",
  "vaitheeswaran koil": "vaitheeswaran-koil-mayiladuthurai",
  "gommateshwara-statue-shravanabelagola": "gommateshwara-statue-shravanabelagola",
  "sacred-shravanabelagola-gommateshwara": "gommateshwara-statue-shravanabelagola",
  "s4tgpcwp4no7jloys3aq": "gommateshwara-statue-shravanabelagola",
  "gommateshwara statue – shravanabelagola": "gommateshwara-statue-shravanabelagola",
  "gommateshwara statue": "gommateshwara-statue-shravanabelagola",
  "alopi-devi-prayagraj": "alopi-devi-prayagraj",
  "shaktipeeth-alopi-devi-temple-prayagraj": "alopi-devi-prayagraj",
  "sstkb4mthn88qi4n7w6m": "alopi-devi-prayagraj",
  "alopi devi temple – prayagraj": "alopi-devi-prayagraj",
  "alopi devi temple": "alopi-devi-prayagraj",
  "ambaji-gujarat": "ambaji-gujarat",
  "shaktipeeth-ambaji-temple-gujarat": "ambaji-gujarat",
  "ttpejvrk4fyklmyic7du": "ambaji-gujarat",
  "ambaji temple – gujarat": "ambaji-gujarat",
  "ambaji temple": "ambaji-gujarat",
  "dwarkadhish-dwarka": "dwarkadhish-dwarka",
  "chardham-dwarkadhish-temple-dwarka": "dwarkadhish-dwarka",
  "tvg3bw77061x8vg3xh8f": "dwarkadhish-dwarka",
  "dwarkadhish temple – dwarka": "dwarkadhish-dwarka",
  "hanuman-garhi-ayodhya": "hanuman-garhi-ayodhya",
  "hanuman-hanumangarhi-temple-ayodhya": "hanuman-garhi-ayodhya",
  "ucnw4qiyvsctoxeaxbra": "hanuman-garhi-ayodhya",
  "hanuman garhi temple – ayodhya": "hanuman-garhi-ayodhya",
  "hanuman garhi temple": "hanuman-garhi-ayodhya",
  "iskcon-bengaluru-karnataka": "iskcon-bengaluru-karnataka",
  "vishnu-iskcon-temple-bangalore-karnataka": "iskcon-bengaluru-karnataka",
  "uk18jo4icjilsoaavtd9": "iskcon-bengaluru-karnataka",
  "iskcon temple bengaluru – karnataka": "iskcon-bengaluru-karnataka",
  "iskcon temple bengaluru": "iskcon-bengaluru-karnataka",
  "suryanar-kovil-kumbakonam": "suryanar-kovil-kumbakonam",
  "sacred-suryanar-kovil-kumbakonam": "suryanar-kovil-kumbakonam",
  "ux6u3pdvkubmdmvgqi3r": "suryanar-kovil-kumbakonam",
  "suryanar kovil – kumbakonam": "suryanar-kovil-kumbakonam",
  "suryanar kovil": "suryanar-kovil-kumbakonam",
  "devi-kalighat-mandir-kolkata": "kalighat-kali-kolkata",
  "urftxjlafy6frl3j89dr": "kalighat-kali-kolkata",
  "kalighat kali shrine – kolkata": "kalighat-kali-kolkata",
  "kalighat kali shrine": "kalighat-kali-kolkata",
  "sri-ramanasramam-tiruvannamalai": "sri-ramanasramam-tiruvannamalai",
  "healing-ramanasramam-tiruvannamalai": "sri-ramanasramam-tiruvannamalai",
  "v8y7g4xtbk0jlhovcbop": "sri-ramanasramam-tiruvannamalai",
  "sri ramanasramam – tiruvannamalai": "sri-ramanasramam-tiruvannamalai",
  "sri ramanasramam": "sri-ramanasramam-tiruvannamalai",
  "sacred-somnath-jyotirling-gujarat-core": "somnath",
  "vjafaue2zk1x39yqqcse": "somnath",
  "somnath temple complex": "somnath",
  "mahabaleshwar-gokarna": "mahabaleshwar-gokarna",
  "sacred-gokarna-mahabaleshwar-temple": "mahabaleshwar-gokarna",
  "vt1y2h6hkeolnc8gr3bv": "mahabaleshwar-gokarna",
  "mahabaleshwar temple – gokarna": "mahabaleshwar-gokarna",
  "mahabaleshwar temple": "mahabaleshwar-gokarna",
  "nalateswari-nalhati": "nalateswari-nalhati",
  "shaktipeeth-nalateswari-temple-nalhati": "nalateswari-nalhati",
  "vpmtog0kqdyodnfqbscn": "nalateswari-nalhati",
  "nalateswari temple – nalhati": "nalateswari-nalhati",
  "nalateswari temple": "nalateswari-nalhati",
  "bhojeshwar-bhojpur": "bhojeshwar-bhojpur",
  "shiva-bhojeshwar-temple-bhojpur": "bhojeshwar-bhojpur",
  "wet6qe7l1pm1jqrivcds": "bhojeshwar-bhojpur",
  "bhojeshwar temple – bhojpur": "bhojeshwar-bhojpur",
  "bhojeshwar temple": "bhojeshwar-bhojpur",
  "fullara-attahas-birbhum": "fullara-attahas-birbhum",
  "shaktipeeth-attahas-temple-birbhum": "fullara-attahas-birbhum",
  "wpeaggfgaqheac0jgx7n": "fullara-attahas-birbhum",
  "fullara attahas temple – birbhum": "fullara-attahas-birbhum",
  "fullara attahas temple": "fullara-attahas-birbhum",
  "baijnath-bageshwar": "baijnath-bageshwar",
  "sacred-baijnath-temple-bageshwar": "baijnath-bageshwar",
  "x5ohd9veqswxuvv9l9a6": "baijnath-bageshwar",
  "baijnath temple complex – bageshwar": "baijnath-bageshwar",
  "baijnath temple complex": "baijnath-bageshwar",
  "kankalitala-bolpur": "kankalitala-bolpur",
  "shaktipeeth-kankalitala-temple-bolpur": "kankalitala-bolpur",
  "x7pqfmwvm8n3bucndccz": "kankalitala-bolpur",
  "kankalitala temple – bolpur": "kankalitala-bolpur",
  "kankalitala temple": "kankalitala-bolpur",
  "devi-meenakshi-temple-madurai": "meenakshi-madurai",
  "xoidlq0hs7unbtz3u7ga": "meenakshi-madurai",
  "kapaleeshwarar-mylapore": "kapaleeshwarar-mylapore",
  "shiva-kapaleeshwarar-temple-chennai": "kapaleeshwarar-mylapore",
  "xaibnprtp0mu6hhmar7h": "kapaleeshwarar-mylapore",
  "kapaleeshwarar temple – mylapore": "kapaleeshwarar-mylapore",
  "kapaleeshwarar temple": "kapaleeshwarar-mylapore",
  "iskcon-vrindavan": "iskcon-vrindavan",
  "vishnu-iskcon-temple-vrindavan": "iskcon-vrindavan",
  "xawinhkhhzh3ougjnlon": "iskcon-vrindavan",
  "iskcon temple – vrindavan": "iskcon-vrindavan",
  "iskcon temple": "iskcon-vrindavan",
  "thillai-nataraja-chidambaram": "thillai-nataraja-chidambaram",
  "panchbhoota-thillai-nataraja-temple-chidambaram": "thillai-nataraja-chidambaram",
  "xizd0w589xxfzmvpvbsn": "thillai-nataraja-chidambaram",
  "thillai nataraja temple – chidambaram": "thillai-nataraja-chidambaram",
  "thillai nataraja temple": "thillai-nataraja-chidambaram",
  "shri-dwarkadhish-dwarka": "shri-dwarkadhish-dwarka",
  "other-shri-dwarkadhish-temple-dwarka": "shri-dwarkadhish-dwarka",
  "xqedmi8cm9kt8qvrnvbg": "shri-dwarkadhish-dwarka",
  "shri dwarkadhish temple – dwarka": "shri-dwarkadhish-dwarka",
  "shri dwarkadhish temple": "shri-dwarkadhish-dwarka",
  "aranmula-parthasarathy-pathanamthitta": "aranmula-parthasarathy-pathanamthitta",
  "sacred-arankula-parthasarathy-temple": "aranmula-parthasarathy-pathanamthitta",
  "xvibocs3enaaa7hxf2b5": "aranmula-parthasarathy-pathanamthitta",
  "aranmula parthasarathy temple – pathanamthitta": "aranmula-parthasarathy-pathanamthitta",
  "aranmula parthasarathy temple": "aranmula-parthasarathy-pathanamthitta",
  "agniswarar-kanchanur": "agniswarar-kanchanur",
  "sacred-kanchanur-sukran-temple": "agniswarar-kanchanur",
  "y6ownsok2ux6g3rwoxy3": "agniswarar-kanchanur",
  "agniswarar temple – kanchanur": "agniswarar-kanchanur",
  "agniswarar temple": "agniswarar-kanchanur",
  "gorakhnath-gorakhpur": "gorakhnath-gorakhpur",
  "sacred-gorakhnath-temple-gorakhpur": "gorakhnath-gorakhpur",
  "ygxp7ky1kibirtlptqbq": "gorakhnath-gorakhpur",
  "gorakhnath temple – gorakhpur": "gorakhnath-gorakhpur",
  "gorakhnath temple": "gorakhnath-gorakhpur",
  "chandi-devi-haridwar": "chandi-devi-haridwar",
  "devi-chandi-devi-temple-haridwar": "chandi-devi-haridwar",
  "ybdxsy6d5bqnnoodxnsx": "chandi-devi-haridwar",
  "chandi devi temple – haridwar": "chandi-devi-haridwar",
  "chandi devi temple": "chandi-devi-haridwar",
  "badi-patan-devi-patna": "badi-patan-devi-patna",
  "sacred-patan-devi-temple-patna": "badi-patan-devi-patna",
  "yg3ulnnmcddikr1rpwo3": "badi-patan-devi-patna",
  "badi patan devi temple – patna": "badi-patan-devi-patna",
  "badi patan devi temple": "badi-patan-devi-patna",
  "kedarnath-himalayan": "kedarnath-himalayan",
  "shiva-kedarnath-himalayan-shrine": "kedarnath-himalayan",
  "yilhdofmfa2wscbqiosf": "kedarnath-himalayan",
  "kedarnath himalayan temple": "kedarnath-himalayan",
  "thiruparankundram-murugan-madurai": "thiruparankundram-murugan-madurai",
  "sacred-thiruparankundram-murugan-temple": "thiruparankundram-murugan-madurai",
  "yjtddbasjazddz4mx5er": "thiruparankundram-murugan-madurai",
  "thiruparankundram murugan temple – madurai": "thiruparankundram-murugan-madurai",
  "thiruparankundram murugan temple": "thiruparankundram-murugan-madurai",
  "ramnagar-fort-varanasi": "ramnagar-fort-varanasi",
  "sacred-vibhuti-narayan-fort-temple-ramnagar": "ramnagar-fort-varanasi",
  "zw9b6kecfa4pvpuzgyql": "ramnagar-fort-varanasi",
  "ramnagar fort temple – varanasi": "ramnagar-fort-varanasi",
  "ramnagar fort temple": "ramnagar-fort-varanasi"
};
