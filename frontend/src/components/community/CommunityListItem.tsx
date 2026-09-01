import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/theme';
import { FeedPostItem, EventItem, SevaItem, RequestItem, CommunityMediaItem } from './FeedItems';

export interface CommunityListItemHandlers {
  onLike: (item: any) => void;
  onRepost: (id: string) => void;
  onShare: (item: any) => void;
  onComment: (item: any) => void;
  onDelete: (id: string) => void;
  onReport: (item: any) => void;
  onFullScreenMedia: (uri: string) => void;
  onOpenMap: (location: string) => void;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: any, title?: any) => void;
  onResolve: (item: any) => void;
  onToggleInterest: (item: any) => void;
  onAttend: (eventId: any, wantsToAttend?: any, eventItem?: any) => void;
  onViewAttendees: (item: any) => void;
  onNavigateKyc: () => void;
  setShowFilterDropdown: (cb: (prev: boolean) => boolean) => void;
  setShowSortDropdown: (cb: (prev: boolean) => boolean) => void;
  setSelectedFestival: (val: string | null) => void;
  setFestivalSort: (val: any) => void;
  setPostCategory: (cat: string) => void;
  setShowCreateModal: (show: boolean) => void;
  renderFestivalItem?: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  renderFestivalEvent?: ({ item }: { item: any }) => React.ReactElement;
}

export interface CommunityListItemProps {
  item: any;
  activeTab: string;
  isLocked: boolean;
  lockReason: string;
  user: any;
  activeVideoKey: string | null;
  interestMap: Record<string, { count: number; userInterested: boolean }>;
  rsvpStates: Record<string, 'yes' | 'no'>;
  styles: any;
  handlers: CommunityListItemHandlers;
  combinedDataIndexMap: Map<string, number>;
  combinedData: any[];
  allFestivals: any[];
  selectedFestival: string | null;
  showFilterDropdown: boolean;
  showSortDropdown: boolean;
  festivalSort: 'latest' | 'oldest';
}

// Extracted inline style objects into StyleSheet to eliminate object allocation overhead during list updates and scrolling.
export const CommunityListItem: React.FC<CommunityListItemProps> = React.memo(({
  item,
  activeTab,
  isLocked,
  lockReason,
  user,
  activeVideoKey,
  interestMap,
  rsvpStates,
  styles,
  handlers,
  combinedDataIndexMap,
  combinedData,
  allFestivals,
  selectedFestival,
  showFilterDropdown,
  showSortDropdown,
  festivalSort,
}) => {
  if (item.type === 'festivals_header') {
    return (
      <View style={[styles.sectionHeader, localStyles.festivalsHeader]}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="calendar" size={24} color="#0EA5E9" style={localStyles.headerIconMargin} />
          <Text style={[styles.sectionTitle, localStyles.headerTitle22]}>Festivals</Text>
        </View>
        <View style={localStyles.dropdownContainerZIndex3001}>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => {
              handlers.setShowFilterDropdown((prev) => !prev);
              handlers.setShowSortDropdown(() => false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedFestival || 'All Festivals'}
            </Text>
            <Ionicons name={showFilterDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#444" />
          </TouchableOpacity>

          {showFilterDropdown && (
            <View style={styles.inlineDropdownMenu}>
              <ScrollView style={localStyles.dropdownScrollView} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {[
                  { label: 'All Festivals', value: null },
                  ...allFestivals.map((f) => ({ label: f.name, value: f.name })),
                ]
                  .filter(
                    (opt, index, self) => opt.label && self.findIndex((t) => t.value === opt.value) === index
                  )
                  .map((opt, idx) => {
                    const isSelected = selectedFestival === opt.value;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.inlineDropdownItem, isSelected && styles.inlineDropdownItemActive]}
                        onPress={() => {
                          handlers.setSelectedFestival(opt.value);
                          handlers.setShowFilterDropdown(() => false);
                        }}
                      >
                        <Text
                          style={[styles.inlineDropdownText, isSelected && styles.inlineDropdownTextActive]}
                          numberOfLines={1}
                        >
                          {opt.label}
                        </Text>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FF6B00" />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (item.type === 'festivals_list') {
    const festivalsToDisplay = selectedFestival
      ? allFestivals.filter(
          (f) => (f.name || '').toLowerCase().trim() === selectedFestival.toLowerCase().trim()
        )
      : allFestivals;

    if (!handlers.renderFestivalItem) return null;

    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={festivalsToDisplay}
        keyExtractor={(f, i) => (f.id ? String(f.id) : `fest-${i}`)}
        renderItem={handlers.renderFestivalItem}
        contentContainerStyle={localStyles.festivalsListPadding}
      />
    );
  }

  if (item.type === 'festival_events_header') {
    return (
      <View style={[styles.sectionHeader, localStyles.eventsHeader]}>
        <Text style={[styles.sectionTitle, localStyles.headerTitle18]}>Upcoming Festival Events</Text>
        <View style={localStyles.dropdownContainerZIndex2001}>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => {
              handlers.setShowSortDropdown((prev) => !prev);
              handlers.setShowFilterDropdown(() => false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.filterText}>
              {festivalSort === 'latest' ? 'Latest First' : 'Oldest First'}
            </Text>
            <Ionicons name={showSortDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#444" />
          </TouchableOpacity>

          {showSortDropdown && (
            <View style={styles.inlineDropdownMenu}>
              {[
                { label: 'Latest First', value: 'latest' },
                { label: 'Oldest First', value: 'oldest' },
              ].map((opt, idx) => {
                const isSelected = festivalSort === opt.value;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.inlineDropdownItem, isSelected && styles.inlineDropdownItemActive]}
                    onPress={() => {
                      handlers.setFestivalSort(opt.value as any);
                      handlers.setShowSortDropdown(() => false);
                    }}
                  >
                    <Text style={[styles.inlineDropdownText, isSelected && styles.inlineDropdownTextActive]}>
                      {opt.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FF6B00" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  }

  if (item.type === 'festival_event') {
    return handlers.renderFestivalEvent ? handlers.renderFestivalEvent({ item }) : null;
  }

  if (item.type === 'festival_banner') {
    return (
      <View style={styles.festBanner}>
        <View style={styles.festBannerLeft}>
          <Ionicons name="sparkles-outline" size={28} color="#FF6B00" />
          <View style={localStyles.festBannerLeftTextContainer}>
            <Text style={styles.festBannerTitle}>Share the Joy of Festivals!</Text>
            <Text style={styles.festBannerSub}>
              Create a festival post and invite others to be a part of the celebration.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.createFestBtn}
          onPress={() => {
            handlers.setPostCategory('Festivals');
            handlers.setShowCreateModal(true);
          }}
        >
          <Text style={styles.createFestBtnText}>Create Festival Post</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (item.type === 'header') {
    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name={item.icon || 'chatbubbles-outline'}
            size={20}
            color="#FF3B30"
            style={localStyles.headerIconMarginRight8}
          />
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      </View>
    );
  }

  if (activeTab === 'Seva') {
    return (
      <SevaItem
        item={item}
        user={user}
        activeVideoKey={activeVideoKey ?? ''}
        CommunityMediaItem={CommunityMediaItem}
        onCall={handlers.onCall}
        onWhatsApp={handlers.onWhatsApp}
        onResolve={handlers.onResolve}
        onShare={handlers.onShare}
        onFullScreenMedia={handlers.onFullScreenMedia}
        styles={styles}
      />
    );
  }

  if (activeTab === 'Temple Updates') {
    return (
      <FeedPostItem
        item={item}
        combinedDataIndexMap={combinedDataIndexMap}
        combinedData={combinedData}
        user={user}
        activeVideoKey={activeVideoKey ?? ''}
        CommunityMediaItem={CommunityMediaItem}
        onLike={handlers.onLike}
        onRepost={handlers.onRepost}
        onShare={handlers.onShare}
        onComment={handlers.onComment}
        onDelete={handlers.onDelete}
        onReport={handlers.onReport}
        onFullScreenMedia={handlers.onFullScreenMedia}
        onOpenMap={handlers.onOpenMap}
        styles={styles}
      />
    );
  }

  if (activeTab === 'Lost & Found') {
    return (
      <RequestItem
        item={item}
        user={user}
        interestMap={interestMap}
        activeVideoKey={activeVideoKey ?? ''}
        CommunityMediaItem={CommunityMediaItem}
        onCall={handlers.onCall}
        onWhatsApp={handlers.onWhatsApp}
        onResolve={handlers.onResolve}
        onShare={handlers.onShare}
        onToggleInterest={handlers.onToggleInterest}
        onOpenMap={handlers.onOpenMap}
        onFullScreenMedia={handlers.onFullScreenMedia}
        styles={styles}
      />
    );
  }

  if (item.isRequestItem || item.type === 'request_item') {
    return (
      <RequestItem
        item={item}
        user={user}
        interestMap={interestMap}
        activeVideoKey={activeVideoKey ?? ''}
        CommunityMediaItem={CommunityMediaItem}
        onCall={handlers.onCall}
        onWhatsApp={handlers.onWhatsApp}
        onResolve={handlers.onResolve}
        onShare={handlers.onShare}
        onToggleInterest={handlers.onToggleInterest}
        onOpenMap={handlers.onOpenMap}
        onFullScreenMedia={handlers.onFullScreenMedia}
        styles={styles}
      />
    );
  }

  if (activeTab === 'Requests') {
    return (
      <RequestItem
        item={item}
        user={user}
        interestMap={interestMap}
        activeVideoKey={activeVideoKey ?? ''}
        CommunityMediaItem={CommunityMediaItem}
        onCall={handlers.onCall}
        onWhatsApp={handlers.onWhatsApp}
        onResolve={handlers.onResolve}
        onShare={handlers.onShare}
        onToggleInterest={handlers.onToggleInterest}
        onOpenMap={handlers.onOpenMap}
        onFullScreenMedia={handlers.onFullScreenMedia}
        styles={styles}
      />
    );
  }

  if (activeTab === 'Events') {
    return (
      <EventItem
        item={item}
        user={user}
        rsvpStates={rsvpStates}
        activeVideoKey={activeVideoKey ?? ''}
        CommunityMediaItem={CommunityMediaItem}
        onCall={handlers.onCall}
        onWhatsApp={handlers.onWhatsApp}
        onResolve={handlers.onResolve}
        onShare={handlers.onShare}
        onAttend={handlers.onAttend}
        onViewAttendees={handlers.onViewAttendees}
        onOpenMap={handlers.onOpenMap}
        onFullScreenMedia={handlers.onFullScreenMedia}
        styles={styles}
      />
    );
  }

  if (isLocked) {
    return (
      <View style={localStyles.lockedContainer}>
        <View style={localStyles.lockedIconWrapper}>
          <Ionicons name="lock-closed" size={28} color="#EA580C" />
        </View>
        <Text style={localStyles.lockedTitle}>
          Group Discussions Locked
        </Text>
        <Text style={localStyles.lockedSubtitle}>
          {lockReason ||
            'Personality Verification required to access State and National community discussions.'}
        </Text>
        <TouchableOpacity
          style={localStyles.lockedButton}
          onPress={handlers.onNavigateKyc}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-checkmark" size={16} color="#FFF" />
          <Text style={localStyles.lockedButtonText}>
            Verify Profile to Unlock
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FeedPostItem
      item={item}
      combinedDataIndexMap={combinedDataIndexMap}
      combinedData={combinedData}
      user={user}
      activeVideoKey={activeVideoKey ?? ''}
      CommunityMediaItem={CommunityMediaItem}
      onLike={handlers.onLike}
      onRepost={handlers.onRepost}
      onShare={handlers.onShare}
      onComment={handlers.onComment}
      onDelete={handlers.onDelete}
      onReport={handlers.onReport}
      onFullScreenMedia={handlers.onFullScreenMedia}
      onOpenMap={handlers.onOpenMap}
      styles={styles}
    />
  );
});

const localStyles = StyleSheet.create({
  festivalsHeader: {
    marginBottom: 10,
    zIndex: 3000,
    elevation: 10,
  },
  headerIconMargin: {
    marginRight: 10,
  },
  headerTitle22: {
    fontSize: 22,
  },
  dropdownContainerZIndex3001: {
    position: 'relative',
    zIndex: 3001,
  },
  dropdownScrollView: {
    maxHeight: 220,
  },
  festivalsListPadding: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  eventsHeader: {
    zIndex: 2000,
    elevation: 8,
  },
  headerTitle18: {
    fontSize: 18,
  },
  dropdownContainerZIndex2001: {
    position: 'relative',
    zIndex: 2001,
  },
  festBannerLeftTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerIconMarginRight8: {
    marginRight: 8,
  },
  lockedContainer: {
    margin: 20,
    padding: 24,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lockedIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#9A3412',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  lockedSubtitle: {
    fontSize: 13,
    color: '#C2410C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  lockedButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
