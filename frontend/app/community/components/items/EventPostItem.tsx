import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../../../src/store/authStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDateTimeIST } from '../../../../src/utils/dateUtils';
import { styles } from '../sharedStyles';
import { useCommunityActions } from '../../hooks/useCommunityActions';
import { COLORS } from '../../../../src/constants/theme';

interface EventPostItemProps {
  id: string;
  communityId: string;
}

export const EventPostItem = React.memo(({ id, communityId }: EventPostItemProps) => {
  const post = useCommunityStore(state => state.posts[id]);
  const user = useAuthStore(state => state.user);
  const actions = useCommunityActions(communityId);

  if (!post || !user) return null;

  const myId = user.id || user._id;
  const isPast = (post as any).is_past; // Assuming this logic might exist
  const eventDate = (post as any).event_date || (post as any).date;
  const eventTime = (post as any).event_time || (post as any).time;
  const location = (post as any).location;
  const attendeesCount = post.attendees ? post.attendees.length : 0;
  const isAttending = post.attendees?.includes(myId);

  return (
    <View style={[styles.festEventCard, isPast && { opacity: 0.7 }]}>
      <View style={styles.festEventMain}>
        {post.media_url && post.message_type === 'image' && (
           <Image source={{ uri: post.media_url }} style={styles.festEventImage} />
        )}

        <View style={styles.festEventInfo}>
          <Text style={styles.festEventTitle} numberOfLines={2}>{(post as any).title || post.content}</Text>

          <View style={styles.festEventMeta}>
            <View style={styles.festMetaRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.festMetaText}>{eventDate || formatDateTimeIST(post.timestamp || '')}</Text>
            </View>
            {eventTime && (
              <View style={styles.festMetaRow}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.festMetaText}>{eventTime}</Text>
              </View>
            )}
            {location && (
              <View style={styles.festMetaRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.festMetaText} numberOfLines={1}>{location}</Text>
              </View>
            )}
          </View>

          <View style={styles.attendeeAvatarsContainer}>
             <Text style={styles.attendeeCountText}>
               {attendeesCount} {attendeesCount === 1 ? 'person attending' : 'people attending'}
             </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
         <TouchableOpacity
           style={[styles.festActionBtn, { flex: 1 }, isAttending ? styles.festActionBtnActive : null]}
           onPress={() => actions.toggleInterest(id)}
         >
           <Ionicons name={isAttending ? "checkmark-circle" : "calendar-outline"} size={16} color={isAttending ? "#FFF" : "#FF6B00"} />
           <Text style={[styles.festActionBtnText, isAttending ? styles.festActionBtnTextActive : null]}>
             {isAttending ? "Attending" : "Attend"}
           </Text>
         </TouchableOpacity>

         <TouchableOpacity
           style={[styles.festActionBtn, { flex: 1, backgroundColor: '#FFF0E5', borderColor: '#FFD7B5' }]}
           onPress={() => actions.handleSharePost(id)}
         >
           <Ionicons name="share-social-outline" size={16} color="#FF6B00" />
           <Text style={[styles.festActionBtnText, { color: '#FF6B00' }]}>Share</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
});

EventPostItem.displayName = 'EventPostItem';
