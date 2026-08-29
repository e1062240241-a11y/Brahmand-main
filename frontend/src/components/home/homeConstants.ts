import { Dimensions, Platform } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const PAGE_PADDING = 16;
export const CARD_RADIUS = 18;

export const HOME_CARD_TEXTURES = {
    rose: { uri: 'https://brahmandfeed23.b-cdn.net/assets/home_card_bg_rose.webp' },
    peach: { uri: 'https://brahmandfeed23.b-cdn.net/assets/home_card_bg_peach.webp' },
    mint: { uri: 'https://brahmandfeed23.b-cdn.net/assets/home_card_bg_mint.webp' },
    cyan: { uri: 'https://brahmandfeed23.b-cdn.net/assets/home_card_bg_mint.webp' },
    lavender: { uri: 'https://brahmandfeed23.b-cdn.net/assets/home_card_bg_lavender.webp' },
} as const;

export type HomeCardTextureKey = keyof typeof HOME_CARD_TEXTURES;

export const CARD_TEXTURE_OVERLAY: Record<HomeCardTextureKey, readonly [string, string]> = {
    rose: ['rgba(255, 245, 245, 0.72)', 'rgba(255, 220, 220, 0.45)'],
    peach: ['rgba(255, 250, 242, 0.74)', 'rgba(255, 232, 205, 0.48)'],
    mint: ['rgba(242, 255, 248, 0.74)', 'rgba(210, 245, 225, 0.48)'],
    cyan: ['rgba(224, 247, 250, 0.75)', 'rgba(178, 235, 242, 0.48)'],
    lavender: ['rgba(245, 235, 255, 0.74)', 'rgba(220, 205, 250, 0.48)'],
};

export const shivaImage = { uri: 'https://brahmandfeed23.b-cdn.net/temples/SomnathTemple.webp' };
export const communityPhoneImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/community_phone.webp' };
export const kundliChartImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/kundli_chart.webp' };
export const astrologerMockImg = { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Astrologer.webp' };
export const salonMockImg = { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/salon.webp' };
export const electricianMockImg = { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Electrician.webp' };

export const ACTION_CARD_WIDTH = 120;
export const ACTION_CARD_HEIGHT = 180;
export const ACTION_CARD_SNAP_INTERVAL = 130;

export const FEATURE_CARD_WIDTH = Platform.OS === 'android' ? 185 : 175;
export const FEATURE_CARD_HEIGHT = Platform.OS === 'android' ? 82 : 75;
export const FEATURE_SNAP_INTERVAL = FEATURE_CARD_WIDTH + 10;

export const baseQuickAccess = [
    { label: 'My Krishn', subtitle: 'AI Dharma Guidance', color: '#FFF' },
    { label: 'SOS', subtitle: 'Quick help\nfrom Sanatan', color: '#FFF', urgent: true },
    { label: 'Panchang', subtitle: 'Plan with\nVedic wisdom', color: '#FFF' },
    { label: 'Kundli', subtitle: 'Your birth chart insights', color: '#FFF' },
    { label: 'Brahmand Passport', subtitle: 'Track your spiritual journey', color: '#FFF' },
    { label: 'Festival', subtitle: 'Next Festival & Rituals', color: '#FFF' },
    { label: 'Brahmand Library', subtitle: 'Explore Wisdom', color: '#FFF' },
];

export const getDynamicQuickAccess = (_offset: number = 0) => {
    return baseQuickAccess;
};

export const formatFestivalDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = months[monthIndex] || parts[1];
        return `${day} ${monthName} ${year}`;
    }
    return dateStr;
};

export const ROTATING_AARTIS = [
    { id: 'jyotirling-kedarnath-temple-uttarakhand', name: 'Kedarnath Aarti' },
    { id: 'jyotirling-somnath-temple-gujarat', name: 'Somnath Aarti' },
    { id: 'jyotirling-mahakaleshwar-temple-ujjain', name: 'Mahakal Aarti' },
    { id: 'jyotirling-kashi-vishwanath-temple-varanasi', name: 'Kashi Vishwanath Aarti' },
    { id: 'other-shirdi-sai-baba-temple-maharashtra', name: 'Shirdi Sai Baba Aarti' },
    { id: 'other-mahalaxmi-temple', name: 'Shri Mahalakshmi Mandir' },
    { id: 'other-iskcon-temple-bangalore-karnataka', name: 'ISKCON Bangalore' },
    { id: 'other-shri-dwarkadhish-temple-dwarka', name: 'Shri Dwarkadhish Temple' },
    { id: 'other-siddhivinayak-temple-mumbai', name: 'Shree Siddhivinayak Ganapati Temple' },
    { id: 'other-tirupati-balaji-temple-andhra-pradesh', name: 'Tirupati Balaji Temple' }
];
