import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:4000', {
      autoConnect: false,
      auth: (cb: (data: { token: string | null }) => void) => {
        cb({ token: useAuthStore.getState().accessToken });
      },
    });
  }
  return socket;
}

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const s = socketRef.current;
    if (accessToken && !s.connected) {
      s.connect();
    } else if (!accessToken && s.connected) {
      s.disconnect();
    }
  }, [accessToken]);

  return socketRef.current;
}