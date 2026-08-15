import { findFirstMatchingRule } from './officialWebsiteResolver';
import { FACILITIES_RULES } from '../rules/facilitiesRules';
import type { FacilitiesRule, TempleMatchContext } from '../types';

export const resolveFacilitiesRule = (
  ctx: TempleMatchContext
): FacilitiesRule | null => {
  return findFirstMatchingRule(ctx, FACILITIES_RULES);
};
