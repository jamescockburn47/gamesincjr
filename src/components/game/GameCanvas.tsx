'use client';

import { useEffect, useRef } from 'react';
import { GameEngine } from '@/lib/game-framework/GameEngine';

interface Props {
  GameClass: new () => GameEngine;
  width?: number;
  height?: number;
}

export function GameCanvas({ GameClass, width = 960, height = 540 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new GameClass();
    gameRef.current = game;
    game.start(canvasRef.current);

    return () => {
      game.stop();
    };
  }, [GameClass]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full max-h-full border-2 border-cyan-400"
      />
    </div>
  );
}
