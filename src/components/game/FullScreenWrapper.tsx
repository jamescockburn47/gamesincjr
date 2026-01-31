'use client';

import { useRef, useState, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: ReactNode;
  onExit: () => void;
}

export function FullScreenWrapper({ children, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const content = (
    <div 
      ref={containerRef} 
      className="game-fullscreen-wrapper"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647, // Maximum z-index value
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        isolation: 'isolate',
      }}
    >
      {children}
      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 2147483647,
            touchAction: 'manipulation',
          }}
        >
          Exit (ESC)
        </button>
      )}
    </div>
  );

  // Use portal to render at document body level, above everything else
  if (!mounted) return null;
  return createPortal(content, document.body);
}
