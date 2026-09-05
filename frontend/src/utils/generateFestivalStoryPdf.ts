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
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Long ago, Goddess Parvati desired Lord Shiva as her divine consort, awakening his cosmic grace through selfless devotion.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Goddess Parvati embarked on severe austerities spanning 108 lifetimes across rugged mountain caves and dense Shravan forests.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Moved by her unyielding penance, Lord Shiva manifested on Shravan Tritiya and accepted Parvati as his eternal consort.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees observing Teej fasts and prayers receive Akhand Saubhagya, lifelong marital harmony, and celestial blessings.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Women gather in green attire, apply mehndi on palms, swing on floral jhulas, and celebrate with sweet Ghevar.' }
    ];
  } else if (isShivratri) {
    subtitle = 'Anand Tandava & Cosmic Light of Shivling • Phalguna Krishna Chaturdashi';
    deity = 'Lord Shiva & Maa Parvati';
    tradition = 'All-Night Vigil, Belpatra Abhishekam & Fasting';
    poeticBlessing = 'May the infinite light of Mahadev and the sacred grace of Goddess Parvati illuminate your spiritual journey with timeless peace, inner strength, and supreme liberation.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Lord Shiva manifested as Lingodbhava, an infinite pillar of cosmic light with neither beginning nor end, surpassing all ego.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'During Samudra Manthan, Shiva drank the deadly Halahala poison to protect all beings, earning the name Neelkanth.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'The holy wedding night of Shiva and Parvati, uniting Purusha (Cosmic Consciousness) and Prakriti (Nature).' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees offer sacred Belpatra and water in four-prahara Abhishekam, purifying the mind and washing away all sins.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'All-night Jagran, soulful Shiva Tandava chants, meditation, and breaking fast at dawn with inner tranquility.' }
    ];
  } else if (isDiwali) {
    subtitle = 'Return of Lord Rama & Worship of Goddess Lakshmi • Kartik Amavasya';
    deity = 'Lord Rama, Goddess Lakshmi & Lord Ganesha';
    tradition = 'Lighting Diyas, Rangoli & Lakshmi Pujan';
    poeticBlessing = 'May the divine radiance of millions of earthen diyas illuminate your home with eternal joy, supreme prosperity, and the boundless grace of Goddess Lakshmi and Lord Ganesha.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Lord Rama triumphantly returned to Ayodhya after 14 years of exile and victory over darkness, welcomed with glowing lamps.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Goddess Lakshmi emerged from the cosmic milk ocean (Samudra Manthan) on Kartik Amavasya, choosing Lord Vishnu.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Light triumphs eternally over darkness, truth over deception, and righteous dharma over all demonic ignorance.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Families perform Lakshmi and Ganesha Puja, invoking wealth, intellect, pure thoughts, and auspicious fortune.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Decorating homes with vibrant Rangoli, lighting clay diyas, exchanging sweet delicacies, and sharing joy.' }
    ];
  } else if (isJanmashtami) {
    subtitle = 'Divine Nativity of Lord Krishna & Vrindavan Leelas • Bhadrapada';
    deity = 'Lord Sri Krishna & Devaki-Vasudeva';
    tradition = 'Midnight Vigil, Fasting & Dahi Handi';
    poeticBlessing = 'May the enchanting melodies and celestial presence of Lord Sri Krishna fill your soul with unconditional devotion, divine wisdom, joy, and righteous courage.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Lord Krishna manifested at midnight in a Mathura dungeon during torrential monsoon rains to vanquish tyrant Kamsa.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Vasudeva bravely crossed the raging Yamuna shielded by Sheshnaag to safely deliver baby Krishna to Gokul.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Young Krishna performed miraculous leelas in Vrindavan, defeating fearsome demons and playing his divine flute.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees observe midnight Nishita fast, rocking baby Krishna in silver cradles and chanting sacred hymns.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Youth form human pyramids to break butter-filled Dahi Handi pots, singing and dancing in supreme spiritual bliss.' }
    ];
  } else if (isGaneshChaturthi) {
    subtitle = 'Manifestation of Ganesha & Wisdom of Modaks • Bhadrapada';
    deity = 'Lord Ganesha (Vighnaharta)';
    tradition = 'Ganesh Sthapana, 21 Modaks & Visarjan';
    poeticBlessing = 'May Lord Vighnaharta remove all obstacles from your path, blessing you and your loved ones with auspicious beginnings, deep intellect, peace, and eternal fulfillment.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'Mother Parvati created Ganesha from turmeric paste, infusing him with life to guard her sacred sanctum.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Ganesha circumambulated his divine parents Shiva and Parvati as the entire cosmos, earning Prathama Pujya boon.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'As the Divine Scribe with supreme intellect, Ganesha penned the entire Mahabharata with his broken tusk.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Offering 21 sweet modaks and fresh Durva grass, devotees invoke blessings to overcome every life obstacle.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Grand Visarjan processions with dhol beats and chants of "Ganpati Bappa Morya", celebrating divine presence.' }
    ];
  } else if (isNavratri) {
    subtitle = 'Cosmic Shakti & Goddess Durga Triumph • Ashwin / Chaitra';
    deity = 'Maa Durga & Navadurga';
    tradition = '9 Nights Fasting, Garba & Kanya Pujan';
    poeticBlessing = 'May the supreme nine manifestations of Maa Durga bless you with boundless courage, spiritual illumination, and righteous victory over all life’s challenges.';
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: 'The combined cosmic radiance of the Trinity manifested ten-armed Goddess Durga armed with celestial weapons.' },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Nine nights of intense tapasya worshipping the Navadurga embodiments of purity, wisdom, and cosmic valor.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'On Vijayadashami, Maa Durga vanquished Mahishasura, re-establishing cosmic harmony and righteous order.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: 'Devotees observe sacred fasts, chant Durga Saptashati, and perform Kanya Pujan honoring the divine feminine.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: 'Vibrant Garba and Dandiya Raas in traditional attire, uniting communities in devotion and spiritual joy.' }
    ];
  } else {
    // Dynamic authentic fallback
    poeticBlessing = `May the divine blessings and sacred grace of ${cleanTextForPdf(festivalName)} fill your home with lush joy, eternal peace, righteous wisdom, and spiritual fulfillment.`;
    chapters = [
      { id: 1, title: 'The Sacred Genesis', icon: 'lotus', content: sentences[0] || `${festivalName} has been celebrated since antiquity to honor divine cosmic harmony and righteous living.` },
      { id: 2, title: 'The Divine Resolve', icon: 'diya', content: sentences[1] || 'Ancient scriptures detail how devotees across generations have performed disciplined prayers and vows.' },
      { id: 3, title: 'The Celestial Triumph', icon: 'star', content: sentences[2] || 'The sacred festival marks the eternal triumph of righteousness, purity, and universal cosmic truth.' },
      { id: 4, title: 'The Grace of Blessings', icon: 'hands', content: sentences[3] || 'Families offer holy prayers, invoke celestial deities, and receive lifelong protection and prosperity.' },
      { id: 5, title: 'The Joyous Heritage', icon: 'swing', content: sentences[4] || 'Communities unite in joyous harmony, sharing prasadam, singing devotional hymns, and preserving Dharma.' }
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

    // STRICTLY SINGLE-PAGE A4 MASTER TEMPLATE FOR ALL FESTIVALS
    const page = doc.addPage([pageWidth, pageHeight]);

    // 1. Load and embed the master visual card artwork
    let embeddedArtwork = false;
    try {
      const cardAsset = require('../../assets/images/festival_master_pdf_card.jpg');
      const asset = Asset.fromModule(cardAsset);
      await asset.downloadAsync();
      const fileUriToRead = asset.localUri || asset.uri;
      if (fileUriToRead) {
        const base64Cover = await FileSystem.readAsStringAsync(fileUriToRead, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (base64Cover) {
          const embeddedBg = await doc.embedJpg(base64Cover);
          page.drawImage(embeddedBg, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });
          embeddedArtwork = true;
        }
      }
    } catch (assetErr) {
      console.warn('[PDF] Could not embed festival master card template:', assetErr);
    }

    if (embeddedArtwork) {
      // Dynamic 3D Embossed Gold Typography for ANY Festival Title
      const rawTitle = (data.festivalName || 'Sacred Festival').toUpperCase().trim();
      let words = rawTitle.split(/\s+/);
      if (!rawTitle.startsWith('HAPPY') && !rawTitle.startsWith('MAHA') && !rawTitle.startsWith('SHREE') && !rawTitle.startsWith('SHUBH')) {
        words = ['HAPPY', ...words];
      }

      let lines: string[] = [];
      if (words.length > 2 && (words[0] === 'HAPPY' || words[0] === 'SHUBH' || words[0] === 'MAHA' || words[0] === 'SHREE')) {
        lines.push(words[0]);
        lines.push(words.slice(1).join(' '));
      } else if (words.join(' ').length > 18) {
        const mid = Math.ceil(words.length / 2);
        lines.push(words.slice(0, mid).join(' '));
        lines.push(words.slice(mid).join(' '));
      } else {
        lines.push(words.join(' '));
      }

      const fontSize = lines.length > 1 ? 32 : 30;
      const lineSpacing = 36;
      const startY = lines.length > 1 ? 655 : 640;

      lines.forEach((line, idx) => {
        const textY = startY - idx * lineSpacing;
        const textWidth = fontTimesBold.widthOfTextAtSize(line, fontSize);
        const textX = (pageWidth - textWidth) / 2;

        // 4-layer 3D Embossed Gold Typography
        // Layer 1: Dark bronze bottom-right drop shadow
        page.drawText(line, {
          x: textX + 2.5,
          y: textY - 2.5,
          size: fontSize,
          font: fontTimesBold,
          color: rgb(0.38, 0.22, 0.06),
        });

        // Layer 2: Warm ambient shadow
        page.drawText(line, {
          x: textX + 1.2,
          y: textY - 1.2,
          size: fontSize,
          font: fontTimesBold,
          color: rgb(0.55, 0.35, 0.10),
        });

        // Layer 3: Top-left light golden reflection highlight
        page.drawText(line, {
          x: textX - 1.0,
          y: textY + 1.0,
          size: fontSize,
          font: fontTimesBold,
          color: rgb(0.99, 0.95, 0.75),
        });

        // Layer 4: Radiant Metallic Gold Main Face
        page.drawText(line, {
          x: textX,
          y: textY,
          size: fontSize,
          font: fontTimesBold,
          color: rgb(0.78, 0.52, 0.12),
        });
      });
    } else {
      // Clean fallback if image asset is unavailable
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(0.996, 0.988, 0.965),
      });
      page.drawRectangle({
        x: 16,
        y: 16,
        width: pageWidth - 32,
        height: pageHeight - 32,
        borderColor: rgb(0.85, 0.65, 0.25),
        borderWidth: 2,
      });
      const title = data.festivalName.toUpperCase();
      const titleWidth = fontTimesBold.widthOfTextAtSize(title, 26);
      page.drawText(title, {
        x: (pageWidth - titleWidth) / 2,
        y: pageHeight - 120,
        size: 26,
        font: fontTimesBold,
        color: rgb(0.78, 0.52, 0.12),
      });
    }

    // ==========================================
    // PAGE 2+: Sacred Katha Narrative Pages
    // ==========================================
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    const bottomMargin = 40;

    let storyPage = doc.addPage([pageWidth, pageHeight]);
    let storyY = pageHeight - margin;

    const drawPageBackground = (p: any) => {
      // Soft cream parchment background
      p.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(0.996, 0.988, 0.965),
      });
      // Double gold border
      p.drawRectangle({
        x: 16,
        y: 16,
        width: pageWidth - 32,
        height: pageHeight - 32,
        borderColor: rgb(0.85, 0.65, 0.25),
        borderWidth: 1.5,
      });
      p.drawRectangle({
        x: 20,
        y: 20,
        width: pageWidth - 40,
        height: pageHeight - 40,
        borderColor: rgb(0.92, 0.78, 0.45),
        borderWidth: 0.6,
      });
    };

    drawPageBackground(storyPage);

    const drawHeader = (isFirstStoryPage: boolean) => {
      if (isFirstStoryPage) {
        // Branding Header
        const brandText = 'B R A H M A N D';
        const brandWidth = fontTimesBold.widthOfTextAtSize(brandText, 14);
        storyPage.drawText(brandText, {
          x: (pageWidth - brandWidth) / 2,
          y: storyY - 10,
          size: 14,
          font: fontTimesBold,
          color: rgb(0.77, 0.38, 0.06),
        });

        const subBrand = 'SANATAN DHARMA SACRED HERITAGE';
        const subBrandWidth = fontHelveticaBold.widthOfTextAtSize(subBrand, 7.5);
        storyPage.drawText(subBrand, {
          x: (pageWidth - subBrandWidth) / 2,
          y: storyY - 22,
          size: 7.5,
          font: fontHelveticaBold,
          color: rgb(0.45, 0.25, 0.10),
        });

        // Gold divider line
        storyPage.drawLine({
          start: { x: margin + 40, y: storyY - 28 },
          end: { x: pageWidth - margin - 40, y: storyY - 28 },
          thickness: 0.8,
          color: rgb(0.85, 0.65, 0.25),
        });

        // Festival Title Banner
        const titleBannerY = storyY - 72;
        storyPage.drawRectangle({
          x: margin,
          y: titleBannerY,
          width: contentWidth,
          height: 38,
          color: rgb(0.98, 0.94, 0.88),
          borderColor: rgb(0.85, 0.65, 0.25),
          borderWidth: 1,
        });

        const storyTitle = `${cleanTextForPdf(data.festivalName).toUpperCase()} - SACRED VRAT KATHA`;
        const titleW = fontTimesBold.widthOfTextAtSize(storyTitle, 13);
        storyPage.drawText(storyTitle, {
          x: (pageWidth - titleW) / 2,
          y: titleBannerY + 22,
          size: 13,
          font: fontTimesBold,
          color: rgb(0.12, 0.14, 0.17),
        });

        const subW = fontTimesItalic.widthOfTextAtSize(cleanTextForPdf(data.subtitle), 8.5);
        storyPage.drawText(cleanTextForPdf(data.subtitle), {
          x: (pageWidth - subW) / 2,
          y: titleBannerY + 8,
          size: 8.5,
          font: fontTimesItalic,
          color: rgb(0.45, 0.35, 0.20),
        });

        storyY -= 80;

        // Metadata pill strip
        storyPage.drawRectangle({
          x: margin,
          y: storyY - 22,
          width: contentWidth,
          height: 22,
          color: rgb(0.12, 0.16, 0.22),
        });

        const metaText = `Date: ${data.date}   |   Deity: ${data.deity}   |   Tradition: ${data.tradition}`;
        const metaW = fontHelveticaBold.widthOfTextAtSize(metaText, 7.8);
        storyPage.drawText(metaText, {
          x: (pageWidth - metaW) / 2,
          y: storyY - 15,
          size: 7.8,
          font: fontHelveticaBold,
          color: rgb(1, 1, 1),
        });

        storyY -= 32;
      } else {
        // Sub-page running header
        const subHeader = `BRAHMAND  -  ${cleanTextForPdf(data.festivalName).toUpperCase()} SACRED KATHA`;
        storyPage.drawText(subHeader, {
          x: margin,
          y: storyY - 10,
          size: 8.5,
          font: fontTimesBold,
          color: rgb(0.75, 0.35, 0.08),
        });
        storyPage.drawLine({
          start: { x: margin, y: storyY - 14 },
          end: { x: margin + contentWidth, y: storyY - 14 },
          thickness: 0.6,
          color: rgb(0.85, 0.70, 0.40),
        });
        storyY -= 26;
      }
    };

    drawHeader(true);

    // Render Chapters
    for (let i = 0; i < data.chapters.length; i++) {
      const ch = data.chapters[i];
      const chTitle = `Chapter ${i + 1}: ${cleanTextForPdf(ch.title).toUpperCase()}`;
      const wrapped = wrapText(cleanTextForPdf(ch.content), fontTimes, 10, contentWidth - 28);
      const boxHeight = 24 + (wrapped.length * 15) + 8;

      if (storyY - boxHeight < bottomMargin + 40) {
        storyPage = doc.addPage([pageWidth, pageHeight]);
        drawPageBackground(storyPage);
        storyY = pageHeight - margin;
        drawHeader(false);
      }

      // Chapter card container
      storyPage.drawRectangle({
        x: margin,
        y: storyY - boxHeight,
        width: contentWidth,
        height: boxHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.90, 0.82, 0.70),
        borderWidth: 0.8,
      });

      // Saffron left accent bar
      storyPage.drawRectangle({
        x: margin,
        y: storyY - boxHeight,
        width: 4,
        height: boxHeight,
        color: rgb(0.85, 0.45, 0.10),
      });

      // Chapter Title
      storyPage.drawText(chTitle, {
        x: margin + 14,
        y: storyY - 16,
        size: 10,
        font: fontTimesBold,
        color: rgb(0.72, 0.32, 0.05),
      });

      // Narrative text
      let textY = storyY - 32;
      for (const line of wrapped) {
        storyPage.drawText(line, {
          x: margin + 14,
          y: textY,
          size: 10,
          font: fontTimes,
          color: rgb(0.18, 0.18, 0.20),
        });
        textY -= 15;
      }

      storyY -= (boxHeight + 10);
    }

    // Vedic Significance & Blessing Box
    const blessingTitle = 'DHARMO RAKSHATI RAKSHITAH - VEDIC BLESSINGS';
    const blessingLines = wrapText(cleanTextForPdf(data.blessing), fontTimesItalic, 9.5, contentWidth - 28);
    const blessingBoxHeight = 24 + (blessingLines.length * 14) + 10;

    if (storyY - blessingBoxHeight < bottomMargin + 40) {
      storyPage = doc.addPage([pageWidth, pageHeight]);
      drawPageBackground(storyPage);
      storyY = pageHeight - margin;
      drawHeader(false);
    }

    storyPage.drawRectangle({
      x: margin,
      y: storyY - blessingBoxHeight,
      width: contentWidth,
      height: blessingBoxHeight,
      color: rgb(0.99, 0.97, 0.92),
      borderColor: rgb(0.88, 0.72, 0.40),
      borderWidth: 1,
    });

    storyPage.drawText(blessingTitle, {
      x: margin + 14,
      y: storyY - 16,
      size: 9.5,
      font: fontTimesBold,
      color: rgb(0.68, 0.32, 0.05),
    });

    let bY = storyY - 32;
    for (const line of blessingLines) {
      storyPage.drawText(line, {
        x: margin + 14,
        y: bY,
        size: 9.5,
        font: fontTimesItalic,
        color: rgb(0.35, 0.28, 0.18),
      });
      bY -= 14;
    }

    // Footers on all narrative pages
    const totalPages = doc.getPageCount();
    for (let p = 1; p < totalPages; p++) {
      const curPage = doc.getPage(p);
      curPage.drawLine({
        start: { x: margin, y: bottomMargin },
        end: { x: margin + contentWidth, y: bottomMargin },
        thickness: 0.5,
        color: rgb(0.85, 0.75, 0.60),
      });

      curPage.drawText('Brahmand App - Sanatan Lok', {
        x: margin,
        y: bottomMargin - 12,
        size: 8,
        font: fontHelveticaBold,
        color: rgb(0.70, 0.35, 0.08),
      });

      curPage.drawText(`Page ${p} of ${totalPages - 1}`, {
        x: margin + contentWidth - 56,
        y: bottomMargin - 12,
        size: 8,
        font: fontHelvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

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
