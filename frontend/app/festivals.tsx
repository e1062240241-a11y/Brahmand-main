import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';

const getFestivalImageUrl = (festivalName: string) => {
  const cleanedName = festivalName.replace(/[\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
  const tags = [...cleanedName.split(' '), 'festival']
    .map((tag) => encodeURIComponent(tag))
    .join(',');
  return `https://source.unsplash.com/200x200/?${tags}`;
};

const getFestivalInitials = (festivalName: string) => {
  return festivalName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
};

const FestivalPage = () => {
  const router = useRouter();
  const [festivals, setFestivals] = useState<any[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
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

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Festivals</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Festival Names</Text>
          <View style={styles.listContainer}>
            {festivals.map((festival, index) => {
              const festivalName = festival.name || festival.festival_name;

              return (
                <TouchableOpacity
                  key={festivalName}
                  style={styles.listItem}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/festival-detail?index=${index}`)}
                >
                  <View style={styles.listItemRow}>
                    {failedImages[festivalName] ? (
                      <View style={styles.festivalPlaceholder}>
                        <Text style={styles.placeholderText}>
                          {getFestivalInitials(festivalName)}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: getFestivalImageUrl(festivalName) }}
                        style={styles.festivalImage}
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [festivalName]: true,
                          }))
                        }
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.listItemTextContainer}>
                      <Text style={styles.listItemText}>
                        {festivalName}
                      </Text>
                      <Text style={styles.listItemDate}>{festival.date}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: SPACING.md,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    color: '#111827',
  },
  listContainer: {
    marginBottom: SPACING.md,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  listItemText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  listItemTextActive: {
    color: COLORS.primary,
  },
  listItemDate: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 12,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  festivalImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: SPACING.sm,
    backgroundColor: '#F3F4F6',
  },
  festivalPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: SPACING.sm,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  listItemTextContainer: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    color: '#111827',
  },
  detailMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  emptyDetail: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F3F4F6',
  },
  emptyDetailText: {
    color: '#6B7280',
  },
});

export default FestivalPage;
