import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGitaPlayerStore, GitaReciteMode } from '../../store/gitaPlayerStore';
import { SafeVideoView, useSafeVideoPlayer, isPlayerValid } from '../SafeVideoView';
import { GITA_COSMIC_MEDIA } from '../../constants/gitaCosmicMedia';
import { CosmicAnimatedBackground } from './CosmicAnimatedBackground';

interface GitaVisualizerViewProps {
  nightMode?: boolean;
  onSwitchToReading: () => void;
  onPrevVerse?: () => void;
  onNextVerse?: () => void;
  onTogglePlay?: () => void;
  onModeChange?: (mode: GitaReciteMode) => void;
  onSpeedChange?: (speed: number) => void;
}

export const GitaVisualizerView: React.FC<GitaVisualizerViewProps> = ({
  nightMode = false,
  onSwitchToReading,
  onPrevVerse,
  onNextVerse,
  onTogglePlay,
  onModeChange,
  onSpeedChange,
}) => {
  const chapter = useGitaPlayerStore((state) => state.chapter);
  const chapterNameHi = useGitaPlayerStore((state) => state.chapterNameHi);
  const chapterNameEn = useGitaPlayerStore((state) => state.chapterNameEn);
  const verseNum = useGitaPlayerStore((state) => state.verseNum);
  const totalVerses = useGitaPlayerStore((state) => state.totalVerses);
  const currentVerseText = useGitaPlayerStore((state) => state.currentVerseText);
  const currentSpokenText = useGitaPlayerStore((state) => state.currentSpokenText);
  const currentSegmentIndex = useGitaPlayerStore((state) => state.currentSegmentIndex);
  const totalSegments = useGitaPlayerStore((state) => state.totalSegments);
  const isPlaying = useGitaPlayerStore((state) => state.isPlaying);
  const reciteMode = useGitaPlayerStore((state) => state.reciteMode);
  const reciteSpeed = useGitaPlayerStore((state) => state.reciteSpeed);
  const activeType = useGitaPlayerStore((state) => state.activeType);
  const storySceneTitle = useGitaPlayerStore((state) => state.storySceneTitle);

  // Background Video State & Player
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);

  const videoPlayer = useSafeVideoPlayer(GITA_COSMIC_MEDIA.videoLocal, (player) => {
    player.loop = true;
    player.muted = true;
    try {
      player.play();
    } catch (_e) {}
  });

  // Sync video playback with video enabled toggle
  useEffect(() => {
    if (!isPlayerValid(videoPlayer)) return;
    try {
      if (isVideoEnabled) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    } catch (_e) {}
  }, [isVideoEnabled, videoPlayer]);

  // Smooth cross-fade and scale transition when spoken text changes
  const textFadeAnim = useRef(new Animated.Value(1)).current;
  const textScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    textFadeAnim.setValue(0.25);
    textScaleAnim.setValue(0.96);
    Animated.parallel([
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(textScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSpokenText, textFadeAnim, textScaleAnim]);

  // Mode cycle helper
  const cycleMode = useCallback(() => {
    const modes: GitaReciteMode[] = ['both', 'sanskrit', 'hindi'];
    const nextIdx = (modes.indexOf(reciteMode) + 1) % modes.length;
    onModeChange?.(modes[nextIdx]);
  }, [reciteMode, onModeChange]);

  // Speed cycle helper
  const cycleSpeed = useCallback(() => {
    const speeds = [0.85, 1.0, 1.2];
    const nextIdx = (speeds.indexOf(reciteSpeed) + 1) % speeds.length;
    onSpeedChange?.(speeds[nextIdx]);
  }, [reciteSpeed, onSpeedChange]);

  const progressPercent = totalVerses > 0 ? Math.min(100, Math.max(0, (verseNum / totalVerses) * 100)) : 0;

  // Active text to display: ONLY the currently spoken line
  const activeLine =
    currentSpokenText ||
    (activeType === 'story'
      ? (storySceneTitle || 'दिव्य कथा प्रवाह...')
      : (currentVerseText?.split(/(?<=[।॥\n])/)[0]?.trim() || 'श्रीभगवानुवाच...'));

  return (
    <View style={styles.outerWrapper}>
      {/* Divine Cosmic Animation Backdrop (CSS + JavaScript) */}
      {isVideoEnabled && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <CosmicAnimatedBackground
            style={StyleSheet.absoluteFillObject}
            showKaalChakra={true}
            speed={0.85}
            overlayOpacity={0.28}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Top Header Mode Toggle */}
          <View style={styles.topToolbar}>
            <View
              style={[
                styles.liveListeningTag,
                !nightMode && { backgroundColor: 'rgba(116, 59, 39, 0.25)' },
              ]}
            >
              <View style={[styles.liveDot, { backgroundColor: isPlaying ? '#00E676' : '#FF9800' }]} />
              <Text
                style={[
                  styles.liveListeningText,
                  !nightMode && { color: '#FFE082' },
                ]}
              >
                {isPlaying ? 'भगवद्गीता श्रवण जारी है' : 'विराम'}
              </Text>
            </View>

            <View style={styles.topActionsRow}>
              {/* Cinematic Video Background Toggle */}
              <TouchableOpacity
                style={[
                  styles.videoToggleBtn,
                  !isVideoEnabled && styles.videoToggleBtnOff,
                ]}
                onPress={() => setIsVideoEnabled((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityLabel="Toggle cinematic background video"
              >
                <Ionicons
                  name={isVideoEnabled ? 'videocam' : 'videocam-off-outline'}
                  size={14}
                  color={isVideoEnabled ? '#FFD54F' : '#A8A29E'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.videoToggleText,
                    !isVideoEnabled && { color: '#A8A29E' },
                  ]}
                >
                  {isVideoEnabled ? 'दिव्य दृश्य' : 'सादा'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.switchModeButton,
                  !nightMode && {
                    backgroundColor: 'rgba(224, 122, 35, 0.22)',
                    borderColor: 'rgba(224, 122, 35, 0.45)',
                  },
                ]}
                onPress={onSwitchToReading}
                activeOpacity={0.8}
              >
                <Ionicons name="book-outline" size={15} color="#FFD54F" />
                <Text
                  style={[
                    styles.switchModeText,
                    !nightMode && { color: '#FFD54F' },
                  ]}
                >
                  पाठ पढ़ें
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chapter Title & Subtitle */}
          <View style={styles.metaSection}>
          <Text
            style={[
              styles.chapterTitle,
              !nightMode && styles.chapterTitleLight,
            ]}
            numberOfLines={1}
          >
            अध्याय {chapter} • {chapterNameHi}
          </Text>
          <Text
            style={[
              styles.chapterSubtitle,
              !nightMode && styles.chapterSubtitleLight,
            ]}
            numberOfLines={1}
          >
            {chapterNameEn} • श्रीमद्भगवद्गीता
          </Text>
        </View>

        {/* Dynamic Spoken Text Display - strictly only what is being spoken, zero background boxes, zero graphics */}
        <View style={styles.spokenContainer}>
          <View style={styles.spokenMetaRow}>
            <View
              style={[
                styles.verseBadge,
                !nightMode && styles.verseBadgeLight,
              ]}
            >
              <Ionicons
                name="sparkles"
                size={11}
                color={nightMode ? '#FFD54F' : '#8D3C08'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.verseBadgeText,
                  !nightMode && styles.verseBadgeTextLight,
                ]}
              >
                {activeType === 'story'
                  ? 'कथा प्रवाह'
                  : `श्लोक ${verseNum} • चरण ${currentSegmentIndex + 1}/${Math.max(1, totalSegments)}`}
              </Text>
            </View>

            <View
              style={[
                styles.reciteModeIndicator,
                !nightMode && styles.reciteModeIndicatorLight,
              ]}
            >
              <Text
                style={[
                  styles.reciteModeIndicatorText,
                  !nightMode && styles.reciteModeIndicatorTextLight,
                ]}
              >
                {reciteMode === 'sanskrit'
                  ? 'संस्कृत'
                  : reciteMode === 'hindi'
                  ? 'भावार्थ'
                  : 'सम्पूर्ण पाठ'}
              </Text>
            </View>
          </View>

          {/* Illuminated single spoken line */}
          <Animated.View
            style={[
              styles.spokenTextWrapper,
              {
                opacity: textFadeAnim,
                transform: [{ scale: textScaleAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.singleSpokenText,
                !nightMode && styles.singleSpokenTextLight,
              ]}
            >
              {activeLine}
            </Text>
          </Animated.View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfoRow}>
            <Text
              style={[
                styles.progressLabel,
                !nightMode && { color: '#743B27' },
              ]}
            >
              अध्याय प्रगति
            </Text>
            <Text
              style={[
                styles.progressValue,
                !nightMode && { color: '#8D3C08' },
              ]}
            >
              {activeType === 'story' ? 'कथा प्रवाह' : `${verseNum} / ${totalVerses}`}
            </Text>
          </View>
          <View
            style={[
              styles.trackBackground,
              !nightMode && { backgroundColor: 'rgba(116, 59, 39, 0.15)' },
            ]}
          >
            <View
              style={[
                styles.trackFill,
                { width: `${progressPercent}%` },
                !nightMode && { backgroundColor: '#D97706' },
              ]}
            />
          </View>
        </View>

        {/* Devotional Controls Dock */}
        <View style={styles.controlsDock}>
          {/* Recitation Mode Toggle */}
          <TouchableOpacity
            style={[
              styles.secondaryControlBtn,
              !nightMode && styles.secondaryControlBtnLight,
            ]}
            onPress={cycleMode}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.controlBtnLabel,
                !nightMode && { color: '#743B27' },
              ]}
            >
              {reciteMode === 'sanskrit' ? 'श्लोक' : reciteMode === 'hindi' ? 'अर्थ' : 'सर्व'}
            </Text>
          </TouchableOpacity>

          {/* Prev Verse */}
          <TouchableOpacity
            style={[
              styles.skipBtn,
              !nightMode && styles.skipBtnLight,
            ]}
            onPress={onPrevVerse}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-skip-back"
              size={20}
              color={nightMode ? '#FFD54F' : '#743B27'}
            />
          </TouchableOpacity>

          {/* Primary Divine Play/Pause */}
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={onTogglePlay}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00', '#E65100']}
              style={styles.playGradient}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Next Verse */}
          <TouchableOpacity
            style={[
              styles.skipBtn,
              !nightMode && styles.skipBtnLight,
            ]}
            onPress={onNextVerse}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-skip-forward"
              size={20}
              color={nightMode ? '#FFD54F' : '#743B27'}
            />
          </TouchableOpacity>

          {/* Speed Toggle */}
          <TouchableOpacity
            style={[
              styles.secondaryControlBtn,
              !nightMode && styles.secondaryControlBtnLight,
            ]}
            onPress={cycleSpeed}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.controlBtnLabel,
                !nightMode && { color: '#743B27' },
              ]}
            >
              {reciteSpeed === 0.85 ? '0.8x' : reciteSpeed === 1.0 ? '1.0x' : '1.2x'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0A0A0E',
    overflow: 'hidden',
  },
  scrollRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 520,
  },
  container: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topToolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.35)',
  },
  videoToggleBtnOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  videoToggleText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '700',
  },
  liveListeningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveListeningText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.4)',
    gap: 6,
  },
  switchModeText: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '700',
  },
  metaSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  chapterTitle: {
    color: '#FFF8E1',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chapterTitleLight: {
    color: '#3E1A0E',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chapterSubtitle: {
    color: '#FFB300',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  chapterSubtitleLight: {
    color: '#8D3C08',
  },
  spokenContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  spokenMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
  },
  verseBadgeLight: {
    backgroundColor: 'rgba(224, 122, 35, 0.12)',
    borderColor: 'rgba(224, 122, 35, 0.3)',
  },
  verseBadgeText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  verseBadgeTextLight: {
    color: '#8D3C08',
  },
  reciteModeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  reciteModeIndicatorLight: {
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
  },
  reciteModeIndicatorText: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '600',
  },
  reciteModeIndicatorTextLight: {
    color: '#743B27',
  },
  spokenTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  singleSpokenText: {
    color: '#FFF8E1',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(255, 179, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  singleSpokenTextLight: {
    color: '#3E1A0E',
    textShadowColor: 'rgba(224, 122, 35, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressSection: {
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 12,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#FFE082',
    fontSize: 12,
    fontWeight: '600',
  },
  progressValue: {
    color: '#FFD54F',
    fontSize: 12,
    fontWeight: '700',
  },
  trackBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#FFB300',
    borderRadius: 3,
  },
  controlsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 10,
    width: '100%',
    marginTop: 6,
  },
  secondaryControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControlBtnLight: {
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
    borderColor: 'rgba(116, 59, 39, 0.25)',
  },
  controlBtnLabel: {
    color: '#FFD54F',
    fontSize: 13,
    fontWeight: '800',
  },
  skipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnLight: {
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    elevation: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  playGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
