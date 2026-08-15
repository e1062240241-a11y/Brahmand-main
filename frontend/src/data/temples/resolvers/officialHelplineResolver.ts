import { findFirstMatchingRule } from './officialWebsiteResolver';
import { OFFICIAL_HELPLINE_RULES } from '../rules/officialHelplineRules';
import type { OfficialHelplineRule, TempleMatchContext } from '../types';

export const resolveOfficialHelplineRule = (
  ctx: TempleMatchContext
): OfficialHelplineRule | null => {
  return findFirstMatchingRule(ctx, OFFICIAL_HELPLINE_RULES);
};
