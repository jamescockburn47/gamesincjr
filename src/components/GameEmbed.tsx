'use client';

import { useState } from 'react';

interface GameEmbedProps {
  gamePath: string;
}

/**
 * Embeds a game demo in a sandboxed iframe. Game scripts run inside the
 * frame — never in the parent page.
 */
export default function GameEmbed({ gamePath }: GameEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <iframe
        src={gamePath}
        title="Game"
        className="absolute inset-0 w-full h-full border-0 game-embed-container"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        allow="autoplay; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError('Failed to load game');
        }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading game...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4">
          <p className="text-center">{error}</p>
        </div>
      )}
    </>
  );
}
