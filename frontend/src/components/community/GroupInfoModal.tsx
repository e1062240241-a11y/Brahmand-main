import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { Avatar } from '../Avatar';

export interface MemberDetail {
  name: string;
  photo?: string;
  role?: string;
}

export interface GroupCommunity {
  description?: string;
  members_details?: MemberDetail[];
  owner_id?: string;
  owner_name?: string;
  admin_names?: string[];
  member_names?: string[];
}

export interface GroupUser {
  id?: string;
  name?: string;
}

export interface GroupInfoModalProps {
  visible: boolean;
  community?: GroupCommunity | null;
  user?: GroupUser | null;
  memberCount: number;
  onClose: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  visible,
  community,
  user,
  memberCount,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Group Info</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              {community?.description || 'Connect with your local community. Share updates, requests, and engage with devotees.'}
            </Text>
            <Text style={styles.sectionTitle}>Members ({memberCount})</Text>
            
            <View style={styles.memberList}>
              {community?.members_details ? (
                community.members_details.map((member: MemberDetail, idx: number) => (
                  <View key={`member-detail-${idx}`} style={styles.memberRow}>
                    <Avatar name={member.name} photo={member.photo} size={40} />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={[
                        styles.memberRole,
                        (member.role === 'Owner' || member.role === 'Admin') && styles.adminRoleText,
                      ]}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <>
                  {community?.owner_id && (
                    <View style={styles.memberRow}>
                      <Avatar name={community?.owner_name || (community?.owner_id === user?.id ? (user?.name || '') : 'Community Owner')} size={40} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {community?.owner_name || (community?.owner_id === user?.id ? user?.name : 'Community Owner')}
                        </Text>
                        <Text style={[styles.memberRole, styles.adminRoleText]}>Owner</Text>
                      </View>
                    </View>
                  )}
                  
                  {(community?.admin_names || []).map((adminName: string, idx: number) => (
                    <View key={`admin-${idx}`} style={styles.memberRow}>
                      <Avatar name={adminName} size={40} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{adminName}</Text>
                        <Text style={[styles.memberRole, styles.adminRoleText]}>Admin</Text>
                      </View>
                    </View>
                  ))}

                  {(community?.member_names || []).map((memberName: string, idx: number) => (
                    <View key={`member-${idx}`} style={styles.memberRow}>
                      <Avatar name={memberName} size={40} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{memberName}</Text>
                        <Text style={styles.memberRole}>Member</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          </KeyboardAwareScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#536471',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  memberList: {
    gap: 15,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    marginLeft: 10,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  memberRole: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  adminRoleText: {
    color: '#FF6B00',
  },
});

export default GroupInfoModal;
