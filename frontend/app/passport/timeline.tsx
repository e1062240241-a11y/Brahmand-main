import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../../src/utils/dateUtils';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePassportStore } from '../../src/store/passportStore';
import { PassportJourney } from '../../src/types/passport';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';

const POPULAR_TEMPLES = [
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
  'Kalighat Kali Temple, Kolkata, West Bengal',
  'Kamakhya Temple, Guwahati, Assam',
  'Kanchipuram Temples, Kanchipuram, Tamil Nadu',
  'Karni Mata Temple, Deshnoke, Rajasthan',
  'Kedarnath Temple, Uttarakhand',
  'Konark Sun Temple, Odisha',
  'Kukke Subramanya Temple, Dakshina Kannada, Karnataka',
  'Lepakshi Temple, Anantapur, Andhra Pradesh',
  'Lingaraja Temple, Bhubaneswar, Odisha',
  'Lotus Temple, Delhi',
  'Madurai Meenakshi Amman Temple, Tamil Nadu',
  'Mahabaleshwar Temple, Gokarna, Karnataka',
  'Mahakaleshwar Jyotirlinga, Ujjain, Madhya Pradesh',
  'Malliikarjuna Temple, Srisailam, Andhra Pradesh',
  'Mangueshi Temple, Mangeshi, Goa',
  'Mehandipur Balaji Temple, Dausa, Rajasthan',
  'Mumba Devi Temple, Mumbai, Maharashtra',
  'Nageshwar Jyotirlinga, Dwarka, Gujarat',
  'Nainital Naina Devi Temple, Uttarakhand',
  'Omkareshwar Temple, Khandwa, Madhya Pradesh',
  'Padmanabhaswamy Temple, Thiruvananthapuram, Kerala',
  'Pattadakal Temples, Bagalkot, Karnataka',
  'Prem Mandir, Vrindavan, Uttar Pradesh',
  'Ramanathaswamy Temple, Rameswaram, Tamil Nadu',
  'Ranakpur Jain Temple, Pali, Rajasthan',
  'Sabarimala Temple, Pathanamthitta, Kerala',
  'Sanchi Stupa, Sanchi, Madhya Pradesh',
  'Sarangpur Hanuman Temple, Gujarat',
  'Shani Shingnapur, Ahmednagar, Maharashtra',
  'Shirdi Sai Baba Temple, Shirdi, Maharashtra',
  'Shiva Temple, Ambernath, Maharashtra',
  'Siddhivinayak Temple, Mumbai, Maharashtra',
  'Somnath Temple, Gujarat',
  'Sree Krishna Temple, Guruvayur, Kerala',
  'Sri Ranganathaswamy Temple, Srirangam, Tamil Nadu',
  'Swaminarayan Akshardham, Gandhinagar, Gujarat',
  'Tarakeswar Temple, Hooghly, West Bengal',
  'Thousand Pillar Temple, Warangal, Telangana',
  'Tirupati Balaji Temple, Tirumala, Andhra Pradesh',
  'Trimbakeshwar Temple, Nashik, Maharashtra',
  'Udupi Sri Krishna Matha, Udupi, Karnataka',
  'Vaidyanath Jyotirlinga, Deoghar, Jharkhand',
  'Vaishno Devi Temple, Katra, Jammu & Kashmir',
  'Varanasi Kashi Vishwanath Temple, Uttar Pradesh',
  'Venkateswara Temple, Tirupati, Andhra Pradesh',
  'Vindhyachal Temple, Mirzapur, Uttar Pradesh',
  'Vithoba Temple, Pandharpur, Maharashtra',
  'Xuanzang Temple, Nalanda, Bihar',
  'Yadadri Temple, Yadagirigutta, Telangana',
  'Yamunotri Temple, Yamunotri, Uttarakhand',
  'Zaskar Monastery, Zanskar, Ladakh'
];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function PassportTimelineScreen({
  observedJourneys = [],
  observedBadges = [],
  observedCertificates = [],
}: {
  observedJourneys?: any[];
  observedBadges?: any[];
  observedCertificates?: any[];
}) {
  const router = useRouter();
  // Determine if badges are earned
  const hasFirstYatra = observedBadges.some(b => b.title?.toLowerCase().includes('yatra') || b.title?.toLowerCase().includes('first'));
  const hasBookFinisher = observedBadges.some(b => b.title?.toLowerCase().includes('book') || b.title?.toLowerCase().includes('finisher'));
  const has1000Jaaps = observedBadges.some(b => b.title?.toLowerCase().includes('jaap') || b.title?.toLowerCase().includes('1000') || b.title?.toLowerCase().includes('jaaps'));

  const totalJaap = usePassportStore((state) => state.total_jaap);
  const booksCompleted = usePassportStore((state) => state.books_completed);
  const loadPassport = usePassportStore((state) => state.loadPassport);

  const [queryLocation, setQueryLocation] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{
    type: 'all' | 'week' | 'three-weeks' | 'month' | 'two-months' | 'year' | 'specific-month';
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
        allLocations.add(`${String(j.title)}, ${String(j.location)}`);
      } else if (j.location && typeof j.location === 'string') {
        allLocations.add(j.location.trim());
      }
    });
    

    POPULAR_TEMPLES.forEach(t => allLocations.add(t));

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
        name: d.toLocaleString('en-US', { month: 'long' }),
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
    const threeWeeksAgo = now - 21 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const twoMonthsAgo = now - 60 * 24 * 60 * 60 * 1000;

    return observedJourneys.filter((journey) => {
      const locationMatch = queryLocation 
        ? (typeof journey.location === 'string' && journey.location.toLowerCase().includes(queryLocation.toLowerCase())) ||
          (typeof journey.title === 'string' && journey.title.toLowerCase().includes(queryLocation.toLowerCase()))
        : true;
      
      let dateMatch = true;
      const journeyDateObj = journey.date ? new Date(journey.date) : new Date(0);
      const journeyTime = journeyDateObj.getTime();

      if (activeFilter.type === 'week') {
        dateMatch = journeyTime >= oneWeekAgo;
      } else if (activeFilter.type === 'three-weeks') {
        dateMatch = journeyTime >= threeWeeksAgo;
      } else if (activeFilter.type === 'month') {
        dateMatch = journeyTime >= thirtyDaysAgo;
      } else if (activeFilter.type === 'two-months') {
        dateMatch = journeyTime >= twoMonthsAgo;
      } else if (activeFilter.type === 'specific-month') {
        dateMatch = journeyDateObj.getMonth() === activeFilter.monthIndex && 
                    journeyDateObj.getFullYear() === activeFilter.yearValue;
      } else if (activeFilter.type === 'year') {
        dateMatch = journeyDateObj.getFullYear() === activeFilter.yearValue;
      }

      return locationMatch && dateMatch;
    }).sort((a, b) => {
      const tA = a.date ? new Date(a.date).getTime() : 0;
      const tB = b.date ? new Date(b.date).getTime() : 0;
      return tB - tA;
    });
  }, [observedJourneys, queryLocation, activeFilter]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/inner' as any);
    }
  };

  const handleDeleteAllJourneys = () => {
    Alert.alert(
      "Clear All Journeys",
      "Are you sure you want to permanently clear all journeys? This will also remove them from the Home feed.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { database } = require('../../src/database');
              const { useFeedStore } = require('../../src/store/feedStore');
              const { usePassportStore } = require('../../src/store/passportStore');
              const { SyncManager } = require('../../src/database/syncManager');
              
              await database.write(async () => {
                const journeysCollection = database.get('passport_journeys');
                const feedsCollection = database.get('feeds');
                
                const journeys = await journeysCollection.query().fetch();
                const feeds = await feedsCollection.query().fetch();
                
                const ops = [];
                const deletedFeedIds: string[] = [];
                
                for (const journey of journeys) {
                  ops.push(journey.prepareDestroyPermanently());
                }
                
                for (const feed of feeds) {
                  if (feed.id.startsWith('post_journey_')) {
                    ops.push(feed.prepareDestroyPermanently());
                    deletedFeedIds.push(feed.id);
                  }
                }
                
                if (ops.length > 0) {
                  await database.batch(...ops);
                }
                
                // Clear from Zustand stores
                usePassportStore.setState({ journeys: [] });
                
                // Clear from Feed Zustand store
                const currentTabFeed = useFeedStore.getState().tabFeeds['for_you'] || { posts: [] };
                const filteredPosts = currentTabFeed.posts.filter((p: any) => !deletedFeedIds.includes(p.id));
                useFeedStore.getState().setTabFeed('for_you', {
                  posts: filteredPosts,
                  offset: Math.max(0, filteredPosts.length)
                });
                
                // Trigger sync to notify backend of deletion
                SyncManager.requestSync();
              });
              
              Alert.alert("Success", "All journeys have been cleared.");
            } catch (err) {
              console.error("[Timeline] Failed to clear journeys:", err);
              Alert.alert("Error", "Could not clear journeys.");
            }
          }
        }
      ]
    );
  };

  const renderJourneyCard = (journey: PassportJourney) => {
    const firstPhoto = journey.media && journey.media.find((m: any) => m.type === 'photo');

    return (
      <TouchableOpacity 
        key={journey.id} 
        style={styles.journeyCard} 
        activeOpacity={0.9}
        onPress={() => router.push(`/passport/journey/${journey.id}` as any)}
      >
        <View style={styles.journeyCardContent}>
          {firstPhoto ? (
            <Image 
              source={{ uri: firstPhoto.uri }} 
              style={styles.journeyCardImage} 
              contentFit="cover" 
            />
          ) : (
            <View style={[styles.journeyCardImage, { backgroundColor: '#F5ECE3', justifyContent: 'center', alignItems: 'center' }]}>
               <Ionicons name="location-outline" size={28} color="#A9968F" />
            </View>
          )}
          
          <View style={styles.journeyInfo}>
            <View style={styles.journeyTitleRow}>
               <Text style={styles.journeyTitle} numberOfLines={1}>{journey.title}</Text>
               <View style={styles.journeyBadgeIcon}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FF7B00" />
               </View>
            </View>
            <Text style={styles.journeyLocation} numberOfLines={1}>{journey.location}</Text>
            
            <View style={styles.journeyDateRow}>
               <Ionicons name="calendar-outline" size={14} color="#6e6e6e" style={{ marginRight: 4 }} />
               <Text style={styles.journeyDateText}>{formatDateIST(journey.date)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peachish Gradient */}
      <LinearGradient 
        colors={['#FF8D57', '#EA9B76', '#FFEEE5', '#FFEEE5']}
        locations={[0, 0.0913, 0.25, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Passport Timeline</Text>
        {observedJourneys.length > 0 ? (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAllJourneys} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={22} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subtitle */}
        <Text style={styles.pageSubtitle}>
          Your Yatra memories, jaap milestones and reading badges
        </Text>

        {/* Stats Card */}
        <View style={styles.statsGrid}>
          <View style={styles.statBoxJourneys}>
            <Text style={styles.statLabel}>Journeys</Text>
            <Text style={styles.statValue}>{observedJourneys.length}</Text>
          </View>
          
          <View style={styles.statDividerContainer}>
            <View style={styles.statDivider} />
          </View>

          <View style={styles.statBoxJaap}>
            <Text style={styles.statLabel}>Total Jaap</Text>
            <Text style={styles.statValue}>{totalJaap}</Text>
          </View>

          <View style={styles.statDividerContainer}>
            <View style={styles.statDivider} />
          </View>

          <View style={styles.statBoxBooks}>
            <Text style={styles.statLabel}>Books</Text>
            <Text style={styles.statValue}>{booksCompleted}</Text>
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Timeline</Text>
            <TouchableOpacity><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
          </View>
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Spiritual Badges</Text>
            <TouchableOpacity onPress={() => router.push('/passport/badge' as any)}>
              <Text style={styles.viewAllText}>Details</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Earn badges for first journey, first jaap milestone and first book completion.
          </Text>

          <View style={styles.badgesRow}>
            {/* First Yatra Badge */}
            <TouchableOpacity 
              style={styles.badgeColumn} 
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/passport/badge', params: { badgeTitle: 'First Yatra' } } as any)}
            >
              <View style={[styles.badgeCircle, { backgroundColor: hasFirstYatra ? '#FFE088' : '#E8E1DA' }]}>
                <FontAwesome5 name="hiking" size={26} color={hasFirstYatra ? '#2D201A' : '#8A8074'} />
              </View>
              <Text style={[styles.badgeLabelText, { color: hasFirstYatra ? '#000000' : '#8A8074' }]}>First Yatra</Text>
            </TouchableOpacity>

            {/* Book Finisher Badge */}
            <TouchableOpacity 
              style={styles.badgeColumn} 
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/passport/badge', params: { badgeTitle: 'Book Finisher' } } as any)}
            >
              <View style={[styles.badgeCircle, { backgroundColor: hasBookFinisher ? '#FCE2D6' : '#E8E1DA' }]}>
                <FontAwesome5 name="book-open" size={24} color={hasBookFinisher ? '#5A2A1A' : '#8A8074'} />
              </View>
              <Text style={[styles.badgeLabelText, { color: hasBookFinisher ? '#000000' : '#8A8074' }]}>Book Finisher</Text>
            </TouchableOpacity>

            {/* 1000 Jaaps Badge */}
            <TouchableOpacity 
              style={styles.badgeColumn} 
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/passport/badge', params: { badgeTitle: '1000 Jaaps' } } as any)}
            >
              <View style={[styles.badgeCircle, { backgroundColor: has1000Jaaps ? '#FFE088' : '#E8E1DA' }]}>
                <FontAwesome5 name="award" size={26} color={has1000Jaaps ? '#2D201A' : '#8A8074'} />
              </View>
              <Text style={[styles.badgeLabelText, { color: has1000Jaaps ? '#000000' : '#8A8074' }]}>1000 Jaaps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Certificates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Certificates</Text>
          </View>

          <View style={styles.certificatesCard}>
            <View style={styles.certificatesTextContainer}>
              <Text style={styles.certificatesCardTitle}>Certificates</Text>
              <Text style={styles.certificatesCardDesc}>
                Complete a holy book to earn your official certificate of completion.
              </Text>
              <TouchableOpacity 
                style={styles.viewGalleryButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (observedCertificates.length > 0) {
                    router.push(`/passport/certificate/${observedCertificates[0].id}` as any);
                  }
                }}
              >
                <Text style={styles.viewGalleryButtonText}>View Gallery</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.illustrationWrapper}>
              <Image 
                source={require('../../assets/images/certificate_fixed.webp')}
                style={{ width: 120, height: 120 }}
                contentFit="contain"
              />
              <View style={styles.imageOverlay} />
            </View>
          </View>


        </View>

      </KeyboardAwareScrollView>

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
                    setActiveFilter({ type: 'three-weeks', value: 'Past 3 Weeks' });
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>Past 3 Weeks</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.optionBtn} 
                  onPress={() => {
                    setActiveFilter({ type: 'month', value: 'Past 30 Days' });
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>Past 30 Days</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.optionBtn} 
                  onPress={() => {
                    setActiveFilter({ type: 'two-months', value: 'Past 2 Months' });
                    setShowFilterOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>Past 2 Months</Text>
                </TouchableOpacity>

                {/* Recent Months Header */}
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>RECENT MONTHS</Text>
                </View>

                {recentMonths.map((m, index) => (
                  <TouchableOpacity 
                    key={`${m.name}-${m.year}`}
                    style={[styles.optionBtn, index === recentMonths.length - 1 && { borderBottomWidth: 0 }]} 
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
  
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  badgeColumn: {
    alignItems: 'center',
    flex: 1,
  },
  badgeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  certificatesCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DDC1B1',
    shadowColor: 'rgba(150, 73, 0, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  certificatesCardTitle: {
    color: '#410000',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 28,
    flexShrink: 1,
  },
  certificatesCardDesc: {
    color: '#564337',
    fontSize: Platform.OS === 'android' ? 13 : 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
    width: Platform.OS === 'android' ? undefined : 188,
  },
  viewGalleryButton: {
    width: 105.05,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF7B00',
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  viewGalleryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    color: '#000',
    textAlign: 'center',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    flex: 1,
  },
  pageSubtitle: {
    width: 346,
    alignSelf: 'center',
    textAlign: 'center',
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 20,
  },

  
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF7B00',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statBoxJourneys: {
    width: 118,
    height: 54,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxJaap: {
    width: 126,
    height: 54,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxBooks: {
    width: 117,
    height: 54,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDividerContainer: {
    width: 1,
    height: 54,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#C5BA9D',
  },
  statLabel: {
    color: '#000000',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    marginBottom: 4,
  },
  statValue: {
    color: '#000000',
    fontSize: 21,
    fontStyle: 'normal',
    fontWeight: '700',
  },
  filterContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D8C2BC',
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
    color: '#1E1B17',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    marginTop: 2,
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDC1B1',
    marginBottom: 12,
    shadowColor: 'rgba(150, 73, 0, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  journeyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyCardImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },
  journeyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  journeyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B17',
    flex: 1,
  },
  journeyBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#E8D2C5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  journeyLocation: {
    fontSize: 13,
    color: '#564337',
    fontWeight: '500',
    marginBottom: 6,
  },
  journeyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyDateText: {
    fontSize: 12,
    color: '#564337',
    fontWeight: '400',
  },
  badgeList: {
    marginTop: 8,
  },
  badgeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDC1B1',
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
  certItem: {
    backgroundColor: '#FAF5EC',
    borderRadius: 12,
    padding: 12,
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
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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

  certificatesTextContainer: {
    flex: 1,
    flexShrink: 1,
    paddingRight: Platform.OS === 'android' ? 8 : 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Platform.OS === 'android' ? 6 : 8,
    minWidth: 0,
  },
});

const enhance = withObservables([], () => ({
  observedJourneys: database.get('passport_journeys').query().observe(),
  observedBadges: database.get('passport_badges').query().observe(),
  observedCertificates: database.get('passport_certificates').query().observe(),
}));

export default enhance(PassportTimelineScreen);