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
  KeyboardAvoidingView,
  Dimensions,
  BackHandler,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  muteConversation,
  unmuteConversation,
} from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../../src/services/firebase/chatService';
import { useAuthStore } from '../../src/store/authStore';
import { Conversation } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { socketService } from '../../src/services/socket';
import { isConversationMuted, muteConversationLocal, unmuteConversationLocal } from '../../src/services/mutedChats';

const DM_MESSAGES_CACHE_KEY = 'dm_messages_cache';

type Message = Omit<ChatMessage, 'content' | 'text' | 'timestamp'> & {
  content?: string;
  text?: string;
  timestamp?: string;
  message_type?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | string;
};

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

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

const ChatVideo = ({ uri, style, useNativeControls = false, resizeMode = 'contain', isLooping = false }: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<any>(null);
  const playerSource = (Platform.OS === 'web' || !isPlaying) ? null : uri;
  const player = useSafeVideoPlayer(playerSource, (p) => {
    p.loop = isLooping;
  });
  const videoStyle = StyleSheet.flatten(style) as any || {};

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    if (player && isPlaying) {
      player.play();
    }
  }, [player, isPlaying]);

  // Clean up player on unmount to prevent audio leaks
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        if (videoRef.current) {
          try {
            videoRef.current.pause();
          } catch (e) {}
        }
      } else if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

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

  if (isPlaying && ExpoVideoModule?.VideoView && player) {
    return (
      <ExpoVideoModule.VideoView
        player={player}
        style={style}
        contentFit={resizeMode}
        allowsPictureInPicture={false}
        nativeControls={true}
        playsInline
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
  item: Message;
  index: number;
  userId?: string;
  renderMessageContent: (message: Message) => React.ReactNode;
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
        <View style={{ flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start', flexShrink: 1 }}>
          <View
            style={[
              styles.messageBubble,
              isOwnMessage && styles.ownMessageBubble,
              isSharedPost && styles.sharedPostMessageBubble,
            ]}
          >
            {renderMessageContent(item)}
          </View>
          {!isSharedPost && (
            <View style={[styles.messageFooter, isOwnMessage && styles.ownMessageFooter]}>
              <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
});

const DirectMessageScreen = () => {
  const { conversationId, userId, userName, userSL } = useLocalSearchParams<{
    conversationId: string;
    userId?: string;
    userName?: string;
    userSL?: string;
  }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
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
  const [showOptions, setShowOptions] = useState(false);
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
  const attachmentAnim = useRef(new Animated.Value(0)).current;

  // Get picker media types function
  const getPickerMediaTypes = (mediaType: 'image' | 'video') => {
    return mediaType === 'image' 
      ? ImagePicker.MediaTypeOptions.Images 
      : ImagePicker.MediaTypeOptions.Videos;
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || hasMarkedRead) return;
    
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
  }, [conversationId, hasMarkedRead]);

  const handleBackNavigation = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/messages?tab=Private%20Chat');
      }
    } catch (e) {
      console.warn('[DM] Back navigation failed:', e);
      router.replace('/messages?tab=Private%20Chat');
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

  const handleToggleMute = async () => {
    if (!conversationId) return;
    setMuteLoading(true);
    try {
      if (isMuted) {
        await unmuteConversation(conversationId).catch(() => {});
        await unmuteConversationLocal(conversationId);
      } else {
        await muteConversation(conversationId).catch(() => {});
        await muteConversationLocal(conversationId);
      }
      setIsMuted(!isMuted);
    } catch {}
    setMuteLoading(false);
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
    if (src.online_status) return 'Online';
    const lastActive = src.last_seen_at || src.last_active || src.updated_at;
    if (lastActive) {
      try {
        const date = new Date(lastActive);
        if (Number.isNaN(date.getTime())) return '';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    try {
      const convResponse = await getConversations();
      const conversations = Array.isArray(convResponse?.data) ? convResponse.data : [];
      const conv = conversations.find((c: Conversation) => 
        c.conversation_id === conversationId || c.chat_id === conversationId
      );
      if (conv) {
        setConversation(conv);
      } else if (conversationId === 'new') {
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
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  }, [conversationId, userId, userName, userSL]);

  // Fetch messages via REST API
  const fetchMessagesViaAPI = useCallback(async (fromCache = true) => {
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
            const mapped = localMessages.reverse().map((msg: any) => ({
              id: msg.id,
              sender_id: msg.senderId || '',
              sender_name: msg.senderName || 'Unknown',
              sender_photo: undefined,
              text: msg.content || '',
              content: msg.content || '',
              message_type: msg.messageType || 'text',
              status: 'sent',
              created_at: new Date(msg.createdAt).toISOString(),
              timestamp: new Date(msg.createdAt).toISOString(),
              is_verified: false,
            }));
            setMessages(mapped);
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
          setMessages(cached);
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
      
      const existingIds = new Set(messages.map(m => m.id));
      const hasNewMessages = apiMessages.some(m => !existingIds.has(m.id));
      
      if (hasNewMessages || apiMessages.length !== messages.length) {
        setMessages(prev => {
          const sending = prev.filter(m => m.status === 'sending');
          const apiIds = new Set(apiMessages.map(m => m.id));
          const stillSending = sending.filter(m => !apiIds.has(m.id));
          return [...apiMessages, ...stillSending];
        });
        setCachedMessages(conversationId, apiMessages);
      }
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('[Chat] Error fetching messages:', error);
      setLoading(false);
      return true;
    }
  }, [conversationId, messages.length]);

  useEffect(() => {
    fetchConversation();
    fetchMessagesViaAPI();

    // Trigger WatermelonDB sync in background immediately on screen mount
    if (Platform.OS !== 'web') {
      try {
        const { syncDatabase } = require('../../src/database/sync');
        syncDatabase().catch((err: any) => console.warn('[DM] Background sync failed on mount:', err));
      } catch (e) {
        console.warn('[DM] Failed to require syncDatabase:', e);
      }
    }
    
    let pollingInterval: NodeJS.Timeout | null = null;
    const socketListenerId = `dm_${conversationId}_${Date.now()}`;

    if (Platform.OS === 'web') {
      pollingInterval = setInterval(async () => {
        if (!uploadingMedia) {
          await fetchMessagesViaAPI();
          await fetchConversation();
        }
      }, 5000);
      setTimeout(() => markMessagesAsRead(), 1000);

      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }

    (async () => {
      try {
        await socketService.connect();
        socketService.joinRoom(conversationId!);
        socketService.onMessage(socketListenerId, async (message: any) => {
          if (message && (message.chat_id === conversationId || message.conversation_id === conversationId)) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === message.id);
              if (exists) return prev;
              
              const tempIndex = prev.findIndex(
                (m) => m.status === 'sending' && m.content === message.content && m.sender_id === message.sender_id
              );
              
              if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = { ...message, status: 'sent' };
                return updated;
              }
              
              return [...prev, message];
            });
            const cached = await getCachedMessages(conversationId);
            if (!cached.some((m) => m.id === message.id)) {
              await setCachedMessages(conversationId, [...cached, message]);
            }
            markMessagesAsRead();
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          } else {
            await fetchMessagesViaAPI();
            await fetchConversation();
          }
        });
      } catch (error) {
        console.error('[Chat] Socket real-time setup failed:', error);
      }
    })();

    pollingInterval = setInterval(async () => {
      if (!uploadingMedia) {
        await fetchMessagesViaAPI();
        await fetchConversation();
      }
    }, 5000);

    setTimeout(() => markMessagesAsRead(), 1000);

    return () => {
      socketService.offMessage(socketListenerId);
      socketService.leaveRoom(conversationId!);
      if (pollingInterval) clearInterval(pollingInterval);
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
    
    try {
      const response = await sendDirectMessage(conversation.user.sl_id, messageText);
      const serverMsg = response?.data?.message || response?.data;
      const realId = serverMsg?.id || response?.data?.id || tempId;
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, id: realId, status: 'sent' } : m
      ));
      const cached = await getCachedMessages(conversationId);
      await setCachedMessages(conversationId, [...cached, { ...optimisticMessage, id: realId, status: 'sent' }]);
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

  const handleOpenCamera = async () => {
    closeAttachmentOptions();
    if (!conversation || !conversation.user?.sl_id || uploadingMedia || sending || isInputLocked) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

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

  const renderMessageContent = useCallback((message: any) => {
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

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
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

  const bottomPadding = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8);

  const renderContent = () => (
    <View style={styles.chatScreen}>
      <View style={styles.chatBackground} pointerEvents="none">
        <LinearGradient
          colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
          locations={[0, 0.09, 0.25]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 0) }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
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
                    <Text style={styles.realtimeText}>Live</Text>
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
        <TouchableOpacity style={styles.moreButton} onPress={openChatOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <Modal visible={showOptions} transparent animationType="fade" onRequestClose={closeChatOptions}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeChatOptions}>
            <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
              <TouchableOpacity style={styles.modalItem} onPress={handleToggleMute} disabled={muteLoading}>
                <Ionicons name={isMuted ? 'notifications-off' : 'notifications'} size={20} color="#333" style={{ marginRight: 10 }} />
                <Text style={styles.modalItemText}>{muteLoading ? 'Please wait...' : isMuted ? 'Unmute Chat' : 'Mute Chat'}</Text>
              </TouchableOpacity>
              <View style={styles.modalDivider} />
              <TouchableOpacity style={styles.modalItem} onPress={handleClearChat}>
                <Text style={[styles.modalItemText, styles.modalItemDestructive]}>Clear Chat</Text>
              </TouchableOpacity>
              <View style={styles.modalDivider} />
              <TouchableOpacity style={styles.modalItem} onPress={closeChatOptions}>
                <Text style={styles.modalItemText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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

        {requestStatus !== 'approved' && (
          <View style={styles.requestCard}>
            <Text style={styles.requestTitle}>Message Request</Text>
            <Text style={styles.requestText}>{inputLockReason || 'This chat requires request approval.'}</Text>
            {canSendAfterCooldown && <Text style={styles.requestHint}>You can now send one new message request.</Text>}
            {needsRecipientDecision && (
              <View style={styles.requestActionRow}>
                <TouchableOpacity style={[styles.requestButton, styles.requestDenyButton]} onPress={handleDenyRequest} disabled={requestActionLoading}>
                  <Text style={[styles.requestButtonText, styles.requestDenyButtonText]}>{requestActionLoading ? 'Please wait...' : 'Deny'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.requestButton, styles.requestApproveButton]} onPress={handleApproveRequest} disabled={requestActionLoading}>
                  <Text style={styles.requestButtonText}>{requestActionLoading ? 'Please wait...' : 'Approve'}</Text>
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
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.messagesList, { paddingBottom: bottomPadding + 8 }]}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>Start your conversation</Text>
                </View>
              }
            />
          )}
        </View>
        
        <View style={[styles.inputWrapperContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {selectedMedia && (
            <View style={styles.mediaPreviewContainer}>
              <View style={styles.mediaPreviewHeader}>
                <Text style={styles.mediaPreviewLabel}>{selectedMedia.mediaType === 'image' ? 'Image ready' : 'Video ready'}</Text>
                <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.mediaPreviewClose}>
                  <Ionicons name="close" size={18} color={COLORS.textWhite} />
                </TouchableOpacity>
              </View>
              {selectedMedia.mediaType === 'image' ? (
                <Image source={{ uri: getSafeUri(selectedMedia.uri) || '' }} style={styles.mediaPreviewImage} resizeMode="cover" />
              ) : (
                <ChatVideo uri={selectedMedia.uri} style={styles.mediaPreviewVideo} useNativeControls resizeMode="contain" isLooping={false} />
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputFieldContainer}>
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Message..."
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
              <TouchableOpacity onPress={() => handlePickMedia('image')} disabled={uploadingMedia || sending || isInputLocked} style={styles.inlineIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="image-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() && !selectedMedia) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !selectedMedia) || sending || uploadingMedia || isInputLocked}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="send-outline" size={22} color="#000" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
          
          {showAttachmentOptions && (
            <Animated.View style={[styles.attachmentOverlay, { opacity: attachmentAnim, transform: [{ scale: attachmentAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <TouchableOpacity style={styles.attachmentOption} onPress={() => handlePickMedia('image')} disabled={uploadingMedia || sending || isInputLocked}>
                <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentOptionText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentOption} onPress={() => handlePickMedia('video')} disabled={uploadingMedia || sending || isInputLocked}>
                <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentOptionText}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentOption} onPress={handleOpenContactShare} disabled={uploadingMedia || sending || isInputLocked}>
                <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentOptionText}>Contact</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        
        <Modal visible={showContactModal} transparent animationType="fade" onRequestClose={() => setShowContactModal(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowContactModal(false)} />
          <View style={styles.contactModalCard}>
            <View style={styles.contactModalHeader}>
              <Text style={styles.contactModalTitle}>Share Contact</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}><Ionicons name="close" size={22} color={COLORS.text} /></TouchableOpacity>
            </View>
            <View style={styles.contactModalBody}>
              <Text style={styles.contactModalLabel}>Name</Text>
              <TextInput style={styles.contactModalInput} value={contactShareName} onChangeText={setContactShareName} placeholder="Contact name" placeholderTextColor={COLORS.textSecondary} />
              <Text style={styles.contactModalLabel}>Phone</Text>
              <TextInput style={styles.contactModalInput} value={contactSharePhone} onChangeText={setContactSharePhone} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={COLORS.textSecondary} />
              <TouchableOpacity style={[styles.contactModalButton, styles.contactPickerButton]} onPress={async () => { const hasContacts = await loadPhoneContacts(); if (hasContacts) setShowContactPicker(true); }} disabled={loadingContacts}>
                {loadingContacts ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Text style={styles.contactPickerButtonText}>Pick from phone contacts</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactModalButton, sharingContact ? styles.sendButtonDisabled : null]} onPress={handleSendContact} disabled={sharingContact}>
                {sharingContact ? <ActivityIndicator size="small" color={COLORS.textWhite} /> : <Text style={styles.contactModalButtonText}>Share</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        <Modal visible={showContactPicker} transparent animationType="fade" onRequestClose={() => setShowContactPicker(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowContactPicker(false)} />
          <View style={[styles.contactModalCard, { maxHeight: '70%' }]}> 
            <View style={styles.contactModalHeader}>
              <Text style={styles.contactModalTitle}>Choose Contact</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}><Ionicons name="close" size={22} color={COLORS.text} /></TouchableOpacity>
            </View>
            {loadingContacts ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
              <FlatList data={phoneContacts} keyExtractor={(item, index) => String((item as any).id || item.name || item.phoneNumbers?.[0]?.id || index)} renderItem={({ item }) => {
                const phone = item.phoneNumbers?.[0]?.number || 'No number';
                const name = item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unknown';
                return <TouchableOpacity style={styles.phoneContactItem} onPress={() => handleSelectPhoneContact(item)}><View><Text style={styles.phoneContactName}>{name}</Text><Text style={styles.phoneContactNumber}>{phone}</Text></View></TouchableOpacity>;
              }} />
            )}
          </View>
        </Modal>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return <View style={[styles.container, { height: viewHeight }]}>{renderContent()}</View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}>
        {renderContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chatScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  chatBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F2ECE8', pointerEvents: 'none' },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, paddingTop: Platform.OS === 'android' ? 12 : undefined, paddingHorizontal: 16, backgroundColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderBottomWidth: 0, zIndex: 10, flexShrink: 0 },
  backButton: { marginRight: SPACING.md, padding: 4 },
  moreButton: { padding: 6, borderRadius: BORDER_RADIUS.full, marginLeft: 8 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerTextInfo: { marginLeft: 12, flex: 1 },
  avatarWrapper: { position: 'relative' },
  headerTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_600SemiBold', color: COLORS.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  realtimeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginRight: 6 },
  realtimeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B00', marginRight: 4 },
  realtimeText: { fontSize: 11, fontWeight: '700', color: '#FF6B00' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalContent: { backgroundColor: COLORS.surface, padding: SPACING.md, borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg, borderTopWidth: 1, borderTopColor: COLORS.divider },
  modalItem: { paddingVertical: SPACING.sm },
  modalItemText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  modalItemDestructive: { color: COLORS.error },
  modalDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.xs },
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
  messageBubble: { maxWidth: '85%', backgroundColor: '#EFE1D8', borderRadius: 22, borderBottomLeftRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginLeft: 8, borderWidth: 0 },
  ownMessageBubble: { backgroundColor: '#EFE1D8', borderRadius: 22, borderBottomRightRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginRight: 8, marginLeft: 0 },
  sharedPostMessageBubble: { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0, borderRadius: 0, shadowOpacity: 0, elevation: 0, borderWidth: 0, marginLeft: 0, width: '100%', maxWidth: 340, alignSelf: 'flex-start' },
  messageText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#000000', lineHeight: 21 },
  ownMessageText: { color: '#000000' },
  timeText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8E8E8E' },
  ownTimeText: { color: '#8E8E8E' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 4, marginLeft: 8 },
  ownMessageFooter: { justifyContent: 'flex-end', marginRight: 8, marginLeft: 0 },
  statusContainer: { marginLeft: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xl * 4 },
  emptyText: { marginTop: SPACING.md, fontSize: 16, fontWeight: '500', color: COLORS.textSecondary },
  inputWrapperContainer: { backgroundColor: '#E4E4E4', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, borderTopWidth: 0, zIndex: 20, elevation: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 8 },
  inputFieldContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'transparent', borderRadius: 24, borderWidth: 1, borderColor: '#737373', paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 8 : 4 },
  inlineIcon: { padding: 4, marginLeft: 4 },
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
  input: { flex: 1, backgroundColor: 'transparent', borderRadius: 0, paddingHorizontal: 0, paddingVertical: 10, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1A1A1A', maxHeight: 120, minHeight: 40 },
  fullScreenMediaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenMediaClose: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 24, right: 20, zIndex: 2, padding: 10, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(0,0,0,0.35)' },
  fullScreenMediaImage: { width: '100%', height: '100%' },
  fullScreenMediaVideo: { width: '100%', height: '100%' },
  messageMedia: { width: 200, height: 140, borderRadius: 18, marginBottom: SPACING.xs },
  messageVideo: { width: 200, height: 140, borderRadius: 18, marginBottom: SPACING.xs },
  mediaPreviewContainer: { marginHorizontal: SPACING.md, marginBottom: SPACING.xs, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.divider, overflow: 'hidden' },
  mediaPreviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, backgroundColor: COLORS.primary },
  mediaPreviewLabel: { color: COLORS.textWhite, fontSize: 13, fontWeight: '700' },
  mediaPreviewClose: { padding: SPACING.xs },
  mediaPreviewImage: { width: '100%', height: 120 },
  mediaPreviewVideo: { width: '100%', height: 120 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3C3C3C', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0, elevation: 0 },
});

export default DirectMessageScreen;