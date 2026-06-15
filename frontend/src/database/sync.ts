import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'
import { api } from '../services/api'
import { secureStorage } from '../utils/secureStorage'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_COOLDOWN = 30000; // 30 seconds

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
            const requiredTables = [
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
              'passport_certificates'
            ];
            requiredTables.forEach(table => {
              if (!changes[table]) {
                changes[table] = { created: [], updated: [], deleted: [] };
              }
            });

            return { changes, timestamp };
          } catch (error) {
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
          } catch (error) {
            console.error('[Sync] Push changes failed:', error);
            throw error;
          }
        },
        sendCreatedAsUpdated: true,
      });
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}
