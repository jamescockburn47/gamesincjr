'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '@/lib/games';
import { useFullscreen } from '@/hooks/useFullscreen';
import { Button } from '@/components/ui/button';
import { Loader2, Maximize2, Minimize2, Play, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface GamePlayerProps {
  game: Game;
}

export default function GamePlayer({ game }: GamePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameContentRef = useRef<HTMLIFrameElement | null>(null);

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const isClient = useMemo(() => typeof window !== 'undefined', []);

  useEffect(() => {
    if (!isPlaying) return;

    // Force loading to finish after 5 seconds max
    const timer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading, isPlaying]);

  useEffect(() => {
    if (!isClient) return;
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, [isClient]);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
  };

  const handleAIGamePlay = async () => {
    setIsLoading(true);
    setError(null);

    try {
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
      window.open(`${gameUrl}?session=${sessionId}`, '_blank');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle different game types
  const renderGameContent = () => {
    switch (game.gameType) {
      case 'html5':
        if (!isPlaying) {
          return (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-2xl group">
              {game.hero && (
                <Image
                  src={game.hero}
                  alt={game.title}
                  fill
                  className="object-cover opacity-80 transition-opacity group-hover:opacity-60"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={handlePlay}
                  className="h-20 px-10 rounded-full text-2xl font-bold bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/50 hover:scale-110 transition-all animate-pulse hover:animate-none"
                >
                  <Play className="w-8 h-8 mr-3 fill-current" />
                  Play Game
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h3 className="text-xl font-bold mb-1">{game.title}</h3>
                <p className="text-sm opacity-80 line-clamp-1">{game.description}</p>
              </div>
            </div>
          );
        }

        return (
          <div ref={containerRef} className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-slate-900 bg-black shadow-2xl fullscreen-target transition-all duration-300">
            {/* Controls overlay */}
            <div className="absolute right-4 top-4 z-20 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleFullscreen}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 rounded-xl"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            </div>

            {/* Game content container */}
            <div className="relative w-full h-full bg-black">
              <iframe
                ref={gameContentRef}
                src={game.demoPath}
                className="absolute inset-0 w-full h-full border-0"
                title={game.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={(e) => {
                  setIsLoading(false);
                  const iframe = e.target as HTMLIFrameElement;
                  try { iframe.contentWindow?.focus(); } catch { }
                }}
                onError={() => setError("Failed to load game iframe")}
              />

              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-10">
                  <Loader2 className="w-12 h-12 animate-spin text-sky-500 mb-4" />
                  <p className="text-lg font-medium text-sky-100 animate-pulse">Loading {game.title}...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 bg-slate-900 p-8 z-10">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium text-center">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-6 border-rose-500/50 text-rose-200 hover:bg-rose-950"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'video-preview':
        return (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-slate-200 bg-black shadow-xl">
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
          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="mb-6 inline-flex p-4 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">Download Required</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              This game requires a download to play.
              {game.downloadSize && <span className="font-semibold text-slate-900"> ({game.downloadSize})</span>}
            </p>
            {game.downloadUrl && (
              <a
                href={game.downloadUrl}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
                download
              >
                Download Game
              </a>
            )}
          </div>
        );

      case 'ai-powered':
        return (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-12 text-center border-2 border-purple-100 shadow-xl">
            <div className="mb-6 inline-flex p-4 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-purple-900">AI-Powered Game</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              This game uses advanced AI technology. Each play costs approximately <span className="font-bold text-purple-700">{game.apiCostPerPlay}¢</span> in API credits.
            </p>
            <Button
              size="lg"
              onClick={() => handleAIGamePlay()}
              disabled={isLoading}
              className="h-14 px-8 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isLoading ? 'Starting Engine...' : 'Play AI Game'}
            </Button>
            {error && (
              <p className="text-rose-600 mt-4 font-medium bg-rose-50 py-2 px-4 rounded-lg inline-block">{error}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-slate-100">
            <p className="text-slate-500 font-medium">Game preview not available.</p>
          </div>
        );
    }
  };

  return (
    <div className="mb-12 w-full max-w-5xl mx-auto">
      {renderGameContent()}
    </div>
  );
}
