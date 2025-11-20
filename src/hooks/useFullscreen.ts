import { useState, useCallback, useEffect, RefObject } from 'react';

// Extended types for vendor-prefixed fullscreen APIs
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozFullScreenElement?: Element | null;
  mozCancelFullScreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

interface WebkitFullscreenEvents {
  addEventListener(type: 'webkitfullscreenchange', listener: EventListener): void;
  removeEventListener(type: 'webkitfullscreenchange', listener: EventListener): void;
}

export function useFullscreen(elementRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const updateFullscreenState = useCallback(() => {
    const fsDoc = document as FullscreenDocument;
    const fsEl = 
      document.fullscreenElement || 
      fsDoc.webkitFullscreenElement || 
      fsDoc.mozFullScreenElement ||
      fsDoc.msFullscreenElement ||
      null;
    
    setIsFullscreen(!!fsEl);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFsChange = () => updateFullscreenState();

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    
    // iOS Safari vendor-prefixed event
    const vendorDoc = document as Document & Partial<WebkitFullscreenEvents>;
    try { vendorDoc.addEventListener?.('webkitfullscreenchange', handleFsChange as EventListener); } catch {}

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
      try { vendorDoc.removeEventListener?.('webkitfullscreenchange', handleFsChange as EventListener); } catch {}
    };
  }, [updateFullscreenState]);

  const enterFullscreen = useCallback(async () => {
    const el = elementRef.current as FullscreenElement;
    if (!el) return;

    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, [elementRef]);

  const exitFullscreen = useCallback(async () => {
    const fsDoc = document as FullscreenDocument;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (fsDoc.webkitExitFullscreen) await fsDoc.webkitExitFullscreen();
      else if (fsDoc.mozCancelFullScreen) await fsDoc.mozCancelFullScreen();
      else if (fsDoc.msExitFullscreen) await fsDoc.msExitFullscreen();
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
