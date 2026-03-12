import { create } from 'zustand';

export interface Comment {
  _id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Card {
  _id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string;
  label?: string;
  isComplete: boolean;
  comments: Comment[];
}

export interface Column {
  _id: string;
  boardId: string;
  name: string;
  cardOrder: string[];
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: { userId: string; role: 'admin' | 'member' }[];
  columnOrder: string[];
}

interface Snapshot {
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  board: Board | null;
}

interface BoardState {
  board: Board | null;
  columns: Record<string, Column>;
  cards: Record<string, Card>;
  _snapshot: Snapshot | null;

  setBoard: (board: Board, columns: Column[], cards: Card[]) => void;
  takeSnapshot: () => void;
  rollback: () => void;

  // Card actions
  addCard: (card: Card) => void;
  updateCard: (cardId: string, changes: Partial<Card>) => void;
  removeCard: (cardId: string) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;

  // Column actions
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, changes: Partial<Column>) => void;
  removeColumn: (columnId: string, boardId: string) => void;
  moveColumn: (columnId: string, newIndex: number) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  columns: {},
  cards: {},
  _snapshot: null,

  setBoard: (board, columns, cards) => {
    const colMap: Record<string, Column> = {};
    const cardMap: Record<string, Card> = {};
    columns.forEach((c) => (colMap[c._id] = c));
    cards.forEach((c) => (cardMap[c._id] = c));
    set({ board, columns: colMap, cards: cardMap });
  },

  takeSnapshot: () => {
    const { board, columns, cards } = get();
    set({ _snapshot: { board, columns, cards } });
  },

  rollback: () => {
    const snap = get()._snapshot;
    if (snap) set({ ...snap, _snapshot: null });
  },

  // ── Card actions ─────────────────────────────────────────

  addCard: (card) => {
    set((state) => {
      const col = state.columns[card.columnId];
      if (!col) return {};
      // Prevent duplicate
      if (col.cardOrder.includes(card._id)) return {};
      return {
        cards: { ...state.cards, [card._id]: card },
        columns: {
          ...state.columns,
          [card.columnId]: { ...col, cardOrder: [...col.cardOrder, card._id] },
        },
      };
    });
  },

  updateCard: (cardId, changes) => {
    set((state) => ({
      cards: { ...state.cards, [cardId]: { ...state.cards[cardId], ...changes } },
    }));
  },

  removeCard: (cardId) => {
    set((state) => {
      const card = state.cards[cardId];
      const col = card ? state.columns[card.columnId] : null;
      const cards = { ...state.cards };
      delete cards[cardId];
      if (col) {
        return {
          cards,
          columns: {
            ...state.columns,
            [col._id]: { ...col, cardOrder: col.cardOrder.filter((id) => id !== cardId) },
          },
        };
      }
      return { cards };
    });
  },

  moveCard: (cardId, fromColumnId, toColumnId, newIndex) => {
    set((state) => {
      const columns = { ...state.columns };
      const fromCol = { ...columns[fromColumnId], cardOrder: [...columns[fromColumnId].cardOrder] };
      const toCol = { ...columns[toColumnId], cardOrder: [...columns[toColumnId].cardOrder] };

      fromCol.cardOrder = fromCol.cardOrder.filter((id) => id !== cardId);
      toCol.cardOrder.splice(newIndex, 0, cardId);

      columns[fromColumnId] = fromCol;
      columns[toColumnId] = toCol;

      return {
        columns,
        cards: { ...state.cards, [cardId]: { ...state.cards[cardId], columnId: toColumnId } },
      };
    });
  },

  // ── Column actions ───────────────────────────────────────

  addColumn: (column) => {
    set((state) => {
      // Prevent duplicate
      if (state.columns[column._id]) return {};
      return {
        columns: { ...state.columns, [column._id]: column },
        board: state.board
          ? { ...state.board, columnOrder: [...state.board.columnOrder, column._id] }
          : null,
      };
    });
  },

  updateColumn: (columnId, changes) => {
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: { ...state.columns[columnId], ...changes },
      },
    }));
  },

  removeColumn: (columnId, _boardId) => {
    set((state) => {
      const columns = { ...state.columns };
      delete columns[columnId];

      const board = state.board
        ? { ...state.board, columnOrder: state.board.columnOrder.filter((id) => id !== columnId) }
        : null;

      // Remove all cards belonging to this column
      const cards = { ...state.cards };
      Object.keys(cards).forEach((cardId) => {
        if (cards[cardId].columnId === columnId) delete cards[cardId];
      });

      return { columns, board, cards };
    });
  },

  moveColumn: (columnId, newIndex) => {
    set((state) => {
      if (!state.board) return {};
      const order = state.board.columnOrder.filter((id) => id !== columnId);
      order.splice(newIndex, 0, columnId);
      return { board: { ...state.board, columnOrder: order } };
    });
  },
}));
