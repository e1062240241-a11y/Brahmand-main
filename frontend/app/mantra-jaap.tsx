import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Modal, ActivityIndicator, BackHandler, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';

// Dynamically import WebView only for native platforms
let WebViewComponent: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  try {
    const { WebView } = require('react-native-webview');
    WebViewComponent = WebView;
  } catch (e) {
    console.log('WebView not available:', e);
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MantraItem {
  id: string;
  name: string;
  mantra: string;
  mantraText: string;
  youtubeUrl: string;
  duration: string;
  category: string;
}

const MANTRA_LIST: MantraItem[] = [
  {
    id: '1',
    name: 'Morning Sadhna',
    mantra: 'Om Kleem Krishnaya Namah',
    mantraText: 'ॐ क्लीम कृष्णाय नमः',
    youtubeUrl: 'https://www.youtube.com/watch?v=AETFvQonfV8',
    duration: '45 min',
    category: 'Krishna',
  },
  {
    id: '2',
    name: 'Gayatri Mantra',
    mantra: 'Om Bhur Bhuva Swaha',
    mantraText: 'ॐ भूर्भुवः स्वः',
    youtubeUrl: 'https://www.youtube.com/watch?v=4y7c5O-1aPk',
    duration: '30 min',
    category: 'Gayatri',
  },
  {
    id: '3',
    name: 'Mahamrityunjaya Jaap',
    mantra: 'Om Tryambakam Yajamahe',
    mantraText: 'ॐ त्र्यम्बकं यजामहे',
    youtubeUrl: 'https://www.youtube.com/watch?v=IzGM1uUzWQw',
    duration: '20 min',
    category: 'Shiv',
  },
  {
    id: '4',
    name: 'Om Namah Shivaya',
    mantra: 'Om Namah Shivaya',
    mantraText: 'ॐ नमः शिवाय',
    youtubeUrl: 'https://www.youtube.com/watch?v=JmM6yQvb4wU',
    duration: '15 min',
    category: 'Shiv',
  },
  {
    id: '5',
    name: 'Hanuman Chalisa',
    mantra: 'Shri Guru Charan Saroj Raj',
    mantraText: 'श्री गुरु चरण सरोज रज',
    youtubeUrl: 'https://www.youtube.com/watch?v=cmShkQPfFks',
    duration: '25 min',
    category: 'Hanuman',
  },
  {
    id: '6',
    name: 'Lakshmi Mantra',
    mantra: 'Om Shring Hoon',
    mantraText: 'ॐ श्रीं श्रीं श्रीं',
    youtubeUrl: 'https://www.youtube.com/watch?v=VfT2F1F2a8k',
    duration: '15 min',
    category: 'Lakshmi',
  },
  {
    id: '7',
    name: 'Ganesh Mantra',
    mantra: 'Om Vighn Hoon',
    mantraText: 'ॐ विकाह्न राय नमः',
    youtubeUrl: 'https://www.youtube.com/watch?v=ShF5e1sXZcQ',
    duration: '10 min',
    category: 'Ganesh',
  },
  {
    id: '8',
    name: 'Durga Mantra',
    mantra: 'Om Dum Durgayei',
    mantraText: 'ॐ दुं दुर्गायै नमः',
    youtubeUrl: 'https://www.youtube.com/watch?v=KpR10hWbzqU',
    duration: '20 min',
    category: 'Durga',
  },
];

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
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&showinfo=0&modestbranding=1&rel=0& playsinline=1`;
  }
  return '';
};

// Web-safe YouTube iframe component
const YouTubeWebPlayer = ({ videoId }: { videoId: string }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&showinfo=0&modestbranding=1&rel=0`;
  
  return (
    <View style={styles.webViewContainer}>
      <iframe
        src={embedUrl}
        style={styles.iframe}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="Mantra Player"
      />
    </View>
  );
};

export default function MantraJaapScreen() {
  const router = useRouter();
  const [selectedMantra, setSelectedMantra] = useState<MantraItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showPlayer) {
        setShowPlayer(false);
        return true;
      }
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [showPlayer]);

  const handleBack = () => {
    setTimeout(() => {
      const canGoBack = router.canGoBack();
      if (canGoBack) {
        router.back();
      } else {
        router.replace('/(tabs)/messages' as any);
      }
    }, 100);
  };

  const handlePlayMantra = async (mantra: MantraItem) => {
    setSelectedMantra(mantra);
    setShowPlayer(true);
    setIsPlaying(true);
    
    // Try to play audio on native
    if (Platform.OS !== 'web') {
      try {
        setAudioLoading(true);
        
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }
        
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
          { shouldPlay: true, isLooping: true }
        );
        
        soundRef.current = sound;
        setAudioLoading(false);
      } catch (error) {
        console.log('Audio playback error:', error);
        setAudioLoading(false);
      }
    }
  };

  const handleStopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setShowPlayer(false);
    setIsPlaying(false);
    setSelectedMantra(null);
  };

  const getVideoId = (url: string): string => {
    if (!url) return '';
    if (url.includes('watch?v=')) {
      return url.split('watch?v=')[1]?.split('&')[0] || '';
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    return '';
  };

  const renderMantraItem = ({ item }: { item: MantraItem }) => (
    <TouchableOpacity 
      style={styles.mantraCard}
      onPress={() => handlePlayMantra(item)}
    >
      <View style={styles.mantraCardLeft}>
        <View style={styles.mantraIconContainer}>
          <Ionicons name="musical-notes" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.mantraInfo}>
          <Text style={styles.mantraName}>{item.name}</Text>
          <Text style={styles.mantraText}>{item.mantraText}</Text>
          <View style={styles.mantraMeta}>
            <Text style={styles.mantraCategory}>{item.category}</Text>
            <Text style={styles.mantraDuration}>{item.duration}</Text>
          </View>
        </View>
      </View>
      <View style={styles.mantraCardRight}>
        <Ionicons name="play-circle" size={36} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderVideoPlayer = () => {
    if (!selectedMantra) return null;
    
    const videoId = getVideoId(selectedMantra.youtubeUrl);
    
    if (Platform.OS === 'web') {
      // Use iframe for web
      return <YouTubeWebPlayer videoId={videoId} />;
    }
    
    // Use WebView for native
    if (WebViewComponent) {
      return (
        <WebViewComponent
          ref={webViewRef}
          style={styles.webViewNative}
          source={{ uri: getYouTubeEmbedUrl(selectedMantra.youtubeUrl) }}
          javaScriptEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.videoLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.videoLoadingText}>Loading...</Text>
            </View>
          )}
        />
      );
    }
    
    // Fallback if no WebView
    return (
      <TouchableOpacity 
        style={styles.fallbackContainer}
        onPress={() => Linking.openURL(selectedMantra.youtubeUrl)}
      >
        <Ionicons name="logo-youtube" size={64} color="#FF0000" />
        <Text style={styles.fallbackText}>Tap to play on YouTube</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🕉️ Mantra Jaap</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Now Playing Banner */}
      {isPlaying && selectedMantra && !showPlayer && (
        <TouchableOpacity 
          style={styles.nowPlayingBanner}
          onPress={() => setShowPlayer(true)}
        >
          <View style={styles.nowPlayingContent}>
            <Ionicons name="musical-note" size={20} color="#FFFFFF" />
            <Text style={styles.nowPlayingText}>
              Now Playing: {selectedMantra.name}
            </Text>
          </View>
          <Ionicons name="play" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Mantra List */}
      <FlatList
        data={MANTRA_LIST}
        renderItem={renderMantraItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.titleSection}>
            <Text style={styles.title}>Select a Mantra to Chant</Text>
            <Text style={styles.subtitle}>Tap on any mantra to start the spiritual practice</Text>
          </View>
        }
      />

      {/* Mini Player */}
      {isPlaying && selectedMantra && (
        <TouchableOpacity 
          style={styles.miniPlayer}
          onPress={() => setShowPlayer(true)}
        >
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniPlayerIcon}>
              <Ionicons name="musical-note" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.miniPlayerInfo}>
              <Text style={styles.miniPlayerTitle} numberOfLines={1}>
                {selectedMantra.name}
              </Text>
              <Text style={styles.miniPlayerSubtitle} numberOfLines={1}>
                {selectedMantra.mantraText}
              </Text>
            </View>
          </View>
          <View style={styles.miniPlayerActions}>
            <TouchableOpacity 
              style={styles.miniPlayerStopButton}
              onPress={handleStopPlayback}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Full Player Modal */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        onRequestClose={() => setShowPlayer(false)}
      >
        <SafeAreaView style={styles.playerContainer}>
          <View style={styles.playerHeader}>
            <TouchableOpacity 
              style={styles.playerCloseButton}
              onPress={() => setShowPlayer(false)}
            >
              <Ionicons name="chevron-down" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedMantra?.name || 'Mantra Jaap'}
            </Text>
            <TouchableOpacity 
              style={styles.playerStopButton}
              onPress={handleStopPlayback}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {selectedMantra && (
            <>
              <View style={styles.videoWrapper}>
                {renderVideoPlayer()}
              </View>

              <View style={styles.mantraDetails}>
                <Text style={styles.mantraDetailsName}>{selectedMantra.name}</Text>
                <Text style={styles.mantraDetailsText}>{selectedMantra.mantraText}</Text>
                <Text style={styles.mantraDetailsMantra}>{selectedMantra.mantra}</Text>
                
                <View style={styles.mantraDetailsMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="musical-notes" size={16} color={COLORS.primary} />
                    <Text style={styles.metaText}>{selectedMantra.category}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={16} color={COLORS.primary} />
                    <Text style={styles.metaText}>{selectedMantra.duration}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
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
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  titleSection: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  mantraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  mantraCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mantraIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  mantraInfo: {
    flex: 1,
  },
  mantraName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  mantraText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
  },
  mantraMeta: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  mantraCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  mantraDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  mantraCardRight: {
    marginLeft: SPACING.sm,
  },
  nowPlayingBanner: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniPlayerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  miniPlayerInfo: {
    flex: 1,
  },
  miniPlayerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  miniPlayerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  miniPlayerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerStopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  playerCloseButton: {
    padding: SPACING.xs,
  },
  playerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  playerStopButton: {
    padding: SPACING.xs,
  },
  videoWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.5625,
    backgroundColor: '#000',
  },
  webViewNative: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  videoLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoLoadingText: {
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    marginTop: SPACING.md,
    fontSize: 16,
  },
  mantraDetails: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  mantraDetailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  mantraDetailsText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
  },
  mantraDetailsMantra: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  mantraDetailsMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
});
