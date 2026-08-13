import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
  TextInput,
  Animated,
  Keyboard,
  Pressable,
  StatusBar
  , DeviceEventEmitter, KeyboardAvoidingView, Share, ActionSheetIOS, BackHandler
} from 'react-native';
import { useTabBar } from '../../src/contexts/TabBarContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../../src/utils/i18n';
import { useScrollToHideTabBar } from '../../src/utils/scroll';
import { getSafeImagePicker } from '../../src/utils/safeImagePicker';
import { useAuthStore } from '../../src/store/authStore';
import { useUploadStore } from '../../src/store/uploadStore';
import api, {
  getUserProfile,
  viewPost,
  deletePost,
  updatePost,
  togglePostLike,
  getPostComments,
  deletePostComment,
  addPostComment,
  repostPost,
  reportPost,
  uploadUserPost,
  updateProfile,
  uploadChatMedia,
  setupDualLocation,
} from '../../src/services/api';
import SharePostModal from '../../src/components/SharePostModal';
import UploadPostModal from '../../src/components/UploadPostModal';
import { Avatar, hasCustomPhoto } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';
import { DeleteConfirmationModal } from '../../src/components/DeleteConfirmationModal';
import { COLORS, SPACING } from '../../src/constants/theme';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const COLUMN_WIDTH = (width - GRID_GAP * 4) / 3;
const AVATAR_SIZE = 100;
const NAV_BAR_HEIGHT = 48;
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1604537466158-719b1972fb17?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

type SettingItem = {
  id: string;
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
  subLabel?: string;
  value?: string;
  action?: 'logout';
  color?: string;
};

export default function ProfileScreen() {
  const { t, language, setLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const userId = user?.id;
  const activeUserIdRef = useRef<string | undefined>(userId);
  const requestSequenceRef = useRef(0); // ponytail: track request sequence to avoid race conditions
  const isFetchingRef = useRef(false); // ponytail: track fetch state to prevent overlapping calls
  const scrollY = useRef(new Animated.Value(0)).current;
  const onProfileScrollTabBar = useScrollToHideTabBar();

  const navTitleOpacity = scrollY.interpolate({
    inputRange: [100, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (section === 'personality_verification') {
      router.push('/profile/personality-verification');
    }
  }, [section]);

  const SETTINGS_SECTIONS = useMemo<{ id: string; title: string; items: SettingItem[] }[]>(() => {
    if (Platform.OS === 'android') {
      return [
        {
          id: 'account',
          title: t('account'),
          items: [
            { id: 'edit', icon: 'person-circle-outline', label: t('manageProfile'), route: '/profile/edit' },
            { id: 'kyc', icon: 'globe-outline', label: t('kycVerification'), route: '/kyc' },
            { id: 'notifications', icon: 'notifications-outline', label: t('notifications'), route: '/settings/notifications' },
            { id: 'privacy', icon: 'lock-closed-outline', label: t('privacy'), route: '/settings/privacy', disabled: false },
          ],
        },
        {
          id: 'preferences',
          title: t('preferences'),
          items: [
            { id: 'about_us', icon: 'information-circle-outline', label: t('aboutUs'), route: '/settings/about' },
            { id: 'location', icon: 'location-outline', label: t('location'), route: '/settings/location', disabled: false },
            { id: 'language', icon: 'language-outline', label: t('languageLabel'), value: language === 'en' ? t('english') : t('hindi') },
          ],
        },
        {
          id: 'support',
          title: t('support'),
          items: [
            { id: 'guidelines', icon: 'document-text-outline', label: t('communityGuidelines'), route: '/settings/guidelines' },
            { id: 'logout', icon: 'log-out-outline', label: t('logout'), action: 'logout' },
          ],
        },
      ];
    }

    return [
      {
        id: 'account',
        title: t('account'),
        items: [
          { id: 'edit', icon: 'person-circle', label: t('manageProfile'), route: '/profile/edit', color: '#F97316' },
          { id: 'kyc', icon: 'shield-checkmark', label: t('kycVerification'), route: '/kyc', color: '#FB923C' },
          { id: 'personality_verification', icon: 'ribbon', label: t('personalityVerification'), route: '/profile/personality-verification', color: '#D4AF37' },
          { id: 'notifications', icon: 'notifications', label: t('notifications'), route: '/settings/notifications', color: '#F59E0B' },
          { id: 'privacy', icon: 'lock-closed', label: t('privacy'), route: '/settings/privacy', disabled: false, color: '#D97706' },
        ],
      },
      {
        id: 'preferences',
        title: t('preferences'),
        items: [
          { id: 'location', icon: 'location', label: t('location'), route: '/settings/location', disabled: false, color: '#EA580C' },
          { id: 'language', icon: 'language', label: t('languageLabel'), value: language === 'en' ? t('english') : t('hindi'), disabled: false, color: '#B45309' },
        ],
      },
      {
        id: 'support',
        title: t('support'),
        items: [
          { id: 'guidelines', icon: 'document-text', label: t('communityGuidelines'), route: '/settings/guidelines', color: '#92400E' },
          { id: 'logout', icon: 'log-out', label: t('logout'), action: 'logout', color: '#B91C1C' },
        ],
      },
    ];
  }, [language]);

  const [profile, setProfile] = useState<any>(user || null);
  const [loading, setLoading] = useState(!user);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const LIMIT = 15;

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [activePostKey, setActivePostKey] = useState<string | null>(null);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const postHeightsRef = useRef<Record<string, number>>({});
  const postListRef = useRef<FlatList>(null);
  const hasScrolledToPost = useRef(false);
  const [activeTab, setActiveTab] = useState('grid');

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Tab bar visibility control
  let showTabBar: (() => void) | undefined;
  let hideTabBar: (() => void) | undefined;
  try {
    const tabBar = useTabBar();
    showTabBar = tabBar.showTabBar;
    hideTabBar = tabBar.hideTabBar;
  } catch (e) { }

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      if (commentModalVisible) {
        setCommentModalVisible(false);
        return true;
      }
      if (showLanguageModal) {
        setShowLanguageModal(false);
        return true;
      }
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return true;
      }
      if (postModalVisible) {
        setPostModalVisible(false);
        showTabBar?.();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [postModalVisible, commentModalVisible, showLanguageModal, showSettingsModal]);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [selectedCommentPost, setSelectedCommentPost] = useState<any | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [savingProfileField, setSavingProfileField] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any | null>(null);
  const handleUploadStart = async (
    media: any,
    caption: string,
    filterName?: string,
    communityLevel: string = 'city',
    category: string = 'feed',
    mediaWidth?: number,
    mediaHeight?: number,
    cropOffsetX?: number,
    cropOffsetY?: number,
    originalWidth?: number,
    originalHeight?: number
  ) => {
    useUploadStore.getState().startBackgroundUpload({
      uri: media.uri,
      type: media.mimeType,
      name: media.name,
      mediaType: media.mediaType,
      caption,
      selectedFilter: filterName || 'Normal',
      communityLevel,
      uploadCategory: category,
      mediaWidth,
      mediaHeight,
      offsetXPercent: cropOffsetX,
      offsetYPercent: cropOffsetY,
      originalWidth,
      originalHeight
    });
  };

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  }, []);

  const fetchProfile = useCallback(async (showLoading = true) => {
    console.log('[Profile] fetchProfile called, userId:', userId);
    if (!userId || userId.toLowerCase().trim() === 'undefined' || userId.toLowerCase().trim() === 'null' || userId.toLowerCase().trim() === 'none') {
      console.log('[Profile] no userId in fetchProfile');
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    const requestedUserId = userId;
    try {
      const res = await getUserProfile();
      if (requestedUserId !== activeUserIdRef.current) return;
      const nextProfile = res.data || {};
      setProfile(nextProfile);
      updateUser(nextProfile);
    } catch (error: any) {
      if (requestedUserId !== activeUserIdRef.current) return;
      console.error('Error fetching profile:', error);
      if (error && error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      console.error('Error message:', error?.message);
      setProfile(user || null);
      if (error?.response?.status === 401 || error?.response?.status === 502) {
        console.log('[Profile] auth error, logging out');
        await logout();
        router.replace('/');
      }
    } finally {
      if (requestedUserId === activeUserIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [logout, router, updateUser, userId]);

  useEffect(() => {
    const loadSavedCount = async () => {
      try {
        const raw = await AsyncStorage.getItem(`saved_posts_${userId}`);
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setSavedCount(0);
      }
    };
    if (userId) loadSavedCount();
  }, [userId]);

  const uploadProfileImage = async (
    asset: any,
    field: 'photo' | 'cover_photo'
  ) => {
    showToast(field === 'photo' ? 'Uploading profile photo...' : 'Uploading cover photo...');
    const file = {
      uri: asset.uri,
      name: asset.fileName || (field === 'photo' ? 'avatar.webp' : 'cover.webp'),
      type: asset.mimeType || 'image/jpeg',
    };
    const uploadRes = await uploadChatMedia(file);
    const url = uploadRes.data.url || uploadRes.data.mediaUrl;
    if (!url) throw new Error('Upload failed');
    await updateProfile({ [field]: url } as any);
    await fetchProfile(false);

    // Invalidate image cache so updates show immediately
    if (Platform.OS !== 'web') {
      try {
        const { Image: ExpoImage } = require('expo-image');
        await ExpoImage.clearMemoryCache();
      } catch (err) {
        console.warn('Failed to clear Expo Image memory cache:', err);
      }
    }

    showToast(field === 'photo'
      ? (t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो अपडेट हो गई!' : 'Profile photo updated!')
      : (t('language') === 'hi' ? 'कवर फ़ोटो अपडेट हो गई!' : 'Cover photo updated!')
    );
  };

  const pickProfileImage = async (field: 'photo' | 'cover_photo', source: 'library' | 'camera') => {
    try {
      const ImagePicker = getSafeImagePicker();
      if (!ImagePicker) {
        showToast('Image picker native module is not available. Rebuild app with npx expo run:android.');
        return;
      }
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                title: t('language') === 'hi' ? 'अनुमति की आवश्यकता है' : 'Permission needed',
                message: t('language') === 'hi' ? 'फ़ोटो लेने के लिए कैमरा एक्सेस की अनुमति दें।' : 'Allow camera access to take a photo.',
                options: ['OK'],
                cancelButtonIndex: 0,
              },
              () => { }
            );
          } else {
            Alert.alert(
              t('language') === 'hi' ? 'अनुमति की आवश्यकता है' : 'Permission needed',
              t('language') === 'hi' ? 'फ़ोटो लेने के लिए कैमरा एक्सेस की अनुमति दें।' : 'Allow camera access to take a photo.'
            );
          }
          return;
        }
      }
      const launcher =
        source === 'camera'
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;
      const result = await launcher({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: field === 'photo' ? [1, 1] : undefined,
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.length) {
        await uploadProfileImage(result.assets[0], field);
      }
    } catch (error) {
      console.error(error);
      showToast(t('language') === 'hi' ? 'छवि अपलोड करने में विफल' : 'Failed to upload image');
    }
  };

  const showImageSourcePicker = (field: 'photo' | 'cover_photo') => {
    const title = field === 'photo'
      ? (t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो' : 'Profile photo')
      : (t('language') === 'hi' ? 'कवर फ़ोटो' : 'Cover photo');
    if (Platform.OS === 'web') {
      pickProfileImage(field, 'library');
      return;
    }

    const optionsList = [
      { text: t('language') === 'hi' ? 'गैलरी' : 'Gallery', onPress: () => pickProfileImage(field, 'library') },
      { text: t('language') === 'hi' ? 'कैमरा' : 'Camera', onPress: () => pickProfileImage(field, 'camera') },
      { text: t('cancel'), onPress: () => { }, style: 'cancel' },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: optionsList.map(o => o.text),
          cancelButtonIndex: 2,
          title,
          message: t('language') === 'hi' ? 'स्रोत चुनें' : 'Choose a source',
        },
        (buttonIndex) => {
          optionsList[buttonIndex]?.onPress();
        }
      );
    } else {
      Alert.alert(
        title,
        t('language') === 'hi' ? 'स्रोत चुनें' : 'Choose a source',
        optionsList.map(o => ({
          text: o.text,
          onPress: o.onPress,
          style: o.style as any,
        })),
        { cancelable: true }
      );
    }
  };


  const removeProfilePhoto = async () => {
    showToast(t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो हटाई जा रही है...' : 'Removing profile photo...');
    try {
      await updateProfile({ photo: '' });
      await fetchProfile(false);

      // Invalidate image cache so updates show immediately
      if (Platform.OS !== 'web') {
        try {
          const { Image: ExpoImage } = require('expo-image');
          await ExpoImage.clearMemoryCache();
        } catch (err) {
          console.warn('Failed to clear Expo Image memory cache:', err);
        }
      }

      showToast(t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो हटा दी गई!' : 'Profile photo removed!');
    } catch (error) {
      console.error(error);
      showToast(t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो हटाने में विफल' : 'Failed to remove profile photo');
    }
  };

  const confirmRemoveProfilePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो हटाएँ' : 'Remove Profile Photo',
          message: t('language') === 'hi' ? 'क्या आप वाकई अपनी प्रोफ़ाइल फ़ोटो हटाना चाहते हैं?' : 'Are you sure you want to remove your profile photo?',
          options: [
            t('cancel'),
            t('language') === 'hi' ? 'हटाएँ' : 'Remove',
          ],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            removeProfilePhoto();
          }
        }
      );
    } else {
      Alert.alert(
        t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो हटाएँ' : 'Remove Profile Photo',
        t('language') === 'hi' ? 'क्या आप वाकई अपनी प्रोफ़ाइल फ़ोटो हटाना चाहते हैं?' : 'Are you sure you want to remove your profile photo?',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('language') === 'hi' ? 'हटाएँ' : 'Remove', style: 'destructive', onPress: removeProfilePhoto },
        ],
        { cancelable: true }
      );
    }
  };

  const showAvatarOptions = () => {
    const photoUrl = profile?.photo || user?.photo;
    const hasPhoto = hasCustomPhoto(photoUrl);

    if (!hasPhoto) {
      showImageSourcePicker('photo');
    } else {
      const title = t('language') === 'hi' ? 'प्रोफ़ाइल फ़ोटो' : 'Profile photo';
      const optionsList = [
        { text: t('language') === 'hi' ? 'फ़ोटो देखें' : 'View Profile Photo', onPress: () => setAvatarModalVisible(true) },
        { text: t('language') === 'hi' ? 'फ़ोटो बदलें' : 'Change Profile Photo', onPress: () => showImageSourcePicker('photo') },
        { text: t('language') === 'hi' ? 'फ़ोटो हटाएँ' : 'Remove Profile Photo', onPress: confirmRemoveProfilePhoto, style: 'destructive' },
        { text: t('cancel'), onPress: () => { }, style: 'cancel' },
      ];

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: optionsList.map(o => o.text),
            cancelButtonIndex: 3,
            destructiveButtonIndex: 2,
            title,
          },
          (buttonIndex) => {
            optionsList[buttonIndex]?.onPress();
          }
        );
      } else {
        Alert.alert(
          title,
          t('language') === 'hi' ? 'विकल्प चुनें' : 'Choose an option',
          optionsList.map(o => ({
            text: o.text,
            onPress: o.onPress,
            style: o.style as any,
          })),
          { cancelable: true }
        );
      }
    }
  };

  const handleShareProfile = async () => {
    const username = profile?.sl_id || user?.sl_id || 'profile';
    const displayName = profile?.name || user?.name || 'User';
    const profileUrl = `https://brahmand.app/profile/${userId}`;
    const message = t('language') === 'hi'
      ? `ब्रह्मांड पर ${displayName} (@${username}) को देखें!\n\n${profileUrl}`
      : `Check out ${displayName} (@${username}) on Brahmand!\n\n${profileUrl}`;
    try {
      await Share.share({
        message,
        url: profileUrl,
        title: t('language') === 'hi' ? `ब्रह्मांड पर ${displayName}` : `${displayName} on Brahmand`,
      });
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase();
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        showToast(t('language') === 'hi' ? 'प्रोफ़ाइल साझा नहीं की जा सकी' : 'Could not share profile');
      }
    }
  };

  const openBioEditor = () => {
    setBioDraft(profile?.bio || user?.bio || '');
    setShowBioModal(true);
  };

  const openLocationEditor = () => {
    const loc = profile?.home_location || user?.home_location;
    setLocationDraft(loc ? `${loc.city || ''}, ${loc.state || ''}`.replace(/^,\s*|,\s*$/g, '') : '');
    setShowLocationModal(true);
  };

  const saveBio = async () => {
    setSavingProfileField(true);
    try {
      await updateProfile({ bio: bioDraft.trim() });
      await fetchProfile(false);
      setShowBioModal(false);
      showToast(t('language') === 'hi' ? 'बायो अपडेट हो गया' : 'Bio updated');
    } catch {
      showToast(t('language') === 'hi' ? 'बायो अपडेट करने में विफल' : 'Failed to update bio');
    } finally {
      setSavingProfileField(false);
    }
  };

  const saveLocation = async () => {
    const parts = locationDraft.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: t('language') === 'hi' ? 'स्थान' : 'Location',
            message: t('language') === 'hi' ? 'स्थान को शहर, राज्य के रूप में दर्ज करें' : 'Enter location as City, State',
            options: ['OK'],
            cancelButtonIndex: 0,
          },
          () => { }
        );
      } else {
        Alert.alert(
          t('language') === 'hi' ? 'स्थान' : 'Location',
          t('language') === 'hi' ? 'स्थान को शहर, राज्य के रूप में दर्ज करें' : 'Enter location as City, State'
        );
      }
      return;
    }
    setSavingProfileField(true);
    try {
      await setupDualLocation({
        home_location: {
          country: 'India',
          city: parts[0],
          state: parts[1],
          area: parts[0],
        },
      });
      await fetchProfile(false);
      setShowLocationModal(false);
      showToast(t('language') === 'hi' ? 'स्थान अपडेट हो गया' : 'Location updated');
    } catch {
      showToast(t('language') === 'hi' ? 'स्थान अपडेट करने में विफल' : 'Failed to update location');
    } finally {
      setSavingProfileField(false);
    }
  };

  const loadPosts = useCallback(async (reset = false, silent = false) => {
    if (!userId) return;

    if (!reset && !hasMore) return;

    const currentOffset = reset ? 0 : offset;

    if (!silent) {
      setPostsLoading(true);
    }

    try {
      const { getMyPosts } = require('../../src/services/api');
      const response = await getMyPosts(6, currentOffset);
      const payload = response.data;
      const incomingPosts = payload?.posts || [];

      // Strict validation: every post must belong to the logged-in user
      const validated: any[] = [];
      const seenIds = new Set<string>();
      for (const p of incomingPosts) {
        if (!p || p.id === undefined || p.id === null || String(p.id).trim() === '') {
          continue;
        }
        if (p.user_id !== userId) {
          console.error(`SECURITY VIOLATION: Post ${p.id} belongs to user ${p.user_id} but was returned for user ${userId}!`);
          continue;
        }
        const idStr = String(p.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          validated.push(p);
        }
      }

      const nextOffset = currentOffset + validated.length;
      const nextHasMore = !payload?.has_reached_end;

      setPosts(prev => {
        if (reset) return validated;
        const existingIds = new Set(prev.map(x => String(x.id)));
        const deduplicated = validated.filter(x => !existingIds.has(String(x.id)));
        return [...prev, ...deduplicated];
      });
      setPostsCount(payload?.total || 0);
      setOffset(nextOffset);
      setHasMore(nextHasMore);
    } catch (err) {
      console.warn('Failed to load posts on profile:', err);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  }, [userId, offset, hasMore]);



  const handleUploadPostSuccess = () => {
    setShowUploadModal(false);
  };

  useEffect(() => {
    activeUserIdRef.current = userId;

    // Clear state immediately to prevent cross-account display/leakage
    setPosts([]);
    setPostsCount(0);
    setOffset(0);
    setHasMore(true);
    setProfile(user || null);

    const isPlaceholder = !userId ||
      userId.toLowerCase().trim() === 'undefined' ||
      userId.toLowerCase().trim() === 'null' ||
      userId.toLowerCase().trim() === 'none' ||
      userId === '';

    if (isPlaceholder) {
      setPostsLoading(false);
      setLoading(false);
      return;
    }

    setPostsLoading(false);
    setLoading(!user);

    // Ensure we don't query for 'undefined' or missing user ids
    if (!userId || userId.trim() === '' || userId.toLowerCase() === 'undefined') {
      return;
    }

    fetchProfile(!user);
  }, [userId]);

  // Listen for background video/post uploads and instantly prepend to profile feed & increment posts count
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('post_uploaded', (newPost: any) => {
      console.log('[Profile] post_uploaded event received:', newPost?.id);
      if (newPost && (!newPost.user_id || newPost.user_id === userId)) {
        setPosts((prev) => {
          if (prev.some((p) => String(p.id) === String(newPost.id))) return prev;
          return [newPost, ...prev];
        });
        setPostsCount((prev) => prev + 1);
      }
    });
    return () => sub.remove();
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(false);
    loadPosts(true);
  }, [fetchProfile, loadPosts]);

  const handleMenuPress = (item: SettingItem) => {
    if (item.id === 'culture') {
      setShowSettingsModal(false);
      setTimeout(() => {
      }, Platform.OS === 'ios' ? 400 : 50);
      return;
    }

    if (item.id === 'language') {
      setShowSettingsModal(false);
      setTimeout(() => {
        setShowLanguageModal(true);
      }, Platform.OS === 'ios' ? 400 : 50);
      return;
    }

    if (item.action === 'logout') {
      // Do not dismiss settings modal first, show the native confirmation prompt directly on top of it.
      // This prevents the UIKit transition conflict that causes the sheet to auto-dismiss and freeze the app.
      handleLogout();
      return;
    }

    setShowSettingsModal(false);
    if (item.disabled) return;
    if (item.id === 'personality_verification') {
      setShowSettingsModal(false);
      const status = user?.personality_verification_status;
      if (status === 'pending' || status === 'approved') {
        router.push('/profile/personality-verification-success');
      } else {
        router.push('/profile/personality-verification');
      }
      return;
    }
    if (item.route) {
      setShowSettingsModal(false);
      router.push(item.route as any);
    }
  };


  const performLogout = async () => {
    // Dismiss the settings modal now that the user has confirmed logout
    setShowSettingsModal(false);
    try {
      await logout();
      if (Platform.OS === 'web') {
        // Hard reset for web to clear any cached state
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect
      router.replace('/');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      performLogout();
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('language') === 'hi' ? 'लॉगआउट' : 'Logout',
          message: t('language') === 'hi' ? 'क्या आप सचमुच लॉगआउट करना चाहते हैं?' : 'Are you sure you want to logout?',
          options: [
            t('cancel'),
            t('language') === 'hi' ? 'लॉगआउट' : 'Logout',
          ],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            performLogout();
          } else {
            // Dismiss the settings modal overlay if the user cancels
            setShowSettingsModal(false);
          }
        }
      );
    } else {
      // On Android, Alert renders behind an open Modal due to native z-order.
      // Dismiss the modal first, then show Alert after modal fully closes.
      setShowSettingsModal(false);
      setTimeout(() => {
        Alert.alert(
          t('language') === 'hi' ? 'लॉगआउट' : 'Logout',
          t('language') === 'hi' ? 'क्या आप सचमुच लॉगआउट करना चाहते हैं?' : 'Are you sure you want to logout?',
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('language') === 'hi' ? 'लॉगआउट' : 'Logout', style: 'destructive', onPress: performLogout },
          ],
          { cancelable: true }
        );
      }, 300);
    }
  };

  const handleDeletePost = async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    const removedPost = post;
    setPosts((prev) => prev.filter((item) => item.id !== postId));
    setPostsCount((prev) => Math.max(0, prev - 1));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
      setPostModalVisible(false);
    }

    try {
      await deletePost(postId);
      showToast(t('language') === 'hi' ? 'पोस्ट सफलतापूर्वक हटा दी गई' : 'Post deleted successfully');
    } catch (error) {
      console.warn('Failed to delete post:', error);
      setPosts((prev) => (prev.some((item) => item.id === postId) ? prev : [removedPost, ...prev]));
      setPostsCount((prev) => prev + 1);
      Alert.alert(
        t('language') === 'hi' ? 'पोस्ट हटाने में असमर्थ' : 'Unable to delete post',
        t('language') === 'hi' ? 'कृपया बाद में पुनः प्रयास करें।' : 'Please try again later.'
      );
    }
  };

  const confirmDeletePost = (post: any) => {
    if (!post?.id) return;
    setPostToDelete(post);
    setDeleteConfirmVisible(true);
  };

  const openPostModal = (post: any) => {
    if (!post?.id) return;
    setSelectedPost(post);
    setPostModalVisible(true);
    hideTabBar?.();
    setEditedCaption(post?.caption || '');
    hasScrolledToPost.current = false;
    setActivePostKey(`profile-detail-${post.id}`);
    postOffsetsRef.current = {};
    postHeightsRef.current = {};
    try {
      viewPost(post.id);
    } catch (e) { }
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setEditedCaption(post?.caption || '');
    setEditingPostId(post?.id);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditedCaption('');
    setSavingEdit(false);
  };

  const savePostEdit = async () => {
    if (!selectedPost?.id || savingEdit) return;
    const postId = selectedPost.id;
    setSavingEdit(true);

    try {
      const response = await updatePost(postId, { caption: editedCaption });
      const updatedPost = response.data?.post ? response.data.post : { ...selectedPost, caption: editedCaption };
      setSelectedPost(updatedPost);
      setPosts((prev) => prev.map((item) => item.id === postId ? updatedPost : item));
      showToast(t('language') === 'hi' ? 'पोस्ट सफलतापूर्वक अपडेट हो गई!' : 'Post updated successfully');
      setEditingPostId(null);
    } catch (error) {
      console.warn('Failed to update post:', error);
      Alert.alert(
        t('language') === 'hi' ? 'बदलाव सहेजने में असमर्थ' : 'Unable to save changes',
        t('language') === 'hi' ? 'कृपया बाद में पुनः प्रयास करें।' : 'Please try again later.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLikePost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;
    const liked = !!post?.liked_by_me;
    const currentLikes = Number(post?.likes_count || 0);
    const optimisticPost = {
      ...post,
      liked_by_me: !liked,
      likes_count: liked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
    };

    if (selectedPost?.id === postId) setSelectedPost(optimisticPost);
    setPosts((prev) => prev.map((item) => (item.id === postId ? optimisticPost : item)));

    try {
      const response = await togglePostLike(postId);
      const updatedPost = response.data?.post;
      if (updatedPost) {
        if (selectedPost?.id === postId) setSelectedPost((prev: any) => ({ ...prev, ...updatedPost }));
        setPosts((prev) => prev.map((item) => (item.id === postId ? { ...item, ...updatedPost } : item)));
      }
    } catch (error) {
      console.warn('Failed to like post:', error);
      if (selectedPost?.id === postId) setSelectedPost(post);
      setPosts((prev) => prev.map((item) => (item.id === postId ? post : item)));
    }
  }, [selectedPost]);

  const loadComments = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 300);
      setPostComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComment = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    setSelectedCommentPost(post);
    setCommentText('');
    setReplyingToComment(null);
    setCommentModalVisible(true);
    loadComments(postId);
  }, []);

  const handleSubmitComment = async () => {
    if (!selectedCommentPost?.id || !commentText.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const parentId = replyingToComment?.id || undefined;
      const response = await addPostComment(selectedCommentPost.id, commentText.trim(), parentId);
      const updatedPost = response.data?.post || response.data;
      const serverComment = response.data?.comment;

      if (updatedPost) {
        if (selectedPost?.id === selectedCommentPost.id) setSelectedPost((prev: any) => ({ ...prev, ...updatedPost }));
        setPosts((prev) =>
          prev.map((item) => (item.id === selectedCommentPost.id ? { ...item, ...updatedPost } : item))
        );
        setSelectedCommentPost((prev: any) => (prev?.id === selectedCommentPost.id ? { ...prev, ...updatedPost } : prev));
      }

      await loadComments(selectedCommentPost.id);
      setCommentText('');
      setReplyingToComment(null);
      Keyboard.dismiss();
    } catch (error) {
      console.warn('Failed to add comment:', error);
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: any) => {
    const commentId = comment?.id;
    if (!commentId || !selectedCommentPost?.id) return;

    const originalComments = [...postComments];
    const originalPost = { ...selectedCommentPost };

    setPostComments(prev => prev.filter(c => c.id !== commentId));

    const targetPostId = selectedCommentPost.id;
    setPosts(prev => prev.map(p => {
      if (p.id === targetPostId) {
        const currentTop = Array.isArray(p.top_comments) ? p.top_comments : [];
        return {
          ...p,
          comments_count: Math.max(0, (Number(p.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return p;
    }));

    if (selectedPost?.id === targetPostId) {
      setSelectedPost((prev: any) => {
        if (prev) {
          const currentTop = Array.isArray(prev.top_comments) ? prev.top_comments : [];
          return {
            ...prev,
            comments_count: Math.max(0, (Number(prev.comments_count) || 0) - 1),
            top_comments: currentTop.filter((c: any) => c.id !== commentId),
          };
        }
        return prev;
      });
    }

    setSelectedCommentPost((prev: any) => {
      if (prev?.id === targetPostId) {
        const currentTop = Array.isArray(prev.top_comments) ? prev.top_comments : [];
        return {
          ...prev,
          comments_count: Math.max(0, (Number(prev.comments_count) || 0) - 1),
          top_comments: currentTop.filter((c: any) => c.id !== commentId),
        };
      }
      return prev;
    });

    try {
      const response = await deletePostComment(String(targetPostId), commentId);
      const updatedPostFromServer = response.data?.post;

      if (updatedPostFromServer) {
        setPosts(prev => prev.map(p => {
          if (p.id === targetPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...p,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return p;
        }));

        if (selectedPost?.id === targetPostId) {
          setSelectedPost((prev: any) => prev ? { ...prev, ...updatedPostFromServer, top_comments: (Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : []).slice(0, 2) } : prev);
        }

        setSelectedCommentPost((prev: any) => {
          if (prev?.id === targetPostId) {
            const currentTop = Array.isArray(updatedPostFromServer.top_comments) ? updatedPostFromServer.top_comments : [];
            return {
              ...prev,
              ...updatedPostFromServer,
              top_comments: currentTop.slice(0, 2),
            };
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.warn('Failed to delete comment:', error);
      setPostComments(originalComments);
      setSelectedCommentPost(originalPost);
      setPosts(prev => prev.map(p => p.id === targetPostId ? originalPost : p));
      if (selectedPost?.id === targetPostId) setSelectedPost(originalPost);
      const detail = error.response?.data?.detail || error.message;
      Alert.alert('Error', detail || 'Could not delete comment. Please try again.');
    }
  };

  const handleSharePost = useCallback((post: any) => {
    setSelectedSharePost(post);
    setShareModalVisible(true);
  }, []);

  const handleRepost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    try {
      const response = await repostPost(postId);
      showToast('Reposted to your feed');
      loadPosts(true); // Refresh grid
    } catch (error) {
      console.warn('Failed to repost:', error);
      Alert.alert('Error', 'Could not repost.');
    }
  }, [loadPosts, showToast]);

  const handleShareExternal = async (post: any) => {
    const appLink = post?.id ? `https://brahmand.app/post/${post.id}` : 'https://brahmand.app/';
    const mediaUrl = post?.media_url || '';
    const caption = post?.caption ? `\nCaption: ${post.caption}` : '';
    const message = `Check this post on Brahmand!${caption}\n\n${appLink}`;

    try {
      if (FileSystemModule?.cacheDirectory && FileSystemModule?.downloadAsync && mediaUrl) {
        const inferredExt = post?.media_type === 'video' ? 'mp4' : 'jpg';
        const localPath = `${FileSystemModule.cacheDirectory}share-${Date.now()}.${inferredExt}`;
        const downloadRes = await FileSystemModule.downloadAsync(mediaUrl, localPath);
        if (downloadRes?.uri) {
          await Share.share({ message, url: downloadRes.uri, title: 'Share via Brahmand' });
          return;
        }
      }
      await Share.share({ message: `${message}\n${mediaUrl}`, url: appLink, title: 'Share via Brahmand' });
    } catch (error: any) {
      const msg = String(error?.message || error || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss') || msg.includes('aborted')) return;
      console.warn('Failed to open share sheet:', error);
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    const rawUrl = item.media_url || item.mediaUrl || item.image_url || item.image || '';
    const isVideo =
      !!rawUrl.match(/\.(mp4|mov|m4v|webm|m3u8|avi|mkv|flv|wmv)(\?|$)/i) ||
      item.media_type === 'video' ||
      item.is_video ||
      item.isVideo;
    const displayUrl = item.thumbnail_url || item.thumbnailUrl || item.image_url || item.image || (isVideo ? '' : rawUrl);
    const isGallery = !isVideo && (item.media_count > 1 || item.is_carousel || item.carousel);

    return (
      <Pressable
        style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}
        onPress={() => openPostModal(item)}
      >
        {displayUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={styles.gridImage}
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name={isVideo ? 'videocam' : 'image-outline'} size={24} color={COLORS.textLight} />
          </View>
        )}

        <View style={styles.mediaTypeBadge}>
          <Ionicons
            name={isVideo ? 'videocam' : isGallery ? 'images' : 'image'}
            size={14}
            color="#FFF"
          />
        </View>

        {/* View and Like Count Overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.1)',
          justifyContent: 'flex-end',
          padding: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: 'flex-start',
              gap: 4,
            }}>
              <Ionicons name="play" size={10} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                {item.views_count || 0}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: 'flex-start',
              gap: 4,
            }}>
              <Ionicons name="heart" size={10} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                {(() => {
                  const likes = item.likes_count ?? item.likesCount ?? 0;
                  return likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes;
                })()}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const formatStat = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(value);
  };

  const followersCount =
    profile?.followers_count ?? (Array.isArray(profile?.followers) ? profile.followers.length : 0);
  const followingCount =
    profile?.following_count ?? (Array.isArray(profile?.following) ? profile.following.length : 0);
  const locationLabel = (() => {
    const loc = profile?.home_location || user?.home_location;
    if (!loc) return null;
    const city = loc.city || '';
    const state = loc.state || '';
    return [city, state].filter(Boolean).join(', ');
  })();

  const renderStatCell = (
    icon: string,
    value: number,
    label: string,
    onPress?: () => void
  ) => {
    const content = (
      <>
        <Ionicons name={icon as any} size={22} color="rgba(255,255,255,0.85)" />
        <Text style={styles.glassStatValue}>{formatStat(value)}</Text>
        <Text style={styles.glassStatLabel}>{label}</Text>
      </>
    );
    if (onPress) {
      return (
        <TouchableOpacity style={styles.glassStatCell} activeOpacity={0.8} onPress={onPress}>
          {content}
        </TouchableOpacity>
      );
    }
    return <View style={styles.glassStatCell}>{content}</View>;
  };

  const renderHeader = () => {
    const coverUri = profile?.cover_photo || user?.cover_photo || DEFAULT_COVER;
    const navSpacerHeight = insets.top + NAV_BAR_HEIGHT;

    const displayName = profile?.name || user?.name || (user?.phone ? `Yatri ${user.phone.slice(-4)}` : 'Sanatan Yatri');
    const bioText = profile?.bio || user?.bio || 'Har Har Mahadev 🕉️';
    const locationVal = locationLabel || 'Mumbai, Maharashtra';

    const followersVal = Platform.OS === 'android' ? followersCount : (followersCount || 0);
    const followingVal = Platform.OS === 'android' ? followingCount : (followingCount || 0);
    const postsVal = Platform.OS === 'android' ? postsCount : (postsCount || 0);

    return (
      <View style={styles.headerContent}>
        <ImageBackground
          source={{ uri: coverUri }}
          style={styles.heroBackdrop}
          imageStyle={styles.heroBackdropImage}
        >
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.3)',
              'rgba(0,0,0,0.1)',
              'rgba(0,0,0,0.5)',
              '#000000',
            ]}
            locations={[0, 0.25, 0.7, 1]}
            style={styles.heroBackdropGradient}
          />

          <Pressable
            style={styles.heroBackdropTap}
            onPress={() => showImageSourcePicker('cover_photo')}
          />

          <View style={{ height: navSpacerHeight + 20 }} />

          <View style={styles.heroProfileBlock}>
            <Pressable style={styles.avatarWrap} onPress={showAvatarOptions}>
              <View style={styles.avatarRing}>
                <Avatar
                  name={displayName}
                  photo={profile?.photo || user?.photo}
                  size={AVATAR_SIZE}
                />
              </View>
              <View style={styles.onlineDot} />
            </Pressable>

            <View style={styles.heroNameRow}>
              <Text style={styles.heroDisplayName}>{displayName}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={openBioEditor}>
              <Text style={styles.heroBioText}>{bioText}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.heroLocationRow} activeOpacity={0.85} onPress={openLocationEditor}>
              <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
              <Text style={styles.heroLocationText}>{locationVal}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Stats card and buttons on solid black background */}
        <View style={styles.heroActionsBelow}>
          <View style={styles.glassStatsCard}>
            <View style={styles.glassStatsOverlay}>
              {renderStatCell('trending-up', followersVal, t('followers'), () =>
                router.push({ pathname: '/follow-connections', params: { tab: 'followers' } })
              )}
              <View style={styles.glassStatDivider} />
              {renderStatCell('people', followingVal, t('following'), () =>
                router.push({ pathname: '/follow-connections', params: { tab: 'following' } })
              )}
              <View style={styles.glassStatDivider} />
              {renderStatCell('share-outline', postsVal, t('postCount'))}
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.addPostButton, pressed && styles.actionPressed]}
              pressRetentionOffset={{ top: 10, left: 10, right: 10, bottom: 10 }}
              onPress={() => setShowUploadModal(true)}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addPostButtonText}>{t('addPost')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.shareProfileButton, pressed && styles.actionPressed]}
              pressRetentionOffset={{ top: 10, left: 10, right: 10, bottom: 10 }}
              onPress={handleShareProfile}
            >
              <Ionicons name="arrow-redo-outline" size={20} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={styles.container}>





        {/* Settings Menu Modal */}
        <Modal visible={showSettingsModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowSettingsModal(false)}
            />
            <View style={[styles.settingsSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.settingsHeader}>
                <View style={styles.settingsHeaderBar} />
                <Text style={styles.settingsTitle}>{t('settingsTitle')}</Text>
                <TouchableOpacity
                  style={styles.settingsClose}
                  onPress={() => setShowSettingsModal(false)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              {Platform.OS === 'android' ? (
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                  {SETTINGS_SECTIONS.map((section: { id: string; title: string; items: SettingItem[] }) => (
                    <View key={section.id} style={styles.settingsSection}>
                      <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
                      {section.items.map((item: SettingItem, index: number) => {
                        const iconColor = item.disabled ? '#A0A0A0' : '#000000';
                        const textColor = item.disabled ? '#A0A0A0' : '#000000';
                        const showChevron = item.id !== 'language';
                        const chevronColor = item.disabled ? '#A0A0A0' : '#000000';

                        return (
                          <View key={item.id}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.settingsRow,
                                { backgroundColor: pressed ? 'rgba(255, 107, 0, 0.12)' : '#FFFFFF' }, // Instant background highlight on press for Android too
                                pressed && Platform.OS === 'ios' && { opacity: 0.7 }
                              ]}
                              android_ripple={{ color: 'rgba(255, 107, 0, 0.25)', borderless: false }}
                              onPress={() => handleMenuPress(item)}
                              disabled={item.disabled && item.id !== 'location'}
                            >
                              <Ionicons
                                name={item.icon as any}
                                size={20}
                                color={iconColor}
                                style={{ marginRight: 16 }}
                              />
                              <View style={styles.settingsLabelWrap}>
                                <Text style={[styles.settingsLabel, { color: textColor }]}>
                                  {item.label}
                                </Text>
                              </View>
                              <View style={styles.settingsRowRight}>
                                {item.value ? <Text style={styles.settingsValue}>{item.value}</Text> : null}
                                {showChevron && (
                                  <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={chevronColor}
                                  />
                                )}
                              </View>
                            </Pressable>
                            {index < section.items.length - 1 && (
                              <View
                                style={[
                                  styles.settingsSeparator,
                                  { marginLeft: 56, backgroundColor: '#EAEAEA' }
                                ]}
                              />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  <View style={styles.bottomSpacer} />
                </KeyboardAwareScrollView>
              ) : (
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                  {SETTINGS_SECTIONS.map((section: { id: string; title: string; items: SettingItem[] }) => (
                    <View key={section.id} style={styles.settingsSection}>
                      <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
                      {section.items.map((item: SettingItem, index: number) => {
                        const textColor = item.action === 'logout' ? COLORS.error : '#000000';
                        const showChevron = !item.disabled;

                        return (
                          <View key={item.id}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.settingsRow,
                                { backgroundColor: pressed ? 'rgba(255, 107, 0, 0.12)' : '#FFFFFF' }, // Highlight background on tap on iOS
                                item.disabled && styles.settingsRowDisabled,
                              ]}
                              onPress={() => handleMenuPress(item)}
                              disabled={item.disabled}
                            >
                              <Ionicons
                                name={item.icon as any}
                                size={20}
                                color="#000"
                                style={{ marginRight: 16 }}
                              />
                              <View style={styles.settingsLabelWrap}>
                                <Text style={[styles.settingsLabel, { color: textColor }]}>
                                  {item.label}
                                </Text>
                                {item.subLabel ? <Text style={styles.settingsSubLabel}>{item.subLabel}</Text> : null}
                              </View>
                              <View style={styles.settingsRowRight}>
                                {item.value ? <Text style={styles.settingsValue}>{item.value}</Text> : null}
                                {showChevron && (
                                  <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color="#000"
                                  />
                                )}
                              </View>
                            </Pressable>
                            {index < section.items.length - 1 && (
                              <View style={styles.settingsSeparator} />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  <View style={styles.bottomSpacer} />
                </KeyboardAwareScrollView>
              )}
            </View>
          </View>
        </Modal>

        <View
          style={[styles.stickyNav, { paddingTop: insets.top + 8, height: insets.top + NAV_BAR_HEIGHT + 8 }]}
        >
          <TouchableOpacity style={styles.navLeftGroup} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
            <Text style={styles.navUsername}>
              {(profile?.sl_id || user?.sl_id || profile?.name || user?.phone || 'yatri').toLowerCase()}
            </Text>
          </TouchableOpacity>
          <View style={styles.navRightGroup}>
            <Pressable
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true, radius: 24 }}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              style={({ pressed }) => [styles.navRightBtn, Platform.OS === 'ios' && pressed && { opacity: 0.6 }]}
              onPress={() => showImageSourcePicker('cover_photo')}
            >
              <Svg width={18} height={18} viewBox="0 0 16 17" fill="none">
                <Path d="M15.5625 4.12027L12.0589 0.617491C11.5691 0.127503 10.7747 0.127503 10.2848 0.617491L0.617688 10.2846C0.381388 10.5191 0.248944 10.8384 0.250006 11.1713V14.6749C0.250006 15.3676 0.811619 15.9292 1.50436 15.9292H14.675C15.1579 15.9287 15.4591 15.4058 15.2173 14.9879C15.1053 14.7944 14.8987 14.6751 14.675 14.6749H6.78204L15.5625 5.89439C16.0525 5.40452 16.0525 4.61015 15.5625 4.12027ZM5.00792 14.6749H1.50436V11.1713L8.40329 4.27236L11.9069 7.77592L5.00792 14.6749ZM12.7935 6.88925L9.29075 3.38569L11.1723 1.50416L14.6751 5.00772L12.7935 6.88925Z" fill="#FFF" stroke="#FFF" strokeWidth="0.5" />
              </Svg>
            </Pressable>
            <Pressable
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true, radius: 24 }}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              style={({ pressed }) => [styles.navRightBtn, Platform.OS === 'ios' && pressed && { opacity: 0.6 }]}
              onPress={() => setShowSettingsModal(true)}
            >
              <Svg width={20} height={20} viewBox="24 0 16 17" fill="none">
                <Path d="M39.9314 8.28457C39.9314 8.80415 39.5102 9.22535 38.9906 9.22537H25.1922C24.468 9.22534 24.0153 8.44132 24.3775 7.81413C24.5455 7.52307 24.8561 7.34377 25.1922 7.34377H38.9906C39.5102 7.3438 39.9314 7.765 39.9314 8.28457ZM25.1922 4.20777H38.9906C39.7148 4.20777 40.1675 3.42377 39.8054 2.79657C39.6373 2.5055 39.3267 2.32618 38.9906 2.32617H25.1922C24.468 2.3262 24.0153 3.11022 24.3775 3.73741C24.5455 4.02847 24.8561 4.20777 25.1922 4.20777ZM38.9906 12.3614H25.1922C24.468 12.3614 24.0153 13.1454 24.3775 13.7726C24.5455 14.0637 24.8561 14.243 25.1922 14.243H38.9906C39.7148 14.243 40.1675 13.459 39.8054 12.8318C39.6373 12.5407 39.3267 12.3614 38.9906 12.3614Z" fill="#FFF" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {renderHeader()}
        <Animated.FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 150 }}
          nestedScrollEnabled={true}
          alwaysBounceVertical={true}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item, index) => {
            if (!item || !item.id) {
              return `post-idx-${index}`;
            }
            return `post-${item.id}`;
          }}
          numColumns={3}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: true,
              listener: (event: any) => {
                onProfileScrollTabBar(event);
              },
            }
          )}
          scrollEventThrottle={16}
          ListFooterComponent={
            postsLoading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.textLight} />
              </View>
            ) : !hasMore && posts.length > 0 ? (
              <View style={styles.endOfFeed}>
                <Text style={styles.endOfFeedText}>
                  {t('language') === 'hi' ? 'आप अंत तक पहुँच चुके हैं' : "you have reached end"}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading && !postsLoading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="camera-outline" size={40} color="#FFFFFF" />
                </View>
                <Text style={[styles.emptyTitle, { color: '#FFFFFF' }]}>
                  {t('language') === 'hi' ? 'कोई पोस्ट नहीं मिली' : 'No posts found'}
                </Text>
                <Text style={[styles.emptySubTitle, { color: 'rgba(255,255,255,0.7)', marginTop: 8 }]}>
                  {t('language') === 'hi' ? 'अपनी सामग्री देखने के लिए कृपया अपलोड करें।' : 'Please upload to see your content.'}
                </Text>
              </View>
            ) : null
          }
          onEndReached={() => {
            if (hasMore && !postsLoading) {
              loadPosts();
            }
          }}
          onEndReachedThreshold={0.8}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textLight} />
          }
          showsVerticalScrollIndicator={false}
        />



        {/* Avatar Modal */}
        <Modal visible={avatarModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAvatarModalVisible(false)}
          >
            <Image
              source={{
                uri:
                  profile?.photo &&
                    profile.photo !== 'nan' &&
                    profile.photo !== 'NaN' &&
                    profile.photo !== 'None' &&
                    profile.photo !== ''
                    ? profile.photo
                    : user?.photo &&
                      user.photo !== 'nan' &&
                      user.photo !== 'NaN' &&
                      user.photo !== 'None' &&
                      user.photo !== ''
                      ? user.photo
                      : '',
              }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>

        {/* Post Detail Modal */}
        <Modal
          visible={postModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setPostModalVisible(false);
            showTabBar?.();
          }}
        >
          <View style={styles.postDetailContainer}>
            <View style={[styles.postDetailHeader, { paddingTop: insets.top, height: 50 + insets.top }]}>
              <TouchableOpacity onPress={() => { setPostModalVisible(false); showTabBar?.(); }} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.postDetailTitle}>
                {t('language') === 'hi' ? 'पोस्ट' : 'Posts'}
              </Text>
            </View>
            {posts.length > 0 ? (
              <FlatList
                ref={postListRef}
                data={posts}
                initialScrollIndex={Math.max(0, posts.findIndex(p => p && p.id === selectedPost?.id))}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                removeClippedSubviews={false}
                contentContainerStyle={{
                  paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 24) + 120 : Math.max(insets.bottom, 40) + 60
                }}
                renderItem={({ item, index }) => {
                  const postKey = item && item.id ? `profile-detail-${item.id}` : `profile-detail-idx-${index}`;
                  return (
                    <View
                      onLayout={(event) => {
                        const y = event.nativeEvent.layout.y;
                        const h = event.nativeEvent.layout.height;
                        postOffsetsRef.current[postKey] = y;
                        postHeightsRef.current[postKey] = h;
                      }}
                    >
                      <PostFeedCard
                        post={item}
                        onLike={handleLikePost}
                        onComment={handleOpenComment}
                        onShare={handleSharePost}
                        onRepost={handleRepost}
                        isActive={activePostKey === postKey}
                        onUserPress={() => setPostModalVisible(false)}
                        postMenuType="delete"
                        onEdit={handleEditPost}
                        onPostMenuPress={confirmDeletePost}
                        theme="dark"
                        isBlackBackground={true}
                        isEditing={editingPostId === item.id}
                        editedCaption={editedCaption}
                        onChangeEditedCaption={setEditedCaption}
                        onCancelEdit={cancelEdit}
                        onSaveEdit={savePostEdit}
                        isSavingEdit={savingEdit}
                      />
                    </View>
                  );
                }}
                keyExtractor={(item, index) => {
                  if (!item || !item.id) {
                    return `profile-detail-idx-${index}`;
                  }
                  return `profile-detail-${item.id}`;
                }}
                onScroll={(event) => {
                  const y = event.nativeEvent.contentOffset.y;
                  let closestKey: string | null = null;
                  let maxVisible = 0;
                  const screenH = Dimensions.get('window').height;
                  for (const key of Object.keys(postOffsetsRef.current)) {
                    const offset = postOffsetsRef.current[key];
                    const height = postHeightsRef.current[key];
                    if (typeof offset === 'number' && typeof height === 'number') {
                      const visibleTop = Math.max(0, offset - y);
                      const visibleBottom = Math.min(screenH, offset + height - y);
                      const visibleAmount = Math.max(0, visibleBottom - visibleTop);
                      if (visibleAmount > maxVisible) {
                        maxVisible = visibleAmount;
                        closestKey = key;
                      }
                    }
                  }
                  setActivePostKey(prev => closestKey ?? prev);
                }}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    postListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
                  });
                }}
                onLayout={() => {
                  if (selectedPost && posts.length > 0 && !hasScrolledToPost.current) {
                    const idx = posts.findIndex(p => p.id === selectedPost.id);
                    if (idx >= 0) {
                      setTimeout(() => {
                        postListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
                        hasScrolledToPost.current = true;
                        setActivePostKey(String(selectedPost.id || selectedPost.media_url || 0));
                      }, 200);
                    }
                  }
                }}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}

            {/* Comment Modal nested inside Post Detail Modal */}
            <Modal
              visible={commentModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => {
                setCommentModalVisible(false);
                setReplyingToComment(null);
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.sheetOverlay}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
              >
                <TouchableOpacity
                  style={styles.sheetDismiss}
                  activeOpacity={1}
                  onPress={() => {
                    setCommentModalVisible(false);
                    setReplyingToComment(null);
                  }}
                />
                <View style={[styles.sheetContent, { paddingBottom: insets.bottom }]}>
                  <View style={styles.sheetHandle} />
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>
                      {t('language') === 'hi' ? 'टिप्पणियाँ' : 'Comments'} ({selectedCommentPost?.comments_count ?? postComments.length ?? 0})
                    </Text>
                    <TouchableOpacity onPress={() => { setCommentModalVisible(false); setReplyingToComment(null); }}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {commentsLoading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
                  ) : postComments.length === 0 ? (
                    <View style={styles.emptyComments}>
                      <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
                      <Text style={styles.emptyCommentsText}>
                        {t('language') === 'hi' ? 'अभी तक कोई टिप्पणी नहीं। पहले बनें!' : 'No comments yet. Be the first!'}
                      </Text>
                    </View>
                  ) : (() => {
                    const parentComments = postComments.filter(c => !c.parent_id);
                    const repliesMap = postComments.reduce((acc, c) => {
                      if (c.parent_id) {
                        if (!acc[c.parent_id]) acc[c.parent_id] = [];
                        acc[c.parent_id].push(c);
                      }
                      return acc;
                    }, {} as Record<string, any[]>);

                    return (
                      <FlatList
                        data={parentComments}
                        keyExtractor={(item, index) => item && item.id ? String(item.id) : `comment-idx-${index}`}
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS === 'android'}
                        renderItem={({ item }) => {
                          const canDelete = item.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                          const replies = repliesMap[item.id] || [];
                          return (
                            <View style={{ marginBottom: 12, paddingHorizontal: 16 }}>
                              <View style={styles.commentItem}>
                                <Avatar name={item.username || 'User'} photo={item.user_photo} size={36} />
                                <View style={styles.commentContent}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.commentUser}>{item.username || 'User'}</Text>
                                    {canDelete && (
                                      <TouchableOpacity
                                        style={{ padding: 4, marginRight: -4 }}
                                        onPress={() => handleDeleteComment(item)}
                                      >
                                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <MentionText style={styles.commentText} text={item.text || ''} />
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <TouchableOpacity
                                      onPress={() => {
                                        setReplyingToComment(item);
                                        setCommentText(`@${item.username || 'User'} `);
                                      }}
                                    >
                                      <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>
                                        {t('language') === 'hi' ? 'उत्तर दें' : 'Reply'}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>

                              {/* Render replies */}
                              {replies.length > 0 && (
                                <View style={{
                                  marginLeft: 44,
                                  paddingLeft: 16,
                                  borderLeftWidth: 1.5,
                                  borderLeftColor: '#E6E1E8',
                                  marginTop: 8,
                                }}>
                                  {replies.map((reply: any) => {
                                    const canDeleteReply = reply.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                                    return (
                                      <View key={reply.id} style={[styles.commentItem, { position: 'relative', paddingLeft: 4, marginBottom: 10 }]}>
                                        {/* Horizontal connection branch */}
                                        <View style={{
                                          position: 'absolute',
                                          left: -16,
                                          top: 18,
                                          width: 12,
                                          height: 1.5,
                                          backgroundColor: '#E6E1E8',
                                        }} />

                                        <Avatar name={reply.username || 'User'} photo={reply.user_photo} size={28} />
                                        <View style={styles.commentContent}>
                                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={[styles.commentUser, { fontSize: 13 }]}>{reply.username || 'User'}</Text>
                                            {canDeleteReply && (
                                              <TouchableOpacity
                                                style={{ padding: 4, marginRight: -4 }}
                                                onPress={() => handleDeleteComment(reply)}
                                              >
                                                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                          <MentionText style={[styles.commentText, { fontSize: 13 }]} text={reply.text || ''} />
                                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <TouchableOpacity
                                              onPress={() => {
                                                setReplyingToComment(item);
                                                setCommentText(`@${reply.username} `);
                                              }}
                                            >
                                              <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>
                                                {t('language') === 'hi' ? 'उत्तर दें' : 'Reply'}
                                              </Text>
                                            </TouchableOpacity>
                                          </View>
                                        </View>
                                      </View>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          );
                        }}
                        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
                      />
                    );
                  })()}

                  {replyingToComment && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: COLORS.background,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderTopWidth: 0.5,
                      borderTopColor: COLORS.divider,
                      width: '100%',
                    }}>
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                        {t('language') === 'hi' ? 'को उत्तर दे रहे हैं' : 'Replying to'} <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>@{replyingToComment.username}</Text>
                      </Text>
                      <TouchableOpacity onPress={() => setReplyingToComment(null)}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={[styles.commentInputContainer, { paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12)) : Math.max(insets.bottom, 12) }]}>
                    <Avatar name={user?.name || 'User'} photo={user?.photo} size={32} />
                    <MentionInput
                      value={commentText}
                      onChangeText={setCommentText}
                      placeholder={replyingToComment ? (t('language') === 'hi' ? `@${replyingToComment.username} को उत्तर दें...` : `Reply to @${replyingToComment.username}...`) : (t('language') === 'hi' ? 'एक टिप्पणी जोड़ें...' : 'Add a comment...')}
                      multiline
                      inputStyle={styles.commentInput}
                    />
                    <TouchableOpacity
                      onPress={handleSubmitComment}
                      disabled={!commentText.trim() || commentSubmitting}
                    >
                      <Text style={[
                        styles.commentPostButton,
                        (!commentText.trim() || commentSubmitting) && { opacity: 0.5 }
                      ]}>
                        {t('language') === 'hi' ? 'POST करें' : 'Post'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
                </View>
              </KeyboardAvoidingView>
            </Modal>

            <DeleteConfirmationModal
              visible={deleteConfirmVisible}
              onClose={() => {
                setDeleteConfirmVisible(false);
                setPostToDelete(null);
              }}
              onConfirm={async () => {
                if (postToDelete) {
                  await handleDeletePost(postToDelete);
                  setPostToDelete(null);
                }
              }}
            />
          </View>
        </Modal>

        {/* Language Selection Modal */}
        <Modal visible={showLanguageModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => setShowLanguageModal(false)}
            />
            <View style={styles.langModalPillContent}>
              <View style={styles.langModalHeader}>
                <Text style={styles.langModalTitle}>{t('selectLanguage')}</Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={26} color="rgba(0,0,0,0.4)" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.langItem, language === 'en' && styles.langItemSelected]}
                activeOpacity={0.7}
                onPress={async () => {
                  await setLanguage('en');
                  setShowLanguageModal(false);
                }}
              >
                <View style={styles.langItemLeft}>
                  <Ionicons name="language-outline" size={20} color={language === 'en' ? '#FF6F00' : 'rgba(0,0,0,0.5)'} />
                  <Text style={[styles.langItemText, language === 'en' && styles.langItemTextSelected]}>
                    {t('english')}
                  </Text>
                </View>
                {language === 'en' && (
                  <Ionicons name="checkmark-circle" size={22} color="#FF6F00" />
                )}
              </TouchableOpacity>

              <View style={styles.langItemDivider} />

              <TouchableOpacity
                style={[styles.langItem, language === 'hi' && styles.langItemSelected]}
                activeOpacity={0.7}
                onPress={async () => {
                  await setLanguage('hi');
                  setShowLanguageModal(false);
                }}
              >
                <View style={styles.langItemLeft}>
                  <Ionicons name="language-outline" size={20} color={language === 'hi' ? '#FF6F00' : 'rgba(0,0,0,0.5)'} />
                  <Text style={[styles.langItemText, language === 'hi' && styles.langItemTextSelected]}>
                    {t('hindi')}
                  </Text>
                </View>
                {language === 'hi' && (
                  <Ionicons name="checkmark-circle" size={22} color="#FF6F00" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Toast Notice */}
        {toastVisible && (
          <View style={styles.toastContainer}>
            <View style={styles.toastContent}>
              <Ionicons name="information-circle" size={20} color="#FFF" />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </View>
        )}



        <SharePostModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          post={selectedSharePost}
          onShareExternal={handleShareExternal}
        />

        <UploadPostModal
          visible={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadStart={handleUploadStart}
          onUploadSuccess={() => {
            setOffset(0);
            loadPosts(true);
          }}
        />

        <Modal visible={showBioModal} transparent animationType="fade">
          <View style={styles.editFieldOverlay}>
            <View style={styles.editFieldCard}>
              <Text style={styles.editFieldTitle}>
                {t('language') === 'hi' ? 'बायो संपादित करें' : 'Edit bio'}
              </Text>
              <TextInput
                value={bioDraft}
                onChangeText={setBioDraft}
                style={styles.editFieldInput}
                placeholder={t('language') === 'hi' ? 'अपने बारे में कुछ लिखें...' : 'Write something about you...'}
                placeholderTextColor="#888"
                multiline
                maxLength={500}
              />
              <View style={styles.editFieldActions}>
                <TouchableOpacity onPress={() => setShowBioModal(false)}>
                  <Text style={styles.editFieldCancel}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveBio} disabled={savingProfileField}>
                  <Text style={styles.editFieldSave}>
                    {savingProfileField
                      ? (t('language') === 'hi' ? 'सहेज रहे हैं...' : 'Saving...')
                      : (t('language') === 'hi' ? 'सहेजें' : 'Save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showLocationModal} transparent animationType="fade">
          <View style={styles.editFieldOverlay}>
            <View style={styles.editFieldCard}>
              <Text style={styles.editFieldTitle}>
                {t('language') === 'hi' ? 'स्थान संपादित करें' : 'Edit location'}
              </Text>
              <TextInput
                value={locationDraft}
                onChangeText={setLocationDraft}
                style={styles.editFieldInputSingle}
                placeholder="Mumbai, Maharashtra"
                placeholderTextColor="#888"
              />
              <View style={styles.editFieldActions}>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Text style={styles.editFieldCancel}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveLocation} disabled={savingProfileField}>
                  <Text style={styles.editFieldSave}>
                    {savingProfileField
                      ? (t('language') === 'hi' ? 'सहेज रहे हैं...' : 'Saving...')
                      : (t('language') === 'hi' ? 'सहेजें' : 'Save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContent: {
    height: '70%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  navLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navUsername: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginLeft: 'auto',
  },
  navRightBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    overflow: 'hidden',
  },
  heroBackdrop: {
    width: '100%',
    overflow: 'hidden',
  },
  heroBackdropImage: {
    resizeMode: 'cover',
  },
  heroBackdropGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBackdropTap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  heroActionsBelow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#000000',
  },
  coverEditBadge: {
    position: 'absolute',
    right: 14,
    zIndex: 3,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroProfileBlock: {
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: AVATAR_SIZE / 2 + 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#000000',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroDisplayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroBioText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  heroLocationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  glassStatsCard: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 14,
  },
  glassStatsOverlay: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 14,
  },
  glassStatCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  glassStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  glassStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  glassStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  addPostButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  addPostButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  shareProfileButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    margin: GRID_GAP / 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#141414',
  },
  gridItemPressed: {
    opacity: 0.88,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
  },
  gridImageLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    zIndex: 1,
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    padding: 4,
  },
  editFieldOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  editFieldCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editFieldTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  editFieldInput: {
    minHeight: 100,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
  },
  editFieldInputSingle: {
    height: 46,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  editFieldActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 16,
  },
  editFieldCancel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '600',
  },
  editFieldSave: {
    color: '#FF9E00',
    fontSize: 15,
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 20,
  },
  endOfFeed: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  endOfFeedText: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  emptySubTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: Platform.OS === 'android' ? undefined : '65%',
    maxHeight: Platform.OS === 'android' ? '85%' : undefined,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 34,
    elevation: 20,
  },
  settingsHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 4,
  },
  settingsHeaderBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4E4E4',
    borderRadius: 10,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  settingsClose: {
    position: 'absolute',
    right: 20,
    top: 24,
  },
  settingsSection: {
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  settingsRowDisabled: {
    opacity: 0.5,
  },
  settingsSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingsGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsLabelWrap: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  settingsSubLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValue: {
    fontSize: 14,
    color: '#999999',
    maxWidth: 100,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 40,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  postDetailContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  postDetailHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  postDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  editPostInline: {
    padding: SPACING.md,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  editCaptionInput: {
    minHeight: 100,
    maxHeight: 180,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    fontSize: 14,
  },
  editPostActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: SPACING.md,
  },
  cancelEditBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelEditText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  saveEditBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveEditBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Language Modal Pill Styles
  langModalPillContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  langModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  langModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 14,
  },
  langItemSelected: {
    backgroundColor: 'rgba(255, 141, 87, 0.12)',
  },
  langItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  langItemTextSelected: {
    color: '#FF6F00',
    fontWeight: '700',
  },
  langItemDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 4,
  },
  // CG Modal Styles
  cgModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: SPACING.lg,
  },
  cgModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cgModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  cgSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  cgSearchInput: {
    flex: 1,
    height: 44,
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
  },
  cgList: {
    flex: 1,
  },
  cgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cgItemSelected: {
    backgroundColor: `${COLORS.primary}05`,
  },
  cgItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cgItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
  },
  limitReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  limitReachedText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  commentModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  commentInput: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    maxHeight: 100,
    color: COLORS.text,
  },
  commentPostButton: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  emptyComments: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  uploadingStatusBar: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    padding: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadingStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#333',
  },
  uploadingTextContainer: {
    flex: 1,
  },
  uploadingTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  inlineDeletePopover: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
    zIndex: 999,
  },
  inlineDeleteText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
