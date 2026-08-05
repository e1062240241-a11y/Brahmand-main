with open('frontend/app/(tabs)/home.tsx', 'r') as f:
    content = f.read()

# 1. FlashList props optimization
flashlist_old = """              keyExtractor={(item: any, index: number) => item.type === 'empty' ? 'empty' : String(item.id || index)}
              renderItem={renderFeedPost}
              {...{ estimatedItemSize: 600 } as any}
              extraData={activePostId}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 250 }}
              onViewableItemsChanged={onViewableItemsChangedRef.current}
              onScroll={handleHomeScroll}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={Platform.OS === 'android' ? 3 : 5}
              removeClippedSubviews={true}"""

flashlist_new = """              keyExtractor={(item: any, index: number) => item.type === 'empty' ? 'empty' : String(item.id || index)}
              renderItem={renderFeedPost}
              {...{ estimatedItemSize: ESTIMATED_ITEM_SIZE } as any}
              extraData={activePostId}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 250 }}
              onViewableItemsChanged={onViewableItemsChangedRef.current}
              onScroll={handleHomeScroll}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={Platform.OS === 'android' ? 3 : 5}
              drawDistance={1000}
              removeClippedSubviews={true}"""

if flashlist_old in content:
    content = content.replace(flashlist_old, flashlist_new)
    print("Replaced FlashList props")
else:
    print("Could not find FlashList props")

# 2. Let's fix the activePostId / extraData as well.
# It should include activePostIndex so that if index changes but ID is the same, it still re-renders the right items.
extra_old = "extraData={activePostId}"
extra_new = "extraData={{ activePostId, activePostIndex }}"
content = content.replace(extra_old, extra_new)

with open('frontend/app/(tabs)/home.tsx', 'w') as f:
    f.write(content)
