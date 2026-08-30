import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar';
import { CustomLoader } from '../CustomLoader';
import { User } from '../../types';

export interface AttendeesModalProps {
  visible: boolean;
  attendeesList: User[];
  attendeesLoading: boolean;
  onClose: () => void;
}

/**
 * AttendeesModal - Refactored by Varnish 🎨
 *
 * Performance & Quality improvements:
 * 1. Replaced `any[]` with strongly typed `User[]`.
 * 2. Moved inline style objects to `StyleSheet.create` to eliminate object recreation on every render pass.
 * 3. Wrapped renderItem and ListEmptyComponent callbacks in `useCallback` for stable reference identity across FlatList updates.
 * 4. Wrapped component with `React.memo` to eliminate unnecessary modal re-renders during parent screen state updates.
 */
export const AttendeesModal: React.FC<AttendeesModalProps> = React.memo(
  function AttendeesModal({
    visible,
    attendeesList,
    attendeesLoading,
    onClose,
  }) {
    const renderAttendeeItem: ListRenderItem<User> = useCallback(({ item }) => (
      <View style={styles.attendeeRow}>
        <Avatar name={item.name} photo={item.photo} size={40} />
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{item.name}</Text>
          <Text style={styles.attendeeHandle}>@{item.sl_id}</Text>
        </View>
      </View>
    ), []);

    const renderEmptyAttendees = useCallback(() => (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color="#CCC" />
        <Text style={styles.emptyText}>No one has joined yet.</Text>
      </View>
    ), []);

    const keyExtractor = useCallback((u: User) => u.id, []);

    return (
      <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={onClose} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.titleText}>Event Attendees</Text>

            {attendeesLoading ? (
              <CustomLoader size={50} fullScreen={false} />
            ) : (
              <FlatList
                data={attendeesList}
                keyExtractor={keyExtractor}
                renderItem={renderAttendeeItem}
                ListEmptyComponent={renderEmptyAttendees}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    height: '60%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 15,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 20,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  attendeeInfo: {
    marginLeft: 12,
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  attendeeHandle: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#888',
    marginTop: 12,
  },
});

export default AttendeesModal;
