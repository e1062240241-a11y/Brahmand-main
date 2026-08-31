export interface CommunityUser {
  id?: string;
  name?: string;
  photo?: string | null;
  isVerified?: boolean;
  is_verified?: boolean;
  verificationLabel?: string;
  contact?: string;
  phone?: string;
  contact_number?: string;
}

export interface CommunityPost {
  id: string;
  content?: string;
  description?: string;
  title?: string;
  category?: string;
  timestamp?: string;
  created_at?: string;
  user?: CommunityUser;
  user_id?: string;
  sender_id?: string;
  user_name?: string;
  user_photo?: string;
  image?: string | any;
  image_url?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | string;
  video_url?: string;
  likes?: number;
  likes_count?: number;
  comments?: number;
  comments_count?: number;
  reposts?: number;
  isLiked?: boolean;
  is_liked?: boolean;
  threadParentId?: string;
  isNationalAnnouncement?: boolean;
  isStateAnnouncement?: boolean;
  contact_number?: string;
  location?: string;
  sevaDetails?: string;
  urgency_level?: 'normal' | 'urgent' | 'critical';
  request_type?: string;
  type?: string;
  isRequestItem?: boolean;
  isRequestInFeed?: boolean;
  isEventItem?: boolean;
  isSevaPost?: boolean;
  isCommunityMsg?: boolean;
  festival_name?: string;
  festival?: string;
}

export interface CommunityRequest {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  request_type?: 'help' | 'seva' | 'lost_found' | 'temple_update' | string;
  urgency_level?: 'normal' | 'urgent' | 'critical';
  support_needed?: string;
  user_id?: string;
  user_name?: string;
  user_photo?: string;
  created_at?: string;
  timestamp?: string;
  image?: string;
  image_url?: string;
  media_url?: string;
  contact_number?: string;
  contact?: string;
  user_phone?: string;
  status?: string;
  location?: string;
  type?: string;
  isRequestItem?: boolean;
  isRequestInFeed?: boolean;
  isSevaPost?: boolean;
}

export interface FestivalEvent {
  id: string;
  name?: string;
  title?: string | null;
  description?: string;
  date?: string;
  time?: string;
  start_time?: string;
  location?: string | any;
  image?: string | any;
  image_url?: string;
  media_url?: string;
  organizer_name?: string;
  organizer?: {
    name: string;
    photo?: string | null;
    isVerified?: boolean;
  };
  timeAgo?: string;
  type?: string;
  isReal?: boolean;
  timestamp?: string;
  created_at?: string;
  festival_name?: string | null;
  festival?: string;
}

export interface DiscussionPost {
  id: string;
  threadParentId?: string;
  title?: string;
  content?: string;
  description?: string;
  user_id?: string;
  sender_id?: string;
  user_name?: string;
  user_photo?: string;
  user?: {
    name: string;
    photo?: any;
    isVerified?: boolean;
    verificationLabel?: string;
    handle?: string;
    isFeatured?: boolean;
  };
  timestamp?: string;
  created_at?: string;
  category?: string;
  type?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  liked?: boolean;
  isLiked?: boolean;
  isRepost?: boolean;
  repostedBy?: string;
  image?: string;
  hideBadge?: boolean;
  sevaDetails?: string;
  isStateAnnouncement?: boolean;
  isNationalAnnouncement?: boolean;
  isCommunityMsg?: boolean;
  communityId?: string;
  subgroupType?: string;
}
