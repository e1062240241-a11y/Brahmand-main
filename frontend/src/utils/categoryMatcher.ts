export const isCategoryMatch = (vendorCat: string, targetCat: string): boolean => {
  if (!vendorCat || !targetCat) return false;
  const v = vendorCat.trim().toLowerCase();
  const t = targetCat.trim().toLowerCase();
  if (!v || !t) return false;

  // Direct match or substring in either direction
  if (v === t || v.includes(t) || t.includes(v)) return true;

  // Synonym/Stem groups for flexible matching
  const groups: string[][] = [
    ['pandit', 'panditji', 'pandits', 'pooja', 'pooja samagri', 'pandit services'],
    ['astrologer', 'astrology', 'astrologers', 'vastu'],
    ['electrician', 'electrical', 'electronics', 'electricians'],
    ['carpenter', 'carpentry', 'woodwork'],
    ['plumber', 'plumbing'],
    ['general store', 'grocery', 'sweets', 'kirana', 'store', 'departmental store'],
    ['dairy', 'milk', 'dairy products'],
    ['salon', 'parlour', 'barber', 'beauty', 'hair'],
    ['gym', 'fitness', 'yoga', 'gym trainer', 'yoga trainer'],
    ['restaurant', 'catering', 'food'],
  ];

  return groups.some((group) =>
    group.some((item) => v.includes(item) || item.includes(v)) &&
    group.some((item) => t.includes(item) || item.includes(t))
  );
};
