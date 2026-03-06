import { Response } from 'express';
import { Column } from '../models/column.model';
import { Card } from '../models/card.model';
import { Board } from '../models/board.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../socket/socketManager';

// POST /api/boards/:boardId/columns
export async function createColumn(req: AuthRequest, res: Response) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
  }

  const column = await Column.create({ boardId: req.params.boardId, name, cardOrder: [] });

  await Board.findByIdAndUpdate(req.params.boardId, {
    $push: { columnOrder: column._id },
  });

  // Broadcast to all users in the board room
  // io.to(`board:${req.params.boardId}`).emit('column:created', { column });
  io.to(`board:${req.params.boardId}`).emit('column:created', { column, createdBy: req.user!.userId });

  return res.status(201).json(column);
}

// PATCH /api/columns/:columnId
export async function updateColumn(req: AuthRequest, res: Response) {
  const { name } = req.body;
  const column = await Column.findByIdAndUpdate(
    req.params.columnId,
    { name },
    { new: true }
  );
  if (!column) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Column not found' } });
  }
  return res.json(column);
}

// DELETE /api/columns/:columnId
export async function deleteColumn(req: AuthRequest, res: Response) {
  const column = await Column.findById(req.params.columnId);
  if (!column) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Column not found' } });
  }

  // Delete all cards in column
  await Card.deleteMany({ columnId: column._id });

  // Remove from board's columnOrder
  await Board.findByIdAndUpdate(column.boardId, {
    $pull: { columnOrder: column._id },
  });

  await column.deleteOne();
  return res.json({ message: 'Column deleted' });
}