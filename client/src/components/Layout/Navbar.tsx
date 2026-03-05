import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import PresenceBar from './PresenceBar';

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await api.post('/api/auth/logout');
    clearAuth();
    navigate('/login');
  }

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between">
      <span
        className="font-bold text-xl cursor-pointer"
        onClick={() => navigate('/boards')}
      >
        TaskFlow
      </span>
      <div className="flex items-center gap-4">
        <PresenceBar />
        <span className="text-sm">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}