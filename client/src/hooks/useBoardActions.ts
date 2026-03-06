import { api } from '../services/api';
import { useBoardStore } from '../stores/boardStore';

export function useBoardActions() {
  const store = useBoardStore();

  async function createColumn(boardId: string, name: string) {
    // Don't update store here — socket broadcast handles it
    await api.post(`/api/boards/${boardId}/columns`, { name });
  }

  async function createCard(columnId: string, title: string) {
    // Don't update store here — socket broadcast handles it
    await api.post(`/api/columns/${columnId}/cards`, { title });
  }

  async function updateCard(cardId: string, changes: Record<string, unknown>) {
    store.takeSnapshot();
    store.updateCard(cardId, changes);
    try {
      await api.patch(`/api/cards/${cardId}`, changes);
    } catch {
      store.rollback();
    }
  }

  async function deleteCard(cardId: string) {
    store.takeSnapshot();
    store.removeCard(cardId);
    try {
      await api.delete(`/api/cards/${cardId}`);
    } catch {
      store.rollback();
    }
  }

  async function moveCard(
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number
  ) {
    store.takeSnapshot();
    store.moveCard(cardId, fromColumnId, toColumnId, newIndex);
    try {
      await api.patch(`/api/cards/${cardId}/move`, { toColumnId, newIndex });
    } catch {
      store.rollback();
    }
  }

  async function moveColumn(boardId: string, columnId: string, newIndex: number) {
    store.takeSnapshot();
    store.moveColumn(columnId, newIndex);
    try {
      const board = useBoardStore.getState().board;
      await api.patch(`/api/boards/${boardId}/columns/reorder`, {
        columnOrder: board?.columnOrder,
      });
    } catch {
      store.rollback();
    }
  }

  async function addComment(cardId: string, text: string) {
    const { data } = await api.post(`/api/cards/${cardId}/comments`, { text });
    store.updateCard(cardId, { comments: data.comments });
  }

  return { createColumn, createCard, updateCard, deleteCard, moveCard, moveColumn, addComment };
}