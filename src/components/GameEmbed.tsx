'use client';

import { useEffect, useRef, useState } from 'react';

interface GameEmbedProps {
  gamePath: string;
}

/**
 * Embeds a standalone HTML game into the current page by fetching
 * the markup from the public demos folder and executing its scripts.
 */
export default function GameEmbed({ gamePath }: GameEmbedProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const loadGame = async () => {
      try {
        setLoading(true);
        setError(null);
        setHtml(null);

        const response = await fetch(gamePath, { signal: abortController.signal, cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`Failed to load game: ${response.status}`);
        }

        const gameHtml = await response.text();
        setHtml(gameHtml);
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load game');
        console.error('Game load error:', err);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadGame();
    return () => {
      abortController.abort();
    };
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
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0 h-full w-full game-embed-container" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            <p className="text-sm">Loading game...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-red-400">
          <p className="text-center">{error}</p>
        </div>
      )}
    </div>
  );
}
