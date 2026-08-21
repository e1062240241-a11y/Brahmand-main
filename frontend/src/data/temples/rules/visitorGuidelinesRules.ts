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
  {
    id: 'harsiddhi',
    condition: {
      any: ['harsiddhi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Lighting', points: ['Free entry for all devotees', 'Grand evening lamp lighting at 7:30 PM: Two towering Deepstambhs with hundreds of lamps lit', 'Navratri (9-day festival) features special rituals; heavy crowd on Ashtami & Navami'] },
      { icon: '👔', title: 'Dress Code & Etiquette', points: ['Carry a chunari / stole to cover head as a mark of respect', 'Modest, traditional attire recommended for all devotees'] },
      { icon: '📵', title: 'Photography Rules', points: ['Photography restricted inside inner sanctum (permitted in outer courtyard premises)', 'Footwear must be removed before entering mandir'] },
    ],
  },
  {
    id: 'tripura_sundari',
    condition: {
      any: ['tripura sundari', 'tripurasundari', 'matabari'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Temple Layout', points: ['Two sacred idols: 5 ft Tripura Sundari and 2 ft Chhoto-Ma (Goddess Chandi)', 'Kalyan Sagar Lake located within complex holding sacred fish & tortoises', 'VIP Pass available from ₹100 to ₹500 depending on festival season'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended: Dhotis / trousers for men, Sarees / salwar kameez for women', 'Avoid shorts and sleeveless tops; cover shoulders and knees'] },
      { icon: '📵', title: 'Prohibited Items & Lake Advisory', points: ['Photography strictly prohibited inside sanctum sanctorum', 'Mobile phone usage restricted near inner altar', 'DO NOT feed packaged food or bread to tortoises & fish in Kalyan Sagar Lake'], prohibitedItems: ['Sanctum Photography', 'Mobiles near Altar', 'Packaged Food for Turtles/Fish', 'Leather Items', 'Shorts & Sleeveless Tops'] },
      { icon: '👟', title: 'Locker & Storage', points: ['Lockers available near entrance for storing electronics and leather items'] },
    ],
  },
  {
    id: 'jwalaji',
    condition: {
      any: ['jwala', 'jwalaji'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Eternal Flames & Temple Legend', points: ['Nine eternal flames emanate from natural rock fissures — no traditional idol', 'Historical site visited by Emperor Akbar who offered a golden umbrella', 'Grand 2-hour Aarti suspension during morning & evening Aarti times'] },
      { icon: '👔', title: 'Strict Dress Code Rules', points: ['Men: Shirt & trouser, dhoti or pyjamas with upper cloth', 'Women: Saree, half-saree, or chudidar with pyjama & upper cloth', 'STRICTLY PROHIBITED: Shorts, mini-skirts, middies, sleeveless tops, low-waist jeans, short t-shirts', 'Entry denied if dress code is not followed (applies to foreign visitors as well)'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography & videography strictly forbidden inside temple premises', 'Smoking & alcohol consumption strictly prohibited', 'Chewing betel leaves, tobacco, gutka & spitting strictly prohibited', 'Leather belts, wallets, and bags banned inside sanctum'], prohibitedItems: ['Photography & Videography', 'Smoking & Alcohol', 'Tobacco, Gutka & Spitting', 'Leather Items', 'Non-Traditional Attire / Shorts'] },
    ],
  },
  {
    id: 'brajeshwari',
    condition: {
      any: ['brajeshwari', 'vajreshwari'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Langar & Pooja Booking', points: ['Free Langar served daily 12:30 PM – 2:30 PM and 7:30 PM – 9:00 PM (Continuous during Navratri)', 'Grand Yagya Shala available for Havan Yagya', 'Darshan Parchi slip booking available online'] },
      { icon: '👔', title: 'Dress Code Etiquette', points: ['Traditional and formal modest clothing expected for all pilgrims'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography not allowed inside temple premises', 'Leather items (belts, wallets) banned inside inner shrine', 'Smoking and alcohol strictly prohibited'], prohibitedItems: ['Inside Photography', 'Leather Items', 'Smoking & Alcohol'] },
    ],
  },
  {
    id: 'chintpurni',
    condition: {
      any: ['chintpurni', 'chhinnamastika'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Darshan Parchi & Facilities', points: ['Mandatory Darshan Parchi (slip) required from security guard before entering queue', 'Online Aarti streaming available on official trust site', 'Havan and head-shaving (Mundan) facilities available on site'] },
      { icon: '👔', title: 'Dress Code & Footwear', points: ['Modest traditional attire expected', 'Remove footwear at designated footwear counters before entering premises'] },
      { icon: '⚠️', title: 'Strict Rules & Regulations', points: ['Do not accept plastic polythene bags; Chintpurni is plastic-free zone', 'Do not feed monkeys or throw prasad on the floor', 'Do not bribe any vendor/person for back-door darshan entry', 'Do not touch abandoned objects in queue area'], prohibitedItems: ['Plastic Polythene Bags', 'Littering & Throwing Prasad', 'Back-door Darshan Bribes', 'Smoking & Alcohol'] },
    ],
  },
  {
    id: 'naina_devi',
    condition: {
      any: ['naina devi', 'nainadevi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Darshan & Transport', points: ['Extended Navratri timings: Open 2:00 AM to 12:00 Midnight', 'Ropeway / Cable car service available to reach hilltop temple', 'Live YouTube Darshan feed provided by temple trust'] },
      { icon: '👔', title: 'Dress Code & Hygiene', points: ['No official dress code enforced, but short or revealing clothes should be avoided out of respect', 'Footwear, leather items, and photography inside sanctum are prohibited'] },
    ],
  },
  {
    id: 'chamunda_devi_kangra',
    condition: {
      any: ['chamunda', 'chamundeshwar dham', 'nandikeshwar'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Daily Services', points: ['Free entry for all devotees; no ticket needed for general darshan', 'Free Langar served daily 12:00 PM – 2:00 PM and 7:00 PM – 9:00 PM (Continuous during Navratri)', 'Evening Aarti broadcast daily live on MH1 Prime channel', 'Online Darshan Parchi slip booking available'] },
      { icon: '👔', title: 'Dress Code & Hygiene', points: ['No rigidly enforced dress code, but modest traditional clothing expected', 'Leave footwear at designated shoe stands outside main entrance'] },
      { icon: '📵', title: 'Photography Rules', points: ['Photography strictly prohibited inside inner sanctum'] },
    ],
  },
  {
    id: 'mansa_devi',
    condition: {
      any: ['mansa devi', 'mansadevi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Darshan Tokens & Accessibility', points: ['Sugam Darshan token: ₹100 for fast-track queue', 'Mandap Darshan token: ₹500', 'Lift & wheelchair facilities available at VIP gate for senior citizens, pregnant ladies, and divyang devotees', 'Ropeway / Cable Car (Udan Khatola) available for hill climb'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Avoid shorts, sleeveless, and revealing clothing out of sanctity'] },
      { icon: '🚫', title: 'Strictly Prohibited Items', points: ['Smoking, alcohol, meat, and non-veg food strictly prohibited across shrine zone', 'Leather belts, wallets, and accessories prohibited inside inner altar'], prohibitedItems: ['Smoking & Alcohol', 'Non-Veg Food', 'Leather Accessories', 'Shorts & Revealing Outfits'] },
    ],
  },
  {
    id: 'chandi_devi_haridwar',
    condition: {
      any: ['chandi devi', 'chandidevi', 'neel parvat'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Trek & Cable Car Access', points: ['3 km uphill trek from Chandighat (~45–60 min climb)', 'Ropeway (Udan Khatola) available and recommended for elderly devotees', 'Special darshan lane provided for Seva ticket holders & senior citizens (65+)'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional attire recommended: Dhotis / trousers & shirts for men, Sarees / salwar kameez for women', 'Avoid shorts and sleeveless tops'] },
      { icon: '📵', title: 'Prohibited Items & Lockers', points: ['Photography strictly prohibited inside inner sanctum', 'Leather accessories, non-veg food, alcohol strictly prohibited', 'Mobile lockers available at ropeway station & trekking start point'], prohibitedItems: ['Sanctum Photography', 'Leather Accessories', 'Non-Veg Food & Alcohol', 'Shorts & Sleeveless Tops'] },
    ],
  },
  {
    id: 'alopi_devi_prayagraj',
    condition: {
      any: ['alopi', 'alopidevi', 'alopi mata'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Sacred Offerings & Unique Shrine', points: ['No idol present — devotees worship an ornate silver swing (Jhoola)', 'Offerings include coconut, sindoor, red chunari, bangles, and sweets', 'Heavy rush during Kumbh Mela, Magh Mela, and Navratri (24x7 open)'] },
      { icon: '👔', title: 'Dress Code & Hygiene', points: ['Modest and respectful traditional attire required', 'Remove footwear before entering temple premises'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography restricted inside inner sanctum', 'Leather items strictly prohibited', 'Mobile phone usage inside sanctum discouraged'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Mobile Usage inside Sanctum'] },
    ],
  },
  {
    id: 'vindhyavasini',
    condition: {
      any: ['vindhyavasini', 'vindhyachal'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Holy Dip & Trikon Parikrama', points: ['Traditional holy dip in River Ganga before visiting shrine', 'Complete Trikon Parikrama circuit: Vindhyavasini → Ashtabhuja (hilltop) → Kali Khoh', 'Vehicles restricted near temple complex during Navratri'] },
      { icon: '👔', title: 'Dress Code & Etiquette', points: ['Modest traditional attire required (especially during Navratri)', 'Remove footwear before entering', 'Maintain silence and queue discipline inside Garbhagriha'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Mobile phones, cameras & recording devices restricted in main sanctum', 'Tobacco, alcohol & intoxicants strictly banned', 'Leather items forbidden inside sanctum'], prohibitedItems: ['Cameras & Recording Devices', 'Mobiles in Sanctum', 'Tobacco & Alcohol', 'Leather Items'] },
    ],
  },
  {
    id: 'devipatan',
    condition: {
      any: ['devipatan', 'tulsipur'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Head Shaving & Navratri', points: ['Head-shaving ceremony (Mundan) of children is a sacred traditional practice here', 'Heavy crowds during Navratri festivals; plan queue times accordingly'] },
      { icon: '👔', title: 'Strict Dress Code Rules', points: ['Men: Shirt & trouser, dhoti or pyjamas with upper cloth', 'Women: Saree, half-saree, or chudidar with pyjama & upper cloth', 'STRICTLY PROHIBITED: Shorts, mini-skirts, sleeveless tops, low-waist jeans, short t-shirts'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited', 'Leather items (belts, wallets) banned inside shrine'], prohibitedItems: ['Photography', 'Leather Items', 'Shorts / Non-Traditional Attire'] },
    ],
  },
  {
    id: 'sharada_peeth',
    condition: {
      any: ['sharada peeth', 'sharda peeth', 'neelum valley'],
    },
    guidelines: [
      { icon: '⚠️', title: 'Border Access & Permit Guidelines', points: ['Located in Neelum Valley (Pakistan-administered Kashmir)', 'Access strictly subject to official government permits and border security conditions', 'Site is an ancient archaeological ruin; no regular daily temple services'] },
      { icon: '👔', title: 'Dress Code & Security Rules', points: ['Modest and respectful traditional clothing required during visits', 'Follow all security instructions and photography restrictions enforced by local border authorities'] },
    ],
  },
  {
    id: 'fullara_attahas',
    condition: {
      any: ['fullara', 'attahas', 'labhpur'],
    },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected out of sanctity'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items (belts, wallets) banned inside sanctum', 'Remove footwear outside temple premises'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'bakreshwar',
    condition: {
      any: ['bakreshwar', 'bakreswar', 'suri'],
    },
    guidelines: [
      { icon: '♨️', title: 'Hot Springs & Temple Visit', points: ['Natural thermal hot springs (Kunds) nearby known for medicinal properties', 'Bakreshwar Shiva temple located within the same sacred complex'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside shrine', 'Remove footwear before entering temple area'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'nalateswari',
    condition: {
      any: ['nalateswari', 'nalateswari temple', 'nalhati'],
    },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside sanctum', 'Remove footwear before entering sanctum'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'jogadya',
    condition: {
      any: ['jogadya', 'khirgram', 'burdwan'],
    },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside sanctum', 'Remove footwear outside shrine'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'kankalitala',
    condition: { any: ['kankalitala', 'kankali', 'bolpur'] },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside sanctum', 'Remove footwear before entry'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'bahula',
    condition: { any: ['bahula', 'ketugram'] },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside sanctum', 'Remove footwear before entering'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'ujaani_mangal_chandi',
    condition: { any: ['ujaani', 'mangal chandi', 'mangalkote'] },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside sanctum', 'Remove footwear before entry'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'kiriteswari',
    condition: { any: ['kiriteswari', 'kiriteswari temple', 'kiritchona', 'murshidabad'] },
    guidelines: [
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Modest clothing expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum', 'Leather items banned inside sanctum', 'Remove footwear before entering'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'maihar_sharda_devi',
    condition: { any: ['maihar', 'sharda devi maihar', 'maihar mata'] },
    guidelines: [
      { icon: '🚡', title: 'Hill Access & Ropeway Rules', points: ['1,063 steps to hilltop temple; Ropeway timing 7:00 AM – 7:00 PM (₹150 adults, ₹100 kids 3-10 yrs)', 'Extremely crowded during Chaitra & Sharad Navratri; best visit 5:00-7:00 AM or post 8:00 PM'] },
      { icon: '👔', title: 'Strict Dress Code Rules', points: ['Men: Shirt & trouser, dhoti or pyjamas with upper cloth', 'Women: Saree, half-saree, or chudidar with pyjama & upper cloth', 'PROHIBITED: Shorts, mini-skirts, sleeveless tops, low-waist jeans, short t-shirts'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner sanctum sanctorum', 'Smoking, alcohol, gutka, betel leaves, spitting strictly prohibited', 'Leather items (belts, wallets) banned'], prohibitedItems: ['Sanctum Photography', 'Smoking & Alcohol', 'Tobacco/Gutka/Betel', 'Leather Items', 'Shorts / Non-Traditional Attire'] },
    ],
  },
  {
    id: 'danteshwari_dantewada',
    condition: { any: ['danteshwari', 'dantewada'] },
    guidelines: [
      { icon: '🎟️', title: 'Temple & Festival Guidelines', points: ['Prasad distribution 11:00 AM – 5:00 PM', 'Massive crowds during Fagun Mela (March–April) and Navratri'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional and formal clothing required', 'Modest attire expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography not allowed', 'Leather items banned inside temple premises', 'Remove footwear outside'], prohibitedItems: ['Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'hinglaj_mata',
    condition: { any: ['hinglaj', 'hinglaj mata', 'hingol', 'nani mandir'] },
    guidelines: [
      { icon: '🌐', title: 'Pilgrimage & Permit Guidelines', points: ['Located in Hingol National Park, Balochistan, Pakistan; Indian pilgrims require valid visa & official permits', 'Four-day annual Hinglaj Yatra (April–May); best weather October–March'] },
      { icon: '👔', title: 'Dress Code & Sanctity', points: ['Women must cover head and shoulders', 'Respectful traditional clothing expected; strict holy site decorum'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Non-veg meat and fish strictly prohibited', 'Photography not allowed inside temple cave', 'No picnic activities, littering, or nuisance allowed'], prohibitedItems: ['Meat & Fish', 'Temple Photography', 'Footwear', 'Picnicking / Littering'] },
    ],
  },
  {
    id: 'biraja_jajpur',
    condition: { any: ['biraja', 'biraja temple', 'jajpur'] },
    guidelines: [
      { icon: '🕉️', title: 'Durga Puja & Chariot Festival', points: ['16-day Sharadiya Durga Puja (Shodasha Dinatmika Puja)', 'Unique Simhadhwaja Ratha chariot festival celebrated'] },
      { icon: '👔', title: 'Strict Dress Code Rules', points: ['Men: Shirt & trouser, dhoti or pyjamas with upper cloth', 'Women: Saree, half-saree, or chudidar with pyjama & upper cloth', 'PROHIBITED: Shorts, mini-skirts, sleeveless tops, low-waist jeans, short t-shirts'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Smoking, drinking, betel leaves, gutka, spitting strictly prohibited', 'Leather items banned', 'Photography restricted inside'], prohibitedItems: ['Smoking & Alcohol', 'Tobacco/Gutka', 'Leather Items', 'Sanctum Photography', 'Shorts / Non-Traditional Attire'] },
    ],
  },
  {
    id: 'taratarini_ganjam',
    condition: { any: ['taratarini', 'tara tarini', 'puruna risi', 'ganjam'] },
    guidelines: [
      { icon: '🚡', title: 'Access & Facilities', points: ['999 steps or ropeway access to hilltop Purnagiri shrine', 'Free cloth wraps available at entrance if outfit does not meet guidelines', 'Hair offering (Mundan) rituals popular on Tuesdays'] },
      { icon: '👔', title: 'Dress Code Rules', points: ['Men: Dhoti/Kurta or shirt with full-length pants', 'Women: Saree or salwar kameez', 'PROHIBITED: Shorts, mini-skirts, revealing clothing'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly prohibited inside inner Garbhagriha (twin deities)', 'Leather items (belts, bags) banned', 'No plastic allowed inside'], prohibitedItems: ['Garbhagriha Photography', 'Leather Items', 'Plastic Bags', 'Shorts / Revealing Attire'] },
    ],
  },
  {
    id: 'badi_patan_devi',
    condition: {
      any: ['patan devi', 'badi patan devi', 'patneshwari', 'patna devi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Pass & Timings', points: ['₹100 Special Entry pass available to bypass general queue during non-peak hours', 'Sanctum closed for mid-day cleaning break from 12:00 PM to 3:00 PM', 'Best time to visit: 6:00 AM – 8:00 AM on weekdays', 'Havan Kund in front of sanctum for continuous worship offerings'] },
      { icon: '👔', title: 'Strict Traditional Dress Code Mandatory', points: ['Men: Dhoti/Kurta or shirts with trousers', 'Women: Sarees or salwar kameez', 'PROHIBITED: Western attire (shorts/jeans) strictly prohibited'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography strictly banned inside sanctum and inner courtyard', 'Mobile phones must be kept on silent mode', 'Free lockers available near entrance for electronic devices and leather items (belts/wallets)'], prohibitedItems: ['Sanctum Photography', 'Western Attire (Jeans/Shorts)', 'Leather Belts/Wallets inside Sanctum', 'Footwear'] },
    ],
  },
  {
    id: 'chinnamasta_rajrappa',
    condition: {
      any: ['chinnamasta', 'chinnamastika', 'rajrappa'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Entry & Age Verification', points: ['Photo ID proof & address required for darshan; devotees must be above 18 years', 'Located ~72 km from Ranchi (Ramgarh Cantonment railhead ~27 km, Birsa Munda Airport ~70 km)', 'Best visit season: October to March (December ideal)', 'Temple closes briefly during morning (6:00 AM) and evening (8:00 PM) Aarti'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional and formal clothing required', 'Modest attire expected'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside sanctum prohibited', 'Footwear must be removed outside', 'Leather items banned'], prohibitedItems: ['Sanctum Photography', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'kamakshi_amman_kanchipuram',
    condition: {
      any: ['kamakshi', 'kamakshi amman', 'kanchipuram kamakshi'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Darshan & Poornima Rules', points: ['Nadai (Temple doors) closed during afternoon break: 12:30 PM – 3:45 PM', 'Devotees not allowed inside Gayathri Mandapam during Poornima night Nava Varna Pooja', 'Grand 9-day Sharada & Vasantha Navarathri with Yaga Sala Pooja & Chandi Homam; Annual Brahmotsavam (Feb–Mar)'] },
      { icon: '👔', title: 'Dress Code Guidelines', points: ['Traditional Indian attire recommended', 'Men: Dhoti or formal trousers with shirt', 'Women: Saree or salwar kameez', 'PROHIBITED: Avoid shorts and sleeveless tops'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside inner sanctum restricted', 'Mobile phones must be on silent mode', 'Footwear must be removed before entering'], prohibitedItems: ['Sanctum Photography', 'Shorts & Sleeveless Tops', 'Footwear inside Temple'] },
    ],
  },
  {
    id: 'bhramaramba_srisailam',
    condition: {
      any: ['bhramaramba', 'bhramarambika', 'srisailam shakti peetha'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Queues & Prasadam Facilities', points: ['Separate queues for Shiva (Mallikarjuna) and Shakti (Bhramaramba) darshan', 'Sarva Darshan: Free | Seeghra: ₹150 | Bhramaramba Quick: ₹200 | VIP: ₹500/person', 'Free Annaprasada Vitharana meals at 11:30 AM daily at Annapurna Mandiram', 'Divya Parimala Vibhoothi sacred ash & Kesha Khandanam (tonsuring) facility at Kalyana Katta', 'Cloakroom available at queue-line complex'] },
      { icon: '👔', title: 'Strict Traditional Dress Code Rules', points: ['Men: Dhoti/Pancha with Angavastram or Kurta-Pyjama', 'Women: Saree, half-saree, or Chudidar with Dupatta', 'PROHIBITED: Shorts, mini-skirts, middies, sleeveless tops, low-waist jeans, short t-shirts'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Mobile phones, cameras, and all electronic gadgets strictly banned', 'Leather items prohibited', 'Smoking, drinking, betel leaves, gutka, tobacco, spitting banned'], prohibitedItems: ['Mobile Phones & Gadgets', 'Cameras', 'Leather Items', 'Smoking & Alcohol', 'Tobacco/Gutka/Betel', 'Shorts / Jeans / Sleeveless'] },
    ],
  },
  {
    id: 'kanaka_durga_vijayawada',
    condition: {
      any: ['kanaka durga', 'kanakadurgamma', 'indrakeeladri', 'vijayawada durga'],
    },
    guidelines: [
      { icon: '🎟️', title: 'Darshan, Online Sevas & Prasadam', points: ['Dharma Darshanam: 4:00 AM – 5:45 PM & 6:15 PM – 10:00 PM', 'Anna Prasadam served daily from 10:00 AM to 4:00 PM', 'Online booking for Sevas/Darshanam at kanakadurgamma.org; Live YouTube stream on SriKanakaDurga Official; Paroksha Seva available', 'Grand celebrations during Dasara & Navratri'] },
      { icon: '👔', title: 'Strict Traditional Dress Code Mandatory (Strictly Enforced)', points: ['Western attire strictly prohibited — devotees wearing jeans, shorts, skirts, or sleeveless tops will be restricted from entering', 'Men: Dhoti, panche, or traditional attire with upper cloth', 'Women: Saree, salwar kameez, or traditional Indian dress'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Western attire strictly prohibited (devotees restricted at entrance)', 'Mobile phones strictly prohibited in darshan queue lines', 'Leather items strictly banned (considered impure)', 'Photography restricted inside sanctum'], prohibitedItems: ['Western Attire (Jeans/Shorts/Skirts/Sleeveless)', 'Mobile Phones in Queue', 'Leather Items', 'Sanctum Photography'] },
    ],
  },

  {
    id: 'amarnath',
    condition: { any: ['amarnath', 'amarnath cave', 'amarnath yatra'] },
    guidelines: [
      { icon: '🗓️', title: 'Mandatory Yatra Registration', points: ['Advance registration from April 15 at jksasb.nic.in', 'Mandatory RFID card required for movement along trek routes'] },
      { icon: '🏥', title: 'Health & Fitness Requirements', points: ['Compulsory Medical Fitness Certificate from authorized doctors', 'Age restrictions: 13 to 70 years only; pregnant women >6 weeks not allowed'] },
      { icon: '🛡️', title: 'Safety & Insurance Cover', points: ['₹5 lakh insurance coverage provided for all registered yatris', 'Follow designated trekking routes: Baltal (14 km) or Pahalgam/Chandanwari (32 km)'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Plastic bottles and polythene (strictly banned by law)', 'Smoking, alcohol, and narcotic substances', 'Flash cameras inside the holy cave', 'Incense sticks (agarbatties) or dhoop inside cave', 'Touching or tampering with the Holy Ice Lingam'], prohibitedItems: ['Plastic & Polythene', 'Smoking & Alcohol', 'Flash Cameras inside Cave', 'Incense / Dhoop inside Cave', 'Touching Ice Lingam'] },
    ],
  },
  {
    id: 'lingaraj',
    condition: { any: ['lingaraj', 'bhubaneswar lingaraj'] },
    guidelines: [
      { icon: '🔑', title: 'Entry & Viewing Protocol', points: ['Only Hindus are permitted inside the main temple complex', 'Special raised viewing platform outside the boundary wall for non-Hindu visitors'] },
      { icon: '💼', title: 'Belongings & Electronics', points: ['Leather items (belts, bags, wallets) strictly forbidden inside', 'Mobile phones, smartwatches, and cameras must be deposited at cloakrooms'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Non-Hindu entry inside main temple grounds', 'Leather items (belts, shoes, bags)', 'Cameras and mobile phone usage', 'Outside food or beverages'], prohibitedItems: ['Non-Hindu Entry', 'Leather Belts/Bags/Shoes', 'Cameras & Mobile Phones', 'Outside Food & Drinks'] },
    ],
  },
  {
    id: 'brihadisvara',
    condition: { any: ['brihadisvara', 'brihadeeswarar', 'thanjavur big temple', 'peruvudaiyar'] },
    guidelines: [
      { icon: '👟', title: 'Footwear & Heritage Rules', points: ['Remove footwear at outer entrance shoe counter before entering courtyard', 'Respect ASI heritage norms; do not touch ancient Chola mural paintings'] },
      { icon: '📷', title: 'Photography Restrictions', points: ['Photography allowed in outer lawns; strictly prohibited inside sanctum sanctorum', 'Drones and commercial videography require written ASI permission'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Footwear inside main granite courtyard and sanctum', 'Touching ancient stone carvings and fresco paintings', 'Drones without prior ASI written clearance', 'Commercial video recording without permit'], prohibitedItems: ['Footwear inside Courtyard', 'Touching Murals/Carvings', 'Drones without Permission', 'Commercial Video Recording'] },
    ],
  },
  {
    id: 'tungnath',
    condition: { any: ['tungnath', 'chopta tungnath'] },
    guidelines: [
      { icon: '🏔️', title: 'Trek & Altitude Preparedness', points: ['Prepare for 3.5 km steep uphill trek from Chopta base', 'Carry adequate warm clothes, rain gear, and sturdy walking shoes'] },
      { icon: '🍃', title: 'Eco-Sensitive Alpine Zone', points: ['Single-use plastic strictly banned in Chopta-Tungnath bugyal (meadows)', 'Do not trek beyond Chandrashila peak after sunset without local guides'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Littering plastic or garbage on trek trail', 'Alcohol or non-vegetarian food in Chopta/Tungnath area', 'Night trekking beyond Chandrashila without permission', 'Damaging alpine flora and fauna'], prohibitedItems: ['Plastic & Polythene Littering', 'Alcohol & Non-Veg Food', 'Night Trekking beyond Chandrashila', 'Damaging Alpine Plants'] },
    ],
  },
  {
    id: 'pashupatinath_mandsaur',
    condition: { any: ['pashupatinath mandsaur', 'mandsaur pashupatinath', 'ashtamukhi pashupatinath'] },
    guidelines: [
      { icon: '📷', title: 'Sanctum Rules', points: ['Mobile photography strictly prohibited inside Ashtamukhi sanctum', 'Remove footwear at outer temple steps before stepping onto marble floor'] },
      { icon: '🌊', title: 'Ghat Safety', points: ['Exercise caution near Shivna River ghats during monsoon season', 'Dispose of worship flowers in designated eco-bins'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside inner Ashtamukhi sanctum', 'Footwear in temple complex', 'Alcohol or non-vegetarian food near river ghats', 'Disturbing priests during Aarti'], prohibitedItems: ['Sanctum Photography', 'Footwear on Marble Floor', 'Alcohol & Non-Veg Food', 'Disturbing Priests during Aarti'] },
    ],
  },
  {
    id: 'bhojeshwar',
    condition: { any: ['bhojeshwar', 'bhojpur shiva'] },
    guidelines: [
      { icon: '🏛️', title: 'ASI Protected Monument Rules', points: ['Do not climb on uncompleted historical stone walls or dome structures', 'Preserve floor rock engravings depicting ancient architectural blueprints'] },
      { icon: '🦶', title: 'Sanctum Respect', points: ['Remove footwear at the main stone stairway leading up to the Shivlinga platform', 'Follow ASI visitor timings (6:00 AM to 7:00 PM)'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Climbing historical stone walls or uncompleted dome beams', 'Footwear on main Shivlinga platform', 'Defacing rock floor blueprints', 'Drones without ASI Bhopal circle permission'], prohibitedItems: ['Climbing Unfinished Stone Walls', 'Footwear on Shivlinga Platform', 'Defacing Floor Blueprints', 'Drones without Permission'] },
    ],
  },
  {
    id: 'murudeshwar',
    condition: { any: ['murudeshwar', 'kanduka hill'] },
    guidelines: [
      { icon: '🛗', title: 'Raja Gopura Lift Access', points: ['Take the elevator to 18th floor of 249ft Gopura for panoramic 360-degree ocean views', 'Follow queue safety instructions near glass viewing windows'] },
      { icon: '👕', title: 'Dress Code & Coastal Safety', points: ['Modest attire required inside main sanctum; short clothes not allowed', 'Avoid swimming in deep ocean areas near rocky cliff without lifeguard warning'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Mobile phones and photography in inner sanctum', 'Footwear inside main temple complex and Gopura lift', 'Unsafe swimming in high tide ocean areas', 'Short or revealing clothing in sanctum queue'], prohibitedItems: ['Sanctum Photography', 'Footwear inside Gopura Lift', 'Unsafe Ocean Swimming', 'Short/Revealing Clothing'] },
    ],
  },
  {
    id: 'tarakeshwar',
    condition: { any: ['tarakeshwar', 'taraknath'] },
    guidelines: [
      { icon: '💧', title: 'Holy Dip & Jal Dhal Protocol', points: ['Devotees take a sacred bath in Dudhpukur tank before offering water to Lord Taraknath', 'Use plastic or metal pots for pouring water; glass containers strictly forbidden'] },
      { icon: '👥', title: 'Crowd Management', points: ['Expect massive pilgrim rush during Shravan Mondays and Chaitra Gajan', 'Keep personal belongings safe and use designated shoe counters'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside inner Taraknath sanctum', 'Leather items inside main courtyard', 'Using glass containers for holy water pouring', 'Unapproved pandas or touts in queue lines'], prohibitedItems: ['Sanctum Photography', 'Leather Belts & Bags', 'Glass Containers for Water', 'Unapproved Touts'] },
    ],
  },
  {
    id: 'kapaleeshwarar',
    condition: { any: ['kapaleeshwarar', 'mylapore kapaleeshwarar', 'karpagambal'] },
    guidelines: [
      { icon: '👔', title: 'Traditional Dress Code', points: ['Dhotis/Kurta or Pants for men; Sarees, Dhavani, or Salwar Kameez for women', 'Shorts, Bermudas, sleeveless tops strictly prohibited inside precincts'] },
      { icon: '🌸', title: 'Karpagambal Shrine Protocol', points: ['Maintain quiet queues near Goddess Karpagambal shrine', 'Deposit footwear at East or West Raja Gopuram shoe stalls'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Footwear anywhere inside outer or inner temple praharam', 'Photography inside Karpagambal and Kapaleeshwarar sanctums', 'Western shorts/sleeveless clothing', 'Mobile phone usage in inner queue lines'], prohibitedItems: ['Footwear inside Praharam', 'Sanctum Photography', 'Western Shorts & Sleeveless Tops', 'Mobile Usage in Queue'] },
    ],
  },
  {
    id: 'vadakkunnathan',
    condition: { any: ['vadakkunnathan', 'thrissur vadakkunnathan', 'vadakkumnathan'] },
    guidelines: [
      { icon: '🔒', title: 'Strict Kerala Dress Code & Entry', points: ['Men must wear Mundu (Dhoti) and remove upper clothing (shirts/vests)', 'Women must wear Saree, Set-Mundu, or Salwar; Non-Hindus not allowed inside precincts'] },
      { icon: '📱', title: 'No Electronics & Leather', points: ['Mobile phones, cameras, smartwatches strictly forbidden inside outer wall', 'Leather belts, wallets, purses must be deposited outside'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Men wearing shirts or trousers inside temple compound', 'Non-Hindu entry inside main temple compound', 'Electronic devices and photography', 'Leather belts, purses, or footwear within outer walls'], prohibitedItems: ['Shirts & Trousers for Men', 'Non-Hindu Entry inside Sanctum', 'Electronic Devices & Photography', 'Leather Belts/Purses/Shoes'] },
    ],
  },
  {
    id: 'kotilingeshwara',
    condition: { any: ['kotilingeshwara', 'kolar kotilingeshwara'] },
    guidelines: [
      { icon: '🎟️', title: 'Entry Ticket & Camera Rules', points: ['Nominal entry ticket fee of ₹20 per head required at entry gate', 'Camera usage requires prior ₹100 camera pass from ticket counter'] },
      { icon: '🙏', title: 'Linga Installation Ceremony', points: ['Devotees can sponsor and install their own Shivlinga with custom engraved names', 'Maintain order while walking through the open-air Linga garden pathways'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Footwear in the main Shivlinga garden courtyard', 'Unpaid commercial photography', 'Littering plastic bags in Linga display gardens', 'Defacing or stepping on private installed Shivlingas'], prohibitedItems: ['Footwear in Linga Courtyard', 'Unpaid Photography', 'Plastic Littering', 'Defacing Installed Lingas'] },
    ],
  },
  {
    id: 'gopnath',
    condition: { any: ['gopnath', 'gopnath mahadev'] },
    guidelines: [
      { icon: '🌊', title: 'Seashore Safety', points: ['Avoid swimming in deep or rocky coastal waters near Gopnath cliff', 'Enjoy the sea breeze and beach views from safe designated promenades'] },
      { icon: '🏠', title: 'Sanctum Rules', points: ['Worship both the white and black Shivlingas housed in the unique dual sanctum', 'Remove footwear at temple entrance stairs before entering inner shrine'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Swimming in deep sea near rocky cliff without guards', 'Footwear inside main double-linga sanctum', 'Alcohol and non-vegetarian items in coastal zone', 'Littering packaging materials on sea beach'], prohibitedItems: ['Deep Sea Swimming without Guards', 'Footwear in Dual Sanctum', 'Alcohol & Non-Veg Items', 'Littering Sea Beach'] },
    ],
  },
  {
    id: 'mayureshwar_morgaon',
    condition: { any: ['mayureshwar', 'moreshwar', 'morgaon', 'morgaon ganesha'] },
    guidelines: [
      { icon: '👔', title: 'Dress Code & Sanctity', points: ['Traditional Indian attire recommended (Dhoti/Kurta for men, Saree/Salwar for women)', 'Leather belts, wallets, and shoes must be removed before entering fortress sanctum'] },
      { icon: '🙏', title: 'Sacred Circuit Order', points: ['As per Ashtavinayaka tradition, devotees must first pay respects to Nagna Bhairava shrine on left', 'Pray to Mayureshwar, then offer prayers at Sakshi Vinayaka before exit'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside Garbhagriha (inner sanctum)', 'Footwear inside temple fortress courtyard', 'Alcohol, non-veg, & tobacco products on temple hill'], prohibitedItems: ['Inner Sanctum Photography', 'Footwear inside Courtyard', 'Leather Belts/Wallets near Idol', 'Alcohol & Tobacco'] },
    ],
  },
  {
    id: 'siddhivinayak_siddhatek',
    condition: { any: ['siddhivinayak siddhatek', 'siddhatek', 'siddhatek ganesha'] },
    guidelines: [
      { icon: '⛰️', title: 'Hill Pradakshina Guidelines', points: ['Pradakshina around Siddhatek hillock takes ~30 minutes (about 1 km walk)', 'Mind footing along stone hill path during monsoon season'] },
      { icon: '👔', title: 'Dress Code Rules', points: ['Modest attire expected; avoid shorts or revealing clothes', 'Remove shoes at main gate before ascending temple steps'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside sanctum', 'Footwear inside temple premises', 'Plastic littering along hill Pradakshina route'], prohibitedItems: ['Sanctum Photography', 'Footwear inside Temple', 'Plastic Littering on Hill'] },
    ],
  },
  {
    id: 'ballaleshwar_pali',
    condition: { any: ['ballaleshwar', 'pali ganesha', 'pali ballaleshwar'] },
    guidelines: [
      { icon: '🔔', title: 'Dhundi Vinayak & Bell Rules', points: ['Devotees must first offer prayers to Dhundi Vinayak shrine located behind the main temple', 'Listen to historic European bell rung during Aarti ceremonies'] },
      { icon: '👔', title: 'Attire & Hygiene', points: ['Clean traditional dress expected', 'Footwear lockers available near entrance gate'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography in inner sanctum', 'Footwear in Sabhamandap', 'Leather articles inside core shrine'], prohibitedItems: ['Inner Sanctum Photography', 'Footwear in Sabhamandap', 'Leather Belts/Wallets'] },
    ],
  },
  {
    id: 'varadavinayak_mahad',
    condition: { any: ['varadavinayak', 'mahad ganesha', 'mahad varadavinayak'] },
    guidelines: [
      { icon: '🛕', title: 'Sanctum & Lamp Sanctity', points: ['Respect the historic 130+ year old continuous burning oil lamp (Nanda Deep)', 'Devotees can perform direct Pooja during designated non-crowded morning hours'] },
      { icon: '👔', title: 'Modest Dress Standard', points: ['Men: Dhoti or Kurta/Pants; Women: Saree or Salwar Suits', 'Shorts and sleeveless clothes strictly discouraged'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Mobile photography inside sanctum', 'Leather belts and wallets near deity', 'Footwear inside temple courtyard'], prohibitedItems: ['Mobile Photography in Sanctum', 'Leather Items', 'Footwear'] },
    ],
  },
  {
    id: 'chintamani_theur',
    condition: { any: ['chintamani', 'theur', 'theur chintamani'] },
    guidelines: [
      { icon: '🌊', title: 'River Confluence & Queue Management', points: ['Be cautious near Mula-Mutha river ghats during monsoon high water levels', 'Expect heavy queue during Angarki Sankashti Chaturthi (special queues available)'] },
      { icon: '👔', title: 'Attire & Decorum', points: ['Traditional attire mandatory for Abhishek offering', 'Quiet decorum inside wooden Sabhamandap'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside inner deity room', 'Footwear inside wooden Sabhamandap', 'Littering along riverbank ghats'], prohibitedItems: ['Deity Photography', 'Footwear inside Sabhamandap', 'Littering River Ghats'] },
    ],
  },
  {
    id: 'girijatmaj_lenyadri',
    condition: { any: ['girijatmaj', 'lenyadri', 'lenyadri ganesha'] },
    guidelines: [
      { icon: '🧗', title: 'Cave Mountain Climb Rules', points: ['Requires climbing 307 stone steps up Lenyadri mountain cave', 'Doli (palanquin) services available at base for elderly devotees', 'Monkey warning: Keep food items, prasad bags, and spectacles safely inside backpacks'] },
      { icon: '👔', title: 'Cave Attire & ASI Protocol', points: ['Comfortable walking shoes recommended for mountain steps; remove shoes outside cave entrance', 'ASI rules apply; do not carve or deface cave walls'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Defacing or carving ancient cave walls', 'Flash photography inside Cave 7 sanctum', 'Carrying open food packets (attracts monkeys)', 'Plastic waste dumping on mountain stairs'], prohibitedItems: ['Defacing Cave Walls', 'Flash Photography', 'Open Food Packets (Monkeys)', 'Plastic Waste on Mountain'] },
    ],
  },
  {
    id: 'vighneshwar_ozar',
    condition: { any: ['vighneshwar', 'ozar', 'ojhar', 'ozar ganesha'] },
    guidelines: [
      { icon: '🌊', title: 'Kukadi Riverfront & Deepamala', points: ['Safely enjoy Kukadi riverview promenade', 'Marvel at historic Deepamalas lit up during Kartik Purnima'] },
      { icon: '👔', title: 'Attire Standards', points: ['Dhotis/Kurta or full pants for men; Sarees or Salwar for women', 'Deposit shoes at designated trust counter near main arch'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside main idol enclosure', 'Footwear within gold-plated dome courtyard', 'Leather goods inside inner shrine'], prohibitedItems: ['Sanctum Photography', 'Footwear in Gold Dome Courtyard', 'Leather Goods'] },
    ],
  },
  {
    id: 'mahaganapati_ranjangaon',
    condition: { any: ['mahaganapati', 'ranjangaon', 'ranjangaon ganpati'] },
    guidelines: [
      { icon: '🚗', title: 'Highway Access & Trust Facilities', points: ['Located on Pune-Ahmednagar highway (~50 km from Pune); large parking area available', 'Trust operates Bhakta Niwas guest houses and free prasad distribution'] },
      { icon: '👔', title: 'Sanctum Etiquette', points: ['Remove footwear at main entrance gate', 'Follow queue lines inside broad Sabhamandap'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Sanctum camera & video recording', 'Footwear inside Sabhamandap', 'Alcohol and non-veg items on trust premises'], prohibitedItems: ['Camera & Video Recording', 'Footwear inside Sabhamandap', 'Alcohol & Non-Veg Items'] },
    ],
  },
  {
    id: 'mahalakshmi_mumbai',
    condition: { any: ['mahalakshmi mumbai', 'mahalakshmi temple mumbai', 'mahalaxmi mumbai'] },
    guidelines: [
      { icon: '🌺', title: 'Offerings & Flowers', points: ['Lotus flowers, coconuts, and silk sarees are favored offerings for Goddess Mahalakshmi', 'Flower vendors available along Bhulabhai Desai Road approach steps'] },
      { icon: '👔', title: 'Dress Code & Customs', points: ['Modest attire required (Sarees, Salwar-Kameez, or Dhoti/Pants)', 'Remove footwear at designated shoe stands before entering main gate'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside inner sanctum', 'Footwear beyond shoe counters', 'Leather items (belts, wallets) inside Garbhagriha', 'Large bags & luggage (must be deposited in lockers)'], prohibitedItems: ['Sanctum Photography', 'Footwear in Sanctum', 'Leather Items inside Garbhagriha', 'Large Luggage Bags'] },
    ],
  },
  {
    id: 'mumbadevi_mumbai',
    condition: { any: ['mumbadevi', 'mumba devi', 'mumbadevi temple mumbai'] },
    guidelines: [
      { icon: '🛍️', title: 'Market Crowds & Security', points: ['Located in narrow, bustling Zaveri Bazar lane; plan travel via public transport', 'Keep personal belongings, wallets, and mobiles safe in crowded queue lines'] },
      { icon: '👔', title: 'Attire Standards', points: ['Traditional Hindu or modest clothing', 'Footwear must be removed at official trust counters outside temple alley'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside sanctum', 'Footwear', 'Leather goods inside inner hall', 'Electronic gadgets during peak festivals'], prohibitedItems: ['Sanctum Photography', 'Footwear', 'Leather Goods', 'Electronics during Peak Hours'] },
    ],
  },
  {
    id: 'naina_devi_nainital',
    condition: { any: ['naina devi', 'nainadevi nainital', 'naina devi temple'] },
    guidelines: [
      { icon: '⛵', title: 'Lakefront Etiquette', points: ['Shrine located at northern end of Naini Lake (Mallital)', 'Combine visit with boat rides or lakeside promenade walk; maintain lake cleanliness'] },
      { icon: '👔', title: 'Attire & Shoe Deposit', points: ['Modest clothing appropriate for hill climate', 'Footwear counters available at temple lake-gate entrance'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Sanctum photography', 'Throwing garbage or plastic into Naini Lake', 'Leather belts & items near deity', 'Smoking or tobacco on temple premises'], prohibitedItems: ['Sanctum Photography', 'Plastic/Littering in Lake', 'Leather Items', 'Smoking/Tobacco'] },
    ],
  },
  {
    id: 'dhari_devi_uttarakhand',
    condition: { any: ['dhari devi', 'dharidevi', 'dhari devi temple'] },
    guidelines: [
      { icon: '🌊', title: 'River Platform Safety', points: ['Temple built on Alaknanda River platform; adhere to safety railings and walk carefully on wet steps', 'Do not attempt to dip into swift Alaknanda river currents outside designated ghats'] },
      { icon: '👔', title: 'Attire & Customs', points: ['Traditional attire for offerings', 'Remove shoes before crossing the river platform gate'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography of main deity', 'Footwear on river platform', 'Plastic dumping in Alaknanda River', 'Alcohol or non-veg in surrounding village area'], prohibitedItems: ['Deity Photography', 'Footwear on Platform', 'Plastic in River', 'Alcohol & Non-Veg'] },
    ],
  },
  {
    id: 'kasar_devi_almora',
    condition: { any: ['kasar devi', 'kasardevi', 'kasar devi temple'] },
    guidelines: [
      { icon: '🧘', title: 'Meditation & Geomagnetic Zone', points: ['Geomagnetic field creates high vibrational energy ideal for quiet meditation', 'Maintain strict silence in the temple garden and courtyard'] },
      { icon: '👔', title: 'Attire & Hill Walk', points: ['Comfortable footwear for hill slope steps', 'Modest warm clothing for mountain winds'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Loud music or noise in meditation zones', 'Sanctum photography', 'Pluck mountain flora or pine branches', 'Smoking and alcohol'], prohibitedItems: ['Loud Noise / Speakers', 'Sanctum Photography', 'Plucking Flora', 'Smoking & Alcohol'] },
    ],
  },
  {
    id: 'purnagiri_champawat',
    condition: { any: ['purnagiri', 'purnagiri temple', 'punyagiri champawat'] },
    guidelines: [
      { icon: '🏔️', title: 'Trek & Altitude Precautions', points: ['Requires a steep ~3 km uphill trek from Tunyas (palanquins/dolis available)', 'Hydrate well and wear sturdy walking shoes during the mountain climb'] },
      { icon: '👔', title: 'Attire & Weather Gear', points: ['Layered clothing suited for mountain winds', 'Traditional attire preferred for darshan'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside hilltop sanctum', 'Polythene bags (strictly regulated on hill trek)', 'Alcohol, meat, or intoxication on pilgrimage path', 'Leaving litter along mountain track'], prohibitedItems: ['Sanctum Photography', 'Single-Use Plastics', 'Alcohol & Meat', 'Littering Mountain Track'] },
    ],
  },
  {
    id: 'hidimba_devi_manali',
    condition: { any: ['hidimba devi', 'hadimba temple', 'hidimba manali'] },
    guidelines: [
      { icon: '🌲', title: 'Forest & Wildlife Respect', points: ['Temple nestled in Dhungri Van Vihar forest; respect wildlife and ancient cedar trees', 'Angora rabbits and Yaks available outside for photos (official photography vendors)'] },
      { icon: '👔', title: 'Cave Sanctum Rules', points: ['Remove shoes outside temple wooden entrance', 'Mind your head at low wooden carved doorways'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside rock cave sanctum', 'Footwear inside wooden temple structure', 'Carving names on cedar trees or wooden pillars', 'Plastic dumping in forest grounds'], prohibitedItems: ['Cave Sanctum Photography', 'Footwear inside Wooden Structure', 'Defacing Cedar Trees', 'Plastic Waste in Forest'] },
    ],
  },
  {
    id: 'kalika_mata_pavagadh',
    condition: { any: ['kalika mata pavagadh', 'pavagadh mahakali', 'kalika mata temple'] },
    guidelines: [
      { icon: '🚡', title: 'Ropeway & Hill Climb', points: ['Pavagadh Ropeway saves 2,000 steps climb; buy round-trip tickets early to avoid peak queues', 'Walk gently along final 250 steps leading from ropeway upper station to temple golden spire'] },
      { icon: '👔', title: 'Attire & Sanctum Etiquette', points: ['Traditional Gujarati attire (Chaniya Choli / Kurta) or modest clothing', 'Remove shoes at shoe counters at the hill-top terrace'] },
      { icon: '📵', title: 'Prohibited Items', points: ['Photography inside main Mahakali sanctum', 'Footwear on golden spire terrace', 'Alcohol & non-vegetarian food in entire Pavagadh hill area', 'Plastics on hill track'], prohibitedItems: ['Sanctum Photography', 'Footwear on Terrace', 'Alcohol & Non-Veg', 'Plastic Waste on Hill'] },
    ],
  },
];






