import { findFirstMatchingRule } from './officialWebsiteResolver';
import { DEFAULT_VISITOR_GUIDELINES } from '../rules/defaultVisitorGuidelines';
import { VISITOR_GUIDELINES_RULES } from '../rules/visitorGuidelinesRules';
import type { TempleMatchContext, VisitorGuideline } from '../types';

export const resolveVisitorGuidelinesRule = (ctx: TempleMatchContext): VisitorGuideline[] => {
  const rule = findFirstMatchingRule(ctx, VISITOR_GUIDELINES_RULES);
  return rule?.guidelines || DEFAULT_VISITOR_GUIDELINES;
};
