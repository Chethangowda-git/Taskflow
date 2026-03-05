import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Layout/Navbar';

interface Board {
  _id: string;
  name: string;
  description?: string;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/boards').then(({ data }) => {
      setBoards(data);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    const { data } = await api.post('/api/boards', { name });
    setBoards((prev) => [...prev, data]);
    setName('');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">My Boards</h2>

        {/* Create board */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New board name..."
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Create Board
          </button>
        </div>

        {/* Board list */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : boards.length === 0 ? (
          <p className="text-gray-500 text-sm">No boards yet. Create one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => navigate(`/boards/${board._id}`)}
                className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition"
              >
                <h3 className="font-semibold text-gray-800">{board.name}</h3>
                {board.description && (
                  <p className="text-sm text-gray-500 mt-1">{board.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}