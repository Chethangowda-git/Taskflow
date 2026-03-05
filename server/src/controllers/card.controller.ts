import { Response } from 'express';
import { Card } from '../models/card.model';
import { Column } from '../models/column.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../socket/socketManager';


// POST /api/columns/:columnId/cards
export async function createCard(req: AuthRequest, res: Response) {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
  }

  const column = await Column.findById(req.params.columnId);
  if (!column) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Column not found' } });
  }

  const card = await Card.create({
    boardId: column.boardId,
    columnId: column._id,
    title,
    isComplete: false,
    comments: [],
  });

  await Column.findByIdAndUpdate(column._id, { $push: { cardOrder: card._id } });

  // Broadcast to all users in the board room
  io.to(`board:${column.boardId}`).emit('card:created', { card });

  return res.status(201).json(card);
}

// GET /api/cards/:cardId
export async function getCard(req: AuthRequest, res: Response) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }
  return res.json(card);
}

// PATCH /api/cards/:cardId
export async function updateCard(req: AuthRequest, res: Response) {
  const { title, description, dueDate, assigneeId, label, isComplete } = req.body;
  const card = await Card.findByIdAndUpdate(
    req.params.cardId,
    { title, description, dueDate, assigneeId, label, isComplete },
    { new: true, omitUndefined: true }
  );
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }
  return res.json(card);
}

// DELETE /api/cards/:cardId
export async function deleteCard(req: AuthRequest, res: Response) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }

  await Column.findByIdAndUpdate(card.columnId, {
    $pull: { cardOrder: card._id },
  });

  await card.deleteOne();
  return res.json({ message: 'Card deleted' });
}

// PATCH /api/cards/:cardId/move
export async function moveCard(req: AuthRequest, res: Response) {
  const { toColumnId, newIndex } = req.body;
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }

  const fromColumnId = card.columnId;

  // Remove from old column
  await Column.findByIdAndUpdate(fromColumnId, {
    $pull: { cardOrder: card._id },
  });

  // Insert at newIndex in new column
  const toColumn = await Column.findById(toColumnId);
  if (!toColumn) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Target column not found' } });
  }

  toColumn.cardOrder.splice(newIndex, 0, card._id);
  await toColumn.save();

  // Update card's columnId
  card.columnId = toColumnId;
  await card.save();

  return res.json(card);
}

// POST /api/cards/:cardId/comments
export async function addComment(req: AuthRequest, res: Response) {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'text is required' } });
  }

  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }

  card.comments.push({
    userId: req.user!.userId as unknown as import('mongoose').Types.ObjectId,
    text,
    mentions: [],
    createdAt: new Date(),
  } as unknown as import('../models/card.model').IComment);

  await card.save();
  return res.status(201).json(card);
}