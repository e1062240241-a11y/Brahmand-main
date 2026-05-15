import React from 'react';
import { Platform, View } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('Native maps failed to load:', e);
  }
}

interface SOSMapProps {
  latitude: number;
  longitude: number;
  onRegionChange?: (region: any) => void;
}

export default function SOSMap({ latitude, longitude, onRegionChange }: SOSMapProps) {
  if (Platform.OS === 'web' || !MapView || !latitude || !longitude) {
    return <View style={{ width: '100%', height: '100%', backgroundColor: '#F8F9FA' }} />;
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ width: '100%', height: '100%' }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      region={{
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      showsUserLocation
      showsMyLocationButton
      onRegionChangeComplete={onRegionChange}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title="Emergency Location"
        pinColor="#FF3B30"
      />
    </MapView>
  );
}
