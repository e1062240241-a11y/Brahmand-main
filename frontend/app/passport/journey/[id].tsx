import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePassportStore } from '../../../src/store/passportStore';
import { useAuthStore } from '../../../src/store/authStore';
import withObservables from '@nozbe/with-observables';
import { database } from '../../../src/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

function PassportJourneyDetailScreen({ observedJourneys = [] }: { observedJourneys?: any[] }) {
  const { id, justRecorded } = useLocalSearchParams<{ id: string; justRecorded?: string }>();
  const router = useRouter();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const user = useAuthStore((state) => state.user);
  
  const [showFullStory, setShowFullStory] = useState(false);

  useEffect(() => {
    loadPassport();
  }, []);

  const journey = useMemo(() => observedJourneys.find((item) => item.id === id), [observedJourneys, id]);

  const travelWith = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('traveling with'))?.answer;
  }, [journey]);

  const duration = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('duration'))?.answer;
  }, [journey]);

  const feelings = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return [];
    const feelingsAnswer = journey.answers.find((a: any) => a?.question?.toLowerCase().includes('feel'))?.answer;
    return feelingsAnswer && typeof feelingsAnswer === 'string'
      ? feelingsAnswer.split(',').map((f: string) => f.trim())
      : [];
  }, [journey]);

  const darshanExp = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('darshan experience'))?.answer;
  }, [journey]);

  const touchedHeart = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('touched your heart'))?.answer;
  }, [journey]);

  const unforgettableMemory = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('unforgettable memory'))?.answer;
  }, [journey]);

  const pujaAnswer = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('puja'))?.answer;
  }, [journey]);

  const stayAnswer = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('staying'))?.answer;
  }, [journey]);

  const accommodationAnswer = useMemo(() => {
    if (!journey || !Array.isArray(journey.answers)) return null;
    return journey.answers.find((a: any) => a?.question?.toLowerCase().includes('accommodation'))?.answer;
  }, [journey]);

  const cleanLocation = useMemo(() => {
    if (!journey?.location || typeof journey.location !== 'string') return 'YATRA';
    const parts = journey.location.split(',');
    return ((parts[0] || '').trim()).toUpperCase() + ' YATRA';
  }, [journey?.location]);

  const cityName = useMemo(() => {
    if (!journey?.location || typeof journey.location !== 'string') return 'the sacred site';
    const parts = journey.location.split(',');
    return (parts[0] || '').trim();
  }, [journey?.location]);

  const formattedDate = useMemo(() => {
    if (!journey?.date) return 'YATRA';
    try {
      const d = new Date(journey.date);
      if (isNaN(d.getTime())) return String(journey.date).toUpperCase();
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    } catch {
      return String(journey.date).toUpperCase();
    }
  }, [journey?.date]);

  if (!journey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Journey not found.</Text>
          <TouchableOpacity style={styles.exitButton} onPress={() => router.push('/passport/timeline' as any)}>
            <Text style={styles.exitButtonText}>Back to Timeline</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    await Share.share({
      message: `${journey.title} – ${journey.location}\n\n${journey.story}`,
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/timeline' as any);
    }
  };

  const handleExit = () => {
    router.replace('/home' as any);
  };

  const firstPhoto = journey.media && journey.media.find((m: any) => m.type === 'photo');
  const mainContentText = darshanExp || journey.story;

  // Truncate story if not showing full
  const displayStory = showFullStory 
    ? mainContentText 
    : (mainContentText && mainContentText.length > 150 ? `${mainContentText.substring(0, 150)}` : mainContentText || '');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peachish Gradient */}
      <LinearGradient 
        colors={['#FF8D57', '#EA9B76', '#FFEEE5', '#FFFFFF']}
        locations={[0, 0.0913, 0.25, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {justRecorded === 'true' ? (
          /* Success Header */
          <View style={styles.successHeader}>
            <View style={styles.checkIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color="#964900" />
            </View>
            <Text style={styles.successTitle}>Your Journey is Recorded</Text>
            <Text style={styles.successSubtitle}>
              The winds of {cityName} carry your devotion home.
            </Text>
          </View>
        ) : (
          /* Standard Header Back Button */
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Spiritual Journey</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Card Container */}
        <View style={styles.cardContainer}>
          {/* User Header */}
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              {user?.photo && user.photo !== 'nan' && user.photo !== 'NaN' && user.photo !== 'None' && user.photo !== '' ? (
                <Image source={{ uri: user.photo }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={16} color="#FFF" />
                </View>
              )}
              <Text style={styles.userName}>{user?.name || 'Pilgrim'}</Text>
            </View>
          </View>

          {/* Hero Image */}
          <View style={styles.heroImageWrapper}>
            {firstPhoto ? (
              <Image source={{ uri: firstPhoto.uri }} style={styles.heroImage} contentFit="cover" />
            ) : (
              <View style={[styles.heroImagePlaceholder, { backgroundColor: '#F5ECE3' }]}>
                <Ionicons name="image-outline" size={48} color="#A9968F" />
              </View>
            )}

            {/* Top Badges (Yatra / Date) */}
            <View style={styles.topBadgesContainer}>
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>{cleanLocation}</Text>
              </View>
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            {/* Bottom Badges */}
            <View style={styles.bottomBadgesContainer}>
              {travelWith && (
                <View style={styles.bottomBadge}>
                  <Text style={styles.bottomBadgeText}>{travelWith.toUpperCase()}</Text>
                </View>
              )}
              {duration && (
                <View style={styles.bottomBadge}>
                  <Text style={styles.bottomBadgeText}>{duration.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>DARSHAN EXPERIENCE</Text>
            <Text style={styles.contentBody}>
              {displayStory}
              {(mainContentText?.length ?? 0) > 150 && (
                <Text style={styles.moreLink} onPress={() => setShowFullStory(!showFullStory)}>
                  {showFullStory ? '  less.....' : '  more.....'}
                </Text>
              )}
            </Text>

            {/* Feelings Tags */}
            {feelings.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {feelings.map((f: string, i: number) => (
                  <View key={i} style={{ backgroundColor: '#FFE088', borderRadius: 9999, paddingVertical: 4, paddingHorizontal: 12 }}>
                    <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Touched Heart / Unforgettable Memory Card */}
            {(!!touchedHeart || !!unforgettableMemory) && (
              <View style={styles.nestedCard}>
                <Text style={styles.nestedCardTitle}>MOMENT OF CONNECT</Text>
                <Text style={styles.nestedCardBody}>{touchedHeart || unforgettableMemory}</Text>
              </View>
            )}

            {/* Sacred Highlights Card */}
            {(!!pujaAnswer || !!stayAnswer || !!accommodationAnswer) && (
              <View style={styles.nestedCard}>
                <Text style={styles.nestedCardTitle}>SACRED HIGHLIGHTS</Text>
                
                {!!pujaAnswer && (
                  <View style={styles.highlightRow}>
                    <Ionicons name="notifications" size={14} color="#FF8C32" style={{ marginRight: 6 }} />
                    <Text style={styles.highlightText}>{pujaAnswer}</Text>
                  </View>
                )}

                {!!stayAnswer && (
                  <View style={styles.highlightRow}>
                    <FontAwesome5 name="place-of-worship" size={12} color="#FF8C32" style={{ marginRight: 6 }} />
                    <Text style={styles.highlightText}>{stayAnswer}</Text>
                  </View>
                )}

                {!!accommodationAnswer && (
                  <View style={styles.highlightRow}>
                    <Ionicons name="home" size={14} color="#FF8C32" style={{ marginRight: 6 }} />
                    <Text style={styles.highlightText}>{accommodationAnswer}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Primary Exit Button */}
        <TouchableOpacity style={styles.exitButton} activeOpacity={0.8} onPress={handleExit}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#564337',
    marginBottom: 20,
  },
  successHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    width: '100%',
  },
  checkIconWrap: {
    marginBottom: 12,
  },
  successTitle: {
    color: '#964900',
    fontFamily: 'SF Pro',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    marginTop: 10,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1B17',
  },
  cardContainer: {
    width: 350,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232, 225, 218, 0.50)',
    borderRadius: 12,
    padding: 12,
    shadowColor: 'rgba(74, 44, 0, 0.08)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1B17',
    fontFamily: 'Plus Jakarta Sans',
  },
  heroImageWrapper: {
    width: '100%',
    height: 261,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
  },
  topBadge: {
    backgroundColor: 'rgba(255, 248, 241, 0.90)',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  topBadgeText: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomBadgesContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  bottomBadge: {
    backgroundColor: 'rgba(255, 140, 50, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBadgeText: {
    color: '#FFF',
    fontFamily: 'SF Pro',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  contentSection: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  contentTitle: {
    color: '#1E1B17',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  contentBody: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
  },
  moreLink: {
    color: '#FF7B00',
    fontFamily: 'SF Pro',
    fontSize: 16,
    fontWeight: '400',
  },
  nestedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C32',
    backgroundColor: '#FFF8F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  nestedCardTitle: {
    color: '#FF8C32',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  nestedCardBody: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  highlightText: {
    color: '#564337',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  exitButton: {
    width: 350,
    maxWidth: '100%',
    height: 64,
    backgroundColor: '#FF8C32',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
  },
  exitButtonText: {
    color: '#FFF',
    fontFamily: 'SF Pro',
    fontSize: 18,
    fontWeight: '600',
  },
});

const enhance = withObservables([], () => ({
  observedJourneys: database.get('passport_journeys').query().observe(),
}));

export default enhance(PassportJourneyDetailScreen);
