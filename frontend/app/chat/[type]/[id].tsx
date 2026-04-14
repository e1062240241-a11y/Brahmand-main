import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, Share, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import type * as ImageManipulatorType from 'expo-image-manipulator';
import type * as ContactsType from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { getCommunityMessages, sendCommunityMessage, getCircleMessages, sendCircleMessage, getVerificationStatus, getCommunity, getCircle, updateCircle, leaveCircle, removeCircleMember, getAllUsers, inviteToCircle, transferCircleAdmin, uploadChatMedia, uploadCompressedVideo } from '../../../src/services/api';
import { socketService } from '../../../src/services/socket';
import { useAuthStore } from '../../../src/store/authStore';
import { Message } from '../../../src/types';
import { Avatar } from '../../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';

let chatImageManipulator: typeof ImageManipulatorType | null = null;
const getChatImageManipulator = async () => {
  if (!chatImageManipulator) {
    chatImageManipulator = await import('expo-image-manipulator');
  }
  return chatImageManipulator;
};

let chatContacts: typeof ContactsType | null = null;
const getChatContacts = async () => {
  if (!chatContacts) {
    chatContacts = await import('expo-contacts');
  }
  return chatContacts;
};

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
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    name: string;
    type: string;
    mediaType: 'image' | 'video';
  } | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [circleInfo, setCircleInfo] = useState<any>(null);
  const [showCircleOptions, setShowCircleOptions] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactShareName, setContactShareName] = useState('');
  const [contactSharePhone, setContactSharePhone] = useState('');
  const [phoneContacts, setPhoneContacts] = useState<Contacts.Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sharingContact, setSharingContact] = useState(false);
  const attachmentAnim = useRef(new Animated.Value(0)).current;
  const [communityInfo, setCommunityInfo] = useState<any>(null);
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

  const fetchCommunityInfo = useCallback(async () => {
    if (type !== 'community' || !id) return;
    try {
      const response = await getCommunity(id);
      setCommunityInfo(response.data);
    } catch (error) {
      console.error('Error fetching community info:', error);
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
      await fetchCommunityInfo();
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

    if (Platform.OS === 'web') {
      // Web uses polling only for group/community chat; socket transport is unreliable in this setup.
      pollingInterval = setInterval(() => {
        fetchMessages();
      }, 3000);
    } else {
      setupSocket();
    }

    return () => {
      socketService.leaveRoom(room);
      socketService.offMessage(listenerId);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [type, id, subgroup, fetchMessages, fetchCircleInfo, clearChatStorageKey, clearedAtMs, addRealtimeMessage]);

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedMedia) return;

    // Check verification for community posts
    if (type === 'community' && !isVerified) {
      router.push('/verification');
      return;
    }

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

        if (type === 'circle') {
          await sendCircleMessage(id!, mediaUrl, selected.mediaType);
        }
        if (type === 'community') {
          await sendCommunityMessage(id!, subgroup, mediaUrl, selected.mediaType);
        }

        setSelectedMedia(null);
        setNewMessage('');
        setTimeout(async () => {
          await fetchMessages();
        }, 500);
      } catch (error: any) {
        Alert.alert('Upload failed', error?.response?.data?.detail || error?.message || 'Failed to send media.');
      } finally {
        setUploadingMedia(false);
        setSending(false);
      }
      return;
    }

    const messageText = newMessage.trim();
    if (!messageText) return;

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

  const handleGoBack = () => {
    const route = type === 'community' 
      ? '/messages?tab=Community' 
      : '/messages?tab=Private%20Chat';
    router.replace(route);
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

  const handleConfirmRemoveMember = async (memberId: string | undefined, memberName: string | undefined) => {
    if (!memberId) return;

    const confirmed = Platform.OS === 'web'
      ? typeof window !== 'undefined' && window.confirm(`Are you sure you want to remove ${memberName || 'this user'}?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${memberName || 'this user'}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
            ],
          );
        });

    if (!confirmed) return;

    try {
      setRemovingMemberId(memberId);
      await removeCircleMember(id!, memberId);
      await fetchCircleInfo();
      Alert.alert('Removed', `${memberName || 'User'} has been removed from group`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
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

  const isSoloGroup = (circleInfo?.members?.length || 0) <= 1;
  const leaveGroupLabel = isSoloGroup ? 'Delete Group' : 'Leave Group';
  const leaveGroupDisabled = false;

  const handleLeaveGroup = async () => {
    console.log('[Chat] Leave group triggered', { type, id, circleInfo, userId: user?.id });
    if (type !== 'circle' || !id) {
      Alert.alert('Error', 'Invalid circle context.');
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

  const getPickerMediaTypes = (mediaType: 'image' | 'video') => {
    const pickerType = mediaType === 'image' ? 'Images' : 'Videos';
    return ((ImagePicker as any).MediaType?.[pickerType]
      ? [(ImagePicker as any).MediaType[pickerType]]
      : mediaType === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos) as any;
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

  const isMediaUrl = (url: string, type: 'image' | 'video') => {
    const normalized = url.split('?')[0].toLowerCase();
    if (type === 'image') {
      return normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.webp');
    }
    return normalized.endsWith('.mp4') || normalized.endsWith('.mov') || normalized.endsWith('.webm') || normalized.endsWith('.mkv');
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

  const renderMessageContent = (message: Message) => {
    const sourceUrl = message.content || message.text || '';
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
    if (sourceUrl && isMediaUrl(sourceUrl, 'image')) {
      return (
        <TouchableOpacity onPress={() => setFullScreenMedia({ uri: sourceUrl, type: 'image' })} activeOpacity={0.85}>
          <Image source={{ uri: sourceUrl }} style={styles.messageMedia} resizeMode="cover" />
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
    return (
      <Text style={[styles.messageText, message.sender_id === user?.id && styles.ownMessageText]}>
        {message.text || message.content}
      </Text>
    );
  };

  const handlePickMedia = async (mediaType: 'image' | 'video') => {
    closeAttachmentOptions();
    if (!id || type === 'community' || uploadingMedia || sending) return;
    if (!validateChatUploadAccess()) return;

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

  const compressImageForUpload = async (uri: string) => {
    try {
      const ImageManipulator = await getChatImageManipulator();
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.warn('[Chat] Image compression failed', error);
      return uri;
    }
  };

  const validateChatUploadAccess = () => {
    if (type === 'community') return false;
    if (type === 'circle') return true;
    return true;
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

  const requestContactsPermission = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Contacts unsupported', 'Phone contacts are only available on native devices.');
      return false;
    }

    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow contacts access to share phone contacts.');
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('[Chat] Contact permission error', error);
      Alert.alert('Permission failed', 'Unable to request contacts permission.');
      return false;
    }
  };

  const loadPhoneContacts = async () => {
    setLoadingContacts(true);
    try {
      const permissionGranted = await requestContactsPermission();
      if (!permissionGranted) return false;

      const contactResult = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        pageSize: 2000,
        sort: Contacts.SortTypes.FirstName,
      });

      const contactsWithNumbers = (contactResult.data || []).filter((contact) => contact.phoneNumbers?.length);
      setPhoneContacts(contactsWithNumbers);
      if (!contactsWithNumbers.length) {
        Alert.alert('No contacts found', 'No contacts with phone numbers were found on this device.');
      }
      return contactsWithNumbers.length > 0;
    } catch (error: any) {
      console.error('[Chat] Failed to load contacts', error);
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

  const handleSelectPhoneContact = (contact: Contacts.Contact) => {
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

    if (type === 'community' && !isVerified) {
      router.push('/verification');
      return;
    }

    setSharingContact(true);
    try {
      const payload = `${name}\n${phone}`;
      if (type === 'circle') {
        await sendCircleMessage(id!, payload, 'contact');
      } else if (type === 'community') {
        await sendCommunityMessage(id!, subgroup, payload, 'contact');
      }
      setShowContactModal(false);
      setContactShareName('');
      setContactSharePhone('');
      fetchMessages();
    } catch (error: any) {
      Alert.alert('Share failed', error?.response?.data?.detail || error?.message || 'Failed to share contact.');
    } finally {
      setSharingContact(false);
    }
  };

  const toggleAttachmentOptions = () => {
    if (showAttachmentOptions) {
      closeAttachmentOptions();
      return;
    }
    openAttachmentOptions();
  };

  const isSameDay = (dateA: Date, dateB: Date) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const formatChatDate = (dateString: string) => {
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
  };

  const shouldShowDateSeparator = (index: number, currentDateString: string) => {
    const currentDate = new Date(currentDateString);
    if (index === 0) return true;
    const previousDate = new Date(messages[index - 1]?.created_at || '');
    return !isSameDay(currentDate, previousDate);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <>
        {shouldShowDateSeparator(index, item.created_at) && (
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
          <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
            {!isOwnMessage && (
              <Text style={styles.senderName}>{item.sender_name}</Text>
            )}
            {renderMessageContent(item)}
            <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </>
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
          {type === 'community' && (
            <TouchableOpacity style={styles.memberCountRow} onPress={() => setShowMembersPanel(true)}>
              <Ionicons name="people" size={14} color={COLORS.primary} />
              <Text style={styles.memberCountText} numberOfLines={1}>
                {communityInfo?.member_count ?? communityInfo?.members?.length ?? 0} members
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {type === 'circle' && (
          <TouchableOpacity style={styles.menuButton} onPress={handleOpenCircleOptions}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Members Panel */}
      {showMembersPanel && (
        <View style={styles.membersPanelOverlay}>
          <TouchableOpacity style={styles.membersPanelBackdrop} onPress={() => setShowMembersPanel(false)} />
          <View style={styles.membersPanel}>
            <View style={styles.membersPanelHeader}>
              <Text style={styles.membersPanelTitle}>Members</Text>
              <TouchableOpacity onPress={() => setShowMembersPanel(false)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={type === 'circle' ? circleInfo?.members || [] : communityInfo?.members || []}
              keyExtractor={(item, index) => `${typeof item === 'string' ? item : item?.user_id || item?.id || index}_${index}`}
              renderItem={({ item }) => {
                const memberName = typeof item === 'string'
                  ? item
                  : item?.name || item?.user_name || item?.sl_id || item?.id || 'Member';
                return (
                  <View style={styles.memberItem}>
                    <Ionicons name="person-circle-outline" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.memberName}>{memberName}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyMembersText}>No members found</Text>
              }
              style={styles.membersList}
            />
          </View>
        </View>
      )}

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
          <View style={styles.inputWrapperContainer}>
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

            <View style={styles.inputContainer}>
              <View style={styles.attachmentButtons}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={toggleAttachmentOptions}
                disabled={uploadingMedia || sending}
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
                  disabled={uploadingMedia || sending}
                >
                  <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.attachmentOptionText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={() => handlePickMedia('video')}
                  disabled={uploadingMedia || sending}
                >
                  <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.attachmentOptionText}>Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={handleOpenContactShare}
                  disabled={uploadingMedia || sending}
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
                    keyExtractor={(item) => item.id || item.name || item.phoneNumbers?.[0]?.id || String(Math.random())}
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
                style={[styles.sendButton, (!newMessage.trim() && !selectedMedia) || sending || uploadingMedia ? styles.sendButtonDisabled : null]}
                onPress={handleSend}
                disabled={!newMessage.trim() && !selectedMedia || sending || uploadingMedia}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <Ionicons name="send" size={20} color={COLORS.textWhite} />
                )}
              </TouchableOpacity>
            </View>
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
              style={styles.optionsItem}
              onPress={() => {
                setShowCircleOptions(false);
                handleLeaveGroup();
              }}
            >
              <Ionicons name="exit-outline" size={18} color={COLORS.error} />
              <Text style={[styles.optionsItemText, styles.leaveText]}>{leaveGroupLabel}</Text>
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

            <View style={styles.leaveGroupRow}>
              <TouchableOpacity
                style={styles.leaveGroupAction}
                onPress={handleLeaveGroup}
              >
                <Ionicons name="exit-outline" size={16} color={COLORS.error} />
                <Text style={styles.leaveGroupActionText}>{leaveGroupLabel}</Text>
              </TouchableOpacity>
            </View>

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
                          onPress={() => handleConfirmRemoveMember(item?.user_id, item?.name)}
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
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  memberCountText: {
    marginLeft: SPACING.xs,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  membersPanelOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
  },
  membersPanelBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  membersPanel: {
    width: 300,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  membersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  membersPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  membersList: {
    flexGrow: 0,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 40,
    minHeight: 40,
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
  inputWrapperContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  mediaPreviewContainer: {
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 40,
    minHeight: 40,
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
    bottom: 54,
    left: 16,
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
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  messageVideo: {
    width: 200,
    height: 140,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xs,
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
  leaveGroupRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.md,
  },
  leaveGroupAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}40`,
    backgroundColor: `${COLORS.error}10`,
  },
  leaveGroupActionText: {
    marginLeft: SPACING.xs,
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 13,
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
