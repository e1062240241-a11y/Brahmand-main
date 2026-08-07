import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFestivalImage } from '../../../constants/festivalImages';

interface CommunityFestivalCardProps {
  festival: any;
  user: any;
  blockedUserIds: string[];
}

export const CommunityFestivalCard = React.memo(function CommunityFestivalCard({
  festival,
  user,
  blockedUserIds,
}: CommunityFestivalCardProps) {
  
  // Check if festival is from blocked user
  const isBlocked = useMemo(() => {
    const userId = festival.user_id?.toString() || festival.created_by?.toString();
    return userId && blockedUserIds.includes(userId);
  }, [festival.user_id, festival.created_by, blockedUserIds]);

  if (isBlocked) {
    return null;
  }

  const festivalName = festival.name || festival.title || 'Festival';
  const festivalDate = festival.date ? new Date(festival.date) : null;
  const description = festival.description || festival.details;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const festivalImage = getFestivalImage(festivalName);

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {festivalImage ? (
          <Image 
            source={festivalImage} 
            style={styles.festivalImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.festivalImagePlaceholder}>
            <Ionicons name="celebrate-outline" size={40} color="#FF6B00" />
          </View>
        )}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="calendar" size={14} color="#FFF" />
            <Text style={styles.badgeText}>
              {festivalDate ? festivalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {festivalName}
        </Text>
        
        {description ? (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        ) : null}
        
        {festivalDate && (
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar-outline" size={16} color="#FF6B00" />
            <Text style={styles.dateTimeText}>
              {formatDate(festivalDate)}
            </Text>
          </View>
        )}
        
        {festival.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#FF6B00" />
            <Text style={styles.locationText} numberOfLines={1}>
              {festival.location}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.festival.id === nextProps.festival.id &&
    prevProps.festival.name === nextProps.festival.name &&
    prevProps.festival.date === nextProps.festival.date &&
    prevProps.blockedUserIds.length === nextProps.blockedUserIds.length
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  festivalImage: {
    width: '100%',
    height: '100%',
  },
  festivalImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF6B00',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
});
