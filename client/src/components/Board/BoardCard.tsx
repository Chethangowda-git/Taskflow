import { Board } from '../../stores/boardStore';

interface Props {
  board: Board;
  onClick: () => void;
}

export default function BoardCard({ board, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition"
    >
      <h3 className="font-semibold text-gray-800">{board.name}</h3>
      {board.description && (
        <p className="text-sm text-gray-500 mt-1">{board.description}</p>
      )}
    </div>
  );
}