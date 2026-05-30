import React, { useEffect, useRef } from 'react';
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
  const mapRef = useRef<any>(null);
  
  const lat = parseFloat(latitude as any);
  const lng = parseFloat(longitude as any);

  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [lat, lng]);

  if (Platform.OS === 'web' || !MapView || isNaN(lat) || isNaN(lng)) {
    return <View style={{ width: '100%', height: '100%', backgroundColor: '#F8F9FA' }} />;
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ width: '100%', height: '100%' }}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      showsUserLocation
      showsMyLocationButton
      onRegionChangeComplete={onRegionChange}
    >
      <Marker
        coordinate={{
          latitude: lat,
          longitude: lng,
        }}
        title="Emergency Location"
        pinColor="#FF3B30"
      />
    </MapView>
  );
}
