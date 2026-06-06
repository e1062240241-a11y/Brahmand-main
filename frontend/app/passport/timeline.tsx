import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePassportStore } from '../../src/store/passportStore';
import { PassportJourney } from '../../src/types/passport';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';


const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function PassportTimelineScreen({
  observedJourneys,
  observedBadges,
  observedCertificates,
}: {
  observedJourneys: any[];
  observedBadges: any[];
  observedCertificates: any[];
}) {
  const router = useRouter();
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const booksCompleted = usePassportStore((state) => state.books_completed);
  const loadPassport = usePassportStore((state) => state.loadPassport);

  const [queryLocation, setQueryLocation] = useState('');
  const [queryDate, setQueryDate] = useState('');

  useEffect(() => {
    loadPassport();
  }, []);

  const filteredJourneys = useMemo(() => {
    return observedJourneys.filter((journey) => {
      const locationMatch = queryLocation ? journey.location.toLowerCase().includes(queryLocation.toLowerCase()) : true;
      const dateMatch = queryDate ? new Date(journey.date).toDateString().toLowerCase().includes(queryDate.toLowerCase()) : true;
      return locationMatch && dateMatch;
    });
  }, [observedJourneys, queryLocation, queryDate]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/inner' as any);
    }
  };

  const renderJourneyCard = (journey: PassportJourney) => {
    const preview = journey.generated_story.split('\n').slice(0, 2).join(' ');
    return (
      <TouchableOpacity 
        key={journey.id} 
        style={styles.journeyCard} 
        activeOpacity={0.9}
        onPress={() => router.push(`/passport/journey/${journey.id}` as any)}
      >
        <Text style={styles.journeyTitle}>{journey.title}</Text>
        <Text style={styles.journeyMeta}>{journey.location} · {new Date(journey.date).toLocaleDateString()}</Text>
        <Text style={styles.journeyPreview} numberOfLines={2}>{preview}</Text>
      </TouchableOpacity>
    );
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Title & Subtitle */}
        <Text style={styles.pageTitle}>Passport Timeline</Text>
        <Text style={styles.pageSubtitle}>
          Your Yatra memories, jaap milestones and reading badges
        </Text>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Journeys</Text>
              <Text style={styles.statValue}>{observedJourneys.length}</Text>
            </View>
            
            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Jaap</Text>
              <Text style={styles.statValue}>{totalJaap}</Text>
            </View>
            
            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Books</Text>
              <Text style={styles.statValue}>{booksCompleted}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Search temple or location"
              placeholderTextColor="#999"
              value={queryLocation}
              onChangeText={setQueryLocation}
            />
            <Ionicons name="search" size={20} color="#000" style={styles.inputIcon} />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Select date and time"
              placeholderTextColor="#999"
              value={queryDate}
              onChangeText={setQueryDate}
            />
            <Ionicons name="calendar-outline" size={20} color="#000" style={styles.inputIcon} />
          </View>
        </View>

        {/* Journey Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Cards</Text>
          {filteredJourneys.length === 0 ? (
            <Text style={styles.sectionSubtitle}>
              No journeys match the selected filters. Create a new Yatra memory to begin.
            </Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {filteredJourneys.map(renderJourneyCard)}
            </View>
          )}
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {observedBadges.length === 0 ? (
            <Text style={styles.sectionSubtitle}>
              Earn badges for first journey, first jaap milestone and first book completion.
            </Text>
          ) : (
            <View style={styles.badgeList}>
              {observedBadges.map((badge) => (
                <TouchableOpacity 
                  key={badge.id} 
                  style={[styles.badgeItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/passport/badge',
                    params: { badgeTitle: badge.title }
                  } as any)}
                >
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <View style={styles.badgeHeader}>
                      <Text style={styles.badgeName}>{badge.title}</Text>
                      {badge.count && badge.count > 1 && (
                        <View style={styles.badgeCountBadge}>
                          <Text style={styles.badgeCountText}>x{badge.count}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                  </View>
                  <Image 
                    source={require('../../assets/images/gita_badge.png')}
                    style={{ width: 64, height: 64 }}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Certificates Section */}
        <View style={[styles.section, styles.certificatesRow]}>
          <View style={styles.certificatesTextContainer}>
            <Text style={styles.sectionTitle}>Certificates</Text>
            {observedCertificates.length === 0 ? (
              <Text style={styles.sectionSubtitle}>
                Complete a book to generate your first certificate.
              </Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                {observedCertificates.map((cert) => (
                  <TouchableOpacity 
                    key={cert.id} 
                    style={styles.certItem}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/passport/certificate/${cert.id}` as any)}
                  >
                    <Text style={styles.certName}>{cert.bookName || cert.book_name}</Text>
                    <Text style={styles.certMeta}>
                      Completed in {cert.completionDays || cert.completion_days} days • {new Date(cert.date).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Certificate Illustration */}
          <View style={styles.illustrationWrapper}>
            <Image 
              source={require('../../assets/images/certificate.png')}
              style={{ width: 120, height: 120 }}
              contentFit="contain"
            />
          </View>
        </View>

      </ScrollView>
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
    paddingHorizontal: 16,
    height: 48,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#4f4f4f',
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#FAF5EC',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8DCB9',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 0.8,
    height: 35,
    backgroundColor: '#C5BA9D',
  },
  statLabel: {
    fontSize: 12,
    color: '#4f4f4f',
    fontWeight: '800',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  filterContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCB9',
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#000',
    fontWeight: '700',
    paddingRight: 10,
  },
  inputIcon: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13.5,
    color: '#4f4f4f',
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  journeyCard: {
    backgroundColor: '#FAF5EC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DCB9',
    marginBottom: 12,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  journeyMeta: {
    fontSize: 12,
    color: '#6e6e6e',
    fontWeight: '700',
    marginBottom: 8,
  },
  journeyPreview: {
    fontSize: 13,
    color: '#4f4f4f',
    lineHeight: 18,
    fontWeight: '600',
  },
  badgeList: {
    marginTop: 8,
  },
  badgeItem: {
    backgroundColor: '#FAF5EC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DCB9',
    marginBottom: 12,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  badgeCountBadge: {
    backgroundColor: '#FF6F00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  badgeDesc: {
    fontSize: 13,
    color: '#4f4f4f',
    lineHeight: 18,
    fontWeight: '600',
  },
  certificatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  certificatesTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  certItem: {
    backgroundColor: '#FAF5EC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DCB9',
    marginBottom: 12,
  },
  certName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  certMeta: {
    fontSize: 12,
    color: '#6e6e6e',
    fontWeight: '700',
  },
  illustrationWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  illustrationRosette: {
    width: 80,
    height: 80,
    backgroundColor: '#FAF5EC',
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  miniDoc: {
    width: 32,
    height: 42,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    borderRadius: 3,
    padding: 4,
    justifyContent: 'center',
    position: 'relative',
  },
  miniDocLine: {
    height: 2,
    backgroundColor: '#FF6F00',
    marginBottom: 3,
    width: '85%',
  },
  miniDocBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FF6F00',
  },
  laurelLeft: {
    position: 'absolute',
    left: -12,
    top: 20,
    height: 40,
    justifyContent: 'space-between',
  },
  laurelRight: {
    position: 'absolute',
    right: -12,
    top: 20,
    height: 40,
    justifyContent: 'space-between',
  },
});

const enhance = withObservables([], () => ({
  observedJourneys: database.get('passport_journeys').query().observe(),
  observedBadges: database.get('passport_badges').query().observe(),
  observedCertificates: database.get('passport_certificates').query().observe(),
}));

export default enhance(PassportTimelineScreen);
