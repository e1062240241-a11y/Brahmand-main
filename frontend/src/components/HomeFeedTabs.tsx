import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const HOME_FEED_TABS_HEIGHT = 52;

type HomeFeedTabsProps = {
  onCreatePost: () => void;
};

const HomeFeedTabs = ({ onCreatePost }: HomeFeedTabsProps) => (
  <View style={styles.feedTabs}>
    <View style={styles.activeFeedTab}>
      <Text style={styles.activeFeedText}>For You</Text>
    </View>
    <Text style={styles.feedTabText}>Following</Text>
    <Text style={styles.feedTabText}>Trending</Text>
    <TouchableOpacity activeOpacity={0.8} style={styles.newPostButton} onPress={onCreatePost}>
      <Ionicons name="add-circle" size={22} color="#FFD26C" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  feedTabs: {
    height: HOME_FEED_TABS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  activeFeedTab: {
    height: HOME_FEED_TABS_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#B56DFF',
    flex: 1,
    alignItems: 'center',
  },
  activeFeedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  feedTabText: {
    color: '#F3D5C6',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  newPostButton: {
    width: 48,
    height: HOME_FEED_TABS_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeFeedTabs;
