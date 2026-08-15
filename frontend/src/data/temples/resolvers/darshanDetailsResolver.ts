import { findFirstMatchingRule } from './officialWebsiteResolver';
import { DARSHAN_DETAILS_RULES } from '../rules/darshanDetailsRules';
import type { DarshanDetailsRule, TempleMatchContext } from '../types';

export const resolveDarshanDetailsRule = (
  ctx: TempleMatchContext
): DarshanDetailsRule | null => {
  return findFirstMatchingRule(ctx, DARSHAN_DETAILS_RULES);
};
