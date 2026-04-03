import { io, Socket } from 'socket.io-client';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3812/api' : 'https://p2ptax.smartlaunchhub.com/api');

// Derive WebSocket base from API URL (strip /api suffix)
const WS_BASE = BASE_URL.replace(/\/api$/, '');

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(`${WS_BASE}/chat`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
