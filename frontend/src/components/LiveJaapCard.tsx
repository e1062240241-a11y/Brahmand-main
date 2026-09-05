import React from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import { SubtleJoinButton } from './SubtleJoinButton';
import { AnimatedDoubleArrow } from './AnimatedDoubleArrow';

export const JAAP_CARD_WIDTH = Platform.OS === 'android' ? 125 : 115;
export const JAAP_CARD_HEIGHT = Platform.OS === 'android' ? 190 : 180;
export const JAAP_CARD_MARGIN_RIGHT = Platform.OS === 'android' ? 12 : 16;

interface LiveJaapCardProps {
  jaap: {
    id: string;
    title: string;
    slok?: string;
    image: any;
    initialListeners?: number;
  };
  showLive: boolean;
  liveLabel: string;
  activeCount: number;
  translatedTitle: string;
  joinText: string;
  onJoin: () => void;
}

export const LiveJaapCard = React.memo(({
  jaap,
  showLive,
  liveLabel,
  activeCount,
  translatedTitle,
  joinText,
  onJoin,
}: LiveJaapCardProps) => {
  return (
    <View
      style={[
        styles.jaapCardContainer,
        { backgroundColor: '#1A0A00' }
      ]}
    >
      <Image
        source={jaap.image}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.jaapCardOverlayExact}>
        <View style={styles.jaapCardTopRow}>
          <View style={[styles.exactLiveBadge, (!showLive) && styles.mockupScheduledBadge, { maxWidth: showLive ? '65%' : '100%', paddingHorizontal: 8 }]}>
            <Ionicons name={showLive ? "radio" : "time-outline"} size={10} color="#FFF" style={{ marginRight: 3 }} />
            <Text style={[styles.exactLiveText, { flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{liveLabel}</Text>
          </View>
          {showLive && (
            <View style={styles.exactCountBadge}>
              <Ionicons name="people" size={10} color="#FFF" style={{ marginRight: 2 }} />
              <Text style={styles.exactCountText}>
                {(activeCount || 0).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.jaapCardBottomArea}>
          <Text style={styles.jaapCardTitleExact}>{translatedTitle}</Text>
          <Text style={styles.jaapCardSlokExact} numberOfLines={2}>{jaap.slok}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <SubtleJoinButton
              style={{ width: '88%' }}
              onPress={onJoin}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3.5 }}>
                <Text style={styles.exactJoinText} numberOfLines={1}>{joinText}</Text>
                <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
                  <Path d="M8.00596 0C1.85215 0 -1.99398 6.66666 1.08293 12C4.15983 17.3333 11.8521 17.3333 14.929 12C15.6306 10.7838 16 9.40429 16 8C15.9953 3.58365 12.419 0.00466837 8.00596 0ZM11.1229 8.50615L7.12585 11.2754C6.7365 11.5448 6.2017 11.2914 6.16322 10.8193C6.16187 10.8026 6.16118 10.7859 6.16118 10.7692V5.23077C6.16119 4.75705 6.67363 4.46098 7.08358 4.69784C7.09802 4.70619 7.11213 4.71512 7.12585 4.72462L11.1229 7.49384C11.4764 7.73853 11.4764 8.26147 11.1229 8.50615Z" fill="#FF7B00" />
                </Svg>
                {showLive && <AnimatedDoubleArrow color="#FF7B00" size={10} />}
              </View>
            </SubtleJoinButton>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  jaapCardContainer: {
    width: JAAP_CARD_WIDTH,
    height: JAAP_CARD_HEIGHT,
    marginRight: JAAP_CARD_MARGIN_RIGHT,
    borderRadius: 20,
    overflow: 'hidden',
  },
  jaapCardOverlayExact: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  jaapCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exactLiveBadge: {
    backgroundColor: '#E31E24',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockupScheduledBadge: {
    backgroundColor: '#FF8800',
  },
  exactLiveText: {
    color: '#FFF',
    fontSize: Platform.OS === 'android' ? 9.5 : 9,
    fontWeight: '900',
  },
  exactCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exactCountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 2,
  },
  jaapCardBottomArea: {
    width: '100%',
  },
  jaapCardTitleExact: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 6,
  },
  jaapCardSlokExact: {
    display: 'none',
  },
  exactJoinText: {
    color: '#FF6600',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default LiveJaapCard;
