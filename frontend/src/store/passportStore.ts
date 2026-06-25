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
  addJourney: (journey: Omit<PassportJourney, 'id' | 'generated_story'>) => Promise<string>;
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
  const answers = Array.isArray(journey.answers) ? journey.answers : [];
  const answersText = answers
    .filter((item) => item && typeof item.answer === 'string' && item.answer.trim())
    .map((item) => `${item.question || ''} ${String(item.answer).trim()}`)
    .join(' ');

  return `On ${journey.date || ''} I traveled to ${journey.location || ''}. ${answersText} This journey is recorded as part of my Brahmand Passport.`;
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
      title: journey.title || 'My Spiritual Journey',
      location: journey.location || '',
      date: journey.date || new Date().toISOString().split('T')[0],
      answers: journey.answers || [],
      media: journey.media || [],
      visibility: journey.visibility || 'private',
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

        // Create a public feed post if the journey is public
        if (newJourney.visibility === 'public') {
          const currentUser = useAuthStore.getState().user;
          const userPhoto = currentUser?.photo || null;
          const username = currentUser?.name || 'User';

          // Get first media uri if present
          const firstMedia = Array.isArray(newJourney.media) && newJourney.media.length > 0 ? newJourney.media[0] : null;
          const mediaUrl = firstMedia?.uri || null;
          const mediaType = firstMedia?.type === 'video' ? 'video' : (mediaUrl ? 'image' : 'text');
          const caption = newJourney.generated_story || `${newJourney.title} at ${newJourney.location}`;
          const recordId = `post_journey_${newJourney.id.split('_').pop() || Date.now()}`;

          await database.get('feeds').create((record: any) => {
            record._raw.id = recordId;
            record.userId = currentUser?.id || '';
            record.username = username;
            record.userPhoto = userPhoto;
            record.mediaUrl = mediaUrl;
            record.mediaType = mediaType;
            record.caption = caption;
            record.likesCount = 0;
            record.commentsCount = 0;
            record.likedByMe = false;
          });

          // Optimistically inject into feed store and notify components
          try {
            const { useFeedStore } = require('./feedStore');
            const { DeviceEventEmitter } = require('react-native');
            const newPost = {
              id: recordId,
              user_id: currentUser?.id || '',
              username: username,
              user_photo: userPhoto,
              media_url: mediaUrl,
              media_type: mediaType,
              caption: caption,
              likes_count: 0,
              comments_count: 0,
              liked_by_me: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              views_count: 0,
              top_comments: []
            };

            const currentPosts = useFeedStore.getState().tabFeeds['for_you']?.posts || [];
            const currentOffset = useFeedStore.getState().tabFeeds['for_you']?.offset || 0;
            useFeedStore.getState().setTabFeed('for_you', {
              posts: [newPost, ...currentPosts],
              offset: currentOffset + 1,
            });

            DeviceEventEmitter.emit("post_uploaded", newPost);
          } catch (feedErr) {
            console.warn('[PassportStore] Optimistic feed update failed:', feedErr);
          }
        }
      });

      // Post to community chat if visibility is public (Shared in Community)
      if (newJourney.visibility === 'public') {
        // Run asynchronously to avoid blocking the main UI redirect thread
        (async () => {
          try {
            const { sendCommunityMessage, uploadChatMedia } = require('../services/api');
            const currentUser = useAuthStore.getState().user;
            const username = currentUser?.name || 'User';
            const userPhoto = currentUser?.photo || null;

            // Get first media uri if present
            const firstMedia = Array.isArray(newJourney.media) && newJourney.media.length > 0 ? newJourney.media[0] : null;
            const mediaUrl = firstMedia?.uri || null;
            const caption = newJourney.generated_story || `${newJourney.title} at ${newJourney.location}`;

            let uploadedMediaUrl = null;
            if (mediaUrl) {
              try {
                const fileExtension = mediaUrl.split('.').pop() || 'jpg';
                const fileMime = firstMedia?.type === 'video' ? `video/${fileExtension}` : `image/${fileExtension}`;
                const uploadRes = await uploadChatMedia({
                  uri: mediaUrl,
                  name: `passport_journey_${Date.now()}.${fileExtension}`,
                  type: fileMime
                });
                uploadedMediaUrl = uploadRes?.data?.media_url || null;
                console.log('[PassportStore] Successfully uploaded journey media for chat share:', uploadedMediaUrl);
              } catch (uploadErr) {
                console.warn('[PassportStore] Failed to upload media for community post, sending text-only fallback:', uploadErr);
              }
            }

            // Find the city community, fallback to 'mumbai-fallback'
            let communityId = 'mumbai-fallback';
            try {
              const localComms = await database.get('communities').query().fetch();
              const cityComm = localComms.find((c: any) => c.type === 'city');
              if (cityComm && cityComm.id) {
                communityId = cityComm.id;
              }
            } catch (dbErr) {
              console.warn('[PassportStore] Failed to query local communities for chat share:', dbErr);
            }

            const subgroupType = 'city';
            const content = `🚩 *Recorded a new Journey!* 🚩\n\nI just added a new journey to my Brahmand Passport: *${newJourney.title}* at *${newJourney.location}*.\n\n"${caption}"`;

            await sendCommunityMessage(
              communityId,
              subgroupType,
              content,
              uploadedMediaUrl ? (firstMedia?.type === 'video' ? 'video' : 'image') : 'text',
              undefined,
              uploadedMediaUrl || undefined
            );
            console.log(`[PassportStore] Successfully shared journey to community group ${communityId}`);
          } catch (chatErr) {
            console.warn('[PassportStore] Failed to share journey in community group chat:', chatErr);
          }
        })();
      }
    } catch (e) {
      console.warn('[PassportStore] DB write journey failed:', e);
    }

    return newJourney.id;
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
