import { useState } from 'react';
import { useBoardActions } from '../../hooks/useBoardActions';

interface Props {
  boardId: string;
}

export default function AddColumn({ boardId }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const { createColumn } = useBoardActions();

  async function handleAdd() {
    if (!name.trim()) return;
    await createColumn(boardId, name.trim());
    setName('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex-shrink-0 w-72 bg-white/20 hover:bg-white/30 text-white rounded-lg px-4 py-3 text-sm font-medium"
      >
        + Add a column
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 bg-gray-200 rounded-lg p-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') setAdding(false);
        }}
        placeholder="Column name..."
        className="w-full border border-blue-400 rounded px-2 py-1.5 text-sm focus:outline-none"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          Add
        </button>
        <button
          onClick={() => setAdding(false)}
          className="text-gray-500 text-sm px-2 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}