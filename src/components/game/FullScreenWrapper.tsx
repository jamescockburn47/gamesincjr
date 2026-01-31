'use client';

import { useRef, useState, useEffect, ReactNode, useCallback } from 'react';

interface Props {
  children: ReactNode;
  onExit: () => void;
}

export function FullScreenWrapper({ children, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = async () => {
    if (containerRef.current) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not supported or denied - use fixed positioning instead
        setIsFullscreen(true);
      }
    }
  };

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    setIsFullscreen(false);
    onExit();
  }, [onExit]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        exitFullscreen();
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen, exitFullscreen]);

  useEffect(() => {
    enterFullscreen();
    // Prevent body scroll on mobile when game is active
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      {children}
      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          className="absolute top-2 right-2 md:top-4 md:right-4 px-3 py-1 md:px-4 md:py-2 bg-red-600 text-white text-sm md:text-base rounded-lg hover:bg-red-700 z-[10000] touch-manipulation"
        >
          Exit (ESC)
        </button>
      )}
    </div>
  );
}
