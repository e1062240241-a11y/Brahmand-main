/**
 * File: frontend/src/constants/gitaStoryFraming.ts
 * 
 * Scriptural UI Framing Constants for Brahmand Library's
 * Cosmic Storyteller Mode ("मैं समय हूँ").
 * 
 * Defines theological disclaimers, speaker visual tokens, mode labels,
 * and accessibility strings for the dramatized narrative perspective.
 */

export * from '../types/gitaStory';

export type GitaViewMode = 'classical' | 'story';

export type StorySpeakerKey =
  | 'TIME_NARRATOR'
  | 'DHRITARASHTRA'
  | 'SANJAYA'
  | 'DURYODHANA'
  | 'ARJUNA'
  | 'KRISHNA';

export interface SpeakerMeta {
  key: StorySpeakerKey;
  labelHi: string;
  labelEn: string;
  titleHi: string;
  badgeBg: string;
  badgeTextColor: string;
  borderColor: string;
  iconName: string;
}

export const GITA_THEOLOGICAL_FRAMING = {
  /**
   * Essential theological disclaimer preserving scriptural orthodoxy.
   * Clarifies that "Time" is a dramatic narrative lens, not a divine claim.
   */
  DISCLAIMER_HI:
    'यह कथा-प्रवाह, काल-चेतना के सूत्रात्मक परिप्रेक्ष्य से कही गई एक नाट्यमयी व्याख्या है। मूल गीता के सनातन श्लोक एवं श्रीभगवान् के वचनों की दिव्यता अक्षुण्ण है; यहाँ ‘समय’ केवल इतिहास और दर्शन के साक्षी रूप में कथा-तंतु को जोड़ता है।',
  DISCLAIMER_EN:
    'This narrative flow is a dramatic exposition presented from the perspective of Cosmic Time (Kāla). The sacred verses of the Gita and the divine words of the Lord remain pristine and paramount; Time serves solely as an experiential storytelling anchor.',

  SHORT_BADGE_HI: 'सूत्रात्मक परिप्रेक्ष्य • कथा प्रवाह',
  SHORT_BADGE_EN: 'Cosmic Narrative Perspective',

  TIME_TITLE_HI: '॥ मैं समय हूँ ॥',
  TIME_SUBTITLE_HI: 'अनादि • अनन्त • साक्षी',
  TIME_SUBTITLE_EN: 'The Eternal Witness',
} as const;

export const GITA_VIEW_MODE_LABELS = {
  classical: {
    titleHi: 'शास्त्रीय श्लोक',
    subtitleHi: 'मूल श्लोक, पदच्छेद एवं अन्वय',
    titleEn: 'Classical Verses',
    subtitleEn: 'Original Sanskrit & Commentary',
    icon: 'book-outline',
  },
  story: {
    titleHi: 'कथा प्रवाह (मैं समय हूँ)',
    subtitleHi: 'काल-साक्षी नाट्यमयी कथा',
    titleEn: 'Cosmic Storyteller',
    subtitleEn: 'Episodic Story by Time',
    icon: 'hourglass-outline',
  },
} as const;

export const STORY_SPEAKER_METAS: Record<StorySpeakerKey, SpeakerMeta> = {
  TIME_NARRATOR: {
    key: 'TIME_NARRATOR',
    labelHi: 'काल (समय)',
    labelEn: 'Time (The Witness)',
    titleHi: 'सूत्रधार • अनादि चेतना',
    badgeBg: '#FFF3E0',
    badgeTextColor: '#E65100',
    borderColor: '#FFB74D',
    iconName: 'hourglass',
  },
  DHRITARASHTRA: {
    key: 'DHRITARASHTRA',
    labelHi: 'धृतराष्ट्र',
    labelEn: 'King Dhritarashtra',
    titleHi: 'कौरव नरेश • हस्तिनापुर',
    badgeBg: '#EFEBE9',
    badgeTextColor: '#4E342E',
    borderColor: '#BCAAA4',
    iconName: 'shield',
  },
  SANJAYA: {
    key: 'SANJAYA',
    labelHi: 'सञ्जय',
    labelEn: 'Sanjaya',
    titleHi: 'दिव्य-दृष्टि युक्त सारथी',
    badgeBg: '#E0F7FA',
    badgeTextColor: '#006064',
    borderColor: '#80DEEA',
    iconName: 'eye',
  },
  DURYODHANA: {
    key: 'DURYODHANA',
    labelHi: 'दुर्योधन',
    labelEn: 'Prince Duryodhana',
    titleHi: 'कौरव ज्येष्ठ राजकुमार',
    badgeBg: '#FFEBEE',
    badgeTextColor: '#C62828',
    borderColor: '#EF9A9A',
    iconName: 'flag',
  },
  ARJUNA: {
    key: 'ARJUNA',
    labelHi: 'अर्जुन',
    labelEn: 'Arjuna (Partha)',
    titleHi: 'गाण्डीवधारी • पाण्डव महारथी',
    badgeBg: '#FFF8E1',
    badgeTextColor: '#F57F17',
    borderColor: '#FFE082',
    iconName: 'bow-arrow',
  },
  KRISHNA: {
    key: 'KRISHNA',
    labelHi: 'श्रीभगवान्',
    labelEn: 'Sri Bhagavan (Krishna)',
    titleHi: 'जगद्गुरु • पार्थसारथी',
    badgeBg: '#E3F2FD',
    badgeTextColor: '#0D47A1',
    borderColor: '#90CAF9',
    iconName: 'sparkles',
  },
};

export const STORY_UI_LABELS = {
  CHINTAN_BINDU_TITLE_HI: 'चिन्तन-बिन्दु (आत्म-परीक्षण)',
  CHINTAN_BINDU_TITLE_EN: 'Vedantic Contemplation',
  DEEPER_STUDY_CTA_HI: 'मूल श्लोक अध्ययन में देखें',
  DEEPER_STUDY_CTA_EN: 'Study Classical Shlokas',
  LISTEN_STORY_CTA_HI: 'समय की कथा सुनें',
  LISTEN_STORY_CTA_EN: 'Listen to Story Narration',
  TANPURA_TOGGLE_ON_HI: 'तानपूरा चालू',
  TANPURA_TOGGLE_OFF_HI: 'तानपूरा बंद',
  ACCESSIBILITY_TRANSCRIPT_TITLE_HI: 'सम्पूर्ण पाठ्य विवरण (Accessibility Transcript)',
  CHAPTER_ACTS_TITLE_HI: 'नाट्य प्रसंग (Dramatic Acts)',
} as const;

export const STORY_AUDIO_DEFAULTS = {
  voiceIdentifier: 'hi-IN-MadhurNeural', // Deep, resonant masculine voice of Time
  speechRate: '-8%',                     // Dignified, solemn, reflective cadence
  ambientDroneVolume: 0.14,              // 14% volume for subtle background Tanpura drone
  pauseBetweenActsMs: 700,               // Respectful breath between dramatic scenes
};
