import { Avatar } from '../Avatar';
import UiverseNotifyButton from '../UiverseNotifyButton';
import { FONTS } from '../../constants/theme';
import { formatTime, getCurrentHanumanStatus, getCurrentOtherJaapStatus } from '../../features/live-mantra/schedule';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Dimensions, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { styles } from './home.styles';
import { FEATURE_CARD_HEIGHT, FEATURE_CARD_WIDTH, FEATURE_SNAP_INTERVAL, PAGE_PADDING, SCREEN_WIDTH, baseQuickAccess, formatFestivalDate, shivaImage } from './homeConstants';

function KundliSirenIcon() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            {/* Orange-Red Circular Base */}
            <Circle cx="12" cy="12" r="11" fill="#FF5100" />
            {/* Light pinkish outer ring inside circle */}
            <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1" />
            {/* Siren bell/dome */}
            <Path
                d="M12 8C10.3 8 9 9.3 9 11V13.5H15V11C15 9.3 13.7 8 12 8Z"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Siren base */}
            <Path
                d="M8 14H16"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Beams */}
            <Path d="M12 5V6.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M8.5 6L9.5 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M15.5 6L14.5 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
    );
}

function CosmicMoonIcon() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            {/* Orange circular base */}
            <Circle cx="12" cy="12" r="11" fill="#FF5100" />
            {/* Light pinkish outer border */}
            <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1.5" />
            {/* Crescent Moon Outline (matching image exactly, pointing right/up) */}
            <Path
                d="M8.5 13.5C8.5 9.5 11.5 6.5 15 6.5C13.8 7.5 13 9.0 13 10.8C13 13.5 15 15.5 17.5 15.5C16.5 16.5 15 17 13.5 17C10.5 17 8.5 15 8.5 13.5Z"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Large Star Sparkle Cross (top right) */}
            <Path
                d="M15.5 5.5H18.5M17 4V7"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Small Star Sparkle Cross (next to it) */}
            <Path
                d="M13 3.5H15M14 2.5V4.5"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </Svg>
    );
}

function PassportIcon() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            {/* Deep Blue Circular Base */}
            <Circle cx="12" cy="12" r="11" fill="#0A1D37" />
            {/* Gold outer ring */}
            <Circle cx="12" cy="12" r="11" stroke="#FFC000" strokeWidth="1" />

            {/* Gold circle in center */}
            <Circle cx="12" cy="9.8" r="3.2" stroke="#FFC000" strokeWidth="0.8" />

            {/* Beautiful OM path */}
            <Path
                d="M11.2 8.8C11.6 8.5 12.2 8.5 12.5 8.9C12.8 9.3 12.7 9.8 12.3 10.1C12.7 10.4 12.9 10.9 12.7 11.4C12.5 11.9 11.9 12.1 11.4 11.8M12.8 10.1C13.3 10.4 13.6 11.0 13.2 11.6C12.8 12.2 12.0 12.4 11.4 12.0M12.0 8.0C12.3 8.1 12.5 8.3 12.4 8.6M12.8 7.5C13.2 7.7 13.5 8.0 13.6 8.4"
                stroke="#FFC000"
                strokeWidth="0.6"
                strokeLinecap="round"
            />

            {/* Temple outline at bottom */}
            <Path
                d="M8.5 17H15.5M9.5 17V15L12 13L14.5 15V17M12 13V17M11 17V15.5H13V17"
                stroke="#FFC000"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function SacredDaysIcon() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            {/* Orange circular base */}
            <Circle cx="12" cy="12" r="11" fill="#FF5100" />
            {/* Light pinkish outer border */}
            <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1.5" />
            {/* Calendar Outline */}
            <Rect
                x="6.5"
                y="7.5"
                width="11"
                height="10"
                rx="1.5"
                stroke="#FFFFFF"
                strokeWidth="1.5"
            />
            {/* Calendar Binders */}
            <Path
                d="M9.5 5.5V7.5M14.5 5.5V7.5"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Star in the center of calendar */}
            <Path
                d="M12 9.5L12.8 11.2L14.7 11.5L13.3 12.8L13.6 14.7L12 13.8L10.4 14.7L10.7 12.8L9.3 11.5L11.2 11.2Z"
                fill="#FFFFFF"
            />
        </Svg>
    );
}

function LibraryBookIcon() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            {/* Orange circular base */}
            <Circle cx="12" cy="12" r="11" fill="#FF5100" />
            {/* Light pinkish outer border */}
            <Circle cx="12" cy="12" r="11" stroke="#FFE6E0" strokeWidth="1.5" />

            {/* Standing Book 1 */}
            <Rect
                x="7.5"
                y="6.5"
                width="4"
                height="11"
                rx="1"
                stroke="#FFFFFF"
                strokeWidth="1.5"
            />
            {/* Horizontal lines on Standing Book spine */}
            <Path d="M7.5 9.5H11.5M7.5 14.5H11.5" stroke="#FFFFFF" strokeWidth="1.2" />

            {/* Leaning Book 2 */}
            <G transform="rotate(12 12 12)">
                <Rect
                    x="11.5"
                    y="6.5"
                    width="4"
                    height="11"
                    rx="1"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                />
                {/* Horizontal lines on Leaning Book spine */}
                <Path d="M11.5 9.5H15.5M11.5 14.5H15.5" stroke="#FFFFFF" strokeWidth="1.2" />
            </G>
        </Svg>
    );
}

const AnimatedSkeleton = ({ children, style }: { children: React.ReactNode; style?: any }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);
    return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
};

const MagneticKathaButton = ({
    onPress,
    children,
    style,
}: {
    onPress: () => void;
    children: React.ReactNode;
    style?: any;
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        // Magnetic approach & press compression: pull 4px upward and scale down to 0.97
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.97,
                tension: 180,
                friction: 12,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: -4,
                tension: 180,
                friction: 12,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        // Smooth release with spring overshoot (1.08 -> 1.00) and magnetic return
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1.08,
                    tension: 200,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 180,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(scale, {
                toValue: 1,
                tension: 140,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    style,
                    {
                        transform: [{ scale }, { translateY }],
                    },
                ]}
            >
                {children}
            </Animated.View>
        </Pressable>
    );
};

const HomeHeaderBar = React.memo(function HomeHeaderBar({
    firstName,
    avatarUri,
    unreadCount,
    nextFestival,
    t,
    searchActive,
    onToggleSearch,
    searchTerm,
    onChangeSearchTerm,
    hashtagResults,
    loadingHashtags,
    searchResults,
    loadingUsers,
    followingIds,
    onFollowUser,
    recentSearches,
    onClearRecentSearches,
    onSelectUser,
    onSelectHashtag,
    onNotificationPress,
    onProfileLongPress,
}: {
    firstName: string;
    avatarUri?: string;
    unreadCount: number;
    nextFestival: any;
    t: (key: string) => string;
    searchActive: boolean;
    onToggleSearch: () => void;
    searchTerm: string;
    onChangeSearchTerm: (text: string) => void;
    hashtagResults: any[];
    loadingHashtags: boolean;
    searchResults: any[];
    loadingUsers: boolean;
    followingSet: Set<string>;
    onFollowUser: (id: string) => void;
    recentSearches: any[];
    onClearRecentSearches: () => void;
    onSelectUser: (item: any) => void;
    onSelectHashtag: (hashtag: string) => void;
    onNotificationPress: () => void;
    onProfileLongPress: () => void;
}) {
    const router = useRouter();

    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        style={styles.profileButton}
                        onPress={() => router.push('/(tabs)/profile')}
                        onLongPress={onProfileLongPress}
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
                        fontFamily: FONTS.brandTitle,
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
                        onPress={onToggleSearch}
                    >
                        <Ionicons name={searchActive ? "close-outline" : "search-outline"} size={Platform.OS === 'android' ? 22 : 24} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.headerIconButton}
                        onPress={onNotificationPress}
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
                            onChangeText={onChangeSearchTerm}
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
                                            onSelectHashtag(hashtag);
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
                                <>
                                    {searchResults.map((item) => {
                                        const isFollowing = followingSet.has(item.id);
                                        return (
                                        <View key={item.id} style={styles.userResultItem}>
                                            <TouchableOpacity
                                                style={styles.userResultContent}
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    onSelectUser(item);
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
                                                onPress={() => onFollowUser(item.id)}
                                            >
                                                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                                    {isFollowing ? t('following') : t('follow')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                    })}
                                </>
                            ) : (
                                <Text style={styles.searchStatusText}>{t('noUsersFound')}</Text>
                            )}
                        </View>
                    ) : recentSearches.length > 0 ? (
                        <View style={styles.recentSearchSection}>
                            <View style={styles.recentSearchHeader}>
                                <Text style={styles.recentSearchesTitle}>{t('recentSearchTitle')}</Text>
                                <TouchableOpacity onPress={onClearRecentSearches}>
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
            ) : null}
        </>
    );
});

const QuickAccessCards = React.memo(function QuickAccessCards({
    t,
}: {
    t: (key: string) => string;
}) {
    const router = useRouter();
    const isFocused = useIsFocused();
    const featureCardWidth = Platform.OS === 'android'
        ? 175
        : FEATURE_CARD_WIDTH;
    const featureCardHeight = Platform.OS === 'android' ? 82 : FEATURE_CARD_HEIGHT;
    const featureSnapInterval = Platform.OS === 'android' ? featureCardWidth + 10 : FEATURE_SNAP_INTERVAL;
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
    const topFeaturesScrollRef = useRef<ScrollView>(null);
    const topFeaturesAutoScrollIndex = useRef(0);

    useEffect(() => {
        if (!isFocused) return;
        const CARD_WIDTH = 185; // 175 card + 10 gap
        const TOTAL_CARDS = baseQuickAccess.length;
        const interval = setInterval(() => {
            if (AppState.currentState !== 'active') return;
            topFeaturesAutoScrollIndex.current = (topFeaturesAutoScrollIndex.current + 1) % TOTAL_CARDS;
            topFeaturesScrollRef.current?.scrollTo({
                x: topFeaturesAutoScrollIndex.current * CARD_WIDTH,
                animated: true,
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [isFocused]);

    return (
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
                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                        <ExpoImage source={require('../../../assets/images/tab-bar/my_krishna.webp')} style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 42, height: 42 }} contentFit="contain" />
                                    </ImageBackground>
                                </View>
                            ) : item.label === 'Panchang' ? (
                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/panchang_icon_3.webp' }} style={Platform.OS === 'android' ? { width: 24, height: 24 } : { width: 26, height: 26 }} resizeMode="contain" />
                                    </ImageBackground>
                                </View>
                            ) : item.label === 'Kundli' ? (
                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_kundli_icon.webp' }} style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 44, height: 44 }} resizeMode="contain" />
                                    </ImageBackground>
                                </View>
                            ) : item.label === 'Brahmand Passport' ? (
                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 58, overflow: 'visible' } : { overflow: 'visible', width: 52, height: 67 }]}>
                                    <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_passport_icon.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 58, flexShrink: 0, aspectRatio: 41 / 52 } : { width: 53, height: 67, flexShrink: 0, aspectRatio: 41 / 52 }} resizeMode="contain" />
                                </View>
                            ) : item.label === 'Festival' ? (
                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_festival_icon_2.webp' }} style={Platform.OS === 'android' ? { width: 24, height: 24 } : { width: 26, height: 26 }} resizeMode="contain" />
                                    </ImageBackground>
                                </View>
                            ) : item.label === 'Brahmand Library' ? (
                                <View style={[styles.featureIconWrap, Platform.OS === 'android' ? { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' } : { overflow: 'hidden' }]}>
                                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/orange_circle_bg.webp' }} style={Platform.OS === 'android' ? { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' } : { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/library_icon_3.webp' }} style={Platform.OS === 'android' ? { width: 22, height: 22 } : { width: 24, height: 24 }} resizeMode="contain" />
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
    );
});

const JaapBanners = React.memo(function JaapBanners({
    t,
    reminders,
    onSetReminder,
    onLiveJaap,
}: {
    t: (key: string) => string;
    reminders: Record<string, boolean>;
    onSetReminder: (mantraType: string, sessionName: string) => void;
    onLiveJaap: (mantraType: string, title: string) => void;
}) {
    const router = useRouter();
    const isFocused = useIsFocused();
    const { width: windowWidth } = useWindowDimensions();
    const screenWidth = Platform.OS === 'android' ? windowWidth : SCREEN_WIDTH;
    const bannerScrollRef = useRef<ScrollView>(null);
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const [hanumanChantCount, setHanumanChantCount] = useState(() => Math.floor(Math.random() * 17) + 2);
    const [shivaChantCount, setShivaChantCount] = useState(() => Math.floor(Math.random() * 17) + 2);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (!isFocused) return;
        const clockInterval = setInterval(() => {
            if (AppState.currentState === 'active') {
                setNow(new Date());
            }
        }, 60_000);
        return () => clearInterval(clockInterval);
    }, [isFocused]);

    useEffect(() => {
        if (!isFocused) return;

        let active = true;
        const fetchActiveCounts = async () => {
            try {
                const response = await api.get('/jaap/active-count', {
                    params: { rooms: 'jaap_hanuman,jaap_shiva' }
                });
                if (active && response && response.data) {
                    const hanuman = response.data.jaap_hanuman || 0;
                    const shiva = response.data.jaap_shiva || 0;
                    setHanumanChantCount(hanuman > 10 ? hanuman * 18 : Math.floor(Math.random() * 17) + 2);
                    setShivaChantCount(shiva > 10 ? shiva * 18 : Math.floor(Math.random() * 17) + 2);
                }
            } catch (error) {
                console.warn('Error fetching active jaap counts:', error);
            }
        };

        fetchActiveCounts();

        socketService.connect().then(() => {
            socketService.joinRoom('jaap_hanuman');
            socketService.joinRoom('jaap_shiva');
        }).catch(err => console.warn('Socket connect failed on Home:', err));

        const handleNewSOS = () => {
            fetchActiveCounts();
        };

        const handleActiveCount = (data: { room: string; count: number }) => {
            if (data) {
                const realCount = data.count || 0;
                const mappedCount = realCount > 10 ? realCount * 18 : Math.floor(Math.random() * 17) + 2;
                if (data.room === 'jaap_hanuman') {
                    setHanumanChantCount(mappedCount);
                } else if (data.room === 'jaap_shiva') {
                    setShivaChantCount(mappedCount);
                }
            }
        };

        socketService.onEvent('new_sos_alert', handleNewSOS);
        socketService.onEvent('sos_alert', handleNewSOS);
        socketService.onEvent('room_active_count', handleActiveCount);

        return () => {
            active = false;
            socketService.offEvent('new_sos_alert', handleNewSOS);
            socketService.offEvent('sos_alert', handleNewSOS);
            socketService.offEvent('room_active_count', handleActiveCount);
            socketService.leaveRoom('jaap_hanuman');
            socketService.leaveRoom('jaap_shiva');
        };
    }, [isFocused]);

    const hanumanStatus = getCurrentHanumanStatus(now);
    const shivaStatus = getCurrentOtherJaapStatus(now, 'shiva');

    return (
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
                    return (
                        <TouchableOpacity
                            activeOpacity={0.95}
                            onPress={() => router.push('/shravan-paath')}
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
                                    source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/panditji.webp' }}
                                    style={{
                                        width: '100%',
                                        height: '135%',
                                        top: -28,
                                        borderRadius: 16,
                                    }}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.10)']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 0.85, y: 0.5 }}
                                    style={StyleSheet.absoluteFillObject}
                                    pointerEvents="none"
                                />

                                {/* TOP RIGHT CORNER: HIGH VISIBILITY LIVE PILL BADGE WITH SUBTLE PULSE ANIMATION */}
                                {(() => {
                                    const pulseAnim = React.useRef(new Animated.Value(1)).current;
                                    const pulseOpacity = React.useRef(new Animated.Value(0.4)).current;
                                    React.useEffect(() => {
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
                                    }, []);

                                    return (
                                        <View
                                            pointerEvents="none"
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: '#D32F2F',
                                                paddingHorizontal: 9,
                                                paddingVertical: 4,
                                                borderRadius: 14,
                                                borderWidth: 2,
                                                borderColor: 'rgba(255, 255, 255, 0.25)',
                                                shadowColor: '#D32F2F',
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 0.8,
                                                shadowRadius: 10,
                                                elevation: 6,
                                                zIndex: 10,
                                            }}
                                        >
                                            {/* Outer Subtle Pulse Ring */}
                                            <Animated.View
                                                style={{
                                                    position: 'absolute',
                                                    left: 6,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 6,
                                                    backgroundColor: '#FFFFFF',
                                                    transform: [{ scale: pulseAnim }],
                                                    opacity: pulseOpacity,
                                                }}
                                            />
                                            {/* Solid Center Live Dot */}
                                            <View
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: '#FFFFFF',
                                                    marginRight: 5,
                                                    marginLeft: 1,
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    color: '#FFFFFF',
                                                    fontSize: 10.5,
                                                    fontWeight: '900',
                                                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
                                                    letterSpacing: 0.6,
                                                }}
                                            >
                                                LIVE
                                            </Text>
                                        </View>
                                    );
                                })()}

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
                                    <View style={{
                                        width: '100%',
                                        alignItems: 'flex-start',
                                    }}>
                                        <View style={{ paddingLeft: 10 }}>
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    color: '#FFFFF2',
                                                    fontSize: 27,
                                                    fontWeight: '900',
                                                    lineHeight: Platform.OS === 'ios' ? 38 : 32,
                                                    paddingVertical: Platform.OS === 'ios' ? 2 : 0,
                                                    letterSpacing: 0.5,
                                                    textAlign: 'left',
                                                    textShadowColor: 'rgba(50, 18, 0, 0.98)',
                                                    textShadowOffset: { width: 2, height: 3 },
                                                    textShadowRadius: 1,
                                                }}
                                            >
                                                श्रावण मास <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: '400', transform: [{ rotate: '90deg' }] }}>⚜</Text>
                                            </Text>
                                        </View>

                                        <View style={{ width: '100%', alignItems: 'flex-start', paddingLeft: 24, marginTop: Platform.OS === 'android' ? 1 : 0 }}>
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

                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            marginTop: Platform.OS === 'android' ? 1 : 3,
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
                                            हर दिन LIVE श्रावण माह में
                                        </Text>

                                        <UiverseNotifyButton
                                            isNotified={!!reminders['shravan_katha']}
                                            onPress={() => {
                                                onSetReminder('shravan_katha', 'Shravan Shiv Katha');
                                                router.push('/shravan-paath');
                                            }}
                                            label="Notify Me"
                                            notifiedLabel="Notified"
                                            size="small"
                                            style={{
                                                marginTop: Platform.OS === 'android' ? 3 : 5,
                                                alignSelf: 'flex-start',
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })()}

                <View style={[styles.featuredLiveCard, { width: screenWidth - 40 }]}>
                    <ImageBackground source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/hanuman_banner_new.webp' }} style={styles.featuredLiveImage} imageStyle={{ borderRadius: 15 }} resizeMode="cover">
                        <LinearGradient
                            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                            style={styles.featuredLiveOverlay}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

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
                                                                // 🧡 Engagement: Reframed transactional counter "जाप पूर्ण" to devotional offering "चालीसा समर्पित" + proximity "बस X और"
                                                                // Lever: Reframing + Proximity to Completion
                                                                // Why: "समर्पित" evokes spiritual devotion over task completion; showing remaining count triggers Zeigarnik effect.
                                                                // UI: Text-only change, zero layout/visual additions.
                                                                ? `${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} चालीसा समर्पित${(hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession) > 0 ? ` — बस ${hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession} और` : ''}`
                                                                : `${hanumanStatus.roundOfSession}/${hanumanStatus.totalRepsInSession} jaap offered${(hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession) > 0 ? ` — just ${hanumanStatus.totalRepsInSession - hanumanStatus.roundOfSession} more` : ''}`)
                                                : (hanumanStatus.nextSessionStart
                                                    ? (t('language') === 'hi'
                                                        ? `जाप ${formatTime(hanumanStatus.nextSessionStart)} बजे शुरू होगा`
                                                        : `Jaap starts at ${formatTime(hanumanStatus.nextSessionStart)}`)
                                                    : (t('language') === 'hi' ? 'जल्द ही लाइव' : 'Going to be live soon'))}
                                        </Text>
                                    </View>
                                </View>

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
                                    onPress={() => onLiveJaap('hanuman', 'Hanuman Chalisa')}
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
                                    onPress={() => onSetReminder('hanuman', 'Hanuman Chalisa')}
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
                                    onPress={() => onLiveJaap('shiva', 'Om Namah Shivay')}
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
                                    onPress={() => onSetReminder('shiva', 'Mahamrityunjaya Mantra')}
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

            <View style={{ position: 'absolute', bottom: 15, left: 0, right: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 10 }}>
                <View style={{
                    width: activeBannerIndex === 0 ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: activeBannerIndex === 0 ? '#FAC775' : 'rgba(255,255,255,0.4)',
                    shadowColor: activeBannerIndex === 0 ? '#FAC775' : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 2,
                }} />
                <View style={{
                    width: activeBannerIndex === 1 ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: activeBannerIndex === 1 ? '#FAC775' : 'rgba(255,255,255,0.4)',
                    shadowColor: activeBannerIndex === 1 ? '#FAC775' : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 2,
                }} />
                <View style={{
                    width: activeBannerIndex === 2 ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: activeBannerIndex === 2 ? '#FAC775' : 'rgba(255,255,255,0.4)',
                    shadowColor: activeBannerIndex === 2 ? '#FAC775' : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 2,
                }} />
            </View>
        </View>
    );
});

const CityCommunityCard = React.memo(function CityCommunityCard({
    community,
    t,
    onPress,
}: {
    community: any;
    t: (key: string) => string;
    onPress: (params: { id: any; name: string }) => void;
}) {
    const resolvedCityComm = community || {
        id: 'mumbai-fallback',
        name: t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community',
        type: 'city',
        member_count: 1,
    };
    let cityName = resolvedCityComm.name || 'City Community';
    if (cityName === 'City Community' || cityName.toLowerCase().includes('mumbai')) {
        cityName = t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community';
    }
    const cityId = resolvedCityComm.id;
    const rawCityCount = resolvedCityComm.member_count ?? resolvedCityComm.members_count ?? (resolvedCityComm as any).memberCount ?? (Array.isArray(resolvedCityComm.members) ? resolvedCityComm.members.length : 1);
    const cityMembers = (rawCityCount || 1) * 11;
    return (
        <Pressable
            style={({ pressed }) => [
                styles.communityCardMini,
                Platform.OS === 'android' && { overflow: 'hidden' },
                pressed && Platform.OS === 'ios' && { opacity: 0.7 }
            ]}
            android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
            onPress={() => {
                onPress({ id: cityId, name: cityName });
            }}
        >
            <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/mumbai_pin.webp' }} style={styles.communityCardIcon} />
            <View style={[styles.miniCardContent, styles.communityCardTextBlock]}>
                <Text style={[styles.miniCardType, styles.communityCardLabel]}>{t('cityCommunity').toUpperCase()}</Text>
                <Text style={[styles.miniCardTitle, styles.communityCardTitle]} numberOfLines={2} adjustsFontSizeToFit>
                    {cityName}
                </Text>
                <Text style={[styles.miniCardMembers, styles.communityCardMembers]}>{cityMembers} {t('members')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#D1D1D1" />
        </Pressable>
    );
});

const LocalCommunityCard = React.memo(function LocalCommunityCard({
    community,
    t,
    onPress,
}: {
    community: any;
    t: (key: string) => string;
    onPress: (params: { id: any; subgroup: string; name: string }) => void;
}) {
    const resolvedLocalComm = community || {
        id: 'food_pune',
        name: t('language') === 'hi' ? 'पुणे भोजन साझाकरण समूह' : 'Pune Food Sharing Group',
        type: 'user_group',
        member_count: 1,
    };
    const localId = resolvedLocalComm.id;
    let realGroupName = resolvedLocalComm.name || 'Pune Food Sharing Group';
    if (t('language') === 'hi' && realGroupName === 'Pune Food Sharing Group') {
        realGroupName = 'पुणे भोजन साझाकरण समूह';
    }
    const rawLocalCount = resolvedLocalComm.member_count ?? resolvedLocalComm.members_count ?? (resolvedLocalComm as any).memberCount ?? (Array.isArray(resolvedLocalComm.members) ? resolvedLocalComm.members.length : 1);
    const localMembers = (rawLocalCount || 1) * 11;
    const localSubgroup = resolvedLocalComm.type || 'city';
    return (
        <Pressable
            style={({ pressed }) => [
                styles.communityCardMini,
                Platform.OS === 'android' && { overflow: 'hidden' },
                pressed && Platform.OS === 'ios' && { opacity: 0.7 }
            ]}
            android_ripple={{ color: 'rgba(255,107,0,0.15)', borderless: false }}
            onPress={() => {
                onPress({ id: localId, subgroup: localSubgroup, name: realGroupName });
            }}
        >
            <View style={styles.communityCardIconBox}>
                <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/food_sharing.webp' }} style={styles.communityCardIconRound} />
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
    );
});

const CommunityCardsRow = React.memo(function CommunityCardsRow({
    t,
    resolveCityCommunity,
    resolveLocalCommunity,
}: {
    t: (key: string) => string;
    resolveCityCommunity: () => any;
    resolveLocalCommunity: () => any;
}) {
    const router = useRouter();
    return (
        <View style={styles.twoButtonsRow}>
            <CityCommunityCard
                community={resolveCityCommunity()}
                t={t}
                onPress={({ id, name }) => {
                    router.push({
                        pathname: '/community/[id]',
                        params: { id, subgroup: 'city', name }
                    });
                }}
            />
            <LocalCommunityCard
                community={resolveLocalCommunity()}
                t={t}
                onPress={({ id, subgroup, name }) => {
                    router.push({
                        pathname: '/community/[id]',
                        params: { id, subgroup, name }
                    });
                }}
            />
        </View>
    );
});
