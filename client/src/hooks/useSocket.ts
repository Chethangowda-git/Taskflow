import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

// Singleton — created once, never recreated
const socket: Socket = io('http://localhost:4000', {
  autoConnect: false,
  auth: (cb: (data: { token: string | null }) => void) => {
    cb({ token: useAuthStore.getState().accessToken });
  },
});

export function getSocket(): Socket {
  return socket;
}

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken && !socket.connected) {
      socket.connect();
    }
  }, [accessToken]);

  return socket;
}