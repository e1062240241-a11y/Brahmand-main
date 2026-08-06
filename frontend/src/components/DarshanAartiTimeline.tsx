import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AartiItem {
  id: string;
  name: string;
  time: string;
  color: string;
  positionPercent: number; // 0 to 100 on the day timeline track
}

interface DarshanAartiTimelineProps {
  establishedYear?: string;
  entryFeeText?: string;
  bestTimeText?: string;
  openingTime?: string;
  closingTime?: string;
  aartis?: AartiItem[];
  vipInfoText?: string;
}

const DEFAULT_AARTIS: AartiItem[] = [
  { id: 'mangala', name: 'Mangala Aarti', time: '4:00 AM', color: '#2563EB', positionPercent: 0 },
  { id: 'bhog', name: 'Bhog Aarti', time: '1:00 PM', color: '#D97706', positionPercent: 53 },
  { id: 'sandhya', name: 'Sandhya Aarti', time: '6:30 PM', color: '#7C3AED', positionPercent: 85 },
];

export const DarshanAartiTimeline: React.FC<DarshanAartiTimelineProps> = ({
  establishedYear = '8th Century',
  entryFeeText = 'Free entry',
  bestTimeText = 'Best time: Oct – Mar',
  openingTime = '4:00 AM',
  closingTime = '9:00 PM',
  aartis = DEFAULT_AARTIS,
  vipInfoText = 'VIP / special darshan available',
}) => {
  return (
    <View style={styles.container}>
      {/* SECTION TITLE */}
      <Text style={styles.sectionTitle}>Darshan & Aarti</Text>

      {/* 2. DAY-TIMELINE BAR (CORE VISUAL ANCHOR) */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineSubHeader}>Temple Schedule Timeline</Text>

        {/* Start / End Labels Above Track */}
        <View style={styles.trackTimeHeader}>
          <Text style={styles.timeLabel}>{openingTime}</Text>
          <Text style={styles.timeLabel}>{closingTime}</Text>
        </View>

        {/* Bar Track with Open/Closed Segments & Aarti Pin Markers */}
        <View style={styles.trackContainer}>
          {/* Track background with split segments */}
          <View style={styles.trackBar}>
            {/* Segment 1: Morning Darshan Open */}
            <View style={[styles.openSegment, { flex: 0.68 }]} />
            {/* Segment 2: Afternoon Break Closed */}
            <View style={[styles.closedSegment, { flex: 0.15 }]} />
            {/* Segment 3: Evening Darshan Open */}
            <View style={[styles.openSegment, { flex: 0.17 }]} />
          </View>

          {/* Aarti Pin Markers pinned on top of the bar */}
          {aartis.map((aarti) => (
            <View
              key={aarti.id}
              style={[
                styles.aartiMarkerPin,
                { left: `${Math.min(Math.max(aarti.positionPercent, 2), 94)}%` },
              ]}
            >
              <View style={[styles.markerDot, { backgroundColor: aarti.color }]} />
            </View>
          ))}
        </View>

        {/* Caption Row Below Bar */}
        <View style={styles.captionRow}>
          <View style={styles.captionItem}>
            <View style={[styles.legendIndicator, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.captionText}>Darshan open</Text>
          </View>

          <View style={styles.captionItem}>
            <View style={[styles.legendIndicator, { backgroundColor: '#CBD5E1' }]} />
            <Text style={styles.captionText}>Closed 3:30–6 PM</Text>
          </View>

          <View style={styles.captionItem}>
            <View style={[styles.legendIndicator, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.captionText}>Darshan open</Text>
          </View>
        </View>
      </View>

      {/* 3. AARTI TIME LIST (Color Matched Rows) */}
      <View style={styles.aartiListContainer}>
        {aartis.map((item) => (
          <View key={item.id} style={styles.aartiRow}>
            <View style={styles.aartiLeftCol}>
              <View style={[styles.listColorDot, { backgroundColor: item.color }]} />
              <Text style={styles.aartiName}>{item.name}</Text>
            </View>
            <Text style={styles.aartiTime}>{item.time}</Text>
          </View>
        ))}
      </View>

      {/* 4. SPECIAL NOTE BANNER */}
      <View style={styles.vipBanner}>
        <Ionicons name="sparkles" size={15} color="#059669" />
        <Text style={styles.vipBannerText}>{vipInfoText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  /* 1. Quick Info Chips */
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },

  /* 2. Timeline Card & Bar Track */
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    padding: 16,
    marginBottom: 14,
  },
  timelineSubHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  trackTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  trackContainer: {
    height: 26,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  trackBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  openSegment: {
    backgroundColor: '#3B82F6', // Blue darshan open track segment
  },
  closedSegment: {
    backgroundColor: '#E2E8F0', // Neutral track segment for closed break
  },
  aartiMarkerPin: {
    position: 'absolute',
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    elevation: 2,
  },
  markerDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#F1F5F9',
  },
  captionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  captionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  /* 3. Aarti List Rows */
  aartiListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  aartiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  aartiLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  aartiName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  aartiTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* 4. VIP Banner */
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 0.5,
    borderColor: '#6EE7B7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vipBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
});
