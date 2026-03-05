import { useState } from 'react';
import { Card as CardType } from '../../stores/boardStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardDetail from './CardDetail';

interface Props {
  card: CardType;
}

const labelColors: Record<string, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-400',
  green: 'bg-green-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
};

export default function Card({ card }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card._id, data: { type: 'card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetail(true)}
        className="bg-white rounded shadow-sm p-3 cursor-pointer hover:shadow-md transition"
      >
        {card.label && (
          <div className={`h-1.5 w-10 rounded mb-2 ${labelColors[card.label]}`} />
        )}
        <p className="text-sm text-gray-800">{card.title}</p>
        {card.dueDate && (
          <p className={`text-xs mt-1 ${
            new Date(card.dueDate) < new Date() && !card.isComplete
              ? 'text-red-500'
              : 'text-gray-400'
          }`}>
            {new Date(card.dueDate).toLocaleDateString()}
          </p>
        )}
        {card.isComplete && (
          <span className="text-xs text-green-600 mt-1 inline-block">✓ Complete</span>
        )}
      </div>

      {showDetail && (
        <CardDetail card={card} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}