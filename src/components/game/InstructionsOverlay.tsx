import { GameMetadata } from '@/lib/game-framework/types';

interface Props {
  game: GameMetadata;
  onStartGame: () => void;
}

export function InstructionsOverlay({ game, onStartGame }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl border-2 border-pink-400">
        <h2 className="text-3xl font-bold text-white mb-4">How to Play</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-cyan-300 mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-200">
            {game.instructions.map((instruction, i) => (
              <li key={i}>{instruction}</li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-cyan-300 mb-2">Controls:</h3>
          <div className="space-y-2 text-gray-200">
            <p><strong>Keyboard:</strong> {game.controls.keyboard.join(', ')}</p>
            {game.controls.touch && (
              <p><strong>Touch:</strong> {game.controls.touch}</p>
            )}
          </div>
        </div>

        <button
          onClick={onStartGame}
          className="w-full py-4 text-2xl font-bold text-black bg-gradient-to-r from-green-400 to-cyan-400 rounded-full hover:scale-105 transition-transform"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
