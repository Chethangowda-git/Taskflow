import { Server, Socket } from 'socket.io';
import { Column } from '../../models/column.model';
import { Board } from '../../models/board.model';
import { Card } from '../../models/card.model';

export function registerColumnHandlers(io: Server, socket: Socket) {
  socket.on('column:create', async ({ boardId, name }: { boardId: string; name: string }) => {
    const column = await Column.create({ boardId, name, cardOrder: [] });
    await Board.findByIdAndUpdate(boardId, { $push: { columnOrder: column._id } });
    io.to(`board:${boardId}`).emit('column:created', { column });
  });

  socket.on('column:move', async ({ boardId, columnId, newIndex }: {
    boardId: string;
    columnId: string;
    newIndex: number;
  }) => {
    const board = await Board.findById(boardId);
    if (!board) return;

    board.columnOrder = board.columnOrder.filter((id) => id.toString() !== columnId);
    board.columnOrder.splice(newIndex, 0, columnId as unknown as typeof board.columnOrder[0]);
    await board.save();

    io.to(`board:${boardId}`).emit('column:moved', { columnId, newIndex });
  });

  socket.on('column:update', async ({ columnId, changes }: {
    columnId: string;
    changes: Record<string, unknown>;
  }) => {
    const column = await Column.findByIdAndUpdate(columnId, changes, { new: true });
    if (!column) return;
    io.to(`board:${column.boardId}`).emit('column:updated', { columnId, changes });
  });

  socket.on('column:delete', async ({ columnId }: { columnId: string }) => {
    const column = await Column.findById(columnId);
    if (!column) return;

    await Card.deleteMany({ columnId });
    await Board.findByIdAndUpdate(column.boardId, { $pull: { columnOrder: column._id } });
    await column.deleteOne();

    io.to(`board:${column.boardId}`).emit('column:deleted', { columnId });
  });
}