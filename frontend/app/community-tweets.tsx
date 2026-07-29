// accessibility: placeholder
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../src/database';
import { getCommunityMessages } from '../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../src/constants/theme';
import { Avatar } from '../src/components/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- 1. Shimmer/Skeleton Loader Component ---
const SkeletonCard = ({ opacity }: { opacity: Animated.Value }) => {
  return (
    <Animated.View style={[styles.tweetCard, { opacity }]}>
      <View style={styles.tweetHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonHeaderText}>
          <View style={styles.skeletonName} />
          <View style={styles.skeletonHandle} />
        </View>
      </View>
      <View style={styles.skeletonContent} />
      <View style={[styles.skeletonContent, { width: '80%', marginTop: 6 }]} />
      <View style={styles.skeletonActions} />
    </Animated.View>
  );
};

const SkeletonLoader = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={styles.skeletonContainer}>
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
    </View>
  );
};

// --- 2. Inner Presentational Components ---

interface TweetItemProps {
  item: {
    id: string;
    sender_name: string;
    content: string;
    created_at: number;
    message_type?: string;
  };
}

const TweetCard = React.memo(({ item }: TweetItemProps) => {
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <View style={styles.tweetCard}>
      <View style={styles.tweetHeader}>
        <Avatar
          name={item.sender_name}
          size={42}
        />
        <View style={styles.tweetMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.senderName}>{item.sender_name}</Text>
            <MaterialCommunityIcons name="decagram-outline" size={16} color={COLORS.primary} style={styles.verifiedIcon} />
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>
          <Text style={styles.handle}>@{item.sender_name.toLowerCase().replace(/\s+/g, '')}</Text>
        </View>
      </View>
      
      <Text style={styles.tweetContent}>{item.content}</Text>
      
      <View style={styles.tweetActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

interface TweetListProps {
  messages: any[];
  isSyncing: boolean;
  onRefresh: () => void;
  webFallbackTweets?: any[];
}

const CommunityTweetsList: React.FC<TweetListProps> = ({
  messages,
  isSyncing,
  onRefresh,
  webFallbackTweets = [],
}) => {
  // Use either WatermelonDB records or the web fallback memory state
  const displayData = Platform.OS === 'web' ? webFallbackTweets : (messages || []);

  if (displayData.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <FlatList
      data={displayData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TweetCard item={item} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshing={isSyncing}
      onRefresh={onRefresh}
    />
  );
};

// --- 3. WatermelonDB HOC Binding ---
// Observing community_messages matching our communityId query
const observeCommunityMessages = ({ communityId }: { communityId: string }) => ({
  messages: database
    .get('community_messages')
    .query(Q.where('community_id', communityId), Q.sortBy('created_at', Q.desc))
    .observe(),
});

const ObservableTweetsList = withObservables(['communityId'], observeCommunityMessages)(CommunityTweetsList);

// --- 4. Main Screen Wrapper ---
export default function CommunityTweetsScreen() {
  const router = useRouter();
  const { communityId, subgroup, communityName } = useLocalSearchParams<{
    communityId: string;
    subgroup: string;
    communityName?: string;
  }>();

  const [isSyncing, setIsSyncing] = useState(false);
  // Web-only fallback memory state so that the web page functions correctly
  const [webTweets, setWebTweets] = useState<any[]>([]);

  // Silent Background Fetch and Write to DB
  const performSilentSync = async () => {
    if (!communityId || !subgroup) return;
    try {
      setIsSyncing(true);
      const response = await getCommunityMessages(communityId, subgroup);
      const apiMessages = response.data || [];

      if (Platform.OS === 'web') {
        // Fallback for Web since WatermelonDB is shimmed
        const formattedWebTweets = apiMessages.map((msg: any) => ({
          id: msg.id || msg._id || Math.random().toString(),
          sender_name: msg.sender_name || 'Anonymous',
          content: msg.content || '',
          created_at: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
        }));
        setWebTweets(formattedWebTweets);
      } else {
        // Write DIRECTLY to WatermelonDB locally on iOS/Android
        await database.write(async () => {
          const communityMessagesCollection = database.get('community_messages');
          for (const msg of apiMessages) {
            const recordId = msg.id || msg._id || Math.random().toString(36).substring(7);
            let existingRecord = null;
            try {
              const records = await communityMessagesCollection.query(Q.where('id', recordId)).fetch();
              existingRecord = records && records.length > 0 ? records[0] : null;
            } catch {
              existingRecord = null;
            }

            if (existingRecord) {
              await existingRecord.update((record: any) => {
                record.content = msg.content;
                record.sender_name = msg.sender_name || 'Anonymous';
                record.message_type = msg.message_type || 'text';
                record.updated_at = msg.updated_at ? new Date(msg.updated_at).getTime() : Date.now();
              });
            } else {
              await communityMessagesCollection.create((record: any) => {
                record._raw.id = recordId;
                record.community_id = communityId;
                record.sender_id = msg.sender_id || 'system';
                record.sender_name = msg.sender_name || 'Anonymous';
                record.content = msg.content;
                record.message_type = msg.message_type || 'text';
                record.created_at = msg.created_at ? new Date(msg.created_at).getTime() : Date.now();
                record.updated_at = msg.updated_at ? new Date(msg.updated_at).getTime() : Date.now();
              });
            }
          }
        });
      }
    } catch (error) {
      console.warn('[Sync] Silent background messages sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    performSilentSync();
  }, [communityId, subgroup]);

  return (
    <SafeAreaView style={styles.safeArea as ViewStyle}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{communityName || 'Community Feed'}</Text>
          <Text style={styles.headerSubtitle}>{subgroup ? `${subgroup.toUpperCase()} CHAT` : ''}</Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={performSilentSync}>
          <Ionicons name="sync-outline" size={20} color={isSyncing ? COLORS.primary : COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ObservableTweetsList
        communityId={communityId || ''}
        isSyncing={isSyncing}
        onRefresh={performSilentSync}
        webFallbackTweets={webTweets}
      />
    </SafeAreaView>
  );
}

// --- 5. Premium Premium Styling ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  syncButton: {
    padding: SPACING.xs,
  },
  listContainer: {
    paddingVertical: SPACING.sm,
  },
  tweetCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tweetMeta: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  handle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  tweetContent: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    lineHeight: 21,
    marginTop: SPACING.sm,
    paddingLeft: 2,
  },
  tweetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingRight: SPACING.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // --- Skeleton styles ---
  skeletonContainer: {
    paddingVertical: SPACING.sm,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.divider,
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: SPACING.sm,
    gap: 6,
  },
  skeletonName: {
    width: 100,
    height: 14,
    borderRadius: BORDER_RADIUS.xs,
    backgroundColor: COLORS.divider,
  },
  skeletonHandle: {
    width: 70,
    height: 11,
    borderRadius: BORDER_RADIUS.xs,
    backgroundColor: COLORS.divider,
  },
  skeletonContent: {
    height: 14,
    width: '95%',
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.xs,
    marginTop: SPACING.md,
  },
  skeletonActions: {
    height: 16,
    width: '100%',
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.xs,
    marginTop: SPACING.lg,
  },
});
