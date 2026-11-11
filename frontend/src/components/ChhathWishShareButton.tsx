import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { shareFestivalStoryPdf, prewarmFestivalStoryPdf } from '../utils/generateFestivalStoryPdf';

export interface ChhathWishShareButtonProps {
  festival?: any;
}

export const ChhathWishShareButton: React.FC<ChhathWishShareButtonProps> = React.memo(
  function ChhathWishShareButton({ festival }) {
    const [isSharing, setIsSharing] = useState<boolean>(false);

    const festivalObj = festival || {
      id: 'chhath-puja',
      name: 'Chhath Puja',
      festival_name: 'Chhath Puja',
      title: 'Chhath Puja',
      date: '2026-11-13',
    };

    // Prewarm PDF in background so sharing is instant when tapped
    useEffect(() => {
      try {
        prewarmFestivalStoryPdf(festivalObj);
      } catch (_err) {}
    }, [festivalObj]);

    const handleShareChhathPdf = async () => {
      if (isSharing) return;
      try {
        setIsSharing(true);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (_e) {}

        await shareFestivalStoryPdf(festivalObj);
      } catch (err) {
        console.warn('[ChhathWishShareButton] PDF share error:', err);
      } finally {
        setIsSharing(false);
      }
    };

    return (
      <View style={styles.container}>
        {/* Sacred Saffron / Surya Ochre Gradient Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareChhathPdf}
          disabled={isSharing}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share Chhath Puja complete Katha and Wishes PDF booklet"
        >
          <LinearGradient
            colors={['#EA580C', '#C2410C', '#9A3412']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareGradient}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 6 }} />
            ) : (
              <View style={styles.iconCircle}>
                <Ionicons name="document-text" size={20} color="#FEF08A" />
              </View>
            )}
            <View style={styles.textContainer}>
              <Text style={styles.mainTitle}>
                {isSharing ? 'PDF तैयार हो रही है...' : 'छठ महापर्व सम्पूर्ण कथा व शुभकामनाएं PDF'}
              </Text>
              <Text style={styles.subTitle}>
                अपने नाम के साथ परिवार व मित्रों को 3-पेज सचित्र PDF भेजें
              </Text>
            </View>
            <View style={styles.shareIconPill}>
              <Ionicons name="share-social" size={17} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }
);

ChhathWishShareButton.displayName = 'ChhathWishShareButton';

export const ChhathPdfShareButton = ChhathWishShareButton;

export default ChhathWishShareButton;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(254, 240, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.4)',
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subTitle: {
    color: '#FED7AA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  shareIconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
