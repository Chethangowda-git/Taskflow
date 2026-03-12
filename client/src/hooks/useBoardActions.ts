import { api } from '../services/api';
import { useBoardStore } from '../stores/boardStore';

export function useBoardActions() {
  const store = useBoardStore();

  async function createColumn(boardId: string, name: string) {
    // Socket broadcast handles store update for everyone including acting user
    await api.post(`/api/boards/${boardId}/columns`, { name });
  }

  async function createCard(columnId: string, title: string) {
    // Socket broadcast handles store update for everyone including acting user
    await api.post(`/api/columns/${columnId}/cards`, { title });
  }

  async function updateCard(cardId: string, changes: Record<string, unknown>) {
    // Socket broadcast handles store update for everyone including acting user
    await api.patch(`/api/cards/${cardId}`, changes);
  }

  async function deleteCard(cardId: string) {
    // Socket broadcast handles store update for everyone including acting user
    await api.delete(`/api/cards/${cardId}`);
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
