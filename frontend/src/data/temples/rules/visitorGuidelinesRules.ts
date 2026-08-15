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
      { icon: '📵', title: 'Mobile & Photography Policy', points: ['Strict Prohibition: Mobile phones & electronic devices banned inside mandir premises', 'Photography permitted outside complex along Gomti Ghat & riverfront', 'Deposit devices in official trust barcode lockers near Gate 56 before entry'] },
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
      { icon: '📵', title: 'Mobile & Security Rules', points: ['Mobile phones allowed in outer complex, strictly banned in inner sanctum', 'Multi-layer security screening with scanner checkpoints', 'Sea-facing photography permitted in outer promenade'] },
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
      { icon: '📵', title: 'Mobile & Electronics Prohibition', points: ['Complete Ban: Mobiles, smartwatches, leather belts & electronic keys banned', 'Multiple security scanning gates with metal detectors', 'Deposit electronics in trust lockers along Ganga Corridor before queue'] },
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
      { icon: '📵', title: 'Mobile & Photography Rules', points: ['Mobile phones allowed in Mahakal Lok corridor, banned in inner mandir', 'No photography permitted during Bhasma Aarti ritual inside sanctum', 'Deposit mobiles in smart barcode counters inside Mahakal Lok'] },
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
      { icon: '📵', title: 'Sanctum Rules', points: ['Mobile phones prohibited inside inner stone sanctum', 'Photography restricted in Garbhagriha, allowed in outer temple yard', 'Basic storage counters available outside main temple entry gate'] },
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
      { icon: '📵', title: 'Mobile & Photography', points: ['Mobile photography banned inside main stone sanctum', 'Photography permitted in outer temple plaza & snow peaks background', 'Network connectivity: BSNL, Jio & Airtel active near temple base'] },
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
      { icon: '📵', title: 'Electronics & Luggage Policy', points: ['Strict Ban: Mobile phones, cameras & electronic items banned inside mandir', 'Free TTD luggage counter: Deposit bags/mobiles at queue complex entry', 'Belongings automatically safely transported to Laddu counter exit desk'] },
      { icon: '👟', title: 'Shoe Counter & Tonsuring', points: ['Free footwear deposit counters at all queue entry points', 'Kalyanakatta: Hair tonsuring facility available 24/7 free of cost', 'Token receipt provided for safe footwear retrieval'] },
      { icon: '♿', title: 'Accessibility & Free Transit', points: ['Free TTD battery cars & free yellow buses operating across Tirumala', 'Wheelchair support & dedicated queue lanes for senior citizens', 'Elevators and ramps throughout Vaikuntam Queue Complex'] },
      { icon: '🚻', title: 'Facilities & Annadanam', points: ['Matrusri Tarigonda Vengamamba Annaprasadam: Free 24/7 unlimited meals', 'Free milk, buttermilk & food served inside queue compartments', 'World famous TTD Laddu Prasadam counters (Tokens attached to tickets)'] },
    ],
  },
];
