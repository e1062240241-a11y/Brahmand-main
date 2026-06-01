import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';

export const HOME_FEED_TABS_HEIGHT = 52;

type HomeFeedTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePost: () => void;
};

const HomeFeedTabs = React.memo(({ activeTab, onTabChange, onCreatePost }: HomeFeedTabsProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.feedTabs}>
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'for_you' && styles.activeTabBtn]} 
        onPress={() => onTabChange('for_you')}
      >
        <Text style={[styles.tabText, activeTab === 'for_you' && styles.activeTabText]}>
          {t('language') === 'hi' ? 'आपके लिए' : 'For You'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'following' && styles.activeTabBtn]} 
        onPress={() => onTabChange('following')}
      >
        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
          {t('language') === 'hi' ? 'फ़ॉलो कर रहे हैं' : 'Following'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabBtn, activeTab === 'trending' && styles.activeTabBtn]} 
        onPress={() => onTabChange('trending')}
      >
        <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
          {t('language') === 'hi' ? 'ट्रेंडिंग' : 'Trending'}
        </Text>
      </TouchableOpacity>


      <TouchableOpacity activeOpacity={0.8} style={styles.newPostButton} onPress={onCreatePost}>
        <View style={styles.plusIconBg}>
          <Ionicons name="add" size={20} color="#FF6B00" />
        </View>
      </TouchableOpacity>
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
    borderBottomColor: '#000',
  },
  tabText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#000',
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
