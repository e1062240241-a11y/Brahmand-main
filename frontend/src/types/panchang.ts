export interface TimeDetail {
  hour?: number | string;
  minute?: number | string;
  Hours?: number | string;
  Minutes?: number | string;
  h?: number | string;
  m?: number | string;
}

export type TimeValue = string | TimeDetail | number;

export interface AdvancedPanchangDetails {
  tithi_name?: string;
  nak_name?: string;
  yog_name?: string;
  karan_name?: string;
  special?: string;
  summary?: string;
}

export interface AdvancedPanchangItem {
  details?: AdvancedPanchangDetails;
  name?: string;
  start?: string;
  end?: string;
}

export interface AdvancedPanchangData {
  sunrise?: TimeValue;
  sunset?: TimeValue;
  moonrise?: TimeValue;
  moonset?: TimeValue;
  rahu_kaal?: string;
  gulika_kaal?: string;
  yamaganda?: string;
  tithi?: AdvancedPanchangItem;
  nakshatra?: AdvancedPanchangItem;
  yog?: AdvancedPanchangItem;
  karan?: AdvancedPanchangItem;
  [key: string]: unknown;
}

export interface OverviewItem {
  label: string;
  value: string;
  icon?: string;
}

export interface ChoghadiyaItem {
  muhurta: string;
  time: string;
  is_good: boolean;
}

export interface RawChoghadiyaItem {
  muhurta?: string;
  name?: string;
  time?: string;
  type?: string;
  is_good?: boolean;
}

export interface ChaughadiyaSourceMap {
  day?: RawChoghadiyaItem[];
  night?: RawChoghadiyaItem[];
  chaughadiya?: ChaughadiyaSourceData;
  [key: string]: unknown;
}

export type ChaughadiyaSourceData = ChaughadiyaSourceMap | RawChoghadiyaItem[];

export type HoraNatureType = 'good' | 'neutral' | 'bad';

export interface HoraNature {
  text: string;
  type: HoraNatureType;
}

export interface RawHoraItem {
  time?: string;
  hora?: string;
  name?: string;
  nature?: HoraNature;
}

export interface HoraItem {
  time: string;
  hora: string;
  nature: HoraNature;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface HoraSourceMap {
  day?: RawHoraItem[];
  night?: RawHoraItem[];
  hora?: HoraSourceData;
  [key: string]: unknown;
}

export type HoraSourceData = HoraSourceMap | RawHoraItem[];

export interface PlanetData {
  name: string;
  normDegree?: number;
  normdegree?: number;
  sign?: string;
  isRetro?: boolean | string;
  speed?: number;
}

export interface PlanetItemDisplay {
  name: string;
  sanskrit: string;
  sign: string;
  degree: string;
  motion: 'DIRECT' | 'RETRO';
  desc: string;
  icon: { uri: string };
}

export interface ShadowPlanetDisplay {
  name: string;
  signDegree: string;
  meaning: string;
  icon: { uri: string };
}

export interface PanchangSources {
  advanced_panchang?: AdvancedPanchangData;
  panchang_advanced?: AdvancedPanchangData;
  chaughadiya_muhurta?: ChaughadiyaSourceData;
  hora_muhurta?: HoraSourceData;
  planet_panchang?: PlanetData[];
}

export interface PanchangPayload {
  sources?: PanchangSources;
  overview?: OverviewItem[];
  chaughadiya?: ChaughadiyaSourceData;
  hora?: HoraSourceData;
  planets?: PlanetData[];
  sunrise?: TimeValue;
  sunset?: TimeValue;
  moonrise?: TimeValue;
  moonset?: TimeValue;
  rahu_kaal?: string;
  gulika_kaal?: string;
  yamaganda?: string;
  [key: string]: unknown;
}

export type TabType = 'panchang' | 'hora' | 'planets';
export type ChoghadiyaMode = 'day' | 'night';

export interface LocationCoords {
  lat?: number;
  lng?: number;
}
