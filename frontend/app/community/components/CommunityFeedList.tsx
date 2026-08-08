import React, { useRef, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useCommunityStore, FeedItem } from '../store/useCommunityStore';
import { DiscussionPostItem } from './items/DiscussionPostItem';
import { EventPostItem } from './items/EventPostItem';
import { RequestPostItem } from './items/RequestPostItem';
import { SevaPostItem } from './items/SevaPostItem';
import { FestivalPostItem } from './items/FestivalPostItem';

interface CommunityFeedListProps {
  communityId: string;
  onRefresh: () => void;
  onLoadMore: () => void;
  refreshing: boolean;
  loadingMore: boolean;
  ListHeaderComponent?: React.ReactElement | null;
}

export const CommunityFeedList: React.FC<CommunityFeedListProps> = ({
  communityId,
  onRefresh,
  onLoadMore,
  refreshing,
  loadingMore,
  ListHeaderComponent
}) => {
  // Use a shallow selector or strictly select the precomputed feedItems array
  // This array is stable unless posts are added/removed or thread flags change
  const feedItems = useCommunityStore(state => state.feedItems);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<FeedItem>) => {
    switch (item.itemType) {
      case 'event':
        return <EventPostItem id={item.id} communityId={communityId} />;
      case 'request':
        return <RequestPostItem id={item.id} communityId={communityId} />;
      case 'seva':
        return <SevaPostItem id={item.id} communityId={communityId} />;
      case 'festival':
        return <FestivalPostItem id={item.id} communityId={communityId} />;
      case 'discussion':
      default:
        return (
          <DiscussionPostItem
            id={item.id}
            communityId={communityId}
            hasNextThreadConnection={item.hasNextThreadConnection}
            hasPrevThreadConnection={item.hasPrevThreadConnection}
          />
        );
    }
  }, [communityId]);

  const keyExtractor = useCallback((item: FeedItem) => item.id, []);
  const getItemType = useCallback((item: FeedItem) => item.itemType, []);

  // For video playing tracking - using onViewableItemsChanged properly
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const visibleIds = viewableItems.map((v: any) => v.item.id);
    // TODO: dispatch visibleIds to UI store to control which SafeVideoView is playing
  }).current;

  return (
    <FlashList
      data={feedItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      estimatedItemSize={250}
      ListHeaderComponent={ListHeaderComponent}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      removeClippedSubviews={Platform.OS !== 'web'}
    />
  );
};
