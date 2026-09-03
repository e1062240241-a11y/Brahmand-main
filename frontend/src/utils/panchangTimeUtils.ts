import {
  HoraItem,
  HoraNature,
  RawHoraItem,
  TimeValue,
} from '../types/panchang';
import { PLANET_NATURES } from '../constants/panchang';

/**
 * Parsed clock components
 */
export interface ParsedClockTime {
  hour: number;
  minute: number;
}

/**
 * Parses a time string (e.g., "05:45 AM", "17:30", "5:45pm", "12:00:00 AM")
 * into normalized 24-hour hour and minute components.
 * 
 * Handles edge cases:
 * - 12:00 AM -> hour 0
 * - 12:00 PM -> hour 12
 * - 1:00 PM -> hour 13
 * - 24-hour inputs like 18:30
 */
export const parseTimeStr = (timeStr: string): ParsedClockTime | null => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  // Match HH:MM(:SS)? optional AM/PM
  const match = trimmed.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?::\d{1,2})?\s*(AM|PM|am|pm)?/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  if (ampm) {
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23) return null;

  return { hour, minute };
};

/**
 * Splits a time range string (e.g. "05:45 AM - 06:45 AM" or "06:00 - 07:30" or "05:45 AM to 06:45 AM")
 * into [startTimeStr, endTimeStr].
 * 
 * Avoids regex lookbehind assertions for older Safari/iOS webview compatibility.
 */
export const splitTimeRange = (timeRangeStr: string): [string, string] | null => {
  if (!timeRangeStr || typeof timeRangeStr !== 'string') return null;
  const trimmed = timeRangeStr.trim();
  if (!trimmed) return null;

  // Split by standard delimiters: dash, en-dash, em-dash, or word 'to'
  let parts = trimmed.split(/\s*(?:[-–—]|(?:\bto\b))\s*/i);

  // If failed, check if separated by AM/PM spaces or multiple colon segments
  if (parts.length < 2) {
    const normalized = trimmed.replace(/([APap][Mm])\s+/g, '$1 - ');
    parts = normalized.split(/\s*-\s*/);
  }

  if (parts.length < 2) {
    const matches = trimmed.match(/\d{1,2}:\d{1,2}(?::\d{1,2})?(\s*(?:AM|PM|am|pm))?/gi);
    if (matches && matches.length >= 2) {
      parts = [matches[0], matches[1]];
    }
  }

  if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
    return [parts[0].trim(), parts[1].trim()];
  }

  return null;
};

/**
 * Builds chronological Date ranges for each Hora slot anchored to a baseDate.
 * 
 * Edge-case handling for midnight crossovers:
 * - If start hour of a slot is less than the previous start hour, slot has crossed past midnight (+1 day).
 * - If end hour of a slot is less than its start hour (e.g., 11:45 PM to 12:45 AM), the end time is +1 day.
 */
export const buildHoraDateRanges = (
  horaList: RawHoraItem[],
  baseDate: Date
): HoraItem[] => {
  const currentStartDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const currentEndDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  let prevStartHour = -1;

  return horaList.map((item) => {
    const rawHora = item.hora || item.name || '';
    const normalizedHora = rawHora ? rawHora.charAt(0).toUpperCase() + rawHora.slice(1).toLowerCase() : '';
    const defaultNature: HoraNature = item.nature || getPlanetNature(normalizedHora);
    const timeStr = item.time || '';

    if (!timeStr) {
      return {
        ...item,
        hora: normalizedHora,
        time: timeStr,
        nature: defaultNature,
        startDate: null,
        endDate: null,
      };
    }

    const parts = splitTimeRange(timeStr);
    if (!parts) {
      return {
        ...item,
        hora: normalizedHora,
        time: timeStr,
        nature: defaultNature,
        startDate: null,
        endDate: null,
      };
    }

    const startParsed = parseTimeStr(parts[0]);
    const endParsed = parseTimeStr(parts[1]);

    if (!startParsed || !endParsed) {
      return {
        ...item,
        hora: normalizedHora,
        time: timeStr,
        nature: defaultNature,
        startDate: null,
        endDate: null,
      };
    }

    const sh = startParsed.hour;
    const sm = startParsed.minute;
    const eh = endParsed.hour;
    const em = endParsed.minute;

    // Day transition detection between consecutive slots
    if (prevStartHour !== -1 && sh < prevStartHour) {
      currentStartDay.setDate(currentStartDay.getDate() + 1);
      currentEndDay.setDate(currentEndDay.getDate() + 1);
    }
    prevStartHour = sh;

    const startDate = new Date(currentStartDay);
    startDate.setHours(sh, sm, 0, 0);

    // Slot itself spans across midnight (e.g. 11:30 PM -> 00:30 AM)
    if (eh < sh) {
      const tempEndDay = new Date(currentEndDay);
      tempEndDay.setDate(tempEndDay.getDate() + 1);

      const endDate = new Date(tempEndDay);
      endDate.setHours(eh, em, 0, 0);

      currentEndDay.setDate(currentEndDay.getDate() + 1);
      currentStartDay.setDate(currentStartDay.getDate() + 1);
      prevStartHour = eh;

      return {
        ...item,
        hora: normalizedHora,
        time: timeStr,
        nature: defaultNature,
        startDate,
        endDate,
      };
    } else {
      const endDate = new Date(currentEndDay);
      endDate.setHours(eh, em, 0, 0);
      return {
        ...item,
        hora: normalizedHora,
        time: timeStr,
        nature: defaultNature,
        startDate,
        endDate,
      };
    }
  });
};

/**
 * Finds the index of the currently active Hora slot based on a reference time (defaults to now).
 */
export const findActiveHoraIdx = (
  horaList: RawHoraItem[],
  baseDate: Date,
  referenceTime: Date = new Date()
): number => {
  const horaListWithDates = buildHoraDateRanges(horaList, baseDate);
  return horaListWithDates.findIndex((h) => {
    if (!h.startDate || !h.endDate) return false;
    return referenceTime >= h.startDate && referenceTime < h.endDate;
  });
};

/**
 * Gets benefic / malefic nature of a planet by name.
 */
export const getPlanetNature = (planetName: string): HoraNature => {
  const normalized = (planetName || '').trim();
  const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  return PLANET_NATURES[capitalized] || { text: 'NEUTRAL', type: 'neutral' };
};

/**
 * Formats a normalized planet degree (e.g. 15.7) to degrees and arcminutes ("15° 42'").
 */
export const formatPlanetDegree = (normDegree: number | undefined | null): string => {
  if (normDegree == null || Number.isNaN(normDegree)) return "0° 00'";
  const deg = Math.floor(normDegree);
  const min = Math.round((normDegree - deg) * 60);
  return `${deg}° ${min.toString().padStart(2, '0')}'`;
};

/**
 * Formats date and weekday labels for top date navigation (e.g. "3rd Sep, 2026", "Thursday").
 */
export const formatDateLabel = (date: Date): { dateStr: string; dayStr: string } => {
  const day = date.getDate();
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekdays[date.getDay()];

  return {
    dateStr: `${day}${suffix} ${monthName}, ${year}`,
    dayStr: dayName,
  };
};

/**
 * Formats heterogeneous time values (string, object with hour/min, etc.) to "hh:mm AM/PM".
 */
export const formatTimeValue = (value: TimeValue | null | undefined): string => {
  if (value == null || value === '') return '';
  let hInt = 0;
  let mInt = 0;

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return '';
    const match = normalized.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(AM|PM|am|pm)?/i);
    if (match) {
      hInt = parseInt(match[1], 10);
      mInt = parseInt(match[2], 10);
      if (match[3]) {
        const ampm = match[3].toUpperCase();
        const hStr = hInt.toString().padStart(2, '0');
        const mStr = mInt.toString().padStart(2, '0');
        return `${hStr}:${mStr} ${ampm}`;
      }
    } else {
      return normalized;
    }
  } else if (typeof value === 'object') {
    const rawH = value.hour ?? value.Hours ?? value.h ?? 0;
    const rawM = value.minute ?? value.Minutes ?? value.m ?? 0;
    hInt = parseInt(String(rawH), 10);
    mInt = parseInt(String(rawM), 10);
  } else if (typeof value === 'number') {
    hInt = Math.floor(value);
    mInt = Math.round((value - hInt) * 60);
  } else {
    return String(value);
  }

  if (Number.isNaN(hInt)) hInt = 0;
  if (Number.isNaN(mInt)) mInt = 0;

  const ampm = hInt >= 12 ? 'PM' : 'AM';
  const h12 = hInt % 12 || 12;
  const hStr = h12.toString().padStart(2, '0');
  const mStr = mInt.toString().padStart(2, '0');
  return `${hStr}:${mStr} ${ampm}`;
};

/**
 * Type-safe error message extractor for catch blocks.
 */
export const getErrorMessage = (err: unknown): string => {
  if (!err) return 'Failed to load Panchang';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    const axiosErr = err as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    if (axiosErr.response?.data?.detail) return axiosErr.response.data.detail;
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
    if (axiosErr.message) return axiosErr.message;
  }
  return 'Failed to load Panchang';
};
