import { io, Socket } from 'socket.io-client';
import { AppState, Platform } from 'react-native';
import { API_URL } from './api';
import { secureStorage } from '../utils/secureStorage';

const SOCKET_URL = API_URL;

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: Map<string, (message: any) => void> = new Map();
  private eventCallbacks: Map<string, Set<(message: any) => void>> = new Map();
  private connectPromise: Promise<void> | null = null;
  private joinedRooms: Map<string, string | undefined> = new Map();
  private wantedConnection = false;
  private suspended = false;

  constructor() {
    if (Platform.OS === 'web') return;
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        this.suspend();
      } else if (nextAppState === 'active') {
        this.resume();
      }
    });
  }

  private suspend() {
    if (this.suspended) return;
    this.suspended = true;
    this.connectPromise = null;
    if (!this.socket) return;
    try {
      this.socket.io.reconnection(false);
    } catch (_e) {}
    try {
      this.socket.disconnect();
    } catch (_e) {}
  }

  private async resume() {
    if (!this.suspended) return;
    this.suspended = false;
    if (!this.wantedConnection) return;
    if (this.socket) {
      try {
        this.socket.io.reconnection(true);
      } catch (_e) {}
    }
    try {
      await this.connect();
    } catch (_e) {}
    const rooms = Array.from(this.joinedRooms.entries());
    for (const [room, peerId] of rooms) {
      try {
        await this.joinRoom(room, peerId);
      } catch (_e) {}
    }
  }

  async connect() {
    this.wantedConnection = true;
    if (this.suspended) return;
    if (this.socket?.connected) return;
    if (this.connectPromise) return this.connectPromise;

    const token = await secureStorage.getItem('auth_token');

    const isLocalTunnel = /^https:\/\/.*\.loca\.lt$/i.test(SOCKET_URL);
    const socketOptions: any = {
      path: '/socket.io',
      transports: Platform.OS === 'web' || isLocalTunnel ? ['polling'] : ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: isLocalTunnel ? 20000 : 10000,
      ...(Platform.OS === 'web' ? { upgrade: false, withCredentials: false } : {}),
    };

    if (Platform.OS !== 'web') {
      socketOptions.extraHeaders = {
        'bypass-tunnel-reminder': 'true',
      };
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, socketOptions);

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected', reason);
      });

      this.socket.on('new_message', (message) => {
        this.messageCallbacks.forEach((callback) => callback(message));
      });

      this.socket.on('new_dm', (message) => {
        this.messageCallbacks.forEach((callback) => callback(message));
      });

      for (const [eventName, callbacks] of this.eventCallbacks.entries()) {
        callbacks.forEach((callback) => {
          this.socket?.on(eventName, callback);
        });
      }
    } else if (!this.socket.connected) {
      // Socket exists but is (re)connecting; reuse it instead of creating a
      // duplicate. socket.io reconnection handles the rest.
      this.socket.connect();
    }

    this.connectPromise = new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'));
      const socket = this.socket;

      const connectTimeoutMs = isLocalTunnel ? 20000 : 10000;
      const onConnectTimeout = setTimeout(() => {
        cleanup();
        this.connectPromise = null;
        reject(new Error(`Socket connect timed out after ${connectTimeoutMs}ms`));
      }, connectTimeoutMs);

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onConnectError = (err: any) => {
        cleanup();
        this.connectPromise = null;
        reject(err);
      };

      const cleanup = () => {
        clearTimeout(onConnectTimeout);
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        socket.off('connect_timeout', onConnectError);
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onConnectError);
      socket.once('connect_timeout', onConnectError);
    });

    return this.connectPromise;
  }

  disconnect() {
    this.wantedConnection = false;
    this.suspended = false;
    this.joinedRooms.clear();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectPromise = null;
    this.messageCallbacks.clear();
    this.eventCallbacks.clear();
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  joinRoom(room: string, peerId?: string) {
    this.joinedRooms.set(room, peerId);
    if (this.suspended || !this.socket) return Promise.resolve();

    const payload: any = { room };
    if (peerId) payload.peerId = peerId;

    const join = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error('Socket not initialized'));
        this.socket.emit('join_room', payload, (response: any) => {
          resolve(response);
        });
      });
    };

    if (this.socket.connected) {
      return join();
    }

    const socket = this.socket;
    if (!socket) return Promise.reject(new Error('Socket not initialized'));

    return new Promise((resolve, reject) => {
      const onConnect = () => {
        if (!this.socket) return reject(new Error('Socket not initialized'));
        join().then(resolve).catch(reject);
      };
      socket.once('connect', onConnect);
    });
  }

  leaveRoom(room: string, peerId?: string) {
    this.joinedRooms.delete(room);
    if (this.socket) {
      const payload: any = { room };
      if (peerId) payload.peerId = peerId;
      this.socket.emit('leave_room', payload);
    }
  }

  onMessage(id: string, callback: (message: any) => void) {
    this.messageCallbacks.set(id, callback);
  }

  offMessage(id: string) {
    this.messageCallbacks.delete(id);
  }

  onEvent(eventName: string, callback: (message: any) => void) {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Set());
    }
    this.eventCallbacks.get(eventName)?.add(callback);
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  offEvent(eventName: string, callback: (message: any) => void) {
    this.eventCallbacks.get(eventName)?.delete(callback);
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  emit(eventName: string, data?: any) {
    if (!this.socket) return;
    this.socket.emit(eventName, data);
  }

  emitEvent(eventName: string, data?: any) {
    this.emit(eventName, data);
  }
}

export const socketService = new SocketService();
