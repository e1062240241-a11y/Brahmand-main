import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuthStore } from '../store/authStore';
import {
  DIWALI_CITIES,
  DiwaliCityMuhurat,
  detectUserDiwaliCity,
  DIWALI_2026_CONFIG,
} from '../utils/diwaliMuhurat';
import { DiwaliShareCard } from './DiwaliShareCard';
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

export const DiwaliWishShareButton: React.FC = React.memo(function DiwaliWishShareButton() {
  const user = useAuthStore((state) => state.user);
  const [selectedCity, setSelectedCity] = useState<DiwaliCityMuhurat>(DIWALI_CITIES[0]);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const shareCardRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    detectUserDiwaliCity(user).then((res) => {
      if (isMounted && res.city) {
        setSelectedCity(res.city);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const userName = (user?.name || (user as any)?.username || '').trim();
  const senderText = userName ? `${userName} जी एवं परिवार` : 'सपरिवार';
  const cityName = selectedCity.hindiCity ? selectedCity.hindiCity.split('/')[0].trim() : selectedCity.cityName;
  const muhuratTime = selectedCity.muhurat || DIWALI_2026_CONFIG.mainPujaMuhurat;

  const handleShareDiwali = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}

      const msg = `🪔 *शुभ दीपावली की हार्दिक शुभकामनाएं!* ✨\n👉 https://play.google.com/store/apps/details?id=com.brahmand.app`;

      let imageUri: string | null = null;

      // 1. Primary: Capture the personalized Diwali Wish Card with wishes inscribed directly on the card
      if (shareCardRef.current) {
        try {
          await new Promise((res) => setTimeout(res, 350));
          const captureResult = await safeCaptureRef(shareCardRef, {
            format: 'png',
            quality: 0.95,
            result: 'tmpfile',
          });
          if (captureResult?.uri) {
            imageUri = captureResult.uri;
          }
        } catch (_capErr) {
          console.warn('[DiwaliWishShareButton] ViewShot capture error:', _capErr);
        }
      }

      // 2. Guaranteed Fallback: High-resolution card with full wishes inscribed on the image
      if (!imageUri) {
        try {
          const fallbackAsset = Asset.fromModule(
            require('../../assets/images/festivals/diwali_card_with_wishes.jpg')
          );
          await fallbackAsset.downloadAsync();
          const assetUri = fallbackAsset.localUri || fallbackAsset.uri;
          if (assetUri) {
            const friendlyFileName = `Shubh_Diwali_Greeting.jpg`;
            const baseDir =
              (Platform.OS === 'android'
                ? FileSystem.cacheDirectory
                : FileSystem.documentDirectory || FileSystem.cacheDirectory) || FileSystem.cacheDirectory;
            const targetPath = `${baseDir}${friendlyFileName}`;
            try {
              const info = await FileSystem.getInfoAsync(targetPath);
              if (info.exists) {
                await FileSystem.deleteAsync(targetPath, { idempotent: true });
              }
              await FileSystem.copyAsync({
                from: assetUri,
                to: targetPath,
              });
              imageUri = targetPath;
            } catch {
              imageUri = assetUri;
            }
          }
        } catch (_assetErr) {
          console.warn('[DiwaliWishShareButton] Fallback asset resolve error:', _assetErr);
        }
      }

      // Minimal text message shared along with the image card
      await shareFestivalCard(
        imageUri,
        'Diwali',
        msg,
        'whatsapp'
      );
    } catch (err) {
      console.warn('[DiwaliWishShareButton] Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Clean, Simple Outside Button as originally designed */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShareDiwali}
        disabled={isSharing}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Share your personalized Diwali wishing card on WhatsApp"
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
              <Ionicons name="flame" size={20} color="#FEF08A" />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>
              {isSharing ? 'तैयार हो रहा है...' : 'दीपावली शुभकामना कार्ड भेजें'}
            </Text>
          </View>
          <View style={styles.shareIconPill}>
            <Ionicons name="share-social" size={17} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Hidden Render of the Divine Diwali Share Card with full inscribed wishes for ViewShot Snapshots */}
      <View style={styles.offscreenContainer} pointerEvents="none">
        <View collapsable={false} style={{ width: 735, height: 490, backgroundColor: '#FBF8F2' }}>
          <DiwaliShareCard
            ref={shareCardRef}
            userName={userName}
            cityName={cityName}
            muhurat={muhuratTime}
            pradoshKaal={DIWALI_2026_CONFIG.pradoshKaal}
            vrishabhaLagna={DIWALI_2026_CONFIG.vrishabhaLagna}
          />
        </View>
      </View>
    </View>
  );
});

export default DiwaliWishShareButton;

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
  shareIconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offscreenContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 735,
    height: 490,
    opacity: 1,
    zIndex: -1,
  },
});
