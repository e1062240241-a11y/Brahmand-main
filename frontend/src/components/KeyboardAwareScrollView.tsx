import React, { forwardRef, useState, useEffect } from 'react';
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScrollView, StyleProp, ViewStyle, ScrollViewProps, Platform, Keyboard } from 'react-native';

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
  extraHeight = 120,
  extraScrollHeight = 160,
  ...props
}, ref) => {
  if (Platform.OS === 'android') {
    return (
      <ScrollView
        ref={ref as any}
        style={style}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...(props as any)}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <RNKeyboardAwareScrollView
      ref={ref}
      style={style}
      contentContainerStyle={contentContainerStyle}
      enableOnAndroid={false}
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
