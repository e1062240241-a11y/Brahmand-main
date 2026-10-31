/**
 * File: frontend/src/components/GitaStoryView.tsx
 *
 * Cosmic Storyteller Mode ("मैं समय हूँ") Native Component for Brahmand Library.
 *
 * Fully compatible with React Native (Android, iOS) and Expo Web:
 * - Collapsible theological framing disclaimer card.
 * - Cinematic opening monologue of Time ("मैं समय हूँ...") with golden typography.
 * - Dramatic scene acts with speaker-coded dialogues and Sanskrit shlokas.
 * - Active cue halo glow highlighting when narration audio reaches dialogue blocks.
 * - Vedantic contemplation Chintan-Bindu cards.
 * - Deep study navigation back to classical shlokas.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GITA_THEOLOGICAL_FRAMING,
  STORY_SPEAKER_METAS,
  STORY_UI_LABELS,
  SpeakerMeta,
} from '../constants/gitaStoryFraming';
import {
  GitaStoryChapter,
  StoryScene,
  DialogueItem,
  StorySpeaker,
} from '../types/gitaStory';
import { useStoryStore } from '../store/useStoryStore';

interface GitaStoryViewProps {
  chapterData: GitaStoryChapter;
  activeCueMark?: string | null;
  activeCueSceneId?: string | null;
  onPlayScene?: (scene: StoryScene) => void;
  onNavigateToStudy?: (studyRef: string) => void;
}

// Map canonical speaker string to UI visual token metadata
function getSpeakerMeta(speaker: StorySpeaker | string): SpeakerMeta {
  if (speaker === 'काल_समय' || speaker.includes('समय') || speaker.includes('काल')) {
    return STORY_SPEAKER_METAS.TIME_NARRATOR;
  }
  if (speaker === 'धृतराष्ट्र') {
    return STORY_SPEAKER_METAS.DHRITARASHTRA;
  }
  if (speaker === 'सञ्जय') {
    return STORY_SPEAKER_METAS.SANJAYA;
  }
  if (speaker === 'दुर्योधन') {
    return STORY_SPEAKER_METAS.DURYODHANA;
  }
  if (speaker === 'अर्जुन') {
    return STORY_SPEAKER_METAS.ARJUNA;
  }
  if (speaker === 'श्रीभगवान्' || speaker.includes('कृष्ण')) {
    return STORY_SPEAKER_METAS.KRISHNA;
  }
  return STORY_SPEAKER_METAS.TIME_NARRATOR;
}

// Theatrical emotional performance directions for dramatic storytelling
function getSpeakerEmotionTag(speaker: StorySpeaker | string): string {
  if (speaker === 'धृतराष्ट्र') {
    return 'अंधे राजा का संशय, मोह व भीतरी भय';
  }
  if (speaker === 'सञ्जय') {
    return 'तटस्थ एवं विस्मयकारी दिव्य दृष्टि';
  }
  if (speaker === 'दुर्योधन') {
    return 'अहंकार के आवरण में छिपा भीतरी भय';
  }
  if (speaker === 'अर्जुन') {
    return 'शोक, विषाद और कांपते हुए हाथ';
  }
  if (speaker === 'श्रीभगवान्' || speaker.includes('कृष्ण')) {
    return 'परम धीर-गंभीर, शांत एवं दिव्य चेतना';
  }
  return 'अनादि काल की गूंजती चेतना';
}

export const GitaStoryView: React.FC<GitaStoryViewProps> = ({
  chapterData,
  activeCueMark,
  activeCueSceneId,
  onPlayScene,
  onNavigateToStudy,
}) => {
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState<boolean>(false);
  const { currentPlayingSceneId, isPlaying } = useStoryStore();

  const fullStoryScene: StoryScene = useMemo(() => ({
    scene_id: 'full',
    seq: 0,
    title_hi: `अध्याय ${chapterData.chapter}: सम्पूर्ण काल-कथा प्रवाह`,
    title_en: `Chapter ${chapterData.chapter}: Complete Cosmic Narrative`,
    start_verse: 1,
    end_verse: chapterData.total_verses,
    display_range: `अध्याय ${chapterData.chapter}`,
    narrative_hindi: `श्रीमद्भगवद्गीता। अध्याय ${chapterData.chapter}—${chapterData.title_hindi}। ${chapterData.time_opening_monologue}`,
    dialogues: [],
    chintan_bindu: {
      sutra_title: 'काल-चेतना और मानवीय द्वंद्व',
      vedantic_concept: 'सनातन काल-प्रवाह (Cosmic Perspective)',
      inner_reflection: 'समय की अनंत धारा में हर द्वंद्व, हर संघर्ष और हर मोह अपनी नश्वरता को पहचानता है।',
    },
    deeper_study_ref: `/library/bhagavad-gita-3d?chapter=${chapterData.chapter}`,
    transcript: `मैं समय हूँ। अध्याय ${chapterData.chapter}: ${chapterData.title_hindi}। सम्पूर्ण कथा प्रवाह।`,
    duration_seconds_est: 517,
  }), [chapterData]);

  const isFullPlaying = currentPlayingSceneId === 'full' && isPlaying;
  const isOpeningPlaying = (currentPlayingSceneId === 'opening' || (isFullPlaying && (!activeCueSceneId || activeCueSceneId === 'opening'))) && isPlaying;
  const isOpeningActive = isOpeningPlaying && (activeCueMark === 'mark_narrative' || !activeCueSceneId || activeCueSceneId === 'opening');

  const handleStudyNavigation = (ref: string) => {
    if (onNavigateToStudy) {
      onNavigateToStudy(ref);
    }
  };

  return (
    <View style={styles.container}>
      {/* =========================================================================
          HERO SECTION: THEOLOGICAL FRAMING DISCLAIMER
         ========================================================================= */}
      <View style={styles.heroDisclaimerCard}>
        <View style={styles.disclaimerTopRow}>
          <View style={styles.disclaimerTitleGroup}>
            <View style={styles.timeBadgeIcon}>
              <Text style={{ fontSize: 14 }}>⏳</Text>
            </View>
            <View>
              <Text style={styles.disclaimerBadgeText}>
                {GITA_THEOLOGICAL_FRAMING.SHORT_BADGE_HI}
              </Text>
              <Text style={styles.disclaimerMainTitle}>
                {GITA_THEOLOGICAL_FRAMING.TIME_TITLE_HI}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.expandToggleBtn}
            onPress={() => setIsDisclaimerExpanded((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandToggleText}>
              {isDisclaimerExpanded ? 'संक्षेप ▲' : 'विवरण ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {isDisclaimerExpanded && (
          <View style={styles.disclaimerBody}>
            <Text style={styles.disclaimerHindiText}>
              {'“'}{chapterData.theological_framing_disclaimer || GITA_THEOLOGICAL_FRAMING.DISCLAIMER_HI}{'”'}
            </Text>
            <View style={styles.disclaimerDivider} />
            <Text style={styles.disclaimerEnglishText}>
              {GITA_THEOLOGICAL_FRAMING.DISCLAIMER_EN}
            </Text>
          </View>
        )}
      </View>

      {/* =========================================================================
          OPENING MONOLOGUE: VOICE OF TIME (मैं समय हूँ...)
         ========================================================================= */}
      <View style={styles.openingMonologueCard}>
        <View style={styles.monologueBadge}>
          <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600' }}>
            ☸ {GITA_THEOLOGICAL_FRAMING.TIME_SUBTITLE_HI}
          </Text>
        </View>

        <Text style={styles.monologueChapterTitle}>
          अध्याय {chapterData.chapter} : {chapterData.title_hindi}
        </Text>

        <Text style={styles.monologueSanskritTitle}>
          {chapterData.title_sanskrit} • {chapterData.title_english}
        </Text>

        <View style={styles.goldSeparator} />

        <View
          style={[
            styles.monologueQuoteBox,
            (isOpeningPlaying || isOpeningActive) && styles.monologueQuoteBoxActive,
          ]}
        >
          <View style={styles.monologueIntroTagRow}>
            <Text style={{ fontSize: 13 }}>🎙️</Text>
            <Text style={styles.monologueIntroTagText}>
              नाट्यमयी उद्घोषणा • धीमी, गंभीर एवं अनादि काल-ध्वनि
            </Text>
          </View>
          <View style={styles.monologueLinesContainer}>
            {chapterData.time_opening_monologue
              .split(/(?<=[।!?])\s+/)
              .filter((line) => line.trim().length > 0)
              .map((line, lIdx, lArr) => (
                <Text
                  key={lIdx}
                  style={[
                    styles.monologueSentenceText,
                    lIdx === 0 && styles.firstMonologueSentence,
                    lIdx === lArr.length - 1 && styles.lastMonologueSentence,
                  ]}
                >
                  {line.trim()}
                </Text>
              ))}
          </View>
        </View>

        {onPlayScene && (
          <TouchableOpacity
            style={[
              styles.playFullStoryBtn,
              isOpeningPlaying && styles.playFullStoryBtnActive,
            ]}
            onPress={() => onPlayScene(fullStoryScene)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={(isFullPlaying || isOpeningPlaying) ? 'pause' : 'play-circle'}
              size={20}
              color={(isFullPlaying || isOpeningPlaying) ? '#140E0C' : '#F59E0B'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.playFullStoryBtnText,
                (isFullPlaying || isOpeningPlaying) && styles.playFullStoryBtnTextActive,
              ]}
            >
              {(isFullPlaying || isOpeningPlaying)
                ? 'विराम (रोकें)'
                : 'सम्पूर्ण कथा प्रवाह सुनें (अखंड काल-प्रवाह)'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.monologueMetaFooter}>
          सम्पूर्ण श्लोक: {chapterData.total_verses} · {chapterData.scenes?.length || 0} नाट्य प्रसंग
        </Text>
      </View>

      {/* =========================================================================
          SCENE LIST: DRAMATIC EPISODES & DIALOGUES
         ========================================================================= */}
      <View style={styles.actsHeaderRow}>
        <Text style={styles.actsHeaderTitle}>
          🎭 {STORY_UI_LABELS.CHAPTER_ACTS_TITLE_HI}
        </Text>
        <Text style={styles.actsHeaderCount}>
          Chapter {chapterData.chapter} Narrative
        </Text>
      </View>

      {chapterData.scenes?.map((scene: StoryScene) => {
        const isThisScenePlaying = isPlaying && (
          currentPlayingSceneId === scene.scene_id ||
          (isFullPlaying && activeCueSceneId === scene.scene_id)
        );
        const isNarrativeActive =
          activeCueMark === 'mark_narrative' && isThisScenePlaying;

        return (
          <View
            key={scene.scene_id}
            style={[
              styles.sceneCard,
              isThisScenePlaying && styles.sceneCardActive,
            ]}
          >
            {/* Scene Header */}
            <View style={styles.sceneHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.sceneBadgeRow}>
                  <View style={styles.seqBadge}>
                    <Text style={styles.seqBadgeText}>प्रसंग {scene.seq}</Text>
                  </View>
                  <View style={styles.rangeBadge}>
                    <Text style={styles.rangeBadgeText}>श्लोक {scene.display_range}</Text>
                  </View>
                </View>
                <Text style={styles.sceneTitleHi}>{scene.title_hi}</Text>
                <Text style={styles.sceneTitleEn}>{scene.title_en}</Text>
              </View>

              {onPlayScene && (
                <TouchableOpacity
                  style={[
                    styles.playSceneBtn,
                    isThisScenePlaying && styles.playSceneBtnActive,
                  ]}
                  onPress={() => onPlayScene(scene)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isThisScenePlaying ? 'pause' : 'play'}
                    size={16}
                    color={isThisScenePlaying ? '#140E0C' : '#F59E0B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.playSceneBtnText,
                      isThisScenePlaying && styles.playSceneBtnTextActive,
                    ]}
                  >
                    {isThisScenePlaying ? 'विराम' : 'कथा सुनें'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Narrative Hindi Text (Voice of Time) */}
            <View
              style={[
                styles.narrativeBox,
                isNarrativeActive && styles.narrativeBoxActive,
              ]}
            >
              <View style={styles.narrativeTagRow}>
                <View style={styles.narrativeIconGroup}>
                  <Text style={{ fontSize: 13 }}>⏳</Text>
                  <Text style={styles.narrativeTagText}>काल का कथन (सूत्रधार)</Text>
                </View>
                <View style={styles.narrativeToneBadge}>
                  <Text style={styles.narrativeToneText}>गंभीर • विहंगम दृष्टि</Text>
                </View>
              </View>

              <View style={styles.narrativeSentenceContainer}>
                {scene.narrative_hindi
                  .split(/(?<=[।!?])\s+/)
                  .filter((s) => s.trim().length > 0)
                  .map((sentence, sIdx, sArr) => (
                    <Text
                      key={sIdx}
                      style={[
                        styles.narrativeSentence,
                        sIdx === 0 && styles.firstNarrativeSentence,
                        sIdx === sArr.length - 1 && styles.lastNarrativeSentence,
                      ]}
                    >
                      {sentence.trim()}
                    </Text>
                  ))}
              </View>
            </View>

            {/* Dialogues Array */}
            {scene.dialogues && scene.dialogues.length > 0 && (
              <View style={styles.dialoguesContainer}>
                <Text style={styles.dialoguesSectionTitle}>
                  संवाद एवं श्लोक (Dramatized Dialogues)
                </Text>

                {scene.dialogues.map((dialogue: DialogueItem, diagIdx: number) => {
                  const speakerMeta = getSpeakerMeta(dialogue.speaker);
                  const cueIdentifier = `mark_dialogue_${diagIdx}_${dialogue.speaker}`;
                  const isDialogueActive =
                    activeCueMark === cueIdentifier && isThisScenePlaying;

                  return (
                    <View
                      key={`${scene.scene_id}_diag_${diagIdx}`}
                      style={[
                        styles.dialogueCard,
                        isDialogueActive && styles.dialogueCardActive,
                      ]}
                    >
                      {/* Speaker Badge & Emotional Performance Direction */}
                      <View style={styles.speakerBadgeRow}>
                        <View style={styles.speakerBadgeLeftCol}>
                          <View
                            style={[
                              styles.speakerPill,
                              {
                                backgroundColor: speakerMeta.badgeBg,
                                borderColor: speakerMeta.borderColor,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: 11 }}>👤</Text>
                            <Text
                              style={[
                                styles.speakerPillText,
                                { color: speakerMeta.badgeTextColor },
                              ]}
                            >
                              {dialogue.speaker_display || speakerMeta.labelHi}
                            </Text>
                          </View>

                          <View style={styles.dialogueEmotionPill}>
                            <Text style={styles.dialogueEmotionText}>
                              🎭 {getSpeakerEmotionTag(dialogue.speaker)}
                            </Text>
                          </View>
                        </View>

                        {dialogue.verse_ref && (
                          <Text style={styles.verseRefPill}>
                            श्लोक {dialogue.verse_ref}
                          </Text>
                        )}
                      </View>

                      {/* Hindi Dialogue Sentences */}
                      <View style={styles.dialogueSentenceGroup}>
                        {dialogue.dialogue_hindi
                          .split(/(?<=[।!?])\s+/)
                          .filter((d) => d.trim().length > 0)
                          .map((dSentence, dIdx, dArr) => (
                            <Text key={dIdx} style={styles.dialogueSentenceItem}>
                              {dIdx === 0 ? '“' : ''}
                              {dSentence.trim()}
                              {dIdx === dArr.length - 1 ? '”' : ''}
                            </Text>
                          ))}
                      </View>

                      {/* Sanskrit Shloka Box */}
                      {dialogue.sanskrit_shloka && (
                        <View style={styles.sanskritShlokaBox}>
                          <Text style={styles.sanskritShlokaHeader}>
                            ॥ मूल संस्कृत श्लोक ॥
                          </Text>
                          <Text style={styles.sanskritShlokaText}>
                            {dialogue.sanskrit_shloka}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Chintan Bindu: Vedantic Contemplation Card */}
            {scene.chintan_bindu && (
              <View style={styles.chintanCard}>
                <View style={styles.chintanHeaderRow}>
                  <Text style={{ fontSize: 16 }}>🪔</Text>
                  <Text style={styles.chintanTag}>
                    {STORY_UI_LABELS.CHINTAN_BINDU_TITLE_HI}
                  </Text>
                </View>

                <Text style={styles.chintanSutraTitle}>
                  {scene.chintan_bindu.sutra_title}
                </Text>

                <Text style={styles.chintanConcept}>
                  तत्त्व विचार: {scene.chintan_bindu.vedantic_concept}
                </Text>

                <Text style={styles.chintanReflection}>
                  {'“'}{scene.chintan_bindu.inner_reflection}{'”'}
                </Text>
              </View>
            )}

            {/* Deeper Study Action Link */}
            <View style={styles.studyFooterRow}>
              <TouchableOpacity
                style={styles.studyBtn}
                onPress={() => handleStudyNavigation(scene.deeper_study_ref)}
                activeOpacity={0.7}
              >
                <Text style={styles.studyBtnText}>
                  {STORY_UI_LABELS.DEEPER_STUDY_CTA_HI}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroDisclaimerCard: {
    borderRadius: 16,
    backgroundColor: '#1E1611',
    borderColor: '#78350F',
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  disclaimerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disclaimerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  timeBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerBadgeText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  disclaimerMainTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FDE68A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  expandToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  expandToggleText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  disclaimerBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 53, 15, 0.4)',
  },
  disclaimerHindiText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#FEF3C7',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  disclaimerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  disclaimerEnglishText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#A8A29E',
  },
  openingMonologueCard: {
    borderRadius: 20,
    backgroundColor: '#1C1510',
    borderColor: '#92400E',
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  monologueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 10,
  },
  monologueChapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FEF3C7',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  monologueSanskritTitle: {
    fontSize: 13,
    color: '#FCD34D',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  goldSeparator: {
    width: 80,
    height: 2,
    backgroundColor: '#F59E0B',
    marginVertical: 14,
    opacity: 0.6,
  },
  monologueQuoteBox: {
    backgroundColor: 'rgba(10, 8, 6, 0.6)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    width: '100%',
  },
  monologueQuoteBoxActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(120, 53, 15, 0.35)',
    borderWidth: 1.5,
  },
  monologueIntroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  monologueIntroTagText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  monologueLinesContainer: {
    width: '100%',
    paddingVertical: 4,
  },
  monologueSentenceText: {
    fontSize: 15,
    lineHeight: 25,
    color: '#FFFBEB',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginVertical: 4,
  },
  firstMonologueSentence: {
    color: '#FDE68A',
    fontWeight: '700',
    fontSize: 16.5,
    marginBottom: 6,
  },
  lastMonologueSentence: {
    marginTop: 6,
    color: '#FCD34D',
  },
  playFullStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 16,
    width: '100%',
  },
  playFullStoryBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FDE68A',
  },
  playFullStoryBtnText: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  playFullStoryBtnTextActive: {
    color: '#140E0C',
  },
  monologueMetaFooter: {
    marginTop: 14,
    fontSize: 11,
    color: '#D97706',
    letterSpacing: 0.5,
  },
  actsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  actsHeaderTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FDE68A',
  },
  actsHeaderCount: {
    fontSize: 12,
    color: '#A8A29E',
  },
  sceneCard: {
    borderRadius: 20,
    backgroundColor: '#18120E',
    borderColor: '#442817',
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  sceneCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#20150E',
    borderWidth: 1.5,
  },
  sceneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sceneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  seqBadge: {
    backgroundColor: '#78350F',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  seqBadgeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
  },
  rangeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rangeBadgeText: {
    color: '#D6D3D1',
    fontSize: 11,
  },
  sceneTitleHi: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FAF5EE',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sceneTitleEn: {
    fontSize: 12,
    color: '#A8A29E',
    fontStyle: 'italic',
    marginTop: 2,
  },
  playSceneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginLeft: 8,
  },
  playSceneBtnActive: {
    backgroundColor: '#F59E0B',
  },
  playSceneBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playSceneBtnTextActive: {
    color: '#140E0C',
  },
  narrativeBox: {
    backgroundColor: 'rgba(10, 8, 6, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginVertical: 14,
  },
  narrativeBoxActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
  },
  narrativeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  narrativeIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  narrativeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  narrativeToneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  narrativeToneText: {
    fontSize: 10,
    color: '#FDE68A',
    fontWeight: '600',
  },
  narrativeSentenceContainer: {
    paddingVertical: 2,
  },
  narrativeSentence: {
    fontSize: 15,
    lineHeight: 25,
    color: '#F5F5F4',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginVertical: 4,
  },
  firstNarrativeSentence: {
    color: '#FEF3C7',
    fontWeight: '600',
  },
  lastNarrativeSentence: {
    color: '#E7E5E4',
  },
  dialoguesContainer: {
    marginVertical: 8,
  },
  dialoguesSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A8A29E',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  dialogueCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(10, 8, 6, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  dialogueCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(120, 53, 15, 0.25)',
  },
  speakerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  speakerBadgeLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  speakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  speakerPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dialogueEmotionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dialogueEmotionText: {
    fontSize: 11,
    color: '#FCD34D',
    fontStyle: 'italic',
  },
  verseRefPill: {
    fontSize: 11,
    color: '#A8A29E',
  },
  dialogueSentenceGroup: {
    paddingVertical: 2,
  },
  dialogueSentenceItem: {
    fontSize: 15,
    lineHeight: 25,
    color: '#FAF5EE',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginVertical: 3,
  },
  sanskritShlokaBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 53, 15, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  sanskritShlokaHeader: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
    marginBottom: 4,
  },
  sanskritShlokaText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FEF3C7',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  chintanCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(40, 20, 10, 0.6)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
    marginBottom: 8,
  },
  chintanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chintanTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  chintanSutraTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FEF3C7',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  chintanConcept: {
    fontSize: 12,
    color: '#FCD34D',
    marginBottom: 6,
  },
  chintanReflection: {
    fontSize: 13,
    lineHeight: 20,
    color: '#E7E5E4',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  studyFooterRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-end',
  },
  studyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  studyBtnText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
