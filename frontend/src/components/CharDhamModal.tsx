import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface CharDhamModalProps {
  visible: boolean;
  onClose: () => void;
  charDhamSubFilter: 'bada' | 'chota' | 'all';
  setCharDhamSubFilter: (filter: 'bada' | 'chota' | 'all') => void;
  t: (key: string) => string;
}

export const CharDhamModal = React.memo(({
  visible,
  onClose,
  charDhamSubFilter,
  setCharDhamSubFilter,
  t,
}: CharDhamModalProps) => {
  const options = [
    {
      id: 'all' as const,
      titleEn: 'All Char Dham',
      titleHi: 'सभी चार धाम',
      subtitleEn: '7 Unique Sacred Shrines',
      subtitleHi: '7 मुख्य पवित्र तीर्थ',
      count: 7,
    },
    {
      id: 'bada' as const,
      titleEn: 'Bada Char Dham',
      titleHi: 'बड़ा चार धाम',
      subtitleEn: 'National Pilgrimage Circuit (4 Shrines)',
      subtitleHi: 'राष्ट्रीय चार धाम यात्रा (4 दिशाएं)',
      count: 4,
    },
    {
      id: 'chota' as const,
      titleEn: 'Chota Char Dham',
      titleHi: 'छोटा चार धाम',
      subtitleEn: 'Himalayan Shrine Circuit (4 Shrines)',
      subtitleHi: 'हिमालयी चार धाम यात्रा (उत्तराखंड)',
      count: 4,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <View style={styles.charDhamModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>
              {t('language') === 'hi' ? 'चार धाम परिपथ चुनें' : 'Select Pilgrimage Circuit'}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          {options.map((item) => {
            const isSelected = charDhamSubFilter === item.id;
            const title = t('language') === 'hi' ? item.titleHi : item.titleEn;
            const subtitle = t('language') === 'hi' ? item.subtitleHi : item.subtitleEn;

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.charDhamOptionRow,
                  isSelected && styles.charDhamOptionRowSelected,
                  pressed && { opacity: 0.85 }
                ]}
                onPress={() => {
                  setCharDhamSubFilter(item.id);
                  onClose();
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.charDhamOptionTitle, isSelected && styles.charDhamOptionTitleSelected]}>
                      {title}
                    </Text>
                    <View style={styles.charDhamBadge}>
                      <Text style={styles.charDhamBadgeText}>{item.count}</Text>
                    </View>
                  </View>
                  <Text style={styles.charDhamOptionSubtitle}>{subtitle}</Text>
                </View>

                <MaterialCommunityIcons
                  name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                  size={22}
                  color={isSelected ? "#F97316" : "#D1D5DB"}
                />
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  charDhamModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  charDhamOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charDhamOptionRowSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  charDhamOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  charDhamOptionTitleSelected: {
    color: '#F97316',
  },
  charDhamOptionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  charDhamBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  charDhamBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
  },
});

export default CharDhamModal;
