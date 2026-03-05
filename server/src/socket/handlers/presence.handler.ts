import { Server, Socket } from 'socket.io';

export function registerPresenceHandlers(io: Server, socket: Socket) {
  socket.on('disconnecting', async () => {
    // When a socket disconnects, update presence for all board rooms it was in
    for (const room of socket.rooms) {
      if (!room.startsWith('board:')) continue;

      const sockets = await io.in(room).fetchSockets();
      const users = sockets
        .filter((s:any) => s.id !== socket.id)
        .map((s:any) => ({ userId: s.data.userId, name: s.data.name }));

      io.to(room).emit('presence:update', { users });
    }
  });
}