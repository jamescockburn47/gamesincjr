'use client';

import { useState } from 'react';
import type { Game } from '@/lib/games';

interface GamePlayerProps {
  game: Game;
}

export default function GamePlayer({ game }: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle different game types
  const renderGameContent = () => {
    switch (game.gameType) {
      case 'html5':
        return (
          <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden border">
            <iframe
              src={game.demoPath}
              className="absolute inset-0 w-full h-full"
              title={`${game.title} Demo`}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
              allow="fullscreen"
            />
          </div>
        );

      case 'video-preview':
        return (
          <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden border bg-black">
            <video
              src={game.videoPreview}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              poster={game.hero}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'download':
        return (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Download Required</h3>
            <p className="text-gray-600 mb-4">
              This game requires a download to play.
              {game.downloadSize && ` (${game.downloadSize})`}
            </p>
            {game.downloadUrl && (
              <a
                href={game.downloadUrl}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                download
              >
                Download Game
              </a>
            )}
          </div>
        );

      case 'ai-powered':
        return (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 text-center border-2 border-purple-200">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-purple-800">AI-Powered Game</h3>
            <p className="text-gray-600 mb-4">
              This game uses AI technology. Each play costs approximately {game.apiCostPerPlay}¢ in API credits.
            </p>
            <button
              onClick={() => handleAIGamePlay()}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Loading...' : 'Play AI Game'}
            </button>
            {error && (
              <p className="text-red-600 mt-2 text-sm">{error}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 rounded-xl p-8 text-center">
            <p className="text-gray-600">Game preview not available.</p>
          </div>
        );
    }
  };

  const handleAIGamePlay = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would integrate with your payment/API system
      const response = await fetch('/api/games/ai-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameSlug: game.slug,
          apiCost: game.apiCostPerPlay 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start AI game');
      }
      
      const { gameUrl, sessionId } = await response.json();
      
      // Redirect to AI game with session tracking
      window.open(`${gameUrl}?session=${sessionId}`, '_blank');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4">Play {game.title}</h2>
      {renderGameContent()}
    </div>
  );
}
