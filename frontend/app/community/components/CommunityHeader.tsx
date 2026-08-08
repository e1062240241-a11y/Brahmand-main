import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CommunityHeaderProps {
  communityId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['Feed', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

export const CommunityHeader = ({ communityId, activeTab, onTabChange }: CommunityHeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Community</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
           {TABS.map((tab) => (
             <TouchableOpacity
               key={tab}
               style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
               onPress={() => onTabChange(tab)}
             >
               <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

      <View style={styles.createPostWrapper}>
        <TouchableOpacity style={styles.createPostBtn} onPress={() => router.push(`/community/create?id=${communityId}&category=${activeTab}`)}>
           <Ionicons name="add-circle" size={20} color="#FFF" />
           <Text style={styles.createPostBtnText}>Create Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#FF6B00',
  },
  tabText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
  createPostWrapper: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  createPostBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
