'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '@/lib/games';

// Extended types for vendor-prefixed fullscreen APIs (iOS Safari, older browsers)
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

interface WebkitFullscreenEvents {
  addEventListener(type: 'webkitfullscreenchange', listener: EventListener): void;
  removeEventListener(type: 'webkitfullscreenchange', listener: EventListener): void;
}

interface GamePlayerProps {
  game: Game;
}

export default function GamePlayer({ game }: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isClient = useMemo(() => typeof window !== 'undefined', []);

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

  useEffect(() => {
    if (!isClient) return;
    
    // Listen for fullscreen requests from iframe content
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REQUEST_FULLSCREEN' && event.data?.source === 'happy-birthday-monkey') {
        enterFullscreen();
      }
    };
    window.addEventListener('message', handleMessage);
    
    const onFsChange = () => {
      const fsDoc = document as FullscreenDocument;
      const fsEl = document.fullscreenElement || fsDoc.webkitFullscreenElement || null;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    // iOS Safari vendor-prefixed event (optional at runtime)
    const vendorDoc = document as Document & Partial<WebkitFullscreenEvents>;
    try { vendorDoc.addEventListener?.('webkitfullscreenchange', onFsChange as EventListener); } catch {}
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('fullscreenchange', onFsChange);
      try { vendorDoc.removeEventListener?.('webkitfullscreenchange', onFsChange as EventListener); } catch {}
    };
  }, [isClient]);

  const enterFullscreen = async () => {
    try {
      // Try to fullscreen the iframe first (better for embedded games)
      if (iframeRef.current) {
        const iframe = iframeRef.current as FullscreenElement;
        if (iframe.requestFullscreen) {
          await iframe.requestFullscreen();
          return;
        } else if (iframe.webkitRequestFullscreen) {
          await iframe.webkitRequestFullscreen();
          return;
        }
      }
      
      // Fallback to container fullscreen
      const target = containerRef.current;
      if (!target) return;
      const el = target as FullscreenElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {}
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        const fsDoc = document as FullscreenDocument;
        if (fsDoc.webkitFullscreenElement) {
          fsDoc.webkitExitFullscreen?.();
        }
      }
    } catch {}
  };

  // Handle different game types
  const renderGameContent = () => {
    switch (game.gameType) {
      case 'html5':
        return (
          <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border bg-black fullscreen-target">
            {/* Controls overlay */}
            <div className="absolute left-2 top-2 z-10 flex gap-2">
              {!isFullscreen ? (
                <button onClick={enterFullscreen} className="rounded-md bg-white/10 px-3 py-1 text-xs text-white backdrop-blur hover:bg-white/20 border border-white/20">
                  Fullscreen
                </button>
              ) : (
                <button onClick={exitFullscreen} className="rounded-md bg-white/10 px-3 py-1 text-xs text-white backdrop-blur hover:bg-white/20 border border-white/20">
                  Exit
                </button>
              )}
            </div>

            {/* Viewport container: aspect ratio by default; fills screen in fullscreen via CSS */}
            <div className="relative w-full aspect-video game-viewport">
              <iframe
                ref={iframeRef}
                src={game.demoPath}
                className="absolute inset-0 h-full w-full"
                title={`${game.title} Demo`}
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
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
