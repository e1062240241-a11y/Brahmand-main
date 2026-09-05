import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
  icon?: 'lotus' | 'diya' | 'star' | 'hands' | 'swing';
}

export function getFestivalChapters(festival: any, sectionValue?: string): {
  festivalName: string;
  subtitle: string;
  deity: string;
  date: string;
  tradition: string;
  chapters: StoryChapter[];
  blessing: string;
  poeticBlessing: string;
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
  const isRamNavami = lowerName.includes('ram') || lowerName.includes('navami');
  const isHanumanJayanti = lowerName.includes('hanuman') || lowerName.includes('bajrang');
  const isKarwaChauth = lowerName.includes('karwa') || lowerName.includes('chauth');

  const storyText = sectionValue || festival?.origin || festival?.story || festival?.summary || '';
  const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];

  let subtitle = `Sacred Origin & Divine Vrat Katha of ${festivalName}`;
  let deity = festival?.deity || festival?.deities || 'The Supreme Divine';
  let date = festival?.date || festival?.start_date || 'Auspicious Sanatan Calendar';
  let tradition = festival?.tradition || festival?.significance || 'Pooja, Vrat & Vedic Mantras';
  let poeticBlessing = '';

  let chapters: StoryChapter[] = [];

  if (isHariyaliTeej) {
    subtitle = 'The Divine Union of Shiva & Parvati • Shravan Shukla Tritiya';
    deity = 'Lord Shiva & Goddess Parvati';
    tradition = 'Nirjala Fast, Green Attire & Sawan Swings';
    poeticBlessing = 'May the sacred monsoon blessings of Hariyali Teej fill your home with lush joy, eternal love, and divine harmony. As Goddess Parvati and Lord Shiva unite in celestial grace, may your life be endlessly blessed with prosperity, health, and spiritual fulfillment.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Goddess Parvati desired Lord Shiva as her divine consort, awakening his cosmic grace through selfless love and disciplined meditation.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Goddess Parvati embarked on severe austerities spanning 108 lifetimes across rugged mountain caves and dense Shravan forests.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Moved by her unyielding penance, Lord Shiva manifested on Shravan Tritiya and accepted Parvati as his eternal consort.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees observing Teej fasts and prayers receive Akhand Saubhagya, lifelong marital harmony, and celestial protection.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Women gather in green attire, apply mehndi on palms, swing on floral jhulas, and celebrate with sweet Ghevar and songs.' }
    ];
  } else if (isShivratri) {
    subtitle = 'Anand Tandava & Cosmic Light of Shivling • Phalguna Krishna Chaturdashi';
    deity = 'Lord Shiva & Maa Parvati';
    tradition = 'All-Night Vigil, Belpatra Abhishekam & Fasting';
    poeticBlessing = 'May the infinite light of Mahadev and the sacred grace of Goddess Parvati illuminate your spiritual journey with timeless peace, inner strength, and supreme liberation. As the cosmos dances to the eternal rhythm of Shiva, may your life and home be endlessly blessed with celestial harmony, radiant health, and abundant fulfillment.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Lord Shiva manifested as Lingodbhava, the boundless cosmic light of truth with neither beginning nor end, surpassing all mortal ego.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'During the churning of the cosmic ocean, Mahadev drank the deadly Halahala poison to protect all creation from annihilation.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'The holy wedding night of Shiva and Parvati, uniting eternal Consciousness with Nature in perfect universal harmony.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees offer sacred Belpatra and water in four-prahara Abhishekam, purifying the mind and washing away lifetime karma.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Soulful Shiva chants, night-long meditative vigils, breaking fast at dawn with serenity, spiritual illumination, and moksha.' }
    ];
  } else if (isDiwali) {
    subtitle = 'Return of Lord Rama & Worship of Goddess Lakshmi • Kartik Amavasya';
    deity = 'Lord Rama, Goddess Lakshmi & Lord Ganesha';
    tradition = 'Lighting Diyas, Rangoli & Lakshmi Pujan';
    poeticBlessing = 'May the divine radiance of millions of earthen diyas illuminate your home with eternal joy, supreme prosperity, and the boundless grace of Goddess Lakshmi and Lord Ganesha. May truth and dharma dispel all darkness, ushering in auspiciousness, good health, and heavenly abundance.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Lord Rama triumphantly returned to Ayodhya after 14 years of exile and victory over darkness, welcomed by millions of glowing diyas.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Goddess Lakshmi emerged from the churning of the milk ocean (Samudra Manthan) on Kartik Amavasya, choosing Lord Vishnu.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Light triumphs eternally over darkness, truth over deception, and righteous dharma over all ignorance across the universe.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Families perform Lakshmi and Ganesha Puja, invoking wealth, wisdom, intellect, pure thoughts, and auspicious fortune.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Decorating homes with colorful Rangoli, lighting clay diyas, exchanging sweet delicacies, and sharing warmth and joy.' }
    ];
  } else if (isJanmashtami) {
    subtitle = 'Divine Nativity of Lord Krishna & Vrindavan Leelas • Bhadrapada';
    deity = 'Lord Sri Krishna & Devaki-Vasudeva';
    tradition = 'Midnight Vigil, Fasting & Dahi Handi';
    poeticBlessing = 'May the enchanting flute and celestial presence of Lord Sri Krishna fill your soul with unconditional love, divine joy, and righteous courage. May the leelas of Natkhat Krishna bring eternal delight, spiritual illumination, and auspicious blessings to your entire family.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Lord Krishna manifested at midnight in a Mathura dungeon during torrential monsoon rains to vanquish tyrant King Kamsa.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Vasudeva bravely crossed the swollen Yamuna shielded by Sheshnaag to safely deliver baby Krishna to Gokul.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Young Krishna performed miraculous leelas in Vrindavan, vanquishing demons and enchanting hearts with his divine flute.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees observe midnight Nishita fast, rocking baby Krishna in ornate silver cradles and chanting sacred hymns.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Youth form human pyramids to break butter-filled Dahi Handi pots, singing and dancing in supreme spiritual bliss.' }
    ];
  } else if (isGaneshChaturthi) {
    subtitle = 'Manifestation of Ganesha & Wisdom of Modaks • Bhadrapada';
    deity = 'Lord Ganesha (Vighnaharta)';
    tradition = 'Ganesh Sthapana, 21 Modaks & Visarjan';
    poeticBlessing = 'May Lord Vighnaharta remove all obstacles from your path, blessing you and your loved ones with auspicious beginnings, deep intellect, peace, and eternal fulfillment. May the divine grace of Bappa illuminate your journey with happiness and prosperity.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Mother Parvati created Ganesha from turmeric paste, infusing him with life to guard her sacred inner sanctum.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Ganesha circumambulated his divine parents Shiva and Parvati as the entire cosmos, earning the supreme Prathama Pujya boon.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'As the Divine Scribe with unmatched intellect, Ganesha penned the epic Mahabharata with his broken tusk without pausing.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Offering 21 sweet modaks and fresh Durva grass, devotees invoke blessings to overcome every life obstacle and hurdle.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Grand Visarjan processions with dhol beats and chants of "Ganpati Bappa Morya", celebrating divine presence and love.' }
    ];
  } else if (isNavratri) {
    subtitle = 'Cosmic Shakti & Goddess Durga Triumph • Ashwin / Chaitra';
    deity = 'Maa Durga & Navadurga';
    tradition = '9 Nights Fasting, Garba & Kanya Pujan';
    poeticBlessing = 'May the nine supreme manifestations of Maa Durga bless you with boundless courage, spiritual illumination, inner purity, and righteous victory over all life’s challenges. May your days resonate with divine Shakti, peace, and transcendental joy.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'The combined cosmic radiance of the Trinity manifested ten-armed Goddess Durga armed with celestial weapons.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Nine nights of intense tapasya worshipping the Navadurga embodiments of purity, wisdom, and cosmic valor.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'On Vijayadashami, Maa Durga vanquished Mahishasura, re-establishing cosmic harmony and righteous universal order.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees observe sacred fasts, chant Durga Saptashati, and perform Kanya Pujan honoring the divine feminine.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Vibrant Garba and Dandiya Raas in traditional attire, uniting communities in devotion, celebration, and spiritual joy.' }
    ];
  } else if (isHoli) {
    subtitle = 'Prahlad Devotion, Holika Dahan & Divine Colors of Vraj • Phalguna Purnima';
    deity = 'Lord Vishnu, Bhakt Prahlad & Radha-Krishna';
    tradition = 'Holika Dahan, Herbal Gulal & Gujiya Sweets';
    poeticBlessing = 'May the vibrant sacred colors of Holi infuse your spirit with divine love, joy, and the eternal grace of Radha-Krishna. May all negativity vanish in the sacred fire, blessing your life with peace, friendship, and spiritual exuberance.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Young Prahlad remained steadfast in his devotion to Lord Vishnu despite the wrath and persecution of his father Hiranyakashipu.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Holika sat in raging fire with Prahlad; by divine grace, Prahlad was unscathed while evil Holika was consumed by the flames.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Righteous devotion triumphs over demonic ego, marking the eternal victory of truth and faith commemorated by Holika Dahan.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees apply sacred sandalwood and herbal gulal, seeking blessings for prosperity, forgiveness, and universal harmony.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Playing with vibrant herbal colors, swinging in Vraj leelas, enjoying sweet Gujiyas, and celebrating friendship and unity.' }
    ];
  } else if (isRakshaBandhan) {
    subtitle = 'Sacred Thread of Protection & Krishna Grace • Shravana Purnima';
    deity = 'Lord Krishna & Draupadi';
    tradition = 'Tying Rakhi, Tilak & Protection Vow';
    poeticBlessing = 'May the sacred thread of affection and mutual protection strengthen the eternal bonds of family, bringing unwavering devotion, harmony, and guardian grace. May your life be surrounded by lifelong love, safety, and auspicious blessings.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Draupadi lovingly tied a strip of her silk saree to Lord Krishna’s injured finger on the battlefield with Shishupala.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Lord Krishna made an eternal vow to protect Draupadi’s honor whenever called upon in time of distress or peril.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Krishna provided infinite reams of saree during the Kaurava assembly, honoring the sacred protective bond forever.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Sisters tie decorative Rakhi threads on brothers’ wrists, chanting Vedic protective mantras for longevity and welfare.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Exchanging gifts, sharing auspicious sweets, renewing sacred protective vows, and fostering universal kinship.' }
    ];
  } else {
    // Dynamic authentic fallback
    poeticBlessing = `May the divine blessings and sacred grace of ${cleanTextForPdf(festivalName)} fill your home with lush joy, eternal peace, righteous wisdom, and spiritual fulfillment. May this holy occasion bestow prosperity, harmony, and celestial protection upon you and your loved ones.`;
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: sentences[0] || `${festivalName} has been celebrated since antiquity to honor divine cosmic harmony and righteous living across generations.` },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: sentences[1] || 'Ancient scriptures detail how devotees have performed disciplined prayers, austere vows, and charity with pure hearts.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: sentences[2] || 'The sacred festival marks the eternal triumph of righteousness, purity, and universal cosmic truth over all obstacles.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: sentences[3] || 'Families offer holy prayers, invoke celestial deities, and receive lifelong protection, vitality, and heavenly grace.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: sentences[4] || 'Communities unite in joyous harmony, sharing prasadam, singing devotional hymns, and preserving timeless Sanatan Dharma.' }
    ];
  }

  const blessing = 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace and divine blessings of this sacred festival bring peace, prosperity, good health, and spiritual enlightenment to you and your family.';

  return {
    festivalName,
    subtitle,
    deity,
    date,
    tradition,
    chapters,
    blessing,
    poeticBlessing,
  };
}

/**
 * Builds and shares a high-quality PDF document of the festival story.
 */
export async function shareFestivalStoryPdf(festival: any, sectionValue?: string): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const data = getFestivalChapters(festival, sectionValue);

    const doc = await PDFDocument.create();
    doc.setTitle(`${data.festivalName} - Sacred Katha`);
    doc.setAuthor('Brahmand - Sanatan Lok');
    doc.setSubject(`Sacred Story and Vrat Katha of ${data.festivalName}`);
    doc.setCreator('Brahmand Vedic Platform');

    const fontHelvetica = await doc.embedFont(StandardFonts.Helvetica);
    const fontHelveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontTimes = await doc.embedFont(StandardFonts.TimesRoman);
    const fontTimesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const fontTimesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

    const pageWidth = 595.28; // Standard A4 width
    const pageHeight = 841.89; // Standard A4 height

    let hasCoverPage = false;
    const isHariyaliTeej = data.festivalName.toLowerCase().includes('hariyali');
    if (isHariyaliTeej) {
      try {
        const coverAsset = require('../../assets/images/hariyali_teej_pdf_card.jpg');
        const asset = Asset.fromModule(coverAsset);
        await asset.downloadAsync();
        const fileUriToRead = asset.localUri || asset.uri;
        if (fileUriToRead) {
          const base64Cover = await FileSystem.readAsStringAsync(fileUriToRead, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (base64Cover) {
            const embeddedCover = await doc.embedJpg(base64Cover);
            const coverPage = doc.addPage([pageWidth, pageHeight]);
            coverPage.drawImage(embeddedCover, {
              x: 0,
              y: 0,
              width: pageWidth,
              height: pageHeight,
            });
            hasCoverPage = true;
          }
        }
      } catch (coverErr) {
        console.warn('[PDF] Could not embed Hariyali Teej cover into PDF:', coverErr);
      }
    }

    // If visual single-page cover card is loaded, directly export strictly 1-page PDF
    if (hasCoverPage) {
      const base64Pdf = await doc.saveAsBase64();
      const sanitizedName = data.festivalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const filename = `${sanitizedName}_story.pdf`;
      const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const fileUri = `${targetDir}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${data.festivalName} Story (PDF)`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        await RNShare.share({
          title: `${data.festivalName} Sacred Story`,
          message: `${data.festivalName} - Sacred Story on Brahmand App.`,
        });
      }

      return { success: true, uri: fileUri };
    }

    // STRICTLY SINGLE-PAGE A4 MASTER VECTOR LAYOUT FOR EVERY FESTIVAL
    const singleMargin = 26;
    const sContentWidth = pageWidth - singleMargin * 2; // 543.28 pt
    const page = doc.addPage([pageWidth, pageHeight]);

    // 0. Delicate Cream & Warm Saffron Parchment Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.996, 0.988, 0.965),
    });

    // Faint Sacred Mandala Watermarks (vector concentric circles & star rays)
    const drawMandala = (cx: number, cy: number, maxRadius: number) => {
      const mandalaColor = rgb(0.94, 0.89, 0.81);
      for (let r = 22; r <= maxRadius; r += 26) {
        page.drawCircle({
          x: cx,
          y: cy,
          size: r,
          borderColor: mandalaColor,
          borderWidth: 0.5,
        });
      }
      for (let angle = 0; angle < 360; angle += 22.5) {
        const rad = (angle * Math.PI) / 180;
        page.drawLine({
          start: { x: cx + Math.cos(rad) * 15, y: cy + Math.sin(rad) * 15 },
          end: { x: cx + Math.cos(rad) * maxRadius, y: cy + Math.sin(rad) * maxRadius },
          color: mandalaColor,
          thickness: 0.4,
        });
      }
    };

    drawMandala(pageWidth / 2, pageHeight - 160, 140);
    drawMandala(pageWidth / 2, 420, 160);
    drawMandala(pageWidth / 2, 130, 130);

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

    // Corner floral embellishments
    const drawCorner = (cx: number, cy: number, flipX: number, flipY: number) => {
      const gold = rgb(0.85, 0.65, 0.25);
      const size = 20;
      page.drawLine({
        start: { x: cx, y: cy },
        end: { x: cx + flipX * size, y: cy },
        thickness: 1.5,
        color: gold,
      });
      page.drawLine({
        start: { x: cx, y: cy },
        end: { x: cx, y: cy + flipY * size },
        thickness: 1.5,
        color: gold,
      });
      page.drawCircle({
        x: cx + flipX * 7,
        y: cy + flipY * 7,
        size: 2.5,
        color: gold,
      });
    };

    drawCorner(24, pageHeight - 24, 1, -1);
    drawCorner(pageWidth - 24, pageHeight - 24, -1, -1);
    drawCorner(24, 24, 1, 1);
    drawCorner(pageWidth - 24, 24, -1, 1);

    let y = pageHeight - 44;

    // ==========================================
    // TOP 40%: Header, 3D Gold Title, Poetic Wish
    // ==========================================
    // 2. Brand Header: 'BRAHMAND' in saffron + 'SANATAN DHARMA SACRED HERITAGE'
    const brandText = 'BRAHMAND';
    const brandWidth = fontHelveticaBold.widthOfTextAtSize(brandText, 20);
    page.drawText(brandText, {
      x: (pageWidth - brandWidth) / 2,
      y,
      size: 20,
      font: fontHelveticaBold,
      color: rgb(0.85, 0.40, 0.05), // Saffron
    });

    y -= 18;
    const tagText = 'SANATAN DHARMA SACRED HERITAGE';
    const tagWidth = fontHelveticaBold.widthOfTextAtSize(tagText, 9.5);
    page.drawText(tagText, {
      x: (pageWidth - tagWidth) / 2,
      y,
      size: 9.5,
      font: fontHelveticaBold,
      color: rgb(0.38, 0.30, 0.22),
    });

    // Delicate filigree line with golden center jewel
    y -= 14;
    page.drawLine({
      start: { x: pageWidth / 2 - 130, y },
      end: { x: pageWidth / 2 - 14, y },
      thickness: 0.8,
      color: rgb(0.85, 0.68, 0.35),
    });
    page.drawCircle({ x: pageWidth / 2, y, size: 2.8, color: rgb(0.85, 0.40, 0.05) });
    page.drawLine({
      start: { x: pageWidth / 2 + 14, y },
      end: { x: pageWidth / 2 + 130, y },
      thickness: 0.8,
      color: rgb(0.85, 0.68, 0.35),
    });

    // 3. Massive Embossed 3D Gold Typography reads [FESTIVAL_NAME]
    y -= 48;
    let festivalTitle = cleanTextForPdf(data.festivalName).toUpperCase();
    if (!festivalTitle.startsWith('HAPPY') && !festivalTitle.startsWith('MAHA') && !festivalTitle.startsWith('SHREE')) {
      festivalTitle = `HAPPY ${festivalTitle}`;
    }
    const titleSize = festivalTitle.length > 22 ? 24 : 30;
    const titleWidth = fontHelveticaBold.widthOfTextAtSize(festivalTitle, titleSize);
    const titleX = (pageWidth - titleWidth) / 2;

    // 3D Shadow layer
    page.drawText(festivalTitle, {
      x: titleX + 2,
      y: y - 2,
      size: titleSize,
      font: fontHelveticaBold,
      color: rgb(0.45, 0.28, 0.08),
    });
    // Highlight layer
    page.drawText(festivalTitle, {
      x: titleX - 1,
      y: y + 1,
      size: titleSize,
      font: fontHelveticaBold,
      color: rgb(0.98, 0.92, 0.62),
    });
    // Main Gold layer
    page.drawText(festivalTitle, {
      x: titleX,
      y,
      size: titleSize,
      font: fontHelveticaBold,
      color: rgb(0.82, 0.58, 0.16),
    });

    // 4. Elegant Dark Brown Serif Text reads [POETIC_BLESSING]
    y -= 28;
    const wrappedBlessing = wrapText(cleanTextForPdf(data.poeticBlessing), fontTimesItalic, 11.2, sContentWidth - 30);
    for (const line of wrappedBlessing) {
      const lineWidth = fontTimesItalic.widthOfTextAtSize(line, 11.2);
      page.drawText(line, {
        x: (pageWidth - lineWidth) / 2,
        y,
        size: 11.2,
        font: fontTimesItalic,
        color: rgb(0.30, 0.18, 0.10), // Dark brown
      });
      y -= 17;
    }

    y -= 12;

    // ==========================================
    // MIDDLE 30%: Dark Slate Badge & 5 Chapters
    // ==========================================
    // 5. Sleek Dark Slate Pill-Shaped Badge reads [METADATA_STR]
    const pillHeight = 30;
    const pillWidth = sContentWidth - 10;
    const pillX = (pageWidth - pillWidth) / 2;
    page.drawRectangle({
      x: pillX,
      y: y - pillHeight,
      width: pillWidth,
      height: pillHeight,
      color: rgb(0.10, 0.14, 0.20),
      borderColor: rgb(0.82, 0.65, 0.30),
      borderWidth: 1.2,
    });

    const metaText = `Date: ${cleanTextForPdf(data.date)}  |  Deity: ${cleanTextForPdf(data.deity)}  |  Tradition: ${cleanTextForPdf(data.tradition).slice(0, 36)}`;
    const metaWidth = fontHelveticaBold.widthOfTextAtSize(metaText, 8.8);
    page.drawText(metaText, {
      x: (pageWidth - metaWidth) / 2,
      y: y - 19.5,
      size: 8.8,
      font: fontHelveticaBold,
      color: rgb(0.96, 0.96, 0.98),
    });

    y -= (pillHeight + 18);

    // Section Header: 5 Sacred Chapters
    page.drawText('THE 5 SACRED CHAPTERS', {
      x: singleMargin + 8,
      y,
      size: 10,
      font: fontHelveticaBold,
      color: rgb(0.85, 0.40, 0.05),
    });
    page.drawLine({
      start: { x: singleMargin + 155, y: y + 3 },
      end: { x: pageWidth - singleMargin - 8, y: y + 3 },
      thickness: 0.8,
      color: rgb(0.88, 0.78, 0.55),
    });

    y -= 14;

    // 6. Horizontal Row of 5 Minimalist Rectangular Icon Cards with Saffron Top-Borders
    const cardCount = 5;
    const cardGap = 8;
    const totalGaps = cardGap * (cardCount - 1);
    const cardWidth = (sContentWidth - totalGaps) / cardCount; // ~102.2 pt
    const cardHeight = 180; // Full generous height
    const cardStartY = y - cardHeight;

    for (let i = 0; i < cardCount; i++) {
      const cardX = singleMargin + i * (cardWidth + cardGap);
      const ch = data.chapters[i] || { title: `Chapter ${i + 1}`, content: '', icon: 'lotus' };

      // Card Background & Subtle Border
      page.drawRectangle({
        x: cardX,
        y: cardStartY,
        width: cardWidth,
        height: cardHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.86, 0.82, 0.76),
        borderWidth: 0.8,
      });

      // Saffron Top-Border
      page.drawRectangle({
        x: cardX,
        y: cardStartY + cardHeight - 4,
        width: cardWidth,
        height: 4,
        color: rgb(0.85, 0.40, 0.05),
      });

      // Icon halo and drawing: lotus, diya, star, hands, swing
      const iconCenterY = cardStartY + cardHeight - 28;
      const iconCenterX = cardX + cardWidth / 2;

      // Soft circle halo behind icon
      page.drawCircle({
        x: iconCenterX,
        y: iconCenterY,
        size: 15,
        color: rgb(0.99, 0.96, 0.90),
        borderColor: rgb(0.92, 0.82, 0.65),
        borderWidth: 0.5,
      });

      if (ch.icon === 'lotus' || i === 0) {
        page.drawCircle({ x: iconCenterX, y: iconCenterY, size: 6.5, color: rgb(0.92, 0.55, 0.18) });
        page.drawCircle({ x: iconCenterX - 6.5, y: iconCenterY - 2, size: 4.2, color: rgb(0.95, 0.65, 0.22) });
        page.drawCircle({ x: iconCenterX + 6.5, y: iconCenterY - 2, size: 4.2, color: rgb(0.95, 0.65, 0.22) });
      } else if (ch.icon === 'diya' || i === 1) {
        page.drawCircle({ x: iconCenterX, y: iconCenterY + 4, size: 3.8, color: rgb(0.98, 0.75, 0.15) }); // Flame
        page.drawRectangle({ x: iconCenterX - 7.5, y: iconCenterY - 5.5, width: 15, height: 5.5, color: rgb(0.75, 0.42, 0.15) }); // Base
      } else if (ch.icon === 'star' || i === 2) {
        page.drawCircle({ x: iconCenterX, y: iconCenterY, size: 4.8, color: rgb(0.92, 0.72, 0.15) });
        page.drawLine({ start: { x: iconCenterX - 8.5, y: iconCenterY }, end: { x: iconCenterX + 8.5, y: iconCenterY }, color: rgb(0.92, 0.72, 0.15), thickness: 1.8 });
        page.drawLine({ start: { x: iconCenterX, y: iconCenterY - 8.5 }, end: { x: iconCenterX, y: iconCenterY + 8.5 }, color: rgb(0.92, 0.72, 0.15), thickness: 1.8 });
      } else if (ch.icon === 'hands' || i === 3) {
        page.drawCircle({ x: iconCenterX, y: iconCenterY + 4.5, size: 4.2, color: rgb(0.85, 0.50, 0.15) });
        page.drawRectangle({ x: iconCenterX - 4.5, y: iconCenterY - 6.5, width: 9, height: 9, color: rgb(0.85, 0.50, 0.15) });
      } else {
        page.drawLine({ start: { x: iconCenterX - 8.5, y: iconCenterY + 5.5 }, end: { x: iconCenterX + 8.5, y: iconCenterY + 5.5 }, color: rgb(0.65, 0.45, 0.20), thickness: 1.8 });
        page.drawLine({ start: { x: iconCenterX - 6.5, y: iconCenterY + 5.5 }, end: { x: iconCenterX - 5.5, y: iconCenterY - 5.5 }, color: rgb(0.75, 0.55, 0.25), thickness: 1.2 });
        page.drawLine({ start: { x: iconCenterX + 6.5, y: iconCenterY + 5.5 }, end: { x: iconCenterX + 5.5, y: iconCenterY - 5.5 }, color: rgb(0.75, 0.55, 0.25), thickness: 1.2 });
        page.drawRectangle({ x: iconCenterX - 6.5, y: iconCenterY - 6.5, width: 13, height: 2.8, color: rgb(0.85, 0.45, 0.15) });
      }

      // Chapter Title
      const titleLines = wrapText(cleanTextForPdf(ch.title), fontHelveticaBold, 8.5, cardWidth - 10);
      let titleY = cardStartY + cardHeight - 52;
      for (const tline of titleLines) {
        const tw = fontHelveticaBold.widthOfTextAtSize(tline, 8.5);
        page.drawText(tline, {
          x: cardX + (cardWidth - tw) / 2,
          y: titleY,
          size: 8.5,
          font: fontHelveticaBold,
          color: rgb(0.18, 0.18, 0.18),
        });
        titleY -= 11;
      }

      // Thin separator
      page.drawLine({
        start: { x: cardX + 10, y: titleY + 3 },
        end: { x: cardX + cardWidth - 10, y: titleY + 3 },
        thickness: 0.5,
        color: rgb(0.88, 0.82, 0.74),
      });

      // Chapter Excerpt
      const summaryLines = wrapText(cleanTextForPdf(ch.content), fontHelvetica, 7.3, cardWidth - 12);
      let sumY = titleY - 9;
      for (const sline of summaryLines) {
        const sw = fontHelvetica.widthOfTextAtSize(sline, 7.3);
        page.drawText(sline, {
          x: cardX + (cardWidth - sw) / 2,
          y: sumY,
          size: 7.3,
          font: fontHelvetica,
          color: rgb(0.35, 0.38, 0.42),
        });
        sumY -= 10.5;
      }
    }

    y = cardStartY - 20;

    // ==========================================
    // BOTTOM 30%: Frame, Marketing Section, Footer
    // ==========================================
    // 7. Ornate Intricate Golden Floral Frame 'Dharmo Rakshati Rakshitah'
    const frameHeight = 88;
    const frameY = y - frameHeight;

    page.drawRectangle({
      x: singleMargin,
      y: frameY,
      width: sContentWidth,
      height: frameHeight,
      color: rgb(0.99, 0.98, 0.93),
      borderColor: rgb(0.85, 0.65, 0.25),
      borderWidth: 1.5,
    });

    page.drawRectangle({
      x: singleMargin + 3.5,
      y: frameY + 3.5,
      width: sContentWidth - 7,
      height: frameHeight - 7,
      borderColor: rgb(0.92, 0.80, 0.50),
      borderWidth: 0.6,
    });

    const dharmoTitle = 'Dharmo Rakshati Rakshitah';
    const dharmoWidth = fontTimesBold.widthOfTextAtSize(dharmoTitle, 15);
    page.drawText(dharmoTitle, {
      x: (pageWidth - dharmoWidth) / 2,
      y: frameY + frameHeight - 24,
      size: 15,
      font: fontTimesBold,
      color: rgb(0.65, 0.32, 0.05),
    });

    const virtuesText = 'Peace   *   Prosperity   *   Health   *   Wisdom';
    const virtuesWidth = fontHelveticaBold.widthOfTextAtSize(virtuesText, 10);
    page.drawText(virtuesText, {
      x: (pageWidth - virtuesWidth) / 2,
      y: frameY + frameHeight - 46,
      size: 10,
      font: fontHelveticaBold,
      color: rgb(0.50, 0.40, 0.20),
    });

    const dharmoSub = 'Dharma protects those who uphold righteousness. May divine grace illuminate your path.';
    const dharmoSubWidth = fontTimesItalic.widthOfTextAtSize(dharmoSub, 9);
    page.drawText(dharmoSub, {
      x: (pageWidth - dharmoSubWidth) / 2,
      y: frameY + frameHeight - 66,
      size: 9,
      font: fontTimesItalic,
      color: rgb(0.42, 0.36, 0.28),
    });

    y = frameY - 18;

    // 8. Modern Marketing Card (STRICTLY NO QR CODE, Promotes Brahmand App)
    const mktCardHeight = 115;
    const mktY = y - mktCardHeight;

    page.drawRectangle({
      x: singleMargin,
      y: mktY,
      width: sContentWidth,
      height: mktCardHeight,
      color: rgb(0.965, 0.96, 0.94),
      borderColor: rgb(0.88, 0.82, 0.72),
      borderWidth: 1,
    });

    // Top banner tag inside marketing card
    page.drawRectangle({
      x: singleMargin,
      y: mktY + mktCardHeight - 20,
      width: sContentWidth,
      height: 20,
      color: rgb(0.93, 0.88, 0.80),
    });
    const mktTag = 'EXPERIENCE SANATAN DHARMA ON BRAHMAND';
    const mktTagWidth = fontHelveticaBold.widthOfTextAtSize(mktTag, 8.5);
    page.drawText(mktTag, {
      x: (pageWidth - mktTagWidth) / 2,
      y: mktY + mktCardHeight - 14,
      size: 8.5,
      font: fontHelveticaBold,
      color: rgb(0.75, 0.32, 0.05),
    });

    const promoTitle = 'Discover the Full Divine Story, Rituals & Audio Katha';
    const promoWidth = fontHelveticaBold.widthOfTextAtSize(promoTitle, 12);
    page.drawText(promoTitle, {
      x: (pageWidth - promoWidth) / 2,
      y: mktY + mktCardHeight - 40,
      size: 12,
      font: fontHelveticaBold,
      color: rgb(0.14, 0.14, 0.16),
    });

    const appTagline = 'Daily Vedic Panchang  •  100+ Sacred Katha  •  Audio Chants  •  Live Temple Darshans';
    const appTaglineWidth = fontHelvetica.widthOfTextAtSize(appTagline, 8.8);
    page.drawText(appTagline, {
      x: (pageWidth - appTaglineWidth) / 2,
      y: mktY + mktCardHeight - 56,
      size: 8.8,
      font: fontHelvetica,
      color: rgb(0.42, 0.42, 0.46),
    });

    const webLink = 'brahmand.app';
    const webWidth = fontHelveticaBold.widthOfTextAtSize(webLink, 11);
    page.drawText(webLink, {
      x: (pageWidth - webWidth) / 2,
      y: mktY + mktCardHeight - 74,
      size: 11,
      font: fontHelveticaBold,
      color: rgb(0.85, 0.40, 0.05),
    });

    // App Store & Google Play Badges
    const badgeW = 125;
    const badgeH = 22;
    const totalBadgesW = badgeW * 2 + 16;
    const badge1X = (pageWidth - totalBadgesW) / 2;
    const badge2X = badge1X + badgeW + 16;
    const badgeY = mktY + 10;

    // App Store Badge
    page.drawRectangle({
      x: badge1X,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: rgb(0.10, 0.12, 0.16),
    });
    const asText = 'Download on App Store';
    const asWidth = fontHelveticaBold.widthOfTextAtSize(asText, 8);
    page.drawText(asText, {
      x: badge1X + (badgeW - asWidth) / 2,
      y: badgeY + 6.5,
      size: 8,
      font: fontHelveticaBold,
      color: rgb(1, 1, 1),
    });

    // Google Play Badge
    page.drawRectangle({
      x: badge2X,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: rgb(0.10, 0.12, 0.16),
    });
    const gpText = 'GET IT ON Google Play';
    const gpWidth = fontHelveticaBold.widthOfTextAtSize(gpText, 8);
    page.drawText(gpText, {
      x: badge2X + (badgeW - gpWidth) / 2,
      y: badgeY + 6.5,
      size: 8,
      font: fontHelveticaBold,
      color: rgb(1, 1, 1),
    });

    // 9. Footer: Brahmand App - Sanatan Lok
    const footerLineY = 42;
    page.drawLine({
      start: { x: singleMargin + 40, y: footerLineY },
      end: { x: pageWidth - singleMargin - 40, y: footerLineY },
      thickness: 0.6,
      color: rgb(0.88, 0.78, 0.55),
    });

    const footerText = 'Brahmand App  •  Sanatan Lok  •  Connecting 100,000+ Devotees Worldwide';
    const footerWidth = fontHelveticaBold.widthOfTextAtSize(footerText, 8.8);
    page.drawText(footerText, {
      x: (pageWidth - footerWidth) / 2,
      y: 26,
      size: 8.8,
      font: fontHelveticaBold,
      color: rgb(0.75, 0.35, 0.08),
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
