/**
 * File: frontend/src/components/library/KathaPravahPlayer.tsx
 *
 * Full-screen immersive "कथा प्रवाह" (Katha Pravah) narrator player for the
 * Brahmand Library — Bhagavad Gita ("मैं समय हूँ" Cosmic Storyteller mode).
 *
 * Experience:
 * - Ambient animated cosmic wallpaper (nebulae, starfield, Kaal Chakra) + divine gradient veil.
 * - Sutradhar (Voice of Time) narration flows prologue → scenes automatically, hands-free.
 * - Karaoke-style block highlighting driven by the X-Timing-Manifest cue header.
 * - Graceful "मौन प्रवाह" (silent text-flow) fallback when the audio endpoint is unavailable,
 *   so the story still keeps flowing through the narrator blocks.
 * - Transport controls: previous / play-pause / next, segment progress dots & completion state.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { CosmicAnimatedBackground } from './CosmicAnimatedBackground';
import {
  GitaStoryChapter,
  StoryScene,
  StorySpeaker,
  DialogueItem,
  ChintanBindu,
  TimingCue,
} from '../../types/gitaStory';
import {
  STORY_SPEAKER_METAS,
  SpeakerMeta,
} from '../../constants/gitaStoryFraming';
import { GITA_COSMIC_MEDIA } from '../../constants/gitaCosmicMedia';
import { useStoryStore } from '../../store/useStoryStore';
import { api } from '../../services/api';

interface KathaPravahPlayerProps {
  visible: boolean;
  chapter: number;
  chapterData: GitaStoryChapter | null;
  initialSceneId?: string | null;
  onClose: () => void;
  onSwitchToClassical?: () => void;
}

interface KathaSegment {
  id: string;
  kind: 'opening' | 'scene';
  seqLabel: string;
  titleHi: string;
  titleEn: string;
  range: string;
  narrative: string;
  dialogues: DialogueItem[];
  chintan: ChintanBindu | null;
  durationEst: number;
}

interface KathaBlock {
  mark: string;
  type: 'narrative' | 'dialogue';
  speaker?: StorySpeaker;
  speakerDisplay?: string;
  text: string;
  sanskritShloka?: string | null;
  verseRef?: string | null;
  /** Silent-flow (text only) timing estimates in seconds */
  startSec: number;
  endSec: number;
}

/** Stable empty cue list (avoids new array identities across renders) */
const EMPTY_CUES: TimingCue[] = [];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function estimateSeconds(text: string): number {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(6, Math.min(240, words * 0.42 + 3));
}

/** Map canonical speaker string → UI visual token metadata */
function getSpeakerMeta(speaker: StorySpeaker | string): SpeakerMeta {
  if (speaker === 'काल_समय' || speaker.includes('समय') || speaker.includes('काल')) {
    return STORY_SPEAKER_METAS.TIME_NARRATOR;
  }
  if (speaker === 'धृतराष्ट्र') return STORY_SPEAKER_METAS.DHRITARASHTRA;
  if (speaker === 'सञ्जय') return STORY_SPEAKER_METAS.SANJAYA;
  if (speaker === 'दुर्योधन') return STORY_SPEAKER_METAS.DURYODHANA;
  if (speaker === 'अर्जुन') return STORY_SPEAKER_METAS.ARJUNA;
  if (speaker === 'श्रीभगवान्' || speaker.includes('कृष्ण')) return STORY_SPEAKER_METAS.KRISHNA;
  return STORY_SPEAKER_METAS.TIME_NARRATOR;
}

function getSpeakerEmotionTag(speaker: StorySpeaker | string): string {
  if (speaker === 'धृतराष्ट्र') return 'अंधे राजा का संशय, मोह व भीतरी भय';
  if (speaker === 'सञ्जय') return 'टटस्थ एवं विस्मयकारी दिव्य दृष्टि';
  if (speaker === 'दुर्योधन') return 'अहंकार के आवरण में छिपा भीतरी भय';
  if (speaker === 'अर्जुन') return 'शोक, विषाद और कांपते हुए हाथ';
  if (speaker === 'श्रीभगवान्' || speaker.includes('कृष्ण')) return 'परम धीर-गंभीर, शांत एवं दिव्य चेतना';
  return 'अनादि काल की गूंजती चेतना';
}

function buildSegments(data: GitaStoryChapter): KathaSegment[] {
  const openingNarrative =
    `श्रीमद्भगवद्गीता। अध्याय ${data.chapter}—${data.title_hindi}। ${data.time_opening_monologue}`;

  const opening: KathaSegment = {
    id: 'opening',
    kind: 'opening',
    seqLabel: 'प्रस्तावना',
    titleHi: `अध्याय ${data.chapter}: ${data.title_hindi}`,
    titleEn: data.title_english,
    range: `श्लोक 1-${data.total_verses}`,
    narrative: openingNarrative,
    dialogues: [],
    chintan: null,
    durationEst: estimateSeconds(openingNarrative),
  };

  const scenes: KathaSegment[] = (data.scenes || []).map((s: StoryScene) => {
    const dialogueText = (s.dialogues || [])
      .map((d) => d.dialogue_hindi)
      .join(' ');
    const est =
      s.duration_seconds_est && s.duration_seconds_est > 0
        ? s.duration_seconds_est
        : estimateSeconds(`${s.narrative_hindi} ${dialogueText}`);

    return {
      id: s.scene_id,
      kind: 'scene' as const,
      seqLabel: `प्रसंग ${s.seq}`,
      titleHi: s.title_hi,
      titleEn: s.title_en,
      range: `श्लोक ${s.display_range}`,
      narrative: s.narrative_hindi,
      dialogues: s.dialogues || [],
      chintan: s.chintan_bindu || null,
      durationEst: est,
    };
  });

  return [opening, ...scenes];
}

/** Build karaoke blocks for a segment with cumulative silent-flow timings */
function buildBlocks(segment: KathaSegment): KathaBlock[] {
  const blocks: KathaBlock[] = [];
  let clock = 0;

  const push = (block: Omit<KathaBlock, 'startSec' | 'endSec'>) => {
    const dur = estimateSeconds(block.text);
    blocks.push({ ...block, startSec: clock, endSec: clock + dur });
    clock += dur;
  };

  push({
    mark: 'mark_narrative',
    type: 'narrative',
    text: segment.narrative,
  });

  segment.dialogues.forEach((d, idx) => {
    push({
      mark: `mark_dialogue_${idx}_${d.speaker}`,
      type: 'dialogue',
      speaker: d.speaker,
      speakerDisplay: d.speaker_display,
      text: d.dialogue_hindi,
      sanskritShloka: d.sanskrit_shloka,
      verseRef: d.verse_ref,
    });
  });

  return blocks;
}

export const KathaPravahPlayer: React.FC<KathaPravahPlayerProps> = ({
  visible,
  chapter,
  chapterData,
  initialSceneId = null,
  onClose,
  onSwitchToClassical,
}) => {
  const insets = useSafeAreaInsets();
  const { setIsPlaying: setIsPlayingStore, setCurrentPlayingSceneId } = useStoryStore();

  const segments = useMemo(
    () => (chapterData ? buildSegments(chapterData) : []),
    [chapterData]
  );

  // Fresh mount per open → state initializes straight from the requested scene.
  const [segIndex, setSegIndex] = useState(() => {
    if (!initialSceneId) return 0;
    const idx = segments.findIndex((s) => s.id === initialSceneId);
    return idx >= 0 ? idx : 0;
  });
  const [wantPlaying, setWantPlaying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [silentElapsed, setSilentElapsed] = useState(0);
  const [cueState, setCueState] = useState<{ url: string; cues: TimingCue[] } | null>(null);

  const finishedRef = useRef<string | null>(null);
  const silentClockRef = useRef(0);
  const segChangedAtRef = useRef(0);
  const blockYsRef = useRef<Record<string, number>>({});
  const scrollRef = useRef<ScrollView>(null);

  const currentSegment: KathaSegment | null = segments[segIndex] || null;
  const blocks = useMemo(
    () => (currentSegment ? buildBlocks(currentSegment) : []),
    [currentSegment]
  );

  // ── Audio source (mirrors StoryAudioPlayer endpoint contract) ──
  const backendBase = api?.defaults?.baseURL || '';
  const audioUrl =
    visible && !silentMode && !isComplete && currentSegment
      ? `${backendBase}/library/bhagavad-gita/story-audio/${chapter}/${currentSegment.id}`
      : null;

  // Cues are keyed by URL, so a segment change invalidates them without a
  // synchronous setState inside an effect.
  const cues = useMemo(
    () => (cueState && cueState.url === audioUrl ? cueState.cues : EMPTY_CUES),
    [cueState, audioUrl]
  );

  const audioPlayer = useAudioPlayer(audioUrl);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const isPlayingNow = silentMode
    ? wantPlaying && !isComplete
    : Boolean(playerStatus?.playing);

  // Narration URL is set but the player has not buffered yet (backend TTS can
  // take a few seconds on first request for a scene).
  const isPreparing =
    !silentMode &&
    !isComplete &&
    Boolean(audioUrl) &&
    !playerStatus?.isLoaded &&
    !playerStatus?.error;

  // Configure audio mode once
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => {});
  }, []);

  // ── Probe timing manifest (karaoke cues) for the active segment ──
  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(audioUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
        });
        if (cancelled) return;

        if (!response.ok) {
          // Endpoint not ready yet (e.g. TTS still synthesizing) — cues are
          // optional, so just fall back to proportional highlight timing.
          return;
        }

        const raw =
          response.headers.get('x-timing-manifest') ||
          response.headers.get('X-Timing-Manifest');
        if (raw) {
          try {
            const manifest = JSON.parse(decodeURIComponent(raw));
            if (manifest && Array.isArray(manifest.cues)) {
              setCueState({ url: audioUrl, cues: manifest.cues });
            }
          } catch {
            /* manifest optional — proportional highlight takes over */
          }
        }
      } catch {
        /* probe is best-effort: no cues, audio still plays */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  // ── Audio player itself failed (offline / 5xx / decode) → graceful silent flow ──
  // Debounced + deferred: lets a transient error self-heal and avoids a
  // cascading render inside the effect body.
  useEffect(() => {
    if (!audioUrl || !playerStatus?.error || silentMode) return;
    const t = setTimeout(() => setSilentMode(true), 600);
    return () => clearTimeout(t);
  }, [audioUrl, playerStatus?.error, silentMode]);

  // ── Drive playback from intent (play/pause) ──
  // NOTE: intentionally no cleanup here. Pausing on every status flip created a
  // play/pause war on Android (deps include `playing`) that stalled narration.
  useEffect(() => {
    if (!audioPlayer || !visible) return;
    if (wantPlaying && !silentMode && !isComplete && audioUrl) {
      if (!playerStatus?.playing) {
        try {
          audioPlayer.play();
        } catch {}
      }
    } else if (playerStatus?.playing) {
      try {
        audioPlayer.pause();
      } catch {}
    }
  }, [
    audioPlayer,
    visible,
    wantPlaying,
    silentMode,
    isComplete,
    audioUrl,
    playerStatus?.playing,
    playerStatus?.isLoaded,
  ]);

  // Pause only when the player instance is swapped (segment change) or on unmount
  useEffect(() => {
    return () => {
      try {
        audioPlayer.pause();
      } catch {}
    };
  }, [audioPlayer]);

  const advanceSegment = useCallback(() => {
    silentClockRef.current = 0;
    setSilentElapsed(0);
    segChangedAtRef.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (segIndex >= segments.length - 1) {
      setIsComplete(true);
      setWantPlaying(false);
      return;
    }
    setSegIndex(segIndex + 1);
    setWantPlaying(true);
  }, [segIndex, segments.length]);

  // ── Auto-advance: narration of a segment finished → flow into the next ──
  useEffect(() => {
    if (!visible || silentMode || !playerStatus?.didJustFinish) return;
    const id = currentSegment?.id;
    if (!id || finishedRef.current === id) return;
    // Ignore a stale `didJustFinish` carried over from the previous segment's
    // player right after a swap (would skip scenes instantly).
    if (Date.now() - segChangedAtRef.current < 900) return;
    finishedRef.current = id;
    advanceSegment();
  }, [visible, silentMode, playerStatus?.didJustFinish, currentSegment?.id, advanceSegment]);

  // ── Silent flow timer (no audio available → timed text narration) ──
  useEffect(() => {
    if (!visible || !silentMode || !wantPlaying || isComplete || !currentSegment) return;
    const iv = setInterval(() => {
      silentClockRef.current += 0.5;
      setSilentElapsed(silentClockRef.current);
      if (silentClockRef.current >= currentSegment.durationEst) {
        advanceSegment();
      }
    }, 500);
    return () => clearInterval(iv);
  }, [visible, silentMode, wantPlaying, isComplete, currentSegment, advanceSegment]);

  // ── Keep the global story store in sync (floating bar / list highlights) ──
  useEffect(() => {
    if (!visible) return;
    const sceneId = wantPlaying && !isComplete && currentSegment ? currentSegment.id : null;
    setIsPlayingStore(Boolean(sceneId));
    setCurrentPlayingSceneId(sceneId);
    return () => {
      setIsPlayingStore(false);
      setCurrentPlayingSceneId(null);
    };
  }, [visible, wantPlaying, isComplete, currentSegment, setIsPlayingStore, setCurrentPlayingSceneId]);

  // ── Karaoke: active block derived from cues (or silent-flow clock) ──
  const activeBlockIndex = useMemo(() => {
    if (blocks.length === 0) return -1;

    if (silentMode) {
      const t = silentElapsed;
      for (let i = 0; i < blocks.length; i++) {
        if (t >= blocks[i].startSec && t < blocks[i].endSec) return i;
      }
      return t >= blocks[blocks.length - 1].endSec ? blocks.length - 1 : 0;
    }

    const ms = (playerStatus?.currentTime || 0) * 1000;

    if (cues.length > 0) {
      const active = cues.find((c) => ms >= c.start_ms && ms < c.end_ms);
      const target = active || cues.filter((c) => ms >= c.end_ms).pop() || cues[0];
      const idx = blocks.findIndex((b) => b.mark === target.mark);
      if (idx >= 0) return idx;
    }

    const dur = playerStatus?.duration || 0;
    if (dur > 0) {
      const p = Math.min(1, (playerStatus?.currentTime || 0) / dur);
      return Math.min(blocks.length - 1, Math.floor(p * blocks.length));
    }
    return 0;
  }, [blocks, silentMode, silentElapsed, cues, playerStatus?.currentTime, playerStatus?.duration]);

  // Auto-scroll the narrated block into view (offsets keyed per segment)
  useEffect(() => {
    if (activeBlockIndex < 0) return;
    const y = blockYsRef.current[`${segIndex}:${activeBlockIndex}`];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
  }, [activeBlockIndex, segIndex]);

  // ── Transport ──
  const togglePlay = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (isComplete) {
      finishedRef.current = null;
      silentClockRef.current = 0;
      setSilentElapsed(0);
      setSegIndex(0);
      setIsComplete(false);
      setWantPlaying(true);
      return;
    }
    setWantPlaying((w) => !w);
  }, [isComplete]);

  const goToSegment = useCallback(
    (delta: number) => {
      if (segments.length === 0) return;
      Haptics.selectionAsync().catch(() => {});
      finishedRef.current = null;
      silentClockRef.current = 0;
      segChangedAtRef.current = Date.now();
      setSilentElapsed(0);

      const next = segIndex + delta;
      if (next < 0) {
        // Restart current segment from the top
        setSegIndex(segIndex);
        setWantPlaying(true);
        return;
      }
      if (next >= segments.length) {
        setIsComplete(true);
        setWantPlaying(false);
        return;
      }
      setSegIndex(next);
      setWantPlaying(true);
    },
    [segIndex, segments.length]
  );

  // Ambient pulsing accents
  const pulse = useSharedValue(0);
  const floatY = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [pulse, floatY]);

  const handleClose = useCallback(() => {
    try {
      audioPlayer.pause();
    } catch {}
    setIsPlayingStore(false);
    setCurrentPlayingSceneId(null);
    onClose();
  }, [audioPlayer, onClose, setIsPlayingStore, setCurrentPlayingSceneId]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, handleClose]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.65 }));
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  // ── Derived playback values ──
  const totalSec = silentMode
    ? currentSegment?.durationEst || 30
    : playerStatus?.duration && playerStatus.duration > 0
    ? playerStatus.duration
    : currentSegment?.durationEst || 60;
  const elapsedSec = silentMode ? silentElapsed : playerStatus?.currentTime || 0;
  const progressPct = Math.min(100, Math.max(0, (elapsedSec / Math.max(1, totalSec)) * 100));

  const renderBlock = (block: KathaBlock, idx: number) => {
    const isActive = idx === activeBlockIndex && !isComplete;
    const isPast = idx < activeBlockIndex || isComplete;
    const speakerMeta = block.type === 'dialogue' && block.speaker ? getSpeakerMeta(block.speaker) : null;

    return (
      <View
        key={block.mark}
        onLayout={(e) => {
          blockYsRef.current[`${segIndex}:${idx}`] = e.nativeEvent.layout.y;
        }}
        style={[
          styles.blockCard,
          isActive && styles.blockCardActive,
          isPast && !isActive && styles.blockCardPast,
        ]}
      >
        {block.type === 'narrative' ? (
          <View style={styles.blockTagRow}>
            <View style={styles.narratorTag}>
              <Text style={{ fontSize: 12 }}>⏳</Text>
              <Text style={styles.narratorTagText}>काल का कथन (सूत्रधार)</Text>
            </View>
            {isActive && isPlayingNow && (
              <Animated.View style={[styles.livePulse, pulseStyle]} />
            )}
          </View>
        ) : (
          <View style={styles.speakerRow}>
            <View
              style={[
                styles.speakerPill,
                {
                  backgroundColor: speakerMeta?.badgeBg || 'rgba(255,255,255,0.1)',
                  borderColor: speakerMeta?.borderColor || 'rgba(245,158,11,0.5)',
                },
              ]}
            >
              <Text style={{ fontSize: 11 }}>👤</Text>
              <Text
                style={[
                  styles.speakerPillText,
                  { color: speakerMeta?.badgeTextColor || '#FDE68A' },
                ]}
              >
                {block.speakerDisplay || speakerMeta?.labelHi}
              </Text>
            </View>
            <Text style={styles.emotionText}>🎭 {getSpeakerEmotionTag(block.speaker || '')}</Text>
            {block.verseRef ? <Text style={styles.verseRef}>श्लोक {block.verseRef}</Text> : null}
          </View>
        )}

        <Text style={[styles.blockText, isActive && styles.blockTextActive]}>
          {block.type === 'narrative' ? '' : '“'}
          {block.text}
          {block.type === 'narrative' ? '' : '”'}
        </Text>

        {block.sanskritShloka ? (
          <View style={styles.shlokaBox}>
            <Text style={styles.shlokaHeader}>॥ मूल संस्कृत श्लोक ॥</Text>
            <Text style={styles.shlokaText}>{block.sanskritShloka}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const chintan = currentSegment?.chintan;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        {/* ── Ambient divine wallpaper ── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={GITA_COSMIC_MEDIA.posterLocal}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.32 }]}
            resizeMode="cover"
          />
          <CosmicAnimatedBackground
            style={StyleSheet.absoluteFillObject}
            showKaalChakra
            speed={0.75}
            overlayOpacity={0.4}
          />
          <LinearGradient
            colors={[
              'rgba(4, 3, 9, 0.82)',
              'rgba(10, 6, 22, 0.35)',
              'rgba(4, 3, 9, 0.9)',
            ]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Floating divine accents */}
          <Animated.Text style={[styles.floatingAccent, styles.floatingAccentLeft, floatStyle]}>
            ॐ
          </Animated.Text>
          <Animated.Text style={[styles.floatingAccent, styles.floatingAccentRight, floatStyle]}>
            ✦
          </Animated.Text>
        </View>

        {/* ── Top HUD ── */}
        <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.hudIconBtn}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="कथा प्रवाह बंद करें"
          >
            <Ionicons name="chevron-back" size={24} color="#FDE68A" />
          </TouchableOpacity>

          <View style={styles.hudTitleCol}>
            <Text style={styles.hudBadge}>कथा प्रवाह • अध्याय {chapter}</Text>
            <Text numberOfLines={1} style={styles.hudTitle}>
              {chapterData?.title_hindi || 'कथा तैयार हो रही है...'}
            </Text>
          </View>

          {segments.length > 0 && (
            <View style={styles.hudCounter}>
              <Text style={styles.hudCounterText}>
                {Math.min(segIndex + 1, segments.length)}/{segments.length}
              </Text>
            </View>
          )}
        </View>

        {!chapterData ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loaderText}>काल-कथा प्रस्तुत हो रही है... ✨</Text>
          </View>
        ) : (
          <>
            {/* ── Narrator identity row ── */}
            <View style={styles.narratorRow}>
              <View style={styles.micBubble}>
                <Text style={{ fontSize: 18 }}>🎙️</Text>
                {isPlayingNow && <Animated.View style={[styles.micGlow, pulseStyle]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.narratorName}>सूत्रधार • काल (समय)</Text>
                <Text style={styles.segmentMeta} numberOfLines={1}>
                  {currentSegment?.seqLabel} · {currentSegment?.range}
                </Text>
              </View>
              <View style={styles.flowStateBadge}>
                {isPreparing ? (
                  <View style={styles.flowStateRow}>
                    <ActivityIndicator size="small" color="#FCD34D" />
                    <Text style={styles.flowStateText}>तैयार हो रही…</Text>
                  </View>
                ) : (
                  <Text style={styles.flowStateText}>
                    {isComplete ? 'सम्पूर्ण' : silentMode ? 'मौन प्रवाह' : isPlayingNow ? 'प्रवाहित' : 'विराम'}
                  </Text>
                )}
              </View>
            </View>

            {/* ── Progress ── */}
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#F59E0B', '#FDE68A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(elapsedSec)}</Text>
                {/* Segment flow dots */}
                <View style={styles.dotsRow}>
                  {segments.map((s, i) => (
                    <View
                      key={s.id}
                      style={[
                        styles.dot,
                        i === segIndex && styles.dotActive,
                        i < segIndex && styles.dotDone,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.timeText}>{formatTime(totalSec)}</Text>
              </View>
            </View>

            {/* ── Narration content ── */}
            <ScrollView
              ref={scrollRef}
              style={styles.contentScroll}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {isComplete ? (
                <View style={styles.completeCard}>
                  <Text style={styles.completeOm}>ॐ</Text>
                  <Text style={styles.completeTitle}>॥ अध्याय कथा सम्पूर्ण ॥</Text>
                  <Text style={styles.completeSub}>
                    अध्याय {chapter} · {chapterData.title_hindi} का कथा-प्रवाह पूर्ण हुआ।
                  </Text>
                  <View style={styles.completeBtnRow}>
                    <TouchableOpacity
                      style={styles.completePrimaryBtn}
                      onPress={togglePlay}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="refresh" size={16} color="#140E0C" />
                      <Text style={styles.completePrimaryText}>पुनः सुनें</Text>
                    </TouchableOpacity>
                    {onSwitchToClassical && (
                      <TouchableOpacity
                        style={styles.completeGhostBtn}
                        onPress={() => {
                          try { audioPlayer.pause(); } catch {}
                          setIsPlayingStore(false);
                          setCurrentPlayingSceneId(null);
                          onSwitchToClassical();
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.completeGhostText}>श्लोक पाठ देखें</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <>
                  {/* Segment title card */}
                  <View style={styles.segmentCard}>
                    <View style={styles.segmentBadge}>
                      <Text style={styles.segmentBadgeText}>
                        {currentSegment?.kind === 'opening' ? 'प्रस्तावना' : currentSegment?.seqLabel}
                      </Text>
                    </View>
                    <Text style={styles.segmentTitle}>{currentSegment?.titleHi}</Text>
                    <Text style={styles.segmentTitleEn}>{currentSegment?.titleEn}</Text>
                    <Text style={styles.segmentRange}>{currentSegment?.range}</Text>
                  </View>

                  {/* Karaoke blocks */}
                  {blocks.map(renderBlock)}

                  {/* Chintan bindu — glows once narration reaches it */}
                  {chintan && (
                    <View
                      style={[
                        styles.chintanCard,
                        activeBlockIndex >= blocks.length - 1 &&
                          !isComplete &&
                          styles.chintanCardActive,
                      ]}
                    >
                      <View style={styles.chintanHeaderRow}>
                        <Text style={{ fontSize: 15 }}>🪔</Text>
                        <Text style={styles.chintanTag}>चिन्तन-बिन्दु (आत्म-परीक्षण)</Text>
                      </View>
                      <Text style={styles.chintanTitle}>{chintan.sutra_title}</Text>
                      <Text style={styles.chintanConcept}>तत्त्व विचार: {chintan.vedantic_concept}</Text>
                      <Text style={styles.chintanReflection}>“{chintan.inner_reflection}”</Text>
                    </View>
                  )}

                  {silentMode && (
                    <View style={styles.silentBanner}>
                      <Text style={styles.silentBannerText}>
                        🔇 ऑडियो उपलब्ध नहीं — कथा शांत प्रवाह में अग्रसर है।
                      </Text>
                      <TouchableOpacity
                        style={styles.silentRetryBtn}
                        onPress={() => {
                          finishedRef.current = null;
                          silentClockRef.current = 0;
                          segChangedAtRef.current = Date.now();
                          setSilentElapsed(0);
                          setSilentMode(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="volume-high" size={14} color="#FDE68A" />
                        <Text style={styles.silentRetryText}>ध्वनि पुनः प्रयास करें</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* ── Transport controls ── */}
            <View style={[styles.controlsBar, { paddingBottom: insets.bottom + 14 }]}>
              <TouchableOpacity
                style={styles.ctrlBtn}
                onPress={() => goToSegment(-1)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="play-skip-back" size={22} color="#FDE68A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseBtn}
                onPress={togglePlay}
                activeOpacity={0.85}
                accessibilityLabel={isPlayingNow ? 'विराम' : 'चलाएँ'}
              >
                <LinearGradient
                  colors={['#FDE68A', '#F59E0B']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons
                  name={isComplete ? 'refresh' : isPlayingNow ? 'pause' : 'play'}
                  size={30}
                  color="#140E0C"
                  style={isPlayingNow ? undefined : { marginLeft: 3 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctrlBtn}
                onPress={() => goToSegment(1)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="play-skip-forward" size={22} color="#FDE68A" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05040A',
  },
  floatingAccent: {
    position: 'absolute',
    color: 'rgba(245, 158, 11, 0.22)',
    fontSize: 46,
    fontWeight: '700',
  },
  floatingAccentLeft: { left: 26, top: '32%' },
  floatingAccentRight: { right: 30, top: '58%', fontSize: 34 },

  /* Top HUD */
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 10,
  },
  hudIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudTitleCol: { flex: 1 },
  hudBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hudTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FEF3C7',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 2,
  },
  hudCounter: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  hudCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
    fontVariant: ['tabular-nums'],
  },

  /* Loader */
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loaderText: {
    fontSize: 14,
    color: '#FDE68A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  /* Narrator row */
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(14, 10, 22, 0.66)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  micBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.8)',
  },
  narratorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDE68A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  segmentMeta: {
    fontSize: 11,
    color: '#C9BBA8',
    marginTop: 2,
  },
  flowStateBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    minWidth: 96,
    alignItems: 'center',
  },
  flowStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flowStateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FCD34D',
  },

  /* Progress */
  progressWrap: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
    gap: 8,
  },
  timeText: {
    fontSize: 10,
    color: '#A8A29E',
    fontVariant: ['tabular-nums'],
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  dotDone: { backgroundColor: 'rgba(245, 158, 11, 0.55)' },
  dotActive: { backgroundColor: '#FDE68A', width: 12 },

  /* Content */
  contentScroll: {
    flex: 1,
    marginTop: 14,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  segmentCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(14, 10, 22, 0.72)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.42)',
  },
  segmentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 8,
  },
  segmentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  segmentTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFBEB',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 26,
  },
  segmentTitleEn: {
    fontSize: 12,
    color: '#A8A29E',
    fontStyle: 'italic',
    marginTop: 3,
  },
  segmentRange: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 8,
    letterSpacing: 0.4,
  },

  /* Karaoke blocks */
  blockCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.62,
  },
  blockCardActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderColor: '#F59E0B',
    opacity: 1,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  blockCardPast: {
    opacity: 0.42,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  blockTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  narratorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  narratorTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  emotionText: {
    fontSize: 10,
    color: '#FCD34D',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  verseRef: {
    fontSize: 10,
    color: '#A8A29E',
  },
  blockText: {
    fontSize: 15.5,
    lineHeight: 27,
    color: '#EDE7DC',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  blockTextActive: {
    color: '#FFFBEB',
    fontSize: 16.5,
    lineHeight: 29,
  },
  shlokaBox: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    paddingVertical: 8,
    paddingRight: 8,
    borderRadius: 6,
  },
  shlokaHeader: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
    marginBottom: 4,
  },
  shlokaText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: '#FEF3C7',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  /* Chintan bindu */
  chintanCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(120, 53, 15, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    opacity: 0.6,
  },
  chintanCardActive: {
    opacity: 1,
    borderColor: '#F59E0B',
  },
  chintanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chintanTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chintanTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FEF3C7',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 3,
  },
  chintanConcept: {
    fontSize: 12,
    color: '#FCD34D',
    marginBottom: 6,
  },
  chintanReflection: {
    fontSize: 13,
    lineHeight: 21,
    color: '#E7E5E4',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  /* Silent flow banner */
  silentBanner: {
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  silentRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  silentRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
  },
  silentBannerText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#C9BBA8',
  },

  /* Completion */
  completeCard: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  completeOm: {
    fontSize: 54,
    color: '#F59E0B',
    marginBottom: 8,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FEF3C7',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  completeSub: {
    fontSize: 13,
    lineHeight: 20,
    color: '#C9BBA8',
    textAlign: 'center',
    marginTop: 10,
  },
  completeBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  completePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
  },
  completePrimaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#140E0C',
  },
  completeGhostBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  completeGhostText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDE68A',
  },

  /* Controls */
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(6, 4, 12, 0.82)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.22)',
  },
  ctrlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: '#F59E0B',
  },
  playPauseBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
