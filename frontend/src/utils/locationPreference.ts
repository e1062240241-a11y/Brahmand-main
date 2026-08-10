/**
 * Location Preference & Search Relevance Utility for Businesses (Services).
 * 
 * Distance Sub-Tiers:
 * 1. Immediate  (<= 2 km)
 * 2. Very Near  (<= 5 km)
 * 3. Near       (<= 10 km)
 * 4. Nearby     (<= 25 km)
 * 
 * Location Preference Tiers:
 * Tier 1: Proximity (Immediate, Very Near, Near, Nearby)
 * Tier 2: Area (Same neighborhood/locality)
 * Tier 3: City (Same city)
 * Tier 4: State (Same state)
 * Tier 5: Country (Same country)
 * Tier 6: Other
 * 
 * Sorting Hierarchy:
 * Search Relevance Rank -> Location Tier -> Distance Sub-Tier -> Exact Distance (km)
 */

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: any;
}

export type SubTierLabel = 'Immediate' | 'Very Near' | 'Near' | 'Nearby' | 'Area' | 'City' | 'State' | 'Country' | 'Other';

export interface TierResult {
  tier: number;       // 1 to 6
  subTier: number;    // 1 to 4 for Tier 1; 1 for others
  label: SubTierLabel;
  dist?: number;
  fullLabel: string;
}

export function computeLocationTier(
  item: {
    latitude?: number;
    longitude?: number;
    full_address?: string;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
    distance?: number;
    effectiveDist?: number;
    preferred_work_city?: string;
    current_address?: string;
  },
  userLoc?: LocationInfo | null
): TierResult {
  const effectiveDist = typeof item.effectiveDist === 'number' ? item.effectiveDist : item.distance;
  const addressText = (
    item.full_address ||
    item.address ||
    item.current_address ||
    item.preferred_work_city ||
    ''
  ).toLowerCase();

  const areaLower = (item.area || '').toLowerCase();
  const cityLower = (item.city || item.preferred_work_city || '').toLowerCase();
  const stateLower = (item.state || '').toLowerCase();
  const countryLower = (item.country || '').toLowerCase();

  const userArea = (userLoc?.area || '').trim().toLowerCase();
  const userCity = (userLoc?.city || '').trim().toLowerCase();
  const userState = (userLoc?.state || '').trim().toLowerCase();
  const userCountry = (userLoc?.country || '').trim().toLowerCase();

  // Tier 1: Distance Sub-Tier Buckets (GPS distance available and <= 25 km)
  if (typeof effectiveDist === 'number' && effectiveDist >= 0 && effectiveDist <= 25) {
    if (effectiveDist <= 2) {
      return {
        tier: 1,
        subTier: 1,
        label: 'Immediate',
        dist: effectiveDist,
        fullLabel: `Immediate (≤ 2 km) • ${effectiveDist.toFixed(1)} km`,
      };
    }
    if (effectiveDist <= 5) {
      return {
        tier: 1,
        subTier: 2,
        label: 'Very Near',
        dist: effectiveDist,
        fullLabel: `Very Near (≤ 5 km) • ${effectiveDist.toFixed(1)} km`,
      };
    }
    if (effectiveDist <= 10) {
      return {
        tier: 1,
        subTier: 3,
        label: 'Near',
        dist: effectiveDist,
        fullLabel: `Near (≤ 10 km) • ${effectiveDist.toFixed(1)} km`,
      };
    }
    return {
      tier: 1,
      subTier: 4,
      label: 'Nearby',
      dist: effectiveDist,
      fullLabel: `Nearby (≤ 25 km) • ${effectiveDist.toFixed(1)} km`,
    };
  }

  const formattedDistSuffix = typeof effectiveDist === 'number' && Number.isFinite(effectiveDist) ? ` • ${effectiveDist.toFixed(1)} km` : '';

  // Tier 2: Same Area
  if (
    userArea.length > 1 &&
    (areaLower.includes(userArea) || addressText.includes(userArea))
  ) {
    const displayArea = item.area || userLoc?.area || 'Area';
    return {
      tier: 2,
      subTier: 1,
      label: 'Area',
      dist: effectiveDist,
      fullLabel: `Area • ${displayArea}${formattedDistSuffix}`,
    };
  }

  // Tier 3: Same City
  if (
    userCity.length > 1 &&
    (cityLower.includes(userCity) || addressText.includes(userCity))
  ) {
    const displayCity = item.city || item.preferred_work_city || userLoc?.city || 'City';
    return {
      tier: 3,
      subTier: 1,
      label: 'City',
      dist: effectiveDist,
      fullLabel: `City • ${displayCity}${formattedDistSuffix}`,
    };
  }

  // Tier 4: Same State
  if (
    userState.length > 1 &&
    (stateLower.includes(userState) || addressText.includes(userState))
  ) {
    const displayState = item.state || userLoc?.state || 'State';
    return {
      tier: 4,
      subTier: 1,
      label: 'State',
      dist: effectiveDist,
      fullLabel: `State • ${displayState}${formattedDistSuffix}`,
    };
  }

  // Tier 5: Same Country
  if (
    userCountry.length > 1 &&
    (countryLower.includes(userCountry) || addressText.includes(userCountry))
  ) {
    const displayCountry = item.country || userLoc?.country || 'India';
    return {
      tier: 5,
      subTier: 1,
      label: 'Country',
      dist: effectiveDist,
      fullLabel: `Country • ${displayCountry}${formattedDistSuffix}`,
    };
  }

  const fallbackLocationStr = (
    item.full_address ||
    item.address ||
    item.current_address ||
    item.preferred_work_city ||
    item.city ||
    item.area ||
    ''
  ).trim();

  let fallbackFullLabel = 'Location unavailable';
  if (typeof effectiveDist === 'number' && Number.isFinite(effectiveDist)) {
    fallbackFullLabel = `${effectiveDist.toFixed(1)} km`;
  } else if (fallbackLocationStr) {
    fallbackFullLabel = fallbackLocationStr;
  }

  return {
    tier: 6,
    subTier: 1,
    label: 'Other',
    dist: effectiveDist,
    fullLabel: fallbackFullLabel,
  };
}

/**
 * Computes Search Relevance score (1 = highest relevance, 5 = lowest)
 */
export function computeSearchRelevance(
  item: {
    business_name?: string;
    name?: string;
    categories?: string[];
    profession?: string;
    full_address?: string;
    address?: string;
    business_description?: string;
  },
  searchTerm?: string
): number {
  if (!searchTerm || !searchTerm.trim()) {
    return 5;
  }

  const term = searchTerm.trim().toLowerCase();
  const name = (item.business_name || item.name || '').toLowerCase();
  const cats = (item.categories || []).map((c) => c.toLowerCase());
  const prof = (item.profession || '').toLowerCase();
  const addr = (item.full_address || item.address || '').toLowerCase();

  // Score 1: Name starts with search term or exact match
  if (name === term || name.startsWith(term)) {
    return 1;
  }

  // Score 2: Name contains search term
  if (name.includes(term)) {
    return 2;
  }

  // Score 3: Category or Profession match
  if (cats.some((c) => c.includes(term)) || prof.includes(term)) {
    return 3;
  }

  // Score 4: Address or description contains search term
  if (addr.includes(term)) {
    return 4;
  }

  return 5;
}

/**
 * Sorts items by Search Relevance -> Tier -> SubTier -> Distance
 */
export function sortItemsByLocationPreference<T extends any>(
  items: T[],
  userLoc?: LocationInfo | null,
  searchTerm?: string
): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return [...items].sort((a, b) => {
    // 1. Search Relevance (if searching)
    if (searchTerm && searchTerm.trim()) {
      const relA = computeSearchRelevance(a as any, searchTerm);
      const relB = computeSearchRelevance(b as any, searchTerm);
      if (relA !== relB) {
        return relA - relB;
      }
    }

    // 2. Location Tier
    const resA = computeLocationTier(a as any, userLoc);
    const resB = computeLocationTier(b as any, userLoc);

    if (resA.tier !== resB.tier) {
      return resA.tier - resB.tier;
    }

    // 3. SubTier (Immediate -> Very Near -> Near -> Nearby)
    if (resA.subTier !== resB.subTier) {
      return resA.subTier - resB.subTier;
    }

    // 4. Distance within subTier
    const distA = typeof resA.dist === 'number' ? resA.dist : 999999;
    const distB = typeof resB.dist === 'number' ? resB.dist : 999999;

    if (distA !== distB) {
      return distA - distB;
    }

    return 0;
  });
}

/**
 * Group items into sections (Immediate, Very Near, Near, Nearby, Area, City, State, Country, Other)
 */
export function groupItemsByLocationTier<T extends any>(
  items: T[],
  userLoc?: LocationInfo | null
): { title: string; label: SubTierLabel; data: T[] }[] {
  const sorted = sortItemsByLocationPreference(items, userLoc);
  const groups = new Map<string, { title: string; label: SubTierLabel; data: T[] }>();

  sorted.forEach((item) => {
    const tierInfo = computeLocationTier(item as any, userLoc);
    const key = `${tierInfo.tier}-${tierInfo.subTier}-${tierInfo.label}`;

    if (!groups.has(key)) {
      let title: string = tierInfo.label;
      if (tierInfo.tier === 1) {
        if (tierInfo.subTier === 1) title = 'Immediate (≤ 2 km)';
        else if (tierInfo.subTier === 2) title = 'Very Near (≤ 5 km)';
        else if (tierInfo.subTier === 3) title = 'Near (≤ 10 km)';
        else title = 'Nearby (≤ 25 km)';
      } else if (tierInfo.tier === 2) {
        title = `Area (${userLoc?.area || 'Local'})`;
      } else if (tierInfo.tier === 3) {
        title = `City (${userLoc?.city || 'City'})`;
      } else if (tierInfo.tier === 4) {
        title = `State (${userLoc?.state || 'State'})`;
      } else if (tierInfo.tier === 5) {
        title = `Country (${userLoc?.country || 'India'})`;
      } else {
        title = 'Other Locations';
      }

      groups.set(key, { title, label: tierInfo.label, data: [] });
    }

    groups.get(key)!.data.push(item);
  });

  return Array.from(groups.values());
}
