// accessibility: placeholder
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { syncFestivalReminders, toggleAllFestivals, getAllFestivalReminders } from '../src/utils/festivalReminders';
import { useNotificationStore } from '../src/store/notificationStore';

const CARD_COLORS = [
  '#FFE082', // Yellow
  '#B2EBF2', // Light Blue
  '#F48FB1', // Pink
  '#A7F3D0', // Sage/Mint Green
  '#A5D6A7', // Green
  '#FFCC80', // Orange
  '#CFD8DC', // Blue Grey
];

import { FESTIVAL_IMAGE_MAP } from '../src/constants/festivalImages';

const getFestivalImage = (name: string) => {
  const fallback = require('../assets/images/traditional_diya_footer.png');
  if (!name) return fallback;
  // Try exact match
  if (FESTIVAL_IMAGE_MAP[name]) return FESTIVAL_IMAGE_MAP[name];
  
  // Try partial case-insensitive match
  const searchName = name.toLowerCase();
  const key = Object.keys(FESTIVAL_IMAGE_MAP).find(k => searchName.includes(k.toLowerCase()) || k.toLowerCase().includes(searchName));
  return key ? FESTIVAL_IMAGE_MAP[key] : fallback;
};

const formatFestivalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr;
};

const FestivalPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRemindersEnabled, setAllRemindersEnabled] = useState(false);
  const [isTogglingAll, setIsTogglingAll] = useState(false);

  const checkGlobalReminderState = async () => {
    try {
      const allReminders = await getAllFestivalReminders();
      const hasActive = Object.keys(allReminders).length > 0;
      setAllRemindersEnabled(hasActive);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    const loadFestivals = async () => {
      try {
        const response = await getFestivalList();
        const items = response.data || [];
        setFestivals(items);
        await syncFestivalReminders(items);
        await checkGlobalReminderState();
      } catch (err) {
        console.warn('Failed to load festivals', err);
        setError('Could not load festivals.');
      } finally {
        setLoading(false);
      }
    };

    loadFestivals();
  }, []);

  const handleToggleAll = async () => {
    if (isTogglingAll) return;
    setIsTogglingAll(true);
    try {
      const newValue = !allRemindersEnabled;
      await toggleAllFestivals(festivals, newValue);
      setAllRemindersEnabled(newValue);
      
      if (newValue) {
        Alert.alert(
          'All Reminders Set',
          'You will be notified 1 day before every upcoming festival at 9:00 AM and 9:00 PM.'
        );
      } else {
        Alert.alert(
          'Reminders Cancelled',
          'All scheduled festival notifications have been successfully removed.'
        );
      }
    } catch (err: any) {
      console.warn('Failed to toggle all reminders', err);
      if (err.message === 'Permission not granted') {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      } else {
        Alert.alert('Error', 'Could not schedule festival notifications.');
      }
    } finally {
      setIsTogglingAll(false);
    }
  };

  const userName = user?.name?.split(' ')[0] || 'Daniel';
  const nextFestivalName = festivals[0]?.name || festivals[0]?.festival_name || 'Upcoming';

  if (loading) {
    return (
      <BrandedLoading />
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.page} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }} 
            style={styles.headerIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleToggleAll} 
            style={styles.headerIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isTogglingAll}
          >
            {isTogglingAll ? (
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            ) : (
              <Ionicons 
                name={allRemindersEnabled ? "notifications" : "notifications-outline"} 
                size={24} 
                color="#FFFFFF" 
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* White Hero Card */}
          <View style={styles.heroCard}>
            <Text style={styles.statisticsLabel}>Discover</Text>
            <Text style={styles.heroTitle}>
              Hello {userName} 👋{'\n'}upcoming{'\n'}
              <Text style={styles.heroTitleBold}>festivals</Text>
            </Text>

            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Ionicons name="calendar-outline" size={14} color="#D32F2F" />
                <Text style={styles.pillText} numberOfLines={1}>{nextFestivalName}</Text>
              </View>
              <View style={styles.arrowIconContainer}>
                <Ionicons name="arrow-up-outline" size={18} color="#000000" style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
            </View>
          </View>

          {/* Festival Cards with Background Images and Glass Design */}
          {festivals.map((festival, index) => {
            const color = CARD_COLORS[index % CARD_COLORS.length];
            const festivalName = festival.name || festival.festival_name || '';
            const festivalImg = getFestivalImage(festivalName);
            
            return (
              <TouchableOpacity 
                key={festivalName || index}
                activeOpacity={0.9}
                style={{ marginBottom: 12 }}
                onPress={() => router.push(`/festival-detail?index=${index}`)}
              >
                {/* Inner View needed so overflow:hidden clips absolute Image on iOS */}
                <View style={[styles.festivalCardContainer, { backgroundColor: color }]}>
                  <Image
                    source={festivalImg}
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.85 }]}
                    resizeMode="cover"
                  />
                  <View style={styles.glassOverlay}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardLabel}>Festival</Text>
                        <Text style={styles.cardName}>{festivalName}</Text>
                        <Text style={styles.cardDate}>{formatFestivalDate(festival.date)}</Text>
                      </View>
                      <View style={styles.cardRight}>
                        <View style={styles.festivalIconWrapper}>
                          <Image
                            source={festivalImg}
                            style={styles.festivalIconImage}
                            resizeMode="cover"
                          />
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#000000" style={styles.chevronIcon} />
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 36,
    padding: 28,
    marginBottom: 16,
  },
  statisticsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: -1,
  },
  heroTitleBold: {
    fontWeight: '800',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '70%',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    color: '#000000',
  },
  arrowIconContainer: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  festivalCardContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: 120,
  },
  festivalCard: {
    borderRadius: 32,
    minHeight: 120,
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 24,
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    opacity: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  cardDate: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    marginTop: 4,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  festivalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  festivalIconImage: {
    width: 48,
    height: 48,
  },
  chevronIcon: {
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FestivalPage;
