// accessibility: placeholder
import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Share, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalSectionDetailCard from '../src/components/FestivalSectionDetailCard';
import { FestivalMasterCatalogCard } from '../src/components/FestivalMasterCatalogCard';
import { CustomLoader } from '../src/components/CustomLoader';
import { shareFestivalCard } from '../src/utils/shareFestivalCard';
import { shareFestivalStoryPdf, getTrackedBrahmandUrl } from '../src/utils/generateFestivalStoryPdf';
import { getFestivalImage } from '../src/constants/festivalImages';

const safeCaptureRef = async (ref: any, options: any): Promise<{ uri: string | null; error?: string }> => {
  console.log('[FestivalSectionDetail Debug] safeCaptureRef called');
  try {
    let ViewShot;
    try {
      ViewShot = require('react-native-view-shot');
    } catch (e: any) {
      console.log('[FestivalSectionDetail Debug] Failed to require react-native-view-shot:', e);
      return { uri: null, error: `require('react-native-view-shot') failed: ${e?.message || e}` };
    }

    const capture = ViewShot?.captureRef || ViewShot?.default?.captureRef || ViewShot;
    console.log('[FestivalSectionDetail Debug] ViewShot capture function type:', typeof capture);

    if (typeof capture === 'function') {
      const uri = await capture(ref, options);
      console.log('[FestivalSectionDetail Debug] captureRef returned URI:', uri);
      return { uri };
    } else {
      return { uri: null, error: `captureRef is not a function (got ${typeof capture})` };
    }
  } catch (e: any) {
    console.log('[FestivalSectionSectionDetail Debug] safeCaptureRef exception:', e);
    return { uri: null, error: `captureRef exception: ${e?.message || e}` };
  }
};

const safeShareFile = async (uri: string, options: any): Promise<{ shared: boolean; error?: string }> => {
  console.log('[FestivalSectionDetail Debug] safeShareFile called with URI:', uri);
  try {
    let Sharing;
    try {
      Sharing = require('expo-sharing');
    } catch (e: any) {
      console.log('[FestivalSectionDetail Debug] Failed to require expo-sharing:', e);
      return { shared: false, error: `require('expo-sharing') failed: ${e?.message || e}` };
    }

    if (Sharing && typeof Sharing.isAvailableAsync === 'function') {
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('[FestivalSectionDetail Debug] Sharing.isAvailableAsync():', isAvailable);
      if (isAvailable) {
        await Sharing.shareAsync(uri, options);
        console.log('[FestivalSectionDetail Debug] Sharing.shareAsync completed successfully');
        return { shared: true };
      } else {
        return { shared: false, error: 'Sharing.isAvailableAsync() returned false' };
      }
    } else {
      return { shared: false, error: 'expo-sharing isAvailableAsync is not a function' };
    }
  } catch (e: any) {
    console.log('[FestivalSectionDetail Debug] safeShareFile exception:', e);
    return { shared: false, error: `shareAsync exception: ${e?.message || e}` };
  }
};

const FestivalSectionDetailPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  const section = (params.section as string) || 'Story';
  const festivalIndex = parseInt((params.festivalIndex as string) || (params.index as string) || '0', 10);
  const isStorySection = decodeURIComponent(section) === 'Story';

  const [festival, setFestival] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const catalogRef = useRef<any>(null);

  useEffect(() => {
    const loadFestival = async () => {
      try {
        setLoading(true);
        const response = await getFestivalList();
        const items = response.data || [];
        const selected = items[festivalIndex] || items[0];
        setFestival(selected);
      } catch (err) {
        console.warn('Failed to load festival section detail', err);
        setError('Unable to load festival details.');
      } finally {
        setLoading(false);
      }
    };

    loadFestival();
  }, [festivalIndex]);

  const handleSharePdf = async () => {
    if (!festival || isSharing) return;
    try {
      setIsSharing(true);
      await shareFestivalStoryPdf(festival);
    } catch (err) {
      console.warn('Failed to share festival PDF', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareImage = async (targetApp: 'whatsapp' | 'generic' = 'whatsapp') => {
    if (!festival || isSharing) return;

    try {
      setIsSharing(true);
      const festivalName = (festival.festival_name || festival.name || festival.title || 'Sacred Festival').toUpperCase();

      let imageUri: string | null = null;
      if (catalogRef.current) {
        // Allow brief delay for view mounting & rendering
        await new Promise((res) => setTimeout(res, 300));
        const captureResult = await safeCaptureRef(catalogRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
        });
        imageUri = captureResult.uri;
      }

      // Robust fallback if view capture was null or failed
      if (!imageUri) {
        const fallbackImg = getFestivalImage(festival);
        if (fallbackImg?.uri) {
          imageUri = fallbackImg.uri;
        }
      }

      const statusTrackedUrl = getTrackedBrahmandUrl(
        festivalName,
        targetApp === 'whatsapp' ? 'whatsapp_status' : 'whatsapp_share'
      );
      await shareFestivalCard(
        imageUri,
        festivalName,
        `🌸 *${festivalName} Sacred Katha & Darshan* 🌸\n\n` +
        `Read the authentic sacred katha, daily panchang & live jaap on Brahmand App.\n\n` +
        `📲 Download Brahmand App:\n👉 ${statusTrackedUrl}`,
        targetApp
      );
    } catch (err) {
      console.warn('Failed to share festival image', err);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <CustomLoader size={70} message="Loading Festival Section..." />
      </View>
    );
  }

  if (error || !festival) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Something went wrong.'}</Text>
      </View>
    );
  }

  const renderContent = () => (
    <SafeAreaView style={{ flex: 1 }} edges={isStorySection ? [] : ['top']}>
      {/* Offscreen Full Master Catalog Image Container for Sharing Snapshot */}
      <View
        style={{
          position: 'absolute',
          left: -9999,
          top: 0,
          width: 480,
          height: 853,
          zIndex: -9999,
        }}
        pointerEvents="none"
      >
        <View
          ref={catalogRef}
          collapsable={false}
          style={{ width: 480, height: 853, backgroundColor: '#0F0818' }}
        >
          <FestivalMasterCatalogCard festival={festival} />
        </View>
      </View>

      {/* Top Header Bar */}
      <View
        style={[
          styles.header,
          isStorySection && styles.headerStoryFloating,
        ]}
      >
          <TouchableOpacity 
            style={[styles.backButton, isStorySection && styles.storyHeaderButtonCircle]} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/festival-detail?index=${festivalIndex}`);
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isStorySection ? '#FFFFFF' : '#111827'}
            />
          </TouchableOpacity>

          {!isStorySection && (
            <Text style={styles.headerTitle}>
              {decodeURIComponent(section)}
            </Text>
          )}

          {/* Share as PDF Button */}
          <TouchableOpacity 
            style={[
              styles.sharePdfButton, 
              isStorySection && styles.storySharePdfButton
            ]} 
            onPress={isStorySection ? handleSharePdf : () => handleShareImage('generic')}
            activeOpacity={0.7}
            disabled={isSharing}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share as PDF"
          >
            {isSharing ? (
              <ActivityIndicator
                size="small"
                color={isStorySection ? '#FFFFFF' : '#111827'}
              />
            ) : (
              <View style={styles.sharePdfContent}>
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color={isStorySection ? '#FFFFFF' : '#111827'}
                />
                <Text style={[styles.sharePdfText, isStorySection && styles.storySharePdfText]}>
                  Share as PDF
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isStorySection ? (
          <FestivalSectionDetailCard
            festival={festival}
            section={decodeURIComponent(section)}
            onBack={() => router.back()}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <FestivalSectionDetailCard
              festival={festival}
              section={decodeURIComponent(section)}
              onBack={() => router.back()}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    );

  if (isStorySection) {
    return (
      <View style={{ flex: 1, backgroundColor: '#030712' }}>
        <StatusBar
          translucent={true}
          barStyle="light-content"
          backgroundColor="transparent"
        />
        {renderContent()}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.1058, 0.2212]}
      style={{ flex: 1 }}
    >
      <StatusBar
        translucent={false}
        barStyle="dark-content"
        backgroundColor="#FF8D57"
      />
      {renderContent()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'transparent',
  },
  headerStoryFloating: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 38,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
  },
  storyHeaderButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePdfButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storySharePdfButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sharePdfContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sharePdfText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  storySharePdfText: {
    color: '#FFFFFF',
  },
});

export default FestivalSectionDetailPage;

