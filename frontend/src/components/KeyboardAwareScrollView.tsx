import React, { forwardRef } from 'react';
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScrollView, StyleProp, ViewStyle, ScrollViewProps, Platform } from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraHeight?: number;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
  keyboardOpeningTime?: number;
}

export const KeyboardAwareScrollView = forwardRef<RNKeyboardAwareScrollView, KeyboardAwareScrollViewProps>(({
  children,
  style,
  contentContainerStyle,
  extraHeight = 120,
  extraScrollHeight = 160,
  enableOnAndroid = true,
  enableAutomaticScroll = true,
  keyboardOpeningTime = 250,
  ...props
}, ref) => {
  return (
    <RNKeyboardAwareScrollView
      ref={ref}
      style={style}
      contentContainerStyle={contentContainerStyle}
      enableOnAndroid={enableOnAndroid}
      enableAutomaticScroll={enableAutomaticScroll}
      keyboardOpeningTime={keyboardOpeningTime}
      extraHeight={extraHeight}
      extraScrollHeight={extraScrollHeight}
      keyboardShouldPersistTaps="handled"
      resetScrollToCoords={null as any}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </RNKeyboardAwareScrollView>
  );
});

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

export type KeyboardAwareScrollView = RNKeyboardAwareScrollView & ScrollView;


