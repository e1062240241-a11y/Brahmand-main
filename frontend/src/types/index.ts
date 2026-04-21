export interface User {
  id: string;
  sl_id: string;
  name: string;
  photo?: string;
  phone?: string;
  online_status?: boolean;
  last_seen_at?: string;
  last_active?: string;
  updated_at?: string;
  bio?: string;
  language: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  place_of_birth_latitude?: number;
  place_of_birth_longitude?: number;
  location?: Location;
  home_location?: {
    latitude?: number;
    longitude?: number;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  office_location?: {
    latitude?: number;
    longitude?: number;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  badges: string[];
  reputation: number;
  communities: string[];
  circles: string[];
  created_at: string;
}

export interface Location {
  country: string;
  state: string;
  city: string;
  area: string;
}

export interface Community {
  id: string;
  name: string;
  type: string;
  code: string;
  member_count: number;
  subgroups: Subgroup[];
}

export interface Subgroup {
  name: string;
  type: string;
  rules: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  code: string;
  privacy: 'private' | 'invite_code';
  creator_id: string;
  admin_id: string;
  admin_ids?: string[];
  members?: CircleMember[];
  member_count: number;
  is_admin: boolean;
  created_at: string;
}

export interface CircleMember {
  user_id: string;
  name: string;
  sl_id?: string;
  photo?: string;
}

export interface CircleJoinRequest {
  id: string;
  circle_id: string;
  user_id: string;
  user_name: string;
  user_sl_id?: string;
  user_photo?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_photo?: string;
  content?: string;
  text?: string;
  message_type: string;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  chat_id?: string;
  user: {
    id: string;
    sl_id: string;
    name: string;
    photo?: string;
    online_status?: boolean;
    last_seen_at?: string;
    last_active?: string;
    updated_at?: string;
  };
  last_message: string;
  last_message_at: string;
  created_at?: string;
  request_status?: 'pending' | 'approved' | 'rejected';
  request_by?: string;
  request_retry_after?: string;
}
