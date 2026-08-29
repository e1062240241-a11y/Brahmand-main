import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { Avatar } from '../Avatar';
import { MentionInput } from '../MentionInput';
import { ToastContainer } from '../ToastContainer';
import { ReportModal } from '../ReportModal';

export interface CommentModalProps {
  visible: boolean;
  postId: string | null;
  postType?: 'discussion' | 'community';
  comments: any[];
  commentsLoading?: boolean;
  commentText: string;
  user: any;
  onClose: () => void;
  onCommentTextChange: (text: string) => void;
  onSubmitComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onReportComment: (comment: any) => void;

  // Additional props required for exact UI/behavior match:
  t: (key: string) => string;
  insets: { top: number; bottom: number; left: number; right: number };
  keyboardVisible: boolean;
  keyboardHeight: number;
  blockedUserSet?: Set<string>;
  reportCommentModalVisible?: boolean;
  onCloseReportCommentModal?: () => void;
  pendingReportComment?: any;
  reportCommentApiFallback?: (reason: string, description?: string) => Promise<void>;
  onReportCommentSuccess?: () => void;
  totalCommentsCount?: number;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  postId,
  postType = 'discussion',
  comments,
  commentsLoading = false,
  commentText,
  user,
  onClose,
  onCommentTextChange,
  onSubmitComment,
  onDeleteComment,
  onReportComment,
  t,
  insets,
  keyboardVisible,
  keyboardHeight,
  blockedUserSet = new Set(),
  reportCommentModalVisible = false,
  onCloseReportCommentModal,
  pendingReportComment,
  reportCommentApiFallback,
  onReportCommentSuccess,
  totalCommentsCount,
}) => {
  const displayCommentCount = totalCommentsCount ?? comments.length ?? 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.modalOverlay}
      >
        <ToastContainer />
        <View
          style={[
            styles.commentModalContent,
            {
              paddingBottom:
                Platform.OS === 'android'
                  ? keyboardVisible
                    ? 8
                    : Math.max(insets.bottom, 12)
                  : keyboardVisible
                  ? 10
                  : Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.commentModalHeader}>
            <Text style={styles.commentModalTitle}>
              {t('language') === 'hi'
                ? `टिप्पणियाँ (${displayCommentCount})`
                : `Comments (${displayCommentCount})`}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            style={styles.commentsList}
            keyboardShouldPersistTaps="handled"
          >
            {(() => {
              const filteredComments = comments.filter((comment) => {
                const uid =
                  comment.userId ||
                  comment.user_id ||
                  comment.sender_id ||
                  comment.user?.id;
                return !uid || !blockedUserSet.has(String(uid));
              });

              return filteredComments.length > 0 ? (
                filteredComments.map((comment, index, filteredArray) => (
                  <View
                    key={comment.id}
                    style={{
                      flexDirection: 'row',
                      marginBottom: 20,
                      position: 'relative',
                    }}
                  >
                    {/* Thread connector line for replies */}
                    {index < filteredArray.length - 1 && (
                      <View
                        style={{
                          position: 'absolute',
                          left: 16,
                          top: 36,
                          bottom: -20,
                          width: 2,
                          backgroundColor: '#CFD9DE',
                          zIndex: -1,
                        }}
                      />
                    )}
                    <View style={{ marginRight: 12 }}>
                      <Avatar
                        name={comment.userName}
                        photo={comment.avatar}
                        size={32}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#F7F9F9',
                        padding: 12,
                        borderRadius: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: '700',
                              fontSize: 14,
                              color: '#0F1419',
                            }}
                            numberOfLines={1}
                          >
                            {comment.userName}
                          </Text>
                          {comment.isVerified && (
                            <MaterialCommunityIcons
                              name="check-decagram"
                              size={14}
                              color="#FF6B00"
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                        {comment.userId === user?.id ? (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => onDeleteComment(comment.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#FF3B30"
                            />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => onReportComment(comment)}
                          >
                            <Ionicons
                              name="ellipsis-horizontal"
                              size={16}
                              color="#536471"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text
                        selectable={true}
                        style={{
                          fontSize: 14,
                          color: '#536471',
                          marginTop: 4,
                          lineHeight: 18,
                        }}
                      >
                        {comment.text}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={40} color="#CCC" />
                  <Text style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
                    {t('language') === 'hi'
                      ? 'अभी तक कोई टिप्पणी नहीं है। टिप्पणी करने वाले पहले व्यक्ति बनें!'
                      : 'No comments yet. Be the first to comment!'}
                  </Text>
                </View>
              );
            })()}
          </KeyboardAwareScrollView>

          <View style={styles.commentInputRow}>
            <Avatar name={user?.name || '?'} photo={user?.photo} size={32} />
            <MentionInput
              value={commentText}
              onChangeText={onCommentTextChange}
              placeholder={
                t('language') === 'hi' ? 'एक टिप्पणी जोड़ें...' : 'Add a comment...'
              }
              placeholderTextColor="#888"
              multiline
              inputStyle={styles.commentInput}
            />
            <TouchableOpacity
              onPress={onSubmitComment}
              disabled={!commentText.trim()}
            >
              <Text
                style={[
                  styles.postCommentBtn,
                  !commentText.trim() && { opacity: 0.5 },
                ]}
              >
                {t('language') === 'hi' ? 'पोस्ट' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'android' && (
            <View
              style={{
                height: keyboardVisible
                  ? keyboardHeight + insets.bottom + 8
                  : 0,
              }}
            />
          )}
          {Platform.OS === 'android' && (
            <ReportModal
              visible={reportCommentModalVisible}
              onClose={
                onCloseReportCommentModal ||
                (() => {
                  /* fallback no-op */
                })
              }
              reporterUid={user?.id || ''}
              reportedUserUid={
                pendingReportComment?.userId ||
                pendingReportComment?.user_id ||
                pendingReportComment?.sender_id ||
                pendingReportComment?.user?.id ||
                ''
              }
              contentId={String(pendingReportComment?.id || '')}
              contentType="comment"
              postId={postId || ''}
              apiFallback={reportCommentApiFallback}
              onSuccess={onReportCommentSuccess}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    padding: 20,
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentModalTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  commentsList: { flex: 1 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 38,
    maxHeight: 100,
  },
  postCommentBtn: { color: '#FF3B30', fontWeight: '800', fontSize: 14 },
});

export default CommentModal;
