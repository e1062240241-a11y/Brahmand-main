import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

const SOCKET_URL = API_URL;

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: Map<string, (message: any) => void> = new Map();
  private connectPromise: Promise<void> | null = null;

  async connect() {
    if (this.socket?.connected) return;
    if (this.connectPromise) return this.connectPromise;

    const token = await AsyncStorage.getItem('auth_token');

    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

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

    this.connectPromise = new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'));

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onConnectError = (err: any) => {
        cleanup();
        reject(err);
      };

      const onConnectTimeout = setTimeout(() => {
        cleanup();
        reject(new Error('Socket connect timed out'));
      }, 8000);

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

  joinRoom(room: string) {
    if (!this.socket) return;

    const join = () => {
      if (this.socket) {
        this.socket.emit('join_room', { room });
      }
    };

    if (this.socket.connected) {
      join();
    } else {
      this.socket.once('connect', join);
    }
  }

  leaveRoom(room: string) {
    if (this.socket) {
      this.socket.emit('leave_room', { room });
    }
  }

  onMessage(id: string, callback: (message: any) => void) {
    this.messageCallbacks.set(id, callback);
  }

  offMessage(id: string) {
    this.messageCallbacks.delete(id);
  }
}

export const socketService = new SocketService();
