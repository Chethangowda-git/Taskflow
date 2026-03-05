import { Column as ColumnType, Card as CardType } from '../../stores/boardStore';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import AddCard from './AddCard';

interface Props {
  column: ColumnType;
  cards: CardType[];
  isFiltered?: boolean;
  visibleCardIds?: Set<string>;
}

export default function Column({ column, cards, isFiltered, visibleCardIds }: Props) {
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

  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-72">
      <div className="bg-gray-200 rounded-lg p-3">
        {/* Column header — drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="font-semibold text-gray-700 text-sm mb-3 px-1 cursor-grab active:cursor-grabbing"
        >
          {column.name}
          <span className="ml-2 text-gray-400 font-normal text-xs">
            {cards.length}
          </span>
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