import { PDFDocument, StandardFonts, PDFString, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import qrcode from 'qrcode-generator';
import util from 'tweetnacl-util';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share as RNShare, Platform } from 'react-native';
import { Asset } from 'expo-asset';

// Clean text to safe ASCII printable characters to prevent PDF encoding crashes
export function cleanTextForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\t\n\r]/g, '')
    .trim();
}

// Helper to word-wrap text to fit within a given maximum width
export function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export interface StoryChapter {
  id: number;
  title: string;
  content: string;
}

export function getFestivalChapters(festival: any, sectionValue?: string): {
  festivalName: string;
  subtitle: string;
  deity: string;
  date: string;
  tradition: string;
  chapters: StoryChapter[];
  blessing: string;
} {
  const festivalName = (festival?.festival_name || festival?.name || festival?.title || 'Sacred Festival').trim();
  const lowerName = festivalName.toLowerCase();

  const isHariyaliTeej = lowerName.includes('hariyali');
  const isKajariTeej = lowerName.includes('kajari') || lowerName.includes('badi teej') || lowerName.includes('satudi');
  const isTeej = (isHariyaliTeej || isKajariTeej || lowerName.includes('teej')) && !isKajariTeej;
  const isNagPanchami = lowerName.includes('nag') || lowerName.includes('panchami');
  const isOnam = lowerName.includes('onam');
  const isRakshaBandhan = lowerName.includes('raksha') || lowerName.includes('bandhan');
  const isJanmashtami = lowerName.includes('janmashtami') || lowerName.includes('krishna');
  const isGaneshChaturthi = lowerName.includes('ganesh') || lowerName.includes('vinayaka') || lowerName.includes('chaturthi');
  const isNavratri = lowerName.includes('navratri') || lowerName.includes('durga') || lowerName.includes('pooja');
  const isDiwali = lowerName.includes('diwali') || lowerName.includes('deepavali') || lowerName.includes('lakshmi');
  const isShivratri = lowerName.includes('shivratri') || lowerName.includes('mahadev');
  const isChhath = lowerName.includes('chhath');
  const isHoli = lowerName.includes('holi');
  const isMakarSankranti = lowerName.includes('makar') || lowerName.includes('sankranti') || lowerName.includes('pongal');

  const storyText = sectionValue || festival?.origin || festival?.story || festival?.summary || '';
  const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];

  let subtitle = `Sacred Origin & Divine Vrat Katha of ${festivalName}`;
  let deity = festival?.deity || festival?.deities || 'The Supreme Divine';
  let date = festival?.date || festival?.start_date || 'Auspicious Sanatan Calendar';
  let tradition = festival?.tradition || festival?.significance || 'Pooja, Vrat & Vedic Mantras';

  let chapters: StoryChapter[] = [];

  if (isHariyaliTeej) {
    subtitle = 'The Divine Union of Shiva & Parvati • Shravan Shukla Tritiya';
    deity = 'Lord Shiva & Goddess Parvati';
    tradition = 'Nirjala Fast, Green Attire & Sawan Swings';
    chapters = [
      { id: 1, title: 'The Sacred Longing', content: 'Long ago, Goddess Parvati desired Lord Shiva as her divine consort. Shiva, immersed in deep samadhi on Mount Kailash, remained detached from worldly desires. Parvati realized that only supreme, selfless devotion and austere penance could awaken his cosmic grace.' },
      { id: 2, title: '108 Lifetimes of Tapasya', content: 'Goddess Parvati embarked on severe austerities spanning 108 lifetimes across rugged mountain caves and dense Shravan forests. Renouncing all comfort, food, and water, she meditated amidst scorching summer heat, torrential monsoon rains, and freezing snows.' },
      { id: 3, title: 'Divine Reunion', content: 'Moved by her unyielding love and penance, Lord Shiva manifested before her on the third day (Tritiya) of Shravan. He accepted Parvati as his eternal divine consort, filling the universe with cosmic celebration and monsoon blooms.' },
      { id: 4, title: 'Akhand Saubhagya Blessings', content: 'Goddess Parvati decreed that any devotee observing fasts, wearing festive green bangles, and offering prayers on this holy day will be blessed with lifelong marital harmony, prosperity, and unbroken grace.' },
      { id: 5, title: 'Sawan Celebration', content: 'Women gather in courtyards wearing green and red attire, apply intricate mehndi on palms, swing on flower-decked jhulas, sing Teej folk songs, and share traditional sweets like Ghevar.' }
    ];
  } else if (isKajariTeej) {
    subtitle = 'Neem Mata Vrat, Sattu Offerings & Moon Worship • Bhadrapada';
    deity = 'Lord Shiva, Goddess Parvati & Neem Mata';
    tradition = 'Sattu Offering, Arghya to Moon & Fasting';
    chapters = [
      { id: 1, title: 'The Devoted Son', content: 'Kajari Teej (Badi Teej) falls in Bhadrapada month during dark monsoon clouds (Kajari). Legend narrates the tale of a poor Brahmin family who had no food for the sacred Teej fast. The young son risked his life at midnight to fetch Sattu (roasted flour dough) for his mother’s Neem Mata worship.' },
      { id: 2, title: 'Sacred Sattu Reward', content: 'When caught by temple guards, the poor Brahmin lad explained his mother’s holy vow to worship Neem Mata and break fast only with Sattu. Touched by his filial piety and pure devotion, the King rewarded the family with golden vessels and sattu for a lifetime.' },
      { id: 3, title: 'Moonlight Offering', content: 'On Kajari Teej evening, married women worship Neem tree branches decorated with cucumber and lamps, offering Arghya (water libation) to the rising Moon after spotting its divine glow through a sieve.' },
      { id: 4, title: 'Marital Grace & Fasting', content: 'Women observe strict Nirjala fast (without water) for the longevity of their husbands and family prosperity, breaking their fast by eating special Sattu laddus after moonrise.' },
      { id: 5, title: 'Kajari Songs & Tradition', content: 'Villages across Rajasthan, UP, and MP resonate with soulful Kajari folk songs describing monsoon rains, swings, and devotion to Goddess Parvati under starry skies.' }
    ];
  } else if (isNagPanchami) {
    subtitle = 'Serpent Reverence, Samudra Manthan & Shiva Grace • Shravan';
    deity = 'Nag Devta (Vasuki, Sheshnaag) & Lord Shiva';
    tradition = 'Milk Libation, Turmeric Drawings & Protection';
    chapters = [
      { id: 1, title: 'Serpent Reverence', content: 'Nag Panchami is dedicated to Nag Devta (serpent deities) like Vasuki, Sheshnaag, and Kaliya. Legend says a farmer accidentally disturbed a serpent nest while plowing. The mother serpent spared his daughter who offered fresh milk and prayers with pure devotion.' },
      { id: 2, title: 'Samudra Manthan & Vasuki', content: 'During the cosmic churning of the ocean (Samudra Manthan), deadly Halahala poison emerged. Lord Shiva drank the poison to save the cosmos, and King Vasuki aided in holding the cosmic churn. Shiva adorned snakes as sacred ornaments, blessing them with divine protection forever.' },
      { id: 3, title: 'Kaliya Mardan', content: 'On Nag Panchami day, Lord Krishna conquered the venomous serpent Kaliya who poisoned the Yamuna river. Krishna danced upon Kaliya’s hoods and blessed him, restoring purity and life to Vrindavan waters.' },
      { id: 4, title: 'Protective Rituals', content: 'Devotees offer milk, rice, turmeric, and flowers at snake idols or Shivlings to seek protection from venomous bites, negative energies, and Kaal Sarp Dosh.' },
      { id: 5, title: 'Monsoon Traditions', content: 'Families draw snake figures with turmeric paste at doorstep entrances, cook sweet dishes, and offer prayers in Shiva temples across the nation during Shravan month.' }
    ];
  } else if (isRakshaBandhan) {
    subtitle = 'Sacred Thread of Sibling Protection & Krishna Grace • Shravana Purnima';
    deity = 'Lord Krishna, Draupadi & Lord Yama';
    tradition = 'Tying Rakhi Thread, Tilak & Protection Pledge';
    chapters = [
      { id: 1, title: 'Draupadi & Krishna', content: 'The most famous mythological story of Raksha Bandhan comes from the Mahabharata. When Lord Krishna cut his finger on the Sudarshan Chakra during the battle with Shishupala, Draupadi immediately tore a strip of silk cloth from her saree and wrapped it securely around Krishna’s bleeding wound.' },
      { id: 2, title: 'Eternal Divine Vow', content: 'Deeply moved by Draupadi’s selfless sisterly love, Lord Krishna vowed to protect her dignity and honor whenever she called upon him. He fulfilled this vow during the infamous cheer-haran in the Kaurava court, supplying an endless ream of divine silk saree.' },
      { id: 3, title: 'Queen Karnavati of Chittor', content: 'In historical folklore, Rani Karnavati of Mewar sent a sacred Rakhi thread to Mughal Emperor Humayun when facing attack from Bahadur Shah. Humayun immediately honored the sacred thread and marched his troops to defend her honour.' },
      { id: 4, title: 'The Sacred Thread Ceremony', content: 'Sisters tie decorative Rakhi threads around their brothers’ wrists, apply auspicious sandalwood tilak, offer sweets, and pray for their longevity. Brothers present gifts and pledge lifelong protection.' },
      { id: 5, title: 'Bond of Universal Affection', content: 'Raksha Bandhan transcends biological ties; it symbolizes mutual respect, unconditional support, and the sanctity of protective relationships throughout society.' }
    ];
  } else if (isJanmashtami) {
    subtitle = 'Divine Nativity of Lord Krishna & Vrindavan Leelas • Bhadrapada';
    deity = 'Lord Sri Krishna & Devaki-Vasudeva';
    tradition = 'Midnight Vigil (Nishita Puja), Fasting & Dahi Handi';
    chapters = [
      { id: 1, title: 'Divine Birth in Mathura', content: 'Janmashtami celebrates the divine manifestation of Lord Krishna, the eighth avatar of Lord Vishnu, born in a dark dungeon in Mathura at midnight during torrential monsoon rain to overthrow the cruel tyrant King Kamsa.' },
      { id: 2, title: 'Crossing the Yamuna', content: 'Vasudeva miraculously carried baby Krishna across the raging, swollen Yamuna river in a wicker basket, shielded by the multi-hooded Sheshnaag, safely delivering him to Nanda and Yashoda in Gokul.' },
      { id: 3, title: 'Childhood Leelas of Makhan Chor', content: 'Little Krishna enchanted Vrindavan with his divine flute melodies, stole freshly churned butter (Makhan) with his gopa companions, and vanquished demons sent by Kamsa like Putana and Trinavarta.' },
      { id: 4, title: 'Flute, Devotion & Midnight Puja', content: 'Devotees observe fasts until midnight, decorate home temples with fresh flowers and peacock feathers, sing devotional bhajans, and rock baby Krishna in ornate silver cradles.' },
      { id: 5, title: 'Dahi Handi Festivities', content: 'Youth groups form multi-tier human pyramids across cities during Dahi Handi competitions to break earthen pots filled with curd and butter suspended high in the air, echoing Krishna’s joyful childhood.' }
    ];
  } else if (isGaneshChaturthi) {
    subtitle = 'Manifestation of Ganesha & Wisdom of Modaks • Bhadrapada';
    deity = 'Lord Ganesha (Vighnaharta)';
    tradition = 'Ganesh Sthapana, 21 Modaks, Durva Grass & Visarjan';
    chapters = [
      { id: 1, title: 'Divine Manifestation', content: 'Goddess Parvati created Ganesha from turmeric paste while preparing for her bath and infused life into him. When he dutifully guarded her doorway against Lord Shiva, Shiva in divine wrath severed his head, later restoring him with an elephant head.' },
      { id: 2, title: 'Prathama Pujya Boon', content: 'To settle a race around the cosmos between Ganesha and Kartikeya, Ganesha wisely circumambulated his divine parents Shiva and Parvati, declaring them as the entire universe. He earned the supreme boon of Prathama Pujya (first worshipped deity before all auspicious beginnings).' },
      { id: 3, title: 'Modak & Cosmic Wisdom', content: 'Ganesha’s fondness for sweet Modaks represents the supreme joy of spiritual enlightenment. As the Divine Scribe, he wrote the epic Mahabharata dictated by Sage Vyasa with his broken tusk without pausing.' },
      { id: 4, title: 'Ganesh Sthapana & Aarti', content: 'Devotees welcome clay idols of Bappa into homes and pandals with dhol beats, performing daily Aarti, chanting the Atharvashirsha, and offering 21 Modaks and fresh Durva grass.' },
      { id: 5, title: 'Visarjan & Eternal Blessing', content: 'On Anant Chaturdashi, grand Visarjan processions immerse Bappa in sacred water bodies with resounding chants of "Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya!", praying for the removal of all obstacles.' }
    ];
  } else if (isNavratri) {
    subtitle = 'Cosmic Shakti & Goddess Durga Triumph over Mahishasura • Ashwin / Chaitra';
    deity = 'Maa Durga & Navadurga';
    tradition = '9 Nights Fasting, Garba/Dandiya & Kanya Pujan';
    chapters = [
      { id: 1, title: 'Cosmic Manifestation of Shakti', content: 'Navratri honors Goddess Durga’s victory over Mahishasura. The combined cosmic energies of Brahma, Vishnu, and Shiva manifested the ten-armed Mother Goddess armed with celestial weapons to vanquish demonic oppression.' },
      { id: 2, title: 'The Nine Divine Manifestations', content: 'Devotees worship the Navadurga—Shailaputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, and Siddhidatri—over nine auspicious nights.' },
      { id: 3, title: 'Mahishasura Mardini', content: 'On Vijayadashami (Dussehra), Goddess Durga annihilated the buffalo demon Mahishasura after an intense 9-day battle, re-establishing righteous cosmic order and peace across all realms.' },
      { id: 4, title: 'Garba, Dandiya & Durga Saptashati', content: 'Communities perform Garba and Dandiya Raas in vibrant traditional attire, observing sacred fasts and chanting the sacred Durga Saptashati hymns.' },
      { id: 5, title: 'Kanya Pujan & Divine Grace', content: 'On Ashtami and Navami, young girls are worshipped as living embodiments of Goddess Durga, offered Halwa, Puri, and gifts to invoke boundless health, wisdom, and prosperity.' }
    ];
  } else if (isDiwali) {
    subtitle = 'Return of Lord Rama & Worship of Goddess Lakshmi • Kartik Amavasya';
    deity = 'Lord Rama, Goddess Lakshmi & Lord Ganesha';
    tradition = 'Lighting Diyas, Rangoli, Lakshmi Puja & Family Feasts';
    chapters = [
      { id: 1, title: 'Triumphant Return to Ayodhya', content: 'Diwali marks Lord Rama’s glorious return to Ayodhya with Sita and Lakshman after 14 years of exile and his victory over the demon king Ravana. The joyous citizens illuminated Ayodhya with millions of earthen oil diyas.' },
      { id: 2, title: 'Manifestation of Goddess Lakshmi', content: 'Goddess Lakshmi, the deity of prosperity and auspiciousness, emerged during the cosmic churning of the milk ocean (Samudra Manthan) and chose Lord Vishnu as her divine consort on Kartik Amavasya.' },
      { id: 3, title: 'Five Days of Celebration', content: 'Diwali festivities span 5 holy days: Dhanteras (wealth and health), Naraka Chaturdashi (victory over darkness), Lakshmi Pujan (auspicious invocation), Govardhan Puja (nature gratitude), and Bhai Dooj (sibling bonds).' },
      { id: 4, title: 'Lighting Diyas & Prosperity', content: 'Homes are thoroughly cleaned, decorated with colorful Rangoli patterns, and lit up with earthen lamps to welcome Goddess Lakshmi and dispel all inner darkness.' },
      { id: 5, title: 'Joyful Reconnections & Charity', content: 'Families exchange sweets, wear new garments, distribute food to the less fortunate, and celebrate the eternal victory of light over darkness and good over evil.' }
    ];
  } else if (isShivratri) {
    subtitle = 'Anand Tandava & Cosmic Light of Shivling • Phalguna Krishna Chaturdashi';
    deity = 'Lord Shiva (Mahadev) & Goddess Parvati';
    tradition = 'All-Night Vigil (Jagran), Abhishekam with Belpatra & Fasting';
    chapters = [
      { id: 1, title: 'The Infinite Pillar of Light', content: 'Maha Shivratri commemorates the cosmic night Lord Shiva manifested as Lingodbhava—an infinite pillar of cosmic light with neither beginning nor end—surpassing the pride of Brahma and Vishnu.' },
      { id: 2, title: 'Shiva-Parvati Divine Wedding', content: 'Maha Shivratri is also celebrated as the holy wedding night of Lord Shiva and Goddess Parvati, symbolizing the eternal union of Purusha (Cosmic Consciousness) and Prakriti (Nature).' },
      { id: 3, title: 'Neelkanth & Samudra Manthan', content: 'During Samudra Manthan, Shiva held the deadly Halahala poison in his throat to save all living beings from destruction, earning the revered title of Neelkanth (The Blue-Throated Lord).' },
      { id: 4, title: 'Maha Abhishekam & Belpatra', content: 'Devotees observe an all-night vigil (Jagran), performing continuous four-prahara Abhishekam on the Shivling with milk, honey, yogurt, Ganga water, and sacred Belpatra leaves.' },
      { id: 5, title: 'Moksha & Spiritual Liberation', content: 'Devotees break their fast after sunrise, blessed with deep inner serenity, self-realization, liberation (Moksha), and the eradication of negative karma.' }
    ];
  } else {
    subtitle = `Sacred Katha & Divine Significance • ${festivalName}`;
    deity = festival?.deity || 'The Supreme Divine';
    tradition = festival?.tradition || 'Vedic Chanting, Fasting & Community Prayers';
    const s1 = sentences[0] || `${festivalName} is one of the most revered observances in Sanatan Dharma, celebrating divine cosmic harmony.`;
    const s2 = sentences[1] || 'Ancient scriptures detail how devotees across generations have performed disciplined tapasya, prayers, and charity.';
    const s3 = sentences[2] || 'The sacred day marks the triumph of righteousness, purity, and universal cosmic order over darkness.';
    const s4 = sentences[3] || 'Families prepare traditional prasadam, offer holy lamps (aarti), and invoke celestial blessings for harmony.';
    const s5 = sentences[4] || 'By participating in these timeless traditions, spiritual seekers awaken devotion, inner clarity, and peace.';

    chapters = [
      { id: 1, title: 'Spiritual Origin', content: s1.trim() },
      { id: 2, title: 'Divine Penance & Grace', content: s2.trim() },
      { id: 3, title: 'Triumph of Dharma', content: s3.trim() },
      { id: 4, title: 'Sacred Rituals & Offerings', content: s4.trim() },
      { id: 5, title: 'Eternal Blessings', content: s5.trim() }
    ];
  }

  const blessing = `May the divine grace of ${deity} bestow health, happiness, prosperity, and spiritual liberation upon you and your loved ones.`;

  return {
    festivalName,
    subtitle,
    deity,
    date,
    tradition,
    chapters,
    blessing,
  };
}

/**
 * Builds and shares a high-quality strictly 1-page PDF document of the festival story.
 * Includes Cinzel font branding, scannable QR code to download Brahmand App, and clickable links.
 */
export async function shareFestivalStoryPdf(festival: any, sectionValue?: string): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const data = getFestivalChapters(festival, sectionValue);

    const doc = await PDFDocument.create();
    doc.setTitle(`${data.festivalName} - Sacred Katha`);
    doc.setAuthor('Brahmand - Sanatan Lok');
    doc.setSubject(`Sacred Story and Vrat Katha of ${data.festivalName}`);
    doc.setCreator('Brahmand Vedic Platform');

    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

    // Register fontkit & embed Cinzel Font
    let cinzelFont = fontBold;
    try {
      doc.registerFontkit(fontkit);
      const cinzelAsset = Asset.fromModule(require('../../assets/fonts/Cinzel-Regular.ttf'));
      await cinzelAsset.downloadAsync();
      const fontUri = cinzelAsset.localUri || cinzelAsset.uri;
      if (fontUri) {
        const fontBase64 = await FileSystem.readAsStringAsync(fontUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const fontBytes = util.decodeBase64(fontBase64);
        cinzelFont = await doc.embedFont(fontBytes);
      }
    } catch (fontErr) {
      console.warn('[PDF] Cinzel font embedding fallback to fontBold:', fontErr);
    }

    const pageWidth = 595.28; // Standard A4 width
    const pageHeight = 841.89; // Standard A4 height
    const singleMargin = 28;
    const sContentWidth = pageWidth - singleMargin * 2;

    // STRICTLY SINGLE-PAGE A4 VECTOR LAYOUT
    const page = doc.addPage([pageWidth, pageHeight]);

    // 1. Royal Outer Double Gold Border
    page.drawRectangle({
      x: 14,
      y: 14,
      width: pageWidth - 28,
      height: pageHeight - 28,
      borderColor: rgb(0.85, 0.65, 0.25),
      borderWidth: 2,
    });

    page.drawRectangle({
      x: 18,
      y: 18,
      width: pageWidth - 36,
      height: pageHeight - 36,
      borderColor: rgb(0.92, 0.78, 0.45),
      borderWidth: 0.8,
    });

    let y = pageHeight - singleMargin - 6;

    // 2. Header Banner with Cinzel Font for BRAHMAND
    const headerHeight = 84;
    page.drawRectangle({
      x: singleMargin,
      y: y - headerHeight,
      width: sContentWidth,
      height: headerHeight,
      color: rgb(0.99, 0.96, 0.90),
      borderColor: rgb(0.85, 0.55, 0.15),
      borderWidth: 1.2,
    });

    // Top Cinzel title: "B R A H M A N D"
    page.drawText('B R A H M A N D', {
      x: singleMargin + 16,
      y: y - 22,
      size: 13,
      font: cinzelFont,
      color: rgb(0.75, 0.28, 0.05),
    });

    page.drawText('SANATAN DHARMA HERITAGE', {
      x: singleMargin + 165,
      y: y - 20,
      size: 7.5,
      font: fontBold,
      color: rgb(0.55, 0.35, 0.15),
    });

    const greetingTitle = `HAPPY ${cleanTextForPdf(data.festivalName).toUpperCase()}`;
    page.drawText(greetingTitle, {
      x: singleMargin + 16,
      y: y - 48,
      size: 18,
      font: fontBold,
      color: rgb(0.12, 0.14, 0.18),
    });

    page.drawText(cleanTextForPdf(data.subtitle), {
      x: singleMargin + 16,
      y: y - 69,
      size: 9.2,
      font: fontOblique,
      color: rgb(0.42, 0.32, 0.18),
    });

    y -= (headerHeight + 8);

    // 3. Metadata Strip
    const metaHeight = 22;
    page.drawRectangle({
      x: singleMargin,
      y: y - metaHeight,
      width: sContentWidth,
      height: metaHeight,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: rgb(0.88, 0.88, 0.90),
      borderWidth: 0.8,
    });

    page.drawText(`Date: ${cleanTextForPdf(data.date)}`, {
      x: singleMargin + 14,
      y: y - 15,
      size: 8.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Deity: ${cleanTextForPdf(data.deity)}`, {
      x: singleMargin + 175,
      y: y - 15,
      size: 8.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Tradition: ${cleanTextForPdf(data.tradition).slice(0, 36)}`, {
      x: singleMargin + 340,
      y: y - 15,
      size: 8.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= (metaHeight + 12);

    // 4. Section Title: 5 Sacred Chapters
    page.drawText('THE 5 SACRED KATHA CHAPTERS', {
      x: singleMargin + 2,
      y: y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.75, 0.28, 0.05),
    });

    page.drawLine({
      start: { x: singleMargin + 175, y: y + 3 },
      end: { x: singleMargin + sContentWidth, y: y + 3 },
      thickness: 0.8,
      color: rgb(0.88, 0.78, 0.55),
    });

    y -= 12;

    // Render 5 Chapters in compact elegant cards
    for (let i = 0; i < data.chapters.length; i++) {
      const ch = data.chapters[i];
      const chTitle = `${i + 1}. ${cleanTextForPdf(ch.title).toUpperCase()}`;
      const wrapped = wrapText(cleanTextForPdf(ch.content), fontRegular, 8.5, sContentWidth - 28);
      const boxHeight = 15 + (wrapped.length * 11.5) + 5;

      page.drawRectangle({
        x: singleMargin,
        y: y - boxHeight,
        width: sContentWidth,
        height: boxHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.90, 0.90, 0.92),
        borderWidth: 0.75,
      });

      page.drawRectangle({
        x: singleMargin,
        y: y - boxHeight,
        width: 4,
        height: boxHeight,
        color: rgb(0.85, 0.45, 0.1),
      });

      page.drawText(chTitle, {
        x: singleMargin + 14,
        y: y - 12,
        size: 8.5,
        font: fontBold,
        color: rgb(0.75, 0.28, 0.05),
      });

      let textY = y - 24;
      for (const line of wrapped) {
        page.drawText(line, {
          x: singleMargin + 14,
          y: textY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.22, 0.26),
        });
        textY -= 11.5;
      }

      y -= (boxHeight + 5);
    }

    y -= 2;

    // 5. Dharmo Rakshati Rakshitah Frame
    const blessingHeight = 50;
    page.drawRectangle({
      x: singleMargin,
      y: y - blessingHeight,
      width: sContentWidth,
      height: blessingHeight,
      color: rgb(0.99, 0.98, 0.94),
      borderColor: rgb(0.85, 0.65, 0.25),
      borderWidth: 1.2,
    });

    page.drawText('Dharmo Rakshati Rakshitah', {
      x: singleMargin + (sContentWidth / 2) - 78,
      y: y - 15,
      size: 10.5,
      font: fontBold,
      color: rgb(0.65, 0.32, 0.05),
    });

    page.drawText('Peace   *   Prosperity   *   Health   *   Wisdom', {
      x: singleMargin + (sContentWidth / 2) - 95,
      y: y - 29,
      size: 8.5,
      font: fontBold,
      color: rgb(0.5, 0.4, 0.2),
    });

    page.drawText('Dharma protects those who uphold righteousness. May divine grace illuminate your path.', {
      x: singleMargin + (sContentWidth / 2) - 180,
      y: y - 42,
      size: 7.8,
      font: fontOblique,
      color: rgb(0.4, 0.35, 0.25),
    });

    y -= (blessingHeight + 8);

    // 6. Marketing Section with Working Vector QR Code & Clickable Download Link
    const appUrl = 'https://play.google.com/store/apps/details?id=com.brahmand.app';
    const qrObj = qrcode(0, 'M');
    qrObj.addData(appUrl);
    qrObj.make();
    const moduleCount = qrObj.getModuleCount();

    const footerHeight = 62;
    page.drawRectangle({
      x: singleMargin,
      y: y - footerHeight,
      width: sContentWidth,
      height: footerHeight,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: rgb(0.86, 0.86, 0.89),
      borderWidth: 0.8,
    });

    // Render Real Vector QR Code
    const qrSize = 48;
    const qrX = singleMargin + 8;
    const qrY = y - footerHeight + 7;
    const cellSize = qrSize / moduleCount;

    // White QR background box
    page.drawRectangle({
      x: qrX - 2,
      y: qrY - 2,
      width: qrSize + 4,
      height: qrSize + 4,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.5,
    });

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qrObj.isDark(r, c)) {
          page.drawRectangle({
            x: qrX + c * cellSize,
            y: qrY + (moduleCount - 1 - r) * cellSize,
            width: cellSize,
            height: cellSize,
            color: rgb(0.08, 0.08, 0.08),
          });
        }
      }
    }

    // QR Clickable Annotation
    try {
      const qrLinkAnnot = doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [qrX - 2, qrY - 2, qrX + qrSize + 2, qrY + qrSize + 2],
        Border: [0, 0, 0],
        C: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(appUrl),
        },
      });
      page.node.addAnnot(doc.context.register(qrLinkAnnot));
    } catch (annotErr) {
      console.warn('[PDF] QR Link annotation error:', annotErr);
    }

    // Clear message beside QR
    page.drawText('Scan QR or Tap to Download Brahmand App', {
      x: qrX + qrSize + 14,
      y: y - 20,
      size: 9.5,
      font: fontBold,
      color: rgb(0.12, 0.14, 0.18),
    });

    page.drawText('Download Brahmand - Sanatan Lok to explore the complete sacred stories, audio katha & daily rituals', {
      x: qrX + qrSize + 14,
      y: y - 34,
      size: 7.6,
      font: fontRegular,
      color: rgb(0.4, 0.42, 0.46),
    });

    // Clickable "Download Brahmand App" Button Badge
    const btnX = qrX + qrSize + 14;
    const btnY = y - 55;
    const btnW = 160;
    const btnH = 17;

    page.drawRectangle({
      x: btnX,
      y: btnY,
      width: btnW,
      height: btnH,
      color: rgb(0.85, 0.42, 0.08),
    });

    page.drawText('TAP TO DOWNLOAD APP ->', {
      x: btnX + 14,
      y: btnY + 4.5,
      size: 7.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Clickable button annotation
    try {
      const btnLinkAnnot = doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [btnX, btnY, btnX + btnW, btnY + btnH],
        Border: [0, 0, 0],
        C: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(appUrl),
        },
      });
      page.node.addAnnot(doc.context.register(btnLinkAnnot));
    } catch (btnAnnotErr) {
      console.warn('[PDF] Button Link annotation error:', btnAnnotErr);
    }

    // Right side branding with Cinzel Font
    page.drawText('Brahmand - Sanatan Lok', {
      x: singleMargin + sContentWidth - 145,
      y: y - 25,
      size: 9,
      font: cinzelFont,
      color: rgb(0.75, 0.28, 0.05),
    });

    page.drawText('Google Play & App Store', {
      x: singleMargin + sContentWidth - 145,
      y: y - 40,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save Strictly 1-Page PDF
    const base64Pdf = await doc.saveAsBase64();
    const sanitizedName = data.festivalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${sanitizedName}_katha.pdf`;
    const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${targetDir}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share via expo-sharing
    let shared = false;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${data.festivalName} Story (PDF)`,
        UTI: 'com.adobe.pdf',
      });
      shared = true;
    } else {
      await RNShare.share({
        title: `${data.festivalName} Sacred Katha`,
        message: `${data.festivalName} Sacred Katha & Vrat Story:\n\n${data.subtitle}\n\nRead more on Brahmand App.`,
      });
      shared = true;
    }

    return { success: true, uri: fileUri };
  } catch (err: any) {
    console.error('Error generating festival story PDF:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
