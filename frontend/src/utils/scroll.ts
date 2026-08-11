import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTabBar } from '../contexts/TabBarContext';

/**
 * A custom hook to hide/show the bottom tab-bar when scrolling.
 * @param threshold The scroll distance in pixels required to trigger a change in tab-bar visibility.
 */
export function useScrollToHideTabBar(threshold = 12) {
  const { showTabBar, hideTabBar } = useTabBar();
  const lastOffsetY = useRef(0);
  const accumulatedDelta = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;

    // Always show the tab-bar when scrolled to the very top (or bouncing)
    if (currentOffsetY <= 10) {
      showTabBar();
      lastOffsetY.current = currentOffsetY;
      accumulatedDelta.current = 0;
      scrollDirection.current = null;
      return;
    }

    const delta = currentOffsetY - lastOffsetY.current;
    lastOffsetY.current = currentOffsetY;

    // Ignore tiny subpixel noise
    if (Math.abs(delta) < 0.5) return;

    const currentDir = delta > 0 ? 'down' : 'up';

    if (scrollDirection.current !== currentDir) {
      // Direction flipped, reset accumulated delta to current step
      scrollDirection.current = currentDir;
      accumulatedDelta.current = Math.abs(delta);
    } else {
      // Accumulate movement in the same direction
      accumulatedDelta.current += Math.abs(delta);
    }

    if (accumulatedDelta.current >= threshold) {
      if (currentDir === 'down') {
        hideTabBar();
      } else {
        showTabBar();
      }
    }
  }, [showTabBar, hideTabBar, threshold]);

  return onScroll;
}
