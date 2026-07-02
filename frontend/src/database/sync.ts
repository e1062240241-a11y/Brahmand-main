import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'
import { api } from '../services/api'
import { secureStorage } from '../utils/secureStorage'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_COOLDOWN = 30000; // 30 seconds

const REQUIRED_TABLES = [
  'users',
  'feeds',
  'chats',
  'community_messages',
  'follows',
  'communities',
  'conversations',
  'library_progress',
  'passport_journeys',
  'passport_badges',
  'passport_certificates',
  'vendors',
  'temples',
  'sync_queue',
];

function buildEmptyChangeset(lastPulledAt: number | null) {
  const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {};
  REQUIRED_TABLES.forEach((t) => {
    changes[t] = { created: [], updated: [], deleted: [] };
  });
  return { changes, timestamp: lastPulledAt ?? 0 };
}

function isNetworkError(error: any): boolean {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.message === 'Network Error' ||
    error?.name === 'AbortError' ||
    !error?.response
  );
}

/**
 * Lightweight check to see if the backend is reachable before attempting sync.
 * Uses a short 5-second timeout so we fail fast when offline.
 */
async function checkBackendReachable(): Promise<boolean> {
  try {
    await api.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

let activeSyncPromise: Promise<void> | null = null;

export async function syncDatabase() {
  if (Platform.OS === 'web') {
    return;
  }

  if (activeSyncPromise) {
    console.log('[Sync] Synchronization already in progress, returning existing promise');
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    try {
      const token = await secureStorage.getItem('auth_token');
      if (!token) {
        console.log('[Sync] User not authenticated, skipping sync');
        return;
      }

      // Cooldown check to prevent redundant syncs during rapid navigation
      const lastSync = await AsyncStorage.getItem('watermelon_last_sync_timestamp');
      const now = Date.now();
      if (lastSync && now - parseInt(lastSync, 10) < SYNC_COOLDOWN) {
        console.log('[Sync] Cooldown active, skipping sync');
        return;
      }

      // Pre-sync network reachability check — skip immediately if offline
      const isReachable = await checkBackendReachable();
      if (!isReachable) {
        console.log('[Sync] Backend unreachable, skipping sync');
        return;
      }

      await AsyncStorage.setItem('watermelon_last_sync_timestamp', now.toString());

      await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion }) => {
          try {
            const response = await api.get('/sync/pull', {
              params: {
                last_pulled_at: lastPulledAt || 0,
                schema_version: schemaVersion,
              },
            });

            const { changes, timestamp } = response.data;

            // Ensure all tables exist in changes to avoid sync errors
            REQUIRED_TABLES.forEach((table) => {
              if (!changes[table]) {
                changes[table] = { created: [], updated: [], deleted: [] };
              }
            });

            return { changes, timestamp };
          } catch (error: any) {
            if (isNetworkError(error)) {
              // Return empty changeset so WatermelonDB sync completes cleanly
              // and the local DB is left completely untouched.
              console.warn('[Sync] Pull skipped — network unavailable');
              return buildEmptyChangeset(lastPulledAt ?? null);
            }

            console.error('[Sync] Pull changes failed:', error);
            throw error;
          }
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          try {
            await api.post('/sync/push', {
              changes,
              last_pulled_at: lastPulledAt,
            });
          } catch (error: any) {
            if (isNetworkError(error)) {
              // Don't throw; pending local changes will be retried on the next sync cycle
              console.warn('[Sync] Push skipped — network unavailable');
              return;
            }

            console.error('[Sync] Push changes failed:', error);
            throw error;
          }
        },
        sendCreatedAsUpdated: true,
      });

      console.log('[Sync] WatermelonDB synchronization complete');
    } catch (err: any) {
      // Top-level safety net: log but never propagate sync errors to callers.
      // A failed sync should never crash a screen or block the user.
      console.warn('[Sync] Synchronization failed (non-fatal):', err?.message || err);
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}
