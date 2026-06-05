import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Share, Dimensions, Modal, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { usePassportStore } from '../../../src/store/passportStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');

export default function CertificateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const certificates = usePassportStore((state) => state.certificates);
  
  const [menuVisible, setMenuVisible] = useState(false);

  // Find current certificate or use dummy data from mockup as fallback
  const certificate = certificates.find((c) => c.id === id) || {
    id: 'dummy',
    book_name: 'BHAGAWAD GITA',
    completion_days: 12,
    date: '2024-05-25T00:00:00.000Z'
  };

  const formattedDate = new Date(certificate.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/timeline' as any);
    }
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `I have successfully completed reading ${certificate.book_name} on Brahmand App! Here is my Certificate of Completion.`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peach to Cream Gradient */}
      <LinearGradient 
        colors={['#FFB085', '#FFF7F2', '#FFFDFB']} 
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificates</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Certificate Frame Card */}
        <View style={styles.certCard}>
          <ImageBackground
            source={require('../../../assets/images/CC.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Dynamic Name Overlay (covers the letter "S" or custom cert name field) */}
            <View style={styles.nameOverlay}>
              <Text style={styles.nameText} numberOfLines={1} adjustsFontSizeToFit>
                {user?.name || 'SMINIL SHARAD LONDHE'}
              </Text>
            </View>

            {/* Dynamic Book Title Overlay (covers the book name field) */}
            <View style={styles.bookOverlay}>
              <Text style={styles.bookText} numberOfLines={1} adjustsFontSizeToFit>
                {certificate.book_name.toUpperCase()}
              </Text>
            </View>

            {/* Dynamic Date Overlay (covers the date field) */}
            <View style={styles.dateOverlay}>
              <Text style={styles.dateText} numberOfLines={1} adjustsFontSizeToFit>
                {formattedDate}
              </Text>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Menu Modal Dropdown */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color="#000" style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#000" style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Select</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  certCard: {
    width: windowWidth * 0.92,
    maxWidth: 380,
    aspectRatio: 1024 / 1792, // Standard DALL-E vertical aspect ratio (0.5714)
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#FAF5EC',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  nameOverlay: {
    position: 'absolute',
    top: '31.5%',
    left: '5%',
    right: '5%',
    alignItems: 'center',
  },
  nameText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#0D2C59',
    backgroundColor: '#FAF5EC', // Blends with warm certificate parchment color
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  bookOverlay: {
    position: 'absolute',
    top: '40.8%', // Centered on the book name line
    left: '5%',
    right: '5%',
    alignItems: 'center',
  },
  bookText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '900',
    color: '#0D2C59',
    letterSpacing: 0.8,
    backgroundColor: '#FAF5EC',
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  dateOverlay: {
    position: 'absolute',
    top: '64.0%',
    left: '14%',
    width: '20%',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0D2C59',
    backgroundColor: '#FAF5EC',
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownMenu: {
    marginTop: Platform.OS === 'ios' ? 90 : 60,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 16,
  },
});
