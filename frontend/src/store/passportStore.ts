import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import { database } from '../database';
import { useAuthStore } from './authStore';
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
    const userId = useAuthStore.getState().user?.id;
    const storageKey = userId ? `brahmand_passport_data_${userId}` : PASSPORT_STORAGE_KEY;
    await secureStorage.setItem(storageKey, JSON.stringify(state));
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
      const userId = useAuthStore.getState().user?.id;
      const storageKey = userId ? `brahmand_passport_data_${userId}` : PASSPORT_STORAGE_KEY;
      const raw = await secureStorage.getItem(storageKey);
      if (!raw) {
        set({ journeys: [], badges: [], certificates: [], total_jaap: 0, books_completed: 0 });
        return;
      }
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

    // Write to WatermelonDB
    try {
      await database.write(async () => {
        await database.get('passport_journeys').create((record: any) => {
          record._raw.id = newJourney.id;
          record.location = newJourney.location;
          record.date = newJourney.date;
          record.story = newJourney.generated_story;
          record.rawAnswers = JSON.stringify({
            title: newJourney.title,
            media: newJourney.media,
            visibility: newJourney.visibility,
            answersList: newJourney.answers,
          });
        });
      });
    } catch (e) {
      console.warn('[PassportStore] DB write journey failed:', e);
    }
  },

  awardBadge: async (title, description) => {
    let targetBadge: any = null;
    set((state) => {
      const existingBadgeIndex = state.badges.findIndex((badge) => badge.title === title);
      const updatedBadges = [...state.badges];
      
      if (existingBadgeIndex !== -1) {
        const existing = updatedBadges[existingBadgeIndex];
        targetBadge = {
          ...existing,
          count: (existing.count || 1) + 1,
          earned_at: new Date().toISOString(),
        };
        updatedBadges[existingBadgeIndex] = targetBadge;
      } else {
        targetBadge = {
          id: `passport_badge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          description,
          earned_at: new Date().toISOString(),
          count: 1,
        };
        updatedBadges.push(targetBadge);
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

    if (targetBadge) {
      try {
        await database.write(async () => {
          const coll = database.get('passport_badges');
          try {
            const existing = await coll.find(targetBadge.id);
            await existing.update((record: any) => {
              record.count = targetBadge.count;
              record.earnedAt = targetBadge.earned_at;
            });
          } catch {
            await coll.create((record: any) => {
              record._raw.id = targetBadge.id;
              record.title = targetBadge.title;
              record.description = targetBadge.description;
              record.earnedAt = targetBadge.earned_at;
              record.count = targetBadge.count;
            });
          }
        });
      } catch (e) {}
    }
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
    const certId = `passport_certificate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => {
      const nextState = {
        ...state,
        books_completed: state.books_completed + 1,
        certificates: [
          ...state.certificates,
          {
            id: certId,
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

    try {
      await database.write(async () => {
        await database.get('passport_certificates').create((record: any) => {
          record._raw.id = certId;
          record.bookName = book_name;
          record.completionDays = completion_days;
          record.date = date;
        });
      });
    } catch (e) {}
  },
}));
