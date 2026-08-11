import {
  TransportDetails,
  CURATED_TEMPLE_TRANSPORT,
  TEMPLE_TRANSPORT_ALIASES,
} from './templeTransportData';

export { TransportDetails, CURATED_TEMPLE_TRANSPORT, TEMPLE_TRANSPORT_ALIASES };

export interface TransportResolutionOptions {
  temple?: any;
  templeId?: string;
  templeName?: string;
  category?: string;
  coords?: { latitude: number; longitude: number } | null;
  locationLabel?: any;
  guidance?: string;
}

/**
 * Rejection filter for placeholder/dummy DB values
 */
export const isRealTravelValue = (value: unknown): boolean => {
  const text = String(value || '').trim();
  if (!text) return false;

  const placeholderPatterns = [
    /^nearest regional airport$/i,
    /^nearest major airport$/i,
    /^nearest airport$/i,
    /^nearest district railway junction$/i,
    /^nearest railway station$/i,
    /^nearest railway$/i,
    /^nearest bus stand$/i,
    /^nearest bus station$/i,
    /^central city bus stand$/i,
    /^unknown$/i,
    /^n\/?a$/i,
    /^\[object Object\]$/i,
  ];

  return !placeholderPatterns.some((pattern) => pattern.test(text));
};

/**
 * Deterministic string key normalizer for transport lookups
 */
export const normalizeTransportKey = (rawInput: string): string => {
  if (!rawInput) return '';
  const lower = String(rawInput).toLowerCase().trim();

  // Direct alias match
  if (TEMPLE_TRANSPORT_ALIASES[lower]) {
    return TEMPLE_TRANSPORT_ALIASES[lower];
  }

  // Stripped non-alphanumeric match
  const cleaned = lower.replace(/[^a-z0-9]/g, '');
  for (const [alias, canonical] of Object.entries(TEMPLE_TRANSPORT_ALIASES)) {
    if (alias.replace(/[^a-z0-9]/g, '') === cleaned) {
      return canonical;
    }
  }

  return lower;
};

/**
 * Generic Canonical Key Resolution System
 * Takes any temple object or metadata and algorithmically generates candidate transport keys.
 */
export const resolveTempleCanonicalKeys = (temple: any): string[] => {
  if (!temple) return [];

  const candidates: string[] = [];

  const rawName = String(temple.name || temple.templeName || '').trim();
  const rawId = String(temple.temple_id || temple.templeId || temple.id || '').trim();
  const location = String(temple.location || temple.city || '').trim();

  // 1. Name-based candidates (Highest Priority)
  if (rawName) {
    const lowerName = rawName.toLowerCase();

    // Direct alias lookup
    if (TEMPLE_TRANSPORT_ALIASES[lowerName]) {
      candidates.push(TEMPLE_TRANSPORT_ALIASES[lowerName]);
    }

    // Normalized key via alias dictionary
    const normKey = normalizeTransportKey(rawName);
    if (normKey && !candidates.includes(normKey)) {
      candidates.push(normKey);
    }

    // Strip dash and bracket suffixes (e.g. "Annapoorneshwari Temple – Horanadu" -> "Annapoorneshwari Temple")
    const titleHead = rawName.split(/–|—|-|\(/)[0].trim().toLowerCase();
    if (titleHead && titleHead !== lowerName) {
      if (TEMPLE_TRANSPORT_ALIASES[titleHead]) {
        candidates.push(TEMPLE_TRANSPORT_ALIASES[titleHead]);
      }
      const normHead = normalizeTransportKey(titleHead);
      if (normHead && !candidates.includes(normHead)) {
        candidates.push(normHead);
      }
    }

    // Algorithmic slug generation: Remove common temple words and non-alphanumeric chars
    const cleanedWords = rawName
      .toLowerCase()
      .replace(/–|—|-|\(.*\)/g, ' ')
      .replace(/\b(temple|mandir|shrine|devasthanam|dham|matha|amman|ji|shree|shri)\b/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (cleanedWords.length > 0) {
      const genericSlug = cleanedWords.join('-');
      if (!candidates.includes(genericSlug)) {
        candidates.push(genericSlug);
      }
      // Also push first prominent word (e.g., 'annapoorneshwari', 'horanadu')
      if (cleanedWords[0] && cleanedWords[0].length >= 4 && !candidates.includes(cleanedWords[0])) {
        candidates.push(cleanedWords[0]);
      }
    }
  }

  // 2. ID-based candidates
  if (rawId) {
    const lowerId = rawId.toLowerCase();

    // Check if rawId is a known alias
    if (TEMPLE_TRANSPORT_ALIASES[lowerId] && !candidates.includes(TEMPLE_TRANSPORT_ALIASES[lowerId])) {
      candidates.push(TEMPLE_TRANSPORT_ALIASES[lowerId]);
    }

    const normId = normalizeTransportKey(rawId);
    if (normId && !candidates.includes(normId)) {
      candidates.push(normId);
    }

    const cleanId = lowerId.replace(/[^a-z0-9]/g, '');
    if (cleanId && !candidates.includes(cleanId)) {
      candidates.push(cleanId);
    }
  }

  // 3. Location-based candidate fallback
  if (location && typeof location === 'string') {
    const cleanLoc = location.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanLoc && cleanLoc !== 'objectobject' && !candidates.includes(cleanLoc)) {
      candidates.push(cleanLoc);
    }
  }

  return candidates.filter((c) => Boolean(c) && typeof c === 'string' && c !== 'objectobject');
};

/**
 * Universal Transport Resolver
 * Resolves transport for ALL temple categories independently per mode.
 * Priority per mode: Valid DB Value -> Static Curated Dataset Value -> Empty String
 */
export const resolveTempleTransport = (options: TransportResolutionOptions): TransportDetails => {
  const templeObj = options.temple || {
    id: options.templeId,
    templeId: options.templeId,
    name: options.templeName,
    category: options.category,
  };

  const rawName = String(templeObj.name || options.templeName || '').trim();
  const rawId = String(templeObj.temple_id || templeObj.templeId || templeObj.id || options.templeId || '').trim();

  // 1. Generate Canonical Candidate Keys
  const candidates = resolveTempleCanonicalKeys({
    ...templeObj,
    name: rawName,
    templeId: rawId,
  });

  let curated: TransportDetails | undefined;
  let matchedKey: string | undefined;

  // 2. Perform Matching against CURATED_TEMPLE_TRANSPORT
  for (const candidate of candidates) {
    if (!candidate) continue;

    // Exact Match in static dataset
    if (CURATED_TEMPLE_TRANSPORT[candidate]) {
      curated = CURATED_TEMPLE_TRANSPORT[candidate];
      matchedKey = candidate;
      break;
    }

    // Alias Match
    const aliasKey = TEMPLE_TRANSPORT_ALIASES[candidate];
    if (aliasKey && CURATED_TEMPLE_TRANSPORT[aliasKey]) {
      curated = CURATED_TEMPLE_TRANSPORT[aliasKey];
      matchedKey = aliasKey;
      break;
    }

    // Substring/Keyword Token Match
    for (const [key, details] of Object.entries(CURATED_TEMPLE_TRANSPORT)) {
      if (candidate.includes(key) || key.includes(candidate)) {
        curated = details;
        matchedKey = key;
        break;
      }
    }
    if (curated) break;
  }

  // 3. DB Fields Filter
  const dbAir = isRealTravelValue(templeObj?.nearest_airport) ? String(templeObj.nearest_airport).trim() : '';
  const dbRail = isRealTravelValue(templeObj?.nearest_railway) ? String(templeObj.nearest_railway).trim() : '';
  const dbBus = isRealTravelValue(templeObj?.nearest_bus_stand) ? String(templeObj.nearest_bus_stand).trim() : '';

  // 4. Independent Mode Resolution: DB -> Static -> Empty
  const staticAir = isRealTravelValue(curated?.air) ? String(curated?.air).trim() : '';
  const staticRail = isRealTravelValue(curated?.rail) ? String(curated?.rail).trim() : '';
  const staticBus = isRealTravelValue(curated?.bus) ? String(curated?.bus).trim() : '';

  const airFinal = dbAir || staticAir;
  const railFinal = dbRail || staticRail;
  const busFinal = dbBus || staticBus;

  // Determine Source Tag
  const hasDb = Boolean(dbAir || dbRail || dbBus);
  const hasStatic = Boolean(curated);

  let source: 'db' | 'static' | 'mixed' | 'none' = 'none';
  if (hasDb && hasStatic) source = 'mixed';
  else if (hasStatic) source = 'static';
  else if (hasDb) source = 'db';

  if (__DEV__ && !hasDb && !hasStatic && rawName) {
    console.warn(`[templeTransportResolver] Unable to resolve transport mapping for temple: "${rawName}" (ID: "${rawId}")`);
  }

  return {
    air: airFinal,
    rail: railFinal,
    bus: busFinal,
  };
};
