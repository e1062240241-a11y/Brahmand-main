import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Image, Alert, Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { getConversations, sendDirectMessage } from '../services/api';
import { Avatar } from './Avatar';

export default function SharePostModal({ visible, onClose, post, onShareExternal, onCopyLink }: any) {
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

  const getPostLink = () => {
    const postId = post?.id || post?.post_id || post?._id;
    return postId ? `https://brahmand.app/post/${postId}` : 'https://brahmand.app';
  };

  const getShareText = () => {
    const caption = post?.caption || post?.description || '';
    const username = post?.username || post?.user?.name || 'Someone';
    const text = caption ? `${caption}` : 'Check this post on Brahmand!';
    return `${text}\n\n${getPostLink()}`;
  };

  const handleShareWhatsApp = async () => {
    const message = getShareText();
    const mediaUrl = post?.media_url || post?.mediaUrl || '';

    try {
      if (mediaUrl) {
        const ext = String(mediaUrl).match(/\.(mp4|mov|jpg|png|jpeg|webm)/i)?.[1] || 'mp4';
        const localUri = `${FileSystem.cacheDirectory}whatsapp_share_${Date.now()}.${ext}`;
        const download = await FileSystem.downloadAsync(mediaUrl, localUri);
        
        if (download?.uri) {
          if (Platform.OS === 'ios') {
            await Share.share({
              message,
              url: download.uri,
              title: 'Share on Brahmand',
            });
          } else {
            // On Android, explicitly copy the caption since we can't reliably pass both video and text to WhatsApp directly without custom native code.
            await Clipboard.setStringAsync(message);
            Alert.alert("Link Copied!", "The link has been copied to your clipboard. You can paste it into your WhatsApp Status!");
            
            const UTI = ext === 'mp4' ? 'public.mpeg-4' : 'public.jpeg';
            await Sharing.shareAsync(download.uri, {
              mimeType: ext === 'mp4' ? 'video/mp4' : 'image/jpeg',
              dialogTitle: 'Share to WhatsApp',
              UTI: UTI,
            });
          }
          onClose();
          return;
        }
      }
      
      const encoded = encodeURIComponent(message);
      const url = `whatsapp://send?text=${encoded}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
      }
      onClose();
    } catch (e) {
      const msg = String(e?.message || e || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss') || msg.includes('aborted')) return;
      Alert.alert('Error', 'Could not open WhatsApp. Make sure WhatsApp is installed.');
    }
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
            <TouchableOpacity style={styles.actionBtn} onPress={handleShareWhatsApp}>
              <View style={[styles.actionIconBg, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={onCopyLink}>
              <View style={styles.actionIconBg}>
                <Ionicons name="link-outline" size={24} color={COLORS.text} />
              </View>
              <Text style={styles.actionLabel}>Copy link</Text>
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