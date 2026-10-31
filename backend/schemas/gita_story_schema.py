# File: backend/schemas/gita_story_schema.py
"""
Normalized Pydantic Schemas for Brahmand Library - Cosmic Storyteller Mode ("मैं समय हूँ").
Provides type-safe models for dramatic chapter scripts, character dialogues,
and Vedantic reflection points with strict canonical integers and enum literals.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class ReviewStatus(str, Enum):
    DRAFT = "draft"
    SCHOLAR_REVIEW = "scholar_review"
    APPROVED = "approved"
    PUBLISHED = "published"


class StorySpeaker(str, Enum):
    TIME_NARRATOR = "काल_समय"
    DHRITARASHTRA = "धृतराष्ट्र"
    SANJAYA = "सञ्जय"
    DURYODHANA = "दुर्योधन"
    ARJUNA = "अर्जुन"
    KRISHNA = "श्रीभगवान्"


class DialogueItem(BaseModel):
    speaker: StorySpeaker = Field(..., description="Canonical speaker identity")
    speaker_display: str = Field(..., description="Localized display name e.g. 'धृतराष्ट्र'")
    dialogue_hindi: str = Field(..., description="Spoken dialogue in polished Hindi")
    sanskrit_shloka: Optional[str] = Field(None, description="Exact verbatim Sanskrit verse text")
    verse_ref: Optional[str] = Field(None, description="Verse reference e.g. '१.१' or '1.1'")

    @field_validator("speaker_display")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("speaker_display cannot be blank")
        return v.strip()


class ChintanBindu(BaseModel):
    """
    Philosophical reflection point (not a prescriptive modern life hack).
    Rooted in classical Vedantic inquiry (आत्म-परीक्षण).
    """
    sutra_title: str = Field(..., description="Reflective heading e.g. 'मोह और कर्तव्य का द्वंद्व'")
    vedantic_concept: str = Field(..., description="Scriptural principle e.g. 'राग-द्वेष, अविवेक, स्वधर्म'")
    inner_reflection: str = Field(..., description="Contemplative inquiry for personal spiritual growth")


class StoryScene(BaseModel):
    scene_id: str = Field(..., description="Canonical format: scene_{chapter}_{seq}")
    seq: int = Field(..., ge=1, description="Sequence order within the chapter")
    title_hi: str = Field(..., description="Dramatic scene title in Hindi")
    title_en: str = Field(..., description="Dramatic scene title in English")
    start_verse: int = Field(..., ge=1, le=78, description="Canonical start verse integer")
    end_verse: int = Field(..., ge=1, le=78, description="Canonical end verse integer")
    display_range: str = Field(..., description="Devanagari display string e.g. '१.१ - १.२'")
    narrative_hindi: str = Field(..., description="Cinematic narration delivered by the Voice of Time")
    dialogues: List[DialogueItem] = Field(default_factory=list, description="Dramatic dialogues within scene")
    chintan_bindu: ChintanBindu = Field(..., description="Vedantic contemplation for this scene")
    deeper_study_ref: str = Field(..., description="Internal route to classical verse view")
    transcript: str = Field(..., description="Full unified speech transcript for a11y & screen readers")
    duration_seconds_est: Optional[int] = Field(None, description="Estimated audio narration duration in seconds")

    @model_validator(mode="after")
    def validate_verse_bounds(self) -> "StoryScene":
        if self.start_verse > self.end_verse:
            raise ValueError(f"start_verse ({self.start_verse}) must be <= end_verse ({self.end_verse})")
        return self


class GitaStoryChapter(BaseModel):
    chapter: int = Field(..., ge=1, le=18, description="Chapter number (1 to 18)")
    title_sanskrit: str = Field(..., description="Sanskrit title e.g. 'अर्जुनविषादयोग'")
    title_hindi: str = Field(..., description="Hindi thematic title e.g. 'कुरुक्षेत्र का शंखनाद और गाण्डीव का गिरना'")
    title_english: str = Field(..., description="English title e.g. 'The Yoga of Dejection of Arjuna'")
    total_verses: int = Field(..., ge=1, description="Total verses in the chapter")
    theological_framing_disclaimer: str = Field(
        ...,
        description="Mandatory disclaimer clarifying the 'सूत्रात्मक परिप्रेक्ष्य' (Narrative Perspective) of Time"
    )
    time_opening_monologue: str = Field(..., description="Cosmic opening monologue of Time ('मैं समय हूँ...')")
    review_status: ReviewStatus = Field(default=ReviewStatus.DRAFT, description="Scriptural audit lifecycle stage")
    scholar_reviewer: Optional[str] = Field(None, description="Name/Institution of verifying scholar")
    scenes: List[StoryScene] = Field(..., min_length=1, description="Dramatic acts covering all verses")

    @model_validator(mode="after")
    def validate_full_verse_coverage(self) -> "GitaStoryChapter":
        if not self.scenes:
            raise ValueError("Chapter must contain at least one story scene")
        
        # Verify first scene starts at 1
        if self.scenes[0].start_verse != 1:
            raise ValueError(f"First scene must start at verse 1, found {self.scenes[0].start_verse}")
        
        # Verify contiguous coverage
        for i in range(len(self.scenes) - 1):
            cur = self.scenes[i]
            nxt = self.scenes[i + 1]
            if nxt.start_verse != cur.end_verse + 1:
                raise ValueError(
                    f"Gap or overlap in verse coverage between scene {cur.scene_id} (ends {cur.end_verse}) "
                    f"and {nxt.scene_id} (starts {nxt.start_verse})"
                )
        
        # Verify last scene reaches total_verses
        last_scene = self.scenes[-1]
        if last_scene.end_verse != self.total_verses:
            raise ValueError(
                f"Last scene ends at verse {last_scene.end_verse}, but chapter has {self.total_verses} verses"
            )
        
        return self
