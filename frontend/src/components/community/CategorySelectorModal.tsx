import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { FONTS } from '../../constants/theme';

const POST_CATEGORIES = ['Others', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

export interface CategorySelectorModalProps {
  visible: boolean;
  isKycVerified: boolean;
  insets: { top: number; bottom: number; left: number; right: number };
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
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
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          justifyContent: 'flex-end',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: '#FFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 24),
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          }}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} />
          </View>

          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: '#0F1419',
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: FONTS.bold,
          }}>
            Choose a Category
          </Text>

          <KeyboardAwareScrollView
            style={{ maxHeight: 400, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {POST_CATEGORIES.map(cat => {
              let iconName: any = 'ellipse-outline';
              let iconColor = '#536471';
              let desc = '';
              if (cat === 'Others') { iconName = 'chatbubble-ellipses-outline'; iconColor = '#1D9BF0'; desc = 'General community discussion'; }
              else if (cat === 'Seva') { iconName = 'heart-outline'; iconColor = '#E91E63'; desc = 'Seva, donations & volunteer work'; }
              else if (cat === 'Requests') { iconName = 'alert-circle-outline'; iconColor = '#FF6B00'; desc = 'Help requests, blood needs, etc.'; }
              else if (cat === 'Events') { iconName = 'calendar-outline'; iconColor = '#00C853'; desc = 'Community events & gatherings'; }
              else if (cat === 'Lost & Found') { iconName = 'search-outline'; iconColor = '#9C27B0'; desc = 'Lost or found items'; }
              else if (cat === 'Festivals') { iconName = 'flame-outline'; iconColor = '#FF9800'; desc = 'Festival celebrations & updates'; }
              else if (cat === 'Temple Updates') { iconName = 'home-outline'; iconColor = '#795548'; desc = 'Temple news & renovations'; }

              return (
                <TouchableOpacity
                  key={cat}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    marginBottom: 6,
                    backgroundColor: '#FAFAFA',
                    borderWidth: 1,
                    borderColor: '#F0F0F0',
                  }}
                  onPress={() => onSelectCategory(cat)}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: `${iconColor}15`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <Ionicons name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: '#0F1419',
                      }}>
                        {cat}
                      </Text>
                      {cat === 'Requests' && !isKycVerified && (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#FFF3E0',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          marginLeft: 8,
                        }}>
                          <Ionicons name="shield-checkmark" size={12} color="#FF6B00" />
                          <Text style={{ fontSize: 10, color: '#FF6B00', fontWeight: '700', marginLeft: 3 }}>KYC Required</Text>
                        </View>
                      )}
                    </View>
                    {desc ? (
                      <Text style={{
                        fontSize: 12,
                        color: '#536471',
                        marginTop: 2,
                      }}>
                        {desc}
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
};

export default CategorySelectorModal;
