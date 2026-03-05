import { Server, Socket } from 'socket.io';
import { Board } from '../../models/board.model';
import { Column } from '../../models/column.model';
import { Card } from '../../models/card.model';

export function registerBoardHandlers(io: Server, socket: Socket) {
  socket.on('board:join', async ({ boardId }: { boardId: string }) => {
    // Verify user is a member
    const board = await Board.findById(boardId);
    if (!board) return;

    const isMember = board.members.some(
      (m) => m.userId.toString() === socket.data.userId
    );
    if (!isMember) return;

    socket.join(`board:${boardId}`);

    // Send full board state to the joining user
    const columns = await Column.find({ boardId });
    const cards = await Card.find({ boardId });

    socket.emit('board:state', { board, columns, cards });

    // Update presence for everyone in the room
    const sockets = await io.in(`board:${boardId}`).fetchSockets();
    const users = sockets.map((s) => ({
      userId: s.data.userId,
      name: s.data.name,
    }));
    io.to(`board:${boardId}`).emit('presence:update', { users });
  });

  socket.on('board:leave', ({ boardId }: { boardId: string }) => {
    socket.leave(`board:${boardId}`);
  });
}