import React from 'react';
import { StyleSheet, View, StatusBar, StatusBarStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface TopStatusScrimProps {
  /**
   * Gradient fade colors.
   * Default: ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0)']
   */
  colors?: readonly [string, string, ...string[]];
  /**
   * Status bar icon style.
   * Default: 'dark-content'
   */
  barStyle?: StatusBarStyle;
  /**
   * Additional height added to insets.top for the linear gradient overlay.
   * Default: 28
   */
  extraPadding?: number;
  /**
   * Optional custom zIndex.
   * Default: 999
   */
  zIndex?: number;
}

export const TopStatusScrim: React.FC<TopStatusScrimProps> = ({
  colors = ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0)'],
  barStyle = 'dark-content',
  extraPadding = 28,
  zIndex = 999,
}) => {
  const insets = useSafeAreaInsets();
  const overlayHeight = insets.top + extraPadding;

  return (
    <>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={barStyle}
      />
      <View
        pointerEvents="none"
        style={[
          styles.overlayContainer,
          {
            height: overlayHeight,
            zIndex,
          },
        ]}
      >
        <LinearGradient
          colors={colors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
    </>
  );
};

TopStatusScrim.displayName = 'TopStatusScrim';

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
});

export default TopStatusScrim;
