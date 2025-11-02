'use client';

import { useEffect, useRef, useState } from 'react';

interface GameEmbedProps {
  gamePath: string;
}

export default function GameEmbed({ gamePath }: GameEmbedProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(gamePath);
        if (!response.ok) {
          throw new Error(`Failed to load game: ${response.status}`);
        }
        
        const gameHtml = await response.text();
        setHtml(gameHtml);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
        console.error('Game load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gamePath]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4">
        <p className="text-center">{error}</p>
      </div>
    );
  }

  if (!html) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
