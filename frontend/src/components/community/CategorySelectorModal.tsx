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
import { FONTS } from '../../constants/theme';

interface CategoryInfo {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  desc: string;
}

const CATEGORY_MAP: Record<string, CategoryInfo> = {
  'Others': { iconName: 'chatbubble-ellipses-outline', iconColor: '#1D9BF0', desc: 'General community discussion' },
  'Seva': { iconName: 'heart-outline', iconColor: '#E91E63', desc: 'Seva, donations & volunteer work' },
  'Requests': { iconName: 'alert-circle-outline', iconColor: '#FF6B00', desc: 'Help requests, blood needs, etc.' },
  'Events': { iconName: 'calendar-outline', iconColor: '#00C853', desc: 'Community events & gatherings' },
  'Lost & Found': { iconName: 'search-outline', iconColor: '#9C27B0', desc: 'Lost or found items' },
  'Festivals': { iconName: 'flame-outline', iconColor: '#FF9800', desc: 'Festival celebrations & updates' },
  'Temple Updates': { iconName: 'home-outline', iconColor: '#795548', desc: 'Temple news & renovations' },
};

const POST_CATEGORIES = ['Others', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

export interface CategorySelectorModalProps {
  visible: boolean;
  isKycVerified: boolean;
  insets: { top: number; bottom: number; left: number; right: number };
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}

/**
  * CategorySelectorModal renders category selection for post creation.
  * Replaced `iconName: any` with strict `keyof typeof Ionicons.glyphMap`, moved static configuration to
  * `CATEGORY_MAP` to avoid inline branch evaluations, converted inline styles to `StyleSheet.create`,
  * and wrapped in `React.memo` to eliminate unnecessary re-renders when parent state updates.
  */
export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = React.memo(({
  visible,
  isKycVerified,
  insets,
  onClose,
  onSelectCategory,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          <Text style={styles.title}>
            Choose a Category
          </Text>

          <KeyboardAwareScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {POST_CATEGORIES.map(cat => {
              const info = CATEGORY_MAP[cat] || {
                iconName: 'ellipse-outline' as keyof typeof Ionicons.glyphMap,
                iconColor: '#536471',
                desc: '',
              };

              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryCard}
                  onPress={() => onSelectCategory(cat)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${info.iconColor}15` }]}>
                    <Ionicons name={info.iconName} size={22} color={info.iconColor} />
                  </View>
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>
                        {cat}
                      </Text>
                      {cat === 'Requests' && !isKycVerified && (
                        <View style={styles.kycBadge}>
                          <Ionicons name="shield-checkmark" size={12} color="#FF6B00" />
                          <Text style={styles.kycText}>KYC Required</Text>
                        </View>
                      )}
                    </View>
                    {info.desc ? (
                      <Text style={styles.categoryDesc}>
                        {info.desc}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              );
            })}
          </KeyboardAwareScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

CategorySelectorModal.displayName = 'CategorySelectorModal';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONTS.bold,
  },
  scrollView: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 6,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F1419',
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  kycText: {
    fontSize: 10,
    color: '#FF6B00',
    fontWeight: '700',
    marginLeft: 3,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#536471',
    marginTop: 2,
  },
});

export default CategorySelectorModal;
