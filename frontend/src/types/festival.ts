import { ImageSourcePropType } from 'react-native';

export interface FestivalEvent {
  id: string;
  title: string;
  time: string;
  location?: string;
  description?: string;
  attendeesCount?: number;
  badge?: string;
}

export interface FestivalScheduleItem {
  id: string;
  name: string;
  time: string;
  priest?: string;
  description?: string;
  isImportant?: boolean;
}

export interface KathaStatus {
  isLive: boolean;
  title: string;
  speaker: string;
  currentChapter?: string;
  listenersCount?: number;
  scheduledTime?: string;
}

export interface FestivalData {
  id: string;
  name: string;
  nameHi?: string;
  date: string;
  description: string;
  gradientColors: [string, string, string]; // Dynamic 3-stop theme gradient
  emblem: ImageSourcePropType | string; // Local asset, remote URL, or icon name
  emblemType?: 'image' | 'icon' | 'symbol';
  deity?: string;
  tithi?: string;
  shubhMuhurat?: string;
  aartiSchedule?: FestivalScheduleItem[];
  kathaStatus?: KathaStatus;
  communityEvents?: FestivalEvent[];
}
