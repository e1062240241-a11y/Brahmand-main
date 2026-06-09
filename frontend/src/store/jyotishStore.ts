import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    await AsyncStorage.setItem('jyotish:dob', dob);
    await AsyncStorage.setItem('jyotish:tob', tob);
    await AsyncStorage.setItem('jyotish:pob', pob);
    set({ dob, tob, pob });
  },
  loadBirthDetails: async () => {
    try {
      const dob = await AsyncStorage.getItem('jyotish:dob');
      const tob = await AsyncStorage.getItem('jyotish:tob');
      const pob = await AsyncStorage.getItem('jyotish:pob');
      set({ dob, tob, pob });
    } catch (e) {
      console.warn('Failed to load jyotish details', e);
    }
  }
}));
