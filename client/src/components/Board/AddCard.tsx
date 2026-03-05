import { useState } from 'react';
import { useBoardActions } from '../../hooks/useBoardActions';

interface Props {
  columnId: string;
}

export default function AddCard({ columnId }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const { createCard } = useBoardActions();

  async function handleAdd() {
    if (!title.trim()) return;
    await createCard(columnId, title.trim());
    setTitle('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="w-full text-left text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-300 px-2 py-1.5 rounded mt-1"
      >
        + Add a card
      </button>
    );
  }

  return (
    <div className="mt-2">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
          }
          if (e.key === 'Escape') setAdding(false);
        }}
        placeholder="Card title..."
        rows={2}
        className="w-full border border-blue-400 rounded px-2 py-1.5 text-sm resize-none focus:outline-none"
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          Add
        </button>
        <button
          onClick={() => setAdding(false)}
          className="text-gray-500 text-sm px-2 py-1 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}