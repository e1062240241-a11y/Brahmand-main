import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../../src/utils/dateUtils';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  useWindowDimensions,
  Dimensions,
  BackHandler,
  Alert,
  Animated,
  Linking,
  AppState,
  TouchableWithoutFeedback,
  InteractionManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { decryptMessage } from '../../src/utils/cryptoUtil';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import type * as ImageManipulatorType from 'expo-image-manipulator';
import type * as ContactsType from 'expo-contacts';
import {
  sendDirectMessage,
  getConversations,
  getDMConversationMetadata,
  getDirectMessages,
  clearDirectMessages,
  markDirectMessagesRead,
  approveDirectMessageRequest,
  denyDirectMessageRequest,
  uploadChatMedia,
  uploadCompressedVideo,
  getUserProfile,
  muteConversation,
  unmuteConversation,
  reportContent,
} from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../../src/services/firebase/chatService';
import { useAuthStore } from '../../src/store/authStore';
import { Conversation } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { socketService } from '../../src/services/socket';
import { isConversationMuted, muteConversationLocal, unmuteConversationLocal } from '../../src/services/mutedChats';
import { ReportModal } from '../../src/components/ReportModal';
import { blockUser, unblockUser, isUserBlocked, getUsersWhoBlockedMe } from '../../src/services/firebase/moderationService';
import { useBlockStore } from '../../src/store/blockStore';
import { useLanguageStore } from '../../src/utils/i18n';
import { SafeVideoView, isPlayerValid, useSafeVideoPlayer } from '../../src/components/SafeVideoView';
import { useTabBar } from '../../src/contexts/TabBarContext';

const DM_STRINGS = {
  en: {
    online: 'Online',
    justNow: 'Just now',
    yesterday: 'Yesterday',
    today: 'Today',
    muteChat: 'Mute Chat',
    unmuteChat: 'Unmute Chat',
    clearChat: 'Clear Chat',
    blockUser: 'Block User',
    unblockUser: 'Unblock User',
    reportUser: 'Report User',
    pleaseWait: 'Please wait...',
    live: 'Live',
    conversationLocked: 'Conversation Locked',
    messageRequest: 'Message Request',
    chatLocked: 'This chat is locked.',
    canSendNewRequest: 'You can now send one new message request.',
    deny: 'Deny',
    approve: 'Approve',
    startConversation: 'Start your conversation',
    messagePlaceholder: 'Message...',
    contactName: 'Contact name',
    phoneNumber: 'Phone number',
    sharedPost: 'Shared post',
    shareContact: 'Share Contact',
    cancel: 'Cancel',
    send: 'Send',
    shareContactTitle: 'Share a Contact',
    enterName: 'Enter name',
    enterPhone: 'Enter phone',
    clearChatConfirm: 'Are you sure you want to clear this chat?',
    confirm: 'Confirm',
    clearAction: 'Clear',
    errorClear: 'Unable to clear chat. Please try again.',
  },
  hi: {
    online: 'ऑनलाइन',
    justNow: 'अभी-अभी',
    yesterday: 'कल',
    today: 'आज',
    muteChat: 'चैट म्यूट करें',
    unmuteChat: 'चैट अनम्यूट करें',
    clearChat: 'चैट साफ़ करें',
    blockUser: 'उपयोगकर्ता ब्लॉक करें',
    unblockUser: 'ब्लॉक हटाएं',
    reportUser: 'उपयोगकर्ता रिपोर्ट करें',
    pleaseWait: 'कृपया प्रतीक्षा करें...',
    live: 'लाइव',
    conversationLocked: 'बातचीत बंद है',
    messageRequest: 'संदेश अनुरोध',
    chatLocked: 'यह चैट बंद है।',
    canSendNewRequest: 'अब आप एक नया संदेश अनुरोध भेज सकते हैं।',
    deny: 'अस्वीकार',
    approve: 'स्वीकार',
    startConversation: 'बातचीत शुरू करें',
    messagePlaceholder: 'संदेश...',
    contactName: 'संपर्क नाम',
    phoneNumber: 'फ़ोन नंबर',
    sharedPost: 'साझा पोस्ट',
    shareContact: 'संपर्क साझा करें',
    cancel: 'रद्द करें',
    send: 'भेजें',
    shareContactTitle: 'संपर्क साझा करें',
    enterName: 'नाम दर्ज करें',
    enterPhone: 'फ़ोन दर्ज करें',
    clearChatConfirm: 'क्या आप वाकई यह चैट साफ़ करना चाहते हैं?',
    confirm: 'पुष्टि करें',
    clearAction: 'साफ़ करें',
    errorClear: 'चैट साफ़ नहीं हो सकी। कृपया पुनः प्रयास करें।',
  },
};

const DM_MESSAGES_CACHE_KEY = 'dm_messages_cache';

type Message = Omit<ChatMessage, 'content' | 'text' | 'timestamp'> & {
  content?: string;
  text?: string;
  timestamp?: string;
  message_type?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | string;
};

// In-memory cache for instant transitions
const dmMessagesMemoryCache = new Map<string, Message[]>();

// Cache functions
const getCachedMessages = async (conversationId: string): Promise<Message[]> => {
  if (dmMessagesMemoryCache.has(conversationId)) {
    return dmMessagesMemoryCache.get(conversationId) || [];
  }
  try {
    const cached = await AsyncStorage.getItem(`${DM_MESSAGES_CACHE_KEY}_${conversationId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        dmMessagesMemoryCache.set(conversationId, parsed);
        return parsed;
      }
    }
    return [];
  } catch { return []; }
};

const setCachedMessages = async (conversationId: string, messages: Message[]) => {
  try {
    dmMessagesMemoryCache.set(conversationId, messages);
    await AsyncStorage.setItem(`${DM_MESSAGES_CACHE_KEY}_${conversationId}`, JSON.stringify(messages));
  } catch { }
};

let dmImageManipulator: typeof ImageManipulatorType | null = null;
const getDMImageManipulator = async () => {
  if (!dmImageManipulator) {
    dmImageManipulator = await import('expo-image-manipulator');
  }
  return dmImageManipulator;
};

let dmContacts: any = null;
const getDMContacts = async () => {
  if (!dmContacts) {
    try {
      const mod = await import('expo-contacts');
      dmContacts = mod?.default && typeof mod.default.requestPermissionsAsync === 'function' ? mod.default : mod;
    } catch (e) {
      try {
        dmContacts = require('expo-contacts');
      } catch (err) {
        console.warn('[DM] expo-contacts module unavailable:', err);
        dmContacts = null;
      }
    }
  }
  return dmContacts;
};

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const DMNativeVideoPlayer = React.memo(({
  uri,
  style,
  resizeMode,
  isLooping,
  isPlaying,
}: {
  uri: string;
  style: any;
  resizeMode: any;
  isLooping: boolean;
  isPlaying: boolean;
}) => {
  const player = useSafeVideoPlayer(uri, (p) => {
    if (p) {
      p.loop = isLooping;
    }
  });

  useEffect(() => {
    if (isPlayerValid(player) && isPlaying) {
      try {
        player.play();
      } catch (e) {
        console.warn('[ChatVideo] play failed:', e);
      }
    }
  }, [player, isPlaying]);

  // Clean up player on unmount to prevent audio leaks
  useEffect(() => {
    return () => {
      if (isPlayerValid(player)) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  const fallback = <View style={[style, { backgroundColor: '#1C1C1E' }]} />;

  if (!ExpoVideoModule?.VideoView || !isPlayerValid(player)) {
    return fallback;
  }

  return (
    <SafeVideoView
      key={uri}
      player={player}
      ExpoVideoModule={ExpoVideoModule}
      style={style}
      contentFit={resizeMode}
      allowsPictureInPicture={false}
      nativeControls={true}
      playsInline
      fallback={fallback}
    />
  );
});
DMNativeVideoPlayer.displayName = 'DMNativeVideoPlayer';

const ChatVideo = ({ uri, style, useNativeControls = false, resizeMode = 'contain', isLooping = false }: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<any>(null);
  const videoStyle = StyleSheet.flatten(style) as any || {};

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  if (Platform.OS === 'web') {
    return (
      <video
        ref={videoRef as any}
        src={uri}
        controls={useNativeControls}
        style={{ width: '100%', height: '100%', objectFit: resizeMode === 'contain' ? 'contain' : 'cover', ...videoStyle }}
      />
    );
  }

  if (isPlaying) {
    return (
      <DMNativeVideoPlayer
        uri={uri}
        style={style}
        resizeMode={resizeMode}
        isLooping={isLooping}
        isPlaying={isPlaying}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[style, { backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', position: 'relative' }]}
      onPress={() => setIsPlaying(true)}
    >
      <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.85)" />
    </TouchableOpacity>
  );
};

const MessageStatus = ({ status, isOwn }: { status?: string; isOwn: boolean }) => {
  if (!isOwn) return null;

  const color = isOwn ? '#000000' : COLORS.textLight;

  if (status === 'sending') {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="time-outline" size={14} color={color} style={{ opacity: 0.5 }} />
      </View>
    );
  }

  if (status === 'read') {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="checkmark-done" size={14} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.statusContainer}>
      <Ionicons name="checkmark" size={14} color={color} />
    </View>
  );
};

type DMMessageItemProps = {
  item: Message;
  index: number;
  userId?: string;
  renderMessageContent: (message: Message, isPressed?: boolean) => React.ReactNode;
  formatChatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  showDateSeparator: boolean;
  showSenderChangeDivider: boolean;
};

const isMediaUrl = (url: string, type: 'image' | 'video') => {
  const normalized = url.split('?')[0].toLowerCase();
  if (type === 'image') {
    return normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp');
  }
  return normalized.endsWith('.mp4') || normalized.endsWith('.mov') || normalized.endsWith('.webm') || normalized.endsWith('.mkv');
};

const DMMessageItem = React.memo(({
  item,
  index,
  userId,
  renderMessageContent,
  formatChatDate,
  formatTime,
  showDateSeparator,
  showSenderChangeDivider,
}: DMMessageItemProps) => {
  const isOwnMessage = item.sender_id === userId;
  const rawContent = item.content ?? item.text ?? '';
  const rawString = typeof rawContent === 'string' ? rawContent : '';
  const hasSharedKeys =
    typeof rawContent === 'object' &&
    rawContent !== null &&
    (Object.prototype.hasOwnProperty.call(rawContent, 'postId') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'post_id') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'mediaUrl') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'media_url') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'uploaderName') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'uploader_name') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'username') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'user_name') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'name') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'author') ||
      Object.prototype.hasOwnProperty.call(rawContent, 'author_name'));
  const looksLikeSharedPost = /post(_)?id|media(_)?url|uploader(_)?name/i.test(rawString);
  const itemMessageType = (item as any).message_type;
  const isSharedPost =
    itemMessageType === 'post_share' ||
    itemMessageType === 'postShare' ||
    hasSharedKeys ||
    looksLikeSharedPost;

  const isMediaMessage =
    itemMessageType === 'image' ||
    itemMessageType === 'video' ||
    (typeof rawString === 'string' && (isMediaUrl(rawString, 'image') || isMediaUrl(rawString, 'video')));

  return (
    <>
      {showDateSeparator && (
        <View style={styles.dateSeparatorContainer}>
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatChatDate(item.created_at)}</Text>
          </View>
        </View>
      )}
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <Avatar name={item.sender_name} photo={item.sender_photo} size={36} />
        )}
        <View style={{
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
          flexShrink: 1,
          maxWidth: '78%'
        }}>
          <Pressable
            style={({ pressed }) => [
              styles.messageBubble,
              isOwnMessage && styles.ownMessageBubble,
              isSharedPost && styles.sharedPostMessageBubble,
              isMediaMessage && styles.mediaMessageBubble,
              pressed && !isSharedPost && !isMediaMessage && styles.messageBubblePressed,
            ]}
          >
            {({ pressed }) => renderMessageContent(item, pressed)}
          </Pressable>
          {!isSharedPost && (
            <View style={[styles.messageFooter, isOwnMessage && styles.ownMessageFooter]}>
              <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
                {formatTime(item.created_at)}
              </Text>
              <MessageStatus status={item.status} isOwn={isOwnMessage} />
            </View>
          )}
        </View>
      </View>
    </>
  );
});

const deduplicateMessages = (msgs: Message[]) => {
  const seen = new Set<string>();
  return msgs.filter((m) => {
    if (!m.id) return true;
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

const DirectMessageScreen = () => {
  const { conversationId, userId, userName, userSL, userPhoto } = useLocalSearchParams<{
    conversationId: string;
    userId?: string;
    userName?: string;
    userSL?: string;
    userPhoto?: string;
  }>();

  const isFocused = useIsFocused();
  const router = useRouter();
  const { user } = useAuthStore();
  const dmLang = useLanguageStore(state => state.language);
  const dmT = (key: keyof typeof DM_STRINGS.en) => DM_STRINGS[dmLang]?.[key] ?? DM_STRINGS.en[key];
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const isNearBottomRef = useRef(true);
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();
  const windowHeight = windowDimensions.height; // ponytail: quick fix for missing windowHeight variable

  const [messages, setMessages] = useState<Message[]>(() => {
    if (conversationId && dmMessagesMemoryCache.has(conversationId)) {
      return dmMessagesMemoryCache.get(conversationId) || [];
    }
    return [];
  });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      textInputRef.current?.blur();
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [windowDimensions.height]);

  // Auto-scroll to latest message when new ones arrive and user is near the bottom
  useEffect(() => {
    if (!messages.length) return;
    if (!isNearBottomRef.current) return;
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages.length]);

  const [conversation, setConversation] = useState<Conversation | null>(() => {
    if (userId && userName) {
      let decodedName = userName;
      try { decodedName = decodeURIComponent(userName); } catch (e) {}
      let decodedPhoto = userPhoto;
      try { decodedPhoto = userPhoto ? decodeURIComponent(userPhoto) : undefined; } catch (e) {}
      let decodedSL = userSL;
      try { decodedSL = userSL ? decodeURIComponent(userSL) : ''; } catch (e) {}

      return {
        conversation_id: conversationId || 'new',
        chat_id: conversationId || 'new',
        user: {
          id: userId,
          name: decodedName,
          sl_id: decodedSL,
          photo: decodedPhoto,
          is_verified: false,
        },
        request_status: 'approved',
      } as unknown as Conversation;
    }
    return null;
  });
  const [otherUserPresence, setOtherUserPresence] = useState<{
    online_status?: boolean;
    last_seen_at?: string;
    last_active?: string;
    updated_at?: string;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(() => {
    if (conversationId && dmMessagesMemoryCache.has(conversationId) && (dmMessagesMemoryCache.get(conversationId)?.length || 0) > 0) {
      return false;
    }
    return true;
  });
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    name: string;
    type: string;
    mediaType: 'image' | 'video';
  } | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactShareName, setContactShareName] = useState('');
  const [contactSharePhone, setContactSharePhone] = useState('');
  const [phoneContacts, setPhoneContacts] = useState<ContactsType.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sharingContact, setSharingContact] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState(false);
  // Global block store — shared across all screens
  const blockedByMeUserSet = useBlockStore(state => state.blockedByMeUserSet);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);

  let hideTabBar: (() => void) | undefined;
  try {
    const tabBar = useTabBar();
    hideTabBar = tabBar.hideTabBar;
  } catch (_e) {}

  useEffect(() => {
    hideTabBar?.();
  }, [hideTabBar]);

  const targetUserId = conversation?.user?.id || userId;
  const isBlockedByMe = targetUserId ? blockedByMeUserSet.has(String(targetUserId)) : false;
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const isBlocked = isBlockedByMe || isBlockedByThem;
  const isBlockedRef = useRef(false);

  useEffect(() => {
    isBlockedRef.current = isBlocked;
  }, [isBlocked]);
  const [reportUserModalVisible, setReportUserModalVisible] = useState(false);
  const attachmentAnim = useRef(new Animated.Value(0)).current;

  // Get picker media types function
  const getPickerMediaTypes = (mediaType: 'image' | 'video') => {
    return mediaType === 'image'
      ? ImagePicker.MediaTypeOptions.Images
      : ImagePicker.MediaTypeOptions.Videos;
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'new' || hasMarkedRead) return;
    if (!isFocused || AppState.currentState !== 'active') {
      console.log('[Chat] Skipping mark read: screen not focused or app in background');
      return;
    }

    try {
      await markDirectMessagesRead(conversationId);
      setHasMarkedRead(true);
      console.log('[Chat] Messages marked as read');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 502 || status === 503) {
        console.warn('[Chat] Backend unavailable:', status);
      } else {
        console.error('[Chat] Error marking messages as read:', error);
      }
    }
  }, [conversationId, hasMarkedRead, isFocused]);

  const handleBackNavigation = useCallback(() => {
    try {
      Keyboard.dismiss();
    } catch (e) {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/messages?tab=Private%20Chat');
    }
  }, [router]);

  const [showOptions, setShowOptions] = useState(false);
  const optionsSheetAnim = useRef(new Animated.Value(350)).current;
  const optionsBackdropAnim = useRef(new Animated.Value(0)).current;

  const openChatOptions = useCallback(() => {
    setShowOptions(true);
    optionsSheetAnim.setValue(350);
    optionsBackdropAnim.setValue(0);
    Animated.parallel([
      Animated.spring(optionsSheetAnim, {
        toValue: 0,
        damping: 24,
        mass: 0.8,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(optionsBackdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [optionsSheetAnim, optionsBackdropAnim]);

  const closeChatOptions = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(optionsSheetAnim, {
        toValue: 350,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(optionsBackdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOptions(false);
      if (typeof callback === 'function') {
        callback();
      }
    });
  }, [optionsSheetAnim, optionsBackdropAnim]);

  const executeClearChat = async () => {
    if (!conversationId) return;
    try {
      await clearDirectMessages(conversationId);
      setMessages([]);
      setConversation((prev) => (prev ? { ...prev, last_message: '' } : prev));
      closeChatOptions();
    } catch (error: any) {
      console.error('[Chat] Clear chat failed:', error);
    Alert.alert('Error', dmT('errorClear'));
    }
  };

  const handleClearChat = () => {
    if (!conversationId) return;
    if (!conversation) {
      Alert.alert('Oops', 'Conversation data is not available.');
      return;
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to clear this chat?');
      if (confirmed) {
        executeClearChat();
      }
      return;
    }

    Alert.alert(
      dmT('confirm'),
      dmT('clearChatConfirm'),
      [
        { text: dmT('cancel'), style: 'cancel' },
        { text: dmT('clearAction'), style: 'destructive', onPress: executeClearChat },
      ],
      { cancelable: true }
    );
  };

  const handleToggleMute = async () => {
    if (!conversationId) return;
    setMuteLoading(true);
    try {
      if (isMuted) {
        await unmuteConversation(conversationId).catch(() => { });
        await unmuteConversationLocal(conversationId);
      } else {
        await muteConversation(conversationId).catch(() => { });
        await muteConversationLocal(conversationId);
      }
      setIsMuted(!isMuted);
    } catch { }
    setMuteLoading(false);
  };

  const checkBlockStatus = useCallback(async () => {
    const activeTargetUserId = conversation?.user?.id || userId;
    if (!activeTargetUserId || !user?.id) return;
    try {
      const [blockedByMeRes, blockedByThemRes] = await Promise.all([
        isUserBlocked(user.id, activeTargetUserId),
        isUserBlocked(activeTargetUserId, user.id).catch(() => false)
      ]);
      if (blockedByMeRes) {
        addBlock(String(activeTargetUserId));
      } else {
        removeBlock(String(activeTargetUserId));
      }
      setIsBlockedByThem(blockedByThemRes);
    } catch (e) {
      try {
        const blockedListRaw = await AsyncStorage.getItem('blocked_users_list');
        const blockedList = blockedListRaw ? JSON.parse(blockedListRaw) : [];
        const localBlocked = blockedList.includes(activeTargetUserId);
        if (localBlocked) {
          addBlock(String(activeTargetUserId));
        } else {
          removeBlock(String(activeTargetUserId));
        }
        setIsBlockedByThem(false);
      } catch { }
    }
  }, [conversation?.user?.id, userId, user?.id, addBlock, removeBlock]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      checkBlockStatus();
    });
    return () => {
      task.cancel();
    };
  }, [conversation?.user?.id, userId, checkBlockStatus]);

  // Reset hasMarkedRead and mark read when screen is focused
  useEffect(() => {
    if (isFocused) {
      setHasMarkedRead(false);
      setTimeout(() => markMessagesAsRead(), 500);
      isNearBottomRef.current = true;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
    }
  }, [isFocused]);

  // Reset hasMarkedRead and mark read when AppState transitions to active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isFocused) {
        setHasMarkedRead(false);
        setTimeout(() => markMessagesAsRead(), 500);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [isFocused, markMessagesAsRead]);

  const handleToggleBlock = async () => {
    const activeTargetUserId = conversation?.user?.id || userId;
    const activeTargetUserName = conversation?.user?.name || userName || 'User';
    if (!activeTargetUserId || !user?.id) return;
    try {
      if (isBlockedByMe) {
        // Unblock
        await unblockUser(user.id, activeTargetUserId);
        removeBlock(String(activeTargetUserId));
        // Also clear AsyncStorage for compatibility
        try {
          const raw = await AsyncStorage.getItem('blocked_users_list');
          const list = raw ? JSON.parse(raw) : [];
          await AsyncStorage.setItem('blocked_users_list', JSON.stringify(list.filter((id: string) => id !== activeTargetUserId)));
        } catch { }
        Alert.alert('Success', `${activeTargetUserName} has been unblocked.`);
        closeChatOptions();
      } else {
        Alert.alert(
          'Block User',
          `Are you sure you want to block ${activeTargetUserName}? You will no longer receive messages from them.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await blockUser(user.id, activeTargetUserId);
                addBlock(String(activeTargetUserId));
                // Also store in AsyncStorage for compatibility
                try {
                  const raw = await AsyncStorage.getItem('blocked_users_list');
                  const list = raw ? JSON.parse(raw) : [];
                  if (!list.includes(activeTargetUserId)) list.push(activeTargetUserId);
                  await AsyncStorage.setItem('blocked_users_list', JSON.stringify(list));
                } catch { }
                Alert.alert('Blocked', `${activeTargetUserName} has been blocked.`);
                closeChatOptions();
              }
            }
          ]
        );
      }
    } catch (e) {
      console.error('Error toggling block status:', e);
      Alert.alert('Error', 'Could not update block status. Please try again.');
    }
  };

  const handleReportUser = () => {
    const activeTargetUserId = conversation?.user?.id || userId;
    if (!activeTargetUserId) return;
    closeChatOptions();
    // Small delay so options panel closes before modal opens
    setTimeout(() => setReportUserModalVisible(true), 300);
  };

  const parseDateOrNull = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getPresenceSource = () => {
    if (otherUserPresence && (otherUserPresence.online_status !== undefined || otherUserPresence.last_seen_at || otherUserPresence.last_active || otherUserPresence.updated_at)) {
      return otherUserPresence;
    }
    return conversation?.user;
  };

  const getPresenceLabel = () => {
    const src = getPresenceSource();
    if (!src) return '';
    if (src.online_status) return dmT('online');
    const lastActive = src.last_seen_at || src.last_active || src.updated_at;
    if (lastActive) {
      try {
        const date = new Date(lastActive);
        if (Number.isNaN(date.getTime())) return '';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return dmT('justNow');
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return dmT('yesterday');
        return formatDateIST(date);
      } catch {
        return '';
      }
    }
    return '';
  };

  const requestStatus = conversation?.request_status || 'approved';
  const isRequester = !!conversation?.request_by && conversation.request_by === user?.id;
  const retryAfterDate = parseDateOrNull(conversation?.request_retry_after);
  const cooldownActive =
    requestStatus === 'rejected' && isRequester && !!retryAfterDate && retryAfterDate.getTime() > Date.now();
  const canSendAfterCooldown =
    requestStatus === 'rejected' && isRequester && (!retryAfterDate || retryAfterDate.getTime() <= Date.now());
  const needsRecipientDecision = requestStatus === 'pending' && !isRequester;
  const isInputLocked =
    requestStatus === 'pending' ||
    (requestStatus === 'rejected' && isRequester && cooldownActive) ||
    isBlocked;

  const inputLockReason = (() => {
    if (isBlockedByThem) {
      return 'You cannot send messages to this user.';
    }
    if (isBlockedByMe) {
      return 'You have blocked this user. Unblock them to resume chat.';
    }
    if (requestStatus === 'pending') {
      return isRequester
        ? 'Waiting for the other user to approve your message request.'
        : 'Approve or deny this message request to continue chat.';
    }
    if (requestStatus === 'rejected' && isRequester && cooldownActive && retryAfterDate) {
      return `Your request was denied. You can send a new request after ${formatDateTimeIST(retryAfterDate)}.`;
    }
    return '';
  })();

  const handleApproveRequest = async () => {
    if (!conversationId) return;
    setRequestActionLoading(true);
    // Optimistically update conversation state so requestCard disappears immediately
    setConversation(prev => prev ? { ...prev, request_status: 'approved' } : prev);
    try {
      await approveDirectMessageRequest(conversationId);
      await fetchConversation();
    } catch (error: any) {
      await fetchConversation();
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve request');
    } finally {
      setRequestActionLoading(false);
    }
  };

  const handleDenyRequest = async () => {
    if (!conversationId) return;
    setRequestActionLoading(true);
    // Optimistically update conversation state so requestCard disappears/updates immediately
    setConversation(prev => prev ? { ...prev, request_status: 'rejected' } : prev);
    try {
      await denyDirectMessageRequest(conversationId);
      await fetchConversation();
    } catch (error: any) {
      await fetchConversation();
      Alert.alert('Error', error.response?.data?.detail || 'Failed to deny request');
    } finally {
      setRequestActionLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => {
      if (textInputRef.current?.isFocused()) {
        textInputRef.current.blur();
        return true;
      }
      handleBackNavigation();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => {
      backHandlerSubscription.remove();
    };
  }, [handleBackNavigation]);

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    try {
      if (conversationId && conversationId !== 'new' && conversationId !== 'undefined') {
        const metadataResponse = await getDMConversationMetadata(conversationId);
        if (metadataResponse?.data) {
          setConversation(metadataResponse.data);
          const recipientId = metadataResponse.data.user?.id || userId;
          if (recipientId) {
            fetchUserPresence(recipientId);
          }
          return;
        }
      }

      if (conversationId === 'new') {
        setConversation({
          conversation_id: 'new',
          chat_id: 'new',
          user: {
            id: userId || '',
            name: userName || 'Unknown User',
            sl_id: userSL || ''
          },
          request_status: 'approved',
        } as unknown as Conversation);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || String(error);
      const isBlockError = error?.response?.status === 403 || errorMsg.includes('block') || errorMsg.includes('Access denied');
      if (isBlockError) {
        setIsBlockedByThem(true);
        console.warn('[Chat] Fetch conversation details blocked relationship detected');
      } else {
        console.warn('Error fetching conversation details by ID, falling back to conversations list:', error);
        try {
          const convResponse = await getConversations();
          const conversations = Array.isArray(convResponse?.data) ? convResponse.data : [];
          const conv = conversations.find((c: Conversation) =>
            c.conversation_id === conversationId || c.chat_id === conversationId
          );
          if (conv) {
            setConversation(conv);
          } else if (userId && userName) {
            setConversation({
              conversation_id: conversationId || 'new',
              chat_id: conversationId || 'new',
              user: {
                id: userId,
                name: userName,
                sl_id: userSL || '',
              },
              request_status: 'approved',
            } as unknown as Conversation);
          }
        } catch (fbError) {
          console.error('Fallback error fetching conversation:', fbError);
        }
      }
    }
  }, [conversationId, userId, userName, userSL]);

  const fetchUserPresence = useCallback(async (targetUserId: string) => {
    try {
      const res = await getUserProfile(targetUserId);
      if (res?.data) {
        setOtherUserPresence({
          online_status: res.data.online_status,
          last_seen_at: res.data.last_seen_at,
          last_active: res.data.last_active,
          updated_at: res.data.updated_at,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch user presence:', err);
    }
  }, []);

  // Fetch messages via REST API
  const fetchMessagesViaAPI = useCallback(async (fromCache = true) => {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'new') {
      setLoading(false);
      return;
    }

    if (fromCache && messages.length === 0) {
      // 1. Try loading from WatermelonDB first (extremely fast SQLite query)
      try {
        const { Q } = require('@nozbe/watermelondb');
        const { database } = require('../../src/database');
        if (database && Platform.OS !== 'web') {
          const localMessages = await database.get('chats')
            .query(
              Q.where('chat_id', conversationId),
              Q.sortBy('created_at', Q.desc),
              Q.take(50)
            ).fetch();

          if (localMessages && localMessages.length > 0) {
            const mapped = localMessages.reverse().map((msg: any) => {
              let msgDateStr = new Date().toISOString();
              try {
                if (msg.createdAt) {
                  const d = new Date(msg.createdAt);
                  if (!isNaN(d.getTime())) {
                    msgDateStr = d.toISOString();
                  }
                } else if (msg.created_at) {
                  const d = new Date(msg.created_at);
                  if (!isNaN(d.getTime())) {
                    msgDateStr = d.toISOString();
                  }
                }
              } catch (e) { }

              return {
                id: msg.id,
                sender_id: msg.senderId || '',
                sender_name: msg.senderName || 'Unknown',
                sender_photo: undefined,
                text: msg.content || '',
                content: msg.content || '',
                message_type: msg.messageType || 'text',
                status: 'sent',
                created_at: msgDateStr,
                timestamp: msgDateStr,
                is_verified: false,
              };
            });
            setMessages(deduplicateMessages(mapped));
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('[DM] Failed to load local messages from WatermelonDB:', err);
      }

      // 2. Fallback to AsyncStorage cache
      if (messages.length === 0) {
        const cached = await getCachedMessages(conversationId);
        if (cached.length > 0) {
          setMessages(deduplicateMessages(cached));
          setLoading(false);
        }
      }
    }

    try {
      const response = await getDirectMessages(conversationId!, 30);
      if (!Array.isArray(response?.data)) {
        console.warn('[Chat] Direct messages response was empty or invalid');
        setLoading(false);
        return;
      }

      const apiMessages = response.data.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id || '',
        sender_name: msg.sender_name || 'Unknown',
        sender_photo: msg.sender_photo,
        text: msg.text || msg.content || '',
        content: msg.content || msg.text || '',
        message_type: msg.message_type || 'text',
        status: msg.status,
        created_at: msg.created_at || msg.timestamp || '',
        timestamp: msg.timestamp || msg.created_at || '',
        is_verified: msg.is_verified || false,
      }));


      const existingIds = new Set();
      for (const m of messages) existingIds.add(m.id);
      const hasNewMessages = apiMessages.some(m => !existingIds.has(m.id));

      if (hasNewMessages || apiMessages.length !== messages.length) {
        // Decrypt messages in parallel
        const decryptedMessages = await Promise.all(apiMessages.map(async (msg: any) => {
           // We only decrypt if it's text. Images/videos also could be encrypted, depending on requirement.
           // You specified content (text/media URL) is encrypted.
           // However sender public key needs to be fetched, but conversation.user contains recipient public key.
           // Wait, sender public key is in conversation.user if it was sent by them.
           // If sent by us, we use conversation.user.public_key as recipient to open? No, we open with sender public key.
           // If we sent it, we can't read it unless we stored it encrypted with OUR public key too.
           // Actually, TweetNaCl box is symmetric in decryption: we just need the OTHER party's public key
           // regardless of who sent it.
           try {
             const otherPubKey = (conversation?.user as any)?.public_key || (conversation?.user as any)?.publicKey;
             if (otherPubKey && msg.content && msg.content.length > 30) {
                 const decrypted = await decryptMessage(msg.content, otherPubKey);
                 return { ...msg, text: decrypted, content: decrypted };
             }
           } catch(e) {}
           return msg;
        }));

        setMessages(prev => {
          const sending = prev.filter(m => m.status === 'sending');
          const apiIds = new Set();
          for (const m of decryptedMessages) apiIds.add(m.id);
          const stillSending = sending.filter(m => !apiIds.has(m.id));
          return deduplicateMessages([...decryptedMessages, ...stillSending]);
        });
        setCachedMessages(conversationId, decryptedMessages);
        setHasMarkedRead(false);
        setTimeout(() => markMessagesAsRead(), 100);
      }


      setLoading(false);
      return true;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || String(error);
      const isBlockError = error?.response?.status === 403 || errorMsg.includes('block') || errorMsg.includes('Access denied');
      if (isBlockError) {
        setIsBlockedByThem(true);
        console.warn('[Chat] Fetch messages blocked relationship detected');
      } else {
        console.error('[Chat] Error fetching messages:', error);
      }
      setLoading(false);
      return true;
    }
  }, [conversationId, messages.length, markMessagesAsRead]);

  useEffect(() => {
    const loadScreenData = async () => {
      await Promise.allSettled([
        fetchConversation(),
        fetchMessagesViaAPI(true)
      ]);
    };

    loadScreenData();

    // Trigger secondary background tasks after screen transition animation finishes
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      const recipientId = userId || conversation?.user?.id;
      if (recipientId) {
        fetchUserPresence(recipientId);
      }

      // Trigger WatermelonDB sync in background
      if (Platform.OS !== 'web') {
        try {
          const { SyncManager } = require('../../src/database/syncManager');
          SyncManager.requestSync();
        } catch (e) {
          console.warn('[DM] Failed to require SyncManager:', e);
        }
      }
    });

    let pollingInterval: NodeJS.Timeout | null = null;
    const socketListenerId = `dm_${conversationId}_${Date.now()}`;

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const startPolling = () => {
      if (pollingInterval) return;
      pollingInterval = setInterval(async () => {
        if (AppState.currentState !== 'active') return;
        await fetchMessagesViaAPI();
      }, 4000);
    };

    const handleSocketConnect = () => {
      stopPolling();
    };

    const handleSocketDisconnect = () => {
      startPolling();
    };

    const handleRequestUpdated = (data: any) => {
      if (data && (data.chat_id === conversationId || data.conversation_id === conversationId)) {
        console.log('[Chat] dm_request_updated event received:', data);
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            request_status: data.request_status,
            request_by: data.request_by,
            request_retry_after: data.request_retry_after,
          };
        });
      }
    };

    socketService.onEvent('connect', handleSocketConnect);
    socketService.onEvent('disconnect', handleSocketDisconnect);
    socketService.onEvent('dm_request_updated', handleRequestUpdated);

    (async () => {
      try {
        await socketService.connect();
        socketService.joinRoom(conversationId!);

        socketService.onMessage(socketListenerId, async (rawMessage: any) => {
          if (isBlockedRef.current) return;
          if (rawMessage && (rawMessage.chat_id === conversationId || rawMessage.conversation_id === conversationId)) {
            // Decrypt on the fly
            let message = { ...rawMessage };
            try {
              const otherPubKey = (conversation?.user as any)?.public_key || (conversation?.user as any)?.publicKey;
              if (otherPubKey && message.content && message.content.length > 30) {
                  const decrypted = await decryptMessage(message.content, otherPubKey);
                  message.text = decrypted;
                  message.content = decrypted;
              }
            } catch(e) {}

            setMessages((prev) => {
              const exists = prev.some((m) => m.id === message.id);
              if (exists) return prev;

              const tempIndex = prev.findIndex(
                (m) => m.status === 'sending' && m.content === message.content && m.sender_id === message.sender_id
              );

              if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = { ...message, status: 'sent' };
                return deduplicateMessages(updated);
              }

              return deduplicateMessages([...prev, message]);
            });
            const cached = await getCachedMessages(conversationId);
            if (!cached.some((m) => m.id === message.id)) {
              await setCachedMessages(conversationId, [...cached, message]);
            }
            setHasMarkedRead(false);
            markMessagesAsRead();
            if (isNearBottomRef.current) {
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
          } else {
            setHasMarkedRead(false);
            await Promise.allSettled([
              fetchMessagesViaAPI(),
              fetchConversation()
            ]);
          }
        });
      } catch (error) {
        console.error('[Chat] Socket real-time setup failed, falling back to polling:', error);
        startPolling();
      }
    })();

    if (!socketService.isConnected() && !pollingInterval) {
      startPolling();
    }

    setTimeout(() => markMessagesAsRead(), 1000);

    return () => {
      interactionTask.cancel();
      socketService.offEvent('dm_request_updated', handleRequestUpdated);
      socketService.offEvent('connect', handleSocketConnect);
      socketService.offEvent('disconnect', handleSocketDisconnect);
      socketService.offMessage(socketListenerId);
      socketService.leaveRoom(conversationId!);
      stopPolling();
    };
  }, [conversationId, fetchConversation, fetchMessagesViaAPI, markMessagesAsRead, uploadingMedia]);

  useEffect(() => {
    if (!conversationId) return;
    isConversationMuted(conversationId).then(setIsMuted);
  }, [conversationId]);

  const inferUploadMimeType = (asset: any, mediaType: 'image' | 'video') => {
    if (asset.mimeType && typeof asset.mimeType === 'string') {
      return asset.mimeType;
    }
    if (asset.type && typeof asset.type === 'string' && asset.type.includes('/')) {
      return asset.type;
    }

    const uri = String(asset.uri || '');
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
    if (ext) {
      if (mediaType === 'image') {
        if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
        if (ext === 'png') return 'image/png';
      }
      if (mediaType === 'video') {
        if (ext === 'mp4') return 'video/mp4';
        if (ext === 'mov') return 'video/quicktime';
        if (ext === 'webm') return 'video/webm';
        if (ext === 'mkv') return 'video/x-matroska';
      }
    }
    return mediaType === 'image' ? 'image/jpeg' : 'video/mp4';
  };

  const compressImageForUpload = async (uri: string) => {
    try {
      const ImageManipulator = await getDMImageManipulator();
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
      );
      return result.uri;
    } catch (error) {
      console.warn('[DM] Image compression failed', error);
      return uri;
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedMedia) || !conversation) return;
    if (isInputLocked) return;

    const tempId = `temp_${Date.now()}`;
    const messageText = newMessage.trim();

    const selected = selectedMedia;
    if (selected) {
      setUploadingMedia(true);
      setSending(true);
      try {
        let uploadResp;
        if (selected.mediaType === 'video') {
          uploadResp = await uploadCompressedVideo({ uri: selected.uri, name: selected.name, type: selected.type });
        } else {
          const compressedUri = await compressImageForUpload(selected.uri);
          uploadResp = await uploadChatMedia({ uri: compressedUri, name: selected.name, type: selected.type });
        }
        const mediaUrl = uploadResp?.data?.media_url || uploadResp?.data?.mediaUrl || uploadResp?.data?.url;
        if (!mediaUrl) {
          throw new Error('Upload failed');
        }
        // The backend schema expects a string, so we will pass public key
        // We get it from the conversation user object
        const pubKey = (conversation.user as any)?.public_key || (conversation.user as any)?.publicKey;
        await sendDirectMessage(conversation.user.sl_id, mediaUrl, selected.mediaType, pubKey);
        setSelectedMedia(null);
        setNewMessage('');
      } catch (error: any) {
        Alert.alert('Upload failed', error?.response?.data?.detail || error?.message || 'Failed to send media.');
      } finally {
        setUploadingMedia(false);
        setSending(false);
      }
      return;
    }

    setNewMessage('');
    const optimisticMessage: Message = {
      id: tempId,
      content: messageText,
      sender_id: user?.id || '',
      sender_name: user?.name || 'Me',
      sender_photo: user?.photo,
      created_at: new Date().toISOString(),
      message_type: 'text',
      status: 'sending',
    };

    setMessages(prev => deduplicateMessages([...prev, optimisticMessage]));

    try {
      const pubKey = (conversation.user as any)?.public_key || (conversation.user as any)?.publicKey;
      const response = await sendDirectMessage(conversation.user.sl_id, messageText, 'text', pubKey);
      const serverMsg = response?.data?.message || response?.data;
      const realId = serverMsg?.id || response?.data?.id || tempId;
      setMessages(prev => deduplicateMessages(prev.map(m =>
        m.id === tempId ? { ...m, id: realId, status: 'sent' } : m
      )));
      const cached = await getCachedMessages(conversationId);
      await setCachedMessages(conversationId, [...cached, { ...optimisticMessage, id: realId, status: 'sent' }]);
    } catch (error: any) {
      setMessages(prev => deduplicateMessages(prev.filter(m => m.id !== tempId)));
      setNewMessage(messageText);
      Alert.alert('Send failed', error.response?.data?.detail || 'Failed to send message');
    }
  };

  const openAttachmentOptions = () => {
    setShowAttachmentOptions(true);
    Animated.timing(attachmentAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const closeAttachmentOptions = () => {
    Animated.timing(attachmentAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowAttachmentOptions(false);
    });
  };

  const toggleAttachmentOptions = () => {
    if (showAttachmentOptions) {
      closeAttachmentOptions();
      return;
    }
    openAttachmentOptions();
  };

  const requestContactsPermission = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Contacts unsupported', 'Phone contacts are only available on native devices.');
      return false;
    }

    try {
      const contactsModule = await getDMContacts();
      const reqFn = contactsModule?.requestPermissionsAsync || contactsModule?.default?.requestPermissionsAsync;
      if (typeof reqFn !== 'function') {
        Alert.alert('Contacts unavailable', 'Contacts module is not available on this build. Please rebuild native app.');
        return false;
      }
      const permission = await reqFn();
      if (permission?.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow contacts access to share phone contacts.');
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('[DM] Contact permission error', error);
      Alert.alert('Permission failed', 'Unable to request contacts permission.');
      return false;
    }
  };

  const loadPhoneContacts = async () => {
    setLoadingContacts(true);
    try {
      const permissionGranted = await requestContactsPermission();
      if (!permissionGranted) return false;

      const contactsModule = await getDMContacts();
      const getContactsFn = contactsModule?.getContactsAsync || contactsModule?.default?.getContactsAsync;
      if (typeof getContactsFn !== 'function') {
        return false;
      }
      const phoneFields = contactsModule?.Fields?.PhoneNumbers || contactsModule?.default?.Fields?.PhoneNumbers || 'phoneNumbers';
      const sortType = contactsModule?.SortTypes?.FirstName || contactsModule?.default?.SortTypes?.FirstName;
      const contactResult = await getContactsFn({
        fields: [phoneFields],
        pageSize: 2000,
        sort: sortType,
      });

      const contactsWithNumbers = (contactResult?.data || []).filter((contact: any) => contact?.phoneNumbers?.length);
      setPhoneContacts(contactsWithNumbers);
      if (!contactsWithNumbers.length) {
        Alert.alert('No contacts found', 'No contacts with phone numbers were found on this device.');
      }
      return contactsWithNumbers.length > 0;
    } catch (error: any) {
      console.error('[DM] Failed to load contacts', error);
      Alert.alert('Failed to load contacts', 'Unable to fetch phone contacts.');
      return false;
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleOpenContactShare = async () => {
    closeAttachmentOptions();
    setContactShareName(user?.name || '');
    setContactSharePhone(user?.phone || '');
    const hasContacts = await loadPhoneContacts();
    if (hasContacts) {
      setShowContactPicker(true);
    } else {
      setShowContactModal(true);
    }
  };

  const handleSelectPhoneContact = (contact: ContactsType.Contact) => {
    const phone = contact.phoneNumbers?.[0]?.number?.trim() || '';
    const name = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contact';
    if (!phone) {
      Alert.alert('No phone number', 'Selected contact does not have a phone number.');
      return;
    }
    setContactShareName(name);
    setContactSharePhone(phone);
    setShowContactPicker(false);
    setShowContactModal(true);
  };

  const handleSendContact = async () => {
    const name = contactShareName.trim() || 'Contact';
    const phone = contactSharePhone.trim();
    if (!phone) {
      Alert.alert('Enter Contact', 'Please enter a phone number to share.');
      return;
    }

    setSharingContact(true);
    try {
      const payload = `${name}\n${phone}`;
      if (!conversation?.user?.sl_id) {
        throw new Error('Unable to resolve recipient.');
      }
      const pubKey = (conversation.user as any)?.public_key || (conversation.user as any)?.publicKey;
      await sendDirectMessage(conversation.user.sl_id, payload, 'contact', pubKey);
      setShowContactModal(false);
      setContactShareName('');
      setContactSharePhone('');
      fetchMessagesViaAPI();
    } catch (error: any) {
      Alert.alert('Share failed', error?.response?.data?.detail || error?.message || 'Failed to share contact.');
    } finally {
      setSharingContact(false);
    }
  };

  const handleOpenCamera = async () => {
    closeAttachmentOptions();
    if (!conversation || !conversation.user?.sl_id || uploadingMedia || sending || isInputLocked) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Camera access is required. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const mediaType = asset.type === 'video' ? 'video' : 'image';
      const fileName = (asset as any).fileName || `chat-${mediaType}-${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
      const mimeType = inferUploadMimeType(asset, mediaType);

      setSelectedMedia({
        uri: asset.uri,
        name: fileName,
        type: mimeType,
        mediaType,
      });
    } catch (error: any) {
      console.warn('Error launching camera:', error);
      Alert.alert('Camera Error', error?.message || 'Camera is not available on this device/simulator.');
    }
  };

  const handlePickMedia = async (mediaType: 'image' | 'video') => {
    closeAttachmentOptions();
    if (!conversation || !conversation.user?.sl_id || uploadingMedia || sending || isInputLocked) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Media library access is required. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const fileName = (asset as any).fileName || `chat-${mediaType}-${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
    const mimeType = inferUploadMimeType(asset, mediaType);

    setSelectedMedia({ uri: asset.uri, name: fileName, type: mimeType, mediaType });
  };

  const formatTime = useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatTimeIST(date);
  }, []);


  const normalizeSharedPostKeys = (source: any) => {
    const normalized: any = {};
    if (!source || typeof source !== 'object') return normalized;

    const canonicalMap: Record<string, string> = {
      postid: 'postId',
      post_id: 'postId',
      mediaurl: 'mediaUrl',
      media_url: 'mediaUrl',
      caption: 'caption',
      title: 'title',
      uploadername: 'uploaderName',
      uploader_name: 'uploaderName',
      username: 'uploaderName',
      user_name: 'uploaderName',
      name: 'uploaderName',
      displayname: 'uploaderName',
      display_name: 'uploaderName',
      fullname: 'uploaderName',
      full_name: 'uploaderName',
      author: 'uploaderName',
      authorname: 'uploaderName',
      author_name: 'uploaderName',
      postedby: 'uploaderName',
      posted_by: 'uploaderName',
      uploaderphoto: 'uploaderPhoto',
      uploader_photo: 'uploaderPhoto',
      userphoto: 'uploaderPhoto',
      user_photo: 'uploaderPhoto',
      photo: 'uploaderPhoto',
      photo_url: 'uploaderPhoto',
      avatar: 'uploaderPhoto',
      image: 'uploaderPhoto',
      profileimage: 'uploaderPhoto',
      profile_image: 'uploaderPhoto',
      user_image: 'uploaderPhoto',
    };

    Object.entries(source).forEach(([key, value]) => {
      const normalizedKey = key.toString().replace(/\s+/g, '').toLowerCase();
      if (canonicalMap[normalizedKey]) {
        normalized[canonicalMap[normalizedKey]] = value ?? '';
      }
    });

    return normalized;
  };

  const parseSharedPostPayload = (source: any) => {
    let parsed = { mediaUrl: '', caption: '', title: 'Shared post', postId: '', uploaderName: '', uploaderPhoto: '' };
    if (!source) return parsed;

    const findNestedField = (obj: any, candidateKeys: string[]): any => {
      if (!obj || typeof obj !== 'object') return undefined;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const nested = findNestedField(item, candidateKeys);
          if (nested) return nested;
        }
        return undefined;
      }

      for (const [key, value] of Object.entries(obj)) {
        const normalizedKey = key.toString().replace(/\s+/g, '').toLowerCase();
        if (candidateKeys.includes(normalizedKey) && value) {
          return value;
        }
        if (typeof value === 'object' && value !== null) {
          const nested = findNestedField(value, candidateKeys);
          if (nested) return nested;
        }
      }
      return undefined;
    };

    const mergeParsed = (sourceObj: any) => {
      let normalized = normalizeSharedPostKeys(sourceObj);
      const nestedSources = [sourceObj?.user, sourceObj?.author, sourceObj?.creator, sourceObj?.post, sourceObj?.data, sourceObj?.attributes];
      nestedSources.forEach((nestedSource) => {
        if (nestedSource && typeof nestedSource === 'object') {
          normalized = { ...normalized, ...normalizeSharedPostKeys(nestedSource) };
        }
      });

      if (sourceObj?.post && typeof sourceObj.post === 'object') {
        const nestedPostFields = [sourceObj.post.user, sourceObj.post.author, sourceObj.post.creator, sourceObj.post.data, sourceObj.post.attributes];
        nestedPostFields.forEach((nestedSource) => {
          if (nestedSource && typeof nestedSource === 'object') {
            normalized = { ...normalized, ...normalizeSharedPostKeys(nestedSource) };
          }
        });
      }

      if (!normalized.uploaderName) {
        const nestedName = findNestedField(sourceObj, [
          'uploadername',
          'uploader_name',
          'username',
          'user_name',
          'displayname',
          'display_name',
          'fullname',
          'full_name',
          'author',
          'authorname',
          'author_name',
          'postedby',
          'posted_by',
          'creatorname',
          'creator_name',
          'name',
        ]);
        if (nestedName) normalized.uploaderName = String(nestedName);
      }
      if (!normalized.uploaderPhoto) {
        const nestedPhoto = findNestedField(sourceObj, [
          'uploaderphoto',
          'uploader_photo',
          'userphoto',
          'user_photo',
          'photo',
          'photo_url',
          'avatar',
          'image',
          'profileimage',
          'profile_image',
          'user_image',
        ]);
        if (nestedPhoto) normalized.uploaderPhoto = String(nestedPhoto);
      }

      return { ...parsed, ...normalized };
    };

    if (typeof source === 'object' && source !== null) {
      return mergeParsed(source);
    }

    try {
      let decoded = JSON.parse(source);
      if (typeof decoded === 'string') {
        decoded = JSON.parse(decoded);
      }
      if (typeof decoded === 'object' && decoded !== null) {
        return mergeParsed(decoded);
      }
    } catch (e: any) {
      try {
        const snake = (key: string) => key.replace(/([A-Z])/g, '_$1').toLowerCase();
        const extract = (key: string) => {
          const candidates = [key, snake(key)];
          for (const candidate of candidates) {
            const match = source.match(new RegExp(`"${candidate}"\\s*:\\s*"([^\"]*)"`));
            if (match) return match[1];
            const singleMatch = source.match(new RegExp(`'${candidate}'\\s*:\\s*'([^']*)'`));
            if (singleMatch) return singleMatch[1];
          }
          return '';
        };
        parsed.postId = extract('postId');
        parsed.mediaUrl = extract('mediaUrl');
        parsed.caption = extract('caption') || `Parse error: ${e.message}\nRaw: ${source}`;
        parsed.title = extract('title') || 'Shared post';
        parsed.uploaderName = extract('uploaderName') || extract('username') || extract('user_name') || extract('display_name') || extract('author_name') || extract('posted_by');
        parsed.uploaderPhoto = extract('uploaderPhoto') || extract('userPhoto') || extract('user_photo') || extract('photo_url');
        return parsed;
      } catch {
        // Fallback
      }
    }

    try {
      const lines = source.split('\n').map((line: string) => line.trim()).filter(Boolean);
      const mediaLine = lines.find((line: string) => line.match(/https?:\/\/.+\.(jpg|jpeg|png|webp|mp4|mov|webm|mkv)(\?.*)?$/i));
      return {
        ...parsed,
        mediaUrl: mediaLine || source,
        caption: lines[0] || 'Shared post',
      };
    } catch {
      return parsed;
    }
  };

  const parseContactPayload = (source: string) => {
    if (!source) return { name: 'Contact', phone: '' };
    try {
      const contactData = JSON.parse(source);
      return {
        name: contactData?.name || 'Contact',
        phone: contactData?.phone || source,
      };
    } catch {
      const newlineParts = source.split('\n').map((part) => part.trim()).filter(Boolean);
      if (newlineParts.length >= 2) {
        return { name: newlineParts[0] || 'Contact', phone: newlineParts[1] };
      }
      const pipeParts = source.split('|').map((part) => part.trim());
      if (pipeParts.length === 2) {
        return { name: pipeParts[0] || 'Contact', phone: pipeParts[1] };
      }
      return { name: 'Contact', phone: source };
    }
  };

  const getSafeUri = (uri?: string) => {
    if (!uri || typeof uri !== 'string' || uri === 'null' || uri === 'undefined') return undefined;
    return encodeURI(uri.trim());
  };

  const renderMessageContent = useCallback((message: any, isPressed?: boolean) => {
    const rawContent = message.content ?? message.text ?? '';
    const sourceUrl = typeof rawContent === 'string' ? rawContent.trim() : '';
    const safeSourceUrl = getSafeUri(sourceUrl);

    const shared = parseSharedPostPayload(rawContent);
    const safeSharedMediaUrl = getSafeUri(shared.mediaUrl);

    const rawString = typeof rawContent === 'string' ? rawContent : '';
    const hasSharedKeys =
      typeof rawContent === 'object' &&
      rawContent !== null &&
      (Object.prototype.hasOwnProperty.call(rawContent, 'postId') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'post_id') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'mediaUrl') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'media_url') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'uploaderName') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'uploader_name') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'username') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'user_name') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'name') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'author') ||
        Object.prototype.hasOwnProperty.call(rawContent, 'author_name'));
    const looksLikeSharedPost = /post(_)?id|media(_)?url|uploader(_)?name/i.test(rawString);
    const isSharedPost =
      message.message_type === 'post_share' ||
      message.message_type === 'postShare' ||
      hasSharedKeys ||
      looksLikeSharedPost;

    if (message.message_type === 'image' && safeSourceUrl) {
      return (
        <TouchableOpacity onPress={() => setFullScreenMedia({ uri: safeSourceUrl, type: 'image' })} activeOpacity={0.85}>
          <Image source={{ uri: safeSourceUrl }} style={styles.messageMedia} resizeMode="cover" />
        </TouchableOpacity>
      );
    }
    if (message.message_type === 'video' && safeSourceUrl) {
      return (
        <ChatVideo
          uri={safeSourceUrl}
          style={styles.messageVideo}
          useNativeControls
          resizeMode="contain"
          isLooping={false}
        />
      );
    }
    if (isSharedPost) {
      return (
        <TouchableOpacity
          style={styles.sharedPostContainer}
          activeOpacity={0.85}
          onPress={() => {
            if (shared.postId) {
              router.push({
                pathname: '/post/[id]',
                params: {
                  id: shared.postId,
                  mediaUrl: shared.mediaUrl || '',
                  caption: shared.caption || '',
                  uploaderName: shared.uploaderName || '',
                  uploaderPhoto: shared.uploaderPhoto || '',
                },
              });
            }
          }}
        >
          {shared.uploaderName ? (
            <View style={styles.sharedPostUploader}>
              <Ionicons name="person-circle" size={24} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sharedPostUploaderText} numberOfLines={1}>
                {shared.uploaderName}
              </Text>
            </View>
          ) : null}
          {safeSharedMediaUrl && safeSharedMediaUrl !== 'null' ? (
            <Image source={{ uri: safeSharedMediaUrl }} style={styles.sharedPostImage} resizeMode="cover" />
          ) : null}
          <View style={styles.sharedPostMeta}>
            <Text style={styles.sharedPostTitle}>{shared.title || 'Shared post'}</Text>
            {shared.caption ? (
              <Text style={styles.sharedPostCaption} numberOfLines={2}>
                {shared.caption}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    }
    if (message.message_type === 'contact') {
      const { name: contactName, phone: contactPhone } = parseContactPayload(sourceUrl);
      return (
        <View style={styles.contactCard}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
          <View style={styles.contactCardContent}>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.contactPhone}>{contactPhone}</Text>
          </View>
        </View>
      );
    }
    if (sourceUrl && isMediaUrl(sourceUrl, 'image')) {
      return (
        <TouchableOpacity onPress={() => setFullScreenMedia({ uri: sourceUrl, type: 'image' })} activeOpacity={0.85}>
          <Image source={{ uri: sourceUrl }} style={styles.messageMedia} resizeMode="cover" />
        </TouchableOpacity>
      );
    }
    if (sourceUrl && isMediaUrl(sourceUrl, 'video')) {
      return (
        <ChatVideo
          uri={sourceUrl}
          style={styles.messageVideo}
          useNativeControls
          resizeMode="contain"
          isLooping={false}
        />
      );
    }
    const fallbackText = typeof message.text === 'string'
      ? message.text
      : typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content || {});

    return (
      <Text
        style={[
          styles.messageText,
          message.sender_id === user?.id && styles.ownMessageText,
        ]}
      >
        {fallbackText}
      </Text>
    );
  }, [router, user?.id]);

  const isSameDay = (dateA: Date, dateB: Date) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const formatChatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return dmT('today');
    if (isSameDay(date, yesterday)) return dmT('yesterday');
    return formatDateIST(date);
  }, []);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const showDateSeparator = index === 0 || !isSameDay(new Date(item.created_at), new Date(messages[index - 1]?.created_at || ''));
    const showSenderChangeDivider = !!(
      messages[index + 1] &&
      messages[index + 1].sender_id !== item.sender_id
    );
    return (
      <DMMessageItem
        item={item}
        index={index}
        userId={user?.id}
        renderMessageContent={renderMessageContent}
        formatChatDate={formatChatDate}
        formatTime={formatTime}
        showDateSeparator={showDateSeparator}
        showSenderChangeDivider={showSenderChangeDivider}
      />
    );
  }, [user?.id, renderMessageContent, formatChatDate, formatTime, messages]);

  const bottomPadding = Platform.OS === 'web' ? 8 : (Platform.OS === 'android' ? 8 : Math.max(insets.bottom, 8));

  const renderContent = () => (
    <View
      style={styles.chatScreen}
    >
      <View style={styles.chatBackground} pointerEvents="none">
        <LinearGradient
          colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
          locations={[0, 0.09, 0.25]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={[
        styles.header,
        {
          height: insets.top + 68,
          paddingTop: insets.top
        }
      ]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Svg width={12} height={20} viewBox="0 0 12 20" fill="none">
            <Path d="M10 20L0 10L10 0L11.775 1.775L3.55 10L11.775 18.225L10 20Z" fill="#291715" />
          </Svg>
        </TouchableOpacity>
        {conversation && (
          <TouchableOpacity style={styles.headerInfo} onPress={() => {
            if (conversation.user?.id) {
              router.push(`/profile/${conversation.user.id}`);
            }
          }} activeOpacity={0.7}>
            <View style={styles.avatarWrapper}>
              <Avatar name={conversation.user.name} photo={conversation.user.photo} size={40} />
            </View>
            <View style={styles.headerTextInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.headerTitle} numberOfLines={1}>{conversation.user.name}</Text>
                {(conversation.user as any)?.is_verified && (
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6B00" style={{ marginLeft: 4 }} />
                )}
              </View>
              <View style={styles.statusRow}>
                {isRealtime && (
                  <View style={styles.realtimeBadge}>
                    <View style={styles.realtimeDot} />
                    <Text style={styles.realtimeText}>{dmT('live')}</Text>
                  </View>
                )}
                {!!getPresenceLabel() && (
                  <Text style={[styles.headerSubtitle, { color: getPresenceSource()?.online_status ? '#3DC07D' : COLORS.textSecondary }]}>
                    {getPresenceLabel()}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.moreButton} onPress={openChatOptions} hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <Modal
          visible={showOptions}
          transparent
          statusBarTranslucent={true}
          animationType="none"
          onRequestClose={() => closeChatOptions()}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  opacity: optionsBackdropAnim,
                },
              ]}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={() => closeChatOptions()} />
            </Animated.View>

            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: optionsSheetAnim }],
                  paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, SPACING.md) + 24 : Math.max(insets.bottom, SPACING.md),
                },
              ]}
            >
              {/* Grab Handle */}
              <View style={styles.modalHandleBar} />

              <Pressable
                style={styles.modalItem}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.10)', foreground: true, borderless: false }}
                onPress={() => closeChatOptions(handleToggleMute)}
                disabled={muteLoading}
              >
                <Ionicons name={isMuted ? "notifications-outline" : "notifications-off-outline"} size={22} color="#1A1A1A" style={{ marginRight: 14 }} />
                <Text style={styles.modalItemText}>{muteLoading ? dmT('pleaseWait') : isMuted ? dmT('unmuteChat') : dmT('muteChat')}</Text>
              </Pressable>
              <View style={styles.modalDivider} />

              <Pressable
                style={styles.modalItem}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.10)', foreground: true, borderless: false }}
                onPress={() => closeChatOptions(handleClearChat)}
              >
                <Ionicons name="trash-outline" size={22} color="#1A1A1A" style={{ marginRight: 14 }} />
                <Text style={styles.modalItemText}>{dmT('clearChat')}</Text>
              </Pressable>
              <View style={styles.modalDivider} />

              <Pressable
                style={styles.modalItem}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.10)', foreground: true, borderless: false }}
                onPress={() => closeChatOptions(handleToggleBlock)}
              >
                <Ionicons name="ban-outline" size={22} color="#1A1A1A" style={{ marginRight: 14 }} />
                <Text style={styles.modalItemText}>{isBlockedByMe ? dmT('unblockUser') : dmT('blockUser')}</Text>
              </Pressable>
              <View style={styles.modalDivider} />

              <Pressable
                style={styles.modalItem}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.10)', foreground: true, borderless: false }}
                onPress={() => closeChatOptions(handleReportUser)}
              >
                <Ionicons name="warning-outline" size={22} color="#1A1A1A" style={{ marginRight: 14 }} />
                <Text style={styles.modalItemText}>{dmT('reportUser')}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        <Modal visible={!!fullScreenMedia} transparent animationType="fade" onRequestClose={() => setFullScreenMedia(null)}>
          <View style={styles.fullScreenMediaOverlay}>
            <TouchableOpacity style={styles.fullScreenMediaClose} onPress={() => setFullScreenMedia(null)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            {fullScreenMedia?.type === 'image' && (
              <Image source={{ uri: getSafeUri(fullScreenMedia.uri) || '' }} style={styles.fullScreenMediaImage} resizeMode="contain" />
            )}
            {fullScreenMedia?.type === 'video' && (
              <ChatVideo uri={fullScreenMedia.uri} style={styles.fullScreenMediaVideo} useNativeControls resizeMode="contain" isLooping={false} />
            )}
          </View>
        </Modal>

        {(requestStatus !== 'approved' || isBlocked) && (
          <View style={styles.requestCard}>
            <Text style={styles.requestTitle}>{isBlocked ? dmT('conversationLocked') : dmT('messageRequest')}</Text>
            <Text style={styles.requestText}>{inputLockReason || dmT('chatLocked')}</Text>
            {!isBlocked && canSendAfterCooldown && <Text style={styles.requestHint}>{dmT('canSendNewRequest')}</Text>}
            {!isBlocked && needsRecipientDecision && (
              <View style={styles.requestActionRow}>
                <TouchableOpacity style={[styles.requestButton, styles.requestDenyButton]} onPress={handleDenyRequest} disabled={requestActionLoading}>
                  <Text style={[styles.requestButtonText, styles.requestDenyButtonText]}>{requestActionLoading ? dmT('pleaseWait') : dmT('deny')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.requestButton, styles.requestApproveButton]} onPress={handleApproveRequest} disabled={requestActionLoading}>
                  <Text style={styles.requestButtonText}>{requestActionLoading ? dmT('pleaseWait') : dmT('approve')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.messagesWrapper}>
          {loading && messages.length === 0 ? (
            <View style={{ flex: 1, padding: SPACING.md, justifyContent: 'flex-end' }}>
              {[1, 2, 3, 4, 5].reverse().map((item, index) => {
                const isOwn = index % 2 === 0;
                return (
                  <View key={item} style={[styles.messageContainer, isOwn && styles.ownMessageContainer, { opacity: 1 - index * 0.15, marginBottom: 12 }]}>
                    {!isOwn && <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)' }} />}
                    <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble, { backgroundColor: isOwn ? 'rgba(55, 151, 240, 0.2)' : 'rgba(0,0,0,0.06)', width: index % 3 === 0 ? '60%' : '40%', height: 40 }]} />
                  </View>
                );
              })}
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.id || index}_${index}`}
              contentContainerStyle={[styles.messagesList, { paddingBottom: bottomPadding + 8 }]}
              onContentSizeChange={() => {
                if (isNearBottomRef.current) flatListRef.current?.scrollToEnd({ animated: false });
              }}
              onLayout={() => {
                isNearBottomRef.current = true;
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              onScroll={(e) => {
                const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                isNearBottomRef.current =
                  contentOffset.y + layoutMeasurement.height >= contentSize.height - 120;
              }}
              scrollEventThrottle={100}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>{dmT('startConversation')}</Text>
                </View>
              }
            />
          )}
        </View>

        <View
          style={[styles.inputWrapperContainer, { paddingBottom: Platform.OS === 'android' ? (isKeyboardVisible ? 8 : Math.max(insets.bottom, 16)) : Math.max(insets.bottom, 12) }]}
        >
          {selectedMedia && (
            <View style={styles.mediaPreviewContainer}>
              {selectedMedia.mediaType === 'image' ? (
                <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreviewImage} resizeMode="cover" />
              ) : (
                <ChatVideo uri={selectedMedia.uri} style={styles.mediaPreviewVideo} useNativeControls resizeMode="contain" isLooping={false} />
              )}
              <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.mediaPreviewCloseButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={styles.inputContainer}
          >
            <View style={styles.inputFieldContainer}>
              <TextInput
                ref={textInputRef}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={dmT('messagePlaceholder')}
                placeholderTextColor="#888888"
                multiline
                blurOnSubmit={false}
                style={styles.input}
                editable={!isInputLocked}
                returnKeyType="default"
              />
              <TouchableOpacity onPress={handleOpenCamera} disabled={uploadingMedia || sending || isInputLocked} style={styles.inlineIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="camera-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleAttachmentOptions} disabled={uploadingMedia || sending || isInputLocked} style={styles.inlineIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="attach-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() && !selectedMedia) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !selectedMedia) || sending || uploadingMedia || isInputLocked}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Svg width={20} height={18} viewBox="0 0 20 18" fill="none">
                <Path
                  d="M19.7218 0.196948C19.4963 0.00063171 19.1815 -0.0537551 18.904 0.0556532L0.809777 7.19361C-0.101125 7.55066 -0.287004 8.76782 0.475207 9.3845C0.6356 9.51427 0.824875 9.60282 1.02674 9.64254L5.71502 10.5704V15.84C5.71313 16.4273 6.067 16.9563 6.60786 17.1747C7.14793 17.397 7.76791 17.2639 8.17122 16.839L10.4319 14.4756L14.0184 17.64C14.2772 17.8714 14.6109 17.9994 14.9568 18C15.1083 17.9999 15.259 17.9759 15.4032 17.9289C15.8827 17.7755 16.2455 17.377 16.3559 16.8822L19.9799 0.989854C20.0459 0.697791 19.9467 0.392822 19.7218 0.196948ZM14.263 3.43698L6.26411 9.21143L1.83565 8.33572L14.263 3.43698ZM7.14356 15.84V11.5667L9.3569 13.5234L7.14356 15.84ZM14.9586 16.56L7.57659 10.0349L18.2013 2.35877L14.9586 16.56Z"
                  fill="#000"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {showAttachmentOptions && (
            <Modal visible={showAttachmentOptions} transparent animationType="none" onRequestClose={closeAttachmentOptions}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' }}
                activeOpacity={1}
                onPress={closeAttachmentOptions}
              >
                <TouchableWithoutFeedback>
                  <Animated.View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderTopLeftRadius: 28,
                      borderTopRightRadius: 28,
                      paddingHorizontal: 24,
                      paddingTop: 16,
                      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: -4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 16,
                      elevation: 12,
                      transform: [
                        {
                          translateY: attachmentAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [300, 0],
                          }),
                        },
                      ],
                      opacity: attachmentAnim,
                    }}
                  >
                    {/* Drag Handle */}
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 }} />

                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 22 }}>
                      Share Content
                    </Text>

                    {/* Instagram Style Grid Items */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                      {/* Photo / Gallery */}
                      <TouchableOpacity
                        style={{ alignItems: 'center' }}
                        onPress={() => { closeAttachmentOptions(); handlePickMedia('image'); }}
                        disabled={uploadingMedia || sending || isInputLocked}
                      >
                        <LinearGradient
                          colors={['#833AB4', '#FD1D1D', '#FCB045']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}
                        >
                          <Ionicons name="image" size={26} color="#FFF" />
                        </LinearGradient>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#4A4A4A' }}>
                          Photo
                        </Text>
                      </TouchableOpacity>

                      {/* Camera */}
                      <TouchableOpacity
                        style={{ alignItems: 'center' }}
                        onPress={() => { closeAttachmentOptions(); handleOpenCamera(); }}
                        disabled={uploadingMedia || sending || isInputLocked}
                      >
                        <LinearGradient
                          colors={['#FF6B00', '#FF8E53']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}
                        >
                          <Ionicons name="camera" size={26} color="#FFF" />
                        </LinearGradient>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#4A4A4A' }}>
                          Camera
                        </Text>
                      </TouchableOpacity>

                      {/* Video */}
                      <TouchableOpacity
                        style={{ alignItems: 'center' }}
                        onPress={() => { closeAttachmentOptions(); handlePickMedia('video'); }}
                        disabled={uploadingMedia || sending || isInputLocked}
                      >
                        <LinearGradient
                          colors={['#00C853', '#B9F6CA']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}
                        >
                          <Ionicons name="videocam" size={26} color="#FFF" />
                        </LinearGradient>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#4A4A4A' }}>
                          Video
                        </Text>
                      </TouchableOpacity>

                      {/* Contact */}
                      <TouchableOpacity
                        style={{ alignItems: 'center' }}
                        onPress={() => { closeAttachmentOptions(); handleOpenContactShare(); }}
                        disabled={uploadingMedia || sending || isInputLocked}
                      >
                        <LinearGradient
                          colors={['#2979FF', '#82B1FF']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}
                        >
                          <Ionicons name="person" size={26} color="#FFF" />
                        </LinearGradient>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#4A4A4A' }}>
                          Contact
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          )}
        </View>

        <Modal visible={showContactModal} transparent animationType="slide" onRequestClose={() => setShowContactModal(false)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setShowContactModal(false)}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 24,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LinearGradient
                      colors={['#2979FF', '#82B1FF']}
                      style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
                    >
                      <Ionicons name="person" size={22} color="#FFF" />
                    </LinearGradient>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>
                      Share Contact
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowContactModal(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Input Fields */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginLeft: 2 }}>Contact Name</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E8ECEF' }}>
                    <Ionicons name="person-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 15, color: '#1A1A1A' }}
                      value={contactShareName}
                      onChangeText={setContactShareName}
                      placeholder="Full Name"
                      placeholderTextColor="#AAA"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginLeft: 2 }}>Phone Number</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E8ECEF' }}>
                    <Ionicons name="call-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 15, color: '#1A1A1A' }}
                      value={contactSharePhone}
                      onChangeText={setContactSharePhone}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                      placeholderTextColor="#AAA"
                    />
                  </View>
                </View>

                {/* Pick from Phone Contacts Button */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEF4FF',
                    borderRadius: 14,
                    height: 48,
                    marginBottom: 12,
                  }}
                  onPress={async () => {
                    const hasContacts = await loadPhoneContacts();
                    if (hasContacts) setShowContactPicker(true);
                  }}
                  disabled={loadingContacts}
                >
                  {loadingContacts ? (
                    <ActivityIndicator size="small" color="#2979FF" />
                  ) : (
                    <>
                      <Ionicons name="book-outline" size={20} color="#2979FF" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2979FF' }}>Pick from Phone Contacts</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity
                  style={{
                    borderRadius: 14,
                    height: 50,
                    overflow: 'hidden',
                    opacity: sharingContact ? 0.7 : 1,
                  }}
                  onPress={handleSendContact}
                  disabled={sharingContact}
                >
                  <LinearGradient
                    colors={['#FF6B00', '#FF8E53']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {sharingContact ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>Share Contact</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showContactPicker} transparent animationType="slide" onRequestClose={() => setShowContactPicker(false)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setShowContactPicker(false)}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: Platform.OS === 'ios' ? 36 : 20,
                  maxHeight: '80%',
                }}
              >
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>Select Contact</Text>
                  <TouchableOpacity onPress={() => setShowContactPicker(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {loadingContacts ? (
                  <ActivityIndicator size="large" color="#FF6B00" style={{ paddingVertical: 40 }} />
                ) : (
                  <FlatList
                    data={phoneContacts}
                    keyExtractor={(item, index) => String((item as any).id || item.name || item.phoneNumbers?.[0]?.id || index)}
                    renderItem={({ item }) => {
                      const phone = item.phoneNumbers?.[0]?.number || 'No number';
                      const name = item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unknown';
                      return (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F0F2F5',
                          }}
                          onPress={() => handleSelectPhoneContact(item)}
                        >
                          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FF6B00' }}>
                              {name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>{name}</Text>
                            <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{phone}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
        {Platform.OS === 'android' && <View style={{ height: isKeyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <>
        <View style={[styles.container, { height: windowDimensions.height }]}>{renderContent()}</View>
        {/* Apple Guideline 1.2 - Report User Modal */}
        <ReportModal
          visible={reportUserModalVisible}
          onClose={() => setReportUserModalVisible(false)}
          reporterUid={user?.id || ''}
          reportedUserUid={conversation?.user?.id || ''}
          contentId={conversation?.conversation_id || conversation?.chat_id || ''}
          contentType="message"
          apiFallback={async (reason) => {
            if (conversation?.user?.id) {
              await reportContent({ content_type: 'user', content_id: conversation.user.id, category: reason as any, description: `DM report: ${reason}` });
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <SafeAreaView
        style={styles.container}
        edges={['left', 'right']}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
      {/* Apple Guideline 1.2 - Report User Modal */}
      <ReportModal
        visible={reportUserModalVisible}
        onClose={() => setReportUserModalVisible(false)}
        reporterUid={user?.id || ''}
        reportedUserUid={conversation?.user?.id || ''}
        contentId={conversation?.conversation_id || conversation?.chat_id || ''}
        contentType="message"
        apiFallback={async (reason) => {
          if (conversation?.user?.id) {
            await reportContent({ content_type: 'user', content_id: conversation.user.id, category: reason as any, description: `DM report: ${reason}` });
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chatScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  chatBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F2ECE8', pointerEvents: 'none' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 250, 248, 0.50)',
    // Height is set dynamically in inline style based on insets.top
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: Platform.OS === 'android' ? 0 : 10,
    borderBottomWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 10,
    flexShrink: 0
  },
  backButton: { marginRight: SPACING.sm, padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  moreButton: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: BORDER_RADIUS.full, marginLeft: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerTextInfo: { marginLeft: 12, flex: 1 },
  avatarWrapper: { position: 'relative' },
  headerTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_600SemiBold', color: COLORS.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginRight: 6 },
  realtimeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B00', marginRight: 4 },
  realtimeText: { fontSize: 11, fontWeight: '700', color: '#FF6B00' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  modalHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#1A1A1A'
  },
  modalItemDestructive: { color: COLORS.error },
  modalDivider: { height: 1, backgroundColor: '#F2F2F2', marginVertical: 0 },
  requestCard: { marginHorizontal: SPACING.md, marginTop: SPACING.sm, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.divider },
  requestTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  requestText: { fontSize: 13, color: COLORS.textSecondary },
  requestHint: { marginTop: 6, fontSize: 12, fontWeight: '600', color: COLORS.primary },
  requestActionRow: { marginTop: SPACING.sm, flexDirection: 'row', gap: SPACING.sm },
  requestButton: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  requestApproveButton: { backgroundColor: '#0088CC' },
  requestDenyButton: { backgroundColor: '#F5F5F5' },
  requestButtonText: { fontSize: 14, fontWeight: '600' },
  requestDenyButtonText: { color: '#E53935' },
  messagesWrapper: { flex: 1, overflow: 'hidden' },
  messagesList: { padding: SPACING.md, flexGrow: 1 },
  dateSeparatorContainer: { width: '100%', alignItems: 'center', marginVertical: SPACING.sm },
  dateSeparator: { paddingHorizontal: SPACING.md, paddingVertical: 4, backgroundColor: 'transparent', borderWidth: 0 },
  dateSeparatorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8E8E8E' },
  messageContainer: { flexDirection: 'row', marginBottom: SPACING.xs, alignItems: 'flex-end', paddingHorizontal: SPACING.md },
  ownMessageContainer: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 8,
    borderWidth: 0
  },
  ownMessageBubble: {
    backgroundColor: '#FFD5C2',
    borderRadius: 22,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    marginLeft: 0
  },
  messageBubblePressed: {
    backgroundColor: '#E0E0E0',
  },
  sharedPostMessageBubble: { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0, borderRadius: 0, shadowOpacity: 0, elevation: 0, borderWidth: 0, marginLeft: 0, width: '100%', maxWidth: 340, alignSelf: 'flex-start' },
  mediaMessageBubble: { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0, borderWidth: 0, shadowOpacity: 0, elevation: 0, shadowColor: 'transparent', shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  messageText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#000000', lineHeight: 21 },
  ownMessageText: { color: '#1A1A1A' },
  timeText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8E8E8E' },
  ownTimeText: { color: '#8E8E8E' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 4, marginLeft: 8 },
  ownMessageFooter: { justifyContent: 'flex-end', marginRight: 8, marginLeft: 0 },
  statusContainer: { marginLeft: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xl * 4 },
  emptyText: { marginTop: SPACING.md, fontSize: 16, fontWeight: '500', color: COLORS.textSecondary },
  inputWrapperContainer: { backgroundColor: 'transparent', paddingTop: 12, borderTopWidth: 0, zIndex: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 8 },
  inputFieldContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.50)',
    paddingLeft: 16,
    paddingRight: 17,
    paddingTop: Platform.OS === 'android' ? 4 : 10,
    paddingBottom: Platform.OS === 'android' ? 4 : 10,
    minHeight: 44,
    height: Platform.OS === 'android' ? undefined : 44
  },
  inlineIcon: { paddingHorizontal: 4, paddingVertical: 0, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  attachmentOverlay: { position: 'absolute', bottom: 60, left: SPACING.sm, width: 160, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.divider, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 8, paddingVertical: SPACING.xs, zIndex: 20 },
  attachmentOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  attachmentOptionText: { marginLeft: SPACING.sm, color: COLORS.text, fontSize: 14 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4FAFF', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, marginTop: SPACING.xs },
  contactCardContent: { marginLeft: SPACING.sm },
  contactName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  contactPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  sharedPostContainer: { maxWidth: 340, width: '100%', minHeight: 220, flexShrink: 1, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider, marginBottom: SPACING.xs, alignSelf: 'flex-start' },
  sharedPostUploader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, backgroundColor: COLORS.surface },
  sharedPostUploaderText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sharedPostImage: { width: '100%', height: 180, backgroundColor: COLORS.background },
  sharedPostMeta: { padding: SPACING.sm },
  sharedPostTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sharedPostCaption: { marginTop: SPACING.xs, fontSize: 13, color: COLORS.textSecondary },
  contactModalCard: { position: 'absolute', left: 16, right: 16, top: '30%', zIndex: 20, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 12 },
  contactModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  contactModalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  contactModalBody: { marginTop: SPACING.sm },
  contactModalLabel: { color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  contactModalInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.divider, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: 14 },
  contactModalButton: { marginTop: SPACING.md, backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  contactPickerButton: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary },
  contactModalButtonText: { color: COLORS.textWhite, fontWeight: '700' },
  contactPickerButtonText: { color: COLORS.primary, fontWeight: '700' },
  phoneContactItem: { paddingVertical: SPACING.sm, borderBottomWidth: 1, borderColor: COLORS.divider },
  phoneContactName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  phoneContactNumber: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A1A',
    maxHeight: 120
  },
  fullScreenMediaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenMediaClose: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 24, right: 20, zIndex: 2, padding: 10, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(0,0,0,0.35)' },
  fullScreenMediaImage: { width: '100%', height: '100%' },
  fullScreenMediaVideo: { width: '100%', height: '100%' },
  messageMedia: { width: 200, height: 140, borderRadius: 18, marginBottom: SPACING.xs },
  messageVideo: { width: 200, height: 140, borderRadius: 18, marginBottom: SPACING.xs },
  mediaPreviewContainer: { marginHorizontal: SPACING.md, marginBottom: SPACING.xs, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.divider, overflow: 'hidden', position: 'relative', width: 120, height: 120 },
  mediaPreviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, backgroundColor: COLORS.primary },
  mediaPreviewLabel: { color: COLORS.textWhite, fontSize: 13, fontWeight: '700' },
  mediaPreviewClose: { padding: SPACING.xs },
  mediaPreviewCloseButton: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  mediaPreviewImage: { width: '100%', height: '100%' },
  mediaPreviewVideo: { width: '100%', height: '100%' },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.50)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  senderChangeDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 14,
    width: '92%',
    alignSelf: 'center',
  },
});

export default DirectMessageScreen;