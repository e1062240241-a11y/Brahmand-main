import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import {
  PassportAnswer,
  PassportCertificate,
  PassportJourney,
  PassportJourneyVisibility,
  PassportBadge,
} from '../types/passport';

const PASSPORT_STORAGE_KEY = 'brahmand_passport_data';

interface PassportState {
  journeys: PassportJourney[];
  badges: PassportBadge[];
  certificates: PassportCertificate[];
  total_jaap: number;
  books_completed: number;
  loadPassport: () => Promise<void>;
  addJourney: (journey: Omit<PassportJourney, 'id' | 'generated_story'>) => Promise<void>;
  awardBadge: (title: string, description: string) => Promise<void>;
  addJaap: (count: number) => Promise<void>;
  completeBook: (book_name: string, completion_days: number, date: string) => Promise<void>;
}

const generateJourneyStory = (journey: Omit<PassportJourney, 'id' | 'generated_story'>) => {
  const answersText = journey.answers
    .filter((item) => item.answer.trim())
    .map((item) => `${item.question} ${item.answer.trim()}`)
    .join(' ');

  return `On ${journey.date} I traveled to ${journey.location}. ${answersText} This journey is recorded as part of my Brahmand Passport.`;
};

const persistPassportState = async (state: Omit<PassportState, 'loadPassport' | 'addJourney' | 'awardBadge' | 'addJaap' | 'completeBook'>) => {
  try {
    await secureStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[PassportStore] Failed to persist passport data:', error);
  }
};

export const usePassportStore = create<PassportState>((set, get) => ({
  journeys: [],
  badges: [],
  certificates: [],
  total_jaap: 0,
  books_completed: 0,

  loadPassport: async () => {
    try {
      const raw = await secureStorage.getItem(PASSPORT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Omit<PassportState, 'loadPassport' | 'addJourney' | 'awardBadge' | 'addJaap' | 'completeBook'>;
      set(parsed);
    } catch (error) {
      console.warn('[PassportStore] Failed to load passport data:', error);
    }
  },

  addJourney: async (journey) => {
    const newJourney: PassportJourney = {
      id: `passport_journey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      generated_story: generateJourneyStory(journey),
      ...journey,
    };

    set((state) => {
      const nextState = {
        ...state,
        journeys: [newJourney, ...state.journeys],
      };
      persistPassportState({
        journeys: nextState.journeys,
        badges: nextState.badges,
        certificates: nextState.certificates,
        total_jaap: nextState.total_jaap,
        books_completed: nextState.books_completed,
      });
      return nextState;
    });
  },

  awardBadge: async (title, description) => {
    set((state) => {
      const existingBadgeIndex = state.badges.findIndex((badge) => badge.title === title);
      const updatedBadges = [...state.badges];
      
      if (existingBadgeIndex !== -1) {
        const existing = updatedBadges[existingBadgeIndex];
        updatedBadges[existingBadgeIndex] = {
          ...existing,
          count: (existing.count || 1) + 1,
          earned_at: new Date().toISOString(),
        };
      } else {
        updatedBadges.push({
          id: `passport_badge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          description,
          earned_at: new Date().toISOString(),
          count: 1,
        });
      }

      const nextState = {
        ...state,
        badges: updatedBadges,
      };
      persistPassportState({
        journeys: nextState.journeys,
        badges: nextState.badges,
        certificates: nextState.certificates,
        total_jaap: nextState.total_jaap,
        books_completed: nextState.books_completed,
      });
      return nextState;
    });
  },

  addJaap: async (count) => {
    set((state) => {
      const nextState = {
        ...state,
        total_jaap: state.total_jaap + count,
      };
      persistPassportState({
        journeys: nextState.journeys,
        badges: nextState.badges,
        certificates: nextState.certificates,
        total_jaap: nextState.total_jaap,
        books_completed: nextState.books_completed,
      });
      return nextState;
    });
  },

  completeBook: async (book_name, completion_days, date) => {
    set((state) => {
      const nextState = {
        ...state,
        books_completed: state.books_completed + 1,
        certificates: [
          ...state.certificates,
          {
            id: `passport_certificate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            book_name,
            completion_days,
            date,
          },
        ],
      };
      persistPassportState({
        journeys: nextState.journeys,
        badges: nextState.badges,
        certificates: nextState.certificates,
        total_jaap: nextState.total_jaap,
        books_completed: nextState.books_completed,
      });
      return nextState;
    });
  },
}));
