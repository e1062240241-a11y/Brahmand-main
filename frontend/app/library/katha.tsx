import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const shamikPathakCover = require('../../assets/images/shamik_pathak_ji.jpg');

export default function KathaPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.09, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1B1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Katha</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content Container */}
      <View style={styles.content}>
        {/* Sample Card (Library Listing Style) */}
        <TouchableOpacity
          style={styles.bookCard}
          activeOpacity={0.92}
        >
          <View style={styles.coverBox}>
            <Image source={shamikPathakCover} style={styles.coverImg} resizeMode="cover" />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <TouchableOpacity style={styles.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="heart-outline" size={15} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.bookMeta}>
            <Text style={styles.bookName} numberOfLines={1}>Shamik Pathak ji</Text>
            <Text style={styles.bookSub} numberOfLines={1}>Spiritual Guru,Astrologer,Panditji</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_W = 192;
const CARD_COVER_H = 300;
const DARK = '#1B1C1C';
const BROWN = '#5A4136';
const ORANGE = '#FF6B00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  content: {
    paddingTop: 20,
    paddingLeft: 22,
  },
  bookCard: {
    width: CARD_W,
  },
  coverBox: {
    width: '100%',
    height: CARD_COVER_H,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(160,65,0,0.20)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookMeta: {
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'center',
  },
  bookName: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 4,
    lineHeight: 22,
    textAlign: 'center',
  },
  bookSub: {
    fontSize: 12,
    color: BROWN,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.2,
    lineHeight: 18,
    textAlign: 'center',
  },
});
