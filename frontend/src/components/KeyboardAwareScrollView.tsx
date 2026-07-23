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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <RNKeyboardAwareScrollView
      ref={ref}
      style={style}
      contentContainerStyle={[
        contentContainerStyle,
        Platform.OS === 'android' && keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null,
      ]}
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
