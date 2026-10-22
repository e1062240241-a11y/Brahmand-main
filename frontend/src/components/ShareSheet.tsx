import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { FestivalData, FestivalEvent } from '../types/festival';
import {
  sharePracticalGuide,
  sharePersonalisedGuide,
  shareMySchedule,
  shareFullFestival,
  sharePosterImage,
} from '../services/shareService';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  festival: FestivalData;
  heroEvent?: FestivalEvent;
  starredEvents?: FestivalEvent[];
  currentUserId?: string;
  onToast?: (message: string) => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  visible,
  onClose,
  festival,
  heroEvent = festival.communityEvents?.[0],
  starredEvents = [],
  currentUserId = 'guest',
  onToast,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCapturingPoster, setIsCapturingPoster] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const viewShotRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (onToast) {
      onToast(msg);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 3000);
    }
  };

  const handlePersonalisedSubmit = async () => {
    if (!recipientName.trim() || !heroEvent) return;

    try {
      setIsGeneratingPdf(true);
      await sharePersonalisedGuide(
        heroEvent,
        recipientName.trim(),
        currentUserId,
        festival.id,
        () => showToast('Guide link copy ho gaya!')
      );
      setRecipientName('');
    } catch (err) {
      console.error(err);
      showToast('PDF share karne mein truti aayi. Kripya punah prayas karein.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePosterShare = async () => {
    if (!viewShotRef.current) return;
    try {
      setIsCapturingPoster(true);
      const uri = await viewShotRef.current.capture();
      await sharePosterImage(uri, festival, currentUserId, () =>
        showToast('Poster copy/download ho gaya!')
      );
    } catch (err) {
      console.error(err);
      showToast('Poster banate samay truti aayi.');
    } finally {
      setIsCapturingPoster(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Share With Family & Friends</Text>
              <Text style={styles.headerSubtitle}>Kaam ki jaankari bhejein jo sabke kaam aaye</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* MODE 1: PRACTICAL GUIDE (HERO) */}
            {heroEvent && (
              <LinearGradient
                colors={['#451A03', '#271003', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.badgeRow}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>⚡ MOST FORWARDED</Text>
                  </View>
                </View>

                <View style={styles.heroContentRow}>
                  <Text style={styles.heroIcon}>🥣</Text>
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>
                      {heroEvent.title} — Shubh Samay & Guide
                    </Text>
                    <Text style={styles.heroMeta}>
                      ⏰ {heroEvent.time} {heroEvent.date ? `| 🗓️ ${heroEvent.date}` : ''}
                    </Text>
                    <Text style={styles.heroDescription} numberOfLines={2}>
                      {heroEvent.practicalSteps?.[0]?.action ||
                        'Time-sensitive niyam aur shubh samay family WhatsApp group ke liye.'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.heroButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    sharePracticalGuide(heroEvent, currentUserId, festival.id, () =>
                      showToast('Guide clipboard par copy ho gayi!')
                    )
                  }
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#0F172A" />
                  <Text style={styles.heroButtonText}>WhatsApp par Guide Bhejein</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0F172A" />
                </TouchableOpacity>
              </LinearGradient>
            )}

            {/* MODE 2: PERSONALISED SHARE */}
            {heroEvent && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>✨</Text>
                  <Text style={styles.cardTitle}>Naam wali Personalised PDF Bhejein</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Unka naam likhein. PDF ke footer mein unke liye live guide banane ka tracked QR hoga.
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Jaise: Priya, Sharma Ji"
                    placeholderTextColor="#64748B"
                    value={recipientName}
                    onChangeText={setRecipientName}
                    maxLength={35}
                  />
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      (!recipientName.trim() || isGeneratingPdf) && styles.disabledBtn,
                    ]}
                    disabled={!recipientName.trim() || isGeneratingPdf}
                    onPress={handlePersonalisedSubmit}
                  >
                    {isGeneratingPdf ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionBtnText}>PDF Share</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* MODE 3: MY SCHEDULE */}
            <View style={styles.rowCard}>
              <View style={styles.rowCardLeft}>
                <Text style={styles.cardIcon}>🗓️</Text>
                <View>
                  <Text style={styles.rowCardTitle}>Mera Festival Schedule</Text>
                  <Text style={styles.rowCardSubtitle}>
                    {starredEvents.length > 0
                      ? `${starredEvents.length} selected events`
                      : 'Apna customized schedule'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() =>
                  shareMySchedule(starredEvents, festival, currentUserId, () =>
                    showToast('Schedule copy ho gaya!')
                  )
                }
              >
                <Text style={styles.outlineBtnText}>Share List</Text>
              </TouchableOpacity>
            </View>

            {/* MODE 5: POSTER / IMAGE */}
            <View style={styles.rowCard}>
              <View style={styles.rowCardLeft}>
                <Text style={styles.cardIcon}>🖼️</Text>
                <View>
                  <Text style={styles.rowCardTitle}>Status Poster / Story</Text>
                  <Text style={styles.rowCardSubtitle}>
                    Instagram ya WhatsApp Status ke liye card
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.outlineBtn}
                disabled={isCapturingPoster}
                onPress={handlePosterShare}
              >
                {isCapturingPoster ? (
                  <ActivityIndicator size="small" color="#E2E8F0" />
                ) : (
                  <Text style={styles.outlineBtnText}>Share Card</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* MODE 4: FULL FESTIVAL (QUIET FALLBACK AT THE END) */}
            <TouchableOpacity
              style={styles.fallbackButton}
              activeOpacity={0.7}
              onPress={() =>
                shareFullFestival(festival, currentUserId, () =>
                  showToast('Festival link copy ho gaya!')
                )
              }
            >
              <Text style={styles.fallbackText}>
                Poore festival ki details share karein (All events & artists)
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Off-screen Poster Card for Image Capture */}
          <View style={styles.hiddenViewShot}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
              <LinearGradient
                colors={['#0F172A', '#1E1B4B']}
                style={styles.posterContainer}
              >
                <Text style={styles.posterTag}>BRAHMAND FESTIVAL INVITE</Text>
                <Text style={styles.posterTitle}>{festival.name}</Text>
                <Text style={styles.posterMeta}>
                  {festival.date || ''} {festival.venue ? `• ${festival.venue}` : ''}
                </Text>

                {heroEvent && (
                  <View style={styles.posterEventBox}>
                    <Text style={styles.posterEventBadge}>SPECIAL HIGHLIGHT</Text>
                    <Text style={styles.posterEventTitle}>{heroEvent.title}</Text>
                    <Text style={styles.posterEventTime}>{heroEvent.time}</Text>
                  </View>
                )}

                <View style={styles.posterFooter}>
                  <Text style={styles.posterAppBrand}>Powered by Brahmand App</Text>
                  <Text style={styles.posterCallout}>Live Reminders & Guide</Text>
                </View>
              </LinearGradient>
            </ViewShot>
          </View>

          {/* Local Toast Banner */}
          {localToast && (
            <View style={styles.toastContainer}>
              <Text style={styles.toastText}>{localToast}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  heroBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroBadgeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIcon: {
    fontSize: 26,
    marginRight: 12,
    marginTop: 2,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FEF08A',
    lineHeight: 20,
  },
  heroMeta: {
    fontSize: 12,
    color: '#FDE047',
    marginTop: 3,
    fontWeight: '600',
  },
  heroDescription: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 6,
    lineHeight: 16,
  },
  heroButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  cardDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  actionBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rowCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  rowCardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  outlineBtn: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outlineBtnText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 6,
  },
  fallbackText: {
    fontSize: 11,
    color: '#64748B',
  },
  hiddenViewShot: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  posterContainer: {
    width: 380,
    padding: 24,
    borderRadius: 16,
  },
  posterTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#F59E0B',
  },
  posterTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 6,
  },
  posterMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 14,
  },
  posterEventBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  posterEventBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FCD34D',
  },
  posterEventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  posterEventTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  posterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  posterAppBrand: {
    fontSize: 11,
    color: '#64748B',
  },
  posterCallout: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
});
