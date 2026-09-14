import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  pushGraphicsState,
  popGraphicsState,
  clip,
  endPath,
  appendBezierCurve,
  moveTo,
  closePath,
  PDFString,
} from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share as RNShare, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { getFestivalImage } from '../constants/festivalImages';

// Ensure regeneratorRuntime is available for @pdf-lib/fontkit Devanagari complex text shaping
if (typeof (global as any).regeneratorRuntime === 'undefined') {
  try {
    (global as any).regeneratorRuntime = require('regenerator-runtime/runtime');
  } catch (_e1) {
    try {
      (global as any).regeneratorRuntime = require('@babel/runtime/regenerator');
    } catch (_e2) {}
  }
}

// Pure JS Base64 to Uint8Array decoder (cross-platform compatible across iOS, Android, Node)
function decodeBase64ToUint8(b64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  let bufferLength = Math.floor(len * 0.75);
  if (clean[len - 1] === '=') bufferLength--;
  if (clean[len - 2] === '=') bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = chars.indexOf(clean[i]);
    const enc2 = chars.indexOf(clean[i + 1]);
    const enc3 = chars.indexOf(clean[i + 2]);
    const enc4 = chars.indexOf(clean[i + 3]);
    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (enc3 !== -1 && p < bufferLength) bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    if (enc4 !== -1 && p < bufferLength) bytes[p++] = ((enc3 & 3) << 6) | enc4;
  }
  return bytes;
}

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
  const words = (text || '').trim().split(/\s+/);
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

/**
 * Constructs a production-ready tracked UTM Brahmand URL for analytics attribution and dynamic referral tracking.
 */
export function getTrackedBrahmandUrl(
  festivalName: string,
  placement: 'download_button' | 'pdf_footer' | 'whatsapp_status' | 'whatsapp_share' | 'pdf_qr_scan' = 'download_button'
): string {
  const cleanName = (festivalName || 'festival')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const slug = cleanName || 'festival';

  // Ultra-compact URL for QR matrix: Keeps QR modules big and instantly scannable from far away
  if (placement === 'pdf_qr_scan') {
    return `https://brahmand.app/download?f=${slug}&s=qr`;
  }

  const params = [
    `source=${slug}_pdf`,
    'utm_source=pdf_katha',
    'utm_medium=whatsapp',
    `utm_campaign=katha_${slug}`,
    `utm_content=${placement}`,
    `festival=${slug}`,
  ].join('&');
  // Both https://brahmand.app/download and /join work; /download is already live with instant Android Play Store auto-redirect
  return `https://brahmand.app/download?${params}`;
}

/**
 * Attaches a fully interactive, clickable Link annotation to a page using clean ISO-standard PDF link dictionaries.
 * Omit QuadPoints and F: 4 so all mobile and desktop viewers (Android, iOS QuickLook, Acrobat, Chrome, WhatsApp)
 * cleanly handle touch hit-testing using Rect bounds without print-only flag or vertex conflicts.
 */
function addClickableLink(
  doc: PDFDocument,
  page: any,
  uri: string,
  rect: [number, number, number, number]
) {
  try {
    const [x1, y1, x2, y2] = rect;
    const rX1 = Math.round(Math.min(x1, x2));
    const rY1 = Math.round(Math.min(y1, y2));
    const rX2 = Math.round(Math.max(x1, x2));
    const rY2 = Math.round(Math.max(y1, y2));

    const linkAnnotation = doc.context.register(
      doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [rX1, rY1, rX2, rY2],
        Border: [0, 0, 0],
        C: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(uri),
        },
      })
    );
    page.node.addAnnot(linkAnnotation);
  } catch (err) {
    console.warn('[PDF] Failed to add link annotation:', err);
  }
}

// Draw justified text line with elegant typographical spacing
function drawJustifiedLine(
  page: any,
  lineText: string,
  font: any,
  fontSize: number,
  color: any,
  startX: number,
  startY: number,
  lineWidth: number,
  isLastLine: boolean = false
) {
  const words = lineText.trim().split(/\s+/);
  if (words.length <= 1 || isLastLine) {
    page.drawText(lineText, {
      x: startX,
      y: startY,
      size: fontSize,
      font: font,
      color: color,
    });
    return;
  }

  let totalWordsWidth = 0;
  for (const w of words) {
    totalWordsWidth += font.widthOfTextAtSize(w, fontSize);
  }

  const numSpaces = words.length - 1;
  const normalSpaceWidth = font.widthOfTextAtSize(' ', fontSize);
  const spaceWidth = (lineWidth - totalWordsWidth) / numSpaces;

  // If spacing would be unnaturally huge, fall back to normal spacing
  if (spaceWidth > normalSpaceWidth * 2.8 || spaceWidth < normalSpaceWidth * 0.7) {
    page.drawText(lineText, {
      x: startX,
      y: startY,
      size: fontSize,
      font: font,
      color: color,
    });
    return;
  }

  let curX = startX;
  for (let i = 0; i < words.length; i++) {
    page.drawText(words[i], {
      x: curX,
      y: startY,
      size: fontSize,
      font: font,
      color: color,
    });
    curX += font.widthOfTextAtSize(words[i], fontSize) + spaceWidth;
  }
}

// Draw authentic, scannable vector QR code matrix with vintage gold styling & embedded Brahmand logo
function drawQrCodeMatrix(
  page: any,
  text: string,
  startX: number,
  startY: number,
  size: number,
  darkColor: any,
  lightColor: any,
  logoImage?: any
) {
  try {
    const qrcodeGen = require('qrcode-generator');
    // Error correction Level 'Q' (25%) ensures camera distance scannability even with center logo
    const qr = qrcodeGen(0, 'Q');
    qr.addData(text);
    qr.make();
    const modules = qr.getModuleCount();
    const modSize = size / modules;

    page.drawRectangle({
      x: startX,
      y: startY,
      width: size,
      height: size,
      color: lightColor,
    });

    // Compact center cutout boundary taking ~5% of matrix area
    const logoFrac = logoImage ? 0.18 : 0;
    const centerStart = logoImage ? Math.floor(modules * (0.5 - logoFrac / 2)) : -1;
    const centerEnd = logoImage ? Math.ceil(modules * (0.5 + logoFrac / 2)) : -1;

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Leave center badge area clear for logo
        if (logoImage && r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd) {
          continue;
        }

        if (qr.isDark(r, c)) {
          page.drawRectangle({
            x: startX + c * modSize,
            y: startY + (modules - 1 - r) * modSize,
            width: modSize,
            height: modSize,
            color: darkColor,
          });
        }
      }
    }

    // Embed small central Brahmand vector logo inside QR code
    if (logoImage) {
      const centerBoxSize = (centerEnd - centerStart) * modSize;
      const centerBoxX = startX + centerStart * modSize;
      const centerBoxY = startY + (modules - centerEnd) * modSize;

      page.drawRectangle({
        x: centerBoxX,
        y: centerBoxY,
        width: centerBoxSize,
        height: centerBoxSize,
        color: lightColor,
        borderColor: rgb(0.784, 0.663, 0.494), // #C8A97E vintage gold
        borderWidth: 0.6,
      });

      const iconPad = 1.8;
      page.drawImage(logoImage, {
        x: centerBoxX + iconPad,
        y: centerBoxY + iconPad,
        width: centerBoxSize - iconPad * 2,
        height: centerBoxSize - iconPad * 2,
      });
    }
  } catch (qrErr) {
    console.warn('[PDF] Failed to generate vector QR via qrcode-generator, using fallback:', qrErr);
    page.drawRectangle({
      x: startX,
      y: startY,
      width: size,
      height: size,
      color: lightColor,
    });
  }
}

export interface StoryChapter {
  id: number;
  title: string;
  content: string;
  icon?: 'lotus' | 'diya' | 'star' | 'hands' | 'swing' | 'flower' | 'anjali';
}

export interface FestivalTheme {
  name: string;
  hindiName: string;
  devanagariRoman: string;
  primaryAccent: any;
  secondaryAccent: any;
  gold: any;
  cream: any;
  charcoal: any;
  heroGradientTop: any;
  heroGradientBottom: any;
  date: string;
  tithi: string;
  greeting: string;
  deity: string;
  tradition: string;
  subtitle: string;
  chapters: StoryChapter[];
  blessing: string;
}

export function getFestivalTheme(festival: any, sectionValue?: string): FestivalTheme {
  const festivalName = (festival?.festival_name || festival?.name || festival?.title || 'Festival').trim();
  const lower = festivalName.toLowerCase();

  const creamBg = rgb(0.992, 0.984, 0.969); // #FDFBF7 Warm Ivory Parchment
  const antiqueGold = rgb(0.831, 0.686, 0.216); // #D4AF37 Antique Gold
  const deepCharcoal = rgb(0.173, 0.173, 0.173); // #2C2C2C Deep Charcoal (NO pure black)

  const dateFromData = festival?.date || festival?.start_date;
  const storyText = sectionValue || festival?.origin || festival?.story || festival?.summary || '';
  const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];

  if (lower.includes('diwali') || lower.includes('deepavali')) {
    return {
      name: 'Diwali',
      hindiName: 'DEEPAVALI',
      devanagariRoman: 'DEEPAVALI',
      primaryAccent: rgb(0.90, 0.32, 0.05), // Saffron #E65100
      secondaryAccent: rgb(0.48, 0.08, 0.14), // Deep Maroon #7A1424
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.48, 0.08, 0.14),
      heroGradientBottom: rgb(0.90, 0.38, 0.08),
      date: dateFromData || '20TH OCTOBER 2026',
      tithi: 'KARTIK AMAVASYA',
      greeting: 'May the divine radiance of festive lamps illuminate your path with joy, boundless prosperity, good fortune and eternal harmony.',
      deity: 'Lord Rama, Goddess Lakshmi & Lord Ganesha',
      tradition: 'Lighting Diyas, Rangoli & Lakshmi Pujan',
      subtitle: 'Return of Lord Rama & Worship of Goddess Lakshmi - Kartik Amavasya',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'Lord Rama triumphantly returned to Ayodhya after fourteen years of righteous exile, welcomed by jubilant citizens with glowing clay lamps.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Goddess Lakshmi emerged in celestial splendor from the churning cosmic milk ocean (Samudra Manthan), bestowing universal auspiciousness.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Light triumphs eternally over darkness, truth over deception, and righteous dharma vanquishes all ignorance and spiritual stagnation.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Families gather for auspicious Lakshmi and Ganesha Puja, invoking abundance, pure intellect, good fortune, and harmony.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Decorating doorsteps with vibrant Rangoli, lighting clay lamps, exchanging traditional sweets, and celebrating cherished brotherhood.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('janmashtami') || lower.includes('krishna')) {
    return {
      name: 'Janmashtami',
      hindiName: 'KRISHNA JANMASHTAMI',
      devanagariRoman: 'KRISHNA JANMASHTAMI',
      primaryAccent: rgb(0.06, 0.28, 0.60), // Peacock Blue #0F489A
      secondaryAccent: rgb(0.32, 0.10, 0.48), // Royal Purple #521A7A
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.12, 0.18, 0.38),
      heroGradientBottom: rgb(0.24, 0.12, 0.42),
      date: dateFromData || '4TH SEPTEMBER 2026',
      tithi: 'BHADRAPADA KRISHNA ASHTAMI',
      greeting: 'May the enchanting grace and divine wisdom of Lord Krishna fill your life with joy, unconditional love, courage and righteous fulfillment.',
      deity: 'Lord Sri Krishna & Devaki-Vasudeva',
      tradition: 'Midnight Vigil, Fasting & Dahi Handi',
      subtitle: 'Divine Nativity of Lord Krishna & Vrindavan Leelas - Bhadrapada',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'Lord Krishna manifested at the midnight hour in Mathura during torrential rains to establish Dharma and vanquish tyrant Kamsa.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Vasudeva bravely crossed the roaring Yamuna shielded by the hoods of Sheshnaag to safely bear infant Krishna to Gokul.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Young Krishna performed miraculous leelas across Vrindavan, subduing serpent Kaliya and uplifting Mount Govardhan.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Devotees observe midnight Nishita fasting, rocking baby Krishna in adorned silver cradles and chanting divine Gita hymns.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Youth form spirited human pyramids to break butter-filled Dahi Handi pots, singing and dancing in ecstatic spiritual celebration.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('navratri') || lower.includes('durga')) {
    return {
      name: 'Navratri',
      hindiName: 'SHARAD NAVRATRI',
      devanagariRoman: 'SHARAD NAVRATRI',
      primaryAccent: rgb(0.68, 0.06, 0.18), // Rich Red #AE102E
      secondaryAccent: rgb(0.92, 0.42, 0.08), // Saffron #EA6B14
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.55, 0.05, 0.15),
      heroGradientBottom: rgb(0.85, 0.35, 0.08),
      date: dateFromData || '11TH OCTOBER 2026',
      tithi: 'ASHWIN SHUKLA PRATIPADA TO NAVAMI',
      greeting: 'May the nine manifestations of Maa Durga bless your home with fearless strength, inner radiance, boundless prosperity and victory.',
      deity: 'Maa Durga & Navadurga',
      tradition: '9 Nights Fasting, Garba & Kanya Pujan',
      subtitle: 'Cosmic Shakti & Goddess Durga Triumph - Ashwin / Chaitra',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'The unified celestial radiance of the Trinity manifested ten-armed Goddess Durga, wielding cosmic weapons of righteousness.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Nine divine nights of tapasya worshipping the Navadurga embodiments of purity, wisdom, cosmic power, and divine motherhood.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'On Vijayadashami, Maa Durga vanquished demon Mahishasura, re-establishing cosmic harmony and eternal righteous order.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Devotees observe observant fasts, chant Durga Saptashati, and perform reverent Kanya Pujan honoring the divine feminine.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Vibrant Garba and Dandiya Raas in traditional attire, uniting communities in joyful devotion and supreme spiritual elevation.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('holi')) {
    return {
      name: 'Holi',
      hindiName: 'RANGWALI HOLI',
      devanagariRoman: 'RANGWALI HOLI',
      primaryAccent: rgb(0.88, 0.15, 0.45), // Festive Magenta #E02674
      secondaryAccent: rgb(0.08, 0.55, 0.50), // Turquoise Teal #148C80
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.65, 0.10, 0.35),
      heroGradientBottom: rgb(0.95, 0.45, 0.10),
      date: dateFromData || '24TH MARCH 2026',
      tithi: 'PHALGUNA PURNIMA',
      greeting: 'May the joyous festival of colors paint your life with radiant laughter, enduring warmth, cherished bonds and everlasting peace.',
      deity: 'Lord Vishnu & Bhakta Prahlada',
      tradition: 'Holika Dahan, Gulal & Festive Harmony',
      subtitle: 'Triumph of Devotion over Demoness Holika - Phalguna',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'Bhakta Prahlada stood unshakeable in his devotion to Lord Narayana despite tyrant Hiranyakashipu attempts to break his faith.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Entering the blaze with Holika, Prahlada unwavering chanting saved him while fire destroyed the demoness.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Lord Narasimha manifested at twilight to vanquish tyrant evil and restore cosmic truth and righteousness.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Lighting Holika pyre dispels negative energies, cleansing hearts and invoking prosperity and divine protection.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Communities rejoice with vibrant organic colors, sweet Gujiyas, lively folk songs, and joyful embrace of brotherhood.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('teej') || lower.includes('hariyali')) {
    return {
      name: 'Hariyali Teej',
      hindiName: 'HARIYALI TEEJ',
      devanagariRoman: 'HARIYALI TEEJ',
      primaryAccent: rgb(0.12, 0.42, 0.22), // Monsoon Green #1F6B38
      secondaryAccent: rgb(0.82, 0.28, 0.48), // Lotus Pink #D1477A
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.10, 0.35, 0.18),
      heroGradientBottom: rgb(0.20, 0.50, 0.30),
      date: dateFromData || '16TH AUGUST 2026',
      tithi: 'SHRAVAN SHUKLA TRITIYA',
      greeting: 'May the divine union of Shiva and Parvati bring lush happiness, lifelong love, prosperity and timeless auspiciousness to your home.',
      deity: 'Lord Shiva & Goddess Parvati',
      tradition: 'Nirjala Fast, Green Attire & Sawan Swings',
      subtitle: 'The Divine Union of Shiva & Parvati - Shravan Shukla Tritiya',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'Long ago, Goddess Parvati desired Lord Shiva as her divine consort, awakening his cosmic grace through selfless devotion across the ages.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Goddess Parvati embarked on severe austerities spanning 108 lifetimes across rugged mountain caves and dense Shravan forests in unwavering faith.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Moved by her unyielding penance, Lord Shiva manifested on Shravan Tritiya and accepted Parvati as his eternal divine consort.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Devotees observing Teej fasts and prayers receive Akhand Saubhagya, lifelong marital harmony, and celestial spiritual blessings.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Women gather in green attire, apply intricate mehndi on palms, swing on floral jhulas, and celebrate with sweet Ghevar and joyous hymns.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('makar') || lower.includes('sankranti') || lower.includes('pongal')) {
    return {
      name: 'Makar Sankranti',
      hindiName: 'MAKAR SANKRANTI',
      devanagariRoman: 'MAKAR SANKRANTI',
      primaryAccent: rgb(0.92, 0.52, 0.06), // Sun Saffron #EA8510
      secondaryAccent: rgb(0.10, 0.42, 0.72), // Azure Sky #1A6BB8
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.85, 0.45, 0.05),
      heroGradientBottom: rgb(0.95, 0.70, 0.15),
      date: dateFromData || '14TH JANUARY 2026',
      tithi: 'UTTARAYANA SURYA SANKRANTI',
      greeting: 'May the sun-blessed skies of Uttarayana illuminate your path with warm vitality, sweet abundance, good health and righteous success.',
      deity: 'Surya Devta & Lord Vishnu',
      tradition: 'Holy Snan, Til-Gul Sweets & Kite Flying',
      subtitle: 'Solar Transition into Capricorn & Uttarayana Dawn',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'Surya Devta transitions into Makara rashi, marking the auspicious dawn of Uttarayana and longer radiant days.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Devotees take holy dips in Ganga, Yamuna and Godavari, welcoming purifying celestial rays and renewed vigor.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'Light triumphs as the sun journeys northward, symbolizing spiritual ascent, wisdom, and victory over inertia.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Exchanging sesame and jaggery delicacies with the blessing "Til-gul ghya, god god bola" fosters goodwill and love.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Vibrant kites flutter across azure skies as families unite on terraces with laughter, warmth, and gratitude.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('raksha') || lower.includes('bandhan')) {
    return {
      name: 'Raksha Bandhan',
      hindiName: 'RAKSHA BANDHAN',
      devanagariRoman: 'RAKSHA BANDHAN',
      primaryAccent: rgb(0.78, 0.12, 0.36), // Rose Crimson #C71F5C
      secondaryAccent: rgb(0.90, 0.45, 0.08), // Saffron #E67314
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.60, 0.08, 0.25),
      heroGradientBottom: rgb(0.85, 0.35, 0.10),
      date: dateFromData || '28TH AUGUST 2026',
      tithi: 'SHRAVAN PURNIMA',
      greeting: 'May the timeless bond of affection and protection bring enduring joy, deep harmony, well-being and blessings to your family.',
      deity: 'Lord Sri Krishna & Draupadi',
      tradition: 'Rakhi Tying, Sweets & Sibling Blessings',
      subtitle: 'Cherished Bond of Sibling Protection & Krishna Grace',
      chapters: [
        { id: 1, title: 'The Divine Genesis', icon: 'lotus', content: 'When Lord Krishna finger was injured, Queen Draupadi unhesitatingly tore a piece of her silk sari to bandage it.' },
        { id: 2, title: 'The Divine Resolve', icon: 'diya', content: 'Moved by her pure devotion, Lord Krishna pledged eternal protection, honoring the cherished thread of affection.' },
        { id: 3, title: 'The Celestial Triumph', icon: 'star', content: 'In her moment of need, Krishna boundless grace supplied unending yards of cloth, protecting Draupadi dignity.' },
        { id: 4, title: 'The Grace of Blessings', icon: 'anjali', content: 'Sisters tie decorative Rakhis on their brothers wrists, praying for their long life, health, and spiritual fortune.' },
        { id: 5, title: 'The Joyous Heritage', icon: 'flower', content: 'Families exchange thoughtful gifts, share delicious sweets, and renew vows of lifelong mutual support and love.' },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  // Default: Ganesh Chaturthi (Universal)
  return {
    name: festivalName || 'Ganesh Chaturthi',
    hindiName: 'SHREE GANESH CHATURTHI',
    devanagariRoman: 'SHREE GANESH CHATURTHI',
    primaryAccent: rgb(0.82, 0.18, 0.10), // Vermilion / Sindoori #D12E1A
    secondaryAccent: rgb(0.92, 0.48, 0.08), // Saffron #EB7A14
    gold: antiqueGold,
    cream: creamBg,
    charcoal: deepCharcoal,
    heroGradientTop: rgb(0.55, 0.10, 0.06),
    heroGradientBottom: rgb(0.85, 0.38, 0.08),
    date: dateFromData || '14TH SEPTEMBER 2026',
    tithi: 'BHADRAPADA SHUKLA CHATURTHI',
    greeting: 'May this festival fill your life with joy, harmony, prosperity and divine blessings.',
    deity: festival?.deity || festival?.deities || 'Lord Ganesha (Vighnaharta)',
    tradition: festival?.tradition || 'Ganesha Sthapana, 21 Modaks & Visarjan',
    subtitle: 'Manifestation of Ganesha & Wisdom of Modaks - Bhadrapada',
    chapters: [
      {
        id: 1,
        title: 'The Divine Genesis',
        icon: 'lotus',
        content: 'Mother Parvati created young Ganesha with consecrated turmeric paste infused with divine prana, consecrating him as her pure guardian to watch over her palace gates on Mount Kailash. When Lord Shiva arrived, the devoted child steadfastly upheld his duty with fearless loyalty.',
      },
      {
        id: 2,
        title: 'The Divine Resolve',
        icon: 'diya',
        content: 'A cosmic contest of speed was declared between Kartikeya and Ganesha to circle the universe. While Kartikeya flew across planets on his peacock, Ganesha circumambulated his divine parents, declaring they embody the entirety of creation, earning eternal praise as Prathama Pujya.',
      },
      {
        id: 3,
        title: 'The Celestial Triumph',
        icon: 'star',
        content: 'Chosen by Sage Ved Vyasa to pen the timeless epic Mahabharata, Ganesha agreed on condition that the recitation never pause. When his quill broke, he severed his own tusk without hesitation, demonstrating supreme intellect, discipline, and eternal dedication to timeless wisdom.',
      },
      {
        id: 4,
        title: 'The Grace of Blessings',
        icon: 'anjali',
        content: 'Devotees observe spiritual vows on Bhadrapada Shukla Chaturthi, offering 21 modaks, fresh red hibiscus, and auspicious Durva grass. Lord Vighnaharta removes every inner and worldly impediment, showering families with righteous prosperity, intellect, peace, and good fortune.',
      },
      {
        id: 5,
        title: 'The Joyous Heritage',
        icon: 'flower',
        content: 'Across ten days of joyous festivities, hymns resonate as families celebrate Ganesha in decorated home sanctums. On Anant Chaturdashi, grand Visarjan processions carry Bappa to rivers and oceans amidst dhol beats, singing Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya!',
      },
    ],
    blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
  };
}

export function getFestivalChapters(festival: any, sectionValue?: string) {
  const theme = getFestivalTheme(festival, sectionValue);
  return {
    festivalName: theme.name,
    subtitle: theme.subtitle,
    deity: theme.deity,
    date: theme.date,
    tradition: theme.tradition,
    chapters: theme.chapters,
    blessing: theme.blessing,
    poeticBlessing: theme.greeting,
  };
}

async function loadPdfFonts(doc: PDFDocument) {
  let fontCinzel: any = null;
  let fontRozha: any = null;
  let fontPoppins: any = null;
  try {
    const fontkit = require('@pdf-lib/fontkit');
    doc.registerFontkit(fontkit);

    // 1. Cinzel (English royal serif)
    try {
      const cinzelAsset = Asset.fromModule(require('../../assets/fonts/Cinzel-Regular.ttf'));
      await cinzelAsset.downloadAsync();
      const fontUri = cinzelAsset.localUri || cinzelAsset.uri;
      if (fontUri) {
        const fontBase64 = await FileSystem.readAsStringAsync(fontUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fontCinzel = await doc.embedFont(decodeBase64ToUint8(fontBase64));
      }
    } catch (cinzelErr) {
      console.warn('[PDF] Cinzel font embedding fallback:', cinzelErr);
    }

    // 2. Rozha One (Hindi sacred headline serif)
    try {
      const rozhaAsset = Asset.fromModule(require('../../assets/fonts/RozhaOne-Regular.ttf'));
      await rozhaAsset.downloadAsync();
      const rozhaUri = rozhaAsset.localUri || rozhaAsset.uri;
      if (rozhaUri) {
        const rozhaBase64 = await FileSystem.readAsStringAsync(rozhaUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fontRozha = await doc.embedFont(decodeBase64ToUint8(rozhaBase64));
      }
    } catch (rozhaErr) {
      console.warn('[PDF] RozhaOne font embedding fallback:', rozhaErr);
    }

    // 3. Poppins (Clean modern Devanagari & English sans-serif)
    try {
      const poppinsAsset = Asset.fromModule(require('../../assets/fonts/Poppins-Regular.ttf'));
      await poppinsAsset.downloadAsync();
      const poppinsUri = poppinsAsset.localUri || poppinsAsset.uri;
      if (poppinsUri) {
        const poppinsBase64 = await FileSystem.readAsStringAsync(poppinsUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fontPoppins = await doc.embedFont(decodeBase64ToUint8(poppinsBase64));
      }
    } catch (poppinsErr) {
      console.warn('[PDF] Poppins font embedding fallback:', poppinsErr);
    }
  } catch (fontErr) {
    console.warn('[PDF] Fontkit registration or font embedding fallback:', fontErr);
  }

  const fontTimes = await doc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fontHelvetica = await doc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const displayFont = fontCinzel || fontTimesBold;

  let brahmandLogo: any = null;
  try {
    const logoAsset = Asset.fromModule(require('../../assets/images/brahmand_logo_transparent.png'));
    await logoAsset.downloadAsync();
    const logoUri = logoAsset.localUri || logoAsset.uri;
    if (logoUri) {
      const base64 = await FileSystem.readAsStringAsync(logoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = decodeBase64ToUint8(base64);
      brahmandLogo = await doc.embedPng(bytes);
    }
  } catch (logoErr) {
    console.warn('[PDF] Brahmand logo embedding fallback:', logoErr);
  }

  return {
    fontCinzel,
    fontRozha,
    fontPoppins,
    fontTimes,
    fontTimesBold,
    fontTimesItalic,
    fontHelvetica,
    fontHelveticaBold,
    displayFont,
    brahmandLogo,
  };
}

/**
 * Resolves the hero image for any festival.
 * - For Ganesh Chaturthi: embeds local high-res ganesh_chaturthi_hero.jpg from the story page.
 * - For other festivals: embeds festival image from data or downloads from CDN.
 * - Fallback: embeds official Brahmand logo or returns null for vector medallion fallback.
 */
async function resolveFestivalHeroImage(doc: PDFDocument, theme: FestivalTheme, festival: any): Promise<any> {
  const lower = (theme.name || festival?.festival_name || festival?.name || '').toLowerCase();

  // 1. If Ganesh Chaturthi / Vinayaka: use local high-res Ganesh image from the story page
  if (lower.includes('ganesh') || lower.includes('vinayaka') || lower.includes('chaturthi')) {
    try {
      const ganeshAsset = Asset.fromModule(require('../../assets/images/ganesh_chaturthi_hero.jpg'));
      await ganeshAsset.downloadAsync();
      const uri = ganeshAsset.localUri || ganeshAsset.uri;
      if (uri) {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        return await doc.embedJpg(decodeBase64ToUint8(b64));
      }
    } catch (err) {
      console.warn('[PDF] Could not embed local Ganesh hero:', err);
    }
  }

  // 2. Exact match with the festival's story page image (FestivalSectionDetailCard)
  const isNagPanchami = lower.includes('nag') || lower.includes('panchami');
  const isHariyaliTeej = lower.includes('hariyali');
  const isKajariTeej = lower.includes('kajari') || lower.includes('badi teej') || lower.includes('satudi');
  const isOnam = lower.includes('onam');
  const isRakshaBandhan = lower.includes('raksha') || lower.includes('bandhan');
  const isJanmashtami = lower.includes('janmashtami') || lower.includes('krishna');
  const isGaneshChaturthi = lower.includes('ganesh') || lower.includes('vinayaka') || lower.includes('chaturthi');
  const isNavratri = lower.includes('navratri') || lower.includes('durga') || lower.includes('pooja');
  const isDiwali = lower.includes('diwali') || lower.includes('deepavali') || lower.includes('lakshmi');
  const isShivratri = lower.includes('shivratri') || lower.includes('mahadev');

  let imageUrl = '';
  if (isHariyaliTeej) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/hariyali_teej_story_hero.webp';
  else if (isKajariTeej) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/kajari_teej_story_hero.webp';
  else if (isNagPanchami) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/nag_panchami_story_hero.webp';
  else if (isOnam) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/onam_story_hero.webp';
  else if (isRakshaBandhan) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/raksha_bandhan_story_hero.webp';
  else if (isJanmashtami) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/janmashtami_story_hero.webp';
  else if (isGaneshChaturthi) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/ganesh_chaturthi_story_hero.webp';
  else if (isNavratri) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/navratri_story_hero.webp';
  else if (isDiwali) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/diwali_story_hero.webp';
  else if (isShivratri) imageUrl = 'https://brahmandfeed23.b-cdn.net/festivals/maha_shivratri_story_hero.webp';
  else {
    // Check if festival has a mapped image or festival image field
    imageUrl =
      festival?.hero_image ||
      festival?.image_url ||
      festival?.image ||
      festival?.banner_image ||
      (festival?.images && festival.images[0]);

    if (!imageUrl) {
      try {
        const festImg = getFestivalImage(festival || { name: theme.name });
        if (festImg && typeof festImg === 'object' && festImg.uri) {
          imageUrl = festImg.uri;
        } else if (typeof festImg === 'number') {
          const modAsset = Asset.fromModule(festImg);
          await modAsset.downloadAsync();
          const uri = modAsset.localUri || modAsset.uri;
          if (uri) {
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            try {
              return await doc.embedJpg(decodeBase64ToUint8(b64));
            } catch {
              return await doc.embedPng(decodeBase64ToUint8(b64));
            }
          }
        }
      } catch (catErr) {
        console.warn('[PDF] Error getting catalog image:', catErr);
      }
    }
  }

  // Download and embed the resolved image (converting WebP to JPEG via ImageManipulator if needed)
  if (imageUrl && typeof imageUrl === 'string') {
    try {
      let localPath = imageUrl;
      if (imageUrl.startsWith('http')) {
        const ext = imageUrl.includes('.png') ? '.png' : imageUrl.includes('.webp') ? '.webp' : '.jpg';
        const target = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}fest_img_${Date.now()}${ext}`;
        const dlRes = await FileSystem.downloadAsync(imageUrl, target);
        localPath = dlRes.uri;
      }

      // Convert WebP / other formats to JPEG so pdf-lib can embed reliably
      if (localPath.includes('.webp') || imageUrl.includes('.webp')) {
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            localPath,
            [],
            { format: ImageManipulator.SaveFormat.JPEG, compress: 0.92 }
          );
          if (manipulated?.uri) {
            localPath = manipulated.uri;
          }
        } catch (manipErr) {
          console.warn('[PDF] ImageManipulator conversion failed, attempting raw embed:', manipErr);
        }
      }

      const b64 = await FileSystem.readAsStringAsync(localPath, { encoding: FileSystem.EncodingType.Base64 });
      const bytes = decodeBase64ToUint8(b64);
      try {
        return await doc.embedJpg(bytes);
      } catch {
        return await doc.embedPng(bytes);
      }
    } catch (imgErr) {
      console.warn('[PDF] Could not download/embed festival image:', imgErr);
    }
  }

  // 3. Fallback to official Brahmand logo
  try {
    const logoAsset = Asset.fromModule(require('../../assets/images/brahmand_logo_official.png'));
    await logoAsset.downloadAsync();
    const uri = logoAsset.localUri || logoAsset.uri;
    if (uri) {
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return await doc.embedPng(decodeBase64ToUint8(b64));
    }
  } catch (logoErr) {
    console.warn('[PDF] Fallback logo embed error:', logoErr);
  }

  return null;
}

/**
 * Renders the master dynamic Page 1 Festival Artwork for Brahmand.
 * Features:
 * - Peach & Beige warm foundation with subtle paper grain & gradient bands
 * - Delicate concentric mandala watermark
 * - 4 Ornate corner fans (Peach, Rose, Sage, Amber) with arcs & petals
 * - Side ribbons along margins
 * - Brand wordmark & heritage tagline
 * - Hero Sunburst Mandala with central circular festival deity medallion
 * - Flanking clay diyas with amber glow
 * - Lockup section with two-tone festival title
 * - Symmetrical diamond jewel divider
 * - Personalized festive blessing from Brahmand
 * - Vedic Maha Mantra & Shloka card
 * - App Marketing strip ("Carry the Blessings With You")
 * - Refined royal footer with scannable QR code
 */
export async function renderDynamicFestivalPage1(
  doc: PDFDocument,
  page1: any,
  theme: FestivalTheme,
  fonts: any,
  festival?: any,
  pageNumber?: number,
  totalPages?: number
): Promise<void> {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const cx = pageWidth / 2;

  const { fontCinzel, fontTimes, fontTimesBold, fontTimesItalic, fontHelvetica, fontHelveticaBold, displayFont, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;

  // Warm Peach + Beige Foundation Palette
  const colBeige = rgb(0.957, 0.906, 0.831);       // #F4E7D4
  const colPeachSoft = rgb(1.0, 0.910, 0.827);     // #FFE8D3
  const colPeachDeep = rgb(0.961, 0.710, 0.541);    // #F5B58A
  const colCream = rgb(0.984, 0.953, 0.902);       // #FBF3E6

  const colTerracotta = rgb(0.769, 0.388, 0.247);   // #C4633F
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);    // #802E17 - deep readable terracotta
  const colCrimson = rgb(0.56, 0.11, 0.08);         // #8F1C14 - royal sacred crimson
  const colRose = rgb(0.851, 0.525, 0.525);         // #D98686
  const colClay = rgb(0.55, 0.25, 0.16);           // #8C4029 - high contrast warm clay
  const colSage = rgb(0.541, 0.584, 0.451);         // #8A9573
  const colSageDeep = rgb(0.20, 0.28, 0.15);       // #334726 - deep forest sage for high readability
  const colAmber = rgb(0.878, 0.651, 0.298);        // #E0A64C
  const colOchre = rgb(0.776, 0.541, 0.235);        // #C68A3C
  const colPlum = rgb(0.38, 0.14, 0.26);           // #612442 - deep readable royal plum

  const colInk = rgb(0.10, 0.07, 0.05);            // #1A120D - solid deep black-brown ink
  const colInkSoft = rgb(0.18, 0.13, 0.10);        // #2E211A - crisp dark readable ink

  // 1. Warm Sunrise Background
  page1.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: colCream,
  });

  // Soft bottom beige gradient bands
  const bands = 25;
  for (let b = 0; b < bands; b++) {
    const fraction = b / bands;
    const bandH = (pageHeight * 0.7) / bands;
    const yPos = b * bandH;
    const r = 0.984 - fraction * 0.04;
    const g = 0.953 - fraction * 0.08;
    const bl = 0.902 - fraction * 0.13;
    page1.drawRectangle({
      x: 0,
      y: yPos,
      width: pageWidth,
      height: bandH + 1,
      color: rgb(r, g, bl),
      opacity: 0.35,
    });
  }

  // 2. Side Ribbons
  page1.drawRectangle({ x: 14, y: 440, width: 3.5, height: 130, color: colPeachDeep, opacity: 0.65 });
  page1.drawRectangle({ x: 14, y: 150, width: 3.5, height: 120, color: colRose, opacity: 0.5 });
  page1.drawRectangle({ x: pageWidth - 17.5, y: 440, width: 3.5, height: 130, color: colSage, opacity: 0.55 });
  page1.drawRectangle({ x: pageWidth - 17.5, y: 150, width: 3.5, height: 120, color: colOchre, opacity: 0.5 });

  // 4. Corner Fans (Peach TL, Rose TR, Sage BL, Amber BR)
  const drawCornerFan = (originX: number, originY: number, dirX: number, dirY: number, strokeCol: any, fillCol: any, dotCol: any) => {
    const rList = [30, 48, 66, 82];
    for (let i = 0; i < rList.length; i++) {
      const rad = rList[i];
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        const th1 = (s * Math.PI) / (2 * steps);
        const th2 = ((s + 1) * Math.PI) / (2 * steps);
        page1.drawLine({
          start: { x: originX + dirX * Math.cos(th1) * rad, y: originY + dirY * Math.sin(th1) * rad },
          end: { x: originX + dirX * Math.cos(th2) * rad, y: originY + dirY * Math.sin(th2) * rad },
          thickness: 0.8,
          color: strokeCol,
          opacity: 0.7 - i * 0.12,
        });
      }
    }
    const petAngles = [45, 20, 70];
    for (const pa of petAngles) {
      const radA = (pa * Math.PI) / 180;
      const petDist = 20;
      page1.drawEllipse({
        x: originX + dirX * Math.cos(radA) * petDist,
        y: originY + dirY * Math.sin(radA) * petDist,
        xScale: 7,
        yScale: 3,
        color: fillCol,
        rotate: degrees(dirX * dirY > 0 ? -pa : pa),
        opacity: 0.85,
      });
    }
    page1.drawCircle({
      x: originX + dirX * 18,
      y: originY + dirY * 18,
      size: 5,
      color: dotCol,
    });
    page1.drawCircle({
      x: originX + dirX * 18,
      y: originY + dirY * 18,
      size: 2,
      color: colCream,
    });
  };

  drawCornerFan(10, pageHeight - 10, 1, -1, colPeachDeep, colPeachDeep, colTerracotta); // TL
  drawCornerFan(pageWidth - 10, pageHeight - 10, -1, -1, colRose, colRose, colTerracotta); // TR
  drawCornerFan(10, 10, 1, 1, colSage, colSage, colAmber); // BL
  drawCornerFan(pageWidth - 10, 10, -1, 1, colAmber, colAmber, colTerracotta); // BR

  // -------------------------------------------------------------
  // CONTENT STACK
  // -------------------------------------------------------------
  let curY = pageHeight - 40;

  // 5. BRAND HEADER (Logo + BRAHMAND in Cinzel)
  const brandName = 'B R A H M A N D';
  const bW = brandFont.widthOfTextAtSize(brandName, 21.5);
  const logoDim = 27.5;
  const logoGap = 10;
  const totalHeaderW = brahmandLogo ? (logoDim + logoGap + bW) : bW;
  const headerStartX = (pageWidth - totalHeaderW) / 2;

  if (brahmandLogo) {
    page1.drawImage(brahmandLogo, {
      x: headerStartX,
      y: curY - 4,
      width: logoDim,
      height: logoDim,
    });
  }

  page1.drawText(brandName, {
    x: brahmandLogo ? headerStartX + logoDim + logoGap : headerStartX,
    y: curY,
    size: 21.5,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 21;

  const tagText = "DAILY   SANATAN   COMMUNITY";
  const tagW = fontHelveticaBold.widthOfTextAtSize(tagText, 7.5);
  const tagX = (pageWidth - tagW) / 2;

  page1.drawLine({ start: { x: tagX - 36, y: curY + 2 }, end: { x: tagX - 12, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.6 });
  page1.drawText(tagText, {
    x: tagX,
    y: curY,
    size: 7.5,
    font: fontHelveticaBold,
    color: colSageDeep,
  });
  page1.drawLine({ start: { x: tagX + tagW + 12, y: curY + 2 }, end: { x: tagX + tagW + 36, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.6 });

  curY -= 22;

  // 6. HERO MANDALA WITH FESTIVAL DEITY MEDALLION (Balanced vertical flow closer to header)
  const mCy = 595;
  const coreR = 140;

  // Subtle halo
  page1.drawCircle({
    x: cx,
    y: mCy,
    size: 240,
    color: colPeachSoft,
    opacity: 0.45,
  });

  // 24 Rays
  const rayColors = [colPeachDeep, colRose, colTerracotta, colSage];
  for (let r = 0; r < 24; r++) {
    const angle = (r * 15 * Math.PI) / 180;
    const rCol = rayColors[r % 4];
    page1.drawLine({
      start: { x: cx + Math.cos(angle) * (coreR + 9), y: mCy + Math.sin(angle) * (coreR + 9) },
      end: { x: cx + Math.cos(angle) * (coreR + 45), y: mCy + Math.sin(angle) * (coreR + 45) },
      thickness: 1.1,
      color: rCol,
      opacity: 0.75,
    });
  }

  // Outer dot ring
  for (let d = 0; d < 24; d++) {
    const angle = (d * 15 * Math.PI) / 180;
    const dCol = rayColors[d % 4];
    page1.drawCircle({
      x: cx + Math.cos(angle) * (coreR + 49),
      y: mCy + Math.sin(angle) * (coreR + 49),
      size: 1.8,
      color: dCol,
      opacity: 0.8,
    });
  }

  // 12 Outer Petals
  for (let p = 0; p < 12; p++) {
    const angle = (p * 30 * Math.PI) / 180;
    const pCol = p % 2 === 0 ? colPeachDeep : colTerracotta;
    page1.drawEllipse({
      x: cx + Math.cos(angle) * (coreR + 20),
      y: mCy + Math.sin(angle) * (coreR + 20),
      xScale: 9,
      yScale: 4,
      color: pCol,
      rotate: degrees(p * 30 + 90),
      opacity: 0.85,
    });
  }

  // Concentric Rings
  page1.drawCircle({ x: cx, y: mCy, size: coreR + 14, borderColor: colTerracotta, borderWidth: 1, opacity: 0.85 });
  page1.drawCircle({ x: cx, y: mCy, size: coreR + 9, borderColor: colRose, borderWidth: 0.7, opacity: 0.65 });
  page1.drawCircle({ x: cx, y: mCy, size: coreR + 4, borderColor: colPlum, borderWidth: 0.6, opacity: 0.5 });

  // Flanking Diyas (Left & Right)
  const drawDiya = (dx: number, dy: number) => {
    page1.drawCircle({ x: dx, y: dy + 11, size: 10, color: rgb(1, 0.92, 0.7), opacity: 0.6 });
    page1.drawEllipse({ x: dx, y: dy + 11, xScale: 3.5, yScale: 8, color: colAmber });
    page1.drawEllipse({ x: dx, y: dy + 9, xScale: 2, yScale: 5, color: rgb(1, 0.96, 0.88) });
    page1.drawEllipse({ x: dx, y: dy, xScale: 12, yScale: 5.5, color: colPeachDeep });
    page1.drawEllipse({ x: dx, y: dy - 1, xScale: 9, yScale: 3, color: colTerracotta });
  };
  drawDiya(cx - 132, mCy - 20);
  drawDiya(cx + 132, mCy - 20);

  // Floating stars/dots
  page1.drawCircle({ x: cx - 155, y: mCy + 36, size: 2.4, color: colPeachDeep });
  page1.drawCircle({ x: cx + 155, y: mCy + 36, size: 2.4, color: colPlum });
  page1.drawCircle({ x: cx - 105, y: mCy + 58, size: 2, color: colAmber });
  page1.drawCircle({ x: cx + 105, y: mCy + 58, size: 2, color: colRose });

  // CENTER MEDALLION: HERO IMAGE CLIPPED IN CIRCLE
  const embeddedHero = await resolveFestivalHeroImage(doc, theme, festival);

  if (embeddedHero) {
    const k = 0.5522847498 * coreR;
    page1.pushOperators(
      pushGraphicsState(),
      moveTo(cx + coreR, mCy),
      appendBezierCurve(cx + coreR, mCy + k, cx + k, mCy + coreR, cx, mCy + coreR),
      appendBezierCurve(cx - k, mCy + coreR, cx - coreR, mCy + k, cx - coreR, mCy),
      appendBezierCurve(cx - coreR, mCy - k, cx - k, mCy - coreR, cx, mCy - coreR),
      appendBezierCurve(cx + k, mCy - coreR, cx + coreR, mCy - k, cx + coreR, mCy),
      closePath(),
      clip(),
      endPath()
    );

    const imgDim = coreR * 2;
    page1.drawImage(embeddedHero, {
      x: cx - coreR,
      y: mCy - coreR,
      width: imgDim,
      height: imgDim,
    });

    page1.pushOperators(popGraphicsState());

    // Framed gold & terracotta outer circular borders around the image
    page1.drawCircle({
      x: cx,
      y: mCy,
      size: coreR,
      borderColor: colTerracottaDk,
      borderWidth: 1.5,
    });
    page1.drawCircle({
      x: cx,
      y: mCy,
      size: coreR + 2.5,
      borderColor: colAmber,
      borderWidth: 0.8,
      opacity: 0.9,
    });
  } else {
    // Vector glowing lotus fallback
    page1.drawCircle({ x: cx, y: mCy, size: coreR, color: colPeachSoft, borderColor: colTerracottaDk, borderWidth: 1.5 });
    for (let p = 0; p < 8; p++) {
      const angle = (p * 45 * Math.PI) / 180;
      page1.drawEllipse({
        x: cx + Math.cos(angle) * 12,
        y: mCy + Math.sin(angle) * 12,
        xScale: 5,
        yScale: 10,
        color: colAmber,
        rotate: degrees(p * 45),
      });
    }
    page1.drawCircle({ x: cx, y: mCy, size: 6, color: colTerracotta });
  }

  // 7. LOCKUP SECTION (Festival Title, Subtitle, Date) - Balanced placement below mandala
  curY = 385;

  // Main Festival Title: Split words for two-tone dynamic typography
  const rawTitle = cleanTextForPdf(theme.name).toUpperCase();
  const titleWords = rawTitle.split(/\s+/);
  let part1 = rawTitle;
  let part2 = '';
  if (titleWords.length > 1) {
    const half = Math.ceil(titleWords.length / 2);
    part1 = titleWords.slice(0, half).join(' ') + ' ';
    part2 = titleWords.slice(half).join(' ');
  }

  const titleFontSize = rawTitle.length > 22 ? 22 : (rawTitle.length > 14 ? 26 : 30);
  const p1W = brandFont.widthOfTextAtSize(part1, titleFontSize);
  const p2W = part2 ? brandFont.widthOfTextAtSize(part2, titleFontSize) : 0;
  const totalTW = p1W + p2W;
  const startTX = (pageWidth - totalTW) / 2;

  page1.drawText(part1, {
    x: startTX,
    y: curY,
    size: titleFontSize,
    font: brandFont,
    color: colInk,
  });
  if (part2) {
    page1.drawText(part2, {
      x: startTX + p1W,
      y: curY,
      size: titleFontSize,
      font: brandFont,
      color: colCrimson,
    });
  }

  curY -= (titleFontSize * 0.35 + 12);

  // Subtitle / Occasion
  const occSub = cleanTextForPdf(theme.subtitle || 'SANATAN DHARMA HERITAGE').toUpperCase();
  const occSize = occSub.length > 38 ? 8.5 : 9.8;
  const dSubW = fontTimesItalic.widthOfTextAtSize(occSub, occSize);
  page1.drawText(occSub, {
    x: (pageWidth - dSubW) / 2,
    y: curY,
    size: occSize,
    font: fontTimesItalic,
    color: colTerracottaDk,
  });

  curY -= 15;

  // Date & Tithi Pill Badge
  const dateBadgeText = `${cleanTextForPdf(theme.date).toUpperCase()}   *   ${cleanTextForPdf(theme.tithi).toUpperCase()}`;
  const dbW = fontHelveticaBold.widthOfTextAtSize(dateBadgeText, 8);
  const dbPillW = dbW + 24;
  const dbPillH = 15;
  const dbPillX = (pageWidth - dbPillW) / 2;

  page1.drawRectangle({
    x: dbPillX,
    y: curY - dbPillH,
    width: dbPillW,
    height: dbPillH,
    color: rgb(0.93, 0.94, 0.90),
    borderColor: colSage,
    borderWidth: 0.6,
  });
  page1.drawText(dateBadgeText, {
    x: dbPillX + 12,
    y: curY - dbPillH + 4,
    size: 8,
    font: fontHelveticaBold,
    color: colSageDeep,
  });

  curY -= (dbPillH + 12);

  // 8. JEWEL DIVIDER
  const jwWidth = 260;
  const jwX = (pageWidth - jwWidth) / 2;
  page1.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 26, y: curY }, thickness: 0.8, color: colPeachDeep, opacity: 0.85 });
  page1.drawLine({ start: { x: cx + 26, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.8, color: colSage, opacity: 0.85 });

  page1.drawRectangle({ x: cx - 4.5, y: curY - 4.5, width: 9, height: 9, color: colRose, rotate: degrees(45) });
  page1.drawCircle({ x: cx, y: curY, size: 2.4, color: colAmber });
  page1.drawRectangle({ x: cx - 20 - 2, y: curY - 2, width: 4, height: 4, color: colTerracotta, rotate: degrees(45) });
  page1.drawRectangle({ x: cx + 20 - 2, y: curY - 2, width: 4, height: 4, color: colSageDeep, rotate: degrees(45) });

  curY -= 14;

  // 9. BLESSING SECTION (Personalized blessing from Brahmand) - ULTRA READABLE
  const isGanesh = /ganesh|vinayaka/i.test(theme.name);
  let blessingParagraph = '';
  if (isGanesh) {
    blessingParagraph =
      'Dear Friend, may this Ganesh Chaturthi arrive at your home the way Bappa always does - softly at first, then in a rush of modak, marigold and laughter, of diyas flickering on the balcony, of familiar voices humming aarti from the next room. May every door you knock on open, every worry you carry feel a little lighter, and every corner of your home find its quiet peace. And may He who clears every path walk beside your family - today, and always.';
  } else {
    const festClean = cleanTextForPdf(theme.name);
    const deityClean = cleanTextForPdf(theme.deity);
    const greetClean = cleanTextForPdf(theme.greeting);
    blessingParagraph =
      `Dear Friend, may this auspicious celebration of ${festClean} arrive at your home with divine peace, joy, and boundless prosperity. ${greetClean} May the divine grace of ${deityClean} effortlessly dissolve every obstacle from your path, filling your home with radiant warmth, good health, righteous wisdom, and timeless harmony - today, and always.`;
  }

  const bCardW = 490;
  const blessLines = wrapText(blessingParagraph, fontTimes, 9.8, bCardW - 36);
  const bCardH = 20 + blessLines.length * 14 + 6;
  const bCardX = (pageWidth - bCardW) / 2;
  const bCardY = curY - bCardH;

  page1.drawRectangle({
    x: bCardX,
    y: bCardY,
    width: bCardW,
    height: bCardH,
    color: rgb(0.992, 0.965, 0.93),
    borderColor: colPeachDeep,
    borderWidth: 0.6,
  });

  page1.drawLine({
    start: { x: cx - 40, y: bCardY + bCardH },
    end: { x: cx + 40, y: bCardY + bCardH },
    thickness: 1.2,
    color: colCrimson,
  });

  const blessEyebrow = 'A   BLESSING   FROM   THE   BRAHMAND   FAMILY';
  const bewW = brandFont.widthOfTextAtSize(blessEyebrow, 8);
  page1.drawText(blessEyebrow, {
    x: (pageWidth - bewW) / 2,
    y: bCardY + bCardH - 13,
    size: 8,
    font: brandFont,
    color: colCrimson,
  });

  let blY = bCardY + bCardH - 26;
  for (const bLine of blessLines) {
    const blW = fontTimes.widthOfTextAtSize(bLine, 9.8);
    page1.drawText(bLine, {
      x: (pageWidth - blW) / 2,
      y: blY,
      size: 9.8,
      font: fontTimes, // UPRIGHT ROMAN FOR 100% READABILITY
      color: colInk,   // SOLID DEEP INK
    });
    blY -= 14;
  }

  curY = bCardY - 24;

  // 10. VEDIC MANTRA (KEPT, BUT NO BACKGROUND BOX BEHIND IT!)
  const isShiva = /shiv|mahadev|bholenath/i.test(theme.name) || /shiv|mahadev/i.test(theme.deity);
  const isKrishna = /krishna|janmashtami|govind/i.test(theme.name) || /krishna/i.test(theme.deity);
  const isDevi = /durga|navratri|kali|lakshmi|parvati|saraswati/i.test(theme.name) || /devi|durga|lakshmi|parvati/i.test(theme.deity);
  const isRama = /rama|ram|diwali|deepavali/i.test(theme.name) || /rama|ram/i.test(theme.deity);

  let mHead = '||   VEDIC   GANESHA   MAHA   MANTRA   ||';
  let mText = 'OM   GAM   GANAPATAYE   NAMAHA';
  let shloka1 = 'VAKRATUNDA MAHAKAYA SURYAKOTI SAMAPRABHA';
  let shloka2 = 'NIRVIGHNAM KURU ME DEVA SARVAKARYESHU SARVADA';

  if (isShiva) {
    mHead = '||   VEDIC   SHIVA   MAHA   MANTRA   ||';
    mText = 'OM   NAMAH   SHIVAYA';
    shloka1 = 'TRYAMBAKAM YAJAMAHE SUGANDHIM PUSHTIVARDHANAM';
    shloka2 = 'URVARUKAMIVA BANDHANAN MRITYORMUKSHIYA MAMRITAT';
  } else if (isKrishna) {
    mHead = '||   MAHA   VISHNU   KRISHNA   MANTRA   ||';
    mText = 'OM   NAMO   BHAGAVATE   VASUDEVAYA';
    shloka1 = 'SHANTAKARAM BHUJAGASHAYANAM PADMANABHAM SURESHAM';
    shloka2 = 'VISHWADHARAM GAGANASADRISHAM MEGHAVARNAM SHUBHANGAM';
  } else if (isDevi) {
    mHead = '||   MAHA   DEVI   SHAKTI   MANTRA   ||';
    mText = 'OM   DUM   DURGAYEI   NAMAHA';
    shloka1 = 'SARVAMANGALA MANGALYE SHIVE SARVARTHA SADHIKE';
    shloka2 = 'SHARANYE TRYAMBAKE GAURI NARAYANI NAMOSTUTE';
  } else if (isRama) {
    mHead = '||   SRI   RAMA   MAHA   MANTRA   ||';
    mText = 'OM   SRI   RAMAYA   NAMAHA';
    shloka1 = 'SRI RAMA RAMA RAMETI RAME RAME MANORAME';
    shloka2 = 'SAHASRANAMA TATTULYAM RAMA NAMA VARANANE';
  }

  const mHeadW = brandFont.widthOfTextAtSize(mHead, 8);
  page1.drawText(mHead, {
    x: (pageWidth - mHeadW) / 2,
    y: curY,
    size: 8,
    font: brandFont,
    color: colSageDeep,
  });

  curY -= 15;
  const mTextW = brandFont.widthOfTextAtSize(mText, 12.5);
  page1.drawText(mText, {
    x: (pageWidth - mTextW) / 2,
    y: curY,
    size: 12.5,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 14;
  const s1W = fontTimes.widthOfTextAtSize(shloka1, 8.5);
  page1.drawText(shloka1, {
    x: (pageWidth - s1W) / 2,
    y: curY,
    size: 8.5,
    font: fontTimes,
    color: colInk,
  });

  curY -= 12;
  const s2W = fontTimes.widthOfTextAtSize(shloka2, 8.5);
  page1.drawText(shloka2, {
    x: (pageWidth - s2W) / 2,
    y: curY,
    size: 8.5,
    font: fontTimes,
    color: colInk,
  });

  // 10. FOOTER (Without QR code, clean elegant balanced layout)
  const footY = 24;
  page1.drawLine({
    start: { x: 38, y: footY + 40 },
    end: { x: pageWidth - 38, y: footY + 40 },
    thickness: 0.8,
    color: colPeachDeep,
    opacity: 0.85,
  });

  const fLogoDim = 17;
  if (brahmandLogo) {
    page1.drawImage(brahmandLogo, {
      x: 44,
      y: footY + 13,
      width: fLogoDim,
      height: fLogoDim,
    });
  }

  const fBrandX = brahmandLogo ? 44 + fLogoDim + 6 : 44;
  page1.drawText('BRAHMAND', {
    x: fBrandX,
    y: footY + 15,
    size: 11,
    font: brandFont,
    color: colCrimson,
  });

  page1.drawText('Discover more on Brahmand  *  https://brahmand.app', {
    x: 44,
    y: footY + 2,
    size: 7.8,
    font: fontTimesItalic,
    color: colInkSoft,
  });

  try {
    const footerTrackingUrl = getTrackedBrahmandUrl(theme.name, 'pdf_footer');
    const pfxW = fontTimesItalic.widthOfTextAtSize('Discover more on Brahmand  *  ', 7.8);
    const lnkW = fontTimesItalic.widthOfTextAtSize('https://brahmand.app', 7.8);
    addClickableLink(doc, page1, footerTrackingUrl, [
      44 + pfxW - 2,
      footY - 4,
      44 + pfxW + lnkW + 2,
      footY + 14,
    ]);
  } catch (footerLinkErr) {
    console.warn('[PDF] Failed to add footer link annotation on Page 1:', footerLinkErr);
  }

  const pageText = 'SHARED WITH LOVE VIA BRAHMAND APP';
  const ptW = fontHelveticaBold.widthOfTextAtSize(pageText, 7);
  page1.drawText(pageText, {
    x: pageWidth - 44 - ptW,
    y: footY + 16,
    size: 7,
    font: fontHelveticaBold,
    color: colSageDeep,
  });

  const subPageText = totalPages && totalPages > 1 ? `PAGE ${pageNumber || 1} OF ${totalPages}` : 'SANATAN DHARMA HERITAGE';
  const sptW = fontHelveticaBold.widthOfTextAtSize(subPageText, 7.5);
  page1.drawText(subPageText, {
    x: pageWidth - 44 - sptW,
    y: footY + 2,
    size: 7.5,
    font: fontHelveticaBold,
    color: colCrimson,
  });
}

/**
 * Generates the master universal festival artwork A4 portrait PDF for Brahmand.
 */
export async function generateUniversalFestivalArtworkPdf(festival: any, sectionValue?: string): Promise<string> {
  const theme = getFestivalTheme(festival, sectionValue);

  const doc = await PDFDocument.create();
  doc.setTitle(`Brahmand - ${cleanTextForPdf(theme.name)} Festival Artwork`);
  doc.setAuthor("Brahmand - Daily Sanatan Community");
  doc.setSubject(`${cleanTextForPdf(theme.name)} Celebration Artwork`);
  doc.setCreator('Brahmand Platform');

  const fonts = await loadPdfFonts(doc);

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // ========================================================
  // PAGE 1: DYNAMIC ROYAL FESTIVAL ARTWORK TEMPLATE
  // ========================================================
  const page1 = doc.addPage([pageWidth, pageHeight]);
  await renderDynamicFestivalPage1(doc, page1, theme, fonts, festival, 1, 1);

  // Save PDF with standard xref table (no object streams) for 100% viewer compatibility
  const base64Pdf = await doc.saveAsBase64({ useObjectStreams: false });
  const sanitizedName = theme.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${sanitizedName}_brahmand_artwork.pdf`;
  const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const fileUri = `${targetDir}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

/**
 * Renders the illuminated Katha narrative chapters on Page 2 in the Peach & Beige foundation.
 */
export async function renderDynamicFestivalPage2(
  doc: PDFDocument,
  page2: any,
  theme: FestivalTheme,
  fonts: any,
  festival?: any
): Promise<void> {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const cx = pageWidth / 2;

  const { fontCinzel, fontRozha, fontPoppins, fontTimes, fontTimesItalic, fontHelvetica, fontHelveticaBold, displayFont, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;
  const headingFont = fontRozha || brandFont;
  const bodyFeatureFont = fontPoppins || fontHelveticaBold;

  // Warm Peach + Beige Foundation Palette
  const colPeachSoft = rgb(1.0, 0.910, 0.827);     // #FFE8D3
  const colPeachDeep = rgb(0.961, 0.710, 0.541);    // #F5B58A
  const colCream = rgb(0.984, 0.953, 0.902);       // #FBF3E6

  const colTerracotta = rgb(0.769, 0.388, 0.247);   // #C4633F
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);    // #802E17
  const colCrimson = rgb(0.56, 0.11, 0.08);         // #8F1C14
  const colRose = rgb(0.851, 0.525, 0.525);         // #D98686
  const colSage = rgb(0.541, 0.584, 0.451);         // #8A9573
  const colSageDeep = rgb(0.20, 0.28, 0.15);       // #334726
  const colAmber = rgb(0.878, 0.651, 0.298);        // #E0A64C

  const colInk = rgb(0.10, 0.07, 0.05);            // #1A120D
  const colInkSoft = rgb(0.18, 0.13, 0.10);        // #2E211A

  // 1. Warm Sunrise Background
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: colCream,
  });

  // Soft bottom beige gradient bands
  const bands = 25;
  for (let b = 0; b < bands; b++) {
    const fraction = b / bands;
    const bandH = (pageHeight * 0.7) / bands;
    const yPos = b * bandH;
    const r = 0.984 - fraction * 0.04;
    const g = 0.953 - fraction * 0.08;
    const bl = 0.902 - fraction * 0.13;
    page2.drawRectangle({
      x: 0,
      y: yPos,
      width: pageWidth,
      height: bandH + 1,
      color: rgb(r, g, bl),
      opacity: 0.35,
    });
  }

  // 2. Side Ribbons
  page2.drawRectangle({ x: 14, y: 440, width: 3.5, height: 130, color: colPeachDeep, opacity: 0.65 });
  page2.drawRectangle({ x: 14, y: 150, width: 3.5, height: 120, color: colRose, opacity: 0.5 });
  page2.drawRectangle({ x: pageWidth - 17.5, y: 440, width: 3.5, height: 130, color: colSage, opacity: 0.55 });
  page2.drawRectangle({ x: pageWidth - 17.5, y: 150, width: 3.5, height: 120, color: colAmber, opacity: 0.5 });

  // 3. 4 Corner Fans
  const drawCornerFanP2 = (originX: number, originY: number, dirX: number, dirY: number, strokeCol: any, fillCol: any, dotCol: any) => {
    const rList = [30, 48, 66, 82];
    for (let i = 0; i < rList.length; i++) {
      const rad = rList[i];
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        const th1 = (s * Math.PI) / (2 * steps);
        const th2 = ((s + 1) * Math.PI) / (2 * steps);
        page2.drawLine({
          start: { x: originX + dirX * Math.cos(th1) * rad, y: originY + dirY * Math.sin(th1) * rad },
          end: { x: originX + dirX * Math.cos(th2) * rad, y: originY + dirY * Math.sin(th2) * rad },
          thickness: 0.8,
          color: strokeCol,
          opacity: 0.7 - i * 0.12,
        });
      }
    }
    const petAngles = [45, 20, 70];
    for (const pa of petAngles) {
      const radA = (pa * Math.PI) / 180;
      const petDist = 20;
      page2.drawEllipse({
        x: originX + dirX * Math.cos(radA) * petDist,
        y: originY + dirY * Math.sin(radA) * petDist,
        xScale: 7,
        yScale: 3,
        color: fillCol,
        rotate: degrees(dirX * dirY > 0 ? -pa : pa),
        opacity: 0.85,
      });
    }
    page2.drawCircle({ x: originX + dirX * 18, y: originY + dirY * 18, size: 5, color: dotCol });
    page2.drawCircle({ x: originX + dirX * 18, y: originY + dirY * 18, size: 2, color: colCream });
  };

  drawCornerFanP2(10, pageHeight - 10, 1, -1, colPeachDeep, colPeachDeep, colTerracotta);
  drawCornerFanP2(pageWidth - 10, pageHeight - 10, -1, -1, colRose, colRose, colTerracotta);
  drawCornerFanP2(10, 10, 1, 1, colSage, colSage, colAmber);
  drawCornerFanP2(pageWidth - 10, 10, -1, 1, colAmber, colAmber, colTerracotta);

  // 4. BRAND HEADER (Logo + BRAHMAND in Cinzel)
  let curY = pageHeight - 40;
  const brandName = 'B R A H M A N D';
  const bW = brandFont.widthOfTextAtSize(brandName, 21.5);
  const logoDim = 27.5;
  const logoGap = 10;
  const totalHeaderW = brahmandLogo ? (logoDim + logoGap + bW) : bW;
  const headerStartX = (pageWidth - totalHeaderW) / 2;

  if (brahmandLogo) {
    page2.drawImage(brahmandLogo, {
      x: headerStartX,
      y: curY - 4,
      width: logoDim,
      height: logoDim,
    });
  }

  page2.drawText(brandName, {
    x: brahmandLogo ? headerStartX + logoDim + logoGap : headerStartX,
    y: curY,
    size: 21.5,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 21;

  const tagText = "DAILY   SANATAN   COMMUNITY";
  const tagW = fontHelveticaBold.widthOfTextAtSize(tagText, 7.5);
  const tagX = (pageWidth - tagW) / 2;

  page2.drawLine({ start: { x: tagX - 36, y: curY + 2 }, end: { x: tagX - 12, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.6 });
  page2.drawText(tagText, {
    x: tagX,
    y: curY,
    size: 7.5,
    font: fontHelveticaBold,
    color: colSageDeep,
  });
  page2.drawLine({ start: { x: tagX + tagW + 12, y: curY + 2 }, end: { x: tagX + tagW + 36, y: curY + 2 }, thickness: 0.8, color: colSageDeep, opacity: 0.6 });

  curY -= 18;

  // 5. TITLE BLOCK (Title, Subtitle, Symmetrical Jewel Divider)
  // Two-tone Story Title (VRAT removed)
  const festClean = cleanTextForPdf(theme.name).toUpperCase();
  const t1 = `${festClean} `;
  const t2 = 'KATHA';
  const tSize = festClean.length > 18 ? 17.5 : 20;
  const t1W = brandFont.widthOfTextAtSize(t1, tSize);
  const t2W = brandFont.widthOfTextAtSize(t2, tSize);
  const totTW = t1W + t2W;
  const sTX = (pageWidth - totTW) / 2;

  page2.drawText(t1, {
    x: sTX,
    y: curY,
    size: tSize,
    font: brandFont,
    color: colInk,
  });
  page2.drawText(t2, {
    x: sTX + t1W,
    y: curY,
    size: tSize,
    font: brandFont,
    color: colCrimson,
  });

  curY -= 17;

  const storySub = cleanTextForPdf(theme.subtitle || 'Sanatan Dharma Heritage');
  const ssW = fontTimesItalic.widthOfTextAtSize(storySub, 9.8);
  page2.drawText(storySub, {
    x: (pageWidth - ssW) / 2,
    y: curY,
    size: 9.8,
    font: fontTimesItalic,
    color: colTerracottaDk,
  });

  curY -= 16;

  // Symmetrical Jewel Divider
  const jwWidth = 240;
  const jwX = (pageWidth - jwWidth) / 2;
  page2.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 22, y: curY }, thickness: 0.8, color: colPeachDeep, opacity: 0.85 });
  page2.drawLine({ start: { x: cx + 22, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.8, color: colSage, opacity: 0.85 });
  page2.drawRectangle({ x: cx - 3.5, y: curY - 3.5, width: 7, height: 7, color: colTerracotta, rotate: degrees(45) });
  page2.drawRectangle({ x: cx - 16 - 2, y: curY - 2, width: 4, height: 4, color: colRose, rotate: degrees(45) });
  page2.drawRectangle({ x: cx + 16 - 2, y: curY - 2, width: 4, height: 4, color: colSageDeep, rotate: degrees(45) });

  curY -= 16;

  // 6. 5 CHAPTERS OF KATHA NARRATIVE (Comfortable, spacious 14pt typography with open margins)
  const p2Margin = 38;
  const p2ContentWidth = pageWidth - p2Margin * 2;
  const bodyFontSize = 14;
  const bodyLineHeight = 17.2;
  const chapterNumerals = ['CHAPTER ONE', 'CHAPTER TWO', 'CHAPTER THREE', 'CHAPTER FOUR', 'CHAPTER FIVE'];

  const chaptersCount = Math.min(5, theme.chapters.length);
  for (let cIdx = 0; cIdx < chaptersCount; cIdx++) {
    const ch = theme.chapters[cIdx];
    const chNum = chapterNumerals[cIdx] || `CHAPTER ${cIdx + 1}`;
    const chTitle = cleanTextForPdf(ch.title).toUpperCase();

    // Chapter Header
    page2.drawText(chNum, {
      x: p2Margin,
      y: curY,
      size: 9.5,
      font: brandFont,
      color: colSageDeep,
    });
    const numW = brandFont.widthOfTextAtSize(chNum, 9.5);
    page2.drawText('  *  ', {
      x: p2Margin + numW,
      y: curY,
      size: 9.5,
      font: brandFont,
      color: colPeachDeep,
    });
    const sepW = brandFont.widthOfTextAtSize('  *  ', 9.5);
    page2.drawText(chTitle, {
      x: p2Margin + numW + sepW,
      y: curY,
      size: 11,
      font: brandFont,
      color: colCrimson,
    });

    curY -= 13;

    // Drop Cap
    const cleanContent = cleanTextForPdf(ch.content);
    const dropLetter = cleanContent.charAt(0) || 'T';
    const restOfText = cleanContent.slice(1);
    const dropCapSize = 29;
    const dropW = brandFont.widthOfTextAtSize(dropLetter, dropCapSize);

    page2.drawText(dropLetter, {
      x: p2Margin,
      y: curY - 11,
      size: dropCapSize,
      font: brandFont,
      color: colCrimson,
    });

    const dropIndent = dropW + 5;
    const firstLinesWidth = p2ContentWidth - dropIndent;

    const words = restOfText.split(/\s+/);
    let line1 = '';
    let line2 = '';
    let wordIdx = 0;

    while (wordIdx < words.length) {
      const test = line1 ? `${line1} ${words[wordIdx]}` : words[wordIdx];
      if (fontTimes.widthOfTextAtSize(test, bodyFontSize) <= firstLinesWidth) {
        line1 = test;
        wordIdx++;
      } else {
        break;
      }
    }

    while (wordIdx < words.length) {
      const test = line2 ? `${line2} ${words[wordIdx]}` : words[wordIdx];
      if (fontTimes.widthOfTextAtSize(test, bodyFontSize) <= firstLinesWidth) {
        line2 = test;
        wordIdx++;
      } else {
        break;
      }
    }

    const remainingText = words.slice(wordIdx).join(' ');
    const remainingLines = wrapText(remainingText, fontTimes, bodyFontSize, p2ContentWidth);

    drawJustifiedLine(
      page2,
      line1,
      fontTimes,
      bodyFontSize,
      colInk,
      p2Margin + dropIndent,
      curY,
      firstLinesWidth,
      wordIdx >= words.length
    );
    curY -= bodyLineHeight;

    if (line2) {
      drawJustifiedLine(
        page2,
        line2,
        fontTimes,
        bodyFontSize,
        colInk,
        p2Margin + dropIndent,
        curY,
        firstLinesWidth,
        remainingLines.length === 0
      );
      curY -= bodyLineHeight;
    }

    for (let rIdx = 0; rIdx < remainingLines.length; rIdx++) {
      const isLast = rIdx === remainingLines.length - 1;
      drawJustifiedLine(
        page2,
        remainingLines[rIdx],
        fontTimes,
        bodyFontSize,
        colInk,
        p2Margin,
        curY,
        p2ContentWidth,
        isLast
      );
      curY -= bodyLineHeight;
    }

    curY -= 6;

    // Small divider between chapters
    if (cIdx < chaptersCount - 1) {
      const dW = 75;
      const dX = (pageWidth - dW) / 2;
      page2.drawLine({ start: { x: dX, y: curY }, end: { x: cx - 10, y: curY }, thickness: 0.6, color: colPeachDeep, opacity: 0.8 });
      page2.drawCircle({ x: cx, y: curY, size: 2, color: colSageDeep });
      page2.drawLine({ start: { x: cx + 10, y: curY }, end: { x: dX + dW, y: curY }, thickness: 0.6, color: colPeachDeep, opacity: 0.8 });
      curY -= 10;
    }
  }

  // 7. HIGH-CONVERTING MINI-FEATURE MARKETING CARD (65% Left Text / 35% Right QR, Vintage Gold #C8A97E, Embedded Logo QR)
  curY -= 14;

  const cardW = pageWidth - p2Margin * 2; // ~519.28
  const cardH = 152;
  const cardX = p2Margin;
  const cardY = curY - cardH;

  // Background: 3% antique parchment tint (#FDFBF7) blending naturally into the original paper texture
  const colParchmentTint = rgb(0.992, 0.984, 0.969); // #FDFBF7
  const colVintageGold = rgb(0.784, 0.663, 0.494);   // #C8A97E
  const colMaroonHead = rgb(0.290, 0.082, 0.098);    // #4A1519 Dark Maroon
  const colFeatureText = rgb(0.200, 0.200, 0.200);   // #333333 Charcoal

  page2.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: colParchmentTint,
    borderColor: colVintageGold,
    borderWidth: 1.0,
  });

  // Subtle inner accent border with generous padding
  page2.drawRectangle({
    x: cardX + 3.5,
    y: cardY + 3.5,
    width: cardW - 7,
    height: cardH - 7,
    borderColor: rgb(0.91, 0.84, 0.73),
    borderWidth: 0.5,
    opacity: 0.5,
  });

  // Top Header Banner with soft cream background
  const headBoxH = 26;
  const headBoxY = cardY + cardH - headBoxH;
  page2.drawRectangle({
    x: cardX + 1,
    y: headBoxY,
    width: cardW - 2,
    height: headBoxH - 1,
    color: rgb(0.975, 0.945, 0.915),
  });
  page2.drawLine({
    start: { x: cardX, y: headBoxY },
    end: { x: cardX + cardW, y: headBoxY },
    thickness: 0.8,
    color: colVintageGold,
  });

  // Header / Eyebrow (BRAHMAND)
  const eyebrowText = 'BRAHMAND';
  page2.drawText(eyebrowText, {
    x: cardX + 14,
    y: headBoxY + 8,
    size: 11,
    font: brandFont,
    color: colMaroonHead,
  });

  // Tagline: "Join your Digital Sanatan Community"
  const taglineText = 'Join your Digital Sanatan Community';
  page2.drawText(taglineText, {
    x: cardX + 14 + brandFont.widthOfTextAtSize(eyebrowText, 11) + 12,
    y: headBoxY + 8.5,
    size: 9.2,
    font: fontTimesItalic,
    color: colTerracottaDk,
  });

  // Split Architecture: 65% (Left Text) + 35% (Right QR)
  const leftRatio = 0.65;
  const leftColX = cardX + 14;
  const leftColW = cardW * leftRatio - 20;
  const splitLineX = cardX + cardW * leftRatio;
  const qrColX = splitLineX + 10;
  const qrColW = cardW - (splitLineX - cardX) - 20;

  // Delicate vertical divider between Left and Right columns
  page2.drawLine({
    start: { x: splitLineX, y: cardY + 12 },
    end: { x: splitLineX, y: headBoxY - 6 },
    thickness: 0.6,
    color: rgb(0.85, 0.76, 0.64),
  });

  // 3 Exact High-Converting Feature Bullets (Icon + Clear Value Proposition)
  const featureBullets = [
    {
      title: 'Free Kundli: ',
      desc: 'Instant Vedic Janam Kundli, Dosha analysis & daily predictions at zero cost.',
    },
    {
      title: 'Sanatan SOS: ',
      desc: 'Real-time emergency assistance and local community support when you need it most.',
    },
    {
      title: 'Vedic Services: ',
      desc: 'Connect with verified Services, and participate in community seva.',
    },
  ];

  let bulletY = headBoxY - 17;
  const textFont = fontPoppins || fontHelvetica;
  const titleFont = fontPoppins || fontHelveticaBold;

  for (const b of featureBullets) {
    // Elegant sacred diamond bullet
    page2.drawRectangle({
      x: leftColX + 3.5,
      y: bulletY + 1.5,
      width: 4.5,
      height: 4.5,
      color: colCrimson,
      rotate: degrees(45),
    });

    const tW = titleFont.widthOfTextAtSize(b.title, 8.8);
    page2.drawText(b.title, {
      x: leftColX + 12,
      y: bulletY,
      size: 8.8,
      font: titleFont,
      color: colMaroonHead,
    });

    const wrappedDesc = wrapText(b.desc, textFont, 8.2, leftColW - tW - 14);
    if (wrappedDesc.length > 0) {
      page2.drawText(wrappedDesc[0], {
        x: leftColX + 12 + tW,
        y: bulletY,
        size: 8.2,
        font: textFont,
        color: colFeatureText,
      });
      if (wrappedDesc.length > 1) {
        page2.drawText(wrappedDesc.slice(1).join(' '), {
          x: leftColX + 12,
          y: bulletY - 9.5,
          size: 8.2,
          font: textFont,
          color: colFeatureText,
        });
      }
    }

    bulletY -= (wrappedDesc.length > 1 ? 23 : 19);
  }

  // Left Side Action Footer: "Available on Google Play & App Store" + Store badges
  const actionFooterY = cardY + 13;
  const storeLabel = 'Available on Google Play & App Store';
  page2.drawText(storeLabel, {
    x: leftColX,
    y: actionFooterY + 14,
    size: 7.8,
    font: fontHelveticaBold,
    color: colSageDeep,
  });

  // Store Badges (Google Play & App Store vector badges)
  const storeRowY = actionFooterY;
  const playPaths = [
    { p: 'M 3.25 2.14 C 2.87 2.53 2.65 3.14 2.65 3.94 L 2.65 20.06 C 2.65 20.86 2.87 21.47 3.25 21.86 L 3.32 21.93 L 12.44 12.81 L 12.44 12.38 L 12.44 12.38 L 3.32 3.26 Z', c: rgb(0.25, 0.63, 0.96) },
    { p: 'M 15.48 15.85 L 12.44 12.81 L 12.44 12.38 L 15.48 9.34 L 15.56 9.38 L 19.16 11.43 C 20.19 12.01 20.19 12.97 19.16 13.55 L 15.56 15.60 Z', c: rgb(1.0, 0.79, 0.0) },
    { p: 'M 15.56 15.60 L 12.44 12.48 L 3.25 21.86 C 3.59 22.22 4.15 22.27 4.80 21.90 L 15.56 15.60', c: rgb(0.92, 0.26, 0.21) },
    { p: 'M 15.56 9.38 L 4.80 3.28 C 4.15 2.91 3.59 2.96 3.25 3.32 L 12.44 12.51 Z', c: rgb(0.18, 0.73, 0.42) },
  ];
  const playScale = 0.40;
  const playIconW = 24 * playScale;
  for (const seg of playPaths) {
    page2.drawSvgPath(seg.p, { x: leftColX, y: storeRowY + 7, scale: playScale, color: seg.c });
  }
  page2.drawText('Google Play', {
    x: leftColX + playIconW + 5,
    y: storeRowY,
    size: 8.5,
    font: fontHelveticaBold,
    color: colInk,
  });
  const playW = playIconW + 5 + fontHelveticaBold.widthOfTextAtSize('Google Play', 8.5);

  const appleStartX = leftColX + playW + 16;
  const applePath =
    'M 18.71 19.5 C 17.88 20.74 17.00 21.93 15.66 21.97 C 14.32 22.01 13.88 21.20 12.37 21.20 C 10.84 21.20 10.37 21.93 9.09 21.97 C 7.79 22.01 6.80 20.69 5.96 19.47 C 4.25 17.00 2.94 12.48 4.70 9.42 C 5.57 7.91 7.13 6.95 8.82 6.93 C 10.10 6.91 11.31 7.79 12.10 7.79 C 12.87 7.79 14.33 6.72 15.89 6.89 C 16.55 6.92 18.39 7.15 19.56 8.87 C 19.46 8.93 17.37 10.15 17.39 12.63 C 17.42 15.60 20.00 16.59 20.03 16.60 C 20.00 16.70 19.61 18.06 18.71 19.5 Z M 14.97 4.57 C 15.65 3.75 16.11 2.61 15.98 1.46 C 14.99 1.50 13.79 2.12 13.08 2.95 C 12.45 3.68 11.90 4.85 12.05 5.97 C 13.16 6.06 14.29 5.39 14.97 4.57 Z';
  const appleScale = 0.40;
  const appleIconW = 24 * appleScale;
  page2.drawSvgPath(applePath, { x: appleStartX, y: storeRowY + 7, scale: appleScale, color: colInk });
  page2.drawText('App Store', {
    x: appleStartX + appleIconW + 5,
    y: storeRowY,
    size: 8.5,
    font: fontHelveticaBold,
    color: colInk,
  });

  // RIGHT SIDE: 35% WIDTH SCANNABLE QR CODE WITH VINTAGE GOLD BORDER & EMBEDDED BRAHMAND ICON
  const qrSize = 88;
  const qrBoxX = qrColX + (qrColW - qrSize) / 2;
  const qrBoxY = cardY + 22;
  const quietZone = 6;

  // Background white box with generous quiet zone and vintage gold border (#C8A97E)
  page2.drawRectangle({
    x: qrBoxX - quietZone,
    y: qrBoxY - quietZone,
    width: qrSize + quietZone * 2,
    height: qrSize + quietZone * 2,
    color: rgb(1, 1, 1),
    borderColor: colVintageGold,
    borderWidth: 1.0,
  });

  // Dynamic referral URL for deep-linking & analytics tracking: https://brahmand.app/download?f={festival}&s=qr
  const referralQrUrl = getTrackedBrahmandUrl(theme.name, 'pdf_qr_scan');
  drawQrCodeMatrix(
    page2,
    referralQrUrl,
    qrBoxX,
    qrBoxY,
    qrSize,
    rgb(0.04, 0.04, 0.04), // Pure deep ink for high optical contrast
    rgb(1, 1, 1),
    brahmandLogo // Embedded central vector icon
  );

  // Right side QR Caption: "Scan to Join Free"
  const qrCaption = 'Scan to Join Free';
  const capW = brandFont.widthOfTextAtSize(qrCaption, 7.8);
  page2.drawText(qrCaption, {
    x: qrBoxX + (qrSize - capW) / 2,
    y: qrBoxY - 14,
    size: 7.8,
    font: brandFont,
    color: colMaroonHead,
  });

  // 1. Google Play Badge Link (Dedicated touch target)
  const playStoreUri = 'https://play.google.com/store/apps/details?id=com.brahmand.app';
  addClickableLink(doc, page2, playStoreUri, [
    leftColX - 6,
    storeRowY - 8,
    leftColX + playW + 8,
    storeRowY + 22,
  ]);

  // 2. Apple App Store Badge Link (Dedicated touch target - zero overlap)
  const appStoreUri = 'https://apps.apple.com/in/app/brahmand-app/id6765467224';
  const appleFullW = appleIconW + 5 + fontHelveticaBold.widthOfTextAtSize('App Store', 8.5);
  addClickableLink(doc, page2, appStoreUri, [
    appleStartX - 6,
    storeRowY - 8,
    appleStartX + appleFullW + 8,
    storeRowY + 22,
  ]);

  // 3. QR Code Touch Target (Dedicated right column target)
  addClickableLink(doc, page2, referralQrUrl, [
    qrBoxX - quietZone,
    qrBoxY - quietZone - 16,
    qrBoxX + qrSize + quietZone,
    qrBoxY + qrSize + quietZone,
  ]);

  // 4. Upper Card Content Area (Text & features only - strictly ABOVE the store buttons)
  const cardClickUrl = getTrackedBrahmandUrl(theme.name, 'download_button');
  addClickableLink(doc, page2, cardClickUrl, [
    cardX,
    storeRowY + 24,
    splitLineX,
    cardY + cardH,
  ]);

  // 8. FOOTER (Without QR code, matching Page 1)
  const footY = 24;
  page2.drawLine({
    start: { x: 38, y: footY + 40 },
    end: { x: pageWidth - 38, y: footY + 40 },
    thickness: 0.8,
    color: colPeachDeep,
    opacity: 0.85,
  });

  const fLogoDim = 17;
  if (brahmandLogo) {
    page2.drawImage(brahmandLogo, {
      x: 44,
      y: footY + 13,
      width: fLogoDim,
      height: fLogoDim,
    });
  }

  const fBrandX = brahmandLogo ? 44 + fLogoDim + 6 : 44;
  page2.drawText('BRAHMAND', {
    x: fBrandX,
    y: footY + 15,
    size: 11,
    font: brandFont,
    color: colCrimson,
  });

  page2.drawText('Discover more on Brahmand  *  https://brahmand.app', {
    x: 44,
    y: footY + 2,
    size: 7.8,
    font: fontTimesItalic,
    color: colInkSoft,
  });

  try {
    const footerTrackingUrl = getTrackedBrahmandUrl(theme.name, 'pdf_footer');
    const pfxW = fontTimesItalic.widthOfTextAtSize('Discover more on Brahmand  *  ', 7.8);
    const lnkW = fontTimesItalic.widthOfTextAtSize('https://brahmand.app', 7.8);
    addClickableLink(doc, page2, footerTrackingUrl, [
      44 + pfxW,
      footY - 2,
      44 + pfxW + lnkW,
      footY + 12,
    ]);
  } catch (footerLinkErr) {
    console.warn('[PDF] Failed to add footer link annotation on Page 2:', footerLinkErr);
  }


  const pageText = 'SHARED WITH LOVE VIA BRAHMAND APP';
  const ptW = fontHelveticaBold.widthOfTextAtSize(pageText, 7);
  page2.drawText(pageText, {
    x: pageWidth - 44 - ptW,
    y: footY + 16,
    size: 7,
    font: fontHelveticaBold,
    color: colSageDeep,
  });

  const subPageText = 'PAGE 2 OF 2';
  const sptW = fontHelveticaBold.widthOfTextAtSize(subPageText, 7.5);
  page2.drawText(subPageText, {
    x: pageWidth - 44 - sptW,
    y: footY + 2,
    size: 7.5,
    font: fontHelveticaBold,
    color: colCrimson,
  });
}

/**
 * Builds and shares the 2-page Festival Katha PDF with Page 1 Universal Artwork and Page 2 Narrative.
 */
export async function generateFestivalStoryPdf(festival: any, sectionValue?: string): Promise<string> {
  const theme = getFestivalTheme(festival, sectionValue);

  const doc = await PDFDocument.create();
  doc.setTitle(`Brahmand - ${cleanTextForPdf(theme.name)} Festival Katha`);
  doc.setAuthor("Brahmand - Daily Sanatan Community");
  doc.setSubject(`${cleanTextForPdf(theme.name)} Story and Katha`);
  doc.setCreator('Brahmand Platform');

  const fonts = await loadPdfFonts(doc);

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // ==========================================
  // PAGE 1: DYNAMIC ROYAL FESTIVAL ARTWORK
  // ==========================================
  const page1 = doc.addPage([pageWidth, pageHeight]);
  await renderDynamicFestivalPage1(doc, page1, theme, fonts, festival, 1, 2);

  // ==========================================
  // PAGE 2: ILLUMINATED KATHA NARRATIVE CHAPTERS
  // ==========================================
  const page2 = doc.addPage([pageWidth, pageHeight]);
  await renderDynamicFestivalPage2(doc, page2, theme, fonts, festival);

  // Save 2-Page PDF with standard xref table (no object streams) for 100% viewer compatibility
  const base64Pdf = await doc.saveAsBase64({ useObjectStreams: false });
  const sanitizedName = theme.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'festival';
  const filename = `${sanitizedName}_katha.pdf`;

  // Always prefer cacheDirectory for Android FileProvider compatibility (maps cache-path root)
  const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const rawUri = `${targetDir}${filename}`;
  const fileUri = rawUri.startsWith('file://') ? rawUri : `file://${rawUri}`;

  // Delete any existing older copy to prevent file-lock or stale content
  try {
    const existing = await FileSystem.getInfoAsync(fileUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (cleanErr) {
    console.warn('[PDF] Cache cleanup non-critical error:', cleanErr);
  }

  await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Verify file write success and non-empty file
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists || (typeof fileInfo.size === 'number' && fileInfo.size === 0)) {
    throw new Error('PDF file generation was incomplete or empty.');
  }

  return fileUri;
}

/**
 * Builds and shares the Festival Katha PDF via native share dialog.
 * Fully hardened for both Android and iOS edge cases (WhatsApp, Telegram, Drive, Gmail, etc.)
 */
export async function shareFestivalStoryPdf(
  festival: any,
  sectionValue?: string
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const fileUri = await generateFestivalStoryPdf(festival, sectionValue);
    const theme = getFestivalTheme(festival, sectionValue);

    const trackingShareUrl = getTrackedBrahmandUrl(theme.name, 'whatsapp_share');
    const shareTitle = `${theme.name} Festival Katha & Divine Blessings`;
    const shareMessage =
      `🌸 *${theme.name} Festival Katha & Divine Blessings* 🌸\n\n` +
      `May the divine grace of ${theme.deity} bring peace, prosperity, and spiritual fulfillment to your family.\n\n` +
      `📖 Read the complete sacred story & Vedic blessings in the attached PDF.\n\n` +
      `🛕 *Download Brahmand App* for 1,000+ Live Temple Darshans, Daily Vedic Panchang, and Jaap Counter:\n` +
      `👉 ${trackingShareUrl}`;

    const isUserCancellation = (err: any) => {
      const msg = String(err?.message || err || '').toLowerCase();
      return (
        msg.includes('cancel') ||
        msg.includes('dismiss') ||
        msg.includes('did not share') ||
        msg.includes('user cancelled')
      );
    };

    // -------------------------------------------------------------
    // PLATFORM: ANDROID MULTI-TIER PIPELINE
    // -------------------------------------------------------------
    if (Platform.OS === 'android') {
      // Tier 1: React Native Share (supports file URL + title + message)
      try {
        const RNShareModule = require('react-native-share');
        const shareApi = RNShareModule?.default || RNShareModule;
        if (shareApi && typeof shareApi.open === 'function') {
          await shareApi.open({
            title: shareTitle,
            subject: shareTitle,
            message: shareMessage,
            url: fileUri,
            type: 'application/pdf',
            filename: `${theme.name.replace(/[^a-zA-Z0-9]/g, '_')}_katha`,
            failOnCancel: false,
          });
          return { success: true, uri: fileUri };
        }
      } catch (rnShareErr: any) {
        if (isUserCancellation(rnShareErr)) {
          return { success: true, uri: fileUri };
        }
        console.warn('[PDF Share Android] react-native-share failed, trying expo-sharing:', rnShareErr);
      }

      // Tier 2: Expo Sharing (natively bridges via Expo SharingFileProvider with read URI permissions)
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: shareTitle,
          });
          return { success: true, uri: fileUri };
        }
      } catch (expoShareErr: any) {
        if (isUserCancellation(expoShareErr)) {
          return { success: true, uri: fileUri };
        }
        console.warn('[PDF Share Android] expo-sharing failed, trying IntentLauncher:', expoShareErr);
      }

      // Tier 3: Android IntentLauncher with content:// URI (bypasses FileUriExposedException)
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        let IntentLauncher;
        try {
          IntentLauncher = require('expo-intent-launcher');
        } catch {}
        if (IntentLauncher && typeof IntentLauncher.startActivityAsync === 'function') {
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: 'application/pdf',
            extra: {
              'android.intent.extra.STREAM': contentUri,
              'android.intent.extra.TEXT': shareMessage,
              'android.intent.extra.SUBJECT': shareTitle,
            },
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          });
          return { success: true, uri: fileUri };
        }
      } catch (intentErr: any) {
        if (isUserCancellation(intentErr)) {
          return { success: true, uri: fileUri };
        }
        console.warn('[PDF Share Android] IntentLauncher fallback error:', intentErr);
      }

      // Tier 4: Standard RN Share text fallback
      await RNShare.share({
        title: shareTitle,
        message: shareMessage,
      });
      return { success: true, uri: fileUri };
    }

    // -------------------------------------------------------------
    // PLATFORM: IOS PIPELINE
    // -------------------------------------------------------------
    // Tier 1: React Native Share
    try {
      const RNShareModule = require('react-native-share');
      const shareApi = RNShareModule?.default || RNShareModule;
      if (shareApi && typeof shareApi.open === 'function') {
        await shareApi.open({
          title: shareTitle,
          subject: shareTitle,
          message: shareMessage,
          url: fileUri,
          type: 'application/pdf',
          filename: `${theme.name.replace(/[^a-zA-Z0-9]/g, '_')} Katha`,
          failOnCancel: false,
        });
        return { success: true, uri: fileUri };
      }
    } catch (shareErr: any) {
      if (isUserCancellation(shareErr)) {
        return { success: true, uri: fileUri };
      }
      console.warn('[PDF Share iOS] react-native-share fallback to expo-sharing:', shareErr);
    }

    // Tier 2: Expo Sharing with UTI: com.adobe.pdf
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: shareTitle,
          UTI: 'com.adobe.pdf',
        });
        return { success: true, uri: fileUri };
      }
    } catch (expoErr: any) {
      if (isUserCancellation(expoErr)) {
        return { success: true, uri: fileUri };
      }
      console.warn('[PDF Share iOS] expo-sharing failed, falling back to RNShare:', expoErr);
    }

    // Tier 3: React Native text fallback
    await RNShare.share({
      title: shareTitle,
      message: shareMessage,
    });

    return { success: true, uri: fileUri };
  } catch (err: any) {
    console.error('Error in shareFestivalStoryPdf:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
