import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClients } from '../config/redis';
import { verifyAccessToken } from '../utils/jwt';
import { registerBoardHandlers } from './handlers/board.handler';
import { registerCardHandlers } from './handlers/card.handler';
import { registerColumnHandlers } from './handlers/column.handler';
import { registerPresenceHandlers } from './handlers/presence.handler';

export let io: SocketServer;

export function initSocketServer(httpServer: HttpServer) {
  const { pubClient, subClient } = getRedisClients();

  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Redis adapter for multi-instance pub/sub
  io.adapter(createAdapter(pubClient, subClient));

  // JWT auth handshake — reject unauthenticated connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const payload = verifyAccessToken(token);
    if (!payload) return next(new Error('Invalid or expired token'));

    socket.data.userId = payload.userId;
    socket.data.name = payload.name;
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Connected: ${socket.id} (user: ${socket.data.userId})`);

    registerBoardHandlers(io, socket);
    registerCardHandlers(io, socket);
    registerColumnHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 Socket.io initialized');
}