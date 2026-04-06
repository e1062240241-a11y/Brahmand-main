import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MantraSession {
  id: string;
  name: string;
  mantra: string;
  mantra_text: string;
  participants: number;
  duration: string;
  isLive: boolean;
  youtube_url?: string;
  audio_url?: string;
  category: string;
}

const MOCK_SESSIONS: MantraSession[] = [
  { id: '1', name: 'Morning Sadhna', mantra: 'Om Kleem Krishnaya Namah', mantra_text: 'ॐ क्लीम कृष्णाय नमः', participants: 14, duration: '45 min', isLive: true, youtube_url: 'https://www.youtube.com/watch?v=AETFvQonfV8&list=RDAETFvQonfV8&start_radio=1', category: 'Krishna' },
  { id: '2', name: 'Gayatri Mantra 108 Times', mantra: 'Om Bhur Bhuva Swaha', mantra_text: 'ॐ भूर्भुवः स्वः', participants: 9, duration: '30 min', isLive: true, youtube_url: 'https://www.youtube.com/watch?v=4y7c5O-1aPk', category: 'Gayatri' },
  { id: '3', name: 'Mahamrityunjaya Jaap', mantra: 'Om Tryambakam Yajamahe', mantra_text: 'ॐ त्र्यम्बकं यजामहे', participants: 5, duration: '20 min', isLive: true, youtube_url: 'https://www.youtube.com/watch?v=IzGM1uUzWQw', category: 'Shiv' },
  { id: '4', name: 'Om Namah Shivaya', mantra: 'Om Namah Shivaya', mantra_text: 'ॐ नमः शिवाय', participants: 12, duration: '15 min', isLive: false, youtube_url: 'https://www.youtube.com/watch?v=JmM6yQvb4wU', category: 'Shiv' },
  { id: '5', name: 'Hanuman Chalisa', mantra: 'Shri Guru Charan Saroj Raj', mantra_text: 'श्री गुरु चरण सरोज रज', participants: 8, duration: '25 min', isLive: false, youtube_url: 'https://www.youtube.com/watch?v=cmShkQPfFks', category: 'Hanuman' },
  { id: '6', name: 'Lakshmi Mantra', mantra: 'Om Shring Hoon', mantra_text: 'ॐ श्रीं श्रीं श्रीं', participants: 20, duration: '15 min', isLive: false, youtube_url: 'https://www.youtube.com/watch?v=VfT2F1F2a8k', category: 'Lakshmi' },
  { id: '7', name: 'Ganesh Mantra', mantra: 'Om Vighn Hoon', mantra_text: 'ॐ विकाह्न राय नमः', participants: 15, duration: '10 min', isLive: false, youtube_url: 'https://www.youtube.com/watch?v=ShF5e1sXZcQ', category: 'Ganesh' },
  { id: '8', name: 'Durga Mantra', mantra: 'Om Dum Durgayei', mantra_text: 'ॐ दुं दुर्गायै नमः', participants: 7, duration: '20 min', isLive: false, youtube_url: 'https://www.youtube.com/watch?v=KpR10hWbzqU', category: 'Durga' },
];

const CATEGORIES = ['All', 'Krishna', 'Shiv', 'Gayatri', 'Hanuman', 'Lakshmi', 'Ganesh', 'Durga'];

export default function MantraJaapRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const [sessions, setSessions] = useState<MantraSession[]>(MOCK_SESSIONS);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<MantraSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showYouTube, setShowYouTube] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const soundRef = useRef<Audio.Sound | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const filteredSessions = selectedCategory === 'All' 
    ? sessions 
    : sessions.filter(s => s.category === selectedCategory);

  const handleJoinSession = async (session: MantraSession) => {
    setActiveSession(session);
    if (session.youtube_url) {
      setShowYouTube(true);
    }
  };

  const handleStopSession = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setActiveSession(null);
    setShowYouTube(false);
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    let videoId = '';
    
    if (url.includes('watch?v=')) {
      const params = url.split('watch?v=')[1]?.split('&')[0];
      videoId = params || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&showinfo=0&modestbranding=1`;
    }
    return '';
  };

  const renderSessionCard = ({ item }: { item: MantraSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleRow}>
          <Text style={styles.sessionName}>{item.name}</Text>
          {item.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.sessionMantra}>{item.mantra}</Text>
        <Text style={styles.sessionMantraDevanagari}>{item.mantra_text}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.participants}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.playButton}
        onPress={() => handleJoinSession(item)}
      >
        <Ionicons name="play-circle" size={28} color="#FFFFFF" />
        <Text style={styles.playButtonText}>Play Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>🕉️ Mantra Jaap</Text>
          <Text style={styles.subtitle}> Divine Chanting Sessions</Text>
        </View>
      </View>

      {/* Live Now Banner */}
      <View style={styles.liveBanner}>
        <View style={styles.liveBannerContent}>
          <View style={styles.liveIndicatorBanner}>
            <View style={styles.liveDotBanner} />
            <Text style={styles.liveTextBanner}>LIVE NOW</Text>
          </View>
          <Text style={styles.liveBannerTitle}>Morning Sadhna - 14 Chanting</Text>
        </View>
        <TouchableOpacity 
          style={styles.liveBannerButton}
          onPress={() => handleJoinSession(sessions[0])}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sessions List */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'All Sessions' : selectedCategory} ({filteredSessions.length})
          </Text>
        }
      />

      {/* Playing Now Mini Player */}
      {activeSession && !showYouTube && (
        <View style={styles.miniPlayer}>
          <View style={styles.miniPlayerInfo}>
            <Text style={styles.miniPlayerTitle} numberOfLines={1}>{activeSession.name}</Text>
            <Text style={styles.miniPlayerSubtitle} numberOfLines={1}>{activeSession.mantra}</Text>
          </View>
          <TouchableOpacity 
            style={styles.miniPlayerButton}
            onPress={() => setShowYouTube(true)}
          >
            <Ionicons name="expand" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.miniPlayerStop}
            onPress={handleStopSession}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* YouTube Full Player Modal */}
      <Modal
        visible={showYouTube}
        animationType="slide"
        onRequestClose={() => setShowYouTube(false)}
      >
        <SafeAreaView style={styles.youtubeModalContainer}>
          <View style={styles.youtubeModalHeader}>
            <TouchableOpacity 
              style={styles.youtubeCloseButton}
              onPress={handleStopSession}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.youtubeModalTitle} numberOfLines={1}>
              {activeSession?.name || 'Mantra Jaap'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          
          {activeSession?.youtube_url && (
            <WebView
              ref={webViewRef}
              style={styles.youtubeWebView}
              source={{ uri: getYouTubeEmbedUrl(activeSession.youtube_url) }}
              javaScriptEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.youtubeLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.youtubeLoadingText}>Loading Divine Mantras...</Text>
                </View>
              )}
            />
          )}

          {/* Session Info Below Video */}
          <View style={styles.youtubeSessionInfo}>
            <Text style={styles.youtubeSessionName}>{activeSession?.name}</Text>
            <Text style={styles.youtubeSessionMantra}>{activeSession?.mantra_text}</Text>
            <View style={styles.youtubeSessionStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color={COLORS.primary} />
                <Text style={styles.statText}>{activeSession?.participants} chanting</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="musical-notes" size={16} color={COLORS.primary} />
                <Text style={styles.statText}>{activeSession?.duration}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  liveBannerContent: {
    flex: 1,
  },
  liveIndicatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDotBanner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveTextBanner: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  liveBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  liveBannerButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    marginBottom: SPACING.sm,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sessionMantra: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  sessionMantraDevanagari: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: SPACING.xs,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: SPACING.sm,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  miniPlayerInfo: {
    flex: 1,
  },
  miniPlayerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  miniPlayerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  miniPlayerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  miniPlayerStop: {
    backgroundColor: COLORS.error,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  youtubeModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  youtubeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  youtubeCloseButton: {
    padding: SPACING.xs,
    width: 40,
  },
  youtubeModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  youtubeWebView: {
    flex: 1,
    minHeight: SCREEN_WIDTH * 0.56,
  },
  youtubeLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  youtubeLoadingText: {
    marginTop: SPACING.md,
    color: COLORS.primary,
    fontSize: 14,
  },
  youtubeSessionInfo: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  youtubeSessionName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  youtubeSessionMantra: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  youtubeSessionStats: {
    flexDirection: 'row',
  },
});
