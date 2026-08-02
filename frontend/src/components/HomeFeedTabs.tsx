import React from 'react';
import { StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';

export const HOME_FEED_TABS_HEIGHT = 52;

type HomeFeedTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePost: () => void;
};

const HomeFeedTabs = React.memo(function HomeFeedTabs({ activeTab, onTabChange, onCreatePost }: HomeFeedTabsProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.feedTabs} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'for_you' }}
        style={({ pressed }) => [
          styles.tabBtn,
          activeTab === 'for_you' && styles.activeTabBtn,
          pressed && Platform.OS === 'ios' && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(255, 107, 0, 0.15)', borderless: false }}
        onPress={() => onTabChange('for_you')}
      >
        <Text style={[styles.tabText, activeTab === 'for_you' && styles.activeTabText]}>
          {t('language') === 'hi' ? 'आपके लिए' : 'For You'}
        </Text>
      </Pressable>
      
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'following' }}
        style={({ pressed }) => [
          styles.tabBtn,
          activeTab === 'following' && styles.activeTabBtn,
          pressed && Platform.OS === 'ios' && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(255, 107, 0, 0.15)', borderless: false }}
        onPress={() => onTabChange('following')}
      >
        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
          {t('language') === 'hi' ? 'फ़ॉलो कर रहे हैं' : 'Following'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'trending' }}
        style={({ pressed }) => [
          styles.tabBtn,
          activeTab === 'trending' && styles.activeTabBtn,
          pressed && Platform.OS === 'ios' && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(255, 107, 0, 0.15)', borderless: false }}
        onPress={() => onTabChange('trending')}
      >
        <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
          {t('language') === 'hi' ? 'ट्रेंडिंग' : 'Trending'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create new post"
        style={({ pressed }) => [
          styles.newPostButton,
          pressed && Platform.OS === 'ios' && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(255, 107, 0, 0.15)', borderless: false }}
        onPress={onCreatePost}
      >
        <View style={styles.plusIconBg}>
          <Ionicons name="add" size={20} color="#FF6B00" />
        </View>
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
  tabText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FF6B00',
    fontWeight: '900',
  },
  newPostButton: {
    width: 60,
    height: HOME_FEED_TABS_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeFeedTabs;
