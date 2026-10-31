import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PlanetData,
  PlanetItemDisplay,
  ShadowPlanetDisplay,
} from '../../types/panchang';
import {
  CELESTIAL_EVENT_ICON,
  DEFAULT_MAIN_PLANETS_FALLBACK,
  DEFAULT_SATURN_FALLBACK,
  DEFAULT_SHADOW_PLANETS_FALLBACK,
  PLANET_DETAILS,
} from '../../constants/panchang';
import { formatPlanetDegree } from '../../utils/panchangTimeUtils';
import { styles } from './panchangStyles';

export interface PlanetsTabContentProps {
  planetsSource?: PlanetData[];
  onNavigateTransitCalendar?: () => void;
}

/**
 * 🎨 Varnish Optimization:
 * 1. Extracted helper functions `getPlanetFromApi` and `getShadowPlanetFromApi` outside component scope
 *    to eliminate function recreations per render and fix `react-hooks/exhaustive-deps` warnings in `useMemo`.
 * 2. Wrapped `PlanetsTabContent` in `React.memo` with explicit `displayName` to prevent redundant re-renders
 *    when parent Panchang container re-renders due to date or timer ticks.
 * 3. Extracted inline style objects for planet icons, celestial icon, and link row into `panchangStyles.ts`.
 * 4. Added `fadeDuration={0}` to all `<Image>` tags to prevent image flash during state re-renders on Android.
 * 5. Added accessibilityRole and label for screen reader compliance on transit calendar action.
 */
const getPlanetFromApi = (
  planetsSource: PlanetData[] | undefined,
  name: string,
  fallback: PlanetItemDisplay
): PlanetItemDisplay => {
  if (!planetsSource || !Array.isArray(planetsSource)) return fallback;
  const apiPlanet = planetsSource.find(
    (p: PlanetData) => (p.name || '').toLowerCase() === name.toLowerCase()
  );
  if (!apiPlanet) return fallback;

  const motion: 'DIRECT' | 'RETRO' =
    apiPlanet.isRetro === 'true' || apiPlanet.isRetro === true
      ? 'RETRO'
      : 'DIRECT';
  const degreeVal = apiPlanet.normDegree ?? apiPlanet.normdegree;

  return {
    name,
    sanskrit: PLANET_DETAILS[name]?.sanskrit || name.toUpperCase(),
    sign: apiPlanet.sign || fallback.sign,
    degree: degreeVal != null ? formatPlanetDegree(degreeVal) : fallback.degree,
    motion,
    desc: PLANET_DETAILS[name]?.desc || fallback.desc,
    icon: PLANET_DETAILS[name]?.icon || fallback.icon,
  };
};

const getShadowPlanetFromApi = (
  planetsSource: PlanetData[] | undefined,
  name: string,
  fallback: ShadowPlanetDisplay
): ShadowPlanetDisplay => {
  if (!planetsSource || !Array.isArray(planetsSource)) return fallback;
  const apiPlanet = planetsSource.find(
    (p: PlanetData) => (p.name || '').toLowerCase() === name.toLowerCase()
  );
  if (!apiPlanet) return fallback;

  const degreeVal = apiPlanet.normDegree ?? apiPlanet.normdegree;
  const formattedDegree = degreeVal != null ? formatPlanetDegree(degreeVal) : '';
  const sign = apiPlanet.sign || '';

  return {
    name,
    signDegree:
      sign && formattedDegree ? `${sign} • ${formattedDegree}` : fallback.signDegree,
    meaning: name === 'Rahu' ? 'TRANSFORMATION' : 'WISDOM',
    icon: PLANET_DETAILS[name]?.icon || fallback.icon,
  };
};

export const PlanetsTabContent: React.FC<PlanetsTabContentProps> = React.memo(({
  planetsSource,
  onNavigateTransitCalendar,
}) => {
  const mainPlanets = useMemo(() => [
    getPlanetFromApi(planetsSource, 'Sun', DEFAULT_MAIN_PLANETS_FALLBACK[0]),
    getPlanetFromApi(planetsSource, 'Moon', DEFAULT_MAIN_PLANETS_FALLBACK[1]),
    getPlanetFromApi(planetsSource, 'Jupiter', DEFAULT_MAIN_PLANETS_FALLBACK[2]),
    getPlanetFromApi(planetsSource, 'Mars', DEFAULT_MAIN_PLANETS_FALLBACK[3]),
  ], [planetsSource]);

  const shadowPlanets = useMemo(() => [
    getShadowPlanetFromApi(planetsSource, 'Rahu', DEFAULT_SHADOW_PLANETS_FALLBACK[0]),
    getShadowPlanetFromApi(planetsSource, 'Ketu', DEFAULT_SHADOW_PLANETS_FALLBACK[1]),
  ], [planetsSource]);

  const saturnData = useMemo(() => {
    return getPlanetFromApi(planetsSource, 'Saturn', DEFAULT_SATURN_FALLBACK);
  }, [planetsSource]);

  return (
    <View style={styles.planetsTabContent}>
      {/* Main Planets */}
      {mainPlanets.map((p: PlanetItemDisplay, idx: number) => (
        <View key={`${p.name}-${idx}`} style={styles.planetCardNew}>
          <View style={styles.planetHeaderNew}>
            <View style={styles.planetHeaderLeft}>
              <Image
                source={p.icon}
                style={styles.planetIcon}
                resizeMode="contain"
                fadeDuration={0}
              />
              <View style={styles.planetNameCol}>
                <Text style={styles.planetNameNew}>{p.name}</Text>
                <Text style={styles.planetSanskritNew}>{p.sanskrit}</Text>
              </View>
            </View>
            <View style={styles.planetHeaderRight}>
              <Text style={styles.planetSignNew}>{p.sign}</Text>
              <Text style={styles.planetDegreeNew}>{p.degree}</Text>
              <View style={styles.planetDot} />
              <Text
                style={[
                  styles.planetMotionNew,
                  p.motion === 'RETRO' ? styles.planetMotionRetro : null,
                ]}
              >
                {p.motion}
              </Text>
            </View>
          </View>
          <View style={styles.planetDescBox}>
            <Text style={styles.planetDescText}>{p.desc}</Text>
          </View>
        </View>
      ))}

      {/* Nodes (Rahu/Ketu) */}
      <View style={styles.nodesContainer}>
        {shadowPlanets.map((n: ShadowPlanetDisplay, idx: number) => (
          <View key={`${n.name}-${idx}`} style={styles.nodeCard}>
            <View style={styles.nodeHeader}>
              <Image
                source={n.icon}
                style={styles.planetIcon}
                resizeMode="contain"
                fadeDuration={0}
              />
              <Text style={styles.nodeName}>{n.name}</Text>
            </View>
            <Text style={styles.nodeSignDegree}>{n.signDegree}</Text>
            <Text style={styles.nodeMeaning}>{n.meaning}</Text>
          </View>
        ))}
      </View>

      {/* Saturn */}
      <View style={styles.planetCardNew}>
        <View style={styles.planetHeaderNew}>
          <View style={styles.planetHeaderLeft}>
            {saturnData.icon && (
              <Image
                source={saturnData.icon}
                style={styles.planetIcon}
                resizeMode="contain"
                fadeDuration={0}
              />
            )}
            <View style={styles.planetNameCol}>
              <Text style={styles.planetNameNew}>{saturnData.name}</Text>
              <Text style={styles.planetSanskritNew}>{saturnData.sanskrit}</Text>
            </View>
          </View>
          <View style={styles.planetHeaderRight}>
            <Text style={styles.planetSignNew}>{saturnData.sign}</Text>
            <Text style={styles.planetDegreeNew}>{saturnData.degree}</Text>
            <View style={styles.planetDot} />
            <Text
              style={[
                styles.planetMotionNew,
                saturnData.motion === 'RETRO' ? styles.planetMotionRetro : null,
              ]}
            >
              {saturnData.motion}
            </Text>
          </View>
        </View>
        <View style={styles.planetDescBox}>
          <Text style={styles.planetDescText}>{saturnData.desc}</Text>
        </View>
      </View>

      {/* Celestial Event */}
      <View style={styles.celestialCard}>
        <View style={styles.celestialIconBox}>
          <Image
            source={{ uri: CELESTIAL_EVENT_ICON }}
            style={styles.celestialIcon}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
        <View style={styles.celestialTextCol}>
          <View style={styles.celestialTopRow}>
            <Text style={styles.celestialLabel}>CELESTIAL EVENT</Text>
            <Text style={styles.celestialTime}>Tomorrow</Text>
          </View>
          <Text style={styles.celestialTitle}>Venus Transit Alert</Text>
          <Text style={styles.celestialDesc}>
            Venus enters Taurus tomorrow at 06:45 AM. Expect a surge in creative energy.
          </Text>
          <TouchableOpacity
            style={styles.celestialLinkRow}
            onPress={onNavigateTransitCalendar}
            accessibilityRole="button"
            accessibilityLabel="View Transit Calendar"
          >
            <Text style={styles.celestialLink}>View Transit Calendar</Text>
            <Ionicons
              name="arrow-forward"
              size={9.333}
              color="#994700"
              style={styles.celestialArrow}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

PlanetsTabContent.displayName = 'PlanetsTabContent';
