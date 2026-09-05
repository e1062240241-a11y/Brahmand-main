import { Platform } from 'react-native';
import { database } from '../database';
import { api } from './api';

let isFlushing = false;

// Serializes request data (handles both JSON objects and FormData)
export function serializePayload(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  
  // Handle FormData
  if (data instanceof FormData) {
    const serialized: Record<string, any> = { _isFormData: true, fields: {} };
    // Axios FormDatas usually have _parts on native React Native
    const parts = (data as any)._parts || [];
    for (const [key, value] of parts) {
      if (value && typeof value === 'object' && 'uri' in value) {
        serialized.fields[key] = {
          _isFile: true,
          uri: value.uri,
          name: value.name,
          type: value.type
        };
      } else {
        serialized.fields[key] = value;
      }
    }
    return JSON.stringify(serialized);
  }
  
  return JSON.stringify(data);
}

// Deserializes payload back into either JSON or FormData
export function deserializePayload(payloadStr: string): any {
  if (!payloadStr) return undefined;
  try {
    const parsed = JSON.parse(payloadStr);
    if (parsed && parsed._isFormData) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(parsed.fields)) {
        if (value && typeof value === 'object' && (value as any)._isFile) {
          formData.append(key, {
            uri: (value as any).uri,
            name: (value as any).name,
            type: (value as any).type
          } as any);
        } else {
          formData.append(key, value as any);
        }
      }
      return formData;
    }
    return parsed;
  } catch (e) {
    return payloadStr; // Return raw string if JSON parsing fails
  }
}

// Adds a request to the sync queue
export async function queueRequest(url: string, method: string, data: any) {
  let currentUserId = '';
  try {
    const { useAuthStore } = require('../store/authStore');
    currentUserId = useAuthStore.getState().user?.id || '';
  } catch (e) {
    console.warn('[SyncQueue] Could not resolve current user ID:', e);
  }

  const serialized = serializePayload(data);
  const wrappedPayload = JSON.stringify({
    _sync_userId: currentUserId,
    _sync_payload: serialized
  });

  const MAX_QUEUE_SIZE = 50;
  if (Platform.OS === 'web') {
    try {
      let queue = JSON.parse(localStorage.getItem('brahmand_sync_queue') || '[]');
      if (queue.length >= MAX_QUEUE_SIZE) {
        queue = queue.slice(queue.length - (MAX_QUEUE_SIZE - 1));
      }
      queue.push({ url, method, payload: wrappedPayload, created_at: Date.now() });
      localStorage.setItem('brahmand_sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('[SyncQueue] Web queue save failed:', e);
    }
    return;
  }

  try {
    await database.write(async () => {
      await database.get('sync_queue').create((record: any) => {
        record.url = url;
        record.method = method.toUpperCase();
        record.payload = wrappedPayload;
      });
    });
    console.log(`[SyncQueue] Queued offline request: ${method} ${url}`);
  } catch (err) {
    console.error('[SyncQueue] Failed to save request to database:', err);
  }
}

// Flushes the sync queue sequentially
export async function flushSyncQueue() {
  if (isFlushing) return;
  isFlushing = true;
  console.log('[SyncQueue] Checking sync queue for pending requests...');

  let currentUserId = '';
  try {
    const { useAuthStore } = require('../store/authStore');
    currentUserId = useAuthStore.getState().user?.id || '';
  } catch (e) {
    console.warn('[SyncQueue] Could not resolve current user ID:', e);
  }

  try {
    if (Platform.OS === 'web') {
      const queue = JSON.parse(localStorage.getItem('brahmand_sync_queue') || '[]');
      if (queue.length === 0) {
        isFlushing = false;
        return;
      }
      console.log(`[SyncQueue] Web flushing ${queue.length} requests...`);
      const remaining: any[] = [];
      for (const item of queue) {
        let payloadStr = item.payload;
        let recordUserId = '';
        try {
          const parsedWrapper = JSON.parse(item.payload);
          if (parsedWrapper && typeof parsedWrapper === 'object' && '_sync_payload' in parsedWrapper) {
            payloadStr = parsedWrapper._sync_payload;
            recordUserId = parsedWrapper._sync_userId || '';
          }
        } catch (e) {
          // Legacy payload
        }

        // Verify session matches
        if (recordUserId && recordUserId !== currentUserId) {
          console.warn(`[SyncQueue] User session changed from ${recordUserId} to ${currentUserId}. Discarding request ${item.method} ${item.url}`);
          continue; // Discard by skipping
        }

        try {
          const payload = deserializePayload(payloadStr);
          await api({
            url: item.url,
            method: item.method,
            data: payload,
            headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
          });
        } catch (err: any) {
          const status = err.response?.status;
          if (status && status >= 400 && status < 500) {
            console.warn(`[SyncQueue] Web request failed with client error ${status}. Discarding: ${item.method} ${item.url}`);
          } else {
            console.warn(`[SyncQueue] Web request failed to retry: ${item.method} ${item.url}`, err);
            remaining.push(item);
          }
        }
      }
      localStorage.setItem('brahmand_sync_queue', JSON.stringify(remaining));
      isFlushing = false;
      return;
    }

    // Native database query
    const syncQueueCollection = database.get('sync_queue');
    const pending = await syncQueueCollection.query().fetch();
    if (pending.length === 0) {
      console.log('[SyncQueue] Queue is empty.');
      isFlushing = false;
      return;
    }

    console.log(`[SyncQueue] Flushing ${pending.length} pending requests...`);
    // Sort oldest first
    const sorted = [...pending].sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const item of sorted) {
      let payloadStr = item.payload;
      let recordUserId = '';
      try {
        const parsedWrapper = JSON.parse(item.payload);
        if (parsedWrapper && typeof parsedWrapper === 'object' && '_sync_payload' in parsedWrapper) {
          payloadStr = parsedWrapper._sync_payload;
          recordUserId = parsedWrapper._sync_userId || '';
        }
      } catch (e) {
        // Legacy payload
      }

      // Check session context
      if (recordUserId && recordUserId !== currentUserId) {
        console.warn(`[SyncQueue] User session changed from ${recordUserId} to ${currentUserId}. Discarding request ${item.method} ${item.url}`);
        await database.write(async () => {
          await item.destroyPermanently();
        });
        continue;
      }

      const payload = deserializePayload(payloadStr);
      try {
        console.log(`[SyncQueue] Retrying request: ${item.method} ${item.url}`);
        await api({
          url: item.url,
          method: item.method,
          data: payload,
          headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });

        // Delete from queue on success
        await database.write(async () => {
          await item.destroyPermanently();
        });
        console.log(`[SyncQueue] Successfully synced and removed: ${item.method} ${item.url}`);
      } catch (err: any) {
        const status = err.response?.status;
        if (status && status >= 400 && status < 500) {
          console.warn(`[SyncQueue] Request failed with client error ${status}. Discarding: ${item.method} ${item.url}`);
          await database.write(async () => {
            await item.destroyPermanently();
          });
        } else {
          console.warn(`[SyncQueue] Request failed to sync (will retry later): ${item.method} ${item.url}`, err.message || err);
          // Stop flushing subsequent requests if there's a connection/server failure
          break;
        }
      }
    }
  } catch (err) {
    console.error('[SyncQueue] Error flushing queue:', err);
  } finally {
    isFlushing = false;
  }
}

// Check if network is online using a lightweight fetch
async function isOnline(): Promise<boolean> {
  if (Platform.OS === 'web' || typeof window !== 'undefined') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    let res = null;
    try {
      res = await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', signal: controller.signal });
    } catch (err) {
      res = null;
    }
    clearTimeout(timeout);
    return !!res;
  } catch {
    return false;
  }
}

// Start monitoring connection changes to automatically flush
export function initSyncQueueListener() {
  console.log('[SyncQueue] Initializing sync queue listener...');

  // Do a first-time flush in case we start connected
  isOnline().then((online) => {
    if (online) flushSyncQueue();
  });

  // Poll every 15 seconds and flush if online
  const intervalId = setInterval(async () => {
    const online = await isOnline();
    if (online) {
      flushSyncQueue();
    }
  }, 15000);

  // Return cleanup function (call this if you ever unmount)
  return () => clearInterval(intervalId);
}

