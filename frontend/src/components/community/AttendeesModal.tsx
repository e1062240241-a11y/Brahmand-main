import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar';
import { CustomLoader } from '../CustomLoader';

export interface AttendeesModalProps {
  visible: boolean;
  attendeesList: any[];
  attendeesLoading: boolean;
  onClose: () => void;
}

export const AttendeesModal: React.FC<AttendeesModalProps> = ({
  visible,
  attendeesList,
  attendeesLoading,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={onClose} />
        <View style={[styles.bottomSheet, { height: '60%' }]}>
          <View style={styles.sheetHandle} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 20 }}>Event Attendees</Text>

          {attendeesLoading ? (
            <CustomLoader size={50} fullScreen={false} />
          ) : (
            <FlatList
              data={attendeesList}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <Avatar name={item.name} photo={item.photo} size={40} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>@{item.sl_id}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Ionicons name="people-outline" size={48} color="#CCC" />
                  <Text style={{ color: '#888', marginTop: 12 }}>No one has joined yet.</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 15 },
});

export default AttendeesModal;
