import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Platform } from 'react-native';
import { useCommunityActions } from '../hooks/useCommunityActions';
import { useCommunityUIStore } from '../hooks/useCommunityUIStore';
import { ReportModal } from '@/src/components/ReportModal';
import { useCommunityStore } from '../store/useCommunityStore';
import { useAuthStore } from '@/src/store/authStore';

export const CommunityModals = ({ communityId }: { communityId: string }) => {
  const {
    reportPostId,
    deleteConfirmPostId,
    activeActionSheetPostId,
    closeReportModal,
    closeDeleteConfirm,
    closeActionSheet
  } = useCommunityUIStore();

  const actions = useCommunityActions(communityId);
  const posts = useCommunityStore(state => state.posts);
  const user = useAuthStore(state => state.user);

  const isReportVisible = !!reportPostId;
  const handleReportSubmit = (reason: string) => {
     if (reportPostId) {
        actions.handleReportPost(reportPostId, reason);
        closeReportModal();
     }
  };

  const activePost = activeActionSheetPostId ? posts[activeActionSheetPostId] : null;
  const isMe = activePost && user && activePost.sender_id === (user.id || user._id);

  const handleActionSheetOption = (option: string) => {
      if (!activeActionSheetPostId) return;
      closeActionSheet();

      if (option === 'share') {
         actions.handleSharePost(activeActionSheetPostId);
      } else if (option === 'report') {
         useCommunityUIStore.getState().openReportModal(activeActionSheetPostId);
      } else if (option === 'delete') {
         useCommunityUIStore.getState().openDeleteConfirm(activeActionSheetPostId);
      }
  };

  return (
    <>
      <ReportModal
        visible={isReportVisible}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
      />

      <Modal visible={!!deleteConfirmPostId} transparent animationType="fade" onRequestClose={closeDeleteConfirm}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Delete Post?</Text>
               <Text style={styles.modalText}>This action cannot be undone.</Text>
               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeDeleteConfirm}>
                     <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => {
                      if (deleteConfirmPostId) {
                         actions.handleDeletePost(deleteConfirmPostId);
                      }
                      closeDeleteConfirm();
                  }}>
                     <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      {Platform.OS === 'android' && (
         <Modal visible={!!activeActionSheetPostId} transparent animationType="slide" onRequestClose={closeActionSheet}>
             <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeActionSheet}>
                 <View style={styles.sheetContent}>
                     <TouchableOpacity style={styles.sheetItem} onPress={() => handleActionSheetOption('share')}>
                         <Text style={styles.sheetItemText}>Share</Text>
                     </TouchableOpacity>
                     {isMe ? (
                         <TouchableOpacity style={styles.sheetItem} onPress={() => handleActionSheetOption('delete')}>
                            <Text style={[styles.sheetItemText, { color: '#DC2626' }]}>Delete</Text>
                         </TouchableOpacity>
                     ) : (
                         <TouchableOpacity style={styles.sheetItem} onPress={() => handleActionSheetOption('report')}>
                            <Text style={[styles.sheetItemText, { color: '#DC2626' }]}>Report</Text>
                         </TouchableOpacity>
                     )}
                     <View style={styles.sheetSeparator} />
                     <TouchableOpacity style={styles.sheetItem} onPress={closeActionSheet}>
                         <Text style={styles.sheetItemText}>Cancel</Text>
                     </TouchableOpacity>
                 </View>
             </TouchableOpacity>
         </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8
  },
  modalText: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 24
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563'
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2'
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626'
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  sheetContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24
  },
  sheetItem: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  sheetItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF'
  },
  sheetSeparator: {
    height: 8,
    backgroundColor: '#F3F4F6'
  }
});
