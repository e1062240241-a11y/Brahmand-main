import type { TempleMatchContext } from './types';

const toLower = (value?: string | null) => (value || '').toLowerCase();

export const createIncludesMatcher = (ctx: TempleMatchContext) => {
  const nameLower = toLower(ctx.temple?.name);
  const idLower = toLower(ctx.templeId);
  const keyLower = toLower(ctx.templeKey);

  return (keyword: string): boolean => {
    const target = toLower(keyword);

    return (
      nameLower.includes(target) ||
      idLower.includes(target) ||
      keyLower.includes(target)
    );
  };
};

export const createWordBoundaryMatcher = (ctx: TempleMatchContext) => {
  const nameLower = toLower(ctx.temple?.name);
  const idLower = toLower(ctx.templeId);

  return (keyword: string): boolean => {
    const target = toLower(keyword);

    if (!target) return false;

    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');

    return regex.test(nameLower) || regex.test(idLower);
  };
};
