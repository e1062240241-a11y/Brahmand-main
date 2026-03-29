import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { askProkeralaAstrology, getProkeralaAstrology, getProkeralaAstrologySummary } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

type InfoRowType = {
  label: string;
  value: string;
};

type DetailSection = {
  key: string;
  title: string;
  rows: InfoRowType[];
};

type EndpointOption = {
  key: string;
  label: string;
};

const DEFAULT_ENDPOINTS = 'birth_details';

const AYANAMSA_OPTIONS = [
  { value: 1, label: 'Lahiri' },
  { value: 3, label: 'Raman' },
  { value: 5, label: 'KP' },
];

export default function AstrologyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userLocation = (user as any)?.home_location;
  const [ayanamsa, setAyanamsa] = useState(1);
  const [payload, setPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [extraLoadingKey, setExtraLoadingKey] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatMessages, setChatMessages] = useState<{ question: string; answer: string }[]>([]);
  const [sparkOn, setSparkOn] = useState(false);
  const isMountedRef = React.useRef(true);

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

    return {
      ...currentPayload,
      ...incomingPayload,
      sources: mergedSources,
      errors: mergedErrors,
      detail_sections: Array.from(sectionMap.values()),
      available_endpoints: incomingPayload?.available_endpoints || currentPayload?.available_endpoints || [],
      summary: incomingPayload?.summary || currentPayload?.summary || {},
    };
  }, []);

  const fetchBaseAstrology = useCallback(async (forceRefresh = false) => {
    try {
      if (!isMountedRef.current) return;
      setError('');
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const response = await getProkeralaAstrology({
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        ayanamsa,
        la: 'en',
        endpoints: DEFAULT_ENDPOINTS,
        force_refresh: forceRefresh,
      });
      if (isMountedRef.current) {
        setPayload(response.data || null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load astrology');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [ayanamsa, userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchBaseAstrology(false);
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBaseAstrology]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSparkOn((prev) => !prev);
    }, 550);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBaseAstrology(true);
  };

  const handleAyanamsaChange = (value: number) => {
    if (value === ayanamsa) return;
    setAyanamsa(value);
    setAiSummary(null);
    setAiError('');
    setChatError('');
    setChatMessages([]);
    setLoading(true);
  };

  const fetchAISummary = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const response = await getProkeralaAstrologySummary({
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        ayanamsa,
        la: 'en',
      });
      if (isMountedRef.current) {
        setAiSummary(response.data?.summary || 'No summary was returned by AI.');
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
      const response = await getProkeralaAstrology({
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        ayanamsa,
        la: 'en',
        endpoints: endpointKey,
      });
      if (isMountedRef.current) {
        setPayload((current: any) => mergePayloads(current, response.data || null));
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || `Failed to load ${endpointKey}`);
      }
    } finally {
      if (isMountedRef.current) setExtraLoadingKey(null);
    }
  }, [ayanamsa, mergePayloads, userLocation?.latitude, userLocation?.longitude]);

  const submitQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || chatLoading) return;

    setChatLoading(true);
    setChatError('');
    try {
      const response = await askProkeralaAstrology({
        question: trimmed,
        astrology: payload,
        ayanamsa,
        la: 'en',
      });
      if (isMountedRef.current) {
        setChatMessages((current) => [{ question: trimmed, answer: response.data?.answer || 'No answer returned.' }, ...current]);
        setQuestion('');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setChatError(err?.response?.data?.detail || err?.message || 'Failed to ask AI');
      }
    } finally {
      if (isMountedRef.current) setChatLoading(false);
    }
  };

  const summary = payload?.summary ?? {};
  const detailSections: DetailSection[] = useMemo(() => {
    return Array.isArray(payload?.detail_sections) ? payload.detail_sections : [];
  }, [payload?.detail_sections]);
  const optionalSections = detailSections.filter((section) => !['birth_details', 'kundli_advanced'].includes(section.key));
  const endpointOptions = useMemo(() => {
    const availableEndpoints: EndpointOption[] = Array.isArray(payload?.available_endpoints) ? payload.available_endpoints : [];
    const loadedEndpointKeys = new Set(optionalSections.map((section) => section.key));
    const nextOptions = availableEndpoints.filter((endpoint) => !loadedEndpointKeys.has(endpoint.key));

    const hasKundliLoaded = detailSections.some((section) => section.key === 'kundli_advanced');
    const hasKundliOption = nextOptions.some((endpoint) => endpoint.key === 'kundli_advanced');
    if (!hasKundliLoaded && !hasKundliOption) {
      nextOptions.unshift({ key: 'kundli_advanced', label: 'Advanced Kundli' });
    }

    return nextOptions;
  }, [detailSections, optionalSections, payload?.available_endpoints]);

  const birthRows: InfoRowType[] = Array.isArray(summary.overview) ? summary.overview : [];
  const highlightRows: InfoRowType[] = Array.isArray(summary.highlights) ? summary.highlights : [];
  const insightRows: InfoRowType[] = Array.isArray(summary.insights) ? summary.insights : [];
  const hasBirthRows = birthRows.length > 0;
  const hasHighlightRows = highlightRows.length > 0;
  const hasInsightRows = insightRows.length > 0;

  const birthDateText = payload?.datetime
    ? new Date(payload.datetime).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Birth datetime unavailable';
  const coordsText = payload?.coordinates
    ? `${payload.coordinates.latitude}, ${payload.coordinates.longitude}`
    : 'Coordinates unavailable';
  const missingBirthDetails = error.toLowerCase().includes('date of birth and time of birth are required');
  const missingCoordinates = error.toLowerCase().includes('latitude/longitude missing');

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
          <Text style={styles.loadingText}>Loading Horoscope...</Text>
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
        <Text style={styles.headerTitle}>Horoscope & Astrology</Text>
        <TouchableOpacity
          style={[styles.aiButton, sparkOn ? styles.aiButtonSparkOn : null]}
          onPress={fetchAISummary}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Ionicons name="flash" size={18} color={COLORS.surface} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Birth Snapshot</Text>
              <Text style={styles.heroTitle}>{summary?.headline || 'Your kundli highlights will appear here'}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {AYANAMSA_OPTIONS.find((option) => option.value === ayanamsa)?.label}
              </Text>
            </View>
          </View>
          <Text style={styles.heroSubtext}>{birthDateText}</Text>
          <Text style={styles.heroSubtext}>Coordinates: {coordsText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayanamsa</Text>
          <View style={styles.card}>
            <View style={styles.optionRow}>
              {AYANAMSA_OPTIONS.map((option) => {
                const active = option.value === ayanamsa;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionChip, active ? styles.optionChipActive : null]}
                    onPress={() => handleAyanamsaChange(option.value)}
                  >
                    <Text style={[styles.optionChipText, active ? styles.optionChipTextActive : null]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>
              Base fetch uses only Birth Details to save Prokerala requests. Load Advanced Kundli and other tools only when needed.
            </Text>
          </View>
        </View>

        {aiError ? (
          <View style={styles.section}>
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={COLORS.primary} />
              <Text style={styles.errorText}>{aiError}</Text>
            </View>
          </View>
        ) : null}

        {aiSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Summary</Text>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{aiSummary}</Text>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.section}>
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={20} color={COLORS.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            {missingBirthDetails ? (
              <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/profile/edit')}>
                <Ionicons name="create-outline" size={16} color={COLORS.surface} />
                <Text style={styles.ctaButtonText}>Add Birth Details In Profile</Text>
              </TouchableOpacity>
            ) : null}
            {missingCoordinates ? (
              <TouchableOpacity style={styles.secondaryCtaButton} onPress={() => router.push('/settings/location')}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryCtaButtonText}>Update Home Location</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {hasBirthRows ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Birth Details</Text>
            <View style={styles.card}>
              {birthRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} icon="sparkles" />
              ))}
            </View>
          </View>
        ) : null}

        {hasHighlightRows ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kundli Highlights</Text>
            <View style={styles.card}>
              {highlightRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} icon="planet" />
              ))}
            </View>
          </View>
        ) : null}

        {hasInsightRows ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.card}>
              {insightRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} icon="star" />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask AI About This Horoscope</Text>
          <View style={styles.card}>
            <Text style={styles.helperText}>Ask questions about the fetched kundli, doshas, planets, or birth details.</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Example: What does this moon sign and ascendant combination suggest?"
              placeholderTextColor={COLORS.textLight}
              value={question}
              onChangeText={setQuestion}
              multiline
            />
            <TouchableOpacity style={styles.askButton} onPress={submitQuestion} disabled={chatLoading}>
              {chatLoading ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.surface} />
                  <Text style={styles.askButtonText}>Ask AI</Text>
                </>
              )}
            </TouchableOpacity>
            {chatError ? <Text style={styles.inlineErrorText}>{chatError}</Text> : null}
          </View>
        </View>

        {chatMessages.map((message, index) => (
          <View key={`${message.question}-${index}`} style={styles.section}>
            <Text style={styles.sectionTitle}>AI Reply</Text>
            <View style={styles.card}>
              <Text style={styles.chatQuestion}>{message.question}</Text>
              <Text style={styles.chatAnswer}>{message.answer}</Text>
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Astrology Tools</Text>
          <View style={styles.card}>
            <Text style={styles.helperText}>Tap a tool only when you want that section. Each one makes its own provider call.</Text>
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
            {!endpointOptions.length ? <Text style={styles.helperText}>All optional astrology tools are loaded.</Text> : null}
          </View>
        </View>

        {optionalSections.map((section) => (
          section.rows.length > 0 ? (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.card}>
                {section.rows.map((row) => (
                  <InfoRow key={`${section.key}-${row.label}`} label={row.label} value={row.value} icon="globe" />
                ))}
              </View>
            </View>
          ) : null
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
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: SPACING.sm,
  },
  aiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  aiButtonSparkOn: {
    transform: [{ scale: 1.1 }],
    shadowColor: COLORS.accent,
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
  heroCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#F6D4B8',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    maxWidth: '80%',
  },
  heroSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  heroBadge: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  optionChip: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  optionChipActive: {
    backgroundColor: `${COLORS.primary}12`,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.primary}14`,
  },
  errorText: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: SPACING.sm,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  secondaryCtaButton: {
    marginTop: SPACING.sm,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  secondaryCtaButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  questionInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
    textAlignVertical: 'top',
    backgroundColor: '#FFFDF9',
  },
  askButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  askButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  inlineErrorText: {
    color: COLORS.error,
    marginTop: SPACING.sm,
    fontSize: 13,
  },
  chatQuestion: {
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  chatAnswer: {
    color: COLORS.text,
    lineHeight: 22,
  },
  endpointGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  endpointChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}35`,
  },
  endpointChipText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomPadding: {
    height: SPACING.xl,
  },
});
