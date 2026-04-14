import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile, followUser, unfollowUser, getUserPosts, deletePost, reportPost } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import PostFeedCard from '../../src/components/PostFeedCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const profileUserId = params?.id;
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [postModalVisible, setPostModalVisible] = useState(false);

    const openPostModal = (post: any) => {
    if (!post?.id) return;
    router.push(`/post/${post.id}`);
  };
  const loadUserPosts = useCallback(async (withLoading: boolean = true) => {
    if (!profileUserId) {
      return;
    }

    if (withLoading) {
      setPostsLoading(true);
    }

    try {
      const response = await getUserPosts(profileUserId, 30, 0);
      const payload = response.data;
      const items = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);
      setPosts(items);
    } catch (error) {
      console.warn('Failed to load user posts:', error);
      setPosts([]);
    } finally {
      if (withLoading) {
        setPostsLoading(false);
      }
    }
  }, [profileUserId]);
  const loadProfile = useCallback(async (withLoading: boolean = true) => {
    if (!profileUserId) {
      return;
    }

    if (withLoading) {
      setLoading(true);
    }

    try {
      const response = await getUserProfile(profileUserId);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load user profile', error);
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  }, [profileUserId]);

  useEffect(() => {
    loadProfile(true);
    loadUserPosts(true);
  }, [loadProfile, loadUserPosts]);

  const isFollowing = Boolean(profile?.followers?.includes(currentUserId));

  const toggleFollow = async () => {
    if (!profile?.id) return;

    const currentFollowers = Array.isArray(profile.followers) ? profile.followers : [];
    const nextFollowers = isFollowing
      ? currentFollowers.filter((id: string) => id !== currentUserId)
      : [...currentFollowers, currentUserId];

    setProfile({
      ...profile,
      followers: nextFollowers,
    });

    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
      } else {
        await followUser(profile.id);
      }
      await loadProfile(false);
    } catch (error) {
      console.warn('Failed to follow/unfollow user:', error);
      await loadProfile(false);
    }
  };

  const openPrivateChat = () => {
    if (!profile?.id || profile?.id === currentUserId) return;
    const userName = encodeURIComponent(profile.name || '');
    const userSL = encodeURIComponent(profile.sl_id || '');
    router.push(`/dm/new?userId=${profile.id}&userName=${userName}&userSL=${userSL}`);
  };

  const handleDeletePost = async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    const deletedPost = post;
    setPosts((prev) => prev.filter((item) => item.id !== postId));

    try {
      await deletePost(postId);
    } catch (error) {
      console.warn('Failed to delete post:', error);
      setPosts((prev) => (prev.some((item) => item.id === postId) ? prev : [deletedPost, ...prev]));
      alert('Could not delete post. Please try again.');
    }
  };

  const handleReportPost = async (post: any) => {
    const postId = post?.id;
    if (!postId) {
      return;
    }

    try {
      await reportPost(postId, 'other', 'Reported from post menu');
      alert('Report submitted. Admin will review this post.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (detail) {
        alert(String(detail));
        return;
      }
      console.warn('Failed to report post:', error);
      alert('Could not submit report. Please try again.');
    }
  };

  const handlePostMenuPress = (post: any) => {
    if (!post?.id) {
      return;
    }

    const isOwnPost = post?.user_id === currentUserId;

    if (isOwnPost) {
      handleDeletePost(post);
      return;
    }

    handleReportPost(post);
  };

  if (!profileUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>Invalid profile selected.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              try {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.navigate('/feed');
                }
              } catch (error) {
                router.replace('/feed');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.avatarSection}>
              {profile?.photo ? (
                <TouchableOpacity onPress={() => setAvatarModalVisible(true)} activeOpacity={0.8}>
                  <Image source={{ uri: profile.photo }} style={styles.avatar} />
                </TouchableOpacity>
              ) : (
                <Avatar name={profile?.name || 'User'} size={96} />
              )}
              <View style={styles.infoSection}>
                <Text style={styles.userName}>{profile?.name || 'User'}</Text>
                <Text style={styles.userId}>{profile?.sl_id || ''}</Text>
                <Text style={styles.followStateText}>{isFollowing ? 'You are following this user' : 'You are not following this user'}</Text>
                {profile?.id === currentUserId && profile?.home_location && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.locationText}>
                      {profile.home_location.area}, {profile.home_location.city}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {profile?.id !== currentUserId && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={toggleFollow}
                >
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton} onPress={openPrivateChat}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.background} />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'followers', userId: profile?.id } })}
              >
                <Text style={styles.statValue}>{profile?.followers?.length || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/follow-connections', params: { tab: 'following', userId: profile?.id } })}
              >
                <Text style={styles.statValue}>{profile?.following?.length || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.contentSection}>
              <Text style={styles.contentTitle}>Feed</Text>
              {postsLoading ? (
                <View style={styles.postsLoaderWrap}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : posts.length > 0 ? (
                <View style={styles.gridList}>
                  {Array.from({ length: Math.ceil(posts.length / 3) }).map((_, rowIndex) => {
                    const rowItems = posts.slice(rowIndex * 3, rowIndex * 3 + 3);
                    return (
                      <View key={`row-${rowIndex}`} style={styles.gridRow}>
                        {rowItems.map((item, colIndex) => {
                          const isVideo = (item.media_url || '').match(/\.(mp4|mov|avi)$/i) || (item.media_type === 'video');
                          const displayUrl = item.thumbnail_url || item.image_url || (!isVideo ? item.media_url : null);
                          
                          return (
                            <TouchableOpacity
                              key={item.id || String(rowIndex * 3 + colIndex)}
                              style={styles.gridItem}
                              activeOpacity={0.8}
                              onPress={() => openPostModal(item)}
                            >
                              {displayUrl ? (
                                <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
                                  <Image
                                    source={{ uri: displayUrl }}
                                    style={styles.gridImage}
                                    resizeMode="cover"
                                  />
                                  {isVideo && (
                                    <View style={styles.videoIndicator}>
                                      <Ionicons name="play-circle" size={24} color="#FFF" />
                                    </View>
                                  )}
                                </View>
                              ) : isVideo && item.media_url ? (
                                <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
                                  <Video
                                    source={{ uri: item.media_url }}
                                    style={styles.gridImage}
                                    resizeMode={ResizeMode.COVER}
                                    shouldPlay={false}
                                    isMuted={true}
                                    positionMillis={0}
                                  />
                                  <View style={styles.videoIndicator}>
                                    <Ionicons name="play-circle" size={24} color="#FFF" />
                                  </View>
                                </View>
                              ) : isVideo ? (
                                <View style={styles.gridPlaceholder}>
                                  <Ionicons name="videocam" size={32} color={COLORS.textSecondary} />
                                  <View style={styles.videoIndicator}>
                                    <Ionicons name="play-circle" size={24} color="#FFF" />
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.gridPlaceholder}>
                                  <Ionicons name="image-outline" size={24} color={COLORS.textSecondary} />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                        {rowItems.length < 3 &&
                          Array.from({ length: 3 - rowItems.length }).map((_, idx) => (
                            <View key={`empty-${rowIndex}-${idx}`} style={[styles.gridItem, styles.gridEmpty]} />
                          ))}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>No posts yet.</Text>
              )}
            </View>
          </View>
        )}

        <Modal
          visible={avatarModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.avatarModalOverlay}
            onPress={() => setAvatarModalVisible(false)}
          >
            <View style={styles.avatarModalContent}>
              <Image
                source={{ uri: profile?.photo || '' }}
                style={styles.avatarModalImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={postModalVisible}
          animationType="slide"
          onRequestClose={() => setPostModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingTop: 50, 
              paddingBottom: SPACING.md, 
              paddingHorizontal: SPACING.md,
              borderBottomWidth: 1, 
              borderColor: COLORS.border,
              backgroundColor: COLORS.surface
            }}>
              <TouchableOpacity onPress={() => setPostModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginLeft: SPACING.md }}>
                Post
              </Text>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {selectedPost && (
                <PostFeedCard
                  post={selectedPost}
                  isActive={postModalVisible}
                  onLike={() => {}}
                  onComment={() => {}}
                  onShare={() => {}}
                  onRepost={() => {}}
                  onEdit={() => {}}
                  onUserPress={(postUser) => {
                    setPostModalVisible(false);
                    if (postUser?.id && postUser?.id !== profileUserId) {
                      router.push(`/profile/${postUser.id}`);
                    }
                  }}
                />
              )}
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  loadingWrap: {
    flex: 1,
    minHeight: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  avatarModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  userId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  followStateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  locationText: {
    marginLeft: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  followButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  followingButtonText: {
    color: COLORS.primary,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondary,
  },
  messageButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    marginLeft: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.md,
  },
  contentSection: {
    paddingBottom: SPACING.xl,
  },
  postsLoaderWrap: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  gridList: {
    paddingBottom: SPACING.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  gridItem: {
    width: (Dimensions.get('window').width - SPACING.md * 2 - SPACING.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
});
