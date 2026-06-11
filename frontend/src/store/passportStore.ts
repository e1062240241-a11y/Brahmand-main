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
  daily_hanuman_count?: Record<string, number>;
  daily_other_jaap_count?: Record<string, number>;
  loadPassport: () => Promise<void>;
  addJourney: (journey: Omit<PassportJourney, 'id' | 'generated_story'>) => Promise<void>;
  awardBadge: (title: string, description: string) => Promise<void>;
  addJaap: (count: number, mantraType?: string) => Promise<void>;
  completeBook: (book_name: string, completion_days: number, date: string) => Promise<void>;
}

const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

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
        set({ journeys: [], badges: [], certificates: [], total_jaap: 0, books_completed: 0, daily_hanuman_count: {}, daily_other_jaap_count: {} });
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
        daily_hanuman_count: nextState.daily_hanuman_count,
        daily_other_jaap_count: nextState.daily_other_jaap_count,
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
        daily_hanuman_count: nextState.daily_hanuman_count,
        daily_other_jaap_count: nextState.daily_other_jaap_count,
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

  addJaap: async (count, mantraType) => {
    const today = getLocalDateString();
    set((state) => {
      const isHanuman = mantraType === 'hanuman';
      const nextDailyHanuman = { ...(state.daily_hanuman_count || {}) };
      const nextDailyOther = { ...(state.daily_other_jaap_count || {}) };

      if (isHanuman) {
        nextDailyHanuman[today] = (nextDailyHanuman[today] || 0) + count;
      } else {
        nextDailyOther[today] = (nextDailyOther[today] || 0) + count;
      }

      const nextState = {
        ...state,
        total_jaap: state.total_jaap + count,
        daily_hanuman_count: nextDailyHanuman,
        daily_other_jaap_count: nextDailyOther,
      };

      persistPassportState({
        journeys: nextState.journeys,
        badges: nextState.badges,
        certificates: nextState.certificates,
        total_jaap: nextState.total_jaap,
        books_completed: nextState.books_completed,
        daily_hanuman_count: nextState.daily_hanuman_count,
        daily_other_jaap_count: nextState.daily_other_jaap_count,
      });
      return nextState;
    });

    // Check if daily target met
    const current = get();
    const hanumanCount = current.daily_hanuman_count?.[today] || 0;
    const otherCount = current.daily_other_jaap_count?.[today] || 0;

    // Target: 1 Hanuman Chalisa (>=1) AND 5 Malas of other jaaps (>= 5 * 108 = 540)
    if (hanumanCount >= 1 && otherCount >= 540) {
      const badgeTitle = `Daily Jaap Sadhak - ${today}`;
      const badgeDescription = `Completed 1 Hanuman Chalisa and 5 Malas of other Jaap on ${today}.`;
      const alreadyAwarded = current.badges.some((b) => b.title === badgeTitle);
      if (!alreadyAwarded) {
        await current.awardBadge(badgeTitle, badgeDescription);
      }
    }
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
        daily_hanuman_count: nextState.daily_hanuman_count,
        daily_other_jaap_count: nextState.daily_other_jaap_count,
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
