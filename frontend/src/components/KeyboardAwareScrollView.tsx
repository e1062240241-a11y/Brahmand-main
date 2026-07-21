import React, { forwardRef } from 'react';
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScrollView, StyleProp, ViewStyle, ScrollViewProps } from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraHeight?: number;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
}

export const KeyboardAwareScrollView = forwardRef<RNKeyboardAwareScrollView, KeyboardAwareScrollViewProps>(({
  children,
  style,
  contentContainerStyle,
  extraHeight = 100,
  extraScrollHeight = 140,
  ...props
}, ref) => {
  return (
    <RNKeyboardAwareScrollView
      ref={ref}
      style={style}
      contentContainerStyle={contentContainerStyle}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraHeight={extraHeight}
      extraScrollHeight={extraScrollHeight}
      keyboardShouldPersistTaps="handled"
      // Setting resetScrollToCoords to null lets the component restore the previous scroll position on dismiss
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
