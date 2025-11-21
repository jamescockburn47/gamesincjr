import { GameMetadata } from '@/lib/game-framework/types';
import Image from 'next/image';

interface Props {
  game: GameMetadata;
  onStart: () => void;
}

export function GameLandingPage({ game, onStart }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl border-2 border-cyan-400 shadow-2xl">
        {game.thumbnailUrl && (
          <Image
            src={game.thumbnailUrl}
            alt={game.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover rounded-xl mb-6"
          />
        )}
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          {game.title}
        </h1>
        <p className="text-lg text-gray-200 mb-6 text-center">
          {game.description}
        </p>
        <button
          onClick={onStart}
          className="w-full py-4 text-2xl font-bold text-black bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full hover:scale-105 transition-transform"
        >
          Try Now
        </button>
      </div>
    </div>
  );
}
