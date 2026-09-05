import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { getPanchang } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import { useLanguageStore } from '../src/utils/i18n';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { KeyboardAwareScrollView } from '../src/components/KeyboardAwareScrollView';

import {
  AdvancedPanchangData,
  ChaughadiyaSourceMap,
  ChoghadiyaItem,
  ChoghadiyaMode,
  HoraItem,
  HoraSourceMap,
  LocationCoords,
  OverviewItem,
  PanchangPayload,
  PlanetData,
  RawChoghadiyaItem,
  RawHoraItem,
  TabType,
} from '../src/types/panchang';
import {
  GOOD_MUHURTAS,
  STATIC_CHOGHADIYA_LIST,
  STATIC_HORA_LIST,
} from '../src/constants/panchang';
import {
  buildHoraDateRanges,
  findActiveHoraIdx,
  formatDateLabel,
  getErrorMessage,
  getPlanetNature,
} from '../src/utils/panchangTimeUtils';
import {
  HoraTabContent,
  PanchangTabContent,
  PlanetsTabContent,
  styles,
} from '../src/components/panchang';

const getAdvancedPanchang = (
  p: PanchangPayload | null
): AdvancedPanchangData | undefined =>
  p?.sources?.advanced_panchang || p?.sources?.panchang_advanced;

const getChoghadiyaItemsList = (
  p: PanchangPayload | null,
  mode: ChoghadiyaMode
): RawChoghadiyaItem[] | undefined => {
  const sources = p?.sources?.chaughadiya_muhurta;
  const nested =
    typeof sources === 'object' && sources !== null && !Array.isArray(sources) && 'chaughadiya' in sources
      ? (sources as ChaughadiyaSourceMap).chaughadiya
      : sources;
  const source = p?.chaughadiya || nested;

  if (!source) return undefined;
  if (Array.isArray(source)) return source;
  if (typeof source === 'object') {
    const map = source as ChaughadiyaSourceMap;
    const modeList = map[mode];
    if (Array.isArray(modeList)) return modeList;
    if (Array.isArray(map.day)) return map.day;
    if (Array.isArray(map.night)) return map.night;
  }
  return undefined;
};

const getHoraItemsList = (
  p: PanchangPayload | null
): RawHoraItem[] | undefined => {
  const sources = p?.sources?.hora_muhurta;
  const nested =
    typeof sources === 'object' && sources !== null && !Array.isArray(sources) && 'hora' in sources
      ? (sources as HoraSourceMap).hora
      : sources;
  const source = p?.hora || nested;

  if (!source) return undefined;
  if (Array.isArray(source)) return source;
  if (typeof source === 'object') {
    const map = source as HoraSourceMap;
    const day = Array.isArray(map.day) ? map.day : [];
    const night = Array.isArray(map.night) ? map.night : [];
    if (day.length || night.length) {
      return [...day, ...night];
    }
  }
  return undefined;
};

const getPlanetsSource = (
  p: PanchangPayload | null
): PlanetData[] | undefined =>
  p?.planets || p?.sources?.planet_panchang;

export default function PanchangScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const language = useLanguageStore((state) => state.language);

  const initialUserLocation = (user as { home_location?: { latitude?: number; longitude?: number } })?.home_location;

  const [activeTab, setActiveTab] = useState<TabType>('panchang');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCoords, setActiveCoords] = useState<LocationCoords>({
    lat: initialUserLocation?.latitude,
    lng: initialUserLocation?.longitude,
  });
  const [payload, setPayload] = useState<PanchangPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Sub-tabs / Toggles
  const [choghadiyaMode] = useState<ChoghadiyaMode>('day');
  const [activeHoraIdx, setActiveHoraIdx] = useState<number>(1);

  const mainScrollRef = useRef<KeyboardAwareScrollView>(null);
  const horaCardYPositions = useRef<Record<number, number>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reactive coords synchronization when auth store user updates
  useEffect(() => {
    if (user) {
      const userObj = user as {
        home_location?: { latitude?: number; longitude?: number };
      };
      const lat = userObj.home_location?.latitude;
      const lng = userObj.home_location?.longitude;

      if (lat !== undefined || lng !== undefined) {
        setActiveCoords((prev) => {
          if (prev.lat === lat && prev.lng === lng) return prev;
          return { lat, lng };
        });
      }
    }
  }, [user]);

  const fetchPanchang = useCallback(
    async (
      lat?: number,
      lng?: number,
      forceRefresh = false,
      targetDate?: Date,
      signal?: AbortSignal
    ) => {
      try {
        if (signal?.aborted) return;
        setLoading(!forceRefresh);
        setError('');

        const dateStr = targetDate
          ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
          : undefined;

        const response = await getPanchang({
          lat,
          lng,
          date_str: dateStr,
          force_refresh: forceRefresh,
        });

        if (signal?.aborted) return;
        setPayload((response.data as PanchangPayload) || null);
      } catch (err: unknown) {
        if (signal?.aborted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchPanchang(
      activeCoords.lat,
      activeCoords.lng,
      false,
      selectedDate,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [activeCoords.lat, activeCoords.lng, selectedDate, fetchPanchang]);

  useEffect(() => {
    horaCardYPositions.current = {};
  }, [selectedDate, payload]);

  const onRefresh = () => {
    setRefreshing(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchPanchang(
      activeCoords.lat,
      activeCoords.lng,
      true,
      selectedDate,
      controller.signal
    );
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  // Memoized computed lists
  const overview = useMemo<OverviewItem[]>(() => {
    const advanced = getAdvancedPanchang(payload);
    const base: OverviewItem[] = payload?.overview?.length
      ? payload.overview
      : ([
          {
            label: 'Tithi',
            value: advanced?.tithi?.details?.tithi_name || '',
            icon: 'moon',
          },
          {
            label: 'Nakshatra',
            value: advanced?.nakshatra?.details?.nak_name || '',
            icon: 'star',
          },
          {
            label: 'Yoga',
            value: advanced?.yog?.details?.yog_name || '',
            icon: 'planet',
          },
          {
            label: 'Karana',
            value: advanced?.karan?.details?.karan_name || '',
            icon: 'planet',
          },
        ].filter((i) => Boolean(i.value)) as OverviewItem[]);

    return base.filter(
      (item) =>
        !item.label.toLowerCase().includes('paksha') &&
        !item.label.toLowerCase().includes('pakaha')
    );
  }, [payload]);

  const activeChoghadiyaList = useMemo<
    readonly ChoghadiyaItem[] | ChoghadiyaItem[]
  >(() => {
    const choghadiyaList = getChoghadiyaItemsList(payload, choghadiyaMode);

    return choghadiyaList
      ? choghadiyaList.map((m) => ({
          muhurta: m.muhurta || m.name || '',
          time: m.time || '',
          is_good: Boolean(
            m.is_good ?? (m.muhurta ? GOOD_MUHURTAS.includes(m.muhurta) : false)
          ),
        }))
      : STATIC_CHOGHADIYA_LIST;
  }, [payload, choghadiyaMode]);

  const horaList = useMemo<HoraItem[]>(() => {
    const rawHoraList = getHoraItemsList(payload);
    const itemsToProcess: RawHoraItem[] = rawHoraList
      ? rawHoraList.map((item) => ({
          ...item,
          hora: item.hora || item.name || '',
          nature: getPlanetNature(item.hora || item.name || ''),
        }))
      : (STATIC_HORA_LIST as RawHoraItem[]);

    return buildHoraDateRanges(itemsToProcess, selectedDate);
  }, [payload, selectedDate]);

  const currentHoraIdx = useMemo(() => {
    return findActiveHoraIdx(horaList, selectedDate);
  }, [horaList, selectedDate]);

  // Robust Auto-scroll logic for Active Hora
  const scrollIntoActiveHora = useCallback((idx: number) => {
    const yPos = horaCardYPositions.current[idx];
    if (typeof yPos === 'number' && mainScrollRef.current) {
      const scrollRef = mainScrollRef.current as unknown as {
        scrollToPosition?: (x: number, y: number, animated: boolean) => void;
        scrollTo?: (options: { y: number; animated: boolean }) => void;
      };

      if (typeof scrollRef.scrollToPosition === 'function') {
        scrollRef.scrollToPosition(0, yPos, true);
      } else if (typeof scrollRef.scrollTo === 'function') {
        scrollRef.scrollTo({ y: yPos, animated: true });
      }
    }
  }, []);

  const handleHoraItemLayout = useCallback(
    (idx: number, yPos: number) => {
      horaCardYPositions.current[idx] = yPos;
      if (idx === activeHoraIdx && activeTab === 'hora') {
        scrollIntoActiveHora(idx);
      }
    },
    [activeHoraIdx, activeTab, scrollIntoActiveHora]
  );

  useEffect(() => {
    if (activeTab === 'hora' && !loading && payload) {
      if (currentHoraIdx !== -1) {
        setActiveHoraIdx(currentHoraIdx);
        const timer = setTimeout(() => {
          scrollIntoActiveHora(currentHoraIdx);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, loading, payload, currentHoraIdx, scrollIntoActiveHora]);

  const dateLabel = formatDateLabel(selectedDate);

  return (
    <View style={styles.container}>
      {/* Premium Peach-Pinkish Background Gradient matching Figma */}
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Top Header with integrated navigation & tabs */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#311303" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panchang</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Responsive Tabs in Header matching Figma perfectly */}
        <View style={styles.tabsWrapper}>
          {(['panchang', 'hora', 'planets'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selector Header Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateChevron}
          onPress={handlePrevDay}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
        >
          <Ionicons name="chevron-back" size={20} color="#8C7263" />
        </TouchableOpacity>

        <View style={styles.dateInfoWrapper}>
          <Text style={styles.dateMainText}>{dateLabel.dateStr}</Text>
          <Text style={styles.dateSubText}>{dateLabel.dayStr}</Text>
        </View>

        <TouchableOpacity
          style={styles.dateChevron}
          onPress={handleNextDay}
          accessibilityRole="button"
          accessibilityLabel="Next day"
        >
          <Ionicons name="chevron-forward" size={20} color="#8C7263" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <KeyboardAwareScrollView
        ref={mainScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9B4500']}
          />
        }
      >
        {loading ? (
          <BrandedLoading
            message={
              language === 'hi'
                ? 'पंचांग की गणना की जा रही है...'
                : 'Fetching Cosmic Calculations...'
            }
          />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : (
          <>
            {activeTab === 'panchang' && (
              <PanchangTabContent
                payload={payload}
                overview={overview}
                activeChoghadiyaList={activeChoghadiyaList}
                choghadiyaMode={choghadiyaMode}
                language={language}
                onNavigateToTemples={() =>
                  router.push({
                    pathname: '/(tabs)/jaap',
                    params: { tab: 'temple' },
                  })
                }
              />
            )}
            {activeTab === 'hora' && (
              <HoraTabContent
                horaList={horaList}
                activeHoraIdx={activeHoraIdx}
                setActiveHoraIdx={setActiveHoraIdx}
                currentHoraIdx={currentHoraIdx}
                onHoraItemLayout={handleHoraItemLayout}
              />
            )}
            {activeTab === 'planets' && (
              <PlanetsTabContent
                planetsSource={getPlanetsSource(payload)}
                onNavigateTransitCalendar={() => {}}
              />
            )}
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
