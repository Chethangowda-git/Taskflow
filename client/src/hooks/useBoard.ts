import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useBoardStore, Board, Column, Card } from '../stores/boardStore';

export function useBoard(boardId: string) {
  const socket = useSocket();

  useEffect(() => {
    if (!boardId) return;

    function joinBoard() {
      socket.emit('board:join', { boardId });
    }

    if (socket.connected) joinBoard();
    socket.on('connect', joinBoard);

    socket.on('board:state', ({ board, columns, cards }: { board: Board; columns: Column[]; cards: Card[] }) => {
      useBoardStore.getState().setBoard(board, columns, cards);
    });

    socket.on('card:created', ({ card }: { card: Card }) => {
      console.log('🃏 card:created received', card._id);
      useBoardStore.getState().addCard(card);
    });

    socket.on('card:moved', ({ cardId, fromColumnId, toColumnId, newIndex }: {
      cardId: string; fromColumnId: string; toColumnId: string; newIndex: number;
    }) => {
      useBoardStore.getState().moveCard(cardId, fromColumnId, toColumnId, newIndex);
    });

    socket.on('card:updated', ({ cardId, changes }: { cardId: string; changes: Partial<Card> }) => {
      useBoardStore.getState().updateCard(cardId, changes);
    });

    socket.on('card:deleted', ({ cardId }: { cardId: string }) => {
      useBoardStore.getState().removeCard(cardId);
    });

    socket.on('column:created', ({ column }: { column: Column }) => {
      useBoardStore.getState().addColumn(column);
    });

    socket.on('column:moved', ({ columnId, newIndex }: { columnId: string; newIndex: number }) => {
      useBoardStore.getState().moveColumn(columnId, newIndex);
    });

    socket.on('column:updated', ({ columnId, changes }: { columnId: string; changes: Partial<Column> }) => {
      useBoardStore.getState().updateColumn(columnId, changes);
    });

    return () => {
      socket.emit('board:leave', { boardId });
      socket.off('connect', joinBoard);
      socket.off('board:state');
      socket.off('card:created');
      socket.off('card:moved');
      socket.off('card:updated');
      socket.off('card:deleted');
      socket.off('column:created');
      socket.off('column:moved');
      socket.off('column:updated');
    };
  }, [boardId]);
}