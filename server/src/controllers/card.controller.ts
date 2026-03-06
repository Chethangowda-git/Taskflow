import { Response } from 'express';
import { Card } from '../models/card.model';
import { Column } from '../models/column.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../socket/socketManager';

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

  console.log(`📢 Broadcasting card:created to board:${column.boardId}`);
  io.to(`board:${column.boardId}`).emit('card:created', { card, createdBy: req.user!.userId });

  return res.status(201).json(card);
}

export async function getCard(req: AuthRequest, res: Response) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }
  return res.json(card);
}

export async function updateCard(req: AuthRequest, res: Response) {
  const { title, description, dueDate, assigneeId, label, isComplete } = req.body;
  const changes = { title, description, dueDate, assigneeId, label, isComplete };

  const card = await Card.findByIdAndUpdate(
    req.params.cardId,
    changes,
    { new: true, omitUndefined: true }
  );
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }

  io.to(`board:${card.boardId}`).emit('card:updated', {
    cardId: card._id,
    changes,
    updatedBy: req.user!.userId,
  });

  return res.json(card);
}

export async function deleteCard(req: AuthRequest, res: Response) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }

  await Column.findByIdAndUpdate(card.columnId, { $pull: { cardOrder: card._id } });
  await card.deleteOne();

  io.to(`board:${card.boardId}`).emit('card:deleted', {
    cardId: req.params.cardId,
    deletedBy: req.user!.userId,
  });

  return res.json({ message: 'Card deleted' });
}

export async function moveCard(req: AuthRequest, res: Response) {
  const { toColumnId, newIndex } = req.body;
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } });
  }

  const fromColumnId = card.columnId;
  await Column.findByIdAndUpdate(fromColumnId, { $pull: { cardOrder: card._id } });

  const toColumn = await Column.findById(toColumnId);
  if (!toColumn) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Target column not found' } });
  }

  toColumn.cardOrder.splice(newIndex, 0, card._id);
  await toColumn.save();

  card.columnId = toColumnId;
  await card.save();

  return res.json(card);
}

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