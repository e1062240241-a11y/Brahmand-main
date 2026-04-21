import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getTemple, getTemplePosts, followTemple, unfollowTemple } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const DEFAULT_TEMPLE_LOCATIONS: Record<string, string> = {
 'ISKCON Mira Road': 'Mira Road, Thane',
 'Shirdi Sai Baba Temple': 'Shirdi, Maharashtra',
 'ISKCON MiraRd': 'Mira Road, Thane',
 'MIRA ROAD': 'Mira Road, Thane',
};

const MIRA_ROAD_AARTI_SESSIONS = [
 { title: 'Mangala Aarti', time: '4:30 AM' },
 { title: 'Tulsi Puja', time: '5:00 AM - 5:15 AM' },
 { title: 'Sringar Darshan Aarti', time: '7:15 AM - 7:30 AM' },
 { title: 'Guru Puja', time: '7:25 AM - 7:45 AM' },
];

const SHIRDI_SAI_AARTI_SESSIONS = [
 { title: 'Mangala Aarti', time: '5:00 AM' },
 { title: 'Dwarkamai Aarti', time: '6:30 AM' },
 { title: 'Rajbhog Aarti', time: '11:30 AM' },
 { title: 'Dhoop Aarti', time: '5:00 PM' },
 { title: 'Shej Aarti', time: '10:30 PM' },
];

const MIRA_ROAD_LOCATION = { latitude: 19.2694199, longitude: 72.8716525 };
const SHIRDI_SAI_LOCATION = { latitude: 19.7661782, longitude: 74.4769973 };
const isWeb = Platform.OS === 'web';
const MIRA_ROAD_MAP_HTML = `
<html>
 <body style="margin: 0; padding: 0;">
 <iframe
 width="100%"
 height="100%"
 frameborder="0"
 style="border:0;"
 src="https://www.google.com/maps?q=19.2694199,72.8716525&output=embed"
 allowfullscreen
 />
 </body>
</html>`;

const SHIRDI_SAI_MAP_HTML = `
<html>
 <body style="margin: 0; padding: 0;">
 <iframe
 width="100%"
 height="100%"
 frameborder="0"
 style="border:0;"
 src="https://www.google.com/maps?q=19.7661782,74.4769973&output=embed"
 allowfullscreen
 />
 </body>
</html>`;

const getSpecialTempleKey = (name: string) => {
 const normalizedName = String(name || '').toLowerCase();
 if (
 normalizedName.includes('mira road') ||
 normalizedName.includes('iskcon mira') ||
 normalizedName.includes('iskon borivali') ||
 normalizedName.includes('iskcon borivali') ||
 normalizedName.includes('radhagiridhari') ||
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

const formatTempleLocation = (temple: any) => {
 const location = temple?.location;
 const specialKey = getSpecialTempleKey(temple?.name);
 if (!location || (typeof location === 'object' && Object.keys(location).length === 0)) {
 if (specialKey) {
 return DEFAULT_TEMPLE_LOCATIONS[specialKey];
 }
 return DEFAULT_TEMPLE_LOCATIONS[temple?.name] || 'Unknown location';
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
 .join(', ') || DEFAULT_TEMPLE_LOCATIONS[temple?.name] || 'Unknown location';
};

export default function TempleDetailScreen() {
 const { id } = useLocalSearchParams<{ id: string }>();
 const router = useRouter();
 const [temple, setTemple] = useState<any>(null);
 const [posts, setPosts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isFollowing, setIsFollowing] = useState(false);

 useEffect(() => {
 fetchTempleData();
 }, [id]);

 const fetchTempleData = async () => {
 try {
 const [templeRes, postsRes] = await Promise.all([
 getTemple(id!),
 getTemplePosts(id!).catch(() => ({ data: [] }))
 ]);
 setTemple(templeRes.data);
 setPosts(postsRes.data || []);
 setIsFollowing(templeRes.data?.is_following || false);
 } catch (error) {
 console.error('Error fetching temple:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleGoBack = () => {
 router.replace('/temple');
 };

 const handleFollowToggle = async () => {
 try {
 if (isFollowing) {
 await unfollowTemple(id!);
 } else {
 await followTemple(id!);
 }
 setIsFollowing(!isFollowing);
 } catch (error) {
 console.error('Error toggling follow:', error);
 }
 };

 if (loading) {
 return (
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color={COLORS.primary} />
 </View>
 );
 }

 if (!temple) {
 return (
 <SafeAreaView style={styles.container}>
 <View style={styles.header}>
 <TouchableOpacity onPress={handleGoBack}>
 <Ionicons name="arrow-back" size={24} color={COLORS.text} />
 </TouchableOpacity>
 </View>
 <View style={styles.errorContainer}>
 <Ionicons name="alert-circle" size={48} color={COLORS.textLight} />
 <Text style={styles.errorText}>Temple not found</Text>
 </View>
 </SafeAreaView>
 );
 }

 const getTempleAartiSessions = (timings: Record<string, string>, templeName: string) => {
 const order = ['morning', 'afternoon', 'evening'];
 const entries = Object.entries(timings || {}).filter(([, value]) => value);
 const ordered = order
 .map((key) => entries.find(([name]) => name.toLowerCase() === key))
 .filter(Boolean) as [string, string][];
 const rest = entries.filter(([name]) => !order.includes(name.toLowerCase()));
 const sessions = [...ordered, ...rest];
 if (sessions.length > 0) return sessions;

 const specialKey = getSpecialTempleKey(templeName);
 if (specialKey === 'ISKCON Mira Road') {
 return MIRA_ROAD_AARTI_SESSIONS.map(({ title, time }) => [title, time] as [string, string]);
 }
 if (specialKey === 'Shirdi Sai Baba Temple') {
 return SHIRDI_SAI_AARTI_SESSIONS.map(({ title, time }) => [title, time] as [string, string]);
 }
 return [];
 };


 const aartiSessions = getTempleAartiSessions(temple.aarti_timings || {}, temple.name);
 const templeKey = getSpecialTempleKey(temple.name);
 const isMiraRoadTemple = templeKey === 'ISKCON Mira Road';
 const isShirdiTemple = templeKey === 'Shirdi Sai Baba Temple';
 const displayName = templeKey || temple.name || 'Temple';

 const openTempleLocation = () => {
 const url = isMiraRoadTemple
 ? `https://www.google.com/maps/search/?api=1&query=${MIRA_ROAD_LOCATION.latitude},${MIRA_ROAD_LOCATION.longitude}`
 : isShirdiTemple
 ? `https://www.google.com/maps/search/?api=1&query=${SHIRDI_SAI_LOCATION.latitude},${SHIRDI_SAI_LOCATION.longitude}`
 : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${temple.name} ${formatTempleLocation(temple)}`)}`;
 Linking.openURL(url).catch((error) => {
 console.warn('Unable to open map URL', error);
 });
 };

 const getTempleDescription = () => {
 if (isMiraRoadTemple) {
 return 'Shri Radhagiridhari Mandir, ISKCON Mira Road is a vibrant spiritual temple dedicated to Radha and Giridhari, offering daily worship, bhajans, classes, and community service. The temple is known for its peaceful atmosphere, devotional programs, vegetarian prasadam, and regular festivals celebrating Krishna consciousness. Visitors can take part in congregational chanting, scripture study, and cultural programs organized for families and children.';
 }
 if (isShirdiTemple) {
 return 'Shri Sai Baba Samadhi Mandir in Shirdi is a revered pilgrimage center built around the final resting place of Shirdi Sai Baba. The temple complex draws devotees from across India for daily darshan, sacred aarti ceremonies, and prasadam distribution, and it includes the nearby Dwarkamai and Chavadi sites associated with Sai Baba’s life.';
 }
 return temple.description;
 };

 const getTempleGuidance = () => {
 if (isMiraRoadTemple) {
 return 'Guidance: To reach ISKCON Mira Road, travel to Mira Road station and take a short taxi or auto-rickshaw ride toward Elderao Nagar. The temple is located near Radha Girdhari Mandir, close to the Mira Road bus depot and main Mira Bhayandar road. From Thane, use the Dahisar–Mira Road route; from Bhayandar, follow the highway toward Mira Road. Parking is available nearby and the temple is well signposted from local landmarks.';
 }
 if (isShirdiTemple) {
 return 'Guidance: To reach Shirdi Sai Baba Temple, arrive at Shirdi railway station or Shirdi airport and take a short taxi or auto-rickshaw to the main temple complex. The Samadhi Mandir is located in central Shirdi near the main road, and marked local signs guide visitors to the temple, Dwarkamai, and Chavadi. During festivals, allow extra time for darshan and follow the designated queues and visitor lanes.';
 }
 return '';
 };

 const templeDescription = getTempleDescription();
 const templeGuidance = getTempleGuidance();
 return (
 <SafeAreaView style={styles.container}>
 {/* Header */}
 <View style={styles.header}>
 <TouchableOpacity onPress={handleGoBack}>
 <Ionicons name="arrow-back" size={24} color={COLORS.text} />
 </TouchableOpacity>
 <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
 <TouchableOpacity onPress={handleFollowToggle}>
 <Ionicons 
 name={isFollowing ? "notifications" : "notifications-outline"} 
 size={24} 
 color={isFollowing ? COLORS.primary : COLORS.text} 
 />
 </TouchableOpacity>
 </View>

 <ScrollView showsVerticalScrollIndicator={false}>
 {/* Temple Info Card */}
 <View style={styles.infoCard}>
 <View style={styles.templeIconLarge}>
 <Ionicons name="home" size={40} color={COLORS.primary} />
 </View>
 <Text style={styles.templeName}>{displayName}</Text>
 {temple.deity && <Text style={styles.templeDeity}>{temple.deity}</Text>}
 <TouchableOpacity style={styles.locationCard} onPress={openTempleLocation} activeOpacity={0.8}>
 <View style={styles.locationRow}>
 <Ionicons name="location" size={16} color={COLORS.primary} />
 <Text style={styles.locationText}>
 {formatTempleLocation(temple)}
 </Text>
 </View>
 </TouchableOpacity>
 {temple.is_verified && (
 <View style={styles.verifiedBadge}>
 <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
 <Text style={styles.verifiedText}>Verified Temple</Text>
 </View>
 )}
 </View>

 {/* Aarti */}
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Aarti</Text>
 {aartiSessions.length === 0 ? (
 <Text style={styles.noPostsText}>No aarti updates yet</Text>
 ) : (
 <>
 {isMiraRoadTemple && (
 <Text style={styles.morningAartiText}>Morning Aarti</Text>
 )}
 <View style={styles.aartiGrid}>
 {aartiSessions.map(([key, value]) => (
 <View key={key} style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
 <Text style={styles.aartiTime}>{value}</Text>
 </View>
 ))}
 </View>
 {isMiraRoadTemple && (
 <>
 <Text style={styles.afternoonAartiText}>Afternoon Aarti</Text>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Raj Bhoga Aarti</Text>
 <Text style={styles.aartiTime}>12:30 PM</Text>
 </View>
 <Text style={styles.eveningAartiText}>Evening Aarti</Text>
 <View style={styles.aartiGrid}>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Usthapana Aarti</Text>
 <Text style={styles.aartiTime}>4:15 PM - 4:30 PM</Text>
 </View>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Sandhya Aarti</Text>
 <Text style={styles.aartiTime}>7:00 PM</Text>
 </View>
 <View style={styles.aartiCard}>
 <Text style={styles.aartiLabel}>Shayana Aarti</Text>
 <Text style={styles.aartiTime}>8:30 PM - 9:00 PM</Text>
 </View>
 </View>
 </>
 )}
 </>
 )}
 </View>

 {/* Description */}
 {(isMiraRoadTemple || isShirdiTemple) ? (
 <>
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Description</Text>
 {templeDescription ? (
 <Text style={styles.descriptionText}>{templeDescription}</Text>
 ) : (
 <Text style={styles.noPostsText}>No description yet</Text>
 )}
 </View>
 {templeGuidance ? (
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Guidance</Text>
 <Text style={styles.descriptionText}>{templeGuidance}</Text>
 </View>
 ) : null}
 {(isMiraRoadTemple || isShirdiTemple) && (
 <View style={styles.mapSection}>
 <Text style={styles.sectionTitle}>Location</Text>
 <TouchableOpacity style={styles.mapWrapper} onPress={openTempleLocation} activeOpacity={0.9}>
 {isWeb ? (
 <iframe
 title={isMiraRoadTemple ? 'ISKCON Mira Road' : 'Shirdi Sai Baba Temple'}
 src={isMiraRoadTemple ? `https://www.google.com/maps?q=19.2694199,72.8716525&output=embed` : `https://www.google.com/maps?q=19.7661782,74.4769973&output=embed`}
 style={styles.mapBox}
 frameBorder="0"
 allowFullScreen
 />
 ) : (
 <WebView
 source={{ html: isMiraRoadTemple ? MIRA_ROAD_MAP_HTML : SHIRDI_SAI_MAP_HTML }}
 style={styles.mapBox}
 scrollEnabled={false}
 originWhitelist={["*"]}
 pointerEvents="none"
 />
 )}
 <View style={styles.mapOverlay}>
 <Text style={styles.mapOverlayText}>Tap to open map</Text>
 </View>
 </TouchableOpacity>
 </View>
 )}
 </>
 ) : (
 templeDescription && (
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>About</Text>
 <Text style={styles.descriptionText}>{templeDescription}</Text>
 </View>
 )
 )}

 </ScrollView>
 </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: COLORS.background,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: COLORS.background,
 },
 errorContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 },
 errorText: {
 fontSize: 16,
 color: COLORS.textSecondary,
 marginTop: SPACING.md,
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
 fontSize: 18,
 fontWeight: '600',
 color: COLORS.text,
 marginHorizontal: SPACING.md,
 textAlign: 'center',
 },
 infoCard: {
 backgroundColor: COLORS.surface,
 margin: SPACING.md,
 padding: SPACING.lg,
 borderRadius: BORDER_RADIUS.lg,
 alignItems: 'center',
 },
 templeIconLarge: {
 width: 80,
 height: 80,
 borderRadius: 40,
 backgroundColor: `${COLORS.primary}15`,
 justifyContent: 'center',
 alignItems: 'center',
 marginBottom: SPACING.md,
 },
 templeName: {
 fontSize: 22,
 fontWeight: '700',
 color: COLORS.text,
 textAlign: 'center',
 },
 templeDeity: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginTop: SPACING.xs,
 },
 locationCard: {
 backgroundColor: COLORS.surface,
 borderRadius: BORDER_RADIUS.md,
 padding: SPACING.md,
 marginTop: SPACING.sm,
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 locationRow: {
 flexDirection: 'row',
 alignItems: 'center',
 },
 locationText: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginLeft: SPACING.xs,
 },
 verifiedBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: `${COLORS.success}15`,
 paddingHorizontal: SPACING.md,
 paddingVertical: SPACING.xs,
 borderRadius: 20,
 marginTop: SPACING.md,
 },
 verifiedText: {
 fontSize: 12,
 color: COLORS.success,
 fontWeight: '600',
 marginLeft: SPACING.xs,
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
 timingRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 paddingVertical: SPACING.xs,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 },
 timingLabel: {
 fontSize: 14,
 color: COLORS.textSecondary,
 },
 timingValue: {
 fontSize: 14,
 color: COLORS.text,
 fontWeight: '500',
 },
 aartiGrid: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 marginHorizontal: -SPACING.sm / 2,
 },
 aartiCard: {
 width: '48%',
 backgroundColor: COLORS.background,
 borderRadius: BORDER_RADIUS.md,
 padding: SPACING.md,
 margin: SPACING.sm / 2,
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 aartiLabel: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginBottom: SPACING.xs,
 textTransform: 'capitalize',
 },
 aartiTime: {
 fontSize: 16,
 color: COLORS.text,
 fontWeight: '700',
 },
 morningAartiText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '600',
 marginBottom: SPACING.sm,
 },
 afternoonAartiText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '600',
 marginTop: SPACING.sm,
 textAlign: 'left',
 },
 afternoonAartiDetailText: {
 fontSize: 13,
 color: COLORS.textSecondary,
 marginTop: SPACING.xs,
 textAlign: 'left',
 },
 eveningAartiText: {
 fontSize: 14,
 color: COLORS.primary,
 fontWeight: '600',
 marginTop: SPACING.sm,
 textAlign: 'left',
 },
 usthapanaAartiText: {
 fontSize: 13,
 color: COLORS.textSecondary,
 marginTop: SPACING.xs,
 textAlign: 'left',
 },
 descriptionText: {
 fontSize: 14,
 color: COLORS.textSecondary,
 lineHeight: 22,
 },
 mapSection: {
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 },
 mapWrapper: {
 width: '100%',
 height: 180,
 borderRadius: BORDER_RADIUS.lg,
 overflow: 'hidden',
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 mapBox: {
 width: '100%',
 height: '100%',
 backgroundColor: COLORS.background,
 },
 mapOverlay: {
 position: 'absolute',
 bottom: 0,
 left: 0,
 right: 0,
 padding: SPACING.sm,
 backgroundColor: `${COLORS.background}CC`,
 },
 mapOverlayText: {
 fontSize: 12,
 color: COLORS.textSecondary,
 textAlign: 'center',
 },
 noPostsText: {
 fontSize: 14,
 color: COLORS.textLight,
 textAlign: 'center',
 paddingVertical: SPACING.md,
 },
 postCard: {
 backgroundColor: COLORS.background,
 padding: SPACING.md,
 borderRadius: BORDER_RADIUS.md,
 marginBottom: SPACING.sm,
 },
 postTitle: {
 fontSize: 15,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: SPACING.xs,
 },
 postContent: {
 fontSize: 14,
 color: COLORS.textSecondary,
 lineHeight: 20,
 },
 postDate: {
 fontSize: 12,
 color: COLORS.textLight,
 marginTop: SPACING.sm,
 },
});