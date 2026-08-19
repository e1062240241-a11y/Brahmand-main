export type TempleMatchMode = 'includes' | 'wordBoundary';

export interface AuthenticTempleDetails {
  about: string;
  mythologicalSignificance?: string;
  history?: string;
  architecture?: string;
  sacredRituals?: string;
  festivals?: string[];
  pilgrimageCircuit?: string;
}

export interface AuthenticDarshanDetails {
  opening: string;
  closing: string;
  generalDarshan?: string;
  vipDarshan?: string;
  aartis?: Record<string, string>;
}

export interface VisitorGuideline {
  icon: string;
  title: string;
  points: string[];
  prohibitedItems?: string[];
}

export interface TempleMatchContext {
  temple?: any;
  templeId?: string | null;
  templeKey?: string | null;
  templeContact?: string | null;
  specialTempleData?: any;
  authenticTempleDetails?: AuthenticTempleDetails | null;
  fallbackTemple?: any;
  locationStr?: string;
}

export interface TempleRuleCondition {
  any?: string[];
  all?: string[];
  not?: string[];
  or?: TempleRuleCondition[];
}

export interface TempleRuleBase {
  id: string;
  condition: TempleRuleCondition;
  mode?: TempleMatchMode;
  disabled?: boolean;
}

export interface OfficialWebsiteRule extends TempleRuleBase {
  website: string;
}

export interface OfficialHelplineRule extends TempleRuleBase {
  helpline: string;
}

export interface DarshanDetailsRule extends TempleRuleBase {
  darshan: AuthenticDarshanDetails;
}

export interface FacilitiesRule extends TempleRuleBase {
  facilities: string[];
}

export interface VisitorGuidelinesRule extends TempleRuleBase {
  guidelines: VisitorGuideline[];
}

export interface AuthenticTempleDetailsRule extends TempleRuleBase {
  details: AuthenticTempleDetails;
}
