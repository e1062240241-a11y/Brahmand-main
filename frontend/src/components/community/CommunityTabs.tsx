import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';

interface CommunityTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'Feed', label: 'Feed', icon: 'newspaper-outline' },
  { id: 'Requests', label: 'Requests', icon: 'help-circle-outline' },
  { id: 'Events', label: 'Events', icon: 'calendar-outline' },
  { id: 'Lost & Found', label: 'Lost & Found', icon: 'search-outline' },
  { id: 'Festivals', label: 'Festivals', icon: 'celebrate-outline' },
  { id: 'Seva', label: 'Seva', icon: 'hand-left-outline' },
  { id: 'Temple Updates', label: 'Temple', icon: 'business-outline' },
  { id: 'My Posts', label: 'My Posts', icon: 'person-outline' },
];

export const CommunityTabs = React.memo(function CommunityTabs({ 
  activeTab, 
  onTabChange 
}: CommunityTabsProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={16} 
            color={activeTab === tab.id ? '#FFF' : '#6B7280'}
            style={styles.icon}
          />
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}, (prevProps, nextProps) => {
  return prevProps.activeTab === nextProps.activeTab;
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#FF6B00',
  },
  icon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFF',
  },
});
