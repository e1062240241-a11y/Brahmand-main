/**
 * feedRanker.ts — Smart Feed Rotation Engine (8-Rule System)
 * Pure utility — NO UI, NO side effects other than AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ViewRecord {
  postId: string;
  viewCount: number;
  lastViewedAt: number; // unix ms
}

export type ViewHistory = Map<string, ViewRecord>;

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const HISTORY_KEY = (userId: string) => `@brahmand_view_history_${userId}`;
const LAST_TOP_KEY = (userId: string) => `@brahmand_last_top_${userId}`;
const LAST_IDX_KEY = (userId: string) => `@brahmand_last_idx_${userId}`;
const MAX_HISTORY = 500;

// ─── RULE 1: View History Load / Save ─────────────────────────────────────────

export async function loadViewHistory(userId: string): Promise<ViewHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY(userId));
    if (!raw) return new Map();
    const arr: ViewRecord[] = JSON.parse(raw);
    // Evict entries older than 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const fresh = arr.filter(r => r.lastViewedAt >= cutoff);
    return new Map(fresh.map(r => [r.postId, r]));
  } catch {
    return new Map();
  }
}

export async function saveViewHistory(userId: string, history: ViewHistory): Promise<void> {
  try {
    const arr = Array.from(history.values())
      .sort((a, b) => b.lastViewedAt - a.lastViewedAt)
      .slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY(userId), JSON.stringify(arr));
  } catch {}
}

/** Call when a post becomes active in the feed */
export function recordView(history: ViewHistory, postId: string): ViewHistory {
  const existing = history.get(postId);
  history.set(postId, {
    postId,
    viewCount: (existing?.viewCount ?? 0) + 1,
    lastViewedAt: Date.now(),
  });
  return history;
}

// ─── RULE 2: Freshness Scoring ────────────────────────────────────────────────

function freshnessScore(viewCount: number, createdAt: string | null): number {
  if (viewCount >= 5) return 0; // HIDE

  const ageMs = Date.now() - (createdAt ? new Date(createdAt).getTime() : Date.now());
  const ageHours = ageMs / 3_600_000;

  if (viewCount === 0) return 100;                       // Never seen
  if (viewCount === 1 && ageHours < 24) return 80;      // Seen once, last 24h
  if (viewCount === 1 && ageHours < 168) return 60;     // Seen once, last 7d
  if (viewCount === 2) return 40;
  if (viewCount === 3 || viewCount === 4) return 20;
  return 0;
}

// ─── RULE 7: Engagement Boost ─────────────────────────────────────────────────

function engagementBoost(post: any): number {
  const likes   = Number(post.likes_count   || post.likesCount   || 0);
  const comments = Number(post.comments_count || post.commentsCount || 0);
  const shares  = Number(post.shares_count  || post.sharesCount  || 0);
  const saves   = Number(post.saves_count   || post.savesCount   || 0);
  return likes * 1 + comments * 2 + shares * 3 + saves * 2;
}

// ─── Recency (for scoring formula) ───────────────────────────────────────────

function recencyScore(post: any): number {
  const ageMs = Date.now() - (post.created_at ? new Date(post.created_at).getTime() : Date.now());
  const ageHours = ageMs / 3_600_000;
  if (ageHours < 6)   return 100;
  if (ageHours < 24)  return 80;
  if (ageHours < 72)  return 50;
  if (ageHours < 168) return 30;
  return 10;
}

// ─── SCORING FORMULA ─────────────────────────────────────────────────────────

function finalScore(post: any, record: ViewRecord | undefined): number {
  const viewCount = record?.viewCount ?? 0;
  if (viewCount >= 5) return Number.NEGATIVE_INFINITY; // filter out

  const unseenBonus = viewCount === 0 ? 1 : 0;
  const rec = recencyScore(post);
  const eng = engagementBoost(post);
  const viewPenalty = viewCount;

  return (unseenBonus * 100) + (rec * 0.5) + (eng * 0.3) - (viewPenalty * 20);
}

// ─── RULE 6: Creator Diversity ────────────────────────────────────────────────

function creatorOf(post: any): string {
  return String(post.user_id || post.userId || post.username || '?');
}

function diversify(posts: any[]): any[] {
  if (posts.length <= 1) return posts;

  const result: any[] = [];
  const pending: any[] = [];

  for (const post of posts) {
    const cid = creatorOf(post);
    // Look at last 4 entries to ensure no same creator in 5 consecutive
    const tail = result.slice(-4).map(creatorOf);
    if (tail.includes(cid)) {
      pending.push(post);
    } else {
      result.push(post);
      // Try to insert a pending post of a different creator
      const idx = pending.findIndex(p => !tail.includes(creatorOf(p)));
      if (idx !== -1) result.push(...pending.splice(idx, 1));
    }
  }

  return [...result, ...pending];
}

// ─── RULE 6: Media-type mixing (Video → Image → Video → Image) ───────────────

function isVideo(post: any): boolean {
  const mt = String(post.media_type || post.mediaType || '').toLowerCase();
  return mt.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(post.media_url || ''));
}

function mixMedia(posts: any[]): any[] {
  if (posts.length <= 2) return posts;
  const videos = posts.filter(isVideo);
  const images = posts.filter(p => !isVideo(p));
  if (!videos.length || !images.length) return posts;

  const result: any[] = [];
  let vi = 0, ii = 0, lastV = false;
  while (vi < videos.length || ii < images.length) {
    if (!lastV && vi < videos.length)  { result.push(videos[vi++]); lastV = true;  }
    else if (ii < images.length)       { result.push(images[ii++]); lastV = false; }
    else if (vi < videos.length)       { result.push(videos[vi++]); }
  }
  return result;
}

// ─── RULE 4: Dynamic Starting Index ──────────────────────────────────────────

export async function getDynamicStartIndex(userId: string, poolSize: number): Promise<number> {
  if (poolSize <= 1) return 0;
  try {
    const raw = await AsyncStorage.getItem(LAST_IDX_KEY(userId));
    const last = raw ? parseInt(raw, 10) : 0;
    const step = Math.floor(Math.random() * 6) + 3; // 3..8
    const next = (last + step) % poolSize;
    await AsyncStorage.setItem(LAST_IDX_KEY(userId), String(next));
    return next;
  } catch {
    return 0;
  }
}

// ─── RULE 5: Last Top Post ────────────────────────────────────────────────────

export async function getLastTopPostId(userId: string): Promise<string | null> {
  try { return await AsyncStorage.getItem(LAST_TOP_KEY(userId)); } catch { return null; }
}

export async function saveLastTopPostId(userId: string, postId: string): Promise<void> {
  try { await AsyncStorage.setItem(LAST_TOP_KEY(userId), postId); } catch {}
}

// ─── RULE 8: Fallback blending ────────────────────────────────────────────────

function blendFallback(scored: { post: any; score: number; vc: number }[]): { post: any; score: number; vc: number }[] {
  const unseen = scored.filter(s => s.vc === 0);
  if (unseen.length >= 10) return scored; // Enough fresh content

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const oldSeen = scored.filter(s => {
    if (s.vc === 0) return false;
    const ts = s.post.created_at ? new Date(s.post.created_at).getTime() : 0;
    return ts < sevenDaysAgo;
  });
  const popular = [...scored]
    .sort((a, b) => engagementBoost(b.post) - engagementBoost(a.post))
    .slice(0, Math.max(1, Math.floor(scored.length * 0.1)));

  const total = scored.length;
  const take = (arr: typeof scored, pct: number) =>
    arr.sort((a, b) => b.score - a.score).slice(0, Math.round(total * pct));

  const blended = [
    ...take(unseen,  0.6),
    ...take(oldSeen, 0.3),
    ...take(popular, 0.1),
  ];

  return blended.length > 0 ? blended : scored;
}

// ─── MAIN RANK FUNCTION ───────────────────────────────────────────────────────

export interface RankOptions {
  history: ViewHistory;
  lastTopPostId?: string | null;
  /** IDs shown in THIS session (last 15) — Rule 5 */
  recentSessionIds?: string[];
}

export function rankPosts(posts: any[], opts: RankOptions): any[] {
  if (!posts || posts.length === 0) return posts;

  const { history, lastTopPostId, recentSessionIds = [] } = opts;
  const recentSet = new Set(recentSessionIds.slice(-15));

  // Score every post
  const scored = posts.map(post => {
    const id = String(post.id ?? '');
    const rec = history.get(id);
    return { post, score: finalScore(post, rec), vc: rec?.viewCount ?? 0 };
  });

  // Filter seen 5+ times
  const visible = scored.filter(s => s.score > Number.NEGATIVE_INFINITY);
  if (visible.length === 0) return posts; // Safety: show everything if all filtered

  // Rule 8: Fallback if < 10 unseen
  const blended = blendFallback(visible);

  // Sort by score descending
  blended.sort((a, b) => b.score - a.score);

  // Rule 5: Move posts seen in last 15 out of top 15 slots
  if (recentSet.size > 0) {
    const top = blended.slice(0, 15);
    const rest = blended.slice(15);
    const blocked = top.filter(s => recentSet.has(String(s.post.id ?? '')));
    const allowed = top.filter(s => !recentSet.has(String(s.post.id ?? '')));
    blended.splice(0, blended.length, ...allowed, ...blocked, ...rest);
  }

  // Rule 5: Don't repeat same #1 as last session's top
  if (lastTopPostId && blended.length > 1 && String(blended[0].post.id) === lastTopPostId) {
    [blended[0], blended[1]] = [blended[1], blended[0]];
  }

  let result = blended.map(s => s.post);

  // Rule 6: Creator diversity, then media mixing
  result = diversify(result);
  result = mixMedia(result);

  return result;
}
