import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../Avatar';

interface CommunityRequestCardProps {
  request: any;
  user: any;
  blockedUserIds: string[];
  onFulfill?: (requestId: string) => void;
  onCall?: (phone: string) => void;
  onWhatsApp?: (phone: string) => void;
}

export const CommunityRequestCard = React.memo(function CommunityRequestCard({
  request,
  user,
  blockedUserIds,
  onFulfill,
  onCall,
  onWhatsApp,
}: CommunityRequestCardProps) {
  
  // Check if request is from blocked user
  const isBlocked = useMemo(() => {
    const userId = request.user_id?.toString() || request.created_by?.toString();
    return userId && blockedUserIds.includes(userId);
  }, [request.user_id, request.created_by, blockedUserIds]);

  const handleCall = useCallback(() => {
    if (request.phone && onCall) {
      onCall(request.phone);
    } else if (request.phone) {
      Linking.openURL(`tel:${request.phone}`);
    }
  }, [request.phone, onCall]);

  const handleWhatsApp = useCallback(() => {
    if (request.phone && onWhatsApp) {
      onWhatsApp(request.phone);
    } else if (request.phone) {
      const message = encodeURIComponent(`Hi, I saw your request: ${request.title}`);
      Linking.openURL(`https://wa.me/${request.phone.replace(/[^0-9]/g, '')}?text=${message}`);
    }
  }, [request.phone, request.title, onWhatsApp]);

  const handleFulfill = useCallback(() => {
    if (onFulfill) {
      onFulfill(request.id);
    }
  }, [request.id, onFulfill]);

  if (isBlocked) {
    return null;
  }

  const requesterName = request.user_name || request.author_name || 'Community Member';
  const requesterPhoto = request.user_photo || request.author_photo;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar 
          uri={requesterPhoto} 
          name={requesterName} 
          size={40} 
        />
        <View style={styles.headerText}>
          <Text style={styles.requesterName} numberOfLines={1}>
            {requesterName}
          </Text>
          <Text style={styles.timestamp} numberOfLines={1}>
            {request.created_at ? new Date(request.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {request.title || 'Help Request'}
        </Text>
        {request.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {request.description}
          </Text>
        ) : null}
        
        {request.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#FF6B00" />
            <Text style={styles.locationText} numberOfLines={1}>
              {request.location}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {request.phone ? (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={20} color="#10B981" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleWhatsApp}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </>
        ) : null}
        
        <TouchableOpacity 
          style={styles.fulfillButton}
          onPress={handleFulfill}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
          <Text style={styles.fulfillButtonText}>Fulfill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.request.id === nextProps.request.id &&
    prevProps.request.title === nextProps.request.title &&
    prevProps.request.description === nextProps.request.description &&
    prevProps.request.phone === nextProps.request.phone &&
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
  requesterName: {
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#FF6B00',
    marginLeft: 4,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  fulfillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#10B981',
  },
  fulfillButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 4,
  },
});
