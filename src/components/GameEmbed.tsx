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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    if (!html) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();

    const headNodes = doc.head ? Array.from(doc.head.children) : [];
    headNodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (tag === 'style' || (tag === 'link' && (node as HTMLLinkElement).rel === 'stylesheet')) {
        fragment.appendChild(node.cloneNode(true));
      }
    });

    const bodyNodes = doc.body ? Array.from(doc.body.childNodes) : [];
    bodyNodes.forEach((node) => {
      fragment.appendChild(node.cloneNode(true));
    });

    container.appendChild(fragment);

    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });

    return () => {
      container.innerHTML = '';
    };
  }, [html]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 w-full h-full game-embed-container" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
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
