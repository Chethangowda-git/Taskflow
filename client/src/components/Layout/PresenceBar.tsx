import { usePresence } from '../../hooks/usePresence';

export default function PresenceBar() {
  const users = usePresence();

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {users.map((user) => (
        <div
          key={user.userId}
          title={user.name}
          className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold border-2 border-white/50"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}