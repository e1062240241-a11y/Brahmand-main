import type {
  TempleMatchContext,
  AuthenticTempleDetails,
  AuthenticDarshanDetails,
  VisitorGuideline,
} from './temples/types';

export type {
  TempleMatchContext,
  AuthenticTempleDetails,
  AuthenticDarshanDetails,
  VisitorGuideline,
};

import {
  resolveOfficialWebsiteRule,
  resolveOfficialHelplineRule,
  resolveDarshanDetailsRule,
  resolveFacilitiesRule,
  DEFAULT_FACILITIES,
  resolveVisitorGuidelinesRule,
  resolveAuthenticTempleDetailsRule,
} from './temples';

// -------------------- 1. Official Website --------------------

export const getOfficialTempleWebsite = (ctx: TempleMatchContext): string | null => {
  const rawWebsite =
    ctx.temple?.website ||
    ctx.temple?.official_website ||
    ctx.temple?.website_url;

  if (
    rawWebsite &&
    typeof rawWebsite === 'string' &&
    rawWebsite.trim() &&
    !rawWebsite.includes('google.com/search')
  ) {
    return rawWebsite.trim();
  }

  const rule = resolveOfficialWebsiteRule(ctx);

  return rule?.website || null;
};

// -------------------- 2. Official Helpline --------------------

export const getOfficialTempleHelpline = (ctx: TempleMatchContext): string => {
  if (ctx.templeContact) return ctx.templeContact;

  const rule = resolveOfficialHelplineRule(ctx);
  if (rule) return rule.helpline;

  return '+91 1800 111 363 (Tourist Helpline)';
};

// -------------------- 3. Darshan Details --------------------

export const getAuthenticTempleDarshanDetails = (ctx: TempleMatchContext): AuthenticDarshanDetails | null => {
  const rule = resolveDarshanDetailsRule(ctx);
  return rule?.darshan || null;
};


// -------------------- 4. Authentic Temple Details --------------------

export const getAuthenticTempleDetails = (ctx: TempleMatchContext): AuthenticTempleDetails | null => {
  const rule = resolveAuthenticTempleDetailsRule(ctx);
  return rule?.details || null;
};

// -------------------- 5. Format Amenity Label --------------------

export const formatAmenityLabel = (amenity: string): string => {
  const lower = amenity.toLowerCase();
  if (lower.includes('parking')) return '🅿️ Parking';
  if (lower.includes('locker') || lower.includes('cloakroom') || lower.includes('bag')) return '🔒 Lockers';
  if (lower.includes('prasad') || lower.includes('laddu') || lower.includes('mahaprasad') || lower.includes('modak')) return '🍲 Prasad Counter';
  if (lower.includes('restroom') || lower.includes('washroom') || lower.includes('toilet')) return '🚻 Restrooms';
  if (lower.includes('water') || lower.includes('drinking')) return '🚰 Drinking Water';
  if (lower.includes('shoe') || lower.includes('paduka')) return '👟 Shoe Stand';
  if (lower.includes('wheelchair') || lower.includes('ramp') || lower.includes('senior') || lower.includes('golf cart') || lower.includes('battery car')) return '♿ Wheelchair Access';
  if (lower.includes('dharamshala') || lower.includes('ashram') || lower.includes('accommodation') || lower.includes('guest house') || lower.includes('gmvn')) return '🏨 Dharamshala';
  if (lower.includes('bhojanalaya') || lower.includes('annadanam') || lower.includes('langar') || lower.includes('restaurant') || lower.includes('anna prasadam') || lower.includes('annakshetra')) return '🍽️ Bhojanalaya';
  if (lower.includes('pooja') || lower.includes('puja') || lower.includes('bhasma') || lower.includes('seva') || lower.includes('booking')) return '📿 Puja Booking';
  if (lower.includes('medical') || lower.includes('first aid') || lower.includes('health')) return '🚑 Medical Aid';
  if (lower.includes('mobile') || lower.includes('camera') || lower.includes('deposit')) return '📱 Mobile Deposit';
  if (lower.includes('vip') || lower.includes('priority') || lower.includes('sugam') || lower.includes('queue')) return '⚡ VIP Queue Access';
  if (lower.includes('souvenir') || lower.includes('gift') || lower.includes('book')) return '🛍️ Souvenir Shops';
  if (lower.includes('ropeway') || lower.includes('pony') || lower.includes('helicopter')) return '🚁 Transport Assistance';
  if (lower.includes('kund') || lower.includes('spring') || lower.includes('sarovar')) return '🌊 Holy Kund / Sarovar';
  if (lower.includes('tonsuring') || lower.includes('kalyanakatta')) return '💈 Hair Tonsuring';
  if (lower.includes('atm')) return '🏪 ATM Counter';
  return `✨ ${amenity}`;
};

// -------------------- 6. Authentic Facilities --------------------

export const getAuthenticTempleFacilities = (ctx: TempleMatchContext): string[] => {
  if (
    ctx.temple?.facilities &&
    Array.isArray(ctx.temple.facilities) &&
    ctx.temple.facilities.length > 0
  ) {
    return ctx.temple.facilities;
  }

  const rule = resolveFacilitiesRule(ctx);

  return rule?.facilities || DEFAULT_FACILITIES;
};


// -------------------- 7. Visitor Guidelines --------------------

export const getAuthenticVisitorGuidelines = (ctx: TempleMatchContext): VisitorGuideline[] => {
  return resolveVisitorGuidelinesRule(ctx);
};

// -------------------- 8. Authentic Short Summary --------------------

export const getAuthenticShortSummary = (ctx: TempleMatchContext): string => {
  const genericPhrase = 'ancient holy temple offering rich spiritual';

  if (ctx.temple?.short_summary && !ctx.temple.short_summary.toLowerCase().includes(genericPhrase)) {
    return ctx.temple.short_summary;
  }

  if (ctx.authenticTempleDetails?.about) {
    const firstSentence = ctx.authenticTempleDetails.about.split('.')[0].trim();
    if (firstSentence) return `${firstSentence}.`;
  }

  if (ctx.specialTempleData?.description) {
    const firstSentence = ctx.specialTempleData.description.split('.')[0].trim();
    if (firstSentence) return `${firstSentence}.`;
  }

  if (ctx.fallbackTemple?.description) {
    const firstSentence = ctx.fallbackTemple.description.split('.')[0].trim();
    if (firstSentence) return `${firstSentence}.`;
  }

  if (ctx.temple?.description && !ctx.temple.description.toLowerCase().includes(genericPhrase)) {
    const firstSentence = ctx.temple.description.split('.')[0].trim();
    if (firstSentence && firstSentence.length > 15) return `${firstSentence}.`;
  }

  const deityStr = ctx.temple?.deity || 'the Divine';
  const locStr = ctx.locationStr || '';
  const hasLoc = locStr && locStr !== 'Unknown location';

  if (hasLoc) {
    return `Revered sacred shrine of ${deityStr} in ${locStr}, welcoming pilgrims for divine darshan and blessings.`;
  }

  return `Sacred pilgrimage center dedicated to ${deityStr}, revered by devotees for its spiritual heritage.`;
};
