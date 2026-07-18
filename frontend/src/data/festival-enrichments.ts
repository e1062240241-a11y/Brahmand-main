// Enriched content for festival section detail pages
// Each key is the festival name (lowercase), values are partial section overrides

interface FestivalEnrichment {
  summary?: string;
  origin?: string;
  purpose?: string;
  importance?: string;
  celebration?: string;
  mantra?: string;
}

const festivalEnrichments: Record<string, FestivalEnrichment> = {
  diwali: {
    summary:
      'Diwali, the Festival of Lights, is one of the most widely celebrated festivals across India and among the Indian diaspora worldwide. Spanning five days, it symbolizes the victory of light over darkness, good over evil, and knowledge over ignorance. The festival is rooted in ancient Hindu traditions and is associated with several mythological events, most notably the return of Lord Rama to Ayodhya after 14 years of exile. Homes, temples, and public spaces are adorned with oil lamps (diyas), candles, and vibrant rangoli patterns. Fireworks light up the night sky, and families gather for feasts, prayers, and the exchange of gifts. Diwali also honors Lakshmi, the goddess of wealth and prosperity, and marks the beginning of a new financial year for many businesses.',
    origin:
      'The origins of Diwali are deeply embedded in Hindu mythology and ancient Indian history. The most widely narrated origin story relates to the epic Ramayana, where Lord Rama, his wife Sita, and brother Lakshmana returned to Ayodhya after defeating the demon king Ravana in Lanka. The people of Ayodhya lit rows of clay lamps to welcome them, and this tradition continues today. In Jain tradition, Diwali marks the day Lord Mahavira attained moksha (liberation). For Sikhs, it commemorates the release of Guru Hargobind from Mughal imprisonment. The festival also has roots in ancient harvest celebrations, as it falls at the end of the Kharif (monsoon) cropping season. Historical texts suggest Diwali has been celebrated for over 2,500 years, with references in ancient Sanskrit literature.',
    purpose:
      'Diwali serves multiple spiritual and cultural purposes. At its core, it is a celebration of the triumph of good over evil and light over darkness. Devotees worship Goddess Lakshmi to invite wealth and prosperity into their homes, while Lord Ganesha is revered as the remover of obstacles. The lighting of diyas symbolizes the inner light that protects from spiritual darkness. Diwali also reinforces family bonds, as relatives travel great distances to celebrate together. It is a time for forgiveness, letting go of past grudges, and starting anew. The festival encourages generosity, as sharing sweets, gifts, and meals with neighbors and the less fortunate is an integral part of the celebrations.',
    importance:
      'Diwali holds immense cultural, spiritual, and social significance across South Asia and beyond. It is a national holiday in India, Nepal, Sri Lanka, Malaysia, Singapore, and several other countries with significant Hindu populations. Economically, Diwali drives one of the largest consumer spending periods in India, boosting retail, gold, and real estate markets. The festival promotes community cohesion through collective celebrations, public events, and charitable activities. For businesses, it marks the start of a new financial year, and account books are traditionally opened afterworshipping Lakshmi. Diwali has also gained global recognition, with landmarks worldwide illuminating in celebration, making it one of the most visible expressions of Indian culture globally.',
    celebration:
      'Diwali is celebrated over five days, each with its own significance. Day one, Dhanteras, involves cleaning homes and purchasing gold or utensils. Day two, Naraka Chaturdashi, commemorates Lord Krishna\'s victory over demon Narakasura with early morning oil baths. Day three, the main Diwali night, features lighting diyas and candles, performing Lakshmi Puja, bursting fireworks, and sharing feasts with family. Day four, Govardhan Puja, celebrates Lord Krishna\'s lifting of Mount Govardhan to protect villagers from Indra\'s rains. Day five, Bhai Dooj, honors the bond between brothers and sisters. Throughout the festival, homes are decorated with rangoli, marigold garlands, and string lights. Sweets like ladoo, barfi, and gulab jamun are prepared and exchanged. Families visit temples, perform aarti, and pray for prosperity and well-being.',
    mantra:
      'The primary Diwali mantra is the Lakshmi mantra: "Om Shreem Mahalakshmiyei Namah" (I bow to the great Goddess Lakshmi). Other important mantras include the Ganesh mantra: "Om Gan Ganapataye Namah" for removing obstacles. The Diwali aarti "Jai Ambe Gauri" is sung in homes across India. The Gayatri Mantra is also chanted for spiritual upliftment. A powerful shloka for Diwali is "Deepak Deepjyoti Parmatma, Jyoti Swaroopam Shivoham" — I am the divine light within. Devotees also recite the Sri Sukta (Hymn to Lakshmi) and the Vishnu Sahasranama for divine blessings during this auspicious period.',
  },

  holi: {
    summary:
      'Holi, the vibrant Festival of Colors, heralds the arrival of spring and celebrates the eternal love of Radha and Krishna. It is one of the most exuberant and joyful festivals in the Hindu calendar, marked by the playful throwing of colored powders (gulal) and water. Holi transcends social boundaries, bringing together people of all ages, castes, and backgrounds in a spirit of equality and unity. The festival also commemorates the divine play of Lord Krishna with the gopis of Vrindavan and the burning of the demoness Holika. Across India, Holi is celebrated with music, dance, bonfires, and an abundance of traditional sweets and drinks.',
    origin:
      'Holi\'s origins are steeped in multiple Hindu legends. The most prominent is the story of Prahlad and Holika from the Bhagavata Purana. The demon king Hiranyakashipu wanted everyone to worship him, but his son Prahlad remained devoted to Lord Vishnu. Hiranyakashipu\'s sister Holika, who had a boon of immunity from fire, tricked Prahlad into sitting on a pyre with her. However, Holika perished while Prahlad survived, protected by Vishnu\'s divine grace. This event is commemorated as Holika Dahan the night before Holi. Another beloved origin story is the divine love between Radha and Krishna, where Krishna playfully applied colors to Radha\'s face, establishing the tradition of colored powder. The festival also has agricultural significance, marking the end of winter and the harvesting of the Rabi crop.',
    purpose:
      'Holi serves as a celebration of new beginnings, the arrival of spring, and the triumph of devotion over tyranny. The festival encourages people to break free from social inhibitions and connect with others through the universal language of color and joy. It is a time to mend broken relationships, forgive past wrongs, and embrace renewal. The bonfires of Holika Dahan symbolize the burning of evil and the purification of the soul. Holi also celebrates the playful and romantic aspects of divine love, particularly the relationship between Radha and Krishna. For farmers, it marks the end of the winter harvest season and the beginning of a new agricultural cycle.',
    importance:
      'Holi is one of the most widely celebrated festivals in India and among the global Indian community. It holds deep cultural significance as a symbol of unity, equality, and the triumph of good over evil. The festival plays an important role in social cohesion, as it is one of the few occasions when people from all walks of life come together without regard for caste, class, or age. Holi has gained worldwide recognition, with color runs and Holi-inspired events held in cities across Europe, America, and Asia. The festival also has economic significance, driving demand for colors, sweets, and festive items. In literature and art, Holi has inspired countless poems, songs, and paintings celebrating its spirit of joy and devotion.',
    celebration:
      'Holi celebrations begin the night before with Holika Dahan, where communities gather around large bonfires to perform rituals and burn effigies of Holika. The next morning, the main celebration starts with the playful throwing of colored powders and water. People smear each other with gulal, spray water guns (pichkaris), and drench each other with colored water. In Vrindavan and Mathura, celebrations last over a week with elaborate events at temples. Traditional Holi drinks like thandai (spiced milk) and bhang (cannabis-infused drink) are shared. Festive foods include gujiya (sweet dumplings), malpua (sweet pancakes), and puran poli. Music and dance are central to the celebrations, with folk songs and Bollywood Holi numbers filling the air. In the evening, people clean up, change into fresh clothes, and visit friends and family to exchange sweets and greetings.',
    mantra:
      'During Holi, devotees chant mantras honoring Lord Krishna and the divine love of Radha-Krishna. The Holi mantra is: "Om Jai Sri Krishna Govinda Hare Murari, Hey Nath Narayan Vasudeva." The Radha Krishna mantra "Om Namo Bhagavate Vasudevaya" is also widely recited. In Braj region, devotees sing the "Holi Mahatmya" from the Brahma Vaivarta Purana. The Holika Dahan mantra invokes protection: "Holika Dahan Shubh Muhurat Parv Ka Vidhan, Bura Ka Naash Ho, Achhai Ki Jeet Ho." Devotees also sing traditional Holi songs like "Rang Barse" and "Holi Ke Geet" while celebrating.',
  },

  'ganesh chaturthi': {
    summary:
      'Ganesh Chaturthi is a grand ten-day festival celebrating the birth of Lord Ganesha, the beloved elephant-headed deity revered as the remover of obstacles and the god of new beginnings. The festival begins with the installation of beautifully crafted Ganesha idols in homes and public pandals (temporary structures). Devotees offer prayers, flowers, and traditional sweets like modak and laddu to seek Ganesha\'s blessings. The festival concludes with Ganesh Visarjan, the ceremonial immersion of idols in rivers, lakes, and seas, accompanied by grand processions, music, and dancing. Ganesh Chaturthi is celebrated with particular enthusiasm in Maharashtra, especially in Mumbai, where the festival transforms into a spectacular public celebration.',
    origin:
      'Ganesh Chaturthi has been celebrated since the time of the Chhatrapati Shivaji Maharaja in the 17th century, who popularized it as a public festival. However, the worship of Ganesha dates back to ancient times, with references in the Puranas and Vedic literature. According to legend, Goddess Parvati created Ganesha from turmeric paste and breathed life into him. She appointed him as the guardian of her chambers. When Shiva, her husband, was prevented from entering by Ganesha, a battle ensued and Shiva beheaded the boy. Parvati was devastated, and Shiva promised to bring Ganesha back to life. He replaced Ganesha\'s head with that of an elephant, blessed him with a new form, and declared him superior to all gods. The modern celebration was revived by Lokmanya Tilak in 1893 as a means to unite people during the Indian independence movement.',
    purpose:
      'Ganesh Chaturthi celebrates the birth of Lord Ganesha and seeks his blessings for wisdom, prosperity, and the removal of obstacles. The festival serves as a reminder of the power of devotion and the importance of seeking divine guidance before embarking on new ventures. Ganesha is worshipped at the beginning of any new enterprise, journey, or ceremony. The ten-day festival provides an opportunity for communities to come together, celebrate their faith, and express their devotion through collective worship. It also emphasizes environmental consciousness through the use of eco-friendly idols and natural materials in celebrations.',
    importance:
      'Ganesh Chaturthi is one of the most important festivals in Maharashtra and is celebrated with great fervor across India. The festival holds special cultural and historical significance as it was revived by Lokmanya Tilak during the Indian independence movement as a means to unite people across caste and class lines. Public celebrations and pandals serve as community gathering spaces that promote social cohesion. The festival has significant economic implications, supporting artisans who craft Ganesha idols, as well as businesses that supply materials and sweets. In recent years, Ganesh Chaturthi has also become a platform for social awareness campaigns, with pandals often highlighting social issues.',
    celebration:
      'Ganesh Chaturthi celebrations begin with the ceremonial installation of Ganesha idols in homes and public pandals. The idol is placed on a decorated pedestal, and the prana pratishtha ritual invokes divine presence into the idol. Devotees perform aarti twice daily, offering flowers, durva grass, and sweets. Modak, Ganesha\'s favorite sweet, is offered in abundance. On the fifth day (Rishi Panchami), women worship the seven sages. The grand finale is Ganesh Visarjan, where idols are carried in colorful processions with music, dancing, and chants of "Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya!" (Lord Ganesha, come again soon next year!). The idols are immersed in water bodies, symbolizing Ganesha\'s return to Mount Kailash. In Mumbai alone, millions participate in the immersion processions that last late into the night.',
    mantra:
      'The primary Ganesha mantra is: "Om Gam Ganapataye Namaha" (I bow to Lord Ganesha, the remover of obstacles). Other important mantras include "Vakratunda Mahakaya Surya Koti Samaprabha, Nirvighnam Kuru Me Deva Sarva Kaaryeshu Sarvada" (O Lord with curved trunk and magnificent body, radiating the brilliance of ten million suns, please remove obstacles from all my endeavors). The Ganesh Atharvashirsha is recited for deep spiritual connection. During Chanting, devotees also sing "Jai Ganesh Deva" aarti and "Sukhakarta Dukhharta" aarti, traditional prayers to Lord Ganesha.',
  },

  navratri: {
    summary:
      'Navratri, meaning "nine nights," is a major Hindu festival celebrating the divine feminine energy (Shakti) and the triumph of Goddess Durga over the buffalo demon Mahishasura. Each of the nine nights is dedicated to a different form of the Goddess: Shailaputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, and Siddhidatri. The festival culminates on the tenth day, Vijayadashami or Dussehra, celebrating the victory of good over evil. Navratri is celebrated with great enthusiasm across India, with regional variations including Garba and Dandiya Raas in Gujarat, Durga Puja in Bengal, and Bommai Kolu in South India.',
    origin:
      'Navratri\'s origins are deeply rooted in Hindu mythology and the Markandeya Purana. According to legend, the demon Mahishasura received a boon that no man or god could defeat him. He wreaked havoc on heaven and earth, and the combined powers of Brahma, Vishnu, and Shiva created Goddess Durga to vanquish him. The battle lasted nine days, and on the tenth day, Durga finally killed Mahishasura, establishing the triumph of good over evil. Another legend connects Navratri to Lord Rama, who worshipped Goddess Durga for nine nights before slaying Ravana on the tenth day. The festival also marks the changing seasons, as it falls during the transition from monsoon to autumn (Sharad Ritu).',
    purpose:
      'Navratri is a celebration of the divine feminine and the power of Shakti. It honors the strength, courage, and wisdom embodied by Goddess Durga in her nine forms. The festival encourages devotees to embark on a spiritual journey of self-purification and inner transformation. Each day of Navratri represents overcoming a different negative quality and cultivating its positive counterpart. The festival also reinforces family and community bonds through collective worship, dance, and celebration. For many, Navratri is a time of fasting and spiritual discipline, culminating in the joyous celebrations of Vijayadashami.',
    importance:
      'Navratri is one of the most important festivals in the Hindu calendar, celebrated across India with distinct regional traditions. In Gujarat, the Garba and Dandiya Raas dances during Navratri are world-famous and attract tourists from around the globe. In West Bengal, Durga Puja transforms Kolkata into a cultural spectacle with elaborate pandals and artistic representations of the Goddess. In South India, Bommai Kolu features tiered displays of dolls and figurines. The festival holds economic significance as well, driving demand for traditional clothing, jewelry, and festive supplies. Navratri also serves as a platform for cultural expression, with music, dance, and drama performances organized throughout the nine nights.',
    celebration:
      'Navratri celebrations vary by region but share common elements. In Gujarat, evenings come alive with Garba circles and Dandiya Raas (stick dance) performances, where participants dressed in colorful traditional attire dance to rhythmic folk music. Temples and community spaces host elaborate performances. In Bengal, Durga Puja features artistic pandals, cultural programs, and the immersion of Durga idols on Vijayadashami. In North India, Ramlila performances depict the story of Lord Rama, culminating in the burning of Ravana effigies on Dussehra. Across all regions, devotees fast during the nine days, consuming only fruits and specific foods. The Goddess is offered flowers, prayers, and aarti each day, and homes are decorated with rangoli and flowers.',
    mantra:
      'The primary Navratri mantra is the Durga mantra: "Ya Devi Sarva Bhuteshu, Shakti Rupena Samsthita, Namastasyai, Namastasyai, Namastasyai, Namo Namah" (I bow to the Goddess who dwells in all beings as power and energy). Other important mantras include "Om Jai Ambe Gauri," the powerful Navratri aarti, and the Durga Saptashati which describes the Goddess\'s battles and triumphs. Devotees also recite the Lalita Sahasranama and the Mahishasura Mardini Stotram during the nine nights. The Navratri mantra "Om Aim Hreem Kleem Chamundaye Vichche" invokes the blessings of the three forms of the Goddess — Saraswati, Lakshmi, and Durga.',
  },

  janmashtami: {
    summary:
      'Janmashtami celebrates the birth of Lord Krishna, the eighth avatar of Lord Vishnu and one of the most beloved deities in Hinduism. Born at midnight on the eighth day of the dark fortnight in the month of Bhadrapada, Krishna\'s birth is marked with great devotion and joy. The festival is celebrated with midnight prayers, bhajans (devotional songs), and dramatic reenactments of Krishna\'s childhood episodes (Ras Lila). In Maharashtra, the famous Dahi Handi ceremony sees human pyramids formed to break pots of curd hung high in the streets. In Mathura and Vrindavan, Krishna\'s birthplace, celebrations are particularly elaborate with temple decorations, devotional singing, and midnight aarti.',
    origin:
      'Janmashtami commemorates the divine birth of Lord Krishna to Devaki and Vasudeva in the Mathura prison of King Kamsa. According to the Bhagavata Purana, Krishna was the fulfillment of a prophecy that Devaki\'s eighth son would destroy the tyrannical Kamsa. To protect Krishna, Vasudeva carried the newborn across the Yamuna river to Gokul, where he was raised by Nanda and Yashoda. Krishna\'s life stories — from his mischievous childhood pranks with butter and milkmaids to his teachings in the Bhagavad Gita — are central to Hindu spiritual tradition. The festival\'s origins are documented in the Puranas and have been celebrated for millennia across the Indian subcontinent.',
    purpose:
      'Janmashtami celebrates the divine incarnation of Lord Krishna and his role as the protector of dharma. Krishna\'s life and teachings, particularly the Bhagavad Gita, form the foundation of Hindu philosophy on duty, devotion, and righteousness. The festival encourages devotees to reflect on Krishna\'s teachings about selfless action, devotion to God, and the importance of fulfilling one\'s dharma without attachment to results. Janmashtami also celebrates the joy and playfulness of Krishna\'s childhood, reminding devotees of the divine\'s accessibility and love. The midnight celebrations symbolize the spiritual awakening that comes with the birth of divine consciousness.',
    importance:
      'Janmashtami is celebrated with varying intensity across India, with the most elaborate festivities in Mathura, Vrindavan, and Maharashtra. The festival holds immense religious significance as Krishna is considered a complete divine incarnation who combined wisdom, compassion, strength, and playfulness. The Bhagavad Gita, delivered by Krishna, is one of the most influential spiritual texts globally. Janmashtami celebrations promote cultural heritage through traditional dances, dramas, and music. The Dahi Handi ceremony in Maharashtra has become a major cultural event, drawing large crowds and media attention. The festival also reinforces community bonds through collective worship and celebration.',
    celebration:
      'Janmashtami celebrations begin with fasting on the day before the festival, which is broken at midnight after Krishna\'s birth. Devotees stay awake through the night singing bhajans, performing aarti, and reading Krishna\'s stories. Temples are elaborately decorated, and cradle ceremonies (Palna) are held where baby Krishna idols are placed in decorated cradles. In Mathura and Vrindavan, Ras Lila performances depict Krishna\'s life events, especially his playful interactions with the gopis. In Maharashtra, Dahi Handi sees teams forming human pyramids to break clay pots filled with curd, butter, and milk. In Gujarat and other regions, the Janmashtami night features devotional music and dance performances. Traditional foods include butter, milk sweets, and makhan mishri (butter and sugar crystals).',
    mantra:
      'The primary Janmashtami mantra is: "Om Namo Bhagavate Vasudevaya" (I bow to Lord Vasudeva, the indwelling divinity). This 12-syllable mantra is one of the most powerful in Vaishnavism and is chanted continuously during midnight celebrations. Other important mantras include the Krishna Gayatri: "Om Kleem Krishnaya Govindaya Gopijana Vallabhaya Swaha" and the Hare Krishna Maha Mantra: "Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare, Hare Rama, Hare Rama, Rama Rama, Hare Hare." Devotees also recite the Vishnu Sahasranama and sing bhajans like "Achyutam Keshavam" and "Vaishnav Jan To" during the night-long celebrations.',
  },

  'maha shivaratri': {
    summary:
      'Maha Shivaratri, the Great Night of Shiva, is one of the most important Hindu festivals dedicated to Lord Shiva. Celebrated on the 13th night and 14th day of the dark fortnight in the month of Magha (February-March), it marks the night when Shiva performed the cosmic dance of creation, preservation, and destruction (Tandava). Devotees observe fasts, stay awake through the night, and offer prayers to Shiva at temples. The festival also commemorates the divine marriage of Shiva and Parvati and the night Shiva consumed the deadly poison (Halahala) to save the world. Maha Shivaratri is celebrated across India with particular grandeur in Shiva temples like Kashi Vishwanath in Varanasi and Somnath in Gujarat.',
    origin:
      'Maha Shivaratri\'s origins are documented in several Puranas, including the Skanda Purana and Linga Purana. According to legend, on this night, Lord Shiva performed the Tandava cosmic dance, symbolizing the cycles of creation, preservation, and destruction. Another origin story describes the churning of the cosmic ocean (Samudra Manthan), during which a deadly poison emerged that threatened to destroy all creation. Shiva drank the poison to save the world, and his throat turned blue, earning him the name Neelkanth (the blue-throated one). The festival also commemorates the day Shiva appeared as a infinite pillar of fire (Jyotirlinga) during a debate between Brahma and Vishnu. Additionally, tradition holds that Parvati prayed for 108 years to win Shiva as her husband, and their union was blessed on this night.',
    purpose:
      'Maha Shivaratri celebrates the cosmic dance of Shiva and his role as the destroyer and transformer of the universe. The night-long vigil symbolizes the conquest of darkness through spiritual awakening and devotion. Fasting and prayer on this night are believed to cleanse sins, purify the soul, and bring one closer to moksha (liberation). The festival also honors the divine union of Shiva and Parvati, representing the balance of masculine and feminine energies in the cosmos. Devotees observe Maha Shivaratri to seek Shiva\'s blessings for spiritual growth, inner peace, and protection from negative forces.',
    importance:
      'Maha Shivaratri is one of the most significant festivals in Shaivism and holds great importance across India and Nepal. The festival attracts millions of devotees to Shiva temples, with Kashi Vishwanath in Varanasi, Somnath in Gujarat, and Pashupatinath in Nepal being major pilgrimage centers. The night-long celebrations promote spiritual discipline and self-reflection. Maha Shivaratri also has cultural significance, with traditional music, dance, and drama performances organized at temples. The festival reinforces the philosophical concepts of cosmic cycles, transformation, and the balance of creation and destruction central to Hindu thought.',
    celebration:
      'Maha Shivaratri celebrations begin with devotees taking ritual baths in sacred rivers, especially the Ganges. They then visit Shiva temples to offer prayers, perform abhishek (ritual bathing of the Shiva Linga) with water, milk, honey, and bel leaves. The Shiva Linga is decorated with flowers, garlands, and sacred ash (vibhuti). Devotees observe strict fasts, consuming only fruits, milk, and specific permitted foods. The night is spent in prayer, chanting, and meditation, with temples remaining open throughout. Shiva bhajans and mantras are chanted continuously, and many devotees stay awake until dawn. In some regions, processions carry Shiva Lingas through the streets, accompanied by music and devotional singing.',
    mantra:
      'The primary Maha Shivaratri mantra is: "Om Namah Shivaya" (I bow to Lord Shiva). This five-syllable mantra is one of the most sacred in Hinduism and is chanted continuously throughout the night. Other important mantras include the Shiva Tandava Stotram, which describes Shiva\'s cosmic dance, and the Maha Mrityunjaya Mantra: "Om Tryambakam Yajamahe, Sugandhim Pushtivardhanam, Urvarukamiva Bandhanan, Mrityor Mukshiya Maamritat" (We worship the three-eyed one who nourishes all beings. May He liberate us from death and lead us to immortality). Devotees also recite the Lingashtakam and Shiva Panchakshara Stotram during the night-long vigil.',
  },

  dussehra: {
    summary:
      'Dussehra, also known as Vijayadashami, is a major Hindu festival celebrated on the tenth day of Navratri, marking the victory of Lord Rama over the ten-headed demon king Ravana. The festival symbolizes the triumph of good over evil and is celebrated with dramatic performances of the Ramayana (Ramlila), the burning of giant Ravana effigies, and grand processions. In different parts of India, Dussehra also celebrates Goddess Durga\'s victory over Mahishasura and marks the end of Navratri festivities. The festival is celebrated with great pomp in cities like Mysuru, where the Mysuru Dasara features a spectacular procession of decorated elephants, and in Delhi, where the Ram Lila grounds come alive with cultural performances.',
    origin:
      'Dussehra\'s origins are primarily linked to the epic Ramayana, which narrates Lord Rama\'s 14-year exile, the abduction of his wife Sita by Ravana, and the great battle fought to rescue her. On the tenth day of the war, Rama killed Ravana, and this victory is celebrated as Dussehra. The Ramayana describes how Rama worshipped Goddess Durga for nine nights to gain the strength to defeat Ravana, and on the tenth day, he achieved victory. The tradition of Ramlila performances dates back centuries and was popularized during the medieval period. In South India, Dussehra also marks the day Goddess Durga defeated Mahishasura, as narrated in the Devi Mahatmya. The festival has been celebrated across India for over a thousand years, with historical records documenting grand Dussehra celebrations during the Vijayanagara Empire and in Rajput courts.',
    purpose:
      'Dussehra serves as a powerful reminder that good ultimately triumphs over evil. The festival encourages people to stand up against injustice, tyranny, and moral corruption. The burning of Ravana effigies symbolizes the destruction of the ten negative qualities he represents: anger, pride, greed, lust, hatred, jealousy, selfishness, cruelty, betrayal, and ego. Dussehra also celebrates the importance of duty (dharma) as exemplified by Lord Rama, who endured hardships to fulfill his responsibilities. The festival reinforces the values of courage, righteousness, and faith that are central to Hindu philosophy.',
    importance:
      'Dussehra is celebrated across India with varying regional traditions, making it one of the most culturally diverse festivals. In North India, Ramlila performances and the burning of Ravana effigies are central to celebrations. In Mysuru, the Mysuru Dasara is a 10-day state festival featuring a grand procession of elephants, cultural performances, and illumination of the Mysuru Palace. In West Bengal, it marks the end of Durga Puja with the immersion of Durga idols. In Gujarat, it coincides with the end of Navratri celebrations. Dussehra holds economic significance as it marks the beginning of the festive season and drives consumer spending. The festival also serves as a platform for cultural preservation through traditional arts, music, and theater.',
    celebration:
      'Dussehra celebrations vary by region but share the common theme of celebrating good\'s victory over evil. In North India, grand Ramlila performances depict key episodes from the Ramayana over nine nights, culminating in the dramatic burning of giant Ravana, Kumbhakarna, and Meghanada effigies on Dussehra day. In Mysuru, the spectacular Mysuru Dasara features a golden howdah procession with elephants carrying the idol of Goddess Chamundeshwari, cultural performances, and illumination of the Mysuru Palace. In West Bengal, Dussehra marks the grand finale of Durga Puja with sindoor khela (vermilion ceremony) and immersion processions. Across India, families gather for special prayers, exchange gifts, and enjoy festive meals. New purchases of vehicles, electronics, and gold are considered auspicious on this day.',
    mantra:
      'The primary Dussehra mantra invokes the victory of good over evil: "Om Jai Ram, Jai Jai Ram" (Victory to Lord Rama). Other important mantras include the Ram Raksha Stotram and the Aditya Hridayam, which Lord Rama recited before the battle with Ravana. The Dussehra aarti "Aarti Shri Ramayan Ji Ki" is sung in homes and temples. Devotees also recite the Hanuman Chalisa for strength and protection. The Navratri mantra "Ya Devi Sarva Bhuteshu Shakti Rupena Samsthita" is also chanted to honor Goddess Durga\'s divine power that enabled Rama\'s victory.',
  },

  'raksha bandhan': {
    summary:
      'Raksha Bandhan, meaning "the bond of protection," is a heartwarming festival celebrating the sacred relationship between brothers and sisters. On this day, sisters tie decorative threads (rakhi) around their brothers\' wrists, symbolizing their love and prayers for their well-being. In return, brothers pledge to protect and support their sisters. The festival strengthens family bonds and celebrates the unique love between siblings. Raksha Bandhan is observed on the full moon day (Purnima) in the month of Shravan (July-August) and is celebrated with much warmth and joy across India.',
    origin:
      'Raksha Bandhan\'s origins are steeped in Hindu mythology and historical traditions. One legend connects it to the story of Lord Krishna and Draupadi from the Mahabharata. When Krishna cut his finger, Draupadi tied a piece of cloth around it, and in return, Krishna vowed to protect her. Another legend tells of Queen Karnavati of Chittor, who sent a rakhi to Mughal emperor Humayun seeking his protection when her kingdom was under attack. The festival also has ancient roots in the practice of Brahmins tying sacred threads (mauli) on their wrists during religious ceremonies. The tradition of sisters tying rakhis on brothers\' wrists evolved as a symbol of the eternal bond between siblings and the protection it represents.',
    purpose:
      'Raksha Bandhan celebrates the special bond between brothers and sisters, emphasizing mutual love, care, and protection. The festival reinforces the importance of family relationships and the commitment to stand by each other through life\'s challenges. The rakhi thread symbolizes the sister\'s love and prayers for her brother\'s well-being, while the brother\'s pledge represents his commitment to protect and support his sister. Raksha Bandhan also extends beyond biological siblings, with many people celebrating with cousins, friends, and even those who share a protective bond. The festival promotes the values of sacrifice, loyalty, and unconditional love that are central to Indian family values.',
    importance:
      'Raksha Bandhan is widely celebrated across India and among the global Indian diaspora. The festival holds cultural and emotional significance as it strengthens family ties and celebrates the unique brother-sister relationship. In recent years, Raksha Bandhan has gained broader recognition, with many non-Hindu communities also participating in the celebrations. The festival has economic implications, driving demand for rakhis, gifts, sweets, and traditional clothing. It also serves as a platform for brands and marketers to promote products related to sibling love and family bonding. Raksha Bandhan\'s message of protection and love resonates across cultures, making it one of the most emotionally touching Indian festivals.',
    celebration:
      'Raksha Bandhan celebrations begin with sisters preparing or selecting beautiful rakhis (decorative threads) for their brothers. On the main day, sisters perform aarti for their brothers, apply tilak on their foreheads, and tie the rakhi around their wrists while praying for their well-being. Brothers, in return, give gifts or money and pledge to protect their sisters. Families gather for festive meals, share sweets, and spend quality time together. In many communities, siblings exchange heartfelt letters expressing their love and gratitude. In North India, the festival is celebrated with great enthusiasm, with markets bustling with rakhi shoppers in the days leading up to the festival. In South India, the day is also celebrated as Avani Avittam, where Brahmins change their sacred threads.',
    mantra:
      'The primary Raksha Bandhan mantra is: "Yena baddho balir dasa taden tvam abhishinchati, Sudatya te bhagavata shri vishnoh grhita bandhana" (By which the mighty demon Bali was bound, by that sacred thread I bind you, O brother, in the bond of Lord Vishnu). This mantra invokes Lord Vishnu\'s protection. Sisters also recite prayers for their brothers\' long life and prosperity: "Raksha Bandhan Mantra: Om Jai Shri Ram" and chant the Gayatri Mantra for divine blessings. The festival also involves singing traditional songs like "Bhaiya Mere Rakhi Ke Bandhan Ko Nibhana" and exchanging blessings for prosperity and well-being.',
  },

  'makar sankranti': {
    summary:
      'Makar Sankranti is a harvest festival marking the sun\'s transition into the zodiac sign of Capricorn (Makara). Celebrated on January 14th each year, it is one of the few Hindu festivals based on the solar calendar rather than the lunar calendar. The festival celebrates the end of winter and the beginning of longer days, symbolizing the sun\'s journey northward (Uttarayan). Makar Sankranti is celebrated with great enthusiasm across India, with regional variations including Pongal in Tamil Nadu, Uttarayan in Gujarat, Magh Bihu in Assam, and Lohri in Punjab. The festival is marked by kite flying, sesame seed preparations, and communal feasts.',
    origin:
      'Makar Sankranti\'s origins are rooted in ancient Indian astronomy and agricultural traditions. The festival marks the end of the winter solstice and the beginning of the harvest season. According to Hindu mythology, this is the day Lord Krishna ended the curse of Shani (Saturn) and advised his son Samba to worship the sun god Surya for healing from leprosy. The festival also commemorates the day Lord Vishnu defeated the Asuras and buried them under the Mandara mountain. Historically, Makar Sankranti has been celebrated for over 2,000 years, with references in ancient texts like the Surya Siddhanta. The festival\'s association with kite flying in Gujarat dates back to the royal courts of the Maratha and Mughal periods.',
    purpose:
      'Makar Sankranti celebrates the harvest season and the end of winter, expressing gratitude to the sun god Surya for sustaining life on earth. The festival marks the beginning of the sun\'s northward journey (Uttarayan), which is considered auspicious. It is a time for new beginnings, as the transition of the sun symbolizes spiritual awakening and enlightenment. The preparation and sharing of sesame sweets and delicacies represent warmth, prosperity, and community bonding. Makar Sankranti also emphasizes environmental awareness, as traditional celebrations use natural materials and eco-friendly practices.',
    importance:
      'Makar Sankranti is celebrated across India with unique regional traditions, making it one of the most diverse festivals. In Gujarat, the International Kite Festival (Uttarayan) attracts tourists from around the world. In Tamil Nadu, Pongal is a four-day harvest festival celebrated with elaborate kolam (rangoli) designs and traditional cooking. In Assam, Magh Bihu features community feasts and traditional Bihu dances. In Karnataka, the festival is celebrated as Sankranti with bull races and traditional folk performances. Makar Sankranti holds cultural significance as it promotes agricultural awareness and preserves traditional farming practices. The festival also has scientific significance, marking an important astronomical event.',
    celebration:
      'Makar Sankranti celebrations vary by region but share the common theme of celebrating the harvest and the sun\'s transition. In Gujarat, the International Kite Festival sees millions of kites filling the sky, with people of all ages participating in kite flying from rooftops. In Tamil Nadu, Pongal involves cooking newly harvested rice with milk and jaggery in decorated clay pots, offering it to the sun god. In Assam, Magh Bihu features community feasts with traditional pitha (rice cakes) and Bihu dance performances. Across India, people prepare and exchange til-gul (sesame and jaggery sweets) with the phrase "Til-gul ghya, god god bola" (Accept this sweet and speak sweetly). In many regions, people take holy dips in rivers, especially the Ganges, and perform charitable acts.',
    mantra:
      'The primary Makar Sankranti mantra is the Gayatri Mantra dedicated to the sun god: "Om Bhur Bhuvaḥ Svaḥ, Tat Savitur Vareṇyaṃ, Bhargo Devasya Dhīmahi, Dhiyo Yo Naḥ Prachodayāt" (We meditate upon the divine light of the sun god, may he illuminate our minds). Devotees also chant the Surya mantra: "Om Suryaya Namaha" (I bow to the sun god). The Surya Namaskar (Sun Salutation) is performed as a physical and spiritual practice during the festival. In some regions, the Maha Mrityunjaya Mantra is recited for health and well-being. Traditional Sankranti songs and bhajans celebrating the harvest and the sun\'s journey are also sung during the festivities.',
  },

  onam: {
    summary:
      'Onam is the most important festival of Kerala, celebrated over ten days to welcome the legendary King Mahabali, whose spirit is believed to visit Kerala during this time. The festival marks the annual homecoming of the beloved Asura king who ruled Kerala in a golden age of equality and prosperity. Onam is celebrated with elaborate flower carpets (pookalam), boat races (vallam kali), traditional dances (Kaikottikali), and the grand Onasadya feast featuring over 26 vegetarian dishes served on banana leaves. The festival showcases Kerala\'s rich cultural heritage through traditional art forms, music, and cuisine.',
    origin:
      'Onam\'s origins are rooted in the legend of King Mahabali, the great-grandson of Prahlad. According to the Bhagavata Purana, Mahabali was a benevolent Asura king who ruled Kerala in a golden age where everyone was equal and happy. His growing power threatened the gods, and they sought Lord Vishnu\'s help. Vishnu took the avatar of Vamana, a young Brahmin dwarf, and approached Mahabali for three paces of land. The generous king granted the wish, and Vamana revealed his true form, covering the earth with one step and the sky with another. With no place for the third step, Mahabali offered his head. Impressed by his generosity, Vishnu granted him the boon of returning to Kerala once a year to visit his people. Onam celebrates this annual return of King Mahabali.',
    purpose:
      'Onam celebrates the memory of King Mahabali and his golden reign of equality and prosperity. The festival serves as a reminder of the ideals of justice, equality, and good governance that Mahabali embodied. The elaborate celebrations express the people\'s love and respect for their beloved king and their hope for his return. Onam also marks the harvest season, giving thanks for agricultural abundance. The festival promotes community bonding through collective celebrations and cultural performances. It reinforces Kerala\'s unique cultural identity and traditions, bringing together people of all religions and backgrounds in celebration.',
    importance:
      'Onam is the state festival of Kerala and is celebrated with great enthusiasm by Malayalis worldwide. The festival holds immense cultural significance as it showcases Kerala\'s rich heritage through traditional art forms, music, and cuisine. The Onam festival is a major tourist attraction, drawing visitors from around the world to experience the spectacular celebrations. The festival promotes Kerala\'s cultural identity and serves as a platform for preserving traditional arts like Kathakali, Mohiniyattam, and Thumbi Thullal. Onam has economic significance as well, driving tourism and consumer spending during the festive season. The festival\'s message of equality and prosperity resonates across communities.',
    celebration:
      'Onam is celebrated over ten days, each with its own significance. The first day, Atham, marks the beginning of pookalam (flower carpet) making. Over the next nine days, the pookalam grows more elaborate. Traditional activities include Vallam Kali (snake boat races) on the Pamba River, Kaikottikali (traditional dance), Pulikali (tiger dance), and Onathallu (martial arts). The grand finale is Thiruvonam, the main day of celebrations, featuring the elaborate Onasadya feast with over 26 vegetarian dishes served on banana leaves. Homes are decorated with mango leaf garlands, and people wear new clothes. Traditional games, temple visits, and cultural performances fill the day. The festival concludes with the sending off of Mahabali\'s spirit with farewells and prayers.',
    mantra:
      'During Onam, devotional songs praising King Mahabali and Lord Vishnu are sung. The primary prayer is: "Vamanaya Namaha, Mahabaliye Namaha" (I bow to Vamana and Mahabali). The Onam song "Maveli Naadu Vaneedum Kalam" describes the golden age of Mahabali\'s reign. Traditional hymns like "Onam Pathinaru" (Sixteen Onam songs) are recited, celebrating the arrival and departure of Mahabali. Devotees also chant Vishnu mantras, particularly "Om Namo Narayanaya" and the Vishnu Sahasranama, during temple visits and home prayers.',
  },

  'chhath puja': {
    summary:
      'Chhath Puja is an ancient Hindu festival dedicated to the Sun God Surya and his wife Usha, celebrated with great devotion in Bihar, Jharkhand, Uttar Pradesh, and other parts of North India. The four-day festival involves rigorous rituals, including fasting without water (nirjala), standing in water bodies for long periods, and offering prayers to the rising and setting sun. Chhath Puja is one of the most demanding festivals, reflecting the deep devotion and faith of its practitioners. The festival celebrates the life-giving energy of the sun and expresses gratitude for the bounties of nature.',
    origin:
      'Chhath Puja has ancient origins dating back to the Vedic period, with references in the Rigveda and the Mahabharata. According to legend, the festival was first performed by Karna, the son of Surya and Kunti, who offered prayers to the sun while standing in water. Another legend connects Chhath to Lord Rama, who performed the ritual upon returning to Ayodhya after defeating Ravana to seek blessings from Surya. The festival also has roots in the ancient tradition of sun worship that was prevalent in Indian civilization. Chhath Puja has been celebrated for thousands of years, with its traditions passing down through generations in the Mithila region of Bihar.',
    purpose:
      'Chhath Puja is performed to express gratitude to the Sun God for sustaining life on earth and to seek blessings for prosperity, health, and well-being. The sun is considered the source of all life energy, and Chhath Puja acknowledges this vital role. The rigorous rituals, including fasting and standing in water, symbolize purification and devotion. The festival is also performed to pray for the longevity of family members and for the fulfillment of wishes. For many devotees, Chhath is an opportunity to connect with the cosmic energy of the sun and seek spiritual elevation.',
    importance:
      'Chhath Puja is one of the most important festivals in Bihar, Jharkhand, and eastern Uttar Pradesh, with millions of devotees participating in the celebrations. The festival holds immense cultural and religious significance in the Mithila region, where it is celebrated with particular grandeur. Chhath Puja has gained national and international recognition, with celebrations held in major cities across India and in countries with significant Bihari diaspora. The festival promotes environmental awareness as it involves worship of natural elements — the sun, water, and earth. Chhath also reinforces community bonds through collective celebrations and the sharing of prasad (blessed food).',
    celebration:
      'Chhath Puja spans four days, each with specific rituals. Day one, Nahay Khay, involves ritual bathing and preparation of traditional foods. Day two, Lohanda and Kharna, devotees observe a fast and prepare offerings. Day three, Sandhya Arghya, is the main day of worship at sunset, where devotees stand in water bodies offering prayers to the setting sun. Day four, Usha Arghya, involves worshipping the rising sun at dawn. The rituals require standing in water for extended periods, often in cold weather, demonstrating the devotees\' dedication. Traditional offerings include sugarcane, coconut, banana, and thekua (a traditional sweet). The festival concludes with breaking the fast and distributing prasad among family and community members.',
    mantra:
      'The primary Chhath Puja mantra is: "Om Suryaya Namaha, Om Arighmanaya Namaha, Om Bhaskaraya Namaha" (I bow to the sun god). Devotees also recite the Gayatri Mantra: "Om Bhur Bhuvaḥ Svaḥ, Tat Savitur Vareṇyaṃ, Bhargo Devasya Dhīmahi, Dhiyo Yo Naḥ Prachodayāt" while offering water to the sun. The Chhath geet (songs) are traditional hymns praising Surya and expressing devotion. The Sandhya and Usha Arghya prayers are specific to Chhath Puja, recited during sunset and sunrise offerings respectively. Devotees also chant "Jai Chhathi Maiya" throughout the festival to invoke the blessings of Chhathi Maiya, the goddess associated with the festival.',
  },

  'krishna janmashtami': {
    summary:
      'Krishna Janmashtami celebrates the birth of Lord Krishna, the eighth avatar of Lord Vishnu. Born at midnight on the eighth day of the dark fortnight in the month of Bhadrapada, Krishna\'s birth is marked with great devotion and joy. The festival is celebrated with midnight prayers, bhajans, and dramatic reenactments of Krishna\'s childhood episodes. In Maharashtra, the famous Dahi Handi ceremony sees human pyramids formed to break pots of curd hung high in the streets. In Mathura and Vrindavan, celebrations are particularly elaborate with temple decorations, devotional singing, and midnight aarti.',
    origin:
      'Krishna Janmashtami commemorates the divine birth of Lord Krishna to Devaki and Vasudeva in the Mathura prison of King Kamsa. According to the Bhagavata Purana, Krishna was the fulfillment of a prophecy that Devaki\'s eighth son would destroy the tyrannical Kamsa. To protect Krishna, Vasudeva carried the newborn across the Yamuna river to Gokul, where he was raised by Nanda and Yashoda. Krishna\'s life stories — from his mischievous childhood pranks with butter and milkmaids to his teachings in the Bhagavad Gita — are central to Hindu spiritual tradition.',
    purpose:
      'Janmashtami celebrates the divine incarnation of Lord Krishna and his role as the protector of dharma. Krishna\'s life and teachings, particularly the Bhagavad Gita, form the foundation of Hindu philosophy on duty, devotion, and righteousness. The festival encourages devotees to reflect on Krishna\'s teachings about selfless action and devotion to God.',
    importance:
      'Janmashtami is celebrated with varying intensity across India, with the most elaborate festivities in Mathura, Vrindavan, and Maharashtra. The festival holds immense religious significance as Krishna is considered a complete divine incarnation. The Bhagavad Gita, delivered by Krishna, is one of the most influential spiritual texts globally.',
    celebration:
      'Celebrations begin with fasting on the day before, broken at midnight after Krishna\'s birth. Devotees stay awake singing bhajans, performing aarti, and reading Krishna\'s stories. Temples are decorated, and cradle ceremonies are held. In Maharashtra, Dahi Handi sees teams forming human pyramids to break clay pots filled with curd, butter, and milk. Traditional foods include butter, milk sweets, and makhan mishri.',
    mantra:
      'The primary mantra is: "Om Namo Bhagavate Vasudevaya" (I bow to Lord Vasudeva). This 12-syllable mantra is one of the most powerful in Vaishnavism. Other important mantras include the Hare Krishna Maha Mantra: "Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare, Hare Rama, Hare Rama, Rama Rama, Hare Hare."',
  },

  'akshaya tritiya': {
    summary:
      'Akshaya Tritiya, also known as Akha Teej, is a highly auspicious Hindu and Jain festival celebrated on the third day of the bright half (Shukla Paksha) of the month of Vaishakha (April-May). The word "Akshaya" means imperishable, and it is believed that any good deed or venture started on this day will continue to grow and bring prosperity. It is one of the most auspicious days in the Hindu calendar for starting new businesses, purchasing gold, and performing religious ceremonies. The festival is associated with Lord Vishnu, Goddess Lakshmi, and the birth of Lord Parshurama.',
    origin:
      'Akshaya Tritiya has deep mythological roots. According to legend, on this day Lord Vishnu took his sixth avatar as Parshurama. It is also believed that the sacred river Ganga descended from heaven to earth on this day. The Mahabharata mentions that Lord Krishna\'s childhood friend Sudama visited him on Akshaya Tritiya, and Krishna blessed him with wealth. Another legend states that the Pandavas received the Akshaya Patra (inexhaustible vessel) from Lord Surya on this day. For Jains, Akshaya Tritiya marks the day Lord Adinath (Rishabhadeva) ended his year-long penance by taking sugarcane juice.',
    purpose:
      'Akshaya Tritiya is celebrated to invoke blessings of prosperity, success, and imperishable merit. Devotees believe that any spiritual practice performed on this day yields infinite and lasting results. It is considered the most auspicious day for buying gold, silver, or starting new ventures. The festival encourages charitable giving, as donations made on Akshaya Tritiya are believed to multiply manifold. It also serves as a reminder of the imperishable nature of the soul and the eternal rewards of good deeds.',
    importance:
      'Akshaya Tritiya is one of the most commercially significant festivals in India, driving massive gold and jewelry sales. It is considered so auspicious that millions of Indians purchase gold on this day, regardless of market prices. The festival holds equal importance for Hindus and Jains. Many businesses and families choose this day to sign important contracts, start construction, or begin new ventures. Akshaya Tritiya has gained global recognition, with gold retailers worldwide running special promotions for the Indian diaspora.',
    celebration:
      'Akshaya Tritiya celebrations include early morning prayers, temple visits, and ritual baths in sacred rivers. Devotees worship Lord Vishnu and Goddess Lakshmi with flowers, incense, and offerings. Many families perform puja at home or in temples, chanting mantras for prosperity. The day is considered ideal for purchasing gold, silver, or precious stones. Charitable activities are emphasized, with many people distributing food, clothes, and money to the needy. Special pujas are performed at Jagannath temples in Puri, where the annual Snana Yatra (bathing ceremony) of Lord Jagannath takes place.',
    mantra:
      'The primary Akshaya Tritiya mantra is: "Om Namo Bhagavate Vasudevaya" (I bow to Lord Vasudeva). Devotees also chant the Vishnu Sahasranama and the Lakshmi mantra: "Om Shreem Mahalakshmiyei Namah." The Gayatri Mantra is recited for spiritual merit. For Jains, the Navkar Mantra is chanted. Special prayers for prosperity include "Om Jai Lakshmi Mata" and the Sri Sukta hymn dedicated to Goddess Lakshmi.',
  },

  'anant chaturdashi': {
    summary:
      'Anant Chaturdashi is a significant Hindu festival celebrated on the 14th day (Chaturdashi) of the bright half of the month of Bhadrapada (August-September). The festival is dedicated to Lord Vishnu in his eternal form (Anant) and marks the grand conclusion of the ten-day Ganesh Chaturthi celebrations. On this day, Ganesha idols are ceremonially immersed in water bodies. Devotees observe fasts, tie sacred threads (Anant Sutra) on their wrists, and pray for eternal protection and well-being. The festival holds particular significance in Maharashtra, Gujarat, and other western Indian states.',
    origin:
      'Anant Chaturdashi\'s origins are linked to the legend of Anant (eternal) form of Lord Vishnu. According to the Mahabharata, after the great war, Yudhishthira sought counsel from Lord Krishna about how to free himself from sins. Krishna advised him to observe the Anant Vrat and worship the eternal form of Vishnu. The story of Anant Padmanabha, the reclining Vishnu on the cosmic ocean, is also associated with this festival. In Maharashtra, the festival gained prominence as the day when Ganesh Visarjan (immersion) was established as the grand finale of Ganesh Chaturthi.',
    purpose:
      'Anant Chaturdashi celebrates the infinite and eternal nature of Lord Vishnu and seeks his blessings for protection and liberation. The tying of the Anant Sutra (sacred thread with 14 knots) symbolizes the devotee\'s bond with the divine and the desire for eternal well-being. The festival serves as a time for reflection on the imperishable nature of the soul and the importance of spiritual devotion. For many, it marks the completion of the Ganesh Chaturthi celebrations and the return of Lord Ganesha to his celestial abode.',
    importance:
      'Anant Chaturdashi holds significant importance as the concluding day of Ganesh Chaturthi celebrations, especially in Maharashtra. The Ganesh Visarjan processions on this day are massive public events, with lakhs of devotees participating. The festival also has religious significance for Vishnu devotees who observe the Anant Vrat. In Gujarat, the festival is celebrated with traditional fasting and prayer. Anant Chaturdashi marks the end of the major Hindu festive season that begins with Ganesh Chaturthi.',
    celebration:
      'Anant Chaturdashi celebrations vary by region. In Maharashtra, the day is marked by grand Ganesh Visarjan processions, where beautifully crafted Ganesha idols are carried through the streets with music, dancing, and chants of "Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya!" The idols are then immersed in the sea, lakes, or rivers. In Gujarat and North India, devotees observe the Anant Vrat, tying the Anant Sutra (a thread with 14 knots) on their wrists while chanting prayers. Fasting, temple visits, and offering prayers to Lord Vishnu are central to the celebrations. Families prepare special vegetarian meals and distribute food to the needy.',
    mantra:
      'The primary Anant Chaturdashi mantra is: "Om Namo Narayanaya" (I bow to Lord Narayana). Devotees recite the Anant Stotram, a hymn praising the eternal form of Lord Vishnu. The Vishnu Sahasranama is chanted for divine blessings. The Anant Vrat mantra includes "Om Anantaya Namah" and prayers invoking the 14 forms of Lord Vishnu. During Ganesh Visarjan, devotees sing "Ganpati Bappa Morya" and traditional aarti songs.',
  },

  'ashadhi ekadashi': {
    summary:
      'Ashadhi Ekadashi, also known as Devshayani Ekadashi or Maha Ekadashi, is one of the most important Ekadashi fasting days in Hinduism. Celebrated on the 11th day (Ekadashi) of the bright half of the month of Ashadha (June-July), it marks the day Lord Vishnu goes to sleep (Yoga Nidra) on the cosmic ocean for four months. The festival is particularly significant in Maharashtra, where it marks the conclusion of the annual Warkari pilgrimage to Pandharpur. Devotees observe strict fasts, visit temples, and participate in the grand Warkari tradition of singing devotional songs (Abhangas) on their way to Pandharpur.',
    origin:
      'Ashadhi Ekadashi\'s origins are documented in the Padma Purana and other sacred texts. According to legend, King Mandata of the Ikshvaku dynasty ruled over a land plagued by drought and famine. His subjects were suffering, and he sought the advice of sage Angira, who advised him to observe the Ashadhi Ekadashi Vrat. The king followed the sage\'s instructions, and soon rains came, ending the drought. Another legend states that Lord Vishnu goes into Yoga Nidra (cosmic sleep) on this day, and all religious activities are suspended for the Chaturmas period. The Warkari tradition dates back to the 13th century, with saints like Dnyaneshwar and Tukaram popularizing it.',
    purpose:
      'Ashadhi Ekadashi is observed to seek the blessings of Lord Vishnu and to ensure spiritual merit during the sacred Chaturmas period. The fasting is believed to cleanse sins and purify the soul. The festival marks the beginning of the Chaturmas (four months of spiritual discipline), during which devotees avoid auspicious ceremonies like weddings. The Warkari pilgrimage emphasizes devotion, community, and the singing of Abhangas (devotional poetry). The festival also celebrates the agricultural monsoon season, when nature is at its most vibrant.',
    importance:
      'Ashadhi Ekadashi holds immense significance in Maharashtra, where the Warkari pilgrimage to Pandharpur is one of the largest religious gatherings in India. Lakhs of Warkaris (pilgrims) walk hundreds of kilometers to reach the Vithoba temple in Pandharpur. The festival is equally important across India as a major Ekadashi fasting day. The Warkari tradition has been recognized as an Intangible Cultural Heritage by UNESCO. The festival promotes community bonding, spiritual discipline, and the preservation of devotional music and poetry.',
    celebration:
      'Ashadhi Ekadashi celebrations reach their climax in Pandharpur, Maharashtra, where lakhs of Warkaris gather at the Vithoba temple. The pilgrims carry Palkhis (palanquins) containing the padukas (footprints) of various saints, including Dnyaneshwar and Tukaram. The air resonates with Abhangas, Dindi dance, and devotional songs. In homes, devotees observe strict fasts, eating only fruits and milk. Many visit local Vishnu temples for special pujas. The night before, Warkaris stay awake singing and dancing. On the day of Ashadhi Ekadashi, the main temple ceremony takes place, and prasad is distributed to all devotees. In North India, devotees visit Vishnu temples and observe the Devshayani Ekadashi fast.',
    mantra:
      'The primary Ashadhi Ekadashi mantra is: "Om Namo Narayanaya" (I bow to Lord Narayana). Devotees chant the Vishnu Sahasranama and the Narayana mantra throughout the fasting day. The Warkari tradition features singing of Abhangas composed by saints like Dnyaneshwar, Tukaram, and Namdev. The Ekadashi Vrat Katha (story) is recited in temples and homes. The Dindi dance during the pilgrimage is accompanied by rhythmic chanting of "Vitthala, Vitthala" and "Raghunandan, Vitthala."',
  },

  'bhai dooj': {
    summary:
      'Bhai Dooj, also known as Bhai Tika or Bhau Beej, is a Hindu festival celebrating the bond between brothers and sisters. Celebrated on the second day of the bright half of the month of Kartik (October-November), it falls two days after Diwali. On this day, sisters apply a protective tilak (vermilion mark) on their brothers\' foreheads, pray for their long life and prosperity, and share festive meals. The festival is similar to Raksha Bandhan in its celebration of the sibling bond but has its own unique rituals and mythological significance.',
    origin:
      'Bhai Dooj\'s origins are linked to the story of Lord Krishna visiting his sister Subhadra after defeating the demon Narakasura. According to legend, Subhadra welcomed Krishna with aarti, applied tilak on his forehead, and prepared a feast. Krishna was so touched by her love and devotion that he declared this day would be celebrated as Bhai Dooj, honoring the sacred bond between brothers and sisters. Another legend connects the festival to Lord Yama (the god of death) and his sister Yamuna. It is believed that Yamuna invited Yama for a meal on this day, and Yama blessed her with eternal well-being. This connection has made Bhai Dooj also known as Yama Dwitriya.',
    purpose:
      'Bhai Dooj celebrates the unique relationship between brothers and sisters, emphasizing mutual love, protection, and support. The tilak ceremony symbolizes the sister\'s prayers for her brother\'s long life, prosperity, and protection from evil. The festival reinforces the importance of family bonds and the commitment of siblings to stand by each other through life\'s challenges. It also serves as a time for families to come together, share meals, and strengthen their emotional connections.',
    importance:
      'Bhai Dooj is widely celebrated across India with regional variations. In North India, it is an integral part of the Diwali celebrations. In Maharashtra and Gujarat, the festival is celebrated as Bhau Beej with great enthusiasm. In South India, it coincides with Govardhan Puja celebrations. The festival holds cultural significance as it preserves and celebrates the sibling bond in Indian society. Bhai Dooj has gained recognition beyond India, with Indian diaspora communities celebrating it worldwide.',
    celebration:
      'Bhai Dooj celebrations begin with sisters preparing for the tilak ceremony. Brothers visit their sisters\' homes, who welcome them with traditional aarti. Sisters apply a protective tilak on their brothers\' foreheads using vermilion, turmeric, and rice. They then tie a sacred thread (mauli) on their wrists and pray for their well-being. Brothers, in return, give gifts or money and pledge to protect their sisters. Families share festive meals featuring traditional sweets and savories. In many communities, the celebrations extend to cousins and friends who share a brother-sister-like bond.',
    mantra:
      'The primary Bhai Dooj mantra is: "Yamuna Tirtha Pavitra, Dwitiyaya Yad Aagat, Bhai Dooj Iti Prakhyata, Etasmin Din Sampujya Yamam Pujya Vidhanatah" (On the second day after the new moon, when the Yamuna river becomes sacred, Bhai Dooj is celebrated by worshipping Lord Yama). Sisters recite prayers for their brothers\' longevity: "Suraj Ki Kiranen Se, Khile Phool Tere, Jeewan Mein Har Din, Khushiyan Barsein Tere." The Yama mantra "Om Yamaya Namah" is also chanted for protection.',
  },

  'bohag bihu': {
    summary:
      'Bohag Bihu, also known as Rongali Bihu, is the most important festival of Assam, celebrated in mid-April to mark the Assamese New Year and the onset of spring. It is a harvest festival that celebrates the sowing of new crops and the arrival of the Assamese New Year (Vaishakh). The festival is celebrated for seven days, each with its own significance, and is marked by traditional Bihu dances (Bihu Naach), feasts, and community celebrations. Bohag Bihu showcases Assam\'s rich cultural heritage through traditional music, dance, and cuisine.',
    origin:
      'Bohag Bihu has ancient origins rooted in agricultural traditions and pre-Vedic practices. The festival celebrates the beginning of the Assamese agricultural calendar and the sowing of new crops. According to legend, King Indradyumna of Kamarupa (ancient Assam) established the Bihu celebrations. The festival also has connections to the worship of local deities and nature spirits. The Bihu dances originated as fertility rituals performed in agricultural fields. Over centuries, Bohag Bihu evolved into a grand celebration of Assamese identity, culture, and the agricultural cycle.',
    purpose:
      'Bohag Bihu celebrates the Assamese New Year, the harvest season, and the arrival of spring. The festival marks the end of the harvesting period and the beginning of a new agricultural cycle. It is a time for joy, feasting, and community bonding. The Bihu dances symbolize fertility, prosperity, and the celebration of life. The festival also serves as a platform for preserving and promoting Assamese cultural heritage, including traditional music, dance forms, and cuisine.',
    importance:
      'Bohag Bihu is the most important festival of Assam and holds immense cultural and social significance. It is a state holiday and is celebrated with great enthusiasm across the state. The festival promotes Assamese cultural identity and serves as a platform for traditional performing arts. Bohag Bihu attracts tourists from across India and abroad who come to experience the vibrant celebrations. The festival also has economic significance, driving demand for traditional clothing, food items, and cultural accessories.',
    celebration:
      'Bohag Bihu is celebrated over seven days, each with its own significance. The first day, Goru Bihu, is dedicated to worshipping cattle. People bathe their cows, decorate them with garlands, and feed them special food. The second day, Manuh Bihu (Human Bihu), marks the Assamese New Year. People wear new clothes, visit relatives, and exchange gifts. Traditional Bihu dances (Bihu Naach) are performed in community grounds, featuring rhythmic movements and traditional instruments like the dhol, pepa, and gogona. Elaborate feasts include traditional Assamese dishes like pitha (rice cakes), laru (coconut balls), and masor tenga (sour fish curry). The remaining days include Tekeli Bihu, Senehi Bihu, and Bohag Bihu proper.',
    mantra:
      'During Bohag Bihu, devotional songs and Bihu geets (songs) are sung. The primary prayer is to Mother Earth and the agricultural deities: "Hey Prithvi Maa, Hey Dharatri Maa" (O Mother Earth, O Divine Land). Traditional Bihu songs like "Bihu Geet" and "O Mor Apaar Dekhile" celebrate the harvest and spring. Devotees also offer prayers to Lord Krishna and local deities. The Bihu dance is accompanied by rhythmic chanting and traditional musical compositions.',
  },

  'chaitra sukhladi': {
    summary:
      'Chaitra Sukhladi, also known as Gudi Padwa or Ugadi, marks the first day of the Hindu lunar calendar month of Chaitra (March-April). It is celebrated as the New Year in Maharashtra (Gudi Padwa), Karnataka and Andhra Pradesh (Ugadi), and Manipur (Sajibu Nongma Panba). The festival signifies the beginning of a new year, the arrival of spring, and the harvest season. Devotees decorate their homes with rangoli, raise Gudi flags (in Maharashtra), prepare traditional foods like shrikhand and puran poli, and visit temples for special prayers.',
    origin:
      'Chaitra Sukhladi has ancient origins documented in the Puranas and historical texts. In Maharashtra, Gudi Padwa commemorates the legendary victory of King Shalivahan over the Sakas in 78 AD. The Gudi flag symbolizes this victory and is raised outside homes as a mark of triumph. In Karnataka and Andhra Pradesh, Ugadi\'s origins are linked to the legendary story of Lord Brahma creating the universe on this day. The festival also marks the beginning of the Chaitra Navratri. Historically, Chaitra Sukhladi has been celebrated for over 2,000 years as the start of the Hindu New Year.',
    purpose:
      'Chaitra Sukhladi celebrates new beginnings, the harvest season, and the triumph of good over evil. The festival marks the start of a new year, encouraging reflection on the past and hope for the future. The Gudi flag symbolizes victory, prosperity, and the arrival of spring. Devotees worship the deities for blessings of health, wealth, and happiness in the coming year. The festival also emphasizes cultural renewal and the preservation of traditional customs.',
    importance:
      'Chaitra Sukhladi is celebrated as the New Year across several Indian states, making it one of the most widely observed regional New Year festivals. In Maharashtra, Gudi Padwa is a public holiday and is celebrated with great enthusiasm. In Karnataka and Andhra Pradesh, Ugadi holds similar significance. The festival promotes cultural identity and serves as a platform for traditional arts, music, and cuisine. Chaitra Sukhladi also marks the beginning of the Chaitra Navratri, connecting it to the broader Hindu festive calendar.',
    celebration:
      'Chaitra Sukhladi celebrations vary by region. In Maharashtra, Gudi Padwa is marked by raising the Gudi — a tall bamboo pole topped with a silk cloth, neem leaves, and a copper or silver vessel. Homes are decorated with rangoli and mango leaf garlands. Families prepare traditional foods like shrikhand, puran poli, and neem flower-based dishes. In Karnataka and Andhra Pradesh, Ugadi celebrations include the Ugadi Pachadi — a preparation with six tastes (sweet, sour, salty, bitter, pungent, and astringent) symbolizing the variety of experiences in life. People wear new clothes, visit temples, and exchange greetings.',
    mantra:
      'The primary Chaitra Sukhladi mantra is: "Om Jai Jagdish Hare" and prayers for a prosperous new year. Devotees chant the Vishnu Sahasranama and the Ganesh mantra "Om Gan Ganapataye Namaha" for auspicious beginnings. In Maharashtra, the Marathi New Year prayer "Nutan Varshabhinandan" is recited. The Gayatri Mantra is chanted for spiritual upliftment and divine blessings in the new year.',
  },

  'dhanteras': {
    summary:
      'Dhanteras, also known as Dhanatrayodashi, is the first day of the five-day Diwali festival, celebrated on the 13th day of the dark fortnight in the month of Kartik (October-November). The name is derived from "Dhan" (wealth) and "Teras" (13th). It is considered highly auspicious to purchase gold, silver, utensils, or new vehicles on this day. Devotees worship Lord Dhanvantari (the god of Ayurveda), Goddess Lakshmi, and Lord Kuber (the god of wealth). Dhanteras marks the beginning of the festive season and is celebrated with elaborate decorations, prayers, and shopping.',
    origin:
      'Dhanteras has multiple mythological origins. The most popular legend relates to the churning of the cosmic ocean (Samudra Manthan), when Lord Dhanvantari emerged carrying the pot of Amrit (nectar of immortality). This event is celebrated as the birth of Ayurveda. Another legend tells of King Hima\'s young son, whose bride saved him from death by piling gold and silver ornaments at the entrance of his chamber and lighting countless lamps. When Yama (the god of death) came as a serpent, he was blinded by the glittering gold and left, sparing the prince\'s life. This tradition evolved into the custom of lighting diyas and decorating with precious metals on Dhanteras.',
    purpose:
      'Dhanteras is celebrated to invoke the blessings of wealth, health, and prosperity. The worship of Lord Dhanvantari is believed to bring good health, while Goddess Lakshmi and Lord Kuber are worshipped for financial abundance. The tradition of purchasing gold or silver on this day symbolizes attracting and retaining wealth. The festival also marks the beginning of the Diwali celebrations, setting a tone of abundance and divine blessing. Dhanteras emphasizes the importance of both material and spiritual wealth.',
    importance:
      'Dhanteras is one of the most commercially significant days in India, driving massive sales of gold, silver, and other precious metals. Jewellers report their highest sales of the year on Dhanteras. The festival holds immense religious significance as it marks the beginning of the Diwali celebrations. For businesses, Dhanteras is considered an auspicious time to purchase new equipment, vehicles, or property. The festival also promotes Ayurveda and traditional medicine, as Lord Dhanvantari is worshipped on this day.',
    celebration:
      'Dhanteras celebrations begin with thorough cleaning and decoration of homes. Entrance doors are adorned with rangoli, mango leaf garlands, and traditional motifs. Families worship Lord Dhanvantari, Goddess Lakshmi, and Lord Kuber with flowers, incense, and offerings. The worship involves lighting 13 diyas (oil lamps) and placing them at doorways and windows. Many families purchase gold, silver, or new utensils on this day. Special prayers are performed at temples, and financial transactions are initiated. The evening features elaborate aarti and bhajans. Traditional sweets like ladoo and barfi are prepared and distributed.',
    mantra:
      'The primary Dhanteras mantra is: "Om Dhanvantaraye Namah" (I bow to Lord Dhanvantari). Devotees also chant "Om Shreem Dhanvantaraye Namah" for health and prosperity. The Lakshmi mantra "Om Shreem Mahalakshmiyei Namah" is recited for wealth. The Dhanteras aarti "Om Jai Dhanvantari Bhagwan" is sung in homes and temples. Devotees also recite the Dhanvantari mantra for good health and the Kubera mantra "Om Yakshaya Kuberaya Vaishravanaya Dhanadhanyadhipataye" for wealth.',
  },

  'dhanu sankranti': {
    summary:
      'Dhanu Sankranti, also known as Makar Sankranti in Odisha, is celebrated on January 14th when the sun enters the zodiac sign of Capricorn (Makara). In Odisha, it marks the beginning of the month of Magha and is celebrated with traditional rituals, fairs, and cultural programs. The festival is particularly significant in western Odisha, where it is celebrated with traditional Bargarh Dhanu Yatra — a 11-day drama festival depicting the life of Lord Krishna. Devotees take holy baths, prepare traditional sweets, and offer prayers to the Sun God.',
    origin:
      'Dhanu Sankranti\'s origins are linked to ancient Indian astronomy and the solar calendar. The festival marks the sun\'s northward journey (Uttarayan), which is considered auspicious. In Odisha, the tradition of Dhanu Yatra dates back centuries and depicts the story of Lord Krishna\'s journey to Mathura and his killing of Kamsa. The festival also has agricultural significance, marking the end of the harvest season. The tradition of preparing traditional sweets like dhanu muaa (puffed rice balls) has been passed down through generations.',
    purpose:
      'Dhanu Sankranti celebrates the sun\'s transition and the beginning of the auspicious Uttarayan period. The festival expresses gratitude to the Sun God for sustaining life and marking the end of the winter season. The Dhanu Yatra in Bargarh serves as a cultural and spiritual reminder of Lord Krishna\'s victory over evil. The festival also marks the beginning of the Magha month, which is considered sacred for various religious practices and rituals.',
    importance:
      'Dhanu Sankranti is one of the most important festivals in western Odisha, with the Bargarh Dhanu Yatra being the largest open-air drama festival in India. The 11-day celebration attracts tourists and cultural enthusiasts from across the country. The festival holds cultural significance as it preserves traditional performing arts and storytelling. In Odisha, Dhanu Sankranti is celebrated with traditional fairs, cultural programs, and community gatherings. The festival also has economic significance, driving tourism and demand for traditional items.',
    celebration:
      'Dhanu Sankranti celebrations in Odisha are marked by traditional rituals and the spectacular Bargarh Dhanu Yatra. The festival begins with devotees taking holy baths in rivers and temples. Traditional sweets like dhanu muaa (puffed rice balls with jaggery) are prepared and distributed. In Bargarh, the 11-day Dhanu Yatra depicts the story of Lord Krishna\'s birth, his killing of Kamsa, and his journey to Mathura. The festival features elaborate stage sets, traditional music, and dance performances. Fairs and cultural programs are organized across the region. Devotees visit temples for special prayers and aarti.',
    mantra:
      'The primary Dhanu Sankranti mantra is the Gayatri Mantra: "Om Bhur Bhuvaḥ Svaḥ, Tat Savitur Vareṇyaṃ, Bhargo Devasya Dhīmahi, Dhiyo Yo Naḥ Prachodayāt." Devotees also chant the Surya mantra "Om Suryaya Namaha" and offer water to the rising sun. During the Dhanu Yatra, traditional Odia devotional songs and mantras praising Lord Krishna are performed. The Surya Namaskar is performed as a spiritual practice on this day.',
  },

  'durga ashtami': {
    summary:
      'Durga Ashtami, also known as Maha Ashtami, is the eighth day of Navratri and one of the most important days of Durga Puja celebrations. Dedicated to Goddess Durga, it marks the day when the Goddess defeated the buffalo demon Mahishasura. In many traditions, it is considered the most auspicious day for performing Kumari Puja (worshipping young girls as the Goddess). The day is also significant for Kanya Pujan, where nine young girls are worshipped as the nine forms of Durga. Devotees observe strict fasts, perform elaborate puja ceremonies, and participate in temple celebrations.',
    origin:
      'Durga Ashtami commemorates the climax of the battle between Goddess Durga and Mahishasura. According to the Devi Mahatmya, on this day Durga received divine weapons from various gods — a trident from Shiva, a discus from Vishnu, and a sword from Vayu — and finally slew the buffalo demon. The Kumari Puja tradition dates back to the medieval period and was popularized by the Ramakrishna Mission. In Bengal, Durga Ashtami is celebrated as one of the four main days of Durga Puja, with elaborate rituals at puja pandals.',
    purpose:
      'Durga Ashtami celebrates the divine feminine power (Shakti) and the triumph of good over evil. The Kumari Puja ritual honors the divine presence in young girls, symbolizing purity and innocence. The day is considered highly auspicious for spiritual practices and penance. Devotees observe fasts to purify their bodies and minds. The festival also serves as a reminder of the power of the divine feminine and the importance of respecting and honoring women.',
    importance:
      'Durga Ashtami is one of the most important days of the Navratri/Durga Puja festival, particularly in Bengal, Assam, and other eastern Indian states. The Kumari Puja at Belur Math (headquarters of Ramakrishna Mission) is a major event attended by dignitaries and devotees. In North India, Kanya Pujan is performed in homes and temples. The day holds cultural significance as it preserves traditional rituals and worship practices. Durga Ashtami celebrations promote the values of strength, courage, and the divine feminine.',
    celebration:
      'Durga Ashtami celebrations vary by region. In Bengal, it is one of the main days of Durga Puja, with elaborate pandal decorations, cultural programs, and Sandhi Puja (worship at the junction of Ashtami and Navami). Devotees perform Kumari Puja, worshipping young girls as embodiments of the Goddess. In North India, Kanya Pujan involves worshipping nine young girls, washing their feet, and offering them food and gifts. Fasting, temple visits, and devotional singing are central to the celebrations. In many homes, elaborate aarti ceremonies are performed.',
    mantra:
      'The primary Durga Ashtami mantra is: "Ya Devi Sarva Bhuteshu, Shakti Rupena Samsthita, Namastasyai, Namastasyai, Namastasyai, Namo Namah" (I bow to the Goddess who dwells in all beings as power). Devotees also chant the Durga Saptashati and the Mahishasura Mardini Stotram. The Sandhi Puja mantra "Sarvabhangasam Harinam, Jagaddhatri Maheshwarim" is recited during the junction of Ashtami and Navami. The mantra "Om Jai Ambe Gauri" is widely sung during aarti ceremonies.',
  },

  'geeta jayanti': {
    summary:
      'Geeta Jayanti commemorates the day Lord Krishna delivered the sacred Bhagavad Gita to Arjuna on the battlefield of Kurukshetra. Celebrated on the Ekadashi (11th day) of the Shukla Paksha (bright half) in the month of Margashirsha (November-December), it marks one of the most significant spiritual events in Hinduism. The Bhagavad Gita, comprising 700 verses, is a dialogue between Krishna and Arjuna that addresses duty, righteousness, and the nature of existence. Devotees recite the entire Gita, perform special pujas, and participate in spiritual discourses on this day.',
    origin:
      'Geeta Jayanti commemorates the historic day when Lord Krishna delivered the Bhagavad Gita to Arjuna on the battlefield of Kurukshetra, as narrated in the Mahabharata. According to tradition, this event took place on the Ekadashi of Margashirsha month. The Gita\'s teachings were recorded by the sage Vyasa in the Mahabharata. The tradition of celebrating Geeta Jayanti has been observed for centuries, with major celebrations at Kurukshetra in Haryana, where the actual battlefield is believed to have been located.',
    purpose:
      'Geeta Jayanti celebrates the divine wisdom of the Bhagavad Gita and its timeless teachings on duty, devotion, and the nature of reality. The festival encourages devotees to study and reflect on the Gita\'s teachings. It serves as a reminder of the importance of righteousness (dharma) and the path to spiritual liberation. Geeta Jayanti promotes philosophical inquiry and the application of spiritual principles in daily life.',
    importance:
      'Geeta Jayanti holds immense spiritual significance for Hindus worldwide. The Bhagavad Gita is considered one of the most influential spiritual texts globally, with translations in over 100 languages. The festival is celebrated with particular grandeur at Kurukshetra, where the International Gita Mahotsav attracts scholars and devotees from around the world. Geeta Jayanti promotes the universal teachings of the Gita and serves as a platform for interfaith dialogue and philosophical discussions.',
    celebration:
      'Geeta Jayanti celebrations include recitation of the entire Bhagavad Gita in temples and homes. At Kurukshetra, the International Gita Mahotsav features week-long celebrations with religious discourses, cultural programs, and spiritual workshops. Devotees take holy baths in the sacred Brahma Sarovar and visit temples dedicated to Lord Krishna. In homes, families gather for group readings and discussions of the Gita. Temples organize special pujas, and spiritual leaders deliver discourses on the Gita\'s teachings. Traditional vegetarian feasts are shared among community members.',
    mantra:
      'The primary Geeta Jayanti mantra is: "Om Namo Bhagavate Vasudevaya" (I bow to Lord Vasudeva). Devotees recite key verses from the Bhagavad Gita, particularly Chapter 2 (Sankhya Yoga), Chapter 9 (Rajavidya Rajaguhyam), and Chapter 12 (Bhakti Yoga). The Gayatri Mantra is chanted for spiritual wisdom. Important Gita verses like "Karmanye Vadhikaraste Ma Phaleshu Kadachana" (You have the right to perform your duty, but not to the fruits thereof) are recited and reflected upon.',
  },

  'govardhan puja': {
    summary:
      'Govardhan Puja, also known as Annakut (mountain of food), is celebrated the day after Diwali, on the first day of the bright half of the month of Kartik (October-November). The festival commemorates Lord Krishna\'s lifting of Mount Govardhan to protect the villagers of Vrindavan from the rains sent by Lord Indra. Devotees prepare elaborate offerings of food (Annakut) to Lord Krishna, consisting of dozens or even hundreds of vegetarian dishes. The festival is celebrated with particular grandeur in Mathura, Vrindavan, and Dwarka.',
    origin:
      'Govardhan Puja originates from the story in the Bhagavata Purana where Lord Krishna challenged the worship of Lord Indra by the villagers of Vrindavan. Krishna convinced the villagers to worship Mount Govardhan instead, as it provided them with sustenance. Enraged, Indra sent torrential rains to flood Vrindavan. Krishna lifted Mount Govardhan on his little finger to shelter the villagers and cattle from the downpour. Impressed by Krishna\'s power and compassion, Indra eventually submitted and worshipped Krishna. This event is celebrated as Govardhan Puja.',
    purpose:
      'Govardhan Puja celebrates Lord Krishna\'s protection of his devotees and the importance of devotion over ritualistic worship. The Annakut offering symbolizes the abundance of nature and gratitude for divine protection. The festival serves as a reminder that true devotion comes from the heart, not from elaborate rituals. It emphasizes the importance of community, as the Annakut is shared among all devotees. Govardhan Puja also marks the end of the Diwali celebrations.',
    importance:
      'Govardhan Puja holds special significance in Vaishnavism, particularly in the Pushtimarg tradition. The festival is celebrated with great grandeur in Dwarka (Krishna\'s kingdom), Nathdwara (Rajasthan), and various ISKCON temples worldwide. The Annakut offering at the Swaminarayan temples is one of the largest food offerings in Hinduism. In Gujarat, the festival is celebrated with elaborate Annakut displays featuring hundreds of dishes. Govardhan Puja promotes the values of devotion, community service, and gratitude.',
    celebration:
      'Govardhan Puja celebrations center around the Annakut offering. Devotees prepare an elaborate array of vegetarian dishes — sweets, savories, rice preparations, and vegetable curries — arranged in a mountain-like formation before the deity. In temples, the Annakut can consist of hundreds of different items. Devotees circumambulate the Govardhan Sila (sacred stone) while chanting mantras. In homes, special pujas are performed, and the prasad (blessed food) is distributed among family and neighbors. In some regions, Govardhan Hill replicas are made from cow dung and decorated.',
    mantra:
      'The primary Govardhan Puja mantra is: "Om Govardhanaya Namah" (I bow to Mount Govardhan). Devotees chant "Govardhan Dhari Govind Ki Jai" (Victory to Govardhan-lifting Govinda). The Annakut mantra "Annakut Vrishabhanu Nandan Ki Jai" is recited during the food offering. The Bhagavata Purana verses describing Krishna lifting Govardhan are recited. In Swaminarayan tradition, the mantra "Swaminarayan" is chanted along with prayers to Giriraj Maharaj (Lord Govardhan).',
  },

  'guru purnima': {
    summary:
      'Guru Purnima, celebrated on the full moon day (Purnima) in the month of Ashadha (July-August), honors spiritual teachers (Gurus) and their role in guiding disciples on the path of knowledge and self-realization. The festival is observed by Hindus, Buddhists, and Jains. It marks the birth anniversary of Ved Vyasa, the sage who compiled the Vedas and wrote the Mahabharata. Devotees express gratitude to their gurus through worship, offerings, and spiritual discourses. Guru Purnima is particularly significant in ashrams and spiritual centers across India.',
    origin:
      'Guru Purnima has multiple origins across different traditions. In Hinduism, it marks the birth anniversary of Ved Vyasa, who organized the Vedas into four parts and authored the Mahabharata. In Buddhism, it commemorates the day Lord Buddha gave his first sermon at Sarnath. In Jainism, it celebrates the day Mahavira attained moksha. The tradition of Guru Puja has roots in the ancient Guru-Shishya parampara (teacher-student tradition), which has been central to Indian spiritual and educational practices for millennia.',
    purpose:
      'Guru Purnima celebrates the vital role of spiritual teachers in guiding seekers toward self-realization and divine knowledge. The festival expresses gratitude to the Guru for illuminating the path of wisdom and removing the darkness of ignorance. It serves as a reminder of the importance of learning and the transmission of knowledge from generation to generation. Guru Purnima also encourages devotees to seek spiritual guidance and deepen their practice.',
    importance:
      'Guru Purnima holds immense significance across Hindu, Buddhist, and Jain traditions. In ashrams and spiritual centers across India, the festival is celebrated with special ceremonies and discourses. The festival promotes the values of knowledge, learning, and spiritual guidance. Guru Purnima has gained global recognition, with spiritual centers worldwide organizing celebrations. The festival also serves as a platform for the continuation of traditional spiritual practices and teachings.',
    celebration:
      'Guru Purnima celebrations center around honoring one\'s spiritual teacher. Disciples express gratitude through special pujas, offerings of flowers and garlands, and touching the Guru\'s feet. In ashrams, the Guru delivers a special discourse on the significance of the Guru-Shishya relationship. Devotees observe fasts, meditate, and engage in spiritual practices. In some traditions, the Guru\'s feet are washed by disciples, and prasad is distributed. Cultural programs featuring devotional music and dance are organized. In many ashrams, new disciples are initiated into spiritual practices on this auspicious day.',
    mantra:
      'The primary Guru Purnima mantra is: "Gurur Brahma, Gurur Vishnu, Gurur Devo Maheshwarah, Gurur Saakshaat Parabrahma, Tasmai Shri Gurave Namah" (The Guru is Brahma, the Guru is Vishnu, the Guru is Maheshwara, the Guru is the Supreme Brahman Himself, I bow to that sacred Guru). Devotees also chant the Guru Stotram and "Om Jai Guru Dev" aarti. The Gayatri Mantra is recited for spiritual wisdom. In Buddhist traditions, the Dhammapada verses are recited.',
  },

  'hanuman janmotsav': {
    summary:
      'Hanuman Janmotsav, also known as Hanuman Jayanti, celebrates the birth of Lord Hanuman, the devoted disciple of Lord Rama and the embodiment of strength, courage, and selfless devotion. Celebrated on the 15th day of the bright half of the month of Chaitra (March-April), the festival is marked with special pujas, recitation of the Hanuman Chalisa, and readings of the Ramayana. Hanuman is revered as the destroyer of evil, the remover of obstacles, and the ultimate devotee. Temples dedicated to Hanuman across India hold special celebrations, and devotees apply sindoor (vermillion) to Hanuman idols.',
    origin:
      'Hanuman Janmotsav commemorates the divine birth of Lord Hanuman to Anjana and Kesari, with the blessings of Lord Shiva. According to legend, Anjana was a celestial nymph who was cursed to be born as a monkey. She prayed to Lord Shiva, who blessed her with a son who would be an incarnation of his own. Hanuman was born with divine powers, which he initially used playfully. The sage cursed him to forget his powers until reminded by others. Hanuman\'s devotion to Lord Rama during the Ramayana epic is one of the most celebrated stories in Hindu tradition.',
    purpose:
      'Hanuman Janmotsav celebrates the birth of the divine son of Anjana and Kesari, who would become the ultimate symbol of devotion and service. The festival honors Hanuman\'s qualities of courage, strength, wisdom, and selfless service. Devotees seek Hanuman\'s blessings for protection from evil, courage in adversity, and success in their endeavors. The festival serves as a reminder of the power of devotion and the importance of serving the divine with unwavering faith.',
    importance:
      'Hanuman Janmotsav is celebrated across India with great devotion. Hanuman is one of the most widely worshipped deities in Hinduism, revered by people of all castes and backgrounds. The festival holds special significance in North India, where Hanuman temples are focal points of celebrations. Hanuman is considered the protector of cities and villages, and his temples are often located at crossroads and entrances. The festival promotes the values of devotion, service, and courage that Hanuman embodies.',
    celebration:
      'Hanuman Janmotsav celebrations begin with early morning prayers and special pujas at Hanuman temples. Devotees apply sindoor (vermillion) to Hanuman idols, offer flowers, and light oil lamps. The Hanuman Chalisa is recited continuously throughout the day. In many temples, the Ramayana is read from beginning to end. Devotees observe fasts and perform special rituals like breaking coconuts and offering prasad. In some regions, processions are organized with Hanuman flags and banners. Cultural programs featuring devotional music and drama depicting Hanuman\'s life are organized.',
    mantra:
      'The primary Hanuman Janmotsav mantra is: "Om Hanumate Namah" (I bow to Lord Hanuman). The Hanuman Chalisa, composed by Tulsidas, is the most widely recited prayer: "Jai Hanuman Gyan Gun Sagar, Jai Kapis Tihun Lok Ujagar." Other important mantras include "Om Jai Hanuman Deva" aarti and the Bajrang Baan for protection. Devotees also chant "Jai Shri Ram" as Hanuman is the eternal servant of Lord Rama.',
  },

  'hariyali teej': {
    summary:
      'Hariyali Teej, also known as Chhoti Teej, is celebrated on the third day of the bright half of the month of Shravan (July-August). The festival marks the arrival of the monsoon and celebrates the divine union of Lord Shiva and Goddess Parvati. Women observe fasts, wear green clothes, apply henna, and pray for the well-being of their husbands. The festival is particularly significant in Rajasthan, where it is celebrated with elaborate swings, traditional dances, and fairs. Hariyali Teej also marks the beginning of the Shravan month, which is sacred to Lord Shiva.',
    origin:
      'Hariyali Teej originates from the legend of Goddess Parvati\'s deep devotion to Lord Shiva. According to tradition, Parvati performed severe penance to win Shiva as her husband. On the day of Teej, Shiva accepted Parvati as his wife. To celebrate their divine union, the festival of Teej was established. The tradition of women fasting on this day originated from Parvati\'s vow to secure Shiva as her husband. In Rajasthan, the festival has been celebrated since the time of the Rajput kings, who organized elaborate celebrations for the royal ladies.',
    purpose:
      'Hariyali Teej celebrates the arrival of the monsoon season, the divine love of Shiva and Parvati, and the sacred institution of marriage. The green color symbolizes the lush vegetation that arrives with the rains. Women fast and pray for the longevity and prosperity of their husbands, emulating Parvati\'s devotion to Shiva. The festival also celebrates the beauty of nature during the monsoon and encourages women to express their joy through dance, music, and traditional celebrations.',
    importance:
      'Hariyali Teej is widely celebrated in North India, particularly in Rajasthan, Uttar Pradesh, Bihar, and Haryana. In Rajasthan, the festival is a major cultural event with elaborate swings, traditional dances, and fairs. The festival holds social significance as it provides women an opportunity for celebration and community bonding. Hariyali Teej promotes traditional arts and crafts, as women wear new clothes, jewelry, and henna designs. The festival also has economic significance, driving demand for traditional clothing, jewelry, and decorative items.',
    celebration:
      'Hariyali Teej celebrations are particularly elaborate in Rajasthan. Women dress in green clothes, apply henna (mehndi) on their hands, and wear traditional jewelry. They gather at temples and community spaces to swing on decorated swings (jhulas) and perform traditional Teej dances. Fasting is central to the celebrations, with women abstaining from food and water for the day. In temples, special pujas are performed, and the story of Parvati and Shiva is recited. In some regions, processions with decorated idols of Parvati and Shiva are organized. Traditional Teej songs and folk music fill the air.',
    mantra:
      'The primary Hariyali Teej mantra is: "Om Namah Shivaya" (I bow to Lord Shiva). Women recite the Parvati mantra: "Om Parvatyai Namah" for marital bliss. The Shiva-Parvati wedding prayers are chanted during temple ceremonies. Devotees also sing traditional Teej songs like "Teej Ke Geet" and "Hariyali Teej Aayo Re." The mantra "Om Shree Shiva-Parvati Abhinandanam" is recited to honor the divine couple.',
  },

  'holika dahan': {
    summary:
      'Holika Dahan, also known as Chhoti Holi, is celebrated on the eve of Holi, on the full moon day of the month of Phalguna (February-March). The festival commemorates the burning of the demoness Holika and the divine protection of Prahlad, a devotee of Lord Vishnu. Large bonfires are lit in communities, symbolizing the destruction of evil and the triumph of good. The next day is celebrated as Dhulandi (Rangwali Holi), when people play with colors. Holika Dahan is particularly significant in North India, where communities gather around the bonfires for prayers and rituals.',
    origin:
      'Holika Dahan originates from the Bhagavata Purana story of Prahlad and Holika. The demon king Hiranyakashipu wanted everyone to worship him, but his son Prahlad remained devoted to Lord Vishnu. Hiranyakashipu\'s sister Holika, who had a boon of immunity from fire, sat on a pyre with Prahlad to kill him. However, her boon worked only when she sat alone, and the fire consumed her while Prahlad survived, protected by Vishnu\'s divine grace. This event is commemorated as Holika Dahan, symbolizing the victory of devotion over tyranny.',
    purpose:
      'Holika Dahan symbolizes the destruction of evil and the protection of the righteous. The bonfire represents the burning of negative qualities like anger, hatred, and ego. The festival serves as a reminder that divine protection is always available to those who remain devoted and righteous. Holika Dahan also marks the transition from winter to spring, as communities gather around the warmth of the fire. The next day\'s color celebration (Dhulandi) represents the joy and renewal that comes after overcoming adversity.',
    importance:
      'Holika Dahan is celebrated across India with great fervor, particularly in North India. The festival holds cultural significance as it preserves the ancient tradition of fire worship and community gathering. The bonfires serve as focal points for community bonding, as people from all backgrounds come together to celebrate. Holika Dahan also marks the beginning of the festive Holi celebrations, setting a tone of joy and renewal. The festival promotes the values of faith, protection, and the triumph of good over evil.',
    celebration:
      'Holika Dahan celebrations begin with communities gathering wood and combustible materials to build large bonfires. In the evening, the bonfires are lit with great ceremony, and people offer grains, coconuts, and other items into the flames. Prayers are performed around the fire, and people circumambulate the bonfire. In many regions, people sing and dance around the fire, celebrating the victory of good. The next morning, people collect the sacred ash (vibhuti) from the bonfire, which is considered auspicious. In some areas, the ritual of Holika includes symbolic burning of effigies of evil.',
    mantra:
      'The primary Holika Dahan mantra is: "Holika Dahan Shubh Muhurat Parv Ka Vidhan, Bura Ka Naash Ho, Achhai Ki Jeet Ho" (May the auspicious occasion of Holika Dahan destroy evil and establish the victory of good). Devotees chant "Om Jai Shri Ram" and "Om Namah Shivaya" during the bonfire ceremony. The Prahlad prayer "Om Namo Narayanaya" is recited to invoke divine protection. Traditional Holika Dahan songs and bhajans are sung around the bonfire.',
  },

  'jagannath rath yatra': {
    summary:
      'Jagannath Rath Yatra, the Festival of Chariots, is one of the most spectacular Hindu festivals celebrated in Puri, Odisha. The annual procession features Lord Jagannath, his brother Balabhadra, and sister Subhadra being carried in massive wooden chariots (Raths) through the streets of Puri to the Gundicha Temple. The main chariot of Lord Jagannath (Nandighosa) stands 45 feet tall and is pulled by millions of devotees. The festival attracts millions of pilgrims from around the world and is one of the oldest and largest chariot festivals in existence.',
    origin:
      'Jagannath Rath Yatra\'s origins are documented in the Puranas and the Jagannath temple traditions. According to legend, the tradition began when Lord Jagannath expressed his desire to visit his birthplace (Gundicha Temple) annually. The chariot procession recreates this divine journey. The Jagannath temple in Puri was established by King Indradyumna in ancient times, and the Rath Yatra has been celebrated for over 2,000 years. The festival gained historical significance during the Ganga dynasty and has continued uninterrupted through various periods of Indian history.',
    purpose:
      'Rath Yatra celebrates Lord Jagannath\'s annual journey to the Gundicha Temple, symbolizing the divine visit to his birthplace. The chariot procession allows devotees who cannot enter the temple to receive the Lord\'s blessings by pulling the chariot ropes. The festival emphasizes the accessibility of the divine and the importance of community participation in worship. It also marks the beginning of the annual cycle of temple rituals and festivals.',
    importance:
      'Jagannath Rath Yatra is one of the most important and largest chariot festivals in the world. It is one of the few Hindu festivals where the deities leave the temple and come to the people. The festival attracts millions of pilgrims to Puri, making it one of the largest religious gatherings in India. Rath Yatra has been recognized as an Intangible Cultural Heritage by UNESCO. The festival promotes Odisha\'s cultural identity and serves as a platform for traditional performing arts.',
    celebration:
      'Rath Yatra celebrations begin with the ceremonial bathing of the deities (Snana Yatra) and their subsequent recuperation period. On the main day, the three massive chariots are pulled through the streets of Puri to the Gundicha Temple, where the deities stay for seven days. The chariots are constructed fresh each year from specific types of wood. Millions of devotees pull the chariot ropes, believing this act will grant them liberation. The deities return to the main temple (Bahuda Yatra) after seven days. Traditional music, dance, and cultural performances accompany the entire procession.',
    mantra:
      'The primary Rath Yatra mantra is: "Jai Jagannath, Jai Baladeva, Jai Subhadra" (Victory to Lord Jagannath, Baladeva, and Subhadra). Devotees chant "Nila Shaila Natha, Jagannatha Deva" while pulling the chariot. The Jagannath Ashtakam is recited during temple ceremonies. The mantra "Om Namo Jagannathaya" is widely chanted by pilgrims. Traditional Odia devotional songs praising Lord Jagannath fill the air during the procession.',
  },

  'hindi new year': {
    summary:
      'Hindi New Year, also known as Nav Samvatsar or Chaitra Sukhladi, marks the first day of the Hindu lunar calendar month of Chaitra (March-April). It is celebrated as the New Year across North India and is associated with the legend of Lord Brahma creating the universe. The festival signifies new beginnings, fresh starts, and the triumph of good over evil. Devotees decorate their homes, prepare traditional foods, and visit temples for special prayers.',
    origin:
      'Hindi New Year has origins linked to the creation of the universe by Lord Brahma. According to tradition, Brahma created the universe on this day, and the Vikram Samvat calendar began. The festival also commemorates the victory of King Vikramaditya over the Sakas. In North India, it is celebrated as the beginning of the Hindu New Year and is associated with various regional traditions.',
    purpose:
      'The festival marks new beginnings and fresh starts. It is a time for reflection on the past year and setting intentions for the year ahead. Devotees worship for prosperity, health, and happiness in the coming year.',
    importance:
      'Hindi New Year is celebrated across North India and among the global Hindu community. It holds cultural significance as it marks the beginning of the Vikram Samvat calendar.',
    celebration:
      'Celebrations include decorating homes with rangoli, preparing traditional sweets, visiting temples, and performing special pujas. Families gather for festive meals and exchange New Year greetings.',
    mantra:
      'Devotees chant "Om Jai Jagdish Hare" and the Gayatri Mantra for a prosperous new year.',
  },

  'kajari teej': {
    summary:
      'Kajari Teej, also known as Kajli Teej, is celebrated on the third day of the dark half of the month of Bhadrapada (August-September). The festival is particularly significant in Rajasthan and Uttar Pradesh, where women observe fasts and pray for the well-being of their husbands. The festival marks the beginning of the monsoon season and is celebrated with traditional songs, dances, and swings.',
    origin:
      'Kajari Teej originates from the legend of Goddess Parvati\'s devotion to Lord Shiva. According to tradition, Parvati observed a strict fast on this day to win Shiva as her husband. The festival also has agricultural significance, marking the arrival of the monsoon.',
    purpose:
      'The festival celebrates the arrival of the monsoon and the sacred bond of marriage. Women fast and pray for their husbands\' long life and prosperity.',
    importance:
      'Kajari Teej is an important festival in Rajasthan and Uttar Pradesh, where it is celebrated with great enthusiasm by women.',
    celebration:
      'Women observe strict fasts, wear colorful clothes, and gather to sing traditional Kajari songs. Swings are set up in homes and gardens, and women enjoy swinging while singing.',
    mantra:
      'Women recite the Shiva mantra "Om Namah Shivaya" and prayers for marital bliss.',
  },

  'kartik purnima': {
    summary:
      'Kartik Purnima, celebrated on the full moon day of the month of Kartik (October-November), is one of the most sacred days in the Hindu calendar. The festival is dedicated to Lord Vishnu and marks the conclusion of the four-month Chaturmas period. Devotees take holy baths in sacred rivers, perform ritualistic prayers, and light lamps. The day is also significant for Jains, as it marks the birth of Mahavira. In Varanasi, the Dev Deepawali celebration on Kartik Purnima features millions of oil lamps lit along the Ganges.',
    origin:
      'Kartik Purnima has ancient origins documented in the Puranas. According to legend, Lord Brahma performed the cosmic creation on this day. The festival also marks the day Lord Vishnu returned to his cosmic abode after his Chaturmas sleep. In Varanasi, the Dev Deepawali tradition dates back to ancient times, when the gods themselves lit lamps to celebrate the return of Lord Shiva to the city. For Jains, Kartik Purnima is the birth anniversary of Lord Mahavira.',
    purpose:
      'Kartik Purnima celebrates the conclusion of the Chaturmas period and the return of Lord Vishnu to his cosmic activities. The lighting of lamps symbolizes the victory of light over darkness. The holy bath is believed to cleanse sins and purify the soul. The festival also marks the end of the monsoon season and the beginning of the festive season.',
    importance:
      'Kartik Purnima holds immense religious significance for Hindus, Jains, and Sikhs. The Dev Deepawali in Varanasi has gained global recognition as one of the most spectacular light festivals. The day is considered highly auspicious for spiritual practices and pilgrimage.',
    celebration:
      'Celebrations include taking holy dips in sacred rivers, especially the Ganges, Yamuna, and Godavari. In Varanasi, the Dev Deepawali features millions of oil lamps lit along the riverbanks and ghats. Devotees perform Ganga Aarti and offer prayers. Temples are illuminated, and special pujas are performed. In homes, families light lamps and prepare traditional sweets.',
    mantra:
      'Devotees chant the Vishnu mantra "Om Namo Narayanaya" and "Om Namo Bhagavate Vasudevaya." The Gayatri Mantra is recited for spiritual merit. In Varanasi, the Ganga Aarti mantra is chanted during the spectacular evening ceremony.',
  },

  'karva chauth': {
    summary:
      'Karva Chauth is a sacred festival observed by married Hindu women on the fourth day (Chaturthi) of the dark fortnight in the month of Kartik (October-November). Women observe a strict fast from sunrise to moonrise, praying for the long life and prosperity of their husbands. The festival is celebrated with great enthusiasm in North India, particularly in Rajasthan, Uttar Pradesh, Punjab, and Haryana. Women dress in their finest clothes, apply henna, and gather in the evening to break their fast after sighting the moon.',
    origin:
      'Karva Chauth has origins linked to the legend of Queen Veervati. According to the Mahabharata, Veervati was a devoted wife who observed a strict fast on Karva Chauth. When she was unable to bear the thirst, her brothers lit a fire on a mountain and told her the moon had risen. She broke her fast, but her husband died. Upon learning the truth, she prayed to Goddess Parvati, who restored her husband\'s life. Another legend connects the festival to the story of Savitri, who brought her husband Satyavan back from death through her devotion.',
    purpose:
      'Karva Chauth celebrates the sacred bond of marriage and the devotion of wives to their husbands. The strict fast symbolizes love, sacrifice, and commitment. The festival reinforces the importance of marital fidelity and the spiritual connection between husband and wife. It also serves as a time for women to bond and share their experiences.',
    importance:
      'Karva Chauth is one of the most widely observed festivals in North India, particularly among married women. The festival has gained cultural significance beyond its religious origins, with many women observing the fast as a symbol of love and commitment. The festival promotes traditional values and the sanctity of marriage.',
    celebration:
      'Celebrations begin before sunrise, when women eat a pre-dawn meal (Sargi) prepared by their mothers-in-law. They then fast without food or water until moonrise. In the evening, women gather at temples or community spaces, dressed in colorful clothes and jewelry. They perform the Karva Chauth puja, listening to the festival\'s story. When the moon rises, women view it through a sieve, break their fast, and share sweets with their families. H gifts and appreciation are exchanged.',
    mantra:
      'Women recite the Karva Chauth Vrat Katha (story) and the Karva Chauth mantra. The prayer "Om Jai Shri Ram" and "Om Namah Shivaya" are chanted. The Sargi mantra and prayers for husbands\' longevity are recited during the puja ceremony.',
  },

  'magh bihu': {
    summary:
      'Magh Bihu, also known as Bhogali Bihu, is a harvest festival celebrated in Assam in mid-January (Magh month). It marks the end of the harvesting season and the beginning of the new agricultural cycle. The festival is celebrated with traditional feasts, community gatherings, and the burning of Mejis (temporary huts). Magh Bihu showcases Assam\'s rich culinary traditions with elaborate meals featuring traditional Assamese dishes.',
    origin:
      'Magh Bihu has ancient origins rooted in agricultural traditions. The festival celebrates the successful completion of the harvest season and expresses gratitude to the earth for its bounty. The tradition of building and burning Mejis originates from ancient fire worship practices. Magh Bihu has been celebrated for centuries as a community festival that strengthens social bonds.',
    purpose:
      'Magh Bihu celebrates the harvest season and expresses gratitude for agricultural abundance. The festival marks the transition from the harvesting period to the preparation of new fields. It serves as a time for community bonding, feasting, and celebration.',
    importance:
      'Magh Bihu is one of the most important festivals in Assam, celebrated with great enthusiasm across the state. The festival promotes Assamese culinary traditions and cultural practices.',
    celebration:
      'Celebrations begin the night before with the construction of Mejis (temporary huts) from bamboo and thatch. On the main day, families gather for elaborate feasts featuring traditional Assamese dishes. In the morning, the Mejis are burned, symbolizing the end of the old year. People visit relatives, exchange gifts, and enjoy traditional games and cultural performances.',
    mantra:
      'Devotees offer prayers to Mother Earth and the agricultural deities. Traditional Assamese Bihu songs are sung to celebrate the harvest.',
  },

  'maha navami': {
    summary:
      'Maha Navami is the ninth day of Navratri and the penultimate day of Durga Puja celebrations. It is one of the most important days of the Navratri festival, dedicated to Goddess Durga in her warrior form. The day commemorates the victory of the Goddess over the buffalo demon Mahishasura. Devotees observe strict fasts, perform elaborate pujas, and participate in temple celebrations. In Bengal, Maha Navami is marked by the Sandhi Puja and Kanya Pujan ceremonies.',
    origin:
      'Maha Navami commemorates the climax of the battle between Goddess Durga and Mahishasura. According to the Devi Mahatmya, on this day Durga received divine weapons from various gods and finally slew the buffalo demon. The Sandhi Puja tradition marks the junction of the eighth and ninth lunar days, when Durga is believed to have destroyed the demon.',
    purpose:
      'Maha Navami celebrates the divine victory of good over evil and the power of the feminine divine. The day is considered highly auspicious for spiritual practices and penance.',
    importance:
      'Maha Navami is one of the most important days of Navratri, particularly in Bengal and other eastern Indian states. The Sandhi Puja ceremony is a major event attended by thousands of devotees.',
    celebration:
      'Celebrations include elaborate pujas, Sandhi Puja (worship at the junction of Ashtami and Navami), and Kanya Pujan. In Bengal, the day is marked by cultural programs and immersion preparations. Devotees observe strict fasts and perform special rituals.',
    mantra:
      'Devotees chant the Durga Saptashati and the Mahishasura Mardini Stotram. The mantra "Ya Devi Sarva Bhuteshu Shakti Rupena Samsthita" is widely recited.',
  },

  'maha saptami': {
    summary:
      'Maha Saptami is the seventh day of Navratri and marks the beginning of the main Durga Puja celebrations in Bengal. The day is dedicated to Goddess Durga and commemorates the beginning of her battle against Mahishasura. Devotees observe the Nabapatrika ritual, where nine plants representing the nine forms of Durga are worshipped. The day is marked by elaborate pandal decorations, cultural programs, and traditional rituals.',
    origin:
      'Maha Saptami commemorates the beginning of the battle between Goddess Durga and Mahishasura, as described in the Devi Mahatmya. The Nabapatrika tradition has ancient roots in nature worship and the崇拜 of the divine feminine in various plant forms.',
    purpose:
      'The festival marks the beginning of the main Durga Puja celebrations and honors the divine feminine power that destroys evil.',
    importance:
      'Maha Saptami is the first of the four main days of Durga Puja in Bengal, marking the start of elaborate celebrations.',
    celebration:
      'Celebrations include the Nabapatrika ritual, elaborate pandal decorations, cultural programs, and community gatherings. The day is marked by traditional music, dance, and devotional singing.',
    mantra:
      'Devotees chant the Durga Saptashati and "Ya Devi Sarva Bhuteshu Shakti Rupena Samsthita" mantra.',
  },

  'mahalaya amavasya': {
    summary:
      'Mahalaya Amavasya, also known as Sarvapitri Amavasya, is observed on the new moon day in the month of Ashwin (September-October). It is the most important day for performing Shraddha (ancestor worship) rituals. Devotees perform rituals to honor their ancestors and seek their blessings. The day marks the beginning of the Devi Paksha and the end of the Pitru Paksha period. In Bengal, Mahalaya is celebrated with the early morning recitation of Chandi Path and the beginning of Durga Puja preparations.',
    origin:
      'Mahalaya Amavasya has origins in the ancient tradition of ancestor worship. According to the Garuda Purana, the Shraddha rituals performed on this day bring peace to the departed souls. In Bengal, the tradition of Mahalaya Chandi Path dates back to the 1930s when it was first broadcast on All India Radio. The day also marks the beginning of the Devi Paksha, when Goddess Durga begins her journey from Mount Kailash.',
    purpose:
      'The festival honors ancestors and seeks their blessings for the well-being of living family members. It marks the beginning of Durga Puja preparations and the start of the festive season.',
    importance:
      'Mahalaya is one of the most important days for ancestor worship in Hinduism. In Bengal, it marks the official beginning of the Durga Puja season.',
    celebration:
      'Devotees perform Shraddha rituals for their ancestors, offering food, water, and prayers. In Bengal, the day begins with the early morning recitation of Chandi Path on All India Radio. Families gather for special pujas and begin preparations for Durga Puja.',
    mantra:
      'Devotees chant the Chandi Path, Durga Saptashati, and mantras for the peace of departed souls. The mantra "Om Pitrabhyah Swadha Namah" is recited during Shraddha rituals.',
  },

  'maharishi valmiki jayanti': {
    summary:
      'Maharishi Valmiki Jayanti, also known as Valmiki Prakatotsav, celebrates the birth anniversary of Maharishi Valmiki, the author of the epic Ramayana and the first poet (Adi Kavi) of Sanskrit literature. Celebrated on the full moon day (Purnima) in the month of Ashwin (September-October), the festival honors Valmiki\'s contribution to Indian literature and spirituality. Devotees recite the Ramayana, visit temples dedicated to Valmiki, and organize cultural programs highlighting his teachings.',
    origin:
      'Maharishi Valmiki Jayanti commemorates the birth of the sage who authored the Ramayana. According to tradition, Valmiki was born as a tribal hunter named Ratnakar, who was transformed into a sage through divine grace. The festival also honors his contribution as the Adi Kavi who composed the first sloka (verse) in Sanskrit. The Valmiki Ramayana is one of the most revered texts in Hinduism.',
    purpose:
      'The festival honors the legacy of Maharishi Valmiki and his contributions to Indian literature, philosophy, and spirituality. It serves as a reminder of the power of transformation and the importance of devotion.',
    importance:
      'Valmiki Jayanti is celebrated across India, particularly by the Valmiki community and Sanskrit scholars. The festival promotes the study of the Ramayana and Valmiki\'s teachings.',
    celebration:
      'Celebrations include recitation of the Ramayana, visits to Valmiki temples, and cultural programs featuring performances of the Ramayana story. Devotees perform special pujas and organize community feasts.',
    mantra:
      'Devotees recite verses from the Valmiki Ramayana and chant "Om Maharishaye Valmiki Namah." The Hanuman Chalisa and Ram Dhun are also widely recited.',
  },

  'nag panchami': {
    summary:
      'Nag Panchami is a sacred festival dedicated to the worship of Nagas (serpent deities), celebrated on the fifth day (Panchami) of the bright half of the month of Shravan (July-August). The festival is observed across India, particularly in Maharashtra, Karnataka, and North India. Devotees offer milk, flowers, and prayers to snake idols and images. The festival honors the serpent deities for their role in agriculture and their association with Lord Shiva. In many regions, snake charmers bring live cobras for worship.',
    origin:
      'Nag Panchami has ancient origins linked to the worship of serpent deities in Indian culture. According to legend, the Nagas (serpent beings) are descendants of Kadru, the wife of sage Kashyapa. The Mahabharata describes the great Naga-war between King Janamejaya and the serpent race. In Maharashtra, the festival is associated with the legends of the Peshwa period. The tradition of worshipping snakes on this day is believed to protect against snake bites and bring prosperity.',
    purpose:
      'Nag Panchami honors the serpent deities and seeks their protection and blessings. The festival serves as a reminder of the importance of coexisting with nature and all its creatures. It is believed that worshipping Nagas on this day protects against snake bites and brings prosperity.',
    importance:
      'Nag Panchami is widely celebrated across India, particularly in Maharashtra and Karnataka. The festival holds cultural significance as it preserves the ancient tradition of serpent worship.',
    celebration:
      'Devotees visit temples dedicated to Nagas and offer milk, flowers, and prayers. In many regions, snake charmers bring live cobras for worship. Homes are decorated with images of Nagas, and special pujas are performed. In Maharashtra, the festival is celebrated with great enthusiasm in rural areas.',
    mantra:
      'Devotees chant "Om Naga Rajaya Namah" and the Naga mantra: "Om Sarpa Bhyo Namah." The Naga Stotram is recited during worship ceremonies.',
  },

  'ram navami': {
    summary:
      'Ram Navami celebrates the birth of Lord Rama, the seventh avatar of Lord Vishnu and the protagonist of the epic Ramayana. Celebrated on the ninth day (Navami) of the bright half of the month of Chaitra (March-April), it marks the birth of the ideal king, husband, and son. The festival is celebrated with great devotion across India, with elaborate celebrations in Ayodhya (Rama\'s birthplace), Rameshwaram, and other cities associated with Rama\'s life. Devotees recite the Ramayana, perform Ramlila, and visit temples dedicated to Lord Rama.',
    origin:
      'Ram Navami commemorates the divine birth of Lord Rama in Ayodhya to King Dasharatha and Queen Kausalya. According to the Ramayana, Rama was born on the Navami tithi of Chaitra Shukla Paksha at noon. The festival has been celebrated since ancient times, with historical records documenting grand celebrations in Ayodhya during the Gupta period. The tradition of Ramlila performances dates back to the medieval period and was popularized during the Bhakti movement.',
    purpose:
      'Ram Navami celebrates the birth of Lord Rama, who embodies dharma (righteousness), truth, and compassion. The festival serves as a reminder of the importance of living a life guided by moral principles and duty. It also celebrates the ideal family values and governance that Rama exemplified.',
    importance:
      'Ram Navami is one of the most important Hindu festivals, celebrated across India with great devotion. Ayodhya, Rama\'s birthplace, is one of the holiest cities in Hinduism and attracts millions of pilgrims during Ram Navami.',
    celebration:
      'Celebrations begin with early morning prayers and special pujas at Rama temples. In Ayodhya, the festival features elaborate celebrations with the Ramlila performances, processions, and the illumination of the city. Devotees recite the Ramayana, perform aarti, and visit temples. In homes, families perform special pujas and prepare traditional sweets. The day is marked by devotional singing and cultural programs.',
    mantra:
      'The primary Ram Navami mantra is: "Om Jai Shri Ram" (Victory to Lord Rama). Devotees chant the Ram Raksha Stotram and the Aditya Hridayam. The Ram Dhun "Shri Ram Jai Ram Jai Jai Ram" is widely sung. The Hanuman Chalisa is also recited as Hanuman is Rama\'s greatest devotee.',
  },

  'savitri pooja': {
    summary:
      'Savitri Pooja, also known as Vat Savitri Vrat, is observed by married Hindu women for the longevity and well-being of their husbands. Celebrated on the Amavasya (new moon) in the month of Jyeshtha (May-June), the festival commemorates the story of Savitri, who brought her husband Satyavan back from the clutches of death through her devotion and intelligence. Women observe fasts, perform puja around the Banyan tree, and recite the Savitri story.',
    origin:
      'Savitri Pooja originates from the Mahabharata story of Savitri and Satyavan. According to the legend, Savitri chose Satyavan as her husband despite a prophecy that he would die within a year. When Yama (the god of death) came to take Satyavan, Savitri followed and used her intelligence and devotion to bring her husband back from death. The tradition of performing puja under the Banyan tree is linked to the story, where Savitri tied a sacred thread around the Banyan tree.',
    purpose:
      'Savitri Pooja celebrates the power of devotion, intelligence, and marital fidelity. The festival serves as an inspiration for women to pray for their husbands\' well-being and to emulate Savitri\'s devotion.',
    importance:
      'Savitri Pooja is widely observed by married women across India, particularly in Maharashtra, Gujarat, and North India. The festival promotes the values of devotion and commitment in marriage.',
    celebration:
      'Women observe strict fasts and gather under Banyan trees to perform the Savitri Puja. They tie sacred threads around the tree and recite the Savitri story. Special prayers are performed, and traditional sweets are distributed.',
    mantra:
      'Women recite the Savitri Vrat Katha and chant mantras for their husbands\' longevity. The mantra "Om Jai Savitri Mata" is widely sung during the puja.',
  },

  'sharad navratri': {
    summary:
      'Sharad Navratri, meaning "Autumn Nine Nights," is the most widely celebrated Navratri festival, falling in September-October. Dedicated to Goddess Durga and her nine forms, it is celebrated with Garba and Dandiya Raas dances in Gujarat, Durga Puja in Bengal, and various regional traditions across India. The festival culminates on Vijayadashami (Dussehra), celebrating the victory of good over evil. Sharad Navratri is one of the most vibrant and colorful festivals in the Hindu calendar.',
    origin:
      'Sharad Navratri\'s origins are documented in the Markandeya Purana and other sacred texts. According to legend, Goddess Durga fought the buffalo demon Mahishasura for nine nights and defeated him on the tenth day. The festival also connects to Lord Rama\'s worship of Durga before defeating Ravana. The Garba tradition of Gujarat has ancient roots in folk worship practices.',
    purpose:
      'Sharad Navratri celebrates the divine feminine power (Shakti) and the triumph of good over evil. The nine nights are dedicated to the nine forms of Durga, each representing different aspects of divine energy.',
    importance:
      'Sharad Navratri is the most widely celebrated Navratri festival in India. The Garba and Dandiya Raas of Gujarat are world-famous cultural events.',
    celebration:
      'Celebrations vary by region. In Gujarat, evenings feature Garba circles and Dandiya Raas performances. In Bengal, Durga Puja transforms the city with elaborate pandals. In North India, Ramlila performances and Dussehra celebrations mark the festival.',
    mantra:
      'Devotees chant "Ya Devi Sarva Bhuteshu Shakti Rupena Samsthita" and "Om Jai Ambe Gauri." The Durga Saptashati is recited throughout the nine nights.',
  },

  'sharad purnima': {
    summary:
      'Sharad Purnima, also known as Kojagiri Purnima, is celebrated on the full moon day in the month of Ashwin (September-October). The festival marks the end of the monsoon season and the beginning of autumn. It is believed that on this night, the moon showers Amrit (nectar) on earth. Devotees stay awake through the night, sing devotional songs, and prepare Kheer (rice pudding) under the moonlight. The festival is particularly significant in Maharashtra and West Bengal.',
    origin:
      'Sharad Purnima has origins linked to the moon\'s worship and the transition of seasons. According to legend, Goddess Lakshmi descends to earth on this night and visits homes that are clean and well-lit. The tradition of preparing Kheer under moonlight originates from the belief that the moon\'s rays on this night have healing properties. In Bengal, the festival marks the beginning of the autumnal festive season.',
    purpose:
      'Sharad Purnima celebrates the end of the monsoon season and the arrival of autumn. The night-long vigil and Kheer preparation symbolize devotion and gratitude for the harvest.',
    importance:
      'Sharad Purnima is an important festival in Maharashtra and West Bengal. The night-long celebrations and Kheer preparation are unique cultural traditions.',
    celebration:
      'Devotees stay awake through the night, singing devotional songs and playing games. Kheer is prepared and left under the moonlight to absorb its rays. In the morning, the blessed Kheer is distributed. Homes are cleaned and decorated, and prayers are offered to Goddess Lakshmi.',
    mantra:
      'Devotees chant "Om Shreem Mahalakshmiyei Namah" and the Lakshmi mantra. The "Kojagiri Lakshmi Vrat Katha" is recited during the night-long vigil.',
  },

  'thaipusam': {
    summary:
      'Thaipusam is a Tamil Hindu festival dedicated to Lord Murugan (Kartikeya), celebrated on the full moon day in the month of Thai (January-February). The festival commemorates the day Goddess Parvati gave Lord Murugan the divine spear (Vel) to destroy the demon Soorapadman. Devotees perform extreme acts of devotion, including carrying Kavadis (ornamental structures) and piercing their bodies with hooks and skewers. The festival is particularly significant in Tamil Nadu, Sri Lanka, Malaysia, and Singapore.',
    origin:
      'Thaipusam commemorates the day Goddess Parvati gifted the divine Vel (spear) to Lord Murugan. According to legend, the demon Soorapadman was causing havoc, and the gods were unable to defeat him. Parvati created the Vel and gave it to Murugan, who destroyed Soorapadman. The tradition of carrying Kavadis originated from the story of a devotee who carried a boulder on his head to offer to Murugan.',
    purpose:
      'Thaipusam celebrates the victory of good over evil and the power of divine grace. The extreme acts of devotion symbolize the devotee\'s willingness to sacrifice everything for the divine.',
    importance:
      'Thaipusam is one of the most important Tamil Hindu festivals, with massive celebrations in Tamil Nadu and among the Tamil diaspora worldwide.',
    celebration:
      'Devotees observe strict fasts and perform acts of penance. Many carry Kavadis — ornamental structures decorated with flowers and peacock feathers. Some devotees pierce their bodies with hooks, skewers, and spears as acts of devotion. The festival features elaborate processions to Murugan temples, accompanied by traditional music and drumming.',
    mantra:
      'Devotees chant "Om Saravanabhava" and the Murugan mantra "Om Skandaya Namah." The Thirupugazh hymns praising Lord Murugan are widely sung.',
  },

  'vaisakhi': {
    summary:
      'Vaisakhi, also known as Baisakhi, is celebrated on April 13th or 14th to mark the Punjabi New Year and the harvest season. For Sikhs, it commemorates the establishment of the Khalsa by Guru Gobind Singh in 1699. The festival is celebrated with great enthusiasm in Punjab, with Bhangra and Giddha dances, fairs, and processions. In other parts of India, it is celebrated as the solar new year and harvest festival.',
    origin:
      'Vaisakhi has ancient origins as a harvest festival in Punjab. For Sikhs, it holds special significance as the day Guru Gobind Singh established the Khalsa (order of the pure) in 1699 at Anandpur Sahib. The festival also marks the beginning of the solar calendar year in many parts of India.',
    purpose:
      'Vaisakhi celebrates the harvest season, the Punjabi New Year, and (for Sikhs) the establishment of the Khalsa. The festival expresses gratitude for agricultural abundance and marks new beginnings.',
    importance:
      'Vaisakhi is one of the most important festivals in Punjab, celebrated with great enthusiasm by Punjabis worldwide. For Sikhs, it holds immense religious significance.',
    celebration:
      'Celebrations in Punjab include Bhangra and Giddha dances, fairs, processions, and the decoration of Gurdwaras. In Sikh communities, Nagar Kirtan (processions) are organized, and langars (community meals) are served. Families gather for festive meals and celebrations.',
    mantra:
      'Sikhs recite Gurbani and sing hymns from the Guru Granth Sahib. The mantra "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh" is chanted during processions.',
  },

  'vasant panchami': {
    summary:
      'Vasant Panchami, celebrated on the fifth day of the bright half of the month of Magha (January-February), marks the arrival of spring and honors Goddess Saraswati, the deity of knowledge, music, and arts. The festival is celebrated with yellow-themed decorations, as yellow symbolizes the blooming mustard fields and the vibrancy of spring. Devotees worship Saraswati, children begin their education, and the day is considered auspicious for starting new ventures. In Punjab, it is celebrated as the beginning of the spring festival season.',
    origin:
      'Vasant Panchami has ancient origins linked to the seasonal transition and the worship of Goddess Saraswati. According to legend, Brahma created the universe on this day and Saraswati emerged from his mouth to provide knowledge and wisdom. The festival has been celebrated since ancient times as a day for beginning new learning and creative pursuits.',
    purpose:
      'Vasant Panchami honors Goddess Saraswati and celebrates the arrival of spring. The festival marks new beginnings in education and creative endeavors. The yellow color symbolizes energy, prosperity, and the blooming of nature.',
    importance:
      'Vasant Panchami is celebrated across India with regional variations. It is particularly important for students, musicians, and artists who worship Saraswati for wisdom and creativity.',
    celebration:
      'Devotees wear yellow clothes and decorate their homes with yellow flowers. Children are initiated into learning (Vidyarambham). Special pujas are performed for Goddess Saraswati, and musical instruments are worshipped. In Punjab, the festival marks the beginning of the Basant Panchami fair season.',
    mantra:
      'Devotees chant the Saraswati mantra: "Om Aim Saraswatyai Namah" (I bow to Goddess Saraswati). The Saraswati Stotram and "Ya Kundendu Tushara Hara Dhavala" are recited during worship.',
  },

  'vishwakarma puja': {
    summary:
      'Vishwakarma Puja, also known as Vishwakarma Jayanti, celebrates the birth anniversary of Lord Vishwakarma, the divine architect and engineer of the gods. Celebrated on September 17th (the last day of the Bengali calendar), the festival honors craftsmen, engineers, and workers. Tools, machinery, and workshops are worshipped on this day. The festival is particularly significant in Bengal, Odisha, and among industrial communities.',
    origin:
      'Vishwakarma Puja commemorates the birth of Lord Vishwakarma, the divine architect who built the city of Dwarka, the weapons of the gods, and the flying vehicle Vimana. According to the Puranas, Vishwakarma created the universe and built the city of Lanka for Ravana. The tradition of worshipping tools on this day has ancient roots in the reverence for craftsmanship.',
    purpose:
      'The festival honors the divine architect and celebrates the dignity of labor and craftsmanship. It serves as a reminder of the importance of skilled work and the creative spirit.',
    importance:
      'Vishwakarma Puja is an important festival in Bengal, Odisha, and among industrial communities. The festival promotes the values of craftsmanship and the dignity of labor.',
    celebration:
      'Workers worship their tools, machinery, and workshops. Special pujas are performed in factories and workshops. The day is marked by prayers for protection and prosperity in work. In Bengal, the festival coincides with the last day of the Bengali calendar.',
    mantra:
      'Devotees chant "Om Vishwakarmaya Namah" (I bow to Lord Vishwakarma) and prayers for protection of tools and machinery. The Vishwakarma Stotram is recited during worship.',
  },
};

export default festivalEnrichments;
export type { FestivalEnrichment };
