import { findFirstMatchingRule } from './officialWebsiteResolver';
import { AUTHENTIC_TEMPLE_DETAILS_RULES } from '../rules/authenticTempleDetailsRules';
import type { AuthenticTempleDetailsRule, TempleMatchContext } from '../types';

export const resolveAuthenticTempleDetailsRule = (
  ctx: TempleMatchContext
): AuthenticTempleDetailsRule | null => {
  return findFirstMatchingRule(ctx, AUTHENTIC_TEMPLE_DETAILS_RULES);
};
