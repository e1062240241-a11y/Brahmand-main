import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
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
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{
    type: 'all' | 'week' | 'month' | 'year' | 'specific-month';
    value: string;
    monthIndex?: number;
    yearValue?: number;
  }>({ type: 'all', value: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!queryLocation.trim()) return [];
    const allLocations = new Set<string>();
    
    observedJourneys.forEach(j => {
      if (j.title && j.location) {
        allLocations.add(`${j.title}, ${j.location}`);
      } else if (j.location) {
        allLocations.add(j.location.trim());
      }
    });
    
    const popularTemples = [
      'Akshardham Temple, Delhi',
      'Amarnath Temple, Anantnag, Jammu & Kashmir',
      'Ayodhya Ram Mandir, Ayodhya, Uttar Pradesh',
      'Badrinath Temple, Uttarakhand',
      'Bhimashankar Temple, Pune, Maharashtra',
      'Brihadisvara Temple, Thanjavur, Tamil Nadu',
      'Chamundeshwari Temple, Mysore, Karnataka',
      'Chidambaram Temple, Tamil Nadu',
      'Dakshineswar Kali Temple, Kolkata, West Bengal',
      'Dwarkadhish Temple, Dwarka, Gujarat',
      'Ekambareswarar Temple, Kanchipuram, Tamil Nadu',
      'Ettumanoor Mahadeva Temple, Kottayam, Kerala',
      'Gangotri Temple, Gangotri, Uttarakhand',
      'Golden Temple, Amritsar, Punjab',
      'Grishneshwar Temple, Aurangabad, Maharashtra',
      'Halebidu Hoysaleswara Temple, Hassan, Karnataka',
      'Har Ki Pauri Temple, Haridwar, Uttarakhand',
      'Iskcon Temple, Bangalore, Karnataka',
      'Jagannath Temple, Puri, Odisha',
      'Jwalamukhi Temple, Kangra, Himachal Pradesh',
      'Kamakhya Temple, Guwahati, Assam',
      'Kashi Vishwanath Temple, Varanasi, Uttar Pradesh',
      'Kedarnath Temple, Uttarakhand',
      'Lingaraj Temple, Bhubaneswar, Odisha',
      'Lotus Temple, New Delhi',
      'Mahakaleshwar Jyotirlinga, Ujjain, Madhya Pradesh',
      'Mallikarjuna Temple, Srisailam, Andhra Pradesh',
      'Meenakshi Temple, Madurai, Tamil Nadu',
      'Nageshwar Jyotirlinga, Dwarka, Gujarat',
      'Neelkanth Mahadev Temple, Rishikesh, Uttarakhand',
      'Omkareshwar Temple, Mandhata, Madhya Pradesh',
      'Padmanabhaswamy Temple, Thiruvananthapuram, Kerala',
      'Pashupatinath Temple, Kathmandu, Nepal',
      'Ramanathaswamy Temple, Rameswaram, Tamil Nadu',
      'Ranakpur Jain Temple, Pali, Rajasthan',
      'Sabarimala Temple, Pathanamthitta, Kerala',
      'Siddhivinayak Temple, Mumbai, Maharashtra',
      'Somnath Temple, Prabhas Patan, Gujarat',
      'Tirupati Balaji Temple, Tirumala, Andhra Pradesh',
      'Trimbakeshwar Shiva Temple, Nashik, Maharashtra',
      'Udupi Sri Krishna Matha, Udupi, Karnataka',
      'Vaishno Devi Temple, Katra, Jammu & Kashmir',
      'Varadaraja Perumal Temple, Kanchipuram, Tamil Nadu',
      'Wanakbori Shiva Temple, Balasinor, Gujarat',
      'Xuanzang Temple, Nalanda, Bihar',
      'Yadadri Temple, Yadagirigutta, Telangana',
      'Yamunotri Temple, Yamunotri, Uttarakhand',
      'Zaskar Monastery, Zanskar, Ladakh'
    ];
    popularTemples.forEach(t => allLocations.add(t));

    const lowercaseQuery = queryLocation.toLowerCase();
    const matches = Array.from(allLocations).filter(loc => 
      loc.toLowerCase().includes(lowercaseQuery)
    );

    // Sort matching suggestions:
    // 1. Starts with query prefix
    // 2. Contains word starting with query prefix
    // 3. Contains query anywhere
    return matches.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStartsWith = aLower.startsWith(lowercaseQuery);
      const bStartsWith = bLower.startsWith(lowercaseQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      const aWordStart = aLower.includes(' ' + lowercaseQuery);
      const bWordStart = bLower.includes(' ' + lowercaseQuery);
      
      if (aWordStart && !bWordStart) return -1;
      if (!aWordStart && bWordStart) return 1;
      
      return aLower.localeCompare(bLower);
    }).slice(0, 5);
  }, [observedJourneys, queryLocation]);

  useEffect(() => {
    loadPassport();
  }, []);

  const recentMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    // 2 down to 0 gives last 3 months in ascending order
    for (let i = 2; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: d.toLocaleDateString('en-US', { month: 'long' }),
        monthIndex: d.getMonth(),
        year: d.getFullYear()
      });
    }
    return months;
  }, []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const filteredJourneys = useMemo(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return observedJourneys.filter((journey) => {
      const locationMatch = queryLocation 
        ? journey.location.toLowerCase().includes(queryLocation.toLowerCase()) ||
          journey.title.toLowerCase().includes(queryLocation.toLowerCase())
        : true;
      
      let dateMatch = true;
      const journeyDateObj = new Date(journey.date);
      const journeyTime = journeyDateObj.getTime();

      if (activeFilter.type === 'week') {
        dateMatch = journeyTime >= oneWeekAgo;
      } else if (activeFilter.type === 'month') {
        dateMatch = journeyTime >= thirtyDaysAgo;
      } else if (activeFilter.type === 'specific-month') {
        dateMatch = journeyDateObj.getMonth() === activeFilter.monthIndex && 
                    journeyDateObj.getFullYear() === activeFilter.yearValue;
      } else if (activeFilter.type === 'year') {
        dateMatch = journeyDateObj.getFullYear() === activeFilter.yearValue;
      }

      return locationMatch && dateMatch;
    });
  }, [observedJourneys, queryLocation, activeFilter]);

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
          <View style={{ zIndex: 10 }}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Search temple or location"
                placeholderTextColor="#999"
                value={queryLocation}
                onChangeText={(text) => {
                  setQueryLocation(text);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <Ionicons name="search" size={20} color="#000" style={styles.inputIcon} />
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setQueryLocation(item);
                      setShowSuggestions(false);
                    }}
                  >
                    <Ionicons name="pin-outline" size={16} color="#A9968F" style={{ marginRight: 8 }} />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.inputWrapper, { marginTop: 12 }]}
            activeOpacity={0.8}
            onPress={() => {
              setShowFilterOptions(true);
              setShowSuggestions(false);
            }}
          >
            <TextInput
              style={styles.textInput}
              placeholder="Select date & filter"
              placeholderTextColor="#999"
              value={activeFilter.value}
              editable={false}
              pointerEvents="none"
            />
            <Ionicons name="filter" size={20} color="#000" style={styles.inputIcon} />
          </TouchableOpacity>
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

      {/* Options Modal */}
      <Modal
        visible={showFilterOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilterOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.optionsContainer}>
              <Text style={styles.modalTitle}>Filter by Date</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
                {/* Standard Options */}


                <TouchableOpacity 
                  style={styles.optionBtn} 
                  onPress={() => {
                    setActiveFilter({ type: 'week', value: 'Past 1 Week' });
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>Past 1 Week</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.optionBtn} 
                  onPress={() => {
                    setActiveFilter({ type: 'month', value: 'Last 30 Days' });
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>Last 30 Days</Text>
                </TouchableOpacity>

                {/* Recent Months Header */}
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>RECENT MONTHS</Text>
                </View>

                {recentMonths.map((m) => (
                  <TouchableOpacity 
                    key={`${m.name}-${m.year}`}
                    style={styles.optionBtn} 
                    onPress={() => {
                      setActiveFilter({ 
                        type: 'specific-month', 
                        value: `${m.name} ${m.year}`,
                        monthIndex: m.monthIndex,
                        yearValue: m.year
                      });
                      setShowFilterOptions(false);
                    }}
                  >
                    <Text style={styles.optionText}>{m.name} {m.year}</Text>
                  </TouchableOpacity>
                ))}

                {/* Years Header */}
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>YEARS</Text>
                </View>

                {years.map((y, index) => (
                  <TouchableOpacity 
                    key={y}
                    style={[styles.optionBtn, index === years.length - 1 && { borderBottomWidth: 0 }]} 
                    onPress={() => {
                      setActiveFilter({ 
                        type: 'year', 
                        value: `${y}`,
                        yearValue: y
                      });
                      setShowFilterOptions(false);
                    }}
                  >
                    <Text style={styles.optionText}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    width: 280,
    backgroundColor: '#FAF5EC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8DCB9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5A4136',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionBtn: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: '#E8DCB9',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
  },
  groupHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: '#E8DCB9',
    alignItems: 'center',
  },
  groupHeaderText: {
    fontSize: 11,
    color: '#8A7060',
    fontWeight: '800',
    letterSpacing: 1,
  },
  laurelRight: {
    position: 'absolute',
    right: -12,
    top: 20,
    height: 40,
    justifyContent: 'space-between',
  },
  suggestionsContainer: {
    backgroundColor: '#FAF5EC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCB9',
    marginTop: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(232, 220, 185, 0.5)',
  },
  suggestionText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
});

const enhance = withObservables([], () => ({
  observedJourneys: database.get('passport_journeys').query().observe(),
  observedBadges: database.get('passport_badges').query().observe(),
  observedCertificates: database.get('passport_certificates').query().observe(),
}));

export default enhance(PassportTimelineScreen);
