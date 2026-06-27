import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface JyotishState {
  dob: string | null;
  tob: string | null;
  pob: string | null;
  setBirthDetails: (dob: string, tob: string, pob: string) => Promise<void>;
  loadBirthDetails: () => Promise<void>;
}

export const useJyotishStore = create<JyotishState>((set) => ({
  dob: null,
  tob: null,
  pob: null,
  setBirthDetails: async (dob, tob, pob) => {
    if (Platform.OS === 'android') {
      const invalidStrings = new Set(['nan', 'none', 'undefined']);
      const cleanInput = (val: string) => {
        if (!val) return '';
        if (invalidStrings.has(val.toLowerCase().trim())) return '';
        return val;
      };
      dob = cleanInput(dob);
      tob = cleanInput(tob);
      pob = cleanInput(pob);
    }
    let dobStr = dob;
    if (dob) {
      const parsedDate = new Date(dob);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        dobStr = `${year}-${month}-${day}`;
      }
    }

    await AsyncStorage.setItem('jyotish:dob', dobStr);
    await AsyncStorage.setItem('jyotish:tob', tob.trim());
    await AsyncStorage.setItem('jyotish:pob', pob.trim());
    set({ dob: dobStr, tob: tob.trim(), pob: pob.trim() });

    try {
      const { useAuthStore } = require('./authStore');
      const { updateExtendedProfile } = require('../services/api');
      
      let lat = undefined;
      let lon = undefined;
      try {
        const Location = require('expo-location');
        const results = await Location.geocodeAsync(pob.trim());
        if (Array.isArray(results) && results.length > 0) {
          lat = results[0].latitude;
          lon = results[0].longitude;
        }
      } catch (err) {
        try {
          const q = encodeURIComponent(pob.trim());
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lon = parseFloat(data[0].lon);
          }
        } catch {}
      }

      const response = await updateExtendedProfile({
        date_of_birth: dobStr,
        time_of_birth: tob.trim(),
        place_of_birth: pob.trim(),
        place_of_birth_latitude: lat,
        place_of_birth_longitude: lon,
      });

      useAuthStore.getState().updateUser({
        ...(response.data || {}),
        date_of_birth: dobStr,
        time_of_birth: tob.trim(),
        place_of_birth: pob.trim(),
        place_of_birth_latitude: lat || useAuthStore.getState().user?.place_of_birth_latitude,
        place_of_birth_longitude: lon || useAuthStore.getState().user?.place_of_birth_longitude,
      });
    } catch (e) {
      console.warn('Failed to save birth details to backend from jyotishStore:', e);
    }
  },
  loadBirthDetails: async () => {
    try {
      const { useAuthStore } = require('./authStore');
      const user = useAuthStore.getState().user;

      let dob: string | null = null;
      let tob: string | null = null;
      let pob: string | null = null;

      const clean = (val: any) => {
        if (!val || typeof val !== 'string') return null;
        const invalidStrings = new Set(['nan', 'none', 'undefined']);
        if (invalidStrings.has(val.toLowerCase().trim())) return null;
        return val;
      };

      // Primary source of truth: backend-synced authStore user (kept fresh by loadStoredAuth)
      if (user && user.date_of_birth && user.time_of_birth && user.place_of_birth) {
        dob = user.date_of_birth;
        tob = user.time_of_birth;
        pob = user.place_of_birth;

        if (Platform.OS === 'android') {
          dob = clean(dob);
          tob = clean(tob);
          pob = clean(pob);
        }

        // Keep AsyncStorage in sync for offline access
        if (dob && tob && pob) {
          await AsyncStorage.setItem('jyotish:dob', dob!);
          await AsyncStorage.setItem('jyotish:tob', tob!);
          await AsyncStorage.setItem('jyotish:pob', pob!);
        }
      } else {
        // Fallback: AsyncStorage (handles offline / session-restore before network call completes)
        dob = await AsyncStorage.getItem('jyotish:dob');
        tob = await AsyncStorage.getItem('jyotish:tob');
        pob = await AsyncStorage.getItem('jyotish:pob');

        if (Platform.OS === 'android') {
          dob = clean(dob);
          tob = clean(tob);
          pob = clean(pob);
        }
      }

      set({ dob, tob, pob });
    } catch (e) {
      console.warn('Failed to load jyotish details', e);
    }
  }
}));
