import { Avatar } from '../Avatar';
import HomeFeedTabs from '../HomeFeedTabs';
import UiverseNotifyButton from '../UiverseNotifyButton';
import { FONTS } from '../../constants/theme';
import { formatTime } from '../../features/live-mantra/schedule';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useRouter } from 'expo-router';
import { Animated, AppState, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './home.styles';
import { PAGE_PADDING, baseQuickAccess, formatFestivalDate, shivaImage } from './homeConstants';
import { ActionCardsRow } from './ActionCardsRow';
import { scheduleShravanKatha15MinReminder } from '../../services/pushNotifications';

const DynamicEventBadge = React.memo(function DynamicEventBadge({
    eventStatus,
    targetLiveTime,
}: {
    eventStatus: 'upcoming' | 'starting_soon' | 'live' | 'between_streams' | 'ended' | 'campaign_completed';
    targetLiveTime?: Date;
}) {
    const isLive = eventStatus === 'live';
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const pulseOpacity = React.useRef(new Animated.Value(0.4)).current;
    const [timeLeftStr, setTimeLeftStr] = React.useState<string>('');

    const hasFiredImpression = React.useRef(false);

    // Track Single Impression Analytics on mount
    React.useEffect(() => {
        if (!hasFiredImpression.current) {
            hasFiredImpression.current = true;
            if (__DEV__) {
                console.log(`[Analytics] banner_impression fired for eventStatus: ${eventStatus}`);
            }
        }
    }, [eventStatus]);

    // Force real-time recalculation on App Background -> Foreground transition
    const [, setAppStateTick] = React.useState(0);
    React.useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                setAppStateTick((prev) => prev + 1);
            }
        });
        return () => subscription.remove();
    }, []);

    // Real-time Countdown Interval for upcoming / starting_soon / between_streams states
    React.useEffect(() => {
        if (isLive || eventStatus === 'ended' || eventStatus === 'campaign_completed' || !targetLiveTime) {
            setTimeLeftStr('');
            return;
        }

        const updateTimer = () => {
            const now = new Date();
            const diffMs = targetLiveTime.getTime() - now.getTime();

            if (diffMs <= 0) {
                setTimeLeftStr('00:00');
                return;
            }

            const totalSecs = Math.floor(diffMs / 1000);
            const hours = Math.floor(totalSecs / 3600);
            const minutes = Math.floor((totalSecs % 3600) / 60);

            const pad = (n: number) => n.toString().padStart(2, '0');
            if (hours > 0) {
                setTimeLeftStr(`${pad(hours)}h ${pad(minutes)}m`);
            } else {
                setTimeLeftStr(`${pad(minutes)}m`);
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [eventStatus, isLive, targetLiveTime]);

    // Live Pulse Animation Loop
    React.useEffect(() => {
        if (!isLive) return;
        const loop = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(pulseOpacity, {
                        toValue: 0.05,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0.4,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isLive, pulseAnim, pulseOpacity]);

    let badgeBg = 'rgba(216, 90, 0, 0.9)';
    let badgeBorder = 'rgba(255, 215, 0, 0.5)';
    let badgeText = timeLeftStr ? `Starts in ${timeLeftStr}` : 'FREE REGISTRATION';
    let badgeIcon = timeLeftStr ? '⏰' : '🔱';

    if (eventStatus === 'live') {
        return null;
    } else if (eventStatus === 'starting_soon') {
        badgeBg = '#E65100';
        badgeBorder = 'rgba(255, 235, 59, 0.8)';
        badgeText = timeLeftStr ? `STARTING SOON (${timeLeftStr})` : 'STARTING SOON';
        badgeIcon = '🔴';
    } else if (eventStatus === 'between_streams') {
        badgeBg = 'rgba(30, 25, 20, 0.88)';
        badgeBorder = '#FFD700';
        badgeText = timeLeftStr ? `Next Live in ${timeLeftStr}` : 'REPLAY AVAILABLE';
        badgeIcon = '📺';
    } else if (eventStatus === 'campaign_completed' || eventStatus === 'ended') {
        badgeBg = 'rgba(40, 40, 40, 0.85)';
        badgeBorder = 'rgba(255, 215, 0, 0.4)';
        badgeText = 'SHRAVAN KATHA COMPLETED';
        badgeIcon = '🕉';
    }

    return (
        <View
            pointerEvents="none"
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 10,
            }}
        >
            <Text
                style={{
                    color: '#FFD700',
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 0.3,
                    textShadowColor: 'rgba(0, 0, 0, 0.9)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                }}
            >
                {badgeIcon} {badgeText}
            </Text>
        </View>
    );
});

export const HomeHeaderComponent = React.memo(function HomeHeaderComponent({
    user,
    firstName,
    avatarUri,
    unreadCount,
    nextFestival,
    t,
    searchActive,
    setSearchActive,
    searchTerm,
    setSearchTerm,
    hashtagResults,
    loadingHashtags,
    searchResults,
    loadingUsers,
    followingIds,
    handleFollowUser,
    saveRecentSearch,
    recentSearches,
    setRecentSearches,
    reminders,
    handleSetReminder,
    handleLiveJaapNavigation,
    handleNotificationPress,
    setShowProfileActions,
    hanumanStatus,
    shivaStatus,
    hanumanChantCount,
    shivaChantCount,
    safeCommunityRequests,
    activeTab,
    setActiveTab,
    setShowUploadPostModal,
    activeFeatureIndex,
    setActiveFeatureIndex,
    activeBannerIndex,
    setActiveBannerIndex,
    screenWidth,
    featureSnapInterval,
    featureCardWidth,
    featureCardHeight,
    cityId,
    cityName,
    cityMembers,
    localId,
    localSubgroup,
    realGroupName,
    localMembers,
    topFeaturesScrollRef,
    topFeaturesAutoScrollIndex,
    bannerScrollRef,
}: {
    user: any;
    firstName: string;
    avatarUri?: string;
    unreadCount: number;
    nextFestival: any;
    t: (key: string) => string;
    searchActive: boolean;
    setSearchActive: (v: boolean) => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    hashtagResults: any[];
    loadingHashtags: boolean;
    searchResults: any[];
    loadingUsers: boolean;
    followingIds: string[];
    handleFollowUser: (id: string) => void;
    saveRecentSearch: (item: any) => void;
    recentSearches: any[];
    setRecentSearches: (v: any[]) => void;
    reminders: Record<string, boolean>;
    handleSetReminder: (mantraType: string, sessionName: string) => void;
    handleLiveJaapNavigation: (mantraType: string, title: string) => void;
    handleNotificationPress: () => void;
    setShowProfileActions: (v: boolean) => void;
    hanumanStatus: any;
    shivaStatus: any;
    hanumanChantCount: number;
    shivaChantCount: number;
    safeCommunityRequests: any[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setShowUploadPostModal: (v: boolean) => void;
    activeFeatureIndex: number;
    setActiveFeatureIndex: (v: number) => void;
    activeBannerIndex: number;
    setActiveBannerIndex: (v: number) => void;
    screenWidth: number;
    featureSnapInterval: number;
    featureCardWidth: number;
    featureCardHeight: number;
    cityId: any;
    cityName: string;
    cityMembers: number;
    localId: any;
    localSubgroup: string;
    realGroupName: string;
    localMembers: number;
    topFeaturesScrollRef: any;
    topFeaturesAutoScrollIndex: any;
    bannerScrollRef: any;
}) {
    const router = useRouter();
    return (
        <View style={{ paddingTop: 4 }}>

            {/* Feed loading state is now handled inside FeedSection */}
            <View>
                <View style={styles.upperContentWrapper}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity
                                activeOpacity={0.86}
                                style={styles.profileButton}
                                onPress={() => router.push('/(tabs)/profile')}
                                onLongPress={() => setShowProfileActions(true)}
                            >
                                <Avatar name={firstName} photo={avatarUri} size={Platform.OS === 'android' ? 42 : 55} />
                            </TouchableOpacity>
                        </View>

                        <View style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: -1,
                        }} pointerEvents="none">
                            <Text style={{
                                color: '#000',
                                textAlign: 'center',
                                fontFamily: FONTS.brandTitle, // LOCKED: Brand typography identity
                                fontSize: Platform.OS === 'android' ? 26 : 28,
                                fontStyle: 'normal',
                                fontWeight: '400',
                                lineHeight: Platform.OS === 'android' ? 32 : 36,
                                letterSpacing: 0,
                            }}>BRAHMAND</Text>
                        </View>

                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.headerIconButton}
                                onPress={() => setSearchActive(!searchActive)}
                            >
                                <Ionicons name={searchActive ? "close-outline" : "search-outline"} size={Platform.OS === 'android' ? 22 : 24} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.headerIconButton}
                                onPress={handleNotificationPress}
                            >
                                <View>
                                    <Ionicons name="notifications-outline" size={Platform.OS === 'android' ? 22 : 24} color="#000" />
                                    {(unreadCount > 0 || (!!nextFestival && (nextFestival.days_until === 0 || nextFestival.days_until === 1))) && <View style={styles.notificationDot} />}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {nextFestival && (nextFestival.days_until === 0 || nextFestival.days_until === 1) && (
                        <TouchableOpacity
                            style={styles.festivalAlertCard}
                            activeOpacity={0.9}
                            onPress={() => router.push('/festivals')}
                        >
                            <View style={styles.festivalAlertIcon}>
                                <Ionicons name="notifications-outline" size={18} color="#FFF" />
                            </View>
                            <View style={styles.festivalAlertTextWrapper}>
                                <Text style={styles.festivalAlertTitle}>{t('festivalReminder')}</Text>
                                <Text style={styles.festivalAlertSubtitle} numberOfLines={2}>
                                    {nextFestival.days_until === 0
                                        ? `${nextFestival.name} ${t('isTodayClick')}`
                                        : `${nextFestival.name} ${t('isTomorrowClick')} (${formatFestivalDate(nextFestival.date)})`}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    )}

                    {searchActive ? (
                        <View style={styles.searchPanel}>
                            <View style={styles.searchBar}>
                                <Ionicons name="search" size={18} color="#6F5C70" />
                                <TextInput
                                    style={styles.searchInput}
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    placeholder={t('recentSearchPlaceholder')}
                                    placeholderTextColor="#8E7D90"
                                    autoFocus
                                />
                            </View>
                            {searchTerm.trim().length > 0 ? (
                                <View style={styles.searchResultsSection}>
                                    {searchTerm.trim().startsWith('#') ? (
                                        loadingHashtags ? (
                                            <Text style={styles.searchStatusText}>{t('loadingHashtags')}</Text>
                                        ) : hashtagResults.length > 0 ? (
                                            <TouchableOpacity
                                                style={styles.userResultItem}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    const hashtag = searchTerm.trim().replace(/^#+/, '');
                                                    router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
                                                }}
                                            >
                                                <View style={styles.hashtagIcon}>
                                                    <Ionicons name="pricetag" size={22} color="#8C36DB" />
                                                </View>
                                                <View style={styles.userResultText}>
                                                    <Text style={styles.userResultName}>#{searchTerm.trim().replace('#', '')}</Text>
                                                    <Text style={styles.userResultMeta}>{hashtagResults.length} posts</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.searchStatusText}>{t('noPostsHashtag')}</Text>
                                        )
                                    ) : loadingUsers ? (
                                        <Text style={styles.searchStatusText}>{t('loadingUsers')}</Text>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((item) => {
                                            const isFollowing = followingIds.includes(item.id);
                                            return (
                                                <View key={item.id} style={styles.userResultItem}>
                                                    <TouchableOpacity
                                                        style={styles.userResultContent}
                                                        activeOpacity={0.8}
                                                        onPress={() => {
                                                            saveRecentSearch(item);
                                                            router.push(`/profile/${item.id}`);
                                                        }}
                                                    >
                                                        <Avatar name={item.name || 'User'} photo={item.photo} size={42} />
                                                        <View style={styles.userResultText}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={styles.userResultName}>{item.name || 'Unknown'}</Text>
                                                                {item.is_verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
                                                            </View>
                                                            <Text style={styles.userResultMeta}>{item.sl_id || item.phone || ''}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.followButton, isFollowing && styles.followingButton]}
                                                        activeOpacity={0.8}
                                                        onPress={() => handleFollowUser(item.id)}
                                                    >
                                                        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                                            {isFollowing ? t('following') : t('follow')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })
                                    ) : (
                                        <Text style={styles.searchStatusText}>{t('noUsersFound')}</Text>
                                    )}
                                </View>
                            ) : recentSearches.length > 0 ? (
                                <View style={styles.recentSearchSection}>
                                    <View style={styles.recentSearchHeader}>
                                        <Text style={styles.recentSearchesTitle}>{t('recentSearchTitle')}</Text>
                                        <TouchableOpacity onPress={async () => {
                                            if (user?.id) {
                                                setRecentSearches([]);
                                                await AsyncStorage.removeItem(`recent_searches_${user.id}`);
                                            }
                                        }}>
                                            <Text style={styles.clearHistoryText}>{t('clearHistory')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.recentSearchList}
                                    >
                                        {recentSearches.map((item) => (
                                            <TouchableOpacity
                                                key={`recent-${item.id}`}
                                                style={styles.recentSearchItem}
                                                activeOpacity={0.7}
                                                onPress={() => router.push(`/profile/${item.id}`)}
                                            >
                                                <Avatar name={item.name || 'User'} photo={item.photo} size={60} />
                                                <Text style={styles.recentSearchName} numberOfLines={1}>
                                                    {item.name?.split(' ')[0] || 'User'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <View
                            style={[styles.topFeatureRow, { flexDirection: 'column', alignItems: 'center', marginTop: 12, marginBottom: 8 }]}
                        >
                            <ScrollView
                                ref={topFeaturesScrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={featureSnapInterval}
                                decelerationRate="fast"
                                contentContainerStyle={{ gap: 10, paddingHorizontal: PAGE_PADDING }}
                                style={{ width: '100%' }}
                                onScroll={(e) => {
                                    const x = e.nativeEvent.contentOffset.x;
                                    const idx = Math.round(x / featureSnapInterval);
                                    const clampedIdx = Math.max(0, Math.min(idx, baseQuickAccess.length - 1));
                                    setActiveFeatureIndex(clampedIdx);
                                    topFeaturesAutoScrollIndex.current = clampedIdx;
                                }}
                                scrollEventThrottle={16}
                            >
                                {baseQuickAccess.map((item, idx) => {
                                    let cardBg = '#FFFFFF';
                                    let iconBg = '#FF8A3D';
                                    if (item.label === 'Panchang') {
                                        cardBg = '#FFF9F0';
                                        iconBg = '#FF9800';
                                    } else if (item.label === 'My Krishn') {
                                        cardBg = '#FFF8EB';
                                        iconBg = '#FF6B00';
                                    } else if (item.label === 'SOS') {
                                        cardBg = '#FFF5F5';
                                        iconBg = '#FF3B30';
                                    }

                                    let displayLabel = item.label;
                                    let displaySubtitle = item.subtitle;



                                    if (t('language') === 'hi') {
                                        if (item.label === 'My Krishn') {
                                            displayLabel = 'मेरे कृष्ण';
                                            displaySubtitle = 'एआई धर्म मार्गदर्शन';
                                        } else if (item.label === 'SOS') {
                                            displayLabel = 'एसओएस (SOS)';
                                            displaySubtitle = 'आपके आसपास के सनातनी लोग';
                                        } else if (item.label === 'Panchang') {
                                            displayLabel = 'पंचांग';
                                            displaySubtitle = 'Plan with\nVedic wisdom';
                                        } else if (item.label === 'Kundli') {
                                            displayLabel = 'कुंडली';
                                            displaySubtitle = 'Your birth chart insights';
                                        } else if (item.label === 'Brahmand Passport') {
                                            displayLabel = 'ब्रह्मांड पासपोर्ट';
                                            displaySubtitle = 'आपकी मंदिर यात्रा का रिकॉर्ड';
                                        } else if (item.label === 'Festival') {
                                            displayLabel = 'त्योहार के दिन';
                                            displaySubtitle = 'अगला त्योहार और अनुष्ठान';
                                        } else if (item.label === 'Brahmand Library') {
                                            displayLabel = 'ब्रह्मांड पुस्तकालय';
                                            displaySubtitle = 'ज्ञान की खोज करें';
                                        }
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.featureCard,
                                                Platform.OS === 'android' && { width: featureCardWidth, height: featureCardHeight, paddingHorizontal: 12 }
                                            ]}
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                if (item.label === 'Panchang') router.push('/panchang');
                                                else if (item.label === 'My Krishn') router.push('/my-krishna');
                                                else if (item.label === 'SOS') router.push('/sos');
                                                else if (item.label === 'Kundli') router.push('/astrology' as any);
                                                else if (item.label === 'Brahmand Passport') router.push('/passport');
                                                else if (item.label === 'Festival') router.push('/festivals');
                                                else if (item.label === 'Brahmand Library') router.push('/library');
                                            }}
                                        >
                                            {item.label === 'SOS' ? (
                                                <View style={Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255, 0, 0, 0.10)', justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 0, 0, 0.10)', justifyContent: 'center', alignItems: 'center' }}>
                                                    <View style={Platform.OS === 'android' ? { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 0, 0, 0.50)', justifyContent: 'center', alignItems: 'center' } : { width: 42.2, height: 42.2, borderRadius: 21.1, backgroundColor: 'rgba(255, 0, 0, 0.50)', justifyContent: 'center', alignItems: 'center' }}>
                                                        <View style={Platform.OS === 'android' ? { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' } : { width: 34.5, height: 34.5, borderRadius: 17.25, backgroundColor: 'rgba(255, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Text style={Platform.OS === 'android' ? { color: '#FFF', textAlign: 'center', fontFamily: 'System', fontSize: 10, fontWeight: '600' } : { color: '#FFF', textAlign: 'center', fontFamily: 'System', fontSize: 11, fontWeight: '600' }}>SOS</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            ) : item.label === 'My Krishn' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={require('../../../assets/images/orange_circle_bg.webp')} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <ExpoImage source={require('../../../assets/images/tab-bar/my_krishna.webp')} style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 42, height: 42 }} contentFit="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Panchang' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={require('../../../assets/images/orange_circle_bg.webp')} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={require('../../../assets/images/panchang_icon_3.webp')} style={Platform.OS === 'android' ? { width: 24, height: 24 } : { width: 26, height: 26 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Kundli' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={require('../../../assets/images/orange_circle_bg.webp')} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={require('../../../assets/images/custom_kundli_icon.webp')} style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 44, height: 44 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Brahmand Passport' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 58, overflow: 'visible' } : { overflow: 'visible', width: 52, height: 67 }]}>
                                                    <Image source={require('../../../assets/images/custom_passport_icon.webp')} style={Platform.OS === 'android' ? { width: 46, height: 58, flexShrink: 0, aspectRatio: 41 / 52 } : { width: 53, height: 67, flexShrink: 0, aspectRatio: 41 / 52 }} resizeMode="contain" />
                                                </View>
                                            ) : item.label === 'Festival' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={require('../../../assets/images/orange_circle_bg.webp')} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={require('../../../assets/images/custom_festival_icon_2.webp')} style={Platform.OS === 'android' ? { width: 24, height: 24 } : { width: 26, height: 26 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : item.label === 'Brahmand Library' ? (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                                    <ImageBackground source={require('../../../assets/images/orange_circle_bg.webp')} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Image source={require('../../../assets/images/library_icon_3.webp')} style={Platform.OS === 'android' ? { width: 22, height: 22 } : { width: 24, height: 24 }} resizeMode="contain" />
                                                    </ImageBackground>
                                                </View>
                                            ) : (
                                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, backgroundColor: iconBg } : { backgroundColor: iconBg }]}>
                                                    <Ionicons name="calendar" size={Platform.OS === 'android' ? 22 : 24} color="#FFF" />
                                                </View>
                                            )}
                                            <View style={[styles.featureTextContainer, Platform.OS === 'android' && { marginLeft: 8 }]}>
                                                <Text style={[styles.featureTitle, Platform.OS === 'android' && { fontSize: 13, lineHeight: 15 }]} numberOfLines={undefined}>{displayLabel}</Text>
                                                {displaySubtitle ? (
                                                    <Text style={[styles.featureSubtitle, Platform.OS === 'android' && { fontSize: 9.5, lineHeight: 11.5 }]} numberOfLines={undefined}>{displaySubtitle}</Text>
                                                ) : null}
                                            </View>
                                            <Ionicons name="chevron-forward" size={10} color="#999" style={{ marginLeft: 'auto' }} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                {baseQuickAccess.map((_, idx) => (
                                    <View
                                        key={idx}
                                        style={{
                                            width: activeFeatureIndex === idx ? 8 : 6,
                                            height: activeFeatureIndex === idx ? 8 : 6,
                                            borderRadius: 4,
                                            backgroundColor: activeFeatureIndex === idx ? '#FFF' : 'rgba(255, 255, 255, 0.45)',
                                        }}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    <View
                        style={{ position: 'relative' }}
                    >
                        <ScrollView
                            ref={bannerScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            decelerationRate="fast"
                            snapToInterval={screenWidth - 40 + 12}
                            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                            onScroll={(e) => {
                                const x = e.nativeEvent.contentOffset.x;
                                const idx = Math.round(x / (screenWidth - 40));
                                setActiveBannerIndex(idx);
                            }}
                            scrollEventThrottle={16}
                        >
                            {/* Live Katha Banner (First) */}
                            {(() => {
                                // Dynamic Event State Calculation (13 August - 11 September Shravan Maas Shiv Katha)
                                // Standardized to Asia/Kolkata (IST UTC+5:30)
                                const getISTDate = () => {
                                    const d = new Date();
                                    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
                                    return new Date(utc + (3600000 * 5.5)); // UTC + 5:30 IST offset
                                };
                                const now = getISTDate();

                                // Campaign dates in IST: 13 August 2026 8:00 AM IST to 11 September 2026 9:30 AM IST
                                const campaignStart = new Date(2026, 7, 13, 8, 0, 0); // Month 7 = August 13th 8:00 AM IST
                                const campaignEnd = new Date(2026, 8, 11, 9, 30, 0); // Month 8 = September 11th 9:30 AM IST

                                let eventStatus: 'upcoming' | 'starting_soon' | 'live' | 'between_streams' | 'ended' | 'campaign_completed' = 'upcoming';
                                let targetLiveTime = campaignStart;

                                if (now.getTime() < campaignStart.getTime()) {
                                    // Before campaign officially launches (Today 12 Aug) -> Upcoming targeting 13 Aug 8:00 AM IST
                                    eventStatus = 'upcoming';
                                    targetLiveTime = campaignStart;
                                } else if (now.getTime() > campaignEnd.getTime()) {
                                    // After full 1-month campaign completes (After 11 Sept 9:30 AM IST)
                                    eventStatus = 'campaign_completed';
                                } else {
                                    // Within Campaign (13 Aug to 11 Sep): Check daily 8:00 AM & 8:00 PM IST windows
                                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                    
                                    const mStart = 8 * 60; // 8:00 AM IST (480 mins)
                                    const mEnd = 9 * 60 + 30; // 9:30 AM IST (570 mins)
                                    const mSoon = 7 * 60 + 45; // 7:45 AM IST

                                    const eStart = 20 * 60; // 8:00 PM IST (1200 mins)
                                    const eEnd = 21 * 60 + 30; // 9:30 PM IST (1290 mins)
                                    const eSoon = 19 * 60 + 45; // 7:45 PM IST

                                    if ((currentMinutes >= mStart && currentMinutes <= mEnd) ||
                                        (currentMinutes >= eStart && currentMinutes <= eEnd)) {
                                        eventStatus = 'live';
                                    } else if (currentMinutes >= mSoon && currentMinutes < mStart) {
                                        eventStatus = 'starting_soon';
                                        targetLiveTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
                                    } else if (currentMinutes >= eSoon && currentMinutes < eStart) {
                                        eventStatus = 'starting_soon';
                                        targetLiveTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
                                    } else if (currentMinutes < mSoon) {
                                        eventStatus = 'upcoming';
                                        targetLiveTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
                                    } else if (currentMinutes < eSoon) {
                                        eventStatus = 'between_streams';
                                        targetLiveTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
                                    } else {
                                        const isLastDay = now.getMonth() === 8 && now.getDate() === 11;
                                        if (isLastDay) {
                                            eventStatus = 'campaign_completed';
                                        } else {
                                            eventStatus = 'between_streams';
                                            targetLiveTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
                                        }
                                    }
                                }

                                const isLive = eventStatus === 'live';

                                return (
                                    <View
                                        style={[styles.featuredLiveCard, { width: screenWidth - 40, shadowColor: 'transparent', shadowOpacity: 0, elevation: 0, backgroundColor: 'transparent' }]}
                                    >
                                        <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
                                            {/* Divine Golden Aura Radial Glow behind Acharya's Portrait */}
                                            <View
                                                pointerEvents="none"
                                                style={{
                                                    position: 'absolute',
                                                    right: '-12%',
                                                    top: '-15%',
                                                    width: '75%',
                                                    height: '120%',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {/* Outer Warm Amber Ambient Glow */}
                                                <View
                                                    style={{
                                                        position: 'absolute',
                                                        width: 190,
                                                        height: 190,
                                                        borderRadius: 95,
                                                        backgroundColor: 'rgba(255, 179, 0, 0.45)',
                                                        transform: [{ scaleX: 1.2 }],
                                                    }}
                                                />
                                                {/* Inner Concentric Golden Divine Halo Core */}
                                                <View
                                                    style={{
                                                        position: 'absolute',
                                                        width: 130,
                                                        height: 130,
                                                        borderRadius: 65,
                                                        backgroundColor: 'rgba(255, 223, 0, 0.65)',
                                                    }}
                                                />
                                            </View>

                                            <Image
                                                source={require('../../../assets/images/panditji.webp')}
                                                style={{
                                                    width: '100%',
                                                    height: '135%',
                                                    top: -28,
                                                    borderRadius: 16,
                                                }}
                                                resizeMode="cover"
                                            />
                                            {/* Overlay Gradient for smooth image blend with banner background */}
                                            <LinearGradient
                                                colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.10)']}
                                                start={{ x: 0, y: 0.5 }}
                                                end={{ x: 0.85, y: 0.5 }}
                                                style={StyleSheet.absoluteFillObject}
                                                pointerEvents="none"
                                            />

                                            {/* TOP RIGHT CORNER: LIVE BADGE WHEN ON-AIR */}
                                            {isLive && (
                                                <View style={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    zIndex: 20,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    backgroundColor: '#D32F2F',
                                                    paddingHorizontal: 9,
                                                    paddingVertical: 4,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: '#FF8A80',
                                                    shadowColor: '#D32F2F',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.8,
                                                    shadowRadius: 5,
                                                    elevation: 6,
                                                }}>
                                                    <Text style={{ color: '#FFF', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.5, marginRight: 5 }}>LIVE NOW</Text>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />
                                                </View>
                                            )}

                                            {/* TOP RIGHT CORNER: DYNAMIC BADGE & LIVE COUNTDOWN TIMER ACCORDING TO LIFECYCLE */}
                                            <DynamicEventBadge eventStatus={eventStatus} targetLiveTime={targetLiveTime} />

                                            {/* LEFT CONTENT AREA */}
                                            <View
                                                pointerEvents="box-none"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    bottom: 0,
                                                    width: '70%',
                                                    paddingLeft: 14,
                                                    paddingRight: 6,
                                                    paddingTop: Platform.OS === 'android' ? 1 : 2,
                                                    paddingBottom: 2,
                                                    justifyContent: 'flex-start',
                                                    alignItems: 'flex-start',
                                                }}>
                                                {/* MAIN HEADING BLOCK - श्रावण मास & शिव कथा */}
                                                <View style={{
                                                    width: '100%',
                                                    alignItems: 'flex-start',
                                                }}>
                                                    {/* TOP BANNER TITLE CHIP (🔴 LIVE | श्रावण विशेष on top-left if live) */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                                    </View>

                                                    <View style={{ paddingLeft: 10 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={{
                                                                color: '#FFF8E7',
                                                                fontSize: Platform.OS === 'ios' ? 31 : 28,
                                                                fontWeight: '900',
                                                                lineHeight: Platform.OS === 'ios' ? 38 : 34,
                                                                paddingVertical: Platform.OS === 'ios' ? 2 : 0,
                                                                letterSpacing: 0,
                                                                textAlign: 'left',
                                                                textShadowColor: 'rgba(216, 90, 0, 0.95)',
                                                                textShadowOffset: { width: 1.5, height: 2.5 },
                                                                textShadowRadius: 2,
                                                            }}
                                                        >
                                                            श्रावण मास <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: '400', transform: [{ rotate: '90deg' }] }}>⚜</Text>
                                                        </Text>
                                                    </View>

                                                    {/* शिव कथा with iOS matra height fix & 32 lineHeight on Android */}
                                                    <View style={{ width: '100%', alignItems: 'flex-start', paddingLeft: 24, marginTop: Platform.OS === 'ios' ? -5 : 1 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={{
                                                                color: '#FFE58F',
                                                                fontSize: 24,
                                                                fontWeight: '900',
                                                                lineHeight: Platform.OS === 'ios' ? 35 : 32,
                                                                paddingVertical: Platform.OS === 'ios' ? 3 : 0,
                                                                letterSpacing: 0.5,
                                                                textAlign: 'left',
                                                                textShadowColor: 'rgba(50, 18, 0, 0.98)',
                                                                textShadowOffset: { width: 2, height: 3 },
                                                                textShadowRadius: 1,
                                                            }}
                                                        >
                                                            <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: '400', transform: [{ rotate: '90deg' }] }}>⚜ </Text>शिव कथा
                                                        </Text>
                                                    </View>

                                                    {/* SPEAKER NAME - Acharya Shamik Ji */}
                                                    <View style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        marginTop: Platform.OS === 'ios' ? 0 : 1,
                                                        marginLeft: 2,
                                                    }}>
                                                        <Text style={{
                                                            color: '#FFD700',
                                                            fontSize: Platform.OS === 'android' ? 11 : 13,
                                                            marginRight: 4,
                                                            transform: [{ rotate: '90deg' }],
                                                            textShadowColor: 'rgba(255,215,0,0.8)',
                                                            textShadowOffset: { width: 0, height: 0 },
                                                            textShadowRadius: 4,
                                                        }}>
                                                            ⚜
                                                        </Text>
                                                        <Text style={{
                                                            color: '#FFFFFF',
                                                            fontSize: Platform.OS === 'android' ? 12.5 : 14.5,
                                                            fontWeight: '700',
                                                            letterSpacing: 0.3,
                                                            textShadowColor: 'rgba(0,0,0,0.9)',
                                                            textShadowOffset: { width: 0, height: 1 },
                                                            textShadowRadius: 3,
                                                        }}>
                                                            Acharya Shamik Ji
                                                        </Text>
                                                        <Text style={{
                                                            color: '#FFD700',
                                                            fontSize: Platform.OS === 'android' ? 11 : 13,
                                                            marginLeft: 4,
                                                            transform: [{ rotate: '90deg' }],
                                                            textShadowColor: 'rgba(255,215,0,0.8)',
                                                            textShadowOffset: { width: 0, height: 0 },
                                                            textShadowRadius: 4,
                                                        }}>
                                                            ⚜
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* DATE SECTION & DYNAMIC CTA BUTTON */}
                                                <View style={{
                                                    alignSelf: 'flex-start',
                                                    marginTop: Platform.OS === 'android' ? 1 : 3,
                                                    marginLeft: 2,
                                                }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text style={{ fontSize: Platform.OS === 'android' ? 10 : 11, color: '#F4C55A', marginRight: 4 }}>📅</Text>
                                                        <Text style={{
                                                            color: '#F4C55A',
                                                            fontSize: Platform.OS === 'android' ? 11 : 12,
                                                            fontWeight: '800',
                                                            letterSpacing: 0.2,
                                                            textShadowColor: 'rgba(0,0,0,0.95)',
                                                            textShadowOffset: { width: 0, height: 1 },
                                                            textShadowRadius: 3,
                                                        }}>
                                                            13 अगस्त – 11 सितंबर
                                                        </Text>
                                                    </View>

                                                    {/* Dynamic Supporting Text */}
                                                    <Text style={{
                                                        color: '#FFFFFF',
                                                        opacity: 0.95,
                                                        fontWeight: '600',
                                                        fontSize: Platform.OS === 'android' ? 10 : 11,
                                                        marginTop: Platform.OS === 'android' ? 1 : 3,
                                                        textShadowColor: 'rgba(0,0,0,0.95)',
                                                        textShadowOffset: { width: 0, height: 1 },
                                                        textShadowRadius: 3,
                                                    }}>
                                                        {(eventStatus as any) === 'live'
                                                            ? '🔴 अभी LIVE प्रसारण चल रहा है'
                                                            : (eventStatus as any) === 'starting_soon'
                                                                ? '⏰ सुबह 8:00 बजे शुरू होगा'
                                                                : (eventStatus as any) === 'between_streams'
                                                                    ? 'Next Live • 8:00 AM'
                                                                    : (eventStatus as any) === 'campaign_completed' || (eventStatus as any) === 'ended'
                                                                        ? '🕉 Shravan Katha Series Completed'
                                                                        : 'हर दिन सुबह 8:00 बजे LIVE'}
                                                    </Text>

                                                    {/* DYNAMIC CTA BUTTON & ALIGNED COUNTDOWN TIMER ACCORDING TO LIVE EVENT LIFECYCLE */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === 'android' ? 4 : 6 }}>
                                                        {isLive ? (
                                                            <Pressable
                                                                style={{
                                                                    backgroundColor: '#D32F2F',
                                                                    paddingHorizontal: 14,
                                                                    paddingVertical: 7,
                                                                    borderRadius: 20,
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    borderWidth: 1,
                                                                    borderColor: '#FF8A80',
                                                                    shadowColor: '#D32F2F',
                                                                    shadowOffset: { width: 0, height: 2 },
                                                                    shadowOpacity: 0.7,
                                                                    shadowRadius: 5,
                                                                    elevation: 5,
                                                                }}
                                                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
                                                                onPress={() => {
                                                                    try {
                                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                                    } catch (_e) { }
                                                                    router.push('/library/katha');
                                                                }}
                                                            >
                                                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900', marginRight: 4 }}>▶</Text>
                                                                <Text style={{ color: '#FFF', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.3 }}>Watch Now</Text>
                                                            </Pressable>
                                                        ) : (eventStatus as any) === 'campaign_completed' ? (
                                                            <Pressable
                                                                style={{
                                                                    backgroundColor: 'rgba(50, 50, 50, 0.9)',
                                                                    paddingHorizontal: 12,
                                                                    paddingVertical: 6,
                                                                    borderRadius: 20,
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    borderWidth: 1,
                                                                    borderColor: '#FFD700',
                                                                }}
                                                                onPress={() => router.push('/library/katha')}
                                                            >
                                                                <Text style={{ color: '#FFD700', fontSize: 10.5, fontWeight: '800' }}>▶ Watch Full Series</Text>
                                                            </Pressable>
                                                        ) : ((eventStatus as any) === 'between_streams' || (eventStatus as any) === 'ended') ? (
                                                            <Pressable
                                                                style={{
                                                                    backgroundColor: 'rgba(50, 50, 50, 0.9)',
                                                                    paddingHorizontal: 12,
                                                                    paddingVertical: 6,
                                                                    borderRadius: 20,
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    borderWidth: 1,
                                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                                }}
                                                                onPress={() => router.push('/library/katha')}
                                                            >
                                                                <Text style={{ color: '#FFF', fontSize: 10.5, fontWeight: '800' }}>▶ Watch Replay</Text>
                                                            </Pressable>
                                                        ) : (
                                                            <UiverseNotifyButton
                                                                isNotified={!!reminders['shravan_katha']}
                                                                onPress={async () => {
                                                                    try {
                                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                                    } catch (_e) { }
                                                                    const isCurrentlyNotified = !!reminders['shravan_katha'];
                                                                    await handleSetReminder('shravan_katha', 'Shravan Shiv Katha');
                                                                    if (!isCurrentlyNotified) {
                                                                        scheduleShravanKatha15MinReminder().catch(() => {});
                                                                    }
                                                                    router.push({
                                                                        pathname: '/shravan-paath',
                                                                        params: { is_interested: !isCurrentlyNotified ? '1' : '0' }
                                                                    });
                                                                }}
                                                                label={eventStatus === 'starting_soon' ? "Remind Me" : "Notify Me"}
                                                                notifiedLabel="Notified"
                                                                size="small"
                                                                style={{
                                                                    alignSelf: 'center',
                                                                }}
                                                            />
                                                        )}

                                                         {/* Dynamic Countdown / Live Badge Aligned next to Notify Button */}
                                                        <DynamicEventBadge eventStatus={eventStatus} targetLiveTime={targetLiveTime} />
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })()}

                            <View style={[styles.featuredLiveCard, { width: screenWidth - 40 }]}>
                                <ImageBackground source={require('../../../assets/images/hanuman_banner_new.webp')} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }} resizeMode="cover">
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                                        style={styles.featuredLiveOverlay}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                            {/* Top Left Content */}
                                            <View style={{ flex: 1, paddingTop: 0, paddingLeft: 0, marginRight: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                                    <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                                    <Text style={[
                                                        styles.featuredLiveTitle,
                                                        {
                                                            color: '#FFF',
                                                            fontFamily: 'System',
                                                            fontSize: 15,
                                                            fontStyle: 'normal',
                                                            fontWeight: '700',
                                                            letterSpacing: 1,
                                                            textShadowColor: 'rgba(0,0,0,0.9)',
                                                            textShadowOffset: { width: 0, height: 1 },
                                                            textShadowRadius: 6,
                                                        }
                                                    ]}>Hanuman Chalisa</Text>
                                                </View>

                                                <Text style={[styles.featuredDevotees, {
                                                    color: '#FFF',
                                                    fontWeight: '600',
                                                    opacity: 0.9,
                                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 4,
                                                    marginLeft: 14,
                                                    marginTop: 0,
                                                    marginBottom: 2,
                                                    fontSize: 13
                                                }]}>
                                                    {hanumanStatus.isActive
                                                        ? `${hanumanChantCount.toLocaleString()} ${t('devoteesChanting') || 'devotees are chanting'}`
                                                        : (t('language') === 'hi'
                                                            ? '2300+ भक्त पहले ही जाप पूरा कर चुके हैं'
                                                            : '2300+ devotees already completed jaap')}
                                                </Text>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                                    <Ionicons name="time-outline" size={13} color="#FFF" />
                                                    <Text style={[styles.featuredTime, {
                                                        marginTop: 0,
                                                        marginLeft: 4,
                                                        color: '#FFF',
                                                        fontWeight: '600',
                                                        fontSize: 12
                                                    }]}>
                                                        {hanumanStatus.isActive
                                                            ? (t('language') === 'hi'
                                                                ? `${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} जाप पूर्ण`
                                                                : `${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} jaap done so far`)
                                                            : (hanumanStatus.nextSessionStart
                                                                ? (t('language') === 'hi'
                                                                    ? `जाप ${formatTime(hanumanStatus.nextSessionStart)} बजे शुरू होगा`
                                                                    : `Jaap starts at ${formatTime(hanumanStatus.nextSessionStart)}`)
                                                                : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live soon'))}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Top Right LIVE Badge */}
                                            <View style={[styles.liveBadge, {
                                                alignSelf: 'flex-start',
                                                backgroundColor: hanumanStatus.isActive ? '#FF0000' : '#FF7A00',
                                                paddingHorizontal: hanumanStatus.isActive ? 8 : 10,
                                            }]}>
                                                {hanumanStatus.isActive && <View style={styles.liveDot} />}
                                                <Text style={[styles.liveBadgeText, { marginLeft: hanumanStatus.isActive ? 4 : 0 }]}>
                                                    {hanumanStatus.isActive
                                                        ? 'LIVE'
                                                        : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live')}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Bottom Button Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 0 }}>
                                            <Pressable
                                                style={[
                                                    styles.joinJaapButton,
                                                    {
                                                        backgroundColor: '#FF5100',
                                                        display: 'flex',
                                                        width: 138,
                                                        height: 36,
                                                        paddingHorizontal: 12,
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                    }
                                                ]}
                                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
                                                onPress={() => handleLiveJaapNavigation('hanuman', 'Hanuman Chalisa')}
                                            >
                                                <Text style={styles.joinJaapText}>{t('joinLiveJaap')}</Text>
                                            </Pressable>

                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: reminders['hanuman'] ? '#FFF' : 'rgba(255, 255, 255, 0.2)',
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: reminders['hanuman'] ? '#FF5100' : 'rgba(255, 255, 255, 0.4)',
                                                }}
                                                activeOpacity={0.8}
                                                onPress={() => handleSetReminder('hanuman', 'Hanuman Chalisa')}
                                            >
                                                <Ionicons
                                                    name={reminders['hanuman'] ? "notifications" : "notifications-outline"}
                                                    size={18}
                                                    color={reminders['hanuman'] ? '#FF5100' : '#FFF'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </View>

                            <View style={[styles.featuredLiveCard, { width: screenWidth - 40 }]}>
                                <ImageBackground source={shivaImage} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }}>
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                                        style={styles.featuredLiveOverlay}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                            {/* Top Left Content */}
                                            <View style={{ flex: 1, paddingTop: 0, paddingLeft: 0, marginRight: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                                    <View style={[styles.liveDot, { backgroundColor: '#FFD700', marginRight: 8 }]} />
                                                    <Text style={[
                                                        styles.featuredLiveTitle,
                                                        {
                                                            color: '#FFF',
                                                            fontFamily: 'System',
                                                            fontSize: 15,
                                                            fontStyle: 'normal',
                                                            fontWeight: '700',
                                                            letterSpacing: 1,
                                                            textShadowColor: 'rgba(0,0,0,0.9)',
                                                            textShadowOffset: { width: 0, height: 1 },
                                                            textShadowRadius: 6,
                                                        }
                                                    ]}>Om Namah Shivay</Text>
                                                </View>

                                                <Text style={[styles.featuredDevotees, {
                                                    color: '#FFF',
                                                    fontWeight: '600',
                                                    opacity: 0.9,
                                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                                    textShadowOffset: { width: 0, height: 1 },
                                                    textShadowRadius: 4,
                                                    marginLeft: 14,
                                                    marginTop: 0,
                                                    marginBottom: 2,
                                                    fontSize: 13
                                                }]}>
                                                    {shivaStatus.isActive
                                                        ? `${shivaChantCount.toLocaleString()} ${t('devoteesChanting') || 'devotees are chanting'}`
                                                        : (t('language') === 'hi'
                                                            ? '2300+ भक्त पहले ही जाप पूरा कर चुके हैं'
                                                            : '2300+ devotees already completed jaap')}
                                                </Text>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 14 }}>
                                                    <Ionicons name="time-outline" size={13} color="#FFF" />
                                                    <Text style={[styles.featuredTime, {
                                                        marginTop: 0,
                                                        marginLeft: 4,
                                                        color: '#FFF',
                                                        fontWeight: '600',
                                                        fontSize: 12
                                                    }]}>
                                                        {shivaStatus.isActive
                                                            ? `${t('liveUntil')} ${shivaStatus.sessionEnd ? formatTime(shivaStatus.sessionEnd) : '5:00 PM'}`
                                                            : (shivaStatus.nextSessionStart
                                                                ? (t('language') === 'hi' ? `${formatTime(shivaStatus.nextSessionStart)} पर लाइव होगा` : `Live at ${formatTime(shivaStatus.nextSessionStart)}`)
                                                                : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live soon'))}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Top Right LIVE Badge */}
                                            <View style={[styles.liveBadge, {
                                                alignSelf: 'flex-start',
                                                backgroundColor: shivaStatus.isActive ? '#FF0000' : '#FF7A00',
                                                paddingHorizontal: shivaStatus.isActive ? 8 : 10,
                                            }]}>
                                                {shivaStatus.isActive && <View style={styles.liveDot} />}
                                                <Text style={[styles.liveBadgeText, { marginLeft: shivaStatus.isActive ? 4 : 0 }]}>
                                                    {shivaStatus.isActive
                                                        ? 'LIVE'
                                                        : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live')}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Bottom Button Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 0 }}>
                                            <Pressable
                                                style={[
                                                    styles.joinJaapButton,
                                                    {
                                                        backgroundColor: '#FF5100',
                                                        display: 'flex',
                                                        width: 138,
                                                        height: 36,
                                                        paddingHorizontal: 12,
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                    }
                                                ]}
                                                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
                                                onPress={() => handleLiveJaapNavigation('shiva', 'Om Namah Shivay')}
                                            >
                                                <Text style={styles.joinJaapText}>{t('joinLiveJaap')}</Text>
                                            </Pressable>

                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: reminders['shiva'] ? '#FFF' : 'rgba(255, 255, 255, 0.2)',
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: reminders['shiva'] ? '#FF5100' : 'rgba(255, 255, 255, 0.4)',
                                                }}
                                                activeOpacity={0.8}
                                                onPress={() => handleSetReminder('shiva', 'Mahamrityunjaya Mantra')}
                                            >
                                                <Ionicons
                                                    name={reminders['shiva'] ? "notifications" : "notifications-outline"}
                                                    size={18}
                                                    color={reminders['shiva'] ? '#FF5100' : '#FFF'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </View>
                        </ScrollView>
                    </View>
                </View>

                <ActionCardsRow t={t} safeCommunityRequests={safeCommunityRequests} />

                <View style={styles.twoButtonsRow}>
                    {/* Mumbai Community Card */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.communityCardMini,
                            Platform.OS === 'android' && { overflow: 'hidden' },
                            pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                        ]}
                        android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                        onPress={() => {
                            router.push({
                                pathname: '/community/[id]',
                                params: { id: cityId, subgroup: 'city', name: cityName }
                            });
                        }}
                    >
                        <Image source={require('../../../assets/images/mumbai_pin.webp')} style={styles.communityCardIcon} />
                        <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                            <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('cityCommunity').toUpperCase()}</Text>
                            <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                                {cityName}
                            </Text>
                            <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>{cityMembers} {t('members')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                    </Pressable>

                    {/* Local Community Card */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.communityCardMini,
                            Platform.OS === 'android' && { overflow: 'hidden' },
                            pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                        ]}
                        android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
                        onPress={() => {
                            router.push({
                                pathname: '/community/[id]',
                                params: { id: localId, subgroup: localSubgroup, name: realGroupName }
                            });
                        }}
                    >
                        <View style={styles.communityCardIconBox}>
                            <Image source={require('../../../assets/images/food_sharing.webp')} style={styles.communityCardIconRound} />
                        </View>
                        <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                            <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('foodSharing').toUpperCase()}</Text>
                            <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                                {realGroupName}
                            </Text>
                            <View style={styles.miniCardBottomRow}>
                                <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>{localMembers} {t('members')}</Text>
                                <View style={styles.sevaBadgeMini}>
                                    <Text style={styles.sevaBadgeTextMini}>Seva</Text>
                                </View>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
                    </Pressable>
                </View>
            </View>

            <View style={{ zIndex: 10, elevation: 10, backgroundColor: 'transparent' }}>
                <HomeFeedTabs
                    activeTab={activeTab}
                    onTabChange={(tab: string) => {
                        requestAnimationFrame(() => {
                            setActiveTab(tab);
                        });
                    }}
                    onCreatePost={() => setShowUploadPostModal(true)}
                />
            </View>
        </View>
    );
});
