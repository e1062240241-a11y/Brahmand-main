import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import { useTranslation } from '../utils/i18n';

export const HOME_FEED_TABS_HEIGHT = 52;

type HomeFeedTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const ANDROID_RIPPLE_CONFIG = { color: 'rgba(255, 107, 0, 0.15)', borderless: false };

/**
 * HomeFeedTabs
 *
 * 🎨 Varnish Optimization:
 * 1. Extracted module-level ANDROID_RIPPLE_CONFIG to eliminate object allocation on every render pass.
 * 2. Moved pressed style object `{ opacity: 0.7 }` into StyleSheet.create (`styles.iosPressed`).
 * 3. Wrapped tab change handlers in `useCallback` (`handleForYou`, `handleFollowing`, `handleTrending`) to preserve stable callback references across re-renders.
 * 4. Extracted language check to `isHindi` boolean outside pressable map expressions.
 */
const HomeFeedTabs = React.memo(function HomeFeedTabs({ activeTab, onTabChange }: HomeFeedTabsProps) {
  const { t } = useTranslation();
  const isHindi = t('language') === 'hi';

  const handleForYou = useCallback(() => {
    onTabChange('for_you');
  }, [onTabChange]);

  const handleFollowing = useCallback(() => {
    onTabChange('following');
  }, [onTabChange]);

  const handleTrending = useCallback(() => {
    onTabChange('trending');
  }, [onTabChange]);

  return (
    <View style={styles.feedTabs} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'for_you' }}
        style={({ pressed }) => [
          styles.tabBtn,
          activeTab === 'for_you' && styles.activeTabBtn,
          pressed && Platform.OS === 'ios' && styles.iosPressed,
        ]}
        android_ripple={ANDROID_RIPPLE_CONFIG}
        onPress={handleForYou}
      >
        <Text style={[styles.tabText, activeTab === 'for_you' && styles.activeTabText]}>
          {isHindi ? 'आपके लिए' : 'For You'}
        </Text>
      </Pressable>
      
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'following' }}
        style={({ pressed }) => [
          styles.tabBtn,
          activeTab === 'following' && styles.activeTabBtn,
          pressed && Platform.OS === 'ios' && styles.iosPressed,
        ]}
        android_ripple={ANDROID_RIPPLE_CONFIG}
        onPress={handleFollowing}
      >
        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
          {isHindi ? 'फ़ॉलो कर रहे हैं' : 'Following'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'trending' }}
        style={({ pressed }) => [
          styles.tabBtn,
          activeTab === 'trending' && styles.activeTabBtn,
          pressed && Platform.OS === 'ios' && styles.iosPressed,
        ]}
        android_ripple={ANDROID_RIPPLE_CONFIG}
        onPress={handleTrending}
      >
        <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
          {isHindi ? 'ट्रेंडिंग' : 'Trending'}
        </Text>
      </Pressable>

    </View>
  );
});

const styles = StyleSheet.create({
  feedTabs: {
    height: HOME_FEED_TABS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    flex: 1,
    height: HOME_FEED_TABS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B00',
  },
  iosPressed: {
    opacity: 0.7,
  },
  tabText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FF6B00',
    fontWeight: '900',
  },
});

export default HomeFeedTabs;
