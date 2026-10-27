import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ChandDikhaScratchCard, ChandDikhaCardHandle } from '../src/components/ChandDikhaScratchCard';
import { useAuthStore } from '../src/store/authStore';
import { API_URL } from '../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChandDikhaScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ festival?: string; sender?: string }>();

  const currentUser = useAuthStore((state) => state.user);
  const currentUserName = (currentUser?.name || '').trim();

  const festivalName = (params.festival as string) || 'करवा चौथ';
  const initialSender = (params.sender as string) || '';

  const [senderName, setSenderName] = useState<string>(initialSender || currentUserName);
  const [isEditingSender, setIsEditingSender] = useState<boolean>(!initialSender);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const cardRef = useRef<ChandDikhaCardHandle>(null);

  // WEB ONLY: when this route is opened in a browser (app not installed, so
  // Universal/App Links couldn't claim it), redirect to the backend's instant
  // standalone HTML scratch card. Native app builds skip this entirely.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const target = `${API_URL}/chand-dikha?festival=${encodeURIComponent(
        festivalName
      )}&sender=${encodeURIComponent(initialSender)}`;
      window.location.replace(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsSharing(true);

      const senderText = senderName.trim() || 'आपके शुभचिंतक';
      // Share the brahmand.app URL: if the receiver has the app installed, OS
      // Universal/App Links open this route directly in the app; otherwise the
      // web build redirects to the backend's instant HTML scratch card.
      const webUrl = `https://brahmand.app/chand-dikha?festival=${encodeURIComponent(
        festivalName
      )}&sender=${encodeURIComponent(senderText)}`;

      const message = `🌕 *चाँद दिखा? जब तक चाँद नहीं देखा, तब तक विश नहीं मिलेगी!* 🌙\n\n✨ *${senderText}* ने आपके लिए एक गुप्त पावन मंगलकामना भेजी है!\n\n👉 अपनी उंगली से बादलों को हटाएं और चाँद का दीदार करें:\n${webUrl}\n\n॥ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ॥\nब्रह्मांड — सनातन संस्कृति एवं उत्सव`;

      await Share.share({
        title: 'चाँद दिखा? पावन शुभकामना कार्ड',
        message,
        url: webUrl,
      });
    } catch (err) {
      console.warn('[ChandDikha] Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#030712', '#081026', '#0B1736', '#030712']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FDE047" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🌙 चाँद का दीदार</Text>
            <Text style={styles.headerSubtitle}>स्क्रैच कार्ड विश</Text>
          </View>

          <TouchableOpacity
            style={styles.shareButtonTop}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={18} color="#FDE047" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Teaser Sender Callout Banner */}
          {initialSender ? (
            <View style={styles.receivedBanner}>
              <Text style={styles.receivedSparkle}>✨</Text>
              <Text style={styles.receivedText}>
                <Text style={styles.receivedSenderBold}>{initialSender}</Text> ने आपके लिए
                विशेष गुप्त शुभकामना भेजी है!
              </Text>
              <Text style={styles.receivedSparkle}>✨</Text>
            </View>
          ) : (
            <View style={styles.taglineBanner}>
              <Text style={styles.taglineText}>
                "जब तक चाँद नहीं देखा, तब तक विश नहीं मिलेगी!"
              </Text>
            </View>
          )}

          {/* The Interactive Scratch Card */}
          <ChandDikhaScratchCard
            ref={cardRef}
            festivalName={festivalName}
            senderName={senderName}
            onRevealComplete={() => setIsRevealed(true)}
          />

          {/* Sender Customization Pill */}
          <View style={styles.customizerContainer}>
            <View style={styles.customizerHeaderRow}>
              <Text style={styles.customizerLabel}>✍️ प्रेषक का नाम (Sender Name)</Text>
              {isEditingSender ? (
                <TouchableOpacity onPress={() => setIsEditingSender(false)}>
                  <Text style={styles.doneEditBtn}>Done</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingSender(true)}>
                  <Text style={styles.doneEditBtn}>बदलें</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingSender ? (
              <TextInput
                style={styles.senderInput}
                value={senderName}
                onChangeText={setSenderName}
                placeholder="उदा. राहुल, शर्मा परिवार"
                placeholderTextColor="#64748B"
                maxLength={40}
              />
            ) : (
              <View style={styles.activeSenderRow}>
                <Ionicons name="person-circle-outline" size={18} color="#FDE047" />
                <Text style={styles.activeSenderText}>
                  {senderName ? `${senderName} सपरिवार` : '॥ सर्वे भवन्तु सुखिनः ॥'}
                </Text>
              </View>
            )}
          </View>

          {/* Action Share Button */}
          <TouchableOpacity
            style={styles.sharePrimaryButton}
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareGradient}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#1E1B4B" />
              <Text style={styles.shareBtnText}>
                {isSharing ? 'तैयार हो रहा है...' : 'व्हाट्सएप पर शेयर करें'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.shareHelperText}>
            🌿 जिसे आप भेजेंगे, वो अपनी उंगली से स्क्रैच करके ही चाँद और आपकी विश देख पाएगा!
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(251, 191, 36, 0.2)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#FDE047',
    fontWeight: '600',
  },
  shareButtonTop: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  receivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    marginBottom: 14,
    gap: 6,
  },
  receivedSparkle: {
    fontSize: 13,
  },
  receivedText: {
    fontSize: 12.5,
    color: '#FEF08A',
    fontWeight: '600',
  },
  receivedSenderBold: {
    fontWeight: '900',
    color: '#FBBF24',
  },
  taglineBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FDE047',
    letterSpacing: 0.3,
  },
  customizerContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  customizerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customizerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  doneEditBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE047',
  },
  senderInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  activeSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  activeSenderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEF08A',
  },
  sharePrimaryButton: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: 0.3,
  },
  shareHelperText: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
    paddingHorizontal: 16,
    maxWidth: 360,
  },
});

export default ChandDikhaScreen;
