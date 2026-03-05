import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface PresenceUser {
  userId: string;
  name: string;
}

export function usePresence() {
  const socket = useSocket();
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    socket.on('presence:update', ({ users }: { users: PresenceUser[] }) => {
      setPresentUsers(users);
    });

    return () => {
      socket.off('presence:update');
    };
  }, [socket]);

  return presentUsers;
}