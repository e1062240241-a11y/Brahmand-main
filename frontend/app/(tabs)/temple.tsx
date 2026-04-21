import React, { useState, useCallback, useEffect } from 'react';
import { 
 View, 
 Text, 
 StyleSheet, 
 ScrollView, 
 TouchableOpacity, 
 RefreshControl,
 FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTemples } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const TABS = ['Nearby', 'Aarti', 'Volunteers', 'Events', 'Donations'];

const DEFAULT_TEMPLE_LOCATIONS: Record<string, string> = {
 'ISKCON Mira Road': 'Mira Road, Thane',
 'Shirdi Sai Baba Temple': 'Shirdi, Maharashtra',
};

const AARTI_TAB_SESSIONS: Array<{ title: string; time: string }> = [];

const getSpecialTempleKey = (name: string) => {
 const normalizedName = String(name || '').toLowerCase();
 if (
 normalizedName.includes('mira road') ||
 normalizedName.includes('iskcon mira') ||
 normalizedName.includes('radhagiridhari') ||
 normalizedName.includes('iskcon borivali') ||
 normalizedName.includes('iskon borivali') ||
 normalizedName.includes('borivali') ||
 normalizedName.includes('brovali')
 ) {
 return 'ISKCON Mira Road';
 }
 if (
 normalizedName.includes('shirdi') ||
 normalizedName.includes('sai baba') ||
 normalizedName.includes('saibaba') ||
 normalizedName.includes('samadhi') ||
 normalizedName.includes('sai baba samadhi') ||
 normalizedName.includes('sai baba mandir')
 ) {
 return 'Shirdi Sai Baba Temple';
 }
 return '';
};

const getTempleDisplayName = (item: any) => {
 const specialKey = getSpecialTempleKey(item?.name);
 return specialKey || item?.name || 'Temple';
};

const getTempleDeityLabel = (item: any) => {
 const specialKey = getSpecialTempleKey(item?.name);
 if (specialKey === 'ISKCON Mira Road') return 'Lord RadhaKrishn';
 if (specialKey === 'Shirdi Sai Baba Temple') return 'Sai Baba';
 return item?.deity || 'Temple';
};

const getTempleAartiText = (item: any) => {
 return null;
};

export default function TempleScreen() {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState('Nearby');
 const [temples, setTemples] = useState<any[]>([]);
 const [refreshing, setRefreshing] = useState(false);

 const getTempleLocation = (item: any) => {
 const location = item?.location;
 const specialKey = getSpecialTempleKey(item?.name);
 if (!location || (typeof location === 'object' && Object.keys(location).length === 0)) {
 if (specialKey) {
 return DEFAULT_TEMPLE_LOCATIONS[specialKey];
 }
 return DEFAULT_TEMPLE_LOCATIONS[item?.name] || 'Location';
 }
 if (typeof location === 'string') return location;
 const fallback = [location.area, location.city, location.state, location.country]
 .filter(Boolean)
 .join(', ');
 if (fallback) return fallback;
 if (specialKey) {
 return DEFAULT_TEMPLE_LOCATIONS[specialKey];
 }
 return Object.values(location || {})
 .filter((value) => typeof value === 'string' && value.trim())
 .join(', ') || DEFAULT_TEMPLE_LOCATIONS[item?.name] || 'Location';
 };

 const fetchData = useCallback(async () => {
 try {
 const res = await getTemples();
 setTemples(res.data || []);
 } catch (error) {
 console.error('Error fetching temples:', error);
 } finally {
 setRefreshing(false);
 }
 }, []);

 useEffect(() => {
 fetchData();
 }, [fetchData]);

 const renderTemple = ({ item }: { item: any }) => (
 <TouchableOpacity 
 style={styles.templeCard}
 onPress={() => router.push(`/temple/${item.id}`)}
 >
 <View style={styles.templeIcon}>
 <Ionicons name="home" size={28} color={COLORS.primary} />
 </View>
 <View style={styles.templeInfo}>
 <Text style={styles.templeName}>{getTempleDisplayName(item)}</Text>
 <View style={styles.locationRow}>
 <Ionicons name="location" size={14} color={COLORS.textSecondary} />
 <Text style={styles.templeLocation} numberOfLines={1}>
 {getTempleLocation(item)}
 </Text>
 </View>
 <Text style={styles.templeDeity}>{getTempleDeityLabel(item)}</Text>
 {getTempleAartiText(item) ? (
 <Text style={styles.templeSchedule}>{getTempleAartiText(item)}</Text>
 ) : null}
 </View>
 {item.is_verified && (
 <View style={styles.verifiedBadge}>
 <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
 </View>
 )}
 <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
 </TouchableOpacity>
 );

 return (
 <View style={styles.container}>
 {/* Top Tabs */}
 <View style={styles.tabsContainer}>
 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
 {TABS.map((tab) => (
 <TouchableOpacity
 key={tab}
 style={[styles.tab, activeTab === tab && styles.tabActive]}
 onPress={() => setActiveTab(tab)}
 >
 <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
 {tab}
 </Text>
 </TouchableOpacity>
 ))}
 </ScrollView>
 <View style={styles.headerActions}>
 <TouchableOpacity style={styles.headerIcon}>
 <Ionicons name="search" size={22} color={COLORS.text} />
 </TouchableOpacity>
 <TouchableOpacity style={styles.headerIcon}>
 <Ionicons name="filter" size={22} color={COLORS.text} />
 </TouchableOpacity>
 </View>
 </View>

 {activeTab === 'Aarti' ? (
 <View style={styles.section} />
 ) : (
 <View>
 {/* Live Mantra Jaap Banner */}
 <TouchableOpacity 
 style={styles.liveMantraButton}
 onPress={() => router.push('/mantra-jaap' as any)}
 >
 <View style={styles.liveMantraContent}>
 <View style={styles.liveMantraIconWrap}>
 <Ionicons name="radio" size={28} color={COLORS.primary} />
 </View>
 <View style={styles.liveMantraTextContainer}>
 <View style={styles.liveMantraHeaderRow}>
 <Text style={styles.liveMantraTitle}>Live Mantra Jaap</Text>
 <View style={styles.liveBadge}>
 <View style={styles.liveDot} />
 <Text style={styles.liveBadgeText}>Live</Text>
 </View>
 </View>
 <Text style={styles.liveMantraSubtitle}>Join the active chanting room from Temple tab</Text>
 <Text style={styles.liveMantraMeta}>1.2k devotees chanting right now</Text>
 </View>
 <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
 </View>
 </TouchableOpacity>

 {/* Temple List */}
 <FlatList
 data={temples}
 renderItem={renderTemple}
 keyExtractor={(item) => item.id}
 contentContainerStyle={styles.listContent}
 refreshControl={
 <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
 }
 ListEmptyComponent={
 <View style={styles.emptyState}>
 <Ionicons name="home-outline" size={48} color={COLORS.textLight} />
 <Text style={styles.emptyText}>No temples found nearby</Text>
 </View>
 }
 />
 </View>
 )}
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: COLORS.background,
 },
 tabsContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 paddingVertical: SPACING.sm,
 },
 tab: {
 paddingHorizontal: SPACING.md,
 paddingVertical: SPACING.sm,
 marginLeft: SPACING.sm,
 borderRadius: 20,
 },
 tabActive: {
 backgroundColor: `${COLORS.primary}15`,
 },
 tabText: {
 fontSize: 14,
 color: COLORS.textSecondary,
 fontWeight: '500',
 },
 tabTextActive: {
 color: COLORS.primary,
 fontWeight: '600',
 },
 headerActions: {
 flexDirection: 'row',
 paddingRight: SPACING.md,
 },
 headerIcon: {
 padding: SPACING.xs,
 marginLeft: SPACING.sm,
 },
 listContent: {
 padding: SPACING.md,
 },
 templeCard: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 padding: SPACING.md,
 borderRadius: 16,
 marginBottom: 12,
 },
 templeIcon: {
 width: 56,
 height: 56,
 borderRadius: 12,
 backgroundColor: `${COLORS.primary}15`,
 justifyContent: 'center',
 alignItems: 'center',
 marginRight: SPACING.md,
 },
 templeInfo: {
 flex: 1,
 },
 templeName: {
 fontSize: 16,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: 4,
 },
 locationRow: {
 flexDirection: 'row',
 alignItems: 'center',
 marginBottom: 2,
 },
 templeLocation: {
 fontSize: 13,
 color: COLORS.textSecondary,
 marginLeft: 6,
 flexShrink: 1,
 },
 templeDeity: {
 fontSize: 12,
 color: COLORS.textLight,
 marginTop: 2,
 },
 templeSchedule: {
 fontSize: 12,
 color: COLORS.textSecondary,
 marginTop: 4,
 },
 verifiedBadge: {
 marginRight: SPACING.sm,
 },
 emptyState: {
 alignItems: 'center',
 paddingVertical: SPACING.xl * 2,
 },
 emptyText: {
 fontSize: 16,
 color: COLORS.textSecondary,
 marginTop: SPACING.md,
 },
 section: {
 backgroundColor: COLORS.surface,
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 padding: SPACING.md,
 borderRadius: BORDER_RADIUS.lg,
 },
 sectionTitle: {
 fontSize: 16,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: SPACING.md,
 },
 aartiTabCard: {
 width: '100%',
 backgroundColor: COLORS.surface,
 borderRadius: BORDER_RADIUS.md,
 padding: SPACING.lg,
 marginBottom: SPACING.sm,
 borderWidth: 1,
 borderColor: COLORS.border,
 justifyContent: 'center',
 },
 aartiTabLabel: {
 fontSize: 20,
 color: COLORS.text,
 fontWeight: '700',
 },
 aartiTabHint: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginBottom: SPACING.sm,
 },
 aartiSection: {
 backgroundColor: `${COLORS.primary}08`,
 },
 // Live Mantra Jaap Button
 liveMantraButton: {
 marginHorizontal: SPACING.md,
 marginTop: SPACING.md,
 marginBottom: SPACING.sm,
 borderWidth: 2,
 borderColor: COLORS.primary,
 borderStyle: 'dashed',
 borderRadius: BORDER_RADIUS.lg,
 backgroundColor: `${COLORS.primary}08`,
 },
 liveMantraContent: {
 flexDirection: 'row',
 alignItems: 'flex-start',
 padding: SPACING.md,
 gap: SPACING.md,
 },
 liveMantraIconWrap: {
 width: 52,
 height: 52,
 borderRadius: 16,
 backgroundColor: `${COLORS.primary}15`,
 alignItems: 'center',
 justifyContent: 'center',
 },
 liveMantraTextContainer: {
 flex: 1,
 },
 liveMantraHeaderRow: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: SPACING.sm,
 },
 liveMantraTitle: {
 fontSize: 18,
 fontWeight: '700',
 color: COLORS.primary,
 },
 liveMantraSubtitle: {
 fontSize: 12,
 color: COLORS.textSecondary,
 marginTop: 2,
 },
 liveMantraMeta: {
 fontSize: 12,
 color: COLORS.text,
 marginTop: 6,
 fontWeight: '600',
 },
 liveBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 6,
 paddingHorizontal: 10,
 paddingVertical: 4,
 borderRadius: BORDER_RADIUS.full,
 backgroundColor: `${COLORS.error}14`,
 },
 liveDot: {
 width: 8,
 height: 8,
 borderRadius: 4,
 backgroundColor: COLORS.error,
 },
 liveBadgeText: {
 fontSize: 11,
 fontWeight: '700',
 color: COLORS.error,
 textTransform: 'uppercase',
 },
});