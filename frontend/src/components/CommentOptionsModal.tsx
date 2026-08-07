import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Pressable, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface CommentOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  options: {
    label: string;
    onPress: () => void;
    isDestructive?: boolean;
    icon?: string;
  }[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CommentOptionsModal: React.FC<CommentOptionsModalProps> = ({
  visible,
  onClose,
  options,
}) => {
  const insets = useSafeAreaInsets();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const backdropOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const sheetTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 99999 }]}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      
      <View style={styles.keyboardAvoidingContainer} pointerEvents="box-none">
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }], paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom + 16, 28) : Math.max(insets.bottom, 16) }]}>
          {/* Grab Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Comment Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close options">
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsContainer}>
            {options.map((option, idx) => {
              const isDestructive = option.isDestructive;
              const textColor = isDestructive ? '#E53935' : '#333';
              const iconColor = isDestructive ? '#E53935' : (COLORS.primary || '#8C36DB');
              const defaultIcon = isDestructive ? 'ban-outline' : 'alert-circle-outline';
              const finalIcon = option.icon || defaultIcon;

              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionRow}
                  onPress={() => {
                    onClose();
                    // Small delay to let close animation start
                    setTimeout(() => {
                      option.onPress();
                    }, 50);
                  }}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={finalIcon as any} size={22} color={iconColor} />
                  </View>
                  <Text style={[styles.optionLabel, { color: textColor }]}>
                    {option.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#BBB" />
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 9999,
  },
  optionsContainer: {
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconWrap: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
