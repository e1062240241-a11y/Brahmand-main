import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'
import { api } from '../services/api'
import { secureStorage } from '../utils/secureStorage'
import { Platform } from 'react-native'

export async function syncDatabase() {
  if (Platform.OS === 'web') {
    return;
  }

  const token = await secureStorage.getItem('auth_token');
  if (!token) {
    console.log('[Sync] User not authenticated, skipping sync');
    return;
  }

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
}
