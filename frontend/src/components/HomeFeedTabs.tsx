import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const HOME_FEED_TABS_HEIGHT = 52;

type HomeFeedTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePost: () => void;
};

const HomeFeedTabs = ({ activeTab, onTabChange, onCreatePost }: HomeFeedTabsProps) => (
  <View style={styles.feedTabs}>
    <TouchableOpacity 
      style={[styles.tabBtn, activeTab === 'for_you' && styles.activeTabBtn]} 
      onPress={() => onTabChange('for_you')}
    >
      <Text style={[styles.tabText, activeTab === 'for_you' && styles.activeTabText]}>For You</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.tabBtn, activeTab === 'following' && styles.activeTabBtn]} 
      onPress={() => onTabChange('following')}
    >
      <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Following</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.tabBtn, activeTab === 'trending' && styles.activeTabBtn]} 
      onPress={() => onTabChange('trending')}
    >
      <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>Trending</Text>
    </TouchableOpacity>

    <TouchableOpacity activeOpacity={0.8} style={styles.newPostButton} onPress={onCreatePost}>
      <View style={styles.plusIconBg}>
        <Ionicons name="add" size={20} color="#FF6B00" />
      </View>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  feedTabs: {
    height: HOME_FEED_TABS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBtn: {
    flex: 1,
    height: HOME_FEED_TABS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabBtn: {
  },
  tabText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FF6A00',
    fontWeight: '800',
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FF6A00',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeFeedTabs;
