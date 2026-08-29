import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { Avatar } from '../Avatar';

export interface GroupInfoModalProps {
  visible: boolean;
  community: any;
  user: any;
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
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>Group Info</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, color: '#536471', marginBottom: 20, lineHeight: 20 }}>
              {community?.description || 'Connect with your local community. Share updates, requests, and engage with devotees.'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 10 }}>Members ({memberCount})</Text>
            
            <View style={{ gap: 15 }}>
              {community?.members_details ? (
                community.members_details.map((member: any, idx: number) => (
                  <View key={`member-detail-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar name={member.name} photo={member.photo} size={40} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{member.name}</Text>
                      <Text style={{ 
                        fontSize: 13, 
                        color: member.role === 'Owner' || member.role === 'Admin' ? '#FF6B00' : '#888', 
                        fontWeight: '500' 
                      }}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <>
                  {community?.owner_id && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar name={community?.owner_name || (community?.owner_id === user?.id ? (user?.name || '') : 'Community Owner')} size={40} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>
                          {community?.owner_name || (community?.owner_id === user?.id ? user?.name : 'Community Owner')}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#FF6B00', fontWeight: '500' }}>Owner</Text>
                      </View>
                    </View>
                  )}
                  
                  {(community?.admin_names || []).map((adminName: string, idx: number) => (
                    <View key={`admin-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar name={adminName} size={40} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{adminName}</Text>
                        <Text style={{ fontSize: 13, color: '#FF6B00', fontWeight: '500' }}>Admin</Text>
                      </View>
                    </View>
                  ))}

                  {(community?.member_names || []).map((memberName: string, idx: number) => (
                    <View key={`member-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar name={memberName} size={40} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>{memberName}</Text>
                        <Text style={{ fontSize: 13, color: '#888', fontWeight: '500' }}>Member</Text>
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

export default GroupInfoModal;
