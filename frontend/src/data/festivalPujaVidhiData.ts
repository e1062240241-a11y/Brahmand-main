export interface PujaVidhiStep {
  step: number;
  title: string;
  desc: string;
  icon?: string;
}

export interface PujaVidhiData {
  title: string;
  items: string[];
  steps: PujaVidhiStep[];
  note?: string;
}

export const FESTIVAL_PUJA_VIDHIS: Record<string, PujaVidhiData> = {
  diwali: {
    title: 'Maa Lakshmi & Lord Ganesha Diwali Puja Vidhi',
    items: [
      '🪔 Clay Diyas, Ghee/Oil & Cotton Wicks',
      '🌸 Marigold Flowers & Rangoli Colors',
      '🔱 Lakshmi-Ganesh Idol or Photo',
      '🪙 Gold/Silver Coins & Clean Thali',
      '🍯 Sweets (Kaju Katli, Motichoor Ladoo)',
      '🥛 Milk, Honey, Gangajal & Akshat (Rice)',
      '🥭 Mango Leaves, Kalash & Coconut',
      '📜 Roli, Chandan & Kumkum',
    ],
    steps: [
      { step: 1, title: 'Clean & Sanctify Altar', desc: 'Clean the home, draw vibrant Rangoli at the entrance, and set up a sacred altar covered with a fresh red cloth.', icon: 'sparkles' },
      { step: 2, title: 'Kalash Sthapana', desc: 'Place a copper Kalash filled with Gangajal, place 5 mango leaves, and top with a coconut wrapped in red thread.', icon: 'flower' },
      { step: 3, title: 'Install Idols', desc: 'Place Goddess Lakshmi on the right and Lord Ganesha on the left. Offer fresh marigold & lotus garlands.', icon: 'ribbon' },
      { step: 4, title: 'Panchamrit Abhishek & Offerings', desc: 'Bathe idols with Gangajal and Panchamrit while chanting "Om Shreem Mahalakshmiyei Namah". Apply Roli tilak and offer sweets.', icon: 'water' },
      { step: 5, title: 'Light Main Akhand Diya', desc: 'Light the main four-wick Ghee Diya in front of Lakshmi-Ganesh, offering new coins and account books for prosperity.', icon: 'flame' },
      { step: 6, title: 'Aarti & Illumination', desc: 'Perform Lakshmi-Ganesha Aarti, distribute Prasad to all family members, and illuminate all doors and windows with lit diyas.', icon: 'sunny' },
    ],
    note: 'Note for Devotees: Keep a main ghee diya (Akhand Jot) burning throughout Diwali night for divine prosperity.',
  },
  deepavali: {
    title: 'Maa Lakshmi & Lord Ganesha Diwali Puja Vidhi',
    items: [
      '🪔 Clay Diyas, Ghee/Oil & Cotton Wicks',
      '🌸 Marigold Flowers & Rangoli Colors',
      '🔱 Lakshmi-Ganesh Idol or Photo',
      '🪙 Gold/Silver Coins & Clean Thali',
      '🍯 Sweets (Kaju Katli, Motichoor Ladoo)',
      '🥛 Milk, Honey, Gangajal & Akshat (Rice)',
      '🥭 Mango Leaves, Kalash & Coconut',
      '📜 Roli, Chandan & Kumkum',
    ],
    steps: [
      { step: 1, title: 'Clean & Sanctify Altar', desc: 'Clean the home, draw vibrant Rangoli at the entrance, and set up a sacred altar covered with a fresh red cloth.', icon: 'sparkles' },
      { step: 2, title: 'Kalash Sthapana', desc: 'Place a copper Kalash filled with Gangajal, place 5 mango leaves, and top with a coconut wrapped in red thread.', icon: 'flower' },
      { step: 3, title: 'Install Idols', desc: 'Place Goddess Lakshmi on the right and Lord Ganesha on the left. Offer fresh marigold & lotus garlands.', icon: 'ribbon' },
      { step: 4, title: 'Panchamrit Abhishek & Offerings', desc: 'Bathe idols with Gangajal and Panchamrit while chanting "Om Shreem Mahalakshmiyei Namah". Apply Roli tilak and offer sweets.', icon: 'water' },
      { step: 5, title: 'Light Main Akhand Diya', desc: 'Light the main four-wick Ghee Diya in front of Lakshmi-Ganesh, offering new coins and account books for prosperity.', icon: 'flame' },
      { step: 6, title: 'Aarti & Illumination', desc: 'Perform Lakshmi-Ganesha Aarti, distribute Prasad to all family members, and illuminate all doors and windows with lit diyas.', icon: 'sunny' },
    ],
    note: 'Note for Devotees: Keep a main ghee diya (Akhand Jot) burning throughout Diwali night for divine prosperity.',
  },
  holi: {
    title: 'Holika Dahan & Rangwali Holi Vidhi',
    items: [
      '🔥 Dry Wood & Cow Dung Cakes (Gulari)',
      '🌾 Wheat Crop Spikes & Akshat (Rice)',
      '🧵 Raw Cotton Thread (Kacha Sutra)',
      '💧 Water Pot (Lota) & Gangajal',
      '🎨 Organic Gulal & Abir (Colors)',
      '🍯 Thandai, Gujiya & Malpua',
      '🌸 Flowers, Roli & Turmeric',
    ],
    steps: [
      { step: 1, title: 'Prepare Holika Altar', desc: 'Gather at the community bonfire site with dry wood and gulari effigies of Holika and Prahlad.', icon: 'bonfire' },
      { step: 2, title: 'Wrap Sacred Thread', desc: 'Circle the Holika pyre 3 or 7 times while wrapping raw cotton thread around it with prayers.', icon: 'repeat' },
      { step: 3, title: 'Water & Crop Offering', desc: 'Offer water, akshat, and flowers, then roast fresh green wheat crop spikes in the sacred fire.', icon: 'leaf' },
      { step: 4, title: 'Holika Dahan Arghya', desc: 'Light the bonfire celebrating Prahlad’s devotion and Lord Narsimha’s divine protection.', icon: 'flame' },
      { step: 5, title: 'Holika Bhasma & Gulal', desc: 'Apply sacred ash from the Holika bonfire on foreheads, followed by colorful Gulal on elders’ feet.', icon: 'color-palette' },
      { step: 6, title: 'Festive Feast', desc: 'Share Thandai, Gujiya, and festive sweets with family and neighbors in joyful harmony.', icon: 'happy' },
    ],
    note: 'Note for Devotees: Holika Dahan sacred ash applied on the forehead brings health and protects against negative energies.',
  },
  ganesh_chaturthi: {
    title: 'Shri Ganesh Chaturthi Sthapana & Puja Vidhi',
    items: [
      '🐘 Clay Lord Ganesha Idol',
      '🌱 Fresh Durva Grass (21 blades)',
      '🌺 Red Hibiscus Flowers & Garlands',
      '🪔 Ghee Diya, Incense & Camphor',
      '🍯 Modak (21 count) & Motichoor Ladoo',
      '🥥 Coconut, Betel Leaves & Nuts',
      '🥛 Gangajal, Milk & Panchamrit',
      '🔴 Red Chandan & Kumkum',
    ],
    steps: [
      { step: 1, title: 'Prana Pratishtha', desc: 'Install the clay Ganesha idol on a raised chowki covered with red cloth; invoke life into the idol with Vedic mantras.', icon: 'sparkles' },
      { step: 2, title: 'Panchamrit Abhishek', desc: 'Perform ceremonial bath with Gangajal, milk, curd, honey, ghee, and rose water while chanting Ganesha mantras.', icon: 'water' },
      { step: 3, title: 'Durva & Hibiscus Offering', desc: 'Offer 21 pairs of green Durva grass blades and red hibiscus flowers directly at Bappa’s feet.', icon: 'flower' },
      { step: 4, title: 'Chandan & Modak Offering', desc: 'Apply red sandalwood paste tilak and offer 21 freshly prepared Modaks (Ganesha’s favorite sweet).', icon: 'nutrition' },
      { step: 5, title: 'Recite Atharvashirsha', desc: 'Chant Ganesh Atharvashirsha or "Om Gam Ganapataye Namaha" 108 times on a Rudraksha mala.', icon: 'book' },
      { step: 6, title: 'Aarti & Prasad Distribution', desc: 'Perform "Sukhakarta Dukhaharta" Aarti with camphor & ghee diya, distributing Modak prasad to all.', icon: 'flame' },
    ],
    note: 'Note for Devotees: Always offer 21 blades of Durva grass in pairs for Lord Ganesha to receive quick blessings.',
  },
  navratri: {
    title: 'Sharad / Chaitra Navratri Ghatasthapana & Puja Vidhi',
    items: [
      '🏺 Earthen Pot (Kalash) & Barley Seeds (Jowar)',
      '🔱 Maa Durga Idol / Picture',
      '🌺 Red Chunri, Flowers & Garland',
      '🪔 Ghee Diya & Dhoop (Incense)',
      '🥥 Coconut, Mango Leaves & Akshat',
      '🍯 Sabudana Khichdi, Kheer & Fruits',
      '📜 Durga Saptashati Book & Roli',
      '💄 Shringar Items (Bangles, Bindi, Vermilion)',
    ],
    steps: [
      { step: 1, title: 'Ghatasthapana', desc: 'Sow barley seeds in soil, place a sacred Kalash with Gangajal, 5 mango leaves, and a coconut wrapped in red chunri.', icon: 'flower' },
      { step: 2, title: 'Adorn Goddess Durga', desc: 'Drape red Chunri on Maa Durga and offer Shringar items including red bangles, bindi, and vermilion.', icon: 'ribbon' },
      { step: 3, title: 'Light Akhand Jyoti', desc: 'Light a ghee lamp (Akhand Jot) intended to burn continuously throughout the 9 sacred nights.', icon: 'flame' },
      { step: 4, title: 'Durga Saptashati Paath', desc: 'Recite Durga Saptashati or chant "Om Aim Hreem Kleem Chamundaye Vichche" 108 times daily.', icon: 'book' },
      { step: 5, title: 'Daily Bhog & Aarti', desc: 'Offer daily sattvic bhog (Kheer, fruits, Halwa) and perform Maa Durga Aarti in morning & evening.', icon: 'musical-notes' },
      { step: 6, title: 'Kanya Pujan (Ashtami/Navami)', desc: 'Worship 9 young girls (Kanjaks), wash their feet, offer Halwa-Puri & gifts, and seek their divine blessings.', icon: 'heart' },
    ],
    note: 'Note for Devotees: If full 9-day fasting is difficult, observing fast on first (Prathama) and last (Ashtami/Navami) days grants full merits.',
  },
  janmashtami: {
    title: 'Shri Krishna Janmashtami Midnight Puja Vidhi',
    items: [
      '🦚 Laddu Gopal / Krishna Idol & Swing (Jhula)',
      '🧈 Fresh White Butter (Makhan) & Mishri',
      '🥛 Panchamrit (Milk, Curd, Ghee, Honey, Sugar)',
      '🌿 Tulsi Leaves & Yellow Clothes (Pitambar)',
      '🪔 Ghee Diya & Incense Sticks',
      '🌸 Yellow Flowers (Marigold, Jasmine)',
      '🥥 Dhaniya Panjiri & Sweets',
      '📜 Flute (Bansuri) & Peacock Feather',
    ],
    steps: [
      { step: 1, title: 'Decorate the Jhula', desc: 'Clean & decorate a small wooden/velvet swing (Jhula) with fresh marigolds, peacock feathers, and silk ribbons.', icon: 'sparkles' },
      { step: 2, title: 'Midnight Abhishekam', desc: 'At 12:00 AM midnight, bathe Laddu Gopal with Panchamrit, Gangajal, and scented rose water.', icon: 'water' },
      { step: 3, title: 'Dress in Pitambar', desc: 'Wipe Gopal softly, dress him in bright yellow silk clothes, crown him with a peacock feather & mini flute.', icon: 'shirt' },
      { step: 4, title: 'Offer Makhan Mishri', desc: 'Offer fresh homemade white butter (Makhan) mixed with Mishri sugar crystals and sacred Tulsi leaves.', icon: 'nutrition' },
      { step: 5, title: 'Swing Laddu Gopal', desc: 'Place Gopal in the Jhula and gently swing him while chanting "Hare Krishna Hare Rama" or singing bhajans.', icon: 'heart' },
      { step: 6, title: 'Aarti & Fast Break', desc: 'Perform midnight Aarti with ghee diya & camphor, distribute coriander Panjiri prasad, and break fast.', icon: 'flame' },
    ],
    note: 'Note for Devotees: Tulsi leaves are mandatory for Krishna bhog; Krishna does not accept offerings without Tulsi.',
  },
  maha_shivratri: {
    title: 'Maha Shivratri Abhishekam & Prahar Puja Vidhi',
    items: [
      '🕉 Shiva Lingam / Picture',
      '🍃 Bel Leaves (Bilva Patra) & Dhatura',
      '🥛 Milk, Curd, Ghee, Honey & Sugar (Panchamrit)',
      '💧 Gangajal & Rose Water',
      '🪵 Bhasma (Sacred Ash) & Sandalwood Paste',
      '🪔 Ghee Diya, Incense & Camphor',
      '🌺 Kaner Flowers & Shami Leaves',
      '🍯 Fruits, Thandai & Makhana Kheer',
    ],
    steps: [
      { step: 1, title: 'Maha Abhishekam', desc: 'Bathe the Shiva Lingam sequentially with Gangajal, milk, curd, honey, ghee, and sugarcane juice.', icon: 'water' },
      { step: 2, title: 'Apply Bhasma & Chandan', desc: 'Smear sacred ash (Bhasma) and white sandalwood paste in a three-line Tripundra pattern on the Lingam.', icon: 'sparkles' },
      { step: 3, title: 'Offer Bel Leaves & Dhatura', desc: 'Offer 3-leaf Bilva Patra (smooth side facing Lingam), Dhatura fruit, Kaner flowers, and Shami leaves.', icon: 'leaf' },
      { step: 4, title: 'Chant Mahamrityunjaya', desc: 'Chant "Om Namah Shivaya" or Mahamrityunjaya Mantra 108 times using a Rudraksha mala.', icon: 'book' },
      { step: 5, title: 'Night Vigil (Prahar Puja)', desc: 'Stay awake through the night performing 4 Prahar pujas with continuous Shiv-kirtan and meditation.', icon: 'moon' },
      { step: 6, title: 'Aarti & Parana', desc: 'Perform Shiv Aarti with camphor flame, offer fruits & Thandai bhog, and break fast the following morning.', icon: 'flame' },
    ],
    note: 'Note for Devotees: Always offer 3-intact-leaf Bel Patra without any torn edges to Lord Shiva for maximum blessings.',
  },
  ram_navami: {
    title: 'Shri Ram Navami Noon Birth & Puja Vidhi',
    items: [
      '🏹 Shri Ram, Sita, Lakshman & Hanuman Idol/Photo',
      '🌸 Fresh Tulsi Leaves & Lotus Flowers',
      '🥛 Panchamrit, Gangajal & Rose Water',
      '🪔 Ghee Diya & Incense',
      '🍯 Panjiri, Kheer, Panchamrit & Fruits',
      '📜 Ramcharitmanas / Ram Raksha Stotra',
      '🔴 Chandan, Roli & Yellow Attire',
    ],
    steps: [
      { step: 1, title: 'Prepare Noon Altar', desc: 'Clean the puja space and decorate with yellow drapes and flowers for Lord Rama’s birth at 12:00 PM noon.', icon: 'sparkles' },
      { step: 2, title: 'Panchamrit Abhishekam', desc: 'Perform ceremonial bath for Lord Rama with Panchamrit, rose water, and sacred Gangajal.', icon: 'water' },
      { step: 3, title: 'Adorn in Yellow Silk', desc: 'Dress Lord Rama in yellow silk robes and offer a garland of fresh Tulsi leaves and yellow flowers.', icon: 'ribbon' },
      { step: 4, title: 'Recite Ramcharitmanas', desc: 'Recite Ramcharitmanas (Bal Kand - Ram Janma prasang) or chant Ram Raksha Stotra.', icon: 'book' },
      { step: 5, title: 'Offer Dhaniya Panjiri', desc: 'Offer coriander-jaggery Panjiri, Panchamrit, fruits, and Kheer as sacred bhog.', icon: 'nutrition' },
      { step: 6, title: 'Aarti & Chanting', desc: 'Perform Shri Ram Aarti at noon while chanting "Shri Ram Jai Ram Jai Jai Ram" and distribute prasad.', icon: 'flame' },
    ],
    note: 'Note for Devotees: Lord Rama’s birth is celebrated precisely at 12:00 PM noon (Abhijit Muhurat).',
  },
  dussehra: {
    title: 'Vijayadashami / Dussehra Shami & Weapon Puja Vidhi',
    items: [
      '🏹 Shri Rama & Maa Durga Photo/Idol',
      '🍃 Shami Tree Leaves (Gold Leaves)',
      '🪔 Ghee Diya & Incense',
      '🌺 Marigold Flowers & Garlands',
      '📜 Vehicles, Tools & Books for Pujan',
      '🍯 Jalebi, Fafda, Sweets & Fruits',
      '🔴 Kumkum, Akshat & Chandan',
    ],
    steps: [
      { step: 1, title: 'Astra & Vidya Pujan', desc: 'Clean and worship daily tools, vehicles, books, and instruments with kumkum tilak & marigold garlands.', icon: 'build' },
      { step: 2, title: 'Shami Tree Worship', desc: 'Offer water, kumkum, and flowers to the Shami tree, symbolizing victory and celestial prosperity.', icon: 'leaf' },
      { step: 3, title: 'Rama Victory Prayers', desc: 'Offer prayers to Lord Rama for slaying Ravana and establishing the triumph of Dharma over evil.', icon: 'ribbon' },
      { step: 4, title: 'Exchange Shami "Gold"', desc: 'Exchange Shami leaves with elders and family members as symbolic gold, seeking their blessings.', icon: 'heart' },
      { step: 5, title: 'Ramlila & Effigy Watch', desc: 'Attend Ramlila or witness Ravana effigy burning, pledging to eliminate ten inner vices.', icon: 'flame' },
      { step: 6, title: 'Festive Feast', desc: 'Share Jalebi, Fafda, and traditional sweets with family celebrating righteousness and success.', icon: 'happy' },
    ],
    note: 'Note for Devotees: Buying new vehicles, property, or starting new projects on Vijayadashami brings eternal success.',
  },
  raksha_bandhan: {
    title: 'Raksha Bandhan Sibling Protection & Puja Vidhi',
    items: [
      '🧵 Decorative Rakhis & Raw Silk Thread',
      '🔴 Roli (Kumkum), Akshat (Unbroken Rice)',
      '🪔 Ghee Diya & Aarti Thali',
      '🍯 Sweets (Ghevar, Kaju Katli, Ladoo)',
      '🎁 Gifts for Sister / Brother',
      '🥛 Clean Water Lota & Hand Cloth',
    ],
    steps: [
      { step: 1, title: 'Prepare Aarti Thali', desc: 'Decorate a brass thali with Roli, Akshat, Rakhi threads, lit Ghee Diya, and fresh sweets.', icon: 'sparkles' },
      { step: 2, title: 'Apply Roli-Akshat Tilak', desc: 'Sister applies Roli-Kumkum tilak on brother’s forehead and sticks unbroken rice grains (Akshat).', icon: 'color-wand' },
      { step: 3, title: 'Tie the Sacred Rakhi', desc: 'Sister ties the Rakhi thread around brother’s right wrist while chanting protection mantras.', icon: 'ribbon' },
      { step: 4, title: 'Perform Aarti', desc: 'Sister rotates the lit Aarti thali before her brother, praying for his long health, prosperity, & safety.', icon: 'flame' },
      { step: 5, title: 'Exchange Sweets', desc: 'Sister feeds sweet to brother, and brother feeds sweet in return with heartfelt affection.', icon: 'heart' },
      { step: 6, title: 'Give Vow & Gifts', desc: 'Brother pledges lifelong protection & support, presenting a loving gift to his sister.', icon: 'gift' },
    ],
    note: 'Note for Devotees: Avoid tying Rakhi during Bhadra Kaal period; tie Rakhi during auspicious Shubh/Labh Choghadiya.',
  },
  makar_sankranti: {
    title: 'Surya Dev Makar Sankranti & Til-Gud Vidhi',
    items: [
      '🪁 Kites & Thread (Manjha)',
      '🌾 Til (Sesame Seeds) & Jaggery (Gud)',
      '🍚 Harvest Rice, Milk & Moong Dal (Khichdi)',
      '🪔 Ghee Diya & Water Lota',
      '🌅 Surya Dev Photo / Idol',
      '🥭 Sugarcane & Seasonal Vegetables',
      '🔴 Kumkum, Flowers & Akshat',
    ],
    steps: [
      { step: 1, title: 'Holy Bath & Surya Arghya', desc: 'Take an early morning bath and offer water (Arghya) with red flowers & sesame seeds to Surya Dev.', icon: 'sunny' },
      { step: 2, title: 'Prepare Til-Gud Ladoo', desc: 'Make or arrange sesame-jaggery sweets (Til Ladoo, Rewri, Gajak) representing warmth and unity.', icon: 'nutrition' },
      { step: 3, title: 'Cook Sacred Khichdi', desc: 'Prepare fresh rice-lentil Khichdi made with cow ghee, ginger, and new seasonal harvest grains.', icon: 'restaurant' },
      { step: 4, title: 'Surya Bhog Offering', desc: 'Offer Khichdi, sugarcane, and Til-Gud to Lord Surya, expressing gratitude for the harvest.', icon: 'leaf' },
      { step: 5, title: 'Charity (Dan)', desc: 'Donate blankets, sesame, khichdi grains, and warm clothes to the needy for spiritual merit.', icon: 'heart' },
      { step: 6, title: 'Kite Flying & Feast', desc: 'Fly colorful kites with family, share "Til-Gul ghya, god god bola" sweets with loved ones.', icon: 'happy' },
    ],
    note: 'Note for Devotees: Taking a bath in sacred rivers (Ganges, Yamuna) on Makar Sankranti cleanses all karmic sins.',
  },
  karwa_chauth: {
    title: 'Karwa Chauth Fasting & Moon Sighting Vidhi',
    items: [
      '🏺 Clay Pot (Karwa) with Spout & Sugar/Water',
      '🌕 Sieve (Chhani) & Ghee Diya',
      '🔴 Red Saree/Lehenga & Solah Shringar',
      '🪔 Puja Thali, Roli, Akshat & Mathri',
      '🖼 Karwa Chauth Mata Story Picture',
      '🥛 Milk, Water & Sweets for Sargi/Arghya',
      '🎁 Baya / Gifts for Mother-in-Law',
    ],
    steps: [
      { step: 1, title: 'Pre-dawn Sargi', desc: 'Eat nutritious Sargi (sweet mathri, nuts, fruits) given by mother-in-law before sunrise.', icon: 'restaurant' },
      { step: 2, title: 'Observe Nirjala Vrat', desc: 'Fast without food or water all day while dressing in festive red attire & Solah Shringar.', icon: 'heart' },
      { step: 3, title: 'Kathaa & Karwa Exchange', desc: 'Gather with married women in the evening, listen to Karwa Chauth Katha & rotate Karwas 7 times.', icon: 'people' },
      { step: 4, title: 'Moon Sighting', desc: 'When the moon rises, view the moon through a sieve (Chhani) with a lit ghee diya placed inside.', icon: 'moon' },
      { step: 5, title: 'Offer Moon Arghya', desc: 'Offer water to Chandra Dev using the Karwa spout while praying for husband’s long life & happiness.', icon: 'water' },
      { step: 6, title: 'Break Fast', desc: 'Husband offers water and the first bite of sweet to his wife, breaking her daylong fast with love.', icon: 'wine' },
    ],
    note: 'Note for Devotees: Always seek blessings of mother-in-law by presenting the Baya thali after the evening Puja.',
  },
  hanuman_jayanti: {
    title: 'Shri Hanuman Jayanti Sindoor & Chola Vidhi',
    items: [
      '🐒 Lord Hanuman Idol / Picture',
      '🟠 Orange Sindoor & Chameli (Jasmine) Oil',
      '🌺 Red Hibiscus / Marigold Flowers & Garland',
      '🪔 Ghee Diya & Incense',
      '🍯 Boondi Ladoo, Imarti & Banarasi Paan',
      '📜 Hanuman Chalisa & Bajrang Baan Book',
      '💧 Gangajal, Water & Tulsi Leaves',
    ],
    steps: [
      { step: 1, title: 'Clean & Prepare Altar', desc: 'Clean the puja altar and place Lord Hanuman’s idol on a bright saffron chowki.', icon: 'sparkles' },
      { step: 2, title: 'Offer Sindoor Chola', desc: 'Apply orange Sindoor mixed with Jasmine oil (Chola offering) to Lord Hanuman’s idol.', icon: 'color-palette' },
      { step: 3, title: 'Tulsi & Flower Garland', desc: 'Offer red flowers, marigold garlands, and a sacred garland made of 108 Tulsi leaves.', icon: 'flower' },
      { step: 4, title: 'Recite Hanuman Chalisa', desc: 'Recite Hanuman Chalisa 7 or 11 times, or read Sundarkand with deep devotion.', icon: 'book' },
      { step: 5, title: 'Bhog Offering', desc: 'Offer Boondi Ladoo, Imarti, bananas, and a sweet Banarasi Paan to Mahavir Hanuman.', icon: 'nutrition' },
      { step: 6, title: 'Aarti & Sindoor Tilak', desc: 'Perform Hanuman Aarti, apply Sindoor tilak on forehead for strength, courage & protection.', icon: 'flame' },
    ],
    note: 'Note for Devotees: Offering Jasmine oil with orange Sindoor (Chola) pleases Lord Hanuman instantly.',
  },
  chhath_puja: {
    title: 'Chhath Puja Surya & Chhathi Maiya Arghya Vidhi',
    items: [
      '🧺 Bamboo Basket (Soop & Daura)',
      '🌾 Fresh Whole Wheat, Jaggery & Ghee (Thekua)',
      '🌅 Sugarcane with leaves, Coconut & Banana',
      '💧 Water Body (River / Pond / Clean Pool)',
      '🪔 Clay Diyas & Camphor',
      '🔴 Roli, Chandan, Yellow Vermilion (Sindoor)',
      '🥭 Seasonal Fruits (Radish, Grapefruit, Ginger plant)',
    ],
    steps: [
      { step: 1, title: 'Nahay Khay (Day 1)', desc: 'Take a sacred bath, clean the entire home, and cook a pure sattvic meal of bottle gourd & rice in ghee.', icon: 'water' },
      { step: 2, title: 'Kharna (Day 2)', desc: 'Observe all-day fast; in the evening, cook jaggery kheer & Roti on wood stove, offer to Chhathi Maiya & break fast.', icon: 'flame' },
      { step: 3, title: 'Prepare Thekua Prasad', desc: 'Prepare traditional Thekua (wheat flour & jaggery cookies in ghee) under strict purity for the Arghya.', icon: 'restaurant' },
      { step: 4, title: 'Sandhya Arghya (Day 3)', desc: 'Carry bamboo Soop filled with fruits & Thekua to the river bank; stand waist-deep in water to offer Arghya to the setting sun.', icon: 'sunny' },
      { step: 5, title: 'Usha Arghya (Day 4)', desc: 'Return before dawn to the riverbank; offer morning Arghya to the rising sun with prayers for family health.', icon: 'partly-sunny' },
      { step: 6, title: 'Parana & Prasad', desc: 'Drink raw milk & water at the riverbank to complete the 36-hour Nirjala fast, distributing sacred Thekua prasad.', icon: 'heart' },
    ],
    note: 'Note for Devotees: Chhath Puja is observed with extreme purity; all prasad is cooked on clay/wood stoves.',
  },
  nag_panchami: {
    title: 'Nag Panchami Serpent Worship Vidhi',
    items: [
      '🐍 Nag Devta (Serpent) Picture/Idol or Clay Model',
      '🥛 Fresh Cow Milk & Milk Kheer',
      '🌺 Yellow Flowers, Durva Grass & Akshat',
      '🪔 Ghee Diya & Incense',
      '🍯 Roasted Paddy (Lava) & Sweets',
      '🔴 Sandalwood Paste & Kumkum',
    ],
    steps: [
      { step: 1, title: 'Altar Setup', desc: 'Draw serpent figures at the home entrance using turmeric/sandalwood or set up Nag Devta idol.', icon: 'sparkles' },
      { step: 2, title: 'Abhishek with Milk', desc: 'Offer fresh cow milk, Gangajal, and Panchamrit bath to Nag Devta with devotion.', icon: 'water' },
      { step: 3, title: 'Offer Lava & Flowers', desc: 'Offer roasted paddy (Lava), yellow flowers, and green Durva grass to serpent deities.', icon: 'flower' },
      { step: 4, title: 'Apply Chandan Tilak', desc: 'Apply sandalwood paste and kumkum to the serpent deity while chanting "Om Nagdevataye Namah".', icon: 'color-palette' },
      { step: 5, title: 'Chant Serpent Mantras', desc: 'Recite Nag Stotram or chant the names of 9 sacred serpents (Ananta, Vasuki, Shesha, etc.).', icon: 'book' },
      { step: 6, title: 'Aarti & Prasad', desc: 'Perform Aarti, distribute milk kheer prasad, and pray for protection from snake bites and Rahu-Ketu dosha.', icon: 'flame' },
    ],
    note: 'Note for Devotees: Digging or plowing earth is traditionally prohibited on Nag Panchami day.',
  },
  teej: {
    title: 'Hariyali / Kajari Teej Shiva-Parvati Puja Vidhi',
    items: [
      '🌸 Fresh flowers & bel leaves',
      '👗 Green saree or red attire',
      '💚 Green glass bangles & mehndi',
      '🔱 Shiva-Parvati idol/picture',
      '🪔 Ghee diya & incense sticks',
      '🍯 Sweets (Ghevar / Kheer)',
      '🥛 Milk, honey & Gangajal',
      '🥭 Fresh seasonal fruits',
    ],
    steps: [
      { step: 1, title: 'Clean & Decorate', desc: 'Clean the puja room, adorn the altar with fresh flowers and light a ghee diya.', icon: 'sparkles' },
      { step: 2, title: 'Adorn Yourself', desc: 'Wear green/red attire, put on green glass bangles and apply intricate henna.', icon: 'shirt' },
      { step: 3, title: 'Install Idols', desc: 'Place Shiva-Parvati idols on a clean cloth and perform abhishek with milk & water.', icon: 'flower' },
      { step: 4, title: 'Chant & Offer', desc: 'Offer bel leaves, flowers, and sweets while chanting "Om Umamaheshwarabhyam Namah".', icon: 'musical-notes' },
      { step: 5, title: 'Sing & Swing', desc: 'Join family or neighbors on decorated jhulas (swings) singing Teej folk songs.', icon: 'happy' },
      { step: 6, title: 'Aarti & Fast Break', desc: 'Perform evening aarti, seek elders’ blessings and break your fast with family.', icon: 'flame' },
    ],
    note: 'Note for Beginners: If full Nirjala fast is difficult, you can observe Phalahar (fruit) fast while offering sincere prayers.',
  },
  default: {
    title: 'Sacred Festival Ritual & Puja Vidhi',
    items: [
      '🌸 Fresh flowers & marigold garlands',
      '🪔 Ghee diya & incense sticks (dhoop)',
      '🥛 Milk, honey & sacred Gangajal',
      '🍯 Fresh sweets & seasonal fruits',
      '🥥 Coconut, betel leaves & betel nuts',
      '🔴 Kumkum, Roli & Akshat (unbroken rice)',
    ],
    steps: [
      { step: 1, title: 'Clean & Decorate Altar', desc: 'Clean the home and setup a sacred altar adorned with fresh flowers and decorative rangoli.', icon: 'sparkles' },
      { step: 2, title: 'Light Ghee Diya', desc: 'Light a ghee lamp and dhoop incense to purify the home environment and welcome divine energy.', icon: 'flame' },
      { step: 3, title: 'Perform Abhishek', desc: 'Offer Gangajal, milk, and fresh water to the deity with sincere devotion.', icon: 'water' },
      { step: 4, title: 'Chant Mantras', desc: 'Chant Vedic mantras or "Om Namo Bhagavate Vasudevaya" seeking divine grace and wisdom.', icon: 'book' },
      { step: 5, title: 'Offer Bhog & Prasad', desc: 'Offer fresh fruits, homemade sweets, and coconut as sacred bhog to the Almighty.', icon: 'nutrition' },
      { step: 6, title: 'Aarti & Seek Blessings', desc: 'Perform evening Aarti with camphor flame, share prasad with family, and seek elders’ blessings.', icon: 'heart' },
    ],
    note: 'Note for Devotees: Performing puja with clean heart, devotion, and gratitude brings inner peace and harmony.',
  },
};

export const getFestivalPujaVidhi = (festivalName: string, customData?: any): PujaVidhiData => {
  if (!festivalName) return FESTIVAL_PUJA_VIDHIS.default;

  const normalized = festivalName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Check exact key match first
  if (FESTIVAL_PUJA_VIDHIS[normalized]) {
    return FESTIVAL_PUJA_VIDHIS[normalized];
  }

  // Check substring matches
  for (const [key, value] of Object.entries(FESTIVAL_PUJA_VIDHIS)) {
    if (key !== 'default' && (normalized.includes(key) || key.includes(normalized))) {
      return value;
    }
  }

  // Fallback if custom rituals list provided in festival object
  if (customData?.rituals && Array.isArray(customData.rituals) && customData.rituals.length > 0) {
    return {
      title: `${festivalName} Ritual Guide`,
      items: FESTIVAL_PUJA_VIDHIS.default.items,
      steps: customData.rituals.map((r: string, idx: number) => ({
        step: idx + 1,
        title: `Step ${idx + 1}`,
        desc: r,
        icon: 'sparkles',
      })),
      note: FESTIVAL_PUJA_VIDHIS.default.note,
    };
  }

  return FESTIVAL_PUJA_VIDHIS.default;
};
