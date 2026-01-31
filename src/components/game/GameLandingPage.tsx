'use client';

import { GameMetadata } from '@/lib/game-framework/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  game: GameMetadata;
  onStart: () => void;
}

export function GameLandingPage({ game, onStart }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        padding: '16px',
        overflowY: 'auto',
        isolation: 'isolate',
      }}
    >
      <div className="max-w-2xl w-full mx-auto p-4 md:p-8 bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl md:rounded-3xl border-2 border-cyan-400 shadow-2xl my-auto">
        {game.thumbnailUrl && (
          <Image
            src={game.thumbnailUrl}
            alt={game.title}
            width={600}
            height={400}
            className="w-full h-32 md:h-48 object-cover rounded-xl mb-4 md:mb-6"
          />
        )}
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 text-center">
          {game.title}
        </h1>
        <p className="text-base md:text-lg text-gray-200 mb-4 md:mb-6 text-center">
          {game.description}
        </p>
        <button
          onClick={onStart}
          className="w-full py-3 md:py-4 text-xl md:text-2xl font-bold text-black bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full hover:scale-105 active:scale-95 transition-transform touch-manipulation"
        >
          Try Now
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
