import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
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
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  sendDirectMessage,
  getConversations,
  getDirectMessages,
  clearDirectMessages,
  markDirectMessagesRead,
  approveDirectMessageRequest,
  denyDirectMessageRequest,
} from '../../src/services/api';
import { ChatMessage } from '../../src/services/firebase/chatService';
import { useAuthStore } from '../../src/store/authStore';
import { Conversation } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { socketService } from '../../src/services/socket';

export default function DirectMessageScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const [viewHeight, setViewHeight] = useState(Dimensions.get('window').height);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState(false);

  // Mark messages as read when opening chat
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || hasMarkedRead) return;
    
    try {
      await markDirectMessagesRead(conversationId);
      setHasMarkedRead(true);
      console.log('[Chat] Messages marked as read');
    } catch (error) {
      console.error('[Chat] Error marking messages as read:', error);
    }
  }, [conversationId, hasMarkedRead]);

  const handleBackNavigation = useCallback(() => {
    try {
      router.replace('/messages');
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

    BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
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
      const conv = convResponse.data.find((c: Conversation) => 
        c.conversation_id === conversationId || c.chat_id === conversationId
      );
      if (conv) setConversation(conv);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  }, [conversationId]);

  // Fetch messages via REST API
  const fetchMessagesViaAPI = useCallback(async () => {
    try {
      const response = await getDirectMessages(conversationId!);
      const apiMessages = response.data.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id || '',
        sender_name: msg.sender_name || 'Unknown',
        sender_photo: msg.sender_photo,
        text: msg.text || msg.content || '',
        content: msg.content || msg.text || '',
        status: msg.status,
        created_at: msg.created_at || msg.timestamp || '',
        timestamp: msg.timestamp || msg.created_at || '',
      }));
      setMessages(apiMessages);
      setLoading(false);
      setIsRealtime(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error) {
      console.error('[Chat] Error fetching messages:', error);
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
    fetchMessagesViaAPI();
    
    let pollingInterval: NodeJS.Timeout | null = null;
    const socketListenerId = `dm_${conversationId}_${Date.now()}`;

    if (Platform.OS === 'web') {
      setIsRealtime(false);
      pollingInterval = setInterval(() => {
        fetchMessagesViaAPI();
        fetchConversation();
      }, 2000);
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
      fetchMessagesViaAPI();
      fetchConversation();
    }, 5000);

    // Mark messages as read after initial load
    setTimeout(() => markMessagesAsRead(), 1000);

    return () => {
      socketService.offMessage(socketListenerId);
      socketService.leaveRoom(conversationId!);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [conversationId, fetchConversation, fetchMessagesViaAPI, markMessagesAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation) return;
    if (isInputLocked) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    try {
      await sendDirectMessage(conversation.user.sl_id, messageText);
      setTimeout(() => fetchMessagesViaAPI(), 300);
    } catch (error: any) {
      setNewMessage(messageText);
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Message status indicator component
  const MessageStatus = ({ status, isOwn }: { status?: string; isOwn: boolean }) => {
    if (!isOwn) return null;
    
    const color = isOwn ? 'rgba(255,255,255,0.7)' : COLORS.textLight;
    
    if (status === 'read') {
      // Double tick (read)
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={14} color={color} />
        </View>
      );
    }
    
    // Single tick (delivered)
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="checkmark" size={14} color={color} />
      </View>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.sender_id === user?.id;
    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <Avatar name={item.sender_name} photo={item.sender_photo} size={36} />
        )}
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.text || item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
              {formatTime(item.created_at)}
            </Text>
            <MessageStatus status={(item as any).status} isOwn={isOwnMessage} />
          </View>
        </View>
      </View>
    );
  };

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
    <>
      {/* Safe area top */}
      <View style={{ height: insets.top, backgroundColor: COLORS.surface }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        {conversation && (
          <>
            <Avatar name={conversation.user.name} photo={conversation.user.photo} size={40} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{conversation.user.name}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.headerSubtitle}>{conversation.user.sl_id}</Text>
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
          contentContainerStyle={styles.messagesList}
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
      <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
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
            (!newMessage.trim() || sending || isInputLocked) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending || isInputLocked}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // For web, use direct height-controlled container
  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        {renderContent()}
      </View>
    );
  }

  // For native, use KeyboardAvoidingView
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {renderContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    display: 'flex',
    flexDirection: 'column',
    ...(Platform.OS === 'web' ? {
      position: 'absolute' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    } : {}),
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D8',
    flexShrink: 0,
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
    paddingVertical: 6,
    fontSize: 16,
    color: '#1A1A1A',
    maxHeight: 100,
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
