import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getToken, onUnauthorized } from './api';

// ---------------------------------------------------------------------------
// Types matching backend chat.types.ts
// ---------------------------------------------------------------------------
export interface SendMessagePayload {
  threadId: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}

export interface JoinThreadPayload {
  threadId: string;
}

export interface MarkReadPayload {
  messageId: string;
}

export interface TypingPayload {
  threadId: string;
}

export interface MessageReceivedEvent {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
}

export interface MessageReadEvent {
  messageId: string;
  readAt: string;
}

export interface TypingEvent {
  threadId: string;
  userId: string;
}

export interface UserOnlineEvent {
  userId: string;
}

export interface UserOfflineEvent {
  userId: string;
}

export interface JoinedThreadEvent {
  threadId: string;
}

export interface ErrorEvent {
  message: string;
}

// Server → client event map
export interface ServerToClientEvents {
  'message:new': (data: MessageReceivedEvent) => void;
  'message_received': (data: MessageReceivedEvent) => void;
  'message:read': (data: MessageReadEvent) => void;
  'message_read': (data: MessageReadEvent) => void;
  'typing:start': (data: TypingEvent) => void;
  'typing:stop': (data: TypingEvent) => void;
  'typing': (data: TypingEvent) => void;
  'user:online': (data: UserOnlineEvent) => void;
  'user:offline': (data: UserOfflineEvent) => void;
  'joined_thread': (data: JoinedThreadEvent) => void;
  'error': (data: ErrorEvent) => void;
}

// Client → server event map
export interface ClientToServerEvents {
  'join_thread': (data: JoinThreadPayload) => void;
  'send_message': (data: SendMessagePayload) => void;
  'mark_read': (data: MarkReadPayload) => void;
  'typing:start': (data: TypingPayload) => void;
  'typing:stop': (data: TypingPayload) => void;
  'typing': (data: TypingPayload) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ---------------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------------
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3812/api' : 'https://p2ptax.smartlaunchhub.com/api');

// Derive WebSocket base from API URL (strip /api suffix)
const WS_BASE = BASE_URL.replace(/\/api$/, '');

// ---------------------------------------------------------------------------
// Singleton socket manager
// ---------------------------------------------------------------------------
let socket: TypedSocket | null = null;
let connectionState: ConnectionState = 'disconnected';
const stateListeners = new Set<() => void>();

function notifyStateListeners() {
  stateListeners.forEach((l) => l());
}

function setConnectionState(state: ConnectionState) {
  if (connectionState !== state) {
    connectionState = state;
    notifyStateListeners();
  }
}

/**
 * Get or create the socket.io singleton for /chat namespace.
 * Authenticates with JWT from secure storage.
 */
export function getSocket(token: string): TypedSocket {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  setConnectionState('connecting');

  socket = io(`${WS_BASE}/chat`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  }) as TypedSocket;

  socket.on('connect', () => {
    setConnectionState('connected');
  });

  socket.on('disconnect', () => {
    setConnectionState('disconnected');
  });

  socket.io.on('reconnect_attempt', () => {
    setConnectionState('reconnecting');
  });

  // Re-authenticate on reconnect with fresh token
  socket.io.on('reconnect_attempt', async () => {
    const freshToken = await getToken();
    if (freshToken && socket) {
      (socket.auth as { token: string }).token = freshToken;
    }
  });

  socket.io.on('reconnect', () => {
    setConnectionState('connected');
  });

  return socket;
}

/**
 * Disconnect and destroy the singleton socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    setConnectionState('disconnected');
  }
}

/**
 * Get current socket instance (without creating one).
 * Returns null if not connected.
 */
export function getSocketInstance(): TypedSocket | null {
  return socket;
}

// ---------------------------------------------------------------------------
// Disconnect on logout
// ---------------------------------------------------------------------------
onUnauthorized(() => {
  disconnectSocket();
});

// ---------------------------------------------------------------------------
// useSocket() hook — connection state for components
// ---------------------------------------------------------------------------
function getConnectionStateSnapshot(): ConnectionState {
  return connectionState;
}

function subscribeConnectionState(callback: () => void): () => void {
  stateListeners.add(callback);
  return () => {
    stateListeners.delete(callback);
  };
}

/**
 * React hook for socket.io connection.
 * Connects on mount (if token provided), disconnects on unmount.
 * Returns { socket, connectionState }.
 */
export function useSocket(token: string | null): {
  socket: TypedSocket | null;
  connectionState: ConnectionState;
} {
  const socketRef = useRef<TypedSocket | null>(null);

  const state = useSyncExternalStore(
    subscribeConnectionState,
    getConnectionStateSnapshot,
    // SSR fallback
    () => 'disconnected' as ConnectionState,
  );

  useEffect(() => {
    if (!token) {
      socketRef.current = null;
      return;
    }

    const s = getSocket(token);
    socketRef.current = s;

    return () => {
      // Don't disconnect on unmount — the singleton persists.
      // Only disconnectSocket() on explicit logout.
      socketRef.current = null;
    };
  }, [token]);

  return {
    socket: socketRef.current,
    connectionState: state,
  };
}
