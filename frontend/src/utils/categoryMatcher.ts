// OPT: Extract keywords array outside function scope to prevent memory reallocation
const CATEGORY_KEYWORDS = [
  'gym', 'fitness', 'yoga', 'workout',
  'bakery', 'cake', 'sweets', 'baker',
  'pandit', 'panditji', 'pooja', 'purohit',
  'electrician', 'electrical', 'electric',
  'plumber', 'plumbing',
  'doctor', 'clinic', 'hospital', 'medical', 'pharmacy',
  'carpenter', 'carpentry', 'woodwork',
  'salon', 'parlour', 'barber', 'beauty', 'haircut',
  'grocery', 'kirana', 'general store', 'supermarket',
  'dairy', 'milk',
  'astrologer', 'astrology', 'vastu', 'jyotish',
  'restaurant', 'catering', 'cafe', 'food',
  'mechanic', 'garage', 'repair',
  'tailor', 'boutique',
  'painter', 'painting',
  'cleaner', 'maid', 'cook'
];

// OPT: Extract static group dictionary outside function to prevent reallocation on every call
// Synonym/Stem groups for flexible matching
const CATEGORY_GROUPS: string[][] = [
  ['pandit', 'panditji', 'pandits', 'pooja', 'pooja samagri', 'purohit', 'pandit services'],
  ['astrologer', 'astrology', 'astrologers', 'vastu', 'jyotish'],
  ['electrician', 'electrical', 'electronics', 'electricians', 'electric repair'],
  ['carpenter', 'carpentry', 'woodwork', 'carpenters'],
  ['plumber', 'plumbing', 'plumbers', 'pipe repair'],
  ['general store', 'grocery', 'sweets', 'kirana', 'store', 'departmental store', 'supermarket'],
  ['dairy', 'milk', 'dairy products'],
  ['salon', 'parlour', 'barber', 'beauty', 'hair', 'haircut'],
  ['gym', 'fitness', 'yoga', 'gym trainer', 'yoga trainer', 'workout', 'health club'],
  ['restaurant', 'catering', 'food', 'bakery', 'cafe', 'baker', 'cake', 'pastry'],
  ['doctor', 'clinic', 'hospital', 'medical', 'physician', 'pharmacy'],
  ['mechanic', 'auto repair', 'garage', 'bike repair', 'car repair'],
  ['painter', 'painting', 'wall painter'],
  ['tailor', 'boutique', 'stitching'],
  ['cleaner', 'housemaid', 'maid', 'cleaning', 'cook'],
];

export const isCategoryMatch = (vendorCat: string, targetCat: string): boolean => {
  if (!vendorCat || !targetCat) return false;
  const v = vendorCat.trim().toLowerCase();
  const t = targetCat.trim().toLowerCase();
  if (!v || !t) return false;

  // Direct match or substring in either direction
  if (v === t || v.includes(t) || t.includes(v)) return true;

  return CATEGORY_GROUPS.some((group) =>
    group.some((item) => v.includes(item) || item.includes(v)) &&
    group.some((item) => t.includes(item) || item.includes(t))
  );
};

export const isCategoryQuery = (query: string, allCategories?: string[]): boolean => {
  if (!query || !query.trim()) return false;
  const q = query.trim().toLowerCase();

  if (CATEGORY_KEYWORDS.some((k) => q === k || q.includes(k) || k.includes(q))) {
    return true;
  }

  if (Array.isArray(allCategories) && allCategories.length > 0) {
    return allCategories.some((cat) => isCategoryMatch(cat, q));
  }

  return false;
};

/**
 * Smart search filter that prioritizes Category/Profession & Business Name matches.
 * Address and description matches are strictly fallback-only.
 */
export function filterVendorsBySmartSearch<T extends {
  business_name?: string;
  name?: string;
  categories?: string[];
  profession?: string;
  full_address?: string;
  address?: string;
  business_description?: string;
}>(items: T[], searchTerm?: string): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!searchTerm || !searchTerm.trim()) return items;

  const term = searchTerm.trim().toLowerCase();
  const isCatSearch = isCategoryQuery(term);

  // Phase 1: Strong Category & Business Name matches
  const strongMatches = items.filter((item) => {
    const cats = item.categories || [];
    const prof = item.profession || '';
    const name = (item.business_name || item.name || '').toLowerCase();

    // Check category/profession match
    const hasCategoryMatch =
      cats.some((c) => isCategoryMatch(c, term)) ||
      (prof.length > 0 && isCategoryMatch(prof, term));

    // Check business name match
    const hasNameMatch = name.includes(term);

    return hasCategoryMatch || hasNameMatch;
  });

  // If query is a category search or if strong matches exist, return strong matches ONLY.
  // This eliminates unrelated businesses (e.g. bakery on "Gymkhana Road" when searching "gym").
  if (isCatSearch || strongMatches.length > 0) {
    return strongMatches;
  }

  // Phase 2: Fallback to Address & Description matches ONLY when no strong matches exist
  return items.filter((item) => {
    const addr = (item.full_address || item.address || '').toLowerCase();
    const desc = (item.business_description || '').toLowerCase();
    return addr.includes(term) || desc.includes(term);
  });
}
