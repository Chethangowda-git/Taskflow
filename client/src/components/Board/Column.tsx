import { useState } from 'react';
import { Column as ColumnType, Card as CardType, useBoardStore } from '../../stores/boardStore';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { api } from '../../services/api';
import Card from './Card';
import AddCard from './AddCard';

interface Props {
  column: ColumnType;
  cards: CardType[];
  isFiltered?: boolean;
  visibleCardIds?: Set<string>;
}

export default function Column({ column, cards, isFiltered, visibleCardIds }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const { removeColumn } = useBoardStore();

  const { setNodeRef: setDropRef } = useDroppable({ id: column._id, data: { type: 'column' } });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column._id, data: { type: 'column' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const visibleCards = isFiltered
    ? cards.filter((c) => visibleCardIds?.has(c._id))
    : cards;

  async function handleRename() {
    if (!name.trim() || name === column.name) {
      setName(column.name);
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    // Socket broadcast handles store update for everyone including acting user
    await api.patch(`/api/columns/${column._id}`, { name });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${column.name}" and all its cards?`)) return;
    // Optimistic remove for acting user — socket handles other users
    removeColumn(column._id, column.boardId);
    await api.delete(`/api/columns/${column._id}`);
  }

  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-72">
      <div className="bg-gray-200 rounded-lg p-3">
        {/* Column header */}
        <div className="flex items-center justify-between mb-3 px-1">
          {isEditing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') { setName(column.name); setIsEditing(false); }
              }}
              className="font-semibold text-gray-700 text-sm bg-white border border-blue-400 rounded px-2 py-0.5 w-full focus:outline-none"
            />
          ) : (
            <div
              {...attributes}
              {...listeners}
              className="font-semibold text-gray-700 text-sm cursor-grab active:cursor-grabbing flex-1"
              onDoubleClick={() => setIsEditing(true)}
            >
              {column.name}
              <span className="ml-2 text-gray-400 font-normal text-xs">{cards.length}</span>
            </div>
          )}

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600 text-xs px-1"
              title="Rename"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 text-xs px-1"
              title="Delete column"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Cards drop zone */}
        <div ref={setDropRef}>
          <SortableContext items={column.cardOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 min-h-[2px]">
              {visibleCards.map((card) => (
                <Card key={card._id} card={card} />
              ))}
            </div>
          </SortableContext>
        </div>

        <AddCard columnId={column._id} />
      </div>
    </div>
  );
}
