import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, 
  Text, 
  Image,
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Modal,
  Platform, 
  ActivityIndicator,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  BackHandler,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import type * as ImageManipulatorType from 'expo-image-manipulator';
import type * as ContactsType from 'expo-contacts';
import {
  sendDirectMessage,
  getConversations,
  getDirectMessages,
  clearDirectMessages,
  markDirectMessagesRead,
  approveDirectMessageRequest,
  denyDirectMessageRequest,
  uploadChatMedia,
  uploadCompressedVideo,
  getUserProfile,
} from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../../src/services/firebase/chatService';
import { useAuthStore } from '../../src/store/authStore';
import { Conversation } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { socketService } from '../../src/services/socket';

const DM_MESSAGES_CACHE_KEY = 'dm_messages_cache';

// Cache functions
const getCachedMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const cached = await AsyncStorage.getItem(`${DM_MESSAGES_CACHE_KEY}_${conversationId}`);
    return cached ? JSON.parse(cached) : [];
  } catch { return []; }
};

const setCachedMessages = async (conversationId: string, messages: Message[]) => {
  try {
    await AsyncStorage.setItem(`${DM_MESSAGES_CACHE_KEY}_${conversationId}`, JSON.stringify(messages));
  } catch {}
};

let dmImageManipulator: typeof ImageManipulatorType | null = null;
const getDMImageManipulator = async () => {
  if (!dmImageManipulator) {
    dmImageManipulator = await import('expo-image-manipulator');
  }
  return dmImageManipulator;
};

let dmContacts: typeof ContactsType | null = null;
const getDMContacts = async () => {
  if (!dmContacts) {
    dmContacts = await import('expo-contacts');
  }
  return dmContacts;
};

const MessageStatus = ({ status, isOwn }: { status?: string; isOwn: boolean }) => {
  if (!isOwn) return null;

  const color = isOwn ? 'rgba(255,255,255,0.7)' : COLORS.textLight;

  if (status === 'read') {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="checkmark-done" size={14} color={color} />
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
  item: ChatMessage;
  index: number;
  userId?: string;
  renderMessageContent: (message: ChatMessage) => React.ReactNode;
  formatChatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  showDateSeparator: boolean;
};

const DMMessageItem = React.memo(({
  item,
  index,
  userId,
  renderMessageContent,
  formatChatDate,
  formatTime,
  showDateSeparator,
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
        <View
          style={[
            styles.messageBubble,
            isOwnMessage && styles.ownMessageBubble,
            isSharedPost && styles.sharedPostMessageBubble,
          ]}
        >
          {renderMessageContent(item)}
          {!isSharedPost && (
            <View style={styles.messageFooter}>
              <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
                {formatTime(item.created_at)}
              </Text>
              <MessageStatus status={(item as any).status} isOwn={isOwnMessage} />
            </View>
          )}
        </View>
      </View>
    </>
  );
}, (prevProps, nextProps) => {
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;
  return (
    prevItem.id === nextItem.id &&
    prevItem.sender_id === nextItem.sender_id &&
    prevItem.created_at === nextItem.created_at &&
    prevItem.content === nextItem.content &&
    prevItem.text === nextItem.text &&
    (prevItem as any).message_type === (nextItem as any).message_type &&
    prevItem.sender_name === nextItem.sender_name &&
    prevItem.sender_photo === nextItem.sender_photo &&
    (prevItem as any).status === (nextItem as any).status &&
    prevProps.userId === nextProps.userId &&
    prevProps.index === nextProps.index &&
    prevProps.showDateSeparator === nextProps.showDateSeparator &&
    prevProps.renderMessageContent === nextProps.renderMessageContent &&
    prevProps.formatChatDate === nextProps.formatChatDate &&
    prevProps.formatTime === nextProps.formatTime
  );
});

const DirectMessageScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUserPresence, setOtherUserPresence] = useState<{
    online_status?: boolean;
    last_seen_at?: string;
    last_active?: string;
    updated_at?: string;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
  const [viewHeight, setViewHeight] = useState(Dimensions.get('window').height);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactShareName, setContactShareName] = useState('');
  const [contactSharePhone, setContactSharePhone] = useState('');
  const [phoneContacts, setPhoneContacts] = useState<ContactsType.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sharingContact, setSharingContact] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState(false);
  const attachmentAnim = useRef(new Animated.Value(0)).current;

  // Mark messages as read when opening chat
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || hasMarkedRead) return;
    
    try {
      await markDirectMessagesRead(conversationId);
      setHasMarkedRead(true);
      console.log('[Chat] Messages marked as read');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 502 || status === 503) {
        console.warn('[Chat] Backend unavailable, unable to mark messages as read:', status);
      } else {
        console.error('[Chat] Error marking messages as read:', error);
      }
    }
  }, [conversationId, hasMarkedRead]);

  const handleBackNavigation = useCallback(() => {
    try {
      router.replace('/messages?tab=Private%20Chat');
    } catch (e) {
      console.warn('[DM] Back navigation failed:', e);
    }
  }, [router]);

  const openChatOptions = () => setShowOptions(true);
  const closeChatOptions = () => setShowOptions(false);

  const executeClearChat = async () => {
    if (!conversationId) return;
    try {
      await clearDirectMessages(conversationId);
      setMessages([]);
      setConversation((prev) => (prev ? { ...prev, last_message: '' } : prev));
      closeChatOptions();
    } catch (error: any) {
      console.error('[Chat] Clear chat failed:', error);
      Alert.alert('Error', 'Unable to clear chat. Please try again.');
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
      'Confirm',
      'Are you sure you want to clear this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: executeClearChat },
      ],
      { cancelable: true }
    );
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
    const presence = getPresenceSource();
    if (!presence) return '';

    if (presence.online_status === true) {
      return 'Online';
    }

    const lastSeen = presence.last_seen_at || presence.last_active || presence.updated_at;
    const date = parseDateOrNull(lastSeen);
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Online';
    if (diffMinutes < 60) return `Last seen ${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last seen ${diffHours} hr ago`;

    return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  useEffect(() => {
    const loadOtherUserPresence = async () => {
      if (!conversation?.user?.id) return;
      try {
        const response = await getUserProfile(conversation.user.id);
        const profile = response?.data || {};
        setOtherUserPresence({
          online_status: profile.online_status,
          last_seen_at: profile.last_seen_at || profile.last_active || profile.updated_at,
          last_active: profile.last_active,
          updated_at: profile.updated_at,
        });
      } catch (error) {
        console.warn('[DM] Failed to load other user profile for presence', error);
      }
    };

    loadOtherUserPresence();
  }, [conversation?.user?.id]);

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
    (requestStatus === 'rejected' && isRequester && cooldownActive);

  const inputLockReason = (() => {
    if (requestStatus === 'pending') {
      return isRequester
        ? 'Waiting for the other user to approve your message request.'
        : 'Approve or deny this message request to continue chat.';
    }
    if (requestStatus === 'rejected' && isRequester && cooldownActive && retryAfterDate) {
      return `Your request was denied. You can send a new request after ${retryAfterDate.toLocaleString()}.`;
    }
    return '';
  })();

  const handleApproveRequest = async () => {
    if (!conversationId) return;
    setRequestActionLoading(true);
    try {
      await approveDirectMessageRequest(conversationId);
      await fetchConversation();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve request');
    } finally {
      setRequestActionLoading(false);
    }
  };

  const handleDenyRequest = async () => {
    if (!conversationId) return;
    setRequestActionLoading(true);
    try {
      await denyDirectMessageRequest(conversationId);
      await fetchConversation();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to deny request');
    } finally {
      setRequestActionLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => {
      handleBackNavigation();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => {
      backHandlerSubscription.remove();
    };
  }, [handleBackNavigation]);

  // Handle viewport resize for iOS Safari keyboard
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // iOS Safari specific viewport handling
      const handleViewportResize = () => {
        if (window.visualViewport) {
          const newHeight = window.visualViewport.height;
          const offset = window.innerHeight - newHeight;
          setViewHeight(newHeight);
          setKeyboardOffset(offset > 50 ? offset : 0);
          // Scroll to bottom when keyboard opens
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }
      };

      const handleResize = () => {
        if (window.visualViewport) {
          setViewHeight(window.visualViewport.height);
        } else {
          setViewHeight(window.innerHeight);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      };

      // Initial setup
      handleResize();
      
      // Listen to visual viewport changes (iOS Safari)
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
        window.visualViewport.addEventListener('scroll', handleViewportResize);
      }
      window.addEventListener('resize', handleResize);

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
          window.visualViewport.removeEventListener('scroll', handleViewportResize);
        }
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // Native keyboard handling
      const showSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          setKeyboardOffset(e.endCoordinates.height);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      );
      const hideSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => setKeyboardOffset(0)
      );
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    try {
      const convResponse = await getConversations();
      const conversations = Array.isArray(convResponse?.data) ? convResponse.data : [];
      const conv = conversations.find((c: Conversation) => 
        c.conversation_id === conversationId || c.chat_id === conversationId
      );
      if (conv) setConversation(conv);
      else if (convResponse?.data == null) {
        console.warn('[Chat] Conversation list response was empty or invalid');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  }, [conversationId]);

  // Fetch messages via REST API
  const fetchMessagesViaAPI = useCallback(async (fromCache = true) => {
    // Show cached messages first for instant load (only once)
    if (fromCache && messages.length === 0) {
      const cached = await getCachedMessages(conversationId);
      if (cached.length > 0) {
        setMessages(cached);
        setLoading(false);
      }
    }
    
    try {
      const response = await getDirectMessages(conversationId!);
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
      }));
      
      // Check if messages actually changed before updating
      const existingIds = new Set(messages.map(m => m.id));
      const hasNewMessages = apiMessages.some(m => !existingIds.has(m.id));
      
      if (hasNewMessages || apiMessages.length !== messages.length) {
        // Update cache only when needed
        await setCachedMessages(conversationId, apiMessages);
        setMessages(apiMessages);
      }
      
      setLoading(false);
      setIsRealtime(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error: any) {
      console.error('[Chat] Error fetching messages:', error);
      setLoading(false);
    }
  }, [conversationId, messages.length]);

  useEffect(() => {
    fetchConversation();
    fetchMessagesViaAPI();
    
    let pollingInterval: NodeJS.Timeout | null = null;
    const socketListenerId = `dm_${conversationId}_${Date.now()}`;

    if (Platform.OS === 'web') {
      setIsRealtime(false);
      pollingInterval = setInterval(() => {
        if (!uploadingMedia) {
          fetchMessagesViaAPI();
          fetchConversation();
        }
      }, 5000); // Reduced from 2000 to 5000ms
      setTimeout(() => markMessagesAsRead(), 1000);

      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }

    (async () => {
      try {
        await socketService.connect();
        socketService.joinRoom(conversationId!);
        setIsRealtime(true);

        socketService.onMessage(socketListenerId, async () => {
          await fetchMessagesViaAPI();
          await fetchConversation();
          markMessagesAsRead();
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });
      } catch (error) {
        console.error('[Chat] Socket real-time setup failed:', error);
        setIsRealtime(false);
      }
    })();

    pollingInterval = setInterval(() => {
      if (!uploadingMedia) {
        fetchMessagesViaAPI();
        fetchConversation();
      }
    }, 5000);

    // Mark messages as read after initial load
    setTimeout(() => markMessagesAsRead(), 1000);

    return () => {
      socketService.offMessage(socketListenerId);
      socketService.leaveRoom(conversationId!);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [conversationId, fetchConversation, fetchMessagesViaAPI, markMessagesAsRead, uploadingMedia]);

  const getPickerMediaTypes = (mediaType: 'image' | 'video') => {
    return [mediaType === 'image' ? 'images' : 'videos'] as any;
  };

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
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
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

    // Optimistic UI - add message immediately
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
        await sendDirectMessage(conversation.user.sl_id, mediaUrl, selected.mediaType);
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

    // Optimistic update - add message immediately before API call
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
    setMessages(prev => [...prev, optimisticMessage]);
    setSending(true);
    
    try {
      await sendDirectMessage(conversation.user.sl_id, messageText);
      // Update cache with new message
      const updatedMessages = [...messages, { ...optimisticMessage, status: 'sent' }];
      await setCachedMessages(conversationId, updatedMessages);
      // Refresh messages in background
      setTimeout(() => fetchMessagesViaAPI(false), 300);
    } catch (error: any) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText);
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
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
      const permission = await contactsModule.requestPermissionsAsync();
      if (permission.status !== 'granted') {
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
      const contactResult = await contactsModule.getContactsAsync({
        fields: [contactsModule.Fields.PhoneNumbers],
        pageSize: 2000,
        sort: contactsModule.SortTypes.FirstName,
      });

      const contactsWithNumbers = (contactResult.data || []).filter((contact: ContactsType.Contact) => contact.phoneNumbers?.length);
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
      await sendDirectMessage(conversation.user.sl_id, payload, 'contact');
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

  const handlePickMedia = async (mediaType: 'image' | 'video') => {
    closeAttachmentOptions();
    if (!conversation || !conversation.user?.sl_id || uploadingMedia || sending || isInputLocked) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: getPickerMediaTypes(mediaType),
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const isMediaUrl = (url: string, type: 'image' | 'video') => {
    const normalized = url.split('?')[0].toLowerCase();
    if (type === 'image') {
      return normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp');
    }
    return normalized.endsWith('.mp4') || normalized.endsWith('.mov') || normalized.endsWith('.webm') || normalized.endsWith('.mkv');
  };

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
      // Manual fallback parser just in case JSON is mangled
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
        // Absolute worst case fallback
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

  const renderMessageContent = useCallback((message: any) => {
    const rawContent = message.content ?? message.text ?? '';
    const sourceUrl = typeof rawContent === 'string' ? rawContent : '';
    const shared = parseSharedPostPayload(rawContent);
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

    if (message.message_type === 'image' && sourceUrl) {
      return (
        <TouchableOpacity onPress={() => setFullScreenMedia({ uri: sourceUrl, type: 'image' })} activeOpacity={0.85}>
          <Image source={{ uri: sourceUrl }} style={styles.messageMedia} resizeMode="cover" />
        </TouchableOpacity>
      );
    }
    if (message.message_type === 'video' && sourceUrl) {
      return (
        <Video
          source={{ uri: sourceUrl }}
          style={styles.messageVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
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
          {shared.mediaUrl ? (
            <Image source={{ uri: shared.mediaUrl }} style={styles.sharedPostImage} resizeMode="cover" />
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
        <Video
          source={{ uri: sourceUrl }}
          style={styles.messageVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
        />
      );
    }
    const fallbackText = typeof message.text === 'string'
      ? message.text
      : typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content || {});

    return <Text style={[styles.messageText, message.sender_id === user?.id && styles.ownMessageText]}>{fallbackText}</Text>;
  }, [router]);

  const isSameDay = (dateA: Date, dateB: Date) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const formatChatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    });
  }, []);

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const showDateSeparator = index === 0 || !isSameDay(new Date(item.created_at), new Date(messages[index - 1]?.created_at || ''));
    return (
      <DMMessageItem
        item={item}
        index={index}
        userId={user?.id}
        renderMessageContent={renderMessageContent}
        formatChatDate={formatChatDate}
        formatTime={formatTime}
        showDateSeparator={showDateSeparator}
      />
    );
  }, [user?.id, renderMessageContent, formatChatDate, formatTime, messages]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Connecting to chat...</Text>
      </View>
    );
  }

  const bottomPadding = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8);

  // Calculate container style based on platform
  const containerStyle = Platform.OS === 'web' 
    ? [styles.container, { height: viewHeight, maxHeight: viewHeight }]
    : styles.container;

  const renderContent = () => (
    <View style={styles.chatScreen}>
      <View style={styles.chatBackground}>
        <View style={[styles.chatPatternCircle, { top: 40, left: 16, opacity: 0.08 }]} />
        <View style={[styles.chatPatternCircle, { top: 220, right: 12, opacity: 0.06 }]} />
        <View style={[styles.chatPatternCircle, { top: 420, left: 100, opacity: 0.05 }]} />
        <View style={[styles.chatPatternDot, { top: 72, left: 24, opacity: 0.16 }]} />
        <View style={[styles.chatPatternDot, { top: 140, right: 20, opacity: 0.12 }]} />
        <View style={[styles.chatPatternDot, { top: 280, left: 130, opacity: 0.1 }]} />
        <View style={[styles.chatPatternDot, { top: 380, right: 100, opacity: 0.11 }]} />
        <View style={[styles.chatPatternStripe, { top: 120, left: 40, transform: [{ rotate: '16deg' }] }]} />
        <View style={[styles.chatPatternStripe, { top: 280, right: 32, transform: [{ rotate: '-14deg' }] }]} />
        <View style={[styles.chatPatternLine, { top: 190, left: 20, width: 180, opacity: 0.08, transform: [{ rotate: '8deg' }] }]} />
        <View style={[styles.chatPatternLine, { top: 330, right: 20, width: 140, opacity: 0.06, transform: [{ rotate: '-8deg' }] }]} />
      </View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        {conversation && (
          <>
            <TouchableOpacity
              onPress={() => {
                if (conversation.user?.id) {
                  router.push(`/profile/${conversation.user.id}`);
                }
              }}
            >
              <Avatar name={conversation.user.name} photo={conversation.user.photo} size={40} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{conversation.user.name}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.headerSubtitle}>{conversation.user.sl_id}</Text>
                {!!getPresenceLabel() && (
                  <Text style={styles.statusInfoText}>{getPresenceLabel()}</Text>
                )}
                {isRealtime && (
                  <View style={styles.realtimeBadge}>
                    <View style={styles.realtimeDot} />
                    <Text style={styles.realtimeText}>Live</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
        <TouchableOpacity style={styles.moreButton} onPress={openChatOptions}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={closeChatOptions}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeChatOptions}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalItem} onPress={handleClearChat}>
              <Text style={[styles.modalItemText, styles.modalItemDestructive]}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={closeChatOptions}>
              <Text style={styles.modalItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!fullScreenMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenMedia(null)}
      >
        <View style={styles.fullScreenMediaOverlay}>
          <TouchableOpacity style={styles.fullScreenMediaClose} onPress={() => setFullScreenMedia(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {fullScreenMedia?.type === 'image' && (
            <Image source={{ uri: fullScreenMedia.uri }} style={styles.fullScreenMediaImage} resizeMode="contain" />
          )}
          {fullScreenMedia?.type === 'video' && (
            <Video
              source={{ uri: fullScreenMedia.uri }}
              style={styles.fullScreenMediaVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
          )}
        </View>
      </Modal>

      {requestStatus !== 'approved' && (
        <View style={styles.requestCard}>
          <Text style={styles.requestTitle}>Message Request</Text>
          <Text style={styles.requestText}>{inputLockReason || 'This chat requires request approval.'}</Text>
          {canSendAfterCooldown && (
            <Text style={styles.requestHint}>You can now send one new message request.</Text>
          )}
          {needsRecipientDecision && (
            <View style={styles.requestActionRow}>
              <TouchableOpacity
                style={[styles.requestButton, styles.requestDenyButton]}
                onPress={handleDenyRequest}
                disabled={requestActionLoading}
              >
                <Text style={[styles.requestButtonText, styles.requestDenyButtonText]}>
                  {requestActionLoading ? 'Please wait...' : 'Deny'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestButton, styles.requestApproveButton]}
                onPress={handleApproveRequest}
                disabled={requestActionLoading}
              >
                <Text style={styles.requestButtonText}>
                  {requestActionLoading ? 'Please wait...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Messages - takes remaining space */}
      <View style={styles.messagesWrapper}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messagesList, { paddingBottom: bottomPadding + 90 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Start your conversation</Text>
            </View>
          }
        />
      </View>

      {/* Input - anchored at bottom */}
      {selectedMedia && (
        <View style={styles.mediaPreviewContainer}>
          <View style={styles.mediaPreviewHeader}>
            <Text style={styles.mediaPreviewLabel}>
              {selectedMedia.mediaType === 'image' ? 'Image ready to send' : 'Video ready to send'}
            </Text>
            <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.mediaPreviewClose}>
              <Ionicons name="close" size={18} color={COLORS.textWhite} />
            </TouchableOpacity>
          </View>
          {selectedMedia.mediaType === 'image' ? (
            <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreviewImage} resizeMode="cover" />
          ) : (
            <Video
              source={{ uri: selectedMedia.uri }}
              style={styles.mediaPreviewVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
          )}
        </View>
      )}
      <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
        <View style={styles.attachmentButtons}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={toggleAttachmentOptions}
            disabled={uploadingMedia || sending || isInputLocked}
          >
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {showAttachmentOptions && (
          <Animated.View
            style={[
              styles.attachmentOverlay,
              {
                opacity: attachmentAnim,
                transform: [
                  {
                    scale: attachmentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handlePickMedia('image')}
              disabled={uploadingMedia || sending || isInputLocked}
            >
              <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              <Text style={styles.attachmentOptionText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handlePickMedia('video')}
              disabled={uploadingMedia || sending || isInputLocked}
            >
              <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
              <Text style={styles.attachmentOptionText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={handleOpenContactShare}
              disabled={uploadingMedia || sending || isInputLocked}
            >
              <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
              <Text style={styles.attachmentOptionText}>Contact</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <Modal
          visible={showContactModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowContactModal(false)}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowContactModal(false)} />
          <View style={styles.contactModalCard}>
            <View style={styles.contactModalHeader}>
              <Text style={styles.contactModalTitle}>Share Contact</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.contactModalBody}>
              <Text style={styles.contactModalLabel}>Name</Text>
              <TextInput
                style={styles.contactModalInput}
                value={contactShareName}
                onChangeText={setContactShareName}
                placeholder="Contact name"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.contactModalLabel}>Phone</Text>
              <TextInput
                style={styles.contactModalInput}
                value={contactSharePhone}
                onChangeText={setContactSharePhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TouchableOpacity
                style={[styles.contactModalButton, styles.contactPickerButton]}
                onPress={async () => {
                  const hasContacts = await loadPhoneContacts();
                  if (hasContacts) {
                    setShowContactPicker(true);
                  }
                }}
                disabled={loadingContacts}
              >
                {loadingContacts ? (
                  <ActivityIndicator size="small" color={COLORS.textPrimary} />
                ) : (
                  <Text style={styles.contactPickerButtonText}>Pick from phone contacts</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactModalButton, sharingContact ? styles.sendButtonDisabled : null]}
                onPress={handleSendContact}
                disabled={sharingContact}
              >
                {sharingContact ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <Text style={styles.contactModalButtonText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showContactPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowContactPicker(false)}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowContactPicker(false)} />
          <View style={[styles.contactModalCard, { maxHeight: '70%' }]}> 
            <View style={styles.contactModalHeader}>
              <Text style={styles.contactModalTitle}>Choose Contact</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {loadingContacts ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <FlatList
                data={phoneContacts}
                keyExtractor={(item, index) => String((item as any).id || item.name || item.phoneNumbers?.[0]?.id || index)}
                renderItem={({ item }) => {
                  const phone = item.phoneNumbers?.[0]?.number || 'No number';
                  const name = item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unknown';
                  return (
                    <TouchableOpacity style={styles.phoneContactItem} onPress={() => handleSelectPhoneContact(item)}>
                      <View>
                        <Text style={styles.phoneContactName}>{name}</Text>
                        <Text style={styles.phoneContactNumber}>{phone}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </Modal>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, isInputLocked && styles.inputDisabled]}
            placeholder={isInputLocked ? 'Messaging disabled' : 'Text message'}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            editable={!isInputLocked}
            placeholderTextColor="#999999"
            onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300)}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton, 
            (!newMessage.trim() && !selectedMedia) || sending || uploadingMedia || isInputLocked ? styles.sendButtonDisabled : null
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() && !selectedMedia || sending || uploadingMedia || isInputLocked}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // For web, use direct height-controlled container
  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        {renderContent()}
      </View>
    );
  }

  // For native, wrap the screen in SafeAreaView first and let KeyboardAvoidingView adjust content.
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 44}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatScreen: {
    flex: 1,
    backgroundColor: '#d8e7cf',
  },
  chatBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#d8e7cf',
    pointerEvents: 'none',
  },
  chatPatternDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  chatPatternCircle: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  chatPatternLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#ffffff',
  },
  chatPatternStripe: {
    position: 'absolute',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    opacity: 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexShrink: 0,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  moreButton: {
    padding: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#0088CC',
  },
  statusInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  modalItem: {
    paddingVertical: SPACING.sm,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalItemDestructive: {
    color: COLORS.error,
  },
  requestCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  requestText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  requestHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  requestActionRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  requestApproveButton: {
    backgroundColor: '#0088CC',
  },
  requestDenyButton: {
    backgroundColor: '#F5F5F5',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestDenyButtonText: {
    color: '#E53935',
  },
  messagesWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  messagesList: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  dateSeparatorContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  dateSeparator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: '#0088CC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 0,
    shadowColor: '#0088CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  sharedPostMessageBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
    marginLeft: 0,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 21,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  ownTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  statusContainer: {
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 4,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D8',
    flexShrink: 0,
  },
  attachmentButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: SPACING.xs,
  },
  attachmentOverlay: {
    position: 'absolute',
    bottom: 60,
    left: SPACING.sm,
    width: 160,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: SPACING.xs,
    zIndex: 20,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  attachmentOptionText: {
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4FAFF',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.xs,
  },
  contactCardContent: {
    marginLeft: SPACING.sm,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sharedPostContainer: {
    maxWidth: 340,
    width: '100%',
    minHeight: 220,
    flexShrink: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
  sharedPostUploader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  sharedPostUploaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sharedPostImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.background, // Fallback color if image loads slowly
  },
  sharedPostMeta: {
    padding: SPACING.sm,
  },
  sharedPostTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  sharedPostCaption: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  contactModalCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '30%',
    zIndex: 20,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactModalBody: {
    marginTop: SPACING.sm,
  },
  contactModalLabel: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  contactModalInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  contactModalButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  contactPickerButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  contactModalButtonText: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  contactPickerButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  phoneContactItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderColor: COLORS.divider,
  },
  phoneContactName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  phoneContactNumber: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 100,
  },
  fullScreenMediaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMediaClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 24,
    right: 20,
    zIndex: 2,
    padding: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fullScreenMediaImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenMediaVideo: {
    width: '100%',
    height: '100%',
  },
  messageMedia: {
    width: 200,
    height: 140,
    borderRadius: 18,
    marginBottom: SPACING.xs,
  },
  messageVideo: {
    width: 200,
    height: 140,
    borderRadius: 18,
    marginBottom: SPACING.xs,
  },
  mediaPreviewContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  mediaPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
  },
  mediaPreviewLabel: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  mediaPreviewClose: {
    padding: SPACING.xs,
  },
  mediaPreviewImage: {
    width: '100%',
    height: 120,
  },
  mediaPreviewVideo: {
    width: '100%',
    height: 120,
  },
  inputDisabled: {
    opacity: 0.65,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0088CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
  },
});
export default DirectMessageScreen;
