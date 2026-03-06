import { Server, Socket } from 'socket.io';
import { Board } from '../../models/board.model';
import { Column } from '../../models/column.model';
import { Card } from '../../models/card.model';

export function registerBoardHandlers(io: Server, socket: Socket) {
socket.on('board:join', async ({ boardId }: { boardId: string }) => {
  const board = await Board.findById(boardId);
  if (!board) return;

  const isMember = board.members.some(
    (m) => m.userId.toString() === socket.data.userId
  );
  if (!isMember) return;

  socket.join(`board:${boardId}`);

  const columns = await Column.find({ boardId });
  const cards = await Card.find({ boardId });
  socket.emit('board:state', { board, columns, cards });

  // Deduplicate by userId
  const sockets = await io.in(`board:${boardId}`).fetchSockets();
  const seen = new Set<string>();
  const users = sockets
    .filter((s) => {
      if (seen.has(s.data.userId)) return false;
      seen.add(s.data.userId);
      return true;
    })
    .map((s) => ({ userId: s.data.userId, name: s.data.name }));

  io.to(`board:${boardId}`).emit('presence:update', { users });
});

  socket.on('board:leave', ({ boardId }: { boardId: string }) => {
    socket.leave(`board:${boardId}`);
  });
}