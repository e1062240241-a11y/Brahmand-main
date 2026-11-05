import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import {
  DHANTERAS_CITIES,
  DhanterasCityMuhurat,
  detectUserDhanterasCity,
} from '../utils/dhanterasMuhurat';
import { DhanterasShareCard } from './DhanterasShareCard';
import { shareFestivalCard } from '../utils/shareFestivalCard';

const safeCaptureRef = async (ref: any, options: any): Promise<{ uri: string | null; error?: string }> => {
  try {
    const ViewShot = require('react-native-view-shot');
    const capture = ViewShot?.captureRef || ViewShot?.default?.captureRef || ViewShot;
    if (typeof capture === 'function') {
      const uri = await capture(ref, options);
      return { uri };
    }
    return { uri: null, error: 'captureRef is not a function' };
  } catch (e: any) {
    return { uri: null, error: e?.message || String(e) };
  }
};

export const DhanterasCoinShareButton: React.FC = React.memo(function DhanterasCoinShareButton() {
  const user = useAuthStore((state) => state.user);
  const [selectedCity, setSelectedCity] = useState<DhanterasCityMuhurat>(DHANTERAS_CITIES[0]);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const shareCardRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    detectUserDhanterasCity(user).then((res) => {
      if (isMounted && res.city) {
        setSelectedCity(res.city);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleShareDhanteras = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}

      const msg = `📲 डाउनलोड करें ब्रह्मांड ऐप:\nhttps://play.google.com/store/apps/details?id=com.brahmand.app`;

      let imageUri: string | null = null;
      if (shareCardRef.current) {
        await new Promise((res) => setTimeout(res, 400));
        const captureResult = await safeCaptureRef(shareCardRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
        });
        imageUri = captureResult.uri;
      }

      // Guaranteed fallback to pre-rendered Dhanteras Gold Coin (transparent PNG)
      if (!imageUri) {
        try {
          const fallbackSource = RNImage.resolveAssetSource(
            require('../../assets/images/festivals/dhanteras_coin_with_wishes.png')
          );
          if (fallbackSource?.uri) {
            imageUri = fallbackSource.uri;
          }
        } catch (_err) {}
      }

      await shareFestivalCard(
        imageUri,
        'Dhanteras',
        msg,
        'whatsapp'
      );
    } catch (err) {
      console.warn('[DhanterasCoinShareButton] Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShareDhanteras}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Share your digital gold coin today on WhatsApp"
      >
        <LinearGradient
          colors={['#D97706', '#B45309', '#92400E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shareBtnGradient}
        >
          <RNImage
            source={require('../../assets/images/festivals/dhanteras_gold_coin.png')}
            style={styles.coinIcon}
            resizeMode="contain"
          />
          <Text
            style={styles.shareBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.85}
          >
            {isSharing ? 'गोल्ड कॉइन तैयार हो रहा है...' : 'Share your digital gold coin today'}
          </Text>
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Off-screen Render of Dhanteras Gold Coin (Pure Transparent Background) */}
      <View style={styles.offscreenShareContainer} pointerEvents="none">
        <View collapsable={false} style={{ width: 500, height: 500, backgroundColor: 'transparent' }}>
          <DhanterasShareCard
            ref={shareCardRef}
            userName={user?.name || ''}
            cityName={selectedCity.hindiCity}
            muhurat={selectedCity.muhurat}
            pradoshKaal={selectedCity.pradoshKaal}
            vrishabhaLagna={selectedCity.vrishabhaLagna}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  shareButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  coinIcon: {
    width: 24,
    height: 24,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'center',
  },
  offscreenShareContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 500,
    height: 500,
    opacity: 1,
    zIndex: -999,
  },
});

export default DhanterasCoinShareButton;

