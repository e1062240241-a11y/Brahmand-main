import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface KaraokeWord {
  word: string;
  start: number;
  end: number;
}

export interface KaraokeLyric {
  type: 'lyric';
  line: string;
  words: KaraokeWord[];
}

export interface KaraokeMusic {
  type: 'music';
  start: number;
  end: number;
  symbols: string[];
}

export type KaraokeSection = KaraokeLyric | KaraokeMusic;

export interface KaraokeData {
  project: string;
  audio_file: string;
  deity: string;
  language: string;
  structure: KaraokeSection[];
}

type WordStatus = 'upcoming' | 'active' | 'completed';

interface KaraokeSyncEngineProps {
  data: KaraokeData;
  currentTime: number;
  isPlaying: boolean;
  onSectionChange?: (section: KaraokeSection, index: number) => void;
  style?: object;
}

const SAFFRON = '#FF6B00';
const SAFFRON_ACTIVE = '#FF8C00';
const TEXT_IDLE = '#8B7355';
const TEXT_DIM = '#5A4A3A';
const COMPLETED = '#C4956A';

const KaraokeSyncEngine: React.FC<KaraokeSyncEngineProps> = ({
  data,
  currentTime,
  isPlaying,
  onSectionChange,
  style,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [visibleLines, setVisibleLines] = useState<KaraokeLyric[]>([]);
  const [wordStatuses, setWordStatuses] = useState<Record<string, WordStatus>>({});
  const [musicSymbols, setMusicSymbols] = useState<string[]>([]);
  const lastSectionRef = useRef(-1);

  useEffect(() => {
    if (!isPlaying) return;

    let activeSectionIndex = -1;
    for (let i = 0; i < data.structure.length; i++) {
      const section = data.structure[i];
      const start = section.type === 'music' ? section.start : (section.words[0]?.start ?? 0);
      const end = section.type === 'music' ? section.end : (section.words[section.words.length - 1]?.end ?? 0);
      if (currentTime >= start && currentTime < end) {
        activeSectionIndex = i;
        break;
      }
    }

    const lastSection = data.structure[data.structure.length - 1];
    const lastSectionEnd = lastSection
      ? (lastSection.type === 'music' ? lastSection.end : (lastSection.words[lastSection.words.length - 1]?.end ?? 0))
      : 0;

    if (activeSectionIndex === -1 && currentTime >= lastSectionEnd) {
      activeSectionIndex = data.structure.length - 1;
    }

    if (activeSectionIndex !== lastSectionRef.current) {
      lastSectionRef.current = activeSectionIndex;
      setCurrentSectionIndex(activeSectionIndex);

      if (activeSectionIndex >= 0 && activeSectionIndex < data.structure.length) {
        const section = data.structure[activeSectionIndex];
        onSectionChange?.(section, activeSectionIndex);

        if (section.type === 'lyric') {
          const prevIdx = activeSectionIndex - 1 >= 0 ? activeSectionIndex - 1 : -1;
          const nextIdx = activeSectionIndex + 1 < data.structure.length ? activeSectionIndex + 1 : -1;

          const lines: KaraokeLyric[] = [];
          if (prevIdx >= 0 && data.structure[prevIdx].type === 'lyric') {
            lines.push(data.structure[prevIdx] as KaraokeLyric);
          }
          lines.push(section as KaraokeLyric);
          if (nextIdx >= 0 && data.structure[nextIdx].type === 'lyric') {
            lines.push(data.structure[nextIdx] as KaraokeLyric);
          }

          setVisibleLines(lines);
          setMusicSymbols([]);

          const ws: Record<string, WordStatus> = {};
          for (const line of lines) {
            for (const w of line.words) {
              ws[`${line.line}-${w.word}`] = 'upcoming';
            }
          }
          setWordStatuses(ws);
        } else if (section.type === 'music') {
          setMusicSymbols(section.symbols);
          setVisibleLines([]);
          setWordStatuses({});
        }
      }
    }

    const newStatuses: Record<string, WordStatus> = {};
    let changed = false;

    for (const section of data.structure) {
      if (section.type !== 'lyric') continue;
      for (const w of (section as KaraokeLyric).words) {
        const key = `${section.line}-${w.word}`;
        let status: WordStatus;
        if (currentTime >= w.start && currentTime < w.end) {
          status = 'active';
        } else if (currentTime >= w.end) {
          status = 'completed';
        } else {
          status = 'upcoming';
        }
        newStatuses[key] = status;
        if (wordStatuses[key] !== status) changed = true;
      }
    }

    if (changed) {
      setWordStatuses(newStatuses);
    }
  }, [currentTime, isPlaying]);

  const renderLine = useCallback((line: KaraokeLyric, isCenter: boolean) => {
    return (
      <View key={line.line} style={[styles.lineContainer, isCenter && styles.centerLine]}>
        <View style={styles.wordsRow}>
          {line.words.map((w) => {
            const key = `${line.line}-${w.word}`;
            const status = wordStatuses[key] || 'upcoming';

            let color = TEXT_IDLE;
            let fontSize = 26;
            let fontWeight: '400' | '700' = '400';

            if (status === 'active') {
              color = SAFFRON_ACTIVE;
              fontSize = 32;
              fontWeight = '700';
            } else if (status === 'completed') {
              color = COMPLETED;
              fontSize = 26;
              fontWeight = '400';
            } else if (isCenter) {
              color = TEXT_IDLE;
              fontSize = 26;
              fontWeight = '400';
            } else {
              color = TEXT_DIM;
              fontSize = 20;
              fontWeight = '400';
            }

            return (
              <Text
                key={key}
                style={[styles.word, { color, fontSize, fontWeight } as any]}
              >
                {w.word}
              </Text>
            );
          })}
        </View>
      </View>
    );
  }, [wordStatuses]);

  return (
    <View style={[styles.container, style]}>
      {visibleLines.length > 0 ? (
        <View style={styles.lyricsContainer}>
          {visibleLines.map((line, idx) => {
            if (line.type !== 'lyric') return null;
            return renderLine(line, idx === 1);
          })}
        </View>
      ) : (
        <View style={styles.musicContainer}>
          {musicSymbols.map((symbol, i) => (
            <FloatingSymbol key={`${symbol}-${i}`} symbol={symbol} index={i} />
          ))}
        </View>
      )}
    </View>
  );
};

interface FloatingSymbolProps {
  symbol: string;
  index: number;
}

const FloatingSymbol: React.FC<FloatingSymbolProps> = ({ symbol, index }) => {
  const [offset] = useState(() => ({
    x: Math.random() * 80 - 40,
    delay: Math.random() * 1000,
  }));

  return (
    <Text
      style={[
        styles.floatingSymbol,
        {
          transform: [{ translateX: offset.x }],
          opacity: 0.9,
          marginLeft: index * 20,
        },
      ]}
    >
      {symbol}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  lyricsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineContainer: {
    marginVertical: 4,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  centerLine: {
    marginVertical: 8,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    marginHorizontal: 3,
    marginVertical: 1,
    fontFamily: 'NotoSansDevanagari',
    textShadowRadius: 1,
  },
  musicContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  floatingSymbol: {
    fontSize: 28,
    color: SAFFRON,
  },
});

export default KaraokeSyncEngine;
