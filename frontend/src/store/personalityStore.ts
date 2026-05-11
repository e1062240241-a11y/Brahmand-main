import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PersonalityData {
  // Level Selection
  level: 'state' | 'national' | null;
  
  // Personal Details
  fullName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  city: string;
  
  // Identity & Background
  profession: string;
  organization: string;
  areas: string[];
  experience: string;
  bio: string;
  
  // Documents
  docType: string;
  frontUrl: string | null;
  backUrl: string | null;
  additionalUrls: string[];
}

interface PersonalityStore {
  data: PersonalityData;
  updateData: (updates: Partial<PersonalityData>) => void;
  resetData: () => void;
}

const initialState: PersonalityData = {
  level: null,
  fullName: '',
  dob: '',
  gender: '',
  mobile: '',
  email: '',
  city: '',
  profession: '',
  organization: '',
  areas: [],
  experience: '',
  bio: '',
  docType: 'aadhaar',
  frontUrl: null,
  backUrl: null,
  additionalUrls: [],
};

export const usePersonalityStore = create<PersonalityStore>()(
  persist(
    (set) => ({
      data: initialState,
      updateData: (updates) => set((state) => ({ 
        data: { ...state.data, ...updates } 
      })),
      resetData: () => set({ data: initialState }),
    }),
    {
      name: 'personality-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      }
    }
  )
);
