import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { getConversations, sendDirectMessage } from '../services/api';
import { Avatar } from './Avatar';

export default function SharePostModal({ visible, onClose, post, onShareExternal, onCopyLink, onDownload }: any) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingTo, setSharingTo] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadConversations();
    }
  }, [visible]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await getConversations();
      setConversations(res.data || []);
    } catch (e) {
      console.warn('Failed to load conversations', e);
    } finally {
      setLoading(false);
    }
  };

  const getConversationKey = (conversation: any, index: number) => conversation.id || conversation.user?.sl_id || String(index);

  const getUploaderName = (post: any) => {
    return (
      post.user?.name ||
      post.user?.display_name ||
      post.user?.full_name ||
      post.user?.displayName ||
      post.user?.username ||
      post.user?.author_name ||
      post.user?.author ||
      post.user?.posted_by ||
      post.user?.creator_name ||
      post.user_name ||
      post.username ||
      post.name ||
      post.author_name ||
      post.author ||
      post.posted_by ||
      post.creator_name ||
      undefined
    );
  };

  const getUploaderPhoto = (post: any) => {
    const value = (
      post.user?.photo ||
      post.user?.photo_url ||
      post.user?.avatar ||
      post.user?.image ||
      post.user?.profile_image ||
      post.user_photo ||
      post.user_image ||
      post.avatar ||
      post.image ||
      ''
    );
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('data:')) return '';
    if (value.length > 500) return '';
    return value;
  };

  const handleSendToUser = async (conversation: any, index: number) => {
    if (!post || !conversation?.user?.sl_id) return;
    const conversationKey = getConversationKey(conversation, index);
    setSharingTo(conversationKey);
    try {
      const uploaderName = getUploaderName(post);
      const uploaderPhoto = getUploaderPhoto(post);
      const payloadData: any = {
        postId: post.id || post.post_id || post._id || post.uid,
        mediaUrl: post.media_url || post.mediaUrl || post.image || post.image_url || '',
        caption: String(post.caption || post.description || post.text || '').slice(0, 1200),
        title: String(post.title || post.caption || post.description || 'Shared post').slice(0, 200),
      };
      if (uploaderName) payloadData.uploaderName = uploaderName;
      if (uploaderPhoto) payloadData.uploaderPhoto = uploaderPhoto;

      await sendDirectMessage(conversation.user.sl_id, JSON.stringify(payloadData), 'post_share');
      alert(`Sent to ${conversation.user.name}`);
      onClose();
    } catch (e) {
      console.warn('Failed to share post in DM', e);
      alert('Failed to send.');
    } finally {
      setSharingTo(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>Share</Text>

          {/* Users List */}
          <View style={styles.usersSection}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={conversations}
                keyExtractor={(item, index) => getConversationKey(item, index)}
                renderItem={({ item, index }) => {
                  const itemKey = getConversationKey(item, index);
                  return (
                    <TouchableOpacity style={styles.userCard} onPress={() => handleSendToUser(item, index)}>
                      <Avatar photo={item.user?.photo} size={60} name={item.user?.name} />
                      <Text style={styles.userName} numberOfLines={1}>{item.user?.name}</Text>
                      {sharingTo === itemKey && (
                        <View style={styles.sharingOverlay}>
                          <ActivityIndicator color="#fff" size="small" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>No recent chats</Text>}
                contentContainerStyle={{ paddingHorizontal: SPACING.md }}
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionBtn} onPress={onCopyLink}>
              <View style={styles.actionIconBg}>
                <Ionicons name="link-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.actionLabel}>Copy link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={onDownload}>
              <View style={styles.actionIconBg}>
                <Ionicons name="download-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.actionLabel}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={onShareExternal}>
              <View style={styles.actionIconBg}>
                <Ionicons name="share-social-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.actionLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  usersSection: {
    height: 120,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
    position: 'relative',
  },
  userName: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 5,
    textAlign: 'center',
  },
  sharingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    marginTop: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.text,
  }
});