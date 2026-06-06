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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { BrandedLoading } from '../src/components/BrandedLoading';

const CARD_COLORS = [
  '#FFE082', // Yellow
  '#B2EBF2', // Light Blue
  '#F48FB1', // Pink
  '#A7F3D0', // Sage/Mint Green
  '#A5D6A7', // Green
  '#FFCC80', // Orange
  '#CFD8DC', // Blue Grey
];

// Mapping for festival images in assets/images/festival_image/
const festivalImageMap: Record<string, any> = {
  'Akshaya Tritiya': require('../assets/images/festival_image/Akshaya Tritiya.jpg.webp'),
  'Anant Chaturdashi': require('../assets/images/festival_image/Anant Chaturdashi.jpg.webp'),
  'Ashadhi Ekadashi': require('../assets/images/festival_image/Ashadhi Ekadashi_.jpg'),
  'Bhai Dooj': require('../assets/images/festival_image/Bhai Dooj.jpg'),
  'Bohag Bihu': require('../assets/images/festival_image/Bohag Bihu .jpg.webp'),
  'Chaitra Sukhladi': require('../assets/images/festival_image/Chaitra Sukhladi .jpg'),
  'Chhath Puja': require('../assets/images/festival_image/Chhath Puja.jpg'),
  'Dhanteras': require('../assets/images/festival_image/Dhanteras.jpg.avif'),
  'Dhanu Sankranti': require('../assets/images/festival_image/Dhanu Sankranti.jpeg'),
  'Diwali': require('../assets/images/festival_image/Diwali .jpeg'),
  'Durga Ashtami': require('../assets/images/festival_image/Durga Ashtami.jpeg'),
  'Dussehra': require('../assets/images/festival_image/Dussehra.jpg'),
  'Ganesh Chaturthi': require('../assets/images/festival_image/Ganesh Chaturthi.jpeg'),
  'Geeta Jayanti': require('../assets/images/festival_image/Geeta Jayanti.jpg.avif'),
  'Govardhan Puja': require('../assets/images/festival_image/Govardhan Puja.jpg'),
  'Guru Purnima': require('../assets/images/festival_image/Guru Purnima.png.avif'),
  'Hanuman janmotsav': require('../assets/images/festival_image/Hanuman janmotsav.jpg'),
  'Holi': require('../assets/images/festival_image/Happy Holi.jpg.webp'),
  'Hariyali Teej': require('../assets/images/festival_image/Hariyali Teej.jpeg'),
  'Hindi New Year': require('../assets/images/festival_image/Hindi New Year.jpg.webp'),
  'Holika Dahan': require('../assets/images/festival_image/Holika Dahan.png.avif'),
  'Jagannath Rath Yatra': require('../assets/images/festival_image/Jagannath Rath Yatra.webp'),
  'Janmashtami': require('../assets/images/festival_image/Janmashtami.jpg'),
  'Kajari Teej': require('../assets/images/festival_image/Kajari Teej.jpeg'),
  'Kartik Purnima': require('../assets/images/festival_image/Kartik Purnima.jpeg'),
  'Karva Chauth': require('../assets/images/festival_image/Karva Chauth.jpg.webp'),
  'Magh Bihu': require('../assets/images/festival_image/Magh Bihu.jpg'),
  'Maha Navami': require('../assets/images/festival_image/Maha Navami.jpeg'),
  'Maha Saptami': require('../assets/images/festival_image/Maha Saptami.jpg.webp'),
  'Maha Shivaratri': require('../assets/images/festival_image/Maha Shivaratri.jpeg'),
  'Mahalaya Amavasya': require('../assets/images/festival_image/Mahalaya Amavasya.jpg'),
  'Maharishi Valmiki Jayanti': require('../assets/images/festival_image/Maharishi Valmiki Jayanti.jpg'),
  'Makar Sankranti': require('../assets/images/festival_image/Makar Sankranti .jpg.webp.jpeg'),
  'Nag Panchami': require('../assets/images/festival_image/Nag Panchami.jpg'),
  'Onam': require('../assets/images/festival_image/Onam.jpg'),
  'Raksha Bandhan': require('../assets/images/festival_image/Raksha Bandhan.jpg'),
  'Ram Navami': require('../assets/images/festival_image/Ram Navami.jpg'),
  'Savitri Pooja': require('../assets/images/festival_image/Savitri Pooja_.jpg'),
  'Sharad Navratri': require('../assets/images/festival_image/Sharad Navratri.jpg'),
  'Sharad Purnima': require('../assets/images/festival_image/Sharad Purnima.jpg.webp'),
  'Thaipusam': require('../assets/images/festival_image/Thaipusam.jpg'),
  'Vaisakhi': require('../assets/images/festival_image/Vaisakhi.jpg'),
  'Vasant Panchami': require('../assets/images/festival_image/Vasant Panchami.jpg'),
  'Vishwakarma Puja': require('../assets/images/festival_image/Vishwakarma Puja.jpeg'),
};

const getFestivalImage = (name: string) => {
  const fallback = require('../assets/images/traditional_diya_footer.png');
  if (!name) return fallback;
  // Try exact match
  if (festivalImageMap[name]) return festivalImageMap[name];
  
  // Try partial case-insensitive match
  const searchName = name.toLowerCase();
  const key = Object.keys(festivalImageMap).find(k => searchName.includes(k.toLowerCase()) || k.toLowerCase().includes(searchName));
  return key ? festivalImageMap[key] : fallback;
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
            const festivalName = festival.name || festival.festival_name || '';
            const festivalImg = getFestivalImage(festivalName);
            
            return (
              <TouchableOpacity 
                key={festivalName || index}
                style={[styles.festivalCardContainer, { marginBottom: 12 }]}
                activeOpacity={0.9}
                onPress={() => router.push(`/festival-detail?index=${index}`)}
              >
                <ImageBackground
                  source={festivalImg}
                  style={[styles.festivalCard, { backgroundColor: color }]}
                  imageStyle={{ borderRadius: 32, opacity: 0.8 }}
                  resizeMode="stretch"
                >
                  {/* White Glass Overlay */}
                  <View style={styles.glassOverlay}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardLabel}>Festival</Text>
                        <Text style={styles.cardName}>{festivalName}</Text>
                        <Text style={styles.cardDate}>{formatFestivalDate(festival.date)}</Text>
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
    resizeMode: 'stretch',
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
