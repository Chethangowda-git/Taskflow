import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext, DragEndEvent, DragOverEvent, PointerSensor,
  useSensor, useSensors, closestCenter, pointerWithin,
  rectIntersection, DragOverlay, DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { api } from '../services/api';
import { useBoardStore } from '../stores/boardStore';
import { useBoardActions } from '../hooks/useBoardActions';
import { useBoard } from '../hooks/useBoard';
import { useSocket } from '../hooks/useSocket';
import Column from '../components/Board/Column';
import Card from '../components/Board/Card';
import AddColumn from '../components/Board/AddColumn';
import BoardHeader from '../components/Board/BoardHeader';
import Navbar from '../components/Layout/Navbar';
import { debounce } from '../utils/debounce';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, columns, cards, setBoard } = useBoardStore();
  const { moveCard, moveColumn } = useBoardActions();
  const socket = useSocket();

  // Load board via REST on mount
  useEffect(() => {
    if (!boardId) return;
    api.get(`/api/boards/${boardId}`).then(({ data }) => {
      setBoard(data.board, data.columns, data.cards);
    });
  }, [boardId, setBoard]);

  // Join socket room — real-time sync
  console.log('🟡 BoardPage rendering, boardId:', boardId);
  useBoard(boardId ?? '');

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'card' | 'column' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState('');

  const updateDebouncedSearch = useCallback(
    debounce((q: string) => setDebouncedSearch(q), 200),
    []
  );

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    updateDebouncedSearch(q);
  }

  const isFiltered = !!(debouncedSearch || filterLabel);
  const visibleCardIds = new Set(
    Object.values(cards)
      .filter((card) => {
        const matchesSearch = debouncedSearch
          ? card.title.toLowerCase().includes(debouncedSearch.toLowerCase())
          : true;
        const matchesLabel = filterLabel ? card.label === filterLabel : true;
        return matchesSearch && matchesLabel;
      })
      .map((c) => c._id)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setActiveType(event.active.data.current?.type ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !board) return;

    const activeCardType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeCardType !== 'card') return;

    const activeCard = cards[active.id as string];
    if (!activeCard) return;

    if (overType === 'column') {
      const toColumnId = over.id as string;
      if (activeCard.columnId !== toColumnId) {
        const toCol = columns[toColumnId];
        moveCard(activeCard._id, activeCard.columnId, toColumnId, toCol.cardOrder.length);
      }
      return;
    }

    if (overType === 'card') {
      const overCard = cards[over.id as string];
      if (!overCard) return;
      if (activeCard.columnId === overCard.columnId) {
        const col = columns[activeCard.columnId];
        const newIndex = col.cardOrder.indexOf(overCard._id);
        if (newIndex !== -1 && col.cardOrder.indexOf(activeCard._id) !== newIndex) {
          moveCard(activeCard._id, activeCard.columnId, activeCard.columnId, newIndex);
        }
      } else {
        const toCol = columns[overCard.columnId];
        const newIndex = toCol.cardOrder.indexOf(overCard._id);
        moveCard(activeCard._id, activeCard.columnId, overCard.columnId, newIndex);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    if (!over || !board) return;

    if (active.data.current?.type === 'column') {
      const newIndex = board.columnOrder.indexOf(over.id as string);
      if (newIndex !== -1) {
        moveColumn(board._id, active.id as string, newIndex);
      }
    }

    // Emit final card move to server via socket
    if (active.data.current?.type === 'card') {
      const card = cards[active.id as string];
      if (card && over) {
        const overCard = cards[over.id as string];
        const toColumnId = overCard ? overCard.columnId : over.id as string;
        const toCol = columns[toColumnId];
        const newIndex = toCol ? toCol.cardOrder.indexOf(active.id as string) : 0;
        socket.emit('card:move', {
          cardId: active.id,
          fromColumnId: card.columnId,
          toColumnId,
          newIndex,
        });
      }
    }
  }

  function collisionStrategy(args: Parameters<typeof rectIntersection>[0]) {
    if (activeType === 'column') return closestCenter(args);
    return pointerWithin(args) ?? rectIntersection(args);
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading board...</p>
        </div>
      </div>
    );
  }

  const activeCard = activeId && activeType === 'card' ? cards[activeId] : null;

  return (
    <div className="min-h-screen bg-blue-700 flex flex-col">
      <Navbar />
      <BoardHeader
        board={board}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filterLabel={filterLabel}
        onFilterLabelChange={setFilterLabel}
        onClearFilters={() => {
          setSearchQuery('');
          setDebouncedSearch('');
          setFilterLabel('');
        }}
      />

      <div className="flex-1 p-6 overflow-x-auto">
        <h2 className="text-white font-bold text-xl mb-4">{board.name}</h2>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={board.columnOrder} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 items-start">
              {board.columnOrder.map((colId) => {
                const column = columns[colId];
                if (!column) return null;
                const columnCards = column.cardOrder
                  .map((id) => cards[id])
                  .filter(Boolean);
                return (
                  <Column
                    key={colId}
                    column={column}
                    cards={columnCards}
                    isFiltered={isFiltered}
                    visibleCardIds={visibleCardIds}
                  />
                );
              })}
              <AddColumn boardId={board._id} />
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard && <Card card={activeCard} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}