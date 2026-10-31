/**
 * File: frontend/src/types/gitaStory.ts
 *
 * Normalized TypeScript Interfaces for Brahmand Library - Cosmic Storyteller Mode ("मैं समय हूँ").
 * Strictly matches Phase 1 backend Pydantic models (backend/schemas/gita_story_schema.py).
 */

export type ReviewStatus = 'draft' | 'scholar_review' | 'approved' | 'published';

export type StorySpeaker =
  | 'काल_समय'
  | 'धृतराष्ट्र'
  | 'सञ्जय'
  | 'दुर्योधन'
  | 'अर्जुन'
  | 'श्रीभगवान्';

export interface DialogueItem {
  speaker: StorySpeaker;
  speaker_display: string;
  dialogue_hindi: string;
  sanskrit_shloka?: string | null;
  verse_ref?: string | null;
}

export interface ChintanBindu {
  sutra_title: string;
  vedantic_concept: string;
  inner_reflection: string;
}

export interface StoryScene {
  scene_id: string;
  seq: number;
  title_hi: string;
  title_en: string;
  start_verse: number;
  end_verse: number;
  display_range: string;
  narrative_hindi: string;
  dialogues: DialogueItem[];
  chintan_bindu: ChintanBindu;
  deeper_study_ref: string;
  transcript: string;
  duration_seconds_est?: number | null;
}

export interface GitaStoryChapter {
  chapter: number;
  title_sanskrit: string;
  title_hindi: string;
  title_english: string;
  total_verses: number;
  theological_framing_disclaimer: string;
  time_opening_monologue: string;
  review_status: ReviewStatus;
  scholar_reviewer?: string | null;
  scenes: StoryScene[];
}

export interface TimingCue {
  scene_id?: string;
  mark: string;
  text: string;
  start_ms: number;
  end_ms: number;
}

export interface TimingManifest {
  scene_id: string;
  total_duration_ms: number;
  cues: TimingCue[];
}
