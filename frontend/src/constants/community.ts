export const MAX_POST_CHAR_LIMIT = 250;
export const COMMUNITY_CACHE_DURATION_MS = 120000; // 2 minutes cache duration
export const THREAD_TIME_DIFF_MS = 60000; // 1 minute threshold for message thread grouping

export const COMMUNITY_TABS = [
  'Feed',
  'Requests',
  'Events',
  'Lost & Found',
  'Festivals',
  'Seva',
  'Temple Updates'
] as const;

export type CommunityTabType = (typeof COMMUNITY_TABS)[number];

export const POST_CATEGORIES = [
  'Others',
  'Requests',
  'Events',
  'Lost & Found',
  'Festivals',
  'Seva',
  'Temple Updates'
] as const;

export type PostCategoryType = (typeof POST_CATEGORIES)[number];
