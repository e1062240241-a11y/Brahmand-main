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
  PDFName,
  PDFHexString,
  setTextMatrix,
  showText,
  beginText,
  endText,
  setFontAndSize,
  setFillingColor,
} from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share as RNShare, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { getFestivalImage } from '../constants/festivalImages';
import { POPPINS_REGULAR_BASE64, ROZHA_ONE_REGULAR_BASE64, HIMALAYA_TT_REGULAR_BASE64 } from '../constants/devanagariPdfFonts';
import { useAuthStore } from '../store/authStore';
import { getPanchang } from '../services/api';
import { formatTimeValue } from './panchangTimeUtils';

// Ensure regeneratorRuntime is available on all global namespaces for @pdf-lib/fontkit Devanagari text shaping
try {
  const reg = require('regenerator-runtime/runtime');
  if (typeof (global as any).regeneratorRuntime === 'undefined') (global as any).regeneratorRuntime = reg;
  if (typeof (globalThis as any).regeneratorRuntime === 'undefined') (globalThis as any).regeneratorRuntime = reg;
} catch (_e1) {
  try {
    const reg2 = require('@babel/runtime/regenerator');
    if (typeof (global as any).regeneratorRuntime === 'undefined') (global as any).regeneratorRuntime = reg2;
    if (typeof (globalThis as any).regeneratorRuntime === 'undefined') (globalThis as any).regeneratorRuntime = reg2;
  } catch (_e2) { }
}

// Check if string contains Devanagari Unicode characters (0x0900 - 0x097F)
export function hasDevanagariChar(text: string): boolean {
  return /[\u0900-\u097F]/.test(text || '');
}

// Check if festival or theme is Sharad Purnima / Kojagiri (matching both English and Hindi names)
export function isSharadPurnimaThemeCheck(themeOrFestivalName?: string, altName?: string): boolean {
  const combined = `${themeOrFestivalName || ''} ${altName || ''}`;
  return /sharad\s*purnima|kojagiri|शरद\s*पूर्णिमा|कोजागरी/i.test(combined);
}

// First name of the signed-in user for the page-1 blessing greeting ("" when signed out / unusable)
export function getPdfPersonalFirstName(): string {
  try {
    const raw = String(useAuthStore.getState()?.user?.name || '').trim();
    const first = raw.split(/\s+/)[0] || '';
    return /^[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F'.-]{1,19}$/.test(first) ? first : '';
  } catch (_e) {
    return '';
  }
}

const MUMBAI_PANCHANG = { lat: 19.076, lng: 72.8777 };
const FESTIVAL_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// "25 October 2026" | "2026-10-25" -> "2026-10-25" (explicit parse, Hermes Date.parse is unreliable for non-ISO)
function festivalDateToISO(raw: string): string | null {
  const ymd = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  const m = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const monthIdx = FESTIVAL_MONTHS.indexOf(m[2].toLowerCase());
  if (monthIdx < 0) return null;
  return `${m[3]}-${String(monthIdx + 1).padStart(2, '0')}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
}

const HINDI_MONTHS_MAP: Record<number, string> = {
  1: 'जनवरी', 2: 'फ़रवरी', 3: 'मार्च', 4: 'अप्रैल', 5: 'मई', 6: 'जून',
  7: 'जुलाई', 8: 'अगस्त', 9: 'सितंबर', 10: 'अक्टूबर', 11: 'नवंबर', 12: 'दिसंबर',
};
const HINDI_DAYS_LIST = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const EN_DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTHS_LIST = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface FestivalPanchangInfo {
  dateLabel?: string;
  formattedDateHi?: string;
  formattedDateEn?: string;
  dayOfWeekHi?: string;
  dayOfWeekEn?: string;
  tithiName?: string;
  tithiEnd?: string;
  tithiStart?: string;
  moonrise?: string;
  sunrise?: string;
  sunset?: string;
  nakshatra?: string;
}

// Tithi end-time + Mumbai moonrise + formatted dates for the festival date (page-1 usefulness strip).
// Any failure -> graceful fallback; PDF must still render.
export async function fetchFestivalPanchangInfo(festival: any): Promise<FestivalPanchangInfo | null> {
  try {
    const rawDate = String(festival?.date || festival?.start_date || '').trim();
    const dateISO = festivalDateToISO(rawDate);
    const info: FestivalPanchangInfo = { dateLabel: rawDate };

    if (dateISO) {
      const parts = dateISO.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const dt = new Date(Date.UTC(y, m - 1, d));
        const dayIdx = dt.getUTCDay();
        info.dayOfWeekHi = HINDI_DAYS_LIST[dayIdx];
        info.dayOfWeekEn = EN_DAYS_LIST[dayIdx];
        info.formattedDateHi = `${info.dayOfWeekHi}, ${d} ${HINDI_MONTHS_MAP[m] || ''} ${y}`;
        info.formattedDateEn = `${info.dayOfWeekEn}, ${d} ${EN_MONTHS_LIST[m - 1] || ''} ${y}`;
      }
    }

    if (!dateISO) return info;
    const res: any = await getPanchang({ date_str: dateISO, lat: MUMBAI_PANCHANG.lat, lng: MUMBAI_PANCHANG.lng });
    const data = res?.data ?? res;
    const adv = data?.sources?.advanced_panchang || data?.sources?.panchang_advanced;
    if (adv) {
      const rawEnd = adv?.tithi?.end_time ?? adv?.tithi?.end ?? null;
      let tithiEnd = '';
      if (rawEnd && typeof rawEnd === 'object') {
        tithiEnd = formatTimeValue(rawEnd);
      } else if (typeof rawEnd === 'string') {
        const tm = rawEnd.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
        if (tm) tithiEnd = formatTimeValue(tm[1]);
      }
      if (tithiEnd) info.tithiEnd = tithiEnd;

      const rawStart = adv?.tithi?.start_time ?? adv?.tithi?.start ?? null;
      if (rawStart) info.tithiStart = formatTimeValue(rawStart);

      const tName = adv?.tithi?.details?.tithi_name || adv?.tithi?.name;
      if (tName) info.tithiName = cleanTextForPdf(String(tName));

      const nakName = adv?.nakshatra?.details?.nak_name || adv?.nakshatra?.name;
      if (nakName) info.nakshatra = cleanTextForPdf(String(nakName));

      const moonrise = formatTimeValue(adv?.moonrise || data?.moonrise);
      if (moonrise) info.moonrise = moonrise;

      const sunrise = formatTimeValue(adv?.sunrise || data?.sunrise);
      if (sunrise) info.sunrise = sunrise;

      const sunset = formatTimeValue(adv?.sunset || data?.sunset);
      if (sunset) info.sunset = sunset;
    }
    return info;
  } catch (_err) {
    return null;
  }
}

// Pure JS Base64 to Uint8Array decoder (cross-platform compatible across iOS, Android, Node)
export function decodeBase64ToUint8(b64: string): Uint8Array {
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

// Clean text to safe printable characters (allowing Devanagari & standard ASCII) to prevent PDF crashes
export function cleanTextForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\t\n\r]/g, '')
    .trim();
}

/**
 * Safely resolves the font to use for a given text string.
 * If text contains Devanagari characters, it MUST use a custom embedded font (fontPoppins or fontRozha).
 * If the custom font is unavailable, it returns null to prevent WinAnsi encode crashes.
 */
export function resolveSafeFont(preferredFont: any, text: string, fallbackDevanagariFont?: any): any {
  if (hasDevanagariChar(text)) {
    // Must NOT use standard WinAnsi fonts (Times, Helvetica) for Devanagari text!
    return fallbackDevanagariFont || preferredFont;
  }
  return preferredFont;
}

// Extra inter-word breathing room for Devanagari (as a fraction of font size)
const DEVANAGARI_WORD_SPACE = 0.26;

/**
 * Safely measures text width.
 * For Devanagari text with fontkit, measures the actual cumulative glyph layout advances,
 * including comfortable inter-word spacing so text is not cramped.
 */
export function measureTextWidth(font: any, text: string, fontSize: number): number {
  if (!text || text.length === 0) return 0;
  if (!font) return text.length * fontSize * 0.55;
  try {
    if (font.embedder && font.embedder.font && typeof font.embedder.font.layout === 'function' && hasDevanagariChar(text)) {
      const fkFont = font.embedder.font;
      const run = fkFont.layout(text);
      const scale = fontSize / fkFont.unitsPerEm;
      // Extra space per word gap to prevent Hindi text from looking crammed together
      const extraSpacePerWord = fontSize * DEVANAGARI_WORD_SPACE;
      let totalAdv = 0;
      for (let i = 0; i < run.glyphs.length; i++) {
        let adv = run.positions[i].xAdvance * scale;
        if (run.glyphs[i].name === 'space') {
          adv += extraSpacePerWord;
        }
        totalAdv += adv;
      }
      return totalAdv;
    }
    return font.widthOfTextAtSize(text, fontSize);
  } catch (_err) {
    return text.length * fontSize * 0.55;
  }
}

/**
 * Draws shaped Devanagari text with accurate glyph positioning (xAdvance, xOffset, yOffset).
 * Adds generous, natural inter-word spacing so Hindi words never stick together.
 */
function drawShapedDevanagari(
  page: any,
  text: string,
  targetFont: any,
  x: number,
  y: number,
  size: number,
  color: any
): boolean {
  if (!targetFont || !targetFont.embedder || !targetFont.embedder.font || typeof targetFont.embedder.font.layout !== 'function') {
    return false;
  }
  try {
    if (!targetFont || !targetFont.embedder || !targetFont.embedder.font || typeof targetFont.embedder.font.layout !== 'function') {
      return false;
    }
    if (typeof targetFont.encodeText !== 'function') return false;

    const fkFont = targetFont.embedder.font;
    const run = fkFont.layout(text);
    if (!run || !run.glyphs || run.glyphs.length === 0) return false;

    // pdf-lib embeds only a subset and remaps glyph IDs. encodeText() registers
    // every glyph used by this run and returns the *subset* IDs — using the
    // original fontkit IDs here draws random/duplicate glyphs (broken matras).
    const encodedHex = targetFont.encodeText(text).asString();
    const fontRefKey = `F_Dev_${String(targetFont.name || 'Custom').replace(/[^A-Za-z0-9_-]/g, '')}`;
    page.node.setFontDictionary(PDFName.of(fontRefKey), targetFont.ref);

    const scale = size / fkFont.unitsPerEm;
    const ops: any[] = [
      beginText(),
      setFontAndSize(fontRefKey, size),
      setFillingColor(color || rgb(0, 0, 0)),
    ];

    // Extra space per word gap to give Hindi text breathing room
    const extraSpacePerWord = size * DEVANAGARI_WORD_SPACE;

    let curX = x;
    for (let i = 0; i < run.glyphs.length; i++) {
      const g = run.glyphs[i];
      const pos = run.positions[i];
      let adv = pos.xAdvance * scale;
      const xOff = pos.xOffset * scale;
      const yOff = pos.yOffset * scale;

      const hex = encodedHex.slice(i * 4, i * 4 + 4) || g.id.toString(16).padStart(4, '0');

      ops.push(setTextMatrix(1, 0, 0, 1, curX + xOff, y + yOff));
      ops.push(showText(PDFHexString.of(hex)));

      if (g.name === 'space') {
        adv += extraSpacePerWord;
      }
      curX += adv;
    }
    ops.push(endText());
    page.pushOperators(...ops);
    return true;
  } catch (_shapeErr) {
    return false;
  }
}

/**
 * Safely draws text onto a page.
 * Uses accurate glyph-by-glyph layout shaping for Devanagari Hindi text so ligatures and matras render flawlessly.
 * Guards against WinAnsi encoding errors and unhandled glyph exceptions.
 */
export function safeDrawText(
  page: any,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: any;
    color?: any;
    fallbackFont?: any;
    [key: string]: any;
  }
): void {
  if (!text || text.length === 0) return;
  const { fallbackFont, font, x, y, size, color, ...rest } = options;
  const isDev = hasDevanagariChar(text);
  const targetFont = (isDev && fallbackFont) ? fallbackFont : font;

  if (targetFont) {
    if (isDev) {
      const shapedOk = drawShapedDevanagari(page, text, targetFont, x, y, size, color);
      if (shapedOk) return;
      if (fallbackFont && targetFont !== fallbackFont) {
        const fbShapedOk = drawShapedDevanagari(page, text, fallbackFont, x, y, size, color);
        if (fbShapedOk) return;
      }
    }

    try {
      page.drawText(text, { ...rest, x, y, size, color, font: targetFont });
      return;
    } catch (_err) {
      if (fallbackFont && targetFont !== fallbackFont) {
        try {
          page.drawText(text, { ...rest, x, y, size, color, font: fallbackFont });
          return;
        } catch (_fbErr) { }
      }
    }
  }
}

// Helper to word-wrap text to fit within a given maximum width
export function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = (text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = measureTextWidth(font, testLine, fontSize);
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
export function addClickableLink(
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
  isLastLine: boolean = false,
  fallbackFont?: any
) {
  const isDev = hasDevanagariChar(lineText);
  const activeFont = (isDev && fallbackFont) ? fallbackFont : font;

  const words = lineText.trim().split(/\s+/);
  if (words.length <= 1 || isLastLine) {
    safeDrawText(page, lineText, {
      x: startX,
      y: startY,
      size: fontSize,
      font: activeFont,
      fallbackFont,
      color: color,
    });
    return;
  }

  let totalWordsWidth = 0;
  for (const w of words) {
    totalWordsWidth += measureTextWidth(activeFont, w, fontSize);
  }

  const numSpaces = words.length - 1;
  const normalSpaceWidth = measureTextWidth(activeFont, ' ', fontSize) || (fontSize * 0.3);
  const spaceWidth = (lineWidth - totalWordsWidth) / numSpaces;

  // If spacing would be unnaturally huge, fall back to normal spacing
  if (spaceWidth > normalSpaceWidth * 2.8 || spaceWidth < normalSpaceWidth * 0.7) {
    safeDrawText(page, lineText, {
      x: startX,
      y: startY,
      size: fontSize,
      font: activeFont,
      fallbackFont,
      color: color,
    });
    return;
  }

  let curX = startX;
  for (let i = 0; i < words.length; i++) {
    safeDrawText(page, words[i], {
      x: curX,
      y: startY,
      size: fontSize,
      font: activeFont,
      fallbackFont,
      color: color,
    });
    curX += measureTextWidth(activeFont, words[i], fontSize) + spaceWidth;
  }
}

// Draw authentic, scannable vector QR code matrix with vintage gold styling & embedded Brahmand logo
export function drawQrCodeMatrix(
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

    if (lightColor) {
      page.drawRectangle({
        x: startX,
        y: startY,
        width: size,
        height: size,
        color: lightColor,
      });
    }

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

      if (lightColor) {
        page.drawRectangle({
          x: centerBoxX,
          y: centerBoxY,
          width: centerBoxSize,
          height: centerBoxSize,
          color: lightColor,
          borderColor: rgb(0.784, 0.663, 0.494), // #C8A97E vintage gold
          borderWidth: 0.6,
        });
      }

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
  mantraHead?: string;
  mantraText?: string;
  shloka1?: string;
  shloka2?: string;
}

export function getFestivalTheme(festival: any, sectionValue?: string): FestivalTheme {
  const festivalName = (festival?.festival_name || festival?.name || festival?.title || 'Festival').trim();
  const lower = festivalName.toLowerCase();

  const creamBg = rgb(0.992, 0.984, 0.969); // #FDFBF7 Warm Ivory Parchment
  const antiqueGold = rgb(0.831, 0.686, 0.216); // #D4AF37 Antique Gold
  const deepCharcoal = rgb(0.173, 0.173, 0.173); // #2C2C2C Deep Charcoal (NO pure black)

  const dateFromData = festival?.date || festival?.start_date;

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
        {
          id: 1,
          title: 'Return to Ayodhya',
          icon: 'lotus',
          content: 'Diwali marks Lord Rama triumphant return to Ayodhya with Sita and Lakshman after 14 years of righteous exile and vanquishing the demon king Ravana. The overjoyed citizens illuminated every lane, riverbank, and rooftop of Ayodhya with millions of glowing earthen diyas, welcoming their beloved Maryada Purushottam with boundless reverence.',
        },
        {
          id: 2,
          title: 'Lakshmi Pujan & Samudra Manthan',
          icon: 'diya',
          content: 'Goddess Lakshmi, the supreme deity of auspiciousness and wealth, emerged in celestial resplendence during the churning of the cosmic milk ocean (Samudra Manthan) on Kartik Amavasya and chose Lord Vishnu as her eternal divine consort. Devotees welcome Maa Lakshmi into pristine, illuminated homes to invoke timeless prosperity.',
        },
        {
          id: 3,
          title: 'Govardhan & Bhai Dooj',
          icon: 'star',
          content: 'The five-day celebrations unite rich Sanatan lore: Dhanteras worshipping Lord Dhanvantari, Naraka Chaturdashi commemorating Krishna triumph over Narakasura, Govardhan Puja celebrating the lifting of Mount Govardhan to shield Vrindavan, and Bhai Dooj consecrating the sacred protective bond between siblings.',
        },
        {
          id: 4,
          title: 'Lighting Diyas & Auspicious Rangoli',
          icon: 'anjali',
          content: 'Courtyards and doorways are adorned with intricate Rangoli patterns crafted with colored powders, rice flour, and fragrant marigold petals. Earthen lamps filled with mustard oil or pure desi ghee are placed in rows to dispel darkness, spiritual ignorance, and negative cosmic energies.',
        },
        {
          id: 5,
          title: 'Festive Harmony & Divine Blessings',
          icon: 'flower',
          content: 'Families exchange handmade traditional sweets, wear exquisite new garments, visit temples, and seek the blessings of elders. The festival serves as an eternal reminder that light invariably conquers darkness, truth triumphs over deceit, and righteousness dispels every shadow.',
        },
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
        {
          id: 1,
          title: 'Divine Nativity in Dungeon',
          icon: 'lotus',
          content: 'Janmashtami celebrates the midnight manifestation of Lord Krishna, the eighth avatar of Lord Vishnu, born in a dark dungeon in Mathura to Devaki and Vasudeva during torrential rainstorms. Divine illumination broke the chains of captivity to establish Dharma and vanquish the tyrannical king Kamsa.',
        },
        {
          id: 2,
          title: 'Cosmic Miracle Across Yamuna',
          icon: 'diya',
          content: 'Vasudeva miraculously carried infant Krishna in a wicker basket across the surging, roaring Yamuna river. The five-headed serpent king Sheshnaag raised his hoods like an umbrella to shield the divine infant from blinding deluge until they safely reached Nanda and Yashoda in Gokul.',
        },
        {
          id: 3,
          title: 'Childhood Leelas & Makhan Chor',
          icon: 'star',
          content: 'Little Krishna enchanted the pastures of Vrindavan with his melodious bamboo flute, playfully stole Makhan (fresh white butter) with his gopa companions, and vanquished demons Putana, Bakasura, and the venomous serpent Kaliya, blessing every soul with unconditional love.',
        },
        {
          id: 4,
          title: 'Midnight Nishita Puja & Cradle Worship',
          icon: 'anjali',
          content: 'Devotees observe a strict fast until midnight, decorating home sanctums with peacock feathers, fragrant flowers, and miniature silver swings (Palana). At the precise midnight hour, the idol of Laddu Gopal is bathed in Panchamrit, offered fresh butter and mishri, and gently rocked with devotional bhajans.',
        },
        {
          id: 5,
          title: 'Dahi Handi & Ecstatic Celebration',
          icon: 'flower',
          content: 'The following day, vibrant youth groups (Govindas) build soaring human pyramids across towns and cities to reach and shatter clay pots filled with curd and butter suspended high in the air, recreating Krishna boyhood leelas with thunderous shouts of "Govinda Ala Re!"',
        },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('karwa') || lower.includes('karva')) {
    return {
      name: 'Karwa Chauth',
      hindiName: 'KARWA CHAUTH',
      devanagariRoman: 'KARWA CHAUTH',
      primaryAccent: rgb(0.85, 0.15, 0.15), // Deep Crimson Sindoor #D92626
      secondaryAccent: rgb(0.88, 0.65, 0.12), // Antique Gold #E0A61F
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.58, 0.08, 0.12),
      heroGradientBottom: rgb(0.88, 0.32, 0.08),
      date: dateFromData || '29TH OCTOBER 2026',
      tithi: 'KARTIK KRISHNA CHATURTHI',
      greeting: 'May the sacred moonlight of Karwa Chauth bless your marital bond with eternal love, radiant health, deep harmony, and boundless prosperity.',
      deity: 'Lord Shiva, Goddess Parvati, Lord Ganesha & Chandra Devta',
      tradition: 'Nirjala Vrat, Baya, Karwa Katha & Moon Sighting through Sieve',
      subtitle: 'The Sacred Katha of Queen Veervati & Moon Worship - Kartik',
      chapters: [
        {
          id: 1,
          title: 'Queen Veervati & Unconditional Vow',
          icon: 'lotus',
          content: 'Queen Veervati, the only beloved sister among seven caring brothers, visited her parents home on Karwa Chauth. Adhering to the sacred vow of fasting for her husbands longevity and health, she went the entire day without food or a single drop of water, waiting devotedly for the moonrise in patient prayer.',
        },
        {
          id: 2,
          title: 'Brotherly Deceit & Distant Flame',
          icon: 'diya',
          content: 'Distressed seeing their beloved sister faint from severe hunger and thirst, the brothers lit a massive fire behind a distant Pipal tree and placed a round sieve in front of it. They tricked Veervati into believing the glowing radiant flame was the rising full moon, prompting her to break her holy fast prematurely.',
        },
        {
          id: 3,
          title: 'Goddess Parvati Grace & Renewed Penance',
          icon: 'star',
          content: 'As she swallowed the first morsel of food, news arrived that her husband, the king, had suddenly fallen critically ill. Realizing her fast was broken under a false moon, she wept inconsolably and prayed with pure devotion. Goddess Parvati appeared in compassion, guiding her to observe the fast again with unwavering sanctity and strict vows.',
        },
        {
          id: 4,
          title: 'The Sacred Sieve & Thali Rotation',
          icon: 'anjali',
          content: 'Veervati observed the fast following all strict traditions. Married women gather in festive circles for the Karwa Chauth Katha ritual, rotating earthen thalis seven times while singing verses of auspiciousness before offering Arghya water to the moon through a decorative chalni (sieve), seeking Akhand Saubhagya.',
        },
        {
          id: 5,
          title: 'Sargi, Divine Health & Eternal Love',
          icon: 'flower',
          content: 'Her husband was restored to vibrant health and vitality by divine grace. Today, women commence the fast at dawn with Sargi gifted by mothers-in-law, adorn exquisite red attire, glass bangles, and henna, and break the fast by receiving water from their husbands hands, celebrating an eternal spiritual bond.',
        },
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
        {
          id: 1,
          title: 'Prahlada Unshakeable Devotion',
          icon: 'lotus',
          content: 'Young Prahlada stood unshakeable in his supreme devotion to Lord Narayana despite the cruel persecution of his tyrannical father Hiranyakashipu, who demanded to be worshipped as God. Prahlada faith remained unbreakable in the face of poison, charging elephants, and deadly serpents.',
        },
        {
          id: 2,
          title: 'Holika Dahan & Vanquishing of Evil',
          icon: 'diya',
          content: 'Hiranyakashipu sister Holika possessed a celestial shawl immune to flames. She lured young Prahlada onto a roaring bonfire to consume him. By divine will, a miraculous wind wrapped the fireproof garment around Prahlada, reducing Holika to ashes and preserving the pure devotee without a single burn.',
        },
        {
          id: 3,
          title: 'Manifestation of Lord Narasimha',
          icon: 'star',
          content: 'At twilight, Lord Vishnu manifested from a palace pillar as the divine half-man, half-lion incarnation Lord Narasimha. On the threshold between inside and outside, neither on earth nor sky, he vanquished Hiranyakashipu, fulfilling all cosmic conditions and liberating the universe from fear.',
        },
        {
          id: 4,
          title: 'Sacred Pyre & Spiritual Cleansing',
          icon: 'anjali',
          content: 'On the eve of Phalguna Purnima, communities ignite the sacred Holika pyre with dried wood, coconut, and grains. Devotees circumambulate the flames, offering roasted barley and prayers to cleanse negative energies, ego, past grievances, and spiritual darkness.',
        },
        {
          id: 5,
          title: 'Rangotsav & Joyous Brotherhood',
          icon: 'flower',
          content: 'The following dawn erupts into Rangwali Holi. People celebrate with vibrant organic herbal colors (gulal), fragrant rose water, lively folk music, and traditional delicacies like sweet Gujiyas and Thandai, embracing neighbors and strangers alike with joyous warmth and unity.',
        },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('teej') || lower.includes('hariyali') || lower.includes('kajari')) {
    const isKajari = lower.includes('kajari') || lower.includes('badi teej');
    return {
      name: isKajari ? 'Kajari Teej' : 'Hariyali Teej',
      hindiName: isKajari ? 'KAJARI TEEJ' : 'HARIYALI TEEJ',
      devanagariRoman: isKajari ? 'KAJARI TEEJ' : 'HARIYALI TEEJ',
      primaryAccent: rgb(0.12, 0.42, 0.22), // Monsoon Green #1F6B38
      secondaryAccent: rgb(0.82, 0.28, 0.48), // Lotus Pink #D1477A
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.10, 0.35, 0.18),
      heroGradientBottom: rgb(0.20, 0.50, 0.30),
      date: dateFromData || '16TH AUGUST 2026',
      tithi: isKajari ? 'BHADRAPADA KRISHNA TRITIYA' : 'SHRAVAN SHUKLA TRITIYA',
      greeting: 'May the divine union of Shiva and Parvati bring lush happiness, lifelong love, prosperity and timeless auspiciousness to your home.',
      deity: 'Lord Shiva & Goddess Parvati',
      tradition: 'Nirjala Fast, Green Attire & Sawan Swings',
      subtitle: isKajari ? 'Neem Mata Vrat & Sattu Offerings - Bhadrapada' : 'The Divine Union of Shiva & Parvati - Shravan Shukla Tritiya',
      chapters: [
        {
          id: 1,
          title: isKajari ? 'Neem Mata Vrat & The Brahmin Vow' : 'Parvati Supreme Longing',
          icon: 'lotus',
          content: isKajari
            ? 'Kajari Teej falls in Bhadrapada month amid dark monsoon clouds. Legend narrates the tale of an impoverished Brahmin family who had no food for the sacred Teej fast. The young son risked his life at midnight to fetch Sattu (roasted flour dough) so his devoted mother could complete her Neem Mata worship and prayers.'
            : 'Long ago, Goddess Parvati deeply desired Lord Shiva as her divine consort. Shiva, immersed in profound meditative samadhi on Mount Kailash, remained aloof from worldly bonds. Parvati realized that only supreme devotion, unyielding penance, and pure love could awaken his eternal grace.',
        },
        {
          id: 2,
          title: isKajari ? 'Filial Devotion & Sacred Sattu' : '108 Lifetimes of Austerity',
          icon: 'diya',
          content: isKajari
            ? 'When intercepted by guards inside the royal granary, the young boy explained his mothers holy vow to worship Neem Mata and break fast only with Sattu. Deeply touched by his filial devotion, the King granted the family golden vessels, grain, and provisions for lifetime, blessing their pure faith.'
            : 'Goddess Parvati embarked on severe austerities spanning 108 lifetimes across rugged mountain caves, icy torrents, and dense Shravan forests. Renouncing all royal comforts, she meditated amidst scorching heat, torrential monsoon rains, and freezing snows with unshakeable concentration.',
        },
        {
          id: 3,
          title: 'Divine Reunion on Tritiya',
          icon: 'star',
          content: 'Moved by Parvati unyielding penance and selfless love, Lord Shiva manifested before her on the third day (Tritiya). Recognizing her eternal devotion, he accepted Parvati as his divine consort, filling the entire cosmos with festive celebration, blooming green earth, and auspicious joy.',
        },
        {
          id: 4,
          title: 'Akhand Saubhagya & Marital Blessings',
          icon: 'anjali',
          content: 'Goddess Parvati decreed that any woman who observes the sacred Teej fast, wears vibrant green bangles, and offers sincere prayers will be blessed with lifelong marital harmony, radiant health, family prosperity, and protection from all adversities.',
        },
        {
          id: 5,
          title: 'Floral Jhulas, Mehndi & Folk Traditions',
          icon: 'flower',
          content: 'Women gather in village courtyards and terraces adorned in festive green and red attire, apply intricate henna patterns on their palms, swing on flower-decked swings (jhulas) tied to banyan trees, sing melodious folk songs, and share traditional sweets like Ghevar.',
        },
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
        {
          id: 1,
          title: 'Solar Transit into Makara Rashi',
          icon: 'lotus',
          content: 'Surya Devta transitions from the southern zodiac into Makara rashi (Capricorn), marking the holy dawn of Uttarayana—the celestial six-month period of the northern sun. Daylight expands, winter chill recedes, and cosmic energy awakens vitality across all living beings.',
        },
        {
          id: 2,
          title: 'Purifying Snan in Sacred Rivers',
          icon: 'diya',
          content: 'Millions of pilgrims take purifying holy dips in sacred rivers like Ganga, Yamuna, Godavari, and Kaveri, especially at Prayagraj Sangam and Gangasagar. Bathing in the early morning sunlight washes away past accumulated karma and instills inner purity and strength.',
        },
        {
          id: 3,
          title: 'Reconciliation of Surya & Shani Dev',
          icon: 'star',
          content: 'According to Vedic legend, on Makar Sankranti, Surya Devta sets aside past misunderstandings to visit his son Shani Dev, ruler of Makara rashi. This celestial reunion signifies forgiveness, harmony, family reconciliation, and the supreme triumph of love over grievances.',
        },
        {
          id: 4,
          title: 'Til-Gul Offerings & Sweet Harmony',
          icon: 'anjali',
          content: 'Families exchange sesame and jaggery delicacies with the traditional greeting "Til-gul ghya, god god bola" (accept these sweet sesame seeds and speak only sweet, kind words). Sesame provides winter nourishment and warmth while jaggery invokes joy and lasting bonds.',
        },
        {
          id: 5,
          title: 'Vibrant Kites Across Radiant Skies',
          icon: 'flower',
          content: 'Rooftops resonate with music and joyful cries of "Kai Po Che!" as colorful kites fill the azure sky, soaking in health-giving morning sun rays. Families share hot Khichdi, revere agricultural harvests, and express deep gratitude to Mother Earth.',
        },
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
      subtitle: 'Cherished Bond of Sibling Protection & Krishna Grace - Shravan Purnima',
      chapters: [
        {
          id: 1,
          title: 'Draupadi & Krishna Sacred Bandage',
          icon: 'lotus',
          content: 'The most revered mythological story of Raksha Bandhan hails from the Mahabharata. When Lord Krishna cut his finger while handling the Sudarshan Chakra, Draupadi rushed forward without hesitation, tore a strip of pure silk from her royal saree, and bound his bleeding finger in selfless love.',
        },
        {
          id: 2,
          title: 'The Eternal Vow of Protection',
          icon: 'diya',
          content: 'Deeply moved by Draupadi spontaneous affection, Lord Krishna declared her his beloved sister and pledged an eternal debt of protection: "Even if the mountains crumble, I shall stand as your shield whenever you call upon me in distress."',
        },
        {
          id: 3,
          title: 'Krishna Miracle in Kaurava Court',
          icon: 'star',
          content: 'In her most harrowing hour in the Kaurava assembly when her honor was challenged, Draupadi raised both hands in complete surrender to Krishna. Honoring the sacred thread of affection, Krishna supplied infinite yards of radiant silk, preserving her dignity and confounding the oppressors.',
        },
        {
          id: 4,
          title: 'Sacred Rakhi Tying & Tilak Ritual',
          icon: 'anjali',
          content: 'On Shravan Purnima, sisters prepare an auspicious thali with kumkum, unbroken rice (Akshat), a glowing diya, and sweets. Tying the sacred Rakhi thread around their brothers right wrists, they pray for their health and long life, while brothers offer gifts and pledge lifelong support.',
        },
        {
          id: 5,
          title: 'Historic Valor & Family Harmony',
          icon: 'flower',
          content: 'History echoes this sacred bond: Queen Karnavati of Mewar sent a Rakhi thread to Emperor Humayun when facing siege; recognizing the sacred obligation, Humayun set aside political enmity to protect her. Raksha Bandhan stands as an eternal celebration of pure filial love and mutual honor.',
        },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('dussehra') || lower.includes('dasara') || lower.includes('vijayadashami')) {
    return {
      name: 'Dussehra',
      hindiName: 'VIJAYADASHAMI',
      devanagariRoman: 'VIJAYADASHAMI',
      primaryAccent: rgb(0.85, 0.22, 0.08), // Sacred Saffron Vermilion #D93815
      secondaryAccent: rgb(0.18, 0.48, 0.22), // Shami Leaf Emerald Green #2E7D38
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.55, 0.12, 0.08),
      heroGradientBottom: rgb(0.88, 0.38, 0.10),
      date: dateFromData || '20TH OCTOBER 2026',
      tithi: 'ASHWIN SHUKLA DASHAMI',
      greeting: 'May the sacred triumph of Dharma over Adharma bless your life with supreme victory, boundless valor, prosperity, and peace.',
      deity: 'Lord Sri Rama & Maa Durga',
      tradition: 'Ravan Dahan, Shami Puja & Gold Leaf Exchange',
      subtitle: 'Triumph of Lord Rama, Mahishasura Vadh & Sacred Shami Puja - Ashwin',
      chapters: [
        {
          id: 1,
          title: 'Triumph of Lord Rama over Ravana',
          icon: 'lotus',
          content: 'On the tenth day of the epic war in Lanka, Lord Sri Rama defeated the ten-headed demon king Ravana. Before battle, Lord Rama invoked Goddess Durga with intense devotion and recited the sacred Aditya Hridayam stotram, symbolizing the supreme triumph of Dharma (righteousness) over evil and injustice.',
        },
        {
          id: 2,
          title: 'Mahishasura Mardini Cosmic Victory',
          icon: 'diya',
          content: 'Vijayadashami also marks the triumphant victory of Maa Durga over the ferocious buffalo-demon Mahishasura. After a fierce battle lasting nine days and nine nights, the Goddess pierced the demon with her divine trident on the tenth day, liberating the three worlds and restoring cosmic balance.',
        },
        {
          id: 3,
          title: 'Pandavas Retrieval from Sacred Shami Tree',
          icon: 'star',
          content: 'In the Mahabharata, the Pandavas concealed their celestial weapons inside the hollow of a sacred Shami tree before starting their one-year incognito exile (Agyatvas). On Vijayadashami, they returned victorious, retrieved their arms undamaged from the Shami tree, and defeated the Kaurava army to protect Dharma.',
        },
        {
          id: 4,
          title: 'Golden Shami Leaves & Royal Heritage',
          icon: 'anjali',
          content: 'On this auspicious day, people worship the sacred Shami (Apta) tree and exchange its leaves as gold ("सोनं घ्या, सोन्यासारखे राहा!"). Legend tells of the young scholar Kautsa, whose teacher guru dakshina was fulfilled when Lord Kubera showered golden coins upon the Shami and Apta trees on Dussehra.',
        },
        {
          id: 5,
          title: 'Ramlila Effigies & Ayudha Puja',
          icon: 'flower',
          content: 'Grand Ramlila plays conclude with the burning of giant effigies of Ravana, Kumbhakarna, and Meghanada amidst resounding chants of Jai Shree Ram. Devotees also perform Ayudha Puja (worship of books, tools, and vehicles), seeking blessings for victory in all rightful endeavors.',
        },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('shivratri') || lower.includes('mahadev')) {
    return {
      name: 'Maha Shivratri',
      hindiName: 'MAHA SHIVRATRI',
      devanagariRoman: 'MAHA SHIVRATRI',
      primaryAccent: rgb(0.12, 0.28, 0.52), // Cosmic Blue #1F4784
      secondaryAccent: rgb(0.85, 0.45, 0.08), // Sacred Bhasma Ochre #D97314
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.08, 0.16, 0.32),
      heroGradientBottom: rgb(0.22, 0.10, 0.38),
      date: dateFromData || '15TH FEBRUARY 2026',
      tithi: 'PHALGUNA KRISHNA CHATURDASHI',
      greeting: 'May the supreme grace of Lord Shiva bestow fearless peace, liberation, radiant vitality, and auspicious fulfillment upon you.',
      deity: 'Lord Shiva & Maa Parvati',
      tradition: 'Nirjala Fast, 4-Prahar Abhishekam & Belpatra Offering',
      subtitle: 'Cosmic Anand Tandava & Eternal Wedding of Shiva-Parvati',
      chapters: [
        {
          id: 1,
          title: 'Anand Tandava & Cosmic Light of Lingam',
          icon: 'lotus',
          content: 'Maha Shivratri marks the cosmic night Lord Shiva performed the Anand Tandava—the celestial dance of creation, preservation, and dissolution. It is also the night he revealed himself as Lingodbhava: the beginningless and endless pillar of infinite cosmic light to dispel spiritual ignorance.',
        },
        {
          id: 2,
          title: 'Sacred Wedding of Shiva & Parvati',
          icon: 'diya',
          content: 'This auspicious night celebrates the eternal divine marriage of Lord Shiva and Goddess Parvati, symbolizing the supreme union of Purusha (consciousness) and Prakriti (nature). Their union awakened cosmic harmony, bringing fertility and spiritual balance across all worlds.',
        },
        {
          id: 3,
          title: 'Neelkanth & Saving of Creation',
          icon: 'star',
          content: 'During the churning of the cosmic ocean (Samudra Manthan), deadly Halahala poison surfaced, threatening to consume all realms. In boundless compassion, Lord Shiva consumed the venom and held it in his throat, turning it blue and earning the timeless name Neelkanth—the universal saviour.',
        },
        {
          id: 4,
          title: '4-Prahar Abhishekam & Belpatra Worship',
          icon: 'anjali',
          content: 'Devotees observe a strict 24-hour fast and keep a night-long vigil (Jagran), performing Maha Abhishekam across the four prahars using milk, curd, honey, ghee, sugarcane juice, and holy Ganga water. Offering sacred three-leaf Belpatra onto the Shivling cools the Lord and bestows deep peace.',
        },
        {
          id: 5,
          title: 'Inner Liberation & Karmic Peace',
          icon: 'flower',
          content: 'Devotees chant "Om Namah Shivaya" and the Maha Mrityunjaya mantra through the starry night. The fast is broken with satvik prasad at dawn, blessing seekers with mental tranquility, liberation (Moksha), and freedom from the bonds of past karma.',
        },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  if (lower.includes('onam')) {
    return {
      name: 'Onam',
      hindiName: 'THIRUVONAM',
      devanagariRoman: 'THIRUVONAM',
      primaryAccent: rgb(0.85, 0.60, 0.05), // Golden Marigold #D99A0D
      secondaryAccent: rgb(0.12, 0.45, 0.20), // Banana Leaf Green #1F7333
      gold: antiqueGold,
      cream: creamBg,
      charcoal: deepCharcoal,
      heroGradientTop: rgb(0.75, 0.45, 0.05),
      heroGradientBottom: rgb(0.18, 0.48, 0.20),
      date: dateFromData || '26TH AUGUST 2026',
      tithi: 'CHINGAM THIRUVONAM',
      greeting: 'May the vibrant spirit of Onam bless your home with abundant harvests, joy, togetherness, and everlasting prosperity.',
      deity: 'Lord Vamana & King Mahabali',
      tradition: 'Pookalam, Onam Sadya, Vallam Kali & Pulikali',
      subtitle: 'Homecoming of King Mahabali & Vamana Avatar - Chingam',
      chapters: [
        {
          id: 1,
          title: 'Golden Reign of King Mahabali',
          icon: 'lotus',
          content: 'Onam commemorates the legendary golden era of King Mahabali in Kerala, where righteousness, peace, truth, and equality flourished without poverty, theft, or deceit. Pleased with his virtue yet seeking to test his ego, Lord Vishnu incarnated as young Vamana, a dwarf Brahmin lad.',
        },
        {
          id: 2,
          title: 'Vamana Avatar & Three Paces of Land',
          icon: 'diya',
          content: 'Vamana approached King Mahabali during a sacrificial ritual, humbly requesting only three paces of land measured by his small feet. Mahabali granted the boon against the advice of his guru Shukracharya. Vamana immediately grew into the cosmic Trivikrama form, measuring the earth with one step and the heavens with the second.',
        },
        {
          id: 3,
          title: 'Supreme Humility & Annual Homecoming',
          icon: 'star',
          content: 'With no space left for the third step, Mahabali bowed down and offered his own head. Moved by his supreme devotion and humility, Lord Vishnu placed his foot upon him, elevating him to Patala, and granted him a timeless boon to visit his beloved subjects in Kerala once every year during Chingam.',
        },
        {
          id: 4,
          title: 'Intricate Pookalam & Cultural Splendor',
          icon: 'anjali',
          content: 'To welcome their beloved king, families wake early across ten days to craft elaborate floral rangoli patterns (Pookalam) outside homes, progressively adding rings of colorful fresh blossoms. Traditional dances like Thiruvathira and spirited snake boat races (Vallam Kali) animate the waterways.',
        },
        {
          id: 5,
          title: 'Grand Onam Sadya Feast & Unity',
          icon: 'flower',
          content: 'Festivities culminate on Thiruvonam with the grand Onasadya—a vegetarian feast of up to 26 authentic delicacies served on fresh banana leaves, including Avial, Sambar, and sweet Payasam. Communities unite in joyful harmony, celebrating a heritage of abundance and brotherly love.',
        },
      ],
      blessing: 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
    };
  }

  // Dynamic lookup in festival-enrichments (46+ festivals like Maha Shivratri, Karva Chauth, Chhath, etc.)
  try {
    const festivalEnrichments = require('../data/festival-enrichments').default;
    const cleanLower = lower.replace(/[^a-z0-9]/g, ' ').trim();
    let enrichmentMatch: any = null;

    if (festivalEnrichments) {
      // 1. Exact or strict phrase match first
      for (const [key, val] of Object.entries(festivalEnrichments)) {
        const k = key.toLowerCase();
        if (cleanLower === k || cleanLower.includes(k) || k.includes(cleanLower)) {
          enrichmentMatch = val;
          break;
        }
      }
      // 2. Prefix fallback only if no phrase match found
      if (!enrichmentMatch) {
        for (const [key, val] of Object.entries(festivalEnrichments)) {
          const firstWord = key.toLowerCase().split(' ')[0];
          if (firstWord && firstWord.length > 3 && cleanLower.includes(firstWord)) {
            enrichmentMatch = val;
            break;
          }
        }
      }
    }

    if (enrichmentMatch || festival?.summary || festival?.description || festival?.story || festival?.origin || sectionValue) {
      // Prioritize full raw story / katha from user-passed sectionValue, festival.story, or festival.origin before summary fallback
      const rawStoryCandidate = cleanTextForPdf(
        sectionValue ||
        festival?.story ||
        festival?.katha ||
        festival?.origin ||
        enrichmentMatch?.origin ||
        ''
      );
      const summaryText = cleanTextForPdf(enrichmentMatch?.summary || festival?.summary || festival?.description || '');
      const originText = rawStoryCandidate.length > 20 ? rawStoryCandidate : cleanTextForPdf(enrichmentMatch?.origin || summaryText);
      const purposeText = cleanTextForPdf(enrichmentMatch?.purpose || festival?.purpose || summaryText);
      const importanceText = cleanTextForPdf(enrichmentMatch?.importance || festival?.importance || summaryText);
      const celebrationText = cleanTextForPdf(enrichmentMatch?.celebration || festival?.celebration || summaryText);
      const mantraText = cleanTextForPdf(enrichmentMatch?.mantra || festival?.mantra || 'Om Namah Shivaya • Hare Rama Hare Krishna');

      // Fetch Puja Vidhi if available
      let pujaVidhiDesc = '';
      try {
        const { getFestivalPujaVidhi } = require('../data/festivalPujaVidhiData');
        const pData = getFestivalPujaVidhi(festivalName, festival);
        if (pData?.steps && pData.steps.length > 0) {
          pujaVidhiDesc = pData.steps.slice(0, 3).map((st: any) => `${st.title}: ${st.desc}`).join(' • ');
        }
      } catch {}

      const pujaVidhiText = cleanTextForPdf(
        festival?.puja_vidhi ||
        (festival?.rituals ? (Array.isArray(festival.rituals) ? festival.rituals.join('. ') : festival.rituals) : null) ||
        pujaVidhiDesc ||
        ''
      );

      let deityName = cleanTextForPdf(festival?.deity || festival?.deities || '');
      if (!deityName || deityName === 'Divine Almighty' || deityName === festivalName) {
        if (/sharad purnima|kojagiri/i.test(festivalName)) {
          deityName = 'Goddess Mahalakshmi & Chandra Devta';
        } else if (/shiv|mahadev/i.test(festivalName)) {
          deityName = 'Lord Shiva & Mata Parvati';
        } else if (/krishna|janmashtami/i.test(festivalName)) {
          deityName = 'Lord Sri Krishna';
        } else if (/durga|navratri/i.test(festivalName)) {
          deityName = 'Maa Durga';
        } else if (/ganesh/i.test(festivalName)) {
          deityName = 'Lord Ganesha (Vighnaharta)';
        } else {
          deityName = 'Divine Almighty';
        }
      }

      let mHeadVal = festival?.mantraHead;
      let mTextVal = festival?.mantraText;
      let s1Val = festival?.shloka1;
      let s2Val = festival?.shloka2;

      const cleanFest = festivalName.toLowerCase();
      const devNameUpper = cleanTextForPdf(festivalName).toUpperCase();
      const chaptersList: any[] = [];

      const isSharadPurnimaTheme = cleanFest.includes('sharad purnima') || cleanFest.includes('kojagiri');
      if (isSharadPurnimaTheme) {
        mHeadVal = '॥ माँ महालक्ष्मी वैदिक महामंत्र ॥';
        mTextVal = 'ॐ श्रीं ह्रीं क्लीं श्रीं सिद्धलक्ष्म्यै नमः';
        s1Val = 'पद्मानने पद्मविपद्मपत्रे पद्मप्रिये पद्मदलायताक्षि। विश्वप्रिये विष्णुमनोऽनुकूले त्वत्पादपद्मं मयि संनिधत्स्व॥';
        s2Val = 'नमस्ते सर्वगेवेभ्यो नमस्ते सर्वदेहिनाम्। नमस्ते विष्णुपत्नी त्वं पाहि मां भवसागरात्॥';

        chaptersList.push(
          {
            id: 1,
            title: 'पावन उत्पत्ति एवं अमृत वर्षा',
            icon: 'lotus',
            content: 'शरद पूर्णिमा (कोजागरी पूर्णिमा) आश्विन मास की शुक्ल पक्ष की पूर्णिमा को मनाई जाती है। यह वर्षा ऋतु के समापन और मनोरम शरद ऋतु के आगमन का सूचक है। मान्यता है कि इस पावन रात्रि को चंद्रमा पृथ्वी के सर्वाधिक निकट होता है और अपनी समस्त 16 कलाओं से परिपूर्ण होकर आकाश से आरोग्यवर्धक अमृत की वर्षा करता है।',
          },
          {
            id: 2,
            title: 'माँ महालक्ष्मी का भूलोक आगमन (कोजागरा)',
            icon: 'diya',
            content: 'पौराणिक मान्यता के अनुसार, शरद पूर्णिमा की मध्यरात्रि में माँ महालक्ष्मी वैकुंठ लोक से उतरकर भूलोक में विचरण करती हैं और पूछती हैं "को जागर्ति?" (कौन जाग रहा है?)। जो भक्त रात्रि जागरण कर भक्ति, ध्यान एवं भजन-कीर्तन में लीन रहते हैं, माँ लक्ष्मी उनके घर में प्रवेश कर उन्हें सुख-समृद्धि, उत्तम स्वास्थ्य और ऐश्वर्य का वरदान देती हैं।',
          },
          {
            id: 3,
            title: 'श्री राधा-कृष्ण महारास लीला',
            icon: 'star',
            content: 'श्रीमद्भागवत के अनुसार, शरद पूर्णिमा की दिव्य रात्रि को भगवान श्रीकृष्ण ने वृंदावन में यमुना पुलिन पर गोपियों के संग महारास रचाया था। बंशी की मधुर तान सुनकर सभी गोपियां खिंची चली आईं। श्रीकृष्ण ने प्रत्येक गोपी के साथ एकाकार होकर महारास लीला की, जो निष्काम ईश्वरीय प्रेम और जीव का परमात्मा में पूर्ण समर्पण का परम प्रतीक है।',
          },
          {
            id: 4,
            title: 'चांदनी में अमृतमयी खीर का प्रसाद',
            icon: 'anjali',
            content: 'शरद पूर्णिमा पर गाय के शुद्ध दूध, चावल, केसर और मेवों से खीर बनाकर रातभर खुले आकाश के नीचे चांदनी में रखी जाती है। चंद्रमा की शीतल किरणें खीर को औषधीय और अमृत तुल्य बना देती हैं। प्रातः ब्रह्म मुहूर्त में स्नान-ध्यान के पश्चात इस पावन खीर को प्रसाद रूप में ग्रहण करने से असाध्य रोगों से मुक्ति और दीर्घायु की प्राप्ति होती है।',
          },
          {
            id: 5,
            title: 'पूजा विधि, मंत्र एवं कोजागरी उत्सव',
            icon: 'flower',
            content: 'इस दिन भक्त उपवास रखते हैं, घरों को स्वच्छ कर संध्या समय घी के दीप प्रज्वलित करते हैं। रात्रि में पूर्ण चंद्रमा को अर्घ्य दिया जाता है तथा श्री सूक्त व कनकधारा स्तोत्र का पाठ किया जाता है। रात्रि जागरण, संकीर्तन और दीपदान से परिवार में सदा सुख, शांति और माँ लक्ष्मी की अनन्य कृपा बनी रहती है।',
          }
        );
      } else {
        // Break long story/origin text into multiple full paragraphs if available
        const storyChunks = originText.split(/\n\n+/).filter((s) => s.trim().length > 0);
        if (storyChunks.length > 1) {
          storyChunks.forEach((chunk, cIdx) => {
            chaptersList.push({
              id: chaptersList.length + 1,
              title: cIdx === 0 ? 'Sacred Story (Pawan Katha)' : `Divine Narrative (Part ${cIdx + 1})`,
              icon: cIdx === 0 ? 'lotus' : 'star',
              content: cleanTextForPdf(chunk),
            });
          });
        } else {
          // Check if sentences can be gracefully split into distinct rich chapters
          const rawSentences = originText.match(/[^.!?]+[.!?]+/g) || [originText];
          if (rawSentences.length >= 4) {
            const part1 = rawSentences.slice(0, Math.ceil(rawSentences.length / 2)).join(' ').trim();
            const part2 = rawSentences.slice(Math.ceil(rawSentences.length / 2)).join(' ').trim();
            chaptersList.push({
              id: 1,
              title: 'Sacred Origin & Divine Leela',
              icon: 'lotus',
              content: part1,
            });
            chaptersList.push({
              id: 2,
              title: 'Sacred Story (Pawan Katha)',
              icon: 'diya',
              content: part2,
            });
          } else {
            chaptersList.push({
              id: 1,
              title: 'Sacred Story (Pawan Katha)',
              icon: 'lotus',
              content: originText.length > 20 ? originText : `The sacred festival of ${festivalName} carries profound Vedic roots, commemorating celestial victory, supreme devotion, and timeless divine grace across generations.`,
            });
          }
        }

        // About & Divine Purpose
        chaptersList.push({
          id: chaptersList.length + 1,
          title: 'About & Divine Purpose',
          icon: 'diya',
          content: (summaryText.length > 20 ? summaryText : '') + (purposeText.length > 20 ? (summaryText.length > 20 ? ' ' : '') + purposeText : (summaryText.length > 20 ? '' : `Devotees celebrate ${festivalName} to align with righteous Dharma, eliminate ignorance and obstacles, and invite peace and harmony into their homes.`)),
        });

        // Spiritual Importance
        chaptersList.push({
          id: chaptersList.length + 1,
          title: 'Spiritual Importance & Grace',
          icon: 'star',
          content: importanceText.length > 20 ? importanceText : `Spiritual seekers and families unite in deep faith and gratitude during ${festivalName}, experiencing spiritual elevation, inner purification, and lasting divine connection.`,
        });

        // Puja Vidhi & Sacred Rituals
        chaptersList.push({
          id: chaptersList.length + 1,
          title: 'Puja Vidhi & Sacred Rituals',
          icon: 'anjali',
          content: cleanTextForPdf(
            pujaVidhiText.length > 15 ? pujaVidhiText : 'Devotees perform sacred snan, sanctify the altar, light fragrant ghee lamps, offer fresh flowers, chant Vedic stotras, offer satvik naivedya, and perform heartfelt aarti.'
          ),
        });

        // Sacred Mantra & Divine Shlokas
        chaptersList.push({
          id: chaptersList.length + 1,
          title: 'Sacred Mantra & Divine Shlokas',
          icon: 'star',
          content: cleanTextForPdf(
            mantraText.length > 10 ? mantraText : 'Om Namah Shivaya • Hare Rama Hare Krishna • Om Shreem Mahalakshmiyei Namah'
          ),
        });

        // Celebration & Traditions
        chaptersList.push({
          id: chaptersList.length + 1,
          title: 'Celebration & Timeless Traditions',
          icon: 'flower',
          content: celebrationText.length > 20 ? celebrationText : `Homes and sanctums are adorned with beautiful festive decorations, traditional delicacies are prepared, and families gather in joyous devotional unity.`,
        });
      }

      return {
        name: isSharadPurnimaTheme ? 'शरद पूर्णिमा' : festivalName,
        hindiName: isSharadPurnimaTheme ? 'शरद पूर्णिमा' : (festival?.nameHi || festival?.name_hi || devNameUpper),
        devanagariRoman: isSharadPurnimaTheme ? 'शरद पूर्णिमा' : devNameUpper,
        primaryAccent: rgb(0.85, 0.28, 0.08), // Sacred Vermilion Amber
        secondaryAccent: rgb(0.92, 0.55, 0.10), // Warm Saffron Gold
        gold: antiqueGold,
        cream: creamBg,
        charcoal: deepCharcoal,
        heroGradientTop: rgb(0.55, 0.12, 0.08),
        heroGradientBottom: rgb(0.88, 0.38, 0.10),
        date: isSharadPurnimaTheme ? 'आश्विन पूर्णिमा 2026' : (dateFromData || 'SACRED VEDIC TITHI 2026'),
        tithi: isSharadPurnimaTheme ? 'आश्विन शुक्ल पूर्णिमा • कोजागरी पावन पर्व' : (festival?.tithi || festival?.shubhMuhurat || 'AUSPICIOUS CELEBRATION'),
        greeting: isSharadPurnimaTheme
          ? 'इस पावन शरद पूर्णिमा पर आपके घर में सुख, शांति, उत्तम स्वास्थ्य एवं माँ महालक्ष्मी का आशीर्वाद सदा बना रहे।'
          : `May the auspicious divine grace of ${festivalName} illuminate your life with peace, vibrant health, prosperity, and spiritual fulfillment.`,
        deity: isSharadPurnimaTheme ? 'माँ महालक्ष्मी एवं चंद्र देव' : deityName,
        tradition: isSharadPurnimaTheme ? 'कोजागरा व्रत, अमृत खीर एवं श्री सूक्त पाठ' : (festival?.tradition || `${festivalName} Puja, Sacred Mantras & Festive Satsang`),
        subtitle: isSharadPurnimaTheme ? 'आश्विन शुक्ल पूर्णिमा • कोजागरी पावन पर्व' : `Sacred Vedic Celebration, Significance & Eternal Blessings of ${festivalName}`,
        mantraHead: mHeadVal,
        mantraText: mTextVal,
        shloka1: s1Val,
        shloka2: s2Val,
        chapters: chaptersList,
        blessing: isSharadPurnimaTheme
          ? 'धर्मो रक्षति रक्षितः — इस पावन शरद पूर्णिमा पर माँ महालक्ष्मी और भगवान श्रीकृष्ण का दिव्य आशीर्वाद आपके जीवन में सुख, शांति, समृद्धि और उत्तम स्वास्थ्य प्रदान करे।'
          : 'Dharmo Rakshati Rakshitah - Dharma protects those who protect Dharma. May the auspicious grace of this festival bring peace, prosperity, good health, and enlightenment to you and your family.',
      };
    }
  } catch (_enrichErr) {
    // Continue to standard default
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

export async function loadPdfFonts(doc: PDFDocument) {
  let fontCinzel: any = null;
  let fontRozha: any = null;
  let fontPoppins: any = null;
  let fontHimalaya: any = null;
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
      if (ROZHA_ONE_REGULAR_BASE64) {
        fontRozha = await doc.embedFont(decodeBase64ToUint8(ROZHA_ONE_REGULAR_BASE64));
      }
    } catch (_bundledRozhaErr) {
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
    }

    // 3. Poppins (Clean modern Devanagari & English sans-serif)
    try {
      if (POPPINS_REGULAR_BASE64) {
        fontPoppins = await doc.embedFont(decodeBase64ToUint8(POPPINS_REGULAR_BASE64));
      }
    } catch (_bundledPoppinsErr) {
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
    }

    // 4. Himalaya TT (Traditional Devanagari Font requested by user)
    let fontHimalaya: any = null;
    try {
      if (HIMALAYA_TT_REGULAR_BASE64) {
        fontHimalaya = await doc.embedFont(decodeBase64ToUint8(HIMALAYA_TT_REGULAR_BASE64));
      }
    } catch (_bundledHimalayaErr) {
      try {
        const himalayaAsset = Asset.fromModule(require('../../assets/fonts/HimalayaTT-Regular.ttf'));
        await himalayaAsset.downloadAsync();
        const himUri = himalayaAsset.localUri || himalayaAsset.uri;
        if (himUri) {
          const himBase64 = await FileSystem.readAsStringAsync(himUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fontHimalaya = await doc.embedFont(decodeBase64ToUint8(himBase64));
        }
      } catch (himalayaErr) {
        console.warn('[PDF] Himalaya TT font embedding fallback:', himalayaErr);
      }
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

  let shamiLeafImage: any = null;
  try {
    const leafAsset = Asset.fromModule(require('../../assets/images/festivals/shami_leaf.png'));
    await leafAsset.downloadAsync();
    const leafUri = leafAsset.localUri || leafAsset.uri;
    if (leafUri) {
      const base64 = await FileSystem.readAsStringAsync(leafUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = decodeBase64ToUint8(base64);
      shamiLeafImage = await doc.embedPng(bytes);
    }
  } catch (leafErr) {
    console.warn('[PDF] Shami leaf embedding fallback:', leafErr);
  }

  let sharadPurnimaBgImage: any = null;
  try {
    const sharadBgAsset = Asset.fromModule(require('../../assets/images/festivals/sharad_purnima_hero.jpg'));
    await sharadBgAsset.downloadAsync();
    const bgUri = sharadBgAsset.localUri || sharadBgAsset.uri;
    if (bgUri) {
      const base64 = await FileSystem.readAsStringAsync(bgUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = decodeBase64ToUint8(base64);
      sharadPurnimaBgImage = await doc.embedJpg(bytes);
    }
  } catch (sharadBgErr) {
    console.warn('[PDF] Sharad Purnima background image embedding fallback:', sharadBgErr);
  }

  return {
    fontCinzel,
    fontRozha,
    fontPoppins,
    fontHimalaya,
    fontTimes,
    fontTimesBold,
    fontTimesItalic,
    fontHelvetica,
    fontHelveticaBold,
    displayFont,
    brahmandLogo,
    shamiLeafImage,
    sharadPurnimaBgImage,
  };
}

/**
 * Resolves the hero image for any festival.
 * - For Ganesh Chaturthi: embeds local high-res ganesh_chaturthi_hero.jpg from the story page.
 * - For other festivals: embeds festival image from data or downloads from CDN.
 * - Fallback: embeds official Brahmand logo or returns null for vector medallion fallback.
 */
async function resolveFestivalHeroImage(doc: PDFDocument, theme: FestivalTheme, festival: any): Promise<any> {
  // If a specific local image module is provided (e.g. Navratri 9 days Devi images)
  const localImageMod = festival?.localImage || festival?.customHeroImage;
  if (localImageMod) {
    try {
      const modAsset = Asset.fromModule(localImageMod);
      await modAsset.downloadAsync();
      let uri = modAsset.localUri || modAsset.uri;
      if (uri) {
        if (uri.includes('.webp')) {
          try {
            const manip = await ImageManipulator.manipulateAsync(
              uri,
              [],
              { format: ImageManipulator.SaveFormat.JPEG, compress: 0.92 }
            );
            if (manip?.uri) uri = manip.uri;
          } catch (_me) {}
        }
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const bytes = decodeBase64ToUint8(b64);
        try {
          return await doc.embedJpg(bytes);
        } catch {
          return await doc.embedPng(bytes);
        }
      }
    } catch (modErr) {
      console.warn('[PDF] Error loading local image module:', modErr);
    }
  }

  const lower = (theme.name || festival?.festival_name || festival?.name || '').toLowerCase();
  const isNavratriFest = lower.includes('navratri') || lower.includes('durga') || !!festival?.dayData || !!festival?.day;

  // 1. If Ganesh Chaturthi / Vinayaka: use local high-res Ganesh image from the story page
  if (!isNavratriFest && (lower.includes('ganesh') || lower.includes('vinayaka') || lower.includes('chaturthi'))) {
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

  // 1b. If Sharad Purnima / Kojagiri: use high-res full moon night hero image
  if (lower.includes('sharad purnima') || lower.includes('kojagiri')) {
    try {
      const sharadAsset = Asset.fromModule(require('../../assets/images/festivals/sharad_purnima_hero.jpg'));
      await sharadAsset.downloadAsync();
      const uri = sharadAsset.localUri || sharadAsset.uri;
      if (uri) {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        return await doc.embedJpg(decodeBase64ToUint8(b64));
      }
    } catch (err) {
      console.warn('[PDF] Could not embed local Sharad Purnima hero:', err);
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

  const { fontCinzel, fontRozha, fontPoppins, fontHimalaya, fontTimes, fontTimesItalic, fontHelveticaBold, displayFont, brahmandLogo, shamiLeafImage, sharadPurnimaBgImage } = fonts;
  const brandFont = fontCinzel || displayFont;
  const devanagariFont = fontRozha || fontPoppins || fontHimalaya || brandFont;
  const hindiTitleFont = fontRozha || fontPoppins || fontHimalaya || brandFont;
  const hindiBodyFont = fontPoppins || fontHimalaya || fontTimes;

  const isSharadPurnimaTheme = isSharadPurnimaThemeCheck(theme.name, festival?.festival_name || festival?.name);
  const panchangInfo = await fetchFestivalPanchangInfo(festival);

  // Dynamic Royal Theme Palette (adapts to festival/day color)
  const colPeachSoft = rgb(1.0, 0.910, 0.827);     // #FFE8D3
  const colPeachDeep = rgb(0.961, 0.710, 0.541);    // #F5B58A
  const colCream = rgb(0.984, 0.953, 0.902);       // #FBF3E6

  // Primary and Secondary Sacred Accents dynamically driven by Festival / Navratri Day
  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08); // dynamic sacred primary
  const colTerracotta = theme.secondaryAccent || rgb(0.769, 0.388, 0.247); // dynamic secondary
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);    // #802E17 - deep readable terracotta
  const colRose = theme.secondaryAccent || rgb(0.851, 0.525, 0.525);
  const colSage = rgb(0.541, 0.584, 0.451);         // #8A9573
  const colSageDeep = rgb(0.20, 0.28, 0.15);       // #334726 - deep forest sage for high readability
  const colAmber = theme.gold || rgb(0.878, 0.651, 0.298);
  const colOchre = rgb(0.776, 0.541, 0.235);        // #C68A3C
  const colPlum = rgb(0.38, 0.14, 0.26);           // #612442 - deep readable royal plum

  const colInk = rgb(0.10, 0.07, 0.05);            // #1A120D - solid deep black-brown ink
  const colInkSoft = rgb(0.18, 0.13, 0.10);        // #2E211A - crisp dark readable ink

  // 1. Warm Sunrise & Festive Background / Nocturnal Full Moon Sky for Sharad Purnima
  if (isSharadPurnimaTheme && sharadPurnimaBgImage) {
    // Full bleed celestial night sky with glowing autumn moon & starry clouds
    page1.drawImage(sharadPurnimaBgImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      opacity: 0.98,
    });
  } else {
    page1.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: colCream,
    });
    // Soft bottom festive gradient bands in Day theme colors
    const bands = 25;
    for (let b = 0; b < bands; b++) {
      const fraction = b / bands;
      const bandH = (pageHeight * 0.7) / bands;
      const yPos = b * bandH;
      page1.drawRectangle({
        x: 0,
        y: yPos,
        width: pageWidth,
        height: bandH + 1,
        color: colPeachDeep,
        opacity: 0.08 * (1 - fraction),
      });
    }
  }

  // 1b. Festive Frame Borders & Motifs
  if (isSharadPurnimaTheme) {
    // Elegant minimalist gold border for nocturnal celestial sky (NO corner fans, leaves, or dandiya lines)
    page1.drawRectangle({
      x: 18,
      y: 18,
      width: pageWidth - 36,
      height: pageHeight - 36,
      borderColor: rgb(0.85, 0.70, 0.40),
      borderWidth: 0.8,
      opacity: 0.65,
    });
  } else {
    page1.drawRectangle({
      x: 10,
      y: 10,
      width: pageWidth - 20,
      height: pageHeight - 20,
      borderColor: colCrimson,
      borderWidth: 1.2,
      opacity: 0.85,
    });
    page1.drawRectangle({
      x: 14,
      y: 14,
      width: pageWidth - 28,
      height: pageHeight - 28,
      borderColor: colTerracotta,
      borderWidth: 0.6,
      opacity: 0.65,
    });

    // 1c. Festive Navratri Toran (Top Marigold & Mango Leaves Garland)
    const toranPendantCount = 13;
    const toranStep = (pageWidth - 60) / (toranPendantCount - 1);
    for (let tp = 0; tp < toranPendantCount; tp++) {
      const tX = 30 + tp * toranStep;
      const tY = pageHeight - 16;
      page1.drawEllipse({
        x: tX,
        y: tY - 6,
        xScale: 3.2,
        yScale: 7.5,
        color: tp % 2 === 0 ? colSage : colTerracotta,
        opacity: 0.85,
      });
      page1.drawCircle({
        x: tX,
        y: tY,
        size: 2.8,
        color: colAmber,
        opacity: 0.9,
      });
    }
    page1.drawLine({
      start: { x: 22, y: pageHeight - 16 },
      end: { x: pageWidth - 22, y: pageHeight - 16 },
      thickness: 0.8,
      color: colAmber,
      opacity: 0.75,
    });

    // 2. Side Ribbons & Dandiya Raas Festive Accents
    page1.drawRectangle({ x: 17, y: 440, width: 3, height: 130, color: colCrimson, opacity: 0.7 });
    page1.drawRectangle({ x: 17, y: 150, width: 3, height: 120, color: colTerracotta, opacity: 0.6 });
    page1.drawRectangle({ x: pageWidth - 20, y: 440, width: 3, height: 130, color: colTerracotta, opacity: 0.7 });
    page1.drawRectangle({ x: pageWidth - 20, y: 150, width: 3, height: 120, color: colCrimson, opacity: 0.6 });

    // 4. Corner Fans & Divine Trishul-Inspired Motifs
    const drawCornerFan = (originX: number, originY: number, dirX: number, dirY: number, strokeCol: any, fillCol: any, dotCol: any) => {
      const rList = [28, 44, 60, 76];
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
      page1.drawLine({
        start: { x: originX + dirX * 12, y: originY + dirY * 12 },
        end: { x: originX + dirX * 26, y: originY + dirY * 26 },
        thickness: 1.4,
        color: dotCol,
      });
      page1.drawCircle({
        x: originX + dirX * 20,
        y: originY + dirY * 20,
        size: 4.5,
        color: dotCol,
      });
      page1.drawCircle({
        x: originX + dirX * 20,
        y: originY + dirY * 20,
        size: 1.8,
        color: colCream,
      });
    };

    drawCornerFan(14, pageHeight - 14, 1, -1, colCrimson, colPeachDeep, colTerracotta);
    drawCornerFan(pageWidth - 14, pageHeight - 14, -1, -1, colCrimson, colPeachDeep, colTerracotta);
    drawCornerFan(14, 14, 1, 1, colTerracotta, colSage, colAmber);
    drawCornerFan(pageWidth - 14, 14, -1, 1, colTerracotta, colAmber, colCrimson);
  }

  // Sacred Shami/Apta leaf motif accents in corners (only for Dussehra / Vijayadashami)
  const isDussehraFestival = /dussehra|dasara|vijayadashami|shami/i.test(theme.name) || /shami/i.test(theme.tradition);
  if (shamiLeafImage && isDussehraFestival) {
    const leafW = 34;
    const leafH = 35;
    // Top-Left corner leaf
    page1.drawImage(shamiLeafImage, {
      x: 18,
      y: pageHeight - 18 - leafH,
      width: leafW,
      height: leafH,
      opacity: 0.92,
    });
    // Top-Right corner leaf
    page1.drawImage(shamiLeafImage, {
      x: pageWidth - 18 - leafW,
      y: pageHeight - 18 - leafH,
      width: leafW,
      height: leafH,
      opacity: 0.92,
    });
    // Bottom-Left corner leaf
    page1.drawImage(shamiLeafImage, {
      x: 18,
      y: 18,
      width: leafW,
      height: leafH,
      opacity: 0.88,
    });
    // Bottom-Right corner leaf
    page1.drawImage(shamiLeafImage, {
      x: pageWidth - 18 - leafW,
      y: 18,
      width: leafW,
      height: leafH,
      opacity: 0.88,
    });
  }

  // -------------------------------------------------------------
  // CONTENT STACK
  // -------------------------------------------------------------
  let curY = pageHeight - 48;

  // 5. BRAND HEADER (Logo + BRAHMAND in Cinzel)
  const brandName = 'B R A H M A N D';
  const brandFontSize = isSharadPurnimaTheme ? 25 : 21.5;
  const bW = brandFont.widthOfTextAtSize(brandName, brandFontSize);
  const logoDim = isSharadPurnimaTheme ? 30 : 26;
  const logoGap = 10;
  const totalHeaderW = brahmandLogo ? (logoDim + logoGap + bW) : bW;
  const headerStartX = (pageWidth - totalHeaderW) / 2;

  if (brahmandLogo) {
    page1.drawImage(brahmandLogo, {
      x: headerStartX,
      y: curY - (isSharadPurnimaTheme ? 5 : 4),
      width: logoDim,
      height: logoDim,
    });
  }

  page1.drawText(brandName, {
    x: brahmandLogo ? headerStartX + logoDim + logoGap : headerStartX,
    y: curY,
    size: brandFontSize,
    font: brandFont,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colCrimson,
  });

  curY -= (isSharadPurnimaTheme ? 22 : 18);

  const tagText = "DAILY   SANATAN   COMMUNITY";
  const tagW = fontHelveticaBold.widthOfTextAtSize(tagText, 7.5);
  const tagX = (pageWidth - tagW) / 2;

  page1.drawLine({ start: { x: tagX - 36, y: curY + 2 }, end: { x: tagX - 12, y: curY + 2 }, thickness: 0.8, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep, opacity: 0.6 });
  page1.drawText(tagText, {
    x: tagX,
    y: curY,
    size: 7.5,
    font: fontHelveticaBold,
    color: isSharadPurnimaTheme ? rgb(0.92, 0.85, 0.70) : colSageDeep,
  });
  page1.drawLine({ start: { x: tagX + tagW + 12, y: curY + 2 }, end: { x: tagX + tagW + 36, y: curY + 2 }, thickness: 0.8, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep, opacity: 0.6 });

  curY -= 20;

  // 6. HERO MANDALA WITH FESTIVAL DEITY MEDALLION
  // Omitted for Sharad Purnima so the full moon & celestial nocturnal artwork is completely unobstructed!
  if (!isSharadPurnimaTheme) {
    const mCy = 640;
    const coreR = 78;

    // Flanking Diyas (Left & Right)
    const drawDiya = (dx: number, dy: number) => {
      page1.drawCircle({ x: dx, y: dy + 11, size: 9, color: rgb(1, 0.92, 0.7), opacity: 0.6 });
      page1.drawEllipse({ x: dx, y: dy + 11, xScale: 3.2, yScale: 7.5, color: colAmber });
      page1.drawEllipse({ x: dx, y: dy + 9, xScale: 1.8, yScale: 4.5, color: rgb(1, 0.96, 0.88) });
      page1.drawEllipse({ x: dx, y: dy, xScale: 11, yScale: 5, color: colPeachDeep });
      page1.drawEllipse({ x: dx, y: dy - 1, xScale: 8.5, yScale: 2.8, color: colTerracotta });
    };
    drawDiya(cx - 118, mCy - 15);
    drawDiya(cx + 118, mCy - 15);

    // Floating stars/dots
    page1.drawCircle({ x: cx - 138, y: mCy + 30, size: 2.2, color: colPeachDeep });
    page1.drawCircle({ x: cx + 138, y: mCy + 30, size: 2.2, color: colPlum });
    page1.drawCircle({ x: cx - 92, y: mCy + 48, size: 1.8, color: colAmber });
    page1.drawCircle({ x: cx + 92, y: mCy + 48, size: 1.8, color: colRose });

    // Outer golden aura rings around deity medallion
    page1.drawCircle({
      x: cx,
      y: mCy,
      size: coreR + 4.5,
      borderColor: colAmber,
      borderWidth: 1.2,
      opacity: 0.75,
    });
    page1.drawCircle({
      x: cx,
      y: mCy,
      size: coreR + 8,
      borderColor: colPeachDeep,
      borderWidth: 0.6,
      opacity: 0.5,
    });

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

    // Set lockup starting point cleanly below the medallion
    curY = mCy - coreR - 22;
  } else {
    // Sharad Purnima: Night sky background, start lockup high and graceful so every section has breathing room
    curY = 752;
  }

  // 7. LOCKUP SECTION (Sender Kicker, Festival Title, Subtitle, Date & Auspicious Panchang Card)

  // Sender kicker: the user who is sharing this PDF, right at the start of the content
  const senderKicker = getPdfPersonalFirstName();
  if (senderKicker) {
    const kText = isSharadPurnimaTheme
      ? `स्नेह सहित — ${cleanTextForPdf(senderKicker)} की ओर से`
      : `WITH LOVE  —  FROM ${cleanTextForPdf(senderKicker)}`;
    const kFont = isSharadPurnimaTheme ? fontRozha : brandFont;
    const kSize = isSharadPurnimaTheme ? 13.0 : 11.5;
    const kW = measureTextWidth(kFont, kText, kSize);
    safeDrawText(page1, kText, {
      x: (pageWidth - kW) / 2,
      y: curY,
      size: kSize,
      font: kFont,
      fallbackFont: kFont,
      color: isSharadPurnimaTheme ? rgb(1.0, 0.90, 0.72) : colTerracottaDk,
    });
    // Generous 44pt gap ensuring title cap-height (and matras) never collide with kicker baseline
    curY -= (isSharadPurnimaTheme ? 44 : 36);
  }

  // Main Festival Title: Split words for two-tone dynamic typography
  const rawTitle = cleanTextForPdf(theme.name);
  const titleWords = rawTitle.split(/\s+/);
  let part1 = rawTitle;
  let part2 = '';
  if (titleWords.length > 1) {
    const half = Math.ceil(titleWords.length / 2);
    part1 = titleWords.slice(0, half).join(' ') + ' ';
    part2 = titleWords.slice(half).join(' ');
  }

  const titleFontSize = isSharadPurnimaTheme ? 31 : (rawTitle.length > 22 ? 22 : (rawTitle.length > 14 ? 25 : 28));
  const tFont = isSharadPurnimaTheme ? hindiTitleFont : brandFont;
  const p1W = measureTextWidth(tFont, part1, titleFontSize);
  const p2W = part2 ? measureTextWidth(tFont, part2, titleFontSize) : 0;
  const totalTW = p1W + p2W;
  const startTX = (pageWidth - totalTW) / 2;

  safeDrawText(page1, part1, {
    x: startTX,
    y: curY,
    size: titleFontSize,
    font: tFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(0.99, 0.97, 0.93) : colInk,
  });
  if (part2) {
    safeDrawText(page1, part2, {
      x: startTX + p1W,
      y: curY,
      size: titleFontSize,
      font: tFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(1.0, 0.78, 0.35) : colCrimson,
    });
  }

  // Generous 38pt gap between main title and subtitle
  curY -= (isSharadPurnimaTheme ? 38 : 30);

  // Subtitle / Occasion
  const occSub = isSharadPurnimaTheme
    ? '✦   आश्विन शुक्ल पूर्णिमा · कोजागरी पावन पर्व   ✦'
    : cleanTextForPdf(theme.subtitle || 'SANATAN DHARMA HERITAGE');
  const occFont = isSharadPurnimaTheme ? hindiBodyFont : fontTimesItalic;
  const occSize = occSub.length > 38 ? 11 : 12;
  const dSubW = measureTextWidth(occFont, occSub, occSize);
  safeDrawText(page1, occSub, {
    x: (pageWidth - dSubW) / 2,
    y: curY,
    size: occSize,
    font: occFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(0.97, 0.88, 0.68) : colTerracottaDk,
  });

  // Generous 24pt gap before the Panchang Card
  curY -= (isSharadPurnimaTheme ? 24 : 20);

  // 7b. VEDIC PANCHANG & SHUBH MUHURAT CARD - COMPREHENSIVE, BEAUTIFULLY STRUCTURED
  let row1Text = '';
  let row2Text = '';
  let row3Text = '';

  if (isSharadPurnimaTheme) {
    // Row 1: Day & Date + Sacred Tithi Name
    const dateFormatted = panchangInfo?.formattedDateHi || (festival?.date ? cleanTextForPdf(festival.date) : 'रविवार, 19 अक्टूबर 2026');
    const tithiNameFormatted = 'आश्विन शुक्ल पक्ष पूर्णिमा';
    row1Text = `दिनांक: ${dateFormatted}   ·   तिथि: ${tithiNameFormatted}`;

    // Row 2: Tithi Timings & Sacred Moonrise Kheer Timing
    const tithiEndStr = panchangInfo?.tithiEnd ? `पूर्णिमा समाप्ति: ${panchangInfo.tithiEnd}` : 'पूर्णिमा पावन तिथि';
    const moonriseStr = panchangInfo?.moonrise
      ? `खीर-रखाई: चंद्रोदय (${panchangInfo.moonrise}) उपरांत`
      : 'खीर-रखाई: चंद्रोदय उपरांत खुले आकाश तले';
    row2Text = `${tithiEndStr}   ·   ${moonriseStr}`;

    // Row 3: Important Tradition & Shubh Puja Muhurat
    if (panchangInfo?.nakshatra) {
      row3Text = `शुभ नक्षत्र: ${panchangInfo.nakshatra}   ·   कोजागरी महालक्ष्मी पूजा (निशिता काल मुहूर्त)`;
    } else {
      row3Text = 'कोजागरी महालक्ष्मी पूजा: निशिता काल (मध्यरात्रि)   ·   16 कलाओं से अमृत वर्षा';
    }
  } else {
    const festDate = panchangInfo?.formattedDateEn || cleanTextForPdf(theme.date) || 'SACRED VEDIC TITHI';
    const festTithi = cleanTextForPdf(theme.tithi) || 'AUSPICIOUS CELEBRATION';
    row1Text = `DATE: ${festDate.toUpperCase()}   ·   TITHI: ${festTithi.toUpperCase()}`;

    const subParts: string[] = [];
    if (panchangInfo?.tithiEnd) subParts.push(`TITHI ENDS: ${panchangInfo.tithiEnd}`);
    if (panchangInfo?.moonrise) subParts.push(`MOONRISE: ${panchangInfo.moonrise}`);
    if (panchangInfo?.sunrise) subParts.push(`SUNRISE: ${panchangInfo.sunrise}`);
    row2Text = subParts.length > 0 ? subParts.join('   ·   ') : 'SHUBH MUHURAT: PRADOSH KAAL & NISHITA KAAL';

    row3Text = cleanTextForPdf(theme.tradition || 'Sacred Satsang, Puja Vidhi & Auspicious Aarti');
  }

  const panCardW = Math.min(pageWidth - 64, 516);
  const panCardH = isSharadPurnimaTheme ? 90 : 80;
  const panCardX = (pageWidth - panCardW) / 2;
  const panCardY = curY - panCardH;

  // Outer container rectangle
  page1.drawRectangle({
    x: panCardX,
    y: panCardY,
    width: panCardW,
    height: panCardH,
    color: isSharadPurnimaTheme ? rgb(0.06, 0.10, 0.22) : rgb(0.94, 0.95, 0.91),
    borderColor: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.45) : colSage,
    borderWidth: 1.0,
    opacity: isSharadPurnimaTheme ? 0.90 : 0.95,
  });

  if (isSharadPurnimaTheme) {
    // Regal inner golden frame
    page1.drawRectangle({
      x: panCardX + 3.5,
      y: panCardY + 3.5,
      width: panCardW - 7,
      height: panCardH - 7,
      borderColor: rgb(0.88, 0.74, 0.45),
      borderWidth: 0.4,
      opacity: 0.35,
    });
  }

  // Header of Panchang Card
  const panHead = isSharadPurnimaTheme
    ? '✦   पावन तिथि, पंचांग एवं शुभ मुहूर्त   ✦'
    : '✦   SACRED TITHI, PANCHANG & AUSPICIOUS MUHURAT   ✦';
  const panHeadFont = isSharadPurnimaTheme ? hindiBodyFont : brandFont;
  const panHeadSize = isSharadPurnimaTheme ? 10.2 : 9.5;
  const phW = measureTextWidth(panHeadFont, panHead, panHeadSize);
  const headY = panCardY + panCardH - 18;

  safeDrawText(page1, panHead, {
    x: (pageWidth - phW) / 2,
    y: headY,
    size: panHeadSize,
    font: panHeadFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.86, 0.45) : colCrimson,
  });

  // Thin golden divider under header
  const divY = headY - 8;
  page1.drawLine({
    start: { x: panCardX + 24, y: divY },
    end: { x: panCardX + panCardW - 24, y: divY },
    thickness: 0.5,
    color: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.45) : colSage,
    opacity: 0.45,
  });

  // Row 1: Date & Tithi
  const r1Font = isSharadPurnimaTheme ? hindiBodyFont : fontHelveticaBold;
  const r1Size = isSharadPurnimaTheme ? 11.2 : 9.8;
  const r1W = measureTextWidth(r1Font, row1Text, r1Size);
  const r1Y = divY - 16;
  safeDrawText(page1, row1Text, {
    x: (pageWidth - r1W) / 2,
    y: r1Y,
    size: r1Size,
    font: r1Font,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.94, 0.78) : colSageDeep,
  });

  // Row 2: Tithi Timings & Moonrise
  const r2Font = isSharadPurnimaTheme ? hindiBodyFont : fontHelveticaBold;
  const r2Size = isSharadPurnimaTheme ? 10.0 : 8.8;
  const r2W = measureTextWidth(r2Font, row2Text, r2Size);
  const r2Y = r1Y - 17;
  safeDrawText(page1, row2Text, {
    x: (pageWidth - r2W) / 2,
    y: r2Y,
    size: r2Size,
    font: r2Font,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.48) : colTerracottaDk,
  });

  // Row 3: Important Tradition / Shubh Muhurat (Nishita Kaal Lakshmi Puja & 16 Kalas)
  if (row3Text) {
    const r3Font = isSharadPurnimaTheme ? hindiBodyFont : fontTimesItalic;
    const r3Size = isSharadPurnimaTheme ? 9.2 : 8.4;
    const r3W = measureTextWidth(r3Font, row3Text, r3Size);
    const r3Y = r2Y - 16;
    safeDrawText(page1, row3Text, {
      x: (pageWidth - r3W) / 2,
      y: r3Y,
      size: r3Size,
      font: r3Font,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.92, 0.88, 0.76) : colInk,
    });
  }

  curY = panCardY - (isSharadPurnimaTheme ? 18 : 16);

  // 8. JEWEL DIVIDER
  const jwWidth = 240;
  const jwX = (pageWidth - jwWidth) / 2;
  const jwLineCol1 = isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colPeachDeep;
  const jwLineCol2 = isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSage;
  page1.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 24, y: curY }, thickness: 0.8, color: jwLineCol1, opacity: 0.7 });
  page1.drawLine({ start: { x: cx + 24, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.8, color: jwLineCol2, opacity: 0.7 });

  page1.drawRectangle({ x: cx - 4, y: curY - 4, width: 8, height: 8, color: isSharadPurnimaTheme ? rgb(0.98, 0.76, 0.35) : colRose, rotate: degrees(45) });
  page1.drawCircle({ x: cx, y: curY, size: 2.2, color: isSharadPurnimaTheme ? rgb(1.0, 0.95, 0.80) : colAmber });
  page1.drawRectangle({ x: cx - 18 - 2, y: curY - 2, width: 4, height: 4, color: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.42) : colTerracotta, rotate: degrees(45) });
  page1.drawRectangle({ x: cx + 18 - 2, y: curY - 2, width: 4, height: 4, color: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.42) : colSageDeep, rotate: degrees(45) });

  curY -= (isSharadPurnimaTheme ? 22 : 18);

  // 9. BLESSING SECTION (Personalized blessing from Brahmand) - ULTRA READABLE & SPACIOUS
  const isNavratriFestive = /navratri|durga/i.test(theme.name) || !!festival?.dayData || !!festival?.day;
  const isGanesh = !isNavratriFestive && /ganesh|vinayaka/i.test(theme.name);
  let blessingParagraph = '';
  if (isSharadPurnimaTheme) {
    blessingParagraph =
      'प्रिय भक्त, इस पावन शरद पूर्णिमा पर आपके घर में सुख, शांति, उत्तम स्वास्थ्य एवं माँ महालक्ष्मी का पावन आशीर्वाद सदा बना रहे। चंद्रमा की शीतल अमृतमयी किरणें आपके जीवन से समस्त क्लेश, अंधकार और व्याधियों को दूर करें। आपके परिवार पर श्री राधा-कृष्ण और माँ लक्ष्मी की अनन्य कृपा निरंतर बरसती रहे।';
  } else if (isGanesh) {
    blessingParagraph =
      'Dear Friend, may this Ganesh Chaturthi arrive at your home the way Bappa always does - softly at first, then in a rush of modak, marigold and laughter, of diyas flickering on the balcony, of familiar voices humming aarti from the next room. May every door you knock on open, every worry you carry feel a little lighter, and every corner of your home find its quiet peace. And may He who clears every path walk beside your family - today, and always.';
  } else {
    const festClean = cleanTextForPdf(theme.name);
    const deityClean = cleanTextForPdf(theme.deity);
    const greetClean = cleanTextForPdf(theme.greeting);
    blessingParagraph =
      `Dear Friend, may this auspicious celebration of ${festClean} arrive at your home with divine peace, joy, and boundless prosperity. ${greetClean} May the divine grace of ${deityClean} effortlessly dissolve every obstacle from your path, filling your home with radiant warmth, good health, righteous wisdom, and timeless harmony - today, and always.`;
  }

  const bCardW = isSharadPurnimaTheme ? 516 : 490;
  const blessFontSize = isSharadPurnimaTheme ? 12.0 : 10.8;
  const blessLineHeight = isSharadPurnimaTheme ? 22.0 : 17.5;
  const bFont = isSharadPurnimaTheme ? hindiBodyFont : fontTimes;
  // Wrap with comfortable 32pt horizontal padding on left & right
  const blessLines = wrapText(blessingParagraph, bFont, blessFontSize, bCardW - 64);

  // Card Height with ample breathing room:
  // Top padding (20) + Eyebrow (12) + Divider gap (10) + text gap (16) + lines + Bottom padding (20)
  const bCardH = 46 + (blessLines.length * blessLineHeight) + 16;
  const bCardX = (pageWidth - bCardW) / 2;
  const bCardY = curY - bCardH;

  // Render Shami leaf behind the blessing card only for Dussehra / Vijayadashami
  if (shamiLeafImage && isDussehraFestival) {
    const leafCardW = Math.min(bCardW * 0.72, 300);
    const leafCardH = leafCardW * (542 / 523);
    page1.drawImage(shamiLeafImage, {
      x: cx - leafCardW / 2,
      y: bCardY + (bCardH - leafCardH) / 2,
      width: leafCardW,
      height: leafCardH,
      opacity: 0.28,
    });
  }

  // Card Outer Container
  page1.drawRectangle({
    x: bCardX,
    y: bCardY,
    width: bCardW,
    height: bCardH,
    color: isSharadPurnimaTheme ? rgb(0.05, 0.08, 0.17) : rgb(0.992, 0.965, 0.93),
    borderColor: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.42) : colPeachDeep,
    borderWidth: 1.0,
    opacity: isSharadPurnimaTheme ? 0.88 : 0.94,
  });

  // Inner decorative border for noble manuscript aesthetic
  page1.drawRectangle({
    x: bCardX + 4,
    y: bCardY + 4,
    width: bCardW - 8,
    height: bCardH - 8,
    borderColor: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.42) : colTerracotta,
    borderWidth: 0.5,
    opacity: isSharadPurnimaTheme ? 0.35 : 0.45,
  });

  // Eyebrow Header
  const blessEyebrow = isSharadPurnimaTheme ? '॥ ब्रह्मांड परिवार की ओर से मंगल पावन आशीर्वाद ॥' : 'A   BLESSING   FROM   THE   BRAHMAND   FAMILY';
  const eyebrowFont = isSharadPurnimaTheme ? hindiBodyFont : brandFont;
  const eyebrowSize = isSharadPurnimaTheme ? 10.2 : 9.5;
  const bewW = measureTextWidth(eyebrowFont, blessEyebrow, eyebrowSize);
  const eyebrowY = bCardY + bCardH - 20;

  safeDrawText(page1, blessEyebrow, {
    x: (pageWidth - bewW) / 2,
    y: eyebrowY,
    size: eyebrowSize,
    font: eyebrowFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.86, 0.42) : colCrimson,
  });

  // Delicate decorative bar below eyebrow
  const eyeDivY = eyebrowY - 10;
  const eyeDivW = 140;
  page1.drawLine({
    start: { x: cx - eyeDivW / 2, y: eyeDivY },
    end: { x: cx - 12, y: eyeDivY },
    thickness: 0.6,
    color: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.42) : colCrimson,
    opacity: 0.6,
  });
  page1.drawRectangle({
    x: cx - 2.5,
    y: eyeDivY - 2.5,
    width: 5,
    height: 5,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.86, 0.42) : colAmber,
    rotate: degrees(45),
  });
  page1.drawLine({
    start: { x: cx + 12, y: eyeDivY },
    end: { x: cx + eyeDivW / 2, y: eyeDivY },
    thickness: 0.6,
    color: isSharadPurnimaTheme ? rgb(0.88, 0.74, 0.42) : colCrimson,
    opacity: 0.6,
  });

  // Body text lines with generous leading and maximum clarity
  let blY = eyeDivY - 20;
  for (const bLine of blessLines) {
    const blW = measureTextWidth(bFont, bLine, blessFontSize);
    safeDrawText(page1, bLine, {
      x: (pageWidth - blW) / 2,
      y: blY,
      size: blessFontSize,
      font: bFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.99, 0.98, 0.96) : colInk,
    });
    blY -= blessLineHeight;
  }

  curY = bCardY - (isSharadPurnimaTheme ? 28 : 22);

  // 10. VEDIC MANTRA (KEPT, BUT NO BACKGROUND BOX BEHIND IT!)
  const isShiva = /shiv|mahadev|bholenath/i.test(theme.name) || /shiv|mahadev/i.test(theme.deity);
  const isKrishna = /krishna|janmashtami|govind/i.test(theme.name) || /krishna/i.test(theme.deity);
  const isLakshmi = /lakshmi|sharad purnima|kojagiri|dhanteras|\u0936\u0930\u0926\s*\u092a\u0942\u0930\u094d\u0923\u093f\u092e\u093e|\u0915\u094b\u091c\u093e\u0917\u0930\u0940|\u0932\u0915\u094d\u0937\u094d\u092e\u0940/i.test(theme.name) || /lakshmi|\u0932\u0915\u094d\u0937\u094d\u092e\u0940/i.test(theme.deity);
  const isDevi = isNavratriFestive || /durga|navratri|kali|lakshmi|parvati|saraswati|shailputri|brahmacharini|chandraghanta|kushmanda|skandamata|katyayani|kalaratri|mahagauri|siddhidatri/i.test(theme.name) || /devi|durga|lakshmi|parvati/i.test(theme.deity);
  const isRama = /rama|ram|diwali|deepavali/i.test(theme.name) || /rama|ram/i.test(theme.deity);

  let mHead = theme.mantraHead || festival?.mantraHead || '||   VEDIC   GANESHA   MAHA   MANTRA   ||';
  let mText = theme.mantraText || festival?.mantraText || 'OM   GAM   GANAPATAYE   NAMAHA';
  let shloka1 = theme.shloka1 || festival?.shloka1 || 'VAKRATUNDA MAHAKAYA SURYAKOTI SAMAPRABHA';
  let shloka2 = theme.shloka2 || festival?.shloka2 || 'NIRVIGHNAM KURU ME DEVA SARVAKARYESHU SARVADA';

  let shlokaMeaning = '';
  if (!theme.mantraText && !festival?.mantraText) {
    if (isLakshmi) {
      mHead = '॥ माँ महालक्ष्मी वैदिक महामंत्र ॥';
      mText = 'ॐ श्रीं ह्रीं क्लीं श्रीं सिद्धलक्ष्म्यै नमः';
      shloka1 = 'पद्मानने पद्मविपद्मपत्रे पद्मप्रिये पद्मदलायताक्षि। विश्वप्रिये विष्णुमनोऽनुकूले त्वत्पादपद्मं मयि संनिधत्स्व॥';
      shloka2 = 'नमस्ते सर्वगेवेभ्यो नमस्ते सर्वदेहिनाम्। नमस्ते विष्णुपत्नी त्वं पाहि मां भवसागरात्॥';
    } else if (isShiva) {
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
    // Plain-language meaning of the shlokas below the mantra
    shlokaMeaning = isLakshmi
      ? (isSharadPurnimaTheme
          ? 'श्लोकार्थ — हे पद्मनेत्री! हमें आपके चरणों में स्थान दें एवं भवसागर से पार लगाएँ।'
          : 'SHLOKA MEANING — O Lotus-eyed one, grant us a place at your lotus feet and carry us across the ocean of life.')
      : isShiva ? 'SHLOKA MEANING — O three-eyed Lord, conqueror of death, grant us long life and well-being.'
      : isKrishna ? 'SHLOKA MEANING — O Lord of the senses, bless us with devotion, protection and everlasting joy.'
      : isDevi ? 'SHLOKA MEANING — O Auspicious Mother, bless us with courage, welfare and victory over every trial.'
      : isRama ? 'SHLOKA MEANING — O Rama, jewel of the Raghu line, dwell graciously in our hearts.'
      : 'SHLOKA MEANING — O Vakratunda, radiant as a million suns, make all our tasks free of obstacles.';
  } else {
    shlokaMeaning = isLakshmi
      ? (isSharadPurnimaTheme
          ? 'श्लोकार्थ — हे पद्मनेत्री! हमें आपके चरणों में स्थान दें एवं भवसागर से पार लगाएँ।'
          : 'SHLOKA MEANING — O Lotus-eyed one, grant us a place at your lotus feet and carry us across the ocean of life.')
      : isShiva ? 'SHLOKA MEANING — O three-eyed Lord, conqueror of death, grant us long life and well-being.'
      : isKrishna ? 'SHLOKA MEANING — O Lord of the senses, bless us with devotion, protection and everlasting joy.'
      : isDevi ? 'SHLOKA MEANING — O Auspicious Mother, bless us with courage, welfare and victory over every trial.'
      : isRama ? 'SHLOKA MEANING — O Rama, jewel of the Raghu line, dwell graciously in our hearts.'
      : 'SHLOKA MEANING — O Vakratunda, radiant as a million suns, make all our tasks free of obstacles.';
  }

  const mantraHeadFont = isSharadPurnimaTheme ? hindiBodyFont : brandFont;
  const mantraTextFont = isSharadPurnimaTheme ? hindiTitleFont : brandFont;
  const shlokaFont = isSharadPurnimaTheme ? hindiTitleFont : fontTimes;

  const mHeadW = measureTextWidth(mantraHeadFont, mHead, 10.5);
  safeDrawText(page1, mHead, {
    x: (pageWidth - mHeadW) / 2,
    y: curY,
    size: 10.5,
    font: mantraHeadFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(0.85, 0.75, 0.55) : colSageDeep,
  });

  curY -= (isSharadPurnimaTheme ? 28 : 24);

  const mTextSize = isSharadPurnimaTheme ? 17 : 14.5;
  const mTextW = measureTextWidth(mantraTextFont, mText, mTextSize);
  safeDrawText(page1, mText, {
    x: (pageWidth - mTextW) / 2,
    y: curY,
    size: mTextSize,
    font: mantraTextFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.82, 0.35) : colCrimson,
  });

  curY -= (isSharadPurnimaTheme ? 34 : 26);

  const shlokaSize = 9.8;
  const shlokaMaxW = pageWidth - 140;

  // Shloka 1 rendered in natural top-to-bottom order
  const s1Lines = wrapText(shloka1, shlokaFont, shlokaSize, shlokaMaxW);
  for (let i = 0; i < s1Lines.length; i++) {
    const lw = measureTextWidth(shlokaFont, s1Lines[i], shlokaSize);
    safeDrawText(page1, s1Lines[i], {
      x: (pageWidth - lw) / 2,
      y: curY,
      size: shlokaSize,
      font: shlokaFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.92, 0.90, 0.86) : colInk,
    });
    curY -= (isSharadPurnimaTheme ? 17 : 14);
  }

  curY -= (isSharadPurnimaTheme ? 16 : 10);

  // Shloka 2 rendered in natural top-to-bottom order
  const s2Lines = wrapText(shloka2, shlokaFont, shlokaSize, shlokaMaxW);
  for (let i = 0; i < s2Lines.length; i++) {
    const lw = measureTextWidth(shlokaFont, s2Lines[i], shlokaSize);
    safeDrawText(page1, s2Lines[i], {
      x: (pageWidth - lw) / 2,
      y: curY,
      size: shlokaSize,
      font: shlokaFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.92, 0.90, 0.86) : colInk,
    });
    curY -= (isSharadPurnimaTheme ? 17 : 14);
  }

  // Plain-language meaning under the shlokas
  if (shlokaMeaning) {
    curY -= (isSharadPurnimaTheme ? 14 : 10);
    const meanFont = isSharadPurnimaTheme ? hindiTitleFont : fontTimesItalic;
    const meanSize = isSharadPurnimaTheme ? 9.2 : 8.8;
    const meanMaxW = pageWidth - 140;
    const meanLines = wrapText(shlokaMeaning, meanFont, meanSize, meanMaxW);
    for (let i = 0; i < meanLines.length; i++) {
      const mW = measureTextWidth(meanFont, meanLines[i], meanSize);
      safeDrawText(page1, meanLines[i], {
        x: (pageWidth - mW) / 2,
        y: curY,
        size: meanSize,
        font: meanFont,
        fallbackFont: fontPoppins,
        color: isSharadPurnimaTheme ? rgb(0.95, 0.90, 0.78) : colTerracottaDk,
      });
      curY -= (isSharadPurnimaTheme ? 15 : 12.5);
    }
  }

  // 9b. MARKETING CTA band (rendered cleanly when breathing room permits)
  const footY = 24;
  const footerLineY = footY + 38; // 62
  const ctaText = isSharadPurnimaTheme
    ? 'रोज़ का पंचांग · पावन कथा · मंदिर दर्शन — ब्राह्मण्ड ऐप पर मुफ़्त'
    : 'DAILY PANCHANG  ·  FESTIVAL KATHA  ·  TEMPLE DARSHAN  —  FREE ON BRAHMAND.APP';
  const ctaFont = isSharadPurnimaTheme ? hindiBodyFont : fontHelveticaBold;
  const ctaSize = isSharadPurnimaTheme ? 9.2 : 8.5;

  curY -= (isSharadPurnimaTheme ? 24 : 16);
  if (curY >= footerLineY + 18) {
    const ctaY = Math.max(footerLineY + 14, Math.min(curY, isSharadPurnimaTheme ? 175 : 95));
    const ctaW = measureTextWidth(ctaFont, ctaText, ctaSize);
    safeDrawText(page1, ctaText, {
      x: (pageWidth - ctaW) / 2,
      y: ctaY,
      size: ctaSize,
      font: ctaFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.99, 0.88, 0.62) : colCrimson,
    });
    const ctaLx1 = 52;
    const ctaLx2 = (pageWidth - ctaW) / 2 - 14;
    page1.drawLine({ start: { x: ctaLx1, y: ctaY + 3 }, end: { x: ctaLx2, y: ctaY + 3 }, thickness: 0.7, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSage, opacity: 0.7 });
    page1.drawLine({ start: { x: (pageWidth + ctaW) / 2 + 14, y: ctaY + 3 }, end: { x: pageWidth - 52, y: ctaY + 3 }, thickness: 0.7, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSage, opacity: 0.7 });
  }

  // 10. FOOTER (Without QR code, clean elegant balanced layout)
  page1.drawLine({
    start: { x: 38, y: footerLineY },
    end: { x: pageWidth - 38, y: footerLineY },
    thickness: 0.8,
    color: colPeachDeep,
    opacity: 0.85,
  });

  const fLogoDim = 16;
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
    size: 12.5,
    font: brandFont,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colCrimson,
  });

  page1.drawText('Discover more on Brahmand  *  https://brahmand.app', {
    x: 44,
    y: footY + 2,
    size: 7.8,
    font: fontTimesItalic,
    color: isSharadPurnimaTheme ? rgb(0.88, 0.84, 0.76) : colInkSoft,
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

  // Sender's own name (the user sharing this PDF) in the sign-off
  const senderName = getPdfPersonalFirstName();
  const pageText = senderName
    ? `SHARED WITH LOVE BY ${cleanTextForPdf(senderName).toUpperCase()}  *  VIA BRAHMAND APP`
    : 'SHARED WITH LOVE VIA BRAHMAND APP';
  const ptW = fontHelveticaBold.widthOfTextAtSize(pageText, 7.8);
  page1.drawText(pageText, {
    x: pageWidth - 44 - ptW,
    y: footY + 16,
    size: 7.8,
    font: fontHelveticaBold,
    color: isSharadPurnimaTheme ? rgb(0.92, 0.85, 0.70) : colSageDeep,
  });

  const subPageText = totalPages && totalPages > 1 ? `PAGE ${pageNumber || 1} OF ${totalPages}` : 'SANATAN DHARMA HERITAGE';
  const sptW = fontHelveticaBold.widthOfTextAtSize(subPageText, 8.2);
  page1.drawText(subPageText, {
    x: pageWidth - 44 - sptW,
    y: footY + 2,
    size: 8.2,
    font: fontHelveticaBold,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colCrimson,
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
 * Draws the illuminated parchment background, floral toran, and corner motifs on any narrative page.
 */
function drawPageParchmentFrame(
  page: any,
  pageWidth: number,
  pageHeight: number,
  theme: FestivalTheme,
  fonts: any
) {
  const isSharad = isSharadPurnimaThemeCheck(theme.name);
  if (isSharad && fonts.sharadPurnimaBgImage) {
    // Same celestial night sky as page 1
    page.drawImage(fonts.sharadPurnimaBgImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      opacity: 0.98,
    });
    page.drawRectangle({
      x: 18,
      y: 18,
      width: pageWidth - 36,
      height: pageHeight - 36,
      borderColor: rgb(0.85, 0.70, 0.40),
      borderWidth: 0.8,
      opacity: 0.65,
    });
  } else {
    // Same warm cream + festive gradient as page 1 for non-Sharad festivals
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.984, 0.953, 0.902),
    });
    const bands = 25;
    for (let b = 0; b < bands; b++) {
      const fraction = b / bands;
      const bandH = (pageHeight * 0.7) / bands;
      page.drawRectangle({
        x: 0,
        y: b * bandH,
        width: pageWidth,
        height: bandH + 1,
        color: rgb(0.961, 0.710, 0.541),
        opacity: 0.08 * (1 - fraction),
      });
    }
    page.drawRectangle({
      x: 10,
      y: 10,
      width: pageWidth - 20,
      height: pageHeight - 20,
      borderColor: theme.primaryAccent || rgb(0.56, 0.11, 0.08),
      borderWidth: 1.2,
      opacity: 0.85,
    });
    page.drawRectangle({
      x: 14,
      y: 14,
      width: pageWidth - 28,
      height: pageHeight - 28,
      borderColor: theme.secondaryAccent || rgb(0.769, 0.388, 0.247),
      borderWidth: 0.6,
      opacity: 0.65,
    });
  }
}

/**
 * Draws the brand top header banner on narrative pages.
 */
function drawPageBrandHeader(
  page: any,
  pageWidth: number,
  pageHeight: number,
  theme: FestivalTheme,
  fonts: any,
  isFirstNarrativePage: boolean,
  customTitle?: string
): number {
  const { fontCinzel, fontRozha, fontPoppins, fontHimalaya, displayFont, fontHelveticaBold, fontTimesItalic, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;
  const devanagariFont = fontRozha || fontPoppins || fontHimalaya || brandFont;
  const hindiTitleFont = fontRozha || fontPoppins || fontHimalaya || brandFont;
  const hindiBodyFont = fontPoppins || fontHimalaya || fontTimesItalic;

  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08);
  const colSageDeep = rgb(0.20, 0.28, 0.15);
  const colTerracotta = theme.secondaryAccent || rgb(0.769, 0.388, 0.247);
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);
  const colPeachDeep = rgb(0.961, 0.710, 0.541);
  const colRose = theme.secondaryAccent || rgb(0.851, 0.525, 0.525);
  const colSage = rgb(0.541, 0.584, 0.451);
  const colInk = rgb(0.10, 0.07, 0.05);
  const isSharadPurnimaTheme = isSharadPurnimaThemeCheck(theme.name);
  const cx = pageWidth / 2;

  let curY = pageHeight - 55;
  const brandName = 'B R A H M A N D';
  const brandFontSize = isSharadPurnimaTheme ? 32 : 21.5;
  const bW = measureTextWidth(brandFont, brandName, brandFontSize);
  const logoDim = isSharadPurnimaTheme ? 40 : 27.5;
  const logoGap = isSharadPurnimaTheme ? 12 : 10;
  const totalHeaderW = brahmandLogo ? (logoDim + logoGap + bW) : bW;
  const headerStartX = (pageWidth - totalHeaderW) / 2;

  if (brahmandLogo) {
    page.drawImage(brahmandLogo, {
      x: headerStartX,
      y: curY - (isSharadPurnimaTheme ? 6 : 4),
      width: logoDim,
      height: logoDim,
    });
  }

  safeDrawText(page, brandName, {
    x: brahmandLogo ? headerStartX + logoDim + logoGap : headerStartX,
    y: curY,
    size: brandFontSize,
    font: brandFont,
    fallbackFont: hindiBodyFont,
    color: isSharadPurnimaTheme ? rgb(0.92, 0.82, 0.65) : colCrimson,
  });

  curY -= (isSharadPurnimaTheme ? 27 : 21);

  const tagText = "DAILY   SANATAN   COMMUNITY";
  const tagW = measureTextWidth(fontHelveticaBold, tagText, 7.5);
  const tagX = (pageWidth - tagW) / 2;

  page.drawLine({ start: { x: tagX - 36, y: curY + 2 }, end: { x: tagX - 12, y: curY + 2 }, thickness: 0.8, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep, opacity: 0.6 });
  safeDrawText(page, tagText, {
    x: tagX,
    y: curY,
    size: 7.5,
    font: fontHelveticaBold,
    fallbackFont: hindiBodyFont,
    color: isSharadPurnimaTheme ? rgb(0.98, 0.88, 0.68) : colSageDeep,
  });
  page.drawLine({ start: { x: tagX + tagW + 12, y: curY + 2 }, end: { x: tagX + tagW + 36, y: curY + 2 }, thickness: 0.8, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep, opacity: 0.6 });

  if (isFirstNarrativePage) {
    const festClean = cleanTextForPdf(theme.name);
    const t1 = isSharadPurnimaTheme ? 'शरद पूर्णिमा ' : `${festClean.toUpperCase()} `;
    const t2 = isSharadPurnimaTheme ? 'पावन कथा' : 'KATHA & GUIDE';
    const tSize = isSharadPurnimaTheme ? 28 : (festClean.length > 18 ? 16.5 : 19);
    // Clear the tagline descenders/ascenders before drawing the big title (was overlapping it)
    curY -= (tSize * 0.85 + 12);
    const headFont = (isSharadPurnimaTheme || hasDevanagariChar(t1) || hasDevanagariChar(t2)) ? hindiTitleFont : brandFont;
    const t1W = measureTextWidth(headFont, t1, tSize);
    const t2W = measureTextWidth(headFont, t2, tSize);
    const totTW = t1W + t2W;
    const sTX = (pageWidth - totTW) / 2;

    safeDrawText(page, t1, {
      x: sTX,
      y: curY,
      size: tSize,
      font: headFont,
      fallbackFont: hindiTitleFont,
      color: isSharadPurnimaTheme ? rgb(0.98, 0.96, 0.92) : colInk,
    });
    safeDrawText(page, t2, {
      x: sTX + t1W,
      y: curY,
      size: tSize,
      font: headFont,
      fallbackFont: hindiTitleFont,
      color: isSharadPurnimaTheme ? rgb(0.98, 0.76, 0.35) : colCrimson,
    });

    curY -= (isSharadPurnimaTheme ? 19 : 17);

    const storySub = cleanTextForPdf(theme.subtitle || 'Sanatan Dharma Heritage & Complete Celebration Guide');
    const subFont = (isSharadPurnimaTheme || hasDevanagariChar(storySub)) ? hindiBodyFont : fontTimesItalic;
    const ssW = measureTextWidth(subFont, storySub, 9.5);
    safeDrawText(page, storySub, {
      x: (pageWidth - ssW) / 2,
      y: curY,
      size: 9.5,
      font: subFont,
      fallbackFont: hindiBodyFont,
      color: isSharadPurnimaTheme ? rgb(0.98, 0.87, 0.66) : colTerracottaDk,
    });

    curY -= 16;

    const jwWidth = 240;
    const jwX = (pageWidth - jwWidth) / 2;
    page.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 22, y: curY }, thickness: 0.8, color: colPeachDeep, opacity: 0.85 });
    page.drawLine({ start: { x: cx + 22, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.8, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSage, opacity: 0.85 });
    page.drawRectangle({ x: cx - 3.5, y: curY - 3.5, width: 7, height: 7, color: colTerracotta, rotate: degrees(45) });
    page.drawRectangle({ x: cx - 16 - 2, y: curY - 2, width: 4, height: 4, color: colRose, rotate: degrees(45) });
    page.drawRectangle({ x: cx + 16 - 2, y: curY - 2, width: 4, height: 4, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep, rotate: degrees(45) });

    curY -= 16;
  } else {
    // Secondary page elegant subtle header divider
    curY -= 18;
    const festClean = cleanTextForPdf(theme.name);
    const t1 = customTitle || (isSharadPurnimaTheme ? `${festClean} — शेष कथा` : `${festClean.toUpperCase()} — CONTINUED`);
    const secFont = (isSharadPurnimaTheme || hasDevanagariChar(t1)) ? (fontRozha || hindiTitleFont) : brandFont;
    const tW = measureTextWidth(secFont, t1, 10.5);
    safeDrawText(page, t1, {
      x: (pageWidth - tW) / 2,
      y: curY,
      size: 10.5,
      font: secFont,
      fallbackFont: hindiTitleFont,
      color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colTerracottaDk,
    });
    curY -= 12;

    const jwWidth = 180;
    const jwX = (pageWidth - jwWidth) / 2;
    page.drawLine({ start: { x: jwX, y: curY }, end: { x: cx - 16, y: curY }, thickness: 0.6, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colPeachDeep, opacity: 0.7 });
    page.drawLine({ start: { x: cx + 16, y: curY }, end: { x: jwX + jwWidth, y: curY }, thickness: 0.6, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colPeachDeep, opacity: 0.7 });
    page.drawCircle({ x: cx, y: curY, size: 2, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep });
    curY -= 15;
  }

  return curY;
}

/**
 * Draws the high-converting marketing card and app download QR code on the final narrative page.
 */
function drawMarketingCardOnPage(
  doc: PDFDocument,
  page: any,
  pageWidth: number,
  theme: FestivalTheme,
  fonts: any,
  pMargin: number,
  overrideCardY?: number,
  qrAnchorY?: number
) {
  const { fontCinzel, fontPoppins, fontHimalaya, fontTimesItalic, fontHelvetica, fontHelveticaBold, displayFont, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;
  const textFont = fontPoppins || fontHimalaya || fontHelvetica;

  const isSharadPurnimaTheme = isSharadPurnimaThemeCheck(theme.name);
  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08);
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);
  const colHead = isSharadPurnimaTheme ? rgb(1.0, 0.86, 0.45) : colCrimson;
  const colSub = isSharadPurnimaTheme ? rgb(0.95, 0.88, 0.70) : colTerracottaDk;

  // Center-aligned marketing & download block without any heavy background boxes
  const baseY = overrideCardY !== undefined ? overrideCardY : 110;

  // 1. BRAND HEADER (Centered)
  const eyebrowText = 'BRAHMAND APP';
  const ebW = measureTextWidth(brandFont, eyebrowText, 11.5);
  safeDrawText(page, eyebrowText, {
    x: (pageWidth - ebW) / 2,
    y: baseY + 144,
    size: 11.5,
    font: brandFont,
    fallbackFont: fontPoppins,
    color: colHead,
  });

  // 2. TAGLINE (Centered)
  const taglineText = isSharadPurnimaTheme
    ? 'दैनिक पंचांग  ·  सम्पूर्ण पावन कथाएं  ·  लाइव जाप'
    : 'Daily Vedic Panchang  ·  Sacred Katha Library  ·  Live Jaap';
  const tagFont = fontPoppins || textFont;
  const tagW = measureTextWidth(tagFont, taglineText, 8.8);
  safeDrawText(page, taglineText, {
    x: (pageWidth - tagW) / 2,
    y: baseY + 128,
    size: 8.8,
    font: tagFont,
    fallbackFont: fontPoppins,
    color: colSub,
  });

  // 3. CENTERED QR CODE (No background box / container border behind QR)
  const qrSize = 78;
  const qrBoxX = (pageWidth - qrSize) / 2;
  const qrBoxY = baseY + 36;

  const referralQrUrl = getTrackedBrahmandUrl(theme.name, 'pdf_qr_scan');
  drawQrCodeMatrix(
    page,
    referralQrUrl,
    qrBoxX,
    qrBoxY,
    qrSize,
    rgb(0.08, 0.08, 0.08),
    isSharadPurnimaTheme ? rgb(0.99, 0.985, 0.95) : rgb(1, 1, 1),
    brahmandLogo
  );

  // 4. SCAN CAPTION (Centered)
  const qrCaption = isSharadPurnimaTheme
    ? '॥ फोन कैमरे से स्कैन करें एवं निःशुल्क डाउनलोड करें ॥'
    : 'Scan with Phone Camera to Download Free';
  const cFont = fontPoppins || brandFont;
  const capW = measureTextWidth(cFont, qrCaption, 8.4);
  safeDrawText(page, qrCaption, {
    x: (pageWidth - capW) / 2,
    y: qrBoxY - 14,
    size: 8.4,
    font: cFont,
    fallbackFont: fontPoppins,
    color: colHead,
  });

  // 5. OFFICIAL STORE BADGES (Centered Row)
  const storeRowY = qrBoxY - 33;
  const playScale = 0.40;
  const playIconW = 24 * playScale;
  const playTextW = fontHelveticaBold.widthOfTextAtSize('Google Play', 8.5);
  const playBtnW = playIconW + 5 + playTextW;

  const appleScale = 0.40;
  const appleIconW = 24 * appleScale;
  const appleTextW = fontHelveticaBold.widthOfTextAtSize('App Store', 8.5);
  const appleBtnW = appleIconW + 5 + appleTextW;

  const storeGap = 20;
  const totalStoreRowW = playBtnW + storeGap + appleBtnW;
  const storeStartX = (pageWidth - totalStoreRowW) / 2;

  // Google Play
  const playIconPaths = [
    { p: 'M 3.25 2.14 C 2.87 2.53 2.65 3.14 2.65 3.94 L 2.65 20.06 C 2.65 20.86 2.87 21.47 3.25 21.86 L 3.32 21.93 L 12.44 12.81 L 12.44 12.38 L 12.44 12.38 L 3.32 3.26 Z', c: rgb(0.25, 0.63, 0.96) },
    { p: 'M 15.48 15.85 L 12.44 12.81 L 12.44 12.38 L 15.48 9.34 L 15.56 9.38 L 19.16 11.43 C 20.19 12.01 20.19 12.97 19.16 13.55 L 15.56 15.60 Z', c: rgb(1.0, 0.79, 0.0) },
    { p: 'M 15.56 15.60 L 12.44 12.48 L 3.25 21.86 C 3.59 22.22 4.15 22.27 4.80 21.90 L 15.56 15.60', c: rgb(0.92, 0.26, 0.21) },
    { p: 'M 15.56 9.38 L 4.80 3.28 C 4.15 2.91 3.59 2.96 3.25 3.32 L 12.44 12.51 Z', c: rgb(0.18, 0.73, 0.42) },
  ];
  for (const seg of playIconPaths) {
    page.drawSvgPath(seg.p, { x: storeStartX, y: storeRowY + 7, scale: playScale, color: seg.c });
  }
  page.drawText('Google Play', {
    x: storeStartX + playIconW + 5,
    y: storeRowY,
    size: 8.5,
    font: fontHelveticaBold,
    color: isSharadPurnimaTheme ? rgb(0.95, 0.92, 0.85) : rgb(0.10, 0.07, 0.05),
  });

  // App Store
  const appleStartX = storeStartX + playBtnW + storeGap;
  const appleGlyphPath =
    'M 18.71 19.5 C 17.88 20.74 17.00 21.93 15.66 21.97 C 14.32 22.01 13.88 21.20 12.37 21.20 C 10.84 21.20 10.37 21.93 9.09 21.97 C 7.79 22.01 6.80 20.69 5.96 19.47 C 4.25 17.00 2.94 12.48 4.70 9.42 C 5.57 7.91 7.13 6.95 8.82 6.93 C 10.10 6.91 11.31 7.79 12.10 7.79 C 12.87 7.79 14.33 6.72 15.89 6.89 C 16.55 6.92 18.39 7.15 19.56 8.87 C 19.46 8.93 17.37 10.15 17.39 12.63 C 17.42 15.60 20.00 16.59 20.03 16.60 C 20.00 16.70 19.61 18.06 18.71 19.5 Z M 14.97 4.57 C 15.65 3.75 16.11 2.61 15.98 1.46 C 14.99 1.50 13.79 2.12 13.08 2.95 C 12.45 3.68 11.90 4.85 12.05 5.97 C 13.16 6.06 14.29 5.39 14.97 4.57 Z';
  page.drawSvgPath(appleGlyphPath, {
    x: appleStartX,
    y: storeRowY + 7,
    scale: appleScale,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : rgb(0.10, 0.07, 0.05),
  });
  page.drawText('App Store', {
    x: appleStartX + appleIconW + 5,
    y: storeRowY,
    size: 8.5,
    font: fontHelveticaBold,
    color: isSharadPurnimaTheme ? rgb(0.95, 0.92, 0.85) : rgb(0.10, 0.07, 0.05),
  });

  // 6. SUB-CAPTION (Centered)
  const storeSubLabel = isSharadPurnimaTheme
    ? 'Google Play एवं App Store पर निःशुल्क उपलब्ध'
    : 'Available Free on Google Play & App Store';
  const subFont = fontPoppins || fontHelveticaBold;
  const subW = measureTextWidth(subFont, storeSubLabel, 7.8);
  safeDrawText(page, storeSubLabel, {
    x: (pageWidth - subW) / 2,
    y: storeRowY - 14,
    size: 7.8,
    font: subFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(0.88, 0.82, 0.70) : colTerracottaDk,
  });

  // Clickable link annotations
  const playStoreUri = 'https://play.google.com/store/apps/details?id=com.brahmand.app';
  const appStoreUri = 'https://apps.apple.com/in/app/brahmand-app/id6765467224';

  addClickableLink(doc, page, playStoreUri, [
    storeStartX - 6,
    storeRowY - 8,
    storeStartX + playBtnW + 6,
    storeRowY + 20,
  ]);
  addClickableLink(doc, page, appStoreUri, [
    appleStartX - 6,
    storeRowY - 8,
    appleStartX + appleBtnW + 6,
    storeRowY + 20,
  ]);
  addClickableLink(doc, page, referralQrUrl, [
    qrBoxX,
    qrBoxY - 16,
    qrBoxX + qrSize,
    qrBoxY + qrSize,
  ]);
}

/**
 * Renders the dedicated Page 3: About & Spiritual Importance, Sacred Rituals, Interactive Quiz & Community Poll,
 * followed by the Brahmand download QR card.
 */
async function renderFestivalGuideAndQuizPage(
  doc: PDFDocument,
  theme: FestivalTheme,
  fonts: any,
  festival: any,
  pageNum: number,
  totalPages: number
) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const pMargin = 38;
  const contentWidth = pageWidth - pMargin * 2;
  const cx = pageWidth / 2;

  const page = doc.addPage([pageWidth, pageHeight]);
  drawPageParchmentFrame(page, pageWidth, pageHeight, theme, fonts);

  const isSharadPurnimaTheme = isSharadPurnimaThemeCheck(theme.name);

  const { fontCinzel, fontRozha, fontPoppins, fontHimalaya, fontTimes, fontTimesItalic, fontHelvetica, fontHelveticaBold, displayFont } = fonts;
  const brandFont = fontCinzel || displayFont;
  const pageHeadFont = isSharadPurnimaTheme ? (fontRozha || fontPoppins || fontHimalaya || brandFont) : brandFont;
  const pageSubFont = isSharadPurnimaTheme ? (fontRozha || fontPoppins || fontHimalaya || brandFont) : fontHelveticaBold;
  const bodyTextFont = isSharadPurnimaTheme ? (fontPoppins || fontHimalaya || fontTimes) : fontTimes;
  const bodyBoldFont = isSharadPurnimaTheme ? (fontPoppins || fontHimalaya || fontHelveticaBold) : fontHelveticaBold;

  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08);
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);
  const colPeachDeep = rgb(0.961, 0.710, 0.541);
  const colSageDeep = rgb(0.20, 0.28, 0.15);
  const colInk = rgb(0.10, 0.07, 0.05);
  const colAmber = theme.gold || rgb(0.85, 0.70, 0.40);
  // Readable palette over the Sharad night-sky background (cards keep their light fills + dark text)
  const colHead = isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colCrimson;
  const colSub = isSharadPurnimaTheme ? rgb(0.98, 0.87, 0.64) : colTerracottaDk;
  const colBody = isSharadPurnimaTheme ? rgb(0.95, 0.92, 0.86) : colInk;
  const colSep = isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colPeachDeep;

  const festClean = cleanTextForPdf(theme.name);
  const page3HeaderTitle = isSharadPurnimaTheme
    ? 'शरद पूर्णिमा — परिचय, तिथि एवं पूजा विधि'
    : `${festClean.toUpperCase()} — ABOUT & SACRED RITUALS`;
  let curY = drawPageBrandHeader(page, pageWidth, pageHeight, theme, fonts, false, page3HeaderTitle);

  // 1. Fetch full About content and enrichment data
  let rawAboutText = '';
  let rawImportanceText = '';
  let dykFallback = '';
  let ritualsList: { title: string; desc: string }[] = [];

  try {
    const festivalEnrichments = require('../data/festival-enrichments').default;
    // ponytail: Devanagari theme names strip to '' — match on the latin festival name first
    const matchName = String(festival?.festival_name || festival?.name || theme.name || '').toLowerCase();
    const cleanLower = matchName.replace(/[^a-z0-9\s]/g, ' ').trim();
    let enrichmentMatch: any = null;
    if (festivalEnrichments && cleanLower) {
      for (const [key, val] of Object.entries(festivalEnrichments)) {
        const k = key.toLowerCase();
        if (cleanLower === k || cleanLower.includes(k) || k.includes(cleanLower)) {
          enrichmentMatch = val;
          break;
        }
      }
    }
    if (enrichmentMatch) {
      rawAboutText = cleanTextForPdf(enrichmentMatch.summary || enrichmentMatch.origin || '');
      rawImportanceText = cleanTextForPdf(enrichmentMatch.importance || enrichmentMatch.purpose || '');
      const dykSrc = String(enrichmentMatch.origin || enrichmentMatch.purpose || '');
      const firstSentence = dykSrc.split(/(?<=[.!?])\s/)[0] || '';
      if (firstSentence.length > 30) dykFallback = cleanTextForPdf(firstSentence);
    }
  } catch (_e) {}

  if (!rawAboutText) {
    rawAboutText = isSharadPurnimaTheme
      ? 'शरद पूर्णिमा सनातन परंपरा का अत्यंत पावन पर्व है। इस रात्रि चंद्रमा पृथ्वी के सर्वाधिक निकट आकर अपनी 16 कलाओं से अमृत वर्षा करता है। भक्त रात्रि जागरण कर माँ लक्ष्मी और चंद्र देव की आराधना करते हैं तथा चांदनी में रखी अमृतमयी खीर का प्रसाद ग्रहण करते हैं।'
      : cleanTextForPdf(
          festival?.summary ||
          festival?.description ||
          `Sharad Purnima, also known as Kojagiri Purnima, is celebrated on the full moon day in the month of Ashwin.`
        );
  }

  if (!rawImportanceText) {
    rawImportanceText = isSharadPurnimaTheme
      ? 'मान्यता है कि इस रात्रि माँ महालक्ष्मी भूलोक में विचरण कर पूछती हैं "को जागर्ति?" (कौन जाग रहा है?)। जागरण और ध्यान में लीन रहने वाले भक्तों को माँ धन, धान्य और दीर्घायु का वरदान देती हैं।'
      : cleanTextForPdf(
          festival?.importance ||
          festival?.purpose ||
          `According to sacred legend, Goddess Mahalakshmi descends to earth asking 'Ko Jagarti?'.`
        );
  }

  const introText = rawAboutText || (isSharadPurnimaTheme
    ? 'शरद पूर्णिमा सनातन परंपरा का अत्यंत पावन पर्व है। इस रात्रि चंद्रमा पृथ्वी के सर्वाधिक निकट आकर अपनी सोलह कलाओं से अमृत की वर्षा करता है।'
    : 'Sharad Purnima, also known as Kojagiri Purnima, is celebrated on the full moon day in the month of Ashwin.');

  const spiritualMeaningText = rawImportanceText || (isSharadPurnimaTheme
    ? 'यह पावन रात्रि आत्मिक शुद्धि, भक्ति साधना और सकारात्मक ऊर्जा का संचार करने का सर्वोत्तम अवसर है।'
    : cleanTextForPdf(festival?.purpose || 'According to sacred legend, Goddess Mahalakshmi descends asking Ko Jagarti?'));

  const highlights = isSharadPurnimaTheme
    ? [
        '१. चंद्रमा की शीतल किरणें अमृत बरसाती हैं, जिससे स्वास्थ्य एवं तेज की वृद्धि होती है।',
        '२. माँ महालक्ष्मी जागरण करने वाले भक्तों को सुख-समृद्धि एवं शांति प्रदान करती हैं।',
        '३. चांदनी में रखी खीर दिव्य औषधि और पावन महाप्रसाद बन जाती है।'
      ]
    : [
        `Celestial Full Moon radiates all 16 divine kalas, showering curative Amrit on earth.`,
        `Goddess Mahalakshmi descends to bless vigilant seekers with prosperity and peace.`,
        `Sweet rice Kheer kept under moonlight absorbs divine nectar for health and longevity.`
      ];

  const didYouKnowText = isSharadPurnimaTheme
    ? 'शरद पूर्णिमा की पावन रात्रि को ही भगवान श्रीकृष्ण ने वृंदावन में यमुना तट पर महारास रचाया था।'
    : dykFallback || `According to sacred tradition, this festival day radiates special divine energy for all devotees.`;

  // Rituals for Sharad Purnima or other festivals
  if (isSharadPurnimaTheme) {
    ritualsList = [
      {
        title: 'चांदनी में अमृत खीर',
        desc: 'गाय के शुद्ध दूध, चावल व मेवों से खीर बनाएं और रातभर खुले आकाश में चांदनी में रखें।',
      },
      {
        title: 'कोजागरा व्रत एवं रात्रि जागरण',
        desc: 'घी के दीपक जलाएं, उपवास रखें और "ॐ श्रीं महालक्ष्म्यै नमः" का जाप कर जागरण करें।',
      },
      {
        title: 'चंद्र अर्घ्य एवं स्तोत्र पाठ',
        desc: 'पूर्ण चंद्रमा को जल का अर्घ्य दें तथा श्री सूक्त, कनकधारा व लक्ष्मी स्तोत्र का पाठ करें।',
      },
    ];
  } else {
    ritualsList = [
      {
        title: 'Brahma Muhurta Snan & Altar Sanctification',
        desc: 'Begin early with sacred purification, cleanse the altar, light a ghee lamp, and place fragrant fresh flowers before the deity.',
      },
      {
        title: 'Vedic Chanting & Satvik Naivedya',
        desc: 'Chant sacred mantras with devotion, recite divine katha, and offer homemade satvik prasad, fruits, and sweets.',
      },
      {
        title: 'Heartfelt Aarti & Community Seva',
        desc: 'Perform grand aarti with family, share prasad with neighbors, and participate in charity, cow seva, or temple service.',
      },
    ];
  }

  // --- SECTION 1: ABOUT FESTIVAL (COMPLETE GUIDE) ---
  const sec1Heading = isSharadPurnimaTheme ? 'पर्व परिचय एवं आध्यात्मिक महत्व' : 'ABOUT FESTIVAL & SPIRITUAL ESSENCE';
  safeDrawText(page, sec1Heading, {
    x: pMargin,
    y: curY,
    size: 10.8,
    font: pageSubFont,
    fallbackFont: fontPoppins,
    color: colHead,
  });
  curY -= 17;

  // Introduction text with comfortable leading & generous breathing room
  const introLines = wrapText(introText, bodyTextFont, 9.2, contentWidth);
  for (const iLine of introLines.slice(0, 3)) {
    safeDrawText(page, iLine, {
      x: pMargin,
      y: curY,
      size: 9.2,
      font: bodyTextFont,
      fallbackFont: fontPoppins,
      color: colBody,
    });
    curY -= 13.5;
  }
  curY -= 10;

  // Key Highlights (3 bullets)
  const hlTitle = isSharadPurnimaTheme ? 'मुख्य विशेषताएं एवं महत्व:' : 'KEY HIGHLIGHTS & SPIRITUAL ESSENCE:';
  safeDrawText(page, hlTitle, {
    x: pMargin,
    y: curY,
    size: 8.8,
    font: bodyBoldFont,
    fallbackFont: fontPoppins,
    color: colSub,
  });
  curY -= 14;

  for (const hl of highlights) {
    page.drawCircle({ x: pMargin + 4, y: curY + 2.5, size: 2.2, color: colHead });
    const hlLines = wrapText(hl, bodyTextFont, 8.6, contentWidth - 14);
    for (const hLine of hlLines.slice(0, 1)) {
      safeDrawText(page, hLine, {
        x: pMargin + 12,
        y: curY,
        size: 8.6,
        font: bodyTextFont,
        fallbackFont: fontPoppins,
        color: colBody,
      });
      curY -= 13.5;
    }
  }
  curY -= 10;

  // Did You Know box with theme-aware styling & comfortable padding
  const dykPrefix = isSharadPurnimaTheme ? 'क्या आप जानते हैं? ' : 'Did You Know? ';
  const dykFull = `${dykPrefix}${didYouKnowText}`;
  const dykLines = wrapText(dykFull, bodyTextFont, 8.4, contentWidth - 18);
  const dykBoxH = 18 + Math.min(dykLines.length, 2) * 11.0;
  page.drawRectangle({
    x: pMargin,
    y: curY - dykBoxH + 4,
    width: contentWidth,
    height: dykBoxH,
    color: isSharadPurnimaTheme ? rgb(0.07, 0.11, 0.23) : rgb(0.995, 0.985, 0.96),
    borderColor: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colAmber,
    borderWidth: 0.6,
  });
  dykLines.slice(0, 2).forEach((ln, i) => {
    safeDrawText(page, ln, {
      x: pMargin + 9,
      y: curY - 7 - i * 11.0,
      size: 8.4,
      font: bodyTextFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.98, 0.88, 0.68) : colTerracottaDk,
    });
  });
  curY -= (dykBoxH + 20);

  // --- SECTION 2: SACRED RITUALS & PUJA VIDHI ---
  const sec2Heading = isSharadPurnimaTheme ? 'पावन पूजा विधि एवं परंपरा' : 'SACRED RITUALS & CELEBRATION VIDHI';
  safeDrawText(page, sec2Heading, {
    x: pMargin,
    y: curY,
    size: 10.5,
    font: pageSubFont,
    fallbackFont: fontPoppins,
    color: colHead,
  });
  curY -= 16;

  for (let rIdx = 0; rIdx < ritualsList.length; rIdx++) {
    const r = ritualsList[rIdx];
    const badgeNum = `${rIdx + 1}`;
    const badgeRadius = 7.0;
    const badgeX = pMargin + badgeRadius;
    const badgeY = curY - 2;

    page.drawCircle({
      x: badgeX,
      y: badgeY,
      size: badgeRadius,
      color: colHead,
    });
    const bnW = fontHelveticaBold.widthOfTextAtSize(badgeNum, 7.8);
    page.drawText(badgeNum, {
      x: badgeX - bnW / 2,
      y: badgeY - 2.8,
      size: 7.8,
      font: fontHelveticaBold,
      color: rgb(1, 1, 1),
    });

    const ritualTitleX = pMargin + badgeRadius * 2 + 8;
    safeDrawText(page, r.title, {
      x: ritualTitleX,
      y: curY,
      size: 9.2,
      font: bodyBoldFont,
      fallbackFont: fontPoppins,
      color: colSub,
    });
    curY -= 13.0;

    const rDescLines = wrapText(r.desc, bodyTextFont, 8.5, contentWidth - 24);
    for (const dLine of rDescLines.slice(0, 1)) {
      safeDrawText(page, dLine, {
        x: ritualTitleX,
        y: curY,
        size: 8.5,
        font: bodyTextFont,
        fallbackFont: fontPoppins,
        color: colBody,
      });
      curY -= 13.0;
    }
    curY -= 8;
  }

  curY -= 16;

  // --- SECTION 3: FESTIVAL PUJA & PREPARATION CHECKLIST ---
  const sec3Heading = isSharadPurnimaTheme
    ? 'पावन शरद पूर्णिमा — पूजन एवं तैयारी चेकलिस्ट'
    : 'FESTIVAL PUJA & CELEBRATION CHECKLIST';
  safeDrawText(page, sec3Heading, {
    x: pMargin,
    y: curY,
    size: 10.5,
    font: pageSubFont,
    fallbackFont: fontPoppins,
    color: colHead,
  });
  curY -= 18;

  const checklistItems = isSharadPurnimaTheme
    ? [
        { title: 'गाय का शुद्ध दूध, चावल, केसर व मेवे', sub: 'चांदनी में अमृत खीर तैयार करने हेतु' },
        { title: 'चांदी का पात्र या स्वच्छ कांसा / कांच बर्तन', sub: 'खीर को रात्रिभर चांदनी में रखने हेतु' },
        { title: 'महीन श्वेत वस्त्र या जालीदार ढक्कन', sub: 'खीर को कीट-पतंगों से सुरक्षित रखने हेतु' },
        { title: 'माँ महालक्ष्मी पूजन सामग्री व घी का दीपक', sub: 'कोजागरा निशिता काल महालक्ष्मी पूजन' },
        { title: 'चंद्र देव अर्घ्य पात्र, कच्चा दूध व अक्षत', sub: 'चंद्रोदय उपरांत अर्घ्य देने हेतु' },
        { title: 'श्री सूक्त, कनकधारा व लक्ष्मी चालीसा पुस्तक', sub: 'रात्रि जागरण व पावन स्तोत्र पाठ हेतु' },
      ]
    : [
        { title: 'Sanctify puja altar & holy water (Gangajal)', sub: 'Purification before starting sacred rituals' },
        { title: 'Fresh flowers, garland & sacred durva / tulsi', sub: 'Auspicious offerings to the deity' },
        { title: 'Pure cow ghee, earthen diyas & incense sticks', sub: 'Lighting the sacred prayer altar' },
        { title: 'Satvik homemade prasad, fruits & sweets', sub: 'Devotional naivedya offering' },
        { title: 'Roli, chandan, akshat, moli & prayer bell', sub: 'Essential Vedic puja samagri' },
        { title: 'Festival katha & stotra books for family', sub: 'Devotional chanting & satsang' },
      ];

  // 2-column checklist layout with generous row spacing and breathing room
  const colW = (contentWidth - 20) / 2;
  const leftX = pMargin + 2;
  const rightX = pMargin + colW + 20;
  const rowSpacing = 32;

  for (let ci = 0; ci < checklistItems.length; ci++) {
    const item = checklistItems[ci];
    const isRightCol = ci >= 3;
    const rowIdx = ci % 3;
    const itemX = isRightCol ? rightX : leftX;
    const itemY = curY - rowIdx * rowSpacing;

    // Checkbox square with checkmark accent
    const boxSize = 9.5;
    page.drawRectangle({
      x: itemX,
      y: itemY - 1,
      width: boxSize,
      height: boxSize,
      borderColor: isSharadPurnimaTheme ? rgb(0.98, 0.84, 0.45) : colCrimson,
      borderWidth: 0.8,
      color: isSharadPurnimaTheme ? rgb(0.12, 0.16, 0.28) : rgb(1, 1, 1),
    });
    // Check mark tick
    page.drawLine({
      start: { x: itemX + 2, y: itemY + 3.5 },
      end: { x: itemX + 4, y: itemY + 1 },
      thickness: 1.2,
      color: isSharadPurnimaTheme ? rgb(0.98, 0.84, 0.45) : colCrimson,
    });
    page.drawLine({
      start: { x: itemX + 4, y: itemY + 1 },
      end: { x: itemX + 8, y: itemY + 7 },
      thickness: 1.2,
      color: isSharadPurnimaTheme ? rgb(0.98, 0.84, 0.45) : colCrimson,
    });

    // Item title
    safeDrawText(page, item.title, {
      x: itemX + 15,
      y: itemY,
      size: 8.8,
      font: bodyBoldFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.99, 0.95, 0.88) : colSub,
    });

    // Sub note
    safeDrawText(page, item.sub, {
      x: itemX + 15,
      y: itemY - 11.5,
      size: 7.6,
      font: bodyTextFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(0.88, 0.82, 0.72) : colBody,
    });
  }

  curY -= (3 * rowSpacing + 18);

  // SECTION 4: Centered Brahmand App & QR Download Section without background box
  // Dynamically position comfortably above footer line (y = 64) with ample clearance
  const mktBaseY = Math.max(106, Math.min(115, curY - 170));
  drawMarketingCardOnPage(doc, page, pageWidth, theme, fonts, pMargin, mktBaseY);

  // Footer on Page 3
  drawPageFooter(doc, page, pageWidth, theme, fonts, pageNum, totalPages);
}

/**
 * Draws the footer on any narrative page.
 */
function drawPageFooter(
  doc: PDFDocument,
  page: any,
  pageWidth: number,
  theme: FestivalTheme,
  fonts: any,
  pageNum: number,
  totalPages: number
) {
  const { fontCinzel, fontTimesItalic, fontHelveticaBold, displayFont, brahmandLogo } = fonts;
  const brandFont = fontCinzel || displayFont;
  const isSharadPurnimaTheme = isSharadPurnimaThemeCheck(theme.name);
  const colPeachDeep = isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : rgb(0.961, 0.710, 0.541);
  const colCrimson = isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : (theme.primaryAccent || rgb(0.56, 0.11, 0.08));
  const colInkSoft = isSharadPurnimaTheme ? rgb(0.88, 0.84, 0.76) : rgb(0.18, 0.13, 0.10);
  const colSageDeep = isSharadPurnimaTheme ? rgb(0.92, 0.85, 0.70) : rgb(0.20, 0.28, 0.15);

  const footY = 24;
  page.drawLine({
    start: { x: 38, y: footY + 40 },
    end: { x: pageWidth - 38, y: footY + 40 },
    thickness: 0.8,
    color: colPeachDeep,
    opacity: isSharadPurnimaTheme ? 0.6 : 0.85,
  });

  const fLogoDim = 17;
  if (brahmandLogo) {
    page.drawImage(brahmandLogo, {
      x: 44,
      y: footY + 13,
      width: fLogoDim,
      height: fLogoDim,
    });
  }

  const fBrandX = brahmandLogo ? 44 + fLogoDim + 6 : 44;
  page.drawText('BRAHMAND', {
    x: fBrandX,
    y: footY + 15,
    size: 11,
    font: brandFont,
    color: colCrimson,
  });

  page.drawText('Discover more on Brahmand  *  https://brahmand.app', {
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
    addClickableLink(doc, page, footerTrackingUrl, [
      44 + pfxW,
      footY - 2,
      44 + pfxW + lnkW,
      footY + 12,
    ]);
  } catch (footerLinkErr) {
    console.warn('[PDF] Failed to add footer link annotation:', footerLinkErr);
  }

  // Sender's own name (the user sharing this PDF) in the sign-off
  const senderName = getPdfPersonalFirstName();
  const pageText = senderName
    ? `SHARED WITH LOVE BY ${cleanTextForPdf(senderName).toUpperCase()}  *  VIA BRAHMAND APP`
    : 'SHARED WITH LOVE VIA BRAHMAND APP';
  const ptW = fontHelveticaBold.widthOfTextAtSize(pageText, 7);
  page.drawText(pageText, {
    x: pageWidth - 44 - ptW,
    y: footY + 16,
    size: 7,
    font: fontHelveticaBold,
    color: colSageDeep,
  });

  const subPageText = `PAGE ${pageNum} OF ${totalPages}`;
  const sptW = fontHelveticaBold.widthOfTextAtSize(subPageText, 7.5);
  page.drawText(subPageText, {
    x: pageWidth - 44 - sptW,
    y: footY + 2,
    size: 7.5,
    font: fontHelveticaBold,
    color: colCrimson,
  });
}

/**
 * Builds and shares the complete multi-page Festival Katha & Guide PDF.
 * Flows across as many pages as needed without cutting or shortening content.
 */
export async function generateFestivalStoryPdf(festival: any, sectionValue?: string): Promise<string> {
  const theme = getFestivalTheme(festival, sectionValue);

  const doc = await PDFDocument.create();
  doc.setTitle(`Brahmand - ${cleanTextForPdf(theme.name)} Complete Katha & Guide`);
  doc.setAuthor("Brahmand - Daily Sanatan Community");
  doc.setSubject(`${cleanTextForPdf(theme.name)} Sacred Story, Puja Vidhi & Mantra`);
  doc.setCreator('Brahmand Platform');

  const fonts = await loadPdfFonts(doc);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const cx = pageWidth / 2;
  const pMargin = 38;
  const contentWidth = pageWidth - pMargin * 2;

  const isSharadPurnimaTheme = isSharadPurnimaThemeCheck(theme.name, festival?.festival_name || festival?.name);

  const { fontCinzel, fontRozha, fontPoppins, fontHimalaya, fontTimes, fontHelveticaBold, displayFont } = fonts;
  const brandFont = fontCinzel || displayFont;
  const chapterHeadFont = isSharadPurnimaTheme ? (fontRozha || fontPoppins || fontHimalaya || brandFont) : brandFont;
  const chapterBodyFont = isSharadPurnimaTheme ? (fontPoppins || fontHimalaya || fontTimes) : fontTimes;
  const colCrimson = theme.primaryAccent || rgb(0.56, 0.11, 0.08);
  const colTerracottaDk = rgb(0.50, 0.18, 0.09);
  const colPeachDeep = rgb(0.961, 0.710, 0.541);
  const colSageDeep = rgb(0.20, 0.28, 0.15);
  const colInk = rgb(0.10, 0.07, 0.05);

  const bodyFontSize = isSharadPurnimaTheme ? 11.2 : 11.8;
  // Devanagari needs taller leading (matras/visargas extend past the baseline)
  const bodyLineHeight = isSharadPurnimaTheme ? 18.5 : 16.0;

  // Prepare narrative section items
  const narrativeSections = theme.chapters || [];

  // Two-pass generation or dynamic layout:
  // We'll maintain narrative pages array, measure text and paginate smoothly
  interface NarrativePageRecord {
    page: any;
    pageIndex: number;
    hasMarketingCard: boolean;
  }

  const narrativePages: NarrativePageRecord[] = [];

  const startNewNarrativePage = (isFirst: boolean, willHaveMarketingCard: boolean) => {
    const page = doc.addPage([pageWidth, pageHeight]);
    drawPageParchmentFrame(page, pageWidth, pageHeight, theme, fonts);
    const startY = drawPageBrandHeader(page, pageWidth, pageHeight, theme, fonts, isFirst);
    const record: NarrativePageRecord = {
      page,
      pageIndex: narrativePages.length + 2, // 1-based index (Page 1 is Artwork)
      hasMarketingCard: willHaveMarketingCard,
    };
    narrativePages.push(record);
    return { page, curY: startY, record };
  };

  let { page: curPage, curY, record: curRecord } = startNewNarrativePage(true, false);

  // Render narrative sections across pages
  for (let sIdx = 0; sIdx < narrativeSections.length; sIdx++) {
    const sec = narrativeSections[sIdx];
    const secTitle = cleanTextForPdf(sec.title || `PART ${sIdx + 1}`);
    const cleanContent = cleanTextForPdf(sec.content || '');

    // Check if remaining space on current page is insufficient (< 110pt)
    if (curY < 120) {
      const next = startNewNarrativePage(false, false);
      curPage = next.page;
      curY = next.curY;
      curRecord = next.record;
    }

    // Draw Section Header
    const secTitleFontSize = isSharadPurnimaTheme ? 12.0 : 9.6;
    safeDrawText(curPage, secTitle, {
      x: pMargin,
      y: curY,
      size: secTitleFontSize,
      font: chapterHeadFont,
      fallbackFont: fontPoppins,
      color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colTerracottaDk,
    });
    curY -= (secTitleFontSize * 0.4 + 11);

    if (isSharadPurnimaTheme) {
      // In Devanagari Hindi, split-syllable drop caps break ligature rendering.
      // Render entire smooth paragraphs with chapterBodyFont (Poppins Devanagari)
      const allLines = wrapText(cleanContent, chapterBodyFont, bodyFontSize, contentWidth);
      for (let rIdx = 0; rIdx < allLines.length; rIdx++) {
        if (curY < 80) {
          const next = startNewNarrativePage(false, false);
          curPage = next.page;
          curY = next.curY;
          curRecord = next.record;
        }

        const isLast = rIdx === allLines.length - 1;
        drawJustifiedLine(
          curPage,
          allLines[rIdx],
          chapterBodyFont,
          bodyFontSize,
          isSharadPurnimaTheme ? rgb(0.95, 0.92, 0.86) : colInk,
          pMargin,
          curY,
          contentWidth,
          isLast
        );
        curY -= bodyLineHeight;
      }
    } else {
      // English first line with Drop Cap styling
      const dropLetter = cleanContent.charAt(0) || 'T';
      const restOfText = cleanContent.slice(1);
      const dropCapSize = 21;
      const dropW = brandFont.widthOfTextAtSize(dropLetter, dropCapSize);

      curPage.drawText(dropLetter, {
        x: pMargin,
        y: curY - 7.5,
        size: dropCapSize,
        font: brandFont,
        color: colCrimson,
      });

      const dropIndent = dropW + 4;
      const firstLinesWidth = contentWidth - dropIndent;

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
      const remainingLines = wrapText(remainingText, fontTimes, bodyFontSize, contentWidth);

      drawJustifiedLine(
        curPage,
        line1,
        fontTimes,
        bodyFontSize,
        colInk,
        pMargin + dropIndent,
        curY,
        firstLinesWidth,
        wordIdx >= words.length
      );
      curY -= bodyLineHeight;

      if (line2) {
        drawJustifiedLine(
          curPage,
          line2,
          fontTimes,
          bodyFontSize,
          colInk,
          pMargin + dropIndent,
          curY,
          firstLinesWidth,
          remainingLines.length === 0
        );
        curY -= bodyLineHeight;
      }

      // Render remaining lines with page-overflow handling
      for (let rIdx = 0; rIdx < remainingLines.length; rIdx++) {
        if (curY < 80) {
          const next = startNewNarrativePage(false, false);
          curPage = next.page;
          curY = next.curY;
          curRecord = next.record;
        }

        const isLast = rIdx === remainingLines.length - 1;
        drawJustifiedLine(
          curPage,
          remainingLines[rIdx],
          fontTimes,
          bodyFontSize,
          colInk,
          pMargin,
          curY,
          contentWidth,
          isLast
        );
        curY -= bodyLineHeight;
      }
    }

    curY -= 6;

    // Small divider between sections
    if (sIdx < narrativeSections.length - 1) {
      if (curY > 80) {
        const dW = 60;
        const dX = (pageWidth - dW) / 2;
        const dCol = isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colPeachDeep;
        curPage.drawLine({ start: { x: dX, y: curY }, end: { x: cx - 8, y: curY }, thickness: 0.5, color: dCol, opacity: 0.8 });
        curPage.drawCircle({ x: cx, y: curY, size: 1.8, color: isSharadPurnimaTheme ? rgb(0.85, 0.70, 0.40) : colSageDeep });
        curPage.drawLine({ start: { x: cx + 8, y: curY }, end: { x: dX + dW, y: curY }, thickness: 0.5, color: dCol, opacity: 0.8 });
        curY -= 10;
      }
    }
  }

  // Determine marketing card placement:
  // Check for associated audio narration to feature in PDF
  let audioInfo: { audioUri?: string; audioTitle?: string; audioWebUrl?: string } | null = null;
  try {
    audioInfo = await getFestivalAudioUri(festival);
  } catch (_aErr) { }

  // Audio feature box takes ~58pt, concluding blessing takes ~40pt.
  // Space needed is only ~100pt now that the marketing card is moved to Page 3.
  let lastNarrativeRecord = curRecord;
  if (curY <= 110) {
    const finalPage = startNewNarrativePage(false, false);
    curPage = finalPage.page;
    curY = finalPage.curY;
    lastNarrativeRecord = finalPage.record;
  }



  // Add a heartfelt concluding blessings banner
  const blessHeading = isSharadPurnimaTheme
    ? '॥ मंगल पावन संकल्प एवं दिव्य आशीर्वाद ॥'
    : 'DIVINE SANATAN BLESSING & SANKALP';
  const bhFont = isSharadPurnimaTheme ? (fontRozha || brandFont) : brandFont;
  const bhW = measureTextWidth(bhFont, blessHeading, 10.2);
  safeDrawText(curPage, blessHeading, {
    x: (pageWidth - bhW) / 2,
    y: curY,
    size: 10.2,
    font: bhFont,
    fallbackFont: fontPoppins,
    color: isSharadPurnimaTheme ? rgb(1.0, 0.84, 0.45) : colCrimson,
  });
  curY -= 14;

  const blessText = cleanTextForPdf(theme.blessing || 'Dharmo Rakshati Rakshitah - May the auspicious grace of this festival illuminate your life.');
  const bTextFont = isSharadPurnimaTheme ? (fontRozha || brandFont) : fontTimes;
  const blessLines = wrapText(blessText, bTextFont, 10.0, contentWidth);
  for (const bLine of blessLines) {
    const blW = measureTextWidth(bTextFont, bLine, 10.0);
    safeDrawText(curPage, bLine, {
      x: (pageWidth - blW) / 2,
      y: curY,
      size: 10.0,
      font: bTextFont,
      fallbackFont: bTextFont,
      color: isSharadPurnimaTheme ? rgb(0.95, 0.92, 0.86) : colInk,
    });
    curY -= 13.5;
  }

  // Calculate total pages: 1 (Artwork Page) + Narrative Katha Pages + 1 (Guide, Rituals & Quiz Page)
  const totalPages = 1 + narrativePages.length + 1;

  // PAGE 1: Universal Festival Artwork (pass dynamic totalPages)
  const page1 = doc.insertPage(0, [pageWidth, pageHeight]);
  await renderDynamicFestivalPage1(doc, page1, theme, fonts, festival, 1, totalPages);

  // Draw footers on all narrative pages with exact "PAGE X OF Y"
  for (let i = 0; i < narrativePages.length; i++) {
    const pRec = narrativePages[i];
    drawPageFooter(doc, pRec.page, pageWidth, theme, fonts, i + 2, totalPages);
  }

  // PAGE 3 (or final page): Dedicated Festival Guide, Sacred Rituals, Interactive Quiz & App Download Card
  const guidePageNum = 1 + narrativePages.length + 1;
  await renderFestivalGuideAndQuizPage(doc, theme, fonts, festival, guidePageNum, totalPages);

  // Save multi-page PDF with standard xref table for maximum compatibility
  const base64Pdf = await doc.saveAsBase64({ useObjectStreams: false });
  const sanitizedName = theme.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'festival';
  const filename = `${sanitizedName}_katha.pdf`;

  const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const rawUri = `${targetDir}${filename}`;
  const fileUri = rawUri.startsWith('file://') ? rawUri : `file://${rawUri}`;

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

  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists || (typeof fileInfo.size === 'number' && fileInfo.size === 0)) {
    throw new Error('PDF file generation was incomplete or empty.');
  }

  return fileUri;
}

/**
 * Resolves festival audio narration file/URI if available.
 * Supports Karwa Chauth bundled audio and Navratri / Katha audio URLs.
 */
export async function getFestivalAudioUri(festival: any): Promise<{ audioUri?: string; audioTitle?: string; audioWebUrl?: string } | null> {
  try {
    const festName = (festival?.festival_name || festival?.name || festival?.title || '').toLowerCase();
    const festSlug = (festName || 'festival').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'festival';

    // 1. Karwa Chauth local bundled audio
    if (festName.includes('karwa') || festName.includes('karva')) {
      try {
        const audioAsset = Asset.fromModule(require('../../assets/audio/karwachauth.mp3'));
        await audioAsset.downloadAsync();
        const localUri = audioAsset.localUri || audioAsset.uri;
        if (localUri) {
          return {
            audioUri: localUri,
            audioTitle: 'Karwa Chauth Pawan Katha (Audio Narration)',
            // Use live Brahmand listen / download URL rather than non-existent raw .mp3 web link
            audioWebUrl: getTrackedBrahmandUrl('karwa_chauth', 'download_button'),
          };
        }
      } catch (karwaAudioErr) {
        console.warn('[Audio] Failed to resolve Karwa Chauth asset:', karwaAudioErr);
      }
    }

    // 1b. Sharad Purnima / Kojagara local bundled audio
    if (festName.includes('sharad purnima') || festName.includes('kojagiri') || festName.includes('kojagara')) {
      try {
        const audioAsset = Asset.fromModule(require('../../assets/audio/sharad_purnima.mp3'));
        await audioAsset.downloadAsync();
        const localUri = audioAsset.localUri || audioAsset.uri;
        if (localUri) {
          return {
            audioUri: localUri,
            audioTitle: 'Sharad Purnima Kojagara Vrat Katha (Audio Narration)',
            audioWebUrl: getTrackedBrahmandUrl('sharad_purnima', 'download_button'),
          };
        }
      } catch (sharadAudioErr) {
        console.warn('[Audio] Failed to resolve Sharad Purnima asset:', sharadAudioErr);
      }
    }

    // 2. Navratri Day Audio (CDN url from navdurgaDaysData)
    const dayData = festival?.dayData || (festival?.day ? festival : null);
    if (dayData?.audioUrl) {
      let localAudioUri: string | undefined = undefined;
      try {
        const ext = dayData.audioUrl.split('.').pop()?.split('?')[0] || 'mp3';
        const targetAudioPath = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}navratri_day_${dayData.day || 1}_audio.${ext}`;
        const check = await FileSystem.getInfoAsync(targetAudioPath);
        if (check.exists && (check.size || 0) > 0) {
          localAudioUri = targetAudioPath.startsWith('file://') ? targetAudioPath : `file://${targetAudioPath}`;
        } else {
          const downloadRes = await FileSystem.downloadAsync(dayData.audioUrl, targetAudioPath);
          if (downloadRes?.uri) {
            localAudioUri = downloadRes.uri.startsWith('file://') ? downloadRes.uri : `file://${downloadRes.uri}`;
          }
        }
      } catch (dlErr) {
        console.warn('[Audio] Non-critical CDN audio download error:', dlErr);
      }

      return {
        audioUri: localAudioUri,
        audioWebUrl: dayData.audioUrl,
        audioTitle: `${dayData.deviNameEn || 'Navratri'} Divine Stuti (Audio)`,
      };
    }

    // 3. Direct audio_url or audioUrl on festival object
    const directAudio = festival?.audio_url || festival?.audioUrl || festival?.audio;
    if (typeof directAudio === 'string' && directAudio.trim().length > 0) {
      const cleanUrl = directAudio.trim();
      let localAudioUri: string | undefined = undefined;
      try {
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          const ext = cleanUrl.split('.').pop()?.split('?')[0] || 'mp3';
          const targetAudioPath = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${festSlug}_katha_audio.${ext}`;
          const check = await FileSystem.getInfoAsync(targetAudioPath);
          if (check.exists && (check.size || 0) > 0) {
            localAudioUri = targetAudioPath.startsWith('file://') ? targetAudioPath : `file://${targetAudioPath}`;
          } else {
            const downloadRes = await FileSystem.downloadAsync(cleanUrl, targetAudioPath);
            if (downloadRes?.uri) {
              localAudioUri = downloadRes.uri.startsWith('file://') ? downloadRes.uri : `file://${downloadRes.uri}`;
            }
          }
        } else if (cleanUrl.startsWith('file://')) {
          localAudioUri = cleanUrl;
        }
      } catch (dlErr2) {
        console.warn('[Audio] Non-critical direct audio download error:', dlErr2);
      }

      return {
        audioUri: localAudioUri,
        audioWebUrl: cleanUrl,
        audioTitle: `${festival?.festival_name || festival?.name || 'Festival'} Katha Audio`,
      };
    }
  } catch (err) {
    console.warn('[Audio] Non-critical audio detection error:', err);
  }

  return null;
}

/**
 * Builds and shares the complete multi-page Festival Katha & Guide PDF via native share dialog.
 * Automatically embeds audio narration link in the share payload without breaking WhatsApp / iOS MIME types.
 */
export async function shareFestivalStoryPdf(
  festival: any,
  sectionValue?: string
): Promise<{ success: boolean; uri?: string; audioShared?: boolean; error?: string }> {
  try {
    const fileUri = await generateFestivalStoryPdf(festival, sectionValue);
    const theme = getFestivalTheme(festival, sectionValue);

    // Check for associated audio narration
    const audioInfo = await getFestivalAudioUri(festival);

    const trackingShareUrl = getTrackedBrahmandUrl(theme.name, 'whatsapp_share');
    const shareTitle = `${theme.name} — Katha, Puja Vidhi & Complete Guide`;

    const chaptersSummary = (theme.chapters || [])
      .map((ch, idx) => `  ${idx + 1}. *${ch.title}*: ${ch.content}`)
      .join('\n\n');

    let audioLine = '';
    if (audioInfo?.audioWebUrl || audioInfo?.audioTitle) {
      audioLine =
        `\n🎧 *ऑडियो कथा श्रवण (Sacred Audio Katha):*\n` +
        `▶️ ${audioInfo.audioTitle || 'Listen to Sacred Katha Narration'}\n` +
        `🔗 ${audioInfo.audioWebUrl || trackingShareUrl}\n`;
    }

    const shareMessage =
      `🌸 *${theme.name.toUpperCase()} — सम्पूर्ण कथा, पूजा विधि एवं महात्म्य* 🌸\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🕉 *आराध्य देव / Deity:* ${theme.deity}\n` +
      `📅 *तिथि / Tithi:* ${theme.tithi}\n` +
      `✨ *परंपरा / Tradition:* ${theme.tradition}\n\n` +
      `📜 *कथा एवं सम्पूर्ण पावन प्रसंग (All Sections):*\n\n` +
      `${chaptersSummary}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🙏 *दिव्य आशीर्वाद (Blessing):*\n` +
      `"${theme.blessing}"\n` +
      audioLine +
      `\n📖 *संलग्न (Attached):* सम्पूर्ण सचित्र E-Booklet / Katha PDF\n\n` +
      `🛕 *Download Brahmand App* — 1,000+ Live Temple Darshans, Vedic Panchang, Daily Jaap & Kathas:\n` +
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
      // Tier 1: React Native Share with pure single PDF file
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
          return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
        }
      } catch (rnShareErr: any) {
        if (isUserCancellation(rnShareErr)) {
          return { success: true, uri: fileUri };
        }
        console.warn('[PDF Share Android] react-native-share failed, trying expo-sharing:', rnShareErr);
      }

      // Tier 2: Expo Sharing
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: shareTitle,
          });
          return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
        }
      } catch (expoShareErr: any) {
        if (isUserCancellation(expoShareErr)) {
          return { success: true, uri: fileUri };
        }
        console.warn('[PDF Share Android] expo-sharing failed, trying IntentLauncher:', expoShareErr);
      }

      // Tier 3: Android IntentLauncher with content:// URI
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        let IntentLauncher;
        try {
          IntentLauncher = require('expo-intent-launcher');
        } catch { }
        if (IntentLauncher && typeof IntentLauncher.startActivityAsync === 'function') {
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: 'application/pdf',
            extra: {
              'android.intent.extra.STREAM': contentUri,
              'android.intent.extra.TEXT': shareMessage,
              'android.intent.extra.SUBJECT': shareTitle,
            },
            flags: 1,
          });
          return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
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
      return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
    }

    // -------------------------------------------------------------
    // PLATFORM: IOS PIPELINE
    // -------------------------------------------------------------
    // Tier 1: React Native Share with pure single PDF file (prevents WhatsApp invalid supported link error)
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
        return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
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
        return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
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

    return { success: true, uri: fileUri, audioShared: Boolean(audioInfo?.audioWebUrl) };
  } catch (err: any) {
    console.error('Error in shareFestivalStoryPdf:', err);
    return { success: false, error: err?.message || String(err) };
  }
}