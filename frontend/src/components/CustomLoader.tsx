import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { OmSpinner } from './CustomRefreshControl';

interface CustomLoaderProps {
  size?: number;
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({
  size = 56,
  color = '#FF6B00', // Saffron Primary
  message,
  fullScreen = true,
  style,
}) => {
  return (
    <View style={[fullScreen ? styles.fullScreenContainer : styles.inlineContainer, style]}>
      <OmSpinner size={size} color={color} ringColor={color} />
      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'transparent',
  },
  absoluteCenter: {
    position: 'absolute',
  },
  messageText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomLoader;
