import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { HoraItem, HoraNatureType } from '../../types/panchang';
import { PLANET_ICONS } from '../../constants/panchang';
import { styles } from './panchangStyles';

export interface HoraTabContentProps {
  horaList: HoraItem[];
  activeHoraIdx: number;
  setActiveHoraIdx: (idx: number) => void;
  currentHoraIdx: number;
  onHoraItemLayout?: (idx: number, y: number) => void;
}

const getBadgeStyle = (type: HoraNatureType, isActive: boolean) => {
  if (type === 'good') return isActive ? styles.natureBadge_good_active : styles.natureBadge_good;
  if (type === 'neutral') return isActive ? styles.natureBadge_neutral_active : styles.natureBadge_neutral;
  return isActive ? styles.natureBadge_bad_active : styles.natureBadge_bad;
};

const getDotStyle = (type: HoraNatureType, isActive: boolean) => {
  if (type === 'good') return isActive ? styles.natureDot_good_active : styles.natureDot_good;
  if (type === 'neutral') return isActive ? styles.natureDot_neutral_active : styles.natureDot_neutral;
  return isActive ? styles.natureDot_bad_active : styles.natureDot_bad;
};

const getTextStyle = (type: HoraNatureType, isActive: boolean) => {
  if (type === 'good') return isActive ? styles.natureText_good_active : styles.natureText_good;
  if (type === 'neutral') return isActive ? styles.natureText_neutral_active : styles.natureText_neutral;
  return isActive ? styles.natureText_bad_active : styles.natureText_bad;
};

export const HoraTabContent: React.FC<HoraTabContentProps> = ({
  horaList,
  activeHoraIdx,
  setActiveHoraIdx,
  currentHoraIdx,
  onHoraItemLayout,
}) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.horaTimelineContainer}>
        {horaList.map((h: HoraItem, idx: number) => {
          const isLast = idx === horaList.length - 1;
          const isActive = idx === activeHoraIdx;
          const planetIcon = PLANET_ICONS[h.hora];

          return (
            <TouchableOpacity
              key={`${h.hora}-${idx}`}
              style={styles.horaTimelineRow}
              onPress={() => setActiveHoraIdx(idx)}
              activeOpacity={isActive ? 1 : 0.7}
              onLayout={(event) => {
                onHoraItemLayout?.(idx, event.nativeEvent.layout.y);
              }}
            >
              {/* Timeline Column */}
              <View style={styles.horaTimelineCol}>
                {!isLast && (
                  <View
                    style={
                      isActive
                        ? styles.horaTimelineLineActive
                        : styles.horaTimelineLine
                    }
                  />
                )}
                {isActive ? (
                  <View style={styles.horaTimelineDotActiveOuter}>
                    <View style={styles.horaTimelineDotActiveMiddle}>
                      <View style={styles.horaTimelineDotActiveInner} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.horaTimelineDotInactive} />
                )}
              </View>

              {/* Content Column */}
              <View style={styles.horaContentCol}>
                {isActive ? (
                  <View style={styles.horaActiveCard}>
                    {idx === currentHoraIdx && (
                      <View style={styles.horaActiveTopRow}>
                        <Text style={styles.horaActiveTitle}>CURRENT HORA</Text>
                        <View style={styles.horaActiveNowBadge}>
                          <Text style={styles.horaActiveNowText}>NOW</Text>
                        </View>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.horaActiveTime,
                        idx !== currentHoraIdx && { marginTop: 4 },
                      ]}
                    >
                      {h.time}
                    </Text>
                    <View style={styles.horaPlanetRowMain}>
                      <View style={styles.horaPlanetLeft}>
                        {planetIcon && (
                          <Image
                            source={planetIcon}
                            style={styles.horaPlanetIconActive}
                            resizeMode="contain"
                          />
                        )}
                        <Text style={styles.horaPlanetNameActive}>{h.hora}</Text>
                      </View>
                      <View style={[styles.natureBadge, getBadgeStyle(h.nature.type, true)]}>
                        <View style={[styles.natureDot, getDotStyle(h.nature.type, true)]} />
                        <Text style={[styles.natureText, getTextStyle(h.nature.type, true)]}>
                          {h.nature.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.horaInactiveBox,
                      idx === currentHoraIdx && {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      },
                    ]}
                  >
                    {idx === currentHoraIdx && (
                      <View style={[styles.horaActiveTopRow, { marginBottom: 8 }]}>
                        <Text style={styles.horaActiveTitle}>CURRENT HORA</Text>
                        <View style={styles.horaActiveNowBadge}>
                          <Text style={styles.horaActiveNowText}>NOW</Text>
                        </View>
                      </View>
                    )}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      <View style={styles.horaInactiveInfo}>
                        <Text style={styles.horaInactiveTime}>{h.time}</Text>
                        <View style={styles.horaPlanetLeft}>
                          {planetIcon && (
                            <Image
                              source={planetIcon}
                              style={styles.horaPlanetIcon}
                              resizeMode="contain"
                            />
                          )}
                          <Text style={styles.horaPlanetNameInactive}>{h.hora}</Text>
                        </View>
                      </View>
                      <View style={[styles.natureBadge, getBadgeStyle(h.nature.type, false)]}>
                        <View style={[styles.natureDot, getDotStyle(h.nature.type, false)]} />
                        <Text style={[styles.natureText, getTextStyle(h.nature.type, false)]}>
                          {h.nature.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
