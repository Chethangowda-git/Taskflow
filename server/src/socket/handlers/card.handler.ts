import { Server, Socket } from 'socket.io';
import { Card } from '../../models/card.model';
import { Column } from '../../models/column.model';

export function registerCardHandlers(io: Server, socket: Socket) {
  socket.on('card:create', async ({ columnId, title }: { columnId: string; title: string }) => {
    const column = await Column.findById(columnId);
    if (!column) return;

    const card = await Card.create({
      boardId: column.boardId,
      columnId,
      title,
      isComplete: false,
      comments: [],
    });

    await Column.findByIdAndUpdate(columnId, { $push: { cardOrder: card._id } });

    io.to(`board:${column.boardId}`).emit('card:created', { card });
  });

  socket.on('card:move', async ({
    cardId, fromColumnId, toColumnId, newIndex
  }: {
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
  }) => {
    const card = await Card.findById(cardId);
    if (!card) return;

    await Column.findByIdAndUpdate(fromColumnId, { $pull: { cardOrder: card._id } });

    const toColumn = await Column.findById(toColumnId);
    if (!toColumn) return;
    toColumn.cardOrder.splice(newIndex, 0, card._id);
    await toColumn.save();

    card.columnId = toColumnId as unknown as typeof card.columnId;
    await card.save();

    io.to(`board:${card.boardId}`).emit('card:moved', {
      cardId,
      fromColumnId,
      toColumnId,
      newIndex,
      movedBy: socket.data.userId,
    });
  });

  socket.on('card:update', async ({ cardId, changes }: { cardId: string; changes: Record<string, unknown> }) => {
    const card = await Card.findByIdAndUpdate(cardId, changes, { new: true });
    if (!card) return;

    io.to(`board:${card.boardId}`).emit('card:updated', {
      cardId,
      changes,
      updatedBy: socket.data.userId,
    });
  });

  socket.on('card:delete', async ({ cardId }: { cardId: string }) => {
    const card = await Card.findById(cardId);
    if (!card) return;

    await Column.findByIdAndUpdate(card.columnId, { $pull: { cardOrder: card._id } });
    await card.deleteOne();

    io.to(`board:${card.boardId}`).emit('card:deleted', {
      cardId,
      deletedBy: socket.data.userId,
    });
  });

  socket.on('comment:add', async ({ cardId, text }: { cardId: string; text: string }) => {
    const card = await Card.findById(cardId);
    if (!card) return;

    card.comments.push({
      userId: socket.data.userId,
      text,
      mentions: [],
      createdAt: new Date(),
    } as never);
    await card.save();

    const comment = card.comments[card.comments.length - 1];
    io.to(`board:${card.boardId}`).emit('comment:added', { cardId, comment });
  });

  socket.on('typing:start', ({ cardId }: { cardId: string }) => {
    socket.broadcast.emit('typing:indicator', {
      cardId,
      userId: socket.data.userId,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ cardId }: { cardId: string }) => {
    socket.broadcast.emit('typing:indicator', {
      cardId,
      userId: socket.data.userId,
      isTyping: false,
    });
  });
}