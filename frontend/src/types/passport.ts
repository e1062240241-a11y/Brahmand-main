export type PassportJourneyVisibility = 'private' | 'public';
export type PassportMediaType = 'photo' | 'video';

export interface PassportMediaItem {
  id: string;
  uri: string;
  type: PassportMediaType;
}

export interface PassportAnswer {
  question: string;
  answer: string;
}

export interface PassportJourney {
  id: string;
  title: string;
  location: string;
  date: string;
  visibility: PassportJourneyVisibility;
  media: PassportMediaItem[];
  answers: PassportAnswer[];
  generated_story: string;
}

export interface PassportBadge {
  id: string;
  title: string;
  description: string;
  earned_at: string;
}

export interface PassportCertificate {
  id: string;
  book_name: string;
  completion_days: number;
  date: string;
}
