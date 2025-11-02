'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';

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
      } catch (err) {
        containerRef.current.classList.add('fixed', 'inset-0', 'z-50', 'bg-black');
        setIsFullscreen(true);
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      containerRef.current?.classList.remove('fixed', 'inset-0', 'z-50', 'bg-black');
    }
    setIsFullscreen(false);
    onExit();
  };

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
  }, [isFullscreen]);

  useEffect(() => {
    enterFullscreen();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black">
      {children}
      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 z-50"
        >
          Exit (ESC)
        </button>
      )}
    </div>
  );
}
