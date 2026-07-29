import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
  Share,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  BackHandler,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useTabBar } from '../../src/contexts/TabBarContext';
import { getUserProfile, followUser, unfollowUser, viewPost, deletePost, getPostComments, addPostComment, togglePostLike, repostPost, deletePostComment, reportPost } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import SharePostModal from '../../src/components/SharePostModal';
import { ReportModal } from '../../src/components/ReportModal';
import { originalAlert } from '../../src/utils/nativeAlert';
import { CommentOptionsModal } from '../../src/components/CommentOptionsModal';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { blockUser, unblockUser, isUserBlocked } from '../../src/services/firebase/moderationService';
import { useBlockStore } from '../../src/store/blockStore';
import { BlockConfirmationModal } from '../../src/components/BlockConfirmationModal';
import { DeleteConfirmationModal } from '../../src/components/DeleteConfirmationModal';

import { MentionInput } from '../../src/components/MentionInput';
import { MentionText } from '../../src/components/MentionText';

let FileSystemModule: any = null;
try {
  FileSystemModule = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system unavailable for media sharing:', error);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = SCREEN_WIDTH / 3;

const UserProfileScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const columnWidth = Platform.OS === 'android' ? (windowWidth / 3) : COLUMN_WIDTH;

  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const profileUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const activeUserIdRef = useRef<string | undefined>(profileUserId);
  const requestSequenceRef = useRef(0); // ponytail: track request sequence to avoid race conditions
  const isFetchingRef = useRef(false); // ponytail: track fetch state to prevent overlapping calls
  const detailFlatListRef = useRef<FlatList>(null);

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [50, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [viewablePostId, setViewablePostId] = useState<string | null>(null);
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
  } catch (e) {}

  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  useEffect(() => {
    if ((Platform.OS as string) !== 'android') return;

    const backAction = () => {
      if (commentModalVisible) {
        setCommentModalVisible(false);
        return true;
      }
      if (postModalVisible) {
        setPostModalVisible(false);
        showTabBar?.();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [postModalVisible, commentModalVisible]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setViewablePostId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const openPostModal = (post: any) => {
    if (!post?.id) return;
    setSelectedPost(post);
    setViewablePostId(post.id);
    setPostModalVisible(true);
    hideTabBar?.();
    try {
      viewPost(post.id);
    } catch (e) { }
  };
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [selectedSharePost, setSelectedSharePost] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('grid');
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
  const [pendingReportComment, setPendingReportComment] = useState<any | null>(null);
  const [keptComments, setKeptComments] = useState<any[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [commentModalToRestore, setCommentModalToRestore] = useState(false);
  const [commentOptionsModalVisible, setCommentOptionsModalVisible] = useState(false);
  const [commentOptions, setCommentOptions] = useState<any[]>([]);
  const [reportPostModalVisible, setReportPostModalVisible] = useState(false);
  const [pendingReportPost, setPendingReportPost] = useState<any | null>(null);

  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockConfirmData, setBlockConfirmData] = useState<{
    targetUserId: string;
    username: string;
    isBlocked: boolean;
    onConfirm: () => void;
  } | null>(null);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<any | null>(null);

  // Global block store — shared across all screens
  const blockedUserIds = useBlockStore(state => state.blockedUserIds);
  const blockedByMeUserIds = useBlockStore(state => state.blockedByMeUserIds);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);

  const loadComments = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const response = await getPostComments(postId, 200);
      const comments = Array.isArray(response.data) ? response.data : [];
      const merged = [...comments];
      keptComments.forEach(kc => {
        if (kc && kc.id && !merged.some(c => c.id === kc.id)) {
          merged.push(kc);
        }
      });
      merged.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setPostComments(merged);
    } catch (error) {
      console.warn('Failed to load comments:', error);
      setPostComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComment = async (post: any) => {
    const postId = post?.id;
    if (!postId) return;
    setSelectedCommentPost(post);
    setCommentText('');
    setReplyingToComment(null);
    setCommentModalVisible(true);
    await loadComments(postId);
  };

  const handleSubmitComment = async () => {
    if (!selectedCommentPost?.id || !commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const parentId = replyingToComment?.id || undefined;
      const response = await addPostComment(selectedCommentPost.id, commentText.trim(), parentId);
      const serverComment = response.data?.comment || response.data;

      setCommentText('');
      setReplyingToComment(null);
      Keyboard.dismiss();

      // Update top_comments in local state for outer preview
      setPosts(prev => prev.map(p => {
        if (p.id === selectedCommentPost.id) {
          const currentTop = Array.isArray(p.top_comments) ? p.top_comments : [];
          return {
            ...p,
            comments_count: (Number(p.comments_count) || 0) + 1,
            top_comments: [serverComment, ...currentTop].slice(0, 2)
          };
        }
        return p;
      }));

      await loadComments(selectedCommentPost.id);
    } catch (error: any) {
      console.warn('Failed to submit comment:', error);
      const detail = error.response?.data?.detail || error.message;
      alert(detail || 'Unable to submit comment. Please try again.');
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
      const detail = error.response?.data?.detail || error.message;
      Alert.alert('Error', detail || 'Could not delete comment. Please try again.');
    }
  };

  const handleCommentMenuPress = useCallback((comment: any) => {
    if (!comment || !currentUserId) return;
    const targetUserId = comment.user_id || comment.userId || comment.sender_id || comment.user?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserIds.includes(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

    const handleToggleBlock = async () => {
      const performBlockToggle = async () => {
        try {
          if (isUserCurrentlyBlocked) {
            await unblockUser(currentUserId, targetUserId);
            removeBlock(String(targetUserId));
            Alert.alert('Success', `${comment.username || 'User'} has been unblocked.`);
          } else {
            await blockUser(currentUserId, targetUserId);
            addBlock(String(targetUserId));
            
            // Dismiss comments modal first
            setCommentModalVisible(false);

            Alert.alert('Success', `${comment.username || 'User'} has been blocked.`);

            // If this profile belongs to the blocked user, go back
            if (String(profileUserId) === String(targetUserId)) {
              router.back();
            }
          }
        } catch (err) {
          console.error('Error toggling block in comment menu:', err);
          Alert.alert('Error', 'Could not update block status. Please try again.');
        }
      };

      if (Platform.OS === 'android') {
        setBlockConfirmData({
          targetUserId: String(targetUserId),
          username: comment.username || 'User',
          isBlocked: isUserCurrentlyBlocked,
          onConfirm: performBlockToggle,
        });
        setBlockConfirmVisible(true);
      } else {
        Alert.alert(
          isUserCurrentlyBlocked ? 'Unblock User' : 'Block User',
          isUserCurrentlyBlocked
            ? `Are you sure you want to unblock ${comment.username || 'this user'}?`
            : `Are you sure you want to block ${comment.username || 'this user'}? You will no longer see their posts, comments, or messages.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: isUserCurrentlyBlocked ? 'Unblock' : 'Block',
              style: isUserCurrentlyBlocked ? 'default' : 'destructive',
              onPress: performBlockToggle,
            }
          ]
        );
      }
    };

    if (Platform.OS === 'ios') {
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Comment', blockLabel],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Comment Options'
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 1) {
            setPendingReportComment(comment);
            setCommentModalToRestore(commentModalVisible);
            setCommentModalVisible(false);
            setTimeout(() => {
              setReportCommentModalVisible(true);
            }, 300);
          } else if (buttonIndex === 2) {
            await handleToggleBlock();
          }
        }
      );
    } else {
      setCommentOptions([
        {
          label: 'Report Comment',
          icon: 'flag-outline',
          onPress: () => {
            setPendingReportComment(comment);
            setReportCommentModalVisible(true);
          }
        },
        {
          label: blockLabel,
          isDestructive: true,
          icon: 'ban-outline',
          onPress: handleToggleBlock
        }
      ]);
      setCommentOptionsModalVisible(true);
    }
  }, [currentUserId, blockedUserIds, commentModalVisible]);

  const loadProfile = useCallback(async (showLoading = true) => {
    if (!profileUserId || profileUserId.toLowerCase().trim() === 'undefined' || profileUserId.toLowerCase().trim() === 'null' || profileUserId.toLowerCase().trim() === 'none') return;
    setError(null);
    const requestedUserId = profileUserId;

    // 1. Optimistic load from WatermelonDB
    try {
      if (Platform.OS !== 'web') {
        const { database } = require('../../src/database');
        const { Q } = require('@nozbe/watermelondb');
        const usersCollection = database.collections.get('users');
        const cachedUsers = await usersCollection.query(Q.where('id', profileUserId)).fetch();
        if (profileUserId !== activeUserIdRef.current) return;
        if (cachedUsers.length > 0) {
          const u = cachedUsers[0];
          setProfile((prev: any) => prev?.id === profileUserId ? prev : {
            id: u.id,
            name: u.name,
            sl_id: u.slId,
            photo: u.photo,
            bio: u.bio
          });
          showLoading = false; // We have initial data, don't show full loading spinner
        }
      }
    } catch (e) {
      console.log('WMDB cache error:', e);
    }

    if (showLoading) setLoading(true);
    try {
      const response = await getUserProfile(profileUserId);
      if (requestedUserId !== activeUserIdRef.current) return;
      setProfile(response.data);

      // 2. Save fetched data back to WatermelonDB for next time
      try {
        if (Platform.OS !== 'web') {
          const { database } = require('../../src/database');
          const { Q } = require('@nozbe/watermelondb');
          const usersCollection = database.collections.get('users');
          const remoteUser = response.data;

          await database.write(async () => {
            const existing = await usersCollection.query(Q.where('id', profileUserId)).fetch();
            if (existing.length > 0) {
              await existing[0].update((u: any) => {
                u.name = remoteUser.name || '';
                u.slId = remoteUser.sl_id || '';
                u.photo = remoteUser.photo || '';
                u.bio = remoteUser.bio || '';
              });
            } else {
              await usersCollection.create((u: any) => {
                u._raw.id = remoteUser.id;
                u.name = remoteUser.name || '';
                u.slId = remoteUser.sl_id || '';
                u.photo = remoteUser.photo || '';
                u.bio = remoteUser.bio || '';
              });
            }
          });
        }
      } catch (dbErr) {
        console.log('Failed to update profile cache:', dbErr);
      }

    } catch (error: any) {
      if (requestedUserId !== activeUserIdRef.current) return;
      if (error.response?.status === 404) {
        setError('User profile not found. This account may have been deleted.');
      } else {
        console.warn('Failed to load user profile:', error);
        setError('Failed to load profile. Please check your connection.');
      }
    } finally {
      if (requestedUserId === activeUserIdRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [profileUserId]);

  useEffect(() => {
    if (profile && profile.id && profile.id !== currentUserId) {
      saveToRecentSearches(profile);
    }
  }, [profile, currentUserId]);

  const saveToRecentSearches = async (userObj: any) => {
    try {
      const saved = await AsyncStorage.getItem('recent_searches');
      let recent = saved ? JSON.parse(saved) : [];
      // Profile structure might vary between search and profile, normalize
      const profileToSave = {
        id: userObj.id,
        name: userObj.name || userObj.username,
        photo: userObj.photo || userObj.user_photo,
        sl_id: userObj.sl_id,
        phone: userObj.phone
      };

      recent = [profileToSave, ...recent.filter((item: any) => item.id !== profileToSave.id)].slice(0, 4);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(recent));
    } catch (e) {
      console.warn('Failed to save visited profile to recent searches:', e);
    }
  };

  const loadPosts = useCallback(async (reset = false) => {
    if (!profileUserId) return;

    if (!reset && !hasMore) return;

    const currentOffset = reset ? 0 : offset;

    setPostsLoading(true);

    try {
      const { getMyPosts } = require('../../src/services/api');
      const response = await getMyPosts(6, currentOffset, profileUserId);
      const payload = response.data;
      const incomingPosts = payload?.posts || [];

      // Strict validation: every post must belong to the viewed profile user
      const validated: any[] = [];
      const seenIds = new Set<string>();
      for (const p of incomingPosts) {
        if (!p || p.id === undefined || p.id === null || String(p.id).trim() === '') {
          console.warn('[Profile Screen Feed] Post missing valid ID:', p);
          continue;
        }
        if (p.user_id !== profileUserId) {
          console.error(`SECURITY VIOLATION: Post ${p.id} belongs to user ${p.user_id} but was returned for user ${profileUserId}!`);
          continue;
        }
        const idStr = String(p.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          validated.push(p);
        } else {
          console.warn('[Profile Screen Feed] Duplicate post ID in incoming chunk:', idStr);
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
      setTotalPosts(payload?.total || 0);
      setOffset(nextOffset);
      setHasMore(nextHasMore);
    } catch (err) {
      console.warn('Failed to load posts on profile screen:', err);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  }, [profileUserId, offset, hasMore]);

  useEffect(() => {
    activeUserIdRef.current = profileUserId;
    // Clear state immediately to avoid cross-user/stale leakage during navigation
    setPosts([]);
    setTotalPosts(0);
    setOffset(0);
    setHasMore(true);
    setProfile(null);
    setError(null);

    const isPlaceholder = !profileUserId ||
      profileUserId.toLowerCase().trim() === 'undefined' ||
      profileUserId.toLowerCase().trim() === 'null' ||
      profileUserId.toLowerCase().trim() === 'none' ||
      profileUserId === '';

    if (isPlaceholder) {
      setLoading(false);
      setPostsLoading(false);
      return;
    }

    setLoading(true);
    setPostsLoading(true);

    loadProfile(true);
    loadPosts(true);
  }, [profileUserId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile(false);
    loadPosts(true);
  }, [loadProfile, loadPosts]);

  const isFollowing = Boolean(profile?.followers?.includes(currentUserId));

  const toggleFollow = async () => {
    if (!profile?.id || !currentUserId) return;

    // Optimistic Update
    const currentFollowers = Array.isArray(profile.followers) ? profile.followers : [];
    const isNowFollowing = !isFollowing;

    const nextFollowers = isNowFollowing
      ? [...currentFollowers, currentUserId]
      : currentFollowers.filter((id: string) => id !== currentUserId);

    setProfile((prev: any) => ({
      ...prev,
      followers: nextFollowers,
      followers_count: (prev?.followers_count || 0) + (isNowFollowing ? 1 : -1)
    }));

    try {
      if (isNowFollowing) {
        await followUser(profile.id);
      } else {
        await unfollowUser(profile.id);
      }
    } catch (error) {
      console.warn('Failed to follow/unfollow user:', error);
      // Revert on error
      loadProfile(false);
    }
  };

  const handleDeletePost = (post: any) => {
    if (!post?.id) return;
    setPostToDelete(post);
    setDeleteConfirmVisible(true);
  };

  const onConfirmDelete = async () => {
    if (!postToDelete?.id) return;
    try {
      await deletePost(postToDelete.id);
      setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      setTotalPosts(prev => Math.max(0, prev - 1));
      setPostModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    } finally {
      setPostToDelete(null);
    }
  };

  const handlePostMenuPress = useCallback((post: any) => {
    if (!currentUserId) return;
    if (profile?.id === currentUserId || post?.user_id === currentUserId) {
      handleDeletePost(post);
      return;
    }

    const targetUserId = post?.user_id || post?.userId || post?.user?.id || profile?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserIds.includes(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

    const handleToggleBlock = async () => {
      try {
        if (isUserCurrentlyBlocked) {
          await unblockUser(currentUserId, targetUserId);
          removeBlock(String(targetUserId));
          Alert.alert('Success', `${post.username || 'User'} has been unblocked.`);
        } else {
          Alert.alert(
            'Block User',
            `Are you sure you want to block ${post.username || 'this user'}? You will no longer see their posts, comments, or messages.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: async () => {
                  await blockUser(currentUserId, targetUserId);
                  addBlock(String(targetUserId));
                  Alert.alert('Success', `${post.username || 'User'} has been blocked.`);
                }
              }
            ]
          );
        }
      } catch (err) {
        console.error('Error toggling block in post menu:', err);
        Alert.alert('Error', 'Could not update block status. Please try again.');
      }
    };

    if (Platform.OS === 'ios') {
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Post', blockLabel],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Post Options'
        },
        async (buttonIndex: number) => {
          if (buttonIndex === 1) {
            setPendingReportPost(post);
            setReportPostModalVisible(true);
          } else if (buttonIndex === 2) {
            await handleToggleBlock();
          }
        }
      );
    } else {
      Alert.alert(
        'Post Options',
        'Choose an action:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report Post', onPress: () => {
              setPendingReportPost(post);
              setReportPostModalVisible(true);
            }
          },
          { text: blockLabel, style: 'destructive', onPress: handleToggleBlock }
        ],
        { cancelable: true }
      );
    }
  }, [profile?.id, currentUserId, blockedByMeUserIds, handleDeletePost]);

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

  const handleSharePost = useCallback((post: any) => {
    setSelectedSharePost(post);
    setShareModalVisible(true);
  }, []);

  const handleRepost = useCallback(async (post: any) => {
    const postId = post?.id;
    if (!postId) return;

    try {
      await repostPost(postId);
      Alert.alert('Success', 'Reposted to your feed');
      loadPosts(true); // Refresh grid
    } catch (error) {
      console.warn('Failed to repost:', error);
      Alert.alert('Error', 'Could not repost.');
    }
  }, [loadPosts]);

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
      await Share.share({ message: `${message}\n${mediaUrl}`, url: mediaUrl || appLink, title: 'Share via Brahmand' });
    } catch (error: any) {
      const msg = String(error?.message || error || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss') || msg.includes('aborted')) return;
      console.warn('Failed to open share sheet:', error);
    }
  };

  const openPrivateChat = () => {
    if (!profile?.id || profile?.id === currentUserId) return;
    const userName = encodeURIComponent(profile.name || '');
    const userSL = encodeURIComponent(profile.sl_id || '');
    const userPhoto = encodeURIComponent(profile.photo || '');
    router.push(`/dm/new?userId=${profile.id}&userName=${userName}&userSL=${userSL}&userPhoto=${userPhoto}`);
  };

  const handleShareProfile = () => {
    setUserMenuVisible(false);
    // Open DM selection with pre-filled profile link
    router.push({
      pathname: '/dm/new',
      params: {
        shareText: `Check out ${profile?.name || 'this user'} on Brahmand: @${profile?.sl_id}`
      }
    });
  };

  const handleReportUser = () => {
    setUserMenuVisible(false);
    // Small delay so the bottom sheet closes before the report modal opens
    setTimeout(() => setReportModalVisible(true), 300);
  };

  // Check block status when profile loads
  useEffect(() => {
    if (!currentUserId || !profileUserId || currentUserId === profileUserId) return;
    isUserBlocked(currentUserId, profileUserId)
      .then(setIsBlocked)
      .catch(() => { });
  }, [currentUserId, profileUserId]);

  const handleBlockUser = () => {
    setUserMenuVisible(false);
    if (isBlocked) {
      Alert.alert(
        'Unblock User',
        `Unblock @${profile?.sl_id}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: async () => {
              try {
                await unblockUser(currentUserId!, profileUserId!);
                setIsBlocked(false);
                removeBlock(String(profileUserId));
                Alert.alert('Unblocked', `@${profile?.sl_id} has been unblocked.`);
              } catch (e) {
                Alert.alert('Error', 'Could not unblock user. Please try again.');
              }
            },
          },
        ]
      );
      return;
    }
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${profile?.sl_id}? They will no longer be able to see your posts or message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(currentUserId!, profileUserId!);
              setIsBlocked(true);
              addBlock(String(profileUserId));
              Alert.alert('Blocked', `@${profile?.sl_id} has been blocked.`);
            } catch (e) {
              Alert.alert('Error', 'Could not block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderPost = ({ item }: { item: any }) => {
    const rawUrl = item.media_url || item.mediaUrl || item.image_url || item.image || '';
    const isVideo = (rawUrl.match(/\.(mp4|mov|m4v|webm|m3u8|avi|mkv|flv|wmv)(\?|$)/i) || false) ||
      item.media_type === 'video' ||
      item.is_video ||
      item.isVideo ||
      (rawUrl.includes('firebasestorage.googleapis.com') && (
        rawUrl.toLowerCase().includes('%2fvideo') ||
        rawUrl.toLowerCase().includes('/video') ||
        rawUrl.toLowerCase().includes('.mp4') ||
        rawUrl.toLowerCase().includes('.m3u8') ||
        rawUrl.toLowerCase().includes('%2fposts%2f')
      ));
    const displayUrl = item.thumbnail_url || item.thumbnailUrl || item.image_url || item.image || rawUrl;
    const views = item.views_count || 0;

    return (
      <TouchableOpacity
        style={Platform.OS === 'android' ? [styles.gridItem, { width: columnWidth, height: columnWidth * 1.2 }] : styles.gridItem}
        activeOpacity={0.9}
        onPress={() => openPostModal(item)}
      >
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name={isVideo ? "videocam" : "image-outline"} size={24} color={COLORS.textLight} />
          </View>
        )}

        {/* View Count and Likes Count Overlay */}
        <View style={styles.gridOverlay}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={styles.viewCountBadge}>
              <Ionicons name="play" size={10} color="#FFF" />
              <Text style={styles.viewCountText}>{views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</Text>
            </View>
            <View style={styles.viewCountBadge}>
              <Ionicons name="heart" size={10} color="#FFF" />
              <Text style={styles.viewCountText}>
                {(() => {
                  const likes = item.likes_count ?? item.likesCount ?? 0;
                  return likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes;
                })()}
              </Text>
            </View>
          </View>
        </View>

        {isVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={14} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContent}>
      {/* Profile Header: Avatar and Stats */}
      <View style={styles.profileHeaderRow}>
        <TouchableOpacity
          onPress={() => profile?.photo && setAvatarModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.avatar} />
            ) : (
              <Avatar name={profile?.name || 'User'} size={86} />
            )}

          </View>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isBlocked ? '0' : totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => !isBlocked && router.push({ pathname: '/follow-connections', params: { tab: 'followers', userId: profile?.id } })}
            disabled={isBlocked}
          >
            <Text style={styles.statValue}>{isBlocked ? '0' : (profile?.followers_count ?? (profile?.followers?.length || 0))}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => !isBlocked && router.push({ pathname: '/follow-connections', params: { tab: 'following', userId: profile?.id } })}
            disabled={isBlocked}
          >
            <Text style={styles.statValue}>{isBlocked ? '0' : (profile?.following_count ?? (profile?.following?.length || 0))}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profile?.name || 'User'}</Text>
          {profile?.is_verified && (
            <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6B00" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text style={styles.slId}>@{profile?.sl_id || ''}</Text>
        {profile?.bio && !isBlocked ? (
          <Text style={styles.bioText}>{profile.bio}</Text>
        ) : null}

        {profile?.home_location && !isBlocked && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {profile.home_location.city}, {profile.home_location.state}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        {profile?.id === currentUserId ? (
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : isBlocked ? (
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleBlockUser}
          >
            <Text style={styles.editProfileText}>Unblock</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={openPrivateChat}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Simple Grid Divider */}
      <View style={styles.gridDivider} />
    </View>
  );

  if (!profileUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Invalid profile selected.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !profile && !error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerWrap]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Custom Header Bar */}
        <View style={[styles.navBar, { backgroundColor: '#FFF', paddingTop: insets.top, height: 50 + insets.top, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DBDBDB' }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.navIcon}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={[styles.centerWrap, { paddingHorizontal: 32 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { marginBottom: 8, fontSize: 20 }]}>Profile Not Found</Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
          <TouchableOpacity
            style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: COLORS.primary }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const commentModalContent = (
    <KeyboardAvoidingView
      style={styles.commentModalOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <TouchableOpacity
        style={styles.modalBackgroundDismiss}
        activeOpacity={1}
        onPress={() => {
          setCommentModalVisible(false);
          setReplyingToComment(null);
        }}
      />
      <View style={[styles.commentModalSheet, { paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12)) : (insets.bottom + 10) }]}>
        <View style={styles.bottomSheetHandle} />
        <View style={styles.commentModalHeader}>
          <Text style={styles.commentModalTitle}>Comments ({selectedCommentPost?.comments_count ?? postComments.length ?? 0})</Text>
          <TouchableOpacity onPress={() => { setCommentModalVisible(false); setReplyingToComment(null); }} style={styles.commentCloseBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.commentList}>
          {commentsLoading ? (
            <View style={styles.commentLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : postComments.length === 0 ? (
            <View style={styles.emptyCommentsContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#DDD" />
              <Text style={styles.commentEmptyText}>No comments yet. Be the first to comment!</Text>
            </View>
          ) : (() => {
            const parentComments = postComments.filter(c => {
              const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
              const isBlockedUser = uid && blockedUserIds.includes(String(uid));
              return !c.parent_id && !isBlockedUser;
            });
            const repliesMap = postComments.reduce((acc, c) => {
              const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
              const isBlockedUser = uid && blockedUserIds.includes(String(uid));
              if (c.parent_id && !isBlockedUser) {
                if (!acc[c.parent_id]) acc[c.parent_id] = [];
                acc[c.parent_id].push(c);
              }
              return acc;
            }, {} as Record<string, any[]>);

            return (
              <FlatList
                data={parentComments}
                keyExtractor={(item, index) => item.id ? `comment-${item.id}` : `comment-${index}`}
                renderItem={({ item }) => {
                  const canDelete = item.user_id === user?.id || selectedCommentPost?.user_id === user?.id;
                  const replies = repliesMap[item.id] || [];
                  return (
                    <View style={{ marginBottom: 12 }}>
                      <View style={styles.commentItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={styles.commentItemHeader}>
                            <Avatar photo={item.user_photo} name={item.username || 'User'} size={24} />
                            <Text style={styles.commentItemUser}>{item?.username || 'User'}</Text>
                          </View>
                          {canDelete ? (
                            <TouchableOpacity
                              style={{ padding: 4, marginRight: -4 }}
                              onPress={() => handleDeleteComment(item)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={{ padding: 4, marginRight: -4 }}
                              onPress={() => handleCommentMenuPress(item)}
                            >
                              <Ionicons name="ellipsis-horizontal" size={16} color={COLORS.textLight} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <MentionText style={styles.commentItemText} text={item?.text || ''} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 32 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setReplyingToComment(item);
                              setCommentText(`@${item.username || 'User'} `);
                            }}
                          >
                            <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Render replies */}
                      {replies.length > 0 && (
                        <View style={{
                          marginLeft: 32,
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
                                  top: 10,
                                  width: 12,
                                  height: 1.5,
                                  backgroundColor: '#E6E1E8',
                                }} />

                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={styles.commentItemHeader}>
                                      <Avatar photo={reply.user_photo} name={reply.username || 'User'} size={20} />
                                      <Text style={[styles.commentItemUser, { fontSize: 13 }]}>{reply?.username || 'User'}</Text>
                                    </View>
                                    {canDeleteReply ? (
                                      <TouchableOpacity
                                        style={{ padding: 4, marginRight: -4 }}
                                        onPress={() => handleDeleteComment(reply)}
                                      >
                                        <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                      </TouchableOpacity>
                                    ) : (
                                      <TouchableOpacity
                                        style={{ padding: 4, marginRight: -4 }}
                                        onPress={() => handleCommentMenuPress(reply)}
                                      >
                                        <Ionicons name="ellipsis-horizontal" size={14} color={COLORS.textLight} />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  <MentionText style={[styles.commentItemText, { fontSize: 13 }]} text={reply?.text || ''} />
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 26 }}>
                                    <TouchableOpacity
                                      onPress={() => {
                                        setReplyingToComment(item);
                                        setCommentText(`@${reply.username} `);
                                      }}
                                    >
                                      <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>Reply</Text>
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
                showsVerticalScrollIndicator={false}
              />
            );
          })()}
        </View>

        {replyingToComment && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: COLORS.background,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.divider,
            marginBottom: 8,
            width: '100%',
          }}>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Replying to <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>@{replyingToComment.username}</Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyingToComment(null)}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.commentInputRow}>
          <MentionInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Add a comment..."}
            placeholderTextColor={COLORS.textSecondary}
            inputStyle={styles.commentTextInput}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            style={[styles.commentSubmitBtn, (!commentText.trim() || commentSubmitting) && { opacity: 0.5 }]}
            disabled={!commentText.trim() || commentSubmitting}
          >
            <Text style={styles.commentSubmitText}>{commentSubmitting ? '...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
        {Platform.OS === 'android' && (
          <ReportModal
            visible={reportCommentModalVisible}
            onClose={() => {
              setReportCommentModalVisible(false);
              setPendingReportComment(null);
            }}
            reporterUid={currentUserId || ''}
            reportedUserUid={pendingReportComment?.userId || pendingReportComment?.user_id || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
            contentId={String(pendingReportComment?.id || '')}
            contentType="comment"
            postId={pendingReportComment?.post_id || selectedCommentPost?.id || ''}
            apiFallback={async (reason, description) => {
              if (pendingReportComment?.id) {
                const { reportComment } = require('../../src/services/api');
                await reportComment(String(pendingReportComment.id), reason, description || '');
              }
            }}
            onSuccess={() => {
              // Keep reported comment visible
              if (pendingReportComment) {
                setKeptComments(prev => {
                  if (prev.some(c => c.id === pendingReportComment.id)) return prev;
                  return [...prev, pendingReportComment];
                });
              }
            }}
          />
        )}
        {Platform.OS === 'android' && (
          <CommentOptionsModal
            visible={commentOptionsModalVisible}
            onClose={() => setCommentOptionsModalVisible(false)}
            options={commentOptions}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom Header Bar */}
      <View style={[styles.navBar, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#FFF', paddingTop: insets.top, height: 50 + insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIcon}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Animated.Text style={[styles.navTitle, { opacity: headerTitleOpacity }]}>
          {profile?.sl_id || 'Profile'}
        </Animated.Text>
        <TouchableOpacity style={styles.navIcon} onPress={() => setUserMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={isBlocked ? [] : posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => {
          if (!item || !item.id) {
            console.warn('[Profile keyExtractor] Post missing valid ID:', item);
            return `profile-post-idx-${index}`;
          }
          return `profile-post-${item.id}`;
        }}
        numColumns={3}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + 60 }}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          postsLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.textLight} />
            </View>
          ) : !hasMore && posts.length > 0 && !isBlocked ? (
            <View style={styles.endOfFeed}>
              <Text style={styles.endOfFeedText}>{"you have reached end"}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isBlocked ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { borderColor: COLORS.error }]}>
                <Ionicons name="ban-outline" size={40} color={COLORS.error} />
              </View>
              <Text style={styles.emptyTitle}>Blocked</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                You have blocked this user or they have blocked you. Unblock to view posts and interact.
              </Text>
            </View>
          ) : !loading && !postsLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="camera-outline" size={40} color={COLORS.text} />
              </View>
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
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
          <Image source={{ uri: profile?.photo }} style={styles.fullImage} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>

      {/* Post Detail Modal / View */}
      {(Platform.OS as string) === 'ios' ? (
        <Modal
          visible={postModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setPostModalVisible(false)}
        >
          <View style={styles.postDetailContainer}>
            <View style={[styles.postDetailHeader, { paddingTop: insets.top, height: 50 + insets.top }]}>
              <TouchableOpacity onPress={() => setPostModalVisible(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.postDetailTitle}>Posts</Text>
            </View>
            <FlatList
              ref={detailFlatListRef}
              data={selectedPost ? posts.slice(Math.max(0, posts.findIndex(p => p.id === selectedPost.id))) : posts}
              contentContainerStyle={{
                paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 24) + 120 : Math.max(insets.bottom, 40) + 60
              }}
              renderItem={({ item }) => (
                <PostFeedCard
                  post={item}
                  isActive={postModalVisible && viewablePostId === item.id}
                  onLike={handleLikePost}
                  onComment={handleOpenComment}
                  onShare={handleSharePost}
                  onRepost={handleRepost}
                  openCommentsOnCaptionPress
                  onUserPress={() => setPostModalVisible(false)}
                  postMenuType={profile?.id === currentUserId ? 'delete' : 'report'}
                  onPostMenuPress={handlePostMenuPress}
                  theme="dark"
                  isBlackBackground
                />
              )}
              keyExtractor={(item, index) => item && item.id ? String(item.id) : `detail-idx-${index}`}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              windowSize={3}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              removeClippedSubviews={(Platform.OS as string) === 'android'}
            />
            <DeleteConfirmationModal
              visible={deleteConfirmVisible}
              onClose={() => {
                setDeleteConfirmVisible(false);
                setPostToDelete(null);
              }}
              onConfirm={onConfirmDelete}
            />
          </View>
        </Modal>
      ) : (
        postModalVisible && (
          <View style={[styles.postDetailContainer, styles.androidPostDetailContainer]}>
            <View style={[styles.postDetailHeader, { paddingTop: insets.top, height: 50 + insets.top }]}>
              <TouchableOpacity onPress={() => setPostModalVisible(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.postDetailTitle}>Posts</Text>
            </View>
            <FlatList
              ref={detailFlatListRef}
              data={selectedPost ? posts.slice(Math.max(0, posts.findIndex(p => p.id === selectedPost.id))) : posts}
              contentContainerStyle={{
                paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 24) + 120 : Math.max(insets.bottom, 40) + 60
              }}
              renderItem={({ item }) => (
                <PostFeedCard
                  post={item}
                  isActive={postModalVisible && viewablePostId === item.id}
                  onLike={handleLikePost}
                  onComment={handleOpenComment}
                  onShare={handleSharePost}
                  onRepost={handleRepost}
                  openCommentsOnCaptionPress
                  onUserPress={() => setPostModalVisible(false)}
                  postMenuType={profile?.id === currentUserId ? 'delete' : 'report'}
                  onPostMenuPress={handlePostMenuPress}
                  theme="dark"
                  isBlackBackground
                />
              )}
              keyExtractor={(item, index) => item && item.id ? String(item.id) : `detail-idx-${index}`}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              windowSize={3}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              removeClippedSubviews={(Platform.OS as string) === 'android'}
            />
            <DeleteConfirmationModal
              visible={deleteConfirmVisible}
              onClose={() => {
                setDeleteConfirmVisible(false);
                setPostToDelete(null);
              }}
              onConfirm={onConfirmDelete}
            />
          </View>
        )
      )}

      {/* Comments Modal (Rendered outside, as native Modal on both platforms) */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setReplyingToComment(null);
        }}
      >
        {commentModalContent}
      </Modal>

      {/* Apple Guideline 1.2 - Report Comment Modal (Rendered outside, as native Modal on both platforms) */}
      {Platform.OS !== 'android' && (
        <ReportModal
          visible={reportCommentModalVisible}
          onClose={() => {
            setReportCommentModalVisible(false);
            setPendingReportComment(null);
            if (commentModalToRestore) {
              setTimeout(() => {
                setCommentModalVisible(true);
                setCommentModalToRestore(false);
              }, 300);
            }
          }}
          reporterUid={currentUserId || ''}
          reportedUserUid={pendingReportComment?.userId || pendingReportComment?.user_id || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
          contentId={String(pendingReportComment?.id || '')}
          contentType="comment"
          postId={pendingReportComment?.post_id || selectedCommentPost?.id || ''}
          apiFallback={async (reason, description) => {
            if (pendingReportComment?.id) {
              const { reportComment } = require('../../src/services/api');
              await reportComment(String(pendingReportComment.id), reason, description || '');
            }
          }}
          onSuccess={() => {
            // Keep reported comment visible
          }}
        />
      )}

      {/* Apple Guideline 1.2 - Report Post Modal (Rendered outside, as native Modal on both platforms) */}
      <ReportModal
        visible={reportPostModalVisible}
        onClose={() => {
          setReportPostModalVisible(false);
          setPendingReportPost(null);
        }}
        reporterUid={currentUserId || ''}
        reportedUserUid={pendingReportPost?.user_id || pendingReportPost?.userId || pendingReportPost?.user?.id || profile?.id || ''}
        contentId={pendingReportPost?.id || ''}
        contentType="post"
        apiFallback={async (reason) => {
          if (pendingReportPost?.id) {
            await reportPost(pendingReportPost.id, reason, `Reported from profile posts: ${reason}`);
          }
        }}
        onSuccess={() => {
          // Keep it visible as per user's requirement: "remain it visible"
        }}
      />

      {/* User Options Modal */}
      <Modal
        visible={userMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserMenuVisible(false)}
      >
        <View style={styles.userMenuOverlay}>
          <TouchableOpacity
            style={styles.userMenuBackground}
            activeOpacity={1}
            onPress={() => setUserMenuVisible(false)}
          />
          <View style={[styles.userMenuSheet, { paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.userMenuHandle} />

            <TouchableOpacity style={styles.userMenuItem} onPress={handleShareProfile}>
              <Ionicons name="share-social-outline" size={22} color={COLORS.text} />
              <Text style={styles.userMenuText}>Share this profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.userMenuItem} onPress={handleReportUser}>
              <Ionicons name="flag-outline" size={22} color={COLORS.error} />
              <Text style={[styles.userMenuText, { color: COLORS.error }]}>Report User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.userMenuItem} onPress={handleBlockUser}>
              <Ionicons name="ban-outline" size={22} color={COLORS.error} />
              <Text style={[styles.userMenuText, { color: COLORS.error }]}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userMenuItem, { borderBottomWidth: 0, marginTop: 10 }]}
              onPress={() => setUserMenuVisible(false)}
            >
              <Text style={[styles.userMenuText, { textAlign: 'center', width: '100%', color: '#666' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SharePostModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        post={selectedSharePost}
        onShareExternal={handleShareExternal}
      />

      {/* Apple Guideline 1.2 - Report User Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reporterUid={currentUserId || ''}
        reportedUserUid={profileUserId || ''}
        contentId={profileUserId || ''}
        contentType="user"
      />



      {blockConfirmData && (
        <BlockConfirmationModal
          visible={blockConfirmVisible}
          onClose={() => setBlockConfirmVisible(false)}
          onConfirm={blockConfirmData.onConfirm}
          username={blockConfirmData.username}
          isBlocked={blockConfirmData.isBlocked}
        />
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  navIcon: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerContent: {
    paddingBottom: 4,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  followingIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.success,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  bioSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  slId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#00376b',
    marginLeft: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  followButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#0095f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#efefef',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: COLORS.text,
  },
  messageButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#efefef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  editProfileButton: {
    flex: 1,
    height: 34,
    backgroundColor: '#efefef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  gridDivider: {
    height: 1,
    backgroundColor: '#DBDBDB',
    marginTop: 8,
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.2, // Slightly taller for more visual impact
    padding: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-end',
    padding: 6,
  },
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  viewCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#efefef',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#efefef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  postDetailContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  androidPostDetailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
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
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentModalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '80%', // Fixed height to prevent collapse
  },
  commentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  modalBackgroundDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  emptyCommentsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  commentCloseBtn: {
    padding: 8,
  },
  commentList: {
    flex: 1,
    marginBottom: 12,
  },
  commentLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  commentEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentItemUser: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  commentItemText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 100,
    backgroundColor: '#FFF', // Ensure visibility
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: '#F9F9F9',
  },
  commentSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    padding: 4,
  },
  userMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  userMenuBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  userMenuSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  userMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  userMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 15,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
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

export default UserProfileScreen;
