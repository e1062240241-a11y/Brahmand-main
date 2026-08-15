import type { TempleRuleCondition } from './types';

export const evaluateCondition = (
  condition: TempleRuleCondition,
  match: (keyword: string) => boolean
): boolean => {
  if (condition.or && Array.isArray(condition.or) && condition.or.length > 0) {
    return condition.or.some(subCondition =>
      evaluateCondition(subCondition, match)
    );
  }

  let result = true;

  if (condition.any && condition.any.length > 0) {
    result = result && condition.any.some(match);
  }

  if (condition.all && condition.all.length > 0) {
    result = result && condition.all.every(match);
  }

  if (condition.not && condition.not.length > 0) {
    result = result && !condition.not.some(match);
  }

  return result;
};
