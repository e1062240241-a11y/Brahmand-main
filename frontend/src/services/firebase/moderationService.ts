/**
 * Firebase Moderation Service - Apple App Store Guideline 1.2 Compliance
 *
 * Handles:
 * - Content reports (posts, comments, profiles, communities, messages)
 * - User blocking (bidirectional visibility/messaging prevention)
 * - Moderation status tracking (pending/reviewed/removed/rejected)
 */

import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { initializeFirebase } from './config';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'sexual_content'
  | 'fake_profile'
  | 'scam_fraud'
  | 'other';

export type ContentType =
  | 'post'
  | 'comment'
  | 'user'
  | 'community'
  | 'message';

export type ModerationStatus =
  | 'pending'
  | 'reviewed'
  | 'removed'
  | 'rejected';

export interface ReportPayload {
  reporterUid: string;
  reportedUserUid: string;
  contentId: string;
  contentType: ContentType;
  reason: ReportReason;
  description?: string;
}

function getDB() {
  const app = initializeFirebase();
  return getFirestore(app);
}

/**
 * Submit a report and store it in Firebase Firestore.
 * Collection: moderation_reports
 */
export async function submitReport(payload: ReportPayload): Promise<string> {
  const db = getDB();

  const docRef = await addDoc(collection(db, 'moderation_reports'), {
    reporterUid: payload.reporterUid,
    reportedUserUid: payload.reportedUserUid,
    contentId: payload.contentId,
    contentType: payload.contentType,
    reason: payload.reason,
    description: payload.description || '',
    status: 'pending' as ModerationStatus,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

import { blockUserApi, unblockUserApi, checkUserBlockedApi } from '../api';

/**
 * Block a user. Stores the block in Firebase and backend.
 * Collection: user_blocks
 * Document ID: `${blockerUid}_${blockedUid}` for fast lookup.
 */
export async function blockUser(blockerUid: string, blockedUid: string): Promise<void> {
  // Call backend API first to perform block, which also writes to Firestore securely.
  await blockUserApi(blockedUid);

  try {
    const db = getDB();
    const docId = `${blockerUid}_${blockedUid}`;
    await setDoc(doc(db, 'user_blocks', docId), {
      blockerUid,
      blockedUid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[moderationService] Direct client Firebase block write failed (ignored):', error);
  }
}

/**
 * Unblock a user. Removes the block document from Firebase and backend.
 */
export async function unblockUser(blockerUid: string, blockedUid: string): Promise<void> {
  // Call backend API first to perform unblock, which also deletes from Firestore securely.
  await unblockUserApi(blockedUid);

  try {
    const db = getDB();
    const docId = `${blockerUid}_${blockedUid}`;
    await deleteDoc(doc(db, 'user_blocks', docId));
  } catch (error) {
    console.warn('[moderationService] Direct client Firebase unblock write failed (ignored):', error);
  }
}

/**
 * Check if blockerUid has blocked blockedUid.
 */
export async function isUserBlocked(
  blockerUid: string,
  blockedUid: string,
): Promise<boolean> {
  try {
    const res = await checkUserBlockedApi(blockedUid);
    return res.data?.is_blocked ?? false;
  } catch (error) {
    console.warn('[moderationService] checkUserBlockedApi failed, falling back to Firebase:', error);
    const db = getDB();
    const docId = `${blockerUid}_${blockedUid}`;
    const snap = await getDoc(doc(db, 'user_blocks', docId));
    return snap.exists();
  }
}

/**
 * Get all UIDs blocked by this user.
 */
export async function getBlockedUsers(blockerUid: string): Promise<string[]> {
  const db = getDB();
  const q = query(
    collection(db, 'user_blocks'),
    where('blockerUid', '==', blockerUid),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().blockedUid as string);
}
