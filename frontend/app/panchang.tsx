import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getPanchang, askAstrologyAI } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { BrandedLoading } from '../src/components/BrandedLoading';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabType = 'panchang' | 'hora' | 'planets';

export default function PanchangScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const userLocation = (user as any)?.home_location;
  const initialLocationLabel = [
    (user as any)?.location?.area,
    (user as any)?.location?.city,
    (user as any)?.location?.state,
  ].filter(Boolean).join(', ') || 'Current location unavailable';

  const [activeTab, setActiveTab] = useState<TabType>('panchang');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCoords, setActiveCoords] = useState<{ lat?: number; lng?: number }>({
    lat: userLocation?.latitude,
    lng: userLocation?.longitude,
  });
  const [activeLocationLabel, setActiveLocationLabel] = useState(initialLocationLabel);
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // AI Chat States
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ question: string; answer: string }[]>([]);

  // Sub-tabs / Toggles
  const [choghadiyaMode, setChoghadiyaMode] = useState<'day' | 'night'>('day');
  const [activeHoraIdx, setActiveHoraIdx] = useState<number>(1);

  const isMountedRef = useRef(true);

  const fetchPanchang = useCallback(async (lat?: number, lng?: number, forceRefresh = false, targetDate?: Date) => {
    try {
      if (!isMountedRef.current) return;
      setLoading(!forceRefresh);
      setError('');
      
      const dateStr = targetDate 
        ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
        : undefined;

      const response = await getPanchang({ lat, lng, date_str: dateStr, force_refresh: forceRefresh });
      if (isMountedRef.current) {
        setPayload(response.data);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load Panchang');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchPanchang(activeCoords.lat, activeCoords.lng, false, selectedDate);
    return () => { isMountedRef.current = false; };
  }, [fetchPanchang]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPanchang(activeCoords.lat, activeCoords.lng, true, selectedDate);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    fetchPanchang(activeCoords.lat, activeCoords.lng, false, prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    fetchPanchang(activeCoords.lat, activeCoords.lng, false, next);
  };

  const submitQuestion = async () => {
    if (!question.trim() || chatLoading) return;
    const q = question.trim();
    setChatLoading(true);
    try {
      const response = await askAstrologyAI({
        question: q,
        astrology: { kind: 'panchang', payload },
      });
      if (isMountedRef.current) {
        setChatMessages(prev => [{ question: q, answer: response.data?.answer || 'No guidance available.' }, ...prev]);
        setQuestion('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMountedRef.current) setChatLoading(false);
    }
  };

  const getAdvancedPanchang = () => payload?.sources?.advanced_panchang || payload?.sources?.panchang_advanced;
  const getChaughadiyaSource = () => payload?.chaughadiya || payload?.sources?.chaughadiya_muhurta?.chaughadiya;
  const getHoraSource = () => payload?.hora || payload?.sources?.hora_muhurta?.hora;
  const getPlanetsSource = () => payload?.planets || payload?.sources?.planet_panchang;

  const formatDateLabel = (date: Date) => {
    const day = date.getDate();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = weekdays[date.getDay()];
    
    return {
      dateStr: `${day}${suffix} ${monthName}, ${year}`,
      dayStr: dayName
    };
  };

  const formatTimeValue = (value: any) => {
    if (value == null || value === '') return '';
    let hInt = 0;
    let mInt = 0;
    
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (!normalized) return '';
      const match = normalized.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(AM|PM|am|pm)?/i);
      if (match) {
        hInt = parseInt(match[1], 10);
        mInt = parseInt(match[2], 10);
        if (match[3]) {
          const ampm = match[3].toUpperCase();
          const hStr = hInt.toString().padStart(2, '0');
          const mStr = mInt.toString().padStart(2, '0');
          return `${hStr}:${mStr} ${ampm}`;
        }
      } else {
        return normalized;
      }
    } else if (typeof value === 'object') {
      hInt = parseInt(value.hour ?? value.Hours ?? value.h ?? 0, 10);
      mInt = parseInt(value.minute ?? value.Minutes ?? value.m ?? 0, 10);
    } else {
      return String(value);
    }

    const ampm = hInt >= 12 ? 'PM' : 'AM';
    const h12 = hInt % 12 || 12;
    const hStr = h12.toString().padStart(2, '0');
    const mStr = mInt.toString().padStart(2, '0');
    return `${hStr}:${mStr} ${ampm}`;
  };

  const renderPanchangTab = () => {
    const advanced = getAdvancedPanchang();
    const chaughadiyaSource = getChaughadiyaSource();
    
    if (!advanced && !payload?.overview) {
      return <Text style={styles.emptyText}>No data available for this date</Text>;
    }

    let overview = payload?.overview?.length ? payload.overview : [
      { label: 'Tithi', value: advanced?.tithi?.details?.tithi_name, icon: 'moon' },
      { label: 'Nakshatra', value: advanced?.nakshatra?.details?.nak_name, icon: 'star' },
      { label: 'Yoga', value: advanced?.yog?.details?.yog_name, icon: 'planet' },
      { label: 'Karana', value: advanced?.karan?.details?.karan_name, icon: 'planet' },
    ].filter((i: any) => i.value);

    // Remove Paksha / Pakaha from the overview list as requested
    overview = overview.filter((item: any) => !item.label.toLowerCase().includes('paksha') && !item.label.toLowerCase().includes('pakaha'));

    // Choghadiya cards mapping for display (day vs night)
    const choghadiyaList = chaughadiyaSource?.[choghadiyaMode];

    return (
      <View style={styles.tabContent}>
        {/* Panchang Details */}
        <Text style={styles.sectionHeader}>Panchang Details</Text>
        <View style={styles.card}>
          {overview.map((item: any, idx: number) => (
            <View key={idx} style={{ alignSelf: 'stretch' }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
              {idx < overview.length - 1 && <View style={styles.infoDivider} />}
            </View>
          ))}
        </View>

        {/* Sun & Moon Times */}
        <Text style={styles.sectionHeader}>Sun & Moon Times</Text>
        <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
          <View style={styles.sunMoonGrid}>
            <View style={styles.sunMoonItem}>
              <View style={styles.sunMoonIconBox}>
                <Image source={require('../assets/images/zodiac/su/sun.png')} style={{width: 20, height: 20}} resizeMode="contain" />
              </View>
              <View style={styles.sunMoonMeta}>
                <Text style={styles.sunMoonLabel}>SUNRISE</Text>
                <Text style={styles.sunMoonValue}>{formatTimeValue(advanced?.sunrise) || '05:45 AM'}</Text>
              </View>
            </View>

            <View style={styles.sunMoonItem}>
              <View style={styles.sunMoonIconBox}>
                <Image source={require('../assets/images/zodiac/su/sunset.png')} style={{width: 20, height: 20}} resizeMode="contain" />
              </View>
              <View style={styles.sunMoonMeta}>
                <Text style={styles.sunMoonLabel}>SUNSET</Text>
                <Text style={styles.sunMoonValue}>{formatTimeValue(advanced?.sunset) || '06:30 PM'}</Text>
              </View>
            </View>

            <View style={styles.sunMoonItem}>
              <View style={styles.sunMoonIconBox}>
                <Image source={require('../assets/images/zodiac/su/moonrise.png')} style={{width: 20, height: 20}} resizeMode="contain" />
              </View>
              <View style={styles.sunMoonMeta}>
                <Text style={styles.sunMoonLabel}>MOONRISE</Text>
                <Text style={styles.sunMoonValue}>{formatTimeValue(advanced?.moonrise) || '07:15 PM'}</Text>
              </View>
            </View>

            <View style={styles.sunMoonItem}>
              <View style={styles.sunMoonIconBox}>
                <Image source={require('../assets/images/zodiac/su/moonset.png')} style={{width: 20, height: 20}} resizeMode="contain" />
              </View>
              <View style={styles.sunMoonMeta}>
                <Text style={styles.sunMoonLabel}>MOONSET</Text>
                <Text style={styles.sunMoonValue}>{formatTimeValue(advanced?.moonset) || '05:30 AM'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Inauspicious Times */}
        <View style={styles.inauspiciousHeaderBox}>
          <View style={styles.alertIconBox}>
            <Ionicons name="warning" size={14} color="#BA1A1A" />
          </View>
          <Text style={styles.sectionHeaderAlert}>Inauspicious Times</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.inauspiciousRow}>
            <Text style={styles.inauspiciousLabel}>Rahu Kaal</Text>
            <Text style={styles.inauspiciousValue}>{advanced?.rahu_kaal || '09:00 AM - 10:30 AM'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.inauspiciousRow}>
            <Text style={styles.inauspiciousLabel}>Gulika Kaal</Text>
            <Text style={styles.inauspiciousValue}>{advanced?.gulika_kaal || '06:00 AM - 07:30 AM'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.inauspiciousRow}>
            <Text style={styles.inauspiciousLabel}>Yamaganda</Text>
            <Text style={styles.inauspiciousValue}>{advanced?.yamaganda || '01:00 PM - 03:00 PM'}</Text>
          </View>
        </View>

        {/* Day Choghadiya Section */}
        <Text style={[styles.sectionHeader, { marginTop: 0 }]}>Day Choghadiya</Text>
        <View style={styles.choghadiyaGrid}>
          {[
            { muhurta: 'Char', time: '06:00 - 07:30', is_good: true },
            { muhurta: 'Amrit', time: '07:30 - 09:30', is_good: true },
            { muhurta: 'Amrit', time: '09:00 - 10:30', is_good: true },
            { muhurta: 'Kaal', time: '10:30 - 12:00', is_good: false },
            { muhurta: 'Shubh', time: '12:00 - 13:30', is_good: true },
            { muhurta: 'Rog', time: '13:00 - 15:30', is_good: false },
            { muhurta: 'Labh', time: '15:00 - 16:30', is_good: true },
            { muhurta: 'Udveg', time: '16:00 - 18:30', is_good: false },
          ].map((m: any, idx: number) => (
            <View key={`day-${idx}`} style={styles.choghadiyaCard}>
              <Text style={styles.choghadiyaTitle}>{m.muhurta}</Text>
              <Text style={styles.choghadiyaTime} numberOfLines={1}>{m.time}</Text>
              <View style={[styles.choghadiyaBadge, m.is_good ? styles.choghadiyaBadgeGood : styles.choghadiyaBadgeBad]}>
                <Text style={m.is_good ? styles.choghadiyaBadgeTextGood : styles.choghadiyaBadgeTextBad}>
                  {m.is_good ? 'Good' : 'Bad'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHoraTab = () => {
    const planetIcons: any = {
      Sun: require('../assets/images/zodiac/su/sun2.png'),
      Venus: require('../assets/images/zodiac/su/venus.png'),
      Mercury: require('../assets/images/zodiac/su/mercury.png'),
      Moon: require('../assets/images/zodiac/su/mon.png'),
      Saturn: require('../assets/images/zodiac/su/saturn.png'),
      Jupiter: require('../assets/images/zodiac/su/jupiter2.png'),
      Mars: require('../assets/images/zodiac/su/mars.png'),
    };

    const staticHoraList = [
      { time: '05:45 AM - 06:45 AM', hora: 'Sun', nature: { text: 'BENEFIC', type: 'good' } },
      { time: '06:45 AM - 07:45 AM', hora: 'Venus', nature: { text: 'GOOD', type: 'good' } },
      { time: '07:45 AM - 08:45 AM', hora: 'Mercury', nature: { text: 'NEUTRAL', type: 'neutral' } },
      { time: '08:45 AM - 09:45 AM', hora: 'Moon', nature: { text: 'BENEFIC', type: 'good' } },
      { time: '09:45 AM - 10:45 AM', hora: 'Saturn', nature: { text: 'MALEFIC', type: 'bad' } },
      { time: '10:45 AM - 11:45 AM', hora: 'Jupiter', nature: { text: 'BENEFIC', type: 'good' } },
      { time: '11:45 AM - 12:45 PM', hora: 'Mars', nature: { text: 'BAD', type: 'bad' } },
    ];

    return (
      <View style={styles.tabContent}>
        <View style={styles.horaTimelineContainer}>
          {staticHoraList.map((h: any, idx: number) => {
            const isLast = idx === staticHoraList.length - 1;
            const isActive = idx === activeHoraIdx;
            const activeTypeStr = isActive ? `${h.nature.type}_active` : h.nature.type;

            return (
              <TouchableOpacity 
                key={idx} 
                style={styles.horaTimelineRow} 
                onPress={() => setActiveHoraIdx(idx)}
                activeOpacity={isActive ? 1 : 0.7}
              >
                {/* Timeline Column */}
                <View style={styles.horaTimelineCol}>
                  {!isLast && <View style={isActive ? styles.horaTimelineLineActive : styles.horaTimelineLine} />}
                  {isActive ? (
                    <View style={styles.horaTimelineDotActiveOuter}>
                      <View style={styles.horaTimelineDotActiveMiddle}>
                        <View style={styles.horaTimelineDotActiveInner} />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.horaTimelineDotInactive} />
                  )}
                </View>

                {/* Content Column */}
                <View style={styles.horaContentCol}>
                  {isActive ? (
                    <View style={styles.horaActiveCard}>
                      <View style={styles.horaActiveTopRow}>
                        <Text style={styles.horaActiveTitle}>CURRENT HORA</Text>
                        <View style={styles.horaActiveNowBadge}>
                          <Text style={styles.horaActiveNowText}>NOW</Text>
                        </View>
                      </View>
                      <Text style={styles.horaActiveTime}>{h.time}</Text>
                      <View style={styles.horaPlanetRowMain}>
                        <View style={styles.horaPlanetLeft}>
                          {planetIcons[h.hora] && <Image source={planetIcons[h.hora]} style={styles.horaPlanetIconActive} resizeMode="contain" />}
                          <Text style={styles.horaPlanetNameActive}>{h.hora}</Text>
                        </View>
                        <View style={[styles.natureBadge, (styles as any)[`natureBadge_${activeTypeStr}`]]}>
                          <View style={[styles.natureDot, (styles as any)[`natureDot_${activeTypeStr}`]]} />
                          <Text style={[styles.natureText, (styles as any)[`natureText_${activeTypeStr}`]]}>{h.nature.text}</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.horaInactiveBox}>
                      <View style={styles.horaInactiveInfo}>
                        <Text style={styles.horaInactiveTime}>{h.time}</Text>
                        <View style={styles.horaPlanetLeft}>
                          {planetIcons[h.hora] && <Image source={planetIcons[h.hora]} style={styles.horaPlanetIcon} resizeMode="contain" />}
                          <Text style={styles.horaPlanetNameInactive}>{h.hora}</Text>
                        </View>
                      </View>
                      <View style={[styles.natureBadge, (styles as any)[`natureBadge_${h.nature.type}`]]}>
                        <View style={[styles.natureDot, (styles as any)[`natureDot_${h.nature.type}`]]} />
                        <Text style={[styles.natureText, (styles as any)[`natureText_${h.nature.type}`]]}>{h.nature.text}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPlanetsTab = () => {
    const mainPlanets = [
      { name: 'Sun', sanskrit: 'SURYA', sign: 'Aries', degree: "15° 42'", motion: 'DIRECT', desc: 'Auspicious for new beginnings and leadership roles.', icon: require('../assets/images/zodiac/su/sun3.png') },
      { name: 'Moon', sanskrit: 'CHANDRA', sign: 'Cancer', degree: "22° 11'", motion: 'DIRECT', desc: 'Mental peace and emotional stability. Good for family.', icon: require('../assets/images/zodiac/su/moon2.png') },
      { name: 'Jupiter', sanskrit: 'GURU', sign: 'Taurus', degree: "08° 15'", motion: 'RETRO', desc: 'Internal growth. Re-evaluate financial investments.', icon: require('../assets/images/zodiac/su/jupiter2.png') },
      { name: 'Mars', sanskrit: 'MANGAL', sign: 'Leo', degree: "04° 29'", motion: 'DIRECT', desc: 'High courage and ambition. Avoid arguments today.', icon: require('../assets/images/zodiac/su/mars2.png') },
    ];

    const shadowPlanets = [
      { name: 'Rahu', signDegree: "Pisces • 12° 50'", meaning: 'TRANSFORMATION', icon: require('../assets/images/zodiac/su/rahu.png') },
      { name: 'Ketu', signDegree: "Virgo • 12° 50'", meaning: 'WISDOM', icon: require('../assets/images/zodiac/su/ketu.png') },
    ];

    return (
      <View style={styles.planetsTabContent}>
        {/* Main Planets */}
        {mainPlanets.map((p, idx) => (
          <View key={idx} style={styles.planetCardNew}>
            <View style={styles.planetHeaderNew}>
              <View style={styles.planetHeaderLeft}>
                <Image source={p.icon} style={{ width: 18.333, height: 18.333, tintColor: '#994700' }} resizeMode="contain" />
                <View style={styles.planetNameCol}>
                  <Text style={styles.planetNameNew}>{p.name}</Text>
                  <Text style={styles.planetSanskritNew}>{p.sanskrit}</Text>
                </View>
              </View>
              <View style={styles.planetHeaderRight}>
                <Text style={styles.planetSignNew}>{p.sign}</Text>
                <Text style={styles.planetDegreeNew}>{p.degree}</Text>
                <View style={styles.planetDot} />
                <Text style={[styles.planetMotionNew, p.motion === 'RETRO' ? styles.planetMotionRetro : null]}>{p.motion}</Text>
              </View>
            </View>
            <View style={styles.planetDescBox}>
              <Text style={styles.planetDescText}>{p.desc}</Text>
            </View>
          </View>
        ))}

        {/* Nodes (Rahu/Ketu) */}
        <View style={styles.nodesContainer}>
          {shadowPlanets.map((n, idx) => (
            <View key={idx} style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <Image source={n.icon} style={{ width: 18.333, height: 18.333, tintColor: '#994700' }} resizeMode="contain" />
                <Text style={styles.nodeName}>{n.name}</Text>
              </View>
              <Text style={styles.nodeSignDegree}>{n.signDegree}</Text>
              <Text style={styles.nodeMeaning}>{n.meaning}</Text>
            </View>
          ))}
        </View>

        {/* Saturn */}
        <View style={styles.planetCardNew}>
          <View style={styles.planetHeaderNew}>
            <View style={styles.planetHeaderLeft}>
              <Image source={require('../assets/images/zodiac/su/saturn2.png')} style={{ width: 18.333, height: 18.333, tintColor: '#994700' }} resizeMode="contain" />
              <View style={styles.planetNameCol}>
                <Text style={styles.planetNameNew}>Saturn</Text>
                <Text style={styles.planetSanskritNew}>SHANI</Text>
              </View>
            </View>
            <View style={styles.planetHeaderRight}>
              <Text style={styles.planetSignNew}>Aquarius</Text>
              <Text style={styles.planetDegreeNew}>28° 02'</Text>
              <View style={styles.planetDot} />
              <Text style={styles.planetMotionNew}>DIRECT</Text>
            </View>
          </View>
          <View style={styles.planetDescBox}>
            <Text style={styles.planetDescText}>Focus on discipline and planning. Patience is key.</Text>
          </View>
        </View>

        {/* Celestial Event */}
        <View style={styles.celestialCard}>
          <View style={styles.celestialIconBox}>
            <Image source={require('../assets/images/zodiac/su/celestial.png')} style={{ width: 24, height: 24, tintColor: '#FFF' }} resizeMode="contain" />
          </View>
          <View style={styles.celestialTextCol}>
            <View style={styles.celestialTopRow}>
              <Text style={styles.celestialLabel}>CELESTIAL EVENT</Text>
              <Text style={styles.celestialTime}>Tomorrow</Text>
            </View>
            <Text style={styles.celestialTitle}>Venus Transit Alert</Text>
            <Text style={styles.celestialDesc}>
              Venus enters Taurus tomorrow at 06:45 AM. Expect a surge in creative energy.
            </Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.celestialLink}>View Transit Calendar</Text>
              <Ionicons name="arrow-forward" size={9.333} color="#994700" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const dateLabel = formatDateLabel(selectedDate);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Premium Peach-Pinkish Background Gradient matching Figma */}
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Top Header with integrated navigation & tabs */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#311303" />
        </TouchableOpacity>
        
        {/* Responsive Tabs in Header matching Figma perfectly */}
        <View style={styles.tabsWrapper}>
          {(['panchang', 'hora', 'planets'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selector Header Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateChevron} onPress={handlePrevDay}>
          <Ionicons name="chevron-back" size={20} color="#8C7263" />
        </TouchableOpacity>
        
        <View style={styles.dateInfoWrapper}>
          <Text style={styles.dateMainText}>{dateLabel.dateStr}</Text>
          <Text style={styles.dateSubText}>{dateLabel.dayStr}</Text>
        </View>

        <TouchableOpacity style={styles.dateChevron} onPress={handleNextDay}>
          <Ionicons name="chevron-forward" size={20} color="#8C7263" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9B4500']} />}
      >
        {loading ? (
          <BrandedLoading message="Fetching Cosmic Calculations..." />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : (
          <>
            {activeTab === 'panchang' && renderPanchangTab()}
            {activeTab === 'hora' && renderHoraTab()}
            {activeTab === 'planets' && renderPlanetsTab()}
          </>
        )}
      </ScrollView>



      {/* Full-Screen Premium AI Chat Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="sparkles" size={20} color="#FF6B00" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Astrology AI Insights</Text>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#8C7263" />
              </TouchableOpacity>
            </View>

            {/* Chat List */}
            <ScrollView 
              style={styles.chatScroll}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.length === 0 ? (
                <View style={styles.emptyChatContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#D2C3BB" />
                  <Text style={styles.emptyChatText}>
                    Ask questions about today's tithi, muhurta, planetary impact, or auspicious tasks!
                  </Text>
                </View>
              ) : (
                chatMessages.map((m, i) => (
                  <View key={i} style={styles.chatBubbleContainer}>
                    <View style={styles.userBubble}>
                      <Text style={styles.userBubbleText}>{m.question}</Text>
                    </View>
                    <View style={styles.aiBubble}>
                      <LinearGradient
                        colors={['#FFF5F0', '#FFFBF9']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Text style={styles.aiBubbleText}>{m.answer}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input Wrap */}
            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                placeholder="Ask AI about auspicious times today..."
                placeholderTextColor="#A09090"
                value={question}
                onChangeText={setQuestion}
              />
              <TouchableOpacity style={styles.modalSendBtn} onPress={submitQuestion} disabled={chatLoading}>
                {chatLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFEEE5' },
  header: {
    display: 'flex',
    width: '100%',
    paddingVertical: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'flex-start',
    marginLeft: 20,
    marginBottom: 16,
  },
  tabsWrapper: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabItem: {
    display: 'flex',
    paddingVertical: 16,
    paddingHorizontal: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  tabText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: 'rgba(0, 0, 0, 0.40)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tabTextActive: { 
    color: '#9B4500', 
    fontWeight: '700',
  },
  activeTabIndicator: {
    width: 119,
    height: 3,
    position: 'absolute',
    bottom: -1,
    alignSelf: 'center',
    borderRadius: 99,
    backgroundColor: '#9B4500',
  },

  // Date Selector
  dateSelector: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    alignSelf: 'stretch',
  },
  dateChevron: {
    display: 'flex',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dateInfoWrapper: {
    alignItems: 'center',
  },
  dateMainText: {
    color: '#311303',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
  },
  dateSubText: {
    color: '#8C7263',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20,
  },

  // Dynamic Tabs styling
  tabContent: { paddingTop: 8 },
  sectionHeader: { 
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
    marginLeft: 16, 
    marginBottom: 8, 
    marginTop: 16 
  },
  sectionHeaderAlert: {
    color: '#BA1A1A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
    marginLeft: 8,
  },
  
  card: {
    display: 'flex',
    paddingHorizontal: 16,
    paddingVertical: 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE2D5',
    backgroundColor: '#FFF',
    shadowColor: '#8C4200',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: { 
    display: 'flex',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    alignSelf: 'stretch',
    paddingVertical: 14,
  },
  infoDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: '#FFE2D5',
  },
  infoLabel: { 
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  infoValue: { 
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },

  // Sun Moon Times
  sunMoonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFE2D5',
    alignSelf: 'stretch',
    gap: 1,
  },
  sunMoonItem: {
    flexBasis: '49%',
    flexGrow: 1,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    backgroundColor: '#FFF',
  },
  sunMoonIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE2D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunMoonMeta: {
    flex: 1,
  },
  sunMoonLabel: {
    color: '#8C7263',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sunMoonValue: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  
  // Inauspicious times
  inauspiciousHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  alertIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  natureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  natureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  natureText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 15,
  },
  natureBadge_good: { 
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  natureDot_good: { backgroundColor: '#22C55E' },
  natureText_good: { color: '#15803D' },
  natureBadge_good_active: {
    paddingHorizontal: 13,
    paddingTop: 6,
    paddingBottom: 7.5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  natureDot_good_active: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#22C55E' 
  },
  natureText_good_active: { 
    color: '#15803D',
    fontSize: 11,
    lineHeight: 16.5,
  },
  natureBadge_neutral: { 
    backgroundColor: '#FFE2D5',
    borderWidth: 1,
    borderColor: 'rgba(224, 192, 175, 0.30)',
  },
  natureDot_neutral: { backgroundColor: '#584235' },
  natureText_neutral: { color: '#584235' },
  natureBadge_neutral_active: {
    paddingHorizontal: 13,
    paddingTop: 6,
    paddingBottom: 7.5,
    backgroundColor: '#FFE2D5',
    borderWidth: 1,
    borderColor: 'rgba(224, 192, 175, 0.60)',
  },
  natureDot_neutral_active: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#584235' },
  natureText_neutral_active: { color: '#584235', fontSize: 11, lineHeight: 16.5 },
  natureBadge_bad: { 
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  natureDot_bad: { backgroundColor: '#EF4444' },
  natureText_bad: { color: '#B91C1C' },
  natureBadge_bad_active: {
    paddingHorizontal: 13,
    paddingTop: 6,
    paddingBottom: 7.5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  natureDot_bad_active: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  natureText_bad_active: { color: '#B91C1C', fontSize: 11, lineHeight: 16.5 },
  inauspiciousRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 14,
    width: '100%',
  },
  inauspiciousLabel: { 
    color: '#93000A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  inauspiciousValue: { 
    color: '#BA1A1A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },

  // Choghadiya Section
  choghadiyaHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  choghadiyaToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(140, 58, 0, 0.08)',
    borderRadius: 8,
    padding: 2,
    marginTop: 8,
  },
  choghadiyaToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  choghadiyaToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#8C4200',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  choghadiyaToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C7263',
  },
  choghadiyaToggleTextActive: {
    color: '#9B4500',
  },
  choghadiyaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  choghadiyaCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.10)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8C4200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  choghadiyaTitle: {
    color: '#311303',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 4,
  },
  choghadiyaTime: {
    color: '#8C7263',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 10,
  },
  choghadiyaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  choghadiyaBadgeGood: {
    backgroundColor: '#DCFCE7',
  },
  choghadiyaBadgeBad: {
    backgroundColor: '#FFDAD6',
  },
  choghadiyaBadgeTextGood: {
    color: '#15803D',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  choghadiyaBadgeTextBad: {
    color: '#BA1A1A',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },

  // Hora Timeline layout
  horaTimelineContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  horaTimelineRow: {
    flexDirection: 'row',
  },
  horaTimelineCol: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
    zIndex: 1,
    position: 'relative',
  },
  horaTimelineLine: {
    width: 1,
    height: 68,
    position: 'absolute',
    top: 24,
    backgroundColor: '#E0C0AF',
    zIndex: -1,
  },
  horaTimelineLineActive: {
    width: 1,
    height: 121,
    position: 'absolute',
    top: 24,
    backgroundColor: '#E0C0AF',
    zIndex: -1,
  },
  horaTimelineDotInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D2C3BB',
    borderWidth: 4,
    borderColor: '#FFF8F6',
    marginTop: 4,
  },
  horaTimelineDotActiveOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(153, 71, 0, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  horaTimelineDotActiveMiddle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF8F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horaTimelineDotActiveInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B00',
  },
  horaContentCol: {
    flex: 1,
    paddingBottom: 24,
  },
  horaInactiveBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horaInactiveInfo: {
    flexDirection: 'column',
  },
  horaInactiveTime: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 6,
  },
  horaPlanetRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  horaPlanetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horaPlanetIcon: {
    width: 16.5,
    height: 16.5,
    marginRight: 8,
  },
  horaPlanetIconActive: {
    width: 16.667,
    height: 16.667,
    marginRight: 8,
    tintColor: '#FF7B00',
  },
  horaPlanetNameInactive: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
  },
  horaPlanetNameActive: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
  },
  horaActiveCard: {
    borderWidth: 2,
    borderColor: '#FF7B00',
    borderRadius: 12,
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  horaActiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  horaActiveTitle: {
    color: '#FF7B00',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginRight: 8,
  },
  horaActiveNowBadge: {
    backgroundColor: '#FF7B00',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  horaActiveNowText: {
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  horaActiveTime: {
    color: '#FF7B00',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 12,
  },

  // Planets
  planetsTabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  planetCardNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#8C4200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  planetHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planetNameCol: {
    marginLeft: 8,
  },
  planetNameNew: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
  },
  planetSanskritNew: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C7263',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  planetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planetSignNew: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
    marginRight: 6,
  },
  planetDegreeNew: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  planetDot: {
    width: 4,
    height: 4,
    flexShrink: 0,
    borderRadius: 9999,
    backgroundColor: '#E0C0AF',
    marginHorizontal: 6,
  },
  planetMotionNew: {
    color: '#994700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  planetMotionRetro: {
    color: '#BA1A1A',
  },
  planetDescBox: {
    backgroundColor: '#FFF8F6',
    borderLeftWidth: 3,
    borderLeftColor: '#E0C0AF',
    padding: 12,
    borderRadius: 6,
  },
  planetDescText: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 22.75,
  },
  nodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nodeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 192, 175, 0.10)',
    padding: 16,
    width: (SCREEN_WIDTH - 44) / 2,
    shadowColor: '#8C4200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeName: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 6,
  },
  nodeSignDegree: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
  },
  nodeMeaning: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.45,
    textTransform: 'uppercase',
  },
  celestialCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    alignSelf: 'stretch',
    backgroundColor: '#FDF1E9',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(153, 71, 0, 0.20)',
    shadowColor: '#8C4200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  celestialIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#9B4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celestialTextCol: {
    flex: 1,
  },
  celestialTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  celestialLabel: {
    color: '#994700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  celestialTime: {
    fontSize: 10,
    fontWeight: '500',
    color: '#584235',
  },
  celestialTitle: {
    color: '#311303',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
  },
  celestialDesc: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 19.25,
    marginBottom: 12,
  },
  celestialLink: {
    color: '#994700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 20,
  },

  loader: { flex: 1, marginTop: 100, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: '#8C7263', marginTop: 12, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#8C7263', marginTop: 60, fontSize: 16, paddingHorizontal: 32 },

  // AI Floating button
  aiFloatingBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  aiFloatingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(49, 19, 3, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF5F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE2D5',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#311303',
  },
  chatScroll: {
    flex: 1,
    marginTop: 10,
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#8C7263',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  chatBubbleContainer: {
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: '#FF8E3C',
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 2,
    maxWidth: '80%',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 2,
    maxWidth: '85%',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE2D5',
    shadowColor: '#8C4200',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: 'hidden',
  },
  aiBubbleText: {
    color: '#311303',
    fontSize: 14,
    lineHeight: 20,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#FFE2D5',
    marginTop: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    color: '#311303',
  },
  modalSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
