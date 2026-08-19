import type { VisitorGuidelinesRule } from '../types';

export const VISITOR_GUIDELINES_RULES: VisitorGuidelinesRule[] = [
  {
    id: 'dwarka',
    condition: {
      any: ['dwarka', 'dwarkadhish'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan', points: ['General Entry: Free for all pilgrims', 'VIP / Priority Darshan: Official trust passes available at Gate 56 counter', 'Online Booking: E-pass booking available via official Dwarkadhish Trust portal'] },
      { icon: '⏳', title: 'Queue & Darshan Duration', points: ['Wait Time: 30–60 mins (Weekdays), 2–3 hours (Weekends / Janmashtami)', 'Darshan Time: 15–20 seconds in front of main sanctum', 'Total Visit Duration: 1.5 to 2 hours including queue and parikrama'] },
      { icon: '👥', title: 'Crowd Level & Best Time', points: ['Crowd Level: Moderate on weekdays, Heavy on Ekadashi & festival days', 'Best Visit Window: Early morning (6:30 AM Mangla Aarti) or evening Shringar Aarti', 'Pilgrim Tip: Visit Gomti Ghat in early morning for peaceful holy dip before darshan'] },
      { icon: '👔', title: 'Dress Code & Ethics', points: ['Modest Indian traditional attire mandatory for all devotees', 'Men: Dhoti-Kurta or Pyjama-Kurta recommended', 'Women: Saree, Salwar Kameez, or Dupatta (Shorts, skirts & sleeveless forbidden)'] },
      { icon: '📵', title: 'Mobile & Photography Policy', points: ['Strict Prohibition: Mobile phones & electronic devices banned inside mandir premises', 'Photography permitted outside complex along Gomti Ghat & riverfront', 'Deposit devices in official trust barcode lockers near Gate 56 before entry'], prohibitedItems: ['Mobile Phones', 'Cameras', 'Smartwatches', 'Leather Belts', 'Large Bags'] },
      { icon: '👟', title: 'Shoe Stand & Lockers', points: ['Free footwear counter managed by temple trust at Gate 56 & Gate 13', 'Paid cloakroom counters available for luggage and handbags', 'Token system enforced for safe and fast retrieval'] },
      { icon: '♿', title: 'Accessibility & Assistance', points: ['Wheelchair ramp access available at Gate 56 entry route', 'Senior citizen priority lane provided during general queue hours', 'Divyang assistance desk near main administration office'] },
      { icon: '🚻', title: 'Visitor Facilities', points: ['RO Drinking water stations & clean washrooms inside complex grounds', 'Mahaprasad & dry prasad counter near exit gate', 'Emergency first aid desk and ATM available outside complex perimeter'] },
    ],
  },
  {
    id: 'somnath',
    condition: {
      any: ['somnath'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan', points: ['General Entry: Free entry for all devotees', 'VIP Darshan: Special pass booking available at Somnath Trust office desk', 'Online Services: Advance Pooja & Aarti booking available on official trust website'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Wait Time: 20–45 mins (Weekdays), 1.5–3 hours (Shravan / Shivratri)', 'Average Darshan Duration: 30–45 seconds in inner hall', 'Total Visit Time: 1.5 to 2.5 hours including Light & Sound show'] },
      { icon: '👥', title: 'Crowd Level & Best Time', points: ['Crowd Level: Moderate on general weekdays, Peak during Shravan month', 'Best Time to Visit: 6:00 AM morning darshan or 7:00 PM Sandhya Aarti', 'Pilgrim Tip: Attend the 8:00 PM daily Light & Sound show on the sea-facing lawns'] },
      { icon: '👔', title: 'Dress Code & Customs', points: ['Traditional decent attire expected for all visitors', 'Men: Dhoti, Kurta, or trousers (Shorts strictly disallowed)', 'Women: Saree, Salwar Kameez, or traditional suits'] },
      { icon: '📵', title: 'Mobile & Security Rules', points: ['Mobile phones allowed in outer complex, strictly banned in inner sanctum', 'Multi-layer security screening with scanner checkpoints', 'Sea-facing photography permitted in outer promenade'], prohibitedItems: ['Mobile Phones (Inner Sanctum)', 'Cameras', 'Leather Accessories', 'Liquids & Food Items'] },
      { icon: '👟', title: 'Shoe Stand & Cloakroom', points: ['Free footwear counters run by Somnath Trust outside main gate', 'Safe cloakroom facility for heavy bags & electronic items', 'Systematic digital token ticketing for luggage security'] },
      { icon: '♿', title: 'Accessibility & Support', points: ['Electric golf cart service available from vehicle parking to temple gate', 'Wheelchair ramp facility and priority queue for elderly and Divyangjan', 'Resting benches installed along sea promenade walk'] },
      { icon: '🚻', title: 'Visitor Facilities', points: ['Clean RO drinking water taps & modern restroom complexes', 'Prasad Counter: Fresh Chikki & Ladoo prasad boxes available', 'Somnath Bhojanalaya: Pure vegetarian thali at nominal charges'] },
    ],
  },
  {
    id: 'kashi',
    condition: {
      any: ['kashi', 'vishwanath'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Sugam Darshan', points: ['General Entry: Free entry through Ganga Corridor gates', 'Sugam Darshan (VIP): ₹300 per person (Bookable online or at Corridor counter)', 'Special Aarti Tickets: Mangla Aarti (₹500), Sapta Rishi & Bhog Aarti (₹300)'] },
      { icon: '⏳', title: 'Queue & Duration', points: ['Queue Waiting Time: 45–90 mins (Weekdays), 3–5 hours (Mondays & Shravan)', 'Darshan Time: 10–15 seconds near sacred Jyotirlinga', 'Total Visit Duration: 2 to 3 hours across Ganga Corridor complex'] },
      { icon: '👥', title: 'Crowd Level & Best Time', points: ['Crowd Level: Very high year-round, peak crowd on Mondays & Shivratri', 'Best Visit Window: 4:00 AM early morning or 9:00 PM late evening', 'Pilgrim Tip: Enter via Ganga Ghat Corridor entry for a smoother queue flow'] },
      { icon: '👔', title: 'Dress Code & Rituals', points: ['Modest clothing mandatory; traditional attire preferred for Abhishek', 'Men doing Sparsh Darshan / Jalabhishek must wear Dhoti-Kurta', 'Women: Saree or Salwar suit with Dupatta'] },
      { icon: '📵', title: 'Mobile & Electronics Prohibition', points: ['Complete Ban: Mobiles, smartwatches, leather belts & electronic keys banned', 'Multiple security scanning gates with metal detectors', 'Deposit electronics in trust lockers along Ganga Corridor before queue'], prohibitedItems: ['Mobile Phones', 'Smartwatches', 'Bluetooth Earbuds', 'Leather Belts', 'Electronic Car Keys', 'Large Luggage'] },
      { icon: '👟', title: 'Shoe Counters & Lockers', points: ['Free and paid locker complexes available near Godowlia & Ganga Gate', 'Safe electronic barcode lockers for personal items and shoes', 'Helpline desk at Gate 4 for lost tokens or guidance'] },
      { icon: '♿', title: 'Senior Citizen & Wheelchair Support', points: ['E-rickshaw & battery car service available inside Corridor for seniors', 'Wheelchair ramp channels available up to Garbhagriha outer area', 'Dedicated queue route for senior citizens and differently-abled'] },
      { icon: '🚻', title: 'Facilities & Prasadam', points: ['Filtered cold drinking water stalls & air-conditioned waiting halls', 'Official Kashi Vishwanath Prasad Counter (Pedha & Belpatra)', 'Annakshetra: Free meal facility available at designated hours'] },
    ],
  },
  {
    id: 'mahakal',
    condition: {
      any: ['mahakal'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Bhasma Aarti', points: ['General Entry: Free entry via Mahakal Lok corridor', 'Bhasma Aarti Booking: Free online booking (advance) / offline counter desk', 'VIP / Sheghra Darshan: ₹250 pass ticket counter available at entry gate'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Wait Time: 45–90 mins (General Queue), 20–40 mins (₹250 Sheghra Pass)', 'Bhasma Aarti Duration: 4:00 AM to 6:00 AM (Entry starts 3:00 AM)', 'Total Visit Duration: 2 to 3.5 hours including Mahakal Lok walk'] },
      { icon: '👥', title: 'Crowd Level & Timing', points: ['Crowd Level: High daily, extremely crowded on Shravan Mondays & Nag Panchami', 'Best Visit Window: 6:00 AM post Bhasma Aarti or 8:00 PM Sandhya Aarti', 'Pilgrim Tip: Book Bhasma Aarti online 30 days in advance on official trust portal'] },
      { icon: '👔', title: 'Bhasma Aarti Dress Code', points: ['Bhasma Aarti Sanctum Entry: Men MUST wear unstitched traditional Dhoti-Sola', 'Women MUST wear Saree during Garbhagriha Bhasma Aarti worship', 'General Queue: Normal modest traditional clothing permitted'] },
      { icon: '📵', title: 'Mobile & Photography Rules', points: ['Mobile phones allowed in Mahakal Lok corridor, banned in inner mandir', 'No photography permitted during Bhasma Aarti ritual inside sanctum', 'Deposit mobiles in smart barcode counters inside Mahakal Lok'], prohibitedItems: ['Mobile Phones (Inner Mandir)', 'Cameras', 'Leather Belts', 'Outside Food & Drink'] },
      { icon: '👟', title: 'Shoe & Luggage Deposit', points: ['Large automated shoe and luggage deposit complex at Mahakal Lok', 'Computerized token receipt issued for safe retrieval at exit', 'Free footwear counters available at all entry gates'] },
      { icon: '♿', title: 'Accessibility & Support', points: ['Battery operated vehicles inside Mahakal Lok for senior citizens & Divyang', 'Ramp facility available right up to outer sanctum queue lines', 'Dedicated medical desks stationed along main queue path'] },
      { icon: '🚻', title: 'Facilities & Bhojanalaya', points: ['RO water dispensers & hygienic restroom blocks at regular intervals', 'Mahakal Besan Ladoo Prasad Counter operated by Temple Management', 'Shree Mahakal Bhojanalaya: Pure thali meal available at nominal rates'] },
    ],
  },
  {
    id: 'grishneshwar',
    condition: {
      any: ['grishneshwar', 'ghrushneshwar', 'grineshwar'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan', points: ['General Entry: Free entry for all devotees', 'VIP / Priority Darshan: Official information desk for special Pooja booking', 'Sparsh Darshan: Direct touch of Jyotirlinga permitted during designated hours'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Queue Waiting Time: 15–35 mins (Weekdays), 1–2 hours (Mondays & Shravan)', 'Darshan Duration: 30–60 seconds near Garbhagriha', 'Total Visit Duration: 45 mins to 1.5 hours'] },
      { icon: '👥', title: 'Crowd Level & Best Time', points: ['Crowd Level: Light to moderate on weekdays, heavy on Mondays & Pradosh', 'Best Time to Visit: Early morning 5:30 AM opening or 2:00 PM afternoon', 'Pilgrim Tip: Combine visit with nearby Ellora Caves (just 1 km away)'] },
      { icon: '👔', title: 'Garbhagriha Dress Code', points: ['Men entering Garbhagriha for Jalabhishek MUST remove upper garments (bare chest)', 'Traditional Dhoti mandatory for touching sacred Jyotirlinga', 'Women: Traditional Saree or Salwar Kameez expected'] },
      { icon: '📵', title: 'Sanctum Rules', points: ['Mobile phones prohibited inside inner stone sanctum', 'Photography restricted in Garbhagriha, allowed in outer temple yard', 'Basic storage counters available outside main temple entry gate'], prohibitedItems: ['Mobile Phones (Sanctum)', 'Cameras', 'Stitched Upper Garments (Men for Garbhagriha)'] },
      { icon: '👟', title: 'Shoe Stand & Lockers', points: ['Free shoe keeping stand right outside temple boundary wall', 'Small luggage lockers available with local trusted vendor stalls', 'Keep valuables in vehicle/hotel as temple premise is compact'] },
      { icon: '♿', title: 'Accessibility Notice', points: ['Ramp facility available till outer courtyard entrance', 'Garbhagriha entrance involves few heritage stone steps', 'Volunteers assist senior citizens during peak morning queue'] },
      { icon: '🚻', title: 'Facilities & Prasad', points: ['Drinking water tap and public washrooms near outer parking lot', 'Local prasad stalls selling Belpatra, Flowers & Pedha', 'Multiple vegetarian restaurants available outside temple street'] },
    ],
  },
  {
    id: 'kedarnath',
    condition: {
      any: ['kedarnath'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Yatra Pass', points: ['Yatra Registration: Free Mandatory Char Dham / Kedarnath Yatra Registration', 'Biometric / QR Verification at Gaurikund & Sonprayag entry points', 'Special Pooja Booking: Online booking via Uttarakhand Char Dham Devasthanam Board'] },
      { icon: '⏳', title: 'Trek & Darshan Duration', points: ['Trek Duration: 16 km trek from Gaurikund (6–8 hours trek / pony / helicopter)', 'Queue Waiting Time: 1–3 hours during peak May-June season', 'Total Visit Duration: Overnight stay recommended at Kedarnath top'] },
      { icon: '👥', title: 'Crowd & Weather Advisory', points: ['Crowd Level: Extreme peak in May, June, Sept, Oct; Closed in Winter', 'Best Visit Time: Early morning 6:00 AM before weather becomes cloudy', 'Pilgrim Tip: Carry heavy woolens, rain poncho, oxygen cylinder & sturdy shoes'] },
      { icon: '👔', title: 'Dress Code & Preparation', points: ['Warm thermals, heavy jacket, waterproof gloves & rain gear mandatory', 'Modest traditional clothing beneath winter gear', 'Comfortable grip trekking shoes essential for 16 km climb'] },
      { icon: '📵', title: 'Mobile & Photography', points: ['Mobile photography banned inside main stone sanctum', 'Photography permitted in outer temple plaza & snow peaks background', 'Network connectivity: BSNL, Jio & Airtel active near temple base'], prohibitedItems: ['Sanctum Photography', 'Single-use Plastics', 'Drones without Permit'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Shoe counter located in paved courtyard outside main stone mandir', 'GMVN & Tent accommodation provides luggage storage', 'Keep electronics safe in waterproof pouches'] },
      { icon: '♿', title: 'Accessibility & Transport', points: ['Helicopter services from Phata, Sirsi & Guptkashi (Advance IRCTC booking)', 'Pony / Kandi (Palanquin) / Pithu services available at Sonprayag & Gaurikund', 'Government fixed rates for all pony and palanquin operators'] },
      { icon: '🚻', title: 'Facilities & Stay', points: ['GMVN huts, tent colonies & private dharamshalas available at top', 'Medical camps & oxygen relief booths along trek path & temple top', 'GMVN Bhojanalaya providing hot vegetarian meals'] },
    ],
  },
  {
    id: 'tirupati',
    condition: {
      any: ['tirupati', 'tirumala', 'venkateswara'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan Tickets', points: ['Special Entry Darshan (SED): ₹300 per ticket (Online advance quota release)', 'Slotted Sarva Darshan (Free): Tokens issued at offline counters in Tirupati', 'Senior Citizen / Divyang Special Quota: Specific slotted online entry'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Wait Time (SED ₹300): 2 to 4 hours in Vaikuntam Queue Complex', 'Wait Time (Free Queue): 8 to 16 hours depending on day', 'Total Visit Time: 4 to 8 hours for complete pilgrimage process'] },
      { icon: '👥', title: 'Crowd & Timing', points: ['Crowd Level: Heavy 365 days a year; Peak during Brahmotsavam & weekends', 'Best Visit Window: Report strictly at allotted SED ticket slot hour', 'Pilgrim Tip: Book tickets 2–3 months in advance on official TTD website'] },
      { icon: '👔', title: 'Strict Traditional Dress Code', points: ['Men MUST wear Dhoti with Uttariye / Kurta (Jeans, shorts, t-shirts BANNED)', 'Women MUST wear Saree, Half-Saree, or Churidar with Dupatta', 'Strict dress code screening at Vaikuntam entrance gates'] },
      { icon: '📵', title: 'Electronics & Luggage Policy', points: ['Strict Ban: Mobile phones, cameras & electronic items banned inside mandir', 'Free TTD luggage counter: Deposit bags/mobiles at queue complex entry', 'Belongings automatically safely transported to Laddu counter exit desk'], prohibitedItems: ['Mobile Phones', 'Cameras', 'Smartwatches', 'Bluetooth Accessories', 'Footwear in Queue', 'Western Attire (Jeans/Shorts)', 'Tobacco & Alcohol'] },
      { icon: '👟', title: 'Shoe Counter & Tonsuring', points: ['Free footwear deposit counters at all queue entry points', 'Kalyanakatta: Hair tonsuring facility available 24/7 free of cost', 'Token receipt provided for safe footwear retrieval'] },
      { icon: '♿', title: 'Accessibility & Free Transit', points: ['Free TTD battery cars & free yellow buses operating across Tirumala', 'Wheelchair support & dedicated queue lanes for senior citizens', 'Elevators and ramps throughout Vaikuntam Queue Complex'] },
      { icon: '🚻', title: 'Facilities & Annadanam', points: ['Matrusri Tarigonda Vengamamba Annaprasadam: Free 24/7 unlimited meals', 'Free milk, buttermilk & food served inside queue compartments', 'World famous TTD Laddu Prasadam counters (Tokens attached to tickets)'] },
    ],
  },
  {
    id: 'omkareshwar',
    condition: {
      any: ['omkareshwar'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Boat Access', points: ['General Entry: Free for all devotees', 'Island Access: River Narmada crossing via bridge or boats (nominal fare)', 'VIP Darshan: Special Pooja passes available at temple office'] },
      { icon: '⏳', title: 'Queue & Darshan Duration', points: ['Wait Time: 30–60 mins (Weekdays), 2–4 hours (Mondays & Shravan)', 'Sanctum Break: Temple closes briefly (3:50 PM – 4:15 PM) for Bhog', 'Total Visit Duration: 2 to 3 hours including Parikrama'] },
      { icon: '👥', title: 'Crowd & Best Time', points: ['Crowd Level: Moderate on weekdays, heavy on Mondays & Shivratri', 'Best Visit Window: Early morning (5:00 AM Mangal Aarti) or evening Sandhya Aarti', 'Pilgrim Tip: Complete the 7 km Omkareshwar Parikrama path in morning'] },
      { icon: '👔', title: 'Dress Code & Ethics', points: ['Modest Indian attire recommended', 'Men: Dhoti-Kurta or Pyjama', 'Women: Saree or Salwar Kameez'] },
      { icon: '📵', title: 'Mobile & Electronics Rules', points: ['Mobile phones disallowed in inner sanctum', 'Deposit electronics in storage counters at temple entrance', 'Photography permitted along Narmada river banks'], prohibitedItems: ['Mobile Phones (Sanctum)', 'Cameras', 'Leather Items'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Free footwear counters managed near river ghat entry', 'Local cloakrooms available for pilgrim bags'] },
      { icon: '♿', title: 'Accessibility & Bridge', points: ['Foot suspension bridge (Jhula Pul) & new walkway connect mainland to island', 'Volunteers and chair palanquins available for elderly pilgrims'] },
      { icon: '🚻', title: 'Facilities & Prasadam', points: ['RO water booths & washrooms near ghats', 'Fresh Narmada Jal & Pooja prasad counters outside temple'] },
    ],
  },
  {
    id: 'bhimashankar',
    condition: {
      any: ['bhimashankar'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Location Access', points: ['General Entry: Free entry for all pilgrims', 'Forest Reserve Area: Surrounded by Bhimashankar Wildlife Sanctuary', 'VIP / Pooja Booking: Administrative counter near main entrance'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Wait Time: 30–60 mins (Weekdays), 2–3 hours (Weekends & Shravan)', 'Sanctum Pause: Closed 3:00 PM – 4:00 PM for Madhyan Aarti & Cleaning', 'Total Visit Time: 1.5 to 2.5 hours'] },
      { icon: '👥', title: 'Crowd & Climate Advisory', points: ['Crowd Level: High on Mondays & monsoon season', 'Best Visit Time: Morning 5:00 AM – 11:00 AM', 'Pilgrim Tip: Heavy rain & fog in monsoons; carry umbrellas & raincoats'] },
      { icon: '👔', title: 'Dress Code & Ethics', points: ['Decent traditional clothing expected', 'Men: Kurta-Pyjama / Dhoti preferred for Abhishek', 'Women: Saree or Salwar Kameez'] },
      { icon: '📵', title: 'Mobile & Security Policy', points: ['Mobile phones banned inside Garbhagriha', 'Deposit phones at footwear/locker stalls near staircases'], prohibitedItems: ['Mobile Phones (Inner Sanctum)', 'Plastic Bags (Plastic Free Zone)', 'Leather Belts'] },
      { icon: '👟', title: 'Shoe Stand & Steps', points: ['Footwear counters near upper bus stand and lower temple gate', 'Requires walking down ~200 paved steps to reach temple bottom'] },
      { icon: '♿', title: 'Accessibility & Support', points: ['Doli (Palanquin) services available for senior citizens & disabled at step entrance', 'Ramp available near lower courtyard area'] },
      { icon: '🚻', title: 'Facilities & Environment', points: ['Drinking water facilities & local maharashtrian food stalls near bus stand', 'Prasad counters for Peda and Belpatra'] },
    ],
  },
  {
    id: 'trimbakeshwar',
    condition: {
      any: ['trimbakeshwar', 'trimbak'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Ritual Passes', points: ['General Entry: Free entry for all devotees', 'Kalsarpa & Narayan Nagbali: Special booking desks near temple office', 'Paid Priority Queue: Available at administrative gate counters'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Wait Time: 45–90 mins (Weekdays), 2–4 hours (Mondays & Kumbh Mela dates)', 'Darshan Duration: 15–30 seconds in front of three-headed Jyotirlinga', 'Total Visit Time: 2 to 3 hours'] },
      { icon: '👥', title: 'Crowd & Best Timing', points: ['Crowd Level: Extremely heavy on Shravan Mondays & Pradosham', 'Best Time: 5:30 AM early morning Mangal Aarti', 'Pilgrim Tip: Visit Kushavarta Kund before entering temple'] },
      { icon: '👔', title: 'Dress Code for Sanctum', points: ['Men entering Garbhagriha MUST wear Silken / Cotton Dhoti (Sola) bare chest', 'Women: Traditional Saree or Salwar Suit', 'Casual western clothes disallowed in inner sanctum queue'] },
      { icon: '📵', title: 'Mobile & Camera Restrictions', points: ['Strict Prohibition: Mobile phones & electronics forbidden inside inner mandir', 'Deposit devices at temple trust locker counter outside main gate'], prohibitedItems: ['Mobile Phones', 'Cameras', 'Leather Belts', 'Outside Food'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Free trust-managed shoe counters near main temple entrance', 'Locker facilities available for personal luggage'] },
      { icon: '♿', title: 'Accessibility & Assistance', points: ['Wheelchair assistance available at main queue entrance', 'Priority queue line provided for senior citizens'] },
      { icon: '🚻', title: 'Facilities & Prasadam', points: ['Clean RO drinking water points & restrooms inside complex', 'Official Sansthan Prasad stalls outside temple exit'] },
    ],
  },
  {
    id: 'baidyanath',
    condition: {
      any: ['baidyanath', 'babadham', 'vaidyanath', 'deoghar'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Shighradarshanam', points: ['General Entry: Free for all pilgrims', 'Shighradarshanam Pass (VIP): Available at temple coupon counters', 'K Kanwar Yatra: Special queue arrangements during Shravani Mela'] },
      { icon: '⏳', title: 'Queue & Duration', points: ['Wait Time: 45–90 mins (Normal Days), 4–8 hours (Shravan Month Kanwar Yatra)', 'Darshan Time: 15–20 seconds near sacred Lingam', 'Total Visit Time: 2 to 4 hours'] },
      { icon: '👥', title: 'Crowd & Best Time', points: ['Crowd Level: Massive during July-August Shravan month (Millions of Kanwariyas)', 'Best Time: 4:00 AM early morning Sarkari Puja or 6:00 PM Sandhya Aarti', 'Pilgrim Tip: Touch Panchsula (5-pronged brass trident) atop temple top'] },
      { icon: '👔', title: 'Dress Code & Customs', points: ['Saffron / Orange robes traditionally worn by Kanwar pilgrims', 'Modest Indian attire mandatory for general queue', 'Men: Dhoti-Kurta for Sparsh Darshan'] },
      { icon: '📵', title: 'Mobile & Security Policy', points: ['Mobile phones banned inside main Baba Mandir sanctum', 'Heavy security screening during peak season'], prohibitedItems: ['Mobile Phones (Sanctum)', 'Large Bags', 'Leather Accessories'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Footwear counters located outside main gate perimeter', 'Cloakrooms operated by Shrine Board near administrative building'] },
      { icon: '♿', title: 'Accessibility Notice', points: ['Priority entry gate for senior citizens and differently-abled pilgrims', 'Medical aid posts stationed around temple quadrangle'] },
      { icon: '🚻', title: 'Facilities & Peda Prasadam', points: ['Deoghar Peda & Elaichi Dana official prasad counters', 'Drinking water taps and restroom facilities in precinct'] },
    ],
  },
  {
    id: 'nageshwar',
    condition: {
      any: ['nageshwar', 'nageshvara'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Pooja Booking', points: ['General Entry: Free for all devotees', 'Abhishek Pooja: Special booking desk near temple hall for performing Jalabhishek', 'Online Pass: Available via Dwarkadhish / Nageshwar trust desk'] },
      { icon: '⏳', title: 'Queue & Duration', points: ['Wait Time: 15–30 mins (Weekdays), 1–2 hours (Shivratri / Shravan)', 'Darshan Duration: 30–60 seconds near Garbhagriha', 'Total Visit Time: 45 mins to 1.5 hours'] },
      { icon: '👥', title: 'Crowd & Best Time', points: ['Crowd Level: Moderate, peaks during Shivratri and Dwarka yatra season', 'Best Time: Early morning 6:00 AM or late afternoon 5:00 PM', 'Pilgrim Tip: View the giant 85-foot Lord Shiva statue in outer lawn'] },
      { icon: '👔', title: 'Dress Code for Abhishek', points: ['Men performing Abhishek MUST wear traditional Dhoti bare chest', 'General Queue: Decent Indian attire permitted', 'Women: Saree or Salwar suit with Dupatta'] },
      { icon: '📵', title: 'Mobile & Electronics Rules', points: ['Mobile photography restricted in inner sanctum', 'Photography permitted in outer lawns near giant Lord Shiva statue'], prohibitedItems: ['Sanctum Photography', 'Leather Belts'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Free footwear counter inside temple complex gate', 'Luggage storage counter available for pilgrims traveling between Dwarka & Bet Dwarka'] },
      { icon: '♿', title: 'Accessibility & Support', points: ['Wheelchair accessible entrance and smooth paved courtyard', 'Ramps provided near main temple doorway'] },
      { icon: '🚻', title: 'Facilities & Refreshments', points: ['Clean drinking water dispensers & washrooms', 'Temple trust refreshment stalls & prasad counters'] },
    ],
  },
  {
    id: 'rameshwar',
    condition: {
      any: ['rameshwar', 'ramanathaswamy', 'rameswaram'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & 22 Tirthas Bath', points: ['General Entry: Free for all pilgrims', '22 Holy Wells (Tirthas) Bath Ticket: ₹25 per person at corridor counter', 'Spatika Linga Darshan: 5:00 AM – 6:00 AM special morning ticket'] },
      { icon: '⏳', title: 'Queue & Ritual Duration', points: ['22 Wells Bath Duration: 45–75 mins (Walking through corridors)', 'Queue Wait Time: 45–90 mins (Weekdays), 2–4 hours (Festivals / Amavasya)', 'Total Visit Time: 3 to 4 hours including holy bath'] },
      { icon: '👥', title: 'Crowd & Ritual Order', points: ['Crowd Level: High daily, peak during Amavasya and Ram Navami', 'Best Time: 5:00 AM Spatika Linga Darshan', 'Pilgrim Tip: Take Agni Tirtham sea bath FIRST, then 22 Wells bath, then change clothes before sanctum darshan'] },
      { icon: '👔', title: 'Strict Wet Clothing Rule', points: ['MUST CHANGE WET CLOTHES after 22 Tirthas bath before entering main sanctum queue', 'Men: Dhoti / Veshti (Jeans / Shorts banned)', 'Women: Saree or Salwar Suit (Western wear banned)'] },
      { icon: '📵', title: 'Mobile & Photography Policy', points: ['Strict Prohibition: Mobile phones & cameras banned inside world-famous corridor & temple', 'Deposit phones at trust locker counters outside East / West towers'], prohibitedItems: ['Mobile Phones', 'Cameras', 'Wet Clothes in Sanctum', 'Leather Belts', 'Western Attire (Jeans/Shorts)'] },
      { icon: '👟', title: 'Shoe Stand & Changing Rooms', points: ['Footwear counters near East and West Gopuram gates', 'Dedicated changing rooms located near 22 Tirthas bath exit'] },
      { icon: '♿', title: 'Accessibility & Corridors', points: ['Longest temple corridor in the world (Paved & smooth)', 'Wheelchair ramp access available at West Gate entrance'] },
      { icon: '🚻', title: 'Facilities & Prasadam', points: ['Filtered drinking water points across corridors', 'Famous Rameshwaram Temple Prasadam counters (Laddoo & Panchamrit)'] },
    ],
  },
  {
    id: 'mallikarjuna',
    condition: {
      any: ['mallikarjuna', 'srisailam'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Sparsha Darshan', points: ['General Entry: Free queue available for all devotees', 'Sheeghra Darshan: ₹150 / ₹300 ticket counters near temple entrance', 'Sparsha Darshan (Direct Touch): Available during designated slotted hours via special booking & traditional attire'] },
      { icon: '⏳', title: 'Queue & Visit Duration', points: ['Wait Time: 1–2 hours (General Queue), 30–45 mins (Special Entry)', 'Sparsha Darshan Time: Slotted interaction inside Garbhagriha', 'Total Visit Time: 2 to 3.5 hours'] },
      { icon: '👥', title: 'Crowd & Timing', points: ['Crowd Level: Heavy on weekends, Mondays, Shivratri & Ugadi', 'Best Time: Early morning 4:30 AM Mangala Aarti (Suprabhatam)', 'Pilgrim Tip: Visit Bhramaramba Devi temple in the same shrine complex'] },
      { icon: '👔', title: 'Dress Code for Sparsha Darshan', points: ['Men performing Sparsha Darshan MUST wear traditional Dhoti & Uttariyam', 'Women MUST wear Saree or Chudidar with Dupatta', 'Strict dress code enforcement at sanctum entry gate'] },
      { icon: '📵', title: 'Electronics & Prohibited Items', points: ['Mobile phones, cameras, smartwatches, and all electronic gadgets strictly banned', 'Leather items (belts, wallets), sharp objects, and large bags prohibited', 'Free electronic lockers available near queue entry'], prohibitedItems: ['Mobile Phones & Smartwatches', 'Cameras & Recording Devices', 'Leather Belts & Wallets', 'Sharp Objects & Large Bags', 'Casual Western Attire (Shorts/Sleeveless)'] },
      { icon: '👟', title: 'Shoe Counters & Lockers', points: ['Devasthanam footwear counters near main Rajagopuram gate', 'Token system enforced for luggage and footwear'] },
      { icon: '♿', title: 'Accessibility & Transit', points: ['Ramp facilities provided for elderly pilgrims', 'Devasthanam battery buggies operational across temple streets'] },
      { icon: '🚻', title: 'Facilities & Nitya Annadanam', points: ['Free unlimited vegetarian meal at Nitya Annadanam hall', 'Clean drinking water dispensers & restroom blocks near queue complexes'] },
    ],
  },
  {
    id: 'kamakhya',
    condition: {
      any: ['kamakhya'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan', points: ['General Entry: Free entry for all devotees', 'VIP / Priority Pass: Counter tickets available for fast-track queue', 'Ambubachi Mela: Temple remains closed for 3 days during annual Ambubachi festival in June'] },
      { icon: '⏳', title: 'Queue & Darshan Duration', points: ['Wait Time: 1–3 hours (General Queue), 30–60 mins (VIP Pass)', 'Darshan Time: Direct viewing of natural spring Garbhagriha underground cave shrine', 'Total Visit Time: 2 to 4 hours'] },
      { icon: '👥', title: 'Crowd Level & Best Time', points: ['Crowd Level: High daily, extremely heavy during Durga Puja & Ambubachi Mela', 'Best Visit Window: Early morning before 7:30 AM to join queue', 'Pilgrim Tip: Sanctum is an underground cave with natural water spring; carry minimal items'] },
      { icon: '👔', title: 'Dress Code & Customs', points: ['Traditional modest Indian clothing strictly required', 'Men: Dhoti-Kurta, Pyjama-Kurta, or trousers (Shorts disallowed)', 'Women: Saree, Salwar Kameez, or traditional wear (Western shorts & skirts disallowed)'] },
      { icon: '📵', title: 'Mobile & Photography Policy', points: ['Photography & videography strictly prohibited inside Garbhagriha cave', 'Mobile phones disallowed inside inner sanctum area', 'Deposit electronics in official lockers near Nilachal Hill entrance'], prohibitedItems: ['Mobile Phones in Sanctum', 'Cameras & Recording Equipment', 'Leather Accessories', 'Western Shorts & Skirts', 'Large Bags'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Footwear counters available at Nilachal temple entrance complex', 'Locker facilities available for personal items'] },
      { icon: '♿', title: 'Accessibility & Support', points: ['Battery operated vehicles available on Nilachal hill road for elderly devotees', 'Priority assistance desk near administration building'] },
      { icon: '🚻', title: 'Facilities & Prasadam', points: ['Clean drinking water stations and public washrooms', 'Kamakhya Temple trust prasad and souvenir counters outside complex'] },
    ],
  },
  {
    id: 'kalighat',
    condition: {
      any: ['kalighat', 'kali temple kolkata'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Timings', points: ['General Entry: Free entry for all pilgrims', 'Darshan Timings: Morning 5:00 AM – 2:00 PM; Evening 5:00 PM – 10:30 PM (Sanctum closed 2:00 PM – 5:00 PM)'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Men: Kurta-pyjama, dhoti, or simple traditional Indian attire', 'Women: Saree, salwar kameez, or modest Indian dress', 'Covering shoulders and knees is strongly recommended'] },
      { icon: '📵', title: 'Photography & Footwear Rules', points: ['Strictly prohibited: Photography and videography inside inner sanctum', 'Footwear must be deposited at shoes counters outside main temple gates'], prohibitedItems: ['Sanctum Photography & Videography', 'Footwear in Temple Premises'] },
      { icon: '👟', title: 'Shoe Stand & Lockers', points: ['Footwear counters available at main entrance gates', 'Locker facilities available for personal belongings'] },
    ],
  },
  {
    id: 'dakshineswar',
    condition: {
      any: ['dakshineswar', 'dakshineswar kali'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Historical Context', points: ['Significance: Dedicated to Goddess Bhavatarini; built by Rani Rashmoni in 1855; Sri Ramakrishna Paramahamsa served as head priest', 'Summer Timings (Apr–Sep): 5:30 AM – 11:30 AM & 3:30 PM – 9:00 PM', 'Winter Timings (Oct–Mar): 6:00 AM – 12:30 PM & 3:00 PM – 8:30 PM'] },
      { icon: '👔', title: 'Dress Code & Attire', points: ['Modest clothing strictly enforced for all pilgrims', 'Avoid shorts and sleeveless tops', 'Footwear must be removed before entering (free storage counter available)'] },
      { icon: '📵', title: 'Prohibited Items & Mobile Policy', points: ['Mobile phones and electronic gadgets prohibited inside inner shrine', 'Photography strictly banned inside main shrine', 'Leather items, smoking, alcohol, and large bags banned'], prohibitedItems: ['Mobile Phones & Gadgets inside Shrine', 'Photography in Main Shrine', 'Leather Items', 'Smoking & Alcohol', 'Large Bags'] },
      { icon: '👟', title: 'Shoe Storage & Courtyard', points: ['Free shoe storage counter provided at complex entrance', 'Paved and clean courtyard along the Hooghly riverbank'] },
    ],
  },
  {
    id: 'tarapith',
    condition: {
      any: ['tarapith'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan Schedule', points: ['Opening Time: 5:30 AM (New rules enforced since Dec 2024)', 'Closing Time: 10:00 PM', 'Darshan Windows: 5:30 AM – 12:00 PM; 1:30 PM – 5:00 PM; 6:00 PM – 10:00 PM (Sanctum closed 12:00–1:30 PM & 5:00–6:00 PM)'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional attire mandatory for entering temple queue', 'Shorts, sleeveless clothing, and revealing attire are prohibited'] },
      { icon: '📵', title: 'Mobile & Sanctum Regulations', points: ['Mobile phones MUST be deposited at main entrance lockers (New Rule)', 'Direct sindoor application and coconut breaking inside Garbhagriha now strictly prohibited', 'Photography inside sanctum prohibited'], prohibitedItems: ['Mobile Phones (Must deposit at entrance)', 'Direct Sindoor Application in Sanctum', 'Coconut Breaking in Sanctum', 'Sanctum Photography', 'Leather Items & Footwear', 'Food, Drinks, Tobacco & Smoking', 'Revealing Clothing (Shorts/Sleeveless)'] },
      { icon: '👟', title: 'Lockers & Shoe Stands', points: ['Mandatory mobile and luggage lockers at main entrance gate', 'Footwear storage facilities located before temple complex'] },
    ],
  },
  {
    id: 'vaishno_devi',
    condition: {
      any: ['vaishno_devi', 'vaishnodevi', 'mata vaishno devi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & 24×7 Operations', points: ['Bhawan status: Open 24×7, 365 days a year (Bhawan never closes)', 'Darshan is continuous except brief pauses during Morning Attka Aarti (6:20–8:00 AM) and Evening Attka Aarti (7:20–8:30 PM)', 'Mandatory Yatra Parcha / RFID Access Card required from Katra registration counters'] },
      { icon: '👔', title: 'Clothing & Weather Preparation', points: ['No official dress code, but short or revealing clothes should be avoided', 'Light woollens needed at night even during summer; heavy woollens mandatory in winter', 'Footwear with adequate trekking grip required; carry raincoat/poncho for sudden rain'] },
      { icon: '🚫', title: 'Strictly Banned Items (Confiscated at Banganga)', points: ['Non-veg food (meat, fish, eggs) & liquor banned completely across Katra town', 'Tobacco, cigarettes, bidi, matches, lighters, scissors, toy weapons', 'Sharp objects (knives, axes, hatchets, crowbars, hammers, swords)', 'Firearms, ammunition, explosives, replicas, fuels, gas torches, video cameras', 'Coconuts banned beyond frisking point at Bhawan; heavy/oversized luggage prohibited'], prohibitedItems: ['Non-Veg Food & Alcohol (Town-wide ban)', 'Tobacco, Cigarettes & Matches', 'Lighters & Sharp Objects (Knives/Scissors)', 'Firearms, Ammunition & Explosives', 'Video Cameras & Coconuts at Bhawan', 'Heavy & Oversized Luggage'] },
      { icon: '👟', title: 'Locker System & Footwear', points: ['Free Shrine Board cloakrooms and locker facilities available at Bhawan', 'Footwear storage available before entering Holy Cave entrance queue'] },
    ],
  },
  {
    id: 'ambaji',
    condition: {
      any: ['ambaji'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Darshan Slots', points: ['Darshan Slots: Morning 8:00 AM – 11:30 AM; Afternoon 12:30 PM – 4:30 PM; Evening 7:00 PM – 9:00 PM', 'No idol in sanctum; holy Visa Yantra is worshipped'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional and formal clothing required for darshan', 'Shorts and revealing outfits are strictly prohibited'] },
      { icon: '📵', title: 'Electronics & Plastic Ban', points: ['Mobile phones, cameras, and all electronic gadgets strictly banned inside temple', 'Plastic carry bags prohibited (Ambaji is a plastic-free zone)', 'Leather items and large bags prohibited inside shrine premises'], prohibitedItems: ['Mobile Phones & Electronic Gadgets', 'Cameras & Recording Devices', 'Plastic Carry Bags', 'Leather Items', 'Large Bags', 'Shorts & Revealing Outfits'] },
      { icon: '👟', title: 'Shoe Stand & Storage', points: ['Footwear counters available at main entrance gates', 'Electronics deposit locker counters near entrance point'] },
    ],
  },
  {
    id: 'chamundeshwari',
    condition: {
      any: ['chamundeshwari', 'chamundi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Abhisheka Timings', points: ['Darshan Hours: Morning 7:30 AM – 2:00 PM; Evening 3:30 PM – 6:00 PM; Night 7:30 PM – 9:00 PM', 'Abhisheka Timing: 6:00 AM – 7:30 AM (Fridays from 5:00 AM)', 'Special Express Pass tickets available at ₹100 & ₹300 counters'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian and formal clothing recommended for all devotees', 'Modest attire required for sanctum queue'] },
      { icon: '📵', title: 'Plastic Ban & Photography Rules', points: ['Chamundi Hill temple complex is a designated No Plastic Zone', 'Photography strictly prohibited inside inner sanctum', 'Footwear must be removed before entering temple complex'], prohibitedItems: ['Plastic Carry Bags (No Plastic Zone)', 'Sanctum Photography', 'Footwear inside Temple'] },
      { icon: '👟', title: 'Shoe Stand & Hill Facilities', points: ['Footwear deposit counters at entrance near bus stand / parking area', 'KSRTC bus service & foot steps (1,000 steps) available to reach hill top'] },
    ],
  },
];


