import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { getProkeralaPanchang, getProkeralaPanchangSummary } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';

type PanchangRow = {
  label: string;
  value: string;
};

type EndpointOption = {
  key: string;
  label: string;
};

type DetailSection = {
  key: string;
  title: string;
  rows: PanchangRow[];
};

const DEFAULT_ENDPOINTS = 'panchang_advanced';

export default function PanchangScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userLocation = (user as any)?.home_location;
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [extraLoadingKey, setExtraLoadingKey] = useState<string | null>(null);
  const isMountedRef = React.useRef(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [sparkOn, setSparkOn] = useState(false);

  const handleBack = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const mergePayloads = useCallback((currentPayload: any, incomingPayload: any) => {
    if (!currentPayload) {
      return incomingPayload;
    }

    const incomingSources = incomingPayload?.sources || {};
    const mergedSources = {
      ...(currentPayload?.sources || {}),
      ...incomingSources,
    };
    const mergedErrors = {
      ...(currentPayload?.errors || {}),
      ...(incomingPayload?.errors || {}),
    };
    const incomingSections = Array.isArray(incomingPayload?.detail_sections) ? incomingPayload.detail_sections : [];
    const currentSections = Array.isArray(currentPayload?.detail_sections) ? currentPayload.detail_sections : [];
    const sectionMap = new Map<string, DetailSection>();

    currentSections.forEach((section: DetailSection) => sectionMap.set(section.key, section));
    incomingSections.forEach((section: DetailSection) => sectionMap.set(section.key, section));

    const incomingSummary = incomingPayload?.summary;
    const currentSummary = currentPayload?.summary;
    const hasIncomingSummaryData = Boolean(
      incomingSummary?.headline ||
      (Array.isArray(incomingSummary?.overview) && incomingSummary.overview.length > 0) ||
      (Array.isArray(incomingSummary?.timings) && incomingSummary.timings.length > 0) ||
      (Array.isArray(incomingSummary?.insights) && incomingSummary.insights.length > 0)
    );

    return {
      ...currentPayload,
      ...incomingPayload,
      sources: mergedSources,
      errors: mergedErrors,
      detail_sections: Array.from(sectionMap.values()),
      available_endpoints: incomingPayload?.available_endpoints || currentPayload?.available_endpoints || [],
      summary: hasIncomingSummaryData ? incomingSummary : currentSummary,
    };
  }, []);

  const fetchBasePanchang = useCallback(async (forceRefresh = false) => {
    try {
      if (!isMountedRef.current) return;
      setError('');
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const response = await getProkeralaPanchang({
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        endpoints: DEFAULT_ENDPOINTS,
        force_refresh: forceRefresh,
      });
      if (isMountedRef.current) setPayload(response.data || null);
    } catch (err: any) {
      if (isMountedRef.current) setError(err?.response?.data?.detail || err?.message || 'Failed to load Panchang');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchBasePanchang(false);
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBasePanchang]);

  // Handle Android hardware back button to avoid crashes and ensure safe navigation
  useEffect(() => {
    const onBackPress = () => {
      try {
        router.back();
        return true; // handled
      } catch (e) {
        return false; // allow default behavior
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSparkOn((prev) => !prev);
    }, 550);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBasePanchang(true);
  };

  const fetchAIPanchangSummary = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');
    setAiSummary(null);
    try {
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const response = await getProkeralaPanchangSummary({
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        force_refresh: false,
      });
      const summaryText = response.data?.summary;
      if (isMountedRef.current) {
        setAiSummary(summaryText || 'No summary was returned by AI.');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setAiError(err?.response?.data?.detail || err?.message || 'Failed to fetch AI summary');
      }
    } finally {
      if (isMountedRef.current) setAiLoading(false);
    }
  };

  const fetchExtraEndpoint = useCallback(async (endpointKey: string) => {
    try {
      if (!isMountedRef.current) return;
      setExtraLoadingKey(endpointKey);
      setError('');
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const response = await getProkeralaPanchang({
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        endpoints: endpointKey,
      });
      if (isMountedRef.current) setPayload((current: any) => mergePayloads(current, response.data || null));
    } catch (err: any) {
      if (isMountedRef.current) setError(err?.response?.data?.detail || err?.message || `Failed to load ${endpointKey}`);
    } finally {
      if (isMountedRef.current) setExtraLoadingKey(null);
    }
  }, [mergePayloads, userLocation?.latitude, userLocation?.longitude]);

  const summary = payload?.summary ?? {};
  const panchangSource = payload?.sources?.panchang_advanced?.data ?? payload?.sources?.panchang_advanced ?? {};

  const formatIsoTime = (iso?: string) => {
    if (!iso || typeof iso !== 'string') return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getFirst = (input: any) => {
    if (Array.isArray(input) && input.length > 0) return input[0];
    return input;
  };

  const panchangName = (value: any): string => {
    if (!value) return '-';
    const item = getFirst(value);
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    if (typeof item === 'object') {
      if (item.name) return `${item.name}${item.start && item.end ? ` (${formatIsoTime(item.start)} - ${formatIsoTime(item.end)})` : ''}`;
      if (item.start && item.end) return `${formatIsoTime(item.start)} - ${formatIsoTime(item.end)}`;
      return JSON.stringify(item);
    }
    return String(item);
  };

  const derivedOverview: PanchangRow[] = [
    { label: 'Tithi', value: panchangName(panchangSource?.tithi) },
    { label: 'Paksha', value: panchangName(panchangSource?.tithi ? getFirst(panchangSource?.tithi)?.paksha : panchangSource?.paksha) },
    { label: 'Nakshatra', value: panchangName(panchangSource?.nakshatra) },
    { label: 'Yoga', value: panchangName(panchangSource?.yoga) },
    { label: 'Karana', value: panchangName(panchangSource?.karana) },
  ];

  const derivedTiming: PanchangRow[] = [
    { label: 'Sunrise', value: formatIsoTime(panchangSource?.sunrise ?? panchangSource?.sunrise_time) },
    { label: 'Sunset', value: formatIsoTime(panchangSource?.sunset ?? panchangSource?.sunset_time) },
    { label: 'Moonrise', value: formatIsoTime(panchangSource?.moonrise) },
    { label: 'Moonset', value: formatIsoTime(panchangSource?.moonset) },
  ];

  const overviewRows: PanchangRow[] = Array.isArray(summary.overview) && summary.overview.length > 0 ? summary.overview : derivedOverview;
  const timingRows: PanchangRow[] = Array.isArray(summary.timings) && summary.timings.length > 0 ? summary.timings : derivedTiming;
  const detailSections: DetailSection[] = Array.isArray(payload?.detail_sections) ? payload.detail_sections : [];
  const extraSections = detailSections.filter((section) => section.key !== 'panchang_advanced');
  const endpointOptions = useMemo(() => {
    const availableEndpoints: EndpointOption[] = Array.isArray(payload?.available_endpoints) ? payload.available_endpoints : [];
    const loadedEndpointKeys = new Set(extraSections.map((section) => section.key));
    return availableEndpoints.filter((endpoint) => !loadedEndpointKeys.has(endpoint.key));
  }, [extraSections, payload?.available_endpoints]);

  const displayDate = payload?.date
    ? new Date(payload.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Panchang...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todays Panchang</Text>
        <TouchableOpacity
          style={[
            styles.aiButton,
            sparkOn ? styles.aiButtonSparkOn : null,
          ]}
          onPress={fetchAIPanchangSummary}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Ionicons name="flash" size={20} color={COLORS.surface} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.dateCard}>
          <Ionicons name="calendar" size={24} color={COLORS.primary} />
          <Text style={styles.dateText}>{displayDate}</Text>
          {summary?.headline ? <Text style={styles.headlineText}>{summary.headline}</Text> : null}
        </View>

        {aiError ? (
          <View style={[styles.section, styles.errorCard]}>
            <Text style={styles.errorText}>{aiError}</Text>
          </View>
        ) : null}

        {aiSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Panchang Summary</Text>
            <View style={styles.card}>
              <Text style={styles.infoValue}>{aiSummary}</Text>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.section}>
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={22} color={COLORS.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.card}>
            {overviewRows.length > 0 ? (
              overviewRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} icon="sparkles" />
              ))
            ) : (
              <InfoRow label="Status" value="No Panchang overview available." icon="information-circle" />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timings</Text>
          <View style={styles.card}>
            {timingRows.length > 0 ? (
              timingRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} icon="time" />
              ))
            ) : (
              <InfoRow label="Status" value="No timings available." icon="information-circle" />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Load More Endpoints</Text>
          <View style={styles.card}>
            <Text style={styles.helperText}>Tap an endpoint name only when you need it. This saves Prokerala requests.</Text>
            <View style={styles.endpointGrid}>
              {endpointOptions.map((endpoint) => {
                const isLoadingEndpoint = extraLoadingKey === endpoint.key;
                return (
                  <TouchableOpacity
                    key={endpoint.key}
                    style={styles.endpointChip}
                    onPress={() => fetchExtraEndpoint(endpoint.key)}
                    disabled={Boolean(extraLoadingKey)}
                  >
                    {isLoadingEndpoint ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.endpointChipText}>{endpoint.label}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {!endpointOptions.length ? (
              <Text style={styles.helperText}>All optional endpoints loaded for this session.</Text>
            ) : null}
          </View>
        </View>

        {extraSections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.length > 0 ? (
                section.rows.map((row) => (
                  <InfoRow key={`${section.key}-${row.label}`} label={row.label} value={row.value} icon="planet" />
                ))
              ) : (
                <InfoRow label="Status" value="No clean rows available for this endpoint." icon="information-circle" />
              )}
            </View>
          </View>
        ))}

        {payload?.errors && Object.keys(payload.errors).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Errors</Text>
            <View style={styles.card}>
              {Object.entries(payload.errors).map(([key, value]) => (
                <InfoRow key={key} label={key} value={String(value)} icon="warning" />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiButton: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  aiButtonSparkOn: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 1,
    transform: [{ scale: 1.12 }],
  },
  scrollView: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  dateCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  samvatText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  headlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  noticeText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  section: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.md,
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  endpointGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  endpointChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    backgroundColor: `${COLORS.primary}10`,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
  endpointChipText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomPadding: {
    height: SPACING.xl,
  },
});
