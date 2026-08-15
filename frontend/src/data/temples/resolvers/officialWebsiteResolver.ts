import { evaluateCondition } from '../conditions';
import { createIncludesMatcher, createWordBoundaryMatcher } from '../matchers';
import { OFFICIAL_WEBSITE_RULES } from '../rules/officialWebsiteRules';
import type { OfficialWebsiteRule, TempleMatchContext, TempleRuleBase } from '../types';

export const findFirstMatchingRule = <T extends TempleRuleBase>(
  ctx: TempleMatchContext,
  rules: T[]
): T | null => {
  for (const rule of rules) {
    if (rule.disabled) continue;

    const match =
      rule.mode === 'wordBoundary'
        ? createWordBoundaryMatcher(ctx)
        : createIncludesMatcher(ctx);

    if (evaluateCondition(rule.condition, match)) {
      return rule;
    }
  }

  return null;
};

export const resolveOfficialWebsiteRule = (
  ctx: TempleMatchContext
): OfficialWebsiteRule | null => {
  return findFirstMatchingRule(ctx, OFFICIAL_WEBSITE_RULES);
};
