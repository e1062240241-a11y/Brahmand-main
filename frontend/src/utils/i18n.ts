import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hi';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: async (lang) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
    } catch (e) {
      console.warn('Failed to save language to storage', e);
    }
    set({ language: lang });
  },
  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem('app_language');
      if (stored === 'hi' || stored === 'en') {
        set({ language: stored });
      }
    } catch (e) {
      console.warn('Failed to load language', e);
    }
  },
}));

export const translations = {
  en: {
    // Bottom Tabs
    home: 'Home',
    jaap: 'Jaap',
    explore: 'Explore',
    dm: 'DM',
    profile: 'Profile',
    reels: 'Reels',
    posts: 'Posts',
    community: 'Community',
    temple: 'Temple',
    service: 'Service',
    
    // Profile Screen / Settings
    account: 'Account',
    editProfile: 'Edit Profile',
    manageProfile: 'Manage Profile',
    kycVerification: 'KYC Verification',
    settings: 'Settings',
    settingsTitle: 'Settings and Privacy',
    personalityVerification: 'Personality Verification',
    notifications: 'Notifications',
    privacy: 'Privacy',
    aboutUs: 'About Us',
    location: 'Location',
    language: 'Language',
    communityGuidelines: 'Community Guidelines',
    myCultureGroup: 'My Culture Group',
    logout: 'Logout',
    preferences: 'Preferences',
    support: 'Support',
    postCount: 'Posts',
    followers: 'Followers',
    following: 'Following',
    bio: 'Bio',
    noBio: 'No bio yet',
    culturalCommunity: 'Cultural Community',
    addPost: 'Add Post',
    tapToAddBio: 'Tap to add bio',
    tapToAddLocation: 'Tap to add location',
    
    // Jaap Screen
    communalJaap: 'Communal Jaap',
    dailyTarget: 'Daily Target',
    jaapCounter: 'Jaap Counter',
    completed: 'Completed',
    totalJaapCount: 'Total Jaap Count',
    liveJaapRooms: 'Live Jaap Rooms',
    startJaapSession: 'Start Jaap Session',
    joinRoom: 'Join Room',
    targetReached: 'Target Reached!',
    rounds: 'Rounds',
    chants: 'Chants',
    moreLiveJaaps: 'More Live Jaaps',
    upcomingSpiritualSessions: 'Upcoming Spiritual Sessions',
    searchMandir: 'Search Mandir',
    openInMaps: 'Open in Maps',
    join: 'Join',
    reminder: 'Reminder',
    viewAll: 'View All',
    
    // Feed / Post Card
    likes: 'Likes',
    comments: 'Comments',
    share: 'Share',
    caption: 'Caption',
    viewAllComments: 'View all comments',
    addComment: 'Add a comment...',
    post: 'Post',
    
    // Upload Post Modal
    createPost: 'Create Post',
    applyFilter: 'Apply Filter',
    normal: 'Normal',
    vivid: 'Vivid',
    warm: 'Warm',
    cool: 'Cool',
    postDetails: 'Post Details',
    uploadPlaceholder: 'Upload Photos or Videos',
    camera: 'Camera',
    gallery: 'Gallery',
    files: 'Files',
    publishing: 'Publishing...',
    cancel: 'Cancel',
    save: 'Save',
    aspectRatio: 'Aspect Ratio',
    original: 'Original',
    square: 'Square',
    portrait: 'Portrait',
    
    // Settings / Dialogs / Language Selection
    selectLanguage: 'Select Language',
    english: 'English',
    hindi: 'Hindi',
    changeLanguageSuccess: 'Language changed successfully',
  },
  hi: {
    // Bottom Tabs
    home: 'होम',
    jaap: 'जाप',
    explore: 'खोजें',
    dm: 'चैट',
    profile: 'प्रोफ़ाइल',
    reels: 'रील्स',
    posts: 'पोस्ट',
    community: 'समुदाय',
    temple: 'मंदिर',
    service: 'सेवा',
    
    // Profile Screen / Settings
    account: 'खाता',
    editProfile: 'प्रोफ़ाइल बदलें',
    manageProfile: 'प्रोफ़ाइल प्रबंधित करें',
    kycVerification: 'केवाईसी सत्यापन',
    settings: 'सेटिंग्स',
    settingsTitle: 'सेटिंग्स और गोपनीयता',
    personalityVerification: 'व्यक्तित्व सत्यापन',
    notifications: 'सूचनाएं',
    privacy: 'गोपनीयता',
    aboutUs: 'हमारे बारे में',
    location: 'स्थान',
    language: 'भाषा',
    communityGuidelines: 'सामुदायिक दिशानिर्देश',
    myCultureGroup: 'मेरा सांस्कृतिक समूह',
    logout: 'लॉगआउट',
    preferences: 'पसंद',
    support: 'सहायता',
    postCount: 'पोस्ट',
    followers: 'फ़ॉलोअर्स',
    following: 'फ़ॉलोइंग',
    bio: 'बायो',
    noBio: 'अभी कोई बायो नहीं है',
    culturalCommunity: 'सांस्कृतिक समुदाय',
    addPost: 'पोस्ट जोड़ें',
    tapToAddBio: 'बायो जोड़ने के लिए टैप करें',
    tapToAddLocation: 'स्थान जोड़ने के लिए टैप करें',
    
    // Jaap Screen
    communalJaap: 'सामूहिक जाप',
    dailyTarget: 'दैनिक लक्ष्य',
    jaapCounter: 'जाप काउंटर',
    completed: 'पूरा हुआ',
    totalJaapCount: 'कुल जाप संख्या',
    liveJaapRooms: 'लाइव जाप रूम',
    startJaapSession: 'जाप सत्र शुरू करें',
    joinRoom: 'रूम में शामिल हों',
    targetReached: 'लक्ष्य पूरा हुआ!',
    rounds: 'माला',
    chants: 'मंत्र जाप',
    moreLiveJaaps: 'अन्य लाइव जाप',
    upcomingSpiritualSessions: 'आगामी आध्यात्मिक सत्र',
    searchMandir: 'मंदिर खोजें',
    openInMaps: 'मैप्स में खोलें',
    join: 'शामिल हों',
    reminder: 'रिमाइंडर',
    viewAll: 'सभी देखें',
    
    // Feed / Post Card
    likes: 'पसंद',
    comments: 'टिप्पणियां',
    share: 'साझा करें',
    caption: 'कैप्शन',
    viewAllComments: 'सभी टिप्पणियां देखें',
    addComment: 'एक टिप्पणी जोड़ें...',
    post: 'पोस्ट',
    
    // Upload Post Modal
    createPost: 'पोस्ट बनाएं',
    applyFilter: 'फ़िल्टर लगाएं',
    normal: 'सामान्य',
    vivid: 'ज्वलंत',
    warm: 'गर्म',
    cool: 'ठंडा',
    postDetails: 'पोस्ट विवरण',
    uploadPlaceholder: 'फ़ोटो या वीडियो अपलोड करें',
    camera: 'कैमरा',
    gallery: 'गैलरी',
    files: 'फ़ाइलें',
    publishing: 'प्रकाशित हो रहा है...',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    aspectRatio: 'पहलू अनुपात (आकार)',
    original: 'मूल',
    square: 'चौकोर',
    portrait: 'पोर्ट्रेट',
    
    // Settings / Dialogs / Language Selection
    selectLanguage: 'भाषा चुनें',
    english: 'अंग्रेजी',
    hindi: 'हिंदी',
    changeLanguageSuccess: 'भाषा सफलतापूर्वक बदली गई',
  },
};

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  
  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || String(key);
  };
  
  return { t, language, setLanguage };
};
