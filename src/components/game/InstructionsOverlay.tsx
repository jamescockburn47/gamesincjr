import { GameMetadata } from '@/lib/game-framework/types';

interface Props {
  game: GameMetadata;
  onStartGame: () => void;
}

export function InstructionsOverlay({ game, onStartGame }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto p-4 md:p-8 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl md:rounded-3xl border-2 border-pink-400 my-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">How to Play</h2>
        
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-semibold text-cyan-300 mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-gray-200">
            {game.instructions.map((instruction, i) => (
              <li key={i}>{instruction}</li>
            ))}
          </ul>
        </div>

        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-semibold text-cyan-300 mb-2">Controls:</h3>
          <div className="space-y-1 md:space-y-2 text-sm md:text-base text-gray-200">
            <p><strong>Keyboard:</strong> {game.controls.keyboard.join(', ')}</p>
            {game.controls.touch && (
              <p><strong>Touch:</strong> {game.controls.touch}</p>
            )}
          </div>
        </div>

        <button
          onClick={onStartGame}
          className="w-full py-3 md:py-4 text-xl md:text-2xl font-bold text-black bg-gradient-to-r from-green-400 to-cyan-400 rounded-full hover:scale-105 active:scale-95 transition-transform touch-manipulation"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
