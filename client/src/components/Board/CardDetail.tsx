import { useState } from 'react';
import { Card } from '../../stores/boardStore';
import { useBoardActions } from '../../hooks/useBoardActions';
import Modal from '../ui/Modal';

interface Props {
  card: Card;
  onClose: () => void;
}

const LABELS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
const labelColors: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

export default function CardDetail({ card, onClose }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.slice(0, 10) : '');
  const [commentText, setCommentText] = useState('');
  const { updateCard, deleteCard, addComment } = useBoardActions();

  async function handleSave() {
    await updateCard(card._id, { title, description, dueDate: dueDate || undefined });
  }

  async function handleLabelClick(label: string) {
    const newLabel = card.label === label ? undefined : label;
    await updateCard(card._id, { label: newLabel });
  }

  async function handleComplete() {
    await updateCard(card._id, { isComplete: !card.isComplete });
  }

  async function handleDelete() {
    await deleteCard(card._id);
    onClose();
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    await addComment(card._id, commentText.trim());
    setCommentText('');
  }

  const isOverdue = card.dueDate && !card.isComplete && new Date(card.dueDate) < new Date();

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          className="w-full text-xl font-bold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none pb-1 mb-4"
        />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                placeholder="Add a description..."
                rows={4}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                Comments
              </label>
              <div className="space-y-2 mb-3">
                {card.comments?.map((c) => (
                  <div key={c._id} className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-700">
                    {c.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleAddComment}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Complete */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Status
              </label>
              <button
                onClick={handleComplete}
                className={`text-sm px-3 py-1.5 rounded w-full ${
                  card.isComplete
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {card.isComplete ? '✓ Complete' : 'Mark complete'}
              </button>
            </div>

            {/* Due date */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={handleSave}
                className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isOverdue ? 'border-red-400 text-red-600' : 'border-gray-200'
                }`}
              />
              {isOverdue && <p className="text-xs text-red-500 mt-1">Overdue</p>}
            </div>

            {/* Label */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                Label
              </label>
              <div className="flex flex-wrap gap-2">
                {LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleLabelClick(label)}
                    className={`w-7 h-7 rounded-full ${labelColors[label]} ${
                      card.label === label ? 'ring-2 ring-offset-1 ring-gray-800' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Delete */}
            <div className="pt-4 border-t">
              <button
                onClick={handleDelete}
                className="w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded"
              >
                Delete card
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}