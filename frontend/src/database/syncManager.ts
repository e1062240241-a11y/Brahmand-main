import { AppState, AppStateStatus, InteractionManager, Platform } from 'react-native';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { syncDatabase } from './sync';

const THROTTLE_WINDOW_MS = 5000;

class SyncManagerClass {
  private lastSyncTime: number = 0;
  private isSyncing: boolean = false;
  private isOnline: boolean = true;
  private appState: AppStateStatus = AppState.currentState;

  private queuedSync: boolean = false;

  private netInfoUnsubscribe?: NetInfoSubscription;
  private appStateSubscription?: { remove: () => void };

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    if (Platform.OS === 'web') return; // or let it run, but generally web handles sync differently

    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected && !!state.isInternetReachable;

      if (wasOffline && this.isOnline && this.queuedSync) {
        if (__DEV__) console.log('[SyncManager] Network restored. Processing queued sync.');
        this.processQueuedSync();
      }
    });

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const wasBackground = this.appState.match(/inactive|background/);
      this.appState = nextAppState;

      if (wasBackground && this.appState === 'active' && this.queuedSync) {
        if (__DEV__) console.log('[SyncManager] App came to foreground. Processing queued sync.');
        this.processQueuedSync();
      }
    });
  }

  private processQueuedSync() {
    this.queuedSync = false;
    this.requestSync(true); // Ignore throttle for queued syncs if desired, or let it throttle normally.
  }

  /**
   * Requests a database synchronization.
   * Uses a leading-edge throttle. The first call executes immediately (deferred until after interactions).
   * Subsequent calls within the THROTTLE_WINDOW_MS are ignored.
   */
  public requestSync(forceQueueBypass: boolean = false): void {
    if (Platform.OS === 'web') return;

    if (!this.isOnline) {
      if (__DEV__) console.log('[SyncManager] Offline. Queueing sync.');
      this.queuedSync = true;
      return;
    }

    if (this.appState !== 'active') {
      if (__DEV__) console.log('[SyncManager] App in background. Queueing sync.');
      this.queuedSync = true;
      return;
    }

    const now = Date.now();
    if (!forceQueueBypass && (now - this.lastSyncTime < THROTTLE_WINDOW_MS)) {
      if (__DEV__) console.log('[SyncManager] Sync throttled.');
      return;
    }

    if (this.isSyncing) {
      if (__DEV__) console.log('[SyncManager] Sync already in progress.');
      return;
    }

    // Set lastSyncTime immediately for leading-edge throttle
    this.lastSyncTime = now;
    this.isSyncing = true;

    // Defer actual sync execution to not block UI/navigation
    InteractionManager.runAfterInteractions(() => {
      syncDatabase()
        .catch((err) => {
          console.warn('[SyncManager] Sync failed:', err);
        })
        .finally(() => {
          this.isSyncing = false;
        });
    });
  }

  public cleanup() {
    if (this.netInfoUnsubscribe) this.netInfoUnsubscribe();
    if (this.appStateSubscription) this.appStateSubscription.remove();
  }
}

export const SyncManager = new SyncManagerClass();
