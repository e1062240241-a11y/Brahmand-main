import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommunityMessages, sendCommunityMessage, getCircleMessages, sendCircleMessage, getVerificationStatus, getCircle, updateCircle, leaveCircle, removeCircleMember, getAllUsers, inviteToCircle, transferCircleAdmin } from '../../../src/services/api';
import { socketService } from '../../../src/services/socket';
import { useAuthStore } from '../../../src/store/authStore';
import { Message } from '../../../src/types';
import { Avatar } from '../../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';

export default function ChatScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  
  // Parse query params
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const subgroup = params.get('subgroup') || '';
  const name = decodeURIComponent(params.get('name') || '');

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [circleInfo, setCircleInfo] = useState<any>(null);
  const [showCircleOptions, setShowCircleOptions] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [promotingMemberId, setPromotingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [editedGroupDescription, setEditedGroupDescription] = useState('');
  const [savingGroupInfo, setSavingGroupInfo] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [clearedAtMs, setClearedAtMs] = useState<number>(0);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [updatingGroupPhoto, setUpdatingGroupPhoto] = useState(false);

  const clearChatStorageKey = type === 'circle' && id ? `circle_chat_cleared_at_${id}` : '';
  const circleAdminIds: string[] = Array.isArray(circleInfo?.admin_ids) && circleInfo?.admin_ids.length
    ? circleInfo.admin_ids
    : (circleInfo?.admin_id ? [circleInfo.admin_id] : []);
  const circleMembersLabel = circleInfo?.members?.map((member: any) => member?.name).filter(Boolean).join(', ');
  const isCircleAdmin = !!user?.id && circleAdminIds.includes(user.id);

  const applyClientClearFilter = useCallback((incoming: Message[]) => {
    if (type !== 'circle' || !clearedAtMs) return incoming;
    return incoming.filter((message) => {
      const ts = new Date(message.created_at).getTime();
      return Number.isFinite(ts) && ts > clearedAtMs;
    });
  }, [type, clearedAtMs]);

  const addRealtimeMessage = useCallback((message: any) => {
    if (!message) return;
    if (type === 'circle' && message.circle_id !== id) return;
    if (type === 'community' && (message.community_id !== id || message.subgroup_type !== subgroup)) return;

    const normalized: Message = {
      id: message.id || message._id || String(message._id ?? Date.now()),
      sender_id: message.sender_id || '',
      sender_name: message.sender_name || message.sender || 'Unknown',
      sender_photo: message.sender_photo,
      text: message.text || message.content || '',
      content: message.content || message.text || '',
      created_at: message.created_at || message.timestamp || new Date().toISOString(),
      message_type: message.message_type || 'text',
      ...message,
    } as Message;

    if (type === 'circle' && clearedAtMs) {
      const ts = new Date(normalized.created_at).getTime();
      if (!Number.isFinite(ts) || ts <= clearedAtMs) return;
    }

    setMessages((prev) => {
      const normalizedTs = new Date(normalized.created_at).getTime();
      const exists = prev.some((m) => {
        if (m.id && normalized.id && m.id === normalized.id) return true;
        if (m.id === String(message._id)) return true;

        const mTs = new Date(m.created_at).getTime();
        const sameSender = m.sender_id === normalized.sender_id;
        const sameContent = m.content === normalized.content;
        const closeTime = Number.isFinite(normalizedTs) && Number.isFinite(mTs) && Math.abs(mTs - normalizedTs) < 5000;
        return sameSender && sameContent && closeTime;
      });

      if (exists) return prev;
      return [...prev, normalized];
    });
  }, [type, id, subgroup, clearedAtMs]);

  const fetchMessages = useCallback(async () => {
    try {
      let response;
      if (type === 'community') {
        response = await getCommunityMessages(id!, subgroup);
        // All users can post in community chats - no KYC required
        setIsVerified(true);
      } else {
        response = await getCircleMessages(id!);
        setIsVerified(true); // Circles don't require verification
      }
      setMessages(applyClientClearFilter(response.data || []));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [type, id, subgroup, applyClientClearFilter]);

  const fetchCircleInfo = useCallback(async () => {
    if (type !== 'circle' || !id) return;
    try {
      const response = await getCircle(id);
      const details = response.data;
      setCircleInfo(details);
      setEditedGroupName(details?.name || '');
      setEditedGroupDescription(details?.description || '');
    } catch (error) {
      console.error('Error fetching circle info:', error);
    }
  }, [type, id]);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
    let listenerId = `chat_${id}_${subgroup}_${Date.now()}`;
    const room = type === 'community' ? `community_${id}_${subgroup}` : `circle_${id}`;

    const loadClearedAtAndData = async () => {
      if (type === 'circle' && clearChatStorageKey) {
        const stored = await AsyncStorage.getItem(clearChatStorageKey);
        setClearedAtMs(stored ? Number(stored) || 0 : 0);
      }
      await fetchMessages();
      await fetchCircleInfo();
    };

    const setupSocket = async () => {
      try {
        await socketService.connect();
        socketService.joinRoom(room);
        socketService.onMessage(listenerId, (message) => addRealtimeMessage(message));
      } catch (error) {
        console.error('[Chat] Socket real-time setup failed, falling back to polling:', error);
        if (!pollingInterval) {
          pollingInterval = setInterval(() => {
            fetchMessages();
          }, 3000);
        }
      }
    };

    loadClearedAtAndData();
    setupSocket();

    if (Platform.OS === 'web') {
      // ensure periodic refresh on web where socket reliability may vary
      pollingInterval = setInterval(() => {
        fetchMessages();
      }, 3000);
    }

    return () => {
      socketService.leaveRoom(room);
      socketService.offMessage(listenerId);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [type, id, subgroup, fetchMessages, fetchCircleInfo, clearChatStorageKey, clearedAtMs, addRealtimeMessage]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    // Check verification for community posts
    if (type === 'community' && !isVerified) {
      router.push('/verification');
      return;
    }

    const messageText = newMessage.trim();
    const tempMessage: Message = {
      id: `local_${Date.now()}`,
      sender_id: user?.id || 'me',
      sender_name: user?.name || 'You',
      sender_photo: user?.photo,
      text: messageText,
      content: messageText,
      created_at: new Date().toISOString(),
      message_type: 'text',
    };

    // Optimistically show message instantly
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    setSending(true);
    try {
      let response;
      if (type === 'community') {
        response = await sendCommunityMessage(id!, subgroup, messageText);
      } else {
        response = await sendCircleMessage(id!, messageText);
      }

      // Server event should also arrive soon via socket; just fallback if not
      setTimeout(async () => {
        if (!tempMessage.id) return;
        // in case socket hasn't echoed yet, force-refresh the list
        await fetchMessages();
      }, 1200);
    } catch (error: any) {
      // rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClearChatClientSide = async () => {
    if (type !== 'circle' || !clearChatStorageKey) return;
    const nowMs = Date.now();
    await AsyncStorage.setItem(clearChatStorageKey, String(nowMs));
    setClearedAtMs(nowMs);
    setMessages([]);
    Alert.alert('Chat Cleared', 'This chat is cleared on this device only.');
  };

  const navigateToPrivateChatTab = useCallback(() => {
    router.replace('/(tabs)/messages?tab=Private%20Chat');
  }, [router]);

  const handleGoBack = () => {
    try {
      navigateToPrivateChatTab();
    } catch (err) {
      navigateToPrivateChatTab();
    }
  };

  const handleSaveGroupInfo = async () => {
    if (type !== 'circle' || !id) return;
    const trimmedName = editedGroupName.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Group name cannot be empty.');
      return;
    }

    setSavingGroupInfo(true);
    try {
      await updateCircle(id, {
        name: trimmedName,
        description: editedGroupDescription.trim(),
      });
      setEditingName(false);
      setEditingDescription(false);
      await fetchCircleInfo();
      Alert.alert('Saved', 'Group info updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update group info');
    } finally {
      setSavingGroupInfo(false);
    }
  };

  const fetchAvailableUsers = useCallback(async () => {
    if (type !== 'circle' || !id || !isCircleAdmin) return;
    setLoadingAvailableUsers(true);
    try {
      const response = await getAllUsers();
      const memberIds = new Set((circleInfo?.members || []).map((member: any) => member?.user_id));
      const users = (response.data || [])
        .filter((userItem: any) => userItem.id && userItem.id !== user?.id && !memberIds.has(userItem.id));
      setAvailableUsers(users);
    } catch (error: any) {
      console.error('[Chat] fetchAvailableUsers error', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoadingAvailableUsers(false);
    }
  }, [type, id, circleInfo, isCircleAdmin, user?.id]);

  const handleToggleAddUsers = async () => {
    if (!isCircleAdmin) return;
    const willShow = !showAddUsers;
    setShowAddUsers(willShow);
    if (willShow) {
      await fetchAvailableUsers();
    }
  };

  const handleAddUserToCircle = async (selectedUser: any) => {
    if (type !== 'circle' || !id || !isCircleAdmin) return;

    try {
      setAddingMemberId(selectedUser.id);
      await inviteToCircle(id, selectedUser.sl_id);
      await fetchCircleInfo();
      await fetchAvailableUsers();
      Alert.alert('Invitation sent', `${selectedUser.name} has been invited to the group.`);
    } catch (error: any) {
      console.error('[Chat] handleAddUserToCircle error', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add user');
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleMakeAdmin = async (memberId: string, memberName: string) => {
    if (type !== 'circle' || !id || !isCircleAdmin) return;

    const transferAdmin = async () => {
      try {
        setPromotingMemberId(memberId);
        await transferCircleAdmin(id, memberId);
        await fetchCircleInfo();
        Alert.alert('Success', `${memberName} is now the admin.`);
      } catch (error: any) {
        console.error('[Chat] handleMakeAdmin error', error);
        Alert.alert('Error', error.response?.data?.detail || 'Failed to transfer admin rights');
      } finally {
        setPromotingMemberId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(`Make ${memberName} the new group admin?`)
        : true;
      if (!confirmed) return;
      await transferAdmin();
      return;
    }

    Alert.alert(
      'Transfer Admin Rights',
      `Make ${memberName} the new group admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            transferAdmin();
          },
        },
      ]
    );
  };

  const readWebUriAsBase64 = async (uri: string): Promise<string | null> => {
    if (Platform.OS !== 'web') return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected image'));
        reader.readAsDataURL(blob);
      });
      return dataUrl || null;
    } catch {
      return null;
    }
  };

  const handlePickGroupPhoto = async () => {
    if (type !== 'circle' || !id || !isCircleAdmin) return;

    try {
      setUpdatingGroupPhoto(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access photos is required to change the group logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ((ImagePicker as any).MediaType?.Images
          ? [(ImagePicker as any).MediaType.Images]
          : ImagePicker.MediaTypeOptions.Images) as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : await readWebUriAsBase64(asset.uri);
      if (!base64Data) {
        Alert.alert('Error', 'Could not read the selected image. Please try another image.');
        return;
      }

      setCircleInfo((prev: any) => ({ ...(prev || {}), photo: base64Data }));
      await updateCircle(id, { photo: base64Data });
      await fetchCircleInfo();
      Alert.alert('Saved', 'Group logo updated successfully.');
    } catch (error: any) {
      console.error('[Chat] handlePickGroupPhoto error', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update group logo');
    } finally {
      setUpdatingGroupPhoto(false);
    }
  };

  const handleOpenCircleOptions = () => {
    setShowCircleOptions(true);
  };

  const handleLeaveGroup = async () => {
    console.log('[Chat] Leave group triggered', { type, id, circleInfo, userId: user?.id });
    if (type !== 'circle' || !id) {
      Alert.alert('Error', 'Invalid circle context.');
      return;
    }

    if (isCircleAdmin && circleAdminIds.length <= 1) {
      Alert.alert('Admin Action', 'Last admin cannot leave. Make another member admin first or delete the group.');
      return;
    }

    if (leavingGroup) {
      return;
    }

    setShowCircleOptions(false);
    setShowGroupInfo(false);

    const executeLeaveGroup = async () => {
      try {
        setLeavingGroup(true);
        await leaveCircle(id);
        Alert.alert('Left Group', 'You have left the group.');
        setCircleInfo(null);
        setMessages([]);
        navigateToPrivateChatTab();
      } catch (error: any) {
        console.error('[Chat] leaveCircle error', error);
        Alert.alert('Error', error.response?.data?.detail || 'Failed to leave group');
      } finally {
        setLeavingGroup(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Are you sure you want to leave this group?')
        : true;
      if (!confirmed) return;
      await executeLeaveGroup();
      return;
    }

    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          executeLeaveGroup();
        },
      },
    ]);
  };

  const headerTitle = type === 'circle'
    ? (circleInfo?.name || name || 'Circle Chat')
    : (name || 'Chat');
  const headerSubTitleLabel = type === 'circle'
    ? (circleMembersLabel || 'No members yet')
    : (type === 'community' ? (subgroup || 'Community') : 'Circle');

  const handleShareCommunityInvite = async () => {
    if (type !== 'community' || !id) return;

    const displayGroup = subgroup || headerTitle || 'Community Group';
    const groupUnique = (subgroup || headerTitle || id)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || id;

    const encodedCommunityId = `communityId=${encodeURIComponent(id)}`;
    const encodedSubgroup = subgroup ? `subgroup=${encodeURIComponent(subgroup)}` : '';
    const encodedName = headerTitle ? `name=${encodeURIComponent(headerTitle)}` : '';
    const query = [encodedCommunityId, encodedSubgroup, encodedName].filter(Boolean).join('&');

    const deepPath = `/chat/community/${id}${query ? `?${query}` : ''}`;
    const deepLink = ExpoLinking.createURL(deepPath);

    const webBaseUrl =
      process.env.EXPO_PUBLIC_APP_SHARE_URL ||
      process.env.EXPO_PUBLIC_SHARE_BASE_URL ||
      'https://brahmand-frontend-hi4rz6fdrq-uc.a.run.app';
    const webPath = `/community/${groupUnique}`;
    const shareLink = `${webBaseUrl.replace(/\/$/, '')}${webPath}${query ? `?${query}` : ''}`;

    try {
      await Share.share({
        title: 'Join my group on Brahmand',
        message: `Join my "${displayGroup}" group on Brahmand.\n${shareLink}\n\nApp link: ${deepLink}`,
        url: shareLink,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to open share options right now. Please try again.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <Avatar name={item.sender_name} photo={item.sender_photo} size={36} />
        )}
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{headerSubTitleLabel}</Text>
            {type === 'community' && (
              <TouchableOpacity style={styles.headerShareButton} onPress={handleShareCommunityInvite}>
                <Ionicons name="share-social-outline" size={15} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {type === 'circle' && (
          <TouchableOpacity style={styles.menuButton} onPress={handleOpenCircleOptions}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

        {/* Input */}
        {type === 'community' && !isVerified ? (
          <TouchableOpacity 
            style={styles.verificationBanner}
            onPress={() => router.push('/verification')}
          >
            <Ionicons name="shield-checkmark" size={20} color={COLORS.warning} />
            <Text style={styles.verificationText}>
              Verify your account to post in community discussions
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.warning} />
          </TouchableOpacity>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              maxLength={1000}
              placeholderTextColor={COLORS.textLight}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.textWhite} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.textWhite} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={showCircleOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCircleOptions(false)}
      >
        <TouchableOpacity style={styles.optionsBackdrop} activeOpacity={1} onPress={() => setShowCircleOptions(false)}>
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionsItem}
              onPress={() => {
                setShowCircleOptions(false);
                handleClearChatClientSide();
              }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.text} />
              <Text style={styles.optionsItemText}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionsItem}
              onPress={() => {
                setShowCircleOptions(false);
                setShowGroupInfo(true);
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color={COLORS.text} />
              <Text style={styles.optionsItemText}>Group Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionsItem}
              onPress={() => {
                setShowCircleOptions(false);
                setShowGroupSettings(true);
              }}
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.text} />
              <Text style={styles.optionsItemText}>Group Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionsItem, isCircleAdmin && styles.disabledAction]}
              disabled={isCircleAdmin}
              onPress={() => {
                setShowCircleOptions(false);
                handleLeaveGroup();
              }}
            >
              <Ionicons name="exit-outline" size={18} color={COLORS.error} />
              <Text style={[styles.optionsItemText, styles.leaveText]}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showGroupInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupInfo(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.groupHeaderLeft}
                onPress={handlePickGroupPhoto}
                disabled={!isCircleAdmin || updatingGroupPhoto}
              >
                <Avatar
                  name={circleInfo?.name || headerTitle}
                  photo={circleInfo?.photo}
                  size={44}
                />
                <View style={styles.groupHeaderTitleWrap}>
                  <Text style={styles.groupHeaderTitle}>Group Info</Text>
                  {isCircleAdmin && (
                    <Text style={styles.groupHeaderHint}>
                      {updatingGroupPhoto ? 'Updating...' : 'Tap icon to change'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowGroupInfo(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.groupSummary}> 
              <Text style={styles.groupSummaryTitle}>{circleInfo?.name || headerTitle}</Text>
              <Text style={styles.groupSummarySubtitle}>{circleInfo?.code || 'Group Code unavailable'}</Text>
              <Text style={styles.groupSummaryDescription}>{circleInfo?.members?.length ?? 0} members</Text>
            </View>

            <TouchableOpacity
              style={[styles.leaveGroupButton, isCircleAdmin && styles.disabledAction]}
              onPress={handleLeaveGroup}
              disabled={isCircleAdmin}
            >
              <Ionicons name="exit-outline" size={16} color={COLORS.error} />
              <Text style={styles.leaveGroupButtonText}>{isCircleAdmin ? 'Admin cannot leave group' : 'Leave Group'}</Text>
            </TouchableOpacity>

            <Text style={styles.membersTitle}>Members</Text>
            <FlatList
              data={circleInfo?.members || []}
              keyExtractor={(member, index) => `${member?.user_id || 'member'}_${index}`}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <Ionicons name="person-circle-outline" size={20} color={COLORS.textSecondary} />
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{item?.name || 'User'}</Text>
                    {circleAdminIds.includes(item?.user_id) && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  {(isCircleAdmin && item?.user_id !== user?.id) && (
                    <View style={styles.memberActionsRow}>
                      {!circleAdminIds.includes(item?.user_id) && isCircleAdmin && item?.user_id !== user?.id && (
                        <TouchableOpacity
                          style={[styles.makeAdminButton, promotingMemberId === item?.user_id && styles.sendButtonDisabled]}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          disabled={promotingMemberId === item?.user_id}
                          onPress={() => handleMakeAdmin(item?.user_id, item?.name)}
                        >
                          <Text style={styles.makeAdminText}>
                            {promotingMemberId === item?.user_id ? 'Promoting...' : 'Make Admin'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {(isCircleAdmin && item?.user_id !== user?.id) && (
                        <TouchableOpacity
                          style={styles.removeMemberButton}
                          disabled={removingMemberId === item?.user_id}
                          onPress={async () => {
                            try {
                              setRemovingMemberId(item?.user_id || null);
                              await removeCircleMember(id!, item.user_id);
                              await fetchCircleInfo();
                              Alert.alert('Removed', `${item.name} has been removed from group`);
                            } catch (error: any) {
                              Alert.alert('Error', error.response?.data?.detail || 'Failed to remove member');
                            } finally {
                              setRemovingMemberId(null);
                            }
                          }}
                        >
                          <Ionicons
                            name={removingMemberId === item?.user_id ? 'hourglass-outline' : 'trash'}
                            size={18}
                            color={COLORS.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
              style={styles.memberList}
              ListEmptyComponent={<Text style={styles.emptyMembersText}>No members found</Text>}
            />

            {isCircleAdmin && (
              <>
                <TouchableOpacity
                  style={[styles.addUserButton, loadingAvailableUsers && styles.disabledAction]}
                  onPress={handleToggleAddUsers}
                  disabled={loadingAvailableUsers}
                >
                  <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.addUserButtonText}>
                    {showAddUsers ? 'Hide add users' : 'Add other users'}
                  </Text>
                </TouchableOpacity>

                {showAddUsers && (
                  <View style={styles.availableUsersBox}>
                    {loadingAvailableUsers ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : availableUsers.length ? (
                      <FlatList
                        data={availableUsers}
                        keyExtractor={(userItem) => userItem.id}
                        renderItem={({ item }) => (
                          <View style={styles.availableUserItem}>
                            <View style={styles.availableUserInfo}>
                              <Text style={styles.availableUserName}>{item.name}</Text>
                              <Text style={styles.availableUserSlId}>{item.sl_id}</Text>
                            </View>
                            <TouchableOpacity
                              style={[styles.addUserActionButton, addingMemberId === item.id && styles.sendButtonDisabled]}
                              onPress={() => handleAddUserToCircle(item)}
                              disabled={addingMemberId === item.id}
                            >
                              <Text style={styles.addUserActionText}>{addingMemberId === item.id ? 'Adding...' : 'Add'}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        style={styles.availableUsersList}
                      />
                    ) : (
                      <Text style={styles.emptyMembersText}>No non-members available to add.</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGroupSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupSettings(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="settings-outline" size={44} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Group Settings</Text>
              <TouchableOpacity onPress={() => setShowGroupSettings(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.groupSettingsSection}>
              <Text style={styles.groupSettingsTitle}>Group Settings</Text>
              <View style={styles.infoRow}>
                {isCircleAdmin ? (
                  <>
                    <TextInput
                      style={styles.infoInput}
                      value={editedGroupName}
                      onChangeText={setEditedGroupName}
                      editable={editingName}
                      placeholder="Group name"
                      placeholderTextColor={COLORS.textLight}
                    />
                    <TouchableOpacity onPress={() => setEditingName((prev) => !prev)}>
                      <Ionicons name="pencil" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.staticInfoRow}>
                    <Text style={styles.staticInfoLabel}>Group name</Text>
                    <Text style={styles.staticInfoText}>{circleInfo?.name || headerTitle}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.infoRow, styles.groupSettingsDescriptionRow]}>
                {isCircleAdmin ? (
                  <>
                    <TextInput
                      style={[styles.infoInput, styles.infoDescriptionInput]}
                      value={editedGroupDescription}
                      onChangeText={setEditedGroupDescription}
                      editable={editingDescription}
                      placeholder="Group description"
                      placeholderTextColor={COLORS.textLight}
                      multiline
                    />
                    <TouchableOpacity onPress={() => setEditingDescription((prev) => !prev)}>
                      <Ionicons name="pencil" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.staticInfoRow}>
                    <Text style={styles.staticInfoLabel}>Description</Text>
                    <Text style={styles.staticInfoText}>{circleInfo?.description || 'No description'}</Text>
                  </View>
                )}
              </View>

              {isCircleAdmin && (
                <TouchableOpacity
                  style={[styles.saveButton, savingGroupInfo && styles.sendButtonDisabled]}
                  onPress={handleSaveGroupInfo}
                  disabled={savingGroupInfo}
                >
                  <Text style={styles.saveButtonText}>{savingGroupInfo ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  menuButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerShareButton: {
    marginLeft: SPACING.xs,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginLeft: SPACING.sm,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.sm,
    marginLeft: 0,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.textWhite,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 4,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 44,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.warning}30`,
  },
  verificationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    marginHorizontal: SPACING.sm,
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  optionsMenu: {
    position: 'absolute',
    right: SPACING.md,
    top: 78,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    minWidth: 170,
    paddingVertical: SPACING.xs,
  },
  optionsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  optionsItemText: {
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledAction: {
    opacity: 0.45,
  },
  leaveText: {
    color: COLORS.error,
  },
  groupSummary: {
    padding: SPACING.sm,
    backgroundColor: `${COLORS.primary}05`,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  groupSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  groupSummarySubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  groupSummaryDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  groupSettingsSection: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  groupSettingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  staticInfoRow: {
    flex: 1,
  },
  staticInfoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  staticInfoText: {
    fontSize: 14,
    color: COLORS.text,
  },
  groupSettingsDescriptionRow: {
    alignItems: 'flex-start',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  groupHeaderTitleWrap: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  groupHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  groupHeaderHint: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.primary,
  },
  modalTitle: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  infoInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: SPACING.sm,
  },
  infoDescriptionInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  saveButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: 14,
  },
  leaveGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.error}40`,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  leaveGroupButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 14,
  },
  membersTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  memberList: {
    maxHeight: 220,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: SPACING.sm,
  },
  removeMemberButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  memberActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  makeAdminButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.success}15`,
    borderWidth: 1,
    borderColor: COLORS.success,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  makeAdminText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
  },
  memberName: {
    color: COLORS.text,
    fontSize: 14,
  },
  adminBadge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: BORDER_RADIUS.xs,
  },
  adminBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.sm,
  },
  addUserButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  availableUsersBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  availableUsersList: {
    marginTop: SPACING.xs,
    maxHeight: 220,
  },
  availableUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  availableUserInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  availableUserName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  availableUserSlId: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  addUserActionButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  addUserActionText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyMembersText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: SPACING.md,
  },
});
