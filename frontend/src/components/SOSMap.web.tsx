import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SOSMapProps {
  latitude?: number;
  longitude?: number;
}

export default function SOSMap({}: SOSMapProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={48} color="#D1D1D1" />
      <Text style={styles.text}>Map view available on Mobile App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  text: {
    color: '#8E8E93',
    marginTop: 8,
    fontWeight: '500',
  },
});
