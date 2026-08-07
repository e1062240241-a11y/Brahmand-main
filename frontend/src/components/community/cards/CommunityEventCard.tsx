import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../Avatar';

interface CommunityEventCardProps {
  event: any;
  user: any;
  blockedUserIds: string[];
  onRSVP?: (eventId: string, response: 'yes' | 'no') => void;
}

export const CommunityEventCard = React.memo(function CommunityEventCard({
  event,
  user,
  blockedUserIds,
  onRSVP,
}: CommunityEventCardProps) {
  
  // Check if event is from blocked user
  const isBlocked = useMemo(() => {
    const userId = event.user_id?.toString() || event.created_by?.toString();
    return userId && blockedUserIds.includes(userId);
  }, [event.user_id, event.created_by, blockedUserIds]);

  const handleRSVP = useCallback((response: 'yes' | 'no') => {
    if (onRSVP) {
      onRSVP(event.id, response);
    }
  }, [event.id, onRSVP]);

  if (isBlocked) {
    return null;
  }

  const organizerName = event.user_name || event.author_name || 'Community Member';
  const organizerPhoto = event.user_photo || event.author_photo;
  
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const endDate = event.end_time ? new Date(event.end_time) : null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goingCount = event.going_count || event.rsvp_yes_count || 0;
  const maybeCount = event.maybe_count || 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar 
          uri={organizerPhoto} 
          name={organizerName} 
          size={40} 
        />
        <View style={styles.headerText}>
          <Text style={styles.organizerName} numberOfLines={1}>
            {organizerName}
          </Text>
          <Text style={styles.timestamp} numberOfLines={1}>
            {event.created_at ? new Date(event.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title || 'Community Event'}
        </Text>
        
        {event.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {event.description}
          </Text>
        ) : null}
        
        {startDate && (
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar-outline" size={18} color="#FF6B00" />
            <Text style={styles.dateTimeText}>
              {formatDate(startDate)}
              {endDate ? ` - ${formatDate(endDate)}` : ''}
            </Text>
          </View>
        )}
        
        {event.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color="#FF6B00" />
            <Text style={styles.locationText} numberOfLines={2}>
              {event.location}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.rsvpStats}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.statText}>{goingCount} Going</Text>
          </View>
          {maybeCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="help-circle-outline" size={16} color="#F59E0B" />
              <Text style={styles.statText}>{maybeCount} Maybe</Text>
            </View>
          )}
        </View>
        
        <View style={styles.rsvpButtons}>
          <TouchableOpacity 
            style={styles.rsvpButtonYes}
            onPress={() => handleRSVP('yes')}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text style={styles.rsvpButtonText}>Going</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.rsvpButtonNo}
            onPress={() => handleRSVP('no')}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color="#6B7280" />
            <Text style={styles.rsvpButtonTextNo}>Can't Go</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.title === nextProps.event.title &&
    prevProps.event.going_count === nextProps.event.going_count &&
    prevProps.blockedUserIds.length === nextProps.blockedUserIds.length
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  organizerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rsvpStats: {
    flexDirection: 'column',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  rsvpButtons: {
    flexDirection: 'row',
  },
  rsvpButtonYes: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  rsvpButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 4,
  },
  rsvpButtonNo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  rsvpButtonTextNo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
});
