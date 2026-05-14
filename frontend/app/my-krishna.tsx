import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';

const CARD_COLORS = [
  '#FFE082', // Yellow
  '#B2EBF2', // Light Blue
  '#F48FB1', // Pink
  '#CE93D8', // Purple
  '#A5D6A7', // Green
  '#FFCC80', // Orange
  '#CFD8DC', // Blue Grey
];

// Mapping for festival images in assets/images/festival image/
const festivalImageMap: Record<string, any> = {
  'Diwali': require('../assets/images/icon.png'),
  'Holi': require('../assets/images/icon.png'),
  'Janmashtami': require('../assets/images/icon.png'),
  'Ganesh Chaturthi': require('../assets/images/icon.png'),
  'Maha Shivaratri': require('../assets/images/icon.png'),
  'Dussehra': require('../assets/images/icon.png'),
  'Raksha Bandhan': require('../assets/images/icon.png'),
  'Ram Navami': require('../assets/images/icon.png'),
  'Karva Chauth': require('../assets/images/icon.png'),
  'Dhanteras': require('../assets/images/icon.png'),
  'Bhai Dooj': require('../assets/images/icon.png'),
  'Chhath Puja': require('../assets/images/icon.png'),
  'Guru Purnima': require('../assets/images/icon.png'),
  'Onam': require('../assets/images/icon.png'),
  'Makar Sankranti': require('../assets/images/icon.png'),
  'Akshaya Tritiya': require('../assets/images/icon.png'),
};

const getFestivalImage = (name: string) => {
  if (!name) return null;
  // Try exact match
  if (festivalImageMap[name]) return festivalImageMap[name];
  
  // Try partial match
  const key = Object.keys(festivalImageMap).find(k => name.includes(k) || k.includes(name));
  return key ? festivalImageMap[key] : null;
};

const FestivalPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFestivals = async () => {
      try {
        const response = await getFestivalList();
        const items = response.data || [];
        setFestivals(items);
      } catch (err) {
        console.warn('Failed to load festivals', err);
        setError('Could not load festivals.');
      } finally {
        setLoading(false);
      }
    };

    loadFestivals();
  }, []);

  const userName = user?.name?.split(' ')[0] || 'Daniel';
  const nextFestivalName = festivals[0]?.name || 'Upcoming';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="apps-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ width: 44 }} />
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
          const festivalImg = getFestivalImage(festival.name);
          
          return (
            <TouchableOpacity 
              key={festival.name || index}
              style={[styles.festivalCardContainer, { marginBottom: 12 }]}
              activeOpacity={0.9}
              onPress={() => router.push(`/festival-detail?index=${index}`)}
            >
              <ImageBackground
                source={festivalImg}
                style={[styles.festivalCard, { backgroundColor: color }]}
                imageStyle={{ borderRadius: 32, opacity: 0.8 }}
                resizeMode="cover"
              >
                {/* White Glass Overlay */}
                <View style={styles.glassOverlay}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardLabel}>Festival</Text>
                      <Text style={styles.cardName}>{festival.name}</Text>
                      <Text style={styles.cardDate}>{festival.date}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={styles.festivalIconWrapper}>
                        <Image source={festivalImg} style={styles.festivalIconImage} />
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#000000" style={styles.chevronIcon} />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
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
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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