import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Avatar } from '../Avatar';
import { getTimeAgo, parseUTCDate } from '../../utils/dateUtils';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { getFestivalImage } from '../../constants/festivalImages';
import { FONTS } from '../../constants/theme';

export interface CommunityMediaItemProps {
  /**
   * 🎨 Varnish Optimization:
   * Proper typing for media object/string and style prop to avoid `any`.
   * Static container style in StyleSheet eliminates array allocation during render.
   */
  media: string | { uri?: string; type?: string; media_type?: string; mediaType?: string } | null;
  style?: StyleProp<ImageStyle | ViewStyle>;
  onPress?: (dimensions?: { x: number; y: number; width: number; height: number } | null) => void;
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

  const ref = React.useRef<View>(null);
  const handlePress = React.useCallback(() => {
    if (!onPress) return;
    const anyPress = onPress as any;
    if (anyPress.length === 0) { anyPress(); return; }
    const node = ref.current as any;
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, w: number, h: number) => anyPress({ x, y, width: w, height: h }));
    } else {
      anyPress(null);
    }
  }, [onPress]);

  const Wrapper: any = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress: handlePress } : {};

  if (isVideo) {
    return (
      <Wrapper ref={ref} {...wrapperProps} style={[feedItemStyles.videoContainer, style]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={ref} {...wrapperProps}>
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
        <View style={[styles.postLeftCol, feedItemStyles.postLeftColWidth]}>
          {hasPrevThreadConnection ? (
            <View style={feedItemStyles.threadLinePrev} />
          ) : (
            <>
              <Avatar name={userName} photo={userPhoto} size={38} />
              {hasNextThreadConnection && (
                <View style={feedItemStyles.threadLineNext} />
              )}
            </>
          )}
        </View>

        <View style={[styles.postRightCol, hasPrevThreadConnection && feedItemStyles.paddingLeft19]}>
          <View style={styles.postHeaderRow}>
            <View style={styles.postNameContainer}>
              <Text style={styles.feedPostUserName} numberOfLines={1}>{userName}</Text>
              {isVerified && !item.hideBadge && <MaterialCommunityIcons name="check-decagram" size={15} color="#FF6B00" style={feedItemStyles.verifiedBadge} />}
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
                <View style={[styles.categoryBadge, feedItemStyles.marginLeft6]}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={feedItemStyles.ellipsisBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Post options"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#536471" />
            </TouchableOpacity>
          </View>

          {Boolean(item.content && item.content.trim()) && (
            <Text style={styles.postContentText}>{item.content}</Text>
          )}

          {item.image && (
            <View style={styles.postImageContainer || feedItemStyles.postImageContainer}>
              <CommunityMediaItem
                media={item.image}
                style={styles.postImage || feedItemStyles.postImage}
                isActive={activeVideoKey === String(item.id)}
                onPress={(r: any) => (onFullScreenMedia as any)(typeof item.image === 'string' ? item.image : item.image.uri, r)}
              />
            </View>
          )}

          <View style={[feedItemStyles.postActionsRow, styles.postActionsRow || styles.postActionRow]}>
            <TouchableOpacity
              style={[feedItemStyles.actionBtn, styles.actionBtn || styles.postActionBtn]}
              onPress={() => onComment(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Comment"
            >
              <Ionicons name="chatbubble-outline" size={18} color="#536471" />
              <Text style={[feedItemStyles.actionCountText, styles.actionCountText || styles.postActionCount]}>{item.comments || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[feedItemStyles.actionBtn, styles.actionBtn || styles.postActionBtn]}
              onPress={() => onRepost(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Repost"
            >
              <Ionicons name="repeat" size={18} color={item.isRepost ? "#00BA7C" : "#536471"} />
              <Text style={[feedItemStyles.actionCountText, styles.actionCountText || styles.postActionCount, item.isRepost && { color: "#00BA7C" }]}>{item.reposts || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[feedItemStyles.actionBtn, styles.actionBtn || styles.postActionBtn]}
              onPress={() => onLike(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={item.liked ? "Unlike" : "Like"}
            >
              <Ionicons name={item.liked ? "heart" : "heart-outline"} size={18} color={item.liked ? "#F91880" : "#536471"} />
              <Text style={[feedItemStyles.actionCountText, styles.actionCountText || styles.postActionCount, item.liked && { color: "#F91880" }]}>{item.likes || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[feedItemStyles.actionBtn, styles.actionBtn || styles.postActionBtn]}
              onPress={() => onShare(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              <Ionicons name="share-outline" size={18} color="#536471" />
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
            onPress={(r: any) => (onFullScreenMedia as any)(typeof (item.image_url || item.image || item.media_url) === 'string' ? (item.image_url || item.image || item.media_url) : (item.image_url || item.image || item.media_url).uri, r)}
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

      <View style={[styles.festEventFooter, feedItemStyles.cardFooterBorder]}>
        <View style={styles.festOrgDetailsRow}>
          <Avatar name={item.user_name || item.user?.name || 'User'} size={32} photo={item.user?.photo} />
          <View style={feedItemStyles.flex1Ml8}>
            <View style={styles.festOrgNameRow}>
              <Text style={styles.festOrgName} numberOfLines={1}>{item.user_name || item.user?.name || 'User'}</Text>
              {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={feedItemStyles.marginLeft4} />}
            </View>
            <Text style={styles.festOrgLabel}>Organizer • {getTimeAgo(item.start_time || item.created_at || item.timestamp)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.eventActionRow, feedItemStyles.actionRowContainer]}>
        {phone ? (
          <>
            <TouchableOpacity
              style={[styles.actionIconBtn, feedItemStyles.callBtnBg]}
              onPress={() => onCall(phone)}
              accessibilityRole="button"
              accessibilityLabel="Call organizer"
            >
              <Ionicons name="call" size={18} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, feedItemStyles.whatsappBtnBg]}
              onPress={() => onWhatsApp(phone, item.title)}
              accessibilityRole="button"
              accessibilityLabel="WhatsApp organizer"
            >
              <FontAwesome5 name="whatsapp" size={18} color="#059669" />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={feedItemStyles.flex1Mh8}>
          {item.user_id === user?.id || item.sender_id === user?.id ? (
            !isFulfilled && (
              <TouchableOpacity
                style={[styles.helpBtn, feedItemStyles.resolveBtnBg]}
                onPress={() => onResolve(item)}
                accessibilityRole="button"
                accessibilityLabel="Mark as Fulfilled"
              >
                <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
              </TouchableOpacity>
            )
          ) : null}

          {isFulfilled ? (
            <View style={[styles.helpBtn, feedItemStyles.fulfilledBtnBg]}>
              <Text style={[styles.helpBtnText, feedItemStyles.fulfilledBtnText]}>Completed ✅</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => onShare(item)}
          accessibilityRole="button"
          accessibilityLabel="Share event"
        >
          <Ionicons name="share-social-outline" size={18} color="#888" />
        </TouchableOpacity>
      </View>

      {!(item.user_id === user?.id || item.sender_id === user?.id || item.organizer_id === user?.id) && (
        <View style={feedItemStyles.attendFooterContainer}>
          <View style={feedItemStyles.flex1Mr12}>
            <Text style={feedItemStyles.attendQuestionText}>
              Want to attend?
            </Text>
            {rsvp === 'yes' && (
              <Text style={feedItemStyles.attendResponseSharedText}>
                Your response has been shared with organizer.
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => onAttend(item.id, rsvp !== 'yes', item)}
            style={rsvp === 'yes' ? feedItemStyles.attendBtnActive : feedItemStyles.attendBtn}
            activeOpacity={0.7}
          >
            <Text style={rsvp === 'yes' ? feedItemStyles.attendBtnTextActive : feedItemStyles.attendBtnText}>
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
            onPress={(r: any) => (onFullScreenMedia as any)(typeof (item.image || item.image_url || item.media_url) === 'string' ? (item.image || item.image_url || item.media_url) : (item.image || item.image_url || item.media_url).uri, r)}
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

      <View style={[styles.festEventFooter, feedItemStyles.cardFooterBorder]}>
        <View style={styles.festOrgDetailsRow}>
          <Avatar name={item.user?.name || item.user_name || 'User'} size={32} photo={item.user?.photo} />
          <View style={feedItemStyles.flex1Ml8}>
            <View style={styles.festOrgNameRow}>
              <Text style={styles.festOrgName} numberOfLines={1}>{item.user?.name || item.user_name || 'User'}</Text>
              {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={feedItemStyles.marginLeft4} />}
            </View>
            <Text style={styles.festOrgLabel}>Volunteer • {item.location || 'Local'}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.eventActionRow, feedItemStyles.actionRowContainer]}>
        {phone ? (
          <>
            <TouchableOpacity
              style={[styles.actionIconBtn, feedItemStyles.callBtnBg]}
              onPress={() => onCall(phone)}
              accessibilityRole="button"
              accessibilityLabel="Call volunteer"
            >
              <Ionicons name="call" size={18} color="#16A34A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionIconBtn, feedItemStyles.whatsappBtnBg]}
              onPress={() => onWhatsApp(phone, item.title || item.content || item.description)}
              accessibilityRole="button"
              accessibilityLabel="WhatsApp volunteer"
            >
              <FontAwesome5 name="whatsapp" size={18} color="#059669" />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={feedItemStyles.flex1Mh8}>
          {item.user_id === user?.id || item.sender_id === user?.id ? (
            !isFulfilled && (
              <TouchableOpacity
                style={[styles.helpBtn, feedItemStyles.resolveBtnBg]}
                onPress={() => onResolve(item)}
                accessibilityRole="button"
                accessibilityLabel="Mark as Fulfilled"
              >
                <Text style={styles.helpBtnText}>Mark as Fulfilled</Text>
              </TouchableOpacity>
            )
          ) : null}

          {isFulfilled ? (
            <View style={[styles.helpBtn, feedItemStyles.fulfilledBtnBg]}>
              <Text style={[styles.helpBtnText, feedItemStyles.fulfilledBtnText]}>Completed ✅</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => onShare(item)}
          accessibilityRole="button"
          accessibilityLabel="Share Seva"
        >
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
      <View style={[styles.requestOwnerRow, feedItemStyles.requestOwnerRowAlign]}>
        <Avatar name={ownerName} photo={item.user?.photo} size={34} />
        <View style={feedItemStyles.flex1Ml8}>
          <View style={feedItemStyles.requestMetaRow}>
            <Text style={[styles.feedPostUserName, feedItemStyles.fontSize13]} numberOfLines={1}>{ownerName}</Text>
            {item.user?.isVerified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={feedItemStyles.verifiedBadgeSmall} />}
            <Text style={[styles.postHandle, feedItemStyles.fontSize11]} numberOfLines={1}>
              {item.user?.handle ? ` ${item.user.handle}` : ` @${ownerName.replace(/\s+/g, '').toLowerCase()}`}
            </Text>
            <Text style={[styles.postHandle, feedItemStyles.fontSize11]} numberOfLines={1}> · {getTimeAgo(item.created_at || item.timestamp)}</Text>
            <View style={feedItemStyles.requestBadgeTag}>
              <Text style={feedItemStyles.requestBadgeTagText}>{requestTypeLabel}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[feedItemStyles.requestCardInner, isFulfilled ? feedItemStyles.requestCardInnerFulfilled : feedItemStyles.requestCardInnerPending]}>
        <View style={styles.festEventMain}>
          {(item.image || item.image_url || item.media_url) && (
            <CommunityMediaItem
              media={item.image || item.image_url || item.media_url}
              style={styles.festEventImage}
              isActive={activeVideoKey === (item.id ? String(item.id) : '')}
              onPress={(r: any) => (onFullScreenMedia as any)(typeof (item.image || item.image_url || item.media_url) === 'string' ? (item.image || item.image_url || item.media_url) : (item.image || item.image_url || item.media_url).uri, r)}
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

        <View style={feedItemStyles.dividerLine} />

        <View style={[styles.eventActionRow, feedItemStyles.actionRowZeroTopMargin]}>
          {phone ? (
            <>
              <TouchableOpacity
                style={[styles.actionIconBtn, feedItemStyles.callBtnBg]}
                onPress={() => onCall(phone)}
                accessibilityRole="button"
                accessibilityLabel="Call requester"
              >
                <Ionicons name="call" size={18} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconBtn, feedItemStyles.whatsappBtnBg]}
                onPress={() => onWhatsApp(phone, item.title || item.content)}
                accessibilityRole="button"
                accessibilityLabel="WhatsApp requester"
              >
                <FontAwesome5 name="whatsapp" size={18} color="#059669" />
              </TouchableOpacity>
            </>
          ) : null}

          <View style={feedItemStyles.flex1Mh8}>
            {item.user_id === user?.id || item.sender_id === user?.id ? (
              !isFulfilled && (
                <TouchableOpacity
                  style={[styles.helpBtn, feedItemStyles.resolveBtnBg]}
                  onPress={() => onResolve(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Mark as Fulfilled"
                >
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
                  <View style={feedItemStyles.gap8Row}>
                    <Text style={feedItemStyles.interestQuestionText}>
                      {isLostFound ? 'Did you find this?' : 'Will you attend?'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onToggleInterest(item)}
                      style={[
                        feedItemStyles.interestBtn,
                        interest.userInterested ? feedItemStyles.interestBtnActive : feedItemStyles.interestBtnInactive
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={interest.userInterested ? (isLostFound ? 'Found' : 'Going') : (isLostFound ? 'Mark as found' : 'Mark as going')}
                    >
                      <Ionicons name="checkmark" size={16} color={interest.userInterested ? '#059669' : '#34D399'} />
                      <Text style={[feedItemStyles.interestBtnText, { color: interest.userInterested ? '#059669' : '#34D399' }]}>
                        {interest.count > 0 ? `${interest.count} ${isLostFound ? 'found' : 'going'}` : isLostFound ? 'Found' : 'Going'}
                      </Text>
                    </TouchableOpacity>
                    {isTemple && !interest.userInterested && (
                      <TouchableOpacity
                        style={feedItemStyles.notGoingBtn}
                        onPress={() => {}}
                        accessibilityRole="button"
                        accessibilityLabel="Not going"
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()
            ) : null}

            {isFulfilled ? (
              <View style={[styles.helpBtn, feedItemStyles.fulfilledBtnBg]}>
                <Text style={[styles.helpBtnText, feedItemStyles.fulfilledBtnText]}>Completed ✅</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => onShare(item)}
            accessibilityRole="button"
            accessibilityLabel="Share request"
          >
            <Ionicons name="share-social-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const feedItemStyles = StyleSheet.create({
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingRight: 24,
    maxWidth: '92%',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 28,
  },
  actionCountText: {
    fontSize: 13,
    color: '#536471',
    fontWeight: '500',
    includeFontPadding: false,
  },
  postImageContainer: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFF3F4',
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  videoContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postLeftColWidth: {
    width: 38,
    alignItems: 'center',
  },
  paddingLeft19: {
    paddingLeft: 19,
  },
  threadLinePrev: {
    position: 'absolute',
    left: 19,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#CFD9DE',
    zIndex: 1,
  },
  threadLineNext: {
    position: 'absolute',
    left: 19,
    top: 38,
    bottom: 0,
    width: 2,
    backgroundColor: '#CFD9DE',
    zIndex: 1,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  verifiedBadgeSmall: {
    marginLeft: 2,
  },
  marginLeft4: {
    marginLeft: 4,
  },
  marginLeft6: {
    marginLeft: 6,
  },
  ellipsisBtn: {
    padding: 4,
  },
  flex1Ml8: {
    marginLeft: 8,
    flex: 1,
  },
  flex1Mh8: {
    flex: 1,
    marginHorizontal: 8,
  },
  flex1Mr12: {
    flex: 1,
    marginRight: 12,
  },
  cardFooterBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  actionRowContainer: {
    marginTop: 12,
    paddingHorizontal: 0,
  },
  actionRowZeroTopMargin: {
    marginTop: 0,
    paddingHorizontal: 0,
  },
  callBtnBg: {
    backgroundColor: '#F0FDF4',
  },
  whatsappBtnBg: {
    backgroundColor: '#ECFDF5',
  },
  resolveBtnBg: {
    backgroundColor: '#F59E0B',
    width: '100%',
  },
  fulfilledBtnBg: {
    backgroundColor: '#D1FAE5',
    width: '100%',
  },
  fulfilledBtnText: {
    color: '#166534',
  },
  attendFooterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attendQuestionText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: FONTS.regular,
  },
  attendResponseSharedText: {
    fontSize: 11,
    color: '#1D9BF0',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  attendBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1D9BF0',
  },
  attendBtnActive: {
    backgroundColor: '#1D9BF0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1D9BF0',
  },
  attendBtnText: {
    color: '#1D9BF0',
    fontSize: 13,
    fontWeight: '700',
  },
  attendBtnTextActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  requestOwnerRowAlign: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  requestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fontSize13: {
    fontSize: 13,
  },
  fontSize11: {
    fontSize: 11,
  },
  requestBadgeTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestBadgeTagText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  requestCardInner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  requestCardInnerPending: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0,0,0,0.06)',
  },
  requestCardInnerFulfilled: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  gap8Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interestQuestionText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  interestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestBtnActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  interestBtnInactive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  interestBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notGoingBtn: {
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
