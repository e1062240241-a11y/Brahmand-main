import { ImageSourcePropType } from 'react-native';

export interface PracticalStep {
  stepNumber: number;
  action: string;
  idealTimeWindow?: string;
  significanceOrNote?: string;
}

export interface FestivalEvent {
  id: string;
  festivalId?: string;
  title: string;
  time: string;
  date?: string;
  location?: string;
  description?: string;
  attendeesCount?: number;
  badge?: string;
  practicalSteps?: PracticalStep[];
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
  venue?: string;
  city?: string;
  aartiSchedule?: FestivalScheduleItem[];
  kathaStatus?: KathaStatus;
  communityEvents?: FestivalEvent[];
}

export interface AttributionParams {
  from: string;
  uid: string;
  fest: string;
  [key: string]: string;
}
