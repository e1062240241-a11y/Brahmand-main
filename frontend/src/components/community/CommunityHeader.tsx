import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../Avatar';
import { COLORS } from '../../../constants/theme';

interface CommunityHeaderProps {
  community: any;
  onBack: () => void;
}

export const CommunityHeader = React.memo(function CommunityHeader({ 
  community, 
  onBack 
}: CommunityHeaderProps) {
  if (!community) return null;

  return (
    <View style={styles.header}>
      <LinearGradient
        colors={['#FF6B00', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.communityInfo}>
            <Avatar 
              uri={community.photo} 
              size={48} 
              name={community.name}
              fallbackIcon="people"
            />
            <View style={styles.textContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {community.name}
              </Text>
              <Text style={styles.memberCount} numberOfLines={1}>
                {community.member_count || 0} members
              </Text>
            </View>
          </View>
          
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.community?.id === nextProps.community?.id &&
    prevProps.community?.name === nextProps.community?.name &&
    prevProps.community?.member_count === nextProps.community?.member_count &&
    prevProps.community?.photo === nextProps.community?.photo
  );
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  memberCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  placeholder: {
    width: 32,
  },
});
