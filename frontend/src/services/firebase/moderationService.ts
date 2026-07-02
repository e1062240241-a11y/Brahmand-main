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
import { blockUserApi, unblockUserApi, checkUserBlockedApi } from '../api';
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
  postId?: string;
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

  // Prevent duplicate reports by the same user for the same content
  try {
    const q = query(
      collection(db, 'moderation_reports'),
      where('reporterUid', '==', payload.reporterUid),
      where('contentId', '==', payload.contentId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      console.warn('[moderationService] Report already submitted for this content.');
      return snap.docs[0].id;
    }
  } catch (err) {
    console.warn('[moderationService] Duplicate check failed, proceeding with submit:', err);
  }

  const reportData: any = {
    reporterUid: payload.reporterUid,
    reportedUserUid: payload.reportedUserUid,
    contentId: payload.contentId,
    contentType: payload.contentType,
    reason: payload.reason,
    description: payload.description || '',
    status: 'pending' as ModerationStatus,
    createdAt: serverTimestamp(),
  };

  // Apple Guideline 1.2 Compliance - strict field requirements for comment reporting
  if (payload.contentType === 'comment') {
    reportData.commentId = payload.contentId;
    reportData.postId = payload.postId || '';
    reportData.commentOwnerId = payload.reportedUserUid;
    reportData.reporterUserId = payload.reporterUid;
    reportData.reportReason = payload.reason;
    reportData.timestamp = serverTimestamp();
  }

  const docRef = await addDoc(collection(db, 'moderation_reports'), reportData);

  return docRef.id;
}



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

/**
 * Get all UIDs of users who have blocked this user.
 */
export async function getUsersWhoBlockedMe(blockedUid: string): Promise<string[]> {
  const db = getDB();
  const q = query(
    collection(db, 'user_blocks'),
    where('blockedUid', '==', blockedUid),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().blockerUid as string);
}
