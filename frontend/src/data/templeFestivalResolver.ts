import { DEITY_CANONICAL_FESTIVALS } from '../constants/deityFestivals';

export interface ResolveFestivalsParams {
  temple?: any;
  authenticFestivals?: string[];
}

function extractFestivalName(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object' && item !== null) {
    const extracted = item.name || item.festival_name || item.title || item.festivalName || item.label;
    if (typeof extracted === 'string') return extracted.trim();
  }
  return '';
}

export function resolveTempleFestivals(params: ResolveFestivalsParams): string[] | undefined {
  const { temple, authenticFestivals } = params;

  // 1. Primary: Curated authentic details
  if (Array.isArray(authenticFestivals) && authenticFestivals.length > 0) {
    const resolved = authenticFestivals.map(extractFestivalName).filter(Boolean);
    if (resolved.length > 0) return resolved;
  }

  // 2. Secondary: Explicit festivals on temple object (API or database)
  const rawFestivals = temple?.festivals || temple?.major_festivals;
  if (Array.isArray(rawFestivals) && rawFestivals.length > 0) {
    const resolved = rawFestivals.map(extractFestivalName).filter(Boolean);
    if (resolved.length > 0) return resolved;
  }
  if (typeof rawFestivals === 'string' && rawFestivals.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawFestivals);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const resolved = parsed.map(extractFestivalName).filter(Boolean);
        if (resolved.length > 0) return resolved;
      }
    } catch {
      const splitFestivals = rawFestivals.split(',').map(s => s.trim()).filter(Boolean);
      if (splitFestivals.length > 0) return splitFestivals;
    }
  }

  // 3. Tertiary: Canonical Deity / Category / Name matching (in priority order: deity -> category -> name)
  const fieldsToMatch = [temple?.deity, temple?.category, temple?.name].filter(Boolean);

  for (const fieldStr of fieldsToMatch) {
    if (typeof fieldStr !== 'string' || !fieldStr.trim()) continue;
    for (const mapping of DEITY_CANONICAL_FESTIVALS) {
      const hasMatch = mapping.keywords.some(kw => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(fieldStr);
      });
      if (hasMatch) {
        return mapping.festivals;
      }
    }
  }

  // 4. Undefined if no match found
  return undefined;
}
