export interface CommunityMemberCountSource {
  members_count?: number;
  member_count?: number;
  membersCount?: number;
  memberCount?: number;
  user_count?: number;
  users_count?: number;
  userCount?: number;
  usersCount?: number;
  members?: any[];
  users?: any[];
}

export const getCommunityMemberCount = (community?: CommunityMemberCountSource | null): number => {
  if (!community) return 0;

  const directCount =
    community.members_count ??
    community.member_count ??
    community.membersCount ??
    community.memberCount ??
    community.user_count ??
    community.users_count ??
    community.userCount ??
    community.usersCount;

  if (typeof directCount === 'number' && !Number.isNaN(directCount) && directCount > 0) {
    return directCount;
  }

  if (Array.isArray(community.members) && community.members.length > 0) {
    return community.members.length;
  }

  if (Array.isArray(community.users) && community.users.length > 0) {
    return community.users.length;
  }

  return 0;
};

export const isSevaRequest = (item: any): boolean => {
  if (!item) return false;
  const type = (item.request_type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const support = (item.support_needed || '').toLowerCase();

  if (type === 'temple' || type === 'gau' || type === 'animal') {
    return true;
  }
  if (
    type === 'help' &&
    (title.includes('temple') ||
      description.includes('temple') ||
      title.includes('seva') ||
      description.includes('seva') ||
      title.includes('donate') ||
      description.includes('donate') ||
      title.includes('donation') ||
      description.includes('donation') ||
      title.includes('bhandara') ||
      description.includes('bhandara') ||
      support.includes('temple') ||
      support.includes('seva') ||
      support.includes('donate') ||
      support.includes('donation'))
  ) {
    return true;
  }
  if (
    title.includes('seva') ||
    description.includes('seva') ||
    title.includes('temple') ||
    description.includes('temple') ||
    title.includes('donate') ||
    description.includes('donate') ||
    title.includes('donation') ||
    description.includes('donation')
  ) {
    return true;
  }
  return false;
};

export const isSevaPost = (item: any): boolean => {
  if (!item) return false;
  return (item.category || '').toLowerCase() === 'seva' || isSevaRequest(item);
};

export const isLostFoundRequest = (item: any): boolean => {
  if (!item) return false;
  const type = (item.request_type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const description = (item.description || item.content || '').toLowerCase();
  const support = (item.support_needed || '').toLowerCase().trim();
  const cat = (item.category || '').toLowerCase().trim();

  // Check category field first (covers community posts created with 'Lost & Found' category)
  if (cat === 'lost & found' || cat === 'lost_found' || cat === 'lost' || cat === 'found') return true;
  // Check request_type field (for API community requests)
  if (type === 'lost_found' || type === 'lost' || type === 'found') return true;
  // Keyword fallback for legacy items
  return (
    title.includes('lost') ||
    description.includes('lost') ||
    support.includes('lost') ||
    title.includes('found') ||
    description.includes('found') ||
    support.includes('found')
  );
};

export const isTempleUpdateRequest = (item: any): boolean => {
  if (!item) return false;
  const type = (item.request_type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const description = (item.description || item.content || '').toLowerCase();
  const support = (item.support_needed || '').toLowerCase().trim();
  const cat = (item.category || '').toLowerCase().trim();

  // Check category field first (covers community posts created with 'Temple Updates' category)
  if (cat === 'temple updates' || cat === 'temple_update' || cat === 'temple update') return true;
  // Check request_type field (for API community requests)
  if (type === 'temple_update') return true;
  // Keyword fallback for legacy items
  return (
    (title.includes('temple') || description.includes('temple') || support.includes('temple')) &&
    (title.includes('update') || description.includes('update') || title.includes('renovation') || description.includes('renovation'))
  );
};
