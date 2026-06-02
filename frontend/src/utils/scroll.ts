import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTabBar } from '../contexts/TabBarContext';

/**
 * A custom hook to hide/show the bottom tab bar when scrolling.
 * @param threshold The scroll distance in pixels required to trigger a change in tab bar visibility.
 */
export function useScrollToHideTabBar(threshold = 15) {
  const { showTabBar, hideTabBar } = useTabBar();
  const lastOffsetY = useRef(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const diff = currentOffsetY - lastOffsetY.current;

    // Always show the tab bar when scrolled to the very top (or bouncing)
    if (currentOffsetY <= 10) {
      showTabBar();
      lastOffsetY.current = currentOffsetY;
      return;
    }

    // Scroll down (diff > 0) beyond threshold -> hide
    if (diff > threshold) {
      hideTabBar();
    } 
    // Scroll up (diff < 0) beyond threshold -> show
    else if (diff < -threshold) {
      showTabBar();
    }

    // Keep track of the last offset
    lastOffsetY.current = currentOffsetY;
  }, [showTabBar, hideTabBar, threshold]);

  return onScroll;
}
