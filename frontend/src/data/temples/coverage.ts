import { OFFICIAL_WEBSITE_RULES } from './rules/officialWebsiteRules';
import { OFFICIAL_HELPLINE_RULES } from './rules/officialHelplineRules';
import { DARSHAN_DETAILS_RULES } from './rules/darshanDetailsRules';
import { FACILITIES_RULES } from './rules/facilitiesRules';
import { VISITOR_GUIDELINES_RULES } from './rules/visitorGuidelinesRules';
import { AUTHENTIC_TEMPLE_DETAILS_RULES } from './rules/authenticTempleDetailsRules';

export interface TempleRuleCoverageSummary {
  officialWebsiteRules: number;
  officialHelplineRules: number;
  darshanDetailsRules: number;
  facilitiesRules: number;
  visitorGuidelinesRules: number;
  authenticTempleDetailsRules: number;
  totalRules: number;
  ruleIds: {
    officialWebsite: string[];
    officialHelpline: string[];
    darshanDetails: string[];
    facilities: string[];
    visitorGuidelines: string[];
    authenticTempleDetails: string[];
  };
  duplicateRuleIds: string[];
}

export const getTempleRuleCoverageSummary = (): TempleRuleCoverageSummary => {
  const officialWebsite = OFFICIAL_WEBSITE_RULES.map(rule => rule.id);
  const officialHelpline = OFFICIAL_HELPLINE_RULES.map(rule => rule.id);
  const darshanDetails = DARSHAN_DETAILS_RULES.map(rule => rule.id);
  const facilities = FACILITIES_RULES.map(rule => rule.id);
  const visitorGuidelines = VISITOR_GUIDELINES_RULES.map(rule => rule.id);
  const authenticTempleDetails = AUTHENTIC_TEMPLE_DETAILS_RULES.map(rule => rule.id);

  const getDomainDuplicates = (ids: string[], prefix: string) =>
    ids.filter((id, index) => ids.indexOf(id) !== index).map(id => `${prefix}:${id}`);

  const duplicateRuleIds = [
    ...getDomainDuplicates(officialWebsite, 'officialWebsite'),
    ...getDomainDuplicates(officialHelpline, 'officialHelpline'),
    ...getDomainDuplicates(darshanDetails, 'darshanDetails'),
    ...getDomainDuplicates(facilities, 'facilities'),
    ...getDomainDuplicates(visitorGuidelines, 'visitorGuidelines'),
    ...getDomainDuplicates(authenticTempleDetails, 'authenticTempleDetails'),
  ];

  return {
    officialWebsiteRules: officialWebsite.length,
    officialHelplineRules: officialHelpline.length,
    darshanDetailsRules: darshanDetails.length,
    facilitiesRules: facilities.length,
    visitorGuidelinesRules: visitorGuidelines.length,
    authenticTempleDetailsRules: authenticTempleDetails.length,
    totalRules:
      officialWebsite.length +
      officialHelpline.length +
      darshanDetails.length +
      facilities.length +
      visitorGuidelines.length +
      authenticTempleDetails.length,
    ruleIds: {
      officialWebsite,
      officialHelpline,
      darshanDetails,
      facilities,
      visitorGuidelines,
      authenticTempleDetails,
    },
    duplicateRuleIds: Array.from(new Set(duplicateRuleIds)),
  };
};
