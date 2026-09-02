import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Avatar } from '../Avatar';
import { getTimeAgo, parseUTCDate } from '../../utils/dateUtils';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { getFestivalImage } from '../../constants/festivalImages';
import { FONTS } from '../../constants/theme';

export interface CommunityMediaItemProps {
  media: string | any;
  style: any;
  onPress?: () => void;
  isActive?: boolean;
}

export const CommunityMediaItem = React.memo(({
  media,
  style,
  onPress,
  isActive = true,
}: CommunityMediaItemProps) => {
  const mediaUrl = typeof media === 'string' ? media : (media?.uri || '');
  const isVideo = (
    (typeof media === 'object' && media !== null && (
      String(media.type || media.media_type || media.mediaType || '').toLowerCase().startsWith('video')
    )) || (
      typeof mediaUrl === 'string' && (
        /\.(mp4|mov|m4v|webm|mkv|3gp|avi)(\?|$)/i.test(mediaUrl) ||
        mediaUrl.toLowerCase().startsWith('video') || 
        mediaUrl.toLowerCase().includes('/video/') || 
        mediaUrl.toLowerCase().includes('_video_') ||
        ((mediaUrl.toLowerCase().includes('expopicker') || mediaUrl.toLowerCase().includes('imagepicker')) && 
         !/\.(jpg|jpeg|png|gif|heic|webp|bmp|tiff|avif)(\?|$)/i.test(mediaUrl))
      )
    )
  );

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};

  if (isVideo) {
    return (
      <Wrapper {...wrapperProps} style={[{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      <ExpoImage
        source={typeof media === 'string' ? { uri: media } : media}
        style={style}
        contentFit="cover"
      />
    </Wrapper>
  );
});
CommunityMediaItem.displayName = 'CommunityMediaItem';

export interface FeedPostItemProps {
  item: any;
  combinedDataIndexMap: Map<string, number>;
  combinedData: any[];
  user: any;
  activeVideoKey: string;
  CommunityMediaItem: React.ComponentType<any>;
  onLike: (item: any) => void;
  onRepost: (id: string) => void;
  onShare: (item: any) => void;
  onComment: (item: any) => void;
  onDelete: (id: string) => void;
  onReport: (item: any) => void;
  onFullScreenMedia: (uri: string) => void;
  onOpenMap: (location: string) => void;
  styles: any;
}

export const FeedPostItem: React.FC<FeedPostItemProps> = React.memo(({
  item,
  combinedDataIndexMap,
  combinedData,
  user,
  activeVideoKey,
  CommunityMediaItem,
  onLike,
  onRepost,
  onShare,
  onComment,
  onDelete,
  onReport,
  onFullScreenMedia,
  onOpenMap,
  styles,
}) => {
  const index = combinedDataIndexMap.get(String(item.id)) ?? -1;
  const nextItem = index !== -1 && index < combinedData.length - 1 ? combinedData[index + 1] : null;

  const hasNextThreadConnection = nextItem && (
    nextItem.threadParentId === item.id ||
    (item.threadParentId && nextItem.threadParentId === item.threadParentId)
  );
  const hasPrevThreadConnection = item.threadParentId !== undefined;

  const userObj = item.user || {};
  const userName = userObj.name || item.author_name || item.username || item.user_name || 'Sacred Devotee';
  const userPhoto = userObj.photo || item.author_photo || item.user_avatar || item.avatar || '';
  const userHandle = userObj.handle ? userObj.handle : `@${userName.replace(/\s+/g, '').toLowerCase()}`;
  const isVerified = Boolean(userObj.isVerified || item.is_verified);
  const isFeatured = Boolean(userObj.isFeatured || item.is_featured);

  const formatRelativeTime = (ts: string) => {
    if (!ts) return 'Just now';
    if (ts.toLowerCase().includes('ago') || ts.toLowerCase().includes('now')) {
      return ts;
    }
    return getTimeAgo(ts);
  };

  return (
    <View style={[
      styles.postContainer,
      hasNextThreadConnection && { paddingBottom: 0, borderBottomWidth: 0 },
      hasPrevThreadConnection && { paddingTop: 0 }
    ]}>
      {item.isRepost && (
        <View style={styles.repostHeaderLabel}>
          <Ionicons name="repeat" size={14} color="#536471" />
          <Text style={styles.repostHeaderText}>{item.repostedBy || 'Someone'} reposted</Text>
        </View>
      )}

      <View style={styles.postMainRow}>
        <View style={[styles.postLeftCol, { width: 38, alignItems: 'center' }]}>
          {hasPrevThreadConnection ? (
            <View style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, backgroundColor: '#CFD9DE', zIndex: 1 }} />
          ) : (
            <>
              <Avatar name={userName} photo={userPhoto} size={38} />
              {hasNextThreadConnection && (
                <View style={{ position: 'absolute', left: 19, top: 38, bottom: 0, width: 2, backgroundColor: '#CFD9DE', zIndex: 1 }} />
              )}
            </>
          )}
        </View>

        <View style={[styles.postRightCol, hasPrevThreadConnection && { paddingLeft: 19 }]}>
          <View style={styles.postHeaderRow}>
            <View style={styles.postNameContainer}>
              <Text style={styles.feedPostUserName} numberOfLines={1}>{userName}</Text>
              {isVerified && !item.hideBadge && <MaterialCommunityIcons name="check-decagram" size={15} color="#FF6B00" style={{ marginLeft: 2 }} />}
              <Text style={styles.postHandle} numberOfLines={1}>
                {` ${userHandle}`}
              </Text>
              <Text style={styles.postHandle} numberOfLines={1}> · {formatRelativeTime(item.timestamp)}</Text>
              {isFeatured && (
                <View style={styles.featuredBadgeContainer}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
              )}
              {item.category && item.category !== 'Feed' && item.category !== 'Others' && (
                <View style={[styles.categoryBadge, { marginLeft: 6 }]}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
            </TouchableOpacity>
          </View>

          {Boolean(item.content && item.content.trim()) && (
            <Text style={styles.postContentText}>{item.content}</Text>
          )}

          {item.image && (
            <View style={styles.postImageContainer}>
              <CommunityMediaItem
                media={item.image}
                style={styles.postImage}
                isActive={activeVideoKey === String(item.id)}
                onPress={() => onFullScreenMedia(typeof item.image === 'string' ? item.image : item.image.uri)}
              />
            </View>
          )}

          <View style={styles.postActionsRow || styles.postActionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(item)}>
              <Ionicons name="chatbubble-outline" size={16} color="#536471" />
              <Text style={styles.actionCountText}>{item.comments || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => onRepost(item.id)}>
              <Ionicons name="repeat" size={16} color={item.isRepost ? "#00BA7C" : "#536471"} />
              <Text style={[styles.actionCountText, item.isRepost && { color: "#00BA7C" }]}>{item.reposts || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item)}>
              <Ionicons name={item.liked ? "heart" : "heart-outline"} size={16} color={item.liked ? "#F91880" : "#536471"} />
              <Text style={[styles.actionCountText, item.liked && { color: "#F91880" }]}>{item.likes || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)}>
              <Ionicons name="share-outline" size={16} color="#536471" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

export interface EventItemProps {
  item: any;
  user: any;
  rsvpStates: Record<string, string>;
  activeVideoKey: string;
  CommunityMediaItem: React.ComponentType<any>;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string, title: string) => void;
  onResolve: (item: any) => void;
  onShare: (item: any) => void;
  onAttend: (id: string, wantsToAttend: boolean, item: any) => void;
  onViewAttendees: (item: any) => void;
  onOpenMap: (location: string) => void;
  onFullScreenMedia: (uri: string) => void;
  styles: any;
}

export const EventItem: React.FC<EventItemProps> = React.memo(({
  item,
  user,
  rsvpStates,
  activeVideoKey,
  CommunityMediaItem,
  onCall,
  onWhatsApp,
  onResolve,
  onShare,
  onAttend,
  onViewAttendees,
  onOpenMap,
  onFullScreenMedia,
  styles,
}) => {
  const isFulfilled = item.status === 'fulfilled' || item.status === 'resolved' || item.status === 'done';
  const phone = item.contact_number || item.contact || item.user_phone;
  const isCreator = item.user_id === user?.id || item.sender_id === user?.id || item.organizer_id === user?.id;

  const userIsAttendee = Array.isArray(item.attendees) && item.attendees.includes(user?.id);
  const rsvp = rsvpStates[item.id] || (userIsAttendee ? 'yes' : undefined);

  let displayGoingCount = item.attendee_count || 0;
  if (rsvpStates[item.id] === 'yes' && !userIsAttendee) {
    displayGoingCount += 1;
  } else if (rsvpStates[item.id] === 'no' && userIsAttendee) {
    displayGoingCount = Math.max(0, displayGoingCount - 1);
  }

  return (
    <View style={styles.festEventCard}>
      <View style={styles.festEventMain}>
        {(item.image_url || item.image || item.media_url) && (
          <CommunityMediaItem
            media={item.image_url || item.image || item.media_url}
            style={styles.festEventImage}
            isActive={activeVideoKey === (item.id ? String(item.id) : '')}
            onPress={() => onFullScreenMedia(typeof (item.image_url || item.image || item.media_url) === 'string' ? (item.image_url || item.image || item.media_url) : (item.image_url || item.image || item.media_url).uri)}
          />
        )}
        <View style={styles.festEventInfo}>
          <Text style={styles.festEventTitle} numberOfLines={2}>{item.title || 'Event'}</Text>
          {item.description ? (
            <Text style={styles.festEventDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={styles.festEventMeta}>
            <View style={styles.festMetaRow}>
              <Ionicons name="calendar-outline" size={14} color="#FF6B00" />
              <Text style={styles.festMetaText} numberOfLines={1}>
                {(() => {
                  const formatted = formatDateTimeIST(item.start_time);
                  if (!formatted) return 'Date not set';
                  return formatted.replace(' ', ', ');
                })()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.festMetaRow}
              onPress={() => onOpenMap(item.location || 'Online')}
              disabled={!item.location || item.location === 'Online'}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={14} color={item.location && item.location !== 'Online' ? "#FF6B00" : "#FF3B30"} />
              <Text style={[styles.festMetaText, item.location && item.location !== 'Online' && { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>{item.location || 'Online'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.festMetaRow}
              onPress={() => isCreator ? onViewAttendees(item) : null}
              disabled={!isCreator}
            >
              <Ionicons name="people" size={14} color="#00C853" />
              <Text style={styles.festMetaText} numberOfLines={1}>{displayGoingCount} Going</Text>
              {isCreator && displayGoingCount > 0 && <Ionicons name="chevron-forward" size={12} color="#00C853" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.festEventFooter, { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }]}>
        <View style={styles.festOrgDetailsRow}>
          <Avatar name={item.user_name || item.user?.name || 'User'} size={32} photo={item.user?.photo} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <View style={styles.festOrgNameRow}>
              <Text style={styles.festOrgName} numberOfLines={1}>{item.user_name || item.user?.name || 'User'}</Text>
              {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
            </View>
            <Text style={styles.festOrgLabel}>Organizer • {getTimeAgo(item.start_time || item.created_at || item.timestamp)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.eventActionRow, { marginTop: 12, paddingHorizontal: 0 }]}>
        {phone ? (
          <>
            <TouchableOpacity
              style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
              onPress={() => onCall(phone)}
            >
              <Ionicons name="call" size={18} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]}
              onPress={() => onWhatsApp(phone, item.title)}
            >
              <FontAwesome5 name="whatsapp" size={18} color="#059669" />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={{ flex: 1, marginHorizontal: 8 }}>
          {item.user_id === user?.id || item.sender_id === user?.id ? (
            !isFulfilled && (
              <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#F59E0B', width: '100%' }]} onPress={() => onResolve(item)}>
                <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
              </TouchableOpacity>
            )
          ) : null}

          {isFulfilled ? (
            <View style={[styles.helpBtn, { backgroundColor: '#D1FAE5', width: '100%' }]}>
              <Text style={[styles.helpBtnText, { color: '#166534' }]}>Completed ✅</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onShare(item)}>
          <Ionicons name="share-social-outline" size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {!(item.user_id === user?.id || item.sender_id === user?.id || item.organizer_id === user?.id) && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
        }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 13, color: '#64748B', fontFamily: FONTS.regular }}>
              Want to attend?
            </Text>
            {rsvp === 'yes' && (
              <Text style={{ fontSize: 11, color: '#1D9BF0', marginTop: 2, fontFamily: FONTS.regular }}>
                Your response has been shared with organizer.
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => onAttend(item.id, rsvp !== 'yes', item)}
            style={{
              backgroundColor: rsvp === 'yes' ? '#1D9BF0' : '#FFFFFF',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#1D9BF0',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: rsvp === 'yes' ? '#FFFFFF' : '#1D9BF0', fontSize: 13, fontWeight: '700' }}>
              I will attend
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export interface SevaItemProps {
  item: any;
  user: any;
  activeVideoKey: string;
  CommunityMediaItem: React.ComponentType<any>;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string, title: string) => void;
  onResolve: (item: any) => void;
  onShare: (item: any) => void;
  onFullScreenMedia: (uri: string) => void;
  styles: any;
}

export const SevaItem: React.FC<SevaItemProps> = React.memo(({
  item,
  user,
  activeVideoKey,
  CommunityMediaItem,
  onCall,
  onWhatsApp,
  onResolve,
  onShare,
  onFullScreenMedia,
  styles,
}) => {
  const isFulfilled = item.status === 'fulfilled' || item.status === 'resolved' || item.status === 'done';
  const phone = item.contact || item.contact_number || item.user_phone;
  return (
    <View style={styles.festEventCard}>
      <View style={styles.festEventMain}>
        {(item.image || item.image_url || item.media_url) && (
          <CommunityMediaItem
            media={item.image || item.image_url || item.media_url}
            style={styles.festEventImage}
            isActive={activeVideoKey === (item.id ? String(item.id) : '')}
            onPress={() => onFullScreenMedia(typeof (item.image || item.image_url || item.media_url) === 'string' ? (item.image || item.image_url || item.media_url) : (item.image || item.image_url || item.media_url).uri)}
          />
        )}
        <View style={styles.festEventInfo}>
          <Text style={styles.festEventTitle} numberOfLines={2}>{item.title || item.content || 'Seva'}</Text>
          {item.description || item.content ? (
            <Text style={styles.festEventDesc} numberOfLines={2}>{item.description || item.content}</Text>
          ) : null}
          {item.sevaDetails ? (
            <View style={[styles.sevaInfoCard, { marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }]}>
              <Text style={[styles.sevaInfoLabel, { fontSize: 10, marginBottom: 2 }]}>Seva Details</Text>
              <Text style={[styles.sevaInfoText, { fontSize: 13, lineHeight: 18 }]}>{item.sevaDetails}</Text>
            </View>
          ) : null}
          <View style={styles.festEventMeta}>
            <View style={styles.festMetaRow}>
              <Ionicons name="heart" size={14} color="#E91E63" />
              <Text style={styles.festMetaText} numberOfLines={1}>Seva</Text>
            </View>
            <View style={styles.festMetaRow}>
              <Ionicons name="time-outline" size={14} color="#FF3B30" />
              <Text style={styles.festMetaText} numberOfLines={1}>{getTimeAgo(item.created_at || item.timestamp)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.festEventFooter, { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }]}>
        <View style={styles.festOrgDetailsRow}>
          <Avatar name={item.user?.name || item.user_name || 'User'} size={32} photo={item.user?.photo} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <View style={styles.festOrgNameRow}>
              <Text style={styles.festOrgName} numberOfLines={1}>{item.user?.name || item.user_name || 'User'}</Text>
              {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
            </View>
            <Text style={styles.festOrgLabel}>Volunteer • {item.location || 'Local'}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.eventActionRow, { marginTop: 12, paddingHorizontal: 0 }]}>
        {phone ? (
          <>
            <TouchableOpacity
              style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
              onPress={() => onCall(phone)}
            >
              <Ionicons name="call" size={18} color="#16A34A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]}
              onPress={() => onWhatsApp(phone, item.title || item.content || item.description)}
            >
              <FontAwesome5 name="whatsapp" size={18} color="#059669" />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={{ flex: 1, marginHorizontal: 8 }}>
          {item.user_id === user?.id || item.sender_id === user?.id ? (
            !isFulfilled && (
              <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#F59E0B', width: '100%' }]} onPress={() => onResolve(item)}>
                <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
              </TouchableOpacity>
            )
          ) : null}

          {isFulfilled ? (
            <View style={[styles.helpBtn, { backgroundColor: '#D1FAE5', width: '100%' }]}>
              <Text style={[styles.helpBtnText, { color: '#166534' }]}>Completed ✅</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onShare(item)}>
          <Ionicons name="share-social-outline" size={18} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export interface RequestItemProps {
  item: any;
  user: any;
  interestMap: Record<string, { count: number; userInterested: boolean }>;
  activeVideoKey: string;
  CommunityMediaItem: React.ComponentType<any>;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string, title: string) => void;
  onResolve: (item: any) => void;
  onShare: (item: any) => void;
  onToggleInterest: (item: any) => void;
  onOpenMap: (location: string) => void;
  onFullScreenMedia: (uri: string) => void;
  styles: any;
}

export const RequestItem: React.FC<RequestItemProps> = React.memo(({
  item,
  user,
  interestMap,
  activeVideoKey,
  CommunityMediaItem,
  onCall,
  onWhatsApp,
  onResolve,
  onShare,
  onToggleInterest,
  onOpenMap,
  onFullScreenMedia,
  styles,
}) => {
  const getRequestIconDetails = (item: any) => {
    const type = item.request_type;
    const support = item.support_needed || '';

    if (type === 'blood' || support.toLowerCase().includes('blood')) {
      return { name: 'water', color: '#FF3B30', bg: '#FFEBEB' };
    }
    if (support.toLowerCase().includes('emergency') || support.toLowerCase().includes('critical')) {
      return { name: 'medkit', color: '#FB8C00', bg: '#FFF3E0' };
    }
    if (support.toLowerCase().includes('food') || support.toLowerCase().includes('grocery')) {
      return { name: 'restaurant', color: '#F25C05', bg: '#FFF4EE' };
    }
    if (support.toLowerCase().includes('senior') || support.toLowerCase().includes('citizen')) {
      return { name: 'people', color: '#5C6BC0', bg: '#E8EAF6' };
    }
    if (support.toLowerCase().includes('gau') || support.toLowerCase().includes('animal') || support.toLowerCase().includes('cow')) {
      return { name: 'paw', color: '#43A047', bg: '#E8F5E9' };
    }
    if (support.toLowerCase().includes('temple') || support.toLowerCase().includes('volunteer')) {
      return { name: 'home', color: '#FF9800', bg: '#FFF3E0' };
    }
    if (type === 'lost_found' || type === 'lost' || type === 'found' || support.toLowerCase().includes('lost') || support.toLowerCase().includes('found')) {
      return { name: 'search', color: '#8E24AA', bg: '#F3E5F5' };
    }
    return { name: 'help-circle', color: '#00796B', bg: '#E0F2F1' };
  };

  const isLostFoundRequest = (item: any) => {
    const cat = (item.category || item.request_type || '').toLowerCase();
    const sup = (item.support_needed || '').toLowerCase();
    return cat.includes('lost') || cat.includes('found') || sup.includes('lost') || sup.includes('found');
  };

  const isTempleUpdateRequest = (item: any) => {
    const cat = (item.category || item.request_type || '').toLowerCase();
    const sup = (item.support_needed || '').toLowerCase();
    return cat.includes('temple') || sup.includes('temple');
  };

  const iconDetails = getRequestIconDetails(item);
  const isFulfilled = item.status === 'fulfilled' || item.status === 'resolved' || item.status === 'done';
  const phone = item.contact_number || item.contact || item.user_phone;
  const ownerName = item.user_name || item.user?.name || 'Requester';
  const requestTypeLabel = item.request_type ? String(item.request_type).toUpperCase() : 'REQUEST';

  return (
    <View style={styles.festEventCard}>
      <View style={[styles.requestOwnerRow, { alignItems: 'flex-start', justifyContent: 'flex-start', marginBottom: 6 }]}>
        <Avatar name={ownerName} photo={item.user?.photo} size={34} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={[styles.feedPostUserName, { fontSize: 13 }]} numberOfLines={1}>{ownerName}</Text>
            {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 2 }} />}
            <Text style={[styles.postHandle, { fontSize: 11 }]} numberOfLines={1}>
              {item.user?.handle ? ` ${item.user.handle}` : ` @${ownerName.replace(/\s+/g, '').toLowerCase()}`}
            </Text>
            <Text style={[styles.postHandle, { fontSize: 11 }]} numberOfLines={1}> · {getTimeAgo(item.created_at || item.timestamp)}</Text>
            <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 4, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '500' }}>{requestTypeLabel}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[{ backgroundColor: 'transparent', borderRadius: 14, borderWidth: 1, borderColor: isFulfilled ? '#A7F3D0' : 'rgba(0,0,0,0.06)', padding: 10 }, isFulfilled ? { backgroundColor: '#F0FDF4' } : {}]}>
        <View style={styles.festEventMain}>
          {(item.image || item.image_url || item.media_url) && (
            <CommunityMediaItem
              media={item.image || item.image_url || item.media_url}
              style={styles.festEventImage}
              isActive={activeVideoKey === (item.id ? String(item.id) : '')}
              onPress={() => onFullScreenMedia(typeof (item.image || item.image_url || item.media_url) === 'string' ? (item.image || item.image_url || item.media_url) : (item.image || item.image_url || item.media_url).uri)}
            />
          )}
          <View style={styles.festEventInfo}>
            <Text style={styles.festEventTitle} numberOfLines={2}>{item.title || item.content || 'Request'}</Text>
            {item.description ? (
              <Text style={styles.festEventDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <View style={styles.festEventMeta}>
              {item.location ? (
                <TouchableOpacity 
                  style={styles.festMetaRow}
                  onPress={() => onOpenMap(item.location)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location" size={12} color="#FF6B00" />
                  <Text style={[styles.festMetaText, { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.festMetaRow}>
                <Ionicons name={iconDetails.name as any} size={12} color={iconDetails.color} />
                <Text style={styles.festMetaText} numberOfLines={1}>{(item.urgency_level || 'Normal').toUpperCase()}</Text>
              </View>
              <View style={styles.festMetaRow}>
                <Ionicons name="time-outline" size={12} color="#FF3B30" />
                <Text style={styles.festMetaText} numberOfLines={1}>{getTimeAgo(item.created_at || item.timestamp)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 }} />

        <View style={[styles.eventActionRow, { marginTop: 0, paddingHorizontal: 0 }]}>
          {phone ? (
            <>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
                onPress={() => onCall(phone)}
              >
                <Ionicons name="call" size={18} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]}
                onPress={() => onWhatsApp(phone, item.title || item.content)}
              >
                <FontAwesome5 name="whatsapp" size={18} color="#059669" />
              </TouchableOpacity>
            </>
          ) : null}

          <View style={{ flex: 1, marginHorizontal: 8 }}>
            {item.user_id === user?.id || item.sender_id === user?.id ? (
              !isFulfilled && (
                <TouchableOpacity style={[styles.helpBtn, { backgroundColor: '#F59E0B', width: '100%' }]} onPress={() => onResolve(item)}>
                  <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
                </TouchableOpacity>
              )
            ) : !isFulfilled ? (
              (() => {
                const isLostFound = isLostFoundRequest(item);
                const isTemple = isTempleUpdateRequest(item);
                if (!isLostFound && !isTemple) return null;
                const interest = interestMap[item.id] ?? { count: item.interested_count || 0, userInterested: (item.interested_by || []).includes(user?.id) };
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: '#666', flex: 1 }}>
                      {isLostFound ? 'Did you find this?' : 'Will you attend?'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onToggleInterest(item)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: interest.userInterested ? '#D1FAE5' : '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: interest.userInterested ? '#059669' : '#BBF7D0' }}
                    >
                      <Ionicons name="checkmark" size={16} color={interest.userInterested ? '#059669' : '#34D399'} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: interest.userInterested ? '#059669' : '#34D399' }}>
                        {interest.count > 0 ? `${interest.count} ${isLostFound ? 'found' : 'going'}` : isLostFound ? 'Found' : 'Going'}
                      </Text>
                    </TouchableOpacity>
                    {isTemple && !interest.userInterested && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#FEF2F2', padding: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FECACA' }}
                        onPress={() => {}}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()
            ) : null}

            {isFulfilled ? (
              <View style={[styles.helpBtn, { backgroundColor: '#D1FAE5', width: '100%' }]}>
                <Text style={[styles.helpBtnText, { color: '#166534' }]}>Completed ✅</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.actionIconBtn} onPress={() => onShare(item)}>
            <Ionicons name="share-social-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});
