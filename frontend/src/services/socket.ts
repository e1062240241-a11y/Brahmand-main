import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_URL } from './api';

const SOCKET_URL = API_URL;

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: Map<string, (message: any) => void> = new Map();
  private eventCallbacks: Map<string, Set<(message: any) => void>> = new Map();
  private connectPromise: Promise<void> | null = null;

  async connect() {
    if (this.socket?.connected) return;
    if (this.connectPromise) return this.connectPromise;

    const token = await AsyncStorage.getItem('auth_token');

    const isLocalTunnel = /^https:\/\/.*\.loca\.lt$/i.test(SOCKET_URL);
    const socketOptions: any = {
      path: '/socket.io',
      transports: Platform.OS === 'web' || isLocalTunnel ? ['polling'] : ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: isLocalTunnel ? 20000 : 10000,
      ...(Platform.OS === 'web' ? { upgrade: false, withCredentials: false } : {}),
    };

    if (Platform.OS !== 'web') {
      socketOptions.extraHeaders = {
        'bypass-tunnel-reminder': 'true',
      };
    }

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

    this.connectPromise = new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'));

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onConnectError = (err: any) => {
        cleanup();
        this.connectPromise = null;
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        reject(err);
      };

      const connectTimeoutMs = isLocalTunnel ? 20000 : 10000;
      const onConnectTimeout = setTimeout(() => {
        cleanup();
        this.connectPromise = null;
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        reject(new Error(`Socket connect timed out after ${connectTimeoutMs}ms`));
      }, connectTimeoutMs);

      const cleanup = () => {
        if (!this.socket) return;
        clearTimeout(onConnectTimeout);
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onConnectError);
        this.socket.off('connect_timeout', onConnectError);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onConnectError);
      this.socket.once('connect_timeout', onConnectError);
    });

    return this.connectPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectPromise = null;
  }

  joinRoom(room: string, peerId?: string) {
    if (!this.socket) return Promise.reject(new Error('Socket not connected'));

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
}

export const socketService = new SocketService();
