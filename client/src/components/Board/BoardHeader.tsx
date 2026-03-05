import { useState } from 'react';
import { Board } from '../../stores/boardStore';
import { api } from '../../services/api';

interface Props {
  board: Board;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterLabel: string;
  onFilterLabelChange: (l: string) => void;
  onClearFilters: () => void;
}

const LABELS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const labelColors: Record<string, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-400',
  green: 'bg-green-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
};

export default function BoardHeader({
  board, searchQuery, onSearchChange, filterLabel, onFilterLabelChange, onClearFilters
}: Props) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/api/boards/${board._id}/members`, { email: inviteEmail });
      setInviteMsg('Member added!');
      setInviteEmail('');
    } catch {
      setInviteMsg('User not found or already a member.');
    }
    setTimeout(() => setInviteMsg(''), 3000);
  }

  const hasFilters = searchQuery || filterLabel;

  return (
    <div className="bg-blue-800/40 px-6 py-3 flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search cards..."
        className="bg-white/20 text-white placeholder-white/60 text-sm rounded px-3 py-1.5 focus:outline-none focus:bg-white/30 w-48"
      />

      {/* Label filter */}
      <div className="flex items-center gap-1">
        {LABELS.map((label) => (
          <button
            key={label}
            onClick={() => onFilterLabelChange(filterLabel === label ? '' : label)}
            className={`w-5 h-5 rounded-full ${labelColors[label]} ${
              filterLabel === label ? 'ring-2 ring-white ring-offset-1' : 'opacity-60 hover:opacity-100'
            }`}
          />
        ))}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-white/70 hover:text-white text-xs underline"
        >
          Clear filters
        </button>
      )}

      {/* Invite member */}
      <div className="flex items-center gap-2 ml-auto">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          placeholder="Invite by email..."
          className="bg-white/20 text-white placeholder-white/60 text-sm rounded px-3 py-1.5 focus:outline-none focus:bg-white/30 w-48"
        />
        <button
          onClick={handleInvite}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded"
        >
          Invite
        </button>
        {inviteMsg && <span className="text-white text-xs">{inviteMsg}</span>}
      </div>
    </div>
  );
}