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
      <Ionicons name="add-circle" size={26} color="#FFD26C" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  feedTabs: {
    height: HOME_FEED_TABS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 11, 53, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabBtn: {
    flex: 1,
    height: HOME_FEED_TABS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: '#B56DFF',
  },
  tabText: {
    color: '#F3D5C6',
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.7,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '900',
    opacity: 1,
  },
  newPostButton: {
    width: 60,
    height: HOME_FEED_TABS_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeFeedTabs;
