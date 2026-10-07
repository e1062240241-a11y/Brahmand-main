import { useVendorStore } from '../../store/vendorStore';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HomeCardTextureBg } from './HomeCardTextureBg';
import { styles } from './home.styles';
import { ACTION_CARD_SNAP_INTERVAL, ROTATING_AARTIS } from './homeConstants';

export interface ActionCommunityRequest {
    id?: string;
    type?: string;
    blood_group?: string;
    hospital_name?: string;
    location?: string;
    title?: string;
    description?: string;
    community_id?: string;
}

export interface ActionVendor {
    id: string;
    business_name?: string;
    categories?: string[];
    full_address?: string;
    kyc_status?: string;
}

export interface ActionAarti {
    id: string;
    name: string;
}

interface BaseCardProps {
    t: (key: string) => string;
    onPress: () => void;
    width: number;
    height: number;
}

interface BloodRequestCardProps extends BaseCardProps {
    request: ActionCommunityRequest | null;
}

interface RegisterBusinessCardProps extends BaseCardProps {
    myVendor: ActionVendor | null;
}

interface VerifiedVendorCardProps extends BaseCardProps {
    displayVendor: ActionVendor | null;
}

interface AartiCardProps extends BaseCardProps {
    aarti: ActionAarti;
    onNotify: () => void;
}

function BloodDropIcon() {
    return (
        <Svg width={34} height={42} viewBox="0 0 20 25">
            <Path d="M18.7486 15.1794C18.7486 17.5474 17.8078 19.8185 16.1335 21.493C14.459 23.1673 12.1879 24.1081 9.8199 24.1081C7.4519 24.1081 5.18084 23.1673 3.50638 21.493C1.83192 19.8185 0.891235 17.5474 0.891235 15.1794C0.891235 7.14361 9.8199 0.893555 9.8199 0.893555C9.8199 0.893555 18.7486 7.14361 18.7486 15.1794Z" fill="#FF0000" />
            <Path d="M14.9556 4.43617C13.577 2.84402 12.0254 1.41031 10.3295 0.161581C10.1794 0.0564114 10.0005 0 9.81719 0C9.63392 0 9.45502 0.0564114 9.30491 0.161581C7.61214 1.41083 6.06349 2.84452 4.68767 4.43617C1.61956 7.95965 0.00012207 11.674 0.00012207 15.1785C0.00012207 17.7833 1.03489 20.2814 2.87678 22.1233C4.71867 23.9653 7.21683 25 9.82165 25C12.4265 25 14.9246 23.9653 16.7665 22.1233C18.6085 20.2814 19.6432 17.7833 19.6432 15.1785C19.6432 11.674 18.0237 7.95965 14.9556 4.43617ZM9.82165 23.2143C7.69116 23.2119 5.64858 22.3645 4.14209 20.858C2.63561 19.3515 1.78822 17.309 1.78586 15.1785C1.78586 8.79114 7.97676 3.4596 9.82165 2.0087C11.6665 3.4596 17.8574 8.7889 17.8574 15.1785C17.8551 17.309 17.0077 19.3515 15.5012 20.858C13.9947 22.3645 11.9521 23.2119 9.82165 23.2143ZM16.0594 16.2209C15.828 17.5141 15.2057 18.7053 14.2766 19.6342C13.3476 20.5631 12.1562 21.185 10.863 21.4163C10.8138 21.4241 10.7642 21.4282 10.7145 21.4285C10.4905 21.4284 10.2748 21.3443 10.11 21.1926C9.9452 21.0409 9.84352 20.8328 9.825 20.6096C9.80637 20.3863 9.87243 20.1644 10.0099 19.9876C10.1474 19.8108 10.3463 19.6921 10.5672 19.6551C12.4165 19.3437 13.9858 17.7745 14.2994 15.9218C14.339 15.6882 14.4698 15.48 14.663 15.3429C14.8562 15.2058 15.0959 15.1511 15.3295 15.1907C15.5631 15.2304 15.7713 15.3613 15.9084 15.5544C16.0455 15.7476 16.0991 15.9873 16.0594 16.2209Z" fill="#890000" />
        </Svg>
    );
}

function LotusIcon() {
    return (
        <Image
            source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/sai_flower_lotus_icon.webp' }}
            style={styles.saiLotusIcon}
            resizeMode="contain"
            accessibilityLabel="Lotus flower"
        />
    );
}

function TempleIcon() {
    return (
        <Image
            source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/home_temple_icon.webp' }}
            style={styles.actionCardIcon}
            resizeMode="contain"
            accessibilityLabel="Temple"
        />
    );
}

function ShopIcon() {
    return (
        <Image
            source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/home_shop_icon.webp' }}
            style={styles.actionCardIcon}
            resizeMode="contain"
            accessibilityLabel="Shop"
        />
    );
}

/**
 * 🎨 Varnish Optimizations:
 * 1. Replaced `any` types on card props & data structures with strict TypeScript interfaces (`ActionCommunityRequest`, `ActionVendor`, `ActionAarti`).
 * 2. Extracted heavy inline style objects across cards to `StyleSheet.create` to eliminate style object re-allocations on every render.
 * 3. Wrapped navigation and notification event handlers in `useCallback` inside `ActionCardsRow` so `React.memo` on child card components prevents unnecessary re-renders when active index timer state changes.
 */

const cardStyles = StyleSheet.create({
    cardWrapper: {
        position: 'relative',
        overflow: 'visible',
        marginHorizontal: 3,
    },
    cardInner: {
        width: '100%',
        height: '100%',
        marginHorizontal: 0,
        padding: 0,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
        paddingHorizontal: 6,
    },
    iconWrapper: {
        marginBottom: 6,
        marginTop: -4,
    },
    cardTitle: {
        textAlign: 'center',
        fontSize: 13,
        color: '#000',
        width: '100%',
        lineHeight: 16,
        fontFamily: 'Inter_700Bold',
    },
    cardSubtitle: {
        textAlign: 'center',
        fontSize: 11,
        color: '#444',
        width: '100%',
        marginTop: 4,
        lineHeight: 14,
        fontFamily: 'Inter_500Medium',
    },
    badgeWrapper: {
        position: 'absolute',
        top: -10,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    badgeContainer: {
        height: 20,
        borderRadius: 10,
        borderWidth: 1.2,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        elevation: 3,
    },
    badgeText: {
        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'Inter_600SemiBold',
    },
    actionBtn: {
        width: '85%',
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        marginBottom: 10,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'Inter_700Bold',
    },
    notifyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    notifyText: {
        textAlign: 'center',
        fontSize: 10,
        color: '#444',
        fontFamily: 'Inter_500Medium',
        marginRight: 3,
    },
});

const BloodRequestCard = React.memo(function BloodRequestCard({
    request,
    t,
    onPress,
    width,
    height,
}: BloodRequestCardProps) {
    const requestTitle = request
        ? (request.type === 'blood' ? `${request.blood_group || 'Blood'} ${t('bloodRequired')}` : (request.title || 'Community Help'))
        : '';
    const requestDetails = request
        ? (request.type === 'blood' ? `${request.hospital_name || t('emergency')}\n${request.location || t('nearby')}` : (request.description || request.location || 'Nearby'))
        : '';
    return (
        <View style={[cardStyles.cardWrapper, { width, height }]}>
            <View style={[styles.actionCard, cardStyles.cardInner]}>
                <HomeCardTextureBg texture="rose">
                    <View style={cardStyles.cardContent}>
                        <View style={cardStyles.iconWrapper}>
                            {request?.type === 'blood' ? (
                                <BloodDropIcon />
                            ) : (
                                <Ionicons name="people-outline" size={26} color="#FF0022" />
                            )}
                        </View>
                        <Text style={cardStyles.cardTitle} numberOfLines={2}>{request ? requestTitle : t('needBlood')}</Text>
                        <Text style={cardStyles.cardSubtitle} numberOfLines={2}>{request ? requestDetails : t('createUrgentRequest')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { backgroundColor: '#FF0022', shadowColor: '#FF0022' }]}
                        onPress={onPress}
                    >
                        <Text style={cardStyles.actionBtnText} numberOfLines={1}>{t('view')}</Text>
                    </TouchableOpacity>
                </HomeCardTextureBg>
            </View>
            <View style={cardStyles.badgeWrapper}>
                <View style={[cardStyles.badgeContainer, { borderColor: '#FF0000' }]}>
                    <Text style={[cardStyles.badgeText, { color: '#FF0000' }]} numberOfLines={1}>{t('yourCommunity')}</Text>
                </View>
            </View>
        </View>
    );
});

const RegisterBusinessCard = React.memo(function RegisterBusinessCard({
    myVendor,
    t,
    onPress,
    width,
    height,
}: RegisterBusinessCardProps) {
    return (
        <View style={[cardStyles.cardWrapper, { width, height }]}>
            <View style={[styles.actionCard, cardStyles.cardInner]}>
                <HomeCardTextureBg texture="peach">
                    <View style={cardStyles.cardContent}>
                        <View style={cardStyles.iconWrapper}>
                            <ShopIcon />
                        </View>
                        <Text style={cardStyles.cardTitle} numberOfLines={2}>{myVendor ? t('manageYour') : t('becomeVerified')}</Text>
                        <Text style={cardStyles.cardSubtitle} numberOfLines={2}>{myVendor ? t('businessProfile') : t('sanatanVendor')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { backgroundColor: '#FF9500', shadowColor: '#FF9500' }]}
                        onPress={onPress}
                    >
                        <Text style={cardStyles.actionBtnText} numberOfLines={1}>{myVendor ? t('manage') : t('register')}</Text>
                    </TouchableOpacity>
                </HomeCardTextureBg>
            </View>
            <View style={cardStyles.badgeWrapper}>
                <View style={[cardStyles.badgeContainer, { borderColor: '#FF9500' }]}>
                    <Text style={[cardStyles.badgeText, { color: '#FF9500' }]} numberOfLines={1}>{myVendor ? (myVendor.kyc_status === 'verified' ? t('approved') : t('pending')) : t('free')}</Text>
                </View>
            </View>
        </View>
    );
});

const VerifiedVendorCard = React.memo(function VerifiedVendorCard({
    displayVendor,
    t,
    onPress,
    width,
    height,
}: VerifiedVendorCardProps) {
    const businessName = displayVendor ? displayVendor.business_name : 'Sai Flower Decorator';
    const categoryAndLoc = displayVendor
        ? `${displayVendor.categories?.[0] || 'Decor'}\n${displayVendor.full_address || 'Nearby'}`
        : 'Flower Decor\nAndheri West';
    return (
        <View style={[cardStyles.cardWrapper, { width, height }]}>
            <View style={[styles.actionCard, cardStyles.cardInner]}>
                <HomeCardTextureBg texture="mint">
                    <View style={cardStyles.cardContent}>
                        <View style={cardStyles.iconWrapper}>
                            <LotusIcon />
                        </View>
                        <Text style={cardStyles.cardTitle} numberOfLines={2}>{businessName}</Text>
                        <Text style={cardStyles.cardSubtitle} numberOfLines={2}>{categoryAndLoc}</Text>
                    </View>
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { backgroundColor: '#00C781', shadowColor: '#00C781' }]}
                        onPress={onPress}
                    >
                        <Text style={cardStyles.actionBtnText} numberOfLines={1}>{t('view')}</Text>
                    </TouchableOpacity>
                </HomeCardTextureBg>
            </View>
            <View style={cardStyles.badgeWrapper}>
                <View style={[cardStyles.badgeContainer, { borderColor: '#00C781' }]}>
                    <Text style={[cardStyles.badgeText, { color: '#00C781' }]} numberOfLines={1}>{t('verifiedVendor')}</Text>
                </View>
            </View>
        </View>
    );
});

const AartiCard = React.memo(function AartiCard({
    aarti,
    t,
    onPress,
    onNotify,
    width,
    height,
}: AartiCardProps) {
    return (
        <View style={[cardStyles.cardWrapper, { width, height }]}>
            <View style={[styles.actionCard, cardStyles.cardInner]}>
                <HomeCardTextureBg texture="lavender">
                    <View style={cardStyles.cardContent}>
                        <View style={cardStyles.iconWrapper}>
                            <TempleIcon />
                        </View>
                        <Text style={cardStyles.cardTitle} numberOfLines={2}>{aarti.name}</Text>
                        <View style={cardStyles.notifyRow}>
                            <Text style={cardStyles.notifyText}>
                                {t('notify')} {t('me')}
                            </Text>
                            <TouchableOpacity
                                onPress={onNotify}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityRole="button"
                                accessibilityLabel={`${t('notify')} ${t('me')} for ${aarti.name}`}
                            >
                                <Ionicons name="notifications-outline" size={14} color="#444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { backgroundColor: '#8C36DB', shadowColor: '#8C36DB' }]}
                        onPress={onPress}
                    >
                        <Text style={cardStyles.actionBtnText} numberOfLines={1}>{t('watch')}</Text>
                    </TouchableOpacity>
                </HomeCardTextureBg>
            </View>
            <View style={cardStyles.badgeWrapper}>
                <View style={[cardStyles.badgeContainer, { borderColor: '#8C36DB' }]}>
                    <Text style={[cardStyles.badgeText, { color: '#8C36DB' }]} numberOfLines={1}>{t('templeLabel')}</Text>
                </View>
            </View>
        </View>
    );
});

export const ActionCardsRow = React.memo(function ActionCardsRow({
    t,
    safeCommunityRequests,
}: {
    t: (key: string) => string;
    safeCommunityRequests: ActionCommunityRequest[];
}) {
    const router = useRouter();
    const isFocused = useIsFocused();
    const { myVendor, vendors } = useVendorStore();
    const actionCardWidth = 132;
    const actionCardHeight = 192;
    const actionCardSnapInterval = 138;
    const actionCardsScrollRef = useRef<ScrollView>(null);
    const [activeAartiIndex, setActiveAartiIndex] = useState(0);
    const [activeVendorIndex, setActiveVendorIndex] = useState(0);
    const [activeRequestIndex, setActiveRequestIndex] = useState(0);

    useEffect(() => {
        if (!isFocused) return;

        const aartiInterval = setInterval(() => {
            if (AppState.currentState !== 'active') return;
            setActiveAartiIndex(prev => (prev + 1) % ROTATING_AARTIS.length);
            setActiveRequestIndex(prev => prev + 1);
        }, 5000);

        const vendorInterval = setInterval(() => {
            if (AppState.currentState !== 'active') return;
            setActiveVendorIndex(prev => prev + 1);
        }, 6000);

        return () => {
            clearInterval(aartiInterval);
            clearInterval(vendorInterval);
        };
    }, [isFocused]);

    const req = safeCommunityRequests.length > 0 ? safeCommunityRequests[activeRequestIndex % safeCommunityRequests.length] : null;

    const verifiedVendors = vendors.filter(v => v.kyc_status === 'verified');
    const targetList = verifiedVendors.length > 0 ? verifiedVendors : (vendors.length > 0 ? vendors : []);
    const displayVendor = targetList.length > 0 ? targetList[activeVendorIndex % targetList.length] : null;

    const aarti1 = ROTATING_AARTIS[activeAartiIndex % ROTATING_AARTIS.length];
    const aarti2 = ROTATING_AARTIS[(activeAartiIndex + 1) % ROTATING_AARTIS.length];

    const handleBloodRequestPress = useCallback(() => {
        if (req) {
            router.push({
                pathname: '/community-request/list',
                params: {
                    requestId: req.id,
                    community_id: req.community_id,
                },
            });
        } else {
            router.push('/community-request/list');
        }
    }, [router, req]);

    const handleRegisterBusinessPress = useCallback(() => {
        if (myVendor) {
            router.push(`/vendor/${myVendor.id}`);
        } else {
            router.push('/(tabs)/vendor');
        }
    }, [router, myVendor]);

    const handleVerifiedVendorPress = useCallback(() => {
        if (displayVendor) {
            router.push(`/vendor/${displayVendor.id}`);
        } else {
            router.push('/(tabs)/vendor');
        }
    }, [router, displayVendor]);

    const handleAarti1Press = useCallback(() => {
        router.push(`/temple/${encodeURIComponent(aarti1.id)}?autoplayAarti=true`);
    }, [router, aarti1.id]);

    const handleAarti1Notify = useCallback(() => {
        Alert.alert('Notification Set', `We'll notify you when ${aarti1.name} starts.`);
    }, [aarti1.name]);

    const handleAarti2Press = useCallback(() => {
        router.push(`/temple/${encodeURIComponent(aarti2.id)}?autoplayAarti=true`);
    }, [router, aarti2.id]);

    const handleAarti2Notify = useCallback(() => {
        Alert.alert('Notification Set', `We'll notify you when ${aarti2.name} starts.`);
    }, [aarti2.name]);

    return (
        <View style={styles.postBannerSection}>
            <ScrollView
                ref={actionCardsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                snapToInterval={actionCardSnapInterval}
                decelerationRate="fast"
                contentContainerStyle={styles.actionCardsScroll}
                style={[styles.actionCardsScrollView, { marginBottom: 10 }]}
            >
                <BloodRequestCard
                    request={req}
                    t={t}
                    width={actionCardWidth}
                    height={actionCardHeight}
                    onPress={handleBloodRequestPress}
                />
                <RegisterBusinessCard
                    myVendor={myVendor}
                    t={t}
                    width={actionCardWidth}
                    height={actionCardHeight}
                    onPress={handleRegisterBusinessPress}
                />
                <VerifiedVendorCard
                    displayVendor={displayVendor}
                    t={t}
                    width={actionCardWidth}
                    height={actionCardHeight}
                    onPress={handleVerifiedVendorPress}
                />
                <AartiCard
                    aarti={aarti1}
                    t={t}
                    width={actionCardWidth}
                    height={actionCardHeight}
                    onPress={handleAarti1Press}
                    onNotify={handleAarti1Notify}
                />
                <AartiCard
                    aarti={aarti2}
                    t={t}
                    width={actionCardWidth}
                    height={actionCardHeight}
                    onPress={handleAarti2Press}
                    onNotify={handleAarti2Notify}
                />
            </ScrollView>
        </View>
    );
});
